-- =============================================================================
-- Gitizi Database Setup for Supabase
-- =============================================================================

-- 1. Create Users Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create API Tokens Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);

-- 3. Create Prompts Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_public ON prompts(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN (tags);

-- Enable text search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_prompts_name_trgm ON prompts USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prompts_description_trgm ON prompts USING GIN (description gin_trgm_ops);

-- 4. Create the verify_api_token RPC Function
-- =============================================================================
-- This is what your Edge Function calls!
CREATE OR REPLACE FUNCTION verify_api_token(token_value TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_used_at timestamp
  UPDATE api_tokens
  SET last_used_at = NOW()
  WHERE token = token_value
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Return user information if token is valid
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.username,
    u.email
  FROM users u
  INNER JOIN api_tokens t ON t.user_id = u.id
  WHERE t.token = token_value
    AND t.is_active = TRUE
    AND (t.expires_at IS NULL OR t.expires_at > NOW());
END;
$$;

-- 5. Create Helper Function to Generate Tokens
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_api_token(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate token with gitizi_ prefix
  new_token := 'gitizi_' || encode(gen_random_bytes(32), 'hex');

  -- Insert the token
  INSERT INTO api_tokens (user_id, token, is_active)
  VALUES (p_user_id, new_token, TRUE);

  RETURN new_token;
END;
$$;

-- 6. Insert Test Data
-- =============================================================================

-- Create test user
INSERT INTO users (username, email)
VALUES ('testuser', 'test@example.com')
ON CONFLICT (email) DO UPDATE SET username = 'testuser'
RETURNING id;

-- Note: Copy the user ID from above, or use this to generate a token automatically:

-- Example: Create a token for the test user
DO $$
DECLARE
  test_user_id UUID;
  new_token TEXT;
BEGIN
  -- Get or create test user
  INSERT INTO users (username, email)
  VALUES ('testuser', 'test@example.com')
  ON CONFLICT (email) DO UPDATE SET username = 'testuser'
  RETURNING id INTO test_user_id;

  -- Generate token
  new_token := generate_api_token(test_user_id);

  RAISE NOTICE 'Generated token for testuser: %', new_token;
END $$;

-- 7. Insert Sample Prompts
-- =============================================================================
INSERT INTO prompts (name, description, content, author, tags, is_public)
VALUES
  (
    'Marketing Campaign Generator',
    'Create compelling marketing campaigns for any product or service',
    'You are an expert marketing strategist. Help create a comprehensive marketing campaign including messaging, channels, and tactics.',
    'System',
    ARRAY['marketing', 'business', 'strategy'],
    TRUE
  ),
  (
    'Code Review Assistant',
    'Review code for best practices, bugs, and improvements',
    'You are a senior software engineer. Review the following code for best practices, potential bugs, security issues, and suggest improvements.',
    'System',
    ARRAY['code', 'review', 'programming'],
    TRUE
  ),
  (
    'Technical Documentation Writer',
    'Write clear and comprehensive technical documentation',
    'You are a technical writer. Create clear, well-structured documentation for the following feature or API.',
    'System',
    ARRAY['documentation', 'technical-writing'],
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 8. Verification Queries
-- =============================================================================

-- Check users
SELECT COUNT(*) as user_count FROM users;

-- Check tokens
SELECT COUNT(*) as token_count FROM api_tokens WHERE is_active = TRUE;

-- Check prompts
SELECT COUNT(*) as prompt_count FROM prompts WHERE is_public = TRUE;

-- Test the verify_api_token function
-- Replace 'YOUR_TOKEN' with an actual token from api_tokens table
-- SELECT * FROM verify_api_token('gitizi_...');

-- List all active tokens (for testing)
SELECT
  t.token,
  u.username,
  t.created_at,
  t.last_used_at
FROM api_tokens t
JOIN users u ON u.id = t.user_id
WHERE t.is_active = TRUE
ORDER BY t.created_at DESC;
