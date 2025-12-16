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
Uses pgvector for embeddings and RLS for data isolation.

## Conventions

- Path alias: `@/*` maps to `./src/*`
- Styling: Tailwind CSS v4 with shadcn/ui (New York style, zinc colors)
- Dark mode enabled by default
- UI components use Radix UI primitives via shadcn/ui
