import { PrismaClient } from "@prisma/client";
import { IModerationReports, IR_moderation_reports } from "./IR_moderation_reports";

export class R_moderation_reports implements IR_moderation_reports {
  constructor(private db: PrismaClient) {}

  async create(data: IModerationReports): Promise<IModerationReports> {
    return this.db.moderation_reports.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IModerationReports | null> {
    return this.db.moderation_reports.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IModerationReports[]> {
    return this.db.moderation_reports.findMany() as any;
  }

  async update(row_id: string, data: Partial<IModerationReports>): Promise<IModerationReports | null> {
    return this.db.moderation_reports.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.moderation_reports.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
