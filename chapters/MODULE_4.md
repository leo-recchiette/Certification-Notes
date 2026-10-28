# Modulo 4 — Configurazione Terraform

_Resource e data block, riferimenti, variabili e output, tipi complessi, espressioni e funzioni, dipendenze, validazione con custom condition e gestione dei dati sensibili._

---

## 4.1 — Blocchi resource e data

### 4.1.1 — Il blocco resource

Un blocco `resource` dichiara un oggetto di infrastruttura che Terraform **crea e gestisce**. Ha un tipo (definito dal provider), un nome locale e un corpo con gli argomenti.

```
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  tags = {
    Name = "web"
  }
}
```

- L'**indirizzo** della risorsa è `TIPO.NOME` (qui `aws_instance.web`).
- **Argomenti**: valori che si impostano. **Attributi**: valori letti (anche quelli noti solo dopo la creazione, es. `id`).
- Il tipo e il nome devono essere unici nel modulo.

### 4.1.2 — Il blocco data

Un blocco `data` definisce un **data source**: permette di **leggere** informazioni su oggetti esistenti (non gestiti da questa configurazione) o calcolate dal provider.

```
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}
```

| **Aspetto** | **resource** | **data** |
|---|---|---|
| **Scopo** | Crea, aggiorna, distrugge | Solo lettura |
| **Riferimento** | `aws_instance.web.id` | `data.aws_ami.ubuntu.id` |
| **Nel piano** | `+ create` | Letto durante plan/apply (`<=`) |
| **Effetto su destroy** | Risorsa eliminata | Nessun oggetto eliminato |

**Quando viene letto un data source** _(stepTitle)_

- Di norma Terraform legge i data source in fase di **plan** (durante il refresh), così i valori reali sono già disponibili e il diff è preciso.
- La lettura viene **rinviata all'apply** quando un argomento dipende da un valore non ancora noto: un attributo di una risorsa che cambia in questo piano, un valore calcolato (*known after apply*) o una custom condition che dipende da una risorsa in modifica. In quel caso il piano lo indica e gli attributi del data source risultano *computed*.
- Il blocco `data` supporta `count`, `for_each`, `depends_on`, `provider` e `lifecycle` (solo `precondition` e `postcondition`).
- Alcuni data source sono **solo locali**: calcolano dati che esistono solo durante l'esecuzione e vengono ricalcolati a ogni plan.

### 4.1.3 — Meta-argomenti

Valgono per tutte le risorse (e, in parte, per data source e moduli):

| **Meta-argomento** | **Funzione** |
|---|---|
| `count` | Crea N istanze (indice `count.index`) |
| `for_each` | Crea un'istanza per ogni elemento di una mappa o set (`each.key`, `each.value`) |
| `depends_on` | Dipendenza esplicita |
| `provider` | Seleziona un provider con alias |
| `lifecycle` | Personalizza il ciclo di vita |

```
resource "azurerm_resource_group" "rg" {
  for_each = toset(["dev", "test"])
  name     = "rg-${each.key}"
  location = "westeurope"
}
```

> **count vs for_each**: con `count` le istanze sono indicizzate da numeri (`aws_instance.web[0]`); rimuovere un elemento in mezzo sposta gli indici e può causare ricreazioni. Con `for_each` sono indicizzate dalla chiave (`rg["dev"]`), più stabile. Non si possono usare entrambi nella stessa risorsa.
_(infoBox)_

- `count` si usa in blocchi `resource`, `module` ed `ephemeral`; `for_each` anche nei blocchi `data`.
- `for_each` accetta solo una **mappa** o un **set di stringhe** (una lista va convertita con `toset()`), e le chiavi devono essere **note in fase di plan**.

### 4.1.4 — Provisioner (ultima risorsa)

I provisioner eseguono azioni sulla macchina locale o remota dopo la creazione di una risorsa (o alla sua distruzione). HashiCorp li considera **un'ultima risorsa**: meglio usare strumenti di configuration management, `user_data`/cloud-init o immagini preparate.

| **Provisioner** | **Funzione** |
|---|---|
| `local-exec` | Esegue un comando sulla macchina dove gira Terraform |
| `remote-exec` | Esegue comandi sulla risorsa remota, tramite il blocco `connection` (SSH o WinRM) |
| `file` | Copia file o directory sulla risorsa remota |

```
resource "aws_instance" "web" {
  # ...
  provisioner "local-exec" {
    command = "echo ${self.private_ip} >> ips.txt"
  }
}
```

- Nel blocco `connection` e nei provisioner si usa `self` per riferirsi alla risorsa che li contiene (citarla per nome creerebbe un ciclo).
- `when = destroy` crea un provisioner eseguito alla distruzione.
- `on_failure = continue` ignora l'errore; di default (`fail`) un provisioner fallito in creazione rende la risorsa **tainted**.

