import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';

export const uploadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

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

      const dbUser = await prisma.users.findUnique({
        where: { id: request.user.id }
      });

      if (dbUser) {
        // Store image bytes directly on the users row
        await prisma.users.update({
          where: { id: dbUser.id },
          data: {
            profile_image_data: buffer,
            updated_at: new Date()
          }
        });

        // Also keep profiles.profile_image_data in sync
        await prisma.profiles.upsert({
          where: { user_id: dbUser.id },
          update: {
            profile_image_data: buffer,
            updated_at: new Date()
          },
          create: {
            user_id: dbUser.id,
            tenant_id: dbUser.tenant_id,
            profile_image_data: buffer,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
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
};
