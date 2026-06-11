import { PrismaClient } from '@prisma/client';
import { IAttendee, IR_attendees } from "./IR_attendees";

export class R_attendees implements IR_attendees {
  constructor(private db: PrismaClient) {}

  async create(a: IAttendee): Promise<IAttendee> {
    const query = `
      INSERT INTO attendees (
        tenant_id, booking_id, ticket_id, user_id,
        name, email, gender, phone, dob,
        claimed_at, checkin_status, notes, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *;
    `;
    const values = [
      a.tenant_id, a.booking_id, a.ticket_id, a.user_id,
      a.name, a.email, a.gender, a.phone, a.dob,
      a.claimed_at, a.checkin_status, a.notes, a.created_by, a.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IAttendee | null> {
    const result = await this.db.query(`SELECT * FROM attendees WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByBookingId(bookingId: string): Promise<IAttendee[]> {
    const result = await this.db.query(`SELECT * FROM attendees WHERE booking_id = $1`, [bookingId]);
    return result.rows;
  }

  async getByUserId(userId: string): Promise<IAttendee[]> {
    const result = await this.db.query(`SELECT * FROM attendees WHERE user_id = $1`, [userId]);
    return result.rows;
  }

  async getByEmail(email: string): Promise<IAttendee[]> {
    const result = await this.db.query(`SELECT * FROM attendees WHERE email = $1`, [email]);
    return result.rows;
  }

  async getAll(): Promise<IAttendee[]> {
    const result = await this.db.query(`SELECT * FROM attendees ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, a: Partial<IAttendee>): Promise<IAttendee | null> {
    const result = await this.db.query(
      `UPDATE attendees SET
        name = COALESCE($1, name), email = COALESCE($2, email),
        checkin_status = COALESCE($3, checkin_status), claimed_at = COALESCE($4, claimed_at),
        notes = COALESCE($5, notes), updated_at = now(), updated_by = $6
      WHERE id = $7 RETURNING *;`,
      [a.name, a.email, a.checkin_status, a.claimed_at, a.notes, a.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM attendees WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
