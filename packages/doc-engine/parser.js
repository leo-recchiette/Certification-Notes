'use strict';

const { splitTag, stripStars, inlineRaw, inlineText, linkParts } = require('./inline');

// Numero di figura/tabella eventualmente già scritto a mano nella didascalia del .md.
// Viene RIMOSSO e sostituito da quello calcolato dal motore: così la numerazione è
// idempotente e funziona identica prima e dopo la migrazione dei .md.
const RE_FIGNO = /^(?:Figura|Tabella)\s+\d+\s*[—–-]\s*/;

/**
 * Parser Markdown -> elementi docx. Macchina a stati riga per riga.
 *
 * ATTENZIONE, due invarianti da non rompere:
 *
 * 1) E' FENCE-AWARE PER COSTRUZIONE. Il ramo ``` consuma le righe fino alla chiusura
 *    con un while interno, quindi le righe che iniziano con # dentro un blocco di
 *    codice non raggiungono mai i rami delle intestazioni. Non e' un dettaglio: nei
 *    .md ci sono ~140 righe `#`/`##` dentro i fence (commenti HCL/bash, es.
 *    docs/hashicorp/TA-004/chapters/MODULE_7.md:86 e MODULE_4.md:3054). Classificare
 *    le righe indipendentemente dallo stato produrrebbe ~140 intestazioni spurie e
 *    altrettante voci di Sommario. Non riorganizzare l'ordine dei rami.
 *
 * 2) IL LIVELLO DI STRUTTURA DERIVA DAL NUMERO DI #, non dalla numerazione del
 *    titolo: # -> livello 0, ## -> 1, ### -> 2. La convenzione editoriale
 *    "## N.M — Titolo" NON e' un contratto del parser: e' per questo che la pocket
 *    guide, che usa titoli liberi, si genera con lo stesso parser senza modifiche.
 *    Non introdurre regex di numerazione.
 *
 * ctx: { render, images, tables, counters:{fig,tbl}, figures:{enabled,figureLabel,tableLabel}, name }
 */
