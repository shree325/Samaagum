import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';
import { sendEmail } from '../utils/email';
import { TicketNotificationService } from '../services/TicketNotificationService';
import crypto from 'crypto';

export const ticketRoutes = async (fastify: FastifyInstance) => {

  // GET /api/tickets/claim/:token
  fastify.get('/claim/:token', async (request: any, reply: any) => {
    try {
      const { token } = request.params;
      const claim = await prisma.ticket_claims.findUnique({
        where: { token },
        include: {
          tickets: {
            include: {
              booking_line_items: {
                include: {
                  ticket_types: true,
                  bookings: { include: { events: true } }
                }
              }
            }
          }
        }
      });

      if (!claim) {
        return reply.status(404).send({ success: false, message: 'Invalid claim link.' });
      }
      if (claim.state === 'claimed') {
        return reply.status(200).send({ success: true, claimed: true, message: 'Ticket has already been claimed.' });
      }
      if (claim.expires_at && new Date() > claim.expires_at) {
        return reply.status(400).send({ success: false, message: 'Claim link has expired.' });
      }

      const attendee = await prisma.attendees.findFirst({
        where: { ticket_id: claim.ticket_id },
        include: {
          bookings: {
            include: {
              users: {
                include: {
                  profiles: true
                }
              }
            }
          }
        }
      });
      if (!attendee) {
        return reply.status(404).send({ success: false, message: 'Attendee not found.' });
      }
      if ((attendee as any).status !== 'approved') {
        return reply.status(400).send({ success: false, message: 'This ticket is not approved yet.' });
      }
      if (attendee.bookings.status === 'cancelled') {
        return reply.status(400).send({ success: false, message: 'This booking has been cancelled.' });
      }

      const event = claim.tickets?.booking_line_items?.bookings?.events;
      const attendeeEmail = claim.tickets?.attendee_email;

      return {
        success: true,
        claimed: false,
        data: {
          eventId: event?.id,
          eventTitle: event?.title,
          cover: (event as any)?.cover,
          startsAt: event?.starts_at,
          attendeeEmail,
          ticketName: claim.tickets?.attendee_name,
          ticketType: claim.tickets?.booking_line_items?.ticket_types?.name,
          purchaserName: (() => {
            const users = (attendee.bookings as any)?.users;
            const profiles = users?.profiles;
            const displayName = Array.isArray(profiles) ? profiles[0]?.display_name : profiles?.display_name;
            return displayName || users?.first_name || 'Organizer';
          })()
        }
      };
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: 'Failed to load claim details.' });
    }
  });

  // POST /api/tickets/claim/otp/send
  fastify.post('/claim/otp/send', async (request: any, reply: any) => {
    try {
      const { token } = request.body;
      const claim = await prisma.ticket_claims.findUnique({
        where: { token },
        include: { tickets: true }
      });

      if (!claim || claim.state === 'claimed' || (claim.expires_at && new Date() > claim.expires_at)) {
        return reply.status(400).send({ success: false, message: 'Invalid or expired claim link.' });
      }

      const attendee = claim.tickets ? await prisma.attendees.findFirst({
        where: { ticket_id: claim.tickets.id },
        include: { bookings: true }
      }) : null;
      if (!attendee) {
        return reply.status(404).send({ success: false, message: 'Attendee not found.' });
      }
      if ((attendee as any).status !== 'approved') {
        return reply.status(400).send({ success: false, message: 'This ticket is not approved yet.' });
      }
      if (attendee.bookings.status === 'cancelled') {
        return reply.status(400).send({ success: false, message: 'This booking has been cancelled.' });
      }

      const email = attendee.email;

      if (!email) {
         return reply.status(400).send({ success: false, message: 'Ticket has no associated email.' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.$executeRawUnsafe(
        `DELETE FROM otp_verifications WHERE email = $1 AND purpose = 'ticket_claim'`,
        email
      );

      await prisma.$executeRawUnsafe(
        `INSERT INTO otp_verifications (id, email, otp_hash, purpose, expires_at, attempts, verified, created_at)
         VALUES (gen_random_uuid(), $1, $2, 'ticket_claim', $3, 0, false, now())`,
        email, otp, expiresAt
      );

      await sendEmail({
        to: email,
        subject: `Your OTP for claiming ticket`,
        html: `Your OTP is <b>${otp}</b>. It is valid for 10 minutes.`
      });

      return { success: true, message: 'OTP sent successfully.' };
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: 'Failed to send OTP.' });
    }
  });

  // POST /api/tickets/claim/otp/verify
  fastify.post('/claim/otp/verify', { preHandler: [(fastify as any).optionalAuthenticate] }, async (request: any, reply: any) => {
    try {
      const { token, otp } = request.body;
      const claim = await prisma.ticket_claims.findUnique({
        where: { token },
        include: { tickets: true }
      });

      if (!claim || claim.state === 'claimed' || (claim.expires_at && new Date() > claim.expires_at)) {
        return reply.status(400).send({ success: false, message: 'Invalid or expired claim link.' });
      }

      const attendee = await prisma.attendees.findFirst({
        where: { ticket_id: claim.ticket_id },
        include: { bookings: true }
      });
      if (!attendee) {
        return reply.status(404).send({ success: false, message: 'Attendee not found.' });
      }
      if ((attendee as any).status !== 'approved') {
        return reply.status(400).send({ success: false, message: 'This ticket is not approved yet.' });
      }
      if (attendee.bookings.status === 'cancelled') {
        return reply.status(400).send({ success: false, message: 'This booking has been cancelled.' });
      }

      const email = attendee.email;
      if (!email) return reply.status(400).send({ success: false, message: 'Ticket has no associated email.' });

      // Case B: Logged in user email matches ticket email
      const isMatchedLoggedIn = request.user && request.user.email.toLowerCase() === email.toLowerCase();

      if (!isMatchedLoggedIn) {
        // If not matched, we require valid OTP (Case A or Case C)
        if (!otp) {
          return reply.status(400).send({ success: false, message: 'OTP is required.' });
        }
        const verifications = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM otp_verifications WHERE email = $1 AND purpose = 'ticket_claim' ORDER BY created_at DESC LIMIT 1`,
          email
        );

        const verification = verifications[0];
        if (!verification) {
          return reply.status(400).send({ success: false, message: 'No OTP found. Please request a new one.' });
        }
        if (new Date() > new Date(verification.expires_at)) {
          return reply.status(400).send({ success: false, message: 'OTP expired.' });
        }
        if (verification.attempts >= 5) {
          return reply.status(400).send({ success: false, message: 'Too many attempts. Request a new OTP.' });
        }
        if (verification.otp_hash !== otp) {
          await prisma.$executeRawUnsafe(`UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = $1`, verification.id);
          return reply.status(400).send({ success: false, message: 'Invalid OTP.' });
        }

        await prisma.$executeRawUnsafe(`UPDATE otp_verifications SET verified = true WHERE id = $1`, verification.id);
      }

      // Find or create the user to link:
      // If request.user exists, link to the currently logged in user (Cases B and C).
      // Otherwise (Case A), find or create the user by the ticket's email.
      let user: any = null;
      if (request.user) {
        user = await prisma.users.findUnique({ where: { id: request.user.id } });
      } else {
        user = await prisma.users.findFirst({
          where: { primary_email: { equals: email, mode: 'insensitive' } }
        });
      }

      if (!user) {
        user = await prisma.users.create({
          data: {
            tenant_id: claim.tenant_id,
            primary_email: email.toLowerCase().trim(),
            email_verified: true,
            profile_completed: true,
            state: 'active' as any,
            first_name: attendee?.name?.split(' ')[0] || null,
            last_name: attendee?.name?.split(' ').slice(1).join(' ') || null,
            gender: attendee?.gender || null,
            dob: attendee?.dob || null,
            phone_number: attendee?.phone || null,
            profiles: {
              create: {
                tenant_id: claim.tenant_id,
                display_name: attendee?.name || email.split('@')[0],
                first_name: attendee?.name?.split(' ')[0] || null,
                last_name: attendee?.name?.split(' ').slice(1).join(' ') || null,
                phone_number: attendee?.phone || null,
              }
            }
          }
        });
      }

      // Get the booking/event context before the transaction
      const lineItemForClaim = await prisma.booking_line_items.findUnique({ where: { id: claim.tickets!.line_item_id } });
      const bookingForClaim = lineItemForClaim ? await prisma.bookings.findUnique({ where: { id: lineItemForClaim.booking_id } }) : null;
      const eventForClaim = bookingForClaim ? await prisma.events.findUnique({ where: { id: bookingForClaim.event_id } }) : null;

      // Update ticket, claim, attendee, user email_verified, and booking status all in one transaction
      await prisma.$transaction(async (tx: any) => {
        // 1. Link ticket to the verified user
        await tx.tickets.update({
          where: { id: claim.ticket_id },
          data: {
            claimed_by_user_id: user.id,
            status: 'confirmed'   // ensure ticket is confirmed
          }
        });

        // 2. Mark claim as used
        await tx.ticket_claims.update({
          where: { id: claim.id },
          data: { state: 'claimed', claimed_at: new Date() }
        });

        // 3. Link attendee to verified user and ensure approved
        await tx.attendees.updateMany({
          where: { ticket_id: claim.ticket_id },
          data: { user_id: user.id, status: 'approved' }
        });

        // 4. Mark the user's email as verified (converts provisional guest → full member)
        await tx.users.update({
          where: { id: user.id },
          data: { email_verified: true, profile_completed: true }
        });

        // 5. Confirm the booking so the event page shows them as a normal confirmed member
        if (bookingForClaim && bookingForClaim.status === 'pending_approval') {
          await tx.bookings.update({
            where: { id: bookingForClaim.id },
            data: { status: 'confirmed' }
          });
        }
      });

      // Send the confirmed ticket email
      if (claim.tickets && eventForClaim && bookingForClaim) {
        const tk = claim.tickets;
        const attendeeAfterClaim = await prisma.attendees.findFirst({ where: { ticket_id: tk.id } });
        if (attendeeAfterClaim) {
          await TicketNotificationService.sendTicketEmail(tk, attendeeAfterClaim, eventForClaim, bookingForClaim);
        }
      }

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({
        id: user.id,
        email: user.primary_email,
        role: 'user',
        tenantId: user.tenant_id
      })).toString('base64');
      const authToken = `${header}.${payload}.mocksignature`;

      return { 
         success: true, 
         message: 'Ticket claimed successfully!',
         token: authToken
      };
    } catch (err: any) {
      console.error(err);
      return reply.status(500).send({ success: false, message: 'Failed to verify OTP.' });
    }
  });

};
