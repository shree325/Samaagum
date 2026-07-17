import { prisma } from './src/lib/prisma';

async function main() {
    const attendee = await prisma.attendees.findFirst({
        where: { id: '6bb50818-324b-4408-a63e-b04bd9ba655e' }
    });
    console.log("Attendee:", attendee);
    const booking = await prisma.bookings.findFirst({
        where: { id: '6bb50818-324b-4408-a63e-b04bd9ba655e' }
    });
    console.log("Booking:", booking);
}

main().catch(console.error).finally(() => prisma.$disconnect());
