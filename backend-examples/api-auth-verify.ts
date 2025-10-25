// app/api/auth/verify/route.ts
// API endpoint to verify CLI authentication tokens

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasses RLS
);

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { token } = body;

    // Validate input
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Token is required and must be a string' },
        { status: 400 }
      );
    }

    // Verify token using the database function
    const { data, error } = await supabase
      .rpc('verify_api_token', { token_value: token });

    if (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const user = data[0];

    // Return success with username
    return NextResponse.json({
      success: true,
      username: user.username
    });

  } catch (error: any) {
    console.error('Auth verify error:', error);

    // Handle specific errors
    if (error.message?.includes('Invalid or expired token')) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: 'Authentication failed' },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
