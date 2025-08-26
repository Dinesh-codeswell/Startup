#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing webpack runtime error...');

// Function to remove directory recursively
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Removed ${dirPath}`);
  }
}

try {
  // Clear Next.js cache and build artifacts
  console.log('🧹 Clearing Next.js cache...');
  removeDir('.next');
  removeDir('node_modules/.cache');
  
  // Clear npm/yarn cache
  console.log('🧹 Clearing package manager cache...');
  try {
    execSync('npm cache clean --force', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Could not clear npm cache (this is usually fine)');
  }

  // Reinstall dependencies to fix any corrupted modules
  console.log('📦 Reinstalling dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('✅ Webpack error fix completed!');
  console.log('🚀 You can now run "npm run dev" to start the development server');

} catch (error) {
  console.error('❌ Error during fix process:', error.message);
  process.exit(1);
}