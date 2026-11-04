# Configurazione di Terraform (parte 2)

_Parte 2: è qui che avviene la magia. Questo è il cuore della configurazione Terraform. La prima metà dell'Obiettivo 4 copre le basi di resource, data source, variabili, output e tipi complessi. Questa seconda metà approfondisce le funzionalità più avanzate che rendono Terraform davvero potente e flessibile._

> Queste sono le funzionalità avanzate del linguaggio di configurazione. Non servono per i casi d'uso semplici, ma sono essenziali per costruire infrastructure as code robusta, manutenibile e sicura. Padroneggiarle ti distinguerà come professionista Terraform e ti preparerà agli scenari più complessi trattati negli obiettivi successivi.

## Scrivere configurazioni dinamiche con espressioni e funzioni

*Fonti: [Perform dynamic operations with functions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/functions), [Built-in Functions](https://developer.hashicorp.com/terraform/language/v1.12.x/functions), [Create dynamic expressions](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions)*

### 4e.1: panoramica delle espressioni

Le espressioni di Terraform permettono di calcolare valori dinamicamente invece di scriverli in modo statico. La guida distingue:

- **Valori semplici:** `"hello"`, `42`, `true`
- **Riferimenti:** `var.name`, `aws_instance.web.id`
- **Operatori:** `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `>`, `<`, `&&`, `||`, `!`
- **Condizionali:** `condition ? true_val : false_val`
- **Espressioni for:** `[for s in var.list : upper(s)]`
- **Espressioni splat:** `aws_instance.web[*].id`
- **Template di stringa:** `"Hello, ${var.name}!"`
- **Chiamate di funzione:** `upper("hello")`

Nota su tipi ed errori:

- Terraform tenta una coercizione di tipo sicura quando ha senso (per esempio, convertendo stringhe numeriche in numeri in alcune funzioni), ma non dovresti affidarti alle conversioni implicite nelle espressioni complesse. Quando il tipo conta, preferisci funzioni di conversione esplicite come `tostring()`, `tonumber()` e `tolist()`.
- Usa `can()` per verificare se un'espressione andrà a buon fine senza causare un errore in fase di plan. Esempio: `can(regex("^v[0-9]+", var.version))`.
- Usa `try(expr, fallback)` per tentare espressioni che potrebbero fallire e fornire un valore di ripiego. Aiuta a evitare errori a runtime nelle espressioni `for` o con attributi facoltativi.

> **Best practice:** mantieni le espressioni leggibili e prevedibili. Se una singola espressione diventa troppo complessa, calcola valori intermedi con `locals {}` e dagli nomi descrittivi.

### 4e.2: espressioni condizionali

Sintassi: `condition ? value_if_true : value_if_false`

```hcl
resource "aws_instance" "web" {
  instance_type = var.environment == "prod" ? "t3.large" : "t3.micro"
}
```

**Punti chiave** _(stepTitle)_

- Entrambi i valori risultanti devono essere dello **stesso tipo** (o convertibili).
- La condizione deve restituire un booleano.
- Le espressioni condizionali si possono annidare, ma la leggibilità ne risente.

### 4e.3: espressioni for

Le espressioni for trasformano liste, set, tuple, mappe od oggetti in nuove collezioni.

**Trasformazione di una lista** _(stepTitle)_

```hcl
[for s in var.names : upper(s)]
# Input: ["alice", "bob"] -> Output: ["ALICE", "BOB"]
```

**Trasformazione di una mappa** _(stepTitle)_

```hcl
{for k, v in var.tags : k => upper(v)}
# Input: {env = "dev"} -> Output: {env = "DEV"}
```

**Filtrare con if** _(stepTitle)_

```hcl
[for s in var.names : upper(s) if length(s) > 3]
```

**Raggruppare con ... (ellissi)** _(stepTitle)_

```hcl
{for s in var.servers : s.name => s...}
# Crea una mappa indicizzata per nome: ogni valore è la lista di tutti gli
# oggetti con quel nome (l'ellissi raggruppa le chiavi duplicate)
```

### 4e.4: espressioni splat

L'operatore splat `[*]` estrae un singolo attributo da tutti gli elementi di una lista.

```hcl
resource "aws_instance" "web" {
  count = 3
  # ...
}

output "instance_ids" {
  value = aws_instance.web[*].id
}
```

Per le mappe (da `for_each`), usa prima `values()`:

```hcl
values(aws_instance.web)[*].id
```

**Splat legacy:** `aws_instance.web.*.id` — funziona ancora, ma è preferibile `[*]`.

### 4e.5: template di stringa e heredoc

**Interpolazione** _(stepTitle)_

```hcl
"Hello, ${var.name}!"
```

**Direttive** _(stepTitle)_

```hcl
"%{if condition}text%{else}other%{endif}"
```

**Sintassi heredoc** _(stepTitle)_

```hcl
<<-EOT
  This is a multi-line string.
  Variables like ${var.name} are interpolated.
  EOT
```

### 4e.6: funzioni integrate

La guida di studio ufficiale elenca **decine** di funzioni. L'esame si concentra su quelle comuni e sui loro casi d'uso.

**Numeriche** _(stepTitle)_

- `max(1, 5, 3)` → `5`
- `min(...)`
- `ceil(3.14)` → `4`
- `floor(3.14)` → `3`

**Stringhe** _(stepTitle)_

- `upper("hello")` → `"HELLO"`
- `lower("HELLO")` → `"hello"`
- `join(", ", ["a", "b"])` → `"a, b"`
- `split(",", "a,b,c")` → `["a", "b", "c"]`
- `replace("hello world", "world", "Terraform")` → `"hello Terraform"`
- `substr("hello", 1, 3)` → `"ell"`
- `trimspace("  hi  ")` → `"hi"`
- `regex("^[a-z]+", "abc123")` → `"abc"`

**Collezioni** _(stepTitle)_

- `length([1,2,3])` → `3`
- `lookup(map, key, default)`
- `merge(map1, map2)`
- `concat(list1, list2)`
- `element(list, index)`
- `slice(list, start, end)`
- `keys(map)` → lista delle chiavi
- `values(map)` → lista dei valori
- `contains(list, "value")` → booleano
- `flatten(list_of_lists)`
- `setintersection(set1, set2)`
- `setunion(set1, set2)`
- `toset(list)` → rimuove i duplicati

**Filesystem** _(stepTitle)_

- `file("path")` → restituisce il contenuto del file come stringa
- `templatefile("template.tpl", { var = value })` → genera il template
- `filebase64("path")` → contenuto codificato in base64

**Codifica** _(stepTitle)_

- `jsonencode({ key = "value" })` → `{"key":"value"}`
- `jsondecode("...")`
- `yamlencode(...)`
- `yamldecode(...)`
- `base64encode(...)`
- `base64decode(...)`

**Data e ora** _(stepTitle)_

- `timestamp()` → timestamp UTC corrente
- `formatdate("YYYY-MM-DD", timestamp())`
- `timeadd(timestamp(), "24h")`

**IP e CIDR** _(stepTitle)_

- `cidrsubnet("10.0.0.0/16", 8, 1)` → `"10.0.1.0/24"`
- `cidrhost("10.0.0.0/24", 5)` → `"10.0.0.5"`
- `cidrnetmask("10.0.0.0/24")` → `"255.255.255.0"`

**Conversione di tipo** _(stepTitle)_

- `tostring(value)`
- `tonumber(value)`
- `tobool(value)`
- `tolist(set)`
- `tomap(object)`

**Trappole comuni e best practice** _(stepTitle)_

- Attenzione alle funzioni che restituiscono tipi diversi per input diversi (es. `jsondecode()` può produrre mappe, liste o scalari). Valida esplicitamente o proteggi con `can()` quando serve.
- Evita un uso massiccio di chiamate di funzione annidate negli argomenti delle risorse; calcola valori intermedi in `locals {}` per chiarezza e debug più semplice.
- Preferisci `lookup(map, key, default)` all'indicizzazione diretta quando le chiavi possono mancare, per evitare errori in fase di plan.
- Usa `try()` per fornire valori di ripiego per attributi facoltativi o specifici del provider che potrebbero non esistere in tutti i contesti.

### 4e.7: la funzione templatefile

È un **argomento d'esame cruciale**. Legge un file di template e vi interpola le variabili.

**File di template (user_data.tpl)** _(stepTitle)_

```bash
#!/bin/bash
echo "Server name: ${server_name}" >> /var/log/startup.log
echo "Environment: ${environment}" >> /var/log/startup.log
```

**Uso in Terraform** _(stepTitle)_

```hcl
resource "aws_instance" "web" {
  user_data = templatefile("${path.module}/user_data.tpl", {
    server_name = var.name
    environment = var.env
  })
}
```

**Punti chiave** _(stepTitle)_

- Le variabili del template usano la sintassi `${...}` (come Terraform, ma in un contesto separato).
- Il secondo argomento è una mappa di valori delle variabili.
- Il risultato è una stringa che si può passare agli argomenti delle risorse.

### 4e.8: funzioni definite dai provider

Alcuni provider espongono funzioni personalizzate (Terraform 1.8+). Sintassi:

```hcl
provider::aws::arn_parse("arn:aws:s3:::mybucket")
```

L'esame potrebbe verificare che tu sappia che le funzioni possono provenire dai provider, non solo essere integrate.

### 4e.9: laboratorio pratico: funzioni ed espressioni

**Directory:** `obj4e-lab`

**File: variables.tf** _(stepTitle)_

```hcl
variable "servers" {
  type = list(object({
    name = string
    size = string
  }))
  default = [
    { name = "web", size = "small" },
    { name = "db", size = "large" },
    { name = "cache", size = "medium" }
  ]
}
```

**File: template.tpl** _(stepTitle)_

```
Servers:
%{ for s in servers ~}
- ${s.name} (${s.size})
%{ endfor ~}
Generated at: ${timestamp}
```

**File: main.tf** _(stepTitle)_

```hcl
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.5" }
  }
}

