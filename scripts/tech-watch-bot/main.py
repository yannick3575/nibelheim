import os
import sys
import datetime
import logging
from src.rss import fetch_hn_feed
from src.scraper import clean_html_content, fetch_hn_comments
from src.analyzer import analyze_article
from src.utils import load_history, save_history, is_processed

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("TechWatchBot")

OUTPUT_DIR = "digests"

def main():
    logger.info("Starting Tech Watch Bot...")
    
    # Ensure output directory exists
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    # Load history
    history_file = os.path.join(os.path.dirname(__file__), "history.json")
    processed_ids = load_history(history_file)
    logger.info(f"Loaded {len(processed_ids)} processed articles from history.")
    
    # Fetch Feed
    articles = fetch_hn_feed()
    
    new_articles = [a for a in articles if not is_processed(a["id"], processed_ids)]
    logger.info(f"Found {len(new_articles)} new articles to process.")
    
    if not new_articles:
        logger.info("No new articles. Exiting.")
        return

    # Process generic daily digest file
    today = datetime.datetime.now().strftime("%Y-%m-%d")
    digest_filename = os.path.join(OUTPUT_DIR, f"digest_{today}.md")
    
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
            logger.warning(f"No comments found for {article['title']} (or extraction failed). Proceeding with content only.")
            
        # 3. Analyze
        analysis = analyze_article(content, comments, article['title'])
        
        # 4. Save to Digest (Append mode)
        with open(digest_filename, 'a', encoding='utf-8') as f:
            f.write(f"\n## [{article['title']}]({article['link']})\n")
            f.write(f"*Discussion: [Hacker News]({article['comments_link']})*\n\n")
            f.write(analysis)
            f.write("\n\n---\n")
            
        # 5. Update History
        processed_ids.append(article["id"])
        save_history(processed_ids, history_file)
        
    logger.info("Batch processing complete.")

if __name__ == "__main__":
    # Add project root to python path if needed, though usually script is run from root
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    main()
