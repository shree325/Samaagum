import { PrismaClient } from "@prisma/client";
import { IPlatformSettings, IR_platform_settings } from "./IR_platform_settings";

export class R_platform_settings implements IR_platform_settings {
  constructor(private db: PrismaClient) {}

  async create(data: IPlatformSettings): Promise<IPlatformSettings> {
    return this.db.platform_settings.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IPlatformSettings | null> {
    return this.db.platform_settings.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IPlatformSettings[]> {
    return this.db.platform_settings.findMany() as any;
  }

  async update(row_id: string, data: Partial<IPlatformSettings>): Promise<IPlatformSettings | null> {
    return this.db.platform_settings.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.platform_settings.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
