# Konsekvensbedömning (DPIA)

**Personuppgiftsansvarig(a):** Kommunstyrelseförvaltningen
**Status:** Risk

## Beskrivning

### Behov och nuläge

Flera parallella initiativ har identifierat behov av bättre intern kunskapshantering (Intern kundtjänst, Helpdesc Soc-IT, KC väg för informationskällor, FAQ upphandling, ChatGPT FEAB). Medarbetare har svårt att hitta intern information och support. Befintliga lösningar (intranät) är mer styrd information från kommunikatörer, men verksamhetsexperter behöver kunna dela lathundar och enklare dokument direkt. Information är utspridd och svår att söka i.

### Lösningsförslag

Open source AI-driven kunskapsportal specialbyggd för svensk kommunal förvaltning. Systemet använder RAG-arkitektur (Retrieval Augmented Generation) där AI-chatbot svarar på frågor baserat på faktiska dokument.

Automatisk dokumentbearbetning med OCR (läser PDF/Office), AI-genererad metadata på svenska, semantisk vektorsökning (Qdrant), och konversationssökning med källhänvisningar. Bygger på Payload CMS, Next.js, PostgreSQL och Google Gemini/OpenAI. Regelefterlevnad inbyggt (GDPR, WCAG 2.1 AA, säkerhetsklassificering).

Utvecklat internt av Utvecklingsavdelningen och nu i test med användargrupp.

Mer information finns i digitaliseringsinitiativet.

## Behov av konsekvensbedömning utifrån dataskyddsförordningen art 35?

Behandlingen uppfyller följande kriterier:

| Kriterium | Uppfylls |
|-----------|----------|
| En systematisk och omfattande bedömning av fysiska personers personliga aspekter som grundar sig på automatisk behandling, inbegripet profilering, och på vilken beslut grundar sig som har rättsliga följder för fysiska personer eller på liknande sätt i betydande grad påverkar fysiska personer. | Nej |
| Behandling i stor omfattning av särskilda kategorier av uppgifter, som avses i artikel 9.1, eller av personuppgifter som rör fällande domar i brottmål och lagöverträdelser som innefattar brott, som avses i artikel 10. (art. 9.1 avser ras eller etniskt ursprung, politiska åsikter, religiös eller filosofisk övertygelse eller medlemskap i fackförening och behandling av genetiska uppgifter, biometriska uppgifter för att entydigt identifiera en fysisk person, uppgifter om hälsa eller uppgifter om en fysisk persons sexualliv eller sexuella läggning.) | Nej |
| Systematisk övervakning av en allmän plats i stor omfattning. | Nej |

## Behov av konsekvensbedömning utifrån IMY:s förteckning?

Behandlingen uppfyller följande kriterier:

| Kriterium | Uppfylls |
|-----------|----------|
| Utvärderar eller poängsätter människor, till exempel ett företag som erbjuder genetiska tester till konsumenter för att bedöma och förutse risker för sjukdomar, ett kreditupplysningsföretag eller ett företag som profilerar internetanvändare. | Nej |
| Behandlar personuppgifter i syfte att fatta automatiserade beslut som har rättsliga följder eller liknande betydande följder för den registrerade. | Nej |
| Systematiskt övervakar människor, till exempel genom kameraövervakning av en allmän plats eller genom att samla in personuppgifter från internetanvändning i offentliga miljöer. | Nej |
| Behandlar känsliga personuppgifter enligt artikel 9 eller uppgifter som är av mycket personlig karaktär, till exempel ett sjukhus som lagrar patientjournaler, ett företag som samlar in lokaliseringsuppgifter eller en bank som hanterar finansiella uppgifter. (Med känsliga uppgifter avses enligt artikel 9 bland annat biometriska uppgifter som behandlas för att entydigt identifiera en fysisk person.) | Nej |
| Behandlar personuppgifter i stor omfattning. | Nej |
| Kombinerar personuppgifter från två eller flera behandlingar på ett sätt som avviker från vad de registrerade rimligen kunnat förvänta sig, till exempel när man samkör register. | Nej |
| Behandlar personuppgifter om personer som av något skäl befinner sig i ett underläge eller i beroendeställning och därför är sårbara, till exempel barn, anställda, asylsökande, äldre och patienter. | **Ja** |
| Använder ny teknik eller nya organisatoriska lösningar, till exempel en sakernas internet-applikation (Internet of things, IoT). | **Ja** |
| Behandlar personuppgifter i syfte att hindra registrerade från att få tillgång till en tjänst eller ingå ett avtal, till exempel när en bank granskar sina kunder mot en databas för kreditupplysning för att besluta om de ska erbjudas lån. | Nej |

