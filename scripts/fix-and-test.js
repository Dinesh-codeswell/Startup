#!/usr/bin/env node

// Quick fix and test script

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Running website fixes and tests...');

// 1. Clear Next.js cache
console.log('1. Clearing Next.js cache...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  console.log('✅ Cache cleared');
} catch (error) {
  console.log('⚠️  Cache clear failed (might not exist)');
}

// 2. Check if required files exist
console.log('2. Checking required files...');
const requiredFiles = [
  'public/images/beyond-career-logo.png',
  'public/images/beyond-career-logo.svg',
  'public/manifest.json',
  'public/sw.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// 3. Install dependencies if needed
console.log('3. Checking dependencies...');
try {
  execSync('npm list next', { stdio: 'pipe' });
  console.log('✅ Dependencies look good');
} catch (error) {
  console.log('⚠️  Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
}

// 4. Build the project
console.log('4. Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed');
  process.exit(1);
}

console.log('\n🎉 All fixes applied! You can now run:');
console.log('   npm run dev    - for development');
console.log('   npm start      - for production');
console.log('\n📊 To test performance:');
console.log('   npm run perf:test');