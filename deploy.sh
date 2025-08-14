#!/bin/bash

# Netlify deployment script
echo "Starting deployment process..."

# Check Node.js version
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Check if pnpm is available, if not install it
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm@8
fi

echo "pnpm version: $(pnpm --version)"

# Use Netlify-specific package.json if available
if [ -f "package.netlify.json" ]; then
    echo "Using Netlify-specific package.json..."
    cp package.netlify.json package.json.backup
    mv package.json package.json.original
    mv package.netlify.json package.json
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build the project (frontend only for Netlify)
echo "Building project..."
pnpm run build

# Restore original package.json
if [ -f "package.json.original" ]; then
    mv package.json.original package.json
fi

echo "Deployment build completed successfully!"