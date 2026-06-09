# Modulo 2 — Gestire identità e governance in Azure

_Questo percorso affronta la gestione delle identità digitali e la governance dell'infrastruttura Azure.
Una corretta configurazione di identità, accessi e policy è fondamentale per sicurezza e conformità._

**Immagini usate in questo modulo:**
- `img/entra-domain-services.png` (850×437) — Figura 2
- `img/entra-users.png` (946×398) — Figura 3
- `img/entra-groups.png` (940×378) — Figura 4
- `img/Figura_12_Azure_Service_Categories.jpg` (460×204) — Figura 12
- `img/Figura_13_Azure_Account_Scope_Levels.jpg` (460×298) — Figura 13
- `img/Figura_14_Azure_Physical_Infrastructure.jpg` (580×212) — Figura 14
- `img/Figura_15_Availability_Zones_in_a_Region.jpg` (460×233) — Figura 15
- `img/Figura_16_Azure_Service_Categories_for_AZ.jpg` (460×219) — Figura 16
- `img/Figura_17_Azure_Region_Pairs.jpg` (460×241) — Figura 17
- `img/Figura_18_Resource_Group_Rules.jpg` (460×180) — Figura 18
- `img/Figura_19_Management_Group_Hierarchy.jpg` (460×277) — Figura 19
- `img/Figura_20_Azure_Subscription_Boundaries.jpg` (460×204) — Figura 20
- `img/cloud-governance-steps.png` (2031×278) — Figura 21
- `img/azure-governance-hierarchy.png` (1459×955) — Figura 22
- `img/azure-policy-arm.png` (1853×964) — Figura 23
- `img/rbac-security-principal.png` (357×134) — Figura 24
- `img/rbac-role-definition.png` (537×352) — Figura 25
- `img/rbac-roles-hierarchy.png` (895×598) — Figura 26
- `img/rbac-iam-portal.png` (1069×708) — Figura 27

---

## 2.1 — Conoscere Microsoft Entra ID
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.1.1 — Esaminare Microsoft Entra ID
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra ID (precedentemente Azure Active Directory) è il servizio di gestione delle identità e degli accessi basato su cloud di Microsoft. Consente a dipendenti, partner ed utenti di accedere in modo sicuro a risorse esterne (Microsoft 365, portale Azure, SaaS) e interne (app sulla rete aziendale e in cloud).

- Non è la versione cloud di Active Directory Domain Services (AD DS) — sono servizi distinti con scopi diversi.
- Può essere usato da organizzazioni di qualsiasi dimensione, anche senza infrastruttura on-premise.
- Ogni tenant Azure ha automaticamente un tenant Entra ID associato.

**Entra ID è un servizio PaaS** _(stepTitle)_

Entra ID fa parte dell'offerta PaaS (Platform as a Service) di Azure: è un servizio di directory interamente gestito da Microsoft nel cloud. Non richiede di distribuire VM, installare controller di dominio o applicare patch. Microsoft si occupa di disponibilità, scalabilità e manutenzione. Il livello base è incluso gratuitamente in ogni sottoscrizione Azure; le funzionalità avanzate richiedono i piani P1 o P2.

Le principali operazioni che si possono gestire tramite Entra ID includono:

- Configurazione dell'accesso alle applicazioni e Single Sign-On (SSO) per app SaaS cloud.
- Gestione di utenti, gruppi e provisioning automatico.
- Abilitazione della federazione tra organizzazioni e autenticazione a più fattori (MFA).
- Identificazione delle attività di accesso irregolari e configurazione dell'accesso condizionale.
- Estensione delle implementazioni AD DS on-premise tramite Microsoft Entra Connect.
- Configurazione di Application Proxy per esporre app interne all'esterno in modo sicuro.

**Il concetto di Tenant** _(stepTitle)_

Un tenant rappresenta una singola istanza di Microsoft Entra ID associata a un'organizzazione. È il confine di sicurezza e il contenitore per tutti gli oggetti Entra ID: utenti, gruppi, applicazioni e dispositivi.

- A ogni tenant viene assegnato automaticamente un dominio DNS predefinito nel formato `prefisso.onmicrosoft.com`. È possibile aggiungere domini personalizzati (es. `azienda.com`).
- Una sottoscrizione Azure è associata a un solo tenant Entra ID alla volta, ma lo stesso tenant può essere associato a più sottoscrizioni.
- È possibile creare più tenant all'interno di una stessa organizzazione, ad esempio per ambienti di test isolati.
- Entra ID è la directory multi-tenant più grande del mondo: oltre un milione di istanze e miliardi di autenticazioni settimanali.

**Schema di Entra ID vs AD DS** _(stepTitle)_

Lo schema di Entra ID è più semplice e flessibile rispetto a quello di AD DS, ed è ottimizzato per le identità cloud:

- Nessuna classe OU (Organizational Unit) — non è possibile organizzare oggetti in gerarchie di contenitori. L'organizzazione avviene tramite gruppi e appartenenza dinamica.
- Nessuna classe Computer — solo la classe Device, con un processo di join diverso da AD DS (Azure AD Join o Hybrid Join).
- Nessun GPO (Group Policy Object) — la gestione dei dispositivi avviene tramite soluzioni moderne come Microsoft Intune.
- Classi Application e ServicePrincipal — ogni app registrata in Entra ID crea un oggetto Application (definizione) e un ServicePrincipal (istanza nel tenant).
- Lo schema è estendibile e le estensioni sono completamente reversibili, a differenza di AD DS.


### 2.1.2 — Confronto tra Microsoft Entra ID e Active Directory Domain Services
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

AD DS è un servizio di directory tradizionale on-premise basato su protocolli Kerberos e LDAP, progettato per gestire oggetti in una rete locale. Microsoft Entra ID è invece un servizio cloud basato su HTTP/HTTPS, OAuth 2.0 e SAML, pensato per identità distribuite su internet.

- AD DS usa strutture gerarchiche (foreste, domini, OU); Entra ID usa un modello flat con tenant.
- AD DS gestisce computer, stampanti e criteri di gruppo (GPO); Entra ID non supporta GPO nativamente.
- Entra ID supporta autenticazione moderna: OAuth 2.0, OpenID Connect, SAML — protocolli non disponibili in AD DS.
- I due servizi possono coesistere in ambienti ibridi tramite Microsoft Entra Connect (sincronizzazione delle identità).


### 2.1.3 — Esaminare Microsoft Entra ID come servizio directory per le app cloud
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra ID è il sistema di identità nativo per le applicazioni cloud e SaaS. Le applicazioni si registrano nel tenant Entra ID e ottengono un'identità (App Registration) con cui possono autenticare utenti, richiedere permessi e accedere ad altre risorse Azure tramite token OAuth 2.0.

- Single Sign-On (SSO) — un utente accede una volta sola e può usare tutte le app integrate senza reinserire le credenziali.
- Supporto per migliaia di app SaaS pre-integrate nella galleria di Entra ID (Salesforce, ServiceNow, GitHub, ecc.).
- Le app possono essere registrate manualmente per ottenere Client ID e Client Secret da usare nei flussi OAuth.


