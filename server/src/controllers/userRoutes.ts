import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';

export const userRoutes = async (fastify: FastifyInstance) => {
  // GET /api/users/lookup?email=...&eventId=...
  fastify.get('/lookup', async (request: any, reply: any) => {
    try {
      const email = request.query.email?.toString().toLowerCase().trim();
      const eventId = request.query.eventId?.toString();

      if (!email) {
        return reply.status(400).send({ success: false, message: 'Email is required' });
      }

      // Check if user exists
      const user = await prisma.users.findFirst({
        where: { primary_email: { equals: email, mode: 'insensitive' } },
        include: { profiles: true }
      });

      if (!user) {
        return { success: true, exists: false };
      }

      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const name = user.profiles?.display_name || fullName || '';
      const gender = user.gender || '';

      let hasTicket = false;
      if (eventId) {
        // Check if user already has a ticket for this event
        const ticket = await prisma.tickets.findFirst({
          where: {
            claimed_by_user_id: user.id,
            booking_line_items: {
              bookings: {
                event_id: eventId,
                status: { in: ['confirmed', 'pending_approval', 'waitlisted', 'pending_payment'] }
              }
            }
          }
        });
        if (ticket) hasTicket = true;
      }

      return {
        success: true,
        exists: true,
        name,
        gender,
        hasTicket
      };

    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ success: false, message: 'Lookup failed' });
    }
  });
};
