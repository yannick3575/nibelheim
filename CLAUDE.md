# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nibelheim is a personal experimentation dashboard for AI, ML, and automation projects. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and Supabase for authentication and database.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check

# Testing (Vitest)
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage report

# Python Tech Watch Bot
pip install -r scripts/tech-watch-bot/requirements.txt
python scripts/tech-watch-bot/main.py
```

## Architecture

### Module System
The app uses a pluggable module registry pattern (`src/modules/registry.ts`). Each module is lazy-loaded and configured with:
- Unique ID, name, icon, route
- `enabled` flag for feature toggling
- Category and tags for organization

To create a new module, copy `src/modules/_template/` and register it in `registry.ts`.

### Authentication Flow
- Supabase Auth handles email/password, magic links, and OAuth
- Middleware (`src/middleware.ts`) protects routes and redirects unauthenticated users to `/login`
- Public routes: `/login`, `/auth/callback`
- Protected routes: Everything under `/(dashboard)/`

### Key Directories
- `src/app/(dashboard)/[moduleId]/` - Dynamic module pages
- `src/components/ui/` - shadcn/ui components
- `src/lib/supabase/` - Server and client Supabase clients
- `src/modules/` - Module implementations
- `scripts/tech-watch-bot/` - Python autonomous bot using Gemini

### Database (Supabase PostgreSQL)
Core tables: `profiles`, `user_modules`, `module_data`
Tech Watch tables: `tech_watch_articles`, `tech_watch_digests`, `tech_watch_sources`
Prompt Library tables: `prompts`, `prompt_executions`, `prompt_discovery_sources`
Stochastic Lab tables: `stochastic_conversations`, `stochastic_messages`
AI Inbox tables: `ai_inbox_items`, `ai_inbox_settings`
API Management: `api_tokens` (for external service keys)
Uses pgvector for embeddings and RLS for data isolation.

## Active Modules

### Tech Watch
**Path**: `src/modules/tech-watch/`
**Description**: Automated tech monitoring with AI-powered summaries and semantic memory

**Features**:
- Daily digest of top Hacker News articles (>100 points)
- AI analysis using Gemini with "Skeptical CTO" persona
- Article favorites and read/unread tracking
- Historical digest browsing
- Semantic search via pgvector embeddings

**Architecture**:
- **Frontend**: React component with tabs (Daily Digest / Favorites)
- **Backend**: Python bot (`scripts/tech-watch-bot/`) running on GitHub Actions
- **API Routes**:
  - `GET /api/tech-watch/latest` - Latest digest
  - `GET /api/tech-watch/digests` - Digest history
  - `GET /api/tech-watch/digests/[date]` - Specific digest
  - `GET /api/tech-watch/favorites` - Favorite articles
  - `PATCH /api/tech-watch/articles/[id]` - Update article (read/favorite status)

**Bot Workflow**:
1. Fetches Hacker News RSS feed
2. Filters articles >100 points
3. Extracts full content + top HN comments
4. Sends to Gemini for analysis
5. Generates structured markdown digest
6. Commits to Supabase via GitHub Actions

### Prompt Library
**Path**: `src/modules/prompt-library/`
**Description**: Reusable prompt templates with variables and categorization

**Features**:
- Create, edit, delete prompts with variable placeholders (`{{variable}}`)
- Category organization (Development, Writing, Analysis, Marketing, Other)
- Favorites system
- Search and filter by category
- Copy to clipboard functionality
- Grid/List view modes
- Variable substitution UI

**Architecture**:
- **Frontend**: React component with card/list views
- **Components**: 
  - `PromptCard` - Grid view item
  - `PromptListItem` - List view item
  - `CreatePromptDialog` - Create/edit dialog
  - `FilterBar` - Search and category filters
  - `PromptExecutor` - Variable substitution interface
- **API Routes**:
  - `GET /api/prompt-library` - List prompts (supports `?category=`, `?favorites=true`, `?search=`)
  - `POST /api/prompt-library` - Create prompt
  - `PATCH /api/prompt-library/[id]` - Update prompt
  - `DELETE /api/prompt-library/[id]` - Delete prompt

**Database Schema**:
- `prompts`: id, user_id, title, content, category, tags, is_favorite, created_at, updated_at
- `prompt_executions`: id, prompt_id, user_id, variables, executed_at (for usage tracking)
- `prompt_discovery_sources`: id, user_id, name, url, is_active, last_scraped_at

### Stochastic Lab
**Path**: `src/modules/stochastic-lab/`
**Description**: AI-powered probabilistic simulations and statistical modeling workspace

**Features**:
- Interactive chat interface with Gemini AI for statistical guidance
- Monte Carlo simulations
- Markov chains modeling
- Random walk simulations
- Conversation history persistence
- Real-time streaming responses from Gemini

**Architecture**:
- **Frontend**: Chat interface with conversation management
- **Backend**: Gemini API integration for AI-guided simulations
- **API Routes**:
  - `GET /api/stochastic-lab/conversations` - List user's conversations
  - `POST /api/stochastic-lab/conversations` - Create new conversation
  - `GET /api/stochastic-lab/conversations/[id]` - Get conversation with messages
  - `POST /api/stochastic-lab/conversations/[id]` - Add message to conversation
  - `DELETE /api/stochastic-lab/conversations/[id]` - Delete conversation

**Database Schema**:
- `stochastic_conversations`: id, user_id, title, created_at, updated_at
- `stochastic_messages`: id, conversation_id, role, content, created_at

### AI Inbox
**Path**: `src/modules/ai-inbox/`
**Description**: Intelligent content curation system with automated AI analysis

**Features**:
- Add content from YouTube, Substack, articles, or manual entry
- Automatic content extraction (YouTube transcripts via youtube-transcript, web scraping via Jina Reader)
- AI-powered analysis using Gemini with custom user profile
- Category organization (Tools, Prompts, Tutorials, News, Inspiration)
- Read/unread tracking and favorites
- Actionability and complexity scoring
- AI-generated project ideas based on content
- Real-time updates via Supabase subscriptions
- Configurable user profile for personalized relevance scoring

**Architecture**:
- **Frontend**: Item cards with AI analysis display, filtering, and status management
- **Backend**: Async content extraction and Gemini analysis pipeline
- **Content Extraction**:
  - YouTube: Transcript via `youtube-transcript` library
  - Web content: Jina Reader API scraping (fallback)
- **API Routes**:
  - `GET /api/ai-inbox/items` - List items (supports filters: `?status=`, `?category=`, `?source_type=`, `?favorite=true`)
  - `POST /api/ai-inbox/items` - Create item (triggers async analysis)
  - `PATCH /api/ai-inbox/items/[id]` - Update item (status, favorite, category)
  - `DELETE /api/ai-inbox/items/[id]` - Delete item
  - `POST /api/ai-inbox/analyze/[id]` - Manually trigger AI re-analysis
  - `POST /api/ai-inbox/parse-url` - Extract metadata from URL
  - `GET /api/ai-inbox/settings` - Get user settings/profile
  - `PATCH /api/ai-inbox/settings` - Update user settings/profile

**Database Schema**:
- `ai_inbox_items`: id, user_id, title, url, source_type, category, raw_content, ai_analysis (JSONB), status, is_favorite, tags, created_at, updated_at
- `ai_inbox_settings`: user_id, profile (JSONB with skills, interests, learning_goals), created_at, updated_at

**AI Analysis Flow**:
1. Item created via POST request
2. Immediately returns item to user (non-blocking)
3. Background async job:
   - Extracts content (YouTube transcript or Jina scraping)
   - Sends to Gemini with user profile context
   - Saves both content and analysis in single atomic DB update
4. Frontend receives real-time update via Supabase subscription

## Additional Features

### API Token Management
**Path**: `src/app/api/tokens/`
**Description**: Secure storage and management of external service API keys

**Features**:
- Encrypted storage of API tokens (Gemini, Jina, etc.)
- Per-user token management
- Token validation and testing

**API Routes**:
- `GET /api/tokens` - List user's API tokens (encrypted values hidden)
- `POST /api/tokens` - Create new token
- `PATCH /api/tokens/[id]` - Update token
- `DELETE /api/tokens/[id]` - Delete token

### Automation Endpoints
**Path**: `src/app/api/automation/`
**Description**: Public endpoints for GitHub Actions and external automation

**API Routes**:
- `GET /api/automation/health` - Health check for automation scripts
- `POST /api/automation/tech-watch/articles` - Bulk insert articles (Tech Watch bot)
- `GET /api/automation/tech-watch/sources` - Get configured RSS sources
- `PATCH /api/automation/tech-watch/sources/[id]` - Update source last fetch time

### Error Monitoring (Sentry)
The project uses Sentry for error tracking and performance monitoring:
- **Initialization**: `sentry.client.config.ts` and `sentry.server.config.ts`
- **Environment Variables**: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- Automatically captures errors, unhandled rejections, and performance metrics
- Source maps uploaded on production builds

## AI/LLM Integration Guidelines

When implementing or updating LLM integrations:
- **Always search the web for latest models** before choosing a model ID
- **Never include a year in the search query** (e.g., search "Gemini latest model" not "Gemini 2024 model") - training data is always older than the current date
- Models evolve fast: what was cutting-edge 3 months ago may be deprecated
- Check official documentation for current model availability and pricing
- **Current AI Stack**:
  - Primary LLM: Google Gemini (via `@google/generative-ai`)
  - Content extraction: Jina Reader API for web scraping
  - YouTube: `youtube-transcript` library
  - Embeddings: Supabase pgvector (for Tech Watch semantic search)

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Styling: Tailwind CSS v4 with shadcn/ui (New York style, Vision UI neon colors)
- Dark mode enabled by default
- UI components use Radix UI primitives via shadcn/ui

### Vision UI Design System
The app uses a Vision UI-inspired design with neon glassmorphism effects:

**Color Palette** (OKLCH):
- Primary cyan: `oklch(0.72 0.24 210)` - Main accent color
- Violet: `oklch(0.68 0.28 285)` - Secondary accent
- Magenta: `oklch(0.70 0.30 320)` - Tertiary accent
- Purple: `oklch(0.65 0.30 300)` - Background tints

**Utility Classes** (`src/app/globals.css`):
- `.glass-vision` / `.glass-vision-strong` - Glassmorphism with backdrop blur
- `.neon-border` / `.neon-border-violet` / `.neon-border-magenta` - Neon border effects
- `.neon-glow` / `.neon-glow-violet` / `.neon-glow-magenta` - Box shadow glow effects
- `.neon-text` / `.neon-text-violet` - Text with glow
- `.grid-pattern` / `.grid-pattern-dense` - Cyberpunk grid overlays
- `.animated-gradient` / `.animated-gradient-subtle` - Animated color gradients
- `.noise` - Noise texture overlay (use on elements with `relative` positioning)

**Button Variants**:
- `vision` - Glass button with neon border
- `visionGradient` - Animated gradient button
- `visionGhost` - Transparent with hover effects

**Components** (`src/components/ui/`):
- `vision-effects.tsx` - Reusable effect components (NoiseOverlay, GridPattern, GlassPanel, NeonBorderBox, NeonText)
- `data-table-vision.tsx` - Glassmorphic data table component

## Development Best Practices

### Code Quality & Testing
- **Linting**: ESLint configured for Next.js with strict rules
- **Testing**: Vitest with React Testing Library and happy-dom
- **TypeScript**: Strict mode enabled, avoid `any` types
- **Test Coverage**: Run `npm run test:coverage` before major releases

### Performance Optimization
- **Real-time subscriptions**: Use Supabase subscriptions sparingly (can impact performance)
- **Atomic updates**: AI Inbox uses single DB update to prevent multiple subscription triggers
- **Async operations**: Use `request.waitUntil()` for background tasks in serverless environments
- **Caching**: API routes implement cache headers where appropriate

### Security Considerations
- **RLS policies**: All tables have Row Level Security enabled
- **Authentication**: Middleware protects all dashboard routes
- **API tokens**: Stored encrypted in database
- **Input validation**: All API endpoints use Zod schemas
- **Content Security**: Be cautious with user-generated content (XSS risks)

### Database Migrations
- Location: `supabase/migrations/`
- Naming: `###_descriptive_name.sql` (e.g., `001_initial_schema.sql`)
- Always test migrations locally before deploying
- Use RLS policies for multi-tenant isolation
- Create indexes for frequently queried columns

