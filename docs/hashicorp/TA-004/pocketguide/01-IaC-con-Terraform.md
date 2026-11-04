# Infrastructure as Code (IaC) con Terraform

_Comprendere lo scopo di Terraform e il concetto di Infrastructure as Code (IaC)._

*Fonti: [How Terraform Works](https://developer.hashicorp.com/terraform/intro), [IaC with Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/infrastructure-as-code/terraform-associate-study-guide), [IaC in a private or public cloud](https://www.hashicorp.com/blog/infrastructure-as-code-in-a-private-or-public-cloud/), [Terraform use cases](https://developer.hashicorp.com/terraform/intro/v1.12.x/use-cases), [Multicloud with Terraform](https://developer.hashicorp.com/terraform/intro/v1.12.x/use-cases)*

## Che cos'è l'IaC?

Immagina di dover costruire una casa. Hai due possibilità:

1. **Lavoro manuale (il vecchio metodo)**: vai al deposito di legname, prendi il legno, lo inchiodi. Chiami l'elettricista e gli descrivi l'impianto al telefono. Sistemi le cose al volo perché hai dimenticato dove doveva andare la finestra. Sei mesi dopo devi costruire una dépendance identica. Riesci a rifarla esattamente uguale? Improbabile. Avrai dimenticato il tipo esatto di chiodi che hai usato.
2. **Progetto (IaC)**: disegni un progetto dettagliato e preciso (il codice). Consegni il progetto a un robot (Terraform). Il robot costruisce la casa. Sei mesi dopo dai al robot lo stesso progetto. Costruisce esattamente la stessa casa.

**Infrastructure as Code (IaC)** è la pratica di gestire ed effettuare il provisioning delle risorse di calcolo (server, reti, database) tramite file di definizione leggibili da una macchina, anziché tramite la configurazione fisica dell'hardware o console web interattive (**ClickOps**).

> Perché è importante? Perché ti permette di trattare l'infrastruttura come software. Puoi metterla sotto controllo di versione, testarla e automatizzarla. Riduce l'errore umano e aumenta la coerenza tra gli ambienti.

### Qual è il ruolo di Terraform nell'IaC?

Terraform è uno strumento dichiarativo. Significa che gli dici come deve essere la casa finita (lo **stato finale**, *End State*) e lui capisce da solo i passi per costruirla. Non devi dirgli *prendi il martello* o *compra i chiodi*. Dici solo **voglio 4 finestre**, e lui lo realizza.

---

## Vantaggi dei pattern IaC ("Perché preoccuparsene?")

### Perché Terraform e i pattern IaC?

Potresti pensare che "IaC" significhi Ansible o Puppet. Quello è il `Configuration Management`. Terraform è `Provisioning`. C'è una differenza fondamentale. Ansible fa sì che un server si conformi a uno stato. Terraform crea e sostituisce il server stesso.

È l'approccio dell'**infrastruttura immutabile** (*Immutable Infrastructure*). Non ti colleghi a un server per cambiare le cose. Cambi il codice, e Terraform sostituisce il server con uno nuovo che corrisponde al codice. È un principio fondamentale di Terraform e della gestione moderna dell'infrastruttura cloud.

Il linguaggio di configurazione di Terraform è dichiarativo: dichiari lo stato finale desiderato e Terraform calcola le azioni per raggiungerlo. Questo lo distingue dagli strumenti imperativi, in cui scrivi i passi esatti per ottenere un risultato. Questa distinzione è alla base del design e dei pattern d'uso di Terraform.

**Distinzione tecnica chiave: dichiarativo vs. imperativo** _(stepTitle)_

- **Imperativo (Come):** "Fai 10 passi. Gira a sinistra. Prendi il martello. Colpisci il chiodo 3 volte." (Pensa a: script Bash; i playbook Ansible sono scritti in modo imperativo). Se esegui due volte uno script imperativo, la seconda volta potrebbe fallire perché il chiodo è già piantato.
- **Dichiarativo (Cosa):** "Ci sarà un chiodo piantato a filo nel muro." (Terraform). Non ti interessa come lo fa Terraform. Se il chiodo è già a filo, Terraform non fa nulla. Se il chiodo manca, ne pianta uno. Se il chiodo è storto, lo estrae e ne pianta uno nuovo dritto.

### Perché il dichiarativo è importante

- Terraform non esegue passi imperativi arbitrari: calcola un `diff` e potrebbe non eseguire attività che richiedono un ordinamento oltre il suo grafo delle dipendenze.
- Rilevamento del drift: Terraform confronta lo stato attuale con lo stato configurato tramite lo `state file` e le API di lettura dei provider. Se avvengono modifiche esterne, `plan` mostrerà le differenze; `plan` potrebbe non rilevare alcuni default mutabili lato provider. Usa i comportamenti di `terraform refresh` e le ispezioni dello state (ne parleremo presto).

### Lo scopo di Terraform rispetto ad altri strumenti IaC

- **Modello provider/plugin:** la forza di Terraform sono le risorse indipendenti dal provider, tramite plugin. È un unico linguaggio usato per gestire molte piattaforme.
- **Basato sullo state vs. basato su agent:** Terraform tiene traccia dello state per sapere cosa esiste; altri strumenti (agent a stato desiderato) riconciliano continuamente.
- **Terraform viene tipicamente eseguito come operazioni discrete (plan/apply), anche se i backend remoti o HCP Terraform possono fornire esecuzioni remote.**

> **Uso ideale:** provisioning di risorse cloud, networking, IAM, servizi gestiti; meno adatto alla configurazione dettagliata all'interno del sistema guest (usa strumenti di configuration management o cloud-init).

### Vantaggi dei pattern IaC

Perché usare un progetto (codice) invece di costruire la casa a mano?

1. **Benefici operativi (efficienza e velocità):** l'IaC ti permette di automatizzare il provisioning dell'infrastruttura, cosa molto più rapida dei processi manuali. Puoi creare interi ambienti in minuti invece che in ore o giorni.
    - **Velocità e sicurezza (automazione):** gli esseri umani sono lenti e fanno errori di battitura. Un refuso in una regola firewall può mandare giù una banca. Terraform esegue codice, e il codice è prevedibile.
    - **Riusabilità (moduli):** scrivi una volta il progetto di un "Web server sicuro standard". Usi quel progetto 50 volte. **Questo è materiale dell'Obiettivo 5**, ma deriva dai principi dell'IaC.
    - **Testabilità:** unit test (`tflint`, `terraform validate`), test di integrazione (terragrunt/kitchen-terraform, end-to-end).
2. **Principi strategici (affidabilità e conformità):** l'IaC promuove best practice come il controllo di versione, le code review e i test automatici. Questo porta a un'infrastruttura più affidabile e a una conformità più semplice con le policy aziendali.
    - **Parità tra ambienti:** usa variable set, workspace o moduli per ambiente per ridurre i problemi del tipo "**sul mio portatile funziona**".
    - **Conformità e policy:** applica vincoli con strumenti (Sentinel, OPA) durante il plan o la CI.
    - **Coerenza (idempotenza):** è un termine elegante per dire "**eseguilo 100 volte, ottieni lo stesso risultato 100 volte**". Se esegui `terraform apply`, porta il mondo nello stato descritto nel codice. Nessun drift di configurazione.
    - **Controllo di versione (verificabilità):** puoi conservare il codice Terraform in Git. Chi ha cambiato la dimensione del database? Git Blame. Perché l'ha cambiata? Messaggio di commit. Quando l'ha cambiata? Timestamp. Con il **ClickOps** non puoi farlo.
    - **Riproducibilità:** la combinazione di configurazione, variabili, versioni dei provider e moduli produce deployment riproducibili tra gli ambienti.
    - **Automazione e CI/CD:** poiché l'infrastruttura è codice, può essere inserita in pipeline automatizzate di test e deployment, proprio come il software applicativo.

---

## Come Terraform gestisce workflow multi-cloud, ibridi e service-agnostic

### Idee sbagliate comuni

- **Terraform è uno strumento di configuration management.** (Falso): Terraform effettua il provisioning e gestisce risorse (infrastruttura). Usa strumenti di configuration management (Ansible, Chef) o `cloud-init` per configurare il software all'interno del guest.
- **Terraform serve solo per risorse cloud.** (Falso): Terraform può gestire infrastruttura on-premises, prodotti SaaS e persino risorse locali (file, record DNS) tramite il suo ecosistema di provider.
- **`terraform plan` applica modifiche.** (Falso): `plan` mostra solo un'anteprima; le modifiche avvengono con `apply`.
- **I workspace offrono un isolamento completo degli ambienti.** (In parte falso): i workspace sono una funzionalità di namespacing per lo state; non sostituiscono completamente deployment, backend separati o l'isolamento degli ambienti in CI/CD.
- **Terraform è uno strumento "premi un pulsante".** (Falso): Terraform richiede pianificazione attenta, gestione dello state e comprensione delle dipendenze. Non è una bacchetta magica: se usato male può causare interruzioni di servizio.
- **Terraform è solo per i DevOps engineer.** (Falso): sviluppatori, SRE e anche i team di sicurezza possono usare Terraform per gestire l'infrastruttura, applicare policy e automatizzare la conformità.
- **Lo state è cifrato di default ovunque.** (Falso): lo state locale è JSON in chiaro. I backend remoti spesso offrono cifratura a riposo, ma tratta lo state come dato sensibile e ruota i segreti se vengono esposti.
- **I moduli sono magici.** (Falso): i moduli sono pacchetti di configurazione riutilizzabili; non cambiano il modello di Terraform, aiutano a organizzare e riutilizzare il codice.

Queste idee sbagliate causano errori nei progetti reali; tienile a mente mentre leggi il resto della guida.

Ogni cloud ha il suo linguaggio API.

- AWS parla così: `aws ec2 run-instances --image-id ami-xyz`
- Azure parla così: `az vm create --resource-group MyRG --name MyVM`
- Datadog (monitoraggio) parla così: `curl -X POST https://api.datadoghq.com/api/v1/dashboard`

Se sei un "**Cloud Engineer**", devi fare da traduttore per 10 lingue diverse. Farai errori.

Terraform non sa come creare un'istanza EC2. Non sa come creare una VM Azure.

> Terraform sa come parlare con i Provider (approfondimento nell'Obiettivo 2).

- **Tu scrivi:** `resource "aws_instance" "web" { ami = "xyz" }`
- **Terraform Core:** "Ah, `aws_instance`. Sveglio il plugin **AWS Provider** e gli chiedo di tradurre questo HCL in chiamate API AWS."
- **Tu scrivi:** `resource "azurerm_virtual_machine" "web" { ... }`
- **Terraform Core:** "Ah, `azurerm_virtual_machine`. Sveglio il plugin **Azure Provider**."

> **Il workflow è unificato:** che tu stia creando un server in AWS, un record DNS in Cloudflare o un utente in GitHub, i comandi che digiti sono esattamente gli stessi: `terraform init` -> `terraform plan` -> `terraform apply`

Ecco cosa intende Terraform con **"workflow service-agnostic"**: il workflow è indipendente dal servizio gestito.

Non è solo un workflow: è una rete di sicurezza. `terraform plan` è un **diff in modalità dry-run**. Ti mostra il piano di esecuzione prima di toccare la tua infrastruttura. È la singola funzionalità più importante che distingue Terraform dal cliccare in giro nella console.

**Lo state** è la fonte di verità (e di dolori): la logica di Terraform è stateless, ma gli serve un database per sapere cosa ha già costruito. È lo state file. È un enorme blob JSON che associa `resource "aws_instance" "web"` a `i-12345`.

> **Non modificare mai lo state file a mano. Lo ripeteremo fino alla fine dei tempi: ci passeremo parecchio tempo.**

## Parte 2: laboratorio pratico

Dimostriamo l'Obiettivo 1 con un laboratorio. Non toccheremo ancora un cloud provider. Useremo Terraform per gestire un file locale.

Questo dimostrerà perfettamente il workflow e la natura dichiarativa.

> Non preoccuparti della resource `local_file` o del provider `local`. È solo un esempio semplice per mostrare come funziona Terraform. Lo stesso workflow si applica ad AWS, Azure, Datadog, GitHub e a qualsiasi altro provider che usi con Terraform.

> Non preoccuparti nemmeno se non capisci ancora il codice HCL. Lo tratteremo nell'**Obiettivo 3**. Per ora segui i comandi e guarda come Terraform gestisce il file come codice.

> I provider `localfile`, `locals` e `random` sono inclusi nel registry di Terraform e si possono usare senza alcuna configurazione cloud. Questo ci permette di concentrarci sul workflow principale e sui concetti dell'IaC senza dover configurare credenziali o risorse cloud.

**Passo 1: creare la directory di lavoro** _(stepTitle)_

```bash
mkdir tf-associate-lab && cd tf-associate-lab
```

**Passo 2: scrivere la configurazione** _(stepTitle)_

Crea un file chiamato `main.tf`.

```hcl
# Laboratorio Obiettivo 1: gestire un file come codice
# Nota: NON stiamo dicendo a Terraform COME creare un file.
# Stiamo dichiarando QUALE deve essere lo stato finale.

resource "local_file" "my_lesson" {
  content  = "Infrastructure as Code is declarative."
  filename = "${path.module}/lesson_1.txt"
}

output "file_greeting" {
  value = "I have created the file: ${local_file.my_lesson.filename}"
}
```

**Passo 3: eseguire il core workflow (la "Trinità di Terraform")** _(stepTitle)_

1. `terraform init` (inizializzazione)

- Cosa fa: Terraform legge il tuo `main.tf`. Vede `resource "local_file"`. Pensa: "Mi serve il plugin del provider `local` per capirlo." Scarica il plugin da internet (HashiCorp Registry) e lo mette in una cartella nascosta `.terraform/`.

> **Collegamento all'esame**: **Obiettivo 2b** (descrivere come Terraform usa i provider), **Obiettivo 3b** (inizializzare una directory di lavoro Terraform).

2. `terraform plan` (anteprima)

- Cosa fa: Terraform confronta lo stato desiderato in `main.tf` con lo stato reale del mondo (`lesson_1.txt` esiste?). Produce un diff.
- Cerca il segno `+`: significa **creazione**.
- Cerca il segno `-/+`: significa **distruzione e ricreazione** (sostituzione).
- Cerca il segno `~`: significa **aggiornamento in-place**.

> **Collegamento all'esame**: **Obiettivo 1b** (idempotenza), **Obiettivo 3d** (generare e rivedere un piano di esecuzione).

3. `terraform apply` (provisioning)

Cosa fa: Terraform chiede "Sei sicuro?". Digiti `yes`. Terraform chiama l'API del provider Local (il file system del tuo sistema operativo) e scrive il file.

Risultato: compare un file chiamato `lesson_1.txt`. Compare un file chiamato `terraform.tfstate`.

Controlli rapidi da CLI (ispezionare state e plan):

```bash
terraform state list                # elenca le risorse tracciate nello state
terraform state show local_file.my_lesson  # mostra gli attributi registrati per la risorsa
terraform show -json > last_apply.json     # esporta l'ultimo plan/state in JSON leggibile da macchina
```

Usa questi comandi per ispezionare cosa ha registrato Terraform dopo `apply` e per aiutarti a fare debug del drift o dei valori degli attributi.

**Passo 4: la natura dichiarativa in azione (idempotenza)** _(stepTitle)_

- Esegui di nuovo `terraform plan`. Output atteso: `No changes. Your infrastructure matches the configuration`.

Perché? Perché il file esiste già con il contenuto giusto. Terraform è **idempotente**. Non cerca di crearlo di nuovo.

**Passo 5: introdurre il "drift" (simulare qualcuno che modifica il file a mano)** _(stepTitle)_

- Apri `lesson_1.txt` in VS Code o nel tuo editor di testo. Cambia il testo in `"Someone is snooping around!"`.
- Salva il file.
- Esegui di nuovo `terraform plan`.

**Output atteso:** Terraform rileva il drift! Proporrà di aggiornare il file in-place (potresti vedere il simbolo di aggiornamento `~`) per riportare il contenuto a `"Infrastructure as Code is declarative."`

Questa è la potenza della gestione dello state e del rilevamento del drift di Terraform. Sa come dovrebbe essere il file e può rilevare quando qualcosa cambia al di fuori di Terraform.

**Uff!** È stato parecchio. Se sei arrivato fin qui, hai una comprensione solida dell'Obiettivo 1. Sai cos'è l'IaC, perché è importante e come Terraform lo implementa con un workflow unificato tra i servizi. Nel prossimo obiettivo approfondiremo l'architettura di Terraform e i suoi componenti principali. Ma prima mettiamo alla prova le tue conoscenze con un quiz sull'Obiettivo 1!

## Quiz

**Istruzioni** _(stepTitle)_

- Leggi attentamente ogni domanda.
- Scrivi le tue risposte su un foglio o in un file di testo.

> Non guardare le risposte prima di aver completato il quiz: le trovi nella sezione Risposte qui sotto.

**Sezione A: Vero o Falso** _(stepTitle)_

**Domanda 1** _(stepTitle)_

Il linguaggio di configurazione di Terraform è procedurale: richiede di definire i passi specifici e l'ordine delle operazioni per raggiungere lo stato finale desiderato.

- Vero / Falso

**Domanda 2** _(stepTitle)_

Un vantaggio dell'Infrastructure as Code è che permette di usare sistemi di controllo di versione (VCS) per tracciare nel tempo le modifiche alle definizioni dell'infrastruttura.

- Vero / Falso

**Domanda 3** _(stepTitle)_

Con Terraform devi usare una sintassi di comando diversa (es. `terraform aws-plan` vs `terraform azure-plan`) a seconda del cloud provider di destinazione.

- Vero / Falso

**Domanda 4** _(stepTitle)_

L'"idempotenza" offerta da Terraform significa che eseguire `terraform apply` 10 volte di fila porterà alla creazione di 10 insiemi identici di risorse.

- Vero / Falso

**Domanda 5** _(stepTitle)_

Una caratteristica chiave dell'IaC è che l'infrastruttura è definita in file di configurazione leggibili dall'uomo ed eseguibili dalla macchina, anziché tramite operazioni manuali da GUI.

- Vero / Falso

**Sezione B: scelta multipla (una risposta)** _(stepTitle)_

**Domanda 6** _(stepTitle)_

Quale delle seguenti descrive meglio il ruolo del piano di esecuzione nel comando `terraform plan`?

- A. Esegue le chiamate API necessarie per effettuare il provisioning dell'infrastruttura.
- B. Fornisce una stima dei costi dell'infrastruttura da distribuire.
- C. Mostra un'anteprima delle modifiche che Terraform apporterà all'infrastruttura in base alla configurazione e allo state attuali.
- D. Valida la sintassi dei file di configurazione.

**Domanda 7** _(stepTitle)_

Terraform gestisce risorse su più cloud provider (es. AWS e Azure) principalmente tramite l'uso di:

- A. Un unico standard API universale per il cloud.
- B. Variabili d'ambiente specifiche per ogni cloud.
- C. Plugin eseguibili chiamati "Provider".
- D. Una console di gestione centrale su console.terraform.io.

**Domanda 8** _(stepTitle)_

Un'organizzazione usa Terraform per gestire le proprie istanze AWS EC2 e anche le dashboard di monitoraggio Datadog. Quale termine descrive la capacità di Terraform di gestire questi due tipi distinti di servizi con lo stesso workflow?

- A. Provisioning multi-cloud
- B. Deployment hybrid cloud
- C. Workflow service-agnostic
- D. Policy as Code

**Domanda 9** _(stepTitle)_

Qual è il principale vantaggio dell'usare un linguaggio dichiarativo (come HCL) rispetto a uno script procedurale (come Bash) per il provisioning dell'infrastruttura?

- A. I linguaggi dichiarativi eseguono i comandi molto più velocemente degli script procedurali.
- B. I linguaggi dichiarativi ti permettono di specificare quale deve essere il risultato finale, lasciando allo strumento il compito di stabilire come ottenerlo, riducendo il rischio di effetti collaterali.
- C. Gli script procedurali non possono interagire con le API dei cloud provider.
- D. I linguaggi dichiarativi non richiedono una connessione internet.

**Domanda 10** _(stepTitle)_

Hai una configurazione Terraform che ha creato con successo un security group. Elimini per errore questo security group manualmente dalla console AWS. Cosa succede alla successiva esecuzione di `terraform apply`?

- A. Terraform fallirà con un errore perché lo state file è corrotto.
- B. Terraform rileverà la risorsa mancante e proporrà di ricrearla per farla corrispondere alla configurazione.
- C. Terraform non farà nulla perché il file di configurazione non è cambiato.
- D. Terraform eliminerà automaticamente la voce dallo state file.

**Sezione C: risposta multipla (selezionane più di una)** _(stepTitle)_

**Domanda 11** _(stepTitle)_

Quali dei seguenti sono benefici riconosciuti dell'adozione dell'Infrastructure as Code (IaC)? (Selezionane **TRE**)

- A. Riduzione del rischio di errore umano grazie all'automazione.
- B. Zero downtime garantito per tutti i deployment applicativi.
- C. Maggiore velocità ed efficienza nel provisioning degli ambienti.
- D. Generazione automatica del codice sorgente applicativo.
- E. Maggiore coerenza e ripetibilità dei deployment dell'infrastruttura.
- F. Eliminazione di ogni latenza di rete.

**Domanda 12** _(stepTitle)_

Nel contesto dei workflow Terraform, quali due caratteristiche definiscono un approccio a "infrastruttura immutabile"? (Selezionane **DUE**)

- A. Aggiornare i server in-place tramite SSH e strumenti di configuration management.
- B. Sostituire completamente i server quando è richiesta una modifica di configurazione.
- C. Eseguire rolling update su un cluster attivo per ridurre al minimo i disservizi.
- D. Creare nuove risorse prima di distruggere quelle vecchie per evitare downtime.
- E. Affidarsi allo state file per tracciare le modifiche incrementali a un singolo server nel corso della sua vita.

**Domanda 13** _(stepTitle)_

Quali delle seguenti azioni avvengono durante il comando `terraform init`? (Selezionane **DUE**)

- A. Lettura dello state file per determinare il drift delle risorse.
- B. Download e installazione dei plugin dei provider richiesti.
- C. Generazione di un piano di esecuzione per la configurazione corrente.
- D. Inizializzazione della configurazione del backend per l'archiviazione dello state.
- E. Applicazione delle modifiche necessarie a raggiungere lo stato desiderato.

**Domanda 14** _(stepTitle)_

Terraform è considerato "service-agnostic" perché può gestire una varietà di tipi di risorse. Quali dei seguenti sono esempi di risorse che Terraform può gestire con questo workflow unificato? (Selezionane **TRE**)

- A. Istanze di calcolo (es. AWS EC2, Azure VM).
- B. Repository di codice sorgente (es. impostazioni di un repository GitHub).
- C. Regole di monitoraggio e alerting (es. monitor Datadog).
- D. Unità di distribuzione dell'alimentazione (PDU) dei rack dei server fisici.
- E. Record DNS (es. Cloudflare, Route53).

**Domanda 15** _(stepTitle)_

Quando Terraform genera un piano di esecuzione, analizza la configurazione e lo state. Quali delle seguenti azioni potrebbe proporre Terraform in quel piano? (Selezionane **QUATTRO**)

- A. Creare una nuova risorsa che esiste nella configurazione ma non nello state.
- B. Eliminare una risorsa che esiste nello state ma è stata rimossa dalla configurazione.
- C. Aggiornare in-place attributi di una risorsa che sono stati modificati nella configurazione.
- D. Annullare l'ultima esecuzione applicata riportandola a una versione precedente dello state.
- E. Distruggere e ricreare una risorsa perché una modifica non può essere applicata in-place.

---

### Risposte

**Risposte e brevi spiegazioni** _(stepTitle)_

**Sezione A: Vero o Falso** _(stepTitle)_

**D1: FALSO** — Terraform usa un linguaggio **dichiarativo** (HCL), non procedurale. Descrivi lo stato finale desiderato e Terraform determina i passi per raggiungerlo.

**D2: VERO** — L'IaC permette di conservare le definizioni dell'infrastruttura nel controllo di versione (es. Git), offrendo tracciamento delle modifiche, verificabilità e collaborazione.

**D3: FALSO** — Terraform usa la stessa sintassi di comando (`terraform plan`, `terraform apply`) per tutti i provider. I provider sono plugin che gestiscono le API specifiche di ogni cloud.

**D4: FALSO** — Idempotenza significa che eseguire `apply` più volte con la stessa configurazione produce lo stesso stato dell'infrastruttura (nessuna risorsa duplicata). **Non** crea nuove risorse ogni volta.

**D5: VERO** — L'IaC definisce l'infrastruttura in file di configurazione leggibili dall'uomo ed eseguibili dalla macchina, sostituendo le operazioni manuali da GUI.

**Sezione B: scelta multipla (una risposta)** _(stepTitle)_

**D6: C** — Il piano di esecuzione mostra un'anteprima delle modifiche che Terraform apporterà in base alla configurazione e allo state attuale. Non esegue modifiche (A), di default non fornisce stime dei costi (B) e la validazione è un comando separato (D).

**D7: C** — I provider sono plugin eseguibili che traducono le configurazioni Terraform in chiamate API specifiche per ogni cloud o servizio (AWS, Azure, ecc.).

**D8: C** — Workflow service-agnostic significa che Terraform usa lo stesso workflow (write, plan, apply) indipendentemente dal tipo di servizi gestiti (calcolo, monitoraggio, DNS, ecc.).

**D9: B** — I linguaggi dichiarativi si concentrano su **cosa** deve essere il risultato finale; lo strumento decide **come** ottenerlo. Questo riduce gli effetti collaterali e rende le configurazioni più facili da comprendere.

**D10: B** — Durante `apply`, Terraform aggiorna lo state e rileva che il security group non esiste più. Proporrà di **ricreare** la risorsa per farla corrispondere alla configurazione.

**Sezione C: risposta multipla** _(stepTitle)_

**D11: A, C, E** — I benefici riconosciuti dell'IaC includono la riduzione dell'errore umano (A), maggiore velocità ed efficienza (C) e maggiore coerenza/ripetibilità (E). Lo zero downtime (B) non è garantito, la generazione di codice applicativo (D) non è un beneficio dell'IaC e la latenza di rete (F) non ne è influenzata.

**D12: B, D** — L'infrastruttura immutabile sostituisce interi server a ogni modifica (B) e spesso crea nuove risorse prima di distruggere quelle vecchie (D) per evitare downtime. (A descrive l'infrastruttura mutabile; C è una strategia di deployment ma non una caratteristica che definisce l'immutabilità; E descrive il tracciamento di uno stato mutabile.)

**D13: B, D** — `terraform init` scarica e installa i plugin dei provider (B) e inizializza il backend per l'archiviazione dello state (D). La lettura dello state (A), la generazione di un piano (C) e l'applicazione delle modifiche (E) avvengono in `plan` o `apply`.

**D14: A, C, E** — Terraform può gestire istanze di calcolo (A), regole di monitoraggio (C) e record DNS (E). Anche se può gestire pure i repository di codice sorgente (B), la domanda chiede **tre** esempi; A, C ed E sono tipi classici di risorse infrastrutturali. (Le PDU dei server fisici (D) non sono tipicamente gestite da Terraform.)

**D15: A, B, C, E** — I piani di Terraform possono proporre di **creare** nuove risorse (A), **eliminare** risorse rimosse dalla configurazione (B), **aggiornare in-place** attributi modificati (C) e **distruggere e ricreare** una risorsa quando una modifica non può essere applicata in-place (E). Il rollback a una versione precedente dello state (D) non è un'azione del piano.

---

> Com'è andata? Speriamo che tu abbia risposto correttamente alla maggior parte delle domande! Altrimenti, rivedi le spiegazioni e torna sulle sezioni pertinenti della guida. Se ti servono ulteriori spiegazioni, consulta la documentazione ufficiale linkata in questa guida.

Passiamo all'Obiettivo 2: comprendere i componenti principali e l'architettura di Terraform.
