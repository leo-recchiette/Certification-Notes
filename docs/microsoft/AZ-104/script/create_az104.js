'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// AZ-104 (Amministratore di Microsoft Azure) — generatore del documento Word
// (.docx) + PDF.
//
// Tutta la logica sta nel motore condiviso @certification-notes/doc-engine;
// tutto cio' che e' specifico di questa certificazione sta in ./config.js
// (e le tabelle generate da codice in ./tables.js). Il contenuto sta nei
// chapters/MODULE_*.md: per aggiornare il documento si modifica il .md e si
// rigenera. Opzioni: --help
// ─────────────────────────────────────────────────────────────────────────────
let build;
try {
  build = require('@certification-notes/doc-engine');
} catch (e) {
  console.error('Motore non trovato: esegui `npm install` dalla radice del repository.');
  process.exit(1);
}
build(require('./config')).catch(err => { console.error(err); process.exit(1); });
