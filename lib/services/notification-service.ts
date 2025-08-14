import { TeamMatchingService } from './team-matching-db'
import type { 
  TeamNotification, 
  NotificationTemplate, 
  NotificationContext,
  TeamWithMembers 
} from '@/lib/types/team-matching'

export interface EmailConfig {
  provider: 'resend' | 'sendgrid' | 'nodemailer'
  apiKey?: string
  fromEmail: string
  fromName: string
}

export interface SMSConfig {
  provider: 'twilio' | 'aws-sns'
  apiKey?: string
  accountSid?: string
  authToken?: string
  fromNumber?: string
}

export interface NotificationServiceConfig {
  email: EmailConfig
  sms?: SMSConfig
  enableEmail: boolean
  enableSMS: boolean
  enableWhatsApp: boolean
}

export class NotificationService {
  private static config: NotificationServiceConfig = {
    email: {
      provider: 'resend',
      fromEmail: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@beyondcareer.online',
      fromName: 'Beyond Career Team Matching'
    },
    enableEmail: true,
    enableSMS: false,
    enableWhatsApp: false
  }

  /**
   * Initialize notification service with configuration
   */
  static configure(config: Partial<NotificationServiceConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('📧 Notification service configured:', {
      email: this.config.enableEmail,
      sms: this.config.enableSMS,
      whatsapp: this.config.enableWhatsApp
    })
  }

