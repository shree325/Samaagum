export interface IPayment {
  id?: string;
  tenant_id: string;
  booking_id: string;
  method: string;
  status?: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  amount_amount_minor?: number | null;
  amount_currency?: string | null;
  proof_asset_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
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