import { useState, useEffect, useCallback } from 'react';

export function useGroupDashboard(groupId: string | undefined, apiBase: string, token: string | null) {
  const [stats, setStats] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [resStats, resPending] = await Promise.all([
        fetch(`${apiBase}/api/groups/${groupId}/dashboard-stats`, { headers }),
        fetch(`${apiBase}/api/groups/${groupId}/members?state=pending`, { headers })
      ]);

      if (resStats.status === 403 || resStats.status === 401) {
        setError("You don't have permission");
        setStats(null);
        setPendingRequests([]);
        return;
      }

      const dataStats = await resStats.json();
      const dataPending = await resPending.json();

      if (dataStats && dataStats.success) {
        setStats(dataStats.data);
      } else if (dataStats) {
        setStats(dataStats);
      } else {
        setError('Unable to load dashboard');
      }

      if (dataPending && dataPending.success) {
        setPendingRequests(dataPending.data);
      }
    } catch {
      setError('Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [groupId, apiBase, token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    pendingRequests,
    loading,
    error,
    refetch: fetchStats
  };
}
