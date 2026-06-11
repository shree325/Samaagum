import { PostgresBaseRepository } from './PostgresBaseRepository';
import { INotificationLog, IR_notification_log } from './IR_notification_log';
import pool from '../config/database';

export class R_notification_log extends PostgresBaseRepository<INotificationLog> implements IR_notification_log {
  constructor() {
    super('notification_log', 'notification_id');
  }

  async findByUserId(userId: string): Promise<INotificationLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM notification_log WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  async findByChannel(channel: string): Promise<INotificationLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM notification_log WHERE channel = $1 ORDER BY created_at DESC`,
      [channel]
    );
    return rows;
  }

  async findPending(tenantId: string): Promise<INotificationLog[]> {
    const { rows } = await pool.query(
      `SELECT * FROM notification_log WHERE tenant_id = $1 AND status = 'queued' ORDER BY created_at ASC`,
      [tenantId]
    );
    return rows;
  }
}
