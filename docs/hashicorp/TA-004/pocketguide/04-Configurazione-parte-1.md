# Configurazione di Terraform (parte 1)

_L'Obiettivo 4 è la sezione più ampia e dettagliata. Copre l'intero linguaggio di configurazione di Terraform: resource, data source, variabili, output, espressioni, funzioni, dipendenze, condizioni e gestione dei dati sensibili. È qui che impari a scrivere codice Terraform._

> **Modello mentale di base**: Terraform non viene eseguito dall'alto verso il basso come uno script. Costruisce un grafo delle dipendenze a partire dai riferimenti, valida input e tipi, poi pianifica l'insieme minimo di modifiche necessarie a far corrispondere l'infrastruttura reale alla configurazione desiderata.

> Dato il volume, lo divideremo in due parti per garantire profondità senza sovraccarico.

## Usare e distinguere i blocchi resource e data

*Fonti: [Resources](https://developer.hashicorp.com/terraform/language/v1.12.x/resources), [Query data sources](https://developer.hashicorp.com/terraform/tutorials/configuration-language/data-sources), [Data Sources](https://developer.hashicorp.com/terraform/language/v1.12.x/data-sources)*

### 4a.1: il blocco resource: infrastruttura gestita

Un blocco `resource` dichiara un elemento di infrastruttura che Terraform gestirà. Gestire significa che Terraform creerà, leggerà, aggiornerà ed eliminerà (CRUD) questo oggetto per farlo corrispondere allo stato desiderato nella configurazione. In pratica, una resource dice: "Terraform possiede questo oggetto e deve mantenerlo allineato al codice."

Sintassi:

```hcl
resource "TYPE" "LOCAL_NAME" {
  # Argomenti specifici del provider
  argument1 = "value"
  argument2 = 123

  # Blocchi annidati facoltativi
  nested_block {
    setting = true
  }
}
```

`TYPE`: il tipo di risorsa definito dal provider. Formato: provider_risorsa. Esempi: `aws_instance`, `azurerm_virtual_machine`, `local_file`.

`LOCAL_NAME`: un nome che scegli tu per fare riferimento a questa risorsa all'interno del modulo. Deve essere univoco per tipo di risorsa nel modulo. Questo nome non ha alcun effetto sul nome effettivo della risorsa nel cloud.

**Indirizzo della risorsa:** la combinazione `TYPE.LOCAL_NAME` (es. `aws_instance.web`) identifica in modo univoco la risorsa nella configurazione e nello state. Quando ci sono indici, l'indirizzo include anche la chiave o l'indice dell'istanza: per questo state e comandi CLI possono puntare a un singolo oggetto specifico.

**Meta-argomenti** _(stepTitle)_

Terraform fornisce argomenti integrati che funzionano su qualsiasi tipo di risorsa:

- `count`: crea più istanze di una risorsa.
- `for_each`: crea più istanze a partire da una mappa o da un set.
- `depends_on`: definisce esplicitamente le dipendenze.
- `provider`: seleziona una configurazione di provider non predefinita (con alias).
- `lifecycle`: controlla il comportamento del ciclo di vita della risorsa (`create_before_destroy`, `prevent_destroy`, `ignore_changes`).

Li tratteremo in profondità negli obiettivi successivi.

**Comportamento delle resource** _(stepTitle)_

- Quando aggiungi un nuovo blocco `resource`, Terraform pianifica di crearlo.
- Quando modifichi gli argomenti, Terraform pianifica un aggiornamento in-place o una sostituzione (distruzione + creazione) in base a ciò che il provider supporta.
- Quando rimuovi un blocco `resource`, Terraform pianifica di distruggere l'oggetto reale.

---

### 4a.2: il blocco data: interrogare informazioni esistenti

Un blocco `data` (data source) chiede a Terraform di leggere informazioni da una sorgente esterna senza gestirla. I data source sono di sola lettura: servono per scoprire, cercare e riutilizzare, non per possedere.

Sintassi:

```hcl
data "TYPE" "LOCAL_NAME" {
  # Parametri della query
  filter {
    name   = "tag:Name"
    values = ["my-server"]
  }
}
```

- `TYPE`: il tipo di data source, definito dal provider. Esempi: aws_ami, aws_vpc, local_file.
- `LOCAL_NAME`: un identificatore locale per fare riferimento ai dati recuperati.

**Casi d'uso comuni** _(stepTitle)_

- Recuperare l'ID dell'AMI più recente per un'istanza EC2 (così non scrivi gli AMI nel codice).
- Cercare l'ID di una VPC per nome.
- Leggere localmente il contenuto di un file.
- Accedere agli output di un altro workspace Terraform (tramite `terraform_remote_state`).

La differenza pratica è che una resource modifica l'oggetto remoto se necessario, mentre un data source chiede soltanto "cosa esiste già in questo momento?"

**Comportamento dei data source** _(stepTitle)_

- I data source vengono letti durante `plan` se i loro argomenti sono noti.
- Se un argomento del data source dipende da una managed resource non ancora creata, la lettura viene rimandata ad `apply`.
- I data source non creano né modificano nulla. Recuperano solo informazioni.

**Distinzione importante** _(stepTitle)_

| Aspetto | `resource` | `data` |
|---|---|---|
| Scopo | Gestire l'infrastruttura | Interrogare informazioni esistenti |
| State | Ciclo di vita completo nello state file | Risultato in cache nello state, ma non "gestito" |
| Apply | Crea/aggiorna/distrugge | Legge soltanto |
| Riferimento | `TYPE.NAME` | `data.TYPE.NAME` |

---

### 4a.3: meta-argomenti per i blocchi data

I data source supportano gli stessi meta-argomenti delle resource:

- `count` / `for_each`: recuperano più elementi simili.
- `depends_on`: garantisce che la lettura avvenga dopo la creazione di una risorsa specifica.
- `provider`: usa una configurazione di provider con alias.
- `lifecycle`: sono supportati solo `precondition` e `postcondition` (niente `create_before_destroy` ecc.).

### 4a.4: laboratorio pratico: resource vs. data source

Obiettivo: creare un file con una `resource`, poi rileggerne il contenuto con un `data` source.

Directory: `obj4a-lab`

File: `main.tf`

```hcl
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

# Managed resource: controlliamo il ciclo di vita di questo file
resource "local_file" "greeting" {
  content  = "Hello, Terraform!"
  filename = "${path.module}/greeting.txt"
}

# Data source: legge il file appena creato (e qualsiasi file esistente)
data "local_file" "read_greeting" {
  filename = local_file.greeting.filename
}

output "file_content" {
  value = data.local_file.read_greeting.content
}
```

**Passi** _(stepTitle)_

1. `terraform init` — inizializza il provider.
2. `terraform plan` — osserva che Terraform pianifica di creare il file e poi leggerlo. Il data source dipende dalla resource a causa del riferimento local_file.greeting.filename.
3. `terraform apply` — file creato, contenuto in output.
4. Modifica a mano `greeting.txt` cambiando il testo in `"Modified outside Terraform"`.
5. `terraform plan` — Terraform rileverà che il contenuto del file differisce dallo state della resource e proporrà di riportare la resource a `"Hello, Terraform!"`. Il data source rileggerà il file dopo l'aggiornamento.
6. `terraform apply` — file ripristinato.

Questo dimostra la differenza fondamentale: Terraform gestisce la resource, ma si limita a leggere il data source.

---

### 4a.5: Mini-quiz 4a

1. Vero/Falso: un blocco `data` può essere usato per creare una nuova risorsa se non esiste già.
2. Scelta multipla: quale meta-argomento è valido per un blocco `data`?
  - A. lifecycle { create_before_destroy = true }
  - B. depends_on
  - C. provisioner "local-exec"
  - D. prevent_destroy
3. Vero/Falso: il local name di una risorsa (`resource "aws_instance" "web"`) determina il tag Name dell'istanza EC2 in AWS.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **FALSO** — Un blocco `data` legge solo risorse esistenti. Non può creare una nuova risorsa se non esiste.
2. **B** — `depends_on` è un meta-argomento valido per un blocco data. `create_before_destroy`, `prevent_destroy` e `provisioner` non sono supportati sui data source.
3. **FALSO** — Il local name (`"web"`) è un identificatore interno di Terraform, non il tag Name di AWS. Il tag Name va impostato esplicitamente nell'argomento `tags`.

## Fare riferimento agli attributi delle risorse e creare riferimenti tra risorse

*Fonti: [References to Named Values](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions/references), [Resource Address Reference](https://developer.hashicorp.com/terraform/cli/v1.12.x/state/resource-addressing), [Create resource dependencies](https://developer.hashicorp.com/terraform/tutorials/configuration-language/dependencies)*

### 4b.1: fare riferimento agli attributi delle risorse

Una volta definita una resource o un data source, puoi usarne gli attributi in altre parti della configurazione.

La sintassi è:

- `RESOURCE_TYPE.LOCAL_NAME.ATTRIBUTE`
- `data.DATA_TYPE.LOCAL_NAME.ATTRIBUTE`

Esempio:

```hcl
resource "random_pet" "server" {}

resource "local_file" "inventory" {
  content  = "Server name: ${random_pet.server.id}"
  filename = "/tmp/server.txt"
}
```

Qui `random_pet.server.id` è un attributo esportato della risorsa `random_pet`. Terraform deduce automaticamente che `local_file.inventory` dipende da `random_pet.server` e creerà prima il pet. Quell'arco implicito nel grafo è ciò che rende Terraform dichiarativo anziché procedurale.

### 4b.2: tipi di valori con nome

La documentazione elenca diversi valori con nome a cui puoi fare riferimento:

| Prefisso | Significato | Esempio |
|---|---|---|
| `var.` | Variabile di input | `var.instance_count` |
| `local.` | Valore locale | `local.common_tags` |
| `module.` | Output di un modulo figlio | `module.vpc.vpc_id` |
| `data.` | Attributi di un data source | `data.aws_ami.ubuntu.id` |
| `path.module` | Percorso del modulo nel filesystem | `${path.module}/files` |
| `terraform.workspace` | Nome del workspace corrente | `terraform.workspace` |
| `count.index` | Indice nel ciclo `count` | `count.index` |
| `each.key` / `each.value` | Chiave/valore in `for_each` | `each.value` |

### 4b.3: indirizzi delle risorse

Un indirizzo di risorsa identifica in modo univoco un'istanza di risorsa. La sezione Resource Address Reference della documentazione ne descrive il formato:

```text
[module.MODULE_NAME[INDEX].]RESOURCE_TYPE.RESOURCE_NAME[INSTANCE_INDEX]
```

**Esempi** _(stepTitle)_

- `aws_instance.web` — istanza singola.
- `aws_instance.web[0]` — prima istanza se `count = 3`.
- `aws_instance.web["key"]` — istanza per la chiave `"key"` se si usa `for_each`.
- `module.vpc.aws_subnet.private` — risorsa in un modulo figlio.

**Nota importante:** gli indirizzi delle risorse si usano con comandi come `terraform state list`, `terraform state rm`, `terraform taint` (deprecato) e `terraform plan -replace=ADDRESS`. Pensa all'indirizzo come al puntatore esatto di Terraform verso un oggetto nel grafo e nello state.

---

### 4b.4: espressioni splat

Quando una risorsa usa count o `for_each`, rappresenta più istanze. Per ottenere la lista di un attributo su tutte le istanze, usa l'operatore splat `[*]`.

```hcl
resource "aws_instance" "web" {
  count = 3
  ami   = "ami-123"
}

output "all_ips" {
  value = aws_instance.web[*].public_ip
}
```

Questo restituirà una lista degli IP pubblici di tutte e tre le istanze. Con `for_each`, che produce una mappa, lo splat non funziona direttamente. Usa `values()`:

```hcl
output "all_ips" {
  value = values(aws_instance.web)[*].public_ip
}
```

---

### 4b.5: dipendenze implicite vs. esplicite

**Dipendenza implicita:** Terraform rileva i riferimenti e costruisce automaticamente il grafo.

```hcl
resource "aws_security_group" "allow_ssh" {
  # ...
}

resource "aws_instance" "web" {
  vpc_security_group_ids = [aws_security_group.allow_ssh.id]
  # Terraform sa che l'istanza dipende dal SG
}
```

**Dipendenza esplicita:** usa `depends_on` quando la relazione non è catturata da riferimenti ad attributi (es. dipendenze a livello applicativo, o quando una risorsa deve attendere un effetto collaterale di un'altra risorsa che non è un attributo esportato).

```hcl
resource "aws_s3_bucket" "data" { ... }

resource "aws_instance" "app" {
  # Nessun riferimento diretto ad attributi del bucket
  depends_on = [aws_s3_bucket.data]
}
```

**Best practice:** affidati alle dipendenze implicite quando possibile. Usa depends_on esplicito solo quando necessario, per evitare accoppiamenti superflui o quando la dipendenza non è catturata dai riferimenti.

---

### 4b.6: laboratorio pratico: riferimenti e dipendenze

Directory: `obj4b-lab`

File: `main.tf`

```hcl
terraform {
  required_providers {
    random = { source = "hashicorp/random", version = "~> 3.6" }
    local  = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

resource "random_pet" "prefix" {
  length = 2
}

resource "local_file" "config" {
  filename = "${path.module}/${random_pet.prefix.id}.cfg"
  content  = "setting=value"
  # Dipendenza implicita da random_pet.prefix
}

resource "local_file" "readme" {
  filename = "${path.module}/README.txt"
  content  = "Configuration file: ${local_file.config.filename}"
  # Dipendenza implicita da local_file.config
}

# Dipendenza esplicita senza un motivo apparente (dimostrazione)
resource "local_file" "metadata" {
  filename = "${path.module}/metadata.json"
  content  = jsonencode({ created_by = "Terraform" })
  depends_on = [local_file.readme] # Forza la creazione di metadata dopo readme
}

output "config_file" {
  value = local_file.config.filename
}
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform graph | dot -Tpng > graph.png` (richiede Graphviz) per visualizzare le dipendenze.
3. `terraform apply` — osserva l'ordine di creazione.

Esamina `terraform.tfstate` per vedere gli array dependencies.

---

### 4b.7: Mini-quiz: riferimenti e dipendenze

1. Vero/Falso: il local name di una risorsa si può usare per fare riferimento a quella risorsa da un modulo diverso.
2. Scelta multipla: dato `resource "aws_instance" "web" { count = 2 }`, quale espressione restituisce una lista con gli ID di entrambe le istanze?
  - A. aws_instance.web.id
  - B. aws_instance.web[*].id
  - C. aws_instance.web[0].id
  - D. aws_instance.web.*.id
3. Risposta multipla: quali dei seguenti creano una dipendenza? **(Selezionane DUE)**
  - A. ami = var.ami_id
  - B. subnet_id = aws_subnet.main.id
  - C. depends_on = [aws_vpc.main]
  - D. tags = { Name = "web" }

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **FALSO** — Il local name di una risorsa (es. `"web"`) ha visibilità limitata al modulo in cui è dichiarata. Per fare riferimento a una risorsa da un modulo diverso devi usare un output value di quel modulo, non direttamente il local name della risorsa.
2. **B** — `aws_instance.web[*].id` restituisce una lista con gli ID di entrambe le istanze. È la sintassi moderna delle espressioni splat. L'opzione D (aws_instance.web.*.id) è la vecchia sintassi legacy, ancora valida ma meno preferita; B è comunque la risposta idiomatica. (La domanda chiede l'espressione che restituisce una lista; tecnicamente funzionano sia B sia D, ma la risposta consigliata e non ambigua è B.)
3. **B, C** — B crea una dipendenza implicita perché fa riferimento a un attributo di un'altra risorsa. C crea una dipendenza esplicita con depends_on. A e D non creano dipendenze da altre risorse.

## Usare variabili e output

*Fonti: [Customize Terraform configuration with variables](https://developer.hashicorp.com/terraform/tutorials/configuration-language/variables), [Use input variables to add module arguments](https://developer.hashicorp.com/terraform/language/v1.12.x/values), [Output data from Terraform](https://developer.hashicorp.com/terraform/tutorials/configuration-language/outputs), [Output Block Reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/output)*

### 4c.1: variabili di input (blocco variable)

Le variabili parametrizzano la configurazione. Si definiscono con il blocco `variable`:

```hcl
variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t2.micro"

  # Validazione facoltativa
  validation {
    condition     = can(regex("^t[23]\\..+", var.instance_type))
    error_message = "Instance type must be t2 or t3 series."
  }

  # Contrassegna come sensibile (oscura il valore nell'output della CLI)
  sensitive = true
}
```

**Argomenti** _(stepTitle)_

- `type`: vincola il tipo atteso (`string`, `number`, `bool`, `list(...)`, `map(...)`, `object(...)`, ecc.).
- `description`: documentazione della variabile.
- `default`: se fornito, la variabile diventa facoltativa. Se omesso, la variabile è obbligatoria.
- `validation`: condizione personalizzata per validare l'input.
- `sensitive`: nasconde il valore nell'output della CLI (ma resta nello state!).
- `nullable`: (Terraform 1.1+) controlla se `null` è ammesso.

**Precedenza delle variabili** _(stepTitle)_

Quando un valore viene assegnato in più modi, Terraform usa quest'ordine (dalla priorità più alta alla più bassa):

1. `-var` o `-var-file` da riga di comando
2. `*.auto.tfvars` o `*.auto.tfvars.json`
3. `terraform.tfvars.json`
4. `terraform.tfvars`
5. Variabili d'ambiente (`TF_VAR_name`)
6. `default` nel blocco `variable`

Se non viene fornito nulla e non c'è default, Terraform chiede il valore in modo interattivo.

---

### 4c.2: valori locali (blocco locals)

I local sono costanti interne o valori calcolati all'interno di un modulo. Non sono esposti all'esterno.

```hcl
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  name_prefix = "${var.project}-${terraform.workspace}"
}

resource "aws_instance" "web" {
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web" })
}
```

**Best practice:** usa i local per evitare di ripetere espressioni e rendere la configurazione più leggibile.

### 4c.3: output value (blocco output)

Gli output espongono informazioni sulla tua infrastruttura. Vengono stampati dopo `apply` e si possono interrogare con `terraform output`.

```hcl
output "instance_public_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP of the web server"
  sensitive   = true  # Oscurato nella CLI a meno di richiesta esplicita
}
```

**Punti chiave** _(stepTitle)_

- Gli output del modulo root vengono mostrati nella CLI e memorizzati nello state.
- Il modulo padre può accedere agli output di un modulo figlio tramite `module.MODULE_NAME.OUTPUT_NAME`.
- Contrassegnare un output come `sensitive` lo oscura nella CLI, a meno che tu non lo interroghi esplicitamente per nome (`terraform output instance_public_ip`).
- Gli output sensibili restano comunque memorizzati in chiaro nello state file.

---

### 4c.4: file di definizione delle variabili

I file `terraform.tfvars`, `terraform.tfvars.json` e quelli con estensione `.auto.tfvars` / `.auto.tfvars.json` vengono caricati automaticamente; un file con un altro nome (es. `prod.tfvars`) va passato con `-var-file`. Usano una sintassi HCL semplice:

```hcl
# terraform.tfvars
instance_type = "t3.medium"
environment   = "prod"

tags = {
  Owner = "Platform Team"
  CostCenter = "12345"
}
```

**Nota importante:** non committare mai file `.tfvars` che contengono segreti. Usa un'archiviazione remota delle variabili (HCP Terraform, Vault) o variabili d'ambiente.

---

### 4c.5: laboratorio pratico: variabili e output

Directory: `obj4c-lab`

File: `variables.tf`

```hcl
variable "file_name" {
  type        = string
  description = "Name of the file to create"
  default     = "default.txt"
}

variable "file_content" {
  type        = string
  description = "Content to write"
  sensitive   = true
}

variable "append_timestamp" {
  type    = bool
  default = false
}
```

File: `terraform.tfvars` (crealo; sarà ignorato tramite .gitignore)

```hcl
file_name = "custom.txt"
append_timestamp = true
```

File: `main.tf`

```hcl
locals {
  final_content = var.append_timestamp ? "${var.file_content}\nGenerated at: ${timestamp()}" : var.file_content
}

resource "local_file" "output" {
  filename = "${path.module}/${var.file_name}"
  content  = local.final_content
}

output "file_path" {
  value = local_file.output.filename
}

output "file_content" {
  value     = local_file.output.content
  sensitive = true
}
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform plan -var="file_content=Secret123"` — nota che file_content è oscurato nel plan.
3. `terraform apply -var="file_content=Secret123" -auto-approve`
4. `terraform output` — file_content è oscurato.
5. `terraform output -json` — file_content è esposto! Questo dimostra che sensitive è solo un oscuramento nell'interfaccia.
6. `terraform output file_content` — mostra il contenuto reale.

---

### 4c.6: Mini-quiz: variabili e output

1. **Vero/Falso:** se una variabile non ha default e non viene fornito alcun valore, Terraform userà null e procederà con il plan.
2. **Scelta multipla:** quale sorgente di valori per le variabili ha la precedenza più alta?
  - A. Variabile d'ambiente TF_VAR_name
  - B. terraform.tfvars
  - C. -var 'name=value' da riga di comando
  - D. Valore di default nel blocco variable
3. **Risposta multipla:** quali affermazioni sugli output value sono vere? **(Selezionane DUE)**
  - A. Gli output dei moduli figli vengono mostrati automaticamente negli output del modulo root.
  - B. Gli output contrassegnati come sensitive sono cifrati nello state file.
  - C. Gli output si possono interrogare singolarmente con `terraform output NAME`.
  - D. Gli output sono memorizzati nello state file e altre configurazioni possono accedervi tramite `terraform_remote_state`.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Falso.** Se una variabile non ha default e non viene fornito alcun valore, in generale Terraform non prosegue silenziosamente con `null`. Chiede un valore in modalità interattiva oppure fallisce in modalità non interattiva, a meno che la variabile non sia esplicitamente ammessa a null e l'espressione sappia gestirlo.
2. **C.** Il flag `-var` da riga di comando ha la precedenza più alta. Prevale su variabili d'ambiente, file `tfvars` e default perché è la sorgente di valori più esplicita.
3. **C, D.** Gli output si possono interrogare singolarmente con `terraform output NAME`, e sono memorizzati nello state, così altre configurazioni possono leggerli tramite `terraform_remote_state`. Gli output dei moduli figli non vengono mostrati automaticamente nel root a meno che il root non li riesporti, e gli output sensibili sono oscurati nella CLI ma non cifrati nello state.

## Comprendere e usare i tipi complessi

*Fonti: [Complex types](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions/type-constraints#complex-types), [Customize Terraform configuration with variables](https://developer.hashicorp.com/terraform/tutorials/configuration-language/variables)*

### 4d.1: tipi primitivi

- string: testo, es. "hello"
- number: intero o decimale, es. 42 o 3.14
- bool: true o false

Terraform converte automaticamente tra questi tipi quando possibile (es. "42" in 42).

### 4d.2: tipi collezione

- `list(<TYPE>)`: sequenza ordinata, es. list(string) per ["a", "b", "c"].
- `map(<TYPE>)`: coppie chiave-valore in cui le chiavi sono stringhe, es. map(string) per { key1 = "val1", key2 = "val2" }.
- `set(<TYPE>)`: collezione non ordinata di valori unici, es. set(string) per ["a", "b"] (duplicati rimossi).

**Nota importante:** list e map senza argomento di tipo sono abbreviazioni legacy di list(any) e map(any). L'esame preferisce i tipi espliciti.

### 4d.3: tipi strutturali

`object({ ATTR = TYPE, ... })`: definisce una struttura con attributi specifici di tipi specifici.

```hcl
variable "server" {
  type = object({
    name = string
    cpu  = number
    tags = map(string)
  })
}
```

`tuple([TYPE, TYPE, ...])`: lista a lunghezza fissa con tipi specifici per ogni indice.

```hcl
variable "endpoint" {
  type = tuple([string, number])  # es. ["example.com", 443]
}
```

### 4d.4: conversione di tipo e any

Terraform converte automaticamente tra tipi compatibili quando possibile.

`any` è un segnaposto che Terraform risolve in un tipo concreto in base al valore fornito. Usalo con parsimonia, solo quando il tipo davvero non ti interessa (es. quando passi i dati direttamente a jsonencode).

### 4d.5: attributi facoltativi degli oggetti

Terraform 1.3+ supporta attributi facoltativi nei tipi object:

```hcl
variable "config" {
  type = object({
    name    = string
    enabled = optional(bool, true)
    tags    = optional(map(string), {})
  })
}
```

Se il chiamante omette enabled, il valore predefinito è true.

---

### 4d.6: laboratorio pratico: tipi complessi

Directory: obj4d-lab

File: `variables.tf`

```hcl
variable "servers" {
  type = list(object({
    name = string
    size = string
    tags = optional(map(string), {})
  }))
  default = [
    { name = "web", size = "small" },
    { name = "db", size = "large", tags = { backup = "true" } }
  ]
}

variable "regions" {
  type = set(string)
  default = ["us-east-1", "us-west-2"]
}
```

File: `main.tf`

```hcl
locals {
  server_list = join(", ", [for s in var.servers : "${s.name} (${s.size})"])
}

resource "local_file" "summary" {
  filename = "${path.module}/servers.txt"
  content  = <<-EOT
  Servers: ${local.server_list}
  Regions: ${join(", ", var.regions)}
  EOT
}

output "first_server_name" {
  value = var.servers[0].name
}
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform apply -auto-approve`
3. `terraform show` per ispezionare `servers.txt` e vedere la lista generata.

Prova a sovrascrivere con un terraform.tfvars che fornisce una lista servers diversa.

---

### 4d.7: Mini-quiz: tipi complessi

1. Vero/Falso: un tipo tuple richiede che tutti gli elementi siano dello stesso tipo.
2. Scelta multipla: quale tipo useresti per una variabile che si aspetta una mappa in cui tutti i valori sono stringhe?
  - A. map
  - B. map(string)
  - C. object(string)
  - D. list(string)
3. Risposta multipla: data `variable "data" { type = map(any) }`, quali assegnazioni sono valide? (Selezionane TRE)
  - A. { a = "one", b = 2 }
  - B. { a = "one", b = "two" }
  - C. ["one", "two"]
  - D. { nested = { x = 1 } }

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **FALSO** — Una tuple ammette elementi di tipi diversi e ha lunghezza fissa. Una list è omogenea, mentre una tuple è posizionale e può mescolare tipi per indice.
2. **Scelta multipla: B** — `map(string)` dichiara una mappa in cui tutti i valori sono stringhe. `map` da solo è un'abbreviazione di `map(any)`, meno restrittiva. `object(string)` non è valido perché i tipi object richiedono attributi con nome, e `list(string)` è una lista, non una mappa.
3. **Risposta multipla: A, B, D** — `map(any)` accetta mappe i cui valori siano convertibili in un unico tipo comune: in `{ a = "one", b = 2 }` il numero 2 viene convertito nella stringa "2", mentre `{ a = "one", b = "two" }` e `{ nested = { x = 1 } }` sono già omogenei (sono ammesse anche mappe annidate). C è una lista, non una mappa. Valori di tipi non unificabili (es. una stringa e una mappa nella stessa mappa) darebbero errore.

> È stato tanto materiale! Prenditi un momento per ripassare e assicurarti di aver capito i concetti prima di passare al quiz.

## Quiz

**Domanda 1 (Vero/Falso)** _(stepTitle)_

Un blocco data può essere configurato con count per recuperare più istanze di un data source.

**Domanda 2 (scelta multipla)** _(stepTitle)_

Devi fare riferimento all'indirizzo IP privato di un'istanza AWS definita come `resource "aws_instance" "app"`. Quale espressione è corretta?

- A. aws_instance.app.private_ip
- B. resource.aws_instance.app.private_ip
- C. data.aws_instance.app.private_ip
- D. var.aws_instance.app.private_ip

**Domanda 3 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono meta-argomenti validi per un blocco resource? **(Selezionane TRE)**

- A. depends_on
- B. sensitive
- C. lifecycle
- D. provider
- E. validation

**Domanda 4 (Vero/Falso)** _(stepTitle)_

Un valore locale (blocco locals) può fare riferimento ad altri valori locali definiti più avanti nello stesso blocco, purché non ci siano dipendenze circolari.

**Domanda 5 (scelta multipla)** _(stepTitle)_

Hai una variabile definita così:

```hcl
variable "instance_count" {
  type    = number
  default = 1
}
```

Imposti una variabile d'ambiente `TF_VAR_instance_count=3` e passi anche `-var="instance_count=5"` da riga di comando. Quale valore userà Terraform?

- A. 1
- B. 3
- C. 5
- D. Terraform darà errore per valori in conflitto.

**Domanda 6 (scelta multipla)** _(stepTitle)_

Quale vincolo di tipo validerebbe correttamente il valore `{ id = "i-123", tags = { Name = "web" } }`?

- A. map(string)
- B. object({ id = string, tags = map(string) })
- C. list(string)
- D. tuple([string, map(string)])

**Domanda 7 (Vero/Falso)** _(stepTitle)_

Gli output value contrassegnati come sensitive vengono cifrati automaticamente nello state file.

**Domanda 8 (scelta multipla)** _(stepTitle)_

Hai la risorsa `aws_instance "web" { count = 3 }`. Vuoi restituire in output una lista di tutti gli ID delle istanze. Quale espressione di output è corretta?

- A. value = aws_instance.web.id
- B. value = aws_instance.web[*].id
- C. value = aws_instance.web[0].id
- D. value = aws_instance.web.*.id

**Domanda 9 (risposta multipla)** _(stepTitle)_

Quali delle seguenti affermazioni sui data source sono vere? (Selezionane TRE)

- A. I data source si possono usare per leggere infrastruttura esistente senza gestirla.
- B. I data source vengono letti durante terraform plan se tutti gli argomenti sono noti.
- C. I data source possono essere modificati da terraform apply.
- D. I data source supportano il meta-argomento depends_on.

**Domanda 10 (Vero/Falso)** _(stepTitle)_

Il modulo root può accedere all'output di un modulo figlio con la sintassi `module.MODULE_NAME.OUTPUT_NAME`.

**Domanda 11 (scelta multipla)** _(stepTitle)_

Vuoi assicurarti che una variabile environment accetti solo i valori `"dev"`, `"staging"` o `"prod"`. Qual è il modo migliore per imporlo?

- A. Impostare type = string e affidarsi al provider perché fallisca se il valore non è valido.
- B. Aggiungere un blocco validation con un controllo contains.
- C. Impostare sensitive = true per nascondere il valore.
- D. Usare un blocco locals per mappare il valore.

**Domanda 12 (scelta multipla)** _(stepTitle)_

Qual è il modo corretto di fare riferimento a un data source di tipo `aws_ami` con local name `ubuntu`?

- A. resource.aws_ami.ubuntu.id
- B. data.aws_ami.ubuntu.id
- C. aws_ami.ubuntu.data.id
- D. var.aws_ami.ubuntu.id

**Domanda 13 (Vero/Falso)** _(stepTitle)_

Il tipo di variabile set(string) garantisce che gli elementi siano unici e che l'ordine sia preservato.

**Domanda 14 (scelta multipla)** _(stepTitle)_

Definisci la variabile `"ports" { type = list(number) }`. Quale assegnazione di valore non è valida?

- A. [80, 443]
- B. [80, "https"]
- C. [8080]
- D. []

**Domanda 15 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono modi validi per assegnare un valore a una variabile di input? **(Selezionane QUATTRO)**

- A. Definire un default nel blocco variable.
- B. Creare un file terraform.tfvars.
- C. Scrivere il valore direttamente nel blocco resource.
- D. Usare il flag -var da riga di comando.
- E. Impostare una variabile d'ambiente chiamata TF_VAR_name.

### Risposte

**Risposte e brevi spiegazioni** _(stepTitle)_

**D1: VERO** — Il meta-argomento `count` è supportato sui blocchi `data` per recuperare più istanze di un data source.

**D2: A** — `aws_instance.app.private_ip` è il riferimento corretto. Il formato è `<resource_type>.<local_name>.<attribute>`.

**D3: A, C, D** — `depends_on`, `lifecycle` e `provider` sono meta-argomenti validi per le resource. sensitive è per variabili/output, non per le resource. `validation` è per i blocchi variable.

**D4: VERO** — I valori locali possono fare riferimento ad altri valori locali definiti più avanti nello stesso blocco locals, purché non ci siano dipendenze circolari. Terraform risolve le espressioni dei local come un grafo, quindi l'ordine nel blocco non è il fattore determinante.

**D5: C** — Il `-var` da riga di comando (5) ha la precedenza più alta e prevale sulla variabile d'ambiente (3) e sul default (1).

**D6: B** — `object({ id = string, tags = map(string) })` corrisponde esattamente alla struttura. `map(string)` non imporrebbe la struttura annidata; `list(string)` e `tuple` non corrispondono.

**D7: FALSO** — Gli output sensibili non sono cifrati nello state file. Lo state file li memorizza in chiaro, ma Terraform li oscura nell'output della CLI.

**D8: B** — `aws_instance.web[*].id` è l'espressione splat corretta per ottenere una lista di tutti gli ID delle istanze. `aws_instance.web.*.id` (D) è una vecchia sintassi legacy; `[*]` è il modo moderno e consigliato.

**D9: A, B, D** — I data source possono leggere infrastruttura esistente senza gestirla, vengono letti durante `plan` quando tutti gli argomenti sono noti e supportano `depends_on` quando devi forzare la lettura ad attendere. Non modificano l'infrastruttura; `terraform apply` valuta solo il risultato della lettura.

**D10: VERO** — La sintassi `module.MODULE_NAME.OUTPUT_NAME` è esattamente il modo in cui il modulo root legge l'output di un modulo figlio.

**D11: B** — Un blocco `validation` con `contains()` o un'espressione regolare è il modo migliore per imporre i valori ammessi. Affidarsi al provider (A) potrebbe causare errori tardivi; sensitive (C) nasconde ma non valida; i locals (D) non impongono nulla in input.

**D12: B** — `data.aws_ami.ubuntu.id` è il riferimento corretto. I data source usano sempre il prefisso `data`, seguito da tipo, local name e attributo.

**D13: FALSO** — Un `set(string)` garantisce l'unicità ma non preserva l'ordine. Per i set l'ordine non è garantito.

**D14: B** — `[80, "https"]` non è valido perché il tipo è `list(number)`, quindi tutti gli elementi devono essere numeri, e la stringa "https" non si può convertire in numero. (Una stringa numerica come "443" verrebbe invece convertita automaticamente nel numero 443.)

**D15: A, B, D, E** — Definire un default (A), creare un file `terraform.tfvars` (B), usare il flag `-var` (D) e impostare `TF_VAR_name` nell'ambiente (E) sono tutti modi validi per assegnare valori alle variabili di input. Scrivere il valore nel blocco resource scavalca del tutto la variabile.

## Verso la parte 2

Con questo si chiude la prima metà dell'Obiettivo 4. Se la configurazione fosse un grattacielo, la parte 1 sarebbe le fondamenta, la struttura portante e l'impianto elettrico. La parte 2 è dove aggiungiamo gli ascensori, le vetrate e tutto ciò che lo rende impressionante visto da fuori.

Battuta monumentale leggera: la parte 2 di Terraform arriva come un monumento di pietra con un README: solido, grande e impossibile da ignorare.

Passiamo all'Obiettivo 4 (parte 2): scrivere configurazioni Terraform con HCL, dove continueremo a esplorare la sintassi e la struttura del linguaggio di configurazione di Terraform.
