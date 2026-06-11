/* ============================================================
   Samaagum Home — Public profile (TAPOnn-grade)
   ============================================================ */

function Profile({ st, go }) {
  const [tab, setTab] = useState("about");
  const tabs = [["about","About"],["events","Events"],["groups","Groups"]];
  const myEvents = [EVENTS[0], EVENTS[5], EVENTS[1]];
  const myGroups = [GROUPS[0], GROUPS[1], GROUPS[3]];
  return (
    <div className="scroll">
      <div className="view-enter profile">
        <div className="prof-cover" style={{ background: COVERS.dusk }}><Grain/></div>
        <div className="prof-head">
          <Avatar name={ME.name} size={116} className="pav" />
          <div className="ph-meta">
            <div className="nm">{ME.name} <span className="verified" title="Verified"><svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2l2.4 1.8 3 .2.9 2.9 2.2 2-1 2.9 1 2.9-2.2 2-.9 2.9-3 .2L12 22l-2.4-1.8-3-.2-.9-2.9-2.2-2 1-2.9-1-2.9 2.2-2 .9-2.9 3-.2z"/><path d="M8.5 12.5l2.3 2.3 4.7-4.8" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></span></div>
            <div className="role">{ME.role}</div>
            <div className="loc"><I.pin/> {ME.location} · {ME.handle}</div>
          </div>
          <div className="ph-act">
            <button className="hbtn hbtn--ghost hbtn--sm"><I.qr/>Share</button>
            <button className="hbtn hbtn--ghost hbtn--sm"><I.edit/>Edit profile</button>
            <button className="hbtn hbtn--primary hbtn--sm"><I.plus/>Connect</button>
          </div>
        </div>

        <p className="prof-bio">{ME.bio}</p>

        <div className="prof-stats">
          <div className="st" onClick={()=>go("messages")}><div className="n">{ME.stats.connections}</div><div className="l">Connections</div></div>
          <div className="st"><div className="n">{ME.stats.events}</div><div className="l">Events attended</div></div>
          <div className="st" onClick={()=>go("groups")}><div className="n">{ME.stats.groups}</div><div className="l">Communities</div></div>
        </div>

        {/* socials */}
        <div style={{ display:"flex", gap:10, marginTop:22 }}>
          {SOCIALS.map((s,i) => (
            <button key={i} className="link-tile" style={{ width:46, height:46, padding:0, justifyContent:"center", flex:"none" }} title={s.icon}>
              <span style={{ width:"100%", height:"100%", borderRadius:"inherit", display:"flex", alignItems:"center", justifyContent:"center", background:s.c }}>{Brand[s.icon]}</span>
            </button>
          ))}
        </div>

        <div className="grp-tabs" style={{ marginTop:24 }}>
          {tabs.map(([k,l]) => <button key={k} className={`grp-tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</button>)}
        </div>

        {tab==="about" && (
          <div>
            <div className="prof-section">
              <div className="ph">Links</div>
              <div className="links-list">
                {LINKS_ME.map(l => (
                  <div key={l.t} className="link-tile">
                    <span className="lic" style={{ background:l.c }}>{Brand[l.icon]}</span>
                    <div className="li"><div className="t">{l.t}</div><div className="u">{l.u}</div></div>
                    <I.external style={{ color:"var(--ink-3)" }}/>
                  </div>
                ))}
              </div>
            </div>

            <div className="prof-section">
              <div className="ph">Interests</div>
              <div className="interest-cloud">
                {INTERESTS_ME.map(([t,c]) => <span key={t} className="icloud"><span className="dot" style={{ background:c }}/>{t}</span>)}
              </div>
            </div>

            <div className="prof-section">
              <div className="ph">Share profile</div>
              <div className="share-card">
                <div className="qr"><QRCode seed={ME.handle} size={76}/></div>
                <div className="si">
                  <div className="t">samaagum.co/{ME.handle.replace("@","")}</div>
                  <div className="d">Scan to open Aanya's public profile, or save the contact card to your phone.</div>
                  <div className="sacts">
                    <button className="hbtn hbtn--ghost hbtn--sm"><I.link/>Copy link</button>
                    <button className="hbtn hbtn--ghost hbtn--sm"><I.download/>vCard</button>
                    <button className="hbtn hbtn--ghost hbtn--sm"><I.phone/>NFC tag</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==="events" && (
          <div className="prof-section">
            <div className="ev-grid">
              {myEvents.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e)=>go("event", e)} saved={st.saved.has(ev.id)} onSave={()=>st.toggleSave(ev.id)} registered={true} />)}
            </div>
          </div>
        )}

        {tab==="groups" && (
          <div className="prof-section">
            <div className="ev-grid">
              {myGroups.map(g => <GroupCard key={g.id} g={g} onOpen={(g)=>go("group", g)} joined={true} onJoin={()=>st.toggleJoin(g.id)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Profile });
