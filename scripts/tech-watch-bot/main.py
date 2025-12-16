import os
import sys
import datetime
import logging
from dotenv import load_dotenv

from src.rss import fetch_hn_feed
from src.scraper import clean_html_content, fetch_hn_comments
from src.analyzer import analyze_article
from src.db import (
    get_supabase_client,
    get_user_id,
    get_processed_urls,
    save_article,
    save_digest,
    build_digest_summary
)

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("TechWatchBot")


def main():
    logger.info("Starting Tech Watch Bot...")

    # Initialize Supabase client
    try:
        supabase = get_supabase_client()
        user_id = get_user_id()
        logger.info("Supabase client initialized successfully.")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    # Get processed URLs from database (replaces history.json)
    processed_urls = get_processed_urls(supabase, user_id)
    logger.info(f"Found {len(processed_urls)} already processed articles in database.")

    # Fetch Feed
    articles = fetch_hn_feed()

    # Filter out already processed articles
    new_articles = [a for a in articles if a["link"] not in processed_urls]
    logger.info(f"Found {len(new_articles)} new articles to process.")

    if not new_articles:
        logger.info("No new articles. Exiting.")
        return

    # Track processed articles for digest
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    processed_articles = []
    article_ids = []

    # Iterate and Process
    for article in new_articles:
        logger.info(f"Processing: {article['title']}")

        # 1. Scrape Content
        content = clean_html_content(article['link'])
        if not content:
            logger.warning(f"Skipping {article['title']} - content extraction failed.")
            continue

        # 2. Scrape Comments
        comments = fetch_hn_comments(article['comments_link'])
        if not comments:
            logger.warning(
                f"No comments found for {article['title']} (or extraction failed). "
                "Proceeding with content only."
            )

        # 3. Analyze
        analysis = analyze_article(content, comments, article['title'])

        # 4. Save article to database
        article_id = save_article(
            supabase=supabase,
            user_id=user_id,
            title=article['title'],
            url=article['link'],
            comments_url=article['comments_link'],
            content=content,
            analysis=analysis,
            published_at=article.get('published')
        )

        if article_id:
            article_ids.append(article_id)
            processed_articles.append({
                'title': article['title'],
                'url': article['link'],
                'comments_url': article['comments_link'],
                'analysis': analysis
            })

    # 5. Create/update daily digest
    if processed_articles:
        digest_summary = build_digest_summary(processed_articles)
        save_digest(
            supabase=supabase,
            user_id=user_id,
            date=today,
            summary=digest_summary,
            article_ids=article_ids
        )

    logger.info(f"Batch processing complete. Processed {len(processed_articles)} articles.")


if __name__ == "__main__":
    # Add project root to python path if needed
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    main()
