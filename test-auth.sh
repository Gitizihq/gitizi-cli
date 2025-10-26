#!/bin/bash

echo "Testing Gitizi CLI Authentication Flow"
echo "========================================"
echo ""

# Test token
TOKEN="gitizi_8fd24cbd5bfe34d21b2f16fc98162b314a169ecb4aff3a747e97c37cc7d8b7e6"

echo "1. Testing if api-auth-verify endpoint is accessible..."
echo ""

# Test the auth endpoint directly
curl -s -L -X POST 'https://sewwdxmqorokboxzpsxu.supabase.co/functions/v1/api-auth-verify' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld3dkeG1xb3Jva2JveHpwc3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5NDU4NTcsImV4cCI6MjA1NDUyMTg1N30.I0BElLPrcNKBIHDlhPAjZl5eRmEWqNnYEeJqrGbgAHc" \
  -H 'Content-Type: application/json' \
  --data "{\"token\":\"$TOKEN\"}" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.' 2>/dev/null || cat

echo ""
echo "2. If you got 401 or 404, the Edge Function needs to be deployed."
echo "3. If you got 'Invalid or expired token', the token doesn't exist in your database."
echo ""
echo "Next Steps:"
echo "==========="
echo "1. Deploy the Edge Function:"
echo "   supabase functions deploy api-auth-verify --no-verify-jwt"
echo ""
echo "2. Create a test token in your database:"
echo "   See edge-functions/README.md for SQL commands"
echo ""
echo "3. Test auth with CLI:"
echo "   izi auth --token YOUR_TOKEN_FROM_DATABASE"