locals {
  large_servers = [for s in var.servers : s.name if s.size == "large"]
  server_names  = join(", ", [for s in var.servers : upper(s.name)])
}

resource "local_file" "report" {
  filename = "${path.module}/report.txt"
  content  = templatefile("${path.module}/template.tpl", {
    servers   = var.servers
    timestamp = formatdate("YYYY-MM-DD HH:mm", timestamp())
  })
}

output "large_servers" {
  value = local.large_servers
}

output "all_server_names_uppercase" {
  value = local.server_names
}
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform plan` — osserva i valori calcolati.
3. `terraform apply -auto-approve`
4. Ispeziona `report.txt` e gli output.
5. Sperimenta con `terraform console` per provare le funzioni in modo interattivo:

```bash
terraform console
> upper("test")
"TEST"
> max(1,5,3)
5
> slice(["a","b","c","d"], 1, 3)
["b", "c"]
> cidrsubnet("10.0.0.0/16", 8, 2)
"10.0.2.0/24"
```

### 4e.10: Mini-quiz: funzioni, espressioni e validazione

1. Vero/Falso: la funzione `templatefile` si può usare solo con file che terminano in `.tpl`.
2. Scelta multipla: quale funzione useresti per combinare due mappe in una?
  - A. `concat`
  - B. `join`
  - C. `merge`
  - D. `union`
3. Risposta multipla: quali delle seguenti sono espressioni Terraform valide? (Selezionane DUE)
  - A. `"Hello, ${var.name}"`
  - B. `[for x in var.list : x if x > 0]`
  - C. `if var.env == "prod" then "large" else "small"`
  - D. `var.tags["Name"]`

**Risposte e brevi spiegazioni** _(stepTitle)_

1. Falso — `templatefile` può leggere qualsiasi file, l'estensione non conta. La convenzione `.tpl` serve solo per chiarezza.
2. C — `merge` combina mappe. `concat` è per le liste, `join` per le stringhe, e `union` non esiste (per i set si usa `setunion`).
3. A, B — A è un'interpolazione di stringa valida e B è un'espressione for valida con filtro. C ha una sintassi non valida (si dovrebbe usare `? :`), e D è valida solo se `var.tags` è una mappa, ma la domanda chiede espressioni in generale, quindi non possiamo darlo per scontato.

## Definire le dipendenze tra risorse nella configurazione

*Fonti: [Create resource dependencies](https://developer.hashicorp.com/terraform/tutorials/configuration-language/dependencies), [Resource graph](https://developer.hashicorp.com/terraform/internals/v1.12.x/graph)*

### 4f.1: fondamenti del grafo delle dipendenze

Terraform costruisce automaticamente un **grafo delle dipendenze** analizzando i riferimenti tra risorse. La sezione `Dependency Graph` della guida spiega:

- **Nodi:** resource, data source, provider.
- **Archi:** dipendenze tra nodi.
- **Walk (attraversamento):** Terraform attraversa il grafo in parallelo, rispettando le dipendenze.

**Dipendenze implicite:** si creano quando una risorsa fa riferimento all'attributo di un'altra risorsa.

```hcl
resource "aws_vpc" "main" { ... }
resource "aws_subnet" "main" {
  vpc_id = aws_vpc.main.id  # Dipendenza implicita
}
```

**Dipendenze esplicite:** usa `depends_on` quando Terraform non può dedurre la relazione.

```hcl
resource "aws_s3_bucket" "data" { ... }
resource "aws_instance" "app" {
  depends_on = [aws_s3_bucket.data]  # Esplicita
}
```

### 4f.2: quando usare depends_on

La guida elenca scenari specifici:

- Quando una risorsa deve attendere un effetto collaterale non catturato negli attributi (es. il ritardo di propagazione di un ruolo IAM).
- Quando una risorsa dipende da un **intero modulo** anziché da un output specifico.
- Quando vuoi forzare un ordinamento per motivi applicativi.

**Sfumature per moduli e riferimenti tra moduli** _(stepTitle)_

- I moduli non condividono implicitamente le risorse interne. Se il modulo A crea qualcosa che serve al modulo B, il pattern comune è che il modulo A esponga un output e il root (o il chiamante) lo passi al modulo B. In alternativa puoi impostare `depends_on = [module.module_a]` nel blocco module del modulo B quando l'ordinamento va imposto all'intero modulo.
- `depends_on` in un blocco module si applica nel punto di chiamata del modulo (modulo root) e fa sì che l'intero modulo figlio attenda i moduli/risorse referenziati.

Attenzione a prestazioni e manutenzione:

- Ogni arco `depends_on` può ridurre la concorrenza; abusarne serializza gli apply e rallenta i team. Usa `depends_on` esplicito solo quando la dipendenza non è già rappresentata da riferimenti o output.

**depends_on a livello di modulo** _(stepTitle)_

```hcl
module "vpc" { ... }
module "app" {
  depends_on = [module.vpc]
}
```

**Nota importante:** abusare di `depends_on` riduce il parallelismo e rallenta gli apply. Usalo solo quando necessario.

### 4f.3: il meta-argomento lifecycle

Il blocco `lifecycle` dentro una `resource` controlla come Terraform gestisce il ciclo di vita di quella risorsa.

```hcl
resource "aws_instance" "web" {
  # ... argomenti ...

  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
    ignore_changes        = [tags, user_data]
    replace_triggered_by  = [aws_security_group.allow_ssh.id]
  }
}
```

**Regole del lifecycle** _(stepTitle)_

- **create_before_destroy (bool):** quando una risorsa va sostituita, crea quella nuova **prima** di distruggere quella vecchia. Riduce il downtime.

Esempio (evitare downtime per un failover del database):

```hcl
resource "aws_db_instance" "master" {
  # ... argomenti ...

  lifecycle {
    create_before_destroy = true
  }
}
```

Compromessi: `create_before_destroy` può aumentare temporaneamente i costi (due istanze) e potrebbe non essere possibile quando il provider o la risorsa impongono nomi univoci. In quei casi valuta di progettare risorse immutabili con pattern blue/green a livello applicativo.

- **prevent_destroy (bool):** se `true`, Terraform dà errore se un piano distruggerebbe questa risorsa. Protegge le risorse critiche.
- **ignore_changes (list):** Terraform ignorerà le differenze negli attributi elencati quando pianifica gli aggiornamenti.
- **replace_triggered_by (list):** forza la sostituzione di questa risorsa se cambia una qualsiasi delle risorse o degli attributi referenziati.

`replace_triggered_by` è utile quando una modifica in una risorsa correlata deve causare la sostituzione della risorsa che la usa, anche se il diff predefinito di Terraform non lo farebbe. Usalo con parsimonia, in modo che le sostituzioni restino intenzionali.

### 4f.4: laboratorio pratico: dipendenze e lifecycle

**Directory:** `obj4f-lab`

**File: main.tf** _(stepTitle)_

```hcl
resource "random_pet" "first" {
  length = 1
}

