# 🚀 Setup Guide - Tech Watch Automation API

Guide complet pour configurer l'API d'automation Tech Watch avec l'extension Claude Chrome.

## 📋 Prérequis

- Projet Nibelheim fonctionnel avec Supabase
- Accès à votre dashboard Supabase
- Node.js et npm installés
- (Optionnel) Extension Claude Chrome installée

---

## 1️⃣ Appliquer la migration de base de données

### Option A: Via Supabase Dashboard (Recommandé)

1. **Connectez-vous à votre projet Supabase**
   - URL: https://supabase.com/dashboard/project/zwchgitufuluxeaovjbt

2. **Ouvrez le SQL Editor**
   - Menu: `Database` > `SQL Editor`
   - Cliquez sur `+ New query`

3. **Copiez et exécutez la migration**
   - Ouvrez le fichier: `supabase/migrations/004_api_tokens.sql`
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL
   - Cliquez sur `Run`

4. **Vérifiez la création des tables**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('api_tokens', 'automation_logs');
   ```

   Vous devriez voir 2 lignes retournées.

### Option B: Via CLI Supabase (si installé)

```bash
# Si vous avez Supabase CLI installé
supabase db push
```

---

## 2️⃣ Vérifier les variables d'environnement

Assurez-vous que votre `.env.local` contient bien:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zwchgitufuluxeaovjbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # IMPORTANT pour l'API automation
```

⚠️ La `SUPABASE_SERVICE_ROLE_KEY` est **cruciale** pour l'API automation car elle permet de bypasser RLS.

---

## 3️⃣ Tester l'installation

### Démarrer le serveur de développement

```bash
npm run dev
```

### Tester la création d'un token API

#### A. Via l'interface web (après login)

1. Naviguez vers `http://localhost:3000`
2. Connectez-vous à votre compte
3. Ouvrez la console du navigateur
4. Exécutez:

```javascript
fetch('http://localhost:3000/api/tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Test Token',
    scopes: ['tech-watch:read', 'tech-watch:write'],
    expiresInDays: 90
  })
})
.then(r => r.json())
.then(console.log);
```

Vous devriez recevoir un token commençant par `nbh_`.

#### B. Via curl (avec session)

Si vous avez un cookie de session valide:

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

### Tester l'API automation

Une fois que vous avez un token (ex: `nbh_abc123...`):

```bash
# Test 1: Créer un article
curl -X POST http://localhost:3000/api/automation/tech-watch/articles \
  -H "Authorization: Bearer nbh_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "url": "https://example.com/test",
    "source": "Test Source",
    "tags": ["test"]
  }'

# Test 2: Lister les articles
curl -X GET http://localhost:3000/api/automation/tech-watch/articles \
  -H "Authorization: Bearer nbh_abc123..."

# Test 3: Créer une source
curl -X POST http://localhost:3000/api/automation/tech-watch/sources \
  -H "Authorization: Bearer nbh_abc123..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "manual",
    "name": "Test Source",
    "url": "https://example.com"
  }'
```

