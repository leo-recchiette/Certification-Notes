'use strict';

const path = require('path');

/**
 * Configurazione della certificazione Microsoft AZ-104 (Azure Administrator).
 * Tutto il comportamento del generatore sta qui: il motore condiviso
 * (@certification-notes/doc-engine) non contiene nulla di specifico.
 */
module.exports = {
  id: 'AZ-104',

  // L'UNICO punto in cui si calcola la radice della certificazione. Lo script vive in
  // <CERT>/script/, quindi la cartella superiore e' la radice; il motore la riceve e la
  // valida, e da li' derivano chapters/, img/ e i file di output.
  root: path.resolve(__dirname, '..'),

  banner: 'AZ-104',

  // Le 8 chiavi di brand (blu Azure). Le altre 5 arrivano dai default del motore.
  palette: {
    titleBlue: '1B3A6B', sectionBlue: '0078D4', tocEntry: '2D5F8A',
    headerBg: '1F4E78', rowEven: 'F5F8FC', infoBoxBg: 'E8F0FB',
    codeBg: 'EEF3F8', codeText: '1B3A6B',
  },

  cover: {
    title: 'AZ-104',
    subtitle: 'Amministratore di Microsoft Azure',
    tagline: 'Note di studio e riassunti del percorso di apprendimento Microsoft Learn',
    logo: null,   // copertina solo testuale
  },

  // Le 7 tabelle generate da codice, riferite nei .md come [TABELLA: nome].
  tables: require('./tables'),

  deliverables: {
    notes: {
      label: 'documento completo',
      source: { dir: 'chapters', file: n => `MODULE_${n}.md`, count: 6 },
      output: {
        full: 'AZ-104_Note_di_Studio.docx',
        module: n => `AZ-104_Modulo_${n}.docx`,
      },
      moduleLabels: {
        1: 'Modulo 1 — Prerequisiti',
        2: 'Modulo 2 — Identita\' e Governance',
        3: 'Modulo 3 — Reti Virtuali',
        4: 'Modulo 4 — Archiviazione',
        5: 'Modulo 5 — Calcolo',
        6: 'Modulo 6 — Monitoraggio e Backup',
      },
    },
  },

  defaultDeliverable: 'notes',
};
