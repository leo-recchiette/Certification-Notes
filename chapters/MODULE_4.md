# Modulo 4 — Configurazione

_Obiettivo 4 dell'esame: usare e distinguere i blocchi resource e data (4a), fare riferimento agli attributi delle risorse e creare riferimenti tra risorse (4b), usare variabili e output (4c), capire e usare i tipi complessi (4d), scrivere configurazione dinamica con espressioni e funzioni (4e), definire le dipendenze tra risorse (4f), validare la configurazione con le custom condition (4g) e conoscere le best practice per gestire i dati sensibili, compresa la gestione dei segreti con Vault (4h)._

---

## 4.1 — Definire l'infrastruttura con le risorse

Terraform usa i blocchi `resource` per gestire l'infrastruttura, come reti virtuali, istanze di calcolo o componenti di livello più alto come i record DNS. Un blocco resource rappresenta uno o più oggetti dell'infrastruttura nella configurazione Terraform.

La maggior parte dei provider di Terraform offre diverse risorse. Ognuna corrisponde alle API che gestiscono un particolare tipo di infrastruttura:

| **Generica** | **Risorsa del provider AWS** | **Infrastruttura AWS** |
|---|---|---|
| Risorsa A | `aws_instance` | Istanza EC2 |
| Risorsa B | `aws_security_group` | Security group |

Nel tutorial si crea un'istanza EC2 che esegue un'applicazione web PHP. Poi si consulta la documentazione del Terraform Registry per creare un security group che renda l'applicazione accessibile pubblicamente.

### 4.1.1 — La risorsa random_pet

Il primo blocco resource della configurazione di esempio definisce una risorsa `random_pet` chiamata `name`, che genera un nome casuale di animale domestico. Il nome generato serve a dare nomi univoci alle altre risorse.

```
resource "random_pet" "name" {}
```

Un blocco resource dichiara un tipo e un nome di risorsa. Insieme, tipo e nome formano un identificatore (ID) della risorsa nel formato `resource_type.resource_name`, in questo caso `random_pet.name`. L'ID di una risorsa deve essere univoco all'interno di un workspace, ed è quello che Terraform usa quando mostra informazioni sulla risorsa nel proprio output.

I tipi di risorsa iniziano sempre con il nome del provider seguito da un trattino basso: il tipo `random_pet` appartiene al provider `random`.

Il Terraform Registry ospita la documentazione dei provider di Terraform e delle loro risorse. La pagina di `random_pet` si trova sotto la documentazione del provider random. Contiene una descrizione della risorsa, un esempio d'uso, il riferimento degli argomenti (argument reference) e quello degli attributi (attribute reference).

Le risorse hanno argomenti, attributi e meta-argomenti:

- gli **argomenti** configurano una specifica risorsa, per questo molti argomenti valgono solo per quella risorsa. Il provider stabilisce quali sono obbligatori e quali facoltativi. Se manca un argomento obbligatorio, Terraform dà errore e non applica la configurazione.
- gli **attributi** sono valori esposti da una risorsa esistente, e i riferimenti a un attributo hanno il formato `resource_type.resource_name.attribute_name`. Gli argomenti specificano la configurazione di un oggetto dell'infrastruttura. Gli attributi invece vengono spesso assegnati alla risorsa dal cloud provider o dall'API sottostante.
- i **meta-argomenti** cambiano il comportamento di una risorsa: ad esempio il meta-argomento `count` crea più risorse. I meta-argomenti fanno parte di Terraform stesso e non dipendono dalla risorsa o dal provider.

La risorsa `random_pet` ha quattro argomenti facoltativi ed espone un attributo. Non avendo argomenti obbligatori, la risorsa `random_pet.name` si può definire senza argomenti.

### 4.1.2 — La risorsa dell'istanza EC2

Il blocco `aws_instance.web` definisce una risorsa `aws_instance` chiamata `web`, che crea un'istanza EC2 di AWS:

```
resource "aws_instance" "web" {
  ami                    = "ami-a0cfeed8"
  instance_type          = "t2.micro"
  user_data              = file("init-script.sh")

  tags = {
    Name = random_pet.name.id
  }
}
```

Gli argomenti dentro il blocco specificano quale tipo di risorsa creare:

- `instance_type` e `ami` dicono al provider AWS di creare un'istanza EC2 `t2.micro` con l'immagine macchina `ami-a0cfeed8`. La configurazione distribuisce in `us-west-2`. Per usare un'altra region, o se l'account AWS non ha accesso a questa AMI, bisogna mettere nell'argomento `ami` un'AMI accessibile nella propria region; con un'AMI diversa potrebbe servire aggiornare anche `init-script.sh`.
- `user_data` usa la funzione `file()` per leggere il contenuto di `init-script.sh`.
- `tags` specifica il nome dell'istanza EC2. Fa riferimento all'attributo ID di `random_pet.name` (`random_pet.name.id`) per dare all'istanza un nome univoco. Così si crea una dipendenza implicita tra l'istanza EC2 e la risorsa `random_pet`: Terraform non può creare l'istanza finché non ha un nome da darle.

Questi sono solo alcuni degli argomenti disponibili per `aws_instance`. L'elenco completo è nella pagina della documentazione di `aws_instance`.

### 4.1.3 — Creare l'infrastruttura

Il tutorial inizializza la configurazione con `terraform init`. Nella variante HCP Terraform lo fa dopo aver decommentato il blocco `cloud` nel file `terraform.tf`, e Terraform crea automaticamente il workspace `learn-terraform-resource` nell'organizzazione.

Poi applica la configurazione con `terraform apply`, che crea le due risorse. Al termine, l'output `domain-name` mostra l'endpoint dell'istanza EC2. Visitando l'URL però non si ottiene risposta, perché l'accesso alla porta 80 dell'istanza non è ancora configurato. Con HCP Terraform, il workspace mostra ora l'elenco di tutte le risorse che gestisce e gli output della configurazione.

### 4.1.4 — Associare un security group all'istanza

Per rendere accessibile il web server dell'istanza EC2 serve un security group che consenta il traffico in ingresso sulla porta 80 e tutto il traffico in uscita, associato all'istanza. Nel Terraform Registry si apre la documentazione del provider AWS, si cerca `security_group` e si seleziona la risorsa `aws_security_group`.

Dopo aver esaminato le opzioni di configurazione disponibili, si definisce in `main.tf` una nuova risorsa `aws_security_group` chiamata `web-sg`. Consente il traffico in ingresso sulla porta 80 e tutto il traffico in uscita, per tutti i blocchi CIDR:

```
resource "aws_security_group" "web-sg" {
  name = "${random_pet.name.id}-sg"
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Poi si aggiorna la risorsa `aws_instance.web` perché usi questo security group. La sezione *Argument Reference* di `aws_instance` indica che l'argomento `vpc_security_group_ids` richiede una lista di ID di security group. Lo si aggiunge quindi come lista, mettendo l'attributo `aws_security_group.web-sg.id` tra parentesi quadre:

```
resource "aws_instance" "web" {
  ami                    = "ami-a0cfeed8"
  instance_type          = "t2.micro"
  user_data              = file("init-script.sh")
  vpc_security_group_ids = [aws_security_group.web-sg.id]

  tags = {
    Name = random_pet.name.id
  }
}
```

Dopo un nuovo apply, l'istanza EC2 è accessibile pubblicamente. Visitando nel browser l'indirizzo dell'output `application-url`, che inizia con http e non con https, si vede l'applicazione PHP. Il valore dell'output si rilegge con `terraform output application-url`. Il deployment completo dell'applicazione PHP sull'istanza può richiedere circa 10 minuti.

Con `curl` si può anche mandare una richiesta HTTP all'endpoint dell'output `domain-name`, che restituisce l'ID dell'istanza EC2:

```
$ curl $(terraform output -raw domain-name)
```

- Fonte: [Define infrastructure with Terraform resources](https://developer.hashicorp.com/terraform/tutorials/configuration-language/resource)

---

## 4.2 — Creare e gestire le risorse

Questa pagina descrive il workflow per creare e gestire le risorse nella configurazione Terraform. Per una panoramica generale del provisioning dell'infrastruttura si veda il core workflow (sezione 3.1).

### 4.2.1 — Introduzione

Una risorsa è qualsiasi oggetto dell'infrastruttura che si vuole creare e gestire con Terraform: reti virtuali, istanze di calcolo o componenti di livello più alto come i record DNS. I tipi di risorse disponibili dipendono dai provider installati. I provider sono plugin che offrono un insieme di tipi di risorsa per una singola piattaforma infrastrutturale, cloud o on-premises (sezione 2.3).

### 4.2.2 — Scrivere la configurazione della risorsa

Si aggiunge un blocco `resource` al file di configurazione Terraform e si specificano gli argomenti necessari. La maggior parte degli argomenti è specifica della risorsa e ne controlla il comportamento. Si possono anche configurare argomenti propri di Terraform, chiamati meta-argomenti, che stabiliscono come Terraform crea e gestisce la risorsa (sezione 4.3).

### 4.2.3 — Inizializzare il workspace

In un nuovo progetto Terraform bisogna inizializzare il workspace, per scaricare e installare i provider e i moduli che servono a creare le risorse. Se si cambiano provider o moduli in un progetto esistente, bisogna reinizializzare il workspace prima di poter applicare la configurazione (sezione 3.4).

### 4.2.4 — Applicare la configurazione

La configurazione si applica con la CLI di Terraform. Quando si applica una configurazione, Terraform:

- crea le risorse della configurazione che non esistono ancora come oggetti reali dell'infrastruttura;
- distrugge le risorse che esistono nello state ma non più nella configurazione;
- aggiorna sul posto le risorse i cui argomenti sono cambiati;
- distrugge e ricrea le risorse i cui argomenti sono cambiati, se i limiti delle API remote impediscono di aggiornarle sul posto;
- aggiorna il file di state, perché configurazione, infrastruttura reale e state corrispondano.

### 4.2.5 — Gestire le risorse

Con il tempo le esigenze dell'infrastruttura cambiano. Si può voler aggiungere o rimuovere risorse dalla configurazione, riorganizzare gruppi di risorse in moduli riutilizzabili, oppure rimuovere o dismettere risorse dal cloud provider o dal file di state. La documentazione rimanda a queste pagine:

- *Creating modules*, su come raccogliere le risorse in moduli riutilizzabili;
- *Refactoring modules*, su come spostare e rinominare le risorse;
- *Remove a resource from state*, su come rimuovere una risorsa dallo state senza distruggere l'oggetto reale (sezione 6.9);
- *Destroy a resource*, su come rimuovere una risorsa dallo state distruggendo anche l'infrastruttura reale.

Molti provider permettono anche di leggere dati, per usare informazioni sull'infrastruttura esistente senza creare nuovi oggetti. È il compito dei data source (sezione 4.5).

- Fonte: [Create and manage resources overview](https://developer.hashicorp.com/terraform/language/v1.12.x/resources)

---

## 4.3 — Il blocco resource

Il blocco `resource` definisce un componente dell'infrastruttura e specifica le impostazioni con cui Terraform lo crea. Gli argomenti supportati da ogni risorsa dipendono dal provider, quindi per la configurazione di una risorsa specifica si consulta la documentazione del provider.

### 4.3.1 — Modello di configurazione

Il blocco resource supporta questi argomenti:

- `resource "<TYPE>" "<LABEL>"` (blocco), con gli argomenti definiti dal provider;
- `count` (numero), mutuamente esclusivo con `for_each`;
- `depends_on` (lista di riferimenti);
- `for_each` (map o set di stringhe), mutuamente esclusivo con `count`;
- `provider` (riferimento);
- `lifecycle` (blocco), con `create_before_destroy` (booleano), `prevent_destroy` (booleano), `ignore_changes` (lista di attributi), `replace_triggered_by` (lista di riferimenti), e i blocchi `precondition` e `postcondition`, ognuno con `condition` ed `error_message`;
- `connection` (blocco), con le impostazioni di connessione descritte più avanti;
- `provisioner "<TYPE>"` (blocco), con gli argomenti descritti più avanti e un eventuale blocco `connection`.

### 4.3.2 — Configurazione completa

Il blocco seguente contiene tutti gli argomenti integrati che si possono impostare su una risorsa:

```
resource "<TYPE>" "<LABEL>" {
  <PROVIDER_ARGUMENTS>
  count = <NUMBER>      # `for_each` and `count` are mutually exclusive
  depends_on = [ <RESOURCE.ADDRESS.EXPRESSION> ]
  for_each = {          # `for_each` and `count` are mutually exclusive
    <KEY> = <VALUE>
  }
  for_each = [       # `for_each` accepts a map or a set of strings
    "<VALUE>",
    "<VALUE>"
  ]
  provider = <REFERENCE.TO.ALIAS>
  lifecycle {
    create_before_destroy = <true || false>
    prevent_destroy = <true || false>
    ignore_changes = [ <ATTRIBUTE> ]
    replace_triggered_by = [ <RESOURCE.ADDRESS.EXPRESSION> ]
    precondition {
      condition = <EXPRESSION>
      error_message = "<STRING>"
    }
    postcondition {
      condition = <EXPRESSION>
      error_message = "<STRING>"
    }
  }
  connection {
    type = <"ssh" or "winrm">
    host = <EXPRESSION>
    <DEFAULT_CONNECTION_SETTINGS>
  }
  provisioner "<TYPE>" {
    source = "<PATH>"
    destination = "<PATH>"
    content = "<CONTENT TO COPY TO `destination`>"
    command = <COMMAND>
    working_dir = "<PATH TO DIR WHERE TERRAFORM EXECUTES `command`>"
    interpreter = [
      "<PATH TO INTERPRETER EXECUTABLE>",
      "<COMMAND> <ARGUMENTS>"
    ]
    environment {
      "<KEY>" = "<VALUE>"
    }
    when = <TERRAFORM COMMAND>
    quiet = <true || false>
    inline = [ "<COMMAND>" ]
    script = "<PATH>"
    scripts = [
      "<PATH>"
    ]
    on_failure = <continue || fail>
    connection {
      type = <"ssh" or "winrm">
      host = <EXPRESSION>
      <SPECIFIC_CONNECTION_SETTINGS>
    }
  }
}
```

### 4.3.3 — Tipo, etichetta e argomenti del provider

Per ogni blocco resource bisogna impostare due argomenti:

- `TYPE` specifica il tipo di risorsa da creare. Può essere un tipo di risorsa definito dal provider, oppure il tipo integrato `terraform_data`, che conserva valori e attiva operazioni di Terraform senza creare infrastruttura reale.
- `LABEL` specifica un nome per la risorsa. Terraform usa questa etichetta per tracciare la risorsa nel file di state, e l'etichetta non influisce sulle impostazioni della risorsa reale.

Nella configurazione si fa riferimento alla risorsa con la sintassi `<TYPE>.<LABEL>`. Gli argomenti che si possono definire per una risorsa, oltre a quelli integrati, li stabilisce lo sviluppatore del provider e sono descritti nella documentazione del provider.

### 4.3.4 — I meta-argomenti

`count`, `depends_on`, `for_each`, `provider` e `lifecycle` sono **meta-argomenti**: fanno parte del linguaggio Terraform e controllano il modo in cui Terraform crea le risorse. Ognuno ha una propria pagina di riferimento (sezioni 4.10 e 4.23 per `depends_on` e `lifecycle`).

- `count` fa creare a Terraform più istanze della stessa risorsa, con configurazione identica o simile. Non si possono usare `count` e `for_each` nello stesso blocco.
- `depends_on` specifica una risorsa a monte da cui la risorsa dipende. Terraform completa tutte le operazioni sulla risorsa a monte prima di operare sulla risorsa che contiene `depends_on`:

```
resource {
  depends_on = [ <resource reference> ]
}
```

- `for_each` fa creare a Terraform risorse simili senza bisogno di un blocco di configurazione separato per ognuna. Accetta un set di stringhe (`for_each = [ "<VALUE>" ]`) o una map (`for_each = { "<KEY>" = "<VALUE>" }`).
- `provider` fa usare a Terraform una configurazione del provider alternativa per creare la risorsa, con la sintassi `provider = <provider>.<alias>`.
- `lifecycle` è un blocco che definisce regole di ciclo di vita, cioè quando e come Terraform deve operare sulla risorsa.

**Le regole del blocco lifecycle** _(stepTitle)_

Nel blocco `lifecycle` si possono specificare queste regole:

- `create_before_destroy`: Terraform crea la risorsa sostitutiva prima di distruggere quella attuale.
- `prevent_destroy`: Terraform rifiuta i piani che distruggerebbero la risorsa e restituisce un errore. La regola non impedisce di distruggere la risorsa se se ne rimuove la configurazione. Per rimuovere una risorsa dallo state senza distruggere quella reale si veda *Remove a resource from state* (sezione 6.9).
- `ignore_changes`: una lista di attributi della risorsa le cui modifiche Terraform deve ignorare. Senza questa regola, Terraform cerca di aggiornare la risorsa reale perché corrisponda alla configurazione.
- `replace_triggered_by`: Terraform sostituisce la risorsa quando cambia una qualsiasi delle risorse o degli attributi referenziati.
- `precondition`: un blocco con una condizione che deve essere vera prima che Terraform valuti la risorsa e operi su di essa, più un messaggio d'errore da stampare quando la condizione è falsa.
- `postcondition`: un blocco con una condizione che deve essere vera dopo che Terraform ha operato sulla risorsa, più un messaggio d'errore da stampare nella console quando la condizione è falsa.

Per precondition e postcondition si veda *Validate your configuration* (sezione 4.24). Le impostazioni del blocco `lifecycle` influiscono su come Terraform costruisce e attraversa il grafo delle dipendenze. Per questo nel blocco si possono usare solo valori letterali: Terraform li elabora prima di valutare le espressioni del run.

### 4.3.5 — Il blocco connection

Il blocco `connection` specifica le impostazioni con cui i provisioner si collegano alle risorse, così Terraform può operare sulla risorsa dopo averla creata.

> **Attenzione**: HashiCorp consiglia di eseguire le azioni sulla macchina locale o remota con strumenti di configuration management o con altri mezzi, invece di usare i provisioner (pagina *Perform post-apply action*).
_(infoBox)_

Il blocco `connection` si può mettere nel blocco resource o nel blocco provisioner. Nel blocco resource imposta le connessioni predefinite per tutti i provisioner della risorsa, che le usano per collegarsi alla risorsa remota dopo il provisioning:

```
resource {
  # . . .
  connection {
    <settings for all provisioners in the resource>
  }
}
```

Dentro un blocco provisioner definisce invece impostazioni valide solo per quel provisioner:

```
resource {
  # . . .
  provisioner {
    # . . .
    connection {
      <settings for all provisioners in the resource>
    }
  }
}
```

Per default Terraform non valida le chiavi host SSH. Si può predisporre un meccanismo separato di distribuzione delle chiavi, e impostare esplicitamente l'argomento `host_key` per verificare una chiave specifica o una CA di firma. Negli argomenti del blocco `connection` si possono usare valori ephemeral (sezione 4.28).

Le espressioni dei blocchi connection non possono fare riferimento per nome alla propria risorsa padre. I riferimenti creano dipendenze, e riferirsi a una risorsa per nome dentro il suo stesso blocco creerebbe un ciclo di dipendenze. Per riferirsi al blocco padre, compresi tutti i suoi attributi, si usa l'oggetto `self`: ad esempio `self.public_ip` per l'attributo `public_ip` di un `aws_instance`.

> **Suggerimento**: si possono definire più connessioni. Un primo provisioner può collegarsi come utente root per creare gli account utente, e i provisioner successivi possono collegarsi come utenti con meno privilegi per operazioni più specifiche.
_(infoBox)_

La tabella descrive gli argomenti del blocco `connection` (il blocco è di tipo Block e non ha default):

| **Argomento** | **Descrizione** | **Connessione** | **Default** |
|---|---|---|---|
| `type` | Tipo di connessione con la risorsa remota: `ssh` o `winrm`. Con `winrm` i provisioner adottano comportamenti specifici per Windows, anche se `target_platform` è `unix` | — | `ssh` |
| `user` | Utente della connessione | ssh, winrm | `root` con ssh, `Administrator` con winrm |
| `password` | Password della connessione | ssh, winrm | nessuno |
| `host` | Indirizzo della risorsa a cui collegarsi; obbligatorio | ssh, winrm | nessuno |
| `port` | Porta a cui collegarsi | ssh, winrm | 22 con ssh, 5985 con winrm |
| `timeout` | Quanto attendere che la connessione diventi disponibile | ssh, winrm | `"5m"` |
| `script_path` | Percorso sulla risorsa remota in cui Terraform copia gli script, con numeri casuali che dipendono da `target_platform` | ssh, winrm | `/tmp/terraform_%RAND%.sh` con unix, `C:/windows/temp/terraform_%RAND%.cmd` con windows |
| `private_key` | Contenuto di una chiave SSH; ha la precedenza su `password` se sono presenti entrambi. Si carica con la funzione `file` | ssh | nessuno |
| `certificate` | Contenuto di un certificato firmato da una CA; richiede anche `private_key` | ssh | nessuno |
| `agent` | Agente SSH per l'autenticazione; `false` disabilita ssh-agent. Su Windows l'unico agente supportato è Pageant | ssh | `false` |
| `agent_identity` | Identità preferita dell'agente SSH da usare per l'autenticazione | ssh | nessuno |
| `host_key` | Chiave pubblica dell'host remoto o della CA di firma, per verificare la connessione | ssh | nessuno |
| `target_platform` | Piattaforma di destinazione, `windows` o `unix`; influisce sul default di `script_path`. Se la shell SSH predefinita è PowerShell, `script_path` va impostato a `"c:/windows/temp/terraform_%RAND%.ps1"` | ssh | `unix` |
| `https` | `true` per collegarsi in HTTPS invece che in HTTP | winrm | `false` |
| `insecure` | `true` per non validare la catena dei certificati HTTPS | winrm | `false` |
| `use_ntlm` | `true` per usare l'autenticazione NTLM invece di quella basic, che così non serve abilitare sul sistema di destinazione | winrm | `false` |
| `cacert` | Certificato della CA rispetto a cui validare | winrm | nessuno |
| `bastion_host` | Indirizzo del bastion host, a cui il provisioner si collega prima di collegarsi a `host` | ssh | nessuno |
| `bastion_host_key` | Chiave pubblica dell'host remoto o della CA di firma, per verificare la connessione al bastion | ssh | nessuno |
| `bastion_port` | Porta della connessione al bastion host | ssh | valore di `port` |
| `bastion_user` | Utente della connessione al bastion host | ssh | valore di `user` |
| `bastion_password` | Password della connessione al bastion host | ssh | valore di `password` |
| `bastion_private_key` | Contenuto della chiave SSH per il bastion host | ssh | valore di `private_key` |
| `bastion_certificate` | Certificato firmato da una CA per il bastion host; richiede anche `bastion_private_key` | ssh | valore di `certificate` |
| `proxy_scheme` | Protocollo della connessione al proxy: `http`, `https` o `socks5` | ssh | nessuno |
| `proxy_host` | Indirizzo del proxy host, a cui il provisioner si collega per primo; poi si collega al bastion host, se configurato, altrimenti a `host` | ssh | nessuno |
| `proxy_port` | Porta della connessione al proxy host | ssh | nessuno |
| `proxy_user_name` | Utente per il proxy host, da configurare solo se il proxy richiede autenticazione | ssh | nessuno |
| `proxy_user_password` | Password per il proxy host, da configurare solo se il proxy richiede autenticazione | ssh | nessuno |

### 4.3.6 — Il blocco provisioner

Il blocco `provisioner` definisce azioni da eseguire sulla macchina locale o sulla risorsa creata, ad esempio per preparare un server o un altro oggetto dell'infrastruttura a entrare in servizio. Anche qui vale l'avvertenza della sezione precedente: HashiCorp consiglia strumenti di configuration management o altri mezzi al posto dei provisioner.

```
resource {
  provisioner "<TYPE>" {
    <arguments>
  }
}
```

Il blocco supporta un `TYPE` obbligatorio, che indica il tipo di provisioner, e un'etichetta `LABEL` facoltativa per dargli un nome univoco. I tipi possibili sono tre:

- `file` copia file o directory dalla macchina su cui gira Terraform alla nuova risorsa. Se il provisioner file comunica con un sistema Windows via SSH, bisogna configurare OpenSSH perché esegua i comandi con `cmd.exe` e non con PowerShell. PowerShell è incompatibile sia con le shell Unix sia con l'interprete dei comandi di Windows, e causa errori nell'analisi dei file.
- `local-exec` esegue un programma sulla macchina locale dopo che Terraform ha creato la risorsa.
- `remote-exec` esegue un programma sulla risorsa remota dopo che Terraform l'ha creata.

Il tipo di provisioner determina quali argomenti si possono usare nel blocco:

| **Tipo di provisioner** | **Argomenti** |
|---|---|
| `file` | `source`, `content`, `destination` |
| `local-exec` | `command`, `working_dir`, `interpreter`, `environment`, `when`, `quiet` |
| `remote-exec` | `inline`, `script`, `scripts` |
| Tutti i tipi | `connection`, `on_failure` |

**Argomenti del provisioner file** _(stepTitle)_

- `source` (stringa) indica il file o la directory da copiare nella posizione di `destination`, e può contenere un'espressione. Non si può usare insieme a `content` nello stesso blocco. Se `source` è una directory e la connessione è di tipo `ssh`, la directory di `destination` deve già esistere; la si può creare con un provisioner `remote-exec`. Con connessione `winrm`, Terraform la crea se non esiste. La barra finale conta. Con la barra finale, Terraform copia il contenuto della directory: con `source = "/foo/"` e `destination = "/tmp"` carica il contenuto di `/foo` in `/tmp`. Senza barra finale, Terraform crea la directory dentro la destinazione: con `source = "/foo"` carica la directory `/foo` in `/tmp/foo`.
- `content` (stringa) indica un contenuto da scrivere direttamente nella posizione di `destination`, e può contenere un'espressione. Se `destination` è un file, Terraform vi scrive il valore. Se è una directory, Terraform vi crea un file chiamato `tf-file-content`. Con `content` è consigliato che `destination` sia un file, e non si può usare insieme a `source`.
- `destination` (stringa) indica il percorso sulla risorsa remota in cui Terraform copia il contenuto, fornito da `source` o da `content`. Il percorso lo valuta il sistema remoto, non Terraform, quindi i valori validi dipendono dal sistema operativo e dal software di accesso remoto.

Con connessione `ssh`, il provisioner passa il percorso di `destination` così com'è al programma `scp` sull'host remoto. L'implementazione OpenSSH di `scp` lavora per default nella home directory dell'utente remoto. Si può quindi indicare un percorso relativo, per caricare nella home, o un percorso assoluto per caricare altrove. Il processo `scp` remoto ha i permessi dell'utente indicato nelle impostazioni di connessione, quindi i permessi potrebbero impedire di scrivere fuori dalla home directory.

Con connessione `winrm`, Terraform usa PowerShell per interpretare il percorso di `destination`. Non bisogna quindi usare metacaratteri che PowerShell potrebbe interpretare, e soprattutto non vi va messo input esterno non fidato, perché permetterebbe di eseguire codice PowerShell arbitrario sul sistema remoto. Su WinRM Terraform procede così:

1. genera un nome di file temporaneo nella directory indicata dalla variabile d'ambiente `TEMP` del sistema remoto;
2. genera una sequenza di comandi `echo` che aggiungono un poco alla volta al file temporaneo blocchi del file sorgente codificati in base64;
3. con uno script PowerShell caricato, legge il file temporaneo, lo decodifica dal base64 e scrive il risultato grezzo nel file di destinazione.

I sistemi Windows moderni supportano un server OpenSSH, quindi HashiCorp raccomanda vivamente SSH al posto di WinRM.

**Argomenti del provisioner local-exec** _(stepTitle)_

- `command` (stringa, obbligatorio) indica il comando di un programma locale da eseguire, con un percorso assoluto o relativo alla directory di lavoro corrente. Terraform valuta il comando in una shell locale e può usare le variabili d'ambiente per la sostituzione. HashiCorp sconsiglia di usare variabili di Terraform per la sostituzione, perché può aprire vulnerabilità di shell injection (si veda l'articolo OWASP *Code Injection*). Al loro posto si usano il parametro `environment` e la sostituzione delle variabili d'ambiente.
- `working_dir` (stringa) indica la directory di lavoro in cui Terraform esegue `command`, con un percorso relativo alla directory di lavoro corrente o assoluto. La directory deve già esistere.
- `interpreter` (lista) indica gli argomenti dell'interprete con cui eseguire `command`. Il primo elemento è il percorso dell'interprete, relativo o assoluto. Se non si specifica un interprete, Terraform usa i default del sistema operativo.
- `environment` (blocco) contiene coppie chiave-valore che formano l'ambiente in cui viene eseguito `command`.
- `when` indica un comando di Terraform che attiva le azioni del provisioner: quando si esegue quel comando, Terraform esegue `command` (pagina *Destroy-time provisioners*).
- `quiet` (booleano) disattiva la stampa su stdout del comando di `command`. Con `quiet = true` Terraform stampa su stdout `"Suppressed by quiet=true"`, ma stampa comunque l'output del comando.

**Argomenti del provisioner remote-exec** _(stepTitle)_

- `inline` (lista) contiene le stringhe dei comandi da eseguire sulla risorsa remota. Il provisioner usa la shell predefinita della risorsa remota, a meno che il primo comando non indichi una shell, ad esempio `#!/bin/bash`. Non si può usare nello stesso provisioner con `script` o `scripts`.
- `script` (stringa) indica il percorso, relativo o assoluto, di uno script sulla macchina locale da copiare ed eseguire sulla risorsa remota. Non si può usare insieme a `inline` o `scripts`.
- `scripts` (lista) indica i percorsi, relativi o assoluti, di più file di script sulla macchina locale da copiare ed eseguire sulla risorsa remota. Non si può usare insieme a `inline` o `script`.

**on_failure** _(stepTitle)_

L'argomento `on_failure` indica cosa deve fare Terraform quando un provisioner fallisce. Accetta due valori:

- `continue`: Terraform ignora l'errore e prosegue con l'operazione di creazione o distruzione.
- `fail`: è il default. Terraform solleva un errore e smette di applicare la configurazione. Se il provisioner è di creazione, Terraform marca la risorsa come tainted.

### 4.3.7 — Esempi

**Più istanze di una risorsa** _(stepTitle)_

Per creare più istanze di una risorsa si usa `count` o `for_each`. `count` è più adatto a istanze identiche o quasi identiche. `for_each` è più adatto a istanze simili che dipendono da attributi definiti in una map o in un set. L'esempio seguente crea un'istanza per ogni subnet fornita nell'input variable:

```
variable "subnet_ids" {
  type = list(string)
}

resource "aws_instance" "server" {

  count = length(var.subnet_ids)

  ami           = "ami-a1b2c3d4"
  instance_type = "t2.micro"
  subnet_id     = var.subnet_ids[count.index]

  tags = {
    Name = "Server ${count.index}"
  }
}
```

Con `for_each` si possono creare due istanze a partire da una map costruita con la funzione `tomap()`, o quattro istanze a partire da un set costruito con la funzione `toset()`:

```
resource "azurerm_resource_group" "rg" {
  for_each = tomap({
    a_group       = "eastus"
    another_group = "westus2"
  })
  name     = each.key
  location = each.value
}

resource "aws_iam_user" "the-accounts" {
  for_each = toset(["Todd", "James", "Alice", "Dottie"])
  name     = each.key
}
```

Lo stesso vale per i moduli. Nell'esempio, il blocco `module` crea un'istanza del modulo `publish_bucket` per ogni elemento del set di `for_each`, e usa l'attributo `each.key` per dare a ogni bucket un nome univoco:

```
module "bucket" {
  for_each = toset(["assets", "media"])
  source   = "./publish_bucket"
  name     = "${each.key}_bucket"
}
```

Il modulo `publish_bucket`, nel file `publish_bucket/bucket-and-cloudfront.tf`, riceve il nome con la variabile `name`:

```
variable "name" {}

resource "aws_s3_bucket" "example" {
   bucket = var.name
   #...
}

resource "aws_iam_user" "deploy_user" {
   #...
}
```

**Specificare una dipendenza** _(stepTitle)_

Nell'esempio, la risorsa `aws_iam_instance_profile` fa riferimento alla risorsa `aws_iam_role`, quindi Terraform crea per prima la risorsa a monte. La risorsa `aws_iam_role_policy` configura una policy IAM che permette all'istanza EC2 di accedere all'API S3.

Terraform deduce da solo che deve creare l'instance profile prima dell'istanza EC2. Non può invece dedurre che il software in esecuzione nell'istanza ha bisogno dell'accesso all'API S3 per avviarsi correttamente. Per questo la configurazione gli dice esplicitamente di creare prima `aws_iam_role_policy`:

```
resource "aws_iam_role" "example" {
  name = "example"
  assume_role_policy = "..."
}

resource "aws_iam_instance_profile" "example" {
  role = aws_iam_role.example.name
}

resource "aws_iam_role_policy" "example" {
  name   = "example"
  role   = aws_iam_role.example.name
  policy = jsonencode({
    "Statement" = [{
      "Action" = "s3:*",
      "Effect" = "Allow",
    }],
  })
}

resource "aws_instance" "example" {
  ami           = data.aws_ami.example.id
  instance_type = "t2.micro"
  iam_instance_profile = aws_iam_instance_profile.example.name
  depends_on = [
    aws_iam_role_policy.example
  ]
}
```

**Configurazione alternativa del provider** _(stepTitle)_

Nell'esempio, la risorsa `google_compute_instance` usa la configurazione del provider con alias `europe`:

```
provider "google" {
  region = "us-central1"
}

provider "google" {
  alias  = "europe"
  region = "europe-west1"
}

resource "google_compute_instance" "example" {
  provider = google.europe
  # ...
}
```

**Ignorare modifiche e sostituire su trigger** _(stepTitle)_

Con `ignore_changes = [tags]` nel blocco `lifecycle`, Terraform ignora le modifiche ai tag della risorsa. Con `replace_triggered_by`, invece, Terraform sostituisce `aws_appautoscaling_target` ogni volta che viene sostituita questa istanza di `aws_ecs_service`:

```
resource "aws_instance" "example" {
   # ...

   lifecycle {
      ignore_changes = [tags]
   }
}

resource "aws_appautoscaling_target" "ecs_target" {
   # ...
   lifecycle {
   replace_triggered_by = [
      aws_ecs_service.svc.id
     ]
   }
}
```

**Custom condition** _(stepTitle)_

L'esempio mostra come definire `precondition` e `postcondition` nel meta-argomento `lifecycle`. Il blocco `data` recupera l'AMI `ami-abc123`. La precondition richiede che l'AMI abbia `x86_64` come attributo `architecture`. La postcondition richiede che all'istanza EC2 venga assegnato un hostname DNS pubblico. Se una delle due condizioni non è soddisfatta, Terraform restituisce il messaggio `error_message` della condizione fallita:

```
data "aws_ami" "example" {
  owners = ["amazon"]
  filter {
    name   = "image-id"
    values = ["ami-abc123"]
  }
}

resource "aws_instance" "example" {
  instance_type = "t3.micro"
  ami           = data.aws_ami.example.id

  lifecycle {
    precondition {
      condition     = data.aws_ami.example.architecture == "x86_64"
      error_message = "The selected AMI must be for the x86_64 architecture."
    }

    postcondition {
      condition     = self.public_dns != ""
      error_message = "EC2 instance must be in a VPC that has public DNS hostnames enabled."
    }
  }
}
```

Il blocco `data` seguente recupera il volume di storage root collegato all'istanza EC2 `aws_instance.example`, tramite l'attributo `volume_id`. Quando un data source verifica il risultato di una managed resource dichiarata nella stessa configurazione, il controllo va messo in un blocco `postcondition`. Così Terraform attende che le modifiche alla managed resource siano completate prima di leggere il data source:

```
data "aws_ebs_volume" "example" {
  filter {
    name = "volume-id"
    values = [aws_instance.example.root_block_device[0].volume_id]
  }
  lifecycle {
    # The EC2 instance will have an encrypted root volume.
    postcondition {
      condition     = self.encrypted
      error_message = "The server's root volume is not encrypted."
    }
  }
}
```

**Provisioner e connessioni** _(stepTitle)_

Il provisioner `file` copia artefatti dalla macchina su cui gira Terraform alla risorsa appena creata. L'esempio mostra un file, un contenuto, una directory e il contenuto di una directory:

