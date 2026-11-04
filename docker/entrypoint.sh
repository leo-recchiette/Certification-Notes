#!/bin/sh
# Entry point dell'immagine: esegue lo script npm richiesto passandogli le opzioni.
#
#   docker compose run --rm docs                          -> elenca gli script
#   docker compose run --rm docs build:az104 --module 3   -> npm run build:az104 -- --module 3
#
# Perche' non basta ENTRYPOINT ["npm","run"]: senza "--" npm interpreta --module 3 come
# una propria opzione e lo script parte senza, generando il documento completo SENZA
# dare alcun errore. Qui il "--" lo aggiunge sempre l'entry point.
set -eu

if [ ! -f /app/packages/doc-engine/index.js ] || [ ! -d /app/docs ]; then
  echo "Mancano i mount di docs/ o packages/: avvia il container con 'docker compose run --rm docs ...'." >&2
  exit 2
fi

# Le dipendenze installate nell'immagine devono corrispondere ai package.json montati:
# altrimenti si otterrebbe un "Cannot find module" poco chiaro.
if ! node -e '
  const sig = (p) => { const j = require(p); return JSON.stringify([j.dependencies || {}, j.workspaces || []]); };
  process.exit(sig("/app/package.json") === sig("/opt/certnotes/package.json")
    && sig("/app/packages/doc-engine/package.json") === sig("/opt/certnotes/doc-engine.package.json") ? 0 : 1);
'; then
  echo "Le dipendenze in package.json sono cambiate rispetto all'immagine: esegui 'docker compose build'." >&2
  exit 2
fi

if [ $# -eq 0 ]; then
  exec npm run
fi

script=$1
shift

# Con --silent npm non direbbe nulla per uno script inesistente (uscirebbe e basta):
# il controllo lo fa qui, con un messaggio e l'elenco degli script disponibili.
if ! node -e 'process.exit((require("/app/package.json").scripts || {})[process.argv[1]] ? 0 : 1)' "$script"; then
  echo "Script sconosciuto: \"$script\". Script disponibili:" >&2
  npm run >&2
  exit 2
fi

# Un "--" scritto per abitudine viene tolto: cli.js lo rifiuterebbe come opzione sconosciuta.
if [ "${1:-}" = "--" ]; then shift; fi
exec npm run --silent "$script" -- "$@"
