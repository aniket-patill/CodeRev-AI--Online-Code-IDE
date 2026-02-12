#!/bin/bash

echo "🚀 Deploying Codebae Runner to Fly.io..."

if ! command -v fly &> /dev/null; then
    echo "Installing flyctl..."
    curl -L https://fly.io/install.sh | sh
    export FLYCTL_INSTALL="$HOME/.fly"
    export PATH="$FLYCTL_INSTALL/bin:$PATH"
fi

if ! fly auth whoami &> /dev/null; then
    echo "Please login to Fly.io:"
    fly auth login
fi

echo "📦 Deploying..."
fly deploy

echo "✅ Deployment complete!"
echo ""
echo "Set your API key with:"
echo "  fly secrets set API_KEY=your-secret-key"
echo ""
echo "Check status with:"
echo "  fly status"