Si tous les tests retournent un JSON valide (pas d'erreur 401/500), votre API est prête! ✅

---

## 4️⃣ Configuration Claude Chrome

### Créer un token dédié

1. Créez un token API depuis votre application web:

```javascript
// Dans la console du navigateur (après login)
const response = await fetch('http://localhost:3000/api/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Claude Chrome - Production',
    scopes: ['tech-watch:read', 'tech-watch:write'],
    expiresInDays: 90
  })
});

const { token } = await response.json();
console.log('Token:', token);
// Copiez ce token immédiatement!
```

2. **Sauvegardez le token en sécurité**

### Premier workflow Claude Chrome

Ouvrez Claude Chrome et demandez:

```
"Teste mon API Nibelheim:

1. Envoie une requête POST à http://localhost:3000/api/automation/tech-watch/articles
2. Utilise ce token: nbh_[votre_token]
3. Crée un article de test avec:
   - title: "Test Claude Chrome"
   - url: "https://example.com/test-claude-chrome"
   - source: "Claude Chrome Test"
   - tags: ["test", "automation"]

4. Ensuite, liste les articles avec GET sur la même API

5. Montre-moi les résultats"
```

Si Claude Chrome vous retourne l'article créé, félicitations! 🎉

---

## 5️⃣ Workflows recommandés

### Workflow 1: Collecte quotidienne TechCrunch

Demandez à Claude Chrome:

```
"Crée une tâche programmée quotidienne (9h) qui:

1. Va sur https://techcrunch.com/category/artificial-intelligence/
2. Extrait les 10 derniers articles (titre, URL)
3. Pour chaque article, envoie une requête POST à:
   http://localhost:3000/api/automation/tech-watch/articles

   Headers:
   - Authorization: Bearer nbh_[votre_token]

   Body pour chaque article:
   {
     "title": "titre extrait",
     "url": "url extraite",
     "source": "TechCrunch AI",
     "tags": ["ai", "techcrunch"]
   }

4. Confirme le nombre d'articles ajoutés"
```

### Workflow 2: Veille multi-sources parallèle

```
"Collecte des articles depuis ces 3 sources en parallèle:

Sources:
- Hacker News (https://news.ycombinator.com/)
- Anthropic Blog (https://www.anthropic.com/news)
- OpenAI Blog (https://openai.com/blog)

Pour chaque source:
1. Extrait les 5 derniers articles
2. Envoie-les à http://localhost:3000/api/automation/tech-watch/articles
   avec token: nbh_[votre_token]

Utilise le multi-onglets pour optimiser le temps."
```

### Workflow 3: Enrichissement contextuel

```
"Pour chaque article non-lu dans mon Tech Watch:

1. Récupère la liste avec:
   GET http://localhost:3000/api/automation/tech-watch/articles?unreadOnly=true
   Authorization: Bearer nbh_[votre_token]

2. Pour les 3 premiers articles:
   - Ouvre l'URL de l'article
   - Extrait le contenu principal
   - Cherche des discussions sur Hacker News
   - Compile un résumé enrichi

3. (Future) Mettre à jour l'article avec le contenu enrichi"
```

---

## 6️⃣ Monitoring & Logs

### Consulter les logs d'automation

Les logs sont stockés dans `automation_logs`. Pour les consulter:

1. **Via Supabase Dashboard**
   - `Database` > `Tables` > `automation_logs`
   - Filtrez par `created_at` (dernières 24h)

2. **Via SQL**
   ```sql
   SELECT
     created_at,
     action,
     resource_type,
     metadata->>'title' as title,
     success
   FROM automation_logs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC
   LIMIT 50;
   ```

3. **Via API (à implémenter)**
   - Endpoint futur: `GET /api/automation/logs`

### Métriques utiles

```sql
-- Articles créés par automation dans les 7 derniers jours
SELECT COUNT(*) as articles_created
FROM automation_logs
WHERE action = 'article.create'
AND success = true
AND created_at > NOW() - INTERVAL '7 days';

-- Sources les plus actives
SELECT
  metadata->>'source' as source_name,
  COUNT(*) as article_count
FROM automation_logs
WHERE action = 'article.create'
AND created_at > NOW() - INTERVAL '30 days'
GROUP BY metadata->>'source'
ORDER BY article_count DESC;

-- Taux de succès par action
SELECT
  action,
  COUNT(*) as total,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM automation_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action;
```

---

## 7️⃣ Sécurité & Best Practices

### ✅ À faire

- Créez des tokens avec expiration (90 jours recommandé)
- Utilisez des noms descriptifs pour vos tokens
- Révoquez les tokens non-utilisés
- Surveillez les logs d'automation régulièrement
- Utilisez HTTPS en production

### ❌ À éviter

- Ne committez JAMAIS les tokens dans git
- N'utilisez pas le service role key côté client
- Ne partagez pas vos tokens publiquement
- N'utilisez pas HTTP en production
- Ne créez pas de tokens sans expiration

### Rotation des tokens

Tous les 90 jours:

1. Créez un nouveau token
2. Mettez à jour vos workflows Claude Chrome
3. Révoquez l'ancien token après vérification

---

## 8️⃣ Troubleshooting

### Erreur: "Unauthorized"

**Causes possibles:**
- Token invalide ou expiré
- Token mal formaté dans le header
- Scope insuffisant

**Solution:**
```bash
# Vérifiez le token dans Supabase
SELECT id, name, expires_at, scopes
FROM api_tokens
WHERE token = 'nbh_your_token';

# Si expiré, créez-en un nouveau
```

### Erreur: "SUPABASE_SERVICE_ROLE_KEY not found"

**Solution:**
Ajoutez la clé dans `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

Redémarrez le serveur:
```bash
npm run dev
```

### Erreur: "Table api_tokens does not exist"

**Solution:**
Appliquez la migration `004_api_tokens.sql` via Supabase SQL Editor.

### Articles en double

**Explication:**
La contrainte `UNIQUE(user_id, url)` empêche les doublons. Si l'URL existe déjà, l'article existant est retourné.

**Comportement normal:**
- 1ère fois: article créé (201)
- 2ème fois avec même URL: article existant retourné (201)

---

## 9️⃣ Prochaines étapes

### Features à implémenter

1. **Interface de gestion des tokens**
   - Page dédiée dans le dashboard
   - Liste, création, révocation visuelle

2. **Batch import**
   - Endpoint pour envoyer plusieurs articles en une requête
   - Limite: 100 articles par batch

3. **Webhooks**
   - Notification en temps réel quand un article est ajouté
   - Intégration Slack/Discord

4. **Analytics dashboard**
   - Visualisation des métriques d'automation
   - Graphiques de tendances

5. **API pour déclencher l'analyse IA**
   - Endpoint pour lancer l'analyse Gemini
   - Génération de résumés à la demande

### Améliorations de sécurité

- [ ] Rate limiting par token
- [ ] IP whitelisting (optionnel)
- [ ] Audit trail détaillé
- [ ] Alertes sur activité suspecte

---

## 📚 Ressources

- [Documentation API complète](./API_AUTOMATION.md)
- [Exemples cURL](./API_AUTOMATION.md#exemples-avec-curl)
- [Guide Claude Chrome](./API_AUTOMATION.md#utilisation-avec-claude-chrome)

---

## 🆘 Support

En cas de problème:

1. Vérifiez les logs serveur (terminal où `npm run dev` tourne)
2. Consultez les logs d'automation dans Supabase
3. Testez avec curl/Postman avant Claude Chrome
4. Vérifiez que toutes les variables d'environnement sont définies

**Checklist de debug:**
- [ ] Migration 004 appliquée?
- [ ] `.env.local` contient `SUPABASE_SERVICE_ROLE_KEY`?
- [ ] Token créé et non expiré?
- [ ] Header Authorization correct?
- [ ] Scope approprié pour l'action?
- [ ] Serveur dev démarré?

---

Bon automation! 🚀
