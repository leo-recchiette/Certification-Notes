

raw
SKILL.md
---
name: mslearn-section-fetcher
description: >
  Recupera contenuti da Microsoft Learn e li aggiunge come nuova sezione al documento
  AZ-104 nel repository GitHub lx2pwnd/az-104-appunti. Usa questa skill ogni volta
  che Leonardo vuole aggiungere una sezione o capitolo agli appunti AZ-104 fornendo
  URL di Microsoft Learn, con o senza immagini. Trigger su frasi come:
  "aggiungi la sezione", "aggiungi il capitolo", "fetch da microsoft learn",
  "aggiungi al documento", "nuova sezione AZ-104", "aggiorna il modulo con",
  "inserisci la sezione N.N", "scarica e aggiungi", "fetch microsoft learn e inserisci".
  Trigger anche se l'utente fornisce link learn.microsoft.com e chiede di inserirli
  negli appunti o nel documento Word.
---
 
# Microsoft Learn → AZ-104 Section Fetcher
 
Recupera contenuti da uno o più URL di Microsoft Learn, li riassume e li integra
come nuova sezione numerata nel documento `.docx` del modulo AZ-104 corrispondente,
scaricando e ridimensionando le immagini in linea con le altre già presenti nel repo.
 
---
 
## Input attesi dall'utente
 
| Parametro             | Esempio                                                     |
|-----------------------|-------------------------------------------------------------|
| Numero sezione        | `3.5`                                                       |
| Titolo sezione        | `"Gestire e controllare il flusso del traffico..."`         |
| URL delle sotto-sezioni | Lista di URL `learn.microsoft.com/it-it/training/...`     |
| Branch (opzionale)    | `main` (default)                                            |
 
Le sotto-sezioni vengono numerate automaticamente: la prima URL diventa `3.5.1`,
la seconda `3.5.2`, ecc.
 
---
 
## Workflow completo
 
### Step 1 — Determina modulo e branch di destinazione
 
Dal numero di sezione (es. `3.5`) estrai il numero di modulo (es. `3`).
Usa `claude:get_file_contents` per listare i branch del repo:
- `owner=lx2pwnd`, `repo=az-104-appunti`
- Identifica il branch corretto: di default `main`, altrimenti usa quello indicato dall'utente.
Individua il file Markdown del modulo: tipicamente `MODULE_3.md` (o il nome effettivo
nel repo). Scaricalo per capire la struttura esistente (heading level, stile, numerazione).
 
```
MODULE_N.md  →  /home/claude/az104_fetch/MODULE_N.md
```
 
### Step 2 — Fetch dei contenuti da Microsoft Learn
 
Per ogni URL fornita, usa `web_fetch` per recuperare il contenuto HTML della pagina.
**Strategia di fetch:**
 
```
Tool:     web_fetch
URL:      <url fornita dall'utente>
Metodo:   markdown  (html_extraction_method="markdown")
```
 
Per ogni pagina estratta:
1. Rimuovi navigation, breadcrumb, sidebar, footer, "Next Steps" e link non pertinenti.
2. **Riassumi e riscrivi** il contenuto in italiano chiaro e didattico, mantenendo:
   - Tutti i concetti tecnici e le definizioni
   - Le tabelle di confronto o riepilogo
   - I passaggi di configurazione/procedura
   - I nomi di servizi Azure in originale (inglese)
3. Numera la sotto-sezione progressivamente: `N.M.1`, `N.M.2`, ecc.
4. Raccogli gli URL delle immagini trovate nella pagina (tag `<img>` o markdown `![](url)`).
**Formato Markdown output per ogni sotto-sezione:**
 
```markdown
### N.M.K — Titolo della sotto-sezione
 
<contenuto riscritto e riassunto in italiano>
 
#### Concetti chiave
- Punto 1
- Punto 2
 
#### [Tabella se presente]
| Colonna A | Colonna B |
|-----------|-----------|
| ...       | ...       |
```
 
