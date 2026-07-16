import prisma from '../config/prisma';


export class EventExportService {
  /**
   * Prevents CSV Injection by prefixing potentially dangerous characters with a single quote.
   */
  static escapeCsvValue(val: any): string {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }

  static formatTz(date: Date | string | null | undefined, timezone: string = 'UTC'): string {
    if (!date) return '""';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '""';
      const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: timezone, 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      });
      const parts = formatter.formatToParts(d);
      // Construct manually to get yyyy-MM-dd HH:mm:ss consistently
      const p = parts.reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {} as Record<string, string>);
      const formatted = `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
      return this.escapeCsvValue(formatted);
    } catch {
      return '""';
    }
  }

  /**
   * Sanitizes custom question labels for use as CSV headers
   */
  static sanitizeHeader(label: string, seenHeaders: Set<string>): string {
    let sanitized = label.replace(/[\n\r]+/g, ' ').trim() || 'Custom Field';
    let finalLabel = sanitized;
    let counter = 2;
    while (seenHeaders.has(finalLabel)) {
      finalLabel = `${sanitized} (${counter++})`;
    }
    seenHeaders.add(finalLabel);
    return finalLabel;
  }

  /**
   * Returns metadata for the frontend to render the Export UI dynamically
   */
  static async getExportSummary(eventId: string) {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: { ticket_types: true }
    });

    if (!event) return null;

    const confirmedCount = await prisma.attendees.count({
      where: { bookings: { event_id: eventId, status: { in: ['confirmed', 'pending_payment'] } } }
    });

    const pendingCount = await prisma.attendees.count({
      where: { bookings: { event_id: eventId, status: 'pending_approval' } }
    });

    const waitlistCount = await prisma.bookings.count({
      where: { event_id: eventId, status: 'waitlisted' }
    });

    const checkinsCount = await prisma.attendees.count({
      where: { 
        bookings: { event_id: eventId, status: { in: ['confirmed', 'pending_payment'] } },
        checkin_status: 'checked_in'
      }
    });

    // Check if custom fields exist
    const hasCustomFields = await prisma.attendees.findFirst({
      where: { bookings: { event_id: eventId }, notes: { not: null } }
    });

    const isFree = !event.ticket_types.some((t: any) => t.price_amount_minor && Number(t.price_amount_minor) > 0);
    const waitlistEnabled = (event.settings as any)?.capacity?.waitlist === true;

    return {
      ticketSales: {
        title: "Ticket Sales Summary",
        description: "Sales, revenue and occupancy by ticket type.",
        count: event.ticket_types.length,
        countLabel: `${event.ticket_types.length} Ticket Types`,
        enabled: event.ticket_types.length > 0
      },
      attendees: {
        title: "Attendee List",
        description: "Confirmed attendees and ticket information.",
        count: confirmedCount,
        countLabel: `${confirmedCount} Attendees`,
        enabled: confirmedCount > 0
      },
      approvals: {
        title: "Registrations / Approvals",
        description: "Pending approval requests.",
        count: pendingCount,
        countLabel: `${pendingCount} Pending Requests`,
        enabled: pendingCount > 0
      },
      waitlist: {
        title: "Waitlist",
        description: "Users waiting for spots to open.",
        count: waitlistCount,
        countLabel: `${waitlistCount} Waitlisted`,
        enabled: waitlistEnabled || waitlistCount > 0
      },
      checkins: {
        title: "Check-ins",
        description: "Checked-in attendee list.",
        count: checkinsCount,
        countLabel: `${checkinsCount} Checked In`,
        enabled: checkinsCount > 0
      },
      customFields: {
        title: "Custom Field Responses",
        description: "Registration form answers.",
        count: confirmedCount + pendingCount + waitlistCount,
        countLabel: `${confirmedCount + pendingCount + waitlistCount} Registrants`,
        enabled: !!hasCustomFields
      },
      revenue: {
        title: "Revenue & Payments",
        description: "Order transactions and revenue.",
        count: confirmedCount,
        countLabel: `${confirmedCount} Orders`,
        enabled: !isFree
      }
    };
  }

  // --- Chunked Iterators for large dataset streaming ---

  private static async *iterateAttendees(eventId: string, statuses: string[], chunkSize = 1000) {
    let skip = 0;
    while (true) {
      const attendees = await prisma.attendees.findMany({
        where: { bookings: { event_id: eventId, status: { in: statuses as any } } },
        include: {
          bookings: {
            include: {
              booking_line_items: { include: { ticket_types: true } }
            }
          },
          users_attendees_user_idTousers: true
        },
        skip,
        take: chunkSize,
        orderBy: { created_at: 'asc' }
      });
      if (attendees.length === 0) break;
      for (const a of attendees) yield a;
      skip += chunkSize;
    }
  }

  private static async *iterateBookings(eventId: string, statuses: string[], chunkSize = 1000) {
    let skip = 0;
    while (true) {
      const bookings = await prisma.bookings.findMany({
        where: { event_id: eventId, status: { in: statuses as any } },
        include: {
          users: true,
          booking_line_items: { include: { ticket_types: true } }
        },
        skip,
        take: chunkSize,
        orderBy: { created_at: 'asc' }
      });
      if (bookings.length === 0) break;
      for (const b of bookings) yield b;
      skip += chunkSize;
    }
  }

  // --- Generators returning Async Iterables of CSV row strings ---

  static async *exportTicketSales(eventId: string): AsyncGenerator<string> {
    const event = await prisma.events.findUnique({
      where: { id: eventId },
      include: { ticket_types: true }
    });
    if (!event) return;

    yield `Ticket Type,Price,Capacity,Tickets Sold,Remaining,Pending Approval,Waitlist,Checked In,Revenue,Occupancy %,Check-in %\n`;

    const ticketTypes = event.ticket_types || [];
    
    // Aggregate counts
    const confirmedAttendees = await prisma.attendees.findMany({
      where: { bookings: { event_id: eventId, status: { in: ['confirmed', 'pending_payment'] } } },
      include: { bookings: { include: { booking_line_items: true } } }
    });
    const pendingAttendees = await prisma.attendees.count({
      where: { bookings: { event_id: eventId, status: 'pending_approval' } }
    });
    const waitlistBookings = await prisma.bookings.count({
      where: { event_id: eventId, status: 'waitlisted' }
    });

    const statsByType: Record<string, {
      sold: number, checkedIn: number, revenueMinor: number
    }> = {};

    for (const tt of ticketTypes) {
      statsByType[tt.id] = { sold: 0, checkedIn: 0, revenueMinor: 0 };
    }

    statsByType['general'] = { sold: 0, checkedIn: 0, revenueMinor: 0 };

    for (const a of confirmedAttendees) {
      const b = (a as any).bookings;
      const ttId = b?.booking_line_items?.[0]?.ticket_type_id || 'general';
      if (!statsByType[ttId]) statsByType[ttId] = { sold: 0, checkedIn: 0, revenueMinor: 0 };
      
      statsByType[ttId].sold++;
      if (a.checkin_status === 'checked_in') statsByType[ttId].checkedIn++;
      if (b?.total_amount_minor && b.status === 'confirmed') {
        statsByType[ttId].revenueMinor += Number(b.total_amount_minor);
      }
    }

    for (const tt of ticketTypes) {
      const st = statsByType[tt.id];
      const price = tt.price_amount_minor ? Number(tt.price_amount_minor) / 100 : 0;
      const cap = tt.capacity || 0;
      const sold = st.sold;
      const remain = cap > 0 ? Math.max(0, cap - sold) : 'Unlimited';
      const rev = st.revenueMinor / 100;
      const occ = cap > 0 ? ((sold / cap) * 100).toFixed(1) + '%' : 'N/A';
      const ciPct = sold > 0 ? ((st.checkedIn / sold) * 100).toFixed(1) + '%' : '0%';

      yield `${this.escapeCsvValue(tt.name)},${this.escapeCsvValue(price)},${this.escapeCsvValue(cap || 'Unlimited')},${this.escapeCsvValue(sold)},${this.escapeCsvValue(remain)},${this.escapeCsvValue(pendingAttendees)},${this.escapeCsvValue(waitlistBookings)},${this.escapeCsvValue(st.checkedIn)},${this.escapeCsvValue(rev)},${this.escapeCsvValue(occ)},${this.escapeCsvValue(ciPct)}\n`;
    }
  }

  static async *exportAttendees(eventId: string, tz: string): AsyncGenerator<string> {
    yield `Registration ID,Name,Email,Phone,Ticket,Registration Date,Registration Status,Payment Status,Check-in Status,Check-in Time,Order ID,Ticket Code\n`;
    
    for await (const a of this.iterateAttendees(eventId, ['confirmed', 'pending_payment'])) {
      const user = (a as any).users_attendees_user_idTousers;
      const b = (a as any).bookings;
      const ttName = b?.booking_line_items?.[0]?.ticket_types?.name || 'General';
      
      let phone = user?.phone_e164 || user?.phone_number || '';
      if (!phone) {
        try {
          const answers = JSON.parse(a.notes || '{}');
          phone = answers['Phone'] || answers['Phone Number'] || answers['phone'] || '';
        } catch {}
      }

      yield `${this.escapeCsvValue(a.id)},${this.escapeCsvValue(a.name)},${this.escapeCsvValue(a.email)},${this.escapeCsvValue(phone)},${this.escapeCsvValue(ttName)},${this.formatTz(a.created_at, tz)},${this.escapeCsvValue(b?.status)},${this.escapeCsvValue(b?.payment_status)},${this.escapeCsvValue(a.checkin_status)},${this.formatTz(a.updated_at, tz)},${this.escapeCsvValue(b?.id)},${this.escapeCsvValue((a as any).tickets?.qr_token || '')}\n`;
    }
  }

  static async *exportApprovals(eventId: string, tz: string): AsyncGenerator<string> {
    yield `Registration ID,Name,Email,Ticket,Requested At,Current Status,Questionnaire Responses,Notes\n`;
    for await (const a of this.iterateAttendees(eventId, ['pending_approval'])) {
      const b = (a as any).bookings;
      const ttName = b?.booking_line_items?.[0]?.ticket_types?.name || 'General';
      const answersStr = a.notes ? a.notes.replace(/[\r\n]+/g, ' ') : '';
      
      yield `${this.escapeCsvValue(a.id)},${this.escapeCsvValue(a.name)},${this.escapeCsvValue(a.email)},${this.escapeCsvValue(ttName)},${this.formatTz(a.created_at, tz)},${this.escapeCsvValue('Pending Approval')},${this.escapeCsvValue(answersStr)},""\n`;
    }
  }

  static async *exportWaitlist(eventId: string, tz: string): AsyncGenerator<string> {
    yield `Position,Name,Email,Joined At,Ticket Type\n`;
    let pos = 1;
    for await (const b of this.iterateBookings(eventId, ['waitlisted'])) {
      const user = (b as any).users;
      const name = user?.display_name || user?.first_name || 'Guest';
      const email = user?.primary_email || '';
      const ttName = (b as any).booking_line_items?.[0]?.ticket_types?.name || 'General';
      
      yield `${this.escapeCsvValue(pos++)},${this.escapeCsvValue(name)},${this.escapeCsvValue(email)},${this.formatTz(b.created_at, tz)},${this.escapeCsvValue(ttName)}\n`;
    }
  }

  static async *exportCheckins(eventId: string, tz: string): AsyncGenerator<string> {
    yield `Registration ID,Name,Email,Ticket,Check-in Time\n`;
    
    let skip = 0;
    while (true) {
      const attendees = await prisma.attendees.findMany({
        where: { bookings: { event_id: eventId }, checkin_status: 'checked_in' },
        include: { bookings: { include: { booking_line_items: { include: { ticket_types: true } } } } },
        skip,
        take: 1000,
        orderBy: { updated_at: 'asc' }
      });
      if (attendees.length === 0) break;
      for (const a of attendees) {
        const b = (a as any).bookings;
        const ttName = b?.booking_line_items?.[0]?.ticket_types?.name || 'General';
        yield `${this.escapeCsvValue(a.id)},${this.escapeCsvValue(a.name)},${this.escapeCsvValue(a.email)},${this.escapeCsvValue(ttName)},${this.formatTz(a.updated_at, tz)}\n`;
      }
      skip += 1000;
    }
  }

  static async *exportCustomFields(eventId: string, filter: string, tz: string): AsyncGenerator<string> {
    const statuses = [];
    if (filter === 'confirmed') statuses.push('confirmed', 'pending_payment');
    else if (filter === 'pending') statuses.push('pending_approval');
    else if (filter === 'waitlist') statuses.push('waitlisted'); // Waitlist doesn't have attendees usually, so this might need bookings
    else statuses.push('confirmed', 'pending_payment', 'pending_approval');
    
    // Gather all unique keys first
    const attendees = await prisma.attendees.findMany({
      where: { bookings: { event_id: eventId, status: { in: statuses as any } } },
      select: { notes: true }
    });

    const seenHeaders = new Set<string>();
    const headersMap = new Map<string, string>(); // raw key -> sanitized key

    for (const a of attendees) {
      if (a.notes) {
        try {
          const parsed = JSON.parse(a.notes);
          for (const key of Object.keys(parsed)) {
            if (!headersMap.has(key)) {
              headersMap.set(key, this.sanitizeHeader(key, seenHeaders));
            }
          }
        } catch {}
      }
    }

    const customHeaders = Array.from(headersMap.values());
    const customKeys = Array.from(headersMap.keys());

    yield `Registration ID,Name,Email,Status${customHeaders.length > 0 ? ',' + customHeaders.map(h => this.escapeCsvValue(h)).join(',') : ''}\n`;

    for await (const a of this.iterateAttendees(eventId, statuses)) {
      const b = (a as any).bookings;
      let parsed = {} as any;
      if (a.notes) {
        try { parsed = JSON.parse(a.notes); } catch {}
      }

      let row = `${this.escapeCsvValue(a.id)},${this.escapeCsvValue(a.name)},${this.escapeCsvValue(a.email)},${this.escapeCsvValue(b?.status)}`;
      for (const key of customKeys) {
        row += `,${this.escapeCsvValue(parsed[key] || '')}`;
      }
      yield row + '\n';
    }
  }

  static async *exportRevenue(eventId: string, tz: string): AsyncGenerator<string> {
    yield `Order ID,Buyer Name,Buyer Email,Ticket Type,Amount Paid,Currency,Payment Status,Transaction Date,Coupon Used\n`;
    for await (const b of this.iterateBookings(eventId, ['confirmed', 'pending_payment'])) {
      const user = (b as any).users;
      const name = user?.display_name || user?.first_name || 'Guest';
      const email = user?.primary_email || '';
      const ttName = (b as any).booking_line_items?.[0]?.ticket_types?.name || 'General';
      const amt = b.total_amount_minor ? (Number(b.total_amount_minor) / 100).toFixed(2) : '0.00';
      const curr = b.total_currency || 'USD';
      const cUsed = (b as any).coupon_redemptions?.length > 0 ? 'Yes' : 'No'; 
      
      yield `${this.escapeCsvValue(b.id)},${this.escapeCsvValue(name)},${this.escapeCsvValue(email)},${this.escapeCsvValue(ttName)},${this.escapeCsvValue(amt)},${this.escapeCsvValue(curr)},${this.escapeCsvValue(b.status)},${this.formatTz(b.created_at, tz)},${this.escapeCsvValue(cUsed)}\n`;
    }
  }
}
