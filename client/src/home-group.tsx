/* ============================================================
   Samaagum Home — Group detail (forum, events, members, gallery)
   ============================================================ */

const GROUP_POSTS = [
  { id:"p1", who:"Kabir Anand", role:"Owner", time:"3h", pinned:true,
    body:"Welcome to everyone who joined after last week's mixer! 👋 Quick housekeeping: introduce yourself in the thread below — what you're building and what you need help with. The more specific, the better the room can help.",
    likes:48, comments:23 },
  { id:"p2", who:"Dev Kapoor", role:"Member", time:"6h",
    body:"Sharing a few photos from Saturday's rooftop session. What an energy 🔥 Already counting down to the next one.",
    media:true, cover:"linear-gradient(135deg,#f59e0b,#ef6f53)", likes:96, comments:14 },
  { id:"p3", who:"Riya Thomas", role:"Moderator", time:"1d",
    body:"Anyone going to the AI Builders Demo Day next week? Looking to carpool from Koramangala — drop a comment if you want to split.",
    likes:22, comments:31 },
];

function GroupPost({ p, st }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(p.likes);
  const toggle = () => { setLiked(v=>!v); setLikes(n => liked ? n-1 : n+1); };
  return (
    <div className={`post ${p.pinned?"pinned":""}`}>
      <div className="ptop">
        <Avatar name={p.who} size={38}/>
        <div><div className="pn">{p.who} <span style={{ fontSize:11, fontWeight:600, color:"var(--accent-2)", background:"var(--accent-soft)", padding:"2px 7px", borderRadius:99, marginLeft:4 }}>{p.role}</span></div><div className="pt">{p.time} ago</div></div>
        {p.pinned && <span className="pinlbl"><I.bookmarkF style={{width:12,height:12}}/>Pinned</span>}
      </div>
      <div className="pbody">{p.body}</div>
      {p.media && (
        <div className="pmedia">
          <div className="pm" style={{ background:p.cover }}/>
          <div className="pm" style={{ background:"var(--surface-2)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-3)" }}><I.image/></div>
        </div>
      )}
      <div className="pacts">
        <button className={liked?"liked":""} onClick={toggle}>{liked?<I.heartF/>:<I.heart/>} {likes}</button>
        <button><I.comment/> {p.comments}</button>
        <button><I.share/> Share</button>
      </div>
    </div>
  );
}

