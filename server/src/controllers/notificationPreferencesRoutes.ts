import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';
import { NotificationPreferenceType } from '@prisma/client';
import { notificationService } from '../services/NotificationService';
import { NotificationDefinitions } from '../config/NotificationDefinitions';

/** Extract & decode the JWT from the Authorization header */
function getUserFromRequest(request: any): { userId: string } | null {
  try {
    const header = request.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    const token = header.slice(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    const uid = payload.sub || payload.userId || payload.id;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uid && UUID_REGEX.test(uid)) {
      return { userId: uid };
    }
    return null;
  } catch {
    return null;
  }
}

export async function notificationPreferencesRoutes(fastify: FastifyInstance) {

  /** GET /api/notification-preferences */
  fastify.get('/', async (request, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    try {
      // 1. Fetch user settings (global switch)
      let settings = await prisma.user_notification_settings.findUnique({
        where: { user_id: auth.userId }
      });

      // Auto-create global settings if not found
      if (!settings) {
        settings = await prisma.user_notification_settings.create({
          data: {
            user_id: auth.userId,
            in_app_enabled: true,
            email_enabled: true
          }
        });
      }

      // 2. Fetch overrides
      const overrides = await prisma.user_notification_preferences.findMany({
        where: { user_id: auth.userId }
      });

      // 3. Compute current preference states (defaults overlayed with overrides)
      const preferences = {} as Record<string, boolean>;
      for (const key of Object.keys(NotificationDefinitions) as NotificationPreferenceType[]) {
        preferences[`${key}:app`] = NotificationDefinitions[key].defaultEnabled;
        preferences[`${key}:email`] = NotificationDefinitions[key].defaultEnabled;
      }
      for (const override of overrides) {
        const channel = (override as any).channel || 'app';
        preferences[`${override.type}:${channel}`] = override.enabled;
      }

      // 4. Compute lastModified
      let lastModified = settings.updated_at || settings.created_at;
      for (const override of overrides) {
        const itemTime = override.updated_at || override.created_at;
        if (itemTime > lastModified) {
          lastModified = itemTime;
        }
      }

      return reply.send({
        success: true,
        inAppEnabled: settings.in_app_enabled,
        emailEnabled: settings.email_enabled,
        preferences,
        lastModified: lastModified.toISOString()
      });
    } catch (err: any) {
      fastify.log.error('Error fetching notification preferences:', err);
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** PATCH /api/notification-preferences */
  fastify.patch('/', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }

    const { inAppEnabled, emailEnabled, preferences } = request.body as {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
      preferences?: Array<{ type: NotificationPreferenceType; channel: 'app' | 'email'; enabled: boolean }>;
    };

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Update global settings if provided
        if (inAppEnabled !== undefined || emailEnabled !== undefined) {
          const updateData = {} as any;
          const createData = { user_id: auth.userId } as any;
          
          if (inAppEnabled !== undefined) {
            updateData.in_app_enabled = inAppEnabled;
            createData.in_app_enabled = inAppEnabled;
          }
          if (emailEnabled !== undefined) {
            updateData.email_enabled = emailEnabled;
            createData.email_enabled = emailEnabled;
          }
          
          updateData.updated_at = new Date();

          await tx.user_notification_settings.upsert({
            where: { user_id: auth.userId },
            create: createData,
            update: updateData
          });
        }

        // 2. Process sparse overrides
        if (preferences && Array.isArray(preferences)) {
          for (const item of preferences) {
            const definition = NotificationDefinitions[item.type];
            if (!definition) continue;

            const channel = item.channel || 'app';

            if (item.enabled === definition.defaultEnabled) {
              // Delete override to keep database sparse
              await tx.user_notification_preferences.deleteMany({
                where: {
                  user_id: auth.userId,
                  type: item.type,
                  channel: channel
                }
              });
            } else {
              // Upsert the override preference
              await tx.user_notification_preferences.upsert({
                where: {
                  user_id_type_channel: {
                    user_id: auth.userId,
                    type: item.type,
                    channel: channel
                  }
                },
                create: {
                  user_id: auth.userId,
                  type: item.type,
                  channel: channel,
                  enabled: item.enabled
                },
                update: {
                  enabled: item.enabled,
                  updated_at: new Date()
                }
              });
            }
          }
        }
      });

      // Invalidate memory cache
      notificationService.invalidateCache(auth.userId);

      // Re-fetch preferences to return current state
      const updatedData = await notificationService.getUserPreferences(auth.userId);
      const settings = await prisma.user_notification_settings.findUnique({
        where: { user_id: auth.userId }
      });
      const overrides = await prisma.user_notification_preferences.findMany({
        where: { user_id: auth.userId }
      });

      let lastModified = settings ? (settings.updated_at || settings.created_at) : new Date();
      for (const override of overrides) {
        const itemTime = override.updated_at || override.created_at;
        if (itemTime > lastModified) {
          lastModified = itemTime;
        }
      }

      return reply.send({
        success: true,
        inAppEnabled: updatedData.inAppEnabled,
        emailEnabled: updatedData.emailEnabled,
        preferences: updatedData.preferences,
        lastModified: lastModified.toISOString()
      });
    } catch (err: any) {
      fastify.log.error('Error updating notification preferences:', err);
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}
