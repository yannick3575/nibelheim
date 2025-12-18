import os
import logging
import time
import re
from typing import Dict, Any, List, Tuple, Optional
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

logger = logging.getLogger(__name__)

# Rate limiting configuration
REQUESTS_PER_MINUTE = 10  # Conservative limit to stay under quota
MIN_DELAY_BETWEEN_REQUESTS = 60 / REQUESTS_PER_MINUTE  # 6 seconds between requests
MAX_RETRIES = 3
INITIAL_BACKOFF = 10  # Start with 10 seconds

_last_request_time = 0

# System Prompt as defined in specs
SYSTEM_PROMPT = """Tu es un CTO expérimenté et sceptique. Analyse cet article et la discussion Hacker News associée.

Le Pitch : En une phrase, quelle est l'innovation prétendue ?

Le Verdict Communautaire : Est-ce que les experts de Hacker News valident ou détruisent l'idée ? Identifie les contre-arguments techniques majeurs.

TL;DR Pépite : Est-ce que je dois vraiment lire cet article ou est-ce juste du marketing ? Sois tranchant.

Metadata : Génère 3 tags techniques précis pour l'indexation sémantique, formatés ainsi: Tags: [tag1, tag2, tag3]

Warning : Si une information est incertaine ou la source mal formée, ajoute obligatoirement [⚠️] devant l'explication.
"""


def extract_tags_from_analysis(analysis: str) -> List[str]:
    """
    Extract tags from the analysis text.
    Looks for pattern: Tags: [tag1, tag2, tag3]
    Returns empty list if no tags found.
    """
    if not analysis:
        return []

    # Pattern: Tags: [tag1, tag2, tag3] or Tags: tag1, tag2, tag3
    patterns = [
        r'Tags?\s*:\s*\[([^\]]+)\]',  # Tags: [tag1, tag2, tag3]
        r'Tags?\s*:\s*([^\n]+)',       # Tags: tag1, tag2, tag3
    ]

    for pattern in patterns:
        match = re.search(pattern, analysis, re.IGNORECASE)
        if match:
            tags_str = match.group(1)
            # Split by comma and clean up
            tags = [tag.strip().strip('"\'') for tag in tags_str.split(',')]
            # Filter empty and limit to 5 tags
            tags = [t for t in tags if t and len(t) > 1][:5]
            if tags:
                logger.debug(f"Extracted tags: {tags}")
                return tags

    logger.debug("No tags found in analysis")
    return []


def _wait_for_rate_limit():
    """Enforce rate limiting between API requests."""
    global _last_request_time
    now = time.time()
    elapsed = now - _last_request_time
    if elapsed < MIN_DELAY_BETWEEN_REQUESTS:
        sleep_time = MIN_DELAY_BETWEEN_REQUESTS - elapsed
        logger.debug(f"Rate limiting: sleeping {sleep_time:.1f}s")
        time.sleep(sleep_time)
    _last_request_time = time.time()


def _call_gemini_with_retry(model, prompt: str, title: str) -> str:
    """Call Gemini API with exponential backoff retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            _wait_for_rate_limit()
            response = model.generate_content(prompt)
            return response.text

        except google_exceptions.ResourceExhausted as e:
            # Quota exceeded - wait and retry
            backoff = INITIAL_BACKOFF * (2 ** attempt)
            logger.warning(
                f"Quota exceeded for '{title}' (attempt {attempt + 1}/{MAX_RETRIES}). "
                f"Waiting {backoff}s before retry..."
            )
            if attempt < MAX_RETRIES - 1:
                time.sleep(backoff)
            else:
                raise

        except google_exceptions.TooManyRequests as e:
            # Rate limit - wait and retry
            backoff = INITIAL_BACKOFF * (2 ** attempt)
            logger.warning(
                f"Rate limited for '{title}' (attempt {attempt + 1}/{MAX_RETRIES}). "
                f"Waiting {backoff}s before retry..."
            )
            if attempt < MAX_RETRIES - 1:
                time.sleep(backoff)
            else:
                raise

        except Exception as e:
            # Other errors - don't retry
            raise

    # Should not reach here
    raise RuntimeError("Max retries exceeded")


def analyze_article(article_content: str, comments: List[Dict[str, str]], title: str) -> str:
    """
    Sends the article content and comments to the LLM for analysis.
    Returns the markdown analysis.
    Includes rate limiting and retry logic for quota management.
    """
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        logger.error("No API key found. Please set GEMINI_API_KEY.")
        return "Error: No GEMINI_API_KEY configured."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3-flash-preview')

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

        full_prompt = f"{SYSTEM_PROMPT}\n\n{user_message}"

        logger.info(f"Sending analysis request for '{title}' to Gemini")
        result = _call_gemini_with_retry(model, full_prompt, title)
        logger.info(f"Successfully analyzed '{title}'")
        return result

    except google_exceptions.ResourceExhausted as e:
        logger.error(f"Quota exhausted after retries for '{title}': {e}")
        return None  # Return None to skip this article instead of storing error

    except google_exceptions.TooManyRequests as e:
        logger.error(f"Rate limit exceeded after retries for '{title}': {e}")
        return None  # Return None to skip this article instead of storing error

    except Exception as e:
        logger.error(f"Error during Gemini analysis for '{title}': {e}")
        return None  # Return None to skip this article instead of storing error

if __name__ == "__main__":
    # Test stub
    pass
