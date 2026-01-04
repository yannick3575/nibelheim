-- Migration: Enable Realtime for AI Inbox
-- Created: 2024-01-04
-- Description: Enables Supabase Realtime for the ai_inbox_items table

ALTER PUBLICATION supabase_realtime ADD TABLE ai_inbox_items;
