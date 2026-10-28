# Modulo 5 — Moduli

_Obiettivo 5 dell'esame: spiegare come Terraform recupera i moduli (5a), descrivere lo scope delle variabili nei moduli (5b), usare i moduli nella configurazione (5c) e gestire le versioni dei moduli (5d)._

---

## 5.1 — I moduli

Un modulo è un insieme di risorse che Terraform gestisce insieme. Questa pagina offre una panoramica dei concetti dei moduli e delle fasi della loro adozione. Le informazioni su come creare e distribuire i moduli sono nella sezione *Develop modules* della documentazione.

### 5.1.1 — Introduzione

Quando si creano ripetutamente gruppi di risorse con una configurazione simile, ad esempio le risorse di rete per i nuovi ambienti di sviluppo, conviene scrivere moduli riutilizzabili che li codifichino. Modularizzare e condividere le configurazioni aiuta a standardizzare il modo in cui si crea l'infrastruttura, e permette di creare le risorse necessarie in modo rapido e prevedibile.

**Gerarchia** _(stepTitle)_

Ogni workspace Terraform contiene file di configurazione nella propria directory principale, e Terraform chiama questa configurazione **modulo root**. I moduli configurati con i blocchi `module` si chiamano **moduli figli** (child module). Quando si applica una configurazione, il modulo root chiama il modulo figlio. Terraform aggiunge quindi le risorse del modulo figlio al workspace, e le gestisce come parte della configurazione.

Il modulo root può chiamare più volte i moduli figli nella stessa configurazione. Può anche chiamare un modulo figlio che a sua volta chiama un proprio modulo figlio annidato.

**Sorgenti** _(stepTitle)_

Terraform può caricare i moduli da più sorgenti, tra cui il filesystem locale, un registry Terraform e i repository di controllo versione.

Il Terraform Registry pubblico ospita un'ampia raccolta di moduli Terraform pubblici, per configurare molti tipi di infrastruttura comuni. I moduli del registry pubblico sono creati e mantenuti da HashiCorp, dai partner e dalla community di Terraform. Sono gratuiti, e Terraform li scarica automaticamente se in un blocco `module` si specificano la sorgente e la versione corrette.

I membri della propria organizzazione possono creare moduli specifici per le esigenze dell'infrastruttura. HCP Terraform e Terraform Enterprise includono un registry privato dei moduli, per condividerli all'interno dell'organizzazione.

### 5.1.2 — Il workflow dei moduli

Il workflow di implementazione dei moduli ha tre fasi:

- **Develop**: gli sviluppatori dei moduli raccolgono le configurazioni delle risorse in un modulo. I moduli seguono una struttura standard e dovrebbero includere la documentazione.
- **Distribute**: Terraform permette di accedere ai moduli da diversi tipi di sorgenti, tra cui i bucket S3 e i repository GitHub. Il metodo più comune è pubblicare il modulo nel Terraform Registry pubblico o in un registry privato.
- **Provision**: chi usa i moduli li chiama con il blocco `module` nelle proprie configurazioni, da uno dei tipi di sorgente supportati (sezione 5.5).

- Fonte: [Modules overview](https://developer.hashicorp.com/terraform/language/modules)

---

## 5.2 — A cosa servono i moduli

Gestendo l'infrastruttura con Terraform, si creano configurazioni sempre più complesse. Non c'è un limite intrinseco alla complessità di un singolo file o di una singola directory di configurazione Terraform. Si potrebbe quindi continuare a scrivere e aggiornare i file di configurazione in un'unica directory. Così però si rischia di incontrare uno o più di questi problemi:

- capire i file di configurazione e muoversi al loro interno diventa sempre più difficile;
- aggiornare la configurazione diventa più rischioso, perché un aggiornamento a una sezione può avere conseguenze impreviste su altre parti della configurazione;
- aumentano i blocchi di configurazione simili duplicati, ad esempio quando si configurano ambienti dev, staging e production separati, e aggiornare quelle parti diventa sempre più pesante;
- si potrebbe voler condividere parti della configurazione tra progetti e team, e copiare e incollare blocchi di configurazione tra progetti è soggetto a errori e difficile da mantenere;
- per capire e modificare la configurazione serve più esperienza con Terraform. Questo rende più difficili i workflow self-service per gli altri team, e ne rallenta lo sviluppo.

Questo tutorial introduttivo spiega come i moduli risolvono questi problemi, com'è strutturato un modulo Terraform e quali sono le best practice per usare e creare moduli.

### 5.2.1 — Cosa risolvono i moduli

I moduli aiutano a risolvere i problemi elencati in questi modi:

- **Organizzare la configurazione**: i moduli tengono insieme le parti correlate della configurazione, e così è più facile muoversi al suo interno, capirla e aggiornarla. Anche un'infrastruttura di media complessità può richiedere centinaia o migliaia di righe di configurazione. Con i moduli la si organizza in componenti logici.
- **Incapsulare la configurazione**: i moduli incapsulano la configurazione in componenti logici distinti. L'incapsulamento aiuta a prevenire conseguenze impreviste, come una modifica a una parte della configurazione che cambia per errore altra infrastruttura. Riduce anche gli errori banali, come usare lo stesso nome per due risorse diverse.
- **Riutilizzare la configurazione**: scrivere tutta la configurazione da zero richiede tempo ed è soggetto a errori. I moduli fanno risparmiare tempo e riducono gli errori costosi, perché si riusa configurazione scritta da sé, dai colleghi o da altri professionisti che hanno pubblicato moduli. A propria volta si possono condividere i moduli scritti con il team o con il pubblico.
- **Garantire coerenza e best practice**: i moduli rendono coerenti le configurazioni. La coerenza rende più comprensibili le configurazioni complesse, e aiuta ad applicare le best practice in tutta la configurazione. Ad esempio, i cloud provider offrono molte opzioni per configurare i servizi di object storage, come i bucket Amazon S3 o Google Cloud Storage. Ci sono stati molti incidenti di sicurezza noti dovuti a object storage protetti in modo scorretto, e con così tante opzioni complesse è facile configurare male questi servizi per errore.
- **Self-service**: i moduli rendono la configurazione più facile da usare per gli altri team. Il registry di HCP Terraform permette agli altri team di trovare e riusare i moduli Terraform pubblicati e approvati. Si possono anche costruire e pubblicare moduli no-code ready, con cui anche i team senza esperienza di Terraform creano la propria infrastruttura nel rispetto degli standard e delle policy dell'organizzazione.

I moduli aiutano quindi a ridurre gli errori. Ad esempio, si può creare un modulo che descrive come configurare tutti i bucket dei siti web pubblici dell'organizzazione, e un altro per i bucket privati usati dalle applicazioni di logging. Inoltre, se la configurazione di un tipo di risorsa va aggiornata, con i moduli la si aggiorna in un solo punto, e la modifica vale ovunque si usi quel modulo.

### 5.2.2 — Che cos'è un modulo Terraform

Un modulo Terraform è un insieme di file di configurazione Terraform in una sola directory. Anche una configurazione semplice, fatta di una sola directory con uno o più file `.tf`, è un modulo. Quando si eseguono i comandi di Terraform direttamente da una directory di questo tipo, la si considera il modulo root. In questo senso, ogni configurazione Terraform fa parte di un modulo. Ad esempio, ecco un semplice insieme di file di configurazione:

```
.
├── LICENSE
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
```

In questo caso, quando si eseguono i comandi di Terraform dalla directory `minimal-module`, il suo contenuto è considerato il modulo root.

**Chiamare i moduli** _(stepTitle)_

I comandi di Terraform usano direttamente solo i file di configurazione di una directory, di solito la directory di lavoro corrente. La configurazione però può usare i blocchi `module` per chiamare moduli in altre directory. Quando incontra un blocco `module`, Terraform carica ed elabora i file di configurazione di quel modulo. Un modulo chiamato da un'altra configurazione si chiama a volte "modulo figlio" di quella configurazione.

**Moduli locali e remoti** _(stepTitle)_

I moduli si possono caricare dal filesystem locale o da una sorgente remota. Terraform supporta diverse sorgenti remote: il Terraform Registry, la maggior parte dei sistemi di controllo versione, gli URL HTTP e i registry privati dei moduli di HCP Terraform o Terraform Enterprise.

### 5.2.3 — Best practice per i moduli

Per molti aspetti i moduli Terraform sono simili alle librerie, ai pacchetti o ai moduli della maggior parte dei linguaggi di programmazione, e offrono molti degli stessi vantaggi. Come quasi ogni programma non banale, le configurazioni Terraform reali dovrebbero quasi sempre usare i moduli, per ottenere i vantaggi descritti sopra. HashiCorp raccomanda a ogni professionista di Terraform di usare i moduli seguendo queste best practice:

- chiamare il modulo `terraform-<PROVIDER>-<NAME>`. È una convenzione da rispettare per pubblicare nei registry dei moduli di HCP Terraform o Terraform Enterprise;
- iniziare a scrivere la configurazione pensando ai moduli. Anche per configurazioni Terraform di media complessità gestite da una sola persona, i vantaggi dei moduli superano il tempo necessario a usarli correttamente;
- usare i moduli locali per organizzare e incapsulare il codice. Anche senza usare o pubblicare moduli remoti, organizzare fin dall'inizio la configurazione in moduli riduce molto il lavoro di manutenzione e aggiornamento man mano che l'infrastruttura cresce in complessità;
- usare il Terraform Registry pubblico per trovare moduli utili. Ci si appoggia al lavoro di altri per gli scenari infrastrutturali comuni, e così si implementa la configurazione più in fretta e con più sicurezza;
- pubblicare e condividere i moduli con il team. La maggior parte dell'infrastruttura è gestita da un team di persone, e i moduli sono un modo importante per collaborare nel creare e mantenere l'infrastruttura. I moduli si possono pubblicare in modo pubblico o privato. Chi li usa può fare riferimento ai moduli figli pubblicati in un modulo root, oppure distribuire moduli no-code ready dall'interfaccia di HCP Terraform.

> **Nota**: la pagina originale dice "Name your provider", ma la convenzione `terraform-<PROVIDER>-<NAME>` riguarda il nome del modulo, cioè del suo repository.
_(infoBox)_

- Fonte: [Modules overview (tutorial)](https://developer.hashicorp.com/terraform/tutorials/modules/module)

---

## 5.3 — Usare i moduli del registry nella configurazione

Nel tutorial precedente si è visto quando e perché usare i moduli Terraform. In questo tutorial si usano i moduli del Terraform Registry pubblico per creare un ambiente di esempio su AWS, facendo riferimento ai moduli nella configurazione Terraform. I concetti visti valgono per qualsiasi modulo, da qualsiasi sorgente.

### 5.3.1 — Usare il Terraform Registry

La pagina del Terraform Registry del modulo VPC mostra le informazioni sul modulo e un link al repository sorgente. La pagina ha anche un menu per scegliere la versione del modulo, le metriche di utilizzo e una configurazione di esempio.

![Figura 14](img/registry-module-vpc.png) _(dimensioni: 2360×1170 px)_

*Figura 14 — La pagina di un modulo nel Terraform Registry, con le istruzioni d'uso, la scelta della versione e le schede Inputs e Outputs. Fonte: HashiCorp Developer.* _(caption)_

La configurazione di esempio imposta due argomenti, `source` e `version`:

- l'argomento `source` è obbligatorio quando si usa un modulo Terraform. Nella configurazione di esempio, Terraform cerca nel Terraform Registry un modulo che corrisponde alla stringa indicata. Si potrebbe usare anche un URL o un modulo locale; l'elenco completo delle sorgenti possibili è nella sezione 5.6.
- l'argomento `version` non è obbligatorio, ma è fortemente consigliato includerlo quando si usa un modulo Terraform. Per le sorgenti supportate, indica la versione del modulo che Terraform caricherà. Senza `version`, Terraform carica la versione più recente del modulo. Nel tutorial si indica un numero di versione esatto per i moduli usati.

Terraform tratta gli altri argomenti dei blocchi `module` come input variable del modulo.

### 5.3.2 — La configurazione

Il file `terraform.tf` definisce il blocco `terraform`, con cui Terraform configura se stesso. Il blocco richiede il provider aws della release minor v4.49.0, e una versione di Terraform successiva alla v1.1.0:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.49.0"
    }
  }
  required_version = ">= 1.1.0"
}
```

Il file `main.tf` contiene la configurazione delle risorse:

```
provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      hashicorp-learn = "module-use"
    }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.18.1"

  name = var.vpc_name
  cidr = var.vpc_cidr

  azs             = var.vpc_azs
  private_subnets = var.vpc_private_subnets
  public_subnets  = var.vpc_public_subnets

  enable_nat_gateway = var.vpc_enable_nat_gateway

  tags = var.vpc_tags
}

