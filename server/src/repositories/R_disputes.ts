import { PrismaClient } from "@prisma/client";
import { IDisputes, IR_disputes } from "./IR_disputes";

export class R_disputes implements IR_disputes {
  constructor(private db: PrismaClient) {}

  async create(data: IDisputes): Promise<IDisputes> {
    return this.db.disputes.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IDisputes | null> {
    return this.db.disputes.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IDisputes[]> {
    return this.db.disputes.findMany() as any;
  }

  async update(row_id: string, data: Partial<IDisputes>): Promise<IDisputes | null> {
    return this.db.disputes.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.disputes.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
