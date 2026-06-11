import { PrismaClient } from '@prisma/client';
import { IEventTeamAssignment, IR_event_team_assignments } from "./IR_event_team_assignments";

export class R_event_team_assignments implements IR_event_team_assignments {
  constructor(private db: PrismaClient) {}

  async create(a: IEventTeamAssignment): Promise<IEventTeamAssignment> {
    const query = `
      INSERT INTO event_team_assignments (
        tenant_id, event_id, user_id, role_id, granted_by,
        assigned_at, expires_at, status, notes, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *;
    `;
    const values = [
      a.tenant_id, a.event_id, a.user_id, a.role_id, a.granted_by,
      a.assigned_at, a.expires_at, a.status, a.notes,
      a.created_by, a.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IEventTeamAssignment | null> {
    const result = await this.db.query(
      `SELECT * FROM event_team_assignments WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<IEventTeamAssignment[]> {
    const result = await this.db.query(
      `SELECT * FROM event_team_assignments WHERE event_id = $1 ORDER BY assigned_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  async getByUserId(userId: string): Promise<IEventTeamAssignment[]> {
    const result = await this.db.query(
      `SELECT * FROM event_team_assignments WHERE user_id = $1 ORDER BY assigned_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getAll(): Promise<IEventTeamAssignment[]> {
    const result = await this.db.query(
      `SELECT * FROM event_team_assignments ORDER BY assigned_at DESC`
    );
    return result.rows;
  }

  async update(id: string, a: Partial<IEventTeamAssignment>): Promise<IEventTeamAssignment | null> {
    const result = await this.db.query(
      `
      UPDATE event_team_assignments
      SET
        status = COALESCE($1, status),
        expires_at = COALESCE($2, expires_at),
        revoked_at = COALESCE($3, revoked_at),
        notes = COALESCE($4, notes),
        updated_at = now(),
        updated_by = $5
      WHERE id = $6
      RETURNING *;
      `,
      [a.status, a.expires_at, a.revoked_at, a.notes, a.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM event_team_assignments WHERE id = $1`, [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}