module "ec2_instances" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "4.3.0"

  count = 2
  name  = "my-ec2-cluster-${count.index}"

  ami                    = "ami-0c5204531f799e0c6"
  instance_type          = "t3.micro"
  vpc_security_group_ids = [module.vpc.default_security_group_id]
  subnet_id              = module.vpc.public_subnets[0]

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}
```

La configurazione contiene tre blocchi:

- il blocco `provider "aws"` configura il provider AWS. A seconda del metodo di autenticazione usato, potrebbe servire aggiungere altri argomenti;
- il blocco `module "vpc"` configura un modulo Virtual Private Cloud (VPC), che crea le risorse di rete in base agli argomenti forniti: una VPC, le subnet e i gateway internet e NAT;
- il blocco `module "ec2_instances"` definisce due istanze EC2, create nella VPC del modulo.

### 5.3.3 — Impostare i valori delle input variable del modulo

I moduli possono avere argomenti obbligatori e facoltativi. Per usare il modulo bisogna specificare tutti gli argomenti obbligatori. La maggior parte degli argomenti di un modulo corrisponde alle sue input variable. Gli input facoltativi non definiti esplicitamente usano i valori di default del modulo. Gli input supportati da un modulo sono elencati nella scheda **Inputs** della sua pagina nel Terraform Registry.

Nel blocco `module "ec2_instances"`:

- il meta-argomento `count` definisce due istanze EC2. L'elenco completo dei meta-argomenti dei moduli è nella documentazione dei moduli (sezione 5.6);
- gli argomenti obbligatori `vpc_security_group_ids` e `subnet_id` fanno riferimento a risorse create dal modulo `vpc`. L'elenco completo degli argomenti del modulo `ec2-instance` è nella sua pagina del Terraform Registry.

### 5.3.4 — Le input variable del modulo root

Usare le input variable con i moduli è simile a usare le variabili in qualsiasi configurazione Terraform. Uno schema comune è individuare gli argomenti del modulo che si potrebbe voler cambiare in futuro. Per questi si creano variabili corrispondenti, con default sensati, nel file `variables.tf` della configurazione, e le si passano come argomenti al blocco `module`.

Non tutti gli input del modulo vanno impostati con variabili. Ad esempio, se l'organizzazione richiede il NAT gateway attivo per tutte le VPC, l'argomento `enable_nat_gateway` non va impostato con una variabile. Il file `variables.tf` contiene le dichiarazioni delle input variable, ad esempio:

```
variable "vpc_name" {
  description = "Name of VPC"
  type        = string
  default     = "example-vpc"
}

