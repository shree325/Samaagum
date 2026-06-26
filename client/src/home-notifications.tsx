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

function Notifications({ st, go }) {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(NOTIFS);
  const read = (id) => setItems(arr => arr.map(n => n.id===id ? {...n, unread:false} : n));
  const markAll = () => setItems(arr => arr.map(n => ({...n, unread:false})));
  const unreadCount = items.filter(n=>n.unread).length;

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
          <FilterChip active={tab==="requests"} onClick={()=>setTab("requests")}>Requests</FilterChip>
        </div>

        {filtered.length===0 ? (
          <Empty icon={<I.check/>} title="You're all caught up" text="No new notifications here. We'll let you know when something happens in your communities." />
        ) : days.map(day => (
          <div key={day}>
            <div className="notif-day">{day}</div>
            <div>
              {filtered.filter(n=>n.day===day).map(n => <NotifRow key={n.id} n={n} st={st} go={go} onRead={()=>read(n.id)} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Notifications });
