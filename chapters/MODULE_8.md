# Modulo 8 — HCP Terraform

_Obiettivo 8 dell'esame: usare HCP Terraform per creare infrastruttura (8a), descrivere le funzionalità di collaborazione e governance di HCP Terraform (8b), descrivere come organizzare e usare workspace e project di HCP Terraform (8c), configurare e usare l'integrazione con HCP Terraform (8d)._

---

## 8.1 — Che cos'è HCP Terraform

HCP Terraform è un'applicazione che aiuta i team a usare Terraform per creare l'infrastruttura, collaborando, gestendo lo state remoto e automatizzando i workflow.

HCP Terraform aiuta i team a usare Terraform insieme. Gestisce i run di Terraform in un ambiente coerente e affidabile, e offre:

- accesso semplice allo state condiviso e ai dati segreti;
- controlli di accesso per approvare le modifiche all'infrastruttura;
- un registry privato per condividere i moduli Terraform;
- controlli dettagliati delle policy per governare il contenuto delle configurazioni Terraform;
- altro ancora.

HCP Terraform è disponibile come servizio ospitato all'indirizzo `https://app.terraform.io`. I team piccoli possono iscriversi gratuitamente per collegare Terraform al controllo versione, condividere le variabili, eseguire Terraform in un ambiente remoto stabile e conservare in modo sicuro lo state remoto. Le edizioni a pagamento permettono di aggiungere più di cinque utenti, creare team con diversi livelli di permessi e collaborare in modo più efficace. HCP Terraform Standard Edition permette alle organizzazioni di abilitare l'audit logging, la validazione continua e la drift detection automatica della configurazione.

> **Nota**: dal 22 aprile 2024 Terraform Cloud si chiama HCP Terraform. Le funzionalità restano le stesse. La frase sui "più di cinque utenti" riflette il vecchio piano gratuito: secondo la pagina dei piani (sezione 8.2), oggi il piano Free è limitato a 500 managed resource.
_(infoBox)_

### 8.1.1 — Che cos'è Terraform Enterprise

Le organizzazioni con esigenze avanzate di sicurezza e compliance possono acquistare Terraform Enterprise, la distribuzione self-hosted di HCP Terraform. Offre alle aziende un'istanza privata che include le funzionalità avanzate disponibili in HCP Terraform. Requisiti, architetture di riferimento e istruzioni di installazione sono nella documentazione di Terraform Enterprise.

### 8.1.2 — HCP Terraform in Europa

HashiCorp Cloud Platform (HCP) supporta la gestione dell'infrastruttura in Europa. Con HCP Europe le risorse sono ospitate, gestite e fatturate separatamente, per rispettare i requisiti europei di residenza dei dati. HCP Terraform è disponibile in HCP Europe. Si possono quindi gestire le risorse Terraform in Europa con i workflow abituali, rispettando ulteriori normative su dati e privacy.

