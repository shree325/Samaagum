import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';
import { locationService } from '../services/locationService';

export const publicRoutes = async (fastify: FastifyInstance) => {

  // Location search
  fastify.get('/locations/search', async (request: any, reply: any) => {
    try {
      const { q } = request.query;
      if (!q || typeof q !== 'string') {
        return { success: true, data: [] };
      }
      const data = locationService.search(q, 10);
      return { success: true, data };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Search failed' });
    }
  });

  // Active locations for client-side filtering
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
      const categories = await prisma.categories.findMany({
        orderBy: { name: 'asc' }
      });
      return {
        success: true,
        data: categories
      };
    } catch (error: any) {
      return reply.status(500).send({ success: false, message: error.message || 'Failed to fetch categories.' });
    }
  });

  // Virtual Card fetch
  fastify.get('/card/:username', async (request: any, reply: any) => {
    try {
      const { username } = request.params;
      // Find user by primary_email starting with username@
      const user = await prisma.users.findFirst({
        where: {
          primary_email: {
            startsWith: `${username}@`
          }
        },
        include: {
          profiles: true,
          profile_links: true,
        }
      });

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

};
