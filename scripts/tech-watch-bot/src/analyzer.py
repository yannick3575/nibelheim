import os
import logging
from typing import Dict, Any, List
import google.generativeai as genai

logger = logging.getLogger(__name__)

# System Prompt as defined in specs
SYSTEM_PROMPT = """Tu es un CTO expérimenté et sceptique. Analyse cet article et la discussion Hacker News associée.

Le Pitch : En une phrase, quelle est l'innovation prétendue ?

Le Verdict Communautaire : Est-ce que les experts de Hacker News valident ou détruisent l'idée ? Identifie les contre-arguments techniques majeurs.

TL;DR Pépite : Est-ce que je dois vraiment lire cet article ou est-ce juste du marketing ? Sois tranchant.
"""

def analyze_article(article_content: str, comments: List[Dict[str, str]], title: str) -> str:
    """
    Sends the article content and comments to the LLM for analysis.
    Returns the markdown analysis.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        logger.error("No API key found. Please set GEMINI_API_KEY.")
        return "Error: No GEMINI_API_KEY configured."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Format the input for the LLM
        comments_text = "\n".join([f"- {c['author']}: {c['text']}" for c in comments])
        
        user_message = f"""
        Titre de l'article : {title}
        
        --- CONTENU DE L'ARTICLE ---
        {article_content[:15000]} 
        (Contenu tronqué si trop long)
        
        --- COMMENTAIRES HACKER NEWS (Top Level) ---
        {comments_text}
        """
        
        # Combine system prompt and user message for Gemini (or use system_instruction if supported by lib version, 
        # but simple concatenation is robust for 1.5 flash/pro)
        full_prompt = f"{SYSTEM_PROMPT}\n\n{user_message}"

        logger.info(f"Sending analysis request for '{title}' to Gemini")
        response = model.generate_content(full_prompt)
        
        return response.text
        
    except Exception as e:
        logger.error(f"Error during Gemini analysis: {e}")
        return f"Error analyzing article: {str(e)}"

if __name__ == "__main__":
    # Test stub
    pass
