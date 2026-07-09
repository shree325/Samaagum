import { PrismaClient } from '@prisma/client';
import { IEventWishlist, IR_wishlists } from './IR_wishlists';

export class R_wishlists implements IR_wishlists {
  constructor(private db: any) {}

  async toggle(eventId: string, userId: string): Promise<{ wishlisted: boolean; count: number }> {
    // Attempt to insert
    const insertQuery = `
      INSERT INTO event_wishlist (event_id, user_id) 
      VALUES ($1, $2) 
      ON CONFLICT DO NOTHING 
      RETURNING *;
    `;
    const result = await this.db.query(insertQuery, [eventId, userId]);
    
    let wishlisted = true;
    if (result.rowCount === 0) {
      // It already existed, so we remove it
      const deleteQuery = `DELETE FROM event_wishlist WHERE event_id = $1 AND user_id = $2`;
      await this.db.query(deleteQuery, [eventId, userId]);
      wishlisted = false;
    }

    const count = await this.getCountByEventId(eventId);
    return { wishlisted, count };
  }

  async getByUserId(userId: string): Promise<IEventWishlist[]> {
    const query = `SELECT * FROM event_wishlist WHERE user_id = $1 ORDER BY created_at DESC`;
    const { rows } = await this.db.query(query, [userId]);
    return rows;
  }

  async getCountByEventId(eventId: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM event_wishlist WHERE event_id = $1`;
    const { rows } = await this.db.query(query, [eventId]);
    return parseInt(rows[0]?.count || '0', 10);
  }

  async isWishlisted(eventId: string, userId: string): Promise<boolean> {
    if (!userId) return false;
    const query = `SELECT 1 FROM event_wishlist WHERE event_id = $1 AND user_id = $2`;
    const { rows } = await this.db.query(query, [eventId, userId]);
    return rows.length > 0;
  }

  async getUsersWishlistingEvent(eventId: string): Promise<{ user_id: string }[]> {
    const query = `SELECT user_id FROM event_wishlist WHERE event_id = $1`;
    const { rows } = await this.db.query(query, [eventId]);
    return rows;
  }

  async removeByEventAndUser(eventId: string, userId: string): Promise<boolean> {
    const query = `DELETE FROM event_wishlist WHERE event_id = $1 AND user_id = $2`;
    const result = await this.db.query(query, [eventId, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}
