-- Migration: Fix API Tokens Security (Idempotent)
-- Created: 2026-01-15
-- Description: Ensures api_tokens table has secure token storage
--
-- This migration is IDEMPOTENT - it can be run multiple times safely.
-- It handles all possible starting states:
-- - State A: Only 'token' column exists (original schema)
-- - State B: Both 'token' and 'token_hash' exist (partial migration)
-- - State C: Only 'token_hash' exists (already migrated)
--
-- Final state: token_hash (NOT NULL, UNIQUE), token_prefix, no plaintext token

-- ============================================================================
-- STEP 0: Ensure pgcrypto extension is enabled
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- STEP 1: Ensure columns exist
-- ============================================================================

-- Add token_hash column if it doesn't exist
ALTER TABLE api_tokens
ADD COLUMN IF NOT EXISTS token_hash TEXT;

-- Add token_prefix column if it doesn't exist
ALTER TABLE api_tokens
ADD COLUMN IF NOT EXISTS token_prefix TEXT;

-- ============================================================================
-- STEP 2: Migrate data from 'token' to 'token_hash' (if 'token' exists)
-- This block only runs if there's a 'token' column with data to migrate
-- ============================================================================

DO $$
BEGIN
    -- Check if 'token' column exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_tokens'
        AND column_name = 'token'
    ) THEN
        -- Migrate any tokens that haven't been hashed yet
        UPDATE api_tokens
        SET
            token_hash = encode(digest(token, 'sha256'), 'hex'),
            token_prefix = LEFT(token, 11) || '...'
        WHERE token IS NOT NULL
          AND (token_hash IS NULL OR token_hash = '');

        RAISE NOTICE 'Migrated existing tokens to hashed format';
    ELSE
        RAISE NOTICE 'Column "token" does not exist - skipping migration step';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop the plaintext 'token' column (if it exists)
-- ============================================================================

-- Drop the old index on plaintext token first (if it exists)
DROP INDEX IF EXISTS api_tokens_token_idx;

-- Remove the plaintext token column (if it exists)
ALTER TABLE api_tokens
DROP COLUMN IF EXISTS token;

-- ============================================================================
-- STEP 4: Ensure constraints and indexes
-- ============================================================================

-- Make token_hash NOT NULL (only if there are no NULL values)
DO $$
BEGIN
    -- Check if there are any NULL token_hash values
    IF EXISTS (
        SELECT 1 FROM api_tokens WHERE token_hash IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot set NOT NULL: some rows have NULL token_hash. Please delete or fix these rows first.';
    END IF;

    -- Check if the column is already NOT NULL
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'api_tokens'
        AND column_name = 'token_hash'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE api_tokens ALTER COLUMN token_hash SET NOT NULL;
        RAISE NOTICE 'Set token_hash to NOT NULL';
    ELSE
        RAISE NOTICE 'token_hash is already NOT NULL';
    END IF;
END $$;

-- Add unique constraint on token_hash (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'api_tokens_token_hash_unique'
    ) THEN
        ALTER TABLE api_tokens
        ADD CONSTRAINT api_tokens_token_hash_unique UNIQUE (token_hash);
        RAISE NOTICE 'Added unique constraint on token_hash';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- Create index for fast lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash
ON api_tokens(token_hash);

-- ============================================================================
-- STEP 5: Add documentation comments
-- ============================================================================

COMMENT ON COLUMN api_tokens.token_hash IS 'SHA-256 hash of the API token (hex encoded). The plaintext token is never stored.';
COMMENT ON COLUMN api_tokens.token_prefix IS 'First 11 characters of the token + "..." for display purposes only.';

-- ============================================================================
-- VERIFICATION: Final state check
-- ============================================================================

DO $$
DECLARE
    col_count INTEGER;
BEGIN
    -- Verify token column is gone
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_tokens'
    AND column_name = 'token';

    IF col_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: plaintext token column still exists';
    END IF;

    -- Verify token_hash column exists and is NOT NULL
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_tokens'
    AND column_name = 'token_hash'
    AND is_nullable = 'NO';

    IF col_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: token_hash column missing or nullable';
    END IF;

    -- Verify token_prefix column exists
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'api_tokens'
    AND column_name = 'token_prefix';

    IF col_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: token_prefix column missing';
    END IF;

    RAISE NOTICE '✓ API tokens security migration completed successfully';
    RAISE NOTICE '  - token column: removed';
    RAISE NOTICE '  - token_hash column: present, NOT NULL, UNIQUE';
    RAISE NOTICE '  - token_prefix column: present';
END $$;
