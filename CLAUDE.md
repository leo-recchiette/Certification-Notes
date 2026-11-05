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
├── pdf.js                    .docx → .pdf: picks the engine (LibreOffice-UNO, Word COM, plain soffice)
├── docx2pdf.py               drives LibreOffice over UNO: forces layout, updates the TOC, exports
├── cli.js                    parseArgs(config, argv) — flags derived from the config
└── bin/
    ├── build-all.js          npm run build:all — every build:* script, forwarding the flags
    ├── inspect-docx.js       .docx dumps for regression checks (npm run inspect:docx)
    └── check-pdf.js          PDF check against its .docx: TOC, page numbers, fonts (npm run check:pdf)

Dockerfile, compose.yaml,     the build environment: Node + LibreOffice + fonts + npm deps
docker/entrypoint.sh

docs/<provider>/<CERTIFICATION>/
├── chapters/    MODULE_N.md — the content, single source of truth
├── img/         figures, in per-module subfolders; resolved by basename
├── script/      config.js + a ~15-line entry point (+ tables.js where needed)
└── CLAUDE.md    the detailed guidance for that certification

docs/STYLE_GUIDE.md           the marker vocabulary + every style, shared by all certifications
docs/COVER_TOC.md             how the cover page and the Sommario are produced
```

Root holds only shared tooling: the Docker build environment, `package.json` (the `docx` dependency, the `packages/*` workspace and one build script per certification), `.gitignore`, `.gitattributes`, `.dockerignore`, `README.md` (the single, short project-level README — there are no per-folder READMEs) and this file.

**The engine is shared: a change in `packages/doc-engine/` affects every certification.** Regenerate both documents after touching it. Anything that should differ between certifications belongs in that certification's `script/config.js`, not in the engine.

## Core architecture principle — read this first

**The `chapters/MODULE_*.md` files are the single source of truth. Neither the engine nor the configs contain document text — the engine only parses Markdown and renders styling.** To change a document, edit the `.md` and regenerate. Touch the engine only to change styles, parser logic, or the marker vocabulary. Never hardcode prose into the JS.

**The engine never computes the certification root.** `packages/doc-engine/` must never contain `path.join(__dirname, '..')`: there, `__dirname` is the package folder, not the certification. Each `script/config.js` computes it — `root: path.resolve(__dirname, '..')`, where `__dirname` is still `.../<CERT>/script/` — and the engine **validates** it at entry (absolute + existing, else an explicit error). Everything else (`chapters/`, `pocketguide/`, `img/`, the output file, the image index) derives from `config.root` and nothing else. This is what keeps the monorepo layout working, lets the scripts run from any working directory, and puts the generated `.docx`/`.pdf` in the certification folder (gitignored, the patterns are global).

The engine resolves as an npm **workspace** (`@certification-notes/doc-engine`), so `require` walks up to the root `node_modules/` exactly like `require('docx')` — independent of how deeply the certification folder is nested. In the Docker image the dependencies are installed; natively it needs `npm install` from the root, and without it the entry point prints a clear message instead of a stack trace.

## Build / run

**Everything runs in Docker** — the whole `.md` → `.docx` → `.pdf` pipeline. The host needs only Docker; this machine has no Node at all. The commands are the same in zsh and PowerShell:

```bash
docker compose build                                  # first time, or when Dockerfile / dependencies change
docker compose run --rm docs build:all                # every document, .docx + .pdf
docker compose run --rm docs build:az104 --module 3   # flags go straight after the script name
docker compose run --rm docs build:ta004 --help       # every flag, generated from that certification's config
docker compose run --rm docs check:pdf                # verify every generated PDF
docker compose run --rm docs                          # list the scripts
```

How the container is put together, and why:

- The image holds **only the toolchain and `node_modules`**. `docs/`, `packages/` and `package.json` are bind-mounted from the host at run time, so editing content or the engine needs no rebuild. The engine code is deliberately **not** copied into the image: a frozen engine would be used silently whenever the mount was missing.
- `docker/entrypoint.sh` inserts the `--` between npm and the script itself. A bare `ENTRYPOINT ["npm","run"]` would let npm swallow `--module 3` as its own config and build the full document **without any error**. It also refuses to run without the mounts, rejects unknown script names (with `--silent`, npm would just exit), and stops with "run `docker compose build`" if the mounted `package.json` dependencies no longer match the image.
- Pass flags directly (`build:az104 --module 3`); a habitual `--` is stripped. `build:all` reads every `build:*` script from `package.json` and forwards the flags to each — an `npm run a && npm run b` chain would forward them only to the last one.
- `docker compose run` does **not** rebuild the image when the Dockerfile changes: run `docker compose build`.
- The base image tag is pinned (`node:22.23.4-trixie-slim`, LibreOffice 25.2): a newer LibreOffice repaginates the PDF.

There are no tests and no linter. **Verification is regenerating and comparing**, not eyeballing:

- `check:pdf` checks each PDF against its `.docx` (expected values come from the `.docx`, not the PDF): TOC entry count and titles match the headings, every entry points to the page where its heading really is, body numbering is contiguous with no blank pages, fonts are embedded and limited to Carlito / Liberation Mono / DejaVu / OpenSymbol. It was seen **failing** on plain `soffice --convert-to` (0 TOC entries) before it was trusted green.
- `inspect:docx --out .regress/<name> <file.docx>` writes four text dumps — `counts` (paragraphs, tables, images, outline levels), `spine` (the heading sequence), `text` (one paragraph per line, no formatting) and `captions`. Never diff two `.docx` files byte-wise or by md5: `docx` generates relation ids with nanoid and the zip carries timestamps, so two runs of the *same* code differ. `text` is the dump to diff — it ignores pagination and shows only content changes. `.regress/` is mounted and gitignored; `diff` runs in the container (`docker compose run --rm --entrypoint diff docs -r .regress/a .regress/b`), since PowerShell has none.

Natively, `npm install` + `npm run build:az104` still work with Node 18+; the PDF then needs Word or LibreOffice on the host (see the PDF gotcha below).

## Adding a certification

1. Create `docs/<provider>/<CERTIFICATION>/` with `chapters/` and `img/`.
2. Write `script/config.js` (`id`, `root`, `banner`, `palette`, `cover`, `deliverables`) and an entry point of ~15 lines that calls `build(require('./config'))`. Copy them from an existing certification — **there is no generator to copy**.
3. Register `build:<cert>` in [package.json](package.json); `build:all` picks it up automatically.
4. Add a `CLAUDE.md` in the new folder, and a row in the certifications table of the root [README.md](README.md) — do not add a README to the folder. Keep the README short: it is for whoever reads or edits the notes; technical detail belongs here or in the per-folder `CLAUDE.md`.

Use the existing provider folder when there is one (`microsoft/`, `hashicorp/`): provider names are lowercase, certification folders keep the official code in uppercase (`AZ-104`, `TA-004`).

A variant of a document (a pocket guide, a quiz booklet) is **not** a new certification: it is another entry in that certification's `deliverables`. `deliverables.pocket` in `docs/hashicorp/TA-004/script/config.js` is the worked example.

## Shared gotchas

These hold for every certification; the per-folder `CLAUDE.md` has the rest.

- **The parser is fence-aware by construction, and the outline level comes from the number of `#`** (`#`→0, `##`→1, `###`→2), not from the `N.M` numbering in the title. The fenced-code branch consumes its block with an inner `while`, which is why the ~140 `#`/`##` lines that live *inside* code blocks (HCL and bash comments) never reach the heading branches. Do not reorder the parser branches and do not introduce numbering regexes: breaking either invariant injects ~140 spurious headings and as many Sommario entries. `## N.M — Title` is an editorial convention, not a parser contract — that is why the pocket guide, with free-form titles, works with the same parser.
- **Figures and tables are numbered by the engine**, in document order, with two counters that run across modules. The `.md` files contain no `Figura N`/`Tabella N` at all (`grep -rnE '(Figura|Tabella) [0-9]+' docs/*/*/chapters` → nothing) and a hand-written number would be overwritten. Inserting a figure needs no renumbering downstream, and prose must never cite a figure number.
- **All sources are parsed in every mode, on purpose.** That is what makes `--module N` produce the same figure numbers as the full document. Do not "optimize" it by skipping the sources that are not needed — the numbers would change.
- **Save the `chapters/MODULE_*.md` as UTF-8 without BOM.** A BOM breaks `#` title detection; the parser strips one defensively but warns.
- **Images resolve by basename, not by path**, via a recursive index of that certification's `img/` — so the subfolder in the Markdown path is irrelevant, but the filename must be unique within that `img/`. The index is deliberately **per certification**, so that invariant stays local and verifiable instead of becoming a monorepo-wide constraint.
- **The Sommario is a native Word TOC field**, built from heading `outlineLevel`s — never hand-maintain it. Someone has to compute it before the PDF is exported, otherwise the PDF gets an **empty** Sommario. In a freshly generated `.docx` it is empty until Word updates the fields (`F9`). Manual `PAGEREF` fields are not an alternative: `docx`'s `Bookmark` gives every bookmark the same `w:id`, so Word resolves them all to page 1.
- **The PDF engines** (`pdf.js`), in order: **`uno`** — `docx2pdf.py` drives LibreOffice over UNO, forces the layout (LibreOffice only collects headings that are already laid out), updates the indexes in two passes and exports directly, without re-saving the `.docx` (the LibreOffice DOCX filter would rewrite all of it). This is the container's engine and the **reference PDF**. **`word`** — Word over COM, native Windows only. **`libreoffice`** — plain `soffice --convert-to`, which does **not** update the TOC: last resort, with a warning. `CERTNOTES_PDF_ENGINE` forces one engine with **no fallback**, and any failure then fails the build; the image sets it to `uno`, so a LibreOffice problem can never silently degrade into an empty Sommario. The `uno` engine also checks that the TOC entry count equals the headings the engine emitted.
- **Fonts in the container**: Calibri → **Carlito** (metric-compatible: same widths, same line breaks), Courier New → **Liberation Mono**, DejaVu for glyphs Carlito lacks (→ ✓ box-drawing). If `LiberationSans` ever shows up in `pdffonts`, Calibri was not mapped. Pagination is close to Word's but not page-for-page identical.
- **Writer inserts a blank page** when section 2 (page number restarting at 1) would start on an even physical page; `docx2pdf.py` exports with `IsSkipEmptyPages`, so it never reaches the PDF. LibreOffice's own page count still includes it — that is why the build log does not print one.
- **Layout glue is intentional** (`keepNext`, the lead-in machinery): it keeps intro sentences attached to the block that follows and captions attached to their figure/table; images deliberately do *not* glue the preceding paragraph. Preserve this behavior when editing the parser.
- `.docx`/`.pdf` are build artifacts: never commit them.

## Workflow

Changes go branch → PR → merge into `main`. Commit messages are in Italian, Conventional-Commits style (`feat:`, `fix:`, `chore:`, `docs:`). Prefix the scope with the certification when it helps, e.g. `feat: aggiorna AZ-104 MODULE_3 - …`. After editing a `chapters/MODULE_*.md`, regenerate that certification's document and run `check:pdf`; after editing the engine, run `build:all`, compare the `inspect:docx` dumps against ones taken before the change, and run `check:pdf`.
