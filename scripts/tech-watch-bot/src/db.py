"""
Supabase database module for Tech Watch Bot.
Handles all database operations for articles and digests.
"""

import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone
from supabase import create_client, Client

logger = logging.getLogger("TechWatchBot.DB")


def get_supabase_client() -> Client:
    """Create and return a Supabase client using service role key."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
        )

    return create_client(url, key)


def get_user_id() -> str:
    """Get the user ID from environment variable."""
    user_id = os.getenv("USER_ID")
    if not user_id:
        raise ValueError("Missing USER_ID environment variable")
    return user_id


def get_processed_urls(supabase: Client, user_id: str) -> List[str]:
    """
    Get all article URLs already in database for the user.
    Replaces the old history.json approach.
    """
    try:
        result = supabase.table("tech_watch_articles") \
            .select("url") \
            .eq("user_id", user_id) \
            .execute()

        return [row["url"] for row in result.data]
    except Exception as e:
        logger.error(f"Error fetching processed URLs: {e}")
        return []


def save_article(
    supabase: Client,
    user_id: str,
    title: str,
    url: str,
    comments_url: str,
    content: str,
    analysis: str,
    published_at: Optional[str] = None
) -> Optional[str]:
    """
    Save an article to the database.
    Returns the article UUID if successful, None otherwise.
    """
    try:
        data = {
            "user_id": user_id,
            "title": title,
            "url": url,
            "source": "hacker_news",
            "content": content[:50000] if content else None,  # Limit content size
            "summary": analysis,
            "tags": [],
            "published_at": published_at,
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "read": False
        }

        result = supabase.table("tech_watch_articles") \
            .insert(data) \
            .execute()

        if result.data:
            article_id = result.data[0]["id"]
            logger.info(f"Article saved with ID: {article_id}")
            return article_id

        return None

    except Exception as e:
        logger.error(f"Error saving article '{title}': {e}")
        return None


def save_digest(
    supabase: Client,
    user_id: str,
    date: str,
    summary: str,
    article_ids: List[str],
    key_topics: Optional[List[str]] = None
) -> bool:
    """
    Create or update a daily digest.
    If a digest already exists for the date, it updates it.
    """
    try:
        period_start = f"{date}T00:00:00Z"
        period_end = f"{date}T23:59:59Z"

        # Check if digest exists for this date
        existing = supabase.table("tech_watch_digests") \
            .select("id, article_ids") \
            .eq("user_id", user_id) \
            .gte("period_start", period_start) \
            .lte("period_end", period_end) \
            .execute()

        if existing.data:
            # Update existing digest - merge article_ids
            existing_ids = existing.data[0].get("article_ids", []) or []
            merged_ids = list(set(existing_ids + article_ids))

            supabase.table("tech_watch_digests") \
                .update({
                    "summary": summary,
                    "article_ids": merged_ids,
                    "key_topics": key_topics or []
                }) \
                .eq("id", existing.data[0]["id"]) \
                .execute()

            logger.info(f"Updated digest for {date}")
        else:
            # Create new digest
            supabase.table("tech_watch_digests") \
                .insert({
                    "user_id": user_id,
                    "period_start": period_start,
                    "period_end": period_end,
                    "summary": summary,
                    "article_ids": article_ids,
                    "key_topics": key_topics or []
                }) \
                .execute()

            logger.info(f"Created new digest for {date}")

        return True

    except Exception as e:
        logger.error(f"Error saving digest for {date}: {e}")
        return False


def build_digest_summary(articles: List[Dict]) -> str:
    """
    Build a markdown summary from a list of processed articles.
    Each article dict should have: title, url, comments_url, analysis
    """
    lines = []

    for article in articles:
        lines.append(f"\n## [{article['title']}]({article['url']})")
        lines.append(f"*Discussion: [Hacker News]({article['comments_url']})*\n")
        lines.append(article['analysis'])
        lines.append("\n---")

    return "\n".join(lines)
