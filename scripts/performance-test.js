#!/usr/bin/env node

// Performance testing script for the website

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runPerformanceTest() {
  console.log('🚀 Starting performance test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.setCacheEnabled(false);
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  const testUrls = [
    { name: 'Homepage', url: 'http://localhost:3000' },
    { name: 'Team Page', url: 'http://localhost:3000/team' },
    { name: 'Login Page', url: 'http://localhost:3000/login' },
  ];

  for (const test of testUrls) {
    console.log(`Testing ${test.name}...`);
    
    // Start performance measurement
    await page.goto(test.url, { waitUntil: 'networkidle0' });
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        // Core Web Vitals
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        
        // Network metrics
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        serverResponse: navigation.responseEnd - navigation.requestStart,
        
        // Resource metrics
        totalSize: performance.getEntriesByType('resource').reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0),
        resourceCount: performance.getEntriesByType('resource').length
      };
    });

    // Get Lighthouse-style metrics
    const lighthouseMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          const fid = entries.find(entry => entry.entryType === 'first-input');
          const cls = entries.find(entry => entry.entryType === 'layout-shift');
          
          resolve({
            largestContentfulPaint: lcp?.startTime || 0,
            firstInputDelay: fid?.processingStart - fid?.startTime || 0,
            cumulativeLayoutShift: cls?.value || 0
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Fallback after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });

    const testResult = {
      name: test.name,
      url: test.url,
      metrics: { ...metrics, ...lighthouseMetrics },
      timestamp: new Date().toISOString()
    };

    results.tests.push(testResult);
    
    // Log results
    console.log(`✅ ${test.name} Results:`);
    console.log(`   First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`);
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`   Total Resources: ${metrics.resourceCount}`);
    console.log(`   Total Size: ${(metrics.totalSize / 1024).toFixed(2)}KB`);
    console.log('');
  }

  await browser.close();

  // Save results
  const resultsPath = path.join(__dirname, '..', 'performance-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('📊 Performance test completed!');
  console.log(`Results saved to: ${resultsPath}`);
  
  // Generate summary
  const avgFCP = results.tests.reduce((sum, test) => sum + test.metrics.firstContentfulPaint, 0) / results.tests.length;
  const avgDCL = results.tests.reduce((sum, test) => sum + test.metrics.domContentLoaded, 0) / results.tests.length;
  
  console.log('\n📈 Summary:');
  console.log(`Average First Contentful Paint: ${avgFCP.toFixed(2)}ms`);
  console.log(`Average DOM Content Loaded: ${avgDCL.toFixed(2)}ms`);
  
  // Performance recommendations
  if (avgFCP > 2000) {
    console.log('⚠️  First Contentful Paint is slow. Consider optimizing critical resources.');
  }
  if (avgDCL > 3000) {
    console.log('⚠️  DOM Content Loaded is slow. Consider code splitting and lazy loading.');
  }
}

// Run the test
runPerformanceTest().catch(console.error);