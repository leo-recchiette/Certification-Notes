# Modulo 6 — Gestione dello state

_Obiettivo 6 dell'esame: descrivere il backend local (6a), descrivere lo state locking (6b), configurare lo state remoto con il blocco backend (6c), gestire il drift delle risorse e lo state di Terraform (6d)._

---

## 6.1 — Lo state

Terraform conserva uno state dell'infrastruttura gestita per mappare le risorse reali sulla configurazione, tenere traccia dei metadati e migliorare le prestazioni, e prima di ogni operazione lo aggiorna con un refresh (vedi §2.2).

Per default lo state è conservato in un file locale chiamato `terraform.tfstate`. HashiCorp però raccomanda di conservarlo in HCP Terraform, per versionarlo, cifrarlo e condividerlo in modo sicuro con il team.

Lo scopo principale dello state di Terraform è conservare i legami (binding) tra gli oggetti di un sistema remoto e le istanze di risorsa dichiarate nella configurazione. Quando crea un oggetto remoto in risposta a una modifica della configurazione, Terraform ne registra l'identità associandola a una specifica istanza di risorsa. In seguito può aggiornare o eliminare quell'oggetto in risposta a modifiche future della configurazione. Perché Terraform abbia bisogno dello state, e perché non possa funzionare senza, è spiegato nella sezione 2.2.

### 6.1.1 — Ispezione e modifica

I file di state sono semplicemente in formato JSON, ma la loro modifica diretta è sconsigliata. Per le modifiche di base allo state, Terraform offre dalla CLI il comando `terraform state`.

L'uso e l'output dei comandi `state` sono strutturati per funzionare bene con gli strumenti Unix come grep e awk. Inoltre la CLI protegge gli utenti dai cambiamenti di formato dello state. Il progetto Terraform continuerà a far funzionare la CLI anche se il formato sottostante dello state cambia.

La corrispondenza uno a uno tra istanze di risorsa e oggetti remoti (vedi §2.2.1) di solito la garantisce Terraform stesso, che crea ogni oggetto e ne registra l'identità, o lo distrugge e ne rimuove il legame.

I legami nello state si possono anche aggiungere o rimuovere in altri modi. Si può importare un oggetto creato all'esterno con `terraform import`, o chiedere a Terraform di "dimenticare" un oggetto esistente con `terraform state rm`. In questi casi bisogna garantire da sé il rispetto della regola uno a uno. Ad esempio, si elimina a mano un oggetto che si è chiesto a Terraform di dimenticare, oppure lo si reimporta per legarlo a un'altra istanza di risorsa.

### 6.1.2 — Formato

Gli snapshot dello state sono conservati in formato JSON. In generale le nuove versioni di Terraform sono retrocompatibili con gli snapshot prodotti dalle versioni precedenti. Il formato dello state però può cambiare nelle nuove versioni di Terraform. Se si costruisce software che lo legge o lo modifica direttamente, bisogna aspettarsi di mantenerlo nel tempo, man mano che il formato evolve.

In alternativa, ci sono diversi punti di integrazione che producono output JSON pensato proprio per essere consumato da software esterno:

- il comando `terraform output` ha un'opzione `-json`, per ottenere dall'ultimo snapshot dello state l'insieme completo degli output del modulo root o un output specifico;
- il comando `terraform show` ha un'opzione `-json`, per ispezionare per intero l'ultimo snapshot dello state, e anche i file di piano salvati, che includono una copia dello state precedente al momento del piano.

Quando Terraform gira in automazione, li si usa di solito subito dopo un `terraform apply` riuscito, per ottenere una rappresentazione dell'ultimo snapshot dello state. Il risultato si salva come artefatto associato al run automatico. Così altro software può consumarlo senza dover eseguire Terraform.

