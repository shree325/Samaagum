export interface ICoupon {
  id?: string;
  tenant_id: string;

  event_id?: string | null;

  code: string;
  description?: string | null;

  discount_type: string;
  amount_minor?: number | null;
  percent?: number | null;
  min_order_minor?: number;
  currency?: string | null;

  valid_from?: Date | null;
  valid_to?: Date | null;

  max_total?: number | null;
  max_per_user?: number;
  usage_count?: number;

  stackable_with_early_bird?: boolean;
  status?: string;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_coupons {
  create(coupon: ICoupon): Promise<ICoupon>;
  getById(id: string): Promise<ICoupon | null>;
  getByCode(tenantId: string, code: string): Promise<ICoupon | null>;
  getByEventId(eventId: string): Promise<ICoupon[]>;
  getAll(): Promise<ICoupon[]>;
  update(id: string, coupon: Partial<ICoupon>): Promise<ICoupon | null>;
  delete(id: string): Promise<boolean>;
}