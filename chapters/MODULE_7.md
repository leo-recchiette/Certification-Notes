# Modulo 7 — Manutenzione dell'infrastruttura

_Obiettivo 7 dell'esame: importare infrastruttura esistente nel workspace Terraform (7a), usare la CLI per ispezionare lo state (7b), descrivere quando e come usare il logging dettagliato (7c)._

---

## 7.1 — Importare configurazione Terraform

Terraform permette di portare sotto la propria gestione l'infrastruttura esistente. Importando le risorse in Terraform, si gestisce l'infrastruttura in modo coerente con un workflow comune. Quando si crea nuova infrastruttura con Terraform, di solito si segue questo workflow:

1. si scrive la configurazione Terraform che definisce l'infrastruttura da creare;
2. si rivede il piano di Terraform, per verificare che la configurazione produca l'infrastruttura attesa;
3. si applica la configurazione, perché Terraform crei l'infrastruttura.

![Figura 15](img/terraform-workflow-diagram.png) _(dimensioni: 737×280 px)_

*Figura 15 — Il workflow tipico di Terraform: scrivere la configurazione, rivedere il piano, applicarlo. Fonte: HashiCorp Developer.* _(caption)_

Terraform conserva le informazioni sull'infrastruttura in un file di state. Per aggiornare l'infrastruttura si modifica prima la configurazione, poi si usa Terraform per pianificare e applicare le modifiche necessarie. Terraform usa i dati del file di state per stabilire quali modifiche apportare all'infrastruttura.

Da Terraform 1.5 si può usare la configurazione per importare risorse esistenti nel file di state, con il workflow di plan e apply. Il comando `terraform import` si può ancora usare. L'import guidato dalla configurazione però è più sicuro, funziona con le pipeline CI/CD e permette di vedere in anteprima l'operazione di import prima di modificare lo state. Si può anche, facoltativamente, far generare a Terraform una configurazione iniziale per le risorse da importare. L'import con la configurazione prevede questi passi:

1. individuare l'infrastruttura esistente da importare;
2. definire un blocco `import` per le risorse;
3. eseguire `terraform plan` per rivedere il piano di import ed eventualmente generare la configurazione delle risorse;
4. ridurre la configurazione generata ai soli argomenti necessari;
5. applicare la configurazione per portare la risorsa nel file di state di Terraform.

Nel tutorial si crea un container Docker con la CLI di Docker. Poi si dichiara un blocco `import` per il container esistente e si usa Terraform per generarne la configurazione. Si modifica la configurazione generata, e con il workflow di plan e apply si porta il container sotto la gestione di Terraform.

### 7.1.1 — Creare un container Docker

Si crea un container chiamato `hashicorp-learn` con l'ultima immagine NGINX di Docker Hub. Si pubblica la porta 80 (HTTP) del container sulla porta 8080 del sistema locale:

```
$ docker run --name hashicorp-learn --detach --publish "0.0.0.0:8080:80" nginx:latest
```

Con `docker ps` si verifica che il container sia in esecuzione:

```
$ docker ps --filter="name=hashicorp-learn"
```

All'indirizzo `localhost:8080` si vede la pagina index predefinita di NGINX. Ora ci sono un'immagine e un container Docker da importare nel progetto e gestire con Terraform.

### 7.1.2 — Inizializzare la configurazione

La directory di esempio organizza la configurazione Terraform in tre file:

- `terraform.tf` configura le versioni di Terraform e del provider;
- `main.tf` configura il provider Docker;
- `docker.tf` conterrà la configurazione scritta durante il tutorial.

```
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 4.2.0"
    }
  }

  required_version = "~> 1.5"
}
```

Il tutorial si può svolgere anche con HCP Terraform, decommentando il blocco `cloud`. L'esempio importa un container Docker, quindi con HCP Terraform bisogna usare l'esecuzione locale (local execution). Questo workflow esegue le operazioni di Terraform in locale, così Terraform accede ai container e alle risorse della macchina locale, e conserva il file di state in HCP Terraform per collaborare e versionarlo facilmente. Per abilitarla, nelle impostazioni **General** del workspace `learn-terraform-import` si sceglie **Local** in **Execution Mode** e si salva.

### 7.1.3 — Definire il blocco import

L'import guidato dalla configurazione si basa sul blocco `import`, che ha due argomenti obbligatori:

- `id` è l'identificatore, specifico del provider, dell'infrastruttura da importare;
- `to` è l'identificatore che Terraform darà alla risorsa nello state, composto dal tipo e dal nome della risorsa.

Prima si recupera l'ID completo SHA256 del container `hashicorp-learn` con `docker inspect --format="{{.ID}}" hashicorp-learn`. Poi in `docker.tf` si definisce un blocco `import` che guida l'operazione, sostituendo `FULL_CONTAINER_ID` con l'ID del container:

```
import {
  id = "FULL_CONTAINER_ID"
  to = docker_container.web
}
```

> **Nota**: l'identificatore dell'argomento `id` del blocco `import` dipende dalla risorsa. L'ID richiesto è indicato nella documentazione del provider per la risorsa da importare; per questo esempio, nella documentazione del provider Docker.
_(infoBox)_

### 7.1.4 — Generare la configurazione

Quando si importa una risorsa, bisogna sia portarla nel file di state sia definire il blocco `resource` corrispondente nella configurazione. Si può definire la risorsa a mano. L'import guidato dalla configurazione però può generare una configurazione da usare come punto di partenza.

La configurazione generata contiene tutti i possibili argomenti delle risorse importate, compresi quelli impostati ai valori di default e quelli senza valore. È consigliato ridurla ai soli argomenti obbligatori e a quelli con valori diversi dai default, per contenere le dimensioni della configurazione.

Con `terraform plan` e l'opzione `-generate-config-out` si genera la configurazione del container da importare. Terraform costruisce un piano e scrive la configurazione generata del container nel file indicato:

```
$ terraform plan -generate-config-out=generated.tf
```

Terraform ha usato il provider docker per trovare una risorsa `docker_container` con l'ID indicato nel blocco `import`, e ha salvato la definizione della risorsa in `generated.tf`. Nel piano, però, Terraform prevede di sostituire il container dopo l'import, per il valore di default del parametro `env` restituito dal provider. Nel file generato, infatti, `env` è impostato a `null`:

