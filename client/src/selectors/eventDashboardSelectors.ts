export const calculateCheckinPercentage = (totalAttendees: number, checkedInCount: number) => {
  return totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0;
};

export const calculateBookingStatusData = (confirmed: any[]) => [
  { name: 'Confirmed', value: confirmed.filter(u => u.bookingStatus === 'confirmed').length },
  { name: 'Pending Payment', value: confirmed.filter(u => u.bookingStatus === 'pending_payment').length }
];

export const getPaidBookings = (confirmed: any[]) => {
  return confirmed.filter(u => u.bookingStatus === 'confirmed' && u.amountMinor > 0);
};

export const calculateCashPending = (confirmed: any[]) => {
  return confirmed.filter(u => u.isCashPayment && u.bookingStatus === 'pending_payment').length;
};

export const calculateAvgBookingValue = (revenue: number, paidBookingsCount: number) => {
  return paidBookingsCount > 0
    ? (revenue / paidBookingsCount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : '—';
};

export const calculateTicketSoldDistribution = (confirmed: any[], isDemoMode: boolean, demoData?: any[]) => {
  if (isDemoMode && demoData) {
    return demoData;
  }
  const counts: Record<string, number> = {};
  confirmed.forEach(u => {
    const name = u.ticketTypeName || 'General RSVP';
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

export const calculateRevenueByTicketType = (confirmed: any[]) => {
  const grouped: Record<string, number> = {};
  confirmed.forEach(a => {
    if (!a.ticketTypeName || a.amountMinor <= 0) return;
    grouped[a.ticketTypeName] = (grouped[a.ticketTypeName] || 0) + (a.amountMinor / 100);
  });
  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
};

export const getAttendeeByUserIdMap = (confirmed: any[]) => {
  return new Map(confirmed.map(att => [att.userId, att]));
};

export const calculateRoleCheckInStats = (activeMembers: any[], attendeeByUserId: Map<string, any>, membersAvailable: boolean) => {
  if (!membersAvailable || !activeMembers.length) return null;
  const roleMap: Record<string, { checked: number; total: number }> = {};
  activeMembers.forEach(m => {
    if (!roleMap[m.role]) roleMap[m.role] = { checked: 0, total: 0 };
    roleMap[m.role].total++;
    const att = attendeeByUserId.get(m.userId);
    if (att?.checkinStatus === 'checked_in') roleMap[m.role].checked++;
  });
  return Object.entries(roleMap).map(([name, v]) => ({ name, ...v }));
};

export const calculateRegistrationTimeline = (
  confirmed: any[],
  isDemoMode: boolean,
  overviewScale: 'today' | 'week' | 'month'
) => {
  if (isDemoMode) {
    if (overviewScale === 'today') {
      return [
        { name: '9 AM', total: 4, confirmed: 3 },
        { name: '11 AM', total: 10, confirmed: 8 },
        { name: '1 PM', total: 18, confirmed: 14 },
        { name: '3 PM', total: 24, confirmed: 19 },
        { name: '5 PM', total: 32, confirmed: 28 }
      ];
    } else if (overviewScale === 'week') {
      return [
        { name: 'Jul 7', total: 400, confirmed: 280 },
        { name: 'Jul 8', total: 510, confirmed: 360 },
        { name: 'Jul 9', total: 680, confirmed: 490 },
        { name: 'Jul 10', total: 850, confirmed: 590 },
        { name: 'Jul 11', total: 1010, confirmed: 710 },
        { name: 'Jul 12', total: 1150, confirmed: 810 },
        { name: 'Jul 13', total: 1248, confirmed: 856 }
      ];
    } else {
      return [
        { name: 'Jun 15', total: 100, confirmed: 80 },
        { name: 'Jun 20', total: 280, confirmed: 200 },
        { name: 'Jun 25', total: 510, confirmed: 380 },
        { name: 'Jun 30', total: 820, confirmed: 610 },
        { name: 'Jul 5', total: 1050, confirmed: 780 },
        { name: 'Jul 13', total: 1248, confirmed: 856 }
      ];
    }
  }

  if (!confirmed.length) return [];

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  
  const filtered = confirmed.filter(att => {
    if (!att.createdAt) return false;
    const attDate = new Date(att.createdAt);
    if (overviewScale === 'today') {
      return attDate.toLocaleDateString('en-CA') === todayStr;
    } else if (overviewScale === 'week') {
      return now.getTime() - attDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
    } else {
      return now.getTime() - attDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
    }
  });

  if (overviewScale === 'today') {
    const hourMap: Record<string, { total: number; confirmed: number }> = {};
    filtered.forEach(att => {
      if (!att.createdAt) return;
      const d = new Date(att.createdAt);
      const hourLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      if (!hourMap[hourLabel]) {
        hourMap[hourLabel] = { total: 0, confirmed: 0 };
      }
      hourMap[hourLabel].total++;
      if (att.bookingStatus === 'confirmed') {
        hourMap[hourLabel].confirmed++;
      }
    });

    const sortedHours = Object.keys(hourMap).sort((a, b) => {
      const parseHour = (h: string) => {
        const parts = h.split(' ');
        let val = parseInt(parts[0]);
        const ampm = parts[1];
        if (ampm === 'PM' && val !== 12) val += 12;
        if (ampm === 'AM' && val === 12) val = 0;
        return val;
      };
      return parseHour(a) - parseHour(b);
    });

    let totalCumulative = 0;
    let confirmedCumulative = 0;

    return sortedHours.map(hour => {
      totalCumulative += hourMap[hour].total;
      confirmedCumulative += hourMap[hour].confirmed;
      return {
        name: hour,
        total: totalCumulative,
        confirmed: confirmedCumulative
      };
    });
  }

  const dateMap: Record<string, { total: number; confirmed: number }> = {};
  filtered.forEach(att => {
    if (!att.createdAt) return;
    const dateKey = new Date(att.createdAt).toISOString().split('T')[0];
    if (!dateMap[dateKey]) {
      dateMap[dateKey] = { total: 0, confirmed: 0 };
    }
    dateMap[dateKey].total++;
    if (att.bookingStatus === 'confirmed') {
      dateMap[dateKey].confirmed++;
    }
  });

  const sortedDates = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));

  let totalCumulative = 0;
  let confirmedCumulative = 0;

  return sortedDates.map(dateKey => {
    totalCumulative += dateMap[dateKey].total;
    confirmedCumulative += dateMap[dateKey].confirmed;
    
    // Format YYYY-MM-DD to "MMM DD"
    const [year, month, day] = dateKey.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      name: label,
      total: totalCumulative,
      confirmed: confirmedCumulative
    };
  });
};
