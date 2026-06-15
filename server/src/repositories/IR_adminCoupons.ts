import { IBaseRepository } from './IBaseRepository';

export interface IAdminCoupon {
    id?: string;
    code: string;
    description?: string | null;
    discount_type: string;
    amount: number;
    date_expires?: Date | null;
    usage_count: number;
    is_active: boolean;
    free_shipping: boolean;
    usage_restrictions: object;
    usage_limits: object;
    email_settings: object;
    applicable_plan_ids: string[];
    meta_data: object[];
    tenant_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_adminCoupons extends IBaseRepository<IAdminCoupon> {
    findByCode(code: string, tenantId?: string | null): Promise<IAdminCoupon | null>;
    incrementUsage(id: string): Promise<void>;
}
