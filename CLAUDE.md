# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

This is a **Next.js 15 application with Payload CMS** serving as a knowledge base system for Swedish municipal documents. The architecture combines:

### Core Technologies
- **Next.js 15** (App Router) - Frontend and API framework
- **Payload CMS 3.50** - Headless CMS for content management
- **PostgreSQL** - Primary database via `@payloadcms/db-postgres`
- **Qdrant** - Vector database for semantic search via embeddings
- **OpenAI** - Text embeddings for search functionality
- **Google Gemini AI** - Document processing and content generation

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
- `DATABASE_URI` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Payload CMS secret key
- `PAYLOAD_URL` - Base URL for the application (default: http://localhost:3000)
- `QDRANT_URL` & `QDRANT_API_KEY` - Vector database connection
- `QDRANT_ENABLED` - Enable/disable vector database features (true/false)
- `OPENAI_API_KEY` - For embeddings generation (text-embedding-3-large model)
- `GEMINI_API_KEY` - For document processing and content generation
- `MISTRAL_API_KEY` - Alternative AI service for document OCR
- `PDF_EXTRACTOR` - Choose PDF extraction service: "gemini" or "mistral" (default: "mistral")

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