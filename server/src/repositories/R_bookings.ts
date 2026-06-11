import { PostgresBaseRepository } from "./PostgresBaseRepository";
import { IBooking, IR_bookings } from "./IR_bookings";
import pool from '../config/database';

export class R_bookings
    extends PostgresBaseRepository<IBooking>
    implements IR_bookings {

    constructor() {
        super("bookings", "id");
    }

    async findByUserId(userId: string): Promise<IBooking[]> {
        const { rows } = await pool.query(
            `SELECT * FROM bookings WHERE booker_user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    async findByEventId(eventId: string): Promise<IBooking[]> {
        const { rows } = await pool.query(
            `SELECT * FROM bookings WHERE event_id = $1 ORDER BY created_at DESC`,
            [eventId]
        );
        return rows;
    }

    async findByReference(bookingReference: string): Promise<IBooking | null> {
        const { rows } = await pool.query(
            `SELECT * FROM bookings WHERE booking_reference = $1`,
            [bookingReference]
        );
        return rows[0] || null;
    }

    async findByTenant(tenantId: string): Promise<IBooking[]> {
        const { rows } = await pool.query(
            `SELECT * FROM bookings WHERE tenant_id = $1 ORDER BY created_at DESC`,
            [tenantId]
        );
        return rows;
    }
}