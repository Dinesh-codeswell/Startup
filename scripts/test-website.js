#!/usr/bin/env node

// Quick website functionality test

const http = require('http');
const https = require('https');

console.log('🧪 Testing website functionality...');

// Test if the development server is running
function testServer(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ Server is running on port ${port}`);
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ Server not running on port ${port}`);
      console.log(`   Error: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ Timeout connecting to port ${port}`);
      req.destroy();
      resolve(false);
    });
  });
}

// Test basic functionality
async function runTests() {
  console.log('\n📋 Test Results:');
  
  // Test 1: Server running
  const serverRunning = await testServer(3000);
  
  if (!serverRunning) {
    console.log('\n❌ Development server is not running');
    console.log('   Please run: npm run dev');
    return;
  }

  // Test 2: Check if build files exist
  const fs = require('fs');
  const buildExists = fs.existsSync('.next');
  console.log(`${buildExists ? '✅' : '❌'} Build files exist: ${buildExists}`);

  // Test 3: Check environment variables
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  let envOk = true;
  envVars.forEach(envVar => {
    const exists = !!process.env[envVar];
    console.log(`${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'Set' : 'Missing'}`);
    if (!exists) envOk = false;
  });

  // Test 4: Check critical files
  const criticalFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'components/Header.tsx',
    'next.config.js',
    'package.json'
  ];

  criticalFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Exists' : 'Missing'}`);
  });

  // Summary
  console.log('\n📊 Summary:');
  if (serverRunning && envOk) {
    console.log('🎉 Website appears to be working correctly!');
    console.log('   You can access it at: http://localhost:3000');
  } else {
    console.log('⚠️  Some issues detected. Please check the results above.');
  }
}

runTests().catch(console.error);