#!/usr/bin/env node
'use strict';

/**
 * Verifica di un PDF prodotto dal motore: Sommario, numeri di pagina e font.
 *
 * I valori ATTESI si leggono dal .docx (la sorgente), non dal PDF: si controlla che
 * il PDF dica la verita' sul documento, non che sia coerente con se stesso.
 *
 *   1. Sommario: tante voci quante sono le intestazioni del .docx, con gli stessi
 *      titoli nello stesso ordine, e numeri di pagina non decrescenti.
 *   2. Numeri di pagina: le pagine della sezione 1 (copertina + Sommario) non hanno
 *      numero, poi i numeri stampati nel pie' di pagina vanno da 1 a K senza buchi;
 *      nessuna pagina bianca.
 *   3. Ogni voce del Sommario rimanda a una pagina in cui l'intestazione compare davvero.
 *   4. Font: tutti incorporati; presenti Carlito (al posto di Calibri) e, se il
 *      documento ha codice, Liberation Mono (al posto di Courier New); nessun font
 *      fuori dalla lista ammessa. LiberationSans significa Calibri non mappato.
 *
 * Uso:  npm run check:pdf                      -> ogni .docx generato in docs/ che ha un .pdf accanto
 *       npm run check:pdf -- a.docx b.docx     -> solo quelli (il .pdf e' quello con lo stesso nome)
 * Esce con 1 se almeno un PDF non supera il controllo.
 *
 * Richiede pdftotext e pdffonts (poppler-utils), presenti nell'immagine Docker.
 *
 * Questo controllo e' stato visto FALLIRE sul vecchio `soffice --convert-to` (Sommario
 * con 0 voci) prima di essere visto passare con l'export via UNO: un verde di cui ci si
 * puo' fidare.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const JSZip = require('jszip');

const FONT_ALLOW = [/^Carlito/, /^LiberationMono/, /^DejaVuSans/, /^OpenSymbol/];

// ─── lettura del .docx ────────────────────────────────────────────────────────
const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const unescapeXml = s => s.replace(/&(amp|lt|gt|quot|apos);/g, m => ENT[m]);

async function expectedFromDocx(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const xml = await zip.file('word/document.xml').async('string');
  const paras = xml.match(/<w:p\b(?:[^>]*\/>|[^>]*>[\s\S]*?<\/w:p>)/g) || [];
  const headings = [];
  for (const p of paras) {
    const lvl = p.match(/<w:outlineLvl w:val="(\d+)"\/>/);
    if (!lvl) continue;
    let text = '';
    for (const m of p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)) text += unescapeXml(m[1]);
    headings.push({ level: Number(lvl[1]), text });
  }
  return { headings, hasCode: /w:ascii="Courier New"/.test(xml) };
}

// ─── lettura del PDF ──────────────────────────────────────────────────────────
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const pagesOf = text => { const p = text.split('\f'); if (p[p.length - 1].trim() === '') p.pop(); return p; };

/** Normalizzazione per i confronti: NFC, legature, niente spazi, minuscole. */
const norm = s => s.normalize('NFC').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
  .replace(/\s+/g, '').toLowerCase();

function readPdf(file) {
  const pages = pagesOf(run('pdftotext', ['-layout', file, '-']));
  // Il numero stampato nel pie' di pagina e' sempre la riga piu' in basso della pagina:
  // nessun contenuto puo' stare sotto il footer. Leggerlo cosi' non richiede di
  // calibrare un ritaglio geometrico, che catturerebbe anche le ultime righe del corpo.
  const printed = pages.map(t => {
    const lines = t.split('\n').map(l => l.trim()).filter(Boolean);
    const m = (lines[lines.length - 1] || '').match(/^(\d+)$/);
    return m ? Number(m[1]) : null;
  });
  return { pages, printed };
}

/**
 * Voci del Sommario dalle pagine della sezione 1, dopo il titolo "Sommario". Un titolo
 * lungo va a capo: si accumulano righe finche' una non termina con dot leader + numero.
 */
function tocEntries(frontPages) {
  const lines = frontPages.join('\n').split('\n');
  const start = lines.findIndex(l => l.trim() === 'Sommario');
  const entries = [];
  let acc = '';
  for (const raw of lines.slice(start + 1)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(.*?)\s*(?:[.·…]\s*){2,}\s*(\d+)$/) || line.match(/^(.*\S)\s{2,}(\d+)$/);
    if (m) {
      entries.push({ title: (acc + ' ' + m[1]).trim(), page: Number(m[2]) });
      acc = '';
    } else {
      acc += ' ' + line;
    }
  }
  return entries;
}

