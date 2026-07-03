// @ts-nocheck
/* ============================================================
   Samaagum Home — main app (routing, frame, theme, tweaks)
   ============================================================ */

function useSet(initial = []) {
  const [s, setS] = useState(() => {
    const val = typeof initial === 'function' ? initial() : initial;
    return new Set(val);
  });
  const toggle = useCallback((id) => setS(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);
  const add = useCallback((id) => setS(prev => { const n = new Set(prev); n.add(id); return n; }), []);
  return [s, toggle, add];
}

/* mobile bottom tab bar */
function TabBar({ view, go, counts, chatSettings }) {
  const showMessages = chatSettings?.allowSiteMessaging !== false;
  const tabs = [
    { k:"home", ic:<I.home/>, label:"Home" },
    { k:"discover", ic:<I.compass/>, label:"Discover" },
    { k:"create-event", ic:<I.plus/>, label:"", fab:true },
    { k:"create-group", ic:<I.users/>, label:"", fab:true },
    { k:"messages", ic:<I.chat/>, label:"Chats", badge: counts.messages },
    { k:"profile", ic:<I.user/>, label:"You" },
  ];
  const active = (k) => view === k || (k === "home" && view === "event") || (k === "discover" && view === "group");
  return (
    <div className="tabbar">
      {tabs.map(t => t.fab ? (
        <button key={t.k} className="tab" onClick={() => go(t.k)}><span className="fab">{t.ic}</span></button>
      ) : (
        <button key={t.k} className={`tab ${active(t.k) ? "on" : ""}`} onClick={() => go(t.k)}>
          <span className="ic">{t.ic}</span>{t.label}
          {t.badge ? <span className="badge">{t.badge}</span> : null}
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
        <button className="tb-icon" style={{ width:38, height:38 }} onClick={()=>go("messages")}><I.chat/>{counts.messages?<span className="badge">{counts.messages}</span>:null}</button>
      )}
      <button className="tb-icon" style={{ width:38, height:38 }} onClick={()=>go("notifications")}><I.bell/>{counts.notifs?<span className="badge">{counts.notifs}</span>:null}</button>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "glass": 18
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [city, setCity] = useState(window.ME?.location || "Global");
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
  const [counts, setCounts] = useState({ notifs: 0, messages: 0 });
  const [toasts, setToasts] = useState([]);
  const [ioLoaded, setIoLoaded] = useState(!!window.io);

  useEffect(() => {
    if (window.io) return;
    const interval = setInterval(() => {
      if (window.io) {
        setIoLoaded(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  // Set up global toast helper and initial fetch
  useEffect(() => {
    window.toast = (message, type = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    fetchCounts();
    return () => {
      delete window.toast;
    };
  }, []);

  const fetchCounts = () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${apiBase}/api/messaging/counts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setCounts(res.data);
        }
      })
      .catch(err => console.error("Error fetching counts:", err));
  };

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
        window.ME.id = userId; // Store globally
      }
    } catch (e) {
      console.error('Error parsing token for socket:', e);
    }

    if (userId && window.io) {
      const chatSocket = window.io(apiBase ? `${apiBase}/chat` : "/chat", {
        auth: { token: userId },
        transports: ["websocket"]
      });

      chatSocket.on("connect", () => {
        console.log("🔌 Connected to chat socket as:", userId);
        fetchCounts();
      });

      chatSocket.on("message.received", (payload) => {
        fetchCounts();
        
        // Show visual toast notification if recipient is not actively viewing this conversation
        const isCurrentlyViewingConversation = curRef.current?.view === "messages" && window.activeConversationId === payload.conversationId;
        if (!isCurrentlyViewingConversation && window.toast) {
          const sender = payload.senderName || "New message";
          const text = payload.content || payload.body || "";
          window.toast(`${sender}: ${text}`, "message");
        }
      });

      chatSocket.on("request.received", (payload) => {
        fetchCounts();
        if (window.toast) {
          const senderName = payload.sender?.profiles?.display_name || payload.sender?.primary_email?.split('@')[0] || "Someone";
          window.toast(`${senderName} sent you a chat request`, "info");
        }
      });

      chatSocket.on("request.accepted", (payload) => {
        fetchCounts();
        if (window.toast && window.ME?.id === payload.senderId) {
          window.toast(`Your chat request was accepted`, "success");
        }
      });

      chatSocket.on("request.declined", (payload) => {
        fetchCounts();
        if (window.toast && window.ME?.id === payload.senderId) {
          window.toast(`Your chat request was declined`, "warning");
        }
      });

      // Connection request events (new system)
      chatSocket.on("connection.request.received", (payload) => {
        fetchCounts();
        if (window.toast) {
          const name = payload.requester?.display_name || "Someone";
          window.toast(`${name} sent you a connection request 🤝`, "info");
        }
      });

      chatSocket.on("connection.accepted", (payload) => {
        fetchCounts();
        if (window.toast && window.ME?.id === payload.requesterId) {
          window.toast(`Your connection request was accepted! 🎉`, "success");
        }
      });

      chatSocket.on("connection.declined", (payload) => {
        fetchCounts();
      });

      chatSocket.on("group.notification", (payload) => {
        fetchCounts();
        // If this is an event acceptance/decline, refresh joined events list
        if (payload.type === 'event' || payload.type === 'system') {
          fetchJoinedEvents();
        }
        if (window.toast) {
          const cleanText = payload.text ? payload.text.replace(/<\/?[^>]+(>|$)/g, "") : "New activity";
          window.toast(cleanText, payload.type === 'event' ? "success" : "info");
        }
        window.dispatchEvent(new CustomEvent("samaagum:groupNotification", { detail: payload }));
      });

      chatSocket.on("receipt.updated", () => {
        fetchCounts();
      });

      chatSocket.on("profile.updated", (payload) => {
        // Dispatch global event for useProfileSync hook
        window.dispatchEvent(new CustomEvent('samaagum:profileSync', { detail: payload }));
        
        // Update ME directly if it's the current user
        if (window.ME?.id === payload.userId) {
          if (payload.name) window.ME.name = payload.name;
          if (payload.bio) window.ME.role = payload.bio;
          if (payload.location) {
            window.ME.location = payload.location;
            setCity(payload.location);
          }
          if (payload.profilePhoto) window.ME.img = payload.profilePhoto;
          setMeSync(Date.now()); // trigger global re-render
        }
      });

      chatSocket.on("settings.updated", (updatedSettings) => {
        console.log("⚡ Chat settings updated in real-time:", updatedSettings);
        setChatSettings(updatedSettings);
        window.chatSettings = updatedSettings;
      });



      setSocket(chatSocket);
      window.chatSocket = chatSocket;

      return () => {
        chatSocket.disconnect();
        window.chatSocket = null;
      };
    }
  }, [ioLoaded]);

    useEffect(() => {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      
      // Fetch features
      fetch(`${apiBase}/api/public/features`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            window.featureSettings = json.data;
            setMeSync(Date.now());
          }
        })
        .catch(err => console.error('Error fetching features', err));

      const token = localStorage.getItem('token');
      if (!token) return; // Not logged in - skip profile/subscription fetch

    fetchCounts();

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
          if (res.data.privacyPrefs) {
            ME.privacy = res.data.privacyPrefs;
            localStorage.setItem("samaagum_privacy_prefs", JSON.stringify(res.data.privacyPrefs));
          }
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
            if (prof.preferred_location) {
              ME.location = prof.preferred_location;
              setCity(prof.preferred_location);
            }
            if (prof.skills && Array.isArray(prof.skills) && prof.skills.length > 0) {
              ME.skills = prof.skills;
            }
            if (prof.gender || res.data.gender) ME.gender = prof.gender || res.data.gender;
            
            const dobToUse = prof.dob || res.data.dob;
            if (dobToUse) {
              // Convert ISO string to YYYY-MM-DD for date input
              ME.dob = dobToUse.split('T')[0];
            }
            if (prof.messaging_restriction) {
              ME.messaging_restriction = prof.messaging_restriction;
            }
          }
          if (res.data.socialLinks) {
            ME.socialLinks = res.data.socialLinks;
          }
          setMeSync(tick => tick + 1); // Trigger re-render to reflect ME.img and ME.name updates
        }
      })
      .catch(err => console.error('Error fetching user profile', err));

    // Fetch user's created events
    fetch(`${apiBase}/api/events/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setCreatedEvents(res.data);
        }
      })
      .catch(err => console.error('Error fetching user events', err));

    // Fetch events the user has joined or requested to join
    fetch(`${apiBase}/api/events/joined`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setJoinedEvents(res.data);
        }
      })
      .catch(err => console.error('Error fetching joined events', err));
  }, []);

  // navigation stack
  const [stack, setStack] = useState(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Support path-based invite routing
    if (path.startsWith('/groups/invite/')) {
       const token = path.split('/groups/invite/')[1];
       if (token) return [{ view: "invite", param: token }];
    }
    // Support hash-based invite routing as fallback
    if (hash.startsWith('#/groups/invite/')) {
       const token = hash.split('#/groups/invite/')[1];
       if (token) return [{ view: "invite", param: token }];
    }
    
    return [{ view: "home", param: null }];
  });
  const cur = stack[stack.length - 1];
  const curRef = useRef(cur);
  useEffect(() => {
    curRef.current = cur;
  }, [cur]);

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
  const [joined, toggleJoin] = useSet(["g1", "g2", "g4"]);
  const [pending, togglePending] = useSet([]);
  const [createdGroups, setCreatedGroups] = useState(() => [GROUPS[1]]);
  const [connected, toggleConnect] = useSet([]);
  const [registered, , registerAdd] = useSet(() => {
    try {
      return JSON.parse(localStorage.getItem('sg_registered') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [myTickets, setMyTickets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sg_my_tickets') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [waitlisted, setWaitlisted] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('sg_waitlisted') || '[]'));
    } catch (e) {
      return new Set();
    }
  });

  const [questEvent, setQuestEvent] = useState(null);
  const [questAnswers, setQuestAnswers] = useState({});

  useEffect(() => {
    localStorage.setItem('sg_registered', JSON.stringify(Array.from(registered)));
  }, [registered]);

  useEffect(() => {
    localStorage.setItem('sg_my_tickets', JSON.stringify(myTickets));
  }, [myTickets]);

  useEffect(() => {
    localStorage.setItem('sg_waitlisted', JSON.stringify(Array.from(waitlisted)));
  }, [waitlisted]);

  const toggleWaitlist = useCallback((id) => setWaitlisted(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  }), []);

  const register = useCallback((id, forceConfirm = false, answers = null) => {
    const runRegistrationFlow = (evObj, answers = {}) => {
      if (forceConfirm) {
        // Direct / Bypass registration
        registerAdd(id);
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
              attendee: window.ME?.name || ME.name,
              status: "confirmed"
            },
            ...prev
          ];
        });
        if (window.toast) window.toast("Joined event successfully! 🎉", "success");
        setTimeout(() => {
          go("event", evObj);
        }, 50);
        return;
      }

      const venueObj = evObj.venue_obj || {};
      const meta = venueObj.meta || {};
      const isRestricted = meta.joinEligibility === 'restricted' || evObj.registration_mode === 'restricted' || evObj.joinEligibility === 'restricted';

      const token = localStorage.getItem('token');
      fetch(`${apiBase}/api/messaging/events/${id}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(answers)
      })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          if (res.status === 'confirmed') {
            registerAdd(id);
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
                  attendee: window.ME?.name || ME.name,
                  status: "confirmed"
                },
                ...prev
              ];
            });
            if (window.toast) window.toast("Joined event successfully! 🎉", "success");
            fetchJoinedEvents();
            setTimeout(() => {
              go("event", { ...evObj, bookingStatus: 'confirmed' });
            }, 50);
          } else {
            if (window.toast) window.toast("Your request to join is pending approval.", "info");
            fetchJoinedEvents();
            setTimeout(() => {
              go("event", { ...evObj, bookingStatus: 'pending_approval' });
            }, 50);
          }
          fetchCounts();
        } else {
          if (window.toast) window.toast(res.message || "Failed to join event.", "warning");
        }
      })
      .catch(err => {
        console.error(err);
        if (!isRestricted) {
          registerAdd(id);
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
                attendee: window.ME?.name || ME.name,
                status: "confirmed"
              },
              ...prev
            ];
          });
          setTimeout(() => {
            go("event", evObj);
          }, 50);
        } else {
          if (window.toast) window.toast("Access request submitted.", "info");
        }
      });
    };

    const token = localStorage.getItem('token');
    fetch(`${apiBase}/api/events/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const ev = res.data.event;
          const normalized = {
            id: ev.id,
            title: ev.title,
            cover: ev.cover || ev.venue?.meta?.cover || "",
            date: ev.starts_at ? new Date(ev.starts_at).toLocaleDateString() : "Date TBD",
            time: ev.starts_at ? new Date(ev.starts_at).toLocaleTimeString() : "Time TBD",
            venue: ev.location_type === 'online' ? 'Online' : (ev.venue?.name || ev.venue?.address || 'Venue TBD'),
            online: ev.location_type === 'online',
            type: (ev.registration_mode === 'free' || ev.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
            price: ev.tickets?.[0] ? `₹${(ev.tickets[0].price_minor / 100).toFixed(0)}` : "Free",
            joinEligibility: ev.venue?.meta?.joinEligibility || 'public',
            registration_mode: ev.registration_mode,
            venue_obj: ev.venue,
            bookingStatus: res.data.bookingStatus
          };

           const meta = ev.venue?.meta || {};
          if (!forceConfirm && meta.enableRegForm && Array.isArray(meta.formFields) && meta.formFields.length > 0 && !answers) {
            setQuestEvent(normalized);
            setQuestAnswers({});
          } else {
            runRegistrationFlow(normalized, answers || {});
          }
        }
      })
      .catch(err => console.error("Error fetching event details for registration:", err));
  }, [registerAdd, go, apiBase, fetchCounts]);

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

  const [createdEvents, setCreatedEvents] = useState(() => []);
  const [joinedEvents, setJoinedEvents] = useState([]);

  const fetchJoinedEvents = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${apiBase}/api/events/joined`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setJoinedEvents(res.data);
        }
      })
      .catch(err => console.error('Error fetching joined events', err));
  }, [apiBase]);

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

  const st = {
    saved, toggleSave, joined, pending, toggleJoin: handleJoin, connected, toggleConnect, registered, register, city,
    myTickets, setMyTickets, waitlisted, toggleWaitlist, addClaimedTicket,
    createdEvents, setCreatedEvents, createdGroups, setCreatedGroups,
    joinedEvents, setJoinedEvents, fetchJoinedEvents,
    addCreatedEvent, addCreatedGroup,
    subscription, setSubscription,
    fetchCounts,
    chatSettings, setChatSettings
  };

  // sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    if (v === "invite") return <InviteLanding token={cur.param} go={go} />;
    if (v === "home") return <HomeFeed st={st} go={go} />;
    if (v === "discover") return <Discover st={st} go={go} param={cur.param} />;
    if (v === "events") return <MyTickets st={st} go={go} />;
    if (v === "groups") return <MyGroups st={st} go={go} param={cur.param} />;
    if (v === "event") {
      const e = cur.param || FEATURED;
      const isOwner = e.hostBy === ME.name || e.host === ME.name || e.created_by === ME.id || (st.createdEvents && st.createdEvents.some(ce => ce.id === e.id));
      const isAdmin = ME.role && ME.role.toLowerCase().includes("admin");
      const isModerator = ME.role && ME.role.toLowerCase().includes("moderator");
      
      // Check if user has a confirmed or pending booking for this event
      const joinedEntry = st.joinedEvents && st.joinedEvents.find(je => je.id === e.id);
      const bookingStatus = e.bookingStatus || joinedEntry?.bookingStatus || null;
      const hasConfirmedBooking = bookingStatus === 'confirmed';
      const hasPendingBooking = bookingStatus === 'pending_approval';
      
      const hasJoined = st.registered.has(e.id) ||
                        hasConfirmedBooking ||
                        (st.myTickets && st.myTickets.some(t => t.eventId === e.id || t.ev === e.title)) ||
                        (e.attendees && Array.isArray(e.attendees) && e.attendees.includes(ME.name)) ||
                        (typeof UPCOMING !== 'undefined' && Array.isArray(UPCOMING) && UPCOMING.some(ue => ue.id === e.id));
      const isReg = hasJoined || isOwner || isAdmin || isModerator;

      // Merge bookingStatus into the event object so EventPage and JoinEventPage can use it
      const evWithStatus = { ...e, bookingStatus };

      if (isReg) {
        return <EventPage ev={evWithStatus} st={st} go={go} />;
      } else if (hasPendingBooking) {
        // User has a pending request - show EventPage with pending state visible
        return <EventPage ev={evWithStatus} st={st} go={go} />;
      } else {
        return <JoinEventPage ev={evWithStatus} st={st} go={go} />;
      }
    }
    if (v === "group") return <GroupDetail group={cur.param} st={st} go={go} />;
    if (v === "profile") return <Profile st={st} go={go} />;
    if (v === "settings") return <SettingsPage st={st} go={go} activeTabParam={cur.param} />;
    if (v === "public-profile") return <PublicProfile profile={cur.param} go={go} socket={socket} />;
    if (v === "notifications") return <Notifications st={st} go={go} socket={socket} />;
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
    if (v === "edit-group") return <CreateGroup mode="edit" editGroup={cur.param} go={go} mobile={mobile} st={st} />;
    if (v === "event-dashboard") return <EventDashboard ev={cur.param} st={st} go={go} />;
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
    <div className={`app ${mobile?"mobile":""} ${sidebarCollapsed?"collapsed":""}`}>
      {!mobile && <Sidebar view={navKey} go={go} counts={counts} collapsed={sidebarCollapsed} onToggleCollapse={()=>setSidebarCollapsed(v=>!v)} chatSettings={chatSettings} />}
      <div className="content">
        {mobile ? <MobileTop go={go} counts={counts} city={city} chatSettings={chatSettings} />
          : <Topbar go={go} counts={counts} dark={t.dark} onToggleTheme={() => setTweak("dark", !t.dark)} city={city} onCity={() => setCityOpen(true)} chatSettings={chatSettings} />}
        {renderView()}
        {mobile && <TabBar view={cur.view} go={go} counts={counts} chatSettings={chatSettings} />}
        <CityPicker open={cityOpen} onClose={() => setCityOpen(false)} city={city} onPick={setCity} />
      </div>

      {/* Visual Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type || ''}`}
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          >
            <div className="toast-content">
              {toast.type === 'message' && <I.chat style={{ width: 16, height: 16, color: 'var(--accent-1)' }} />}
              {toast.type === 'success' && <I.check style={{ width: 16, height: 16, color: '#10b981' }} />}
              {toast.type === 'warning' && <I.warning style={{ width: 16, height: 16, color: '#f59e0b' }} />}
              {(!toast.type || toast.type === 'info') && <I.bell style={{ width: 16, height: 16, color: '#6d5efc' }} />}
              <span className="toast-msg">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
        {questEvent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 460, maxHeight: "85vh", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>Registration Questionnaire</h2>
              <button
                type="button"
                onClick={() => setQuestEvent(null)}
                style={{ border: "none", background: "var(--border-2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-2)" }}
              >
                <I.x style={{ width: 14, height: 14 }} />
              </button>
            </div>
            
            <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 8 }}>
                Please fill in the following questions to register for <strong>{questEvent.title}</strong>.
              </div>
              
              {(questEvent.venue_obj?.meta?.formFields || []).map((field) => (
                <div key={field.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {field.question || "Untitled Question"} {field.required && <span style={{ color: "red" }}>*</span>}
                  </label>
                  
                  {field.type === "text" && (
                    <input
                      className="cinput"
                      placeholder={field.responseType === "paragraph" ? "Long answer..." : "Short answer..."}
                      value={questAnswers[field.id] || ""}
                      onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  )}

                  {field.type === "options" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {(field.options || []).map((opt, oIdx) => (
                        <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
                          <input
                            type={field.selectionType === "multiple" ? "checkbox" : "radio"}
                            name={`q-${field.id}`}
                            checked={
                              field.selectionType === "multiple"
                                ? (questAnswers[field.id] || []).includes(opt)
                                : questAnswers[field.id] === opt
                            }
                            onChange={(e) => {
                              if (field.selectionType === "multiple") {
                                const cur = questAnswers[field.id] || [];
                                const next = e.target.checked ? [...cur, opt] : cur.filter(x => x !== opt);
                                setQuestAnswers(prev => ({ ...prev, [field.id]: next }));
                              } else {
                                setQuestAnswers(prev => ({ ...prev, [field.id]: opt }));
                              }
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "social" && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, background: "var(--border)", padding: "4px 8px", borderRadius: 4, color: "var(--ink-2)" }}>
                        {field.platform === "any" ? "URL" : field.platform.toUpperCase()}
                      </span>
                      <input
                        className="cinput"
                        placeholder="Profile URL..."
                        value={questAnswers[field.id] || ""}
                        onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                    </div>
                  )}

                  {field.type === "company" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        className="cinput"
                        placeholder="Company Name"
                        value={questAnswers[field.id]?.company || ""}
                        onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: { ...prev[field.id], company: e.target.value } }))}
                      />
                      {field.collectJobTitle && (
                        <input
                          className="cinput"
                          placeholder="Job Title"
                          value={questAnswers[field.id]?.title || ""}
                          onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: { ...prev[field.id], title: e.target.value } }))}
                        />
                      )}
                    </div>
                  )}

                  {field.type === "checkbox" && (
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!questAnswers[field.id]}
                        onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: e.target.checked }))}
                      />
                      <span>{field.question || "Tick this box"}</span>
                    </label>
                  )}

                  {field.type === "terms" && (
                    <div style={{ padding: 10, background: "var(--bg-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 12, color: "var(--ink-2)", whiteSpace: "pre-wrap", marginBottom: 6 }}>{field.termsText}</div>
                      {field.termsLinks && (
                        <a href={field.termsLinks} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--accent-2)", textDecoration: "underline", display: "block", marginBottom: 8 }}>
                          View Terms Link
                        </a>
                      )}
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={!!questAnswers[field.id]}
                          onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: e.target.checked }))}
                        />
                        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>I accept the terms</span>
                      </label>
                    </div>
                  )}

                  {field.type === "phone" && (
                    <input
                      className="cinput"
                      placeholder="+91..."
                      value={questAnswers[field.id] || ""}
                      onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  )}

                  {field.type === "website" && (
                    <input
                      className="cinput"
                      placeholder="https://..."
                      value={questAnswers[field.id] || ""}
                      onChange={(e) => setQuestAnswers(prev => ({ ...prev, [field.id]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, justifyContent: "flex-end", background: "var(--bg-2)" }}>
              <button className="hbtn hbtn--ghost" onClick={() => setQuestEvent(null)}>Cancel</button>
              <button
                className="hbtn hbtn--primary"
                onClick={() => {
                  const fields = questEvent.venue_obj?.meta?.formFields || [];
                  for (const f of fields) {
                    if (f.required) {
                      const val = questAnswers[f.id];
                      if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'object' && !val.company)) {
                        if (window.toast) window.toast(`Please answer all required questions.`, "warning");
                        return;
                      }
                    }
                  }
                  const answersCopy = { ...questAnswers };
                  setQuestEvent(null);
                  setQuestAnswers({});
                  register(questEvent.id, false, answersCopy);
                }}
              >
                Submit & Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
