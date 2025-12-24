# Rapport d'Audit Technique - Projet Nibelheim

## 1. Sécurité (Critical & Major)

### 🔴 Critical Issues
1. **Stockage des Tokens API en clair** :
   - Fichier : `src/lib/api-auth.ts` et `supabase/migrations/004_api_tokens.sql`
   - **Problème** : Les tokens sont stockés sans hachage (`token TEXT NOT NULL UNIQUE`). Si la base de données est compromise, tous les tokens le sont également.
   - **Recommandation** : Stocker uniquement un hash (ex: Argon2 ou SHA-256) du token. Lors de la création, afficher le token une seule fois à l'utilisateur.

2. **Exposition potentielle de `SUPABASE_SERVICE_ROLE_KEY`** :
   - Fichier : `src/lib/api-auth.ts`
   - **Problème** : Ce fichier importe `NextRequest` (Edge/Server) mais est situé dans `src/lib`, ce qui pourrait être importé par erreur dans un composant Client. Bien que Next.js bloque l'exposition directe via `process.env` (non préfixé par `NEXT_PUBLIC_`), l'utilisation de la clé Service Role doit être strictement cloisonnée côté serveur (ex: `src/server/` ou via des vérifications `server-only`).
   - **Recommandation** : Déplacer toute la logique utilisant `SERVICE_ROLE` dans des Server Actions ou des Route Handlers dédiés, et utiliser le package `server-only` pour prévenir les imports accidentels côté client.

### 🟡 Major Issues
1. **RLS (Row Level Security)** :
   - Les politiques RLS semblent correctes (isolation par `user_id`).
   - *Vigilance* : Assurez-vous que les fonctions PostgreSQL comme `handle_new_user` (`SECURITY DEFINER`) ne donnent pas de privilèges excessifs involontaires.

---

## 2. Performance & Scalability

### ⚡ Optimizations
1. **Calculs Mathématiques (Stochastic Lab)** :
   - Fichier : `src/lib/stochastic-lab/simulations.ts`
   - **Problème** : Les simulations (Monte Carlo) s'exécutent sur le thread principal (Main Thread). Pour de grandes itérations (>100k) ou des visualisations complexes, cela bloquera l'UI.
   - **Recommandation** : Déporter ces calculs dans un **Web Worker** dédié.
   - **Problème Mémoire** : Stocker toutes les valeurs (`values: number[]`) pour 1M+ itérations peut causer des crashs mémoire.
   - **Recommandation** : Implémenter un calcul statistique incrémental (Welford's algorithm) et ne stocker que les données nécessaires à l'histogramme/convergence, pas l'intégralité des échantillons bruts.

2. **Server Actions vs Edge** :
   - Fichier : `src/modules/stochastic-lab/actions/agent.ts`
   - **Analyse** : L'action utilise `GoogleGenerativeAI` qui effectue des appels HTTP. Le temps d'exécution est dominé par l'I/O (attente API).
   - **Verdict** : Migrer vers le **Edge Runtime** pourrait réduire les coûts (durée d'exécution plus légère) et le "cold start", bien que l'impact soit modéré ici car la latence vient surtout de Gemini.

3. **Base de Données** :
   - **Index manquants** : Bien que Supabase indexe les clés primaires, les Foreign Keys utilisées pour le filtrage (ex: `user_id` dans `tech_watch_articles` si filtré sans l'URL) bénéficieraient d'index explicites pour les requêtes de type `WHERE user_id = ...`.
   - *Note* : La contrainte `UNIQUE(user_id, url)` crée implicitement un index composite qui aide, mais un index simple sur `user_id` est souvent préférable pour les jointures simples.

---

## 3. Architecture & Bonnes Pratiques

### 🏗 Architecture Debt
1. **Gestion des Erreurs dans les Simulations** :
   - `src/lib/stochastic-lab/simulations.ts` lance des erreurs synchrones (ex: `throw new Error`). Si non attrapées correctement dans l'UI qui appelle cette lib, cela peut faire crasher l'application (White Screen of Death).
   - **Conseil** : Wrapper les exécutions dans des blocs `try/catch` robustes ou utiliser un pattern `Result<T, E>`.

### 🎨 Vibe Coding & Qualité
1. **Typage TypeScript** :
   - Fichier : `src/lib/stochastic-lab/types.ts`
   - **Feedback** : Excellent usage des Discriminated Unions (`DistributionParams`, `SimulationConfig`). Cela rend le code très sûr et autocomplétable. C'est une très bonne pratique à maintenir.

2. **Modularité** :
   - Le système de `registry.ts` avec `lazy imports` est très propre. Cela garantit que le code de "Stochastic Lab" n'est pas chargé si l'utilisateur est sur "Tech Watch". À conserver absolument.

---

## Synthèse

Le projet Nibelheim présente une base architecturale solide (Next.js 15, Supabase, Modularité). Les risques principaux sont la **sécurité des tokens API** (critique) et la **performance des simulations côté client** (bloquant pour l'UX à grande échelle). L'intégration de l'IA via Server Actions est standard et fonctionnelle.

**Priorité immédiate** : Hasher les tokens API et déplacer les calculs lourds dans un Web Worker.
