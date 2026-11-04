# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **AZ-104** notes, in `docs/microsoft/AZ-104/`. For the rules that apply to every certification — the shared engine, the `ROOT` invariant, the parser invariants, figure numbering, how to add a certification — see the root [CLAUDE.md](../../../CLAUDE.md). The marker vocabulary and every style live in [docs/STYLE_GUIDE.md](../../STYLE_GUIDE.md).

## What this folder is

Study notes for the **Microsoft AZ-104 (Azure Administrator)** certification, written in **Italian**, rendered to a styled Word `.docx` (and then exported to **PDF**) by the shared engine. Content lives in `chapters/MODULE_1.md` … `chapters/MODULE_6.md` (all six modules are complete).

## Folder layout

- `chapters/` — `MODULE_1.md` … `MODULE_6.md`: the document content, single source of truth.
- `script/config.js` — everything specific to this certification: the Azure-blue palette, the text-only cover, the 6 modules, the output file names, the module labels for the log.
- `script/tables.js` — the 7 tables generated from code (see below).
- `script/create_az104.js` — a ~15-line entry point: `build(require('./config'))`.
- `img/` — figures, in per-module subfolders (`img/Module 3 - …/`); resolved by basename.
- The generated `AZ-104_*.docx` (and the `.pdf` exported from each) are written to **this folder** and are gitignored build artifacts.

## Code-generated tables — the only thing unique to this certification

Seven fixed tables are JS functions instead of Markdown, referenced from the `.md` as `[TABELLA: name]`: `toolsTable`, `armStructureTable`, `reservedTable`, `publicIpAssocTable`, `publicIpSkuTable`, `privateIpTable`, `nsgRuleSettingsTable`. They live in `script/tables.js` and reach the engine as the `tables` registry in `script/config.js`.

Each one **receives the render context injected** and imports nothing — `({ makeTable }) => makeTable(headers, rows)` — so this file never depends on the engine (no coupling, no require cycle). They no longer pass explicit column widths: `tableWidths()` computes them from the content, like every other table in the document. To add one: write the function, export it from `script/tables.js`, reference it from the `.md`. Everything else should be a plain Markdown table.

## Build / run

```bash
docker compose run --rm docs build:az104              # full doc -> AZ-104_Note_di_Studio.docx + .pdf
docker compose run --rm docs build:az104 --module 3   # one module (1-6)
docker compose run --rm docs build:az104 --help       # every flag
```

All outputs land in `docs/microsoft/AZ-104/`. Everything runs in Docker (see the root [CLAUDE.md](../../../CLAUDE.md)); this machine has no Node, and the portable Node that once lived under `…\AppData\Local\node-portable\` is no longer needed.

## Non-obvious gotchas

Plus the shared ones in the root [CLAUDE.md](../../../CLAUDE.md).

- **This document's pagination changed** when AZ-104 moved onto the shared engine: side margins 1440 → 1080, captions and table cells one step smaller, justified body text, content-based column widths, clickable inline links. It is intentional — the engine uses one set of shared defaults — so a PDF generated today does not line up page-for-page with one from before the refactor.
- **Inline italics are now stripped properly.** Before the refactor `*testo*` reached the document with the asterisks visible (114 paragraphs were affected); the shared `stripItalic` removes them, while leaving asterisks inside inline code (`` `*.auto.tfvars` ``) intact.
- **Figure numbers used to be wrong and are now computed.** The `.md` captions carried hand-written numbers: 151 figures numbered 1..147, with 5-11 missing, 28-38 duplicated between `MODULE_2.md` and `MODULE_3.md`, and two inversions. They are now assigned by the engine, 1..151 in document order (tables 1..7). Do not write numbers in the captions.
- **This folder had two caption styles**, `*Figura N — testo*` (65) and `*Figura N: testo*` (86). Both are gone from the `.md`; the engine emits the em-dash form for everything.
- 22 of the 151 image references spell out the subfolder (with spaces and accents), the rest are flat `img/file.png`. Both work — resolution is by basename.
- `img/Module 3 - …` contained five orphan `.svg` files (never referenced; `docx` cannot embed SVG). They were removed; the engine now warns if it ever resolves an `.svg`.
