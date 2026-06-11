export interface IOutboundWebhooks {
  row_id?: string;
  [key: string]: any;
}

export interface IR_outbound_webhooks {
  create(data: IOutboundWebhooks): Promise<IOutboundWebhooks>;
  getById(row_id: string): Promise<IOutboundWebhooks | null>;
  getAll(): Promise<IOutboundWebhooks[]>;
  update(row_id: string, data: Partial<IOutboundWebhooks>): Promise<IOutboundWebhooks | null>;
  delete(row_id: string): Promise<boolean>;
}
