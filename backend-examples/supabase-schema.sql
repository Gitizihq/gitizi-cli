-- Gitizi Backend Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- API Tokens table
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT token_length CHECK (char_length(token) >= 32),
  CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) >= 1 AND char_length(description) <= 500),
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 102400)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON public.api_tokens(token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON public.api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON public.prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_public ON public.prompts(is_public) WHERE is_public = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- API Tokens policies
CREATE POLICY "Users can view their own tokens"
  ON public.api_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens"
  ON public.api_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.api_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON public.api_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Prompts policies
CREATE POLICY "Anyone can view public prompts"
  ON public.prompts FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON public.prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON public.prompts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to verify API token and get user
CREATE OR REPLACE FUNCTION public.verify_api_token(token_value TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find active, non-expired token
  SELECT
    t.user_id,
    u.username,
    u.email,
    t.id as token_id
  INTO token_record
  FROM public.api_tokens t
  JOIN public.users u ON u.id = t.user_id
  WHERE t.token = token_value
    AND t.is_active = true
    AND (t.expires_at IS NULL OR t.expires_at > NOW());

  -- If token not found or expired
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Update last_used_at
  UPDATE public.api_tokens
  SET last_used_at = NOW()
  WHERE id = token_record.token_id;

  -- Return user info
  RETURN QUERY
  SELECT
    token_record.user_id,
    token_record.username,
    token_record.email;
END;
$$;

-- Function to generate API token
CREATE OR REPLACE FUNCTION public.generate_api_token(
  p_user_id UUID,
  p_token_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Generate random token (64 characters)
  new_token := encode(gen_random_bytes(32), 'hex');

  -- Insert token
  INSERT INTO public.api_tokens (user_id, token, name)
  VALUES (p_user_id, new_token, p_token_name);

  RETURN new_token;
END;
$$;

-- Function to search prompts
CREATE OR REPLACE FUNCTION public.search_prompts(
  search_query TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  content TEXT,
  tags JSONB,
  author TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.content,
    p.tags,
    u.username as author,
    p.created_at,
    p.updated_at
  FROM public.prompts p
  JOIN public.users u ON u.id = p.user_id
  WHERE p.is_public = true
    AND (
      p.name ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.content ILIKE '%' || search_query || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT result_limit;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
-- Insert a test user
INSERT INTO public.users (id, username, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'testuser', 'test@gitizi.com')
ON CONFLICT (id) DO NOTHING;

-- Insert a test token
INSERT INTO public.api_tokens (user_id, token, name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test_token_1234567890abcdef1234567890abcdef', 'Test Token')
ON CONFLICT (token) DO NOTHING;

-- Insert sample prompts
INSERT INTO public.prompts (user_id, name, description, content, tags)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Code Review',
    'A prompt for reviewing code',
    'You are an expert code reviewer. Review the following code and provide constructive feedback.',
    '["code", "review"]'::jsonb
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Bug Fixer',
    'A prompt for fixing bugs',
    'You are an expert debugger. Analyze the following code and fix any bugs you find.',
    '["debugging", "code"]'::jsonb
  )
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- GRANTS (if needed for service role)
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;
