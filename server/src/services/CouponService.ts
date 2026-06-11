import pool from '../config/database';
import { R_coupons } from '../repositories/R_coupons';
import { R_coupon_redemptions } from '../repositories/R_coupon_redemptions';

export class CouponService {
  private couponRepo: R_coupons;
  private redemptionRepo: R_coupon_redemptions;

  constructor() {
    this.couponRepo = new R_coupons(pool);
    this.redemptionRepo = new R_coupon_redemptions(pool);
  }

  async create(data: any) {
    return this.couponRepo.create(data);
  }

  async validate(eventId: string, code: string): Promise<any> {
    const coupon = await this.couponRepo.findOne({ event_id: eventId, code });
    if (!coupon) throw new Error('Invalid coupon code');
    if (coupon.status !== 'active') throw new Error('Coupon is not active');
    if (coupon.valid_to && new Date(coupon.valid_to) < new Date()) throw new Error('Coupon has expired');
    return coupon;
  }

  async redeem(data: { tenant_id: string; coupon_id: string; booking_id: string; user_id: string; discount_applied_amount_minor: number; discount_applied_currency: string }) {
    return this.redemptionRepo.create(data);
  }

  async getByEvent(eventId: string) {
    return this.couponRepo.findAll({ event_id: eventId });
  }
}