### Module Development Workflow
1. Copy `src/modules/_template/` as starting point
2. Create module component with clear UI structure
3. Register in `src/modules/registry.ts` (set `enabled: false` initially)
4. Create database tables with RLS policies in new migration
5. Implement API routes with proper authentication
6. Add tests for critical functionality
7. Enable module in registry when ready

### Common Gotchas
- **React 19**: Uses new features like `use()` hook and action functions - may differ from older tutorials
- **Next.js 16 App Router**: All routes are server components by default, use `'use client'` directive when needed
- **Supabase Client**: Use `createClient()` for route handlers, `createBrowserClient()` for client components
- **Middleware**: Changes to `middleware.ts` require server restart in development
- **Real-time**: Ensure tables have `REPLICA IDENTITY FULL` for update subscriptions
- **Environment Variables**: Prefix with `NEXT_PUBLIC_` for client-side access

### Key Libraries & Dependencies
- **UI**: Radix UI primitives via shadcn/ui, Lucide icons
- **Styling**: Tailwind CSS v4, custom Vision UI utilities
- **Database**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **AI**: Google Generative AI SDK (`@google/generative-ai`)
- **Forms**: Native HTML5 validation with Zod schemas on backend
- **Math**: KaTeX for LaTeX rendering in markdown
- **Charts**: Recharts for data visualization
- **Testing**: Vitest + React Testing Library + happy-dom
- **Monitoring**: Sentry for error tracking and performance