---

## 4.2 — Riferimenti agli attributi e dipendenze tra risorse

### 4.2.1 — Named values

| **Espressione** | **Significato** |
|---|---|
| `TIPO.NOME.ATTRIBUTO` | Attributo di una risorsa |
| `data.TIPO.NOME.ATTRIBUTO` | Attributo di un data source |
| `var.NOME` | Input variable |
| `local.NOME` | Local value |
| `module.NOME.OUTPUT` | Output di un modulo |
| `path.module`, `path.root`, `path.cwd` | Percorsi del filesystem |
| `terraform.workspace` | Nome del workspace corrente |
| `each.key`, `each.value`, `count.index` | Valori di iterazione |
| `self` | Riferimento a sé stessi (provisioner, postcondition) |

- `count.index`, `each.*` e `self` sono **block-local values**: valgono solo dentro il blocco che li definisce.
- **Values not yet known**: gli attributi calcolati dal provider (es. un `id`) non sono noti fino all'apply. Nel piano compaiono come `(known after apply)`, e tutto ciò che li usa è a sua volta sconosciuto fino all'apply.
- **Sensitive resource attributes**: se il provider marca un attributo come sensibile, Terraform lo nasconde nell'output, così come ogni espressione che lo usa.

### 4.2.2 — Resource addressing

Gli indirizzi di risorsa servono anche a comandi CLI (`-target`, `terraform state`, `import`):

- `aws_instance.web` — risorsa semplice
- `aws_instance.web[0]` — con count
- `azurerm_resource_group.rg["dev"]` — con for_each
- `module.network.aws_vpc.main` — dentro un modulo
- `module.app[1].aws_instance.web["a"]` — modulo con count e risorsa con for_each
- `data.aws_ami.ubuntu` — data source

La sintassi generale è `[module path][resource spec]`: il module path è una sequenza `module.NOME[INDICE]`, la resource spec è `TIPO.NOME[INDICE]`. Nel terminale le chiavi stringa vanno messe tra apici, ad esempio `'aws_instance.web["a"]'`.

### 4.2.3 — Dipendenze implicite ed esplicite

- **Implicite**: nascono quando una risorsa usa un attributo di un'altra (`subnet_id = aws_subnet.a.id`). Terraform ordina da solo.
- **Esplicite**: `depends_on = [aws_iam_role_policy.x]` per dipendenze non visibili nei riferimenti (es. effetti collaterali).

> **Usa `depends_on` il meno possibile**: forza Terraform a essere più conservativo e può rendere i piani meno precisi. Preferisci le dipendenze implicite. I dettagli sono in 4.7.
_(infoBox)_

### 4.2.4 — Resource targeting

L'opzione `-target=ADDR` limita plan/apply/destroy a una risorsa e alle sue dipendenze.

```
terraform plan -target=aws_instance.web
terraform apply -target=module.network
```

- Utile in **casi eccezionali**: recupero da errori, dipendenze bloccate, modifiche urgenti.
- Non è pensato per l'uso quotidiano: lo state può risultare incoerente con la configurazione completa; Terraform stampa un warning.
- Dopo un'operazione mirata conviene eseguire un `plan` completo.

---

## 4.3 — Variabili e output

### 4.3.1 — Input variable

![Figura 6](img/terraform-variables-architecture-diagram.png) _(dimensioni: 663×320 px)_

*Figura 6 — Le input variable parametrizzano la configurazione senza modificarne il codice. Fonte: HashiCorp Developer.* _(caption)_

```
variable "region" {
  type        = string
  description = "Regione di deploy"
  default     = "westeurope"
}

variable "db_password" {
  type      = string
  sensitive = true
}
```

Argomenti del blocco: `type`, `description`, `default`, `validation`, `sensitive`, `nullable`, `ephemeral`.

| **Argomento** | **Note** |
|---|---|
| `default` | Deve essere un **valore letterale** (non può riferirsi ad altri oggetti) e convertibile nel `type` |
| `nullable` | Default `true`: il chiamante può passare `null`, che sovrascrive anche il default. Con `false` la variabile non è mai `null`: se il chiamante passa `null`, si usa il default |
| `sensitive` | Nasconde il valore nell'output CLI, ma il valore **resta nello state** |
| `ephemeral` | (Terraform 1.10+) Il valore non viene scritto né nello state né nel piano: vedi 4.9 |

**Ordine di precedenza (dal più basso al più alto)** _(stepTitle)_