- Fonte: [State](https://developer.hashicorp.com/terraform/language/v1.12.x/state)

---

## 6.2 — Gestire le risorse nello state di Terraform

Il file di state mappa le risorse della configurazione su quelle reali (vedi §6.1). A volte serve manipolarlo fuori dal workflow standard, ad esempio per smettere di gestire una risorsa senza distruggerla. Nel tutorial si creano un'istanza e un security group, si esamina lo state e lo si modifica con la CLI.

### 6.2.1 — Creare l'infrastruttura e lo state

`main.tf` crea un'istanza EC2 Ubuntu e un security group che la rende accessibile sulla porta 8080:

```
resource "aws_security_group" "sg_8080" {
  name = "terraform-learn-state-sg-8080"
  ingress {
    from_port   = "8080"
    to_port     = "8080"
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  // connectivity to ubuntu mirrors is required to run `apt-get update` and `apt-get install apache2`
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Si eseguono `terraform init` e `terraform apply`.

### 6.2.2 — Esaminare il file di state

`terraform.tfstate` è lo state codificato in JSON; qualsiasi modifica manuale potrebbe causare drift e far ricreare l'infrastruttura al successivo apply.

> **Attenzione**: i file di state non vanno modificati a mano.
_(infoBox)_

**Le risorse nello state** _(stepTitle)_

La sezione `resources` contiene lo schema di ogni oggetto: `mode` vale `managed` per le risorse e `data` per i data source, `type` indica il tipo (qui `aws_ami` del provider aws). In `instances` ci sono gli attributi, come `security_groups`, registrati con il valore effettivo e non con l'espressione della configurazione:

```
"resources": [
    {
      "mode": "data",
      "type": "aws_ami",
      "name": "ubuntu",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "schema_version": 0,
          "attributes": {
            "architecture": "x86_64",
            "arn": "arn:aws:ec2:us-east-1::image/ami-027a754129abb5386",
      ##...
    },
    ##...
]
```

Lo state registra anche le dipendenze, dichiarate con `depends_on` o dedotte (vedi §2.2.2); una modifica alle dipendenze forza la modifica della risorsa dipendente:

```
          "dependencies": [
            "aws_security_group.sg_8080",
            "data.aws_ami.ubuntu"
          ]
```

### 6.2.3 — Esaminare lo state con la CLI

`terraform show` mostra le risorse in formato leggibile, `terraform state list` ne elenca i nomi (vedi §7.6 e §7.7).

### 6.2.4 — Sostituire una risorsa con la CLI

`-replace` ricrea una risorsa senza cambiare la configurazione e sostituisce il deprecato `terraform taint` (vedi §3.8.4). `terraform plan -replace="aws_instance.example"` mostra la sostituzione, e `terraform apply -replace="aws_instance.example"` la esegue: è il processo raccomandato per gestire le risorse senza modificare a mano lo state.

### 6.2.5 — Spostare una risorsa in un altro file di state

I sottocomandi avanzati di `terraform state` vanno usati solo come ultima risorsa. `terraform state mv` sposta o rinomina risorse tra state, senza modificare la configurazione: è utile per combinare moduli o risorse di altri state senza ricrearli.

La directory `new_state` crea un'istanza `aws_instance.example_new`, che usa lo stesso security group tramite un data source. Dopo init e apply, la si sposta nello state della directory superiore con `-state-out`:

```
$ terraform state mv -state-out=../terraform.tfstate aws_instance.example_new aws_instance.example_new
```

> **Nota**: i nomi delle risorse devono essere univoci nel file di state di destinazione. Il comando `terraform state mv` può anche rinominare le risorse per renderle univoche.
_(infoBox)_

Nella directory root la risorsa è nello state ma non nella configurazione, quindi il plan propone di distruggerla. Si copia allora la definizione in `main.tf`:

```
resource "aws_instance" "example_new" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sg_8080.id]
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y apache2
              sed -i -e 's/80/8080/' /etc/apache2/ports.conf
              echo "Hello World" > /var/www/html/index.html
              systemctl restart apache2
              EOF
  tags = {
    Name = "terraform-learn-state-ec2"
  }
}
```

Ora l'apply non fa modifiche, e in `new_state` `terraform destroy` non ha nulla da distruggere.

### 6.2.6 — Rimuovere una risorsa dallo state

Si commenta il blocco `aws_instance.example_new` e lo si sostituisce con un blocco `removed`, che toglie la risorsa dallo state senza distruggerla (vedi §6.8):

```
removed {
  from = aws_instance.example_new

  lifecycle {
    destroy = false
  }
}
```

> **Suggerimento**: il blocco `removed` è stato introdotto in Terraform 1.7. Nelle versioni precedenti si rimuovevano le risorse dallo state con il comando `terraform state rm`.
_(infoBox)_

Si annota l'`id` dell'istanza e si applica: `terraform state list` non la elenca più, ma esiste ancora in AWS. Per reimportarla si decommenta il blocco della risorsa, si commenta `removed` e si esegue:

```
$ terraform import aws_instance.example_new <INSTANCE_ID>
```

> **Suggerimento**: da Terraform 1.5 si può usare al posto di `terraform import` l'import guidato dalla configurazione (vedi §7.1).
_(infoBox)_

### 6.2.7 — Aggiornare lo state dopo una modifica dell'infrastruttura

`terraform refresh`, deprecato a favore di `-refresh-only` (vedi §6.3), aggiorna lo state quando le risorse cambiano fuori da Terraform. Nel tutorial si elimina l'istanza originale con la AWS CLI:

```
$ aws ec2 terminate-instances --instance-ids $(terraform output -raw instance_id) --region $(terraform output -raw aws_region)
```

Dopo qualche minuto `terraform refresh` rimuove `aws_instance.example` dallo state, ma non tocca la configurazione: si eliminano quindi la risorsa da `main.tf` e i relativi output da `outputs.tf`, e l'apply rimuove gli output senza distruggere nulla.

> **Nota**: Terraform esegue automaticamente un refresh durante le operazioni di plan, apply e destroy. Tutti questi comandi riallineano lo state per default, e possono modificare il file di state.
_(infoBox)_

- Fonte: [Manage resources in Terraform state](https://developer.hashicorp.com/terraform/tutorials/state/state-cli)

---

## 6.3 — Sincronizzare lo state con la refresh-only mode

Terraform tiene traccia delle informazioni sulle risorse che gestisce nel file di state del workspace. Quando si applicano modifiche alle risorse, Terraform crea un piano di esecuzione confrontando la configurazione del workspace con il suo state attuale. Il refresh dello state del workspace aggiorna ciò che Terraform sa dell'infrastruttura con lo stato attuale delle risorse, come riportato dai provider configurati.

Le operazioni di plan e apply eseguono un refresh implicito in memoria. Così riallineano lo state del workspace a eventuali drift prima di creare il piano delle modifiche all'infrastruttura. Con l'opzione `-refresh-only` si possono anche pianificare e applicare aggiornamenti al file di state senza modificare l'infrastruttura.

Nel tutorial si individuano con l'opzione `-refresh-only` le differenze tra lo state del workspace e le risorse. Si vedono anche il comportamento implicito del refresh di Terraform e i vantaggi di `-refresh-only` rispetto al sottocomando deprecato `terraform refresh`.

### 6.3.1 — La configurazione e l'infrastruttura

La configurazione di esempio in `main.tf` definisce un'istanza EC2 e un data source che individua l'AMI Amazon Linux più recente. Il blocco provider fa riferimento all'input variable `region`, che per default vale `us-east-2`:

```
provider "aws" {
  region  = var.region

  default_tags {
    tags = {
      hashicorp-learn = "refresh"
    }
  }
}
```

Il tutorial inizializza e applica la configurazione, in locale o con HCP Terraform.

### 6.3.2 — Eseguire un plan refresh-only

Un errore comune che può spingere Terraform ad aggiornare il contenuto del file di state è modificare per sbaglio le credenziali o la configurazione del provider. Nel tutorial si simula questa situazione cambiando la region del provider AWS, e si osservano le modifiche al file di state che un refresh di Terraform proporrebbe. Nella directory si crea un file `terraform.tfvars` che sovrascrive la variabile `region` di default:

```
region = "us-west-2"
```

La variabile `region` viene passata alla configurazione del provider AWS in `main.tf`, quindi il provider viene riconfigurato per la region `us-west-2`. Le risorse create in precedenza però sono ancora in `us-east-2`. Con `terraform plan -refresh-only` si vede come Terraform aggiornerebbe il file di state.

Il provider è aggiornato per la region `us-west-2`, quindi Terraform cerca l'istanza EC2 con l'ID registrato nel file di state, ma non la trova, perché si trova in un'altra region. Terraform presume che l'istanza sia stata distrutta e propone di rimuoverla dal file di state.

Se le modifiche al file di state proposte da un plan `-refresh-only` fossero accettabili, si potrebbe eseguire `terraform apply -refresh-only` e approvare l'operazione. Il file di state verrebbe sovrascritto senza modificare l'infrastruttura. Nel tutorial, però, il refresh del file di state eliminerebbe le risorse, quindi l'apply non va eseguito.

### 6.3.3 — La funzionalità di refresh di Terraform

Nelle versioni precedenti di Terraform, l'unico modo per aggiornare il file di state era il sottocomando `terraform refresh`. Era però meno sicuro della modalità plan e apply `-refresh-only`, perché sovrascriveva automaticamente il file di state senza permettere di rivedere prima le modifiche. In questo caso avrebbe eliminato automaticamente tutte le risorse dal file di state.

La modalità `-refresh-only` delle operazioni `terraform plan` e `terraform apply` rende più sicuro il confronto dello state di Terraform con l'infrastruttura reale, perché permette di rivedere le modifiche proposte al file di state. Così si evita di rimuovere per errore una risorsa esistente dallo state, e si ha l'occasione di correggere la configurazione.

Un'operazione di apply refresh-only aggiorna anche gli output, se necessario. Se altri workspace usano il data source `terraform_remote_state` per accedere agli output del workspace corrente, la modalità `-refresh-only` permette di prevederne gli effetti a valle.

Terraform continuerà a supportare il sottocomando `refresh` nelle versioni future, ma è deprecato, e HashiCorp incoraggia a usare al suo posto l'opzione `-refresh-only`, che permette di rivedere gli aggiornamenti al file di state. A differenza del sottocomando `refresh`, la modalità `-refresh-only` è supportata nei workspace che usano HCP Terraform come backend remoto, così il team può rivedere insieme le modifiche.

- Fonte: [Use refresh-only mode to sync Terraform state](https://developer.hashicorp.com/terraform/tutorials/state/refresh)

---

## 6.4 — Gestire il drift delle risorse

Il file di state di Terraform è il registro di tutte le risorse che Terraform gestisce. Non bisogna modificare a mano le risorse controllate da Terraform, perché il file di state non sarebbe più allineato all'infrastruttura reale: si crea un "drift". Se state e configurazione non corrispondono all'infrastruttura, Terraform cerca di riallineare l'infrastruttura, e può distruggere o ricreare risorse senza volerlo.

Nel tutorial si rilevano e si correggono le differenze tra il file di state e l'infrastruttura reale. Prima si crea con Terraform un'istanza EC2 con un security group. Poi li si modifica a mano con la AWS CLI. Infine si individuano e si risolvono le discrepanze tra lo state di Terraform e l'infrastruttura.

> **Nota**: la drift detection è disponibile in HCP Terraform Standard Edition (si veda la pagina dei prezzi di HCP Terraform).
_(infoBox)_

### 6.4.1 — Creare l'infrastruttura

La configurazione di esempio crea un'istanza EC2, una key pair SSH e un security group che consente l'accesso SSH all'istanza. Prima si crea una coppia di chiavi SSH nella directory corrente, con una passphrase vuota, e si imposta in `terraform.tfvars` la region corrispondente alla configurazione della AWS CLI. Le risorse principali di `main.tf` sono l'istanza EC2, la key pair e il security group SSH:

```
resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file("${path.module}/key.pub")
}

resource "aws_instance" "example" {
  ami                    = data.aws_ami.ubuntu.id
  key_name               = aws_key_pair.deployer.key_name
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sg_ssh.id]
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y apache2
              sed -i -e 's/80/8080/' /etc/apache2/ports.conf
              echo "Hello World" > /var/www/html/index.html
              systemctl restart apache2
              EOF
  tags = {
    Name          = "terraform-learn-state-ec2"
    drift_example = "v1"
  }
}
```

Dopo `terraform init` e `terraform apply`, `terraform state list` mostra le risorse gestite da Terraform nel file di state.

### 6.4.2 — Introdurre un drift

Per introdurre una modifica al di fuori del workflow Terraform, si crea un nuovo security group con la AWS CLI e se ne esporta l'ID in una variabile d'ambiente. Poi si crea per il gruppo una nuova regola che consente l'accesso TCP all'istanza sulla porta 8080. Infine si associa all'istanza EC2 creata da Terraform il security group creato a mano:

```
$ export SG_ID=$(aws ec2 create-security-group --group-name "sg_web" --description "allow 8080" --output text)
$ echo $SG_ID
$ aws ec2 authorize-security-group-ingress --group-name "sg_web" --protocol tcp --port 8080 --cidr 0.0.0.0/0
$ aws ec2 modify-instance-attribute --instance-id $(terraform output -raw instance_id) --groups $SG_ID
```

`echo $SG_ID` conferma che la variabile d'ambiente è stata creata, restituendo il security group appena creato. In PowerShell la variabile si crea e si controlla così:

```
$ $env:SG_ID = "$(aws ec2 create-security-group --group-name "sg_web" --description "allow 8080" --output text)"
$ $env:SG_ID
```

Ora il security group SSH dell'istanza è stato sostituito da un nuovo security group, che il file di state di Terraform non conosce.

### 6.4.3 — Eseguire un plan refresh-only

Plan e apply eseguono già un refresh in memoria (vedi §6.3). Se si sospetta una modifica fuori dal workflow Terraform, l'opzione `-refresh-only`, disponibile da Terraform 0.15.4 e preferibile al sottocomando `terraform refresh` (vedi §6.3.3), mostra le modifiche al file di state.

Con `terraform plan -refresh-only` si determina il drift tra il file di state attuale e la configurazione reale. Terraform rileva differenze tra l'infrastruttura e lo state attuale. Vede che il security group originale, che consentiva l'accesso sulla porta 22, non è più associato all'istanza EC2. L'output del plan refresh-only indica che Terraform aggiornerà il file di state, per registrare nella configurazione dell'istanza EC2 il nuovo security group con accesso sulla porta 8080.

Con `terraform apply -refresh-only` si applicano queste modifiche. Il file di state corrisponde così all'infrastruttura reale, ma non alla configurazione Terraform. Un'operazione refresh-only non cerca di modificare l'infrastruttura per farla corrispondere alla configurazione Terraform: offre solo la possibilità di rivedere e registrare il drift nel file di state.

Se ora si eseguisse `terraform plan` o `terraform apply` senza `-refresh-only`, Terraform cercherebbe di annullare le modifiche fatte a mano. Il tutorial aggiorna invece la configurazione, per associare l'istanza EC2 a entrambi i security group.

### 6.4.4 — Aggiungere il security group alla configurazione

Per portare il security group `sg_web` sotto la gestione di Terraform lo si importa nel file di state. Prima si aggiunge alla configurazione la definizione della risorsa, con una nuova risorsa security group e una risorsa regola in `main.tf`:

```
resource "aws_security_group" "sg_web" {
  name        = "sg_web"
  description = "allow 8080"
}

