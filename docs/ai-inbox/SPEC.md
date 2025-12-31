# AI Inbox - Spécifications

## Vue d'ensemble

Module de veille technologique orienté "vibe coding" avec capture manuelle et analyse IA personnalisée. Contrairement à Tech Watch (digest quotidien automatisé), AI Inbox est une **inbox** où l'utilisateur ajoute manuellement du contenu et le consulte à son rythme.

## Stack

- Next.js 16 (App Router)
- Supabase (PostgreSQL + RLS)
- Gemini pour l'analyse IA
- shadcn/ui + Tailwind CSS v4 (Vision UI design system)

## Différences avec Tech Watch

| Aspect | Tech Watch | AI Inbox |
|--------|------------|----------|
| Source | HN automatisé | Manuel (YouTube, Substack, autre) |
| Format | Digest quotidien | Inbox permanente |
| Persona IA | CTO sceptique | Vibe coder pragmatique |
| Analyse | Technique approfondie | Actionabilité, complexité, idées projets |

---

## Modèle de données

### Table `ai_inbox_items`

```sql
CREATE TABLE ai_inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('youtube', 'substack', 'manual', 'other')),
    category TEXT NOT NULL DEFAULT 'news' CHECK (category IN ('tools', 'prompts', 'tutorials', 'news', 'inspiration')),
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    raw_content TEXT,
    ai_analysis JSONB,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, url)
);

-- Indexes
CREATE INDEX idx_ai_inbox_items_user_id ON ai_inbox_items(user_id);
CREATE INDEX idx_ai_inbox_items_status ON ai_inbox_items(user_id, status);
CREATE INDEX idx_ai_inbox_items_category ON ai_inbox_items(user_id, category);
CREATE INDEX idx_ai_inbox_items_source_type ON ai_inbox_items(user_id, source_type);
CREATE INDEX idx_ai_inbox_items_favorite ON ai_inbox_items(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Updated_at trigger
CREATE TRIGGER update_ai_inbox_items_updated_at
    BEFORE UPDATE ON ai_inbox_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Table `ai_inbox_settings`

```sql
CREATE TABLE ai_inbox_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    profile JSONB NOT NULL DEFAULT '{
        "current_stack": [],
        "current_projects": [],
        "skill_level": "intermediate",
        "interests": []
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger
CREATE TRIGGER update_ai_inbox_settings_updated_at
    BEFORE UPDATE ON ai_inbox_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Structure `profile` (JSONB)

```json
{
    "current_stack": ["Next.js", "Supabase", "Tailwind", "Claude Code"],
    "current_projects": ["Nibelheim", "JAGUARPILOT"],
    "skill_level": "intermediate",
    "interests": ["AI agents", "vibe coding", "automation", "MCP"]
}
```

### Structure `ai_analysis` (JSONB)

```json
{
    "summary": "Résumé en 2-3 phrases",
    "actionability": 4,
    "complexity": 2,
    "project_ideas": [
        "Intégrer MCP dans Nibelheim pour...",
        "Créer un agent autonome pour..."
    ],
    "relevance_to_profile": "Pertinent car tu utilises déjà Claude Code et...",
    "suggested_category": "tools",
    "suggested_tags": ["mcp", "claude-code", "automation"]
}
```

---

## RLS Policies

```sql
-- ai_inbox_items
ALTER TABLE ai_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items"
    ON ai_inbox_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items"
    ON ai_inbox_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
    ON ai_inbox_items FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
    ON ai_inbox_items FOR DELETE
    USING (auth.uid() = user_id);

-- ai_inbox_settings
ALTER TABLE ai_inbox_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
    ON ai_inbox_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
    ON ai_inbox_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON ai_inbox_settings FOR UPDATE
    USING (auth.uid() = user_id);
```

---

## API Routes

### Items

#### `GET /api/ai-inbox/items`

Liste les items avec filtres optionnels.

**Query params:**
- `status` : `unread` | `read` | `archived`
- `category` : `tools` | `prompts` | `tutorials` | `news` | `inspiration`
- `source_type` : `youtube` | `substack` | `manual` | `other`
- `favorite` : `true` (filtre uniquement les favoris)
- `limit` : number (default: 50)
- `offset` : number (default: 0)

**Response:** `Item[]`

#### `POST /api/ai-inbox/items`

Crée un nouvel item. Déclenche l'analyse Gemini en async.

**Body:**
```json
{
    "title": "string (required)",
    "url": "string (optional)",
    "source_type": "youtube | substack | manual | other",
    "category": "tools | prompts | tutorials | news | inspiration",
    "raw_content": "string (optional)",
    "tags": ["string"]
}
```

