import React, { useState } from 'react';
import { FEATURED, ME } from './home-data';
import { Avatar, Grain } from './home-icons';
import { Waitlist } from './home-waitlist';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — Event detail (Luma-grade)
   ============================================================ */

export function EventDetail({ ev, st, go }) {
  const e = ev || FEATURED;
  const { saved, toggleSave, registered, register, city, waitlisted } = st;
  const isSaved = saved.has(e.id);
  const isReg = registered.has(e.id);
  const isWaitlisted = waitlisted ? waitlisted.has(e.id) : false;
  const isSoldOut = e.going >= (e.cap || 9999) || e.id === "ev-feat";

  const chatSettings = st.chatSettings || {
    allowSiteMessaging: true,
    allowDirectMessaging: true,
    allowGroupChat: true,
    allowEventChat: true
  };
  const showChatButton = chatSettings.allowSiteMessaging !== false && (
    chatSettings.allowDirectMessaging ||
    (chatSettings.allowGroupChat || chatSettings.allowEventChat)
  );

  const tiers = e.type === "Free"
    ? [{ id:"rsvp", n:"General RSVP", d:"Free entry · approval-based", p:"Free", free:true }]
    : [
        { id:"early", n:"Early Bird", d:"Limited · ends Jun 14", p:e.price, early:true },
        { id:"std", n:"General Admission", d:"Standard entry", p: e.price.replace(/\d+/, m=>String(Math.round(+m*1.4))) },
        { id:"vip", n:"VIP · Front tables", d:"Reserved seating + drink", p: e.price.replace(/\d+/, m=>String(Math.round(+m*2.2))) },
      ];
  const [tier, setTier] = useState(tiers[0].id);
  const [qty, setQty] = useState(1);
  const sel = tiers.find(t=>t.id===tier);
  const pct = Math.round((e.going / (e.cap||e.going)) * 100);

  const attendees = e.attendees || ["Dev K","Mira S","Leo P","Zoya N","Sam K","Riya T"];

  return (
    <div className="scroll">
      <div className="view-enter">
        <div className="detail-cover" style={{ background: e.cover }}>
          <Grain/><div className="scrim"/>
          <button className="detail-back" onClick={()=>go("home")}><I.arrowL/>Back</button>
          <div className="detail-actions-top">
            <button className={`cbtn ${isSaved?"on":""}`} onClick={()=>toggleSave(e.id)}>{isSaved?<I.bookmarkF/>:<I.bookmark/>}</button>
            <button className="cbtn"><I.share/></button>
          </div>
        </div>

        <div className="ev-detail">
          <div className="ev-head">
            <div className="card-top">
              <div className="tags">
                <span className="fchip on" style={{ pointerEvents:"none" }}>{e.cat}</span>
                <span className="fchip" style={{ pointerEvents:"none" }}>{e.online ? <><I.online style={{width:14,height:14}}/> Online</> : <><I.pin style={{width:14,height:14}}/> {e.city||city}</>}</span>
                <span className="fchip" style={{ pointerEvents:"none" }}>{e.type}</span>
              </div>
              <div className="ttl">{e.title}</div>
              <div className="ev-host">
                <Avatar name={e.hostBy||e.host} size={34}/>
                Hosted by <b>{e.host}</b>
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ marginLeft:"auto" }}><I.plus/>Follow</button>
              </div>
            </div>
          </div>

          <div className="ev-cols">
            <div className="ev-main">
              <div className="ev-block">
                <div className="ev-when">
                  <div className="ev-fact"><span className="ico"><I.cal/></span><div><div className="k">Date</div><div className="v">{e.date}</div><div className="v2">{e.time}</div></div></div>
                  <div className="ev-fact"><span className="ico">{e.online?<I.online/>:<I.pin/>}</span><div><div className="k">{e.online?"Location":"Venue"}</div><div className="v">{e.venue}</div><div className="v2">{e.online?"Link revealed after registration":e.city}</div></div></div>
                </div>
              </div>

              <div className="ev-block">
                <h3>About this event</h3>
                <div className="ev-about">
                  <p>{e.desc || "Join us for an unforgettable evening bringing together the most interesting people in the city. Whether you're here to learn, connect, or simply enjoy the atmosphere — there's a place for you."}</p>
                  <p>Expect curated conversations, a welcoming community, and the kind of serendipity that only happens in the same room. Doors open 30 minutes early — come say hi.</p>
                </div>
              </div>

              {!e.online && (
                <div className="ev-block">
                  <h3>Location</h3>
                  <div className="ev-map">
                    <div className="grid"/>
                    <div style={{ position:"absolute", left:"18%", top:0, bottom:0, width:6, background:"var(--border)" }}/>
                    <div style={{ position:"absolute", top:"62%", left:0, right:0, height:6, background:"var(--border)" }}/>
                    <div className="pin"><span className="ring"/><span className="dot"/></div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:12, fontSize:13.5, color:"var(--ink-2)" }}>
                    <I.pin style={{ color:"var(--accent-2)" }}/> {e.venue}, {e.city} <button className="hbtn hbtn--ghost hbtn--sm" style={{ marginLeft:"auto" }}>Get directions</button>
                  </div>
                </div>
              )}

              <div className="ev-block">
                <h3>{e.going} attending</h3>
                <div className="att-grid">
                  {attendees.map(n => <div key={n} className="att"><Avatar name={n} size={28}/><span className="nm">{n}</span></div>)}
                  <div className="att" style={{ paddingRight:14 }}><div className="av" style={{ width:28, height:28, fontSize:11, background:"var(--surface-2)", color:"var(--ink-2)" }}>+{Math.max(0,e.going-attendees.length)}</div><span className="nm">more</span></div>
                </div>
              </div>
            </div>

            {/* Ticket sidebar */}
            <div className="ev-aside">
              <div className="ticket-box">
                <div className="tb-head">
                  <div className="pmeta">
                    <span className="price-big" style={ e.type==="Free"?{color:"#1f9d57"}:{}}>{sel.free?"Free":sel.p}</span>
                    {!sel.free && <span className="price-un">onwards</span>}
                  </div>
                  <div className="seats">
                    <span style={{ whiteSpace:"nowrap" }}>{e.cap - e.going} left</span>
                    <div className="bar"><i style={{ width:`${pct}%` }}/></div>
                    <span style={{ whiteSpace:"nowrap", color:"var(--ink-3)" }}>{pct}% full</span>
                  </div>
                </div>
                <div className="tier-list">
                  {tiers.map(t => (
                    <div key={t.id} className={`tier ${tier===t.id?"on":""}`} onClick={()=>setTier(t.id)}>
                      <span className="radio"/>
                      <div className="ti"><div className="n">{t.n}</div><div className="d">{t.d}</div>{t.early && <span className="early">EARLY BIRD</span>}</div>
                      <div className={`tp ${t.free?"free":""}`}>{t.free?"Free":t.p}</div>
                    </div>
                  ))}
                </div>
                <div className="ticket-foot">
                  <div className="qty">
                    <span className="lbl">Quantity</span>
                    <div className="stepper">
                      <button onClick={()=>setQty(q=>Math.max(1,q-1))}>–</button>
                      <span className="n">{qty}</span>
                      <button onClick={()=>setQty(q=>Math.min(6,q+1))}>+</button>
                    </div>
                  </div>
                  {isReg ? (
                    <button className="hbtn hbtn--ghost hbtn--block" style={{ color:"var(--accent-2)" }} onClick={() => go("events")}>
                      <I.check/>You're registered (View Ticket)
                    </button>
                  ) : isSoldOut ? (
                    isWaitlisted ? (
                      <button className="hbtn hbtn--soft hbtn--block" style={{ color:"var(--accent-2)" }} onClick={() => go("waitlist", e)}>
                        <I.users/> View Waitlist Status
                      </button>
                    ) : (
                      <button className="hbtn hbtn--primary hbtn--block" onClick={() => { st.toggleWaitlist(e.id); go("waitlist", e); }}>
                        Join Waitlist
                      </button>
                    )
                  ) : (
                    <button className="hbtn hbtn--primary hbtn--block" onClick={() => { register(e.id); go("events"); }}>
                      {e.type==="Free" ? "Request to join" : `Get ${qty>1?qty+" tickets":"ticket"}`}
                    </button>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center", marginTop:11, fontSize:12, color:"var(--ink-3)" }}>
                    <I.check style={{ width:13, height:13, color:"#1f9d57" }}/> {isSoldOut ? "Waitlist claim window: 15 mins" : e.type==="Free"?"Approval-based · free":"Secure checkout · instant ticket"}
                  </div>
                </div>
              </div>

              <div className="host-card">
                <div className="hh"><Avatar name={e.hostBy||e.host} size={46}/><div><div className="n">{e.host}</div><div className="r">Organizer · 24 events</div></div></div>
                <div className="hb">Curating the best gatherings in {e.city||city}. Follow to never miss a drop.</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="hbtn hbtn--ghost hbtn--sm hbtn--block"><I.plus/>Follow</button>
                  {showChatButton && (e.hostBy || e.host) && (e.hostBy || e.host) !== ME.name && (
                    <button 
                      className="hbtn hbtn--ghost hbtn--sm hbtn--block"
                      onClick={() => {
                        if (window.initiateChatWithName) {
                          window.initiateChatWithName(e.hostBy || e.host);
                        }
                      }}
                    >
                      <I.msg/>Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


