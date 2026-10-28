# Modulo 3 — Core Terraform Workflow

_Il ciclo di lavoro Write → Plan → Apply e i comandi che lo compongono: init, validate, plan, apply, destroy, fmt._

---

## 3.1 — Il workflow Terraform

### 3.1.1 — Le tre fasi

Il workflow di base di Terraform si articola in tre fasi, ripetute in ciclo:

1. **Write**: si scrive o modifica la configurazione.
2. **Plan**: si verifica in anteprima cosa cambierà.
3. **Apply**: si applicano le modifiche all'infrastruttura reale.

Attorno a queste fasi ruotano comandi di supporto: `init` (preparazione), `validate` e `fmt` (qualità), `destroy` (rimozione).

| **Comando** | **Funzione** |
|---|---|
| `terraform init` | Prepara la directory: scarica provider e moduli, inizializza il backend |
| `terraform fmt` | Formatta i file secondo lo stile canonico |
| `terraform validate` | Controlla sintassi e coerenza interna |
| `terraform plan` | Genera il piano di esecuzione |
| `terraform apply` | Applica le modifiche |
| `terraform destroy` | Elimina tutte le risorse gestite |

> **Ordine tipico**: `init` → `fmt` → `validate` → `plan` → `apply`. Se si cambia backend, provider o moduli occorre rieseguire `init`.
_(infoBox)_

---

## 3.2 — Inizializzare la directory di lavoro

### 3.2.1 — terraform init

`terraform init` è il primo comando da eseguire in una nuova configurazione (o dopo un clone). Fa quattro cose:

- **Inizializza il backend** (locale di default, o remoto se configurato).
- **Scarica i provider** richiesti in `.terraform/providers/`.
- **Scarica i moduli** referenziati in `.terraform/modules/`.
- **Crea o aggiorna il lock file** `.terraform.lock.hcl`.

È **idempotente**: può essere rieseguito in sicurezza.

**Opzioni utili** _(stepTitle)_

| **Opzione** | **Effetto** |
|---|---|
| `-upgrade` | Aggiorna provider e moduli alla versione più recente consentita dai vincoli |
| `-reconfigure` | Reinizializza il backend ignorando la configurazione salvata (senza migrare lo state) |
| `-migrate-state` | Migra lo state esistente verso il nuovo backend |
| `-backend=false` | Salta l'inizializzazione del backend |
| `-backend-config=...` | Passa parametri parziali di configurazione del backend |
| `-input=false` | Disabilita i prompt interattivi (utile in CI) |

---

## 3.3 — Validare la configurazione

### 3.3.1 — terraform validate

`terraform validate` verifica che la configurazione sia **sintatticamente valida e internamente coerente** (attributi esistenti, tipi corretti, riferimenti validi). Non accede all'infrastruttura reale, né ai remote state, e non richiede credenziali; richiede però `init` eseguito (per conoscere lo schema dei provider).

- Esito positivo: `Success! The configuration is valid.`
- Con `-json` produce output leggibile da macchina, utile in CI.
- Non verifica valori che dipendono dall'API remota (es. una dimensione di VM inesistente): quelli emergono a `plan`/`apply`.

---

## 3.4 — Generare e rivedere il piano

### 3.4.1 — terraform plan

`terraform plan` crea un **piano di esecuzione**: legge lo state, aggiorna (refresh) le informazioni sulle risorse reali, confronta con la configurazione e mostra le azioni previste, senza modificare nulla.

**Simboli del piano** _(stepTitle)_

| **Simbolo** | **Significato** |
|---|---|
| `+` | Risorsa da **creare** |
| `-` | Risorsa da **distruggere** |
| `~` | Risorsa da **modificare in place** |
| `-/+` (o `+/-`) | Risorsa da **sostituire** (destroy e create) |
| `<=` | Data source da leggere |

**Opzioni importanti** _(stepTitle)_

