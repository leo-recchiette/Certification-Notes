'use strict';

/**
 * Markup inline: marcatori finali _(tag)_, grassetto, corsivo, codice inline, link.
 * Nessuna dipendenza da `docx` e nessuno stato: funzioni pure.
 */

const RE_TAG = /\s*_\(([^)]*)\)_\s*$/;            // marker finale: ..._(stepTitle)_

/** Separa il testo dal marcatore finale: "Titolo _(stepTitle)_" -> {text, tag}. */
function splitTag(s) {
  const m = s.match(RE_TAG);
  if (m) return { text: s.slice(0, m.index).replace(/\s+$/, ''), tag: m[1].trim() };
  return { text: s, tag: null };
}

function stripStars(s) { return s.replace(/^\s*\*+/, '').replace(/\*+\s*$/, '').trim(); }

/** Corsivo *testo* -> testo, ma solo fuori dal codice inline (es. `*.auto.tfvars` resta intatto). */
function stripItalic(s) {
  return s.split(/(`[^`]+`)/).map(seg => seg.startsWith('`') ? seg
    : seg.replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?=[^*\w]|$)/g, '$1$2')).join('');
}

/** Riduce il markup inline a testo semplice, SENZA trim (serve per i frammenti). */
function inlineRaw(s) {
  return stripItalic(s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')      // immagini inline residue
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')    // link [testo](url) -> testo
    .replace(/\*\*([^*]+)\*\*/g, '$1'))         // grassetto
    .replace(/`([^`]+)`/g, '$1')                // codice inline
    .replace(/_\([^)]*\)_/g, '');               // marker residui
}

function inlineText(s) { return inlineRaw(s).trim(); }

/**
 * Testo con link http(s) -> parti {text, url?}: le parti con url diventano
 * ExternalHyperlink, cosi' i link restano cliccabili nel .docx e nel .pdf.
 * E' il meccanismo con cui le citazioni delle pagine sorgente restano navigabili.
 */
function linkParts(s) {
  const parts = [];
  let last = 0;
  for (const m of s.matchAll(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g)) {
    if (m.index > last) parts.push({ text: inlineRaw(s.slice(last, m.index)) });
    parts.push({ text: inlineText(m[1]), url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ text: inlineRaw(s.slice(last)) });
  if (parts.length && !parts[0].url) parts[0].text = parts[0].text.replace(/^\s+/, '');
  if (parts.length && !parts[parts.length - 1].url) parts[parts.length - 1].text = parts[parts.length - 1].text.replace(/\s+$/, '');
  return parts.filter(p => p.text);
}

module.exports = { RE_TAG, splitTag, stripStars, stripItalic, inlineRaw, inlineText, linkParts };
