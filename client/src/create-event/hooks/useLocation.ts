import { useState } from 'react';

export function useLocation({ draft, editEv }: any) {
  const [locType, setLocType] = useState(
    draft?.locType ?? (editEv?.location_type === 'online' ? 'online' : 'physical')
  );
  const [venue, setVenue] = useState(
    draft?.venue ?? (editEv?.location_type === 'online' ? editEv?.online_link : (editEv?.venue_raw?.name ?? editEv?.venue_raw?.address ?? editEv?.venue?.name ?? editEv?.venue?.address ?? ''))
  );
  const [offlineEntryType, setOfflineEntryType] = useState<'single' | 'multi'>(
    draft?.offlineEntryType ?? editEv?.settings?.offline_entry_type ?? 'single'
  );

  return {
    locType,
    setLocType,
    venue,
    setVenue,
    offlineEntryType,
    setOfflineEntryType,
  };
}
