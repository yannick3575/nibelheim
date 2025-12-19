# API Tech Watch - Documentation

Cette API permet de créer et gérer des articles dans le système Tech Watch via des tokens d'authentification.

## 📍 Endpoints

### Créer un Article

**Endpoint:**
```
POST https://nibelheim.vercel.app/api/automation/tech-watch/articles
```

**Authentification:**

Utiliser l'un de ces deux formats de header :
- `Authorization: Bearer <token>`
- `x-api-key: <token>`

Le token doit avoir le scope `tech-watch:write`.

**Body (JSON):**

```typescript
{
  title: string;         // REQUIS - Titre de l'article (1-500 caractères)
  url: string;           // REQUIS - URL valide de l'article
  source: string;        // REQUIS - Nom de la source (1-100 caractères)
  content?: string;      // OPTIONNEL - Contenu complet de l'article
  summary?: string;      // OPTIONNEL - Résumé de l'article
  tags?: string[];       // OPTIONNEL - Tableau de tags
  published_at?: string; // OPTIONNEL - Date ISO-8601 (ex: "2025-12-19T10:00:00Z")
}
```

**Exemple de Payload:**

```json
{
  "title": "Introducing GPT-5: The Next Generation of AI",
  "url": "https://openai.com/blog/gpt-5",
  "source": "OpenAI Blog",
  "content": "OpenAI today announced GPT-5, the latest iteration of their large language model series...",
  "summary": "OpenAI announces GPT-5 with breakthrough capabilities in reasoning and multimodal understanding.",
  "tags": ["ai", "gpt", "openai", "llm", "breakthrough"],
  "published_at": "2025-12-19T10:00:00Z"
}
```

**Réponses:**

**✅ Succès (201 Created):**
```json
{
  "article": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introducing GPT-5: The Next Generation of AI",
    "url": "https://openai.com/blog/gpt-5",
    "source": "OpenAI Blog",
    "content": "OpenAI today announced...",
    "summary": "OpenAI announces GPT-5...",
    "tags": ["ai", "gpt", "openai", "llm", "breakthrough"],
    "published_at": "2025-12-19T10:00:00Z",
    "created_at": "2025-12-19T10:05:32Z",
    "user_id": "user-uuid-here",
    "is_read": false,
    "is_favorite": false
  }
}
```

**❌ Erreur 400 - Validation:**
```json
{
  "error": "Invalid request body",
  "details": [
    {
      "code": "invalid_type",
      "path": ["title"],
      "message": "Required"
    },
    {
      "code": "invalid_string",
      "path": ["url"],
      "message": "Invalid url"
    }
  ]
}
```

**❌ Erreur 401 - Non Autorisé:**
```json
{
  "error": "Unauthorized - tech-watch:write scope required"
}
```

**❌ Erreur 500 - Serveur:**
```json
{
  "error": "Internal server error"
}
```

---

### Lister les Articles

**Endpoint:**
```
GET https://nibelheim.vercel.app/api/automation/tech-watch/articles
```

**Authentification:**

Le token doit avoir le scope `tech-watch:read`.

**Query Parameters:**

- `limit` (number) - Nombre d'articles à retourner (défaut: 50, max: 100)
- `offset` (number) - Nombre d'articles à sauter (défaut: 0)
- `unreadOnly` (boolean) - Retourner uniquement les articles non lus (défaut: false)

**Exemple:**
```
GET https://nibelheim.vercel.app/api/automation/tech-watch/articles?limit=20&offset=0&unreadOnly=true
```

**Réponse (200 OK):**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Article Title",
      "url": "https://example.com/article",
      "source": "Source Name",
      ...
    }
  ],
  "count": 20,
  "limit": 20,
  "offset": 0
}
```

---

## 🧪 Exemples d'Utilisation

### cURL

**Créer un article:**
```bash
curl -X POST https://nibelheim.vercel.app/api/automation/tech-watch/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Understanding Transformers in Deep Learning",
    "url": "https://arxiv.org/abs/example",
    "source": "arXiv",
    "summary": "A comprehensive guide to transformer architectures",
    "tags": ["ml", "transformers", "deep-learning"]
  }'
```

**Lister les articles non lus:**
```bash
curl -X GET "https://nibelheim.vercel.app/api/automation/tech-watch/articles?unreadOnly=true&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript/TypeScript (fetch)

```typescript
async function createArticle() {
  const response = await fetch('https://nibelheim.vercel.app/api/automation/tech-watch/articles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
    body: JSON.stringify({
      title: 'Understanding Transformers in Deep Learning',
      url: 'https://arxiv.org/abs/example',
      source: 'arXiv',
      summary: 'A comprehensive guide to transformer architectures',
      tags: ['ml', 'transformers', 'deep-learning']
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error);
    return;
  }

  const { article } = await response.json();
  console.log('Article created:', article);
}
```

### Python (requests)

