import { useState, useCallback, useEffect } from 'react';
import { Group } from '../types';

export function useMembers(g: Group, hasManageCap: boolean, currentUserId: string | null) {
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [newJoinRequestNotif, setNewJoinRequestNotif] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  const fetchJoinRequests = useCallback(async () => {
    if (!g.id || g.id === "newg" || !hasManageCap) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/members?state=pending`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setJoinRequests(data.data.map((m: any) => ({
          id: m.user_id,
          user: { name: m.users?.display_name || "Unknown User", role: "member" },
          date: new Date(m.joined_at || m.created_at).toLocaleDateString(),
          status: "pending",
          answers: m.answers
        })));
      }
    } catch (e) { console.error(e); }
  }, [g.id, hasManageCap]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
        const res = await fetch(`${apiBase}/api/groups/available-roles`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success) setAvailableRoles(data.data || []);
      } catch (err) { console.error(err); }
    })();
  }, []);

  return {
    joinRequests,
    setJoinRequests,
    newJoinRequestNotif,
    setNewJoinRequestNotif,
    availableRoles,
    fetchJoinRequests
  };
}
