#!/usr/bin/env node
/**
 * Admin Setup Verification Script
 * Run this script to verify that admin authentication is properly configured
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

const ADMIN_EMAILS = [
  'dineshkatal.work@gmail.com',
  'katal091995@gmail.com'
]

class AdminSetupVerifier {
  constructor() {
    this.errors = []
    this.warnings = []
    this.success = []
  }

  log(type, message) {
    const timestamp = new Date().toISOString()
    const prefix = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    }[type] || 'ℹ️'
    
    console.log(`${prefix} ${message}`)
    
    if (type === 'error') this.errors.push(message)
    if (type === 'warning') this.warnings.push(message)
    if (type === 'success') this.success.push(message)
  }

  checkEnvironmentVariables() {
    this.log('info', 'Checking environment variables...')
    
    for (const envVar of REQUIRED_ENV_VARS) {
      if (!process.env[envVar]) {
        this.log('error', `Missing environment variable: ${envVar}`)
      } else if (process.env[envVar].includes('YOUR_') || process.env[envVar].includes('_HERE')) {
        this.log('error', `Environment variable ${envVar} contains placeholder value`)
      } else {
        this.log('success', `Environment variable ${envVar} is set`)
      }
    }
  }

  async checkSupabaseConnection() {
    this.log('info', 'Testing Supabase connection...')
    
    try {
      // Test with anon key
      const supabaseAnon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      
      const { data: anonData, error: anonError } = await supabaseAnon
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (anonError && !anonError.message.includes('permission denied')) {
        this.log('error', `Anon key connection failed: ${anonError.message}`)
      } else {
        this.log('success', 'Anon key connection successful')
      }
      
      // Test with service role key
      if (process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_')) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        const { data: adminData, error: adminError } = await supabaseAdmin
          .from('profiles')
          .select('count')
          .limit(1)
        
        if (adminError) {
          this.log('error', `Service role key connection failed: ${adminError.message}`)
        } else {
          this.log('success', 'Service role key connection successful')
        }
      }
      
    } catch (error) {
      this.log('error', `Supabase connection test failed: ${error.message}`)
    }
  }

  checkFileConfiguration() {
    this.log('info', 'Checking file configurations...')
    
    // Check middleware.ts
    const middlewarePath = path.join(__dirname, 'middleware.ts')
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
      
      for (const email of ADMIN_EMAILS) {
        if (middlewareContent.includes(email)) {
          this.log('success', `Admin email ${email} found in middleware`)
        } else {
          this.log('warning', `Admin email ${email} not found in middleware`)
        }
      }
    } else {
      this.log('error', 'middleware.ts file not found')
    }
    
    // Check supabase-admin.ts
    const supabaseAdminPath = path.join(__dirname, 'lib', 'supabase-admin.ts')
    if (fs.existsSync(supabaseAdminPath)) {
      this.log('success', 'supabase-admin.ts file exists')
    } else {
      this.log('error', 'lib/supabase-admin.ts file not found')
    }
  }

  checkNetlifyConfiguration() {
    this.log('info', 'Checking Netlify configuration...')
    
    const netlifyTomlPath = path.join(__dirname, 'netlify.toml')
    if (fs.existsSync(netlifyTomlPath)) {
      this.log('success', 'netlify.toml file exists')
      
      const netlifyContent = fs.readFileSync(netlifyTomlPath, 'utf8')
      if (netlifyContent.includes('NODE_VERSION')) {
        this.log('success', 'Node version specified in netlify.toml')
      }
    } else {
      this.log('warning', 'netlify.toml file not found')
    }
    
    this.log('info', 'Remember to set environment variables in Netlify dashboard:')
    for (const envVar of REQUIRED_ENV_VARS) {
      this.log('info', `  - ${envVar}`)
    }
  }

  generateSummary() {
    console.log('\n' + '='.repeat(50))
    console.log('ADMIN SETUP VERIFICATION SUMMARY')
    console.log('='.repeat(50))
    
    console.log(`\n✅ Successful checks: ${this.success.length}`)
    console.log(`⚠️  Warnings: ${this.warnings.length}`)
    console.log(`❌ Errors: ${this.errors.length}`)
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS TO FIX:')
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:')
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    }
    
    if (this.errors.length === 0) {
      console.log('\n🎉 All critical checks passed! Admin setup should work correctly.')
      console.log('\nNext steps:')
      console.log('1. Deploy to Netlify with environment variables set')
      console.log('2. Test admin login with authorized email')
      console.log('3. Verify access to /admin/dashboard')
    } else {
      console.log('\n🚨 Please fix the errors above before deploying.')
    }
    
    console.log('\n📖 For detailed instructions, see: NETLIFY_ADMIN_FIX.md')
  }

  async run() {
    console.log('🔍 Starting Admin Setup Verification...\n')
    
    this.checkEnvironmentVariables()
    await this.checkSupabaseConnection()
    this.checkFileConfiguration()
    this.checkNetlifyConfiguration()
    
    this.generateSummary()
  }
}

// Run the verification
if (require.main === module) {
  const verifier = new AdminSetupVerifier()
  verifier.run().catch(error => {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  })
}

module.exports = AdminSetupVerifier