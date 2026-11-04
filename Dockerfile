# Immagine per generare i documenti: .md -> .docx -> .pdf, tutto nel container.
#
# Contiene SOLO la toolchain (Node, LibreOffice, i font) e le dipendenze npm.
# Contenuti (docs/) e motore (packages/) arrivano dall'host a runtime, tramite i mount
# di compose.yaml: modificarli non richiede di ricostruire l'immagine. Il codice del
# motore volutamente NON viene copiato qui: un motore "congelato" nell'immagine verrebbe
# usato in silenzio se mancasse il mount.
#
# Ricostruire (docker compose build) solo se cambiano questo file o le dipendenze.

# Tag fissato: un LibreOffice piu' nuovo cambia l'impaginazione del PDF.
FROM node:22.23.4-trixie-slim

# - libreoffice-writer-nogui + python3-uno: il PDF, con il Sommario aggiornato via UNO
#   (vedi packages/doc-engine/docx2pdf.py). In Linux Word non esiste.
# - fonts-crosextra-carlito: Carlito e' metricamente compatibile con Calibri (stesse
#   larghezze, quindi stessi a capo); fonts-liberation: Liberation Mono per Courier New;
#   fonts-dejavu-core: ripiego per i glifi che Carlito non ha (frecce, disegno di alberi).
# - poppler-utils: pdftotext e pdffonts, usati da bin/check-pdf.js.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libreoffice-writer-nogui python3-uno \
      fonts-crosextra-carlito fonts-liberation fonts-dejavu-core \
      poppler-utils \
 && rm -rf /var/lib/apt/lists/*

# HOME=/tmp: con un uid qualsiasi la home dell'utente potrebbe non essere scrivibile
# (log di npm, cache dei font). Il profilo di LibreOffice e' comunque temporaneo.
ENV LANG=C.UTF-8 \
    HOME=/tmp \
    PYTHONDONTWRITEBYTECODE=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    CERTNOTES_PDF_ENGINE=uno

WORKDIR /app

# Solo i manifest: bastano a npm ci per installare le dipendenze e per creare il link
# del workspace (node_modules/@certification-notes/doc-engine -> ../../packages/doc-engine),
# che a runtime puntera' al motore montato dall'host.
COPY package.json package-lock.json ./
COPY packages/doc-engine/package.json packages/doc-engine/
RUN npm ci --omit=dev --no-audit \
 && mkdir -p /opt/certnotes \
 && cp package.json /opt/certnotes/package.json \
 && cp packages/doc-engine/package.json /opt/certnotes/doc-engine.package.json

COPY docker/entrypoint.sh /usr/local/bin/certnotes
RUN chmod 0755 /usr/local/bin/certnotes

USER node
ENTRYPOINT ["/usr/local/bin/certnotes"]
