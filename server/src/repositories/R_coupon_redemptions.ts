import { PrismaClient } from '@prisma/client';
import { ICouponRedemption, IR_coupon_redemptions } from "./IR_coupon_redemptions";

export class R_coupon_redemptions implements IR_coupon_redemptions {
  constructor(private db: PrismaClient) {}

  async create(r: ICouponRedemption): Promise<ICouponRedemption> {
    const query = `
      INSERT INTO coupon_redemptions (
        tenant_id, coupon_id, booking_id, line_item_id, user_id,
        discount_applied_minor, currency, source_channel, status,
        created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *;
    `;
    const values = [
      r.tenant_id, r.coupon_id, r.booking_id, r.line_item_id, r.user_id,
      r.discount_applied_minor, r.currency, r.source_channel, r.status,
      r.created_by, r.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICouponRedemption | null> {
    const result = await this.db.query(`SELECT * FROM coupon_redemptions WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByCouponId(couponId: string): Promise<ICouponRedemption[]> {
    const result = await this.db.query(
      `SELECT * FROM coupon_redemptions WHERE coupon_id = $1`, [couponId]
    );
    return result.rows;
  }

  async getByBookingId(bookingId: string): Promise<ICouponRedemption[]> {
    const result = await this.db.query(
      `SELECT * FROM coupon_redemptions WHERE booking_id = $1`, [bookingId]
    );
    return result.rows;
  }

  async getByUserId(userId: string): Promise<ICouponRedemption[]> {
    const result = await this.db.query(
      `SELECT * FROM coupon_redemptions WHERE user_id = $1`, [userId]
    );
    return result.rows;
  }

  async getAll(): Promise<ICouponRedemption[]> {
    const result = await this.db.query(`SELECT * FROM coupon_redemptions ORDER BY redeemed_at DESC`);
    return result.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM coupon_redemptions WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}