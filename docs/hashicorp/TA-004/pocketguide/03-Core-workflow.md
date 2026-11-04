# Usare il core workflow di Terraform

_Questo è un obiettivo molto pratico, e lo userai ogni giorno. Segue esattamente la struttura della guida ufficiale. Poiché il materiale è tanto, puoi saltare direttamente alla parte su cui vuoi concentrarti: consiglio di seguirle in ordine, ma sentiti libero di muoverti come preferisci._

## Descrivere il workflow di Terraform

*Fonti: [Core Terraform Workflow Overview](https://developer.hashicorp.com/terraform/intro/v1.12.x/core-workflow), [Create a terraform plan](https://developer.hashicorp.com/terraform/tutorials/cli/plan), [Apply terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/apply), [Initialize a terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/init)*

### 3a.1: la Trinità di Terraform

Il core workflow è un ciclo: **Write** → **Plan** → **Apply**.

**Write (scrivere)** _(stepTitle)_

- Scrivi l'infrastruttura come codice in file `.tf` (o `.tf.json`).
- Usi HCL (HashiCorp Configuration Language) per dichiarare lo stato finale desiderato delle risorse.
- Di solito conservi questo codice in un sistema di controllo di versione (VCS) come Git.

**Plan (pianificare)** _(stepTitle)_

- Esegui `terraform plan`.
- Terraform legge la configurazione, legge lo **state file** (o ne crea uno vuoto se non esiste) ed esegue un **refresh** per interrogare lo stato reale attuale dell'infrastruttura.
- Genera un piano di esecuzione: un diff che mostra quali azioni intraprenderà per far corrispondere il mondo reale alla configurazione.
- È un'operazione di sola lettura. Nessuna infrastruttura viene modificata.

**Apply (applicare)** _(stepTitle)_

- Esegui `terraform apply`.
- Terraform presenta il piano di esecuzione e chiede conferma (yes).
- Dopo l'approvazione, esegue il piano effettuando chiamate API per creare, aggiornare o distruggere risorse.
- Aggiorna lo state file per riflettere la nuova realtà.

**Il ciclo:** dopo apply torni a Write per fare ulteriori modifiche. Il ciclo è lo stesso sia per il singolo professionista sia per un grande team (anche se i team lo arricchiscono con branch VCS e pull request).

### 3a.2: workflow individuale vs. di team

La guida distingue tra lavorare da soli e lavorare in un team.

**Individuale** _(stepTitle)_

- Scrivi il codice nel tuo editor.
- Esegui `terraform plan` ripetutamente per individuare errori di sintassi e validare la logica.
- Esegui `terraform apply` quando sei pronto.
- Fai il push del codice su un VCS remoto per conservarlo al sicuro.

**Team** _(stepTitle)_

- Scrivi il codice in feature branch per evitare conflitti.
- Usa un **backend remoto** condiviso per lo state (Obiettivo 6), così tutti lavorano con lo stesso state.
- Usa una pipeline CI/CD (come HCP Terraform) per eseguire `terraform plan` e `terraform apply` in un ambiente coerente.
- Usa i **piani speculativi** sulle pull request per visualizzare in anteprima le modifiche prima del merge.
- Usa i **controlli di policy (Sentinel/OPA)** per imporre la conformità prima dell'apply.

### 3a.3: workflow potenziato da HCP Terraform

La guida sottolinea come HCP Terraform potenzia ogni fase:

- **Write**: archiviazione centralizzata delle variabili, registry privato dei moduli.
- **Plan**: piani speculativi sulle PR, stima dei costi, controlli di policy.
- **Apply**: esecuzione remota sicura, cronologia delle run, notifiche.

> Tratteremo HCP Terraform in profondità nell'Obiettivo 8. Per ora sappi che il core workflow resta lo stesso; HCP Terraform aggiunge livelli di collaborazione e governance.

### 3a.4: laboratorio pratico: il ciclo principale con il provider local

Obiettivo: sperimentare il ciclo `Write` → `Plan` → `Apply`.

**Passo 1: crea la directory obj3a-lab e il file main.tf** _(stepTitle)_

```hcl
resource "local_file" "example" {
  content  = "This is version 1"
  filename = "${path.module}/output.txt"
}
```

**Passo 2: terraform init** _(stepTitle)_

- Scarica il provider `local`.

**Passo 3: terraform plan** _(stepTitle)_

- Osserva l'output: azione `+ create`.

**Nota:** Terraform mostra il nome del file e il contenuto.

**Passo 4: terraform apply** _(stepTitle)_

- Digita `yes`.
- Compare il file `output.txt`.

**Passo 5: modifica main.tf cambiando il contenuto in "This is version 2"** _(stepTitle)_

- Esegui `terraform plan`. Osserva `~` update in-place.
- Esegui `terraform apply`. Il contenuto del file cambia.

**Passo 6: elimina completamente il blocco resource** _(stepTitle)_

- Esegui `terraform plan`. Osserva `-` destroy.
- Esegui `terraform apply`. Il file viene eliminato.

> Questo ciclo è la base di tutto il lavoro con Terraform.

### 3a.5: Mini-quiz 3a

1. Vero/Falso: `terraform plan` è di sola lettura e mostra in anteprima le modifiche che Terraform intende apportare.
  - Vero / Falso
2. Scelta multipla: quale ordine descrive meglio il core workflow di Terraform?
  - A. Plan → Write → Apply
  - B. Write → Plan → Apply
  - C. Write → Apply → Plan
3. Risposta multipla: quali sono aggiunte comuni del workflow di team? (Selezionane DUE)
  - A. Feature branch e pull request
  - B. Backend remoto condiviso per lo state
  - C. Modificare a mano lo state file per fare prima
  - D. Saltare `plan` in CI per ridurre il rumore

**Risposte** _(stepTitle)_

1. Vero — `terraform plan` mostra in anteprima le modifiche e non modifica l'infrastruttura.
2. Write → Plan → Apply.
3. Feature branch e pull request; backend remoto condiviso per lo state.

## Inizializzare una directory di lavoro Terraform (terraform init)

*Fonti: [Initialize Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/init), [terraform init command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/init), [Dependency lock file](https://developer.hashicorp.com/terraform/language/v1.12.x/files/dependency-lock)*

### 3b.1: cosa fa terraform init

La documentazione di `terraform init` indica che esegue diversi passi di inizializzazione:

1. Inizializzazione del backend: legge il blocco `backend` o `cloud` e prepara l'archiviazione dello state.
2. Installazione dei provider: scarica i plugin dei provider specificati in `required_providers`.
3. Installazione dei moduli: scarica i moduli figli referenziati nei blocchi `module`.
4. Gestione del lock file: crea o aggiorna `.terraform.lock.hcl`.

> **Nota importante:** init si può eseguire in sicurezza più volte. Non elimina configurazione né state.

### 3b.2: opzioni e flag principali

Dal riferimento del comando `terraform init`:

| Flag | Scopo |
|---|---|
| `-upgrade` | Aggiorna moduli e provider alla versione più recente consentita dai vincoli, ignorando il lock file. |
| `-reconfigure` | Riconfigura il backend, ignorando qualsiasi configurazione salvata esistente. |
| `-migrate-state` | Migra lo state esistente nel nuovo backend (chiede conferma). |
| `-backend-config=FILE` | Fornisce la configurazione del backend da un file (utile per la configurazione parziale). |
| `-lock=false` | Disabilita lo state locking (pericoloso). |
| `-input=false` | Disabilita le richieste interattive (utile in automazione). |
| `-json` | Produce output JSON leggibile da macchina (per gli strumenti). |

**Nota importante:** `-upgrade` aggiorna solo provider/moduli già installati. Se aggiungi un nuovo provider, `init` lo scarica indipendentemente da `-upgrade`.

### 3b.3: la directory .terraform e il lock file

Dopo `init`, Terraform crea:

- `.terraform/` — contiene i provider e i moduli scaricati.
- `.terraform.lock.hcl` — dependency lock file.

**Nota importante** _(stepTitle)_

- La directory `.terraform` non va committata nel controllo di versione. Contiene binari specifici della piattaforma.
- Il lock file va committato. Garantisce che tutti usino esattamente le stesse versioni dei provider.

### 3b.4: configurazione parziale del backend

Le configurazioni del backend contengono spesso valori sensibili o dinamici che non andrebbero scritti nel codice. Terraform supporta la configurazione parziale:

```hcl
terraform {
  backend "s3" {
    # bucket e key omessi: verranno forniti al momento dell'init
  }
}
```

Poi esegui:

```bash
terraform init -backend-config="bucket=mybucket" -backend-config="key=prod/terraform.tfstate"
```

Oppure usa un file:

```bash
terraform init -backend-config=backend.hcl
```

**Nota importante:** il blocco backend non può usare `variables`, ma la configurazione parziale permette di passare valori dinamici da CLI.

### 3b.5: laboratorio pratico: i flag di terraform init

**Obiettivo:** osservare l'effetto di `-upgrade` e il comportamento del lock file.

**Passo 1: crea obj3b-lab/main.tf con:** _(stepTitle)_

```hcl
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5.0"
    }
  }
}
```

**Passo 2: esegui terraform init** _(stepTitle)_

Annota la versione installata (es. 3.5.1). Osserva il lock file creato.

**Passo 3: cambia il vincolo di versione in ~> 3.6.0** _(stepTitle)_

- Esegui `terraform init`. Dovrebbe fallire perché la versione bloccata 3.5.1 non soddisfa il vincolo.
- Esegui `terraform init -upgrade`. Aggiorna il lock file alla 3.6.x.

**Passo 4: elimina la directory .terraform e il lock file** _(stepTitle)_

- Esegui `terraform init`. Crea un nuovo lock file con l'ultima versione compatibile.

### 3b.6: Mini-quiz: terraform init

1. Vero/Falso: `terraform init` può installare plugin dei provider e scaricare moduli figli.
  - Vero / Falso
2. Scelta multipla: quale file memorizza le versioni bloccate dei provider e i checksum?
  - A. terraform.tfstate
  - B. .terraform.lock.hcl
  - C. backend.hcl
3. Scelta multipla: cosa fa `terraform init -upgrade`?
  - A. Ricrea tutta l'infrastruttura da zero
  - B. Cerca versioni accettabili più recenti di provider/moduli e aggiorna il lock file quando serve
  - C. Valida la configurazione senza scaricare nulla

**Risposte** _(stepTitle)_

1. Vero — `init` prepara la directory di lavoro, inclusi provider e moduli.
2. `.terraform.lock.hcl`.
3. Cerca versioni accettabili più recenti e aggiorna il lock file quando serve.

## Validare una configurazione Terraform (terraform validate)

*Fonti: [terraform validate command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/validate), [Initialize Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow#validate-your-configuration)*

### 3c.1: scopo di terraform validate

`terraform validate` verifica se una configurazione è **sintatticamente valida** e **internamente coerente**. Non controlla servizi remoti, state o API dei provider.

**La validazione comprende** _(stepTitle)_

- Sintassi HCL corretta.
- Tipi di resource e nomi di data source validi.
- Presenza degli argomenti obbligatori.
- Tipi corretti per gli argomenti.
- Assenza di dipendenze circolari in `depends_on`.

**NON controlla** _(stepTitle)_

- Se un ID AMI esiste davvero.
- Se i permessi IAM sono sufficienti.
- Se i nomi delle risorse sono univoci a livello globale (es. nomi dei bucket S3).

### 3c.2: prerequisiti

Dalla documentazione: *"La validazione richiede una directory di lavoro inizializzata con tutti i plugin e i moduli referenziati installati."*

Devi eseguire `terraform init` prima di `terraform validate`. Se non l'hai fatto, Terraform dà un errore "Provider not found."

### 3c.3: opzioni del comando

| Flag | Scopo |
|---|---|
| `-json` | Produce i risultati in formato JSON leggibile da macchina (utile per le integrazioni con gli editor). |
| `-no-color` | Disabilita i codici colore del terminale. |

**Nota importante:** anche `terraform plan` esegue una validazione implicita prima di generare il piano. Se vuoi solo la validazione, usa `terraform validate`.

### 3c.4: formato dell'output JSON

La documentazione descrive la struttura dell'output JSON:

- `valid`: booleano che indica la validità complessiva.
- `error_count`, `warning_count`: conteggi interi.
- `diagnostics`: array di oggetti con severity (`"error"` o `"warning"`), summary, detail e un `range` facoltativo (posizione nel sorgente).

**Nota importante:** una configurazione può essere `valid: true` e avere comunque `warning_count > 0`. Gli warning non invalidano la configurazione.

### 3c.5: laboratorio pratico: errori di validazione

**Passo 1: crea obj3c-lab/main.tf con un errore di sintassi intenzionale:** _(stepTitle)_

```hcl
resource "local_file" "bad" {
  content = "Missing closing quote
  filename = "test.txt"
}
```

**Passo 2: esegui terraform init (necessario)** _(stepTitle)_

**Passo 3: esegui terraform validate** _(stepTitle)_

- Osserva il messaggio di errore con il numero di riga.

**Passo 4: correggi l'errore di sintassi, ma cambia il tipo di risorsa in local_fil (refuso)** _(stepTitle)_

- Esegui `terraform validate`. Osserva l'errore sul tipo di risorsa sconosciuto.

**Passo 5: correggi il tipo di risorsa ma ometti l'argomento obbligatorio filename** _(stepTitle)_

- Esegui `terraform validate`. Osserva l'errore sull'argomento obbligatorio mancante.

> Questo consolida cosa intercetta `terraform validate` e cosa no.

### 3c.6: Mini-quiz: terraform validate

1. Vero/Falso: `terraform validate` interroga le API dei provider per confermare che un ID AMI o un nome di risorsa esista davvero.
  - Vero / Falso
2. Scelta multipla: di quale prerequisito ha di solito bisogno `terraform validate`?
  - A. Un plan file generato
  - B. Una directory di lavoro inizializzata con provider/moduli installati
  - C. Solo un backend remoto
3. Risposta multipla: quali problemi può intercettare `terraform validate`? (Selezionane DUE)
  - A. Errori di sintassi HCL
  - B. Argomenti obbligatori mancanti
  - C. Problemi reali di permessi sulle API
  - D. Univocità globale dei nomi delle risorse

**Risposte** _(stepTitle)_

1. Falso — validate non chiama API remote.
2. Una directory di lavoro inizializzata con provider/moduli installati.
3. Errori di sintassi HCL e argomenti obbligatori mancanti.

## Generare e rivedere un piano di esecuzione (terraform plan)

*Fonti: [Create a Terraform plan](https://developer.hashicorp.com/terraform/tutorials/cli/plan), [terraform plan command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/plan), [Resource graph](https://developer.hashicorp.com/terraform/internals/v1.12.x/graph)*

### 3d.1: cosa fa terraform plan

1. Legge configurazione e state.
2. Esegue il refresh dello state (di default): interroga le risorse reali per aggiornare lo state file con gli attributi attuali.
3. Confronta lo stato desiderato (configurazione) con lo stato attuale (state file).
4. Genera un piano di esecuzione che elenca le azioni per riconciliare le differenze.

### 3d.2: modalità di pianificazione

La documentazione elenca due modalità di pianificazione alternative:

| Modalità | Flag | Scopo |
|---|---|---|
| Destroy | `-destroy` | Crea un piano per distruggere tutte le risorse gestite dal workspace. |
| Refresh-only | `-refresh-only` | Crea un piano per aggiornare lo state in modo che corrisponda alle risorse reali, senza modificare la configurazione. |

**Nota importante:** `-refresh-only` è più sicuro del comando deprecato `terraform refresh` perché ti permette di rivedere le modifiche prima di applicarle allo state.

### 3d.3: opzioni di pianificazione

| Opzione | Scopo |
|---|---|
| `-refresh=false` | Salta il refresh dello state prima del plan (più veloce ma può non rilevare modifiche esterne). |
| `-replace=ADDRESS` | Forza la sostituzione di una risorsa specifica (es. aws_instance.web). |
| `-target=ADDRESS` | Limita la pianificazione a una risorsa specifica e alle sue dipendenze (usare con parsimonia). |
| `-var 'NAME=VALUE'` | Imposta il valore di una variabile. |
| `-var-file=FILENAME` | Carica le variabili da un file. |

**Avvertenza su `-target`:** la documentazione afferma esplicitamente: "*Questa capacità di targeting è fornita per circostanze eccezionali.*" Significa che non è consigliato usare `-target` per le operazioni di routine.

### 3d.4: piani salvati

Puoi salvare un piano in un file con `-out=FILENAME`:

```bash
terraform plan -out=tfplan
```

**Perché salvare i piani?** _(stepTitle)_

- In automazione vuoi applicare esattamente il piano che è stato rivisto e approvato.
- Applicare un piano salvato garantisce che tra plan e apply non sia intervenuto alcun drift.

**Applicare un piano salvato** _(stepTitle)_

```bash
terraform apply tfplan
```

**Nota di sicurezza importante:** i plan file salvati contengono in chiaro tutti i valori delle variabili, compresi quelli sensibili. Trattali come segreti.

### 3d.5: simboli dell'output del plan

Il plan usa simboli per indicare le azioni:

- `+` : creazione
- `-` : distruzione
- `~` : aggiornamento in-place
- `-/+` : sostituzione (prima distrugge, poi crea)
- `+/-` : sostituzione (crea prima di distruggere, per via del lifecycle `create_before_destroy`)

**Nota importante:** devi saper riconoscere il significato di ogni simbolo in un output di plan d'esempio.

### 3d.6: exit code dettagliati

Con `-detailed-exitcode`:

- `0` = completato con diff vuoto (nessuna modifica)
- `1` = errore
- `2` = completato con diff non vuoto (modifiche presenti)

> È fondamentale per gli script di CI/CD.

### 3d.7: laboratorio pratico: pianificare con il provider local

**Passo 1: crea obj3d-lab/main.tf con:** _(stepTitle)_

```hcl
resource "local_file" "test" {
  content  = "Hello"
  filename = "${path.module}/hello.txt"
}
```

**Passo 2: esegui terraform init e terraform apply** _(stepTitle)_

**Passo 3: modifica il contenuto in "Hello World"** _(stepTitle)_

- Esegui `terraform plan`. Osserva l'aggiornamento `~`.
- Esegui `terraform plan -out=tfplan`.

Osserva che il file viene creato.

**Passo 4: applica il piano salvato** _(stepTitle)_

```bash
terraform apply tfplan
```

> **Nota**: nessuna richiesta di conferma, perché il piano è già approvato.

**Passo 5: elimina il file a mano (simula una modifica esterna)** _(stepTitle)_

- Esegui `terraform plan -refresh-only`. Osserva che Terraform rileva il drift e propone di aggiornare lo state.
- Esegui `terraform apply -refresh-only` per accettare l'aggiornamento dello state.

**Passo 6: esegui terraform plan -destroy per vedere il piano di distruzione senza eseguirlo** _(stepTitle)_

### Mini-quiz: terraform plan

1. Vero/Falso: `terraform apply -refresh-only` aggiorna lo state per farlo corrispondere alla realtà senza modificare l'infrastruttura.
  - Vero / Falso
2. Scelta multipla: cosa fa `-out=tfplan`?
  - A. Salva il piano esatto in un file per applicarlo in seguito
  - B. Esporta lo state file in JSON
  - C. Esegue automaticamente apply dopo la pianificazione
3. Risposta multipla: quali simboli possono comparire nell'output di un plan? (Selezionane DUE)
  - A. `+` creazione
  - B. `~` aggiornamento in-place
  - C. `!` aggiornamento forzato
  - D. `?` solo refresh

**Risposte** _(stepTitle)_

1. Vero.
2. Salva il piano esatto in un file.
3. `+` creazione e `~` aggiornamento in-place.

## Applicare modifiche all'infrastruttura (terraform apply)

*Fonti: [Apply Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/apply), [terraform apply command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/apply)*

### 3e.1: modalità di funzionamento

`terraform apply` si può usare in due modi:

1. **Modalità plan automatico (senza argomento plan file):**

- Terraform genera un nuovo piano, lo mostra e chiede l'approvazione.
- Puoi usare tutte le opzioni di pianificazione (`-var`, `-replace`, ecc.).

2. **Modalità piano salvato (con argomento plan file):**

- Terraform applica esattamente le azioni del piano salvato.
- Nessuna richiesta di conferma (il plan file è considerato un'approvazione).
- Nessuna opzione di pianificazione ammessa (il piano è già fissato).

### 3e.2: opzioni di apply

| Opzione | Scopo |
|---|---|
| `-auto-approve` | Salta l'approvazione interattiva (utile in automazione, ma assicurati che il piano sia stato rivisto). |
| `-compact-warnings` | Mostra gli warning in forma compatta. |
| `-lock=false` | Non mantiene il lock dello state (pericoloso). |
| `-lock-timeout=DURATION` | Per quanto tempo riprovare ad acquisire il lock (es. `30s`). |
| `-parallelism=n` | Limita le operazioni concorrenti (default 10). |
| `-json` | Output JSON leggibile da macchina. |

### 3e.3: i passi di apply nel dettaglio

Dal tutorial "Apply Terraform configuration" della documentazione, quando esegui apply Terraform:

1. Blocca lo state (se usi un backend con locking).
2. Crea un piano (o usa il piano fornito).
3. Attende l'approvazione (a meno di `-auto-approve` o di un piano salvato).
4. Esegue il piano: effettua le chiamate API in ordine di dipendenza, in parallelo quando possibile.
5. Aggiorna lo state file con i nuovi attributi delle risorse.
6. Sblocca lo state.
7. Riporta gli output definiti nella configurazione.

### 3e.4: gestione degli errori durante apply

Se si verifica un errore a metà apply:

- Terraform registra l'errore.
- Aggiorna lo state per riflettere le risorse create o modificate con successo.
- Sblocca lo state.
- Esce con un codice diverso da zero.

**Punto importante:** Terraform non esegue automaticamente il rollback di un **apply completato parzialmente**. L'infrastruttura può trovarsi in uno stato incoerente. Devi correggere l'errore ed eseguire di nuovo `terraform apply` per convergere allo stato desiderato.

### 3e.5: laboratorio pratico: apply con errore

Obiettivo: osservare il comportamento di apply in caso di errore.

**Passo 1: crea obj3e-lab/main.tf con una risorsa che fallirà:** _(stepTitle)_

```hcl
resource "local_file" "will_fail" {
  content  = "test"
  filename = "/root/cannot_write_here.txt"  # Permesso negato (a meno di essere root)
}
```

**Passo 2: esegui terraform init e terraform apply** _(stepTitle)_

Osserva l'errore.

**Passo 3: controlla lo state file (terraform show)** _(stepTitle)_

Nessuna risorsa creata, perché la creazione del file locale fallisce prima dell'aggiornamento dello state.

**Passo 4: modifica il percorso con uno valido ed esegui di nuovo terraform apply** _(stepTitle)_

Questo dimostra che devi risolvere l'errore e rieseguire apply.

### 3e.6: Mini-quiz: terraform apply

1. Vero/Falso: quando applichi un plan file salvato, Terraform chiede di nuovo conferma.
  - Vero / Falso
2. Scelta multipla: qual è il parallelismo massimo predefinito per le operazioni di apply?
  - A. 1
  - B. 5
  - C. 10
3. Risposta multipla: cosa succede se un apply fallisce a metà? (Selezionane DUE)
  - A. Terraform può lasciare l'infrastruttura applicata parzialmente.
  - B. Terraform esegue automaticamente il rollback di tutte le risorse create.
  - C. Terraform aggiorna lo state per le risorse andate a buon fine.
  - D. Terraform elimina lo state file.

**Risposte** _(stepTitle)_

1. Falso — un plan file salvato è considerato approvato.
2. 10.
3. Terraform può lasciare l'infrastruttura applicata parzialmente e aggiorna lo state per le risorse andate a buon fine.

## Distruggere l'infrastruttura gestita da Terraform (terraform destroy)

*Fonti: [terraform destroy command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/destroy), [Apply Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/cli/apply)*

### 3f.1: cosa fa destroy

terraform destroy è un alias di comodo per:

```bash
terraform apply -destroy
```

Crea un piano di distruzione (che mostra tutte le risorse che verranno eliminate), chiede conferma e poi esegue il piano.

### 3f.2: opzioni principali

| Opzione | Scopo |
|---|---|
| `-auto-approve` | Salta la richiesta di conferma. Usare con cautela. |
| `-target=ADDRESS` | Distrugge solo una risorsa specifica e le sue dipendenze. |

**Nota importante:** usare `-target` con destroy può lasciare le risorse dipendenti in uno stato rotto. Usare con cautela.

### 3f.3: ordine di distruzione

Terraform distrugge le risorse in ordine di dipendenza inverso.

Per esempio, se un'istanza EC2 dipende da un security group, Terraform distruggerà l'istanza prima del security group. Questo evita errori API (non si può eliminare un security group in uso).

**Nota importante:** il grafo delle dipendenze garantisce automaticamente l'ordine di distruzione corretto.

### 3f.4: laboratorio pratico: workflow di distruzione

**Passo 1: usa uno qualsiasi dei laboratori precedenti con delle risorse** _(stepTitle)_

**Passo 2: esegui terraform plan -destroy e osserva il piano** _(stepTitle)_

**Passo 3: esegui terraform destroy, digita yes e osserva le risorse eliminate** _(stepTitle)_

**Passo 4: controlla lo state file: dovrebbe essere vuoto (nessuna risorsa)** _(stepTitle)_

### 3f.5: Mini-quiz: terraform destroy

1. Vero/Falso: `terraform destroy` è un alias di comodo per `terraform apply -destroy`.
  - Vero / Falso
2. Scelta multipla: in quale ordine Terraform distrugge le risorse?
  - A. Ordine casuale
  - B. Ordine di dipendenza inverso
  - C. Ordine alfabetico per tipo di risorsa
3. Risposta multipla: quali affermazioni su `-target` durante destroy sono vere? (Selezionane DUE)
  - A. Va usato con attenzione perché può lasciare indietro delle dipendenze.
  - B. È consigliato per le operazioni di distruzione di routine.
  - C. Può distruggere solo una risorsa specifica e le sue dipendenze.
  - D. Distrugge sempre l'intero workspace.

**Risposte** _(stepTitle)_

1. Vero.
2. Ordine di dipendenza inverso.
3. Va usato con attenzione perché può lasciare indietro delle dipendenze; può distruggere solo una risorsa specifica e le sue dipendenze.

## Applicare correzioni di formattazione e stile (terraform fmt)

*Fonti: [terraform fmt command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/fmt), [Format configuration](https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow#format-the-configuration)*

### 3g.1: scopo di fmt

`terraform fmt` riscrive i file di configurazione Terraform in un formato e uno stile canonici. Impone:

- Indentazione coerente (due spazi).
- Allineamento dei segni =.
- Rimozione degli spazi bianchi superflui.
- Ordinamento corretto degli argomenti.

**Nota importante:** `terraform fmt` è "opinionated" e non ha opzioni di personalizzazione. Il suo obiettivo è la coerenza tra le codebase Terraform.

### 3g.2: utilizzo del comando

```bash
terraform fmt [options] [target...]
```

Di default analizza la directory corrente alla ricerca di file `.tf` e `.tfvars`.

- `-recursive`: elabora anche i file nelle sottodirectory.
- `-diff`: mostra le differenze di formattazione (i file vengono comunque riscritti, a meno di aggiungere `-check` o `-write=false`).
- `-check`: esce con codice diverso da zero se i file hanno bisogno di formattazione, senza modificarli (utile in CI).
- `-list=false`: non elenca i file formattati.

### 3g.3: laboratorio pratico: formattazione

**Passo 1: crea obj3g-lab/main.tf con una formattazione disordinata:** _(stepTitle)_

```hcl
resource    "local_file" "messy" {
  content = "bad spacing"
    filename = "out.txt"
}
```

**Passo 2: esegui terraform fmt -check -diff** _(stepTitle)_

Guarda le modifiche proposte, senza che il file venga riscritto.

**Passo 3: esegui terraform fmt** _(stepTitle)_

Il file viene riformattato.

**Passo 4: esegui terraform fmt -check** _(stepTitle)_

L'exit code 0 indica che è già formattato.

### 3g.4: Mini-quiz: terraform fmt

1. Vero/Falso: `terraform fmt` riscrive i file di configurazione in uno stile canonico.
  - Vero / Falso
2. Scelta multipla: quale opzione verifica la formattazione senza modificare i file?
  - A. `terraform fmt -diff`
  - B. `terraform fmt -check`
  - C. `terraform fmt -recursive`
3. Risposta multipla: quali sono comportamenti/opzioni validi di `terraform fmt`? (Selezionane DUE)
  - A. `-recursive` formatta anche le sottodirectory
  - B. `-check` restituisce un exit code diverso da zero se serve formattare
  - C. Si può personalizzare con un file `.terraform-fmt.conf`
  - D. Richiede un plan file salvato per essere eseguito

**Risposte** _(stepTitle)_

1. Vero.
2. `terraform fmt -check`.
3. `-recursive` formatta anche le sottodirectory; `-check` restituisce un codice diverso da zero se serve formattare.

## Quiz (oltre 20 domande)

Annota le tue risposte e confrontale con quelle fornite alla fine di questa sezione.

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Eseguire `terraform plan` esegue automaticamente `terraform init` se la directory di lavoro non è ancora stata inizializzata.

- Vero / Falso

**Domanda 2 (Vero/Falso)** _(stepTitle)_

Il comando `terraform apply`, se usato senza un plan file salvato, genera un nuovo piano di esecuzione e lo applica immediatamente senza alcuna interazione dell'utente.

- Vero / Falso

**Domanda 3 (scelta multipla)** _(stepTitle)_

Quale comando useresti per verificare se i file di configurazione Terraform seguono le convenzioni di stile canoniche senza modificarli?

- A. terraform fmt
- B. terraform fmt -check
- C. terraform validate -style
- D. terraform plan -style-check

**Domanda 4 (scelta multipla)** _(stepTitle)_

Un plan file di Terraform (tfplan) è stato creato con `terraform plan -out=tfplan`. Qual è il comando corretto per applicare esattamente questo piano?

- A. terraform apply tfplan
- B. terraform apply -plan=tfplan
- C. terraform apply -auto-approve tfplan
- D. terraform plan -apply tfplan

**Domanda 5 (risposta multipla)** _(stepTitle)_

Quali delle seguenti azioni esegue `terraform init`? **(Selezionane TRE)**

- A. Scarica e installa i plugin dei provider.
- B. Genera un piano di esecuzione per la configurazione corrente.
- C. Inizializza il backend configurato per l'archiviazione dello state.
- D. Valida la sintassi di tutti i file .tf.
- E. Scarica i moduli figli referenziati nei blocchi module.
- F. Crea le risorse definite nella configurazione.

**Domanda 6 (Vero/Falso)** _(stepTitle)_

Puoi usare variabili all'interno di un blocco backend per impostare dinamicamente il percorso dello state file in base al workspace corrente.

- Vero / Falso

**Domanda 7 (scelta multipla)** _(stepTitle)_

Cosa succede se esegui `terraform apply` e il processo di apply incontra un errore dopo aver creato con successo due delle tre risorse definite nella configurazione?

- A. Terraform esegue automaticamente il rollback delle due risorse create ed esce.
- B. Terraform interrompe l'esecuzione, registra le due risorse create nello state file ed esce con un errore.
- C. Terraform continua a tentare di creare la terza risorsa all'infinito.
- D. Terraform elimina le due risorse create e poi esce con un errore.

**Domanda 8 (scelta multipla)** _(stepTitle)_

Hai apportato modifiche manuali a una risorsa al di fuori di Terraform. Vuoi aggiornare lo state file di Terraform per farlo corrispondere allo stato reale attuale senza modificare la configurazione. Quale sequenza di comandi è l'approccio consigliato?

- A. terraform refresh
- B. terraform plan -refresh-only e poi terraform apply -refresh-only
- C. terraform state pull, poi modificare a mano il JSON e terraform state push
- D. terraform apply -target=resource_address

**Domanda 9 (Vero/Falso)** _(stepTitle)_

Il comando `terraform validate` richiede una directory di lavoro inizializzata (cioè deve essere stato eseguito `terraform init`) per funzionare correttamente.

- Vero / Falso

**Domanda 10 (scelta multipla)** _(stepTitle)_

In un ambiente di team che usa HCP Terraform, qual è lo scopo principale di un piano speculativo?

- A. Applicare modifiche all'infrastruttura di produzione fuori orario.
- B. Visualizzare in anteprima i potenziali effetti di una modifica di configurazione in una pull request prima del merge.
- C. Stimare il costo mensile dell'infrastruttura.
- D. Bloccare il workspace per impedire ad altri utenti di apportare modifiche.

**Domanda 11 (risposta multipla)** _(stepTitle)_

Quali delle seguenti sono opzioni valide del comando `terraform plan`? **(Selezionane TRE)**

- A. -destroy
- B. -refresh-only
- C. -auto-approve
- D. -out=FILENAME
- E. -compact-warnings

**Domanda 12 (Vero/Falso)** _(stepTitle)_

Un plan file di Terraform salvato (creato con `-out`) contiene l'intera configurazione, i valori delle variabili e le modifiche pianificate in un formato cifrato per proteggere i dati sensibili.

- Vero / Falso

**Domanda 13 (scelta multipla)** _(stepTitle)_

Cosa fa il comando `terraform fmt -recursive`?

- A. Formatta solo i file nella directory corrente.
- B. Formatta i file nella directory corrente e in tutte le sottodirectory.
- C. Formatta i file e ne valida anche la sintassi.
- D. Formatta i file e li committa automaticamente in Git.

**Domanda 14 (risposta multipla)** _(stepTitle)_

Quali affermazioni descrivono correttamente il comando `terraform destroy`? **(Selezionane DUE)**

- A. È un alias di terraform apply -destroy.
- B. Richiede un plan file salvato per essere eseguito.
- C. Chiede conferma prima di eliminare le risorse.
- D. Elimina solo le risorse commentate nella configurazione.
- E. Elimina lo state file insieme all'infrastruttura.

**Domanda 15 (scelta multipla)** _(stepTitle)_

Durante `terraform apply`, Terraform crea le risorse in parallelo quando possibile. Qual è il numero massimo predefinito di operazioni concorrenti sulle risorse?

- A. 1 (sequenziale)
- B. 5
- C. 10
- D. 20

**Domanda 16 (Vero/Falso)** _(stepTitle)_

Se esegui `terraform validate` su una configurazione che contiene un ciclo di depends_on (dipendenza circolare), rileverà e segnalerà l'errore.

- Vero / Falso

**Domanda 17 (scelta multipla)** _(stepTitle)_

Vuoi forzare la sostituzione di una specifica istanza EC2 (`aws_instance.web`) durante il prossimo `terraform apply`, anche se la sua configurazione non è cambiata. Quale comando useresti?

- A. terraform apply -replace=aws_instance.web
- B. terraform plan -destroy-target=aws_instance.web
- C. terraform taint aws_instance.web
- D. terraform apply -target=aws_instance.web

**Domanda 18 (risposta multipla)** _(stepTitle)_

Quali delle seguenti affermazioni sull'opzione `-target` sono vere? **(Selezionane DUE)**

- A. È consigliata per l'uso di routine, per velocizzare le operazioni su configurazioni grandi.
- B. Limita plan/apply alla risorsa specificata e alle sue dipendenze.
- C. Se usata regolarmente può causare drift di configurazione.
- D. Funziona con plan e apply ma non con destroy.

**Domanda 19 (scelta multipla)** _(stepTitle)_

Un membro del team esegue `terraform apply` ma dimentica di scaricare le ultime modifiche da Git. Il suo state file locale è più vecchio dello state remoto. Cosa succede se usa un backend remoto con state locking (es. S3 con DynamoDB)?

- A. Terraform sovrascriverà lo state remoto con quello locale.
- B. Terraform unirà lo state locale con quello remoto.
- C. Terraform non riuscirà ad acquisire il lock dello state perché il numero serial nello state remoto è più alto.
- D. Terraform scaricherà automaticamente lo state più recente prima di applicare.

**Domanda 20 (Vero/Falso)** _(stepTitle)_

Il comando `terraform fmt` si può personalizzare con un file `.terraform-fmt.conf` per regolare la dimensione dell'indentazione e le preferenze di allineamento.

- Vero / Falso

**Domanda 21 (scelta multipla)** _(stepTitle)_

Qual è l'exit code di `terraform plan -detailed-exitcode` se non ci sono modifiche da apportare?

- A. 0
- B. 1
- C. 2
- D. 3

**Domanda 22 (risposta multipla)** _(stepTitle)_

Quali dei seguenti file o directory non vanno committati nel controllo di versione? **(Selezionane TRE)**

- A. .terraform/
- B. terraform.tfstate
- C. .terraform.lock.hcl
- D. terraform.tfvars (se contiene dati sensibili)
- E. main.tf

**Domanda 23 (Vero/Falso)** _(stepTitle)_

Il comando `terraform plan -refresh-only` modificherà l'infrastruttura reale per farla corrispondere alla configurazione se viene rilevato un drift.

- Vero / Falso

### Risposte

**Risposte e brevi spiegazioni** _(stepTitle)_

**D1: FALSO** — `terraform plan` non esegue automaticamente `terraform init`. Se la directory di lavoro non è inizializzata, Terraform dà errore e ti chiede di eseguire prima `init`.

**D2: FALSO** — Senza un plan file salvato, `terraform apply` genera un nuovo piano di esecuzione **e chiede l'approvazione dell'utente** prima di applicare. Usa `-auto-approve` per saltare la richiesta.

**D3: B** — `terraform fmt -check` elenca i file che necessitano di formattazione e restituisce un exit code diverso da zero senza modificarli. `terraform fmt` da solo riscriverebbe i file.

**D4: A** — `terraform apply tfplan` applica il plan file salvato. Il flag `-out` si usa solo quando si *crea* il piano con `terraform plan -out=tfplan`.

**D5: A, C, E** — `terraform init` scarica/installa i plugin dei provider (A), inizializza il backend configurato per l'archiviazione dello state (C) e scarica i moduli figli referenziati nei blocchi `module` (E). **Non** genera un piano (B), non valida la sintassi (D) e non crea risorse (F).

**D6: FALSO** — I blocchi backend non possono usare variabili, local né alcun valore con nome. Devono essere letterali costanti, perché Terraform li valuta prima di elaborare le variabili.

**D7: B** — Terraform interrompe l'esecuzione, registra nello state file le risorse create con successo ed esce con un errore. **Non** esegue automaticamente il rollback delle risorse create.

**D8: B** — L'approccio consigliato è `terraform plan -refresh-only` seguito da `terraform apply -refresh-only`. Il vecchio comando `terraform refresh` è deprecato e meno sicuro perché non permette di rivedere le modifiche.

**D9: VERO** — `terraform validate` richiede una directory di lavoro inizializzata con provider e moduli installati. Devi eseguire prima `terraform init`, altrimenti la validazione fallisce.

**D10: B** — I piani speculativi mostrano in anteprima gli effetti di una modifica di configurazione in una pull request prima del merge. Sono run di solo plan attivate dai webhook del VCS (es. PR di GitHub).

**D11: A, B, D** — Opzioni valide di `terraform plan` sono `-destroy` (A), `-refresh-only` (B) e `-out=FILENAME` (D). `-auto-approve` (C) è per `apply`, non per plan. Anche `-compact-warnings` (E) è valida, quindi qualsiasi terna tra A, B, D, E è corretta.

**D12: FALSO** — I plan file salvati (`.tfplan`) **non sono cifrati**; contengono dati sensibili in chiaro (configurazione, valori delle variabili e modifiche pianificate). Trattali come artefatti sensibili e non committarli mai.

**D13: B** — `terraform fmt -recursive` formatta i file di configurazione nella directory corrente e in tutte le sottodirectory. Senza `-recursive` formatta solo la directory corrente.

**D14: A, C** — `terraform destroy` è un alias di `terraform apply -destroy` (A). Chiede conferma prima di eliminare le risorse (C). **Non** richiede un plan file salvato (B) e **non** elimina lo state file (E).

**D15: C** — Il parallelismo predefinito è di **10** operazioni concorrenti sulle risorse. Usa il flag `-parallelism=n` per cambiarlo.

**D16: VERO** — `terraform validate` rileva le dipendenze circolari (es. cicli di `depends_on`) e segnala un errore. È un controllo integrato.

**D17: A** — `terraform apply -replace=aws_instance.web` forza la ricreazione della risorsa specificata. Il vecchio comando `taint` è deprecato.

**D18: B, C** — L'opzione `-target` (B) limita le operazioni alla risorsa specificata e alle sue dipendenze. Usarla regolarmente (C) può causare drift di configurazione perché altre risorse possono andare fuori sincronia. **Non** è consigliata per l'uso di routine (A) e funziona anche con `destroy` (D).

**D19: D** — Con un backend remoto Terraform non usa uno state file locale: all'inizio di ogni run legge lo state più recente dal backend, quindi lavora sempre sulla versione aggiornata. Il lock serve a impedire run concorrenti, non a confrontare i serial; il controllo su serial e lineage scatta invece con `terraform state push`.

**D20: FALSO** — `terraform fmt` è "opinionated" e non si può personalizzare con file di configurazione. Non esiste un `.terraform-fmt.conf` o equivalente.

**D21: A** — Con `-detailed-exitcode`: `0` = successo senza modifiche, `1` = errore, `2` = successo con modifiche.

**D22: A, B, D** — Non committare `.terraform/` (A: cache di provider/moduli), `terraform.tfstate` (B: contiene dati sensibili) né `terraform.tfvars` se contiene segreti (D). Il lock file `.terraform.lock.hcl` (C) e `main.tf` (E) **vanno** committati.

**D23: FALSO** — `terraform plan -refresh-only` aggiorna solo lo state file per farlo corrispondere all'infrastruttura reale; **non** modifica le risorse reali. Un `terraform apply -refresh-only` separato applicherebbe quelle modifiche allo state, ma comunque **senza modifiche all'infrastruttura**.

---

Era parecchio, vero? Prenditi un momento per rivedere domande e risposte, e assicurati di capire il ragionamento dietro ciascuna. Il core workflow e i comandi sono fondamentali per usare Terraform in modo efficace, quindi è cruciale padroneggiare questi concetti prima di passare ad argomenti più avanzati.

Hai fatto molta strada nella comprensione del core workflow e dei comandi di Terraform. Nella prossima sezione approfondiremo l'Obiettivo 4, dedicato al linguaggio di configurazione di Terraform (HCL) e a come scrivere codice Terraform efficace. Si baserà sulle fondamenta costruite qui e ti introdurrà alla sintassi e alla struttura delle configurazioni Terraform.

Ricorda: la chiave per padroneggiare Terraform è la pratica. Ti incoraggio a sperimentare con i comandi e i concetti trattati in questa sezione creando le tue configurazioni Terraform e applicandole a infrastrutture reali o simulate. Questa esperienza pratica consoliderà la tua comprensione e ti preparerà agli argomenti più complessi che seguono.

Passiamo all'Obiettivo 4: scrivere configurazioni Terraform con HCL, dove esploreremo la sintassi e la struttura del linguaggio di configurazione di Terraform.
