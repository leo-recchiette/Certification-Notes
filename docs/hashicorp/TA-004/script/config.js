'use strict';

const path = require('path');

/**
 * Configurazione della certificazione HashiCorp Certified: Terraform Associate (004).
 * Tutto il comportamento del generatore sta qui: il motore condiviso
 * (@certification-notes/doc-engine) non contiene nulla di specifico.
 */
module.exports = {
  id: 'TA-004',

  // L'UNICO punto in cui si calcola la radice della certificazione. Lo script vive in
  // <CERT>/script/, quindi la cartella superiore e' la radice; il motore la riceve e la
  // valida, e da li' derivano chapters/, pocketguide/, img/ e i file di output.
  root: path.resolve(__dirname, '..'),

  banner: 'Terraform Associate (004)',

  // Le 8 chiavi di brand (viola HashiCorp). Le altre 5 arrivano dai default del motore.
  palette: {
    titleBlue: '2E1A59', sectionBlue: '7B42BC', tocEntry: '5C4EE5',
    headerBg: '4A2A85', rowEven: 'F7F3FC', infoBoxBg: 'F1E9FB',
    codeBg: 'F3EFF8', codeText: '2E1A59',
  },

  cover: {
    title: 'TA-004',
    subtitle: 'HashiCorp Certified: Terraform Associate',
    tagline: 'Note di studio basate sulla exam content list e sui tutorial HashiCorp Developer',
    logo: { file: 'terraform-logo.png', width: 150, height: 150 },
  },

  // Nessuna tabella generata da codice: qui ogni tabella e' Markdown inline.
  tables: {},

  deliverables: {
    // Documento principale: 8 moduli, uno per obiettivo d'esame.
    notes: {
      label: 'documento completo',
      source: { dir: 'chapters', file: n => `MODULE_${n}.md`, count: 8 },
      output: {
        full: 'TA-004_Note_di_Studio.docx',
        toc: 'TA-004_Sommario.docx',
        module: n => `TA-004_Modulo_${n}.docx`,
      },
      moduleLabels: {
        1: 'Modulo 1 — IaC con Terraform',
        2: 'Modulo 2 — Fondamenti di Terraform',
        3: 'Modulo 3 — Core workflow',
        4: 'Modulo 4 — Configurazione',
        5: 'Modulo 5 — Moduli',
        6: 'Modulo 6 — Gestione dello state',
        7: 'Modulo 7 — Manutenzione dell\'infrastruttura',
        8: 'Modulo 8 — HCP Terraform',
      },
    },

    // ─── MODELLO per aggiungere una variante ───────────────────────────────────
    // Un deliverable dichiara solo: come si seleziona da CLI (flag), dove sono i
    // sorgenti, come si chiama l'output e cosa cambia in copertina. Le modalita'
    // disponibili si deducono da `output`: qui non ci sono `toc` ne' `module`,
    // quindi --toc e --module vengono rifiutati con un messaggio chiaro.
    pocket: {
      flag: '--pocket',
      label: 'Pocket Guide',
      source: { dir: 'pocketguide', all: true },   // tutti i .md, in ordine di nome file
      output: { full: 'TA-004_Pocket_Guide.docx' },
      cover: { tagline: 'Pocket Guide — traduzione italiana di TF004-PocketGuide (github.com/susu10-10)' },
    },
  },

  defaultDeliverable: 'notes',
};