### 2.1.4 — Confrontare i piani P1 e P2 di Microsoft Entra ID
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra ID è disponibile in quattro livelli. I piani a pagamento aggiungono funzionalità avanzate di sicurezza e governance:

- **Free** — gestione utenti e gruppi di base, SSO per massimo 10 app, autenticazione MFA.
- **Microsoft 365 Apps** — include le funzionalità Free più gestione delle identità per le app Microsoft 365.
- **P1 (Premium 1)** — aggiunge accesso condizionale, gruppi dinamici, self-service password reset (SSPR) on-premise, e Hybrid Entra ID Join.
- **P2 (Premium 2)** — include tutto P1 più Entra ID Protection (rilevamento rischi e utenti compromessi) e Privileged Identity Management (PIM) per l'assegnazione JIT dei ruoli privilegiati.

> **Regola pratica P1 vs P2**: Usare P2 quando le domande menzionano "rischio" o "accesso privilegiato" (PIM, Identity Protection). P1 per tutto il resto (Conditional Access, gruppi dinamici, SSPR, Cloud App Discovery).


### 2.1.5 — Esaminare Microsoft Entra Domain Services
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Microsoft Entra Domain Services (Entra DS) è un servizio gestito che fornisce funzionalità di dominio tradizionali (join al dominio, criteri di gruppo, LDAP, Kerberos/NTLM) senza dover distribuire, gestire o applicare patch a domain controller. È utile per eseguire in cloud applicazioni legacy che non supportano autenticazione moderna.

- Microsoft gestisce i domain controller: alta disponibilità, backup e aggiornamenti sono automatici.
- Si sincronizza unidirezionalmente da Microsoft Entra ID: utenti e gruppi di Entra ID sono disponibili nel dominio gestito.
- Non è possibile estendere lo schema del dominio gestito né creare OU personalizzate con piena libertà come in AD DS on-premise.
- Caso d'uso tipico: lift-and-shift di applicazioni legacy su Azure VM che richiedono LDAP o Kerberos, senza mantenere DC on-premise.

![Figura 2](img/entra-domain-services.png) _(dimensioni: 850×437 px)_

*Figura 2 — Microsoft Entra Domain Services fornisce un dominio gestito nella VNet di Azure, sincronizzato da Microsoft Entra ID.* _(caption)_


**Vantaggi principali** _(stepTitle)_

- Gli amministratori non devono gestire, aggiornare o monitorare i domain controller.
- Non è necessario distribuire e gestire la replica di Active Directory.
- Non servono i gruppi Domain Admins o Enterprise Admins per i domini gestiti.

**Limitazioni da tenere in considerazione** _(stepTitle)_

- È supportato solo l'oggetto Active Directory Computer di base — lo schema non è estendibile.
- La struttura delle OU è flat: le unità organizzative nidificate non sono supportate.
- Esiste un solo GPO predefinito per account utente e computer; non è possibile usare filtri WMI o filtri per gruppi di sicurezza.
- Non è possibile fare riferimento a OU con GPO personalizzati.

---

## 2.2 — Creare, configurare e gestire identità
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.2.1 — Creare, configurare e gestire utenti
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Ogni utente che deve accedere alle risorse Azure necessita di un account in Microsoft Entra ID. L'account contiene tutte le informazioni per autenticare l'utente durante il login. Dopo l'autenticazione, Entra ID compila un token di accesso che autorizza l'utente e determina a quali risorse può accedere.

**Tipi di identità utente** _(stepTitle)_

- **Identità cloud** — esistono solo in Microsoft Entra ID, senza alcuna controparte on-premise. Se l'account viene eliminato dalla directory principale viene rimosso definitivamente. L'origine nel portale è `Microsoft Entra ID` oppure `External Microsoft Entra Directory`.
- **Identità sincronizzate con directory** — esistono in un'Active Directory on-premise e vengono resi disponibili in Entra ID tramite sincronizzazione. Riconoscibili perché la loro origine nel portale è `Windows Server AD`. Strumento raccomandato: Microsoft Entra Cloud Sync; Microsoft Entra Connect Sync rimane disponibile per scenari complessi.
- **Utenti guest** — identità esterne all'organizzazione, invitate tramite Microsoft Entra B2B. L'origine nel portale è `Utente invitato`. Utili per fornitori, terzisti o partner. Quando la collaborazione termina, l'account guest può essere rimosso senza impattare l'identità originale dell'utente nel suo tenant.

![Figura 3](img/entra-users.png) _(dimensioni: 946×398 px)_

*Figura 3 — Visualizzazione degli utenti nel portale Microsoft Entra ID con tipo utente, UPN, paese e ruolo.* _(caption)_


**Gestione degli account** _(stepTitle)_

- UPN (User Principal Name) — identificatore univoco nel formato `utente@dominio.com`, usato per il login.
- Gli account possono essere creati singolarmente dal portale, in blocco tramite CSV, o tramite PowerShell/CLI.
- Un utente eliminato rimane nel cestino per 30 giorni ed è ripristinabile; dopo 30 giorni viene eliminato definitivamente.
- A ogni utente si assegnano licenze Microsoft 365 / Entra ID direttamente o tramite appartenenza a gruppi.


### 2.2.2 — Creare, configurare e gestire gruppi
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

I gruppi in Entra ID permettono di gestire l'accesso a risorse e applicazioni in modo centralizzato. Esistono due tipi principali:

- **Gruppi di sicurezza** — usati per controllare l'accesso a risorse Azure, applicazioni e licenze.
- **Gruppi Microsoft 365** — includono anche mailbox condivisa, calendario e sito SharePoint; usati per la collaborazione.

I gruppi possono avere tre modalità di appartenenza:

- **Assegnata** — i membri vengono aggiunti manualmente da un amministratore.
- **Dinamica utente** — i membri vengono aggiunti automaticamente in base a regole sulle proprietà utente (es. reparto, ruolo, paese). Richiede licenza Entra ID P1 o P2.
- **Dinamica dispositivo** — come la dinamica utente ma basata su proprietà dei dispositivi.

![Figura 4](img/entra-groups.png) _(dimensioni: 940×378 px)_

*Figura 4 — Visualizzazione dei gruppi nel portale Microsoft Entra ID con tipo gruppo (Security e Microsoft 365).* _(caption)_


### 2.2.3 — Configurare e gestire la registrazione dei dispositivi
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Con la proliferazione dei dispositivi personali (BYOD) i team IT devono bilanciare due obiettivi opposti: consentire agli utenti di lavorare da qualsiasi dispositivo, proteggendo allo stesso tempo le risorse aziendali. Esistono tre modalità di registrazione:

**1. Registrazione in Microsoft Entra ID (Workplace Join — BYOD)** _(stepTitle)_

