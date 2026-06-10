import { IBaseRepository } from "./IBaseRepository";

export interface IBooking {
    booking_id?: string;
    event_id: string;
    booker_user_id: string;
    status: string;
    payment_method?: string;
    total_amount_minor: number;
    currency: string;
    booked_at?: Date;
}

export interface IR_bookings
    extends IBaseRepository<IBooking> {

    findByUserId(userId: string): Promise<IBooking[]>;
    findByEventId(eventId: string): Promise<IBooking[]>;
}