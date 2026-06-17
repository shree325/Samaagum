/* ============================================================
   Samaagum Home — Group detail (forum, events, members, gallery)
   ============================================================ */

const GROUP_POSTS = [
  {
    id: "p1", who: "Kabir Anand", role: "Owner", time: "3h", pinned: true,
    body: "Welcome to everyone who joined after last week's mixer! 👋 Quick housekeeping: introduce yourself in the thread below — what you're building and what you need help with. The more specific, the better the room can help.",
    likes: 48, comments: 23
  },
  {
    id: "p2", who: "Dev Kapoor", role: "Member", time: "6h",
    body: "Sharing a few photos from Saturday's rooftop session. What an energy 🔥 Already counting down to the next one.",
    media: true, cover: "linear-gradient(135deg,#f59e0b,#ef6f53)", likes: 96, comments: 14
  },
  {
    id: "p3", who: "Riya Thomas", role: "Moderator", time: "1d",
    body: "Anyone going to the AI Builders Demo Day next week? Looking to carpool from Koramangala — drop a comment if you want to split.",
    likes: 22, comments: 31
  },
];

function GroupPost({ p, st, canReply }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(p.likes);
  const toggle = () => { setLiked(v => !v); setLikes(n => liked ? n - 1 : n + 1); };
  return (
    <div className={`post ${p.pinned ? "pinned" : ""}`}>
      <div className="ptop">
        <Avatar name={p.who} size={38} />
        <div><div className="pn">{p.who} <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", background: "var(--accent-soft)", padding: "2px 7px", borderRadius: 99, marginLeft: 4 }}>{p.role}</span></div><div className="pt">{p.time} ago</div></div>
        {p.pinned && <span className="pinlbl"><I.bookmarkF style={{ width: 12, height: 12 }} />Pinned</span>}
      </div>
      <div className="pbody">{p.body}</div>
      {p.media && (
        <div className="pmedia">
          <div className="pm" style={{ background: p.cover }} />
          <div className="pm" style={{ background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}><I.image /></div>
        </div>
      )}
      <div className="pacts">
        <button className={liked ? "liked" : ""} onClick={toggle}>{liked ? <I.heartF /> : <I.heart />} {likes}</button>
        {canReply === false ? (
          <button disabled style={{ opacity: 0.5 }} title="Replies are restricted"><I.lock style={{ width:12, height:12 }} /> {p.comments}</button>
        ) : (
          <button><I.comment /> {p.comments}</button>
        )}
        <button><I.share /> Share</button>
      </div>
    </div>
  );
}

function GroupDetail({ group, st, go }) {
  const g = group || GROUPS[0];
  const { joined, pending, toggleJoin } = st;
  const isJoined = joined.has(g.id);
  const isPending = pending.has(g.id);
  const isOwner = ME.name === g.owner;
  const [tab, setTab] = useState("discussion");
  const [draft, setDraft] = useState("");
  const tabs = [
    ["discussion", "Discussion"], 
    ["events", "Events"], 
    ["members", "Members"], 
    ["gallery", "Gallery"]
  ];
  if (isOwner) tabs.push(["requests", "Requests"]);
  
  const [joinRequests, setJoinRequests] = useState((JOIN_REQUESTS || []).filter(r => r.groupId === g.id));

  const handleRequestAction = (reqId, action) => {
    if (action === "approve") {
      setJoinRequests(prev => prev.map(r => r.id === reqId ? {...r, status: "approved"} : r));
    } else if (action === "decline") {
      setJoinRequests(prev => prev.filter(r => r.id !== reqId));
    } else if (action === "message") {
      alert("Opening direct chat with user...");
    }
  };

  const gEvents = EVENTS.filter(e => e.cat === g.cat).slice(0, 3);
  const members = g.memberNames || [];

  const canPost = isOwner || g.threadPerm === "everyone" || (g.threadPerm === "selected" && isJoined);
  const canReply = isOwner || g.replyPerm === "everyone" || (g.replyPerm === "selected" && isJoined);

  return (
    <div className="scroll">
      <div className="view-enter">
        <div className="detail-cover" style={{ height: 200, background: g.banner ? `url("${g.banner}")` : g.cover, backgroundSize: "cover", backgroundPosition: "center" }}>
          {!g.banner && <Grain />}
          <div className="scrim" />
          <button className="detail-back" onClick={() => go("home")}><I.arrowL />Back</button>
        </div>
        <div className="grp-detail">
          <div className="grp-head">
            <div className="gicon-lg" style={{ background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {g.icon && (g.icon.startsWith("blob:") || g.icon.startsWith("http") || g.icon.startsWith("data:") || g.icon.includes("/")) ? (
                <img src={g.icon} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              ) : g.icon}
            </div>
            <div className="gh-meta">
              <div className="nm">{g.name} {g.visibility === "private" && <I.lock style={{ width: 18, height: 18, color: "var(--ink-3)", marginLeft: 6 }} title="Private" />}</div>
              <div className="sub">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.users /> {g.members.toLocaleString()} members</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1f9d57", fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bb673" }} />{g.online} online</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.comment /> {g.posts} posts</span>
                <span className="fchip on" style={{ pointerEvents: "none", padding: "4px 11px", fontSize: 12 }}>{g.cat}</span>
              </div>
            </div>
            <div className="gh-act">
              <button className="hbtn hbtn--ghost hbtn--sm"><I.share /></button>
              <button className={`hbtn hbtn--sm ${isJoined || isPending ? "hbtn--ghost" : "hbtn--primary"}`} onClick={() => toggleJoin(g)}>
                {isPending ? <><I.clock />Requested</> : isJoined ? <><I.check />Joined</> : <><I.plus />Join group</>}
              </button>
            </div>
          </div>

          <div className="grp-tabs">
            {tabs.map(([k, l]) => <button key={k} className={`grp-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
          </div>

          <div className="grp-cols">
            <div style={{ minWidth: 0 }}>
              {tab === "discussion" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {canPost ? (
                    <div className="composer">
                      <Avatar name={ME.name} size={40} />
                      <div className="ci">
                        <textarea placeholder={`Share something with ${g.name}…`} value={draft} onChange={e => setDraft(e.target.value)} rows={draft ? 3 : 1} />
                        <div className="cbar">
                          <button className="tool"><I.image /></button>
                          <button className="tool"><I.link /></button>
                          <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft: "auto" }} disabled={!draft.trim()} onClick={() => setDraft("")}>Post</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-2)" }}>
                      <I.lock style={{ width: 18, height: 18, opacity: 0.5 }} />
                      <span style={{ fontSize: 14 }}>Only {g.threadPerm === "admins" ? "moderators and admins" : "selected members"} can create new threads in this group.</span>
                    </div>
                  )}
                  {GROUP_POSTS.map(p => <GroupPost key={p.id} p={p} st={st} canReply={canReply} />)}
                </div>
              )}
              {tab === "events" && (
                <div className="ev-grid">
                  {gEvents.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)} saved={st.saved.has(ev.id)} onSave={() => st.toggleSave(ev.id)} registered={st.registered.has(ev.id)} />)}
                </div>
              )}
              {tab === "members" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {members.map((m, i) => {
                    const mName = typeof m === 'object' ? m.name : m;
                    const mRole = typeof m === 'object' ? m.role : (i === 0 ? "owner" : "member");
                    return (
                      <div key={mName} className="member-row" style={{ padding: "11px 14px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
                        <Avatar name={mName} size={40} />
                        <div className="mi">
                          <div className="n" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {mName} {mRole === "owner" && <I.crown className="crown" />}
                          </div>
                          <div className="r" style={{ textTransform: "capitalize" }}>{mRole}</div>
                        </div>
                        <button className="hbtn hbtn--ghost hbtn--sm">View</button>
                      </div>
                    );
                  })}
                </div>
              )}
              {tab === "gallery" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {Object.values(COVERS).map((c, i) => <div key={i} style={{ aspectRatio: "1", borderRadius: "var(--r-md)", background: c, position: "relative", overflow: "hidden" }}><Grain /></div>)}
                </div>
              )}
              {tab === "requests" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Join Requests</h3>
                    <span className="qs-badge" style={{ background: "var(--accent-soft)", color: "var(--accent-2)" }}>{joinRequests.filter(r => r.status==="pending").length} Pending</span>
                  </div>
                  {joinRequests.filter(r => r.status === "pending").length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
                      <I.shield style={{ width: 32, height: 32, marginBottom: 12, opacity: 0.5 }}/>
                      <p>No pending join requests.</p>
                    </div>
                  ) : null}
                  {joinRequests.filter(r => r.status === "pending").map((req) => (
                    <div key={req.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <Avatar name={req.user.name} size={48} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{req.user.name}</div>
                            <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{req.user.role}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Applied {req.date}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => handleRequestAction(req.id, "message")}><I.comment /> Message</button>
                        </div>
                      </div>
                      
                      {req.answers && Object.keys(req.answers).length > 0 && (
                        <div style={{ background: "var(--field)", borderRadius: "var(--r-sm)", padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", margin: 0 }}>Questionnaire Answers</h4>
                          {Object.entries(req.answers).map(([q, a]) => (
                            <div key={q}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>{q}</div>
                              <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5 }}>{a}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 12 }}>
                        <button className="hbtn hbtn--primary hbtn--sm" style={{ flex: 1 }} onClick={() => handleRequestAction(req.id, "approve")}><I.check /> Approve Request</button>
                        <button className="hbtn hbtn--ghost hbtn--sm" style={{ flex: 1, color: "var(--ink-2)" }} onClick={() => handleRequestAction(req.id, "decline")}><I.x /> Decline</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="side-card">
                <h4>About</h4>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>{g.desc}</p>
                <div style={{ marginTop: 12 }}>
                  <div className="side-stat"><span className="k">Members</span><span className="v">{g.members.toLocaleString()}</span></div>
                  <div className="side-stat"><span className="k">Posts</span><span className="v">{g.posts}</span></div>
                  <div className="side-stat"><span className="k">Join policy</span><span className="v">Approval</span></div>
                </div>
              </div>
              <div className="side-card">
                <h4>Top members</h4>
                {members.slice(0, 5).map((m, i) => (
                  <div key={m} className="member-row">
                    <Avatar name={m} size={32} />
                    <div className="mi"><div className="n" style={{ display: "flex", alignItems: "center", gap: 5 }}>{m} {i === 0 && <I.crown className="crown" />}</div><div className="r">{i === 0 ? "Owner" : i < 3 ? "Moderator" : "Member"}</div></div>
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

Object.assign(window, { GroupDetail });
