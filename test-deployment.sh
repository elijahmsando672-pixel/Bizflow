#!/bin/bash
# Test script to verify deployments

echo "Testing Vercel Frontend..."
echo "Enter your Vercel app URL (e.g., https://your-app.vercel.app):"
read VERCEL_URL

echo "Testing Railway Backend..."
echo "Enter your Railway app URL (e.g., https://bizflow-server.up.railway.app):"
read RAILWAY_URL

echo ""
echo "1. Testing Frontend (Vercel)..."
curl -s -o /dev/null -w "Frontend Status: %{http_code}\n" "$VERCEL_URL"

echo ""
echo "2. Testing Backend Health (Railway)..."
curl -s -o /dev/null -w "Backend Status: %{http_code}\n" "$RAILWAY_URL"

echo ""
echo "3. Testing Backend API..."
curl -s -w "\nAPI Test Status: %{http_code}\n" "$RAILWAY_URL/api/auth/me"

echo ""
echo "4. Testing Login..."
curl -s -X POST "$RAILWAY_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"elijah@bizflow.com","password":"test123"}' \
  -w "\nLogin Status: %{http_code}\n"

echo ""
echo "Deployment test complete!"