```
resource "aws_instance" "web" {
  # ...

  # Copies the myapp.conf file to /etc/myapp.conf
  provisioner "file" {
    source      = "conf/myapp.conf"
    destination = "/etc/myapp.conf"
  }

  # Copies the string in content into /tmp/file.log
  provisioner "file" {
    content     = "ami used: ${self.ami}"
    destination = "/tmp/file.log"
  }

  # Copies the configs.d folder to /etc/configs.d
  provisioner "file" {
    source      = "conf/configs.d"
    destination = "/etc"
  }

  # Copies all files and folders in apps/app1 to D:/IIS/webapp1
  provisioner "file" {
    source      = "apps/app1/"
    destination = "D:/IIS/webapp1"
  }
}
```

I provisioner possono anche eseguire operazioni remote, come script o comandi. Nell'esempio seguente Terraform si collega all'istanza `web` con le impostazioni del blocco `connection`, che valgono per tutti i provisioner della risorsa. Il provisioner `remote-exec` esegue poi i comandi `puppet apply` e `consul join` sulla risorsa:

```
resource "aws_instance" "web" {
  # ...

  connection {
    type     = "ssh"
    user     = "root"
    password = var.root_password
    host     = self.public_ip
  }

  provisioner "remote-exec" {
    inline = [
      "puppet apply",
      "consul join ${aws_instance.web.private_ip}",
    ]
  }
}
```

Allo stesso modo si può caricare uno script con un provisioner `file` (`source = "script.sh"`, `destination = "/tmp/script.sh"`) e lanciarlo con un `remote-exec` che esegue in `inline` i comandi `chmod +x /tmp/script.sh` e `/tmp/script.sh args`.

Infine, l'esempio seguente esegue il comando `echo` sulla macchina locale dopo aver creato la risorsa `web`, e grazie a `on_failure = continue` prosegue con l'operazione anche se il comando fallisce:

```
resource "aws_instance" "web" {
  # ...

  provisioner "local-exec" {
    command    = "echo The server's IP address is ${self.private_ip}"
    on_failure = continue
  }
}
```

- Fonte: [resource block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/resource)

---

## 4.4 — Interrogare i data source

I data source di Terraform permettono di recuperare dinamicamente dati dalle API o da altri backend di state di Terraform. Esempi tipici sono gli ID delle immagini macchina di un cloud provider o gli output di altre configurazioni Terraform. I data source rendono la configurazione più flessibile e dinamica e permettono di usare valori di altre configurazioni. Così si può limitare l'ambito di una configurazione pur continuando a usare gli attributi delle risorse da cui dipende. In HCP Terraform, i data source permettono di condividere dati tra workspace.

Nel tutorial si usano i data source per rendere la configurazione più dinamica, in quattro passi:

1. si crea con Terraform una VPC AWS con i relativi security group;
2. con il data source `aws_availability_zones` si rende la configurazione distribuibile in qualsiasi region;
3. si distribuisce l'infrastruttura applicativa, definita in una configurazione Terraform separata, e si usa il data source `terraform_remote_state` per leggere le informazioni sulla VPC;
4. con il data source `aws_ami` si configura l'AMI corretta per la region corrente.

Il tutorial usa due workspace HCP Terraform, `learn-terraform-data-sources-vpc` e `learn-terraform-data-sources-app`. Terraform li crea automaticamente all'inizializzazione, dopo aver impostato il nome dell'organizzazione nella variabile d'ambiente `TF_CLOUD_ORGANIZATION`.

### 4.4.1 — Aggiornare la region della VPC

La configurazione della VPC imposta la region con una variabile chiamata `aws_region`, con valore di default `us-east-1`. Cambiare il valore di `aws_region` però non basta a cambiare region. La configurazione della VPC include infatti un argomento `azs` per le availability zone, con una lista di zone della region `us-east-1` scritta a mano:

```
module "vpc" {
##...
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1e"]
##...
}
```

Per caricare le availability zone disponibili nella region corrente si aggiunge a `main.tf` il data source `aws_availability_zones`:

```
data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "zone-type"
    values = ["availability-zone"]
  }
}
```

Il data source `aws_availability_zones` fa parte del provider AWS e recupera una lista di availability zone in base agli argomenti forniti. Qui l'argomento `state` limita la lista alle zone attualmente disponibili.

Agli attributi di un data source si fa riferimento con lo schema `data.<NAME>.<ATTRIBUTE>`. Si aggiorna quindi la configurazione della VPC perché imposti la lista delle availability zone con questo data source:

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.14.0"

  cidr = var.vpc_cidr_block

  azs             = data.aws_availability_zones.available.names
  private_subnets = slice(var.private_subnet_cidr_blocks, 0, 2)
  public_subnets  = slice(var.public_subnet_cidr_blocks, 0, 2)

##...
}
```

Il workspace della VPC deve anche esportare come output la region, che servirà come input al workspace dell'applicazione. Si aggiungono quindi a `main.tf` un data source che legge le informazioni sulla region, e a `outputs.tf` l'output corrispondente:

```
data "aws_region" "current" { }

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}
```

Si applica la configurazione impostando `aws_region` a `us-west-1`:

```
$ terraform apply -var aws_region=us-west-1
```

> **Suggerimento**: in questo scenario l'output si potrebbe definire anche con la variabile `aws_region`, senza data source. La region AWS però si può configurare in più modi, e il data source `aws_region` restituisce la region corrente del provider AWS in qualunque modo sia stata configurata.
_(infoBox)_

### 4.4.2 — Configurare il remote state di Terraform

Con le risorse di rete distribuite, si passa alla directory `learn-terraform-data-sources-app`, che contiene la configurazione Terraform dell'applicazione, e la si inizializza. Come quella della VPC, anche questa configurazione contiene valori scritti a mano per la region `us-east-1`. Il data source `terraform_remote_state` permette di usare i dati di output di un altro workspace Terraform. Lo si aggiunge al file `main.tf`, sostituendo `YOUR_ORG` con il nome della propria organizzazione HCP Terraform:

```
data "terraform_remote_state" "vpc" {
  backend = "remote"

  config = {
    organization = "YOUR_ORG"
    workspaces = {
      name = "learn-terraform-data-sources-vpc"
    }
  }
}
```

Questo blocco usa il backend `remote` per caricare i dati di state dal workspace e dall'organizzazione indicati nella sezione `config`.

Per motivi di sicurezza, i workspace HCP Terraform possono accedere allo state l'uno dell'altro solo se lo si consente esplicitamente. Per dare al workspace `learn-terraform-data-sources-app` l'accesso allo state di `learn-terraform-data-sources-vpc` si procede così:

1. si accede a HCP Terraform e si sceglie l'organizzazione usata per il tutorial;
2. si apre il workspace `learn-terraform-data-sources-vpc`;
3. nella pagina **Settings > General** del workspace si trova la sezione **Remote state sharing**;
4. si sceglie l'opzione **Share with specific workspaces** e si seleziona il workspace `learn-terraform-data-sources-app`;
5. si fa clic su **Save settings**.

Poi si aggiorna la configurazione del provider aws in `main.tf`, perché usi la stessa region della configurazione della VPC invece di una region scritta a mano:

```
provider "aws" {
  region = data.terraform_remote_state.vpc.outputs.aws_region
}
```

La configurazione della VPC ha anche output con gli ID delle subnet e dei security group. Con questi valori si configurano gli argomenti del security group e delle subnet del load balancer nel modulo `elb`:

```
module "elb_http" {
##...
  security_groups = data.terraform_remote_state.vpc.outputs.lb_security_group_ids
  subnets         = data.terraform_remote_state.vpc.outputs.public_subnet_ids
##...
}
```

> **Nota**: il data source di remote state può caricare solo i valori di output "root-level" del workspace sorgente. Non può accedere direttamente ai valori delle risorse o dei moduli di quel workspace: per leggerli bisogna aggiungere un output corrispondente nel workspace sorgente.
_(infoBox)_

### 4.4.3 — Scalare le istanze EC2

I valori dei data source si usano come qualsiasi altro valore di Terraform, anche passandoli alle funzioni. La configurazione in `main.tf` usa una sola istanza EC2. La si aggiorna perché usi la variabile `instances_per_subnet` e crei più istanze EC2 per ogni subnet:

```
resource "aws_instance" "app" {
##...
  count = var.instances_per_subnet * length(data.terraform_remote_state.vpc.outputs.private_subnet_ids)

  ami = "ami-04d29b6f966df1537"
##...
}
```

Ora, applicando la configurazione, Terraform crea `var.instances_per_subnet` istanze per ogni subnet privata configurata nel workspace della VPC.

### 4.4.4 — AMI specifiche per la region

La configurazione dell'istanza AWS usa anche un ID di AMI scritto a mano, valido solo nella region `us-east-1`. Per caricare l'ID dell'AMI corretto per la region corrente si aggiunge a `main.tf` un data source `aws_ami`, e si sostituisce l'ID scritto a mano con quello caricato dal data source:

```
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "app" {
  count = var.instances_per_subnet * length(data.terraform_remote_state.vpc.outputs.private_subnet_ids)

  ami = data.aws_ami.amazon_linux.id

##...
}
```

### 4.4.5 — Subnet e security group delle istanze EC2

Infine si aggiorna la configurazione delle istanze EC2 perché usi le subnet e i security group del workspace della VPC:

```
resource "aws_instance" "app" {
##...

  subnet_id              = data.terraform_remote_state.vpc.outputs.private_subnet_ids[count.index % length(data.terraform_remote_state.vpc.outputs.private_subnet_ids)]
  vpc_security_group_ids = data.terraform_remote_state.vpc.outputs.app_security_group_ids

##...
}
```

Applicando la configurazione, Terraform crea l'infrastruttura dell'applicazione. Dopo qualche minuto gli health check del load balancer passano, e `curl $(terraform output -raw lb_url)` restituisce la risposta di esempio.

- Fonte: [Query data sources](https://developer.hashicorp.com/terraform/tutorials/configuration-language/data-sources)

---

## 4.5 — Interrogare i dati dell'infrastruttura

Si può far recuperare a Terraform dati da diverse fonti: API, workspace Terraform esterni, output di funzioni. Recuperare i dati dinamicamente rende la configurazione più flessibile.

### 4.5.1 — Introduzione

Molti provider mettono a disposizione dei data source quando vengono installati. I data source recuperano dati dal provider, ma non creano né modificano risorse. Per accedere ai dati di un data source si configura il blocco `data` con i suoi argomenti, descritti nella documentazione del provider.

Il provider interroga il data source in base alla configurazione. I dati ottenuti si usano poi in altre parti della configurazione, facendo riferimento agli attributi del data source.

Il blocco `data` supporta le espressioni e le altre funzionalità dinamiche del linguaggio Terraform. Supporta anche molti degli argomenti integrati in Terraform che controllano come Terraform crea l'oggetto dati: si vedano il riferimento del blocco `data` (sezione 4.6), le espressioni e i meta-argomenti.

**Struttura** _(stepTitle)_

Ogni blocco `data` è associato a un solo data source. Sui data source Terraform può eseguire solo operazioni di lettura.

**Comportamento dei data source** _(stepTitle)_

Terraform cerca di interrogare i data source durante la fase di plan. A seconda della configurazione, però, può rimandare la lettura alla fase di apply, e in quel caso lo segnala nell'output del plan.

Terraform può rimandare la lettura all'apply quando almeno uno degli argomenti fa riferimento a un attributo di una risorsa o a un altro valore che non può prevedere in fase di plan. Questo succede nei casi seguenti:

- la configurazione del blocco `data` dipende direttamente da una risorsa gestita da Terraform che cambierà nel piano corrente;
- la configurazione del blocco `data` ha custom condition che dipendono, direttamente o indirettamente, da una risorsa gestita da Terraform che cambierà nel piano corrente;
- gli argomenti del blocco `data` fanno riferimento a valori che vanno calcolati durante l'apply.

Quando il data source dipende da altri oggetti, i risultati della query sono sconosciuti durante il plan. Di conseguenza Terraform può creare le risorse che usano i valori recuperati solo in fase di apply. Le dipendenze sono descritte nella pagina *Configure dependencies*.

Se gli argomenti di un data source fanno riferimento a valori calcolati (computed), Terraform non può leggere il data source finché tutti gli argomenti non sono definiti. In quel caso rimanda il refresh del data source all'apply, e nel plan tutti gli attributi interpolati del data source compaiono come calcolati.

Se invece gli argomenti di un blocco `data` fanno riferimento a valori che non vanno calcolati, Terraform legge il data source e ne aggiorna lo state durante la fase di refresh. Per default Terraform esegue il refresh prima di creare un piano. Così i dati recuperati sono disponibili durante la pianificazione, e il diff mostra i valori reali restituiti.

**Data source specializzati** _(stepTitle)_

Alcuni data source sono utilità specializzate che generano dati esistenti solo durante l'operazione di Terraform, e Terraform li ricalcola a ogni plan successivo. Sono esempi di data source specializzati, solo locali:

- `data "template_file"`, che genera un testo da un file di template; richiede il provider template di HashiCorp;
- `data "local_file"`, che legge file locali; richiede il provider local di HashiCorp;
- `data "iam_policy_document"`, che genera policy IAM di AWS; richiede il provider aws.

### 4.5.2 — Requisiti

Per aggiungere argomenti `depends_on` ai blocchi `data` è consigliato usare Terraform 0.13 o successivo. In Terraform 0.12 e precedenti, un `depends_on` in un blocco `data` costringe Terraform a rimandare la lettura all'apply, con possibili comportamenti indesiderati.

### 4.5.3 — Dichiarare un data source

Si aggiunge un blocco `data` alla configurazione e si specificano gli argomenti necessari, come indicato nella documentazione del provider. Il blocco deve includere il tipo di data source e un'etichetta per i dati restituiti; i tipi disponibili sono elencati nella documentazione del provider. L'esempio dichiara un data source `aws_ami` chiamato `example`:

```
data "aws_ami" "example" {
  # . . .
}
```

Il blocco dice a Terraform di leggere dal data source `aws_ami` e di esportare il risultato in un oggetto chiamato `example`. Ai dati restituiti si fa riferimento con la sintassi `data.<TYPE>.<LABEL>.<ATTRIBUTE>`, ad esempio `data.aws_ami.example.id`.

### 4.5.4 — Configurare i vincoli della query

Gli argomenti nel corpo del blocco `data` definiscono i vincoli della query, e quelli disponibili sono descritti nella documentazione del provider. Nell'esempio, Terraform interroga il data source `aws_ami` cercando l'AMI più recente di proprietà dell'utente corrente, con il tag `Name` impostato a `app-server` e il tag `Tested` impostato a `true`:

```
data "aws_ami" "example" {
  most_recent = true
  owners = ["self"]
  tags = {
    Name   = "app-server"
    Tested = "true"
  }
}
```

Per configurare i vincoli si possono usare espressioni e le altre funzionalità dinamiche del linguaggio Terraform.

### 4.5.5 — Configurare come Terraform crea il data source

Per controllare come Terraform crea il data source si possono usare molti degli argomenti integrati di Terraform, i meta-argomenti. Il riferimento del blocco `data` (sezione 4.6) descrive tutte le opzioni.

**Dipendenze** _(stepTitle)_

Terraform rileva correttamente le dipendenze della configurazione, anche quando i valori di una risorsa gestita da Terraform arrivano in modo indiretto attraverso un local value. A volte però serve che Terraform crei le risorse in un ordine preciso. In quei casi si aggiunge un argomento `depends_on` al blocco `data` per modificare il grafo delle dipendenze. Con `depends_on`, Terraform interroga il data source solo dopo aver finito le operazioni sulla dipendenza indicata.

**Custom condition** _(stepTitle)_

Ai blocchi `data` si possono aggiungere blocchi `precondition` e `postcondition`, per dichiarare le ipotesi e le garanzie sul funzionamento del data source. Nell'esempio, la postcondition verifica che l'AMI del data source abbia il tag `nomad-server`:

```
data "aws_ami" "example" {
  id = var.aws_ami_id

  lifecycle {
    postcondition {
      condition     = self.tags["Component"] == "nomad-server"
      error_message = "tags[\"Component\"] must be \"nomad-server\"."
    }
  }
}
```

Le custom condition restituiscono informazioni utili sugli errori prima e nel loro contesto, così i problemi di configurazione sono più facili da diagnosticare. Aiutano anche chi manterrà la configurazione in futuro a capirne il design e l'intento.

**Più istanze** _(stepTitle)_

Ai blocchi `data` si possono aggiungere i meta-argomenti `count` e `for_each`, per creare più istanze del data source. Terraform legge ogni istanza del data source e ne indicizza i risultati separatamente. Ai dati di ciascuna istanza si fa riferimento con la sintassi `data.<NAME>[<KEY>]`. Con `for_each` la chiave `<KEY>` è il valore di ciascun elemento della collezione. Ad esempio, `data.azurerm_resource_group.rg["a_group"]` indica l'istanza del data source `rg` creata dalla chiave `a_group`.

> **Nota**: la pagina originale dice che con `count` la chiave è un numero che parte da 1. In realtà gli indici di `count` partono da 0, come per le risorse: la prima istanza è `data.<TYPE>.<NAME>[0]`.
_(infoBox)_

**Configurazioni alternative del provider** _(stepTitle)_

Si possono definire configurazioni alternative del provider con un `alias` e usarle in un blocco `data`: Terraform usa la configurazione indicata per interrogare il data source. Nell'esempio, il blocco `data` usa la configurazione del provider con alias `uswest1`:

```
provider "aws" {
  region = "us-east-1"
}

provider "aws" {
  alias  = "uswest1"
  region = "us-west-1"
}

data "aws_ami" "web" {
  provider = aws.uswest1

  # ...
}
```

### 4.5.6 — Fare riferimento ai dati interrogati

Agli attributi di un data source si fa riferimento nel resto della configurazione con la sintassi `data.<TYPE>.<LABEL>.<ATTRIBUTE>`. Nell'esempio completo seguente Terraform interroga il data source per trovare l'AMI disponibile più recente con il tag `Component = web`. Poi crea un'istanza AWS con l'ID dell'AMI recuperato da `data.aws_ami.web.id`:

```
data "aws_ami" "web" {
  filter {
    name   = "state"
    values = ["available"]
  }

  filter {
    name   = "tag:Component"
    values = ["web"]
  }

  most_recent = true
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.web.id
  instance_type = "t1.micro"
}
```

Il blocco `data` crea un data source `aws_ami` chiamato `web`, e la combinazione di tipo e nome deve essere univoca. Il prefisso d'indirizzo `data.aws_ami.web` serve a fare riferimento ai dati recuperati, e segue la sintassi dei riferimenti `data.<TYPE>.<NAME>.<ATTRIBUTE>`. I blocchi `filter`, i loro argomenti e l'argomento `most_recent` sono specifici del data source `aws_ami`: i dettagli sono nella documentazione del provider AWS nel Terraform Registry.

- Fonte: [Query infrastructure data](https://developer.hashicorp.com/terraform/language/v1.12.x/data-sources)

---

## 4.6 — Il blocco data

Il blocco `data` recupera dal provider dati su una risorsa, senza creare nessun oggetto dell'infrastruttura. Gli attributi del data source si usano per configurare altre risorse, così la configurazione resta dinamica e senza valori scritti a mano. Il tipo di sorgente, gli argomenti e gli attributi dipendono dal provider e sono descritti nella sua documentazione.

### 4.6.1 — Modello e configurazione completa

Il blocco `data` supporta questa configurazione:

- `data "<TYPE>" "<LABEL>"` (blocco), con gli argomenti specifici del provider;
- `count` (numero), mutuamente esclusivo con `for_each`;
- `depends_on` (lista di riferimenti);
- `for_each` (map o set di stringhe), mutuamente esclusivo con `count`;
- `provider` (riferimento);
- `lifecycle` (blocco), con i blocchi `precondition` e `postcondition`, ognuno con `condition` ed `error_message`.

Il blocco seguente contiene tutti gli argomenti integrati supportati da un data source:

```
data "<TYPE>" "<LABEL>" {
   <PROVIDER-SPECIFIC ARGUMENTS>
   count = <NUMBER>      # `count` and `for_each` are mutually exclusive
   depends_on = [ <RESOURCE.ADDRESS.EXPRESSION> ]
   for_each = {          # `for_each` and `count` are mutually exclusive
      <KEY> = <VALUE>
   }
   for_each = [       # `for_each` accepts a map or a set of strings
    "<VALUE>",
    "<VALUE>"
   ]
   provider = <REFERENCE.TO.ALIAS>
   lifecycle {
      precondition {
         condition = <EXPRESSION>
         error_message = "<STRING>"
    }
    postcondition {
      condition = <EXPRESSION>
      error_message = "<STRING>"
    }
  }
}
```

### 4.6.2 — Specifica

Per ogni blocco `data` bisogna impostare due argomenti:

- `TYPE` specifica il tipo di data source. I data source supportati li definiscono gli sviluppatori del provider. Terraform include anche il data source `terraform_remote_state`, che permette di accedere ai dati di state di altri workspace.
- `LABEL` specifica un nome per il data source. Ai dati si fa riferimento con la sintassi `data.<label>.<attribute>`.

Gli argomenti specifici del data source li stabilisce lo sviluppatore del provider e sono descritti nella documentazione del provider.

I meta-argomenti funzionano come nel blocco `resource` (sezione 4.3):

- `count` crea più istanze dello stesso data source, con configurazione identica o simile, e non si può usare insieme a `for_each`.
- `depends_on` indica una risorsa a monte da cui il data source dipende. Terraform completa tutte le operazioni su quella risorsa prima di operare sul data source:

```
data "<TYPE>" "<LABEL>" {
  depends_on = [ <resource reference> ]
}
```

- `for_each` crea istanze simili senza un blocco separato per ognuna, a partire da un set o da una map:

```
data "<TYPE>" "<LABEL>" {
  for_each = [ "<VALUE>" ]
  # . . .
}
```

```
data "<TYPE>" "<LABEL>" {
  for_each = {
    "<KEY>" = "<VALUE>"
  }
}
```

- `provider` fa usare una configurazione del provider alternativa (`provider = <provider>.<alias>`).

Il blocco `lifecycle` definisce le regole con cui Terraform opera sul data source. Per i data source le regole sono due:

- `precondition`: una condizione che Terraform valuta prima di creare il data source, e che deve essere vera perché Terraform lo valuti e operi su di esso; si può specificare un messaggio d'errore da stampare quando la condizione è falsa:

```
resource {
  lifecycle {
    precondition {
      condition = <expression>
      error_message = "<message>"
    }
  }
}
```

> **Nota**: l'esempio della pagina originale usa `resource {`; in un data source il blocco `lifecycle` va dentro `data "<TYPE>" "<LABEL>" {`.
_(infoBox)_

- `postcondition`: una condizione che deve essere vera dopo che Terraform ha operato sul data source, con un eventuale messaggio d'errore da stampare nella console.

Come per le risorse, le impostazioni del blocco `lifecycle` influiscono su come Terraform costruisce e attraversa il grafo delle dipendenze. Per questo nel blocco si possono usare solo valori letterali.

- Fonte: [data block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/data)

---

## 4.7 — Creare dipendenze tra le risorse

Questo tutorial spiega le dipendenze tra risorse e moduli. Nella maggior parte dei casi Terraform deduce le dipendenze tra le risorse dalla configurazione, così crea e distrugge le risorse nell'ordine corretto. A volte però Terraform non riesce a dedurre le dipendenze tra parti diverse dell'infrastruttura, e bisogna creare una dipendenza esplicita con l'argomento `depends_on`. Il tutorial si può svolgere con HCP Terraform, impostando l'organizzazione nella variabile d'ambiente `TF_CLOUD_ORGANIZATION`, oppure in locale commentando il blocco `cloud` in `terraform.tf`.

### 4.7.1 — Dipendenze implicite

La fonte più comune di dipendenze è una dipendenza implicita tra due risorse o moduli. La configurazione in `main.tf` dichiara due istanze EC2 e un indirizzo IP elastico:

```
provider "aws" {
  region = var.aws_region
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "example_a" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"
}

resource "aws_instance" "example_b" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"
}

resource "aws_eip" "ip" {
  vpc      = true
  instance = aws_instance.example_a.id
}
```

Il tipo di risorsa `aws_eip` alloca un Elastic IP e lo associa a un'istanza EC2. L'istanza deve esistere prima che l'Elastic IP possa essere creato e collegato, quindi Terraform deve creare `aws_instance.example_a` prima di `aws_eip.ip`. L'istanza `aws_instance.example_b` invece si può creare in parallelo con le altre risorse.

Applicando la configurazione, Terraform crea le risorse in ordine e riporta l'avanzamento. Dall'output si vede che le due istanze vengono create in parallelo, e che Terraform aspetta il completamento di `example_a` prima di creare l'indirizzo Elastic IP:

```
aws_instance.example_a: Creating...
aws_instance.example_b: Creating...
aws_instance.example_b: Creation complete after 32s [id=i-0d485fc8d11d27c87]
aws_instance.example_a: Creation complete after 33s [id=i-07c07aebe269be8a5]
aws_eip.ip: Creating...
aws_eip.ip: Creation complete after 1s [id=eipalloc-0ef86dc6fbb50ccf8]
```

Terraform capisce da solo quando una risorsa dipende da un'altra, esaminando gli attributi delle risorse usati nelle espressioni di interpolazione. Nell'esempio, il riferimento a `aws_instance.example_a.id` nel blocco `aws_eip.ip` crea una dipendenza implicita.

Terraform usa queste informazioni sulle dipendenze per stabilire l'ordine corretto in cui creare le risorse. Per farlo costruisce un grafo delle dipendenze di tutte le risorse definite nella configurazione (sezione 3.13). Nell'esempio, Terraform sa che l'istanza EC2 va creata prima dell'Elastic IP.

### 4.7.2 — Dipendenze esplicite

Le dipendenze implicite sono il modo principale con cui Terraform capisce le relazioni tra le risorse. A volte però tra le risorse ci sono dipendenze che Terraform non può vedere. L'argomento `depends_on` è accettato da qualsiasi blocco resource o module, e prende una lista di risorse per cui creare dipendenze esplicite.

Ad esempio, un'applicazione in esecuzione sull'istanza EC2 potrebbe aspettarsi di usare un determinato bucket Amazon S3. La dipendenza è configurata dentro l'applicazione, quindi Terraform non la vede, e la si dichiara esplicitamente con `depends_on`. In `depends_on` si possono indicare anche più risorse: Terraform aspetta che siano state create tutte prima di creare la risorsa di destinazione.

> **Suggerimento**: Terraform aspetta che la risorsa indicata sia creata prima di creare la risorsa dipendente. Aggiungere dipendenze esplicite può quindi allungare il tempo necessario a creare l'infrastruttura.
_(infoBox)_

Si aggiunge a `main.tf` la configurazione seguente:

```
resource "aws_s3_bucket" "example" { }

resource "aws_instance" "example_c" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro"

  depends_on = [aws_s3_bucket.example]
}

module "example_sqs_queue" {
  source  = "terraform-aws-modules/sqs/aws"
  version = "3.3.0"

  depends_on = [aws_s3_bucket.example, aws_instance.example_c]
}
```

> **Suggerimento**: l'ordine in cui le risorse sono dichiarate nei file di configurazione non influisce sull'ordine in cui Terraform le crea o le distrugge.
_(infoBox)_

La configurazione fa riferimento a un nuovo modulo, `terraform-aws-modules/sqs/aws`. I moduli vanno installati prima che Terraform possa usarli, quindi si esegue `terraform get` per installarlo, e poi `terraform apply`. Sia l'istanza sia la coda SQS dipendono dal bucket S3, quindi Terraform aspetta che il bucket sia creato prima di iniziare a creare le altre due risorse.

- Fonte: [Create resource dependencies](https://developer.hashicorp.com/terraform/tutorials/configuration-language/dependencies)

---

## 4.8 — Riferimenti ai valori con nome

Terraform mette a disposizione diversi tipi di valori con nome (named value). Ognuno di questi nomi è un'espressione che fa riferimento al valore associato. Si possono usare da soli come espressioni, oppure combinarli con altre espressioni per calcolare nuovi valori.

### 4.8.1 — Tipi di valori con nome

I principali tipi di valori con nome disponibili in Terraform sono:

- le risorse;
- le input variable;
- i local value;
- gli output dei moduli figli;
- i data source;
- le informazioni su filesystem e workspace;
- i valori locali di un blocco.

Molti di questi nomi usano percorsi separati da punti, simili alla notazione degli attributi degli oggetti, ma non sono implementati come oggetti veri. Vanno quindi usati esattamente come sono scritti. Non si può usare la notazione con parentesi quadre al posto dei percorsi con i punti. Non si può nemmeno iterare sull'"oggetto padre" di un'entità con nome: ad esempio, non si può usare `aws_instance` in un'espressione `for` per iterare su tutte le risorse di tipo istanza AWS.

**Risorse** _(stepTitle)_

`<RESOURCE TYPE>.<NAME>` rappresenta una managed resource del tipo e con il nome indicati. Il valore del riferimento dipende dall'uso di `count` o `for_each`:

- se la risorsa non usa `count` né `for_each`, il valore è un oggetto. Gli attributi della risorsa sono elementi dell'oggetto, accessibili con la notazione a punti o con le parentesi quadre;
- se la risorsa ha l'argomento `count`, il valore è una lista di oggetti che rappresentano le sue istanze;
- se la risorsa ha l'argomento `for_each`, il valore è una map di oggetti che rappresentano le sue istanze.

Qualsiasi valore con nome che non corrisponde a uno degli altri schemi elencati qui sotto viene interpretato da Terraform come riferimento a una managed resource.

**Input variable** _(stepTitle)_

`var.<NAME>` è il valore della input variable con il nome indicato. Se la dichiarazione della variabile ha un vincolo di tipo (argomento `type`), Terraform converte automaticamente il valore fornito dal chiamante per renderlo conforme al vincolo. Si può quindi contare sul fatto che un riferimento con `var.` produca sempre un valore conforme al vincolo di tipo, anche se il chiamante ha fornito un valore di un altro tipo, poi convertito automaticamente.

Se si definisce una variabile di tipo oggetto con certi attributi, nelle espressioni del modulo saranno disponibili solo quegli attributi. Vale anche se il chiamante ha passato un valore con attributi in più. Nel vincolo di tipo vanno quindi definiti tutti gli attributi che si intende usare nel modulo.

**Local value** _(stepTitle)_

`local.<NAME>` è il valore del local value con il nome indicato. I local value possono fare riferimento ad altri local value, anche nello stesso blocco `locals`, purché non si creino dipendenze circolari.

**Output dei moduli figli** _(stepTitle)_

`module.<MODULE NAME>` è un valore che rappresenta i risultati di un blocco `module`:

- se il blocco `module` non usa né `count` né `for_each`, il valore è un oggetto con un attributo per ogni output value definito nel modulo figlio, e a un output si accede con `module.<MODULE NAME>.<OUTPUT NAME>`;
- se il modulo usa `for_each`, il valore è una map di oggetti, con chiavi uguali a quelle dell'espressione `for_each`. Ogni valore è un oggetto con un attributo per ogni output del modulo figlio, e rappresenta un'istanza del modulo;
- se il modulo usa `count`, il risultato è simile, ma il valore è una lista con il numero di elementi richiesto, ognuno dei quali rappresenta un'istanza del modulo.

**Data source** _(stepTitle)_

`data.<DATA TYPE>.<NAME>` è un oggetto che rappresenta una data resource del tipo di data source e con il nome indicati. Con `count` il valore è una lista di oggetti che rappresentano le sue istanze, con `for_each` una map. Per i data source valgono le stesse regole dei riferimenti agli attributi delle risorse, descritte più avanti, con l'aggiunta del prefisso `data.`.

**Informazioni su filesystem e workspace** _(stepTitle)_

Sono disponibili questi valori:

- `path.module` è il percorso nel filesystem del modulo in cui si trova l'espressione. HashiCorp sconsiglia di usarlo nelle operazioni di scrittura, perché il comportamento può cambiare tra sorgenti di modulo remote e locali. Più chiamate a un modulo locale usano la stessa directory sorgente, quindi ogni chiamata sovrascrive i dati in `path.module`, con possibili race condition e risultati inattesi.
- `path.root` è il percorso nel filesystem del modulo root della configurazione.
- `path.cwd` è il percorso nel filesystem della directory di lavoro originale da cui si è eseguito Terraform, prima di applicare l'eventuale argomento `-chdir`. È un percorso assoluto che contiene dettagli sulla struttura del filesystem, utile in alcuni casi avanzati in cui Terraform viene eseguito da una directory diversa da quella del modulo root. Quando possibile è consigliato usare `path.root` o `path.module` al posto di `path.cwd`.
- `terraform.workspace` è il nome del workspace attualmente selezionato.

Questi valori vanno usati con attenzione. Contengono informazioni sul contesto in cui si applica la configurazione, e possono quindi ridurre senza volerlo la portabilità o la componibilità di un modulo.

Ad esempio, se si usa `path.cwd` per impostare un percorso nell'argomento di una risorsa, applicare la stessa configurazione da un'altra directory, o da un altro computer con un'altra struttura di directory, fa vedere al provider un cambio di percorso da applicare. Succede anche se il percorso indica ancora lo stesso file. Allo stesso modo, se si usa uno di questi valori come namespace in un modulo condiviso, ad esempio `terraform.workspace` come prefisso di nomi di oggetti che devono essere univoci a livello globale, potrebbe diventare impossibile chiamare il modulo più di una volta nella stessa configurazione.

A parte `path.module`, è consigliato usare questi valori solo nel modulo root della configurazione. Se un modulo condiviso ha bisogno di un prefisso per creare nomi univoci, conviene definire una input variable nel modulo e lasciare che sia il modulo chiamante a definire il prefisso. Il modulo chiamante potrà usare `terraform.workspace`, se è opportuno, o un altro valore:

```
module "example" {
  # ...

