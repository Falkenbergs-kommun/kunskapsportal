# CLAUDE.md - Kunskapsportal

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Project:** Kunskapsportal - AI-driven kunskapsdatabas för svensk kommunal förvaltning

## Development Commands

### Core Commands
- `pnpm dev` - Start development server (Next.js with Payload CMS)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm devsafe` - Clean build and start development (removes .next folder)

### Local Development Prerequisites
- PostgreSQL 15+ running locally or remote
- Qdrant running (easiest: `docker run -p 6333:6333 qdrant/qdrant`)
- LibreOffice installed for document conversion
- Configure `.env.local` with localhost URLs

### Code Quality & Testing
- `pnpm lint` - Run ESLint
- `pnpm test` - Run all tests (integration + e2e)
- `pnpm test:int` - Run integration tests (Vitest)
- `pnpm test:e2e` - Run end-to-end tests (Playwright)

### Payload CMS Specific
- `pnpm payload` - Access Payload CLI commands
- `pnpm generate:types` - Generate TypeScript types from Payload schema
- `pnpm generate:importmap` - Generate import map for Payload admin
- `pnpm sync:qdrant` - Sync active documents to Qdrant vector database

## Architecture Overview

**Kunskapsportal** is an AI-powered knowledge management system for Swedish municipalities built on **Payload CMS** and **Next.js**.

### Core Technologies & Their Roles

**[Payload CMS 3.50](https://payloadcms.com/)** - Application foundation
- Entire application is built as a Payload CMS project
- Provides admin UI, collections, REST/GraphQL API
- Handles all content management
- TypeScript-based with auto-generated types
- Documentation: https://payloadcms.com/docs

**[Next.js 15](https://nextjs.org/)** - Frontend & server
- Payload is built on top of Next.js App Router
- Handles frontend rendering and API routes
- Server Components for performance
- Documentation: https://nextjs.org/docs

**[PostgreSQL 15](https://www.postgresql.org/)** - Primary database
- Stores all articles, metadata, users
- Connected via `@payloadcms/db-postgres` adapter
- Documentation: https://www.postgresql.org/docs/15/

**[Qdrant](https://qdrant.tech/)** - Vector database (RAG core)
- Stores embeddings for semantic search
- Enables similarity search (finding relevant docs)
- Critical for AI chat's ability to retrieve context
- Local Docker or Qdrant Cloud
- Documentation: https://qdrant.tech/documentation/

**[OpenAI API](https://platform.openai.com/)** - Text embeddings
- `text-embedding-3-large` model converts text to vectors
- Creates embeddings stored in Qdrant
- Enables semantic search (meaning-based, not just keywords)
- Documentation: https://platform.openai.com/docs/guides/embeddings

**[Google Gemini 2.5 Flash](https://ai.google.dev/)** - AI engine
- OCR document extraction from PDFs
- AI chat with RAG (retrieval augmented generation)
- Metadata generation (title, summary, keywords)
- **Two deployment options:**
  - **AI Studio** (ai.google.dev): Easier setup with API key, data processed in USA
  - **Vertex AI** (Google Cloud): EU region deployment (GDPR compliant), requires GCP project
- Configurable via `GEMINI_MODE` environment variable
- Documentation: https://ai.google.dev/docs (AI Studio) or https://cloud.google.com/vertex-ai/docs (Vertex AI)

**[Mistral AI](https://mistral.ai/)** - Alternative OCR
- Pixtral Large for document processing
- Backup/alternative to Gemini
- Documentation: https://docs.mistral.ai/

**[LibreOffice](https://www.libreoffice.org/)** - Office conversion
- Converts Word/Excel/PowerPoint to PDF (headless mode)
- Supports both modern (.docx, .pptx, .xlsx) and legacy formats (.doc, .ppt, .xls)
- Pre-processing before OCR
- Runs in Docker container
- Documentation: https://documentation.libreoffice.org/

### RAG (Retrieval Augmented Generation) Workflow

**Document Upload → Vectorization → Search → Chat**

1. **Upload & OCR** (`src/endpoints/generateContent.ts`)
   - User uploads PDF/Office file to Payload Media collection
   - Gemini/Mistral extracts text with OCR
   - Content stored in Articles collection (PostgreSQL)

2. **Publish & Embed** (`src/qdrant/index.ts`)
   - When article is published, hook triggers
   - OpenAI embeddings converts text to 1536-dimensional vectors
   - Vectors stored in Qdrant with article ID

3. **Search** (`src/services/qdrantSearch.ts`)
   - User query → OpenAI embeddings → vector
   - Qdrant similarity search finds relevant docs
   - Returns article IDs ranked by similarity

4. **Chat** (`src/services/geminiChat.ts`)
   - Relevant docs fetched from PostgreSQL
   - Gemini receives docs as context
   - Generates answer with sources

**Key files:**
- `src/qdrant/index.ts` - Qdrant operations (upsert, search, delete)
- `src/services/qdrantSearch.ts` - Search logic
- `src/services/geminiChat.ts` - RAG chat implementation
- `src/app/api/chat/route.ts` - Chat API endpoint
- `src/collections/Articles.ts` - Article collection with hooks

### External Qdrant Sources

The application supports searching external Qdrant collections alongside the internal knowledge base. This enables querying multiple content repositories from a single chatbot interface.

**Configuration**: Purely environment-based via `EXTERNAL_QDRANT_SOURCES` JSON variable.

**Key Features:**
- Each external source has independent Qdrant connection (URL + API key)
- Flexible field mapping to handle different payload structures
- Optional UI customization (icons, colors, labels)
- Generic implementation - no hardcoded source names in code
- Graceful degradation when not configured

**Critical Requirement:**
External collections MUST use `text-embedding-3-large` (3072 dimensions) to match the internal collection. Query embeddings are generated once and reused across all collections for performance.

**How It Works:**
1. Define sources in `EXTERNAL_QDRANT_SOURCES` environment variable
2. Sources appear automatically in chatbot UI under "Externa källor"
3. Users select which sources to search (selection persisted in localStorage)
4. Chatbot searches enabled sources in parallel and merges results
5. Results show source attribution with badges
6. External URLs open in new tabs

**Example Use Cases:**
- Municipal intranet content (separate Qdrant collection)
- Public website content (different collection)
- Legacy documentation systems (migrated to Qdrant)
- Partner organization knowledge bases (shared Qdrant instance)

**Adding External Sources:**
1. Ensure external collection uses `text-embedding-3-large` embeddings
2. Add source configuration to `EXTERNAL_QDRANT_SOURCES` (minified JSON)
3. Restart application
4. Source appears automatically in UI

No code changes required!

**Configuration Example:**
See `.env.example` for full documentation and examples.

**Implementation Files:**
- `src/config/externalSources.ts` - Configuration parser and Qdrant client factory
- `src/services/qdrantSearch.ts` - Multi-source search with single embedding
- `src/components/ExternalSourceSelector.tsx` - UI selector component
- `src/components/SourceBadge.tsx` - Source attribution badges

### Application Structure

#### Route Groups
- `src/app/(payload)/` - Payload CMS admin interface
- `src/app/(frontend)/` - Public-facing frontend application
- `src/app/preview/` - Draft preview functionality
- `src/app/api/` - Custom API routes

#### Collections (Content Types)
- **Articles** - Main content with AI-powered features, complex metadata, and lifecycle management
- **Departments** - Hierarchical organizational structure (self-referencing)
- **Media** - File uploads with automated processing
- **Users** - Authentication and admin access

#### Key Services
- **Qdrant Integration** (`src/qdrant/`) - Vector embeddings for semantic search
- **AI Services** (`src/services/`) - Gemini Flash, Mistral, and OpenAI integrations
- **Document Processing** - Automated content extraction from PDFs/Office docs
- **AI Chat System** (`src/components/PlainChat.tsx`) - Interactive knowledge base assistant
  - Uses Gemini Flash with function calling to search Qdrant
  - Department filtering with hierarchical support
  - Persistent chat history and settings via localStorage
  - Markdown rendering with clickable article links

### Data Flow & AI Integration

#### Document Processing Pipeline
1. Upload documents via Media collection
2. AI extracts content using Gemini/Mistral OCR
3. Content gets processed into structured markdown
4. Published articles are automatically embedded in Qdrant
5. Vector search enables semantic document discovery

#### Content Management Workflow
- **Draft Status**: Documents in development, not searchable
- **Active Status**: Published documents automatically embedded in vector database
- **Lifecycle Management**: Swedish municipal compliance features (review dates, legal basis, GDPR flags)

### Environment Configuration

The application requires several environment variables:

**Core Application:**
- `DATABASE_URI` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Payload CMS secret key
- `PAYLOAD_URL` - Base URL for the application (default: http://localhost:3000)
- `QDRANT_URL` & `QDRANT_API_KEY` - Vector database connection
- `QDRANT_ENABLED` - Enable/disable vector database features (true/false)

**AI Services:**
- `OPENAI_API_KEY` - For embeddings generation (required for RAG)
- `MISTRAL_API_KEY` - Alternative AI service for document OCR
- `PDF_EXTRACTOR` - Choose PDF extraction service: "gemini" or "mistral" (default: "mistral")

**Google Gemini Configuration:**
- `GEMINI_MODE` - Choose "aistudio" or "vertexai" (default: "aistudio")

*AI Studio Mode* (easier setup, USA):
- `GEMINI_API_KEY` - API key from ai.google.dev

*Vertex AI Mode* (GDPR compliant, EU region):
- `GOOGLE_CLOUD_PROJECT` - GCP project ID
- `GOOGLE_CLOUD_LOCATION` - GCP region (e.g., "europe-west4" for Netherlands)
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file

**AI Model Configuration (optional):**
- `GEMINI_FLASH_MODEL` - Gemini model for OCR, metadata, and chat (default: "gemini-flash-latest")
- `GEMINI_IMAGEN_MODEL` - Imagen model for cover photos (default: "imagen-4.0-fast-generate-001")
- `MISTRAL_OCR_MODEL` - Mistral OCR model (default: "mistral-ocr-latest")
- `OPENAI_EMBEDDING_MODEL` - OpenAI embedding model (default: "text-embedding-3-large")
  - **WARNING:** Changing this requires re-embedding all documents with `pnpm sync:qdrant`

### Vertex AI Setup (GDPR Compliant - EU Region)

For production deployments requiring GDPR compliance, use Vertex AI instead of AI Studio:

**1. Google Cloud Project Setup:**
```bash
# Create project (or use existing)
gcloud projects create your-project-id

# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=your-project-id
```

**2. Create Service Account:**
```bash
# Create service account
gcloud iam service-accounts create kunskapsportal-ai \
  --display-name="Kunskapsportal AI Service" \
  --project=your-project-id

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:kunskapsportal-ai@your-project-id.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Download credentials as JSON
gcloud iam service-accounts keys create service-account.json \
  --iam-account=kunskapsportal-ai@your-project-id.iam.gserviceaccount.com
```

**3. Configure Environment Variables:**
```env
GEMINI_MODE=vertexai
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=europe-west4
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Note:** The path can be absolute or relative to the project root.

**4. Verify Setup:**
Start the application and check logs for:
```
[Gemini] Using Vertex AI in europe-west4 (project: your-project-id)
```

**GDPR Benefits:**
- Data stays within EU (europe-west4 is in Netherlands)
- No third-country transfer for Google services
- Only OpenAI remains as USA provider (for embeddings)
- Stronger data protection compliance

### Testing Architecture
- **Integration tests** - API and database operations (Vitest)
- **E2E tests** - Full application flows (Playwright)
- **Test environments** - Configured via test.env file

## Development Patterns

### Adding New Features
1. Check existing collections in `src/collections/` for data structure patterns
2. Follow the established Swedish/English bilingual field naming
3. Use the rich text editor configuration in `payload.config.ts`
4. Implement lifecycle hooks for Qdrant sync if search functionality needed

