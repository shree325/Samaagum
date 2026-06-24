// @ts-nocheck
/* ============================================================
   Samaagum Home — Create event + Create group (Luma-grade, live preview)
   ============================================================ */

const COVER_SWATCHES = Object.entries(COVERS).map(([k, v]) => ({ k, v }));

function CoverPicker({ value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      {COVER_SWATCHES.map(s => (
        <button key={s.k} onClick={() => onPick(s.v)} title={s.k}
          style={{
            width: 34, height: 34, borderRadius: 10, cursor: "pointer", background: s.v,
            border: value === s.v ? "2.5px solid var(--ink)" : "2px solid transparent",
            boxShadow: value === s.v ? "0 0 0 2px var(--surface) inset" : "var(--sh-sm)", transition: "transform .15s"
          }} />
      ))}
    </div>
  );
}

function Toggle({ on, onClick }) { return <button className={`tg ${on ? "on" : ""}`} onClick={onClick} />; }

/* ---------------- Create Event ---------------- */
function CreateEvent({ go, mobile }) {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState(COVERS.sunset);
  const [type, setType] = useState("paid");
  const [cat, setCat] = useState("Startups"); const [city, setCity] = useState("Bengaluru");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [desc, setDesc] = useState("");
  const [approval, setApproval] = useState(false);
  const [cash, setCash] = useState(false);
  const [tickets, setTickets] = useState([{ n: "Early Bird", cap: "50", price: "499" }]);
  const types = [
    { k: "paid", ic: <I.ticket />, t: "Paid", d: "Sell tickets" },
    { k: "free", ic: <I.users />, t: "Free", d: "RSVP only" },
    { k: "online", ic: <I.online />, t: "Online", d: "Virtual link" },
  ];
  const setTk = (i, key, v) => setTickets(ts => ts.map((t, j) => j === i ? { ...t, [key]: v } : t));

  const venueInputRef = useRef(null);
  const cityInputRef = useRef(null);

  useEffect(() => {
    if (type === "online" || !window.google?.maps?.places || !venueInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(venueInputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setVenue(place.formatted_address);
        const cityComp = place.address_components?.find(c =>
          c.types.includes("locality") || c.types.includes("administrative_area_level_2")
        );
        if (cityComp) {
          setCity(cityComp.long_name);
        }
      }
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(venueInputRef.current);
      }
    };
  }, [type]);

  useEffect(() => {
    if (!window.google?.maps?.places || !cityInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current, {
      types: ["(cities)"],
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.address_components) {
        const cityComp = place.address_components.find(c =>
          c.types.includes("locality") || c.types.includes("administrative_area_level_2")
        );
        if (cityComp) {
          setCity(cityComp.long_name);
        } else if (place.formatted_address) {
          setCity(place.formatted_address);
        }
      }
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(cityInputRef.current);
      }
    };
  }, []);

  const previewEv = {
    cover, cat, type: type === "free" ? "Free" : "Paid", online: type === "online",
    month: "JUN", day: "18", title: title || "Your event title",
    date: date || "Date TBD", time: time || "Time TBD",
    venue: type === "online" ? "Online" : (venue || "Venue TBD"),
    going: 0, price: type === "paid" ? `₹${tickets[0]?.price || "—"}` : "Free", attendees: [],
    city: city
  };

  return (
    <div className={`create max-w-[1000px] mx-auto w-full ${mobile ? "single" : ""}`}>
      <div className="create-form">
        <div className="cf-inner">
          <div className="create-head">
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding: "7px 11px" }}><I.arrowL /></button>
            <div><div className="ck">New event</div><h1>Create an event</h1></div>
          </div>

          <div className={`cover-up ${cover ? "filled" : ""}`} style={cover ? { background: cover } : {}}>
            {cover && <Grain />}
            <div className="up-hint" style={cover ? { color: "#fff" } : {}}>
              <div className="uic" style={cover ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : {}}><I.image /></div>
              {cover ? "Looks great — pick a theme below" : "Upload a cover image"}
            </div>
          </div>
          <CoverPicker value={cover} onPick={setCover} />

          <div style={{ marginTop: 22 }}>
            <input className="title-input" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="cfield" style={{ marginTop: 18 }}>
            <label>Event type</label>
            <div className="type-pills">
              {types.map(t => (
                <button key={t.k} className={`type-pill ${type === t.k ? "on" : ""}`} onClick={() => setType(t.k)}>
                  <span className="tpic">{t.ic}</span><span className="tpt">{t.t}</span><span className="tpd">{t.d}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="crow">
            <div className="cfield"><label>Date</label><input className="cinput" type="text" placeholder="Thu, Jun 18" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="cfield"><label>Time</label><input className="cinput" type="text" placeholder="6:30 PM" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>

          <div className="cfield">
            <label>{type === "online" ? "Meeting link" : "Venue"} <span className="opt">{type === "online" ? "· revealed after registration" : ""}</span></label>
            <input ref={venueInputRef} className="cinput" placeholder={type === "online" ? "https://meet.samaagum.co/…" : "Add a venue or address"} value={venue} onChange={e => setVenue(e.target.value)} />
          </div>

          <div className="crow">
            <div className="cfield"><label>City</label>
              <input ref={cityInputRef} className="cinput" placeholder="Search city in India..." value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="cfield"><label>Category</label>
              <select className="cselect" value={cat} onChange={e => setCat(e.target.value)}>
                {CATS.filter(c => c[0] !== "All").map(([c]) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="cfield">
            <label>Capacity <span className="opt">· hard cap</span></label>
            <input className="cinput" placeholder="180" />
          </div>

          <div className="cfield">
            <label>Description</label>
            <textarea className="ctext" placeholder="Tell people what to expect — the vibe, who it's for, what they'll leave with." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {type === "paid" && (
            <div className="cfield">
              <label>Ticket types</label>
              {tickets.map((t, i) => (
                <div key={i} className="ticket-row">
                  <span className="grip"><I.more style={{ transform: "rotate(90deg)" }} /></span>
                  <div className="tr-i">
                    <input className="tr-mini" placeholder="Tier name" value={t.n} onChange={e => setTk(i, "n", e.target.value)} />
                    <input className="tr-mini" placeholder="Qty" value={t.cap} onChange={e => setTk(i, "cap", e.target.value)} />
                    <input className="tr-mini" placeholder="₹ Price" value={t.price} onChange={e => setTk(i, "price", e.target.value)} />
                  </div>
                  {tickets.length > 1 && <button className="tr-del" onClick={() => setTickets(ts => ts.filter((_, j) => j !== i))}><I.x /></button>}
                </div>
              ))}
              <button className="add-row" onClick={() => setTickets(ts => [...ts, { n: "", cap: "", price: "" }])}><I.plus />Add ticket type</button>
            </div>
          )}

          <div className="cfield">
            <label>Registration settings</label>
            <div className="toggle-row"><div className="ti"><div className="t">Approval required</div><div className="d">Manually approve each registration</div></div><Toggle on={approval} onClick={() => setApproval(v => !v)} /></div>
            {type === "paid" && <div className="toggle-row"><div className="ti"><div className="t">Accept cash / offline payment</div><div className="d">Hold capacity until you confirm receipt</div></div><Toggle on={cash} onClick={() => setCash(v => !v)} /></div>}
            <div className="toggle-row"><div className="ti"><div className="t">Add to calendar (ICS)</div><div className="d">Attendees get a calendar file with their ticket</div></div><Toggle on={true} onClick={() => { }} /></div>
          </div>
        </div>
      </div>

      {!mobile && (
        <div className="create-preview">
          <div className="pv-label"><span className="d" />Live preview</div>
          <EventCard ev={previewEv} onOpen={() => { }} saved={false} onSave={() => { }} />
          <div style={{ marginTop: 22, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>Summary</div>
            <div className="side-stat"><span className="k">Type</span><span className="v" style={{ textTransform: "capitalize" }}>{type}</span></div>
            <div className="side-stat"><span className="k">Category</span><span className="v">{cat}</span></div>
            {type === "paid" && <div className="side-stat"><span className="k">From</span><span className="v">₹{tickets[0]?.price || "—"}</span></div>}
            <div className="side-stat"><span className="k">Approval</span><span className="v">{approval ? "On" : "Auto"}</span></div>
          </div>
        </div>
      )}

      <div className="create-foot" style={mobile ? { gridColumn: "1" } : { gridColumn: "1 / -1" }}>
        <button className="hbtn hbtn--ghost" onClick={() => go("home")}>Cancel</button>
        <div className="sp" />
        <button className="hbtn hbtn--ghost">Save draft</button>
        <button className="hbtn hbtn--primary" onClick={() => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city, cap: 180, desc })}><I.check />Publish event</button>
      </div>
    </div>
  );
}

/* ---------------- Create Group ---------------- */
function CreateGroup({ go, mobile }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✺");
  const [cover, setCover] = useState(COVERS.violet);
  const [cat, setCat] = useState("Design");
  const [desc, setDesc] = useState("");
  const [join, setJoin] = useState("approval");
  const [questionnaire, setQuestionnaire] = useState(true);
  const icons = ["✺", "🚀", "🌅", "◆", "🎧", "🍲", "🎨", "⚡", "🌱", "📚"];

  const previewG = {
    name: name || "Your group name", icon, cover, cat,
    desc: desc || "A short description of what your community is about and who it's for.",
    members: 1, online: 1, memberNames: [ME.name]
  };

  return (
    <div className={`create max-w-[1000px] mx-auto w-full ${mobile ? "single" : ""}`}>
      <div className="create-form">
        <div className="cf-inner">
          <div className="create-head">
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding: "7px 11px" }}><I.arrowL /></button>
            <div><div className="ck">New group</div><h1>Create a group</h1></div>
          </div>

          <div className={`cover-up filled`} style={{ background: cover }}>
            <Grain />
            <div style={{ position: "absolute", left: 20, bottom: -26, width: 64, height: 64, borderRadius: 18, background: cover, border: "3px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "var(--sh-md)", zIndex: 3 }}>{icon}</div>
            <div className="up-hint" style={{ color: "#fff" }}><div className="uic" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}><I.image /></div>Group cover</div>
          </div>
          <div style={{ marginTop: 34 }}><CoverPicker value={cover} onPick={setCover} /></div>

          <div className="cfield" style={{ marginTop: 18 }}>
            <label>Group icon</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {icons.map(em => (
                <button key={em} onClick={() => setIcon(em)} style={{
                  width: 42, height: 42, borderRadius: 12, fontSize: 20, cursor: "pointer",
                  border: icon === em ? "2px solid var(--accent-2)" : "1px solid var(--border)", background: icon === em ? "var(--accent-soft)" : "var(--field)"
                }}>{em}</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <input className="title-input" style={{ fontSize: 26 }} placeholder="Group name" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="cfield" style={{ marginTop: 14 }}>
            <label>Category</label>
            <select className="cselect" value={cat} onChange={e => setCat(e.target.value)}>
              {CATS.filter(c => c[0] !== "All").map(([c]) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="cfield">
            <label>Description</label>
            <textarea className="ctext" placeholder="What is this community about? Who should join?" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="cfield">
            <label>Join mode</label>
            <div className="type-pills">
              <button className={`type-pill ${join === "open" ? "on" : ""}`} onClick={() => setJoin("open")}><span className="tpic"><I.globe /></span><span className="tpt">Open</span><span className="tpd">Anyone can join</span></button>
              <button className={`type-pill ${join === "approval" ? "on" : ""}`} onClick={() => setJoin("approval")}><span className="tpic"><I.check /></span><span className="tpt">Approval</span><span className="tpd">You review requests</span></button>
            </div>
          </div>

          <div className="cfield">
            <label>Membership</label>
            <div className="toggle-row"><div className="ti"><div className="t">Join questionnaire</div><div className="d">Ask custom questions when people request to join</div></div><Toggle on={questionnaire} onClick={() => setQuestionnaire(v => !v)} /></div>
            <div className="toggle-row"><div className="ti"><div className="t">Enable forums</div><div className="d">Posts, comments & media at group level</div></div><Toggle on={true} onClick={() => { }} /></div>
            <div className="toggle-row"><div className="ti"><div className="t">Media gallery</div><div className="d">Shared photo gallery for members</div></div><Toggle on={true} onClick={() => { }} /></div>
          </div>
        </div>
      </div>

      {!mobile && (
        <div className="create-preview">
          <div className="pv-label"><span className="d" />Live preview</div>
          <GroupCard g={previewG} onOpen={() => { }} joined={false} onJoin={() => { }} />
          <div style={{ marginTop: 22, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>Summary</div>
            <div className="side-stat"><span className="k">Category</span><span className="v">{cat}</span></div>
            <div className="side-stat"><span className="k">Join mode</span><span className="v" style={{ textTransform: "capitalize" }}>{join}</span></div>
            <div className="side-stat"><span className="k">Forums</span><span className="v">Enabled</span></div>
          </div>
        </div>
      )}

      <div className="create-foot" style={mobile ? { gridColumn: "1" } : { gridColumn: "1 / -1" }}>
        <button className="hbtn hbtn--ghost" onClick={() => go("home")}>Cancel</button>
        <div className="sp" />
        <button className="hbtn hbtn--primary" onClick={() => go("group", { ...previewG, id: "newg", posts: 0, members: 1 })}><I.check />Create group</button>
      </div>
    </div>
  );
}

Object.assign(window, { CreateEvent, CreateGroup });
