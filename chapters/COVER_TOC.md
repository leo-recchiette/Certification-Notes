# TA-004 — Copertina e Sommario

Descrive la **Pagina 1 (Copertina)** del documento Word. Il **Sommario** (Pagina 2) è **generato automaticamente** da `create_ta004.js` leggendo le intestazioni dei file `MODULE_*.md` e **non va mantenuto a mano**.

---

## Pagina 1 — Copertina

Generata dalla funzione `coverPage()` in `create_ta004.js` (contenuto statico):

- **TA-004** — Calibri 48pt grassetto #2E1A59, centrato
- **HashiCorp Certified: Terraform Associate** — Calibri 26pt grassetto #7B42BC, centrato
- _Note di studio basate sulla exam content list e sui tutorial HashiCorp Developer_ — Calibri 13pt corsivo #555555, centrato

---

## Pagina 2 — Sommario (auto-generato)

| Voce del Sommario | Deriva da | Stile |
|---|---|---|
| Titolo macro-modulo | `# Modulo N — Titolo` (prefisso rimosso) | `tocMacro` #2E1A59 12pt grassetto |
| Riga sezione | ogni `## N.M — Titolo` | `tocHeading` #7B42BC 11pt grassetto |
| Riga sottosezione | ogni `### N.M.K — Titolo` | `tocEntry` #5C4EE5 10pt |

> Per modificare il Sommario si modificano le intestazioni `#`, `##`, `###` nei file `MODULE_*.md` e si rigenera il documento.