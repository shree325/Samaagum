export interface IWishlist {
  id?: string;
  tenant_id: string;

  user_id: string;
  event_id: string;

  alert_opt_in?: boolean;
  source?: string | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_wishlists {
  create(wishlist: IWishlist): Promise<IWishlist>;
  getById(id: string): Promise<IWishlist | null>;
  getByUserId(userId: string): Promise<IWishlist[]>;
  getByEventId(eventId: string): Promise<IWishlist[]>;
  getByUserAndEvent(userId: string, eventId: string): Promise<IWishlist | null>;
  getAll(): Promise<IWishlist[]>;
  update(id: string, wishlist: Partial<IWishlist>): Promise<IWishlist | null>;
  delete(id: string): Promise<boolean>;
}
