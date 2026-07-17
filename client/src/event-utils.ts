const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isRealEventId(id: any): boolean {
  return typeof id === "string" && UUID_RE.test(id);
}

export function computePrice(registrationMode: string, tickets: any[], rawPrice: any): string {
  if (registrationMode === 'free' || registrationMode === 'free_rsvp') {
    return 'Free';
  } else if (tickets && tickets.length > 0) {
    const prices = tickets.map((t: any) =>
      t.price_minor ? t.price_minor / 100 : (t.price_amount_minor ? t.price_amount_minor / 100 : 0)
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return minPrice === 0 ? 'Free' : `₹${minPrice.toFixed(0)}`;
    } else {
      return `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
    }
  } else if (rawPrice) {
    return rawPrice;
  }
  return '—';
}

export function normalizeEventData(e: any, ME: any, stCity?: string): any {
  if (!e) return null;

  const startsAt = e.starts_at ? new Date(e.starts_at) : null;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = startsAt ? months[startsAt.getMonth()] : (e.month || "TBD");
  const day = startsAt ? startsAt.getDate().toString() : (e.day || "TBD");
  const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (e.time || "Time TBD");
  const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : (e.date || "Date TBD");

  let venueObj: any = {};
  if (typeof e.venue === 'string') {
    const trimmed = e.venue.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        venueObj = JSON.parse(e.venue);
      } catch (err) {
        console.error("Error parsing venue JSON", err);
        venueObj = { name: e.venue, address: e.venue };
      }
    } else {
      venueObj = { name: e.venue, address: e.venue };
    }
  } else if (typeof e.venue === 'object' && e.venue !== null) {
    venueObj = e.venue;
  }

  let meta: any = {};
  if (venueObj && venueObj.meta) {
    if (typeof venueObj.meta === 'string') {
      try {
        meta = JSON.parse(venueObj.meta);
      } catch (err) {
        console.error("Error parsing meta JSON", err);
      }
    } else if (typeof venueObj.meta === 'object') {
      meta = venueObj.meta;
    }
  }

  const priceVal = computePrice(e.registration_mode, e.tickets || [], e.price);

  return {
    ...e,
    desc: e.description || e.desc,
    cover: e.cover || meta.cover || "",
    cat: meta.category || e.cat || "General",
    type: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
    online: e.location_type === 'online',
    month,
    day,
    date: dateStr,
    time,
    venue: e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
    city: e.city || (e.location_type === 'online' ? 'Online' : (venueObj.address ? (typeof venueObj.address === 'string' ? venueObj.address.split(',').pop().trim() : '') : '')),
    going: e.going || 0,
    cap: e.capacity_total || e.cap || 9999,
    price: priceVal,
    host: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostName || e.host || ME.name || "Organizer"),
    hostBy: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostName || e.hostBy || ME.name || "Organizer"),
    hostPhoto: typeof e.host === 'object' && e.host !== null ? (e.host.photo || "") : (e.hostPhoto || ""),
    hostBanner: typeof e.host === 'object' && e.host !== null ? (e.host.banner || "") : (e.hostBanner || ""),
    hostType: e.hostType || null,
    attendees: e.attendees || [],
    instructions: e.instruction || e.instructions || meta.instructions || "",
    formFields: e.formFields || meta.formFields || [],
    gallery: meta.gallery || e.gallery || {
      enabled: false,
      uploadRoles: { owner: true, admin: true, moderator: true, public: false },
      viewRoles: { owner: true, admin: true, moderator: true, public: true },
      approvalRequired: false,
      videoOnly: false,
      imageOnly: false
    },
    venue_raw: venueObj
  };
}

export function getQuestionLabel(formFields: any[], fieldId: string): string {
  const field = (formFields || []).find(f => f.id === fieldId);
  return field?.question || field?.label || fieldId;
}