variable "vpc_azs" {
  description = "Availability zones for VPC"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "vpc_enable_nat_gateway" {
  description = "Enable NAT gateway for VPC"
  type        = bool
  default     = true
}
```

Allo stesso modo sono dichiarate `vpc_cidr`, `vpc_private_subnets`, `vpc_public_subnets` e `vpc_tags`.

### 5.3.5 — Gli output del modulo root

Anche i moduli hanno output value, a cui si fa riferimento con la convenzione `module.MODULE_NAME.OUTPUT_NAME`; nel Terraform Registry sono elencati nella scheda **Outputs** del modulo. Gli output dei moduli si possono usare in altre parti della configurazione. Per default Terraform non mostra gli output dei moduli: bisogna creare un output corrispondente nel modulo root e impostarlo all'output del modulo. Il file `outputs.tf` mostra entrambi i casi:

```
output "vpc_public_subnets" {
  description = "IDs of the VPC's public subnets"
  value       = module.vpc.public_subnets
}

output "ec2_instance_public_ips" {
  description = "Public IP addresses of EC2 instances"
  value       = module.ec2_instances[*].public_ip
}
```

L'output `vpc_public_subnets` fa riferimento all'output `public_subnets` del modulo `vpc`. L'output `ec2_instance_public_ips` fa riferimento agli indirizzi IP pubblici di entrambe le istanze EC2 create dal modulo. Applicando la configurazione si creano la VPC e le istanze EC2, e al termine Terraform mostra gli output. I moduli `vpc` ed `ec2` definiscono più risorse oltre alla VPC e alle istanze EC2.

### 5.3.6 — Come funzionano i moduli

Quando si usa un nuovo modulo per la prima volta, bisogna eseguire `terraform init` o `terraform get` per installarlo. Questi comandi installano i nuovi moduli nella directory `.terraform/modules`, dentro la directory di lavoro della configurazione. Per i moduli locali, Terraform crea un link simbolico alla directory del modulo. Le modifiche ai moduli locali hanno quindi effetto subito, senza reinizializzare o rieseguire `terraform get`. Al termine del tutorial la directory `.terraform/modules` contiene `ec2_instances`, `modules.json` e `vpc`.

- Fonte: [Use registry modules in configuration](https://developer.hashicorp.com/terraform/tutorials/modules/module-use)

---

## 5.4 — Trovare e usare i moduli del Registry

Il Terraform Registry rende semplice trovare e usare i moduli.

### 5.4.1 — Trovare i moduli

Ogni pagina del registry ha un campo di ricerca per trovare i moduli. Si inserisce il tipo di modulo cercato (ad esempio "vault", "vpc", "database"), e il registry elenca i moduli che corrispondono alla query. La ricerca considera il nome del modulo, il provider e la descrizione, e nella pagina dei risultati si possono usare filtri per affinare ulteriormente la ricerca.

Per default il registry elenca tra i risultati tutti i tipi di moduli. Con il filtro **Partner** si limita la ricerca ai soli moduli dei partner, che HashiCorp verifica per garantirne la stabilità e la compatibilità.

### 5.4.2 — Usare i moduli

Il Terraform Registry è integrato direttamente in Terraform, quindi una configurazione Terraform può fare riferimento a qualsiasi modulo pubblicato nel registry. La sintassi per indicare un modulo del registry è `<NAMESPACE>/<NAME>/<PROVIDER>`, ad esempio `hashicorp/consul/aws`. L'integrazione con il registry dei moduli è stata aggiunta in Terraform v0.10.6, e il supporto completo del versioning in v0.11.0.

Visualizzando un modulo nel registry su tablet o desktop, le istruzioni d'uso compaiono sul lato destro, e basta copiarle e incollarle per iniziare. Alcuni moduli hanno input obbligatori da impostare prima di poterli usare. Il comando `terraform init` scarica e mette in cache tutti i moduli a cui fa riferimento una configurazione.

```
module "consul" {
  source = "hashicorp/consul/aws"
  version = "0.1.0"
}
```

**Sorgenti dei moduli di un registry privato** _(stepTitle)_

Si possono usare anche i moduli di un registry privato, come quello offerto da HCP Terraform. Le stringhe sorgente dei moduli di un registry privato hanno la forma `<HOSTNAME>/<NAMESPACE>/<NAME>/<PROVIDER>`: lo stesso formato del registry pubblico, con in più un hostname come prefisso. A seconda del registry, potrebbe servire configurare le credenziali per accedere ai moduli. Le sorgenti dei registry privati sono supportate da Terraform v0.11.0.

```
module "vpc" {
  source = "app.terraform.io/example_corp/vpc/aws"
  version = "0.9.3"
}
```

### 5.4.3 — Le versioni dei moduli

Ogni modulo del registry è versionato, e le versioni devono rispettare la sintassi del versionamento semantico (semantic versioning). Oltre alla sintassi, HashiCorp incoraggia tutti i moduli a seguire tutte le linee guida del versionamento semantico.

Da Terraform 0.11 Terraform risolve i vincoli di versione dei moduli forniti, ed è fortemente consigliato usarli per evitare di importare breaking change. Le versioni di Terraform successive alla 0.10.6 ma precedenti alla 0.11 supportano solo in parte il protocollo del registry: scaricano sempre l'ultima versione invece di rispettare i vincoli di versione.

- Fonte: [Find and use modules](https://developer.hashicorp.com/terraform/registry/modules/use)

---

## 5.5 — Usare i moduli nella configurazione

Questa pagina descrive come integrare i moduli nella configurazione, per riutilizzare gruppi di definizioni di risorse. Il workflow e i concetti chiave dei moduli sono nella sezione 5.1. Per creare moduli figli riutilizzabili si veda la sezione 5.7.

### 5.5.1 — Panoramica

Si possono creare gruppi di risorse definiti in configurazioni riutilizzabili, i moduli. Dopo aver individuato il modulo da usare, lo si integra nella configurazione con questi passi:

1. si aggiunge un blocco `module` alla configurazione, configurandone la sorgente, la versione e gli input obbligatori;
2. se serve, si configurano le risorse del modulo root perché facciano riferimento agli output del modulo figlio;
3. si inizializza il workspace per installare il modulo. Terraform clona la configurazione sorgente del modulo in una sottodirectory nascosta della directory di lavoro del workspace;
4. si applica la configurazione per creare le risorse del modulo.

Integrando i moduli si possono anche trasferire nei moduli lo state delle risorse, ricreare le risorse di un modulo e rimuovere moduli dalla configurazione. Queste operazioni sono descritte più avanti.

### 5.5.2 — Aggiungere un blocco module

Si aggiunge il blocco `module` alla configurazione e se ne configura l'argomento `source`, che dice a Terraform dove trovare i file di configurazione del modulo figlio. Si possono indicare moduli ospitati nel registry Terraform pubblico o in uno privato, in repository Git, in servizi di object storage e nel filesystem locale. A seconda della sorgente si può anche configurare il modo in cui Terraform installa il modulo (sezione 5.6).

### 5.5.3 — Installare una versione specifica del modulo

Con i moduli di un registry si può aggiungere l'argomento `version`, con un vincolo di versione. Con i moduli ospitati in GitHub, BitBucket o un altro repository Git, Terraform clona e usa il branch di default indicato da `HEAD`. Si può aggiungere il parametro di query `ref` alla posizione indicata in `source`, per fare riferimento a qualsiasi valore supportato dal comando `git checkout`, come un branch, un hash SHA-1 o un tag. Nel primo esempio Terraform seleziona la versione del modulo con il tag `v1.2.0` di un repository Git. Nel secondo seleziona il modulo con il suo hash SHA-1:

```
module "vpc" {
  source = "git::https://example.com/vpc.git?ref=v1.2.0"
}

module "storage" {
  source = "git::https://example.com/storage.git?ref=51d462976d84fdea54b47d80dcabbf680badcdb8"
}
```

### 5.5.4 — Usare un clone superficiale

Quando si recuperano i sorgenti dei moduli da repository grandi, si può preferire un clone superficiale (shallow clone), per ridurre il tempo che Terraform impiega a scaricare i file. Si aggiunge all'URL sorgente il parametro di query `depth`, con il numero di commit da includere nel clone.

Il parametro `depth` aggiunge l'opzione `--depth` al comando `git clone`, e Git crea un clone superficiale con solo il numero indicato di commit nella cronologia. Nella maggior parte dei casi va bene impostare `depth` a 1, perché Terraform usa solo il commit selezionato più di recente per trovare il sorgente. Supportano i cloni superficiali i repository GitHub, i repository Git e i repository BitBucket.

### 5.5.5 — Specificare i valori di input

Gli autori dei moduli espongono input, che si configurano come argomenti del blocco `module`. Gli input permettono di personalizzare il comportamento del modulo senza modificarne il codice sorgente. Gli input supportati, compresi quelli obbligatori, sono descritti nella documentazione del modulo. Nell'esempio il modulo si aspetta un valore intero per l'input `servers`:

```
module "servers" {
  source = "./app-cluster"

  servers = 5
}
```

### 5.5.6 — Creare più copie di un modulo

Invece di aggiungere più blocchi alla configurazione, si può far creare a Terraform più istanze delle stesse risorse di un modulo con un solo blocco `module`. Si aggiunge al blocco uno di questi meta-argomenti:

- `count` indica quante istanze del modulo creare, tutte con la stessa configurazione;
- `for_each` itera su un insieme di chiavi, così Terraform crea istanze del modulo simili.

### 5.5.7 — Impostare le dipendenze

Terraform crea in parallelo le risorse dei moduli, ma alcuni moduli possono dipendere dagli output di altre risorse a monte. Se la definizione di un modulo fa riferimento a una risorsa nei propri argomenti, Terraform riconosce la dipendenza implicita e applica le modifiche nell'ordine corretto. Le dipendenze si possono anche configurare esplicitamente con l'argomento `depends_on`. Terraform completa allora tutte le operazioni sulla risorsa a monte prima di operare sul modulo che contiene `depends_on`.

### 5.5.8 — Usare una configurazione del provider alternativa

Per default Terraform applica il provider predefinito in base al tipo di risorsa del modulo. Si possono però creare più configurazioni del provider e usarne una non predefinita per moduli specifici. Per far applicare a Terraform una configurazione del provider alternativa, si aggiunge al blocco `module` l'argomento `providers` (sezione 5.6.3).

### 5.5.9 — Fare riferimento agli output del modulo

Le risorse definite in un modulo formano un gruppo di risorse autonomo. Gli autori dei moduli definiscono di solito degli output, che espongono i valori degli attributi delle risorse create dal modulo. Nel modulo padre si fa riferimento a questi valori con l'espressione `module.<MODULE-NAME>.<OUTPUT-NAME>`; gli output disponibili sono descritti nella documentazione del modulo. Nell'esempio, la risorsa `aws_subnet` usa il valore dell'output con l'ID della VPC del modulo `vpc`:

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.0.1"
}

resource "aws_subnet" "main" {
  vpc_id     = module.vpc.vpc_id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "Main"
  }
}
```

### 5.5.10 — Trasferire lo state delle risorse nei moduli

Quando si riorganizza la configurazione per usare i moduli figli, si possono voler spostare nei moduli figli risorse che erano definite nel modulo root. Terraform è dichiarativo, quindi quando si cambia la configurazione distrugge le risorse esistenti e ne crea di nuove. Per cambiare l'indirizzo di una risorsa e spostarla in un modulo figlio si usa il blocco `moved` (sezione 6.7).

### 5.5.11 — Installare e applicare un modulo

Dopo aver configurato il blocco `module` nel modulo root o chiamante, si esegue `terraform init` per scaricare i file del modulo nella directory di lavoro locale. Se si cambia l'argomento `source`, o l'argomento `version` di un modulo di un registry, bisogna rieseguire `terraform init`. Per i moduli già installati, l'opzione `-upgrade` aggiorna il modulo all'ultima versione ammessa dal vincolo di versione.

Si esegue poi `terraform plan` per vedere in anteprima le modifiche. Quando il piano è soddisfacente, `terraform apply` crea le risorse definite dal modulo.

### 5.5.12 — Ricreare le risorse di un modulo

Per ricreare una risorsa specifica gestita da un modulo si aggiunge al comando `terraform apply` l'opzione `-replace` con l'indirizzo della risorsa. Se la risorsa appartiene a un modulo annidato, bisogna indicare il percorso completo, compreso il modulo annidato. Nell'esempio, Terraform ricrea le risorse `aws_instance.example` gestite dal modulo `example`:

```
$ terraform apply -replace=module.example.aws_instance.example
```

Sostituire le risorse è un'operazione che interrompe il servizio. Con l'opzione `-replace` della CLI si possono selezionare solo singole istanze di risorsa. Per sostituire più risorse con un solo comando si aggiungono più opzioni `-replace`.

### 5.5.13 — Rimuovere i moduli dalla configurazione

Per rimuovere un modulo da Terraform si elimina il blocco `module` dalla configurazione e si esegue `terraform apply`. Per default Terraform distrugge tutte le risorse gestite dal modulo e le rimuove dal file di state.

Un modulo si può anche rimuovere dallo state di Terraform senza distruggere gli oggetti reali che gestisce. Si sostituisce il blocco `module` con un blocco `removed`. Al blocco `removed` si aggiunge un blocco `lifecycle`, con l'argomento `destroy` impostato a `false`. Il blocco `removed` richiede Terraform v1.7 o successivo; nelle versioni precedenti, per rimuovere una risorsa si usa il comando `terraform state rm` della CLI. L'esempio rimuove dallo state di Terraform le risorse di `module.example` senza distruggerle:

```
removed {
  from = module.example

  lifecycle {
    destroy = false
  }
}
```

- Fonte: [Use modules in your configuration](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/configuration)

---

## 5.6 — Il blocco module

Il blocco `module` fa creare a Terraform le risorse definite in un modulo locale o remoto. Un modulo è un insieme di più risorse che Terraform gestisce insieme (sezioni 5.1 e 5.5).

### 5.6.1 — Modello e configurazione completa

Il blocco `module` supporta questa configurazione:

- `module "<LABEL>"` (blocco), con gli input specifici del modulo, alcuni dei quali possono essere obbligatori;
- `source` (stringa), obbligatorio;
- `version` (stringa);
- `count` (numero), mutuamente esclusivo con `for_each`;
- `depends_on` (lista di riferimenti);
- `for_each` (map o set di stringhe), mutuamente esclusivo con `count`;
- `providers` (map).

```
module "<LABEL>" {
  <module-specific-inputs>
  source = "<location-of-module-sources>"
  version = "<constraint>" # only available for modules listed in a registry
  count = <number> # mutually exclusive with `for_each`
  for_each = {          # mutually exclusive with `count`
      <KEY> = <VALUE>
   }
   for_each = [       # `for_each` accepts a map or a set of strings
    "<VALUE>",
    "<VALUE>"
   ]
  providers = {
    "<provider-name-in-child-module>" = "<provider-name-from-parent-module>"
  }
  depends_on = [ <resource.address.reference> ]
}
```

### 5.6.2 — Etichetta, input e source

L'etichetta `LABEL` è il nome locale del modulo. Se il modulo figlio chiamato espone output value, li si usa con la sintassi `module.<label>.<output>`. Gli input che si possono specificare per il modulo li stabilisce il suo sviluppatore; per alcuni moduli uno o più input sono obbligatori.

L'argomento `source` indica dove Terraform recupera il codice sorgente del modulo:

```
module "<LABEL>" {
  source = "<location-of-module-files>"
  #...
}
```

La posizione è un file o una directory locale, oppure una sorgente remota come il Terraform Registry pubblico. Per `source` bisogna indicare una stringa letterale, perché l'argomento non supporta sequenze template né espressioni arbitrarie. Dopo aver modificato `source` bisogna eseguire `terraform init`, perché Terraform aggiorni il codice locale.

Lo stesso indirizzo sorgente si può indicare in due o più blocchi `module` separati, purché ognuno abbia un'etichetta univoca. Così si creano più copie delle risorse del modulo figlio, con configurazioni diverse.

Il codice sorgente di un modulo conservato in un repository o in un archivio, detto pacchetto (package), può trovarsi in una sottodirectory rispetto alla radice del pacchetto. Si aggiunge `//` al percorso sorgente per indicare che il resto del percorso è una sottodirectory del pacchetto. Gli eventuali parametri di query, come l'argomento `ref` delle sorgenti di controllo versione, vanno messi dopo il segmento della sottodirectory. Terraform estrae l'intero pacchetto sul disco locale, ma legge il modulo dalla sottodirectory. Così un modulo in una sottodirectory di un pacchetto può fare riferimento con un percorso locale a un altro modulo dello stesso pacchetto.

**Tipi di sorgente** _(stepTitle)_

Terraform può installare i moduli dai tipi di sorgente descritti di seguito.

**Percorsi locali** _(stepTitle)_

Per installare un modulo da file già presenti sul disco si usa il prefisso `./` o `../` seguito dal percorso del codice sorgente locale del modulo:

```
module "<LABEL>" {
  source = "./<PATH-TO-MODULE>"
  #...
}
```

Terraform riconosce come percorsi assoluti quelli che iniziano con `/` o con una lettera di unità, e copia i moduli indicati con un percorso assoluto nella cache locale dei moduli come pacchetto. HashiCorp sconsiglia di usare percorsi assoluti del filesystem per i moduli, perché legano la configurazione alla struttura del filesystem di un computer specifico.

**Registry Terraform** _(stepTitle)_

Il workflow principale per condividere i moduli tra più configurazioni è distribuirli tramite il Terraform Registry pubblico, o tramite un registry privato di HCP Terraform o Terraform Enterprise. Si può anche creare un registry privato con un servizio personalizzato che implementa il protocollo del registry dei moduli. Il protocollo specifico di Terraform per recuperare i moduli da un registry supporta pienamente il versionamento dei moduli; i dettagli sono nella documentazione del modulo. Per i moduli del Terraform Registry pubblico si usa questa sintassi:

```
module "<LABEL>" {
  source = "<NAMESPACE>/<NAME>/<PROVIDER>"
  #...
}
```

Per i moduli del registry privato di HCP Terraform si aggiunge al percorso il prefisso `app.terraform.io`:

```
module "<LABEL>" {
  source = "app.terraform.io/<NAMESPACE>/<NAME>/<PROVIDER>"
  #...
}
```

Per i moduli del registry privato di Terraform Enterprise si aggiunge al percorso l'hostname dell'installazione:

```
module "<LABEL>" {
  source = "<HOSTNAME>/<NAMESPACE>/<NAME>/<PROVIDER>"
  #...
}
```

Con HCP Terraform e Terraform Enterprise si può indicare anche l'hostname `localterraform.com`, che richiede i moduli all'istanza su cui gira la piattaforma (si veda *Generic hostname*):

```
module "<LABEL>" {
  source = "localterraform.com/<NAMESPACE>/<NAME>/<PROVIDER>"
  #...
}
```

**Repository GitHub** _(stepTitle)_

Per clonare i sorgenti di un modulo da GitHub via HTTPS si usa questa sintassi:

```
module "<LABEL>" {
  source = "github.com/<ORGANIZATION>/<MODULE-FOLDER>"
  #...
}
```

Per clonarli via SSH si usa questa:

```
module "<LABEL>" {
  source = "git:github.com/<ORGANIZATION>/<MODULE-FOLDER>"
  #...
}
```

> **Nota**: la sintassi SSH della specifica, `git:github.com/...`, non corrisponde all'esempio della stessa pagina (sezione 5.6.4), che usa `git@github.com:hashicorp/example.git`. È questa la forma degli indirizzi SSH di GitHub.
_(infoBox)_

**Repository Git** _(stepTitle)_

Per installare un modulo da un repository Git generico si usa il prefisso `git::` seguito da qualsiasi URL Git valido, protocollo compreso. Per ottenere un modulo via SSH si usa questa sintassi:

```
module "<LABEL>" {
  source = "git::ssh://[<user>@]<host>[:<port>]/<path-to-git-repo>"
  #...
}
```

In alternativa, per le connessioni SSH si può usare un URL in stile scp, omettendo `ssh://`:

```
module "<LABEL>" {
  source = "git::[<USER>@]<HOST>/<PATH-TO-GIT-REPO>"
  #...
}
```

Per ottenere un modulo via HTTP, HTTPS, FTP, FTPS e il protocollo Git si usa questa sintassi:

```
module "<LABEL>" {
  source = "git::<protocol>://<host>[:<port>]/<path-to-git-repo>"
  #...
}
```

I dettagli sono nella documentazione degli URL di Git. Per coerenza è consigliato l'URL con prefisso `ssh://`.

**Bitbucket** _(stepTitle)_

Per fare riferimento ai moduli ospitati su BitBucket si usa il prefisso `bitbucket.org`:

```
source = "bitbucket.org/<PATH-TO-MODULE-SOURCES>"
```

BitBucket è un servizio che ospita repository Git, quindi valgono molti dei comportamenti degli altri repository Git.

**Autenticazione e parametri delle sorgenti Git** _(stepTitle)_

Per le sorgenti Git, GitHub e Bitbucket, Terraform installa i moduli con `git clone`, usando la configurazione Git del sistema locale, credenziali comprese. Per accedere a un repository non pubblico bisogna configurare Git con le credenziali adatte. Con le connessioni SSH Terraform usa automaticamente le chiavi SSH. È il modo più comune per accedere a repository non pubblici da sistemi automatici, perché non richiede interazione. Per HTTP, HTTPS e gli altri protocolli che richiedono nome utente e password, la documentazione di Git spiega come fornire le credenziali. Per le operazioni di Terraform in HCP Terraform ci si può autenticare solo con chiavi SSH (si veda *Use SSH keys to clone modules*). Queste sorgenti accettano anche due parametri di query:

- `ref` indica il nome di un branch, un hash SHA-1 completo o breve, o il nome di un tag da clonare. Per default Terraform usa il branch di default indicato da `HEAD` nel repository.
- `depth` fa eseguire a Terraform un clone superficiale, e indica la profondità della cronologia dei commit da includere (default 1). Implementa l'opzione `--depth` di Git. Quando `source` contiene `depth`, Terraform passa `ref` all'opzione `--branch` di `git clone`. Bisogna quindi indicare un branch o un tag con nome noto al repository remoto, non ID di commit grezzi.

**Repository Mercurial** _(stepTitle)_

Per installare moduli conservati in un repository Mercurial si usa il prefisso `hg::` seguito da un URL Mercurial valido. Per i moduli sul filesystem locale si usa questa sintassi:

```
module "<LABEL>"{
  source = "hg::file://local/filesystem/path[#revision]"
  #...
}
```

Per i moduli via HTTP e HTTPS:

```
module "<LABEL>" {
  source = "hg::<PROTOCOL>://[user[:pass]@]host[:port]/[path][#revision]"
  #...
}
```

Per i moduli via SSH:

```
module "<LABEL>" {
  source = "hg::ssh://[user@]host[:port]/[path][#revision]"
  #...
}
```

Per i moduli in un percorso indicato nel file di configurazione di Mercurial:

```
module "<LABEL>" {
  source = "hg::path://pathname"
  #...
}
```

Terraform installa i moduli con `hg clone`, usando la configurazione Mercurial del sistema locale, credenziali comprese. Per accedere a un repository privato bisogna configurare Mercurial con le credenziali adatte. Con le connessioni SSH Terraform usa automaticamente le chiavi SSH: è il modo più comune per accedere a repository Mercurial non pubblici da sistemi automatici, perché non richiede interazione. Se la configurazione gira in HCP Terraform, ci si può autenticare solo con chiavi SSH.

**URL HTTP** _(stepTitle)_

Nell'argomento `source` si può indicare un URL HTTP o HTTPS, per usare URL "di comodo" invece di scrivere a mano nella configurazione percorsi sorgente complessi. Con un URL, Terraform invia una richiesta GET all'URL, e il servizio in ascolto può costruire e restituire un indirizzo sorgente del modulo. Prima della richiesta Terraform aggiunge all'URL il parametro `terraform-get=1`, così il server può restituire un risultato diverso alle richieste di Terraform. Se la risposta ha codice 200, Terraform cerca l'indirizzo sorgente del modulo in questi punti:

- il valore di un campo dell'intestazione della risposta chiamato `X-Terraform-Get`;
- se la risposta è una pagina HTML, un elemento meta chiamato `terraform-get`:

```
<meta name="terraform-get" content="<module-source>" />
```

Terraform interpreta il risultato come indirizzo sorgente, e così può installare il modulo. Quando il servizio in ascolto richiede credenziali, Terraform cerca per default un file `.netrc` nella directory HOME; la variabile d'ambiente `NETRC` ne cambia la posizione. Il formato di `.netrc` è descritto nella documentazione di `curl`.

Se un URL HTTPS ha un'estensione tipica di un formato di archivio, Terraform salta il reindirizzamento `terraform-get=1` e usa il contenuto dell'archivio come codice sorgente del modulo. Le estensioni riconosciute sono `.zip`; `.bz2`, `.tar.bz2`, `.tar.tbz2` e `.tbz2`; `.gz`, `.tar.gz` e `.tgz`; `.xz`, `.tar.xz` e `.txz`. Per altri formati di archivio si aggiunge il parametro di query `archive`. Quando il contenuto dell'archivio è una directory, bisogna includere la directory nella sorgente del modulo, come descritto per l'argomento `source`.

**Bucket S3** _(stepTitle)_

Per installare moduli conservati come archivio in S3 si usa il prefisso `s3::` seguito dall'URL di un oggetto del bucket S3. L'oggetto deve essere un archivio con una delle estensioni elencate sopra, e Terraform lo estrae per ottenere l'albero sorgente del modulo. I bucket della region `us-east-1` devono usare l'hostname `s3.amazonaws.com`, non `s3-us-east-1.amazonaws.com`. Il programma di installazione usa la catena predefinita di provider di credenziali dell'AWS SDK. In ordine di precedenza, cerca:

1. le variabili d'ambiente `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY`, oppure `AWS_PROFILE`, che seleziona un profilo con nome;
2. il file di credenziali condiviso `~/.aws/credentials`;
3. il file di configurazione condiviso `~/.aws/config`, comprese le configurazioni SSO e assume-role;
4. le credenziali del container o dell'instance profile EC2 (IMDS), quando si gira su risorse di calcolo AWS.

Le credenziali si possono anche passare direttamente nell'URL sorgente, con parametri di query:

- `aws_profile` indica un profilo con nome della configurazione condivisa, ad esempio `s3::https://bucket.s3.amazonaws.com/module.zip?aws_profile=dev`;
- `aws_access_key_id`, `aws_access_key_secret` e `aws_access_token` passano credenziali statiche nell'URL. Non vanno incluse nel controllo versione.

Altri servizi AWS possono gestire l'autenticazione in modo simile all'API di S3, quindi il formato `s3::` può funzionare anche con altri servizi.

**Bucket GCS** _(stepTitle)_

Per installare moduli conservati come archivi in Google Cloud Storage si usa il prefisso `gcs::` seguito dall'URL di un oggetto del bucket GCS:

```
module "<LABEL>" {
  source = "gcs::https://www.googleapis.com/storage/v1/BUCKET_NAME/PATH_TO_MODULE"
  #...
}
```

Per i moduli in un archivio conservato in un bucket GCS si usa questa sintassi:

```
module "<LABEL>" {
  source = "gcs::https://www.googleapis.com/storage/v1/BUCKET_NAME/PATH/TO/module.zip"
  #...
}
```

Il programma di installazione dei moduli si autentica con GCS tramite il Google Cloud SDK. Le credenziali di Google Cloud Platform si possono impostare in uno di questi modi:

- impostare la variabile d'ambiente `GOOGLE_OAUTH_ACCESS_TOKEN` a un token di accesso OAuth di Google Cloud Platform;
- indicare il percorso del file della chiave del service account nella variabile d'ambiente `GOOGLE_APPLICATION_CREDENTIALS`;
- se Terraform gira su un'istanza GCE, le credenziali di default sono disponibili automaticamente (si veda la documentazione di GCE);
- sul proprio computer, rendere disponibile la propria identità Google con il comando `gcloud auth application-default login`.

> **Nota**: in due modelli di sintassi della pagina originale ci sono refusi, corretti qui sopra: nel modello `localterraform.com` c'è un apice in più dopo `<PROVIDER>`, e nel modello Mercurial via HTTP manca la virgoletta di chiusura.
_(infoBox)_

### 5.6.3 — version, count, for_each, providers e depends_on

L'argomento `version` indica quale versione del modulo usare, e vale solo quando si installano moduli da un registry:

```
module "LABEL" {
  version = "<version-constraint>"
}
```

L'argomento accetta una stringa di vincolo di versione. Terraform usa la versione installata più recente che soddisfa il vincolo. Se non è installata una versione accettabile, scarica la versione più recente che lo soddisfa. Per default usa l'ultima versione disponibile nella sorgente.

È consigliato vincolare esplicitamente i numeri di versione accettabili, per evitare modifiche inattese o indesiderate. `version` si può usare solo quando `source` punta a un modulo di un registry, come il Terraform Registry pubblico o il registry privato dei moduli di HCP Terraform. Dopo aver modificato `version` bisogna eseguire `terraform init`, perché Terraform aggiorni il codice locale. I meccanismi di versionamento specifici di un modulo sono descritti nella sua documentazione. I moduli caricati da percorsi locali non supportano `version`. Vengono infatti caricati dallo stesso repository sorgente e hanno sempre la stessa versione del chiamante.

Gli altri argomenti sono meta-argomenti, che fanno parte del linguaggio Terraform e controllano il modo in cui Terraform crea le risorse:

- `count` fa creare più istanze dello stesso modulo, con configurazione identica o simile, e non si può usare insieme a `for_each`:

```
module "<LABEL>" {
  count = <number>
}
```

- `for_each` fa creare moduli simili senza un blocco separato per ognuno, a partire da un set o da una map:

```
module "<LABEL>" {
  for_each = [ "<VALUE>" ]
}
```

```
module "<LABEL>" {
  for_each = {
    "<KEY>" = "<VALUE>"
  }
}
```

- `providers` fa usare una configurazione del provider alternativa:

```
module "<LABEL>" {
  providers = {
   <provider> = <provider>.<alias>
  }
}
```

- `depends_on` specifica una risorsa a monte da cui il modulo dipende. Terraform completa tutte le operazioni su quella risorsa prima di operare sul modulo che contiene `depends_on`:

```
module "<LABEL>" {
  depends_on = [ <resource reference> ]
}
```

### 5.6.4 — Esempi

**Sorgenti in sottodirectory** _(stepTitle)_

Nei seguenti esempi Terraform prende il modulo da una sottodirectory, indicata con `//`, rispettivamente:

- di un modulo del registry;
- di un repository Git;
- di un repository Git con il tag `v1.2.0`;
- di un archivio;
- di un archivio in un bucket S3;
- di un repository GitHub, con il tag `v1.2.0`.

```
module "consul" {
  source = "hashicorp/consul/aws//modules/consul-cluster"
}

module "vpc" {
  source = "git::https://example.com/network.git//modules/vpc"
}

module "vpc" {
  source = "git::https://example.com/network.git//modules/vpc?ref=v1.2.0"
}

module "vpc" {
  source = "https://example.com/network-module.zip//modules/vpc"
}

module "vpc" {
  source = "s3::https://s3-eu-west-1.amazonaws.com/examplecorp-terraform-modules/network.zip//modules/vpc"
}

module "vpc" {
  source = "github.com/hashicorp/example//modules/vpc?ref=v1.2.0"
}
```

> **Nota**: negli esempi della pagina originale con il tag `v1.2.0`, sia quello Git sia quello GitHub, c'è un apice inverso in più dopo la virgoletta di chiusura, qui tolto. Nel testo dell'esempio sulla profondità del clone il tag è scritto `v1.2.01`, mentre il codice usa `v1.2.0`.
_(infoBox)_

**Posizioni dei sorgenti** _(stepTitle)_

Ecco esempi di sorgenti di vari tipi:

- un modulo locale: `source = "./consul"`;
- un modulo del registry pubblico: `source = "hashicorp/consul/aws"` con `version = "0.1.0"`;
- un modulo del registry privato di HCP Terraform: `source = "app.terraform.io/example-corp/k8s-cluster/azurerm"` con `version = "1.1.0"`;
- GitHub via HTTPS: `source = "github.com/hashicorp/example"`;
- GitHub via SSH: `source = "git@github.com:hashicorp/example.git"`;
- un repository Git via HTTP: `source = "git::https://example.com/vpc.git"`;
- un repository Git via SSH: `source = "git::ssh://username@example.com/storage.git"`, o con la sintassi in stile scp `source = "git::username@example.com:storage.git"`;
- BitBucket: `source = "bitbucket.org/hashicorp/terraform-consul-aws"`;
- Mercurial: `source = "hg::http://example.com/vpc.hg"`;
- un URL HTTPS con un archivio: `source = "https://example.com/vpc-module.zip"`, oppure, per estensioni non supportate in modo nativo, `source = "https://example.com/vpc-module?archive=zip"`;
- un bucket S3: `source = "s3::https://s3-eu-west-1.amazonaws.com/examplecorp-terraform-modules/vpc.zip"`;
- un bucket GCS: `source = "gcs::https://www.googleapis.com/storage/v1/modules/foomodule.zip"`.

**Revisioni, versioni e profondità del clone** _(stepTitle)_

Con `?ref=` si clona una revisione specifica: il tag `v1.2.0` di un repository Git (`git::https://example.com/vpc.git?ref=v1.2.0`), un hash SHA-1, o un tag di un repository Mercurial (`hg::http://example.com/vpc.hg?ref=v1.2.0`). Nel registry, invece, si usa l'argomento `version`. Il primo esempio seguente installa la versione 0.10.0 o successiva del modulo Consul per AWS. Il secondo clona da un repository Git solo il commit più recente del tag `v1.2.0`:

```
module "consul" {
  source  = "hashicorp/consul/aws"
  version = ">= 0.10.0"

  servers = 3
}

module "vpc" {
  source = "git::https://example.com/vpc.git?depth=1&ref=v1.2.0"
}
```

**Più istanze delle risorse di un modulo** _(stepTitle)_

Per creare più istanze delle risorse di un modulo si usa `count` o `for_each`. `count` è più adatto a istanze identiche o quasi identiche. `for_each` è più adatto a istanze con configurazioni diverse, prese da una map o da un set. Nel primo esempio Terraform crea tre istanze EC2, ognuna con un nome univoco preso dalla lista `instance_names`. Nel secondo crea un'istanza EC2 per ogni chiave di `local.instance_configs`, personalizzandone le proprietà:

```
locals {
  instance_names = ["example-instance-1", "example-instance-2", "example-instance-3"]
}

module "ec2_instance" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "6.0.2"
  count   = length(local.instance_names)

  name           = local.instance_names[count.index]
  ami            = data.aws_ami.latest_amazon_linux.id
  instance_type  = "t2.micro"

  depends_on = [aws_s3_bucket.example]
}
```

```
locals {
  instance_configs = {
    "example-instance-1" = { instance_type = "t2.micro" }
    "example-instance-2" = { instance_type = "t2.small" }
    "example-instance-3" = { instance_type = "t2.medium" }
  }
}

module "ec2_instance" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "6.0.2"
  for_each = local.instance_configs

  name           = each.key
  ami            = data.aws_ami.latest_amazon_linux.id
  instance_type  = each.value.instance_type

  depends_on = [aws_s3_bucket.example]
}
```

**Specificare le dipendenze** _(stepTitle)_

Nell'esempio seguente Terraform crea il modulo dell'istanza EC2 solo dopo aver creato la risorsa bucket S3:

```
resource "aws_s3_bucket" "example" {
  bucket = "my-example-bucket-12345"
}

module "ec2_instance" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "6.0.2"
  name    = "example-instance"
  ami           = data.aws_ami.latest_amazon_linux.id
  instance_type = "t2.micro"

  depends_on = [aws_s3_bucket.example]
}
```

**Configurazioni del provider diverse per le risorse del modulo** _(stepTitle)_

Nell'esempio il modulo `tunnel` contiene risorse con una propria configurazione del provider. Ogni alias del provider nel modulo corrisponde quindi a una diversa configurazione del provider dichiarata nel modulo root:

```
provider "aws" {
  alias  = "usw1"
  region = "us-west-1"
}

provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}

module "tunnel" {
  source    = "./tunnel"
  providers = {
    aws.src = aws.usw1
    aws.dst = aws.usw2
  }
}
```

- Fonte: [module block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/module)

---

## 5.7 — Creare e usare un modulo locale

Nel tutorial precedente si sono usati moduli del Terraform Registry per creare una VPC e un'istanza EC2 in AWS. Usare correttamente i moduli esistenti è un'abilità importante, ma a ogni professionista di Terraform serve anche saperli creare. HashiCorp raccomanda anzi di creare ogni configurazione Terraform presupponendo che possa essere usata come modulo. Così le configurazioni vengono progettate per essere flessibili, riutilizzabili e componibili.

Terraform tratta ogni configurazione come un modulo. Quando si eseguono i comandi di Terraform, o si usa HCP Terraform o Terraform Enterprise per eseguire Terraform in remoto, la directory di destinazione con la configurazione è trattata come modulo root. Nel tutorial si crea un modulo per gestire i bucket AWS S3 usati per ospitare siti web statici.

### 5.7.1 — La struttura di un modulo

Terraform tratta come modulo qualsiasi directory locale indicata nell'argomento `source` di un blocco `module`. Una struttura tipica dei file per un nuovo modulo è questa:

```
.
├── LICENSE
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
```

Nessuno di questi file è obbligatorio, né ha un significato speciale per Terraform quando usa il modulo. Si può creare un modulo con un solo file `.tf`, o con qualsiasi altra struttura di file. Ogni file ha però uno scopo:

- `LICENSE` contiene la licenza con cui il modulo viene distribuito. Quando si condivide il modulo, fa sapere a chi lo usa a quali condizioni è reso disponibile. Terraform non usa questo file.
- `README.md` contiene, in formato markdown, la documentazione su come usare il modulo. Terraform non lo usa, ma servizi come il Terraform Registry e GitHub ne mostrano il contenuto a chi visita la pagina del modulo.
- `main.tf` contiene l'insieme principale della configurazione del modulo. Si possono creare anche altri file di configurazione, organizzati come ha senso per il progetto.
- `variables.tf` contiene le definizioni delle variabili del modulo. Quando altri usano il modulo, le variabili si configurano come argomenti del blocco `module`. Tutti i valori di Terraform devono essere definiti, quindi le variabili senza un valore di default diventano argomenti obbligatori. Anche le variabili con default si possono passare come argomenti del modulo, sovrascrivendo il default.
- `outputs.tf` contiene le definizioni degli output del modulo. Gli output del modulo sono disponibili alla configurazione che usa il modulo. Si usano spesso per passare informazioni sulle parti dell'infrastruttura definite dal modulo ad altre parti della configurazione.

Ci sono anche altri file da conoscere, che non vanno distribuiti con il modulo:

- `terraform.tfstate` e `terraform.tfstate.backup` contengono lo state di Terraform, con cui Terraform tiene traccia della relazione tra la configurazione e l'infrastruttura creata.
- la directory `.terraform` contiene i moduli e i plugin usati per creare l'infrastruttura. Questi file sono specifici di una particolare istanza di Terraform che crea l'infrastruttura, non della configurazione definita nei file `.tf`.
- i file `*.tfvars` non vanno distribuiti con il modulo, perché le input variable di un modulo si impostano con gli argomenti del blocco `module`. Fa eccezione il caso in cui il modulo si usa anche come configurazione Terraform autonoma.

Se si tiene traccia delle modifiche al modulo in un sistema di controllo versione come git, bisogna configurarlo perché ignori questi file. Un esempio è il file `.gitignore` di GitHub.

> **Attenzione**: i file appena elencati contengono spesso informazioni segrete, come password o chiavi di accesso. Se vengono inclusi in un sistema di controllo versione pubblico come GitHub, quelle informazioni diventano pubbliche.
_(infoBox)_

### 5.7.2 — Creare un modulo

Il tutorial parte dalla configurazione creata nel tutorial sull'uso dei moduli (sezione 5.3), inizializzata con `terraform init`. Dentro la configurazione esistente si crea un sottomodulo locale che usa la risorsa bucket S3 del provider AWS. Nella directory della configurazione si crea una directory `modules`, con al suo interno una directory `aws-s3-static-website-bucket`:

```
$ mkdir -p modules/aws-s3-static-website-bucket
```

Ospitare un sito web statico su S3 è un caso d'uso piuttosto comune. Capire la configurazione corretta per creare un bucket di questo tipo non è troppo difficile. Incapsularla in un modulo però offre agli utenti un modo semplice e veloce per creare bucket per siti web statici che rispettano le best practice. Il nome del modulo inoltre può descrivere esattamente a cosa servono i bucket creati: qui il modulo `aws-s3-static-website-bucket` crea bucket S3 che ospitano siti web statici.

**README.md e LICENSE** _(stepTitle)_

Terraform non usa per niente i file `README.md` e `LICENSE`. L'esempio li include per mostrare una best practice. Il `README.md` del modulo descrive il modulo:

```
# AWS S3 static website bucket

This module provisions AWS S3 buckets configured for static website hosting.
```

Scegliere la licenza corretta esula dagli scopi del tutorial, che usa la licenza open source Apache 2.0. Nessuno dei due file è richiesto o usato da Terraform. Averli è una best practice per i moduli che un giorno potrebbero essere condivisi con altri.

### 5.7.3 — Aggiungere la configurazione del modulo

Nella directory `aws-s3-static-website-bucket` si lavora con tre file di configurazione Terraform: `main.tf`, `variables.tf` e `outputs.tf`. Se si è usato il repository git i file esistono già, altrimenti li si crea vuoti. La struttura della directory del modulo diventa questa:

```
modules
└── aws-s3-static-website-bucket
    ├── LICENSE
    ├── README.md
    ├── main.tf
    ├── outputs.tf
    ├── variables.tf
    └── www
```

In `main.tf` si aggiunge una risorsa bucket S3:

```
resource "aws_s3_bucket" "s3_bucket" {
  bucket = var.bucket_name

  tags = var.tags
}

resource "aws_s3_bucket_website_configuration" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_acl" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id

  acl = "public-read"
}

resource "aws_s3_bucket_policy" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource = [
          aws_s3_bucket.s3_bucket.arn,
          "${aws_s3_bucket.s3_bucket.arn}/*",
        ]
      },
    ]
  })
}
```

Questa configurazione crea un bucket S3 pubblico, che ospita un sito web con una pagina index e una pagina di errore. Nella configurazione non c'è nessun blocco `provider`. Quando elabora un blocco `module`, Terraform eredita il provider dalla configurazione che lo contiene. Per questo è consigliato non includere blocchi `provider` nei moduli.

**Le variabili del modulo** _(stepTitle)_

Come il modulo root della configurazione, anche i moduli definiscono e usano variabili. In `variables.tf` si definiscono queste variabili:

```
# Input variable definitions

variable "bucket_name" {
  description = "Name of the s3 bucket. Must be unique."
  type        = string
}

variable "tags" {
  description = "Tags to set on the bucket."
  type        = map(string)
  default     = {}
}
```

Le variabili dentro i moduli funzionano quasi esattamente come nel modulo root. Quando si esegue un comando di Terraform sulla configurazione root, i valori delle variabili si impostano in vari modi, ad esempio dalla riga di comando o con un file `.tfvars`. Quando si usa un modulo, invece, le variabili si impostano passando argomenti al modulo nella configurazione. Le variabili dichiarate nei moduli senza valore di default sono obbligatorie, e vanno impostate ogni volta che si usa il modulo.

Quando si crea un modulo, bisogna decidere quali argomenti delle risorse esporre agli utenti finali come input variable. Ad esempio, si potrebbero esporre come variabili i documenti index ed error. Non conviene invece dichiarare una variabile per l'ACL, perché per ospitare un sito web l'ACL del bucket deve essere `public-read`.

**Gli output del modulo** _(stepTitle)_

Bisogna anche decidere quali valori esporre come output, perché gli output sono l'unico modo supportato per ottenere informazioni sulle risorse configurate dal modulo. In `outputs.tf` si aggiungono gli output del modulo:

```
# Output variable definitions

output "arn" {
  description = "ARN of the bucket"
  value       = aws_s3_bucket.s3_bucket.arn
}

output "name" {
  description = "Name (id) of the bucket"
  value       = aws_s3_bucket.s3_bucket.id
}

output "domain" {
  description = "Domain name of the bucket"
  value       = aws_s3_bucket_website_configuration.s3_bucket.website_domain
}
```

Come le variabili, anche gli output dei moduli svolgono la stessa funzione che hanno nel modulo root, ma vi si accede in modo diverso. Dalla configurazione che chiama il modulo, a un output del modulo si accede con la sintassi `module.<MODULE NAME>.<OUTPUT NAME>`. Gli output dei moduli sono attributi di sola lettura.

**Chiamare il modulo dal modulo root** _(stepTitle)_

Ora si torna al `main.tf` del modulo root e si aggiunge un riferimento al nuovo modulo. I nomi dei bucket S3 di AWS devono essere univoci a livello globale. Bisogna quindi sostituire `<UNIQUE BUCKET NAME>` con un nome univoco e valido, e di solito il proprio nome con la data va bene (ad esempio `robin-example-2020-01-15`):

```
module "website_s3_bucket" {
  source = "./modules/aws-s3-static-website-bucket"

  bucket_name = "<UNIQUE BUCKET NAME>"

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}
```

L'esempio passa al modulo gli argomenti `bucket_name` e `tags`, che forniscono i valori delle variabili corrispondenti di `modules/aws-s3-static-website-bucket/variables.tf`.

**Definire gli output nel modulo root** _(stepTitle)_

Gli output aggiunti al modulo `aws-s3-static-website-bucket` rendono quei valori disponibili alla configurazione del modulo root. Nel file `outputs.tf` della directory del modulo root, non in quello del modulo, si aggiungono altri output per il bucket S3:

```
# Output variable definitions

output "vpc_public_subnets" {
  description = "IDs of the VPC's public subnets"
  value       = module.vpc.public_subnets
}

output "ec2_instance_public_ips" {
  description = "Public IP addresses of EC2 instances"
  value       = module.ec2_instances[*].public_ip
}

output "website_bucket_arn" {
  description = "ARN of the bucket"
  value       = module.website_s3_bucket.arn
}

output "website_bucket_name" {
  description = "Name (id) of the bucket"
  value       = module.website_s3_bucket.name
}

output "website_bucket_domain" {
  description = "Domain name of the bucket"
  value       = module.website_s3_bucket.domain
}
```

### 5.7.4 — Installare il modulo locale

Ogni volta che si aggiunge un nuovo modulo a una configurazione, Terraform deve installarlo prima di poterlo usare. Sia `terraform get` sia `terraform init` installano e aggiornano i moduli. `terraform init` inizializza anche i backend e installa i plugin. Nel tutorial si installa il modulo con `terraform get`.

> **Nota**: quando installa un modulo remoto, Terraform lo scarica nella directory `.terraform` della directory root della configurazione. Quando installa un modulo locale, invece, fa riferimento direttamente alla directory sorgente. Per questo Terraform vede automaticamente le modifiche ai moduli locali, senza rieseguire `terraform init` o `terraform get`.
_(infoBox)_

Con il nuovo modulo installato e configurato, `terraform apply` crea il bucket e le altre risorse.

> **Nota**: l'apply crea anche le istanze EC2 del tutorial precedente. A fine tutorial va eseguito `terraform destroy` per rimuoverle, altrimenti potrebbero essere addebitate.
_(infoBox)_

### 5.7.5 — Caricare i file nel bucket

Ora si è configurato e usato un proprio modulo per creare un sito web statico. Il bucket però è vuoto, quindi visitando il sito non si vedrebbe niente. Per vedere dei contenuti bisogna caricare oggetti nel bucket. Si può caricare il contenuto della directory `www` del repository con la console AWS o con lo strumento da riga di comando AWS:

```
$ aws s3 cp modules/aws-s3-static-website-bucket/www/ s3://$(terraform output -raw website_bucket_name)/ --recursive
```

Il dominio del sito compare dopo l'ultimo `terraform apply`, o con `terraform output`. Visitandolo in un browser si vede il contenuto del sito:

```
https://<YOUR BUCKET NAME>.s3-us-west-2.amazonaws.com/index.html
```

- Fonte: [Build and use a local module](https://developer.hashicorp.com/terraform/tutorials/modules/module-create)

---

## 5.8 — La struttura standard dei moduli

La struttura standard dei moduli è un layout di file e directory che HashiCorp raccomanda per i moduli riutilizzabili distribuiti in repository separati. Gli strumenti di Terraform sono costruiti per capire questa struttura e usarla per generare la documentazione, indicizzare i moduli per il registry e altro ancora.

La struttura standard prevede il layout documentato qui sotto. L'elenco può sembrare lungo, ma a parte il modulo root tutto è facoltativo, e la maggior parte dei moduli non deve fare nessun lavoro in più per seguire la struttura standard.

- **Modulo root**: è l'unico elemento obbligatorio della struttura standard. I file Terraform devono trovarsi nella directory principale del repository. Il modulo root deve essere il punto di ingresso principale del modulo, e ci si aspetta che sia "opinionated". Per il modulo Consul, ad esempio, il modulo root crea un cluster Consul completo. Fa però molte ipotesi, e ci si aspetta che gli utenti avanzati usino specifici moduli annidati per controllare con più precisione ciò che vogliono.
- **README**: il modulo root e tutti i moduli annidati dovrebbero avere un file README, chiamato `README` o `README.md`; il secondo viene trattato come markdown. Deve contenere una descrizione del modulo e di come va usato. Un esempio di uso insieme ad altre risorse va messo in una directory `examples`. Conviene includere un diagramma delle risorse che il modulo può creare e delle loro relazioni. Il README non deve documentare input e output del modulo, perché gli strumenti li generano automaticamente. Se si collega un file o si incorpora un'immagine del repository, va usato un URL assoluto legato a un commit specifico, perché il link non punti in futuro alla versione sbagliata della risorsa.
- **LICENSE**: la licenza con cui il modulo è disponibile. Se si pubblica un modulo in modo pubblico, molte organizzazioni non lo adotteranno senza una licenza chiara. HashiCorp raccomanda di avere sempre un file di licenza, anche se non è una licenza open source.
- **main.tf, variables.tf, outputs.tf**: sono i nomi di file raccomandati per un modulo minimo, anche se vuoti. `main.tf` deve essere il punto di ingresso principale. In un modulo semplice può contenere la creazione di tutte le risorse. In un modulo complesso la creazione delle risorse può essere divisa in più file, ma le chiamate ai moduli annidati devono stare nel file principale. `variables.tf` e `outputs.tf` contengono rispettivamente le dichiarazioni delle variabili e degli output.
- **Descrizioni di variabili e output**: tutte le variabili e gli output devono avere una descrizione di una o due frasi che ne spieghi lo scopo, usata per la documentazione.
- **Moduli annidati**: i moduli annidati devono trovarsi nella sottodirectory `modules/`. Un modulo annidato con un `README.md` è considerato utilizzabile da un utente esterno; senza README, è considerato solo per uso interno. Sono indicazioni puramente consultive, perché Terraform non impedisce di usare i moduli interni.

I moduli annidati servono a dividere un comportamento complesso in più moduli piccoli, che gli utenti avanzati possono scegliere con cura. Ad esempio, il modulo Consul ha un modulo annidato per creare il cluster, separato da quello che configura le policy IAM necessarie. Così l'utente può usare le proprie scelte di policy IAM.

Se il modulo root chiama moduli annidati, deve usare percorsi relativi come `./modules/consul-cluster`. Così Terraform li considera parte dello stesso repository o pacchetto, invece di scaricarli di nuovo separatamente. Se un repository o un pacchetto contiene più moduli annidati, idealmente il chiamante dovrebbe poterli comporre, invece di farli chiamare direttamente tra loro creando un albero di moduli profondamente annidato.

Gli esempi d'uso del modulo devono trovarsi nella sottodirectory `examples/` alla radice del repository. Ogni esempio può avere un README che ne spiega lo scopo e l'uso, e anche gli esempi dei sottomoduli vanno messi nella directory `examples/` di primo livello. Gli esempi vengono spesso copiati in altri repository per essere personalizzati. Per questo nei blocchi `module` degli esempi `source` deve essere l'indirizzo che userebbe un chiamante esterno, non un percorso relativo.

Il modulo root è l'unico elemento obbligatorio, ma come minimo è raccomandata la struttura seguente:

```
$ tree minimal-module/
.
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
```

Ecco invece un esempio completo di modulo con la struttura standard, con tutti gli elementi facoltativi. È quindi il modulo più complesso possibile:

```
$ tree complete-module/
.
├── README.md
├── main.tf
├── variables.tf
├── outputs.tf
├── ...
├── modules/
│   ├── nestedA/
│   │   ├── README.md
│   │   ├── variables.tf
│   │   ├── main.tf
│   │   ├── outputs.tf
│   ├── nestedB/
│   ├── .../
├── examples/
│   ├── exampleA/
│   │   ├── main.tf
│   ├── exampleB/
│   ├── .../
```

- Fonte: [Standard module structure](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/develop/structure)

---

## 5.9 — I provider nei moduli

In una configurazione con più moduli ci sono alcune considerazioni particolari su come le risorse vengono associate alle configurazioni dei provider.

Ogni risorsa della configurazione deve essere associata a una configurazione del provider. A differenza della maggior parte dei concetti di Terraform, le configurazioni dei provider sono globali per l'intera configurazione Terraform e si possono condividere oltre i confini dei moduli. Le configurazioni dei provider si possono definire solo in un modulo root di Terraform.

I provider si passano ai moduli discendenti in due modi: implicitamente, per ereditarietà, oppure esplicitamente, con l'argomento `providers` del blocco `module`. Le due opzioni sono descritte nelle sezioni seguenti.

Un modulo pensato per essere chiamato da altri moduli non deve contenere blocchi `provider`. Un modulo con proprie configurazioni dei provider non è compatibile con gli argomenti `for_each`, `count` e `depends_on`, introdotti in Terraform v0.13.

Le configurazioni dei provider vengono usate per tutte le operazioni sulle risorse associate, compresi la distruzione degli oggetti remoti e il refresh dello state. Nello state, Terraform conserva per ogni risorsa un riferimento alla configurazione del provider usata più di recente per applicarvi modifiche. Quando un blocco resource viene rimosso dalla configurazione, Terraform usa questo riferimento per trovare la configurazione giusta, perché l'eventuale argomento `provider` della risorsa non è più nella configurazione.

Di conseguenza, prima di poter rimuovere dalla configurazione il blocco di una configurazione del provider, bisogna distruggere tutte le risorse che le appartengono. Se Terraform trova nello state un'istanza di risorsa il cui blocco di configurazione del provider non è più disponibile, dà errore durante il plan e chiede di reintrodurre la configurazione del provider.

### 5.9.1 — Vincoli di versione dei provider nei moduli

Le configurazioni dei provider sono condivise tra i moduli, ma ogni modulo deve dichiarare i propri requisiti dei provider. Così Terraform può garantire che esista un'unica versione del provider compatibile con tutti i moduli della configurazione. I requisiti specificano anche l'indirizzo sorgente, che fa da identificatore globale del provider, indipendente dal modulo. Per dichiarare che un modulo richiede versioni particolari di un provider si usa un blocco `required_providers` dentro un blocco `terraform`:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 2.7.0"
    }
  }
}
```

Un requisito del provider dice, ad esempio, "questo modulo richiede la versione v2.7.0 del provider hashicorp/aws e lo chiamerà aws". Non specifica però le impostazioni di configurazione che determinano a quali endpoint remoti accede il provider, come una region AWS. Quelle impostazioni vengono dalle configurazioni dei provider, e una configurazione Terraform può avere diverse configurazioni per lo stesso provider.

### 5.9.2 — Alias dei provider nei moduli

Per dichiarare più nomi di configurazione per un provider dentro un modulo si aggiunge l'argomento `configuration_aliases`:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 2.7.0"
      configuration_aliases = [ aws.alternate ]
    }
  }
}
```