resource "aws_security_group_rule" "sg_web" {
  type      = "ingress"
  to_port   = "8080"
  from_port = "8080"
  protocol  = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
  security_group_id = aws_security_group.sg_web.id
}
```

Poi si aggiunge l'ID del security group alla risorsa dell'istanza: `vpc_security_group_ids = [aws_security_group.sg_ssh.id, aws_security_group.sg_web.id]`.

### 6.4.5 — Importare il security group

Con `terraform import` si associa la definizione della risorsa al security group creato con la AWS CLI, e poi si importa la regola del security group:

```
$ terraform import aws_security_group.sg_web $SG_ID
$ terraform import aws_security_group_rule.sg_web "$SG_ID"_ingress_tcp_8080_8080_0.0.0.0/0
```

`terraform state list` mostra ora anche le risorse importate. Terraform ha associato nello state entrambi i security group all'istanza. L'istanza però consente ancora solo l'accesso sulla porta 8080, perché il comando `modify-instance-attribute` della AWS CLI ha scollegato il security group SSH.

### 6.4.6 — Aggiornare le risorse

Ora che il security group `sg_web` è rappresentato nello state, si riesegue `terraform apply` per associare il security group SSH all'istanza EC2. L'operazione aggiorna i security group dell'istanza EC2 perché includano sia quello per SSH sia quello per la porta 8080. Per verificarlo ci si collega all'istanza via SSH, confermando con `yes` quando richiesto, e si esce dalla connessione con `exit`. Poi con `curl` si controlla che l'istanza risponda sulla porta 8080:

```
$ ssh ubuntu@$(terraform output -raw public_ip) -i key
$ curl $(terraform output -raw public_ip):8080
```

- Fonte: [Manage resource drift](https://developer.hashicorp.com/terraform/tutorials/state/resource-drift)

---

## 6.5 — Spostare le risorse con la configurazione

Riorganizzare la configurazione in moduli limita l'ambito delle modifiche (vedi §5.2.1), ma cambia gli ID delle risorse: senza indicazioni Terraform le distruggerebbe e ricreerebbe. Il blocco `moved` registra gli spostamenti nella configurazione, e permette di pianificarli e validarli (vedi §6.7). Nel tutorial si dividono le risorse in un modulo di calcolo e uno per i security group.

### 6.5.1 — Riorganizzare la configurazione

Dopo init e apply, `curl` conferma che l'istanza risponde sulla porta 8080. Si crea il modulo `modules/compute`, con le sue variabili:

```
variable "security_group" {
  description = "The security groups assigned to this instance"
}

variable "public_subnets" {
  description = "The public subnet IDs assigned to this instance for IP address assignment"
}
```

Si spostano in `modules/compute/main.tf` il data source dell'AMI e l'istanza EC2, che ora usano le variabili:

```
resource "aws_instance" "example" {
  ami                         = data.aws_ami.ubuntu.id
  subnet_id                   = var.public_subnets[0]
  instance_type               = "t2.micro"
  vpc_security_group_ids      = [var.security_group]
  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y apache2
              sed -i -e 's/80/8080/' /etc/apache2/ports.conf
              echo "Hello World" > /var/www/html/index.html
              systemctl restart apache2
              EOF

  tags = {
    Name = "terraform-learn-move-ec2"
  }
}
```

e si aggiunge un output con l'IP dell'istanza:

```
output "public_ip" {
  description = "The Public IP address used to access the instance"
  value       = aws_instance.example.public_ip
}
```

**Usare i moduli nella configurazione** _(stepTitle)_

Nel root, l'istanza diventa il modulo locale e il security group, prima gestito da `./modules/security_group`, il modulo security-group di AWS del Registry:

```
module "web_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "4.13.0"

  vpc_id = module.vpc.vpc_id

  use_name_prefix = false

  name        = "terraform-learn-move-sg"
  description = "Security Group managed by Terraform"

  ingress_with_cidr_blocks = [
    {
      from_port   = 8080
      to_port     = 8080
      protocol    = "tcp"
      cidr_blocks = "0.0.0.0/0"
    }
  ]

  egress_with_cidr_blocks = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = "0.0.0.0/0"
    }
  ]
}

module "ec2_instance" {
  source         = "./modules/compute"
  security_group = module.web_security_group.security_group_id
  public_subnets = module.vpc.public_subnets
}
```

In `outputs.tf`, `public_ip` usa ora `module.ec2_instance.public_ip`.

### 6.5.2 — Rivedere le modifiche pianificate

Dopo `terraform init`, `terraform plan` propone di eliminare e ricreare le risorse, con possibili interruzioni del servizio.

### 6.5.3 — Spostare le risorse con il blocco moved

Nel `main.tf` root si aggiungono i blocchi `moved`:

```
moved {
  from = module.security_group.aws_security_group.sg_8080
  to   = module.web_security_group.aws_security_group.this[0]
}

moved {
  from = module.security_group.aws_security_group_rule.ingress_rule
  to   = module.web_security_group.aws_security_group_rule.ingress_with_cidr_blocks[0]
}

moved {
  from = module.security_group.aws_security_group_rule.egress_rule
  to   = module.web_security_group.aws_security_group_rule.egress_with_cidr_blocks[0]
}

moved {
  from = aws_instance.example
  to = module.ec2_instance.aws_instance.example
}
```

Il nuovo apply sposta le risorse invece di sostituirle: cambia l'ID dell'istanza, non l'istanza. Il security group e le regole vengono aggiornati sul posto, perché il nuovo modulo ha default diversi per alcuni attributi.

### 6.5.4 — Rinominare e spostare una risorsa

`moved` serve anche a rinominare: si rinomina il modulo `vpc` in `learn_vpc`, aggiornando i riferimenti:

```
module "learn_vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.14.4"

  ##...
}

module "web_security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "4.13.0"

  vpc_id = module.learn_vpc.vpc_id

  ##...
}

