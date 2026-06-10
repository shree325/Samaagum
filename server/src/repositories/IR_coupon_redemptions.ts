export interface ICouponRedemption {
  id?: string;
  tenant_id: string;

  coupon_id: string;
  booking_id: string;
  line_item_id?: string | null;
  user_id?: string | null;

  discount_applied_minor: number;
  currency: string;

  redeemed_at?: Date;
  source_channel?: string | null;
  status?: string;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_coupon_redemptions {
  create(redemption: ICouponRedemption): Promise<ICouponRedemption>;
  getById(id: string): Promise<ICouponRedemption | null>;
  getByCouponId(couponId: string): Promise<ICouponRedemption[]>;
  getByBookingId(bookingId: string): Promise<ICouponRedemption[]>;
  getByUserId(userId: string): Promise<ICouponRedemption[]>;
  getAll(): Promise<ICouponRedemption[]>;
  delete(id: string): Promise<boolean>;
}