## 1. Systematisk beskrivning av behandlingen

Systemet är primärt ett verktyg för dokumenthantering och kunskapsdelning, inte för systematisk personuppgiftsbehandling. Personuppgifter förekommer endast incidentellt i dokumentinnehåll när det är nödvändigt för dokumentets funktion (exempelvis kontaktpersoner i rutiner). Syftet med systemet är inte att samla in, registrera eller förvalta personuppgifter, utan att göra intern dokumentation sökbar och tillgänglig.

### Behandlingens art, omfattning och sammanhang

**Art (kategori av personer):**

*Kategori 1: Systemanvändare (direkt insamling)*
- Redaktörer och administratörer med användarkonton i systemet

*Kategori 2: Personer i dokumentinnehåll (indirekt insamling)*
- Anställda vars namn och kontaktuppgifter förekommer i dokumentinnehåll
- Personer i externa källor (om tillämpligt)

**Omfattning (typ av personuppgifter):**

*För systemanvändare:*
- E-postadress (för inloggning)
- Lösenord (krypterat)
- Roll (redaktör/administratör)
- Tilldelade avdelningar

*För personer i dokumentinnehåll:*
- Namn, befattningar, avdelningar
- Tjänstliga kontaktuppgifter (e-post, telefon)
- Endast informationsklass 0-1 (Öppen och Allmän information)

**Sammanhang:**

*För systemanvändare:*
- Uppgifter samlas in direkt vid kontoskapande
- Lagras internt i systemet för autentisering och åtkomstkontroll
- Skickas ALDRIG till AI-tjänster

*För personer i dokumentinnehåll:*
- Uppgifter samlas in indirekt via dokumentinnehåll (rutiner, lathundar, organisationsdokument)
- Dokument laddas upp av administratörer
- AI-tjänster bearbetar dokumenttext för OCR, textembeddings och chattfunktionalitet

### Syfte och behov

**Syfte:**
Tillhandahålla sökbar kunskapsdatabas för intern information.

**Specifika syften:**

*För systemanvändare:*
- Autentisering och åtkomstkontroll
- Rollbaserad behörighetsstyrning per avdelning

*För dokumentinnehåll:*
- Extrahera text från dokument (OCR)
- Semantisk sökning och AI-assisterad kunskapsåtervinning
- Integrera externa kunskapskällor (om tillämpligt)

**Behov:**
Medarbetare har svårt att hitta utspridd intern information.

### Registrering, åtkomst och lagringsperiod

**När registrering sker:**

*För systemanvändare:*
- Vid kontoskapande av administratör

*För personer i dokumentinnehåll:*
- Vid dokumentuppladdning och publicering

**Åtkomst:**

*För systemanvändare:*
- Systemadministratörer hanterar användarkonton
- Lagras internt i PostgreSQL-databas hos Glesys (Sverige)

*För dokumentinnehåll:*
- Administratörer publicerar och redigerar dokument
- Dokumenttext skickas till AI-tjänster för bearbetning (OCR, embeddings, chat)
- Anställda söker information med hjälp av AI-tjänster

**Lagringsperiod:**

*För systemanvändare:*
- Under anställningstid och enligt arkivlagen

*För dokumentinnehåll:*
- I systemet: Så länge dokumenten är relevanta för verksamheten
- Hos AI-leverantörer: 30-55 dagar (temporär lagring för monitoring), därefter automatisk radering

### Funktionell beskrivning

*Användarhantering:*
- Autentisering via e-post och lösenord
- Rollbaserad åtkomstkontroll (redaktör/administratör)
- Avdelningsbaserad behörighetsstyrning

*Dokumenthantering och AI-funktioner:*
- OCR-extraktion av text från dokument
- Vektorisering för semantisk sökning
- AI-genererad metadata
- Chatbot med RAG-arkitektur för kunskapsåtervinning

### Resurser

**Tekniska system:**
PostgreSQL, Qdrant, Next.js, Payload CMS, Docker.