function GroupDetail({ group, st, go }) {
  const g = group || GROUPS[0];
  const { joined, toggleJoin } = st;
  const isJoined = joined.has(g.id);
  const [tab, setTab] = useState("discussion");
  const [draft, setDraft] = useState("");
  const tabs = [["discussion","Discussion"],["events","Events"],["members","Members"],["gallery","Gallery"]];
  const gEvents = EVENTS.filter(e => e.cat===g.cat).slice(0,3);
  const members = [...g.memberNames, "Ishaan M","Sana B","Arjun V","Nina P","Tara N","Sam K"];

  return (
    <div className="scroll">
      <div className="view-enter">
        <div className="detail-cover" style={{ height:200, background: g.cover }}>
          <Grain/><div className="scrim"/>
          <button className="detail-back" onClick={()=>go("home")}><I.arrowL/>Back</button>
        </div>
        <div className="grp-detail">
          <div className="grp-head">
            <div className="gicon-lg" style={{ background: g.cover }}>{g.icon}</div>
            <div className="gh-meta">
              <div className="nm">{g.name}</div>
              <div className="sub">
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><I.users/> {g.members.toLocaleString()} members</span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6, color:"#1f9d57", fontWeight:600 }}><span style={{width:7,height:7,borderRadius:"50%",background:"#2bb673"}}/>{g.online} online</span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}><I.comment/> {g.posts} posts</span>
                <span className="fchip on" style={{ pointerEvents:"none", padding:"4px 11px", fontSize:12 }}>{g.cat}</span>
              </div>
            </div>
            <div className="gh-act">
              <button className="hbtn hbtn--ghost hbtn--sm"><I.share/></button>
              <button className={`hbtn hbtn--sm ${isJoined?"hbtn--ghost":"hbtn--primary"}`} onClick={()=>toggleJoin(g.id)}>
                {isJoined ? <><I.check/>Joined</> : <><I.plus/>Join group</>}
              </button>
            </div>
          </div>

          <div className="grp-tabs">
            {tabs.map(([k,l]) => <button key={k} className={`grp-tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>)}
          </div>

          <div className="grp-cols">
            <div style={{ minWidth:0 }}>
              {tab==="discussion" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div className="composer">
                    <Avatar name={ME.name} size={40}/>
                    <div className="ci">
                      <textarea placeholder={`Share something with ${g.name}…`} value={draft} onChange={e=>setDraft(e.target.value)} rows={draft?3:1}/>
                      <div className="cbar">
                        <button className="tool"><I.image/></button>
                        <button className="tool"><I.link/></button>
                        <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft:"auto" }} disabled={!draft.trim()} onClick={()=>setDraft("")}>Post</button>
                      </div>
                    </div>
                  </div>
                  {GROUP_POSTS.map(p => <GroupPost key={p.id} p={p} st={st}/>)}
                </div>
              )}
              {tab==="events" && (
                <div className="ev-grid">
                  {gEvents.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e)=>go("event", e)} saved={st.saved.has(ev.id)} onSave={()=>st.toggleSave(ev.id)} registered={st.registered.has(ev.id)} />)}
                </div>
              )}
              {tab==="members" && (
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  {members.map((m,i) => (
                    <div key={m} className="member-row" style={{ padding:"11px 14px", border:"1px solid var(--border)", borderRadius:"var(--r-md)", background:"var(--surface)" }}>
                      <Avatar name={m} size={40}/>
                      <div className="mi"><div className="n" style={{ display:"flex", alignItems:"center", gap:6 }}>{m} {i===0 && <I.crown className="crown"/>}</div><div className="r">{i===0?"Owner":i<3?"Moderator":"Member"}</div></div>
                      <button className="hbtn hbtn--ghost hbtn--sm">View</button>
                    </div>
                  ))}
                </div>
              )}
              {tab==="gallery" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {Object.values(COVERS).map((c,i) => <div key={i} style={{ aspectRatio:"1", borderRadius:"var(--r-md)", background:c, position:"relative", overflow:"hidden" }}><Grain/></div>)}
                </div>
              )}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="side-card">
                <h4>About</h4>
                <p style={{ fontSize:13.5, lineHeight:1.6, color:"var(--ink-2)" }}>{g.desc}</p>
                <div style={{ marginTop:12 }}>
                  <div className="side-stat"><span className="k">Members</span><span className="v">{g.members.toLocaleString()}</span></div>
                  <div className="side-stat"><span className="k">Posts</span><span className="v">{g.posts}</span></div>
                  <div className="side-stat"><span className="k">Join policy</span><span className="v">Approval</span></div>
                </div>
              </div>
              <div className="side-card">
                <h4>Top members</h4>
                {members.slice(0,5).map((m,i) => (
                  <div key={m} className="member-row">
                    <Avatar name={m} size={32}/>
                    <div className="mi"><div className="n" style={{ display:"flex", alignItems:"center", gap:5 }}>{m} {i===0 && <I.crown className="crown"/>}</div><div className="r">{i===0?"Owner":i<3?"Moderator":"Member"}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyGroups({ st, go }) {
  const [tab, setTab] = useState("joined");
  const joinedIds = Array.from(st.joined || []);
  const joinedList = GROUPS.filter(g => joinedIds.includes(g.id));
  const createdList = st.createdGroups || [];

  const list = tab === "joined" ? joinedList : createdList;

  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            My Groups
            <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{joinedList.length + createdList.length}</span>
          </h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="seg-tabs">
              <button className={tab === "joined" ? "on" : ""} onClick={() => setTab("joined")}>Joined · {joinedList.length}</button>
              <button className={tab === "created" ? "on" : ""} onClick={() => setTab("created")}>Created · {createdList.length}</button>
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => go("create-group")}>
              <I.plus style={{ width: 14, height: 14 }} /> Create Group
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <Empty icon={<I.groups />} title="No groups found" text="Join or create a community to see them here." action={<button className="hbtn hbtn--primary" onClick={() => go("discover")}>Explore groups</button>} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {list.map(g => (
              <div key={g.id} className="fcard" style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => tab === "created" ? go("group-dashboard", g) : go("group", g)}>
                <div style={{ height: 80, background: g.cover, position: "relative" }}>
                  <Grain />
                  <div style={{ position: "absolute", left: 16, bottom: -20, width: 48, height: 48, borderRadius: 12, background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "var(--sh-sm)", border: "2px solid var(--surface)" }}>{g.icon}</div>
                </div>
                <div style={{ padding: "30px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{g.name}</h3>
                  <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "8px 0 16px", flex: 1, lineBreak: "anywhere" }}>{g.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-3)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    <span>{g.members?.toLocaleString() || 1} members</span>
                    {tab === "created" ? (
                      <span style={{ color: "var(--accent-2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        Manage <I.arrowR style={{ width: 12, height: 12 }} />
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-3)" }}>Joined</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupDashboard({ group, st, go }) {
  const g = group || st.createdGroups[0];
  const [members, setMembers] = useState(g.memberNames || ["Aanya Reddy", "Mira Shah", "Leo Patel", "Zoya Nair"]);
  const [requests, setRequests] = useState(["Kabir Anand", "Mira Shah", "Riya Thomas"]);

  const handleApprove = (name) => {
    setRequests(prev => prev.filter(r => r !== name));
    setMembers(prev => [...prev, name]);
  };
  const handleDecline = (name) => {
    setRequests(prev => prev.filter(r => r !== name));
  };

  return (
    <div className="scroll">
      <div className="flow view-enter" style={{ padding: "26px 24px 80px" }}>
        <div className="flow-head" style={{ marginBottom: 20 }}>
          <button className="back" onClick={() => go("groups")}><I.arrowL /></button>
          <div>
            <div className="flow-title">Group Dashboard</div>
            <div className="flow-sub">{g.name}</div>
          </div>
        </div>

        <div className="fcard" style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{g.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{g.cat} · {members.length} members</div>
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft: "auto" }} onClick={() => go("edit-group", g)}>
              <I.edit style={{ width: 14, height: 14 }} /> Edit Group
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Total Members</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{members.length}</div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Forums Posts</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{g.posts || 0}</div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Pending Join Requests</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: requests.length > 0 ? "var(--accent-2)" : "var(--ink)" }}>{requests.length}</div>
            </div>
          </div>

          {requests.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)" }} />
                Pending Approvals ({requests.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map(r => (
                  <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={r} size={32} />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleDecline(r)} style={{ color: "#ef4444" }}>Decline</button>
                      <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleApprove(r)}>Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Members ({members.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {members.map((m, idx) => (
                <div key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={m} size={28} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{idx === 0 ? "Owner" : "Member"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GroupDetail, MyGroups, GroupDashboard });
