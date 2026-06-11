/* ============================================================
   Samaagum Home — shared cards (event, group, person, discussion)
   ============================================================ */

function DateBadge({ month, day }) {
  return <div className="date-badge"><div className="m">{month}</div><div className="d">{day}</div></div>;
}

function SaveBtn({ saved, onClick, Cls = "save" }) {
  return (
    <button className={`${Cls} ${saved?"on":""}`} onClick={(e)=>{ e.stopPropagation(); onClick(); }} title={saved?"Saved":"Save"}>
      {saved ? <I.bookmarkF/> : <I.bookmark/>}
    </button>
  );
}

/* ---------------- Event card (rail / grid) ---------------- */
function EventCard({ ev, onOpen, saved, onSave, registered }) {
  return (
    <div className="ecard rise" onClick={()=>onOpen(ev)}>
      <div className="cover" style={{ background: ev.cover }}>
        <Grain/>
        <DateBadge month={ev.month} day={ev.day} />
        <SaveBtn saved={saved} onClick={onSave} />
        <span className="cat">{ev.online ? "Online" : ev.cat}</span>
      </div>
      <div className="body">
        <div className="ttl">{ev.title}</div>
        <div className="meta-row"><span className="ic"><I.clock/></span>{ev.date} · {ev.time}</div>
        <div className="meta-row"><span className="ic">{ev.online?<I.online/>:<I.pin/>}</span>{ev.venue}</div>
        <div className="foot">
          <div className="going">
            <div className="stack">
              {(ev.attendees||[]).slice(0,3).map((n,i)=><Avatar key={i} name={n} size={24}/>)}
            </div>
            <span className="lbl">{ev.going} going</span>
          </div>
          {registered
            ? <span className="price" style={{ color:"var(--accent-2)", display:"inline-flex", alignItems:"center", gap:5 }}><I.check/>Going</span>
            : <span className={`price ${ev.type==="Free"?"free":""}`}>{ev.price}</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Featured (hero) ---------------- */
function FeatureCard({ ev, onOpen, saved, onSave }) {
  return (
    <div className="feature rise" onClick={()=>onOpen(ev)}>
      <div className="fcover" style={{ background: ev.cover }}>
        <Grain/>
        {ev.live && <span className="live"><span className="pulse"/>Selling fast</span>}
        <span className="ftag">{ev.cat}</span>
      </div>
      <div className="fbody">
        <span className="eyebrow2">Featured this week</span>
        <div className="ttl">{ev.title}</div>
        <p className="dsc">{ev.desc}</p>
        <div className="fmeta">
          <div className="row"><span className="ico"><I.cal/></span><span><span className="k">When</span><br/><span className="v">{ev.date} · {ev.time}</span></span></div>
          <div className="row"><span className="ico"><I.pin/></span><span><span className="k">Where</span><br/><span className="v">{ev.venue}, {ev.city}</span></span></div>
        </div>
        <div className="factions">
          <button className="hbtn hbtn--primary" onClick={(e)=>{ e.stopPropagation(); onOpen(ev); }}>Get tickets · {ev.price}</button>
          <div className="att"><div className="going"><div className="stack" style={{ display:"flex" }}>
            {["Kabir A","Dev K","Riya T","Sam K"].map((n,i)=><Avatar key={i} name={n} size={26} style={{ marginLeft: i? -9:0, border:"2px solid var(--surface)" }}/>)}
          </div></div><span>{ev.going} going</span></div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Group card ---------------- */
function GroupCard({ g, onOpen, joined, onJoin }) {
  return (
    <div className="gcard rise" onClick={()=>onOpen(g)}>
      <div className="gcov" style={{ background: g.cover }}><Grain/></div>
      <div className="gicon" style={{ background: g.cover }}>{g.icon}</div>
      <div className="gbody">
        <div className="gname">{g.name}</div>
        <div className="gdsc">{g.desc}</div>
        <div className="gstats">
          <span><b style={{ color:"var(--ink-2)" }}>{g.members.toLocaleString()}</b> members</span>
          <span className="live"><span className="d"/>{g.online} online</span>
        </div>
        <div className="gfoot">
          <div className="stack">{g.memberNames.slice(0,4).map((n,i)=><Avatar key={i} name={n} size={26}/>)}</div>
          <button className={`hbtn hbtn--sm ${joined?"hbtn--ghost":"hbtn--soft"}`} style={{ marginLeft:"auto" }}
            onClick={(e)=>{ e.stopPropagation(); onJoin(g); }}>
            {joined ? <><I.check/>Joined</> : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Group row (trending list) ---------------- */
function GroupRow({ g, rank, onOpen, joined, onJoin }) {
  return (
    <div className="grow" onClick={()=>onOpen(g)}>
      {rank!=null && <span className="rank">{rank}</span>}
      <div className="gicon2" style={{ background: g.cover }}>{g.icon}</div>
      <div className="gi">
        <div className="n">{g.name}</div>
        <div className="s">{g.members.toLocaleString()} members · {g.cat}</div>
      </div>
      <button className={`hbtn hbtn--sm ${joined?"hbtn--ghost":"hbtn--soft"}`}
        onClick={(e)=>{ e.stopPropagation(); onJoin(g); }}>
        {joined ? <><I.check/>Joined</> : "Join"}
      </button>
    </div>
  );
}

/* ---------------- Person card (suggested connection) ---------------- */
function PersonCard({ p, onConnect, connected }) {
  return (
    <div className="pcard rise">
      <div className="pc-cov" style={{ background: p.cover }} />
      <Avatar name={p.name} size={64} />
      <div className="pn">{p.name}</div>
      <div className="ph">{p.role}</div>
      <div className="pmut"><I.users style={{ width:13, height:13 }}/>{p.mutual} mutual connections</div>
      <div className="ptags">{p.tags.map(t => <span key={t} className="ptag">{t}</span>)}</div>
      <div className="pacts">
        <button className={`hbtn hbtn--sm hbtn--block ${connected?"hbtn--ghost":"hbtn--primary"}`} onClick={()=>onConnect(p)}>
          {connected ? <><I.check/>Requested</> : <>Connect</>}
        </button>
        <button className="hbtn hbtn--sm hbtn--ghost" style={{ padding:"8px 12px" }}><I.msg/></button>
      </div>
    </div>
  );
}

/* ---------------- Discussion row ---------------- */
function DiscussionRow({ d, onOpen }) {
  return (
    <div className="disc" onClick={onOpen}>
      <Avatar name={d.who} size={40} />
      <div className="dmain">
        <div className="dtop">
          {d.pinned && <span className="pin"><I.bookmarkF style={{ width:12, height:12 }}/>Pinned</span>}
          <span className="who">{d.who}</span> in <span className="grp">{d.group}</span> · <span>{d.time}</span>
        </div>
        <div className="dq">{d.q}</div>
        <div className="dex">{d.excerpt}</div>
        {d.media && <div className="pmedia" style={{ maxWidth:280, marginTop:10 }}><div className="pm" style={{ background:d.cover, borderRadius:10 }}/><div className="pm" style={{ background:"var(--surface-2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-3)" }}><I.image/></div></div>}
        <div className="dstats">
          <span><I.heart/> {d.likes}</span>
          <span><I.comment/> {d.comments}</span>
          <span><I.share/> Share</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EventCard, FeatureCard, GroupCard, GroupRow, PersonCard, DiscussionRow, DateBadge, SaveBtn });
