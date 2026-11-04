# Copertina e Sommario

Descrive le prime due pagine dei documenti, comuni a tutte le certificazioni. Né l'una né
l'altra si scrivono a mano: la copertina è generata dai dati di `cover` nella
`script/config.js` della certificazione, il Sommario da Word a partire dalle intestazioni dei
`.md`.

---

## Pagina 1 — Copertina

Resa da `coverPage(cover)` nel motore condiviso. Tutti i testi arrivano dalla configurazione:

| Elemento | Da | Stile |
|---|---|---|
| Logo (opzionale) | `cover.logo` — nome file, larghezza, altezza | centrato sopra il titolo; se il file manca la copertina degrada a solo testo, con un avviso |
| Titolo | `cover.title` | Calibri 48pt grassetto `titleBlue`, centrato |
| Sottotitolo | `cover.subtitle` | Calibri 26pt grassetto `sectionBlue`, centrato |
| Descrizione | `cover.tagline` | Calibri 13pt corsivo `subtle`, centrato |

Un deliverable può sovrascrivere una parte della copertina: la pocket guide di TA-004, per
esempio, cambia solo la `tagline` tramite `deliverables.pocket.cover`.

Valori attuali:

| | AZ-104 | TA-004 |
|---|---|---|
| Titolo | `AZ-104` | `TA-004` |
| Sottotitolo | Amministratore di Microsoft Azure | HashiCorp Certified: Terraform Associate |
| Descrizione | Note di studio e riassunti del percorso di apprendimento Microsoft Learn | Note di studio basate sulla exam content list e sui tutorial HashiCorp Developer |
| Logo | nessuno (solo testo) | `img/Cover/terraform-logo.png`, 600×600 px reso a 150×150 |

Il logo di TA-004 è un PNG a sfondo trasparente (colore `#7B42BC`) disegnato dalle coordinate
dell'icona ufficiale `terraform-color-24.svg` del pacchetto `@hashicorp/flight-icons`.

---

## Pagina 2 — Sommario (auto-generato)

È un **campo TOC nativo di Word**, non un elenco scritto a mano. Le voci derivano dal livello
di struttura delle intestazioni:

| Voce del Sommario | Deriva da | Stile |
|---|---|---|
| Titolo macro-modulo | `#` (livello 0) | `TOC1` — 12pt grassetto `titleBlue` |
| Riga di sezione | `##` (livello 1) | `TOC2` — 11pt grassetto `sectionBlue` |
| Riga di sottosezione | `###` (livello 2) | `TOC3` — 10pt `tocEntry` |

Numeri di pagina e dot leader li calcola Word, o LibreOffice nel container prima di esportare il PDF: mai la libreria `docx`.

> **Per modificare il Sommario** non si tocca nulla qui: si modificano le intestazioni `#`,
> `##`, `###` nei `.md` e si rigenera il documento.

**Nota tecnica da non perdere**: i campi `PAGEREF` manuali non sono un'alternativa al campo
TOC nativo. La classe `Bookmark` di `docx` assegna a tutti i segnalibri lo stesso `w:id`, così
Word risolve ogni `PAGEREF` a "pagina 1". È il vincolo che motiva l'uso del campo nativo.

Dettagli di stile e di impaginazione: [STYLE_GUIDE.md](STYLE_GUIDE.md).
