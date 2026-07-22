import React, { useState, useEffect } from 'react';
import { ME } from './home-data';
import { I } from './home-icons';

export function CheckoutModal({ 
    isOpen, 
    onClose, 
    liveEvent, 
    expandedTickets, 
    st, 
    onConfirm
}: any) {
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const token = localStorage.getItem('token');

    const [checkoutStep, setCheckoutStep] = useState<"attendee_details" | "review" | "payment_proof">("attendee_details");
    const [attendees, setAttendees] = useState<any[]>([]);
    const [checkoutTransactionId, setCheckoutTransactionId] = useState("");
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                if (window.toast) window.toast("File is too large (max 5MB)", "warning");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCheckoutTransactionId(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const qty = expandedTickets ? expandedTickets.length : 1;

    useEffect(() => {
        if (!isOpen) return;
        setAttendees(prev => {
            if (prev.length === qty) return prev;
            if (prev.length < qty) {
                return [...prev, ...Array.from({ length: qty - prev.length }).map((_, i) => {
                    const isFirst = prev.length === 0 && i === 0;
                    return {
                        name: isFirst ? (ME.name || '') : '', 
                        email: isFirst ? ((ME as any).email || (ME as any).primary_email || '') : '', 
                        gender: isFirst ? ((ME as any).gender || '') : '', 
                        status: 'unknown', 
                        warningMsg: ''
                    };
                })];
            }
            return prev.slice(0, qty);
        });
    }, [qty, isOpen]);

    const handleAttendeeChange = (index: number, field: string, value: string) => {
        setAttendees(prev => {
            const next = [...prev];
            if (field === 'email') {
                // Reset member-filled fields when email changes so stale data doesn't linger
                next[index] = { ...next[index], email: value, status: 'unknown', warningMsg: '' };
            } else {
                next[index] = { ...next[index], [field]: value };
            }
            return next;
        });
    };

    const performLookup = async (email: string, index: number) => {
        if (!email || !email.includes('@')) return;
        const duplicates = attendees.filter((a, i) => i !== index && a.email.toLowerCase() === email.toLowerCase());
        if (duplicates.length > 0) {
            setAttendees(prev => {
                const next = [...prev];
                next[index] = { ...next[index], status: 'warning', warningMsg: '⚠️ This email is already entered in this order.' };
                return next;
            });
            return;
        }

        try {
            const activeToken = localStorage.getItem('token');
            const res = await fetch(`${apiBase}/api/users/lookup?email=${encodeURIComponent(email)}&eventId=${liveEvent.id}`, {
                headers: activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {}
            });
            const data = await res.json();
            
            setAttendees(prev => {
                const next = [...prev];
                if (data.exists) {
                    if (data.hasTicket) {
                        // Member found but already has a ticket — still fill in name/gender
                        next[index] = { 
                            ...next[index], 
                            name: data.name || next[index].name, 
                            gender: data.gender || next[index].gender, 
                            status: 'warning', 
                            warningMsg: '⚠️ This attendee already appears to have a ticket for this event.' 
                        };
                    } else {
                        // Member found — always auto-fill name and gender from their profile
                        next[index] = { 
                            ...next[index], 
                            name: data.name || next[index].name, 
                            gender: data.gender || next[index].gender, 
                            status: 'member', 
                            warningMsg: '' 
                        };
                    }
                } else {
                    next[index] = { ...next[index], status: 'guest', warningMsg: '' };
                }
                return next;
            });
        } catch (err) {
            console.error('Lookup failed', err);
        }
    };

    useEffect(() => {
        const handlers: ReturnType<typeof setTimeout>[] = [];
        attendees.forEach((att, index) => {
            const handler = setTimeout(() => {
                if (att.email && att.status === 'unknown') performLookup(att.email, index);
            }, 500);
            handlers.push(handler);
        });
        return () => handlers.forEach(h => clearTimeout(h));
        // eslint-disable-next-line
    }, [attendees.map(a => a.email).join(','), liveEvent.id]);

    if (!isOpen) return null;

    const areAttendeesValid = attendees.every(a => a.name.trim() !== '' && a.email.includes('@'));

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10000, padding: 16
        }}>
            <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, width: '100%', maxWidth: 500, display: 'flex',
                flexDirection: 'column', maxHeight: '85vh', boxShadow: 'var(--sh-lg)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border-2)' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                            {checkoutStep === "attendee_details" && "Checkout"}
                            {checkoutStep === "review" && "Review Order"}
                            {checkoutStep === "payment_proof" && "Payment Details"}
                        </h3>
                        {expandedTickets && expandedTickets.length > 0 && (
                            <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ fontWeight: 600 }}>{qty} Ticket{qty > 1 ? 's' : ''}</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {Array.from(new Set(expandedTickets.map((t: any) => t.ticketName))).map(name => {
                                        const count = expandedTickets.filter((t: any) => t.ticketName === name).length;
                                        return <span key={name as string}>• {name as string} &times;{count}</span>;
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', fontSize: 20, cursor: 'pointer' }}>×</button>
                </div>

                <div className="scroll" style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {checkoutStep === "attendee_details" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Attendees Details list */}
                            {attendees.map((att, index) => (
                                <div key={index} style={{ border: '1px solid var(--border-2)', borderRadius: 12, padding: 16, background: 'var(--surface)' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                                        Attendee {index + 1} {expandedTickets && expandedTickets[index] ? `(${expandedTickets[index].ticketName})` : 'Details'}
                                        {att.status === 'member' && <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 12 }}>✓ Samaagum Member</span>}
                                        {att.status === 'guest' && <span style={{ fontSize: 11, color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: 12 }}>○ Guest Attendee</span>}
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Email Address *</label>
                                            <input className="cinput" type="email" value={att.email} onChange={e => { handleAttendeeChange(index, 'email', e.target.value); }} placeholder="attendee@example.com" style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }} />
                                        </div>
                                        {att.warningMsg && <div style={{ fontSize: 12, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 10px', borderRadius: 6 }}>{att.warningMsg}</div>}
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                                                    Full Name *
                                                    {att.status === 'member' && att.name && <span style={{ fontSize: 10, color: '#10b981', marginLeft: 6, fontWeight: 400 }}>auto-filled</span>}
                                                </label>
                                                <input 
                                                    className="cinput" 
                                                    type="text" 
                                                    value={att.name} 
                                                    onChange={e => handleAttendeeChange(index, 'name', e.target.value)} 
                                                    placeholder="Full Name" 
                                                    style={{ 
                                                        width: '100%', padding: '8px 12px', borderRadius: 6, 
                                                        border: att.status === 'member' && att.name ? '1px solid #10b981' : '1px solid var(--border)',
                                                        background: att.status === 'member' && att.name ? 'rgba(16,185,129,0.05)' : undefined
                                                    }} 
                                                />
                                            </div>
                                            <div style={{ width: 100 }}>
                                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                                                    Gender
                                                    {att.status === 'member' && att.gender && <span style={{ fontSize: 10, color: '#10b981', marginLeft: 6, fontWeight: 400 }}>auto</span>}
                                                </label>
                                                <select 
                                                    className="cinput" 
                                                    value={att.gender} 
                                                    onChange={e => handleAttendeeChange(index, 'gender', e.target.value)} 
                                                    style={{ 
                                                        width: '100%', padding: '8px 12px', borderRadius: 6, 
                                                        border: att.status === 'member' && att.gender ? '1px solid #10b981' : '1px solid var(--border)', 
                                                        background: att.status === 'member' && att.gender ? 'rgba(16,185,129,0.05)' : 'var(--field)' 
                                                    }}
                                                >
                                                    <option value="">-</option>
                                                    <option value="male">M</option>
                                                    <option value="female">F</option>
                                                    <option value="other">O</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {checkoutStep === "review" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                                <div style={{ background: 'var(--surface-3)', padding: '12px 16px', fontWeight: 600, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
                                    Attendees ({qty})
                                </div>
                                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {attendees.map((att, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
                                            <div>
                                                <div style={{ fontWeight: 500, color: 'var(--ink)' }}>{att.name}</div>
                                                <div style={{ color: 'var(--ink-3)', fontSize: 12 }}>{att.email}</div>
                                            </div>
                                            <div>
                                                {att.status === 'member' || att.warningMsg?.includes('appear') ? (
                                                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ Samaagum Member</span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>○ Guest Attendee</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: 12, fontWeight: 700 }}>
                                <span>Total Price</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                                    <span style={{ fontSize: 16 }}>
                                        {liveEvent.type === "Free" 
                                            ? "Free" 
                                            : `₹${((expandedTickets || []).reduce((acc: number, t: any) => acc + (t.price || 0), 0) / 100).toFixed(0)}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {checkoutStep === "payment_proof" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Cash Payment: Show payment instructions & Transaction ID input in payment_proof step */}
                            {liveEvent.cash_enabled && liveEvent.type !== "Free" && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
                                        <strong>Cash Payment Required</strong> – Please check the event description for payment details and complete the payment before submitting.
                                    </div>
                                    {(() => {
                                        const settingsObj = liveEvent.settings || {};
                                        const allowImg = settingsObj.allow_image_proof === true;
                                        return (
                                            <>
                                                {allowImg ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                        <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Submit Transaction ID or Upload Proof:</div>
                                                        <input
                                                            type="text"
                                                            className="cinput"
                                                            placeholder="Transaction ID / UTR (required)"
                                                            value={checkoutTransactionId && !checkoutTransactionId.startsWith('data:') ? checkoutTransactionId : ''}
                                                            onChange={ev => setCheckoutTransactionId(ev.target.value)}
                                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', fontSize: 13 }}
                                                        />
                                                        <label style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: 8, 
                                                            padding: '10px 12px', 
                                                            background: checkoutTransactionId.startsWith('data:') ? 'var(--green)' : 'var(--surface)', 
                                                            border: checkoutTransactionId.startsWith('data:') ? 'none' : '1px solid var(--border)', 
                                                            borderRadius: 8, 
                                                            fontSize: 13, 
                                                            fontWeight: 600, 
                                                            color: checkoutTransactionId.startsWith('data:') ? '#fff' : 'var(--ink-2)', 
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}>
                                                            <I.image style={{ width: 16, height: 16 }} />
                                                            {checkoutTransactionId.startsWith('data:') ? 'Change Image' : 'Upload Image Proof'}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleImageChange}
                                                                style={{ display: 'none' }}
                                                            />
                                                        </label>
                                                        {checkoutTransactionId.startsWith('data:') && (
                                                            <div style={{ fontSize: 12, color: 'var(--accent-2)', fontWeight: 600, textAlign: 'center' }}>Image selected</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="cinput"
                                                        placeholder="Transaction ID / UTR (required)"
                                                        value={checkoutTransactionId}
                                                        onChange={ev => setCheckoutTransactionId(ev.target.value)}
                                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', fontSize: 13 }}
                                                    />
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid var(--border-2)', background: 'var(--surface-2)', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                    {checkoutStep === "attendee_details" && (
                        <>
                            <div></div>
                            <button className="hbtn hbtn--primary" disabled={!areAttendeesValid} onClick={() => setCheckoutStep("review")}>
                                Review Order
                            </button>
                        </>
                    )}
                    {checkoutStep === "review" && (
                        <>
                            <button className="hbtn hbtn--ghost" onClick={() => setCheckoutStep("attendee_details")}>Back</button>
                            <button className="hbtn hbtn--primary" onClick={() => { 
                                if (liveEvent.cash_enabled && liveEvent.type !== "Free") {
                                    setCheckoutStep("payment_proof");
                                } else {
                                    onConfirm({ buyer: attendees[0], attendees, transactionId: checkoutTransactionId || undefined }); 
                                }
                            }}>
                                {liveEvent.cash_enabled && liveEvent.type !== "Free" ? "Proceed to Payment" : "Confirm & Proceed"}
                            </button>
                        </>
                    )}
                    {checkoutStep === "payment_proof" && (
                        <>
                            <button className="hbtn hbtn--ghost" onClick={() => setCheckoutStep("review")}>Back</button>
                            <button className="hbtn hbtn--primary" onClick={() => { 
                                if (liveEvent.cash_enabled && liveEvent.type !== "Free" && !checkoutTransactionId) {
                                    if (window.toast) window.toast("Please provide a transaction ID or upload payment proof.", "warning");
                                    return;
                                }
                                onConfirm({ buyer: attendees[0], attendees, transactionId: checkoutTransactionId || undefined }); 
                            }}>
                                Confirm & Proceed
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
