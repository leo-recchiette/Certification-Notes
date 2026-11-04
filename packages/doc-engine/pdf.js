'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

// ─── ESPORTAZIONE PDF (dal .docx appena generato) ─────────────────────────────
// Il .docx resta la fonte: il PDF e' solo una conversione. Il punto delicato e' il
// Sommario: e' un campo TOC nativo, che qualcuno deve calcolare prima di esportare,
// altrimenti nel PDF esce vuoto. Motori, in ordine di preferenza:
//
//   1) word         Microsoft Word via COM (solo Windows, sessione interattiva): aggiorna
//                   Sommario e numeri di pagina, poi esporta.
//   2) uno          LibreOffice pilotato via UNO da docx2pdf.py: forza l'impaginazione,
//                   aggiorna il Sommario, poi esporta. E' il motore dell'immagine Docker,
//                   dove il PDF di riferimento e' questo.
//   3) libreoffice  `soffice --convert-to pdf`: esporta senza aggiornare il Sommario,
//                   che esce VUOTO. Solo ultimo ripiego, con un avviso.
//
// CERTNOTES_PDF_ENGINE sceglie un motore preciso (word | uno | libreoffice), SENZA
// ripieghi: se fallisce, la build fallisce. L'immagine Docker imposta "uno", cosi' un
// problema di LibreOffice non puo' degradare in silenzio a un PDF col Sommario vuoto.
// Senza variabile si prova la catena e, se nessun motore e' installato, si avvisa e
// basta: il .docx e' comunque pronto.

const ENGINES = ['word', 'uno', 'libreoffice'];
const TIMEOUT_S = Number(process.env.CERTNOTES_PDF_TIMEOUT) || 300;

