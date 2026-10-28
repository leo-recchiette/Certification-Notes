# Modulo 2 — Fondamenti di Terraform

_Obiettivo 2 dell'esame: installare e gestire le versioni dei provider (2a), come Terraform usa i provider (2b), configurazioni con più provider (2c), come Terraform usa e gestisce lo state (2d)._

---

## 2.1 — Come Terraform lavora con i plugin

Terraform è uno strumento per costruire, modificare e versionare l'infrastruttura in modo sicuro ed efficiente. È costruito su un'architettura a plugin, che permette agli sviluppatori di estenderlo scrivendo nuovi plugin o compilando versioni modificate di quelli esistenti.

Dal punto di vista logico Terraform è diviso in due parti principali: **Terraform Core** e i **plugin di Terraform**. Terraform Core comunica con i plugin tramite chiamate di procedura remota (RPC) e offre diversi modi per individuare e caricare i plugin da usare. I plugin forniscono l'implementazione per interagire con un servizio specifico, come AWS, o con un provisioner, come bash.

![Figura 4](img/terraform-plugin-overview.png) _(dimensioni: 4096×728 px)_

*Figura 4 — Terraform Core comunica con il provider via RPC; il provider usa una libreria client in Go per chiamare l'API della piattaforma in HTTP(S). Fonte: HashiCorp Developer.* _(caption)_

### 2.1.1 — Terraform Core

Terraform Core è un binario compilato staticamente, scritto nel linguaggio Go. Il binario compilato è lo strumento a riga di comando (CLI) `terraform`, il punto di ingresso per chiunque usi Terraform; il codice sorgente è disponibile su github.com/hashicorp/terraform.

Le responsabilità principali di Terraform Core sono: l'infrastructure as code, cioè leggere e interpolare i file di configurazione e i moduli; la gestione dello state delle risorse; la costruzione del grafo delle risorse; l'esecuzione del piano; la comunicazione con i plugin via RPC.

### 2.1.2 — I plugin di Terraform

I plugin di Terraform sono scritti in Go e sono binari eseguibili che Terraform Core invoca via RPC. Ogni plugin espone l'implementazione di un servizio specifico, come AWS, o di un provisioner, come bash. Tutti i provider e i provisioner usati nelle configurazioni Terraform sono plugin: vengono eseguiti come processi separati e comunicano con il binario principale di Terraform attraverso un'interfaccia RPC. Terraform include diversi provisioner integrati, mentre i provider vengono individuati dinamicamente quando servono. Terraform Core fornisce un framework di alto livello che nasconde i dettagli dell'individuazione dei plugin e della comunicazione RPC, così gli sviluppatori non devono gestirli.

Ogni plugin è responsabile dell'implementazione specifica del proprio dominio. Le responsabilità principali dei **provider** sono inizializzare le librerie usate per le chiamate API, autenticarsi presso il fornitore dell'infrastruttura, definire le managed resource e i data source che corrispondono a servizi specifici, e definire funzioni che abilitano o semplificano la logica di calcolo nelle configurazioni. Il compito dei **provisioner**, invece, è eseguire comandi o script su una risorsa dopo la sua creazione o al momento della sua distruzione.

### 2.1.3 — Individuazione dei plugin

Quando si esegue `terraform init`, Terraform legge i file di configurazione della directory di lavoro per capire quali plugin servono, cerca i plugin installati in diverse posizioni, a volte ne scarica altri, decide quali versioni usare e scrive un lock file, così che nella directory continueranno a essere usate le stesse versioni dei plugin finché `terraform init` non verrà rieseguito. (La documentazione presenta questa parte come un argomento avanzato, pensato soprattutto per chi sviluppa plugin; la documentazione della CLI riporta nel dettaglio le posizioni in cui Terraform cerca i binari dei plugin.)

Dopo aver trovato i plugin installati, `terraform init` li confronta con i vincoli di versione della configurazione e sceglie una versione per ogni plugin. Se è installata almeno una versione accettabile, usa la più recente tra quelle installate che rispettano il vincolo, anche se nel Terraform Registry ne esiste una accettabile più nuova. Se non è installata nessuna versione accettabile e il plugin è uno dei provider distribuiti da HashiCorp, scarica dal Terraform Registry la versione accettabile più recente e la salva in una sottodirectory di `.terraform/providers/`. Se infine non c'è nessuna versione accettabile installata e il plugin non è distribuito nel Terraform Registry, l'inizializzazione fallisce e bisogna installare a mano una versione adatta.

Eseguendo `terraform init` con l'opzione `-upgrade`, Terraform ricontrolla il Terraform Registry alla ricerca di versioni dei provider più recenti e accettabili, e le scarica se disponibili. Questo vale solo per i provider le cui versioni accettabili si trovano esclusivamente nelle sottodirectory di download automatico in `.terraform/providers/`: se una versione accettabile di un provider è installata altrove, `terraform init -upgrade` non ne scarica una più recente.

