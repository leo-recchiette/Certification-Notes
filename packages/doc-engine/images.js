'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Risoluzione delle immagini per NOME FILE, non per percorso.
 *
 * I path nei .md sono semplificati (es. img/entra-users.png) ma i file risiedono in
 * sottocartelle (es. img/Module 2 - .../entra-users.png): si indicizza ricorsivamente
 * img/ e si risolve per basename.
 *
 * L'indice e' PER CERTIFICAZIONE (una factory, non un singleton): cosi' l'invariante
 * "il basename deve essere univoco" resta locale e verificabile dentro una
 * certificazione, invece di diventare un vincolo globale su tutto il monorepo.
 */
function createImages(imgDir) {
  let index = null;

  function buildIndex() {
    const idx = {};
    const dups = [];
    (function walk(dir) {
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else {
          const k = e.name.toLowerCase();
          if (!(k in idx)) idx[k] = full;
          else dups.push(e.name);
        }
      }
    })(imgDir);
    if (dups.length) {
      console.warn(`  [WARN] basename duplicati in img/ (vince il primo trovato): ${dups.join(', ')}`);
    }
    return idx;
  }

  function resolveImg(ref) {
    if (!index) index = buildIndex();
    const full = index[path.basename(ref).toLowerCase()] || null;
    if (full && /\.svg$/i.test(full)) {
      // La libreria docx non incorpora SVG nativamente: segnalarlo invece di tacere.
      console.warn(`  [WARN] immagine SVG non supportata da docx: ${path.basename(full)}`);
    }
    return full;
  }

  function loadImg(ref) {
    const full = resolveImg(ref);
    if (!full) { console.warn('  [WARN] Immagine non trovata: ' + ref); return null; }
    try { return fs.readFileSync(full); }
    catch (e) { console.warn('  [WARN] Errore lettura immagine: ' + full); return null; }
  }

  return { resolveImg, loadImg, imgDir };
}

module.exports = { createImages };