resource "random_pet" "second" {
  length = 1
  depends_on = [random_pet.first]  # Dipendenza esplicita
}

resource "local_file" "config" {
  filename = "${path.module}/config.txt"
  content  = "first: ${random_pet.first.id}, second: ${random_pet.second.id}"

  lifecycle {
    ignore_changes = [content]  # Le modifiche al contenuto non attivano aggiornamenti
  }
}

output "first_pet" {
  value = random_pet.first.id
}

output "second_pet" {
  value = random_pet.second.id
}
```

**Passi** _(stepTitle)_

1. `terraform init && terraform apply -auto-approve`
2. Modifica a mano il contenuto di `config.txt`. Esegui `terraform plan`: nessuna modifica rilevata, grazie a `ignore_changes`.
3. Cambia la lunghezza di `random_pet.first` in `2`. Esegui `terraform plan`. Terraform distruggerà e ricreerà `first`. `second` invece non viene sostituito: `depends_on` stabilisce solo l'ordine, e per forzarne la sostituzione servirebbe `replace_triggered_by`. `local_file.config` **non** verrà aggiornato per via di `ignore_changes`.
4. Aggiungi `prevent_destroy = true` a `local_file.config`. Prova `terraform destroy`: darà errore.

### 4f.5: Mini-quiz: dipendenze tra risorse e lifecycle

1. Vero/Falso: `depends_on` si può usare dentro un blocco `data`.
2. Scelta multipla: quale regola del lifecycle impedisce l'eliminazione accidentale di una risorsa?
  - A. `create_before_destroy`
  - B. `prevent_destroy`
  - C. `ignore_changes`
  - D. `replace_triggered_by`
3. Risposta multipla: quando Terraform crea automaticamente una dipendenza implicita? (Selezionane DUE)
  - A. Quando una risorsa fa riferimento all'attributo di un'altra risorsa.
  - B. Quando due risorse condividono lo stesso blocco `provider`.
  - C. Quando una risorsa usa un data source che fa riferimento a una managed resource.
  - D. Quando le risorse sono definite nello stesso file `.tf`.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. Vero — `depends_on` si può usare nei blocchi `data` per specificare dipendenze da risorse o altri data source.
2. B — `prevent_destroy` fa sì che Terraform dia errore se un'operazione distruggerebbe la risorsa, fornendo una protezione contro l'eliminazione accidentale.
3. A, C — Una dipendenza implicita si crea quando una risorsa fa riferimento all'attributo di un'altra risorsa (A) o quando un data source fa riferimento a una managed resource (C). Condividere lo stesso blocco provider o stare nello stesso file non crea dipendenze.

## Validare la configurazione con condizioni personalizzate

*Fonti: [Validate your configuration](https://developer.hashicorp.com/terraform/language/v1.12.x/validate), [Validate modules with custom conditions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/custom-conditions), [Use checks to validate infrastructure](https://developer.hashicorp.com/terraform/tutorials/configuration-language/checks)*

### 4g.1: tipi di validazione

Terraform offre più livelli di validazione:

| Tipo | Ambito | Quando viene valutato | Blocca l'operazione? |
|---|---|---|---|
| Validazione delle variabili | Variabili di input | Durante il plan | Sì |
| Precondition | Resource, data source, output | Prima di creare/leggere | Sì |
| Postcondition | Resource, data source | Dopo aver creato/letto | Sì |
| Check | Qualsiasi asserzione | Alla fine di plan/apply | No (solo warning) |

### 4g.2: validazione delle variabili

```hcl
variable "instance_type" {
  type = string

  validation {
    condition     = can(regex("^t3\\.", var.instance_type))
    error_message = "Only t3 instance types are allowed."
  }
}
```

**Sono ammesse più validazioni per la stessa variabile.**

### 4g.3: precondition e postcondition

Si definiscono all'interno di un blocco `lifecycle` per resource e data source, oppure direttamente nei blocchi `output`.

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  lifecycle {
    # Controllo PRIMA di creare l'istanza
    precondition {
      condition     = data.aws_ami.ubuntu.architecture == "x86_64"
      error_message = "AMI must be x86_64 architecture."
    }

    # Controllo DOPO aver creato l'istanza
    postcondition {
      condition     = self.public_ip != null
      error_message = "Instance must have a public IP."
    }
  }
}
```

