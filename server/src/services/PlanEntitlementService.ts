import prisma from '../config/prisma';
import { PlanEntitlements, DEFAULT_FREE_ENTITLEMENTS } from '../types/PlanEntitlements';

const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache TTL
const cache = new Map<string, { entitlements: PlanEntitlements; expiresAt: number }>();

export class PlanEntitlementService {
  /**
   * Invalidates cached entitlements for a user.
   */
  static invalidate(userId: string): void {
    cache.delete(userId);
  }

  /**
   * Clears the entire entitlement cache.
   */
  static clearCache(): void {
    cache.clear();
  }

  /**
   * Fetches active plan entitlements for the given user, with a local cache.
   */
  static async getEntitlements(userId: string): Promise<PlanEntitlements> {
    const now = Date.now();
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.entitlements;
    }

    try {
      const userEntity = await prisma.entities.findFirst({
        where: { user_id: userId, entity_type: 'user' }
      });

      const activeSub = userEntity ? await prisma.subscriptions.findFirst({
        where: {
          owner_entity_id: userEntity.id,
          state: 'active',
          valid_from: { lte: new Date() },
          OR: [
            { valid_to: null },
            { valid_to: { gte: new Date() } }
          ]
        },
        include: {
          plans: true
        }
      }) : null;

      let entitlements = DEFAULT_FREE_ENTITLEMENTS;
      let dbEntitlements: any = null;

      if (activeSub && activeSub.plans && activeSub.plans.entitlements) {
        dbEntitlements = activeSub.plans.entitlements;
      } else {
        const defaultAdminPlan = await prisma.admin_subscription_plans.findFirst({
          where: { is_default: true, is_active: true }
        }) || await prisma.admin_subscription_plans.findFirst({
          where: { name: 'free', is_active: true }
        });
        if (defaultAdminPlan) {
          dbEntitlements = defaultAdminPlan.limits || defaultAdminPlan.features;
        }
      }

      if (dbEntitlements) {
        const entObj = dbEntitlements as any;
        entitlements = {
          group_max_groups: typeof entObj.group_max_groups === 'number' ? entObj.group_max_groups : DEFAULT_FREE_ENTITLEMENTS.group_max_groups,
          group_allowed_visibility: Array.isArray(entObj.group_allowed_visibility) ? entObj.group_allowed_visibility : DEFAULT_FREE_ENTITLEMENTS.group_allowed_visibility,
          group_allowed_join_modes: Array.isArray(entObj.group_allowed_join_modes) ? entObj.group_allowed_join_modes : DEFAULT_FREE_ENTITLEMENTS.group_allowed_join_modes,
          group_max_capacity: typeof entObj.group_max_capacity === 'number' ? entObj.group_max_capacity : DEFAULT_FREE_ENTITLEMENTS.group_max_capacity,
          group_can_restricted_access: typeof entObj.group_can_restricted_access === 'boolean' ? entObj.group_can_restricted_access : DEFAULT_FREE_ENTITLEMENTS.group_can_restricted_access,
          event_allowed_registration_modes: Array.isArray(entObj.event_allowed_registration_modes) ? entObj.event_allowed_registration_modes : DEFAULT_FREE_ENTITLEMENTS.event_allowed_registration_modes,
          event_allowed_visibility: Array.isArray(entObj.event_allowed_visibility) ? entObj.event_allowed_visibility : DEFAULT_FREE_ENTITLEMENTS.event_allowed_visibility,
          event_max_participants: typeof entObj.event_max_participants === 'number' ? entObj.event_max_participants : DEFAULT_FREE_ENTITLEMENTS.event_max_participants,
          event_checkin_methods: Array.isArray(entObj.event_checkin_methods) ? entObj.event_checkin_methods : DEFAULT_FREE_ENTITLEMENTS.event_checkin_methods,
          event_can_create_paid_tickets: typeof entObj.event_can_create_paid_tickets === 'boolean' ? entObj.event_can_create_paid_tickets : DEFAULT_FREE_ENTITLEMENTS.event_can_create_paid_tickets,
        };
      }

      cache.set(userId, {
        entitlements,
        expiresAt: now + CACHE_TTL_MS
      });

      return entitlements;
    } catch (error) {
      console.error('[PlanEntitlementService] Error fetching entitlements:', error);
      // Attempt dynamic default fallback even on error
      try {
        const defaultAdminPlan = await prisma.admin_subscription_plans.findFirst({
          where: { is_default: true, is_active: true }
        });
        if (defaultAdminPlan && (defaultAdminPlan.limits || defaultAdminPlan.features)) {
          return (defaultAdminPlan.limits || defaultAdminPlan.features) as any;
        }
      } catch (innerErr) {}
      return DEFAULT_FREE_ENTITLEMENTS;
    }
  }

  /**
   * Checks if user has standard plan (active plan that is not free/fallback)
   */
  static async getUserPlan(userId: string): Promise<string> {
    try {
      const userEntity = await prisma.entities.findFirst({
        where: { user_id: userId, entity_type: 'user' }
      });
      if (!userEntity) {
        const defaultAdminPlan = await prisma.admin_subscription_plans.findFirst({
          where: { is_default: true, is_active: true }
        }) || await prisma.admin_subscription_plans.findFirst({
          where: { name: 'free', is_active: true }
        });
        return defaultAdminPlan?.name || 'free';
      }

      const activeSub = await prisma.subscriptions.findFirst({
        where: {
          owner_entity_id: userEntity.id,
          state: 'active',
          valid_from: { lte: new Date() },
          OR: [
            { valid_to: null },
            { valid_to: { gte: new Date() } }
          ]
        },
        include: {
          plans: true
        }
      });

      if (activeSub && activeSub.plans) {
        return activeSub.plans.key;
      }
      
      const defaultAdminPlan = await prisma.admin_subscription_plans.findFirst({
        where: { is_default: true, is_active: true }
      }) || await prisma.admin_subscription_plans.findFirst({
        where: { name: 'free', is_active: true }
      });
      return defaultAdminPlan?.name || 'free';
    } catch (e) {
      return 'free';
    }
  }

  static async checkGroupVisibility(userId: string, visibility: string): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
    // visibility in DB can be public/private. Private corresponds to "unlisted" if listed=false.
    // Wait, let's normalise visibility values. The database supports: public, private.
    // Let's check matching.
    const normalized = visibility.toLowerCase();
    return ents.group_allowed_visibility.includes(normalized);
  }

  static async checkGroupJoinMode(userId: string, joinMode: string): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
    return ents.group_allowed_join_modes.includes(joinMode);
  }

  static async checkGroupCapacity(userId: string, capacity: number): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
    if (ents.group_max_capacity === -1) return true;
    return capacity <= ents.group_max_capacity;
  }

  static async checkEventRegistrationMode(userId: string, mode: string): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
    return ents.event_allowed_registration_modes.includes(mode);
  }

  static async checkEventVisibility(userId: string, visibility: string): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
    return ents.event_allowed_visibility.includes(visibility);
  }

  static async checkMaxParticipants(userId: string, count: number): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
    if (ents.event_max_participants === -1) return true;
    return count <= ents.event_max_participants;
  }
}
