import pool from '../config/database';
import { R_payments } from '../repositories/R_payments';
import { IPayment } from '../repositories/IR_payments';

export class PaymentService {
  private paymentRepo: R_payments;

  constructor() {
    this.paymentRepo = new R_payments(pool);
  }

  async initiate(payment: Partial<IPayment>): Promise<IPayment> {
    if (!payment.tenant_id || !payment.booking_id || !payment.method) {
      throw new Error('tenant_id, booking_id, and method are required');
    }
    return this.paymentRepo.create(payment as IPayment);
  }

  async getById(id: string): Promise<IPayment | null> {
    return this.paymentRepo.getById(id);
  }

  async getByBooking(bookingId: string): Promise<IPayment[]> {
    return this.paymentRepo.getByBookingId(bookingId);
  }

  async captureCallback(gatewayPaymentId: string, status: string): Promise<IPayment | null> {
    const payment = await this.paymentRepo.getByGatewayPaymentId(gatewayPaymentId);
    if (!payment) throw new Error('Payment not found for gateway ID');
    return this.paymentRepo.update(payment.id!, { status });
  }

  async update(id: string, updates: Partial<IPayment>): Promise<IPayment | null> {
    return this.paymentRepo.update(id, updates);
  }
}