```
# __generated__ by Terraform
# Please review these resources and move them into your main configuration files.

# __generated__ by Terraform from "371e85d406a937b359d5cc3a49a423b736ec6e9367abe705dcdf6673ec1fb4c4"
resource "docker_container" "web" {
## ...
  env  = null
## ...
}
```

Secondo lo schema della risorsa container Docker, il provider si aspetta per il parametro `env` un set di stringhe. Si cambia quindi il valore di `env` in un set vuoto, con le parentesi quadre (`env = []`).

Lo schema della risorsa container richiede gli argomenti `image` e `name`, che vanno quindi definiti nella configurazione. Il container è stato avviato con una mappatura delle porte, quindi la configurazione deve contenere anche un blocco `ports` corrispondente alla configurazione attuale del container. Si riduce la configurazione generata ai soli argomenti necessari:

```
resource "docker_container" "web" {
  env = []
  image = "..."
  name  = "hashicorp-learn"
  ports {
    external = 8080
    internal = 80
    ip       = "0.0.0.0"
    protocol = "tcp"
  }
}
```

Con `terraform plan` si verifica che la configurazione corrisponda alle impostazioni attuali del container. Ora Terraform pianifica di importare la risorsa e poi di modificarla sul posto, aggiungendo gli attributi `attach`, `container_read_refresh_timeout_milliseconds`, `logs`, `must_run`, `remove_volumes`, `start`, `wait` e `wait_timeout`. Sono modifiche non distruttive.

Terraform usa questi attributi per creare i container Docker, ma Docker non li conserva. Docker non li registra, quindi Terraform non li ha inclusi nella configurazione generata. Applicando la configurazione, il provider Docker assegna loro i valori di default e li salva nello state, ma non influiscono sul container in esecuzione.

> **Nota**: la documentazione del provider potrebbe non indicare se una modifica è sicura. Per sapere se una modifica è sicura da applicare bisogna conoscere il ciclo di vita della risorsa sottostante.
_(infoBox)_

### 7.1.5 — Importare e aggiornare la risorsa

Quando si importa una risorsa, è consigliato limitare le modifiche distruttive e fare della prima operazione sulla risorsa un no-op. L'import guidato dalla configurazione permette però di importare e modificare una risorsa nella stessa operazione, così si gestisce subito la risorsa con il workflow di Terraform. Nel tutorial si cambia la porta esterna in 8081, una modifica distruttiva:

```
resource "docker_container" "web" {
  env                                         = []
  name = "hashicorp-learn"
  image                                       = "sha256:c42efe0b54387756e68d167a437aef21451f63eebd9330bb555367d67128386c"
  ports {
    external = 8081
    internal = 80
    ip       = "0.0.0.0"
    protocol = "tcp"
  }
}
```

Applicando la configurazione, Terraform importa la risorsa e poi sostituisce il container, perché è cambiata la mappatura della porta esterna. Con `docker ps`, o visitando `localhost:8081`, si verifica che Terraform ha sostituito il container con uno nuovo:

```
$ docker ps --filter "name=hashicorp-learn"
```

Con `terraform show` si esamina il contenuto del file di state. Ora file di configurazione, state di Terraform e container sono allineati, e Terraform può gestire le impostazioni e il ciclo di vita del container Docker.

### 7.1.6 — Creare la risorsa dell'immagine

Alcune risorse si possono portare sotto la gestione di Terraform senza il blocco `import`. Capita spesso con le risorse definite da un singolo ID o tag univoco, come le immagini Docker.

Nel file `generated.tf`, la risorsa `docker_container.web` indica l'ID hash SHA256 dell'immagine usata per creare il container. È così che Docker conserva internamente l'ID dell'immagine, e l'import ha caricato quell'ID direttamente nello state. Identificare l'immagine con il tag o il nome renderebbe però la configurazione più comprensibile. Si recupera quindi il tag dell'immagine:

```
$ docker image inspect -f {{.RepoTags}} `docker inspect --format="{{.Image}}" hashicorp-learn`
```

In `docker.tf` si aggiunge poi la configurazione che rappresenta l'immagine come risorsa:

```
resource "docker_image" "nginx" {
  name         = "nginx:latest"
}
```

> **Attenzione**: non bisogna ancora sostituire il valore di `image` nella risorsa `docker_container.web`, altrimenti Terraform distrugge e ricrea il container. Terraform non ha ancora caricato la risorsa `docker_image.nginx` nello state, quindi non ha un ID di immagine da confrontare con quello scritto a mano, e questo forza la sostituzione. La risorsa dell'immagine deve esistere nello state prima di potervi fare riferimento.
_(infoBox)_

Si esegue `terraform apply` per creare la risorsa dell'immagine nello state. Poi si cambia il valore di `image` di `docker_container.web` perché faccia riferimento alla nuova risorsa:

```
resource "docker_container" "web" {
  image = docker_image.nginx.image_id
  # ...
}
```

L'ID dell'immagine corrisponde a quello scritto a mano che si è sostituito, quindi `terraform apply` restituisce un no-op.

> **Nota**: qui la pagina originale scrive `docker_image.nginx.latest`, un attributo delle versioni precedenti del provider Docker. La configurazione usa invece `docker_image.nginx.image_id`.
_(infoBox)_

Se l'ID dell'immagine del tag `nginx:latest` cambiasse tra la creazione del container e l'aggiornamento della configurazione, Terraform distruggerebbe il container e lo ricreerebbe con la nuova immagine. Ora Terraform gestisce sia il container sia l'immagine Docker, e se ne può modificare la configurazione con Terraform.

### 7.1.7 — Limitazioni e altre considerazioni

Quando si usa la configurazione per importare risorse in Terraform bisogna considerare diversi aspetti importanti:

- l'import di Terraform usa lo stato attuale dell'infrastruttura riportato dal provider. Non può determinare la salute dell'infrastruttura, il suo intento, né le modifiche fuori dal controllo di Terraform, come lo stato del filesystem di un container Docker;
- l'import richiede passaggi manuali, che possono essere soggetti a errori, soprattutto se l'operatore non conosce lo scopo e la storia dell'infrastruttura. È consigliato rivedere con attenzione l'output del plan prima dell'apply, per evitare modifiche distruttive;
- l'import manipola il file di state di Terraform durante l'apply, quindi può essere utile farne un backup prima di importare nuova infrastruttura;
- l'import di Terraform non rileva né genera le relazioni tra le risorse dell'infrastruttura. Le relazioni si possono aggiungere a mano alla configurazione prima di applicare le modifiche;
- l'import di Terraform non rileva quali attributi di default si possono non impostare;
- non tutti i provider e non tutte le risorse supportano l'import di Terraform;
- importare una risorsa in Terraform non significa che Terraform possa distruggerla e ricrearla. Ad esempio, l'infrastruttura importata potrebbe dipendere da altra infrastruttura o configurazione non gestita.

