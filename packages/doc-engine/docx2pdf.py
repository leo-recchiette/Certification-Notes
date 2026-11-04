#!/usr/bin/env python3
"""
.docx -> .pdf con LibreOffice, AGGIORNANDO il Sommario prima di esportare.

Perche' esiste: `soffice --convert-to pdf` esporta il documento cosi' com'e', e il
Sommario del motore e' un campo TOC nativo che nessuno ha ancora calcolato: nel PDF
uscirebbe vuoto o senza numeri di pagina. Qui si pilota LibreOffice via UNO: si apre
il documento, si aggiornano gli indici dopo aver forzato l'impaginazione, e solo
allora si esporta.

Uso:   python3 docx2pdf.py <input.docx> <output.pdf>
Esito: l'ultima riga su stdout e' un JSON con il riepilogo
       ({"tocEntries": 627, "pages": 412, "seconds": 38.1, ...}); i log vanno su stderr.

Codici d'uscita: 0 ok, 2 uso, 3 avvio/connessione a LibreOffice, 4 caricamento,
                 5 aggiornamento/esportazione, 124 tempo scaduto.

Variabili d'ambiente:
  CERTNOTES_PDF_TIMEOUT    secondi concessi all'intera conversione (default 300;
                           AZ-104, il documento piu' pesante, ne richiede circa 6)
  CERTNOTES_PDF_LOSSLESS   1 = immagini senza ricompressione JPEG (default 1)
  CERTNOTES_PDF_DIAG       1 = stampa su stderr le proprieta' degli indici
"""

import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from pathlib import Path

import uno
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException

EXIT_USAGE, EXIT_START, EXIT_LOAD, EXIT_EXPORT, EXIT_TIMEOUT = 2, 3, 4, 5, 124


