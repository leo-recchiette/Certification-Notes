'use strict';

/**
 * Argomenti da riga di comando, derivati DALLA CONFIGURAZIONE.
 *
 * Quali flag sono legali non e' scritto qui: si deduce dai `deliverables`. Un
 * deliverable che non dichiara `output.module` non accetta --module. Cosi' aggiungere
 * una variante (una pocket guide, un quaderno di quiz...) non richiede nessun `if`
 * nel motore.
 *
 * I flag sconosciuti vengono RIFIUTATI invece di passare in silenzio. Fra questi c'e'
 * il vecchio --toc ("solo copertina + Sommario"), rimosso: dal passaggio al campo TOC
 * nativo quel documento non conteneva intestazioni, quindi il suo Sommario usciva
 * sempre vuoto. Il Sommario e' nelle prime pagine del documento completo.
 */

function deliverableFlags(config) {
  const out = {};
  for (const [key, d] of Object.entries(config.deliverables)) {
    if (d.flag) out[d.flag] = key;
  }
  return out;
}

function usage(config) {
  const script = `docs/.../script/create_${config.id.toLowerCase().replace('-', '')}.js`;
  const lines = [`${config.id} — generatore del documento`, '', `Uso: node ${script} [opzioni]`, '', 'Deliverable:'];
  for (const [key, d] of Object.entries(config.deliverables)) {
    const sel = d.flag ? d.flag : '(predefinito)';
    lines.push(`  ${sel.padEnd(14)} ${d.label} -> ${d.output.full}`);
  }
  lines.push('', 'Modalita\':');
  for (const [key, d] of Object.entries(config.deliverables)) {
    const where = d.flag ? ` (con ${d.flag})` : '';
    if (d.output.module) lines.push(`  --module N     solo il modulo N (1-${d.source.count}) -> ${d.output.module('N')}${where}`);
  }
  lines.push('', 'Altre opzioni:', '  --no-pdf       non esportare il PDF dopo il .docx',
    '  --help         questo messaggio');
  return lines.join('\n');
}

function parseArgs(config, argv = process.argv.slice(2)) {
  const flags = deliverableFlags(config);
  const known = new Set(['--no-pdf', '--help', '-h', '--module', ...Object.keys(flags)]);

  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(usage(config));
    process.exit(0);
  }

  // Flag sconosciuti: errore esplicito (il valore di --module non e' un flag).
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--module') { i++; continue; }
    if (a.startsWith('-') && !known.has(a)) {
      console.error(`Errore: opzione sconosciuta "${a}"\n\n${usage(config)}`);
      process.exit(1);
    }
  }

  const pdf = !argv.includes('--no-pdf');   // di default, dopo il .docx esporta anche il PDF

  // Quale deliverable
  const selected = Object.keys(flags).filter(f => argv.includes(f));
  if (selected.length > 1) {
    console.error(`Errore: ${selected.join(' e ')} sono alternativi, non usarli insieme`);
    process.exit(1);
  }
  const key = selected.length ? flags[selected[0]] : config.defaultDeliverable;
  const d = config.deliverables[key];
  if (!d) { console.error(`Errore: deliverable "${key}" non definito in config.deliverables`); process.exit(1); }

  // Quale modalita'
  const mi = argv.indexOf('--module');
  if (mi !== -1) {
    if (!d.output.module) {
      console.error(`Errore: --module non e' disponibile per "${d.label}" (non ha moduli numerati)`);
      process.exit(1);
    }
    const n = parseInt(argv[mi + 1], 10);
    if (isNaN(n) || n < 1 || n > d.source.count) {
      console.error(`Errore: --module accetta un numero da 1 a ${d.source.count}`);
      process.exit(1);
    }
    return { deliverable: key, mode: 'module', n, pdf };
  }

  return { deliverable: key, mode: 'full', pdf };
}

module.exports = { parseArgs, usage, deliverableFlags };
