'use strict';

const {
  Document, Paragraph, TextRun, AlignmentType, LevelFormat, TabStopType,
  PageBreak, Footer, PageNumber, NumberFormat, TableOfContents,
} = require('docx');

/**
 * Sommario: campo TOC NATIVO di Word.
 *
 * Raccoglie le intestazioni tramite i livelli di struttura (outlineLevel 0/1/2 ->
 * livelli 1/2/3) e genera voci, numeri di pagina, dot leader e hyperlink. Word lo
 * compila all'apertura (features.updateFields) oppure con F9.
 *
 * Non va MAI mantenuto a mano. I PAGEREF manuali non sono un'alternativa: i
 * segnalibri generati da `docx` condividono il w:id, quindi i riferimenti di pagina
 * puntano tutti alla stessa posizione — è il vincolo per cui si usa il campo nativo.
 */
function buildSommario(R) {
  return [
    new Paragraph({ pageBreakBefore: true, spacing: R.noSpacing, children: [new TextRun('')] }),
    R.tocTitle(),
    new TableOfContents('Sommario', {
      hyperlink: true,
      headingStyleRange: '1-3',
      useAppliedParagraphOutlineLevel: true,
    }),
  ];
}

/** Interruzione di pagina fra un modulo e l'altro. */
function pageBreak(R) {
  return new Paragraph({ spacing: R.noSpacing, children: [new PageBreak()] });
}

/**
 * Assembla il documento in DUE sezioni:
 *   1) copertina + Sommario, senza numero di pagina nel footer;
 *   2) corpo dei moduli, con numero di pagina centrato nel footer (riparte da 1).
 * Il primo modulo sfrutta lo stacco di sezione, quindi non serve un'interruzione
 * di pagina davanti (altrimenti resterebbe una pagina bianca).
 */
function assembleDocument(theme, R, frontMatter, content) {
  const { C, size: SZ, font: F, geom } = theme;
  const { page, margin } = geom;
  const pageProps = {
    size: { width: page.width, height: page.height },
    margin: { top: margin.top, right: margin.side, bottom: margin.bottom, left: margin.side },
  };
  const pageFooter = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: R.noSpacing,
    children: [new TextRun({ children: [PageNumber.CURRENT], font: F.body, size: SZ.footer, color: C.caption })] })] });

  const sections = [{ properties: { page: pageProps }, children: frontMatter }];
  if (content.length) {
    sections.push({
      properties: { page: { ...pageProps, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: pageFooter },
      children: content,
    });
  }

  const tocStyle = (id, name, size, bold, color, spacing, indent) => ({
    id, name, basedOn: 'Normal', next: 'Normal',
    run: { font: F.body, size, bold, color },
    paragraph: { spacing, ...(indent ? { indent } : {}),
      tabStops: [{ type: TabStopType.RIGHT, position: geom.tocTabStop, leader: 'dot' }] },
  });

  return new Document({
    features: { updateFields: true },   // Word aggiorna il Sommario (campo TOC) all'apertura
    styles: {
      default: { document: { run: { font: F.body, size: SZ.body, color: C.bodyText } } },
      // Stili applicati da Word alle voci del Sommario generato (livelli 1/2/3 = TOC1/2/3).
      paragraphStyles: [
        tocStyle('TOC1', 'toc 1', SZ.toc1, true, C.titleBlue, { before: 120, after: 40 }, null),
        tocStyle('TOC2', 'toc 2', SZ.toc2, true, C.sectionBlue, { before: 60, after: 20 }, { left: 360 }),
        tocStyle('TOC3', 'toc 3', SZ.toc3, false, C.tocEntry, { before: 20, after: 20 }, { left: 720 }),
      ],
    },
    numbering: { config: [{ reference: 'bullets', levels: [
      { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 180 } } } },
      { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 180 } } } },
    ] }] },
    sections,
  });
}

module.exports = { buildSommario, pageBreak, assembleDocument };
