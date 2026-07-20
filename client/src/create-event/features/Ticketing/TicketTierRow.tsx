// @ts-nocheck
import React from 'react';
import { I } from '../../../home-icons';
import type { TicketTierDraft } from '../../types';

export function TicketTierRow({
  ticket,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  ticket: TicketTierDraft;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--field)', borderRadius: 10, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 14 }}>{ticket.name}</span>
          {ticket.visibility === 'PRIVATE' && (
            <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.15)', color: '#6366f1', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Private</span>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
          {ticket.capacity === null ? 'Unlimited capacity' : `${ticket.capacity} tickets`} · {ticket.price_minor === 0 ? 'Free' : `₹${ticket.price_minor / 100}`}
        </span>
        {ticket.description && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic' }}>{ticket.description}</span>}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onEdit}      title="Edit Ticket"      style={{ padding: '0 8px', height: 32, display: 'flex', alignItems: 'center' }}><I.edit style={{ width: 14, height: 14 }} /></button>
        <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onDelete}     title="Delete Ticket"   style={{ padding: '0 8px', height: 32, display: 'flex', alignItems: 'center', color: '#e5484d' }}><I.x style={{ width: 14, height: 14 }} /></button>
      </div>
    </div>
  );
}
