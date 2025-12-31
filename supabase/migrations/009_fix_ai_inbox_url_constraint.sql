-- Migration: Fix AI Inbox URL Unique Constraint
-- Created: 2024-12-31
-- Description: Replace UNIQUE(user_id, url) with partial unique index
--              to properly handle NULL URLs (PostgreSQL treats NULLs as distinct in UNIQUE)

-- ============================================================================
-- ISSUE: The original UNIQUE(user_id, url) constraint allows multiple items
-- with url = NULL per user because PostgreSQL doesn't consider NULL = NULL.
-- This defeats the purpose of preventing duplicate URLs.
--
-- FIX: Use a partial unique index that only applies when url IS NOT NULL.
-- This allows unlimited NULL URLs (manual items) while preventing duplicate URLs.
-- ============================================================================

-- Drop the existing unique constraint
ALTER TABLE ai_inbox_items DROP CONSTRAINT IF EXISTS ai_inbox_items_user_id_url_key;

-- Create a partial unique index for non-NULL URLs only
-- This prevents duplicate URLs per user while allowing multiple NULL URLs
CREATE UNIQUE INDEX idx_ai_inbox_items_unique_url
    ON ai_inbox_items(user_id, url)
    WHERE url IS NOT NULL;

-- Update comment to reflect the new behavior
COMMENT ON COLUMN ai_inbox_items.url IS 'Content URL (optional for manual items). Unique per user when not NULL.';
