# Edge Functions for Gitizi CLI

This directory contains example Supabase Edge Functions that work with the Gitizi CLI.

## Setup

### 1. Database Schema

First, create the required tables in your Supabase project:

```sql
-- Users table (if you don't have one already)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);

-- Index for faster token lookup
CREATE INDEX idx_user_tokens_token ON user_tokens(token) WHERE is_active = TRUE;

-- Prompts table
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

-- Index for faster search
CREATE INDEX idx_prompts_name ON prompts USING GIN (name gin_trgm_ops);
CREATE INDEX idx_prompts_description ON prompts USING GIN (description gin_trgm_ops);
CREATE INDEX idx_prompts_tags ON prompts USING GIN (tags);
CREATE INDEX idx_prompts_public ON prompts(is_public) WHERE is_public = TRUE;
```

### 2. Enable Required Extensions

```sql
-- For text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 3. Deploy Edge Functions

Deploy each function using the Supabase CLI:

```bash
# Deploy api-search-prompts
supabase functions deploy api-search-prompts --no-verify-jwt

# Deploy api-auth-verify
supabase functions deploy api-auth-verify --no-verify-jwt

# Deploy other functions (create similar files)
supabase functions deploy api-get-prompt --no-verify-jwt
supabase functions deploy api-create-prompt --no-verify-jwt
supabase functions deploy api-update-prompt --no-verify-jwt
supabase functions deploy api-list-user-prompts --no-verify-jwt
supabase functions deploy api-get-current-user --no-verify-jwt
```

**Important:** Use `--no-verify-jwt` flag because we're handling auth with custom tokens in the `x-user-token` header.

## Testing

### Test api-auth-verify

```bash
curl -L -X POST 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1/api-auth-verify' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"token":"user_token_from_database"}'
```

Expected response:
```json
{
  "success": true,
  "username": "john_doe",
  "email": "john@example.com"
}
```

### Test api-search-prompts (without auth)

```bash
curl -L -X POST 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1/api-search-prompts' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"query":"test","limit":10}'
```

Expected response:
```json
{
  "prompts": [...],
  "total": 5
}
```

### Test api-search-prompts (with auth)

```bash
curl -L -X POST 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1/api-search-prompts' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'x-user-token: user_token_from_database' \
  -H 'Content-Type: application/json' \
  --data '{"query":"test","limit":10}'
```

## Creating User Tokens

You can create tokens for users via SQL:

```sql
-- Create a test user
INSERT INTO users (username, email)
VALUES ('testuser', 'test@example.com')
RETURNING id;

-- Create a token for the user (replace USER_ID)
INSERT INTO user_tokens (user_id, token)
VALUES (
  'USER_ID',
  'gitizi_' || encode(gen_random_bytes(32), 'hex')
)
RETURNING token;
```

Or create a Supabase Edge Function to generate tokens via your app's UI.

## Debugging

### Check Function Logs

```bash
# View logs for a specific function
supabase functions logs api-search-prompts

# Stream logs in real-time
supabase functions logs api-search-prompts --tail
```

### Common Issues

1. **401 Unauthorized Errors**
   - Check that the function is deployed with `--no-verify-jwt`
   - Verify the anon key is correct in the CLI
   - Check that user tokens exist in the database

2. **Token Not Found**
   - Ensure the `user_tokens` table has the correct schema
   - Check that `is_active = TRUE` for the token
   - Verify the token string matches exactly (including prefix)

3. **Search Returns No Results**
   - Check that prompts exist in the database
   - Verify `is_public = TRUE` for public prompts
   - Enable the `pg_trgm` extension for fuzzy search

## Function Endpoints

### api-auth-verify
**Purpose:** Verify a user's API token
**Auth:** No (validates the token itself)
**Request:**
```json
{
  "token": "gitizi_xxx"
}
```

### api-search-prompts
**Purpose:** Search for prompts
**Auth:** Optional (public prompts if not authenticated)
**Request:**
```json
{
  "query": "search term",
  "limit": 10
}
```

### api-get-prompt
**Purpose:** Get a single prompt by ID
**Auth:** Optional (required for private prompts)
**Request:**
```json
{
  "id": "uuid"
}
```

### api-create-prompt
**Purpose:** Create a new prompt
**Auth:** Required
**Request:**
```json
{
  "name": "Prompt Name",
  "description": "Description",
  "content": "Content",
  "tags": ["tag1", "tag2"]
}
```

### api-update-prompt
**Purpose:** Update an existing prompt
**Auth:** Required (must own the prompt)
**Request:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated Description",
  "content": "Updated Content",
  "tags": ["tag1"]
}
```

### api-list-user-prompts
**Purpose:** List the authenticated user's prompts
**Auth:** Required
**Request:** Empty body

### api-get-current-user
**Purpose:** Get current user information
**Auth:** Required
**Request:** Empty body
