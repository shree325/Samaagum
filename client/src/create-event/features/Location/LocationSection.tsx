// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { I } from '../../../home-icons';
import { MeetingLinkModal, MeetingPreviewCard, detectProvider } from '../../../VirtualMeetings';

export function LocationSection({
  venue,
  setVenue,
  locType,
  setLocType,
  eventId,
  onEventCreated,
  existingVirtualMeeting,
  onProviderSwitch,
  offlineEntryType,
  setOfflineEntryType,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(venue);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<'zoom' | 'google' | null>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '';

  useEffect(() => {
    if (!draft || draft.length < 2 || draft.startsWith('http')) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`${apiBase}/api/public/locations/search?q=${encodeURIComponent(draft)}`)
        .then(r => r.json())
        .then(res => { if (res.success) setSearchResults(res.data); });
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, apiBase]);

  const commit = (value: string, type: string) => { setVenue(value); setLocType(type); setDraft(value); setIsOpen(false); };
  const handleInput = (e: any) => { setDraft(e.target.value); setVenue(e.target.value); };

  const displayTitle = venue || 'Add Event Location';
  const displaySub = venue
    ? locType === 'online'
      ? `${detectProvider(venue) === 'google' ? 'Google Meet' : detectProvider(venue) === 'zoom' ? 'Zoom Meeting' : 'Virtual event'} - ${venue}`
      : venue
    : 'Offline location or virtual link';

  return (
    <div className="loc-sec-container">
      {activeModal && (
        <MeetingLinkModal
          provider={activeModal}
          initialUrl={editingUrl ?? ''}
          onClose={() => { setActiveModal(null); setEditingUrl(null); }}
          onSave={url => { commit(url, 'online'); setActiveModal(null); setEditingUrl(null); }}
        />
      )}

      {/* Toggle header */}
      <button type="button" onClick={() => setIsOpen(o => !o)} className="loc-sec-header">
        <span className="loc-sec-icon-wrapper">
          <I.pin style={{ width: 18, height: 18, color: 'var(--accent-2)' }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ink)', lineHeight: '1.2' }}>{displayTitle}</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displaySub}</p>
        </div>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}><I.chevD /></span>
      </button>

      {venue && locType === 'online' && !isOpen && (
        <MeetingPreviewCard url={venue} onEdit={() => { setEditingUrl(venue); setActiveModal(detectProvider(venue) === 'google' ? 'google' : 'zoom'); }} onRemove={() => commit('', 'physical')} />
      )}

      {/* Expanded panel */}
      {isOpen && (
        <div className="loc-sec-panel">
          <div className="loc-sec-input-wrapper">
            <input autoFocus type="text" value={draft} onChange={handleInput}
              onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) commit(draft.trim(), draft.startsWith('http') ? 'online' : 'physical'); if (e.key === 'Escape') setIsOpen(false); }}
              placeholder="Enter location or virtual link..." className="cinput"
              style={{ width: '100%', background: 'var(--field)', border: '1px solid var(--border)' }} />
          </div>

          {searchResults.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginTop: 8, marginBottom: 16 }}>
              {searchResults.map((loc, i) => (
                <button key={i} type="button"
                  onClick={() => { if (!loc.is_active) { alert(`The location '${loc.name}' is currently inactive and cannot be selected for events.`); return; } commit(loc.name, 'physical'); setSearchResults([]); }}
                  className="loc-sec-btn"
                  style={{ opacity: loc.is_active ? 1 : 0.5, cursor: loc.is_active ? 'pointer' : 'not-allowed', width: '100%', textAlign: 'left', background: 'var(--surface)', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <I.pin style={{ width: 15, height: 15, color: 'var(--ink-3)', marginTop: 2, flexShrink: 0 }} />
                    <div className="loc-sec-btn-content">
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--ink)', lineHeight: '1.2' }}>
                        {loc.name} {!loc.is_active && <span style={{ color: 'var(--red)', fontSize: '11px', marginLeft: 4 }}>(Inactive)</span>}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-2)', margin: '8px 16px' }} />

          <p className="loc-sec-label">Virtual Options</p>
          <button type="button" onClick={() => setActiveModal('zoom')} className="loc-sec-btn" style={{ alignItems: 'center' }}>
            <I.online style={{ width: 16, height: 16, color: 'var(--accent-1)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'var(--ink)', flex: 1, textAlign: 'left' }}>Add Zoom Link</span>
          </button>
          <button type="button" onClick={() => setActiveModal('google')} className="loc-sec-btn" style={{ alignItems: 'center' }}>
            <I.online style={{ width: 16, height: 16, color: 'var(--accent-2)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'var(--ink)', flex: 1, textAlign: 'left' }}>Add Google Meet Link</span>
          </button>

          <div style={{ display: 'flex', gap: 8, padding: '12px 16px 16px', color: 'var(--ink-3)', fontSize: '12px' }}>
            <span>💡</span>
            <span>If you have a virtual event link, you can enter or paste it above. Press <b>Enter</b> to save.</span>
          </div>
        </div>
      )}

      {venue && locType === 'physical' && (
        <div style={{ marginTop: 12, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <iframe width="100%" height="180" src={`https://maps.google.com/maps?q=${encodeURIComponent(venue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            frameBorder="0" style={{ border: 0, display: 'block' }} allowFullScreen />
        </div>
      )}
    </div>
  );
}
