import { PrismaClient } from "@prisma/client";
import { IMarketplaceBids, IR_marketplace_bids } from "./IR_marketplace_bids";

export class R_marketplace_bids implements IR_marketplace_bids {
  constructor(private db: PrismaClient) {}

  async create(data: IMarketplaceBids): Promise<IMarketplaceBids> {
    return this.db.marketplace_bids.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IMarketplaceBids | null> {
    return this.db.marketplace_bids.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IMarketplaceBids[]> {
    return this.db.marketplace_bids.findMany() as any;
  }

  async update(row_id: string, data: Partial<IMarketplaceBids>): Promise<IMarketplaceBids | null> {
    return this.db.marketplace_bids.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.marketplace_bids.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
