#!/bin/bash

# Security Implementation - Dependency Installation Script
# Run this script to install required security packages

echo "🔐 Installing Security Dependencies for Skill Master Backend..."
echo ""

cd backend || exit 1

echo "📦 Installing npm packages..."
npm install joi helmet express-rate-limit

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with:"
echo "   - NODE_ENV=production"
echo "   - FRONTEND_URL=your_frontend_url"
echo ""
echo "2. Run the audit log migration in Supabase:"
echo "   - File: database/migrations/improvements/23_add_audit_logs.sql"
echo ""
echo "3. Restart your backend server:"
echo "   npm run dev"
echo ""
echo "4. Read the security guide:"
echo "   docs/SECURITY_IMPLEMENTATION.md"
echo ""
echo "✅ Installation complete!"

