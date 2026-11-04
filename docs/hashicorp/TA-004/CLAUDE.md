# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **Terraform Associate (004)** notes, in `docs/hashicorp/TA-004/`. For the monorepo-level rules — shared tooling, how to add a certification, the gotchas common to every generator — see the root [CLAUDE.md](../../../CLAUDE.md).

## What this folder is

Study notes for the **HashiCorp Certified: Terraform Associate (004)** certification, written in **Italian**, rendered to a styled Word `.docx` (and then exported to **PDF**) by a single Node.js script. Content lives in `chapters/MODULE_1.md` … `chapters/MODULE_8.md` — one module per exam objective, following the official [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) and [study path](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004), with each section citing its source page. `script/create_ta004.js` parses them and emits the document.

`pocketguide/` holds a **second, independent deliverable**: a condensed pocket guide in 10 chapters (`01-…md` … `10-Appendice-CLI.md`), rendered by the same script with `--pocket`.

## Folder layout

- `chapters/` — `MODULE_1.md` … `MODULE_8.md` (the document content, single source of truth) plus `COVER_TOC.md` (documents the cover/Sommario styling).
- `pocketguide/` — the pocket-guide chapters; the `--pocket` mode reads **every** `.md` in here, sorted by filename (hence the `NN-` prefixes).
- `script/create_ta004.js` — the generator (Markdown parser → `.docx`, then `.docx` → `.pdf`).
- `style/STYLE_GUIDE.md` — styling spec + the Markdown marker vocabulary the parser recognizes.
- `img/` — figures, in per-module subfolders (`img/Module 3 - Core workflow/`), plus `img/Cover/terraform-logo.png` used on the cover page; resolved by basename (see gotchas).
- The generated `TA-004_*.docx` (and the `.pdf` exported from each) are written to **this folder** (`docs/hashicorp/TA-004/`) and are gitignored build artifacts.
- Shared tooling lives at the **repo root**: `package.json` (the `docx` dependency + the `build:ta004*` scripts), `.gitignore`, `.gitattributes`.

## Core architecture principle — read this first

**The `chapters/MODULE_*.md` files are the single source of truth. `script/create_ta004.js` contains NO document text — it only parses Markdown and renders styling.** To change the document, edit the `.md` and regenerate. Only touch the JS to change styles, parser logic, or the marker vocabulary. Do not hardcode prose into the JS.

`script/create_ta004.js` is one self-contained file with four layers:
1. **Render helpers** (`body`, `bodyLead`, `h2`, `h3`, `stepTitle`, `bullet`, `caption`, `infoBox`, `figImg`, `makeTable`, `codeBlock`, `moduloTitle`, `moduloIntro`, `tocTitle`, `coverPage`) — each returns `docx` `Paragraph`/`Table` objects with fixed fonts/colors (palette in the `C` object, sizes in `SZ`). Styling specs are mirrored in [style/STYLE_GUIDE.md](style/STYLE_GUIDE.md). `h2`/`h3`/`moduloTitle` carry an `outlineLevel` (1/2/0) so Word can build the TOC.
2. **`parseModule(md, modNum)`** — the heart. Line-by-line state machine: strips a leading BOM, extracts the `# Modulo N — Title` (the `Modulo N — ` prefix is stripped) and italic intro, then dispatches each line to a marker branch (headings, images, tables, blockquote→infoBox, fenced/indented code, bullets, inline links). Returns `{ title, headings, elements, … }`.
3. **`main()`** — parses the sources and assembles the doc as **two sections**: (1) cover + Sommario, no footer page number; (2) module bodies, with a centered page number in the footer (restarting at 1). A page break separates each module. Paths (`img/`, `chapters/`, `pocketguide/`, output) are resolved against **this certification folder** via `ROOT = path.join(__dirname, '..')` — which is exactly what lets the generator run unchanged inside the monorepo, and from any working directory. After writing the `.docx`, `main()` calls **`exportToPdf()`** (unless `--no-pdf`).
4. **PDF export** (`exportToPdf` / `exportWithWord` / `exportWithLibreOffice`) — converts the just-written `.docx`. Prefers **Microsoft Word** via COM (a temp PowerShell script: open read-only → `Fields.Update()` + update each `TablesOfContents` + `Repaginate()` → `ExportAsFixedFormat` to PDF), so the Sommario/TOC and page numbers are baked in. Falls back to **LibreOffice** `soffice --headless`. Neither installed → the `.docx` still ships and only a warning is printed.

## Build / run

Needs Node.js (v18+) and the single dependency `docx`, installed once from the **repo root** (`npm install`) and shared by every certification.

