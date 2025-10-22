---
sidebar_position: 1
slug: /
title: Översikt
description: AI-driven kunskapsdatabas för svensk kommunal förvaltning
---

# Kunskapsportal

**AI-driven kunskapsdatabas för svensk kommunal förvaltning**

Open source-system för kunskapshantering, specialbyggt för svenska kommuner och offentlig sektor. Systemet använder AI för att automatiskt bearbeta dokument, generera metadata och möjliggöra intelligent sökning och AI-chatt.

> 🏛️ Byggt för kommunala behov | 💬 Chatta med dina dokument | 🤖 Automatisk AI-bearbetning

## 🚀 Snabbstart

Nya användare börjar här:

1. **[Installation](installation.md)** - Kom igång med Docker eller lokal utveckling
2. **[Användarguide](user-guide.md)** - Lär dig använda systemet
3. **[API-dokumentation](api.md)** - Integrera med externa system

---

## 📚 Komplett dokumentation

### 📖 Användarguider

- **[Användarguide](user-guide.md)** - Komplett guide för slutanvändare
  - Ladda upp dokument
  - AI-funktioner (OCR, metadata, chatt)
  - Sök och organisera innehåll
  - Best practices

### 🔧 Installation & Drift

- **[Installation](installation.md)** - Steg-för-steg installationsguide
  - Docker Compose setup
  - Lokal utvecklingsmiljö
  - API-nycklar och konfiguration
  - Felsökning

- **[Deployment](deployment.md)** - Produktionsdriftsättning
  - Docker deployment med Nginx
  - Cloud providers (Railway, Vercel, DigitalOcean)
  - Säkerhet och brandväggar
  - Backup och monitoring
  - Skalning

### 💻 Utveckling

- **[Utvecklingsguide](development.md)** - För utvecklare och bidragsgivare
  - Projektstruktur
  - Utvecklingsworkflow
  - Kodstandarder
  - Testa och bidra

- **[API-dokumentation](api.md)** - REST och GraphQL API
  - Autentisering med JWT
  - REST endpoints
  - GraphQL queries och mutations
  - Webhooks
  - Kodexempel (Node.js, Python, cURL)

---

## 🏗️ Teknisk Arkitektur

Kunskapsportal bygger på moderna, beprövade teknologier:

### Kärnsystem
- **[Payload CMS 3.50](https://payloadcms.com/)** - Headless CMS och admin-gränssnitt
- **[Next.js 15](https://nextjs.org/)** - React-baserat frontend-ramverk
- **[PostgreSQL 15](https://www.postgresql.org/)** - Relationsdatabas
- **[Qdrant](https://qdrant.tech/)** - Vektordatabas för RAG

### AI-stack
- **[Google Gemini Flash](https://ai.google.dev/)** - OCR, chatt, metadatagenerering
- **[OpenAI Embeddings](https://platform.openai.com/)** - Text-to-vector för semantisk sökning
- **[Mistral AI](https://mistral.ai/)** - Alternativ OCR-motor

### Frontend
- **[React 19](https://react.dev/)** - UI-bibliotek
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS
- **[shadcn/ui](https://ui.shadcn.com/)** - Komponentbibliotek

---

## 🔄 Så fungerar RAG-arkitekturen

**RAG (Retrieval Augmented Generation)** är hjärtat i Kunskapsportal:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. DOKUMENTUPPLADDNING → AI-BEARBETNING                        │
├─────────────────────────────────────────────────────────────────┤
│  PDF/Office → Payload CMS → Gemini OCR → PostgreSQL            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. PUBLICERING → VEKTORISERING                                  │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL → OpenAI Embeddings → Vektorer → Qdrant            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. SÖKNING → RAG-CHATT                                          │
├─────────────────────────────────────────────────────────────────┤
│  Fråga → Embedding → Qdrant Search → Dokument → Gemini → Svar  │
└─────────────────────────────────────────────────────────────────┘
```

**Resultat:** AI som svarar baserat på ERA faktiska dokument med källhänvisningar!

---

## ✨ Huvudfunktioner

### 🏛️ Specialbyggt för Kommunal Förvaltning
- GDPR-flaggor och säkerhetsklassificering
- WCAG 2.1 AA tillgänglighetsspårning
- Juridisk struktur med rättslig grund
- Livscykelhantering och versionskontroll
- Svenska-först i hela gränssnittet

### 💬 Konversationssökning med AI
- RAG-powered AI-assistent
- Semantisk vektorsökning via Qdrant
- Källhänvisningar med direktlänkar
- Hierarkisk filtrering på verksamhetsområden

### 🤖 Automatisk Dokumentbearbetning
- AI OCR för PDF, Word, Excel, PowerPoint
- Smart metadatagenerering på svenska
- Innehållsstrukturering med rich-text
- Extrahering och inbäddning av bilder

---

## 🤝 Bidra

Vi välkomnar bidrag från open source-communityn!

- **[Rapportera buggar](https://github.com/Falkenbergs-kommun/kunskapsportal/issues/new)**
- **[Feature requests](https://github.com/Falkenbergs-kommun/kunskapsportal/issues/new)**
- **[Pull requests](https://github.com/Falkenbergs-kommun/kunskapsportal/pulls)**

**Kodstandarder:**
- TypeScript strict mode
- ESLint + Prettier
- Konventionella commit-meddelanden
- Tester för ny funktionalitet

---

## 📄 Licens

MIT License - Copyright (c) 2025 Falkenbergs kommun

Se [LICENSE](https://github.com/Falkenbergs-kommun/kunskapsportal/blob/main/LICENSE) för fullständig licenstext.

---

## 🔗 Länkar

- **[GitHub Repository](https://github.com/Falkenbergs-kommun/kunskapsportal)**
- **[Issue Tracker](https://github.com/Falkenbergs-kommun/kunskapsportal/issues)**
- **[Falkenbergs kommun](https://falkenberg.se/)**

---

## 📧 Support

**Frågor?** Öppna en issue: [GitHub Issues](https://github.com/Falkenbergs-kommun/kunskapsportal/issues)

**Kontakt:** utvecklingsavdelningen@falkenberg.se

---

**Utvecklat av utvecklingsavdelningen, Falkenbergs kommun för svensk offentlig sektor**
