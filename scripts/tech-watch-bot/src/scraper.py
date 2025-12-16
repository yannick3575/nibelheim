import trafilatura
import requests
import logging
from typing import List, Dict, Optional
import re

logger = logging.getLogger(__name__)

def clean_html_content(url: str) -> Optional[str]:
    """
    Downloads and extracts the main text content from a URL using Trafilatura.
    Returns the text content or None if extraction failed.
    """
    try:
        logger.info(f"Downloading content from {url}")
        downloaded = trafilatura.fetch_url(url)
        if downloaded is None:
            logger.warning(f"Failed to download content from {url}")
            return None
            
        result = trafilatura.extract(downloaded, include_comments=False, include_tables=True, favor_precision=True)
        if not result:
             logger.warning(f"Trafilatura could not extract text from {url}")
             return None
             
        return result
    except Exception as e:
        logger.error(f"Error scraping article content: {e}")
        return None


def fetch_hn_comments(comments_url: str, limit: int = 5) -> List[Dict[str, str]]:
    """
    Fetches the top comments from a Hacker News discussion using the Algolia API.
    We use Algolia API because scraping HN HTML is brittle and API is cleaner.
    
    The comments_url from RSS is usually like 'https://news.ycombinator.com/item?id=123456'.
    We extract the ID and query Algolia.
    """
    try:
        # Extract ID from URL
        match = re.search(r'id=(\d+)', comments_url)
        if not match:
            logger.warning(f"Could not extract HN Item ID from {comments_url}")
            return []
            
        item_id = match.group(1)
        api_url = f"https://hn.algolia.com/api/v1/items/{item_id}"
        
        logger.info(f"Fetching properties from Algolia API: {api_url}")
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()
        
        comments_data = []
        children = data.get("children", [])
        
        # Sort by points if available, but usually top-level order is good enough on HN
        # Algolia returns them in a specific order, let's just take the first N text comments
        
        count = 0
        for child in children:
            if count >= limit:
                break
            
            text = child.get("text")
            author = child.get("author")
            
            if text and author: # Filter out deleted/empty
                # Algolia returns HTML in text, we might want to clean it a bit but LLM handles it well.
                # Let's do a basic strip of HTML tags for cleanliness if needed, 
                # but trafilatura is for the article. For comments, raw text/html is okay for LLM.
                # We'll simple cleaning: replace <p> with newlines
                clean_text = text.replace('<p>', '\n').replace('</p>', '')
                # Remove other tags roughly
                clean_text = re.sub(r'<[^>]+>', '', clean_text)
                
                comments_data.append({
                    "author": author,
                    "text": clean_text.strip()
                })
                count += 1
                
        return comments_data

    except Exception as e:
        logger.error(f"Error fetching HN comments: {e}")
        return []

if __name__ == "__main__":
    # Quick test
    logging.basicConfig(level=logging.INFO)
    
    # Test article
    # print(clean_html_content("https://example.com"))
    
    # Test comments (using a known HN ID for testing)
    # https://news.ycombinator.com/item?id=38870348 (Python 3.13 JIT)
    comments = fetch_hn_comments("https://news.ycombinator.com/item?id=38870348")
    for c in comments:
        print(f"--- {c['author']} ---\n{c['text'][:100]}...\n")
