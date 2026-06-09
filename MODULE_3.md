# Modulo 3 — Configurare e gestire reti virtuali per amministratori di Azure

_Questo percorso copre la progettazione e la gestione dell'infrastruttura di rete in Azure.
Una rete ben configurata garantisce connettività sicura, isolamento delle risorse e prestazioni ottimali._

**Immagini usate in questo modulo:**
- `img/ip-addressing.png` (850×138) — Figura 28
- `img/nsg-portal.png` (861×191) — Figura 29
- `img/nsg-inbound-rules.png` (858×247) — Figura 30
- `img/nsg-outbound-rules.png` (858×236) — Figura 31
- `img/nsg-multiple.png` (650×478) — Figura 32
- `img/nsg-effective-rules.png` (859×65) — Figura 33
- `img/asg-diagram.png` (320×274) — Figura 34

**Tabelle generate da codice:**
- `reservedTable()` — Tabella 3: Indirizzi riservati per subnet
- `publicIpAssocTable()` — Tabella 4: Associazione IP pubblici per tipo di risorsa
- `publicIpSkuTable()` — Tabella 5: Funzionalità SKU Standard IP pubblici
- `privateIpTable()` — Tabella 6: Risorse Azure che supportano IP privati
- `nsgRuleSettingsTable()` — Tabella 7: Impostazioni configurabili per una regola NSG

---

## 3.1 — Configurare reti virtuali
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 3.1.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Le reti virtuali di Azure (VNet) sono il blocco fondamentale della rete privata in Azure. Consentono a molti tipi di risorse Azure di comunicare in modo sicuro tra loro, con Internet e con le reti locali on-premise. Una VNet è simile a una rete tradizionale operata in un datacenter fisico, ma offre i vantaggi aggiuntivi dell'infrastruttura cloud: scalabilità, disponibilità e isolamento.


### 3.1.2 — Pianificare le reti virtuali
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Prima di creare una VNet è necessario pianificarne attentamente la struttura. Ogni VNet ha uno spazio di indirizzi IP definito in notazione CIDR (es. `10.0.0.0/16`) che non può sovrapporsi con altri spazi di indirizzi nella stessa rete o con reti on-premise collegate.

**Scenari di utilizzo delle reti virtuali** _(stepTitle)_

- **Rete virtuale dedicata al cloud privato** — quando non è necessaria una configurazione cross-premise, i servizi e le VM nella VNet comunicano direttamente e in modo sicuro tra loro.
- **Estensione sicura del data center** — è possibile creare VPN site-to-site per ridimensionare in modo sicuro la capacità del data center. Le VPN site-to-site usano IPSec per fornire una connessione sicura tra il gateway VPN aziendale e Azure.
- **Scenari cloud ibridi** — le VNet offrono la flessibilità per connettere applicazioni cloud a qualsiasi tipo di sistema locale, inclusi mainframe e sistemi Unix, quando i blocchi CIDR delle reti non si sovrappongono.

**Considerazioni di progettazione** _(stepTitle)_

- Assicurarsi che lo spazio di indirizzi non si sovrapponga ad altri intervalli di rete dell'organizzazione.
- Azure riserva 5 indirizzi IP in ogni subnet: i primi 4 e l'ultimo.
- Una VNet appartiene a una sola regione Azure e a una sola sottoscrizione.
- Più VNet possono essere collegate tramite VNet Peering per comunicare tra loro.
- I DNS possono essere configurati a livello di VNet: si può usare il DNS di Azure (`168.63.129.16`) o DNS personalizzati.

> **Spazio di indirizzi privati**: Azure supporta gli spazi di indirizzi privati RFC 1918: `10.0.0.0/8`, `172.16.0.0/12` e `192.168.0.0/16`. È consigliabile usare questi range per le VNet aziendali.
_(infoBox)_

**Capire la notazione CIDR** _(stepTitle)_

Un indirizzo IPv4 è composto da 32 bit totali, scritti in 4 gruppi da 8 bit (es. `10.0.0.0`). Il numero dopo lo slash (`/`) indica quanti bit sono fissi per identificare la rete — i restanti bit sono liberi e identificano i singoli host.

- `10.0.0.0/16` → 16 bit fissi (10.0), 16 bit liberi → 2¹⁶ = 65.536 indirizzi, da 10.0.0.0 a 10.0.255.255
- `10.0.0.0/24` → 24 bit fissi (10.0.0), 8 bit liberi → 2⁸ = 256 indirizzi, da 10.0.0.0 a 10.0.0.255
- `10.0.0.0/28` → 28 bit fissi, 4 bit liberi → 2⁴ = 16 indirizzi

