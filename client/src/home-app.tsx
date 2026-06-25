// @ts-nocheck
/* ============================================================
   Samaagum Home — main app (routing, frame, theme, tweaks)
   ============================================================ */

function useSet(initial = []) {
  const [s, setS] = useState(() => new Set(initial));
  const toggle = useCallback((id) => setS(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const add = useCallback((id) => setS(prev => { const n = new Set(prev); n.add(id); return n; }), []);
  return [s, toggle, add];
}

/* mobile bottom tab bar */
function TabBar({ view, go, counts, chatSettings }) {
  const showMessages = chatSettings?.allowSiteMessaging !== false;
  const tabs = [
    { k: "home", ic: <I.home />, label: "Home" },
    { k: "discover", ic: <I.compass />, label: "Discover" },
    { k: "create-event", ic: <I.plus />, label: "", fab: true },
    ...(showMessages ? [{ k: "messages", ic: <I.chat />, label: "Chats", badge: counts.messages }] : []),
    { k: "profile", ic: <I.user />, label: "You" },
  ];
  const active = (k) => view === k || (k === "home" && view === "event") || (k === "discover" && view === "group");
  return (
    <div className="tabbar">
      {tabs.map(t => t.fab ? (
        <button key={t.k} className="tab" onClick={() => go("create-event")}><span className="fab">{t.ic}</span></button>
      ) : (
        <button key={t.k} className={`tab ${active(t.k) ? "on" : ""}`} onClick={() => go(t.k)}>
          <span className="ic">{t.ic}</span>{t.label}
          {t.badge ? <span className="tdot" /> : null}
        </button>
      ))}
    </div>
  );
}

function MobileTop({ go, counts, city, chatSettings }) {
  const showMessages = chatSettings?.allowSiteMessaging !== false;
  return (
    <div className="m-top">
      <Mark size={26}/>
      <div className="m-search" onClick={()=>go("discover")}><I.search/> Search Samaagum</div>
      {showMessages && (
        <button className="tb-icon" style={{ width:38, height:38 }} onClick={()=>go("messages")}><I.chat/>{counts.messages?<span className="dot"/>:null}</button>
      )}
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
  const [city, setCity] = useState("Global");
  const [chatSettings, setChatSettings] = useState({
    allowSiteMessaging: true,
    allowDirectMessaging: true,
    allowGroupChat: true,
    allowEventChat: true
  });
  const [cityOpen, setCityOpen] = useState(false);
  const [meSync, setMeSync] = useState(0); // Add a tick to force re-render when ME updates asynchronously

  const [subscription, setSubscription] = useState({ plan: 'free', status: 'active' });
  const [socket, setSocket] = useState(null);

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  useEffect(() => {
    fetch(`${apiBase}/api/messaging/settings`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setChatSettings(res.data);
          window.chatSettings = res.data;
        }
      })
      .catch(err => console.error("Error fetching chat settings:", err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    let userId = null;
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        userId = payload.id;
      }
    } catch (e) {
      console.error('Error parsing token for socket:', e);
    }

    if (userId && window.io) {
      const chatSocket = window.io(apiBase ? `${apiBase}/chat` : "/chat", {
        auth: { token: userId },
        transports: ["websocket", "polling"]
      });

      chatSocket.on("connect", () => {
        console.log("🔌 Connected to chat socket as:", userId);
      });

      chatSocket.on("settings.updated", (updatedSettings) => {
        console.log("⚡ Chat settings updated in real-time:", updatedSettings);
        setChatSettings(updatedSettings);
        window.chatSettings = updatedSettings;
      });

      setSocket(chatSocket);

      return () => {
        chatSocket.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return; // Not logged in — skip profile/subscription fetch

    // Fetch subscription status
    fetch(`${apiBase}/api/subscription/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data.subscription) {
          setSubscription(res.data.subscription);
          if (res.data.role) {
            ME.role = res.data.role.displayName || res.data.role.name;
          }
        }
      })
      .catch(err => console.error('Error fetching subscription status', err));

    // Fetch user profile details using the token's user id
    fetch(`${apiBase}/api/admin/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          if (res.data.email) {
            ME.email = res.data.email;
            ME.handle = `@${res.data.email.split('@')[0]}`;
          }
          if (res.data.phone) {
            ME.phone = res.data.phone;
          }
          if (res.data.profilePhoto) {
            ME.img = res.data.profilePhoto.startsWith('data:') ? res.data.profilePhoto : (res.data.profilePhoto.startsWith('http') ? res.data.profilePhoto : apiBase + res.data.profilePhoto);
          }
          if (res.data.coverBanner) {
            ME.coverBanner = res.data.coverBanner.startsWith('data:') ? res.data.coverBanner : (res.data.coverBanner.startsWith('http') ? res.data.coverBanner : apiBase + res.data.coverBanner);
          }
          if (res.data.full_name) {
            ME.name = res.data.full_name;
          } else if (res.data.profile && res.data.profile.display_name) {
            ME.name = res.data.profile.display_name;
          }
          if (res.data.profile) {
            const prof = res.data.profile;
            if (prof.bio) ME.role = prof.bio;
            if (prof.preferred_location) ME.location = prof.preferred_location;
            if (prof.skills && Array.isArray(prof.skills) && prof.skills.length > 0) {
              ME.skills = prof.skills;
            }
            if (prof.gender || res.data.gender) ME.gender = prof.gender || res.data.gender;
            
            const dobToUse = prof.dob || res.data.dob;
            if (dobToUse) {
              // Convert ISO string to YYYY-MM-DD for date input
              ME.dob = dobToUse.split('T')[0];
            }
          }
          if (res.data.socialLinks) {
            ME.socialLinks = res.data.socialLinks;
          }
          setMeSync(tick => tick + 1); // Trigger re-render to reflect ME.img and ME.name updates
        }
      })
      .catch(err => console.error('Error fetching user profile', err));
  }, []);

  // navigation stack
  const [stack, setStack] = useState([{ view: "home", param: null }]);
  const cur = stack[stack.length - 1];
  const go = useCallback((view, param = null) => {
    setStack(s => {
      if (view === "home") return [{ view: "home", param: null }];
      return [...s, { view, param }];
    });
    // scroll the active view to top
    setTimeout(() => { document.querySelectorAll(".scroll").forEach(el => el.scrollTop = 0); }, 0);
  }, []);

  useEffect(() => {
    window.samaagum_go = go;
    return () => { delete window.samaagum_go; };
  }, [go]);

  useEffect(() => {
    window.initiateChatWithName = (name) => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      fetch(`${apiBase}/api/messaging/users/search?q=${encodeURIComponent(name)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data && res.data.length > 0) {
            const targetUser = res.data[0];
            fetch(`${apiBase}/api/messaging/conversations/direct`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ targetId: targetUser.id })
            })
              .then(cRes => cRes.json())
              .then(cRes => {
                if (cRes.success && cRes.data) {
                  localStorage.setItem('active_chat_conv_id', cRes.data.id);
                  go("messages");
                } else {
                  alert(cRes.error || "Failed to start chat.");
                }
              })
              .catch(err => console.error("Error starting chat:", err));
          } else {
            alert("User could not be found to start chat.");
          }
        })
        .catch(err => console.error("Error searching user:", err));
    };

    return () => {
      delete window.initiateChatWithName;
    };
  }, [go, apiBase]);

  // engagement state
  const [saved, toggleSave] = useSet([]);
  const [joined, toggleJoin] = useSet(["g1","g2","g4"]);
  const [pending, togglePending] = useSet([]);
  const [connected, toggleConnect] = useSet([]);
  const [registered, , registerAdd] = useSet(["e1", "e2", "e4"]);
  const [myTickets, setMyTickets] = useState(MY_TICKETS);
  const [waitlisted, setWaitlisted] = useState(new Set(["ev-feat"]));

  const toggleWaitlist = useCallback((id) => setWaitlisted(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  }), []);

  const register = useCallback((id) => {
    registerAdd(id);
    const evObj = [FEATURED, ...EVENTS].find(e => e.id === id);
    if (evObj) {
      setMyTickets(prev => {
        if (prev.some(t => t.ev === evObj.title)) return prev;
        return [
          {
            id: "BL-" + Math.floor(2000 + Math.random() * 500),
            ev: evObj.title,
            cover: evObj.cover,
            tier: evObj.type === "Free" ? "General RSVP" : "VIP · Front tables",
            date: evObj.date,
            time: evObj.time,
            venue: evObj.venue,
            online: !!evObj.online,
            paid: evObj.price || "Free",
            qty: 1,
            attendee: ME.name,
            status: "confirmed"
          },
          ...prev
        ];
      });
    }
  }, [registerAdd]);

  const addClaimedTicket = useCallback((t) => {
    setMyTickets(prev => {
      if (prev.some(x => x.ev === t.ev)) return prev;
      return [
        {
          id: "BL-" + Math.floor(2000 + Math.random() * 500),
          ev: t.ev,
          cover: t.cover,
          tier: t.tier,
          date: t.date,
          time: t.time,
          venue: t.venue,
          online: !!t.online,
          paid: t.price || "Free",
          qty: 1,
          attendee: ME.name,
          status: "confirmed"
        },
        ...prev
      ];
    });
  }, []);

  const [createdEvents, setCreatedEvents] = useState(() => [EVENTS[0]]);
  const [createdGroups, setCreatedGroups] = useState(() => [GROUPS[1]]);

  const addCreatedEvent = useCallback((ev) => {
    setCreatedEvents(prev => {
      if (prev.some(x => x.id === ev.id)) {
        return prev.map(x => x.id === ev.id ? ev : x);
      }
      return [ev, ...prev];
    });
  }, []);

  const addCreatedGroup = useCallback((g) => {
    setCreatedGroups(prev => {
      if (prev.some(x => x.id === g.id)) {
        return prev.map(x => x.id === g.id ? g : x);
      }
      return [g, ...prev];
    });
  }, []);

  const handleJoin = useCallback((g) => {
    if (g.joinMode === "approval") {
      togglePending(g.id);
    } else {
      toggleJoin(g.id);
    }
  }, [toggleJoin, togglePending]);

  const counts = { notifs: 3, messages: 2 };
  const st = {
    saved, toggleSave, joined, pending, toggleJoin: handleJoin, connected, toggleConnect, registered, register, city,
    myTickets, setMyTickets, waitlisted, toggleWaitlist, addClaimedTicket,
    createdEvents, setCreatedEvents, createdGroups, setCreatedGroups,
    addCreatedEvent, addCreatedGroup,
    subscription, setSubscription,
    chatSettings, setChatSettings
  };

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
    r.style.setProperty("--glass-blur", `${t.glass + 4}px`);
    const op = Math.min(0.85, 0.32 + (t.glass / 30) * 0.4);
    r.style.setProperty("--glass-bg", t.dark ? `rgba(28,27,42,${op * 0.92})` : `rgba(255,255,255,${op})`);
  }, [t]);

  const renderView = () => {
    const v = cur.view;
    if (v === "home") return <HomeFeed st={st} go={go} />;
    if (v === "discover") return <Discover st={st} go={go} />;
    if (v === "events") return <MyTickets st={st} go={go} />;
    if (v === "groups") return <MyGroups st={st} go={go} />;
    if (v === "event") return <EventDetail ev={cur.param} st={st} go={go} />;
    if (v === "group") return <GroupDetail group={cur.param} st={st} go={go} />;
    if (v === "profile") return <Profile st={st} go={go} />;
    if (v === "public-profile") return <PublicProfile profile={cur.param} go={go} />;
    if (v === "notifications") return <Notifications st={st} go={go} />;
    if (v === "messages") {
      if (chatSettings.allowSiteMessaging === false) {
        setTimeout(() => go("home"), 0);
        return <HomeFeed st={st} go={go} />;
      }
      return <Messages st={st} go={go} mobile={mobile} socket={socket} />;
    }
    if (v === "create-event") return <CreateEvent go={go} mobile={mobile} st={st} />;
    if (v === "edit-event") return <CreateEvent editEv={cur.param} go={go} mobile={mobile} st={st} />;
    if (v === "create-group") return <CreateGroup go={go} mobile={mobile} st={st} />;
    if (v === "edit-group") return <CreateGroup editGroup={cur.param} go={go} mobile={mobile} st={st} />;
    if (v === "event-dashboard") return <EventDashboard ev={cur.param} st={st} go={go} />;
    if (v === "group-dashboard") return <GroupDashboard group={cur.param} st={st} go={go} />;
    if (v === "ticket") return <TicketDetail tkt={cur.param} st={st} go={go} />;
    if (v === "waitlist") return <Waitlist ev={cur.param} st={st} go={go} />;
    if (v === "claim") return <ClaimFlow st={st} go={go} />;
    if (v === "upgrade") return <UpgradePage st={st} go={go} />;
    if (v === "checkout") return <CheckoutPage param={cur.param} st={st} go={go} />;
    if (v === "checkout-success") return <CheckoutSuccessPage param={cur.param} st={st} go={go} />;
    return <HomeFeed st={st} go={go} />;
  };

  // discover/events/groups map to sidebar active key
  const navKey = ["events", "event-dashboard", "edit-event"].includes(cur.view) ? "events"
    : ["groups", "group-dashboard", "edit-group"].includes(cur.view) ? "groups"
      : ["create-event", "create-group"].includes(cur.view) ? null
        : cur.view;

  return (
    <div className={`app ${mobile ? "mobile" : ""}`}>
      {!mobile && <Sidebar view={navKey} go={go} counts={counts} chatSettings={chatSettings} />}
      <div className="content">
        {mobile ? <MobileTop go={go} counts={counts} city={city} chatSettings={chatSettings} />
          : <Topbar go={go} counts={counts} dark={t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} city={city} onCity={() => setCityOpen(true)} chatSettings={chatSettings} />}
        {renderView()}
        {mobile && <TabBar view={cur.view} go={go} counts={counts} chatSettings={chatSettings} />}
        <CityPicker open={cityOpen} onClose={() => setCityOpen(false)} city={city} onPick={setCity} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
