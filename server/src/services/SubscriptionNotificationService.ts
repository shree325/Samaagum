import prisma from '../config/prisma';
import { sendEmail } from '../utils/email';
import { sendNotificationToUser } from './messagingSocket';
import { notificationService } from './NotificationService';

export class SubscriptionNotificationService {
  /**
   * Scans for subscriptions expiring in exactly 5 days (calendar day difference)
   * and triggers both in-app (socket + log) and email notifications.
   */
  static async checkExpiringSubscriptions(): Promise<void> {
    console.log('⏳ Running expiring subscriptions check...');
    try {
      // Expiration target is exactly 5 days from today
      const targetDateStart = new Date();
      targetDateStart.setDate(targetDateStart.getDate() + 5);
      targetDateStart.setHours(0, 0, 0, 0);

      const targetDateEnd = new Date(targetDateStart);
      targetDateEnd.setHours(23, 59, 59, 999);

      // Find active subscriptions expiring in 5 days
      const expiringSubs = await prisma.subscriptions.findMany({
        where: {
          state: 'active',
          valid_to: {
            gte: targetDateStart,
            lte: targetDateEnd
          }
        },
        include: {
          entities: {
            select: {
              user_id: true,
              users: {
                select: {
                  id: true,
                  primary_email: true,
                  profiles: {
                    select: {
                      display_name: true
                    }
                  }
                }
              }
            }
          },
          plans: {
            select: {
              key: true
            }
          }
        }
      });

      console.log(`[SubscriptionNotificationService] Found ${expiringSubs.length} subscriptions expiring in 5 days.`);

      for (const sub of expiringSubs) {
        const user = sub.entities?.users;
        if (!user || !user.primary_email) {
          console.log(`[SubscriptionNotificationService] Skipping subscription ${sub.id}: user or email not found.`);
          continue;
        }

        // Check if notification has already been sent for this subscription's 5-day warning
        const existingNotif = await prisma.notification_log.findFirst({
          where: {
            user_id: user.id,
            template_key: 'subscription_expiring_soon',
            provider_ref: sub.id
          }
        });

        if (existingNotif) {
          console.log(`[SubscriptionNotificationService] Notification already sent for subscription ${sub.id} (user: ${user.id}).`);
          continue;
        }

        // Write a sentinel record immediately so scheduler doesn't re-process
        // this subscription on the next 24h run, regardless of channel preferences.
        await prisma.notification_log.create({
          data: {
            tenant_id: sub.tenant_id,
            user_id: user.id,
            channel: 'socket',
            template_key: 'subscription_expiring_soon',
            provider_ref: sub.id,
            status: 'dedup_sentinel'
          }
        });

        const planName = sub.plans?.key
          ? sub.plans.key.charAt(0).toUpperCase() + sub.plans.key.slice(1)
          : 'Samaagum Plan';

        const formattedExpiryDate = sub.valid_to
          ? new Date(sub.valid_to).toLocaleDateString('en-US', { dateStyle: 'long' })
          : 'in 5 days';

        // 1. Create In-App Notification Log entry (only if in-app is enabled)
        const inAppEnabled = await notificationService.shouldDeliver(user.id, 'SUBSCRIPTION_EXPIRING', 'app');
        if (inAppEnabled) {
          await prisma.notification_log.create({
            data: {
              tenant_id: sub.tenant_id,
              user_id: user.id,
              channel: 'socket',
              template_key: 'subscription_expiring_soon',
              provider_ref: sub.id,
              status: 'queued'
            }
          });

          // 2. Try sending socket message to user real-time if online
          try {
            sendNotificationToUser(user.id, 'subscription.expiring', {
              planName,
              expiryDate: sub.valid_to
            });
            console.log(`[SubscriptionNotificationService] Real-time socket notification sent to user ${user.id}`);
          } catch (socketErr) {
            console.error(`[SubscriptionNotificationService] Failed to send socket notification to user ${user.id}:`, socketErr);
          }
        } else {
          console.log(`[SubscriptionNotificationService] In-app notification skipped per user preference (user: ${user.id}).`);
        }

        // 3. Send Email
        const emailSubject = `Your Samaagum Subscription is expiring soon`;
        const displayName = user.profiles?.display_name || user.primary_email.split('@')[0];
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #1a1a1a;">Subscription Expiration Notice</h2>
            <p>Hi ${displayName},</p>
            <p>This is a friendly reminder that your subscription to the <strong>${planName}</strong> plan is expiring in 5 days on <strong>${formattedExpiryDate}</strong>.</p>
            <p>To avoid any disruption to your services and access on Samaagum, please renew or update your subscription.</p>
            <p style="margin-top: 30px;">
              <a href="${process.env.APP_BASE_URL || 'http://localhost:3000'}/settings" 
                 style="background: #e5484d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                Manage Subscription
              </a>
            </p>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">If you have already renewed, you can safely ignore this email.</p>
          </div>
        `;

        if (await notificationService.shouldDeliver(user.id, 'SUBSCRIPTION_EXPIRING', 'email')) {
          try {
            await sendEmail({
              to: user.primary_email,
              subject: emailSubject,
              html: emailHtml
            });
            console.log(`[SubscriptionNotificationService] Expiration warning email sent to ${user.primary_email}`);
          } catch (emailErr) {
            console.error(`[SubscriptionNotificationService] Failed to send email to ${user.primary_email}:`, emailErr);
          }
        } else {
          console.log(`[SubscriptionNotificationService] Expiration warning email skipped per user preference (user: ${user.id}).`);
        }
      }
    } catch (err) {
      console.error('[SubscriptionNotificationService] Error during expiring subscriptions check:', err);
    }
  }

  /**
   * Starts the background scheduler loop.
   */
  static startScheduler(): void {
    // Run once on startup (after 10 seconds delay)
    setTimeout(() => {
      this.checkExpiringSubscriptions().catch(console.error);
    }, 10000);

    // Run once every 24 hours
    setInterval(() => {
      this.checkExpiringSubscriptions().catch(console.error);
    }, 24 * 60 * 60 * 1000);
    
    console.log('📅 Subscription Expiration Scheduler initialized (Runs daily)');
  }
}
