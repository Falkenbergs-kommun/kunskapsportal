# 🚀 Knowledge Base - Swedish Municipal Documents

AI-powered knowledge base system with semantic search, LibreOffice document processing, and AI chat for Swedish municipal document management.

## ⚡ Quick Start (Production)

Deploy with Docker in 3 steps:

```bash
# 1. Clone and configure
git clone <your-repo>
cd knowledge-base
cp .env.example .env

# 2. Edit .env and add your API keys
nano .env  # Add GEMINI_API_KEY, OPENAI_API_KEY, set DB_PASSWORD

# 3. Start everything
docker-compose up -d
```

**Done!** Visit http://localhost:3000

Default admin: Create on first visit at http://localhost:3000/admin

---

## 🎯 Two Modes

### **Production (Docker)** ✅

Complete setup with all services in containers:

```bash
docker-compose up -d              # Start all services
docker-compose logs -f app        # View logs
docker-compose down               # Stop everything
docker-compose down -v            # Stop and remove data
```

**What you get:**
- App (Next.js + Payload CMS + LibreOffice)
- PostgreSQL database
- Qdrant vector database
- Automatic health checks
- Data persistence
- Production-ready

### **Development (Local - Recommended)** 🛠️

For active development with instant hot-reload:

#### Prerequisites

1. **PostgreSQL** - Running locally or remote
2. **Qdrant** - Running locally
3. **LibreOffice** - For document conversion

**Install LibreOffice:**

```bash
# macOS
brew install --cask libreoffice

# Ubuntu/Debian
sudo apt update && sudo apt install libreoffice

# Verify installation
libreoffice --version
```

**Run Qdrant locally:**

```bash
# Option 1: Docker (simplest)
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant

# Option 2: Native installation
# See https://qdrant.tech/documentation/quick-start/
```

#### Start Development

```bash
# 1. Configure environment
cp .env.example .env.local
nano .env.local  # Use localhost URLs for PostgreSQL and Qdrant

# 2. Install dependencies
pnpm install

# 3. Start dev server
pnpm dev
```

**Development URLs:**
- App: http://localhost:3000
- Admin: http://localhost:3000/admin
- Qdrant: http://localhost:6333/dashboard

---

## 📦 What's Included

| Service | Description | Port |
|---------|-------------|------|
| **App** | Next.js 15 + Payload CMS + LibreOffice | 3000 |
| **PostgreSQL** | Primary database | 5432 |
| **Qdrant** | Vector search | 6333, 6334 |

---

## 🔧 Configuration

### Required Environment Variables

**For Production (Docker) - `.env`:**

```env
# Database (uses container name as hostname)
DATABASE_URI=postgres://knowledge_user:your_password@postgres:5432/knowledge_base
DB_PASSWORD=your_secure_password

# App
PAYLOAD_SECRET=your_long_random_secret_min_32_chars
PAYLOAD_URL=http://localhost:3000
NEXT_PUBLIC_PAYLOAD_URL=http://localhost:3000

# AI Services (Required for features)
GEMINI_API_KEY=your_gemini_api_key        # Document processing & chat
OPENAI_API_KEY=your_openai_api_key        # Embeddings for search
MISTRAL_API_KEY=your_mistral_api_key      # OCR (optional)

# Vector Database (uses container name as hostname)
QDRANT_ENABLED=true
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=                           # Optional

# Optional
PDF_EXTRACTOR=mistral                     # or "gemini"
```

**For Development - `.env.local`:**

```env
# Database (localhost or remote)
DATABASE_URI=postgres://user:password@localhost:5432/knowledge_base

# App
PAYLOAD_SECRET=your_long_random_secret_min_32_chars
PAYLOAD_URL=http://localhost:3000
NEXT_PUBLIC_PAYLOAD_URL=http://localhost:3000

# AI Services (Required for features)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Vector Database (localhost)
QDRANT_ENABLED=true
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Optional
PDF_EXTRACTOR=mistral
NODE_ENV=development
```

### Get API Keys

- **Gemini**: https://ai.google.dev/
- **OpenAI**: https://platform.openai.com/api-keys
- **Mistral**: https://console.mistral.ai/