class Failure(Exception):
    """Errore con il codice d'uscita da restituire."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def log(message):
    print(f"  [docx2pdf] {message}", file=sys.stderr, flush=True)


def prop(name, value):
    p = PropertyValue()
    p.Name = name
    p.Value = value
    return p


def kill_group(pgid):
    """Uccide l'intero gruppo di processi di soffice (soffice -> oosplash -> soffice.bin)."""
    try:
        os.killpg(pgid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass


def connect(pipe, proc, deadline_s):
    """Si collega a soffice. Il primo avvio crea il profilo e puo' richiedere decine di secondi."""
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", local)
    url = f"uno:pipe,name={pipe};urp;StarOffice.ComponentContext"
    end = time.monotonic() + deadline_s
    while True:
        try:
            return resolver.resolve(url)
        except NoConnectException:
            if proc.poll() is not None:
                raise Failure(EXIT_START, f"LibreOffice e' terminato all'avvio (codice {proc.returncode})")
            if time.monotonic() > end:
                raise Failure(EXIT_START, f"nessuna connessione a LibreOffice entro {deadline_s:.0f} s")
            time.sleep(0.3)


def force_layout(doc):
    """
    LibreOffice raccoglie per il Sommario solo i paragrafi gia' impaginati: in headless
    l'impaginazione e' pigra, quindi la si forza prima di ogni aggiornamento degli indici.
    """
    doc.reformat()
    try:
        doc.getCurrentController().getViewCursor().jumpToLastPage()
    except Exception:  # documento senza vista: reformat() basta
        pass


def toc_entries(index):
    """Numero di voci del Sommario: righe non vuote dell'ancora, meno l'eventuale titolo."""
    lines = [l for l in index.getAnchor().getString().splitlines() if l.strip()]
    title = (getattr(index, "Title", "") or "").strip()
    if title and lines and lines[0].strip() == title:
        lines = lines[1:]
    return len(lines)


def diagnose(indexes):
    for i in range(indexes.getCount()):
        idx = indexes.getByIndex(i)
        names = [n for n in ("Title", "CreateFromOutline", "Level", "CreateFromLevelParagraphStyles",
                             "CreateFromMarks", "IsProtected") if idx.getPropertySetInfo().hasPropertyByName(n)]
        values = {n: idx.getPropertyValue(n) for n in names}
        log(f"indice {i}: ContentIndex={idx.supportsService('com.sun.star.text.ContentIndex')} {values}")


def convert(src, dst, budget_s, timings):
    work = Path(tempfile.mkdtemp(prefix="certnotes-pdf-"))
    profile = work / "profile"
    # Staging: si lavora su una copia in /tmp. Cosi' nel mount non compaiono mai i file
    # di lock .~lock.<nome>.docx# (dopo un kill resterebbero sull'host) e si evitano i
    # problemi di lock su filesystem condivisi (virtiofs, 9p).
    staged = work / src.name
    out = work / (src.stem + ".pdf")
    shutil.copyfile(src, staged)

    pipe = f"certnotes_{uuid.uuid4().hex}"
    proc = subprocess.Popen(
        ["soffice", "--headless", "--invisible", "--norestore", "--nologo", "--nodefault",
         "--nolockcheck", f"-env:UserInstallation={profile.as_uri()}",
         f"--accept=pipe,name={pipe};urp;StarOffice.ComponentContext"],
        stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        start_new_session=True)   # gruppo proprio: lo si puo' uccidere tutto insieme
    pgid = proc.pid

    # Watchdog: una chiamata UNO bloccata non restituisce mai il controllo a Python, quindi
    # un semplice signal.alarm non basterebbe. Il timer uccide LibreOffice, la chiamata
    # bloccata fallisce, e il flusso arriva al finally.
    expired = threading.Event()

    def on_timeout():
        expired.set()
        kill_group(pgid)

    timer = threading.Timer(budget_s, on_timeout)
    timer.daemon = True
    timer.start()

    doc = desktop = None
    t = time.monotonic()
    try:
        try:
            ctx = connect(pipe, proc, min(90.0, budget_s))
            timings["start"] = round(time.monotonic() - t, 1); t = time.monotonic()
            desktop = ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
            doc = desktop.loadComponentFromURL(staged.as_uri(), "_blank", 0, (
                prop("Hidden", True), prop("ReadOnly", True),
                prop("MacroExecutionMode", 0), prop("UpdateDocMode", 0)))
            if doc is None:
                raise Failure(EXIT_LOAD, f"LibreOffice non e' riuscito ad aprire {src.name}")
            timings["load"] = round(time.monotonic() - t, 1); t = time.monotonic()
        except Failure:
            raise
        except Exception as e:
            raise Failure(EXIT_TIMEOUT if expired.is_set() else EXIT_LOAD, f"caricamento: {e}")

        try:
            indexes = doc.getDocumentIndexes()
            if os.environ.get("CERTNOTES_PDF_DIAG") == "1":
                diagnose(indexes)
            # Due passate. Il Sommario sta nella sezione 1 e la numerazione del corpo riparte
            # da 1 nella sezione 2, quindi la crescita del Sommario non sposta i numeri del
            # corpo: la seconda passata e' un'assicurazione contro un'impaginazione incompleta.
            for n in (1, 2):
                force_layout(doc)
                for i in range(indexes.getCount()):
                    indexes.getByIndex(i).update()
                timings[f"pass{n}"] = round(time.monotonic() - t, 1); t = time.monotonic()
            force_layout(doc)
            entries = sum(toc_entries(indexes.getByIndex(i)) for i in range(indexes.getCount()))
            try:
                pages = doc.getCurrentController().getPropertyValue("PageCount")
            except Exception:
                pages = None

            lossless = os.environ.get("CERTNOTES_PDF_LOSSLESS", "1") == "1"
            filter_data = uno.Any("[]com.sun.star.beans.PropertyValue", (
                prop("UseLosslessCompression", lossless),
                prop("ExportBookmarks", True),
                prop("IsSkipEmptyPages", True),
            ))
            doc.storeToURL(out.as_uri(), (
                prop("FilterName", "writer_pdf_Export"),
                prop("FilterData", filter_data),
                prop("Overwrite", True)))
            timings["export"] = round(time.monotonic() - t, 1)
        except Failure:
            raise
        except Exception as e:
            raise Failure(EXIT_TIMEOUT if expired.is_set() else EXIT_EXPORT, f"aggiornamento/export: {e}")

        if not out.exists() or out.stat().st_size == 0:
            raise Failure(EXIT_EXPORT, "LibreOffice non ha prodotto il PDF")
        # Scrittura atomica: sull'host non resta mai un PDF troncato.
        tmp = dst.with_name(dst.name + ".tmp")
        shutil.copyfile(out, tmp)
        os.replace(tmp, dst)
        return {"tocEntries": entries, "indexes": indexes.getCount(), "pages": pages}
    finally:
        timer.cancel()
        for close in (lambda: doc and doc.close(True), lambda: desktop and desktop.terminate()):
            try:
                close()
            except Exception:   # DisposedException alla chiusura e' normale
                pass
        try:
            proc.wait(timeout=30)
        except subprocess.TimeoutExpired:
            pass
        kill_group(pgid)        # nessun soffice.bin orfano, in ogni caso
        shutil.rmtree(work, ignore_errors=True)
        if expired.is_set():
            raise Failure(EXIT_TIMEOUT, f"tempo scaduto dopo {budget_s:.0f} s")


def main():
    if len(sys.argv) != 3:
        print("Uso: docx2pdf.py <input.docx> <output.pdf>", file=sys.stderr)
        return EXIT_USAGE
    src = Path(sys.argv[1]).resolve()
    dst = Path(sys.argv[2]).resolve()
    if not src.is_file():
        print(f"File non trovato: {src}", file=sys.stderr)
        return EXIT_USAGE

    # SIGTERM (es. timeout di Node): si esce passando dal finally, che chiude LibreOffice.
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))

    budget = float(os.environ.get("CERTNOTES_PDF_TIMEOUT", "300"))
    timings = {}
    t0 = time.monotonic()
    try:
        result = convert(src, dst, budget, timings)
    except Failure as f:
        log(str(f))
        return f.code
    result["seconds"] = round(time.monotonic() - t0, 1)
    result["timings"] = timings
    print(json.dumps(result), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
