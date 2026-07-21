import React, { useState, useEffect, useCallback } from 'react';
import { getHighestRole } from '../../utils/permissions';
import { PendingRequests } from './PendingRequests';
import { MemberList } from './MemberList';
import { QuestionnaireModal } from './QuestionnaireModal';

interface MemberManagementPanelProps {
  group: any;
  st: any;
  go: (dest: string, arg?: any) => void;
}

export function MemberManagementPanel({ group, st, go }: MemberManagementPanelProps) {
  const g = group || st.createdGroups[0];
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState('group_member');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupSettings, setGroupSettings] = useState(g?.settings || {});
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  const roleHasCap = (roleKey: string, cap: string) =>
    (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes(cap);

  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const QUESTIONNAIRE_INIT = { loading: false, error: null, hasForm: null, data: null };
  const [questionnaireData, setQuestionnaireData] = useState<any>(QUESTIONNAIRE_INIT);

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('token');
    let uid: string | null = null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          uid = payload.id;
          setCurrentUserId(uid);
        }
      } catch (e) { }
    }

    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const [membRes, groupRes, rolesRes] = await Promise.all([
        fetch(`${apiBase}/api/groups/${g.id}/members`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
        fetch(`${apiBase}/api/groups/${g.id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
        fetch(`${apiBase}/api/groups/available-roles`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      ]);
      const data = await membRes.json();
      if (data.success && data.data) {
        const active = data.data.filter((m: any) => m.state === 'active');
        const pending = data.data.filter((m: any) => m.state === 'pending');
        setMembers(active);
        setRequests(pending);

        const myMem = active.find((m: any) => m.user_id === uid);
        if (myMem) {
          const roles = myMem.roles || [];
          if (roles.includes('group_owner')) setCurrentUserRole('group_owner');
          else if (roles.includes('group_admin')) setCurrentUserRole('group_admin');
          else if (roles.includes('group_moderator')) setCurrentUserRole('group_moderator');
          else setCurrentUserRole('group_member');
        }
      }
      const groupData = await groupRes.json();
      if (groupData.success && groupData.data?.settings) {
        setGroupSettings(groupData.data.settings);
      }
      const rolesData = await rolesRes.json();
      if (rolesData.success) {
        setAvailableRoles(rolesData.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [g?.id]);

  const fetchQuestionnaire = async (memberId: string) => {
    setQuestionnaireData({ ...QUESTIONNAIRE_INIT, loading: true });
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/members/${memberId}/questionnaire`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestionnaireData({ loading: false, error: null, hasForm: data.data.hasForm, data: data.data });
      } else {
        setQuestionnaireData({ loading: false, error: data.message || 'Failed to load', hasForm: null, data: null });
      }
    } catch {
      setQuestionnaireData({ loading: false, error: 'Network error. Please retry.', hasForm: null, data: null });
    }
  };

  const closeModal = () => {
    setSelectedMember(null);
    setQuestionnaireData(QUESTIONNAIRE_INIT);
  };

  useEffect(() => {
    if (g?.id) fetchMembers();
  }, [g?.id, fetchMembers]);

  useEffect(() => {
    if (!g?.id || !(window as any).io) return;
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = (window as any).io(socketUrl, { transports: ['websocket'] });

    socket.emit('join_group', g.id);

    socket.on('dashboard_updated', () => {
      fetchMembers();
    });

    return () => {
      socket.emit('leave_group', g.id);
      socket.disconnect();
    };
  }, [g?.id, fetchMembers]);

  const handleApprove = async (r: any) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${r.user_id}/approve`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setRequests(prev => prev.filter(req => req.user_id !== r.user_id));
        setMembers(prev => [...prev, { ...r, state: 'active', roles: ['group_member'] }]);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to approve request.");
      }
    } catch (e) {
      alert("An error occurred while approving the request.");
    }
  };

  const handleDecline = async (r: any) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${r.user_id}/reject`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setRequests(prev => prev.filter(req => req.user_id !== r.user_id));
      }
    } catch (e) { }
  };

  const handleRoleChange = async (memberId: string, roleKey: string) => {
    setOpenMenuId(null);

    if (roleKey === 'group_owner') {
      if (!confirm("Transfer ownership of this group?\n\nYou will become an Admin.\n\n[Cancel] - [OK]")) return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ role: roleKey })
      });
      const data = await res.json();

      if (data.success) {
        if (roleKey === 'group_owner') {
          const fetchRes = await fetch(`${apiBase}/api/groups/${g.id}/members`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          const membersData = await fetchRes.json();

          if (membersData.success) {
            const activeMembers = membersData.data.filter((m: any) => m.state === 'active');
            setMembers(activeMembers);

            const me = activeMembers.find((m: any) => m.user_id === currentUserId);
            if (me) {
              setCurrentUserRole(getHighestRole(me.roles));
            }
          }
        } else if (data.data) {
          setMembers(prev => prev.map(m => m.user_id === memberId ? data.data : m));
        }
      } else {
        alert(data.message || "Failed to update role");
      }
    } catch (e) { alert("Error updating role"); }
  };

  const handleRemove = async (memberId: string) => {
    setOpenMenuId(null);
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${memberId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.user_id !== memberId));
      } else {
        alert(data.message || "Failed to remove member");
      }
    } catch (e) { alert("Error removing member"); }
  };

  const roleColors: Record<string, string> = {
    'group_owner': '#eab308',
    'group_admin': '#a855f7',
    'group_moderator': '#3b82f6',
    'group_member': 'var(--ink-3)'
  };
  const roleLabels: Record<string, string> = {
    'group_owner': 'Owner',
    'group_admin': 'Admin',
    'group_moderator': 'Moderator',
    'group_member': 'Member'
  };

  return (
    <div onClick={() => setOpenMenuId(null)} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <PendingRequests
        requests={requests}
        groupSettings={groupSettings}
        currentUserRole={currentUserRole}
        roleHasCap={roleHasCap}
        onApprove={handleApprove}
        onDecline={handleDecline}
      />
      <MemberList
        members={members}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        availableRoles={availableRoles}
        roleColors={roleColors}
        roleLabels={roleLabels}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        roleHasCap={roleHasCap}
        go={go}
        onRoleChange={handleRoleChange}
        onRemove={handleRemove}
        onViewResponses={(m) => {
          setSelectedMember(m);
          fetchQuestionnaire(m.user_id);
        }}
      />
      {selectedMember && (
        <QuestionnaireModal
          member={selectedMember}
          questionnaireData={questionnaireData}
          roleColors={roleColors}
          roleLabels={roleLabels}
          onClose={closeModal}
          onRetry={fetchQuestionnaire}
        />
      )}
    </div>
  );
}
