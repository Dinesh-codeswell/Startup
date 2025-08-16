#!/usr/bin/env node
/**
 * Debug Admin Access Script
 * This script helps debug admin access issues by checking the configuration
 */

// Hardcoded admin configuration (matches middleware.ts and admin-utils.ts)
const AUTHORIZED_ADMIN_EMAILS = [
  'dineshkatal.work@gmail.com',
  'katal091995@gmail.com'
]

// Simple email validation
function isValidEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Get additional admin emails from environment
function getAdditionalAdminEmails() {
  const additionalEmails = process.env.ADDITIONAL_ADMIN_EMAILS?.split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0) || []
  return additionalEmails
}

// Get all authorized emails
function getAllAuthorizedEmails() {
  return [...AUTHORIZED_ADMIN_EMAILS, ...getAdditionalAdminEmails()]
}

// Check if email is authorized
function isAuthorizedAdmin(email) {
  if (!email) return false
  
  const trimmedEmail = email.trim()
  if (!isValidEmail(trimmedEmail)) return false
  
  const authorizedEmails = getAllAuthorizedEmails()
  const normalizedEmail = trimmedEmail.toLowerCase()
  
  return authorizedEmails.some(adminEmail => 
    adminEmail.toLowerCase().trim() === normalizedEmail
  )
}

// Test emails
const TEST_EMAILS = [
  'dineshkatal.work@gmail.com',
  'katal091995@gmail.com'
]

console.log('🔍 Admin Access Debug Report')
console.log('='.repeat(50))

// Check environment variables
console.log('\n📋 Environment Variables:')
console.log('ADDITIONAL_ADMIN_EMAILS:', process.env.ADDITIONAL_ADMIN_EMAILS || 'Not set')
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set')

// Get authorized emails
console.log('\n📧 Authorized Admin Emails:')
const authorizedEmails = getAllAuthorizedEmails()
authorizedEmails.forEach((email, index) => {
  console.log(`${index + 1}. ${email}`)
})

// Test each email
console.log('\n🧪 Testing Admin Access:')
TEST_EMAILS.forEach(email => {
  const isAdmin = isAuthorizedAdmin(email)
  const status = isAdmin ? '✅ AUTHORIZED' : '❌ NOT AUTHORIZED'
  console.log(`${email}: ${status}`)
})

// Test case variations
console.log('\n🔄 Testing Email Variations:')
const testVariations = [
  'dineshkatal.work@gmail.com',
  'DINESHKATAL.WORK@GMAIL.COM',
  ' dineshkatal.work@gmail.com ',
  'dineshkatal.work@gmail.com\n'
]

testVariations.forEach(email => {
  const isAdmin = isAuthorizedAdmin(email)
  const status = isAdmin ? '✅' : '❌'
  console.log(`"${email}": ${status}`)
})

console.log('\n💡 Troubleshooting Tips:')
console.log('1. Make sure you\'re logging in with exactly one of the authorized emails')
console.log('2. Check that your Netlify environment variables are set correctly')
console.log('3. Verify that the email in your Google account matches exactly')
console.log('4. Try clearing your browser cache and cookies')
console.log('5. Check the browser console for any error messages')

console.log('\n🔧 Next Steps:')
console.log('1. Run this script: node debug-admin-access.js')
console.log('2. Check the browser console when accessing /admin/dashboard')
console.log('3. Verify the email shown in the profile dropdown matches authorized emails')