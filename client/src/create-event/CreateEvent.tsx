// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { CreateEventForm } from './CreateEventForm';

export function CreateEvent(props: any) {
  const { editEv } = props;
  const [eventData, setEventData] = useState(null as any);
  const [loading, setLoading] = useState(editEv?.id && editEv.id !== 'new' && !editEv.__draft);

  useEffect(() => {
    if (editEv?.id && editEv.id !== 'new' && !editEv.__draft) {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
      fetch(`${apiBase}/api/events/${editEv.id}`, { headers })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data?.event) {
            setEventData({
              ...d.data.event,
              tickets: d.data.tickets || []
            });
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [editEv?.id, editEv?.__draft]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading event details...</div>
      </div>
    );
  }

  return <CreateEventForm {...props} editEv={eventData || editEv} />;
}
export default CreateEvent;
