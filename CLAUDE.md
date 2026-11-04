# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **monorepo of IT certification study notes**, written in **Italian**, each rendered to a styled Word `.docx` (and exported to **PDF**) by a **single shared engine**. One repository, one toolchain, one folder per certification.

| Certification | Provider | Folder | Config | Modules |
|---|---|---|---|---|
| AZ-104 (Azure Administrator) | Microsoft | `docs/microsoft/AZ-104/` | `script/config.js` (+ `script/tables.js`) | 6 |
| Terraform Associate (004) | HashiCorp | `docs/hashicorp/TA-004/` | `script/config.js` | 8 (+ a 10-chapter pocket guide) |

## Repo layout

```
packages/doc-engine/          the shared engine — ALL the logic lives here
├── index.js                  build(config): orchestrates parse → assemble → .docx → .pdf
├── theme.js                  shared styles; geometry derived from one value
├── inline.js                 inline markup (tags, bold, italics, links)
├── images.js                 createImages(imgDir) → per-certification basename index
├── render.js                 createRender(theme, images) → the docx Paragraph/Table helpers
├── parser.js                 parseModule(md, ctx) — the line-by-line state machine
├── document.js               TOC field, sections, page props, styles, numbering
├── pdf.js                    .docx → .pdf (Word COM, else LibreOffice)
├── cli.js                    parseArgs(config, argv) — flags derived from the config
└── bin/inspect-docx.js       .docx inspector, for regression checks (npm run inspect:docx)

docs/<provider>/<CERTIFICATION>/
├── chapters/    MODULE_N.md — the content, single source of truth
├── img/         figures, in per-module subfolders; resolved by basename
├── script/      config.js + a ~15-line entry point (+ tables.js where needed)
└── CLAUDE.md    the detailed guidance for that certification

docs/STYLE_GUIDE.md           the marker vocabulary + every style, shared by all certifications
docs/COVER_TOC.md             how the cover page and the Sommario are produced
```

Root holds only shared tooling: `package.json` (the `docx` dependency, the `packages/*` workspace and one build script per certification), `.gitignore`, `.gitattributes`, `README.md` (the single, project-level documentation covering every certification — there are no per-folder READMEs) and this file.

**The engine is shared: a change in `packages/doc-engine/` affects every certification.** Regenerate both documents after touching it. Anything that should differ between certifications belongs in that certification's `script/config.js`, not in the engine.

## Core architecture principle — read this first

**The `chapters/MODULE_*.md` files are the single source of truth. Neither the engine nor the configs contain document text — the engine only parses Markdown and renders styling.** To change a document, edit the `.md` and regenerate. Touch the engine only to change styles, parser logic, or the marker vocabulary. Never hardcode prose into the JS.

**The engine never computes the certification root.** `packages/doc-engine/` must never contain `path.join(__dirname, '..')`: there, `__dirname` is the package folder, not the certification. Each `script/config.js` computes it — `root: path.resolve(__dirname, '..')`, where `__dirname` is still `.../<CERT>/script/` — and the engine **validates** it at entry (absolute + existing, else an explicit error). Everything else (`chapters/`, `pocketguide/`, `img/`, the output file, the image index) derives from `config.root` and nothing else. This is what keeps the monorepo layout working, lets the scripts run from any working directory, and puts the generated `.docx`/`.pdf` in the certification folder (gitignored, the patterns are global).

The engine resolves as an npm **workspace** (`@certification-notes/doc-engine`), so `require` walks up to the root `node_modules/` exactly like `require('docx')` — independent of how deeply the certification folder is nested. It needs `npm install` from the root; without it the entry point prints a clear message instead of a stack trace.

## Build / run

Needs Node.js (v18+) and `npm install` once from the repo root. The PDF export needs **Microsoft Word** (Windows, via COM) or **LibreOffice** — with neither, the `.docx` is still produced and only a warning is printed.

```bash
npm install                  # one-time, from the repo root

npm run build:az104          # AZ-104 full document   (+ :toc)
npm run build:ta004          # TA-004 full document   (+ :toc, :pocket)

node <generator> --help      # every flag, generated from that certification's config
node <generator> --module 3  # one module
node <generator> --no-pdf    # skip the PDF export
```

There are no tests and no linter. **Verification is regenerating and comparing**, not eyeballing: `npm run inspect:docx -- <file.docx>` writes four text dumps next to each other — `counts` (paragraphs, tables, images, outline levels), `spine` (the heading sequence), `text` (one paragraph per line, no formatting) and `captions`. Never diff two `.docx` files byte-wise or by md5: `docx` generates relation ids with nanoid and the zip carries timestamps, so two runs of the *same* code differ. `text` is the dump to diff — it ignores pagination and shows only content changes.

