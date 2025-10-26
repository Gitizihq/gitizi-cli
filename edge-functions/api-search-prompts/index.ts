// Example Supabase Edge Function for api-search-prompts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('api-search-prompts function started')

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      })
    }

    // Get user token from custom header (sent by CLI)
    const userToken = req.headers.get('x-user-token')

    // Parse request body
    const { query, limit = 10 } = await req.json()

    console.log('Search request:', { query, limit, hasUserToken: !!userToken })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let userId = null

    // Verify user token if provided (OPTIONAL for search)
    if (userToken) {
      console.log('Verifying user token...')

      // Check if token exists in your database
      // Adjust table name and column names to match your schema
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens') // Your tokens table
        .select('user_id')
        .eq('token', userToken)
        .eq('is_active', true)
        .single()

      if (tokenError || !tokenData) {
        console.error('Token verification error:', tokenError)
        // For search, we can continue without auth but log the error
        // Uncomment the next lines if you want to require auth for search
        // return new Response(
        //   JSON.stringify({ error: 'Invalid or expired token' }),
        //   { status: 401, headers: { 'Content-Type': 'application/json' } }
        // )
      } else {
        userId = tokenData.user_id
        console.log('User authenticated:', userId)
      }
    }

    // Search prompts
    // Adjust table name and filters to match your schema
    let queryBuilder = supabase
      .from('prompts')
      .select('id, name, description, content, tags, author, created_at, updated_at')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(limit)

    // If user is authenticated, show their private prompts too
    // Otherwise, only show public prompts
    if (!userId) {
      queryBuilder = queryBuilder.eq('is_public', true)
    }

    const { data: prompts, error: searchError, count } = await queryBuilder

    if (searchError) {
      console.error('Search error:', searchError)
      return new Response(
        JSON.stringify({ error: searchError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format response to match CLI expectations
    const result = {
      prompts: prompts || [],
      total: count || prompts?.length || 0,
    }

    console.log('Search successful:', { count: result.prompts.length, total: result.total })

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
