# Kunskapsportal

**AI-driven kunskapsdatabas för svensk kommunal förvaltning**

Kunskapsportal är ett open source-system för kunskapshantering, specialbyggt för svenska kommuner och offentlig sektor. Systemet använder AI för att automatiskt bearbeta dokument, generera metadata och möjliggöra intelligent sökning och AI-chatt.

> 🏛️ Byggt för kommunala behov | 💬 Chatta med dina dokument | 🤖 Automatisk AI-bearbetning

---

## 📖 Dokumentation

**👉 [Läs den fullständiga dokumentationen](https://falkenbergs-kommun.github.io/kunskapsportal/)**

Komplett guide för installation, användning, API, utveckling och deployment.

---

## ✨ Huvudfunktioner

### 🏛️ Specialbyggt för Kommunal Förvaltning

- **Regelefterlevnad inbyggt**
  - GDPR-flaggor och hantering av personuppgifter
  - WCAG 2.1 AA tillgänglighetsspårning
  - Säkerhetsklassificering (Offentlig, Intern, Konfidentiell, Begränsad)

- **Juridisk struktur**
  - Länkning till rättslig grund (Lag, Förordning, Kapitel, Paragraf)
  - Spårning av målgrupper (Medborgare, Anställda, Förtroendevalda, Företag)

- **Livscykelhantering**
  - Automatiska granskningspåminnelser
  - Revideringsintervaller (Årlig, Vartannat år, etc.)
  - Godkännandekedjor (Författare, Granskare, Godkännare)
  - Versionhantering (upp till 50 versioner per dokument)

- **Svenska-först**
  - Helt svenskt gränssnitt
  - AI-genererad metadata på svenska
  - Dokumenttyper anpassade för svensk förvaltning

### 💬 Konversationssökning med AI

- **RAG-powered sökning** (Retrieval Augmented Generation)
  - AI-assistent som förstår hela dokumentarkivet
  - Svarar på frågor med kontext från dina dokument
  - Källhänvisningar med direktlänkar

- **Semantisk vektorsökning**
  - Hitta dokument baserat på innebörd, inte bara nyckelord
  - Qdrant-driven vektordatabas med OpenAI embeddings
  - Sök över 1000+ dokument på millisekunder

- **Intelligent filtrering**
  - Filtrera på verksamhetsområden/avdelningar
  - Hierarkisk organisationsstruktur
  - Sparade chathistorik och inställningar

### 🤖 Automatisk Dokumentbearbetning

- **AI OCR-extraktion**
  - Bearbetar PDF, Word, Excel, PowerPoint automatiskt
  - Google Gemini 2.5 Flash eller Mistral AI OCR
  - LibreOffice-integration för Office-dokumentkonvertering

- **Smart metadatagenerering**
  - Auto-genererar: Titel, Sammanfattning, Nyckelord
  - Föreslår: Dokumenttyp, Målgrupp, Säkerhetsnivå
  - Identifierar: Verksamhetsområde, Rättslig grund
  - Extraherar: Versionsnummer, Datum, Författare

- **Innehållsstrukturering**
  - Konverterar till sökbart rich-text format (Lexical)
  - Bevarar rubriker, tabeller, listor
  - Extraherar och bäddar in bilder

## 🚀 Snabbstart

### Produktionsdriftsättning med Docker

**Förutsättningar:**
- Docker & Docker Compose installerat
- 2GB RAM minimum (4GB rekommenderat)
- API-nycklar för AI-tjänster (Gemini, Mistral, OpenAI)

**Steg 1: Klona och konfigurera**

```bash
git clone https://github.com/Falkenbergs-kommun/kunskapsportal.git
cd kunskapsportal
cp .env.example .env
```

**Steg 2: Redigera `.env` med dina API-nycklar**

```bash
# Obligatoriska
DATABASE_URI=postgres://knowledge_user:docker_password@postgres:5432/knowledge_base
PAYLOAD_SECRET=din-hemliga-nyckel-minst-32-tecken
GEMINI_API_KEY=din-gemini-api-nyckel
OPENAI_API_KEY=din-openai-api-nyckel

# Valfria
MISTRAL_API_KEY=din-mistral-api-nyckel
QDRANT_API_KEY=din-qdrant-api-nyckel  # Om du använder Qdrant Cloud
```

**Steg 3: Starta tjänsterna**

```bash
docker-compose up --build
```

**Viktigt:** Vid första uppstart körs automatiskt databasmigrationer när servern startar (runtime migrations). Detta kan ta några sekunder extra vid första starten. Payload skapar alla nödvändiga tabeller i PostgreSQL automatiskt.

**Steg 4: Öppna i webbläsaren**

- **Frontend:** http://localhost:3000
- **Admin-gränssnitt:** http://localhost:3000/admin

**Första inloggningen:**
Skapa första användaren via `/admin/create-first-user`

### Lokal utveckling

**Förutsättningar:**
- Node.js 20+ och pnpm
- PostgreSQL 15+
- Qdrant (Docker: `docker run -p 6333:6333 qdrant/qdrant`)
- LibreOffice (för dokumentkonvertering)

**Installation:**

```bash
# Installera dependencies
pnpm install

# Konfigurera .env.local
cp .env.example .env.local
# Redigera DATABASE_URI till din lokala PostgreSQL

# Starta utvecklingsserver
pnpm dev
```

**Databasmigrationer i utveckling:**

I development mode använder Payload `push: true` vilket automatiskt synkar databasen med din Payload-konfiguration. Du behöver normalt inte köra migrations manuellt.

Om du vill skapa migrations för production:
```bash
# Skapa en ny migration
pnpm payload migrate:create min-migration

# Visa migrationsstatus
pnpm payload migrate:status
```

## 🏗️ Teknisk Arkitektur

Kunskapsportal bygger på moderna, beprövade teknologier för att leverera en robust och skalbar lösning.

### Kärnsystem

**[Payload CMS 3.50](https://payloadcms.com/)** - Hela applikationens grund
- Headless CMS för innehållshantering
- Admin-gränssnitt för dokumenthantering
- Collections för artiklar, media, användare
- Webhook-system och REST/GraphQL API
- TypeScript-baserat med full type-safety
- [📖 Payload Dokumentation](https://payloadcms.com/docs)

**[Next.js 15](https://nextjs.org/)** - Frontend-ramverk och server
- App Router för modern routing
- Server Components för bättre prestanda
- API Routes för custom endpoints
- Built-in optimering och caching
- [📖 Next.js Dokumentation](https://nextjs.org/docs)

**[PostgreSQL 15](https://www.postgresql.org/)** - Primär databas
- Lagrar alla artiklar, metadata och användare
- ACID-kompatibel för dataintegritet
- Skalbar och pålitlig
- [📖 PostgreSQL Dokumentation](https://www.postgresql.org/docs/15/)

**[Qdrant](https://qdrant.tech/)** - Vektordatabas för RAG (Retrieval Augmented Generation)
- Lagrar embeddings av dokumentinnehåll
- Möjliggör semantisk sökning (sökning baserad på mening, inte bara keywords)
- Snabb similarity search (millisekunder)
- Kritisk för AI-chattens förmåga att hitta relevant information
- [📖 Qdrant Dokumentation](https://qdrant.tech/documentation/)

### AI-stack

**[Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/)** - Primär AI-motor
- **OCR & Dokumentextrahering:** Läser PDF:er och konverterar till text
- **AI-chatt:** Svarar på användarfrågor med RAG
- **Metadatagenerering:** Analyserar innehåll och föreslår metadata
- Snabb och kostnadseffektiv (Flash-modellen)
- [📖 Gemini API Dokumentation](https://ai.google.dev/docs)

**[OpenAI Embeddings](https://platform.openai.com/)** - Text-to-vector
- **text-embedding-3-large:** Konverterar text till vektorer (1536 dimensioner)
- Används för att skapa embeddings som lagras i Qdrant
- Möjliggör semantisk sökning
- [📖 OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

**[Mistral AI](https://mistral.ai/)** - Alternativ OCR
- Pixtral Large för dokumentbearbetning
- Backup/alternativ till Gemini
- [📖 Mistral Dokumentation](https://docs.mistral.ai/)

### Frontend-teknologier

**[React 19](https://react.dev/)** - UI-bibliotek
- Server Components för bättre prestanda
- [📖 React Dokumentation](https://react.dev/learn)

**[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- Snabb styling med predefinerade klasser
- [📖 Tailwind Dokumentation](https://tailwindcss.com/docs)

**[shadcn/ui](https://ui.shadcn.com/)** - Komponentbibliotek
- Radix UI-baserade komponenter
- Fullt anpassningsbara
- [📖 shadcn/ui Dokumentation](https://ui.shadcn.com/docs)

**[Lexical](https://lexical.dev/)** - Rich text-editor
- Meta's moderna editor-ramverk
- Används för artikelinnehåll
- [📖 Lexical Dokumentation](https://lexical.dev/docs/intro)

### DevOps & Infrastruktur

**[Docker](https://www.docker.com/)** - Containerisering
- Multi-stage builds för optimerade images
- Docker Compose för lokal utveckling och produktion
- [📖 Docker Dokumentation](https://docs.docker.com/)

**[LibreOffice](https://www.libreoffice.org/)** - Office-konvertering
- Konverterar Word/Excel/PowerPoint till PDF
- Headless mode i Docker-container
- [📖 LibreOffice Dokumentation](https://documentation.libreoffice.org/)

**[TypeScript 5.7](https://www.typescriptlang.org/)** - Typsäkerhet
- Strikt typing genom hela applikationen
- Auto-genererade typer från Payload-schema
- [📖 TypeScript Dokumentation](https://www.typescriptlang.org/docs/)

## 🔄 Så fungerar det - RAG-arkitekturen

**RAG (Retrieval Augmented Generation)** är hjärtat i Kunskapsportal. Här är hela flödet:

### 1. Dokumentuppladdning → AI-bearbetning

```
PDF/Office-fil → Payload CMS → Gemini/Mistral OCR → Extraherad text → Payload Collection
```

När du laddar upp ett dokument:
1. **Payload CMS** tar emot filen och sparar i Media-collection
2. **Gemini/Mistral** läser dokumentet med OCR och extraherar text
3. Texten struktureras med rubriker, listor, tabeller
4. Sparas i Articles-collection i **PostgreSQL**

### 2. Publicering → Vektorisering

```
Artikel publiceras → OpenAI Embeddings → Vektorer → Qdrant lagring
```

När en artikel publiceras:
1. **OpenAI API** konverterar texten till 1536-dimensionella vektorer (embeddings)
2. Vektorerna sparas i **Qdrant** tillsammans med artikel-ID
3. Artikeln blir nu sökbar via semantisk sökning

### 3. Sökning → RAG-chatt

```
Användarfråga → OpenAI Embeddings → Qdrant similarity search → Relevanta dokument → Gemini + kontext → Svar
```

När en användare ställer en fråga:
1. Frågan konverteras till en vektor med **OpenAI Embeddings**
2. **Qdrant** hittar liknande vektorer (similarity search)
3. Relevanta dokument hämtas från **PostgreSQL** via **Payload**
4. **Gemini** får dokumenten som kontext och genererar svar
5. Svar visas med källhänvisningar

### Varför RAG istället för bara AI-chatt?

| Vanlig AI-chatt | RAG (Kunskapsportal) |
|----------------|----------------------|
| ❌ Kan "hitta på" information | ✅ Baseras på faktiska dokument |
| ❌ Vetskap begränsad till träningsdata | ✅ Aktuell info från dina dokument |
| ❌ Inga källor | ✅ Källhänvisningar till originaldokument |
| ❌ Generisk | ✅ Specifik för din organisation |

**Resultat:** AI som svarar baserat på ERA faktiska policydokument, riktlinjer och beslut!

---

## 📚 Användningsfall

### För Kommuner

**Central Kunskapsdatabas**
- Samla policydokument, riktlinjer, beslut på ett ställe
- Automatisk kategorisering och metadata
- Enkel åtkomst för alla medarbetare

**Intelligent Medborgarservice**
- AI-chattbot som svarar på frågor om kommunala tjänster
- Hänvisar till rätt dokument automatiskt
- Tillgänglig 24/7

**Regelefterlevnad och Kvalitet**
- Inbyggd GDPR-spårning
- Tillgänglighetskontroll (WCAG 2.1 AA)
- Automatiska granskningspåminnelser
- Versionskontroll och ändringshistorik

**Effektiv Dokumenthantering**
- Ladda upp PDF/Office → AI bearbetar automatiskt
- Genererar metadata på svenska
- Sparar timmar av manuellt arbete

### För Utvecklare

**Moderna Standarder**
- TypeScript-first
- RESTful API + GraphQL
- Webhook-support
- Utbyggbar arkitektur

**Anpassningsbar**
- Custom collections och fields
- Hooks för affärslogik
- Plugin-system
- Headless CMS = använd valfri frontend

## 📖 Mer Information

För detaljerad dokumentation, besök vår dokumentationssida:

**👉 https://falkenbergs-kommun.github.io/kunskapsportal/**

Innehåller:
- Installation och konfiguration
- Användarguide med screenshots
- API-dokumentation (REST & GraphQL)
- Utvecklingsguide
- Deployment och produktion

## 🤝 Bidra

Vi välkomnar bidrag från open source-communityn! Vare sig det är buggfixar, nya funktioner eller dokumentation.

**Så här bidrar du:**

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Commita dina ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

**Kodstandarder:**
- TypeScript strict mode
- ESLint + Prettier
- Konventionella commit-meddelanden
- Tester för ny funktionalitet

## 🐛 Buggar och Feature Requests

Hittat en bugg? Har du en idé för en ny funktion?

- **Buggar:** [Öppna en issue](https://github.com/Falkenbergs-kommun/kunskapsportal/issues/new?template=bug_report.md)
- **Features:** [Öppna en feature request](https://github.com/Falkenbergs-kommun/kunskapsportal/issues/new?template=feature_request.md)

## 📊 Status

- ✅ **Produktion:** Redo för användning
- 🔄 **Aktivt underhållen:** Regelbundna uppdateringar
- 🛡️ **Stabil:** Payload 3.x, Next.js 15
- 📈 **Skalbar:** Testad med 1000+ dokument

## 🔒 Säkerhet

Vi tar säkerhet på allvar. Om du hittar en säkerhetsrisk:

- **Rapportera privat:** utvecklingsavdelningen@falkenberg.se
- **Använd inte:** Public issues för säkerhetsproblem
- **Vi svarar:** Inom 48 timmar

## 📄 Licens

MIT License

Copyright (c) 2025 Falkenbergs kommun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🙏 Tack Till

**Utveckling:**
- Falkenbergs kommun Utvecklingsavdelningen
- Open source-communityn

**Teknologi:**
- [Payload CMS](https://payloadcms.com/) - Headless CMS
- [Next.js](https://nextjs.org/) - React-ramverk
- [Qdrant](https://qdrant.tech/) - Vektordatabas
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI-modeller
- [shadcn/ui](https://ui.shadcn.com/) - UI-komponenter

**AI-assistans:**
- Utvecklat med stöd av Claude Code (Anthropic)

---

**Skapat med ❤️ av Falkenbergs kommun för svensk offentlig sektor**

*Ett projekt för att göra kommunala kunskapsbaser intelligenta, tillgängliga och användarvänliga.*