With no Node on the machine, everything above runs in a container:

```bash
docker run --rm -v "$PWD":/repo -w /repo -e HOME=/tmp -u "$(id -u):$(id -g)" \
  node:22-bookworm-slim sh -c 'npm install && npm run build:ta004 -- --no-pdf'
```

Always pass `--no-pdf` in a container: the PDF path needs Word (interactive Windows session only) or LibreOffice, so it is not verifiable there.

## Adding a certification

1. Create `docs/<provider>/<CERTIFICATION>/` with `chapters/` and `img/`.
2. Write `script/config.js` (`id`, `root`, `banner`, `palette`, `cover`, `deliverables`) and an entry point of ~15 lines that calls `build(require('./config'))`. Copy them from an existing certification — **there is no generator to copy**.
3. Register `build:<cert>` (and `:toc`) in [package.json](package.json).
4. Add a `CLAUDE.md` in the new folder, and in the root [README.md](README.md) a row in the certifications table plus a section for the new certification (documentation is centralized there — do not add a README to the folder).

Use the existing provider folder when there is one (`microsoft/`, `hashicorp/`): provider names are lowercase, certification folders keep the official code in uppercase (`AZ-104`, `TA-004`).

A variant of a document (a pocket guide, a quiz booklet) is **not** a new certification: it is another entry in that certification's `deliverables`. `deliverables.pocket` in `docs/hashicorp/TA-004/script/config.js` is the worked example.

## Shared gotchas

These hold for every certification; the per-folder `CLAUDE.md` has the rest.

- **The parser is fence-aware by construction, and the outline level comes from the number of `#`** (`#`→0, `##`→1, `###`→2), not from the `N.M` numbering in the title. The fenced-code branch consumes its block with an inner `while`, which is why the ~140 `#`/`##` lines that live *inside* code blocks (HCL and bash comments) never reach the heading branches. Do not reorder the parser branches and do not introduce numbering regexes: breaking either invariant injects ~140 spurious headings and as many Sommario entries. `## N.M — Title` is an editorial convention, not a parser contract — that is why the pocket guide, with free-form titles, works with the same parser.
- **Figures and tables are numbered by the engine**, in document order, with two counters that run across modules. The `.md` files contain no `Figura N`/`Tabella N` at all (`grep -rnE '(Figura|Tabella) [0-9]+' docs/*/*/chapters` → nothing) and a hand-written number would be overwritten. Inserting a figure needs no renumbering downstream, and prose must never cite a figure number.
- **All sources are parsed in every mode, on purpose.** That is what makes `--module N` produce the same figure numbers as the full document. Do not "optimize" it by skipping the sources that are not needed — the numbers would change.
- **Save the `chapters/MODULE_*.md` as UTF-8 without BOM.** A BOM breaks `#` title detection; the parser strips one defensively but warns.
- **Images resolve by basename, not by path**, via a recursive index of that certification's `img/` — so the subfolder in the Markdown path is irrelevant, but the filename must be unique within that `img/`. The index is deliberately **per certification**, so that invariant stays local and verifiable instead of becoming a monorepo-wide constraint.
- **The Sommario is a native Word TOC field**, built from heading `outlineLevel`s — never hand-maintain it. Page numbers are computed by Word when the fields update (`F9`), so they are blank/stale in a freshly generated `.docx`; the Word-COM PDF export bakes them in, the LibreOffice fallback does not. Manual `PAGEREF` fields are not an alternative: `docx`'s `Bookmark` gives every bookmark the same `w:id`, so Word resolves them all to page 1.
- **Layout glue is intentional** (`keepNext`, the lead-in machinery): it keeps intro sentences attached to the block that follows and captions attached to their figure/table; images deliberately do *not* glue the preceding paragraph. Preserve this behavior when editing the parser.
- `.docx`/`.pdf` are build artifacts: never commit them.

## Workflow

Changes go branch → PR → merge into `main`. Commit messages are in Italian, Conventional-Commits style (`feat:`, `fix:`, `chore:`, `docs:`). Prefix the scope with the certification when it helps, e.g. `feat: aggiorna AZ-104 MODULE_3 - …`. After editing a `chapters/MODULE_*.md`, regenerate that certification's document to verify; after editing the engine, regenerate **both**.