```python
import requests

def create_article():
    url = 'https://nibelheim.vercel.app/api/automation/tech-watch/articles'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
    data = {
        'title': 'Understanding Transformers in Deep Learning',
        'url': 'https://arxiv.org/abs/example',
        'source': 'arXiv',
        'summary': 'A comprehensive guide to transformer architectures',
        'tags': ['ml', 'transformers', 'deep-learning']
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 201:
        article = response.json()['article']
        print(f"Article created: {article['id']}")
    else:
        print(f"Error: {response.json()}")

create_article()
```

---

## 🔐 Gestion des Sources

### Créer une Source

**Endpoint:**
```
POST https://nibelheim.vercel.app/api/automation/tech-watch/sources
```

**Authentification:**

Le token doit avoir le scope `tech-watch:write`.

**Body (JSON):**

```typescript
{
  type: 'rss' | 'api' | 'manual';  // REQUIS - Type de source
  name: string;                     // REQUIS - Nom de la source (1-200 caractères)
  url?: string;                     // OPTIONNEL - URL de la source
  config?: Record<string, any>;     // OPTIONNEL - Configuration additionnelle
}
```

**Exemple:**
```json
{
  "type": "rss",
  "name": "Hacker News",
  "url": "https://news.ycombinator.com/rss"
}
```

**Réponse (201 Created):**
```json
{
  "source": {
    "id": "uuid",
    "type": "rss",
    "name": "Hacker News",
    "url": "https://news.ycombinator.com/rss",
    "created_at": "2025-12-19T10:00:00Z"
  }
}
```

### Lister les Sources

**Endpoint:**
```
GET https://nibelheim.vercel.app/api/automation/tech-watch/sources
```

**Authentification:**

Le token doit avoir le scope `tech-watch:read`.

**Réponse (200 OK):**
```json
{
  "sources": [
    {
      "id": "uuid",
      "type": "rss",
      "name": "Hacker News",
      "url": "https://news.ycombinator.com/rss",
      ...
    }
  ],
  "count": 5
}
```

---

## 🔑 Gestion des Tokens API

Les tokens API sont gérés depuis l'interface web de Nibelheim.

### Créer un Token

1. Accéder à `/settings/api-tokens` dans l'interface web
2. Cliquer sur "Create Token"
3. Donner un nom au token
4. Sélectionner les scopes nécessaires :
   - `tech-watch:read` - Lecture des articles et sources
   - `tech-watch:write` - Création d'articles et sources
   - `*` - Tous les scopes (utiliser avec précaution)
5. Optionnel : Définir une date d'expiration
6. Copier le token (il ne sera affiché qu'une seule fois)

### Scopes Disponibles

- `tech-watch:read` - Lecture des données Tech Watch
- `tech-watch:write` - Création et modification des données Tech Watch
- `*` - Accès complet (tous les scopes)

---

## 📊 Logs d'Automatisation

Toutes les actions via l'API sont automatiquement enregistrées dans la table `automation_logs` avec :
- L'action effectuée (`article.create`, `article.list`, etc.)
- Le type de ressource (`article`, `source`)
- L'ID de la ressource (si applicable)
- Les métadonnées de l'action
- Le statut de succès/échec
- Le timestamp

Ces logs peuvent être consultés depuis l'interface web ou via l'API (à venir).

---

## 🛡️ Sécurité

- Les tokens sont stockés de manière sécurisée dans la base de données
- Les scopes permettent un contrôle granulaire des permissions
- Les tokens peuvent expirer automatiquement
- Chaque utilisation du token met à jour `last_used_at`
- Les tokens peuvent être révoqués à tout moment
- L'authentification utilise le service role de Supabase pour valider les tokens

---

## 💡 Bonnes Pratiques

1. **Ne jamais exposer votre token** - Ne le commitez pas dans Git, ne le partagez pas publiquement
2. **Utiliser des scopes minimaux** - Donnez uniquement les permissions nécessaires
3. **Définir une expiration** - Les tokens qui expirent réduisent les risques
4. **Révoquer les tokens inutilisés** - Gardez votre liste de tokens propre
5. **Valider les données** - L'API valide automatiquement, mais vérifiez côté client aussi
6. **Gérer les erreurs** - Implémentez une gestion d'erreur robuste (retry, fallback, etc.)
7. **Logger les actions** - Les logs d'automatisation sont disponibles pour le debugging

---

## 🐛 Debugging

### Token invalide ou expiré
```json
{ "error": "Unauthorized" }
```
→ Vérifiez que votre token est correct et n'a pas expiré

### Scope insuffisant
```json
{ "error": "Unauthorized - tech-watch:write scope required" }
```
→ Créez un nouveau token avec le scope `tech-watch:write`

### Données invalides
```json
{
  "error": "Invalid request body",
  "details": [...]
}
```
→ Consultez les `details` pour voir les champs problématiques

### Erreur serveur
```json
{ "error": "Internal server error" }
```
→ Vérifiez les logs côté serveur ou contactez l'administrateur

---

## 📚 Ressources

- Code source : `src/app/api/automation/tech-watch/`
- Schémas de validation : `src/app/api/automation/tech-watch/articles/route.ts`
- Authentification : `src/lib/api-auth.ts`
- Base de données : Tables `tech_watch_articles`, `tech_watch_sources`, `api_tokens`

---

**Dernière mise à jour :** 2025-12-19
