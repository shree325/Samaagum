// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Grain } from './home-icons';
import { apiBase } from './home-subscription';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — Invite Landing
   ============================================================ */

export function InviteLanding({ token, go }) {
    const [loading, setLoading] = React.useState(true);
    const [inviteData, setInviteData] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [accepting, setAccepting] = React.useState(false);
    const [showQForm, setShowQForm] = React.useState(false);
    const [qAnswers, setQAnswers] = React.useState({});
    const [joinResult, setJoinResult] = React.useState(null);

    React.useEffect(() => {
        const fetchInvite = async () => {
            try {
                const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                const authToken = localStorage.getItem('token');
                const res = await fetch(`${apiBase}/api/groups/invite/${token}`, {
                    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
                });
                const data = await res.json();
                if (data.success) {
                    setInviteData(data.data);
                    if (data.data.isAlreadyMember) {
                        setJoinResult({ state: data.data.membershipState || 'active', groupId: data.data.group.id });
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

    const doAccept = async (answers) => {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            alert("Please log in or sign up to accept this invitation.");
            return;
        }
        setAccepting(true);
        try {
            const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
            const res = await fetch(`${apiBase}/api/groups/invite/${token}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });
            const data = await res.json();
            if (data.success) {
                const state = data.data?.membershipState || 'active';
                setJoinResult({ state, groupId: inviteData.group.id });
            } else {
                alert(data.message || "Failed to accept invitation.");
            }
        } catch (e) {
            console.error(e);
            alert("Error accepting invitation.");
        } finally {
            setAccepting(false);
        }
    };

    const handleAccept = () => {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
            alert("Please log in or sign up to accept this invitation.");
            return;
        }
        const questionnaires = inviteData?.group?.settings?.questionnaires || [];
        if (questionnaires.length > 0) {
            setShowQForm(true);
            return;
        }
        doAccept({});
    };

    const handleQSubmit = () => {
        const questionnaires = inviteData?.group?.settings?.questionnaires || [];
        const isAnswered = (val) => Array.isArray(val) ? val.length > 0 : !!(val && String(val).trim());
        const requiredMissing = questionnaires.some((q, i) => q.req && !isAnswered(qAnswers[i]));
        if (requiredMissing) {
            alert("Please answer all required questions.");
            return;
        }
        setShowQForm(false);
        doAccept(qAnswers);
    };

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

    if (joinResult) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 420, boxShadow: "var(--sh-lg)", padding: "40px 24px 32px", textAlign: "center" }}>
                    {joinResult.state === 'active' ? (
                        <>
                            <div style={{ fontSize: 48, marginBottom: 16, color: "var(--accent-2)" }}>✓</div>
                            <h2 style={{ margin: "0 0 8px 0", fontSize: 22 }}>You're in!</h2>
                            <p style={{ color: "var(--ink-2)", margin: "0 0 24px 0" }}>You've joined <strong>{inviteData.group.name}</strong>.</p>
                            <button className="hbtn hbtn--primary" style={{ width: "100%", justifyContent: "center", height: 44, marginBottom: 8 }} onClick={() => go("group", { id: joinResult.groupId })}>
                                Go to Group
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                            <h2 style={{ margin: "0 0 8px 0", fontSize: 22 }}>Request Submitted</h2>
                            <p style={{ color: "var(--ink-2)", margin: "0 0 24px 0", lineHeight: 1.5 }}>Your request to join <strong>{inviteData.group.name}</strong> has been submitted. The group owner will review your application and you'll be notified of their decision.</p>
                            <button className="hbtn hbtn--soft" style={{ width: "100%", justifyContent: "center", height: 44, marginBottom: 8 }} onClick={() => go("group", { id: joinResult.groupId })}>
                                View Group
                            </button>
                        </>
                    )}
                    <button className="hbtn hbtn--ghost" style={{ width: "100%", justifyContent: "center", height: 44, color: "var(--ink-3)" }} onClick={() => go("home")}>
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    const { group, invite } = inviteData;
    const questionnaires = group?.settings?.questionnaires || [];

    if (showQForm) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 480, boxShadow: "var(--sh-lg)", padding: "32px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Join Questionnaire</h2>
                        <button className="tool" onClick={() => setShowQForm(false)}><I.x style={{ width: 20, height: 20 }}/></button>
                    </div>
                    <p style={{ margin: "0 0 24px 0", fontSize: 13, color: "var(--ink-2)" }}>
                        Please answer the following to join <strong>{group.name}</strong>.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {questionnaires.map((q, i) => (
                            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <label style={{ fontSize: 14, fontWeight: 500 }}>
                                    {q.q} {q.req && <span style={{ color: "var(--red)" }}>*</span>}
                                </label>
                                {q.type === 'long' ? (
                                    <textarea
                                        placeholder="Your answer..."
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                                    />
                                ) : q.type === 'yesno' ? (
                                    <select
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit" }}
                                    >
                                        <option value="">Select...</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                ) : q.type === 'multiplechoice' && q.options && q.options.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {q.options.map((opt, oi) => (
                                            <label key={oi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                                <input
                                                    type="radio"
                                                    name={"q_" + i}
                                                    value={opt}
                                                    checked={qAnswers[i] === opt}
                                                    onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                                    style={{ margin: 0 }}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : q.type === 'multiselect' && q.options && q.options.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {q.options.map((opt, oi) => (
                                            <label key={oi} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                                                <input
                                                    type="checkbox"
                                                    value={opt}
                                                    checked={(qAnswers[i] || []).includes(opt)}
                                                    onChange={e => {
                                                        const cur = qAnswers[i] || [];
                                                        const next = e.target.checked ? [...cur, opt] : cur.filter(x => x !== opt);
                                                        setQAnswers({...qAnswers, [i]: next});
                                                    }}
                                                    style={{ margin: 0 }}
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : q.type === 'email' ? (
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit" }}
                                    />
                                ) : q.type === 'phone' ? (
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit" }}
                                    />
                                ) : q.type === 'date' ? (
                                    <input
                                        type="date"
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit" }}
                                    />
                                ) : q.type === 'time' ? (
                                    <input
                                        type="time"
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit" }}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Your answer..."
                                        value={qAnswers[i] || ""}
                                        onChange={e => setQAnswers({...qAnswers, [i]: e.target.value})}
                                        style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit" }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        className="hbtn hbtn--primary"
                        style={{ width: "100%", justifyContent: "center", height: 44, marginTop: 24 }}
                        onClick={handleQSubmit}
                        disabled={accepting}
                    >
                        {accepting ? "Submitting..." : "Submit & Join"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "var(--sh-lg)" }}>
                <div style={{ position: "relative", height: 120, background: group.cover || "var(--accent-1)" }}>
                    {(() => {
                        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                        const resolveImg = (url) => url && !url.startsWith('blob:') ? (url.startsWith('/api/') ? apiBase + url : url) : null;
                        const bannerUrl = resolveImg(group.banner);
                        const iconUrl = resolveImg(group.icon);
                        const isCustomIcon = iconUrl && (iconUrl.startsWith("http") || iconUrl.startsWith("data:") || iconUrl.includes("/"));
                        return (
                            <>
                                {bannerUrl && <img src={bannerUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                <Grain />
                                <div style={{ position: "absolute", bottom: -24, left: 24, width: 64, height: 64, borderRadius: 16, background: group.cover || "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "var(--sh-md)", border: "2px solid var(--surface)", overflow: "hidden" }}>
                                    {isCustomIcon ? (
                                        <img src={iconUrl} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : group.icon || "✺"}
                                </div>
                            </>
                        );
                    })()}
                </div>

                <div style={{ padding: "40px 24px 24px 24px" }}>
                    <h1 style={{ margin: "0 0 8px 0", fontSize: 24 }}>You've been invited!</h1>
                    <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 15, lineHeight: 1.5 }}>
                        You have been invited to join <strong>{group.name}</strong>.
                    </p>

                    {group.description && (
                        <p style={{ margin: "16px 0 0 0", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5, background: "var(--field)", padding: 12, borderRadius: "var(--r-sm)" }}>
                            "{group.description}"
                        </p>
                    )}

                    {questionnaires.length > 0 && (
                        <div style={{ margin: "14px 0 0 0", background: "var(--field)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 13, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
                            <I.check style={{ width: 14, height: 14, flexShrink: 0, color: "var(--accent-2)" }} />
                            This group requires you to answer {questionnaires.length} question{questionnaires.length > 1 ? "s" : ""} before joining.
                        </div>
                    )}

                    {group.joinMode === 'approval' && (
                        <div style={{ margin: "8px 0 0 0", background: "var(--field)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 13, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
                            <I.users style={{ width: 14, height: 14, flexShrink: 0, color: "var(--accent-2)" }} />
                            Your request will need to be approved by the group owner.
                        </div>
                    )}

                    <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                        <button className="hbtn hbtn--primary" style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 15 }} onClick={handleAccept} disabled={accepting}>
                            {accepting ? "Joining..." : questionnaires.length > 0 ? "Continue to Questionnaire" : "Accept Invitation"}
                        </button>
                        <button className="hbtn hbtn--ghost" style={{ width: "100%", justifyContent: "center", height: 44, fontSize: 15, color: "var(--ink-3)" }} onClick={() => go("home")}>
                            Decline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
