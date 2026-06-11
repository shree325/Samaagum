import { PrismaClient } from "@prisma/client";
import { IAffiliateCommissions, IR_affiliate_commissions } from "./IR_affiliate_commissions";

export class R_affiliate_commissions implements IR_affiliate_commissions {
  constructor(private db: PrismaClient) {}

  async create(data: IAffiliateCommissions): Promise<IAffiliateCommissions> {
    return this.db.affiliate_commissions.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IAffiliateCommissions | null> {
    return this.db.affiliate_commissions.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IAffiliateCommissions[]> {
    return this.db.affiliate_commissions.findMany() as any;
  }

  async update(row_id: string, data: Partial<IAffiliateCommissions>): Promise<IAffiliateCommissions | null> {
    return this.db.affiliate_commissions.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.affiliate_commissions.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
