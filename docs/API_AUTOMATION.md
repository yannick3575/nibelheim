# Nibelheim Automation API

API pour automatiser Tech Watch avec l'extension Claude Chrome ou d'autres outils d'automation.

## 🔑 Authentification

### 1. Créer un token API

Depuis votre application Nibelheim (nécessite authentification):

```bash
POST http://localhost:3000/api/tokens
Content-Type: application/json

{
  "name": "Claude Chrome",
  "scopes": ["tech-watch:read", "tech-watch:write"],
  "expiresInDays": 90  // optionnel, null = jamais expire
}
```

**Réponse:**
```json
{
  "token": "nbh_abcdef123456...",
  "id": "uuid-here",
  "name": "Claude Chrome",
  "scopes": ["tech-watch:read", "tech-watch:write"],
  "expires_at": "2026-03-18T10:00:00Z",
  "created_at": "2025-12-18T10:00:00Z"
}
```

⚠️ **IMPORTANT:** Sauvegardez le token immédiatement, il ne sera plus affiché.

### 2. Utiliser le token

Deux méthodes pour s'authentifier:

**Option A: Header Authorization (recommandé)**
```
Authorization: Bearer nbh_abcdef123456...
```

**Option B: Header x-api-key**
```
x-api-key: nbh_abcdef123456...
```

### 3. Gérer les tokens

**Lister les tokens**
```bash
GET http://localhost:3000/api/tokens
```

**Révoquer un token**
```bash
DELETE http://localhost:3000/api/tokens/{token_id}
```

---

## 📰 Tech Watch - Articles

### Créer un article

```bash
POST http://localhost:3000/api/automation/tech-watch/articles
Authorization: Bearer nbh_your_token_here
Content-Type: application/json

{
  "title": "Anthropic Launches Claude Chrome Extension",
  "url": "https://www.anthropic.com/news/claude-for-chrome",
  "source": "Anthropic Blog",
  "content": "Full article content here...",
  "summary": "Claude extension allows browser automation...",
  "tags": ["ai", "automation", "chrome"],
  "published_at": "2025-08-26T10:00:00Z"
}
```

**Champs:**
- `title` (requis): Titre de l'article
- `url` (requis): URL de l'article
- `source` (requis): Nom de la source
- `content` (optionnel): Contenu complet
- `summary` (optionnel): Résumé
- `tags` (optionnel): Array de tags
- `published_at` (optionnel): Date de publication (ISO 8601)

**Réponse (201 Created):**
```json
{
  "article": {
    "id": "uuid-here",
    "user_id": "user-uuid",
    "title": "Anthropic Launches Claude Chrome Extension",
    "url": "https://www.anthropic.com/news/claude-for-chrome",
    "source": "Anthropic Blog",
    "content": "Full article content...",
    "summary": "Claude extension allows...",
    "tags": ["ai", "automation", "chrome"],
    "published_at": "2025-08-26T10:00:00Z",
    "collected_at": "2025-12-18T10:30:00Z",
    "read": false,
    "is_favorite": false
  }
}
```

