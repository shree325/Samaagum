import { IBaseRepository } from './IBaseRepository';

export interface INotificationLog {
  notification_id?: string;
  tenant_id?: string | null;
  user_id: string;

  channel: 'email' | 'sms' | 'push' | 'in_app';
  template_key: string;
  status?: 'queued' | 'sent' | 'failed' | 'retry';
  provider_refs?: Record<string, unknown>;
  sent_at?: Date | null;

  subject?: string | null;
  body?: string | null;
  metadata?: Record<string, unknown>;

  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;

  created_at?: Date;
  updated_at?: Date;
}

export interface IR_notification_log extends IBaseRepository<INotificationLog> {
  findByUserId(userId: string): Promise<INotificationLog[]>;
  findByChannel(channel: string): Promise<INotificationLog[]>;
  findPending(tenantId: string): Promise<INotificationLog[]>;
}
