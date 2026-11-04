'use strict';

/**
 * Stili condivisi da tutte le certificazioni.
 *
 * I valori sono quelli dell'impaginazione compatta (ex TA-004), adottata come
 * standard unico. Per certificazione cambia SOLO la palette di brand (8 chiavi):
 * le altre 5 chiavi di colore, i font, le dimensioni e la geometria sono comuni.
 */

// A4 in twip (1/20 di punto).
const PAGE = { width: 11906, height: 16838 };
// Margini sup/inf a 1008 twip (0,7"): piu' altezza utile -> le figure entrano piu' spesso.
// `side` e' l'UNICA sorgente dei tre valori geometrici legati fra loro (vedi buildTheme).
const MARGIN = { top: 1008, bottom: 1008, side: 1080 };

// Le 5 chiavi di colore identiche in tutte le certificazioni.
const BASE_PALETTE = {
  bodyText: '333333', subtle: '555555', caption: '888888',
  white: 'FFFFFF', border: 'CCCCCC',
};

// Le 8 chiavi di brand che ogni certificazione deve fornire in config.palette.
const BRAND_KEYS = [
  'titleBlue', 'sectionBlue', 'tocEntry', 'headerBg',
  'rowEven', 'infoBoxBg', 'codeBg', 'codeText',
];

const DEFAULTS = {
  font: { body: 'Calibri', code: 'Courier New' },
  // Dimensioni in half-point (20 = 10pt).
  size: {
    body: 22, h2: 28, h3: 24, caption: 16, code: 18, table: 18,
    moduloTitle: 48, tocTitle: 36,
    coverTitle: 96, coverSubtitle: 52, coverTagline: 26,
    footer: 18, toc1: 24, toc2: 22, toc3: 20,
  },
  spacing: { std: { before: 40, after: 40 }, none: { before: 0, after: 0 } },
  indent: { code: 240, infoBox: 360 },
  // Un blocco di codice piu' lungo di cosi' puo' spezzarsi tra due pagine, invece di
  // essere spinto intero a pagina nuova lasciando un buco nella precedente.
  code: { keepMax: 15 },
  // Clamp delle figure in px: docx converte px->EMU a 9525 (96 DPI). La colonna di testo
  // utile e' ~650 px: oltre, l'immagine sconfina nel margine destro. maxH tiene le figure
  // piu' basse -> meno spazio vuoto prima di una figura alta che non entra in fondo pagina.
  fig: { maxW: 560, maxH: 340 },
  justify: true,
  // Scarti per derivare la geometria dalla larghezza della colonna di testo.
  table: { slack: 146 },   // fullWidth  = textWidth - 146  (9600 con margini 1080)
  toc: { tabSlack: 46 },   // tocTabStop = textWidth -  46  (9700 con margini 1080)
};

/** Merge superficiale a due livelli (basta per la forma di DEFAULTS). */
function merge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...base[k], ...v } : v;
  }
  return out;
}

/**
 * Costruisce il tema: palette + dimensioni + geometria DERIVATA.
 *
 * Perche' derivata: margine laterale, larghezza delle tabelle e tab stop del Sommario
 * sono tre numeri che devono muoversi insieme. Tenerli separati li fa desincronizzare
 * alla prima modifica dei margini.
 */
function buildTheme(palette = {}, over = {}) {
  const missing = BRAND_KEYS.filter(k => !palette[k]);
  if (missing.length) {
    throw new Error(`config.palette: chiavi di brand mancanti: ${missing.join(', ')}`);
  }
  const t = merge(DEFAULTS, over);
  const margin = t.margin || MARGIN;
  const page = t.page || PAGE;
  const textWidth = page.width - 2 * margin.side;
  t.geom = {
    page, margin, textWidth,
    fullWidth: textWidth - t.table.slack,
    tocTabStop: textWidth - t.toc.tabSlack,
    bodyHeight: page.height - margin.top - margin.bottom,
  };
  // Una figura larga quanto maxW deve stare dentro la colonna di testo (1 px = 15 twip a 96 DPI).
  if (t.fig.maxW * 15 > textWidth) {
    throw new Error(`fig.maxW (${t.fig.maxW}px) sfora la colonna di testo (${textWidth} twip)`);
  }
  t.C = { ...BASE_PALETTE, ...palette };
  return t;
}

module.exports = { PAGE, MARGIN, BASE_PALETTE, BRAND_KEYS, DEFAULTS, buildTheme };
