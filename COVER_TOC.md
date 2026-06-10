# AZ-104 — Copertina e Sommario

Descrive la **Pagina 1 (Copertina)** del documento Word.
Il **Sommario** (Pagina 2) è ora **generato automaticamente** da `create_az104.js`
leggendo le intestazioni dei file `MODULE_*.md` e **non va più mantenuto a mano**.

---

## Pagina 1 — Copertina

Generata dalla funzione `coverPage()` in `create_az104.js` (contenuto statico):

- **AZ-104** — Calibri 48pt grassetto #1B3A6B, centrato
- **Amministratore di Microsoft Azure** — Calibri 26pt grassetto #0078D4, centrato
- _Note di studio e riassunti del percorso di apprendimento Microsoft Learn_ — Calibri 13pt corsivo #555555, centrato

---

## Pagina 2 — Sommario (auto-generato)

Costruito dalla funzione `buildSommario()` a partire dalle intestazioni di ogni `MODULE_*.md`:

| Voce del Sommario | Deriva da | Stile |
|---|---|---|
| Titolo macro-modulo | `# Modulo N — Titolo` (il prefisso "Modulo N — " viene rimosso) | `tocMacro` #1B3A6B 12pt grassetto |
| Riga sezione | ogni `## N.M — Titolo` | `tocHeading` #0078D4 11pt grassetto |
| Riga sottosezione (con dot-leader) | ogni `### N.M.K — Titolo` | `tocEntry` #2D5F8A 10pt |

I moduli ancora senza sottosezioni (4, 5, 6) compaiono solo come titolo macro.

> **Per modificare il Sommario** non si tocca questo file: si modificano le intestazioni
> `#`, `##`, `###` nei file `MODULE_*.md` e si rigenera il documento.
