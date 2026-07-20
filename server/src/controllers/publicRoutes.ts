import { FastifyInstance } from 'fastify';
import { R_categories } from '../repositories/R_categories';
import { R_cityControls } from '../repositories/R_cityControls';
import { R_groups } from '../repositories/R_groups';
import { R_users } from '../repositories/R_users';
import { ICategory } from '../repositories/IR_categories';
import { ICityControl } from '../repositories/ICityControl';
import prisma from '../config/prisma';
import { locationService } from '../services/locationService';
import { EventService } from '../services/EventService';

// Best-effort JWT decode helper — mirrors the one in dashboardRoutes.ts
function tryDecodeUserId(request: any): string | undefined {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;
  try {
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    const uid = payload?.id;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uid && UUID_REGEX.test(uid)) return uid;
    return undefined;
  } catch {
    return undefined;
  }
}

export const publicRoutes = async (fastify: FastifyInstance) => {
  const categoryRepo = new R_categories();
  const cityRepo = new R_cityControls();
  const groupRepo = new R_groups();
  const userRepo = new R_users(prisma);

  // Location search
  fastify.get('/locations/search', async (request: any, reply: any) => {
    try {
      const { q } = request.query;
      if (!q || typeof q !== 'string') {
        return { success: true, data: [] };
      }
      const data = await locationService.search(q, 10);
      return { success: true, data };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Search failed' });
    }
  });

  // Active locations for client-side filtering
  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok', version: '2026-07-08T07:04:00Z' });
  });

  fastify.get('/locations/active', async (request, reply) => {
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT geoname_id, city_name, state_name, country_name, latitude, longitude
         FROM city_controls
         WHERE is_active = true
         ORDER BY city_name ASC`
      );
      
      const serializedRows = rows.map((row: any) => ({
        ...row,
        geoname_id: typeof row.geoname_id === 'bigint' ? Number(row.geoname_id) : row.geoname_id
      }));

      return { success: true, data: serializedRows };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch active locations' });
    }
  });

  // Public feature flags
  fastify.get('/features', async (request, reply) => {
    try {
      const row = await prisma.platform_settings.findFirst({
        where: { key: 'feature_settings' }
      });
      const settings = row?.value || { location_active: true };
      return { success: true, data: settings };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch features.' });
    }
  });

  // Get all categories/interests
  fastify.get('/categories', async (request, reply) => {
    try {
      const categories = await categoryRepo.findAll();
      // Sort alphabetically in JS since findAll doesn't accept order directly
      categories.sort((a: ICategory, b: ICategory) => (a.name || '').localeCompare(b.name || ''));
      return {
        success: true,
        data: categories
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch categories.' });
    }
  });

  // Get all active cities/locations
  fastify.get('/cities', async (request, reply) => {
    try {
      const result = await cityRepo.findAll({ status: 'active', limit: 1000 });
      const cities = result.data;
      return {
        success: true,
        data: cities.map((c: ICityControl) => ({
          geoname_id: c.geoname_id.toString(),
          city_name: c.city_name,
          state_name: c.state_name,
          country_name: c.country_name,
          latitude: c.latitude,
          longitude: c.longitude
        }))
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch cities.' });
    }
  });

  // Groups hierarchy for access control selector
  fastify.get('/groups-hierarchy', async (request, reply) => {
    try {
      const groups = await groupRepo.getPublicGroupsForHierarchy();

      const published = groups.filter((g: any) => {
        const s = (g.settings as any) || {};
        return !s.isDraft && !s.isArchived;
      });

      const byCategory: { [key: string]: any[] } = {};
      for (const g of published) {
        const cat = g.category || 'General';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push({ id: g.entity_id, name: g.name });
      }

      const communities = Object.entries(byCategory).map(([name, grps]) => ({
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name,
        groups: grps
      }));

      return { success: true, data: { communities } };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch groups hierarchy' });
    }
  });

  // Global search for public + eligible events and groups
  fastify.get('/global-search', async (request: any, reply: any) => {
    try {
      const { q } = request.query;
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return { success: true, data: { events: [], groups: [] } };
      }
      const searchStr = q.trim().toLowerCase();

      // Resolve authenticated user (if a token is present)
      const userId = tryDecodeUserId(request);
      // Pre-fetch group memberships once to avoid N+1 queries across event visibility checks
      const userGroupSet = userId
        ? await EventService.fetchUserGroupSet(userId).catch(() => new Set<string>())
        : new Set<string>();

      // Search published events matching the query
      const allEvents = await prisma.events.findMany({
        where: {
          status: 'published',
          title: { contains: searchStr, mode: 'insensitive' }
        },
        take: 20
      });

      // Filter by visibility: authenticated users see events they are eligible for.
      // discoveryMode=true skips the booking bypass — leaving a group removes
      // that group's events from search results immediately.
      const eligibleEvents: typeof allEvents = [];
      for (const ev of allEvents) {
        const allowed = await EventService.canUserAccessEvent(ev, userId, userGroupSet, true);
        if (allowed) eligibleEvents.push(ev);
      }
      const publicEvents = eligibleEvents.slice(0, 5);

      const enrichedEvents = await Promise.all(publicEvents.map(async (e: any) => {
        const attendeeCount = await prisma.attendees.count({
          where: {
            bookings: {
              event_id: e.id,
              status: 'confirmed'
            }
          }
        });
        const venueObj = e.venue ? (typeof e.venue === 'string' ? JSON.parse(e.venue) : e.venue) : {};
        return {
          id: e.id,
          title: e.title,
          cover: venueObj?.meta?.cover || null,
          attendeeCount
        };
      }));

      // Search public groups
      const allGroups = await prisma.groups.findMany({
        where: {
          name: { contains: searchStr, mode: 'insensitive' },
          entities: {
            visibility: 'public'
          }
        },
        include: {
          entities: true
        },
        take: 20
      });
      const publicGroups = allGroups.filter((g: any) => {
        const settings = g.settings ? (typeof g.settings === 'string' ? JSON.parse(g.settings) : g.settings) : {};
        return !settings.isDraft && !settings.isArchived;
      }).slice(0, 5);

      const enrichedGroups = await Promise.all(publicGroups.map(async (g: any) => {
        const memberCount = await prisma.group_memberships.count({
          where: {
            group_id: g.entity_id,
            state: 'active'
          }
        });
        return {
          id: g.entity_id,
          name: g.name,
          icon: g.icon,
          memberCount
        };
      }));

      return {
        success: true,
        data: {
          events: enrichedEvents,
          groups: enrichedGroups
        }
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Search failed' });
    }
  });

  // IP-based location detection
  fastify.get('/detect-location', async (request: any, reply: any) => {
    try {
      const ip = request.ip;
      const detected = await locationService.detectByIp(ip);
      return { success: true, data: detected };
    } catch (error: any) {
      fastify.log.warn('IP location detection failed: ' + error.message);
      return { success: true, data: null };
    }
  });

  // Virtual Card fetch
  fastify.get('/card/:username', async (request: any, reply: any) => {
    try {
      const { username } = request.params;
      // Find user by primary_email starting with username@
      const user = await userRepo.findByUsernamePrefixWithProfile(username);

      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      const profile = user.profiles ? (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles) : null;

      // Convert BYTEA profile image to base64 data-URI
      // Primary source: users.profile_image_data; fallback: profiles.profile_image_data
      let profilePhotoUrl = '';
      if (user.profile_image_data) {
        profilePhotoUrl = `data:image/jpeg;base64,${Buffer.from(user.profile_image_data).toString('base64')}`;
      } else if (profile?.profile_image_data) {
        profilePhotoUrl = `data:image/jpeg;base64,${Buffer.from(profile.profile_image_data).toString('base64')}`;
      }

      return {
        success: true,
        data: {
          profile_photo: profilePhotoUrl,
          full_name: [user.first_name, user.last_name].filter(Boolean).join(' ') || profile?.display_name || '',
          role: profile?.template_key || '',
          bio: profile?.bio || '',
          email: user.primary_email || '',
          phone: user.phone_number || user.phone_e164 || profile?.phone_number || '',
          gender: profile?.gender || user.gender || '',
          dob: profile?.dob || user.dob || '',
          location: user.location || profile?.preferred_location || '',
          socialLinks: user.profile_links || []
        }
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch card' });
    }
  });

  // Public profile details fetch by user ID
  fastify.get('/profile/:userId', async (request: any, reply: any) => {
    try {
      const { userId } = request.params;
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          profiles: true,
          profile_links: true,
        }
      });

      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found' });
      }

      const profile = user.profiles ? (Array.isArray(user.profiles) ? user.profiles[0] : user.profiles) : null;

      let profilePhotoUrl = '';
      if (user.profile_image_data) {
        profilePhotoUrl = `data:image/jpeg;base64,${Buffer.from(user.profile_image_data).toString('base64')}`;
      } else if (profile?.profile_image_data) {
        profilePhotoUrl = `data:image/jpeg;base64,${Buffer.from(profile.profile_image_data).toString('base64')}`;
      }

      let coverBannerUrl = '';
      if (profile?.cover_image_data) {
        coverBannerUrl = `data:image/jpeg;base64,${Buffer.from(profile.cover_image_data).toString('base64')}`;
      }

      // Determine if the requester is the profile owner themselves.
      // Privacy field-visibility applies to EVERY other visitor — connected or
      // not — so only the owner ever sees their own unfiltered profile.
      let isOwner = false;
      try {
        const header = request.headers.authorization || '';
        if (header.startsWith('Bearer ')) {
          const token = header.slice(7);
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
          const visitorUserId = payload.sub || payload.userId || payload.id;
          if (visitorUserId && visitorUserId === userId) {
            isOwner = true;
          }
        }
      } catch (e) {
        // Ignore token decode errors — treat as anonymous visitor
      }

      const privacyPrefs = (profile?.privacy_prefs as any) || {};
      const profileVisibility = privacyPrefs.profileVisibility || 'public';
      const privateProfileMode = privacyPrefs.privateProfileMode || 'hide_all';
      const visibleFields = privacyPrefs.visibleFields || {
        email: false,
        phone: false,
        location: true,
        gender: false,
        dob: false,
        socialLinks: true,
        virtualCard: true
      };

      let finalEmail = user.primary_email || '';
      let finalPhone = user.phone_number || user.phone_e164 || profile?.phone_number || '';
      let finalLocation = user.location || profile?.preferred_location || '';
      let finalGender = profile?.gender || user.gender || '';
      let finalDob = profile?.dob || user.dob || '';
      let finalHeadline = profile?.headline || profile?.template_key || '';
      let finalBio = profile?.bio || '';
      let finalSkills = profile?.skills || [];
      let finalSocialLinks = user.profile_links || [];
      let finalProfilePhoto = profilePhotoUrl;
      let finalCoverBanner = coverBannerUrl;
      let showVirtualCard = true;

      if (!isOwner && profileVisibility === 'private') {
        if (privateProfileMode === 'hide_all') {
          finalEmail = '';
          finalPhone = '';
          finalLocation = '';
          finalGender = '';
          finalDob = '';
          finalHeadline = '';
          finalBio = '';
          finalSkills = [];
          finalSocialLinks = [];
          // Keep profile photo visible even if profile is private
          finalCoverBanner = '';
          showVirtualCard = false;
        } else if (privateProfileMode === 'custom_fields') {
          if (!visibleFields.email) finalEmail = '';
          if (!visibleFields.phone) finalPhone = '';
          if (!visibleFields.location) finalLocation = '';
          if (!visibleFields.gender) finalGender = '';
          if (!visibleFields.dob) finalDob = '';
          if (!visibleFields.socialLinks) finalSocialLinks = [];
          showVirtualCard = visibleFields.virtualCard !== false;
        }
      }

      return {
        success: true,
        data: {
          id: user.id,
          user_id: user.id,
          displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || profile?.display_name || profile?.user_name || user.primary_email?.split('@')[0] || 'User',
          headline: finalHeadline,
          bio: finalBio,
          email: finalEmail,
          phone: finalPhone,
          gender: finalGender,
          dob: finalDob,
          location: finalLocation,
          profilePhoto: finalProfilePhoto,
          coverBanner: finalCoverBanner,
          skills: finalSkills,
          socialLinks: finalSocialLinks,
          showVirtualCard,
          privacyPrefs: profile?.privacy_prefs || null
        }
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch profile' });
    }
  });

  // Serve India districts GeoJSON boundary data from the database
  fastify.get('/maps/india-districts', async (request, reply) => {
    try {
      const row = await prisma.platform_settings.findFirst({
        where: { key: 'india_districts_geojson' }
      });
      if (!row) {
        return reply.status(404).send({ success: false, message: 'GeoJSON data not found in database. Please run the seeder script.' });
      }
      return row.value; // Returns the raw geojson structure directly
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to retrieve map data from database.' });
    }
  });

};
