# Gitizi Backend API Implementation Guide

This guide will help you set up the backend API for the Gitizi CLI on your Lovable website.

## Overview

The CLI expects a REST API at `https://gitizi.com/api` with the following endpoints:

## Required API Endpoints

### 1. Authentication

#### POST /api/auth/verify
Verify an API token and return user information.

**Request:**
```json
{
  "token": "user-api-token-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "username": "john_doe"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid token"
}
```

---

#### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "username": "john_doe",
  "email": "john@example.com"
}
```

---

### 2. Prompts Management

#### GET /api/prompts/search
Search for prompts.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (number, optional): Maximum results (default: 10)

**Response (200 OK):**
```json
{
  "prompts": [
    {
      "id": "prompt-123",
      "name": "Code Review",
      "description": "A prompt for reviewing code",
      "content": "You are an expert code reviewer...",
      "tags": ["code", "review"],
      "author": "john_doe",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

---

#### GET /api/prompts/:id
Get a specific prompt by ID.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "prompt-123",
  "name": "Code Review",
  "description": "A prompt for reviewing code",
  "content": "You are an expert code reviewer...",
  "tags": ["code", "review"],
  "author": "john_doe",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "message": "Prompt not found"
}
```

---

#### POST /api/prompts
Create a new prompt.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Code Review",
  "description": "A prompt for reviewing code",
  "content": "You are an expert code reviewer...",
  "tags": ["code", "review"]
}
```

**Response (201 Created):**
```json
{
  "id": "prompt-123",
  "name": "Code Review",
  "description": "A prompt for reviewing code",
  "content": "You are an expert code reviewer...",
  "tags": ["code", "review"],
  "author": "john_doe",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

#### PUT /api/prompts/:id
Update an existing prompt.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Updated Code Review",
  "description": "An updated prompt for reviewing code",
  "content": "You are an expert code reviewer...",
  "tags": ["code", "review", "updated"]
}
```

**Response (200 OK):**
```json
{
  "id": "prompt-123",
  "name": "Updated Code Review",
  "description": "An updated prompt for reviewing code",
  "content": "You are an expert code reviewer...",
  "tags": ["code", "review", "updated"],
  "author": "john_doe",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

#### GET /api/prompts/me
List all prompts created by the authenticated user.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": "prompt-123",
    "name": "Code Review",
    "description": "A prompt for reviewing code",
    "content": "You are an expert code reviewer...",
    "tags": ["code", "review"],
    "author": "john_doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Tokens Table
```sql
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  INDEX idx_token (token)
);
```

### Prompts Table
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_tags USING GIN (tags)
);
```

---

## Authentication Flow

### 1. Token Generation (Website)

On your website, users should be able to generate API tokens:

```typescript
// Example: Generate a new API token
async function generateApiToken(userId: string, tokenName: string) {
  const token = crypto.randomBytes(32).toString('hex');

  await db.apiTokens.create({
    userId,
    token,
    name: tokenName,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  });

  return token;
}
```

### 2. Token Verification (API)

Middleware to verify tokens on protected routes:

```typescript
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.substring(7);

  const apiToken = await db.apiTokens.findOne({
    where: { token },
    include: ['user']
  });

  if (!apiToken) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Update last used timestamp
  await db.apiTokens.update(apiToken.id, {
    lastUsedAt: new Date()
  });

  req.user = apiToken.user;
  req.token = apiToken;
  next();
}
```

---

## Security Best Practices

### 1. Token Security
- ✅ Generate tokens using cryptographically secure random generators
- ✅ Store tokens hashed in the database (optional but recommended)
- ✅ Set expiration dates on tokens
- ✅ Allow users to revoke tokens
- ✅ Rate limit token verification attempts

### 2. API Security
- ✅ Use HTTPS only
- ✅ Implement rate limiting (e.g., 100 requests per minute per token)
- ✅ Validate all input data
- ✅ Implement CORS properly
- ✅ Log authentication attempts

### 3. Authorization
- ✅ Users can only modify their own prompts
- ✅ Implement proper ownership checks
- ✅ Consider public/private prompt visibility

---

## Implementation Example (Lovable/Supabase)

If you're using Supabase with Lovable, here's a quick setup:

### 1. Create Database Tables

Run this in your Supabase SQL editor:

```sql
-- Users table (might already exist)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Tokens table
CREATE TABLE api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  name TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT token_length CHECK (char_length(token) >= 32)
);

CREATE INDEX idx_api_tokens_token ON api_tokens(token);
CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);

-- Prompts table
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT name_length CHECK (char_length(name) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) <= 500)
);

CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for API tokens
CREATE POLICY "Users can view their own tokens"
  ON api_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens"
  ON api_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON api_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for prompts
CREATE POLICY "Anyone can view prompts"
  ON prompts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own prompts"
  ON prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prompts"
  ON prompts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompts"
  ON prompts FOR DELETE
  USING (auth.uid() = user_id);
```

### 2. Create API Routes

In your Lovable project, create API routes (e.g., using Next.js API routes or similar):

```typescript
// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for API
);

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const { data: apiToken, error } = await supabase
      .from('api_tokens')
      .select('*, users(*)')
      .eq('token', token)
      .single();

    if (error || !apiToken) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if token expired
    if (apiToken.expires_at && new Date(apiToken.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'Token expired' },
        { status: 401 }
      );
    }

    // Update last used timestamp
    await supabase
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiToken.id);

    return NextResponse.json({
      success: true,
      username: apiToken.users.username
    });

  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

---

## Token Management UI

Add a page on your website where users can:

1. **Generate new API tokens**
   - Give the token a name (e.g., "My Laptop CLI")
   - Display the token ONCE (it won't be shown again)

2. **View existing tokens**
   - List all tokens with names and creation dates
   - Show last used timestamp

3. **Revoke tokens**
   - Delete tokens that are no longer needed

Example UI component:

```typescript
// components/ApiTokenManager.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ApiTokenManager() {
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);

  async function generateToken() {
    const response = await fetch('/api/tokens/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tokenName })
    });

    const data = await response.json();
    setNewToken(data.token);
    setTokenName('');
  }

  return (
    <div>
      <h2>API Tokens</h2>

      <div>
        <Input
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="Token name (e.g., My Laptop)"
        />
        <Button onClick={generateToken}>
          Generate New Token
        </Button>
      </div>

      {newToken && (
        <div className="bg-yellow-50 p-4 rounded">
          <p className="font-bold">Your new API token:</p>
          <code className="bg-gray-100 p-2 block">{newToken}</code>
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Save this token now! You won't be able to see it again.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Testing Your API

Once implemented, test with:

```bash
# Test authentication
curl -X POST https://gitizi.com/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your-test-token"}'

# Test creating a prompt
curl -X POST https://gitizi.com/api/prompts \
  -H "Authorization: Bearer your-test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Prompt",
    "description": "A test prompt",
    "content": "This is a test",
    "tags": ["test"]
  }'

# Test with CLI
izi auth --token your-test-token
izi list
```

---

## CORS Configuration

Make sure to configure CORS properly:

```typescript
// next.config.js or middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}
```

---

## Environment Variables

Set these in your Lovable project:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url (if not using Supabase)
API_RATE_LIMIT=100
```

---

## Next Steps

1. ✅ Set up database tables
2. ✅ Implement authentication endpoints
3. ✅ Implement prompt CRUD endpoints
4. ✅ Add token management UI
5. ✅ Test with CLI
6. ✅ Deploy to production
7. ✅ Monitor API usage and errors

---

## Support

If you encounter issues:
- Check API logs for errors
- Verify database connectivity
- Test authentication flow manually
- Check CORS configuration
- Ensure environment variables are set

For CLI issues, see the main README.md
