export interface IRefund {
  id?: string;
  tenant_id: string;

  payment_id: string;
  line_item_id?: string | null;
  approved_by?: string | null;

  amount_minor: number;
  currency: string;

  mode: string;
  status?: string;
  is_partial?: boolean;

  reason?: string | null;
  external_ref?: string | null;

  requested_at?: Date;
  approved_at?: Date | null;
  processed_at?: Date | null;

  created_at?: Date;
  created_by?: string | null;
  updated_at?: Date;
  updated_by?: string | null;
}

export interface IR_refunds {
  create(refund: IRefund): Promise<IRefund>;
  getById(id: string): Promise<IRefund | null>;
  getByPaymentId(paymentId: string): Promise<IRefund[]>;
  getAll(): Promise<IRefund[]>;
  update(id: string, refund: Partial<IRefund>): Promise<IRefund | null>;
  delete(id: string): Promise<boolean>;
}