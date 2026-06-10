import { PostgresBaseRepository } from './PostgresBaseRepository';
import { INotificationLog, IR_notificationLog } from './IR_notificationLog';
import pool from '../config/database';

export class R_notificationLog extends PostgresBaseRepository<INotificationLog> implements IR_notificationLog {
  constructor() {
    super('notification_log', 'notification_id');
  }

  async findByUserId(userId: string): Promise<INotificationLog[]> {
    const query = `SELECT * FROM notification_log WHERE user_id = $1 ORDER BY created_at DESC`;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  async findByChannel(channel: string): Promise<INotificationLog[]> {
    const query = `SELECT * FROM notification_log WHERE channel = $1`;
    const { rows } = await pool.query(query, [channel]);
    return rows;
  }

  async findByStatus(status: string): Promise<INotificationLog[]> {
    const query = `SELECT * FROM notification_log WHERE status = $1`;
    const { rows } = await pool.query(query, [status]);
    return rows;
  }
}
