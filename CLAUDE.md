# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nibelheim is a personal experimentation dashboard for AI, ML, and automation projects. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and Supabase for authentication and database.

## Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check

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
Prompt Library tables: `prompts`, `prompt_executions`
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

## AI/LLM Integration Guidelines

When implementing or updating LLM integrations:
- **Always search the web for latest models** before choosing a model ID
- **Never include a year in the search query** (e.g., search "Gemini latest model" not "Gemini 2024 model") - training data is always older than the current date
- Models evolve fast: what was cutting-edge 3 months ago may be deprecated
- Check official documentation for current model availability and pricing

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