module "ec2_instance" {
  source         = "./modules/compute"
  security_group = module.web_security_group.security_group_id
  public_subnets = module.learn_vpc.public_subnets
}
```

```
moved {
  from = module.vpc
  to   = module.learn_vpc
}
```

Dopo `terraform init` l'apply non modifica nessuna risorsa.

> **Nota**: è fortemente consigliato conservare tutti i blocchi `moved` nella configurazione, come registro delle modifiche. Rimuovendo un blocco `moved`, Terraform pianifica di eliminare la risorsa esistente invece di spostarla.
_(infoBox)_

- Fonte: [Use configuration to move resources](https://developer.hashicorp.com/terraform/tutorials/state/move-config)

---

## 6.6 — Il refactoring dello state di Terraform

Man mano che la configurazione Terraform diventa più complessa, si può voler riorganizzare le risorse per migliorarne la manutenibilità e le prestazioni: le operazioni di Terraform finiscono prima se si divide una configurazione con file di state grandi.

Questa pagina descrive i passi da compiere prima di dividere lo state di Terraform tra più configurazioni. Prima bisogna pianificare come raggruppare le risorse e individuare le dipendenze tra risorse. Poi bisogna scegliere l'approccio migliore per migrare le risorse da un file di state a un altro. Anche i refactoring piccoli richiedono di tenere a mente questi principi. Il refactoring della configurazione richiede di aggiornare sia la configurazione sia i file di state corrispondenti.

### 6.6.1 — Individuare le occasioni di refactoring

Nel refactoring della configurazione Terraform si individuano gruppi di risorse che trarrebbero vantaggio da un ciclo di gestione separato. Oppure si individuano insiemi di risorse logicamente correlate da raccogliere in un modulo. Il refactoring deve rendere la configurazione più facile da mantenere. Alcune occasioni comuni di refactoring sono:

- **Apply lunghi**: la configurazione è cresciuta nel tempo ed è diventata difficile da gestire. Le configurazioni grandi e monolitiche possono rendere lunghe le operazioni di plan e apply, e causare modifiche impreviste.
- **Cambiamenti nei cicli di gestione**: gestire le risorse aggiornate spesso separatamente da quelle aggiornate di rado semplifica le operazioni e riduce il raggio d'azione (blast radius) delle modifiche impreviste.
- **Cambiamenti nella proprietà delle risorse**: in alcune organizzazioni i team si dividono la responsabilità di mantenere parti diverse dell'architettura. In questi casi è comune riorganizzare configurazione e state in base all'area di responsabilità di ogni team.
- **Occasione per un modulo riutilizzabile**: si è individuata una parte della configurazione che sarebbe un buon modulo. Se si crea lo stesso insieme di risorse in più configurazioni, conviene raggrupparle in un modulo e riusarlo in tutta l'organizzazione.

### 6.6.2 — Pianificare lo state riorganizzato

Prima di iniziare il refactoring bisogna pianificare come raggruppare le risorse, considerando queste proprietà:

- **Volatilità e frequenza di cambiamento**: esporre l'infrastruttura di lunga durata a una volatilità inutile aumenta le occasioni di modifiche accidentali. Ad esempio, si può scalare il numero di risorse di calcolo più volte al giorno, mentre la configurazione di rete può restare statica per mesi. Gestendo separatamente le risorse di rete si riduce il rischio di modificarle senza volerlo.
- **Stateful e stateless**: gestendo le risorse stateful separatamente da quelle stateless, ad esempio separando i database dalle istanze di calcolo, si limita il raggio d'azione delle operazioni che ricreano le risorse e ci si protegge dalla perdita accidentale di dati.
- **Accessi e responsabilità dei team**: dividendo i workspace per team si limita la responsabilità di ogni workspace, e i team mantengono aree di competenza distinte. Così solo chi conosce parti specifiche dell'infrastruttura ne modifica la configurazione.

### 6.6.3 — Individuare le dipendenze

Quando si migrano risorse da un file di state a un altro, bisogna individuare le dipendenze tra le risorse. Ad esempio, alcune risorse di calcolo possono dipendere dalle risorse di rete. Se si migrano le risorse di rete in un nuovo file di state, le risorse di calcolo non possono più fare riferimento alla rete.

È consigliato usare riferimenti dinamici, invece di scrivere a mano informazioni sulle risorse di un'altra configurazione. Le informazioni scritte a mano vanno aggiornate a mano ogni volta che i dati cambiano, con possibili errori nella configurazione o nelle risorse distribuite. Per fare riferimento alle risorse di un altro file di state si possono usare questi approcci dinamici:

- se il provider lo supporta, un data source specifico della risorsa, che interroga il cloud provider. Ad esempio, il data source `aws_vpc` cerca le informazioni su una VPC creata in un'altra configurazione;
- con HCP Terraform o Terraform Enterprise, il data source `tfe_outputs`, che legge gli output di un altro workspace;
- con un altro backend remoto, o con il backend local, il data source `terraform_remote_state`. Per accedere allo state di un workspace HCP Terraform bisogna indicare esplicitamente quali altri workspace hanno accesso (remote state sharing).

Il comando `terraform graph` aiuta a visualizzare le relazioni tra le risorse della configurazione e a individuare le dipendenze.

### 6.6.4 — Migrare le risorse

Nel refactoring di una configurazione Terraform è consigliato ricreare le risorse stateless in una nuova configurazione, se lo si può fare senza disservizi né costi aggiuntivi.

Le risorse stateful, come i database e gli object store, sono più complicate da migrare. In molti casi non si possono eliminare e ricreare, oppure fare il backup e il ripristino dei dati può essere complesso e costoso. In questi casi si migrano le risorse spostandole tra file di state. Ci sono due approcci comuni per migrare le risorse tra due file di state di Terraform:

- **Rimuovere e importare**: si rimuovono esplicitamente le risorse da un file di state e le si aggiunge a un altro. È l'approccio consigliato, perché i blocchi `removed` e `import` aiutano a tenere un registro della storia della configurazione. Richiede Terraform 1.7 o successivo.
- **Spostare direttamente le risorse in un nuovo file di state**: si usa il comando `terraform state mv` per spostare le risorse in un altro file di state. È un comando legacy, che richiede Terraform 1.0 o successivo.

**Rimuovere e importare** _(stepTitle)_

I blocchi `removed` e `import`, guidati dalla configurazione, permettono di spostare le risorse tra file di state senza distruggerle. Ad esempio, la risorsa seguente va spostata in un nuovo file di state:

```
resource "aws_instance" "example" {
    instance_type = "t3.micro"
    ami = data.aws_ami.example.id
}
```

Nella configurazione sorgente si rimuovono le risorse con questi passi:

1. si recupera l'ultimo state di Terraform e lo si salva in un file come backup, con `terraform state pull > terraform.tfstate.backup`;
2. prima di rimuovere la risorsa, si verifica nella configurazione del provider quale attributo serve per importare quel tipo di risorsa. Ad esempio, l'import della risorsa `aws_instance` usa l'attributo `id` dell'istanza EC2, che si legge con `terraform state show aws_instance.example`;
3. per ogni risorsa da migrare si sostituisce il blocco `resource` con un blocco `removed`, che rimuove la risorsa dallo state senza distruggerla. I blocchi `removed` possono stare in qualsiasi punto della configurazione, ma conviene che l'organizzazione standardizzi dove dichiararli, per facilitare la manutenzione futura. Un approccio comune è definire il blocco `removed` nel file che conteneva il blocco `resource` corrispondente;
4. si esegue `terraform plan` per verificare che Terraform non distrugga le risorse. Il piano indica che `aws_instance.example` non sarà più gestita da Terraform, ma non verrà distrutta;
5. si esegue `terraform apply` per rimuovere la risorsa dallo state.

```
removed {
  from = aws_instance.example

  lifecycle {
    destroy = false
  }
}
```

Poi, nella configurazione di destinazione, si importano le risorse:

1. si aggiungono le risorse alla configurazione in cui le si migra;
2. per ogni risorsa aggiunta si aggiunge un blocco `import`, che la inserisce nello state senza ricrearla. Anche i blocchi `import` possono stare in qualsiasi punto della configurazione, e conviene standardizzarne la posizione. Una prassi comune è definire il blocco `import` nello stesso file in cui si aggiunge il blocco `resource`;
3. si esegue `terraform plan` per verificare che Terraform importi correttamente le risorse;
4. si esegue `terraform apply` per completare l'import (*Apply complete! Resources: 1 imported, 0 added, 0 changed, 0 destroyed.*).

```
resource "aws_instance" "example" {
  instance_type = "t3.micro"
  ami = data.aws_ami.example.id
}

