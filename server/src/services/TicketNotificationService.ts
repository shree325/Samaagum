import prisma from '../config/prisma';
import { sendEmail, generateTicketHtml, formatCurrency } from '../utils/email';

export class TicketNotificationService {

  static async notifyBuyer(
    booking: any,
    event: any,
    buyerEmail: string,
    buyerName: string,
    status: 'submitted' | 'approved' | 'rejected' | 'waitlisted' | 'payment_success'
  ) {
    if (!buyerEmail) return;

    let subject = '';
    let html = '';

    const eventName = event.title;
    const bookingIdCode = booking?.id ? 'BKG-' + booking.id.split('-')[0].toUpperCase() : '';
    const bookingIdHtml = bookingIdCode ? `<p style="margin-top: 15px; padding: 10px; background-color: #f3f4f6; border-radius: 8px; display: inline-block;">Booking ID: <b>${bookingIdCode}</b></p>` : '';

    switch (status) {
      case 'submitted':
        subject = `Booking request submitted for ${eventName}`;
        html = `<h3>Booking request submitted</h3>
                <p>Hi ${buyerName},</p>
                <p>Your booking request for <b>${eventName}</b> has been received and is pending host approval.</p>
                <p>You will be notified once the host approves or rejects your booking.</p>
                ${bookingIdHtml}`;
        break;
      case 'approved':
        subject = `Booking approved for ${eventName}`;
        html = `<h3>Booking Approved!</h3>
                <p>Hi ${buyerName},</p>
                <p>Great news! Your booking for <b>${eventName}</b> has been approved.</p>
                <p>Attendees will receive their respective tickets shortly.</p>
                ${bookingIdHtml}`;
        break;
      case 'rejected':
        subject = `Booking request declined for ${eventName}`;
        html = `<h3>Booking Declined</h3>
                <p>Hi ${buyerName},</p>
                <p>We're sorry to inform you that your booking request for <b>${eventName}</b> was not approved by the host.</p>
                ${bookingIdHtml}`;
        break;
      case 'waitlisted':
        subject = `You are on the waitlist for ${eventName}`;
        html = `<h3>Waitlist Joined</h3>
                <p>Hi ${buyerName},</p>
                <p>You have successfully joined the waitlist for <b>${eventName}</b>.</p>
                <p>We will notify you instantly if a spot frees up and you are promoted to claim a seat.</p>
                ${bookingIdHtml}`;
        break;
      case 'payment_success':
        subject = `Payment successful for ${eventName}`;
        html = `<h3>Payment Confirmed</h3>
                <p>Hi ${buyerName},</p>
                <p>Your payment for <b>${eventName}</b> has been successfully processed.</p>
                ${bookingIdHtml}`;
        break;
    }

    if (subject && html) {
      try {
        await sendEmail({
          to: buyerEmail,
          subject,
          html
        });
        console.log(`[TicketNotificationService] Sent ${status} buyer email to ${buyerEmail}`);
      } catch (err) {
        console.error(`[TicketNotificationService] Failed to send buyer email:`, err);
      }
    }
  }

  static async notifyAttendeePending(
    ticket: any,
    attendee: any,
    event: any,
    buyerName: string
  ) {
    // Only send if it's an existing Samaagum user
    if (!attendee.user_id) return;

    // Send in-app notification
    try {
      await prisma.notification_log.create({
        data: {
          tenant_id: event.tenant_id,
          user_id: attendee.user_id,
          channel: 'app',
          template_key: 'event_ticket_assigned_pending',
          status: 'queued',
          provider_ref: JSON.stringify({
            eventId: event.id,
            eventTitle: event.title,
            buyerName: buyerName,
            ticketId: ticket.id
          })
        }
      });
    } catch (e) {
      console.error('[TicketNotificationService] Failed to create pending notification log', e);
    }

    // Send email
    if (attendee.email) {
      const subject = `Pending Ticket for ${event.title}`;
      const html = `<h3>Ticket Request Pending</h3>
                    <p>🎉 <b>${buyerName}</b> has purchased a ticket for you for <b>${event.title}</b>.</p>
                    <p>Your ticket will automatically appear in My Tickets once it is approved by the host.</p>`;
      try {
        await sendEmail({
          to: attendee.email,
          subject,
          html
        });
      } catch (err) {
        console.error('[TicketNotificationService] Failed to send pending attendee email', err);
      }
    }
  }

