# Certification Notes

Note di studio per certificazioni IT, in italiano. I contenuti sono scritti in Markdown e trasformati in documenti Word (`.docx`) e PDF da un motore condiviso che gira in Docker.

## Certificazioni

| Certificazione | Contenuto | Cartella | Script |
|---|---|---|---|
| AZ-104 — Azure Administrator (Microsoft) | 6 moduli | `docs/microsoft/AZ-104/` | `build:az104` |
| Terraform Associate 004 (HashiCorp) | 8 moduli + pocket guide | `docs/hashicorp/TA-004/` | `build:ta004`, `build:ta004:pocket` |

Le note TA-004 seguono la [exam content list](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004) e il [percorso di studio](https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-study-004) ufficiali, citando in ogni sezione la pagina di origine.

## Generare i documenti

Serve solo [Docker](https://www.docker.com/products/docker-desktop/). Dalla radice del repo (comandi uguali in zsh e PowerShell):

```bash
docker compose build                                  # la prima volta
docker compose run --rm docs build:all                # tutti i documenti
docker compose run --rm docs build:az104              # una certificazione
docker compose run --rm docs build:az104 --module 3   # un solo modulo
docker compose run --rm docs build:az104 --help       # tutte le opzioni
```

I `.docx` e i `.pdf` finiscono nella cartella della certificazione. Rifai `docker compose build` solo se cambiano `Dockerfile` o le dipendenze: il container lo segnala da sé. Su Linux, se il tuo uid non è 1000, aggiungi `--user "$(id -u):$(id -g)"` dopo `run`.

## Modificare i contenuti

Il contenuto sta nei file `chapters/MODULE_*.md`, l'unica fonte di verità: si modifica il `.md` e si rigenera. I marcatori riconosciuti e gli stili sono nella [guida di stile](docs/STYLE_GUIDE.md).

- Non scrivere i numeri di figura e tabella: li assegna il motore.
- Dopo aver rigenerato, `docker compose run --rm docs check:pdf` verifica Sommario, numeri di pagina e font dei PDF.

## Struttura

```
docs/<provider>/<CERT>/   chapters/ (i .md), img/, script/config.js
docs/STYLE_GUIDE.md       marcatori Markdown e stili
packages/doc-engine/      il motore: Markdown → .docx → .pdf
Dockerfile, compose.yaml  l'ambiente di generazione
```

Per aggiungere una certificazione si crea la cartella, si scrive `script/config.js` copiandolo da una esistente e si aggiunge lo script `build:<cert>` in `package.json`. Una variante di un documento, come la pocket guide, è solo una voce in più in `deliverables`.

Dettagli tecnici su motore, PDF e verifiche: [CLAUDE.md](CLAUDE.md).

## Workflow

Ogni modifica su un branch dedicato, poi PR e merge in `main`. Commit in italiano, stile Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
