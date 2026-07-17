import { NotificationPreferenceType } from '@prisma/client';

export interface NotificationDefinition {
  type: NotificationPreferenceType;
  defaultEnabled: boolean;
  critical: boolean;
}

export const NotificationDefinitions: Record<NotificationPreferenceType, NotificationDefinition> = {
  [NotificationPreferenceType.MESSAGE_RECEIVED]: {
    type: NotificationPreferenceType.MESSAGE_RECEIVED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.TICKET_BOOKED]: {
    type: NotificationPreferenceType.TICKET_BOOKED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.TICKET_CONFIRMED]: {
    type: NotificationPreferenceType.TICKET_CONFIRMED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.WAITLIST_UPDATES]: {
    type: NotificationPreferenceType.WAITLIST_UPDATES,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.CAPACITY_UPDATES]: {
    type: NotificationPreferenceType.CAPACITY_UPDATES,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.JOIN_REQUESTS]: {
    type: NotificationPreferenceType.JOIN_REQUESTS,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.MEMBERSHIP_APPROVED]: {
    type: NotificationPreferenceType.MEMBERSHIP_APPROVED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.MEMBERSHIP_DECLINED]: {
    type: NotificationPreferenceType.MEMBERSHIP_DECLINED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.REGISTRATION_APPROVED]: {
    type: NotificationPreferenceType.REGISTRATION_APPROVED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.REGISTRATION_DECLINED]: {
    type: NotificationPreferenceType.REGISTRATION_DECLINED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_REMINDER_24H]: {
    type: NotificationPreferenceType.EVENT_REMINDER_24H,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_REMINDER_1H]: {
    type: NotificationPreferenceType.EVENT_REMINDER_1H,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_UPDATED]: {
    type: NotificationPreferenceType.EVENT_UPDATED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_CANCELLED]: {
    type: NotificationPreferenceType.EVENT_CANCELLED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_COMPLETED]: {
    type: NotificationPreferenceType.EVENT_COMPLETED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.HOST_ANNOUNCEMENTS]: {
    type: NotificationPreferenceType.HOST_ANNOUNCEMENTS,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.NEW_GROUP_EVENTS]: {
    type: NotificationPreferenceType.NEW_GROUP_EVENTS,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.NEW_DISCUSSION_POSTS]: {
    type: NotificationPreferenceType.NEW_DISCUSSION_POSTS,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.DISCUSSION_REPLIES]: {
    type: NotificationPreferenceType.DISCUSSION_REPLIES,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.CONNECTION_ACCEPTED]: {
    type: NotificationPreferenceType.CONNECTION_ACCEPTED,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_JOIN_REQUESTS]: {
    type: NotificationPreferenceType.EVENT_JOIN_REQUESTS,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.SYSTEM_INVITE]: {
    type: NotificationPreferenceType.SYSTEM_INVITE,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.GROUP_INVITE]: {
    type: NotificationPreferenceType.GROUP_INVITE,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.EVENT_CHECKIN]: {
    type: NotificationPreferenceType.EVENT_CHECKIN,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.SUBSCRIPTION_EXPIRING]: {
    type: NotificationPreferenceType.SUBSCRIPTION_EXPIRING,
    defaultEnabled: true,
    critical: false,
  },
  [NotificationPreferenceType.SUBSCRIPTION_ACTIVE]: {
    type: NotificationPreferenceType.SUBSCRIPTION_ACTIVE,
    defaultEnabled: true,
    critical: false,
  },
};
