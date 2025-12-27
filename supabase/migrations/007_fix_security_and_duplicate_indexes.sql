-- Migration: Fix security warnings and duplicate indexes
-- Date: 2024-12-27
--
-- Fixes:
-- 1. Security: Set immutable search_path on functions to prevent schema substitution attacks
-- 2. Performance: Remove duplicate indexes on automation_logs and prompt_library_prompts

-- ============================================
-- FIX 1 & 2: Security - Set immutable search_path on functions
-- ============================================

-- Fix generate_api_token function
CREATE OR REPLACE FUNCTION public.generate_api_token()
 RETURNS TABLE(token text, token_hash text, token_prefix text)
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
DECLARE
  raw_token TEXT;
BEGIN
  -- Generate a 32-byte random token (base64 encoded)
  -- Format: nbh_<random_string> (nibelheim prefix)
  raw_token := 'nbh_' || encode(gen_random_bytes(32), 'base64');

  RETURN QUERY SELECT
    raw_token AS token,
    encode(digest(raw_token, 'sha256'), 'hex') AS token_hash,
    LEFT(raw_token, 11) || '...' AS token_prefix;
END;
$function$;

-- Fix update_prompt_discovery_sources_updated_at function
CREATE OR REPLACE FUNCTION public.update_prompt_discovery_sources_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- ============================================
-- FIX 3 & 4: Performance - Remove duplicate indexes
-- ============================================

-- Drop duplicate index on automation_logs (keep idx_automation_logs_user_id)
DROP INDEX IF EXISTS public.automation_logs_user_id_idx;

-- Drop duplicate index on prompt_library_prompts (keep idx_prompt_library_prompts_user_id)
DROP INDEX IF EXISTS public.prompt_library_prompts_user_id_idx;