**Externa AI-tjänster (personuppgiftsbiträden - endast för dokumentinnehåll):**
OpenAI API (textembeddings), Google Vertex AI (chat, OCR, metadata), Mistral AI API (alternativ OCR).

*Notera: Användaruppgifter (e-post, lösenord, roller) skickas aldrig till AI-tjänster. De lagras endast internt hos Glesys.*

**Personal:**
Systemadministratörer (2-3 personer), dataskyddsombud.

**Spridningskanaler:**
Webbaserat system som kräver autentisering via intranätet.

## 2.1 Behovet av behandlingen och proportionaliteten i förhållande till dess ändamål

### Behov av personuppgifter i dokumentinnehåll

Dokumentinnehåll (rutiner, lathundar, organisationsdokument) är i första hand av allmän karaktär. Personuppgifter kan förekomma i begränsad omfattning när det är nödvändigt för dokumentets funktion, exempelvis vid angivande av specifika kontaktpersoner eller ansvariga.

AI-bearbetning krävs för att:
- Extrahera text från PDF/Office-dokument (OCR)
- Indexera innehåll för semantisk sökning (embeddings)
- Göra informationen sökbar och tillgänglig (RAG-chat)

### Säkerställande av korrekthet, relevans och dataminimering

**Teknisk spärr:**
Endast informationsklass 0-1 (Öppen och Allmän information) tillåts i systemet. Dokument med högre säkerhetsklassificering kan inte publiceras.

**Granskning:**
Administratörer ansvarar för att granska dokument innan publicering.

**Dataskydd:**
Inga känsliga personuppgifter enligt artikel 9 GDPR behandlas.

### Ändamålsbegränsning

Personuppgifter i dokumentinnehåll används endast för kunskapshantering och AI-assisterad sökning. Ingen sekundär användning för andra ändamål såsom prestationsutvärdering, övervakning eller profilering.

### Lagringsperiod

Se punkt 1: Dokument lagras så länge de är relevanta för verksamheten. Hos AI-leverantörer lagras data temporärt i 30-55 dagar för monitoring, därefter automatisk radering.

### Proportionalitetsbedömning

**Nytta:**
- Effektiv kunskapsdelning förbättrar arbetsmiljö och produktivitet
- Anställda får snabbare tillgång till korrekt information
- Minskar risk för felaktiga beslut baserade på föråldrad information

**Intrång i personlig integritet:**
- Minimalt: Endast öppen och allmän tjänstlig information
- Teknisk spärr förhindrar behandling av konfidentiell information
- Ingen övervakning eller beteendeanalys

**Bedömning:**
Integritetsintrånget bedöms som **minimalt och proportionerligt** i förhållande till verksamhetsnyttan. Behandlingen är nödvändig för ett internt arbetsverktyg med stark dataminimering genom teknisk spärr.

## 2.2 Rättslig grund för behandlingen

### Primär rättslig grund: Artikel 6.1 e - Allmänt intresse och myndighetsutövning

Behandlingen av personuppgifter som förekommer i dokumentinnehåll grundar sig på **artikel 6.1 e GDPR** - uppgift av allmänt intresse eller myndighetsutövning.

**Motivering:**

Kommunen är en myndighet som enligt **kommunallagen (2017:725)** har uppgifter av allmänt intresse. Enligt **2 kap. 1 § kommunallagen** ska kommuner sköta angelägenheter av allmänt intresse som har anknytning till kommunens område eller deras medlemmar.

När personuppgifter förekommer i dokumentinnehåll (namn, befattningar, kontaktuppgifter), är behandlingen av dessa uppgifter nödvändig för att:
- Tillhandahålla sökbar och tillgänglig intern information för anställda
- Möjliggöra AI-assisterad kunskapsåtervinning genom OCR, embeddings och RAG-chat
- Säkerställa korrekt tillämpning av lagar och föreskrifter genom tillgång till uppdaterade styrdokument
- Uppfylla kommunens skyldigheter enligt arkivlagen (1990:782) genom digital dokumenthantering med versionskontroll

**Kompletterande rättslig grund:**