**Precondition su un output** _(stepTitle)_

```hcl
output "bucket_name" {
  value = aws_s3_bucket.data.bucket

  precondition {
    condition     = length(var.bucket_name) <= 63
    error_message = "Bucket name must be 63 characters or less."
  }
}
```

### 4g.4: blocchi check

I check validano l'infrastruttura senza bloccare le operazioni. Vengono eseguiti alla **fine** di `plan` e `apply`.

```hcl
check "website_health" {
  data "http" "index" {
    url = "https://${aws_instance.web.public_dns}"
  }

  assert {
    condition     = data.http.index.status_code == 200
    error_message = "Website returned ${data.http.index.status_code}"
  }
}
```

**Punti chiave** _(stepTitle)_

- I blocchi `check` **non** sono legati al ciclo di vita di una risorsa specifica.
- Possono contenere i propri `data` source, visibili solo all'interno del check.
- I fallimenti producono **warning**, non errori.

Tempistiche di esecuzione e indicazioni per la CI:

- Le **precondition** vengono valutate prima di creare o leggere la risorsa e bloccano `apply` se falliscono. Le **postcondition** vengono eseguite dopo che la risorsa è stata creata/letta e anch'esse bloccano in caso di fallimento.
- I **blocchi check** vengono eseguiti alla fine di `plan` e `apply` e producono warning (a meno che la tua CI non tratti gli warning come errori). Usa i check per l'osservabilità e gli avvisi non bloccanti; usa precondition/postcondition come cancelli di sicurezza rigidi.
- Nelle pipeline di CI, esegui `terraform plan` in un job pre-merge e tratta le precondition fallite come cancello. Esegui periodicamente `terraform apply` o il runner dei check di HCP Terraform per una validazione continua contro il drift.