- Destinatari: utenti con dispositivi personali (smartphone, tablet, PC di casa).
- Il dispositivo non richiede un account aziendale per il login locale.
- Sistemi operativi supportati: Windows 10+, macOS 10.15+, iOS 15+, Android, Linux (Ubuntu, RHEL).
- Gestione tramite Microsoft Intune (MDM) o criteri di protezione delle app (MAM).
- Scenario tipico: un dipendente aggiunge l'account aziendale nelle impostazioni di Windows per leggere la posta dal PC di casa.

**2. Aggiunta a Microsoft Entra ID (Entra Join — cloud-only)** _(stepTitle)_

- Destinatari: organizzazioni cloud-first o cloud-only, senza infrastruttura AD DS on-premise.
- Il dispositivo richiede un account aziendale per il login — è un dispositivo di proprietà dell'organizzazione.
- Sistemi operativi supportati: Windows 10/11 (escluse edizioni Home), Windows Server 2019+ su Azure VM, macOS 13+ (anteprima).
- Gestione tramite Microsoft Intune o Configuration Manager in co-gestione.
- Scenario tipico: lavoratori stagionali, collaboratori esterni, filiali remote senza infrastruttura locale.

**3. Aggiunta ibrida a Microsoft Entra ID (Hybrid Join)** _(stepTitle)_

- Destinatari: organizzazioni con Active Directory on-premise esistente che vogliono estendere le identità al cloud.
- Il dispositivo è membro del dominio AD DS locale ed è anche registrato in Entra ID — SSO sia per risorse cloud che on-premise.
- Sistemi operativi supportati: Windows 10/11 (escluse edizioni Home), Windows Server 2016/2019/2022.
- Scenario tipico: aziende con app Win32 legacy che dipendono dall'autenticazione AD.

**Cloud Kerberos Trust** _(stepTitle)_

Il writeback dei dispositivi (Device Writeback) non è più supportato ed è stato sostituito da Cloud Kerberos Trust. Questo approccio consente ai dispositivi Entra Join e Hybrid Join di autenticarsi alle risorse on-premise senza dover scrivere oggetti dispositivo in Active Directory locale — abilitando Windows Hello for Business senza infrastruttura aggiuntiva.


### 2.2.4 — Gestire le licenze
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Le licenze Microsoft si assegnano a ogni utente che deve accedere ai servizi a pagamento. La gestione avviene tramite l'interfaccia di amministrazione di Microsoft 365 o tramite PowerShell e Microsoft Graph API.

**Assegnazione diretta vs basata su gruppo** _(stepTitle)_

- **Assegnazione diretta** — la licenza viene assegnata singolarmente a ogni utente. Semplice ma difficile da scalare.
- **Assegnazione basata su gruppo** — la licenza viene assegnata a un gruppo; tutti i membri ricevono automaticamente la licenza. Quando un utente entra nel gruppo ottiene la licenza; quando viene rimosso la perde. Le modifiche sono valide entro pochi minuti.

**Requisiti per le licenze basate su gruppo** _(stepTitle)_

Per usare la funzionalità di distribuzione automatica delle licenze tramite gruppo, il tenant deve avere almeno una sottoscrizione Entra ID P1 attiva. In pratica, le aziende medio-grandi sono operativamente obbligate ad avere P1: gestire manualmente le licenze per centinaia o migliaia di dipendenti sarebbe impossibile senza errori.

Le grandi aziende raramente acquistano P1 separatamente, perché è già incluso nei bundle Microsoft 365:

- Microsoft 365 E3 → include Entra ID P1
- Microsoft 365 E5 → include Entra ID P2

**Funzionalità avanzate** _(stepTitle)_

- **Disabilitare piani di servizio specifici** — quando si assegna una licenza a un gruppo è possibile disabilitare singoli servizi del prodotto (es. disabilitare Viva Engage su Microsoft 365).
- **Licenze da più origini** — un utente può essere membro di più gruppi con licenza e avere anche licenze assegnate direttamente. Se riceve la stessa licenza da più origini, essa viene contata e usata una volta sola.
- **Errori di assegnazione** — se le licenze disponibili sono insufficienti, Entra ID segnala gli utenti per cui l'assegnazione non è riuscita.

**Posizione di utilizzo** _(stepTitle)_

Alcuni servizi Microsoft non sono disponibili in tutte le aree geografiche. Prima di assegnare una licenza a un utente occorre impostare la posizione di utilizzo nel profilo utente. Per le licenze basate su gruppo, gli utenti senza posizione specificata ereditano la posizione della directory.


### 2.2.5 — Creare attributi di sicurezza personalizzati
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Gli attributi di sicurezza personalizzati (Custom Security Attributes) sono coppie chiave-valore definite dall'amministratore e specifiche per il tenant, che possono essere aggiunte a utenti, gruppi, applicazioni e service principal.

**Perché usarli — casi d'uso concreti** _(stepTitle)_

- Estendere il profilo utente con informazioni aziendali sensibili (es. stipendio orario, visibile solo agli amministratori HR).
- Categorizzare migliaia di applicazioni registrate nel tenant per creare un inventario filtrabile.
- Controllare l'accesso a risorse Azure specifiche tramite ABAC (Attribute-Based Access Control).
- Applicare governance degli attributi: definire chi può leggere e chi può scrivere ciascun attributo.

**Caratteristiche principali** _(stepTitle)_

- Disponibili a livello di tenant — una volta definiti sono accessibili in tutta la directory.
- Tipi di dati supportati: booleano, intero, stringa.
- Supportano valori singoli o multipli sullo stesso attributo.
- Supportano valori in formato libero o valori predefiniti (lista chiusa).
- Funzionano anche su utenti sincronizzati da Active Directory on-premise.
- Differiscono dalle estensioni di directory: sono progettati specificamente per scenari di sicurezza e controllo degli accessi, con governance integrata.

**Limitazioni importanti** _(stepTitle)_

- Non sono supportati in Microsoft Entra Domain Services.
- Non sono inclusi nelle attestazioni dei token SAML o nei JSON Web Token (JWT) — non possono essere usati direttamente nelle applicazioni che leggono i token per decidere i permessi.


### 2.2.6 — Esplorare la creazione automatica degli utenti
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Il provisioning automatico degli utenti (SCIM Provisioning) permette di creare, aggiornare e disabilitare automaticamente gli account in applicazioni SaaS (Salesforce, ServiceNow, Workday, ecc.) in base agli account presenti in Entra ID, senza intervento manuale. La chiave è mantenere sempre aggiornati i sistemi di gestione delle identità: se un utente viene rimosso dal sistema HR, viene deprovisionato automaticamente da Entra ID, riducendo il rischio di account orfani.

**Perché usare SCIM** _(stepTitle)_

- Usa il protocollo standard aperto SCIM 2.0 (System for Cross-domain Identity Management).
- Il provisioning può essere configurato anche in direzione inversa (inbound): Workday o SuccessFactors creano automaticamente gli utenti in Entra ID.
- Il ciclo di provisioning iniziale sincronizza tutti gli utenti; i cicli incrementali successivi gestiscono solo le modifiche.
- I log di provisioning nel portale Azure mostrano ogni operazione eseguita, utile per il troubleshooting.