- Fonte: [How Terraform works with plugins](https://developer.hashicorp.com/terraform/plugin/how-terraform-works)

---

## 2.2 — Lo scopo dello state di Terraform

Lo state è un requisito indispensabile perché Terraform funzioni. Ci si chiede spesso se Terraform potrebbe fare a meno dello state, limitandosi a ispezionare le risorse reali a ogni esecuzione. La documentazione spiega perché lo state serve: anche negli scenari in cui Terraform potrebbe cavarsela senza, farlo significherebbe spostare un'enorme quantità di complessità dallo state a qualche altro meccanismo sostitutivo.

### 2.2.1 — Mappatura con il mondo reale

Terraform ha bisogno di una sorta di database per collegare la configurazione al mondo reale. Ad esempio, se nella configurazione c'è una risorsa `resource "aws_instance" "foo"`, Terraform usa questa mappatura per sapere che quella risorsa rappresenta un oggetto reale, con ID di istanza `i-abcd1234`, su un sistema remoto.

Per alcuni provider, come AWS, Terraform potrebbe in teoria usare qualcosa come i tag di AWS. I primi prototipi di Terraform in effetti non avevano file di state e usavano proprio questo metodo, ma i problemi sono arrivati presto: il primo, molto semplice, è che non tutte le risorse supportano i tag, e non tutti i cloud provider li supportano. Per questo, per collegare la configurazione alle risorse reali, Terraform usa una propria struttura di state.

Terraform si aspetta che ogni oggetto remoto sia associato a **una sola** istanza di risorsa nella configurazione. Se un oggetto remoto è associato a più istanze, la mappatura tra configurazione e oggetto remoto nello state diventa ambigua e Terraform può comportarsi in modo imprevisto. Terraform può garantire una corrispondenza uno a uno quando è lui a creare gli oggetti e a registrarne l'identità nello state; quando si importano oggetti creati al di fuori di Terraform, bisogna invece assicurarsi che ogni oggetto venga importato in una sola istanza di risorsa.

### 2.2.2 — Metadati

Oltre alle corrispondenze tra risorse e oggetti remoti, Terraform deve tenere traccia anche di metadati come le dipendenze tra risorse.

Di norma Terraform usa la configurazione per stabilire l'ordine delle dipendenze. Quando però si elimina una risorsa dalla configurazione, Terraform deve sapere come eliminarla anche dal sistema remoto: vede che nello state esiste la mappatura di una risorsa che non è più nella configurazione e pianifica di distruggerla, ma poiché la configurazione di quella risorsa non esiste più, l'ordine non si può ricavare dalla sola configurazione. Per funzionare correttamente, Terraform conserva quindi nello state una copia dell'insieme più recente di dipendenze; così, anche quando si eliminano uno o più elementi dalla configurazione, può ancora determinare dallo state l'ordine corretto di distruzione.

Terraform potrebbe seguire un altro approccio, basato su una gerarchia predefinita tra tipi di risorse: potrebbe sapere, ad esempio, che i server vanno eliminati prima delle subnet a cui appartengono. La complessità di questo approccio però esplode rapidamente, perché Terraform dovrebbe conoscere la semantica di ordinamento di ogni risorsa di ogni provider, e in più anche quella tra provider diversi. Per ragioni simili Terraform conserva anche altri metadati, come un riferimento alla configurazione del provider usata più di recente con la risorsa, nei casi in cui siano presenti più provider con alias.

### 2.2.3 — Prestazioni

Oltre alla mappatura di base, Terraform conserva nello state una cache dei valori degli attributi di tutte le risorse. È la funzione più facoltativa dello state e serve solo a migliorare le prestazioni.

Quando si esegue `terraform plan`, Terraform deve conoscere lo stato attuale delle risorse per determinare in modo efficace le modifiche necessarie a raggiungere la configurazione desiderata. Per le infrastrutture piccole, Terraform può interrogare i provider e sincronizzare gli attributi più recenti di tutte le risorse: è il comportamento predefinito, e a ogni plan e apply Terraform sincronizza tutte le risorse dello state.

Per le infrastrutture più grandi, invece, interrogare ogni risorsa è troppo lento. Molti cloud provider non offrono API per interrogare più risorse contemporaneamente e il tempo di andata e ritorno per ogni risorsa è di centinaia di millisecondi; in più quasi sempre applicano limiti alla frequenza delle chiamate API, per cui Terraform può richiedere solo un certo numero di risorse in un dato intervallo di tempo. Per aggirare il problema, gli utenti con infrastrutture grandi fanno largo uso dell'opzione `-refresh=false` e dell'opzione `-target`: in questi scenari lo state in cache viene considerato la fonte di verità.

### 2.2.4 — Sincronizzazione

Con la configurazione predefinita Terraform salva lo state in un file nella directory di lavoro corrente in cui viene eseguito. Per iniziare va bene, ma quando si usa Terraform in team è importante che tutti lavorino con lo stesso state, in modo che le operazioni vengano applicate agli stessi oggetti remoti.

La soluzione consigliata è lo **state remoto**. Con un backend di state completo, Terraform può usare il lock remoto per evitare che due o più utenti eseguano Terraform per errore nello stesso momento, e garantire così che ogni esecuzione parta dallo state aggiornato più di recente.

- Fonte: [Purpose of Terraform State](https://developer.hashicorp.com/terraform/language/v1.12.x/state/purpose)

---

## 2.3 — I provider

Terraform si affida a plugin chiamati **provider** per interagire con i cloud provider, i fornitori SaaS e altre API. Le configurazioni Terraform devono dichiarare quali provider richiedono, così che Terraform possa installarli e usarli; inoltre alcuni provider richiedono una configurazione, come gli URL degli endpoint o le region del cloud, prima di poter essere usati.

### 2.3.1 — Cosa fanno i provider

Ogni provider aggiunge un insieme di tipi di risorsa e/o di data source che Terraform può gestire. Ogni tipo di risorsa è implementato da un provider: senza provider, Terraform non può gestire nessun tipo di infrastruttura. La maggior parte dei provider configura una specifica piattaforma infrastrutturale, cloud o self-hosted, ma i provider possono anche offrire utilità locali, ad esempio per generare numeri casuali da usare nei nomi univoci delle risorse.

### 2.3.2 — Da dove provengono i provider

I provider sono distribuiti separatamente da Terraform, e ognuno ha i propri tempi di rilascio e i propri numeri di versione. Il Terraform Registry è il catalogo principale dei provider pubblici e ospita i provider della maggior parte delle principali piattaforme infrastrutturali.

Ogni provider ha la propria documentazione, che descrive i tipi di risorsa e i relativi argomenti. Il Terraform Registry include la documentazione di un'ampia gamma di provider sviluppati da HashiCorp, da fornitori terzi e dalla community; nel Registry la documentazione è versionata, e dal menu delle versioni nell'intestazione si può scegliere quale versione consultare.

### 2.3.3 — Come si usano i provider

Poiché i provider vengono rilasciati separatamente da Terraform e hanno numeri di versione propri, in produzione HashiCorp raccomanda di vincolare le versioni accettabili nel blocco dei requisiti dei provider della configurazione, così che `terraform init` non installi versioni più nuove e incompatibili con la configurazione.

Per usare le risorse di un provider bisogna inserire alcune informazioni nella configurazione: come dichiarare i provider perché Terraform possa installarli (sezione 2.7), come configurarne le impostazioni con il blocco `provider` (sezione 2.9) e il dependency lock file, un file HCL aggiuntivo che indica a Terraform di usare sempre uno specifico insieme di versioni dei provider (sezione 2.8).

### 2.3.4 — Installazione dei provider

HCP Terraform e Terraform Enterprise installano i provider a ogni run. La CLI di Terraform, invece, trova e installa i provider quando si inizializza una directory di lavoro: può scaricarli automaticamente da un registry Terraform oppure caricarli da un mirror locale o da una cache. Se si usa una directory di lavoro persistente, bisogna reinizializzarla ogni volta che si cambiano i provider della configurazione. Per risparmiare tempo e banda, la CLI supporta una cache dei plugin opzionale, che si abilita con l'impostazione `plugin_cache_dir` nel file di configurazione della CLI.

Per fare in modo che Terraform installi sempre le stesse versioni dei provider per una data configurazione, si può creare con la CLI un dependency lock file e salvarlo nel controllo versione insieme alla configurazione. Se il lock file è presente, HCP Terraform, la CLI e Terraform Enterprise lo rispettano quando installano i provider.

**Provider privati** _(stepTitle)_

Se si usa un provider che non si trova in un registry ospitato da HashiCorp, potrebbe essere necessario aggiungere credenziali alle richieste verso il registry esterno; non servono se il provider si trova nel registry pubblico di Terraform o nel registry privato di HCP Terraform. Di default Terraform autentica solo la richiesta iniziale verso il registry, che risponde con altri URL a cui Terraform fa le richieste successive, ad esempio per scaricare il provider o il file SHASUMS. I registry ospitati da HashiCorp non richiedono autenticazione per queste richieste successive; se invece il proprio registry la richiede, si possono fornire le credenziali con un file `.netrc`. Terraform cerca il file `.netrc` nella directory HOME, ma il percorso si può cambiare con la variabile d'ambiente `NETRC`.

### 2.3.5 — Come trovare i provider

Per trovare i provider delle piattaforme che si usano si consulta la sezione dei provider del Terraform Registry. Alcuni provider sono sviluppati e pubblicati da HashiCorp, altri dai fornitori delle piattaforme, altri ancora da utenti e volontari; nell'elenco, dei badge indicano chi sviluppa e mantiene ciascun provider:

| **Tier** | **Descrizione** | **Namespace** |
|---|---|---|
| **Official** | Provider di proprietà di HashiCorp e mantenuti da HashiCorp | `hashicorp`, `IBM`, `IBM-Cloud`, `ansible` |
| **Partner Premier** | Provider scritti e mantenuti da partner tecnologici, aziende terze che soddisfano i requisiti per il badge Partner Premier | Organizzazione terza |
| **Partner** | Provider scritti, mantenuti, validati e pubblicati da aziende terze sulle proprie API; per ottenere il badge l'azienda deve partecipare all'HashiCorp Technology Partner Program | Organizzazione terza |
| **Community** | Provider pubblicati nel Terraform Registry da singoli maintainer, gruppi di maintainer o altri membri della community | Account personale o dell'organizzazione del maintainer, es. `DeviaVir/gsuite` |
| **Archived** | Provider Official o Partner non più mantenuti da HashiCorp o dalla community, ad esempio perché l'API è stata deprecata o l'interesse era scarso | `hashicorp` o terze parti |

I provider si scrivono in Go, usando il Terraform Plugin SDK; la documentazione rimanda alla sezione *Plugin Development* e ai tutorial *Call APIs with Terraform Providers* per chi vuole svilupparne uno.

- Fonte: [Providers](https://developer.hashicorp.com/terraform/language/v1.12.x/providers)

---

## 2.4 — Gestire le versioni di Terraform

HashiCorp sviluppa e mantiene Terraform attivamente, e per accedere alle nuove funzionalità bisogna aggiornare la versione di Terraform usata dalle proprie configurazioni. L'impostazione `required_version` permette di controllare quale versione di Terraform usa una configurazione e di rendere gli aggiornamenti più prevedibili. Nel tutorial si aggiorna una configurazione esistente all'ultima versione di Terraform e si vede come gestire versioni diverse di Terraform all'interno di un team.

### 2.4.1 — La configurazione di esempio

Il repository di esempio contiene una configurazione completa che distribuisce un'applicazione web su AWS, ma è scritta per una versione più vecchia di Terraform. Nel file `terraform.tf` il blocco `terraform` è questo:

```
terraform {
  required_providers {
    aws = {
      version = "~> 5.52.0"
    }
    random = {
      version = "~> 3.6.2"
    }
  }

  required_version = "~> 1.1.9"
}
```

Il vincolo `required_version = "~> 1.1.9"` permette che la versione di patch sia maggiore di 9, ma richiede che la versione major e minor (1.1) coincida con quella indicata: per questo Terraform dà errore se si prova a usare la configurazione con una versione più recente della 1.1.x. Il comando `terraform version` mostra la versione di Terraform e quella dei provider usati dalla configurazione, e avvisa se è disponibile una versione di Terraform più recente. Eseguendo `terraform init`, Terraform si ferma con un errore perché la versione locale è troppo recente rispetto al vincolo:

```
│ Error: Unsupported Terraform Core version
│
│   on terraform.tf line 11, in terraform:
│   11:   required_version = "~> 1.1.9"
│
│ This configuration does not support Terraform version 1.7.5. To proceed,
│ either choose another supported Terraform version or update this version
│ constraint.
```

HashiCorp usa il formato `major.minor.patch` per le versioni di Terraform e la aggiorna spesso, quindi capita di frequente di usare configurazioni scritte per una versione precedente. Le nuove versioni minor e patch sono retrocompatibili con le configurazioni scritte per le versioni precedenti, perciò si può passare a una minor più recente e continuare a usare le configurazioni esistenti. Aggiornare Terraform può però avere altre conseguenze: può richiedere di aggiornare anche i provider, alcuni aggiornamenti possono aggiornare il formato del file di state o richiedere modifiche alla configurazione per usare le nuove funzionalità. Con `required_version` si controlla quali versioni di Terraform funzionano con le proprie configurazioni, così che gli aggiornamenti dell'infrastruttura siano sicuri e prevedibili.

Nel tutorial si sostituisce `1.1.9` con la versione di Terraform installata, si esegue `terraform init`, che ora installa i provider indicati e crea il lock file `.terraform.lock.hcl`, e poi `terraform apply` per creare l'infrastruttura di esempio.

### 2.4.2 — Ispezionare il file di state

Quando si eseguono i comandi, Terraform registra nel file di state del progetto la propria versione, insieme alla versione del formato del file. Poiché lo state è un file di testo, lo si può ispezionare per capire quale versione di Terraform l'ha generato:

```
$ grep -e '"version"' -e '"terraform_version"' terraform.tfstate
  "version": 4,
  "terraform_version": "1.7.5",
```

Terraform aggiorna la versione del file di state (`version`) solo quando una nuova versione di Terraform richiede un cambiamento del suo formato, mentre aggiorna `terraform_version` ogni volta che si applica una modifica con una versione più recente. In generale Terraform continua a funzionare con un dato file di state attraverso gli aggiornamenti di versione minor; nei rilasci major o minor aggiorna la versione del file di state se necessario, e dà errore se si prova a usare una versione più vecchia di Terraform che non supporta quel formato. In quel caso restituisce un errore di lock dello state che indica la versione necessaria:

```
Error: Error locking state: Error acquiring the state lock: state snapshot was
created by Terraform v1.7.5, which is newer than current v0.12.29; upgrade to
Terraform v1.7.5 or greater to work with this state
```

Una volta che in un progetto si usa un formato di state più recente, non esiste un modo supportato per tornare a una versione precedente. Inoltre Terraform gestisce le versioni dei provider indipendentemente dalla propria: a volte una versione vecchia di un provider non funziona con una versione nuova di Terraform, quindi a ogni aggiornamento di Terraform conviene rivedere le versioni dei provider e valutare se aggiornare anche quelle.

### 2.4.3 — Vincoli sulla versione di Terraform

La tabella riassume alcuni modi di fissare la versione di Terraform con `required_version`:

| **Required version** | **Significato** | **Considerazioni** |
|---|---|---|
| `1.7.5` | Solo Terraform v1.7.5, esattamente | Per aggiornare Terraform bisogna prima modificare `required_version` |
| `>= 1.7.5` | Qualsiasi Terraform v1.7.5 o successivo | Include Terraform v2.0.0 e successivi |
| `~> 1.7.5` | Qualsiasi Terraform v1.7.x, ma non v1.8 o successivi | Gli aggiornamenti di patch non dovrebbero creare problemi |
| `>= 1.7.5, < 1.9.5` | Terraform v1.7.5 o successivo, ma inferiore a v1.9.5 | Evita aggiornamenti a versioni specifiche |

In generale HashiCorp incoraggia a usare l'ultima versione disponibile di Terraform, per sfruttare le funzionalità e le correzioni più recenti, ma non è necessario aggiornare i progetti all'ultima versione ogni volta, a meno che non serva una funzionalità o una correzione specifica. Come best practice consiglia di usare vincoli in stile `~>` per fissare la versione major e minor: così il team può usare gli aggiornamenti di patch senza modificare la configurazione, e si può pianificare quando passare a una nuova versione, verificando con attenzione che il progetto continui a funzionare. Ad esempio, per una configurazione scritta con Terraform 1.0.0 si aggiunge `required_version = "~> 1.0.0"` al blocco `terraform`: il team potrà usare qualsiasi Terraform 1.0.x, ma per passare alla 1.1.0 o successive bisognerà aggiornare la configurazione.

Il tutorial si chiude con `terraform destroy` e ricorda che in produzione è fortemente raccomandato avere piani e procedure per gestire le versioni di Terraform e i relativi aggiornamenti. HCP Terraform e Terraform Enterprise aiutano i team offrendo un ambiente di esecuzione gestito, team e permessi; in HCP Terraform ogni workspace si può configurare per usare la versione di Terraform desiderata (sezione 8.10).

- Fonte: [Manage Terraform versions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/versions)

---

## 2.5 — Bloccare e aggiornare le versioni dei provider

I provider gestiscono le risorse facendo da tramite tra Terraform e le API di destinazione. Quando queste API cambiano o aggiungono funzionalità, i maintainer dei provider possono aggiornarli e rilasciarne nuove versioni. Quando più utenti o strumenti di automazione eseguono la stessa configurazione Terraform, dovrebbero usare tutti le stesse versioni dei provider richiesti. Ci sono due modi per gestire le versioni dei provider: specificare i vincoli di versione nel blocco `terraform` della configurazione e usare il dependency lock file.

Se la versione dei provider non è delimitata in modo adeguato, Terraform scarica la versione più recente che soddisfa il vincolo, e questo può portare a modifiche inattese dell'infrastruttura. Con vincoli ben definiti e il dependency lock file ci si assicura invece che Terraform usi la versione corretta e che la configurazione venga applicata in modo coerente. Nel tutorial si crea un bucket S3 da una configurazione già inizializzata, poi si aggiorna il lock file per usare l'ultima versione del provider AWS e si adegua la configurazione ai requisiti della nuova versione. Il tutorial si può svolgere con lo stesso workflow sia con Terraform Community Edition sia con HCP Terraform.

### 2.5.1 — La configurazione di esempio

La directory di esempio è un progetto Terraform già inizializzato, con tre file: `main.tf`, `terraform.tf` e `.terraform.lock.hcl`. Dal momento della prima inizializzazione HashiCorp ha rilasciato una versione più recente del provider AWS.

Il file `main.tf` usa i provider AWS e random per distribuire un bucket S3 con un nome casuale nella region `us-west-2`:

```
provider "aws" {
  region = "us-west-2"
}

resource "random_pet" "petname" {
  length    = 5
  separator = "-"
}

resource "aws_s3_bucket" "sample" {
  bucket = random_pet.petname.id

  tags = {
    public_bucket = false
  }
}
```

Il file `terraform.tf` contiene il blocco `terraform`, che specifica la versione richiesta dei provider e quella di Terraform:

```
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.1.0"
    }

    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.5.0"
    }
  }

  required_version = "~> 1.2"
}
```

Il blocco `required_providers` indica per ogni provider il nome locale, l'indirizzo della sorgente e la versione. Inizializzando questa configurazione, Terraform scarica la versione 3.1.0 del provider random e l'ultima versione del provider AWS maggiore o uguale a 4.5.0: l'operatore `>=` indica la versione minima compatibile con la configurazione. Con l'operatore `~>`, il blocco specifica inoltre che la configurazione può essere eseguita solo da binari di Terraform v1.x successivi alla v1.2.

Quando si inizializza una configurazione per la prima volta con Terraform 1.1 o successivo, Terraform genera un nuovo file `.terraform.lock.hcl` nella directory di lavoro corrente. Il lock file va incluso nel repository del controllo versione, così che Terraform usi le stesse versioni dei provider in tutto il team e negli ambienti di esecuzione remoti temporanei. Nel file di esempio il provider AWS è alla versione 4.5.0, che soddisfa il vincolo `>= 4.5.0` ma non è più l'ultima disponibile, mentre il provider random è alla 3.1.0:

```
provider "registry.terraform.io/hashicorp/aws" {
  version     = "4.5.0"
  constraints = ">= 4.5.0"
  hashes = [
    "h1:PR5m6lcJZzSIYqfhnMd0YWTN+On2XGgfYV5AKIvOvBo=",
    "zh:0573de96ba316d808be9f8d6fc8e8e68e0e6b614ed4d707bd236c4f7b46ac8b1",
    ## ...
  ]
}
```

### 2.5.2 — Inizializzare e applicare la configurazione

Eseguendo `terraform init`, Terraform riusa le versioni registrate nel lock file (*Reusing previous version of hashicorp/aws from the dependency lock file*) e installa AWS 4.5.0 e random 3.1.0. Invece di installare la versione più recente del provider AWS compatibile con i vincoli, Terraform ha quindi installato quella indicata nel lock file. Se non avesse trovato il lock file, avrebbe scaricato le versioni più recenti che soddisfano i vincoli del blocco `required_providers`:

| **Provider** | **Vincolo di versione** | **terraform init senza lock file** | **terraform init con lock file** |
|---|---|---|---|
| aws | `>= 4.5.0` | Ultima versione (es. 5.55.0) | Versione del lock file (4.5.0) |
| random | `3.1.0` | 3.1.0 | Versione del lock file (3.1.0) |

Il lock file indica a Terraform di installare sempre la stessa versione dei provider, garantendo esecuzioni coerenti in tutto il team e nelle sessioni remote. Nella variante HCP Terraform del tutorial si decommenta il blocco `cloud` del file `terraform.tf` e, all'`init`, Terraform crea automaticamente il workspace nell'organizzazione; anche in questo caso usa le versioni del lock file. Si applica poi la configurazione con `terraform apply`, che crea le due risorse.

### 2.5.3 — Aggiornare la versione del provider AWS

L'opzione `-upgrade` aggiorna tutti i provider all'ultima versione compatibile con i vincoli della configurazione. Il tutorial ricorda che il lock file non va mai modificato a mano. Eseguendo `terraform init -upgrade`, Terraform cerca le versioni che soddisfano i vincoli, installa l'ultima versione del provider AWS e continua a usare random 3.1.0, segnalando di aver modificato le selezioni registrate nel lock file; in `.terraform.lock.hcl` la versione del provider AWS diventa quella più recente. L'opzione `-upgrade` serve anche a fare il downgrade, se i vincoli vengono modificati per indicare una versione più bassa di quella registrata nel lock file.

Dopo l'aggiornamento si esegue `terraform plan` per verificare che la configurazione funzioni con il nuovo provider; nel tutorial il piano non mostra modifiche. A volte un aggiornamento del provider richiede di modificare la configurazione, ad esempio perché nomi o requisiti degli attributi cambiano tra una versione major e l'altra: per questo bisogna sempre eseguire un plan dopo aver cambiato le versioni dei provider. Se il plan va a buon fine si può salvare nel controllo versione la configurazione con il lock file aggiornato; se il plan o l'apply falliscono, il lock file non va salvato finché l'errore non è risolto. Il tutorial si chiude distruggendo le risorse con `terraform destroy`.

- Fonte: [Lock and upgrade provider versions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/provider-versioning)

---

## 2.6 — Il blocco terraform

Il blocco `terraform` permette di configurare il comportamento di Terraform: la versione di Terraform, il backend, l'integrazione con HCP Terraform e i provider richiesti. Il blocco completo, con tutti gli argomenti integrati supportati, ha questa forma:

```
terraform {
  required_version = "<version>"
  required_providers {
    <PROVIDER> {
      version = "<version-constraint>"
      source = "<provider-address>"
    }
  }
  provider_meta "<LABEL>" {
    # mostrato per completezza, usato solo in casi specifici
  }
  backend "<TYPE>" {
    # `backend` è mutuamente esclusivo con `cloud`
    "<ARGUMENTS>"
  }
  cloud {
    # `cloud` è mutuamente esclusivo con `backend`
    organization = "<organization-name>"
    workspaces {
      tags = [ "<tag>" ]
      name = "<workspace-name>"
      project = "<project-name>"
    }
    hostname = "app.terraform.io"
    token = "<TOKEN>"
  }
  experiments = [ "<feature-name>" ]
}
```

Nel blocco `terraform` si possono usare **solo valori costanti**: gli argomenti non possono fare riferimento a oggetti con nome, come risorse e variabili di input, e non si possono usare le funzioni integrate del linguaggio.

### 2.6.1 — required_version

L'argomento `required_version` specifica quali versioni della CLI di Terraform possono eseguire la configurazione, con la sintassi dei vincoli di versione:

```
terraform {
  required_version = "<Terraform version>"
  # . . .
}
```

Nei contesti collaborativi serve a garantire che tutti usino una versione specifica di Terraform, o almeno una versione minima con il comportamento atteso dalla configurazione. Se si usa una versione che non rispetta il vincolo, Terraform stampa un errore ed esce senza fare nulla. Anche i moduli associati a una configurazione possono specificare vincoli di versione: per eseguire le operazioni bisogna usare una versione di Terraform che soddisfi tutti i vincoli associati alla configurazione, compresi quelli definiti nei moduli. `required_version` si applica solo alla versione della CLI di Terraform, non alle versioni dei provider.

### 2.6.2 — required_providers

Il blocco `required_providers` specifica tutti i provider necessari per creare e gestire le risorse della configurazione. Ogni nome locale di provider corrisponde a un indirizzo sorgente e a un vincolo di versione; le istruzioni per configurare questi attributi si trovano nella documentazione di ciascun provider nel registry pubblico o nel registry privato. Per ogni provider si possono indicare due argomenti: `version`, la versione che la configurazione deve usare, eventualmente con operatori per indicare un intervallo (di default Terraform installa la versione più recente), e `source`, l'indirizzo sorgente globale del provider.

### 2.6.3 — provider_meta, backend e cloud

Il blocco `provider_meta "<LABEL>"` specifica campi di metadati che un provider può aspettarsi; i singoli moduli possono valorizzarli indipendentemente dalla configurazione del provider:

```
terraform {
  provider_meta {
    <DATA>
  }
  # . . .
}
```

> **Nota**: nell'esempio della pagina originale manca l'etichetta del blocco, che è obbligatoria: il blocco si scrive `provider_meta "<LABEL>" { ... }`, dove l'etichetta è il nome locale del provider.
_(infoBox)_

Il blocco `backend "<BACKEND_TYPE>"` specifica il meccanismo con cui salvare i file di state e riceve come argomento il tipo di backend; il default è `local`. Non si può configurare un blocco `backend` se la configurazione contiene anche una configurazione `cloud` per salvare lo state (vedi Modulo 6).

Il blocco `cloud` contiene gli attributi che permettono alla configurazione di collegarsi a HCP Terraform o a un'installazione di Terraform Enterprise, che offrono salvataggio dello state, esecuzione remota e altri vantaggi. Si può avere un solo blocco `cloud` per configurazione, non insieme a un blocco `backend`, e il blocco non può fare riferimento a valori con nome, come variabili di input, local o attributi di data source. I suoi argomenti sono:

- `organization`: il nome dell'organizzazione a cui collegarsi, obbligatorio per HCP Terraform; in alternativa si può usare la variabile d'ambiente `TF_CLOUD_ORGANIZATION`.
- `workspaces`: i metadati per individuare i workspace in HCP Terraform, obbligatorio per HCP Terraform. Con `tags`, una mappa di tag chiave-valore o una lista di tag di sola chiave, Terraform associa la configurazione ai workspace che hanno tutti i tag indicati, e i nuovi workspace creati dalla directory di lavoro ereditano quei tag. Con `name` si indica un singolo workspace: la directory di lavoro si può usare solo con quel workspace, che non si può gestire dalla CLI; in alternativa si può usare la variabile `TF_WORKSPACE`. `tags` e `name` sono mutuamente esclusivi. Con `project` si indica il project di HCP Terraform in cui Terraform crea tutti i workspace che usano questa configurazione; `terraform workspace list` mostra solo i workspace di quel project. In alternativa si può usare `TF_CLOUD_PROJECT`.
- `hostname`: l'hostname di un'installazione di Terraform Enterprise, obbligatorio per Terraform Enterprise; il default è `app.terraform.io`, e in alternativa si può usare `TF_CLOUD_HOSTNAME`.
- `token`: un token per autenticarsi con HCP Terraform. HashiCorp raccomanda di non metterlo nella configurazione e di usare invece il comando `terraform login` o di configurare le credenziali nel file di configurazione della CLI.

### 2.6.4 — experiments

L'argomento `experiments` elenca le funzionalità sperimentali che si vogliono abilitare, modulo per modulo, nelle versioni in cui sono disponibili. Gli esperimenti possono cambiare arbitrariamente nelle versioni successive o non essere mai rilasciati in forma stabile, e possono introdurre modifiche incompatibili anche nei rilasci minor e patch: per questo non vanno usati nei moduli destinati alla produzione. I moduli con esperimenti attivi generano un warning a ogni `terraform plan` o `terraform apply`.

### 2.6.5 — Variabili d'ambiente per il blocco cloud

Si possono usare variabili d'ambiente per configurare uno o più attributi del blocco `cloud`, ad esempio per usare la stessa configurazione in organizzazioni e project diversi di HCP Terraform. Terraform usa queste variabili solo se gli attributi corrispondenti non sono definiti nella configurazione, e anche se si configura il blocco interamente tramite variabili d'ambiente bisogna comunque scrivere un blocco `cloud` vuoto.

> **Attenzione**: le variabili d'ambiente permettono di automatizzare le operazioni di Terraform, e l'automazione ha considerazioni di sicurezza specifiche, descritte nella pagina *Non-Interactive Workflows*.
_(infoBox)_

Le variabili sono `TF_CLOUD_ORGANIZATION` (organizzazione, letta quando nel blocco manca `organization`), `TF_CLOUD_HOSTNAME` (hostname di Terraform Enterprise, letto quando manca `hostname`), `TF_CLOUD_PROJECT` (project, letto quando manca `workspaces.project`) e `TF_WORKSPACE` (letta quando manca `workspaces`). Quest'ultima indica un singolo workspace, che deve già esistere nell'organizzazione, perché HCP Terraform non crea nuovi workspace a partire da questa variabile; si può usare anche quando il blocco `cloud` usa i `tags`, purché il suo valore sia tra quelli inclusi, e seleziona anche il workspace nell'ambiente locale. In ogni caso, se un valore è indicato sia nella configurazione sia nella variabile, prevale la configurazione.

**Esempi** _(stepTitle)_

La configurazione seguente richiede il provider aws versione 2.7.0 o successiva dal registry pubblico:

```
terraform {
  required_providers {
    aws = {
      version = ">= 2.7.0"
      source = "hashicorp/aws"
    }
  }
}
```

Quest'altra collega la directory di lavoro ai workspace dell'organizzazione `example_corp` che hanno il tag `layer=app`:

```
terraform {
  cloud {
    organization = "example_corp"
    workspaces {
      tags = {
        layer = "app"
      }
    }
  }
}
```

Per collegarsi a Terraform Enterprise si aggiunge l'argomento `hostname` (obbligatorio, a meno di usare `TF_CLOUD_HOSTNAME`). I tag di sola chiave, come `tags = ["app"]`, vanno usati con le versioni di Terraform Enterprise precedenti alla v202411-1 o con le versioni di Terraform precedenti alla 1.10. Se infine si omettono `organization` e `hostname`, Terraform li legge da `TF_CLOUD_ORGANIZATION` e `TF_CLOUD_HOSTNAME`: così la stessa configurazione si può riusare in pipeline di integrazione continua diverse.

- Fonte: [terraform block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/terraform)

---

## 2.7 — Requisiti dei provider

Terraform si affida a plugin chiamati provider per interagire con i sistemi remoti, e le configurazioni devono dichiarare quali provider richiedono perché Terraform possa installarli e usarli. Inoltre alcuni provider richiedono una configurazione, come URL degli endpoint o region del cloud, che si imposta con il blocco `provider` (sezione 2.9).

Ogni root module dovrebbe dichiarare i provider che richiede, in tre passi. Primo, si definiscono sorgente, nome locale e versione del provider nel blocco `required_providers` dentro il blocco `terraform` principale. Secondo, si aggiunge un blocco `provider` di primo livello per configurare il provider con autenticazione, region e altri argomenti specifici. Terzo, si installa il provider: eseguendo `terraform init` in locale si installa il provider e si aggiorna il dependency lock file con l'ultima versione che corrisponde al vincolo indicato in `required_providers`. HCP Terraform e Terraform Enterprise installano i provider a ogni run, usando le versioni del dependency lock file se esiste. In locale, plan e apply usano le versioni indicate nel lock file; per aggiornare la versione di un provider nel lock file si cambia la versione nel blocco `required_providers` e si riesegue `terraform init`.

### 2.7.1 — Dichiarare i provider richiesti

Ogni modulo Terraform deve dichiarare quali provider richiede, nel blocco `required_providers`, annidato nel blocco `terraform` di primo livello (che può contenere anche altre impostazioni). Un requisito di provider è composto da un nome locale, una sorgente e un vincolo di versione:

```
terraform {
  required_providers {
    mycloud = {
      source  = "mycorp/mycloud"
      version = "~> 1.0"
    }
  }
}
```

Ogni argomento del blocco abilita un provider. La chiave determina il **nome locale** del provider, il suo identificatore univoco all'interno del modulo, e il valore è un oggetto con due elementi: `source`, l'indirizzo sorgente globale del provider da usare, come `hashicorp/aws`, e `version`, un vincolo che indica con quali versioni disponibili del provider il modulo è compatibile. La sintassi `nome = { source, version }` è stata introdotta in Terraform v0.13; le versioni precedenti usavano una stringa di vincolo al posto dell'oggetto (come `mycloud = "~> 1.0"`) e non permettevano di indicare l'indirizzo sorgente.

### 2.7.2 — Nomi e indirizzi

Ogni provider ha due identificatori: un **indirizzo sorgente** univoco, usato solo quando si dichiara il provider, e un **nome locale**, usato in tutto il resto del modulo. (Prima di Terraform 0.13 i provider avevano solo nomi locali, perché Terraform poteva scaricare automaticamente solo i provider distribuiti da HashiCorp.)

**Nomi locali** _(stepTitle)_

I nomi locali sono specifici del modulo, si assegnano quando si dichiara il provider e devono essere univoci nel modulo. Al di fuori del blocco `required_providers`, le configurazioni si riferiscono sempre ai provider con il nome locale: ad esempio, se si dichiara `mycloud` come nome locale di `mycorp/mycloud`, quel nome si usa poi nel blocco `provider "mycloud"`. Chi usa un provider può scegliere qualsiasi nome locale, ma quasi ogni provider ha un nome locale preferito, che usa come prefisso di tutti i suoi tipi di risorsa: le risorse di `hashicorp/aws`, ad esempio, iniziano tutte con `aws`, come `aws_instance` o `aws_security_group`. Quando possibile conviene usare il nome preferito: la configurazione è più facile da capire e nella maggior parte delle risorse si può omettere il meta-argomento `provider`, perché se una risorsa non indica quale configurazione di provider usare, Terraform interpreta la prima parola del tipo di risorsa come nome locale del provider.

**Indirizzi sorgente** _(stepTitle)_

L'indirizzo sorgente è l'identificatore globale di un provider e indica anche la posizione principale da cui Terraform può scaricarlo. È composto da tre parti separate da barre: `[<HOSTNAME>/]<NAMESPACE>/<TYPE>`. Sono formati validi, ad esempio, `NAMESPACE/TYPE` e `HOSTNAME/NAMESPACE/TYPE`. L'**hostname**, facoltativo, è quello del registry che distribuisce il provider; se omesso vale `registry.terraform.io`, l'hostname del Terraform Registry pubblico. Il **namespace** è uno spazio organizzativo all'interno del registry: per il registry pubblico e per il registry privato di HCP Terraform rappresenta l'organizzazione che pubblica il provider. Il **type** è un nome breve della piattaforma o del sistema gestito dal provider, univoco all'interno di un namespace di un registry, e di solito coincide con il nome locale preferito (con qualche eccezione: `hashicorp/google-beta` è un canale di rilascio alternativo di `hashicorp/google`, quindi il suo nome preferito è `google`).

Ad esempio, il provider HTTP ufficiale appartiene al namespace `hashicorp` su `registry.terraform.io`, quindi il suo indirizzo è `registry.terraform.io/hashicorp/http` o, più comunemente, solo `hashicorp/http`. L'indirizzo con tutte e tre le parti esplicite si chiama **fully-qualified address**: compare in alcuni output, come i messaggi di errore, ma di solito si usa una forma abbreviata che omette l'host quando è il registry pubblico: si vede ad esempio `"hashicorp/random"` invece di `"registry.terraform.io/hashicorp/random"`. Se si omette l'argomento `source`, Terraform usa l'indirizzo implicito `registry.terraform.io/hashicorp/<LOCAL NAME>`: è una funzione di retrocompatibilità per la transizione a Terraform 0.13, e nei moduli che richiedono la 0.13 o successive è raccomandato indicare sempre l'indirizzo esplicito.

**Gestire i conflitti tra nomi locali** _(stepTitle)_

A volte bisogna usare nello stesso modulo due provider con lo stesso nome preferito, di solito perché prendono il nome da un tipo generico di infrastruttura. Poiché i nomi locali devono essere univoci, almeno uno dei due deve usare un nome non preferito; HashiCorp consiglia di combinare namespace e tipo con un trattino:

```
terraform {
  required_providers {
    hashicorp-http = {
      source  = "hashicorp/http"
      version = "~> 2.0"
    }
    mycorp-http = {
      source  = "mycorp/http"
      version = "~> 1.0"
    }
  }
}

provider "mycorp-http" {
  # ...
}

data "http" "example" {
  provider = hashicorp-http
  #...
}
```

In questo caso Terraform non può dedurre il provider dal tipo di risorsa, quindi bisogna indicare il meta-argomento `provider` in ogni risorsa coinvolta; in compenso chi legge e mantiene il modulo capisce facilmente cosa succede, ed evitare la confusione è molto più importante che scrivere meno.

### 2.7.3 — Vincoli di versione

Ogni plugin di provider ha il proprio insieme di versioni disponibili, così le sue funzionalità possono evolvere nel tempo. Ogni dipendenza da un provider dovrebbe avere un vincolo nell'argomento `version`, in modo che Terraform possa scegliere una singola versione del provider compatibile con tutti i moduli. L'argomento è facoltativo e, se omesso, Terraform considera compatibile qualsiasi versione, ma HashiCorp raccomanda caldamente di indicare un vincolo per ogni provider da cui il modulo dipende. Per fare in modo che Terraform installi sempre le stesse versioni si può creare un dependency lock file e salvarlo nel controllo versione: se è presente, HCP Terraform, la CLI e Terraform Enterprise lo rispettano.

**Best practice per le versioni dei provider** _(stepTitle)_

Ogni modulo dovrebbe dichiarare almeno la versione minima del provider con cui è noto funzionare, con l'operatore `>=`:

```
terraform {
  required_providers {
    mycloud = {
      source  = "hashicorp/aws"
      version = ">= 1.0"
    }
  }
}
```

Un modulo destinato a essere il root di una configurazione, cioè la directory in cui si esegue `terraform apply`, dovrebbe indicare anche la versione massima con cui deve funzionare, per evitare aggiornamenti accidentali a versioni nuove e incompatibili. L'operatore `~>` è una scorciatoia comoda per permettere che cresca solo il componente più a destra della versione: ad esempio `version = "~> 1.0.4"` consente solo i rilasci di patch all'interno di una specifica versione minor. Per i moduli da riutilizzare in molte configurazioni, invece, non si deve usare `~>` né altri vincoli di versione massima, anche se si sa che il modulo non è compatibile con alcune versioni più recenti: a volte si evitano errori, ma più spesso si costringe chi usa il modulo ad aggiornarne molti contemporaneamente durante gli aggiornamenti di routine. Meglio indicare la versione minima, documentare le incompatibilità note e lasciare al root module la gestione della versione massima.

### 2.7.4 — Provider integrati e provider interni

La maggior parte dei provider è distribuita separatamente come plugin, ma uno è integrato in Terraform stesso: è il provider che abilita il data source `terraform_remote_state`. Essendo integrato, non va dichiarato in `required_providers` per usarne le funzionalità; per coerenza ha comunque un indirizzo sorgente speciale, `terraform.io/builtin/terraform`, che può comparire nei messaggi di errore per distinguerlo da un ipotetico provider di terze parti chiamato "terraform". Esiste anche un provider con indirizzo `hashicorp/terraform`, una vecchia versione dell'attuale provider integrato, che non è compatibile con Terraform v0.11 o successivi e non va mai dichiarato in `required_providers`.

Chiunque può sviluppare e distribuire i propri provider, e alcune organizzazioni ne sviluppano per configurare sistemi proprietari senza pubblicarli nel registry pubblico. Una possibilità è gestire un registry privato interno che implementi il *provider registry protocol*; poiché gestire un servizio aggiuntivo solo per distribuire un provider può essere poco pratico, Terraform supporta anche altri metodi di installazione, come i mirror su filesystem, cioè directory specifiche del filesystem locale in cui si mettono i plugin.

Ogni provider deve avere un indirizzo sorgente che includa (o implichi) l'hostname di un registry, ma quell'hostname non deve per forza offrire un vero servizio di registry: per i provider interni distribuiti da una directory locale si può usare un hostname arbitrario di un dominio controllato dall'organizzazione, anche se non risolve nel DNS. Ad esempio, con il dominio `example.com` si può usare l'hostname segnaposto `terraform.example.com`, e sotto quell'hostname scegliere namespace e tipo a piacere, con un indirizzo come `terraform.example.com/examplecorp/ourcloud`:

```
terraform {
  required_providers {
    mycloud = {
      source  = "terraform.example.com/examplecorp/ourcloud"
      version = ">= 1.0"
    }
  }
}
```

Per rendere installabile la versione 1.0.0 del provider dal filesystem locale, in una delle directory di mirror locale implicite si crea questa struttura:

```
terraform.example.com/examplecorp/ourcloud/1.0.0
```

Dentro la directory `1.0.0` si crea un'altra directory per la piattaforma su cui gira Terraform, come `linux_amd64` per Linux su processore AMD64/x64, e vi si mettono l'eseguibile del plugin e gli altri file necessari. Su un sistema Windows, ad esempio, l'eseguibile del plugin potrebbe trovarsi in questo percorso:

```
terraform.example.com/examplecorp/ourcloud/1.0.0/windows_amd64/terraform-provider-ourcloud.exe
```

Se in seguito si decide di passare a un vero registry privato, lo si può pubblicare su `terraform.example.com` mantenendo namespace e tipo: i moduli esistenti continueranno a trovare il provider senza modifiche.

### 2.7.5 — Requisiti compatibili con la v0.12

Gli indirizzi sorgente espliciti sono stati introdotti con Terraform v0.13, quindi la v0.12 non supporta la sintassi completa. Per permettere di scrivere moduli compatibili con entrambe, le versioni tra la v0.12.26 e la v0.13 accettano ma ignorano l'argomento `source` e considerano solo `version`, usando il nome locale come tipo di provider da installare. Per moduli compatibili con entrambe le versioni bisogna usare solo provider che la v0.12 sa installare automaticamente (non quelli di terze parti), fare in modo che il nome locale coincida esattamente con la parte "type" dell'indirizzo, omettere `source` per i provider del namespace `hashicorp` e scrivere sempre in minuscolo i nomi dei tipi di provider. È un meccanismo di transizione temporaneo: quando la v0.12 trova l'argomento `source`, emette un warning per avvisare che lo sta ignorando.

- Fonte: [Provider Requirements](https://developer.hashicorp.com/terraform/language/v1.12.x/providers/requirements)

---

## 2.8 — Il dependency lock file

Questa funzione esiste da Terraform 0.14; le versioni precedenti non tenevano traccia delle dipendenze selezionate. Una configurazione Terraform può fare riferimento a due tipi di dipendenze esterne al proprio codice: i **provider**, plugin che estendono Terraform con il supporto per interagire con sistemi esterni, e i **moduli**, che permettono di raggruppare costrutti di configurazione in astrazioni riutilizzabili. Entrambi si possono pubblicare e aggiornare indipendentemente da Terraform e dalle configurazioni che li usano, quindi Terraform deve stabilire quali versioni sono potenzialmente compatibili con la configurazione e quali sono selezionate in quel momento.

I vincoli di versione della configurazione determinano quali versioni sono potenzialmente compatibili; dopo aver scelto una versione specifica per ogni dipendenza, Terraform ricorda le sue decisioni in un **dependency lock file**, così da poter prendere (di default) le stesse decisioni in futuro. Attualmente il lock file tiene traccia **solo delle dipendenze dai provider**: Terraform non ricorda le versioni selezionate per i moduli remoti e sceglie sempre la versione più recente disponibile che soddisfa i vincoli. Per avere sempre la stessa versione di un modulo si può usare un vincolo di versione esatto.

### 2.8.1 — Posizione del lock file

Il lock file appartiene alla configurazione nel suo insieme, non ai singoli moduli: per questo Terraform lo crea e si aspetta di trovarlo nella directory di lavoro corrente da cui viene eseguito, che è anche la directory con i file `.tf` del root module. Si chiama sempre `.terraform.lock.hcl`, un nome che indica che è il lock file per i vari elementi che Terraform tiene in cache nella sottodirectory `.terraform`. Terraform lo crea o lo aggiorna automaticamente a ogni `terraform init`, e il file va incluso nel repository del controllo versione, in modo da poter discutere le modifiche alle dipendenze esterne in code review, come le modifiche alla configurazione. Il lock file usa la stessa sintassi di basso livello del linguaggio Terraform ma non è un file di configurazione: per questo ha il suffisso `.hcl` invece di `.tf`.

### 2.8.2 — Comportamento durante l'installazione

Quando `terraform init` installa i provider necessari, considera sia i vincoli di versione della configurazione sia le versioni registrate nel lock file. Se per un provider non c'è una selezione registrata, Terraform sceglie la versione più recente disponibile che soddisfa il vincolo e aggiorna il lock file. Se invece c'è già una selezione, Terraform reinstalla sempre quella versione, anche se nel frattempo ne è uscita una più nuova. Questo comportamento si cambia con l'opzione `-upgrade`: Terraform ignora le selezioni esistenti e sceglie di nuovo la versione più recente che soddisfa il vincolo. Quando un `terraform init` modifica il lock file, Terraform lo segnala nell'output:

```
Terraform has made some changes to the provider dependency selections recorded
in the .terraform.lock.hcl file. Review those changes and commit them to your
version control system if they represent changes you intended to make.
```

Quando compare questo messaggio, conviene rivedere le modifiche con il controllo versione e, se sono volute, farle passare dal normale processo di code review del team.

**Verifica dei checksum** _(stepTitle)_

Terraform verifica anche che ogni pacchetto installato corrisponda ad almeno uno dei checksum registrati in precedenza nel lock file, e se nessuno corrisponde restituisce un errore:

```
Error: Failed to install provider

Error while installing hashicorp/azurerm v2.1.0: the current package for
registry.terraform.io/hashicorp/azurerm 2.1.0 doesn't match any of the
checksums previously recorded in the dependency lock file.
```

La verifica segue un approccio *trust on first use*: quando si aggiunge un provider per la prima volta lo si può verificare come si preferisce, o come richiedono le normative, e poi ci si può fidare che Terraform darà errore se un futuro `terraform init` troverà un pacchetto diverso per la stessa versione.

Il modello ha due casi particolari. Se si installa un provider da un registry di origine che fornisce checksum firmati crittograficamente, Terraform considera validi tutti i checksum firmati purché uno corrisponda, quindi il lock file include i checksum sia del pacchetto installato per la piattaforma corrente sia di quelli per le altre piattaforme; in questo caso l'output di `terraform init` mostra l'impronta della chiave che ha firmato i checksum (ad esempio *signed by a HashiCorp partner, key ID DC9FC6B1FCE47986*), e prima di salvare il lock file conviene verificare di fidarsi del titolare della chiave. Se invece si installa un provider per la prima volta con un metodo alternativo, come un mirror su filesystem o di rete, Terraform non può verificare i checksum delle altre piattaforme e non li registra, quindi la configurazione non sarà utilizzabile su altre piattaforme. Per evitarlo si possono precompilare nel lock file i checksum di più piattaforme con il comando `terraform providers lock`.

### 2.8.3 — Capire le modifiche al lock file

Poiché il lock file è mantenuto soprattutto da Terraform e non a mano, il controllo versione può mostrare che è cambiato. Le modifiche più comuni sono quattro.

**Dipendenza da un nuovo provider** _(stepTitle)_

Se si aggiunge un nuovo provider ai requisiti di un modulo, o un modulo esterno che dipende da un nuovo provider, `terraform init` sceglie la versione più recente che soddisfa tutti i vincoli della configurazione e registra la decisione come nuovo blocco `provider` nel lock file:

```
--- .terraform.lock.hcl 2020-10-07 16:12:07.539570634 -0700
+++ .terraform.lock.hcl 2020-10-07 16:12:15.267487237 -0700
@@ -6,6 +6,26 @@
   ]
 }

+provider "registry.terraform.io/hashicorp/azurerm" {
+  version     = "2.30.0"
+  constraints = "~> 2.12"
+  hashes = [
+    "h1:FJwsuowaG5CIdZ0WQyFZH9r6kIJeRKts9+GcRsTz1+Y=",
+    "h1:c/ntSXrDYM1mUir2KufijYebPcwKqS9CRGd3duDSGfY=",
+    "h1:yre4Ph76g9H84MbuhZ2z5MuldjSA4FsrX6538O7PCcY=",
+    "zh:04f0a50bb2ba92f3bea6f0a9e549ace5a4c13ef0cbb6975494cac0ef7d4acb43",
+    "zh:2082e12548ebcdd6fd73580e83f626ed4ed13f8cdfd51205d8696ffe54f30734",
+    "zh:246bcc449e9a92679fb30f3c0a77f05513886565e2dcc66b16c4486f51533064",
+    "zh:24de3930625ac9014594d79bfa42d600eca65e9022b9668b54bfd0d924e21d14",
+    "zh:2a22893a576ff6f268d9bf81cf4a56406f7ba79f77826f6df51ee787f6d2840a",
+    "zh:2b27485e19c2aaa9f15f29c4cff46154a9720647610171e30fc6c18ddc42ec28",
+    "zh:435f24ce1fb2b63f7f02aa3c84ac29c5757cd29ec4d297ed0618423387fe7bd4",
+    "zh:7d99725923de5240ff8b34b5510569aa4ebdc0bdb27b7bac2aa911a8037a3893",
+    "zh:7e3b5d0af3b7411dd9dc65ec9ab6caee8c191aee0fa7f20fc4f51716e67f50c0",
+    "zh:da0af4552bef5a29b88f6a0718253f3bf71ce471c959816eb7602b0dadb469ca",
+  ]
+}
+
 provider "registry.terraform.io/newrelic/newrelic" {
   version     = "2.1.2"
   constraints = "~> 2.1.1"
```

Il blocco registra `version`, la versione esatta scelta in base ai vincoli; `constraints`, tutti i vincoli considerati per la scelta (Terraform non li usa per decidere l'installazione, ma li riporta per spiegare a chi legge come è stata presa la decisione); e `hashes`, una serie di checksum considerati validi per i pacchetti di quella versione del provider sulle diverse piattaforme.

**Nuova versione di un provider esistente** _(stepTitle)_

Se si esegue `terraform init -upgrade` per far considerare a Terraform versioni più recenti che soddisfano ancora i vincoli, Terraform può scegliere una nuova versione e aggiornare il blocco del provider:

```
--- .terraform.lock.hcl 2020-10-07 16:44:25.819579509 -0700
+++ .terraform.lock.hcl 2020-10-07 16:43:42.785665945 -0700
@@ -7,22 +7,22 @@
 }

 provider "registry.terraform.io/hashicorp/azurerm" {
-  version     = "2.1.0"
-  constraints = "~> 2.1.0"
+  version     = "2.0.0"
+  constraints = "2.0.0"
   hashes      = [
-    "h1:EOJImaEaVThWasdqnJjfYc6/P8N/MRAq1J7avx5ZbV4=",
-    "zh:0015b491cf9151235e57e35ea6b89381098e61bd923f56dffc86026d58748880",
-    "zh:4c5682ba1e0fc7e2e602d3f103af1638f868c31fe80cc1a884a97f6dad6e1c11",
-    "zh:57bac885b108c91ade4a41590062309c832c9ab6bf6a68046161636fcaef1499",
-    "zh:5810d48f574c0e363c969b3f45276369c8f0a35b34d6202fdfceb7b85b3ac597",
-    "zh:5c6e37a44462b8662cf9bdd29ce30523712a45c27c5d4711738705be0785db41",
-    "zh:64548940a3387aa3a752e709ee9eb9982fa820fe60eb60e5f212cc1d2c58549e",
-    "zh:7f46749163da17330bbb5293dc825333c86304baa0a7c6256650ac536b4567c8",
-    "zh:8f8970f2df75ac43ffdd112055ee069d8bd1030f7eb4367cc4cf494a1fa802c3",
-    "zh:9ad693d00dc5d7d455d06faba70e716bce727c6706f7293288e87fd7956b8fe0",
-    "zh:b6e3cb55e6aec62b47edd0d2bd5e14bd6a2bcfdac65930a6e9e819934734c57b",
-    "zh:d6a3f3b9b05c28ecf3919e9e7afa185805a6d7442fc4b3eedba749c2731d1f0e",
-    "zh:d81fb624a357c57c7ea457ce543d865b39b12f26c2edd58a2f7cd43326c91010",
+    "h1:bigGXBoRbp7dv79bEEn+aaju8575qEXHQ57XHVPJeB8=",
+    "zh:09c603c8904ca4a5bc19e82335afbc2837dcc4bee81e395f9daccef2f2cba1c8",
+    "zh:194a919d4836d6c6d4ce598d0c66cce00ddc0d0b5c40d01bb32789964d818b42",
+    "zh:1f269627df4e266c4e0ef9ee2486534caa3c8bea91a201feda4bca525005aa0a",
+    "zh:2bae3071bd5f8e553355c4b3a547d6efe1774a828142b762e9a4e85f79be7f63",
+    "zh:6c98dfa5c3468e8d02e2b3af7c4a8a14a5d469ce5a642909643b413a17ca338b",
+    "zh:7af78f61666fd45fbf428161c061ea2623162d601b79dc71d6a5158756853ffa",
+    "zh:883c2df86ae9ba2a5c167cf5c2c7deca0239171a224d6d335f0fd6dd9c283830",
+    "zh:a2028379078577d8ff5ecfca6e8a8b25a25ffb1686de0ee52a7fe8011783488b",
+    "zh:abe6ef399552fd3861a454a839cd978c1d15735658fdc00f9054435aff0f4620",
+    "zh:c30b1bf14077913c3cdf34979b1434dbb1353cb5995eb3956b191c50538b64a9",
+    "zh:ca64ae2ad9793e5631e3b0b9327f7cb22cb5d8e9de57be7d85821791b1d5a375",
+    "zh:fffe56904a38109bb8d613b02808a177c3ddfac19f03b3aac799281fea38f475",
   ]
 }
```

> **Nota**: il testo della pagina originale parla di una versione più recente, ma il diff dell'esempio mostra il passaggio dalla 2.1.0 alla 2.0.0, insieme a un cambio del vincolo. Il meccanismo illustrato, cioè la sostituzione di `version`, `constraints` e `hashes`, resta lo stesso.
_(infoBox)_

L'effetto principale è il cambiamento del valore `version`; se l'aggiornamento è accompagnato da una modifica dei vincoli, cambia anche `constraints`. Poiché ogni versione ha i propri pacchetti di distribuzione, il passaggio a una nuova versione tende a sostituire anche tutti i valori di `hashes`.

**Nuovi checksum di pacchetto** _(stepTitle)_

Una modifica più sottile è l'aggiunta di nuovi checksum non registrati prima, anche se nient'altro nel blocco è cambiato:

```
--- .terraform.lock.hcl 2020-10-07 17:24:23.397892140 -0700
+++ .terraform.lock.hcl 2020-10-07 17:24:57.423130253 -0700
@@ -10,6 +10,7 @@
   version     = "2.1.0"
   constraints = "~> 2.1.0"
   hashes = [
+    "h1:1xvaS5D8B8t6J6XmXxX8spo97tAzjhacjedFX1B47Fk=",
     "h1:EOJImaEaVThWasdqnJjfYc6/P8N/MRAq1J7avx5ZbV4=",
     "zh:0015b491cf9151235e57e35ea6b89381098e61bd923f56dffc86026d58748880",
     "zh:4c5682ba1e0fc7e2e602d3f103af1638f868c31fe80cc1a884a97f6dad6e1c11",
```

L'aggiunta rappresenta il passaggio graduale di Terraform tra schemi di hash diversi: i prefissi `h1:` e `zh:` indicano due schemi, ognuno con un algoritmo di calcolo diverso. **`zh:`** ("zip hash") è un formato legacy che fa parte del protocollo del registry dei provider e si usa per i provider installati direttamente da un registry di origine: è l'hash SHA256 di ciascuno dei pacchetti `.zip` ufficiali indicizzati nel registry, efficace per verificare i pacchetti ufficiali ma non adatto ad altri metodi di installazione, come i mirror su filesystem con la struttura a directory decompresse. **`h1:`** ("hash scheme 1") è lo schema attualmente preferito: è anch'esso un SHA256, ma calcolato sul contenuto del pacchetto del provider anziché sull'archivio `.zip`, quindi si può calcolare per un `.zip` ufficiale, per una directory decompressa con lo stesso contenuto o per un `.zip` ricompresso.

A causa dei limiti dello schema `zh:`, Terraform aggiunge opportunisticamente i corrispondenti checksum `h1:` man mano che li conosce, ma solo se il nuovo hash è calcolato da un pacchetto che corrisponde anche a uno degli hash esistenti. Nell'esempio sopra, Terraform ha installato un pacchetto `hashicorp/azurerm` per una piattaforma diversa da quella che aveva prodotto il checksum `h1:` originale, ma è riuscito a farlo corrispondere a uno dei checksum `zh:` registrati in precedenza. Confermata la corrispondenza `zh:`, ha registrato il checksum `h1:` corrispondente, per migrare gradualmente dal vecchio schema al nuovo. Quando installa un provider per la prima volta, Terraform precompila `hashes` con tutti i checksum coperti dalla firma crittografica dello sviluppatore, che di solito copre tutti i pacchetti di quella versione per tutte le piattaforme supportate; poiché il protocollo del registry usa ancora lo schema `zh:`, l'insieme iniziale contiene soprattutto hash di quel tipo, che Terraform aggiorna man mano che si installano i pacchetti su piattaforme diverse. Per evitare queste aggiunte continue, o se si installano i provider da un mirror che non può fornire checksum firmati, si possono precompilare gli hash per un insieme di piattaforme:

```
terraform providers lock \
  -platform=linux_arm64 \
  -platform=linux_amd64 \
  -platform=darwin_amd64 \
  -platform=windows_amd64
```

Il comando scarica e verifica i pacchetti ufficiali di tutti i provider richiesti per le quattro piattaforme e registra nel lock file sia i checksum `zh:` sia quelli `h1:`.

**Provider non più necessari** _(stepTitle)_

Per capire se esiste ancora una dipendenza da un provider, Terraform usa due fonti di verità: la configurazione e lo state. Se si rimuove l'ultima dipendenza da un provider sia dalla configurazione sia dallo state, `terraform init` rimuove la voce di quel provider dal lock file:

```
--- .terraform.lock.hcl 2020-10-07 16:12:07.539570634 -0700
+++ .terraform.lock.hcl 2020-10-07 16:12:15.267487237 -0700
@@ -6,26 +6,6 @@
   ]
 }

-provider "registry.terraform.io/hashicorp/azurerm" {
-  version     = "2.30.0"
-  constraints = "~> 2.12"
-  hashes = [
-    "h1:FJwsuowaG5CIdZ0WQyFZH9r6kIJeRKts9+GcRsTz1+Y=",
-    "h1:c/ntSXrDYM1mUir2KufijYebPcwKqS9CRGd3duDSGfY=",
-    "h1:yre4Ph76g9H84MbuhZ2z5MuldjSA4FsrX6538O7PCcY=",
-    "zh:04f0a50bb2ba92f3bea6f0a9e549ace5a4c13ef0cbb6975494cac0ef7d4acb43",
-    "zh:2082e12548ebcdd6fd73580e83f626ed4ed13f8cdfd51205d8696ffe54f30734",
-    "zh:246bcc449e9a92679fb30f3c0a77f05513886565e2dcc66b16c4486f51533064",
-    "zh:24de3930625ac9014594d79bfa42d600eca65e9022b9668b54bfd0d924e21d14",
-    "zh:2a22893a576ff6f268d9bf81cf4a56406f7ba79f77826f6df51ee787f6d2840a",
-    "zh:2b27485e19c2aaa9f15f29c4cff46154a9720647610171e30fc6c18ddc42ec28",
-    "zh:435f24ce1fb2b63f7f02aa3c84ac29c5757cd29ec4d297ed0618423387fe7bd4",
-    "zh:7d99725923de5240ff8b34b5510569aa4ebdc0bdb27b7bac2aa911a8037a3893",
-    "zh:7e3b5d0af3b7411dd9dc65ec9ab6caee8c191aee0fa7f20fc4f51716e67f50c0",
-    "zh:da0af4552bef5a29b88f6a0718253f3bf71ce471c959816eb7602b0dadb469ca",
-  ]
-}
-
 provider "registry.terraform.io/newrelic/newrelic" {
   version     = "2.1.2"
   constraints = "~> 2.1.1"
```

Se in seguito si aggiunge di nuovo lo stesso provider, Terraform lo tratta come del tutto nuovo: non sceglierà necessariamente la stessa versione e non potrà verificare che i checksum siano rimasti invariati. In Terraform v1.0 e precedenti, `terraform init` non rimuoveva automaticamente i provider non più necessari ma li ignorava; chi passa da quelle versioni alla v1.1 o successive può vedere l'errore *missing or corrupted provider plugins*, e la soluzione è eseguire `terraform init` con la nuova versione per ripulire le voci superate.

- Fonte: [Dependency Lock File](https://developer.hashicorp.com/terraform/language/v1.12.x/files/dependency-lock)

---

## 2.9 — Il blocco provider

Il blocco `provider` serve a dichiarare e configurare i provider, che permettono a Terraform di gestire l'infrastruttura reale con le risorse e i data source che definiscono. Il registry pubblico distribuisce i provider separatamente da Terraform, ognuno con i propri tempi di rilascio, la propria documentazione e le proprie versioni; con HCP Terraform si può usare il registry privato per condividere i provider all'interno di un'organizzazione. Chiunque può sviluppare un provider e usarlo in locale o pubblicarlo nel registry pubblico o nel registry privato di HCP Terraform.

Le configurazioni dei provider vanno definite nel **root module**: i moduli figli ricevono le configurazioni dei provider dai moduli genitori, quindi HashiCorp sconsiglia vivamente di definire blocchi `provider` nei moduli figli.

### 2.9.1 — Struttura e argomenti

Il blocco ha questa forma; gli argomenti `alias` e `version` sono facoltativi e non si possono usare insieme nello stesso blocco:

```
provider "<PROVIDER_NAME>" {
  <PROVIDER_ARGUMENTS>
  alias   = "<ALIAS_NAME>"
  version = "<VERSION_CONSTRAINT>"  # deprecato
}
```

Come argomento inline si indica il nome del provider da configurare, cioè il suo nome locale. Il corpo del blocco contiene gli **argomenti specifici del provider**, definiti dallo sviluppatore del provider ed elencati nella sua documentazione (per i provider del registry, la documentazione è versionata nella pagina di ciascun provider). Se non si definisce esplicitamente un blocco `provider`, Terraform assume e crea una configurazione di default vuota per quel provider; se però il provider ha argomenti obbligatori, Terraform dà errore perché non può crearlo senza quei valori.

Negli argomenti si possono usare espressioni, ma solo con valori che Terraform conosce **prima di applicare** la configurazione: si possono usare variabili di input e argomenti indicati direttamente nella configurazione, ma non attributi calcolati delle risorse, come `google.web.public_ip`. Molti provider supportano anche variabili d'ambiente della shell o altre fonti per i valori di configurazione, il che aiuta a tenere le credenziali fuori dalla configurazione versionata.

L'argomento **`alias`** permette di definire più configurazioni per lo stesso provider: si scrivono più blocchi `provider` con lo stesso nome e si aggiunge `alias` a ogni configurazione aggiuntiva, per darle un identificatore univoco:

```
provider "exampleName" {
  region = "us-east-1"
}

provider "exampleName" {
  alias  = "west"
  region = "us-west-1"
}
```

Per usare una configurazione con alias si indica `<PROVIDER_NAME>.<ALIAS>` nell'argomento `provider` dei blocchi `resource`, `data` e `module`. Se ci sono più alias, il blocco senza `alias` è la configurazione di default, che viene usata da risorse, data source e moduli che non indicano il meta-argomento `provider`.

L'argomento **`version`** nei blocchi `provider` è deprecato e verrà rimosso in una versione futura: i vincoli di versione vanno dichiarati nel blocco `required_providers` del blocco `terraform`.

### 2.9.2 — Esempi

**Configurazione di base** _(stepTitle)_

Nel blocco `required_providers` si definiscono la versione, la sorgente e il nome locale del provider, e nel root module lo si configura con il blocco `provider`:

```
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = "acme-app"
  region  = "us-central1"
}
```

**Più configurazioni dello stesso provider** _(stepTitle)_

Nell'esempio seguente due configurazioni del provider AWS servono region diverse: quella di default usa `us-east-1`, quella con alias `us-west-2`. La risorsa `aws_instance.foo` usa la configurazione `aws.west`, mentre `aws_instance.bar` usa quella di default; le risorse che iniziano con `aws_` usano la configurazione di default, a meno che non si indichi l'argomento `provider`.

```
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

resource "aws_instance" "foo" {
  provider = aws.west
  # …
}

resource "aws_instance" "bar" {
  # …
}
```

**Provider senza configurazione di default** _(stepTitle)_

Se tutti i blocchi `provider` di un provider usano un alias, Terraform crea una configurazione di default implicita e vuota per quel provider, che viene usata da ogni risorsa che non indica il meta-argomento `provider`. Nell'esempio seguente entrambe le configurazioni AWS usano un alias, ma la risorsa `aws_s3_bucket` non indica l'argomento `provider`:

```
provider "aws" {
  alias  = "east"
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

resource "aws_s3_bucket" "default_provider" {
  bucket = "uses-implied-empty-config"
}
```

Terraform usa quindi per `aws_s3_bucket` la configurazione implicita vuota. Se il provider richiede argomenti specifici, Terraform restituisce un errore, perché la configurazione di default non è configurata correttamente.

**Passare le configurazioni ai moduli figli** _(stepTitle)_

Quando si definisce un provider nel root module, Terraform passa implicitamente quella configurazione a tutti i moduli figli, così che tutti usino la stessa. Nell'esempio seguente il root module, in `main.tf`, definisce una configurazione del provider AWS e richiama un modulo figlio:

```
provider "aws" {
  region = "us-west-2"
}

module "vpc" {
  source = "./modules/vpc"
}
```

Il modulo figlio, in `modules/vpc/main.tf`, usa la configurazione passata dal root module:

```
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "Main VPC"
  }
}
```

La risorsa `aws_vpc` eredita dal root module la stessa configurazione del provider AWS, e Terraform la crea nella region `us-west-2`. I moduli figli però non ereditano i requisiti di sorgente e di versione, che vanno definiti esplicitamente all'interno del modulo nel blocco `required_providers`.

Per usare una configurazione con alias in un modulo figlio, il modulo deve dichiararla con l'argomento `configuration_aliases` nel blocco `required_providers`, e il chiamante la passa con l'argomento `providers` del blocco `module`; senza questa dichiarazione Terraform dà errore quando il modulo prova a fare riferimento all'alias:

```
# root module
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "west"
  region = "us-west-2"
}

module "web-server" {
  source = "./modules/web-server"
  providers = {
    aws.west = aws.west
  }
}

# modules/web-server/main.tf
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.west]
    }
  }
}

data "aws_ami" "amazon_linux" {
  provider = aws.west
  #...
}
```

**Configurazione con espressioni e configurazione vuota** _(stepTitle)_

Nell'esempio seguente la configurazione del provider usa variabili di input e local per impostare i propri argomenti:

```
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-west-2"
}

locals {
  common_tags = {
    Environment = "production"
    Project     = "web-app"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
```

All'opposto, un blocco come `provider "random" { }` definisce una configurazione vuota; Terraform assume comunque una configurazione di default vuota per ogni provider che non si configura esplicitamente, quindi il blocco si può omettere del tutto se non servono argomenti specifici.

- Fonte: [provider block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/provider)
