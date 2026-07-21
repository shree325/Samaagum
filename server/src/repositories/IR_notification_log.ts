export interface INotificationLog {
  row_id?: string;
  bu_id: string;
  user_id: string;

  notification_type: string;
  channel: string;
  status?: string;
  sent_at?: Date;

  created?: Date;
  db_last_upd?: Date;
  db_last_upd_src?: string;
}

export interface IR_notification_log {
  create(log: INotificationLog): Promise<INotificationLog>;
  getById(rowId: string): Promise<INotificationLog | null>;
  getByUserId(userId: string): Promise<INotificationLog[]>;
  getAll(buId: string): Promise<INotificationLog[]>;
  delete(rowId: string): Promise<boolean>;
  syncMessageNotifications(
    userId: string,
    conversationId: string,
    maxCreatedAt: Date
  ): Promise<number>;
  countUnread(userId: string): Promise<number>;
}