0. `default` del blocco `variable` (livello più basso)
1. Variabili d'ambiente `TF_VAR_nome`
2. `terraform.tfvars`
3. `terraform.tfvars.json`
4. `*.auto.tfvars` / `*.auto.tfvars.json` (ordine alfabetico)
5. Opzioni `-var` e `-var-file` da riga di comando (in ordine di apparizione) e variabili di HCP Terraform

Se una variabile non ha valore e non ha `default`, Terraform lo chiede in modo interattivo. I file `.tfvars` con nomi diversi non vengono caricati automaticamente: si passano con `-var-file`.

**Variabili non dichiarate** _(stepTitle)_

- Una `TF_VAR_` senza blocco `variable` corrispondente viene **ignorata**.
- In un file `.tfvars` genera un **warning** (utile per trovare errori di battitura).
- Con `-var` da riga di comando genera un **errore**.

Per i tipi complessi da riga di comando o da variabile d'ambiente si usa la sintassi HCL/JSON, ad esempio `-var='zones=["a","b"]'`. Per leggibilità sono preferibili i file `.tfvars`.

### 4.3.2 — Local values

```
locals {
  common_tags = {
    env   = var.env
    owner = "platform"
  }
  name_prefix = "${var.project}-${var.env}"
}
```

Si usano con `local.nome`. Servono a evitare ripetizioni; non sono configurabili dall'esterno.

### 4.3.3 — Output

```
output "vm_ip" {
  value       = azurerm_public_ip.pip.ip_address
  description = "IP pubblico della VM"
  sensitive   = false
}
```

- Gli output del **root module** sono stampati dopo `apply` e consultabili con `terraform output`; in HCP Terraform compaiono nell'interfaccia del workspace.
- Sono l'**interfaccia** di un modulo verso il chiamante (`module.NOME.OUTPUT`).
- `sensitive = true` ne nasconde il valore a video (ma resta nello state).
- Sono accessibili da altre configurazioni tramite `terraform_remote_state` (solo gli output del root module).
- Argomenti del blocco: `value`, `description`, `sensitive`, `ephemeral`, `depends_on`, `precondition`.
- `ephemeral = true` (1.10+) è ammesso **solo negli output dei moduli figli**, non nel root module.
- `precondition` verifica il valore prima di esporlo o di salvarlo nello state.

| **Comando** | **Risultato** |
|---|---|
| `terraform output` | Tutti gli output (i sensibili come `<sensitive>`) |
| `terraform output NOME` | Un singolo output |
| `terraform output -raw NOME` | Il valore grezzo di una stringa, utile negli script |
| `terraform output -json` | Tutti gli output in JSON, leggibile da macchina |

> **Attenzione**: con `-json` e `-raw` gli output sensibili vengono mostrati **in chiaro**.
_(infoBox)_

---

## 4.4 — Tipi e tipi complessi

### 4.4.1 — Tipi primitivi e complessi

| **Categoria** | **Tipi** |
|---|---|
| **Primitivi** | `string`, `number`, `bool` |
| **Collezioni** (elementi dello stesso tipo) | `list(tipo)`, `set(tipo)`, `map(tipo)` |
| **Strutturati** (elementi di tipo diverso) | `object({...})`, `tuple([...])` |
| **Speciale** | `any` (deduce il tipo) |

```
variable "servers" {
  type = map(object({
    size = string
    disk = number
    tags = optional(map(string), {})
  }))
}
```

- **list**: ordinata, accesso per indice, può avere duplicati.
- **set**: non ordinata, valori unici.
- **map**: chiavi stringa → valori dello stesso tipo.
- **object**: attributi con nomi e tipi propri; `optional(tipo)` rende un attributo facoltativo (vale `null` se omesso), `optional(tipo, default)` gli assegna un valore di default.
- **tuple**: sequenza ordinata di tipi eterogenei.
- **any**: segnaposto, Terraform deduce un unico tipo concreto dal valore passato. `list(any)` richiede comunque elementi tutti dello stesso tipo.

**Conversioni automatiche** _(stepTitle)_

- Primitivi: `number` e `bool` si convertono in `string` e viceversa quando il contenuto lo consente (`"5"` → `5`, `"true"` → `true`).
- Una `tuple` si converte in `list` e un `object` in `map` se gli elementi sono compatibili.
- Una lista convertita in `set` perde ordine e duplicati.
- Un `object` passato a un tipo `object` con meno attributi perde quelli in eccesso.

---

## 4.5 — Espressioni e funzioni

### 4.5.1 — Espressioni dinamiche

**Condizionale (ternario)** _(stepTitle)_

```
instance_type = var.env == "prod" ? "m5.large" : "t3.micro"
```

Uso tipico con `count` per creare una risorsa solo se serve:

```
resource "aws_vpn_gateway" "vpn" {
  count  = var.enable_vpn ? 1 : 0
  vpc_id = aws_vpc.main.id
}
```

