// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';
import type { TicketTierDraft } from '../../types';
import { DEFAULT_FREE_ENTITLEMENTS } from '../../constants';
import { Toggle } from '../../ui/Toggle';
import { UpgradePlanModal } from '../../ui/UpgradePlanModal';
import { TicketTierList } from './TicketTierList';
import { TicketFormModal } from './TicketFormModal';

function ensureTicketTierDraft(t: any): TicketTierDraft {
  return {
    id:              t.id || `t-${Math.random().toString(36).substr(2, 9)}`,
    name:            t.name || t.n || '',
    description:     t.description || '',
    capacity:        t.capacity !== undefined ? (t.capacity === null ? null : Number(t.capacity)) : null,
    price_minor:     t.price_minor !== undefined ? Number(t.price_minor) : (t.price !== undefined ? Number(t.price) * 100 : 0),
    price_currency:  t.price_currency || 'INR',
    max_per_booking: t.max_per_booking !== undefined ? (t.max_per_booking === null ? null : Number(t.max_per_booking)) : null,
    sale_start:      t.sale_start || null,
    sale_end:        t.sale_end   || null,
    visibility:      t.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
  };
}

export function TicketSettingsModal({
  open,
  onClose,
  type,
  setType,
  tickets,
  setTickets,
  mobile,
  upgradeModalOpen,
  setUpgradeModalOpen,
  upgradeFeature,
  setUpgradeFeature,
  st,
  go,
  locType,
  paymentInstructions,
  setPaymentInstructions,
  paymentHoldHours,
  setPaymentHoldHours,
  allowImageProof,
  setAllowImageProof,
  eventStartDate,
}: any) {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketTierDraft | null>(null);

  if (!open) return null;

  const normalizedTickets = (tickets || []).map(ensureTicketTierDraft);
  const entitlements = st?.entitlements || DEFAULT_FREE_ENTITLEMENTS;
  const allowedModes = entitlements.event_allowed_registration_modes || ['free'];
  const canUseCash = allowedModes.includes('cash');
  const canUsePaid = allowedModes.includes('paid');

  const triggerUpgrade = (feat: string) => { setUpgradeFeature(feat); setUpgradeModalOpen(true); };

  const handleAddClick = () => {
    setEditingTicket({ id: `t-${Math.random().toString(36).substr(2, 9)}`, name: '', description: '', capacity: null, price_minor: 0, price_currency: 'INR', max_per_booking: null, visibility: 'PUBLIC', sale_start: null, sale_end: null });
    setFormModalOpen(true);
  };
  const handleEditClick      = (t: TicketTierDraft) => { setEditingTicket(t); setFormModalOpen(true); };
  const handleDuplicateClick = (t: TicketTierDraft) => {
    setTickets([...normalizedTickets, { ...t, id: `t-${Math.random().toString(36).substr(2, 9)}`, name: `${t.name} (Copy)` }]);
  };
  const handleDeleteClick = (t: TicketTierDraft) => {
    if (window.confirm(`Are you sure you want to delete the "${t.name}" ticket type?`))
      setTickets(normalizedTickets.filter(item => item.id !== t.id));
  };
  const handleSaveTicket = (saved: TicketTierDraft) => {
    const exists = normalizedTickets.some(item => item.id === saved.id);
    setTickets(exists ? normalizedTickets.map(item => item.id === saved.id ? saved : item) : [...normalizedTickets, saved]);
    setFormModalOpen(false); setEditingTicket(null);
  };

  const modeBtn = (id: string, icon: string, label: string, active: boolean, locked: boolean, onClickFn: () => void) => (
    <button type="button" onClick={onClickFn} style={{ padding: '14px', borderRadius: '12px', border: active ? '1.5px solid var(--accent-2)' : '1px solid var(--border)', background: active ? 'var(--accent-soft)' : 'var(--field)', color: active ? 'var(--accent-2)' : 'var(--ink-2)', fontWeight: 600, cursor: 'pointer', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}>
      {locked && '🔒 '}{icon} {label}
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', width: 480, maxHeight: '85vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Ticket Settings</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'var(--border-2)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
            <I.x style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Registration mode */}
          <div className="cfield" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8, display: 'block' }}>Registration Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: locType !== 'online' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12 }}>
              {modeBtn('free', '🎟️', 'Free RSVP', type === 'free', false, () => setType('free'))}
              {locType !== 'online' && modeBtn('cash', '💵', 'Cash Payment', type === 'cash', !canUseCash, () => { if (!canUseCash) { triggerUpgrade('Cash Payment Events'); return; } setType('cash'); })}
              {modeBtn('paid', '💳', 'Paid Tickets', type === 'paid', !canUsePaid, () => { if (!canUsePaid) { triggerUpgrade('Paid Events / Tickets'); return; } setType('paid'); })}
            </div>
          </div>
          {/* Ticket tiers */}
          {(type === 'paid' || type === 'cash') && (
            <div className="cfield" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block' }}>Ticket Tiers</label>
              <TicketTierList tickets={normalizedTickets} onEdit={handleEditClick} onDuplicate={handleDuplicateClick} onDelete={handleDeleteClick} />
              <button type="button" onClick={handleAddClick} style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: 'var(--accent-2)', fontWeight: 600, cursor: 'pointer' }}>
                ➕ Add ticket type
              </button>
            </div>
          )}
          {/* Cash payment details */}
          {type === 'cash' && (
            <div className="cfield" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div style={{ padding: '12px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: '8px', fontSize: 13, lineHeight: 1.5 }}>
                <strong>Note:</strong> Please add your payment details in the event description so attendees can see it.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block' }}>Payment Hold Duration (Hours)</label>
                <input type="number" className="cinput" placeholder="48" value={paymentHoldHours} onChange={e => setPaymentHoldHours(e.target.value)}
                  style={{ width: '100px', padding: '10px 12px', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Specify the capacity hold window before tickets are automatically cancelled.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <Toggle on={allowImageProof} onClick={() => setAllowImageProof(!allowImageProof)} />
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', margin: 0, cursor: 'pointer' }} onClick={() => setAllowImageProof(!allowImageProof)}>Enable Image Proof Upload</label>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Allow attendees to upload an image receipt instead of just a transaction ID.</div>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="hbtn hbtn--primary" onClick={onClose} style={{ borderRadius: '999px', padding: '10px 24px', fontWeight: 600, fontSize: 13 }}>Save &amp; Close</button>
        </div>
      </div>
      {upgradeModalOpen && <UpgradePlanModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} feature={upgradeFeature} go={go} currentPlanName={st?.planDisplayName} />}
      {formModalOpen && editingTicket && (
        <TicketFormModal
          open={formModalOpen}
          title={normalizedTickets.some(item => item.id === editingTicket.id) ? 'Edit ticket type' : 'Create ticket type'}
          ticket={editingTicket}
          onSave={handleSaveTicket}
          onClose={() => { setFormModalOpen(false); setEditingTicket(null); }}
          eventStartDate={eventStartDate}
        />
      )}
    </div>
  );
}