**Provisioning in ingresso basato su API** _(stepTitle)_

Non tutti i sistemi HR espongono un endpoint SCIM nativo. Da marzo 2024 Microsoft Entra ID supporta il provisioning in ingresso basato su API: qualsiasi strumento di automazione o script può recuperare i dati della forza lavoro da qualsiasi sistema di record e inviarli direttamente all'API di provisioning di Entra ID. Le origini supportate includono Workday, SAP SuccessFactors e qualsiasi sistema HR personalizzato.

---

## 2.3 — Descrivere i componenti architetturali principali di Azure
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.3.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure è la piattaforma cloud Microsoft che offre oltre 200 servizi per creare, eseguire e gestire applicazioni su data center globali.


### 2.3.2 — Che cos'è Microsoft Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure copre tutte le principali categorie di servizi cloud: Calcolo, Rete, Archiviazione, Database, AI/ML, IoT e molto altro, accessibili tramite il portale Azure, CLI, API o PowerShell.

> **Portale Azure**: Il portale Azure (portal.azure.com) è l'interfaccia grafica web per creare, gestire e monitorare tutte le risorse cloud. Disponibile 24/7, aggiornato continuamente senza downtime.
_(infoBox)_


### 2.3.3 — Introduzione agli account Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'organizzazione delle risorse in Azure segue una gerarchia a quattro livelli: Management Groups → Subscriptions → Resource Groups → Resources.

> **Account gratuito Azure**: Con l'account gratuito Azure si ottengono 200 $ di credito per 30 giorni, accesso gratuito ai servizi più diffusi per 12 mesi e oltre 55 servizi sempre gratuiti.
_(infoBox)_


### 2.3.4 — Descrivere l'infrastruttura fisica di Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'infrastruttura fisica di Azure è organizzata in una gerarchia dal più ampio al più specifico: Geography → Region → Availability Zone → Datacenter.

- **Data Center**: strutture fisiche con server, alimentazione ridondante, raffreddamento e rete dedicata. Non sono direttamente accessibili.
- **Aree geografiche (Regions)**: cluster di data center nelle vicinanze, collegati da rete a bassa latenza. Ogni regione è identificata con un nome (es. East US, West Europe).
- **Zone di disponibilità (Availability Zones)**: una o più strutture fisicamente separate all'interno di una regione, ciascuna con alimentazione, raffreddamento e rete indipendenti. Garantiscono continuità operativa in caso di guasto di un data center.
- **Coppie di aree (Region Pairs)**: ogni regione Azure è abbinata a un'altra regione nella stessa geography, distante almeno 480 km. In caso di interruzione estesa, una regione viene ripristinata prioritariamente rispetto all'altra.
- **Aree sovrane**: istanze separate e isolate di Azure per requisiti legali e di conformità specifici (es. Azure Government per enti federali USA, Azure China gestita da 21Vianet).


### 2.3.5 — Descrivere l'infrastruttura di gestione di Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

L'infrastruttura di gestione comprende quattro livelli gerarchici:

- **Risorse Azure**: qualsiasi elemento creabile in Azure (VM, database, rete virtuale, storage account, ecc.). Ogni risorsa deve appartenere a esattamente un gruppo di risorse.
- **Gruppi di risorse**: contenitori logici che raccolgono risorse correlate. Ogni risorsa appartiene a un solo gruppo di risorse; i gruppi non sono annidabili e non possono essere rinominati dopo la creazione. Eliminare un gruppo di risorse elimina in cascata tutte le risorse al suo interno.
- **Sottoscrizioni**: unità logica di Azure che collega un account utente e le risorse create da quell'account. Ha due confini principali: confine di fatturazione e confine di controllo degli accessi.
- **Gruppi di gestione**: contenitori per gestire l'accesso, le policy e la conformità su più sottoscrizioni. Le policy applicate a un gruppo si propagano automaticamente a tutte le sottoscrizioni figlie.

> **Gerarchia Azure**: La gerarchia completa è: Tenant Root Group → Gruppi di gestione → Sottoscrizioni → Gruppi di risorse → Risorse. Ogni livello eredita le policy e i controlli di accesso dal livello superiore.
_(infoBox)_


### Riepilogo 2.3
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

- Azure organizza le risorse in una gerarchia: Geography → Region → Availability Zone → Datacenter.
- Le Region Pairs garantiscono continuità operativa con failover automatico tra regioni distanti almeno 480 km.
- La gerarchia di gestione (Gruppi di gestione → Sottoscrizioni → Gruppi di risorse → Risorse) consente di applicare policy e controllo accessi in modo scalabile.
- Ogni risorsa appartiene a un solo gruppo di risorse; eliminare il gruppo elimina tutto il suo contenuto.

---

## 2.4 — Iniziative di Criteri di Azure
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.4.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Policy è il servizio di governance di Azure che consente di creare, assegnare e gestire policy che applicano regole ed effetti sulle risorse Azure, garantendo che rimangano conformi agli standard IT aziendali e agli accordi sul livello di servizio.

Le iniziative di Azure Policy sono raccolte di definizioni di policy raggruppate verso un obiettivo specifico. Consolidando più policy in un unico elemento, le iniziative consentono un controllo centralizzato su tutte le risorse Azure. Organizzazioni in settori regolamentati usano iniziative di policy per soddisfare requisiti normativi nazionali e regionali.


### 2.4.2 — Cloud Adoption Framework for Azure
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Il Cloud Adoption Framework (CAF) è una guida Microsoft che aiuta le organizzazioni ad adottare il cloud in modo strutturato. Azure Policy è uno degli strumenti chiave raccomandati dal CAF per implementare la governance.

- **Strategia** — definire motivazioni e obiettivi del passaggio al cloud.
- **Pianificazione** — allineare i piani di adozione del cloud agli obiettivi aziendali.
- **Preparazione** — predisporre l'ambiente cloud con landing zone sicure e conformi.
- **Adozione** — migrare e innovare carichi di lavoro nel cloud.
- **Governance** — applicare policy, controlli di costo e standard di sicurezza.
- **Gestione** — monitorare e ottimizzare le operazioni cloud nel tempo.

**I 5 step della cloud governance** _(stepTitle)_

La cloud governance è un processo continuo. Il CAF la suddivide in cinque passi:

- 1. Costituire un team di governance — un team dedicato responsabile di definire, mantenere e rendicontare le policy di governance cloud.
- 2. Valutare i rischi cloud — analisi dei rischi specifici dell'organizzazione: conformità normativa, sicurezza, operazioni, costi, gestione dei dati, risorse e AI.
- 3. Documentare le policy di governance — policy chiare che definiscono l'uso accettabile del cloud e le regole per mitigare i rischi identificati.
- 4. Applicare le policy di governance — implementazione sistematica tramite strumenti automatizzati e supervisione manuale.
- 5. Monitorare la governance cloud — monitoraggio regolare per verificare la conformità continua alle policy stabilite.

