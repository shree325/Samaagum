import { FastifyInstance } from 'fastify';
import { R_categories } from '../repositories/R_categories';
import { R_cityControls } from '../repositories/R_cityControls';
import { R_groups } from '../repositories/R_groups';
import { R_users } from '../repositories/R_users';
import prisma from '../config/prisma';

export const publicRoutes = async (fastify: FastifyInstance) => {

  const categoryRepo = new R_categories();
  const cityRepo = new R_cityControls();
  const groupRepo = new R_groups();
  const userRepo = new R_users(prisma);

  // Get all categories/interests
  fastify.get('/categories', async (request, reply) => {
    try {
      const categories = await categoryRepo.findAll();
      // Sort alphabetically in JS since findAll doesn't accept order directly
      categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
        data: cities.map(c => ({
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

};
