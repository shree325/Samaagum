import prisma from '../config/prisma';
import crypto from 'crypto';
import { EventService } from './EventService';

/**
 * One-time invite links for events:
 *  - purpose 'view': bypasses visibility === 'unlisted' so the event/join page can be opened
 *    directly via the link even though the event is hidden from Discover.
 *  - purpose 'join': bypasses joinEligibility === 'invite' so the holder can proceed through
 *    the normal join flow (it unlocks the flow, it does not auto-confirm the join).
 *
 * Mirrors the pattern used by InvitationService.ts for group invites, but simplified to
 * single-use only per spec.
 */
export class EventInvitationService {

  private static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create an invite link for an event. Only the host/co-host may generate one.
   *
   * 'view' links are reusable and single-per-event: once generated, the same link is
   * returned on subsequent calls instead of minting a new token, since it's meant to be
   * a durable link stored alongside the event (visible in the Invite tab indefinitely).
   * 'join' links remain single-use, minted fresh on every call.
   */
  static async createLink(eventId: string, userId: string, purpose: 'view' | 'join') {
    const isHostOrCoHost = await EventService.verifyEventHostOrCoHost(userId, eventId);
    if (!isHostOrCoHost) {
      throw new Error('You do not have permission to generate invite links for this event');
    }

    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    if (purpose === 'view') {
      const existing = await prisma.event_invitations.findFirst({
        where: { event_id: eventId, purpose: 'view', status: 'pending' }
      });
      if (existing) {
        const url = `${process.env.APP_URL || 'http://localhost:8080'}/pages/Samaagum%20Home.html#/events/invite/${existing.token}`;
        return { token: existing.token, url, purpose };
      }
    }

    const token = this.generateToken();
    await prisma.event_invitations.create({
      data: {
        event_id: eventId,
        purpose,
        token,
        status: 'pending',
        created_by: userId
      }
    });

    const url = `${process.env.APP_URL || 'http://localhost:8080'}/pages/Samaagum%20Home.html#/events/invite/${token}`;
    return { token, url, purpose };
  }

  /**
   * Fetch the durable 'view' link for an event if one already exists, without creating one.
   * Used by the Invite tab to restore the link across page reloads.
   */
  static async getExistingViewLink(eventId: string) {
    const existing = await prisma.event_invitations.findFirst({
      where: { event_id: eventId, purpose: 'view', status: 'pending' }
    });
    if (!existing) return null;
    const url = `${process.env.APP_URL || 'http://localhost:8080'}/pages/Samaagum%20Home.html#/events/invite/${existing.token}`;
    return { token: existing.token, url, purpose: 'view' as const };
  }

  /**
   * Read-only validation - does not consume the token. Used by the invite landing page
   * to look up which event/purpose a token corresponds to.
   */
  static async validateToken(token: string, expectedPurpose?: 'view' | 'join') {
    const invite = await prisma.event_invitations.findUnique({ where: { token } });

    if (!invite) return { valid: false, message: 'Invalid invitation link' };
    if (invite.status === 'used') return { valid: false, message: 'This invite link has already been used' };
    if (invite.status === 'revoked') return { valid: false, message: 'This invite link has been revoked' };
    if (expectedPurpose && invite.purpose !== expectedPurpose) {
      return { valid: false, message: 'This invite link is not valid for this action' };
    }

    // Fetch the full, enriched event (tickets/host info) bypassing the visibility gate —
    // holding a valid invite record is itself the authorization to view it.
    const data: any = await EventService.getEventById(invite.event_id, undefined, true);
    if (!data || data.restricted || !data.event) {
      return { valid: false, message: 'Event not found' };
    }

    return { valid: true, invite, event: { ...data.event, tickets: data.tickets } };
  }

  /**
   * Atomically marks a pending token as used. Race-safe: the WHERE status='pending' guard
   * means only one concurrent consumer can win, enforcing single-use.
   */
  static async consumeToken(token: string, userId: string, expectedPurpose?: 'view' | 'join'): Promise<boolean> {
    const invite = await prisma.event_invitations.findUnique({ where: { token } });
    if (!invite || invite.status !== 'pending') return false;
    if (expectedPurpose && invite.purpose !== expectedPurpose) return false;

    const result = await prisma.event_invitations.updateMany({
      where: { token, status: 'pending' },
      data: { status: 'used', used_by: userId, used_at: new Date() }
    });
    return result.count > 0;
  }
}