Behandlingen stöds även av följande bestämmelser:
- **Arkivlagen (1990:782):** Kommunen är arkivmyndighet och skyldiga att bevara allmänna handlingar
- **Offentlighets- och sekretesslagen (2009:400):** Åtkomstkontroll baserad på sekretessklassificering
- **Informationssäkerhetslagen (2022:482):** Krav på säkerhetsåtgärder för informationshantering i myndigheter
- **Arbetsmiljölagen (1977:1160):** Arbetsgivares skyldighet att tillhandahålla information och verktyg för säkert arbete

**Tydlighet och förutsägbarhet:**

Den rättsliga grunden är tydlig eftersom:
- Behandlingen är direkt kopplad till kommunens uppdrag och anställdas arbetsuppgifter
- Systemet används för intern kunskapshantering inom ramen för kommunens verksamhet
- Behandlingen är begränsad till tjänstliga uppgifter och organisatorisk information
- Det finns klara regler för åtkomstkontroll baserad på organisationsstruktur

## 2.3 Information och kommunikation med de registrerade

Systemet behandlar två kategorier av personuppgifter med olika informationsskyldigheter:

### Artikel 13 - Användarkonton (direkt insamling)

**Registrerade:** Redaktörer och administratörer som får användarkonton i systemet.

**Personuppgifter:** E-post, lösenord, roll, tilldelade avdelningar.

**Information tillhandahålls vid kontoskapande:**
- Personuppgiftsansvarig och kontaktuppgifter till dataskyddsombud
- Ändamål: Administration och åtkomstkontroll för kunskapsportalen
- Rättslig grund: Artikel 6.1 e (allmänt intresse/myndighetsutövning)
- Lagringsperiod: Under anställningstid och enligt arkivlagen
- Mottagare: Endast intern systemadministration (aldrig till AI-tjänster)
- Registrerades rättigheter enligt GDPR

**Hur information kommuniceras:**
- Integritetspolicy tillgänglig via länk på inloggningssidan (/privacy)

### Artikel 14 - Personuppgifter i dokumentinnehåll (indirekt insamling)

**Registrerade:** Anställda vars namn och kontaktuppgifter förekommer i dokumentinnehåll.

**Personuppgifter:** Namn, befattningar, tjänstliga kontaktuppgifter som förekommer i rutiner och organisationsdokument.

**Information tillhandahålls:**
- Personuppgiftsansvarig och kontaktuppgifter till dataskyddsombud
- Ändamål: Kunskapshantering med AI-assisterad sökning
- Rättslig grund: Artikel 6.1 e (allmänt intresse/myndighetsutövning)
- Lagringsperiod: Så länge dokumenten är relevanta för verksamheten
- Mottagare: AI-tjänster för dokumentbearbetning (OpenAI, Google Gemini, Mistral AI)
- Överföring till tredjeland: USA med standardavtalsklausuler
- Teknisk spärr: Endast informationsklass 0-1 tillåts
- Registrerades rättigheter enligt GDPR

**Hur information kommuniceras:**
- Information publiceras på intranätet där alla anställda har tillgång
- Vid publicering av dokument: Checkbox som påminner redaktören att minimera personuppgifter (uppmuntrar användning av roller/funktioner istället för namn)

### Registrerades rättigheter

Följande information om rättigheter tillhandahålls:
- Rätt till tillgång (artikel 15)
- Rätt till rättelse (artikel 16)
- Rätt till radering (artikel 17) - begränsningar p.g.a. arkivlagen
- Rätt till begränsning (artikel 18)
- Rätt att göra invändningar (artikel 21) - begränsad vid allmänt intresse
- Rätt att klaga till Integritetsskyddsmyndigheten (IMY)

**Kontakt:** Begäran om utövande av rättigheter görs via dataskyddsombudet.

## 2.4 Personuppgiftsbiträden

Följande externa leverantörer behandlar personuppgifter för kommunens räkning och personuppgiftsbiträdesavtal (PUB-avtal) krävs:

### AI-tjänsteleverantörer

**1. OpenAI (OpenAI, LLC) - USA**
- **Tjänst:** Generering av textembeddings via text-embedding-3-large API
- **Personuppgifter:** Textinnehåll från dokument (kan innehålla personuppgifter i dokumentens innehåll)
- **Omfattning:** Dokumenttext skickas för vektorisering när artiklar publiceras
- **PUB-avtal:**
  - OpenAI tillhandahåller Data Processing Addendum (DPA) enligt GDPR artikel 28
  - DPA inkluderar standardavtalsklausuler (SCC) för tredjelandsöverföring
  - Länk: https://openai.com/policies/data-processing-addendum
