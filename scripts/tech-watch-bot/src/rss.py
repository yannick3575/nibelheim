import feedparser
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

RSS_URL = "https://hnrss.org/newest?points=100"

def fetch_hn_feed(url: str = RSS_URL) -> List[Dict[str, Any]]:
    """
    Fetches the Hacker News RSS feed for articles with >100 points.
    Returns a list of dictionaries containing article metadata.
    """
    try:
        logger.info(f"Fetching RSS feed from {url}")
        feed = feedparser.parse(url)
        
        if feed.bozo:
             logger.warning(f"Feed parser reported an error: {feed.bozo_exception}")
        
        articles = []
        for entry in feed.entries:
            # Extract relevant fields
            article = {
                "id": entry.get("id", ""), # HN RSS ids are usually the URL
                "title": entry.get("title", "No Title"),
                "link": entry.get("link", ""),
                "comments_link": entry.get("comments", ""),
                "published": entry.get("published", ""),
            }
            articles.append(article)
            
        logger.info(f"Found {len(articles)} articles in feed.")
        return articles
        
    except Exception as e:
        logger.error(f"Error fetching RSS feed: {e}")
        return []

if __name__ == "__main__":
    # Quick test
    logging.basicConfig(level=logging.INFO)
    items = fetch_hn_feed()
    for item in items[:3]:
        print(f"- {item['title']} ({item['link']})")
