# API-dokumentation - Kunskapsportal

Kunskapsportal erbjuder både REST API och GraphQL för att integrera med externa system.

## Teknisk bakgrund

API:et är byggt på **[Payload CMS 3.50](https://payloadcms.com/)** som automatiskt genererar RESTful endpoints och GraphQL-queries för alla collections (Articles, Media, Departments, Users). Utöver Payloads standardfunktioner har vi lagt till custom endpoints för AI-funktioner (chatt, innehållsextrahering, metadatagenerering).

**Teknologier:**
- **[Payload CMS](https://payloadcms.com/docs/rest-api/overview)** - Auto-genererat REST API och GraphQL
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Custom endpoints
- **JWT (JSON Web Tokens)** - Autentisering och behörighet
- **PostgreSQL** - Databaslagring via Payload

**Läs mer:**
- [Payload CMS REST API Dokumentation](https://payloadcms.com/docs/rest-api/overview)
- [Payload CMS GraphQL Dokumentation](https://payloadcms.com/docs/graphql/overview)

## Innehållsförteckning

- [Autentisering](#autentisering)
- [REST API](#rest-api)
- [GraphQL API](#graphql-api)
- [Webhooks](#webhooks)
- [Felhantering](#felhantering)
- [Rate Limiting](#rate-limiting)
- [Exempel](#exempel)

---

## Autentisering

Kunskapsportal använder JWT (JSON Web Tokens) för autentisering.

### Skaffa en JWT-token

```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "din@email.se",
  "password": "ditt_lösenord"
}
```

**Respons:**
```json
{
  "message": "Auth Passed",
  "user": {
    "id": 1,
    "email": "din@email.se",
    "collection": "users"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "exp": 1234567890
}
```

### Använd token i requests

```bash
GET /api/articles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## REST API

### Bas-URL

```
http://localhost:3000/api
```

### Endpoints

#### Collections

Payload genererar automatiskt REST endpoints för alla collections:

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/api/{collection}` | Hämta alla dokument |
| GET | `/api/{collection}/:id` | Hämta specifikt dokument |
| POST | `/api/{collection}` | Skapa nytt dokument |
| PATCH | `/api/{collection}/:id` | Uppdatera dokument |
| DELETE | `/api/{collection}/:id` | Radera dokument |

**Collections:**
- `articles` - Artiklar/dokument
- `media` - Uppladdade filer
- `departments` - Verksamhetsområden
- `users` - Användare (kräver admin)

#### Artiklar

**GET /api/articles**

Hämta alla artiklar.

```bash
GET /api/articles?limit=10&page=1&where[_status][equals]=published
```

**Query parameters:**
- `limit` - Antal per sida (default: 10)
- `page` - Sidnummer (default: 1)
- `where` - Filtrering (JSON)
- `sort` - Sortering (fältnamn eller `-fältnamn` för desc)
- `depth` - Antal nivåer för relationer (default: 1)

**Respons:**
```json
{
  "docs": [
    {
      "id": 1,
      "title": "GDPR-policy",
      "slug": "gdpr-policy",
      "summary": "Kommunens policy för hantering av personuppgifter",
      "documentStatus": "active",
      "_status": "published",
      "department": {
        "id": 2,
        "name": "IT-avdelningen"
      },
      "createdAt": "2025-10-07T10:00:00.000Z",
      "updatedAt": "2025-10-07T12:00:00.000Z"
    }
  ],
  "totalDocs": 42,
  "limit": 10,
  "totalPages": 5,
  "page": 1,
  "pagingCounter": 1,
  "hasPrevPage": false,
  "hasNextPage": true
}
```

**GET /api/articles/:id**

Hämta specifik artikel.

```bash
GET /api/articles/1?depth=2
```

**POST /api/articles**

Skapa ny artikel.

```bash
POST /api/articles
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Ny policy",
  "slug": "ny-policy",
  "content": {
    "root": {
      "children": [
        {
          "type": "p",
          "children": [{ "text": "Innehållet här..." }]
        }
      ]
    }
  },
  "documentType": "policy",
  "department": 2,
  "_status": "draft"
}
```

**PATCH /api/articles/:id**

Uppdatera artikel.

```bash
PATCH /api/articles/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Uppdaterad titel",
  "_status": "published"
}
```

**DELETE /api/articles/:id**

Radera artikel.

```bash
DELETE /api/articles/1
Authorization: Bearer {token}
```

#### Media

**POST /api/media**

Ladda upp fil.

```bash
POST /api/media
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
alt: "Beskrivning av filen"
```

**Respons:**
```json
{
  "doc": {
    "id": 1,
    "filename": "dokument.pdf",
    "mimeType": "application/pdf",
    "filesize": 1234567,
    "url": "/media/dokument.pdf",
    "alt": "Beskrivning av filen",
    "createdAt": "2025-10-07T10:00:00.000Z"
  },
  "message": "Upload successful"
}
```

#### Verksamhetsområden

**GET /api/departments**

Hämta alla verksamhetsområden.

```bash
GET /api/departments?depth=2
```

**Respons:**
```json
{
  "docs": [
    {
      "id": 1,
      "name": "Socialtjänst",
      "slug": "socialtjanst",
      "description": "Socialtjänstens verksamheter",
      "parent": null,
      "children": [
        {
          "id": 2,
          "name": "Äldreomsorgen",
          "slug": "aldreomsorg"
        }
      ]
    }
  ]
}
```

### Custom Endpoints

#### Hälsokontroll

**GET /api/health**

Kontrollera systemstatus.

```bash
GET /api/health
```

**Respons:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 3600.123
}
```

#### Sök artikel via slug

**GET /api/article-by-slug**

Hämta artikel baserat på slug.

```bash
GET /api/article-by-slug?slug=gdpr-policy
```

**Respons:**
```json
{
  "article": {
    "id": 1,
    "title": "GDPR-policy",
    "slug": "gdpr-policy",
    "content": { ... },
    "department": { ... }
  }
}
```

#### AI Chat

**POST /api/chat**

Ställ fråga till AI-assistenten.

```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Hur ansöker man om bygglov?",
  "departmentId": 5
}
```

**Respons (streaming):**
```
data: {"type":"token","content":"För"}
data: {"type":"token","content":" att"}
data: {"type":"token","content":" ansöka"}
...
data: {"type":"sources","sources":[{"id":1,"title":"Bygglovsprocess","slug":"bygglov"}]}
data: {"type":"done"}
```

#### Generera innehåll med AI

**POST /api/generate-content/:id**

Generera artikelinnehåll från källdokument.

```bash
POST /api/generate-content/1
Authorization: Bearer {token}
```

**Respons:**
```json
{
  "success": true,
  "message": "Content generated successfully"
}
```

#### Generera metadata med AI

**POST /api/generate-metadata**

Generera metadata för artikel.

```bash
POST /api/generate-metadata
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 1
}
```

**Respons:**
```json
{
  "success": true,
  "article": {
    "id": 1,
    "title": "AI-genererad titel",
    "summary": "AI-genererad sammanfattning...",
    "slug": "ai-genererad-slug",
    "documentType": "policy",
    "keywords": [
      { "keyword": "GDPR" },
      { "keyword": "personuppgifter" }
    ]
  }
}
```

---

## GraphQL API

### Endpoint

```
http://localhost:3000/api/graphql
```

### GraphQL Playground

Utforska API:et interaktivt:

```
http://localhost:3000/api/graphql-playground
```

### Queries

#### Hämta artiklar

```graphql
query {
  Articles(limit: 10, where: { _status: { equals: published } }) {
    docs {
      id
      title
      slug
      summary
      documentStatus
      department {
        name
        slug
      }
      createdAt
    }
    totalDocs
    hasNextPage
  }
}
```

#### Hämta specifik artikel

```graphql
query {
  Article(id: 1) {
    id
    title
    slug
    content
    department {
      name
      parent {
        name
      }
    }
    keywords {
      keyword
    }
    relatedDocuments {
      title
      slug
    }
  }
}
```

#### Hämta verksamhetsområden

```graphql
query {
  Departments {
    docs {
      id
      name
      slug
      description
      children {
        name
        slug
      }
    }
  }
}
```

### Mutations

#### Skapa artikel

```graphql
mutation {
  createArticle(
    data: {
      title: "Ny artikel"
      slug: "ny-artikel"
      documentType: policy
      _status: draft
    }
  ) {
    id
    title
    slug
  }
}
```

#### Uppdatera artikel

```graphql
mutation {
  updateArticle(
    id: 1
    data: {
      title: "Uppdaterad titel"
      _status: published
      documentStatus: active
    }
  ) {
    id
    title
    _status
  }
}
```

#### Radera artikel

```graphql
mutation {
  deleteArticle(id: 1) {
    id
    title
  }
}
```

### Autentisering i GraphQL

```graphql
mutation {
  loginUser(email: "din@email.se", password: "lösenord") {
    token
    user {
      id
      email
    }
    exp
  }
}
```

Använd sedan token i headers:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Webhooks

Webhooks låter dig få meddelanden när händelser inträffar i systemet.

### Konfigurera webhook

I `payload.config.ts`:

```typescript
export default buildConfig({
  collections: [
    {
      slug: 'articles',
      hooks: {
        afterChange: [
          async ({ doc, operation }) => {
            // Skicka webhook
            await fetch('https://din-webhook-url.se/endpoint', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'article.changed',
                operation: operation, // 'create', 'update', 'delete'
                data: doc
              })
            })
          }
        ]
      }
    }
  ]
})
```

### Webhook-händelser

**Articles:**
- `article.created` - Ny artikel skapad
- `article.updated` - Artikel uppdaterad
- `article.deleted` - Artikel raderad
- `article.published` - Artikel publicerad
- `article.unpublished` - Artikel avpublicerad

**Media:**
- `media.uploaded` - Fil uppladdad
- `media.deleted` - Fil raderad

**Example payload:**
```json
{
  "event": "article.published",
  "operation": "update",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "data": {
    "id": 1,
    "title": "GDPR-policy",
    "_status": "published",
    "documentStatus": "active"
  }
}
```

---

## Felhantering

### HTTP Statuskoder

| Kod | Betydelse | Beskrivning |
|-----|-----------|-------------|
| 200 | OK | Lyckad request |
| 201 | Created | Resurs skapad |
| 400 | Bad Request | Ogiltig request |
| 401 | Unauthorized | Autentisering krävs |
| 403 | Forbidden | Nekad åtkomst |
| 404 | Not Found | Resursen finns inte |
| 500 | Internal Server Error | Serverfel |

### Felformat

```json
{
  "errors": [
    {
      "message": "Field \"title\" is required",
      "field": "title",
      "code": "REQUIRED_FIELD"
    }
  ]
}
```

**Vanliga felkoder:**
- `REQUIRED_FIELD` - Obligatoriskt fält saknas
- `INVALID_VALUE` - Ogiltigt värde
- `DUPLICATE_VALUE` - Värdet finns redan (t.ex. slug)
- `UNAUTHORIZED` - Inte autentiserad
- `FORBIDDEN` - Inte behörig
- `NOT_FOUND` - Resursen finns inte

---

## Rate Limiting

För att skydda API:et finns rate limiting:

**Gränser:**
- **Autentiserade requests:** 100 requests / minut
- **Oautentiserade requests:** 20 requests / minut
- **Upload endpoints:** 10 requests / minut

**Headers i respons:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

**Vid överskridande:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Exempel

### Node.js / TypeScript

```typescript
import fetch from 'node-fetch';

// Autentisera
const login = async () => {
  const response = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'din@email.se',
      password: 'lösenord'
    })
  });
  const data = await response.json();
  return data.token;
};

// Hämta artiklar
const getArticles = async (token: string) => {
  const response = await fetch('http://localhost:3000/api/articles?limit=10', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Skapa artikel
const createArticle = async (token: string) => {
  const response = await fetch('http://localhost:3000/api/articles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Ny artikel',
      slug: 'ny-artikel',
      _status: 'draft'
    })
  });
  return response.json();
};

