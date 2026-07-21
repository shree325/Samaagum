import { useState, useEffect, useCallback } from 'react';

export function useEventDashboard(e: any, apiBase: string, token: string | null) {
  const [stats, setStats] = useState<any>(null);
  const [waitlistPreview, setWaitlistPreview] = useState<any[]>([]);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [waitlistEnabled, setWaitlistEnabled] = useState<boolean>(false);
  const [members, setMembers] = useState<any[]>([]);
  const [membersAvailable, setMembersAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!e?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setWaitlistPreview(data.data.waitlist ?? []);
        setWaitlistCount(data.data.waitlistCount ?? 0);
        setWaitlistEnabled(data.data.waitlistEnabled ?? false);
      } else {
        setError(data.message || 'Failed to load dashboard data.');
      }
    } catch {
      setError('Network error loading dashboard.');
    }
  }, [e?.id, apiBase, token]);

  const fetchWaitlistOnly = useCallback(async () => {
    if (!e?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-waitlist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistPreview(data.data.waitlist ?? []);
        setWaitlistCount(data.data.waitlistCount ?? 0);
        setWaitlistEnabled(data.data.waitlistEnabled ?? false);
      }
    } catch {}
  }, [e?.id, apiBase, token]);

  const fetchMembers = useCallback(async () => {
    if (!e?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/members`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.data || []);
      } else {
        setMembersAvailable(false);
      }
    } catch {
      setMembersAvailable(false);
    }
  }, [e?.id, apiBase, token]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchStats(), fetchMembers().catch(() => {})]);
  }, [fetchStats, fetchMembers]);

  useEffect(() => {
    if (!e?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchMembers().catch(() => {
        setMembersAvailable(false);
      })
    ]).finally(() => setLoading(false));
  }, [e?.id]);

  useEffect(() => {
    if (!e?.id || typeof window.io === 'undefined') return;
    const apiBaseUrl = window.location.port === '8080' ? 'http://localhost:3000' : '';
    const socket = window.io(`${apiBaseUrl}/groups`, { transports: ['websocket'] });
    socket.emit('join_event', e.id);

    socket.on('waitlist_updated', (payload: any) => {
      if (payload?.eventId === e.id || !payload?.eventId) {
        fetchWaitlistOnly();
      }
    });

    return () => {
      socket.emit('leave_event', e.id);
      socket.disconnect();
    };
  }, [e?.id, fetchWaitlistOnly]);

  return {
    stats,
    waitlistPreview,
    waitlistCount,
    waitlistEnabled,
    members,
    membersAvailable,
    loading,
    error,
    refetch,
    fetchWaitlistOnly
  };
}
