import { PrismaClient } from '@prisma/client';
import { INotificationLog, IR_notification_log } from "./IR_notification_log";

export class R_notification_log implements IR_notification_log {
  constructor(private db: PrismaClient) {}

  async create(n: INotificationLog): Promise<INotificationLog> {
    const query = `
      INSERT INTO notification_log (bu_id, user_id, notification_type, channel, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      n.bu_id, n.user_id, n.notification_type, n.channel, n.status || 'sent'
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<INotificationLog | null> {
    const { rows } = await this.db.query(`SELECT * FROM notification_log WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByUserId(userId: string): Promise<INotificationLog[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM notification_log WHERE user_id = $1 ORDER BY sent_at DESC`,
      [userId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<INotificationLog[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM notification_log WHERE bu_id = $1 ORDER BY sent_at DESC`,
      [buId]
    );
    return rows;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM notification_log WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