Questi requisiti sono identici ai precedenti, con in più il nome di configurazione alias `aws.alternate`, che le risorse possono usare con l'argomento `provider`.

Se si scrive un modulo Terraform condiviso, va vincolata solo la versione minima richiesta del provider, con un vincolo `>=`. Deve indicare la versione minima che contiene le funzionalità usate dal modulo. Così chi usa il modulo può scegliere una versione più recente del provider, se altre parti della sua configurazione hanno bisogno di altre funzionalità.

### 5.9.3 — L'ereditarietà implicita dei provider

Per comodità nelle configurazioni semplici, un modulo figlio eredita automaticamente le configurazioni predefinite dei provider dal modulo padre. I blocchi `provider` espliciti compaiono quindi solo nel modulo root. I moduli a valle possono semplicemente dichiarare risorse di quel provider, e le risorse vengono associate automaticamente alle configurazioni del provider del modulo root. Ad esempio, il modulo root potrebbe contenere solo un blocco `provider` e un blocco `module` che istanzia un modulo figlio:

```
provider "aws" {
  region = "us-west-1"
}

module "child" {
  source = "./child"
}
```

Il modulo figlio può quindi usare qualsiasi risorsa di questo provider senza altra configurazione del provider:

```
resource "aws_s3_bucket" "example" {
  bucket = "provider-inherit-example"
}
```