### 4g.5: validazione continua in HCP Terraform

Quando è abilitata, HCP Terraform valuta periodicamente i blocchi `check` e le condizioni di un workspace, avvisandoti di drift della configurazione o di condizioni fallite **senza** richiedere un nuovo `apply`. È trattata nell'Obiettivo 8.

### 4g.6: laboratorio pratico: condizioni personalizzate

**Directory:** `obj4g-lab`

**File: variables.tf** _(stepTitle)_

```hcl
variable "file_name" {
  type = string

  validation {
    condition     = can(regex("^[a-z]+\\.txt$", var.file_name))
    error_message = "File name must be lowercase letters only and end with .txt"
  }
}

variable "content_length" {
  type    = number
  default = 10
}
```

**File: main.tf** _(stepTitle)_

```hcl
resource "local_file" "data" {
  filename = "${path.module}/${var.file_name}"
  content  = random_string.generator.result

  lifecycle {
    postcondition {
      condition     = length(self.content) == var.content_length
      error_message = "Content length must be ${var.content_length}, got ${length(self.content)}"
    }
  }
}

resource "random_string" "generator" {
  length = var.content_length
}

check "file_exists" {
  data "local_file" "check" {
    filename = local_file.data.filename
  }

  assert {
    condition     = fileexists(data.local_file.check.filename)
    error_message = "File ${data.local_file.check.filename} was not created."
  }
}
```

**Passi** _(stepTitle)_

1. `terraform init`
2. Prova `terraform plan -var="file_name=BAD.txt"`: la validazione fallisce.
3. Usa un nome valido: `terraform apply -var="file_name=good.txt" -auto-approve`
4. Osserva che la postcondition viene superata.
5. Elimina il file a mano. Esegui `terraform plan`: il `data` source del blocco `check` viene valutato durante la pianificazione del check e la sua asserzione fallirà perché il file non esiste più. Questo dimostra come i check intercettino il drift al momento di plan/apply.

### 4g.7: Mini-quiz: condizioni personalizzate

1. Vero/Falso: una precondition fallita impedisce a `terraform apply` di procedere.
2. Scelta multipla: quale tipo di validazione produce un warning anziché un errore quando fallisce?
  - A. Validazione delle variabili
  - B. Precondition
  - C. Postcondition
  - D. Asserzione di un blocco check
3. Risposta multipla: dove puoi definire una precondition? (Selezionane DUE)
  - A. In un blocco `variable`
  - B. In un blocco lifecycle di una `resource`
  - C. In un blocco lifecycle di un `data`
  - D. In un blocco `provider`

**Risposte e brevi spiegazioni** _(stepTitle)_

1. Vero — Una precondition fallita fa sì che Terraform dia errore e interrompa il processo di apply.
2. D — Le asserzioni dei blocchi check producono warning quando falliscono, mentre validazione delle variabili, precondition e postcondition producono errori.
3. B, C — Le precondition si possono definire nel blocco lifecycle sia dei blocchi `resource` sia dei blocchi `data`. Non si possono definire nei blocchi `variable` o `provider`.

## Comprendere le best practice per gestire i dati sensibili

