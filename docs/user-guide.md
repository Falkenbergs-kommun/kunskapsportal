---
title: Användarguide - Kunskapsportal
layout: default
description: Användarhandledning för Kunskapsportal - hantera dokument, sök och använd AI-funktioner
---

# Användarguide - Kunskapsportal

Välkommen till Kunskapsportal! Denna guide hjälper dig att komma igång med att hantera dokument, söka information och använda AI-funktionerna.

## Innehållsförteckning

- [Översikt](#översikt)
- [Logga in](#logga-in)
- [Ladda upp dokument](#ladda-upp-dokument)
- [Skapa artiklar](#skapa-artiklar)
- [AI-funktioner](#ai-funktioner)
- [Sök och chatt](#sök-och-chatt)
- [Organisera med verksamhetsområden](#organisera-med-verksamhetsområden)
- [Best practices](#best-practices)

---

## Översikt

Kunskapsportal är ett AI-drivet kunskapshanteringssystem byggt på moderna teknologier för att göra kommunala dokument sökbara och tillgängliga via AI-chatt.

### 🔧 Teknisk översikt

Systemet kombinerar flera kraftfulla teknologier:

- **[Payload CMS](https://payloadcms.com/)** - Hjärtat i systemet. Hanterar alla dokument, användare och innehåll
- **[Qdrant](https://qdrant.tech/)** - Vektordatabas som gör semantisk sökning möjlig (sökning baserad på mening, inte bara nyckelord)
- **[Google Gemini AI](https://ai.google.dev/)** - Läser dokument med OCR, genererar metadata och driver AI-chatten
- **[OpenAI](https://platform.openai.com/)** - Skapar vektorrepresentationer av text för intelligent sökning

**Så fungerar det:** När du laddar upp ett dokument läser AI:n det, extraherar innehållet och skapar en "fingeravtryck" (vektor) som lagras i Qdrant. När någon ställer en fråga i chatten hittar systemet dokument med liknande fingeravtryck och AI:n svarar baserat på det faktiska innehållet.

### 🎯 Frontend (Offentlig sida)
- **Startsida:** Utforska dokument och chatta med AI
- **Sökfunktion:** Hitta dokument med semantisk sökning
- **AI-chatt:** Ställ frågor och få svar från dokumentarkivet
- **Verksamhetsområden:** Filtrera på organisationsenhet

**URL:** http://localhost:3000

### 🛠️ Admin-gränssnitt (Payload CMS)
- **Dokumenthantering:** Ladda upp och redigera dokument
- **AI-bearbetning:** Automatisk innehållsextrahering
- **Metadatahantering:** Klassificering och taggning
- **Användare:** Hantera åtkomst

**URL:** http://localhost:3000/admin

---

## Logga in

### Första inloggningen

1. Öppna: http://localhost:3000/admin
2. Klicka **"Create your first user"**
3. Fyll i:
   - Email: din@kommun.se
   - Lösenord: (Minst 8 tecken)
4. Klicka **"Create"**

### Efterföljande inloggningar

1. Gå till: http://localhost:3000/admin
2. Ange email och lösenord
3. Klicka **"Login"**

**Glömt lösenord?**
- Klicka **"Forgot password"**
- Ange din email
- Följ instruktionerna i mailet

---

## Ladda upp dokument

### Steg 1: Gå till Media

1. Klicka **"Media"** i sidomenyn
2. Klicka **"Create new"**

### Steg 2: Ladda upp fil

**Stödda filtyper:**
- 📄 PDF (.pdf)
- 📝 Word (.doc, .docx)
- 📊 Excel (.xls, .xlsx)
- 📈 PowerPoint (.ppt, .pptx)
- 🖼️ Bilder (.jpg, .png, .webp, .gif, .svg)
- 📃 Textfiler (.txt)

**Rekommenderad filstorlek:** Max 25MB

### Steg 3: Fyll i metadata

- **Alt-text:** Beskriv filen (viktigt för tillgänglighet)
- Övriga fält fylls i automatiskt

### Steg 4: Spara

Klicka **"Create"** längst ner.

**Tips:**
- ✅ Använd beskrivande filnamn
- ✅ Håll filstorlekar rimliga (under 25MB)
- ✅ Kontrollera att PDF:er inte är lösenordsskyddade

---

## Skapa artiklar

### Metod 1: AI-genererad artikel (Rekommenderat)

#### Steg 1: Skapa ny artikel
1. Klicka **"Articles"** i sidomenyn
2. Klicka **"Create new"**

#### Steg 2: Välj källdokument
1. Gå till fliken **"Source"**
2. Under **"Source Documents"**, klicka **"Add"**
3. Välj dokumenten du vill bearbeta (kan välja flera)
4. Klicka **"Select"**

#### Steg 3: Generera innehåll med AI
1. Klicka **"Generate with AI"**
2. Vänta medan AI:n extraherar innehåll (kan ta 30-60 sekunder)
3. Gå till fliken **"Content"** och granska resultatet

**Vad händer:**
- AI:n läser dina dokument med OCR
- Extraherar text, tabeller och bilder
- Strukturerar innehållet med rubriker
- Konverterar till redigerbart format

#### Steg 4: Generera metadata
1. Gå till fliken **"Metadata"**
2. Klicka **"Generate Metadata"**
3. Vänta medan AI:n analyserar (20-30 sekunder)

**AI:n genererar automatiskt:**
- ✨ Titel på svenska
- 📝 Sammanfattning
- 🔗 URL-slug
- 🏷️ Nyckelord
- 📂 Dokumenttyp (Policy, Riktlinje, etc.)
- 🏛️ Verksamhetsområde
- 🔒 Säkerhetsnivå
- ⚖️ Rättslig grund (om relevant)
- 📅 Datum och versioner

#### Steg 5: Granska och justera
- Kontrollera att metadata stämmer
- Justera vad som behövs
- Lägg till extra information

#### Steg 6: Publicera
1. Klicka **"Save as draft"** om du vill fortsätta senare
2. Eller klicka **"Publish"** för att göra dokumentet sökbart

**När du publicerar:**
- Dokumentet blir tillgängligt på frontend
- Innehållet indexeras i vektordatabasen
- AI-chatten kan svara på frågor om dokumentet
- Status sätts automatiskt till "Aktiv"

### Metod 2: Manuell artikel

1. Gå till **"Articles"** → **"Create new"**
2. Gå till fliken **"Content"**
3. Skriv innehållet direkt i editorn
4. Gå till **"Metadata"** och fyll i manuellt
5. Klicka **"Publish"**

---

## AI-funktioner

### 🤖 AI-innehållsextrahering

**Teknologi:** [Google Gemini 2.5 Flash](https://ai.google.dev/) eller [Mistral Pixtral Large](https://mistral.ai/)

**Vad den gör:**
- Läser PDF:er och Office-dokument med OCR (Optical Character Recognition)
- Extraherar text med hög precision
- Bevarar dokumentstruktur (rubriker, listor, tabeller)
- Hanterar även skannade dokument

**Tips för bästa resultat:**
- ✅ Använd högkvalitativa PDF:er
- ✅ Se till att text är läsbar (inte för suddig)
- ✅ Undvik handskriven text (fungerar sämre)
- ✅ PDF:er med "text layer" fungerar bäst

### 🧠 AI-metadatagenerering

**Teknologi:** [Google Gemini 2.5 Flash](https://ai.google.dev/)

**Vad den gör:**
- Analyserar dokumentinnehållet på svenska
- Föreslår relevant metadata automatiskt
- Klassificerar dokumenttyp
- Identifierar verksamhetsområde
- Extraherar nyckelord och sammanfattning

**Tips:**
- ✅ Granska alltid AI:ns förslag
- ✅ Justera verksamhetsområde om fel
- ✅ Lägg till extra nyckelord vid behov
- ✅ Kontrollera säkerhetsnivå

### 🎨 AI-omslagsbild

**Generera omslagsbild:**
1. Gå till **"Metadata"**-fliken
2. Scrolla till **"Cover Photo"**
3. Klicka **"Generate Cover Photo"**
4. Vänta medan AI:n skapar en bild (15-30 sekunder)
5. Granska och spara

**Bilderna genereras baserat på:**
- Dokumentets titel
- Sammanfattning
- Innehåll

---

## Sök och chatt

### Frontend-sökning

**Navigera till startsidan:** http://localhost:3000

#### Metod 1: AI-chatt (Rekommenderat)

**Teknologi:** RAG (Retrieval Augmented Generation) med [Qdrant](https://qdrant.tech/) + [Google Gemini](https://ai.google.dev/)

**Så fungerar det:**
1. Din fråga konverteras till en vektor med [OpenAI embeddings](https://platform.openai.com/docs/guides/embeddings)
2. Qdrant hittar de mest relevanta dokumenten baserat på semantisk likhet
3. Gemini AI får dokumenten som kontext och genererar ett svar
4. Du får ett svar baserat på faktiska dokument, inte AI:ns "gissningar"

**Använda chatten:**
1. Hitta **chattrutan** i högra hörnet
2. Skriv din fråga på svenska:
   - "Hur ansöker man om bygglov?"
   - "Vilka regler gäller för äldreomsorg?"
   - "Vad säger policyn om GDPR?"

3. AI:n svarar med:
   - ✅ Relevant information från dina dokument
   - 🔗 Källhänvisningar med klickbara länkar
   - 📄 Förslag på relaterade dokument

**Tips för bra frågor:**
- ✅ Var specifik: "Hur lång är handläggningstiden för bygglov?" istället för "Bygglov?"
- ✅ Ställ hela frågor: "Vad kostar det att..." istället för bara "Kostnad"
- ✅ Använd svenska naturligt språk

#### Metod 2: Textbaserad sökning

1. Använd **sökfältet** överst
2. Skriv nyckelord eller fraser
3. Resultaten visar matchande dokument

#### Filtrera på verksamhetsområde

1. Klicka på **verksamhetsområde** i vänster sidopanel
2. Välj ett område (t.ex. "Socialtjänst", "Byggnad")
3. Chatten söker nu endast i det området

**Fördelar:**
- 🎯 Mer relevanta svar
- ⚡ Snabbare resultat
- 📁 Enklare att hitta avdelningsspecifik information

### Chatthistorik

**Automatisk sparning:**
- All chatthistorik sparas lokalt i din webbläsare
- Historiken finns kvar även efter omstart
- Varje verksamhetsområde har egen historik

**Rensa historik:**
- Inställningsikonen i chatten
- Välj "Clear history"

---

## Organisera med verksamhetsområden

### Skapa verksamhetsområde

1. Gå till **"Departments"** i admin
2. Klicka **"Create new"**
3. Fyll i:
   - **Namn:** T.ex. "Socialtjänst"
   - **Slug:** t.ex. "socialtjanst" (används i URL)
   - **Beskrivning:** Kort beskrivning
   - **Ikon:** Välj en ikon (valfritt)
   - **Överordnad:** Välj om detta är en underavdelning

**Hierarkisk struktur:**

```
Socialtjänst
├── Äldreomsorgen
├── LSS
└── Individ- och familjeomsorg

Byggnad och miljö
├── Bygglov
├── Miljötillsyn
└── Kart och mät
```

### Tilldela dokument till verksamhetsområde

1. Öppna en artikel
2. Gå till **"Metadata"** → **"Klassificering"**
3. Välj **"Verksamhetsområde"**
4. Spara

**AI gör det automatiskt:**
När du kör "Generate Metadata" föreslår AI:n rätt verksamhetsområde baserat på innehållet.

---

## Best practices

### 📝 Dokumenthantering

**DO:**
- ✅ Använd beskrivande filnamn: "Riktlinje_GDPR_2025.pdf"
- ✅ Ladda upp originaldokument (inte skannade kopior om möjligt)
- ✅ Håll dokument uppdaterade
- ✅ Använd versionering för ändringar
- ✅ Sätt rätt säkerhetsnivå

**DON'T:**
- ❌ Ladda inte upp lösenordsskyddade PDF:er
- ❌ Använd inte kryptiska filnamn: "doc_final_v3_FINAL.pdf"
- ❌ Glöm inte att publicera när dokumentet är klart
- ❌ Lämna inte dokument i draft-läge för länge

### 🤖 AI-användning

**DO:**
- ✅ Granska alltid AI:ns resultat
- ✅ Justera metadata vid behov
- ✅ Testa olika formuleringar i chatten
- ✅ Använd verksamhetsfilter för bättre träffsäkerhet

**DON'T:**
- ❌ Lita inte blint på AI-genererad metadata
- ❌ Publicera inte utan att granska innehållet
- ❌ Förvänta dig inte perfekta resultat på dåliga skanningar

### 🔒 Säkerhet & Efterlevnad

**DO:**
- ✅ Sätt rätt säkerhetsnivå (Offentlig/Intern/Konfidentiell)
- ✅ Markera dokument som innehåller personuppgifter (GDPR)
- ✅ Fyll i rättslig grund där det är relevant
- ✅ Använd granskningsdatum för att hålla dokument aktuella

**DON'T:**
- ❌ Publicera inte känsliga dokument som "Offentlig"
- ❌ Glöm inte GDPR-flaggan för dokument med personuppgifter
- ❌ Lämna inte utgångna dokument som "Aktiva"

### 📊 Metadata

**Obligatoriskt vid publicering:**
- ✅ Titel
- ✅ Slug (URL-vänlig)
- ✅ Dokumentstatus: Aktiv (sätts automatiskt vid publicering)

**Rekommenderat:**
- ✅ Sammanfattning (hjälper sökning)
- ✅ Nyckelord (5-10 relevanta termer)
- ✅ Verksamhetsområde
- ✅ Dokumenttyp
- ✅ Målgrupp (Medborgare, Anställda, etc.)

**Valfritt men användbart:**
- Rättslig grund
- Författare och granskare
- Versionsnummer
- Granskningsdatum

---

## Vanliga frågor

### Hur lång tid tar AI-bearbetning?

- **Innehållsextrahering:** 30-60 sekunder per dokument
- **Metadatagenerering:** 20-30 sekunder
- **Omslagsbild:** 15-30 sekunder

Tiden beror på dokumentets storlek och komplexitet.

### Kan AI:n läsa handskriven text?

Delvis. OCR fungerar bäst på:
- ✅ Tryckt text
- ✅ Digitalt skapade PDF:er
- ⚠️ Tydlig handstil (sämre precision)
- ❌ Otydlig handstil (dåliga resultat)

### Vad händer om AI:n gör fel?

AI:n är ett hjälpmedel, inte en ersättning för mänsklig granskning.

**Alltid:**
- Granska AI-genererat innehåll
- Korrigera fel
- Justera metadata vid behov

### Kan jag redigera AI-genererat innehåll?

Ja! All AI-genererat innehåll är fullt redigerbart:
- Redigera text i Content-editorn
- Justera metadata manuellt
- Lägg till eller ta bort information

### Hur tar jag bort ett dokument?

1. Gå till **Articles** eller **Media**
2. Hitta dokumentet
3. Klicka på det
4. Scrolla längst ner
5. Klicka **"Delete"**
6. Bekräfta

**OBS:** Detta går inte att ångra!

### Hur uppdaterar jag ett befintligt dokument?

**Alternativ 1: Versionshantering (Rekommenderat)**
1. Öppna artikeln
2. Gör ändringar
3. Klicka **"Save"**
4. Payload sparar automatiskt en ny version
5. Klicka **"Publish"** för att publicera

**Alternativ 2: Ladda upp nytt dokument**
1. Ladda upp det nya dokumentet i Media
2. Öppna artikeln
3. Lägg till det nya dokumentet under Source Documents
4. Kör **"Generate with AI"** igen

### Hur vet jag om ett dokument är sökbart?

Dokumentet måste vara:
- ✅ **Publicerat** (inte Draft)
- ✅ **Status: Aktiv** (sätts automatiskt vid publicering)

Kolla statusen i artikelns metadata.

### Kan jag använda systemet offline?

**Nej.** Kunskapsportal kräver:
- Internetanslutning för AI-tjänster (Gemini, OpenAI)
- Åtkomst till databasen
- Åtkomst till Qdrant

---

## Nästa steg

- **[API-dokumentation](api.md)** - Integrera med andra system
- **[Utvecklingsguide](development.md)** - Anpassa systemet
- **[Deployment-guide](deployment.md)** - Driftsätt i produktion

---

## Support

**Frågor?** Öppna en issue:
https://github.com/Falkenbergs-kommun/kunskapsportal/issues

**Säkerhetsproblem?** Maila:
security@falkenberg.se