- `-out=tfplan`: salva il piano in un file; poi `terraform apply tfplan` applica **esattamente** quel piano.
- `-var`, `-var-file`: valorizzano le variabili.
- `-target=ADDR`: limita il piano a una risorsa (da usare solo in casi eccezionali).
- `-refresh-only`: propone solo l'aggiornamento dello state con la realtà (modalità *refresh-only*).
- `-destroy`: piano di distruzione.
- `-replace=ADDR`: forza la sostituzione di una risorsa (alternativa moderna a `taint`).
- `-detailed-exitcode`: exit code 0 = nessuna modifica, 1 = errore, 2 = modifiche presenti.

### 3.4.2 — Il grafo delle dipendenze

Terraform costruisce un **grafo aciclico diretto** (DAG) delle risorse. Le dipendenze derivano dai riferimenti (implicite) o da `depends_on` (esplicite). Il grafo determina l'ordine di creazione/distruzione e permette di eseguire **in parallelo** le operazioni indipendenti (di default fino a 10 alla volta, `-parallelism=n`).

- `terraform graph` emette il grafo in formato DOT.
- In distruzione l'ordine è inverso rispetto alla creazione.

---

## 3.5 — Applicare le modifiche

### 3.5.1 — terraform apply

`terraform apply` esegue le modifiche previste dal piano. Senza file di piano, esegue prima un plan e chiede conferma digitando `yes`.

- `terraform apply tfplan`: applica un piano salvato, **senza** richiedere conferma.
- `-auto-approve`: salta la conferma (CI/CD, ma con cautela).
- `-refresh-only`: applica solo l'aggiornamento dello state.
- Se un'operazione fallisce, Terraform salva nello state ciò che è stato creato; la risorsa parziale può risultare **tainted** (da ricreare al prossimo apply).
- Al termine Terraform stampa gli **output** definiti.

> **Concorrenza**: con un backend che supporta il **locking**, durante apply lo state viene bloccato; un secondo apply fallisce finché il lock non è rilasciato. `-lock=false` lo disabilita (sconsigliato).
_(infoBox)_

---

## 3.6 — Distruggere l'infrastruttura

### 3.6.1 — terraform destroy

`terraform destroy` elimina **tutte** le risorse gestite dalla configurazione corrente (è equivalente a `terraform apply -destroy`). Mostra il piano di distruzione e chiede conferma.

- Utile per ambienti temporanei e per evitare costi inutili.
- `terraform destroy -target=ADDR` elimina solo una risorsa e ciò che ne dipende.
- Per proteggere risorse critiche: `lifecycle { prevent_destroy = true }` (il piano fallisce se prevede la distruzione).
- Per rimuovere una risorsa dalla gestione **senza** distruggerla, usare il blocco `removed` con `destroy = false` (vedi Modulo 6).

---

## 3.7 — Formattazione e stile

### 3.7.1 — terraform fmt

`terraform fmt` riscrive i file `.tf` secondo lo **stile canonico** (indentazione di 2 spazi, allineamento degli `=`, ecc.).

| **Opzione** | **Effetto** |
|---|---|
| `-recursive` | Include le sottodirectory |
| `-check` | Non modifica: restituisce exit code diverso da 0 se ci sono file da formattare (ideale per CI) |
| `-diff` | Mostra le differenze |
| `-write=false` | Non scrive i file |

> **Nota**: `fmt` cambia solo la formattazione, non la semantica. Non verifica la validità della configurazione.
_(infoBox)_

**Link di riferimento** _(stepTitle)_

- [Core workflow](https://developer.hashicorp.com/terraform/intro/v1.12.x/core-workflow)
- [init](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/init) · [validate](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/validate) · [plan](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/plan) · [apply](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/apply) · [destroy](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/destroy) · [fmt](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/fmt)
- [Grafo delle dipendenze](https://developer.hashicorp.com/terraform/internals/v1.12.x/graph)
