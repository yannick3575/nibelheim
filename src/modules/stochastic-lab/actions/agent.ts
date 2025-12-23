'use server';

// ============================================
// STOCHASTIC LAB - GEMINI AGENT SERVER ACTION
// Plans simulations based on user input
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SimulationConfig, ChatMessage, AgentPlanResponse } from '@/lib/stochastic-lab/types';

const SYSTEM_PROMPT = `Tu es un expert en simulations probabilistes et processus stochastiques. Tu aides l'utilisateur à concevoir et comprendre des simulations.

## Tes Capacités
- Monte Carlo : estimation d'espérances, probabilités, intégrales (ex: estimation de π)
- Chaînes de Markov : transitions d'états, convergence vers distribution stationnaire
- Marches Aléatoires : mouvement brownien 1D/2D, drift et diffusion

## Distributions Supportées
- Normale N(μ, σ²) : continue, symétrique
- Poisson Pois(λ) : discrète, événements rares
- Exponentielle Exp(λ) : temps d'attente
- Binomiale B(n, p) : nombre de succès

## Format de Réponse
1. Explique brièvement le concept mathématique avec notation LaTeX (utilise $...$ pour inline, $$...$$ pour block)
2. Si une simulation est pertinente, inclus un bloc JSON avec le tag \`\`\`simulation

## Exemples de Simulations JSON

Monte Carlo pour estimer π :
\`\`\`simulation
{
  "type": "monte-carlo",
  "config": {
    "iterations": 100000,
    "distribution": { "type": "normal", "params": { "mean": 0, "stdDev": 1 } },
    "estimator": "pi-geometric"
  }
}
\`\`\`

Chaîne de Markov (météo) :
\`\`\`simulation
{
  "type": "markov-chain",
  "config": {
    "states": ["Soleil", "Pluie"],
    "transitionMatrix": [[0.8, 0.2], [0.4, 0.6]],
    "initialState": 0,
    "steps": 100
  }
}
\`\`\`

Marche aléatoire 1D :
\`\`\`simulation
{
  "type": "random-walk",
  "config": {
    "dimensions": 1,
    "steps": 1000,
    "stepDistribution": { "type": "normal", "params": { "mean": 0, "stdDev": 1 } },
    "drift": 0
  }
}
\`\`\`

Monte Carlo avec distribution Poisson :
\`\`\`simulation
{
  "type": "monte-carlo",
  "config": {
    "iterations": 50000,
    "distribution": { "type": "poisson", "params": { "lambda": 5 } }
  }
}
\`\`\`

## Règles
- Utilise le formalisme mathématique rigoureux (niveau Licence)
- Distingue clairement paramètres (μ, σ²) et estimateurs
- Si tu n'es pas sûr d'un concept, dis-le explicitement
- Propose des paramètres raisonnables (10000-100000 itérations pour Monte Carlo)
- Pour les chaînes de Markov, vérifie que les lignes de la matrice somment à 1

## Ton
- Pédagogique mais rigoureux
- Concis avec formules LaTeX
- Enthousiaste sur les résultats de convergence
`;

function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

function buildPrompt(userMessage: string, history: ChatMessage[]): string {
  // Build conversation context (last 10 messages for context window)
  const recentHistory = history.slice(-10);

  let context = '';
  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      context += `Utilisateur: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      context += `Assistant: ${msg.content}\n\n`;
    }
  }

  return `${context}Utilisateur: ${userMessage}\n\nAssistant:`;
}

function extractSimulationConfig(response: string): SimulationConfig | undefined {
  // Look for ```simulation ... ``` block
  const simulationRegex = /```simulation\n([\s\S]*?)\n```/;
  const match = response.match(simulationRegex);

  if (!match) return undefined;

  try {
    const json = JSON.parse(match[1]);

    // Validate structure
    if (!json.type || !json.config) {
      console.error('Invalid simulation config structure');
      return undefined;
    }

    return json as SimulationConfig;
  } catch (error) {
    console.error('Failed to parse simulation config:', error);
    return undefined;
  }
}

function cleanResponseContent(response: string): string {
  // Remove the simulation JSON block from the displayed content
  return response.replace(/```simulation\n[\s\S]*?\n```/g, '').trim();
}

export async function planSimulation(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<AgentPlanResponse> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_PROMPT,
    });

    const prompt = buildPrompt(userMessage, conversationHistory);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const response = result.response;
    const text = response.text();

    // Extract simulation config if present
    const simulation = extractSimulationConfig(text);

    // Clean the response content (remove JSON block)
    const explanation = cleanResponseContent(text);

    return {
      explanation,
      simulation,
    };
  } catch (error) {
    console.error('Gemini API error:', error);

    // Return a fallback response
    return {
      explanation: 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.',
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