### Step 3 — Download e ridimensionamento immagini
 
#### 3a — Analisi dimensioni immagini esistenti nel repo
 
Prima di scaricare le nuove immagini, analizza quelle già presenti nel modulo
per determinare le dimensioni standard:
 
```bash
# Scarica 2-3 immagini campione dalla cartella img del modulo
# Es: img/Module 3 - <titolo>/
# Poi misura le dimensioni con Python
python3 - <<'EOF'
from PIL import Image
import os
 
img_dir = "/home/claude/az104_fetch/img_existing"
sizes = []
for f in os.listdir(img_dir):
    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        with Image.open(os.path.join(img_dir, f)) as im:
            sizes.append(im.size)
 
if sizes:
    avg_w = int(sum(s[0] for s in sizes) / len(sizes))
    avg_h = int(sum(s[1] for s in sizes) / len(sizes))
    print(f"Dimensione media: {avg_w}x{avg_h}")
    print(f"Larghezza max: {max(s[0] for s in sizes)}")
EOF
```
 
Se non riesci a leggere le immagini esistenti, usa come default: **larghezza 800px**,
altezza proporzionale.
 
#### 3b — Download immagini nuove
 
Per ogni immagine trovata nelle pagine Microsoft Learn:
 
```bash
# Crea la cartella destinazione (nome uguale alla cartella img del modulo)
DEST="/home/claude/az104_fetch/img_new"
mkdir -p "$DEST"
 
# Scarica con curl (gestisce redirect e header necessari)
curl -sL --max-filesize 10M \
     -H "User-Agent: Mozilla/5.0" \
     -o "$DEST/<nome_file>" \
     "<url_immagine>"
```
 
**Filtro immagini da escludere:**
- Icone UI generiche (< 50px)
- Immagini di avatar o profilo
- Banner/hero decorativi senza contenuto tecnico
- Immagini non scaricabili (redirect a login, 403, ecc.)
#### 3c — Ridimensionamento
 
```python
from PIL import Image
import os
 
TARGET_WIDTH = 800   # da adattare in base all'analisi Step 3a
IMG_NEW_DIR  = "/home/claude/az104_fetch/img_new"
IMG_OUT_DIR  = "/home/claude/az104_fetch/img_resized"
os.makedirs(IMG_OUT_DIR, exist_ok=True)
 
for fname in os.listdir(IMG_NEW_DIR):
    if not fname.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
        continue
    src = os.path.join(IMG_NEW_DIR, fname)
    dst = os.path.join(IMG_OUT_DIR, fname)
    try:
        with Image.open(src) as im:
            w, h = im.size
            if w > TARGET_WIDTH:
                ratio = TARGET_WIDTH / w
                new_size = (TARGET_WIDTH, int(h * ratio))
                im = im.resize(new_size, Image.LANCZOS)
            # Converti sempre in PNG per uniformità
            out_name = os.path.splitext(fname)[0] + ".png"
            im.save(os.path.join(IMG_OUT_DIR, out_name), "PNG")
            print(f"✓ {fname} → {out_name} ({im.size[0]}x{im.size[1]})")
    except Exception as e:
        print(f"✗ {fname}: {e}")
```
 
Installa Pillow se mancante: `pip install Pillow --break-system-packages --quiet`
 
### Step 4 — Costruzione del Markdown della nuova sezione
 
Assembla il Markdown finale della sezione completa:
 
```markdown
## N.M — Titolo della sezione principale
 
### N.M.1 — Titolo sotto-sezione 1
 
<contenuto riassunto>
 
![Descrizione immagine](img/Module N - <titolo>/nome_immagine.png)
 
### N.M.2 — Titolo sotto-sezione 2
 
<contenuto riassunto>
 
### N.M.K — ...
```
 
