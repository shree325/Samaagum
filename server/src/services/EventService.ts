import { PlanEntitlementService } from './PlanEntitlementService';

export class EventService {
    /**
     * Validates event creation and update parameters against user plan entitlements.
     */
    static async validateEventEntitlements(userId: string, eventData: any) {
        const ents = await PlanEntitlementService.getEntitlements(userId);

        // 1. Max participants limit
        const capacity = eventData.capacity_total || eventData.capacity;
        if (capacity !== undefined && ents.event_max_participants !== -1 && capacity > ents.event_max_participants) {
            throw new Error(`Your plan limits event participants to a maximum of ${ents.event_max_participants}.`);
        }

        // 2. Event type (registration mode and payment options)
        const isPaid = eventData.registration_mode === 'paid' || !!eventData.price;
        if (isPaid && !ents.event_can_create_paid_tickets) {
            throw new Error('Paid events are locked for your current plan. Upgrade to Standard to sell tickets.');
        }

        // 3. Event visibility (listed state)
        const listedVal = eventData.listed;
        if (listedVal === 'listed') {
            if (!ents.event_allowed_visibility.includes('public')) {
                throw new Error('Your current plan only allows creating unlisted events. Upgrade to Standard to create public events.');
            }
        }

        // 4. Ticket check-in check
        const checkinMethod = eventData.checkin_method;
        if (checkinMethod && ents.event_checkin_methods && !ents.event_checkin_methods.includes(checkinMethod)) {
            throw new Error(`The selected check-in method (${checkinMethod}) is not available on your plan.`);
        }
    }
}
