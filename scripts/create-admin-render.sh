#!/usr/bin/env bash
# Create Admin (Owner) user for INOLIFE Healthcare — for use with Render backend.
# Run from your machine or from Render Shell. Requires curl.
#
# Usage:
#   ./scripts/create-admin-render.sh
#   API_URL=http://localhost:3000 ./scripts/create-admin-render.sh

set -e

API_BASE="${API_URL:-https://inolife-backend.onrender.com}"
API_BASE="${API_BASE%/}"
REGISTER_URL="${API_BASE}/api/auth/register"

echo "Creating Admin user..."
echo "Backend: $REGISTER_URL"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$REGISTER_URL" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@inolife.com","password":"admin123","role":"Owner","phone":"9876543210"}')

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Admin user created successfully."
  echo ""
  echo "Login credentials:"
  echo "  Email:    admin@inolife.com"
  echo "  Password: admin123"
  echo ""
  exit 0
fi

if [ "$HTTP_CODE" -eq 400 ] && echo "$HTTP_BODY" | grep -qi "already exists"; then
  echo "⚠️  Admin user already exists."
  echo ""
  echo "Login credentials:"
  echo "  Email:    admin@inolife.com"
  echo "  Password: admin123"
  echo ""
  exit 0
fi

echo "❌ Error creating admin (HTTP $HTTP_CODE): $HTTP_BODY"
echo ""
echo "Ensure:"
echo "  1. Backend is reachable at $API_BASE"
echo "  2. MongoDB (e.g. Atlas) is connected to the backend"
echo "  3. For local backend: API_URL=http://localhost:3000 ./scripts/create-admin-render.sh"
exit 1