**Regole di stile da rispettare** (coerenti con il resto del documento):
- Heading `##` per la sezione principale (es. `3.5`)
- Heading `###` per le sotto-sezioni (es. `3.5.1`)
- Heading `####` per eventuali sotto-sotto-sezioni o concetti chiave
- Testo in italiano, termini tecnici Azure in inglese
- Nomi propri di servizi in **grassetto** alla prima occorrenza
- Blocchi di codice con triple backtick e linguaggio specificato
- Tabelle in Markdown standard
### Step 5 — Integrazione nel file MODULE_N.md
 
Scarica il file `MODULE_N.md` corrente dal repo (se non già scaricato allo Step 1).
 
Individua il punto di inserimento corretto:
- Cerca il pattern `## N.M` o la fine del capitolo `N` nel file.
- Inserisci la nuova sezione **dopo l'ultima sotto-sezione esistente del capitolo N**.
```bash
# Append oppure inserimento con Python a seconda della posizione
python3 - <<'EOF'
import re
 
with open("/home/claude/az104_fetch/MODULE_N.md", "r", encoding="utf-8") as f:
    content = f.read()
 
new_section = """
## 3.5 — Titolo della sezione
...
"""
 
# Inserisci prima del prossimo capitolo o in fondo
match = re.search(r'^## \d+\.\d+', content, re.MULTILINE)
# ... logica di inserimento ...
 
with open("/home/claude/az104_fetch/MODULE_N.md", "w", encoding="utf-8") as f:
    f.write(content)
print("Inserimento completato.")
EOF
```
 
### Step 6 — Push su GitHub
 
Usa `claude:create_or_update_file` per aggiornare il file Markdown sul repo:
 
```
owner=lx2pwnd
repo=az-104-appunti
path=MODULE_N.md
branch=<branch>
message="feat: aggiungi sezione N.M — <titolo>"
content=<contenuto base64>
sha=<sha del file corrente>
```
 
Per ogni immagine ridimensionata, usa `create_or_update_file`:
 
```
path=img/Module N - <titolo>/<nome_file>.png
message="chore: aggiungi immagini sezione N.M"
content=<contenuto base64>
```
 
### Step 7 — Rigenera il documento .docx
 
Dopo il push, segui il workflow della skill `az104-module-viewer` per rigenerare
il file `.docx` aggiornato e presentarlo all'utente.
 
In sintesi:
1. Scarica `create_az104.js` e `MODULE_N.md` aggiornato dal repo.
2. Scarica tutte le immagini del modulo (incluse le nuove).
3. Esegui `node create_az104.js --module N`.
4. Copia il `.docx` in `/mnt/user-data/outputs/` e chiama `present_files`.
---
 
## Gestione errori
 
| Errore                              | Soluzione                                                            |
|-------------------------------------|----------------------------------------------------------------------|
| URL Microsoft Learn non raggiungibile | Avvisa l'utente, salta quella sotto-sezione e continua             |
| Immagine non scaricabile (403/404)  | Skippa l'immagine, aggiungi nota nel testo                          |
| Pillow non installato               | `pip install Pillow --break-system-packages`                        |
| File MODULE_N.md non trovato        | Chiedi all'utente di verificare il branch o il nome del file        |
| Push fallito (SHA mismatch)         | Ri-fetch SHA corrente e ritenta                                     |
| Sezione già esistente nel file      | Avvisa l'utente e chiedi conferma prima di sovrascrivere            |
 
---
 
## Note importanti
 
- **Lingua**: tutto il testo prodotto è in **italiano**, salvo termini tecnici Azure.
- **Qualità del riassunto**: non è una traduzione letterale — è una riscrittura didattica.
  Spiega *perché* un concetto esiste, non solo *cosa* fa.
- **Immagini**: includi solo quelle con valore tecnico reale (diagrammi, screenshot
  di configurazione, architetture). Escludi decorazioni.
- **Coerenza heading**: verifica sempre i livelli di heading già usati nel file
  prima di scrivere la nuova sezione.
- **Branch di default**: se non specificato, usa sempre `main`.