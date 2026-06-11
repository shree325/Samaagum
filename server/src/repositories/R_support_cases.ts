import { PrismaClient } from "@prisma/client";
import { ISupportCases, IR_support_cases } from "./IR_support_cases";

export class R_support_cases implements IR_support_cases {
  constructor(private db: PrismaClient) {}

  async create(data: ISupportCases): Promise<ISupportCases> {
    return this.db.support_cases.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<ISupportCases | null> {
    return this.db.support_cases.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<ISupportCases[]> {
    return this.db.support_cases.findMany() as any;
  }

  async update(row_id: string, data: Partial<ISupportCases>): Promise<ISupportCases | null> {
    return this.db.support_cases.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.support_cases.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
