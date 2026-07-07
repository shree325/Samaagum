import { IBaseRepository } from './IBaseRepository';

export interface ISubscriptionOrder {
  id?: string;
  order_number: string;
  user_id: string;
  tenant_id?: string | null;
  status: string;
  plan_id: string;
  plan_type: string;
  shipping_address?: any;
  billing_address?: any;
  subtotal: number;
  tax_total: number;
  total: number;
  currency: string;
  taxes?: any;
  coupon_code?: string | null;
  discount_amount: number;
  payment_method: string;
  payment_method_title: string;
  payment_transaction_id?: string | null;
  payment_intent_id?: string | null;
  payment_status: string;
  payment_paid_date?: Date | null;
  payment_gateway_response?: any;
  subscription_start_date?: Date | null;
  subscription_end_date?: Date | null;
  subscription_status: string;
  customer_note?: string | null;
  admin_notes?: any;
  metadata?: any;
  completed_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_subscriptionOrders extends IBaseRepository<ISubscriptionOrder> {
  updateActiveOrdersState(userId: string, adminPlanIds: string[], state: string): Promise<void>;
}
