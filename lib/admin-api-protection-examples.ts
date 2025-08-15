/**
 * Examples of how to use the admin API protection utilities
 * This file demonstrates different patterns for protecting API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  withAdminProtection, 
  requireAdminAccess, 
  verifyAdminOrRespond,
  isAdminRequest,
  createUnauthorizedResponse 
} from './admin-api-protection'

// Example 1: Using the withAdminProtection higher-order function
// This is the recommended approach for most admin API routes
export const protectedHandler = withAdminProtection(
  async (request: NextRequest, context: any, adminUser) => {
    // adminUser is guaranteed to be a valid admin user at this point
    console.log(`Admin ${adminUser.email} is accessing the API`)
    
    return NextResponse.json({
      message: 'Admin access granted',
      adminUser: adminUser
    })
  }
)

// Example 2: Manual admin verification with custom error handling
export async function manualVerificationHandler(request: NextRequest) {
  const adminCheck = await requireAdminAccess(request)
  
  if (!adminCheck.authorized) {
    // Custom error handling based on the specific error
    if (adminCheck.error?.includes('not authenticated')) {
      return NextResponse.json(
        { error: 'Please log in to continue' },
        { status: 401 }
      )
    } else {
      return NextResponse.json(
        { error: 'Admin access required for this operation' },
        { status: 403 }
      )
    }
  }
  
  // Proceed with admin-only logic
  return NextResponse.json({
    message: 'Success',
    user: adminCheck.user
  })
}

// Example 3: Using verifyAdminOrRespond for early return pattern
export async function earlyReturnHandler(request: NextRequest) {
  // Check admin access and return error response if unauthorized
  const errorResponse = await verifyAdminOrRespond(request)
  if (errorResponse) {
    return errorResponse
  }
  
  // Continue with admin logic - user is guaranteed to be admin here
  return NextResponse.json({ message: 'Admin operation successful' })
}

// Example 4: Simple boolean check for conditional logic
export async function conditionalHandler(request: NextRequest) {
  const isAdmin = await isAdminRequest(request)
  
  if (isAdmin) {
    // Admin-specific functionality
    return NextResponse.json({
      message: 'Admin view',
      data: 'sensitive admin data'
    })
  } else {
    // Regular user functionality
    return NextResponse.json({
      message: 'Regular user view',
      data: 'public data'
    })
  }
}

// Example 5: Protecting specific operations within a route
export async function mixedAccessHandler(request: NextRequest) {
  const method = request.method
  
  if (method === 'GET') {
    // GET is public
    return NextResponse.json({ message: 'Public data' })
  }
  
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    // Write operations require admin access
    const errorResponse = await verifyAdminOrRespond(request)
    if (errorResponse) {
      return errorResponse
    }
    
    // Admin-only write operations
    return NextResponse.json({ message: 'Admin operation completed' })
  }
  
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

// Example 6: Custom error responses
export async function customErrorHandler(request: NextRequest) {
  const adminCheck = await requireAdminAccess(request)
  
  if (!adminCheck.authorized) {
    // Create custom error response based on the specific scenario
    if (adminCheck.error?.includes('not authenticated')) {
      return createUnauthorizedResponse(
        'UNAUTHENTICATED',
        'You must be logged in to access admin features'
      )
    } else if (adminCheck.error?.includes('not verified')) {
      return createUnauthorizedResponse(
        'UNAUTHENTICATED',
        'Please verify your email address before accessing admin features'
      )
    } else {
      return createUnauthorizedResponse(
        'FORBIDDEN',
        'This operation requires administrator privileges'
      )
    }
  }
  
  return NextResponse.json({ message: 'Admin access granted' })
}

// Example usage in an actual API route file:
/*
// app/api/admin/example/route.ts
import { NextRequest } from 'next/server'
import { withAdminProtection } from '@/lib/admin-api-protection'

export const GET = withAdminProtection(
  async (request: NextRequest, context: any, adminUser) => {
    // Your admin-only logic here
    return NextResponse.json({ 
      message: 'Admin data',
      requestedBy: adminUser.email 
    })
  }
)

export const POST = withAdminProtection(
  async (request: NextRequest, context: any, adminUser) => {
    const body = await request.json()
    // Your admin-only POST logic here
    return NextResponse.json({ 
      message: 'Data created',
      createdBy: adminUser.email 
    })
  }
)
*/