![Figura 21](img/cloud-governance-steps.png) _(dimensioni: 2031×278 px)_

*Figura 21 — I 5 step della cloud governance: processo iterativo da Build a cloud governance team fino a Monitor cloud governance.* _(caption)_

> **Processo iterativo**: I passi 1-5 vanno completati per stabilire la governance. In seguito è necessario iterare regolarmente sui passi 2-5 per mantenere la governance nel tempo.
_(infoBox)_


**Le 3 considerazioni chiave per definire una policy** _(stepTitle)_

- **Rischio aziendale** — documentare i rischi in evoluzione e la tolleranza al rischio in base alla classificazione dei dati e alla criticità delle applicazioni.
- **Policy e conformità** — tradurre le decisioni sui rischi in dichiarazioni di policy per definire in modo efficiente i confini di adozione del cloud.
- **Processo** — stabilire processi per monitorare le violazioni e l'aderenza alle policy aziendali.

**Le 5 discipline fondamentali della cloud governance** _(stepTitle)_

- **Cost Management** — valutazione e monitoraggio dei costi, controllo delle spese IT e adeguamento delle risorse alla domanda.
- **Security Baseline** — applicazione di una baseline di sicurezza a tutti gli sforzi di adozione cloud.
- **Resource Consistency** — coerenza nella configurazione delle risorse e applicazione di pratiche per l'onboarding, il ripristino e la individuazione.
- **Identity Baseline** — applicazione coerente di definizioni e assegnazioni di ruoli per garantire la baseline di identità e accesso.
- **Deployment Acceleration** — accelerazione del deployment tramite centralizzazione, coerenza e standardizzazione dei template.

**Esempi pratici di governance con Azure Policy** _(stepTitle)_

- Consentire il deployment di risorse Azure solo in aree geografiche approvate.
- Applicare regole di geo-replication per rispettare i requisiti di data residency.
- Limitare i tipi di VM consentiti nell'ambiente cloud.
- Imporre l'applicazione coerente di tag su tutte le risorse.
- Richiedere l'autenticazione a più fattori (MFA) per tutti gli account delle sottoscrizioni.
- Obbligare le risorse a inviare log di diagnostica a un workspace di Azure Monitor.

> **Bilanciamento controllo/velocità**: Una policy ben progettata bilancia controllo e stabilità con velocità operativa. Troppo controllo rallenta i team; troppa libertà genera rischi. È buona pratica valutare attentamente l'impatto prima di introdurre nuove policy restrittive.
_(infoBox)_


### 2.4.3 — Principi di progettazione di Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Policy segue un approccio dichiarativo: si definisce lo stato desiderato delle risorse e Azure si occupa di valutare e applicare le regole. I principi chiave sono:

- **Separazione dei ruoli** — chi definisce le policy è separato da chi le applica e da chi gestisce le risorse.
- **Ereditarietà** — le policy applicate a un livello superiore (es. Management Group) si propagano automaticamente ai livelli inferiori.
- **Non interferenza** — Azure Policy valuta e segnala la non conformità, ma non modifica le risorse esistenti a meno che non venga configurata una remediation esplicita.
- **Granularità** — è possibile applicare policy a livello di Management Group, sottoscrizione, gruppo di risorse o singola risorsa.

![Figura 22](img/azure-governance-hierarchy.png) _(dimensioni: 1459×955 px)_

*Figura 22 — Gerarchia di governance Azure: Tenant Root Group → Management Groups → Subscriptions → Resource Groups → Resources.* _(caption)_


**Azure Resource Manager e i due piani** _(stepTitle)_

Azure Resource Manager (ARM) è il servizio di deployment e gestione di Azure. Tutte le operazioni Azure si dividono in due categorie:

- **Control plane** — gestisce le risorse nella sottoscrizione (creare, aggiornare, eliminare). Azure Policy opera qui, integrata con ARM, valutando ogni richiesta prima che venga eseguita. Quando arrivi una richiesta tramite portale, CLI, PowerShell o API, ARM autentica, verifica RBAC e poi valuta Azure Policy nell'ordine indicato.
- **Data plane** — gestisce le operazioni sui dati all'interno di una risorsa già esistente (es. caricare un file su uno storage account, leggere un segreto da Key Vault). Queste operazioni bypassano ARM e vengono gestite direttamente dal resource provider del servizio.

![Figura 23](img/azure-policy-arm.png) _(dimensioni: 1853×964 px)_

*Figura 23 — Azure Policy e Azure Resource Manager: il Control Plane riceve le richieste da CLI, PowerShell, HTTP e portale Azure, le elabora tramite Azure Policy, RBAC, ARM Templates e altri servizi, e le instrada ai Resource Provider.* _(caption)_

> **RBAC prima di Azure Policy**: Quando una richiesta arriva ad ARM, viene valutato prima RBAC e poi Azure Policy. Se l'utente non ha i permessi RBAC necessari, Azure Policy non viene nemmeno considerata — la richiesta fallisce già al controllo dei permessi.
_(infoBox)_


**Greenfield vs Brownfield** _(stepTitle)_

Azure Resource Manager gestisce due scenari distinti per l'applicazione delle policy:

- **Greenfield (policy-first)** — la policy esiste già quando si crea o aggiorna una risorsa. La valutazione avviene in tempo reale: ARM riceve la richiesta, verifica RBAC, valuta Azure Policy e blocca immediatamente se la risorsa non è conforme.
- **Brownfield (resource-first)** — le risorse esistono già quando viene assegnata una nuova policy. La valutazione avviene tramite compliance scan automatico ogni 24 ore o manuale su richiesta. Le risorse esistenti non conformi vengono segnalate ma non eliminate; i tentativi futuri di creare risorse non conformi vengono bloccati.

> **Esempio pratico**: Si crea una policy che vieta la creazione di risorse fuori dall'area West Europe. Le VM già esistenti in East US non vengono cancellate ma risultano non conformi nel report. Qualsiasi nuova VM creata in East US viene bloccata immediatamente.
_(infoBox)_


### 2.4.4 — Risorse di Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure Policy mette a disposizione 6 risorse principali: Definizioni, Iniziative, Assegnazioni, Esenzioni, Attestazioni e Remediation task.

**Definizioni (Definitions)** _(stepTitle)_

La regola vera e propria, scritta in JSON. Descrive la condizione da valutare e l'effetto da applicare. Possono essere di due tipi:

- **Built-in** — generate da Azure Resource Providers, disponibili per default. Azure ne offre centinaia pronte all'uso.
- **Custom** — scritte dall'utente quando nessuna built-in copre il requisito specifico dell'organizzazione.

**Iniziative (Initiatives / Policy Set)** _(stepTitle)_