**Espressioni for** _(stepTitle)_

```
upper_names = [for n in var.names : upper(n)]
by_name     = { for s in var.servers : s.name => s.ip }
```

**Splat** _(stepTitle)_

```
ids = aws_instance.web[*].id
```

**Blocchi dynamic** _(stepTitle)_

```
resource "aws_security_group" "sg" {
  name = "web"

  dynamic "ingress" {
    for_each = var.ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}
```

**Interpolazione e heredoc** _(stepTitle)_

```
name = "${var.project}-${var.env}"

user_data = <<-EOT
  #!/bin/bash
  echo "Ambiente: ${var.env}"
  %{ if var.debug }echo "debug attivo"%{ endif }
EOT
```

- `${ ... }` inserisce il valore di un'espressione; `%{ if }` e `%{ for }` sono direttive di template.
- Con `<<-EOT` (heredoc con trattino) l'indentazione iniziale viene rimossa.

### 4.5.2 — Funzioni built-in

Terraform non supporta funzioni definite dall'utente nel linguaggio: si usano quelle integrate, che si possono provare in `terraform console`. Dalla versione 1.8 i provider possono esporre funzioni proprie (*provider-defined functions*), richiamate con `provider::NOME_PROVIDER::FUNZIONE(...)`.

**Esempi dai tutorial** _(stepTitle)_

- `templatefile("user_data.tftpl", { port = 8080 })`: genera uno script a partire da un template.
- `lookup(var.amis, var.region)`: legge un valore da una mappa (con terzo argomento come default).
- `file("~/.ssh/id_rsa.pub")`: legge il contenuto di un file.

| **Categoria** | **Esempi** |
|---|---|
| **Stringhe** | `upper`, `lower`, `format`, `join`, `split`, `replace`, `trim`, `substr` |
| **Numeriche** | `min`, `max`, `ceil`, `floor`, `abs` |
| **Collezioni** | `length`, `concat`, `merge`, `lookup`, `keys`, `values`, `element`, `flatten`, `distinct`, `zipmap`, `toset`, `tolist` |
| **Encoding** | `jsonencode`, `jsondecode`, `base64encode`, `yamlencode` |
| **Filesystem** | `file`, `templatefile`, `fileexists`, `abspath` |
| **Rete** | `cidrsubnet`, `cidrhost`, `cidrnetmask` |
| **Conversione tipi** | `tostring`, `tonumber`, `tobool`, `try`, `can` |
| **Data/ora** | `timestamp`, `formatdate`, `timeadd` |
| **Hash e crypto** | `md5`, `sha256`, `uuid`, `bcrypt` |

---

## 4.6 — Lifecycle delle risorse

### 4.6.1 — Il blocco lifecycle

Durante un apply Terraform crea le risorse presenti nella configurazione ma non nello state, distrugge quelle presenti nello state ma non nella configurazione, aggiorna in place quelle con argomenti cambiati, e distrugge e ricrea quelle che l'API non consente di aggiornare in place. Il blocco `lifecycle` personalizza questo comportamento.

| **Argomento** | **Effetto** |
|---|---|
| `create_before_destroy = true` | Crea la nuova risorsa prima di distruggere la vecchia (riduce il downtime) |
| `prevent_destroy = true` | Fa fallire qualsiasi piano che distruggerebbe la risorsa |
| `ignore_changes = [attr, ...]` | Ignora le modifiche agli attributi indicati negli aggiornamenti |
| `replace_triggered_by = [...]` | Sostituisce la risorsa quando cambia un'altra risorsa o un suo attributo |
| `precondition` / `postcondition` | Controlli prima/dopo la creazione (vedi 4.8) |
| `destroy = false` | Solo nel blocco `removed`: toglie la risorsa dallo state senza distruggerla (vedi Modulo 6) |

```
resource "aws_instance" "web" {
  # ...
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [tags["LastScanned"]]
  }
}
```

> **Solo valori letterali**: le regole di `lifecycle` influenzano la costruzione del grafo, che avviene troppo presto per valutare espressioni arbitrarie. Si possono usare solo valori letterali (non variabili).
_(infoBox)_

### 4.6.2 — create_before_destroy

Di default, quando un argomento non si può aggiornare in place, Terraform **prima distrugge** l'oggetto esistente e **poi crea** il sostituto. Con `create_before_destroy = true` l'ordine si inverte: crea il nuovo oggetto, aggiorna i riferimenti e solo alla fine distrugge il vecchio.

