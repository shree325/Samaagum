import { useState } from 'react';
import { Group } from '../types';

export function useMembership(
  g: Group,
  membershipState: string | null,
  setMembershipState: (val: string | null) => void,
  fetchGroupDetails: () => void,
  st: any
) {
  const [showQModal, setShowQModal] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const { joined, pending, toggleJoin } = st;
  const isJoined = joined.has(g.id) || membershipState === 'active';
  const isPending = pending.has(g.id) || membershipState === 'pending';

  const submitJoinRequest = async (submissionAnswers: any) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: submissionAnswers })
      });
      const data = await res.json();
      if (data.success) {
        setMembershipState(data.data.state);
        setShowQModal(false);
        if (data.data.state === 'active') {
          fetchGroupDetails();
        }
      } else {
        if ((window as any).toast) (window as any).toast(data.message || "Failed to join", "error");
        else alert(data.message || "Failed to join");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinClick = async () => {
    if (isJoined || isPending) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if ((window as any).toast) (window as any).toast("Please log in to join groups.", "warning");
        else alert("Please log in to join groups.");
        return;
      }

      if (g.settings && g.settings.questionnaires && g.settings.questionnaires.length > 0) {
        setShowQModal(true);
        return;
      }

      await submitJoinRequest({});
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveClick = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMembershipState(null);
        fetchGroupDetails();
        if ((window as any).toast) (window as any).toast("You have left the group successfully.", "success");
        else alert("You have left the group successfully.");
      } else {
        if ((window as any).toast) (window as any).toast(data.message || "Failed to leave group", "error");
        else alert(data.message || "Failed to leave group");
      }
    } catch (e) {
      console.error(e);
      if ((window as any).toast) (window as any).toast("Failed to leave group due to a network error.", "error");
      else alert("Failed to leave group due to a network error.");
    }
  };

  const handleCancelJoinRequestClick = async () => {
    if (!confirm("Are you sure you want to cancel your request to join this group?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/join/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMembershipState(null);
        if ((window as any).toast) (window as any).toast("Request cancelled.", "success");
      } else {
        if ((window as any).toast) (window as any).toast(data.message || "Failed to cancel request", "error");
        else alert(data.message || "Failed to cancel request");
      }
    } catch (e) {
      console.error(e);
      if ((window as any).toast) (window as any).toast("Failed to cancel request due to a network error.", "error");
      else alert("Failed to cancel request due to a network error.");
    }
  };

  return {
    isJoined,
    isPending,
    showQModal,
    setShowQModal,
    answers,
    setAnswers,
    handleJoinClick,
    handleLeaveClick,
    handleCancelJoinRequestClick,
    submitJoinRequest
  };
}