function parseModule(md, ctx) {
  const R = ctx.render;
  const { counters } = ctx;
  const figCfg = ctx.figures || {};
  const figuresOn = figCfg.enabled !== false;
  const FIG_LABEL = figCfg.figureLabel || 'Figura';
  const TBL_LABEL = figCfg.tableLabel || 'Tabella';

  // Numerazione automatica: il contatore vive nel contesto del DOCUMENTO e attraversa
  // i moduli, quindi i numeri corrono continui. Incrementa solo quando una didascalia
  // viene davvero emessa: una figura/tabella senza didascalia non consuma un numero.
  const numbered = (kind, text) => {
    if (!figuresOn) return text;
    const clean = text.replace(RE_FIGNO, '');
    const n = ++counters[kind];
    return `${kind === 'fig' ? FIG_LABEL : TBL_LABEL} ${n} — ${clean}`;
  };

  if (md.charCodeAt(0) === 0xFEFF) {
    md = md.slice(1);   // rimuovi eventuale BOM UTF-8
    console.warn(`  [WARN] BOM rimosso in ${ctx.name}: salva il file in UTF-8 senza BOM`);
  }
  const L = md.split(/\r?\n/);
  const N = L.length;
  const elements = [];
  let title = '';
  let i = 0;
  let h2Count = 0, h3Count = 0;

  const peekNonBlank = (j) => { while (j < N && L[j].trim() === '') j++; return j; };

  // --- Preambolo: titolo (# ...) + intro (_..._) ---
  // NB: questa ricerca NON e' fence-aware (prende la prima riga "# " del file). Va bene
  // perche' in tutti i sorgenti la riga 1 e' l'h1; non "generalizzare" questo ciclo.
  while (i < N && !/^#\s+/.test(L[i])) i++;
  if (i < N) {
    if (i > 4) console.warn(`  [WARN] ${ctx.name}: titolo "# ..." trovato solo alla riga ${i + 1}`);
    title = L[i].replace(/^#\s+/, '').replace(/^Modulo\s+\d+\s*[—–-]\s*/, '').trim();
    i++;
  } else {
    i = 0;   // nessun titolo h1 trovato: interpreta dall'inizio
  }
  elements.push(R.moduloTitle(title));
  i = peekNonBlank(i);
  if (i < N && /^_/.test(L[i].trim()) && !/^#/.test(L[i])) {
    const introLines = [];
    while (i < N && L[i].trim() !== '') { introLines.push(L[i].trim()); i++; }
    const intro = inlineText(introLines.join(' ').replace(/^_/, '').replace(/_$/, ''));
    if (intro) elements.push(R.moduloIntro(intro));
  }

  // --- Corpo ---
  let buf = [];
  let leadIn = null;   // ultimo body/bullet emesso: { idx, kind, make } per agganciarlo al blocco seguente
  const flush = () => {
    if (!buf.length) return;
    const raw = buf.join(' ').trim();
    const lead = raw.match(/^\*\*([^*]+)\*\*(.*)$/);   // etichetta iniziale in grassetto
    if (lead) {
      const label = inlineText(lead[1]), rest = inlineRaw(lead[2]).replace(/\s+$/, '');
      elements.push(R.bodyLead(label, rest));
      leadIn = { idx: elements.length - 1, kind: 'body', make: () => R.bodyLead(label, rest, { keepNext: true }) };
      buf = [];
      return;
    }
    const t = inlineText(raw);
    if (t) { elements.push(R.body(t)); leadIn = { idx: elements.length - 1, kind: 'body', make: () => R.body(t, {}, { keepNext: true }) }; }
    buf = [];
  };
  // Aggancia (keepNext) l'ultimo body/bullet al blocco che segue, se e' ancora l'ultimo elemento
  // emesso: cosi' la frase/voce introduttiva non resta separata dal blocco a fine pagina, anche
  // quando nel sorgente c'e' una riga vuota in mezzo (le righe vuote non emettono paragrafi).
  const glueLeadIn = (kinds) => {
    if (leadIn && leadIn.idx === elements.length - 1 && kinds.includes(leadIn.kind)) elements[leadIn.idx] = leadIn.make();
  };
  // Didascalia che segue una tabella: solo *corsivo* o marcatore esplicito.
  // Un **titolo** _(stepTitle)_ NON e' una didascalia.
  const captionAt = (j) => {
    if (j >= N) return null;
    const st = splitTag(L[j].trim());
    const is = st.tag === 'caption' || (!st.tag && /^\*[^*].*\*$/.test(st.text));
    return is ? st : null;
  };
  let skipManifest = false;

  while (i < N) {
    const raw = L[i];
    const line = raw.trim();

    // Salta il manifest "Immagini usate in questo modulo:" fino al ---
    if (skipManifest) { if (/^---+$/.test(line)) skipManifest = false; i++; continue; }
    if (/^\*\*Immagini usate/.test(line)) { flush(); skipManifest = true; i++; continue; }

    if (line === '') { flush(); i++; continue; }
    if (/^---+$/.test(line)) { flush(); i++; continue; }
    if (/^_\([^)]*\)_$/.test(line)) { i++; continue; }   // marker standalone (es. _(h2: ...)_)

    let m;
    // Intestazioni
    if ((m = line.match(/^###\s+(.+)$/))) {
      flush(); elements.push(R.h3(inlineText(splitTag(m[1]).text))); h3Count++; i++; continue;
    }
    if ((m = line.match(/^##\s+(.+)$/))) {
      flush(); elements.push(R.h2(inlineText(splitTag(m[1]).text))); h2Count++; i++; continue;
    }
    if (/^#\s+/.test(line)) { i++; continue; }   // eventuale altro h1

    // Immagine
    if ((m = line.match(/^!\[[^\]]*\]\(([^)]+)\)/))) {
      flush();   // niente glueLeadIn: il paragrafo introduttivo NON va saldato all'immagine,
                 // altrimenti una figura alta trascina giu' anche testo che starebbe nella pagina prima.
      const imgPath = m[1].trim();
      const dim = line.match(/(\d+)\s*[×x]\s*(\d+)\s*px/);
      const w = dim ? parseInt(dim[1], 10) : 550;
      const h = dim ? parseInt(dim[2], 10) : 350;
      const ext = (imgPath.split('.').pop() || 'png').toLowerCase().replace('jpeg', 'jpg');
      let label = null;
      const j = peekNonBlank(i + 1);
      if (j < N) {
        const cs = splitTag(L[j].trim());
        if (cs.tag === 'caption' || /^\*.+\*$/.test(cs.text)) {
          label = numbered('fig', inlineText(stripStars(cs.text))); i = j;
        }
      }
      elements.push(...R.figImg(ctx.images.loadImg(imgPath), ext, w, h, label));
      i++; continue;
    }

    // Tabella generata da codice (registry iniettato dalla configurazione)
    if ((m = line.match(/^\[TABELLA:\s*([A-Za-z0-9_]+)\]/))) {
      flush();   // niente glueLeadIn: vedi nota nel ramo immagini.
      const fn = ctx.tables[m[1]];
      if (fn) {
        const cap = captionAt(peekNonBlank(i + 1));
        elements.push(fn({ makeTable: R.makeTable, tableCell: R.tableCell, theme: ctx.theme }));
        if (cap) { elements.push(R.caption(numbered('tbl', inlineText(stripStars(cap.text))))); i = peekNonBlank(i + 1); }
      } else console.warn('  [WARN] Tabella sconosciuta: ' + m[1]);
      i++; continue;
    }

    // Tabella markdown inline
    if (/^\|.+\|/.test(line)) {
      const rows = [];
      while (i < N && /^\s*\|.+\|/.test(L[i].trim())) { rows.push(L[i].trim()); i++; }
      const cells = (r) => r.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
      if (rows.length >= 2 && /^[\s|:-]+$/.test(rows[1]) && rows[1].includes('-')) {
        flush();   // niente glueLeadIn: vedi nota nel ramo immagini.
        const headers = cells(rows[0]).map(c => inlineText(c));
        const data = rows.slice(2).map(r => cells(r).map(c => {
          const b = c.match(/^\*\*(.+)\*\*$/);
          return b ? { text: inlineText(b[1]), bold: true } : inlineText(c);
        }));
        // Aggancia l'ultima riga al paragrafo seguente solo se e' la didascalia della tabella,
        // e in quel caso la consuma qui (serve per numerarla).
        const capIdx = peekNonBlank(i);
        const cap = captionAt(capIdx);
        elements.push(R.makeTable(headers, data, undefined, { keepWithNext: !!cap }));
        if (cap) { elements.push(R.caption(numbered('tbl', inlineText(stripStars(cap.text))))); i = capIdx + 1; }
      } else { for (const r of rows) buf.push(r); }
      continue;
    }

    // Blockquote -> infoBox
    if (/^>\s?/.test(line)) {
      flush(); glueLeadIn(['body', 'bullet']);
      const bq = [];
      while (i < N && /^\s*>\s?/.test(L[i])) { bq.push(L[i].replace(/^\s*>\s?/, '')); i++; }
      const j = peekNonBlank(i);
      if (j < N && /^_\(infoBox\)_$/.test(L[j].trim())) i = j + 1;
      let txt = splitTag(bq.join(' ').trim()).text;
      let label = null;
      const lm = txt.match(/^\*\*(.+?)\*\*\s*:?\s*([\s\S]*)$/);
      if (lm) { label = inlineText(lm[1]) + ':'; txt = lm[2].trim(); }
      elements.push(R.infoBox(label, inlineText(txt)));
      continue;
    }

    // Codice fenced ``` — consuma il blocco qui dentro: e' cio' che rende il parser fence-aware.
    if (/^```/.test(line)) {
      flush(); glueLeadIn(['body', 'bullet']); i++;
      const code = [];
      while (i < N && !/^```/.test(L[i].trim())) { code.push(L[i]); i++; }
      i++;
      elements.push(...R.codeBlock(code.length ? code : ['']));
      continue;
    }

    // Elenco puntato/numerato (eventualmente indentato)
    if ((m = raw.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/))) {
      flush();
      glueLeadIn(['body']);   // un body introduttivo si aggancia al primo bullet (non bullet-a-bullet)
      const level = m[1].length >= 2 ? 1 : 0;
      const src = splitTag(m[3]).text;
      let t = /\]\(https?:/.test(src) ? linkParts(src) : inlineText(src);   // con link: parti cliccabili
      if (/^\d+\.$/.test(m[2])) t = Array.isArray(t) ? [{ text: m[2] + ' ' }, ...t] : m[2] + ' ' + t;   // mantiene la numerazione
      elements.push(R.bullet(t, level));
      leadIn = { idx: elements.length - 1, kind: 'bullet', make: () => R.bullet(t, level, { keepNext: true }) };
      i++; continue;
    }

    // Blocco di codice indentato (>=4 spazi, non elenco)
    if (/^ {4,}\S/.test(raw)) {
      flush(); glueLeadIn(['body', 'bullet']);
      const code = [];
      while (i < N && (/^ {4,}\S/.test(L[i]) || (L[i].trim() === '' && i + 1 < N && /^ {4,}\S/.test(L[i + 1])))) {
        code.push(L[i]); i++;
      }
      const indents = code.filter(l => l.trim() !== '').map(l => l.match(/^ */)[0].length);
      const min = indents.length ? Math.min(...indents) : 0;
      const stripped = code.map(l => l.slice(min));
      while (stripped.length && stripped[stripped.length - 1].trim() === '') stripped.pop();
      elements.push(...R.codeBlock(stripped));
      continue;
    }

    // stepTitle / caption (per marker) o testo normale
    const st = splitTag(line);
    if (st.tag === 'stepTitle') { flush(); elements.push(R.stepTitle(inlineText(stripStars(st.text)))); i++; continue; }
    // Didascalia residua (non agganciata a figura/tabella): resa senza numero.
    if (st.tag === 'caption')   { flush(); elements.push(R.caption(inlineText(stripStars(st.text)))); i++; continue; }
    buf.push(st.text);
    i++;
  }
  flush();

  return { title, elements, h2Count, h3Count };
}

module.exports = { parseModule, RE_FIGNO };