**Notes:**
- Si l'URL existe déjà pour cet utilisateur, l'article existant est retourné (pas d'erreur)
- Scope requis: `tech-watch:write`

### Lister les articles

```bash
GET http://localhost:3000/api/automation/tech-watch/articles?limit=20&offset=0&unreadOnly=true
Authorization: Bearer nbh_your_token_here
```

**Query params:**
- `limit`: nombre d'articles (défaut: 50, max: 100)
- `offset`: pagination (défaut: 0)
- `unreadOnly`: seulement les non-lus (défaut: false)

**Réponse (200 OK):**
```json
{
  "articles": [
    {
      "id": "uuid-1",
      "title": "Article 1",
      "url": "https://...",
      "source": "...",
      ...
    }
  ],
  "count": 20,
  "limit": 20,
  "offset": 0
}
```

**Scope requis:** `tech-watch:read`

---

## 📡 Tech Watch - Sources

### Créer une source

```bash
POST http://localhost:3000/api/automation/tech-watch/sources
Authorization: Bearer nbh_your_token_here
Content-Type: application/json

{
  "type": "manual",
  "name": "TechCrunch AI",
  "url": "https://techcrunch.com/category/artificial-intelligence/",
  "config": {
    "selector": ".post-title",
    "frequency": "daily"
  }
}
```

**Champs:**
- `type` (requis): "rss" | "api" | "manual"
- `name` (requis): Nom de la source
- `url` (optionnel): URL de la source
- `config` (optionnel): Configuration JSON libre

**Réponse (201 Created):**
```json
{
  "source": {
    "id": "uuid-here",
    "user_id": "user-uuid",
    "type": "manual",
    "name": "TechCrunch AI",
    "url": "https://techcrunch.com/...",
    "config": { "selector": ".post-title", "frequency": "daily" },
    "enabled": true,
    "last_fetched_at": null,
    "created_at": "2025-12-18T10:00:00Z"
  }
}
```

**Scope requis:** `tech-watch:write`

### Lister les sources

```bash
GET http://localhost:3000/api/automation/tech-watch/sources
Authorization: Bearer nbh_your_token_here
```

**Scope requis:** `tech-watch:read`

### Mettre à jour une source

```bash
PATCH http://localhost:3000/api/automation/tech-watch/sources/{source_id}
Authorization: Bearer nbh_your_token_here
Content-Type: application/json

{
  "enabled": false,
  "name": "Updated Name",
  "url": "https://new-url.com",
  "config": { "new": "config" }
}
```

**Scope requis:** `tech-watch:write`

### Supprimer une source

```bash
DELETE http://localhost:3000/api/automation/tech-watch/sources/{source_id}
Authorization: Bearer nbh_your_token_here
```

**Scope requis:** `tech-watch:write`

---

## 🔍 Logging & Monitoring

Toutes les actions d'automation sont automatiquement loggées dans `automation_logs`.

Vous pouvez consulter les logs depuis votre dashboard Nibelheim pour:
- Auditer les actions automatisées
- Débugger les problèmes
- Analyser l'utilisation

Chaque log contient:
- `action`: type d'action (ex: "article.create", "source.update")
- `resource_type`: type de ressource ("article", "source")
- `resource_id`: ID de la ressource affectée
- `metadata`: contexte additionnel (titre, URL, etc.)
- `success`: booléen indiquant le succès/échec
- `error_message`: message d'erreur si échec
- `created_at`: timestamp de l'action

---

## 🤖 Exemples avec cURL

### Créer un token API

```bash
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Claude Chrome",
    "scopes": ["tech-watch:read", "tech-watch:write"],
    "expiresInDays": 90
  }'
```

### Ajouter un article

```bash
curl -X POST http://localhost:3000/api/automation/tech-watch/articles \
  -H "Authorization: Bearer nbh_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New AI Breakthrough",
    "url": "https://example.com/article",
    "source": "Example Blog",
    "tags": ["ai", "research"]
  }'
```

### Lister les articles non-lus

```bash
curl -X GET "http://localhost:3000/api/automation/tech-watch/articles?unreadOnly=true&limit=10" \
  -H "Authorization: Bearer nbh_your_token_here"
```

### Créer une source

```bash
curl -X POST http://localhost:3000/api/automation/tech-watch/sources \
  -H "Authorization: Bearer nbh_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "name": "Hacker News AI",
    "url": "https://news.ycombinator.com/"
  }'
```

---

## 🌐 Utilisation avec Claude Chrome

L'extension Claude Chrome peut interagir avec votre API Nibelheim pour automatiser la collecte d'articles.

### Configuration initiale

1. **Créez un token API** depuis votre dashboard Nibelheim
2. **Stockez le token** pour l'utiliser dans vos workflows Claude Chrome
3. **Configurez vos tâches** programmées ou workflows interactifs

### Exemple de workflow simple

Demandez à Claude Chrome:

```
"Va sur TechCrunch AI, extrait les 5 derniers articles et envoie-les à mon API Nibelheim.
Utilise ce token: nbh_your_token_here
API URL: http://localhost:3000/api/automation/tech-watch/articles"
```

Claude Chrome va:
1. Naviguer vers TechCrunch
2. Extraire les articles avec les sélecteurs appropriés
3. Envoyer chaque article via POST à votre API
4. Vous confirmer le nombre d'articles ajoutés

### Tâches programmées

Vous pouvez demander à Claude Chrome de créer des tâches récurrentes:

```
"Crée une tâche quotidienne (9h) qui:
1. Visite ces 3 sites: [liste]
2. Extrait les nouveaux articles
3. Les envoie à http://localhost:3000/api/automation/tech-watch/articles
   avec le token nbh_your_token_here"
```

### Multi-onglets pour veille parallèle

```
"Ouvre ces 5 sources en parallèle dans des onglets séparés,
extrait les articles de chacun et envoie-les tous à mon API Nibelheim"
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Stockage sécurisé des tokens**
   - Ne commitez JAMAIS les tokens dans git
   - Utilisez les variables d'environnement
   - Claude Chrome peut stocker le token en mémoire pour la session

2. **Scopes minimaux**
   - Créez des tokens avec les scopes minimaux nécessaires
   - `tech-watch:read` pour la lecture seule
   - `tech-watch:write` pour la lecture + écriture

3. **Expiration des tokens**
   - Définissez toujours une expiration (ex: 90 jours)
   - Renouvelez régulièrement les tokens
   - Révoquez immédiatement les tokens compromis

4. **Rate limiting**
   - Évitez les requêtes excessives (max ~10/sec)
   - Utilisez des délais entre les requêtes dans vos scripts

5. **Validation des données**
   - Validez toujours les URLs avant envoi
   - Nettoyez le contenu HTML avant soumission
   - Limitez la taille du contenu (~50KB max par article)

### HTTPS en production

⚠️ En production, utilisez **TOUJOURS HTTPS**:
```
https://votre-domaine.com/api/automation/...
```

Ne transmettez **JAMAIS** de tokens API via HTTP non-chiffré.

---

## ❌ Erreurs courantes

### 401 Unauthorized
```json
{ "error": "Unauthorized" }
```
- Token manquant ou invalide
- Token expiré
- Scope insuffisant

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "details": [...]
}
```
- Corps de requête invalide (vérifiez le schéma)
- Champs manquants ou mal formatés

### 500 Internal Server Error
```json
{ "error": "Internal server error" }
```
- Erreur serveur (vérifiez les logs)
- Problème de connexion à Supabase

---

## 📊 Limites

- **Articles**: 100 par requête GET
- **Taille du contenu**: ~50KB recommandé
- **Tokens**: Pas de limite par utilisateur
- **Rate limit**: ~10 requêtes/seconde (soft limit)

---

## 🆘 Support

En cas de problème:
1. Vérifiez les logs d'automation dans votre dashboard
2. Testez avec curl/Postman d'abord
3. Vérifiez que votre token n'est pas expiré
4. Consultez les logs serveur (console Next.js)

---

## 🚀 Prochaines étapes

Fonctionnalités à venir:
- [ ] Webhook pour notifications temps-réel
- [ ] Batch import (plusieurs articles en une requête)
- [ ] Génération automatique de résumés (IA)
- [ ] API pour déclencher l'analyse Gemini
- [ ] Export des données (JSON, CSV)
