/* ============================================================
   Samaagum Home — main app (routing, frame, theme, tweaks)
   ============================================================ */

function useSet(initial = []) {
  const [s, setS] = useState(() => new Set(initial));
  const toggle = useCallback((id) => setS(prev => { const n = new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; }), []);
  const add = useCallback((id) => setS(prev => { const n = new Set(prev); n.add(id); return n; }), []);
  return [s, toggle, add];
}

/* mobile bottom tab bar */
function TabBar({ view, go, counts }) {
  const tabs = [
    { k:"home", ic:<I.home/>, label:"Home" },
    { k:"discover", ic:<I.compass/>, label:"Discover" },
    { k:"create-event", ic:<I.plus/>, label:"", fab:true },
    { k:"create-group", ic:<I.users/>, label:"", fab:true },
    { k:"messages", ic:<I.chat/>, label:"Chats", badge: counts.messages },
    { k:"profile", ic:<I.user/>, label:"You" },
  ];
  const active = (k) => view===k || (k==="home"&&view==="event") || (k==="discover"&&view==="group");
  return (
    <div className="tabbar">
      {tabs.map(t => t.fab ? (
        <button key={t.k} className="tab" onClick={() => go(t.k)}><span className="fab">{t.ic}</span></button>
      ) : (
        <button key={t.k} className={`tab ${active(t.k)?"on":""}`} onClick={()=>go(t.k)}>
          <span className="ic">{t.ic}</span>{t.label}
          {t.badge ? <span className="tdot"/> : null}
        </button>
      ))}
    </div>
  );
}

function MobileTop({ go, counts, city }) {
  return (
    <div className="m-top">
      <Mark size={26}/>
      <div className="m-search" onClick={()=>go("discover")}><I.search/> Search Samaagum</div>
      <button className="tb-icon" style={{ width:38, height:38 }} onClick={()=>go("notifications")}><I.bell/>{counts.notifs?<span className="dot"/>:null}</button>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "glass": 18
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [city, setCity] = useState("Bengaluru");
  const [cityOpen, setCityOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // navigation stack
  const [stack, setStack] = useState([{ view:"home", param:null }]);
  const cur = stack[stack.length-1];
  const go = useCallback((view, param=null) => {
    setStack(s => {
      if (view==="home") return [{ view:"home", param:null }];
      return [...s, { view, param }];
    });
    // scroll the active view to top
    setTimeout(()=>{ document.querySelectorAll(".scroll").forEach(el=>el.scrollTop=0); }, 0);
  }, []);

  // engagement state
  const [saved, toggleSave] = useSet([]);
  const [joined, toggleJoin] = useSet(["g1","g2","g4"]);
  const [connected, toggleConnect] = useSet([]);
  const [registered, , registerAdd] = useSet(["e1","e2","e4"]);
  const register = useCallback((id)=>registerAdd(id), [registerAdd]);

  const counts = { notifs: 3, messages: 2 };
  const st = { saved, toggleSave, joined, toggleJoin, connected, toggleConnect, registered, register, city };

  // responsive window width check
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const mobile = width <= 820;

  // theme + glass
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.dark ? "dark" : "light");
    r.style.setProperty("--glass-blur-h", `${t.glass}px`);
    r.style.setProperty("--glass-blur", `${t.glass+4}px`);
    const op = Math.min(0.85, 0.32 + (t.glass/30)*0.4);
    r.style.setProperty("--glass-bg", t.dark ? `rgba(28,27,42,${op*0.92})` : `rgba(255,255,255,${op})`);
  }, [t]);

  const renderView = () => {
    const v = cur.view;
    if (v==="home") return <HomeFeed st={st} go={go} />;
    if (v==="discover") return <Discover st={st} go={go} />;
    if (v==="events") return <Discover st={st} go={go} />;
    if (v==="groups") return <Discover st={st} go={go} />;
    if (v==="event") return <EventDetail ev={cur.param} st={st} go={go} />;
    if (v==="group") return <GroupDetail group={cur.param} st={st} go={go} />;
    if (v==="profile") return <Profile st={st} go={go} />;
    if (v==="notifications") return <Notifications st={st} go={go} />;
    if (v==="messages") return <Messages st={st} go={go} mobile={mobile} />;
    if (v==="create-event") {
      const CreateEventComp = typeof window !== "undefined" ? window.CreateEvent : null;
      if (CreateEventComp) {
        return <CreateEventComp go={go} mobile={mobile} />;
      }
      return <div style={{ padding: 40, textAlign: "center" }}>Loading Create Event module...</div>;
    }
    if (v==="create-group") {
      const CreateGroupComp = typeof window !== "undefined" ? window.CreateGroup : null;
      if (CreateGroupComp) {
        return <CreateGroupComp go={go} mobile={mobile} />;
      }
      return <div style={{ padding: 40, textAlign: "center" }}>Loading Create Group module...</div>;
    }
    return <HomeFeed st={st} go={go} />;
  };

  // discover/events/groups map to sidebar active key
  const navKey = ["events"].includes(cur.view) ? "events"
    : ["groups"].includes(cur.view) ? "groups"
    : ["create-event","create-group"].includes(cur.view) ? null
    : cur.view;

  return (
    <div className={`app ${mobile?"mobile":""} ${sidebarCollapsed?"collapsed":""}`}>
      {!mobile && <Sidebar view={navKey} go={go} counts={counts} collapsed={sidebarCollapsed} onToggleCollapse={()=>setSidebarCollapsed(v=>!v)} />}
      <div className="content">
        {mobile ? <MobileTop go={go} counts={counts} city={city} />
                : <Topbar go={go} counts={counts} dark={t.dark} onToggleTheme={()=>setTweak("dark", !t.dark)} city={city} onCity={()=>setCityOpen(true)} />}
        {renderView()}
        {mobile && <TabBar view={cur.view} go={go} counts={counts} />}
        <CityPicker open={cityOpen} onClose={()=>setCityOpen(false)} city={city} onPick={setCity} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
