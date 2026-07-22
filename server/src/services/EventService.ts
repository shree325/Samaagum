// @ts-nocheck
import { R_events } from '../repositories/R_events';
import { R_ticket_types } from '../repositories/R_ticket_types';
import { R_wishlists } from '../repositories/R_wishlists';
import { R_forumPosts } from '../repositories/R_forumPosts';
import { R_forumComments } from '../repositories/R_forumComments';
import { R_forum_reactions } from '../repositories/R_forum_reactions';
import { R_forum_votes } from '../repositories/R_forum_votes';
import { R_forum_tags } from '../repositories/R_forum_tags';
import { R_forum_post_tags } from '../repositories/R_forum_post_tags';
import { R_users } from '../repositories/R_users';
import prisma from '../config/prisma';
import { RealtimeGateway } from './realtimeGateway';
import { TicketRealtimeService } from './TicketRealtimeService';
import accessControlService from './AccessControlService';
import { sendNotificationToUser, broadcastWishlistUpdate } from './messagingSocket';
import { PlanEntitlementService } from './PlanEntitlementService';
import { GroupService } from './GroupService';
import { R_cityControls } from '../repositories/R_cityControls';

export class EventService {
  private static eventsRepo = new R_events(prisma);
  private static ticketTypesRepo = new R_ticket_types(prisma);
  private static forumPostsRepo = new R_forumPosts();
  private static forumCommentsRepo = new R_forumComments();
  private static postTagsRepo = new R_forum_post_tags();
  private static tagsRepo = new R_forum_tags();
  private static votesRepo = new R_forum_votes();
  private static reactionsRepo = new R_forum_reactions();
  private static usersRepo = new R_users(prisma);
  private static wishlistRepo = new R_wishlists(prisma);
  private static cityControlsRepo = new R_cityControls();

  private static getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Validates event creation and update parameters against user plan entitlements.
   */
  static async validateEventEntitlements(userId: string, eventData: any) {
    const ents = await PlanEntitlementService.getEntitlements(userId);

    // 1. Max participants limit
    const settings = eventData.settings || {};
    const capacity = settings.capacity || {};
    let capacityTotal = eventData.capacity_total !== undefined ? eventData.capacity_total : eventData.capacity;
    if (ents.event_max_participants !== -1) {
      if (capacity.limit === true && capacity.max > ents.event_max_participants) {
        throw new Error(`Your plan limits event capacity to a maximum of ${ents.event_max_participants} participants.`);
      }
      if (capacity.limit !== true && (!capacityTotal || capacityTotal > ents.event_max_participants)) {
        if (!eventData.settings) eventData.settings = {};
        if (!eventData.settings.capacity) eventData.settings.capacity = {};
        eventData.settings.capacity.limit = true;
        eventData.settings.capacity.max = ents.event_max_participants;
        eventData.capacity_total = ents.event_max_participants;
      }
    }

    // 2. Event type (registration mode and payment options)
    const currentMode = eventData.cash_enabled ? 'cash' : (eventData.registration_mode === 'paid' ? 'paid' : 'free');
    if (!(ents.event_allowed_registration_modes || []).includes(currentMode)) {
      throw new Error(`The registration/payment mode "${currentMode === 'free' ? 'free RSVP' : currentMode}" is locked for your current plan.`);
    }
    const isPaid = eventData.registration_mode === 'paid' || !!eventData.price;
    if (isPaid && !ents.event_can_create_paid_tickets) {
      throw new Error('Paid events are locked for your current plan. Upgrade to Standard to sell tickets.');
    }

    // 3. Event visibility and join eligibility checks
    const visibilityVal = eventData.venue && typeof eventData.venue === 'object' ? eventData.venue.visibility : undefined;
    const metaVal = eventData.venue && typeof eventData.venue === 'object' ? eventData.venue.meta : undefined;
    const joinEligibilityVal = metaVal && typeof metaVal === 'object' ? metaVal.joinEligibility : undefined;

    // Check visibility
    if (visibilityVal) {
      if (visibilityVal === 'public' && !ents.event_allowed_visibility.includes('public')) {
        throw new Error('Public event visibility is locked for your current plan.');
      }
      if (visibilityVal === 'unlisted' && !ents.event_allowed_visibility.includes('unlisted')) {
        throw new Error('Unlisted event visibility is locked for your current plan.');
      }
      if (visibilityVal === 'custom' && !ents.event_allowed_visibility.includes('custom')) {
        throw new Error('Custom Access event visibility is locked for your current plan.');
      }
    }

    // Check join eligibility / join modes
    if (joinEligibilityVal) {
      if (joinEligibilityVal === 'public' && !(ents.event_allowed_join_modes || []).includes('public')) {
        throw new Error('Public join eligibility is locked for your current plan.');
      }
      if (joinEligibilityVal === 'restricted' && !(ents.event_allowed_join_modes || []).includes('restricted')) {
        throw new Error('Restricted join eligibility is locked for your current plan.');
      }
      if (joinEligibilityVal === 'invite' && !(ents.event_allowed_join_modes || []).includes('invite')) {
        throw new Error('Invite-only join eligibility is locked for your current plan.');
      }
    }

    // 4. Ticket check-in check
    const checkinMethod = eventData.checkin_method;
    if (checkinMethod && ents.event_checkin_methods && !ents.event_checkin_methods.includes(checkinMethod)) {
      throw new Error(`The selected check-in method (${checkinMethod}) is not available on your plan.`);
    }

    // 5. Verify user has permission to host as the selected entity (RBAC)
    await this.validateHostPermission(userId, eventData.host_entity_id);
  }

  private static async validateEventLocation(eventData: any) {
    if (eventData.status === 'draft') return;
    // Ensure location is provided for all events
    const hasVenue = eventData.venue && (typeof eventData.venue === 'string' ? eventData.venue.trim() !== '' : true);
    if (!hasVenue) {
      throw new Error('Location is required');
    }

    if (eventData.venue) {
      let venueStr = '';
      if (typeof eventData.venue === 'string') {
        venueStr = eventData.venue;
      } else if (eventData.venue.name) {
        venueStr = eventData.venue.name;
      }

      if (venueStr) {
        const venueLower = venueStr.toLowerCase();
        const inactiveCities = await prisma.city_controls.findMany({
          where: { is_active: false },
          select: { city_name: true }
        });

        const matched = inactiveCities.find(c => venueLower.includes(c.city_name.toLowerCase()));
        if (matched) {
          throw new Error(`The location '${matched.city_name}' is currently inactive and cannot be selected for events.`);
        }
      }
    }
  }

  private static async validateHostPermission(userId: string, hostEntityId: string) {
    // User creating their own personal event (standalone)
    if (!hostEntityId || hostEntityId === 'standalone') {
      return; // OK
    }

    const entity = await prisma.entities.findUnique({
      where: { id: hostEntityId },
      select: { entity_type: true, user_id: true }
    });

    if (!entity) {
      throw new Error('Invalid host entity');
    }

    // User can host as their own personal entity
    if (entity.entity_type === 'user' && entity.user_id === userId) {
      return; // OK
    }

    // User must be group owner OR have group.manage capability to host as a group
    if (entity.entity_type === 'group') {
      const isGroupOwner = entity.user_id === userId;
      if (isGroupOwner) return; // OK - user owns the group

      // Check if user has group.manage or group.create_events capability
      const hasCapability = await this.hasGroupManageCapability(userId, hostEntityId);
      if (!hasCapability) {
        throw new Error('You do not have permission to create events for this group');
      }
      return; // OK
    }

    // Similar checks for community (future extension)
    if (entity.entity_type === 'community') {
      throw new Error('Community event hosting not yet supported');
    }

    throw new Error('Cannot host as this entity type');
  }

  private static async hasGroupManageCapability(userId: string, groupId: string): Promise<boolean> {
    try {
      const assignment = await prisma.role_assignments.findFirst({
        where: {
          scope_entity_id: groupId,
          user_id: userId,
          state: 'active'
        },
        include: { roles: true }
      });

      if (!assignment || !assignment.roles) return false;

      const capabilities = assignment.roles.baseline_capabilities as string[] || [];
      return capabilities.includes('group.manage') || capabilities.includes('group.create_events');
    } catch (err) {
      return false;
    }
  }

