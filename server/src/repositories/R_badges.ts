import { PrismaClient } from "@prisma/client";
import { IBadges, IR_badges } from "./IR_badges";

export class R_badges implements IR_badges {
  constructor(private db: PrismaClient) {}

  async create(data: IBadges): Promise<IBadges> {
    return this.db.badges.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IBadges | null> {
    return this.db.badges.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IBadges[]> {
    return this.db.badges.findMany() as any;
  }

  async update(row_id: string, data: Partial<IBadges>): Promise<IBadges | null> {
    return this.db.badges.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.badges.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