- **Datalagring:** 30 dagar enligt OpenAI API-policy, därefter automatisk radering
- **Status:** PUB-avtal ska tecknas via OpenAI:s standardavtal

**2. Google LLC (Vertex AI) - EU**
- **Tjänst:** Vertex AI i EU-region för AI-chat, OCR-dokumentextraktion, metadatagenerering
- **Personuppgifter:**
  - Dokumentinnehåll för OCR-bearbetning och som kontext i RAG-chat
  - Chattfrågor från användare (kan i undantagsfall innehålla personuppgifter)
- **Omfattning:** API-anrop i realtid vid dokumentuppladdning och chattanvändning
- **PUB-avtal:**
  - Google Cloud Data Processing Addendum (DPA)
  - Länk: https://cloud.google.com/terms/data-processing-addendum
- **Datalagring:** EU-region, 55 dagar för abuse monitoring, därefter automatisk radering
- **Status:** PUB-avtal ska tecknas via Google Cloud Platform

**3. Mistral AI - Frankrike (EU)**
- **Tjänst:** Pixtral Large för OCR-dokumentextraktion (alternativ till Gemini)
- **Personuppgifter:** Dokumentinnehåll för OCR-bearbetning
- **Omfattning:** API-anrop vid dokumentuppladdning (om vald som PDF_EXTRACTOR)
- **PUB-avtal:**
  - Mistral AI Data Processing Agreement
  - EU-baserad leverantör, ingen tredjelandsöverföring
  - Länk: https://mistral.ai/terms/
- **Datalagring:** Mistral OCR har ZDR (Zero Data Retention) som standard - ingen datalagring
- **Status:** PUB-avtal ska tecknas via Mistral AI:s standardavtal

### Hostingleverantör

**4. Glesys AB - Sverige (EU)**
- **Tjänst:** Hosting av webbapplikation, databaser och infrastruktur (servrar i Falkenberg)
- **Personuppgifter:** Användarkonton, dokumentinnehåll, versionshistorik
- **Omfattning:** Fullständig infrastruktur
- **PUB-avtal:** Befintligt avtal mellan Falkenbergs kommun och Glesys (samma leverantör som hostar kommunens hemsida och intranät)
- **Datalagring:** EU-baserad leverantör, ingen tredjelandsöverföring
- **Status:** PUB-avtal finns redan på plats

## 2.5 Överföring av personuppgifter till tredjeländer eller internationella organisationer

### Överföring till USA

Personuppgifter överförs till **USA** via följande AI-tjänst:
- **OpenAI (OpenAI, LLC)** - Textembeddings

**Rättslig grund för överföring:**

USA har **inte ett generellt adekvat skyddsbeslut** från EU-kommissionen sedan Schrems II-domen (C-311/18). Därför krävs alternativa överföringsmekanismer enligt GDPR kapitel V.

**Överföringsmekanism: Standardavtalsklausuler (SCC) enligt artikel 46.2 c GDPR**

OpenAI tillhandahåller:
1. **EU:s standardavtalsklausuler (Standard Contractual Clauses - SCC)** godkända av EU-kommissionen
2. **Data Processing Addendum (DPA)** som inkorporerar SCC

**Bedömning av överföring enligt Schrems II:**

Enligt EU-domstolens dom i Schrems II måste personuppgiftsansvariga:
1. Bedöma lagstiftningen i tredjeland (USA)
2. Implementera kompletterande säkerhetsåtgärder vid behov
3. Dokumentera bedömningen

**Bedömning av USA:s lagstiftning:**

**Risker:**
- FISA 702 och Executive Order 12333 tillåter USA:s underrättelsetjänster att begära tillgång till data
- Cloud Act kan kräva att företag lämnar ut data oavsett var den lagras