Questo approccio è consigliato quando basta una sola configurazione per ogni provider in tutta la configurazione.

> **Nota**: i moduli figli ereditano solo le configurazioni dei provider, non i requisiti di sorgente o di versione. Ogni modulo deve dichiarare i propri requisiti dei provider, e questo è particolarmente importante per i provider non di HashiCorp.
_(infoBox)_

In situazioni più complesse possono esserci più configurazioni dei provider, oppure un modulo figlio può aver bisogno di impostazioni del provider diverse da quelle del padre. In questi casi bisogna passare i provider esplicitamente.

### 5.9.4 — Passare i provider esplicitamente

Può capitare che ogni modulo figlio abbia bisogno di una configurazione diversa di un provider, o che un modulo figlio richieda una configurazione del provider diversa da quella del padre. In questi casi si usa l'argomento `providers` del blocco `module`, per definire esplicitamente quali configurazioni dei provider sono disponibili per il modulo figlio:

```
# The default "aws" configuration is used for AWS resources in the root
# module where no explicit provider instance is selected.
provider "aws" {
  region = "us-west-1"
}

# An alternate configuration is also defined for a different
# region, using the alias "usw2".
provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}

# An example child module is instantiated with the alternate configuration,
# so any AWS resources it defines will use the us-west-2 region.
module "example" {
  source    = "./example"
  providers = {
    aws = aws.usw2
  }
}
```

