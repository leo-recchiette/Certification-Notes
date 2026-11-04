# Appendice: la CLI di Terraform

_Questa appendice sintetica raccoglie comandi utili della CLI `terraform`, flag comuni ed esempi di CI da incollare nelle pipeline._

## Workflow di base

- Inizializzare una directory di lavoro:

```bash
terraform init
```

- Formattare e validare la configurazione:

```bash
terraform fmt -recursive
terraform validate
```

- Creare un piano e salvarlo per applicarlo in seguito:

```bash
terraform plan -out=tfplan
# Ispeziona il piano salvato
terraform show -json tfplan | jq .
# Applica il piano salvato
terraform apply "tfplan"
```

Passo di plan adatto alla CI (restituisce un codice diverso da zero in caso di modifiche):

```bash
terraform plan -detailed-exitcode -out=tfplan || PLAN_EXIT=$?
# Exit code: 0 = nessuna modifica, 2 = modifiche, 1 = errore
if [ "$PLAN_EXIT" -eq 2 ]; then
  echo "Changes detected"
fi
```

Controlli di formattazione (utili in CI o come pre-commit):

```bash
# Fallisce se serve formattare
terraform fmt -check -recursive
```

## Script e automazione

- Produrre output leggibile da macchina per l'automazione:

```bash
terraform show -json > state.json
```

- Estrarre valori con `jq` (esempio: elencare i nomi dei bucket S3):

```bash
jq -r '.values.root_module.resources[] | select(.type=="aws_s3_bucket") | .values.bucket' state.json
```

## Ispezione e manipolazione dello state

- Elencare le risorse nello state:

```bash
terraform state list
```

- Mostrare una singola risorsa dallo state:

```bash
terraform state show module.vpc.aws_vpc.main
```

- Spostare risorse tra indirizzi (utile nei refactoring):

```bash
terraform state mv old.address new.address
```

- Rimuovere una risorsa dallo state (senza distruggerla nel cloud):

```bash
terraform state rm aws_s3_bucket.legacy_assets
```

## Import

- Import da CLI (legacy): lega una risorsa esistente a un indirizzo della configurazione:

```bash
terraform import aws_s3_bucket.legacy_assets my-company-legacy-assets
```

- Per gli import dichiarativi è preferibile il nuovo blocco `import` (1.5+).

## Consigli rapidi di ripristino

- Fai un backup dello state prima delle operazioni rischiose:

```bash
terraform state pull > state-backup-$(date +%F).json
```

- Se hai caricato per errore uno state non valido, ricarica con cautela un backup noto e funzionante:

```bash
terraform state push --force state-backup.json
```

## Provider e workspace

- Mostrare le versioni dei provider e le informazioni del lock file:

```bash
cat .terraform.lock.hcl
```

- Gestire i workspace (CLI):

```bash
terraform workspace list
terraform workspace select staging
terraform workspace new feature-x
```

Autenticazione dei provider (esempi):

- Per AWS, preferisci credenziali dinamiche o variabili d'ambiente alle chiavi scritte nel codice:

```bash
export AWS_PROFILE=myprofile
export AWS_REGION=us-east-1
```

- Per le run remote di Terraform Cloud/HCP, usa `terraform login` per configurare le credenziali.