Raccolta di più definizioni di policy raggruppate per un obiettivo comune (es. conformità PCI-DSS, standard di sicurezza baseline). Semplifica l'assegnazione di molte policy in una sola operazione. Anche le iniziative possono essere built-in o custom.

> **Built-in vs Custom**: Le iniziative built-in coprono i principali framework normativi (ISO 27001, NIST, CIS). Le custom permettono di costruire un set di policy su misura per i requisiti specifici dell'organizzazione.
_(infoBox)_

**Assegnazioni (Assignments)** _(stepTitle)_

Il collegamento tra una definizione/iniziativa e uno specifico ambito. Proprietà configurabili:

- Resource selectors — rollout graduale basato su tipo o posizione delle risorse.
- Overrides — modificare l'effetto di una policy senza cambiare la definizione originale.
- Excluded scopes — escludere specifici sotto-ambiti o risorse dall'assegnazione.
- Noncompliance messages — messaggi personalizzati mostrati quando una risorsa non è conforme.
- Managed identity — richiesta per le policy con effetto `deployIfNotExists` o `modify`.

**Esenzioni (Exemptions)** _(stepTitle)_

Permettono di escludere una risorsa o una gerarchia dalla valutazione di una policy, pur conteggiandola nel report di conformità generale. Si creano dopo l'assegnazione, non durante. Due categorie:

- **Mitigated** — l'obiettivo della policy è raggiunto tramite un metodo alternativo.
- **Waiver** — la non conformità è temporaneamente accettata (es. durante una migrazione in corso).

**Attestazioni (Attestations)** _(stepTitle)_

Usate per impostare manualmente lo stato di conformità su risorse che richiedono verifica umana — ad esempio policy che verificano processi organizzativi non rilevabili automaticamente.

**Remediation task** _(stepTitle)_

Attività di correzione per portare risorse non conformi a uno stato conforme. Applicabili solo alle definizioni con effetto `modify` o `deployIfNotExists`. Le risorse create o aggiornate dopo l'assegnazione vengono corrette automaticamente; quelle già esistenti richiedono un remediation task esplicito.

> **Ambito (Scope)**: L'ambito definisce dove viene applicata la policy. Una policy assegnata a un Management Group si applica a tutte le sottoscrizioni e risorse sotto di esso.
_(infoBox)_


### 2.4.5 — Definizioni di Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Una definizione di policy descrive le condizioni di conformità di una risorsa e l'effetto da applicare se la condizione è soddisfatta. Si compone di due parti: una condizione (`if`) e un effetto (`then`).

**Anatomia di una definizione JSON** _(stepTitle)_

- `displayName` — nome identificativo della policy (max 128 caratteri).
- `description` — contesto d'uso della policy (max 512 caratteri).
- `policyType` — origine della definizione (sola lettura): `Built-in`, `Custom`, `Static`.
- `mode` — target della policy: `All` (valuta tutti i tipi di risorse) o `Indexed` (valuta solo i tipi che supportano tag e posizione).
- `metadata` — informazioni sulla policy: versione, categoria nel portale, flag preview/deprecated.
- `parameters` — valori configurabili che rendono la definizione riutilizzabile. Tipi supportati: String, Array, Object, Boolean, Integer, Float, DateTime.
- `policyRule` — la regola vera e propria: blocco `if` (condizione) e blocco `then` (effetto).

**Operatori logici nel blocco if** _(stepTitle)_

- `allOf` — equivalente all'AND logico: tutte le condizioni devono essere vere.
- `anyOf` — equivalente all'OR logico: almeno una condizione deve essere vera.
- `not` — inverte il risultato di una condizione.

**Tipi di condizioni** _(stepTitle)_

- **Fields** — valutano le proprietà della risorsa: `name`, `location`, `type`, `tags`, `identity.type`, property aliases.
- **Value** — valutano un valore calcolato tramite funzioni ARM.
- **Count** — contano quanti elementi di un array soddisfano un criterio.

I criteri di valutazione principali: `equals/notEquals`, `like/notLike`, `contains/notContains`, `in/notIn`, `containsKey/notContainsKey`, `exists`, `greater/less/greaterOrEquals/lessOrEquals`.

**Effetti disponibili (blocco then)** _(stepTitle)_

- `Disabled` — disattiva la policy senza rimuoverla. Viene verificato per primo.
- `Deny` — blocca la richiesta se non conforme. Valutazione sincrona.
- `DenyAction` — blocca azioni specifiche su risorse esistenti (attualmente solo DELETE). Valutazione sincrona.
- `Append` — aggiunge campi alla risorsa durante la creazione. Valutazione sincrona.
- `Modify` — aggiunge, aggiorna o rimuove proprietà e tag durante creazione o aggiornamento. Valutazione sincrona.
- `Audit` — crea un evento di avviso nel log attività senza bloccare la richiesta. Valutazione asincrona.
- `AuditIfNotExists` — segnala se una risorsa correlata non esiste. Valutazione asincrona.
- `DeployIfNotExists` — distribuisce automaticamente una risorsa mancante per rimediare la non conformità. Valutazione asincrona.
- `Manual` — consente di attestare manualmente la conformità tramite attestazioni personalizzate. Non intercambiabile con altri effetti.

> **Effetti intercambiabili**: `audit`, `deny` e `modify/append` sono spesso intercambiabili tra loro. `auditIfNotExists` e `deployIfNotExists` sono spesso intercambiabili. `disabled` è intercambiabile con qualsiasi effetto. `manual` non è intercambiabile.
_(infoBox)_

**Cumulative most restrictive** _(stepTitle)_

Più policy possono essere assegnate alla stessa risorsa. Ogni policy viene valutata in modo indipendente. Il risultato finale è il **cumulative most restrictive**: se una policy `Deny` e una policy `Audit` si applicano alla stessa risorsa, prevale il `Deny`.

La seguente definizione built-in limita le aree geografiche in cui è possibile distribuire risorse:

    {
      "displayName": "Allowed locations",
      "policyType": "BuiltIn",
      "mode": "Indexed",
      "parameters": {
        "listOfAllowedLocations": {
          "type": "Array",
          "metadata": { "strongType": "location", "displayName": "Allowed locations" }
        }
      },
      "policyRule": {
        "if": {
          "allOf": [
            { "field": "location", "notEquals": "global" },
            { "field": "type", "notEquals": "Microsoft.AzureActiveDirectory/b2cDirectories" }
          ]
        },
        "then": { "effect": "deny" }
      }
    }


### 2.4.6 — Valutazione delle risorse tramite Azure Policy
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

**Trigger di valutazione** _(stepTitle)_

La valutazione delle policy assegnate avviene in risposta a diversi eventi:

- Una policy o iniziativa viene assegnata per la prima volta a un ambito.
- Una policy o iniziativa già assegnata viene aggiornata.
- Una risorsa viene creata o aggiornata nell'ambito tramite ARM, REST API o SDK.
- Una sottoscrizione viene creata o spostata in una gerarchia di Management Group con policy assegnate.
- Ciclo standard di valutazione della conformità (ogni 24 ore).
- Scansione on-demand avviata manualmente: `az policy state trigger-scan`.

