import { PrismaClient } from "@prisma/client";
import { IApiKeys, IR_api_keys } from "./IR_api_keys";

export class R_api_keys implements IR_api_keys {
  constructor(private db: PrismaClient) {}

  async create(data: IApiKeys): Promise<IApiKeys> {
    return this.db.api_keys.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IApiKeys | null> {
    return this.db.api_keys.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IApiKeys[]> {
    return this.db.api_keys.findMany() as any;
  }

  async update(row_id: string, data: Partial<IApiKeys>): Promise<IApiKeys | null> {
    return this.db.api_keys.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.api_keys.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
