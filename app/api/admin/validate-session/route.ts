import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAuthorizedAdmin } from '@/lib/admin-utils'

/**
 * API endpoint to validate admin session and authorization
 * ADMIN AUTHENTICATION DISABLED - Always returns admin access for testing
 */
export async function GET(request: NextRequest) {
  try {
    // ADMIN AUTHENTICATION DISABLED - Always return admin access
    console.log('Admin session validation (DISABLED):', {
      userEmail: 'test-admin@example.com',
      isAdmin: true,
      authDisabled: true,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      isValid: true,
      isAdmin: true,
      userEmail: 'test-admin@example.com',
      userId: 'test-admin-id',
      authDisabled: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin session validation error:', error)
    
    // Even on error, return admin access when disabled
    return NextResponse.json({
      isValid: true,
      isAdmin: true,
      userEmail: 'test-admin@example.com',
      userId: 'test-admin-id',
      authDisabled: true,
      error: 'Error occurred but auth is disabled',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * POST endpoint to refresh admin status
 * ADMIN AUTHENTICATION DISABLED - Always returns admin access for testing
 */
export async function POST(request: NextRequest) {
  try {
    // ADMIN AUTHENTICATION DISABLED - Always return admin access
    console.log('Admin session refreshed (DISABLED):', {
      userEmail: 'test-admin@example.com',
      isAdmin: true,
      authDisabled: true,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      isValid: true,
      isAdmin: true,
      userEmail: 'test-admin@example.com',
      userId: 'test-admin-id',
      sessionRefreshed: true,
      authDisabled: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin session refresh error:', error)
    
    // Even on error, return admin access when disabled
    return NextResponse.json({
      isValid: true,
      isAdmin: true,
      userEmail: 'test-admin@example.com',
      userId: 'test-admin-id',
      sessionRefreshed: true,
      authDisabled: true,
      error: 'Error occurred but auth is disabled',
      timestamp: new Date().toISOString()
    })
  }
}