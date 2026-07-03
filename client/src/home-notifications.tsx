// @ts-nocheck
import React, { useCallback, useEffect, useState } from 'react';
import { Mark } from './components';
import { FEATURED, NOTIFS } from './home-data';
import { Avatar } from './home-icons';
import { Profile } from './home-profile';
import { Empty, FilterChip } from './home-shell';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — Notification center
   ============================================================ */



export const NTYPE = {
  join:        { ico:<I.groups style={{width:14,height:14}}/>, c:"linear-gradient(135deg,#6d5efc,#2a7fff)" },
  connect:     { ico:<I.user style={{width:14,height:14}}/>,   c:"linear-gradient(135deg,#10b981,#22d3ee)" },
  event:       { ico:<I.cal style={{width:13,height:13}}/>,    c:"linear-gradient(135deg,#ff6b4a,#ff4d8d)" },
  message:     { ico:<I.msg style={{width:13,height:13}}/>,    c:"linear-gradient(135deg,#8b5cf6,#e5489d)" },
  forum:       { ico:<I.comment style={{width:13,height:13}}/>,c:"linear-gradient(135deg,#f59e0b,#ef6f53)" },
  registration:{ ico:<I.ticket style={{width:13,height:13}}/>, c:"linear-gradient(135deg,#0ea5a4,#3b82f6)" },
  system:      { ico:<I.bell style={{width:13,height:13}}/>,   c:"linear-gradient(135deg,#f59e0b,#ef6f53)" },
  billing:     { ico:<svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M22 13h-4v2h4v-2zM4 7V5a2 2 0 012-2h10"/></svg>, c:"linear-gradient(135deg,#f43f5e,#ec4899)" },
  group_created: { ico:<I.groups style={{width:14,height:14}}/>, c:"linear-gradient(135deg,#6d5efc,#2a7fff)" },
  group_new_post: { ico:<I.comment style={{width:13,height:13}}/>, c:"linear-gradient(135deg,#f59e0b,#ef6f53)" },
  group_post_activity: { ico:<I.comment style={{width:13,height:13}}/>, c:"linear-gradient(135deg,#10b981,#22d3ee)" },
  group_gallery: { ico:<I.cal style={{width:13,height:13}}/>, c:"linear-gradient(135deg,#8b5cf6,#e5489d)" },
  group_user_joined: { ico:<I.user style={{width:14,height:14}}/>, c:"linear-gradient(135deg,#10b981,#22d3ee)" },
};

export const API_BASE = window.location.port === "8080" ? "http://localhost:3000" : "";

export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function NotifRow({ n, st, go, onRead }) {
  const meta = NTYPE[n.type] || NTYPE.system;
  const avatarTypes = ["connect","message","forum","group_user_joined"];
  const [acted, setActed] = useState(null);
  const [loading, setLoading] = useState(null);

  const handleConnect = async (action) => {
    if (!n.connectionId) {
      st.toggleConnect?.(n.who);
      setActed("accepted");
      onRead();
      return;
    }
    setLoading(action);
    try {
      const res = await fetch(`${API_BASE}/api/connections/${n.connectionId}/${action}`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setActed(action);
        onRead();
        if (window.toast) {
          const msgs = { accept: "Connection accepted! 🎉", decline: "Request declined." };
          window.toast(msgs[action]);
        }
        if (st.fetchCounts) st.fetchCounts();
        if (action === 'accept') st.toggleConnect?.(n.who);
      } else {
        if (window.toast) window.toast(data.message || "Something went wrong.");
      }
    } catch (err) {
      if (window.toast) window.toast("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`notif ${n.unread && !acted ? "unread" : ""}`} onClick={acted ? undefined : () => {
      onRead();
      if (n.action === "view_user" && n.targetUserId) {
        go("public-profile", { id: n.targetUserId });
      }
    }}>
      <div className="nic" style={{ background: avatarTypes.includes(n.type) ? "transparent" : meta.c, color:"#fff" }}>
        {avatarTypes.includes(n.type)
          ? <><Avatar name={n.who} size={42}/><span className="tagico" style={{ background: meta.c }}>{meta.ico}</span></>
          : meta.ico}
      </div>
      <div className="nbody">
        <div className="nt" dangerouslySetInnerHTML={{ __html: n.text }} />
        <div className="ntime">{n.time}</div>

        {/* Connection Request Actions (from notification feed) */}
        {n.action === "connect" && !acted && (
          <div className="nacts" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              className="hbtn hbtn--primary hbtn--sm"
              disabled={!!loading}
              onClick={(e) => { e.stopPropagation(); handleConnect("accept"); }}
              style={{ opacity: loading === "accept" ? 0.7 : 1 }}
            >
              <I.check/>
              {loading === "accept" ? "Accepting…" : "Accept"}
            </button>
            <button
              className="hbtn hbtn--ghost hbtn--sm"
              disabled={!!loading}
              onClick={(e) => { e.stopPropagation(); handleConnect("decline"); }}
              style={{ opacity: loading === "decline" ? 0.7 : 1 }}
            >
              {loading === "decline" ? "Declining…" : "Decline"}
            </button>
          </div>
        )}

        {/* Post-action badges */}
        {n.action === "connect" && acted && (
          <div style={{ marginTop: 8 }}>
            {acted === "accepted" && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", color:"rgb(34,197,94)", padding:"4px 10px", borderRadius:"var(--r-pill)", fontSize:"12px", fontWeight:600 }}>
                <I.check style={{width:12,height:12}}/> Connected
              </span>
            )}
            {acted === "declined" && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(0,0,0,0.05)", color:"var(--ink-3)", padding:"4px 10px", borderRadius:"var(--r-pill)", fontSize:"12px", fontWeight:600 }}>
                Request declined
              </span>
            )}
          </div>
        )}

        {n.action==="ticket" && <div className="nacts"><button className="hbtn hbtn--soft hbtn--sm" onClick={(e)=>{e.stopPropagation(); go("event", FEATURED);}}><I.ticket/>View ticket</button></div>}
        {n.action==="reply"  && <div className="nacts"><button className="hbtn hbtn--soft hbtn--sm" onClick={(e)=>{e.stopPropagation(); go("messages");}}><I.msg/>Reply</button></div>}
        {n.action==="view"   && <div className="nacts"><button className="hbtn hbtn--ghost hbtn--sm" onClick={(e)=>{
          e.stopPropagation();
          onRead();
          if (n.groupId && n.postId) {
            go("group", { id: n.groupId, postId: n.postId });
          } else if (n.groupId) {
            go("group", { id: n.groupId });
          }
        }}>View</button></div>}
        {n.action==="view_user" && <div className="nacts"><button className="hbtn hbtn--ghost hbtn--sm" onClick={(e)=>{
          e.stopPropagation();
          onRead();
          if (n.targetUserId) {
            go("public-profile", { id: n.targetUserId });
          }
        }}>View Profile</button></div>}
        {n.action==="billing" && <div className="nacts"><button className="hbtn hbtn--soft hbtn--sm" onClick={(e)=>{e.stopPropagation(); go("settings", "billing");}}><svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2" style={{marginRight:6}}><path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M22 13h-4v2h4v-2zM4 7V5a2 2 0 012-2h10"/></svg>View Billing</button></div>}
      </div>
      {n.unread && !acted && <span className="udot"/>}
    </div>
  );
}

