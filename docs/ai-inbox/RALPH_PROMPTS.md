# AI Inbox - Prompts Ralph Wiggum

Ce fichier contient les 5 prompts à exécuter séquentiellement avec le plugin Ralph Wiggum.

## Prérequis

1. Installer le plugin Ralph Wiggum :
```bash
/plugin marketplace add anthropics/claude-code
/plugin install ralph-wiggum@claude-code-plugins
```

2. Redémarrer Claude Code

3. S'assurer que les fichiers de spec sont présents :
   - `docs/ai-inbox/SPEC.md`
   - `docs/ai-inbox/GEMINI_PROMPT.md`

---

## Passe 1 : Database & Types

```
/ralph-loop "
## Contexte
Tu travailles sur Nibelheim, un dashboard Next.js 16.
Réfère-toi à CLAUDE.md pour les conventions du projet.
Specs complètes dans docs/ai-inbox/SPEC.md

## Tâche : Database & Types pour AI Inbox

### Checklist
- [ ] Créer migration SQL dans supabase/migrations/ avec timestamp du jour
      - Table ai_inbox_items avec toutes les colonnes (voir SPEC.md)
      - Table ai_inbox_settings
      - Trigger update_updated_at si pas déjà existant
      - RLS policies (users CRUD their own data)
      - Indexes sur user_id, status, category, source_type
- [ ] Créer types TypeScript src/types/ai-inbox.ts
      - Tous les types/interfaces définis dans SPEC.md
      - Exporter proprement
- [ ] Vérifier que le projet compile

### Critères de succès
- La migration SQL est syntaxiquement valide
- npm run build passe sans erreur TypeScript
- Les types couvrent tous les besoins de SPEC.md

Output <promise>PASS1_DONE</promise> quand terminé.
" --max-iterations 15 --completion-promise "PASS1_DONE"
```

---

## Passe 2 : Lib functions

```
/ralph-loop "
## Contexte
Tu travailles sur Nibelheim. Réfère-toi à CLAUDE.md.
Specs dans docs/ai-inbox/SPEC.md
Inspire-toi de src/lib/tech-watch.ts pour le pattern.

## Tâche : Lib functions pour AI Inbox

### Checklist
- [ ] Créer src/lib/ai-inbox.ts avec :
      - Import des types depuis @/types/ai-inbox
      - getItems(filters?: ItemFilters) → Item[]
      - getItem(id: string) → Item | null
      - createItem(input: CreateItemInput) → Item | null
      - updateItem(id: string, updates: UpdateItemInput) → boolean
      - deleteItem(id: string) → boolean
      - getSettings() → Settings (crée un défaut si inexistant)
      - updateSettings(profile: UserProfile) → boolean
- [ ] Créer src/lib/ai-inbox-automation.ts (pattern tech-watch-automation.ts)
      - Fonctions avec explicit user_id pour usage API/automation
      - createItemForUser(userId, input)
      - getItemsForUser(userId, filters)
      - etc.
- [ ] Utiliser src/lib/logger pour les erreurs
- [ ] Vérifier compilation

### Critères de succès
- npm run build passe
- Pattern cohérent avec tech-watch.ts
- Toutes les fonctions SPEC.md implémentées

Output <promise>PASS2_DONE</promise> quand terminé.
" --max-iterations 15 --completion-promise "PASS2_DONE"
```

---

## Passe 3 : API Routes

```
/ralph-loop "
## Contexte
Tu travailles sur Nibelheim. Réfère-toi à CLAUDE.md.
Specs dans docs/ai-inbox/SPEC.md
Inspire-toi de src/app/api/tech-watch/ pour le pattern des routes et tests.

## Tâche : API Routes pour AI Inbox

### Checklist
- [ ] Créer src/app/api/ai-inbox/items/route.ts
      - GET : liste avec query params (status, category, source_type, favorite, limit, offset)
      - POST : création avec validation Zod
- [ ] Créer src/app/api/ai-inbox/items/[id]/route.ts
      - GET : récupère un item
      - PATCH : update partiel avec validation Zod
      - DELETE : suppression
- [ ] Créer src/app/api/ai-inbox/settings/route.ts
      - GET : récupère settings (crée défaut si inexistant)
      - PUT : update profile avec validation Zod
- [ ] Créer src/app/api/ai-inbox/analyze/[id]/route.ts
      - POST : stub pour l'instant (log + return success)
- [ ] Auth check sur toutes les routes (createClient + getUser)
- [ ] Créer les fichiers .test.ts pour chaque route (pattern tech-watch)
- [ ] Tous les tests doivent passer

### Critères de succès
- npm run build passe
- npm run test passe (tous les tests verts)
- Chaque route gère 400, 401, 404, 500

Output <promise>PASS3_DONE</promise> quand terminé.
" --max-iterations 25 --completion-promise "PASS3_DONE"
```

---

## Passe 4 : UI Components