L'argomento `providers` del blocco `module` è simile all'argomento `provider` di una risorsa. È però una map invece di una singola stringa, perché un modulo può contenere risorse di molti provider diversi. Le chiavi della map sono i nomi delle configurazioni dei provider che il modulo figlio si aspetta. I valori sono i nomi delle configurazioni corrispondenti nel modulo corrente.

I moduli ereditano implicitamente i provider predefiniti, e l'argomento `providers` in un blocco `module` sostituisce questa ereditarietà per quel provider. Le configurazioni dei provider aggiuntive, quelle con l'argomento `alias`, invece, non vengono mai ereditate automaticamente dai moduli figli. Vanno quindi sempre passate esplicitamente con la map `providers`.

Ad esempio, un modulo che configura la connettività tra reti in due region AWS ha probabilmente bisogno di una region sorgente e di una di destinazione. In quel caso il modulo root può essere simile a questo:

```
provider "aws" {
  alias  = "usw1"
  region = "us-west-1"
}

provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}

module "tunnel" {
  source    = "./tunnel"
  providers = {
    aws.src = aws.usw1
    aws.dst = aws.usw2
  }
}
```

La sottodirectory `./tunnel` deve allora dichiarare gli alias di configurazione del provider, perché il modulo chiamante possa passare configurazioni con quei nomi nel suo argomento `providers`:

