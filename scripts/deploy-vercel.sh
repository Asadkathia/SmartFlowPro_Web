#!/bin/bash

# Exit on any error
set -e

echo "🚀 Preparing to deploy SmartFlowPro_Web to Vercel..."

# Check if Vercel CLI is installed; if not, use npx
if ! command -v vercel &> /dev/null
then
    echo "📦 Vercel CLI not found globally. We will use npx..."
    VERCEL_CMD="npx vercel"
else
    VERCEL_CMD="vercel"
fi

# Deploy to Vercel Production
echo "⚡ Deploying to the Production environment..."
$VERCEL_CMD --prod

echo "✅ Deployment triggered successfully!"