  name_prefix = "app-${terraform.workspace}"
}
```

**Valori locali di un blocco** _(stepTitle)_

Nei corpi di certi blocchi, o in altri contesti specifici, oltre ai valori globali elencati sopra sono disponibili altri valori con nome. Questi nomi locali sono descritti nella documentazione dei contesti in cui compaiono. Tra i più comuni ci sono:

- `count.index`, nelle risorse che usano il meta-argomento `count`;
- `each.key` e `each.value`, nelle risorse che usano il meta-argomento `for_each`;
- `self`, nei blocchi `provisioner` e `connection`.

> **Nota**: nella loro documentazione i nomi locali sono spesso chiamati variabili o variabili temporanee. Non sono input variable, ma solo nomi arbitrari che rappresentano temporaneamente un valore.
_(infoBox)_

Questi nomi valgono solo per i blocchi di configurazione di primo livello. Se si usano blocchi `dynamic` per generare in modo dinamico i blocchi annidati di una risorsa o di un data source, alla chiave e al valore di ogni elemento si fa riferimento in modo diverso, descritto nella documentazione dei blocchi dynamic.

### 4.8.2 — Valori con nome e dipendenze

Costrutti come le risorse e le chiamate ai moduli usano spesso, nei loro blocchi, riferimenti a valori con nome. Terraform analizza queste espressioni per dedurre automaticamente le dipendenze tra gli oggetti: ad esempio, un'espressione nell'argomento di una risorsa che fa riferimento a un'altra managed resource crea una dipendenza implicita tra le due risorse.

### 4.8.3 — Riferimenti agli attributi delle risorse

Il tipo di riferimento più comune è quello a un attributo di una risorsa dichiarata con un blocco `resource` o `data`. Il contenuto di questi blocchi può essere complesso, e quindi anche le espressioni che vi fanno riferimento. Ecco un blocco resource di esempio:

```
resource "aws_instance" "example" {
  ami           = "ami-abc123"
  instance_type = "t2.micro"

  ebs_block_device {
    device_name = "sda2"
    volume_size = 16
  }
  ebs_block_device {
    device_name = "sda3"
    volume_size = 20
  }
}
```

La documentazione di `aws_instance` elenca tutti gli argomenti e i blocchi annidati supportati da questo tipo di risorsa, e gli attributi che esporta. Tutti questi elementi dello schema si possono usare nei riferimenti:

- l'argomento `ami` impostato nella configurazione si usa altrove con l'espressione `aws_instance.example.ami`;
- l'attributo `id` esportato dal tipo di risorsa si legge con la stessa sintassi: `aws_instance.example.id`;
- agli argomenti dei blocchi annidati `ebs_block_device` si accede con un'espressione splat. Ad esempio, la lista di tutti i valori `device_name` si ottiene con `aws_instance.example.ebs_block_device[*].device_name`;
- in questo tipo di risorsa i blocchi annidati non esportano attributi. Se `ebs_block_device` avesse un attributo `id` documentato, la lista degli ID si otterrebbe allo stesso modo con `aws_instance.example.ebs_block_device[*].id`.

Alcuni blocchi annidati richiedono una chiave logica che identifica ciascun blocco. La chiave serve a uno scopo simile al nome della risorsa, cioè a fare riferimento comodamente a quel singolo blocco nelle espressioni. Se `aws_instance` avesse un ipotetico tipo di blocco annidato `device` con una chiave, nella configurazione comparirebbe così:

```
device "foo" {
  size = 2
}
device "bar" {
  size = 4
}
```

Agli argomenti dei blocchi con chiave si accede con la sintassi degli indici, come `aws_instance.example.device["foo"].size`. Per ottenere una map dei valori di un certo argomento di questi blocchi si usa un'espressione `for`: `{for k, device in aws_instance.example.device : k => device.size}`.

Quando una risorsa ha l'argomento `count`, la risorsa stessa diventa una lista di oggetti istanza invece di un singolo oggetto. Agli attributi delle istanze si accede quindi con espressioni splat o con la sintassi degli indici:

- `aws_instance.example[*].id` restituisce la lista degli ID di tutte le istanze;
- `aws_instance.example[0].id` restituisce solo l'ID della prima istanza.

Quando una risorsa ha l'argomento `for_each`, la risorsa diventa una map di oggetti istanza. Agli attributi delle istanze si accede per chiave, oppure con un'espressione `for`:

- `aws_instance.example["a"].id` restituisce l'ID della risorsa con chiave `"a"`;
- `[for value in aws_instance.example: value.id]` restituisce la lista degli ID di tutte le istanze.

A differenza di `count`, le espressioni splat non si applicano direttamente alle risorse gestite con `for_each`, perché lo splat deve agire su una lista. Si può però usare la funzione `values()` per estrarre le istanze come lista e applicare lo splat a quella lista: `values(aws_instance.example)[*].id`.

**Attributi sensibili delle risorse** _(stepTitle)_

Quando definisce lo schema di un tipo di risorsa, lo sviluppatore del provider può marcare alcuni attributi come sensitive. In quel caso, quando mostra un piano che coinvolge quell'attributo, Terraform mostra un segnaposto (*sensitive value*) al posto del valore reale.

Un attributo del provider marcato come sensitive si comporta come una input variable dichiarata sensitive. Terraform ne nasconde il valore nei messaggi di plan e apply, e considera sensitive anche tutti gli altri valori derivati da esso. Questo comportamento però ha alcuni limiti, descritti nella pagina *Cases where Terraform may disclose a sensitive variable*.

Se si usa il valore sensitive di un attributo in un output value, Terraform richiede di marcare come sensitive anche l'output, per confermare che lo si vuole davvero esportare. Terraform registra comunque i valori sensitive nello state, quindi chi può accedere ai dati di state può leggerli in chiaro (sezione 4.28).

> **Nota**: il trattamento come sensitive dei valori derivati da un attributo sensitive è stato introdotto in Terraform v0.15. Le versioni precedenti nascondono il valore diretto di un attributo sensitive, ma non i valori derivati da esso.
_(infoBox)_

**Valori non ancora noti** _(stepTitle)_

Quando Terraform pianifica le modifiche per applicare la configurazione, alcuni attributi delle risorse non si possono valorizzare subito, perché è il sistema remoto a deciderne il valore dinamicamente. Ad esempio, se un tipo di oggetto remoto riceve un ID univoco generato alla creazione, Terraform non può conoscere quell'ID finché l'oggetto non è stato creato.

Per le informazioni che non può prevedere in fase di plan, Terraform usa speciali segnaposto di valore sconosciuto (unknown). Il linguaggio Terraform gestisce automaticamente i valori sconosciuti nelle espressioni: ad esempio, sommando un valore noto a un valore sconosciuto si ottiene automaticamente un valore sconosciuto.

In alcune situazioni però i valori sconosciuti hanno un effetto importante:

- il meta-argomento `count` delle risorse non può essere sconosciuto, perché va valutato in fase di plan per sapere quante istanze creare;
- se nella configurazione di una data resource si usano valori sconosciuti, la data resource non si può leggere in fase di plan, e la lettura viene rimandata all'apply. In questo caso anche i risultati della data resource sono valori sconosciuti;
- se si assegna un valore sconosciuto a un argomento di un blocco `module`, tutti i riferimenti alla input variable corrispondente nel modulo figlio usano quel valore sconosciuto;
- se si usa un valore sconosciuto nell'argomento `value` di un output, tutti i riferimenti a quell'output nel modulo padre usano quel valore sconosciuto;
- Terraform cerca di verificare, quando possibile, che i valori sconosciuti abbiano tipi adatti. Un uso scorretto di questi valori però potrebbe emergere solo in fase di apply, facendo fallire l'apply.

Nell'output di `terraform plan` i valori sconosciuti compaiono come *(known after apply)*.

- Fonte: [References to named values](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions/references)

---

## 4.9 — Indirizzi delle risorse

Questa pagina contiene le informazioni di riferimento sugli indirizzi delle risorse (resource address) in Terraform.

### 4.9.1 — Sintassi

Un indirizzo di risorsa è una stringa che identifica zero o più istanze di risorsa nell'intera configurazione. È composto da due parti:

```
[module path][resource spec]
```

In alcuni contesti Terraform accetta un indirizzo incompleto. Può indicare solo un modulo nel suo complesso, oppure omettere l'indice di una risorsa con più istanze. In quei casi il significato dipende dal contesto, ed è descritto nella documentazione della funzionalità che legge l'indirizzo.

### 4.9.2 — Il percorso del modulo

Il percorso del modulo (module path) indica un modulo all'interno dell'albero dei moduli, nella forma:

```
module.module_name[module index]
```

Le parti del percorso sono:

- `module`: la parola chiave che indica un modulo figlio, cioè non root. Più parole chiave `module` in un percorso indicano un annidamento;
- `module_name`: il nome del modulo, definito dall'utente;
- `[module index]`: facoltativo, l'indice tra parentesi quadre (`[` e `]`) che seleziona un'istanza di una chiamata a modulo con più istanze.

Un indirizzo senza resource spec, come `module.foo`, vale per tutte le risorse del modulo se il modulo ha una sola istanza, oppure per tutte le istanze del modulo se ne ha più di una. Per indicare tutte le risorse di una particolare istanza di modulo si include l'indice nell'indirizzo, ad esempio `module.foo[0]`. Se il percorso del modulo è omesso, l'indirizzo vale per il modulo root.

Ecco un esempio della parola chiave `module` che separa due moduli con più istanze:

```
module.foo[0].module.bar["a"]
```

L'indice dei moduli vale solo da Terraform v0.13. Nelle versioni precedenti un modulo non poteva avere più istanze.

### 4.9.3 — La resource spec

La resource spec indica una specifica istanza di risorsa nel modulo selezionato, con questa sintassi:

```
resource_type.resource_name[instance index]
```

Le parti della resource spec sono:

- `resource_type`: il tipo della risorsa indicata;
- `resource_name`: il nome della risorsa, definito dall'utente;
- `[instance index]`: facoltativo, l'indice tra parentesi quadre che seleziona un'istanza di una risorsa con più istanze.

Da Terraform v0.12, una resource spec senza prefisso di modulo corrisponde solo alle risorse del modulo root. Nelle versioni precedenti, una resource spec senza prefisso di modulo corrispondeva alle risorse con lo stesso tipo e nome in qualsiasi modulo discendente.

### 4.9.4 — Indici di moduli e risorse

Per gli indici dei moduli e delle risorse con più istanze valgono queste regole:

- `[N]`, dove `N` è un indice numerico a partire da 0, in una risorsa con più istanze definite dal meta-argomento `count`. Se si omette l'indice in una risorsa con `count` maggiore di 1, l'indirizzo indica tutte le istanze;
- `["INDEX"]`, dove `INDEX` è una chiave alfanumerica, in una risorsa con più istanze definite dal meta-argomento `for_each`.

### 4.9.5 — Esempi

**Esempio con count** _(stepTitle)_

Data una configurazione che contiene:

```
resource "aws_instance" "web" {
  # ...
  count = 4
}
```

l'indirizzo `aws_instance.web[3]` indica solo l'ultima istanza, mentre `aws_instance.web` indica tutte e quattro le istanze `web`.

**Esempio con for_each** _(stepTitle)_

Data una configurazione che contiene:

```
resource "aws_instance" "web" {
  # ...
  for_each = tomap({
    "terraform": "value1",
    "resource":  "value2",
    "indexing":  "value3",
    "example":   "value4",
  })
}
```

l'indirizzo `aws_instance.web["example"]` indica solo l'istanza `"example"` della configurazione, che corrisponde a `"value4"`.

- Fonte: [Resource address reference](https://developer.hashicorp.com/terraform/cli/v1.12.x/state/resource-addressing)

---

## 4.10 — I meta-argomenti e depends_on

I meta-argomenti sono una classe di argomenti integrati nel linguaggio di configurazione di Terraform, che controllano come Terraform crea e gestisce l'infrastruttura. Si possono usare in qualsiasi tipo di risorsa, e la maggior parte anche nei blocchi `module`.

Gli argomenti specifici di ogni risorsa li stabilisce lo sviluppatore del provider. Tutte le risorse però supportano i meta-argomenti, che gestiscono il ciclo di vita dell'infrastruttura: il comportamento in distruzione, la protezione dalla distruzione e le dipendenze tra risorse.

### 4.10.1 — I meta-argomenti di Terraform

Terraform offre questi meta-argomenti:

- `depends_on`: fa completare a Terraform tutte le azioni sull'oggetto da cui si dipende, comprese le letture, prima di agire sull'oggetto che dichiara la dipendenza. Serve a stabilire esplicitamente l'ordine in cui Terraform crea le risorse (tutorial *Create resource dependencies*, sezione 4.7).
- `count`: per default Terraform configura un oggetto dell'infrastruttura per ogni blocco `resource`, `module` ed `ephemeral`, e crea una sola istanza di un modulo per ogni blocco `module`. Con l'argomento `count` nei blocchi `resource`, `module` ed `ephemeral` si creano e gestiscono più istanze senza scrivere un blocco separato per ognuna.
- `for_each`: con `for_each` nei blocchi `resource`, `data`, `module` ed `ephemeral` si creano e gestiscono diversi oggetti simili, ad esempio un pool fisso di istanze di calcolo, senza scrivere un blocco separato per ognuno.
- `lifecycle`: il blocco `lifecycle` accetta regole che personalizzano il modo in cui Terraform esegue le fasi del ciclo di vita di ogni risorsa. Il supporto delle singole regole varia tra i blocchi di configurazione (sezioni 4.22 e 4.23).
- `provider`: per default Terraform ricava il nome locale del provider dalla prima parola del tipo di risorsa, e usa la configurazione predefinita di quel provider per creare la risorsa. Si possono aggiungere più blocchi `provider` alla configurazione, e indicare con l'argomento `provider` nella definizione della risorsa quale provider usare.
- `providers`: per default i moduli figli ereditano le configurazioni predefinite dei provider del modulo padre. Con l'argomento `providers` nel blocco `module` si specifica una configurazione del provider alternativa, che Terraform usa per creare le risorse del modulo.

### 4.10.2 — Il riferimento di depends_on

Il meta-argomento `depends_on` serve a gestire le dipendenze nascoste tra risorse o moduli, che Terraform non riesce a dedurre da solo. Serve indicare esplicitamente una dipendenza solo quando una risorsa o un modulo si basa sul comportamento di un'altra risorsa, ma nei propri argomenti non usa nessun dato di quella risorsa.

**Uso** _(stepTitle)_

`depends_on` si può usare nei blocchi `module` e in tutti i blocchi `resource`, di qualsiasi tipo. Richiede una lista di riferimenti ad altre risorse o moduli figli dello stesso modulo chiamante. La lista non può contenere espressioni arbitrarie. Il valore di `depends_on` deve infatti essere noto prima che Terraform conosca le relazioni tra le risorse, e quindi prima che possa valutare le espressioni in modo sicuro.

Nell'esempio seguente `depends_on` dice a Terraform di gestire una dipendenza nascosta dalla policy IAM:

```
resource "aws_iam_role" "example" {
  name = "example"

  # assume_role_policy is omitted for brevity in this example. Refer to the
  # documentation for aws_iam_role for a complete example.
  assume_role_policy = "..."
}

resource "aws_iam_instance_profile" "example" {
  # Because this expression refers to the role, Terraform automatically
  # infers that the role must be created first.
  role = aws_iam_role.example.name
}

resource "aws_iam_role_policy" "example" {
  name   = "example"
  role   = aws_iam_role.example.name
  policy = jsonencode({
    "Statement" = [{
      # This policy allows software running on the EC2 instance to
      # access the S3 API.
      "Action" = "s3:*",
      "Effect" = "Allow",
    }],
  })
}

resource "aws_instance" "example" {
  ami           = "ami-a1b2c3d4"
  instance_type = "t2.micro"

  # Terraform can infer from this that the instance profile must
  # be created before the EC2 instance.
  iam_instance_profile = aws_iam_instance_profile.example

  # However, if software running in this EC2 instance needs access
  # to the S3 API in order to boot properly, there is also a
  # dependency on the aws_iam_role_policy that Terraform cannot
  # automatically infer, so you must declare it explicitly:
  depends_on = [
    aws_iam_role_policy.example
  ]
}
```

**Conseguenze sull'elaborazione e sulla pianificazione** _(stepTitle)_

`depends_on` fa completare a Terraform tutte le azioni sull'oggetto da cui si dipende, comprese le letture, prima di operare sull'oggetto che dichiara la dipendenza. Quando la dipendenza è un intero modulo, `depends_on` influisce sull'ordine in cui Terraform elabora tutte le risorse e i data source di quel modulo.

`depends_on` va usato solo come ultima risorsa. Può infatti portare Terraform a creare piani più prudenti, che sostituiscono più risorse del necessario. Ad esempio, Terraform può trattare più valori come sconosciuti (*known after apply*), perché non sa quali modifiche avverranno sull'oggetto a monte. Succede soprattutto quando si usa `depends_on` sui moduli.

Al posto di `depends_on`, quando possibile, è consigliato esprimere le dipendenze con riferimenti nelle espressioni. Con un riferimento Terraform sa da quale valore deriva, e non pianifica modifiche se quel valore non è cambiato, anche se altre parti dell'oggetto a monte hanno modifiche pianificate.

**Costrutti supportati** _(stepTitle)_

`depends_on` si può usare nei blocchi `check`, `data`, `ephemeral`, `module`, `output` e `resource`.

### 4.10.3 — Casi d'uso di depends_on

**Dipendenza durante la validazione** _(stepTitle)_

Si aggiunge `depends_on` a un blocco `data` annidato nella validazione di un blocco `check` quando il data source dipende da un'altra risorsa senza farvi riferimento diretto.

I blocchi `check` validano l'infrastruttura al di fuori del normale ciclo di vita delle risorse (sezione 4.26). In un blocco `check` si può annidare un blocco `data` per recuperare informazioni da usare in un blocco `assert`. Con un `depends_on` nel blocco `data` annidato, Terraform recupera i dati necessari prima di eseguire la validazione.

Ad esempio, un check che verifica che l'API di un sito web risponda 200 fallisce alla prima esecuzione della configurazione, perché l'infrastruttura del sito non esiste ancora. Impostando `depends_on` su una risorsa come il load balancer, Terraform esegue il check solo quando il sito è attivo. Durante l'operazione, Terraform valuta il check e segnala *known after apply* finché quella parte fondamentale del sito non è pronta, poi prosegue con l'operazione.

Questa strategia funziona solo se il blocco `data` non fa riferimento diretto alla risorsa indicata in `depends_on`. Altrimenti, ogni volta che quella risorsa cambia, il check segnala *known after apply* finché Terraform non la aggiorna, e il check diventa rumoroso e poco efficace. Nell'esempio, Terraform aspetta a eseguire il check finché non crea il database `aws_db_instance.main`. Fino ad allora stampa *known after apply* invece di falsi avvisi:

```
check "database_connection" {
 data "postgresql_database" "app_db" {
   name       = "application"
   depends_on = [aws_db_instance.main]
 }

 assert {
   condition     = data.postgresql_database.app_db.allow_connections
   error_message = "Database is not accepting connections"
 }
}
```

**Un database da cui dipendono altri servizi** _(stepTitle)_

Nell'esempio seguente Terraform deve avviare per primo il servizio `aws_db_instance`, perché `aws_instance` possa collegarsi a esso:

```
provider "aws" {
  region = "us-east-2"
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

resource "aws_db_instance" "api" {
  allocated_storage   = 10
  db_name             = "api_db"
  engine              = "postgres"
  engine_version      = "17.4"
  instance_class      = "db.t3.micro"
  username            = "foo"
  password            = "foobarbaz"
  skip_final_snapshot = true
}

resource "aws_instance" "api" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  depends_on = [aws_db_instance.api]
}
```

**Dipendenza di un modulo da una risorsa** _(stepTitle)_

Nell'esempio seguente Terraform crea il modulo dell'istanza EC2 solo dopo aver creato la risorsa del bucket S3:

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

**Dipendenza in un output** _(stepTitle)_

Nell'esempio seguente l'output `instance_ip_addr` aggiunge una dipendenza esplicita dalla regola del security group. Così Terraform crea il security group prima di esporre l'indirizzo IP:

```
output "instance_ip_addr" {
  value       = aws_instance.server.private_ip
  description = "The private IP address of the main server instance."

  depends_on = [
    # Services are unreachable unless the security group rule is created
    # before exposing this IP address.
    aws_security_group_rule.local_access,
  ]
}
```

Di solito il blocco `output` non richiede dipendenze esplicite. Se se ne aggiunge una, è consigliato scrivere un commento che spieghi perché è necessaria.

- Fonte: [Meta-arguments](https://developer.hashicorp.com/terraform/language/v1.12.x/meta-arguments)
- Fonte: [depends_on reference](https://developer.hashicorp.com/terraform/language/v1.12.x/meta-arguments/depends_on)

---

## 4.11 — Indirizzare risorse specifiche

Quando si applicano modifiche a un progetto Terraform, Terraform genera un piano con tutte le differenze tra la configurazione e le risorse gestite in quel momento dal progetto. Applicando il piano, Terraform aggiunge, rimuove e modifica le risorse come proposto dal piano.

Nel workflow tipico di Terraform si applica l'intero piano in una volta. A volte però si può voler applicare solo una parte del piano. Succede ad esempio quando lo state di Terraform non è più allineato alle risorse, per un guasto di rete, per un problema della piattaforma cloud a monte o per un bug di Terraform o dei suoi provider. Per questi casi Terraform permette di indirizzare (target) risorse specifiche quando si pianifica, si applica o si distrugge l'infrastruttura. Indirizzare singole risorse può servire a risolvere errori, ma non dovrebbe far parte del workflow normale.

L'opzione `-target` indirizza risorse specifiche, moduli o insiemi di risorse. Nel tutorial si crea un bucket S3 con alcuni oggetti, e poi si applicano le modifiche un po' alla volta con `-target`. La configurazione di esempio definisce un bucket S3 con un nome casuale e quattro oggetti nel bucket.

### 4.11.1 — Indirizzare il nome del bucket

In `main.tf` la risorsa `random_pet.bucket_name` assegna un nome casuale al bucket S3 del modulo `bucket`. Si porta il valore di `length` a 5:

```
resource "random_pet" "bucket_name" {
  length    = 5
  separator = "-"
  prefix    = "learning"
}
```

Pianificando la modifica, Terraform propone di modificare la risorsa `random_pet` insieme a tutte le risorse che dipendono da essa.

> **Suggerimento**: per cambiare il nome del bucket Terraform deve sostituirlo, perché AWS non permette di rinominare un bucket sul posto. Il provider AWS lo sa, e Terraform crea un piano che sostituisce o aggiorna le risorse secondo necessità.
_(infoBox)_

Pianificando di nuovo con `terraform plan -target="random_pet.bucket_name"`, Terraform propone di sostituire solo la risorsa indicata.

Con `terraform plan -target="module.s3_bucket"` si crea invece un piano che indirizza il modulo, e quindi tutte le sue risorse. Terraform determina che `module.s3_bucket` dipende da `random_pet.bucket_name`, e che la configurazione del nome del bucket è cambiata. Per questa dipendenza aggiorna sia il nome del bucket a monte sia il modulo indirizzato. Il resource targeting aggiorna le risorse da cui dipende il target, ma non quelle che dipendono dal target.

> **Nota**: Terraform costruisce un grafo delle dipendenze per stabilire l'ordine corretto in cui applicare le modifiche (sezione 3.13).
_(infoBox)_

Il tutorial applica poi la modifica solo al nome del bucket, con `terraform apply -target="random_pet.bucket_name"`. L'output `bucket_name` cambia e non corrisponde più all'ARN del bucket. In `outputs.tf`, infatti, l'output del nome del bucket fa riferimento alla risorsa random pet e non al bucket:

```
output "bucket_name" {
  description = "Randomly generated bucket name."
  value       = random_pet.bucket_name.id
}
```

Con il workflow normale, applicando le modifiche all'intera directory di lavoro, la modifica del nome del bucket si propagherebbe anche a tutte le dipendenze a valle. Con il target sulla risorsa random pet, invece, Terraform ha aggiornato l'output del nome del bucket ma non il bucket. Il targeting può introdurre incoerenze come questa, e va usato solo per risolvere problemi.

Si aggiorna quindi l'output `bucket_name` perché faccia riferimento al nome reale del bucket:

```
output "bucket_name" {
  description = "Randomly generated bucket name."
  value       = module.s3_bucket.s3_bucket_id
}
```

L'ultima operazione ha indirizzato solo una parte della configurazione, quindi le risorse esistenti non corrispondono né alla configurazione originale né a quella nuova. Si applicano allora le modifiche all'intera directory di lavoro con `terraform apply`. Così Terraform allinea l'infrastruttura alla configurazione corrente, compresa la modifica all'output `bucket_name`.

Dopo aver usato il resource targeting per risolvere problemi in un progetto Terraform, bisogna sempre applicare le modifiche all'intera configurazione, per garantire la coerenza di tutte le risorse. Con `terraform plan` si vedono le eventuali modifiche ancora proposte.

### 4.11.2 — Indirizzare oggetti specifici del bucket

Nel tutorial si modifica il contenuto degli oggetti del bucket in `main.tf`:

```
resource "aws_s3_object" "objects" {
  count = 4

  acl          = "public-read"
  key          = "${random_pet.object_names[count.index].id}.txt"
  bucket       = module.s3_bucket.s3_bucket_id
  content      = "Bucket object #${count.index}"
  content_type = "text/plain"
}
```

Si possono passare più opzioni `-target` per indirizzare diverse risorse in una volta. Il tutorial applica la modifica a due degli oggetti:

```
$ terraform apply -target="aws_s3_object.objects[2]" -target="aws_s3_object.objects[3]"
```

Terraform aggiorna gli oggetti selezionati e avvisa che le modifiche all'infrastruttura potrebbero essere incomplete.

### 4.11.3 — Indirizzare i nomi degli oggetti

Come si è visto, si possono indirizzare singole istanze di una collezione creata con i meta-argomenti `count` o `for_each`. Terraform però calcola le dipendenze per l'intera risorsa, e in alcuni casi questo porta a risultati sorprendenti.

Nel tutorial si rimuove l'argomento `prefix` dalla risorsa `random_pet.object_names` in `main.tf`, e si applica la modifica a un solo oggetto del bucket:

```
$ terraform apply -target="aws_s3_object.objects[2]"
```

Terraform aggiorna tutte le risorse `random_pet.object_names`, non solo il nome dell'oggetto indirizzato. Sia `random_pet.object_names` sia `aws_s3_object.objects` usano `count`, e ogni oggetto del bucket fa riferimento al nome con lo stesso indice. Però l'intera risorsa `aws_s3_object.objects` dipende dall'intera risorsa `random_pet.object_names`, quindi Terraform aggiorna tutti i nomi.

- Fonte: [Target resources](https://developer.hashicorp.com/terraform/tutorials/state/resource-targeting)

---

## 4.12 — Personalizzare la configurazione con le variabili

Le input variable rendono più flessibile la configurazione Terraform. Definiscono valori che gli utenti finali possono assegnare per personalizzare la configurazione, e offrono un'interfaccia coerente per cambiare il comportamento di una configurazione.

A differenza delle variabili dei linguaggi di programmazione, le input variable di Terraform non cambiano valore durante un'esecuzione di Terraform come plan, apply o destroy. Permettono invece di personalizzare l'infrastruttura in modo più sicuro: si assegnano valori diversi alle variabili prima dell'esecuzione, invece di modificare a mano i file di configurazione.

Nel tutorial si usa Terraform per distribuire un'applicazione web su AWS. L'infrastruttura di supporto comprende una VPC, un load balancer e delle istanze EC2. Si parametrizza la configurazione con le input variable, poi si interpolano le variabili nelle stringhe, si usano le variabili con le funzioni e si usa la validazione delle variabili.

![Figura 11](img/terraform-variables-architecture-diagram.png) _(dimensioni: 663×320 px)_

*Figura 11 — L'architettura del tutorial: una VPC con subnet, un load balancer e istanze EC2 su AWS. Fonte: HashiCorp Developer.* _(caption)_

### 4.12.1 — Parametrizzare la configurazione

La configurazione in `main.tf` definisce l'applicazione web, con VPC, load balancer e istanze EC2. Il tutorial la inizializza e la applica per creare l'infrastruttura di esempio.

Le dichiarazioni di variabile possono stare in qualsiasi punto dei file di configurazione. È consigliato però metterle in un file separato chiamato `variables.tf`, perché gli utenti capiscano più facilmente come personalizzare la configurazione. Per parametrizzare un argomento con una input variable bisogna prima definire la variabile, poi sostituire il valore scritto a mano con un riferimento alla variabile. Si aggiunge quindi a `variables.tf` un blocco che dichiara la variabile `aws_region`:

```
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}
```

I blocchi variable hanno tre argomenti facoltativi:

- `description`: una breve descrizione che documenta lo scopo della variabile;
- `type`: il tipo di dato contenuto nella variabile;
- `default`: il valore predefinito.

È consigliato impostare una descrizione e un tipo per tutte le variabili, e un valore di default quando è possibile. Se una variabile non ha un default, bisogna assegnarle un valore prima che Terraform possa applicare la configurazione: Terraform non supporta variabili senza valore. I modi per assegnare i valori sono descritti più avanti.

I valori delle variabili devono essere valori letterali. Non possono usare valori calcolati, come attributi di risorse, espressioni o altre variabili. Nella configurazione si fa riferimento alle variabili con `var.<variable_name>`. Si modifica quindi il blocco provider in `main.tf` perché usi la nuova variabile:

```
provider "aws" {
  region  = var.aws_region
}
```

Allo stesso modo si dichiara in `variables.tf` la variabile `vpc_cidr_block`:

```
variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}
```

Poi in `main.tf` si sostituisce con `cidr = var.vpc_cidr_block` il valore scritto a mano del blocco CIDR della VPC. Applicando la configurazione non ci sono modifiche, perché i default delle variabili coincidono con i valori scritti a mano che hanno sostituito.

### 4.12.2 — Impostare il numero di istanze

Oltre a `string`, Terraform supporta diversi altri tipi di variabile. Con il tipo `number` si definisce il numero di istanze supportate dalla configurazione:

```
variable "instance_count" {
  description = "Number of instances to provision."
  type        = number
  default     = 2
}
```

Poi si aggiornano le istanze EC2 in `main.tf` perché usino la variabile (`instance_count = var.instance_count` nel modulo `ec2_instances`).

Quando interpreta i valori, scritti a mano o provenienti da variabili, Terraform li converte nel tipo corretto se possibile. La variabile `instance_count` funzionerebbe quindi anche con una stringa (`"2"`) al posto di un numero (`2`). È consigliato però usare il tipo più adatto nelle definizioni delle variabili. Così gli utenti della configurazione sanno quale tipo di dato usare, e gli errori di configurazione emergono prima.

### 4.12.3 — Attivare il supporto del VPN gateway

Una variabile di tipo `bool` rappresenta valori vero/falso. La si usa per decidere se configurare un VPN gateway per la VPC:

```
variable "enable_vpn_gateway" {
  description = "Enable a VPN gateway in your VPC."
  type        = bool
  default     = false
}
```

Nel modulo `vpc` di `main.tf` si imposta `enable_vpn_gateway = var.enable_vpn_gateway`, mentre `enable_nat_gateway = true` resta scritto a mano. In qualsiasi configurazione ci sono valori che si vuole far configurare agli utenti con le variabili, e altri che si preferisce scrivere a mano. Quando si sviluppano moduli Terraform si usano spesso le variabili per rendere configurabili gli attributi del modulo, e quindi il modulo più flessibile. Quando si scrive la configurazione di un progetto specifico, invece, si può scegliere di scrivere a mano gli attributi che non si vuole far configurare agli utenti.

### 4.12.4 — Liste di subnet pubbliche e private

Le variabili usate finora contengono tutte un singolo valore, e Terraform le chiama variabili semplici. Terraform supporta anche tipi di variabile collezione, che contengono più valori:

- **List**: una sequenza di valori dello stesso tipo.
- **Map**: una tabella di lookup che associa chiavi a valori, tutti dello stesso tipo.
- **Set**: una collezione non ordinata di valori univoci, tutti dello stesso tipo.

Il tutorial usa liste e una map, i tipi più usati. I set servono quando occorre una collezione di valori univoci e l'ordine degli elementi non conta.

Le liste sono adatte agli argomenti `private_subnets` e `public_subnets` della VPC. Con le liste e la funzione `slice()` la configurazione diventa più facile da usare e da personalizzare. Si aggiungono quindi a `variables.tf` le variabili `public_subnet_count` e `private_subnet_count`, e due liste di blocchi CIDR:

```
variable "public_subnet_count" {
  description = "Number of public subnets."
  type        = number
  default     = 2
}

variable "private_subnet_count" {
  description = "Number of private subnets."
  type        = number
  default     = 2
}

variable "public_subnet_cidr_blocks" {
  description = "Available cidr blocks for public subnets."
  type        = list(string)
  default     = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24",
    "10.0.4.0/24",
    "10.0.5.0/24",
    "10.0.6.0/24",
    "10.0.7.0/24",
    "10.0.8.0/24",
  ]
}

variable "private_subnet_cidr_blocks" {
  description = "Available cidr blocks for private subnets."
  type        = list(string)
  default     = [
    "10.0.101.0/24",
    "10.0.102.0/24",
    "10.0.103.0/24",
    "10.0.104.0/24",
    "10.0.105.0/24",
    "10.0.106.0/24",
    "10.0.107.0/24",
    "10.0.108.0/24",
  ]
}
```

Il tipo delle variabili lista è `list(string)`, quindi ogni elemento deve essere una stringa. Gli elementi di una lista devono essere tutti dello stesso tipo, ma il tipo può essere qualsiasi, anche complesso, come `list(list)` e `list(map)`. Come per le liste e gli array della maggior parte dei linguaggi di programmazione, ai singoli elementi si accede per indice, a partire da 0. Terraform include anche diverse funzioni per manipolare liste e altri tipi di variabile.

Il comando `terraform console` apre una console interattiva in cui valutare espressioni nel contesto della configurazione. È molto utile quando si lavora con le definizioni delle variabili o si cercano errori. Nella console:

- `var.private_subnet_cidr_blocks` restituisce l'intera lista;
- `var.private_subnet_cidr_blocks[1]` restituisce il secondo elemento, `"10.0.102.0/24"`;
- `slice(var.private_subnet_cidr_blocks, 0, 3)` restituisce i primi tre elementi.

Dalla console si esce con `exit` o con Control-D.

La funzione `slice()` prende tre argomenti: la lista da tagliare, l'indice iniziale e l'indice finale (escluso). Restituisce una nuova lista con gli elementi indicati, copiati dalla lista originale. Si aggiorna quindi il modulo VPC in `main.tf` perché usi `slice` per estrarre una parte delle liste di blocchi CIDR:

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.7.0"

  cidr = var.vpc_cidr_block

  azs             = data.aws_availability_zones.available.names
  private_subnets = slice(var.private_subnet_cidr_blocks, 0, var.private_subnet_count)
  public_subnets  = slice(var.public_subnet_cidr_blocks, 0, var.public_subnet_count)
  ## ...
}
```

Così gli utenti della configurazione possono indicare quante subnet pubbliche e private vogliono, senza preoccuparsi di definire i blocchi CIDR.

### 4.12.5 — Una map per i tag delle risorse

Ognuna delle risorse e dei moduli dichiarati in `main.tf` ha due tag, `project_name` ed `environment`. Li si assegna con una variabile di tipo map:

```
variable "resource_tags" {
  description = "Tags to set for all resources"
  type        = map(string)
  default     = {
    project     = "project-alpha",
    environment = "dev"
  }
}
```

Il tipo `map(string)` dice a Terraform che i valori della map sono stringhe. Le chiavi di una map sono sempre stringhe. Come con i dizionari o le map dei linguaggi di programmazione, un valore si recupera con la chiave corrispondente: nella console, `var.resource_tags["environment"]` restituisce `"dev"`.

> **Nota**: il comando `terraform console` carica la configurazione Terraform solo all'avvio. Per vedere le modifiche più recenti bisogna uscire e riavviare la console.
_(infoBox)_

Poi in `main.tf` si sostituiscono tutti e cinque i tag scritti a mano con `tags = var.resource_tags`. Applicando la configurazione, ancora una volta Terraform non propone modifiche.

Le liste e le map sono tipi collezione. Terraform supporta anche due tipi strutturali, che hanno un numero fisso di valori, anche di tipi diversi:

- **Tuple**: una sequenza di lunghezza fissa di valori di tipi specificati.
- **Object**: una tabella di lookup che associa un insieme fisso di chiavi a valori di tipi specificati.

### 4.12.6 — Assegnare i valori alle variabili

Terraform richiede un valore per ogni variabile, e ci sono diversi modi per assegnarlo.

**Opzione da riga di comando** _(stepTitle)_

Negli esempi finora tutte le variabili avevano un valore di default. Il tutorial aggiunge a `variables.tf` una variabile senza default:

```
variable "ec2_instance_type" {
  description = "AWS EC2 instance type."
  type        = string
}
```

In `main.tf` si sostituisce il tipo di istanza scritto a mano con `instance_type = var.ec2_instance_type`. Poi si applica la configurazione impostando il valore con l'opzione da riga di comando `-var`:

```
$ terraform apply -var ec2_instance_type=t2.micro
```

Con Terraform Community Edition, se un valore non è impostato nella configurazione né passato al comando, Terraform lo chiede in modo interattivo.

**Valori in un file** _(stepTitle)_

Inserire a mano i valori delle variabili richiede tempo ed è soggetto a errori. Si possono invece scrivere i valori in un file. Il tutorial crea un file `terraform.tfvars` con questo contenuto, e un file `terraform.auto.tfvars` con lo stesso contenuto:

```
resource_tags = {
  project     = "project-alpha",
  environment = "dev",
  owner       = "me@example.com"
}

ec2_instance_type = "t3.micro"

instance_count = 3
```

Terraform carica automaticamente tutti i file della directory corrente che si chiamano esattamente `terraform.tfvars` o che corrispondono a `*.auto.tfvars`. Con l'opzione `-var-file` si possono indicare per nome altri file. Questi file usano una sintassi simile a quella dei file di configurazione (HCL), ma non possono contenere configurazione come le definizioni di risorse. Come i file di configurazione, possono contenere anche JSON.

Oltre alle opzioni da riga di comando e ai file di variabili, le input variable si possono impostare con le variabili d'ambiente. Se una variabile riceve valori diversi da questi metodi, Terraform usa l'ultimo valore che trova, in base all'ordine di precedenza (sezione 4.13).

### 4.12.7 — Interpolare le variabili nelle stringhe

La configurazione Terraform supporta l'interpolazione di stringhe, cioè l'inserimento del risultato di un'espressione in una stringa. Così si possono costruire stringhe con variabili, local value e risultati di funzioni. Il tutorial aggiorna i nomi dei security group e del load balancer perché usino i valori `project` ed `environment` della map `resource_tags`:

```
module "app_security_group" {
  source  = "terraform-aws-modules/security-group/aws//modules/web"
  version = "4.17.0"

  name        = "web-sg-${var.resource_tags["project"]}-${var.resource_tags["environment"]}"

  ## ...
}

module "lb_security_group" {
  source  = "terraform-aws-modules/security-group/aws//modules/web"
  version = "4.17.0"

  name        = "lb-sg-${var.resource_tags["project"]}-${var.resource_tags["environment"]}"

  ## ...
}

module "elb_http" {
  source  = "terraform-aws-modules/elb/aws"
  version = "4.0.1"

  # Ensure load balancer name is unique
  name = "lb-${random_string.lb_id.result}-${var.resource_tags["project"]}-${var.resource_tags["environment"]}"
  ## ...
}
```

