import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IWishlist, IR_wishlists } from './IR_wishlists';
import prisma from '../config/prisma';

export class R_wishlists extends PostgresBaseRepository<IWishlist> implements IR_wishlists {
  constructor() {
    super('wishlists', 'wishlist_id');
  }

  async findByUserId(userId: string): Promise<IWishlist[]> {
    const query = `SELECT * FROM wishlists WHERE user_id = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }

  async findByEventId(eventId: string): Promise<IWishlist[]> {
    const query = `SELECT * FROM wishlists WHERE event_id = $1`;
    const { rows } = await prisma.query(query, [eventId]);
    return rows;
  }
}