**Response:** `Item` (sans ai_analysis, qui sera ajouté async)

#### `GET /api/ai-inbox/items/[id]`

Récupère un item par ID.

**Response:** `Item`

#### `PATCH /api/ai-inbox/items/[id]`

Met à jour un item.

**Body (tous optionnels):**
```json
{
    "title": "string",
    "category": "string",
    "status": "unread | read | archived",
    "is_favorite": "boolean",
    "tags": ["string"]
}
```

**Response:** `{ success: true }`

#### `DELETE /api/ai-inbox/items/[id]`

Supprime un item.

**Response:** `{ success: true }`

---

### Settings

#### `GET /api/ai-inbox/settings`

Récupère les settings de l'utilisateur. Crée un profil par défaut si inexistant.

**Response:** `Settings`

#### `PUT /api/ai-inbox/settings`

Met à jour le profil utilisateur.

**Body:**
```json
{
    "profile": {
        "current_stack": ["string"],
        "current_projects": ["string"],
        "skill_level": "beginner | intermediate | advanced",
        "interests": ["string"]
    }
}
```

**Response:** `{ success: true }`

---

### Analyze

#### `POST /api/ai-inbox/analyze/[id]`

Relance l'analyse Gemini sur un item existant.

**Response:** `{ success: true, analysis: AIAnalysis }`

---

## Types TypeScript

```typescript
// src/types/ai-inbox.ts

export type SourceType = 'youtube' | 'substack' | 'manual' | 'other';
export type Category = 'tools' | 'prompts' | 'tutorials' | 'news' | 'inspiration';
export type Status = 'unread' | 'read' | 'archived';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AIAnalysis {
    summary: string;
    actionability: number; // 1-5
    complexity: number; // 1-5
    project_ideas: string[];
    relevance_to_profile: string;
    suggested_category: Category;
    suggested_tags: string[];
}

export interface Item {
    id: string;
    user_id: string;
    title: string;
    url: string | null;
    source_type: SourceType;
    category: Category;
    status: Status;
    raw_content: string | null;
    ai_analysis: AIAnalysis | null;
    tags: string[];
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    current_stack: string[];
    current_projects: string[];
    skill_level: SkillLevel;
    interests: string[];
}

export interface Settings {
    id: string;
    user_id: string;
    profile: UserProfile;
    created_at: string;
    updated_at: string;
}

// API Payloads
export interface CreateItemInput {
    title: string;
    url?: string;
    source_type?: SourceType;
    category?: Category;
    raw_content?: string;
    tags?: string[];
}

export interface UpdateItemInput {
    title?: string;
    category?: Category;
    status?: Status;
    is_favorite?: boolean;
    tags?: string[];
}

export interface ItemFilters {
    status?: Status;
    category?: Category;
    source_type?: SourceType;
    favorite?: boolean;
    limit?: number;
    offset?: number;
}
```

---

## UI Components

### Structure des fichiers

```
src/modules/ai-inbox/
├── config.ts              # Config pour le registry
├── index.tsx              # Module principal
└── components/
    ├── inbox-item-card.tsx    # Card d'un item (résumé, scores, actions)
    ├── add-item-dialog.tsx    # Dialog pour ajouter un item
    ├── settings-dialog.tsx    # Dialog pour éditer le profil
    └── filter-bar.tsx         # Barre de filtres (status, category, source)
```

### Comportement attendu

1. **Inbox principale**
   - Liste des items triés par `created_at` desc
   - Filtres : status (tabs), category, source_type
   - Toggle favoris
   - Actions : marquer lu/non-lu, archiver, supprimer

2. **Item Card**
   - Titre + lien externe
   - Source type (icône)
   - Category (badge)
   - Scores actionability/complexity (progress bars ou étoiles)
   - Résumé IA
   - Idées projets (collapsible)
   - Tags
   - Actions : favorite, status toggle, delete

3. **Add Dialog**
   - Champs : title (required), url, source_type (select), category (select), raw_content (textarea), tags (input)
   - Submit → POST /api/ai-inbox/items
   - Loading state pendant analyse Gemini

4. **Settings Dialog**
   - Édition du profil JSON avec form fields :
     - current_stack (tag input)
     - current_projects (tag input)
     - skill_level (select)
     - interests (tag input)

---

## Évolutions futures (Phase 2)

- **Extension Chrome** : Capture en un clic depuis n'importe quelle page
- **Claude for Chrome** : Surveillance automatique de chaînes YouTube
- **YouTube transcript extraction** : API ou scraping pour extraire les transcripts
- **Recherche sémantique** : pgvector sur raw_content + ai_analysis