### 4.12.8 — Validare le variabili

La configurazione ha un potenziale problema. I load balancer AWS hanno restrizioni sui nomi: al massimo 32 caratteri, e solo un insieme limitato di caratteri. Con la validazione delle variabili si limitano quindi i valori possibili dei tag `project` ed `environment`. Si sostituisce la variabile `resource_tags` in `variables.tf` con questa versione, che contiene blocchi `validation` sui limiti di lunghezza e sui caratteri ammessi:

```
variable "resource_tags" {
  description = "Tags to set for all resources"
  type        = map(string)
  default     = {
    project     = "my-project",
    environment = "dev"
  }

  validation {
    condition     = length(var.resource_tags["project"]) <= 16 && length(regexall("[^a-zA-Z0-9-]", var.resource_tags["project"])) == 0
    error_message = "The project tag must be no more than 16 characters, and only contain letters, numbers, and hyphens."
  }

  validation {
    condition     = length(var.resource_tags["environment"]) <= 8 && length(regexall("[^a-zA-Z0-9-]", var.resource_tags["environment"])) == 0
    error_message = "The environment tag must be no more than 8 characters, and only contain letters, numbers, and hyphens."
  }
}
```

La funzione `regexall()` prende un'espressione regolare e una stringa da verificare, e restituisce la lista delle corrispondenze trovate nella stringa. Qui l'espressione regolare trova qualsiasi carattere che non sia una lettera, un numero o un trattino. Così il nome del load balancer non supera i 32 caratteri e non contiene caratteri non validi. La validazione delle variabili è un buon modo per intercettare presto gli errori di configurazione.

Per provare le regole di validazione si indica un tag `environment` troppo lungo. Il comando fallisce e restituisce il messaggio d'errore del blocco `validation`:

```
$ terraform apply -var='resource_tags={project="my-project",environment="development"}'
```

