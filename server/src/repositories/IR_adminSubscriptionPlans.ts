import { IBaseRepository } from './IBaseRepository';

export interface IAdminSubscriptionPlan {
    id?: string;
    name: string;
    display_name: string;
    description?: string | null;
    category: string;
    plan_type: string;
    is_active: boolean;
    is_popular: boolean;
    group_name?: string | null;
    pricing: object;
    features: object[];
    limits: object[];
    metadata: object;
    trial?: object | null;
    visibility: object;
    rbac_role_id?: string | null;
    rbac_position_id?: string | null;
    rbac_auto_assign: boolean;
    is_default?: boolean;
    tenant_id?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface IR_adminSubscriptionPlans extends IBaseRepository<IAdminSubscriptionPlan> {
    findActive(tenantId?: string | null): Promise<IAdminSubscriptionPlan[]>;
    findPublic(): Promise<IAdminSubscriptionPlan[]>;
    countActiveSubscribers(planId: string): Promise<number>;
    getIdsByNames(names: string[]): Promise<string[]>;
    getDefaultOrByName(name: string): Promise<any | null>;
}

