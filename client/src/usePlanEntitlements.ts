// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';



export const DEFAULT_FREE_ENTITLEMENTS = {
  group_max_groups: -1,
  group_allowed_visibility: ['unlisted'],
  group_allowed_join_modes: ['open', 'invite_only'],
  group_max_capacity: 25,
  group_can_restricted_access: false,
  event_allowed_registration_modes: ['free', 'cash'],
  event_allowed_visibility: ['unlisted', 'custom'],
  event_allowed_join_modes: ['restricted', 'invite'],
  event_max_participants: 100,
  event_checkin_methods: ['scanner', 'manual', 'gate'],
  event_can_create_paid_tickets: false
};

export const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

export function usePlanEntitlements() {
  const [entitlements, setEntitlements] = useState(DEFAULT_FREE_ENTITLEMENTS);
  const [plan, setPlan] = useState('free');
  const [planDisplayName, setPlanDisplayName] = useState('Free Plan');
  const [loading, setLoading] = useState(true);

  const fetchEntitlements = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setEntitlements(DEFAULT_FREE_ENTITLEMENTS);
      setPlan('free');
      setPlanDisplayName('Free Plan');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/subscription/entitlements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setEntitlements(data.data.entitlements);
        setPlan(data.data.plan || 'free');
        setPlanDisplayName(data.data.planDisplayName || 'Free Plan');
      } else {
        setEntitlements(DEFAULT_FREE_ENTITLEMENTS);
        setPlan('free');
        setPlanDisplayName('Free Plan');
      }
    } catch (err) {
      console.error('Failed to fetch plan entitlements:', err);
      setEntitlements(DEFAULT_FREE_ENTITLEMENTS);
      setPlan('free');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntitlements();
    // Listen for custom event indicating subscription state changed
    const handleSubscriptionChange = () => {
      fetchEntitlements();
    };
    window.addEventListener('subscription_changed', handleSubscriptionChange);
    return () => {
      window.removeEventListener('subscription_changed', handleSubscriptionChange);
    };
  }, [fetchEntitlements]);

  return {
    entitlements,
    plan,
    planDisplayName,
    loading,
    refetch: fetchEntitlements
  };
}

// Assign to window for global access in non-module files

