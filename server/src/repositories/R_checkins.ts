import { PrismaClient } from '@prisma/client';
import { ICheckin, IR_checkins } from "./IR_checkins";

export class R_checkins implements IR_checkins {
  constructor(private db: PrismaClient) {}

  async create(c: ICheckin): Promise<ICheckin> {
    const query = `
      INSERT INTO checkins (
        tenant_id, ticket_id, staff_user_id, gate_id,
        method, occurred_at, status,
        duplicate_of_checkin_id, source_device_id, notes,
        created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;
    const values = [
      c.tenant_id, c.ticket_id, c.staff_user_id, c.gate_id,
      c.method, c.occurred_at, c.status,
      c.duplicate_of_checkin_id, c.source_device_id, c.notes,
      c.created_by, c.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICheckin | null> {
    const result = await this.db.query(`SELECT * FROM checkins WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByTicketId(ticketId: string): Promise<ICheckin[]> {
    const result = await this.db.query(
      `SELECT * FROM checkins WHERE ticket_id = $1 ORDER BY occurred_at DESC`,
      [ticketId]
    );
    return result.rows;
  }

  async getByGateId(gateId: string): Promise<ICheckin[]> {
    const result = await this.db.query(
      `SELECT * FROM checkins WHERE gate_id = $1 ORDER BY occurred_at DESC`,
      [gateId]
    );
    return result.rows;
  }

  async getByStaffUserId(staffUserId: string): Promise<ICheckin[]> {
    const result = await this.db.query(
      `SELECT * FROM checkins WHERE staff_user_id = $1 ORDER BY occurred_at DESC`,
      [staffUserId]
    );
    return result.rows;
  }

  async getAll(): Promise<ICheckin[]> {
    const result = await this.db.query(
      `SELECT * FROM checkins ORDER BY occurred_at DESC`
    );
    return result.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM checkins WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}