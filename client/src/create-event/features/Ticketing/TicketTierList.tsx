// @ts-nocheck
import React from 'react';
import type { TicketTierDraft } from '../../types';
import { TicketTierRow } from './TicketTierRow';

export function TicketTierList({
  tickets,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  tickets: TicketTierDraft[];
  onEdit: (ticket: TicketTierDraft) => void;
  onDuplicate: (ticket: TicketTierDraft) => void;
  onDelete: (ticket: TicketTierDraft) => void;
}) {
  if (tickets.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', background: 'var(--field)', borderRadius: 10, border: '1px dashed var(--border)', color: 'var(--ink-3)', fontSize: 13 }}>
        No ticket types added yet. Click below to add one.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tickets.map(t => (
        <TicketTierRow key={t.id} ticket={t} onEdit={() => onEdit(t)} onDuplicate={() => onDuplicate(t)} onDelete={() => onDelete(t)} />
      ))}
    </div>
  );
}
