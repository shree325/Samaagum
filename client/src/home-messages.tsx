// @ts-nocheck
/* ============================================================
   Samaagum Home — Messages, connections (DMs, upward, requests)
   ============================================================ */

function Messages({ st, go, mobile, socket }) {
  const [seg, setSeg] = useState("messages");
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showConv, setShowConv] = useState(!mobile); // mobile: list first
  const [input, setInput] = useState("");
  const [presenceMap, setPresenceMap] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [menuMsgId, setMenuMsgId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const checkCommonGroupOrEvent = (otherUser) => {
    if (!otherUser) return false;
    const cleanOtherName = (otherUser.name || "").toLowerCase().trim();
    if (!cleanOtherName) return false;

    const isSameUserByName = (n1, n2) => {
      if (!n1 || !n2) return false;
      const p1 = n1.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean)[0];
      const p2 = n2.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean)[0];
      return p1 === p2;
    };

    // Check Groups: other user is in a group that I have joined or created
    const commonGroup = (window.GROUPS || []).some(g => {
      const userJoined = st.joined && st.joined.has(g.id);
      const userCreated = st.createdGroups && st.createdGroups.some(cg => cg.id === g.id);
      const meInGroup = userJoined || userCreated || g.owner?.toLowerCase().includes("aanya");
      
      if (!meInGroup) return false;

      const membersList = g.memberNames || [];
      return membersList.some(m => {
        const mName = typeof m === 'object' ? m.name : m;
        return isSameUserByName(mName, cleanOtherName);
      });
    });

    if (commonGroup) return true;

    // Check Events: other user is in an event that I am registered for
    const commonEvent = (window.EVENTS || []).some(e => {
      const userReg = st.registered && st.registered.has(e.id);
      const userWaitlist = st.waitlisted && st.waitlisted.has(e.id);
      const meInEvent = userReg || userWaitlist;

      if (!meInEvent) return false;

      const hostName = e.hostBy || e.host || "";
      if (isSameUserByName(hostName, cleanOtherName)) return true;

      const attendeesList = e.attendees || [];
      return attendeesList.some(a => isSameUserByName(a, cleanOtherName));
    });

    if (commonEvent) return true;

    return false;
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const delayDebounceFn = setTimeout(() => {
      fetch(`${apiBase}/api/messaging/users/search?q=${encodeURIComponent(searchQuery)}`, { headers })
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            setSearchResults(res.data);
          }
        })
        .catch(err => console.error("Error searching users:", err));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, apiBase]);

  const selectSearchResult = (user) => {
    const token = localStorage.getItem('token');
    const headers = { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    fetch(`${apiBase}/api/messaging/conversations/direct`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetId: user.id })
    })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const conv = res.data;
          setThreads(prev => {
            if (prev.some(t => t.id === conv.id)) return prev;
            return [conv, ...prev];
          });
          setActiveId(conv.id);
          setSearchQuery("");
          setShowConv(true);
        }
      })
      .catch(err => console.error("Error creating direct conversation:", err));
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setMenuMsgId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  const getActiveUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.id || null;
    } catch (e) {
      return null;
    }
  };

  const currentUserId = getActiveUserId();

  // 1. Fetch conversations/threads on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(`${apiBase}/api/messaging/conversations`, { headers })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setThreads(res.data);
          const savedConvId = localStorage.getItem('active_chat_conv_id');
          if (savedConvId && res.data.some(t => t.id === savedConvId)) {
            setActiveId(savedConvId);
            localStorage.removeItem('active_chat_conv_id');
          } else if (res.data.length > 0) {
            setActiveId(res.data[0].id);
          }
        }
      })
      .catch(err => {
        console.error("Error fetching conversations:", err);
        setThreads([]);
      });
  }, [apiBase]);

  // 2. Fetch presence of participants dynamically on thread list load/refresh
  useEffect(() => {
    const fetchPresence = () => {
      const threadUserIds = threads.flatMap(t => t.participants?.map(p => p.userId) || []);
      const searchUserIds = searchResults.map(r => r.id);
      const userIds = Array.from(new Set([...threadUserIds, ...searchUserIds])).filter(uid => uid !== currentUserId);

      if (userIds.length === 0) return;

      fetch(`${apiBase}/api/test/presence/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds })
      })
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            const map = {};
            res.data.forEach(p => {
              map[p.userId] = p.status;
            });
            setPresenceMap(map);
          }
        })
        .catch(err => console.error("Error fetching batch presence:", err));
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, 4000);
    return () => clearInterval(interval);
  }, [threads, searchResults, currentUserId, apiBase]);

  // Find active thread
  const active = threads.find(t => t.id === activeId);

  // 3. Fetch thread messages and join socket room on active thread change
  useEffect(() => {
    if (!activeId) return;

    // Join WebSockets room
    if (socket) {
      socket.emit("conversation.join", { conversationId: activeId }, (ack) => {
        if (ack && !ack.success) {
          console.error("Failed to join WebSockets room:", ack.error);
        }
      });
      // Mark messages as read/seen on open
      socket.emit("conversation.read", { conversationId: activeId });
    }

    // Load message logs from API
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch(`${apiBase}/api/messaging/conversations/${activeId}/messages?limit=100`, { headers })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setMessages(res.data);
        } else {
          // Fallback mockup messages
          const fallbackThread = THREADS.find(t => t.id === activeId);
          setMessages(fallbackThread ? fallbackThread.msgs.map(m => ({
            id: Math.random().toString(),
            body: m.text,
            content: m.text,
            senderId: m.me ? currentUserId : "them",
            createdAt: new Date().toISOString()
          })) : []);
        }
      })
      .catch(err => {
        console.error("Error fetching messages:", err);
        const fallbackThread = THREADS.find(t => t.id === activeId);
        setMessages(fallbackThread ? fallbackThread.msgs.map(m => ({
          id: Math.random().toString(),
          body: m.text,
          content: m.text,
          senderId: m.me ? currentUserId : "them",
          createdAt: new Date().toISOString()
        })) : []);
      });
  }, [activeId, socket, apiBase, currentUserId]);

  // 4. Listen for live incoming socket messages, updates and deletions
  useEffect(() => {
    if (!socket) return;

    const handleMessageCreated = (msg) => {
      if (msg.conversationId === activeId) {
        // Immediately mark message as read if we are looking at this conversation
        if (msg.senderId !== currentUserId) {
          socket.emit("conversation.read", { conversationId: activeId });
        }

        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;

          let status = msg.status || 0;
          const receipts = msg.receipts || [];
          const otherReceipts = receipts.filter(r => r.userId !== msg.senderId);
          if (otherReceipts.length > 0) {
            const hasSeen = otherReceipts.some(r => r.seenAt !== null);
            const hasDelivered = otherReceipts.some(r => r.deliveredAt !== null);
            if (hasSeen) {
              status = 2;
            } else if (hasDelivered) {
              status = 1;
            }
          }

          return [...prev, {
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            body: msg.body || msg.content,
            content: msg.content || msg.body,
            createdAt: msg.createdAt,
            status,
            receipts
          }];
        });
      }

      setThreads(prevThreads => prevThreads.map(t => {
        if (t.id === msg.conversationId) {
          return {
            ...t,
            preview: msg.body || msg.content,
            updatedAt: msg.createdAt
          };
        }
        return t;
      }));
    };

    const handleMessageUpdated = (msg) => {
      if (msg.conversationId === activeId) {
        setMessages(prev => prev.map(m => {
          if (m.id === msg.id) {
            return {
              ...m,
              body: msg.content,
              content: msg.content,
              isEdited: true,
              updatedAt: msg.updatedAt
            };
          }
          return m;
        }));
      }
    };

    const handleMessageDeleted = (msg) => {
      if (msg.conversationId === activeId) {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
      }
    };

    const handleReceiptUpdated = (updates) => {
      setMessages(prev => prev.map(m => {
        const relevant = updates.filter(u => u.messageId === m.id);
        if (relevant.length === 0) return m;

        const currentReceipts = [...(m.receipts || [])];
        for (const u of relevant) {
          const idx = currentReceipts.findIndex(r => r.userId === u.userId);
          if (idx >= 0) {
            currentReceipts[idx] = {
              userId: u.userId,
              deliveredAt: u.deliveredAt,
              seenAt: u.seenAt
            };
          } else {
            currentReceipts.push({
              userId: u.userId,
              deliveredAt: u.deliveredAt,
              seenAt: u.seenAt
            });
          }
        }

        let status = m.status || 0;
        const otherReceipts = currentReceipts.filter(r => r.userId !== m.senderId);
        if (otherReceipts.length > 0) {
          const hasSeen = otherReceipts.some(r => r.seenAt !== null);
          const hasDelivered = otherReceipts.some(r => r.deliveredAt !== null);
          if (hasSeen) {
            status = 2;
          } else if (hasDelivered) {
            status = 1;
          }
        }

        return {
          ...m,
          status,
          receipts: currentReceipts
        };
      }));
    };

    socket.on("message.created", handleMessageCreated);
    socket.on("message.updated", handleMessageUpdated);
    socket.on("message.deleted", handleMessageDeleted);
    socket.on("receipt.updated", handleReceiptUpdated);

    return () => {
      socket.off("message.created", handleMessageCreated);
      socket.off("message.updated", handleMessageUpdated);
      socket.off("message.deleted", handleMessageDeleted);
      socket.off("receipt.updated", handleReceiptUpdated);
    };
  }, [socket, activeId]);

  const openThread = (id) => { setActiveId(id); setShowConv(true); };
  
  const send = () => { 
    if (!input.trim() || !activeId) return; 
    
    const currentInput = input;
    setInput(""); 

    if (socket) {
      socket.emit("message.send", { conversationId: activeId, content: currentInput }, (ack) => {
        if (ack && !ack.success) {
          console.error("Message send failed:", ack.error);
          setInput(currentInput);
        }
      });
    } else {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        body: currentInput,
        content: currentInput,
        senderId: currentUserId,
        createdAt: new Date().toISOString()
      }]);
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditVal(msg.body || msg.content || "");
  };

  const saveEdit = () => {
    if (!editVal.trim() || !editingId) return;
    if (socket) {
      socket.emit("message.edit", { messageId: editingId, content: editVal }, (ack) => {
        if (ack && !ack.success) {
          alert("Failed to edit: " + ack.error);
        }
      });
    }
    setEditingId(null);
    setEditVal("");
  };

  const deleteMsg = (messageId) => {
    if (confirm("Delete this message for everyone?")) {
      if (socket) {
        socket.emit("message.delete", { messageId }, (ack) => {
          if (ack && !ack.success) {
            alert("Failed to delete: " + ack.error);
          }
        });
      }
    }
  };

  const copyMsgText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log("Text copied to clipboard");
    }).catch(err => {
      console.error("Failed to copy:", err);
    });
  };

  return (
    <div className="msg-layout">
      <div className={`msg-list ${mobile && showConv ? "hide-m":""}`}>
        <div className="msg-list-head" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2>Messages</h2>
          <div className="msg-search-box" style={{ position: "relative", width: "100%", padding: "0" }}>
            <I.search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--ink-3)" }} />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 16px 8px 36px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: "var(--field)",
                color: "var(--ink)",
                outline: "none",
                fontSize: "13.5px"
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-3)",
                  padding: 4
                }}
              >
                <I.x style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
          <div className="msg-seg">
            <button className={seg==="messages"?"on":""} onClick={()=>setSeg("messages")}>Chats</button>
            <button className={seg==="requests"?"on":""} onClick={()=>setSeg("requests")}>Requests <span style={{ color:"var(--accent-1)" }}>{REQUESTS.length}</span></button>
          </div>
        </div>
        <div className="msg-threads">
          {searchQuery.trim() ? (() => {
            const contactUserIds = new Set(
              threads
                .filter(t => t.type === "DIRECT" || t.type === "dm")
                .flatMap(t => t.participants || [])
                .map(p => p.userId)
                .filter(uid => uid !== currentUserId)
            );
            const searchedContacts = searchResults.filter(user => contactUserIds.has(user.id));
            const searchedMoreAccounts = searchResults.filter(user => !contactUserIds.has(user.id));
            
            return (
              <div className="search-results-section" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 4px" }}>
                {searchedContacts.length > 0 && (
                  <>
                    <div className="search-group-title" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--ink-3)", margin: "8px 12px 4px" }}>Contacts</div>
                    {searchedContacts.map(user => (
                      <div key={user.id} className="search-item" onClick={() => selectSearchResult(user)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "8px", cursor: "pointer" }}>
                        <div style={{ position: "relative" }}>
                          <Avatar name={user.name || "null"} size={40} />
                          <span className="search-presence-dot" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[user.id] === "ONLINE" ? "#2bb673" : "#8e8e93", border: "2px solid var(--surface)" }} />
                        </div>
                        <div className="info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="name" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{user.name === null ? "null" : user.name}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {searchedMoreAccounts.length > 0 && (
                  <>
                    <div className="search-group-title" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--ink-3)", margin: "16px 12px 4px" }}>More Accounts</div>
                    {searchedMoreAccounts.map(user => (
                      <div key={user.id} className="search-item" onClick={() => selectSearchResult(user)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "8px", cursor: "pointer" }}>
                        <div style={{ position: "relative" }}>
                          <Avatar name={user.name || "null"} size={40} />
                          <span className="search-presence-dot" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[user.id] === "ONLINE" ? "#2bb673" : "#8e8e93", border: "2px solid var(--surface)" }} />
                        </div>
                        <div className="info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="name" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{user.name === null ? "null" : user.name}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {searchResults.length === 0 && (
                  <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13, marginTop: 20 }}>No users found</div>
                )}
              </div>
            );
          })() : (
            seg==="messages" ? (
              threads.length > 0 ? threads.map(t => {
                const other = t.participants?.find(p => p.userId !== currentUserId);
                const displayName = t.type === "GROUP" ? (t.title || "Group Chat") : (other?.name || "Chat Room");
                const timeStr = t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (t.time || "");
                const presenceStatus = other ? (presenceMap[other.userId] || "OFFLINE") : "OFFLINE";
                return (
                  <div key={t.id} className={`thread ${t.id===activeId && !mobile?"on":""}`} onClick={()=>openThread(t.id)}>
                    <div className="av" style={{ background:"transparent" }}>
                      <Avatar name={displayName} size={46}/>
                      <span className={presenceStatus === "ONLINE" ? "online" : "offline"}/>
                    </div>
                    <div className="ti">
                      <div className="tr1">
                        <span className="nm">{displayName}</span>
                        <span className="tm">{timeStr}</span>
                      </div>
                      <div className="pv">{t.preview}</div>
                      {t.connected === false && <div style={{ fontSize:11, color:"var(--accent-2)", marginTop:3, display:"flex", alignItems:"center", gap:4 }}><I.users style={{width:11,height:11}}/>via {t.context}</div>}
                    </div>
                    {t.unread>0 && <span className="unreadc">{t.unread}</span>}
                  </div>
                );
              }) : (
                <div style={{ textAlign: "center", color: "var(--ink-3)", padding: "40px 20px", fontSize: "13.5px", lineHeight: "1.5" }}>
                  No chats yet.<br />Search for people above to start a conversation!
                </div>
              )
            ) : (
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
          )
        )}
        </div>
      </div>

      {(!mobile || showConv) && active && (() => {
        const other = active.participants?.find(p => p.userId !== currentUserId);
        const displayName = active.type === "GROUP" ? (active.title || "Group Chat") : (other?.name || "Chat Room");
        const presenceStatus = other ? (presenceMap[other.userId] || "OFFLINE") : "OFFLINE";
        const firstName = displayName.split(" ")[0];

        const chatSettings = st.chatSettings || {
          allowDirectMessaging: true,
          allowGroupChat: true,
          allowEventChat: true
        };
        const isDM = active.type === "DIRECT" || active.type === "dm" || !active.type;
        const isDMRestricted = isDM && chatSettings.allowDirectMessaging === false;
        const shareCommon = other ? checkCommonGroupOrEvent(other) : false;
        const hideCompose = isDMRestricted && !shareCommon;

        return (
          <div className="msg-conv">
            <div className="conv-head">
              {mobile && <button className="hbtn hbtn--ghost hbtn--sm" style={{ padding:"7px 10px" }} onClick={()=>setShowConv(false)}><I.arrowL/></button>}
              <div style={{ position:"relative" }}>
                <Avatar name={displayName} size={40}/>
                <span className={presenceStatus === "ONLINE" ? "online" : "offline"} style={{ position:"absolute", bottom:0, right:0, width:11, height:11, borderRadius:"50%", background: presenceStatus === "ONLINE" ? "#2bb673" : "#8e8e93", border:"2px solid var(--surface)" }}/>
              </div>
              <div className="ci">
                <div className="n">{displayName}</div>
                <div className="s">
                  {presenceStatus === "ONLINE" && "Online"}
                  {presenceStatus === "RECENTLY_ONLINE" && "Recently Online"}
                  {presenceStatus === "OFFLINE" && "Offline"}
                </div>
              </div>
              <div className="cact">
                <button className="tb-icon" style={{ width:36, height:36 }}><I.phone/></button>
                <button className="tb-icon" style={{ width:36, height:36 }}><I.more/></button>
              </div>
            </div>

            {active.connected === false && (
              <div className="conn-banner" style={{ marginTop:14 }}>
                <I.users/> You can message {firstName} because you're both in <b style={{ marginLeft:3 }}>{active.context || "same group"}</b>. Send a connection request to chat anytime.
              </div>
            )}

            <div className="conv-scroll">
              <div className="conv-date">Today</div>
              {messages.map((m, i) => {
                const isMe = m.senderId === currentUserId || m.senderId === "me" || m.me === true;
                const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "now";
                
                // Time checks: 3 mins for edit, 5 mins for delete
                const ageMs = m.createdAt ? (Date.now() - new Date(m.createdAt).getTime()) : 0;
                const canEdit = isMe && ageMs < 180000;
                const canDelete = isMe && ageMs < 300000;
                const isEditing = m.id === editingId;

                return (
                  <div key={m.id || i} className={`msg-row ${isMe ? "me" : "them"}`}>
                    {/* Hover Actions */}
                    {!isEditing && (
                      <div className="hover-actions">
                        <button 
                          className="hover-action-btn" 
                          data-tooltip="More"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuMsgId(prev => prev === m.id ? null : m.id);
                          }}
                        >
                          <I.moreV style={{ width: 16, height: 16 }} />
                          {menuMsgId === m.id && (
                            <div className="msg-menu" onClick={(e) => e.stopPropagation()}>
                              <div className="msg-menu-header">
                                {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <button className="msg-menu-item" onClick={() => alert("Forward functionality is not available yet")}>
                                <span>Forward</span>
                                <I.forward style={{ width: 14, height: 14 }} />
                              </button>
                              <button className="msg-menu-item" onClick={() => { copyMsgText(m.body || m.content); setMenuMsgId(null); }}>
                                <span>Copy</span>
                                <I.copy style={{ width: 14, height: 14 }} />
                              </button>
                              {isMe && (
                                <button 
                                  className="msg-menu-item" 
                                  disabled={!canEdit} 
                                  onClick={() => { startEdit(m); setMenuMsgId(null); }}
                                >
                                  <span>Edit</span>
                                  <I.edit style={{ width: 14, height: 14 }} />
                                </button>
                              )}
                              {isMe && (
                                <button 
                                  className="msg-menu-item danger" 
                                  disabled={!canDelete} 
                                  onClick={() => { deleteMsg(m.id); setMenuMsgId(null); }}
                                >
                                  <span>Unsend</span>
                                  <I.unsend style={{ width: 14, height: 14 }} />
                                </button>
                              )}
                            </div>
                          )}
                        </button>
                        <button className="hover-action-btn" data-tooltip="Reply" onClick={() => console.log("Reply to:", m.id)}>
                          <I.reply style={{ width: 14, height: 14 }} />
                        </button>
                        <button className="hover-action-btn" data-tooltip="React" onClick={() => console.log("React to:", m.id)}>
                          <I.react style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`bubble ${isMe ? "me" : "them"}`}>
                      {isEditing ? (
                        <div className="edit-box" style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150 }}>
                          <input 
                            value={editVal} 
                            onChange={e => setEditVal(e.target.value)} 
                            onKeyDown={e => e.key === "Enter" && saveEdit()}
                            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 4, width: "100%" }}
                          />
                          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                            <button onClick={() => setEditingId(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "2px 6px", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                            <button onClick={saveEdit} style={{ background: "var(--accent-1)", border: "none", color: "#fff", padding: "2px 6px", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-body">{m.body || m.content}</div>
                          <div className="btime" style={{ margin: "4px 0 0 0", display: "flex", alignItems: "center", justifyContent: isMe ? "flex-end" : "flex-start", gap: 4 }}>
                            <span>{timeStr}</span>
                            {m.isEdited && <span className="edited-badge" style={{ opacity: 0.7, fontStyle: "italic" }}>(edited)</span>}
                            {isMe && (
                              <span className="ticks" style={{ display: "inline-flex", alignItems: "center" }}>
                                {m.status === 2 && (
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#3498db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                    <polyline points="22 9 13.5 17.5 10 14" />
                                  </svg>
                                )}
                                {m.status === 1 && (
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#8e8e93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                    <polyline points="22 9 13.5 17.5 10 14" />
                                  </svg>
                                )}
                                {m.status === 0 && (
                                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#8e8e93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hideCompose ? (
              <div className="dm-restricted-banner" style={{
                padding: "20px",
                margin: "15px",
                background: "var(--surface-2)",
                border: "1px dashed var(--border)",
                borderRadius: "12px",
                color: "var(--ink-2)",
                fontSize: "13.5px",
                lineHeight: "1.5",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px"
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div>
                  <strong>Direct messaging is disabled.</strong><br/>
                  You can only message users you share a common group or event with.
                </div>
              </div>
            ) : (
              <div className="conv-compose">
                <input 
                  placeholder={`Message ${firstName}…`} 
                  value={input} 
                  onChange={e=>setInput(e.target.value)} 
                  onKeyDown={e=>e.key==="Enter"&&send()} 
                />
                <button className="send" onClick={send}><I.send/></button>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

Object.assign(window, { Messages });
