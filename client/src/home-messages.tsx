/* ============================================================
   Samaagum Home — Messages, connections (DMs, upward, requests)
   ============================================================ */

function Messages({ st, go, mobile }) {
  const [seg, setSeg] = useState("messages");
  const [activeId, setActiveId] = useState(THREADS[0].id);
  const [showConv, setShowConv] = useState(!mobile); // mobile: list first
  const active = THREADS.find(t=>t.id===activeId);
  const [input, setInput] = useState("");
  const [extra, setExtra] = useState([]);

  const openThread = (id) => { setActiveId(id); setShowConv(true); };
  const send = () => { if (!input.trim()) return; setExtra(e=>[...e, { me:true, text:input, time:"now" }]); setInput(""); };

  return (
    <div className="msg-layout">
      <div className={`msg-list ${mobile && showConv ? "hide-m":""}`}>
        <div className="msg-list-head">
          <h2>Messages</h2>
          <div className="msg-seg">
            <button className={seg==="messages"?"on":""} onClick={()=>setSeg("messages")}>Chats</button>
            <button className={seg==="requests"?"on":""} onClick={()=>setSeg("requests")}>Requests <span style={{ color:"var(--accent-1)" }}>{REQUESTS.length}</span></button>
          </div>
        </div>
        <div className="msg-threads">
          {seg==="messages" ? THREADS.map(t => (
            <div key={t.id} className={`thread ${t.id===activeId && !mobile?"on":""}`} onClick={()=>openThread(t.id)}>
              <div className="av" style={{ background:"transparent" }}><Avatar name={t.name} size={46}/>{t.online && <span className="online"/>}</div>
              <div className="ti">
                <div className="tr1"><span className="nm">{t.name}</span><span className="tm">{t.time}</span></div>
                <div className="pv">{t.preview}</div>
                {!t.connected && <div style={{ fontSize:11, color:"var(--accent-2)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}><I.users style={{width:11,height:11}}/>via {t.context}</div>}
              </div>
              {t.unread>0 && <span className="unreadc">{t.unread}</span>}
            </div>
          )) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"4px" }}>
              {REQUESTS.map(r => (
                <div key={r.name} className="req-card">
                  <Avatar name={r.name} size={48}/>
                  <div className="ri"><div className="n">{r.name}</div><div className="d">{r.role}</div><div className="d" style={{ color:"var(--accent-2)" }}>{r.mutual} mutual</div></div>
                  <div className="ract" style={{ flexDirection:"column", gap:7 }}>
                    <button className="hbtn hbtn--primary hbtn--sm" onClick={()=>st.toggleConnect(r.name)}><I.check/></button>
                    <button className="hbtn hbtn--ghost hbtn--sm"><I.x/></button>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:12.5, color:"var(--ink-3)", lineHeight:1.5, padding:"8px 6px" }}>
                Connection requests need your approval before you can exchange direct messages.
              </div>
            </div>
          )}
        </div>
      </div>

      {(!mobile || showConv) && active && (
        <div className="msg-conv">
          <div className="conv-head">
            {mobile && <button className="hbtn hbtn--ghost hbtn--sm" style={{ padding:"7px 10px" }} onClick={()=>setShowConv(false)}><I.arrowL/></button>}
            <div style={{ position:"relative" }}><Avatar name={active.name} size={40}/>{active.online && <span className="online" style={{ position:"absolute", bottom:0, right:0, width:11, height:11, borderRadius:"50%", background:"#2bb673", border:"2px solid var(--surface)" }}/>}</div>
            <div className="ci"><div className="n">{active.name}</div><div className="s">{active.online?"Active now":"Active "+active.time+" ago"}</div></div>
            <div className="cact"><button className="tb-icon" style={{ width:36, height:36 }}><I.phone/></button><button className="tb-icon" style={{ width:36, height:36 }}><I.more/></button></div>
          </div>

          {!active.connected && (
            <div className="conn-banner" style={{ marginTop:14 }}>
              <I.users/> You can message {active.name.split(" ")[0]} because you're both in <b style={{ marginLeft:3 }}>{active.context}</b>. Send a connection request to chat anytime.
            </div>
          )}

          <div className="conv-scroll">
            <div className="conv-date">Today</div>
            {[...active.msgs, ...extra].map((m,i) => (
              <div key={i} className={`bubble ${m.me?"me":"them"}`}>
                {m.text}<div className="btime">{m.time}</div>
              </div>
            ))}
          </div>

          <div className="conv-compose">
            <button className="tb-icon" style={{ width:38, height:38, border:"none", background:"var(--field)" }}><I.image/></button>
            <input placeholder={`Message ${active.name.split(" ")[0]}…`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} />
            <button className="send" onClick={send}><I.send/></button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Messages });