### Working with AI Features
- Document generation endpoints are in `src/endpoints/`
- AI service abstractions are in `src/services/`
- Check environment variables for API key availability before using AI features

### Component Development
- UI components use shadcn/ui pattern in `src/components/ui/`
- Custom Payload admin components in `src/components/` with Payload-specific naming
- Frontend uses Tailwind CSS for styling

## Key Implementation Details

### Payload Admin Customization
- Custom UI components for AI features: `GenerateWithAIButton`, `GenerateMetadataButton`, `GenerateCoverPhotoButton`
- Live preview configuration for draft articles at `/preview/articles/{id}`
- Autosave enabled with 1-second intervals for drafts

### Publishing & Vector Database Sync
- Publishing an article automatically sets `documentStatus` to "active"
- Only published + active articles are embedded in Qdrant
- Unpublishing removes articles from Qdrant search index
- Sync script available: `pnpm sync:qdrant` for batch updates

### Article Collection Features
- **Version Control**: Up to 50 versions per document
- **Required Fields on Publish**: title, slug (validation only enforced when publishing)
- **Document Types**: policy, guideline, instruction, plan, protocol, report, decision, agreement, template, FAQ
- **Status Workflow**: draft → review → approved → active → archived/superseded
- **Security Levels**: public, internal, confidential, restricted

## Municipal Context

This system is specifically designed for Swedish municipal knowledge management:
- Swedish language field labels and options throughout the interface
- Legal compliance features (GDPR flags, accessibility WCAG 2.1 AA compliance)
- Municipal workflow statuses and approval processes (godkännare, granskare)
- Department hierarchies for organizational content classification
- Document lifecycle management with review dates and intervals
- Legal basis tracking with law references and URLs