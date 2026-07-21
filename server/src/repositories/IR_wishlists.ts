import { IBaseRepository } from './IBaseRepository';

export interface IEventWishlist {
  id?: string;
  event_id: string;
  user_id: string;
  created_at?: Date;
}

export interface IR_wishlists {
  toggle(eventId: string, userId: string): Promise<{ wishlisted: boolean; count: number }>;
  getByUserId(userId: string): Promise<IEventWishlist[]>;
  getCountByEventId(eventId: string): Promise<number>;
  isWishlisted(eventId: string, userId: string): Promise<boolean>;
  getUsersWishlistingEvent(eventId: string): Promise<{ user_id: string }[]>;
  removeByEventAndUser(eventId: string, userId: string): Promise<boolean>;
}
