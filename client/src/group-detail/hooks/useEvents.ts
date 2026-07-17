import { Group } from '../types';
import { EVENTS } from '../../home-data';

export function useEvents(g: Group) {
  const rawEvents = ((window as any).EVENTS || EVENTS).filter((e: any) => e.hosted_by_entity_id === g.id);
  const gEvents = rawEvents.map((e: any) => {
    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const priceVal = e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : (e.registration_mode === 'free' ? 'Free' : '—');

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

    return {
      ...e,
      month,
      day,
      date: dateStr,
      time,
      price: priceVal,
      type: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
      online: e.location_type === 'online',
      cover: e.cover || meta.cover || "",
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || 'Venue TBD'),
    };
  });

  return {
    gEvents
  };
}
