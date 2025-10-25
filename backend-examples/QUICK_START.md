# Quick Start: Setting Up Gitizi CLI Backend

This guide will get your backend API running in 30 minutes.

## Prerequisites

- A Lovable account or Next.js project
- Supabase account (free tier works)
- Access to your domain (gitizi.com)

## Step 1: Set Up Supabase Database (5 minutes)

1. **Create a new Supabase project** at https://supabase.com

2. **Run the database schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the entire contents of `supabase-schema.sql`
   - Click "Run"
   - Wait for success message

3. **Get your credentials**
   - Go to Project Settings → API
   - Copy these values:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 2: Set Up Your Lovable/Next.js Project (10 minutes)

### Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Create API Routes

Create these files in your project:

#### 1. `/app/api/auth/verify/route.ts`
Copy contents from `api-auth-verify.ts`

#### 2. `/app/api/prompts/route.ts`
Copy contents from `api-prompts-create.ts`

#### 3. `/app/api/prompts/[id]/route.ts`
```typescript
// Get, Update, Delete specific prompt
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const { data } = await supabase.rpc('verify_api_token', { token_value: token });

  return data && data.length > 0 ? data[0] : null;
}

// GET /api/prompts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: prompt, error } = await supabase
      .from('prompts')
      .select('*, users(username)')
      .eq('id', params.id)
      .eq('is_public', true)
      .single();

    if (error || !prompt) {
      return NextResponse.json({ message: 'Prompt not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      tags: prompt.tags || [],
      author: prompt.users.username,
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch prompt' }, { status: 500 });
  }
}

// PUT /api/prompts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, content, tags } = body;

    const { data: prompt, error } = await supabase
      .from('prompts')
      .update({
        ...(name && { name }),
        ...(description && { description }),
        ...(content && { content }),
        ...(tags && { tags })
      })
      .eq('id', params.id)
      .eq('user_id', user.user_id)
      .select('*, users(username)')
      .single();

    if (error || !prompt) {
      return NextResponse.json(
        { message: 'Prompt not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      tags: prompt.tags || [],
      author: prompt.users.username,
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at
    });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update prompt' }, { status: 500 });
  }
}
```

#### 4. `/app/api/prompts/search/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: prompts, error } = await supabase
      .rpc('search_prompts', {
        search_query: query,
        result_limit: limit
      });

    if (error) throw error;

    return NextResponse.json({
      prompts: prompts || [],
      total: prompts?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ message: 'Search failed' }, { status: 500 });
  }
}
```

#### 5. `/app/api/prompts/me/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const { data } = await supabase.rpc('verify_api_token', { token_value: token });

  return data && data.length > 0 ? data[0] : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { data: prompts, error } = await supabase
      .from('prompts')
      .select('*, users(username)')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      prompts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        content: p.content,
        tags: p.tags || [],
        author: p.users.username,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }))
    );
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch prompts' }, { status: 500 });
  }
}
```

## Step 3: Add CORS Support (2 minutes)

Create `/middleware.ts` in your project root:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## Step 4: Create Token Management UI (5 minutes)

Create `/app/tokens/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TokensPage() {
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);

  async function generateToken() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in first');
      return;
    }

    // Call the database function
    const { data, error } = await supabase
      .rpc('generate_api_token', {
        p_user_id: user.id,
        p_token_name: tokenName
      });

    if (error) {
      console.error(error);
      alert('Failed to generate token');
      return;
    }

    setNewToken(data);
    setTokenName('');
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">API Tokens</h1>

      <div className="space-y-4 mb-8">
        <input
          type="text"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="Token name (e.g., My Laptop)"
          className="w-full px-4 py-2 border rounded"
        />
        <button
          onClick={generateToken}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate New Token
        </button>
      </div>

      {newToken && (
        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg">
          <p className="font-bold text-lg mb-2">Your new API token:</p>
          <code className="block bg-gray-900 text-green-400 p-4 rounded font-mono text-sm break-all">
            {newToken}
          </code>
          <p className="text-sm text-red-600 mt-4 font-bold">
            ⚠️ Save this token now! You won't be able to see it again.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Use this token with: <code>izi auth --token {newToken}</code>
          </p>
        </div>
      )}
    </div>
  );
}
```

## Step 5: Test Your API (5 minutes)

### Create a test user and token

1. Sign up a user on your website
2. Go to `/tokens` page
3. Generate a new API token
4. Copy the token

### Test with curl

```bash
# Test authentication
curl -X POST https://gitizi.com/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"your-generated-token"}'

# Should return: {"success":true,"username":"youruser"}
```

### Test with CLI

```bash
izi auth --token your-generated-token
izi list
```

## Step 6: Deploy (3 minutes)

1. **Push to GitHub**
```bash
git add .
git commit -m "Add API backend"
git push
```

2. **Deploy to Vercel/Netlify**
   - Connect your repo
   - Add environment variables
   - Deploy!

3. **Update DNS**
   - Point `api.gitizi.com` or configure path rewrites

## Troubleshooting

### "Invalid or expired token"
- Check that the token exists in the database
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase logs for errors

### "Failed to create prompt"
- Check database constraints
- Verify RLS policies are correct
- Check Supabase logs

### CORS errors
- Verify middleware.ts is in the correct location
- Check that CORS headers are being sent
- Try clearing browser cache

### API not found (404)
- Verify API routes are in the correct directories
- Check that files are named `route.ts`
- Rebuild and restart dev server

## Next Steps

- ✅ Add rate limiting
- ✅ Add analytics
- ✅ Add webhook support
- ✅ Add prompt versioning
- ✅ Add prompt sharing features
- ✅ Add usage metrics

## Support

For issues:
1. Check Supabase logs
2. Check Vercel/Netlify deployment logs
3. Test API endpoints with curl
4. Review the full `BACKEND_API_GUIDE.md`

Good luck! 🚀
