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
        alert(data.message || "Failed to join");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinClick = async () => {
    if (isJoined || isPending) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert("Please log in to join groups.");

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
        alert("You have left the group successfully.");
      } else {
        alert(data.message || "Failed to leave group");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to leave group due to a network error.");
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
        fetchGroupDetails();
        if (window.toast) window.toast("Join request cancelled.");
      } else {
        alert(data.message || "Failed to cancel request");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to cancel request due to a network error.");
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
