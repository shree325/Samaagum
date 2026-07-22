import { useState, useEffect } from 'react';

export function useCapacity({ draft, editEv, isNewEvent, entitlements }: any) {
  const [capacityEnabled, setCapacityEnabled] = useState(
    draft?.capacityEnabled ?? (isNewEvent ? entitlements?.event_max_participants !== -1 : !!editEv?.capacity_total)
  );
  const [capacity, setCapacity] = useState(
    draft?.capacity
    ?? (isNewEvent
        ? (entitlements?.event_max_participants !== -1 ? String(entitlements?.event_max_participants) : '')
        : (editEv?.capacity_total ?? ''))
  );
  const [waitlist, setWaitlist] = useState(
    draft?.waitlist ?? (editEv?.settings?.capacity?.waitlist ?? editEv?.waitlist ?? false)
  );
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);

  return {
    capacityEnabled,
    setCapacityEnabled,
    capacity,
    setCapacity,
    waitlist,
    setWaitlist,
    capacityModalOpen,
    setCapacityModalOpen,
  };
}
