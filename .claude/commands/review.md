---
description: Audit complet Nibelheim (sécurité, performance, standards Next.js/React)
argument-hint: [chemin ou scope optionnel]
---

# Audit Complet Nibelheim

Tu es un expert en sécurité et architecture d'applications Next.js. Réalise un audit approfondi du code spécifié (ou du projet entier si aucun scope n'est fourni).

## Scope

$ARGUMENTS

## Contexte Projet

- **Stack** : Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend** : Supabase (Auth, PostgreSQL, pgvector, Row Level Security)
- **UI** : shadcn/ui (Radix primitives), next-themes (dark mode)
- **Architecture** : Module registry pattern avec lazy-loading
- **Extras** : Python tech-watch-bot avec Gemini
- **Domaine** : Dashboard d'expérimentation AI/ML personnel

---

## 1. SÉCURITÉ (Priorité Haute)

### Gestion des secrets

**IMPORTANT** : Les fichiers `.env.local` sont dans `.gitignore` et ne sont PAS commités.

- [ ] Vérifier que les clés sensibles ne sont PAS hardcodées dans le code source (.ts, .tsx, .py)
- [ ] Vérifier l'utilisation de `NEXT_PUBLIC_` : seules les variables non-sensibles (Supabase URL, anon key)
- [ ] Contrôler que les appels API sensibles passent par des Route Handlers `/api/*` ou Server Actions
- [ ] Vérifier les secrets du bot Python (clés Gemini, tokens)

### Supabase & Row Level Security

- [ ] Auditer les politiques RLS : actives sur `profiles`, `user_modules`, `module_data`, `tech_watch_*`
- [ ] Vérifier l'authentification : middleware protège les routes `/(dashboard)/*`
- [ ] Contrôler les requêtes Supabase : pas de `service_role` key côté client
- [ ] Vérifier l'isolation des données utilisateur (RLS par user_id)

### Vulnérabilités classiques

- [ ] Injection SQL (requêtes Supabase paramétrées ?)
- [ ] XSS (sanitization des inputs, notamment react-markdown)
- [ ] CSRF (protection des mutations)
- [ ] Validation des inputs utilisateur

### Bot Python & APIs IA

- [ ] Gestion sécurisée des clés API Gemini
- [ ] Validation des données insérées en base
- [ ] Rate limiting si applicable
- [ ] Gestion des erreurs sans fuite d'information

---

## 2. PERFORMANCE

### Next.js Optimizations

- [ ] Utilisation correcte Server Components vs Client Components
- [ ] Lazy loading des modules (`dynamic()` ou import dynamique)
- [ ] Metadata et generateStaticParams où pertinent
- [ ] Route groups `(dashboard)` bien structurés

### React

- [ ] Re-renders inutiles (manque de `useMemo`, `useCallback`, `React.memo`)
- [ ] État global vs local bien séparé
- [ ] Suspense boundaries pour le loading des modules

### Data Fetching

- [ ] Stratégie de cache Supabase
- [ ] Requêtes N+1 sur les relations (profiles, modules)
- [ ] Pagination sur les listes (articles, digests)

### Bundle

- [ ] Imports dynamiques pour les modules lourds
- [ ] Tree-shaking effectif
- [ ] Taille des dépendances react-markdown

---

## 3. STANDARDS NEXT.JS 16 / REACT 19

### App Router

- [ ] Structure `/app` respectée (layout, page, loading, error, not-found)
- [ ] Utilisation de `"use client"` uniquement quand nécessaire
- [ ] Route Handlers pour les mutations
- [ ] Server Actions utilisées correctement si présentes
- [ ] Routes dynamiques `[moduleId]` bien gérées

### Architecture Modulaire

- [ ] Registry pattern cohérent (`src/modules/registry.ts`)
- [ ] Modules bien isolés et lazy-loadés
- [ ] Template de module (`_template/`) à jour

### TypeScript

- [ ] Typage strict (pas de `any` injustifié)
- [ ] Types Supabase générés et à jour
- [ ] Props typées sur tous les composants
- [ ] Types partagés dans `src/types/`

---

## 4. QUALITÉ DU CODE

- [ ] Code mort à supprimer
- [ ] Dépendances obsolètes (`npm outdated`)
- [ ] Console.log de debug restants
- [ ] Gestion d'erreurs cohérente (try/catch, error boundaries)
- [ ] Nommage clair et conventions respectées
- [ ] Code Python (bot) : PEP8, typing, docstrings

---

## 5. SPÉCIFIQUE NIBELHEIM

### Module System

- [ ] Tous les modules enregistrés dans `registry.ts`
- [ ] Flags `enabled` fonctionnels
- [ ] Categories et tags cohérents
- [ ] Lazy loading effectif

### Tech Watch Bot

- [ ] requirements.txt à jour
- [ ] Gestion des erreurs robuste
- [ ] Logs appropriés
- [ ] Tests si présents

---

## Format de Sortie

Pour chaque problème trouvé :

| Criticité | Fichier | Ligne | Problème | Solution proposée |
|-----------|---------|-------|----------|-------------------|
| 🔴 Critique | ... | ... | ... | ... |
| 🟠 Important | ... | ... | ... | ... |
| 🟡 Mineur | ... | ... | ... | ... |

Termine par un **résumé exécutif** avec les 3 actions prioritaires.
