import { IBaseRepository } from './IBaseRepository';

export interface INotificationLog {
  notification_id?: string;
  tenant_id?: string | null;
  user_id: string;
  channel: string;
  template_key: string;
  status?: string;
  provider_refs?: any;
  sent_at?: Date | null;
  subject?: string | null;
  body?: string | null;
  metadata?: any;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IR_notificationLog extends IBaseRepository<INotificationLog> {
  findByUserId(userId: string): Promise<INotificationLog[]>;
  findByChannel(channel: string): Promise<INotificationLog[]>;
  findByStatus(status: string): Promise<INotificationLog[]>;
}