function exportWithWord(docxPath, pdfPath) {
  // Script PowerShell temporaneo: apre il .docx in sola lettura, aggiorna campi e
  // sommari, ripagina ed esporta in PDF (ExportAsFixedFormat, formato 17 = PDF, con
  // segnalibri dalle intestazioni). Rilascia gli oggetti COM e chiude Word.
  const ps = [
    'param([Parameter(Mandatory=$true)][string]$DocxPath,[Parameter(Mandatory=$true)][string]$PdfPath)',
    '$ErrorActionPreference = "Stop"',
    '$word = $null; $doc = $null',
    'try {',
    '  $word = New-Object -ComObject Word.Application',
    '  $word.Visible = $false',
    '  $word.DisplayAlerts = 0',
    '  $doc = $word.Documents.Open($DocxPath, $false, $true)',   // ConfirmConversions=false, ReadOnly=true
    '  try { $doc.Fields.Update() | Out-Null } catch {}',
    '  foreach ($toc in $doc.TablesOfContents) { try { $toc.Update() | Out-Null } catch {} }',
    '  try { $doc.Repaginate() } catch {}',
    '  $doc.ExportAsFixedFormat($PdfPath, 17, $false, 0, 0, 1, 1, 0, $true, $true, 1, $true, $true, $false)',
    '} finally {',
    '  if ($doc)  { $doc.Close($false) }',
    '  if ($word) { $word.Quit() }',
    '  if ($doc)  { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc) }',
    '  if ($word) { [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word) }',
    '  [GC]::Collect(); [GC]::WaitForPendingFinalizers()',
    '}',
  ].join('\r\n');
  const tmp = path.join(os.tmpdir(), `certnotes_pdf_${process.pid}.ps1`);
  fs.writeFileSync(tmp, ps, 'utf8');
  try {
    execFileSync('powershell',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', tmp, docxPath, pdfPath],
      { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', windowsHide: true, timeout: 240000 });
  } finally {
    try { fs.unlinkSync(tmp); } catch (e) { /* best effort */ }
  }
}

/**
 * LibreOffice via UNO (docx2pdf.py). Restituisce il riepilogo JSON dello script, con il
 * numero di voci del Sommario: il chiamante lo confronta con le intestazioni attese.
 */
// Codici d'uscita di docx2pdf.py -> motivo leggibile.
const UNO_EXIT = {
  2: 'uso errato dello script',
  3: 'LibreOffice non si avvia',
  4: 'LibreOffice non riesce ad aprire il .docx (se succede su un documento grande, ' +
     'controlla la memoria assegnata a Docker Desktop)',
  5: 'aggiornamento del Sommario o esportazione non riusciti',
  124: `tempo scaduto (${TIMEOUT_S} s, regolabile con CERTNOTES_PDF_TIMEOUT)`,
};

function exportWithLibreOfficeUno(docxPath, pdfPath) {
  const script = path.join(__dirname, 'docx2pdf.py');
  let out;
  try {
    out = execFileSync('python3', [script, docxPath, pdfPath], {
      // stderr ereditato: i messaggi di LibreOffice e dello script si vedono subito.
      stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8', windowsHide: true,
      env: { ...process.env, CERTNOTES_PDF_TIMEOUT: String(TIMEOUT_S) },
      // Lo script ha un proprio watchdog a TIMEOUT_S; questo e' solo il paracadute.
      timeout: (TIMEOUT_S + 60) * 1000,
    });
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('python3 non trovato');
    throw new Error(UNO_EXIT[e.status] || (e.code === 'ETIMEDOUT' ? 'tempo scaduto' : `codice d'uscita ${e.status}`));
  }
  const last = out.trim().split('\n').pop();
  return JSON.parse(last);
}

function exportWithLibreOffice(docxPath, pdfPath) {
  // soffice scrive <basename>.pdf nella --outdir indicata: coincide con pdfPath.
  const outDir = path.dirname(pdfPath);
  const bins = process.platform === 'win32'
    ? ['soffice.com',
       path.join(process.env.ProgramFiles || 'C:\\Program Files', 'LibreOffice', 'program', 'soffice.exe'),
       path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'LibreOffice', 'program', 'soffice.exe')]
    : ['libreoffice', 'soffice'];
  // Profilo temporaneo: con un LibreOffice desktop gia' aperto, soffice consegnerebbe il
  // lavoro all'istanza esistente e uscirebbe senza convertire nulla.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'certnotes-lo-'));
  let lastErr = null;
  try {
    for (const bin of bins) {
      try {
        execFileSync(bin,
          ['--headless', '--norestore', `-env:UserInstallation=${pathToFileURL(profile).href}`,
           '--convert-to', 'pdf:writer_pdf_Export', '--outdir', outDir, docxPath],
          { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', windowsHide: true, timeout: TIMEOUT_S * 1000 });
        if (fs.existsSync(pdfPath)) return;
      } catch (e) { lastErr = e; }
    }
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
  if (lastErr) throw lastErr;
  throw new Error('LibreOffice non ha prodotto il PDF');
}

function unoAvailable() {
  try {
    execFileSync('python3', ['-c', 'import uno'], { stdio: 'ignore', windowsHide: true, timeout: 20000 });
    return true;
  } catch (e) { return false; }
}

const describe = (e) => (e && (e.code === 'ETIMEDOUT' ? 'tempo scaduto' : e.message)) || String(e);

/**
 * Converte il .docx in PDF.
 *
 * opts.expectedToc: voci di Sommario attese (le intestazioni del documento). Il motore
 *   uno le conta dopo l'aggiornamento: un numero diverso e' un errore, non un avviso.
 *
 * Restituisce { pdfPath, engine } se il PDF c'e', altrimenti { error, fatal }.
 *   - motore esplicito (CERTNOTES_PDF_ENGINE): nessun ripiego, e ogni errore e' fatal:
 *     il chiamante deve far fallire la build. E' il caso dell'immagine Docker.
 *   - automatico: si prova la catena, e un fallimento resta un avviso come in passato
 *     (su una macchina senza Word ne' LibreOffice il .docx basta).
 */
function exportToPdf(docxPath, opts = {}) {
  const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
  const base = path.basename(pdfPath);
  const kb = (p) => (fs.statSync(p).size / 1024).toFixed(1);

  const forced = process.env.CERTNOTES_PDF_ENGINE;
  if (forced && !ENGINES.includes(forced)) {
    return { error: `CERTNOTES_PDF_ENGINE="${forced}" non valido (ammessi: ${ENGINES.join(', ')})`, fatal: true };
  }
  const chain = forced ? [forced]
    : [...(process.platform === 'win32' ? ['word'] : []), ...(unoAvailable() ? ['uno'] : []), 'libreoffice'];

  for (const engine of chain) {
    try {
      if (engine === 'word') {
        exportWithWord(docxPath, pdfPath);
        if (!fs.existsSync(pdfPath)) throw new Error('Word non ha prodotto il PDF');
        console.log(`PDF salvato:  ${base}  (Microsoft Word, ${kb(pdfPath)} KB)`);
      } else if (engine === 'uno') {
        const r = exportWithLibreOfficeUno(docxPath, pdfPath);
        if (opts.expectedToc !== undefined && r.tocEntries !== opts.expectedToc) {
          throw new Error(`Sommario con ${r.tocEntries} voci invece di ${opts.expectedToc}`);
        }
        // Niente numero di pagine qui: quello di LibreOffice conta anche le pagine bianche
        // automatiche, che l'export scarta (IsSkipEmptyPages), quindi non corrisponde al PDF.
        console.log(`PDF salvato:  ${base}  (LibreOffice, Sommario di ${r.tocEntries} voci, ` +
          `${r.seconds} s, ${kb(pdfPath)} KB)`);
      } else {
        exportWithLibreOffice(docxPath, pdfPath);
        console.log(`PDF salvato:  ${base}  (LibreOffice, ${kb(pdfPath)} KB)`);
        console.warn('  [WARN] Il Sommario di questo PDF e\' VUOTO: soffice --convert-to non lo aggiorna.');
        console.warn('         Usa l\'immagine Docker (docker compose run --rm docs ...) oppure Word.');
      }
      return { pdfPath, engine };
    } catch (e) {
      const failure = `${engine}: ${describe(e)}`;
      // LibreOffice semplicemente non installato non merita un avviso a se': lo copre
      // il messaggio finale.
      if (!(engine === 'libreoffice' && e && e.code === 'ENOENT')) {
        console.warn(`  [WARN] Esportazione PDF non riuscita (${failure})`);
      }
      if (forced) {
        if (/EBUSY|EPERM/.test(String(e && e.message))) {
          console.warn('         Il PDF e\' forse aperto in un altro programma (Acrobat, anteprima): chiudilo e riprova.');
        }
        return { error: failure, fatal: true };
      }
    }
  }
  console.warn('  [WARN] PDF non generato: serve Microsoft Word, LibreOffice o l\'immagine Docker.');
  console.warn('         Il .docx e\' comunque pronto. Usa --no-pdf per non tentare la conversione.');
  return { error: 'nessun PDF prodotto', fatal: false };
}

module.exports = { exportToPdf, exportWithWord, exportWithLibreOfficeUno, exportWithLibreOffice, ENGINES };