  static async createEvent(userId: string, tenantId: string, body: any) {
    // 0. Enforce plan entitlements before doing any writes
    await this.validateEventEntitlements(userId, body);
    await this.validateEventLocation(body);

    // 1. Resolve hosted_by_entity_id (the user's own entity or chosen group)
    let hostedByEntityId = body.host_entity_id;

    if (!hostedByEntityId || hostedByEntityId === 'standalone') {
      const entityRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM entities WHERE user_id = $1::uuid AND entity_type = 'user' LIMIT 1`,
        userId
      );
      hostedByEntityId = entityRows[0]?.id;

      if (!hostedByEntityId) {
        // Fallback: create a user entity if one does not exist
        const newEntity = await prisma.$queryRawUnsafe<{ id: string }[]>(
          `INSERT INTO entities (tenant_id, entity_type, user_id, status, visibility)
           VALUES ($1::uuid, 'user', $2::uuid, 'active', 'public')
           RETURNING id`,
          tenantId, userId
        );
        hostedByEntityId = newEntity[0].id;
      }
    }

    // 1.5 Handle root-level waitlist flag from create_event frontend
    let finalSettings = body.settings || {};
    if (body.waitlist !== undefined) {
      finalSettings = {
        ...finalSettings,
        capacity: {
          ...(finalSettings.capacity || {}),
          waitlist: body.waitlist
        }
      };
    }

    // Mirror capacity_total into settings.capacity.{limit,max} so reconcileWaitlist
    // and promoteFromWaitlist can read the limit without needing body.settings.capacity
    if (body.capacity_total !== undefined && body.capacity_total !== null && body.capacity_total > 0) {
      finalSettings = {
        ...finalSettings,
        capacity: {
          ...(finalSettings.capacity || {}),
          limit: true,
          max: body.capacity_total
        }
      };
    }

    // 2. Perform transactional event + tickets creation
    const event = await this.eventsRepo.create({
      tenant_id: tenantId,
      hosted_by_entity_id: hostedByEntityId,
      title: body.title,
      description: body.description,
      status: body.status || 'published',
      starts_at: body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at ? new Date(body.ends_at) : null,
      venue_timezone: body.venue_timezone,
      location_type: body.location_type,
      venue: body.venue,
      online_link: body.online_link,
      capacity_total: body.capacity_total,
      registration_mode: body.registration_mode === 'free' ? 'free_rsvp' : (body.registration_mode || 'free_rsvp'),
      approval_required: body.approval_required || false,
      cash_enabled: body.cash_enabled || false,
      instruction: body.instruction,
      payment_instructions: body.payment_instructions,
      payment_hold_hours: body.payment_hold_hours,
      registration_status: body.registration_status,
      registration_opens_at: body.registration_opens_at ? new Date(body.registration_opens_at) : null,
      registration_closes_at: body.registration_closes_at ? new Date(body.registration_closes_at) : null,
      settings: Object.keys(finalSettings).length > 0 ? finalSettings : null,
    });

    const tickets = body.tickets || [];
    const createdTickets = [];

    for (const t of tickets) {
      const ticketType = await this.ticketTypesRepo.create({
        tenant_id: tenantId,
        event_id: event.id!,
        name: t.name,
        description: t.description || null,
        price_minor: t.price_minor || 0,
        currency: t.currency || 'INR',
        capacity: t.capacity || null,
        max_per_booking: t.max_per_booking ? parseInt(t.max_per_booking) : null,
        sale_start_at: t.sale_start ? new Date(t.sale_start) : null,
        sale_end_at: t.sale_end ? new Date(t.sale_end) : null,
        visibility: t.visibility || 'public',
        quantity_sold: 0,
        is_active: true,
        status: 'active',
        sort_order: t.sort_order || 0,
        created_by: userId,
        updated_by: userId,
      });
      createdTickets.push(ticketType);
    }

    if (hostedByEntityId) {
      const entity = await prisma.entities.findUnique({ where: { id: hostedByEntityId } });
      if (entity && entity.entity_type === 'group') {
        const group = await prisma.groups.findFirst({ where: { entity_id: hostedByEntityId } });
        if (group) {
          const activeMemberships = await prisma.group_memberships.findMany({
            where: { group_id: hostedByEntityId, state: 'active' }
          });

          const userIds = new Set<string>();
          if (entity.user_id) userIds.add(entity.user_id);
          activeMemberships.forEach(m => userIds.add(m.user_id));
          // Notify everyone including the creator, as per user requirement

          if (userIds.size > 0) {
            const { notificationService } = require('./NotificationService');
            for (const memberId of userIds) {
              try {
                const canDeliver = await notificationService.shouldDeliverByTemplateKey(memberId, 'group_event_created');
                if (!canDeliver) continue;

                sendNotificationToUser(memberId, 'group.notification', {
                  type: 'group_event_created',
                  title: 'New Group Event',
                  text: `A new event '${event.title}' was created in ${group.name}`,
                  link: `/event/${event.id}`
                });

                await prisma.notification_log.create({
                  data: {
                    user_id: memberId,
                    tenant_id: tenantId,
                    channel: 'in-app',
                    template_key: 'group_event_created',
                    status: 'unread',
                    message: `A new event '${event.title}' was created in ${group.name}`,
                    actor_id: userId,
                    provider_ref: JSON.stringify({
                      eventId: event.id,
                      groupId: group.id,
                      groupName: group.name,
                      eventTitle: event.title
                    })
                  }
                });
              } catch (err) {
                console.error(`Failed to notify member ${memberId} of new event in group ${group.id}:`, err);
              }
            }
          }
        }
      }
    }

    return { event, tickets: createdTickets };
  }

  // Resolves an entity_id (from events.hosted_by_entity_id) into a display name/type so the
  // client can render "Hosted by <name>" instead of only having the raw UUID.
  static async resolveHostInfo(hostedByEntityId: string | null | undefined): Promise<{ hostType: string | null; hostName: string | null; hostUserId: string | null; hostPhoto: string | null; hostBanner: string | null }> {
    if (!hostedByEntityId) return { hostType: null, hostName: null, hostUserId: null, hostPhoto: null, hostBanner: null };
    const rows = await prisma.$queryRawUnsafe<{ entity_type: string; user_id: string | null; group_name: string | null; user_display_name: string | null; first_name: string | null; last_name: string | null; primary_email: string | null; user_profile_image: any | null; profile_profile_image: any | null; group_icon: any | null; group_icon_string: string | null; group_banner: any | null; group_banner_string: string | null; user_cover: any | null }[]>(
      `SELECT e.entity_type, e.user_id, g.name as group_name, p.display_name as user_display_name, p.first_name, p.last_name, u.primary_email, 
              u.profile_image_data as user_profile_image, p.profile_image_data as profile_profile_image, g.icon_data as group_icon, g.icon as group_icon_string, g.banner_data as group_banner, g.banner as group_banner_string, p.cover_image_data as user_cover
       FROM entities e
       LEFT JOIN groups g ON g.entity_id = e.id
       LEFT JOIN users u ON u.id = e.user_id
       LEFT JOIN profiles p ON p.user_id = e.user_id
       WHERE e.id = $1::uuid
       LIMIT 1`,
      hostedByEntityId
    );
    const row = rows[0];
    if (!row) return { hostType: null, hostName: null, hostUserId: null, hostPhoto: null };

    if (!row) return { hostType: null, hostName: null, hostUserId: null, hostPhoto: null, hostBanner: null };
    
    let hostPhoto: string | null = null;
    if (row.entity_type === 'group') {
      if (row.group_banner) {
        hostPhoto = `data:image/jpeg;base64,${Buffer.from(row.group_banner).toString('base64')}`;
      } else if (row.group_banner_string) {
        hostPhoto = row.group_banner_string;
      } else if (row.group_icon) {
        hostPhoto = `data:image/jpeg;base64,${Buffer.from(row.group_icon).toString('base64')}`;
      } else {
        hostPhoto = row.group_icon_string;
      }
    } else if (row.entity_type === 'user') {
      const imgData = row.user_profile_image || row.profile_profile_image;
      if (imgData) {
        hostPhoto = `data:image/jpeg;base64,${Buffer.from(imgData).toString('base64')}`;
      }
    }

    let hostBanner: string | null = null;
    if (row.entity_type === 'group' && row.group_banner) {
      hostBanner = `data:image/jpeg;base64,${Buffer.from(row.group_banner).toString('base64')}`;
    } else if (row.entity_type === 'user' && row.user_cover) {
      hostBanner = `data:image/jpeg;base64,${Buffer.from(row.user_cover).toString('base64')}`;
    }

    let hostName: string | null = null;
    if (row.entity_type === 'group') {
      hostName = row.group_name;
    } else {
      hostName = row.user_display_name || 
                 (row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.first_name) || 
                 (row.primary_email ? row.primary_email.split('@')[0] : null) || 
                 "Organizer";
    }

    return {
      hostType: row.entity_type,
      hostName,
      hostUserId: row.user_id,
      hostPhoto,
      hostBanner
    };
  }

  // Visibility helpers -------------------------------------------------
  // venue.visibility: 'public' | 'unlisted' | 'custom'
  // venue.meta.selectedAccess.restricted.groups: string[] of group ids/names allowed for 'custom'
  //
  // 'unlisted' events are never listed on Discover and are only directly reachable via a
  // one-time invite link (handled at the route layer) or by hosts/co-hosts/already-joined users.
  // 'custom' events are restricted to selected groups (plus hosts/co-hosts/already-joined users).
  /**
   * Determines whether a user can view a given event.
   *
   * Two modes:
   *
   * **Discovery mode** (`discoveryMode: true`) — used for home feed, recommended
   * events, and search.  Answers "should this event appear in the user's feed?"
   * Only current, **active** group membership is considered.  A booking that
   * was made when the user was still a member does NOT grant discovery rights
   * after they leave the group.  This ensures leaving a group immediately
   * removes that group's private events from the user's feed.
   *
   * **Access mode** (`discoveryMode: false`, the default) — used for direct
   * event detail pages.  If the user already has a confirmed booking they can
   * still view the event page even after leaving the group.
   *
   * @param ev             - The event row (venue may be a JSON string or object).
   * @param userId         - Optional authenticated user id.
   * @param userGroupSet   - Optional pre-fetched set of active group ids for the
   *                         user (avoids N+1 DB calls when checking many events).
   *                         When omitted the function falls back to individual queries.
   * @param discoveryMode  - When true, skips the booking bypass so only current
   *                         group membership grants visibility. Defaults to false.
   */
  public static async canUserAccessEvent(
    ev: any,
    userId?: string,
    userGroupSet?: Set<string>,
    discoveryMode = false
  ): Promise<boolean> {
    // Robustly parse venue — it may be stored as a JSON string or as an object
    const venueObj: any =
      ev.venue == null
        ? {}
        : typeof ev.venue === 'string'
        ? (() => { try { return JSON.parse(ev.venue); } catch { return {}; } })()
        : ev.venue;

    const visibility = venueObj?.visibility;

    // Public events are always discoverable / accessible
    if (!visibility || visibility === 'public') return true;

    // Unlisted and custom events require an authenticated user
    if (!userId) return false;

    // Hosts and co-hosts always have access (and are discoverable) regardless of mode
    const isHostOrCoHost = await this.verifyEventCapability(userId, ev.id, 'event.manage').catch(() => false);
    if (isHostOrCoHost) return true;

    // Booking bypass — only for direct access, NOT for discovery.
    // Rationale: a user who left the group shouldn't see the event in their
    // feed just because they once registered while they were a member.
    if (!discoveryMode) {
      const hasBooking = await prisma.bookings.findFirst({
        where: { event_id: ev.id, booker_user_id: userId, status: { in: ['confirmed', 'pending_approval', 'pending_payment'] } }
      });
      if (hasBooking) return true;
    }

    // Check if user is an active member of the group that hosts this event
    if (ev.hosted_by_entity_id) {
      const isGroupMember = userGroupSet
        ? userGroupSet.has(ev.hosted_by_entity_id)
        : await GroupService.userInGroups(userId, [ev.hosted_by_entity_id]).catch(() => false);
      if (isGroupMember) return true;
    }

    // For 'custom' visibility, also check the explicitly allowed group list
    if (visibility === 'custom') {
      const allowedGroups: string[] = venueObj?.meta?.selectedAccess?.restricted?.groups || [];
      if (allowedGroups.length > 0) {
        const eligible = userGroupSet
          ? allowedGroups.some(gid => userGroupSet.has(gid))
          : await GroupService.userInGroups(userId, allowedGroups).catch(() => false);
        if (eligible) return true;
      }
    }

    return false;
  }

  /**
   * Pre-fetches all active group memberships for a user into a Set.
   * Pass this to `canUserAccessEvent` to avoid N+1 queries when iterating
   * over many events in a single request.
   */
  public static async fetchUserGroupSet(userId: string): Promise<Set<string>> {
    const memberships = await prisma.group_memberships.findMany({
      where: { user_id: userId, state: 'active' },
      select: { group_id: true }
    });
    return new Set(memberships.map((m: any) => m.group_id));
  }

  static async getPublicEvents(tenantId: string, userId?: string, cityQuery?: string) {
    const list = await this.eventsRepo.getByStatus(tenantId, 'published');
    const enrichedList = [];
    for (const ev of list) {
      const visibility = (ev.venue as any)?.visibility;

      let hasAccess = false;
      if (!visibility || visibility === 'public') {
        hasAccess = true;
      } else if (userId) {
        hasAccess = await this.canUserAccessEvent(ev, userId);
      }

      if (visibility === 'unlisted' && !hasAccess) continue;
      if (visibility === 'custom' && !hasAccess) continue;

      const tickets = await this.ticketTypesRepo.getByEventId(ev.id!);
      const ticketsWithRemaining = await Promise.all(tickets.map(async (t) => {
        const sold = await prisma.tickets.count({
          where: {
            booking_line_items: {
              ticket_type_id: t.id,
              bookings: {
                status: { in: ['confirmed', 'pending_approval', 'pending_payment'] }
              }
            }
          }
        });
        return {
          ...t,
          remaining: t.capacity !== null && t.capacity !== undefined ? Math.max(0, t.capacity - sold) : null
        };
      }));
      const hostInfo = await this.resolveHostInfo(ev.hosted_by_entity_id);

      const wishlistCount = await this.wishlistRepo.getCountByEventId(ev.id!);
      const isWishlisted = userId ? await this.wishlistRepo.isWishlisted(ev.id!, userId) : false;
      const waitlistCount = await prisma.bookings.count({ where: { event_id: ev.id!, status: 'waitlisted' } });

      enrichedList.push({ 
        ...ev, 
        tickets: ticketsWithRemaining, 
        ...hostInfo,
        wishlistCount,
        isWishlisted,
        waitlistCount,
        registrationStatus: ev.registration_status,
        registrationOpensAt: ev.registration_opens_at,
        registrationClosesAt: ev.registration_closes_at
      });
    }

    let refCityName = "";
    let refStateName = "";
    let refLat: number | null = null;
    let refLon: number | null = null;

    if (cityQuery && cityQuery !== 'Global') {
      const queryName = cityQuery.split(',')[0].trim();
      const matchedCities = await this.cityControlsRepo.findByCityName(queryName);
      const refLoc = matchedCities.find(c => c.is_active) || matchedCities[0];
      if (refLoc) {
        refCityName = refLoc.city_name;
        refStateName = refLoc.state_name || "";
        refLat = Number(refLoc.latitude);
        refLon = Number(refLoc.longitude);
      }
    }

    const mappedEvents = enrichedList.map(ev => {
      let isSameCity = false;
      let isSameState = false;
      let distance: number | null = null;
      let hasLocation = false;

      const loc = ev.venue as any;
      if (loc) {
        const city = loc.city || loc.address || loc.meta?.city;
        const state = loc.state || loc.meta?.state;
        const lat = loc.lat || loc.meta?.lat;
        const lon = loc.lon || loc.meta?.lon;

        if (city) {
          hasLocation = true;
          if (refCityName && city.toLowerCase().includes(refCityName.toLowerCase())) {
            isSameCity = true;
          }
          if (refStateName && state && state.toLowerCase().includes(refStateName.toLowerCase())) {
            isSameState = true;
          }
          if (refLat !== null && refLon !== null && lat !== undefined && lon !== undefined) {
            distance = this.getDistance(refLat, refLon, Number(lat), Number(lon));
          }
        }
      }

      return { ...ev, _isSameCity: isSameCity, _isSameState: isSameState, _distance: distance, _hasLocation: hasLocation, _createdAt: ev.created_at?.getTime() || 0 };
    });

    if (refCityName) {
      mappedEvents.sort((a, b) => {
        // 1. Same City
        if (a._isSameCity && !b._isSameCity) return -1;
        if (!a._isSameCity && b._isSameCity) return 1;

        // 2. Nearby Cities (by distance)
        if (a._distance !== null && b._distance !== null) return a._distance - b._distance;
        if (a._distance !== null) return -1;
        if (b._distance !== null) return 1;

        // 3. Same State
        if (a._isSameState && !b._isSameState) return -1;
        if (!a._isSameState && b._isSameState) return 1;

        // 4. Remaining Locations
        if (a._hasLocation && !b._hasLocation) return -1;
        if (!a._hasLocation && b._hasLocation) return 1;

        // 5. Fallback: Newest first
        return b._createdAt - a._createdAt;
      });
    }

    return mappedEvents.map(e => {
      const { _isSameCity, _isSameState, _distance, _hasLocation, _createdAt, ...rest } = e;
      return rest;
    });
  }

  static async getUserEvents(userId: string) {
    const entityRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM entities WHERE user_id = $1::uuid AND entity_type = 'user' LIMIT 1`,
      userId
    );
    const userEntityId = entityRows[0]?.id;
    const validHostIds = userEntityId ? [userEntityId] : [];

    const managedGroups = await GroupService.getMyManagedGroups(userId).catch(() => []);
    validHostIds.push(...managedGroups.map((g: any) => g.id));

    const assignments = await prisma.event_team_assignments.findMany({
      where: { user_id: userId, state: 'active' },
      select: { event_id: true }
    });
    const assignedEventIds = assignments.map(a => a.event_id);

    if (validHostIds.length === 0 && assignedEventIds.length === 0) return [];

    const list = await prisma.events.findMany({
      where: {
        OR: [
          ...(validHostIds.length > 0 ? [{ hosted_by_entity_id: { in: validHostIds } }] : []),
          ...(assignedEventIds.length > 0 ? [{ id: { in: assignedEventIds } }] : [])
        ]
      },
      orderBy: { created_at: 'desc' }
    });

    const enrichedList = [];
    for (const ev of list) {
      const tickets = await this.ticketTypesRepo.getByEventId(ev.id);
      const hostInfo = await this.resolveHostInfo(ev.hosted_by_entity_id);

      const wishlistCount = await this.wishlistRepo.getCountByEventId(ev.id);
      const isWishlisted = await this.wishlistRepo.isWishlisted(ev.id, userId);
      const waitlistCount = await prisma.bookings.count({ where: { event_id: ev.id, status: 'waitlisted' } });
      
      let userWaitlistPosition: number | null = null;
      const userBooking = await prisma.bookings.findFirst({
        where: { event_id: ev.id, booker_user_id: userId, status: 'waitlisted' },
        select: { created_at: true }
      });
      if (userBooking) {
        userWaitlistPosition = 1 + await prisma.bookings.count({
          where: {
            event_id: ev.id,
            status: 'waitlisted',
            created_at: { lt: userBooking.created_at }
          }
        });
      }

      enrichedList.push({
        ...ev,
        tickets,
        ...hostInfo,
        wishlistCount,
        isWishlisted,
        waitlistCount,
        userWaitlistPosition,
        registrationStatus: ev.registration_status,
        registrationOpensAt: ev.registration_opens_at,
        registrationClosesAt: ev.registration_closes_at
      });
    }
    return enrichedList;
  }