- Fonte: [What is HCP Terraform?](https://developer.hashicorp.com/terraform/cloud-docs)

---

## 8.2 — I piani di abbonamento di HCP Terraform

HCP Terraform è una piattaforma che usa Terraform per creare e gestire l'infrastruttura, su richiesta o in risposta a vari eventi. A differenza di un sistema di continuous integration (CI) generico, è profondamente integrata con i workflow e i dati di Terraform.

### 8.2.1 — I piani

HCP Terraform offre i piani di abbonamento Free, Essentials, Standard e Premium, ognuno con funzionalità e limiti di risorse diversi. HCP Terraform gestisce piani e fatturazione a livello di organizzazione. Ogni utente può appartenere a più organizzazioni, che possono avere piani di fatturazione diversi, quindi le funzionalità disponibili dipendono dall'organizzazione in cui si lavora. Le organizzazioni HCP Europe, riconoscibili dagli URL `portal.cloud.eu.hashicorp` o `app.eu.terraform.io`, supportano piani di fatturazione a contratto specifici.

- **Free**: i team che iniziano con l'infrastructure as code possono usare gratuitamente la maggior parte delle funzionalità di HCP Terraform. Sono comprese l'esecuzione remota, l'integrazione con il VCS, il registry privato dei moduli, il single sign-on, il policy enforcement e le run task. Le organizzazioni gratuite sono limitate a 500 managed resource. Il piano è adatto a singoli, piccoli team e organizzazioni che valutano HCP Terraform.
- **Essentials**: comprende tutte le funzionalità del piano Free più funzionalità di collaborazione aggiuntive per i team in crescita, con fatturazione pay-as-you-go basata sulle managed resource.
- **Standard**: comprende tutte le funzionalità di Essentials più funzionalità avanzate di governance e compliance. È pensato per i team che hanno bisogno di policy enforcement, stima dei costi e sicurezza avanzata.
- **Premium**: comprende tutte le funzionalità di Standard più funzionalità di livello enterprise, come l'audit logging, il RBAC personalizzato e il supporto prioritario. È pensato per le grandi organizzazioni con requisiti complessi di compliance e governance.

### 8.2.2 — Confronto dei piani

| **Funzionalità** | **Free** | **Essentials** | **Standard** | **Premium** |
|---|---|---|---|---|
| Managed resource | Fino a 500 | Illimitate | Illimitate | Illimitate |
| Esecuzione remota, integrazione VCS, registry privato, gestione dei team, run task, SSO (SAML) | ✓ | ✓ | ✓ | ✓ |
| Run concorrenti | 1 remoto, 1 agent | 3 remoti, 1 agent | 10 remoti, 10 agent | 200 remoti, 300 agent |
| Policy enforcement | — | — | ✓ | ✓ |
| Stima dei costi | — | — | ✓ | ✓ |
| Audit logging | — | — | — | ✓ |
| RBAC personalizzato | — | ✓ | ✓ | ✓ |
| Supporto prioritario | — | — | — | ✓ |

> **Nota**: la pagina non è del tutto coerente. Il testo del piano Free cita il policy enforcement, che la tabella indica solo da Standard. La tabella dei limiti indica i team come non disponibili nel piano Free, mentre la tabella di confronto spunta la gestione dei team.
_(infoBox)_

### 8.2.3 — Modelli di fatturazione e prezzi

HCP Terraform offre due modelli di fatturazione:

- **Pay-as-you-go**: addebita ogni mese in base all'uso effettivo delle managed resource, calcolato su base oraria. È adatto alle organizzazioni con esigenze infrastrutturali variabili, o che vogliono iniziare in piccolo e crescere gradualmente.
- **HashiCorp Flex**: prezzi su uso impegnato, con sconti sui volumi. È adatto alle organizzazioni con esigenze prevedibili, che vogliono ottimizzare i costi con impegni annuali.

Le organizzazioni con accordi enterprise possono definire con il team vendite di HashiCorp piani a contratto personalizzati, con sconti sui volumi, uso impegnato e funzionalità incluse.

I prezzi dei piani Essentials, Standard e Premium si basano sulle managed resource. HashiCorp addebita ogni managed resource su base oraria, dal momento della creazione alla distruzione. Ogni ora parziale è fatturata come un'ora intera, e il numero massimo di managed resource nell'ora ne determina il costo. Il piano Free non ha costi fino a 500 managed resource. Il piano Essentials è pay-as-you-go per managed resource all'ora. Per i piani Standard e Premium bisogna contattare il team vendite. La fatturazione è mensile, e l'uso attuale si vede nel portale di HashiCorp Cloud Platform, aggiornato ogni ora.

### 8.2.4 — Le managed resource

Una managed resource è una risorsa di un file di state gestito da HCP Terraform con `mode = "managed"`. HCP Terraform la conta dal primo `terraform plan` o `terraform apply` sulla risorsa, e nel calcolo dei costi somma le risorse gestite dai workspace e dagli Stack. Contano come managed resource:

- le risorse create da un provider Terraform, ad esempio una VPC AWS;
- le risorse create con i meta-argomenti `count` e `for_each`;
- le risorse create da moduli e da moduli no-code ready.

Non contano invece:

- le risorse `null_resource`;
- le risorse `terraform_data`;
- i data source (`mode = "data"`);
- i local value e le variabili.

Il numero di managed resource si vede nella pagina **Usage report**.

### 8.2.5 — Limiti tecnici

| **Limite** | **Free** | **Essentials** | **Standard** | **Premium** |
|---|---|---|---|---|
| Workspace, Stack, project, membri dei team | Illimitati | Illimitati | Illimitati | Illimitati |
| Run remoti concorrenti | 1 | 3 | 10 | 200 |
| Run agent concorrenti | 1 | 1 | 10 | 300 |
| Concorrenza aggiuntiva | No | No | Acquistabile | Acquistabile |
| Richieste API al minuto | 30 | 30 | 30 | 30 |
| Team | No | Illimitati | Illimitati | Illimitati |
| Policy set e policy per set | No | No | Illimitati | Illimitati |

### 8.2.6 — Il workflow Terraform in HCP Terraform

HCP Terraform esegue la CLI di Terraform per creare l'infrastruttura. Nella configurazione predefinita, la CLI di Terraform usa un workflow locale: esegue le operazioni sulla postazione da cui viene lanciata e conserva lo state in una directory locale. HCP Terraform organizza e gestisce l'infrastruttura con workspace o Stack:

- i **workspace** gestiscono un'infrastruttura autonoma di un solo modulo root Terraform;
- gli **Stack** gestiscono più moduli di infrastruttura e ripetono quell'infrastruttura su larga scala.

Lavorare con Terraform in team richiede un workflow remoto. HCP Terraform offre un workflow remoto orientato ai team, pensato sia per gli utenti esistenti di Terraform sia per i nuovi.

**Esecuzione remota** _(stepTitle)_

Per default, HCP Terraform esegue Terraform su macchine virtuali usa e getta nella propria infrastruttura cloud. Con gli agent di HCP Terraform si può eseguire Terraform sulla propria infrastruttura isolata, privata o on-premises. L'esecuzione remota garantisce coerenza e visibilità per le operazioni di provisioning critiche (sezione 8.3). Per singoli workspace si può disabilitare l'esecuzione remota, cambiando l'impostazione **Execution mode**. Il workspace ospita comunque lo state remoto, e la CLI di Terraform può usarlo per i run locali tramite l'integrazione con HCP Terraform.

**Organizzare l'infrastruttura con i project** _(stepTitle)_

Il workflow locale di Terraform gestisce un insieme di infrastruttura con una directory di lavoro persistente, che contiene configurazione, dati di state e variabili. Si possono usare directory separate per organizzare le risorse in gruppi significativi, e Terraform usa la configurazione della directory da cui si lanciano i comandi.

HCP Terraform organizza l'infrastruttura in project, che contengono workspace e Stack. Ogni workspace contiene tutto il necessario per gestire una singola configurazione Terraform. Gli Stack usano un'architettura a componenti basata sui moduli per distribuire ripetutamente l'infrastruttura, e così Terraform gestisce l'infrastruttura su larga scala.

I project servono a raggruppare workspace e Stack. Le organizzazioni con HCP Terraform Essentials possono assegnare ai team permessi su project specifici. I project permettono di dare accesso a insiemi di workspace e Stack, invece di usare permessi sui singoli workspace o su tutta l'organizzazione. Così è più facile limitare l'accesso alle sole risorse necessarie alla funzione di ogni membro del team (sezione 8.15).

**Gestione dello state remoto** _(stepTitle)_

HCP Terraform fa da backend remoto per lo state di Terraform. Nei workspace, lo storage dello state è legato al workspace, così lo state resta associato alla configurazione che l'ha creato. Negli Stack, ogni deployment conserva e aggiorna il proprio state remoto isolato.

I workspace possono condividere informazioni tra loro con gli output di primo livello (root-level). Gruppi separati di risorse hanno spesso bisogno di condividere una piccola quantità di informazioni, e gli output dei workspace offrono un'interfaccia per queste dipendenze. I workspace che usano le remote operations possono usare i data source `terraform_remote_state` per accedere agli output di altri workspace, nei limiti dei controlli di accesso di ogni workspace. Le informazioni di un workspace possono cambiare lo stato desiderato dell'infrastruttura in un altro. Per questo si possono creare run trigger tra workspace, così i workspace a valle reagiscono quando cambiano le loro dipendenze (sezione 8.13). Anche gli Stack possono condividere direttamente informazioni con gli altri Stack dello stesso project.

**Integrazione con il controllo versione** _(stepTitle)_

HCP Terraform è progettato per lavorare direttamente con il proprio provider VCS. Ogni workspace si può collegare a un repository VCS che ne contiene la configurazione, indicando facoltativamente un branch e una sottodirectory; anche gli Stack si possono collegare a un repository VCS. Per default HCP Terraform recupera automaticamente il contenuto della configurazione dai repository collegati e ne osserva le modifiche:

- quando i commit vengono uniti (merge), i workspace e gli Stack collegati eseguono automaticamente i plan di Terraform con il nuovo codice;
- quando vengono aperte le pull request, i workspace e gli Stack collegati eseguono speculative plan con le modifiche proposte, e ne pubblicano i risultati come check della pull request. I revisori vedono a colpo d'occhio se il plan è riuscito, e con un clic vedono le modifiche proposte nel dettaglio.

L'integrazione con il VCS è facoltativa. Se si usa un VCS non supportato, o si vuole conservare una pipeline di validazione e deployment esistente, si possono caricare nuove configuration version con l'API o con la CLI di Terraform. Si mantengono comunque i vantaggi dell'esecuzione remota e delle altre funzionalità di HCP Terraform.

**Integrazione con la riga di comando** _(stepTitle)_

L'esecuzione remota avvantaggia i team, quella locale i singoli sviluppatori. Ad esempio, la maggior parte degli utenti di Terraform esegue `terraform plan` per controllare in modo interattivo il proprio lavoro mentre modifica le configurazioni. HCP Terraform permette di eseguire plan remoti dalla riga di comando locale. I run remoti guidati dalla CLI usano la configurazione Terraform della directory di lavoro corrente e le variabili del workspace remoto. Così non servono le credenziali cloud di produzione per vedere in anteprima una modifica alla configurazione. L'integrazione della CLI con HCP Terraform supporta anche i comandi di manipolazione dello state, come `terraform import` o `terraform taint`. Per gli Stack si usano i comandi `terraform stacks`.

**Registry privato** _(stepTitle)_

I team traggono vantaggio dal codificare gli schemi di infrastruttura più usati in moduli riutilizzabili. Terraform può recuperare provider e moduli da molte sorgenti, e HCP Terraform offre un registry privato per trovarli. Gli utenti dell'organizzazione possono consultare un catalogo di provider e moduli interni, e indicare vincoli di versione flessibili per i moduli che usano nelle configurazioni. Il versionamento permette di usare i moduli privati con fiducia, e lascia ai creatori dei moduli la libertà di iterare più in fretta. Il registry privato usa il VCS come fonte di verità, e si basa sui tag Git per gestire le versioni dei moduli (sezione 8.29).

### 8.2.7 — Integrazioni

HCP Terraform estende il core workflow di Terraform e integra il provisioning dell'infrastruttura dei workspace con gli altri sistemi dell'azienda:

- **API completa**: quasi tutte le funzionalità di HCP Terraform sono disponibili nell'API. Altri servizi possono quindi creare o configurare workspace o Stack, caricare configurazioni, avviare run di Terraform e altro. Il provider Terraform basato sull'API permette di gestire team e workspace di HCP Terraform come configurazione Terraform.
- **Notifiche**: HCP Terraform può inviare notifiche sui run dei workspace ad altri sistemi, tra cui Slack e qualsiasi altro servizio che accetti webhook. Le notifiche si configurano per workspace.
- **Run task**: le run task permettono ai workspace di eseguire attività in sistemi esterni, in punti specifici del ciclo di vita del run di HCP Terraform. Sono già disponibili diverse integrazioni dei partner, oppure se ne possono creare di proprie basate sull'API.

### 8.2.8 — Controllo degli accessi e governance

Le organizzazioni più grandi sono più complesse, e tendono a usare controlli di accesso e policy esplicite per gestire questa complessità. I piani a pagamento di HCP Terraform offrono funzionalità extra per le esigenze di controllo e governance delle grandi organizzazioni.

- **Permessi basati sui team**: con la gestione dei team si definiscono gruppi di utenti che corrispondono ai team reali dell'organizzazione, e si assegnano loro solo i permessi necessari. Insieme ai controlli di accesso al codice già offerti dal provider VCS, i permessi su workspace, project e Stack sono un modo efficace per seguire il principio del privilegio minimo (sezione 8.20).
- **Policy enforcement**: la policy-as-code permette di definire e imporre policy granulari sui workspace, per controllare come l'organizzazione crea l'infrastruttura. Ad esempio, si può limitare la dimensione delle VM o confinare gli aggiornamenti importanti in finestre di manutenzione definite. Le policy si definiscono con i framework di policy-as-code Sentinel e Open Policy Agent (OPA). A seconda delle impostazioni, possono essere avvisi consultivi, requisiti rigidi che impediscono a Terraform di creare l'infrastruttura, o requisiti morbidi che il team di compliance può aggirare quando opportuno (sezione 8.27). HCP Terraform Free include un policy set con al massimo cinque policy. In Standard e Premium si può collegare un policy set a un repository di controllo versione, o creare versioni del policy set con l'API.
- **Stima dei costi**: prima di modificare l'infrastruttura nei principali cloud provider, i workspace possono mostrare una stima del costo totale e della variazione di costo dovuta agli aggiornamenti proposti. Le stime dei costi si possono usare anche nelle policy Sentinel, per avvisare in caso di grandi variazioni di prezzo.

- Fonte: [HCP Terraform subscription plans](https://developer.hashicorp.com/terraform/cloud-docs/overview)

---

## 8.3 — Le remote operations

HCP Terraform offre un'interfaccia centrale per eseguire Terraform in una grande organizzazione collaborativa. Per chi è abituato a eseguire Terraform dalla propria postazione, il modo in cui HCP Terraform gestisce i run può risultare insolito. Questa pagina descrive le basi del funzionamento dei run in HCP Terraform.

### 8.3.1 — Le remote operations

HCP Terraform è progettato come piattaforma di esecuzione per Terraform, e può eseguire i run di Terraform su proprie macchine virtuali usa e getta. Offre così un ambiente di esecuzione coerente e affidabile, e abilita funzionalità avanzate come il policy enforcement con Sentinel, la stima dei costi, le notifiche e l'integrazione con il controllo versione.

I run di Terraform gestiti da HCP Terraform si chiamano **remote operations**. I run remoti si possono avviare con i webhook del provider VCS, con i controlli dell'interfaccia di HCP Terraform, con chiamate API o con la CLI di Terraform. Quando si usa la CLI per le remote operations, l'avanzamento del run viene trasmesso nel terminale dell'utente, con un'esperienza equivalente alle operazioni locali.

**Disabilitare le remote operations** _(stepTitle)_

Molte funzionalità di HCP Terraform si basano sull'esecuzione remota, e non sono disponibili con le operazioni locali, ad esempio il policy enforcement con Sentinel, la stima dei costi e le notifiche. Le remote operations si disabilitano per qualsiasi workspace, impostandone l'**Execution Mode** su **Local**. Così il workspace fa solo da backend remoto per lo state di Terraform, e tutta l'esecuzione avviene sulle proprie postazioni o sui worker di continuous integration.

**Proteggere gli ambienti privati** _(stepTitle)_

Gli agent di HCP Terraform sono una funzionalità a pagamento, che permette a HCP Terraform di comunicare con infrastruttura isolata, privata o on-premises. L'agent interroga HCP Terraform o Terraform Enterprise per sapere se ci sono modifiche alla configurazione, ed esegue le modifiche in locale. Così non serve consentire traffico pubblico in ingresso verso le risorse, e si controlla l'infrastruttura negli ambienti privati senza modificare il perimetro di rete. Gli agent supportano anche l'esecuzione di programmi personalizzati, chiamati hook, in punti strategici di un run. Ad esempio, un hook può scaricare dinamicamente il software necessario al run, o inviare una richiesta HTTP a un sistema per avviare un workflow esterno.

### 8.3.2 — Run e workspace

HCP Terraform esegue sempre i run di Terraform nel contesto di un workspace. Il workspace ha lo stesso ruolo di una directory di lavoro persistente quando si esegue Terraform in locale: fornisce la configurazione, lo state e le variabili del run.

**Configuration version** _(stepTitle)_

Ogni workspace è associato a una particolare configurazione Terraform, ma ci si aspetta che la configurazione cambi nel tempo. Per questo HCP Terraform gestisce le configurazioni come una serie di **configuration version**. Di solito un workspace è collegato a un repository VCS, e le sue configuration version sono legate alle revisioni del branch VCS indicato. Nei workspace non collegati a un repository, le nuove configuration version si caricano con la CLI di Terraform o con l'API.

**Ordine e tempistica** _(stepTitle)_

Ogni workspace di HCP Terraform mantiene una propria coda di run, e li elabora in ordine. Ogni nuovo run viene aggiunto in fondo alla coda. Se c'è già un run in corso, il nuovo run non parte finché quello corrente non è completamente finito. HCP Terraform non esegue nemmeno il plan del nuovo run, perché il run corrente potrebbe cambiare ciò che farebbe un run futuro. I run in attesa che altri run finiscano sono in stato pending, e un workspace può avere un numero qualsiasi di run in attesa. Ci sono due eccezioni alla coda dei run, che possono procedere in qualsiasi momento e non bloccano gli altri run:

- i run plan-only;
- le fasi di plan dei run con piano salvato. Un piano salvato si può applicare solo se non è in corso nessun altro run, e l'apply blocca la coda come di consueto; Terraform Enterprise non supporta ancora questo workflow.

Quando si avvia un run, HCP Terraform lo vincola a una particolare configuration version e a un insieme di valori delle variabili. Se si cambiano le variabili o si fa commit di nuovo codice prima della fine del run, la modifica vale solo per i run futuri, non per quelli già pending, in plan o in attesa di apply.

**Lock dei workspace** _(stepTitle)_

Quando un workspace è bloccato (locked), HCP Terraform può creare nuovi run, automaticamente o a mano, ma non li avvia finché il workspace non viene sbloccato. Un run in corso blocca il workspace, come descritto sopra. I run plan-only e le fasi di plan dei run con piano salvato possono ignorare il lock del workspace. Un piano salvato si può applicare solo se il workspace è sbloccato, e l'apply blocca il workspace come di consueto. Un utente o un team può anche bloccare deliberatamente un workspace, per manutenzione o per qualsiasi altro motivo.

### 8.3.3 — Avviare i run

HCP Terraform ha tre workflow principali per gestire i run, e il workflow scelto determina quando e come avvengono:

- il workflow **UI/VCS-driven**, la modalità operativa principale;
- il workflow **API-driven**, più flessibile ma che richiede di creare alcuni strumenti;
- il workflow **CLI-driven**, che usa gli strumenti standard della CLI di Terraform per eseguire i run in HCP Terraform.

I run si avviano con il pulsante **+ New run** nella pagina del workspace, con i webhook del VCS, con il comando `terraform apply` quando l'integrazione della CLI è configurata, o chiamando l'API Runs con qualsiasi strumento API.

### 8.3.4 — Plan e apply

HCP Terraform impone la separazione di Terraform tra plan e apply: esegue sempre prima il plan, e poi ne usa l'output per l'apply. Nella configurazione predefinita, HCP Terraform attende l'approvazione dell'utente prima dell'apply, ma i workspace si possono configurare per applicare automaticamente i plan riusciti. Alcuni plan non si possono applicare automaticamente, come quelli accodati da run trigger o da utenti senza permesso di applicare i run del workspace. Se un plan non contiene modifiche, HCP Terraform non cerca di applicarlo, e il run termina con lo stato *Planned and finished*. La modalità allow empty apply può cambiare questo comportamento.

**Speculative plan** _(stepTitle)_

Oltre ai run normali, HCP Terraform può eseguire speculative plan, per testare le modifiche alla configurazione durante la scrittura e la code review. Gli speculative plan sono run plan-only. Mostrano le modifiche possibili e le policy interessate da quelle modifiche, ma non possono applicare nessuna modifica. Possono iniziare senza attendere la fine degli altri run, perché non toccano l'infrastruttura reale, e HCP Terraform elenca gli speculative plan passati insieme agli altri run del workspace. Ci sono tre modi per eseguirli:

- nei workspace collegati al VCS, le pull request avviano speculative plan, e l'interfaccia della pull request del provider VCS contiene un link al plan;
- con l'integrazione della CLI configurata, `terraform plan` dalla riga di comando avvia uno speculative plan. L'output viene trasmesso nel terminale, insieme a un link al plan;
- l'API dei run crea speculative plan quando la configuration version indicata è marcata come speculative (si veda l'API `configuration-versions`).

Se uno speculative plan fallisce per un fattore esterno, lo si può rieseguire con il pulsante **Retry Run** nella sua pagina. Serve il permesso di accodare plan per il workspace, e si possono riprovare solo i plan falliti o annullati. Il nuovo tentativo crea un nuovo run con la stessa configuration version. In un workspace collegato al VCS, l'interfaccia della pull request riceve lo stato del nuovo run con un link.

**Saved plan** _(stepTitle)_

I run con piano salvato dalla CLI richiedono almeno la CLI di Terraform v1.6.0. Con l'integrazione della CLI configurata, `terraform plan -out <FILE>` esegue e salva un piano, `terraform apply <FILE>` applica il piano salvato e `terraform show <FILE>` lo ispeziona prima dell'apply. Dall'API si usa l'opzione `save-plan`. I run con piano salvato interagiscono con la coda dei run in modo diverso dai run normali, e a volte vengono scartati automaticamente (sezione 6.10.4).

### 8.3.5 — Planning mode, stati dei run e import

HCP Terraform supporta anche i run di distruzione, i run refresh-only e diverse opzioni di pianificazione che modificano il comportamento di un run (sezione 6.10).

HCP Terraform mostra l'avanzamento di ogni run attraverso i suoi stati: pending, plan, policy check, apply e completamento. In alcuni stati il run può richiedere una conferma prima di continuare o terminare. Nell'elenco dei workspace della pagina principale, ogni workspace mostra lo stato del run che sta elaborando, o, se non c'è un run in corso, quello dell'ultimo run completato.

Per importare risorse in HCP Terraform è consigliato usare i blocchi `import`, introdotti in Terraform 1.5. HCP Terraform non supporta l'esecuzione remota del comando `terraform import`. Per questo comando il workspace fa solo da backend remoto dello state, e tutta l'esecuzione avviene sulle proprie postazioni o sui worker di CI. `terraform import` gira in locale, quindi le variabili d'ambiente definite nel workspace non sono disponibili. Le variabili d'ambiente richieste dal provider da cui si importa vanno definite nell'ambiente di esecuzione locale.

- Fonte: [Remote operations](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/run/remote-operations)

---

## 8.4 — Usare HCP Terraform con la CLI di Terraform

L'integrazione della CLI di Terraform con HCP Terraform permette di usare HCP Terraform e Terraform Enterprise dalla riga di comando. Nella documentazione, le istruzioni per HCP Terraform valgono anche per Terraform Enterprise, salvo dove indicato esplicitamente.

Usare HCP Terraform dalla riga di comando si chiama **CLI-driven run workflow**. Con il workflow CLI, operazioni come `terraform plan` o `terraform apply` vengono eseguite per default in remoto, nell'ambiente di esecuzione di HCP Terraform, con l'output dei log trasmesso nel terminale locale. Così si usano le funzionalità di HCP Terraform nel workflow abituale della CLI di Terraform, tra cui le variabili cifrate a riposo in un workspace HCP Terraform, le stime dei costi e il controllo delle policy.

I workspace si possono anche configurare per l'esecuzione locale. In quel caso HCP Terraform conserva solo lo state, e si comporta come un normale backend di state.

> **Nota**: l'integrazione della CLI è disponibile in Terraform 1.1.0 e successivi, e in Terraform Enterprise 202201-1 e successivi. Le versioni precedenti possono usare il backend `remote`.
_(infoBox)_

La documentazione dell'integrazione comprende la pagina sul blocco `cloud` da aggiungere alla configurazione per abilitare HCP Terraform (sezione 8.9). Comprende anche l'elenco delle opzioni dei comandi Terraform specifiche per l'uso con HCP Terraform, e la descrizione del CLI-driven run workflow.

- Fonte: [Use HCP Terraform with the Terraform CLI](https://developer.hashicorp.com/terraform/cli/v1.12.x/cloud)

---

## 8.5 — Il comando terraform login

Il comando `terraform login` ottiene un token API per HCP Terraform, Terraform Enterprise o un altro host che offre servizi Terraform. Lo si può usare solo in scenari interattivi, perché il comando apre un browser web sullo stesso host su cui gira Terraform. Se Terraform gira in uno scenario di automazione non presidiato, le credenziali si configurano a mano nella configurazione della CLI.

### 8.5.1 — Uso

La sintassi è `terraform login [hostname]`. Se non si indica un hostname, Terraform presume che si voglia accedere a HCP Terraform su `app.terraform.io`.

### 8.5.2 — Conservazione delle credenziali

Per default, Terraform ottiene un token API e lo salva in chiaro in un file di configurazione locale della CLI, chiamato `credentials.tfrc.json`. Quando si esegue `terraform login`, Terraform spiega dove intende salvare il token API, e permette di annullare se la configurazione attuale non è quella desiderata. Se non si vuole conservare il token API nella posizione predefinita, si può configurare un programma credentials helper. Il programma sa conservare e poi recuperare le credenziali in un altro sistema, come il sistema di gestione dei segreti già usato dall'organizzazione.

Il comando `terraform login` funziona con qualsiasi server che supporti il protocollo di login, compresi HCP Terraform e Terraform Enterprise.

- Fonte: [terraform login command](https://developer.hashicorp.com/terraform/cli/v1.12.x/commands/login)

---

## 8.6 — Collaborare con HCP Terraform

Nei tutorial precedenti della raccolta Get Started su AWS si è usato Terraform per creare, gestire e distruggere l'infrastruttura dalla macchina locale (sezioni 3.2 e 3.12). Gestire i workspace Terraform dalla macchina locale crea un singolo punto di guasto, e rende difficile collaborare con il team sui progetti di infrastruttura.

HCP Terraform permette di collaborare sui progetti di infrastruttura all'interno dell'organizzazione. Offre un ambiente di esecuzione remota sicuro, in cui gestire insieme le modifiche all'infrastruttura. Conserva inoltre in modo sicuro lo state e le variabili di Terraform, compresi token API e chiavi di accesso. La CLI di Terraform si integra con HCP Terraform, quindi i run remoti si avviano dalla macchina locale.

Nel tutorial si migra il workspace locale in HCP Terraform e si usa il workflow CLI-driven per avviare i run. HCP Terraform supporta anche il provisioning con un workflow API-driven, o con il workflow VCS-driven, che avvia i run per ogni modifica a un repository configurato.

### 8.6.1 — Creare le risorse e accedere a HCP Terraform

Nel tutorial precedente si era distrutta l'infrastruttura, quindi si riapplica la configurazione per ricreare la VPC e le risorse correlate. Poi si migra lo state del workspace locale in HCP Terraform.

Serve un account HCP Terraform. Dopo l'iscrizione si riceve un'email per confermare l'indirizzo, e il link di conferma porta alla pagina **Organizations**, dove con **Create organization** si crea una nuova organizzazione. Poi si accede all'account HCP Terraform dalla CLI con `terraform login`. Rispondendo `yes`, Terraform apre una finestra del browser per creare un token API. Lo si genera seguendo il workflow nel browser, e lo si incolla nel terminale quando Terraform lo chiede. Terraform non mostra il token sullo schermo, e lo salva in chiaro nel file `credentials.tfrc.json` per i comandi successivi.

### 8.6.2 — Collegare il workspace a HCP Terraform

Per collegare il workspace a HCP Terraform bisogna aggiornare la configurazione e reinizializzare il workspace dalla riga di comando. I workspace HCP Terraform funzionano come i workspace Terraform locali, ma eseguono le operazioni di Terraform e conservano lo state in HCP Terraform. HCP Terraform supporta anche il raggruppamento dei workspace in project, per gestirne più facilmente accessi e impostazioni. Si aggiorna il blocco `terraform` in `terraform.tf`, aggiungendo un blocco `cloud` che collega il workspace locale a HCP Terraform, con il nome della propria organizzazione al posto di `your-organization-name`:

```
terraform {
  cloud {
    organization = "your-organization-name"

    workspaces {
      project = "Learn Terraform"
      name = "learn-terraform-aws-get-started"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.92"
    }
  }

  required_version = ">= 1.2.0"
}
```

**Migrare in HCP Terraform** _(stepTitle)_

Configurata l'integrazione, si esegue `terraform init` per reinizializzare la configurazione e copiare lo state in HCP Terraform, confermando la migrazione con `yes`. Quando si esegue `terraform init` dopo aver aggiunto un blocco `cloud`, Terraform crea il nuovo project e il nuovo workspace se non esistono già, o usa quelli esistenti.

**Configurare le credenziali AWS** _(stepTitle)_

`terraform init` ha creato il project **Learn Terraform** e il workspace `learn-terraform-aws-get-started` nell'organizzazione. Perché HCP Terraform possa autenticarsi con il provider AWS e creare le risorse, bisogna configurare il workspace con le credenziali AWS. Nella pagina **Variables** del workspace, sotto **Workspace Variables**, si aggiungono `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` come **Environment Variables**, marcandole come **Sensitive**.

![Figura 17](img/hcp-workspace-variables.png) _(dimensioni: 2936×1568 px)_

*Figura 17 — La pagina Variables del workspace, con le credenziali AWS aggiunte come environment variable sensitive. Fonte: HashiCorp Developer.* _(caption)_

**Applicare la configurazione** _(stepTitle)_

Ora si aggiorna e si applica la configurazione con HCP Terraform. Si decommentano in `main.tf` la configurazione dell'istanza EC2 e in `outputs.tf` l'output `instance_hostname`:

```
resource "aws_instance" "app_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  vpc_security_group_ids = [module.vpc.default_security_group_id]
  subnet_id              = module.vpc.private_subnets[0]

  tags = {
    Name = var.instance_name
  }
}
```

```
output "instance_hostname" {
  description = "Private DNS name of the EC2 instance."
  value       = aws_instance.app_server.private_dns
}
```

`terraform apply` avvia un run in HCP Terraform, e alla richiesta di conferma si risponde `yes`. Terraform esegue plan e apply in remoto, in HCP Terraform, e trasmette l'output nella finestra del terminale. Ora Terraform conserva lo state del workspace in remoto, in HCP Terraform, e all'URL stampato da Terraform si vede il run in HCP Terraform. Con il workflow CLI-driven si eseguono i comandi di Terraform dalla macchina locale, e HCP Terraform li esegue e ne trasmette l'output alla CLI. In HCP Terraform si possono anche rivedere i risultati dei run di plan e apply e configurare il workspace.

Per pulire l'ambiente, `terraform destroy` fa distruggere a HCP Terraform tutte le risorse che gestisce nel workspace. Poi si elimina il workspace dalla scheda **Settings > Destruction and Deletion** con **Delete from HCP Terraform**. Anche il project si può eliminare dalla sua pagina **Settings**.

- Fonte: [Collaborate using HCP Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/aws-hcp-terraform)

---

## 8.7 — Migrare lo state in HCP Terraform

Con Terraform Community Edition si è responsabili della manutenzione di un file di state, che è la fonte di verità dell'infrastruttura cloud. HCP Terraform offre uno storage remoto sicuro dello state, che rende più facile collaborare allo sviluppo dell'infrastruttura. Lo state si può migrare in HCP Terraform senza interrompere i servizi e senza ricreare l'infrastruttura esistente. Nel tutorial si migra in HCP Terraform un file di state locale.

> **Attenzione**: quando si carica un file di state in HCP Terraform con i passi di questo tutorial, bisogna sempre usare la stessa versione della CLI di Terraform usata per creare le risorse. Una versione più recente di Terraform potrebbe aggiornare il file di state e corromperlo.
_(infoBox)_

### 8.7.1 — Creare lo state

La configurazione di esempio usa il provider random per generare un nome casuale di animale domestico. Una input variable determina la lunghezza della stringa generata, e un output ne mostra il valore:

```
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.3.2"
    }
  }
  required_version = ">= 1.1.0"
}

variable "name_length" {
  description = "The number of words in the pet name"
  default     = "3"
}

resource "random_pet" "pet_name" {
  length    = var.name_length
  separator = "-"
}

output "pet_name" {
  value = random_pet.pet_name.id
}
```

Dopo `terraform init` e `terraform apply`, Terraform mostra il nome generato negli output, e c'è un file di state locale.

### 8.7.2 — Configurare l'integrazione con HCP Terraform

Per usare HCP Terraform come backend della configurazione bisogna includere un blocco `cloud`. Lo si aggiunge alla configurazione, sostituendo `ORGANIZATION-NAME` con il nome della propria organizzazione HCP Terraform:

```
terraform {
  cloud {
    organization = "ORGANIZATION-NAME"
    workspaces {
      name = "learn-terraform-migrate"
    }
  }

  required_version = ">= 1.1.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.3.2"
    }
  }
}
```

L'organizzazione indicata nel blocco `cloud` deve già esistere, il workspace invece no: HCP Terraform lo crea se necessario. Se si usa un workspace esistente, non deve avere state esistenti.

> **Nota**: i workspace di HCP Terraform si comportano in modo diverso dai workspace della CLI di Terraform. I workspace della CLI permettono di avere più file di state nella stessa directory, per usare una configurazione per più ambienti. I workspace di HCP Terraform contengono tutto il necessario per gestire un dato insieme di infrastruttura, e funzionano come directory di lavoro separate.
_(infoBox)_

### 8.7.3 — Autenticarsi e migrare il file di state

Dopo aver configurato l'integrazione, ci si autentica in HCP Terraform per usarlo nelle remote operations, con `terraform login`. Per migrare il file di state esistente bisogna reinizializzare la configurazione, che aggiorna il backend. Con `terraform init`, Terraform rileva il backend aggiornato e chiede di confermare la migrazione del file di state in HCP Terraform, a cui si risponde `yes`.

### 8.7.4 — Configurare il workspace e avviare un run

Dopo la migrazione, nell'interfaccia web di HCP Terraform la pagina **States** del workspace `learn-terraform-migrate` elenca lo state migrato. La configurazione usa una input variable, quindi nella pagina **Variables** del workspace si crea una Terraform variable `name_length` con valore 5. Se la configurazione usasse un cloud provider, in questa pagina si imposterebbero anche le credenziali del provider.

Verificato che lo state è stato migrato, si rimuove il file di state locale con `rm terraform.tfstate`, e si avvia un nuovo run con `terraform apply`. Terraform propone di sostituire la risorsa, per riflettere la modifica alla variabile `name_length`. Terraform trasmette i log nella console locale, e mostra i dettagli del run anche nell'interfaccia del workspace.

![Figura 18](img/hcp-remote-run.png) _(dimensioni: 2048×2065 px)_

*Figura 18 — Il run avviato dalla CLI dopo la migrazione, in attesa di conferma: il log indica che la risorsa verrà sostituita. Fonte: HashiCorp Developer.* _(caption)_

- Fonte: [Migrate state to HCP Terraform](https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-migrate)

---

## 8.8 — Migrare lo state di Terraform in HCP Terraform o Terraform Enterprise

Questa pagina descrive come migrare i file di state di Terraform esistenti in HCP Terraform o Terraform Enterprise, senza prima rimuovere le risorse.

### 8.8.1 — Panoramica e requisiti

Per migrare le risorse esistenti in uno o più workspace di HCP Terraform o Terraform Enterprise si eseguono due azioni: si fermano tutte le operazioni di Terraform associate ai file di state, e si migrano i file di state. Per la migrazione ci sono tre opzioni: a mano con la CLI di Terraform, a mano con l'API di HCP Terraform, o automaticamente con `tf-migrate`. I requisiti sono questi:

- per configurare il blocco `cloud` serve Terraform v1.1 o successivo; con Terraform v1.0 e precedenti si usa invece il backend `remote`;
- serve un account su HCP Terraform o su un'istanza di Terraform Enterprise;
- per usare l'API bisogna presentare un token associato ai permessi appropriati.

### 8.8.2 — Fermare le operazioni di Terraform

Bisogna fermare tutte le operazioni di Terraform associate ai file di state. Può voler dire bloccare o eliminare job di CI, limitare l'accesso al backend dello state e comunicare con gli altri team. I file di state vanno migrati solo in workspace di HCP Terraform o Terraform Enterprise che non hanno mai eseguito un run.

### 8.8.3 — Migrare lo state con la CLI

Si aggiunge il blocco `cloud` alla configurazione Terraform, con questi campi:

- `hostname`: `app.terraform.io` per HCP Terraform, o l'hostname dell'installazione di Terraform Enterprise;
- `organization`: l'organizzazione HCP Terraform o Terraform Enterprise;
- il blocco `workspaces`, con un campo `tags` o `name` che indica uno o più workspace di destinazione.

L'esempio migra lo state associato alla configurazione nel workspace `networking` di HCP Terraform. Poi si esegue `terraform init`, e Terraform crea i workspace indicati nella configurazione se non esistono già nell'organizzazione.

```
terraform {
  cloud {
    hostname = "app.terraform.io"
    organization = "my-org"
    workspaces {
      tags = ["networking"]
    }
  }
}
```

### 8.8.4 — Migrare lo state con l'API

Con l'API la migrazione richiede questi passi:

1. si codifica il file di state come stringa base64 e se ne genera l'hash MD5. Per un singolo file `terraform.tfstate`, ad esempio, la stringa e l'hash si generano così:

```
$ cat terraform.tfstate | base64
$ md5sum terraform.tfstate
```

2. se il workspace non esiste ancora nell'organizzazione, lo si crea con una richiesta POST all'endpoint `/organizations/:organization_name/workspaces`;
3. si blocca il workspace con una richiesta POST all'endpoint `/workspaces/:workspace_id/actions/lock`;
4. si carica il file di state con una richiesta POST all'endpoint `/workspaces/:workspace_id/state-versions`. L'MD5 va nel campo `data.attributes.md5`, il file di state codificato nel campo `data.attributes.state` del corpo della richiesta;
5. si sblocca il workspace con una richiesta POST all'endpoint `/workspaces/:workspace_id/actions/unlock`.

La documentazione rimanda a un articolo esterno con un esempio di script Python che automatizza la migrazione di più file di state. Lo script usa l'API Workspaces per creare i workspace necessari, e l'API State Versions per migrarvi i file di state.

### 8.8.5 — Migrare lo state con tf-migrate e verso gli Stack

Lo strumento CLI `tf-migrate` migra automaticamente lo state in HCP Terraform e Terraform Enterprise. Non è incluso in HCP Terraform, e il suo binario va scaricato e installato separatamente.

In HCP Terraform l'infrastruttura si organizza in due modi. I workspace sono ideali per gestire un'infrastruttura autonoma di un solo modulo root. Gli Stack sono ideali per gestire più moduli di infrastruttura e ripeterla su larga scala. Per convertire un workspace esistente in uno Stack, si usa la CLI Terraform migrate, che migra state e configurazione del workspace in uno Stack di HCP Terraform.

- Fonte: [Migrate Terraform state to HCP Terraform or Terraform Enterprise](https://developer.hashicorp.com/terraform/cloud-docs/migrate)

---

## 8.9 — Connettersi a HCP Terraform

Questa pagina descrive come collegare la CLI di Terraform a HCP Terraform. Integrando la CLI con HCP Terraform, la CLI fa da client per i workflow CLI-driven.

### 8.9.1 — Panoramica e requisiti

Collegare la CLI a HCP Terraform associa la directory di lavoro con le configurazioni Terraform a uno o più workspace HCP Terraform. Così i membri del team con accesso al workspace possono creare e gestire l'infrastruttura con HCP Terraform. Inoltre HCP Terraform gestisce i dati di state, quindi non serve mantenere oggetti di state remoto. Per collegarsi a HCP Terraform si procede così:

1. si forniscono le credenziali per HCP Terraform;
2. si definiscono le impostazioni di connessione nella configurazione Terraform;
3. si inizializza la directory di lavoro;
4. si migrano i dati di state, un passo facoltativo.

Serve un profilo utente in HCP Terraform con il permesso di creare workspace.

### 8.9.2 — Fornire le credenziali

Per accedere a HCP Terraform servono credenziali. È consigliato usare il comando `terraform login` (sezione 8.5). Si può anche fornire un token utente nella configurazione Terraform, con l'attributo `token`.

### 8.9.3 — Definire le impostazioni di connessione

Si aggiunge un blocco `cloud` alla configurazione Terraform, e se ne configurano le impostazioni di connessione per collegare la directory di lavoro a un workspace HCP Terraform. Il blocco `cloud` fa parte del blocco `terraform` (sezione 2.6). Nel blocco `cloud` si specificano queste impostazioni:

- `organization`: il nome dell'organizzazione HCP Terraform a cui collegarsi.
- `workspaces.tags`: una map di tag stringa, o una lista di tag stringa solo chiave (stile legacy). Terraform collega la directory di lavoro ai workspace esistenti dell'organizzazione con tag corrispondenti. Se non ce ne sono, all'inizializzazione la CLI chiede di creare un nuovo workspace con i tag indicati.
- `workspaces.name`: al posto dei tag, il nome di un workspace esistente da associare alla configurazione. Se si configura `name`, non si può usare `tags`.
- `workspaces.project`: il nome di un project esistente. Terraform associa la configurazione ai workspace del project che corrispondono al nome o ai tag.

Nell'esempio, la configurazione collega la directory di lavoro a tutti i workspace con i tag `networking` e `source:cli` del project `networking-development`:

```
terraform {
  cloud {
    organization = "my-org"
    hostname = "app.terraform.io" # Optional; defaults to app.terraform.io

    workspaces {
      project = "networking-development"

      tags = {
        layer = "networking"
        source = "cli"
      }
    }
  }
}
```

### 8.9.4 — Inizializzare la directory di lavoro

Dopo aver aggiunto o modificato un blocco `cloud`, si esegue `terraform init` per completare la configurazione. Per default, con `terraform plan` o `terraform apply` Terraform carica una copia delle configurazioni della directory di lavoro. Si può aggiungere alla directory un file `.terraformignore`, con i file da non caricare in HCP Terraform.

Se la directory di lavoro non ha un file di state, si può iniziare subito a usare Terraform con HCP Terraform. Se ha un file di state associato a una configurazione di backend, Terraform chiede di migrare lo state dai workspace esistenti.

### 8.9.5 — Migrare i dati di state

La migrazione dei dati si completa quando richiesto, secondo uno di questi scenari:

- **state conservato in locale o in un backend di state**: se la directory di lavoro ha già dati di state in uno o più workspace, Terraform chiede di migrarli in nuovi workspace HCP Terraform;
- **state conservato nel backend remote**: se la directory di lavoro è già collegata a HCP Terraform con il backend `remote`, Terraform può continuare a usare gli stessi workspace HCP Terraform. In questo caso si cambia la configurazione `backend "remote"` in un blocco `cloud`.

**Migrare lo state locale** _(stepTitle)_

Si esegue `terraform init` e si seguono le richieste della CLI per migrare i dati di state conservati in locale o in un backend di state. HCP Terraform richiede che tutti i workspace abbiano un nome, quindi durante la migrazione Terraform potrebbe chiedere anche di rinominare i workspace.

I workspace della sola CLI di Terraform rappresentano più ambienti associati alla stessa configurazione, come production, staging e development. I workspace di HCP Terraform invece possono rappresentare configurazioni del tutto indipendenti, e devono avere nomi univoci nell'organizzazione. Per questo Terraform chiede di rinominare i workspace secondo uno schema relativo ai nomi esistenti, che indichi che i workspace condividono la configurazione. Una strategia comune è `<COMPONENT>-<ENVIRONMENT>-<REGION>`, ad esempio `networking-prod-us-east` e `networking-staging-us-east`.

**Migrare dal backend remote** _(stepTitle)_

Nel blocco `terraform` o nel file `terraform.tf` si sostituisce `backend "remote"` con `cloud`, e Terraform continua a usare lo stesso insieme di workspace HCP Terraform. Il primo esempio migra i dati di state di un singolo workspace `my-app-prod` nell'organizzazione `my-org`:

```
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      name = "my-app-prod"
    }
  }
}
```

Se il blocco `terraform` usa l'argomento `prefix` per collegarsi a più workspace, al posto dell'argomento `name` si indica una lista di tag chiave-valore nell'argomento `tags`. Durante `terraform plan` o `terraform apply`, Terraform associa la configurazione ai workspace con i tag indicati. Il secondo esempio sostituisce il prefisso `my-app-` con il tag `app=mine`:

```
terraform {
  cloud {
    organization = "my-org"

    workspaces {
      tags = {
        app = "mine"
      }
    }
  }
}
```

Il blocco `cloud` non supporta l'argomento `prefix`. Dopo la migrazione dei workspace in HCP Terraform, quindi, con la CLI bisogna chiamarli con il nome completo. Ad esempio, invece di `terraform workspace select prod` si esegue `terraform workspace select my-app-prod`.

### 8.9.6 — Escludere file

Quando si esegue un plan o un apply remoto in un run CLI-driven, una copia della directory di configurazione viene caricata in HCP Terraform. I percorsi da escludere dal caricamento si definiscono con un file `.terraformignore` nella radice della directory di configurazione. Anche senza questo file, Terraform esclude per default le directory `.git/` e le directory `.terraform/`, tranne `.terraform/modules`. Le regole di `.terraformignore` si basano su quelle dei file `.gitignore`:

- Terraform ignora i commenti che iniziano con `#` e le righe vuote;
- uno schema che termina con una barra `/` indica una directory;
- uno schema che inizia con un punto esclamativo `!` è una negazione. Con le directory grandi le negazioni possono pesare sulle prestazioni, quindi vanno messe il prima possibile nel file, o evitate se possibile.

Terraform legge il file `.terraformignore` nella radice della directory di configurazione.

- Fonte: [Connect to HCP Terraform](https://developer.hashicorp.com/terraform/cli/v1.12.x/cloud/settings)

---

## 8.10 — Aggiornare la versione di Terraform in HCP Terraform

Ogni workspace HCP Terraform ha una versione di Terraform assegnata, che usa per tutte le remote operations del workspace. Configurare la versione di Terraform garantisce un comportamento coerente tra i run, e così è facile collaborare alla gestione dell'infrastruttura. Quando si decide di aggiornare Terraform, HCP Terraform offre workflow che permettono di verificare la modifica in modo sicuro.

Nel tutorial si aggiorna da Terraform 0.12 a 0.13 una configurazione gestita da HCP Terraform. Si usa lo speculative plan di HCP Terraform per validare l'aggiornamento, e il run con apply vuoto per aggiornare la versione dello state.

### 8.10.1 — Creare il workspace

Nell'organizzazione HCP Terraform, dalla pagina **Workspaces** si sceglie **New > Workspace**, si seleziona il **Default Project** dell'organizzazione e si crea il workspace. Lo si configura così:

1. si sceglie **Version control workflow**;
2. come provider di controllo versione si sceglie GitHub, autenticandosi con il proprio account se è la prima volta;
3. si seleziona il repository `learn-terraform-versions` di cui si è fatto il fork;
4. si lascia invariato il nome del workspace;
5. in **Advanced options** si verifica che siano attivi gli **Automatic speculative plans**;
6. si crea il workspace.

### 8.10.2 — Aggiornare la versione del workspace

La configurazione del repository usa un vincolo di versione che impone Terraform 0.12 per tutti i run. Il workspace HCP Terraform però è configurato per usare l'ultima versione, come mostrano i dettagli del workspace.

Quando si crea un nuovo workspace, HCP Terraform seleziona automaticamente la versione più recente di Terraform disponibile. Se si migra in HCP Terraform un progetto esistente dalla CLI, HCP Terraform configura il workspace per usare la stessa versione del binario di Terraform usato per la migrazione. HCP Terraform permette di cambiare la versione usata da un workspace nella pagina delle impostazioni del workspace. Così si controlla come e quando i progetti usano versioni più recenti di Terraform.

Facendo clic sulla versione del workspace si apre la pagina delle impostazioni generali. Nel selettore della versione si sceglie la versione 0.12.31, per soddisfare il vincolo di versione della configurazione, e si salvano le impostazioni.

![Figura 19](img/hcp-configure-version.png) _(dimensioni: 2360×269 px)_

*Figura 19 — Il selettore della versione di Terraform nelle impostazioni generali del workspace. Fonte: HashiCorp Developer.* _(caption)_

### 8.10.3 — Creare l'infrastruttura e aggiornare il vincolo di versione

Si avvia un nuovo run con **Start new run** dal menu **Actions** del workspace, e lo si applica con **Confirm & Apply**. A questo punto il workspace di esempio funziona, ma usa una versione di Terraform obsoleta.

La configurazione funziona solo con le versioni di Terraform della serie 0.12. Per aggiornare il progetto bisogna modificare sia la versione del workspace sia il vincolo di versione della configurazione.

> **Nota**: nello scenario del tutorial l'unico problema di compatibilità è il vincolo di versione della configurazione. Gli aggiornamenti delle configurazioni di produzione possono richiedere più modifiche, per cui vanno consultate le guide di aggiornamento di Terraform.
_(infoBox)_

Si clona il fork del repository e in `main.tf` si aggiorna il vincolo `required_version` a `~> 0.13.0`:

```
terraform {
  required_providers {
    aws = {
      version = "~> 4.0"
    }
    random = {
      version = ">= 2.1.2"
    }
  }

  required_version = "~> 0.13.0"
}
```

Per verificare che la configurazione sia ancora valida con la nuova versione di Terraform, si apre una pull request nel repository, che avvia uno speculative plan. Si crea un nuovo branch, si aggiungono le modifiche all'area di stage, se ne fa il commit e infine il push:

```
$ git checkout -b upgrade_terraform_013
$ git add .
$ git commit -m "Upgrade version constraint to Terraform 0.13"
$ git push -u origin upgrade_terraform_013
```

### 8.10.4 — Testare la nuova versione di Terraform

Nell'interfaccia web di GitHub si apre una pull request con le modifiche verso il proprio fork. All'apertura della pull request, HCP Terraform crea uno speculative plan che mostra le modifiche della pull request. Il plan fallisce, perché il vincolo di versione della configurazione è aggiornato, ma il workspace usa ancora la versione 0.12.31. Con il link **Details** accanto al plan fallito si vedono i dettagli in HCP Terraform: come previsto, la versione di Terraform usata per il plan non soddisfa la configurazione.

Per i run normali Terraform usa la versione configurata per il workspace. Per uno speculative plan si può invece scegliere una versione specifica di Terraform, per testare le modifiche sensibili alla versione. Dal menu sotto l'output del run si sceglie la versione 0.13.7, e con **Retry run** si verifica che la configurazione funzioni con una versione più recente. Nei dettagli del plan HCP Terraform indica che per questo plan si è usata una versione diversa da quella configurata per il workspace. Il run riesce e non mostra modifiche pianificate, il che conferma che la configurazione è compatibile con Terraform 0.13.

### 8.10.5 — Aggiornare la versione del workspace e lo state

Nella pagina delle impostazioni del workspace si aggiorna la versione a 0.13.7 e si salva, poi si fa il merge della pull request, che aggiorna il vincolo di versione nel branch main. La pull request unita non modifica le risorse, quindi Terraform avvia e completa il run automaticamente. Non chiede di applicare la configurazione per aggiornare lo state, perché non ci sono modifiche. L'ultimo file di state del workspace mostra ancora la versione di state 4 e la versione di Terraform 0.12.31.

**Un apply per completare l'aggiornamento** _(stepTitle)_

Ora il workspace può usare Terraform 0.13 per i run, ma l'aggiornamento non è completo. Terraform 0.13 ha introdotto modifiche al formato del file di state, quindi bisogna applicare un run nel workspace per aggiornare la versione dello state e completare l'aggiornamento.

Per default HCP Terraform non applica i run senza modifiche alle risorse, ma offre il tipo di run con apply vuoto (empty apply), che aiuta negli aggiornamenti di versione major (sezione 6.10.5). Si avvia un run con **Start new run** dal menu **Actions**, scegliendo **Allow empty apply** come tipo di run. Il run con apply vuoto permette a HCP Terraform di aggiornare la versione dello state, anche se non ci sono modifiche da fare alle risorse. Confermando e applicando il run vuoto, HCP Terraform aggiorna il file di state del workspace con la nuova versione di Terraform, 0.13.7.

Ora la configurazione usa Terraform 0.13 invece di 0.12, e il file di state del workspace HCP Terraform è aggiornato di conseguenza. Il workspace soddisfa i requisiti minimi del formato di state per Terraform 0.14 e successivi.

- Fonte: [Upgrade Terraform version in HCP Terraform](https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-versions)

---

## 8.11 — I workspace

Questa pagina offre una panoramica della risorsa workspace di HCP Terraform e Terraform Enterprise. Un workspace è un gruppo di risorse di infrastruttura gestite da Terraform.

### 8.11.1 — Introduzione

Lavorare con Terraform significa gestire insiemi di risorse di infrastruttura, e la maggior parte delle organizzazioni ne gestisce molti diversi. Eseguito in locale, Terraform gestisce ogni insieme di infrastruttura con una directory di lavoro persistente, che contiene una configurazione, i dati di state e le variabili. La CLI di Terraform usa il contenuto della directory in cui viene eseguita. Si possono quindi organizzare le risorse in gruppi significativi, tenendone le configurazioni in directory separate.

HCP Terraform gestisce gli insiemi di infrastruttura con i workspace invece che con le directory. Un workspace contiene tutto ciò che serve a Terraform per gestire un dato insieme di infrastruttura, e workspace separati funzionano come directory di lavoro completamente separate.

### 8.11.2 — Il contenuto di un workspace

I workspace di HCP Terraform e le directory di lavoro locali hanno lo stesso scopo, ma conservano i dati in modo diverso:

| **Componente** | **Terraform in locale** | **HCP Terraform** |
|---|---|---|
| Configurazione Terraform | Su disco | Nel repository di controllo versione collegato, o caricata periodicamente via API/CLI |
| Valori delle variabili | In file `.tfvars`, come argomenti della CLI o nell'ambiente della shell | Nel workspace |
| State | Su disco o in un backend remoto | Nel workspace |
| Credenziali e segreti | Nell'ambiente della shell o inseriti quando richiesti | Nel workspace, conservati come variabili sensitive |

Oltre al contenuto di base di Terraform, HCP Terraform conserva per ogni workspace altri dati:

- **le state version**: ogni workspace conserva i backup dei file di state precedenti. Per gestire le risorse basta lo state attuale, ma la cronologia dello state può servire a tracciare le modifiche nel tempo o a recuperare da un problema;
- **la cronologia dei run**: quando HCP Terraform gestisce i run di un workspace, conserva un registro di tutta l'attività dei run. Comprende riepiloghi, log, un riferimento alle modifiche che hanno causato il run e i commenti degli utenti.

In cima a ogni workspace compare un conteggio delle risorse, cioè il numero di risorse registrate nel file di state del workspace, comprese sia le managed resource sia i data source.

### 8.11.3 — I run di Terraform

Nei workspace con le remote operations abilitate, cioè per default, HCP Terraform esegue i run di Terraform su proprie macchine virtuali usa e getta, con la configurazione, le variabili e lo state del workspace (sezione 8.3).

### 8.11.4 — Workspace di HCP Terraform e workspace della CLI

Sia HCP Terraform sia la CLI di Terraform hanno funzionalità chiamate workspace, ma funzionano in modo diverso:

- i **workspace di HCP Terraform** sono obbligatori, e rappresentano tutti gli insiemi di infrastruttura di un'organizzazione. Sono anche un componente fondamentale dell'accesso basato sui ruoli in HCP Terraform. A singoli utenti e gruppi di utenti si danno permessi su uno o più workspace, che stabiliscono se possono gestire le variabili, eseguire run e così via. In HCP Terraform non si possono gestire risorse senza creare almeno un workspace;
- i **workspace della CLI di Terraform** sono associati a una specifica directory di lavoro, e isolano più file di state nella stessa directory di lavoro. Così si gestiscono più gruppi di risorse con una sola configurazione. La CLI di Terraform non richiede di creare workspace della CLI.

### 8.11.5 — Pianificare e organizzare i workspace

HashiCorp raccomanda alle organizzazioni di suddividere le configurazioni Terraform grandi e monolitiche in configurazioni più piccole. Ognuna va poi assegnata a un proprio workspace, delegandone permessi e responsabilità. HCP Terraform gestisce senza problemi anche le configurazioni monolitiche. Gestire l'infrastruttura in componenti più piccoli è però il modo migliore per sfruttare appieno le funzionalità di governance e delega di HCP Terraform.

Ad esempio, il codice che gestisce l'infrastruttura dell'ambiente di produzione potrebbe essere diviso in una configurazione di rete, una dell'applicazione principale e una di monitoraggio. Dopo la divisione si creerebbero i workspace `networking-prod`, `app1-prod` e `monitoring-prod`, assegnandone la gestione a team separati. Come quando si divide un'applicazione monolitica in microservizi più piccoli, questo permette ai team di apportare modifiche in parallelo. Rende anche più facile riusare le configurazioni per gestire altri ambienti, come `app1-dev`.

In Terraform Enterprise, gli amministratori possono impostare con gli **Admin Settings** il numero massimo di workspace di una singola organizzazione. Un limite ai workspace si può impostare anche con il provider `tfe`.

### 8.11.6 — Project, creazione, import e health

I project permettono di organizzare i workspace in gruppi (sezione 8.15). Nelle edizioni Essentials, Standard e Premium di HCP Terraform si possono assegnare permessi sui project, per limitare l'accesso a insiemi di workspace in base alle unità di business e alle responsabilità.

I workspace si creano dall'interfaccia di HCP Terraform, con l'API Workspaces o con l'integrazione della CLI con HCP Terraform. Nell'infrastruttura esistente si possono cercare risorse da importare nel workspace, per gestirle con Terraform.

Gli health assessment sono disponibili nelle edizioni Standard e Premium di HCP Terraform. HCP Terraform può eseguire health assessment automatici in un workspace, per valutare se l'infrastruttura reale soddisfa i requisiti definiti nella configurazione Terraform. Comprendono due tipi di valutazione:

- la **drift detection** stabilisce se l'infrastruttura reale corrisponde alla configurazione Terraform;
- la **validazione continua** stabilisce se le custom condition della configurazione del workspace continuano a passare dopo che Terraform ha creato l'infrastruttura.

Gli health assessment si possono imporre a tutti i workspace idonei, o lasciare che ogni workspace li attivi nelle proprie impostazioni (sezione 8.24).

- Fonte: [Workspaces](https://developer.hashicorp.com/terraform/cloud-docs/workspaces)

---

## 8.12 — Collegare i workspace con i run trigger

I run trigger di HCP Terraform permettono di collegare i workspace: un apply riuscito in un workspace sorgente mette in coda un run nel workspace collegato. Ad esempio, aggiungere nuove subnet alla configurazione di rete potrebbe attivare un aggiornamento della configurazione dell'applicazione, per ridistribuire i server sulle nuove subnet.

Quando si gestisce un'infrastruttura complessa con HCP Terraform, organizzare la configurazione in workspace diversi aiuta a gestire e progettare meglio l'infrastruttura. Configurando i run trigger tra i workspace si costruiscono pipeline di infrastruttura, come parte della strategia complessiva di deployment.

Nel tutorial si configurano un workspace che gestisce la rete e un secondo che gestisce l'applicazione. Si configura poi un run trigger, così ogni modifica al workspace di rete mette in coda un passo di apply nel workspace dell'applicazione.

![Figura 20](img/hcp-run-trigger-workspaces.png) _(dimensioni: 1940×439 px)_

*Figura 20 — Due workspace collegati da un run trigger. Fonte: HashiCorp Developer.* _(caption)_

### 8.12.1 — I repository

Il **repository di rete** contiene la configurazione Terraform dell'infrastruttura di rete:

- `main.tf` configura il provider aws, le risorse della VPC, il load balancer e l'infrastruttura di rete correlata;
- `terraform.tf` configura le versioni del provider e di Terraform;
- `variables.tf` dichiara le variabili, tra cui la region e il numero di subnet pubbliche e private;
- `outputs.tf` dichiara gli output, che il workspace dell'applicazione userà nella propria configurazione.

Il **repository dell'applicazione** è organizzato come quello di rete, con una differenza importante. In cima a `main.tf` usa un blocco `terraform_remote_state` per recuperare gli output del workspace di rete. I blocchi di dati di remote state permettono di condividere dati tra workspace in HCP Terraform. Insieme al run trigger configurato più avanti, il blocco permette al workspace dell'applicazione di reagire alle modifiche del workspace di rete:

```
data "terraform_remote_state" "network" {
  backend = "remote"

  config = {
    organization = var.tfc_org_name
    workspaces = {
          name = var.tfc_network_workspace_name
    }
  }
}
```

Il blocco si collega a HCP Terraform per recuperare gli output del workspace indicato, compresa la configurazione delle subnet e del load balancer. Più avanti in `main.tf`, la risorsa `"aws_instance" "app"` usa questi dati per configurare la subnet e i security group corretti di ogni istanza EC2:

```
  subnet_id              = data.terraform_remote_state.network.outputs.private_subnet_ids[count.index % length(data.terraform_remote_state.network.outputs.private_subnet_ids)]
  vpc_security_group_ids = data.terraform_remote_state.network.outputs.app_instance_security_group_ids
```

> **Suggerimento**: quando è comodo, è consigliato usare i data source specifici del provider. `terraform_remote_state` è più flessibile, ma richiede l'accesso all'intero state di Terraform.
_(infoBox)_

### 8.12.2 — Configurare i workspace

Nell'interfaccia web di HCP Terraform si può creare un'organizzazione apposita per l'esempio, per separarlo dall'infrastruttura di produzione. Il **workspace di rete** si crea con **+ New Workspace** e il **Version control workflow**, collegandolo al repository `learn-terraform-run-triggers-network` del proprio account GitHub. Il nome del workspace è `learn-terraform-run-triggers-network`. Nella pagina **Variables** si aggiungono `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` come environment variable sensitive, con cui Terraform si autentica con AWS.

Il **workspace dell'applicazione** si crea allo stesso modo, collegandolo al repository `learn-terraform-run-triggers-application`. Il blocco di remote state della configurazione dell'applicazione richiede sia il nome dell'organizzazione sia quello del workspace. Usa per default il nome di workspace `learn-terraform-run-triggers-network`, ma il nome dell'organizzazione è univoco. Si crea quindi una Terraform variable con chiave `tfc_org_name` e valore pari al nome della propria organizzazione, e si aggiungono le credenziali AWS come per il workspace di rete.

### 8.12.3 — Consentire l'accesso allo state remoto

HCP Terraform protegge il file di state cifrandolo a riposo, e limitando automaticamente l'accesso dagli altri workspace. Per consentire al workspace dell'applicazione di accedere allo state del workspace di rete si procede così:

1. si apre il workspace `learn-terraform-run-triggers-network` e si sceglie **Settings**;
2. nella pagina **General** si va alla sezione **Remote state sharing**;
3. in **Select workspaces to share with** si seleziona `learn-terraform-run-triggers-application`;
4. si fa clic su **Save settings**.

![Figura 21](img/hcp-remote-state-sharing.png) _(dimensioni: 2878×1398 px)_

*Figura 21 — La sezione Remote state sharing nelle impostazioni generali del workspace di rete, con il workspace dell'applicazione selezionato. Fonte: HashiCorp Developer.* _(caption)_

### 8.12.4 — Configurare un run trigger

Nel workspace `learn-terraform-run-triggers-application`, in **Settings > Run triggers**, sotto **Connected Workspaces** si fa clic su **Connect workspace**. Si seleziona `learn-terraform-run-triggers-network` e si fa clic su **Connect**.

![Figura 22](img/hcp-run-triggers.png) _(dimensioni: 1629×809 px)_

*Figura 22 — La pagina Run Triggers del workspace dell'applicazione, con il workspace di rete collegato come sorgente. Fonte: HashiCorp Developer.* _(caption)_

Poi si mette in coda un plan nel workspace di rete con **Actions > Start a new run** e il tipo di run **Plan and apply**. Al termine del plan, un messaggio indica che un apply riuscito di questo workspace attiverà un run del workspace `learn-terraform-run-triggers-application`. Con **Confirm & Apply** si applica il plan, e dopo qualche minuto le risorse di rete sono create.

Nel workspace dell'applicazione, il run trigger ha messo in coda un nuovo plan. Tutti i plan eseguiti tramite run trigger vanno applicati a mano. Al termine del plan lo si applica, e negli output del run il valore `public_dns_name`, incollato nel browser, mostra il messaggio "Hello, world!" dell'applicazione.

Ora, con il run trigger tra i due workspace, un apply riuscito nel workspace di rete mette in coda un plan nel workspace dell'applicazione. Se si vuole che il workspace dell'applicazione applichi automaticamente i run dopo il workspace di rete, si attiva l'auto-apply dei run nel workspace dell'applicazione. I run trigger servono a coordinare i workspace nelle pipeline di infrastruttura, insieme ad altri strumenti di automazione.

- Fonte: [Connect workspaces with run triggers](https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-run-triggers)

---

## 8.13 — I run trigger

HCP Terraform permette di collegare un workspace a uno o più workspace dell'organizzazione, chiamati **source workspace**. Questi collegamenti, i run trigger, fanno accodare automaticamente i run nel proprio workspace quando un run di uno qualsiasi dei source workspace viene applicato con successo. Ogni workspace si può collegare a un massimo di 20 source workspace.

I run trigger sono pensati per i workspace che si basano su informazioni o infrastruttura prodotte da altri workspace. Se una configurazione Terraform usa data source per leggere valori che un altro workspace potrebbe cambiare, i run trigger permettono di dichiarare esplicitamente quella dipendenza esterna. I run trigger sono disponibili anche tramite l'API Run Triggers.

### 8.13.1 — Visualizzare, gestire e creare i run trigger

Per aggiungere o eliminare un run trigger si apre il workspace e si sceglie **Run Triggers** dal menu **Settings**. La pagina delle impostazioni mostra i run trigger esistenti. Configurare i run trigger richiede l'accesso admin al workspace, e gli admin possono eliminare da questa pagina qualsiasi run trigger del proprio workspace.

Per creare un run trigger servono l'accesso admin al workspace e il permesso di leggere i run del source workspace da collegare. Nella sezione **Source Workspaces** si seleziona il workspace da collegare come sorgente e si fa clic su **Add workspace**. Da quel momento, ogni run del source workspace applicato con successo mette in coda un nuovo run nel proprio workspace.

### 8.13.2 — L'auto-apply dei run trigger

I run avviati da un run trigger non vengono applicati automaticamente, a meno che non si attivi l'impostazione **Auto-apply run triggers**. Questa impostazione è indipendente dall'impostazione di auto-apply principale del workspace.

### 8.13.3 — Interagire con i run trigger

I run accodati nel workspace tramite un run trigger includono informazioni extra nella sezione dei dettagli del run, con i link al source workspace e al run applicato con successo che ha attivato il run trigger. Il source workspace mostra a sua volta, nei dettagli di plan e apply, un messaggio con i workspace in cui HCP Terraform avvia automaticamente un run.

### 8.13.4 — Usare un data source di remote state

Un modo comune di condividere informazioni tra workspace è il data source `terraform_remote_state`, che permette a una configurazione Terraform di accedere agli output root-level di un source workspace. Prima che altri workspace possano leggerne gli output, un workspace va configurato per consentire l'accesso.

> **Importante**: per accedere agli output dello state remoto in HCP Terraform o Terraform Enterprise è consigliato il data source `tfe_outputs` del provider HCP Terraform/Enterprise. È più sicuro, perché per leggere gli output non richiede l'accesso completo allo state del workspace.
_(infoBox)_

- Fonte: [Run triggers](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/settings/run-triggers)

---

## 8.14 — Il data source terraform_remote_state

Il data source `terraform_remote_state` usa l'ultimo snapshot dello state di un backend indicato per recuperare gli output del modulo root di un'altra configurazione Terraform. Lo si può usare senza richiedere né configurare un provider. È sempre disponibile tramite un provider integrato con indirizzo sorgente `terraform.io/builtin/terraform`, che non include altre risorse né data source. Anche qui vale la raccomandazione di usare il data source `tfe_outputs` con HCP Terraform o Terraform Enterprise (sezione 8.13.4).

### 8.14.1 — Modi alternativi di condividere dati tra configurazioni

Condividere dati con gli output del modulo root è comodo, ma ha degli svantaggi. `terraform_remote_state` espone solo gli output, ma chi lo usa deve avere accesso all'intero snapshot dello state, che spesso contiene informazioni sensibili.

Quando possibile, è consigliato pubblicare esplicitamente i dati destinati all'uso esterno in una posizione separata, invece di accedervi tramite lo state remoto. Così si possono applicare controlli di accesso diversi alle informazioni condivise e agli snapshot dello state. Per condividere esplicitamente i dati tra configurazioni si possono usare coppie di tipi di managed resource e data source di vari provider, tra cui:

| **Sistema** | **Pubblicare con** | **Leggere con** |
|---|---|---|
| Alibaba Cloud DNS (indirizzi IP e hostname) | `alicloud_alidns_record` | Normali lookup DNS, o il provider `dns` |
| Amazon Route53 (indirizzi IP e hostname) | `aws_route53_record` | Normali lookup DNS, o il provider `dns` |
| Amazon S3 | `aws_s3_object` (risorsa) | `aws_s3_object` (data source) |
| Amazon SSM Parameter Store | `aws_ssm_parameter` (risorsa) | `aws_ssm_parameter` (data source) |
| Azure Automation | `azurerm_automation_variable_string` (risorsa) | `azurerm_automation_variable_string` (data source) |
| Azure DNS (indirizzi IP e hostname) | `azurerm_dns_a_record` e simili | Normali lookup DNS, o il provider `dns` |
| Google Cloud DNS (indirizzi IP e hostname) | `google_dns_record_set` | Normali lookup DNS, o il provider `dns` |
| Google Cloud Storage | `google_storage_bucket_object` (risorsa) | `google_storage_bucket_object` e `http` (data source) |
| HashiCorp Consul | `consul_key_prefix` (risorsa) | `consul_key_prefix` (data source) |
| HashiCorp HCP Terraform | Normali output del blocco terraform | `tfe_outputs` (data source) |
| Kubernetes | `kubernetes_config_map` (risorsa) | `kubernetes_config_map` (data source) |
| OCI Object Storage | `oci_objectstorage_bucket` (risorsa) | `oci_objectstorage_bucket` (data source) |

Sono alcune opzioni comuni dei provider ufficiali, ma le opzioni di storage della configurazione sono troppe per elencarle tutte, comprese alcune dei provider partner e community. Qualsiasi coppia di tipo di managed resource e data source corrispondente può servire a condividere dati tra configurazioni Terraform.

Un vantaggio chiave di un archivio di configurazione esplicito rispetto a `terraform_remote_state` è che i dati possono essere letti anche da sistemi diversi da Terraform. Ad esempio, possono leggerli i sistemi di configuration management o gli scheduler delle istanze di calcolo. Per questo è consigliato scegliere un archivio di configurazione che anche il resto dell'infrastruttura potrebbe usare:

- per condividere indirizzi IP e hostname, li si può pubblicare come normali record DNS A, AAAA, CNAME e SRV in una zona DNS privata. Poi si configura il resto dell'infrastruttura perché usi quella zona, e gli oggetti si trovano con il resolver DNS integrato del sistema;
- con HashiCorp Consul, pubblicare i dati nel key/value store o nel catalogo dei servizi di Consul li rende accessibili anche tramite Consul Template o la sezione template di HashiCorp Nomad;
- con Kubernetes, si possono rendere disponibili ai Pod delle Config Map.

Alcuni archivi elencati sono pensati proprio per piccoli valori di configurazione, altri sono sistemi di storage generici. Con quelli generici si usano le funzioni `jsonencode` e `jsondecode` per conservare e recuperare dati strutturati. I dettagli del recupero dei dati pubblicati si possono incapsulare in un modulo di soli dati (sezione 5.11.4). Il modulo contiene la configurazione dei data source necessari ed eventuali elaborazioni, come la decodifica JSON. Così lo si può cambiare in seguito, se si passa a un'altra strategia di condivisione dei dati tra configurazioni.

### 8.14.2 — Esempi d'uso

Con il backend `remote`, e allo stesso modo con il backend `local` (`backend = "local"`, `config = { path = "..." }`), si leggono gli output di un'altra configurazione:

```
data "terraform_remote_state" "vpc" {
  backend = "remote"

  config = {
    organization = "hashicorp"
    workspaces = {
      name = "vpc-prod"
    }
  }
}

# Terraform >= 0.12
resource "aws_instance" "foo" {
  # ...
  subnet_id = data.terraform_remote_state.vpc.outputs.subnet_id
}

# Terraform <= 0.11
resource "aws_instance" "foo" {
  # ...
  subnet_id = "${data.terraform_remote_state.vpc.subnet_id}"
}
```

### 8.14.3 — Argomenti e attributi

Il data source supporta questi argomenti:

- `backend` (obbligatorio): il backend remoto da usare;
- `workspace` (facoltativo): il workspace Terraform da usare, se il backend supporta i workspace;
- `config` (facoltativo; oggetto): la configurazione del backend remoto. È indicato come facoltativo, ma la maggior parte dei backend richiede una configurazione. L'oggetto `config` accetta tutti gli argomenti validi nel blocco `terraform { backend "<TYPE>" { ... } }` equivalente. Se la configurazione del backend richiede un blocco annidato, qui lo si indica come normale attributo con un valore oggetto, ad esempio `workspaces = { ... }` invece di `workspaces { ... }`;
- `defaults` (facoltativo; oggetto): i valori di default degli output, nel caso in cui il file di state sia vuoto o manchi di un output richiesto.

Il data source esporta questi attributi:

- da v0.12, `outputs`: un oggetto con tutti gli output root-level dello state remoto;
- fino a v0.11, `<OUTPUT NAME>`: ogni output root-level dello state remoto compare come attributo di primo livello del data source.

### 8.14.4 — Solo gli output root

Dello snapshot dello state remoto sono esposti solo gli output root-level. I dati delle risorse e gli output dei moduli annidati non sono accessibili. Per rendere accessibile un output di un modulo annidato come output del modulo root, bisogna configurare esplicitamente un passaggio nel modulo root:

```
module "app" {
  source = "..."
}

output "app_value" {
  # This syntax is for Terraform 0.12 or later.
  value = module.app.example
}
```

Nell'esempio, l'output `example` del modulo `app` è disponibile come output `app_value` del modulo root. Senza il blocco `output "app_value"`, il dato non sarebbe accessibile tramite `terraform_remote_state`.

> **Attenzione**: `terraform_remote_state` non espone alla configurazione nessun'altra informazione dello snapshot dello state. Lo snapshot però è un unico oggetto. Chiunque, utente o server, possa leggere gli output del modulo root può quindi sempre accedere, con richieste di rete dirette, anche a tutti i dati dello snapshot. `terraform_remote_state` non va usato se una qualsiasi delle risorse della configurazione lavora con dati considerati sensibili.
_(infoBox)_

- Fonte: [The terraform_remote_state data source](https://developer.hashicorp.com/terraform/language/v1.12.x/state/remote-state-data)

---

## 8.15 — I project

I project permettono di organizzare workspace e Stack e di limitare l'accesso a quelle risorse. I project sono disponibili a tutti gli utenti, ma per gestire i permessi dei project servono le edizioni Essentials, Standard o Premium di HCP Terraform.

Ogni project ha un insieme di permessi separato, con cui si dà ai team l'accesso a tutti i workspace e gli Stack del project, definendo confini di controllo degli accessi per i team e le loro risorse. I permessi a livello di project sono più granulari di quelli a livello di organizzazione, ma meno specifici delle concessioni sui singoli workspace.

Per decidere come strutturare i project bisogna capire quali gruppi di risorse richiedono regole di accesso distinte. Si possono definire i project per unità di business, reparti, società controllate o team tecnici. Nelle organizzazioni HCP Europe, i project si creano e si gestiscono tramite la piattaforma HCP, e HCP Terraform eredita da HCP i project e le loro impostazioni.

### 8.15.1 — Il project di default

Ogni workspace e ogni Stack deve appartenere a un solo project. Per default tutti i workspace appartengono al **Default Project** dell'organizzazione, che si può rinominare ma non eliminare. Il project di un workspace si può indicare alla creazione, e in seguito lo si può spostare in un altro project.

Il permesso di team **Manage Workspaces** permette agli utenti di creare e gestire i workspace. Gli utenti con questo permesso possono leggere e gestire tutti i workspace, ma i nuovi workspace vengono aggiunti automaticamente al Default Project, e gli utenti non possono accedere ai metadati degli altri project. Per creare workspace in altri project servono anche il permesso **Manage Projects & Workspaces**, o il ruolo admin sul project da usare.

### 8.15.2 — Gestire i project

Il permesso di team **Manage all Projects** permette agli utenti di gestire i project. Gli utenti con questo permesso possono vedere, modificare ed eliminare tutti i project dell'organizzazione, e assegnarne l'accesso ai team.

### 8.15.3 — La modalità di esecuzione

Per default un project usa la modalità di esecuzione dell'organizzazione, Remote o Local, ma la si può sostituire nel project. Tutti i workspace creati nel project dopo la modifica ereditano il default del project. Le modalità di esecuzione disponibili sono:

- **Organization Default**: usa la modalità di esecuzione dell'organizzazione, Remote o Local;
- **Remote**: le operazioni di plan e apply vengono eseguite sull'infrastruttura di HCP Terraform o Terraform Enterprise, e il team può rivedere i run e collaborare all'interno dell'applicazione;
- **Local**: le operazioni di plan e apply vengono eseguite su macchine che si controllano, e HCP Terraform e Terraform Enterprise si limitano a conservare e sincronizzare lo state. Gli Stack non supportano l'esecuzione locale;
- **Agent**: le operazioni di plan e apply eseguite dall'agent sono gestite da HCP Terraform o Terraform Enterprise.

- Fonte: [Projects overview](https://developer.hashicorp.com/terraform/cloud-docs/projects)

---

## 8.16 — Organizzare i workspace con i project

I project di HCP Terraform permettono di organizzare i workspace in gruppi. I project si strutturano in base a come l'organizzazione usa e possiede le risorse, ad esempio per team, unità di business o servizi. Con HCP Terraform Essentials Edition si può dare ai team l'accesso a gruppi di workspace tramite i project.

I project rendono più facile definire e assegnare l'accesso ai workspace, e riducono la probabilità di errori nei permessi. Invece di aggiungere a mano i team necessari a ogni workspace, si raggruppano i workspace correlati in project e si dà ai team l'accesso all'intero project. I project servono anche a controllare a quali repository di controllo versione hanno accesso i workspace. Queste funzionalità aiutano i team a gestire i workspace di cui sono responsabili, e rendono più facile per i proprietari dell'organizzazione seguire il principio del privilegio minimo.

Ai variable set si può dare uno scope a livello di project. Applicando un variable set a un project specifico, le variabili vengono associate automaticamente a tutti i workspace attuali e futuri del project, senza selezionarli uno per uno. Ad esempio, si può limitare un variable set di credenziali al project di un team, un'unità di business o un servizio specifici, per non far trapelare i valori ai workspace che non ne hanno bisogno. Anche i policy set si possono applicare a livello di project, per imporre in modo coerente gli standard di governance dell'organizzazione a tutti i workspace del project.

> **Nota**: i team sono disponibili in HCP Terraform Essentials Edition.
_(infoBox)_

Nel tutorial si creano due project e se ne limita l'accesso a team diversi. Si esamina anche l'interazione tra i diversi permessi relativi ai project.

### 8.16.1 — Creare i project

Ogni workspace di un'organizzazione HCP Terraform deve appartenere a un solo project. Per default ogni nuovo workspace si trova nel Default Project dell'organizzazione, che HCP Terraform crea automaticamente per ogni organizzazione e che si può rinominare ma non eliminare. Quando l'organizzazione ha più project, si può scegliere in quale project creare un nuovo workspace e spostare i workspace esistenti in altri project.

Nella pagina **Projects** dell'organizzazione si fa clic su **+ New Project**, si inserisce il nome `Platform` e si fa clic su **Create**. Allo stesso modo si crea un altro project chiamato `Application`.

![Figura 23](img/hcp-new-project.png) _(dimensioni: 2910×418 px)_

*Figura 23 — La creazione di un nuovo project in HCP Terraform. Fonte: HashiCorp Developer.* _(caption)_

Come proprietario dell'organizzazione si vedono tutti i project. Gli utenti che non sono proprietari, per amministrare tutti i project dell'organizzazione, hanno bisogno dei permessi admin sul project o del permesso di organizzazione **Manage all Projects**. Dopo aver creato un project, si possono creare variable set e associarli al project. Tutti i workspace attuali e futuri del project accedono automaticamente al variable set.

> **Suggerimento**: da Terraform 1.6 si può indicare un project non predefinito con l'argomento `project` nel blocco `cloud` della configurazione. Se il project non esiste ancora nell'organizzazione, HCP Terraform lo crea.
_(infoBox)_

### 8.16.2 — Creare workspace nei project

Nella pagina **Workspaces** dell'organizzazione si sceglie **New > Workspace**, si seleziona il project **Application** e si fa clic su **Create**. Si sceglie il **CLI-Driven Workflow** e si chiama il nuovo workspace `learn-terraform-projects-app`. Allo stesso modo si crea un altro workspace CLI-driven, `learn-terraform-projects-networking`, nel project **Platform**.

### 8.16.3 — Filtrare e spostare i workspace

Nella pagina **Workspaces** si possono filtrare i workspace per project: aprendo il pannello dei project e scegliendo **Application**, HCP Terraform elenca solo il workspace `learn-terraform-projects-app`. Per spostare un workspace in un altro project, dalla pagina **Workspaces** si passa il mouse sul workspace, si fa clic sul pulsante con i puntini (`...`) e si sceglie **Change project**. Un workspace si può spostare in un altro project in qualsiasi momento anche dalla pagina delle impostazioni generali del workspace.

> **Attenzione**: spostare un workspace in un altro project può cambiarne i permessi e influire sui workflow degli utenti.
_(infoBox)_

### 8.16.4 — Creare i team

Usando i project per definire i permessi di accesso, si limitano le risorse con cui un utente può interagire in HCP Terraform. I project danno ai membri dei team i permessi per creare e gestire in sicurezza solo i workspace di cui hanno bisogno, senza dar loro accesso a tutti i workspace dell'organizzazione, e aiutano così a seguire il principio del privilegio minimo.

Nella pagina **Settings** dell'organizzazione, alla voce **Teams**, si crea un nuovo team chiamato `platform`. Sotto **Project permissions** e **Workspace permissions** si seleziona **None**, senza aggiungere altri permessi. Poi si crea un altro team chiamato `application` con le stesse impostazioni.

Dalle pagine di creazione e impostazione dei team si possono impostare solo permessi validi per tutta l'organizzazione. I permessi su workspace e project specifici vanno concessi dalle rispettive pagine delle impostazioni. Con nessun accesso nelle impostazioni del team, i membri del team hanno accesso solo ai project o ai workspace a cui li si aggiunge esplicitamente. Progettando così i privilegi dei team si evita di dare privilegi troppo permissivi, validi per tutta l'organizzazione, a utenti che non ne hanno bisogno.

### 8.16.5 — Gestire i permessi dei project

Per un project si possono indicare permessi personalizzati, o assegnare uno dei quattro insiemi di permessi fissi:

- **Admin**: i membri del team amministrano completamente il project e tutti i suoi workspace. Possono leggere, modificare ed eliminare il project, crearvi nuovi workspace, spostare workspace dentro o fuori dal project e gestire l'accesso al project dei team che vedono.
- **Maintain**: i membri del team possono creare e gestire workspace nel project, e creare infrastruttura in quei workspace. Non possono eliminare il project, gestirne i permessi, né spostare workspace dentro o fuori dal project.
- **Write**: i membri del team possono creare infrastruttura nei workspace del project, ma non gestire i workspace o il project.
- **Read**: i membri del team possono leggere il nome del project e i dettagli dei suoi workspace. È utile per altri team che devono consultare i dati delle risorse dell'infrastruttura senza gestirle.

Nella pagina **Projects**, per il project **Application**, si sceglie **Edit project** dal pulsante con i puntini nella colonna **Actions**. Da questa pagina si aggiorna il nome di un project, se ne gestisce l'accesso e lo si elimina. Si sceglie **Team access** nel pannello di sinistra, poi **+ Add team**.

In questo scenario si assegnano i permessi in modo che i team possano usare i project e i loro workspace per gestire l'infrastruttura, senza essere responsabili del project stesso. Si seleziona il team `application`, si sceglie l'insieme di permessi **Maintain** e si fa clic su **Assign permissions**. Poi si concedono al team `platform` i privilegi admin sul project **Application**. Queste impostazioni abilitano un modello self-service: il team `application` gestisce l'infrastruttura all'interno del project, e solo il team `platform` può amministrare il project e gestirne i permessi.

![Figura 24](img/hcp-project-team-access.png) _(dimensioni: 2059×2087 px)_

*Figura 24 — I permessi finali del project Application: il team application ha i permessi Maintain, il team platform è admin. Fonte: HashiCorp Developer.* _(caption)_

Infine, nella pagina delle impostazioni del project **Platform**, si concedono al team `platform` i privilegi admin. Il team `application` non ha accesso ai workspace di quel project, e non può nemmeno vedere che il project o i workspace esistono.

### 8.16.6 — Le conseguenze sugli accessi

Quando si usano i project per definire i permessi di accesso, bisogna ricordare che i permessi su workspace, project e organizzazione possono sovrapporsi.

I permessi validi per tutta l'organizzazione prevalgono sui privilegi limitati definiti su workspace e project specifici. I team con il permesso di organizzazione **Manage all Workspaces** possono gestire tutti i workspace, ma possono creare workspace solo nel Default Project. I team con entrambi i permessi **Manage all projects** e **Manage all workspaces** possono gestire project e workspace su cui non hanno permessi espliciti. Quando si verifica chi ha accesso a un project o a un workspace specifico, non bisogna dimenticare gli utenti con permessi a livello di organizzazione.

I project e i workspace a cui un utente ha accesso possono influire sulla sua capacità di gestire le interazioni tra workspace, come la condivisione dello state remoto e i run trigger. I permessi di accesso influiscono sulla gestione delle impostazioni tra workspace, ma non sul comportamento dei run.

Nel tutorial, il team `application` non può condividere lo state del workspace dell'applicazione con i workspace del project **Platform**. Il team `platform` invece può abilitare la condivisione dello state dai propri workspace verso quelli dell'applicazione, perché ha accesso a entrambi i project. I membri del team `application` potrebbero poi eseguire run riusciti nei propri workspace.

L'accesso allo state di un altro workspace permette di leggere tutti i dati sulle risorse di quel workspace, anche senza un accesso esplicito a livello di organizzazione, project o workspace. Per questo, quando possibile, è consigliato usare i data source specifici del provider al posto del data source di remote state.

- Fonte: [Organize workspaces with projects](https://developer.hashicorp.com/terraform/tutorials/cloud/projects)

---

## 8.17 — Gestire i variable set in HCP Terraform

I variable set di HCP Terraform permettono di riusare le variabili in modo efficiente e centralizzato: si impostano i valori una volta e li si usa in più workspace. Quando si aggiornano i valori, le modifiche valgono automaticamente per tutti i workspace associati, e così è più facile aggiornare credenziali e impostazioni dell'infrastruttura. HCP Terraform permette anche di sovrascrivere, per singolo workspace, le variabili definite nei variable set. Così si modifica la configurazione del workspace senza toccare gli altri workspace che usano il variable set.

Nel tutorial si gestiscono più variable set di HCP Terraform, per le credenziali AWS e per la configurazione di DynamoDB. Si esamina anche la precedenza tra variabili duplicate in più variable set, e tra le variabili dei variable set e quelle specifiche del workspace.

### 8.17.1 — Inizializzare la configurazione

Nelle directory `dev` e `staging` si sostituisce `<ORGANIZATION_NAME>` nel blocco `cloud` di `versions.tf` con il nome della propria organizzazione. Le due configurazioni usano i workspace `learn-terraform-variable-sets-dev` e `learn-terraform-variable-sets-staging`. Inizializzandole, si creano i due workspace in HCP Terraform, configurati per il workflow CLI-driven con esecuzione remota.

```
terraform {

  cloud {
    organization = "<ORGANIZATION_NAME>"

    workspaces {
      name = "learn-terraform-variable-sets-dev"
    }
  }
}
```

### 8.17.2 — Creare i variable set

I variable set di HCP Terraform sono gruppi di variabili riutilizzabili creati a livello di organizzazione. Un variable set può avere uno di questi tre scope:

- **Globale**: si applica a tutti i workspace attuali e futuri dell'organizzazione.
- **Specifico per project**: si applica a tutti i workspace attuali e futuri dei project selezionati.
- **Specifico per workspace**: si applica solo ai workspace selezionati.

Uno scope più ampio abilita i workflow self-service. Ad esempio, si può creare un variable set e applicarlo al project di un team, e poi dare al team il permesso di creare workspace nel project. I workspace futuri erediteranno automaticamente il variable set, senza lavoro aggiuntivo o approvazioni. È consigliato però limitare il più possibile lo scope dei variable set che contengono credenziali, per non dare accesso a team o workspace che non ne hanno bisogno.

**Un variable set per le credenziali** _(stepTitle)_

Nelle impostazioni dell'organizzazione si sceglie **Variable Sets**, poi **Create variable set**, e si chiama il primo variable set `AWS credentials`.

> **Attenzione**: quando possibile, i variable set di credenziali vanno applicati a project o workspace specifici. Bisogna evitare l'accesso globale e seguire il principio del privilegio minimo.
_(infoBox)_

Nella sezione **Variable set scope** si sceglie **Apply to specific projects and workspaces**, e si selezionano i workspace `learn-terraform-variable-sets-dev` e `learn-terraform-variable-sets-staging`. Con **+Add Variable** si definisce una environment variable `AWS_ACCESS_KEY_ID`, marcata come sensitive, e allo stesso modo `AWS_SECRET_ACCESS_KEY`. Con credenziali AWS temporanee bisogna aggiungere anche `AWS_SESSION_TOKEN` come environment variable. Infine si fa clic su **Create variable set**.

![Figura 25](img/hcp-create-variable-set.png) _(dimensioni: 2380×940 px)_

*Figura 25 — La creazione del variable set con le credenziali AWS come environment variable sensitive. Fonte: HashiCorp Developer.* _(caption)_

**Un variable set per le impostazioni di configurazione** _(stepTitle)_

I variable set servono anche a definire input variable riutilizzabili. Nello scenario del tutorial si creano tabelle DynamoDB per due ambienti, dev e staging, e un variable set definisce le capacità di lettura e scrittura di entrambe. Si crea un altro variable set chiamato `Default DynamoDB settings`, applicato agli stessi due workspace. Vi si definiscono due Terraform variable, `db_write_capacity` e `db_read_capacity`, entrambe con valore 1. Invece di definire la capacità di lettura e scrittura in ciascun workspace, le si definisce una volta come variable set, e le si applica ai workspace che ne hanno bisogno.

### 8.17.3 — Le variabili del workspace e l'apply

Quali variable set si applicano a un workspace si vede, e si gestisce, dal workspace stesso. Nella scheda **Variables** del workspace `learn-terraform-variable-sets-dev`, sotto **Variable sets**, compaiono entrambi i variable set, `AWS credentials` e `Default DynamoDB settings`, con le variabili che contengono. Si applicano poi le configurazioni nelle directory `dev` e `staging`.

### 8.17.4 — La precedenza tra variable set

Se più variable set associati al workspace contengono una variabile dello stesso tipo (input o environment) con lo stesso nome, HCP Terraform usa l'ordine lessicale per stabilire la precedenza delle variabili.

Nello scenario si è applicato un insieme di impostazioni DynamoDB di default a entrambe le tabelle. Di solito si vogliono impostazioni coerenti su entrambe le risorse, ma si potrebbe voler eseguire un test di carico su una delle tabelle. Si crea quindi un nuovo variable set chiamato `Add Capacity - DynamoDB load testing`, applicato al workspace `learn-terraform-variable-sets-staging`, con `db_write_capacity` e `db_read_capacity` impostate a 10.

Nella pagina **Variables** del workspace di staging compaiono ora 3 variable set, e il set `Default DynamoDB settings` mostra i propri valori come sovrascritti. Entrambi i variable set, quello di default e quello di test di carico, definiscono variabili chiamate `db_write_capacity` e `db_read_capacity`. Il nome del variable set di test di carico inizia con la lettera "A", quindi ha la precedenza sulle impostazioni di default. Per far usare a HCP Terraform il variable set di default, si possono cambiare i nomi dei variable set, perché quello di default abbia la precedenza lessicale. In alternativa si rimuove il variable set di test di carico dal workspace. Con `terraform apply` nella directory `staging`, Terraform usa il variable set di test di carico e aumenta le capacità di lettura e scrittura della tabella.

> **Nota**: il tutorial dice che Terraform usa il variable set "applicato più di recente". Secondo la pagina sulla precedenza delle variabili, però, vince il set con precedenza lessicale (ad esempio `A_Variable_Set` su `B_Variable_Set`), indipendentemente da quale sia stato modificato più di recente.
_(infoBox)_

### 8.17.5 — Sovrascrivere una variabile di un variable set

Una variabile definita in un variable set si può sovrascrivere anche creando una variabile specifica del workspace con la stessa chiave. HCP Terraform usa sempre le variabili specifiche del workspace al posto di quelle definite nei variable set applicati al workspace.

In uno scenario di test di carico si potrebbe voler aumentare la capacità di scrittura, per vedere come risponde l'applicazione. Nel workspace di staging si crea una input variable specifica del workspace, `db_write_capacity`, con valore 15. HCP Terraform mostra ora come sovrascritta la variabile `db_write_capacity` del variable set di test di carico. Con `terraform apply`, HCP Terraform dà la priorità al valore specifico del workspace e porta la capacità di scrittura della tabella a 15, sovrascrivendo i valori del variable set.

- Fonte: [Manage variable sets in HCP Terraform](https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-multiple-variable-sets)

---

## 8.18 — Gestire variabili e variable set

Le variabili si possono impostare per ogni workspace, oppure si possono creare variable set per riusare le stesse variabili in più workspace e Stack. Si possono anche impostare valori di variabili specifici per ogni run del workspace, dalla riga di comando. Le variabili specifiche del workspace si creano e si modificano dall'interfaccia di HCP Terraform, con l'API Variables, o con la risorsa `tfe_variable` del provider `tfe`, che può essere più comoda per la gestione in massa.

### 8.18.1 — Permessi

Per vedere le variabili di un workspace e i variable set dell'organizzazione serve il permesso **Read variables**. Per creare o modificare variabili specifiche di un workspace serve il permesso **Read and write variables** su quel workspace.

Per creare, aggiornare o eliminare i variable set dell'organizzazione bisogna essere membri del team owners, o di un team con **Manage all projects** o **Manage all workspaces**. Per creare, modificare o applicare i variable set di un project bisogna far parte di un team con uno di questi permessi:

- permessi di project Write, Maintain o Admin;
- il permesso di project Manage variable sets;
- il permesso di organizzazione Manage all projects.

### 8.18.2 — Variabili specifiche di un run

Da Terraform 1.1 si possono impostare valori di Terraform variable per un particolare plan o apply dalla riga di comando. Questi valori sovrascrivono le variabili specifiche del workspace e quelle dei variable set con la stessa chiave. Le variabili specifiche di un run si impostano in due modi:

- con gli argomenti `-var` e `-var-file`, ad esempio `terraform apply -var="key=value" -var-file="testing.tfvars"`;
- creando variabili d'ambiente locali con il prefisso `TF_VAR_`. Ad esempio, per una variabile `replicas` dichiarata nella configurazione si crea una variabile d'ambiente locale `TF_VAR_replicas`. Con il workflow CLI, Terraform riconosce automaticamente queste variabili d'ambiente e ne applica i valori al run.

### 8.18.3 — Variabili specifiche del workspace

Le variabili di un workspace si vedono e si gestiscono dalla scheda **Variables** del workspace. La pagina mostra tutte le variabili specifiche del workspace e i variable set applicati, e permette di aggiungere, modificare ed eliminare le variabili e di applicare o rimuovere i variable set. La pagina **Variables** non è disponibile per i workspace in modalità di esecuzione Local: in quella modalità HCP Terraform non valuta le variabili del workspace né i variable set.

Per aggiungere una variabile si fa clic su **+ Add variable** nella sezione **Workspace Variables**. Si sceglie una categoria (Terraform o environment), la si marca facoltativamente come sensitive, e si inseriscono chiave, valore e una descrizione facoltativa. Solo per le Terraform variable si può selezionare la casella **HCL**, per inserire un valore in HCL. Infine si fa clic su **Save variable**, e HCP Terraform applica la variabile ai run. Per modificarla o eliminarla si usano i puntini accanto alla variabile, con **Edit** o **Delete**. Per eseguire le query dalla pagina **Search & Import** bisogna fornire le credenziali e le impostazioni richieste dal provider. Vanno aggiunte come environment variable, marcando i segreti come sensitive.

HCP Terraform elenca sotto l'intestazione **Dynamic provider credential sets** gli insiemi di variabili configurati sul workspace per le credenziali dinamiche dei provider (sezione 8.22). Per i workspace che usano AWS c'è anche il pulsante **Quick setup for AWS dynamic credentials**.

### 8.18.4 — Caricare le variabili dai file

Nei workspace con Terraform 0.10.0 o successivo, i valori delle Terraform variable si possono impostare con un numero qualsiasi di file che terminano in `.auto.tfvars`. Quando si avvia un run, Terraform carica e usa automaticamente le variabili definite in questi file. Se una variabile del workspace ha la stessa chiave di una variabile del file, la variabile del workspace sovrascrive quella del file.

Funziona solo con i file che terminano in `auto.tfvars` o con `terraform.tfvars`. Gli altri tipi di file `.tfvars` si applicano con la riga di comando per ogni run. HCP Terraform carica le variabili dai file `auto.tfvars` a ogni run, ma non le salva automaticamente nel workspace e non le mostra nella sezione **Variables** dell'interfaccia.

### 8.18.5 — I variable set

I variable set sono insiemi riutilizzabili di variabili da applicare a più workspace e Stack, e possono appartenere a un'organizzazione o a un project. Il proprietario del variable set determina i permessi necessari per gestirlo. Le query create ed eseguite dalla pagina **Search & Import** usano le environment variable dei variable set applicati al workspace. Con i variable set si condividono quindi credenziali e impostazioni dei provider tra workspace, anche tra quelli senza configurazione Terraform. HCP Terraform non valuta i variable set durante i run dei workspace in modalità di esecuzione Local. I variable set si vedono in **Settings > Variable sets** dell'organizzazione o del project.

**Creare i variable set** _(stepTitle)_

Per creare un variable set, in **Settings > Variable Sets** dell'organizzazione o del project si fa clic su **Create variable set**. Si sceglie un nome descrittivo e si scrive una descrizione facoltativa. Poi si sceglie lo scope del variable set:

- per un variable set dell'organizzazione, **Apply globally**, con cui HCP Terraform lo applica automaticamente a tutti i workspace esistenti e futuri. In alternativa si sceglie **Apply to specific projects, Stacks, or workspaces**, che vale per tutti i workspace e gli Stack attuali e futuri dei project selezionati;
- per un variable set del project, **Apply to the entire project**, che lo applica a tutti i workspace e gli Stack esistenti e futuri del project. In alternativa si sceglie **Apply to specific workspaces and Stacks in the project**.

Poi si aggiungono una o più variabili con **+ Add variable**, scegliendo il tipo (Terraform o environment) ed eventualmente marcandole come sensitive. HCP Terraform dà errore se si dichiarano variabili con la stessa chiave in più variable set globali. Infine si fa clic su **Create variable set**. Dopo la creazione, gli utenti possono anche aggiungere il variable set ai propri workspace.

**Modificare, eliminare, applicare e rimuovere i variable set** _(stepTitle)_

Un variable set si modifica o si elimina dalla sua pagina in **Settings > Variable Sets**. Eliminare un variable set può essere un'azione distruttiva, soprattutto se le variabili servono per eseguire i run. È consigliato avvisare prima i proprietari di organizzazione, project, Stack e workspace. Dopo l'eliminazione, i run di quei workspace e Stack non possono più usarne le variabili.

Dall'interno di un workspace, nella scheda **Variables**, sezione **Variable sets**, si applica un variable set con **Apply Variable Set**. Lo si rimuove con i puntini accanto al variable set e **Remove variable set**. Il variable set viene rimosso da quel workspace, ma resta disponibile agli altri workspace dell'organizzazione.

**Variable set e Stack** _(stepTitle)_

Negli Stack si accede ai variable set con il blocco `store`. Lo Stack deve poter accedere al variable set, dando accesso al project dello Stack o rendendo il variable set disponibile globalmente. Al variable set si fa poi riferimento nella configurazione di deployment, `<NAME>.tfdeploy.hcl`, con il blocco `store`. Nell'esempio seguente il blocco `store` accede ai valori delle variabili Terraform di un variable set chiamato `"Database passwords"`:

```
store "varset" "secrets" {
  name       = "Database passwords"
  category = "terraform"
}
```

I deployment dello Stack possono fare riferimento direttamente ai valori delle variabili con la sintassi `store.varset.<VARSET_NAME>.<VARIABLE_NAME>`. Nell'esempio seguente il deployment usa la variabile `db_password` per configurare il deployment di produzione:

```
store "varset" "secrets" {
  name       = "MY_COOL_VARSET"
  category = "terraform"
}

deployment "production" {
  inputs = {
    database_password = store.varset.secrets.db_password
    instance_count   = 5
  }
}
```

Gli Stack leggono i variable set durante i run di deployment, quindi le modifiche ai valori si riflettono automaticamente nei deployment futuri. Se un variable set viene rimosso dal project o dall'organizzazione dello Stack, lo Stack che vi fa riferimento non riesce a fare il deployment. Gli Stack fanno riferimento ai variable set direttamente per nome o ID, quindi la precedenza delle variabili non li riguarda: se uno Stack fa riferimento a un variable set, usa sempre i valori di quel set, anche se esistono variabili a livello di organizzazione o altri variable set con variabili dello stesso nome. L'autenticazione degli Stack con i valori dei variable set è descritta in *Authenticate a Stack*, e la sintassi dei riferimenti ai variable set, con esempi, nella documentazione del blocco `store`.

### 8.18.6 — Sovrascrivere i variable set e i variable set prioritari

Le variabili definite nei variable set si possono sovrascrivere in un workspace, ad esempio per usare un insieme diverso di credenziali del provider in un workspace specifico. Si crea una nuova variabile specifica del workspace, dello stesso tipo e con la stessa chiave. HCP Terraform marca le variabili sovrascritte con un'etichetta gialla **OVERWRITTEN**, e facendo clic sulla variabile sovrascritta evidenzia quella che userà nei run. Anche le variabili di un variable set possono sovrascrivere automaticamente quelle con la stessa chiave di altri variable set applicati allo stesso workspace. I variable set sono creati per l'organizzazione o il project, ma queste sovrascritture avvengono all'interno di ogni workspace.

I valori dei **variable set prioritari** sovrascrivono tutte le variabili con la stessa chiave impostate a scope più specifici, comprese quelle impostate con le opzioni della riga di comando o con i file `*.auto.tfvars` e `terraform.tfvars`. Un utente può comunque modificare direttamente la configurazione Terraform, eliminare l'uso di una variabile e sostituirlo con un valore scritto a mano. Per un controllo più rigoroso è consigliato usare i policy check o le run task.

> **Nota**: la pagina originale scrive `.*auto.tfvars`; il nome corretto dei file è `*.auto.tfvars`.
_(infoBox)_

### 8.18.7 — Valori e formato delle variabili

I limiti, i valori ammessi e il formato richiesto sono gli stessi per le variabili specifiche del workspace e per i variable set.

**Sicurezza** _(stepTitle)_

HCP Terraform cifra tutti i valori delle variabili con il transit backend di Vault prima di salvarli, così nessuno senza autorizzazione può leggerli. Le descrizioni delle variabili però sono conservate in chiaro, quindi bisogna fare attenzione a cosa vi si scrive.

È consigliato passare le credenziali a Terraform come environment variable invece che come Terraform variable, quando possibile. I run di Terraform ricevono infatti il testo completo di tutti i valori delle Terraform variable, comprese quelle sensitive. Questi valori possono comparire nei log e nei file di state, se la configurazione li manda in un output o in un parametro di una risorsa. Anche i mock Sentinel scaricati dai run contengono i valori sensibili delle Terraform variable. HCP Terraform non conserva le environment variable nello state, ma può includerle nei file di log se `TF_LOG` è impostato a `TRACE`. Un'alternativa alle credenziali statiche, per alcuni provider, sono le credenziali dinamiche: credenziali temporanee per ogni run, senza bisogno di ruotare a mano i segreti.

**Limiti, testo su più righe e HCL** _(stepTitle)_

Valgono questi limiti di lunghezza:

| **Componente** | **Limite** |
|---|---|
| description | 512 caratteri |
| key | 128 caratteri |
| value | 256 kilobyte |

Nei campi dei valori si può scrivere o incollare testo su più righe. L'HCL si può usare per le Terraform variable, non per le environment variable, e lo interpreta la stessa versione di Terraform che esegue i run nel workspace. Per default i valori delle variabili sono stringhe. Per inserire valori list o map si seleziona la casella **HCL** della variabile, e si scrive il valore con la stessa sintassi HCL del codice Terraform:

```
{
    us-east-1 = "image-1234"
    us-west-2 = "image-4567"
}
```

**Valori sensibili e descrizioni** _(stepTitle)_

Terraform ha spesso bisogno di credenziali dei cloud provider e di altre informazioni sensibili, che non devono essere ampiamente disponibili nell'organizzazione. Per proteggere questi segreti, qualsiasi Terraform variable o environment variable si può marcare come dato sensibile con la casella **Sensitive**, visibile durante la modifica. Anche le variabili sensitive possono comparire in alcuni casi nei log e nei file di state.

Marcare una variabile come sensitive la rende write-only, e impedisce a tutti gli utenti, compreso chi l'ha creata, di vederne il valore nell'interfaccia di HCP Terraform o di leggerlo tramite l'endpoint Variables dell'API. Gli utenti con il permesso di leggere e scrivere le variabili possono impostare nuovi valori per le variabili sensitive, ma non modificarne gli altri attributi. Per aggiornarli bisogna eliminare la variabile e crearne una nuova al suo posto.

Le descrizioni delle variabili non sono cifrate, quindi non devono contenere informazioni sensibili. Sono facoltative, servono a distinguere variabili con nomi simili, e compaiono solo nella pagina **Variables**. Sono del tutto indipendenti dalle descrizioni delle variabili dichiarate nella CLI di Terraform.

- Fonte: [Manage variables and variable sets](https://developer.hashicorp.com/terraform/cloud-docs/variables/managing-variables)

---

## 8.19 — I team

I team sono gruppi di utenti HCP Terraform all'interno di un'organizzazione. Un utente che appartiene ad almeno un team di un'organizzazione è considerato membro di quell'organizzazione. La gestione dei team è disponibile nelle edizioni Essentials, Standard e Premium di HCP Terraform.

Un'organizzazione può concedere ai team permessi sui workspace, che permettono ai membri di avviare run di Terraform, creare variabili del workspace, leggere e scrivere lo state e altro ancora. I team possono avere permessi solo sui workspace della propria organizzazione, ma i singoli utenti possono appartenere a più team di questa e di altre organizzazioni. Nelle organizzazioni HCP Europe l'accesso degli utenti si gestisce con i gruppi HCP, e HCP Terraform eredita gruppi e ruoli da HCP.

### 8.19.1 — Gestire i team con l'API o il provider tfe

Oltre che dall'interfaccia di HCP Terraform, i team si gestiscono con questi strumenti:

- l'API Teams, per elencare, creare, aggiornare ed eliminare i team;
- l'API Team Members, per aggiungere e togliere utenti dai team;
- l'API Team Tokens, per generare ed eliminare token ed elencare i token dei team di un'organizzazione;
- l'API Team Access, per gestire l'accesso dei team a uno o più workspace;
- le risorse `tfe_team`, `tfe_team_members` e `tfe_team_access` del provider `tfe`.

Ogni team può avere token API non associati a un utente specifico. I token dei team si gestiscono dalla pagina **Organization settings > API Tokens > Team Token**, dove si possono creare, rigenerare ed eliminare.

### 8.19.2 — Il team owners

Ogni organizzazione ha un team **owners**, i cui membri si chiamano a volte proprietari dell'organizzazione. Chi crea un'organizzazione è il primo membro del suo team owners. Gli altri membri si aggiungono e si rimuovono come negli altri team. Nelle organizzazioni gratuite il team owners è limitato a cinque membri, in quelle a pagamento non ha limiti di dimensione. Il team owners non si può eliminare né lasciare vuoto: se ha un solo membro, bisogna aggiungere un altro utente prima di rimuoverlo.

### 8.19.3 — Gestire i team e le notifiche

Dei team si gestiscono molti aspetti: la creazione e l'eliminazione, i membri, e l'accesso a workspace, project, Stack e organizzazioni. Si possono anche configurare notifiche di team, che avvisano i membri su sistemi esterni ogni volta che avviene una determinata azione.

- Fonte: [Teams overview](https://developer.hashicorp.com/terraform/cloud-docs/users-teams-organizations/teams)

---

## 8.20 — I permessi

Per controllare l'accesso all'interno delle organizzazioni si aggiungono gli utenti a un team, e si concedono al team i permessi per eseguire azioni, come creare o aggiornare uno o più project o workspace. Nelle organizzazioni HCP Europe, accessi e permessi si gestiscono con i gruppi e i ruoli HCP, e li si affina poi con i ruoli di HCP Terraform.

### 8.20.1 — I permessi effettivi

I permessi si impostano a tre scope: organizzazione, project e workspace. Ogni permesso è additivo, e dà all'utente il livello di permessi più alto possibile, indipendentemente dallo scope che lo ha impostato. I permessi effettivi di un team sono la somma dei permessi che il team ha a ogni livello. Lo scope in cui si concede un permesso non conta: è il livello di accesso concesso a stabilire cosa può fare l'utente.

Ad esempio, un team ha il permesso **Manage all workspaces** sull'organizzazione e il ruolo **Read** su un workspace. Il team ha quindi i permessi Manage all workspaces anche su quel workspace, perché è il livello di accesso più permissivo. Viceversa, il permesso di organizzazione di un team non sostituisce il suo permesso sul workspace. Ad esempio, il permesso **View all workspaces** impostato sull'organizzazione non sostituisce il ruolo **Write** impostato su un workspace specifico.

È consigliato seguire il principio del privilegio minimo nella configurazione dei permessi, e concedere agli utenti solo i permessi necessari ad accedere alle risorse che servono alla loro funzione.

### 8.20.2 — Ruoli dei gruppi HCP e permessi di HCP Terraform

In un'organizzazione HCP Europe l'accesso degli utenti si gestisce con i gruppi, e ai gruppi si assegnano permessi in due modi:

- **ruoli HCP**: si assegnano ai gruppi in HCP, e concedono automaticamente permessi in HCP Terraform;
- **ruoli HCP Terraform**: si assegnano permessi aggiuntivi a livello di organizzazione, project e workspace, per affinare l'accesso dei gruppi in HCP Terraform.

Anche qui vale il principio del privilegio minimo. I ruoli HCP concedono permessi in HCP Terraform e negli altri servizi HCP. Se un gruppo deve solo gestire risorse in HCP Terraform, conviene assegnare ruoli in HCP Terraform ed evitare ruoli HCP più permissivi. Ad esempio, per far vedere a un utente tutti i workspace di un'organizzazione HCP Terraform, si può assegnare il permesso **View all workspaces** a livello di organizzazione in HCP Terraform, invece del ruolo **Viewer** di HCP, più permissivo.

### 8.20.3 — Permessi gestiti da sistemi esterni

Questa documentazione riguarda solo i permessi gestiti da HCP Terraform e Terraform Enterprise. I modelli di permessi dei sistemi integrati possono però influire sulla sicurezza complessiva dell'organizzazione. Ad esempio:

- quando un workspace è collegato a un repository VCS, chiunque possa unire modifiche nel branch principale di quel repository può accodare indirettamente plan nel workspace. Vale anche per chi non ha il permesso esplicito di accodare plan, o non è nemmeno membro dell'organizzazione HCP Terraform. Con l'auto-apply attivo, il merge delle modifiche avvia indirettamente i run;
- se si usa l'API di HCP Terraform per creare un bot Slack che crea infrastruttura, chiunque possa dare comandi a quel bot agisce implicitamente con i permessi del bot, indipendentemente dalla propria appartenenza e dai propri permessi nell'organizzazione;
- quando una run task invia una richiesta a un integratore, fornisce un token di accesso, con un accesso che dipende dalla fase della run task. Ad esempio, in post-plan dà accesso al JSON del plan del run e alla callback della run task. Tutti i token di accesso creati per le run task durano 10 minuti.

Quando si integra HCP Terraform con altri sistemi, si è responsabili di capire gli effetti sulla sicurezza dell'organizzazione. Un sistema integrato può delegare qualsiasi livello di accesso che gli è stato concesso, quindi bisogna valutare con attenzione le condizioni e gli eventi che lo porteranno a delegarlo.

- Fonte: [Permissions overview](https://developer.hashicorp.com/terraform/cloud-docs/users-teams-organizations/permissions)

---

## 8.21 — Autenticare i provider con le credenziali dinamiche

Le credenziali dinamiche dei provider (dynamic provider credentials) di HCP Terraform permettono di stabilire una relazione di fiducia tra HCP Terraform e il cloud provider. Limitano il raggio d'azione di credenziali compromesse, perché usano credenziali univoche e di breve durata per ogni run di Terraform. Danno anche un controllo preciso sulle risorse che ogni project e workspace di HCP Terraform può gestire. HCP Terraform supporta le credenziali dinamiche per AWS, Google Cloud Platform, Azure e Vault.

Con le credenziali dinamiche, HCP Terraform inizia ogni run autenticandosi presso il cloud provider, e gli passa i dettagli del carico di lavoro, compresi il nome dell'organizzazione e del workspace. Il cloud provider risponde con credenziali temporanee, che HCP Terraform usa per creare le risorse del run. Il workflow si basa sul protocollo OpenID Connect (OIDC), uno standard aperto per verificare l'identità tra sistemi diversi.

Nel tutorial si configura una relazione di fiducia tra HCP Terraform e il cloud provider, e un workspace con credenziali dinamiche, con cui poi si crea l'infrastruttura del workspace. Il repository di esempio ha una configurazione per ogni cloud supportato (Vault, AWS, GCP, Azure, EKS e GKE). Le sezioni 8.21.1 e 8.21.2 seguono passo per passo la variante AWS, e la sezione 8.21.3 riporta le configurazioni degli altri provider. Chi usa Vault per gestire i segreti può usarlo anche per gestire le credenziali dinamiche dei provider, con le credenziali dinamiche basate su Vault.

### 8.21.1 — Configurare la fiducia con il cloud provider

Per usare le credenziali dinamiche bisogna prima stabilire una relazione di fiducia tra il cloud provider e HCP Terraform. Bisogna anche creare i ruoli e le policy che definiscono le risorse e i servizi che le credenziali dinamiche possono gestire. Nel tutorial la relazione di fiducia si crea eseguendo i comandi di Terraform in locale, nella directory `aws/trust`. In produzione si può preferire gestire le relazioni di fiducia in workspace HCP Terraform dedicati.

La configurazione definisce prima il provider AWS e recupera il certificato TLS di HCP Terraform, che AWS userà per verificare che le richieste di credenziali dinamiche provengano da HCP Terraform:

```
provider "aws" {
  region = var.aws_region
}

data "tls_certificate" "tfc_certificate" {
  url = "https://${var.tfc_hostname}"
}
```

Poi configura in AWS un provider OIDC, con il certificato TLS di HCP Terraform, l'impronta SHA1 del certificato e un identificatore univoco del cloud provider chiamato **audience**:

```
resource "aws_iam_openid_connect_provider" "tfc_provider" {
  url             = data.tls_certificate.tfc_certificate.url
  client_id_list  = [var.tfc_aws_audience]
  thumbprint_list = [data.tls_certificate.tfc_certificate.certificates[0].sha1_fingerprint]
}
```

Poi definisce un ruolo IAM per la relazione di fiducia. Se la richiesta soddisfa le condizioni del ruolo, AWS fornisce a HCP Terraform credenziali dinamiche che assumono questo ruolo:

```
resource "aws_iam_role" "tfc_role" {
  name = "tfc-role"

  assume_role_policy = <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Effect": "Allow",
     "Principal": {
       "Federated": "${aws_iam_openid_connect_provider.tfc_provider.arn}"
     },
     "Action": "sts:AssumeRoleWithWebIdentity",
     "Condition": {
       "StringEquals": {
         "${var.tfc_hostname}:aud": "${one(aws_iam_openid_connect_provider.tfc_provider.client_id_list)}"
       },
       "StringLike": {
         "${var.tfc_hostname}:sub": "organization:${var.tfc_organization_name}:project:${var.tfc_project_name}:workspace:${var.tfc_workspace_name}:run_phase:*"
       }
     }
   }
 ]
}
EOF
}
```

Questa configurazione fa verificare al cloud provider che le richieste di credenziali dinamiche soddisfino questi claim OIDC:

- `aud`, l'audience del token: una stringa univoca, sensibile a maiuscole e minuscole, che identifica il cloud provider. Così una richiesta di credenziali dinamiche destinata a un cloud provider non è valida per gli altri. L'audience si può personalizzare per alcuni casi d'uso avanzati, come usare più insiemi di credenziali dinamiche con lo stesso cloud provider; nel tutorial si usa il valore di default;
- `sub`, il subject del token: include il nome dell'organizzazione HCP Terraform, il project e il workspace che possono usare la relazione di fiducia. Così il cloud provider autentica solo le richieste dei project e dei workspace indicati dell'organizzazione, e i permessi si possono limitare per project o per workspace.

> **Suggerimento**: l'elenco degli altri claim possibili è nella documentazione delle credenziali dinamiche (*Dynamic Credentials*).
_(infoBox)_

Il claim `sub` ha quattro parti separate da due punti (`:`):

| **Claim** | **Valore** | **Scopo** |
|---|---|---|
| `organization` | `${var.tfc_organization_name}` | Il nome dell'organizzazione HCP Terraform |
| `project` | `${var.tfc_project_name}` | Il nome del project HCP Terraform |
| `workspace` | `${var.tfc_workspace_name}` | Il nome del workspace HCP Terraform |
| `run_phase` | `plan` o `apply` | La fase del workflow Terraform |

La configurazione di esempio usa la funzione `StringLike` e il carattere glob `*` per consentire qualsiasi fase del workflow. Nelle proprie relazioni di fiducia si può usare `*` anche per consentire le richieste da qualsiasi workspace di un project, o da qualsiasi project dell'organizzazione. A seconda delle esigenze, si può configurare una sola relazione di fiducia per ogni cloud provider, o relazioni separate per ogni project o workspace.

A ogni run, dopo che il cloud provider ha verificato che la richiesta è firmata da HCP Terraform con il certificato TLS fornito, HCP Terraform fornisce un token **Terraform Workload Identity (TWI)**. Il token include informazioni sul run, come organizzazione, project e workspace. Il cloud provider usa i metadati OIDC e la chiave pubblica di firma di HCP Terraform per verificare che il token sia stato generato da HCP Terraform e non sia stato alterato. Dopo la verifica, se il token soddisfa le condizioni della relazione di fiducia, il cloud provider risponde con un insieme di credenziali dinamiche che usano il ruolo configurato, e HCP Terraform le usa per creare le risorse.

> **Attenzione**: quando si configurano i claim, vanno sempre inclusi l'audience e il nome dell'organizzazione HCP Terraform. Garantiscono che i claim siano validi solo per il cloud provider previsto, e impediscono l'accesso non autorizzato da altre organizzazioni HCP Terraform.
_(infoBox)_

Infine la configurazione definisce la policy IAM con le risorse che le credenziali dinamiche possono gestire, e la collega al ruolo. Questa policy consente tutte le operazioni sulle istanze EC2. Le policy IAM danno un controllo preciso sui permessi concessi dalle credenziali dinamiche, e si possono rendere restrittive o permissive quanto serve.

```
resource "aws_iam_policy" "tfc_policy" {
  name        = "tfc-policy"
  description = "TFC run policy"

  policy = <<EOF
{
 "Version": "2012-10-17",
 "Statement": [
   {
     "Effect": "Allow",
     "Action": [
       "ec2:*"
     ],
     "Resource": "*"
   }
 ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "tfc_policy_attachment" {
  role       = aws_iam_role.tfc_role.name
  policy_arn = aws_iam_policy.tfc_policy.arn
}
```

Si copia poi il file `terraform.tfvars.example` in `terraform.tfvars`, e vi si impostano il nome dell'organizzazione e quello del workspace (`learn-terraform-dynamic-credentials`), che definiscono il subject OIDC della policy della relazione di fiducia. Dopo `terraform init` e `terraform apply` la relazione di fiducia è creata, e l'output `role_arn` servirà nel passo successivo. Ora HCP Terraform può usare questa relazione di fiducia per richiedere credenziali dinamiche, quando crea l'infrastruttura del workspace `learn-terraform-dynamic-credentials` nel project di default.

### 8.21.2 — Creare l'infrastruttura con le credenziali dinamiche

La configurazione della directory `infra` definisce una singola istanza EC2 nella region `us-east-2`. Si crea un nuovo workspace nel Default Project con il **Version control workflow**, collegato al repository `learn-terraform-dynamic-credentials`. Tra le opzioni avanzate si imposta la **Terraform Working Directory** a `aws/infra`.

**Le variabili per la fiducia** _(stepTitle)_

Nella pagina **Variables** del workspace si aggiungono queste variabili:

| **Categoria** | **Chiave** | **Valore** | **Sensitive** |
|---|---|---|---|
| Environment variable | `TFC_AWS_PROVIDER_AUTH` | `true` | No |
| Environment variable | `TFC_AWS_RUN_ROLE_ARN` | l'output `role_arn` del run precedente | No |

La variabile `TFC_AWS_PROVIDER_AUTH` configura il workspace per usare le credenziali dinamiche con il provider AWS. `TFC_AWS_RUN_ROLE_ARN` è l'ARN del ruolo che AWS userà per creare le risorse con le credenziali dinamiche. Per gli altri cloud le variabili sono analoghe (sezione 8.21.3).

> **Suggerimento**: se si è chiusa la finestra del terminale con gli output della configurazione di fiducia, si torna nella directory `trust` e si esegue `terraform output` per mostrarli.
_(infoBox)_

Il provider controlla le variabili d'ambiente per decidere se richiedere credenziali dinamiche. Queste variabili si possono creare come variabili del workspace o come variable set. Per un workflow self-service, in cui i team creano workspace senza gestire variabili, conviene usare un project con un variable set con scope di project. I workspace attuali e futuri del project accedono automaticamente al variable set e sfruttano le credenziali dinamiche (sezione 8.17).

**Applicare la configurazione** _(stepTitle)_

Dal menu **Actions** del workspace si sceglie **Start new run**, con il tipo **Plan and apply**. HCP Terraform richiede credenziali dinamiche al cloud provider e le usa per eseguire il plan. Al termine, con **Confirm & Apply** e **Confirm Plan** si applica il plan, e HCP Terraform richiede un altro insieme di credenziali dinamiche per il passo di apply.

![Figura 26](img/hcp-dynamic-credentials-apply.png) _(dimensioni: 1768×984 px)_

*Figura 26 — Il run completato nel workspace: l'istanza è creata con credenziali dinamiche, senza credenziali di lunga durata salvate nel workspace. Fonte: HashiCorp Developer.* _(caption)_

Ora si è creata infrastruttura con HCP Terraform usando credenziali dinamiche invece di credenziali di lunga durata. Le credenziali non vanno conservate in HCP Terraform, e questo riduce il rischio di esporle per errore. Definire il ruolo e i permessi delle credenziali dinamiche permette di specificare esattamente per quali operazioni si possono usare quelle chiavi.

In un'organizzazione, team diversi possono essere responsabili delle relazioni di fiducia e del deployment dell'infrastruttura. Ad esempio, un team di sicurezza potrebbe configurare e gestire i workspace che definiscono le relazioni di fiducia. I team di infrastruttura gestirebbero invece i workspace a valle che le usano. In questo caso bisogna pensare a come coordinare le modifiche, per mantenere relazioni di fiducia limitate senza bloccare i team a valle. Le relazioni di fiducia fanno riferimento ai nomi di organizzazione, project e workspace: cambiare uno di questi valori in HCP Terraform può interromperle. Anche la distruzione dell'infrastruttura, con **Queue destroy plan**, usa le credenziali dinamiche.

### 8.21.3 — Le varianti per gli altri provider

Il tutorial ha una variante per ogni provider supportato. I passi sono gli stessi della variante AWS:

- si rivede la configurazione della relazione di fiducia nella directory `trust` del provider;
- si impostano organizzazione e workspace in `terraform.tfvars`;
- si applica la configurazione;
- si crea il workspace dell'infrastruttura, con la Terraform Working Directory del provider (`vault/infra`, `gcp/infra`, `azure/infra`, `eks/infra` o `gke/infra`);
- si aggiungono al workspace le variabili per la fiducia.

Cambiano le configurazioni e le variabili, riportate di seguito. Per Vault, GCP e Azure il file `terraform.tfvars` è uguale a quello della variante AWS.

**Vault** _(stepTitle)_

La configurazione definisce prima il provider Vault:

```
provider "vault" {}
```

Vault userà il certificato TLS di HCP Terraform per verificare che le richieste di credenziali dinamiche provengano da HCP Terraform. Poi la configurazione imposta un auth backend JWT, per stabilire la relazione di fiducia con HCP Terraform. Vault valida il certificato TLS di Terraform prima di accettare qualsiasi richiesta di credenziali dinamiche:

```
resource "vault_jwt_auth_backend" "tfc_jwt" {
  path               = var.jwt_backend_path
  type               = "jwt"
  oidc_discovery_url = "https://${var.tfc_hostname}"
  bound_issuer       = "https://${var.tfc_hostname}"
}
```

Poi definisce un ruolo per la relazione di fiducia. Se la richiesta soddisfa le condizioni del ruolo, Vault fornisce a HCP Terraform credenziali dinamiche che assumono questo ruolo. Il ruolo è collegato a una policy, descritta sotto. La configurazione imposta anche l'identificatore univoco del cloud provider, l'audience:

```
resource "vault_jwt_auth_backend_role" "tfc_role" {
  backend        = vault_jwt_auth_backend.tfc_jwt.path
  role_name      = "tfc-role"
  token_policies = [vault_policy.tfc_policy.name]

  bound_audiences = [var.tfc_vault_audience]

  bound_claims_type = "glob"
  bound_claims = {
    sub = "organization:${var.tfc_organization_name}:project:${var.tfc_project_name}:workspace:${var.tfc_workspace_name}:run_phase:*"
  }

  user_claim = "terraform_full_workspace"
  role_type  = "jwt"
  token_ttl  = 1200
}
```

La configurazione di esempio usa il tipo di bound claims `glob` e il carattere glob `*` per consentire qualsiasi fase del workflow. Come per AWS, nelle proprie relazioni di fiducia si può usare `*` anche per consentire le richieste da qualsiasi workspace di un project, o da qualsiasi project dell'organizzazione. Infine la configurazione definisce la policy che indica quali risorse possono gestire le credenziali dinamiche:

```
resource "vault_policy" "tfc_policy" {
  name = "tfc-policy"

  policy = <<EOT
# Allow tokens to query themselves
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# Allow tokens to renew themselves
path "auth/token/renew-self" {
    capabilities = ["update"]
}

# Allow tokens to revoke themselves
path "auth/token/revoke-self" {
    capabilities = ["update"]
}

path "sys/mounts" {
  capabilities = ["list", "read"]
}

path "sys/mounts/example" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}

path "example/*" {
  capabilities = ["create", "read", "update", "patch", "delete", "list"]
}
EOT
}
```

Questa policy consente l'accesso completo al percorso `example`. Le policy danno un controllo preciso sui permessi concessi dalle credenziali dinamiche. Dopo l'apply, l'output `run_role` serve nel passo successivo.

La configurazione dell'infrastruttura definisce un singolo segreto in un mount di esempio:

```
provider "vault" {}

resource "vault_mount" "example" {
  path    = "example"
  type    = "kv-v2"
  options = { version = "2" }
}

resource "vault_kv_secret_v2" "example" {
  mount = vault_mount.example.path

  name                = "unsecret"
  cas                 = 1
  delete_all_versions = true
  data_json = jsonencode(
    {
      foo = "bar"
    }
  )
}
```

Nella pagina Variables del workspace si aggiungono queste variabili:

| **Categoria** | **Chiave** | **Valore** | **Sensitive** |
|---|---|---|---|
| Environment variable | `TFC_VAULT_PROVIDER_AUTH` | `true` | No |
| Environment variable | `TFC_VAULT_ADDR` | l'indirizzo dell'istanza Vault | No |
| Environment variable | `TFC_VAULT_RUN_ROLE` | l'output `vault_run_role` del run precedente | No |
| Environment variable | `TFC_VAULT_NAMESPACE` | `admin` | No |

La variabile `TFC_VAULT_PROVIDER_AUTH` configura il workspace per usare le credenziali dinamiche con il provider Vault. Le altre variabili identificano l'istanza Vault e il ruolo che Vault userà per creare le risorse con le credenziali dinamiche.

> **Nota**: il testo della pagina chiama l'output `run_role`, mentre la tabella delle variabili lo chiama `vault_run_role`.
_(infoBox)_

**GCP** _(stepTitle)_

La configurazione definisce prima il provider GCP con l'ID del project, recupera i dati del project e abilita i servizi GCP usati per configurare la relazione di fiducia:

```
provider "google" {
  project = var.gcp_project_id
  region  = "global"
}

data "google_project" "project" {
}

resource "google_project_service" "services" {
  count   = length(var.gcp_service_list)
  service = var.gcp_service_list[count.index]
}
```

Poi crea un workload identity pool IAM e un provider per la relazione di fiducia. Il provider del workload identity pool mappa gli attributi GCP sulle asserzioni OIDC corrispondenti, e configura la relazione perché usi HCP Terraform. GCP verifica automaticamente, con il certificato TLS di HCP Terraform, che le richieste di credenziali provengano da HCP Terraform. La parte commentata della configurazione di esempio serve a impostare l'audience; qui non si impostano audience consentite, quindi il provider usa il valore di default. Infine l'attributo `attribute_condition` definisce l'organizzazione, il project e il workspace di HCP Terraform che possono usare la relazione di fiducia:

```
resource "google_iam_workload_identity_pool" "tfc_pool" {
  workload_identity_pool_id = "my-tfc-pool"
}

resource "google_iam_workload_identity_pool_provider" "tfc_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.tfc_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = "my-tfc-provider-id"

  attribute_mapping = {
    "google.subject"                        = "assertion.sub",
    "attribute.aud"                         = "assertion.aud",
    "attribute.terraform_run_phase"         = "assertion.terraform_run_phase",
    "attribute.terraform_project_id"        = "assertion.terraform_project_id",
    "attribute.terraform_project_name"      = "assertion.terraform_project_name",
    "attribute.terraform_workspace_id"      = "assertion.terraform_workspace_id",
    "attribute.terraform_workspace_name"    = "assertion.terraform_workspace_name",
    "attribute.terraform_organization_id"   = "assertion.terraform_organization_id",
    "attribute.terraform_organization_name" = "assertion.terraform_organization_name",
    "attribute.terraform_run_id"            = "assertion.terraform_run_id",
    "attribute.terraform_full_workspace"    = "assertion.terraform_full_workspace",
  }
  oidc {
    issuer_uri = "https://${var.tfc_hostname}"
    # The default audience format used by TFC is of the form:
    # //iam.googleapis.com/projects/{project number}/locations/global/workloadIdentityPools/{pool ID}/providers/{provider ID}
    # which matches with the default accepted audience format on GCP.
    #
    # Uncomment the line below if you are specifying a custom value for the audience instead of using the default audience.
    # allowed_audiences = [var.tfc_gcp_audience]
  }
  attribute_condition = "assertion.sub.startsWith(\"organization:${var.tfc_organization_name}:project:${var.tfc_project_name}:workspace:${var.tfc_workspace_name}\")"
}
```

La configurazione di esempio usa la funzione `startsWith` per consentire qualsiasi fase del workflow. Nelle proprie relazioni di fiducia si può usare `startsWith` anche per consentire le richieste da qualsiasi workspace di un project, o da qualsiasi project dell'organizzazione, omettendo quelle parti del claim. Infine la configurazione definisce un service account per la relazione di fiducia, lo collega all'identity pool e gli concede il ruolo Editor sul project:

```
resource "google_service_account" "tfc_service_account" {
  account_id   = "tfc-service-account"
  display_name = "HCP Terraform Service Account"
}

resource "google_service_account_iam_member" "tfc_service_account_member" {
  service_account_id = google_service_account.tfc_service_account.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.tfc_pool.name}/*"
}

resource "google_project_iam_member" "tfc_project_member" {
  project = var.gcp_project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.tfc_service_account.email}"
}
```

Questa policy consente l'accesso come editor al project. Le policy IAM, con ruoli predefiniti o personalizzati, danno un controllo preciso sui permessi concessi dalle credenziali dinamiche.

La configurazione dell'infrastruttura definisce una singola istanza di calcolo nella region `us-east1`:

```
provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

resource "google_compute_instance" "vm_instance" {
  name         = "terraform-instance"
  machine_type = var.machine_type

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {
    }
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    sudo yum update -y
    sudo yum install httpd -y
    sudo systemctl enable httpd
    sudo systemctl start httpd
    echo "<html><body><div>Hello, world!</div></body></html>" > /var/www/html/index.html
    EOF

  tags = var.tags
}
```

> **Nota**: lo script di avvio dell'esempio usa `yum` e il pacchetto `httpd`, ma l'immagine è Debian (`debian-cloud/debian-11`), che usa `apt`. Lo script va adattato, ad esempio con `apt-get install -y apache2`.
_(infoBox)_

Nel workspace si aggiungono queste variabili:

| **Categoria** | **Chiave** | **Valore** | **Sensitive** |
|---|---|---|---|
| Environment variable | `TFC_GCP_PROVIDER_AUTH` | `true` | No |
| Terraform variable | `gcp_project_id` | l'output `project_id` del run precedente | No |
| Environment variable | `TFC_GCP_PROJECT_NUMBER` | l'output `project_number` del run precedente | No |
| Environment variable | `TFC_GCP_RUN_SERVICE_ACCOUNT_EMAIL` | l'output `service_account_email` del run precedente | No |
| Environment variable | `TFC_GCP_WORKLOAD_POOL_ID` | l'output `workload_pool_id` del run precedente | No |
| Environment variable | `TFC_GCP_WORKLOAD_PROVIDER_ID` | l'output `workload_provider_id` del run precedente | No |

La variabile `TFC_GCP_PROVIDER_AUTH` configura il workspace per usare le credenziali dinamiche con il provider GCP. Le altre variabili identificano il project e le altre risorse che GCP userà per creare le risorse con le credenziali dinamiche.

**Azure** _(stepTitle)_

La configurazione definisce prima i provider Azure Resource Manager e Active Directory, recupera i dati della sottoscrizione e crea un'applicazione con un nome casuale, proprietaria della relazione di fiducia:

```
provider "azurerm" {
  features {}
}

provider "azuread" {}

provider "random" {}

data "azurerm_subscription" "current" {}

resource "random_pet" "application_name" {
  length = 2
}

resource "azuread_application" "tfc_application" {
  display_name = "${random_pet.application_name.id}-tfc-application"
  owners       = [data.azuread_client_config.current.object_id]
}
```

Poi definisce un service principal con il ruolo "Contributor" per la sottoscrizione corrente, e due credenziali di identità federata: una per pianificare le modifiche alla configurazione, l'altra per applicarle. Le configura entrambe perché accettino le richieste di HCP Terraform con l'audience di default. Azure verifica automaticamente, con il certificato TLS di HCP Terraform, che le richieste di credenziali provengano da HCP Terraform. L'attributo `subject` definisce l'organizzazione, il project e il workspace di HCP Terraform che possono usare la relazione di fiducia:

```
resource "azuread_service_principal" "tfc_service_principal" {
  client_id                    = azuread_application.tfc_application.client_id
  app_role_assignment_required = false
  owners                       = [data.azuread_client_config.current.object_id]
}

resource "azurerm_role_assignment" "tfc_role_assignment" {
  scope                = data.azurerm_subscription.current.id
  principal_id         = azuread_service_principal.tfc_service_principal.object_id
  role_definition_name = "Contributor"
}

resource "azuread_application_federated_identity_credential" "tfc_federated_credential_plan" {
  application_id        = azuread_application.tfc_application.id
  display_name          = "my-tfc-federated-credential-plan"
  audiences             = [var.tfc_azure_audience]
  issuer                = "https://${var.tfc_hostname}"
  subject               = "organization:${var.tfc_organization_name}:project:${var.tfc_project_name}:workspace:${var.tfc_workspace_name}:run_phase:plan"
}

resource "azuread_application_federated_identity_credential" "tfc_federated_credential_apply" {
  application_id        = azuread_application.tfc_application.id
  display_name          = "my-tfc-federated-credential-apply"
  audiences             = [var.tfc_azure_audience]
  issuer                = "https://${var.tfc_hostname}"
  subject               = "organization:${var.tfc_organization_name}:project:${var.tfc_project_name}:workspace:${var.tfc_workspace_name}:run_phase:apply"
}
```

Infine, con la risorsa `azurerm_role_assignment` del blocco precedente, la configurazione assegna il service principal al ruolo Contributor per la sottoscrizione corrente. Questa assegnazione consente l'accesso di livello contributor alla sottoscrizione. I ruoli Azure, predefiniti o personalizzati, danno un controllo preciso sui permessi concessi dalle credenziali dinamiche.

La configurazione dell'infrastruttura definisce una rete e una subnet nella location `eastus`:

```
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

resource "azurerm_resource_group" "example" {
  name     = "exampleTFResourceGroup"
  location = var.azure_location
}

resource "azurerm_virtual_network" "example" {
  name                = "example-network"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
}

resource "azurerm_subnet" "example" {
  name                 = "internal"
  resource_group_name  = azurerm_resource_group.example.name
  virtual_network_name = azurerm_virtual_network.example.name
  address_prefixes     = ["10.0.2.0/24"]
}
```

Nel workspace si aggiungono queste variabili:

| **Categoria** | **Chiave** | **Valore** | **Sensitive** |
|---|---|---|---|
| Environment variable | `TFC_AZURE_PROVIDER_AUTH` | `true` | No |
| Environment variable | `TFC_AZURE_RUN_CLIENT_ID` | l'output `run_client_id` del run precedente | No |
| Environment variable | `ARM_SUBSCRIPTION_ID` | l'output `subscription_id` del run precedente | No |
| Environment variable | `ARM_TENANT_ID` | l'output `tenant_id` del run precedente | No |

La variabile `TFC_AZURE_PROVIDER_AUTH` configura il workspace per usare le credenziali dinamiche con il provider Azure. Le altre variabili identificano il tenant, la sottoscrizione e il client del run che Azure userà per creare le risorse con le credenziali dinamiche.

**EKS** _(stepTitle)_

La configurazione legge i dati del cluster EKS e configura il provider Kubernetes:

```
data "aws_eks_cluster" "upstream" {
  name = var.cluster_name
}

data "aws_eks_cluster_auth" "upstream_auth" {
  name = var.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.upstream.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.upstream.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.upstream_auth.token
}
```

Poi configura in Kubernetes un provider OIDC con HCP Terraform. Kubernetes verifica automaticamente che le richieste di credenziali provengano da HCP Terraform. Il campo `groups_claim` gli fa verificare il nome dell'organizzazione HCP Terraform che cerca di autenticarsi al cluster:

```
resource "aws_eks_identity_provider_config" "oidc_config" {
  cluster_name = var.cluster_name

  oidc {
    identity_provider_config_name = "terraform-cloud"
    client_id                     = var.tfc_kubernetes_audience
    issuer_url                    = var.tfc_hostname
    username_claim                = "sub"
    groups_claim                  = "terraform_organization_name"
  }
}
```

L'RBAC di Kubernetes può assegnare permessi tramite ruoli collegati a soggetti "User" o "Group". La configurazione di esempio usa l'autorizzazione basata sui gruppi. Il campo `groups_claim` ha il valore `terraform_organization_name`, quindi Kubernetes crea un gruppo RBAC con il nome dell'organizzazione HCP Terraform. Infine la configurazione assegna al ruolo `cluster-admin` il gruppo creato automaticamente con il nome dell'organizzazione:

```
resource "kubernetes_cluster_role_binding_v1" "oidc_role" {
  metadata {
    name = "odic-identity"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = "cluster-admin"
  }

  subject {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Group"
    name      = var.tfc_organization_name
  }
}
```

In `terraform.tfvars` si indicano anche i dati del cluster EKS esistente, sostituendo `<YOUR_CLUSTER_NAME>` e `<YOUR_CLUSTER_REGION>`:

```
cluster_name          = "<YOUR_CLUSTER_NAME>"
cluster_region        = "<YOUR_CLUSTER_REGION>"
tfc_organization_name = "<YOUR_ORG>"
tfc_workspace_name    = "learn-terraform-dynamic-credentials"
```

La configurazione dell'infrastruttura crea una config map nel cluster. Il token di autenticazione viene preso dalla variabile d'ambiente `KUBE_TOKEN`, che HCP Terraform imposta automaticamente:

```
provider "kubernetes" {
  host                   = var.cluster-endpoint-url
  cluster_ca_certificate = base64decode(var.cluster-endpoint-ca)

  // Auth token value will be obtained from the KUBE_TOKEN environment variable,
  // which will automatically be set by HCP Terraform
}

resource "kubernetes_config_map" "test" {
  metadata {
    name = "test"
  }

  data = {
    "foo" = "bar"
  }
}
```

Nel workspace si aggiungono queste variabili:

| **Categoria** | **Chiave** | **Valore** | **Sensitive** |
|---|---|---|---|
| Environment variable | `TFC_KUBERNETES_PROVIDER_AUTH` | `true` | No |
| Environment variable | `TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE` | `kubernetes` | No |
| Terraform variable | `cluster-endpoint-url` | l'output `cluster-endpoint-url` del run precedente | No |
| Terraform variable | `cluster-endpoint-ca` | l'output `cluster-endpoint-ca` del run precedente | Sì |

**GKE** _(stepTitle)_

La configurazione recupera prima la configurazione e le credenziali client del cluster GKE:

```
data "google_container_cluster" "upstream" {
  name     = var.cluster_name
  location = var.cluster_location
  project  = var.project
}

data "google_client_config" "provider" {
}

provider "kubernetes" {
  host  = "https://${data.google_container_cluster.upstream.endpoint}"
  token = data.google_client_config.provider.access_token
  cluster_ca_certificate = base64decode(
    data.google_container_cluster.upstream.master_auth[0].cluster_ca_certificate,
  )
}
```

Quando si attivano gli identity service in un cluster GKE, il cluster contiene una risorsa personalizzata di tipo `ClientConfig.authentication.gke.io`, che descrive la configurazione di un provider OIDC esterno come HCP Terraform. L'oggetto `ClientConfig` di default esiste già, quindi va importato in Terraform prima di poterlo modificare. La configurazione definisce una risorsa `kubernetes_manifest` con la configurazione voluta per l'oggetto `ClientConfig`. Con l'import guidato dalla configurazione si importano e si applicano le modifiche con un solo apply:

```
import {
  // The name of this resource is hardcoded by GKE as described in:
  // https://cloud.google.com/kubernetes-engine/docs/how-to/oidc#configuring_on_a_cluster
  //
  id = "apiVersion=authentication.gke.io/v2alpha1,kind=ClientConfig,namespace=kube-public,name=default"
  to = kubernetes_manifest.oidc_conf
}

resource "kubernetes_manifest" "oidc_conf" {
  manifest = {
    apiVersion = "authentication.gke.io/v2alpha1"
    kind       = "ClientConfig"
    metadata = {
      name      = "default"
      namespace = "kube-public"
    }
    spec = {
      authentication = [
        {
          name = data.google_container_cluster.upstream.name
          oidc = {
            clientID    = var.tfc_kubernetes_audience
            issuerURI   = var.tfc_hostname
            userClaim   = "sub"
            groupsClaim = "terraform_organization_name"
          }
        }
      ]
    }
  }
}
```

Kubernetes verifica automaticamente che le richieste di credenziali provengano da HCP Terraform. Il campo `groupsClaim` gli fa verificare il nome dell'organizzazione HCP Terraform che cerca di autenticarsi al cluster. Come per EKS, l'autorizzazione è basata sui gruppi, e la configurazione assegna al ruolo `cluster-admin` il gruppo con il nome dell'organizzazione, con la stessa risorsa `kubernetes_cluster_role_binding_v1`.

In `terraform.tfvars` si indicano anche i dati del cluster GKE esistente:

```
cluster_name          = "<YOUR_CLUSTER_NAME>"
cluster_region        = "<YOUR_CLUSTER_REGION>"
project               = "<YOUR_PROJECT_ID>"
tfc_organization_name = "<YOUR_ORG>"
tfc_workspace_name    = "learn-terraform-dynamic-credentials"
```

> **Nota**: il testo della pagina chiede di sostituire `<YOUR_CLUSTER_NAME>`, `<YOUR_CLUSTER_ZONE>` e `<YOUR_PROJECT_ID>`, ma il file usa `<YOUR_CLUSTER_REGION>`, e la configurazione legge la posizione del cluster da `var.cluster_location`.
_(infoBox)_

La configurazione dell'infrastruttura è la stessa di EKS, senza il commento sul token:

```
provider "kubernetes" {
  host                   = var.cluster-endpoint-url
  cluster_ca_certificate = base64decode(var.cluster-endpoint-ca)
}

resource "kubernetes_config_map" "test" {
  metadata {
    name = "test"
  }

  data = {
    "foo" = "bar"
  }
}
```

Le variabili del workspace sono le stesse di EKS: `TFC_KUBERNETES_PROVIDER_AUTH` a `true`, `TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE` a `kubernetes`, e le variabili Terraform `cluster-endpoint-url` e `cluster-endpoint-ca` (sensitive), con gli output del run precedente.

- Fonte: [Authenticate providers with dynamic credentials](https://developer.hashicorp.com/terraform/tutorials/cloud/dynamic-credentials)

---

## 8.22 — Le credenziali dinamiche dei provider

Usare credenziali statiche nei workspace o negli Stack per autenticare i provider è un rischio per la sicurezza, anche se le si ruota regolarmente. Le credenziali dinamiche dei provider migliorano la sicurezza, perché generano nuove credenziali temporanee per ogni run.

Le credenziali dinamiche si configurano per ogni workspace o Stack di HCP Terraform. Questo workflow elimina la necessità di gestire e ruotare a mano le credenziali in tutta l'organizzazione. Permette anche di usare gli strumenti di autenticazione e autorizzazione della piattaforma cloud per limitare i permessi in base ai metadati, come la fase del run, il workspace o l'organizzazione.

### 8.22.1 — Come funzionano le credenziali dinamiche

Si configura una relazione di fiducia tra la piattaforma cloud e HCP Terraform, e si possono definire regole che permettono ai workspace e ai run di HCP Terraform di accedere a risorse specifiche. Poi, a ogni plan e apply di Terraform, avviene questo processo:

1. HCP Terraform genera un workload identity token. Il token rispetta gli standard del protocollo OpenID Connect (OIDC), e include informazioni sull'organizzazione, sul workspace o sullo Stack e sulla fase del run;
2. quando inizia un plan o un apply, HCP Terraform invia il workload identity token alla piattaforma cloud, insieme alle altre informazioni necessarie all'autenticazione;
3. la piattaforma cloud usa la chiave pubblica di firma di HCP Terraform per verificare il token;
4. se la verifica riesce, la piattaforma cloud restituisce un insieme di nuove credenziali temporanee per HCP Terraform;
5. HCP Terraform imposta queste credenziali nell'ambiente del run, perché le usi il provider Terraform;
6. il plan o l'apply di Terraform procede;
7. al termine del plan o dell'apply, l'ambiente del run viene smantellato e le credenziali temporanee vengono scartate.

Gli agent HCP Terraform self-hosted devono usare la v1.7.0 o successiva. Per le funzionalità più recenti delle credenziali dinamiche conviene aggiornarli all'ultima versione.

### 8.22.2 — Configurare le credenziali dinamiche per i workspace

Per ogni piattaforma cloud, l'uso delle credenziali dinamiche in un workspace richiede questi passi:

1. **impostare una relazione di fiducia**: si configura una relazione tra HCP Terraform e l'altra piattaforma cloud, con dettagli diversi a seconda della piattaforma;
2. **configurare l'accesso alla piattaforma cloud**: si configurano ruoli e policy della piattaforma cloud, che definiscono l'accesso del workspace alle risorse dell'infrastruttura;
3. **configurare HCP Terraform**: si aggiungono al workspace specifiche variabili d'ambiente, che dicono a HCP Terraform come autenticarsi presso l'altra piattaforma cloud durante plan e apply. Ogni piattaforma cloud ha il proprio insieme di variabili d'ambiente.

La documentazione ha istruzioni per Vault, Amazon Web Services (anche con una configurazione rapida), Google Cloud Platform, Azure, Kubernetes e Tencent Cloud. Si può usare anche Vault per generare credenziali per AWS, GCP o Azure, con le credenziali dinamiche basate su Vault (Vault-backed dynamic credentials), che sfruttano i secrets engine di Vault per generare credenziali temporanee. Quando si configurano le credenziali dinamiche per i workspace, HCP Terraform riepiloga gli insiemi di credenziali dinamiche di ogni workspace nella sua pagina **Variables**.

### 8.22.3 — Credenziali dinamiche per le query e per gli Stack

Per usare le credenziali dinamiche nelle query si completano gli stessi passi della configurazione per i workspace. I run di query usano la configurazione delle credenziali dinamiche dei plan di Terraform. Quando lo stesso ruolo è configurato sia per i plan sia per gli apply, le query usano quel ruolo condiviso. Quando i ruoli sono separati, usano il ruolo del plan. Ad esempio, le variabili d'ambiente per le query sono:

- `TFC_AWS_PLAN_ROLE_ARN` per Amazon Web Services;
- `TFC_AZURE_PLAN_CLIENT_ID` per Azure;
- `TFC_GCP_PLAN_SERVICE_ACCOUNT_EMAIL` per Google Cloud Platform;
- `TFC_HCP_PLAN_PROVIDER_RESOURCE_NAME` per HCP;
- `TFC_KUBERNETES_WORKLOAD_IDENTITY_AUDIENCE` per Kubernetes;
- `TFC_TENCENTCLOUD_RUN_ROLE_ARN` per Tencent Cloud;
- `TFC_VAULT_PLAN_ROLE` per Vault.

Per gli Stack, l'autenticazione dei deployment con le credenziali dinamiche è descritta nella pagina *Authenticate a Stack*.

- Fonte: [Dynamic provider credentials](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/dynamic-provider-credentials)

---

## 8.23 — Rilevare il drift dell'infrastruttura con gli health assessment

Gli health assessment di HCP Terraform monitorano l'infrastruttura gestita, per verificare che continui a soddisfare la configurazione voluta per tutto il suo ciclo di vita. Con il tempo le risorse possono cambiare al di fuori del workflow Terraform, per guasti o degrado dei servizi, certificati scaduti o modifiche manuali di altri utenti. Terraform non può impedire queste modifiche, ma gli health assessment aiutano a rilevarle in fretta e a risolverle. Comprendono due tipi di controlli:

- la **drift detection** verifica che le impostazioni reali dell'infrastruttura corrispondano a quelle registrate nel file di state del workspace;
- la **validazione continua** verifica che le risorse soddisfino ancora i check definiti nella configurazione.

Nel tutorial si attivano gli health assessment per un workspace, si usa un assessment on-demand per rilevare il drift della configurazione e si esaminano le opzioni per risolverlo.

> **Suggerimento**: gli health assessment sono disponibili in HCP Terraform Standard Edition.
_(infoBox)_

### 8.23.1 — Creare l'infrastruttura e introdurre un drift

Si imposta il nome dell'organizzazione HCP Terraform nella variabile d'ambiente `TF_CLOUD_ORGANIZATION`, si inizializza la configurazione e la si applica. L'inizializzazione crea il workspace `learn-terraform-drift-detection`.

La best practice è usare Terraform per tutte le modifiche all'infrastruttura, per avere workflow coerenti e visibilità sulle modifiche. Un'organizzazione però può aver bisogno, di tanto in tanto, di modifiche manuali. Per simularlo, nella console AWS si apre il security group `bastion_ssh`. Nelle regole in ingresso (**Inbound rules**) si sostituisce il CIDR sorgente `192.80.0.0/16` con `0.0.0.0/0`. Ora la configurazione reale del security group non corrisponde più alle impostazioni registrate nel file di state del workspace.

### 8.23.2 — Attivare gli health assessment

Gli health assessment di HCP Terraform aiutano a rilevare modifiche manuali come questa, e a mantenere visibilità sulle impostazioni reali dell'infrastruttura. Per eseguirli, un workspace deve soddisfare questi requisiti:

- Terraform 0.15.4 o successivo per la drift detection, o 1.3.0 o successivo per la drift detection e la validazione continua;
- almeno un run eseguito nel workspace, con l'ultimo run completato con successo;
- la modalità di esecuzione remote o agent.

Gli assessment usano plan refresh-only, non applicabili, che confrontano le impostazioni reali dell'infrastruttura con le risorse registrate nel file di state del workspace. Gli assessment non aggiornano né lo state né la configurazione dell'infrastruttura.

Gli assessment si attivano su un workspace specifico o su tutti i workspace dell'organizzazione. Nel workspace del tutorial, nella sezione **Health**, si sceglie **Settings**, poi **Enable** e **Save settings**. Una volta attivati, HCP Terraform esegue gli assessment circa una volta ogni 24 ore. Questi run non interferiscono con le altre operazioni di Terraform nel workspace, e ogni nuovo run riprogramma l'assessment successivo 24 ore dopo. Se un run fallisce, HCP Terraform sospende gli assessment finché il problema non è risolto e il workspace esegue un run riuscito.

### 8.23.3 — Un assessment on-demand

Gli assessment on-demand evitano di attendere quelli programmati e rilevano prima il drift. Nella sezione **Health** del workspace si fa clic su **Start health assessment**. HCP Terraform esegue l'assessment e ne mostra i risultati. Come previsto, rileva la modifica fatta alle regole in ingresso del security group del bastion.

L'assessment rileva anche modifiche ai valori di default di alcuni campi delle risorse. La configurazione di esempio non imposta valori per quei campi, ma AWS imposta valori di default quando crea le risorse. È un caso comune, che dipende da come il provider Terraform assegna i valori non impostati. HCP Terraform mostra i risultati dell'assessment nella pagina di panoramica del workspace.

![Figura 27](img/hcp-drift-detection-overview.png) _(dimensioni: 2048×1208 px)_

*Figura 27 — I risultati dell'health assessment nella panoramica del workspace, con il numero di risorse con drift. Fonte: HashiCorp Developer.* _(caption)_

> **Nota**: la drift detection segnala solo le modifiche agli attributi delle risorse definiti nella configurazione. Per evitare drift accidentali, conviene impostare esplicitamente nella configurazione tutti gli attributi critici per le operazioni, anche quando ci si basa sul valore di default del provider.
_(infoBox)_

Nella pagina dei workspace dell'organizzazione si possono anche filtrare i workspace per risultato dell'assessment. Si possono configurare notifiche specifiche del workspace che avvisano in caso di determinati risultati.

### 8.23.4 — Riconciliare il drift

Nelle configurazioni più complesse, il drift può rendere imprevedibili le operazioni. Se un team distribuisce una nuova modifica e scopre il drift solo durante il run di Terraform, può dover interrompere il proprio workflow per decidere come procedere. Se un insieme di modifiche tocca molte risorse, l'operatore deve rivedere con attenzione il piano di esecuzione per capire il drift. Gli health assessment aiutano a rilevare in modo proattivo il drift e i fallimenti delle condizioni, per risolverli prima che interferiscano con le operazioni future. Quando si individua un drift ci sono due opzioni:

- per mantenere la modifica, si aggiorna la configurazione con la nuova impostazione, e si esegue un apply di Terraform per aggiornare il file di state;
- per riportare la modifica all'impostazione originale della configurazione, si esegue un apply di Terraform che la sovrascrive.

Qui conviene annullare la modifica manuale del security group, per impedire il traffico pubblico in ingresso verso il bastion host. Un nuovo `terraform apply` riporta il security group alla configurazione iniziale, e riprogramma l'assessment successivo 24 ore dopo. Un nuovo assessment on-demand conferma che il drift è risolto: HCP Terraform non rileva più drift. Le impostazioni del security group sono tornate a quelle della configurazione, e Terraform ha aggiornato il file di state con i valori di default e i valori null specifici del provider.

- Fonte: [Use health assessments to detect infrastructure drift](https://developer.hashicorp.com/terraform/tutorials/cloud/drift-detection)

---

## 8.24 — La salute dei workspace

HCP Terraform può eseguire health assessment automatici in un workspace, per valutare se l'infrastruttura reale soddisfa i requisiti definiti nella configurazione Terraform. Gli health assessment comprendono la drift detection e la validazione continua (sezione 8.11.6). Quando sono attivi, HCP Terraform li esegue periodicamente per il workspace. Sono disponibili nelle edizioni Standard e Premium.

### 8.24.1 — Permessi e requisiti

Gli health assessment richiedono questi permessi:

- per vedere lo stato di salute di un workspace serve l'accesso in lettura al workspace;
- per cambiare le impostazioni di salute dell'organizzazione bisogna essere proprietari dell'organizzazione;
- per cambiare le impostazioni di salute di un workspace, o per avviare assessment on-demand, bisogna essere amministratori del workspace.

I requisiti del workspace sono quelli visti nella sezione 8.23.2: Terraform 0.15.4 o 1.3.0 e successivi, e la modalità di esecuzione remote o agent. L'ultimo run del workspace deve essere riuscito. Se l'ultimo run è terminato in stato errored, canceled o discarded, HCP Terraform sospende gli health assessment finché non c'è un run applicato con successo. Il workspace deve anche avere almeno un run in cui Terraform ha applicato con successo una configurazione. HCP Terraform non esegue health assessment nei workspace senza infrastruttura reale.

### 8.24.2 — Attivare gli health assessment

Gli health assessment si possono imporre a tutti i workspace idonei di un'organizzazione, dalle impostazioni dell'organizzazione. Imporli a livello di organizzazione sostituisce le impostazioni dei workspace, e li si può attivare in un singolo workspace solo se HCP Terraform non li impone a livello di organizzazione. In un workspace si attivano da **Settings > Health**, selezionando **Enable** sotto **Health Assessments** e salvando le impostazioni.

### 8.24.3 — La programmazione degli assessment

Quando si attivano gli health assessment per un workspace, HCP Terraform programma il primo assessment in base ai run attivi:

- senza run attivi, nel periodo di assessment successivo all'attivazione;
- con uno speculative plan attivo, nel periodo di assessment successivo al termine di quel plan;
- con altri run attivi, nel periodo di assessment successivo.

Il momento previsto per il prossimo assessment si vede nella pagina **Drift** del workspace. Se il workspace è valutabile, il prossimo assessment è sempre programmato a un intervallo fisso dall'evento più recente tra l'ultimo apply e l'ultimo assessment. Ad esempio, con una cadenza di 24 ore, un workspace che ha applicato un run 4 ore fa e non è ancora stato valutato riceve il prossimo assessment tra 20 ore. Gli assessment possono richiedere più tempo se li si attiva in molti workspace insieme, o se il workspace ha una configurazione complessa con molte risorse.

Un health assessment non interrompe mai i run e non interferisce con essi. Se si avvia un nuovo run durante un health assessment, HCP Terraform annulla l'assessment corrente ed esegue il successivo nel periodo di assessment seguente. Questo comportamento può impedire a HCP Terraform di eseguire health assessment nei workspace con run frequenti. HCP Terraform sospende gli health assessment se l'ultimo run è terminato con errore. Vale per tutti i tipi di run, compresi i run plan-only e gli speculative plan. Dopo un run riuscito, HCP Terraform riprende gli assessment nel periodo successivo. Gli amministratori di Terraform Enterprise possono modificare la frequenza degli assessment e il numero massimo di assessment simultanei dalla console di amministrazione.

**Assessment on-demand, concorrenza e notifiche** _(stepTitle)_

Gli assessment on-demand sono disponibili solo nell'interfaccia di HCP Terraform. Un amministratore di un workspace che soddisfa i requisiti li avvia con **Start health assessment** nella pagina **Health**. Non si può avviare un altro assessment mentre uno è in corso. Un assessment on-demand riazzera la programmazione degli assessment automatici, quindi HCP Terraform attende il periodo programmato successivo.

Con gli health assessment attivi su più workspace, gli assessment possono essere eseguiti in parallelo, e non incidono sul limite di concorrenza. HCP Terraform controlla la concorrenza degli assessment per evitare problemi nelle installazioni con migliaia di workspace, e li esegue a lotti. HCP Terraform invia notifiche sui risultati degli health assessment secondo le impostazioni del workspace.

### 8.24.4 — Lo stato di salute del workspace

Nella pagina **Workspaces** dell'organizzazione, HCP Terraform mostra uno stato **Health warning** per i workspace con drift dell'infrastruttura o check di validazione continua falliti. A destra della pagina di panoramica del workspace c'è una barra **Health**, con il riepilogo dell'ultimo health assessment:

- il riepilogo **Drift** mostra il numero totale di risorse della configurazione e quante hanno subito drift;
- il riepilogo **Checks** mostra il numero di stati passed, failed e unknown degli oggetti con check di validazione continua.

La pagina **Explorer** presenta una panoramica sintetica dello stato di salute dei workspace dell'organizzazione. Mostra i workspace che monitorano la salute, lo stato dei check di validazione continua configurati e il numero di risorse con drift di ogni workspace (sezione 8.30).

![Figura 28](img/hcp-explorer-health.png) _(dimensioni: 2692×1070 px)_

*Figura 28 — La salute dei workspace nell'Explorer: workspace monitorati, stato dei check e risorse con drift. Fonte: HashiCorp Developer.* _(caption)_

### 8.24.5 — La drift detection

La drift detection aiuta a individuare le situazioni in cui l'infrastruttura reale non corrisponde più alla configurazione definita in Terraform. Questa deviazione si chiama **drift della configurazione** (configuration drift). Si verifica quando si fanno modifiche al di fuori del normale processo di Terraform, con incoerenze tra gli oggetti remoti e l'infrastruttura configurata. Ad esempio, un collega potrebbe creare un drift aggiornando direttamente dalla console del cloud provider le impostazioni di un bucket di storage, in contrasto con la configurazione. La drift detection rileva queste differenze e propone i passi per correggerle.

Il drift della configurazione è diverso dal **drift dello state**, e la drift detection non rileva il drift dello state. Il drift della configurazione avviene quando modifiche esterne agli oggetti remoti invalidano la configurazione dell'infrastruttura. Il drift dello state avviene quando modifiche esterne agli oggetti remoti non invalidano la configurazione. Il drift dello state si corregge con la refresh-only mode (sezione 6.10.6).

I risultati della drift detection dell'ultimo health assessment si vedono in **Health > Drift**. Se c'è un drift della configurazione, HCP Terraform propone le modifiche necessarie per riallineare l'infrastruttura alla configurazione. Il drift si corregge in due modi:

- **sovrascrivere il drift**: se non si vogliono le modifiche del drift, si accoda un nuovo plan e si applicano le modifiche, per riportare l'infrastruttura reale alla configurazione Terraform;
- **aggiornare la configurazione Terraform**: se si vogliono le modifiche del drift, le si include nella configurazione Terraform e si carica una nuova configuration version. Così Terraform non annulla il drift al prossimo apply (sezione 6.4).

### 8.24.6 — La validazione continua

La validazione continua verifica regolarmente se le asserzioni personalizzate della configurazione continuano a passare, e così valida l'infrastruttura. Ad esempio, si può monitorare se un sito web restituisce il codice di stato atteso, o se il certificato di un API gateway è valido. Individuare le asserzioni fallite aiuta a risolvere il problema ed evitare errori alla successiva operazione di Terraform. La validazione continua valuta precondition, postcondition e blocchi `check` durante un assessment. Per il monitoraggio dopo l'apply è consigliato usare i blocchi `check`, per creare regole personalizzate che validano risorse, data source e output dell'infrastruttura.

**Evitare i falsi positivi** _(stepTitle)_

Gli health assessment creano uno speculative plan per accedere allo stato attuale dell'infrastruttura, e Terraform valuta i blocchi `check` della configurazione come ultimo passo della creazione dello speculative plan. Se la configurazione usa data source, i valori interrogati possono cambiare tra l'ultimo run e l'assessment, e lo speculative plan include quelle modifiche. HCP Terraform non modifica l'infrastruttura durante un assessment, ma può usare quei valori aggiornati per valutare i check. Questo può produrre falsi positivi negli avvisi, perché l'infrastruttura non è ancora cambiata. Perché i check valutino lo stato attuale della configurazione e non una possibile modifica futura, si usano data source annidati che interrogano la configurazione reale delle risorse, invece di un valore "più recente" calcolato.

**Esempi d'uso** _(stepTitle)_

Il primo esempio usa il provider HTTP di Terraform e un data source con scope limitato dentro un blocco `check`, per verificare che il sito di Terraform restituisca il codice di stato 200, cioè che sia in salute:

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

La validazione continua avvisa se il sito restituisce un codice diverso da 200 quando Terraform valuta l'asserzione. I fallimenti compaiono anche nella pagina **Continuous Validation Results** del workspace, e gli avvisi si configurano nelle impostazioni di notifica del workspace.

Il secondo esempio usa un blocco `check` per monitorare la scadenza di un certificato di Vault. Vault protegge, conserva e controlla rigorosamente l'accesso a token, password, certificati, chiavi di cifratura e altri dati sensibili.

```
resource "vault_pki_secret_backend_cert" "app" {
  backend = vault_mount.intermediate.path
  name = vault_pki_secret_backend_role.test.name
  common_name = "app.my.domain"
}

check "certificate_valid" {
  assert {
    condition = !vault_pki_secret_backend_cert.app.renew_pending
    error_message = "Vault cert is ready to renew."
  }
}
```

Il terzo esempio usa HCP Packer, che conserva i metadati delle immagini Packer: il check fallisce quando è disponibile una versione più recente dell'AMI. Il check confronta l'AMI dell'istanza `aws_instance.hashiapp` con l'`external_identifier` dell'artefatto `hashiapp_image` del canale `latest`. Per evitare falsi positivi, il check usa un data source annidato `aws_instance` che legge l'istanza reale:

```
data "hcp_packer_artifact" "hashiapp_image" {
  bucket_name  = "hashiapp"
  channel_name = "latest"
  platform     = "aws"
  region       = "us-west-2"
}

resource "aws_instance" "hashiapp" {
  ami                         = data.hcp_packer_artifact.hashiapp_image.external_identifier
  instance_type               = var.instance_type
  associate_public_ip_address = true
  subnet_id                   = aws_subnet.hashiapp.id
  vpc_security_group_ids      = [aws_security_group.hashiapp.id]
  key_name                    = aws_key_pair.generated_key.key_name

  tags = {
    Name = "hashiapp"
  }
}

check "ami_version_check" {
  data "aws_instance" "hashiapp_current" {
    instance_tags = {
      Name = "hashiapp"
    }
  }

  assert {
    condition = aws_instance.hashiapp.ami == data.hcp_packer_artifact.hashiapp_image.external_identifier
    error_message = "Must use the latest available AMI, ${data.hcp_packer_artifact.hashiapp_image.external_identifier}."
  }
}
```

**Visualizzare i risultati** _(stepTitle)_

I risultati della validazione continua dell'ultimo health assessment si vedono in **Health > Continuous validation**. La pagina mostra tutte le risorse, gli output e i data source con asserzioni personalizzate valutate da HCP Terraform. Accanto a ogni oggetto riporta se l'asserzione è passata o fallita, e per le asserzioni fallite mostra i messaggi d'errore. Ogni asserzione compare con il suo named value. Il named value di un blocco `check` combina il prefisso `check` con il nome di configurazione.

Se una risorsa, un output o un data source contiene più precondition e postcondition, HCP Terraform non mostra i risultati delle singole condizioni, a meno che non falliscano. Se tutte le custom condition dell'oggetto passano, riporta che l'intero check è passato. I risultati di precondition e postcondition compaiono accanto a quelli delle asserzioni dei blocchi `check`, identificati dai named value del blocco padre.

- Fonte: [Health](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/health)

---

## 8.25 — Rilevare il drift dell'infrastruttura e applicare le policy

Man mano che un'organizzazione cresce e i suoi workflow di provisioning maturano, diventa più difficile garantire coerenza e best practice solo con la formazione e con strumenti costruiti a mano. Terraform può verificare automaticamente che l'infrastruttura rispetti le best practice del settore e gli standard dell'organizzazione, con condizioni specifiche di risorse e moduli.

Precondition e postcondition aiutano a definire i requisiti delle risorse nella configurazione Terraform. Includendo custom condition nelle definizioni dei moduli, si garantisce che chi li usa a valle rispetti gli standard di configurazione e li usi correttamente. Inoltre, con HCP Terraform si può verificare l'infrastruttura con run task specifiche del workspace, e imporre policy sul workspace o su tutta l'organizzazione con HashiCorp Sentinel o Open Policy Agent (OPA).

> **Nota**: HCP Terraform Free Edition include un policy set con al massimo cinque policy. In HCP Terraform Standard Edition si può collegare un policy set a un repository di controllo versione, o creare versioni del policy set con l'API.
_(infoBox)_

Nel tutorial si usano sia le precondition di Terraform sia le policy, per validare la configurazione e imporre il rispetto delle pratiche dell'organizzazione. Prima si usano le precondition per imporre convenzioni di sicurezza della rete. Poi si configurano e si impongono le policy in HCP Terraform, impedendo i deployment in certi giorni della settimana. Infine si usa la drift detection di HCP Terraform per rilevare quando le impostazioni dell'infrastruttura si sono discostate dalla configurazione scritta.

### 8.25.1 — La configurazione dell'infrastruttura

Il repository contiene un modulo Terraform locale, che definisce una rete e un bastion host, e una configurazione root che usa il modulo. Contiene anche le definizioni delle policy Sentinel e OPA, nelle directory `sentinel` e `opa`, con i relativi test. Il file `modules/network/main.tf` usa il modulo pubblico `vpc` per creare le risorse di rete, con subnet pubbliche e private e un NAT gateway, e poi avvia un bastion host in una delle subnet pubbliche:

```
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.13.0"

  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
}

resource "aws_security_group" "bastion" {
  name   = "bastion_ssh"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["192.80.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

Il bastion host è pensato come unico punto di ingresso per il traffico SSH verso le istanze delle subnet private della VPC. Il security group limita il traffico SSH in ingresso verso il bastion al solo blocco CIDR `192.80.0.0/16`, un CIDR di esempio che rappresenta la rete dell'organizzazione. Qui il modulo è usato in locale, ma in un'organizzazione più grande lo si pubblicherebbe probabilmente nel registry Terraform. Includendo un bastion nel modello standard della configurazione di rete, si stabilisce uno standard per l'accesso SSH alle istanze delle reti.

### 8.25.2 — Definire una precondition

Il modulo di rete definisce una input variable `bastion_instance_type`, con cui gli utenti tengono conto dell'uso e dei carichi previsti. Sovradimensionare il bastion comporterebbe costi inutili per l'organizzazione. Si vuole quindi permettere agli utenti di indicare un tipo di istanza, ma non di crearne una troppo grande. Si aggiunge una precondition che verifica che il tipo di istanza non abbia più di 2 core, per contenere i costi operativi. Prima si aggiunge al modulo un data source, che legge dal provider AWS i dettagli del tipo di istanza, compreso il numero di core. Poi si aggiunge la precondition alla risorsa `aws_instance.bastion`:

```
data "aws_ec2_instance_type" "bastion" {
  instance_type = var.bastion_instance_type
}

resource "aws_instance" "bastion" {
  instance_type = var.bastion_instance_type
  ami           = data.aws_ami.amazon_linux.id

  subnet_id              = module.vpc.public_subnets[0]
  vpc_security_group_ids = [aws_security_group.bastion.id]

  lifecycle {
    precondition {
      condition     = data.aws_ec2_instance_type.bastion.default_cores <= 2
      error_message = "Change the value of bastion_instance_type to a type that has 2 or fewer cores to avoid over provisioning."
    }
  }
}
```

Terraform valuta le precondition, e verifica che la configurazione soddisfi la condizione, prima di creare il piano. Qui controlla che il valore `default_cores` del data source `aws_ec2_instance_type.bastion` sia al massimo 2, prima di pianificare la creazione dell'istanza bastion e delle altre risorse.

### 8.25.3 — Distribuire l'infrastruttura

La configurazione root usa il modulo di rete per creare un bastion host e i componenti di rete: una VPC, le subnet, un NAT gateway e le route table. Imposta i valori delle input variable nel file `terraform.auto.tfvars`. Il valore iniziale del tipo di istanza del bastion è `t2.2xlarge`, che ha 8 core e non supera la precondition, come previsto.

```
bastion_instance_type = "t2.2xlarge"
aws_region            = "us-east-2"
```

Si imposta il nome dell'organizzazione nella variabile d'ambiente `TF_CLOUD_ORGANIZATION` e si inizializza la configurazione, che crea il workspace `learn-terraform-drift-and-policy`. Il primo `terraform plan` fallisce, perché il tipo `t2.2xlarge` ha 8 core e non supera la precondition del modulo di rete. Si cambia quindi `bastion_instance_type` in `t2.small`, e con `terraform apply` la precondition passa e Terraform crea le risorse.

Verificare l'allocazione delle risorse con una precondition permette di usare le informazioni più aggiornate di AWS, per stabilire se la configurazione soddisfa il requisito. Si sarebbe potuta usare anche la validazione delle variabili. Avrebbe però richiesto di studiare tutti i tipi di istanza e le loro capacità, e di elencare nella configurazione tutti i tipi accettabili, con una configurazione meno flessibile.

### 8.25.4 — Le policy

La validazione a livello di configurazione, come i vincoli sulle variabili e le precondition, diffonde gli standard dall'interno della configurazione scritta. Autori e utenti dei moduli però devono rispettarli volontariamente: gli autori devono includere le condizioni nelle definizioni dei moduli, e gli utenti devono usare quei moduli per creare l'infrastruttura. Per imporre gli standard dell'infrastruttura su interi workspace o organizzazioni si usano le policy di HCP Terraform. Le policy funzionano senza richiedere agli utenti di scrivere la configurazione in un modo particolare. HCP Terraform permette di scegliere come motore di policy Sentinel o Open Policy Agent (OPA), e il tutorial include policy per entrambi.

La configurazione del policy set definisce due policy, `friday_deploys` e `public_ingress`. Ecco la versione Sentinel (`sentinel/sentinel.hcl`) e la versione OPA (`opa/policies.hcl`):

```
policy "friday_deploys" {
  source = "./policies/deployment_days.sentinel"
  enforcement_level = "advisory"
}

policy "public_ingress" {
  source = "./policies/public_ingress.sentinel"
  enforcement_level = "soft-mandatory"
}
```

```
policy "friday_deploys" {
  query = "data.terraform.policies.deployment_days.deny"
  enforcement_level = "advisory"
  params = {
    "forbidden_days" = ["friday"]
  }
}

policy "public_ingress" {
  query = "data.terraform.policies.public_ingress.deny"
  enforcement_level = "mandatory"
}
```

Il livello di enforcement della policy `friday_deploys` è `advisory`. Quello della policy `public_ingress` è `mandatory` nella versione OPA e `soft-mandatory` in quella Sentinel. Quando HCP Terraform rileva il fallimento di una policy advisory, lo notifica, ma permette comunque di creare le risorse. Quando fallisce una policy mandatory, HCP Terraform rifiuta di applicare il piano finché la policy non passa. Nella versione OPA, il formato di `query` fa riferimento al nome del package dichiarato nel file della policy e al nome della regola definita per la policy.

Oltre a porre limiti alla configurazione dell'infrastruttura, si possono imporre standard sui workflow dell'organizzazione stessi. Una pratica comune è impedire i deployment dell'infrastruttura il venerdì, per ridurre il rischio di incidenti di produzione prima del weekend. La policy `friday_deploys` impedisce i deployment in un certo giorno della settimana.

Le policy di esempio includono test, per verificare che funzionino come previsto prima di usarle con HCP Terraform. Con Sentinel si eseguono i test delle policy:

```
$ sentinel test policies/
```

Sentinel carica i test dalle directory che hanno lo stesso nome di ciascuna policy. Con OPA, nel file `opa/policies.hcl` si sostituisce `friday` con il giorno corrente della settimana (ad esempio `tuesday`), per verificare che la policy blocchi i deployment di oggi:

```
policy "friday_deploys" {
  query = "data.terraform.policies.deployment_days.deny"
  enforcement_level = "advisory"
  params = {
    "forbidden_days" = ["tuesday"]
  }
}

policy "public_ingress" {
  query = "data.terraform.policies.public_ingress.deny"
  enforcement_level = "mandatory"
}
```

La policy `public_ingress` esamina le modifiche pianificate di un run di Terraform. Verifica se includono aggiornamenti di security group che consentono traffico pubblico in ingresso da tutti i CIDR (`0.0.0.0/0`). Questa policy aiuta a imporre la postura di sicurezza, impedendo la creazione di security group troppo permissivi. Ecco la versione Sentinel:

```
import "tfplan/v2" as tfplan

# List of forbidden ingress CIDRs
forbidden_ingress_cidrs = ["0.0.0.0/0"]

# Function to check if a CIDR is in the forbidden list
is_forbidden_cidr = func(cidr) {
    return cidr in forbidden_ingress_cidrs
}

check_security_groups = func() {
    violatingResources = filter tfplan.resource_changes as _, rc {
        rc.type is "aws_security_group" and
        rc.mode is "managed" and
        (rc.change.actions contains "create" or rc.change.actions is ["update"]) and
        rc.change.after.ingress is not null and
        any rc.change.after.ingress as _, ingress {
            ingress.cidr_blocks is not null and
            any ingress.cidr_blocks as _, cidr {
                is_forbidden_cidr(cidr)
            }
        }
    }

    return length(violatingResources) == 0
}

main = rule {
    check_security_groups()
}
```

Nella scheda OPA la pagina mostra questa versione, nel file `public_ingress.rego`:

```
import "tfplan/v2" as tfplan

forbidden_ingress_cidrs = ["0.0.0.0/0"]

ingress_rules = filter tfplan.resource_changes as _, resource {
    resource.type is "aws_vpc_security_group_ingress_rule" and
        resource.change.actions is ["create"]
}

public_ingress = filter ingress_rules as _, ingress_rule {
  ingress_rule.change.after.cidr_ipv4 is "0.0.0.0/0"
}

main = rule {
  length(public_ingress) is 0
}
```

> **Nota**: il file della scheda OPA ha estensione `.rego`, ma il contenuto è scritto in linguaggio Sentinel (`import "tfplan/v2"`, `filter`, `rule`), non in Rego. Controlla inoltre le risorse `aws_vpc_security_group_ingress_rule` invece dei blocchi `ingress` di `aws_security_group`.
_(infoBox)_

### 8.25.5 — Creare un policy set

HCP Terraform organizza le policy in **policy set**. Un policy set può contenere policy Sentinel oppure OPA, e lo si può applicare a tutta l'organizzazione o solo a workspace specifici. Policy set e policy si gestiscono in tre modi: con i repository VCS, con l'API di HCP Terraform o direttamente nell'interfaccia di HCP Terraform. Il tutorial usa il VCS, che permette di collaborare, sviluppare e versionare le policy in sicurezza, e fa del repository la fonte di verità.

Nelle impostazioni dell'organizzazione si sceglie **Policy Sets** e poi **Connect a new policy set**, con l'opzione **Version control provider (VCS)**. Nella pagina **Configure settings** si procede così:

- come integrazione delle policy si sceglie Sentinel o Open Policy Agent, secondo il motore usato;
- si chiama il policy set `learn-terraform-drift-and-policy`;
- come **Scope of Policies** si sceglie **Policies enforced on selected projects and workspaces**, selezionando il workspace del tutorial;
- in **Runtime version** si fissa la versione di runtime all'ultima release minor: con Sentinel si sceglie `~> 0.40.0 latest`, con OPA `~> 0.61.0 latest`;
- in **Overrides** si deseleziona la casella *This policy set can be overridden in the event of mandatory failures*.

Nella pagina **Connect to VCS** si sceglie l'integrazione GitHub.com e il repository del tutorial, con il **Policies path** `/sentinel` o `/opa`. Nella pagina **Parameters** si aggiunge il parametro `forbidden_days`, con una lista che contiene il giorno corrente, ad esempio `["Monday"]`. Infine si collega il policy set con **Connect policy set**.

### 8.25.6 — Provocare la violazione di una policy

Le risorse di rete create in precedenza comprendono un bastion host, con un security group che limita il traffico in ingresso alla rete interna dell'organizzazione. Si immagini un ingegnere che, risolvendo un incidente di produzione, cerchi di aggirare questa restrizione rendendo il security group più permissivo. Per simularlo, in `modules/network/main.tf` si cambia la regola in ingresso della risorsa `aws_security_group.bastion` in `cidr_blocks = ["0.0.0.0/0"]`.

Il `terraform apply` per aggiornare il security group fallisce, come previsto, perché le regole in ingresso sono troppo permissive. HCP Terraform rileva i fallimenti delle policy: il security group consente traffico pubblico in ingresso, e oggi i deployment sono bloccati. L'output della CLI e i dettagli del run in HCP Terraform elencano le policy fallite. Con le policy di HCP Terraform si è impedito a Terraform di creare risorse che violano gli standard dell'infrastruttura e dell'organizzazione.

Per tornare a un apply riuscito si correggono la policy e la configurazione. Nella pagina del policy set si modifica il parametro `forbidden_days` in `["Friday"]`, o in un altro giorno se oggi è venerdì. Poi si ripristina la regola del security group a `192.80.0.0/16` e si riapplica la configurazione, riportando il workspace in uno stato sano.

### 8.25.7 — Rilevare il drift

Custom condition, validazione degli input e policy enforcement aiutano le organizzazioni a mantenere i propri standard al momento del provisioning delle risorse. HCP Terraform può anche verificare se le risorse esistenti nello state di Terraform corrispondono ancora alla configurazione voluta. La drift detection è disponibile in HCP Terraform Standard Edition.

Gli health assessment automatici di HCP Terraform eseguono, nei workspace configurati, plan refresh-only non applicabili. Confrontano così le impostazioni reali dell'infrastruttura con le risorse registrate nel file di state, senza aggiornare né lo state né la configurazione (sezione 8.23). Gli assessment comprendono due tipi di controlli, che si attivano insieme. La drift detection stabilisce se le risorse sono cambiate al di fuori del workflow Terraform. Gli health check verificano che le custom condition della configurazione siano ancora valide, ad esempio che un certificato sia ancora valido. Gli assessment vengono eseguiti solo nei workspace in cui l'ultimo apply è riuscito: se l'ultimo apply è fallito, il workspace richiede già l'attenzione di un operatore.

Nel workspace si attivano gli health assessment da **Settings > Health**. Prima del primo assessment serve un apply riuscito, quindi si riapplica la configurazione, che non contiene modifiche. Tornando all'ipotetico incidente di produzione, si immagini che l'ingegnere cerchi di aggirare la policy modificando a mano le risorse. Nella console AWS, nella scheda **Inbound rules** del security group `bastion_ssh`, con **Edit inbound rules** si elimina il CIDR sorgente `192.168.0.0/16`, lo si sostituisce con `0.0.0.0/0` e si salva con **Save rules**, introducendo un drift.

> **Nota**: la pagina originale indica di eliminare il CIDR `192.168.0.0/16`, ma la configurazione del security group usa `192.80.0.0/16`.
_(infoBox)_

Dopo qualche minuto Terraform segnala assessment falliti nella pagina di panoramica del workspace, e un assessment si può anche avviare a mano con **Start health assessment**. Con **View Details** si vede che HCP Terraform ha rilevato la modifica alla regola in ingresso, e cosa accadrà al prossimo run se non si aggiorna la configurazione. La drift detection segnala solo le modifiche agli attributi definiti nella configurazione, quindi conviene impostare esplicitamente gli attributi critici.

Gli health assessment hanno rilevato il drift dell'infrastruttura. Questi controlli garantiscono che la configurazione dell'infrastruttura corrisponda ancora a quella scritta e soddisfi le custom condition definite, ed estendono la copertura della validazione oltre il momento del provisioning. Correggere il drift è un processo manuale, perché bisogna capire se tenere le modifiche fatte al di fuori di Terraform o sovrascriverle. In questo caso si potrebbe eseguire un nuovo apply di Terraform per sovrascrivere la modifica al security group.

- Fonte: [Detect infrastructure drift and enforce policies](https://developer.hashicorp.com/terraform/tutorials/cloud/drift-and-policy)

---

## 8.26 — Il policy enforcement nei workspace

Questa sezione descrive come HCP Terraform impone le policy alle configurazioni dei workspace. Le informazioni generali su policy, policy set e framework di policy sono nella sezione 8.27. HCP Terraform Free include un policy set con al massimo cinque policy. Nelle edizioni Standard e Premium si può collegare un policy set a un repository di controllo versione, o creare versioni del policy set con l'API.

Alcune funzionalità sono specifiche della visualizzazione e della gestione del policy enforcement nei workspace:

- vedere e sovrascrivere (override) i risultati del policy enforcement nell'interfaccia del workspace;
- accedere all'output JSON dettagliato delle policy Sentinel.

La documentazione generale, valida sia per i workspace sia per gli Stack, comprende queste pagine:

- definire le policy, scrivendo policy personalizzate con Terraform policy, Sentinel o OPA;
- creare e gestire i policy set, che organizzano le policy e ne configurano lo scope;
- testare le policy prima di distribuirle;
- la libreria di policy già scritte, mantenute da HashiCorp;
- il riferimento degli import di Sentinel.

L'uso delle policy con gli Stack è descritto nella pagina *Policy enforcement for Stacks*.

- Fonte: [Policy enforcement in workspaces](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/policy-enforcement)

---

## 8.27 — Panoramica del policy enforcement

Le policy sono regole che permettono di verificare che i piani di Terraform rispettino le regole di sicurezza e le best practice. Terraform policy si può usare sia con i workspace sia con gli Stack, mentre i policy set Sentinel e OPA supportano solo i workspace.

### 8.27.1 — Introduzione

Le policy si implementano con uno di questi framework:

- **Terraform policy**: il framework di policy nativo, basato su HCL;
- **Sentinel**: il framework di policy-as-code di HashiCorp;
- **OPA**: Open Policy Agent, con il linguaggio Rego.

Le policy possono verificare un numero qualsiasi di condizioni, ad esempio se la configurazione dell'infrastruttura rispetta gli standard di sicurezza o le best practice. Si può scrivere una policy che verifica se Terraform pianifica di distribuire l'infrastruttura di produzione nella region corretta. Le policy servono anche a imporre standard sui workflow dell'organizzazione. Ad esempio, si può impedire i nuovi deployment il venerdì, riducendo il rischio di incidenti di produzione fuori dall'orario di lavoro del team.

Le policy dei workspace vengono valutate durante i run del workspace. Quelle degli Stack vengono valutate per ogni deployment dello Stack. Terraform policy richiede Terraform v1.17 o successivo.

### 8.27.2 — Il workflow

Il formato del file di configurazione delle policy dipende dal framework, e il workflow per creare e gestire le policy a mano ha tre fasi.

**Scrivere le policy** _(stepTitle)_

Le policy si scrivono nel formato del framework scelto, oppure si usano le policy Terraform policy o Sentinel già scritte e mantenute da HashiCorp, che impongono standard comuni come PCI DSS (libreria *Pre-written policy library*).

**Creare un policy set** _(stepTitle)_

Si aggiunge un file di configurazione delle policy a un repository del sistema di controllo versione, si aggiungono le policy e le si collega all'organizzazione. Le policy si possono applicare globalmente, o a project, workspace, Stack o deployment specifici. HCP Terraform verifica il piano di Terraform rispetto al policy set durante ogni run. Un policy set può contenere solo policy scritte in un unico framework, ma allo stesso workspace o Stack si possono applicare più policy set di framework diversi.

L'interfaccia permette di scrivere e conservare le policy nell'applicazione. È consigliato però conservarle in un VCS, per un workflow policy-as-code che garantisce standardizzazione, sicurezza e verificabilità. I policy set si possono creare anche in modo programmatico, con l'API.

**Rivedere i risultati delle policy** _(stepTitle)_

HCP Terraform impone le policy alle configurazioni degli Stack durante ogni operazione di deployment. Quando un policy set ha come obiettivo uno Stack, HCP Terraform valuta le policy rispetto al piano di Terraform di ogni deployment dello Stack. HCP Terraform mostra i risultati per ogni policy set. A seconda del livello di enforcement, le policy fallite possono fermare il run, e con i permessi giusti si possono sovrascrivere le policy fallite.

- Fonte: [Policy enforcement overview](https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement)

---

## 8.28 — Imporre policy OPA con HCP Terraform e Styra

Man mano che un'organizzazione cresce e i suoi workflow di provisioning maturano, diventa più difficile imporre le best practice con la diffusione interna e con strumenti su misura. Terraform offre diversi modi per verificare che l'infrastruttura rispetti sia le best practice del settore sia gli standard specifici dell'organizzazione. Automatizzando validazione ed enforcement, si garantiscono in modo programmatico conformità e coerenza dell'infrastruttura.

Precondition e postcondition permettono di scrivere controlli a livello di risorsa nelle definizioni delle risorse. Includendole nelle definizioni dei moduli, si garantisce che chi usa i moduli a valle rispetti gli standard di configurazione e usi i moduli come previsto dall'autore.

Le run task di HCP Terraform permettono di integrare nel workflow Terraform strumenti di terze parti, come scanner di vulnerabilità, calcolatori di costi e scanner del codice. Le run task inviano il contenuto del piano di Terraform agli strumenti esterni configurati, tra le fasi di plan e apply di un run. Si può decidere se applicare o no la configurazione in base alla risposta dello strumento.

![Figura 29](img/hcp-run-task-diagram.png) _(dimensioni: 960×263 px)_

*Figura 29 — Una run task tra plan e apply: il piano viene inviato allo strumento esterno, e la sua risposta decide se procedere con l'apply. Fonte: HashiCorp Developer.* _(caption)_

Styra Declarative Authorization Service (DAS) offre deployment di Open Policy Agent (OPA) senza agent e un control plane centralizzato per gestire le policy, con un policy builder e una libreria di policy pubbliche per iniziare. Come Terraform per l'infrastructure as code, OPA permette di usare un unico linguaggio di policy-as-code per diversi tipi di configurazioni e risorse.

> **Nota**: HCP Terraform Free Edition include un'integrazione di run task, applicabile fino a dieci workspace.
_(infoBox)_

Nel tutorial si usano sia le precondition di Terraform sia le run task di HCP Terraform, per validare la configurazione e imporre le pratiche dell'organizzazione. Prima si usano le precondition per impedire di distribuire bastion host troppo grandi, riducendo i costi dell'infrastruttura. Poi si integra una run task di HCP Terraform con una policy OPA di Styra, per impedire di creare security group AWS che consentono traffico pubblico in ingresso. Si definisce anche una policy OPA personalizzata, che permette solo a specifici utenti HCP Terraform di distribuire modifiche all'infrastruttura il venerdì.

### 8.28.1 — La precondition sul bastion

Il modulo di rete accetta diverse input variable, tra cui `bastion_instance_type`, per adattarsi all'uso e ai carichi di lavoro previsti. Agli utenti si vuole permettere di scegliere il tipo di istanza, ma non di creare un'istanza troppo grande. Una precondition può verificare che il tipo di istanza non abbia più di 2 core, per contenere i costi operativi. Prima si aggiunge alla configurazione del modulo, in `modules/network/main.tf`, il data source seguente, che legge dal provider AWS i dettagli del tipo di istanza:

```
data "aws_ec2_instance_type" "bastion" {
  instance_type = var.bastion_instance_type
}
```

Poi si aggiunge la precondition alla definizione della risorsa `aws_instance.bastion`:

```
resource "aws_instance" "bastion" {
  instance_type = var.bastion_instance_type
  ami           = data.aws_ami.amazon_linux.id

  subnet_id              = module.vpc.public_subnets[0]
  vpc_security_group_ids = [aws_security_group.bastion.id]

  lifecycle {
    precondition {
      condition     = data.aws_ec2_instance_type.bastion.default_cores <= 2
      error_message = "Change the value of bastion_instance_type to a type that has fewer than 2 cores to avoid over provisioning."
    }
  }
}
```

Terraform valuta le precondition prima di valutare il blocco che le contiene: qui verifica che la configurazione soddisfi la condizione prima di creare l'istanza bastion.

La configurazione root, nella radice del repository, usa il modulo di rete per creare un bastion host e i componenti di rete: una VPC, le subnet, un NAT gateway e le tabelle di routing. I valori delle input variable sono nel file `terraform.auto.tfvars`. Il tipo iniziale del bastion è `t2.2xlarge`, che ha 8 core e quindi, come previsto, non supera la precondition:

```
bastion_instance_type = "t2.2xlarge"
aws_region            = "us-east-2"
```

Si imposta il nome dell'organizzazione HCP Terraform nella variabile d'ambiente `TF_CLOUD_ORGANIZATION` e si inizializza la configurazione, che crea il workspace `learn-terraform-validation-enforcement`. L'apply fallisce con l'errore della precondition, perché il tipo di istanza indicato è troppo grande.

> **Nota**: il tutorial presuppone un'organizzazione HCP Terraform dedicata, con un variable set globale che contiene le credenziali AWS (si veda *Create a Credential Variable Set*). Se si usa un variable set con scope limitato, va assegnato al nuovo workspace.
_(infoBox)_

Si cambia quindi in `terraform.auto.tfvars` il valore di `bastion_instance_type` in `"t2.small"`, e si riapplica la configurazione confermando con `yes`. La precondition passa, e Terraform crea il bastion e i componenti di rete.

> **Nota**: il messaggio d'errore dell'esempio chiede un tipo con "meno di 2 core", ma la condizione `default_cores <= 2` accetta anche 2 core. Nel tutorial della sezione 8.25 lo stesso messaggio dice correttamente "2 core o meno".
_(infoBox)_

### 8.28.2 — Configurare la run task di Styra

La validazione a livello di configurazione impone gli standard dall'interno della configurazione scritta. Si basa però sul fatto che gli autori dei moduli includano precondition e postcondition nelle definizioni, e che gli altri usino quei moduli per creare l'infrastruttura. Per imporre e controllare l'infrastruttura in un intero workspace si usano le run task di HCP Terraform. Una run task usa strumenti di terze parti per stabilire se le modifiche proposte in un'operazione di Terraform soddisfano requisiti predefiniti. Decide anche se avvisare l'utente di una violazione o bloccare del tutto l'operazione.

![Figura 30](img/hcp-validation-mechanisms.png) _(dimensioni: 960×540 px)_

*Figura 30 — Lo scope dei meccanismi di validazione sulla configurazione Terraform. Fonte: HashiCorp Developer.* _(caption)_

La run task di HCP Terraform di Styra integra i controlli OPA nel workflow di gestione dell'infrastruttura, e permette di usare un framework standard di policy-as-code in diverse parti del sistema. Impone gli standard dell'infrastruttura senza richiedere agli utenti di scrivere la configurazione in un modo particolare. Funziona in modo simile all'implementazione policy-as-code di Sentinel. La run task però si applica solo ai workspace a cui la si associa, mentre le policy Sentinel si possono applicare a tutta l'organizzazione HCP Terraform.

Styra DAS organizza le policy in collezioni. L'insieme delle policy è un workspace Styra, che può comprendere più sistemi. In Styra un sistema è una raccolta logica di policy, raggruppate in base al modo in cui si creano le risorse, ad esempio risorse Kubernetes o Terraform. Per configurare una run task di HCP Terraform che usa l'integrazione Styra si procede così:

1. nella dashboard di Styra si crea un nuovo sistema di tipo Terraform, chiamato `tfc`. Styra vi predispone una directory per ciascuno dei cloud provider più comuni, tra cui AWS, GCP e Azure;
2. nella pagina **API Tokens** delle impostazioni dell'organizzazione HCP Terraform si crea un token dell'organizzazione, che dà a Styra l'accesso all'organizzazione;
3. nelle impostazioni del workspace Styra, alla voce **Terraform Integration**, si inseriscono il nome dell'organizzazione HCP Terraform e il token. Styra crea così una run task di policy check nell'organizzazione HCP Terraform;
4. nelle impostazioni del workspace HCP Terraform, alla voce **Run Tasks**, si associa al workspace la run task `styra-das-policy-check-*`, con il livello di enforcement **Mandatory**;
5. in Styra, con **Add system mapping**, si associa il sistema `tfc` all'ID del workspace HCP Terraform.

Ora si possono definire le policy in Styra DAS. Per semplicità il tutorial le gestisce nell'interfaccia di Styra, ma Styra può usare anche repository GitHub come sorgente delle policy.

### 8.28.3 — Una policy sulla configurazione dell'infrastruttura

Con Styra DAS si possono definire policy personalizzate o usare policy esistenti della libreria pubblica. Gli utenti a pagamento possono usare anche i compliance pack, insiemi di policy che impongono best practice e standard del settore. Le policy predefinite permettono di aggiungere rapidamente controlli di conformità in tutta l'organizzazione.

Nel file `policy/aws/ec2/rules.rego` del sistema `tfc`, con **Add rule** si aggiunge dalla libreria la regola **Restrict ingress from public IPs**. Styra aggiunge al sistema questa definizione di policy, che impedisce a Terraform di creare security group che consentono traffico in ingresso da internet:

```
enforce[decision] {
  data.global.systemtypes["terraform:1.0"].library.provider.aws.network.security_group.ingress_restrict_public_access.v1.ingress_restrict_public_access[message]
  decision := {
    "allowed": false,
    "message": message
  }
}
```

Si imposta la modalità della policy su **Enforce**, per impedire al workspace HCP Terraform di creare security group accessibili pubblicamente, e si pubblica la policy.

### 8.28.4 — Provocare la violazione di una policy

Come nella sezione 8.25, si immagini un ingegnere che, durante un incidente di produzione, aggiunga al bastion un security group più permissivo per aggirare la restrizione. Si aggiunge a `main.tf` questa configurazione:

```
data "aws_instance" "bastion" {
  instance_id = module.network.bastion_instance_id
}

resource "aws_security_group" "bastion" {
  name   = "bastion_ssh_new"
  vpc_id = module.network.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
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

resource "aws_network_interface_sg_attachment" "bastion" {
  security_group_id = aws_security_group.bastion.id
  network_interface_id = data.aws_instance.bastion.network_interface_id
}
```

La configurazione accede agli attributi del bastion host con il data source `data.aws_instance.bastion`. Definisce poi un security group che consente traffico pubblico in ingresso, e lo associa all'interfaccia di rete del bastion. Con `terraform apply` la run task fallisce, perché il security group è troppo permissivo. Dopo aver generato il piano, Terraform ne ha inviato i dettagli a Styra, per verificare che le risorse proposte soddisfino le policy definite. Come previsto, il policy check è fallito e ha impedito a Terraform di creare il security group. Nei dettagli del run in HCP Terraform si vedono le informazioni sul fallimento della run task. Dopo qualche minuto Styra mostra i dettagli della decisione, con il motivo del fallimento e l'input del run, che contiene il piano di esecuzione e tutte le modifiche proposte.

### 8.28.5 — Una policy sulle pratiche dell'organizzazione

Si vuole anche impedire i deployment il venerdì. In Styra si crea una nuova policy con percorso `tfc/runs` e modulo `rules.rego`, con una regola che impedisce le operazioni in un certo giorno della settimana. Per provarla si sostituisce `Friday` con il giorno corrente. Dopo aver pubblicato la policy, un nuovo `terraform apply` fallisce, e i dettagli della decisione mostrano che il piano non ha superato entrambe le regole.

```
enforce[decision] {
  message := "No deployments allowed on Fridays"

  time.weekday(time.now_ns()) == "Friday"

  decision := {
    "allowed": false,
    "message": message
  }
}
```

**Modificare la policy** _(stepTitle)_

In alcuni casi bloccare tutti i deployment del venerdì può essere troppo limitante. In caso di disservizio o di incidente di produzione si può voler permettere ai membri senior del team di fare le modifiche necessarie, qualunque sia il giorno. Si definisce quindi un elenco di utenti HCP Terraform come eccezione alla regola. Il payload del piano di HCP Terraform contiene un campo `styra-tfc-webhook` con i dettagli del run, compreso il nome dell'utente HCP Terraform che ha avviato l'operazione (`run_created_by`). La policy aggiornata verifica se l'utente fa parte dell'elenco delle eccezioni:

```
package policy.tfc.runs

allowed_users := {
  "USERNAME"
}

enforce[decision] {
  user := input["styra-tfc-webhook"].run_created_by
  message := sprintf("User %s is not permitted to trigger deployments on Fridays", [user])

  time.weekday(time.now_ns()) == "Friday"
  not allowed_users[user]

  decision := {
    "allowed": false,
    "message": message
  }
}
```

Dopo aver pubblicato la policy, si corregge il security group troppo permissivo, cambiando il CIDR in ingresso in `172.16.0.0/12`. Questa volta il run riesce. Con le run task di HCP Terraform e Styra si sono definite due policy diverse, che impongono standard di configurazione dell'infrastruttura e pratiche dell'organizzazione.

- Fonte: [Enforce OPA policies using HCP Terraform and Styra](https://developer.hashicorp.com/terraform/tutorials/cloud/validation-enforcement)

---

## 8.29 — Il registry privato di HCP Terraform

Il registry privato di HCP Terraform funziona in modo simile al Terraform Registry pubblico, e aiuta a condividere provider e moduli Terraform in tutta l'organizzazione. Supporta il versionamento e offre un elenco consultabile dei provider e dei moduli disponibili.

### 8.29.1 — Provider e moduli pubblici

I moduli e i provider pubblici sono ospitati nel Terraform Registry pubblico, e HCP Terraform può sincronizzarli automaticamente nel registry privato di un'organizzazione. Così si indica chiaramente quali provider e moduli pubblici sono raccomandati per l'organizzazione, e se ne rendono accessibili in modo centralizzato documentazione ed esempi. Un'istanza di Terraform Enterprise deve consentire l'accesso a `registry.terraform.io`, `https://yy0ffni7mf-dsn.algolia.net/` e `github.com`.

### 8.29.2 — Provider e moduli privati

I provider e i moduli privati sono ospitati nel registry privato di un'organizzazione, e sono disponibili solo ai membri di quell'organizzazione. In Terraform Enterprise sono disponibili anche alle altre organizzazioni configurate per la condivisione con quell'organizzazione.

### 8.29.3 — Gestire l'utilizzo

Con le policy Sentinel si può gestire il modo in cui i membri dell'organizzazione usano i moduli del registry privato. Ad esempio, si può imporre che tutti i moduli non root delle configurazioni Terraform siano moduli privati, o moduli pubblici del proprio registry privato. Si può anche applicare una policy che richiede a tutti i moduli di usare versioni recenti.

- Fonte: [HCP Terraform private registry overview](https://developer.hashicorp.com/terraform/cloud-docs/registry)

---

## 8.30 — L'Explorer per la visibilità dei workspace

Man mano che un'organizzazione cresce, tenere traccia del patrimonio di infrastruttura diventa più complesso. L'Explorer per la visibilità dei workspace mette in evidenza un'ampia gamma di informazioni utili da tutta l'organizzazione. Lo si apre con **Explorer** nella barra laterale principale dell'organizzazione.

La pagina **Explorer** elenca nella barra laterale i tipi di risorse della piattaforma da esplorare: workspace, moduli, provider e versioni di Terraform. Facendo clic su un tipo si vedono sottoinsiemi di informazioni. Facendo clic su una scheda si interroga l'Explorer, e i risultati compaiono in una tabella. Ogni colonna della tabella dei risultati si può ordinare. I campi con link mostrano viste via via più specifiche dei dati: ad esempio, il conteggio dei moduli di un workspace porta a una vista dei moduli associati a quel workspace. Per tornare alla pagina iniziale dell'Explorer si cancella la query con la freccia indietro in alto a sinistra.

### 8.30.1 — Permessi e tipi

L'Explorer richiede l'accesso a un'ampia gamma di dati dell'organizzazione. Per usarlo bisogna essere proprietari dell'organizzazione, o avere il permesso di organizzazione **View all workspaces** o superiore. L'Explorer supporta quattro tipi: Workspaces, Modules, Providers e Terraform Versions.

### 8.30.2 — Casi d'uso

L'Explorer offre query predefinite per casi d'uso specifici:

- **Top module versions**: i moduli ordinati per frequenza d'uso;
- **Latest Terraform versions** e **Top Terraform versions**: le versioni di Terraform in uso, ordinate per versione o per frequenza d'uso;
- **Top provider versions**: i provider ordinati per frequenza d'uso;
- **Workspaces without VCS**: i workspace non collegati a un VCS;
- **Workspace VCS source**: i workspace collegati a un VCS, ordinati per nome del repository;
- **Workspaces with failed checks**: i workspace che non hanno superato almeno un check di validazione continua;
- **Drifted workspaces**: i workspace con drift e le relative informazioni;
- **All workspace versions**: una vista semplificata dei workspace, con il run corrente e le versioni;
- **Runs by status**: i workspace ordinati per stato del run corrente;
- **Latest updated workspaces**: i workspace aggiornati più di recente;
- **Oldest applied workspaces**: i workspace ordinati per data del run applicato corrente.

### 8.30.3 — Condizioni di filtro personalizzate

Il query builder dell'Explorer esegue query con condizioni di filtro personalizzate su tutti i tipi supportati. Si seleziona un tipo o un caso d'uso dalla pagina iniziale e si espande la sezione **Modify conditions**, che mostra le condizioni della query corrente e permette di definirne di nuove. Ogni condizione è una riga con tre campi:

1. il campo di destinazione su cui eseguire la query;
2. l'operatore, con opzioni che dipendono dal tipo di dato del campo;
3. il valore da confrontare.

Con **Run Query** si valutano le condizioni. Le condizioni dei casi d'uso predefiniti sono un buon esempio di come costruirle. Una query può avere più condizioni, che l'Explorer valuta in AND logico. Le condizioni si aggiungono con **Add condition** e si rimuovono con il cestino.

### 8.30.4 — Salvare una vista

Le viste dell'Explorer si possono salvare, per tornare a una query personalizzata o a un caso d'uso. HCP Terraform e Terraform Enterprise non salvano i risultati né la cronologia delle query: riaprendo una vista, la query viene rieseguita e mostra solo i risultati attuali. Per salvare una vista si definisce una query e si scelgono le colonne da mostrare, poi da **Actions** si sceglie **Save view** e le si dà un nome univoco. Viene salvata l'ultima query eseguita: se si cambia una query senza rieseguirla, le modifiche non vengono salvate.

Le viste salvate si trovano nella scheda **Saved views** della pagina principale dell'Explorer, con nome, tipo di dati, proprietario e data dell'ultimo aggiornamento, e lì si possono rinominare o eliminare. Per aggiornare una vista salvata la si modifica e si sceglie di nuovo **Save view**. Per crearne una nuova a partire da una esistente si usa **Save as**. Per eliminarla si usa **Delete view** dal menu **Actions**.

- Fonte: [Explorer for workspace visibility](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/explorer)

---

## 8.31 — Le change request

Le change request permettono di creare un backlog di azioni da compiere registrato su un workspace, così gli amministratori avvisano direttamente i team quando un workspace richiede un intervento. Le azioni possono comprendere l'aggiornamento di versioni di moduli deprecate o revocate, aggiornamenti di sicurezza, bug o correzioni di conformità. Le change request registrano le attività direttamente sui workspace che hanno bisogno di quelle modifiche. Chi gestisce una change request la può archiviare per segnalarne il completamento. Le change request sono disponibili nelle edizioni Standard e Premium di HCP Terraform.

### 8.31.1 — Introduzione

L'Explorer aiuta a far emergere informazioni utili in tutta l'organizzazione (sezione 8.30). Esaminando i dati dei workspace nell'Explorer si possono trovare workspace da aggiornare o correggere. Senza perdere il contesto, si crea una change request direttamente dall'Explorer, per lasciare azioni da compiere sui workspace. Si può anche salvare una vista nell'Explorer, per tornare ai workspace su cui si è creata una change request, o per crearne regolarmente su workspace specifici. Se un workspace appartiene a una persona o a un team, si può configurare una notifica di team che li avvisa direttamente quando uno dei loro workspace riceve una nuova change request.

### 8.31.2 — Il workflow principale

Gli amministratori creano nuove change request direttamente dalle query dell'Explorer sui dati dei workspace. Selezionano i workspace da includere e scrivono un messaggio con i dettagli e l'obiettivo della change request. I workspace gestiscono e tengono traccia direttamente delle proprie change request, e i membri del team archiviano una change request dopo averne completato l'attività.

- Fonte: [Change requests overview](https://developer.hashicorp.com/terraform/cloud-docs/workspaces/change-requests)
