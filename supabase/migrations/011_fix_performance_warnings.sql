-- Migration: Fix Supabase Performance Warnings
-- Created: 2025-01-08
-- Description: Fixes security warnings on functions and adds missing indexes
--
-- Fixes:
-- 1. Set immutable search_path on update_updated_at_column() function
-- 2. Set immutable search_path on handle_new_user() function
-- 3. Add missing indexes on foreign key columns for faster JOINs and RLS evaluation
-- 4. Remove redundant index on ai_inbox_settings.user_id (already covered by UNIQUE constraint)

-- ============================================================================
-- FIX 1: Set immutable search_path on update_updated_at_column()
-- Prevents schema substitution attacks and fixes Supabase security warning
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX 2: Set immutable search_path on handle_new_user()
-- This function is a SECURITY DEFINER, so search_path is especially important
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FIX 3: Add missing indexes on foreign key columns
-- These improve JOIN performance and RLS policy evaluation
-- ============================================================================

-- user_modules: user_id is referenced in WHERE clauses and RLS policies
CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON public.user_modules(user_id);

-- module_data: user_id, module_id, and data_type are commonly filtered
CREATE INDEX IF NOT EXISTS idx_module_data_user_id ON public.module_data(user_id);
CREATE INDEX IF NOT EXISTS idx_module_data_module_id ON public.module_data(user_id, module_id);

-- tech_watch_articles: user_id is used in RLS and queries (partial index already exists for favorites)
CREATE INDEX IF NOT EXISTS idx_tech_watch_articles_user_id ON public.tech_watch_articles(user_id);

-- tech_watch_digests: user_id for RLS and date-based queries
CREATE INDEX IF NOT EXISTS idx_tech_watch_digests_user_id ON public.tech_watch_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_tech_watch_digests_period ON public.tech_watch_digests(user_id, period_start DESC);

-- tech_watch_sources: user_id for RLS
CREATE INDEX IF NOT EXISTS idx_tech_watch_sources_user_id ON public.tech_watch_sources(user_id);

-- automation_logs: token_id for finding logs by token
CREATE INDEX IF NOT EXISTS idx_automation_logs_token_id ON public.automation_logs(token_id);

-- ============================================================================
-- FIX 4: Remove redundant index on ai_inbox_settings.user_id
-- The UNIQUE constraint on user_id already creates an implicit index
-- ============================================================================

DROP INDEX IF EXISTS public.idx_ai_inbox_settings_user_id;
