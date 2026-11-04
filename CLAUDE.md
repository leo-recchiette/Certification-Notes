# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **monorepo of IT certification study notes**, written in **Italian**, each rendered to a styled Word `.docx` (and exported to **PDF**) by its own self-contained Node.js generator. One repository, one shared toolchain, one folder per certification.

| Certification | Provider | Folder | Generator | Modules |
|---|---|---|---|---|
| AZ-104 (Azure Administrator) | Microsoft | `docs/microsoft/AZ-104/` | `script/create_az104.js` | 6 |
| Terraform Associate (004) | HashiCorp | `docs/hashicorp/TA-004/` | `script/create_ta004.js` | 8 (+ a 10-chapter pocket guide) |

## Repo layout

```
docs/<provider>/<CERTIFICATION>/
├── chapters/    MODULE_N.md (content, single source of truth) + COVER_TOC.md
├── img/         figures, in per-module subfolders; resolved by basename
├── script/      the generator (Markdown parser → .docx → .pdf)
├── style/       STYLE_GUIDE.md — styling spec + the Markdown marker vocabulary
├── README.md    how to build that certification's document
└── CLAUDE.md    the detailed guidance for that generator — read it before editing there
```

Root holds only shared tooling: `package.json` (the single `docx` dependency + one build script per certification), `.gitignore`, `.gitattributes`, `README.md` (index) and this file.

**Each certification folder is self-contained and its `CLAUDE.md` is authoritative for that generator** (parser internals, marker vocabulary, gotchas, figure numbering). This file covers only what is common to all of them.

## Core architecture principle — read this first

**The `chapters/MODULE_*.md` files are the single source of truth. The generator scripts contain NO document text — they only parse Markdown and render styling.** To change a document, edit the `.md` and regenerate. Touch the JS only to change styles, parser logic, or the marker vocabulary. Never hardcode prose into the JS.

Each generator resolves **every** path from `ROOT = path.join(__dirname, '..')` — i.e. its own certification folder — so `chapters/`, `img/`, `pocketguide/` and the output file are all relative to that folder, never to the repo root or the current working directory. **This is what keeps the monorepo layout working with zero changes to the generators: preserve it.** It also means the scripts can be invoked from anywhere, and that generated `.docx`/`.pdf` land in the certification folder (still gitignored, the patterns are global).

## Build / run

Needs Node.js (v18+) and the single shared dependency `docx`; `npm install` once from the repo root installs it for every generator (Node resolves `require('docx')` by walking up from the script's folder to the root `node_modules/`). The PDF export needs **Microsoft Word** (Windows, via COM) or **LibreOffice** — with neither, the `.docx` is still produced and only a warning is printed.

```bash
npm install                  # one-time, from the repo root

npm run build:az104          # AZ-104 full document   (+ :toc)
npm run build:ta004          # TA-004 full document   (+ :toc, :pocket)

# flags not covered by the npm scripts:
node docs/microsoft/AZ-104/script/create_az104.js --module 3    # one module (1-6)
node docs/hashicorp/TA-004/script/create_ta004.js --module 4    # one module (1-8)
node docs/hashicorp/TA-004/script/create_ta004.js --pocket      # pocket guide
node <generator> --no-pdf                                       # skip the PDF export
```

There are no tests and no linter; verification is regenerating the document and opening it.

## Adding a certification

1. Create `docs/<provider>/<CERTIFICATION>/` with `chapters/`, `img/`, `script/`, `style/`.
2. Start the generator from an existing one — it **must** keep `ROOT = path.join(__dirname, '..')`.
3. Register `build:<cert>` (and `:toc`) in [package.json](package.json).
4. Add a `README.md` and a `CLAUDE.md` in the new folder, and a row in the root [README.md](README.md) table.

Use the existing provider folder when there is one (`microsoft/`, `hashicorp/`): provider names are lowercase, certification folders keep the official code in uppercase (`AZ-104`, `TA-004`).

## Shared gotchas

These hold for every certification; the per-folder `CLAUDE.md` has the rest.

- **Save the `chapters/MODULE_*.md` as UTF-8 without BOM.** A BOM breaks `#` title detection and the module fails to parse.
- **Images resolve by basename, not by path**, via a recursive index of that certification's `img/` — so the subfolder in the Markdown path is irrelevant, but the filename must be unique within that `img/`.
- **The Sommario is a native Word TOC field**, built from heading `outlineLevel`s — never hand-maintain it. Page numbers are computed by Word when the fields update (`F9`), so they are blank/stale in a freshly generated `.docx`; the Word-COM PDF export bakes them in, the LibreOffice fallback does not.
- **Layout glue is intentional** (`keepNext`, the lead-in machinery): it keeps intro sentences attached to the block that follows and captions attached to their figure/table. Preserve this behavior when editing a parser.
- `.docx`/`.pdf` are build artifacts: never commit them.

## Workflow

Changes go branch → PR → merge into `main`. Commit messages are in Italian, Conventional-Commits style (`feat:`, `fix:`, `chore:`, `docs:`). Prefix the scope with the certification when it helps, e.g. `feat: aggiorna AZ-104 MODULE_3 - …`. After editing a `chapters/MODULE_*.md`, regenerate that certification's document to verify.
