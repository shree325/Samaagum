// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { I } from '../../../home-icons';
import { Toggle } from '../../ui/Toggle';

export function CapacitySettingsModal({
  open,
  onClose,
  capacityEnabled,
  setCapacityEnabled,
  capacity,
  setCapacity,
  waitlist,
  setWaitlist,
  eventMaxParticipants,
  triggerUpgrade,
}: any) {
  const [tempEnabled,  setTempEnabled]  = useState(capacityEnabled);
  const [tempCapacity, setTempCapacity] = useState(capacity);
  const [tempWaitlist, setTempWaitlist] = useState(waitlist);

  useEffect(() => {
    if (open) { setTempEnabled(capacityEnabled); setTempCapacity(capacity); setTempWaitlist(waitlist); }
  }, [open, capacityEnabled, capacity, waitlist]);

  if (!open) return null;

  const handleSave = () => {
    if (tempEnabled && (!tempCapacity || parseInt(tempCapacity) < 1)) {
      alert('Please enter a valid capacity (at least 1).');
      return;
    }
    if (tempEnabled && eventMaxParticipants !== -1 && parseInt(tempCapacity) > eventMaxParticipants) {
      alert(`Your plan limits capacity to a maximum of ${eventMaxParticipants}.`);
      return;
    }
    setCapacityEnabled(tempEnabled);
    setCapacity(tempEnabled ? tempCapacity : '');
    setWaitlist(tempEnabled ? tempWaitlist : false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', width: 400, borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--sh-xl)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 12px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Capacity Settings</h2>
          <button className="hbtn hbtn--ghost hbtn--sm" onClick={onClose} style={{ border: 'none' }}><I.x /></button>
        </div>
        {/* Body */}
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Enable Capacity Limit</span>
            <Toggle on={tempEnabled} onClick={() => setTempEnabled(!tempEnabled)} />
          </div>
          {tempEnabled && (
            <div className="cfield" style={{ marginBottom: 0, animation: 'fadeIn 0.2s' }}>
              <label style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Max Capacity</label>
              {eventMaxParticipants !== -1 && (
                <div style={{ padding: '8px 10px', background: 'var(--field)', borderRadius: 'var(--r-sm)', border: '1px dashed var(--accent)', fontSize: '11px', color: 'var(--ink-2)', marginBottom: 12 }}>
                  🔒 Under your current plan, event capacity is capped at a maximum of <strong>{eventMaxParticipants}</strong> participants. Upgrade to Standard for unlimited capacity.
                </div>
              )}
              <input type="number" className="cinput" placeholder="50" value={tempCapacity} onChange={e => setTempCapacity(e.target.value)}
                style={{ width: '100%', background: 'var(--field)', border: '1px solid var(--border)', height: 44, borderRadius: '10px', padding: '0 14px', fontSize: 14 }} />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Enable Waitlist</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Registrations above capacity are added to the waitlist.</span>
            </div>
            <Toggle on={tempWaitlist} onClick={() => setTempWaitlist(!tempWaitlist)} />
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="hbtn hbtn--ghost" onClick={onClose} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '999px', padding: '10px 20px', fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button className="hbtn hbtn--primary" onClick={handleSave} style={{ background: 'linear-gradient(135deg, #ff4e50, #f9d423)', border: 'none', color: '#fff', borderRadius: '999px', padding: '10px 24px', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(255,78,80,0.2)' }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export function CapacityModal({
  open,
  onClose,
  capacity,
  setCapacity,
  waitlist,
  setWaitlist,
  eventMaxParticipants,
  triggerUpgrade,
}: any) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', width: 420, borderRadius: '20px', padding: 24, boxShadow: 'var(--sh-xl)' }}>
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => {
            if (eventMaxParticipants !== -1 && (!capacity || parseInt(capacity) > eventMaxParticipants || parseInt(capacity) < 1)) {
              alert(`Event capacity must be between 1 and ${eventMaxParticipants} participants under your current plan.`);
              triggerUpgrade?.(`Event Capacity > ${eventMaxParticipants}`);
              return;
            }
            onClose();
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}