```
/ralph-loop "
## Contexte
Tu travailles sur Nibelheim. Réfère-toi à CLAUDE.md.
Specs dans docs/ai-inbox/SPEC.md
Design system : Vision UI (voir src/app/globals.css pour les classes neon/glass)
Inspire-toi de src/modules/tech-watch/ pour le pattern module.

## Tâche : UI Module AI Inbox

### Checklist
- [ ] Créer src/modules/ai-inbox/config.ts
      - id: 'ai-inbox'
      - name: 'AI Inbox'
      - icon: Inbox (de lucide-react)
      - route: '/ai-inbox'
      - enabled: true
      - category: 'ai'
      - Lazy loading du component
- [ ] Créer src/modules/ai-inbox/index.tsx
      - État : items[], settings, filters (status, category, source_type), loading
      - Fetch initial des items et settings
      - Tabs pour status : All / Unread / Read / Archived
      - Affichage liste des items
      - Bouton + pour ajouter
      - Bouton settings
- [ ] Créer src/modules/ai-inbox/components/inbox-item-card.tsx
      - Affiche : title (lien), source icon, category badge, scores, summary
      - Section collapsible pour project_ideas
      - Tags
      - Actions : favorite toggle, status toggle (read/unread), archive, delete
      - useOptimistic pour les toggles
- [ ] Créer src/modules/ai-inbox/components/add-item-dialog.tsx
      - Dialog shadcn/ui
      - Form : title (required), url, source_type (select), category (select), raw_content (textarea), tags
      - Submit → POST /api/ai-inbox/items
      - Loading state
- [ ] Créer src/modules/ai-inbox/components/settings-dialog.tsx
      - Dialog shadcn/ui
      - Form pour éditer le profil :
        - current_stack (input avec tags)
        - current_projects (input avec tags)
        - skill_level (select)
        - interests (input avec tags)
      - Submit → PUT /api/ai-inbox/settings
- [ ] Créer src/modules/ai-inbox/components/filter-bar.tsx
      - Filtres category et source_type (selects ou toggles)
      - Recherche texte (optionnel)
- [ ] Enregistrer le module dans src/modules/registry.ts
- [ ] Vérifier que le module est accessible dans le dashboard

### Critères de succès
- npm run build passe
- Module visible dans le sidebar
- Navigation vers /ai-inbox fonctionne
- Formulaire d'ajout crée un item
- Settings modifiables et persistés

Output <promise>PASS4_DONE</promise> quand terminé.
" --max-iterations 30 --completion-promise "PASS4_DONE"
```

---

## Passe 5 : Gemini Integration

```
/ralph-loop "
## Contexte
Tu travailles sur Nibelheim. Réfère-toi à CLAUDE.md.
Prompt Gemini dans docs/ai-inbox/GEMINI_PROMPT.md
Regarde scripts/tech-watch-bot/ pour un exemple d'appel Gemini.

## Tâche : Intégration Gemini pour AI Inbox

### Checklist
- [ ] Créer src/lib/ai-inbox-gemini.ts
      - import { GoogleGenerativeAI } from '@google/generative-ai'
      - analyzeItem(item: Item, userProfile: UserProfile): Promise<AIAnalysis | null>
      - Construire le prompt selon GEMINI_PROMPT.md
      - Appel API Gemini (modèle gemini-2.0-flash ou gemini-1.5-flash)
      - Parse JSON response avec gestion d'erreur
      - Retry logic (3 tentatives avec backoff)
- [ ] Mettre à jour POST /api/ai-inbox/items
      - Après création réussie, lancer analyzeItem en async (ne pas bloquer la réponse)
      - Utiliser un pattern fire-and-forget ou queue simple
      - Mettre à jour l'item avec ai_analysis une fois terminé
- [ ] Implémenter POST /api/ai-inbox/analyze/[id]
      - Récupérer l'item
      - Récupérer les settings de l'utilisateur
      - Lancer analyzeItem
      - Mettre à jour l'item avec le résultat
      - Retourner le résultat
- [ ] Ajouter GEMINI_API_KEY dans .env.example
- [ ] Mettre à jour l'UI pour afficher un état 'analyzing' si ai_analysis est null
- [ ] Ajouter un bouton 'Re-analyze' sur les items

### Critères de succès
- npm run build passe
- Quand on ajoute un item, l'analyse se déclenche (visible dans les logs)
- Le JSON Gemini est correctement parsé et stocké
- Le bouton re-analyze fonctionne

Output <promise>PASS5_DONE</promise> quand terminé.
" --max-iterations 20 --completion-promise "PASS5_DONE"
```

---

## Post-implémentation

Après les 5 passes, vérifier manuellement :

1. [ ] Créer un item de test via l'UI
2. [ ] Vérifier que l'analyse Gemini s'exécute
3. [ ] Modifier les settings et vérifier la persistance
4. [ ] Tester les filtres
5. [ ] Tester les actions (favorite, read, archive, delete)

---

## Troubleshooting

### La passe ne converge pas

- Augmenter `--max-iterations`
- Vérifier les logs pour identifier le blocage
- Lancer manuellement `npm run build` ou `npm run test` pour voir les erreurs

### Erreur de compilation TypeScript

- Vérifier que les types dans `src/types/ai-inbox.ts` sont corrects
- S'assurer que les imports utilisent `@/` correctement

### Tests qui échouent

- Vérifier les mocks (pattern dans tech-watch tests)
- S'assurer que les routes retournent les bons status codes

### Gemini ne répond pas

- Vérifier GEMINI_API_KEY dans .env.local
- Vérifier les quotas API
- Tester avec un curl direct vers l'API
