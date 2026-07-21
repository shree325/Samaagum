import prisma from '../config/prisma';

export interface NotificationItem {
    id: string;
    type: string;
    title: string;
    message: string;
    eventId?: string;
    eventName?: string;
    groupId?: string;
    postId?: string;
    connectionId?: string;
    targetUserId?: string;
    action?: string;
    read: boolean;
    createdAt: string;
    metadata?: Record<string, any>;
}

export interface NotificationPayload {
    version: 1;
    notifications: NotificationItem[];
    unreadCount: number;
    generatedAt: string;
}

export class NotificationRealtimeService {
    static async buildPayload(userId: string): Promise<NotificationPayload> {
        const rawLogs = await prisma.notification_log.findMany({
            where: { user_id: userId, status: { not: 'dedup_sentinel' } },
            orderBy: { created_at: 'desc' },
            take: 100
        });

        const { NotificationService, notificationService } = await import('./NotificationService');
        const { inAppEnabled, preferences } = await notificationService.getUserPreferences(userId);

        const logs = rawLogs.filter(log => {
            if (!inAppEnabled) return false;
            
            const prefType = NotificationService.getPrefType(log.template_key);
            
            if (prefType) {
                const key = `${prefType}:app`;
                return preferences[key] !== false;
            }
            return true;
        }).slice(0, 50);

        // Group provider_refs by template_key
        const msgIds = logs.filter(l => l.template_key === 'message_received' && l.provider_ref).map(l => l.provider_ref as string);
        const acceptorUserIds = logs.filter(l => l.template_key === 'connection_accepted' && l.provider_ref).map(l => l.provider_ref as string);
        const forumPostIds = logs.filter(l => (l.template_key === 'group_new_post' || l.template_key === 'group_post_activity') && l.provider_ref).map(l => l.provider_ref as string);
        
        const eventJoinLogs = logs.filter(l => l.template_key === 'event_join_request' && l.provider_ref);
        const bookingQueries = eventJoinLogs.map(l => {
            try {
                const data = JSON.parse(l.provider_ref || '{}');
                return data.eventId && data.requesterId ? { eventId: data.eventId, bookerUserId: data.requesterId } : null;
            } catch (e) {
                return null;
            }
        }).filter(Boolean) as { eventId: string, bookerUserId: string }[];

        const reminderEventIds = logs.filter(l => l.template_key.startsWith('event_reminder_') && l.provider_ref).map(l => l.provider_ref as string);
        
        const genericEventIds = logs.filter(l => (l.template_key === 'event_cancelled' || l.template_key === 'event_completed') && l.provider_ref).map(l => l.provider_ref as string);
        
        // Fetch related data in parallel
        const [
            messages,
            acceptors,
            forumPosts,
            bookings,
            reminderEvents,
            genericEvents
        ] = await Promise.all([
            msgIds.length > 0 ? prisma.messages.findMany({
                where: { id: { in: msgIds } },
                include: { users: { select: { primary_email: true, profiles: { select: { display_name: true } } } } }
            }) : Promise.resolve([]),
            
            acceptorUserIds.length > 0 ? prisma.users.findMany({
                where: { id: { in: acceptorUserIds } },
                include: { profiles: { select: { display_name: true } } }
            }) : Promise.resolve([]),
            
            forumPostIds.length > 0 ? prisma.forum_posts.findMany({
                where: { id: { in: forumPostIds } },
                select: { id: true, scope_id: true }
            }) : Promise.resolve([]),
            
            bookingQueries.length > 0 ? prisma.bookings.findMany({
                where: { OR: bookingQueries.map(q => ({ event_id: q.eventId, booker_user_id: q.bookerUserId })) },
                select: { event_id: true, booker_user_id: true, status: true }
            }) : Promise.resolve([]),
            
            reminderEventIds.length > 0 ? prisma.events.findMany({
                where: { id: { in: reminderEventIds } },
                select: { id: true, title: true }
            }) : Promise.resolve([]),
            
            genericEventIds.length > 0 ? prisma.events.findMany({
                where: { id: { in: genericEventIds } },
                select: { id: true, title: true }
            }) : Promise.resolve([])
        ]);

        const messageMap = new Map(messages.map((m: any) => [m.id, m]));
        const acceptorMap = new Map(acceptors.map((u: any) => [u.id, u]));
        const forumPostsMap = new Map<string, string>(forumPosts.map((fp: any) => [fp.id, fp.scope_id]));
        
        const bookingStatusMap = new Map<string, string>();
        for (const b of bookings) {
            bookingStatusMap.set(`${b.event_id}:${b.booker_user_id}`, b.status);
        }
        
        const reminderEventsMap = new Map<string, string>(reminderEvents.map((e: any) => [e.id, e.title]));
        const genericEventsMap = new Map<string, string>(genericEvents.map((e: any) => [e.id, e.title]));

        // Sort deterministic: created_at DESC, then id DESC
        logs.sort((a, b) => {
            const timeDiff = b.created_at.getTime() - a.created_at.getTime();
            if (timeDiff !== 0) return timeDiff;
            return b.id > a.id ? 1 : (b.id < a.id ? -1 : 0);
        });

        const notifications: NotificationItem[] = logs.map(l => {
            const read = l.status === 'read';
            const baseNotif = {
                id: l.id,
                read,
                createdAt: l.created_at.toISOString()
            };

            if (l.template_key === 'message_received') {
                const msg = messageMap.get(l.provider_ref as string);
                const sender = msg?.users?.profiles?.display_name || msg?.users?.primary_email?.split('@')[0] || "Someone";
                const text = msg?.body || "";
                return {
                    ...baseNotif,
                    type: 'message',
                    title: 'New Message',
                    message: `<b>${sender}</b> sent you a message: "${text}"`,
                    action: 'reply'
                };
            }

            if (l.template_key === 'connection_accepted') {
                const u = acceptorMap.get(l.provider_ref as string);
                const acceptorName = u?.profiles?.display_name || "Someone";
                return {
                    ...baseNotif,
                    type: 'connect',
                    title: 'Connection Accepted',
                    message: `<b>${acceptorName}</b> accepted your connection request.`,
                    targetUserId: l.provider_ref as string,
                    action: 'view_user'
                };
            }

            if (l.template_key === 'event_join_request') {
                try {
                    const data = JSON.parse(l.provider_ref || '{}');
                    const bStatus = bookingStatusMap.get(`${data.eventId}:${data.requesterId}`);
                    // If booking is confirmed or waitlisted, consider it acted. Otherwise pending.
                    const acted = (bStatus === 'confirmed' || bStatus === 'waitlisted') ? 'accepted' : (bStatus === 'cancelled' || bStatus === 'declined' ? 'declined' : null);
                    
                    return {
                        ...baseNotif,
                        type: 'registration',
                        title: 'Event Join Request',
                        message: `<b>${data.requesterName || "Someone"}</b> requested to join <b>${data.eventTitle || "an event"}</b>.`,
                        eventId: data.eventId,
                        action: 'event_request',
                        metadata: { acted, answers: data.answers || {}, questionLabels: data.questionLabels || {} }
                    };
                } catch (e) {
                    return { ...baseNotif, type: 'system', title: 'System', message: 'Invalid data' };
                }
            }

            if (l.template_key === 'group_new_post' || l.template_key === 'group_post_activity') {
                const groupId = forumPostsMap.get(l.provider_ref as string);
                const verb = l.template_key === 'group_new_post' ? 'posted' : 'replied';
                return {
                    ...baseNotif,
                    type: l.template_key,
                    title: 'Group Activity',
                    message: `Someone ${verb} in a group discussion.`,
                    groupId: groupId,
                    postId: l.provider_ref as string,
                    action: 'view'
                };
            }

            if (l.template_key.startsWith('event_reminder_')) {
                const evTitle = reminderEventsMap.get(l.provider_ref as string) || "An event";
                return {
                    ...baseNotif,
                    type: 'event',
                    title: 'Event Reminder',
                    message: `<b>${evTitle}</b> is starting soon!`,
                    eventId: l.provider_ref as string,
                    action: 'view_event'
                };
            }

            if (l.template_key === 'event_cancelled' || l.template_key === 'event_completed') {
                const evTitle = genericEventsMap.get(l.provider_ref as string) || "An event";
                const actionVerb = l.template_key === 'event_cancelled' ? 'cancelled' : 'completed';
                return {
                    ...baseNotif,
                    type: 'system',
                    title: `Event ${actionVerb}`,
                    message: `<b>${evTitle}</b> has been ${actionVerb}.`,
                    eventId: l.provider_ref as string,
                    action: 'view_event'
                };
            }
            
            // Generic JSON parsed message (fallback for custom ones like registration_approved, host_announcement etc.)
            let parsed = {} as any;
            try {
                parsed = JSON.parse(l.provider_ref || '{}');
            } catch(e) {}
            
            let message = parsed.text || parsed.message || 'New notification';
            let title = 'Notification';
            
            // Map types based on template_key if possible
            let type = 'system';
            let action = 'view';
            
            if (l.template_key === 'registration_approved') { type = 'registration'; action = 'view_event'; title = 'Registration Approved'; }
            if (l.template_key === 'registration_rejected') { type = 'registration'; action = 'view_event'; title = 'Registration Rejected'; }
            if (l.template_key === 'waitlist_promoted') { type = 'registration'; action = 'view_event'; title = 'Waitlist Promotion'; }
            if (l.template_key === 'host_announcement') { type = 'system'; action = 'view_event'; title = 'Announcement'; }
            if (l.template_key === 'capacity_increased') { type = 'registration'; action = 'view_event'; title = 'Capacity Increased'; }
            if (l.template_key === 'waitlist_closed') { type = 'system'; action = 'view_event'; title = 'Waitlist Closed'; }
            
            // Handle existing generic group.notification formats if any
            if (parsed.type) type = parsed.type;
            if (parsed.action) action = parsed.action;
            
            return {
                ...baseNotif,
                type,
                title,
                message,
                action,
                eventId: parsed.eventId,
                groupId: parsed.groupId,
                postId: parsed.postId,
                metadata: parsed
            };
        });

        const payload: NotificationPayload = {
            version: 1,
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
            generatedAt: new Date().toISOString()
        };

        return payload;
    }

    static async syncUser(userId: string, io: any): Promise<void> {
        if (!userId || !io) return;
        try {
            const payload = await this.buildPayload(userId);
            io.of('/groups').to(`user_${userId}`).emit('notifications_updated', payload);
        } catch (error) {
            console.error(`Failed to sync user ${userId} notifications:`, error);
        }
    }

    static async syncUsers(userIds: string[], io: any): Promise<void> {
        if (!userIds || !io || userIds.length === 0) return;
        const unique = [...new Set(userIds)];
        await Promise.all(unique.map(id => this.syncUser(id, io)));
    }
}
