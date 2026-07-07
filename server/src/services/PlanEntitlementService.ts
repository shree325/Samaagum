import prisma from '../config/prisma';
import { PlanEntitlements, DEFAULT_FREE_ENTITLEMENTS } from '../types/PlanEntitlements';
import { R_entities } from '../repositories/R_entities';
import { R_subscriptions } from '../repositories/R_subscriptions';
import { R_plans } from '../repositories/R_plans';
import { R_adminSubscriptionPlans } from '../repositories/R_adminSubscriptionPlans';
import { R_subscriptionOrders } from '../repositories/R_subscriptionOrders';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { R_roles } from '../repositories/R_roles';
import { R_roleAssignments } from '../repositories/R_roleAssignments';

const entitiesRepo = new R_entities(prisma);
const subscriptionsRepo = new R_subscriptions();
const plansRepo = new R_plans();
const adminSubscriptionPlansRepo = new R_adminSubscriptionPlans();
const subscriptionOrdersRepo = new R_subscriptionOrders();
const adminRolesRepo = new R_adminRoles();
const rolesRepo = new R_roles();
const roleAssignmentsRepo = new R_roleAssignments();

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
   * Automatically detects and transitions expired subscriptions to default/free plan.
   */
  static async processExpirations(userId: string): Promise<void> {
    try {
      const userEntity = await entitiesRepo.getUserEntity(userId);
      if (!userEntity) return;

      // Find any active subscriptions that have expired (valid_to is in the past)
      const expiredSubs = await subscriptionsRepo.getExpiredActiveSubscriptions(userEntity.id!);
      if (expiredSubs.length === 0) return;

      console.log(`[PlanEntitlementService] Found ${expiredSubs.length} expired subscriptions for user ${userId}. Processing downgrade...`);

      // 1. Mark subscriptions as expired
      const expiredSubIds = expiredSubs.map(s => s.id);
      await subscriptionsRepo.updateState(expiredSubIds, 'expired');

      // 2. Mark corresponding completed subscription orders as expired
      const planIds = expiredSubs.map(s => s.plans.id);
      const planKeys = await plansRepo.getPlanKeys(planIds);
      const adminPlanIds = await adminSubscriptionPlansRepo.getIdsByNames(planKeys);

      await subscriptionOrdersRepo.updateActiveOrdersState(userId, adminPlanIds, 'expired');

      // 3. Find default/free plan configuration
      const defaultAdminPlan = await adminSubscriptionPlansRepo.getDefaultOrByName('free');
      if (!defaultAdminPlan) {
        console.error(`[PlanEntitlementService] No default plan found during expiration cleanup!`);
        return;
      }

      // 4. Assign default plan role/entitlements
      let defaultRoleId: string | null = null;
      if (defaultAdminPlan.rbac_auto_assign && defaultAdminPlan.rbac_role_id) {
        const adminRole = await adminRolesRepo.getById(defaultAdminPlan.rbac_role_id);
        if (adminRole) {
          const roleRecord = await rolesRepo.findByKey(adminRole.name);
          if (roleRecord) {
            defaultRoleId = roleRecord.role_id || null;
          }
        }
      }

      if (!defaultRoleId) {
        // Fallback to free_user role
        const fallbackRole = await rolesRepo.findByKey('free_user') || await rolesRepo.findByKey('member');
        if (fallbackRole) {
          defaultRoleId = fallbackRole.role_id || null;
        }
      }


      if (defaultRoleId) {
        // Remove old platform role assignments
        await roleAssignmentsRepo.deletePlatformRoleAssignments(userId);

        // Assign the default role
        const tenantId = userEntity.tenant_id || '00000000-0000-0000-0000-000000000000';
        await roleAssignmentsRepo.assignPlatformRole(tenantId, userId, defaultRoleId);
        console.log(`[PlanEntitlementService] User ${userId} successfully transitioned to default role: ${defaultRoleId}`);
      }

      // 5. Invalidate client-side & server-side cache
      this.invalidate(userId);

      // 6. Broadcast real-time socket events for entitlements.updated and subscription.activated
      try {
        const { sendNotificationToUser } = require('./messagingSocket');
        sendNotificationToUser(userId, 'entitlements.updated', {
          planName: defaultAdminPlan.display_name,
          entitlements: defaultAdminPlan.limits || defaultAdminPlan.features || {}
        });
        sendNotificationToUser(userId, 'subscription.activated', {
          status: 'expired',
          planName: defaultAdminPlan.display_name
        });
      } catch (err) {
        console.error(`[PlanEntitlementService] Failed to send real-time socket events for subscription expiration:`, err);
      }

    } catch (e) {
      console.error(`[PlanEntitlementService] Error processing expirations for user ${userId}:`, e);
    }
  }

  /**
   * Fetches active plan entitlements for the given user, with a local cache.
   */
  static async getEntitlements(userId: string): Promise<PlanEntitlements> {
    // Process expirations dynamically in real-time
    await this.processExpirations(userId);

    const now = Date.now();
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.entitlements;
    }

    try {
      const userEntity = await entitiesRepo.getUserEntity(userId);
      const activeSub = userEntity ? await subscriptionsRepo.getActiveSubscription(userEntity.id!) : null;

      let entitlements = DEFAULT_FREE_ENTITLEMENTS;
      let dbEntitlements: any = null;

      if (activeSub && activeSub.plans && activeSub.plans.entitlements) {
        dbEntitlements = activeSub.plans.entitlements;
      } else {
        const defaultAdminPlan = await adminSubscriptionPlansRepo.getDefaultOrByName('free');
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
        const defaultAdminPlan = await adminSubscriptionPlansRepo.getDefaultOrByName('free');
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
    // Process expirations dynamically in real-time
    await this.processExpirations(userId);

    try {
      const userEntity = await entitiesRepo.getUserEntity(userId);
      if (!userEntity) {
        const defaultAdminPlan = await adminSubscriptionPlansRepo.getDefaultOrByName('free');
        return defaultAdminPlan?.name || 'free';
      }

      const activeSub = await subscriptionsRepo.getActiveSubscription(userEntity.id!);
      if (activeSub && activeSub.plans) {
        return activeSub.plans.key;
      }
      
      const defaultAdminPlan = await adminSubscriptionPlansRepo.getDefaultOrByName('free');
      return defaultAdminPlan?.name || 'free';
    } catch (e) {
      return 'free';
    }
  }

  static async checkGroupVisibility(userId: string, visibility: string): Promise<boolean> {
    const ents = await this.getEntitlements(userId);
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
