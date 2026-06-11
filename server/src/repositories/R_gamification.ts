import { PrismaClient } from '@prisma/client';
import { IGamification, IR_gamification } from "./IR_gamification";

export class R_gamification implements IR_gamification {
  constructor(private db: PrismaClient) {}

  async create(g: IGamification): Promise<IGamification> {
    const query = `
      INSERT INTO gamification (bu_id, user_id, points, level, badge_count, x_data, created_by, last_upd_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      g.bu_id, g.user_id, g.points || 0, g.level || 1, g.badge_count || 0,
      g.x_data ? JSON.stringify(g.x_data) : null, g.created_by || null, g.last_upd_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IGamification | null> {
    const { rows } = await this.db.query(`SELECT * FROM gamification WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByUserId(userId: string): Promise<IGamification | null> {
    const { rows } = await this.db.query(`SELECT * FROM gamification WHERE user_id = $1`, [userId]);
    return rows[0] || null;
  }

  async getAll(buId: string): Promise<IGamification[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM gamification WHERE bu_id = $1 ORDER BY points DESC`,
      [buId]
    );
    return rows;
  }

  async update(rowId: string, g: Partial<IGamification>): Promise<IGamification | null> {
    const query = `
      UPDATE gamification
      SET points = COALESCE($1, points),
          level = COALESCE($2, level),
          badge_count = COALESCE($3, badge_count),
          x_data = COALESCE($4, x_data),
          last_upd = now(),
          last_upd_by = $5,
          modification_num = modification_num + 1
      WHERE row_id = $6
      RETURNING *;
    `;
    const values = [
      g.points === undefined ? null : g.points,
      g.level === undefined ? null : g.level,
      g.badge_count === undefined ? null : g.badge_count,
      g.x_data ? JSON.stringify(g.x_data) : null,
      g.last_upd_by || null,
      rowId
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM gamification WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