```bash
npm install                             # one-time, from the repo root (node_modules/ is gitignored)

# the script resolves img/, chapters/ and its output relative to itself, so any cwd works
npm run build:ta004                     # full doc    -> TA-004_Note_di_Studio.docx (+ .pdf)
npm run build:ta004:toc                 # cover+TOC   -> TA-004_Sommario.docx (+ .pdf)
npm run build:ta004:pocket              # pocket guide-> TA-004_Pocket_Guide.docx (+ .pdf)

# flags not covered by the npm scripts:
node docs/hashicorp/TA-004/script/create_ta004.js --module 4   # one module -> TA-004_Modulo_4.docx (N = 1..8)
node docs/hashicorp/TA-004/script/create_ta004.js --no-pdf     # any of the above, but skip the PDF export
```

All outputs land in `docs/hashicorp/TA-004/`. There are no tests and no linter.

## Markdown marker conventions (what the parser recognizes)

Full reference: [style/STYLE_GUIDE.md](style/STYLE_GUIDE.md). The essentials:

- First line `# Modulo N — Title`, optional italic `_intro_` underneath.
- `## N.M — Title` → h2 + TOC entry; `### N.M.K — Title` → h3 + TOC sub-entry.
- `**Title** _(stepTitle)_` → bold step heading. Trailing `_(tag)_` markers (`stepTitle`, `caption`, `infoBox`) drive rendering; a line that is *only* a marker like `_(h2: …)_` is a descriptive annotation and is ignored.
- `![alt](img/file.png) _(dimensioni: W×H px)_` → image; a following `*caption*` or `… _(caption)_` line becomes the figure caption.
- `> **Label**: text` followed by `_(infoBox)_` → blue-bordered info box.
- Plain Markdown `| a | b |` tables (with a `|---|` separator row) render inline; `**x**` cells become bold.
- Inline Markdown links `[text](url)` render as real Word hyperlinks (`ExternalHyperlink`) — this is how the source-page citations stay clickable.
- `[TABELLA: fnName]` is supported by the parser but **`TABLE_FUNCS` is empty here**: every table in these notes is a plain Markdown table. Add a JS table function only if a table genuinely cannot be expressed in Markdown.

## Non-obvious gotchas

Plus the shared ones in the root [CLAUDE.md](../../../CLAUDE.md).

- **Save `chapters/MODULE_*.md` as UTF-8 without BOM.** A BOM breaks `#` title detection and the module fails to parse. (The parser strips one leading BOM defensively, but don't rely on it.)
- **Images resolve by basename, not by path.** `resolveImg` builds a recursive index of `img/` and matches the filename only — so `img/file.png` in the `.md` finds `img/Module 3 - …/file.png`. The subfolder in the path doesn't matter; the basename must be unique across `img/`.
- **Display size comes from the `_(dimensioni: W×H px)_` marker**, then `figImg` clamps the image to stay inside the text column and reduce page-break gaps.
- **The cover expects `terraform-logo.png`** somewhere under `img/` (it lives in `img/Cover/`). If it is missing the cover degrades gracefully to text only — no error.
- **`--pocket` reads the whole `pocketguide/` folder** in filename order and uses a different cover subtitle; adding a chapter there means adding a correctly-numbered file, nothing else. The module labels in `MODULI_LABELS` apply to the 8 `chapters/` modules.
- **Layout glue is intentional.** `keepNext` and the lead-in machinery keep an intro sentence attached to the block that follows it, and tables/figures attached to their captions. Images deliberately do *not* glue the preceding paragraph (a tall figure would otherwise drag text down). Preserve this behavior when editing the parser.
- **The Sommario is a native Word TOC field** (`TableOfContents`), built from heading `outlineLevel`s — never hand-maintain it. Page numbers (TOC and footer) are computed by Word on open (`features.updateFields`); the `docx` library does not paginate, so they appear only after Word updates the fields (`F9`). `chapters/COVER_TOC.md` documents the cover/Sommario styling.
- **The PDF export needs an external engine — it is not pure Node.** Word COM is interactive-session only (won't work headless/as a service); the LibreOffice fallback does not refresh the TOC, so its page numbers may be stale.
- Figure numbers (`Figura N`) are written by hand in the `.md` captions and run continuously across the document — renumber the ones that follow when inserting a figure.

## Workflow

Changes go branch → PR → merge into `main` (commit messages are Italian, Conventional-Commits style: `feat:`, `fix:`, `chore:`). After editing a `chapters/MODULE_*.md`, regenerate the `.docx` (`npm run build:ta004`) to verify.
