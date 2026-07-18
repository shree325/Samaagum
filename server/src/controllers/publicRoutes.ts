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
      
      const enriched = await Promise.all(categories.map(async (c: any) => {
        const count = await prisma.groups.count({
          where: { category: c.name }
        });
        return {
          id: c.id,
          name: c.name,
          icon: c.icon_value || c.icon || "📁",
          icon_value: c.icon_value || c.icon || "📁",
          groupCount: count,
          status: c.status || 'active',
          is_deleted: c.is_deleted || false
        };
      }));

      return {
        success: true,
        data: enriched
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch categories.' });
    }
  });

  // Get dynamic database statistics
  fastify.get('/statistics', async (request, reply) => {
    try {
      const userCount = await prisma.users.count();
      const groupCount = await prisma.groups.count();
      const eventCount = await prisma.events.count();
      
      let cityCount = 0;
      try {
        const activeCities = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COUNT(DISTINCT city_name) as count FROM city_controls WHERE is_active = true`
        );
        cityCount = Number(activeCities[0]?.count || 0);
      } catch (err) {
        cityCount = 0;
      }

      const formatStat = (count: number, defaultSuffix = "+") => {
        if (count >= 1000) {
          const val = Math.round(count / 100) / 10;
          return {
            value: val,
            suffix: "K+",
            decimals: val % 1 === 0 ? 0 : 1
          };
        }
        return {
          value: count,
          suffix: defaultSuffix,
          decimals: 0
        };
      };

      const members = formatStat(userCount, "+");
      const groups = formatStat(groupCount, "+");
      const events = formatStat(eventCount, "+");
      const cities = formatStat(cityCount, "+");

      return {
        success: true,
        data: [
          { id: "s1", value: members.value, suffix: members.suffix, decimals: members.decimals, label: "Members worldwide", c1: "#ff6b4a", c2: "#ff4d8d" },
          { id: "s2", value: groups.value, suffix: groups.suffix, decimals: groups.decimals, label: "Active Groups", c1: "#6d5efc", c2: "#2a7fff" },
          { id: "s3", value: events.value, suffix: events.suffix, decimals: events.decimals, label: "Events hosted", c1: "#10b981", c2: "#22d3ee" },
          { id: "s4", value: cities.value, suffix: cities.suffix, decimals: cities.decimals, label: "Cities & growing", c1: "#f59e0b", c2: "#ef6f53" }
        ]
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch statistics.' });
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

  // Global search for public events and groups
  fastify.get('/global-search', async (request: any, reply: any) => {
    try {
      const { q } = request.query;
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return { success: true, data: { events: [], groups: [] } };
      }
      const searchStr = q.trim().toLowerCase();

      // Search public events
      const allEvents = await prisma.events.findMany({
        where: {
          status: 'published',
          title: { contains: searchStr, mode: 'insensitive' }
        },
        take: 20
      });
      const publicEvents = allEvents.filter((ev: any) => {
        const venue = ev.venue ? (typeof ev.venue === 'string' ? JSON.parse(ev.venue) : ev.venue) : {};
        const visibility = venue.visibility || 'public';
        return visibility === 'public';
      }).slice(0, 5);

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

  // Public featured events for landing page
  fastify.get('/featured-events', async (request, reply) => {
    try {
      const events = await prisma.events.findMany({
        where: {
          status: 'published',
          starts_at: { gt: new Date() }
        },
        orderBy: { starts_at: 'asc' },
        take: 12
      });

      const enriched = await Promise.all(events.map(async (ev: any) => {
        const attendeeCount = await prisma.attendees.count({
          where: {
            bookings: {
              event_id: ev.id,
              status: 'confirmed'
            }
          }
        });
        const venueObj = ev.venue ? (typeof ev.venue === 'string' ? JSON.parse(ev.venue) : ev.venue) : {};
        const visibility = venueObj?.visibility || 'public';
        if (visibility !== 'public') return null;

        // Extract speaker / host info if present
        let hostName = 'Samaagum Host';
        try {
          const hostInfo = await EventService.resolveHostInfo(ev.hosted_by_entity_id).catch(() => null);
          if (hostInfo && hostInfo.hostName) {
            hostName = hostInfo.hostName;
          }
        } catch (e) {}

        return {
          id: ev.id,
          title: ev.title,
          cover: venueObj?.meta?.cover || null,
          starts_at: ev.starts_at,
          location_type: ev.location_type,
          loc: venueObj?.name || venueObj?.address || 'Venue TBA',
          attendeeCount,
          category: venueObj?.meta?.category || 'Meetup',
          isFree: String(ev.registration_mode) === 'free' || String(ev.registration_mode) === 'free_rsvp',
          price: String(ev.registration_mode) === 'free' ? 'Free' : 'Paid',
          speaker: venueObj?.meta?.speaker || null,
          duration: venueObj?.meta?.duration || null,
          host: hostName
        };
      }));

      return { success: true, data: enriched.filter(Boolean).slice(0, 6) };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch featured events' });
    }
  });

  // Public popular groups for landing page
  fastify.get('/popular-groups', async (request, reply) => {
    try {
      const groups = await prisma.groups.findMany({
        where: {
          entities: {
            visibility: 'public'
          }
        },
        include: {
          entities: true
        },
        take: 20
      });

      const enriched = await Promise.all(groups.map(async (g: any) => {
        const settings = g.settings ? (typeof g.settings === 'string' ? JSON.parse(g.settings) : g.settings) : {};
        if (settings.isDraft || settings.isArchived) return null;

        const memberCount = await prisma.group_memberships.count({
          where: {
            group_id: g.entity_id,
            state: 'active'
          }
        });

        const id = g.entity_id;
        const bannerUrl = g.banner_data ? `/api/groups/${id}/banner` : (g.banner && !g.banner.startsWith('blob:') ? g.banner : null);
        const iconUrl = g.icon_data ? `/api/groups/${id}/icon` : (g.icon && !g.icon.startsWith('blob:') ? g.icon : null);

        return {
          id: g.entity_id,
          name: g.name,
          desc: g.description || 'Join our group to learn, share, and connect with like-minded individuals.',
          logo: iconUrl || g.icon || '👥',
          cover: bannerUrl || g.cover || null,
          members: memberCount,
          category: g.category || 'General',
          tags: g.settings?.tags || []
        };
      }));

      const filtered = enriched.filter(Boolean);
      filtered.sort((a: any, b: any) => b.members - a.members);

      return { success: true, data: filtered.slice(0, 6) };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch popular groups' });
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
          displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || profile?.display_name || '',
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