import {
  id = "i-07b510cff5f79af00"
  to = aws_instance.example
}
```

Al termine della migrazione si possono rimuovere i blocchi `removed` e `import`, oppure conservarli come registro del ciclo di vita della risorsa.

**Spostare le risorse direttamente in un nuovo file di state** _(stepTitle)_

Si può anche usare il comando `terraform state mv` per spostare le risorse direttamente tra file di state.

> **Attenzione**: le opzioni `-state` e `-state-out` sono opzioni legacy, che Terraform mantiene per retrocompatibilità.
_(infoBox)_

Questo approccio usa anche i comandi `terraform state pull` e `terraform state push`. Terraform esegue controlli di sicurezza quando si aggiorna a mano lo state remoto, ma questo metodo comporta comunque un certo rischio di corrompere lo state remoto. Per le nuove migrazioni è consigliato usare i blocchi `removed` e `import` descritti sopra. Il procedimento è questo:

1. **Preparare i file di state.** Con il backend di state locale, le risorse si possono spostare direttamente tra due file di state. Con un backend di state remoto, come HCP Terraform o AWS S3, bisogna prima scaricare i file di state dei workspace sorgente e destinazione. Si usa `terraform state pull > source.tfstate` nella directory della configurazione sorgente e `terraform state pull > destination.tfstate` in quella della configurazione di destinazione.
2. **Spostare le risorse.** Con `terraform state mv` si sposta la risorsa dallo state sorgente a quello di destinazione. L'opzione `-state` indica il file di state sorgente, `-state-out` quello di destinazione. Gli ultimi due argomenti indicano quale risorsa spostare dallo state sorgente e con quale nome nello state di destinazione. Si ripete il passo per ogni risorsa da migrare.
3. **Caricare i file di state.** Con un backend remoto bisogna caricare i file di state nel backend con `terraform state push`: `terraform state push source.tfstate` nella directory sorgente e `terraform state push destination.tfstate` in quella di destinazione.
4. **Aggiornare la configurazione e verificare la migrazione.** Si rimuovono le risorse migrate dalla configurazione sorgente e si esegue `terraform plan`, verificando che Terraform non modifichi l'infrastruttura. Poi si aggiungono le risorse migrate alla configurazione di destinazione e si esegue `terraform plan`, con la stessa verifica. Infine si creano le pull request per i repository delle due configurazioni. Se il processo di code review crea uno speculative plan, se ne rivedono i risultati verificando che Terraform non modifichi l'infrastruttura, e si fa il merge delle pull request.

```
$ terraform state mv -state source/source.tfstate -state-out destination/destination.tfstate aws_instance.example aws_instance.example
```

- Fonte: [Refactor Terraform state](https://developer.hashicorp.com/terraform/language/v1.12.x/state/refactor)

---

## 6.7 — Il blocco moved

Questa pagina contiene le informazioni di riferimento sul blocco `moved`. Il blocco serve a cambiare in modo programmatico l'indirizzo di una risorsa (sezioni 6.5 e 6.6).

### 6.7.1 — Modello e configurazione completa

Il blocco `moved` supporta due argomenti, entrambi obbligatori:

```
moved {
    from = <old address for the resource>
    to = <new address for the resource>
}
```

### 6.7.2 — Specifica

Il blocco `moved` indica l'indirizzo precedente e il nuovo indirizzo della risorsa:

| **Argomento** | **Descrizione** | **Tipo** | **Obbligatorio** |
|---|---|---|---|
| `from` | L'indirizzo precedente della risorsa. La sintassi permette di selezionare moduli, risorse e risorse dentro i moduli figli | stringa | sì |
| `to` | Il nuovo indirizzo in cui spostare la risorsa. La sintassi permette di selezionare moduli, risorse e risorse dentro i moduli figli | stringa | sì |

Prima di creare un nuovo piano per la risorsa indicata in `to`, Terraform cerca nello state un oggetto esistente all'indirizzo indicato in `from`. Rinomina gli oggetti esistenti con la stringa indicata in `to`, e poi crea un piano. Il piano fa gestire a Terraform la risorsa indicata in `from` come la risorsa indicata in `to`. Di conseguenza Terraform non distrugge la risorsa durante il run. L'esempio sposta un'istanza AWS dall'indirizzo `aws_instance.a` all'indirizzo `aws_instance.b`:

```
moved {
  from = aws_instance.a
  to   = aws_instance.b
}
```

- Fonte: [moved block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/moved)

---

## 6.8 — Il blocco removed

Il blocco `removed` indica una risorsa da rimuovere dallo state senza modificare l'infrastruttura sottostante (sezione 6.9).

### 6.8.1 — Modello e configurazione completa

Il blocco `removed` supporta l'argomento `from`, l'indirizzo della risorsa, e il blocco obbligatorio `lifecycle`, con l'argomento booleano `destroy`. Supporta anche un blocco `connection` e un blocco `provisioner "<TYPE>"` con i suoi argomenti:

- `when`, la parola chiave;
- `command`, `interpreter`, `working_dir`, `on_failure` e `quiet`;
- un eventuale blocco `connection`;
- `inline`, `script` e `scripts`, mutuamente esclusivi tra loro.

```
removed {
  from = "<resource.address>"
  lifecycle {
    destroy = < true || false >
  }
  connection {
    <connection-settings>
  }
  provisioner "<TYPE>" {
    when = destroy
    <provisioner-type-arguments>
  }
}
```

### 6.8.2 — Specifica

Il blocco `removed` dice a Terraform di rimuovere una risorsa dallo state. Quando una risorsa viene rimossa dallo state, Terraform non gestisce più l'infrastruttura reale che la configurazione rappresenta.

**from** _(stepTitle)_

L'argomento `from`, obbligatorio, indica l'indirizzo della risorsa da rimuovere:

```
removed {
  from = <TYPE>.<NAME>
}
```

Come leggere l'indirizzo dallo state è descritto nella pagina *Inspect Infrastructure Commands Overview*, come costruire gli indirizzi nella sezione 4.9.

**lifecycle** _(stepTitle)_

Il blocco `lifecycle` definisce le regole con cui Terraform rimuove la risorsa. Per i blocchi `removed` l'unico argomento lifecycle supportato è `destroy`. Per default Terraform rimuove la risorsa dallo state e distrugge la risorsa reale. Con `destroy = false` la risorsa viene rimossa dallo state senza distruggere quella reale. Così, dopo aver usato Terraform per il provisioning iniziale, si può passare la responsabilità della gestione a un altro strumento o a un altro team.

**connection** _(stepTitle)_

Il blocco `connection` specifica le impostazioni con cui i provisioner si collegano alle risorse che si stanno rimuovendo. Anche qui HashiCorp consiglia di usare strumenti di configuration management al posto dei provisioner. Il blocco si può mettere nel blocco `removed`, dove imposta le connessioni predefinite per tutti i provisioner della risorsa da rimuovere. Oppure lo si mette nel blocco `provisioner` annidato, dove definisce impostazioni specifiche di quel provisioner.

Valgono le stesse regole del blocco `connection` delle risorse (sezione 4.3.5). Per default le chiavi host SSH non vengono validate, e per validarle si imposta l'argomento `host_key`. Si possono usare valori ephemeral. Le espressioni non possono fare riferimento alla risorsa padre per indirizzo, e al suo posto si usa l'oggetto `self`. Gli argomenti disponibili sono gli stessi della tabella della sezione 4.3.5.

**provisioner** _(stepTitle)_

Il blocco `provisioner` definisce azioni da eseguire sulla macchina locale o sulla risorsa che si sta rimuovendo. Come tipo di provisioner si può dichiarare `local-exec`, che opera sulla macchina su cui gira Terraform, o `remote-exec`, che opera sulla risorsa da rimuovere. Per configurare un provisioner annidato in un blocco `removed` è obbligatorio l'argomento `when`:

| **Tipo di provisioner** | **Argomenti** |
|---|---|
| `local-exec` | `command`, `working_dir`, `interpreter`, `quiet`, `connection`, `on_failure` |
| `remote-exec` | `inline`, `script`, `scripts` |
| Tutti i tipi | `when`, obbligatorio per usare qualsiasi altro argomento in un provisioner annidato in un blocco `removed`; `connection`, `on_failure` |

Nei blocchi `removed` sono supportati solo i provisioner eseguiti in fase di distruzione (destroy-time). Per questo bisogna includere `when` nel blocco `provisioner` per configurare tutti gli altri argomenti. Gli argomenti hanno lo stesso significato descritto per il blocco `resource` (sezione 4.3.6). Ai valori del blocco `provisioner` annidato in un blocco `removed` si fa riferimento con l'oggetto `self`. Gli argomenti dei provisioner sono descritti di seguito.

**when** _(stepTitle)_

L'argomento `when` indica il comando di Terraform che avvia le azioni specificate nel provisioner:

```
resource {
  provisioner "local-exec" {
    when = <Terraform command>
  }
}
```

Quando si esegue il comando indicato, Terraform esegue il comando specificato nell'argomento `command`. L'uso di `when` è descritto nella pagina *Destroy-time provisioners*.

**command** _(stepTitle)_

L'argomento `command`, obbligatorio nel blocco `provisioner "local-exec"`, indica il comando di un eseguibile locale da lanciare. Si può indicare un percorso assoluto o un percorso relativo alla directory di lavoro corrente:

```
resource {
  provisioner "local-exec" {
    command = "<path>"
  }
}
```

Terraform valuta il comando in una shell locale, e può usare le variabili d'ambiente per la sostituzione delle variabili. HashiCorp sconsiglia di usare le variabili di Terraform per la sostituzione, perché possono aprire vulnerabilità di shell injection. Le variabili di Terraform vanno invece passate al comando con il parametro `environment`, usando la sostituzione delle variabili d'ambiente (si veda l'articolo OWASP *Code Injection*).

**working_dir** _(stepTitle)_

Il blocco `working_dir` indica la directory di lavoro in cui Terraform esegue il comando specificato nell'argomento `command`. Si può indicare un percorso relativo alla directory di lavoro corrente o un percorso assoluto. La directory deve già esistere:

```
resource {
  provisioner "local-exec" {
    working_dir = "<path>"
  }
}
```

**interpreter** _(stepTitle)_

Il blocco `interpreter` indica una lista di argomenti dell'interprete con cui eseguire l'eseguibile indicato nell'argomento `command`:

```
resource {
  provisioner "local-exec" {
    interpreter = [ "<path/to/interpreter>", "<command argument>" ]
  }
}
```

Il primo elemento della lista è il percorso dell'interprete, relativo alla directory di lavoro corrente o assoluto. Se non si indica un interprete, Terraform usa i default del sistema operativo.

**environment** _(stepTitle)_

Il blocco `environment` indica coppie chiave-valore che rappresentano l'ambiente in cui eseguire il comando specificato nell'argomento `command`:

```
resource {
  provisioner "local-exec" {
    environment {
      <KEY> = <VALUE>
    }
  }
}
```

**quiet** _(stepTitle)_

L'argomento `quiet` disattiva la stampa su stdout dell'argomento `command`:

```
resource {
  provisioner "local-exec" {
    quiet = <boolean>
  }
}
```

Con `quiet = true`, Terraform stampa su stdout `"Suppressed by quiet=true"`. Terraform stampa comunque l'output del comando.

**inline** _(stepTitle)_

L'argomento `inline` indica una lista di stringhe di comando da eseguire sulla risorsa remota:

```
removed {
  # ...
  provisioner "remote-exec" {
    inline = [ "<command>" ]
  }
}
```

Il provisioner usa la shell predefinita della risorsa remota, a meno che non si indichi una shell come primo comando, ad esempio `#!/bin/bash`. Non si può usare `inline` nello stesso provisioner insieme a `script` o `scripts`.

**script** _(stepTitle)_

L'argomento `script` indica il percorso, relativo o assoluto, di uno script sulla macchina locale da copiare ed eseguire sulla risorsa remota:

```
removed {
  # ...
  provisioner "remote-exec" {
    scripts = "<path-to-script>"
  }
}
```

Non si può usare `script` nello stesso provisioner insieme a `inline` o `scripts`.

**scripts** _(stepTitle)_

L'argomento `scripts` indica una lista di percorsi, relativi o assoluti, di script sulla macchina locale da copiare ed eseguire sulla risorsa remota:

```
removed {
  # ...
  provisioner "remote-exec" {
    scripts = [ "<path-to-script>" ]
  }
}
```

Non si può usare `scripts` nello stesso provisioner insieme a `inline` o `script`.

> **Nota**: negli esempi `local-exec` di questa pagina il blocco esterno è scritto `resource {`, mentre nei blocchi `removed` il provisioner va dentro `removed {`, come negli esempi `remote-exec`. Nell'esempio di `script`, inoltre, l'argomento è scritto `scripts =` invece di `script =`. La tabella degli argomenti di `connection` è identica a quella della sezione 4.3.5, salvo un refuso.
_(infoBox)_

### 6.8.3 — Esempio

L'esempio include un provisioner che, sulla macchina locale, stampa un messaggio che indica che Terraform ha distrutto la risorsa:

```
removed {
  from = aws_instance.example

  lifecycle {
    destroy = true
  }

  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Instance ${self.id} has been destroyed.'"
  }
}
```

- Fonte: [removed block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/removed)

---

## 6.9 — Rimuovere una risorsa dallo state

Per rimuovere una risorsa dallo state di Terraform senza distruggerla, si sostituisce il blocco `resource` con un blocco `removed` e si applica la modifica con il workflow standard di Terraform. Quando una risorsa viene rimossa dallo state, Terraform non ne gestisce più il ciclo di vita. Per rimuovere una risorsa dallo state distruggendo anche l'infrastruttura reale si veda la pagina *Destroy a resource*. Il procedimento è questo:

