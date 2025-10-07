---
title: Installationsguide - Kunskapsportal
layout: default
description: Installera och konfigurera Kunskapsportal för både produktion och utveckling
---

# Installationsguide - Kunskapsportal

Denna guide hjälper dig att installera och konfigurera Kunskapsportal för både produktion och utveckling.

## Innehållsförteckning

- [Systemkrav](#systemkrav)
- [Produktion med Docker](#produktion-med-docker)
- [Lokal utvecklingsmiljö](#lokal-utvecklingsmiljö)
- [Konfiguration](#konfiguration)
- [Databas-initialisering](#databas-initialisering)
- [Felsökning](#felsökning)

---

## Systemkrav

### Minsta krav (Docker)
- **CPU:** 2 kärnor
- **RAM:** 2GB (4GB rekommenderat)
- **Disk:** 5GB ledigt utrymme
- **OS:** Linux, macOS eller Windows med WSL2
- **Docker:** Version 20.10+
- **Docker Compose:** Version 2.0+

### Utvecklingsmiljö (Lokal)
- **Node.js:** Version 20.9.0 eller senare
- **pnpm:** Version 9 eller 10
- **PostgreSQL:** Version 15+
- **Qdrant:** Lokal eller cloud-instans
- **LibreOffice:** För dokumentkonvertering

### API-nycklar (Obligatoriskt för AI-funktioner)

**[Google Gemini API](https://makersuite.google.com/app/apikey)** - Primär AI-motor
- **Används för:** OCR-extrahering av dokument, AI-chatt, metadatagenerering
- **Kostnad:** Gratis tier finns (15 requests/minut), sedan från $0.075/1M tokens
- **Dokumentation:** https://ai.google.dev/docs

**[OpenAI API](https://platform.openai.com/api-keys)** - Text embeddings
- **Används för:** Konvertera text till vektorer för semantisk sökning
- **Modell:** text-embedding-3-large (1536 dimensioner)
- **Kostnad:** $0.13/1M tokens
- **Dokumentation:** https://platform.openai.com/docs/guides/embeddings

**[Mistral API](https://console.mistral.ai/)** (Valfritt alternativ)
- **Används för:** OCR-extrahering som backup/alternativ till Gemini
- **Modell:** Pixtral Large
- **Kostnad:** $0.12/1M tokens
- **Dokumentation:** https://docs.mistral.ai/

**[Qdrant Cloud](https://cloud.qdrant.io/)** (Om cloud istället för lokal)
- **Används för:** Lagring av vektorembeddings för RAG-sökning
- **Kostnad:** Gratis tier 1GB, sedan från $25/månad
- **Alternativ:** Kör lokalt i Docker (gratis)
- **Dokumentation:** https://qdrant.tech/documentation/cloud/

---

## Teknologiöversikt

Förstå vad varje del av systemet gör:

### Payload CMS
**Vad:** Headless CMS som utgör applikationens grund
**Varför:** Hanterar alla dokument, användare och admin-gränssnitt
**Roll:** Core-system som samordnar allt
**Dokumentation:** https://payloadcms.com/docs

### PostgreSQL
**Vad:** Relationsdatabas
**Varför:** Lagrar artiklar, metadata, användare
**Roll:** Primär datakälla för all strukturerad data
**Dokumentation:** https://www.postgresql.org/docs/15/

### Qdrant
**Vad:** Vektordatabas för similarity search
**Varför:** Möjliggör semantisk sökning (mening, inte bara ord)
**Roll:** Kritisk för AI-chattens förmåga att hitta relevant information
**Hur:** Lagrar embeddings (vektorer) av dokumentinnehåll
**Dokumentation:** https://qdrant.tech/documentation/

### OpenAI Embeddings
**Vad:** Text-to-vector API
**Varför:** Konverterar text till numeriska vektorer
**Roll:** Skapar embeddings som lagras i Qdrant
**Hur:** `text → [0.123, -0.456, ...]` (1536 tal)
**Dokumentation:** https://platform.openai.com/docs/guides/embeddings

### Gemini
**Vad:** Googles multimodal AI
**Varför:** Läser dokument, chattar, genererar metadata
**Roll:** Hjärnan som bearbetar och förstår innehåll
**Dokumentation:** https://ai.google.dev/docs

### LibreOffice
**Vad:** Office-svit med headless-läge
**Varför:** Konverterar Word/Excel/PowerPoint till PDF
**Roll:** Pre-processing innan OCR
**Dokumentation:** https://documentation.libreoffice.org/

---

## Produktion med Docker

### Steg 1: Klona repositoryt

```bash
# Via HTTPS
git clone https://github.com/Falkenbergs-kommun/kunskapsportal.git

# Eller via SSH
git clone git@github.com:Falkenbergs-kommun/kunskapsportal.git

# Gå in i mappen
cd kunskapsportal
```

### Steg 2: Konfigurera miljövariabler

```bash
# Kopiera exempel-filen
cp .env.example .env

# Redigera .env med din editor
nano .env
```

**Viktiga inställningar att uppdatera:**

```bash
# Databas (Generera starkt lösenord!)
DATABASE_URI=postgres://knowledge_user:DITT_STARKA_LÖSENORD@postgres:5432/knowledge_base
DB_PASSWORD=DITT_STARKA_LÖSENORD

# Payload CMS (Generera hemlig nyckel, minst 32 tecken!)
PAYLOAD_SECRET=din-mycket-hemliga-nyckel-minst-32-tecken-lång
PAYLOAD_URL=http://localhost:3000

# AI-tjänster (Obligatoriskt)
GEMINI_API_KEY=din-gemini-api-nyckel-här
OPENAI_API_KEY=sk-din-openai-api-nyckel-här

# Qdrant (Lokal Docker-instans)
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=
QDRANT_ENABLED=true

# Valfria AI-tjänster
MISTRAL_API_KEY=din-mistral-api-nyckel-här
PDF_EXTRACTOR=mistral  # eller "gemini"
```

**Säkerhetstips:**
- Använd aldrig samma lösenord i produktion som i exempel-filen
- Generera starka slumpmässiga nycklar: `openssl rand -base64 32`
- Spara `.env` ALDRIG i version control
- Använd miljövariabler eller secrets management i produktion

### Steg 3: Bygg och starta containrar

```bash
# Bygg Docker-imagen
docker-compose build

# Starta alla tjänster
docker-compose up -d

# Följ loggarna (valfritt)
docker-compose logs -f app
```

### Steg 4: Verifiera installation

```bash
# Kontrollera status på alla containrar
docker-compose ps

# Bör visa:
# - app (port 3000) - Running
# - postgres (port 54321) - Healthy
# - qdrant (port 6333) - Running

# Testa hälsokontroll
curl http://localhost:3000/api/health
```

**Förväntat resultat:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 123.456
}
```

### Steg 5: Skapa första användaren

1. Öppna webbläsaren: http://localhost:3000/admin
2. Klicka på **"Create your first user"**
3. Fyll i:
   - **Email:** din@email.se
   - **Password:** (minst 8 tecken)
   - **Confirm Password:** (samma lösenord)
4. Klicka **"Create"**

**Grattis! Du är nu inloggad i Kunskapsportal! 🎉**

### Steg 6: Ladda upp första dokumentet

1. Gå till **Media** i sidomenyn
2. Klicka **"Create new"**
3. Ladda upp en PDF eller Office-fil
4. Gå till **Articles** → **"Create new"**
5. Välj din uppladdade fil under **"Source Documents"**
6. Klicka **"Generate with AI"** för att extrahera innehåll
7. Klicka **"Generate Metadata"** för att skapa metadata
8. Klicka **"Publish"** för att publicera

Dokumentet är nu sökbart via AI-chatten på startsidan!

---

## Lokal utvecklingsmiljö

### Steg 1: Installera förutsättningar

**macOS:**
```bash
# Installera Homebrew om du inte har det
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installera Node.js, PostgreSQL, LibreOffice
brew install node@20 postgresql@15 libreoffice

# Installera pnpm
npm install -g pnpm

# Starta PostgreSQL
brew services start postgresql@15

# Starta Qdrant i Docker
docker run -d -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Ubuntu/Debian:**
```bash
# Uppdatera paketlistan
sudo apt update

# Installera Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installera pnpm
npm install -g pnpm

# Installera PostgreSQL
sudo apt install -y postgresql-15 postgresql-contrib

# Installera LibreOffice
sudo apt install -y libreoffice libreoffice-writer

# Starta PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Starta Qdrant i Docker
docker run -d -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

**Windows (via WSL2):**
```bash
# Installera WSL2 och Ubuntu från Microsoft Store först
# Följ sedan Ubuntu-instruktionerna ovan
```

### Steg 2: Konfigurera PostgreSQL

```bash
# Skapa databas och användare
sudo -u postgres psql

# I PostgreSQL-prompten:
CREATE DATABASE knowledge_base;
CREATE USER knowledge_user WITH PASSWORD 'ditt_lösenord';
GRANT ALL PRIVILEGES ON DATABASE knowledge_base TO knowledge_user;
\q
```

### Steg 3: Klona och installera

```bash
# Klona repositoryt
git clone https://github.com/Falkenbergs-kommun/kunskapsportal.git
cd kunskapsportal

# Installera dependencies
pnpm install
```

### Steg 4: Konfigurera .env.local

```bash
# Kopiera exempel
cp .env.example .env.local

# Redigera för lokal utveckling
nano .env.local
```

**Lokal konfiguration:**

```bash
# Lokala tjänster
NODE_ENV=development
PAYLOAD_SECRET=dev_secret_minst_32_tecken_lång
PAYLOAD_URL=http://localhost:3000

# Lokal PostgreSQL
DATABASE_URI=postgres://knowledge_user:ditt_lösenord@localhost:5432/knowledge_base

# Lokal Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_ENABLED=true

# AI-tjänster
GEMINI_API_KEY=din-gemini-nyckel
OPENAI_API_KEY=sk-din-openai-nyckel
MISTRAL_API_KEY=din-mistral-nyckel
PDF_EXTRACTOR=mistral

# Utvecklingsinställningar
NEXT_TELEMETRY_DISABLED=1
```

### Steg 5: Starta utvecklingsserver

```bash
# Generera TypeScript-typer
pnpm generate:types

# Starta utvecklingsserver
pnpm dev
```

**Servern startar på:** http://localhost:3000

**Hot reload aktiverat** - Alla ändringar uppdateras automatiskt!

---

## Konfiguration

### Databasinställningar

**PostgreSQL-optimering för produktion:**

```sql
-- Kör i PostgreSQL som superuser
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Ladda om konfigurationen
SELECT pg_reload_conf();
```

### Qdrant-konfiguration

**Lokal Qdrant med persistence:**

```bash
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  -e QDRANT__SERVICE__HTTP_PORT=6333 \
  qdrant/qdrant
```

**Qdrant Cloud:**

```bash
# I .env
QDRANT_URL=https://xyz-abc123.eu-central.aws.cloud.qdrant.io
QDRANT_API_KEY=din-cloud-api-nyckel
```

### AI-tjänster konfiguration

**Välj PDF-extraktor:**

```bash
# Använd Mistral (snabbare, billigare)
PDF_EXTRACTOR=mistral
MISTRAL_API_KEY=din-mistral-nyckel

# Eller använd Gemini (bättre precision)
PDF_EXTRACTOR=gemini
GEMINI_API_KEY=din-gemini-nyckel
```

---

## Databas-initialisering

### Automatisk initialisering (Docker)

Om du använder Docker och startar från scratch, initialiseras databasen automatiskt första gången Payload CMS startar.

### Manuell initialisering (Utveckling)

Om du kör lokal utveckling och behöver initiera/återställa databasen:

```bash
# Radera befintlig databas (VARNING: Raderar all data!)
psql -U postgres -c "DROP DATABASE IF EXISTS knowledge_base;"
psql -U postgres -c "CREATE DATABASE knowledge_base;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE knowledge_base TO knowledge_user;"

# Starta dev-server, Payload skapar tabeller automatiskt
pnpm dev
```

### Synkronisera Qdrant

Efter att du publicerat dokument, synkronisera till Qdrant:

```bash
# Synka alla aktiva dokument till vektordatabasen
pnpm sync:qdrant
```

---

## Felsökning

### Problem: Docker-containern startar inte

**Kontrollera loggar:**
```bash
docker-compose logs app
```

**Vanliga orsaker:**
- Port 3000 redan upptagen: `lsof -i :3000`
- Databasanslutning misslyckades: Kontrollera DATABASE_URI
- Saknade API-nycklar: Kontrollera GEMINI_API_KEY och OPENAI_API_KEY

**Lösning:**
```bash
# Stoppa alla containrar
docker-compose down

# Ta bort gamla volymer (VARNING: Raderar data!)
docker-compose down -v

# Bygg om från scratch
docker-compose build --no-cache
docker-compose up -d
```

### Problem: "relation does not exist" i databas

**Orsak:** Databastabeller har inte skapats.

**Lösning (Docker):**
```bash
# Kör en lokal dev-server mot Docker-databasen för att skapa tabeller
DATABASE_URI=postgres://knowledge_user:password@localhost:54321/knowledge_base pnpm dev

# Tryck Ctrl+C efter att tabellerna skapats
# Starta om Docker-appen
docker-compose restart app
```

### Problem: LibreOffice-konvertering fungerar inte

**Kontrollera installation:**
```bash
# I Docker-container
docker-compose exec app libreoffice --version

# Lokalt
libreoffice --version
```

**Lösning:**
```bash
# macOS
brew reinstall libreoffice

# Ubuntu
sudo apt install --reinstall libreoffice libreoffice-writer

# Docker: Bygg om imagen
docker-compose build --no-cache app
```

### Problem: Qdrant-anslutning misslyckades

**Kontrollera status:**
```bash
# Lokal Qdrant
curl http://localhost:6333/health

# Cloud Qdrant
curl https://your-cluster.qdrant.io/health \
  -H "api-key: your-api-key"
```

**Lösning:**
```bash
# Starta om Qdrant
docker restart qdrant

# Eller starta ny container
docker run -d -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

### Problem: API-nycklar fungerar inte

**Testa direkt:**
```bash
# Gemini
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

### Problem: Minnesfel (Out of Memory)

**Lösning Docker:**
```bash
# Öka Docker-minne i Docker Desktop → Settings → Resources

# Eller i docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 4G
```

**Lösning Node.js:**
```bash
# I package.json scripts, öka --max-old-space-size
NODE_OPTIONS="--max-old-space-size=4096"
```

---

## Nästa steg

Nu när du har installerat Kunskapsportal:

1. **[Användarguide](user-guide.md)** - Lär dig använda systemet
2. **[API-dokumentation](api.md)** - Integrera med andra system
3. **[Utvecklingsguide](development.md)** - Bidra med kod
4. **[Deployment-guide](deployment.md)** - Driftsätt i produktion

---

## Support

**Problem?** Öppna en issue på GitHub:
https://github.com/Falkenbergs-kommun/kunskapsportal/issues

**Säkerhetsproblem?** Maila: security@falkenberg.se
