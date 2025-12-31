# AI Inbox - Prompt Gemini

## Vue d'ensemble

Ce document définit le prompt utilisé pour analyser le contenu ajouté à AI Inbox.
L'objectif est de fournir une analyse personnalisée orientée "vibe coder" : 
qu'est-ce que je peux en faire ? Quelle complexité ? Quelles idées de projets ?

---

## System Prompt

```
Tu es un assistant expert pour développeurs "vibe coders" — des développeurs qui 
construisent des projets personnels en s'appuyant fortement sur l'IA générative 
(Claude, Cursor, Copilot, v0, Bolt, etc.).

Ta mission : analyser du contenu tech (vidéos YouTube, articles Substack, 
ressources diverses) et évaluer sa pertinence et son applicabilité pour 
le profil spécifique de l'utilisateur.

Tu dois être :
- Pragmatique : focus sur ce qui est actionnable
- Concis : pas de blabla, va à l'essentiel
- Personnalisé : tes réponses doivent refléter le profil de l'utilisateur
- Créatif : propose des idées de projets concrètes

Tu réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.
```

---

## User Prompt Template

```
## Profil de l'utilisateur

```json
${JSON.stringify(userProfile, null, 2)}
```

## Contenu à analyser

**Titre**: ${item.title}
**Type de source**: ${item.source_type}
**URL**: ${item.url || "Non fournie"}

**Contenu brut**:
${item.raw_content || "Aucun contenu extrait. Analyse basée uniquement sur le titre et l'URL."}

---

## Instructions

Analyse ce contenu du point de vue d'un vibe coder et retourne un JSON avec cette structure exacte :

{
    "summary": "2-3 phrases résumant l'essentiel du contenu. Sois concis et direct.",
    
    "actionability": <1-5>,
    
    "complexity": <1-5>,
    
    "project_ideas": [
        "Idée concrète #1 liée aux projets actuels de l'utilisateur",
        "Idée concrète #2 si pertinent"
    ],
    
    "relevance_to_profile": "1-2 phrases expliquant pourquoi ce contenu est (ou n'est pas) pertinent pour CE profil spécifique. Mentionne les technos/projets de l'utilisateur.",
    
    "suggested_category": "<tools|prompts|tutorials|news|inspiration>",
    
    "suggested_tags": ["tag1", "tag2", "tag3"]
}

IMPORTANT : Retourne UNIQUEMENT le JSON, sans backticks, sans markdown, sans texte avant ou après.
```

---

## Échelles de notation

### Actionability (1-5) : Puis-je l'utiliser immédiatement ?

| Score | Signification | Exemple |
|-------|---------------|---------|
| 1 | Théorique, conceptuel, peu applicable | "L'avenir de l'IA en 2030" |
| 2 | Intéressant mais nécessite recherche | "Nouvelle architecture LLM" |
| 3 | Applicable avec adaptation | "Comment j'ai construit X avec Y" |
| 4 | Tutorial applicable rapidement | "Setup MCP en 10 minutes" |
| 5 | Copy-paste ready, applicable aujourd'hui | "Prompt template pour..." |

### Complexity (1-5) : Temps/effort pour implémenter

| Score | Signification | Temps estimé |
|-------|---------------|--------------|
| 1 | Trivial | < 1 heure |
| 2 | Simple | 1-4 heures |
| 3 | Modéré | 1 journée |
| 4 | Complexe | 2-5 jours |
| 5 | Projet majeur | 1+ semaine |

---

## Catégories

| Catégorie | Description | Exemples |
|-----------|-------------|----------|
| `tools` | Nouveaux outils, extensions, services | Claude Code plugins, MCP servers, nouvelles APIs |
| `prompts` | Techniques de prompting, templates | System prompts, chain of thought, personas |
| `tutorials` | Guides, how-to, walkthroughs | "Build X with Y", "Setup guide for Z" |
| `news` | Actualités, annonces, releases | "GPT-5 released", "Anthropic raises $X" |
| `inspiration` | Projets cool, idées, démos | "Someone built X", "Crazy demo of Y" |

---

## Exemples de réponses attendues

### Exemple 1 : Vidéo YouTube tutorial

**Input:**
- Titre: "Claude Code + MCP = Unlimited Power"
- Source: youtube
- Profil: stack=[Next.js, Supabase], projects=[Nibelheim], interests=[AI agents]

