'use strict';

const fs = require('fs');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  TableLayoutType, ExternalHyperlink,
} = require('docx');

/**
 * Helper di resa: ognuno restituisce oggetti Paragraph/Table di `docx`.
 *
 * E' una factory perche' ogni helper ha bisogno del tema (palette, dimensioni,
 * geometria) e della risoluzione immagini della certificazione corrente. Gli
 * stili qui dentro sono quelli descritti in docs/STYLE_GUIDE.md.
 */
function createRender(theme, images) {
  const { C, size: SZ, font: F, spacing: SP, indent: IND, geom } = theme;
  const noSpacing = SP.none;
  const stdSpacing = SP.std;
  const JUSTIFY = theme.justify ? AlignmentType.JUSTIFIED : undefined;
  const FULL_WIDTH = geom.fullWidth;
  const BODY_HEIGHT = geom.bodyHeight;

  function body(text, opts = {}, paraOpts = {}) {
    return new Paragraph({ alignment: JUSTIFY, spacing: stdSpacing, keepLines: true, ...paraOpts,
      children: [new TextRun({ text, font: F.body, size: SZ.body, color: C.bodyText, ...opts })] });
  }

  // Paragrafo che inizia con un'etichetta in grassetto (es. "**Domanda 1:** B — ..."): etichetta bold, resto normale.
  function bodyLead(label, text, paraOpts = {}) {
    const run = (t, bold) => new TextRun({ text: t, font: F.body, size: SZ.body, color: C.bodyText, bold });
    return new Paragraph({ alignment: JUSTIFY, spacing: stdSpacing, keepLines: true, ...paraOpts,
      children: [run(label, true), run(text, false)] });
  }

  function h2(text) {
    return new Paragraph({ spacing: { before: 160, after: 60 }, keepNext: true, keepLines: true, outlineLevel: 1,
      children: [new TextRun({ text, font: F.body, size: SZ.h2, bold: true, color: C.sectionBlue })] });
  }

  function h3(text) {
    return new Paragraph({ spacing: { before: 100, after: 40 }, keepNext: true, keepLines: true, outlineLevel: 2,
      children: [new TextRun({ text, font: F.body, size: SZ.h3, bold: true, color: C.tocEntry })] });
  }

  function stepTitle(text) {
    return new Paragraph({ spacing: { before: 80, after: 20 }, keepNext: true, keepLines: true,
      children: [new TextRun({ text, font: F.body, size: SZ.body, bold: true, color: '000000' })] });
  }

  // text: stringa, oppure array di parti {text, url?} (da linkParts): le parti con url diventano link cliccabili.
  function bullet(text, level = 0, paraOpts = {}) {
    const parts = Array.isArray(text) ? text : [{ text }];
    return new Paragraph({ alignment: JUSTIFY, spacing: { before: 20, after: 20 }, keepLines: true,
      numbering: { reference: 'bullets', level }, ...paraOpts,
      children: parts.map(p => p.url
        ? new ExternalHyperlink({ link: p.url, children: [new TextRun({ text: p.text, font: F.body, size: SZ.body, color: C.sectionBlue, underline: {} })] })
        : new TextRun({ text: p.text, font: F.body, size: SZ.body, color: C.bodyText })) });
  }

  function caption(text) {
    return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20, after: 60 }, keepLines: true,
      children: [new TextRun({ text, font: F.body, size: SZ.caption, italics: true, color: C.caption })] });
  }

  function codeBlock(lines) {
    const arr = Array.isArray(lines) ? lines : [lines];
    const keepAll = arr.length <= theme.code.keepMax;
    return arr.map((line, idx) => new Paragraph({ spacing: noSpacing, keepLines: true,
      keepNext: idx < arr.length - 1 && (keepAll || idx === 0),
      shading: { fill: C.codeBg, type: ShadingType.CLEAR }, indent: { left: IND.code, right: IND.code },
      children: [new TextRun({ text: line, font: F.code, size: SZ.code, color: C.codeText })] }));
  }

  function infoBox(label, text) {
    const children = [];
    if (label) children.push(new TextRun({ text: label + ' ', font: F.body, size: SZ.body, bold: true, color: C.sectionBlue }));
    children.push(new TextRun({ text, font: F.body, size: SZ.body, color: C.bodyText }));
    return new Paragraph({ alignment: JUSTIFY, spacing: stdSpacing, keepLines: true,
      indent: { left: IND.infoBox, right: IND.infoBox },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: C.sectionBlue } },
      shading: { fill: C.infoBoxBg, type: ShadingType.CLEAR }, children });
  }

  function spacer(n = 1) {
    return Array.from({ length: n }, () => new Paragraph({ spacing: noSpacing, children: [new TextRun('')] }));
  }

  function figImg(data, ext, origW, origH, label) {
    // docx converte px->EMU a 9525 EMU/px (96 DPI). Oltre la larghezza della colonna di
    // testo l'immagine sconfina nel margine destro: si clampa scalando in proporzione.
    const { maxW, maxH } = theme.fig;
    let w = origW, h = origH;
    if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
    if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
    const items = [];
    // keepNext: l'immagine resta attaccata alla sua didascalia (e all'intestazione precedente).
    if (data) items.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 0 }, keepNext: true,
      children: [new ImageRun({ data, transformation: { width: w, height: h }, type: ext })] }));
    if (label) items.push(caption(label));
    return items;
  }

  // Stima grossolana dell'altezza di una tabella in twip: Calibri 10pt ~95 twip per carattere,
  // ~244 twip per riga di testo, 160 twip di margini verticali e 240 orizzontali per cella.
  function estTableHeight(headers, rows, widths) {
    const lines = (t, w) => Math.max(1, Math.ceil(String(t).length * 95 / (w - 240)));
    return [headers, ...rows].reduce((h, r) => h + 160 + 244 * Math.max(...r.map((c, i) =>
      lines(typeof c === 'object' ? c.text : c, widths[i]))), 0);
  }

  // Larghezze delle colonne in base al contenuto, come il layout automatico delle tabelle HTML:
  // ogni colonna riceve almeno la sua parola piu' lunga (al massimo meta' tabella) e lo spazio
  // che avanza va alle colonne con piu' testo. Con il layout fisso Word rispetta queste larghezze,
  // invece di restringere una colonna fino a spezzarne le parole. I percorsi (a/b/c) non contano
  // come parola unica: andrebbero comunque a capo.
  function tableWidths(headers, rows) {
    // Larghezza stimata in twip di un testo Calibri 10pt (maiuscole, cifre e _ sono piu' larghe).
    const textW = (s, bold) => [...s].reduce((w, ch) => w + (/[mwMW]/.test(ch) ? 155 : /[A-Z]/.test(ch) ? 118
      : /[0-9_%]/.test(ch) ? 104 : /[a-z]/.test(ch) ? 92 : 75), 0) * (bold ? 1.06 : 1);
    const PAD = 300;   // margini di cella (120+120) + tolleranza
    const cols = headers.map((h, c) => [[h, true], ...rows.map(r => {
      const cell = r[c] ?? '';
      return typeof cell === 'object' ? [cell.text, cell.bold] : [String(cell), false];
    })]);
    const minW = cols.map(cells => Math.min(FULL_WIDTH * 0.5,
      PAD + Math.max(...cells.flatMap(([t, b]) => t.split(/[\s/]+/).map(w => textW(w, b))))));
    const maxW = cols.map((cells, c) => Math.max(minW[c], PAD + Math.max(...cells.map(([t, b]) => textW(t, b)))));
    const sum = a => a.reduce((s, x) => s + x, 0);
    const sMin = sum(minW), sMax = sum(maxW);
    const w = sMax <= FULL_WIDTH ? maxW.map(x => x * FULL_WIDTH / sMax)
      : sMin >= FULL_WIDTH ? minW.map(x => x * FULL_WIDTH / sMin)
      : minW.map((x, c) => x + (maxW[c] - x) * (FULL_WIDTH - sMin) / (sMax - sMin));
    const out = w.map(Math.floor);
    out[out.length - 1] += FULL_WIDTH - sum(out);
    return out;
  }

  function tableCell(text, opts = {}) {
    const { fill = C.white, bold = false, color = C.bodyText, width, keepNext = false } = opts;
    const tblBorder = { style: BorderStyle.SINGLE, size: 1, color: C.border };
    return new TableCell({ width: width ? { size: width, type: WidthType.DXA } : undefined,
      shading: { fill, type: ShadingType.CLEAR }, margins: { top: 40, bottom: 40, left: 100, right: 100 },
      borders: { top: tblBorder, bottom: tblBorder, left: tblBorder, right: tblBorder },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ spacing: noSpacing, keepNext, keepLines: true,
        children: [new TextRun({ text, font: F.body, size: SZ.table, bold,
          color: fill === C.headerBg ? C.white : color })] })] });
  }

  function makeTable(headers, rows, colWidths, opts = {}) {
    // keepWithNext: l'ultima riga resta "incollata" al paragrafo seguente (la didascalia).
    // Default true (le tabelle hanno quasi sempre una didascalia sotto). Il parser lo mette a
    // false quando dopo la tabella c'e' un'immagine/intestazione: cosi' la tabella non trascina
    // quel blocco a pagina nuova lasciando un buco sopra.
    const keepWithNext = opts.keepWithNext !== false;
    const widths = colWidths || tableWidths(headers, rows);
    const tblBorder = { style: BorderStyle.SINGLE, size: 1, color: C.border };
    const borders = { top: tblBorder, bottom: tblBorder, left: tblBorder, right: tblBorder, insideH: tblBorder, insideV: tblBorder };
    // tableHeader: l'intestazione si ripete se la tabella e' costretta a spezzarsi.
    // cantSplit (riga) + keepNext (celle delle righe non finali): la tabella resta unita.
    // Una tabella piu' alta di una pagina si spezza comunque: tenerla unita la sposterebbe solo
    // a pagina nuova, lasciando quasi vuota la precedente. In quel caso l'intestazione resta
    // agganciata alla prima riga e le altre righe scorrono normalmente.
    const keepTogether = estTableHeight(headers, rows, widths) < BODY_HEIGHT * 0.85;
    const headerRow = new TableRow({ cantSplit: true, tableHeader: true,
      children: headers.map((h, i) => tableCell(h, { fill: C.headerBg, bold: true, width: widths[i], keepNext: true })) });
    const lastIdx = rows.length - 1;
    const dataRows = rows.map((row, ri) => {
      const fill = ri % 2 === 0 ? C.rowEven : C.white;
      const rowKeepNext = ri < lastIdx ? keepTogether : keepWithNext;   // ultima riga: solo se richiesto
      return new TableRow({ cantSplit: true,
        children: row.map((cell, ci) => {
          if (typeof cell === 'object' && cell.text !== undefined)
            return tableCell(cell.text, { fill, bold: cell.bold, width: widths[ci], keepNext: rowKeepNext });
          return tableCell(cell, { fill, width: widths[ci], keepNext: rowKeepNext });
        }) });
    });
    return new Table({ width: { size: FULL_WIDTH, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
      borders, rows: [headerRow, ...dataRows] });
  }

  function moduloTitle(text) {
    // Niente pageBreakBefore: lo stacco tra moduli e' gestito in fase di assemblaggio
    // (interruzione di pagina tra un modulo e l'altro; il primo sfrutta lo stacco di sezione).
    return new Paragraph({ spacing: { before: 0, after: 120 }, keepNext: true, keepLines: true, outlineLevel: 0,
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.sectionBlue, space: 4 } },
      children: [new TextRun({ text, font: F.body, size: SZ.moduloTitle, bold: true, color: C.titleBlue })] });
  }

  function moduloIntro(text) {
    return new Paragraph({ alignment: JUSTIFY, spacing: { before: 80, after: 120 }, keepNext: true, keepLines: true,
      children: [new TextRun({ text, font: F.body, size: SZ.body, italics: true, color: C.bodyText })] });
  }

  function tocTitle() {
    return new Paragraph({ spacing: { before: 0, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.sectionBlue, space: 4 } },
      children: [new TextRun({ text: 'Sommario', font: F.body, size: SZ.tocTitle, bold: true, color: C.titleBlue })] });
  }

  /**
   * Copertina, interamente dai dati di `cover` della configurazione.
   * Il logo e' opzionale: se il file manca, la copertina degrada a solo testo senza errore.
   */
  function coverPage(cover) {
    const { title, subtitle, tagline, logo } = cover;
    const logoPath = logo ? images.resolveImg(logo.file) : null;
    const logoPara = logoPath ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 360 },
      children: [new ImageRun({ data: fs.readFileSync(logoPath), type: (logo.file.split('.').pop() || 'png').toLowerCase(),
        transformation: { width: logo.width, height: logo.height } })] })] : [];
    if (logo && !logoPath) console.warn(`  [WARN] logo di copertina non trovato: ${logo.file} (copertina solo testuale)`);
    return [
      ...spacer(logoPath ? 6 : 10),
      ...logoPara,
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: noSpacing,
        children: [new TextRun({ text: title, font: F.body, size: SZ.coverTitle, bold: true, color: C.titleBlue })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: subtitle, font: F.body, size: SZ.coverSubtitle, bold: true, color: C.sectionBlue })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 20, after: 0 },
        children: [new TextRun({ text: tagline, font: F.body, size: SZ.coverTagline, italics: true, color: C.subtle })] }),
    ];
  }

  return { body, bodyLead, h2, h3, stepTitle, bullet, caption, codeBlock, infoBox, spacer,
    figImg, estTableHeight, tableWidths, tableCell, makeTable, moduloTitle, moduloIntro,
    tocTitle, coverPage, noSpacing };
}

module.exports = { createRender };
