import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/services/notification-service'
import { verifyAdminOrRespond } from '@/lib/admin-api-protection'

// Force dynamic rendering for admin routes
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Verify admin access
  const adminError = await verifyAdminOrRespond(request);
  if (adminError) return adminError;
  try {
    const { action } = await request.json()
    
    if (action === 'process') {
      console.log('📬 Manual notification processing triggered')
      
      const result = await NotificationService.processPendingNotifications()
      
      return NextResponse.json({
        success: true,
        message: `Processed ${result.processed} notifications: ${result.successful} sent, ${result.failed} failed`,
        data: result
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "process" to process pending notifications.'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Error in notifications API:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to process notifications: ${errorMessage}`
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Verify admin access
  const adminError = await verifyAdminOrRespond(request);
  if (adminError) return adminError;
  try {
    // Return notification service status
    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        supportedMethods: ['email', 'sms', 'whatsapp'],
        enabledMethods: ['email'], // Currently only email is enabled
        lastProcessed: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error getting notification status:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json({
      success: false,
      error: `Failed to get notification status: ${errorMessage}`
    }, { status: 500 })
  }
}
