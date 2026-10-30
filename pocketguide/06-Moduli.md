# Moduli Terraform

_Questo obiettivo spiega come usare i moduli in Terraform: come Terraform reperisce i moduli, la visibilità delle variabili nei moduli, l'uso dei moduli nella configurazione e la gestione delle loro versioni. Imparerai ad apprezzare come i moduli abilitano riusabilità, astrazione e organizzazione nelle configurazioni Terraform. Alla fine di questa sezione dovresti saper usare con sicurezza i moduli per strutturare la tua infrastructure as code e capire come gestirne efficacemente il ciclo di vita._

> Nota: si usano soprattutto nei progetti più grandi, ma è importante capire il concetto di modulo e come usarli in modo efficace. Anche in un progetto piccolo, usare i moduli può aiutarti a organizzare il codice e renderlo più manutenibile nel lungo periodo.

## Spiegare come Terraform reperisce i moduli

*Fonti: [Modules overview](https://developer.hashicorp.com/terraform/tutorials/modules/module), [Use registry modules in your configuration](https://developer.hashicorp.com/terraform/tutorials/modules/module-use), [Find and use modules](https://developer.hashicorp.com/terraform/registry/modules/use), [Module Composition](https://developer.hashicorp.com/terraform/tutorials/modules/module-composition), [Standard Module Structure](https://developer.hashicorp.com/terraform/tutorials/modules/module-structure)*

### 5a.1: che cos'è un modulo?

Un modulo è un contenitore per un gruppo di risorse Terraform correlate che vengono gestite insieme. Ogni configurazione Terraform ha almeno un modulo: il modulo root, costituito dai file `.tf` della directory di lavoro principale.

Quando chiami esplicitamente un modulo con un blocco `module`, crei un **modulo figlio** (child module). Un modulo figlio può a sua volta chiamare altri moduli, formando una gerarchia.

**Perché i moduli?** _(stepTitle)_

- **Riusabilità**: scrivi una volta una configurazione standard di "web server" e la usi decine di volte.
- **Astrazione**: nascondi la complessità dietro un'interfaccia semplice (input e output).
- **Organizzazione**: raggruppi risorse logicamente correlate.
- **Collaborazione**: condividi i moduli tramite il Terraform Registry o registry interni.

### 5a.2: il blocco module

Si invoca un modulo con il blocco module:

```hcl
module "web_server" {
  source = "./modules/web_server"

  instance_type = "t3.micro"
  ami_id        = "ami-abc123"
}
```

Se il modulo proviene dal Terraform Registry, aggiungeresti anche un argomento `version`.

Spiegazione del blocco:

- `module "web_server" {`: dichiara un modulo figlio. web_server è il local name che userai per fare riferimento agli output di questo modulo (es. `module.web_server.instance_id`).
- `source = "./modules/web_server"`: è l'indirizzo sorgente. Dice a Terraform dove si trova il codice del modulo. Il formato dipende dal tipo di sorgente (vedi la sezione successiva).
- `version = "1.0.0"`: (facoltativo ma consigliato) specifica quale versione del modulo usare. Valido solo per i moduli ospitati in un registry.
- `instance_type = "t3.micro"`: è una variabile di input passata al modulo figlio. Il modulo figlio deve dichiarare un blocco `variable "instance_type" {}` per accettare questo valore.
- `ami_id = "ami-abc123"`: un'altra variabile di input passata al modulo.

### 5a.3: sorgenti dei moduli

Terraform può recuperare moduli da molte posizioni. L'argomento `source` ne determina tipo e posizione.

| Tipo di sorgente | Esempio di sintassi | Note |
|---|---|---|
| Percorso locale | `"./modules/network"` | Percorso relativo o assoluto sul filesystem locale. Non serve l'argomento `version`. Il più veloce in sviluppo. |
| Terraform Registry | `"hashicorp/consul/aws"` | Registry pubblico o privato. Supporta il vincolo `version`. |
| GitHub | `"github.com/org/repo"` oppure `"git::https://github.com/org/repo.git"` | Clona il repository Git. Si può specificare `ref` per branch/tag/commit. |
| Bitbucket | `"bitbucket.org/org/repo"` | Simile a GitHub. |
| Git generico | `"git::https://example.com/repo.git"` | Qualsiasi repository Git. |
| Bucket S3 | `"s3::https://s3.amazonaws.com/my-bucket/module.zip"` | Scarica e decomprime un archivio. |
| URL HTTP | `"https://example.com/module.zip"` | Scarica un archivio. |

Moduli del registry (forma abbreviata):

- `hashicorp/consul/aws` → punta al modulo `consul` per il provider `aws` pubblicato da `hashicorp`.
- `hashicorp/consul/aws//modules/consul-cluster` — il `//` separa il percorso del modulo da una sottodirectory all'interno del repository.

Moduli locali:

- `./modules/network` — cerca il modulo nella directory relativa modules/network. Nessuna negoziazione di versione; le modifiche sono immediate.

Moduli Git:

- `github.com/org/repo?ref=v1.2.0` — clona il repo ed esegue il checkout del tag `v1.2.0`.
- `github.com/org/repo?ref=feature-branch` — usa un branch.

> **Importante per l'esame:** quando usi un percorso locale, Terraform legge il sorgente del modulo direttamente da quella directory su disco. Non c'è alcun passaggio di download dal registry, quindi le modifiche al modulo locale si riflettono alla successiva esecuzione di plan o apply.

Quando usi una sorgente remota (registry, Git, S3), Terraform scarica il modulo in `.terraform/modules/` durante `terraform init`. I file del modulo vengono messi in cache lì. Per aggiornare un modulo remoto a una versione più recente, devi eseguire `terraform init -upgrade` oppure `terraform get -update`.

### 5a.4: installazione dei moduli

Durante `terraform init`, Terraform:

1. Legge tutti i blocchi `module`.
2. Risolve `source` e `version` per ogni modulo remoto.
3. Scarica i moduli remoti in `.terraform/modules/MODULE_NAME/`.
4. Riusa i moduli in cache quando la versione risolta corrisponde.

Per forzare un aggiornamento, usa `terraform init -upgrade` (per provider e moduli del registry) oppure `terraform get -update` (per tutti i moduli).

### 5a.5: struttura standard di un modulo

La guida di studio ufficiale raccomanda una disposizione specifica dei file per i moduli riutilizzabili:

```text
my-module/
├── main.tf          # Definizioni principali delle risorse
├── variables.tf     # Dichiarazioni delle variabili di input
├── outputs.tf       # Dichiarazioni degli output value
├── README.md        # Documentazione
├── LICENSE          # File di licenza
├── modules/         # Sottomoduli annidati (facoltativo)
│   └── submodule/
└── examples/        # Esempi d'uso (facoltativo)
    └── basic/
```

Spiegazione dei file standard:

- `main.tf` — il punto d'ingresso principale. Contiene blocchi `resource` e `data`. Per i moduli semplici è l'unico file necessario.
- `variables.tf` — contiene i blocchi `variable` che definiscono l'interfaccia di input del modulo. Tutte le variabili dovrebbero avere una description.
- `outputs.tf` — contiene i blocchi `output` che espongono i risultati del modulo al modulo padre. Tutti gli output dovrebbero avere una `description`.
- `README.md` — documentazione Markdown. Il Terraform Registry la mostra. Dovrebbe descrivere cosa fa il modulo, i suoi input e output e fornire un esempio.
- `LICENSE` — la licenza con cui il modulo è distribuito. Importante per i moduli pubblici; le organizzazioni spesso richiedono una licenza chiara prima di adottare un modulo.
- `modules/` — contiene sottomoduli annidati. Servono all'organizzazione interna; possono essere chiamati dal modulo radice del modulo. Gli utenti esterni possono chiamarli anche direttamente con la sintassi di sottodirectory `//`.
- `examples/` — contiene configurazioni d'esempio che mostrano come usare il modulo. Non sono usati da Terraform, ma aiutano la documentazione.

---

### 5a.6: laboratorio pratico: reperire un modulo locale

Creeremo un modulo locale e lo useremo.

**Struttura delle directory** _(stepTitle)_

```text
obj5a-lab/
├── main.tf
└── modules/
    └── greeting/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

**Passo 1: creare il modulo figlio modules/greeting/main.tf** _(stepTitle)_

```hcl
# Questa risorsa crea un file locale con un saluto personalizzato.
# Il contenuto del file è costruito da due variabili di input:
# 'recipient' (la persona da salutare) e 'salutation' (la parola di saluto).

resource "local_file" "greeting_file" {
  # Il nome del file è fisso; usiamo path.module per renderlo relativo alla directory del modulo.
  filename = "${path.module}/greeting.txt"
  # Il contenuto combina saluto e destinatario, separati da una virgola.
  content  = "${var.salutation}, ${var.recipient}!"
}
```

Spiegazione del blocco resource:

- `resource "local_file" "greeting_file" {` — dichiara una managed resource di tipo `local_file` con local name `greeting_file`. Terraform gestirà il ciclo di vita di questo file.
- `filename = "${path.module}/greeting.txt"` — imposta il percorso del file di output. `path.module` è un valore integrato pari al percorso nel filesystem del modulo in cui l'espressione viene valutata (qui ./modules/greeting). Quindi il file sarà ./modules/greeting/greeting.txt.
- `content = "${var.salutation}, ${var.recipient}!"` — imposta il contenuto del file. Usa l'interpolazione di stringa per inserire i valori di due variabili di input, seguiti da un punto esclamativo.

**Passo 2: creare modules/greeting/variables.tf** _(stepTitle)_

```hcl
# Dichiara le variabili di input del modulo greeting.
# Chi usa il modulo deve fornire un valore per 'recipient'; 'salutation' ha un default.

variable "recipient" {
  type        = string
  description = "The name of the person to greet."
  # Nessun default: questo rende la variabile obbligatoria.
}

variable "salutation" {
  type        = string
  description = "The greeting word, e.g., 'Hello'."
  default     = "Hello"  # Se non fornito, vale "Hello".
}
```

Spiegazione dei blocchi variable:

- `variable "recipient" {` — definisce una variabile di input chiamata recipient.
- `type = string` — vincola la variabile ad accettare solo valori stringa.
- `description = "..."` — documenta lo scopo della variabile (usata dal Registry e dalle integrazioni con gli IDE).
- `# Nessun default` — poiché non è impostato alcun `default`, l'utente deve fornire un valore per recipient quando chiama il modulo.
- `variable "salutation" {` — definisce una seconda variabile di input.
- `default = "Hello"` — fornisce un valore di ripiego. L'utente può omettere questo argomento, e in tal caso viene usato "Hello".

**Passo 3: creare modules/greeting/outputs.tf** _(stepTitle)_

```hcl
# Espone al modulo padre il percorso del file creato.

output "file_path" {
  value       = local_file.greeting_file.filename
  description = "The path to the greeting file."
}
```

Spiegazione del blocco output:

- `output "file_path" {` — dichiara un output value chiamato `file_path`.
- `value = local_file.greeting_file.filename` — il valore da esportare. Fa riferimento all'attributo `filename` della risorsa `local_file.greeting_file` creata in `main.tf`.
- `description` — documenta l'output.

**Passo 4: creare il modulo root main.tf** _(stepTitle)_

```hcl
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

# Chiama il modulo figlio dal filesystem locale.

module "my_greeting" {
  source = "./modules/greeting"  # Percorso relativo della directory del modulo

  # Passa un valore per la variabile obbligatoria 'recipient'
  recipient = "Terraform Student"
  # 'salutation' è facoltativa; sovrascriviamo il default "Hello" con "Welcome"
  salutation = "Welcome"
}

# Restituisce il percorso del file creato dentro il modulo, accessibile tramite module.<NAME>.<OUTPUT>
output "greeting_file_path" {
  value = module.my_greeting.file_path
}
```

Spiegazione del modulo root:

- `terraform { ... }` — imposta il provider richiesto (`local`) con un vincolo di versione.
- `module "my_greeting" {` — crea un'istanza di modulo figlio chiamata `my_greeting`.
- `source = "./modules/greeting"` — dice a Terraform che il codice del modulo si trova nella directory ./modules/greeting relativa al modulo root.
- `recipient = "Terraform Student"` — imposta la variabile di input `recipient` del modulo figlio alla stringa "Terraform Student".
- `salutation = "Welcome"` — sovrascrive il valore predefinito di `salutation`, sostituendo "Hello" con "Welcome".
- `output "greeting_file_path" {` — crea un output nel modulo root che mostrerà il percorso del file creato dal modulo figlio.
- `value = module.my_greeting.file_path` — usa la sintassi `module.MODULE_NAME.OUTPUT_NAME` per fare riferimento all'output `file_path` del modulo figlio.

**Passo 5: eseguire il workflow** _(stepTitle)_

```bash
terraform init
terraform plan
terraform apply -auto-approve
```

Osserva che il file `modules/greeting/greeting.txt` viene creato con il contenuto "Welcome, Terraform Student!".

---

### 5a.7: pattern di progettazione e best practice per i moduli

Prima di pubblicare o riutilizzare un modulo, scegline un ruolo chiaro. I moduli rientrano in genere in due pattern:

- **Moduli foglia (moduli di risorsa):** incapsulano un insieme piccolo e ben delimitato di risorse (per esempio un singolo database, un sito web statico su S3). Sono mattoni di basso livello pensati per essere composti.
- **Moduli di composizione (moduli di servizio):** combinano più moduli foglia in un componente di livello superiore con scelte predefinite (per esempio `web-service`, che collega load balancer, autoscaling group e security group). Sono quelli che i team applicativi consumano direttamente.

**Indicazioni di progettazione** _(stepTitle)_

- Preferisci moduli foglia piccoli e focalizzati, con input e output semplici e ben documentati. Questo mantiene flessibile il riuso.
- Evita di esporre come output nomi di risorse interne o attributi legati all'implementazione; esporta invece valori logici stabili (ID, endpoint, stringhe di connessione) che servono ai chiamanti.
- Mantieni stabili le interfacce dei moduli. Incrementa le versioni con il versionamento semantico e documenta le modifiche incompatibili nel `CHANGELOG`.
- Fornisci degli `examples/` che mostrino l'uso minimo e quello consigliato (un esempio d'uso semplice e uno simile alla produzione).
- Usa `required_providers` nel blocco `terraform` del modulo per documentare i requisiti di provider, ma non scrivere la configurazione dei provider dentro i moduli figli: lascia che sia il modulo root a fornire le configurazioni e usa le mappature `providers` quando serve.

**Test e pubblicazione** _(stepTitle)_

- Valida i moduli con `terraform validate` e `terraform plan` nelle cartelle degli esempi. Per test di tipo unitario usa Terratest (Go) o kitchen-terraform; per controlli leggeri esegui `terraform fmt` e `tflint` in CI.
- Tagga le release dei moduli ospitati in un registry o su git. Usa tag (vX.Y.Z) così i chiamanti possono bloccare i moduli su riferimenti stabili.
- Documenta chiaramente nel `README.md` input, output e permessi (ruoli IAM richiesti dal modulo).

Ora un breve quiz per verificare la comprensione.

---

### 5a.8: Mini-quiz: sorgenti dei moduli

1. Vero/Falso: quando un modulo proviene da un percorso locale (es. `"./modules/network"`), devi eseguire `terraform get` per scaricarlo prima di usarlo.
2. Scelta multipla: quale delle seguenti è una sorgente valida per un modulo ospitato sul Terraform Registry pubblico?
  - A. "registry.terraform.io/hashicorp/consul/aws"
  - B. "hashicorp/consul/aws"
  - C. "aws/consul/hashicorp"
  - D. "consul/aws"
3. Risposta multipla: quali file fanno parte della struttura standard di un modulo? **(Selezionane QUATTRO)**
  - A. main.tf
  - B. variables.tf
  - C. terraform.tfstate
  - D. outputs.tf
  - E. README.md

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Falso.** I moduli locali vengono caricati dal filesystem, quindi non c'è nulla da scaricare.
2. **B.** Il formato abbreviato del registry è `NAMESPACE/MODULE_NAME/PROVIDER`. La forma estesa sarebbe `registry.terraform.io/hashicorp/consul/aws`, ma di solito il nome host del registry si può omettere.
3. **A, B, D, E.** La disposizione standard di un modulo riutilizzabile include `main.tf`, `variables.tf`, `outputs.tf` e `README.md`. `terraform.tfstate` appartiene alla directory di lavoro root, non al pacchetto del modulo.

> `README.md` non è necessario a Terraform per eseguire il modulo, ma è il file che rende il modulo comprensibile agli altri esseri umani. Pensala come la differenza tra "funziona" e "funziona, ed ecco come non dargli fuoco."

## Descrivere la visibilità delle variabili nei moduli

*Fonti: [Manage values in modules](https://developer.hashicorp.com/terraform/language/v1.12.x/values), [Build and use a Local Module](https://developer.hashicorp.com/terraform/tutorials/modules/module-create), [Module Block Reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/module)*

### 5b.1: visibilità delle variabili

Ogni modulo Terraform ha il proprio **namespace**. Le variabili definite in un modulo figlio sono locali a quel modulo. Il modulo padre o i moduli fratelli non possono accedervi direttamente.

L'unico modo per passare dati tra moduli è:

- **Padre → figlio:** tramite variabili di input (argomenti nel blocco `module`).
- **Figlio → padre:** tramite output value (referenziati come `module.NAME.OUTPUT`).

Nessuna comunicazione diretta tra fratelli. Per passare dati tra due moduli fratelli devi farli transitare dal modulo root:

> Il modulo A restituisce un valore in output → il modulo root lo cattura → il modulo root lo passa come input al modulo B.

```hcl
module "network" {
  source = "./modules/network"
}
module "compute" {
  source = "./modules/compute"
  vpc_id = module.network.vpc_id   # Il root instrada i dati da network a compute
}
```

### 5b.2: interfaccia di input delle variabili

Quando chiami un modulo figlio, i valori degli argomenti nel blocco `module` vengono associati per nome alle dichiarazioni `variable` dentro il modulo figlio.

```hcl
# Dentro il modulo figlio
variable "instance_type" { ... }
variable "instance_count" { ... }
```

```hcl
# Nel padre
module "web" {
  source = "./modules/web"
  instance_type = "t3.micro"    # Corrisponde a variable "instance_type"
  instance_count = 3            # Corrisponde a variable "instance_count"
}
```

**Requisiti** _(stepTitle)_

- Le variabili senza `default` sono obbligatorie. Il padre deve fornirle.
- Le variabili con un `default` sono facoltative. Il padre può ometterle.
- I tipi devono corrispondere. Terraform tenterà una conversione automatica.
- Le variabili contrassegnate come `sensitive` avranno i valori oscurati nell'output del plan, ma il padre può comunque passarle.

### 5b.3: output value

Il padre accede agli output di un modulo con `module.MODULE_NAME.OUTPUT_NAME`.

```hcl
output "instance_ids" {
  value = module.web.instance_ids
}
```

**Distinzione chiave:** dopo `apply`, nella CLI vengono mostrati solo gli output del modulo root. Gli output dei moduli figli non vengono mostrati a meno che il modulo root non li restituisca esplicitamente in output.

### 5b.4: visibilità dei provider

Di default un modulo figlio eredita dal padre le configurazioni di provider predefinite (senza alias). Non ha bisogno di dichiarare un blocco `provider`.

Se un modulo figlio ha bisogno di una configurazione di provider diversa (es. un'altra regione o un altro account), il padre deve passarla esplicitamente con l'argomento `providers` nel blocco `module`:

```hcl
provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

module "app_west" {
  source = "./modules/app"
  providers = {
    aws = aws.west    # Il provider 'aws' predefinito del figlio viene associato a questa config con alias
  }
}
```

Lo approfondiremo nell'Obiettivo 5c.

Esempio più approfondito: il figlio dichiara il requisito di provider, il padre fornisce le configurazioni.

Nel modulo figlio (`modules/app`, blocco `terraform {}`):

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}
```

Le risorse del figlio fanno riferimento al provider `aws` normalmente:

```hcl
resource "aws_s3_bucket" "assets" {
  bucket = var.bucket_name
}
```

Nel modulo padre, fornisci una o più configurazioni `aws` e associale se necessario:

```hcl
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "replica"
  region = "us-west-2"
}

module "primary_app" {
  source = "./modules/app"
  # usa il provider aws predefinito
}

module "replica_app" {
  source = "./modules/app"
  providers = {
    aws = aws.replica  # associa il provider 'aws' del figlio alla config con alias
  }
}
```

**Note importanti** _(stepTitle)_

- Il modulo figlio dovrebbe dichiarare `required_providers` per documentare i provider di cui ha bisogno. La configurazione effettiva del provider (credenziali, regione, alias) viene fornita dal padre.
- La mappa `providers` in un blocco `module` associa i nomi dei provider usati nel figlio agli oggetti di configurazione dei provider del padre. È così che esegui lo stesso modulo in più regioni/account.

---

### 5b.5: laboratorio pratico: visibilità delle variabili

Obiettivo: dimostrare che i moduli fratelli non possono accedere direttamente alle variabili l'uno dell'altro.

Struttura delle directory:

```text
obj5b-lab/
├── main.tf
├── modules/
│   ├── producer/
│   │   ├── main.tf
│   │   └── outputs.tf
│   └── consumer/
│       ├── variables.tf
│       └── main.tf
```

**Modulo producer (modules/producer/main.tf)** _(stepTitle)_

```hcl
# Questo modulo genera un nome di animale casuale e lo espone come output.
resource "random_pet" "name" {
  length = 2
}
```

**Modulo producer (modules/producer/outputs.tf)** _(stepTitle)_

```hcl
# Il nome generato viene esportato così il modulo padre può usarlo.
output "pet_name" {
  value = random_pet.name.id
}
```

**Modulo consumer (modules/consumer/variables.tf)** _(stepTitle)_

```hcl
# Questo modulo si aspetta che il nome gli venga passato dal padre.
variable "base_name" {
  type = string
  description = "A name prefix for the file."
}
```

**Modulo consumer (modules/consumer/main.tf)** _(stepTitle)_

```hcl
# Crea un file il cui nome si basa sulla variabile di input.
resource "local_file" "record" {
  filename = "${path.module}/${var.base_name}.txt"
  content  = "Record for ${var.base_name}"
}
```

**Modulo root (main.tf)** _(stepTitle)_

```hcl
terraform {
  required_providers {
    random = { source = "hashicorp/random", version = "~> 3.6" }
    local  = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

module "producer" {
  source = "./modules/producer"
  # Nessuna variabile di input necessaria; random_pet non richiede input.
}

module "consumer" {
  source    = "./modules/consumer"
  # Passa il nome dell'animale dal producer al consumer.
  # Dimostra come il padre instradi dati tra moduli fratelli.
  base_name = module.producer.pet_name
}

# L'output del modulo consumer potrebbe essere esposto qui, ma non ne abbiamo ancora uno. Facciamo solo apply.
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform apply -auto-approve`
3. Osserva che il modulo consumer crea un file come `modules/consumer/<pet-name>.txt`.
4. Se provassi a fare riferimento a `module.producer.pet_name` dentro il modulo consumer (senza passarlo come variabile), Terraform darebbe errore: le variabili hanno visibilità limitata al modulo.

---

### 5b.6: Mini-quiz: visibilità delle variabili

1. Vero/Falso: un modulo figlio può accedere direttamente agli output value di un modulo fratello senza l'intervento del padre.
2. Scelta multipla: come riceve dati un modulo figlio dal padre?
  - A. Leggendo direttamente i blocchi output del padre.
  - B. Tramite blocchi input nel figlio.
  - C. Tramite variabili di input dichiarate nel figlio e passate come argomenti nel blocco module.
  - D. Usando il data source terraform_remote_state.
3. Vero/Falso: se un modulo figlio non definisce alcun blocco `provider`, non può usare alcuna risorsa.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Falso.** I moduli fratelli non possono accedere direttamente alle variabili o agli output l'uno dell'altro. I dati devono passare attraverso il modulo padre.
2. **C.** Il modulo figlio definisce le variabili di input e il modulo padre passa i valori a quelle variabili nel blocco `module`.
3. **Falso.** Un modulo figlio può comunque usare risorse perché eredita la configurazione di provider predefinita del padre. Il figlio ha bisogno di un proprio blocco provider solo quando deve definire una configurazione diversa da quella del padre, e anche in quel caso la configurazione dovrebbe di solito stare nel padre ed essere passata con `providers`.

## Usare i moduli nella configurazione

*Fonti: [Use registry modules in your configuration](https://developer.hashicorp.com/terraform/tutorials/modules/module-use), [Output Block Reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/output), [Module Composition](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/develop/composition), [Manage values in modules](https://developer.hashicorp.com/terraform/language/v1.12.x/values)*

### 5c.1: chiamare un modulo

La sintassi del blocco `module`:

```hcl
module "NAME" {
  source = "SOURCE"
  version = "VERSION"   # facoltativo, per i registry

  INPUT_VARIABLE_NAME = VALUE
  ...
}
```

- `NAME`: identificatore univoco all'interno del modulo padre. Si usa per fare riferimento agli output del modulo.
- `source`: posizione del codice del modulo (obbligatorio).
- `version`: (facoltativo) stringa di vincolo di versione per i moduli del registry.

Assegnazioni delle variabili di input: coppie chiave-valore che associano i nomi delle variabili del figlio ai valori.

---

### 5c.2: moduli multi-istanza: count e for_each

Puoi creare più istanze di un modulo con `count` o `for_each` (Terraform 0.13+).

**Usare count** _(stepTitle)_

```hcl
module "server" {
  source   = "./modules/server"
  count    = 3
  hostname = "server-${count.index}"
}
```

Questo crea tre istanze del modulo: `module.server[0]`, `module.server[1]`, `module.server[2]`.

**Usare for_each** _(stepTitle)_

```hcl
module "server" {
  source   = "./modules/server"
  for_each = toset(["web", "db", "cache"])
  hostname = each.key
}
```

Questo crea `module.server["web"]`, `module.server["db"]`, `module.server["cache"]`.

**Accedere agli output di moduli multi-istanza** _(stepTitle)_

```hcl
output "all_ips" {
  value = [for s in module.server : s.private_ip]
}
```

### 5c.3: dipendenze esplicite (depends_on)

I blocchi module supportano `depends_on` per garantire l'ordinamento quando i riferimenti impliciti non catturano la dipendenza.

```hcl
module "database" {
  source = "./modules/db"
}

module "app" {
  source     = "./modules/app"
  depends_on = [module.database]
}
```

Questo garantisce che `module.database` sia completamente applicato prima che inizi `module.app`, anche se nessun attributo viene referenziato direttamente.

---

### 5c.4: provider e moduli

**Ereditarietà predefinita:** i moduli figli ereditano implicitamente dal padre le configurazioni di provider predefinite (senza alias). Non hanno bisogno di dichiarare un blocco `provider`.

**Passare provider espliciti:** usa l'argomento `providers` nel blocco `module` per associare il nome di un provider del figlio a una configurazione specifica del padre.

```hcl
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "replica"
  region = "us-west-2"
}

module "primary" {
  source = "./modules/app"
  # Nessun argomento providers; usa il provider 'aws' predefinito.
}

module "replica" {
  source = "./modules/app"
  providers = {
    aws = aws.replica
  }
}
```

Nel modulo figlio, le risorse che usano `aws` useranno il provider corrispondente passato dal padre.

**Nota importante:** un modulo figlio non dovrebbe contenere un blocco `provider` configurato (con credenziali, regione, ecc.). Può includere un blocco `terraform { required_providers { ... } }` per dichiarare di quali provider e versioni ha bisogno, ma la configurazione effettiva dei provider dovrebbe stare nel modulo root (padre) ed essere passata tramite la mappa `providers` quando necessario.

Perché configurare i provider dentro i moduli figli è problematico:

- Le configurazioni dei provider sono globali per un'esecuzione; quando i moduli cercano di configurare i provider localmente si possono creare configurazioni ambigue o in conflitto, soprattutto quando il modulo viene istanziato più volte con `count` o `for_each` o quando istanze diverse richiedono configurazioni di provider diverse. Tenere la configurazione dei provider nel modulo root preserva un'unica fonte di verità e rende prevedibili gli scenari multi-istanza e con provider con alias.
- Inoltre un modulo che contiene un proprio blocco `provider` non può essere usato con `count`, `for_each` o `depends_on`: Terraform restituisce errore.

---

### 5c.5: laboratorio pratico: usare un modulo con più istanze

Creeremo un modulo che genera un file con nome personalizzato, poi lo useremo più volte con `for_each`.

Struttura del modulo:

```text
obj5c-lab/
├── main.tf
└── modules/
    └── named_file/
        ├── variables.tf
        └── main.tf
```

**variables.tf del modulo (modules/named_file/variables.tf)** _(stepTitle)_

```hcl
variable "file_name" {
  type        = string
  description = "The name of the file to create (without extension)."
}
variable "suffix" {
  type        = string
  description = "A suffix to append to the filename."
}
```

**main.tf del modulo (modules/named_file/main.tf)** _(stepTitle)_

```hcl
resource "local_file" "this" {
  filename = "${path.module}/${var.file_name}_${var.suffix}.txt"
  content  = "File created by module instance for ${var.file_name}."
}

# Dall'esterno del modulo si leggono solo gli output, quindi esponiamo il nome del file.
output "filename" {
  value = local_file.this.filename
}
```

**Root (main.tf)** _(stepTitle)_

```hcl
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

locals {
  common_suffix = "v2"
}

module "documents" {
  source   = "./modules/named_file"
  for_each = toset(["alpha", "beta", "gamma"])

  file_name = each.key           # Passa l'elemento del set come file_name
  suffix    = local.common_suffix # Usa il valore locale per suffix
}

output "created_files" {
  value = { for k, m in module.documents : k => m.filename }
}
```

**Spiegazione del main.tf root** _(stepTitle)_

- `terraform { ... }` — imposta il provider `local` richiesto.
- `locals { common_suffix = "v2" }` — definisce un valore locale `common_suffix` riutilizzabile in tutto il modulo.
- `module "documents" {` — crea un'istanza (o un insieme di istanze) di modulo figlio chiamata `documents`.
- `source = "./modules/named_file"` — punta alla directory del modulo.
- `for_each = toset(["alpha", "beta", "gamma"])` — itera su un set di tre stringhe, creando tre istanze del modulo. La chiave (each.key) è una delle stringhe.
- `file_name = each.key` — passa la chiave dell'iterazione come variabile di input `file_name`.
- `suffix = local.common_suffix` — passa il valore locale `common_suffix` come input `suffix`.
- `output "created_files" {` — crea un output nel modulo root che mostra tutti i nomi dei file creati.
- `value = { for k, m in module.documents : k => m.filename }` — usa un'espressione `for` per iterare sulle istanze del modulo. Per ogni istanza (referenziata da m), legge l'output `filename` di quell'istanza. Dall'esterno di un modulo si possono leggere solo i suoi output, non direttamente le sue risorse: per questo il modulo dichiara `output "filename"`.

Esegui `terraform init && terraform apply -auto-approve` per vedere creati tre file.

---

### 5c.6: laboratorio pratico: visibilità dei provider e istanze di modulo multi-regione

Obiettivo: eseguire lo stesso modulo riutilizzabile in due regioni AWS associando le configurazioni dei provider dal modulo padre ai moduli figli.

Struttura delle directory:

```text
obj5c-provider-lab/
├── main.tf
└── modules/
    └── bucket/
        ├── main.tf
        └── variables.tf
```

**Modulo figlio (modules/bucket/main.tf)** _(stepTitle)_

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

variable "bucket_name" { type = string }

resource "aws_s3_bucket" "b" {
  bucket = var.bucket_name
  acl    = "private"
}

output "bucket_arn" {
  value = aws_s3_bucket.b.arn
}
```

**Padre/root (main.tf)** _(stepTitle)_

```hcl
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

module "east_bucket" {
  source = "./modules/bucket"
  bucket_name = "my-app-east-123"
  # usa il provider aws predefinito (us-east-1)
}

module "west_bucket" {
  source = "./modules/bucket"
  bucket_name = "my-app-west-123"
  providers = {
    aws = aws.west  # associa l'aws del figlio al provider con alias del padre
  }
}

output "east_arn" { value = module.east_bucket.bucket_arn }
output "west_arn" { value = module.west_bucket.bucket_arn }
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform plan` — verifica che verranno creati due bucket in regioni diverse.
3. `terraform apply -auto-approve`
4. Conferma che gli output mostrano due ARN diversi, uno per regione.

**Note importanti** _(stepTitle)_

- Il figlio dichiara `required_providers { aws = ... }` ma non configura credenziali o regione: le fornisce il padre tramite i blocchi provider e la mappa `providers`.
- È con questo pattern che si esegue in sicurezza lo stesso modulo su più account/regioni.

---

### 5c.7: Mini-quiz: usare i moduli nella configurazione

1. Vero/Falso: l'argomento `providers` dentro un blocco `module` serve ad associare i nomi dei provider del modulo figlio alle configurazioni di provider del padre.
2. Scelta multipla: vuoi creare tre copie di un modulo, ciascuna con un nome diverso. Quale approccio è più appropriato?
  - A. count = 3 con count.index per distinguerle.
  - B. for_each = toset(["a","b","c"]) con each.key.
  - C. Copiare e incollare il blocco module tre volte.
  - D. Usare un alias del provider.
3. Risposta multipla: quali meta-argomenti sono disponibili su un blocco module? (Selezionane TRE)
  - A. depends_on
  - B. lifecycle
  - C. count
  - D. for_each
  - E. provider

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Vero.** L'argomento `providers` permette di specificare quale configurazione di provider deve usare il modulo figlio per i suoi riferimenti ai provider.
2. **B.** Usare `for_each` con un set di identificatori univoci è il modo più appropriato per creare più istanze di un modulo con nomi diversi.
3. **A, C, D.** I meta-argomenti disponibili su un blocco module includono `depends_on`, `count` e `for_each`. Il meta-argomento `lifecycle` non è valido su un blocco module, e `provider` non è un meta-argomento; si usa invece l'argomento `providers` per specificare le configurazioni di provider del modulo figlio.

## Gestire le versioni dei moduli

*Fonti: [Use registry modules in configuration](https://developer.hashicorp.com/terraform/tutorials/modules/module-use), [Module block reference: version argument](https://developer.hashicorp.com/terraform/language/v1.12.x/block/module#version)*

### 5d.1: vincoli di versione per i moduli

Quando usi moduli da un registry (pubblico o privato), puoi specificare un argomento `version` per controllare quale versione del modulo viene usata.

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"   # versione esatta
}
```

Puoi usare tutti gli stessi operatori di vincolo di versione dei provider: `>=`, `<=`, `~>`, `=`, ecc.

```hcl
version = "~> 5.0"   # qualsiasi 5.x, non la 6.0
version = ">= 4.0, < 5.0"
```

**Nota importante:** se ometti `version`, Terraform userà l'**ultima** versione disponibile al momento del primo download del modulo. Questo può portare a modifiche inattese quando viene rilasciata una nuova major version.

> **Blocca sempre le versioni dei moduli per la stabilità.**

---

### 5d.2: aggiornare i moduli

I moduli vengono scaricati durante `terraform init`. Per aggiornare un modulo a una versione più recente:

1. Cambia il vincolo di versione nel blocco module.
2. Esegui `terraform init -upgrade`.

Il flag `-upgrade` dice a Terraform di controllare il registry per versioni più recenti e di aggiornare `.terraform/modules/` di conseguenza.

In alternativa, anche `terraform get -update` aggiorna i moduli.

### 5d.3: versionamento dei moduli e Git

Per i moduli provenienti da Git, il versionamento si gestisce facendo riferimento a uno specifico `ref` (branch, tag o SHA di commit).

```hcl
module "my_module" {
  source = "git::https://github.com/org/repo.git?ref=v1.2.0"
}
```

Qui `ref=v1.2.0` punta a un tag Git. I tag sono il modo consigliato per versionare i moduli provenienti da Git.

Nessun aggiornamento automatico per le sorgenti Git. Terraform mette in cache il clone. Per aggiornare devi cambiare il `ref` ed eseguire `terraform init -upgrade` oppure `terraform get -update`.

### 5d.4: versionamento dei moduli vs. dei provider

C'è una differenza importante:

- Le versioni dei provider vengono registrate nel dependency lock file (`.terraform.lock.hcl`) per garantire versioni coerenti nel team.
- Le versioni dei moduli non vengono registrate nel lock file. La coerenza si basa sull'argomento `version` nel blocco `module` stesso. Se ometti `version`, membri diversi del team potrebbero ottenere versioni diverse del modulo.

**Best practice:** imposta sempre versioni esatte o con vincoli stretti per tutti i moduli del registry nella tua configurazione.

**Versionamento dei moduli e strategia di aggiornamento (best practice)** _(stepTitle)_

- Usa il Semantic Versioning (SemVer) per i moduli pubblicati. I consumatori dovrebbero usare vincoli `~>` per consentire aggiornamenti di patch/minor non incompatibili (per esempio `~> 1.2`) e bloccare le major version per le modifiche incompatibili.
- Prova gli aggiornamenti dei moduli in un ambiente isolato (CI o un workspace di staging) prima di applicarli in produzione. Il flusso consigliato è: aggiorna `version` (o `ref`) in un branch, esegui `terraform init -upgrade` in CI, esegui `terraform plan` e rivedi attentamente le modifiche alle risorse.
- Per i moduli provenienti da Git, preferisci taggare le release e fare riferimento ai tag con `?ref=v1.2.3`. Evita di puntare a bersagli mobili come `main` in produzione.
- Registra le versioni risolte dei moduli nella documentazione del team o in un artefatto della CI. A differenza dei provider, le versioni dei moduli non vengono catturate in `.terraform.lock.hcl`, quindi il tuo team deve imporre disciplina sulle versioni tramite code review o controlli in CI.
- Valuta l'uso di un registry di moduli (privato o pubblico) che offra revisione, permessi e workflow di rilascio per i moduli dell'organizzazione.

**Test dei moduli e raccomandazioni per la CI** _(stepTitle)_

Costruisci una semplice pipeline di CI per le modifiche ai moduli che esegua automaticamente questi controlli:

- `terraform fmt` — garantisce una formattazione coerente.
- `terraform validate` — intercetta errori di sintassi e semantici di base.
- `tflint` e `checkov` (facoltativi) — intercettano problemi di policy/sicurezza e di stile.
- `terraform init` e `terraform plan` nelle directory degli esempi — garantiscono che gli esempi restino funzionanti quando cambiano le versioni dei provider.
- Test di integrazione (facoltativi): usa Terratest (Go) o kitchen-terraform per creare/distruggere risorse reali in un account sandbox; eseguili solo al merge sui branch protetti.

Fai sì che i fallimenti della CI blocchino i merge che modificano le interfacce dei moduli o i requisiti di provider. Tagga e rilascia le build che passano, così i consumatori possono bloccarsi su una versione nota e funzionante.

### 5d.5: laboratorio pratico: versionamento con un modulo del registry

Obiettivo: usare il modulo pubblico `hashicorp/random` (un modulo del registry fittizio a scopo dimostrativo; in realtà simuleremo usando un modulo locale con vincoli simili a versioni per illustrare il concetto).

Dato che non possiamo accedere a un registry reale senza chiamare un modulo via internet, modificheremo il laboratorio precedente per dimostrare l'aggiornamento della versione di un modulo. Useremo un modulo locale ma cambieremo la "versione" modificando la directory sorgente per simulare una nuova versione.

**Passi dimostrativi (concettuali)** _(stepTitle)_

1. In `main.tf`, imposta `version = "~> 1.0"` per un modulo del registry.
2. Esegui `terraform init`. Terraform scarica l'ultima release 1.x compatibile.
3. Più avanti, cambia il vincolo in `version = "~> 2.0"` ed esegui `terraform init -upgrade`. Terraform aggiorna il modulo alla release 2.x compatibile più recente.

Questo consolida la regola d'esame: modificare il vincolo nel codice non scarica nulla finché non esegui `init`. Per passare alla versione più recente consentita dal vincolo si usa `terraform init -upgrade`; se invece la versione in cache non soddisfa più il nuovo vincolo, anche un semplice `terraform init` scarica una versione compatibile.

---

### 5d.6: Mini-quiz 5d

1. Vero/Falso: le versioni dei moduli vengono registrate automaticamente in `.terraform.lock.hcl` per garantire la coerenza del team.
2. Scelta multipla: per aggiornare un modulo del registry a una nuova versione, dovresti:
  - A. Modificare il vincolo di versione ed eseguire terraform apply.
  - B. Modificare il vincolo di versione ed eseguire terraform init -upgrade.
  - C. Eliminare la directory .terraform ed eseguire terraform apply.
  - D. Eseguire solo terraform get -update (senza cambiare il vincolo).
3. Risposta multipla: quali sorgenti supportano un argomento version? (Selezionane DUE)
  - A. Percorso locale ("./modules/network")
  - B. Terraform Registry ("hashicorp/consul/aws")
  - C. Git senza ref ("git::https://example.com/repo.git")
  - D. Terraform Registry privato ("mycompany/module/provider")

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Falso.** Le versioni dei moduli non vengono registrate nel lock file. La coerenza si basa sull'argomento `version` nel blocco module.
2. **B.** Per aggiornare un modulo del registry devi modificare il vincolo di versione ed eseguire `terraform init -upgrade` per scaricare la nuova versione.
3. **B, D.** L'argomento `version` è supportato per i moduli provenienti dal Terraform Registry, sia pubblico sia privato. Percorsi locali e sorgenti Git non usano `version`; le sorgenti Git si bloccano invece con `ref`.

## Prova completa (20 domande)

Annota le tue risposte e confrontale con quelle fornite alla fine.

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Il blocco `output` di un modulo può fare riferimento direttamente a una variabile di un modulo fratello.

**Domanda 2 (scelta multipla)** _(stepTitle)_

Quale valore di `source` punta correttamente a un modulo locale nella directory `./modules/network`?

- A. "./network"
- B. "./modules/network"
- C. "local/network"
- D. "file://./modules/network"

**Domanda 3 (risposta multipla)** _(stepTitle)_

Quando si reperisce un modulo da un repository Git, quali dei seguenti si possono usare per specificare una versione particolare? (Selezionane DUE)

- A. Argomento version = "1.0.0"
- B. Parametro di query ref=v1.0.0 nell'URL sorgente
- C. Parametro di query ref=main (nome di un branch) nell'URL sorgente
- D. Parametro di query commit=abc123

**Domanda 4 (Vero/Falso)** _(stepTitle)_

L'argomento `providers` in un blocco `module` permette a un modulo figlio di definire le proprie configurazioni di provider che il padre non può sovrascrivere.

**Domanda 5 (scelta multipla)** _(stepTitle)_

Come fai riferimento a un output chiamato `vpc_id` di un modulo figlio chiamato `network`?

- A. data.module.network.vpc_id
- B. module.network.output.vpc_id
- C. module.network.vpc_id
- D. network.vpc_id

**Domanda 6 (scelta multipla)** _(stepTitle)_

Qual è il comportamento predefinito per le configurazioni dei provider nei moduli figli?

- A. I moduli figli devono sempre definire i propri blocchi provider.
- B. I moduli figli ereditano dal padre solo i provider con alias.
- C. I moduli figli ereditano dal padre le configurazioni di provider predefinite (senza alias).
- D. I moduli figli non possono usare provider.

**Domanda 7 (Vero/Falso)** _(stepTitle)_

Un modulo locale reperito tramite percorso relativo verrà aggiornato automaticamente quando esegui `terraform init -upgrade`, se sono state apportate modifiche alla directory del modulo.

**Domanda 8 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono argomenti validi in un blocco `module`? (Selezionane TRE)

- A. source
- B. version
- C. backend
- D. depends_on
- E. lifecycle

**Domanda 9 (Vero/Falso)** _(stepTitle)_

Un modulo figlio può leggere direttamente gli output value del modulo root.

**Domanda 10 (scelta multipla)** _(stepTitle)_

Hai un modulo che crea una VPC AWS. Devi creare tre VPC identiche per tre ambienti diversi. Quale approccio dovresti usare?

- A. Usare count = 3 dentro la risorsa aws_vpc del modulo.
- B. Usare for_each sul blocco module con i nomi degli ambienti.
- C. Definire tre blocchi module separati.
- D. Usare un alias di provider per ogni ambiente.

**Domanda 11 (scelta multipla)** _(stepTitle)_

Cosa succede se ometti l'argomento `version` in un blocco module che fa riferimento a un modulo del Terraform Registry pubblico?

- A. Terraform darà errore, perché version è obbligatorio.
- B. Terraform userà l'ultima versione disponibile al momento del primo download del modulo.
- C. Terraform userà la versione bloccata in .terraform.lock.hcl.
- D. Terraform ti chiederà di scegliere una versione.

**Domanda 12 (Vero/Falso)** _(stepTitle)_

Il `README.md` di un modulo è necessario perché Terraform possa usare il modulo.

**Domanda 13 (risposta multipla)** _(stepTitle)_

Quali delle seguenti affermazioni sulla visibilità delle variabili nei moduli sono vere? (Selezionane DUE)

- A. Le variabili definite in un modulo figlio sono accessibili direttamente dal modulo root.
- B. Il modulo root può accedere agli output di un modulo figlio con `module.NAME.OUTPUT_NAME`.
- C. Due moduli fratelli possono comunicare direttamente senza passare dal modulo root.
- D. Un modulo root passa valori a un modulo figlio tramite gli argomenti del blocco module.

**Domanda 14 (Vero/Falso)** _(stepTitle)_

Quando si usa `for_each` su un blocco module, le risorse del modulo vengono create tutte in parallelo, ignorando qualsiasi dipendenza interna al modulo.

**Domanda 15 (scelta multipla)** _(stepTitle)_

Quale file della struttura standard di un modulo contiene le dichiarazioni delle variabili di input del modulo?

- A. main.tf
- B. outputs.tf
- C. variables.tf
- D. README.md

**Domanda 16 (risposta multipla)** _(stepTitle)_

Quali delle seguenti azioni si possono usare per aggiornare un modulo proveniente dal Terraform Registry? (Selezionane DUE)

- A. Eseguire terraform apply -upgrade
- B. Eseguire terraform init -upgrade
- C. Cambiare il vincolo di versione nel blocco module
- D. Eliminare il file outputs.tf del modulo

**Domanda 17 (Vero/Falso)** _(stepTitle)_

Un modulo figlio può contenere un proprio blocco `terraform` con `required_providers` per specificare di quali provider e versioni ha bisogno.

**Domanda 18 (scelta multipla)** _(stepTitle)_

Qual è lo scopo del `//` in una sorgente di modulo come `"hashicorp/consul/aws//modules/consul-cluster"`?

- A. È un delimitatore di commento.
- B. Separa l'indirizzo del registry da un percorso di sottodirectory all'interno del repository del modulo.
- C. Indica che il modulo usa più provider.
- D. Fa parte della sintassi dei vincoli di versione.

**Domanda 19 (Vero/Falso)** _(stepTitle)_

L'argomento `depends_on` in un blocco `module` può fare riferimento a singole risorse all'interno di quel modulo.

**Domanda 20 (scelta multipla)** _(stepTitle)_

Vuoi condividere dati dal modulo A al modulo B. Il modulo A restituisce in output un valore `subnet_ids`. Come lo passi al modulo B?

- A. Nel main.tf del modulo B, fare riferimento direttamente a module.A.subnet_ids.
- B. Nel modulo root, impostare un argomento nel modulo B come subnet_ids = module.A.subnet_ids.
- C. Usare il data source terraform_remote_state nel modulo B puntando al modulo A.
- D. Definire una variabile globale accessibile da entrambi i moduli.

### Risposte

**Risposte e spiegazioni approfondite** _(stepTitle)_

1. Falso — Gli output di un modulo non possono raggiungere direttamente un modulo fratello. I moduli sono isolati: per condividere dati tra fratelli devi esportare un output dal modulo produttore verso il padre e poi passare quel valore al modulo consumatore tramite un argomento del modulo.
2. B — `"./modules/network"` è la forma corretta di percorso relativo. Anche se gli URL `file://` possono puntare a file locali, il modo convenzionale e portabile nel codice Terraform è il percorso relativo.
3. B, C — Per i moduli provenienti da Git si sceglie la versione con il parametro di query `ref` nell'URL sorgente (`?ref=v1.0.0` o `?ref=main`), che può essere un tag, un nome di branch o uno SHA di commit. L'argomento `version` vale solo per i moduli ospitati in un registry, e `commit=` non è un parametro valido.
4. Falso — L'argomento `providers` in un blocco `module` indica quale configurazione di provider del padre deve usare il figlio; non permette al figlio di nascondere o escludere la possibilità del padre di fornire configurazioni di provider. In pratica la configurazione dei provider (credenziali/regione) dovrebbe essere fornita dal padre.
5. C — Usa `module.network.vpc_id` per leggere l'output `vpc_id` del modulo figlio chiamato `network`.
6. C — Di default un modulo figlio eredita la configurazione di provider predefinita (senza alias) del modulo root. Per usare una configurazione diversa (altra regione/account), il padre crea un provider con alias e lo associa tramite l'argomento `providers`.
7. Falso — I moduli locali vengono letti direttamente dal disco a ogni esecuzione di Terraform; non serve `terraform init -upgrade` per recepire le modifiche ai file sorgente locali. (I moduli remoti sono in cache in `.terraform/modules` e richiedono un'azione di aggiornamento.)
8. A, B, D — `source`, `version` (solo registry) e `depends_on` sono validi in un blocco `module`. `backend` e `lifecycle` non sono argomenti validi a livello di modulo.
9. Falso — Un modulo figlio non può leggere direttamente gli output del root; il root può leggere gli output del figlio e riesportarli se lo desidera, oppure instradare valori da un figlio all'altro.
10. B — Usa `for_each` sul blocco module con un set/mappa di identificatori di ambiente per creare istanze di modulo distinte con chiavi stabili. È più chiaro e meno soggetto a errori che cercare di modificare un singolo modulo con un `count` interno.
11. B — Omettere `version` per un modulo del registry fa sì che Terraform selezioni l'ultima versione disponibile al download iniziale, il che può introdurre differenze tra utenti diversi. Blocca sempre le versioni per la riproducibilità.
12. Falso — `README.md` non è necessario a Terraform per eseguire un modulo, ma è essenziale per gli esseri umani: documenta input, output, esempi ed eventuali esigenze IAM o di permessi.
13. B, D — Vero: gli output di un figlio sono accessibili tramite `module.NAME.OUTPUT_NAME`, e il padre passa valori a un figlio tramite i nomi degli argomenti del blocco module. Le variabili interne a un figlio non sono direttamente visibili al padre.
14. Falso — `for_each` crea più istanze del modulo, ma Terraform rispetta comunque il grafo delle dipendenze, compresi i riferimenti all'interno di ogni istanza del modulo; le dipendenze interne al modulo vengono rispettate.
15. C — `variables.tf` è il posto convenzionale per dichiarare le variabili di input di un modulo.
16. B, C — Per aggiornare un modulo del registry di solito si cambia il vincolo `version` e si esegue `terraform init -upgrade`. Cambiare il vincolo senza reinizializzare non scarica il nuovo codice finché non esegui il passo di upgrade/init.
17. Vero — Un modulo figlio può includere un blocco `terraform { required_providers { ... } }` per dichiarare quali provider e versioni si aspetta; tuttavia la configurazione effettiva dei provider (credenziali, regione, alias) dovrebbe essere fornita dal padre, per evitare conflitti e supportare l'uso multi-istanza.
18. B — Il `//` in una sorgente di modulo separa il percorso del modulo nel registry da un percorso di sottodirectory all'interno del repository (utile per monorepo o moduli con sottomoduli annidati).
19. Falso — `depends_on` su un blocco module può fare riferimento solo a risorse o moduli del modulo padre. Non puoi usare un `depends_on` a livello di padre per fare riferimento a risorse interne del modulo figlio.
20. B — Il pattern normale è: il modulo A esporta `subnet_ids` tramite un output; nel modulo root passi `subnet_ids = module.A.subnet_ids` alla variabile di input del modulo B quando lo chiami.

## Pronti per la gestione dello state

Ora hai il modello dei moduli: reperiscili, delimitane la visibilità, componili e versionali in modo consapevole. Prossima tappa l'Obiettivo 6, dove la gestione dello state trasforma Terraform da "bei file di configurazione" a un sistema affidabile.

> Perché il modulo Terraform è andato in terapia? Aveva troppe dipendenze irrisolte.

Complimenti, ora passiamo all'Obiettivo 6: gestione dello state di Terraform, dove vedremo come Terraform traccia le risorse, gestisce gli state file e usa i backend remoti per la collaborazione. È qui che la magia della infrastructure as code di Terraform prende davvero vita, quindi allaccia le cinture! La gestione dello state è il cuore della capacità di Terraform di gestire l'infrastruttura in modo affidabile e prevedibile.
