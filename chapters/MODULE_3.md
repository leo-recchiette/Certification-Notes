# Modulo 3 — Core Terraform Workflow

_Il ciclo di lavoro Write → Plan → Apply e i comandi che lo compongono: init, validate, plan, apply, destroy, fmt._

---

## 3.1 — Il workflow Terraform

### 3.1.1 — Le tre fasi

Il workflow di base di Terraform si articola in tre fasi, ripetute in ciclo:

![Figura 5](img/terraform-workflow-diagram.png) _(dimensioni: 737×280 px)_

*Figura 5 — Il ciclo di lavoro di Terraform. Fonte: HashiCorp Developer.* _(caption)_

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

### 3.1.2 — Il workflow da soli, in team e con HCP Terraform

La pagina *Core Workflow* descrive lo stesso ciclo in tre contesti:

| **Fase** | **Singolo professionista** | **Team** | **Con HCP Terraform** |
|---|---|---|---|
| **Write** | Si modifica il codice in locale, con `plan` frequenti come feedback | Ognuno lavora su un branch del repository; le credenziali e lo state condiviso complicano l'uso in locale | Si lavora in un branch; HCP Terraform conserva state, variabili e credenziali |
| **Plan** | Si rivede il piano nel terminale | Il piano entra nella **pull request** e viene revisionato | Ogni pull request avvia uno **speculative plan**, linkato nella PR |
| **Apply** | `terraform apply` dalla propria macchina | Dopo il merge si applica (spesso da pipeline CI) | Dopo il merge HCP Terraform esegue il run; l'apply si conferma nell'interfaccia |

---

## 3.2 — Inizializzare la directory di lavoro

### 3.2.1 — terraform init

`terraform init` è il primo comando da eseguire in una nuova configurazione (o dopo un clone). Fa quattro cose:

- **Inizializza il backend** (locale di default, o remoto se configurato).
- **Scarica i provider** richiesti in `.terraform/providers/`.
- **Scarica i moduli** referenziati in `.terraform/modules/`.
- **Crea o aggiorna il lock file** `.terraform.lock.hcl`.

È **idempotente**: può essere rieseguito in sicurezza e non cancella mai configurazione o state. Rieseguito, installa solo i moduli aggiunti dopo l'ultimo `init`, senza toccare quelli già installati (salvo `-upgrade`).

**Opzioni utili** _(stepTitle)_

| **Opzione** | **Effetto** |
|---|---|
| `-upgrade` | Aggiorna provider e moduli alla versione più recente consentita dai vincoli, ignorando il lock file |
| `-reconfigure` | Reinizializza il backend ignorando la configurazione salvata (senza migrare lo state) |
| `-migrate-state` | Migra lo state esistente verso il nuovo backend |
| `-force-copy` | Risponde "sì" alle domande di migrazione (implica `-migrate-state`) |
| `-backend=false` | Salta l'inizializzazione del backend |
| `-backend-config=...` | Passa parametri parziali di configurazione del backend (file o `KEY=VALUE`) |
| `-get=false` | Salta l'installazione dei moduli figli |
| `-from-module=SOURCE` | Copia un modulo in una directory vuota prima di inizializzarla |
| `-plugin-dir=PATH` | Installa i provider solo da quella cartella |
| `-lockfile=readonly` | Verifica gli hash del lock file senza modificarlo |
| `-input=false` | Disabilita i prompt interattivi (utile in CI) |

> **Opzione globale -chdir**: `terraform -chdir=DIR <comando>` esegue qualsiasi comando come se ci si trovasse nella directory indicata. Va messa **prima** del sottocomando, ad esempio `terraform -chdir=infra plan`.
_(infoBox)_

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

**Planning mode** _(stepTitle)_

Le modalità sono **mutuamente esclusive** e valgono sia per `plan` sia per `apply`:

| **Modalità** | **Opzione** | **Obiettivo del piano** |
|---|---|---|
| **Normal** | (default) | Allineare l'infrastruttura reale alla configurazione |
| **Destroy** | `-destroy` | Distruggere tutti gli oggetti gestiti, lasciando lo state vuoto (come `terraform destroy`) |
| **Refresh-only** | `-refresh-only` | Aggiornare solo state e output alle modifiche fatte fuori da Terraform, senza toccare l'infrastruttura |

**Opzioni importanti** _(stepTitle)_

- `-out=tfplan`: salva il piano in un file; poi `terraform apply tfplan` applica **esattamente** quel piano.
- `-var`, `-var-file`: valorizzano le variabili.
- `-target=ADDR`: limita il piano a una risorsa (da usare solo in casi eccezionali).
- `-replace=ADDR`: forza la sostituzione di una risorsa (alternativa moderna a `terraform taint`, deprecato).
- `-refresh=false`: salta la sincronizzazione con gli oggetti remoti. È più veloce, ma ignora le modifiche esterne e il piano può risultare incompleto. Non si combina con `-refresh-only`.
- `-parallelism=n`: numero di operazioni concorrenti (default 10).
- `-detailed-exitcode`: exit code 0 = nessuna modifica, 1 = errore, 2 = modifiche presenti.

**Rivedere un piano salvato** _(stepTitle)_