/* ── Incoming connection requests card ── */
export function ConnRequestCard({ req, onActed }) {
  const [acted, setActed] = useState(null);
  const [loading, setLoading] = useState(null);
  const name = req.requester?.display_name || req.requester?.email || "Unknown";

  const handle = async (action) => {
    setLoading(action);
    try {
      const res = await fetch(`${API_BASE}/api/connections/${req.id}/${action}`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setActed(action);
        const msgs = { accept: "Connection accepted! 🎉", decline: "Request declined." };
        if (window.toast) window.toast(msgs[action]);
        setTimeout(() => onActed(req.id), 600);
      } else {
        if (window.toast) window.toast(data.message || "Something went wrong.");
      }
    } catch {
      if (window.toast) window.toast("Network error. Try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        background: acted ? "var(--surface-2)" : "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        transition: "opacity 0.3s ease",
        opacity: acted ? 0.5 : 1,
        gap: 12
      }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
        <Avatar name={name} size={44}/>
        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:600, color:"var(--ink)", fontSize:"14.5px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{name}</div>
          <div style={{ fontSize:"12.5px", color:"var(--ink-3)", marginTop:2 }}>
            {req.requester?.headline || "Sent you a connection request"}
          </div>
          <div style={{ fontSize:"11px", color:"var(--ink-3)", marginTop:2 }}>
            {new Date(req.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {!acted ? (
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button
            className="hbtn hbtn--primary hbtn--sm"
            disabled={!!loading}
            onClick={() => handle("accept")}
            style={{ opacity: loading === "accept" ? 0.7 : 1 }}
          >
            <I.check/>{loading === "accept" ? "…" : "Accept"}
          </button>
          <button
            className="hbtn hbtn--ghost hbtn--sm"
            disabled={!!loading}
            onClick={() => handle("decline")}
            style={{ opacity: loading === "decline" ? 0.7 : 1 }}
          >
            {loading === "decline" ? "…" : "Decline"}
          </button>
        </div>
      ) : (
        <span style={{ fontSize:"12px", color:"var(--ink-3)", flexShrink:0 }}>
          {acted === "accept" ? "✅ Connected" : "Declined"}
        </span>
      )}
    </div>
  );
}

export function Notifications({ st, go, socket }) {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(NOTIFS);
  const [connRequests, setConnRequests] = useState([]);

  /* ── Fetch general notifications ── */
  const fetchNotifications = useCallback(() => {
    fetch(`${API_BASE}/api/messaging/notifications`, { headers: authHeaders() })
      .then(res => res.json())
      .then(res => { if (res.success && res.data?.length > 0) setItems(res.data); })
      .catch(err => console.error("Error fetching notifications:", err));
  }, []);

  /* ── Fetch connection requests ── */
  const fetchConnRequests = useCallback(() => {
    fetch(`${API_BASE}/api/connections/incoming`, { headers: authHeaders() })
      .then(res => res.json())
      .then(res => { if (res.success && res.data) setConnRequests(res.data); })
      .catch(err => console.error("Error fetching connection requests:", err));
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchConnRequests();
    return () => {
      fetch(`${API_BASE}/api/messaging/notifications/mark-read`, { method: 'POST', headers: authHeaders() })
        .then(res => res.json())
        .then(() => { if (st.fetchCounts) st.fetchCounts(); })
        .catch(err => console.error("Error marking notifications read on unmount:", err));
    };
  }, []);
  useEffect(() => { fetchConnRequests(); }, [tab]);

  /* ── Socket event listeners ── */
  useEffect(() => {
    if (!socket) return;
    const onConnRequest  = () => fetchConnRequests();
    const onConnAccepted = () => { fetchConnRequests(); if (st.fetchCounts) st.fetchCounts(); };
    const onConnDeclined = () => { fetchConnRequests(); if (st.fetchCounts) st.fetchCounts(); };
    const onMsg = (payload) => {
      const sender = payload.senderName || "Someone";
      const text   = payload.content || payload.body || "";
      setItems(prev => [{
        id: payload.id || Math.random().toString(),
        type: "message", who: sender, unread: true,
        day: "Today", time: "Just now",
        text: `<b>${sender}</b> sent you a message: "${text}"`,
        action: "reply"
      }, ...prev]);
    };
    const onGroupNotif = (payload) => {
      setItems(prev => [{
        id: payload.id || Math.random().toString(),
        type: payload.type,
        who: payload.type === 'group_created' ? 'Groups' : (payload.type === 'group_gallery' ? 'Gallery' : 'Forums'),
        unread: true,
        day: "Today",
        time: "Just now",
        text: payload.text,
        action: "view",
        groupId: payload.groupId,
        postId: payload.postId,
        itemId: payload.itemId
      }, ...prev]);
    };
    socket.on("connection.request.received", onConnRequest);
    socket.on("connection.accepted", onConnAccepted);
    socket.on("connection.declined", onConnDeclined);
    socket.on("message.received", onMsg);
    socket.on("group.notification", onGroupNotif);
    return () => {
      socket.off("connection.request.received", onConnRequest);
      socket.off("connection.accepted", onConnAccepted);
      socket.off("connection.declined", onConnDeclined);
      socket.off("message.received", onMsg);
      socket.off("group.notification", onGroupNotif);
    };
  }, [socket, fetchConnRequests]);

  const read = (id) => {
    setItems(arr => arr.map(n => n.id === id ? {...n, unread: false} : n));
    fetch(`${API_BASE}/api/messaging/notifications/${id}/read`, { method: 'POST', headers: authHeaders() })
      .then(res => res.json())
      .then(() => { if (st.fetchCounts) st.fetchCounts(); })
      .catch(err => console.error("Error marking single notification read:", err));
  };

  const markAll = () => {
    setItems(arr => arr.map(n => ({...n, unread: false})));
    fetch(`${API_BASE}/api/messaging/notifications/mark-read`, { method: 'POST', headers: authHeaders() })
      .then(res => res.json())
      .then(() => { if (st.fetchCounts) st.fetchCounts(); })
      .catch(err => console.error("Error marking notifications read:", err));
  };

  const unreadCount  = items.filter(n => n.unread).length;
  const filtered     = tab === "all" ? items : tab === "unread" ? items.filter(n => n.unread) : items;
  const days         = [...new Set(filtered.map(n => n.day))];

  return (
    <div className="scroll">
      <div className="view-enter notif-page">
        <div className="notif-head">
          <h1>Notifications</h1>
          {unreadCount > 0 && <button className="markall" onClick={markAll}><I.check/> Mark all read</button>}
        </div>
        <div className="notif-tabs">
          <FilterChip active={tab === "all"}     onClick={() => setTab("all")}>All</FilterChip>
          <FilterChip active={tab === "unread"}  onClick={() => setTab("unread")}  count={unreadCount}>Unread</FilterChip>
          <FilterChip active={tab === "connections"} onClick={() => setTab("connections")} count={connRequests.length}>
            Connections
          </FilterChip>
        </div>

        {/* ── Connection Requests Tab ── */}
        {tab === "connections" && (
          connRequests.length === 0 ? (
            <Empty icon={<I.user/>} title="No pending connection requests" text="When someone wants to connect with you, you'll see their request here with options to accept or decline." />
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"16px 0" }}>
              <div style={{ fontSize:"13px", color:"var(--ink-3)", marginBottom:4 }}>
                {connRequests.length} pending {connRequests.length === 1 ? "request" : "requests"}
              </div>
              {connRequests.map(req => (
                <ConnRequestCard
                  key={req.id}
                  req={req}
                  onActed={(id) => {
                    setConnRequests(prev => prev.filter(r => r.id !== id));
                    if (st.fetchCounts) st.fetchCounts();
                  }}
                />
              ))}
            </div>
          )
        )}

        {/* ── All / Unread Tabs ── */}
        {tab !== "connections" && (
          filtered.length === 0 ? (
            <Empty icon={<I.check/>} title="You're all caught up" text="No new notifications here. We'll let you know when something happens in your communities." />
          ) : days.map(day => (
            <div key={day}>
              <div className="notif-day">{day}</div>
              <div>
                {filtered.filter(n => n.day === day).map(n => (
                  <NotifRow key={n.id} n={n} st={st} go={go} onRead={() => read(n.id)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


