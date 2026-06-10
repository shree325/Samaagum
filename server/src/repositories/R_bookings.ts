import { PostgresBaseRepository } from "./PostgresBaseRepository";
import { IBooking, IR_bookings } from "./IR_bookings";
import pool from '../config/database';

export class R_bookings
    extends PostgresBaseRepository<IBooking>
    implements IR_bookings {

    constructor() {
        super("bookings", "booking_id");
    }

    async findByUserId(userId: string): Promise<IBooking[]> {

        const query = `
            SELECT *
            FROM bookings
            WHERE booker_user_id = $1
        `;

        const result = await pool.query(query, [userId]);

        return result.rows;
    }

    async findByEventId(eventId: string): Promise<IBooking[]> {

        const query = `
            SELECT *
            FROM bookings
            WHERE event_id = $1
        `;

        const result = await pool.query(query, [eventId]);

        return result.rows;
    }
}