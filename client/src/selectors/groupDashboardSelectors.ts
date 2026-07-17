export interface GroupEventStats {
  ongoing: number;
  upcoming: number;
  completed: number;
  allHosted: any[];
}

export const calculateEventStats = (events: any[], groupId: string): GroupEventStats => {
  const groupEvents = events.filter(e => e.hosted_by_entity_id === groupId || e.hostedByEntityId === groupId);
  const now = new Date();
  
  let ongoing = 0;
  let upcoming = 0;
  let completed = 0;

  const allHosted = groupEvents.map(ev => {
    const start = ev.starts_at ? new Date(ev.starts_at) : null;
    const end = ev.ends_at ? new Date(ev.ends_at) : null;
    
    let status: 'Ongoing' | 'Upcoming' | 'Completed' = 'Upcoming';

    if (ev.status === 'completed') {
      status = 'Completed';
      completed++;
    } else if (start) {
      if (end) {
        if (start <= now && end >= now) {
          status = 'Ongoing';
          ongoing++;
        } else if (end < now) {
          status = 'Completed';
          completed++;
        } else {
          status = 'Upcoming';
          upcoming++;
        }
      } else {
        // Fallback: 3 hours default duration
        const defaultEnd = new Date(start.getTime() + 3 * 60 * 60 * 1000);
        if (start <= now && defaultEnd >= now) {
          status = 'Ongoing';
          ongoing++;
        } else if (defaultEnd < now) {
          status = 'Completed';
          completed++;
        } else {
          status = 'Upcoming';
          upcoming++;
        }
      }
    } else {
      upcoming++;
    }

    return {
      ...ev,
      dashboardStatus: status
    };
  });

  return {
    ongoing,
    upcoming,
    completed,
    allHosted
  };
};

export const calculateMemberGrowth = (members: any[]) => {
  if (!members || members.length === 0) return [];
  
  // Parse and sort by joined date
  const sortedMembers = [...members]
    .map(m => ({
      ...m,
      parsedDate: m.joined_at || m.created_at ? new Date(m.joined_at || m.created_at) : new Date()
    }))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  // Group by date (YYYY-MM-DD)
  const dateMap: Record<string, number> = {};
  sortedMembers.forEach(m => {
    const key = m.parsedDate.toISOString().split('T')[0];
    dateMap[key] = (dateMap[key] || 0) + 1;
  });

  // Calculate cumulative growth
  const sortedKeys = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));
  let cumulative = 0;
  
  return sortedKeys.map(dateKey => {
    cumulative += dateMap[dateKey];
    
    const [year, month, day] = dateKey.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      name: label,
      members: cumulative
    };
  });
};

export const calculateMonthlyEvents = (events: any[], groupId: string) => {
  const groupEvents = events.filter(e => e.hosted_by_entity_id === groupId || e.hostedByEntityId === groupId);
  const completedEvents = groupEvents.filter(e => e.status === 'completed' || (e.ends_at && new Date(e.ends_at) < new Date()));
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const distribution = months.map(m => ({ name: m, events: 0 }));

  completedEvents.forEach(e => {
    if (!e.starts_at) return;
    const date = new Date(e.starts_at);
    const monthIdx = date.getMonth();
    if (monthIdx >= 0 && monthIdx < 12) {
      distribution[monthIdx].events++;
    }
  });

  return distribution;
};

export interface GroupActivity {
  id: string;
  type: 'member_join' | 'event_created' | 'discussion_created';
  title: string;
  description: string;
  time: string;
  timestamp: Date;
}

export const buildRecentActivity = (members: any[], events: any[], posts: any[], groupId: string): GroupActivity[] => {
  const activities: GroupActivity[] = [];

  // 1. Members joined
  members.forEach((m, idx) => {
    const date = m.joined_at || m.created_at ? new Date(m.joined_at || m.created_at) : new Date();
    activities.push({
      id: `member-${m.id || idx}`,
      type: 'member_join',
      title: 'New Member Joined',
      description: `${m.name || 'A user'} joined the group.`,
      time: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: date
    });
  });

  // 2. Events created under this group
  const groupEvents = events.filter(e => e.hosted_by_entity_id === groupId || e.hostedByEntityId === groupId);
  groupEvents.forEach((ev, idx) => {
    const date = ev.created_at ? new Date(ev.created_at) : (ev.starts_at ? new Date(ev.starts_at) : new Date());
    activities.push({
      id: `event-${ev.id || idx}`,
      type: 'event_created',
      title: 'Event Scheduled',
      description: `"${ev.title}" was scheduled.`,
      time: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: date
    });
  });

  // 3. Discussion posts
  if (Array.isArray(posts)) {
    posts.forEach((post, idx) => {
      const date = post.created_at ? new Date(post.created_at) : new Date();
      activities.push({
        id: `post-${post.id || idx}`,
        type: 'discussion_created',
        title: 'New Discussion Thread',
        description: `"${post.author_name || 'Someone'}" posted: "${post.title || post.body?.slice(0, 30)}..."`,
        time: date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: date
      });
    });
  }

  // Sort activities: most recent first
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
};