  static async handleAttendeeApproval(
    booking: any,
    event: any,
    attendee: any,
    ticket: any,
    buyerEmail: string,
    buyerName: string
  ) {
    if (!attendee.email) return;

    // Check if the attendee's linked user has verified their email.
    // If email_verified = false, they are effectively a guest — they need to claim
    // via OTP even though a provisional user record exists from checkout.
    let isVerifiedUser = false;
    if (attendee.user_id) {
      try {
        const linkedUser = await prisma.users.findUnique({
          where: { id: attendee.user_id },
          select: { email_verified: true }
        });
        isVerifiedUser = !!linkedUser?.email_verified;
      } catch (_) {
        isVerifiedUser = false;
      }
    }

    if (attendee.user_id && isVerifiedUser) {
      // EXISTING VERIFIED SAMAAGUM USER
      // 1. Send Notification
      try {
        const notif = await prisma.notification_log.create({
          data: {
            tenant_id: event.tenant_id,
            user_id: attendee.user_id,
            channel: 'app',
            template_key: 'event_ticket_approved',
            status: 'queued',
            provider_ref: JSON.stringify({
              eventId: event.id,
              eventTitle: event.title,
              buyerName: buyerName,
              ticketId: ticket.id
            })
          }
        });

        try {
          const { sendNotificationToUser } = require('./messagingSocket');
          sendNotificationToUser(attendee.user_id, 'group.notification', {
            id: notif.id,
            type: 'event',
            text: `🎉 Your ticket for <b>${event.title}</b> is confirmed!`,
            eventId: event.id
          });
        } catch (socketErr) {
          console.error('[TicketNotificationService] Failed to emit socket event', socketErr);
        }
      } catch (e) {
        console.error('[TicketNotificationService] Failed to create approved notification log', e);
      }

      // 2. Send standard ticket email
      await this.sendTicketEmail(ticket, attendee, event, booking);
    } else {
      // GUEST USER (or unverified provisional account)
      // 1. Ensure claim token exists
      let claimTokenRow = await prisma.ticket_claims.findFirst({
        where: { ticket_id: ticket.id }
      });
      if (!claimTokenRow) {
        // Fallback: Create one if it wasn't created during purchase for some reason
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const sevenDaysAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        let expiresAt = sevenDaysAfter;
        if (event.ends_at) {
          const end = new Date(event.ends_at);
          if (end < expiresAt) {
            expiresAt = end;
          }
        }
        claimTokenRow = await prisma.ticket_claims.create({
          data: {
            tenant_id: event.tenant_id,
            ticket_id: ticket.id,
            token,
            state: 'issued',
            expires_at: expiresAt
          }
        });
      }

      // 2. Send Claim Link email to attendee
      const frontEndUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const claimUrl = `${frontEndUrl}/#event=${event.id}?claim=${claimTokenRow.token}`;
      const subject = `Claim your ticket for ${event.title}`;
      const html = `<h3>Your ticket has been approved!</h3>
                    <p>🎉 Your ticket for <b>${event.title}</b> has been approved.</p>
                    <p><b>${buyerName}</b> has purchased this ticket for you.</p>
                    <p>Click below to claim your ticket securely and add it to your Samaagum wallet:</p>
                    <a href="${claimUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">Claim Ticket</a>`;

      try {
        await sendEmail({
          to: attendee.email,
          subject,
          html
        });
        console.log(`[TicketNotificationService] Sent claim email to ${attendee.email}`);
      } catch (err) {
        console.error('[TicketNotificationService] Failed to send claim email', err);
      }
    }
  }

  static async sendTicketEmail(ticket: any, attendee: any, event: any, booking: any) {
    if (!attendee.email) return;

    try {
      const dateStr = event.starts_at ? new Date(event.starts_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBD';
      const vObj = (event.venue as any) || {};
      const venueStr = vObj.address || vObj.name || event.location_type || 'TBD';
      
      const lineItems = await prisma.booking_line_items.findMany({ where: { booking_id: booking.id } });
      const bookingQty = lineItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPaidMinor = booking.total_amount_minor ? Number(booking.total_amount_minor) : 0;
      // Note: we can format the price per ticket, but for now we use total paid / qty as an approximation if needed, or just show total booking price like before
      const paidStr = totalPaidMinor > 0 ? formatCurrency(totalPaidMinor, booking.total_currency || 'INR') : 'Free';

      const htmlContent = generateTicketHtml({
        qrToken: ticket.qr_token,
        ticketCode: ticket.ticket_code || ticket.id,
        attendeeName: attendee.name,
        dateString: dateStr,
        venueString: venueStr,
        paidAmount: paidStr,
        status: 'Confirmed',
        isOnline: event.location_type === 'online',
        onlineLink: event.online_link || '',
        cover: (event as any).cover || ((event.venue as any)?.meta?.cover) || '',
        quantity: bookingQty,
        totalAmountMinor: totalPaidMinor,
        currency: booking.total_currency || 'INR',
        bookingIdCode: booking?.id ? 'BKG-' + booking.id.split('-')[0].toUpperCase() : undefined
      });

      await sendEmail({
        to: attendee.email,
        subject: `Your ticket for ${event.title}`,
        html: htmlContent
      });
      console.log(`[TicketNotificationService] Sent standard ticket email to ${attendee.email}`);
    } catch (err) {
      console.error('[TicketNotificationService] Failed to send standard ticket email:', err);
    }
  }

}
