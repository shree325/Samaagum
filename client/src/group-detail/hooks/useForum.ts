import { useState, useCallback } from 'react';
import { Group } from '../types';

export function useForum(g: Group) {
  const [forumMembers, setForumMembers] = useState<any[]>([]);
  const [forumMemberSearch, setForumMemberSearch] = useState("");
  const [forumMemberSearchResults, setForumMemberSearchResults] = useState<any[]>([]);
  const [forumMgmtSearching, setForumMgmtSearching] = useState(false);

  const fetchForumMembers = useCallback(async () => {
    if (!g.id || g.id === "newg") return;
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/forum-members`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) setForumMembers(data.data);
    } catch (e) { console.error(e); }
  }, [g.id]);

  const handleForumMemberSearch = async (q: string) => {
    setForumMemberSearch(q);
    if (!q.trim()) { setForumMemberSearchResults([]); return; }
    setForumMgmtSearching(true);
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/members`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data || []).filter((m: any) =>
          (m.name || m.email || m.users?.display_name || "").toLowerCase().includes(q.toLowerCase()) && m.state === 'active'
        );
        setForumMemberSearchResults(filtered);
      }
    } catch (e) { console.error(e); }
    setForumMgmtSearching(false);
  };

  const handleGrantForumPerm = async (userId: string, permType: string) => {
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/forum-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}) },
        body: JSON.stringify({ user_id: userId, perm_type: permType })
      });
      const data = await res.json();
      if (data.success) fetchForumMembers();
      else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleRevokeForumPerm = async (userId: string, permType: string) => {
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      await fetch(`${apiBase}/api/groups/${g.id}/forum-members/${userId}/${permType}`, {
        method: 'DELETE',
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      fetchForumMembers();
    } catch (e) { console.error(e); }
  };

  return {
    forumMembers,
    setForumMembers,
    forumMemberSearch,
    setForumMemberSearch,
    forumMemberSearchResults,
    forumMgmtSearching,
    fetchForumMembers,
    handleForumMemberSearch,
    handleGrantForumPerm,
    handleRevokeForumPerm
  };
}
