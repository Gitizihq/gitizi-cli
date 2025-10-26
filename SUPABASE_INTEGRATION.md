# Supabase Edge Functions Integration

This document explains how the Gitizi CLI integrates with Supabase Edge Functions.

## Overview

The CLI uses the `@supabase/supabase-js` client library to invoke Edge Functions deployed on Supabase.

## Authentication Flow

### Anon Key (Automatic)
The Supabase client is initialized with the anon key and automatically sends it in the `Authorization` header for all function calls:

```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### User Token (Custom Header)
When a user authenticates with the CLI using `izi auth --token YOUR_TOKEN`, their personal API token is stored locally and sent with each request in the `x-user-token` header:

```typescript
headers: {
  'x-user-token': userToken  // User's personal API token
}
```

## Edge Function Implementation

Each Edge Function should:

1. **Verify the anon key** - Automatically handled by Supabase
2. **Extract user token** - Read from `x-user-token` header
3. **Validate user** - Verify the user token against your auth system
4. **Process request** - Handle the business logic

### Example Edge Function

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Get user token from custom header
  const userToken = req.headers.get('x-user-token')

  // Parse request body
  const { query, limit } = await req.json()

  // Initialize Supabase client (server-side)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  // Validate user token if provided
  if (userToken) {
    // Verify token against your auth table
    const { data: user, error } = await supabase
      .from('user_tokens')
      .select('user_id')
      .eq('token', userToken)
      .single()

    if (error || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Process the request
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ prompts: data, total: data.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
```

## Required Edge Functions

### 1. api-auth-verify
Verifies a user's API token.

**Request:**
```json
{
  "token": "user-api-token"
}
```

**Response:**
```json
{
  "success": true,
  "username": "john_doe"
}
```

### 2. api-search-prompts
Searches for prompts (public or user-specific).

**Request:**
```json
{
  "query": "search term",
  "limit": 10
}
```

**Response:**
```json
{
  "prompts": [...],
  "total": 100
}
```

### 3. api-get-prompt
Gets a single prompt by ID.

**Request:**
```json
{
  "id": "prompt-id"
}
```

**Response:**
```json
{
  "id": "...",
  "name": "...",
  "description": "...",
  "content": "...",
  "tags": ["..."],
  "author": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 4. api-create-prompt
Creates a new prompt (requires authentication).

**Request:**
```json
{
  "name": "Prompt Name",
  "description": "Description",
  "content": "Prompt content",
  "tags": ["tag1", "tag2"]
}
```

**Response:** Created prompt object

### 5. api-update-prompt
Updates an existing prompt (requires authentication).

**Request:**
```json
{
  "id": "prompt-id",
  "name": "Updated Name",
  "description": "Updated desc",
  "content": "Updated content",
  "tags": ["tag1"]
}
```

**Response:** Updated prompt object

### 6. api-list-user-prompts
Lists prompts for the authenticated user (requires authentication).

**Request:** Empty body (uses `x-user-token` header)

**Response:** Array of user's prompts

### 7. api-get-current-user
Gets current user info (requires authentication).

**Request:** Empty body (uses `x-user-token` header)

**Response:**
```json
{
  "username": "john_doe",
  "email": "john@example.com"
}
```

## Testing

### Test with curl

```bash
# Without user token
curl -L -X POST 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1/api-search-prompts' \
  -H 'Authorization: Bearer SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{"query":"test","limit":10}'

# With user token
curl -L -X POST 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1/api-search-prompts' \
  -H 'Authorization: Bearer SUPABASE_ANON_KEY' \
  -H 'x-user-token: USER_API_TOKEN' \
  -H 'Content-Type: application/json' \
  --data '{"query":"test","limit":10}'
```

### Test with CLI

```bash
# Search without auth
izi search "test"

# Authenticate
izi auth --token YOUR_TOKEN

# Search with auth
izi search "test"
```

## Deployment

Deploy your Edge Functions to Supabase:

```bash
supabase functions deploy api-auth-verify
supabase functions deploy api-search-prompts
supabase functions deploy api-get-prompt
supabase functions deploy api-create-prompt
supabase functions deploy api-update-prompt
supabase functions deploy api-list-user-prompts
supabase functions deploy api-get-current-user
```

## Configuration

The CLI uses these constants from `src/utils/constants.ts`:

```typescript
export const SUPABASE = {
  URL: 'https://sewwdxmqorokboxzpsxu.supabase.co',
  ANON_KEY: 'your-anon-key',
};
```

Update these values for your Supabase project.
