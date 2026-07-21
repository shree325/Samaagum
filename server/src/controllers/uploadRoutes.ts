import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { R_users } from '../repositories/R_users';
import { R_profiles } from '../repositories/R_profiles';
import prisma from '../config/prisma';

export const uploadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

  const userRepo = new R_users(prisma);
  const profileRepo = new R_profiles(prisma);

  fastify.post('/upload-profile-photo', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'Unauthorized: No valid user token provided.' });
      }

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: 'Missing file error' });
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(data.mimetype)) {
        return reply.status(400).send({ success: false, message: 'Invalid image format error' });
      }

      const buffer = await data.toBuffer();
      const base64Str = buffer.toString('base64');
      const imageUrl = `data:${data.mimetype};base64,${base64Str}`;

      const dbUser = await userRepo.getById(request.user.id);

      if (dbUser && dbUser.id) {
        // Store image bytes directly on the users row
        await userRepo.update(dbUser.id, {
          profile_image_data: buffer as any,
          updated_at: new Date()
        } as any);

        // Also keep profiles.profile_image_data in sync
        const existingProfile = await profileRepo.getByUserId(dbUser.id);
        if (existingProfile) {
          await profileRepo.update(dbUser.id, {
            profile_image_data: buffer as any,
            updated_at: new Date()
          } as any);
        } else {
          await profileRepo.create({
            user_id: dbUser.id,
            tenant_id: dbUser.tenant_id,
            profile_image_data: buffer as any,
            created_at: new Date(),
            updated_at: new Date()
          } as any);
        }
      }

      return {
        success: true,
        message: 'Upload successful',
        imageUrl
      };
    } catch (error: any) {
      console.error('Upload Error:', error);
      return reply.status(500).send({ success: false, message: 'Upload failure error or Database update failure error', error: error.message });
    }
  });

  fastify.post('/upload-group-media', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
    try {
      if (!request.user || !request.user.id) {
        return reply.status(401).send({ success: false, message: 'Unauthorized' });
      }

      if (!request.isMultipart || !request.isMultipart()) {
        return reply.status(400).send({ success: false, message: 'Form data is required for file upload' });
      }

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, message: 'Missing file error' });
      }

      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/ogg',
        'video/x-matroska',
        'video/3gpp',
        'video/3gpp2',
        'video/x-msvideo'
      ];
      if (!validTypes.includes(data.mimetype)) {
        return reply.status(400).send({ success: false, message: 'Invalid file format error' });
      }

      const buffer = await data.toBuffer();
      const base64Str = buffer.toString('base64');
      const imageUrl = `data:${data.mimetype};base64,${base64Str}`;

      return {
        success: true,
        message: 'Upload successful',
        imageUrl
      };
    } catch (error: any) {
      console.error('Group Media Upload Error:', error);
      return reply.status(500).send({ success: false, message: 'Upload failed', error: error.message });
    }
  });
};