// Användning
const token = await login();
const articles = await getArticles(token);
console.log(articles);
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3000/api'

# Autentisera
def login():
    response = requests.post(f'{BASE_URL}/users/login', json={
        'email': 'din@email.se',
        'password': 'lösenord'
    })
    return response.json()['token']

# Hämta artiklar
def get_articles(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/articles?limit=10', headers=headers)
    return response.json()

# Skapa artikel
def create_article(token, data):
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.post(f'{BASE_URL}/articles', json=data, headers=headers)
    return response.json()

# Användning
token = login()
articles = get_articles(token)
print(articles)
```

### cURL

```bash
# Autentisera
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"din@email.se","password":"lösenord"}'

# Hämta artiklar
curl http://localhost:3000/api/articles?limit=10 \
  -H "Authorization: Bearer {TOKEN}"

# Skapa artikel
curl -X POST http://localhost:3000/api/articles \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ny artikel",
    "slug": "ny-artikel",
    "_status": "draft"
  }'

# Ladda upp fil
curl -X POST http://localhost:3000/api/media \
  -H "Authorization: Bearer {TOKEN}" \
  -F "file=@/path/to/document.pdf" \
  -F "alt=Dokumentbeskrivning"
```

---

## SDK & Klientbibliotek

För enklare integration, överväg att använda Payload's officiella SDK:

```bash
npm install @payloadcms/client
```

```typescript
import { PayloadClient } from '@payloadcms/client';

const client = new PayloadClient({
  serverURL: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// Hämta artiklar
const articles = await client.find({
  collection: 'articles',
  limit: 10,
  where: {
    _status: { equals: 'published' }
  }
});
```

---

## Support

**Frågor om API:et?**
- 📖 [Payload CMS API Docs](https://payloadcms.com/docs/rest-api/overview)
- 🐛 [Öppna issue](https://github.com/Falkenbergs-kommun/kunskapsportal/issues)

**Säkerhetsproblem?**
- 🔒 Maila: security@falkenberg.se
