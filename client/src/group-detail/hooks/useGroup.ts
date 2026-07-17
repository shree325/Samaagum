import { useState, useEffect, useCallback } from 'react';
import { Group } from '../types';
import { ME, GROUPS } from '../../home-data';

export function useGroup(initialGroup: Group | null, st: any) {
  const [fullGroup, setFullGroup] = useState<Group | null>(null);
  const [membershipState, setMembershipState] = useState<string | null>(null);
  const [globalChatSettings, setGlobalChatSettings] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);

  const g: Group = fullGroup || initialGroup || GROUPS[0];

  useEffect(() => {
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    fetch(`${apiBase}/api/messaging/settings`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setGlobalChatSettings(res.data);
        }
      })
      .catch(err => console.error("Error fetching global chat settings in hook:", err));
  }, []);

  useEffect(() => {
    setFullGroup(null);
    setMembershipState(null);
  }, [initialGroup?.id]);

  const fetchGroupDetails = useCallback(async () => {
    if (!g.id || g.id === "newg") return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

      const groupRes = await fetch(`${apiBase}/api/groups/${g.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const groupData = await groupRes.json();
      if (groupData.success) {
        setFullGroup(groupData.data.group);
        setMembershipState(groupData.data.membershipState);
        setIsOwner(groupData.data.isOwner);
        if (groupData.data.group?.online !== undefined) {
          setOnlineCount(groupData.data.group.online);
        }
        if (groupData.data.members) {
          setMembers(groupData.data.members);
        }
      } else if (groupRes.status === 403) {
        setAccessDenied(true);
        setAccessDeniedMsg(groupData.message || "You do not have access to view this group.");
      }
    } catch (e) {
      console.error("Failed to fetch group details:", e);
    }
  }, [g.id]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  return {
    g,
    fullGroup,
    setFullGroup,
    membershipState,
    setMembershipState,
    globalChatSettings,
    isOwner,
    setIsOwner,
    members,
    setMembers,
    accessDenied,
    accessDeniedMsg,
    onlineCount,
    setOnlineCount,
    fetchGroupDetails
  };
}
