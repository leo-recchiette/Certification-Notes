# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **Terraform Associate (004)** notes, in `docs/hashicorp/TA-004/`. For the rules that apply to every certification — the shared engine, the `ROOT` invariant, the parser invariants, figure numbering, how to add a certification — see the root [CLAUDE.md](../../../CLAUDE.md). The marker vocabulary and every style live in [docs/STYLE_GUIDE.md](../../STYLE_GUIDE.md).

## What this folder is

Study notes for the **HashiCorp Certified: Terraform Associate (004)** certification, written in **Italian**, rendered to a styled Word `.docx` (and then exported to **PDF**) by the shared engine. Content lives in `chapters/MODULE_1.md` … `chapters/MODULE_8.md` — one module per exam objective, following the official [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) and [study path](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004), with each section citing its source page as a clickable link.

## Folder layout

- `chapters/` — `MODULE_1.md` … `MODULE_8.md`: the document content, single source of truth.
- `pocketguide/` — a **second deliverable**: a condensed pocket guide in 10 chapters (`01-…md` … `10-Appendice-CLI.md`).
- `script/config.js` — everything specific to this certification: the HashiCorp-purple palette, the cover with its logo, the 8 modules, the two deliverables.
- `script/create_ta004.js` — a ~15-line entry point: `build(require('./config'))`.
- `img/` — figures, in per-module subfolders, plus `img/Cover/terraform-logo.png` for the cover; resolved by basename. The Modulo 6 has no figures, hence no `Module 6` subfolder.
- No `tables.js`: every table here is a plain Markdown table, so the config passes `tables: {}`.
- The generated `TA-004_*.docx` (and the `.pdf` exported from each) are written to **this folder** and are gitignored build artifacts.

## The pocket guide is a deliverable, not a special case

`deliverables.pocket` in `script/config.js` is the worked example to copy when adding any document variant:

```js
pocket: {
  flag:   '--pocket',                          // how the CLI selects it
  label:  'Pocket Guide',                      // shown in the log and in --help
  source: { dir: 'pocketguide', all: true },   // every .md in the folder, in filename order
  output: { full: 'TA-004_Pocket_Guide.docx' },
  cover:  { tagline: '…' },                    // partial override of the cover
}
```

`source.all` is why the chapters carry the `NN-` prefix: adding a chapter means adding a correctly-numbered file, nothing else. **Which flags are legal is derived from `output`**: this deliverable declares no `module`, so `--module` is rejected with a clear message — there is no `if (mode === 'pocket')` anywhere in the engine.

The pocket guide also demonstrates why the parser takes the outline level from the number of `#`: its titles are free-form (`# Appendice: la CLI di Terraform`, `### 3a.1: la Trinità di Terraform`) and never follow the `Modulo N — ` / `N.M — ` convention, yet it renders with the same parser, unmodified.

## Build / run

```bash
docker compose run --rm docs build:ta004              # full doc     -> TA-004_Note_di_Studio.docx + .pdf
docker compose run --rm docs build:ta004:pocket       # pocket guide -> TA-004_Pocket_Guide.docx + .pdf
docker compose run --rm docs build:ta004 --module 4   # one module (1-8)
docker compose run --rm docs build:ta004 --help       # every flag
```

All outputs land in `docs/hashicorp/TA-004/`. Everything runs in Docker (see the root [CLAUDE.md](../../../CLAUDE.md)).

This folder is also the **stress test for the PDF Sommario**: 627 entries spread over 12 pages in the full document. The `uno` engine renders it in about 6 s and `check:pdf` verifies that every entry points to the right page.

## Non-obvious gotchas

Plus the shared ones in the root [CLAUDE.md](../../../CLAUDE.md).

- **This folder is where the engine's behavior came from.** The old `create_ta004.js` was the functional superset of the two generators, so the engine is essentially its logic with the certification-specific parts lifted into `config.js`. Its four outputs are byte-for-byte unchanged by the refactor, which is what makes them the regression baseline: if a change to the engine alters a TA-004 dump, the change is wrong until proven otherwise.
- **The source-page citations are real hyperlinks.** 124 inline `[testo](https://…)` links in `chapters/` and 114 in `pocketguide/` become `ExternalHyperlink` in bullets. Keep them inside list items — that is the branch that renders them clickable.
- **This folder is the stress test for fenced code**: 513 fenced blocks in `chapters/` and 225 in the pocket guide, against 9 in AZ-104. Several contain lines starting with `#`/`##` (HCL and bash comments, e.g. `chapters/MODULE_7.md:86`, `chapters/MODULE_4.md:3054`). They stay code only because the parser is fence-aware — see the root [CLAUDE.md](../../../CLAUDE.md).
- **The cover expects `terraform-logo.png`** somewhere under `img/` (it lives in `img/Cover/`). If it is missing, the cover degrades to text only, with a warning — no error.
- `chapters/MODULE_4.md` is the largest file in the repo (over 5 000 lines).
- Figure numbers are assigned by the engine; the captions in the `.md` carry none. The 30 figures come from HashiCorp Developer and their captions say so ("Fonte: HashiCorp Developer").