  // `viaInviteLink` is set by the route layer once it has independently validated (and
  // consumed) a one-time 'view' invite token for this event - it bypasses the 'unlisted'
  // gate for that single request without needing to re-check the token here.
  static async getEventById(id: string, userId?: string, viaInviteLink = false) {
    const event = await this.eventsRepo.getById(id);
    if (!event) return null;

    if (!viaInviteLink && !(await this.canUserAccessEvent(event, userId))) {
      return { restricted: true as const };
    }

    const ticketsRaw = await this.ticketTypesRepo.getByEventId(id);
    const tickets = await Promise.all(ticketsRaw.map(async (t) => {
      let tIsFull = false;
      if (t.capacity !== null && t.capacity > 0) {
        const aggr = await prisma.booking_line_items.aggregate({
          _sum: { quantity: true },
          where: {
            ticket_type_id: t.id,
            bookings: { status: { in: ['confirmed', 'pending_payment'] } }
          }
        });
        const activeCount = aggr._sum.quantity || 0;
        if (activeCount >= t.capacity) {
          tIsFull = true;
        }
      }
      return { ...t, isFull: tIsFull };
    }));

    const ticketsWithRemaining = await Promise.all(tickets.map(async (t) => {
      const sold = await prisma.tickets.count({
        where: {
          booking_line_items: {
            ticket_type_id: t.id,
            bookings: {
              status: { in: ['confirmed', 'pending_approval', 'pending_payment'] }
            }
          }
        }
      });
      return {
        ...t,
        remaining: t.capacity !== null && t.capacity !== undefined ? Math.max(0, t.capacity - sold) : null
      };
    }));
    const hostInfo = await this.resolveHostInfo(event.hosted_by_entity_id);

    let isFull = false;
    let hasWaitlist = false;
    const capacity = (event.settings as any)?.capacity || {};
    if (capacity.limit === true && capacity.max > 0) {
      const activeCount = await prisma.attendees.count({
        where: { bookings: { event_id: id, status: { in: ['confirmed', 'pending_payment'] } } }
      });
      if (activeCount >= capacity.max) {
        isFull = true;
        if (capacity.waitlist === true) hasWaitlist = true;
      }
    }

    const wishlistCount = await this.wishlistRepo.getCountByEventId(id);
    const isWishlisted = userId ? await this.wishlistRepo.isWishlisted(id, userId) : false;
    const waitlistCount = await prisma.bookings.count({ where: { event_id: id, status: 'waitlisted' } });
    
    let userWaitlistPosition: number | null = null;
    if (userId) {
      const userBooking = await prisma.bookings.findFirst({
        where: { event_id: id, booker_user_id: userId, status: 'waitlisted' },
        select: { created_at: true }
      });
      if (userBooking) {
        userWaitlistPosition = 1 + await prisma.bookings.count({
          where: {
            event_id: id,
            status: 'waitlisted',
            created_at: { lt: userBooking.created_at }
          }
        });
      }
    }

    return {
      event: {
        ...event,
        ...hostInfo,
        isFull,
        hasWaitlist,
        wishlistCount,
        isWishlisted,
        waitlistCount,
        userWaitlistPosition,
        registrationStatus: event.registration_status,
        registrationOpensAt: event.registration_opens_at,
        registrationClosesAt: event.registration_closes_at
      }, 
      tickets: ticketsWithRemaining
    };
  }

  static async getAvailableEventRoles() {
    return prisma.$queryRawUnsafe<{ role_id: string; key: string; display_name: string; description: string | null; hierarchy_level: number; capabilities: string[] }[]>(
      `SELECT r.id as role_id, r.key, ar.display_name, ar.description, ar.hierarchy_level,
              r.baseline_capabilities as capabilities
       FROM roles r
       JOIN admin_roles ar ON ar.name = r.key
       JOIN admin_responsibilities resp ON resp.name = 'events_management'
       WHERE ar.is_active = true
         AND ar.tenant_id IS NULL
         AND ar.responsibility_ids @> jsonb_build_array(resp.id::text)
         AND (r.level = 'event' OR r.key = 'member')
       ORDER BY ar.hierarchy_level ASC`
    );
  }

  private static async getTopEventRoleKey(): Promise<string | null> {
    const roles = await this.getAvailableEventRoles();
    return roles[0]?.key ?? null;
  }

  private static async getRoleHierarchyLevels(keys: (string | undefined)[]): Promise<Record<string, number>> {
    const uniq = Array.from(new Set(keys.filter(Boolean))) as string[];
    if (uniq.length === 0) return {};
    const rows = await prisma.$queryRawUnsafe<{ key: string; hierarchy_level: number }[]>(
      `SELECT r.key, ar.hierarchy_level FROM roles r JOIN admin_roles ar ON ar.name = r.key
       WHERE r.key = ANY($1::text[]) AND ar.tenant_id IS NULL`,
      uniq
    );
    return Object.fromEntries(rows.map(r => [r.key, r.hierarchy_level]));
  }

  private static async roleHasCapability(roleKey: string, capability: string): Promise<boolean> {
    const role = await prisma.roles.findUnique({ where: { key: roleKey }, select: { baseline_capabilities: true } });
    const caps = Array.isArray(role?.baseline_capabilities) ? role!.baseline_capabilities as string[] : [];
    return caps.includes(capability);
  }

  // Ownership bypass -> assigned role's baseline_capabilities -> governance-tier fallback
  static async verifyEventCapability(userId: string, eventId: string, capability: string): Promise<boolean> {
    if (!userId || !eventId) return false;
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return false;
    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id === userId) return true;