**Tempi e fattori che influenzano la scansione** _(stepTitle)_

Quando si assegna una nuova policy, può esserci un ritardo fino a 30 minuti prima che entri in vigore, dovuto alla cache di ARM. I fattori che influenzano la durata di una scansione sono: dimensione e complessità delle definizioni, numero di policy applicate, dimensione dell'ambito e carico di sistema.

**Stati di conformità delle risorse** _(stepTitle)_

Dopo la valutazione, Azure Policy assegna uno dei seguenti stati a ogni risorsa:

- **Compliant** — la risorsa rispetta tutte le condizioni della policy.
- **Non-compliant** — la risorsa non rispetta una o più condizioni.
- **Error** — errore nel template o nella valutazione della policy.
- **Conflicting** — due o più policy hanno regole contraddittorie.
- **Protected** — la risorsa è coperta da un'assegnazione con effetto `denyAction`.
- **Exempted** — la risorsa è esclusa dalla valutazione tramite un'esenzione.
- **Unknown** — stato predefinito per le definizioni con effetto `manual`, in attesa di attestazione.

La percentuale di conformità si calcola dividendo le risorse `Compliant + Exempt + Unknown` per il totale delle risorse.

**EnforcementMode — modalità What-If** _(stepTitle)_

L'`enforcementMode` è una proprietà dell'assegnazione che permette di disattivare l'applicazione dell'effetto mantenendo attiva la valutazione. Diverso dall'effetto `disabled`:

- `disabled` impedisce la valutazione del tutto.
- `enforcementMode = DoNotEnforce` permette la valutazione senza applicare l'effetto. Nessuna voce viene scritta nell'Activity Log. I remediation task per `deployIfNotExists` possono essere avviati anche con `DoNotEnforce`.

**Safe deployment best practices** _(stepTitle)_

- **Iniziare con enforcementMode Disabled** — assegnare la policy in modalità what-if per osservare la conformità senza bloccare operazioni.
- **Deployment rings** — distribuire le policy gradualmente: prima ambienti di test/sviluppo, poi produzione in subset crescenti.

> **Conformità vs Applicazione**: Una policy con effetto `Audit` non impedisce la creazione di risorse non conformi — le segnala soltanto. Solo il `Deny` blocca attivamente.
_(infoBox)_

---

## 2.5 — Proteggere le risorse con Azure RBAC
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.5.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

La gestione degli accessi alle risorse cloud è una funzione fondamentale per qualsiasi organizzazione. Azure RBAC (Role-Based Access Control) risolve due problemi chiave: garantire che gli utenti perdano l'accesso alle risorse quando lasciano l'organizzazione, e trovare il giusto equilibrio tra autonomia dei team e governance centrale.


### 2.5.2 — Che cos'è Azure RBAC?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Azure RBAC è un sistema di autorizzazione basato su Azure Resource Manager che offre una gestione degli accessi con granularità fine alle risorse Azure. Permette di concedere agli utenti esattamente il tipo di accesso di cui hanno bisogno — niente di più, niente di meno.

Ogni sottoscrizione Azure è associata a una singola directory Microsoft Entra. Quando un account AD on-premise viene disabilitato tramite Entra Connect, perde automaticamente l'accesso a tutte le sottoscrizioni Azure collegate.

![Figura 26](img/rbac-roles-hierarchy.png) _(dimensioni: 895×598 px)_

*Figura 26 — Relazione tra ruoli di Azure AD, ruoli di Azure e ruoli di amministratore della sottoscrizione classica nella gerarchia Management Group → Sottoscrizione → Gruppo di risorse → Risorsa.* _(caption)_


**I tre elementi di un'assegnazione di ruolo** _(stepTitle)_

Per creare un'assegnazione di ruolo servono tre elementi — chi, cosa e dove:

- **Entità di sicurezza (chi)** — l'oggetto a cui si concede l'accesso: utente, gruppo, entità servizio o identità gestita.

![Figura 24](img/rbac-security-principal.png) _(dimensioni: 357×134 px)_

*Figura 24 — Entità di sicurezza: utente, gruppo ed entità servizio.* _(caption)_

- **Definizione del ruolo (cosa)** — raccolta di autorizzazioni che definisce cosa si può fare. Può essere un ruolo predefinito o personalizzato.

![Figura 25](img/rbac-role-definition.png) _(dimensioni: 537×352 px)_

*Figura 25 — Definizione del ruolo: elenco dei ruoli predefiniti e personalizzati con dettaglio del ruolo Collaboratore.* _(caption)_

- **Ambito (dove)** — il livello a cui si applica l'accesso: gruppo di gestione, sottoscrizione, gruppo di risorse o risorsa singola. Gli ambiti figlio ereditano automaticamente i ruoli assegnati all'ambito padre.

> **Assegnazione di ruolo**: Un'assegnazione di ruolo è il collegamento tra entità di sicurezza, definizione del ruolo e ambito. Per concedere l'accesso si crea un'assegnazione; per revocarlo si rimuove.
_(infoBox)_


**I 4 ruoli predefiniti fondamentali** _(stepTitle)_

- **Proprietario** — accesso completo a tutte le risorse, incluso il diritto di delegare l'accesso ad altri.
- **Collaboratore** — può creare e gestire tutti i tipi di risorse Azure, ma non può concedere l'accesso ad altri.
- **Lettore** — può solo visualizzare le risorse Azure esistenti, nessuna modifica.
- **Amministratore Accesso Utenti** — gestisce gli accessi utente alle risorse Azure, ma non può gestire le risorse stesse.

Se i ruoli predefiniti non coprono le esigenze specifiche è possibile creare ruoli personalizzati.

**Actions, NotActions e autorizzazioni effettive** _(stepTitle)_

Azure RBAC è un modello additivo: le assegnazioni di ruolo si sommano. Se hai lettura da un ruolo e scrittura da un altro, avrai entrambe. La definizione di ruolo usa due proprietà chiave:

- `Actions` — operazioni consentite. Il carattere jolly `(*)` indica tutte le operazioni sul piano di controllo.
- `NotActions` — operazioni da sottrarre dalle Actions. Le autorizzazioni effettive si calcolano come: `Actions − NotActions = Autorizzazioni effettive`.

Esempio: il ruolo Collaboratore ha `(*)` in Actions ma in NotActions esclude la gestione di ruoli e assegnazioni — pur potendo fare tutto il resto.

**RBAC nel portale Azure** _(stepTitle)_

In ogni risorsa, gruppo di risorse o sottoscrizione è presente il riquadro **Controllo di accesso (IAM)**. Da qui è possibile visualizzare chi ha accesso e con quale ruolo, aggiungere o rimuovere assegnazioni di ruolo, e verificare i propri permessi effettivi.

![Figura 27](img/rbac-iam-portal.png) _(dimensioni: 1069×708 px)_

