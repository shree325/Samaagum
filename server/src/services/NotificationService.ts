import prisma from '../config/prisma';
import { R_notification_log } from '../repositories/R_notification_log';
import { R_connections } from '../repositories/R_connections';
import { NotificationPreferenceType } from '@prisma/client';
import { sendNotificationToUser } from './messagingSocket';
import { NotificationDefinitions } from '../config/NotificationDefinitions';

const notificationLogRepo = new R_notification_log(prisma);
const connectionsRepo = new R_connections();

interface CachedPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  preferences: Record<string, boolean>;
  timestamp: number;
}

const preferenceCache = new Map<string, CachedPreferences>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const log = {
  debug: (...args: any[]) => console.debug('[DEBUG][NotificationService]', ...args),
  info: (...args: any[]) => console.info('[INFO][NotificationService]', ...args),
  error: (...args: any[]) => console.error('[ERROR][NotificationService]', ...args),
};

export interface NotificationSendParams {
  recipientId: string;
  type: NotificationPreferenceType;
  buId: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actorId?: string;
  resourceId?: string;
}

export class NotificationService {
  /**
   * Bulk-marks unread 'message_received' notifications as read for a
   * specific conversation, up to and including maxCreatedAt.
   *
   * Delegates database queries to the repository.
   *
   * @param userId          Recipient whose notifications to sync
   * @param conversationId  Conversation that was opened
   * @param maxCreatedAt    Timestamp cap — notifications for messages arriving
   *                        AFTER this moment remain unread (race-condition guard)
   * @returns Number of notification rows updated
   */
  async syncMessageNotifications(
    userId: string,
    conversationId: string,
    maxCreatedAt: Date
  ): Promise<number> {
    return await notificationLogRepo.syncMessageNotifications(
      userId,
      conversationId,
      maxCreatedAt
    );
  }

  /**
   * Returns the total unread notification count for a user,
   * respecting the user's notification preferences so the badge
   * matches what the user actually sees in the notifications list.
   */
  async getUnreadCount(userId: string): Promise<number> {
    const [rawLogs, pendingConn, { inAppEnabled, preferences }] = await Promise.all([
      prisma.notification_log.findMany({
        where: { user_id: userId, status: { not: { in: ['read', 'dedup_sentinel'] } } },
        select: { template_key: true }
      }),
      connectionsRepo.countPending(userId),
      this.getUserPreferences(userId),
    ]);

    if (!inAppEnabled) {
      return pendingConn;
    }

    const visibleUnread = rawLogs.filter(log => {
      const prefType = NotificationService.getPrefType(log.template_key);
      if (prefType) {
        return preferences[`${prefType}:app`] !== false;
      }
      return true; // unknown template keys count by default
    }).length;

    return visibleUnread + pendingConn;
  }


  /**
   * Checks if a notification should be delivered to a recipient based on their settings and preferences.
   */
  async shouldDeliver(userId: string, type: NotificationPreferenceType, channel: 'app' | 'email' = 'app'): Promise<boolean> {
    const definition = NotificationDefinitions[type];
    if (definition?.critical) {
      return true; // Critical alerts bypass preferences
    }

    const { inAppEnabled, emailEnabled, preferences } = await this.getUserPreferences(userId);
    
    const key = `${type}:${channel}`;
    const isEnabled = preferences[key as any] !== false;

    if (channel === 'app') {
      if (!inAppEnabled) {
        return false; // Global in-app notifications disabled
      }
    } else if (channel === 'email') {
      if (!emailEnabled) {
        return false; // Global email notifications disabled
      }
    }

    return isEnabled;
  }

  /**
   * Maps a raw template_key string (as stored in notification_log) to its
   * NotificationPreferenceType. Returns null for unknown / uncontrolled keys.
   */
  static readonly TEMPLATE_TO_PREF: Record<string, NotificationPreferenceType> = {
    message_received:              'MESSAGE_RECEIVED'         as NotificationPreferenceType,
    group_join_request:            'JOIN_REQUESTS'            as NotificationPreferenceType,
    event_join_request:            'EVENT_JOIN_REQUESTS'      as NotificationPreferenceType,
    membership_approved:           'MEMBERSHIP_APPROVED'      as NotificationPreferenceType,
    group_user_joined:             'MEMBERSHIP_APPROVED'      as NotificationPreferenceType,
    membership_declined:           'MEMBERSHIP_DECLINED'      as NotificationPreferenceType,
    group_join_declined:           'MEMBERSHIP_DECLINED'      as NotificationPreferenceType,
    registration_approved:         'REGISTRATION_APPROVED'    as NotificationPreferenceType,
    event_request_accepted:        'REGISTRATION_APPROVED'    as NotificationPreferenceType,
    registration_declined:         'REGISTRATION_DECLINED'    as NotificationPreferenceType,
    event_request_declined:        'REGISTRATION_DECLINED'    as NotificationPreferenceType,
    event_reminder_24h:            'EVENT_REMINDER_24H'       as NotificationPreferenceType,
    event_reminder_1h:             'EVENT_REMINDER_1H'        as NotificationPreferenceType,
    event_updated:                 'EVENT_UPDATED'            as NotificationPreferenceType,
    event_cancelled:               'EVENT_CANCELLED'          as NotificationPreferenceType,
    event_completed:               'EVENT_COMPLETED'          as NotificationPreferenceType,
    host_announcement:             'HOST_ANNOUNCEMENTS'       as NotificationPreferenceType,
    group_event_created:           'NEW_GROUP_EVENTS'         as NotificationPreferenceType,
    registration_opened:           'CAPACITY_UPDATES'         as NotificationPreferenceType,
    group_new_post:                'NEW_DISCUSSION_POSTS'     as NotificationPreferenceType,
    group_post_activity:           'DISCUSSION_REPLIES'       as NotificationPreferenceType,
    forum_thread_pending:          'NEW_DISCUSSION_POSTS'     as NotificationPreferenceType,
    forum_thread_approved:         'NEW_DISCUSSION_POSTS'     as NotificationPreferenceType,
    connection_accepted:           'CONNECTION_ACCEPTED'      as NotificationPreferenceType,
    event_waitlist_promoted:       'WAITLIST_UPDATES'         as NotificationPreferenceType,
    event_waitlist_to_pending:     'WAITLIST_UPDATES'         as NotificationPreferenceType,
    event_waitlist_closed:         'WAITLIST_UPDATES'         as NotificationPreferenceType,
    event_waitlist_join:           'WAITLIST_UPDATES'         as NotificationPreferenceType,
    subscription_activated:        'SUBSCRIPTION_ACTIVE'      as NotificationPreferenceType,
    subscription_expiring_soon:    'SUBSCRIPTION_EXPIRING'    as NotificationPreferenceType,
  };
  