    const assignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: userId, state: 'active' },
      include: { roles: true }
    });
    const roleKey = assignment?.roles?.key;
    if (roleKey && await this.roleHasCapability(roleKey, capability)) return true;

    return accessControlService.hasCapability(userId, capability, eventId);
  }

  static async verifyEventHostOrCoHost(userId: string, eventId: string): Promise<boolean> {
    return this.verifyEventCapability(userId, eventId, 'event.manage');
  }

  static async verifyEventTicketManager(userId: string, eventId: string): Promise<boolean> {
    return this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
  }

  static async verifyEventScanner(userId: string, eventId: string): Promise<boolean> {
    return this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');
  }

  // Events the user should see in the dedicated ticket-scanner nav/hub. Scoped to the
  // exact 'ticket_scanner' role assignment (not the broader checkin.gate_staff capability
  // that other roles like gate_staff/co_host also carry) — if a host reassigns someone
  // away from Ticket Scanner to another role, this list (and the Scan nav item) disappears
  // for them, even though that other role may still be able to check in via the dashboard.
  static async getScannerEvents(userId: string) {
    const assignments = await prisma.event_team_assignments.findMany({
      where: { user_id: userId, state: 'active' },
      include: { roles: true, events: true }
    });

    const seen = new Set<string>();
    const results: any[] = [];
    for (const a of assignments) {
      if (a.roles?.key !== 'ticket_scanner') continue;
      const ev = a.events;
      if (!ev || seen.has(ev.id) || ev.status !== 'published') continue;
      seen.add(ev.id);
      results.push({
        id: ev.id,
        title: ev.title,
        starts_at: ev.starts_at,
        ends_at: ev.ends_at,
        venue_timezone: ev.venue_timezone,
        status: ev.status
      });
    }
    return results;
  }

  static async updateEvent(id: string, userId: string, body: any) {
    const event = await this.eventsRepo.getById(id);
    if (!event) throw new Error('Event not found');

    // If existing event lacks a venue, require a venue in the update payload
    const existingHasVenue = event.venue && (typeof event.venue === 'string' ? event.venue.trim() !== '' : true);
    const newHasVenue = body.venue && (typeof body.venue === 'string' ? body.venue.trim() !== '' : true);
    if (!existingHasVenue && !newHasVenue) {
      throw new Error('Location is required: please add a venue when editing this event');
    }

    // Enforce plan entitlements against the incoming field values before writing.
    await this.validateEventEntitlements(userId, body);
    await this.validateEventLocation(body);

    const isFullyAuthorized = await this.verifyEventHostOrCoHost(userId, id);
    // Co-Hosts/managers who only hold event.configure_tickets (not event.manage) may still push
    // venue changes — Gallery/Discussion "Advance setting" panels live under venue.meta — but
    // cannot touch core event fields (title, dates, capacity, registration, etc.); those stay
    // event.manage-exclusive (owner-tier). Checked separately below rather than folded into one
    // boolean so the field set applied can differ by tier.
    const isTicketManager = !isFullyAuthorized && await this.verifyEventTicketManager(userId, id);

    if (!isFullyAuthorized && !isTicketManager) {
      throw new Error('Forbidden: You do not have permission to edit this event');
    }

    // Resolve hosted_by_entity_id the same way createEvent does, so "standalone" maps to the
    // user's own entity rather than being written as the literal string "standalone".
    let hostedByEntityId: string | undefined = undefined;
    if (isFullyAuthorized && body.host_entity_id) {
      hostedByEntityId = body.host_entity_id;
      if (hostedByEntityId === 'standalone') {
        const entityRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
          `SELECT id FROM entities WHERE user_id = $1::uuid AND entity_type = 'user' LIMIT 1`,
          userId
        );
        hostedByEntityId = entityRows[0]?.id;
      }
    }

    // Extract waitlist from root payload if provided
    let finalSettings = body.settings;
    if (body.waitlist !== undefined) {
      let baseSettings = finalSettings || (event.settings ? (typeof event.settings === 'string' ? JSON.parse(event.settings as string) : event.settings) : {});
      finalSettings = {
        ...baseSettings,
        capacity: {
          ...(baseSettings.capacity || {}),
          waitlist: body.waitlist
        }
      };
    }

    // ── CRITICAL FIX ──────────────────────────────────────────────────────────
    // The client (create_event.tsx) sends capacity_total as a flat integer and
    // NEVER sends settings.capacity.{limit,max}.  Without syncing them here:
    //   - capacityIncreased is always false  (newMax === undefined)
    //   - reconcileWaitlist bails out early  (capacity.limit !== true)
    //   - promoteFromWaitlist also bails     (capacity.max === undefined)
    // We mirror capacity_total into settings so all downstream logic works.
    if (body.capacity_total !== undefined) {
      const baseSettings = finalSettings || (event.settings
        ? (typeof event.settings === 'string' ? JSON.parse(event.settings as string) : { ...(event.settings as any) })
        : {}) as any;
      finalSettings = {
        ...baseSettings,
        capacity: {
          ...(baseSettings.capacity || {}),
          limit: body.capacity_total !== null && body.capacity_total > 0,
          max: body.capacity_total !== null && body.capacity_total > 0 ? body.capacity_total : undefined
        }
      };
    }
    // ─────────────────────────────────────────────────────────────────────────

    const oldSettings = event.settings as any || {};
    const oldMax = oldSettings.capacity?.max;
    const oldLimitEnabled = oldSettings.capacity?.limit === true;
    const oldWaitlistEnabled = oldSettings.capacity?.waitlist === true;

    const newSettings = finalSettings || {};
    const newMax = newSettings.capacity?.max;
    const newLimitEnabled = newSettings.capacity?.limit === true;
    const newWaitlistEnabled = newSettings.capacity?.waitlist === true;

    const capacityIncreased = (newLimitEnabled && newMax > (oldMax || 0))
      || (!oldLimitEnabled && newLimitEnabled);
      
    // If waitlist was toggled off, or approval required toggled off, we should also reconcile
    const waitlistToggledOn = !oldWaitlistEnabled && newWaitlistEnabled;
    const waitlistToggledOff = oldWaitlistEnabled && !newWaitlistEnabled;
    const approvalToggledOff = event.approval_required === true && body.approval_required === false;

    // The client always submits the full event snapshot (saveEventSettings in event.tsx), so a
    // ticket-manager-only editor's request still arrives with title/dates/etc. populated. Rather
    // than reject the whole request, silently drop the restricted fields (left undefined ->
    // eventsRepo.update's COALESCE keeps the existing DB value) and apply only `venue`.
    const updated = await this.eventsRepo.update(id, isFullyAuthorized ? {
      title: body.title,
      description: body.description,
      status: body.status,
      starts_at: body.starts_at ? new Date(body.starts_at) : undefined,
      ends_at: body.ends_at ? new Date(body.ends_at) : undefined,
      capacity_total: body.capacity_total,
      registration_mode: body.registration_mode,
      approval_required: body.approval_required,
      cash_enabled: body.cash_enabled,
      location_type: body.location_type,
      venue: body.venue,
      online_link: body.online_link,
      instruction: body.instruction,
      payment_instructions: body.payment_instructions,
      payment_hold_hours: body.payment_hold_hours,
      hosted_by_entity_id: hostedByEntityId,
      registration_status: body.registration_status,
      registration_opens_at: body.registration_opens_at ? new Date(body.registration_opens_at) : undefined,
      registration_closes_at: body.registration_closes_at ? new Date(body.registration_closes_at) : undefined,
      settings: finalSettings,
    } : {
      venue: body.venue,
    });

    if (waitlistToggledOff) {
      // Waitlist was disabled — cancel all existing waitlisted bookings and notify users
      await EventService.clearWaitlist(id);
    } else if (capacityIncreased || waitlistToggledOn || approvalToggledOff) {
      await EventService.reconcileWaitlist(id);
    }


    if (isFullyAuthorized) {
      const venueObj = body.venue || {};
      const meta = venueObj.meta || {};
      const isRestricted = meta.joinEligibility === 'restricted';
      const approvalRequired = body.approval_required === true || isRestricted;

      if (!approvalRequired) {
        const pendingBookings = await prisma.bookings.findMany({
          where: { event_id: id, status: 'pending_approval' }
        });

        if (pendingBookings.length > 0) {
          const bookingIds = pendingBookings.map(b => b.id);
          const bookerUserIds = pendingBookings.map(b => b.booker_user_id);
          await prisma.$transaction(async (tx) => {
            await tx.bookings.updateMany({
              where: { id: { in: bookingIds } },
              data: { status: 'confirmed' }
            });
            const lineItems = await tx.booking_line_items.findMany({
              where: { booking_id: { in: bookingIds } }
            });
            const liIds = lineItems.map(li => li.id);
            await tx.tickets.updateMany({
              where: { line_item_id: { in: liIds } },
              data: { status: 'confirmed' }
            });
            await tx.attendees.updateMany({
              where: { booking_id: { in: bookingIds }, status: 'pending' },
              data: { status: 'approved' }
            });
          });

          try {
            const { sendNotificationToUser } = require('./messagingSocket');
            const logs = await prisma.notification_log.findMany({
              where: {
                template_key: 'event_join_request',
                status: { not: 'read' }
              }
            });

            for (const log of logs) {
              try {
                const data = JSON.parse(log.provider_ref || '{}');
                if (data.eventId === id && bookerUserIds.includes(data.requesterId)) {
                  await prisma.notification_log.update({
                    where: { id: log.id },
                    data: { status: 'read' }
                  });
                  sendNotificationToUser(log.user_id, 'notification.acted', {
                    notificationId: log.id,
                    action: 'accepted'
                  });
                }
              } catch { }
            }
          } catch (e) {
            console.error('Error auto-resolving event notifications on update:', e);
          }
        }
      }

      if (body.registration_status) {
        await this.eventsRepo.updateRegistrationStatus(
          id,
          body.registration_status,
          body.registration_opens_at ? new Date(body.registration_opens_at) : null,
          body.registration_closes_at ? new Date(body.registration_closes_at) : null
        );
      }

      // Notify all active event members about the update (excluding the user making the edit)
      try {
        const members = await this.getEventMembers(id);
        const memberUserIds = members
          .filter(m => m.state === 'active' && m.id !== userId)
          .map(m => m.id);

        if (memberUserIds.length > 0) {
          const changedFields: string[] = [];
          if (isFullyAuthorized) {
            if (body.title && body.title !== event.title) changedFields.push('Title');
            if (body.description !== undefined && body.description !== event.description) changedFields.push('Description');
            if (body.starts_at && new Date(body.starts_at).getTime() !== event.starts_at?.getTime()) changedFields.push('Time');
            if (body.capacity_total !== undefined && body.capacity_total !== event.capacity_total) changedFields.push('Capacity');
            if (body.online_link !== undefined && body.online_link !== event.online_link) changedFields.push('Location');
          }
          const locationChanged = (() => {
            if (body.location_type !== undefined && body.location_type !== event.location_type) {
              return true;
            }
            const isOnline = body.location_type === 'online' || (body.location_type === undefined && event.location_type === 'online');
            if (isOnline) {
              return body.online_link !== undefined && body.online_link !== event.online_link;
            } else {
              if (body.venue === undefined) return false;
              const oldV = (typeof event.venue === 'string' ? (event.venue.trim() !== '' ? JSON.parse(event.venue) : {}) : event.venue) || {};
              const newV = (typeof body.venue === 'string' ? (body.venue.trim() !== '' ? JSON.parse(body.venue) : {}) : body.venue) || {};
              return (
                (newV.name !== undefined && newV.name !== oldV.name) ||
                (newV.address !== undefined && newV.address !== oldV.address) ||
                (newV.latitude !== undefined && newV.latitude !== oldV.latitude) ||
                (newV.longitude !== undefined && newV.longitude !== oldV.longitude) ||
                (newV.lat !== undefined && newV.lat !== oldV.lat) ||
                (newV.lng !== undefined && newV.lng !== oldV.lng)
              );
            }
          })();

          if (locationChanged) {
            if (!changedFields.includes('Location')) changedFields.push('Location');
          }
          const changedFieldsStr = changedFields.length > 0 ? changedFields.join(', ') : 'Settings';


          const { notificationService: ns } = require('./NotificationService');
          const filteredUpdateIds: string[] = [];
          for (const uid of memberUserIds) {
            if (await ns.shouldDeliverByTemplateKey(uid, 'event_updated')) filteredUpdateIds.push(uid);
          }

          if (filteredUpdateIds.length > 0) {
            const notificationsData = filteredUpdateIds.map(uid => ({
              tenant_id: event.tenant_id || '00000000-0000-0000-0000-000000000000',
              user_id: uid,
              channel: 'socket',
              template_key: 'event_updated',
              status: 'sent',
              provider_ref: JSON.stringify({ 
                eventId: id, 
                eventTitle: body.title || event.title,
                changedFields: changedFieldsStr 
              })
            }));

            await prisma.notification_log.createMany({
              data: notificationsData,
              skipDuplicates: true
            });

            for (const uid of filteredUpdateIds) {
              sendNotificationToUser(uid, 'group.notification', {
                type: 'event_updated',
                eventId: id,
                eventTitle: body.title || event.title,
                changedFields: changedFieldsStr,
                text: `The event <b>${body.title || event.title}</b> has been updated.${changedFieldsStr ? ` Changes: ${changedFieldsStr}` : ''}`
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to send event update notifications:', err);
      }
    }

    return updated;
  }

  static async deleteEvent(id: string, userId: string) {
    const event = await this.eventsRepo.getById(id);
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id !== userId) {
      throw new Error('Forbidden: You do not own this event');
    }

    // Soft-delete
    await this.eventsRepo.update(id, { status: 'cancelled' });
  }

  static async publishDraft(id: string, userId: string) {
    const event = await this.eventsRepo.getById(id);
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id !== userId) {
      throw new Error('Forbidden: You do not own this event');
    }

    const updated = await this.eventsRepo.update(id, { status: 'published' });
    return updated;
  }

  static async getWishlistEvents(userId: string) {
    const wishlistItems = await this.wishlistRepo.getByUserId(userId);
    const eventIds = wishlistItems.map(item => item.event_id);
    if (eventIds.length === 0) return [];

    const list = await prisma.events.findMany({
      where: { id: { in: eventIds } },
      orderBy: { starts_at: 'asc' }
    });

    const enrichedList = [];
    const now = new Date();
    
    for (const ev of list) {
      const endTime = ev.ends_at || ev.starts_at;
      const isPast = endTime && endTime < now;
      const isCancelled = ev.status === 'cancelled';
      
      if (isPast || isCancelled) {
        // Remove from wishlist upon event completion or cancellation
        await prisma.event_wishlist.deleteMany({
          where: { event_id: ev.id, user_id: userId }
        });
        continue;
      }

      const tickets = await this.ticketTypesRepo.getByEventId(ev.id);
      const hostInfo = await this.resolveHostInfo(ev.hosted_by_entity_id);
      const wishlistCount = await this.wishlistRepo.getCountByEventId(ev.id);

      enrichedList.push({
        ...ev,
        tickets,
        ...hostInfo,
        wishlistCount,
        isWishlisted: true,
        registrationStatus: ev.registration_status,
        registrationOpensAt: ev.registration_opens_at,
        registrationClosesAt: ev.registration_closes_at
      });
    }
    return enrichedList;
  }

  static async toggleWishlist(eventId: string, userId: string) {
    const result = await this.wishlistRepo.toggle(eventId, userId);
    broadcastWishlistUpdate(eventId, result.count);
    return result;
  }

  static async removeWishlist(eventId: string, userId: string) {
    const result = await this.wishlistRepo.removeByEventAndUser(eventId, userId);
    const count = await this.wishlistRepo.getCountByEventId(eventId);
    broadcastWishlistUpdate(eventId, count);
    return result;
  }

  static async updateRegistrationSettings(
    eventId: string,
    userId: string,
    settings: { status: 'OPEN' | 'CLOSED' | 'SCHEDULED', opensAt?: Date, closesAt?: Date }
  ) {
    const event = await this.eventsRepo.getById(eventId);
    if (!event) throw new Error('Event not found');

    const isHostOrCoHost = await this.verifyEventHostOrCoHost(userId, eventId);
    if (!isHostOrCoHost) {
      throw new Error('Forbidden: You do not have permission to manage registration for this event');
    }

    const previousStatus = event.registration_status;
    const isNowOpen = settings.status === 'OPEN';
    const wasClosed = previousStatus === 'CLOSED' || previousStatus === 'SCHEDULED';

    await this.eventsRepo.updateRegistrationStatus(eventId, settings.status, settings.opensAt, settings.closesAt);

    // Audit log
    await prisma.$queryRawUnsafe(`
      INSERT INTO event_registration_log (event_id, changed_by, action)
      VALUES ($1::uuid, $2::uuid, $3)
    `, eventId, userId, `status_changed_to_${settings.status.toLowerCase()}`);

    // Notification Fanout
    if (wasClosed && isNowOpen) {
      const wishlistingUsers = await this.wishlistRepo.getUsersWishlistingEvent(eventId);
      if (wishlistingUsers.length > 0) {
        try {
          const { notificationService: ns2 } = require('./NotificationService');
          const filteredWishlist: string[] = [];
          for (const { user_id } of wishlistingUsers) {
            if (await ns2.shouldDeliverByTemplateKey(user_id, 'registration_opened')) filteredWishlist.push(user_id);
          }

          if (filteredWishlist.length > 0) {
            const notificationsData = filteredWishlist.map(uid => ({
              tenant_id: event.tenant_id || '00000000-0000-0000-0000-000000000000',
              user_id: uid,
              channel: 'socket',
              template_key: 'registration_opened',
              status: 'sent',
              provider_ref: JSON.stringify({ eventId: event.id, eventTitle: event.title })
            }));

            await prisma.notification_log.createMany({
              data: notificationsData,
              skipDuplicates: true
            });

            for (const uid of filteredWishlist) {
              sendNotificationToUser(uid, 'group.notification', {
                type: 'registration_opened',
                eventId: eventId,
                eventTitle: event.title,
                text: `Registration is now OPEN for ${event.title}!`
              });
            }
          }
        } catch (e) {
          console.error('Failed to send wishlist notification', e);
        }
      }
    }

    return { status: settings.status };
  }

  static async verifyEventAdmin(userId: string, eventId: string): Promise<boolean> {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return false;
    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id === userId) return true;

    // Check if user is the group owner via role assignments
    const ownerRole = await prisma.roles.findFirst({
      where: { key: 'group_owner' }
    });
    if (ownerRole) {
      const assignment = await prisma.role_assignments.findFirst({
        where: {
          scope_entity_id: event.hosted_by_entity_id,
          role_id: ownerRole.id,
          user_id: userId
        }
      });
      if (assignment) return true;
    }

    const assignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: userId, state: 'active' }
    });
    return !!assignment;
  }

  static async getEventPosts(eventId: string, query: any, requestingUser?: any) {
    const { page = 1, limit = 20, sort = 'new', tag, q } = query;

    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const userId = requestingUser?.id || null;
    const skip = (Number(page) - 1) * Number(limit);
    const lim = Number(limit);

    const allowedSorts: Record<string, string> = {
      new: 'fp.created_at DESC',
      hot: 'vote_score DESC, fp.created_at DESC',
      top: 'vote_score DESC',
      pinned: 'fp.pinned DESC, fp.created_at DESC',
    };
    const orderBy = allowedSorts[sort] || allowedSorts['new'];

    const queryParams: any[] = [];
    let whereExtra = '';
    if (sort === 'pinned') whereExtra += ' AND fp.pinned = true';
    if (q) {
      queryParams.push(`%${q}%`);
      whereExtra += ` AND (fp.title ILIKE $5 OR fp.body ILIKE $5)`;
    }


    // Determine if the requesting user is privileged (host/admin) — they see all posts including pending
    const isPrivileged = userId ? await this.verifyEventHostOrCoHost(userId, eventId) : false;

    const posts = await this.forumPostsRepo.getEventPostsRaw(eventId, userId, lim, skip, orderBy, whereExtra, queryParams, isPrivileged);


    const postIds = posts.map((p: any) => String(p.id));
    const reactionMap: Record<string, Record<string, number>> = {};
    const tagMap: Record<string, any[]> = {};
    if (postIds.length > 0) {
      const reactionRows = await this.forumPostsRepo.getReactionCounts(postIds);
      reactionRows.forEach((r: any) => {
        const pid = String(r.target_id);
        if (!reactionMap[pid]) reactionMap[pid] = {};
        reactionMap[pid][r.emoji] = Number(r.cnt);
      });

      const tagRows = await this.forumPostsRepo.getTagRows(postIds);
      tagRows.forEach((r: any) => {
        const pid = String(r.post_id);
        if (!tagMap[pid]) tagMap[pid] = [];
        tagMap[pid].push({ id: String(r.tag_id), name: r.name, color: r.color });
      });
    }

    let filteredPosts = posts;
    if (tag) {
      filteredPosts = posts.filter((p: any) => {
        const tags = tagMap[String(p.id)] || [];
        return tags.some((t: any) => t.name === tag);
      });
    }

    return filteredPosts.map((p: any) => {
      const username = p.primary_email ? p.primary_email.split('@')[0] : 'unknown';
      const name = (`${p.first_name || ''} ${p.last_name || ''}`).trim() || username || 'Unknown User';
      const pid = String(p.id);
      return {
        id: pid, title: p.title, body: p.body, pinned: p.pinned, locked: p.locked,
        solved: p.solved, archived: p.archived, view_count: Number(p.view_count),
        status: p.status, created_at: p.created_at, updated_at: p.updated_at,
        author_user_id: p.author_user_id, scope_type: p.scope_type, scope_id: p.scope_id,
        author_name: name, author_username: username,
        vote_score: Number(p.vote_score || 0),
        user_vote: p.user_vote ? Number(p.user_vote) : 0,
        comments_count: Number(p.comments_count || 0),
        reactions: reactionMap[pid] || {},
        tags: tagMap[pid] || []
      };
    });
  }

  static async createEventPost(eventId: string, user: any, body: any, io?: any) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    // ── Approval check ──────────────────────────────────────────────────────────
    const venue = (event.venue as any) || {};
    const meta = venue.meta || {};
    const discussion = meta.discussion || {};
    const approvalRequired = discussion.approvalRequired === true;

    // Check if the author is a manager / host (they bypass approval)
    const isHostOrCoHost = await this.verifyEventHostOrCoHost(user.id, eventId);
    const needsApproval = approvalRequired && !isHostOrCoHost;
    const postStatus = needsApproval ? 'hidden' : 'active';
    // ────────────────────────────────────────────────────────────────────────────

    // ── Thread-creation permission (dynamic {public, roles} shape only) ─────────
    // Legacy-shaped or unset threadRoles keep today's behavior (no server-side gate,
    // matching how it has always worked) until an admin re-saves via the new RBAC-driven
    // Discussion Settings UI, at which point it switches to strict enforcement.
    const threadRoles = discussion.threadRoles;
    if (threadRoles && Array.isArray(threadRoles.roles)) {
      const isTicketManager = isHostOrCoHost || await this.verifyEventCapability(user.id, eventId, 'event.configure_tickets');
      const posterRoleKey = await this.getEventUserRole(user.id, eventId);
      const canPost = isTicketManager || threadRoles.public === true || threadRoles.roles.includes(posterRoleKey);
      if (!canPost) throw new Error('Forbidden: You do not have permission to create a thread in this event');
    }
    // ────────────────────────────────────────────────────────────────────────────

    const post = await this.forumPostsRepo.create({
      tenant_id: user.tenantId,
      scope_type: 'event',
      scope_id: eventId,
      author_user_id: user.id,
      title: body.title || null,
      body: body.body,
      status: postStatus
    });

    const tagColorMap: Record<string, string> = {
      Question: 'blue', Announcement: 'orange', Help: 'purple', Bug: 'red',
      Feature: 'green', News: 'cyan', Discussion: 'gray', General: 'gray'
    };

    if (Array.isArray(body.tags) && body.tags.length > 0) {
      for (const tagName of body.tags) {
        const tagRows = await prisma.$queryRaw<any[]>`
          INSERT INTO forum_tags(tenant_id, scope_id, scope_type, name, color)
          VALUES (${user.tenantId}::uuid, ${eventId}::uuid, 'event', ${tagName}, ${tagColorMap[tagName] || 'gray'})
          ON CONFLICT (scope_id, name) DO UPDATE SET name=EXCLUDED.name
          RETURNING id`;
        if (tagRows[0]) {
          await this.postTagsRepo.create({
            post_id: post.id!,
            tag_id: String(tagRows[0].id)
          });
        }
      }
    }

    // ── Notify event owner + staff if post is pending approval ───────────────
    if (needsApproval) {
      try {
        // Get author name
        const authorUser = await prisma.users.findUnique({ where: { id: user.id } });
        const authorName = authorUser
          ? (`${authorUser.first_name || ''} ${authorUser.last_name || ''}`).trim() || authorUser.primary_email.split('@')[0]
          : 'Someone';
        const postTitle = body.title || (body.body ? body.body.slice(0, 60) : 'Untitled thread');

        // Get event owner userId
        const ownerEntity = event.hosted_by_entity_id
          ? await prisma.entities.findUnique({ where: { id: event.hosted_by_entity_id }, select: { user_id: true } })
          : null;
        const ownerUserId = ownerEntity?.user_id;

        // Notify anyone who can actually approve a pending thread — matches approveEventPost's
        // authorization tier (event.configure_tickets or checkin.gate_staff), not event.manage-only,
        // otherwise Co-Hosts/Scanners who are able to approve would never be told there's anything to approve.
        const managerAssignments = await prisma.event_team_assignments.findMany({
          where: { event_id: eventId, state: 'active' },
          include: { roles: { select: { baseline_capabilities: true } } }
        });
        const managerIds = managerAssignments
          .filter(a => {
            const caps = Array.isArray(a.roles?.baseline_capabilities) ? a.roles.baseline_capabilities as string[] : [];
            return caps.includes('event.manage') || caps.includes('event.configure_tickets') || caps.includes('checkin.gate_staff');
          })
          .map(a => a.user_id);

        const recipientIds = new Set<string>();
        if (ownerUserId) recipientIds.add(ownerUserId);
        managerIds.forEach(id => recipientIds.add(id));
        // Remove the author from recipients
        recipientIds.delete(user.id);

        const providerRef = JSON.stringify({
          postId: String(post.id),
          postTitle,
          authorName,
          eventId,
          eventTitle: event.title || ''
        });

        if (recipientIds.size > 0) {
          await prisma.notification_log.createMany({
            data: Array.from(recipientIds).map(uid => ({
              tenant_id: user.tenantId || '00000000-0000-0000-0000-000000000000',
              user_id: uid,
              channel: 'socket',
              template_key: 'forum_thread_pending',
              status: 'sent',
              provider_ref: providerRef
            })),
            skipDuplicates: true
          });

          const notifText = `<b>${authorName}</b> created a thread <b>"${postTitle}"</b> in <b>${event.title || 'event'}</b> that requires your approval.`;
          for (const uid of recipientIds) {
            sendNotificationToUser(uid, 'group.notification', {
              type: 'forum_thread_pending',
              text: notifText,
              eventId,
              postId: String(post.id)
            });
          }
        }

        // Also emit real-time socket event so the discussion panel refreshes for hosts
        if (io) {
          io.of('/groups').to(`event_${eventId}`).emit('thread_pending_approval', {
            eventId,
            postId: String(post.id),
            authorName,
            postTitle
          });
        }
      } catch (notifErr) {
        console.error('Error sending thread approval notification:', notifErr);
      }
    }
    // ────────────────────────────────────────────────────────────────────────────

    return { ...post, tags: body.tags || [], reactions: {}, vote_score: 0, user_vote: 0, comments_count: 0, pendingApproval: needsApproval };
  }

  static async approveEventPost(eventId: string, postId: string, userId: string) {
    // Approval tier matches gallery moderation (event.configure_tickets) plus check-in staff
    // (checkin.gate_staff), since those are the roles the Discussion Settings UI already
    // promises can approve threads — event.manage alone would wrongly exclude Co-Hosts/Scanners.
    const isTicketManager = await this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
    const isScanner = !isTicketManager && await this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');
    if (!isTicketManager && !isScanner) throw new Error('Forbidden: Only event managers can approve threads');

    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Thread not found');
    if ((post as any).status !== 'hidden') throw new Error('Thread is not pending approval');

    await prisma.$executeRaw`UPDATE forum_posts SET status = 'active', updated_at = NOW() WHERE id = ${postId}::uuid`;

    // Notify the thread author that their post was approved
    if ((post as any).author_user_id !== userId) {
      try {
        const event = await prisma.events.findUnique({ where: { id: eventId } });
        const approverUser = await prisma.users.findUnique({ where: { id: userId } });
        const approverName = approverUser
          ? (`${approverUser.first_name || ''} ${approverUser.last_name || ''}`).trim() || approverUser.primary_email.split('@')[0]
          : 'An organizer';

        const tenant_id = (post as any).tenant_id || '00000000-0000-0000-0000-000000000000';
        await prisma.notification_log.create({
          data: {
            tenant_id,
            user_id: (post as any).author_user_id,
            channel: 'socket',
            template_key: 'forum_thread_approved',
            status: 'sent',
            provider_ref: JSON.stringify({
              postId,
              postTitle: (post as any).title || '',
              approverName,
              eventId,
              eventTitle: event?.title || ''
            })
          }
        });

        sendNotificationToUser((post as any).author_user_id, 'group.notification', {
          type: 'forum_thread_approved',
          text: `<b>${approverName}</b> approved your thread in <b>${event?.title || 'event'}</b>!`,
          eventId,
          postId
        });
      } catch (e) {
        console.error('Error sending thread approved notification:', e);
      }
    }

    return { success: true };
  }

  static async editEventPost(eventId: string, postId: string, user: any, body: any) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Post not found');
    if (post.author_user_id !== user.id) throw new Error('Only author can edit');

    const createdAt = new Date(post.created_at!);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 5 * 60 * 1000) throw new Error('Edit window expired (5 minutes)');

    await this.forumPostsRepo.updatePostRaw(postId, body.body, body.title);
  }

  static async deleteEventPost(eventId: string, postId: string, user: any) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Post not found');

    const isAdmin = await this.verifyEventAdmin(user.id, eventId);
    if (!isAdmin && post.author_user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await this.forumPostsRepo.softDeletePost(postId);
  }

  static async getEventPost(eventId: string, postId: string, requestingUser?: any) {
    const userId = requestingUser?.id || null;
    const post = await this.forumPostsRepo.getEventPostWithAuthorAndVotes(postId, userId, eventId);
    if (!post) return null;

    await this.forumPostsRepo.incrementViewCount(postId);

    const commentRows = await this.forumCommentsRepo.getRecursiveComments(postId, userId);

    const buildCommentTree = (flat: any[]): any[] => {
      const map = new Map<string, any>();
      flat.forEach(c => map.set(String(c.id), { ...c, replies: [] }));
      const roots: any[] = [];
      flat.forEach(c => {
        if (c.parent_id) {
          const parent = map.get(String(c.parent_id));
          if (parent) parent.replies.push(map.get(String(c.id)));
        } else {
          roots.push(map.get(String(c.id)));
        }
      });
      return roots;
    };

    const flatComments = commentRows.map((c: any) => {
      const username = c.primary_email ? c.primary_email.split('@')[0] : 'unknown';
      const name = (`${c.first_name || ''} ${c.last_name || ''}`).trim() || username || 'Unknown User';
      return {
        id: String(c.id), post_id: String(c.post_id), parent_id: c.parent_id ? String(c.parent_id) : null,
        author_user_id: String(c.author_user_id), body: c.body, status: c.status,
        created_at: c.created_at, updated_at: c.updated_at, depth: Number(c.depth),
        author_name: name, author_username: username,
        vote_score: Number(c.vote_score || 0), user_vote: c.user_vote ? Number(c.user_vote) : 0,
        replies: []
      };
    });

    const comments = buildCommentTree(flatComments);

    const reactionRows = await this.forumPostsRepo.getPostReactions(postId);
    const reactions: Record<string, number> = {};
    reactionRows.forEach((r: any) => { reactions[r.emoji] = Number(r.cnt); });

    const tagRows = await this.forumPostsRepo.getPostTags(postId);
    const tags = tagRows.map((t: any) => ({ id: String(t.id), name: t.name, color: t.color }));

    const username = post.primary_email ? post.primary_email.split('@')[0] : 'unknown';
    const name = (`${post.first_name || ''} ${post.last_name || ''}`).trim() || username || 'Unknown User';

    return {
      id: String(post.id), title: post.title, body: post.body, pinned: post.pinned, locked: post.locked,
      solved: post.solved, archived: post.archived, view_count: Number(post.view_count) + 1,
      status: post.status, created_at: post.created_at, updated_at: post.updated_at,
      author_user_id: String(post.author_user_id), scope_type: post.scope_type, scope_id: String(post.scope_id),
      author_name: name, author_username: username,
      vote_score: Number(post.vote_score || 0), user_vote: post.user_vote ? Number(post.user_vote) : 0,
      reactions, tags, comments
    };
  }

  static async createEventComment(eventId: string, postId: string, user: any, body: any) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Thread not found');
    if (post.locked) throw new Error('This thread is locked');

    // ── Reply permission (dynamic {public, roles} shape only) — same rationale as
    // createEventPost's threadRoles gate: legacy/unset replyRoles keep today's behavior.
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    const discussion = ((event?.venue as any)?.meta?.discussion) || {};
    const replyRoles = discussion.replyRoles;
    if (replyRoles && Array.isArray(replyRoles.roles)) {
      const isTicketManager = await this.verifyEventCapability(user.id, eventId, 'event.configure_tickets');
      const replierRoleKey = await this.getEventUserRole(user.id, eventId);
      const canReply = isTicketManager || replyRoles.public === true || replyRoles.roles.includes(replierRoleKey);
      if (!canReply) throw new Error('Forbidden: You do not have permission to reply in this event');
    }
    // ────────────────────────────────────────────────────────────────────────────

    const data: any = { tenant_id: user.tenantId, post_id: postId, author_user_id: user.id, body: body.body, status: 'active' };
    if (body.parent_id) data.parent_id = body.parent_id;

    const comment = await this.forumCommentsRepo.create(data);
    const commentUser = await this.usersRepo.findOne({ id: comment.author_user_id });

    const username = commentUser?.primary_email ? commentUser.primary_email.split('@')[0] : 'unknown';
    const name = commentUser ? (`${commentUser.first_name || ''} ${commentUser.last_name || ''}`.trim() || username) : 'Unknown User';

    return {
      id: comment.id, post_id: comment.post_id, parent_id: comment.parent_id || null,
      author_user_id: comment.author_user_id, body: comment.body, status: comment.status,
      created_at: comment.created_at, author_name: name, author_username: username,
      vote_score: 0, user_vote: 0, replies: []
    };
  }

  static async editEventComment(eventId: string, postId: string, commentId: string, user: any, body: any) {
    const comment = await this.forumCommentsRepo.findOne({ id: commentId, post_id: postId, deleted_at: null } as any);
    if (!comment) throw new Error('Comment not found');
    if (comment.author_user_id !== user.id) throw new Error('Only author can edit');

    const createdAt = new Date(comment.created_at!);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 5 * 60 * 1000) throw new Error('Edit window expired (5 minutes)');

    await this.forumCommentsRepo.updateCommentRaw(commentId, body.body);
  }

  static async deleteEventComment(eventId: string, postId: string, commentId: string, user: any) {
    const comment = await this.forumCommentsRepo.findOne({ id: commentId, post_id: postId, deleted_at: null } as any);
    if (!comment) throw new Error('Comment not found');

    const isAdmin = await this.verifyEventAdmin(user.id, eventId);
    if (!isAdmin && comment.author_user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await this.forumCommentsRepo.softDeleteComment(commentId);
  }

  static async voteEventPost(eventId: string, postId: string, user: any, vote: number) {
    if (vote === 0) {
      await this.votesRepo.dbModel.deleteMany({
        where: { user_id: user.id, target_id: postId, target_type: 'post' }
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
         VALUES($1::uuid, $2::uuid, $3::uuid, 'post', $4)
         ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
        user.tenantId, user.id, postId, vote
      );
    }

    const scoreRows = await this.votesRepo.findAll({ target_id: postId, target_type: 'post' });
    const score = scoreRows.reduce((acc, curr) => acc + curr.vote, 0);
    return { vote_score: score, user_vote: vote };
  }

  static async voteEventComment(eventId: string, commentId: string, user: any, vote: number) {
    if (vote === 0) {
      await this.votesRepo.dbModel.deleteMany({
        where: { user_id: user.id, target_id: commentId, target_type: 'comment' }
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
         VALUES($1::uuid, $2::uuid, $3::uuid, 'comment', $4)
         ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
        user.tenantId, user.id, commentId, vote
      );
    }

    const scoreRows = await this.votesRepo.findAll({ target_id: commentId, target_type: 'comment' });
    const score = scoreRows.reduce((acc, curr) => acc + curr.vote, 0);
    return { vote_score: score, user_vote: vote };
  }

  static async reactEventPost(eventId: string, postId: string, user: any, emoji: string) {
    const existing = await this.reactionsRepo.findAll({ user_id: user.id, target_id: postId, target_type: 'post', emoji });
    if (existing.length > 0) {
      await this.reactionsRepo.delete(existing[0].id);
    } else {
      await this.reactionsRepo.create({
        tenant_id: user.tenantId,
        user_id: user.id,
        target_id: postId,
        target_type: 'post',
        emoji
      });
    }

    const rows = await this.reactionsRepo.findAll({ target_id: postId, target_type: 'post' });
    const reactions: Record<string, number> = {};
    rows.forEach(r => {
      reactions[r.emoji] = (reactions[r.emoji] || 0) + 1;
    });

    return reactions;
  }

  static async solveEventPost(eventId: string, postId: string, user: any, solved: boolean) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId } as any);
    if (!post) throw new Error('Post not found');

    const isAdmin = await this.verifyEventAdmin(user.id, eventId);
    if (!isAdmin && post.author_user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await this.forumPostsRepo.updateSolveStatus(postId, solved);
  }

  static async archiveEventPost(eventId: string, postId: string, user: any, archived: boolean) {
    if (!(await this.verifyEventAdmin(user.id, eventId))) {
      throw new Error('Forbidden');
    }
    await this.forumPostsRepo.updateArchiveStatus(postId, archived);
  }

  static async pinEventPost(eventId: string, postId: string, user: any, pinned: boolean) {
    if (!(await this.verifyEventAdmin(user.id, eventId))) {
      throw new Error('Forbidden');
    }
    await this.forumPostsRepo.updatePinStatus(postId, pinned);
  }

  static async lockEventPost(eventId: string, postId: string, user: any, locked: boolean) {
    if (!(await this.verifyEventAdmin(user.id, eventId))) {
      throw new Error('Forbidden');
    }
    await this.forumPostsRepo.updateLockStatus(postId, locked);
  }

  /**
   * Resolves the canonical list of user IDs for all attendees of an event.
   * If an attendee has a claimed user_id, it is used. Otherwise it falls back to the booking's booker_user_id.
   */
  static async getEventParticipantUserIds(eventId: string, includePending = false): Promise<string[]> {
    const statuses = includePending ? ['approved', 'checked_in', 'pending'] : ['approved', 'checked_in'];
    const attendees = await prisma.attendees.findMany({
      where: {
        bookings: { event_id: eventId, status: { not: 'cancelled' } },
        status: { in: statuses as any[] }
      },
      select: {
        user_id: true,
        bookings: { select: { booker_user_id: true } }
      }
    });

    const userIds = attendees.map(a => a.user_id || a.bookings.booker_user_id).filter(Boolean) as string[];
    return [...new Set(userIds)];
  }

  static async getEventMembers(eventId: string) {
    const topRoleKey = await this.getTopEventRoleKey();
    const assignments = await prisma.event_team_assignments.findMany({
      where: { event_id: eventId },
      include: {
        users_event_team_assignments_user_idTousers: { select: { id: true, first_name: true, last_name: true, primary_email: true, profile_image_data: true, profiles: { select: { display_name: true } } } },
        roles: true
      }
    });

    const attendees = await prisma.attendees.findMany({
      where: { 
        bookings: { event_id: eventId, status: { not: 'cancelled' } },
        status: { in: ['approved', 'checked_in', 'pending'] }
      },
      include: {
        users_attendees_user_idTousers: { select: { id: true, first_name: true, last_name: true, primary_email: true, profile_image_data: true, profiles: { select: { display_name: true } } } },
        bookings: { 
          select: { 
            booker_user_id: true,
            users: { select: { id: true, first_name: true, last_name: true, primary_email: true, profile_image_data: true, profiles: { select: { display_name: true } } } }
          }
        }
      }
    });

    const memberMap = new Map();

    // 1. Process Event Owner / Host Entity FIRST so their role is established
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (event) {
      const entity = await prisma.entities.findUnique({ where: { id: event.hosted_by_entity_id }, include: { users: { select: { id: true, first_name: true, last_name: true, primary_email: true, profile_image_data: true, profiles: { select: { display_name: true } } } } } });
      if (entity && (entity.entity_type === 'user' || entity.entity_type === 'group') && entity.user_id && entity.users) {
        const u = entity.users;
        const picture = u.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(u.profile_image_data).toString('base64')}` : null;
        memberMap.set(entity.user_id, {
          id: u.id,
          name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Unknown',
          display_name: u.profiles?.display_name || u.first_name,
          picture,
          email: u.primary_email,
          role: topRoleKey || 'event_owner',
          state: 'active'
        });
      }
    }

    // 2. Process Team Assignments SECOND
    for (const a of assignments) {
      if (a.users_event_team_assignments_user_idTousers) {
        const u = a.users_event_team_assignments_user_idTousers;
        const picture = u.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(u.profile_image_data).toString('base64')}` : null;
        const roleKey = a.roles?.key || 'member';
        const existing = memberMap.get(a.user_id);
        if (!existing) {
          memberMap.set(a.user_id, {
            id: u.id,
            name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Unknown',
            display_name: u.profiles?.display_name || u.first_name,
            picture,
            email: u.primary_email,
            role: roleKey,
            state: a.state
          });
        } else if (existing.role === 'member' && roleKey !== 'member') {
          existing.role = roleKey;
        }
      }
    }

    // 3. Process Attendees (Ticket Holders/Guests) THIRD
    for (const att of attendees) {
      // Resolve the true user record: attendee's own user (if claimed) OR the buyer's user
      const resolvedUser = att.users_attendees_user_idTousers || att.bookings.users;
      const resolvedUserId = att.user_id || att.bookings.booker_user_id;

      if (resolvedUserId && resolvedUser) {
        // If user already has an existing role (Owner, Host, Admin, Moderator, etc.), preserve it completely!
        if (!memberMap.has(resolvedUserId)) {
          const u = resolvedUser;
          const picture = u.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(u.profile_image_data).toString('base64')}` : null;
          memberMap.set(resolvedUserId, {
            id: u.id,
            name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : 'Unknown',
            display_name: u.profiles?.display_name || u.first_name,
            picture,
            email: u.primary_email,
            role: 'member',
            state: att.status === 'pending' ? 'pending' : 'active'
          });
        }
      }
    }

    return Array.from(memberMap.values());
  }

  static async updateMemberRole(eventId: string, targetUserId: string, newRoleKey: string, currentUserId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const creatorEntity = await prisma.entities.findFirst({ where: { id: event.hosted_by_entity_id, user_id: currentUserId } });
    const isOwner = !!creatorEntity;

    if (!isOwner && !(await this.verifyEventCapability(currentUserId, eventId, 'event.manage'))) {
      throw new Error('Forbidden: You do not have permission to change roles.');
    }

    const [callerAssignment, targetAssignment] = await Promise.all([
      prisma.event_team_assignments.findFirst({ where: { event_id: eventId, user_id: currentUserId }, include: { roles: true } }),
      prisma.event_team_assignments.findFirst({ where: { event_id: eventId, user_id: targetUserId }, include: { roles: true } }),
    ]);

    const callerRoleKey = callerAssignment?.roles?.key;
    const currentTargetRoleKey = targetAssignment?.roles?.key || 'member';
    const hierarchy = await this.getRoleHierarchyLevels([callerRoleKey, newRoleKey, currentTargetRoleKey]);
    const callerLevel = isOwner ? 0 : hierarchy[callerRoleKey!] ?? Infinity;
    const targetLevel = hierarchy[newRoleKey];
    if (targetLevel === undefined) throw new Error('Role not found');
    const currentTargetLevel = hierarchy[currentTargetRoleKey] ?? Infinity;

    // lower hierarchy_level = more senior; nobody may assign/touch a role at or above their own level
    if (!isOwner && targetLevel <= callerLevel) {
      throw new Error('Forbidden: Cannot assign a role equal to or higher than your own.');
    }
    if (!isOwner && currentTargetLevel <= callerLevel) {
      throw new Error('Forbidden: Cannot change the role of someone with equal or higher permissions.');
    }

    const newRole = await prisma.roles.findUnique({ where: { key: newRoleKey } });
    if (!newRole) throw new Error('Role not found');

    if (targetAssignment) {
      await prisma.event_team_assignments.update({
        where: { id: targetAssignment.id },
        data: { role_id: newRole.id }
      });
    } else {
      await prisma.event_team_assignments.create({
        data: {
          tenant_id: event.tenant_id,
          event_id: eventId,
          user_id: targetUserId,
          role_id: newRole.id,
          state: 'active'
        }
      });
    }
    return { success: true };
  }

  static async removeMember(eventId: string, targetUserId: string, currentUserId: string) {
    if (targetUserId === currentUserId) {
      throw new Error('Cannot remove yourself');
    }

    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    const isOwner = entityRows[0]?.user_id === currentUserId;

    if (!isOwner && !(await this.verifyEventCapability(currentUserId, eventId, 'event.manage'))) {
      throw new Error('Forbidden: You do not have permission to remove members.');
    }

    const [callerAssignment, targetAssignment] = await Promise.all([
      prisma.event_team_assignments.findFirst({ where: { event_id: eventId, user_id: currentUserId }, include: { roles: true } }),
      prisma.event_team_assignments.findFirst({ where: { event_id: eventId, user_id: targetUserId }, include: { roles: true } }),
    ]);

    const callerRoleKey = callerAssignment?.roles?.key;
    const targetRoleKey = targetAssignment?.roles?.key || 'member';
    const hierarchy = await this.getRoleHierarchyLevels([callerRoleKey, targetRoleKey]);
    const callerLevel = isOwner ? 0 : hierarchy[callerRoleKey!] ?? Infinity;
    const targetLevel = hierarchy[targetRoleKey] ?? Infinity;

    if (!isOwner && targetLevel <= callerLevel) {
      throw new Error('Forbidden: Cannot remove a user with equal or higher permissions.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.event_team_assignments.deleteMany({
        where: { event_id: eventId, user_id: targetUserId }
      });

      const bookings = await tx.bookings.findMany({
        where: { event_id: eventId, booker_user_id: targetUserId }
      });

      for (const b of bookings) {
        await tx.bookings.update({
          where: { id: b.id },
          data: { status: 'cancelled' }
        });
        const lineItems = await tx.booking_line_items.findMany({ where: { booking_id: b.id } });
        const liIds = lineItems.map(li => li.id);
        if (liIds.length > 0) {
          await tx.tickets.updateMany({ where: { line_item_id: { in: liIds } }, data: { status: 'cancelled' } });
        }
      }

      // Also update any attendee records for this user in this event to 'rejected'
      // This handles cases where they were added as a guest by someone else
      const attendeesToReject = await tx.attendees.findMany({
        where: { user_id: targetUserId, bookings: { event_id: eventId } }
      });
      
      for (const att of attendeesToReject) {
        await tx.attendees.update({
          where: { id: att.id },
          data: { status: 'rejected' }
        });
        // Also cancel their specific ticket
        if (att.ticket_id) {
          await tx.tickets.update({
            where: { id: att.ticket_id },
            data: { status: 'cancelled' }
          });
        }
      }
    });

    await EventService.reconcileWaitlist(eventId);

    // Notify the user they were removed and sync their ticket and event state in real-time
    try {
      const chatNamespace = (global as any).fastify?.io?.of('/chat');
      if (chatNamespace) {
        chatNamespace.to(`user:${targetUserId}`).emit('group.notification', {
          type: 'system',
          text: `You have been removed from the event <b>${event.title}</b>`,
          eventId: eventId
        });
      }
      const { TicketRealtimeService } = require('./TicketRealtimeService');
      const { MyEventsRealtimeService } = require('./MyEventsRealtimeService');
      TicketRealtimeService.syncUser(targetUserId, eventId).catch(() => {});
      TicketRealtimeService.syncScanner(eventId).catch(() => {});
      MyEventsRealtimeService.syncUser(targetUserId).catch(() => {});
    } catch (e) {
      console.error('Failed to notify and sync removed event member', e);
    }
  }

  static async getEventUserRole(userId: string, eventId: string): Promise<string> {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return 'none';

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id === userId) return (await this.getTopEventRoleKey()) || 'member';

    const assignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: userId, state: 'active' },
      include: { roles: true }
    });
    if (assignment?.roles?.key) {
      return assignment.roles.key;
    }

    const booking = await prisma.bookings.findFirst({
      where: { event_id: eventId, booker_user_id: userId, status: { in: ['confirmed', 'pending_payment'] } }
    });
    if (booking) return 'member';

    return 'none';
  }

  // Evaluates a gallery/discussion permission bucket for a given user. Supports the dynamic
  // {public, roles: string[]} shape (checked against the user's effective RBAC role key) as well
  // as the legacy {owner,admin,moderator,member,public} shape (checked against capability tiers,
  // unchanged) for events whose settings JSON hasn't been re-saved via the new roles UI yet.
  private static async checkRoleBucket(
    bucket: any,
    userId: string,
    eventId: string,
    isTicketManagerOverride?: boolean
  ): Promise<boolean> {
    if (!bucket) return false;
    const isTicketManager = isTicketManagerOverride ?? await this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
    if (isTicketManager) return true;
    if (Array.isArray(bucket.roles)) {
      if (bucket.public === true) return true;
      const roleKey = await this.getEventUserRole(userId, eventId);
      return bucket.roles.includes(roleKey);
    }
    // Legacy shape
    const isScanner = await this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');
    const role = await this.getEventUserRole(userId, eventId);
    const isMember = role === 'member';
    return !!(
      bucket.public ||
      (isMember && bucket.member) ||
      (isScanner && bucket.moderator !== false)
    );
  }

  static async getEventGallery(eventId: string, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const venue = event.venue && typeof event.venue === 'object' ? (event.venue as any) : {};
    const meta = venue.meta && typeof venue.meta === 'object' ? venue.meta : {};
    const gallery = meta.gallery && typeof meta.gallery === 'object' ? meta.gallery : {};
    const items = Array.isArray(gallery.items) ? gallery.items : [];

    const isHostOrCoHost = await this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
    const isScanner = !isHostOrCoHost && await this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');

    const user = await prisma.users.findUnique({ where: { id: userId } });
    const isGlobalStaff = user?.role && (user.role.toLowerCase().includes('admin') || user.role.toLowerCase().includes('moderator'));

    const isPrivileged = !!(isHostOrCoHost || isScanner || isGlobalStaff);

    // Gate viewing itself when the settings UI has restricted the gallery to specific roles
    // (dynamic {public, roles} shape) or a legacy bucket. Unset viewRoles keeps today's behavior
    // (any authenticated caller can view; only approval status is filtered below).
    if (!isPrivileged && gallery.viewRoles) {
      const canView = await this.checkRoleBucket(gallery.viewRoles, userId, eventId, isHostOrCoHost);
      if (!canView) throw new Error('Forbidden: You do not have permission to view this gallery');
    }

    if (isPrivileged) {
      return items;
    }
    return items.filter((item: any) => item.approved || item.uploaderId === userId);
  }

  static async uploadToEventGallery(eventId: string, userId: string, body: any) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const venue = event.venue && typeof event.venue === 'object' ? (event.venue as any) : {};
    const meta = venue.meta && typeof venue.meta === 'object' ? venue.meta : {};
    const gallery = meta.gallery && typeof meta.gallery === 'object' ? meta.gallery : {};
    const items = Array.isArray(gallery.items) ? gallery.items : [];

    const isHostOrCoHost = await this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
    const isScanner = !isHostOrCoHost && await this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');

    const user = await prisma.users.findUnique({ where: { id: userId } });
    const uploaderName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.primary_email.split('@')[0] : 'Unknown';

    if (!gallery.enabled) {
      throw new Error('Gallery is disabled for this event');
    }

    const uploadRoles = gallery.uploadRoles || { owner: true, admin: true, moderator: true, public: false };
    const canUpload = await this.checkRoleBucket(uploadRoles, userId, eventId, isHostOrCoHost);

    if (!canUpload) {
      throw new Error('You do not have permission to upload to this gallery');
    }

    const needsApproval = gallery.approvalRequired;
    const isAuthorizedApprover = isHostOrCoHost || isScanner;
    const approved = !(needsApproval && !isAuthorizedApprover);

    const newItem = {
      id: Date.now(),
      url: body.url,
      type: body.type || 'image',
      approved,
      uploadedBy: uploaderName,
      uploaderId: userId,
      created_at: new Date().toISOString()
    };

    const nextItems = [...items, newItem];
    const newMeta = { ...meta, gallery: { ...gallery, items: nextItems } };
    const newVenue = { ...venue, meta: newMeta };

    await prisma.events.update({
      where: { id: eventId },
      data: { venue: newVenue }
    });

    return newItem;
  }

  static async approveEventGalleryItem(eventId: string, itemId: number, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    // Gallery moderation remains under event.configure_tickets (plus checkin.gate_staff) because
    // no dedicated gallery-management capability currently exists in the seeded RBAC model, and
    // introducing one would require modifying the seed data, which is explicitly out of scope.
    const isHostOrCoHost = await this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
    const isScanner = !isHostOrCoHost && await this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');

    if (!isHostOrCoHost && !isScanner) {
      throw new Error('Forbidden: Only organizers can approve media');
    }

    const venue = event.venue && typeof event.venue === 'object' ? (event.venue as any) : {};
    const meta = venue.meta && typeof venue.meta === 'object' ? venue.meta : {};
    const gallery = meta.gallery && typeof meta.gallery === 'object' ? meta.gallery : {};
    const items = Array.isArray(gallery.items) ? gallery.items : [];

    const nextItems = items.map((item: any) => {
      if (item.id === itemId) {
        return { ...item, approved: true };
      }
      return item;
    });

    const newMeta = { ...meta, gallery: { ...gallery, items: nextItems } };
    const newVenue = { ...venue, meta: newMeta };

    await prisma.events.update({
      where: { id: eventId },
      data: { venue: newVenue }
    });
  }

  static async deleteEventGalleryItem(eventId: string, itemId: number, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const isHostOrCoHost = await this.verifyEventCapability(userId, eventId, 'event.configure_tickets');
    const isScanner = !isHostOrCoHost && await this.verifyEventCapability(userId, eventId, 'checkin.gate_staff');

    const venue = event.venue && typeof event.venue === 'object' ? (event.venue as any) : {};
    const meta = venue.meta && typeof venue.meta === 'object' ? venue.meta : {};
    const gallery = meta.gallery && typeof meta.gallery === 'object' ? meta.gallery : {};
    const items = Array.isArray(gallery.items) ? gallery.items : [];

    const itemToDelete = items.find((item: any) => item.id === itemId);
    if (!itemToDelete) throw new Error('Item not found');

    const isUploader = itemToDelete.uploaderId === userId;

    if (!isHostOrCoHost && !isScanner && !isUploader) {
      throw new Error('Forbidden: You do not have permission to delete this media');
    }

    const nextItems = items.filter((item: any) => item.id !== itemId);

    const newMeta = { ...meta, gallery: { ...gallery, items: nextItems } };
    const newVenue = { ...venue, meta: newMeta };

    await prisma.events.update({
      where: { id: eventId },
      data: { venue: newVenue }
    });
  }

  static async promoteFromWaitlist(eventId: string, count: number) {
    if (count <= 0) return;

    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return;

    const capacity = (event.settings as any)?.capacity || {};
    if (capacity.waitlist !== true) return;

    const waitlistedBookings = await prisma.bookings.findMany({
      where: { event_id: eventId, status: 'waitlisted' },
      orderBy: { created_at: 'asc' },
      take: count
    });

    const { sendNotificationToUser } = (() => {
      try { return require('./messagingSocket'); } catch { return { sendNotificationToUser: () => {} }; }
    })();

    // Resolve host/owner once
    let ownerUserId: string | null = null;
    try {
      const entityRow = await prisma.entities.findUnique({ where: { id: event.hosted_by_entity_id } });
      ownerUserId = entityRow?.user_id ?? null;
    } catch {}

    for (const wb of waitlistedBookings) {
      const newStatus = event.approval_required ? 'pending_approval' : 'confirmed';
      const newTicketStatus = event.approval_required ? 'reserved' : 'confirmed';

      let promoted = false;
      await prisma.$transaction(async (tx) => {
        if (capacity.limit === true) {
          // Count both confirmed AND pending_approval as capacity-consuming
          const currentOccupied = await tx.bookings.count({
            where: { event_id: eventId, status: { in: ['confirmed', 'pending_payment'] } }
          });
          if (currentOccupied >= capacity.max) {
            return; // Abort this promotion if we just hit max capacity
          }
        }

        await tx.bookings.update({
          where: { id: wb.id },
          data: { status: newStatus }
        });
        const lineItems = await tx.booking_line_items.findMany({
          where: { booking_id: wb.id }
        });
        const liIds = lineItems.map(li => li.id);
        await tx.tickets.updateMany({
          where: { line_item_id: { in: liIds } },
          data: { status: newTicketStatus }
        });
        promoted = true;
      });

      if (promoted) {
        try {
          // Notify the waitlisted users of their promotion
          if (newStatus === 'confirmed') {
            const atts = await prisma.attendees.findMany({ where: { booking_id: wb.id } });
            const notifyIds = [...new Set(atts.map(a => a.user_id || wb.booker_user_id).filter(Boolean))] as string[];

            for (const nId of notifyIds) {
              sendNotificationToUser(nId, 'group.notification', {
                type: 'event',
                text: `You have been moved from the waitlist. Your ticket has been confirmed for <b>${event.title}</b>! 🎉`,
                eventId: event.id
              });
              await prisma.notification_log.create({
                data: {
                  user_id: nId,
                  tenant_id: event.tenant_id,
                  channel: 'app',
                  template_key: 'event_waitlist_promoted',
                  status: 'queued',
                  provider_ref: JSON.stringify({ eventId: event.id, eventTitle: event.title })
                }
              }).catch(() => {});
            }

            // Fetch the buyer's email and name
            const buyerUser = await prisma.users.findUnique({ where: { id: wb.booker_user_id }, include: { profiles: true } });
            if (buyerUser?.primary_email) {
              const { TicketNotificationService } = require('./TicketNotificationService');
              const bName = Array.isArray(buyerUser.profiles) ? buyerUser.profiles[0]?.display_name : (buyerUser.profiles as any)?.display_name;
              // Send buyer payment/confirmation update
              await TicketNotificationService.notifyBuyer(wb, event, buyerUser.primary_email, bName || 'Buyer', 'approved');

              // Fetch attendees and tickets for this booking
              const dbAttendees = await prisma.attendees.findMany({
                where: { booking_id: wb.id },
                include: { tickets: true }
              });
              for (const att of dbAttendees) {
                if (att.tickets) {
                  await TicketNotificationService.handleAttendeeApproval(wb, event, att, att.tickets, buyerUser.primary_email, bName || 'Buyer');
                }
              }
            }
          } else {
            // pending_approval — notify users
            const atts = await prisma.attendees.findMany({ where: { booking_id: wb.id } });
            const notifyIds = [...new Set(atts.map(a => a.user_id || wb.booker_user_id).filter(Boolean))] as string[];

            for (const nId of notifyIds) {
              sendNotificationToUser(nId, 'group.notification', {
                type: 'registration',
                text: `A seat opened up for <b>${event.title}</b>. Your join request is now pending host approval.`,
                eventId: event.id
              });
              await prisma.notification_log.create({
                data: {
                  user_id: nId,
                  tenant_id: event.tenant_id,
                  channel: 'app',
                  template_key: 'event_waitlist_to_pending',
                  status: 'queued',
                  provider_ref: JSON.stringify({ eventId: event.id, eventTitle: event.title })
                }
              }).catch(() => {});
            }

            // Notify host in real-time with group.notification (triggers toast + notification badge)
            if (ownerUserId) {
              sendNotificationToUser(ownerUserId, 'group.notification', {
                type: 'registration',
                text: `A waitlisted user now has a spot for <b>${event.title}</b>. Review pending requests.`,
                eventId: event.id,
                action: 'view_event'
              });
              await prisma.notification_log.create({
                data: {
                  user_id: ownerUserId,
                  tenant_id: event.tenant_id,
                  channel: 'app',
                  template_key: 'event_waitlist_needs_approval',
                  status: 'queued',
                  provider_ref: JSON.stringify({ eventId: event.id, eventTitle: event.title })
                }
              }).catch(() => {});

              // Also emit dashboard_updated so the host's event page refreshes attendance list live
              const groupsNamespace = (global as any).fastify?.io?.of('/groups');
              if (groupsNamespace) {
                groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', {
                  action: 'waitlist_promoted_to_pending',
                  eventId
                });
              }
            }
          }
        } catch (e) { }
      }
    }
  }


  static async broadcastWaitlistPositions(eventId: string) {
    const waitlistedBookings = await prisma.bookings.findMany({
      where: { event_id: eventId, status: 'waitlisted' },
      orderBy: { created_at: 'asc' },
      select: { booker_user_id: true }
    });
    
    const positions = waitlistedBookings.map((wb, index) => ({
      userId: wb.booker_user_id,
      position: index + 1
    }));
    
    const totalWaiting = positions.length;

    const groupsNamespace = (global as any).fastify?.io?.of('/groups');
    if (groupsNamespace) {
      groupsNamespace.to(`event_${eventId}`).emit('waitlist_positions_updated', {
        eventId,
        totalWaiting,
        positions
      });
      groupsNamespace.to(`event_${eventId}`).emit('waitlist_updated', { eventId });
    }
  }

  static async clearWaitlist(eventId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return;

    // Find all waitlisted bookings
    const waitlistedBookings = await prisma.bookings.findMany({
      where: { event_id: eventId, status: 'waitlisted' }
    });

    if (waitlistedBookings.length === 0) {
      // Still broadcast the empty state so host dashboard refreshes
      const groupsNs = (global as any).fastify?.io?.of('/groups');
      if (groupsNs) {
        groupsNs.to(`event_${eventId}`).emit('waitlist_closed', { eventId });
        groupsNs.to(`event_${eventId}`).emit('waitlist_positions_updated', { eventId, totalWaiting: 0, positions: [] });
        groupsNs.to(`event_${eventId}`).emit('waitlist_updated', { eventId });
        groupsNs.to(`event_${eventId}`).emit('dashboard_updated', { action: 'waitlist_cleared', eventId });
      }
      return;
    }

    // Cancel all waitlisted bookings and their tickets in a transaction
    await prisma.$transaction(async (tx) => {
      for (const b of waitlistedBookings) {
        await tx.bookings.update({ where: { id: b.id }, data: { status: 'cancelled' } });
        const lineItems = await tx.booking_line_items.findMany({ where: { booking_id: b.id } });
        const liIds = lineItems.map(li => li.id);
        if (liIds.length > 0) {
          await tx.tickets.updateMany({ where: { line_item_id: { in: liIds } }, data: { status: 'cancelled' } });
        }
      }
    });

    // Notify each affected user in real-time
    const { sendNotificationToUser } = (() => {
      try { return require('./messagingSocket'); } catch { return { sendNotificationToUser: () => {} }; }
    })();

    for (const b of waitlistedBookings) {
      try {
        const atts = await prisma.attendees.findMany({ where: { booking_id: b.id } });
        const notifyIds = [...new Set(atts.map(a => a.user_id || b.booker_user_id).filter(Boolean))] as string[];
        
        for (const nId of notifyIds) {
          sendNotificationToUser(nId, 'group.notification', {
            type: 'waitlist_closed',
            text: `The waitlist for <b>${event.title}</b> has been closed by the host. You have been removed from the waitlist.`,
            eventId: event.id
          });
          await prisma.notification_log.create({
            data: {
              user_id: nId,
              tenant_id: event.tenant_id,
              channel: 'app',
              template_key: 'event_waitlist_closed',
              status: 'queued',
              provider_ref: JSON.stringify({ eventId: event.id, eventTitle: event.title })
            }
          }).catch(() => {});
        }
      } catch {}
    }

    // Broadcast socket events to all connected clients for live UI update
    const groupsNamespace = (global as any).fastify?.io?.of('/groups');
    if (groupsNamespace) {
      // waitlist_closed: tells home-waitlist.tsx to switch to CLOSED state
      groupsNamespace.to(`event_${eventId}`).emit('waitlist_closed', { eventId });
      // Clear positions so My Events → Waitlist tab updates live
      groupsNamespace.to(`event_${eventId}`).emit('waitlist_positions_updated', { eventId, totalWaiting: 0, positions: [] });
      groupsNamespace.to(`event_${eventId}`).emit('waitlist_updated', { eventId });
      // Host dashboard refresh
      groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'waitlist_cleared', eventId });
    }
  }

  static async reconcileWaitlist(eventId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return;

    const capacity = (event.settings as any)?.capacity || {};
    if (capacity.waitlist !== true || capacity.limit !== true) {
      await this.broadcastWaitlistPositions(eventId);
      return;
    }

    // Count confirmed + pending_approval as both "occupying" a slot
    const occupiedCount = await prisma.bookings.count({
      where: { event_id: eventId, status: { in: ['confirmed', 'pending_payment'] } }
    });

    const availableSeats = capacity.max - occupiedCount;
    if (availableSeats <= 0) {
      await this.broadcastWaitlistPositions(eventId);
      return;
    }

    const waitlistCount = await prisma.bookings.count({
      where: { event_id: eventId, status: 'waitlisted' }
    });
    
    if (waitlistCount === 0) {
      await this.broadcastWaitlistPositions(eventId);
      return;
    }

    // Always promote from waitlist — if approval_required, promoteFromWaitlist
    // will set them to pending_approval and notify the host in real-time
    await this.promoteFromWaitlist(eventId, availableSeats);

    await this.broadcastWaitlistPositions(eventId);
  }


  static async leaveEvent(eventId: string, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    const isOwner = entityRows[0]?.user_id === userId;

    const topRoleKey = await this.getTopEventRoleKey();
    const topRole = topRoleKey ? await prisma.roles.findFirst({ where: { key: topRoleKey } }) : null;
    const hostAssignment = topRole ? await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, role_id: topRole.id, state: 'active' }
    }) : null;
    const isAssignedHost = hostAssignment?.user_id === userId;

    if (isOwner || isAssignedHost) {
      const otherHostsCount = topRole ? await prisma.event_team_assignments.count({
        where: {
          event_id: eventId,
          role_id: topRole.id,
          state: 'active',
          NOT: { user_id: userId }
        }
      }) : 0;
      if (otherHostsCount === 0) {
        throw new Error('Host cannot leave event without assigning another Host first.');
      }
    }

    await prisma.event_team_assignments.deleteMany({
      where: { event_id: eventId, user_id: userId }
    });

    let canceledConfirmedCount = 0;

    // 1. Cancel attendance for the user if they are a specific attendee (e.g. a guest)
    const userAttendees = await prisma.attendees.findMany({
      where: { 
        bookings: { event_id: eventId },
        user_id: userId,
        status: { in: ['pending', 'approved', 'checked_in', 'waitlisted'] }
      }
    });

    for (const att of userAttendees) {
      if (att.status === 'approved' || att.status === 'checked_in') canceledConfirmedCount++;
      await prisma.$transaction(async (tx) => {
        await tx.attendees.update({
          where: { id: att.id },
          data: { status: 'rejected' }
        });
        if (att.ticket_id) {
          await tx.tickets.update({
            where: { id: att.ticket_id },
            data: { status: 'cancelled' }
          });
        }
      });
    }

    // 2. If the user is the booker of any bookings, cancel those entirely
    const bookings = await prisma.bookings.findMany({
      where: { event_id: eventId, booker_user_id: userId, status: { not: 'cancelled' } }
    });
    
    for (const b of bookings) {
      if (b.status === 'confirmed' || b.status === 'pending_approval') {
        canceledConfirmedCount++;
      }
      await prisma.$transaction(async (tx) => {
        await tx.bookings.update({
          where: { id: b.id },
          data: { status: 'cancelled' }
        });
        const lineItems = await tx.booking_line_items.findMany({
          where: { booking_id: b.id }
        });
        const liIds = lineItems.map(li => li.id);
        await tx.tickets.updateMany({
          where: { line_item_id: { in: liIds } },
          data: { status: 'cancelled' }
        });
        await tx.attendees.updateMany({
          where: { booking_id: b.id, status: { not: 'rejected' } },
          data: { status: 'rejected' }
        });
      });
    }

    if (canceledConfirmedCount > 0) {
      await EventService.reconcileWaitlist(eventId);
    }
  }

  static async getWaitlistStatus(eventId: string, userId: string) {
    const totalWaiting = await prisma.bookings.count({ where: { event_id: eventId, status: 'waitlisted' } });
    const userBooking = await prisma.bookings.findFirst({
      where: { event_id: eventId, booker_user_id: userId, status: 'waitlisted' },
      select: { created_at: true }
    });
    let position = null;
    if (userBooking) {
      position = 1 + await prisma.bookings.count({
        where: {
          event_id: eventId,
          status: 'waitlisted',
          created_at: { lt: userBooking.created_at }
        }
      });
    }
    return {
      position,
      totalWaiting,
      isWaitlisted: position !== null
    };
  }

  static async leaveWaitlist(eventId: string, userId: string) {
    const booking = await prisma.bookings.findFirst({
      where: { event_id: eventId, booker_user_id: userId, status: 'waitlisted' }
    });
    if (!booking) return false;

    await prisma.$transaction(async (tx) => {
      await tx.bookings.update({
        where: { id: booking.id },
        data: { status: 'cancelled' }
      });
      const lineItems = await tx.booking_line_items.findMany({
        where: { booking_id: booking.id }
      });
      const liIds = lineItems.map(li => li.id);
      await tx.tickets.updateMany({
        where: { line_item_id: { in: liIds } },
        data: { status: 'cancelled' }
      });
    });

    await EventService.broadcastWaitlistPositions(eventId);

    return true;
  }

  static async getWaitlist(eventId: string) {
    const bookings = await prisma.bookings.findMany({
      where: { event_id: eventId, status: 'waitlisted' },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            primary_email: true,
            profile_image_data: true,
            profiles: { select: { display_name: true } }
          }
        },
        booking_line_items: {
          include: {
            ticket_types: {
              select: { name: true, price_amount_minor: true }
            }
          }
        }
      },
      orderBy: { created_at: 'asc' }
    });

    return bookings.map(b => ({
      id: b.id,
      created_at: b.created_at,
      user: b.users ? {
        id: b.users.id,
        display_name: b.users.profiles?.display_name || b.users.first_name || 'Guest',
        email: b.users.primary_email,
        picture: b.users.profile_image_data ? `data:image/jpeg;base64,${Buffer.from(b.users.profile_image_data).toString('base64')}` : null,
      } : null,
      ticket_type: b.booking_line_items?.[0]?.ticket_types?.name || 'General',
      price: Number(b.booking_line_items?.[0]?.ticket_types?.price_amount_minor || 0)
    }));
  }

  static async approveWaitlistedUser(eventId: string, targetUserId: string, approverUserId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const booking = await prisma.bookings.findFirst({
      where: { event_id: eventId, booker_user_id: targetUserId, status: 'waitlisted' }
    });
    if (!booking) throw new Error('Waitlisted booking not found for this user');

    const capacity = (event.settings as any)?.capacity || {};
    if (capacity.limit === true) {
      const confirmedCount = await prisma.bookings.count({
        where: { event_id: eventId, status: 'confirmed' }
      });
      if (confirmedCount >= capacity.max) {
        throw new Error('Capacity reached. Increase capacity or wait for someone to leave before approving more users.');
      }
    }

    const nextStatus = 'confirmed';
    const nextTicketStatus = 'confirmed';

    await prisma.$transaction(async (tx) => {
      await tx.bookings.update({
        where: { id: booking.id },
        data: { status: nextStatus }
      });
      const lineItems = await tx.booking_line_items.findMany({
        where: { booking_id: booking.id }
      });
      const liIds = lineItems.map(li => li.id);
      await tx.tickets.updateMany({
        where: { line_item_id: { in: liIds } },
        data: { status: nextTicketStatus }
      });
    });

    try {
      const { sendNotificationToUser } = require('./messagingSocket');
      sendNotificationToUser(targetUserId, 'notification.general', {
        title: 'Waitlist Approved',
        body: `Your waitlist request for ${event.title} was approved!`,
        link: `/events/${event.id}`
      });

      const groupsNamespace = (global as any).fastify?.io?.of('/groups');
      if (groupsNamespace) {
        groupsNamespace.to(`event_${eventId}`).emit('waitlist_updated', { eventId });
        groupsNamespace.to(`event_${eventId}`).emit('dashboard_updated', { action: 'approve-waitlist', eventId });
      }
      TicketRealtimeService.syncUser(targetUserId, eventId).catch(() => {});
      TicketRealtimeService.syncScanner(eventId).catch(() => {});
      const { MyEventsRealtimeService } = require('./MyEventsRealtimeService');
      MyEventsRealtimeService.syncUser(targetUserId).catch(() => {});
    } catch (e) { }

    await EventService.broadcastWaitlistPositions(eventId);

    return { success: true };
  }
}