import { PrismaClient } from '@prisma/client';
import { ICheckinGate, IR_checkin_gates } from "./IR_checkin_gates";

export class R_checkin_gates implements IR_checkin_gates {
  constructor(private db: PrismaClient) {}

  async create(g: ICheckinGate): Promise<ICheckinGate> {
    const query = `
      INSERT INTO checkin_gates (
        tenant_id, event_id, name, gate_code, gate_type,
        location_note, device_binding_id, is_active, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;
    `;
    const values = [
      g.tenant_id, g.event_id, g.name, g.gate_code, g.gate_type,
      g.location_note, g.device_binding_id, g.is_active, g.created_by, g.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICheckinGate | null> {
    const result = await this.db.query(`SELECT * FROM checkin_gates WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<ICheckinGate[]> {
    const result = await this.db.query(`SELECT * FROM checkin_gates WHERE event_id = $1`, [eventId]);
    return result.rows;
  }

  async getByGateCode(tenantId: string, eventId: string, gateCode: string): Promise<ICheckinGate | null> {
    const result = await this.db.query(
      `SELECT * FROM checkin_gates WHERE tenant_id = $1 AND event_id = $2 AND gate_code = $3`,
      [tenantId, eventId, gateCode]
    );
    return result.rows[0] || null;
  }

  async getAll(): Promise<ICheckinGate[]> {
    const result = await this.db.query(`SELECT * FROM checkin_gates ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, g: Partial<ICheckinGate>): Promise<ICheckinGate | null> {
    const result = await this.db.query(
      `UPDATE checkin_gates SET
        name = COALESCE($1, name), is_active = COALESCE($2, is_active),
        location_note = COALESCE($3, location_note), updated_at = now(), updated_by = $4
      WHERE id = $5 RETURNING *;`,
      [g.name, g.is_active, g.location_note, g.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM checkin_gates WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
