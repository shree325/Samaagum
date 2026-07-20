import React, { useState } from 'react';
import { OnlineMeetingCard } from './OnlineMeetingCard';
import { I } from './home-icons';

interface EventSidebarProps {
  e: any;
  currentEvent: any;
  isMember: boolean;
  confirmedCount: number;
  hostStats: any;
  attendees: any[];
  city: string;
  go: (view: string, params?: any) => void;
  ME: any;
  Avatar: React.ComponentType<any>;
  claimToken?: string | null;
  apiBase?: string;
  onPaymentProofUploaded?: (url: string) => void;
}

export function EventSidebar({
  e,
  currentEvent,
  isMember,
  confirmedCount,
  hostStats,
  attendees,
  city,
  go,
  ME,
  Avatar,
  claimToken,
  apiBase,
  onPaymentProofUploaded
}: EventSidebarProps) {
  const isPast = e.ends_at
    ? new Date(e.ends_at) < new Date()
    : (e.starts_at ? new Date(e.starts_at) < new Date() : false);

  const confirmedList = hostStats?.confirmed || attendees || [];

  const settingsObj = typeof e.settings === 'string' ? JSON.parse(e.settings) : (e.settings || {});
  const allowImg = settingsObj.allow_image_proof === true;

  const [transactionId, setTransactionId] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const handleImageChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if ((window as any).toast) (window as any).toast("File is too large (max 5MB)", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTransactionId(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTransactionId = async () => {
    if (!currentEvent.bookingId || !apiBase) return;
    setUploadingProof(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/bookings/${currentEvent.bookingId}/payment-proof`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId: transactionId || 'N/A' })
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.success && data.paymentProofUrl) {
        if (onPaymentProofUploaded) onPaymentProofUploaded(data.paymentProofUrl);
        if ((window as any).toast) (window as any).toast('Payment proof uploaded successfully', 'success');
      }
    } catch (err) {
      if ((window as any).toast) (window as any).toast('Failed to upload payment proof', 'warning');
    }
    setUploadingProof(false);
  };

  return (
    <div className="ev-aside" style={{ width: 280, marginLeft: 20 }}>
      {claimToken && !isMember && (
        <div className="ticket-box" style={{ cursor: "pointer", transition: "transform 0.2s" }} onClick={() => go("claim", claimToken)} onMouseEnter={evt => evt.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={evt => evt.currentTarget.style.transform = "scale(1)"}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)", letterSpacing: "0.05em", marginBottom: 12 }}>
              You have a Ticket!
            </div>
            <div style={{ padding: 10, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", filter: "blur(5px)", opacity: 0.9 }}>
              {(() => {
                const TicketQR = (window as any).TicketQR;
                return TicketQR ? <TicketQR token={claimToken} size={120} /> : <div style={{width: 120, height: 120, background: "#eee"}} />;
              })()}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
              Click to claim & view ticket
            </div>
          </div>
        </div>
      )}

      {isMember && (
        <div className="ticket-box">
          {currentEvent.bookingStatus === 'pending_payment' ? (
            <div style={{ display: "flex", flexDirection: "column", padding: "20px 16px", background: "rgba(245,158,11,0.05)", borderRadius: "var(--r-md)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", background: "#f59e0b", color: "#fff", alignItems: "center", justifyContent: "center" }}>
                  <I.clock style={{ width: 14, height: 14 }} />
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>Payment Pending</span>
              </div>
              
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
                Your registration is on hold. Please complete the payment to secure your ticket.
              </div>

              {currentEvent.payment_instructions && (
                <div style={{ background: "var(--surface)", padding: 12, borderRadius: 8, fontSize: 13, color: "var(--ink)", border: "1px solid var(--border)", marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Payment Instructions:</strong>
                  {currentEvent.payment_instructions}
                </div>
              )}
              
              {currentEvent.paymentProofUrl ? (
                <div style={{ background: "rgba(16,185,129,0.08)", padding: 12, borderRadius: 8, border: "1px solid rgba(16,185,129,0.25)", color: "#065f46" }}>
                  <strong>Proof uploaded!</strong>
                </div>
              ) : (
                <>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Submit Transaction ID {allowImg && 'or Upload Proof'}:</div>
                    {allowImg && (
                      <>
                        {transactionId && transactionId.startsWith('data:') && (
                          <div style={{ width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 8, background: 'var(--bg-2)' }}>
                            <img src={transactionId} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <label className="hbtn hbtn--ghost" style={{ cursor: 'pointer', textAlign: 'center', display: 'block', width: '100%' }}>
                          {transactionId.startsWith('data:') ? 'Change Image' : 'Upload Image Proof'}
                          <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                        </label>
                        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', margin: '4px 0' }}>OR</div>
                      </>
                    )}
                    <input 
                      type="text" 
                      className="cinput" 
                      placeholder="Enter Transaction ID" 
                      value={!transactionId.startsWith('data:') ? transactionId : ''}
                      onChange={(ev) => setTransactionId(ev.target.value)}
                    />
                    <button 
                      className="hbtn hbtn--primary" 
                      onClick={handleSubmitTransactionId} 
                      disabled={uploadingProof} 
                      style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                    >
                      {uploadingProof ? 'Submitting...' : 'Submit Transaction Proof'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            e.online ? (
              <OnlineMeetingCard url={e.online_link} banner={e.cover} status={currentEvent.status} isPast={isPast} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)", letterSpacing: "0.05em", marginBottom: 12 }}>
                  Your Event Ticket
                </div>
                <div style={{ padding: 10, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(() => {
                    const TicketQR = (window as any).TicketQR;
                    return TicketQR && <TicketQR token={e.qrToken || e.attendeeId || e.id || "test"} size={120} />;
                  })()}
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
                  Scan QR at entry gate
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="ev-block" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, marginTop: 0 }}>{confirmedCount} attending</h3>
        <div className="att-grid">
          {confirmedList.slice(0, 8).map((a: any, i: number) => {
            const name = typeof a === 'object' ? (a.name || a.display_name) : a;
            const userId = typeof a === 'object' ? (a.userId || a.id || a.bookingId) : undefined;
            const picture = typeof a === 'object' ? a.picture : undefined;
            const uniqueKey = typeof a === 'object'
              ? `${a.id || a.userId || a.bookingId || 'att'}-${i}`
              : `guest-${i}`;
            return (
              <div
                key={uniqueKey}
                className="att"
                style={{ cursor: userId ? "pointer" : "default" }}
                onClick={() => userId && go("profile", { id: userId })}
              >
                <Avatar name={name || "Guest"} userId={userId} img={picture} size={28} />
                <span className="nm">{name || "Guest"}</span>
              </div>
            );
          })}
          {confirmedCount > 8 && (
            <div className="att" style={{ paddingRight: 14 }}>
              <div className="av" style={{ width: 28, height: 28, fontSize: 11, background: "var(--surface-2)", color: "var(--ink-2)" }}>
                +{confirmedCount - 8}
              </div>
              <span className="nm">more</span>
            </div>
          )}
        </div>
      </div>

      <div className="host-card" style={{ marginTop: 16 }}>
        <div className="hh">
          <Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={46} />
          <div>
            <div className="n">{e.host}</div>
            <div className="r">{e.hostType === 'group' ? 'Group' : 'Organizer'}</div>
          </div>
        </div>
        <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss an update.</div>
      </div>
    </div>
  );
}
