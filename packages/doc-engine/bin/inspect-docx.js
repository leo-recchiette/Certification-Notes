#!/usr/bin/env node
'use strict';

/**
 * Ispettore .docx per la verifica di regressione del motore.
 *
 * Perche' esiste: NON si possono confrontare i byte di due .docx, nemmeno il loro
 * md5. La libreria `docx` genera gli id delle relazioni con nanoid e lo zip porta
 * i timestamp, quindi due run dello STESSO codice producono file diversi. Si
 * confronta invece il contenuto estratto, in quattro dump di testo:
 *
 *   <nome>.counts.txt    metriche strutturali (paragrafi, tabelle, immagini, outlineLvl)
 *   <nome>.spine.txt     la sequenza degli heading con il loro livello = la struttura
 *   <nome>.text.txt      un paragrafo per riga, senza formattazione  <-- il file su cui fare diff
 *   <nome>.captions.txt  solo le didascalie, per controllare la numerazione a vista
 *
 * `text.txt` e' quello che distingue "impaginazione cambiata" (atteso, quando AZ-104
 * adotta il motore) da "contenuto cambiato" (bug): ignora giustificazione, larghezze
 * di colonna, keepNext e dimensioni dei font.
 *
 * Uso:  node packages/doc-engine/bin/inspect-docx.js [--out DIR] file1.docx [file2.docx ...]
 *
 * jszip non va installato: e' gia' dipendenza transitiva di `docx`.
 */

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const ENT = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" };
const unescapeXml = s => s.replace(/&(amp|lt|gt|quot|apos);/g, m => ENT[m]);

/** Testo di un paragrafo: concatena i <w:t>, con i <w:tab/> resi come tab. */
function paraText(xml) {
  let out = '';
  const re = /<w:tab\/>|<w:br\/>|<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[0] === '<w:tab/>') out += '\t';
    else if (m[0] === '<w:br/>') out += ' ';
    else out += unescapeXml(m[1]);
  }
  return out;
}

/** Livello di outline del paragrafo, o null se non e' un heading. */
function paraOutline(xml) {
  const m = xml.match(/<w:outlineLvl w:val="(\d+)"\/>/);
  return m ? Number(m[1]) : null;
}

const countOf = (xml, re) => (xml.match(re) || []).length;

async function inspect(file, outDir) {
  const buf = fs.readFileSync(file);
  const zip = await JSZip.loadAsync(buf);

  const docEntry = zip.file('word/document.xml');
  if (!docEntry) throw new Error(`${file}: manca word/document.xml`);
  const xml = await docEntry.async('string');

  // --- paragrafi (inclusi quelli dentro le tabelle), in ordine di documento ---
  const paras = xml.match(/<w:p\b(?:[^>]*\/>|[^>]*>[\s\S]*?<\/w:p>)/g) || [];

  const textLines = [];
  const spineLines = [];
  const captionLines = [];
  const outlineCount = {};

  for (const p of paras) {
    const t = paraText(p);
    textLines.push(t);
    const lvl = paraOutline(p);
    if (lvl !== null) {
      outlineCount[lvl] = (outlineCount[lvl] || 0) + 1;
      spineLines.push(`[${lvl}] ${t}`);
    }
    if (/^(Figura|Tabella)\s+\d+/.test(t)) captionLines.push(t);
  }

  // --- media incorporati (il nome del file e' l'hash del contenuto: e' un'impronta) ---
  const media = Object.keys(zip.files)
    .filter(n => n.startsWith('word/media/') && !zip.files[n].dir)
    .sort()
    .map(n => `${n}  ${zip.files[n]._data ? zip.files[n]._data.uncompressedSize : '?'} byte`);

  // --- campi: il TOC sta in document.xml, i numeri di pagina nei footer ---
  const instr = xml.match(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g) || [];
  const tocFields = instr.filter(s => /\bTOC\b/.test(s)).length;

  const footerNames = Object.keys(zip.files)
    .filter(n => /^word\/footer\d*\.xml$/.test(n))
    .sort();
  let pageFields = 0;
  for (const fn of footerNames) {
    const fx = await zip.file(fn).async('string');
    pageFields += ((fx.match(/<w:instrText[^>]*>[\s\S]*?<\/w:instrText>/g) || [])
      .filter(s => /\bPAGE\b/.test(s)).length);
  }

  // NB: la dimensione in byte del .docx NON va in questo dump — varia di qualche byte
  // fra due run identici (nanoid negli id delle relazioni + timestamp dello zip) e
  // renderebbe il confronto inutilizzabile. Viene solo stampata a schermo.
  const counts = [
    `file                 ${path.basename(file)}`,
    `w:p   (paragrafi)    ${paras.length}`,
    `w:tbl (tabelle)      ${countOf(xml, /<w:tbl>/g)}`,
    `w:tr  (righe)        ${countOf(xml, /<w:tr\b/g)}`,
    `w:tc  (celle)        ${countOf(xml, /<w:tc>/g)}`,
    `a:blip (immagini)    ${countOf(xml, /<a:blip\b/g)}`,
    `w:hyperlink          ${countOf(xml, /<w:hyperlink\b/g)}`,
    `campi TOC            ${tocFields}`,
    `footer               ${footerNames.length}`,
    `campi PAGE (footer)  ${pageFields}`,
    ...Object.keys(outlineCount).sort().map(l => `outlineLvl ${l}         ${outlineCount[l]}`),
    `media                ${media.length}`,
    ...media.map(m => `  ${m}`),
  ].join('\n');

  const base = path.join(outDir, path.basename(file, '.docx'));
  fs.writeFileSync(`${base}.counts.txt`, counts + '\n');
  fs.writeFileSync(`${base}.spine.txt`, spineLines.join('\n') + '\n');
  fs.writeFileSync(`${base}.text.txt`, textLines.join('\n') + '\n');
  fs.writeFileSync(`${base}.captions.txt`, captionLines.join('\n') + '\n');

  console.log(
    `${path.basename(file)}: ${paras.length} par, ` +
    `${countOf(xml, /<w:tbl>/g)} tab, ${countOf(xml, /<a:blip\b/g)} img, ` +
    `${spineLines.length} heading, ${captionLines.length} didascalie, ` +
    `${(buf.length / 1024).toFixed(1)} KB -> ${base}.*.txt`
  );
}

async function main() {
  const args = process.argv.slice(2);
  let outDir = '.';
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') { outDir = args[++i]; continue; }
    files.push(args[i]);
  }
  if (!files.length) {
    console.error('Uso: inspect-docx.js [--out DIR] file.docx [...]');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) await inspect(f, outDir);
}

main().catch(err => { console.error(err.message); process.exit(1); });