Seguire le best practice dell'Infrastructure as Code, come l'infrastruttura immutabile, aiuta a prevenire molti di questi problemi.

- Fonte: [Import Terraform configuration](https://developer.hashicorp.com/terraform/tutorials/state/state-import)

---

## 7.2 — Importare una risorsa esistente

Si possono importare nello state di Terraform risorse di infrastruttura esistenti, per iniziare a gestirle con Terraform. Questa pagina descrive come scrivere la configurazione Terraform per importare le risorse. Con la configurazione si importano più risorse in una volta, e si rivede l'import come parte del workflow di Terraform.

### 7.2.1 — Panoramica

Quando si importa infrastruttura esistente nello state, bisogna anche definire la configurazione Terraform corrispondente a quella risorsa, per gestirne il resto del ciclo di vita. La configurazione si può scrivere tutta a mano, oppure la si può far generare alla CLI di Terraform per le risorse che si stanno importando. Quando si importano risorse, Terraform porta nel file di state tutti gli attributi della risorsa, ma non serve definirli tutti nel blocco `resource`.

È consigliato scrivere a mano il blocco `resource` quando si sa come configurare tutti o la maggior parte degli argomenti della risorsa. La configurazione generata conviene quando si importano più risorse, o una singola risorsa complessa di cui non si ha già la configurazione. Questa pagina descrive come scrivere a mano tutta la configurazione dell'import. Per importare le risorse si procede così:

1. si definisce una configurazione della risorsa di destinazione per ogni risorsa da importare;
2. si aggiunge un blocco `import` corrispondente per ogni risorsa esistente da importare;
3. si esegue `terraform plan` e si verifica che il piano di import soddisfi le esigenze;
4. si applica la configurazione per importare le risorse e aggiornare lo state di Terraform.

Dopo l'import i blocchi `import` si possono rimuovere dalla configurazione, ma è consigliato conservarli come traccia storica.

### 7.2.2 — Definire la risorsa di destinazione

Terraform confronta configurazione e state per creare un piano di esecuzione. Per questo bisogna definire un blocco `resource` per ogni risorsa nello state, altrimenti Terraform la distrugge. Per una risorsa importata, gli unici argomenti obbligatori del blocco `resource` sono il tipo e l'etichetta, che formano l'indirizzo nello state di Terraform. L'esempio è la destinazione di un'istanza AWS con indirizzo `aws_instance.example`:

```
resource "aws_instance" "example" {
  name = "renderer"
}
```

Conviene includere gli argomenti della risorsa specifici del provider che hanno valori non di default, così al successivo apply Terraform non distrugge la risorsa importata. Per gli argomenti non inclusi nel blocco `resource`, Terraform usa i valori di default. Se la risorsa esistente ha attributi diversi dai default, la risorsa nello state non corrisponde all'infrastruttura reale, e al successivo apply Terraform pianifica di aggiornarla. Gli argomenti supportati dalla risorsa da importare sono nella documentazione del provider.

Si possono anche includere meta-argomenti, per modificare il modo in cui Terraform gestisce le risorse una volta importate nello state. I meta-argomenti sono argomenti specifici di Terraform, che stabiliscono dipendenze esplicite tra le risorse e impediscono le operazioni distruttive (sezione 4.3).

### 7.2.3 — Definire il blocco import

Si aggiunge un blocco `import`, indicando l'ID di una risorsa esistente e l'indirizzo della risorsa di destinazione in cui importarla. I cloud provider identificano le risorse in modi diversi, quindi l'ID dipende dal fornitore cloud e dal tipo di risorsa da importare; i dettagli sono nella documentazione del provider. La sintassi del blocco `import` è questa:

```
import {
  to = TYPE.LABEL
  id = "<RESOURCE-ID>"
}

resource "<TYPE>" "<LABEL>" {
  # ...
}
```

L'argomento `to` è l'indirizzo della risorsa di destinazione, formato dal tipo e dall'etichetta della risorsa. L'argomento `id` è un identificatore specifico del cloud provider.

**Importare più istanze** _(stepTitle)_

Il blocco della risorsa di destinazione può gestire più istanze della risorsa con i meta-argomenti `count` e `for_each`. Al valore di `to` si può aggiungere un parametro, per indicare in quale istanza della risorsa di destinazione importare. Ad esempio, con `count` nel blocco della risorsa di destinazione si include un indice nel valore di `to`. Nell'esempio, Terraform importa la risorsa nell'istanza con indice 0:

```
import {
  to = aws_instance.example[0]
  id = "i-abcd1234"
}

resource "aws_instance" "example" {
  count = 2
  #. . .
}
```

Quando il blocco della risorsa di destinazione contiene un argomento `for_each`, Terraform itera su un insieme di coppie chiave-valore e importa un'istanza per ogni coppia. Nell'esempio, Terraform importa la risorsa nell'istanza con chiave `env`:

```
import {
  to = aws_instance.example["env"]
  id = "i-abcd1234"
}

resource "aws_instance" "example" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"
  for_each = {
    env = "staging"
    geo = "us"
  }
  # . . .
}
```

**Importare con un provider personalizzato** _(stepTitle)_

Per default Terraform seleziona automaticamente la configurazione del provider predefinita in base al tipo di risorsa. Si possono però configurare più istanze dello stesso provider con degli alias, e usarne una non predefinita per importare risorse specifiche. Nell'esempio, Terraform importa in un blocco di destinazione con più istanze, secondo la configurazione del provider `europe`:

```
provider "aws" {
  alias = "europe"
  region = "eu-west-1"
}

import {
  provider = aws.europe
  to = aws_instance.example["env"]
  id = "i-abcd1234"
}

resource "aws_instance" "example" {
  provider = aws.europe
  for_each = {
    env = "staging"
    geo = "us"
  }
}
```

**Importare in un modulo** _(stepTitle)_

Quando il blocco della risorsa di destinazione si trova in un altro modulo, si aggiunge all'indirizzo della risorsa il prefisso `module.<MODULE-NAME>`. Nell'esempio, Terraform importa una risorsa in un blocco `resource` del modulo `instances`. La risorsa `aws_instance.example` è definita nel file `instances/main.tf`:

```
import {
  to = module.instances.aws_instance.example
  id = "i-abcd1234"
}
```

### 7.2.4 — Pianificare e applicare l'import

Dopo aver configurato il blocco della risorsa di destinazione e il blocco `import`, si esegue `terraform plan` e si rivede il piano proposto. Se Terraform propone modifiche inattese alla risorsa, se ne aggiorna la configurazione finché non corrisponde alle impostazioni volute. Quando il piano è soddisfacente, si esegue `terraform apply` per importare le risorse e aggiornare lo state.

Quando si applica una configurazione con blocchi `import`, Terraform registra di aver importato le risorse e di non averle create. Il blocco `import` è idempotente. Dopo un'azione di import, un nuovo plan non genera un'altra azione di import, finché la risorsa resta nello state. Inoltre, cercare di importare più volte una risorsa nello stesso indirizzo non ha nessun effetto.

### 7.2.5 — Operazioni dopo l'import

Dopo l'import i blocchi `import` si possono rimuovere. Si possono anche lasciare nella configurazione, come registro dell'origine della risorsa per i futuri maintainer del modulo. La manutenzione delle configurazioni nel tempo è descritta nella pagina *Refactoring*.

- Fonte: [Import an existing resource](https://developer.hashicorp.com/terraform/language/v1.12.x/import)

---

## 7.3 — Il comando terraform import

Il comando `terraform import` importa risorse esistenti in Terraform.

### 7.3.1 — Uso

La sintassi è `terraform import [options] ADDRESS ID`. Il comando trova la risorsa esistente in base all'`ID` e la importa nello state di Terraform all'indirizzo `ADDRESS` indicato.

`ADDRESS` deve essere un indirizzo di risorsa valido. Qualsiasi indirizzo di risorsa è valido, quindi il comando può importare risorse sia nei moduli sia direttamente nella radice dello state.

`ID` dipende dal tipo di risorsa da importare. Ad esempio, per le istanze AWS EC2 è l'ID dell'istanza (`i-abcd1234`), mentre per le zone AWS Route53 è l'ID della zona (`Z12ABC4UGMOZ2N`). Il formato dell'ID è descritto nella documentazione del provider. Nel dubbio si può semplicemente provare un ID: se non è valido, si riceve solo un messaggio d'errore.

> **Attenzione**: Terraform si aspetta che ogni oggetto remoto che gestisce sia legato a un solo indirizzo di risorsa, cosa che di solito è garantita dal fatto che è Terraform stesso a creare tutti gli oggetti. Se si importano oggetti esistenti in Terraform, bisogna fare attenzione a importare ogni oggetto remoto in un solo indirizzo di risorsa. Se si importa lo stesso oggetto più volte, Terraform può comportarsi in modo indesiderato (sezione 6.1).
_(infoBox)_

Invece di importare a mano le risorse, si può aggiungere il blocco `import` alla configurazione Terraform, così Terraform importa le risorse quando si esegue `terraform apply`. Con la configurazione si automatizza l'import delle risorse nelle pipeline CI/CD (sezione 7.2).

Le opzioni da riga di comando sono tutte facoltative:

- `-config=path`: il percorso della directory dei file di configurazione Terraform che configurano il provider per l'import. Il default è la directory di lavoro. Se la directory non contiene file di configurazione Terraform, il provider va configurato con input manuale o con variabili d'ambiente.
- `-input=true`: se chiedere input per la configurazione del provider.
- `-lock=false`: non tiene il lock dello state durante l'operazione. È pericoloso se altri potrebbero eseguire contemporaneamente comandi sullo stesso workspace.
- `-lock-timeout=0s`: la durata per cui riprovare ad acquisire il lock dello state.
- `-no-color`: l'output non contiene colori.
- `-parallelism=n`: limita il numero di operazioni simultanee mentre Terraform percorre il grafo; il default è 10.
- `-provider=provider`: deprecata. Sostituisce la configurazione del provider da usare per importare l'oggetto. Per default Terraform usa il provider indicato nella configurazione della risorsa di destinazione, ed è il comportamento migliore nella maggior parte dei casi.
- `-var 'foo=bar'`: imposta una variabile della configurazione Terraform, e si può ripetere. I valori delle variabili sono interpretati come espressioni letterali del linguaggio Terraform, quindi con questa opzione si possono indicare anche valori list e map.
- `-var-file=foo`: imposta le variabili della configurazione da un file di variabili. Se nella directory corrente ci sono `terraform.tfvars` o file `.auto.tfvars`, vengono caricati automaticamente: prima `terraform.tfvars`, poi i file `.auto.tfvars` in ordine alfabetico. I file indicati con `-var-file` sovrascrivono i valori impostati automaticamente dai file della directory di lavoro. L'opzione si può ripetere, ed è utile solo con l'opzione `-config`.

Per le configurazioni che usano l'integrazione della CLI con HCP Terraform o il backend `remote`, `terraform import` accetta anche l'opzione `-ignore-remote-version`. Per quelle che usano solo il backend `local` accetta anche le opzioni legacy `-state`, `-state-out` e `-backup`.

### 7.3.2 — La configurazione del provider

Terraform cerca di caricare i file di configurazione che configurano il provider usato per l'import. Se non ci sono file di configurazione, o non c'è una configurazione per quel provider, Terraform chiede le credenziali di accesso. Il provider si può configurare anche con variabili d'ambiente.

L'unica limitazione nella lettura dei file di configurazione è che le configurazioni dei provider per l'import non devono dipendere da input che non siano variabili. Ad esempio, una configurazione del provider non può dipendere da un data source. Se si importano risorse AWS e si ha un file di configurazione con il contenuto seguente, Terraform configura il provider AWS con questo file:

```
variable "access_key" {}
variable "secret_key" {}

provider "aws" {
  access_key = var.access_key
  secret_key = var.secret_key
}
```

### 7.3.3 — Esempi

Ecco gli usi più comuni del comando:

- importare un'istanza AWS nella risorsa `aws_instance` chiamata `foo`;
- importarla nella risorsa `aws_instance` chiamata `bar` del modulo `foo`;
- importarla nella prima istanza della risorsa `baz` configurata con `count`;
- importarla nell'istanza `"example"` della risorsa `baz` configurata con `for_each`. Su Linux, Mac OS e UNIX la chiave va tra virgolette singole. In PowerShell e nel prompt dei comandi di Windows le virgolette doppie interne vanno precedute da `\`.

```
$ terraform import aws_instance.foo i-abcd1234
$ terraform import module.foo.aws_instance.bar i-abcd1234
$ terraform import 'aws_instance.baz[0]' i-abcd1234
$ terraform import 'aws_instance.baz["example"]' i-abcd1234
$ terraform import 'aws_instance.baz[\"example\"]' i-abcd1234
$ terraform import aws_instance.baz[\"example\"] i-abcd1234
```

- Fonte: [terraform import command reference](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/import)

---

## 7.4 — Importare risorse esistenti con la CLI

Questa pagina descrive come usare il comando `terraform import` per importare risorse di infrastruttura esistenti, così da gestirle come codice.

### 7.4.1 — Panoramica

Il comando `terraform import` importa infrastruttura esistente nello state di Terraform. Può importare una sola risorsa alla volta, e non può importare contemporaneamente un intero insieme di risorse, come una VPC AWS. Per importare le risorse si procede così:

1. si aggiunge alla configurazione Terraform la risorsa da gestire con Terraform;
2. si esegue il comando `terraform import`.

Valgono le stesse avvertenze della sezione 7.3: ogni oggetto remoto va importato in un solo indirizzo di risorsa.

### 7.4.2 — Aggiungere la risorsa alla configurazione

Nella configurazione si scrive un blocco `resource` per la risorsa da importare, con un nome che è un ID univoco con cui fare riferimento alla risorsa nel resto della configurazione. Nell'esempio la risorsa importata è un'istanza AWS chiamata `example`:

```
resource "aws_instance" "example" {
  # ...instance configuration...
}
```

Non serve completare il corpo del blocco `resource`: gli argomenti si possono definire dopo l'import dell'istanza.

### 7.4.3 — Eseguire il comando terraform import

Si esegue `terraform import` per collegare un'istanza esistente alla configurazione della risorsa:

```
$ terraform import aws_instance.example i-abcd1234
```

Il comando trova l'istanza AWS EC2 con ID `i-abcd1234`. Poi collega le impostazioni esistenti dell'istanza, come le descrive l'API EC2, al nome `aws_instance.example` di un modulo. Nell'esempio il percorso del modulo implica l'uso del modulo root. Infine la mappatura viene salvata nello state di Terraform.

Si può importare anche in risorse di moduli figli, usando i loro percorsi, e in singole istanze di una risorsa con `count` o `for_each` (sezione 4.9). La sintassi dell'ID dipende dal tipo di risorsa da importare. Ad esempio, le istanze AWS usano un ID opaco emesso dall'API EC2, mentre le zone AWS Route53 usano il nome di dominio stesso. La forma dell'ID richiesta è nella documentazione di ogni risorsa importabile.

Con questo comando la risorsa viene registrata nel file di state. Ora si può eseguire `terraform plan` per vedere come la configurazione si confronta con la risorsa importata. Si adegua poi la configurazione allo stato attuale, o desiderato, dell'oggetto importato.

### 7.4.4 — Import complessi

L'import descritto sopra è un "import semplice": una sola risorsa viene importata nel file di state. Un import può anche essere "complesso", cioè importare più risorse. Ad esempio, una network ACL AWS importa un `aws_network_acl`, ma anche un `aws_network_acl_rule` per ogni regola.

In questo caso le risorse secondarie non esistono ancora nella configurazione. Bisogna quindi consultare l'output dell'import e creare nella configurazione un blocco `resource` per ogni risorsa secondaria. Altrimenti, all'esecuzione successiva, Terraform pianifica di distruggere gli oggetti importati. Per rinominare o spostare in altro modo le risorse importate si possono usare i comandi di gestione dello state.

- Fonte: [Import existing resources](https://developer.hashicorp.com/terraform/cli/v1.12.x/import/usage)

---

## 7.5 — I comandi terraform state

I comandi `terraform state` permettono una gestione avanzata dello state, e si usano per modificare lo state di Terraform invece di modificarlo direttamente.

### 7.5.1 — Uso

La sintassi è `terraform state <subcommand> [options] [args]`, con questi sottocomandi:

- `terraform state identities`;
- `terraform state list`;
- `terraform state mv`;
- `terraform state pull`;
- `terraform state replace-provider`;
- `terraform state rm`;
- `terraform state show`.

### 7.5.2 — State remoto e backup

Tutti i sottocomandi `terraform state` funzionano con lo state remoto come se fosse locale. Le letture e le scritture possono richiedere più tempo del solito, perché ognuna fa un giro completo sulla rete. Per il resto i backup vengono comunque scritti su disco, e l'uso della CLI è lo stesso dello state locale.

Tutti i sottocomandi `terraform state` che modificano lo state scrivono file di backup, il cui percorso si controlla con `-backup`. I sottocomandi di sola lettura, come `list`, non scrivono file di backup, perché non modificano lo state. I backup delle modifiche allo state non si possono disabilitare. Il file di state è sensibile, quindi Terraform costringe ogni comando che lo modifica a scrivere un file di backup. Se non li si vuole conservare, questi file vanno rimossi a mano.

### 7.5.3 — Adatti alla riga di comando

L'output e la struttura dei sottocomandi `state` sono progettati per essere usati con gli strumenti a riga di comando Unix, come grep e awk, e con i comandi PowerShell simili. Per filtri e modifiche avanzate è consigliato concatenare i sottocomandi `terraform state` con altri strumenti a riga di comando, tramite pipe.

- Fonte: [terraform state commands](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/state)

---

## 7.6 — Il comando terraform state list

Il comando `terraform state list` elenca le risorse contenute in uno state di Terraform.

### 7.6.1 — Uso

La sintassi è `terraform state list [options] [address...]`. Il comando elenca tutte le risorse del file di state che corrispondono agli indirizzi indicati, se ce ne sono. Se non si indicano indirizzi, elenca tutte le risorse.

Le risorse elencate sono ordinate per profondità del modulo e poi in ordine alfabetico. Quindi le risorse della configurazione principale compaiono per prime, e quelle annidate più in profondità nei moduli per ultime. Nelle infrastrutture complesse lo state può contenere migliaia di risorse. Per filtrarle si forniscono al comando uno o più schemi, nel formato degli indirizzi delle risorse (sezione 4.9). Le opzioni sono tutte facoltative:

- `-state=path`: il percorso del file di state, per default `"terraform.tfstate"`. È un'opzione legacy, solo per il backend local;
- `-id=id`: l'ID delle risorse da mostrare; se non è impostata viene ignorata.

### 7.6.2 — Esempi

Senza argomenti, il comando elenca tutte le risorse, compresi i moduli. Con il nome di una risorsa elenca solo le sue istanze. Con un modulo elenca le risorse del modulo e dei suoi sottomoduli:

```
$ terraform state list
aws_instance.foo
aws_instance.bar[0]
aws_instance.bar[1]
module.elb.aws_elb.main

$ terraform state list aws_instance.bar
aws_instance.bar[0]
aws_instance.bar[1]

$ terraform state list module.elb
module.elb.aws_elb.main
module.elb.module.secgroups.aws_security_group.sg
```

Con `-id` il comando elenca solo la risorsa con l'ID indicato sulla riga di comando. È utile per capire in quale punto della configurazione si trova una risorsa specifica:

```
$ terraform state list -id=sg-1234abcd
module.elb.aws_security_group.sg
```

- Fonte: [terraform state list command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/state/list)

---

## 7.7 — Il comando terraform show

Il comando `terraform show` produce un output leggibile da un file di state o di piano. Lo si usa per ispezionare un piano e verificare che le operazioni pianificate siano quelle attese, o per ispezionare lo state attuale così come lo vede Terraform.

> **Nota**: con l'opzione `-json`, tutti i valori sensibili dello state di Terraform vengono mostrati in chiaro (sezione 4.28).
_(infoBox)_

### 7.7.1 — Output JSON

Con l'opzione `-json` si genera un output leggibile da una macchina:

- per i file di state, anche quando non si indica un percorso, `terraform show -json` mostra una rappresentazione JSON dello state;
- per i file di piano, `terraform show -json` mostra una rappresentazione JSON del piano, della configurazione e dello state attuale.

Se dopo la scrittura dello state si sono aggiornati provider con nuove versioni dello schema, bisogna prima aggiornare lo state, perché Terraform possa mostrarlo con `show -json`. Per visualizzare un piano, il piano non deve essere stato creato con `-refresh=false`. Per visualizzare un file di state, si esegue prima `terraform refresh`. Il formato dell'output è descritto in dettaglio nella pagina *JSON Output Format*.

### 7.7.2 — Uso

La sintassi è `terraform show [options] [file]`. Il comando accetta il percorso di un file di state o di un file di piano di Terraform. Se non si indica un percorso, Terraform mostra l'ultimo snapshot dello state. Il comando accetta due opzioni:

- `-no-color` disattiva i colori nell'output;
- `-json` mostra un output leggibile da una macchina, da un file di state o di piano. L'output JSON richiede Terraform v0.12 o successivo.

- Fonte: [terraform show command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/show)

---

## 7.8 — Risolvere i problemi di Terraform

Il modo principale di interagire con Terraform è l'HashiCorp Configuration Language (HCL). Quando trova un errore nella configurazione, Terraform lo segnala indicando i numeri di riga e il tipo di problema trovato.

Nel tutorial si clona un repository con una configurazione Terraform non funzionante, che distribuisce un'istanza EC2 e la rete sottostante. La configurazione contiene errori intenzionali, che servono a introdurre la risoluzione dei problemi del linguaggio di configurazione.

### 7.8.1 — Il modello di troubleshooting di Terraform

Con Terraform si possono incontrare quattro tipi di problemi: errori di linguaggio, di state, del core e dei provider.

![Figura 16](img/tf-layers.png) _(dimensioni: 2400×810 px)_

*Figura 16 — I livelli dell'applicazione Terraform in cui può nascere un problema: linguaggio (HCL), state, core application e provider. Fonte: HashiCorp Developer.* _(caption)_

Partendo dal tipo di errore più vicino all'utente:

- **Errori di linguaggio**: l'interfaccia principale di Terraform è l'HashiCorp Configuration Language (HCL), un linguaggio di configurazione dichiarativo, interpretato dall'applicazione core di Terraform. Quando trova un errore di sintassi nella configurazione, Terraform stampa i numeri di riga e una spiegazione dell'errore.
- **Errori di state**: il file di state di Terraform conserva le informazioni sulle risorse create, le mappa sulla configurazione e tiene traccia di tutti i metadati associati. Se lo state non è allineato, Terraform può distruggere o modificare le risorse esistenti. Dopo aver escluso gli errori di configurazione, si esamina lo state, e si allinea la configurazione con refresh, import o sostituzione delle risorse.
- **Errori del core**: l'applicazione core di Terraform contiene tutta la logica delle operazioni. Interpreta la configurazione, gestisce il file di state, costruisce il grafo delle dipendenze delle risorse e comunica con i plugin dei provider. Gli errori a questo livello possono essere un bug, e più avanti il tutorial mostra le best practice per aprire una issue GitHub per il team di sviluppo del core.
- **Errori dei provider**: i plugin dei provider gestiscono l'autenticazione, le chiamate API e la mappatura delle risorse sui servizi. Più avanti il tutorial mostra le best practice per aprire una issue GitHub per il team di sviluppo del provider.

### 7.8.2 — Formattare la configurazione

Il comando `format` cerca i file di configurazione nella directory corrente e riscrive i file di configurazione Terraform nel formato raccomandato. Nel tutorial `terraform fmt` restituisce due errori, un carattere non valido e un'espressione non valida, entrambi alla riga 46. Terraform ha trovato problemi che non riesce a interpretare, e stampa gli errori perché li si corregga a mano nella configurazione.

**Correggere un errore di interpolazione** _(stepTitle)_

In `main.tf`, l'attributo `tags` della risorsa `aws_instance.web_app` alla riga 46 ha il tag `Name` formattato male. Cerca di aggiungere una stringa all'input variable `name` senza la sintassi di interpolazione necessaria. Lo si corregge con la sintassi giusta:

```
   tags = {
     Name = "${var.name}-learn"
   }
```

La versione errata era `Name = $var.name-learn`. Rieseguendo `terraform fmt`, gli errori di carattere ed espressione non validi sono risolti e non compaiono più. Terraform interpreta `"${var.name}-learn"` come il nome della variabile nella sintassi abbreviata di interpolazione, seguito dalla stringa fissa `-learn`, che insieme formano un valore personalizzato.

### 7.8.3 — Validare la configurazione

`terraform fmt` analizza l'HCL solo alla ricerca di errori di interpolazione o di definizioni di risorse malformate. Per questo, dopo aver formattato la configurazione, si usa `terraform validate`, che controlla la configurazione nel contesto di ciò che si aspettano i provider. Prima si inizializza la directory con `terraform init`, per scaricare i provider richiesti dalla configurazione. Poi si esegue `terraform validate`. L'output contiene un errore di ciclo (cycle error), che evidenzia una dipendenza reciproca tra due risorse security group.

Gli errori di ciclo sono casi di logica circolare nell'albero delle dipendenze di Terraform. Terraform analizza le dipendenze tra le risorse della configurazione per stabilire l'ordine delle operazioni (sezione 3.13).

**Correggere un errore di ciclo** _(stepTitle)_

Le risorse `aws_security_group` si fanno riferimento a vicenda nei loro attributi `security_groups`. AWS non può creare i security group, perché ognuno fa riferimento all'altro, che non esisterebbe ancora. Si rimuovono quindi le regole reciprocamente dipendenti, e i due gruppi restano senza attributi `ingress`:

```
resource "aws_security_group" "sg_ping" {
  name = "Allow Ping"
}

resource "aws_security_group" "sg_8080" {
  name = "Allow 8080"

  // connectivity to ubuntu mirrors is required to run `apt-get update` and `apt-get install apache2`
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Invece di includere le regole nella configurazione di `aws_security_group`, si usa la risorsa `aws_security_group_rule` e si fa riferimento agli ID dei security group. Così si evita il ciclo. Il provider fa creare ad AWS prima entrambe le risorse `aws_security_group`, senza regole interdipendenti. Poi crea le regole, e infine le collega ai gruppi. Si aggiungono a `main.tf` le nuove risorse regola indipendenti:

```
resource "aws_security_group_rule" "allow_ping" {
    type = "ingress"
    from_port = -1
    to_port = -1
    protocol = "icmp"
    security_group_id = aws_security_group.sg_ping.id
    source_security_group_id = aws_security_group.sg_8080.id
}

resource "aws_security_group_rule" "allow_8080" {
    type = "ingress"
    from_port = 80
    to_port = 80
    protocol = "tcp"
    security_group_id = aws_security_group.sg_8080.id
    source_security_group_id = aws_security_group.sg_ping.id
}
```

Terraform non continua la validazione dopo aver trovato un errore. Rieseguendo `terraform validate` emergono quindi nuovi errori: un riferimento non valido nell'attributo `for_each`, dovuto a un'espressione splat (`*`) nel suo valore. L'attributo `each` di `vpc_security_group_ids` non può restituire gli ID, per l'errore di `for_each` che lo precede. Terraform non ha restituito nessun ID di security group, quindi l'oggetto `each` non è valido. Ecco la risorsa dell'istanza:

```
resource "aws_instance" "web_app" {
  for_each               = aws_security_group.*.id
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [each.id]
  ## ...
  tags = {
    Name = "${var.name}-learn"
  }
}
```

Terraform non può convertire automaticamente i tipi senza funzioni aggiuntive.

**Correggere un errore di for_each** _(stepTitle)_

L'attributo `for_each` di Terraform permette di creare un insieme di risorse simili, secondo i criteri definiti. Qui serve un insieme di istanze simili, ognuna assegnata a un security group diverso. Terraform non riesce a interpretare `aws_security_group.*.id` in questo attributo. L'espressione splat (`*`) interpola infatti solo tipi lista, mentre l'attributo `for_each` è riservato ai tipi map. Un local value può restituire un tipo map.

In `main.tf` si sostituisce il valore di `for_each` con un local value, e il valore di `vpc_security_group_ids` con il valore di `for_each`. Infine si aggiorna l'attributo `tags`, per dare a ogni istanza un nome univoco:

```
resource "aws_instance" "web_app" {
  for_each               = local.security_groups
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [each.value]
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y apache2
              sed -i -e 's/80/8080/' /etc/apache2/ports.conf
              echo "Hello World" > /var/www/html/index.html
              systemctl restart apache2
              EOF
  tags = {
    Name = "${var.name}-learn-${each.key}"
  }
}
```

> **Nota**: la pagina originale mostra la modifica come diff, con le righe tolte e aggiunte. Qui è riportata la versione finale. Nel diff originale c'è anche una parentesi graffa di chiusura in più alla fine del blocco.
_(infoBox)_

Poi si definisce in `main.tf` il local value, che converte la lista dei security group in una map:

```
locals {
  security_groups = {
    sg_ping   = aws_security_group.sg_ping.id,
    sg_8080   = aws_security_group.sg_8080.id,
  }
}
```

Dopo le modifiche, i file di configurazione potrebbero non essere formattati correttamente, quindi si esegue di nuovo `terraform fmt`. La successiva validazione produce errori sugli output, per via del valore di `for_each` corretto: gli output non tengono conto delle istanze multiple delle risorse `aws_instance.web_app`.

**Correggere gli output perché restituiscano tutti i valori** _(stepTitle)_

Per correggere gli output serve un'espressione `for`, che raccolga gli elementi delle risorse multiple. L'espressione `for` raccoglie tutti gli elementi di `aws_instance.web_app` in una variabile temporanea chiamata `instance`. Poi Terraform restituisce tutti i valori indicati degli elementi `instance`. Qui `instance.id`, `instance.public_ip` e `instance.tags.Name` restituiscono il valore corrispondente per ogni istanza creata:

```
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = [for instance in aws_instance.web_app: instance.id]
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = [for instance in aws_instance.web_app: instance.public_ip]
}

output "instance_name" {
  description = "Tags of the EC2 instance"
  value        = [for instance in aws_instance.web_app: instance.tags.Name]
}
```

Dopo aver formattato e validato la configurazione, la si applica con `terraform apply` per creare le risorse.

### 7.8.4 — Best practice per segnalare i bug

Si possono incontrare errori dovuti a problemi del provider o dell'applicazione. Dopo aver escluso errori di configurazione del linguaggio, versioni non allineate o discrepanze dello state, si può segnalare il problema come bug al team core di Terraform o alla community del provider. Per dare al team di sviluppo, o alla community che lavora sul problema, il contesto completo, ecco alcune best practice per aprire una issue GitHub.

**Confermare le versioni** _(stepTitle)_

Bisogna confermare le versioni dei provider usati e la versione di Terraform dell'ambiente, con il comando `terraform version`. Prima di segnalare un bug si può anche verificare di usare le versioni corrette e più recenti dei provider. Se il lock file indica una versione più vecchia, conviene aggiornare i provider e riprovare l'operazione.

**Abilitare il logging di Terraform** _(stepTitle)_

Da Terraform 0.15 si possono generare separatamente i log del provider e quelli dell'applicazione core. Per risolvere gli errori legati al core, il team di sviluppo di Terraform ha bisogno dei log del core dell'operazione tentata. Per abilitare il logging del core si imposta la variabile d'ambiente `TF_LOG_CORE` al livello di log appropriato. Per le segnalazioni di bug va usato il livello `TRACE`, che offre il massimo livello di logging e contiene tutte le informazioni necessarie ai team di sviluppo. Gli altri livelli di logging sono di solito riservati agli sviluppatori che cercano informazioni specifiche.

Si possono generare anche i log del provider, impostando la variabile d'ambiente `TF_LOG_PROVIDER`. Se li si include nelle segnalazioni di bug, il team di sviluppo del provider può riprodurre e fare il debug degli errori specifici del provider.

Una volta configurato il logging, si imposta come variabile d'ambiente il percorso dei log degli errori. Se `TF_LOG_CORE` o `TF_LOG_PROVIDER` sono attive, la variabile `TF_LOG_PATH` crea il file indicato e vi aggiunge i log generati da Terraform:

```
$ export TF_LOG_CORE=TRACE
$ export TF_LOG_PROVIDER=TRACE
$ export TF_LOG_PATH=logs.txt
```

Per generare un esempio di log del core e del provider, il tutorial esegue un'operazione `terraform refresh`. Poi si apre il file dei log:

```
$ cat logs.txt
```

Il file `logs.txt` contiene sia i log di `provider.terraform-provider-aws` sia quelli del core di Terraform. Per rimuovere un flusso di log si rimuove la variabile d'ambiente che non serve, ad esempio `export TF_LOG_CORE=`. Così, rieseguendo Terraform, vengono registrate solo le operazioni specifiche del provider. Quando si chiude la sessione del terminale, tutte le variabili d'ambiente vengono rimosse.

**Aprire un ticket** _(stepTitle)_

Per avere un parere della community prima di inviare la issue al repository, si può aprire un argomento nel forum HashiCorp Discuss. Per creare una issue di segnalazione bug bisogna capire quale flusso di log contiene l'errore. Nel file `logs.txt` si trova il messaggio d'errore finale e lo si risale fino alla sorgente. Se è un problema del provider, contiene `provider-terraform-<PROVIDER-NAME>`.

Individuata l'origine dell'errore, si va nel repository GitHub del core di Terraform, o si cerca nel registry dei provider il repository GitHub del proprio provider. Alcuni provider hanno indicazioni diverse per aprire le issue. Il repository del core di Terraform ha invece un modello di ticket da seguire, per fornire al team le informazioni necessarie. Nel repository GitHub di Terraform si sceglie **Issues** e poi **New Issue**. Si sceglie **Get started** per una segnalazione di bug e si legge il codice di condotta. Si compila il modello del core di Terraform con le informazioni raccolte e il comportamento atteso, e infine si sceglie **Submit New Issue**.

- Fonte: [Troubleshoot Terraform](https://developer.hashicorp.com/terraform/tutorials/configuration-language/troubleshooting-workflow)

---

## 7.9 — Abilitare i log di Terraform

Questa pagina descrive come abilitare i log di Terraform, per fare il debug di comportamenti inattesi.

### 7.9.1 — La variabile TF_LOG

Terraform ha log dettagliati, che si abilitano impostando la variabile d'ambiente `TF_LOG` a un valore qualsiasi. Con questa impostazione, i log dettagliati compaiono su stderr.

Per cambiare il livello di dettaglio dei log, `TF_LOG` si imposta a uno di questi livelli, in ordine di dettaglio decrescente: `TRACE`, `DEBUG`, `INFO`, `WARN` o `ERROR`. Impostando `TF_LOG` a `JSON`, i log vengono prodotti a livello `TRACE` o superiore, in una codifica JSON leggibile da un programma.

> **Attenzione**: la codifica JSON dei file di log non è considerata un'interfaccia stabile, e può cambiare in qualsiasi momento senza preavviso. Serve a supportare strumenti futuri, e quegli strumenti sono l'unico modo supportato per interagire con i log in formato JSON.
_(infoBox)_

### 7.9.2 — Le variabili TF_LOG_CORE e TF_LOG_PROVIDER

Il logging si può abilitare separatamente per Terraform stesso e per i plugin dei provider, con le variabili d'ambiente `TF_LOG_CORE` o `TF_LOG_PROVIDER`. Accettano gli stessi livelli di `TF_LOG`, ma attivano solo una parte dei log.

Per conservare l'output dei log si imposta `TF_LOG_PATH`, che, quando il logging è abilitato, fa sempre aggiungere i log a un file specifico. Anche con `TF_LOG_PATH` impostata, però, perché il logging sia abilitato bisogna impostare `TF_LOG`. Se si trova un bug in Terraform, bisogna includere il log dettagliato, ad esempio con un servizio come gist.

> **Nota**: la pagina dei log richiede `TF_LOG` anche con `TF_LOG_PATH` impostata. Il tutorial della sezione 7.8 usa invece `TF_LOG_PATH` insieme a `TF_LOG_CORE` o `TF_LOG_PROVIDER`, senza `TF_LOG`.
_(infoBox)_

- Fonte: [Enable Terraform logs](https://developer.hashicorp.com/terraform/internals/v1.12.x/debugging)
