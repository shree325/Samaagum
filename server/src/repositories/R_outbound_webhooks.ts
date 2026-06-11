import { PrismaClient } from "@prisma/client";
import { IOutboundWebhooks, IR_outbound_webhooks } from "./IR_outbound_webhooks";

export class R_outbound_webhooks implements IR_outbound_webhooks {
  constructor(private db: PrismaClient) {}

  async create(data: IOutboundWebhooks): Promise<IOutboundWebhooks> {
    return this.db.outbound_webhooks.create({ data: data as any }) as any;
  }

  async getById(row_id: string): Promise<IOutboundWebhooks | null> {
    return this.db.outbound_webhooks.findUnique({
      where: { id: row_id }
    }) as any;
  }

  async getAll(): Promise<IOutboundWebhooks[]> {
    return this.db.outbound_webhooks.findMany() as any;
  }

  async update(row_id: string, data: Partial<IOutboundWebhooks>): Promise<IOutboundWebhooks | null> {
    return this.db.outbound_webhooks.update({
      where: { id: row_id },
      data: data as any
    }) as any;
  }

  async delete(row_id: string): Promise<boolean> {
    try {
      await this.db.outbound_webhooks.delete({
        where: { id: row_id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
