import { useState, useEffect } from 'react';

export function useTicketManager({ draft, editEv, canCreatePaidTickets, locType }: any) {
  const [type, setType] = useState(
    draft?.type
    ?? (editEv?.cash_enabled
        ? 'cash'
        : (editEv?.registration_mode
           ? ((editEv.registration_mode === 'free_rsvp' || editEv.registration_mode === 'free') ? 'free' : 'paid')
           : (canCreatePaidTickets ? 'paid' : 'free')))
  );

  const initialTickets = editEv?.tickets
    ? editEv.tickets.map((t: any) => ({
        ...t,
        id: t.id,
        n: t.name || t.n || '',
        cap: String(t.capacity !== undefined && t.capacity !== null ? t.capacity : (t.cap || '')),
        price: String(t.price_minor !== undefined && t.price_minor !== null ? (t.price_minor / 100) : (t.price || ''))
      }))
    : [{ n: 'Early Bird', cap: '50', price: '499' }];

  const [tickets, setTickets] = useState(draft?.tickets ?? initialTickets);

  const [paymentInstructions, setPaymentInstructions] = useState(
    draft?.paymentInstructions ?? editEv?.payment_instructions ?? ''
  );
  const [paymentHoldHours, setPaymentHoldHours] = useState(
    draft?.paymentHoldHours ?? (editEv?.payment_hold_hours ? String(editEv.payment_hold_hours) : '48')
  );
  const [allowImageProof, setAllowImageProof] = useState<boolean>(
    draft?.allowImageProof ?? editEv?.settings?.allow_image_proof ?? false
  );

  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  useEffect(() => {
    if (locType === 'online' && type === 'cash') {
      setType('free');
    }
  }, [locType, type]);

  return {
    type,
    setType,
    tickets,
    setTickets,
    paymentInstructions,
    setPaymentInstructions,
    paymentHoldHours,
    setPaymentHoldHours,
    allowImageProof,
    setAllowImageProof,
    ticketModalOpen,
    setTicketModalOpen,
  };
}