La formula generale è: `indirizzi disponibili = 2^(32 − prefisso)`. Più piccolo è il valore dopo lo `/`, più grande è la rete. I multipli di 8 (`/8`, `/16`, `/24`) sono i più comuni perché coincidono con i confini degli ottetti, ma valori come `/20`, `/22`, `/26` sono perfettamente validi.

> **Limite Azure per le subnet**: Azure riserva sempre 5 indirizzi per ogni subnet (i primi 4 e l'ultimo). Per questo il prefisso minimo consigliato per una subnet è `/28`, che garantisce 16 − 5 = 11 indirizzi utilizzabili.
_(infoBox)_


### 3.1.3 — Creare subnet
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Una subnet è una suddivisione dello spazio di indirizzi della VNet. Permette di segmentare la rete in sezioni più piccole per organizzare le risorse, migliorare la sicurezza, le prestazioni e semplificare la gestione. Ogni risorsa Azure in una VNet deve essere collocata in una subnet.

**Indirizzi riservati per ogni subnet** _(stepTitle)_

Per ogni subnet Azure riserva sempre 5 indirizzi IP che non possono essere assegnati alle risorse. Esempio con `192.168.1.0/24`:

[TABELLA: reservedTable] _(tabella generata da codice)_

*Tabella 3 — I 5 indirizzi riservati da Azure in ogni subnet (esempio con 192.168.1.0/24).* _(caption)_

**Considerazioni di progettazione** _(stepTitle)_

- Ogni subnet deve avere un intervallo CIDR univoco che rientra nello spazio di indirizzi della VNet padre.
- Gli intervalli delle subnet non possono sovrapporsi tra loro all'interno della stessa VNet.
- Alcune subnet speciali sono richieste da determinati servizi Azure: `GatewaySubnet` (per i gateway VPN/ExpressRoute), `AzureFirewallSubnet`, `AzureBastionSubnet`.
- **Appliance virtuali di rete (NVA)** — per default Azure instrada il traffico tra tutte le subnet della stessa VNet automaticamente. Se si vuole che il traffico passi attraverso una NVA (firewall virtuale, load balancer), le risorse devono essere collocate in subnet separate con routing personalizzato tramite Route Table.
- **Network Security Group (NSG)** — è possibile associare zero o un NSG a ogni subnet per filtrare il traffico in entrata e in uscita. Lo stesso NSG può essere associato a più subnet.
- **Azure Private Link** — permette connettività privata da una VNet a servizi PaaS (Storage, SQL, Key Vault, ecc.) senza esporre il traffico a Internet pubblico.


### 3.1.4 — Creare reti virtuali
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Una VNet può essere creata tramite il portale Azure, Azure CLI, PowerShell o template ARM. I parametri fondamentali sono il nome, la regione, la sottoscrizione, il gruppo di risorse e lo spazio di indirizzi.

**Creazione tramite Azure CLI** _(stepTitle)_

    az network vnet create \
      --resource-group rsg-1 \
      --name MyVNet \
      --address-prefix 10.0.0.0/16 \
      --subnet-name MySubnet \
      --subnet-prefix 10.0.0.0/24


### 3.1.5 — Pianificare l'indirizzamento IP
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

In Azure gli indirizzi IP possono essere pubblici o privati, e assegnati in modo statico o dinamico.

![Figura 28](img/ip-addressing.png) _(dimensioni: 850×138 px)_

*Figura 28 — Una risorsa Azure con indirizzo IP privato (comunicazione con VNet, reti locali, VPN Gateway, ExpressRoute) e indirizzo IP pubblico (comunicazione con Internet e servizi pubblici).* _(caption)_

**Indirizzi IP pubblici** _(stepTitle)_

- **Dinamici** — assegnati quando la risorsa viene avviata e rilasciati quando viene arrestata. L'indirizzo può cambiare a ogni riavvio.
- **Statici** — rimangono assegnati finché la risorsa esiste, indipendentemente dallo stato. Necessari per DNS, certificati TLS, firewall e scenari che richiedono un IP fisso.
- **SKU Basic** — supporta assegnazione dinamica e statica, non è ridondante per zona.
- **SKU Standard** — supporta solo assegnazione statica, è ridondante per zona per default, richiede NSG esplicito. Raccomandato per nuovi deployment.

**Indirizzi IP privati** _(stepTitle)_

- **Dinamici** — assegnati tramite DHCP dall'intervallo della subnet. Possono cambiare se la risorsa viene riallocata.
- **Statici** — l'amministratore specifica un indirizzo fisso nell'intervallo della subnet. Usati per DNS server, domain controller, firewall, database.

**Quando usare indirizzi IP statici** _(stepTitle)_

Gli IP statici sono necessari in questi scenari specifici:

- **Risoluzione dei nomi DNS** — una modifica dell'indirizzo IP richiederebbe l'aggiornamento manuale dei record host.
- **Modelli di sicurezza basati su IP** — app o servizi che devono essere sempre raggiungibili allo stesso indirizzo.
- **Certificati TLS/SSL** — i certificati sono spesso collegati a un indirizzo IP specifico.
- **Regole del firewall** — le regole che permettono o negano traffico in base a intervalli IP richiedono indirizzi stabili.
- **VM basate su ruolo** — controller di dominio, server DNS e altri server di infrastruttura devono avere sempre lo stesso indirizzo.

> **Best practice**: Usare indirizzi statici per tutte le risorse che fungono da server o che vengono referenziate da altri servizi tramite IP. Usare dinamici per VM client e workload temporanei.
_(infoBox)_


### 3.1.6 — Creare indirizzi IP pubblici
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Un indirizzo IP pubblico è una risorsa autonoma in Azure che può essere associata a vari tipi di risorse: VM, load balancer, gateway VPN, firewall. Si crea separatamente dalla risorsa a cui viene associato.

**Impostazioni da configurare alla creazione** _(stepTitle)_

- **Versione IP** — IPv4, IPv6 o dual-stack (entrambi). IPv4 e IPv6 vengono addebitati alla stessa tariffa.
- **SKU** — Basic o Standard. Lo SKU dell'IP pubblico deve corrispondere allo SKU del load balancer con cui viene usato. Raccomandato Standard per i nuovi deployment.
- **Livello (Tier)** — Regional (default) o Global. Un IP Global è usato con un bilanciatore di carico interregionale. Il livello dell'IP deve corrispondere al livello del load balancer associato.
- **Assegnazione** — Statica o Dinamica. Gli IP statici vengono assegnati al momento della creazione della risorsa IP pubblica e non vengono rilasciati finché la risorsa IP non viene eliminata esplicitamente.

**Note operative** _(stepTitle)_

- Gli IP pubblici Standard sono ridondanti per zona per default e supportano scenari di alta disponibilità.
- Un IP pubblico non associato ad alcuna risorsa genera comunque un costo.


### 3.1.7 — Associare indirizzi IP pubblici
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Un indirizzo IP pubblico può essere associato a diverse risorse Azure. Il punto di configurazione varia a seconda del tipo di risorsa:

[TABELLA: publicIpAssocTable] _(tabella generata da codice)_

*Tabella 4 — Come associare un IP pubblico in base al tipo di risorsa Azure.* _(caption)_

**Funzionalità dello SKU Standard** _(stepTitle)_

[TABELLA: publicIpSkuTable] _(tabella generata da codice)_

*Tabella 5 — Funzionalità dello SKU Standard per gli indirizzi IP pubblici.* _(caption)_


### 3.1.8 — Allocare o assegnare indirizzi IP privati
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Gli indirizzi IP privati vengono assegnati alle risorse che risiedono all'interno di una VNet. Le risorse con IP privato possono comunicare con altre risorse nella stessa VNet, con reti collegate tramite peering e con reti on-premise tramite VPN o ExpressRoute.

**Risorse che supportano IP privati** _(stepTitle)_

[TABELLA: privateIpTable] _(tabella generata da codice)_

*Tabella 6 — Risorse Azure che supportano indirizzi IP privati e modalità di assegnazione.* _(caption)_

**Metodi di assegnazione** _(stepTitle)_

- **Dinamico** — Azure assegna il prossimo indirizzo disponibile non assegnato o non riservato nell'intervallo della subnet. È il metodo predefinito. Esempio: se `10.0.0.4–10.0.0.9` sono già assegnati, Azure assegna `10.0.0.10` alla nuova risorsa.
- **Statico** — l'amministratore sceglie un indirizzo specifico disponibile nell'intervallo della subnet.

L'assegnazione statica è consigliata per: server DNS, domain controller, database, firewall e qualsiasi risorsa referenziata da altri servizi tramite IP fisso.

---

## 3.2 — Configurare i gruppi di sicurezza di rete
_(h2: Calibri 14pt grassetto #0078D4 keepNext)_


### 3.2.1 — Introduzione
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Un gruppo di sicurezza di rete (NSG) è un filtro del traffico di rete che consente o nega il traffico verso le risorse Azure. Ogni NSG contiene regole di sicurezza che valutano il traffico in entrata (inbound) e in uscita (outbound) in base a: protocollo, porta, indirizzo IP di origine e di destinazione. Un NSG può essere associato a una subnet, a una NIC o a entrambe.


### 3.2.2 — Implementare i gruppi di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Gli NSG operano a livello di subnet e/o di interfaccia di rete (NIC). Possono essere associati a più subnet e NIC, ma una subnet o NIC può essere associata a un solo NSG alla volta.

**Come funzionano gli NSG** _(stepTitle)_

- **Traffico in entrata** — Azure valuta prima le regole dell'NSG associato alla subnet, poi quelle dell'NSG associato alla NIC.
- **Traffico in uscita** — Azure valuta prima le regole dell'NSG associato alla NIC, poi quelle dell'NSG associato alla subnet.
- Se nessun NSG è associato, tutto il traffico è consentito tra le risorse nella stessa VNet.
- Un NSG è una risorsa autonoma che può essere creata indipendentemente dalle subnet o NIC a cui verrà associato.

**NSG e subnet — zona DMZ** _(stepTitle)_

Assegnando un NSG a una subnet si crea una subnet protetta, detta anche zona demilitarizzata (DMZ). La DMZ funge da buffer tra le risorse interne alla VNet e Internet, consentendo solo il traffico esplicitamente autorizzato. Ogni subnet può avere al massimo un NSG associato.

**NSG e interfacce di rete** _(stepTitle)_

È possibile assegnare un NSG anche direttamente a una NIC per controllare tutto il traffico che transita attraverso quell'interfaccia. La pagina Panoramica di una VM nel portale mostra tutti gli NSG associati, le subnet e le NIC assegnate e le regole di sicurezza definite.

![Figura 29](img/nsg-portal.png) _(dimensioni: 861×191 px)_

*Figura 29 — Panoramica di un NSG nel portale Azure: gruppo di risorse, località, subnet e interfacce di rete associati, regole personalizzate in entrata e in uscita.* _(caption)_

> **Best practice**: Associare NSG a livello di subnet anziché di singola NIC per una gestione più semplice e scalabile. Usare gli NSG a livello di NIC solo per casi eccezionali che richiedono regole differenziate per VM nella stessa subnet.
_(infoBox)_


### 3.2.3 — Determinare le regole dei gruppi di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Ogni NSG contiene un insieme di regole di sicurezza predefinite che non possono essere eliminate, ma possono essere sostituite da regole personalizzate con priorità più alta. Ogni regola è definita da:

- **Nome** — identificatore univoco della regola nell'NSG.
- **Priorità** — numero tra 100 e 4096. Le regole vengono elaborate in ordine crescente di priorità. Una volta trovata una corrispondenza, l'elaborazione si ferma.
- **Origine/Destinazione** — indirizzo IP, intervallo CIDR, tag di servizio o gruppo di sicurezza delle applicazioni (ASG).
- **Protocollo** — TCP, UDP, ICMP, ESP, AH o Any.
- **Direzione** — Inbound o Outbound.
- **Intervallo di porte** — porta singola (es. 80), intervallo (es. 8080-8090) o wildcard (`*`).
- **Azione** — Allow o Deny.

> **Comportamento predefinito degli NSG**: Le regole predefinite negano tutto il traffico in entrata ad eccezione di quello proveniente dalla VNet e dal load balancer Azure. In uscita, consentono tutto il traffico verso la VNet e verso Internet. Qualsiasi traffico non coperto da una regola esplicita viene negato dalla regola DenyAll finale.
_(infoBox)_

**Tabella impostazioni configurabili per una regola** _(stepTitle)_

[TABELLA: nsgRuleSettingsTable] _(tabella generata da codice)_

*Tabella 7 — Impostazioni configurabili per una regola di sicurezza NSG.* _(caption)_

**Regole predefinite inbound** _(stepTitle)_

![Figura 30](img/nsg-inbound-rules.png) _(dimensioni: 858×247 px)_

*Figura 30 — Regole di sicurezza in ingresso predefinite: AllowVnetInBound (65000), AllowAzureLoadBalancerInBound (65001), DenyAllInBound (65500).* _(caption)_

**Regole predefinite outbound** _(stepTitle)_

![Figura 31](img/nsg-outbound-rules.png) _(dimensioni: 858×236 px)_

*Figura 31 — Regole di sicurezza in uscita predefinite: AllowVnetOutBound (65000), AllowInternetOutBound (65001), DenyAllOutBound (65500).* _(caption)_


### 3.2.4 — Determinare le regole effettive dei gruppi di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Ogni NSG e le sue regole vengono valutati in modo indipendente. Azure elabora le condizioni di ogni regola per ogni VM nella configurazione.

- **Traffico in entrata** — Azure elabora prima le regole dell'NSG della subnet, poi quelle dell'NSG della NIC.
- **Traffico in uscita** — Azure elabora prima le regole dell'NSG della NIC, poi quelle dell'NSG della subnet.
- Azure considera anche il traffico intra-subnet: le regole dell'NSG associato a una subnet possono influire sul traffico tra VM nella stessa subnet.

![Figura 32](img/nsg-multiple.png) _(dimensioni: 650×478 px)_

*Figura 32 — Due NSG applicati a una subnet: NSG1 associato alla NIC di VM1 e NSG2 associato alla subnet. Ogni NSG viene valutato in modo indipendente per determinare le regole effettive.* _(caption)_

**Considerazioni per regole efficaci** _(stepTitle)_

- **Consentire tutto il traffico** — se non è necessario regolare il traffico verso una risorsa a un determinato livello, non associare un NSG a quel livello.
- **Importanza delle regole di autorizzazione** — se un NSG è associato sia alla subnet che alla NIC, occorre definire una regola Allow a entrambi i livelli. Se manca la regola Allow a uno dei livelli, il traffico viene bloccato.
- **Traffico intra-subnet** — le regole NSG della subnet si applicano anche al traffico tra VM nella stessa subnet.
- **Priorità delle regole** — assegnare valori di priorità con intervalli (100, 200, 300, ecc.) per poter inserire nuove regole in futuro senza dover rinumerare quelle esistenti.

**Visualizzare le regole di sicurezza effettive** _(stepTitle)_

Se sono presenti più NSG e non si è certi delle regole applicate, è possibile usare il collegamento **Regole di sicurezza valide** nel portale Azure. Si trova nella pagina della VM → Rete → Regole di sicurezza valide.

![Figura 33](img/nsg-effective-rules.png) _(dimensioni: 859×65 px)_

> **Network Watcher**: Azure Network Watcher offre una visualizzazione consolidata delle regole NSG. La funzionalità **IP Flow Verify** valuta il traffico rispetto alle regole effettive e indica se una connessione specifica verrebbe consentita o negata.
_(infoBox)_


### 3.2.5 — Creare regole del gruppo di sicurezza di rete
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

Le regole NSG si creano dal portale Azure, PowerShell, CLI o template ARM. Ogni regola usa un approccio a 5 tuple per valutare il traffico: IP sorgente, porta sorgente, IP destinazione, porta destinazione e protocollo.

**Gli NSG sono stateful** _(stepTitle)_

Gli NSG sono dispositivi stateful: tengono traccia delle connessioni attive tramite flow record. Questo significa che se si crea una regola outbound sulla porta 80, non è necessario creare una regola inbound separata per il traffico di risposta — viene automaticamente consentito come parte della connessione stabilita.

> **Stateful vs Stateless**: Un firewall stateful ricorda le connessioni aperte. Un firewall stateless valuta ogni pacchetto in modo indipendente. Gli NSG Azure sono stateful — la risposta a una connessione consentita è sempre permessa, senza dover scrivere regole bidirezionali.
_(infoBox)_

**Creazione di regole — considerazioni** _(stepTitle)_

- Le regole con priorità più bassa (numero più piccolo) vengono elaborate prima e hanno precedenza.
- Non è possibile creare due regole con la stessa priorità nella stessa direzione.
- Usare il campo Servizio per selezionare protocolli predefiniti come RDP, SSH, HTTPS, oppure specificare porte personalizzate.
- Esempio — consentire traffico RDP (porta 3389) da un IP specifico: priorità 300, TCP, source `203.0.113.10`, dest `*`, porta 3389, Allow.
- Esempio — bloccare tutto il traffico HTTP in entrata: priorità 400, TCP, source `*`, dest `*`, porta 80, Deny.

**Tag di servizio** _(stepTitle)_

I tag di servizio sono identificatori predefiniti che rappresentano gruppi di prefissi IP di servizi Azure. Eliminano la necessità di aggiornare manualmente le regole quando cambiano gli indirizzi IP dei servizi. I più usati:

- `Internet` — tutti gli indirizzi IP pubblici esterni alla VNet.
- `VirtualNetwork` — tutto lo spazio di indirizzi della VNet e delle reti connesse.
- `AzureLoadBalancer` — indirizzo IP virtuale del load balancer Azure (`168.63.129.16`).
- `AzureCloud` — tutti gli indirizzi IP pubblici di Azure, inclusi i datacenter.
- `Storage`, `Sql`, `AzureActiveDirectory` — tag specifici per servizi Azure.

**Regole di sicurezza aumentate** _(stepTitle)_

Una singola regola NSG può contenere più valori nei campi Origine, Destinazione e Servizio:

- **Più indirizzi IP** — combinare più indirizzi IP o intervalli CIDR in una sola regola.
- **Più porte** — specificare più porte e intervalli nel campo Servizio (es. 80, 443, 8080-8090 in un'unica regola).
- **Mix di origine** — combinare tag di servizio, ASG e indirizzi IP all'interno della stessa regola.

> **Esempio pratico**: Invece di creare 4 regole separate per le porte 80, 443, 8080 e 8090, creare una sola regola con tutte le porte nel campo Servizio. In ambienti aziendali, le regole aumentate evitano la proliferazione delle regole NSG.
_(infoBox)_


### 3.2.6 — Implementare gruppi di sicurezza delle applicazioni
_(h3: Calibri 12pt grassetto #2D5F8A keepNext)_

I gruppi di sicurezza delle applicazioni (ASG) permettono di raggruppare le VM in base al ruolo applicativo e usare questi gruppi nelle regole NSG al posto di indirizzi IP specifici. Questo semplifica enormemente la gestione della sicurezza in ambienti con molte VM.

**Come funzionano gli ASG** _(stepTitle)_

- Si crea un ASG (es. `WebServers`, `AppServers`, `DbServers`) e si assegna a ogni NIC delle VM del gruppo.
- Nelle regole NSG si usa il nome dell'ASG come origine o destinazione al posto di indirizzi IP.
- Quando si aggiunge una nuova VM al gruppo, basta associare la NIC all'ASG — le regole NSG si applicano automaticamente senza modifiche.
- Una NIC può essere associata a più ASG. Un ASG può essere usato sia come origine che come destinazione nella stessa regola.

**Scenario di esempio — rivenditore online** _(stepTitle)_

Scenario con due livelli: `WebServers` (gestiscono traffico HTTP/HTTPS da Internet) e `AppLServers` (elaborano richieste SQL dai WebServers).

![Figura 34](img/asg-diagram.png) _(dimensioni: 320×274 px)_

*Figura 34 — ASG applicati a una VNet: Internet accede ai WebServers su porte 80/443; i WebServers accedono agli AppLServers sulla porta SQL 1433.* _(caption)_

La configurazione richiede 3 regole NSG:

- **Regola 1** (priorità 100) — consenti traffico da Internet verso ASG `WebServers` su porte 80 e 443.
- **Regola 2** (priorità 110) — consenti traffico da ASG `WebServers` verso ASG `AppLServers` sulla porta 1433 (SQL).
- **Regola 3** (priorità 120) — nega tutto il traffico verso ASG `AppLServers` su porte 80 e 443. La combinazione di Regola 2 e Regola 3 garantisce che solo i WebServers possano raggiungere i server di database.

**Vantaggi degli ASG** _(stepTitle)_

- **Gestione degli indirizzi IP** — non è necessario specificare IP singoli nelle regole. Se una VM viene sostituita, basta aggiungere la NIC all'ASG senza toccare le regole NSG.
- **Nessun vincolo di subnet** — le VM possono essere organizzate logicamente per applicazione, indipendentemente dalla subnet in cui si trovano.
- **Regole semplificate** — una sola regola NSG copre tutte le VM dell'ASG.
- **Supporto dei carichi di lavoro** — la configurazione rispecchia la struttura applicativa (WebServers, AppServers, DbServers) rendendola più leggibile e manutenibile.

> **ASG vs tag di servizio**: I tag di servizio semplificano la gestione degli indirizzi IP per i servizi Azure gestiti (Storage, SQL, AzureCloud, ecc.). Gli ASG invece raggruppano le VM personalizzate. I due strumenti sono complementari e possono essere usati insieme nella stessa regola NSG.
_(infoBox)_