- Il file di piano è binario: si legge con `terraform show tfplan`, oppure in JSON con `terraform show -json tfplan`.
- Il JSON contiene, tra l'altro, la configurazione, le variabili usate, le `resource_changes`, i `planned_values` e lo `prior_state`.
- Un piano salvato contiene **in chiaro** i valori sensibili e la configurazione del backend: va trattato come un dato riservato.

### 3.4.2 — Il grafo delle dipendenze

Terraform costruisce un **grafo aciclico diretto** (DAG) delle risorse. Le dipendenze derivano dai riferimenti (implicite) o da `depends_on` (esplicite). Il grafo determina l'ordine di creazione/distruzione e permette di eseguire **in parallelo** le operazioni indipendenti (di default fino a 10 alla volta, `-parallelism=n`).

- `terraform graph` emette il grafo in formato DOT.
- In distruzione l'ordine è inverso rispetto alla creazione.

**Tipi di nodo** _(stepTitle)_

- **Resource node**: una singola risorsa (con `count`, un nodo per ogni istanza); contiene configurazione, diff e state.
- **Provider configuration node**: il momento in cui il provider riceve la propria configurazione (es. le credenziali).
- **Resource meta-node**: raggruppa le istanze di una risorsa con `count` > 1, senza azioni proprie.

**Come viene costruito** _(stepTitle)_

1. Si aggiungono i nodi delle risorse della configurazione, con eventuali diff e state.
2. Si collegano i provisioner e si creano gli archi delle dipendenze esplicite (`depends_on`).
3. Si aggiungono le risorse **orfane**: presenti nello state ma non più nella configurazione, quindi da distruggere.
4. Si collegano le risorse ai nodi di configurazione dei provider.
5. Si analizzano le espressioni per ricavare le dipendenze implicite tra risorse.
6. Se una risorsa va sostituita, il suo nodo si divide in "distruggi" e "crea", perché i due ordini possono differire.
7. Si verifica che il grafo non abbia **cicli** e abbia una sola radice.

La visita del grafo è **in parallelo**: un nodo parte appena tutte le sue dipendenze sono completate, fino al limite di `-parallelism`.

---

## 3.5 — Applicare le modifiche

### 3.5.1 — terraform apply

`terraform apply` esegue le modifiche previste dal piano e funziona in due modalità:

| **Modalità** | **Come** | **Comportamento** |
|---|---|---|
| **Automatic plan mode** | `terraform apply` | Crea un nuovo piano (accetta tutte le planning mode e le opzioni di `plan`) e chiede conferma digitando `yes` |
| **Saved plan mode** | `terraform apply tfplan` | Esegue il piano salvato **senza** chiedere conferma: passare il file vale come approvazione. Non si possono aggiungere altre opzioni di pianificazione |

- `-auto-approve`: salta la conferma (CI/CD, ma con cautela); con un piano salvato viene ignorato.
- `-refresh-only`: applica solo l'aggiornamento dello state.
- `-replace=ADDR`: forza la sostituzione di un'istanza; si può ripetere per più risorse.
- `-input=false` disabilita anche la richiesta di conferma, quindi senza piano salvato o `-auto-approve` l'apply fallisce.
- Terraform **non fa rollback**: se un'operazione fallisce, ciò che è stato creato resta nello state. Una risorsa creata solo in parte risulta **tainted** e sarà ricreata al prossimo apply.
- Al termine Terraform stampa gli **output** definiti.

> **Concorrenza**: con un backend che supporta il **locking**, durante apply lo state viene bloccato; un secondo apply fallisce finché il lock non è rilasciato. `-lock=false` lo disabilita (sconsigliato).
_(infoBox)_

---

## 3.6 — Distruggere l'infrastruttura

### 3.6.1 — terraform destroy

`terraform destroy` elimina **tutte** le risorse gestite dalla configurazione corrente (è equivalente a `terraform apply -destroy`). Mostra il piano di distruzione e chiede conferma.

- Utile per ambienti temporanei e per evitare costi inutili.
- `terraform destroy -target=ADDR` elimina solo una risorsa e ciò che ne dipende.
- **Rimuovere un blocco `resource`** dalla configurazione e fare `apply` distrugge quella risorsa: diventa orfana nello state e Terraform la elimina.
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

> **Nota**: `fmt` cambia solo la formattazione, non la semantica. Analizza l'HCL quel tanto che basta per trovare errori di sintassi o blocchi malformati, ma non verifica la configurazione rispetto ai provider. Per questo, dopo `fmt` si esegue `terraform validate`.
_(infoBox)_

- Senza argomenti formatta i file della directory corrente; si può indicare un file o una directory.
- Con `-` al posto del percorso legge da stdin e scrive su stdout.

**Link di riferimento** _(stepTitle)_

- [Core workflow](https://developer.hashicorp.com/terraform/intro/v1.12.x/core-workflow)
- [init](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/init) · [validate](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/validate) · [plan](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/plan) · [apply](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/apply) · [destroy](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/destroy) · [fmt](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/fmt)
- [Grafo delle dipendenze](https://developer.hashicorp.com/terraform/internals/v1.12.x/graph)
