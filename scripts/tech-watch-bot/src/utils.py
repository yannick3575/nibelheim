import json
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

HISTORY_FILE = "history.json"

def load_history(filepath: str = HISTORY_FILE) -> List[str]:
    """
    Loads the list of processed article IDs from the JSON history file.
    """
    if not os.path.exists(filepath):
        return []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get("processed_ids", [])
    except Exception as e:
        logger.error(f"Error loading history file: {e}")
        return []

def save_history(processed_ids: List[str], filepath: str = HISTORY_FILE):
    """
    Saves the list of processed IDs to the JSON history file.
    """
    try:
        # Keep only the last 1000 IDs to avoid infinite growth if needed,
        # but for now let's keep all or just ensure we don't lose data.
        # Let's just save the list.
        data = {"processed_ids": processed_ids}
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving history file: {e}")

def is_processed(article_id: str, processed_ids: List[str]) -> bool:
    return article_id in processed_ids
