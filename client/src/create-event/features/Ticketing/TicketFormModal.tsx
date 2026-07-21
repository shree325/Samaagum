// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { I } from '../../../home-icons';
import type { TicketTierDraft } from '../../types';
import { TicketForm } from './TicketForm';

export function TicketFormModal({
  open,
  title,
  ticket,
  onSave,
  onClose,
  eventStartDate,
}: {
  open: boolean;
  title: string;
  ticket: TicketTierDraft;
  onSave: (ticket: TicketTierDraft) => void;
  onClose: () => void;
  eventStartDate?: string;
}) {
  const [formState, setFormState] = useState<TicketTierDraft>(ticket);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  useEffect(() => { setFormState(ticket); setErrors({}); }, [ticket, open]);

  if (!open) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formState.name.trim())           errs.name = 'Ticket name is required';
    else if (formState.name.length > 100) errs.name = 'Ticket name must be under 100 characters';
    if (formState.price_minor < 0)        errs.price = 'Price cannot be negative';
    if (formState.capacity !== null && formState.capacity < 1)
      errs.capacity = 'Capacity must be at least 1';
    if (formState.max_per_booking !== null) {
      if (formState.max_per_booking < 1) errs.max_per_booking = 'Max per booking must be at least 1';
      else if (formState.capacity !== null && formState.max_per_booking > formState.capacity)
        errs.max_per_booking = `Cannot exceed capacity limit (${formState.capacity})`;
    }
    if (formState.sale_start && formState.sale_end && new Date(formState.sale_start) >= new Date(formState.sale_end)) {
      errs.sale_start = 'Sales start date must be before sales end date';
      errs.sale_end   = 'Sales end date must be after sales start date';
    }
    if (formState.sale_end && eventStartDate && new Date(formState.sale_end) > new Date(eventStartDate))
      errs.sale_end = 'Sales end date must be before or equal to event start time';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', width: 440, borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'var(--border-2)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
            <I.x style={{ width: 12, height: 12 }} />
          </button>
        </div>
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: '65vh' }}>
          <TicketForm ticket={formState} errors={errors} onChange={updates => setFormState(prev => ({ ...prev, ...updates }))} />
        </div>
        <div style={{ padding: '16px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="hbtn hbtn--ghost" onClick={onClose} style={{ borderRadius: '999px', padding: '8px 18px', fontSize: 13 }}>Cancel</button>
          <button type="button" className="hbtn hbtn--primary" onClick={() => { if (validate()) onSave(formState); }} style={{ borderRadius: '999px', padding: '8px 18px', fontSize: 13 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