- Fonte: [Customize Terraform configuration with variables](https://developer.hashicorp.com/terraform/tutorials/configuration-language/variables)

---

## 4.13 — Usare le input variable come argomenti dei moduli

Con i blocchi `variable` si definisce l'interfaccia di input di un modulo, così gli utenti possono passare valori personalizzati al modulo al momento dell'esecuzione.

Con valori scritti a mano, Terraform configura le risorse sempre allo stesso modo, e il modulo diventa rigido e difficile da riutilizzare. Se un valore della configurazione cambia tra un'operazione di Terraform e l'altra, lo si può sostituire con un blocco `variable`. Il blocco permette a chi usa il modulo di personalizzarne il comportamento senza modificarne il codice sorgente.

### 4.13.1 — Definire le variabili

Si aggiungono blocchi `variable` al modulo root per far passare valori al modulo al momento dell'esecuzione. Un blocco `variable` in un modulo figlio permette invece a un modulo padre di passare valori al modulo figlio. Ad esempio, se il modulo root ha una risorsa con valori scritti a mano:

```
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t2.micro"
  subnet_id     = "subnet-12345"

  tags = {
    Environment = "dev"
    Name        = "dev-web-server"
  }
}
```

si aggiunge un blocco `variable` per ogni input che si vuole definire. L'esempio seguente definisce le input variable `instance_type`, `subnet_id` ed `environment`. Con queste variabili, chi usa il modulo può personalizzare il tipo di istanza, la subnet e l'ambiente di deployment del web server:

```
variable "instance_type" {
  type        = string
  description = "EC2 instance type for the web server"
  default     = "t2.micro"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID where the web server will be deployed"
}

variable "environment" {
  type        = string
  description = "Deployment environment name"
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}
```

La variabile `environment` contiene anche un blocco `validation` facoltativo, che verifica che il valore indicato soddisfi i requisiti del modulo.

### 4.13.2 — Fare riferimento ai valori delle variabili

In altre parti della configurazione si fa riferimento a una variabile con la sintassi `var.<NAME>`. Per far usare al web server le nuove variabili, si sostituiscono i valori scritti a mano con riferimenti a `var.instance_type`, `var.subnet_id` e `var.environment`:

```
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  subnet_id     = var.subnet_id

  tags = {
    Environment = var.environment
    Name        = "${var.environment}-web-server"
  }
}
```

Chi usa il modulo può tenere i valori di default di `environment` e `instance_type`, o inserire valori personalizzati quando esegue la configurazione. Se una variabile non ha un default, come `subnet_id`, Terraform chiede all'utente di assegnarle un valore prima di generare il piano.

### 4.13.3 — Valori sensibili nelle variabili

Se una variabile contiene dati sensibili, come una chiave API o una password, con l'argomento `sensitive` Terraform non ne mostra il valore nell'output della CLI:

```
variable "database_password" {
  type        = string
  description = "Password for the RDS database instance"
  sensitive   = true
}
```

Terraform conserva comunque nello state i valori delle variabili sensitive. Aggiungendo l'argomento `ephemeral` alla variabile, la si esclude dallo state e dai file di piano, ma con alcune restrizioni sui valori che le si possono assegnare (sezione 4.28). Le best practice per definire le variabili sono nella *Terraform style guide*, il blocco `variable` è descritto nella sezione 4.14.

### 4.13.4 — Assegnare valori alle variabili

Alle variabili del modulo root si assegnano valori in diversi modi, ognuno con un proprio livello di precedenza. I moduli figli ricevono invece gli input dal modulo padre, come argomenti. Se un modulo definisce una variabile senza argomento `default`, Terraform chiede all'utente un valore prima di generare il piano. Nel modulo root i valori si assegnano con questi metodi:

- le variabili e i variable set di HCP Terraform;
- le opzioni `-var` e `-var-file` della CLI;
- i file di definizione delle variabili;
- le variabili d'ambiente.

Una volta assegnato un valore a una variabile, non lo si può riassegnare nello stesso file. Se però il modulo root riceve più valori per la stessa variabile da fonti diverse, Terraform applica questo ordine di precedenza, dal più alto al più basso:

1. le opzioni `-var` e `-var-file` sulla riga di comando, nell'ordine in cui sono indicate, e le variabili di HCP Terraform;
2. i file `*.auto.tfvars` o `*.auto.tfvars.json`, in ordine lessicale;
3. il file `terraform.tfvars.json`;
4. il file `terraform.tfvars`;
5. le variabili d'ambiente;
6. l'argomento `default` del blocco `variable`.

I valori definiti in HCP Terraform e sulla riga di comando hanno quindi la precedenza su tutti gli altri modi di assegnare i valori, mentre l'argomento `default` della variabile ha la precedenza più bassa.

**Gestire le variabili in HCP Terraform** _(stepTitle)_

HCP Terraform offre queste funzionalità di gestione delle variabili:

- assegnare valori alle variabili della configurazione tramite i workspace;
- raggruppare le variabili in set da applicare a più workspace;
- limitare con il controllo degli accessi chi può vedere e creare nuove variabili.

**Variabili da riga di comando** _(stepTitle)_

Inserire i valori con i comandi della CLI è utile per i deployment una tantum, o per sovrascrivere valori specifici senza creare nuovi file. I valori si assegnano con l'opzione `-var=<VAR_NAME>=<VALUE>`:

```
terraform apply -var="instance_type=t3.medium" -var="environment=prod"
terraform apply -var='subnet_ids=["subnet-12345","subnet-67890"]'
```

Se si passano tipi complessi con le variabili d'ambiente o con le opzioni da riga di comando, bisogna usare la sintassi JSON corretta per rispettare le regole di escape della shell:

```
export TF_VAR_complex_config='{"key": "value", "list": ["a", "b"]}'
```

Per leggibilità, ed evitare l'escape della shell, è consigliato impostare i valori complessi nei file di definizione delle variabili. Le virgolette nella shell e nel prompt dei comandi di Windows sono descritte nella sezione 3.8.4.

**File di definizione delle variabili** _(stepTitle)_

I file di definizione delle variabili sono ideali per gestire le configurazioni di ambienti diversi e per tenere i valori delle variabili nel controllo versione. In un file con estensione `.tfvars` o `.auto.tfvars` si assegnano più valori direttamente ai nomi delle variabili. Ad esempio, il file `production.auto.tfvars` assegna i valori per un ambiente di produzione:

```
instance_type     = "t3.large"
environment      = "prod"
subnet_ids       = ["subnet-12345", "subnet-67890", "subnet-abcdef"]
enable_monitoring = true
```

Terraform carica automaticamente i file di definizione delle variabili se trova uno di questi file:

- file con nome che termina in `.auto.tfvars` o `.auto.tfvars.json`;
- un file chiamato `terraform.tfvars.json`;
- un file chiamato `terraform.tfvars`.

Terraform carica questi file in momenti diversi. Per i valori assegnati nei file di definizione l'ordine di precedenza, dal più alto, è: i file `*.auto.tfvars` o `*.auto.tfvars.json` in ordine lessicale, poi `terraform.tfvars.json`, poi `terraform.tfvars`.

Se il nome di un file termina in `.json`, Terraform lo legge come un oggetto JSON, con i nomi delle variabili come chiavi dell'oggetto radice:

```
{
  "image_id": "ami-abc123",
  "availability_zone_names": ["us-west-1a", "us-west-1c"]
}
```

Un file `.tfvars` si può anche passare direttamente alla CLI con l'opzione `-var-file`:

```
terraform apply -var-file="production.auto.tfvars"
```

Se i file di definizione delle variabili contengono valori sensibili, bisogna farli ignorare dal sistema di controllo versione.

**Variabili d'ambiente** _(stepTitle)_

Le variabili d'ambiente sono utili nelle pipeline CI/CD, per iniettare valori di configurazione senza creare altri file. Si impostano con il prefisso `TF_VAR_` davanti al nome della variabile:

```
export TF_VAR_instance_type=t3.medium
export TF_VAR_environment=staging
terraform apply
```

Anche qui, per i tipi complessi va usata la sintassi JSON corretta, ed è consigliato preferire i file di definizione delle variabili.

**Variabili non dichiarate** _(stepTitle)_

Terraform tratta in modo diverso i valori assegnati a variabili non dichiarate, a seconda di come vengono assegnati:

- ignora le variabili d'ambiente che non hanno un blocco `variable` corrispondente;
- dà un warning se si assegna una variabile non dichiarata in un file di definizione delle variabili, così si notano gli errori di battitura nella configurazione o nei file di definizione;
- dà errore se si cerca di assegnare un valore a una variabile non dichiarata con `-var` sulla riga di comando.

- Fonte: [Use input variables to add module arguments](https://developer.hashicorp.com/terraform/language/v1.12.x/values/variables)

---

## 4.14 — Il blocco variable

Il blocco `variable` serve a parametrizzare la configurazione, così chi usa il modulo può passarle valori personalizzati al momento dell'esecuzione.

Il blocco `variable` è simile all'argomento di una funzione negli altri linguaggi di programmazione. Le input variable permettono di personalizzare i moduli Terraform senza modificarne il codice sorgente, e fanno da parametri dei moduli, rendendoli componibili e riutilizzabili. Le variabili si definiscono nei moduli root o nei moduli figli:

- nei moduli root, i valori si impostano con le opzioni della CLI, le variabili d'ambiente, i file di definizione delle variabili o un workspace HCP Terraform;
- nei moduli figli, è il modulo padre a passare i valori, come argomenti del blocco `module`.

### 4.14.1 — Modello e configurazione completa

Il blocco `variable` supporta gli argomenti `type` (vincolo di tipo), `default` (espressione), `description` (stringa), `validation` (blocco con `condition` ed `error_message`), `sensitive`, `nullable` ed `ephemeral` (booleani). Nessun argomento del blocco è mutuamente esclusivo con un altro:

```
variable "<LABEL>" {
  type        = <TYPE>
  default     = <DEFAULT_VALUE>
  description = "<DESCRIPTION>"
  sensitive   = <true|false>
  nullable    = <true|false>
  ephemeral   = <true|false>

  validation {
    condition     = <EXPRESSION>
    error_message = "<ERROR_MESSAGE>"
  }
}
```

### 4.14.2 — Specifica

L'etichetta dopo la parola chiave `variable` è il nome della variabile, che deve essere univoco tra tutte le variabili dello stesso modulo. Il nome può essere qualsiasi identificatore valido, tranne questi nomi riservati: `source`, `version`, `providers`, `count`, `for_each`, `lifecycle`, `depends_on` e `locals`. Il blocco supporta questi argomenti, tutti facoltativi:

| **Argomento** | **Descrizione** | **Tipo** |
|---|---|---|
| `type` | Vincolo di tipo per il valore della variabile | Vincolo di tipo |
| `default` | Valore predefinito; le variabili senza default richiedono che si assegni un valore | Espressione |
| `description` | Descrizione dello scopo della variabile e del valore atteso | Stringa |
| `validation` | Regola che il valore deve rispettare, oltre al vincolo di tipo | Blocco |
| `sensitive` | Se Terraform deve nascondere il valore nell'output della CLI | Booleano |
| `nullable` | Se il valore della variabile può essere null | Booleano |
| `ephemeral` | Se il valore non deve essere salvato nello state e nei file di piano | Booleano |

**type** _(stepTitle)_

L'argomento `type` limita il tipo di valore che si può assegnare alla variabile; senza vincolo di tipo, la variabile accetta un valore di qualsiasi tipo (il default è `any`):

```
variable "unique_name" {
  type = <type-constraint>
}
```

I vincoli di tipo aiutano chi usa il modulo a capire quale valore serve alla variabile, e producono messaggi d'errore utili se si cerca di usare un tipo non valido. Come vincolo si può usare qualsiasi tipo primitivo, complesso o strutturale valido (sezione 4.21).

**default** _(stepTitle)_

L'argomento `default` definisce un valore predefinito per la variabile, che diventa così facoltativa: se non si fornisce un valore quando si usa il modulo, Terraform usa il default:

```
variable "region" {
  type    = string
  default = <default-value>
}
```

Se si specificano sia `type` sia `default`, il default deve essere convertibile nel tipo indicato. L'argomento `default` richiede un valore letterale e non può fare riferimento ad altri oggetti della configurazione.

**description** _(stepTitle)_

L'argomento `description` documenta lo scopo della variabile e il valore atteso. La descrizione va scritta dal punto di vista di chi usa il modulo, per aiutarlo a capire come usare la variabile. Per lasciare note sul blocco come maintainer del modulo si usa invece un commento.

**validation** _(stepTitle)_

Il blocco `validation` impone che il valore della variabile soddisfi requisiti specifici, oltre al vincolo di tipo. Le validazioni garantiscono che la variabile rispetti le esigenze della configurazione prima che Terraform finisca di generare il piano:

```
variable "unique_name" {
  validation {
    condition     = <expression-to-verify>
    error_message = "<error message string>"
  }
}
```

Il blocco ha due argomenti obbligatori:

- `condition`: un'espressione condizionale valida, che deve valere true perché Terraform prosegua con l'operazione;
- `error_message`: la stringa da mostrare se la condizione vale false.

Terraform valuta le validazioni delle variabili mentre crea il piano. Se la `condition` di un blocco `validation` vale false, Terraform genera un errore, mostra `error_message` e interrompe l'operazione in corso (sezione 4.24).

**sensitive** _(stepTitle)_

L'argomento `sensitive` impedisce a Terraform di mostrare il valore della variabile nell'output della CLI quando la si usa nella configurazione (default `false`):

```
variable "user_password" {
  type      = string
  sensitive = true
}
```

Quando una variabile è marcata sensitive, Terraform ne oscura il valore nei log di plan e apply. Considera inoltre sensitive tutte le espressioni che la usano:

```
Terraform will perform the following actions:

  # some_resource.a will be created
  + resource "some_resource" "a" {
      + user_password = (sensitive value)
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

Terraform registra comunque i valori sensitive nello state, quindi chi può accedere ai dati di state può accedere anche ai valori sensitive.

**nullable** _(stepTitle)_

L'argomento `nullable` permette di assegnare alla variabile il valore `null`, ed è `true` per default:

```
variable "example" {
  type     = string
  nullable = false
}
```

Se `nullable` è `false`, la variabile deve avere un valore diverso da null. Se `nullable` è `true` e la variabile ha un default, si può impostare esplicitamente il valore a `null`, sovrascrivendo il default. Se la variabile è di un tipo collezione o strutturale, come una lista o un oggetto, gli elementi annidati possono essere `null` purché la collezione o la struttura stessa non lo sia.

**ephemeral** _(stepTitle)_

L'argomento `ephemeral` (default `false`, disponibile da Terraform v1.10) rende la variabile disponibile durante l'esecuzione, ma Terraform esclude i valori ephemeral dallo state e dai file di piano. È utile per valori che esistono solo temporaneamente, come un token di breve durata o un identificativo di sessione. Le variabili ephemeral si possono usare e impostare solo in contesti specifici:

- un blocco `output` con l'argomento `ephemeral`;
- un altro blocco `variable` con l'argomento `ephemeral`;
- un argomento write-only in un blocco `resource`;
- un blocco `ephemeral` (ephemeral resource);
- il blocco `provider`, per configurare i provider;
- la configurazione di un `provisioner` e della sua `connection`.

Se un'altra espressione fa riferimento a una variabile ephemeral, anche quell'espressione diventa implicitamente ephemeral.

### 4.14.3 — Esempi

**Dichiarazione di base e tipo complesso** _(stepTitle)_

Nell'esempio, la variabile `image_id` richiede una stringa e non ha default, quindi è obbligatoria. La variabile `availability_zone_names` accetta una lista di stringhe e ha un default, quindi è facoltativa. La variabile `docker_ports` accetta una lista di oggetti, ognuno dei quali deve avere gli attributi numerici `internal` ed `external` e l'attributo stringa `protocol`:

```
variable "image_id" {
  type        = string
  description = "The ID of the machine image (AMI) to use for the server."
}

variable "availability_zone_names" {
  type        = list(string)
  description = "List of availability zones where resources will be deployed."
  default     = ["us-west-1a"]
}

variable "docker_ports" {
  type = list(object({
    internal = number
    external = number
    protocol = string
  }))
  description = "List of port configurations for Docker containers."
  default = [
    {
      internal = 8300
      external = 8300
      protocol = "tcp"
    }
  ]
}
```

**Variabile con validazione** _(stepTitle)_

Il blocco `validation` verifica che `image_id` sia più lungo di 4 caratteri e inizi con `"ami-"`; se il valore non rispetta la condizione, Terraform mostra il messaggio d'errore indicato:

```
variable "image_id" {
  type        = string
  description = "The ID of the machine image (AMI) to use for the server."

  validation {
    condition     = length(var.image_id) > 4 && substr(var.image_id, 0, 4) == "ami-"
    error_message = "The image_id value must be a valid AMI ID, starting with \"ami-\"."
  }
}
```

**Variabile sensitive** _(stepTitle)_

La variabile `database_password` è marcata sensitive. Terraform oscura nei log sia il valore della variabile sia gli argomenti delle risorse che la usano:

```
variable "database_password" {
  type        = string
  description = "Password for the database instance."
  sensitive   = true
}

resource "aws_db_instance" "example" {
  identifier = "my-database"
  engine     = "mysql"
  username   = "admin"
  password   = var.database_password
  # …
}
```

In plan e apply Terraform mostra i valori sensitive come `(sensitive value)`. Quando si applica la configurazione, ad esempio, oscura sia la variabile `database_password` sia gli argomenti delle risorse che la usano:

```
Terraform will perform the following actions:

  # aws_db_instance.example will be created
  + resource "aws_db_instance" "example" {
      + identifier = "my-database"
      + engine     = "mysql"
      + username   = "admin"
      + password   = (sensitive value)
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

Qualsiasi espressione che fa riferimento a una variabile sensitive diventa automaticamente sensitive.

**Variabile ephemeral** _(stepTitle)_

L'esempio configura il provider AWS con credenziali prese da tre variabili con dati sensibili. Le variabili `access_key`, `secret_key` e `session_token` sono ephemeral: sono disponibili durante le operazioni di Terraform, ma poi non vengono salvate nello state né nei file di piano.

```
variable "access_key" {
  description = "AWS access key"
  type     = string
  ephemeral = true
}

variable "secret_key" {
  description = "AWS sensitive secret key."
  type     = string
  sensitive = true
  ephemeral = true
}

variable "session_token" {
  description = "AWS session token."
  type     = string
  sensitive = true
  ephemeral = true
}

provider "aws" {
  access_key = var.access_key
  secret_key = var.secret_key
  token      = var.session_token
}
```

- Fonte: [variable block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/variable)

---

## 4.15 — Esportare dati da Terraform

Gli output value di Terraform permettono di esportare dati strutturati sulle risorse. Questi dati servono a configurare altre parti dell'infrastruttura con strumenti di automazione, o come data source per un altro workspace Terraform. Gli output sono anche il modo in cui un modulo figlio espone dati al modulo root.

Nel tutorial si usa Terraform per distribuire su AWS un'infrastruttura applicativa: una VPC, un load balancer, istanze EC2 e un database. Si usano gli output per ottenere informazioni sulle risorse. Poi si usa il flag `sensitive` per ridurre il rischio di rivelare per errore il nome utente e la password dell'amministratore del database. Infine si vede come formattare gli output in JSON leggibile da una macchina.

### 4.15.1 — Output della VPC e del load balancer

Le dichiarazioni di output possono stare in qualsiasi punto dei file di configurazione. È consigliato però definirle in un file separato chiamato `outputs.tf`, così gli utenti capiscono più facilmente la configurazione e vedono subito gli output previsti. Si aggiunge a `outputs.tf` un blocco che mostra l'ID della VPC:

```
output "vpc_id" {
  description = "ID of project VPC"
  value       = module.vpc.vpc_id
}
```

L'argomento `description` è facoltativo, ma conviene metterlo in tutte le dichiarazioni di output per documentarne l'intento e il contenuto. Come valore di un output si può usare il risultato di qualsiasi espressione Terraform:

```
output "lb_url" {
  description = "URL of load balancer"
  value       = "http://${module.elb_http.elb_dns_name}/"
}

output "web_server_count" {
  description = "Number of web servers provisioned"
  value       = length(module.ec2_instances.instance_ids)
}
```

L'output `lb_url` usa l'interpolazione di stringhe per costruire un URL dal nome di dominio del load balancer. L'output `web_server_count` usa la funzione `length()` per calcolare il numero di istanze collegate al load balancer.

Terraform conserva gli output value nel file di state della configurazione. Per vedere questi output bisogna quindi aggiornare lo state applicando la nuova configurazione, anche se l'infrastruttura non cambia.

### 4.15.2 — Interrogare gli output

Dopo aver creato gli output, il comando `terraform output` li mostra tutti, e `terraform output lb_url` ne interroga uno per nome. Da Terraform 0.14, per default gli output di tipo stringa sono racchiusi tra virgolette. Interrogando un output specifico, l'opzione `-raw` restituisce il valore in un formato leggibile da una macchina. Ad esempio, si usa il valore di `lb_url` con `-raw` per interrogare il load balancer con cURL e verificarne la risposta:

```
$ curl $(terraform output -raw lb_url)
```

Con HCP Terraform, gli output della configurazione compaiono anche in una tabella nella pagina di panoramica del workspace.

### 4.15.3 — Oscurare gli output sensibili

Gli output di Terraform si possono marcare come sensitive. Terraform oscura i valori degli output sensitive, per evitare di stamparli per errore nella console. Gli output sensitive servono a condividere dati sensibili della configurazione con altri moduli Terraform, strumenti di automazione o workspace HCP Terraform.

Terraform oscura gli output sensitive quando pianifica, applica o distrugge la configurazione, e quando si interrogano tutti gli output. Non li oscura negli altri casi: quando si interroga un output specifico per nome, quando si interrogano tutti gli output in formato JSON, o quando si usano gli output di un modulo figlio nel modulo root. Si aggiungono a `outputs.tf` questi blocchi output, con l'attributo `sensitive` impostato a `true`:

```
output "db_username" {
  description = "Database administrator username"
  value       = aws_db_instance.database.username
  sensitive   = true
}

output "db_password" {
  description = "Database administrator password"
  value       = aws_db_instance.database.password
  sensitive   = true
}
```

Applicando la modifica, Terraform oscura i valori degli output marcati come sensitive. Interrogando per nome la password del database con `terraform output db_password`, invece, Terraform non oscura il valore.

Terraform conserva tutti gli output value in chiaro nel file di state, compresi quelli marcati come sensitive. Nel tutorial lo si verifica cercando la sezione `outputs` nel file `terraform.tfstate` con `grep`. Con HCP Terraform bisogna prima scaricare lo state remoto con `terraform state pull > terraform.tfstate`. L'argomento `sensitive` degli output aiuta a evitare di esporre i valori per errore, ma bisogna comunque tenere al sicuro lo state di Terraform.

### 4.15.4 — Generare output leggibile da una macchina

L'output della CLI di Terraform è pensato per essere letto da una persona. Per un formato leggibile da una macchina, da usare in automazione, si usa l'opzione `-json`:

```
$ terraform output -json
```

Con l'opzione `-json` Terraform non oscura gli output sensitive, perché presume che l'output venga usato da uno strumento di automazione.

- Fonte: [Output data from Terraform](https://developer.hashicorp.com/terraform/tutorials/configuration-language/outputs)

---

## 4.16 — Usare gli output per esporre i dati dei moduli

Si aggiungono blocchi `output` alla configurazione per esporre informazioni sull'infrastruttura sulla riga di comando, in HCP Terraform e in altre configurazioni Terraform. Il blocco `output` serve a quattro scopi:

- i moduli figli possono esporre attributi delle risorse ai moduli padre;
- i moduli root possono mostrare valori nell'output della CLI;
- altre configurazioni Terraform che usano lo state remoto possono accedere agli output del modulo root con il data source `terraform_remote_state`, anche tramite la condivisione dello state in HCP Terraform;
- si possono passare informazioni da un'operazione di Terraform a uno strumento di automazione.

### 4.16.1 — Definire gli output

Si aggiungono blocchi `output` per esportare informazioni sull'infrastruttura del modulo. Ad esempio, con due blocchi `output` si espongono l'ID e l'indirizzo IP del web server della configurazione:

```
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "instance_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.web.private_ip
}

resource "aws_instance" "web" {
  # …
}
```

L'argomento `value` di un blocco `output` accetta qualsiasi espressione valida (sezione 4.17).

### 4.16.2 — Accedere agli output value

Le informazioni esposte da un modulo si leggono in modi diversi, a seconda di dove è definito l'output. Terraform mostra gli output value del modulo root nella CLI dopo l'apply della configurazione. Con HCP Terraform, gli output della configurazione compaiono anche nella pagina di panoramica del workspace.

**Output dei moduli figli** _(stepTitle)_

Un blocco `output` in un modulo figlio espone quel valore al modulo padre, così si possono passare valori dal figlio al padre. I moduli padre accedono agli output dei moduli figli con la sintassi `module.<CHILD_MODULE_NAME>.<OUTPUT_NAME>`. Ad esempio, il modulo padre seguente usa gli output `instance_ip` e `instance_id` di un modulo figlio chiamato `web_server`:

```
module "web_server" {
  source = "./modules/web_server"
  # …
}

resource "aws_route53_record" "web" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "web.example.com"
  type    = "A"
  records = [module.web_server.instance_ip]
  #...
}

resource "aws_cloudwatch_alarm" "web_health" {
  alarm_name          = "web-server-health"
  comparison_operator = "GreaterThanThreshold"
  threshold           = "80"

  dimensions = {
    InstanceId = module.web_server.instance_id
  }
  # ...
}
```

### 4.16.3 — Valori sensibili negli output

Se un output contiene dati sensibili, come una password o una chiave API, con l'argomento `sensitive` Terraform non ne mostra il valore nell'output della CLI. Interrogando direttamente nella CLI un output sensitive, compare un messaggio oscurato al posto del valore reale.

```
output "database_password" {
  description = "Auto-generated password for the RDS database instance"
  value       = aws_db_instance.main.password
  sensitive   = true
}
```

> **Attenzione**: Terraform conserva nello state i valori degli output sensitive. Se si usa il comando `terraform output` con le opzioni `-json` o `-raw`, Terraform mostra gli output sensitive in chiaro.
_(infoBox)_

Aggiungendo l'argomento `ephemeral` a un output, il valore viene escluso dallo state e dai file di piano, ma ci sono restrizioni sui valori che si possono assegnare a quell'output (sezione 4.28).

- Fonte: [Use outputs to expose module data](https://developer.hashicorp.com/terraform/language/v1.12.x/values/outputs)

---

## 4.17 — Il blocco output

Il blocco `output` permette di esporre informazioni sull'infrastruttura. Il suo valore è simile al valore di ritorno di una funzione negli altri linguaggi di programmazione. Le informazioni esposte si possono usare sulla riga di comando, in HCP Terraform e nelle altre configurazioni Terraform che possono accedere allo state della configurazione. Il blocco ha quattro scopi principali:

- i moduli figli possono esporre attributi delle risorse ai moduli genitori;
- i moduli root possono mostrare valori nell'output della CLI;
- altre configurazioni Terraform che usano lo state remoto possono accedere agli output del modulo root con il data source `terraform_remote_state`;
- passare informazioni da un'operazione di Terraform a uno strumento di automazione.

In HCP Terraform i valori dei blocchi `output` compaiono nell'interfaccia dopo l'apply della configurazione. Gli output marcati come sensitive in HCP Terraform sono nascosti nell'interfaccia e nelle risposte delle API.

### 4.17.1 — Modello e configurazione completa

Il blocco `output` supporta gli argomenti `value` (espressione), `description` (stringa), `sensitive` ed `ephemeral` (booleani), `depends_on` (lista di riferimenti) e il blocco `precondition`, con `condition` ed `error_message`. Nessun argomento del blocco è mutuamente esclusivo con un altro:

```
output "<LABEL>" {
  value       = <EXPRESSION>
  description = "<STRING>"
  sensitive   = <true|false>
  ephemeral   = <true|false>
  depends_on  = [<REFERENCE>]

  precondition {
    condition     = <EXPRESSION>
    error_message = "<STRING>"
  }
}
```

### 4.17.2 — Specifica

Quando si dichiara un blocco `output` si seguono le regole di naming delle risorse di Terraform. Il blocco supporta questi argomenti:

| **Argomento** | **Descrizione** | **Tipo** | **Obbligatorio** |
|---|---|---|---|
| `value` | Il valore che Terraform restituisce per questo output | Espressione | Sì |
| `description` | Descrizione dello scopo dell'output e di come usarlo | Stringa | No |
| `sensitive` | Se Terraform deve nascondere il valore nell'output della CLI | Booleano | No |
| `ephemeral` | Se il valore non deve essere salvato nello state | Booleano | No |
| `depends_on` | Lista di dipendenze esplicite dell'output | Lista | No |
| `precondition` | Condizione da validare prima di calcolare l'output o salvarlo nello state | Blocco | No |

**value** _(stepTitle)_

Ogni blocco `output` deve avere un argomento `value`. Terraform valuta l'espressione di `value`, ne espone il risultato come valore di ritorno dell'output e lo salva nello state:

```
output "unique_name" {
  value = <expression-to-evaluate>
}
```

Qualsiasi espressione valida può essere il valore di un output.

**description** _(stepTitle)_

L'argomento `description` spiega lo scopo dell'output, i suoi requisiti e il tipo di valore che esporta:

```
output "instance_ip_addr" {
  value       = <expression-to-evaluate>
  description = "<concise description from the perspective of a module consumer>."
}
```

È consigliato scriverlo dal punto di vista di chi usa il modulo, perché capisca a cosa serve l'output e come usarlo.

**sensitive** _(stepTitle)_

Con l'argomento `sensitive` (default `false`) il valore del blocco viene nascosto nell'output della CLI di un'operazione di Terraform:

```
output "admin_password" {
  value     = <expression-to-evaluate>
  sensitive = <boolean>
}
```

Con `sensitive = true`, Terraform oscura il valore nelle operazioni di plan e apply:

```
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

admin_password = (sensitive value)
```

Con le opzioni `-json` o `-raw` del comando `terraform output`, invece, Terraform mostra i valori sensitive in chiaro. Terraform registra inoltre i valori sensitive nello state, quindi chi può accedere ai dati di state può accedere anche ai valori sensitive.

**ephemeral** _(stepTitle)_

L'argomento `ephemeral` (default `false`, disponibile da Terraform v1.10) si aggiunge ai blocchi `output` dei moduli figli, per passare dati tra moduli senza salvarli nello state o nei file di piano. Non si può aggiungere ai blocchi `output` del modulo root:

```
output "unique_password" {
  value     = <expression-to-evaluate>
  ephemeral = <boolean>
}
```

Passare output value tra i moduli figli e il modulo root è utile per gestire credenziali, token e altri valori temporanei che non si vogliono salvare nello state. Con `ephemeral` attivo, la configurazione deve rispettare due condizioni:

- il valore del blocco `output` deve provenire da un contesto ephemeral;
- l'output si può usare solo in altri contesti ephemeral.

I contesti ephemeral che possono impostare i valori degli output ephemeral, e anche usarli, sono:

- il blocco `output` ephemeral di un altro modulo figlio;
- un argomento write-only;
- le variabili con l'argomento `ephemeral`;
- un blocco `ephemeral` (ephemeral resource);
- la configurazione dei provider nel blocco `provider`;
- la configurazione di un `provisioner` e della sua `connection`.

**depends_on** _(stepTitle)_

L'argomento `depends_on` specifica una dipendenza esplicita del blocco `output` da un'altra risorsa a monte. Terraform completa tutte le operazioni sulla risorsa a monte prima di calcolare il valore dell'output che dipende da essa:

```
output "unique_name" {
  value      = <expression-to-evaluate>
  depends_on = [<another_resource.name>]
}
```

È un meta-argomento (sezione 4.10).

**precondition** _(stepTitle)_

Il blocco `precondition` permette di verificare che il valore di un output soddisfi requisiti specifici. La verifica avviene prima che Terraform esponga l'output o ne salvi il valore nello state:

```
output "unique_name" {
  value  = <expression-to-evaluate>

  precondition {
    condition     = <expression-to-verify>
    error_message = "<error message string>"
  }
}
```

Il blocco ha due argomenti obbligatori:

- `condition`: un'espressione condizionale valida, che deve valere true perché Terraform prosegua con l'operazione;
- `error_message`: la stringa da mostrare se la condizione vale false.

Terraform valuta le precondition degli output quando crea o applica un piano. Se la `condition` vale false, genera un errore con `error_message` e interrompe l'operazione in corso.

### 4.17.3 — Esempi

L'esempio di base espone l'indirizzo IP privato di un server del modulo corrente. Il secondo usa l'output `instance_ip_addr` di un modulo figlio chiamato `web_server`. Il terzo imposta `sensitive = true` per non mostrare la password del database nell'output della CLI:

```
output "instance_ip_addr" {
  value       = aws_instance.server.private_ip
  description = "The private IP address of the main server instance."
}

output "website_url" {
  value = "https://${module.web_server.instance_ip_addr}"
  description = "The URL of the web server, starting with https://."
}

output "db_password" {
  value     = aws_db_instance.db.password
  description = "The database password."
  sensitive = true
}
```

**Output con validazione** _(stepTitle)_

Nell'esempio seguente, l'output `instance_public_ip` ha una precondition che deve essere soddisfatta prima di esporre l'output o salvarlo nello state. Prima di condividere l'IP pubblico del server, la precondition verifica che il security group del server abbia almeno una regola in ingresso che consenta il traffico sulle porte 80 o 443:

```
output "instance_public_ip" {
  value = aws_instance.web.public_ip
  description = "Public IP address of the instance."

  precondition {
    condition     = length([for rule in aws_security_group.web.ingress : rule if rule.to_port == 80 || rule.to_port == 443]) > 0
    error_message = "Security group must allow HTTP (port 80) or HTTPS (port 443) ingress traffic."
  }
}
```

Se il security group del server non consente il traffico in ingresso sulle porte 80 o 443, Terraform genera un errore con `error_message` e interrompe l'operazione in corso. L'esempio con una dipendenza esplicita (`depends_on` su una regola del security group) è lo stesso della sezione 4.10.3.

- Fonte: [output block reference](https://developer.hashicorp.com/terraform/language/v1.12.x/block/output)

---

## 4.18 — Operazioni dinamiche con le funzioni

Il linguaggio di configurazione di Terraform permette di scrivere espressioni dichiarative per creare l'infrastruttura. Non è un linguaggio di programmazione, ma offre diverse funzioni integrate per eseguire operazioni in modo dinamico. Nel tutorial si usano tre funzioni:

- `templatefile`, per creare in modo dinamico lo script user data di un'istanza EC2;
- `lookup`, per leggere valori da una map;
- `file`, per leggere il contenuto di un file.

### 4.18.1 — Generare uno script con templatefile

AWS permette di configurare le istanze EC2 perché eseguano all'avvio uno script fornito dall'utente, chiamato script user data. La funzione `templatefile` di Terraform interpola dei valori nello script al momento della creazione della risorsa, e così lo script diventa più adattabile e riutilizzabile.

Il file `user_data.tftpl` è lo script user data dell'istanza EC2: un template di script shell che configura e distribuisce un'applicazione. Contiene i riferimenti `${department}` e `${name}`, i cui valori Terraform interpola con la funzione `templatefile`:

```
#!/bin/bash

# Setup sudo to allow no-password sudo for your group and adding your user
sudo groupadd -r ${department}
sudo useradd -m -s /bin/bash ${name}
sudo usermod -a -G ${department} ${name}
sudo cp /etc/sudoers /etc/sudoers.orig
echo "${name} ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/${name}
```

Il file `variables.tf` definisce le input variable `user_name` e `user_department`, con cui la configurazione imposta i valori delle chiavi corrispondenti del template:

```
variable "user_name" {
  description = "The user creating this infrastructure"
  default     = "terraform"
}

variable "user_department" {
  description = "The organization the user belongs to: dev, prod, qa"
  default     = "learn"
}
```

In `main.tf` si aggiunge l'attributo `user_data` alla risorsa `aws_instance`. La funzione `templatefile` prende due argomenti: il nome del file di template e una map con i valori da assegnare nel template.

```
resource "aws_instance" "web" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.subnet_public.id
  vpc_security_group_ids      = [aws_security_group.sg_8080.id]
  associate_public_ip_address = true
  user_data                   = templatefile("user_data.tftpl", { department = var.user_department, name = var.user_name })
}
```

Applicando la configurazione, Terraform crea la rete, l'istanza e lo script di provisioning necessari ad avviare l'applicazione web di esempio. L'output `web_public_address` contiene l'indirizzo dell'istanza dell'applicazione, da aprire nel browser per verificare la configurazione.

### 4.18.2 — Scegliere l'AMI con lookup

La funzione `lookup` restituisce il valore di un singolo elemento di una map, data la sua chiave. Nel tutorial si dichiara in `variables.tf` una nuova input variable, con un default che è una map di ID di AMI per tre region:

```
variable "aws_amis" {
  type = map
  default = {
    "us-east-1" = "ami-04b70fa74e45c3917"
    "us-west-2" = "ami-08012c0a9ee8e21c4"
    "us-east-2" = "ami-09040d770ffe2224f"
  }
}
```

Poi si rimuove da `main.tf` il data source dell'ID dell'AMI, e nella risorsa `aws_instance` si aggiorna l'attributo `ami` perché usi la funzione `lookup`:

```
resource "aws_instance" "web" {
  ami                         = lookup(var.aws_amis, var.aws_region)
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.subnet_public.id
  vpc_security_group_ids      = [aws_security_group.sg_8080.id]
  associate_public_ip_address = true
  user_data                   = templatefile("user_data.tftpl", { department = var.user_department, name = var.user_name })
}
```

L'attributo `ami` è obbligatorio per la risorsa `aws_instance`, quindi `lookup` deve restituire un valore valido perché Terraform possa applicare la configurazione. Gli argomenti di `lookup` sono tre: una map, la chiave da leggere nella map, e un valore di default facoltativo da usare se la chiave non esiste.

Si aggiunge poi a `outputs.tf` un output, per verificare l'AMI restituita da `lookup`:

```
output "ami_value" {
  value = lookup(var.aws_amis, var.aws_region)
}
```

Con `terraform plan -var "aws_region=us-east-2"` si vede il piano delle modifiche con la region impostata a `us-east-2`. Il piano include l'ID dell'AMI selezionata, che Terraform ha ricavato con la funzione `lookup`.

### 4.18.3 — Usare la funzione file

In questa parte si crea un nuovo security group che consente il traffico SSH in ingresso verso l'istanza, e si configura l'istanza con una chiave SSH. Prima si genera una chiave SSH locale da associare all'istanza, per collegarsi in modo sicuro:

```
$ ssh-keygen -C "your_email@example.com" -f ssh_key
```

L'opzione `-f` crea la chiave nella directory corrente, con due file `ssh_key` e `ssh_key.pub`. Alla richiesta della passphrase si preme Invio per lasciarla vuota; su Windows si possono generare le chiavi con PuTTY. Poi si aggiungono a `main.tf` un nuovo security group e una key pair AWS:

```
resource "aws_security_group" "sg_22" {
  name = "sg_22"
  vpc_id = aws_vpc.vpc.id

  ingress {
    from_port = 22
    to_port  = 22
    protocol  = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_key_pair" "ssh_key" {
  key_name = "ssh_key"
  public_key = file("ssh_key.pub")
}
```

Questa configurazione usa la funzione `file` per leggere il contenuto di un file e configurare la key pair SSH. La funzione `file` non interpola valori nel contenuto del file, quindi va usata solo con file che non devono essere modificati.

Poi si modifica la risorsa `aws_instance.web` perché usi il nuovo security group e la key pair:

```
resource "aws_instance" "web" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t2.micro"
  subnet_id                   = aws_subnet.subnet_public.id
  vpc_security_group_ids      = [aws_security_group.sg_22.id, aws_security_group.sg_8080.id]
  associate_public_ip_address = true
  user_data                   = templatefile("user_data.tftpl", { department = var.user_department, name = var.user_name })
  key_name                    = aws_key_pair.ssh_key.key_name
}
```

> **Attenzione**: per gli scopi del tutorial questa configurazione abilita il traffico SSH pubblico verso l'istanza di esempio. Negli ambienti di produzione l'accesso ai servizi va limitato.
_(infoBox)_

Dopo l'apply, per verificare che l'istanza accetti il traffico sulla porta 22 ci si collega via SSH dal terminale. Il provisioning dell'istanza può richiedere fino a 5 minuti.

```
$ ssh ubuntu@$(terraform output -raw web_public_ip) -i ssh_key
```

- Fonte: [Perform dynamic operations with functions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/functions)

---

## 4.19 — Le funzioni integrate

Il linguaggio Terraform include diverse funzioni integrate, che si chiamano dall'interno delle espressioni per trasformare e combinare valori. La sintassi generale di una chiamata a funzione è il nome della funzione seguito dagli argomenti, separati da virgole e racchiusi tra parentesi:

```
max(5, 12, 9)
```

### 4.19.1 — Funzioni definite dai provider

Nel linguaggio di configurazione di Terraform non si possono definire funzioni proprie, ma si possono sviluppare provider che espongono funzioni. Per usare una funzione specifica di un provider si aggiunge il prefisso `provider::<local-name>::`, dove `<local-name>` corrisponde a una voce del blocco `required_providers`. L'esempio chiama la funzione `encode_tfvars` del provider `terraform`:

```
provider::terraform::encode_tfvars({
  example = "Hello!"
})
```

La documentazione di Terraform descrive solo le funzioni integrate e le funzioni dei provider integrati. Le funzioni definite dai provider esterni sono documentate da quei provider nel Terraform Registry.

> **Nota**: nella navigazione della documentazione le funzioni integrate sono raggruppate per categoria: funzioni numeriche, di stringa, di collezione, di codifica, di filesystem, di data e ora, di hash e crittografia, di rete IP e di conversione di tipo.
_(infoBox)_

### 4.19.2 — Sperimentare con le funzioni

Il comportamento delle funzioni integrate si può provare nella console delle espressioni di Terraform, avviata con il comando `terraform console`:

```
> max(5, 12, 9)
12
```

Gli esempi della documentazione di ogni funzione usano l'output della console per mostrare il risultato della chiamata con parametri diversi.

- Fonte: [Built-in functions](https://developer.hashicorp.com/terraform/language/v1.12.x/functions)

---

## 4.20 — Creare espressioni dinamiche

Il linguaggio di configurazione di Terraform supporta espressioni complesse, con cui si calcolano o si generano valori per la configurazione dell'infrastruttura. Un'espressione può essere un semplice valore stringa o intero, o un valore più complesso che rende la configurazione più dinamica.

Nel tutorial si usano le espressioni per configurare e distribuire istanze EC2 e un load balancer. Con le espressioni condizionali si decide se creare più istanze per l'alta disponibilità. Con l'espressione splat si restituiscono più indirizzi IP privati della rete.

### 4.20.1 — Usare un'espressione condizionale

Le espressioni condizionali scelgono un valore a seconda che l'espressione valga vero o falso. In questa configurazione si usa il blocco `locals` per creare un nome di risorsa in base a un valore condizionale, e lo si inserisce in una map di tag delle risorse:

```
resource "random_id" "id" {
  byte_length = 8
}

locals {
  name  = (var.name != "" ? var.name : random_id.id.hex)
  owner = var.team
  common_tags = {
    Owner = local.owner
    Name  = local.name
  }
}
```

La sintassi di un'espressione condizionale definisce prima la condizione, poi i risultati per il caso vero e per il caso falso. Nell'esempio, se `var.name` non è vuota (`!= ""`), `local.name` prende il valore di `var.name`; altrimenti il nome è il `random_id`.

| **Condizione** | **?** | **Valore se vero** | **:** | **Valore se falso** |
|---|---|---|---|---|
| Se la variabile name NON è vuota | allora | assegna al local value il valore di `var.name` | altrimenti | assegna al local value il valore di `random_id.id.hex` |

Poi si aggiunge l'espressione `local.common_tags` all'attributo `tags` delle risorse di rete (`aws_vpc`, `aws_internet_gateway`, `aws_subnet`, `aws_route_table`), del load balancer `aws_elb` e della risorsa `aws_instance`:

```
resource "aws_vpc" "my_vpc" {
  cidr_block           = var.cidr_vpc
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = local.common_tags
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.my_vpc.id
  tags   = local.common_tags
}

resource "aws_subnet" "subnet_public" {
  vpc_id     = aws_vpc.my_vpc.id
  cidr_block = var.cidr_subnet
  tags       = local.common_tags
}

resource "aws_route_table" "rtb_public" {
  vpc_id = aws_vpc.my_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = local.common_tags
}

## ...
resource "aws_elb" "learn" {
## ...
  instances                   = aws_instance.ubuntu.id
  idle_timeout                = 400
  connection_draining         = true
  connection_draining_timeout = 400
  tags                        = local.common_tags
}

resource "aws_instance" "ubuntu" {
  availability_zone = "us-east-1a"
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t2.micro"
  associate_public_ip_address = true
  subnet_id                   = aws_subnet.subnet_public.id
  tags                        = local.common_tags
}
```

> **Nota**: i local value vanno usati con cautela. Riutilizzare un local value semplifica la configurazione, ma può rendere più complesso il ciclo di vita delle risorse.
_(infoBox)_

Infine si crea un file `outputs.tf` con un output `tags`:

```
output "tags" {
  description = "Instance tags"
  value       = aws_instance.ubuntu.tags
}
```

Dopo l'apply, gli output di Terraform contengono i tag delle risorse formattati.

### 4.20.2 — Un count condizionale

In `variables.tf` si aggiunge una nuova variabile booleana per l'alta disponibilità:

```
variable "high_availability" {
  type        = bool
  description = "If this is a multiple instance deployment, choose `true` to deploy 3 instances"
  default     = true
}
```

Poi si aggiorna la risorsa `aws_instance` in `main.tf` in tre punti. Il parametro `count` diventa un'espressione condizionale basata su `var.high_availability`. Il parametro `associate_public_ip_address` assegna un IP pubblico solo alla prima istanza. I tag delle nuove istanze si uniscono con `merge`:

```
resource "aws_instance" "ubuntu" {
  count                       = (var.high_availability == true ? 3 : 1)
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = "t2.micro"
  associate_public_ip_address = (count.index == 0 ? true : false)
  subnet_id                   = aws_subnet.subnet_public.id
  tags                        = merge(local.common_tags)
}
```

| **Condizione** | **?** | **Valore se vero** | **:** | **Valore se falso** |
|---|---|---|---|---|
| Se `var.high_availability` è `true` | allora | crea tre risorse `aws_instance` | altrimenti | crea una sola risorsa `aws_instance` |
| Se `count.index` è 0 | allora | assegna un IP pubblico | altrimenti | non assegnare un IP pubblico |

### 4.20.3 — Usare un'espressione splat

Ora la risorsa `aws_instance` può avere un `count` pari a 3. Per restituire gli indirizzi IP privati di tutte le istanze si crea un output con un'espressione splat `*`. L'espressione splat raccoglie tutti gli oggetti di una lista che condividono un attributo. Il simbolo speciale `*` itera su tutti gli elementi della lista e restituisce le informazioni dell'attributo comune indicato. Senza l'espressione splat, Terraform non potrebbe restituire l'intero array delle istanze, ma solo il primo elemento.

Si aggiunge a `outputs.tf` l'output `private_addresses`, che restituisce il DNS privato di tutte le istanze create dalla risorsa `aws_instance.ubuntu`:

```
output "private_addresses" {
  description = "Private DNS for AWS instances"
  value       = aws_instance.ubuntu[*].private_dns
}
```

L'espressione ricalca il modo in cui si legge un elemento specifico di un array: per restituire solo l'IP della terza istanza basterebbe sostituire `*` con `2`. L'output `tags` attuale darebbe errore, perché le istanze sono più di una. Lo si sostituisce quindi con un output `first_tags`, che restituisce i tag della prima istanza:

```
output "first_tags" {
  description = "Instance tags for first instance"
  value       = aws_instance.ubuntu[0].tags
}
```

Nella configurazione del load balancer si aggiungono poi le nuove istanze:

```
resource "aws_elb" "learn" {
##...
  instances                   = aws_instance.ubuntu[*].id
  idle_timeout                = 400
  connection_draining         = true
  connection_draining_timeout = 400
  tags                        = local.common_tags
}
```

Dopo l'apply, l'output di Terraform contiene l'intero array degli indirizzi privati di tutte e tre le istanze EC2.

- Fonte: [Create dynamic expressions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/expressions)

---

## 4.21 — I vincoli di tipo

Gli autori di moduli e gli sviluppatori di provider possono usare vincoli di tipo dettagliati per validare i valori forniti dagli utenti alle input variable e agli argomenti delle risorse. Richiede qualche conoscenza in più del sistema dei tipi di Terraform, ma permette di costruire un'interfaccia più robusta per moduli e risorse.

### 4.21.1 — Parole chiave e costruttori di tipo

I vincoli di tipo si esprimono con una combinazione di parole chiave di tipo e di costrutti simili a funzioni, chiamati costruttori di tipo:

- le **parole chiave di tipo** sono simboli senza virgolette che rappresentano un tipo statico;
- i **costruttori di tipo** sono simboli senza virgolette seguiti da una coppia di parentesi, che contengono un argomento con più informazioni sul tipo. Senza argomento, un costruttore di tipo non rappresenta un tipo completo, ma una famiglia di tipi simili.

I vincoli di tipo somigliano ad altre espressioni di Terraform, ma hanno una sintassi speciale. Nel linguaggio Terraform sono validi solo nell'argomento `type` di una input variable.

### 4.21.2 — Tipi primitivi

Un tipo primitivo è un tipo semplice, non composto da altri tipi. Tutti i tipi primitivi di Terraform sono rappresentati da una parola chiave di tipo:

- `string`: una sequenza di caratteri Unicode che rappresenta un testo, come `"hello"`;
- `number`: un valore numerico, che può essere un intero come `15` o un valore frazionario come `6.283185`;
- `bool`: `true` o `false`; i valori bool si usano nella logica condizionale.

Il linguaggio Terraform converte automaticamente i valori `number` e `bool` in `string` quando serve, e viceversa, purché la stringa contenga una rappresentazione valida di un numero o di un booleano: `true` diventa `"true"` e viceversa, `false` diventa `"false"` e viceversa, `15` diventa `"15"` e viceversa.

### 4.21.3 — Tipi complessi

Un tipo complesso raggruppa più valori in un unico valore. I tipi complessi sono rappresentati da costruttori di tipo, ma diversi hanno anche una versione abbreviata con parola chiave. Esistono due categorie di tipi complessi: i tipi collezione, che raggruppano valori simili, e i tipi strutturali, che raggruppano valori potenzialmente diversi.

**Tipi collezione** _(stepTitle)_

Un tipo collezione raggruppa più valori di un altro tipo in un unico valore. Il tipo dei valori della collezione si chiama tipo degli elementi. Ogni tipo collezione deve avere un tipo degli elementi, che si passa come argomento al costruttore. Ad esempio, `list(string)` significa "lista di stringhe", ed è un tipo diverso da `list(number)`, una lista di numeri. Tutti gli elementi di una collezione devono essere sempre dello stesso tipo. Il linguaggio Terraform ha tre tipi collezione:

- `list(...)`: una sequenza di valori identificati da numeri interi consecutivi a partire da zero. La parola chiave `list` è un'abbreviazione di `list(any)`, che accetta qualsiasi tipo degli elementi purché tutti gli elementi abbiano lo stesso tipo. Esiste per compatibilità con le configurazioni più vecchie; nel codice nuovo è consigliata la forma completa.
- `map(...)`: una collezione di valori, ognuno identificato da un'etichetta stringa. La parola chiave `map` è un'abbreviazione di `map(any)`, con le stesse avvertenze di `list`. Per definire le map si usano `{}` e, tra chiave e valore, `:` o `=`. Ad esempio, `{ "foo": "bar", "bar": "baz" }` e `{ foo = "bar", bar = "baz" }` definiscono la stessa map. Le chiavi vanno tra virgolette se iniziano con un numero, contengono spazi o caratteri speciali; altrimenti le virgolette si possono omettere. Nelle map su una sola riga le coppie chiave-valore vanno separate da virgole; nelle map su più righe si possono mettere su righe nuove. I due punti sono delimitatori validi, ma `terraform fmt` li ignora, mentre cerca di allineare verticalmente i segni di uguale.
- `set(...)`: una collezione di valori univoci, senza identificatori secondari né ordinamento.

**Tipi strutturali** _(stepTitle)_

Un tipo strutturale raggruppa in un unico valore più valori di tipi diversi. I tipi strutturali richiedono come argomento uno schema, che indica quali tipi sono ammessi per quali elementi. Il linguaggio Terraform ha due tipi strutturali:

- `object(...)`: una collezione di attributi con nome, ognuno con il proprio tipo. Lo schema è `{ <KEY> = <TYPE>, <KEY> = <TYPE>, ... }`, cioè una coppia di parentesi graffe con una serie di coppie `<KEY> = <TYPE>` separate da virgole. I valori conformi devono contenere tutte le chiavi indicate, e il valore di ogni chiave deve essere del tipo indicato. Anche i valori con chiavi in più sono conformi, ma gli attributi in più vengono scartati durante la conversione di tipo.
- `tuple(...)`: una sequenza di elementi identificati da numeri interi consecutivi a partire da zero, in cui ogni elemento ha il proprio tipo. Lo schema è `[<TYPE>, <TYPE>, ...]`, una coppia di parentesi quadre con una serie di tipi separati da virgole. I valori conformi devono avere esattamente lo stesso numero di elementi, né di più né di meno, e il valore in ogni posizione deve essere del tipo indicato per quella posizione.

Ad esempio, un tipo oggetto `object({ name=string, age=number })` corrisponde a un valore come il seguente:

```
{
  name = "John"
  age  = 52
}
```

Un tipo oggetto `object({ id=string, cidr_block=string })` corrisponde anche all'oggetto prodotto da un riferimento a una risorsa `aws_vpc`, come `aws_vpc.example_vpc`. La risorsa ha altri attributi, ma vengono scartati durante la conversione di tipo. Infine, un tipo tuple `tuple([string, number, bool])` corrisponde a un valore come `["a", 15, true]`.

**Letterali dei tipi complessi** _(stepTitle)_

Il linguaggio Terraform ha espressioni letterali per creare valori tuple e object, descritte nelle espressioni letterali come letterali "list/tuple" e "map/object". Terraform non offre nessun modo per rappresentare direttamente liste, map o set. Grazie alla conversione automatica dei tipi complessi però, descritta sotto, la differenza tra tipi complessi simili non conta quasi mai per un utente normale. Per questo gran parte della documentazione di Terraform confonde le liste con le tuple e le map con gli oggetti. Le distinzioni servono solo quando si limitano i valori di input di un modulo o di una risorsa.

### 4.21.4 — Conversione dei tipi complessi

Nel linguaggio Terraform i tipi complessi simili (list, tuple e set, oppure map e object) si possono di solito usare in modo intercambiabile. Per questo gran parte della documentazione sorvola sulle differenze tra di essi. Lo permettono due comportamenti di conversione.

Il primo: quando possibile, Terraform converte i valori tra tipi complessi simili, se il valore fornito non è esattamente del tipo richiesto. Le somiglianze sono queste:

- oggetti e map sono simili. Una map, o un oggetto più grande, si può convertire in un oggetto se ha almeno le chiavi richieste dallo schema. Gli attributi in più vengono scartati durante la conversione, quindi le conversioni map → object → map possono perdere dati.
- tuple e liste sono simili. Una lista si può convertire in una tuple solo se ha esattamente il numero di elementi richiesto.
- i set sono quasi simili sia alle tuple sia alle liste. Quando una lista o una tuple si converte in set, i valori duplicati vengono scartati e l'ordine degli elementi si perde. Quando un set si converte in lista o tuple, gli elementi sono in un ordine arbitrario: se sono stringhe sono in ordine lessicografico, mentre per gli altri tipi di elementi non è garantito nessun ordine.

Il secondo: quando possibile, Terraform converte anche i valori degli elementi dentro un tipo complesso. Converte ricorsivamente gli elementi di tipo complesso, e gli altri secondo le regole dei tipi primitivi.

Ad esempio, se l'argomento di un modulo richiede un valore di tipo `list(string)` e l'utente fornisce la tuple `["a", 15, true]`, Terraform trasforma internamente il valore in `["a", "15", "true"]`, convertendo gli elementi nel tipo stringa richiesto. Se poi il modulo usa quegli elementi per impostare argomenti di risorse che richiedono rispettivamente una stringa, un numero e un booleano, Terraform riconverte automaticamente la seconda e la terza stringa nei tipi richiesti. Lo può fare perché contengono rappresentazioni valide di un numero e di un booleano.

La conversione automatica invece fallisce se il valore fornito, o uno dei suoi elementi, è incompatibile con il tipo richiesto. Se un argomento richiede il tipo `map(string)` e l'utente fornisce l'oggetto `{name = ["Kristy", "Claudia", "Mary Anne", "Stacey"], age = 12}`, Terraform segnala un errore di tipo, perché una tuple non si può convertire in stringa.

### 4.21.5 — Tipi dinamici: il vincolo any

> **Attenzione**: `any` è molto raramente il vincolo di tipo corretto. Non va usato solo per evitare di specificare un vincolo di tipo: va sempre scritto un vincolo esatto, a meno di gestire davvero dati dinamici.
_(infoBox)_

La parola chiave `any` è un costrutto speciale che fa da segnaposto per un tipo ancora da decidere. `any` non è un tipo. Quando confronta un valore con un vincolo che contiene `any`, Terraform cerca un unico tipo reale che, al posto di `any`, produca un risultato valido.

L'unico caso in cui è appropriato usare `any` è quando si passa il valore direttamente a un altro sistema, senza accedere al suo contenuto. Ad esempio, va bene una variabile di tipo `any` se la si usa solo con `jsonencode`, per passare l'intero valore a una risorsa:

```
variable "settings" {
  type = any
}

resource "aws_s3_object" "example" {
  # ...

  # This is a reasonable use of "any" because this module
  # just writes any given data to S3 as JSON, without
  # inspecting it further or applying any constraints
  # to its type or value.
  content = jsonencode(var.settings)
}
```

Se una parte del modulo accede a elementi o attributi del valore, si aspetta una stringa o un numero, o lo tratta in qualsiasi modo non opaco, usare `any` è sbagliato: bisogna scrivere il tipo esatto che il modulo si aspetta.

**any con i tipi collezione** _(stepTitle)_

Tutti gli elementi di una collezione devono avere lo stesso tipo. Se si usa `any` come segnaposto per il tipo degli elementi, Terraform cerca quindi un unico tipo esatto degli elementi per la collezione risultante. Ad esempio, con il vincolo `list(any)`, Terraform esamina il valore fornito e cerca un sostituto di `any` che renda valido il risultato. Se il valore è `["a", "b", "c"]`, il cui tipo fisico è `tuple([string, string, string])`, Terraform ragiona così:

- tuple e liste sono simili, quindi si applica la regola di conversione da tuple a lista;
- tutti gli elementi della tuple sono stringhe, quindi il vincolo `string` è valido per tutti gli elementi della lista;
- quindi `any` viene sostituito con `string`, e il tipo concreto finale è `list(string)`.

Se gli elementi della tuple non sono tutti dello stesso tipo, Terraform cerca un unico tipo in cui si possano convertire tutti, secondo le regole di conversione viste sopra:

- con il valore `["a", 1, "b"]`, Terraform seleziona comunque `list(string)`, per le regole di conversione dei tipi primitivi, e il valore risultante è `["a", "1", "b"]`;
- con il valore `["a", [], "b"]`, il valore non può rispettare il vincolo, perché non esiste un unico tipo in cui si possano convertire sia una stringa sia una tuple vuota. Terraform rifiuta il valore, con un errore che indica che tutti gli elementi devono avere lo stesso tipo.

Gli esempi usano `list(any)`, ma lo stesso principio vale per `map(any)` e `set(any)`.

### 4.21.6 — Attributi facoltativi degli oggetti

Di solito Terraform restituisce un errore quando non riceve un valore per gli attributi di un oggetto indicati nel tipo. Se però un attributo è marcato come facoltativo, Terraform inserisce un valore di default al posto dell'attributo mancante. Così il modulo che riceve il valore può definire un comportamento di ripiego adeguato. Per marcare un attributo come facoltativo si usa il modificatore `optional` nel vincolo di tipo object. L'esempio crea un attributo facoltativo `b` e un attributo facoltativo `c` con valore di default:

```
variable "with_optional_attribute" {
  type = object({
    a = string                # a required attribute
    b = optional(string)      # an optional attribute
    c = optional(number, 127) # an optional attribute with default value
  })
}
```

Il modificatore `optional` prende uno o due argomenti:

- il tipo (obbligatorio): il primo argomento specifica il tipo dell'attributo;
- il default (facoltativo): il secondo argomento definisce il valore da usare se l'attributo manca. Deve essere compatibile con il tipo dell'attributo. Se non è specificato, Terraform usa come default un valore null del tipo appropriato.

Un attributo facoltativo con un default non null è garantito non essere mai null nel modulo che lo riceve. Terraform sostituisce il default sia quando il chiamante omette del tutto l'attributo, sia quando lo imposta esplicitamente a null. Così non servono controlli aggiuntivi per gestire un possibile valore null.

Nei tipi di variabile annidati Terraform applica i default degli attributi dall'alto verso il basso. Prima applica il default indicato nel modificatore `optional`, poi gli eventuali default annidati di quell'attributo.

**Esempio: strutture annidate con attributi facoltativi e default** _(stepTitle)_

L'esempio definisce una variabile per dei bucket di storage che ospitano un sito web. Il tipo della variabile usa diversi attributi facoltativi, tra cui `website`, che è a sua volta un tipo object facoltativo, con attributi facoltativi e default:

```
variable "buckets" {
  type = list(object({
    name    = string
    enabled = optional(bool, true)
    website = optional(object({
      index_document = optional(string, "index.html")
      error_document = optional(string, "error.html")
      routing_rules  = optional(string)
    }), {})
  }))
}
```

Un file `terraform.tfvars` di esempio specifica tre configurazioni di bucket per `var.buckets`:

- `production` imposta le regole di routing per aggiungere un redirect;
- `archived` usa la configurazione di default, ma è disabilitato;
- `docs` sostituisce i documenti index ed error con file di testo.

```
buckets = [
  {
    name = "production"
    website = {
      routing_rules = <<-EOT
      [
        {
          "Condition" = { "KeyPrefixEquals": "img/" },
          "Redirect"  = { "ReplaceKeyPrefixWith": "images/" }
        }
      ]
      EOT
    }
  },
  {
    name = "archived"
    enabled = false
  },
  {
    name = "docs"
    website = {
      index_document = "index.txt"
      error_document = "error.txt"
    }
  },
]
```

Il bucket `production` non specifica i documenti index ed error, e il bucket `archived` omette del tutto la configurazione del sito. Terraform usa quindi i default indicati nel vincolo di tipo di `buckets`, e produce questi valori:

- per i bucket `production` e `docs`, Terraform imposta `enabled` a `true`. Fornisce anche i default di `website`, poi i valori specificati in `docs` sostituiscono quei default;
- per i bucket `archived` e `docs`, Terraform imposta `routing_rules` a null. Quando non riceve un attributo facoltativo senza default, Terraform lo valorizza con null;
- per il bucket `archived`, Terraform valorizza l'attributo `website` con i default indicati nel vincolo di tipo.

**Esempio: impostare in modo condizionale un attributo facoltativo** _(stepTitle)_

A volte la decisione se impostare o no un argomento facoltativo va presa in modo dinamico, in base ad altri dati. In quel caso il blocco `module` chiamante può usare un'espressione condizionale con `null` come uno dei due risultati, per lasciare l'argomento non impostato. Con la variabile `buckets` della sezione precedente, l'esempio sostituisce in modo condizionale le impostazioni `index_document` ed `error_document` dell'oggetto `website`, in base a una nuova variabile `var.legacy_filenames`:

```
variable "legacy_filenames" {
  type     = bool
  default  = false
  nullable = false
}

module "buckets" {
  source = "./modules/buckets"

  buckets = [
    {
      name = "maybe_legacy"
      website = {
        error_document = var.legacy_filenames ? "ERROR.HTM" : null
        index_document = var.legacy_filenames ? "INDEX.HTM" : null
      }
    },
  ]
}
```

Quando `var.legacy_filenames` è `true`, la chiamata sostituisce i nomi dei documenti. Quando è `false`, li lascia non specificati, e il modulo usa i propri default.

- Fonte: [Type constraints](https://developer.hashicorp.com/terraform/language/v1.12.x/expressions/type-constraints)

---

## 4.22 — Gestire il lifecycle delle risorse

Gli argomenti lifecycle aiutano a controllare il flusso delle operazioni di Terraform, con regole personalizzate per la creazione e la distruzione delle risorse. Invece di lasciare che Terraform gestisca le operazioni solo in base al grafo delle dipendenze integrato, gli argomenti lifecycle aiutano a ridurre i possibili disservizi in base alle esigenze delle risorse. Proteggono anche risorse specifiche, perché non cambino e non abbiano impatto sull'infrastruttura.

### 4.22.1 — La configurazione di esempio

La configurazione di esempio crea un'istanza EC2 e un security group che permette l'accesso all'istanza sulla porta TCP 8080. Nel file `terraform.tfvars` si imposta la region corrispondente alla configurazione della AWS CLI. Le due risorse principali sono in `main.tf`:

```
resource "aws_instance" "example" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sg_web.id]
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

resource "aws_security_group" "sg_web" {
  name = "sg_web"
  ingress {
    from_port   = "8080"
    to_port     = "8080"
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ## ...
}
```

Dopo `terraform init` e `terraform apply`, il comando `terraform state list` mostra le risorse gestite da Terraform nel file di state.

### 4.22.2 — Impedire l'eliminazione di una risorsa

Per impedire a Terraform di distruggere risorse specifiche si aggiunge l'argomento `prevent_destroy` alla definizione della risorsa. Serve a proteggere le risorse critiche che Terraform potrebbe distruggere per errore mentre elabora la configurazione. Attivare `prevent_destroy` però non impedisce a Terraform di distruggere la risorsa se se ne commenta o rimuove la configurazione. Si aggiunge `prevent_destroy` all'istanza EC2:

```
resource "aws_instance" "example" {
  ## ...
  tags = {
    Name          = "terraform-learn-state-ec2"
    drift_example = "v1"
  }

  lifecycle {
    prevent_destroy = true
  }
}
```

Eseguendo `terraform destroy` si osserva il comportamento: Terraform rifiuta il piano di distruzione. L'attributo `prevent_destroy` è utile quando la modifica di un attributo forzerebbe una sostituzione e causerebbe un disservizio.

### 4.22.3 — Creare le risorse prima di distruggerle

Per le modifiche che possono causare disservizi ma vanno fatte comunque, l'attributo `create_before_destroy` crea la nuova risorsa prima di distruggere quella vecchia. Nel tutorial si cambia la regola del security group perché permetta l'accesso sulla porta 80 invece della 8080 (`from_port` e `to_port` a `"80"`). Poi si aggiorna l'istanza EC2: si aggiunge l'attributo `create_before_destroy` al posto di `prevent_destroy`, e si toglie dallo script la riga che sposta Apache sulla porta 8080, così la macchina risponde sulla porta 80:

```
resource "aws_instance" "example" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.sg_web.id]
  user_data              = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y apache2
              echo "Hello World" > /var/www/html/index.html
              systemctl restart apache2
              EOF
  tags = {
    Name          = "terraform-learn-state-ec2"
    Drift_example = "v1"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

Con `terraform apply` si osservano le modifiche che forzano una sostituzione. Senza `create_before_destroy`, Terraform distruggerebbe l'istanza prima di ricrearla, con un possibile disservizio.

### 4.22.4 — Ignorare le modifiche

Per le modifiche fatte al di fuori del workflow Terraform, che non devono influire sulle operazioni di Terraform, si usa l'argomento `ignore_changes`. Nel tutorial si cambia il tag `drift_example` con la AWS CLI:

```
$ aws ec2 create-tags --resources $(terraform output -raw instance_id) --tags Key=drift_example,Value=v2
```

Poi si aggiunge l'attributo `ignore_changes` al blocco `lifecycle` dell'istanza EC2:

```
resource "aws_instance" "example" {
  ##...
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [tags]
  }
}
```

Al successivo `terraform apply`, Terraform aggiorna il file di state con il valore `v2` invece di sovrascrivere il tag con il valore `v1` scritto nella configurazione. Con `terraform state show aws_instance.example` si verifica nel file di state che il tag `drift_example` vale `v2`.

- Fonte: [Manage resource lifecycle](https://developer.hashicorp.com/terraform/tutorials/state/resource-lifecycle)

---

## 4.23 — Il meta-argomento lifecycle

Quando si applica una configurazione, Terraform esegue queste operazioni:

- crea le risorse definite nella configurazione che nello state non sono associate a un oggetto reale dell'infrastruttura;
- distrugge le risorse che esistono nello state ma non nella configurazione;
- aggiorna sul posto le risorse i cui argomenti sono cambiati;
- distrugge e ricrea le risorse i cui argomenti sono cambiati, se i limiti delle API remote impediscono a Terraform di aggiornarle sul posto.

Il blocco `lifecycle` accetta regole che personalizzano il modo in cui Terraform esegue queste fasi del ciclo di vita per ogni risorsa.

### 4.23.1 — Uso

Tutte le impostazioni di `lifecycle` influiscono su come Terraform costruisce e attraversa il grafo delle dipendenze. Per questo si possono usare solo valori letterali: l'elaborazione avviene troppo presto per valutare espressioni arbitrarie. Il supporto delle singole regole varia tra i blocchi di configurazione di Terraform, e a seconda del blocco si possono usare una o più delle regole seguenti.

**create_before_destroy** _(stepTitle)_

Per default, quando deve cambiare un argomento che i limiti delle API remote non permettono di aggiornare sul posto, Terraform distrugge l'oggetto esistente. Poi crea un nuovo oggetto sostitutivo con i nuovi argomenti. Con la regola `create_before_destroy` Terraform crea invece la risorsa sostitutiva prima di distruggere quella attuale.

È un comportamento da attivare esplicitamente. Molti tipi di oggetti remoti hanno requisiti di unicità del nome, o altri vincoli che vanno rispettati perché l'oggetto nuovo e quello vecchio possano esistere contemporaneamente. Alcuni tipi di risorsa, ad esempio, offrono opzioni speciali per aggiungere un suffisso casuale al nome di ogni oggetto ed evitare collisioni. La CLI di Terraform non può attivare automaticamente queste funzionalità, quindi bisogna conoscere i vincoli di ogni tipo di risorsa prima di usarci `create_before_destroy`.

Terraform propaga e applica il comportamento `create_before_destroy` a tutte le dipendenze della risorsa. Ad esempio, `create_before_destroy` è attivo sulla risorsa A ma non sulla risorsa B, e la risorsa A dipende dalla risorsa B. In questo caso Terraform attiva implicitamente `create_before_destroy` anche per la risorsa B, e lo salva nel file di state. Di conseguenza non si può forzare `create_before_destroy` a `false` sulla risorsa B, perché creerebbe cicli di dipendenze nel grafo.

Se la risorsa contiene un provisioner che viene eseguito durante la distruzione, impostare `create_before_destroy` a `true` impedisce anche l'esecuzione del provisioner. La regola si usa nei blocchi `resource`.

**prevent_destroy** _(stepTitle)_

Con `prevent_destroy = true`, Terraform rifiuta i piani che distruggerebbero l'oggetto dell'infrastruttura associato alla risorsa, e restituisce un errore. L'argomento deve essere presente nella configurazione. La regola non impedisce a Terraform di distruggere una risorsa se se ne rimuove la configurazione. Per rimuovere una risorsa dallo state senza distruggere quella reale si veda la sezione 6.9.

Questa regola protegge dalla sostituzione accidentale di oggetti costosi da ricreare, come le istanze di database. Attivare `prevent_destroy` però rende impossibile applicare alcune modifiche alla configurazione. Impedisce inoltre al comando `terraform destroy` di funzionare, una volta creati quegli oggetti. Va quindi usata con parsimonia. La regola si usa nei blocchi `resource`.

**ignore_changes** _(stepTitle)_

Per default Terraform rileva qualsiasi differenza nelle impostazioni attuali di un oggetto reale dell'infrastruttura, e pianifica di aggiornare l'oggetto remoto perché corrisponda alla configurazione. L'argomento `ignore_changes` si usa quando una risorsa viene creata con riferimenti a dati che possono cambiare in futuro, ma che non devono influire sulla risorsa dopo la sua creazione.

In rari casi, le impostazioni di un oggetto remoto vengono modificate da processi esterni a Terraform, e Terraform cerca di correggerle all'esecuzione successiva. Per dividere la gestione di un singolo oggetto con un processo separato, il meta-argomento `ignore_changes` specifica quali attributi della risorsa Terraform deve ignorare quando pianifica gli aggiornamenti dell'oggetto remoto.

Terraform considera gli argomenti corrispondenti agli attributi indicati quando pianifica una creazione, ma li ignora quando pianifica un aggiornamento. Gli argomenti sono indirizzi relativi degli attributi nella risorsa. Agli elementi delle map e delle liste si fa riferimento con la notazione degli indici, come `tags["Name"]` e `list[0]`. Nell'esempio, Terraform ignora le modifiche ai tag, così un agente di gestione può aggiornarli in base a un insieme di regole gestito altrove:

```
resource "aws_instance" "example" {
   # ...
   lifecycle {
      ignore_changes = [
         tags
      ]
   }
}
```

Al posto di una lista di elementi si può usare la parola chiave `all`, con cui Terraform ignora tutti gli attributi. Così Terraform può creare e distruggere l'oggetto remoto, ma non ne propone mai aggiornamenti. Terraform ignora solo gli attributi definiti dal tipo di risorsa: `ignore_changes` non si può applicare a se stesso né ad altri meta-argomenti. La regola si usa nei blocchi `resource`.

**replace_triggered_by** _(stepTitle)_

Terraform sostituisce la risorsa quando cambia una qualsiasi delle risorse o degli attributi referenziati. Si fornisce una lista di espressioni che fanno riferimento a managed resource, a istanze o ad attributi di istanze. In una risorsa che usa `count` o `for_each`, nell'espressione si possono usare `count.index` o `each.key`, per fare riferimento a istanze specifiche di altre risorse configurate con lo stesso count o la stessa collezione. I riferimenti provocano la sostituzione in queste condizioni:

- se il riferimento è a una risorsa con più istanze, un piano che aggiorna o sostituisce una qualsiasi delle istanze provoca la sostituzione;
- se il riferimento è a una singola istanza di risorsa, un piano che aggiorna o sostituisce quell'istanza provoca la sostituzione;
- se il riferimento è a un singolo attributo di un'istanza, qualsiasi modifica al valore dell'attributo provoca la sostituzione.

Nelle espressioni di `replace_triggered_by` si possono usare solo managed resource. Così si possono modificare queste espressioni senza forzare una sostituzione. Nell'esempio, Terraform sostituisce `aws_appautoscaling_target` ogni volta che viene sostituita questa istanza di `aws_ecs_service`:

```
resource "aws_appautoscaling_target" "ecs_target" {
   # ...
   lifecycle {
      replace_triggered_by = [
         aws_ecs_service.svc.id
      ]
   }
}
```

`replace_triggered_by` accetta solo indirizzi di risorse, perché la decisione si basa sulle azioni pianificate per le risorse indicate. I valori semplici, come i local value o le input variable, non hanno azioni pianificate proprie. Si possono però trattare con un ciclo di vita simile a quello di una risorsa usandoli con la risorsa `terraform_data`. La regola si usa nei blocchi `resource`.

**precondition** _(stepTitle)_

Specifica una condizione che Terraform valuta prima di creare la risorsa. Il blocco `precondition` richiede due argomenti:

| **Argomento** | **Descrizione** | **Tipo di dato** |
|---|---|---|
| `condition` | Espressione che deve restituire true perché Terraform prosegua con l'operazione. Può fare riferimento a qualsiasi altro oggetto dello stesso ambito della configurazione, purché il riferimento non crei una dipendenza ciclica | Espressione con riferimenti, stringhe e operatori |
| `error_message` | Messaggio che Terraform stampa nella console se la condizione restituisce false | Stringa |

Terraform valuta i blocchi `precondition` prima degli argomenti di configurazione della risorsa, quindi la precondition può avere la precedenza sugli errori di valutazione degli argomenti. Li valuta invece dopo i meta-argomenti `count` e `for_each`. Può quindi valutare la precondition separatamente per ogni istanza, e nelle condizioni sono disponibili gli oggetti `each.key` e `count.index`.

Nella stessa risorsa si possono avere sia un blocco `precondition` sia un blocco `postcondition`. Non si devono invece aggiungere precondition sia a un blocco `resource` sia a un blocco `data` che rappresentano lo stesso oggetto nella stessa configurazione. Terraform potrebbe infatti ignorare le modifiche al blocco `data` dovute alle modifiche del blocco `resource`. La regola si usa nei blocchi `data`, `ephemeral` e `resource` (sezione 4.24).

**postcondition** _(stepTitle)_

Specifica una condizione che Terraform valuta dopo aver creato la risorsa. Il blocco `postcondition` richiede gli stessi due argomenti, `condition` ed `error_message`. Qui la condizione deve restituire true perché Terraform operi sulle risorse a valle.

Terraform valuta i blocchi `postcondition` dopo aver pianificato e applicato le modifiche. Un fallimento della postcondition impedisce le modifiche alle altre risorse che dipendono dalla risorsa che fallisce. Valgono le stesse avvertenze della precondition sull'uso combinato con un blocco `data` che rappresenta lo stesso oggetto. La regola si usa nei blocchi `data`, `ephemeral` e `resource`.

**destroy** _(stepTitle)_

Impostata a `false`, rimuove una risorsa dallo state senza distruggere la risorsa reale dell'infrastruttura. Questa regola si può usare solo nel blocco `removed` (sezione 6.8).

### 4.23.2 — Casi d'uso

Gli esempi per ignorare le modifiche agli attributi (`ignore_changes = [tags]`) e per sostituire le risorse su trigger (`replace_triggered_by`) sono gli stessi della sezione 4.3.7.

**Validare l'AMI per creare le istanze** _(stepTitle)_

Il blocco `precondition` verifica che l'AMI recuperata dal blocco `data` abbia `x86_64` come attributo `architecture`. Il blocco `postcondition` richiede che all'istanza EC2 venga assegnato un hostname DNS pubblico. Se una delle due condizioni non è soddisfatta, Terraform restituisce l'`error_message` della condizione fallita:

```
data "aws_ami" "example" {
  most_recent = true
  owners = ["amazon"]
  filter {
    name   = "image-id"
    values = ["ami-*"]
  }
}

resource "aws_instance" "example" {
  instance_type = "t3.micro"
  ami           = data.aws_ami.example.id

  lifecycle {
    precondition {
      condition     = data.aws_ami.example.architecture == "x86_64"
      error_message = "The selected AMI must be for the x86_64 architecture."
    }

    postcondition {
      condition     = self.public_dns != ""
      error_message = "EC2 instance must be in a VPC that has public DNS hostnames enabled."
    }
  }
}
```

**Validare che il volume root sia cifrato** _(stepTitle)_

Il blocco `data` recupera il volume di storage root collegato all'istanza EC2 `aws_instance.example`, tramite l'attributo `volume_id`. Quando un data source verifica il risultato di una managed resource dichiarata nella stessa configurazione, il controllo va messo in un blocco `postcondition`. Così Terraform attende che le modifiche alla managed resource siano completate prima di leggere il data source:

```
data "aws_ebs_volume" "example" {
  filter {
    name = "volume-id"
    values = [aws_instance.example.root_block_device[0].volume_id]
  }
  lifecycle {
    # The EC2 instance will have an encrypted root volume.
    postcondition {
      condition     = self.encrypted
      error_message = "The server's root volume is not encrypted."
    }
  }
}
```

In questo esempio la validazione fallisce, e Terraform stampa nella console questo messaggio:

```
│ Error: Resource postcondition failed
│
│   on main.tf line 31, in data "aws_ebs_volume" "example":
│   31:       condition     = self.encrypted
│     ├────────────────
│     │ self.encrypted is false
│
│ The server's root volume is not encrypted.
```

**Validare le ephemeral resource** _(stepTitle)_

L'ephemeral resource `aws_ssm_parameter` ha una precondition e una postcondition. La precondition verifica che la modalità di compliance sia attiva, per proteggere i segreti di produzione. La postcondition verifica che la password generata rispetti i requisiti di sicurezza:

```
variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "compliance_mode" {
  description = "Enable compliance requirements for production"
  type        = bool
  default     = false
}

ephemeral "aws_ssm_parameter" "database_password" {
  name = "/secrets/${var.environment}/database/password"

  lifecycle {
    precondition {
      condition     = var.environment != "prod" || var.compliance_mode == true
      error_message = "Enable compliance mode to assess production secrets."
    }

    postcondition {
      condition     = can(regex("^[A-Za-z0-9!@#$%^&*()_+=-]{16,}$", self.value))
      error_message = "Password from external source must meet security requirements."
    }
  }
}
```

- Fonte: [lifecycle reference](https://developer.hashicorp.com/terraform/language/v1.12.x/meta-arguments/lifecycle)

---

## 4.24 — Validare la configurazione

La validazione della configurazione rende più facile la risoluzione dei problemi per chi usa il modulo, rende i run più prevedibili e aiuta i maintainer a capire l'intento della configurazione.

### 4.24.1 — Introduzione

La validazione aiuta a verificare che la configurazione Terraform funzioni come previsto. Con i diversi tipi di validazione si può:

- verificare che le input variable soddisfino requisiti specifici;
- impedire che output errati vengano scritti nello state;
- assicurarsi che risorse e data source siano configurati correttamente dopo che Terraform li ha applicati;
- verificare il comportamento più ampio dell'infrastruttura;
- documentare le ipotesi sull'infrastruttura;
- usare HCP Terraform per verificare regolarmente l'infrastruttura.

Quando una validazione fallisce, Terraform fornisce un contesto da usare nei messaggi d'errore, per aiutare gli utenti a capire e risolvere il problema. Terraform valuta i diversi tipi di validazione in fasi diverse del ciclo di esecuzione. Alcuni bloccano l'esecuzione delle operazioni successive, altri la lasciano proseguire con dei warning. Per gli autori, aggiungere validazioni alla configurazione impone gli standard e i requisiti del modulo, e aiuta chi lo usa a capirlo e usarlo.

I requisiti di versione sono questi:

- Terraform v0.13.0 o successivo per la validazione delle input variable;
- Terraform v1.2.0 o successivo per precondition e postcondition;
- Terraform v1.5.0 o successivo per i blocchi `check`.

### 4.24.2 — Scegliere la validazione adatta

Terraform offre diversi modi di validare la configurazione:

- le **validazioni delle input variable** verificano i parametri della configurazione quando Terraform crea un piano;
- le **precondition** verificano che singole risorse, data source e output soddisfino i requisiti, prima che Terraform cerchi di crearli;
- le **postcondition** verificano che Terraform abbia prodotto risorse e data source con le impostazioni attese e desiderate;
- i **check** validano che le risorse funzionino come previsto, senza bloccare le operazioni di Terraform in base al risultato.

La validazione è flessibile, e spesso si può ottenere lo stesso risultato con tipi di validazione diversi. Per sceglierne uno conviene valutare due cose: se la validazione deve bloccare le operazioni, e in quale fase del workflow di Terraform deve essere eseguita.

**Validazione delle input variable** _(stepTitle)_

La validazione delle input variable serve a:

- verificare che le input variable rispettino requisiti di formato specifici;
- verificare che i valori di input rientrino in intervalli accettabili;
- impedire le operazioni di Terraform se una variabile è configurata male.

Ad esempio, si può verificare che il valore di una variabile abbia la sintassi di un ID di AMI valido:

```
variable "image_id" {
  type        = string
  description = "The id of the machine image (AMI) to use for the server."

  validation {
    condition     = length(var.image_id) > 4 && substr(var.image_id, 0, 4) == "ami-"
    error_message = "The image_id value must be a valid AMI id, starting with \"ami-\"."
  }
}
```

Se si assegna a `image_id` una stringa che non ha la sintassi di un ID di AMI, la condizione vale false. Quando una validazione di variabile fallisce, Terraform dà errore, mostra l'`error_message` configurato e blocca l'operazione. Spesso anche le API dei provider danno errore sugli stessi controlli. La validazione però evita l'errore agli utenti e mostra un messaggio d'errore utile. Queste validazioni servono anche a imporre le scelte di design dell'organizzazione, come le convenzioni di naming (sezione 4.14).

**Precondition** _(stepTitle)_

I blocchi `precondition` verificano le ipotesi della configurazione su risorse, data source e output prima che Terraform li crei. I blocchi `postcondition` validano invece le garanzie che risorse e data source devono offrire perché la configurazione funzioni.

Terraform valuta le precondition di risorse, data source e output quando crea un piano. Le precondition hanno la precedenza sugli eventuali errori sugli argomenti segnalati dai provider per risorse, data source e output configurati male. L'esempio usa una precondition per verificare che l'AMI configurata per un `aws_instance` usi l'architettura CPU `x86_64`:

```
resource "aws_instance" "example" {
  instance_type = "t3.micro"
  ami           = data.aws_ami.example.id

  lifecycle {
    # The AMI ID must refer to an AMI that contains an operating system
    # for the `x86_64` architecture.
    precondition {
      condition     = data.aws_ami.example.architecture == "x86_64"
      error_message = "The selected AMI must be for the x86_64 architecture."
    }
  }
}
```

La precondition rileva se il chiamante ha scelto per errore un'AMI di un'altra architettura, che potrebbe non eseguire il software ospitato dall'istanza. Terraform valuta la precondition mentre costruisce il piano. Se la precondition fallisce, genera un errore con l'argomento `error_message` e interrompe l'operazione in corso.

Anche un blocco `output` può includere una precondition, per verificare l'output di un modulo. Le precondition sugli output verificano che i valori di output soddisfino i requisiti prima che Terraform li esponga o li salvi nello state. Ad esempio, una precondition può garantire che il security group di un server abbia almeno una regola in ingresso che consenta il traffico sulle porte 80 o 443:

```
output "instance_public_ip" {
  value = aws_instance.web.public_ip

  precondition {
    condition     = length([for rule in aws_security_group.web.ingress : rule if rule.to_port == 80 || rule.to_port == 443]) > 0
    error_message = "Security group must allow HTTP (port 80) or HTTPS (port 443) traffic."
  }
}
```

Se la precondition fallisce, Terraform genera un errore con `error_message` e interrompe l'operazione in corso (sezione 4.17).

**Postcondition** _(stepTitle)_

Terraform valuta i blocchi `postcondition` dopo aver pianificato e applicato le modifiche a una risorsa, oppure dopo aver letto un data source. Ad esempio, una postcondition può rilevare se un utente ha fornito per errore un'AMI destinata a un altro componente del sistema:

```
data "aws_ami" "example" {
  id = var.aws_ami_id

  lifecycle {
    # The AMI ID must refer to an existing AMI that has the tag "nomad-server".
    postcondition {
      condition     = self.tags["Component"] == "nomad-server"
      error_message = "tags[\"Component\"] must be \"nomad-server\"."
    }
  }
}
```

Se il componente non ha il tag `"nomad-server"`, la postcondition fallisce e impedisce di usare l'AMI sbagliata per creare un server. Terraform genera un errore con `error_message` e interrompe l'operazione in corso. Le postcondition possono anche evitare modifiche a cascata sulle altre risorse dipendenti.

Le postcondition fanno da protezioni statiche, per imporre gli aspetti obbligatori della configurazione dei blocchi `data` e `resource`. Per verificare l'infrastruttura in modo dinamico rispetto a condizioni esterne o che cambiano, è consigliato usare i blocchi `check`. I check vengono eseguiti come ultimo passo di un'operazione di Terraform, dopo le postcondition.

**Precondition o postcondition?** _(stepTitle)_

Spesso si può implementare la stessa verifica con tipi di validazione diversi. Ad esempio, si può mettere una postcondition sulla risorsa che produce un dato, oppure una precondition sulla risorsa o sull'output che usa quello stesso dato. Per scegliere bisogna capire se la regola rappresenta un'ipotesi sulla configurazione o una garanzia sulla risorsa risultante, e quando deve essere eseguita.

Le precondition servono per le ipotesi da verificare prima che Terraform crei il blocco di destinazione. Ad esempio, si può verificare che l'AMI scelta per un `aws_instance` abbia architettura `x86_64` prima di cercare di creare l'istanza. Usare le precondition per le ipotesi aiuta i futuri maintainer a capire quali valori una risorsa, un output o un data source devono accettare.

Le postcondition servono per le garanzie da verificare dopo che Terraform ha creato la risorsa o letto il data source. Ad esempio, si può verificare che un `aws_instance` venga avviato in una rete che gli assegna un record DNS privato. Usare le postcondition per le garanzie aiuta i futuri maintainer a capire quali comportamenti devono preservare quando modificano la configurazione.

Per scegliere tra precondition e postcondition aiutano queste considerazioni:

- conviene chiedersi quale blocco riporterebbe i messaggi d'errore in modo più chiaro. Ad esempio, se una risorsa ha molte dipendenze, può essere più pratico dichiarare una sola postcondition sulla risorsa invece di precondition su ogni dipendenza;
- conviene valutare se dichiarare la stessa condizione sia come precondition sia come postcondition. Se la postcondition sta in un modulo diverso dalla precondition, averle entrambe può essere utile: ogni modulo verifica l'altro, mentre i due evolvono in modo indipendente.

**Check** _(stepTitle)_

Il blocco `check` valida l'infrastruttura al di fuori del normale ciclo di vita delle risorse. Viene eseguito come ultimo passo di un'operazione di plan o di apply, dopo che Terraform ha pianificato o creato l'infrastruttura. Quando un'asserzione di un blocco `check` fallisce, Terraform segnala un warning e continua l'operazione in corso. I blocchi `check` servono a:

- validare risorse, data source, variabili o output della configurazione;
- validare il comportamento dell'infrastruttura nel suo insieme;
- verificare la configurazione dell'infrastruttura senza bloccare le operazioni;
- eseguire la validazione continua in HCP Terraform.

L'esempio usa un blocco `check` per verificare che il sito web di Terraform sia funzionante:

```
check "health_check" {
  data "http" "terraform_io" {
    url = "https://www.terraform.io"
  }

  assert {
    condition = data.http.terraform_io.status_code == 200
    error_message = "${data.http.terraform_io.url} returned an unhealthy status code"
  }
}
```

Se l'endpoint del sito restituisce il codice di stato 200, il sito è funzionante e il check passa. A differenza degli altri modi di validare la configurazione, i blocchi `check` non bloccano le operazioni. Se l'asserzione vale false, Terraform genera un warning con il risultato dell'espressione `error_message` e continua l'operazione.

### 4.24.3 — La validazione continua in HCP Terraform

Se si attivano gli health check su un workspace, HCP Terraform valida continuamente i blocchi `check`, le precondition e le postcondition della configurazione del workspace, per verificare regolarmente l'infrastruttura. Ad esempio, un blocco `check` può monitorare in continuo la validità del certificato di un API gateway. La validazione continua avvisa quando la condizione fallisce. Così si può aggiornare il certificato ed evitare errori al successivo aggiornamento dell'infrastruttura (Modulo 8).

### 4.24.4 — L'ordine della validazione

Terraform valida i diversi aspetti della configurazione il prima possibile. In generale, esegue le valutazioni in quest'ordine:

1. le validazioni delle input variable, subito, prima di generare il piano;
2. le precondition, dopo aver generato il piano ma prima di creare la risorsa, il data source o l'output;
3. le postcondition, dopo aver pianificato e applicato le modifiche;
4. i check, alla fine delle operazioni di plan e apply, e ogni volta che su un workspace di HCP Terraform vengono eseguiti gli health assessment.

![Figura 12](img/validation-order-of-operations-dark.jpg) _(dimensioni: 1312×738 px)_

*Figura 12 — L'ordine in cui Terraform esegue le validazioni: validation delle variabili, precondition, postcondition e check. Fonte: HashiCorp Developer.* _(caption)_

L'ordine preciso in cui Terraform esegue check, precondition e postcondition può dipendere da quando conosce il valore di una condizione, prima o dopo l'apply della configurazione. Se il valore è disponibile prima dell'apply, Terraform esegue la validazione durante il plan. Ad esempio, se durante il plan Terraform conosce l'ID dell'immagine di una risorsa, può eseguire tutte le validazioni che si basano su quell'ID.

Se Terraform conosce il valore solo dopo l'apply, rimanda quella validazione alla fase di apply. Ad esempio, AWS assegna l'ID del volume root quando avvia un'istanza EC2, quindi Terraform non può usare l'ID del volume root finché l'apply non è completato.

Durante l'apply, una precondition fallita impedisce a Terraform di eseguire le azioni pianificate per la risorsa, il data source o l'output associati. Una postcondition fallita interrompe l'elaborazione e blocca le azioni a valle che dipendono dalla risorsa o dal data source, ma non annulla le azioni già eseguite.

### 4.24.5 — I messaggi d'errore

Le validazioni delle input variable, le precondition, le postcondition e i check devono tutti includere l'argomento `error_message`. Contiene il testo che Terraform inserisce nei messaggi d'errore quando trova una condizione non soddisfatta:

```
Error: Resource postcondition failed

  with data.aws_ami.example,
  on ec2.tf line 19, in data "aws_ami" "example":
  72:       condition     = self.tags["Component"] == "nomad-server"
    |----------------
    | self.tags["Component"] is "consul-server"

The selected AMI must be tagged with the Component value "nomad-server".
```

L'argomento `error_message` accetta qualsiasi espressione che restituisca una stringa: stringhe letterali, heredoc ed espressioni template. Con la funzione `format` si possono convertire in una stringa formattata elementi di tipo null, list o map. I messaggi su più righe sono supportati, e Terraform non manda a capo le righe che iniziano con spazi.

È consigliato scrivere i messaggi d'errore come una o più frasi complete, in uno stile simile a quello dei messaggi d'errore di Terraform. Terraform mostra il messaggio accanto al nome della risorsa che ha rilevato il problema e agli eventuali valori esterni inclusi nell'espressione della condizione. Le condizioni che si possono usare nelle validazioni sono descritte nella pagina *Conditional Expressions*.

- Fonte: [Validate your configuration](https://developer.hashicorp.com/terraform/language/v1.12.x/validate)

---

## 4.25 — Validare i moduli con le custom condition

Terraform permette di definire custom condition nella configurazione dei moduli, per validare risorse, data source e output. Quando pianifica e applica le modifiche all'infrastruttura, Terraform valuta questi blocchi di condizione e segnala un errore se una condizione fallisce. Terraform supporta le precondition, che valuta prima di creare il blocco che le contiene, e le postcondition, che valuta dopo.

Nel tutorial si creano le risorse con un modulo locale che rappresenta il deployment di un'applicazione, con un load balancer e istanze EC2. Il modulo include già la validazione delle variabili, ma gli utenti possono comunque configurare male l'applicazione. Si aggiungono quindi al modulo dei blocchi di condizione, perché gli utenti configurino correttamente la VPC e le istanze EC2.

### 4.25.1 — La configurazione di esempio

La configurazione di esempio definisce una VPC che ospita l'applicazione, sceglie un'AMI AWS con un data source, e usa un modulo locale per distribuire nella VPC istanze EC2 e un load balancer. Il blocco `module.app` in `main.tf` configura il modulo `example-app-deployment` con diversi argomenti:

```
module "app" {
  source = "./modules/example-app-deployment"

  aws_instance_count = var.aws_instance_count

  aws_instance_type = var.aws_instance_type
  aws_ami_id        = data.aws_ami.amazon_linux.id
  aws_vpc_id        = module.vpc.vpc_id

  aws_public_subnet_ids  = module.vpc.public_subnets
  aws_private_subnet_ids = module.vpc.private_subnets
}
```

La configurazione del modulo in `modules/example-app-deployment/main.tf` definisce l'infrastruttura che ospita l'applicazione: un load balancer, dei security group e delle istanze EC2. Per creare i security group e il load balancer, il modulo locale usa moduli pubblici del Terraform Registry. La configurazione delle istanze EC2 usa le input variable passate dal modulo root, per impostare il numero di istanze, il tipo di istanza, l'ID dell'AMI e le subnet private in cui creare le istanze:

```
resource "aws_instance" "app" {
  count = var.aws_instance_count

  instance_type = var.aws_instance_type
  ami           = var.aws_ami_id

  subnet_id              = var.aws_private_subnet_ids[count.index % length(var.aws_private_subnet_ids)]
  vpc_security_group_ids = [module.app_security_group.security_group_id]
}
```

Il file `variables.tf` del modulo definisce diverse input variable, tra cui l'ID della VPC e le subnet in cui distribuire l'applicazione. Alcune hanno già una validazione: almeno due subnet private e almeno due istanze EC2.

```
# Input variables

variable "aws_vpc_id" {
  description = "ID of the VPC to deploy in. DNS support must be enabled on this VPC."
  type        = string
}

variable "aws_private_subnet_ids" {
  description = "VPC private subnet ids."
  type        = list(string)

  validation {
    condition     = length(var.aws_private_subnet_ids) > 1
    error_message = "This application requires at least two private subnets."
  }
}

variable "aws_public_subnet_ids" {
  description = "VPC public subnet ids."
  type        = list(string)
}

variable "aws_ami_id" {
  description = "EC2 instance AMI ID."
  type        = string
}

variable "aws_instance_count" {
  description = "Number of AWS instances to deploy. This number must be evenly divisible by the number of private subnets."
  type        = number

  validation {
    condition     = var.aws_instance_count > 1
    error_message = "This application requires at least two EC2 instances."
  }
}

variable "aws_instance_type" {
  description = "EC2 instance type."
  type        = string
}
```

### 4.25.2 — Pianificare le modifiche

Una configurazione Terraform può essere sintatticamente valida e distribuibile, e non soddisfare comunque altri vincoli, come i requisiti specifici di un'applicazione. Chi mantiene un modulo può usare le custom condition nella configurazione per imporre questi requisiti.

Nel modulo root si rinomina il file `terraform.tfvars.example` in `terraform.tfvars`, così Terraform trova il file con le variabili configurate dall'utente finale. Il file imposta i valori di tre variabili. Con questi valori Terraform può distribuire l'infrastruttura, ma i valori non rispettano i requisiti ipotetici dell'applicazione di esempio. L'applicazione richiede infatti un'istanza EC2 che supporti l'ottimizzazione EBS e una VPC con il supporto DNS attivo.

```
aws_instance_type = "t2.micro"

aws_instance_count = 3

enable_dns = false
```

Se si distribuisse un'applicazione reale con questi requisiti, l'applicazione fallirebbe sull'infrastruttura configurata, con pochi indizi su cosa non va. Uno sviluppatore che conosce i requisiti dovrebbe diagnosticare i problemi ad applicazione già distribuita, e risalire a queste variabili configurate male. Nel tutorial si aggiungono quindi al modulo condizioni che garantiscono che:

- ogni subnet privata abbia lo stesso numero di istanze EC2;
- il tipo di istanza EC2 supporti l'ottimizzazione EBS;
- la VPC abbia il supporto DNS attivo.

Con queste condizioni gli utenti non possono distribuire l'applicazione su un'infrastruttura che non ne rispetta i requisiti. Prima di aggiungerle, `terraform plan` riporta che Terraform è pronto ad applicare la configurazione.

### 4.25.3 — Aggiungere le precondition

Terraform permette di aggiungere precondition e postcondition al `lifecycle` dei blocchi `resource`, `data` e `output`. Valuta le precondition prima del blocco che le contiene, e così verifica che la configurazione sia conforme prima di applicarla. Valuta le postcondition dopo il blocco che le contiene, e così conferma che i risultati delle modifiche applicate siano conformi prima di applicare il resto della configurazione.

In `modules/example-app-deployment/main.tf` si aggiunge un data source che legge il tipo di istanza, e due precondition al blocco `aws_instance.app` delle istanze EC2, per controllare il numero di istanze per subnet e il tipo di istanza:

```
data "aws_ec2_instance_type" "app" {
  instance_type = var.aws_instance_type
}

resource "aws_instance" "app" {
  count = var.aws_instance_count

  instance_type = var.aws_instance_type
  ami           = var.aws_ami_id

  subnet_id              = var.aws_private_subnet_ids[count.index % length(var.aws_private_subnet_ids)]
  vpc_security_group_ids = [module.app_security_group.security_group_id]

  lifecycle {
    precondition {
      condition     = var.aws_instance_count % length(var.aws_private_subnet_ids) == 0
      error_message = "The number of instances (${var.aws_instance_count}) must be evenly divisible by the number of private subnets (${length(var.aws_private_subnet_ids)})."
    }

    precondition {
      condition     = data.aws_ec2_instance_type.app.ebs_optimized_support != "unsupported"
      error_message = "The EC2 instance type (${var.aws_instance_type}) must support EBS optimization."
    }
  }
}
```

La prima precondition verifica che ogni subnet privata contenga lo stesso numero di istanze. Divide il numero di istanze per il numero di subnet e controlla che il resto sia 0. Così il traffico dell'applicazione si distribuisce in modo uniforme sulle subnet usate dall'applicazione. La seconda precondition verifica che il tipo di istanza EC2 scelto supporti l'ottimizzazione EBS, leggendo l'attributo `ebs_optimized_support` del tipo di istanza dal data source.

### 4.25.4 — Provocare il fallimento di una condizione

Pianificando la configurazione, Terraform riporta che le precondition sono fallite. La configurazione usa il meta-argomento `count` per creare un numero di istanze EC2 pari al valore di `aws_instance_count`, attualmente 3. Terraform riporta quindi gli errori di entrambe le precondition per ogni istanza. Quando una condizione fallisce, Terraform segnala l'errore e non prosegue con il plan o l'apply: bisogna risolvere gli errori prima di poter distribuire la configurazione.

Si aggiornano quindi in `terraform.tfvars` i valori compatibili con le condizioni aggiunte al modulo. Il tipo di istanza diventa uno che supporta l'ottimizzazione EBS (`t3.micro`). Il numero di istanze diventa quattro, divisibile per il numero di subnet private:

```
aws_instance_type = "t3.micro"

aws_instance_count = 4

enable_dns = false
```

Pianificando di nuovo, entrambe le precondition passano e Terraform è pronto ad applicare la configurazione.

### 4.25.5 — Aggiungere una postcondition

La configurazione root del progetto crea una VPC con un modulo pubblico, e il modulo `example-app-deployment` si aspetta che la VPC abbia il supporto DNS attivo. Si aggiunge quindi al modulo dell'applicazione un data source che cerca la VPC creata in base al suo ID, con una postcondition che verifica che il supporto DNS sia attivo:

```
data "aws_vpc" "app" {
  id = var.aws_vpc_id

  lifecycle {
    postcondition {
      condition     = self.enable_dns_support == true
      error_message = "The selected VPC must have DNS support enabled."
    }
  }
}
```

La postcondition fa riferimento al data source con il valore `self`. Terraform non crea la VPC finché non si applica la configurazione di esempio, quindi non può validare la condizione prima di aver iniziato a creare l'infrastruttura. Con `terraform apply`, Terraform inizia ad applicare la configurazione, e crea la VPC prima di leggerne gli attributi dal data source. Poi valuta la postcondition e segnala un errore se fallisce.

Applicando la configurazione, Terraform inizia a fare le modifiche e poi segnala l'errore della postcondition sul data source. Per risolverlo si attiva il supporto DNS sulla VPC, impostando `enable_dns = true` in `terraform.tfvars`, e si applica di nuovo. Dopo l'aggiornamento della VPC, Terraform legge il nuovo valore di `enable_dns_support` dal data source `aws_vpc.app` dentro il modulo `example-app-deployment`, e valuta la postcondition. Ora il supporto DNS è attivo, e la postcondition ha successo.

- Fonte: [Validate modules with custom conditions](https://developer.hashicorp.com/terraform/tutorials/configuration-language/custom-conditions)

---

## 4.26 — Validare l'infrastruttura con i check

I check di Terraform permettono di definire asserzioni da validare come parte del workflow di gestione dell'infrastruttura. A differenza della validazione delle variabili e delle custom condition, i blocchi `check` sono separati dal ciclo di vita di una risorsa o di un data source specifici.

I check sfruttano il modo in cui Terraform astrae le differenze tra le API dei vari provider. Terraform standardizza l'interazione con tutte le API dei provider, quindi le condizioni da validare nei run si definiscono con le funzionalità e la sintassi già note del linguaggio Terraform. I check permettono anche di verificare le proprie ipotesi sull'infrastruttura in modo continuativo, e non solo al momento del provisioning.

Nel tutorial si definiscono check che verificano il codice di risposta di un servizio e la validità di un certificato TLS. Le condizioni fanno riferimento a risorse esistenti e usano data source per interrogare i sistemi. Con HCP Terraform si attivano anche gli health assessment, e si usa la validazione continua per verificare i risultati dei check.

> **Suggerimento**: gli health assessment sono disponibili in HCP Terraform Standard Edition (si veda la pagina dei prezzi di HCP Terraform).
_(infoBox)_

### 4.26.1 — Definire un check

I check possono validare qualsiasi condizione che si può definire con la configurazione Terraform: un attributo dell'infrastruttura, o il funzionamento della risorsa stessa. Invece di scrivere script personalizzati per testare le asserzioni sull'infrastruttura, si usano le funzionalità del linguaggio Terraform per validarne lo stato di salute. In `main.tf` si aggiunge un blocco `check` che verifica lo stato del certificato TLS:

```
check "certificate" {
  assert {
    condition     = aws_acm_certificate.cert.status == "ERRORED"
    error_message = "Certificate status is ${aws_acm_certificate.cert.status}"
  }
}
```

Un blocco `check` è composto da una o più istruzioni `assert`. Ogni asserzione contiene la condizione da verificare e il messaggio d'errore da mostrare se fallisce. Questo check verifica lo stato del certificato TLS. Per mostrare come Terraform gestisce un check fallito, la condizione richiede lo stato `ERRORED`, e quindi fallirà.

### 4.26.2 — Creare l'infrastruttura e validare i check

Terraform valuta i check della configurazione come ultimo passo dell'operazione. Al primo apply la configurazione non supera il check, perché lo stato reale del certificato è `ISSUED`. Dopo aver generato il piano, Terraform mostra il check, ma indica che il risultato sarà noto solo dopo l'apply. Alla fine dell'apply, Terraform determina lo stato del certificato e mostra che il check è fallito.

Poi si cambia l'`instance_type` della risorsa `aws_launch_configuration.terramino` in `t2.small`:

```
resource "aws_launch_configuration" "terramino" {
  name_prefix     = "terramino-"
  image_id        = data.aws_ami.amazon_linux.id
  instance_type   = "t2.small"
  user_data       = file("user-data.sh")
  security_groups = [aws_security_group.terramino_instance.id]

  lifecycle {
    create_before_destroy = true
  }
}
```

Questa volta Terraform sa già al momento del plan che il check della configurazione fallisce. Segnala il fallimento, ma permette comunque di procedere con il ridimensionamento dell'istanza.

Terraform valuta i check dopo aver generato il piano. A differenza degli errori delle custom condition o della validazione delle variabili, i check falliti non bloccano gli apply. Terraform segnala gli eventuali fallimenti o problemi da risolvere, e lascia decidere se procedere con l'operazione.

A differenza degli altri meccanismi di validazione, i check sono separati dagli altri componenti e risorse della configurazione. La validazione delle variabili verifica che gli input della configurazione soddisfino i requisiti. Le custom condition definiscono condizioni come parte delle definizioni delle risorse, e sono legate al ciclo di vita di una risorsa specifica. I check invece riguardano la configurazione nel suo insieme.

### 4.26.3 — Attivare gli health assessment

Gli health assessment di HCP Terraform vengono eseguiti ogni giorno per verificare lo stato dell'infrastruttura. Comprendono due controlli:

- la drift detection, che verifica che le impostazioni dell'infrastruttura corrispondano ancora alla configurazione voluta;
- la validazione continua, che verifica che i check definiti nella configurazione passino ancora.

Gli assessment si attivano su un workspace specifico o su tutti i workspace dell'organizzazione. Nel tutorial li si attiva sul workspace `learn-terraform-checks`: nella sezione **Health** si sceglie **Settings**, poi **Enable** e **Save settings**.

Una volta attivati, gli health assessment vengono eseguiti ogni 12 ore. Se ne può però avviare uno a mano per confermare lo stato del workspace, dalla pagina **Health** del workspace con **Start health assessment**. Dopo qualche istante HCP Terraform mostra il risultato del check fallito.

Si possono configurare le notifiche del workspace perché avvisino il team dei risultati degli assessment. Gli health assessment automatici individuano in modo proattivo i problemi nella configurazione dell'infrastruttura, senza aspettare un'operazione manuale che validi i check. Risolvendo i problemi subito, il workflow di gestione dell'infrastruttura torna prevedibile, perché il team non deve decidere come riconciliarli durante altre operazioni. Gli assessment automatici aiutano a individuare e correggere presto i problemi, senza aggiungere complessità operativa ai run di Terraform.

### 4.26.4 — Usare un data source dentro un check

Nelle asserzioni dei blocchi `check` si possono usare data source. Terraform interroga il data source quando valuta i check della configurazione, alla fine di ogni operazione. Così si ottengono i dati più aggiornati sull'ambiente, anche quando un workspace gestisce molte risorse e le operazioni di Terraform richiedono più tempo. Si aggiunge a `main.tf` questo check:

```
check "response" {
  data "http" "terramino" {
    url      = "https://${aws_lb.terramino.dns_name}"
    insecure = true
  }

  assert {
    condition     = data.http.terramino.status_code == 200
    error_message = "Terramino response is ${data.http.terramino.status_code}"
  }
}
```

Il check definisce un data source che cattura la risposta di una richiesta GET al servizio Terramino, e verifica che il codice di stato sia 200.

Nelle condizioni dei check si possono usare tutti i data source e gli attributi delle risorse della configurazione. I data source definiti dentro un blocco `check` non sono però accessibili nel resto della configurazione. Il loro namespace è limitato al blocco `check`, e vengono valutati al momento del check. Se serve, si può specificare il meta-argomento `depends_on` per un data source dentro il check, per imporre un ordine di valutazione.

Poi si aggiorna la condizione del check originale, perché verifichi che lo stato del certificato sia `ISSUED` e il check passi:

```
check "certificate" {
  assert {
    condition     = aws_acm_certificate.cert.status == "ISSUED"
    error_message = "Certificate status is ${aws_acm_certificate.cert.status}"
  }
}
```

Si esegue `terraform init` per scaricare il provider http, poi `terraform apply`: Terraform interroga il data source e valuta il nuovo check, e come previsto entrambi i check passano. Se i check della configurazione passano, Terraform lo registra nel file di state, ma non mostra nessun output per i check superati durante il run. In HCP Terraform, alla voce **Health > Continuous validation** del workspace, si vede che l'ultimo run ha rilevato il nuovo check e che entrambi i check ora passano. Nel campo `check_results` dello state, Terraform ha registrato che entrambi i check sono passati:

```
"check_results": [
    {
      "object_kind": "check",
      "config_addr": "check.certificate",
      "status": "pass",
      "objects": [
        {
          "object_addr": "check.certificate",
          "status": "pass"
        }
      ]
    },
    {
      "object_kind": "check",
      "config_addr": "check.response",
      "status": "pass",
      "objects": [
        {
          "object_addr": "check.response",
          "status": "pass"
        }
      ]
    }
  ]
```

- Fonte: [Use checks to validate infrastructure](https://developer.hashicorp.com/terraform/tutorials/configuration-language/checks)

---

## 4.27 — Proteggere le input variable sensibili

Spesso l'infrastruttura va configurata con informazioni sensibili o segrete, come nomi utente, password, token API o dati personali (PII). In questi casi bisogna evitare di esporre questi dati per errore nell'output della CLI, nei log o nel controllo sorgente. Terraform offre diverse funzionalità che aiutano a evitarlo.

Nel tutorial si usa Terraform per distribuire su AWS un'applicazione web: una VPC, un load balancer, istanze EC2 e un database. Le credenziali del database scritte a mano si sostituiscono con variabili configurate con il flag `sensitive`, e Terraform ne oscura i valori nell'output dei comandi e nei messaggi di log. Poi si impostano i valori di queste variabili con le variabili d'ambiente e con un file `.tfvars`. Infine si individuano i valori sensibili nello state, e si vedono i modi per proteggere il file di state.

### 4.27.1 — Riorganizzare le credenziali del database

In fondo a `main.tf`, il blocco `aws_db_instance.database` definisce il database, con nome utente e password scritti a mano. Per toglierli dalla configurazione, prima si dichiarano in `variables.tf` le input variable per il nome utente e la password dell'amministratore del database, marcate come sensitive:

```
variable "db_username" {
  description = "Database administrator username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}
```

Poi si aggiorna `main.tf` perché usi queste variabili:

```
resource "aws_db_instance" "database" {
  allocated_storage = 5
  engine            = "mysql"
  instance_class    = "db.t3.micro"
  username          = var.db_username
  password          = var.db_password

  db_subnet_group_name = aws_db_subnet_group.private.name

  skip_final_snapshot = true
}
```

Con un `terraform apply` a questo punto, Terraform chiederebbe i valori delle nuove variabili, perché non hanno un default. Inserire i valori a mano però richiede tempo ed è soggetto a errori. Il tutorial mostra quindi due metodi per impostare i valori delle variabili sensitive, con le considerazioni di sicurezza di ognuno.

### 4.27.2 — Impostare i valori con un file .tfvars

Terraform permette di impostare i valori delle variabili con i file di definizione delle variabili (`.tfvars`). Se ne possono usare più d'uno, e molti usano un file separato per i valori sensibili o segreti. Si crea un nuovo file `secret.tfvars` che assegna i valori alle nuove variabili:

```
db_username = "admin"
db_password = "insecurepassword"
```

Poi si applicano le modifiche con il parametro `-var-file`:

```
$ terraform apply -var-file="secret.tfvars"
```

Le nuove variabili sono marcate come sensitive, quindi Terraform ne oscura i valori nell'output dei comandi plan, apply e destroy. La password compare come *sensitive value*, mentre il nome utente compare come *sensitive*. Il provider AWS considera sensitive l'argomento `password` di qualsiasi istanza di database, anche se la variabile non è dichiarata sensitive, e lo oscura comunque. Conviene però dichiarare la variabile come sensitive, perché venga oscurata anche se la si usa in punti diversi dallo specifico argomento `password`.

Un file `.tfvars` separa i valori sensibili dagli altri valori delle variabili, e rende chiaro a chi lavora sulla configurazione quali valori sono sensibili. Bisogna però mantenere il file `secret.tfvars` e condividerlo solo con le persone autorizzate. Bisogna anche fare attenzione a non includere nel controllo versione i file `.tfvars` con valori sensibili. Per questo il file `.gitignore` per Terraform raccomandato da GitHub ignora i file che corrispondono allo schema `*.tfvars`.

### 4.27.3 — Impostare i valori con le variabili

Il nome utente e la password dell'amministratore del database si possono impostare anche con le variabili d'ambiente, con Terraform Community Edition, o con le variabili di Terraform, con HCP Terraform. Quando viene eseguito, Terraform cerca nell'ambiente le variabili che corrispondono allo schema `TF_VAR_<VARIABLE_NAME>`, e ne assegna i valori alle variabili corrispondenti della configurazione. Ecco i comandi per bash, PowerShell e il prompt dei comandi di Windows:

```
$ export TF_VAR_db_username=admin TF_VAR_db_password=adifferentpassword
$ $Env:TF_VAR_db_username = "admin"; $Env:TF_VAR_db_password = "adifferentpassword"
$ set "TF_VAR_db_username=admin" & set "TF_VAR_db_password=adifferentpassword"
```

HCP Terraform offre una gestione sicura delle variabili: cifra tutti i valori delle variabili e permette di marcarle come sensitive al momento della creazione. Una variabile marcata come sensitive diventa write-only. Nessun utente può vederne il valore nell'interfaccia di HCP Terraform o leggerlo tramite l'endpoint Variables dell'API. Gli utenti con il permesso di leggere e scrivere le variabili possono impostare nuovi valori per le variabili sensitive. Per modificarne gli altri attributi, però, bisogna eliminare e ricreare la variabile.

Nel tutorial si creano nella pagina **Variables** del workspace `learn-terraform-sensitive-variables` le input variable `db_username` (`admin`) e `db_password` (`adifferentpassword`), selezionando la casella **Sensitive**. Al successivo `terraform apply`, Terraform assegna questi valori alle nuove variabili.

> **Nota**: quando si impostano valori sensibili con le variabili d'ambiente, bisogna ricordare che quei valori restano nell'ambiente e nella cronologia della riga di comando.
_(infoBox)_

### 4.27.4 — Fare riferimento alle variabili sensitive

Le variabili sensitive si usano nella configurazione come qualsiasi altra variabile. Terraform ne oscura i valori nell'output dei comandi e nei file di log, e dà errore quando rileva che verrebbero esposte in altri modi. Si aggiunge a `outputs.tf` questo output:

```
output "db_connect_string" {
  description = "MySQL database connection string"
  value       = "Server=${aws_db_instance.database.address}; Database=ExampleDB; Uid=${var.db_username}; Pwd=${var.db_password}"
}
```

Applicando la modifica, Terraform dà errore, perché l'output deriva da variabili sensitive. Si marca quindi come sensitive l'output della stringa di connessione al database, aggiungendo `sensitive = true` al blocco. Applicando di nuovo, Terraform oscura l'output della stringa di connessione.

### 4.27.5 — I valori sensitive nello state

Quando si eseguono i comandi di Terraform con un file di state locale, Terraform conserva lo state in chiaro, compresi i valori delle variabili, anche se sono marcate come sensitive. Terraform deve conservare questi valori nello state per sapere se sono cambiati dall'ultimo apply della configurazione. Nel tutorial lo si verifica cercando `password` nel file `terraform.tfstate` con `grep`.

Marcare le variabili come sensitive non basta a proteggerle. Bisogna anche tenerle al sicuro mentre le si passa alla configurazione Terraform, e proteggerle nel file di state. HCP Terraform e Terraform Enterprise gestiscono e condividono i valori sensibili, e cifrano tutti i valori delle variabili prima di salvarli. HashiCorp Vault protegge, conserva e controlla rigorosamente l'accesso a token, password e altri valori sensibili.

- Fonte: [Protect sensitive input variables](https://developer.hashicorp.com/terraform/tutorials/configuration-language/sensitive-variables)

---

## 4.28 — Gestire i dati sensibili nella configurazione

Per effettuare il provisioning dell'infrastruttura, Terraform può aver bisogno di dati sensibili, come le credenziali dei cloud provider, i token API e altri segreti. Se si aggiungono valori segreti direttamente alla configurazione, Terraform li conserva nei file di state e di piano. Questa pagina descrive le diverse opzioni per proteggere i dati sensibili nella configurazione, e i compromessi di ciascun approccio.

### 4.28.1 — Contesto

I file di state e di piano di Terraform contengono informazioni dettagliate sull'infrastruttura, compresi attributi e metadati delle risorse. Possono contenere valori sensibili, come le password iniziali dei database o i token API.

Se si sviluppa con Terraform in locale, Terraform conserva lo state in un file in chiaro, che contiene tutti i valori segreti definiti nella configurazione. Il file di state va trattato come un dato sensibile: va escluso dai workflow Git, e protetto seguendo le raccomandazioni di HashiCorp.

Terraform si può anche configurare per conservare i file di state e di piano in una posizione remota. Con lo storage remoto dello state, Terraform tiene lo state in memoria solo mentre lo usa. Lo state si può cifrare a riposo, ma il metodo di cifratura dipende dal backend. Ad esempio, HCP Terraform cifra automaticamente lo state a riposo e lo protegge con TLS in transito.

### 4.28.2 — Requisiti

I requisiti dipendono dai blocchi e dagli argomenti usati per gestire i valori sensibili:

- Terraform 0.15 o successivo per aggiungere l'argomento `sensitive` ai blocchi `variable` e `output`;
- Terraform 1.10 o successivo per aggiungere l'argomento `ephemeral` alle variabili e agli output dei moduli figli, o per usare il blocco `ephemeral`;
- Terraform 1.11 o successivo per usare un argomento write-only su una managed resource.

È ogni provider a definire i blocchi `ephemeral` disponibili e gli argomenti write-only delle sue managed resource. Il supporto del proprio provider si verifica nel Terraform Registry.

### 4.28.3 — Decidere come gestire i dati sensibili

Per decidere come gestire i valori sensibili bisogna prima capire cosa si vuole ottenere: nascondere i valori nella CLI di Terraform e nell'interfaccia di HCP Terraform, oppure impedire del tutto a Terraform di conservarli.

L'argomento `sensitive` nei blocchi `variable` o `output` fa oscurare a Terraform quei valori nell'output della CLI e nell'interfaccia di HCP Terraform. Terraform considera inoltre sensitive per natura tutte le espressioni che fanno riferimento a una variabile o a un output sensitive.

I valori ephemeral sono disponibili durante l'esecuzione, ma Terraform li esclude del tutto dai file di state e di piano. La documentazione indica questi modi per definire valori ephemeral nella configurazione:

- l'argomento `ephemeral` sulle variabili e sugli output dei moduli figli;
- il blocco `ephemeral`;
- un argomento write-only su una managed resource.

Si possono anche aggiungere entrambi gli argomenti `ephemeral` e `sensitive` ai blocchi `variable` e agli output dei moduli figli. Così Terraform non ne conserva i valori, e li oscura nella CLI e nell'interfaccia di HCP Terraform.

### 4.28.4 — Nascondere variabili e output sensibili

L'argomento `sensitive` nei blocchi `variable` e `output` serve quando si vogliono oscurare quei valori nei log della CLI di Terraform e nell'interfaccia di HCP Terraform. Terraform considera inoltre sensitive per natura tutte le espressioni che fanno riferimento a una variabile o a un output sensitive. L'argomento si aggiunge ai blocchi `variable` e `output` che contengono dati sensibili:

```
variable "database_password" {
  description = "Password for the database instance"
  type        = string
  sensitive   = true
}

output "connection_string" {
  description = "Database connection string"
  value       = "postgresql://${var.db_username}:${var.database_password}@${aws_db_instance.main.endpoint}/mydb"
  sensitive   = true
}
```

Terraform oscura poi le variabili e gli output sensitive nel log delle operazioni della CLI: nel riepilogo dell'apply, ad esempio, l'output `connection_string` compare come *(sensitive value)*. Terraform considera automaticamente sensitive anche qualsiasi espressione che fa riferimento a una variabile o a un output sensitive. Se l'argomento `password` di un'altra risorsa fa riferimento a `var.database_password`, Terraform oscura quell'argomento nelle operazioni di plan e apply:

```
resource "aws_db_instance" "main" {
  identifier = "my-database"
  engine     = "postgres"
  username   = var.db_username
  password   = var.database_password
}
```

Terraform conserva i valori con l'argomento `sensitive` sia nei file di state sia in quelli di piano, e chiunque possa accedere a quei file può accedere ai valori sensibili. Inoltre, con le opzioni `-json` o `-raw` del comando `terraform output`, Terraform mostra in chiaro le variabili e gli output sensitive. Se non si vogliono conservare i valori sensibili, li si esclude dai file di state e di piano come descritto più avanti. Se i file di state e di piano contengono valori sensibili, è consigliato proteggere lo state.

### 4.28.5 — Nascondere i valori senza conservarli

Per combinare i vantaggi dei due argomenti, si aggiunge `sensitive` alle variabili e agli output dei moduli figli che hanno l'argomento `ephemeral`. La variabile `database_password` seguente è esclusa dai file di state e di piano, e il suo valore è oscurato nella CLI di Terraform e nell'interfaccia di HCP Terraform:

```
variable "database_password" {
  description = "Password for the database instance"
  type        = string
  sensitive   = true
  ephemeral   = true
}
```

### 4.28.6 — Escludere i valori dai file di state e di piano

I valori ephemeral sono disponibili durante l'esecuzione di un'operazione, ma Terraform li esclude dai file di state e di piano. Poiché Terraform non li conserva, i valori generati che si vogliono preservare vanno salvati in un'altra risorsa o in un output della configurazione.

Terraform limita i punti della configurazione in cui si possono usare i valori ephemeral. Vi si può fare riferimento solo in questi contesti:

- nel blocco `locals`;
- nei blocchi `variable` con l'argomento `ephemeral`;
- nei blocchi `output` dei moduli figli con l'argomento `ephemeral`;
- in un argomento write-only di una managed resource;
- nel blocco `ephemeral`;
- nella configurazione dei provider nel blocco `provider`;
- nei blocchi `provisioner` e `connection`.

**L'argomento ephemeral su variabili e output** _(stepTitle)_

Si imposta `ephemeral = true` in un blocco `variable` che contiene dati sensibili temporanei, per escludere quel valore dai file di state e di piano. La variabile si può poi usare in altri contesti ephemeral, ad esempio nel blocco `provider` per configurare un provider:

```
variable "api_token" {
  description = "Short-lived API token for provider authentication"
  type        = string
  sensitive   = true
  ephemeral   = true
}

provider "example" {
  api_token = var.api_token
}
```

L'argomento `ephemeral` si può aggiungere anche al blocco `output` dei moduli figli, per passare dati tra moduli senza salvarli nei file di state o di piano. Non si può invece aggiungere agli output del modulo root. Passare output tra i moduli figli e il modulo root è utile per gestire credenziali, token e altri valori temporanei che non si vogliono conservare nello state.

```
output "session_token" {
  value     = ephemeral.auth_provider.main.token
  ephemeral = true
  sensitive = true
}
```

**Il blocco ephemeral** _(stepTitle)_

Il blocco `ephemeral` dichiara una ephemeral resource temporanea, che esiste solo durante l'operazione di Terraform in corso. Terraform non conserva le ephemeral resource nei file di state o di piano. Sono quindi ideali per gestire dati sensibili o temporanei che non si vogliono salvare, come password temporanee o connessioni ad altri sistemi. È ogni provider a definire le ephemeral resource disponibili. Ad esempio, si può usare l'ephemeral resource `random_password` per generare una password temporanea:

```
ephemeral "random_password" "db_password" {
  length           = 16
  override_special = "!#$%&*()-_=+[]{}<>:?"
}
```

A un blocco `ephemeral` si può fare riferimento solo in altri contesti ephemeral, come un argomento write-only di una managed resource. Gli argomenti write-only permettono di passare in modo sicuro valori temporanei alle managed resource durante un'operazione, senza salvarli. Ad esempio, si può usare `db_password` nell'argomento write-only `password_wo`:

```
ephemeral "random_password" "db_password" {
  length           = 16
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_instance" "example" {
  instance_class       = "db.t3.micro"
  allocated_storage    = "5"
  engine               = "postgres"
  username             = "example"
  skip_final_snapshot  = true
  publicly_accessible  = true
  db_subnet_group_name = aws_db_subnet_group.example.name
  password_wo          = ephemeral.random_password.db_password.result
  password_wo_version  = 1
}
```

Né gli argomenti write-only né i blocchi `ephemeral` sopravvivono oltre il run di Terraform in corso. Così il valore di `ephemeral.random_password.db_password.result` è completamente escluso dai file di state e di piano. Terraform non conserva il valore generato, ma lo si può salvare in un'altra risorsa perché non vada perso.

**Gli argomenti write-only** _(stepTitle)_

Gli argomenti write-only permettono di passare in modo sicuro valori temporanei alle managed resource di Terraform durante un'operazione, senza salvarli nei file di state o di piano. È ogni provider a definire gli argomenti write-only disponibili per le sue managed resource. Di solito il loro nome termina in `_wo`, e hanno un argomento `_wo_version` corrispondente. Ad esempio, `aws_db_instance` ha l'argomento write-only `password_wo`:

```
resource "aws_db_instance" "main" {
  instance_class      = "db.t3.micro"
  allocated_storage   = "20"
  engine              = "postgres"
  username            = "admin"
  skip_final_snapshot = true

  password_wo         = ephemeral.random_password.db_password.result
  password_wo_version = 1
}
```

Durante un'operazione di Terraform, il provider aws usa il valore di `password_wo` per creare l'istanza del database. Poi Terraform scarta quel valore senza salvarlo nel file di piano o di state.

### 4.28.7 — Best practice per la sicurezza dello state

Se si conservano valori sensibili in un file di state, è consigliato adottare misure di sicurezza aggiuntive per proteggerlo:

- conservare lo state in remoto;
- cifrare lo state a riposo;
- limitare con i controlli di accesso chi può accedere allo state;
- tracciare nel tempo gli accessi allo state con i log di audit.

Conservare lo state in remoto può migliorare la sicurezza, perché permette di cifrarlo a riposo. Ad esempio, questi backend supportano la cifratura dello state:

- HCP Terraform cifra lo state a riposo, permette di fornire chiavi di cifratura proprie e protegge lo state con TLS in transito;
- il backend S3 può cifrare lo state a riposo se si attiva l'opzione `encrypt`, e protegge lo state con TLS in transito;
- il backend GCS supporta chiavi di cifratura fornite o gestite dal cliente.

- Fonte: [Manage sensitive data in your configuration](https://developer.hashicorp.com/terraform/language/v1.12.x/manage-sensitive-data)

---

## 4.29 — Iniettare segreti in Terraform con il provider Vault

Tradizionalmente, gli sviluppatori che devono creare infrastruttura con Terraform in modo sicuro ricevono un proprio insieme di credenziali AWS di lunga durata, con un ambito limitato. Questo dà libertà allo sviluppatore, ma le credenziali di lunga durata possono essere pericolose e difficili da proteggere:

- gli operatori devono gestire un gran numero di credenziali IAM AWS statiche, di lunga durata e con ambiti diversi;
- le credenziali di lunga durata sulla macchina locale di uno sviluppatore creano un'ampia superficie di attacco. Se un malintenzionato vi accede, può usarle per danneggiare le risorse.

Entrambi i problemi si risolvono conservando le credenziali AWS di lunga durata nell'AWS Secrets Engine di HashiCorp Vault. Poi si usa il provider Vault di Terraform per generare credenziali AWS di breve durata e con l'ambito appropriato, che Terraform usa per creare le risorse in AWS. Così gli operatori (Vault Admin) non devono gestire segreti statici di lunga durata con ambiti diversi. Gli sviluppatori (Terraform Operator) possono invece creare le risorse senza accedere direttamente ai segreti. Nel tutorial si interpretano entrambi i ruoli, il Vault Admin e il Terraform Operator.

![Figura 13](img/vault-secrets-overview.png) _(dimensioni: 1562×532 px)_

*Figura 13 — I due ruoli del tutorial: il Vault Admin configura e gestisce i segreti in Vault, il Terraform Operator li usa per creare le risorse AWS. Fonte: HashiCorp Developer.* _(caption)_

Il tutorial si svolge in tre fasi:

1. come Vault Admin, si configura l'AWS Secrets Engine in Vault;
2. come Terraform Operator, ci si collega all'istanza di Vault per ottenere credenziali AWS dinamiche e di breve durata, generate dall'AWS Secrets Engine, e con queste si crea un'istanza EC2 Ubuntu;
3. come Vault Admin, si toglie al Terraform Operator la possibilità di gestire le istanze EC2, modificando la policy del ruolo Vault corrispondente.

Lungo il percorso si vedono i vantaggi e le considerazioni di questo approccio.

### 4.29.1 — Avviare il server Vault

Si avvia un server Vault in modalità di sviluppo, con `education` come token root, e lo si lascia in esecuzione nel terminale:

```
$ vault server -dev -dev-root-token-id="education"
```

L'istanza è raggiungibile su `localhost:8200`, e vi si accede con il token root `education`.

### 4.29.2 — Configurare l'AWS Secrets Engine in Vault

In un altro terminale, lasciando in esecuzione l'istanza di Vault, si va nella directory del Vault Admin (`vault-admin-workspace`). Il file `main.tf` contiene due risorse:

- `vault_aws_secret_backend.aws` configura l'AWS Secrets Engine, perché generi un token dinamico che dura 2 minuti;
- `vault_aws_secret_backend_role.admin` configura un ruolo dell'AWS Secrets Engine chiamato `dynamic-aws-creds-vault-admin-role`, con una policy IAM che concede i permessi `iam:*` ed `ec2:*`.

Il workspace del Terraform Operator userà questo ruolo per generare dinamicamente credenziali AWS limitate a questa policy IAM. Prima di applicare la configurazione si imposta la variabile Terraform richiesta con le proprie credenziali AWS. Si impostano anche come variabili d'ambiente gli argomenti richiesti dal provider Vault, `VAULT_ADDR` e `VAULT_TOKEN`:

```
$ export TF_VAR_aws_access_key=<AWS_ACCESS_KEY_ID>
$ export TF_VAR_aws_secret_key=<AWS_SECRET_ACCESS_KEY>
$ export VAULT_ADDR=http://127.0.0.1:8200
$ export VAULT_TOKEN=education
```

Dopo `terraform init` e `terraform apply` ci sono due output, `backend` e `role`, che il workspace del Terraform Operator userà in seguito. Nel terminale del server Vault compare un messaggio che conferma che Terraform ha montato l'AWS Secrets Engine nel percorso indicato. Anche il ruolo è configurato, anche se non compare nei log.

### 4.29.3 — Creare l'istanza di calcolo

Con l'AWS Secrets Engine di Vault configurato, si possono ottenere token AWS dinamici di breve durata per creare un'istanza EC2. Nella directory del Terraform Operator (`operator-workspace`), il file `main.tf` contiene questi blocchi:

- il blocco `terraform_remote_state.admin` recupera il file di state generato dal workspace del Vault Admin;
- il blocco `vault_aws_access_credentials.creds` recupera dall'istanza di Vault le credenziali AWS dinamiche e di breve durata, usando gli output `backend` e `role` del workspace del Vault Admin;
- il provider aws viene inizializzato con le credenziali di breve durata recuperate da `vault_aws_access_credentials.creds`, nella region `us-east-1` definita dalla variabile `region`;
- il blocco `aws_ami.ubuntu` recupera l'immagine Ubuntu più recente;
- il blocco `aws_instance.main` crea un'istanza EC2 `t2.micro`.

> **Suggerimento**: quando è comodo, è consigliato usare i data source specifici del provider. `terraform_remote_state` è più flessibile, ma richiede l'accesso all'intero state di Terraform.
_(infoBox)_

Dopo `terraform init`, nella pagina **IAM Users** della console AWS si cerca il prefisso `vault-token-terraform-dynamic-aws-creds-vault-admin`. All'inizio non compare nessun utente, ma un utente con questo prefisso compare con `terraform plan` o `terraform apply`. Applicando la configurazione, Terraform crea l'istanza EC2 con le credenziali dinamiche generate da Vault.

L'utente IAM che compare è stato generato da Vault, con la policy IAM configurata dal workspace del Vault Admin. `default_lease_ttl_seconds` è impostato a 120 secondi, quindi dopo 120 secondi Vault revoca quelle credenziali IAM, che spariscono dalla console AWS IAM.

> **Suggerimento**: il token viene generato nel momento in cui la configurazione recupera le credenziali AWS temporanee, cioè con `terraform plan` o `terraform apply`. Se l'apply viene confermato dopo i 120 secondi, il run fallisce, perché le credenziali usate per inizializzare il provider AWS sono scadute. In questi casi, o con configurazioni grandi con molte risorse, potrebbe essere necessario modificare `default_lease_ttl_seconds`.
_(infoBox)_

Nella pagina EC2, cercando `dynamic-aws-creds-operator`, si vede l'istanza creata dal workspace del Terraform Operator con le credenziali AWS di breve durata. Ogni run con questa configurazione usa un proprio insieme unico di credenziali IAM AWS, limitate all'ambito definito dal Vault Admin.

Il Terraform Operator non deve gestire credenziali AWS di lunga durata in locale. Il Vault Admin deve gestire solo il ruolo Vault, invece di numerose credenziali AWS di lunga durata con ambiti diversi. Dopo 120 secondi, nel terminale di Vault compare un messaggio *revoked lease*: Vault ha distrutto le credenziali AWS di breve durata generate per il run di apply. Anche la successiva distruzione dell'istanza EC2 genera e usa un altro insieme di credenziali IAM.

### 4.29.4 — Limitare i permessi del ruolo Vault

Se il Vault Admin vuole togliere al Terraform Operator i permessi su EC2, gli basta aggiornare la policy del ruolo Vault. Nel workspace del Vault Admin si rimuove `"ec2:*"` dalla risorsa `vault_aws_secret_backend_role.admin` in `main.tf`:

```
resource "vault_aws_secret_backend_role" "admin" {
  backend = vault_aws_secret_backend.aws.path
  name    = "${var.name}-role"
  credential_type = "iam_user"

  policy_document = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}
```

Questa modifica impedisce al Terraform Operator di creare qualsiasi istanza EC2 AWS, e la si applica con `terraform apply`. Tornando nel workspace del Terraform Operator, `terraform plan` ora fallisce: per la modifica al ruolo `dynamic-aws-creds-vault-admin`, il Terraform Operator non ha più i permessi CRUD sulle istanze EC2.

### 4.29.5 — Vantaggi e considerazioni

Questo approccio all'iniezione dei segreti:

- solleva il Vault Admin dalla gestione di numerose credenziali AWS di lunga durata con ambiti diversi;
- riduce il rischio di una credenziale AWS compromessa in un run di Terraform. Se un malintenzionato ottiene una credenziale AWS usata in un run, quella credenziale vale solo per la durata del TTL del token;
- permette di gestire i permessi di un ruolo con un ruolo Vault, invece di distribuire e gestire credenziali AWS statiche;
- permette agli sviluppatori di creare risorse senza gestire credenziali AWS statiche in locale.

Con configurazioni grandi con molte risorse, però, questo approccio può dare problemi. Le credenziali AWS dinamiche generate valgono solo per la durata del TTL del token. Se l'apply dura più del TTL e la configurazione deve ancora creare altre risorse, o se la conferma dell'apply arriva dopo la scadenza del TTL, l'apply fallisce perché le credenziali AWS di breve durata sono scadute. Si può aumentare il TTL in base alla propria situazione. Così però le credenziali AWS temporanee restano valide più a lungo, e la superficie di attacco aumenta.

- Fonte: [Inject secrets into Terraform using the Vault provider](https://developer.hashicorp.com/terraform/tutorials/secrets/secrets-vault)

---

## 4.30 — Aggiornare la versione major di un'istanza RDS

Terraform permette di gestire le istanze Amazon Relational Database Service (RDS) per tutto il loro ciclo di vita. Con gli argomenti lifecycle integrati in Terraform si gestiscono le dipendenze e l'ordine di aggiornamento di risorse strettamente legate, come le istanze RDS e i loro parameter group. Il tutorial usa anche Terraform per impostare in modo sicuro la password del database e conservarla in AWS Systems Manager (SSM).

Nel tutorial si configura con Terraform un'istanza RDS, conservandone la password in SSM. Poi si esegue con Terraform un aggiornamento di versione major dell'istanza RDS. Si vede così come Terraform gestisce le dipendenze tra le risorse della configurazione.

### 4.30.1 — La configurazione di esempio

Il file `main.tf` definisce queste risorse:

- il blocco `provider`, che configura la region AWS e i tag di default;
- un data source che carica le availability zone della region configurata;
- una VPC AWS in cui creare l'istanza RDS;
- un subnet group RDS, che indica un insieme di subnet in cui collocare RDS;
- un security group che consente l'accesso all'istanza RDS sulla porta 5432;
- un parameter group RDS;
- un `aws_db_instance` configurato con PostgreSQL 15.

> **Nota**: la configurazione di esempio permette di accedere all'istanza RDS da internet, per potervisi collegare durante il tutorial. In produzione è consigliato seguire le best practice di sicurezza: collocare l'istanza RDS in una subnet privata, e consentire l'accesso solo dalle subnet che si controllano.
_(infoBox)_

L'attributo `family` della risorsa `aws_db_parameter_group` configura la versione major dell'istanza del database. Qui la famiglia del parameter group è `postgres15`, quindi il motore RDS sarà PostgreSQL v15:

```
resource "aws_db_parameter_group" "education" {
  name_prefix = "${random_pet.name.id}-education"
  family      = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

Si potrebbe usare un parameter group AWS di default, ma è consigliato mantenerne uno personalizzato per le istanze RDS. I parametri dei parameter group di default gestiti da AWS non si possono modificare. Con un gruppo personalizzato, se in futuro si deve cambiare un'impostazione di RDS, basta modificarlo invece di crearne uno nuovo.

### 4.30.2 — Password con ephemeral resource e argomenti write-only

La configurazione genera una password casuale per l'istanza RDS con un'ephemeral resource:

```
ephemeral "random_password" "db_password" {
  length = 16
}
```

`random_password.db_password` è un'ephemeral resource, quindi Terraform non la conserva nei file di state o di piano. Le ephemeral resource e i valori ephemeral sono disponibili da Terraform 1.10.

La configurazione usa `random_password.db_password` per impostare il valore di due argomenti write-only. Gli argomenti write-only di una risorsa sono disponibili solo durante l'operazione in corso, e Terraform non ne conserva i valori nei file di state o di piano. I provider di Terraform definiscono argomenti write-only per i valori da non conservare nello state di Terraform, come password o altri segreti.

Il primo argomento write-only, `aws_db_instance.password_wo`, imposta la password dell'istanza RDS. Il secondo, `aws_ssm_parameter.value_wo`, conserva la password come segreto AWS SSM, cifrato con la chiave SSM di default. Con questa configurazione Terraform non conserva la password del database, e l'unico modo per recuperarla è interrogare il parametro AWS SSM.

```
locals {
  # Increment db_password_version to update the DB password and store the new
  # password in SSM.
  db_password_version = 1
}

resource "aws_db_instance" "education" {
  identifier                  = "${random_pet.name.id}-education"
  instance_class              = "db.t3.micro"
  allocated_storage           = 10
  apply_immediately           = true
  engine                      = "postgres"
  engine_version              = "15"
  username                    = "edu"
  password_wo                 = ephemeral.random_password.db_password.result
  password_wo_version         = local.db_password_version
  ## ...
}

resource "aws_ssm_parameter" "secret" {
  name             = "/education/database/password/master"
  description      = "Password for RDS database."
  type             = "SecureString"
  value_wo         = ephemeral.random_password.db_password.result
  value_wo_version = local.db_password_version
}
```

Terraform non conserva il valore degli argomenti write-only, quindi non può rilevare se il loro valore è cambiato nella configurazione. Per tenerne traccia, il provider AWS offre argomenti di versione associati: `password_wo` usa `password_wo_version`, e `value_wo` usa `value_wo_version`.

Gli argomenti di versione vengono registrati nello state. Per dire a Terraform e ai provider che un argomento write-only è cambiato, si incrementa l'argomento `_version` corrispondente. Ad esempio, incrementando `password_wo_version` Terraform sa che il valore di `password_wo` è cambiato. Terraform registra la modifica nel piano, e comunica al provider che `password_wo` ha un nuovo valore da usare.

La configurazione di esempio imposta `password_wo_version` e `value_wo_version` allo stesso local value, `local.db_password_version`. Se i valori fossero scritti a mano, un utente potrebbe aggiornarne uno ma non l'altro. La password del database non sarebbe più allineata a quella conservata in SSM. Gli argomenti write-only sono disponibili da Terraform 1.11.

### 4.30.3 — Creare l'istanza RDS

Dopo `terraform init`, si applica la configurazione per creare l'istanza RDS e le altre risorse; la creazione di un'istanza RDS può richiedere fino a 10 minuti. Il nome host, la porta e il nome utente di RDS compaiono come sensitive. La configurazione di esempio imposta infatti `sensitive = true` su questi output, perché Terraform non ne mostri i valori per default:

```
output "rds_hostname" {
  description = "RDS instance hostname."
  value       = aws_db_instance.education.address
  sensitive   = true
}
```

A differenza delle ephemeral resource e degli argomenti write-only, Terraform conserva i valori sensitive nel file di state. Li mostra inoltre in chiaro se si usa l'opzione `-raw` del comando `terraform output`, o l'opzione `-json` per stampare gli output del workspace in formato JSON. Terraform conserva i valori sensitive non cifrati nel file di state, quindi questo file va tenuto al sicuro.

Il tutorial si collega poi al database con l'utility `psql` e lo popola con dati di esempio, dal file `coffees.sql` del repository. La password viene letta dal parametro AWS SSM, estratta dalla risposta con `jq` e messa nella variabile d'ambiente `PGPASSWORD`, da cui `psql` la legge:

```
$ export PGPASSWORD=$( \
  aws ssm get-parameter \
    --region=$(terraform output -raw region) \
    --name=/education/database/password/master \
    --with-decryption \
  | jq --raw-output '.Parameter.Value' \
  )
```

> **Nota**: il comando salva la password non cifrata nella variabile `PGPASSWORD` della sessione di shell. In produzione conviene eliminarla dopo l'uso.
_(infoBox)_

Poi si esegue lo script, ci si collega al database e, al prompt di `postgres`, si elencano i caffè registrati. Con `exit` si esce da `psql`:

```
$ psql -h $(terraform output -raw rds_hostname) -U $(terraform output -raw rds_username) postgres -f coffees.sql
$ psql -h $(terraform output -raw rds_hostname) -U $(terraform output -raw rds_username) postgres
SELECT * FROM coffees;
```

### 4.30.4 — Aggiornare l'istanza RDS

Una delle operazioni comuni nella gestione di un'istanza RDS è aggiornare il database a una nuova versione major. Per farlo si aggiornano nella configurazione Terraform la versione del motore del database e la famiglia del parameter group, e si applica la modifica.

**Creare uno snapshot** _(stepTitle)_

Prima di aggiornare il database si crea uno snapshot di backup dei dati. È buona pratica fare un backup prima di operare su un database, per avere un punto di ripristino in caso di perdita di dati o di altri errori. Si aggiunge a `main.tf` la configurazione che crea lo snapshot del database. Si aggiungono anche a `outputs.tf` due output con l'identificativo e lo stato dello snapshot:

```
output "rds_pre_16_backup_identifier" {
  description = "Identifier of the snapshot created before upgrading RDS instance to PostgreSQL 16."
  value = aws_db_snapshot.pre_16_upgrade.db_snapshot_identifier
}

output "rds_pre_16_backup_status" {
  description = "Status of the snapshot created before upgrading RDS instance to PostgreSQL 16."
  value = aws_db_snapshot.pre_16_upgrade.status
}
```

Poi si applica la configurazione con `terraform apply`, confermando con `yes`.

```
resource "aws_db_snapshot" "pre_16_upgrade" {
  db_instance_identifier = aws_db_instance.education.identifier
  db_snapshot_identifier = "pre16upgradebackup"
}
```

**Aggiornare la versione dell'istanza** _(stepTitle)_

In questa configurazione la risorsa `aws_db_instance` fa riferimento ad `aws_db_parameter_group`, e questo crea una dipendenza implicita tra le due. Terraform cercherebbe quindi prima di aggiornare il parameter group. Andrebbe però in errore, perché l'aggiornamento distruttivo cercherebbe di rimuovere un parameter group associato a un'istanza RDS in esecuzione.

Terraform offre meta-argomenti lifecycle per gestire dipendenze tra risorse più complesse come questa. Qui l'`aws_db_parameter_group` della configurazione di esempio ha l'argomento `create_before_destroy`. Così Terraform crea il nuovo parameter group e aggiorna l'istanza RDS prima di distruggere il parameter group originale. In `main.tf` si porta l'argomento `family` del parameter group a `postgres16`:

```
resource "aws_db_parameter_group" "education" {
  name_prefix = "${random_pet.name.id}-education"
  family      = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

> **Nota**: il testo del tutorial chiama la risorsa `aws_rds_parameter_group`, ma nella configurazione il tipo è `aws_db_parameter_group`, come mostra il codice.
_(infoBox)_

Poi si porta a `16` l'argomento `engine_version` della risorsa `aws_db_instance`:

```
resource "aws_db_instance" "education" {
  identifier                  = "${random_pet.name.id}-education"
  instance_class              = "db.t3.micro"
  allocated_storage           = 10
  apply_immediately           = true
  engine                      = "postgres"
  engine_version              = "16"
## ...
}
```

Applicando le modifiche alla configurazione, Terraform sostituisce il parameter group e aggiorna la versione del motore dell'istanza RDS; l'aggiornamento può richiedere fino a 20 minuti. Al termine si verifica che l'istanza RDS usi Postgres 16:

```
$ psql -h $(terraform output -raw rds_hostname) -U $(terraform output -raw rds_username) postgres -c "SELECT version()"
```

> **Nota**: secondo il tutorial, gli aggiornamenti di versione major di RDS sono una modifica distruttiva: AWS rimuove i dati esistenti dal database, che vanno ricaricati.
_(infoBox)_

- Fonte: [Upgrade RDS major version](https://developer.hashicorp.com/terraform/tutorials/aws/rds-upgrade)

---

## 4.31 — Il provider Vault

Il provider Vault permette a Terraform di leggere da HashiCorp Vault, scrivervi e configurarlo.

> **Importante**: quando Terraform interagisce con Vault, tutti i segreti letti e scritti vengono salvati sia nel file di state di Terraform sia in qualsiasi file di piano generato. Per ogni modulo Terraform che legge o scrive segreti di Vault, questi file vanno trattati come sensibili e protetti di conseguenza.
_(infoBox)_

Il provider serve due casi d'uso piuttosto distinti, ognuno con i propri compromessi di sicurezza e le proprie avvertenze, descritti nelle sezioni seguenti. Vanno valutati con attenzione prima di usare il provider nella configurazione Terraform. Per usare credenziali di breve durata dell'AWS Secrets Engine di Vault per autenticare il provider AWS, la documentazione rimanda al tutorial della sezione 4.29.

### 4.31.1 — Best practice

HashiCorp raccomanda di evitare, quando possibile, di mettere segreti nella configurazione o nel file di state di Terraform. Se li si mette, bisogna adottare misure per ridurre e gestire il rischio. Il webinar *Best Practices for Using HashiCorp Terraform with HashiCorp Vault* mostra come proteggere i segreti quando si usa Terraform con Vault nelle versioni open source. Le versioni a pagamento di Terraform offrono ulteriori misure di sicurezza.

### 4.31.2 — Configurare e popolare Vault

Gli amministratori di Vault possono usare Terraform per configurare Vault e popolarlo con segreti. In questo caso lo state e i piani associati alla configurazione vanno conservati e trasmessi con cura, perché contengono in chiaro tutti i valori scritti in Vault.

Al momento Terraform non ha meccanismi per oscurare o proteggere i segreti forniti tramite la configurazione. I team che scelgono di usare Terraform per popolare i segreti di Vault devono quindi leggere con attenzione, nella pagina di ogni risorsa, come i segreti vengono salvati nello state. Devono anche valutare se questo uso è compatibile con le proprie policy di sicurezza.

### 4.31.3 — Usare le credenziali di Vault nella configurazione Terraform

> **Importante**: il token Vault deve avere un time-to-live abbastanza lungo da permettere di creare tutte le risorse Vault. Se il TTL non basta, si possono incontrare errori imprevisti di permesso negato.
_(infoBox)_

La maggior parte dei provider di Terraform richiede credenziali per interagire con il servizio di terze parti che incapsula. Questo provider permette di ottenere quelle credenziali da Vault. Agli operatori o ai sistemi che eseguono Terraform basta quindi l'accesso a un token Vault con privilegi adeguati, con cui ottenere temporaneamente in lease le credenziali per gli altri provider.

Al momento Terraform non ha meccanismi per oscurare o proteggere i segreti restituiti dai data source. I segreti letti con questo provider vengono quindi salvati nello state di Terraform e in qualsiasi file di piano, e a volte compaiono nell'output della console durante plan e apply. Tutti questi artefatti vanno quindi protetti di conseguenza.

Per ridurre l'esposizione di questi segreti, il provider richiede un token Vault con un TTL relativamente breve, 20 minuti per default. Così, dove possibile, Vault revoca le credenziali emesse dopo quel tempo. Non può però ritirare i segreti statici, come quelli conservati nel secret backend "generic" di Vault.

Il TTL del token richiesto si controlla con l'argomento `max_lease_ttl_seconds` del provider. Terraform legge i data source durante il plan e ne scrive il risultato nel piano. Un apply eseguito dopo la scadenza del token intermedio probabilmente fallirà, perché i segreti conservati nel piano sono stati revocati. Salvo dove indicato, le risorse che leggono segreti da Vault richiedono solo la capability *read* sulle risorse interessate.

### 4.31.4 — Gli argomenti del provider

Il blocco di configurazione del provider accetta gli argomenti seguenti. Nella maggior parte dei casi è consigliato impostarli con le variabili d'ambiente indicate, per tenere le credenziali fuori dalla configurazione.

- `address` (obbligatorio): l'URL di origine del server Vault, cioè un URL con schema, hostname e porta, ma senza percorso. Si può impostare con la variabile d'ambiente `VAULT_ADDR`.
- `add_address_to_env` (facoltativo): con `true`, la variabile d'ambiente `VAULT_ADDR` del processo Terraform viene impostata al valore dell'argomento `address` del provider. Il default è `false`.
- `token` (facoltativo): il token Vault con cui Terraform si autentica. Si può impostare con la variabile d'ambiente `VAULT_TOKEN`. Se non è fornito in altro modo, Terraform cerca di leggerlo da `~/.vault-token`, dove il comando `vault` conserva il token corrente. Terraform si emette un nuovo token figlio di quello fornito, con un TTL breve per limitare l'esposizione dei segreti richiesti, a meno che `skip_child_token` non sia `true`. Per creare token figli, il token fornito deve avere la capability update sul percorso `auth/token/create` di Vault. Il provider richiede un token: lo si può impostare esplicitamente con l'argomento `token`, oppure ottenere dinamicamente con un blocco `auth_login*`.
- `token_name` (facoltativo): il nome del token figlio che Terraform crea (`display_name`). Serve a rendere il run di Terraform rintracciabile nel log di audit di Vault, ad esempio con l'hash del commit o l'ID del job CI/CD. Si può impostare con la variabile d'ambiente `VAULT_TOKEN_NAME`. Se non è impostato o è vuoto, vale `terraform`.
- `ca_cert_file` (facoltativo): il percorso di un file sul disco locale, usato per validare il certificato presentato dal server Vault. Si può impostare con la variabile d'ambiente `VAULT_CACERT`.
- `ca_cert_dir` (facoltativo): il percorso di una directory sul disco locale con uno o più file di certificato, usati per validare il certificato presentato dal server Vault. Si può impostare con la variabile d'ambiente `VAULT_CAPATH`.
- `auth_login_userpass`, `auth_login_aws`, `auth_login_cert`, `auth_login_gcp`, `auth_login_kerberos`, `auth_login_radius`, `auth_login_oci`, `auth_login_oidc`, `auth_login_jwt` e `auth_login_azure` (facoltativi): usano il motore di autenticazione `userpass`, `aws`, `cert`, `gcp`, `kerberos`, `radius`, `oci`, `oidc`, `jwt` o `azure`. `auth_login_token_file` (facoltativo) usa un file locale che contiene un token Vault. I dettagli sono nella sezione 4.31.5.
- `auth_login` (facoltativo): un blocco di configurazione che cerca di autenticarsi tramite il percorso `auth/<method>/login`, per ottenere il token che Terraform userà. Terraform si emette comunque un token figlio limitato con `auth/token/create`, per imporre un TTL breve e limitare l'esposizione. I dettagli sono nella sezione 4.31.5.
- `skip_tls_verify` (facoltativo): con `true` disattiva la verifica del certificato TLS del server Vault. È fortemente sconsigliato, salvo nei prototipi e negli ambienti di sviluppo, perché espone al rischio che Terraform venga ingannato e scriva segreti su un server controllato da un intruso. Si può impostare con la variabile d'ambiente `VAULT_SKIP_VERIFY`.
- `tls_server_name` (facoltativo): il nome da usare come host SNI nelle connessioni TLS. Si può impostare con la variabile d'ambiente `VAULT_TLS_SERVER_NAME`.
- `skip_child_token` (facoltativo): con `true` disattiva la creazione del token Vault intermedio ed ephemeral che Terraform usa. È fortemente sconsigliato, perché aumenta il rischio che un token Vault rinnovabile venga esposto in chiaro. Va cambiato solo se il token fornito non può creare token figli e non c'è rischio di esposizione dall'output di Terraform. Si può impostare con la variabile d'ambiente `TERRAFORM_VAULT_SKIP_CHILD_TOKEN`. Con `true` vengono ignorati `token_name` e `max_lease_ttl_seconds`. Prima di attivarlo va letta la sezione 4.31.3.
- `max_lease_ttl_seconds` (facoltativo): la durata del token Vault intermedio che Terraform si emette, che a sua volta limita la durata dei lease dei segreti emessi da Vault. Il default è 20 minuti, e si può impostare con la variabile d'ambiente `TERRAFORM_VAULT_MAX_TTL`. Le conseguenze di questa impostazione sono descritte nella sezione 4.31.3.
- `max_retries` (facoltativo): il numero massimo di tentativi quando si riceve un codice d'errore 5xx. Il default è `2`, e si può impostare con la variabile d'ambiente `VAULT_MAX_RETRIES`.
- `max_retries_ccc` (facoltativo): il numero massimo di tentativi per le operazioni legate alla *Client Controlled Consistency*. Il default è `10`, e si può impostare anche con la variabile d'ambiente `VAULT_MAX_RETRIES_CCC` (si veda *Vault Eventual Consistency*). Da Vault Enterprise 1.10 non dovrebbe più essere necessario modificarlo.
- `namespace` (facoltativo): il namespace da usare. Si può impostare con la variabile d'ambiente `VAULT_NAMESPACE`. È disponibile solo per Vault Enterprise.
- `use_root_namespace` (facoltativo): autentica nel namespace root di Vault. È in conflitto con `namespace`.
- `skip_get_vault_version` (facoltativo): salta il recupero dinamico della versione del server Vault. Va impostato a `true` quando l'endpoint API `/sys/seal-status` non è disponibile (si veda `vault_version_override`).
- `vault_version_override` (facoltativo): sostituisce la versione semantica del server Vault di destinazione. Normalmente la versione si ricava dinamicamente dall'endpoint API `/sys/seal-status`. Se l'endpoint non è disponibile, la si può indicare qui.

> **Attenzione**: il valore di `vault_version_override` determina la compatibilità con le API del server Vault, quindi deve corrispondere al server di destinazione. È consigliato usare questa opzione solo quando la versione del server non si può determinare dinamicamente.
_(infoBox)_

- `headers` (facoltativo): un blocco di configurazione con gli header da inviare in tutte le richieste al server Vault. Il blocco si può ripetere, e accetta due argomenti: `name` (obbligatorio), il nome dell'header, e `value` (obbligatorio), il suo valore.

### 4.31.5 — Metodi di autenticazione

Il provider Vault supporta i motori di autenticazione di Vault descritti sotto, ognuno con un proprio blocco. Tutti i blocchi accettano due argomenti comuni:

- `namespace` (facoltativo): il percorso del namespace in cui è montato il metodo di autenticazione. Il default è il namespace root, e il percorso non può avere barre iniziali o finali. È disponibile solo per Vault Enterprise.
- `use_root_namespace` (facoltativo): autentica nel namespace root di Vault. È in conflitto con `namespace`.

Tutti i blocchi tranne `auth_login_token_file` e `auth_login` accettano anche `mount` (facoltativo), il nome del mount del motore di autenticazione, con il default indicato per ciascun metodo. Per i dettagli di ogni metodo la pagina rimanda alla documentazione delle API di Vault.

**Userpass** _(stepTitle)_

Il blocco `auth_login_userpass` autentica in Vault con il motore Username & Password. Il default di `mount` è `userpass`. Gli altri argomenti sono:

- `username` (obbligatorio): il nome utente con cui accedere a Vault. Si può indicare con la variabile d'ambiente `TERRAFORM_VAULT_USERNAME`.
- `password` (facoltativo): la password con cui accedere a Vault. Si può indicare con la variabile d'ambiente `TERRAFORM_VAULT_PASSWORD`. Non si può usare insieme a `password_file`.
- `password_file` (facoltativo): un file che contiene la password con cui accedere a Vault. Si può indicare con la variabile d'ambiente `TERRAFORM_VAULT_PASSWORD_FILE`. Non si può usare insieme a `password`.

**AWS** _(stepTitle)_

Il blocco `auth_login_aws` autentica in Vault con il motore di autenticazione AWS. Il default di `mount` è `aws`. Gli altri argomenti sono:

- `role` (obbligatorio): il nome del ruolo con cui si tenta il login.
- `aws_access_key_id` (facoltativo): l'access key ID di AWS. Si può indicare con la variabile d'ambiente `AWS_ACCESS_KEY_ID`.
- `aws_secret_access_key` (facoltativo): la secret access key di AWS. Si può indicare con la variabile d'ambiente `AWS_SECRET_ACCESS_KEY`.
- `aws_session_token` (facoltativo): il session token di AWS. Si può indicare con la variabile d'ambiente `AWS_SESSION_TOKEN`.
- `aws_profile` (facoltativo): il nome del profilo AWS. Si può indicare con la variabile d'ambiente `AWS_PROFILE`.
- `aws_shared_credentials_file` (facoltativo): il percorso del file delle credenziali condivise di AWS. Si può indicare con la variabile d'ambiente `AWS_SHARED_CREDENTIALS_FILE`.
- `aws_web_identity_token_file` (facoltativo): il percorso del file che contiene un access token OAuth 2.0 o un ID token OpenID Connect. Si può indicare con la variabile d'ambiente `AWS_WEB_IDENTITY_TOKEN_FILE`.
- `aws_region` (facoltativo): la region AWS. Si può indicare con le variabili d'ambiente `AWS_REGION` o `AWS_DEFAULT_REGION`.
- `aws_role_arn` (facoltativo): l'ARN del ruolo AWS da assumere, usato durante STS AssumeRole. Si può indicare con la variabile d'ambiente `AWS_ROLE_ARN`.
- `aws_role_session_name` (facoltativo): il nome da associare alla sessione del ruolo AWS, usato durante STS AssumeRole. Si può indicare con la variabile d'ambiente `AWS_ROLE_SESSION_NAME`.
- `aws_sts_endpoint` (facoltativo): l'URL dell'endpoint STS.
- `aws_iam_endpoint` (facoltativo): l'URL dell'endpoint IAM.
- `header_value` (facoltativo): il valore dell'header Vault da includere nella richiesta di firma STS.

**Certificato TLS** _(stepTitle)_

Il blocco `auth_login_cert` autentica in Vault con il motore TLS Certificate. Il default di `mount` è `cert`. Gli altri argomenti sono:

- `name` (facoltativo): autentica solo con il ruolo di certificato indicato.
- `cert_file` (obbligatorio): il percorso di un file sul disco locale con il certificato, in formato PEM, da presentare al server.
- `key_file` (obbligatorio): il percorso di un file sul disco locale con la chiave privata, in formato PEM, per cui è stato emesso il certificato di autenticazione.

Questa configurazione di login rispetta i parametri TLS di primo livello del provider: `ca_cert_file`, `ca_cert_dir`, `skip_tls_verify` e `tls_server_name`.

**GCP** _(stepTitle)_

Il blocco `auth_login_gcp` autentica in Vault con il motore Google Cloud. Il default di `mount` è `gcp`. Gli altri argomenti sono:

- `role` (obbligatorio): il nome del ruolo con cui si tenta il login.
- `jwt` (facoltativo): il JSON Web Token firmato con cui si tenta il login.
- `credentials` (facoltativo): il percorso delle credenziali Google Cloud da usare per ottenere il token JWT firmato dal servizio IAM. È in conflitto con `jwt`.
- `service_account` (facoltativo): il nome del service account per cui emettere il token JWT. Richiede `credentials`.

Se `jwt` non è indicato, questa configurazione di login cerca di ottenere un token JWT firmato. Come sorgente del token supporta sia il servizio IAM sia il servizio di metadati GCE.

**Kerberos** _(stepTitle)_

Il blocco `auth_login_kerberos` autentica in Vault con il motore Kerberos. Il default di `mount` è `kerberos`. Gli altri argomenti sono:

- `token` (facoltativo): un token SPNEGO (*Simple and Protected GSSAPI Negotiation Mechanism*). Si può indicare con la variabile d'ambiente `KRB_SPNEGO_TOKEN`.
- `username`: il nome utente con cui accedere a Kerberos. È in conflitto con `token`, come tutti gli argomenti seguenti.
- `service`: il service principal name.
- `realm`: il dominio di autenticazione autoritativo del server Kerberos.
- `krb5conf_path`: un file di configurazione di Kerberos valido, ad esempio `/etc/krb5.conf`. Si può indicare con la variabile d'ambiente `KRB5_CONFIG`.
- `keytab_path`: il file keytab di Kerberos con la voce dell'entità che effettua il login. Si può indicare con la variabile d'ambiente `KRB_KEYTAB`.
- `disable_fast_negotiation`: disattiva la negoziazione FAST di Kerberos.
- `remove_instance_name`: toglie l'host dal nome utente trovato nel keytab.

Se `token` non è indicato, questa configurazione di login cerca di ottenere un token SPNEGO init dal dominio di `service`. In quel caso sono obbligatori `username`, `service`, `realm`, `krb5conf_path` e `keytab_path`.

**Radius** _(stepTitle)_

Il blocco `auth_login_radius` autentica in Vault con il motore Radius. Il default di `mount` è `radius`. Gli altri argomenti sono:

- `username` (obbligatorio): il nome utente Radius con cui accedere a Vault.
- `password` (obbligatorio): la password dell'utente Radius `username` con cui accedere a Vault.

**OCI** _(stepTitle)_

Il blocco `auth_login_oci` autentica in Vault con il motore OCI (Oracle Cloud Infrastructure). Il default di `mount` è `oci`. Gli altri argomenti sono:

- `role` (obbligatorio): il nome del ruolo con cui si tenta il login.
- `auth_type` (obbligatorio): il tipo di autenticazione OCI da usare. I valori validi sono `apikeys` e `instance`.

**OIDC** _(stepTitle)_

Il blocco `auth_login_oidc` autentica in Vault con il motore OIDC.

> **Attenzione**: questo metodo di login richiede un browser web sulla macchina host, per completare il flusso di autorizzazione.
_(infoBox)_

Il default di `mount` è `oidc`. Gli altri argomenti sono:

- `role` (obbligatorio): il nome del ruolo con cui si tenta il login.
- `callback_listener_address` (facoltativo): l'indirizzo del listener di callback. Deve essere un URI valido senza percorso.
- `callback_address` (facoltativo): l'indirizzo di callback. Deve essere un URI valido senza percorso.

**JWT** _(stepTitle)_

Il blocco `auth_login_jwt` autentica in Vault con il motore JWT. Il default di `mount` è `jwt`. Gli altri argomenti sono:

- `role` (obbligatorio): il nome del ruolo con cui si tenta il login.
- `jwt` (obbligatorio): il JSON Web Token firmato con cui si tenta il login. Si può indicare con la variabile d'ambiente `TERRAFORM_VAULT_AUTH_JWT`.
- `distributed_claim_access_token` (facoltativo): un token per recuperare le appartenenze ai gruppi indicate dalla sorgente *distributed claim* del JWT. È supportato solo con Azure/Entra ID e richiede Vault 1.18 o successivo. Si può indicare con la variabile d'ambiente `TERRAFORM_VAULT_AUTH_DISTRIBUTED_CLAIM_ACCESS_TOKEN`.

**Azure** _(stepTitle)_

Il blocco `auth_login_azure` autentica in Vault con il motore Azure. Il default di `mount` è `azure`. Gli altri argomenti sono:

- `role` (obbligatorio): il nome del ruolo con cui si tenta il login.
- `jwt` (facoltativo): il JSON Web Token firmato con cui si tenta il login. Se non è fornito, il token viene creato dall'API *managed identities for Azure resources*. Si può indicare con la variabile d'ambiente `TERRAFORM_VAULT_AZURE_AUTH_JWT`.
- `subscription_id` (obbligatorio): l'ID della sottoscrizione della macchina che ha generato il token MSI. Si ricava dai metadati dell'istanza.
- `resource_group_name` (obbligatorio): il resource group della macchina che ha generato il token MSI. Si ricava dai metadati dell'istanza.
- `vm_name` (facoltativo): il nome della macchina virtuale che ha generato il token MSI. Si ricava dai metadati dell'istanza.
- `vmss_name` (facoltativo): il nome del virtual machine scale set della macchina che ha generato il token MSI. Si ricava dai metadati dell'istanza.
- `tenant_id` (facoltativo): il tenant ID da usare in uno scenario di autenticazione multi-tenant.
- `client_id` (facoltativo): il client ID dell'identità.
- `scope` (facoltativo): gli scope da includere nella richiesta del token. Il default è `https://management.azure.com/`.

**Token file** _(stepTitle)_

Il blocco `auth_login_token_file` permette di "autenticarsi" in Vault con un file locale che contiene un token Vault.

> **Attenzione**: usare `auth_login_token_file` non è raccomandato, perché si basa su un token Vault salvato su disco. Bisogna avere processi che eliminino il file del token tra un'esecuzione di Terraform e l'altra.
_(infoBox)_

Oltre agli argomenti comuni, il blocco accetta `filename` (obbligatorio): il file che contiene il token Vault. Il file deve contenere un solo token Vault ed essere leggibile dall'utente, ad esempio con i permessi `0600`. Si può impostare con la variabile d'ambiente `TERRAFORM_VAULT_TOKEN_FILENAME`.

**Generico** _(stepTitle)_

Il blocco `auth_login` supporta l'autenticazione a Vault basata sul percorso.

> **Attenzione**: è consigliato usare uno dei blocchi specifici dei motori di autenticazione descritti sopra. Questa configurazione serve per i motori di autenticazione personalizzati, o quando un motore ufficiale non è ancora supportato dal provider.
_(infoBox)_

Oltre agli argomenti comuni, il blocco accetta:

- `path` (obbligatorio): il percorso di login del backend di autenticazione. Ad esempio, per il login con approle si imposta `auth/approle/login`. Alcuni mount usano anche parametri nell'URL, come `userpass`: `auth/userpass/login/:username`.
- `method` (facoltativo): se configurato, abilita operazioni specifiche del metodo di autenticazione. Ad esempio, con `aws` il provider firma automaticamente le richieste di login per l'autenticazione AWS. Il valore valido è `aws`.
- `parameters` (facoltativo): una map di parametri chiave-valore da inviare per l'autenticazione con il backend. Quali parametri usare lo indica la documentazione delle API di Vault del metodo di autenticazione.

### 4.31.6 — Il debug del provider

Terraform supporta di default diverse opzioni di logging (sezione 7.9).

> **Attenzione**: le variabili d'ambiente seguenti producono un output di log esteso. Il livello di log di Terraform deve essere `DEBUG` o superiore. Qualsiasi output di log esteso può **rivelare segreti**, quindi vanno attivate con cautela.
_(infoBox)_

- `TERRAFORM_VAULT_LOG_BODY`: con `true` vengono registrati sia il corpo della richiesta sia quello della risposta.
- `TERRAFORM_VAULT_LOG_REQUEST_BODY`: con `true` viene registrato il corpo della richiesta.
- `TERRAFORM_VAULT_LOG_RESPONSE_BODY`: con `true` viene registrato il corpo della risposta.

### 4.31.7 — Esempi d'uso

Nel primo esempio il provider è configurato con le variabili d'ambiente, e una risorsa scrive un segreto generico:

```
provider "vault" {
  # It is strongly recommended to configure this provider through the
  # environment variables described above, so that each user can have
  # separate credentials set in the environment.
  #
  # This will default to using $VAULT_ADDR
  # But can be set explicitly
  # address = "https://vault.example.net:8200"
}

resource "vault_generic_secret" "example" {
  path = "secret/foo"

  data_json = jsonencode(
    {
      "foo"   = "bar",
      "pizza" = "cheese"
    }
  )
}
```

**Usare auth_login** _(stepTitle)_

Con il backend `userpass`:

```
variable login_username {}
variable login_password {}

provider "vault" {
  auth_login {
    path = "auth/userpass/login/${var.login_username}"

    parameters = {
      password = var.login_password
    }
  }
}
```

Oppure con `approle`:

```
variable login_approle_role_id {}
variable login_approle_secret_id {}

provider "vault" {
  auth_login {
    path = "auth/approle/login"

    parameters = {
      role_id   = var.login_approle_role_id
      secret_id = var.login_approle_secret_id
    }
  }
}
```

**auth_login con la firma AWS** _(stepTitle)_

Il provider firma i metadati AWS per le richieste di login con l'instance profile:

```
provider "vault" {
  address = "http://127.0.0.1:8200"
  auth_login {
    path = "auth/aws/login"
    method = "aws"
    parameters = {
      role = "dev-role-iam"
    }
  }
}
```

Se il metodo di autenticazione AWS del server Vault richiede che i client impostino l'header `X-Vault-AWS-IAM-Server-ID`, l'ID del server si indica in `header_value`, dentro il blocco `parameters`:

```
provider "vault" {
  address = "http://127.0.0.1:8200"
  auth_login {
    path = "auth/aws/login"
    method = "aws"
    parameters = {
      role = "dev-role-iam"
      header_value = "vault.example.com"
    }
  }
}
```

### 4.31.8 — Il supporto dei namespace

Il provider Vault supporta la gestione dei namespace, una funzionalità di Vault Enterprise, e la creazione di risorse al loro interno tramite gli alias dei provider. L'opzione `namespace` del blocco provider abilita la gestione delle risorse nel namespace indicato. Inoltre tutte le risorse e i data source supportano un proprio `namespace`. Il `namespace` di ogni risorsa è relativo al namespace configurato nel `provider`.

**Importare risorse in un namespace** _(stepTitle)_

Per importare una risorsa che si trova in un namespace, il `namespace` si fornisce con la variabile d'ambiente `TERRAFORM_VAULT_NAMESPACE_IMPORT`. Data questa configurazione:

```
provider vault{}

resource "vault_mount" "secret" {
  namespace = "namespace1"
  path      = "secrets"
  type      = "kv"
  options = {
    version = "2"
  }
}
```

si esegue questo comando di import:

```
TERRAFORM_VAULT_NAMESPACE_IMPORT=namespace1 terraform import vault_mount.secret secrets
```

> **Attenzione**: il namespace di import è sempre relativo al `namespace` del blocco `provider{}`. `TERRAFORM_VAULT_NAMESPACE_IMPORT` va impostata solo quando si importa una risorsa Vault.
_(infoBox)_

**Esempio semplice di namespace** _(stepTitle)_

```
provider vault{}

resource "vault_namespace" "secret" {
  path = "secret_ns"
}

resource "vault_mount" "secret" {
  namespace = vault_namespace.secret.path
  path      = "secrets"
  type      = "kv"
  options = {
    version = "1"
  }
}

resource "vault_generic_secret" "secret" {
  namespace = vault_mount.secret.namespace
  path      = "${vault_mount.secret.path}/secret"
  data_json = jsonencode(
    {
      "ns" = "secret"
    }
  )
}
```

**Usare gli alias del provider** _(stepTitle)_

> **Attenzione**: è consigliato impostare il `namespace` sulle singole risorse e sui data source, invece di dover gestire più alias del `provider` (si veda la risorsa `vault_namespace`).
_(infoBox)_

La configurazione seguente è un semplice esempio d'uso dell'attributo `namespace` del blocco provider: configura un provider con alias e crea una risorsa in quel namespace.

```
# main provider block with no namespace
provider vault {}

# create the "everyone" namespace in the default root namespace
resource "vault_namespace" "everyone" {
  path = "everyone"
}

# configure an aliased provider, scope to the new namespace.
provider vault {
  alias     = "everyone"
  namespace = vault_namespace.everyone.path
}

# create a policy in the "everyone" namespace
resource "vault_policy" "example" {
  provider = vault.everyone

  depends_on = [vault_namespace.everyone]
  name       = "vault_everyone_policy"
  policy     = data.vault_policy_document.list_secrets.hcl
}

data "vault_policy_document" "list_secrets" {
  rule {
    path         = "secret/*"
    capabilities = ["list"]
    description  = "allow List on secrets under everyone/"
  }
}
```

Con questa configurazione con alias, la policy viene creata nel namespace `everyone`, ma non nel namespace root:

```
$ vault policy list -namespace=everyone
default
vault_everyone_policy

$ vault policy list
default
root
```

> **Nota**: la pagina originale chiama la policy `list_secrets`, che però è il nome del data source con il documento della policy. La policy creata si chiama `vault_everyone_policy`, come mostra l'output.
_(infoBox)_

**Namespace annidati** _(stepTitle)_

L'esempio seguente imposta il `namespace` risorsa per risorsa, a partire da un solo blocco `provider{}`. La documentazione della risorsa `vault_namespace` ha un esempio un po' meno elaborato.

```
provider vault {}

variable "everyone_ns" {
  default = "everyone"
}

variable "engineering_ns" {
  default = "engineering"
}

variable "vault_team_ns" {
  default = "vault-team"
}

data "vault_policy_document" "public_secrets" {
  rule {
    path         = "secret/*"
    capabilities = ["list"]
    description  = "allow List on secrets under everyone/ namespace"
  }
}

data "vault_policy_document" "vault_team_secrets" {
  rule {
    path         = "secret/*"
    capabilities = ["create", "read", "update", "delete", "list"]
    description  = "allow all on secrets under everyone/engineering/vault-team/"
  }
}

resource "vault_namespace" "everyone" {
  path = var.everyone_ns
}

resource "vault_namespace" "engineering" {
  namespace = vault_namespace.everyone.path
  path      = var.engineering_ns
}

resource "vault_namespace" "vault_team" {
  namespace = vault_namespace.engineering.path_fq
  path      = var.vault_team_ns
}


resource "vault_policy" "everyone" {
  namespace = vault_namespace.everyone.path
  name     = "vault_everyone_policy"
  policy   = data.vault_policy_document.vault_team_secrets.hcl
}

resource "vault_policy" "vault_team" {
  namespace = vault_namespace.vault_team.path_fq
  name     = "vault_team_policy"
  policy   = data.vault_policy_document.vault_team_secrets.hcl
}
```

> **Nota**: nell'esempio della pagina originale la policy `vault_policy.everyone` usa il documento `vault_team_secrets`, che concede tutte le operazioni, mentre il documento `public_secrets`, che concede solo `list` sul namespace `everyone`, è definito ma non viene usato. Con ogni probabilità la policy `everyone` doveva usare `public_secrets`.
_(infoBox)_

Con questa configurazione, la struttura di namespace e policy è questa:

```
<root>/
  default
  root
  /everyone/
   default
   vault_everyone_policy
    /engineering/
      default
      /vault-team/
      default
      vault_team_policy
```

La struttura si verifica direttamente con `vault`:

```
$ vault namespace list
Keys
----
everyone/

$ vault namespace list -namespace=everyone
Keys
----
engineering/

$ vault namespace list -namespace=everyone/engineering
Keys
----
vault-team/

$ vault namespace list -namespace=everyone/engineering/vault-team
No namespaces found

$ vault policy list -namespace=everyone/engineering/vault-team
default
vault_team_policy
```

**I namespace del token** _(stepTitle)_

Se il token Vault appartiene a un namespace specifico e il namespace del provider non è configurato, il provider usa il namespace del token come namespace root per tutte le risorse. Questo comportamento si disattiva impostando la variabile d'ambiente `VAULT_SET_NAMESPACE_FROM_TOKEN` a `"false"`. Gli unici valori accettati sono `"true"` e `"false"`.

Per altri esempi d'uso dei namespace di Vault, la pagina rimanda al tutorial *Codify Management of Vault Enterprise Using Terraform*.

- Fonte: [Vault provider](https://registry.terraform.io/providers/hashicorp/vault/latest/docs)
