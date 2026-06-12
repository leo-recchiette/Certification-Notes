# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Study notes for the **Microsoft AZ-104 (Azure Administrator)** certification, written in **Italian**, rendered to a styled Word `.docx` by a single Node.js script. Content lives in `chapters/MODULE_1.md` … `chapters/MODULE_6.md` (all six modules are complete); `script/create_az104.js` parses them and emits the document.

## Repo layout

- `chapters/` — `MODULE_1.md` … `MODULE_6.md` (the document content, single source of truth) plus `COVER_TOC.md` (documents the cover/Sommario styling).
- `script/create_az104.js` — the generator (Markdown parser → `.docx`).
- `style/STYLE_GUIDE.md` — styling spec + the Markdown marker vocabulary the parser recognizes.
- `img/` — figures, in per-module subfolders (`img/Module 3 - …/`); resolved by basename (see gotchas).
- The generated `AZ-104_*.docx` are written to the **repo root** and are gitignored build artifacts.

## Core architecture principle — read this first

**The `chapters/MODULE_*.md` files are the single source of truth. `script/create_az104.js` contains NO document text — it only parses Markdown and renders styling.** To change the document, edit the `.md` and regenerate. Only touch the JS to change styles, parser logic, or the marker vocabulary. Do not hardcode prose into the JS.

`script/create_az104.js` is one self-contained file with three layers:
1. **Render helpers** (`body`, `h2`, `h3`, `stepTitle`, `bullet`, `infoBox`, `figImg`, `makeTable`, `codeBlock`, `moduloTitle`, `tocTitle`) — each returns `docx` `Paragraph`/`Table` objects with fixed fonts/colors (palette in the `C` object). Styling specs are mirrored in [style/STYLE_GUIDE.md](style/STYLE_GUIDE.md). `h2`/`h3`/`moduloTitle` carry an `outlineLevel` (1/2/0) so Word can build the TOC.
2. **`parseModule(md, modNum)`** — the heart. Line-by-line state machine: strips a leading BOM, extracts the `# Modulo N — Title` (the `Modulo N — ` prefix is stripped) and italic intro, then dispatches each line to a marker branch (headings, images, tables, blockquote→infoBox, fenced/indented code, bullets). Returns `{ title, headings, elements, … }`.
3. **`main()`** — parses all 6 modules and assembles the doc as **two sections**: (1) cover + Sommario, no footer page number; (2) module bodies, with a centered page number in the footer (restarting at 1). A page break separates each module. Packs the `.docx`; paths (`img/`, `chapters/`, output) are resolved against the repo root via `ROOT = path.join(__dirname, '..')`.

## Build / run

Needs Node.js (v18+) and the single dependency `docx`. **Note:** the portable Node that used to live under `…\AppData\Local\node-portable\` was removed to free space — reinstall Node (system install or portable + PATH, see [README.md](README.md)) and run `npm install docx` before regenerating.

```powershell
npm install docx                        # one-time (node_modules/ is gitignored)

# run from the repo root; the script resolves img/ and chapters/ relative to itself
node script/create_az104.js             # full doc  -> AZ-104_Note_di_Studio.docx
node script/create_az104.js --module 3  # one module -> AZ-104_Modulo_3.docx  (N = 1..6)
node script/create_az104.js --toc       # cover+TOC  -> AZ-104_Sommario.docx
```

`npm run build` / `npm run build:toc` are shortcuts for the first/last commands. There are no tests and no linter. The `.docx` outputs are gitignored.

## Markdown marker conventions (what the parser recognizes)

Full reference: [style/STYLE_GUIDE.md](style/STYLE_GUIDE.md). The essentials:

- First line `# Modulo N — Title`, optional italic `_intro_` underneath.
- `## N.M — Title` → h2 + TOC entry; `### N.M.K — Title` → h3 + TOC sub-entry.
- `**Title** _(stepTitle)_` → bold black step heading. Trailing `_(tag)_` markers (`stepTitle`, `caption`, `infoBox`) drive rendering; a line that is *only* a marker like `_(h2: …)_` is a descriptive annotation and is ignored.
- `![alt](img/file.png) _(dimensioni: W×H px)_` → image; a following `*caption*` or `… _(caption)_` line becomes the figure caption.
- `> **Label**: text` followed by `_(infoBox)_` → blue-bordered info box.
- `[TABELLA: fnName]` → table built by a JS function (see below). Plain Markdown `| a | b |` tables (with a `|---|` separator row) render inline; `**x**` cells become bold.
- A `**Immagini usate in questo modulo:**` … `---` block is a manifest and is **skipped** entirely.

### Code-generated tables
A few fixed tables are JS functions referenced from the `.md` as `[TABELLA: name]`, registered in `TABLE_FUNCS`: `toolsTable`, `armStructureTable`, `reservedTable`, `publicIpAssocTable`, `publicIpSkuTable`, `privateIpTable`, `nsgRuleSettingsTable`. To add one: write the function, add it to `TABLE_FUNCS`, reference it from the `.md`. Everything else should be a plain Markdown table.

## Non-obvious gotchas

- **Save `chapters/MODULE_*.md` as UTF-8 without BOM.** A BOM breaks `#` title detection and the module fails to parse. (The parser strips one leading BOM defensively, but don't rely on it.)
- **Images resolve by basename, not by path.** `resolveImg` builds a recursive index of `img/` and matches the filename only — so `img/file.png` in the `.md` finds `img/Module 3 - …/file.png`. Subfolder in the path doesn't matter; the basename must be unique across `img/`.
- **Display size comes from the `_(dimensioni: W×H px)_` marker**, then `figImg` clamps to ~600px wide / ~420px tall to stay inside the text column and reduce page-break gaps.
- **Layout glue is intentional.** `keepNext` and the `glueLeadIn`/`leadIn` machinery keep an intro sentence attached to the block that follows it, and tables/figures attached to their captions. Images and code-generated tables deliberately do *not* glue the preceding paragraph (a tall figure would otherwise drag text down). Preserve this behavior when editing the parser.
- **The Sommario is a native Word TOC field** (`TableOfContents`), built from heading `outlineLevel`s — never hand-maintain it. The page numbers (in the TOC and the footer) are **computed by Word on open** (`features.updateFields`); the `docx` library does not paginate, so they appear only after Word updates the fields (right-click → *Aggiorna campo*, or `F9`). `chapters/COVER_TOC.md` documents the cover/Sommario styling.
- Figure numbers run continuously across the doc and are written by hand in the `.md` captions (M3 ends at 61, M4 62–87, M5 88–110, M6 111–147).

## Workflow

Changes go branch → PR → merge into `main` (commit messages are Italian, Conventional-Commits style: `feat:`, `fix:`, `chore:`). After editing a `chapters/MODULE_*.md`, regenerate the `.docx` to verify (requires Node reinstalled — see **Build / run**).