1. si sostituisce il blocco `resource` della configurazione con un blocco `removed`;
2. nell'argomento `from` del blocco `removed` si indica l'indirizzo della risorsa da rimuovere. Se la risorsa è configurata per creare più istanze, non si possono includere chiavi di istanza come `"aws_instance.example[1]"`;
3. si aggiunge al blocco `removed` un blocco `lifecycle`, con l'argomento `destroy` impostato a `false`. Con `destroy = true` la risorsa viene rimossa dallo state e distrutta;
4. si eliminano tutti i riferimenti agli attributi della risorsa. Per trovarli nella configurazione si può eseguire il comando `terraform validate`;
5. si esegue `terraform apply` e si conferma quando richiesto.

Il blocco `removed` che rimuove `aws_instance.example` dallo state senza distruggerla è lo stesso visto in §6.6.4.

In alternativa si può usare il comando `terraform state rm` per rimuovere una risorsa dallo state. È consigliato però il blocco `removed`, perché permette di vedere in anteprima i risultati dell'operazione ed è quindi un modo più sicuro di rimuovere le risorse. Per tornare a gestire la risorsa con Terraform bisogna importarla di nuovo nella configurazione (Modulo 7).

- Fonte: [Remove a resource from state](https://developer.hashicorp.com/terraform/language/v1.12.x/state/remove)

---

## 6.10 — Le modalità e le opzioni dei run in HCP Terraform

I run di HCP Terraform supportano molte delle modalità e delle opzioni disponibili nella CLI di Terraform. L'obiettivo 6d cita in particolare la refresh-only mode, ma la pagina descrive tutte le modalità.

### 6.10.1 — Plan and apply (standard)

La modalità di run predefinita di HCP Terraform esegue un plan e poi lo applica. Se è attivo l'auto-apply e si usa un workflow VCS o API, un plan riuscito viene applicato subito. Altrimenti il run attende la conferma dell'utente prima dell'apply. La modalità si avvia così:

- dalla CLI, con `terraform apply` senza un file di piano salvato;
- dall'API, creando un run senza opzioni che selezionano un'altra modalità;
- dall'interfaccia, con **+ New run** nella pagina di panoramica del workspace e il tipo di run **Plan and apply (standard)**;
- dal VCS: quando un workspace è collegato a un repository VCS, HCP Terraform avvia automaticamente un plan and apply standard quando si aggiungono nuovi commit al branch selezionato.

### 6.10.2 — Destroy mode

La destroy mode crea un piano che distrugge tutti gli oggetti (vedi §3.8.3). Dalla CLI si usa `terraform plan -destroy` o `terraform destroy`. Dall'API si usa l'opzione `is-destroy`. Dall'interfaccia si usa la pagina **Destruction and Deletion** delle impostazioni del workspace.

### 6.10.3 — Plan only / speculative plan

Questa opzione crea uno speculative plan, che mostra un insieme di modifiche possibili e le verifica rispetto alle policy Sentinel. Terraform però non può applicare questo piano. Gli speculative plan si possono creare con una versione di Terraform diversa da quella selezionata per il workspace. Così si verifica se la configurazione è compatibile con una versione più recente di Terraform senza cambiare le impostazioni del workspace.

I run plan-only ignorano la coda dei run del workspace. Possono procedere anche se è in corso un altro run, non possono diventare il run corrente del workspace e non bloccano gli altri run del workspace. La modalità si avvia così:

- dall'API, impostando l'opzione `plan-only` a `true` e indicando una versione di Terraform disponibile nel campo `terraform-version`;
- dall'interfaccia, con **+ New run** e il tipo di run **Plan only**;
- dal VCS: quando un workspace è collegato a un repository VCS, HCP Terraform avvia automaticamente uno speculative plan quando qualcuno apre una pull request (o merge request) verso il branch selezionato. La vista della pull/merge request nel VCS contiene un link allo speculative plan, che si trova anche nell'elenco dei run del workspace.

### 6.10.4 — Saved plan

I run con piano salvato richiedono almeno la CLI di Terraform v1.6.0. Sono molto simili ai run plan and apply standard: eseguono un plan e poi, facoltativamente, lo applicano. Ci sono però tre differenze principali:

- **nessuna attesa per il plan**: durante il plan e i controlli, i run con piano salvato ignorano la coda dei run del workspace. Come i run plan-only, possono iniziare il plan anche se è in corso un altro run, senza bloccare gli altri run;
- **nessun auto-apply**: i run con piano salvato non vengono mai applicati automaticamente, anche se l'auto-apply è attivo per il workspace. Vengono applicati solo se li si conferma;
- **scarto automatico dei piani obsoleti**: se un altro run viene applicato, o lo state viene modificato in altro modo, prima della conferma di un run con piano salvato, HCP Terraform scarta automaticamente quel piano salvato. HCP Terraform può anche scartare automaticamente i piani salvati non confermati entro alcune settimane.

I piani salvati sono ideali per i workflow interattivi dalla CLI, in cui si eseguono molti plan esplorativi e poi se ne sceglie uno da applicare. Vanno bene anche per workflow di continuous integration personalizzati, in cui il comportamento predefinito della coda dei run non è adatto.

Dalla CLI si usa `terraform plan -out <FILE>` per eseguire e salvare un piano, e poi `terraform apply <FILE>` per applicarlo; `terraform show <FILE>` lo ispeziona prima dell'apply. Dall'API si usa l'opzione `save-plan` alla creazione del run. Se si crea una nuova configuration version per un run con piano salvato, si usa l'opzione `provisional`, perché non diventi la configuration version corrente del workspace finché non si decide di applicare il run.

### 6.10.5 — Allow empty apply

Un apply vuoto (no-operation) permette a HCP Terraform di applicare un run da un piano senza modifiche all'infrastruttura. Durante l'apply, Terraform può aggiornare la versione dello state se necessario. Si può usare questa opzione per aggiornare lo state del workspace HCP Terraform a una nuova versione di Terraform. Solo alcune versioni di Terraform lo richiedono, in particolare la 0.13. Per semplificare questi aggiornamenti, i run con apply vuoto vengono sempre applicati automaticamente se il loro piano non contiene modifiche.

> **Attenzione**: HCP Terraform non può garantire che un piano in questa modalità non produca modifiche. È consigliato controllare che il piano non contenga drift prima di passare alla fase di apply.
_(infoBox)_

Dall'API si imposta il campo `allow-empty-apply` a `true`. Dall'interfaccia si sceglie **+ New run** e il tipo di run **Allow empty apply**.

### 6.10.6 — Refresh-only mode

La refresh-only mode richiede un workspace che usi almeno la CLI di Terraform v0.15.4, e si prova con il tutorial della sezione 6.3. Crea un piano che riallinea lo state agli oggetti remoti modificati fuori da Terraform, senza toccare gli oggetti (vedi §3.8.3). La modalità si avvia così:

- dalla CLI, con `terraform plan -refresh-only` o `terraform apply -refresh-only`;
- dall'API, con l'opzione `refresh-only`;
- dall'interfaccia, con **+ New run** e il tipo di run **Refresh state**.

### 6.10.7 — Saltare il refresh automatico dello state

L'opzione `-refresh=false` si usa nella planning mode normale per saltare il refresh predefinito dello state di Terraform prima di cercare le modifiche alla configurazione. Dalla CLI si usa `terraform plan -refresh=false` o `terraform apply -refresh=false`. Dall'API si usa l'opzione `refresh`.

### 6.10.8 — Sostituire risorse selezionate

Il supporto di replace richiede un workspace che usi almeno la CLI di Terraform v0.15.2. L'opzione `replace` fa sostituire a Terraform l'oggetto con l'indirizzo di risorsa indicato:

- dalla CLI, con `terraform plan -replace=ADDRESS` o `terraform apply -replace=ADDRESS`;
- dall'API, con l'opzione `replace-addrs`;
- dall'interfaccia, con **+ New run** e il tipo di run **Plan and apply (standard)**. Poi con **Additional planning options** compare l'opzione **Replace resources**, in cui si scrive l'indirizzo della risorsa da sostituire. Si possono sostituire più risorse.

### 6.10.9 — Plan e apply mirati

Il resource targeting è pensato solo per circostanze eccezionali e non va usato di routine. Dalla CLI si usa `terraform plan -target=ADDRESS` o `terraform apply -target=ADDRESS`. Dall'API si usa l'opzione `target-addrs`. Le consuete avvertenze sul targeting nelle operazioni locali comportano alcune limitazioni aggiuntive delle funzionalità di HCP Terraform per i plan remoti creati con targeting:

- i controlli delle policy Sentinel sui plan mirati vedono, negli import `tfplan` e `tfplan/v2`, solo il sottoinsieme selezionato di istanze di risorsa con modifiche pianificate. Questo può far fallire per errore qualsiasi policy che richiede una modifica pianificata a una particolare istanza di risorsa, selezionata per indirizzo;
- la stima dei costi (cost estimation) è disabilitata per qualsiasi run creato con `-target`. Così si evita una sottostima ingannevole dei costi, dovuta alle istanze di risorsa escluse dal piano.

Si può disabilitare o limitare l'uso del targeting in un workspace con una policy Sentinel basata sul valore `tfrun.target_addrs`.

### 6.10.10 — Generare la configurazione

Il supporto dei blocchi `import` e della generazione della configurazione richiede un workspace che usi almeno la CLI di Terraform v1.5.0. Quando si usano i blocchi `import` per importare risorse esistenti, Terraform può generare automaticamente la configurazione durante il plan, per le risorse importate che non hanno già un blocco `resource`. L'opzione è attiva per default per i run avviati dall'interfaccia o da un webhook VCS. Dalla CLI si usa `terraform plan -generate-config-out=generated.tf`, dall'API l'opzione `allow-config-generation`.

La configurazione generata compare nell'interfaccia del plan. Con il workflow da CLI, Terraform la scrive nel file indicato quando si esegue `terraform plan`. Dopo la generazione bisogna rivedere la configurazione e incorporarla nella configurazione Terraform, con il commit nel controllo versione, e poi eseguire un altro plan. Se si cerca di applicare direttamente un piano con configurazione generata, il run va in errore.

### 6.10.11 — Minimal refresh

Il minimal refresh richiede un workspace che usi almeno la CLI di Terraform v1.17.0. I workspace che usano agent HCP Terraform autogestiti richiedono tfc-agent v1.33.0 o successivo. Il minimal refresh aggiorna solo le risorse che Terraform si aspetta cambino. Terraform pianifica prima ogni risorsa con lo state esistente. Poi aggiorna e ripianifica solo le risorse che il piano iniziale mostra in modifica, e salta il refresh di tutte le altre.

Aggiornare solo le risorse che dovrebbero cambiare può ridurre il tempo di plan nei workspace con molte risorse. Non permette però a Terraform di controllare il drift delle risorse invariate. Di conseguenza le modifiche fatte al di fuori di Terraform potrebbero non comparire nel piano. Terraform aggiorna comunque ogni risorsa che pianifica di modificare, prima di calcolare il piano finale.

Dalla CLI si usa `terraform plan -minimal-refresh` o `terraform apply -minimal-refresh`. L'opzione si combina con quelle che eseguono distruzioni, che indirizzano risorse specifiche o che sostituiscono risorse. Terraform non aggiorna le managed resource durante le distruzioni, e non si possono combinare `-minimal-refresh` e `-refresh=false` nello stesso comando.

Dall'interfaccia si sceglie **+ New run** e il tipo di run **Minimal refresh**. HCP Terraform crea un piano con minimal refresh, che si applica come un run standard. I dettagli del run mostrano *State refresh: Minimal* per i run che lo usano. I run attivati dal VCS usano sempre un refresh completo. Anche gli health assessment eseguono sempre un refresh completo, e non riflettono i run con minimal refresh.

- Fonte: [Run modes and options](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/run/modes-and-options)

---

## 6.11 — Il blocco backend

Questa pagina descrive come configurare il blocco `backend` nella configurazione Terraform. Il backend definisce dove Terraform conserva i file dei dati di state.

### 6.11.1 — Panoramica

Terraform usa dati di state persistenti per tenere traccia delle risorse che gestisce. Si può integrare HCP Terraform per conservare i dati di state, oppure definire un blocco `backend` per conservare lo state in un oggetto remoto. Così più persone possono accedere ai dati di state e lavorare insieme su quell'insieme di risorse dell'infrastruttura.

### 6.11.2 — Definire un blocco backend

Non si configura un backend quando si collega la configurazione ai workspace di HCP Terraform o Terraform Enterprise. Questi sistemi gestiscono automaticamente lo state nei workspace associati alla configurazione. Se la configurazione include un blocco `cloud`, non può includere un blocco `backend`.

Per configurare un backend si aggiunge un blocco `backend` annidato nel blocco `terraform` di primo livello. L'esempio configura il backend `remote`:

```
terraform {
  backend "remote" {
    organization = "example_corp"

    workspaces {
      name = "my-app-prod"
    }
  }
}
```

La configurazione del backend ha alcune limitazioni importanti:

- una configurazione può avere un solo blocco `backend`;
- un blocco `backend` non può fare riferimento a valori con nome, come input variable, local value o attributi di data source;
- i valori dichiarati nei blocchi `backend` non si possono usare altrove nella configurazione.

**Backend di default** _(stepTitle)_

Per default Terraform usa un backend chiamato `local`, che conserva lo state come file locale su disco.

**Tipi di backend** _(stepTitle)_

Terraform include diversi tipi di backend integrati. Alcuni funzionano come dischi remoti per i file di state. Altri supportano anche il lock dello state durante le operazioni di Terraform, per evitare conflitti e incoerenze. Non si possono caricare altri backend come plugin.

Il tipo di backend si indica come etichetta del blocco `backend`, ad esempio `backend "remote" { ... }`. Il backend indicato deve essere disponibile nella versione di Terraform in uso.

**Argomenti del backend** _(stepTitle)_

Gli argomenti nel corpo del blocco `backend` sono specifici del tipo di backend. Indicano dove e come il backend conserva lo state della configurazione, e alcuni tipi permettono di configurare comportamenti aggiuntivi. Tutti i dettagli e gli argomenti di configurazione sono nella pagina di ciascun tipo di backend.

Alcuni backend permettono di fornire le credenziali di accesso nella configurazione, ma è sconsigliato includerle direttamente. Conviene invece lasciare vuoti gli argomenti delle credenziali, e fornirle con i file di credenziali o le variabili d'ambiente convenzionali per il sistema di destinazione.

**Credenziali e dati sensibili** _(stepTitle)_

I backend conservano lo state in un servizio remoto, così più persone vi possono accedere. Di solito l'accesso allo state remoto richiede credenziali, perché i dati di state contengono informazioni estremamente sensibili.

> **Attenzione**: è consigliato fornire credenziali e altri dati sensibili con le variabili d'ambiente. Se si usa `-backend-config` o si scrivono questi valori direttamente nella configurazione, Terraform li include sia nella sottodirectory `.terraform` sia nei file di piano, con il rischio di far trapelare credenziali sensibili.
_(infoBox)_

Terraform scrive la configurazione del backend in chiaro in due file distinti:

- il file `.terraform/terraform.tfstate` contiene la configurazione del backend della directory di lavoro corrente;
- tutti i file di piano registrano le informazioni di `.terraform/terraform.tfstate` al momento della creazione del piano. Così Terraform applica il piano all'insieme corretto di infrastruttura.

Quando si applica un piano salvato in precedenza in un file, Terraform usa la configurazione del backend registrata in quel file, invece delle impostazioni attuali del backend. Se quella configurazione contiene credenziali a tempo, potrebbero scadere prima di finire l'apply del piano. Per usare valori diversi tra plan e apply si passano le credenziali con le variabili d'ambiente.

### 6.11.3 — Inizializzare il backend

Quando si cambia la configurazione di un backend, bisogna rieseguire `terraform init` prima di qualsiasi altra operazione (vedi §3.4.4). La directory locale `.terraform/` contiene poi la configurazione del backend più recente, compresi eventuali parametri di autenticazione, e quindi non va inclusa in Git (vedi §3.3.4).

La configurazione del backend locale è diversa e del tutto separata dal file `terraform.tfstate`, che contiene i dati di state sull'infrastruttura reale e che Terraform conserva nel backend remoto.

Quando si cambia backend, Terraform offre di migrare lo state esistente (vedi §6.11.5).

> **Importante**: prima di migrare a un nuovo backend è fortemente consigliato fare a mano un backup dello state, copiando il file `terraform.tfstate` in un'altra posizione.
_(infoBox)_

### 6.11.4 — Configurazione parziale

Non serve specificare tutti gli argomenti obbligatori nella configurazione del backend. Può essere utile ometterne alcuni se li fornisce automaticamente uno script di automazione che esegue Terraform. Quando alcuni o tutti gli argomenti sono omessi, si parla di **configurazione parziale**. Con una configurazione parziale, gli argomenti mancanti vanno forniti durante l'inizializzazione, in uno di questi modi:

- **file**: si indica un file di configurazione con l'opzione `-backend-config=PATH` di `terraform init`. La configurazione parziale deve avere un blocco `backend` con le chiavi impostate a valori vuoti. Eseguendo `terraform init -backend-config="<path-to-remaining-configuration>"`, Terraform valorizza le chiavi della configurazione parziale con i valori corrispondenti del file indicato. Se il file contiene segreti, lo si può conservare in un archivio sicuro come Vault, da cui va scaricato sul disco locale prima di eseguire Terraform;
- **coppie chiave/valore da riga di comando**: si specificano con `-backend-config="KEY=VALUE"` in `terraform init`. Molte shell conservano le opzioni della riga di comando in un file di cronologia, quindi è sconsigliato per i segreti;
- **in modo interattivo**: Terraform chiede in modo interattivo i valori obbligatori, a meno che l'input interattivo sia disabilitato. Non chiede i valori facoltativi.

Nell'esempio seguente, le chiavi del blocco `backend` del file `state.tf` vengono valorizzate con i valori del file `state.config` (`terraform init -backend-config="./state.config"`):

```
# state.tf
terraform {
  backend "s3" {
    bucket = ""
    key = ""
    region = ""
    profile= ""
  }
}

# state.config
bucket = "your-bucket"
key = "your-state.tfstate"
region = "eu-central-1"
profile= "Your_Profile"
```

Se le impostazioni del backend arrivano da più posizioni, le impostazioni di primo livello vengono unite. Le opzioni della riga di comando sovrascrivono le impostazioni della configurazione principale, e vengono elaborate in ordine, con le opzioni successive che sovrascrivono i valori di quelle precedenti.

La configurazione finale unita viene salvata su disco nella directory `.terraform`, che va esclusa dal controllo versione. Così le informazioni sensibili restano fuori dal controllo versione, ma sono in chiaro sul disco locale durante l'esecuzione di Terraform.

Con la configurazione parziale, Terraform richiede come minimo una configurazione del backend vuota in uno dei file di configurazione root, per indicare il tipo di backend:

```
terraform {
  backend "consul" {}
}
```

**File** _(stepTitle)_

Un file di configurazione del backend contiene il contenuto del blocco `backend` come attributi di primo livello, senza racchiuderlo in un altro blocco `terraform` o `backend`. Lo schema di nome consigliato è `*.backendname.tfbackend`, ad esempio `config.consul.tfbackend`. Terraform non impedisce di usare altri nomi, ma seguendo questa convenzione l'editor capisce il contenuto e offre probabilmente un'esperienza di modifica migliore.

```
address = "demo.consul.io"
path    = "example_app/terraform_state"
scheme  = "https"
```

**Coppie chiave/valore da riga di comando** _(stepTitle)_

Le stesse impostazioni si possono indicare in alternativa sulla riga di comando:

```
$ terraform init \
    -backend-config="address=demo.consul.io" \
    -backend-config="path=example_app/terraform_state" \
    -backend-config="scheme=https"
```

Il backend Consul richiede anche un token di accesso Consul. Seguendo la raccomandazione di tenere le credenziali fuori dalla configurazione, il token si fornisce con le variabili d'ambiente `CONSUL_HTTP_TOKEN` o `CONSUL_HTTP_AUTH`. La documentazione di ogni backend spiega come fornirgli le credenziali al di fuori della configurazione principale.

### 6.11.5 — Cambiare e rimuovere la configurazione

La configurazione del backend si può cambiare in qualsiasi momento, sia nella configurazione stessa sia nel tipo di backend, ad esempio da `consul` a `s3`. Terraform rileva automaticamente le modifiche alla configurazione e chiede di reinizializzare. Durante la reinizializzazione chiede se si vuole migrare lo state esistente nella nuova configurazione, così si passa facilmente da un backend a un altro.

Se si usano più workspace, Terraform può copiarli tutti nella destinazione, e se ne rileva più d'uno chiede se è ciò che si vuole. Anche se si sta solo riconfigurando lo stesso backend, Terraform chiede comunque se si vuole migrare lo state, e in questo caso si può rispondere "no".

Per rimuovere la configurazione di un backend si elimina il blocco `backend` dalla configurazione, e si reinizializza la directory quando richiesto. Terraform chiede anche di migrare lo state nel backend `local` di default.

- Fonte: [Backend block configuration overview](https://developer.hashicorp.com/terraform/language/v1.12.x/backend)

---

## 6.12 — Il backend local

Il backend `local` è di tipo *enhanced*. Conserva lo state sul filesystem locale, mette il lock sullo state tramite le API di sistema ed esegue le operazioni in locale.

### 6.12.1 — Configurazione d'esempio

L'esempio configura il backend con un percorso del file di state. Il secondo blocco mostra il data source `terraform_remote_state`, che legge lo state di un'altra configurazione con il backend `local`:

```
terraform {
  backend "local" {
    path = "relative/path/to/terraform.tfstate"
  }
}

data "terraform_remote_state" "foo" {
  backend = "local"

  config = {
    path = "${path.module}/../../terraform.tfstate"
  }
}
```

Sono supportate queste opzioni di configurazione:

- `path` (facoltativo): il percorso del file tfstate; per default è `"terraform.tfstate"`, relativo al modulo root;
- `workspace_dir` (facoltativo): il percorso dei workspace non predefiniti.

### 6.12.2 — Argomenti da riga di comando

Questa sezione descrive funzionalità legacy, mantenute per retrocompatibilità ma non più consigliate. Per le configurazioni che includono un blocco `backend "local"`, o che usano il backend local di default perché non ne specificano nessuno, la maggior parte dei comandi che leggono o scrivono snapshot dello state accetta questi argomenti aggiuntivi:

- `-state=FILENAME`: sovrascrive il nome del file di state da cui leggere lo snapshot precedente.
- `-state-out=FILENAME`: sovrascrive il nome del file di state in cui scrivere i nuovi snapshot. Se si usa `-state` senza `-state-out`, Terraform usa il file di `-state` per entrambi, e quindi sovrascrive il file di input quando crea un nuovo snapshot.
- `-backup=FILENAME`: sovrascrive il nome di file che il backend local sceglierebbe dinamicamente per creare i file di backup quando scrive un nuovo state. Se si usa `-state` senza `-backup`, Terraform usa il nome di `-state` come prefisso per generare il nome del backup. Con `-backup=-`, cioè il solo trattino ASCII, si disabilita del tutto la creazione dei file di backup.

Queste tre opzioni sono mantenute per compatibilità con i workflow precedenti all'introduzione dello state remoto integrato. In quei workflow gli utenti scrivevano script che recuperavano lo state precedente prima di eseguire Terraform e salvavano il nuovo state all'uscita di Terraform. I tre argomenti erano di solito percorsi in una directory temporanea usata per una sola operazione.

Questi workflow sono precedenti alla possibilità di avere più workspace. Per questo le opzioni sostituiscono il comportamento normale di Terraform, che sceglie un nome di file di state diverso in base al workspace selezionato. Usando tutte e tre le opzioni, il workspace selezionato non influisce sui nomi dei file di state. Per tenere separati i file di state dei workspace bisogna quindi scegliere da sé nomi diversi.

Le tre opzioni non hanno effetto con un altro tipo di backend. HashiCorp sconsiglia di usarle nei nuovi sistemi, anche se si esegue Terraform in automazione. Conviene invece scegliere un backend che supporti lo state remoto e configurarlo nel modulo root. Così chiunque lavori sulla configurazione recupera e salva automaticamente lo state nella posizione condivisa corretta, senza opzioni speciali da riga di comando.

- Fonte: [local backend](https://developer.hashicorp.com/terraform/language/v1.12.x/backend/local)

---

## 6.13 — Storage e locking dello state

I backend hanno il compito di conservare lo state e di offrire un'API per il lock dello state; il lock dello state è facoltativo. Anche se lo state è conservato in remoto, tutti i comandi di Terraform continuano a funzionare come se lo state fosse locale, ad esempio `terraform console`, le operazioni `terraform state` e `terraform taint`.

### 6.13.1 — Lo storage dello state

I backend stabiliscono dove viene conservato lo state. Ad esempio, il backend `local` (di default) conserva lo state in un file JSON locale su disco, mentre il backend Consul lo conserva in Consul. Entrambi offrono anche il locking: il backend local tramite le API di sistema, Consul tramite le proprie API di locking.

Con un backend non locale, Terraform non salva lo state da nessuna parte sul disco, tranne in caso di un errore non recuperabile nella scrittura dello state sul backend. È un grande vantaggio dei backend: se lo state contiene valori sensibili, un backend remoto permette di usare Terraform senza che lo state venga mai salvato su disco.

Se si verifica un errore nel salvataggio dello state sul backend, Terraform scrive lo state in locale, per evitare la perdita di dati. In questo caso, una volta risolto l'errore, l'utente finale deve caricare a mano lo state sul backend remoto.

### 6.13.2 — Pull e push manuali dello state

Lo state remoto si può recuperare a mano con il comando `terraform state pull`, che carica lo state remoto e lo stampa su stdout; lo si può salvare in un file o usare per altre operazioni. Lo state si può anche scrivere a mano con `terraform state push`. È estremamente pericoloso e andrebbe evitato quando possibile, perché sovrascrive lo state remoto. Si può usare per correzioni manuali, se necessario.

Quando si carica lo state a mano, Terraform cerca di proteggere da alcune situazioni potenzialmente pericolose:

- **lineage diverso**: il "lineage" è un ID univoco assegnato a uno state quando viene creato. Se il lineage è diverso, gli state sono stati creati in momenti diversi, ed è molto probabile che si stia modificando uno state diverso. Terraform non lo permette;
- **serial più alto**: ogni state ha un numero "serial" che aumenta in modo monotono. Se lo state di destinazione ha un serial più alto, Terraform non permette di scriverlo, perché significa che ci sono state modifiche successive allo state che si cerca di scrivere.

Entrambe le protezioni si possono aggirare con l'opzione `-force`, se si è sicuri della decisione. Anche con `-force`, è consigliato fare un backup dello state con `terraform state pull` prima di forzare la sovrascrittura.

### 6.13.3 — Il lock dello state

I backend supportano il lock dello state quando possibile; il locking è descritto in §6.14.

- Fonte: [State storage and locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/backends)

---

## 6.14 — Lo state locking

Se il backend lo supporta, Terraform mette un lock sullo state per tutte le operazioni che potrebbero scriverlo. Così altri non possono acquisire il lock e corrompere lo state.

Il lock dello state avviene automaticamente in tutte le operazioni che potrebbero scrivere lo state, e non compare nessun messaggio. Se il lock dello state fallisce, Terraform non prosegue. Per la maggior parte dei comandi si può disabilitare il lock con l'opzione `-lock=false`, ma è sconsigliato.

Se l'acquisizione del lock richiede più tempo del previsto, Terraform mostra un messaggio di stato. Se Terraform non mostra nessun messaggio, il lock avviene comunque, se il backend lo supporta. Non tutti i backend supportano il locking, e la documentazione di ogni backend indica se lo supporta.

### 6.14.1 — Force unlock

Terraform ha un comando `force-unlock` per togliere a mano il lock dallo state, se lo sblocco automatico è fallito.

Questo comando va usato con molta attenzione. Se si toglie il lock mentre qualcun altro lo detiene, si possono avere più scrittori contemporanei. `force-unlock` va usato solo per togliere il proprio lock, quando lo sblocco automatico è fallito.

Per protezione, il comando `force-unlock` richiede un ID di lock univoco, che Terraform mostra se lo sblocco fallisce. L'ID fa da nonce, e garantisce che lock e sblocco riguardino il lock corretto.

- Fonte: [State locking](https://developer.hashicorp.com/terraform/language/v1.12.x/state/locking)
