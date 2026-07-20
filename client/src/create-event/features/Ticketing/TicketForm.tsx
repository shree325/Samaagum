// @ts-nocheck
import React from 'react';
import type { TicketTierDraft } from '../../types';

export function TicketForm({
  ticket,
  onChange,
  errors,
}: {
  ticket: TicketTierDraft;
  onChange: (updates: Partial<TicketTierDraft>) => void;
  errors: Record<string, string>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Name */}
      <div className="cfield" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Ticket Name *</label>
        <input className="cinput" placeholder="e.g. General Admission" value={ticket.name} onChange={e => onChange({ name: e.target.value })}
          style={{ width: '100%', background: 'var(--field)', border: errors.name ? '1px solid #e5484d' : '1px solid var(--border)' }} />
        {errors.name && <span style={{ fontSize: 11, color: '#e5484d', marginTop: 4, display: 'block' }}>{errors.name}</span>}
      </div>
      {/* Description */}
      <div className="cfield" style={{ marginBottom: 0 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Description</label>
        <textarea className="ctext" placeholder="What's included in this ticket tier?" value={ticket.description} onChange={e => onChange({ description: e.target.value })}
          style={{ width: '100%', minHeight: 60, background: 'var(--field)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: 8 }} />
      </div>
      {/* Price + Capacity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="cfield" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Price (₹) *</label>
          <input type="number" className="cinput" placeholder="0 for free"
            value={ticket.price_minor === 0 ? '' : (ticket.price_minor / 100).toString()}
            onChange={e => { const val = e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value) * 100); onChange({ price_minor: val }); }}
            style={{ width: '100%', background: 'var(--field)', border: errors.price ? '1px solid #e5484d' : '1px solid var(--border)' }} />
          {errors.price && <span style={{ fontSize: 11, color: '#e5484d', marginTop: 4, display: 'block' }}>{errors.price}</span>}
        </div>
        <div className="cfield" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Capacity Limit</label>
          <input type="number" className="cinput" placeholder="Unlimited"
            value={ticket.capacity === null ? '' : ticket.capacity.toString()}
            onChange={e => { const val = e.target.value === '' ? null : parseInt(e.target.value); onChange({ capacity: val }); }}
            style={{ width: '100%', background: 'var(--field)', border: errors.capacity ? '1px solid #e5484d' : '1px solid var(--border)' }} />
          {errors.capacity && <span style={{ fontSize: 11, color: '#e5484d', marginTop: 4, display: 'block' }}>{errors.capacity}</span>}
        </div>
      </div>
      {/* Max per booking + Visibility */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="cfield" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Max per Booking</label>
          <input type="number" className="cinput" placeholder="10"
            value={ticket.max_per_booking === null ? '' : ticket.max_per_booking.toString()}
            onChange={e => { const val = e.target.value === '' ? null : parseInt(e.target.value); onChange({ max_per_booking: val }); }}
            style={{ width: '100%', background: 'var(--field)', border: errors.max_per_booking ? '1px solid #e5484d' : '1px solid var(--border)' }} />
          {errors.max_per_booking && <span style={{ fontSize: 11, color: '#e5484d', marginTop: 4, display: 'block' }}>{errors.max_per_booking}</span>}
        </div>
        <div className="cfield" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Visibility</label>
          <select className="cselect" value={ticket.visibility} onChange={e => onChange({ visibility: e.target.value as 'PUBLIC' | 'PRIVATE' })}
            style={{ background: 'var(--field)', border: '1px solid var(--border)', height: 44, borderRadius: 8 }}>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private (Invite Link Only)</option>
          </select>
        </div>
      </div>
      {/* Sale start/end */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="cfield" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Sales Start Date</label>
          <input type="datetime-local" className="cinput" value={ticket.sale_start || ''} onChange={e => onChange({ sale_start: e.target.value || null })}
            style={{ width: '100%', background: 'var(--field)', border: errors.sale_start ? '1px solid #e5484d' : '1px solid var(--border)' }} />
          {errors.sale_start && <span style={{ fontSize: 11, color: '#e5484d', marginTop: 4, display: 'block' }}>{errors.sale_start}</span>}
        </div>
        <div className="cfield" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4, display: 'block' }}>Sales End Date</label>
          <input type="datetime-local" className="cinput" value={ticket.sale_end || ''} onChange={e => onChange({ sale_end: e.target.value || null })}
            style={{ width: '100%', background: 'var(--field)', border: errors.sale_end ? '1px solid #e5484d' : '1px solid var(--border)' }} />
          {errors.sale_end && <span style={{ fontSize: 11, color: '#e5484d', marginTop: 4, display: 'block' }}>{errors.sale_end}</span>}
        </div>
      </div>
    </div>
  );
}
