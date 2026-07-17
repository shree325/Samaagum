import { useState, useCallback, useEffect } from 'react';
import { Group } from '../types';

export function useInvites(g: Group, hasManageCap: boolean) {
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const fetchInvites = useCallback(async () => {
    if (!g.id || g.id === "newg" || !hasManageCap) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        let list = data.data;
        // Unlisted groups always need a shareable link — auto-create one if it doesn't exist yet
        const hasShareLink = list.some((inv: any) => !inv.email && !inv.username && inv.status !== 'revoked');
        if (g.visibility === 'private' && !hasShareLink) {
          const linkRes = await fetch(`${apiBase}/api/groups/${g.id}/invites/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: JSON.stringify({ maxUses: null })
          });
          const linkData = await linkRes.json();
          if (linkData.success) {
            const res2 = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data2 = await res2.json();
            if (data2.success) list = data2.data;
          }
        }
        setInvites(list);
      }
    } catch (e) { console.error(e); }
  }, [g.id, hasManageCap, g.visibility]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  return {
    invites,
    setInvites,
    inviteEmail,
    setInviteEmail,
    inviteLink,
    setInviteLink,
    fetchInvites
  };
}
