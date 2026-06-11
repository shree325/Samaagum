import { PrismaClient } from "@prisma/client";
import { IBundleItems, IR_bundle_items } from "./IR_bundle_items";

export class R_bundle_items implements IR_bundle_items {
  constructor(private db: PrismaClient) {}

  async create(data: IBundleItems): Promise<IBundleItems> {
    return this.db.bundle_items.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IBundleItems | null> {
    return this.db.bundle_items.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IBundleItems[]> {
    return this.db.bundle_items.findMany() as any;
  }

  async update(row_id: string, data: Partial<IBundleItems>): Promise<IBundleItems | null> {
    return this.db.bundle_items.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.bundle_items.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