  /**
   * Helper to map raw template_key string (as stored in notification_log) to its
   * NotificationPreferenceType, handling wildcard prefixes like event_reminder_*.
   */
  static getPrefType(templateKey: string): NotificationPreferenceType | null {
    if (templateKey && templateKey.startsWith('event_reminder_')) {
      return 'EVENT_REMINDER_24H' as NotificationPreferenceType;
    }
    return this.TEMPLATE_TO_PREF[templateKey] || null;
  }

  /**
   * Check delivery by raw template_key. Convenience wrapper around shouldDeliver()
   * for call-sites that write notification_log directly without going through NotificationService.send().
   */
  async shouldDeliverByTemplateKey(userId: string, templateKey: string, channel: 'app' | 'email' = 'app'): Promise<boolean> {
    const prefType = NotificationService.getPrefType(templateKey);
    if (!prefType) return true; // Unknown types always deliver
    return this.shouldDeliver(userId, prefType, channel);
  }


  /**
   * Unified send pipeline for in-app notifications.
   * Saves DB log and triggers real-time socket events.
   */
  async send(params: NotificationSendParams) {
    const deliver = await this.shouldDeliver(params.recipientId, params.type, 'app');
    if (!deliver) {
      log.debug(`Delivery of ${params.type} to user ${params.recipientId} was skipped per notification settings.`);
      return;
    }

    try {
      // 1. Create In-App Notification Log entry
      await prisma.notification_log.create({
        data: {
          tenant_id: params.buId,
          user_id: params.recipientId,
          template_key: params.type,
          channel: 'in_app',
          status: 'sent',
          provider_ref: params.resourceId,
        }
      });

      // 2. Emit real-time socket notification so client updates instantly
      sendNotificationToUser(params.recipientId, params.type, {
        title: params.title,
        message: params.message,
        data: params.data || {},
        actorId: params.actorId,
        resourceId: params.resourceId,
      });

      log.debug(`Successfully sent notification of type ${params.type} to user ${params.recipientId}`);
    } catch (err) {
      log.error(`Failed to send notification of type ${params.type} to user ${params.recipientId}:`, err);
    }
  }

  /**
   * Fetch a user's notification settings and sparse overrides.
   */
  async getUserPreferences(userId: string): Promise<{ inAppEnabled: boolean; emailEnabled: boolean; preferences: Record<string, boolean> }> {
    const now = Date.now();
    const cached = preferenceCache.get(userId);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return { inAppEnabled: cached.inAppEnabled, emailEnabled: cached.emailEnabled, preferences: cached.preferences };
    }

    let settings: any = null;
    let overrides: any[] = [];
    try {
      const results = await Promise.all([
        prisma.user_notification_settings.findUnique({
          where: { user_id: userId }
        }),
        prisma.user_notification_preferences.findMany({
          where: { user_id: userId }
        })
      ]);
      settings = results[0];
      overrides = results[1];
    } catch (e: any) {
      // Gracefully handle missing tables in local dev/staging environments
      console.warn(`[NotificationService] Warning: Could not fetch user preferences for ${userId}: ${e.message}`);
    }


    const inAppEnabled = settings ? settings.in_app_enabled : true;
    const emailEnabled = settings ? settings.email_enabled : true;
    const preferences = {} as Record<string, boolean>;

    // Initialize defaults for both channels
    for (const key of Object.keys(NotificationDefinitions) as NotificationPreferenceType[]) {
      preferences[`${key}:app` as any] = NotificationDefinitions[key].defaultEnabled;
      preferences[`${key}:email` as any] = NotificationDefinitions[key].defaultEnabled;
    }

    // Overlay database overrides
    for (const override of overrides) {
      const channel = (override as any).channel || 'app';
      preferences[`${override.type}:${channel}` as any] = override.enabled;
    }

    // Update local cache
    preferenceCache.set(userId, { inAppEnabled, emailEnabled, preferences: preferences as any, timestamp: now });

    return { inAppEnabled, emailEnabled, preferences };
  }

  /**
   * Invalidate local preference cache for a user.
   */
  invalidateCache(userId: string) {
    preferenceCache.delete(userId);
  }
}

export const notificationService = new NotificationService();