*Fonti: [Protect sensitive input variables](https://developer.hashicorp.com/terraform/tutorials/configuration-language/sensitive-variables#sensitive-values-in-state), [Manage sensitive data in your configuration](https://developer.hashicorp.com/terraform/language/v1.12.x/manage-sensitive-data), [Inject secrets into Terraform using the Vault provider](https://developer.hashicorp.com/terraform/tutorials/secrets/secrets-vault)*

### 4h.1: la situazione dei dati sensibili in Terraform

I dati sensibili (chiavi API, password, token) vanno gestiti con attenzione. Terraform memorizza **tutti** gli attributi delle risorse **nello state file in chiaro**. Anche se contrassegni una variabile come `sensitive`, il valore **resta nello state**.

### 4h.2: contrassegnare variabili e output come sensitive

```hcl
variable "db_password" {
  type      = string
  sensitive = true
}

output "db_password" {
  value     = aws_db_instance.master.password
  sensitive = true
}
```

**Effetti** _(stepTitle)_

- I valori vengono **oscurati** nell'output della CLI (`terraform plan`, `terraform apply`).
- **Non** vengono mostrati nell'interfaccia di HCP Terraform.
- **Restano in chiaro nello state file**.

### 4h.3: valori ephemeral (Terraform 1.10+)

L'argomento `ephemeral` impedisce che un valore venga memorizzato nello state **del tutto**.

```hcl
variable "db_password" {
  type      = string
  ephemeral = true
}
```

**Restrizioni** _(stepTitle)_

- Si può usare solo in contesti specifici (configurazioni dei provider, provisioner, blocchi connection).
- Non si può referenziare negli argomenti normali delle risorse che vengono salvati nello state.

### 4h.4: argomenti write-only (Terraform 1.11+)

I provider possono definire argomenti con suffisso `_wo` che sono **di sola scrittura**. Servono a passare segreti senza memorizzarli.

```hcl
resource "aws_db_instance" "master" {
  password_wo = var.db_password
}
```

Il valore viene usato per la chiamata API ma **non viene memorizzato nello state**.

### 4h.5: riepilogo delle best practice

| Metodo | Protezione dello state | Oscuramento in CLI | Note |
|---|---|---|---|
| `sensitive = true` | No | Sì | Resta in chiaro nello state |
| `ephemeral = true` | Sì (escluso) | N/D | Contesti d'uso limitati |
| Argomenti write-only | Sì (escluso) | N/D | Specifici del provider |
| Cifratura dello state remoto | Sì (cifrato) | N/D | S3 SSE, HCP Terraform Vault |
| Provider Vault | Sì (dinamico) | Sì | Genera credenziali a breve durata |

**Raccomandazioni aggiuntive** _(stepTitle)_

- Conserva lo state in un backend remoto che supporti la cifratura lato server e i controlli di accesso (es. `S3 con SSE-KMS` e `locking DynamoDB`, `Azure Storage` con cifratura, oppure HCP Terraform). Usa ruoli IAM con privilegi minimi per il backend e abilita il versioning sui bucket per recuperare da modifiche accidentali.
- Non committare mai file di segreti in chiaro o `.tfvars` contenenti segreti nel controllo di versione. Usa variabili d'ambiente, archivi di segreti della CI o file cifrati con SOPS/age decifrati durante le run di CI.
- In CI evita di stampare variabili sensibili; usa le funzionalità di mascheramento dei segreti del fornitore della CI ed esegui `terraform plan` con i valori sensibili forniti tramite variabili sicure o un provider di state remoto.
- Quando usi Vault, preferisci credenziali dinamiche a breve durata tramite data source del provider anziché token statici a lunga durata. Ruota regolarmente i segreti e limita al minimo l'ambito dei ruoli.
- Valuta controlli aggiuntivi come la cifratura a riposo dello state, la restrizione di chi può eseguire `terraform apply` e l'uso di controlli di policy (Sentinel/OPA/Run Tasks) per impedire modifiche rischiose.

### 4h.6: il pattern del provider Vault

Il tutorial `Inject secrets into Terraform using the Vault provider` della guida descrive un workflow con **credenziali dinamiche**.

```hcl
provider "vault" {
  address = "https://vault.example.com"
}

data "vault_aws_access_credentials" "creds" {
  backend = "aws"
  role    = "terraform-role"
}

provider "aws" {
  access_key = data.vault_aws_access_credentials.creds.access_key
  secret_key = data.vault_aws_access_credentials.creds.secret_key
}
```

**Vantaggi** _(stepTitle)_

- Le credenziali hanno **breve durata** (TTL).
- Nessuna chiave a lunga durata memorizzata nello state di Terraform: i valori letti dal data source finiscono comunque nello state, ma scadono presto (per tenerli del tutto fuori dallo state servono le ephemeral resource, Terraform 1.10+).
- Vault gestisce dinamicamente il ciclo di vita degli utenti AWS IAM.

### 4h.7: laboratorio pratico: gestione dei dati sensibili (senza Vault, simulazione locale)

**Directory:** `obj4h-lab`

**File: variables.tf** _(stepTitle)_

```hcl
variable "secret_message" {
  type      = string
  sensitive = true
}
```

**File: main.tf** _(stepTitle)_

```hcl
resource "local_file" "secret" {
  filename = "${path.module}/secret.txt"
  content  = var.secret_message
}

output "file_content" {
  value     = local_file.secret.content
  sensitive = true
}

output "file_path" {
  value = local_file.secret.filename
}
```

**Passi** _(stepTitle)_

1. `terraform init`
2. `terraform plan -var="secret_message=SuperSecret123"`
  - Osserva che `secret_message` appare come `(sensitive value)` nel plan.
3. `terraform apply -var="secret_message=SuperSecret123" -auto-approve`
  - L'output `file_content` è oscurato.
4. Esegui `terraform output file_content`: il valore viene mostrato (perché la richiesta specifica aggira l'oscuramento).
5. Ispeziona `terraform.tfstate` e cerca `SuperSecret123`. È lì, in chiaro.
6. Esegui `terraform output -json`: `file_content` è esposto nell'output JSON.

**Lezione chiave:** sensitive è solo un oscuramento nell'interfaccia. La sicurezza dello state file è fondamentale.

---

Battuta leggera sull'annidamento dei moduli:

> I moduli hanno dei sentimenti, soprattutto quando sono annidati. "Mi vuoi bene, modulo padre?" chiede il figlio. Il padre risponde: "Ti referenzio profondamente, ma per favore non creare una dipendenza circolare!"

### 4h.8: Mini-quiz: gestione dei dati sensibili

1. Vero/Falso: contrassegnare una variabile come `sensitive` impedisce che il suo valore venga scritto nello state file.
2. Scelta multipla: quale funzionalità di Terraform garantisce che un valore non venga mai memorizzato nello state?
  - A. sensitive = true
  - B. ephemeral = true
  - C. sensitive sugli output
  - D. .gitignore
3. Risposta multipla: quali sono le best practice per gestire i dati sensibili in Terraform? **(Selezionane DUE)**
  - A. Conservare gli state file in backend remoti cifrati.
  - B. Committare i file .tfvars nel controllo di versione.
  - C. Usare credenziali dinamiche da Vault invece di chiavi statiche.
  - D. Scrivere i segreti direttamente nei blocchi locals.

**Risposte e brevi spiegazioni** _(stepTitle)_

1. **Falso** — `sensitive` oscura i valori solo nell'output della CLI, ma restano memorizzati in chiaro nello state file.
2. **(B)** — `ephemeral = true` impedisce del tutto che il valore venga memorizzato nello state. `sensitive` non impedisce la memorizzazione nello state, e `.gitignore` serve a ignorare file nel controllo di versione, non alla gestione dello state.
3. **(A, C)** — Conservare lo state in backend remoti cifrati e usare credenziali dinamiche da Vault sono best practice per gestire i dati sensibili. Committare i file `.tfvars` o scrivere segreti nei `locals` non è consigliato.

## Quiz su funzioni, espressioni e validazione

**Annota le tue risposte e confrontale con le soluzioni fornite. (Non sbirciare!)**

**Domanda 1 (Vero/Falso)** _(stepTitle)_

L'espressione `[for s in ["a", "b"] : upper(s)]` restituisce `["A", "B"]`.

**Domanda 2 (scelta multipla)** _(stepTitle)_

Quale funzione useresti per generare un file di template con sostituzione delle variabili?

- A. `file()`
- B. `templatefile()`
- C. `jsonencode()`
- D. `format()`

**Domanda 3 (risposta multipla)** _(stepTitle)_

Quali delle seguenti sono regole del lifecycle valide? (Selezionane TRE)

- A. `create_before_destroy`
- B. `prevent_apply`
- C. `ignore_changes`
- D. `replace_triggered_by`
- E. `timeout`

**Domanda 4 (Vero/Falso)** _(stepTitle)_

Il meta-argomento `depends_on` si può usare dentro un blocco `module` per garantire che le risorse del modulo vengano create dopo le risorse di un altro modulo.

**Domanda 5 (scelta multipla)** _(stepTitle)_

Hai una variabile mappa `var.tags = { env = "dev", owner = "team" }`. Quale espressione recupera correttamente il valore della chiave `env`?

- A. `var.tags[0]`
- B. `var.tags["env"]`
- C. `lookup(var.tags, "env")`
- D. Sia B sia C

**Domanda 6 (scelta multipla)** _(stepTitle)_

Una precondition definita nel blocco lifecycle di una `resource` viene valutata:

- A. Dopo che la risorsa è stata creata.
- B. Prima che la risorsa venga creata.
- C. Solo durante `terraform validate`.
- D. Solo quando si usa HCP Terraform.

**Domanda 7 (Vero/Falso)** _(stepTitle)_

Un'asserzione fallita in un blocco `check` impedisce a `terraform apply` di procedere.

**Domanda 8 (scelta multipla)** _(stepTitle)_

Quale funzione converte una mappa Terraform in una stringa JSON?

- A. `jsondecode()`
- B. `jsonencode()`
- C. `yamldecode()`
- D. `tostring()`

**Domanda 9 (risposta multipla)** _(stepTitle)_

Quali affermazioni sul flag `sensitive = true` sono corrette? (Selezionane DUE)

- A. Cifra il valore nello state file.
- B. Oscura il valore nell'output della CLI.
- C. Impedisce di usare il valore negli argomenti delle risorse.
- D. Si propaga a qualsiasi espressione che faccia riferimento alla variabile sensibile.

**Domanda 10 (Vero/Falso)** _(stepTitle)_

La regola del lifecycle `replace_triggered_by` può fare riferimento a resource, data source o attributi specifici di risorse.

**Domanda 11 (scelta multipla)** _(stepTitle)_

Devi attendere 30 secondi dopo aver creato un `aws_instance` prima di creare un `aws_route53_record`. Come dovresti implementarlo?

- A. Usare `depends_on` con una risorsa `time_sleep`.
- B. Aggiungere `sleep 30` allo script `user_data`.
- C. Usare la regola del lifecycle `create_before_destroy`.
- D. Terraform gestisce automaticamente i ritardi di propagazione delle API.

**Domanda 12 (scelta multipla)** _(stepTitle)_

Qual è il risultato dell'espressione `merge({a=1}, {b=2})`?

- A. `{a=1, b=2}`
- B. `[{a=1}, {b=2}]`
- C. `["a", "b"]`
- D. `[1, 2]`

**Domanda 13 (Vero/Falso)** _(stepTitle)_

Le postcondition vengono valutate dopo che una risorsa è stata creata o aggiornata, e una postcondition fallita annulla (rollback) la creazione della risorsa.

**Domanda 14 (scelta multipla)** _(stepTitle)_

Quale funzione useresti per trovare tutti gli elementi di una lista che soddisfano una condizione?

- A. `contains()`
- B. Un'espressione `for` con una clausola `if`
- C. `filter()`
- D. `lookup()`

**Domanda 15 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono argomenti validi della funzione `templatefile()`? (Selezionane DUE)

- A. Il percorso del file di template.
- B. Una lista di variabili da interpolare.
- C. Una mappa di assegnazioni delle variabili.
- D. Un flag booleano per l'escaping.

**Domanda 16 (Vero/Falso)** _(stepTitle)_

Il comando `terraform console` permette di provare espressioni e funzioni in modo interattivo sullo state corrente.

**Domanda 17 (scelta multipla)** _(stepTitle)_

Vuoi ignorare le modifiche manuali all'attributo `tags` di un'istanza AWS, così che Terraform non le annulli. Quale regola del lifecycle dovresti usare?

- A. `prevent_destroy`
- B. `create_before_destroy`
- C. `ignore_changes`
- D. `replace_triggered_by`

**Domanda 18 (risposta multipla)** _(stepTitle)_

Quali dei seguenti sono modi validi per validare le variabili di input? (Selezionane DUE)

- A. Blocco `validation` dentro il blocco `variable`.
- B. Blocco `precondition` dentro il blocco `variable`.
- C. Usare il flag `sensitive = true`.
- D. Impostare un vincolo `type` restrittivo.

**Domanda 19 (Vero/Falso)** _(stepTitle)_

Usare il provider Vault per generare credenziali AWS dinamiche elimina la necessità di memorizzare credenziali AWS a lunga durata nello state di Terraform.

**Domanda 20 (scelta multipla)** _(stepTitle)_

Cosa restituisce la funzione `cidrsubnet("10.0.0.0/16", 8, 2)`?

- A. `10.0.0.2/24`
- B. `10.0.2.0/24`
- C. `10.2.0.0/16`
- D. `10.0.0.2/32`

### Risposte

**Risposte e brevi spiegazioni** _(stepTitle)_

1. Vero — L'espressione `for` itera sulla lista e applica la funzione `upper()` a ogni elemento, ottenendo `["A", "B"]`.
2. `templatefile()` (B) è la funzione corretta per generare un file di template con sostituzione delle variabili.
3. `create_before_destroy`, `ignore_changes` e `replace_triggered_by` (A, C, D) sono regole del lifecycle valide. `prevent_apply` e `timeout` non lo sono.
4. Vero — `depends_on` si può usare in un blocco `module` per garantire che le risorse del modulo vengano create dopo le risorse di un altro modulo.
5. Sia B sia C (D) — Puoi accedere al valore con `var.tags["env"]` oppure con `lookup(var.tags, "env")`.
6. Prima che la risorsa venga creata (B) — Le precondition vengono valutate prima di creare o aggiornare una risorsa.
7. Falso — Un'asserzione fallita in un blocco `check` produce un warning ma non impedisce a `terraform apply` di procedere.
8. `jsonencode()` (B) converte una mappa Terraform in una stringa JSON.
9. Oscura il valore nell'output della CLI e si propaga a qualsiasi espressione che faccia riferimento alla variabile sensibile (B, D). Il flag `sensitive` non cifra il valore nello state file e non ne impedisce l'uso negli argomenti delle risorse.
10. Vero — La regola del lifecycle `replace_triggered_by` può fare riferimento a resource, data source o attributi specifici di risorse per attivare la sostituzione quando cambiano.
11. Usare `depends_on` con una risorsa `time_sleep` (A) — È un pattern comune per gestire i ritardi di propagazione delle API.
12. `{a=1, b=2}` (A) — La funzione `merge()` combina le due mappe in una.
13. Falso — Le postcondition vengono valutate dopo che una risorsa è stata creata o aggiornata, ma Terraform non esegue alcun rollback: se una postcondition fallisce, la risorsa resta creata e registrata nello state, la run si interrompe con un errore e le risorse che ne dipendono non vengono elaborate.
14. Un'espressione `for` con una clausola `if` (B) — Terraform non ha una funzione `filter()` integrata, ma puoi ottenere il filtraggio con un'espressione `for`.
15. Il percorso del file di template e una mappa di assegnazioni delle variabili (A, C) — Sono gli argomenti validi di `templatefile()`.
16. Vero — Il comando `terraform console` permette di provare espressioni e funzioni in modo interattivo sullo state corrente.
17. `ignore_changes` (C) — Questa regola del lifecycle dice a Terraform di ignorare le modifiche all'attributo indicato, consentendo aggiornamenti manuali senza che Terraform li annulli.
18. Blocco `validation` dentro il blocco `variable` e vincolo `type` restrittivo (A, D) — Sono modi validi per validare le variabili di input. I blocchi `precondition` non si usano dentro i blocchi `variable`, e `sensitive = true` serve all'oscuramento, non alla validazione.
19. Vero — Usare il provider Vault per generare credenziali AWS dinamiche elimina la necessità di memorizzare credenziali AWS a lunga durata nello state di Terraform, perché le credenziali vengono generate dinamicamente e hanno un TTL breve.
20. `10.0.2.0/24` (B) — La funzione `cidrsubnet()` crea una subnet all'interno di un blocco CIDR dato, e il terzo argomento specifica il numero della subnet.

---

Wow, quante informazioni! Ora dovresti avere una comprensione solida del linguaggio di configurazione di Terraform, inclusi espressioni, funzioni, dipendenze, validazione e gestione dei dati sensibili. Queste conoscenze saranno fondamentali per superare l'esame Terraform Associate e per scrivere configurazioni Terraform efficaci in progetti reali.

Passiamo all'Obiettivo 5: moduli Terraform, dove esploreremo il concetto di modulo, come crearli e usarli e le best practice per il loro sviluppo.