**Output:**
```json
{
    "summary": "Tutorial montrant comment connecter Claude Code à des services externes via MCP. Démo d'un agent qui peut lire/écrire dans Notion et envoyer des emails.",
    "actionability": 5,
    "complexity": 2,
    "project_ideas": [
        "Ajouter un MCP server à Nibelheim pour que Claude puisse interagir avec ta base Supabase directement",
        "Créer un agent de veille qui push automatiquement dans AI Inbox"
    ],
    "relevance_to_profile": "Directement applicable : tu utilises déjà Claude Code et Supabase. MCP pourrait automatiser des tâches dans Nibelheim.",
    "suggested_category": "tutorials",
    "suggested_tags": ["mcp", "claude-code", "automation", "agents"]
}
```

### Exemple 2 : Article Substack opinion

**Input:**
- Titre: "Why Vibe Coding Will Replace Traditional Development"
- Source: substack
- Profil: skill_level=intermediate, interests=[vibe coding]

**Output:**
```json
{
    "summary": "Article d'opinion argumentant que le développement assisté par IA va devenir la norme. Cite des exemples de startups lancées sans devs traditionnels.",
    "actionability": 2,
    "complexity": 1,
    "project_ideas": [
        "Documenter ton propre workflow vibe coding pour un article de blog"
    ],
    "relevance_to_profile": "Validation de ton approche actuelle. Pas directement actionnable mais renforce ta conviction sur le vibe coding.",
    "suggested_category": "inspiration",
    "suggested_tags": ["vibe-coding", "opinion", "future-of-dev"]
}
```

### Exemple 3 : Contenu peu pertinent

**Input:**
- Titre: "Introduction to Machine Learning with TensorFlow"
- Source: youtube
- Profil: interests=[AI agents, vibe coding] (pas de ML)

**Output:**
```json
{
    "summary": "Cours d'introduction au ML classique avec TensorFlow. Couvre les bases : régression, classification, réseaux de neurones simples.",
    "actionability": 2,
    "complexity": 4,
    "project_ideas": [
        "Si tu veux prédire des tendances dans tes données Tech Watch, les bases ML pourraient servir"
    ],
    "relevance_to_profile": "Peu pertinent pour ton profil actuel orienté vibe coding et agents. Le ML from scratch est plus lourd que d'utiliser des APIs LLM.",
    "suggested_category": "tutorials",
    "suggested_tags": ["ml", "tensorflow", "basics"]
}
```

---

## Gestion des erreurs

Si Gemini ne peut pas analyser le contenu (titre trop vague, pas de contenu), retourner :

```json
{
    "summary": "Impossible d'analyser ce contenu. Le titre seul ne fournit pas assez de contexte.",
    "actionability": 1,
    "complexity": 1,
    "project_ideas": [],
    "relevance_to_profile": "Ajoute du contenu brut (transcript, article) pour une meilleure analyse.",
    "suggested_category": "news",
    "suggested_tags": []
}
```

---

## Configuration API

### Modèle recommandé

```javascript
const model = 'gemini-2.0-flash'; // ou gemini-1.5-pro pour plus de précision
```

### Paramètres

```javascript
const generationConfig = {
    temperature: 0.3,      // Réponses cohérentes et factuelles
    maxOutputTokens: 1024, // Suffisant pour le JSON
    topP: 0.8,
};
```

### Parsing de la réponse

```typescript
function parseGeminiResponse(text: string): AIAnalysis | null {
    try {
        // Nettoyer les éventuels backticks markdown
        const cleaned = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        
        const parsed = JSON.parse(cleaned);
        
        // Validation basique
        if (!parsed.summary || typeof parsed.actionability !== 'number') {
            return null;
        }
        
        return parsed as AIAnalysis;
    } catch (error) {
        console.error('Failed to parse Gemini response:', error);
        return null;
    }
}
```

---

## Notes d'implémentation

1. **Rate limiting** : Gemini a des limites. Implémenter un retry avec backoff.

2. **Async processing** : L'analyse ne doit pas bloquer la création de l'item. 
   Créer l'item d'abord, puis lancer l'analyse en background.

3. **Fallback** : Si l'analyse échoue après 3 tentatives, stocker `ai_analysis = null` 
   et permettre à l'utilisateur de relancer manuellement.

4. **Cache** : Pas de cache nécessaire car chaque analyse est unique (profil utilisateur).

5. **Coût** : Gemini Flash est économique (~$0.075/1M tokens). 
   Une analyse type coûte ~0.001$ (1-2k tokens).