**Faktorer som minskar risk för denna behandling:**
1. **Teknisk begränsning - Starkaste skyddsåtgärden:** Systemet bearbetar ENDAST informationsklass 0-1 (Öppen och Allmän information). Dokument med högre säkerhetsklass (2-4) kan inte publiceras i systemet. Detta innebär att ingen konfidentiell eller känslig information skickas till USA-baserade tjänster.
2. **Typ av data:** Endast öppen och allmän kommunal information - inga känsliga personuppgifter, inga sekretessbelagda uppgifter
3. **Omfattning:** Begränsad datamängd - endast relevanta textutdrag från godkända dokument skickas till AI-tjänster
4. **Tidsbegränsning:** Temporär lagring (30 dagar hos OpenAI)
5. **Ändamål:** AI-bearbetning, inte lagring eller analys av personuppgifter
6. **Leverantörens certifieringar:**
   - OpenAI är certifierad enligt ISO 27001
   - Deltar i Data Privacy Framework (DPF) - frivilligt åtagande om dataskydd

**Kompletterande tekniska säkerhetsåtgärder:**

1. **Dataminimering:**
   - Endast nödvändig text skickas till API:er
   - Ingen onödig personinformation inkluderas i förfrågningar
   - Chattfrågor innehåller endast användarens fråga och relevanta dokumentutdrag

2. **Kryptering:**
   - TLS 1.3 för överföring till API:er
   - HTTPS för all kommunikation

3. **Pseudonymisering:**
   - Användaridentitet skickas inte med chattfrågor till AI-tjänster
   - Endast dokumentinnehåll, inte metadata om användare

4. **Tidsbegränsning:**
   - OpenAI raderar data efter 30 dagar
   - Ingen långtidslagring hos biträde

5. **Avtalsmässiga åtaganden:**
   - OpenAI förbinder sig att inte använda data för träning av AI-modeller
   - OpenAI förbinder sig att informera vid begäran från myndigheter

**Organisatoriska åtgärder:**

1. **Kontinuerlig övervakning:**
   - Uppföljning av OpenAI:s transparensrapporter
   - Granskning av ändringar i USA:s lagstiftning
   - Årlig riskbedömning av tredjelandsöverföring

2. **Begränsad exponering - Teknisk spärr:**
   - **Systemet bearbetar ENDAST informationsklass 0-1** (Öppen och Allmän information)
   - Dokument klassificerade som 2-4 (Intern, Konfidentiell, Hemlig) får INTE publiceras i systemet
   - Teknisk validering förhindrar att högre säkerhetsklasser aktiveras för publicering
   - Detta säkerställer att ingen konfidentiell information skickas till USA-baserad AI-tjänst

### Överföring inom EU

**Google Vertex AI - EU-region:**
Ingen tredjelandsöverföring. Vertex AI körs i EU-region och data behandlas inom EU.

**Mistral AI - Frankrike:**
Ingen tredjelandsöverföring. Mistral AI är baserat i EU och lagrar data inom EU.

### Sammanfattande bedömning

**Överföring till USA bedöms vara tillåten enligt följande:**
- **Grund:** Standardavtalsklausuler (SCC) enligt artikel 46.2 c GDPR
- **Kompletterande åtgärder:** Starka tekniska och organisatoriska åtgärder implementerade
- **Teknisk begränsning:** Endast informationsklass 0-1 tillåts - ingen konfidentiell information exponeras
- **Risknivå:** Låg - endast öppen och allmän information behandlas av USA-baserad tjänst (OpenAI för embeddings)
- **Proportionalitet:** Nyttan med AI-funktionalitet för öppen/allmän information uppväger den minimala risken vid överföring
- **Minimerad exponering:** Endast embeddings skickas till USA - all chat, OCR och metadatagenerering hanteras inom EU (Vertex AI)

**Dokumentation:**
Denna bedömning ska revideras årligen och vid väsentliga förändringar i:
- USA:s lagstiftning
- EU-kommissionens vägledning
- Leverantörernas certifieringar och åtaganden
- Typ av data som behandlas

## 4.1 Synpunkter från de registrerade eller deras företrädare

Synpunkter från registrerade har inte inhämtats då behandlingen bedöms vara av låg risk och behandlar endast öppna och allmänna tjänstliga uppgifter. Att inhämta synpunkter från samtliga anställda vars namn kan förekomma i dokumentinnehåll skulle utgöra en oproportionerlig arbetsinsats.

Information om behandlingen tillhandahålls istället enligt artikel 13 och 14 GDPR, och registrerade har möjlighet att kontakta dataskyddsombudet vid frågor eller synpunkter.

## 4.2 Dataskyddsombudets kommentar

Detta skriver dataskyddsombudet. Det är obligatoriskt att rådfråga dataskyddsombudet vid genomförande av konsekvensbedömningar.