- È **opt-in** perché molti oggetti hanno vincoli di nome univoco: il nuovo e il vecchio devono poter coesistere. Si usano argomenti come `name_prefix` o un suffisso casuale.
- **Propagazione alle dipendenze**: se A ha `create_before_destroy` e dipende da B, Terraform lo attiva implicitamente anche su B e lo registra nello state. Non si può forzarlo a `false` su B, perché si creerebbe un ciclo nel grafo.
- Se la risorsa ha un provisioner che gira alla distruzione, con `create_before_destroy` quel provisioner **non viene eseguito**.

**Esempio dal tutorial "Upgrade RDS major version"** _(stepTitle)_

Il DB referenzia il parameter group (dipendenza implicita). Per passare da PostgreSQL 15 a 16 si cambia la `family` del parameter group, e questo ne forza la sostituzione. Senza `create_before_destroy`, Terraform proverebbe a distruggere un parameter group ancora associato al DB in esecuzione, e fallirebbe. Con la regola attiva crea il nuovo gruppo, aggiorna il DB e solo dopo elimina il vecchio.

```
resource "aws_db_parameter_group" "education" {
  name_prefix = "${random_pet.name.id}-education"
  family      = "postgres16"

  lifecycle {
    create_before_destroy = true
  }
}
```

### 4.6.3 — prevent_destroy, ignore_changes, replace_triggered_by

**prevent_destroy** _(stepTitle)_

- Rifiuta con errore ogni piano che distruggerebbe l'oggetto (anche una sostituzione forzata), e blocca `terraform destroy`.
- **Non protegge** se si rimuove o si commenta il blocco `resource`: in quel caso l'argomento sparisce con il blocco e la risorsa viene distrutta.
- È utile per oggetti costosi da ricreare, come i database, ma va usato con parsimonia.

**ignore_changes** _(stepTitle)_

- Gli attributi indicati sono considerati alla **creazione**, ma ignorati negli **aggiornamenti**: utile quando un processo esterno li modifica (es. tag gestiti da un agente).
- Accetta indici come `tags["Name"]` o `list[0]`; con `ignore_changes = all` Terraform crea e distrugge l'oggetto ma non propone mai aggiornamenti.
- Vale solo per gli attributi del tipo di risorsa, non per i meta-argomenti.

**replace_triggered_by** _(stepTitle)_

- Accetta solo riferimenti a **managed resource**, istanze o loro attributi. Un riferimento a una risorsa o istanza scatta su qualsiasi update o replace pianificato; un riferimento a un attributo scatta quando quel valore cambia.
- Con `count`/`for_each` si può usare `count.index` o `each.key` per riferirsi all'istanza corrispondente.
- Variabili e local non hanno azioni pianificate proprie: per usarli come trigger si passa da una risorsa `terraform_data`.

```
resource "terraform_data" "revision" {
  input = var.revision
}

resource "aws_instance" "web" {
  # ...
  lifecycle {
    replace_triggered_by = [terraform_data.revision]
  }
}
```

---

## 4.7 — Definire le dipendenze nella configurazione

### 4.7.1 — Dipendenze implicite

Ogni volta che un'espressione fa riferimento a un'altra risorsa (`aws_eip.ip.instance = aws_instance.web.id`), Terraform crea una dipendenza **implicita**: prima crea la risorsa referenziata, poi quella che la usa. In distruzione l'ordine si inverte. È il meccanismo da preferire, perché Terraform sa esattamente quale valore deriva da cosa ed evita modifiche inutili.

### 4.7.2 — Dipendenze esplicite con depends_on

`depends_on` serve per le dipendenze **nascoste**, cioè quando una risorsa dipende dal *comportamento* di un'altra senza usarne i dati.

```
resource "aws_iam_role_policy" "s3_access" {
  # policy che consente all'istanza di leggere da S3
}

resource "aws_instance" "app" {
  # il software sull'istanza usa S3 all'avvio,
  # ma la configurazione non referenzia la policy
  depends_on = [aws_iam_role_policy.s3_access]
}
```

- Accetta una **lista di riferimenti** a risorse o moduli nello stesso modulo chiamante, **non espressioni arbitrarie**: il valore deve essere noto prima che Terraform conosca le relazioni.
- Terraform completa **tutte** le azioni sull'oggetto da cui si dipende, letture comprese, prima di agire sull'oggetto che dichiara la dipendenza.
- Si può usare nei blocchi `resource`, `data`, `ephemeral`, `module` e `output`, e nei data source annidati in un `check`.
- Su un intero **modulo** vale per tutte le sue risorse e data source.
- **Va usato come ultima risorsa**: rende i piani più conservativi, con più valori `(known after apply)` e talvolta più sostituzioni del necessario, soprattutto sui moduli.
- In un `check`, un `depends_on` sul data source annidato (es. verso il load balancer) evita che il controllo fallisca al primo run, quando l'infrastruttura non esiste ancora.

