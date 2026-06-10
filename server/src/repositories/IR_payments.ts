export interface IPayment {
  id?: string;
  tenant_id: string;

  booking_id: string;

  method: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;

  amount_minor: number;
  currency: string;

  status?: string;

  proof_asset_id?: string | null;
  collected_at?: Date | null;
  received_by_user_id?: string | null;

  provider_payload?: Record<string, unknown> | null;

  modification_num?: number;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_payments {
  create(payment: IPayment): Promise<IPayment>;
  getById(id: string): Promise<IPayment | null>;
  getByBookingId(bookingId: string): Promise<IPayment[]>;
  getByGatewayPaymentId(gatewayPaymentId: string): Promise<IPayment | null>;
  getAll(): Promise<IPayment[]>;
  update(id: string, payment: Partial<IPayment>): Promise<IPayment | null>;
  delete(id: string): Promise<boolean>;
}