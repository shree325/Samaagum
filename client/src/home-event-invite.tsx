// @ts-nocheck
import React from 'react';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — Event Invite Landing
   ============================================================ */

export function EventInviteLanding({ token, go }) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [inviteData, setInviteData] = React.useState(null);

    React.useEffect(() => {
        const fetchInvite = async () => {
            try {
                const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                const authToken = localStorage.getItem('token');
                const res = await fetch(`${apiBase}/api/events/invite/${token}`, {
                    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                });
                const data = await res.json();
                if (data.success) {
                    setInviteData(data.data);
                    // A 'view' link (unlisted-visibility bypass) just needs to open the event —
                    // continue straight through to the join page with the token attached.
                    if (data.data.purpose === 'view') {
                        go("event-join", { ...data.data.event, inviteToken: token });
                    }
                } else {
                    setError(data.message || "Invalid or expired invitation.");
                }
            } catch (e) {
                console.error(e);
                setError("Failed to load invitation.");
            } finally {
                setLoading(false);
            }
        };
        fetchInvite();
    }, [token]);

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", padding: 20 }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 40, textAlign: "center", maxWidth: 400 }}>
                    <I.lock style={{ width: 48, height: 48, color: "var(--red)", marginBottom: 16 }} />
                    <h2 style={{ margin: "0 0 12px 0", fontSize: 20 }}>Invalid Invitation</h2>
                    <p style={{ color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>{error}</p>
                    <button className="hbtn hbtn--soft" style={{ marginTop: 24, width: "100%", justifyContent: "center" }} onClick={() => go("home")}>Return to Home</button>
                </div>
            </div>
        );
    }

    // purpose === 'view' redirects immediately above; only 'join' renders this confirmation
    // screen — clicking Continue unlocks the normal join flow with the token attached.
    const { event } = inviteData;

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 420, boxShadow: "var(--sh-lg)", padding: "40px 24px 32px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
                <h2 style={{ margin: "0 0 8px 0", fontSize: 22 }}>You're invited!</h2>
                <p style={{ color: "var(--ink-2)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
                    You've been invited to join <strong>{event?.title || "this event"}</strong>. This link can only be used once.
                </p>
                <button
                    className="hbtn hbtn--primary"
                    style={{ width: "100%", justifyContent: "center", height: 44, marginBottom: 8 }}
                    onClick={() => go("event-join", { ...event, inviteToken: token })}
                >
                    Continue
                </button>
                <button className="hbtn hbtn--ghost" style={{ width: "100%", justifyContent: "center", height: 44, color: "var(--ink-3)" }} onClick={() => go("home")}>
                    Not now
                </button>
            </div>
        </div>
    );
}
