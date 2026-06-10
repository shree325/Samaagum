import { IBaseRepository } from './IBaseRepository';

export interface IPlan {
  plan_id?: string;
  plan_type: string;
  plane_name: string;
  entitlements?: any;
  status?: string;
  price?: number;
  currency?: string;
  billing_cycle?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_plans extends IBaseRepository<IPlan> {
  findByPlanType(planType: string): Promise<IPlan[]>;
  findByStatus(status: string): Promise<IPlan[]>;
}