### 4.7.3 — Riepilogo

| **Strumento** | **Quando** |
|---|---|
| Riferimento ad attributo (implicita) | Sempre, quando una risorsa usa dati di un'altra |
| `depends_on` (esplicita) | Dipendenza reale ma non visibile nei dati |
| `create_before_destroy` | Una sostituzione deve creare il nuovo oggetto prima di eliminare il vecchio |

- Le dipendenze formano il **grafo**; Terraform non ammette cicli (errore *Cycle*). Un caso tipico sono due security group che si citano a vicenda nelle regole: si risolve spostando le regole in risorse separate (`aws_security_group_rule`).

---

## 4.8 — Validazione con custom condition e check

| **Tipo di validazione** | **Da quale versione** | **Scopo** |
|---|---|---|
| **Input variable validation** | 0.13 | Verificare formato e intervalli dei parametri |
| **Precondition** | 1.2 | Verificare le **assunzioni** su risorse, data source e output prima di crearli |
| **Postcondition** | 1.2 | Verificare le **garanzie** su risorse e data source dopo la creazione o la lettura |
| **Check** | 1.5 | Verificare il funzionamento dell'infrastruttura **senza bloccare** l'operazione |

### 4.8.1 — Validation delle variabili

![Figura 7](img/validation-order-of-operations-dark.jpg) _(dimensioni: 1312×738 px)_

*Figura 7 — Ordine di valutazione dei controlli: validation delle variabili, precondition, postcondition e check. Fonte: HashiCorp Developer.* _(caption)_

```
variable "env" {
  type = string

  validation {
    condition     = contains(["dev", "test", "prod"], var.env)
    error_message = "env deve essere dev, test o prod."
  }
}
```

- `condition` deve restituire un booleano; si usano spesso funzioni come `contains`, `length`, `regex` insieme a `can()`.
- Se la condizione è falsa, Terraform si ferma con errore e mostra `error_message`, **prima di completare il piano**.
- `error_message` è obbligatorio e accetta qualsiasi espressione che produca una stringa (letterali, heredoc, template). Conviene scriverlo come frasi complete, nello stile dei messaggi di Terraform.
- Una variabile può avere più blocchi `validation`.

### 4.8.2 — Precondition e postcondition

Dentro `lifecycle` dei blocchi `resource`, `data` ed `ephemeral`; in un `output` è ammessa solo la `precondition`.

```
resource "aws_instance" "web" {
  # ...
  lifecycle {
    precondition {
      condition     = data.aws_ami.ubuntu.architecture == "x86_64"
      error_message = "L'AMI deve essere x86_64."
    }
    postcondition {
      condition     = self.public_dns != ""
      error_message = "L'istanza deve avere un DNS pubblico."
    }
  }
}
```

- **precondition**: valutata durante il **plan**, dopo `count`/`for_each` (quindi `each.key` e `count.index` sono disponibili) e prima degli argomenti della risorsa. Ha la precedenza sugli errori che il provider darebbe per argomenti sbagliati.
- **postcondition**: valutata **dopo** il plan e l'apply della risorsa, o dopo la lettura del data source; può riferirsi a `self`. Se fallisce, blocca le risorse a valle che dipendono da quella, ma **non annulla** ciò che è già stato fatto.
- In entrambi i casi un fallimento produce un **errore** e ferma l'operazione.

**Precondition o postcondition?** _(stepTitle)_

- **Precondition** per le **assunzioni** da verificare prima di creare l'oggetto (es. "l'AMI scelta deve essere x86_64"). Aiuta chi manterrà il codice a capire quali valori sono ammessi.
- **Postcondition** per le **garanzie** che l'oggetto creato deve rispettare (es. "l'istanza deve avere un DNS privato"). Aiuta a capire quali comportamenti vanno preservati.
- Se una risorsa ha molte dipendenze, può essere più chiaro mettere una sola postcondition su di essa anziché una precondition su ciascuna dipendenza.
- Non mettere condizioni sia su un blocco `resource` sia su un blocco `data` che rappresentano lo stesso oggetto: Terraform potrebbe ignorare modifiche al data source.

### 4.8.3 — Check block

Il blocco `check` valida lo stato dell'infrastruttura **senza bloccare** il workflow: un fallimento genera solo un **warning**. Può contenere un data source con ambito locale (`scoped data source`).

```
check "sito_raggiungibile" {
  data "http" "home" {
    url = "https://${aws_lb.main.dns_name}"
  }

  assert {
    condition     = data.http.home.status_code == 200
    error_message = "Il sito non risponde con 200."
  }
}
```

