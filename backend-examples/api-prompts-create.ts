// app/api/prompts/route.ts
// API endpoint to create prompts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Middleware to verify API token
async function verifyToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const { data, error } = await supabase
      .rpc('verify_api_token', { token_value: token });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// POST /api/prompts - Create a new prompt
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(req);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please provide a valid API token.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { name, description, content, tags } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { message: 'Name is required and must be a string' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { message: 'Description is required and must be a string' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { message: 'Content is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate constraints
    if (name.length > 100) {
      return NextResponse.json(
        { message: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    if (description.length > 500) {
      return NextResponse.json(
        { message: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (content.length > 102400) { // 100KB
      return NextResponse.json(
        { message: 'Content must be 100KB or less' },
        { status: 400 }
      );
    }

    // Validate tags
    let tagsArray: string[] = [];
    if (tags) {
      if (!Array.isArray(tags)) {
        return NextResponse.json(
          { message: 'Tags must be an array' },
          { status: 400 }
        );
      }

      if (tags.length > 10) {
        return NextResponse.json(
          { message: 'Maximum 10 tags allowed' },
          { status: 400 }
        );
      }

      tagsArray = tags.map(tag => {
        if (typeof tag !== 'string') {
          throw new Error('All tags must be strings');
        }
        if (tag.length > 30) {
          throw new Error('Each tag must be 30 characters or less');
        }
        return tag.trim();
      }).filter(tag => tag.length > 0);
    }

    // Insert prompt into database
    const { data: prompt, error } = await supabase
      .from('prompts')
      .insert({
        user_id: user.user_id,
        name: name.trim(),
        description: description.trim(),
        content: content,
        tags: tagsArray,
        is_public: true
      })
      .select(`
        id,
        name,
        description,
        content,
        tags,
        created_at,
        updated_at,
        users (username)
      `)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { message: 'Failed to create prompt' },
        { status: 500 }
      );
    }

    // Format response
    const response = {
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      tags: prompt.tags || [],
      author: prompt.users.username,
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Create prompt error:', error);

    if (error.message?.includes('tags')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}

// GET /api/prompts - List user's prompts (for /api/prompts/me)
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(req);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized. Please provide a valid API token.' },
        { status: 401 }
      );
    }

    // Get user's prompts
    const { data: prompts, error } = await supabase
      .from('prompts')
      .select(`
        id,
        name,
        description,
        content,
        tags,
        created_at,
        updated_at,
        users (username)
      `)
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { message: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    // Format response
    const response = prompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
      tags: prompt.tags || [],
      author: prompt.users.username,
      createdAt: prompt.created_at,
      updatedAt: prompt.updated_at
    }));

    return NextResponse.json(response);

  } catch (error) {
    console.error('List prompts error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