*Figura 27 — Riquadro Controllo di accesso (IAM) nel portale Azure: scheda Assegnazioni di ruolo con utenti, gruppi, service principal e managed identity con i relativi ruoli e ambiti.* _(caption)_

**Scenari pratici di utilizzo** _(stepTitle)_

- Consentire a un utente di gestire le macchine virtuali in una sottoscrizione e a un altro di gestire le reti virtuali nella stessa sottoscrizione.
- Consentire a un gruppo di amministratori di database di gestire i database SQL in una sottoscrizione.
- Consentire a un utente di gestire tutte le risorse in un gruppo di risorse — VM, siti Web, subnet.
- Consentire a un'applicazione di accedere a tutte le risorse in un gruppo di risorse.

> **RBAC vs Azure Policy**: RBAC controlla chi può fare cosa sulle risorse (autorizzazione). Azure Policy controlla come devono essere configurate le risorse (governance). RBAC può permettere a un utente di creare una VM, ma Azure Policy può impedire che venga creata in una regione non consentita.
_(infoBox)_

---

## 2.6 — Reimpostazione della password self-service (SSPR)
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 2.6.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

La reimpostazione della password self-service (SSPR) di Microsoft Entra consente agli utenti di cambiare o reimpostare la propria password senza intervento dell'amministratore o dell'help desk. Riduce le chiamate all'help desk e la perdita di produttività.


### 2.6.2 — Che cos'è la reimpostazione autonoma della password in Microsoft Entra ID?
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

**Perché usare SSPR** _(stepTitle)_

In Microsoft Entra ID qualsiasi utente che abbia già eseguito l'accesso può modificare la password in autonomia. Se invece non ha mai eseguito l'accesso, la password è dimenticata, scaduta o bloccata, deve poterla reimpostare senza dover chiamare il supporto. SSPR riduce il carico degli amministratori e consente agli utenti di sbloccarsi da qualsiasi browser o dalla schermata di accesso Windows.

**I 5 step del processo SSPR** _(stepTitle)_

- 1. **Localizzazione** — il portale rileva le impostazioni locali del browser e mostra la pagina nella lingua appropriata.
- 2. **Verifica** — l'utente immette il proprio nome utente e supera un test CAPTCHA.
- 3. **Autenticazione** — l'utente immette i dati del metodo di autenticazione registrato (codice app, email, SMS, ecc.).
- 4. **Reimpostazione della password** — se l'autenticazione ha successo, l'utente imposta la nuova password.
- 5. **Notifica** — viene inviata una notifica all'utente per confermare la reimpostazione.

**Metodi di autenticazione supportati** _(stepTitle)_

Prima di usare SSPR, ogni utente deve registrare almeno un metodo di autenticazione. È consigliabile registrarne due per maggiore flessibilità. I metodi disponibili sono:

- **Notifica dell'app per dispositivi mobili** (Microsoft Authenticator) — Azure invia una notifica all'app che l'utente conferma o rifiuta.
- **Codice app per dispositivi mobili** — l'utente immette il codice OTP generato dall'app Authenticator.
- **Email** — Azure invia un codice OTP all'indirizzo email esterno ad Azure registrato.
- **Telefono cellulare** — Azure invia un SMS con codice OTP; è possibile anche scegliere la chiamata automatica.
- **Telefono ufficio** — si riceve una chiamata automatica, si preme il tasto #.

> **Numero di metodi richiesti**: L'amministratore può configurare se richiedere 1 o 2 metodi per la reimpostazione. Se si passa da 1 a 2 metodi, gli utenti che hanno registrato solo 1 metodo non possono più usare SSPR finché non ne registrano un secondo.
_(infoBox)_

**Consigli pratici sui metodi** _(stepTitle)_

- Abilitare due o più metodi di autenticazione per la reimpostazione.
- Usare la notifica dell'app per dispositivi mobili come metodo primario.
- Il metodo SMS non è consigliato perché è possibile inviare messaggi SMS fraudolenti.
- Le domande di sicurezza sono il metodo meno consigliato — le risposte possono essere note ad altre persone.

**Account associati a ruoli di amministratore** _(stepTitle)_

- Gli account con ruolo di amministratore hanno sempre applicati i criteri a due metodi, indipendentemente dalla configurazione per gli altri utenti.
- Il metodo delle domande di sicurezza non è disponibile per gli account con ruolo di amministratore.

**Requisiti di licenza** _(stepTitle)_

- **Modifica della password** (utente già connesso) — disponibile con qualsiasi edizione di Entra ID, inclusa quella gratuita.
- **Reimpostazione della password dimenticata o scaduta** — richiede Entra ID P1, P2, Microsoft 365 Apps for Business o Microsoft 365.
- **Writeback in ambienti ibridi** — richiede Entra ID P1 o P2. Disponibile anche con Microsoft 365 Apps per le aziende.

**Opzioni di distribuzione** _(stepTitle)_

Il writeback delle password può essere distribuito tramite Microsoft Entra Connect o tramite la sincronizzazione cloud. Le due opzioni possono coesistere side-by-side per set diversi di utenti.

> **Sincronizzazione cloud vs Entra Connect**: La sincronizzazione cloud offre alta disponibilità maggiore perché non si basa su una singola istanza di Microsoft Entra Connect. È la scelta consigliata per i nuovi deployment ibridi.
_(infoBox)_


### 2.6.3 — Implementare la reimpostazione della password self-service
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

**Abilitare SSPR nel portale Azure** _(stepTitle)_

- Portale Azure → Microsoft Entra ID → Sicurezza → Reimpostazione password self-service.
- Scegliere l'ambito: Nessuno (disabilitato), Selezionati (gruppi specifici) o Tutti.
- Configurare i metodi di autenticazione: quanti richiesti (1 o 2) e quali abilitare.
- Configurare le notifiche e le personalizzazioni (logo aziendale, link al supporto).

**Integrazione con ambienti ibridi — Password Writeback** _(stepTitle)_

In ambienti ibridi con AD DS on-premise, il writeback delle password permette di sincronizzare le reimpostazioni da Entra ID verso la directory locale. Senza writeback, gli utenti sincronizzati non possono reimpostare la password tramite SSPR.

- **Writeback abilitato** — utenti federati, con autenticazione pass-through o con hash delle password sincronizzato possono reimpostare la password.
- **Writeback disabilitato** — questi utenti non possono usare SSPR e devono contattare l'amministratore.
- È possibile separare sblocco account e reimpostazione password.

**SSPR per utenti B2B** _(stepTitle)_

La reimpostazione della password è supportata per tutte le configurazioni B2B:

- Utenti guest con tenant Entra ID — il reset segue la policy del tenant del partner.
- Utenti B2B invitati tramite Entra B2B — possono reimpostare la password con l'email registrata durante l'invito.

> **Limitazione importante**: Gli account Microsoft personali (Hotmail, Outlook.com, ecc.) invitati come guest non possono usare SSPR di Microsoft Entra — devono usare il portale di recupero account Microsoft.
_(infoBox)_