```
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 2.7.0"
      configuration_aliases = [ aws.src, aws.dst ]
    }
  }
}
```

Ogni risorsa deve poi avere il proprio attributo `provider` impostato a `aws.src` o `aws.dst`, per scegliere quale delle due configurazioni del provider usare.

### 5.9.5 — Moduli condivisi legacy con configurazioni dei provider

In Terraform v0.10 e precedenti non c'era un modo esplicito per usare configurazioni diverse di un provider in moduli diversi della stessa configurazione. Gli autori dei moduli aggiravano il problema scrivendo blocchi `provider` direttamente nei moduli. Così il modulo aveva proprie configurazioni dei provider, separate da quelle dichiarate nel modulo root.

Questo schema però aveva un grosso svantaggio. Una configurazione del provider serve per distruggere l'oggetto remoto associato a un'istanza di risorsa, oltre che per crearlo o aggiornarlo. Deve quindi restare presente nella configurazione Terraform più a lungo di tutte le risorse che gestisce. Se un modulo contiene sia le risorse sia le loro configurazioni dei provider, rimuoverlo dal chiamante viola questo vincolo, perché risorse e provider verrebbero rimossi contemporaneamente.

Terraform v0.11 ha introdotto i meccanismi descritti nelle sezioni precedenti per passare in modo strutturato le configurazioni dei provider tra i moduli. Da allora HashiCorp sconsiglia esplicitamente di scrivere moduli figli con propri blocchi di configurazione dei provider. Lo schema legacy ha comunque continuato a funzionare per compatibilità, con lo stesso svantaggio, fino a Terraform v0.13.

Terraform v0.13 ha introdotto la possibilità di usare `for_each`, `count` e `depends_on` sui moduli, e la loro implementazione purtroppo è in conflitto con il supporto dello schema legacy. Per preservare il più possibile la retrocompatibilità, Terraform v0.13 continua a supportare lo schema legacy per i blocchi `module` che non usano queste nuove funzionalità. Un modulo con proprie configurazioni dei provider però non è compatibile con `for_each`, `count` o `depends_on`, e Terraform dà errore se si cerca di combinarli:

```
Error: Module does not support count

  on main.tf line 15, in module "child":
  15:   count = 2

Module "child" cannot be used with count because it contains a nested provider
configuration for "aws", at child/main.tf:2,10-15.

This module can be made compatible with count by changing it to receive all of
its provider configurations from the calling module, by using the "providers"
argument in the calling module block.
```

Per rendere un modulo compatibile con le nuove funzionalità bisogna rimuovere tutti i blocchi `provider` dalla sua definizione. Il modulo chiamante deve poi includere un argomento `providers` esplicito, che descrive quali configurazioni dei provider userà il modulo figlio. Serve se la nuova versione del modulo dichiara `configuration_aliases`, o se il modulo figlio deve usare configurazioni dei provider diverse da quelle predefinite del chiamante:

```
provider "aws" {
  region = "us-west-1"
}

provider "aws" {
  region = "us-east-1"
  alias  = "east"
}

module "child" {
  count = 2
  providers = {
    # By default, the child module would use the
    # default (unaliased) AWS provider configuration
    # using us-west-1, but this will override it
    # to use the additional "east" configuration
    # for its resources instead.
    aws = aws.east
  }
}
```

L'associazione tra risorse e configurazioni dei provider è statica. Per questo le chiamate ai moduli con `for_each` o `count` non possono passare configurazioni dei provider diverse a istanze diverse. Se istanze diverse del modulo devono usare configurazioni dei provider diverse, serve un blocco `module` separato per ogni insieme distinto di configurazioni. Ad esempio, si possono avere i blocchi `bucket_w1` e `bucket_w2`, che passano rispettivamente le configurazioni `usw1` e `usw2` dei provider aws e google:

```
provider "aws" {
  alias  = "usw1"
  region = "us-west-1"
}

provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}

provider "google" {
  alias       = "usw1"
  credentials = file("account.json")
  project     = "my-project-id"
  region      = "us-west1"
  zone        = "us-west1-a"
}

provider "google" {
  alias       = "usw2"
  credentials = file("account.json")
  project     = "my-project-id"
  region      = "us-west2"
  zone        = "us-west2-a"
}

module "bucket_w1" {
  source    = "./publish_bucket"
  providers = {
    aws.src    = aws.usw1
    google.src = google.usw1
  }
}

module "bucket_w2" {
  source    = "./publish_bucket"
  providers = {
    aws.src    = aws.usw2
    google.src = google.usw2
  }
}
```

- Fonte: [Providers within modules](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/develop/providers)

---

## 5.10 — Gestire i valori nei moduli

Con le input variable, i local value e gli output value i moduli Terraform diventano flessibili, componibili e riutilizzabili.

### 5.10.1 — Contesto

I moduli Terraform comunicano tra loro tramite input e output. Le variabili parametrizzano il modulo, così gli altri utenti possono fornire valori di input personalizzati al momento dell'esecuzione. Gli output espongono dati da un modulo, e permettono di esportare informazioni sull'infrastruttura. I local value permettono di definire e riutilizzare espressioni all'interno di un modulo.

Interfacce chiare tra i moduli creano confini tra di essi. Così si compone l'infrastruttura a partire da componenti riutilizzabili, mantenendo indipendente l'implementazione di ogni modulo.

### 5.10.2 — Le variabili come argomenti del modulo

Le variabili definiscono l'interfaccia di input del modulo, cioè i valori che il modulo accetta come argomenti. Ad esempio, il blocco seguente definisce una input variable chiamata `instance_type`, con cui chi usa il modulo specifica al momento dell'esecuzione il tipo di istanza EC2 di `web`:

```
variable "instance_type" {
  type        = string
  description = "EC2 instance type for the web server"
  default     = "t2.micro"
}

resource "aws_instance" "web" {
  instance_type = var.instance_type
  # ...
}
```

Come definire le variabili, assegnare loro valori e gestirle in HCP Terraform è descritto nella sezione 4.13. Il blocco `variable` e i suoi argomenti sono descritti nella sezione 4.14.

### 5.10.3 — I local value per riutilizzare le espressioni

I local value definiscono valori temporanei con scope limitato al modulo, con cui si dà un nome alle espressioni e le si riusa nella configurazione. Ad esempio, il blocco `locals` seguente definisce un local value per il nome di un'applicazione:

```
locals {
  app_name = "${var.project_name}-${var.environment}"
}

resource "aws_instance" "example" {
  # ...
  tags = {
    Name = local.app_name
  }
}

resource "aws_instance" "example2" {
  # ...
  tags = {
    Name = local.app_name
  }
}
```

I local value si usano in altre parti della configurazione, per non riscrivere più volte la stessa espressione. Quando usarli è descritto nella pagina *Use locals to reuse expressions*, il blocco `locals` nel suo riferimento.

### 5.10.4 — Gli output per esporre i dati del modulo

Gli output espongono i dati di un modulo, e rendono i suoi valori disponibili nella CLI di Terraform, in HCP Terraform e in altre parti della configurazione. Nell'esempio, l'output `instance_ip` esporta l'indirizzo IP privato dell'istanza EC2 `web`:

```
output "instance_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.web.private_ip
}

resource "aws_instance" "web" {
  # …
}
```

Come esporre i dati dei moduli e accedere a quei valori è descritto nella sezione 4.16. Il blocco `output` e i suoi argomenti sono descritti nella sezione 4.17.

