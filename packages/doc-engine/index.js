'use strict';

/**
 * Motore condiviso per la generazione dei documenti delle certificazioni.
 *
 * Non contiene testo di documento ne' percorsi: tutto arriva da `config`
 * (script/config.js della certificazione). Il flusso e':
 *   .md  ->  parser  ->  elementi docx  ->  Document  ->  .docx  ->  .pdf
 *
 * ATTENZIONE — l'invariante del monorepo: questo package NON deve mai contenere
 * `path.join(__dirname, '..')`. Qui `__dirname` e' la cartella del package, non
 * quella della certificazione: risolverebbe i percorsi sbagliati. La radice la
 * calcola `script/config.js` di ogni certificazione (dove `__dirname` e' ancora
 * `.../<CERT>/script/`) e la passa come `config.root`; questo file la valida, e
 * chapters/, img/, pocketguide/ e l'output si derivano da li' e da nient'altro.
 */

const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');

const { buildTheme } = require('./theme');
const { createImages } = require('./images');
const { createRender } = require('./render');
const { parseModule } = require('./parser');
const { buildSommario, pageBreak, assembleDocument } = require('./document');
const { exportToPdf } = require('./pdf');
const { parseArgs } = require('./cli');

/** Valida la configurazione in ingresso, fallendo in modo esplicito. */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Configurazione assente: passare l\'oggetto esportato da script/config.js');
  }
  const { id, root } = config;
  if (!id) throw new Error('config.id mancante (es. "AZ-104")');
  if (!root || !path.isAbsolute(root)) {
    throw new Error(
      `config.root deve essere il percorso ASSOLUTO della cartella della certificazione ` +
      `(ricevuto: ${JSON.stringify(root)}). In script/config.js usare ` +
      `path.resolve(__dirname, '..')`
    );
  }
  if (!fs.existsSync(root)) throw new Error(`config.root non esiste: ${root}`);
  if (!config.deliverables || !Object.keys(config.deliverables).length) {
    throw new Error('config.deliverables vuoto: serve almeno un deliverable');
  }
  if (!config.deliverables[config.defaultDeliverable]) {
    throw new Error(`config.defaultDeliverable "${config.defaultDeliverable}" non esiste in config.deliverables`);
  }
  return config;
}

/** Elenco dei file sorgente, in ordine di documento. */
function resolveSources(root, source) {
  const dir = path.join(root, source.dir);
  if (source.all) {
    // Tutti i .md della cartella, in ordine di nome: e' per questo che i file hanno
    // il prefisso numerico (01-..., 02-...). Aggiungere un capitolo = aggiungere un file.
    if (!fs.existsSync(dir)) throw new Error(`cartella sorgente non trovata: ${dir}`);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    files.sort();
    return files.map(f => path.join(dir, f));
  }
  return Array.from({ length: source.count }, (_, k) => path.join(dir, source.file(k + 1)));
}

async function build(config) {
  validateConfig(config);
  const { deliverable, mode, n, pdf } = parseArgs(config);
  const d = config.deliverables[deliverable];

  const modeLabel = mode === 'toc' ? 'solo sommario'
    : mode === 'module' ? `solo ${(d.moduleLabels && d.moduleLabels[n]) || 'Modulo ' + n}`
    : d.label;
  console.log(`Costruzione ${config.banner || config.id} — ${modeLabel}...`);

  const theme = buildTheme(config.palette, config.theme);
  const images = createImages(path.join(config.root, 'img'));
  const R = createRender(theme, images);

  const sources = resolveSources(config.root, d.source);

  // Si parsificano TUTTI i sorgenti, in ordine di documento, anche con --module N
  // o --toc. Non e' spreco: i contatori di figure e tabelle attraversano i moduli,
  // quindi un singolo modulo estratto conserva la numerazione del documento completo.
  // NON "ottimizzare" saltando i sorgenti non richiesti: i numeri cambierebbero.
  const counters = { fig: 0, tbl: 0 };
  const ctx = { render: R, images, tables: config.tables || {}, theme, counters, figures: d.figures };

  const parsed = [];
  let missing = 0, h2Tot = 0, h3Tot = 0;
  for (const p of sources) {
    const name = path.basename(p);
    if (!fs.existsSync(p)) {
      console.error(`  [ERRORE] sorgente mancante: ${name}`);
      parsed.push(null); missing++; continue;
    }
    try {
      const r = parseModule(fs.readFileSync(p, 'utf8'), { ...ctx, name });
      parsed.push(r); h2Tot += r.h2Count; h3Tot += r.h3Count;
    } catch (e) {
      console.error(`  [ERRORE] parsing ${name}: ${e.message}`);
      parsed.push(null); missing++;
    }
  }

  // Guardia contro le intestazioni spurie: se un refactoring rompesse la fence-awareness
  // del parser, questi totali esploderebbero (ci sono ~140 righe "#" dentro i blocchi di
  // codice) e la cosa salterebbe all'occhio subito.
  console.log(`Sorgenti: ${sources.length} — intestazioni: ${h2Tot} h2, ${h3Tot} h3, ${counters.fig} figure, ${counters.tbl} tabelle`);

  if (mode === 'module' && !parsed[n - 1]) {
    console.error(`Modulo ${n} non trovato o non parsabile`);
    process.exit(1);
  }
  // In modalita' completa un sorgente mancante falserebbe il documento (e la numerazione
  // delle figure): meglio fallire che produrre in silenzio un documento incompleto.
  if (mode === 'full' && missing) {
    console.error(`${missing} sorgente/i non utilizzabile/i: documento non generato.`);
    process.exit(1);
  }

  // Sezione 1: copertina + Sommario. Il deliverable puo' sovrascrivere parte della copertina.
  const cover = { ...config.cover, ...(d.cover || {}) };
  const frontMatter = [...R.coverPage(cover), ...buildSommario(R)];

  // Sezione 2: corpo. Interruzione di pagina fra un modulo e l'altro.
  const content = [];
  if (mode === 'module') {
    content.push(...parsed[n - 1].elements);
  } else if (mode === 'full') {
    let first = true;
    for (const r of parsed) if (r) {
      if (!first) content.push(pageBreak(R));
      content.push(...r.elements);
      first = false;
    }
  }

  const doc = assembleDocument(theme, R, frontMatter, content);
  const buffer = await Packer.toBuffer(doc);
  const outName = mode === 'toc' ? d.output.toc
    : mode === 'module' ? d.output.module(n)
    : d.output.full;
  const outPath = path.join(config.root, outName);   // output nella cartella della certificazione
  fs.writeFileSync(outPath, buffer);
  console.log('Documento salvato: ' + outName);
  console.log('Dimensione: ' + (buffer.length / 1024).toFixed(1) + ' KB');

  // Esporta anche in PDF (default attivo; --no-pdf per saltarlo).
  if (pdf) exportToPdf(outPath);
  return outPath;
}

module.exports = build;
module.exports.build = build;
module.exports.validateConfig = validateConfig;
module.exports.resolveSources = resolveSources;
