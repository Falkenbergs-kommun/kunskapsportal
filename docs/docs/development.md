---
sidebar_position: 5
title: Utveckling
description: Guide för utvecklare som vill bidra till eller anpassa Kunskapsportal
---

# Utveckling

Guide för utvecklare som vill bidra till eller anpassa Kunskapsportal.

## Innehållsförteckning

- [Kom igång](#kom-igång)
- [Projektstruktur](#projektstruktur)
- [Utvecklingsworkflow](#utvecklingsworkflow)
- [Kodstandarder](#kodstandarder)
- [Testa](#testa)
- [Anpassa systemet](#anpassa-systemet)
- [Bidra](#bidra)

---

## Kom igång

### Förutsättningar

Du behöver installera följande teknologier lokalt:

- **[Node.js](https://nodejs.org/) 20.9.0+** - JavaScript runtime för Next.js och Payload CMS
- **[pnpm](https://pnpm.io/) 9 eller 10** - Pakethanterare (snabbare än npm)
- **[PostgreSQL](https://www.postgresql.org/) 15+** - Relationsdatabas för Payload CMS
- **[Qdrant](https://qdrant.tech/)** - Vektordatabas (kör lokalt med Docker eller använd [Qdrant Cloud](https://cloud.qdrant.io/))
- **[Git](https://git-scm.com/)** - Versionshantering
- **[LibreOffice](https://www.libreoffice.org/)** - För konvertering av Office-dokument till PDF
- **Code editor** - VS Code rekommenderas

**API-nycklar:**
Du behöver också API-nycklar från:
- [Google Gemini API](https://makersuite.google.com/app/apikey) - För AI-funktioner
- [OpenAI API](https://platform.openai.com/api-keys) - För text embeddings
- (Valfritt) [Mistral API](https://console.mistral.ai/) - Alternativ OCR-motor

### Klona och installera

```bash
# Forka repositoryt på GitHub först, sedan:
git clone https://github.com/DIN-ANVÄNDARNAMN/kunskapsportal.git
cd kunskapsportal

# Installera dependencies
pnpm install

# Kopiera miljövariabler
cp .env.example .env.local

# Redigera .env.local med dina credentials
```

### Starta utvecklingsserver

```bash
pnpm dev
```

**Öppna:** http://localhost:3000

**Hot reload aktiverat** - Alla ändringar uppdateras automatiskt!

---

## Projektstruktur

```
kunskapsportal/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (frontend)/          # Publika sidor
│   │   │   ├── layout.tsx       # Layout med sidopaneler
│   │   │   ├── [...slug]/       # Dynamiska artikelsidor
│   │   │   └── docs/            # Dokumentation
│   │   ├── (payload)/           # Payload admin
│   │   │   └── admin/           # Admin-gränssnitt
│   │   ├── api/                 # Custom API routes
│   │   │   ├── chat/            # AI-chat endpoint
│   │   │   ├── health/          # Hälsokontroll
│   │   │   └── article-by-slug/ # Slug-baserad sökning
│   │   └── preview/             # Draft preview
│   │
│   ├── collections/             # Payload CMS collections
│   │   ├── Articles.ts          # Artiklar/dokument
│   │   ├── Departments.ts       # Verksamhetsområden
│   │   ├── Media.ts             # Filer
│   │   └── Users.ts             # Användare
│   │
│   ├── components/              # React-komponenter
│   │   ├── ui/                  # shadcn/ui komponenter
│   │   ├── ArticleDisplay.tsx   # Artikelvisning
│   │   ├── PlainChat.tsx        # AI-chatt
│   │   ├── app-sidebar.tsx      # Vänster sidopanel
│   │   └── ...
│   │
│   ├── endpoints/               # Payload custom endpoints
│   │   ├── generateContent.ts   # AI innehållsextrahering
│   │   └── generateMetadata.ts  # AI metadatagenerering
│   │
│   ├── services/                # Tjänster
│   │   ├── geminiChat.ts        # Gemini AI chat
│   │   ├── qdrantSearch.ts      # Vektorsökning
│   │   ├── enhancedSearch.ts    # Förbättrad sökning
│   │   └── ...
│   │
│   ├── qdrant/                  # Qdrant integration
│   │   └── index.ts             # Vektordatabas-operationer
│   │
│   ├── scripts/                 # Utility scripts
│   │   └── syncQdrantActiveDocuments.ts
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── usePersistedState.ts
│   │
│   └── payload.config.ts        # Payload CMS konfiguration
│
├── public/                      # Statiska filer
├── docs/                        # Dokumentation
├── dev/                         # Utvecklingsresurser (gitignored)
│   ├── playwright.config.ts    # E2E test-config
│   └── vitest.config.mts       # Unit test-config
│
├── Dockerfile                   # Production Docker image
├── docker-compose.yml           # Multi-container setup
├── next.config.mjs              # Next.js konfiguration
├── tailwind.config.ts           # Tailwind CSS konfiguration
├── tsconfig.json                # TypeScript konfiguration
├── package.json                 # Dependencies och scripts
├── CLAUDE.md                    # AI-utvecklingsguide
└── README.md                    # Projektöversikt
```

---

## Utvecklingsworkflow

### Branch-strategi

```bash
main            # Produktionsklar kod
└── feature/*   # Nya funktioner
└── bugfix/*    # Buggfixar
└── hotfix/*    # Snabba produktionsfixar
```

### Skapa en feature branch

```bash
# Uppdatera main
git checkout main
git pull origin main

# Skapa feature branch
git checkout -b feature/min-nya-funktion

# Gör ändringar...
git add .
git commit -m "feat: lägg till ny funktion"

# Pusha
git push origin feature/min-nya-funktion
```

### Commit-meddelanden

Vi följer [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: ny funktion
fix: buggfix
docs: dokumentation
style: formatering (ingen funktionell ändring)
refactor: omstrukturering
test: tester
chore: dependencies, config
```

**Exempel:**
```bash
git commit -m "feat: lägg till departmentsfiltrering i chat"
git commit -m "fix: rätta crash vid tom sökfråga"
git commit -m "docs: uppdatera API-dokumentation"
```

### Pull Requests

1. Pusha din branch till GitHub
2. Öppna en Pull Request mot `main`
3. Beskriv ändringar tydligt
4. Vänta på code review
5. Åtgärda feedback
6. Merga efter godkännande

---

## Kodstandarder

### TypeScript

**Använd alltid typer:**

```typescript
// ✅ Bra
interface Article {
  id: number;
  title: string;
  content: any;
}

const getArticle = async (id: string): Promise<Article> => {
  // ...
}

// ❌ Dåligt
const getArticle = async (id) => {
  // ...
}
```

### Filstruktur

**Components:**
```typescript
// src/components/MyComponent.tsx

import { FC } from 'react'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div>
      <h1>{title}</h1>
      {onAction && <button onClick={onAction}>Klicka</button>}
    </div>
  )
}
```

**Services:**
```typescript
// src/services/myService.ts

export const myService = {
  fetchData: async () => {
    // ...
  },

  processData: (data: any) => {
    // ...
  }
}
```

### ESLint & Prettier

**Kör linting:**
```bash
pnpm lint
```

**Autofixa:**
```bash
pnpm lint --fix
```

**VS Code inställningar (.vscode/settings.json):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Testa

### Unit-tester (Vitest)

**Kör tester:**
```bash
pnpm test:int
```

**Watch mode:**
```bash
pnpm exec vitest --config ./dev/vitest.config.mts
```

**Exempel test:**
```typescript
// src/services/__tests__/qdrantSearch.test.ts

import { describe, it, expect } from 'vitest'
import { searchQdrant } from '../qdrantSearch'

describe('qdrantSearch', () => {
  it('should return search results', async () => {
    const results = await searchQdrant('test query')
    expect(results).toBeInstanceOf(Array)
  })

  it('should handle empty query', async () => {
    const results = await searchQdrant('')
    expect(results).toEqual([])
  })
})
```

### E2E-tester (Playwright)

**Kör E2E-tester:**
```bash
pnpm test:e2e
```

**Interaktivt läge:**
```bash
pnpm exec playwright test --config=dev/playwright.config.ts --ui
```

**Exempel test:**
```typescript
// dev/tests/e2e/frontend.spec.ts

import { test, expect } from '@playwright/test'

test('should load homepage', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle(/Kunskapsportal/)
})

test('should open chat', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await page.click('[data-testid="chat-button"]')
  await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible()
})
```

---

## Anpassa systemet

### Lägg till ny collection

**1. Skapa collection-fil:**

```typescript
// src/collections/MyCollection.ts

import { CollectionConfig } from 'payload'

export const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  labels: {
    singular: 'My Item',
    plural: 'My Items'
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Namn'
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beskrivning'
    }
  ]
}
```

**2. Registrera i payload.config.ts:**

```typescript
import { MyCollection } from './collections/MyCollection'

export default buildConfig({
  collections: [
    Users,
    Media,
    Articles,
    Departments,
    MyCollection  // ← Lägg till här
  ]
})
```

**3. Generera TypeScript-typer:**

```bash
pnpm generate:types
```

### Lägg till custom endpoint

**1. Skapa endpoint-fil:**

```typescript
// src/endpoints/myEndpoint.ts

import type { Endpoint, PayloadRequest } from 'payload'

export const myEndpoint: Endpoint = {
  path: '/my-endpoint',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    try {
      const { data } = req.body as any

      // Din logik här
      const result = await processData(data)

      return Response.json({
        success: true,
        result
      })
    } catch (error) {
      return Response.json({
        success: false,
        message: error.message
      }, { status: 500 })
    }
  }
}
```

**2. Registrera i payload.config.ts:**

```typescript
import { myEndpoint } from './endpoints/myEndpoint'

export default buildConfig({
  endpoints: [
    myEndpoint  // ← Lägg till här
  ]
})
```

### Lägg till ny AI-tjänst

**1. Skapa service-fil:**

```typescript
// src/services/myAI.ts

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.MY_AI_API_KEY || '')

export const processWithMyAI = async (
  content: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash'
  })

  const result = await model.generateContent(content)
  const response = await result.response
  return response.text()
}
```

**2. Använd i endpoint:**

```typescript
import { processWithMyAI } from '@/services/myAI'

const processed = await processWithMyAI(document.content)
```

### Customiza UI

**Lägg till ny shadcn-komponent:**

```bash
# Installera ny komponent
pnpx shadcn@latest add button

# Använd i din kod
import { Button } from '@/components/ui/button'
```

**Anpassa Tailwind:**

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        'kommun-blue': '#003366',
        'kommun-green': '#00A859'
      }
    }
  }
}
```

---

## Bidra

### Rapportera buggar

Öppna en [issue](https://github.com/Falkenbergs-kommun/kunskapsportal/issues/new) med:

- ✅ Tydlig titel
- ✅ Steg för att reproducera
- ✅ Förväntad vs. faktiskt beteende
- ✅ Screenshots om relevant
- ✅ Browser/OS/version

### Föreslå features

Öppna en [feature request](https://github.com/Falkenbergs-kommun/kunskapsportal/issues/new?template=feature_request.md) med:

- ✅ Beskriv problemet
- ✅ Föreslå lösning
- ✅ Alternativ du övervägt
- ✅ Varför det är värdefullt

### Skicka Pull Request

**Checklist:**
- [ ] Koden följer projektstandarder
- [ ] Alla tester passerar
- [ ] Ny funktionalitet har tester
- [ ] Dokumentation uppdaterad
- [ ] Commit-meddelanden följer konventionen
- [ ] PR-beskrivning är tydlig

**PR-template:**

```markdown
## Beskrivning
Förklara vad din PR gör.

## Typ av ändring
- [ ] Buggfix
- [ ] Ny feature
- [ ] Breaking change
- [ ] Dokumentation

## Hur har det testats?
Beskriv hur du testat.

## Checklist
- [ ] Kod följer style guide
- [ ] Tester tillagda/uppdaterade
- [ ] Dokumentation uppdaterad
```

---

## Tips & Tricks

### Debug med VS Code

**.vscode/launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Hot reload för Payload config

```bash
# Starta med watch mode
pnpm dev
```

Ändringar i `payload.config.ts` eller collections laddas automatiskt.

### Snabb databas-reset

```bash
# Radera och återskapa databas
psql -U postgres -c "DROP DATABASE knowledge_base;"
psql -U postgres -c "CREATE DATABASE knowledge_base;"

# Starta dev-server för att skapa tabeller
pnpm dev
```

### Qdrant lokalt

```bash
# Starta Qdrant
docker run -d -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  --name qdrant \
  qdrant/qdrant

# Qdrant UI
open http://localhost:6333/dashboard
```

---

## Vanliga problem

### "Module not found" fel

```bash
# Rensa och installera om
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript-fel efter Payload-ändringar

```bash
# Regenerera typer
pnpm generate:types
```

### Port redan upptagen

```bash
# Hitta process på port 3000
lsof -i :3000

# Döda processen
kill -9 <PID>
```

### Build-fel i Docker

```bash
# Bygg om utan cache
docker-compose build --no-cache
```

---

## Resurser

**Dokumentation:**
- [Next.js Docs](https://nextjs.org/docs)
- [Payload CMS Docs](https://payloadcms.com/docs)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [shadcn/ui](https://ui.shadcn.com/)

**Community:**
- [GitHub Discussions](https://github.com/Falkenbergs-kommun/kunskapsportal/discussions)
- [Issues](https://github.com/Falkenbergs-kommun/kunskapsportal/issues)

---

**Tack för ditt bidrag till Kunskapsportal! 🙏**
