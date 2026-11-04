# Gestione dello state di Terraform

_Questo obiettivo va oltre la scrittura del codice ed entra nella realtà operativa di Terraform. Lo state è la fonte di verità, la memoria della tua infrastruttura. Gestiscilo male e subirai interruzioni in produzione che nessuna quantità di HCL ingegnoso potrà sistemare._

### 6.0: il modello mentale dello state di Terraform

Tieni separate queste tre cose:

- La **configurazione** descrive lo stato finale desiderato.
- Lo **state** è la memoria di Terraform di ciò che crede esista già.
- L'**infrastruttura reale** è la risorsa cloud effettiva o l'oggetto locale.

*Terraform confronta la configurazione con lo state, poi aggiorna lo state a partire dalla realtà. Se lo state si allontana dalla realtà, Terraform può fare scelte sbagliate anche quando la configurazione è corretta. Per questo lo state va trattato come dato operativo, non come uno spazio di appunti usa e getta.*

La regola pratica: preferisci i refactoring dichiarativi (`moved`, `import`, `refresh-only`) alla modifica manuale dello state.

---

## Descrivere il backend locale

*Fonti: [Initialize Terraform Configuration](https://developer.hashicorp.com/terraform/tutorials/cli/init), [Backend Type local](https://developer.hashicorp.com/terraform/language/v1.12.x/backend/local), [Backend block configuration overview](https://developer.hashicorp.com/terraform/language/v1.12.x/backend)*

### 6a.1: che cos'è un backend?

In Terraform un backend determina due cose:

1. **Dove viene memorizzato lo state.**
2. **Come Terraform esegue le operazioni** (in locale o in remoto).

Ogni configurazione Terraform ha esattamente un backend. Se non ne configuri uno esplicitamente, Terraform usa il **backend local**.

### 6a.2: il backend local: comportamento predefinito

Il backend local memorizza lo state in un semplice file JSON chiamato `terraform.tfstate` nella directory root della configurazione. È la configurazione più semplice ed è perfettamente adatta a un **singolo sviluppatore** che lavora a un progetto personale.

**Cosa fa Terraform con il backend local** _(stepTitle)_

1. Durante `terraform plan`, legge `terraform.tfstate` dalla directory corrente.
2. Durante `terraform apply`, aggiorna `terraform.tfstate` con il nuovo state.
3. Prima di aggiornarlo, copia per sicurezza lo state esistente in `terraform.tfstate.backup`.

**File principali creati dal backend local** _(stepTitle)_

- `terraform.tfstate` — lo state file principale. Contiene tutti i metadati delle risorse in JSON.
- `terraform.tfstate.backup` — lo state precedente, salvato prima dell'ultimo `apply`. Serve al ripristino se lo state si corrompe durante un apply.

**Esempio di configurazione del backend local (esplicita, anche se predefinita)** _(stepTitle)_

```hcl
# È ciò che Terraform usa implicitamente quando non è specificato alcun backend.
# Raramente serve scriverlo esplicitamente. Lo scriviamo qui per capirlo.

terraform {
  # Il blocco backend definisce dove viene memorizzato lo state
  backend "local" {
    # 'path' è l'unico argomento. Il default è "terraform.tfstate"
    path = "terraform.tfstate"
  }
}
```

**Spiegazione della configurazione del backend local** _(stepTitle)_

- `terraform {` — il blocco di primo livello per configurare Terraform stesso (non l'infrastruttura).
- `backend "local" {` — dichiara che vogliamo usare il tipo di backend `local`. `"local"` è l'identificatore del tipo di backend.
- `path = "terraform.tfstate"` — specifica il percorso esatto del file in cui verrà scritto il JSON dello state. È relativo alla directory del modulo root. Se omesso, vale `terraform.tfstate`.

### 6a.3: limiti del backend local

Il backend local ha limiti critici per l'uso in team:

| Limite | Conseguenza |
|---|---|
| **Nessun locking condiviso** | Il backend local blocca lo state solo con i lock del filesystem della macchina locale: non c'è un servizio di lock condiviso, quindi copie separate dello stesso state possono essere modificate in contemporanea e sovrascriversi a vicenda. |
| **State memorizzato su disco** | Lo state file sta sul portatile di uno sviluppatore. Guasti del disco, eliminazioni accidentali o un `git clean` possono distruggere l'unica registrazione della tua infrastruttura. |
| **Nessuna cifratura a riposo** | Lo state file contiene tutti gli attributi delle risorse, segreti inclusi, in chiaro su disco. Chiunque abbia accesso al filesystem può leggerli. |
| **Nessuna collaborazione** | I membri del team non possono condividere lo state. Ognuno ha la propria copia, con conseguenti divergenze. |

**Il backend local è adatto solo per** _(stepTitle)_

- Apprendimento e sperimentazione.
- Progetti personali di un singolo sviluppatore.
- Scenari in cui l'infrastruttura è usa e getta e non serve collaborazione.

### 6a.4: cosa c'è dentro lo state file?

Esaminiamo la struttura di `terraform.tfstate` per capire cosa stiamo proteggendo.

```json
{
  "version": 4,
  "terraform_version": "1.12.0",
  "serial": 3,
  "lineage": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "outputs": {
    "instance_id": {
      "value": "i-1234567890abcdef0",
      "type": "string"
    }
  },
  "resources": [
    {
      "mode": "managed",
      "type": "aws_instance",
      "name": "web",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "schema_version": 1,
          "attributes": {
            "ami": "ami-0c55b159cbfafe1f0",
            "id": "i-1234567890abcdef0",
            "instance_type": "t3.micro",
            "private_ip": "10.0.1.42",
            "tags": {
              "Name": "web-server"
            },
            "password": "MySecretPassword123"
          },
          "dependencies": [
            "aws_subnet.main",
            "aws_security_group.allow_ssh"
          ]
        }
      ]
    }
  ]
}
```

**Campi chiave spiegati** _(stepTitle)_

- `version` — la versione del formato dello state file. Terraform la incrementa quando cambia lo schema dello state.
- `terraform_version` — la versione di Terraform che ha scritto per ultima questo state. Se provi a leggerlo con un Terraform più vecchio che non supporta questo formato, darà errore.
- `serial` — un intero monotonicamente crescente che registra la versione dello state. Ogni scrittura riuscita dello state lo incrementa. I backend remoti lo usano nei controlli di sicurezza sulla concorrenza e nei controlli ottimistici, ma non è la stessa cosa di un lock.
- `lineage` — un UUID generato alla prima creazione dello state. Identifica in modo univoco la "discendenza" dello state. Se perdi lo state e provi a ricrearlo da zero, il nuovo state avrà una lineage diversa e Terraform si rifiuterà di mescolarli a meno di una forzatura esplicita.
- `outputs` — contiene tutti gli output value del modulo root, memorizzati in chiaro.
- `resources` — un array di tutte le risorse gestite. Ogni voce include tipo di risorsa, local name, provider e una o più istanze (per `count`/`for_each`).
- `instances[].attributes` — tutti gli argomenti e gli attributi esportati della risorsa, compresi quelli sensibili. **Nota il campo `password`: è in chiaro.**
- `instances[].dependencies` — l'elenco degli indirizzi delle risorse da cui questa risorsa dipende. Serve a determinare l'ordine corretto di distruzione.

### 6a.5: laboratorio pratico: ispezionare lo state locale

**Directory:** `obj6a-lab`

**File: main.tf** — creeremo una risorsa che genera un "segreto", così da trovarlo nello state.

```hcl
# Configura il provider richiesto da questa configurazione.
# Senza questo blocco, terraform init non saprebbe cosa scaricare.
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"   # L'indirizzo del provider nel registry
      version = "~> 3.6.0"            # Accetta qualsiasi 3.6.x, ma non la 3.7
    }
  }
}

# Questa risorsa genera una stringa casuale. Le diamo il local name "password"
# per poterla richiamare altrove (es. random_password.password.result).
# Il valore generato verrà memorizzato in chiaro nello state file.
resource "random_password" "password" {
  length  = 16          # Genera 16 caratteri
  special = false       # Non include caratteri speciali come !@#$
}

# Questo output stampa nella CLI la password generata dopo l'apply.
# È contrassegnato come sensitive, quindi Terraform lo oscura nel terminale,
# ma il valore è COMUNQUE memorizzato in chiaro in terraform.tfstate.
output "generated_password" {
  value     = random_password.password.result
  sensitive = true        # Oscura solo nell'output della CLI, NON nello state file
}
```

**Passi** _(stepTitle)_

1. `terraform init` — scarica il provider `random` in `.terraform/providers/`.
2. `terraform apply -auto-approve` — crea la password casuale. L'output è contrassegnato come sensitive, quindi nel terminale vedrai `(sensitive value)`.
3. Apri `terraform.tfstate` in VS Code. Cerca `"result"`. Vedrai la **password generata effettiva, in chiaro**, dentro il JSON.
4. Annota il valore di `serial` (probabilmente 1). Annota il valore di `lineage`.
5. Esegui di nuovo `terraform plan` o `terraform apply -auto-approve`. Se non ci sono modifiche, il serial dello state dovrebbe restare invariato, perché Terraform non riscrive lo state quando non è cambiato nulla.
6. Nota che esiste anche `terraform.tfstate.backup`. È lo state di PRIMA dell'ultimo apply. Se il tuo state si corrompe, puoi copiare questo file sopra `terraform.tfstate` per tornare al precedente state valido.

**Concetto chiave:** il flag `sensitive = true` su una variabile o un output **oscura il valore solo nell'output della CLI**. **Non** cifra il valore nello state file. Lo state file è un documento JSON in chiaro.

---

### 6a.6: Mini-quiz 6a

1. Vero/Falso: il backend local supporta uno state locking condiviso che impedisce modifiche concorrenti da macchine diverse.
2. Scelta multipla: qual è lo scopo del campo `lineage` in uno state file?
  - A. Tiene il conto di quante volte è stato eseguito `apply`.
  - B. Identifica in modo univoco la storia dello state per impedire di mescolare state di configurazioni diverse.
  - C. Memorizza la versione di Terraform che ha generato lo state.
  - D. Registra l'utente che ha eseguito per ultimo `terraform apply`.
3. Vero/Falso: contrassegnare una variabile con `sensitive = true` ne cifra il valore nel file `terraform.tfstate`.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Falso.** Il backend local blocca lo state solo con i lock del filesystem della macchina locale, senza alcun coordinamento tra macchine diverse. Ciò significa che se due persone eseguono `terraform apply` contemporaneamente da macchine diverse, possono leggere entrambe lo stesso state e apportare modifiche, ma la seconda scrittura sovrascriverà la prima, causando modifiche perse e uno state corrotto.
2. **B.** Il campo `lineage` è un UUID che identifica in modo univoco la storia dello state. Se perdi lo state e provi a ricrearlo da zero, il nuovo state avrà una lineage diversa. Terraform lo usa per impedire di mescolare state di configurazioni diverse, cosa che potrebbe portare a una gestione errata delle risorse.
3. **Falso.** Il flag `sensitive = true` su una variabile o un output oscura il valore solo nell'output della CLI. Non cifra il valore nello state file. Lo state file è un documento JSON in chiaro e tutti i valori, compresi quelli sensibili, sono memorizzati in chiaro.

## Descrivere lo state locking

*Fonti: [State Locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/locking), [State Storage and Locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/backends)*

### 6b.1: il problema della concorrenza

Immagina due DevOps engineer, Alice e Bob, entrambi responsabili della stessa infrastruttura AWS. Hanno entrambi la configurazione Terraform sui loro portatili.

1. Alice esegue `terraform plan`. Terraform legge lo state da un bucket S3. Lo state dice che c'è un'istanza EC2.
2. Bob esegue anche lui `terraform plan` esattamente nello stesso momento. Terraform legge lo stesso state dal bucket S3. Anche qui lo state mostra un'istanza EC2.
3. Alice esegue `terraform apply`. Aggiunge una nuova istanza EC2. Terraform scrive il nuovo state (con due istanze) su S3. **Il serial passa da 10 a 11.**
4. Bob esegue `terraform apply`. Il suo state locale dice ancora un'istanza. Terraform crea un'altra nuova istanza. Scrive lo state su S3, **sovrascrivendo lo state di Alice con una versione che contiene solo la nuova istanza di Bob. Serial 11.**

Ora:

- Lo state file su S3 mostra la versione di Bob (due istanze: l'originale + quella di Bob).
- In AWS ci sono **tre** istanze (l'originale + quella di Alice + quella di Bob).
- L'istanza di Alice esiste ancora, ma Terraform non ne sa più nulla. È **orfana**. Terraform non la gestirà, non la aggiornerà né la distruggerà. È un disastro.

**Lo state locking previene completamente questo scenario.**

---

### 6b.2: che cos'è lo state locking?

Lo state locking è un meccanismo che garantisce che **una sola persona** (o pipeline CI) alla volta possa modificare lo state.

Flag di controllo comuni:

- `-lock-timeout=10m` dice a Terraform per quanto tempo continuare a riprovare prima di rinunciare su uno state bloccato.
- `-lock=false` disabilita completamente il locking. A volte si usa per letture d'emergenza o troubleshooting, ma è pericoloso nei normali workflow di apply/destroy perché può reintrodurre proprio le race condition che il locking deve prevenire.

**Come funziona** _(stepTitle)_

1. Prima di qualsiasi operazione che potrebbe modificare lo state (`plan` con il refresh predefinito, `apply`, `destroy`), Terraform **acquisisce un lock** sullo state.
2. Se il lock è già detenuto da un altro processo, Terraform attende (per un timeout configurabile) o dà subito errore, a seconda della configurazione.
3. Una volta acquisito il lock, Terraform procede con l'operazione.
4. Al termine dell'operazione (riuscita o fallita), Terraform **rilascia il lock**.

**Se due persone provano ad applicare contemporaneamente** _(stepTitle)_

1. Alice esegue `terraform apply`. Terraform acquisisce il lock. Detentore del lock: Alice.
2. Bob esegue `terraform apply`. Terraform prova ad acquisire il lock. Vede che è detenuto da Alice. Il Terraform di Bob dà subito errore: `Error acquiring the state lock`. Bob deve aspettare che Alice finisca.
3. L'apply di Alice termina. Terraform rilascia il lock.
4. Bob ora può eseguire di nuovo `terraform apply`. Stavolta Terraform acquisisce il lock e procede. L'apply di Bob legge lo state che include le modifiche di Alice, quindi il suo piano è corretto.

---

### 6b.3: come funzionano i lock nei diversi backend

Non tutti i backend supportano il locking. Il backend local ha solo il lock del filesystem locale, senza alcun coordinamento tra portatili diversi.

| Tipo di backend | Supporto al locking | Meccanismo |
|---|---|---|
| **local** | No | Nessun coordinamento condiviso dei lock |
| **s3** | Sì (se configurato) | Tabella DynamoDB. Terraform scrive un record di lock in DynamoDB prima di procedere. Il record include tipo di operazione, timestamp e utente. |
| **gcs** | Sì | Generazione degli oggetti e precondizioni. GCS usa i metadati degli oggetti per tracciare i lock. |
| **azurerm** | Sì | Lease di Azure Blob Storage. Terraform acquisisce un lease sul blob che contiene lo state file. |
| **consul** | Sì | Meccanismo integrato di sessioni e lock di Consul. |
| **HCP Terraform** | Sì | Integrato nella piattaforma. Nessuna configurazione aggiuntiva necessaria. |

---

### 6b.4: configurare il locking con S3 + DynamoDB

È il backend remoto più comune per i team che non usano HCP Terraform.

```hcl
# Questo blocco backend dice a Terraform di memorizzare lo state in un bucket S3
# e di usare una tabella DynamoDB per lo state locking.
terraform {
  backend "s3" {
    # Il bucket S3 in cui verrà memorizzato lo state
    bucket = "my-company-terraform-state"

    # Percorso/chiave all'interno del bucket. Usa una convenzione di nomi che rifletta
    # progetto e ambiente (es. "prod/network/terraform.tfstate")
    key = "prod/app/terraform.tfstate"

    # La regione AWS in cui si trovano sia il bucket sia la tabella DynamoDB
    region = "us-east-1"

    # La tabella DynamoDB usata per lo state locking. Terraform creerà/userà
    # un elemento in questa tabella con la stessa chiave dello state file.
    dynamodb_table = "terraform-locks"

    # Cifra lo state file a riposo con la cifratura lato server di S3 (AES-256)
    encrypt = true
  }
}
```

**Spiegazione** _(stepTitle)_

- `backend "s3" {` — specifica `s3` come tipo di backend.
- `bucket = "my-company-terraform-state"` — il nome del bucket S3. Il bucket deve esistere già.
- `key = "prod/app/terraform.tfstate"` — la chiave (percorso) dell'oggetto S3. Identifica in modo univoco lo state file di questa specifica configurazione all'interno del bucket.
- `region = "us-east-1"` — la regione AWS in cui si trovano sia il bucket sia la tabella DynamoDB.
- `dynamodb_table = "terraform-locks"` — il nome della tabella DynamoDB. La tabella deve esistere già, con una chiave primaria chiamata `LockID` (di tipo String). Terraform usa questa tabella per creare i record di lock.
- `encrypt = true` — abilita la cifratura lato server AES-256 sull'oggetto S3. Protegge lo state file dalla lettura diretta su S3 da parte di soggetti non autorizzati.

**Come funziona passo passo il lock DynamoDB** _(stepTitle)_

1. Terraform scrive un nuovo elemento nella tabella DynamoDB con `LockID = "prod/app/terraform.tfstate"` e la condizione che l'elemento non esista già (o che il lock esistente sia scaduto).
2. Se l'elemento esiste già (qualcun altro detiene il lock), DynamoDB restituisce una `ConditionalCheckFailedException`. Terraform la interpreta come "lock già detenuto" e attende o dà errore.
3. Quando l'operazione termina, Terraform elimina l'elemento da DynamoDB, rilasciando il lock.

Da Terraform 1.10 il backend s3 supporta anche il locking nativo su S3 con `use_lockfile = true` (un file `.tflock` accanto allo state), e l'argomento `dynamodb_table` è deprecato. Il pattern S3 + DynamoDB resta comunque molto diffuso e ricorre nelle domande d'esame.

---

### 6b.5: laboratorio pratico: osservare il comportamento dei lock (simulazione)

Non possiamo configurare facilmente S3 e DynamoDB in locale, ma possiamo dimostrare il concetto provando a eseguire due operazioni `apply` sullo stesso state locale. Il backend local usa lock consultivi sui file, che potrebbero bloccare sulla stessa macchina.

**Approccio alternativo:** creeremo due configurazioni identiche in directory separate che condividono uno state "remoto" tramite un file locale che simula un backend remoto. Non è un vero backend remoto ma dimostra la collisione.

Dato che è un po' artificioso, mi concentrerò invece su una dimostrazione concettuale chiara.

**Laboratorio concettuale: simulare una race condition** _(stepTitle)_

1. Crea la directory `obj6b-lab-a` con una configurazione Terraform che crea un `local_file`.
2. Esegui `terraform apply` e annota il serial dello state.
3. Copia a mano lo state file in `obj6b-lab-b`.
4. In `obj6b-lab-a`, modifica la configurazione per creare un secondo file. Esegui `terraform apply`. Il serial aumenta.
5. In `obj6b-lab-b`, modifica anche lì la configurazione per creare un secondo file diverso. Esegui `terraform apply`.
6. Osserva che l'apply di `obj6b-lab-b` va a buon fine perché usa il proprio state locale, non quello aggiornato di `obj6b-lab-a`. Le due directory sono divergenti.

**Concetto chiave:** senza un backend remoto condiviso con locking, la divergenza dello state è inevitabile.

---

### 6b.6: Mini-quiz 6b

1. Vero/Falso: lo state locking viene abilitato automaticamente quando si usa il backend `s3` senza alcuna configurazione aggiuntiva.
2. Scelta multipla: nella configurazione S3 + DynamoDB, qual è la chiave primaria della tabella DynamoDB usata per il locking?
  - A. `StateKey`
  - B. `LockID`
  - C. `SerialNumber`
  - D. `LineageUUID`
3. Risposta multipla: quali dei seguenti backend supportano lo state locking? (Selezionane TRE)
  - A. `local`
  - B. `s3` con DynamoDB
  - C. `gcs`
  - D. `http`
  - E. `azurerm`

**Risposte** _(stepTitle)_

1. **Falso.** Il backend `s3` da solo non esegue il locking. Ottieni il locking solo se configuri anche DynamoDB per il record di lock.
2. **B.** `LockID` è la chiave primaria richiesta per la tabella di lock DynamoDB. Terraform usa quella chiave per creare e rilasciare i lock sul percorso dello state.
3. **B, C, E.** `s3` con DynamoDB, `gcs` e `azurerm` supportano lo state locking condiviso. Il backend local e il backend `http` non offrono lo stesso coordinamento dei lock.

## Configurare lo state remoto con il blocco backend

*Fonti: [Backend block configuration overview](https://developer.hashicorp.com/terraform/language/v1.12.x/backend), [State Storage and Locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/backends)*

### 6c.1: sintassi del blocco backend

Abbiamo visto il backend S3. Guardiamo la struttura generale.

```hcl
terraform {
  backend "BACKEND_TYPE" {
    # Qui vanno gli argomenti specifici del backend.
    # Questi argomenti NON possono fare riferimento a variabili, local o attributi di risorse.
    # Tutti i valori devono essere letterali o usare la configurazione parziale.
  }
}
```

**Regola importante: nessuna interpolazione nei blocchi backend** _(stepTitle)_

Quanto segue **NON È VALIDO** e produrrà un errore:

```hcl
# NON VALIDO: non si possono usare variabili in un blocco backend!
terraform {
  backend "s3" {
    bucket = var.state_bucket   # Errore: variabili non ammesse
    key    = "prod/terraform.tfstate"
    region = var.aws_region     # Errore: variabili non ammesse
  }
}
```

**Perché esiste questa restrizione:** Terraform deve configurare il backend molto presto nel processo di inizializzazione, prima di aver valutato variabili, local o risorse. È la prima cosa che fa `terraform init`. Se la configurazione del backend dipendesse dalle variabili, Terraform non saprebbe dove recuperare lo state, e quindi non potrebbe valutare nulla.

---

### 6c.2: configurazione parziale del backend

Visto che non possiamo usare variabili nel blocco backend, come gestiamo i valori dinamici (come nomi di bucket diversi per ambiente)? **Configurazione parziale.**

Lasciamo fuori dal blocco backend gli argomenti dinamici e li forniamo al momento dell'`init` tramite:

1. Un file specificato con `-backend-config`
2. Coppie chiave/valore da riga di comando con `-backend-config=KEY=VALUE`

**Metodo 1: usare un file** _(stepTitle)_

```hcl
# main.tf
# Nota che gli argomenti dinamici sono omessi: verranno forniti al momento dell'init.
terraform {
  backend "s3" {
    # bucket, key, region, ecc. NON specificati qui
    # Li forniremo eseguendo terraform init
  }
}
```

Crea un file separato, `backend.hcl` (per convenzione chiamato `*.nomebackend.tfbackend`, es. `config.s3.tfbackend`):

```hcl
# backend.hcl — Questo file contiene i valori di configurazione effettivi.
# Ha lo stesso aspetto del contenuto del blocco backend, ma senza il blocco che lo racchiude.
# Ogni riga è una semplice assegnazione chiave = valore.

bucket         = "my-state-bucket-prod"
key            = "prod/network/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-locks"
encrypt        = true
```

**Eseguire init** _(stepTitle)_

```bash
terraform init -backend-config=backend.hcl
```

**Spiegazione del comando** _(stepTitle)_

- `terraform init` — il comando di inizializzazione.
- `-backend-config=backend.hcl` — dice a Terraform di leggere configurazione aggiuntiva del backend dal file `backend.hcl`. Terraform la unisce ai valori scritti nel blocco `backend` (in questo caso non ce ne sono). Il file contiene i valori dinamici specifici dell'ambiente.

**Metodo 2: usare coppie chiave/valore da riga di comando** _(stepTitle)_

```bash
terraform init \
  -backend-config="bucket=my-state-bucket-prod" \
  -backend-config="key=prod/network/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=terraform-locks" \
  -backend-config="encrypt=true"
```

**Usare la configurazione parziale rende il codice indipendente dall'ambiente.** Gli stessi file `.tf` si possono usare per dev, staging e prod passando file `backend.hcl` diversi.

---

### 6c.3: cambiare backend e migrare lo state

Se hai già uno state file locale e vuoi passare a un backend remoto, Terraform rileverà la modifica quando esegui `terraform init` con la nuova configurazione del backend.

Terraform mostrerà:

```
Initializing the backend...
Do you want to copy existing state to the new backend?
  Pre-existing state was found while migrating the previous "local" backend
  to the newly configured "s3" backend. No existing state was found in the
  newly configured "s3" backend. Do you want to copy this state to the new
  "s3" backend? Enter "yes" to copy and "no" to start with an empty state.
```

**Opzioni principali durante la migrazione del backend** _(stepTitle)_

- **Digitare yes:** Terraform copia lo state file locale nel bucket S3. È la scelta corretta quando sposti un progetto esistente su un backend remoto.
- **Digitare no:** Terraform non copia lo state locale e riparte da uno state vuoto in S3. È appropriato se parti da zero.
- **Usare -migrate-state:** chiede esplicitamente di migrare lo state esistente nel nuovo backend. In automazione si aggiunge `-force-copy`, che risponde automaticamente "yes" alla richiesta di copia.
- **Usare -reconfigure:** dice a Terraform di saltare completamente il controllo di migrazione e riconfigurare il backend senza copiare alcuno state esistente. Si usa anche quando cambi la configurazione per lo stesso tipo di backend (es. passaggio a un bucket S3 diverso).

```bash
# Migra lo state da local a S3, rispondendo automaticamente yes
terraform init -migrate-state -force-copy -backend-config=backend.hcl

# Riconfigura il backend senza migrazione (es. cambio di bucket)
terraform init -reconfigure -backend-config=new-backend.hcl
```

---

### 6c.4: blocco cloud vs. blocco backend

Dalla guida di studio ufficiale:

> *Non puoi configurare un blocco `backend` quando la configurazione contiene anche una configurazione `cloud` per memorizzare i dati di state.*

- Il blocco `cloud` è un modo semplificato per collegarsi direttamente a HCP Terraform o Terraform Enterprise.
- Quando usi `cloud`, HCP Terraform gestisce automaticamente memorizzazione dello state, locking ed esecuzione remota: non serve un blocco `backend` separato.
- Se provi a usarli entrambi, `terraform init` darà errore.

```hcl
# Usa QUESTO per HCP Terraform:
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "my-workspace"
    }
  }
}

# OPPURE usa QUESTO per un backend remoto indipendente (S3, GCS, ecc.):
terraform {
  backend "s3" {
    bucket = "my-bucket"
    key    = "state.tfstate"
    region = "us-east-1"
  }
}

# MAI entrambi nella stessa configurazione!
```

Tratteremo in dettaglio il blocco `cloud` nell'Obiettivo 8.

---

### 6c.5: posizione dello state file con un backend remoto

Quando usi un backend remoto:

- Lo state file **non è più memorizzato in locale** (se non in memoria durante le operazioni).
- `terraform.tfstate` non esisterà nella directory di lavoro (o, se esiste, è un residuo di prima della migrazione e si può eliminare).
- Terraform legge e scrive lo state direttamente sul backend remoto a ogni operazione.

**Eccezione:** se la scrittura sul backend remoto fallisce (es. errore di rete), Terraform salva una copia locale dello state come `errored.tfstate` per evitare la perdita di dati. Puoi usare questo file per caricare manualmente lo state con `terraform state push errored.tfstate`.

---

### 6c.6: laboratorio pratico: simulare un backend remoto con local

Dato che non possiamo usare S3, configureremo un backend `local` con un percorso personalizzato per simulare il concetto di spostamento dello state.

**Directory:** `obj6c-lab`

**Passo 1: creare la configurazione iniziale senza backend** _(stepTitle)_

```hcl
# main.tf
resource "local_file" "example" {
  filename = "${path.module}/test.txt"
  content  = "Hello, initial state."
}
```

Esegui `terraform init && terraform apply -auto-approve`. Lo state si trova in `terraform.tfstate`.

**Passo 2: aggiungere un blocco backend per simulare la migrazione** _(stepTitle)_

```hcl
terraform {
  backend "local" {
    path = "remote-state/terraform.tfstate"  # Simula una posizione remota
  }
}
```

Esegui `terraform init`. Terraform chiederà: "Do you want to copy existing state to the new backend?" Digita `yes`. Terraform sposta lo state da `./terraform.tfstate` a `./remote-state/terraform.tfstate`.

**Passo 3: verificare la migrazione** _(stepTitle)_

- `terraform.tfstate` non esiste più (o è vuoto).
- `./remote-state/terraform.tfstate` è lo state attivo.

**Passo 4: osservare che terraform plan ora usa la nuova posizione dello state** _(stepTitle)_

Qualsiasi modifica alla configurazione verrà confrontata con lo state in `remote-state/terraform.tfstate`.

Questo simula esattamente ciò che succede quando migri da local a S3, usando solo il filesystem locale come posizione "remota".

---

### 6c.7: Mini-quiz: configurare lo state remoto

1. Vero/Falso: il blocco `backend` può fare riferimento a variabili di input dichiarate nello stesso modulo.
2. Scelta multipla: qual è il comando corretto per migrare uno state file locale esistente verso un backend S3 appena configurato?
  - A. `terraform apply -migrate-state`
  - B. `terraform init -migrate-state`
  - C. `terraform plan -reconfigure`
  - D. `terraform state push`
3. Risposta multipla: quali dei seguenti sono modi validi per fornire valori di configurazione del backend? (Selezionane DUE)
  - A. Usare variabili referenziate nel blocco `backend`.
  - B. Usare il flag da riga di comando `-backend-config` con un percorso di file.
  - C. Usare `-backend-config=KEY=VALUE` da riga di comando.
  - D. Impostare variabili d'ambiente chiamate `TF_BACKEND_*`.

**Risposte** _(stepTitle)_

1. **Falso.** Il blocco `backend` non può fare riferimento a variabili di input, local o attributi di risorse. Tutti i valori del blocco backend devono essere letterali o forniti tramite configurazione parziale al momento dell'init.
2. **B.** Il comando corretto per migrare uno state file locale esistente verso un backend S3 appena configurato è `terraform init -migrate-state`. Questo comando inizializza il nuovo backend e copia lo state esistente (con `-force-copy` senza chiedere conferma).
3. **B e C.** I modi validi per fornire valori di configurazione del backend includono il flag da riga di comando `-backend-config` con un percorso di file (B) e `-backend-config=KEY=VALUE` da riga di comando (C). Le variabili non si possono usare direttamente nel blocco backend, e non esistono variabili d'ambiente `TF_BACKEND_*` per la configurazione del backend.

## Gestire il drift delle risorse e lo state di Terraform

*Fonti: [Manage resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift), [Use refresh-only mode to sync Terraform state](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/run/modes-and-options#refresh-only-mode), [Moved block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/moved), [Removed block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/removed), [Refactor Terraform state](https://developer.hashicorp.com/terraform/language/v1.12.x/state/refactor), [Terraform State](https://developer.hashicorp.com/terraform/language/v1.12.x/state)*

### 6d.1: che cos'è il drift delle risorse?

Il drift si verifica quando lo **stato reale della tua infrastruttura** differisce da quanto registrato nello **state file di Terraform** e definito nella **configurazione**. Il drift avviene quando qualcuno (o qualcosa) apporta modifiche al di fuori del controllo di Terraform.

**Cause comuni di drift** _(stepTitle)_

- Un collega modifica a mano una regola di un security group nella console AWS.
- Un evento di auto-scaling cambia la capacità desiderata di un ASG.
- Una risorsa viene eliminata per errore (o in malafede).
- Un cloud provider aggiorna il valore predefinito di un attributo di una risorsa.

### 6d.2: rilevare il drift: modalità refresh-only

L'approccio consigliato per rilevare e rivedere il drift è usare il flag `-refresh-only` con `terraform plan`.

```bash
terraform plan -refresh-only
```

**Cosa fa** _(stepTitle)_

1. Terraform interroga le API del cloud provider per lo stato reale di tutte le risorse.
2. Confronta lo stato reale con lo state file.
3. Genera un piano che mostra cosa cambierebbe nello **state file** (non nell'infrastruttura) per farlo corrispondere alla realtà.

**Output d'esempio** _(stepTitle)_

```
# aws_instance.web has been terminated outside of Terraform.
- resource "aws_instance" "web" {
    id = "i-1234567890abcdef0" -> null
  }
```

Questo piano dice: "Se aggiornassi lo state file per farlo corrispondere alla realtà, rimuoverei `aws_instance.web` perché non esiste più."

**Per accettare queste modifiche allo state file** _(stepTitle)_

```bash
terraform apply -refresh-only
```

**Importante:** questo aggiorna solo lo state file. **Non** modifica l'infrastruttura. Dopo, eseguendo `terraform plan` vedrai che Terraform vuole **ricreare** l'istanza mancante (perché la configurazione la definisce ancora, ma lo state non la contiene più).

**Perché -refresh-only è preferibile al deprecato terraform refresh** _(stepTitle)_

- `terraform refresh` (deprecato) aggiorna automaticamente lo state file **senza prima mostrarti un piano**. Questo può causare modifiche inattese allo state.
- `-refresh-only` ti dà un'anteprima e richiede conferma, quindi è molto più sicuro.

---

### 6d.3: risolvere il drift

Una volta rilevato il drift, hai due opzioni:

1. **Mantenere la modifica esterna:** aggiorna la configurazione Terraform in modo che corrisponda al nuovo stato del mondo. Poi esegui `terraform apply` per sincronizzare lo state.
2. **Annullare la modifica esterna:** esegui `terraform apply` (senza `-refresh-only`) così Terraform riapplica la configurazione, riportando la risorsa in drift allo stato configurato.

### 6d.4: comandi CLI per la manipolazione dello state

Terraform fornisce comandi per ispezionare e manipolare direttamente lo state file. Sono **solo per uso avanzato** e vanno evitati nei workflow di routine.

**terraform state list** — elenca tutte le risorse nello state file.

```bash
terraform state list
# Output:
# random_pet.server
# local_file.config
# module.vpc.aws_vpc.main
```

**terraform state show RESOURCE_ADDRESS** — mostra gli attributi dettagliati di una risorsa specifica dallo state file.

```bash
terraform state show local_file.config
# Output:
# resource "local_file" "config" {
#     content  = "test"
#     filename = "./config.txt"
#     id       = "abc123..."
# }
```

- **terraform state rm RESOURCE_ADDRESS** — rimuove una risorsa dallo state file **senza distruggere l'infrastruttura reale**. Usalo quando vuoi che Terraform "dimentichi" una risorsa per smettere di gestirla senza eliminarla.
- **terraform state mv SOURCE DESTINATION** — sposta una risorsa da un indirizzo a un altro all'interno dello state file. Utile durante refactoring e rinomina delle risorse.
- **terraform state pull** — scarica lo state corrente dal backend configurato e lo stampa come JSON su stdout. Utile per script e ispezioni.
- **terraform state push STATE_FILE** — carica uno state file sul backend configurato. **Estremamente pericoloso.** Sovrascrive lo state remoto. Terraform protegge dai push accidentali controllando lineage e numeri serial, ma `-force` aggira queste protezioni.

---

### 6d.5: il blocco di configurazione moved

Invece di usare `terraform state mv` (manuale e soggetto a errori), Terraform 1.1+ supporta il blocco `moved` per rifattorizzare lo state in modo dichiarativo.

```hcl
# Supponiamo di rinominare il modulo da 'network' a 'networking'
# Aggiungiamo questo blocco moved così Terraform sa che è una rinomina, non distruzione/creazione

moved {
  from = module.network   # Il vecchio indirizzo nello state
  to   = module.networking  # Il nuovo indirizzo nella configurazione
}
```

Quando esegui `terraform plan`, Terraform riconosce che la risorsa a `module.network` nello state deve corrispondere a `module.networking` nella configurazione. Sposterà la voce nello state senza distruggere o ricreare alcuna infrastruttura.

**Vantaggi di moved rispetto a state mv** _(stepTitle)_

- Sta nella configurazione, quindi è sotto controllo di versione e revisionabile.
- È visibile durante `plan`, quindi il team può vedere il refactoring.
- Terraform verifica che lo spostamento abbia senso.

### 6d.6: importare risorse esistenti

Per portare sotto gestione un'infrastruttura esistente (creata al di fuori di Terraform), usa il blocco `import` (Terraform 1.5+) o il vecchio comando `terraform import`.

**Import guidato dalla configurazione (Terraform 1.5+)** _(stepTitle)_

```hcl
# Dichiara la risorsa che vuoi importare (con i suoi argomenti obbligatori)
resource "aws_instance" "legacy" {
  instance_type = "t3.micro"
  ami           = "ami-abc123"
}

# Il blocco import dice a Terraform di trovare una risorsa esistente
# con l'ID dato e di legarla all'indirizzo della risorsa nello state.
import {
  id = "i-1234567890abcdef0"   # L'identificatore della risorsa presso il cloud provider
  to = aws_instance.legacy     # L'indirizzo della risorsa Terraform in cui importarla
}
```

Poi esegui `terraform plan -generate-config-out=generated.tf` per generare facoltativamente la configurazione completa, oppure esegui direttamente `terraform apply` per importare. Terraform troverà la risorsa in AWS, porterà i suoi attributi nello state file e la assocerà a `aws_instance.legacy`.

Tratteremo l'import in profondità nell'Obiettivo 7.

---

### 6d.7: laboratorio pratico: rilevamento del drift e gestione dello state

**Directory:** `obj6d-lab`

**File: main.tf** _(stepTitle)_

```hcl
# Configurazione standard
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

# Crea un file che elimineremo a mano per simulare il drift
resource "local_file" "config" {
  filename = "${path.module}/config.txt"
  content  = "Important configuration data."
}
```

**Passi** _(stepTitle)_

1. `terraform init && terraform apply -auto-approve`
2. Verifica che `config.txt` esista e che lo state sia pulito.
3. **Simula il drift:** elimina a mano `config.txt` (clic destro ed elimina in VS Code, oppure `rm config.txt`).
4. Esegui `terraform plan -refresh-only`. Osserva che Terraform rileva il file mancante e propone di rimuoverlo dallo state.
5. Esegui `terraform apply -refresh-only`. Terraform aggiorna lo state per riflettere il file mancante.
6. Esegui `terraform state list`. Il file non è più nello state.
7. Esegui `terraform plan`. Terraform ora vuole **creare** di nuovo `config.txt`, perché è nella configurazione ma non nello state dopo l'apply refresh-only.
8. Esegui `terraform apply`. Il file viene ricreato.

**Esercizi aggiuntivi sullo state** _(stepTitle)_

- Esegui `terraform state list` per vedere l'indirizzo della risorsa.
- Esegui `terraform state show local_file.config` per vederne gli attributi.
- Usa un blocco `moved` per rinominare la risorsa: aggiungi un blocco `moved` con `from = local_file.config` e `to = local_file.app_config` (ciascun argomento su una riga) e rinomina la risorsa in `main.tf`. Esegui `terraform plan` per vedere lo spostamento.

---

### 6d.8: best practice per la gestione dello state

Adotta queste abitudini nei progetti reali:

- Memorizza lo state in un backend remoto con locking per qualsiasi ambiente condiviso.
- Limita l'accesso agli state file e alle credenziali del backend al gruppo più ristretto possibile.
- Preferisci `moved`, `import`, `-refresh-only` e i comandi `terraform state` alle modifiche manuali di `terraform.tfstate`.
- Se devi leggere gli output di un altro stack, usa `terraform_remote_state` con attenzione e trattalo come un confine di API, non come una scorciatoia occasionale.
- Prima di refactoring pericolosi, fai un backup dello state e verifica che il backend di destinazione abbia versioning o supporto al rollback.
- Non committare mai state file o file di backup dello state nel controllo di versione.

---

### 6d.9: Mini-quiz: drift delle risorse e gestione dello state

1. Vero/Falso: `terraform apply -refresh-only` modifica sia lo state file sia l'infrastruttura reale per riconciliare il drift.
2. Scelta multipla: quale comando useresti per vedere tutte le risorse attualmente tracciate nello state file?
  - A. `terraform show`
  - B. `terraform state list`
  - C. `terraform plan`
  - D. `terraform output`
3. Risposta multipla: quali approcci si possono usare per rifattorizzare in sicurezza lo state quando si rinominano risorse? (Selezionane DUE)
  - A. `terraform state mv`
  - B. Il blocco di configurazione `moved`
  - C. `terraform state rm` seguito da `terraform import`
  - D. Modificare a mano `terraform.tfstate`

**Risposte** _(stepTitle)_

1. **Falso.** `terraform apply -refresh-only` aggiorna solo lo state file per farlo corrispondere all'infrastruttura reale. Non modifica alcuna risorsa reale. Per riconciliare il drift modificando l'infrastruttura, dopo aver aggiornato lo state eseguiresti `terraform apply` senza il flag `-refresh-only`.
2. **B.** Il comando per vedere tutte le risorse attualmente tracciate nello state file è `terraform state list`. Elenca gli indirizzi di tutte le risorse nello state.
3. **A e B.** Il comando `terraform state mv` si può usare per spostare manualmente una risorsa nello state, ma il blocco di configurazione `moved` è il modo consigliato per rifattorizzare in modo dichiarativo lo state quando si rinominano risorse. Entrambi i metodi sono validi, ma il blocco `moved` offre maggiore visibilità e controllo di versione. Modificare a mano `terraform.tfstate` è pericoloso e va evitato.

## Quiz

> Ormai conosci la procedura: niente sbirciatine alle risposte finché non ci hai provato al massimo!

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Il backend local predefinito supporta lo state locking usando lock consultivi del filesystem affidabili tra più macchine.

**Domanda 2 (scelta multipla)** _(stepTitle)_

Hai un progetto Terraform che usa il backend local. Vuoi migrare a un backend S3 con locking DynamoDB. Aggiungi il blocco `backend "s3"` alla configurazione. Quale comando dovresti eseguire dopo?

- A. `terraform apply`
- B. `terraform init -migrate-state`
- C. `terraform plan -reconfigure`
- D. `terraform state push`

**Domanda 3 (risposta multipla)** _(stepTitle)_

Quali dei seguenti elementi sono memorizzati direttamente nello state file di Terraform? (Selezionane **TRE**)

- A. Il numero `serial`
- B. L'UUID `lineage`
- C. I binari dei plugin dei provider
- D. I valori degli attributi delle risorse (segreti inclusi)
- E. Il codice HCL dei file di configurazione

**Domanda 4 (Vero/Falso)** _(stepTitle)_

Il blocco `backend` dentro `terraform {}` può fare riferimento a `var.bucket_name` per impostare dinamicamente il bucket S3 di memorizzazione dello state.

**Domanda 5 (scelta multipla)** _(stepTitle)_

Qual è il motivo principale per cui lo state locking è essenziale nei workflow di team?

- A. Cifra lo state file a riposo.
- B. Impedisce a due utenti di eseguire `terraform plan` contemporaneamente.
- C. Impedisce che operazioni `apply` concorrenti corrompano lo state file.
- D. Abilita l'esecuzione remota dei comandi Terraform.

**Domanda 6 (scelta multipla)** _(stepTitle)_

Hai uno state file locale esistente con delle risorse. Configuri per la prima volta un backend S3. Dopo aver eseguito `terraform init`, Terraform ti chiede se migrare lo state. Digiti `no`. Cosa succede?

- A. Lo state file locale viene cifrato e conservato come backup.
- B. Lo state locale non viene copiato e il backend S3 parte con uno state vuoto.
- C. Lo state locale viene copiato su S3 senza alcuna richiesta.
- D. Viene generato un errore e `init` fallisce.

**Domanda 7 (Vero/Falso)** _(stepTitle)_

`terraform apply -refresh-only` aggiornerà l'infrastruttura per farla corrispondere alla configurazione se viene rilevato un drift.

**Domanda 8 (scelta multipla)** _(stepTitle)_

Quale comando CLI è il modo **più sicuro** per ispezionare quali modifiche avverrebbero nello state file a causa di modifiche esterne alle risorse?

- A. `terraform refresh`
- B. `terraform plan -refresh-only`
- C. `terraform apply -auto-approve`
- D. `terraform state pull`

**Domanda 9 (risposta multipla)** _(stepTitle)_

Quali backend supportano lo state locking? (Selezionane **TRE**)

- A. `local`
- B. `s3` con una tabella DynamoDB
- C. `gcs`
- D. `azurerm`
- E. `http`

**Domanda 10 (Vero/Falso)** _(stepTitle)_

Quando si usa un backend remoto, il file `terraform.tfstate` viene comunque scritto sul disco locale dopo ogni `apply` riuscito.

**Domanda 11 (scelta multipla)** _(stepTitle)_

Cosa fa il blocco `moved` nella configurazione Terraform?

- A. Sposta fisicamente le risorse cloud in un'altra regione.
- B. Dice a Terraform di rinominare una risorsa nello state file senza distruggere la risorsa reale.
- C. Fa il backup dello state file in una posizione remota.
- D. Blocca lo state file durante le operazioni lunghe.

**Domanda 12 (scelta multipla)** _(stepTitle)_

Elimini per errore un'istanza EC2 a mano dalla console AWS. L'istanza era gestita da Terraform. Cosa mostrerà `terraform plan` alla prossima esecuzione?

- A. Nessuna modifica; Terraform aggiornerà automaticamente lo state.
- B. Terraform proporrà di ricreare l'istanza.
- C. Terraform darà errore perché lo state è corrotto.
- D. Terraform ti chiederà di importare l'istanza.

**Domanda 13 (Vero/Falso)** _(stepTitle)_

Il comando `terraform state rm` distrugge la risorsa reale prima di rimuoverla dallo state file.

**Domanda 14 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono metodi validi per fornire valori di configurazione del backend quando non possono essere scritti nel codice? (Selezionane **DUE**)

- A. Usare `-backend-config=KEY=VALUE` al momento dell'`init`.
- B. Usare `-backend-config=PATH` per puntare a un file di configurazione.
- C. Impostare variabili d'ambiente come `TF_BACKEND_BUCKET`.
- D. Usare `locals` nel blocco `backend`.

**Domanda 15 (scelta multipla)** _(stepTitle)_

Qual è l'effetto dell'esecuzione di `terraform state rm aws_instance.web`?

- A. Terraform distrugge l'istanza EC2 e la rimuove dallo state.
- B. Terraform rimuove l'istanza EC2 dallo state ma NON la distrugge.
- C. Terraform blocca lo state per impedire ulteriori modifiche.
- D. Terraform rinomina la risorsa nello state.

**Domanda 16 (Vero/Falso)** _(stepTitle)_

Il file `terraform.tfstate.backup` è un file JSON che si può ripristinare a mano per riportare lo state alla versione precedente.

**Domanda 17 (scelta multipla)** _(stepTitle)_

Una configurazione ha sia un blocco `cloud` sia un blocco `backend` definiti nel blocco `terraform {}`. Cosa succede quando esegui `terraform init`?

- A. Il blocco `cloud` ha la precedenza; il blocco `backend` viene ignorato.
- B. Il blocco `backend` ha la precedenza; il blocco `cloud` viene ignorato.
- C. Terraform unisce le due configurazioni.
- D. Terraform genera un errore perché si escludono a vicenda.

**Domanda 18 (Vero/Falso)** _(stepTitle)_

Lo state locking garantisce che un solo `terraform apply` alla volta possa modificare lo state, ma più operazioni `terraform plan` possono girare contemporaneamente senza alcun problema.

**Domanda 19 (scelta multipla)** _(stepTitle)_

Vuoi spostare una risorsa gestita da Terraform da `aws_instance.old_name` ad `aws_instance.new_name` nello stesso state file senza distruggere l'istanza. Quale approccio è il più dichiarativo e consigliato?

- A. Usare `terraform state mv aws_instance.old_name aws_instance.new_name`
- B. Usare un blocco `moved` con `from = aws_instance.old_name` e `to = aws_instance.new_name`
- C. Modificare direttamente `terraform.tfstate` per cambiare il nome
- D. Eseguire `terraform destroy` e ricrearla con il nuovo nome

**Domanda 20 (risposta multipla)** _(stepTitle)_

Quali delle seguenti affermazioni sullo state file sono vere? (Selezionane **DUE**)

- A. Va committato nel controllo di versione per abilitare la collaborazione.
- B. Può contenere dati sensibili in chiaro.
- C. Mappa gli indirizzi delle risorse nella configurazione sugli ID delle risorse reali.
- D. Viene cifrato automaticamente da Terraform quando si usa il backend `local`.

### Risposte

1. **Falso.** Il backend local usa lock consultivi del filesystem, che non sono affidabili tra più macchine. Ciò significa che se due utenti eseguono `terraform apply` contemporaneamente da macchine diverse, possono leggere entrambi lo stesso state e apportare modifiche, ma la seconda scrittura sovrascriverà la prima, causando modifiche perse e uno state corrotto.
2. **terraform init -migrate-state (B).** Questo comando inizializza il nuovo backend e copia lo state esistente dal backend local al backend S3 (con `-force-copy` senza chiedere conferma). È il modo corretto di migrare lo state quando si cambia backend.
3. **Il numero serial, l'UUID lineage e i valori degli attributi delle risorse (segreti inclusi) sono memorizzati nello state file (A, B, D).** I binari dei plugin dei provider non sono memorizzati nello state file; vengono scaricati e conservati separatamente su disco. Neanche il codice HCL della configurazione è memorizzato nello state (lo state contiene solo, per ogni istanza, l'elenco `dependencies`).
4. **Falso.** Il blocco `backend` non può fare riferimento a variabili, local o attributi di risorse. Tutti i valori del blocco backend devono essere letterali o forniti tramite configurazione parziale al momento dell'init. Questo perché Terraform deve configurare il backend prima di poter valutare qualsiasi variabile.
5. **Impedisce che operazioni apply concorrenti corrompano lo state file (C).** Lo state locking garantisce che un solo `terraform apply` alla volta possa modificare lo state. Questo impedisce a due utenti di apportare modifiche in conflitto che potrebbero corrompere lo state file e portare a una gestione errata delle risorse.
6. **Lo state locale non viene copiato e il backend S3 parte con uno state vuoto (B).** Se digiti `no` alla richiesta di migrazione, Terraform non copia lo state locale esistente su S3 (il file locale resta su disco, ma non viene più usato). Parte invece con uno state vuoto nel nuovo backend. Questo significa che Terraform non saprà nulla delle risorse esistenti finché non le importi o le ricrei.
7. **Falso.** `terraform apply -refresh-only` aggiorna solo lo state file per farlo corrispondere all'infrastruttura reale. Non modifica alcuna risorsa reale. Per riconciliare il drift modificando l'infrastruttura, dopo aver aggiornato lo state eseguiresti `terraform apply` senza il flag `-refresh-only`.
8. **terraform plan -refresh-only (B).** Questo comando ti permette di vedere quali modifiche avverrebbero nello state file a causa di modifiche esterne alle risorse, senza applicare effettivamente alcuna modifica all'infrastruttura. Il comando deprecato `terraform refresh` aggiornerebbe lo state file senza prima mostrare un piano, il che può portare a modifiche inattese.
9. **s3 con una tabella DynamoDB, gcs e azurerm supportano lo state locking (B, C, D).** Il backend `local` non supporta lo state locking tra più macchine, e il backend `http` non ha capacità di locking integrate.
10. **Falso.** Quando si usa un backend remoto, il file `terraform.tfstate` non viene scritto sul disco locale. Terraform legge e scrive lo state direttamente sul backend remoto a ogni operazione. Il file locale `terraform.tfstate` può esistere come residuo di prima della migrazione, ma non viene usato dopo la configurazione del backend.
11. **Dice a Terraform di rinominare una risorsa nello state file senza distruggere la risorsa reale (B).** Il blocco `moved` permette di rifattorizzare lo state in modo dichiarativo quando si rinominano risorse. Terraform sposterà la voce nello state dal vecchio indirizzo al nuovo senza distruggere o ricreare alcuna infrastruttura.
12. **Terraform proporrà di ricreare l'istanza (B).** Poiché l'istanza è stata eliminata al di fuori di Terraform, alla successiva esecuzione di `terraform plan` Terraform vedrà che la risorsa definita nella configurazione manca e proporrà di crearla di nuovo.
13. **Falso.** Il comando `terraform state rm` rimuove una risorsa dallo state file ma NON distrugge la risorsa reale. È utile quando vuoi che Terraform "dimentichi" una risorsa per smettere di gestirla senza eliminarla.
14. **Usare -backend-config=KEY=VALUE al momento dell'init e usare -backend-config=PATH per puntare a un file di configurazione sono metodi validi (A, B).** Impostare variabili d'ambiente come `TF_BACKEND_BUCKET` non è un metodo standard per la configurazione del backend, e usare `locals` nel blocco `backend` non è consentito perché il blocco backend non può fare riferimento a variabili o local.
15. **Terraform rimuove l'istanza EC2 dallo state ma NON la distrugge (B).** Il comando `terraform state rm` modifica solo lo state file, permettendoti di smettere di gestire la risorsa con Terraform lasciandola intatta presso il cloud provider.
16. **Vero.** Il file `terraform.tfstate.backup` è un file JSON che contiene la versione precedente dello state prima dell'ultima operazione riuscita. Si può ripristinare a mano copiandolo sopra `terraform.tfstate` se devi tornare allo state precedente.
17. **Terraform genera un errore perché si escludono a vicenda (D).** Non puoi avere sia un blocco `cloud` sia un blocco `backend` nella stessa configurazione. Il blocco `cloud` si usa per HCP Terraform o Terraform Enterprise, mentre il blocco `backend` si usa per backend remoti indipendenti. Terraform non consente di configurarli entrambi contemporaneamente.
18. **Falso.** Lo state locking garantisce che un solo `terraform apply` alla volta possa modificare lo state, prevenendo la corruzione. Ma anche `terraform plan` acquisisce di default il lock dello state, quindi due plan contemporanei sullo stesso state possono entrare in conflitto sul lock (a meno di usare `-lock=false`).
19. **Usare un blocco moved (B).** È l'approccio più dichiarativo e consigliato per rifattorizzare lo state quando si rinominano risorse. Ti permette di mettere la modifica sotto controllo di versione e offre visibilità durante `plan`. Usare `terraform state mv` è manuale e meno trasparente, mentre modificare direttamente `terraform.tfstate` è pericoloso e va evitato.
20. **Può contenere dati sensibili in chiaro e mappa gli indirizzi delle risorse nella configurazione sugli ID delle risorse reali (B, C).** Lo state file può contenere informazioni sensibili come attributi delle risorse, che possono includere segreti. Funge anche da mappatura tra gli indirizzi delle risorse definiti nella configurazione e gli ID effettivi delle risorse presso il cloud provider. Lo state file non va committato nel controllo di versione e non viene cifrato automaticamente quando si usa il backend `local`.

---

Guardati ora: un esperto di gestione dello state di Terraform! Hai imparato il ruolo critico dello state file, come gestirlo con i backend remoti, come rilevare e risolvere il drift e persino come manipolare direttamente lo state quando necessario. Queste conoscenze sono essenziali per lavorare con Terraform in scenari reali, soprattutto negli ambienti di team dove collaborazione e integrità dello state sono fondamentali.

Passiamo all'**Obiettivo 7: manutenzione dell'infrastruttura con Terraform**, dove vedremo come importare risorse esistenti, gestire i segreti nello state e affrontare scenari di gestione dello state più complessi.
