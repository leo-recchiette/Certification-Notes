'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// ─── ESPORTAZIONE PDF (dal .docx appena generato) ─────────────────────────────
// Il .docx resta la fonte: il PDF e' solo una conversione. Si prova, in ordine di
// fedelta':
//   1) Microsoft Word via COM (solo Windows): apre il documento, AGGIORNA il
//      Sommario (campo TOC) e i numeri di pagina, poi esporta -> indice e pagine
//      corretti nel PDF. E' il motivo per cui Word e' preferito a LibreOffice.
//   2) LibreOffice headless (multipiattaforma) come fallback.
// Se nessuno e' disponibile, il .docx resta valido e si emette solo un avviso.
//
// NB: questo percorso NON e' puro Node e non e' verificabile in container: Word COM
// funziona solo in una sessione interattiva Windows.
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

function exportWithLibreOffice(docxPath, pdfPath) {
  // soffice scrive <basename>.pdf nella --outdir indicata: coincide con pdfPath.
  const outDir = path.dirname(pdfPath);
  const bins = process.platform === 'win32'
    ? ['soffice.com',
       path.join(process.env.ProgramFiles || 'C:\\Program Files', 'LibreOffice', 'program', 'soffice.exe'),
       path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'LibreOffice', 'program', 'soffice.exe')]
    : ['libreoffice', 'soffice'];
  let lastErr = null;
  for (const bin of bins) {
    try {
      execFileSync(bin,
        ['--headless', '--norestore', '--convert-to', 'pdf:writer_pdf_Export', '--outdir', outDir, docxPath],
        { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', windowsHide: true, timeout: 240000 });
      if (fs.existsSync(pdfPath)) return;
    } catch (e) { lastErr = e; }
  }
  if (lastErr) throw lastErr;
  throw new Error('LibreOffice non ha prodotto il PDF');
}

function exportToPdf(docxPath) {
  const pdfPath = docxPath.replace(/\.docx$/i, '.pdf');
  const base = path.basename(pdfPath);
  const kb = (p) => (fs.statSync(p).size / 1024).toFixed(1);
  // 1) Microsoft Word (Windows): Sommario e numeri di pagina aggiornati.
  if (process.platform === 'win32') {
    try {
      exportWithWord(docxPath, pdfPath);
      if (fs.existsSync(pdfPath)) {
        console.log(`PDF salvato:  ${base}  (Microsoft Word, ${kb(pdfPath)} KB)`);
        return pdfPath;
      }
    } catch (e) {
      console.warn('  [WARN] Esportazione PDF con Word non riuscita: ' + (e.message || e));
      console.warn('         Provo con LibreOffice...');
    }
  }
  // 2) Fallback: LibreOffice headless.
  try {
    exportWithLibreOffice(docxPath, pdfPath);
    console.log(`PDF salvato:  ${base}  (LibreOffice, ${kb(pdfPath)} KB)`);
    console.warn('         Nota: i numeri di pagina del Sommario potrebbero non essere aggiornati; aprilo in Word e premi F9.');
    return pdfPath;
  } catch (e) {
    console.warn('  [WARN] Esportazione PDF con LibreOffice non riuscita: ' + (e.message || e));
  }
  console.warn('  [WARN] PDF non generato: serve Microsoft Word o LibreOffice installato.');
  console.warn('         Il .docx e\' comunque pronto. Usa --no-pdf per non tentare la conversione.');
  return null;
}

module.exports = { exportToPdf, exportWithWord, exportWithLibreOffice };