function readFonts(file) {
  return run('pdffonts', [file]).split('\n').slice(2).filter(Boolean).map(l => {
    const m = l.match(/^(\S+)\s+.*?\s(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/);
    return m ? { name: m[1].replace(/^[A-Z]{6}\+/, ''), emb: m[2] === 'yes' } : null;
  }).filter(Boolean);
}

// ─── verifica ─────────────────────────────────────────────────────────────────
async function checkOne(docxFile, pdfFile) {
  const { headings, hasCode } = await expectedFromDocx(docxFile);
  const { pages, printed } = readPdf(pdfFile);
  const errors = [];
  const fail = (msg) => errors.push(msg);

  // 2. numeri di pagina
  const front = printed.findIndex(n => n !== null);
  if (front < 1) fail(`nessuna pagina senza numero all'inizio (copertina + Sommario): front=${front}`);
  const body = printed.slice(front);
  const gaps = body.map((n, i) => (n === i + 1 ? null : `pag. fisica ${front + i + 1}: stampato ${n}, atteso ${i + 1}`)).filter(Boolean);
  if (gaps.length) fail(`numerazione del corpo non contigua (${gaps.length}): ${gaps.slice(0, 3).join('; ')}`);
  const blank = pages.map((t, i) => (t.trim() === '' ? i + 1 : null)).filter(Boolean);
  if (blank.length) fail(`pagine bianche: ${blank.slice(0, 10).join(', ')}`);
  const pageByNumber = new Map();
  printed.forEach((n, i) => { if (n !== null && !pageByNumber.has(n)) pageByNumber.set(n, norm(pages[i])); });

  // 1. Sommario
  const entries = front > 0 ? tocEntries(pages.slice(0, front)) : [];
  if (entries.length !== headings.length) {
    fail(`voci del Sommario: ${entries.length}, intestazioni nel .docx: ${headings.length}`);
  }
  const n = Math.min(entries.length, headings.length);
  const wrongTitle = [];
  for (let i = 0; i < n; i++) {
    if (norm(entries[i].title) !== norm(headings[i].text)) wrongTitle.push(`#${i + 1} "${entries[i].title}" ≠ "${headings[i].text}"`);
  }
  if (wrongTitle.length) fail(`titoli diversi (${wrongTitle.length}): ${wrongTitle.slice(0, 3).join('; ')}`);
  const decreasing = entries.filter((e, i) => i > 0 && e.page < entries[i - 1].page);
  if (decreasing.length) fail(`numeri di pagina decrescenti nel Sommario: ${decreasing.length}`);

  // 3. ogni voce punta a una pagina che contiene l'intestazione
  const wrongPage = [];
  const offsets = new Map();
  for (const e of entries) {
    const text = pageByNumber.get(e.page);
    if (text && text.includes(norm(e.title))) continue;
    wrongPage.push(`"${e.title}" -> ${e.page}`);
    // diagnostica: su quale pagina stampata compare davvero?
    for (const [num, t] of pageByNumber) if (t.includes(norm(e.title))) {
      const d = num - e.page; offsets.set(d, (offsets.get(d) || 0) + 1); break;
    }
  }
  if (wrongPage.length) {
    const hint = offsets.size === 1 ? ` — sfasamento costante di ${[...offsets.keys()][0]} pagine` : '';
    fail(`voci che puntano alla pagina sbagliata: ${wrongPage.length}/${entries.length}${hint}: ${wrongPage.slice(0, 3).join('; ')}`);
  }

  // 4. font
  const fonts = readFonts(pdfFile);
  const names = [...new Set(fonts.map(f => f.name))].sort();
  const notEmbedded = fonts.filter(f => !f.emb).map(f => f.name);
  const outside = names.filter(nm => !FONT_ALLOW.some(re => re.test(nm)));
  if (notEmbedded.length) fail(`font non incorporati: ${[...new Set(notEmbedded)].join(', ')}`);
  if (outside.length) fail(`font fuori dalla lista ammessa: ${outside.join(', ')}`);
  if (!names.some(nm => /^Carlito/.test(nm))) fail('Carlito assente: Calibri non e\' stato sostituito');
  if (hasCode && !names.some(nm => /^LiberationMono/.test(nm))) fail('Liberation Mono assente: Courier New non e\' stato sostituito');

  // ─── esito ──────────────────────────────────────────────────────────────────
  const bodyPages = body.length;
  console.log(`${pdfFile.split('/').pop()}: ${pages.length} pagine (${front} iniziali + ${bodyPages} numerate), ` +
    `${entries.length}/${headings.length} voci di Sommario, font: ${names.join(', ')}`);
  if (errors.length) {
    for (const e of errors) console.log(`  ✗ ${e}`);
    return false;
  }
  console.log('  ✓ Sommario, numeri di pagina e font corretti');
  return true;
}

/** Senza argomenti: tutti i .docx generati nelle cartelle delle certificazioni. */
function defaultTargets() {
  const out = [];
  for (const prov of fs.readdirSync('docs', { withFileTypes: true })) {
    if (!prov.isDirectory()) continue;
    for (const cert of fs.readdirSync(path.join('docs', prov.name), { withFileTypes: true })) {
      if (!cert.isDirectory()) continue;
      const dir = path.join('docs', prov.name, cert.name);
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.docx')) out.push(path.join(dir, f));
    }
  }
  return out.sort();
}

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length ? args : defaultTargets();
  if (!targets.length) { console.error('Nessun .docx da controllare: genera prima i documenti.'); process.exit(2); }
  let failed = 0;
  for (const docx of targets) {
    const pdf = docx.replace(/\.docx$/i, '.pdf');
    if (!fs.existsSync(pdf)) { console.log(`${path.basename(docx)}: ✗ manca ${path.basename(pdf)}`); failed++; continue; }
    if (!(await checkOne(docx, pdf))) failed++;
  }
  console.log(failed ? `\n${failed}/${targets.length} PDF non superano il controllo` : `\nTutti i ${targets.length} PDF superano il controllo`);
  process.exit(failed ? 1 : 0);
}

main().catch(err => { console.error(err.message); process.exit(2); });