- Fonte: [Manage values in modules](https://developer.hashicorp.com/terraform/language/v1.12.x/values)

---

## 5.11 — Comporre i moduli

In una configurazione Terraform semplice, con un solo modulo root, si crea un insieme piatto di risorse. Le relazioni tra queste risorse si descrivono con la sintassi delle espressioni di Terraform:

```
resource "aws_vpc" "example" {
  cidr_block = "10.1.0.0/16"
}

resource "aws_subnet" "example" {
  vpc_id = aws_vpc.example.id

  availability_zone = "us-west-2b"
  cidr_block        = cidrsubnet(aws_vpc.example.cidr_block, 4, 1)
}
```

Introducendo i blocchi `module`, la configurazione diventa gerarchica invece che piatta. Ogni modulo contiene il proprio insieme di risorse, ed eventualmente i propri moduli figli, e si può arrivare a un albero di configurazioni di risorse profondo e complesso.

Nella maggior parte dei casi però HashiCorp raccomanda vivamente di mantenere piatto l'albero dei moduli, con un solo livello di moduli figli. Per descrivere le relazioni tra i moduli si usano espressioni, con una tecnica simile alla precedente:

```
module "network" {
  source = "./modules/aws-network"

  base_cidr_block = "10.0.0.0/8"
}

module "consul_cluster" {
  source = "./modules/aws-consul-cluster"

  vpc_id     = module.network.vpc_id
  subnet_ids = module.network.subnet_ids
}
```

Questo stile piatto si chiama **composizione dei moduli** (module composition): si prendono più moduli componibili, come mattoni, e li si assembla per ottenere un sistema più grande. Il modulo non incorpora le proprie dipendenze, creandone e gestendone una propria copia. Le riceve invece dal modulo root, che può quindi collegare gli stessi moduli in modi diversi per ottenere risultati diversi. Il resto della pagina descrive alcuni schemi di composizione più specifici, utili per descrivere sistemi più grandi con Terraform.

### 5.11.1 — Inversione delle dipendenze

Nell'esempio precedente, il modulo `consul_cluster` descrive presumibilmente un cluster di server HashiCorp Consul in una rete VPC AWS. Richiede quindi come argomenti gli identificativi sia della VPC sia delle subnet al suo interno.

In alternativa, il modulo `consul_cluster` potrebbe descrivere le proprie risorse di rete. Così però sarebbe difficile far convivere il cluster Consul con altra infrastruttura nella stessa rete. Per questo, quando possibile, si preferisce mantenere i moduli relativamente piccoli e passare loro le dipendenze.

Questo approccio di **inversione delle dipendenze** (dependency inversion) migliora anche la flessibilità per i futuri refactoring, perché al modulo `consul_cluster` non importa come il modulo chiamante ottiene quegli identificativi. Un refactoring futuro potrebbe separare la creazione della rete in una configurazione a sé stante. A quel punto i valori si potrebbero passare al modulo tramite data source:

```
data "aws_vpc" "main" {
  tags = {
    Environment = "production"
  }
}

data "aws_subnet_ids" "main" {
  vpc_id = data.aws_vpc.main.id
}

module "consul_cluster" {
  source = "./modules/aws-consul-cluster"

  vpc_id     = data.aws_vpc.main.id
  subnet_ids = data.aws_subnet_ids.main.ids
}
```

**Creazione condizionale degli oggetti** _(stepTitle)_

Quando lo stesso modulo si usa in più ambienti, capita spesso che un oggetto necessario esista già in alcuni ambienti e vada creato in altri. Succede ad esempio con gli ambienti di sviluppo. Per motivi di costo, una certa infrastruttura può essere condivisa tra più ambienti di sviluppo, mentre in produzione è unica e gestita direttamente dalla configurazione di produzione.

Si potrebbe scrivere un modulo che cerca di capire se un oggetto esiste e lo crea se manca. HashiCorp raccomanda invece l'inversione delle dipendenze: il modulo riceve l'oggetto di cui ha bisogno come argomento, tramite una input variable.

Ad esempio, un modulo Terraform distribuisce istanze di calcolo a partire da un'immagine disco. In alcuni ambienti è disponibile un'immagine disco specializzata, mentre altri condividono un'immagine base comune. Invece di far gestire entrambi gli scenari al modulo, si dichiara una input variable per un oggetto che rappresenta l'immagine disco. Con AWS EC2 come esempio, si dichiara un sottotipo comune degli schemi del tipo di risorsa e del data source `aws_ami`:

```
variable "ami" {
  type = object({
    # Declare an object using only the subset of attributes the module
    # needs. Terraform will allow any object that has at least these
    # attributes.
    id           = string
    architecture = string
  })
}
```

Ora è il chiamante del modulo a indicare direttamente se l'AMI va creata nella configurazione o recuperata da altrove:

```
# In situations where the AMI will be directly managed:

resource "aws_ami_copy" "example" {
  name              = "local-copy-of-ami"
  source_ami_id     = "ami-abc123"
  source_ami_region = "eu-west-1"
}

module "example" {
  source = "./modules/example"

  ami = aws_ami_copy.example
}
```

```
# Or, in situations where the AMI already exists:

data "aws_ami" "example" {
  owner = "9999933333"

  tags = {
    application = "example-app"
    environment = "dev"
  }
}

module "example" {
  source = "./modules/example"

  ami = data.aws_ami.example
}
```

È coerente con lo stile dichiarativo di Terraform. Invece di creare moduli con rami condizionali complessi, si descrive direttamente cosa deve già esistere e cosa si vuole far gestire a Terraform.

Con questo schema si dichiara esplicitamente in quali situazioni ci si aspetta che l'AMI esista già e in quali no. Chi leggerà la configurazione in futuro capirà subito cosa intende fare, senza dover prima ispezionare lo stato del sistema remoto. Nell'esempio l'oggetto da creare o leggere è abbastanza semplice da indicarlo direttamente come singola risorsa. Quando le dipendenze sono abbastanza complesse da trarre vantaggio da un'astrazione, si possono anche comporre più moduli, come descritto in questa pagina.

### 5.11.2 — Ipotesi e garanzie

Ogni modulo ha ipotesi e garanzie implicite, che definiscono quali dati si aspetta e quali dati produce per chi lo usa:

- **Ipotesi** (assumption): una condizione che deve essere vera perché la configurazione di una risorsa sia utilizzabile. Ad esempio, una configurazione `aws_instance` può avere l'ipotesi che l'AMI fornita sia sempre configurata per l'architettura CPU `x86_64`.
- **Garanzia** (guarantee): una caratteristica o un comportamento di un oggetto su cui il resto della configurazione deve poter contare. Ad esempio, una configurazione `aws_instance` può avere la garanzia che l'istanza EC2 venga eseguita in una rete che le assegna un record DNS privato.

È consigliato validare la configurazione per catturare e verificare ipotesi e garanzie (sezione 4.24). Aiuta i futuri maintainer a capire il design e l'intento della configurazione. La validazione restituisce inoltre informazioni utili sugli errori prima e nel loro contesto, così chi usa il modulo diagnostica più facilmente i problemi. L'esempio crea una precondition che verifica se l'istanza EC2 ha un volume root cifrato:

```
output "api_base_url" {
  value = "https://${aws_instance.example.private_dns}:8433/"

  # The EC2 instance must have an encrypted root volume.
  precondition {
    condition     = data.aws_ebs_volume.example.encrypted
    error_message = "The server's root volume is not encrypted."
  }
}
```

### 5.11.3 — Astrazioni multi-cloud

Terraform di proposito non cerca di astrarre servizi simili offerti da fornitori diversi. L'obiettivo è esporre tutte le funzionalità di ogni offerta, e unificare più offerte dietro un'unica interfaccia tenderebbe a richiedere un approccio al "minimo comune denominatore". Con la composizione dei moduli si possono però creare proprie astrazioni multi-cloud leggere, facendo le proprie scelte su quali funzionalità delle piattaforme sono importanti.

Le occasioni per queste astrazioni nascono quando più fornitori implementano lo stesso concetto, protocollo o standard aperto. Ad esempio, le funzionalità di base del DNS sono comuni a tutti i fornitori. Alcuni si distinguono con funzionalità uniche, come la geolocalizzazione e il load balancing intelligente. Nel proprio caso d'uso si può però decidere di rinunciarvi, in cambio di moduli che astraggono i concetti DNS comuni a più fornitori:

```
module "webserver" {
  source = "./modules/webserver"
}

locals {
  fixed_recordsets = [
    {
      name = "www"
      type = "CNAME"
      ttl  = 3600
      records = [
        "webserver01",
        "webserver02",
        "webserver03",
      ]
    },
  ]
  server_recordsets = [
    for i, addr in module.webserver.public_ip_addrs : {
      name    = format("webserver%02d", i)
      type    = "A"
      records = [addr]
    }
  ]
}

module "dns_records" {
  source = "./modules/route53-dns-records"

  route53_zone_id = var.route53_zone_id
  recordsets      = concat(local.fixed_recordsets, local.server_recordsets)
}
```

Nell'esempio si è creata un'astrazione leggera, un oggetto "recordset". Contiene gli attributi che descrivono l'idea generale di un recordset DNS, mappabile su qualsiasi provider DNS. Poi si istanzia un'implementazione specifica di quell'astrazione come modulo, che qui distribuisce i recordset su Amazon Route53. Se in seguito si volesse passare a un altro provider DNS, basterebbe sostituire il modulo `dns_records` con una nuova implementazione per quel provider. Tutta la configurazione che produce le definizioni dei recordset resterebbe invariata.

Astrazioni leggere come queste si creano definendo tipi object di Terraform che rappresentano i concetti in gioco, e usandoli per le input variable dei moduli. Qui tutte le implementazioni dei "record DNS" dichiarerebbero questa variabile:

```
variable "recordsets" {
  type = list(object({
    name    = string
    type    = string
    ttl     = number
    records = list(string)
  }))
}
```

Il DNS è un esempio semplice, ma ci sono molte altre occasioni per sfruttare gli elementi comuni tra fornitori. Un esempio più complesso è Kubernetes. Oggi molti fornitori offrono cluster Kubernetes gestiti, e ci sono ancora più modi di eseguire Kubernetes da sé. Se le funzionalità comuni a tutte queste implementazioni bastano, si può implementare un insieme di moduli diversi, ognuno dei quali descrive una particolare implementazione di cluster Kubernetes. Tutti hanno in comune un output con l'hostname del cluster:

```
output "hostname" {
  value = azurerm_kubernetes_cluster.main.fqdn
}
```

Si possono poi scrivere altri moduli che si aspettano come input solo l'hostname di un cluster Kubernetes, e usarli in modo intercambiabile con qualsiasi modulo di cluster Kubernetes:

```
module "k8s_cluster" {
  source = "modules/azurerm-k8s-cluster"

  # (Azure-specific configuration arguments)
}

module "monitoring_tools" {
  source = "modules/monitoring_tools"

  cluster_hostname = module.k8s_cluster.hostname
}
```

### 5.11.4 — Moduli di soli dati

La maggior parte dei moduli contiene blocchi `resource`, e descrive quindi infrastruttura da creare e gestire. A volte può essere utile scrivere moduli che non descrivono nessuna nuova infrastruttura. Questi moduli si limitano a recuperare, con i data source, informazioni su infrastruttura esistente creata altrove. Come per i moduli tradizionali, questa tecnica va usata solo quando il modulo alza in qualche modo il livello di astrazione, qui incapsulando il modo in cui i dati vengono recuperati.

Un uso comune è quando un sistema è stato scomposto in più configurazioni di sottosistemi, ma una certa infrastruttura è condivisa da tutti, come una rete IP comune. In questa situazione si può scrivere un modulo condiviso chiamato `join-network-aws`. Lo chiama qualsiasi configurazione che ha bisogno di informazioni sulla rete condivisa quando è distribuita in AWS:

```
module "network" {
  source = "./modules/join-network-aws"

  environment = "production"
}

module "k8s_cluster" {
  source = "./modules/aws-k8s-cluster"

  subnet_ids = module.network.aws_subnet_ids
}
```

Il modulo di rete può recuperare questi dati in diversi modi:

- interrogando direttamente l'API di AWS con i data source `aws_vpc` e `aws_subnet_ids`;
- leggendo informazioni salvate in un cluster Consul con `consul_keys`;
- leggendo gli output direttamente dallo state della configurazione che gestisce la rete, con `terraform_remote_state`.

Il vantaggio principale di questo approccio è che la sorgente delle informazioni può cambiare nel tempo, senza aggiornare tutte le configurazioni che ne dipendono. Inoltre, se si progetta il modulo di soli dati con un insieme di output simile a quello del modulo di gestione corrispondente, durante un refactoring si può passare dall'uno all'altro con relativa facilità.

- Fonte: [Module composition](https://developer.hashicorp.com/terraform/language/v1.12.x/modules/develop/composition)
