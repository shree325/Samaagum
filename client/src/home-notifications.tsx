// @ts-nocheck
/* ============================================================
   Samaagum Home — Notification center
   ============================================================ */

const { useState } = React;

const NTYPE = {
  join:        { ico:<I.groups style={{width:14,height:14}}/>, c:"linear-gradient(135deg,#6d5efc,#2a7fff)" },
  connect:     { ico:<I.user style={{width:14,height:14}}/>,   c:"linear-gradient(135deg,#10b981,#22d3ee)" },
  event:       { ico:<I.cal style={{width:13,height:13}}/>,    c:"linear-gradient(135deg,#ff6b4a,#ff4d8d)" },
  message:     { ico:<I.msg style={{width:13,height:13}}/>,    c:"linear-gradient(135deg,#8b5cf6,#e5489d)" },
  forum:       { ico:<I.comment style={{width:13,height:13}}/>,c:"linear-gradient(135deg,#f59e0b,#ef6f53)" },
  registration:{ ico:<I.ticket style={{width:13,height:13}}/>, c:"linear-gradient(135deg,#0ea5a4,#3b82f6)" },
};

function NotifRow({ n, st, go, onRead }) {
  const meta = NTYPE[n.type];
  const avatarTypes = ["connect","message","forum"];
  return (
    <div className={`notif ${n.unread?"unread":""}`} onClick={onRead}>
      <div className="nic" style={{ background: avatarTypes.includes(n.type)?"transparent":meta.c, color:"#fff" }}>
        {avatarTypes.includes(n.type)
          ? <><Avatar name={n.who} size={42}/><span className="tagico" style={{ background: meta.c }}>{meta.ico}</span></>
          : meta.ico}
      </div>
      <div className="nbody">
        <div className="nt" dangerouslySetInnerHTML={{ __html: n.text }} />
        <div className="ntime">{n.time}</div>
        {n.action==="connect" && (
          <div className="nacts">
            <button className="hbtn hbtn--primary hbtn--sm" onClick={(e)=>{e.stopPropagation(); st.toggleConnect(n.who); onRead();}}><I.check/>Accept</button>
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={(e)=>e.stopPropagation()}>Decline</button>
          </div>
        )}
        {n.action==="ticket" && <div className="nacts"><button className="hbtn hbtn--soft hbtn--sm" onClick={(e)=>{e.stopPropagation(); go("event", FEATURED);}}><I.ticket/>View ticket</button></div>}
        {n.action==="reply" && <div className="nacts"><button className="hbtn hbtn--soft hbtn--sm" onClick={(e)=>{e.stopPropagation(); go("messages");}}><I.msg/>Reply</button></div>}
        {n.action==="view" && <div className="nacts"><button className="hbtn hbtn--ghost hbtn--sm" onClick={(e)=>e.stopPropagation()}>View</button></div>}
      </div>
      {n.unread && <span className="udot"/>}
    </div>
  );
}

function Notifications({ st, go, socket }) {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(NOTIFS);
  const [requests, setRequests] = useState([]);

  React.useEffect(() => {
    if (!socket) return;

    const handleRequestReceived = () => {
      fetchRequests();
    };
    const handleRequestAccepted = () => {
      fetchRequests();
    };
    const handleRequestDeclined = () => {
      fetchRequests();
    };

    socket.on("request.received", handleRequestReceived);
    socket.on("request.accepted", handleRequestAccepted);
    socket.on("request.declined", handleRequestDeclined);

    return () => {
      socket.off("request.received", handleRequestReceived);
      socket.off("request.accepted", handleRequestAccepted);
      socket.off("request.declined", handleRequestDeclined);
    };
  }, [socket]);
  
  const read = (id) => setItems(arr => arr.map(n => n.id===id ? {...n, unread:false} : n));
  const markAll = () => setItems(arr => arr.map(n => ({...n, unread:false})));
  const unreadCount = items.filter(n=>n.unread).length;

  const fetchRequests = () => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    fetch(`${apiBase}/api/messaging/requests/incoming`, { headers })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setRequests(res.data);
        }
      })
      .catch(err => console.error("Error fetching requests for notifications page:", err));
  };

  React.useEffect(() => {
    fetchRequests();
  }, [tab]);

  const handleAcceptRequest = (reqId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    fetch(`${apiBase}/api/messaging/requests/${reqId}/accept`, {
      method: 'POST',
      headers
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          if (window.toast) window.toast("Messaging request accepted!");
          fetchRequests();
          if (st.fetchCounts) st.fetchCounts();
        }
      })
      .catch(err => console.error("Error accepting request:", err));
  };

  const handleDeclineRequest = (reqId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    fetch(`${apiBase}/api/messaging/requests/${reqId}/decline`, {
      method: 'POST',
      headers
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          if (window.toast) window.toast("Messaging request declined.");
          fetchRequests();
          if (st.fetchCounts) st.fetchCounts();
        }
      })
      .catch(err => console.error("Error declining request:", err));
  };

  const filtered = tab==="all" ? items
    : tab==="unread" ? items.filter(n=>n.unread)
    : items.filter(n=>n.type==="connect");

  const days = [...new Set(filtered.map(n=>n.day))];

  return (
    <div className="scroll">
      <div className="view-enter notif-page">
        <div className="notif-head">
          <h1>Notifications</h1>
          {unreadCount>0 && <button className="markall" onClick={markAll}><I.check/> Mark all read</button>}
        </div>
        <div className="notif-tabs">
          <FilterChip active={tab==="all"} onClick={()=>setTab("all")}>All</FilterChip>
          <FilterChip active={tab==="unread"} onClick={()=>setTab("unread")} count={unreadCount}>Unread</FilterChip>
          <FilterChip active={tab==="requests"} onClick={()=>setTab("requests")} count={requests.length}>Requests</FilterChip>
        </div>

        {tab === "requests" ? (
          requests.length === 0 ? (
            <Empty icon={<I.check/>} title="No pending requests" text="You don't have any incoming messaging requests at the moment." />
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"16px 0" }}>
              {requests.map(r => {
                const displayName = r.sender?.profiles?.display_name || r.sender?.primary_email || "Unknown User";
                const headline = r.sender?.profiles?.headline || "";
                return (
                  <div key={r.id} className="notif unread" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={displayName} size={42}/>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: "14.5px" }}>{displayName}</div>
                        <div style={{ fontSize: "12.5px", color: "var(--ink-3)", marginTop: 2 }}>{headline || "Sent you a messaging request"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="hbtn hbtn--primary hbtn--sm" onClick={()=>handleAcceptRequest(r.id)}><I.check/> Accept</button>
                      <button className="hbtn hbtn--ghost hbtn--sm" onClick={()=>handleDeclineRequest(r.id)}>Decline</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          filtered.length===0 ? (
            <Empty icon={<I.check/>} title="You're all caught up" text="No new notifications here. We'll let you know when something happens in your communities." />
          ) : days.map(day => (
            <div key={day}>
              <div className="notif-day">{day}</div>
              <div>
                {filtered.filter(n=>n.day===day).map(n => <NotifRow key={n.id} n={n} st={st} go={go} onRead={()=>read(n.id)} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Notifications });