---

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| **App** | http://localhost:3000 | Frontend |
| **Admin** | http://localhost:3000/admin | CMS Admin |
| **Health** | http://localhost:3000/api/health | Health check |
| **Qdrant** | http://localhost:6333/dashboard | Vector DB UI |

---

## 🚀 Features

### Core Features
- ✅ **Payload CMS** - Content management with live preview
- ✅ **Vector Search** - Semantic search with Qdrant + OpenAI embeddings
- ✅ **AI Chat** - Gemini 2.5 Flash with function calling
- ✅ **LibreOffice** - Auto-convert .docx, .pptx, .xlsx → PDF
- ✅ **AI Processing** - OCR with Mistral/Gemini
- ✅ **Department Hierarchy** - Organizational content structure

### Document Support
- PDF documents (direct processing)
- Word (.doc, .docx) → auto-converts to PDF
- PowerPoint (.ppt, .pptx) → auto-converts to PDF
- Excel (.xls, .xlsx) → auto-converts to PDF
- Text files (.txt)

### Swedish Municipal Features
- Bilingual UI (Swedish/English)
- GDPR compliance flags
- Legal basis tracking
- Document lifecycle management
- Approval workflows
- Accessibility (WCAG 2.1 AA)

---

## 📝 Common Commands

### Docker
```bash
# View all logs
docker-compose logs -f

# Restart a service
docker-compose restart app

# Rebuild after code changes
docker-compose up --build

# Check service health
docker-compose ps

# Access container shell
docker exec -it knowledge-base-app-1 sh

# Database backup
docker exec knowledge-base-postgres-1 pg_dump -U knowledge_user knowledge_base > backup.sql
```

### Development
```bash
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # Run linting
pnpm generate:types         # Generate Payload types
pnpm sync:qdrant            # Sync documents to Qdrant
```

---

## 🔍 Troubleshooting

### Common Issues

**"Cannot connect to database"**
```bash
# Wait for PostgreSQL to be ready (30s first start)
docker-compose logs postgres

# Check health
docker-compose ps
```

**"Qdrant connection failed"**
```bash
# Verify Qdrant is running
curl http://localhost:6333/health

# Restart Qdrant
docker-compose restart qdrant
```

**"LibreOffice conversion failed"**
- LibreOffice is pre-installed in Docker
- For local dev: Install LibreOffice (see OFFICE_DOCUMENTS_SETUP.md)

**"API key errors"**
- Verify all required API keys in `.env`
- Restart after changing env vars: `docker-compose restart app`

**Build fails**
```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📊 System Requirements

### Production (Docker)
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 10GB disk space

### Development
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Qdrant (Docker or native)
- LibreOffice (for document conversion)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Docker Compose                             │
├──────────────┬──────────────┬───────────────┤
│   App        │  PostgreSQL  │   Qdrant      │
│   Container  │  Container   │   Container   │
│              │              │               │
│ • Next.js    │ • Port 5432  │ • Port 6333   │
│ • Payload    │ • Volume:    │ • Volume:     │
│ • LibreOffice│   postgres   │   qdrant      │
│ • Port 3000  │              │               │
│ • Volumes:   │              │               │
│   uploads    │              │               │
│   temp       │              │               │
└──────────────┴──────────────┴───────────────┘
```

---

## 📚 Documentation

- **CLAUDE.md** - Developer guide and architecture
- **OFFICE_DOCUMENTS_SETUP.md** - LibreOffice integration details
- **CHAT_FEATURE.md** - AI chat system documentation

---

## 🚢 Deployment

### Docker Hub (Recommended)

```bash
# Build and tag
docker build -t your-username/knowledge-base:latest .

# Push
docker push your-username/knowledge-base:latest

# Deploy anywhere
docker-compose pull
docker-compose up -d
```

### Environment-Specific

For production servers, use environment-specific `.env` files:

```bash
# Production
docker-compose --env-file .env.production up -d

# Staging
docker-compose --env-file .env.staging up -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Payload Docs**: https://payloadcms.com/docs
- **Discord**: https://discord.com/invite/payload

---

**Built with ❤️ for Swedish municipalities**