- Il `check` viene eseguito come **ultimo passo** di plan e apply, dopo le postcondition. Se un `assert` fallisce, Terraform mostra un **warning** e continua.
- Anche l'eventuale errore del data source annidato produce solo un warning.
- Un check può validare risorse, data source, variabili e output, oppure il comportamento complessivo dell'infrastruttura.
- In HCP Terraform i check sono la base della **continuous validation** (Modulo 8).

### 4.8.4 — Ordine di validazione

1. **Input variable validation**: subito, prima di generare il piano.
2. **Precondition**: dopo aver generato il piano, prima di creare la risorsa, il data source o l'output.
3. **Postcondition**: dopo il plan e l'apply della risorsa (o la lettura del data source).
4. **Check**: alla fine di plan e apply, e a ogni health assessment in HCP Terraform.

Se il valore da controllare è noto solo dopo l'apply (es. l'ID del volume root assegnato all'avvio di un'istanza), Terraform rimanda la validazione alla fase di apply.

| **Costrutto** | **Dove** | **Quando** | **Se fallisce** |
|---|---|---|---|
| `validation` | variable | Prima del piano | Errore |
| `precondition` | resource, data, ephemeral, output | Durante il plan, prima di creare | Errore |
| `postcondition` | resource, data, ephemeral | Dopo plan/apply o lettura | Errore (blocca le risorse a valle) |
| `check` | Top-level | Fine di plan/apply e health assessment | Solo warning |

---

## 4.9 — Gestione dei dati sensibili e Vault

### 4.9.1 — Nascondere o non salvare

State e piani contengono gli attributi delle risorse, quindi anche password e token. Con il backend locale lo state è un file in chiaro. La prima scelta è decidere se un valore va solo **nascosto** nell'output o se **non deve essere salvato** affatto.

| **Strumento** | **Versione** | **Nasconde in CLI/UI** | **Escluso da state e piano** |
|---|---|---|---|
| `sensitive = true` su variable/output | 0.15+ | Sì | **No** |
| `ephemeral = true` su variable e output di moduli figli | 1.10+ | No (si può aggiungere `sensitive`) | Sì |
| Blocco `ephemeral` (ephemeral resource) | 1.10+ | — | Sì |
| **Write-only argument** di una managed resource | 1.11+ | — | Sì |

### 4.9.2 — sensitive

- `sensitive = true` su variabile/output: Terraform maschera il valore in `plan`/`apply` (mostra `(sensitive value)`) e nell'interfaccia di HCP Terraform.
- Ogni espressione che usa un valore sensibile diventa a sua volta sensibile.
- **I valori sensibili sono comunque salvati in chiaro nello state e nei piani salvati**: chi accede a quei file li vede.
- `terraform output -json` e `-raw` li mostrano in chiaro.
- Le funzioni `sensitive()` e `nonsensitive()` marcano o smarcano un valore.

### 4.9.3 — Variabili e output ephemeral

```
variable "api_token" {
  type      = string
  sensitive = true
  ephemeral = true
}

provider "example" {
  token = var.api_token
}
```

- Il valore è disponibile durante l'esecuzione ma **non viene mai scritto** nello state o nel piano.
- Combinando `ephemeral` e `sensitive` il valore non viene salvato ed è anche oscurato a video.
- Un `output` può essere ephemeral solo in un **modulo figlio**: serve a passare credenziali o token tra moduli senza persisterli. Nel root module non è ammesso.

### 4.9.4 — Ephemeral resources (blocco ephemeral)

```
ephemeral "random_password" "db_password" {
  length = 16
}
```

- Una **ephemeral resource** esiste solo durante l'operazione corrente e non compare in state o piani. I tipi disponibili li definisce ogni provider.
- Ciclo di vita: Terraform la **apre** quando serve il risultato, chiede al provider di **rinnovarla** se deve durare oltre la scadenza, e la **chiude** quando i provider che la usano hanno finito. Con un segreto di Vault, ad esempio, si ottiene un lease, lo si rinnova e alla chiusura lo si revoca.
- È un nodo del grafo come le altre risorse. Se un suo argomento dipende da un valore noto solo più tardi, Terraform ne rinvia l'apertura all'apply.
- Supporta `count`, `for_each`, `depends_on`, `provider` e `lifecycle` (precondition/postcondition).

**Dove si possono usare i valori ephemeral** _(stepTitle)_

- Nei `locals`.
- In variabili con `ephemeral = true` e in output ephemeral di moduli figli.
- In un altro blocco `ephemeral`.
- In un **write-only argument** di una managed resource.
- Nella configurazione dei provider (blocco `provider`).
- Nei blocchi `provisioner` e `connection`.

