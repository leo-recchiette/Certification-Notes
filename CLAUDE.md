# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Study notes for the **Microsoft AZ-104 (Azure Administrator)** certification, written in **Italian**, rendered to a styled Word `.docx` by a single Node.js script. Content lives in `MODULE_1.md` … `MODULE_6.md`; `create_az104.js` parses them and emits the document.

## Core architecture principle — read this first

**The `MODULE_*.md` files are the single source of truth. `create_az104.js` contains NO document text — it only parses Markdown and renders styling.** To change the document, edit the `.md` and regenerate. Only touch the JS to change styles, parser logic, or the marker vocabulary. Do not hardcode prose into the JS.

`create_az104.js` is one self-contained file with three layers:
1. **Render helpers** (`body`, `h2`, `h3`, `stepTitle`, `bullet`, `infoBox`, `figImg`, `makeTable`, `codeBlock`, `moduloTitle`, the `toc*` family) — each returns `docx` `Paragraph`/`Table` objects with fixed fonts/colors (palette in the `C` object). Styling specs are mirrored in [STYLE_GUIDE.md](STYLE_GUIDE.md).
2. **`parseModule(md)`** — the heart. Line-by-line state machine: strips a leading BOM, extracts the `# Modulo N — Title` (the `Modulo N — ` prefix is stripped) and italic intro, then dispatches each line to a marker branch (headings, images, tables, blockquote→infoBox, fenced/indented code, bullets). Returns `{ title, headings, elements }`. `headings` feeds the auto-generated TOC.
3. **`main()`** — parses all 6 modules (needed for the full TOC in every mode), assembles cover + Sommario + module bodies, packs the `.docx`.

## Build / run

This machine has **no global Node on PATH**; it's installed portable at:
`C:\Users\leonardo.lucente\AppData\Local\node-portable\node-v24.16.0-win-x64\node.exe`

```powershell
# one-time: install the only dependency (node_modules/ is gitignored)
& "<path-to-node.exe>" -e "1"   # sanity check node works
npm install docx                 # or: & "<path>\npm.cmd" install docx

# generate (run from the repo root — the script resolves img/ relative to itself)
& "<path-to-node.exe>" create_az104.js              # full doc  -> AZ-104_Note_di_Studio.docx
& "<path-to-node.exe>" create_az104.js --module 3   # one module -> AZ-104_Modulo_3.docx  (N = 1..6)
& "<path-to-node.exe>" create_az104.js --toc        # cover+TOC  -> AZ-104_Sommario.docx
```

`npm run build` / `npm run build:toc` exist but assume `node` is on PATH. There are no tests and no linter. The `.docx` outputs are gitignored build artifacts.

## Markdown marker conventions (what the parser recognizes)

Full reference: [STYLE_GUIDE.md](STYLE_GUIDE.md). The essentials:

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

- **Save `MODULE_*.md` as UTF-8 without BOM.** A BOM breaks `#` title detection and the module fails to parse. (The parser strips one leading BOM defensively, but don't rely on it.)
- **Images resolve by basename, not by path.** `resolveImg` builds a recursive index of `img/` and matches the filename only — so `img/file.png` in the `.md` finds `img/Module 3 - …/file.png`. Subfolder in the path doesn't matter; the basename must be unique across `img/`.
- **Display size comes from the `_(dimensioni: W×H px)_` marker**, then `figImg` clamps to ~600px wide / ~420px tall to stay inside the text column and reduce page-break gaps.
- **Layout glue is intentional.** `keepNext` and the `glueLeadIn`/`leadIn` machinery keep an intro sentence attached to the block that follows it, and tables/figures attached to their captions, to avoid orphaned headings and bad page breaks. Images and code-generated tables deliberately do *not* glue the preceding paragraph (a tall figure would otherwise drag text down). Preserve this behavior when editing the parser.
- The TOC/Sommario is **auto-generated** from headings — never hand-maintain it. `COVER_TOC.md` only documents the cover/TOC styling.
- Modules 4–6 are placeholders (title only, no `##` sections yet).

## Workflow

Changes go branch → PR → merge into `main` (commit messages are Italian, Conventional-Commits style: `feat:`, `fix:`, `chore:`). After editing a `.md`, regenerate the `.docx` to verify.

The `.claude/skills/mslearn-section-fetcher/` skill automates "add a section from a Microsoft Learn URL": it fetches/summarizes the page in Italian, downloads and resizes images to match existing ones, inserts a numbered `### N.M.K` subsection into the right `MODULE_N.md`, pushes via the GitHub MCP tools, and regenerates the doc. Trigger it when the user asks to add a section/chapter from learn.microsoft.com links.
