#!/usr/bin/env node

// Build fix script to resolve common issues

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing build issues...');

// 1. Clear all caches
console.log('1. Clearing caches...');
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('node_modules/.cache')) {
    execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
  }
  console.log('✅ Caches cleared');
} catch (error) {
  console.log('⚠️  Cache clear failed:', error.message);
}

// 2. Check environment variables
console.log('2. Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let envOk = true;
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.log(`❌ Missing environment variable: ${envVar}`);
    envOk = false;
  } else {
    console.log(`✅ ${envVar} is set`);
  }
});

if (!envOk) {
  console.log('\n⚠️  Please check your .env file');
}

// 3. Try a clean build
console.log('3. Attempting clean build...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });
  console.log('✅ Build successful!');
} catch (error) {
  console.log('❌ Build failed');
  console.log('\nTrying alternative build approach...');
  
  // Try with different settings
  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1'
      }
    });
    console.log('✅ Alternative build successful!');
  } catch (altError) {
    console.log('❌ Alternative build also failed');
    console.log('\nPlease check the error messages above and fix any remaining issues.');
    process.exit(1);
  }
}

console.log('\n🎉 Build fix completed successfully!');
console.log('You can now run: npm run dev');