Altrove Terraform dà errore in fase di plan. La funzione `ephemeralasnull(valore)` (1.10+) restituisce il valore con ogni parte ephemeral sostituita da `null`, utile per esporre la parte non sensibile di un oggetto.

### 4.9.5 — Write-only arguments

I **write-only argument** sono argomenti di una managed resource che il provider usa durante l'operazione e che Terraform poi scarta, senza salvarli in state o piano. Il nome finisce di solito in `_wo` e c'è un argomento di versione `_wo_version`.

```
locals {
  db_password_version = 1   # incrementare per cambiare la password
}

resource "aws_db_instance" "education" {
  # ...
  password_wo         = ephemeral.random_password.db_password.result
  password_wo_version = local.db_password_version
}

resource "aws_ssm_parameter" "secret" {
  name             = "/education/database/password/master"
  type             = "SecureString"
  value_wo         = ephemeral.random_password.db_password.result
  value_wo_version = local.db_password_version
}
```

- Terraform non conserva il valore, quindi **non può accorgersi** che è cambiato e non può mostrarne il diff: lo invia al provider a ogni operazione.
- L'argomento `_wo_version` è salvato nello state: **incrementandolo** si comunica al provider che deve usare il nuovo valore (es. per ruotare la password).
- Accetta valori ephemeral e non ephemeral, ma lo scopo è passargli valori ephemeral.
- Poiché Terraform non salva il valore generato, conviene **memorizzarlo altrove**: nell'esempio la password finisce in AWS SSM tramite `value_wo`. Il tutorial usa lo stesso local per le due versioni, così DB e SSM restano allineati.

### 4.9.6 — Best practice e sicurezza dello state

- Non committare mai segreti né lo state in Git (`*.tfvars` sensibili e `*.tfstate` in `.gitignore`).
- Passare i segreti tramite variabili d'ambiente (`TF_VAR_...`), un **secret manager** o valori ephemeral.
- Usare credenziali **di breve durata** (dynamic credentials, OIDC).

**Proteggere lo state** _(stepTitle)_

- Salvarlo in un backend **remoto**: Terraform lo tiene solo in memoria mentre lo usa.
- **Cifrarlo a riposo**: HCP Terraform lo cifra (anche con chiavi proprie) e usa TLS in transito; il backend S3 cifra con l'opzione `encrypt`; GCS supporta chiavi fornite o gestite dal cliente.
- Limitare chi può accedervi con **controlli di accesso**.
- Tracciare gli accessi con **audit log**.

### 4.9.7 — Integrazione con HashiCorp Vault

Il **provider Vault** permette a Terraform di leggere segreti da Vault tramite data source (es. `vault_kv_secret_v2`) o di generare **credenziali dinamiche** con scadenza (es. per database o cloud).

Nel tutorial *Inject secrets into Terraform using the Vault provider*:

- Vault è configurato con l'**AWS secrets engine**, che genera credenziali IAM temporanee con TTL breve.
- Terraform le ottiene tramite il provider Vault e le usa per configurare il provider AWS, quindi nessuna credenziale statica è salvata nel codice.
- Un **ruolo Vault** limita i permessi di quelle credenziali (minimo privilegio): una richiesta fuori dai permessi fallisce.

![Figura 8](img/vault-secrets-overview.png) _(dimensioni: 1562×532 px)_

*Figura 8 — Terraform legge i segreti da Vault tramite il provider Vault. Fonte: HashiCorp Developer.* _(caption)_

```
data "vault_kv_secret_v2" "db" {
  mount = "secret"
  name  = "db"
}

resource "aws_db_instance" "main" {
  # ...
  password = data.vault_kv_secret_v2.db.data["password"]
}
```

> **Attenzione**: i segreti letti da Vault con un **data source** finiscono nello state e nel piano, come qualsiasi altro valore. Per evitarlo si usano le **ephemeral resource** del provider Vault, che non vengono salvate, insieme ai write-only argument. Vault riduce la superficie di rischio, ma lo state va protetto comunque.
_(infoBox)_

**Link di riferimento** _(stepTitle)_

- [Resources](https://developer.hashicorp.com/terraform/language/v1.12.x/resources) · [Data sources](https://developer.hashicorp.com/terraform/language/v1.12.x/data-sources)
- [Variabili e output](https://developer.hashicorp.com/terraform/language/v1.12.x/values) · [Type constraints](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions/type-constraints)
- [Funzioni](https://developer.hashicorp.com/terraform/language/v1.12.x/functions) · [Validazione](https://developer.hashicorp.com/terraform/language/v1.12.x/validate)
- [Dati sensibili](https://developer.hashicorp.com/terraform/language/v1.12.x/manage-sensitive-data) · [Vault provider](https://registry.terraform.io/providers/hashicorp/vault/latest/docs)