  /**
   * Process pending notifications
   */
  static async processPendingNotifications(): Promise<{
    processed: number
    successful: number
    failed: number
    errors: string[]
  }> {
    console.log('📬 Processing pending notifications...')
    
    try {
      const pendingNotifications = await TeamMatchingService.getPendingNotifications()
      
      if (pendingNotifications.length === 0) {
        console.log('ℹ️  No pending notifications to process')
        return { processed: 0, successful: 0, failed: 0, errors: [] }
      }

      console.log(`📨 Found ${pendingNotifications.length} pending notifications`)

      let successful = 0
      let failed = 0
      const errors: string[] = []

      for (const notification of pendingNotifications) {
        try {
          const success = await this.sendNotification(notification)
          
          if (success) {
            await TeamMatchingService.markNotificationSent(notification.id)
            successful++
            console.log(`✅ Sent notification: ${notification.title}`)
          } else {
            failed++
            errors.push(`Failed to send notification: ${notification.title}`)
          }
        } catch (error) {
          failed++
          const errorMsg = `Error sending notification ${notification.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      console.log(`📊 Notification processing complete: ${successful} sent, ${failed} failed`)

      return {
        processed: pendingNotifications.length,
        successful,
        failed,
        errors
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error processing notifications:', errorMsg)
      return { processed: 0, successful: 0, failed: 0, errors: [errorMsg] }
    }
  }

  /**
   * Send a single notification
   */
  private static async sendNotification(notification: TeamNotification): Promise<boolean> {
    const methods = notification.delivery_method
    let success = false

    // Try each delivery method
    for (const method of methods) {
      try {
        switch (method) {
          case 'email':
            if (this.config.enableEmail) {
              success = await this.sendEmail(notification)
            }
            break
          case 'sms':
            if (this.config.enableSMS) {
              success = await this.sendSMS(notification)
            }
            break
          case 'whatsapp':
            if (this.config.enableWhatsApp) {
              success = await this.sendWhatsApp(notification)
            }
            break
        }

        if (success) break // Stop trying other methods if one succeeds
      } catch (error) {
        console.error(`Failed to send ${method} notification:`, error)
      }
    }

    return success
  }

  /**
   * Send email notification
   */
  private static async sendEmail(notification: TeamNotification): Promise<boolean> {
    try {
      // Get submission details for email address
      const submissions = await TeamMatchingService.getSubmissions({ 
        status: 'team_formed' 
      })
      const submission = submissions.find(s => s.id === notification.submission_id)
      
      if (!submission) {
        console.error('❌ Submission not found for notification:', notification.id)
        return false
      }

      const emailData = {
        to: submission.email,
        from: {
          email: this.config.email.fromEmail,
          name: this.config.email.fromName
        },
        subject: notification.title,
        html: this.generateEmailHTML(notification, submission.full_name),
        text: notification.message
      }

      // For now, we'll simulate email sending
      // In production, integrate with actual email service
      console.log('📧 Email notification (simulated):', {
        to: emailData.to,
        subject: emailData.subject,
        provider: this.config.email.provider
      })

      // TODO: Integrate with actual email service
      // Example for Resend:
      // const resend = new Resend(this.config.email.apiKey)
      // await resend.emails.send(emailData)

      return true
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      return false
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMS(notification: TeamNotification): Promise<boolean> {
    try {
      // Get submission details for phone number
      const submissions = await TeamMatchingService.getSubmissions({ 
        status: 'team_formed' 
      })
      const submission = submissions.find(s => s.id === notification.submission_id)
      
      if (!submission) {
        console.error('❌ Submission not found for SMS notification:', notification.id)
        return false
      }

      // For now, we'll simulate SMS sending
      console.log('📱 SMS notification (simulated):', {
        to: submission.whatsapp_number,
        message: notification.message.substring(0, 160) + '...',
        provider: this.config.sms?.provider
      })

      // TODO: Integrate with actual SMS service
      // Example for Twilio:
      // const client = twilio(this.config.sms.accountSid, this.config.sms.authToken)
      // await client.messages.create({
      //   body: notification.message,
      //   from: this.config.sms.fromNumber,
      //   to: submission.whatsapp_number
      // })

      return true
    } catch (error) {
      console.error('❌ SMS sending failed:', error)
      return false
    }
  }

  /**
   * Send WhatsApp notification
   */
  private static async sendWhatsApp(notification: TeamNotification): Promise<boolean> {
    try {
      // For now, we'll simulate WhatsApp sending
      console.log('💬 WhatsApp notification (simulated):', {
        notification_id: notification.id,
        type: notification.notification_type
      })

      // TODO: Integrate with WhatsApp Business API
      return true
    } catch (error) {
      console.error('❌ WhatsApp sending failed:', error)
      return false
    }
  }

  /**
   * Generate HTML email template
   */
  private static generateEmailHTML(notification: TeamNotification, userName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${notification.title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .team-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 ${notification.title}</h1>
    </div>
    
    <div class="content">
        <p>Hi ${userName},</p>
        
        <p>${notification.message}</p>
        
        <div class="team-info">
            <h3>🚀 What's Next?</h3>
            <ul>
                <li>Check your team dashboard for member contact details</li>
                <li>Join your team's WhatsApp group (link coming soon)</li>
                <li>Start planning your case competition strategy</li>
                <li>Collaborate and win together! 🏆</li>
            </ul>
        </div>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://beyondcareer.online'}/team-dashboard" class="button">
            View My Team Dashboard
        </a>
        
        <p>Good luck with your case competitions!</p>
        
        <p>Best regards,<br>
        The Beyond Career Team</p>
    </div>
    
    <div class="footer">
        <p>Beyond Career - Connecting Students for Success</p>
        <p>If you have any questions, reply to this email or contact us at support@beyondcareer.online</p>
    </div>
</body>
</html>
    `
  }

  /**
   * Create and queue team formation notifications
   */
  static async createTeamFormationNotifications(teams: TeamWithMembers[]): Promise<number> {
    let notificationsCreated = 0

    const template: NotificationTemplate = {
      type: 'team_formed',
      title: 'Your Dream Team is Ready! 🎉',
      message: `Exciting news! You've been matched with {team_size} incredible teammates based on your skills and preferences. Your team has a compatibility score of {compatibility_score}%! Team members: {team_members}. Time to collaborate and dominate those case competitions! 🚀`,
      delivery_methods: ['email']
    }

    for (const team of teams) {
      const teamMemberNames = team.members.map(member => member.submission.full_name)
      
      for (const member of team.members) {
        const otherMembers = teamMemberNames.filter(name => name !== member.submission.full_name)
        
        const context: NotificationContext = {
          user_name: member.submission.full_name,
          team_name: team.team_name || `Team ${team.id.slice(0, 8)}`,
          team_members: otherMembers,
          team_size: team.team_size,
          compatibility_score: team.compatibility_score
        }

        try {
          await TeamMatchingService.createNotification(
            member.submission_id,
            team.id,
            template,
            context
          )
          notificationsCreated++
        } catch (error) {
          console.error(`Failed to create notification for ${member.submission.full_name}:`, error)
        }
      }
    }

    console.log(`📧 Created ${notificationsCreated} team formation notifications`)
    return notificationsCreated
  }

  /**
   * Start notification processing service
   */
  static startNotificationProcessor(intervalMinutes: number = 5): void {
    console.log(`🔄 Starting notification processor (every ${intervalMinutes} minutes)`)
    
    const processNotifications = async () => {
      try {
        const result = await this.processPendingNotifications()
        if (result.processed > 0) {
          console.log(`📊 Processed ${result.processed} notifications: ${result.successful} sent, ${result.failed} failed`)
        }
      } catch (error) {
        console.error('❌ Notification processor error:', error)
      }
    }

    // Process immediately
    processNotifications()

    // Schedule recurring processing
    setInterval(processNotifications, intervalMinutes * 60 * 1000)
  }
}