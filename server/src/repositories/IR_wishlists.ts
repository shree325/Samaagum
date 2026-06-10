import { IBaseRepository } from './IBaseRepository';

export interface IWishlist {
  wishlist_id?: string;
  user_id: string;
  event_id: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_wishlists extends IBaseRepository<IWishlist> {
  findByUserId(userId: string): Promise<IWishlist[]>;
  findByEventId(eventId: string): Promise<IWishlist[]>;
}
