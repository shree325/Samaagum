// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { EVENTS, Mark } from './components';
import { GROUPS, THREADS } from './home-data';
import { Avatar, useProfileSync } from './home-icons';
import { Profile } from './home-profile';
import { apiBase } from './home-subscription';
import { I } from './home-icons';
import { Events } from './landing-features';
import { messagingApi } from './api/messaging-client';

/* ============================================================
   Samaagum Home — Messages, connections (DMs, upward, requests)
   ============================================================ */

export function ProfileName({ userId, name }) {
  const p = I.useProfileSync ? I.useProfileSync(userId, { name }) : { name };
  return <>{p.name || "null"}</>;
}

export function Messages({ st, go, mobile, socket }) {
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [forwardSearch, setForwardSearch] = useState("");

  const scrollRef = useRef(null);
  const prevActiveIdRef = useRef(null);
  const prevMsgLengthRef = useRef(0);

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

  useEffect(() => {
    if (!scrollRef.current) return;

    const isSameThread = prevActiveIdRef.current === activeId;
    const msgLength = messages ? messages.length : 0;
    const isNewMessage = isSameThread && msgLength > prevMsgLengthRef.current;

    if (isNewMessage) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      const firstUnread = messages.find(m =>
        m.senderId !== currentUserId &&
        m.senderId !== 'me' &&
        !m.me &&
        !(m.receipts || []).some(r => r.userId === currentUserId && r.seenAt !== null)
      );

      if (firstUnread) {
        setTimeout(() => {
          const element = document.getElementById(`msg-item-${firstUnread.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'start' });
          } else if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 0);
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }

    prevActiveIdRef.current = activeId;
    prevMsgLengthRef.current = msgLength;
  }, [activeId, messages, currentUserId]);

  useEffect(() => {
    const handleFocus = () => {
      if (activeId && socket) {
        socket.emit("conversation.read", { conversationId: activeId }, () => {
          fetchConversations();
          if (st.fetchCounts) st.fetchCounts();
        });
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [activeId, socket, fetchConversations]);

  const [requestStatuses, setRequestStatuses] = useState({});
  const [contactsList, setContactsList] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [connectedUserIds, setConnectedUserIds] = useState(new Set());

  // Sync the currently active conversation ID to window so the shell's socket handler can check it
  useEffect(() => {

    return () => {

    };
  }, [activeId]);

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

    const controller = new AbortController();

    const delayDebounceFn = setTimeout(() => {
      messagingApi.searchUsers(searchQuery, controller.signal)
        .then(res => {
          if (res.success && res.data) {
            setSearchResults(res.data);
            res.data.forEach(user => {
              messagingApi.getRequestStatus(user.id)
                .then(rJson => {
                  if (rJson.success && rJson.data) {
                    setRequestStatuses(prev => ({ ...prev, [user.id]: rJson.data.status }));
                  }
                })
                .catch(e => {
                  if (e.name !== 'AbortError') {
                    console.error("Error fetching request status:", e);
                  }
                });
            });
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            console.error("Error searching users:", err);
          }
        });
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [searchQuery]);

  const handleConnectUser = (user, e) => {
    if (e) e.stopPropagation();

    messagingApi.getOrCreateDirectConversation({ targetId: user.id })
      .then(res => {
        const conv = res.data;
        setThreads(prev => {
          if (prev.some(t => t.id === conv.id)) return prev;
          return [conv, ...prev];
        });
        setActiveId(conv.id);
        setSearchQuery("");
        setShowConv(true);
        setRequestStatuses(prev => ({ ...prev, [user.id]: 'CONNECTED' }));
      })
      .catch(err => {
        if (err.status === 403 && err.details?.restriction === 'approval_required') {
          if (err.details.hasPending) {
            if (window.toast) window.toast("Messaging request is already pending.");
            else alert("Messaging request is already pending.");
            setRequestStatuses(prev => ({ ...prev, [user.id]: 'PENDING' }));
            return;
          }
          messagingApi.sendMessageRequest({ targetId: user.id })
            .then(rData => {
              if (rData.success) {
                setRequestStatuses(prev => ({ ...prev, [user.id]: 'PENDING' }));
                if (window.toast) window.toast("Messaging request sent!");
                else alert("Messaging request sent!");
              } else {
                alert(rData.error || "Failed to send request.");
              }
            })
            .catch(reqErr => {
              alert(reqErr.message || "Failed to send request.");
            });
        } else if (err.status === 403 && err.details?.restriction === 'only_connected') {
          if (window.toast) window.toast("This user only allows messaging from connected users.");
          else alert("This user only allows messaging from connected users.");
          go("public-profile", user);
        } else {
          alert(err.message || "Connection failed.");
        }
      });
  };

  const selectSearchResult = (user) => {
    messagingApi.getOrCreateDirectConversation({ targetId: user.id })
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
      .catch(err => {
        if (err.status === 403) {
          const data = err.details;
          if (data?.restriction === 'only_connected') {
            if (window.toast) window.toast("This user only allows messaging from connected users.");
            else alert("This user only allows messaging from connected users.");
            go("public-profile", user);
          } else if (data?.restriction === 'no_one') {
            if (window.toast) window.toast("This user has disabled direct messages.");
            else alert("This user has disabled direct messages.");
          } else {
            alert(data?.error || "Unable to start messaging.");
          }
        } else {
          console.error("Error creating direct conversation:", err);
        }
      });
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setMenuMsgId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";



  const [requests, setRequests] = useState([]);

  const fetchIncomingRequests = () => {
    messagingApi.getIncomingRequests()
      .then(res => {
        if (res.success && res.data) {
          setRequests(res.data);
        }
      })
      .catch(err => console.error("Error fetching incoming requests:", err));
  };

  const handleAcceptRequest = (reqId) => {
    messagingApi.acceptRequest(reqId)
      .then(res => {
        if (res.success) {
          if (window.toast) window.toast("Messaging request accepted!");
          fetchIncomingRequests();
          fetchConversations();
          if (st.fetchCounts) st.fetchCounts();
        }
      })
      .catch(err => console.error("Error accepting request:", err));
  };

  const handleDeclineRequest = (reqId) => {
    messagingApi.declineRequest(reqId)
      .then(res => {
        if (res.success) {
          if (window.toast) window.toast("Messaging request declined.");
          fetchIncomingRequests();
          if (st.fetchCounts) st.fetchCounts();
        }
      })
      .catch(err => console.error("Error declining request:", err));
  };

  function fetchConversations() {
    messagingApi.getConversations()
      .then(res => {
        if (res.success && res.data) {
          setThreads(res.data);
          if (res.data.length > 0 && !activeId) {
            const savedConvId = localStorage.getItem('active_chat_conv_id');
            if (savedConvId && res.data.some(t => t.id === savedConvId)) {
              setActiveId(savedConvId);
              localStorage.removeItem('active_chat_conv_id');
            }
          }
        }
      })
      .catch(err => {
        console.error("Error fetching conversations:", err);
        setThreads([]);
      });
  };

  const fetchConnectedUserIds = async () => {
    if (!currentUserId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/connections/network/${currentUserId}?limit=1000`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const ids = new Set([
          ...(data.data.mutual || []),
          ...(data.data.new || [])
        ].filter(u => u.connectionState === 'accepted').map(u => u.userId));
        setConnectedUserIds(ids);
      }
    } catch (err) {
      console.error("Error fetching connected IDs:", err);
    }
  };

  const fetchContactsList = async () => {
    if (!currentUserId) return;
    setContactsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/connections/network/${currentUserId}?limit=100`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const list = [
          ...(data.data.mutual || []),
          ...(data.data.new || [])
        ].filter(u => u.userId !== currentUserId && u.connectionState === 'accepted');
        setContactsList(list);
      }
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchConnectedUserIds();
    if (seg === "contacts") {
      fetchContactsList();
    }
  }, [apiBase, seg]);

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
      socket.emit("conversation.read", { conversationId: activeId }, () => {
        fetchConversations();
        if (st.fetchCounts) st.fetchCounts();
      });
    }

    // Load message logs from API
    messagingApi.getConversationMessages(activeId, { limit: 100 })
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
  }, [activeId, socket, currentUserId]);

  // 4. Listen for live incoming socket messages, updates and deletions
  useEffect(() => {
    if (!socket) return;

    const handleMessageCreated = (msg) => {
      if (msg.conversationId === activeId) {
        // Immediately mark message as read if we are looking at this conversation
        if (msg.senderId !== currentUserId) {
          socket.emit("conversation.read", { conversationId: activeId }, () => {
            fetchConversations();
            if (st.fetchCounts) st.fetchCounts();
          });
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
            replyTo: msg.replyTo,
            replyToMessageId: msg.replyToMessageId,
            receipts
          }];
        });
      }

      setThreads(prevThreads => prevThreads.map(t => {
        if (t.id === msg.conversationId) {
          const isWindowFocused = typeof document !== 'undefined' ? document.hasFocus() : true;
          const isUnread = msg.senderId !== currentUserId && (msg.conversationId !== activeId || !isWindowFocused);
          return {
            ...t,
            preview: msg.body || msg.content,
            updatedAt: msg.createdAt,
            unread: isUnread ? (t.unread || 0) + 1 : 0
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

    const handleRequestReceived = (req) => {
      setRequests(prev => {
        if (prev.some(r => r.id === req.id)) return prev;
        return [req, ...prev];
      });
      if (st.fetchCounts) st.fetchCounts();
    };

    const handleRequestAccepted = (payload) => {
      fetchConversations();
      fetchIncomingRequests();
      if (st.fetchCounts) st.fetchCounts();
    };

    const handleRequestDeclined = (payload) => {
      fetchIncomingRequests();
      if (st.fetchCounts) st.fetchCounts();
    };
    const handlePresenceUpdated = (payload) => {
      if (payload && payload.userId) {
        setPresenceMap(prev => ({
          ...prev,
          [payload.userId]: payload.status
        }));
      }
    };

    const handleProfileUpdated = (payload) => {
      if (payload && payload.userId && payload.messagingRestriction !== undefined) {
        setThreads(prev => prev.map(t => ({
          ...t,
          participants: t.participants?.map(p => {
            if (p.userId === payload.userId || p.id === payload.userId) {
              return { ...p, messagingRestriction: payload.messagingRestriction };
            }
            return p;
          })
        })));
      }
    };

    socket.on("message.created", handleMessageCreated);
    socket.on("message.updated", handleMessageUpdated);
    socket.on("message.deleted", handleMessageDeleted);
    socket.on("receipt.updated", handleReceiptUpdated);
    socket.on("request.received", handleRequestReceived);
    socket.on("request.accepted", handleRequestAccepted);
    socket.on("request.declined", handleRequestDeclined);
    socket.on("presence.updated", handlePresenceUpdated);
    socket.on("profile.updated", handleProfileUpdated);

    return () => {
      socket.off("message.created", handleMessageCreated);
      socket.off("message.updated", handleMessageUpdated);
      socket.off("message.deleted", handleMessageDeleted);
      socket.off("receipt.updated", handleReceiptUpdated);
      socket.off("request.received", handleRequestReceived);
      socket.off("request.accepted", handleRequestAccepted);
      socket.off("request.declined", handleRequestDeclined);
      socket.off("presence.updated", handlePresenceUpdated);
      socket.off("profile.updated", handleProfileUpdated);
    };
  }, [socket, activeId]);

  const openThread = (id) => { setActiveId(id); setShowConv(true); };

  const send = () => {
    if (!input.trim() || !activeId) return;

    const currentInput = input;
    const parentId = replyingTo?.id;
    setInput("");
    setReplyingTo(null);

    if (socket) {
      socket.emit("message.send", { conversationId: activeId, content: currentInput, replyToMessageId: parentId }, (ack) => {
        if (ack && !ack.success) {
          console.error("Message send failed:", ack.error);
          if (ack.error === "This user has disabled direct messages.") {
            setThreads(prev => prev.map(t => {
              if (t.id === activeId) {
                return {
                  ...t,
                  participants: t.participants.map(p => {
                    if (p.userId !== currentUserId && p.id !== currentUserId) {
                      return { ...p, messagingRestriction: 'no_one' };
                    }
                    return p;
                  })
                };
              }
              return t;
            }));
          } else {
            setInput(currentInput);
          }
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
      <div className={`msg-list ${mobile && showConv ? "hide-m" : ""}`}>
        <div className="msg-list-head" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2>Messages</h2>
          <div className="msg-search-box" style={{ position: "relative", width: "100%", padding: "0", boxSizing: "border-box" }}>
            <I.search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "var(--ink-3)" }} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
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
            <button className={seg === "messages" ? "on" : ""} onClick={() => setSeg("messages")}>Chats</button>
            <button className={seg === "contacts" ? "on" : ""} onClick={() => setSeg("contacts")}>Contacts</button>
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
            const searchedConnected = searchResults.filter(user => !contactUserIds.has(user.id) && connectedUserIds.has(user.id));

            return (
              <div className="search-results-section" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 4px" }}>
                {searchedContacts.length > 0 && (
                  <>
                    <div className="search-group-title" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--ink-3)", margin: "8px 12px 4px" }}>Message</div>
                    {searchedContacts.map(user => (
                      <div key={user.id} className="search-item" onClick={() => selectSearchResult(user)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "8px", cursor: "pointer" }}>
                        <div style={{ position: "relative" }}>
                          <I.Avatar userId={user.id} name={user.name || "null"} img={user.img} size={40} />
                          {presenceMap[user.id] && presenceMap[user.id] !== "HIDDEN" && (
                            <span className="search-presence-dot" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[user.id] === "ONLINE" ? "#2bb673" : "#8e8e93", border: "2px solid var(--surface)" }} />
                          )}
                        </div>
                        <div className="info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="name" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                            <ProfileName userId={user.id} name={user.name} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {searchedConnected.length > 0 && (
                  <>
                    <div className="search-group-title" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: "var(--ink-3)", margin: "16px 12px 4px" }}>Start Messaging</div>
                    {searchedConnected.map(user => (
                      <div key={user.id} className="search-item" onClick={() => selectSearchResult(user)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "8px", cursor: "pointer" }}>
                        <div style={{ position: "relative" }}>
                          <I.Avatar userId={user.id} name={user.name || "null"} img={user.img} size={40} />
                          {presenceMap[user.id] && presenceMap[user.id] !== "HIDDEN" && (
                            <span className="search-presence-dot" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[user.id] === "ONLINE" ? "#2bb673" : "#8e8e93", border: "2px solid var(--surface)" }} />
                          )}
                        </div>
                        <div className="info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="name" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                            <ProfileName userId={user.id} name={user.name} />
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); selectSearchResult(user); }}
                          className="hbtn hbtn--primary hbtn--sm"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "15px",
                            flexShrink: 0
                          }}
                        >
                          Message
                        </button>
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
            seg === "messages" ? (
              threads.length > 0 ? threads.map(t => {
                const other = t.participants?.find(p => p.userId !== currentUserId);
                const displayName = t.type === "GROUP" ? (t.title || "Group Chat") : (other?.name || "Chat Room");
                const timeStr = t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (t.time || "");
                const presenceStatus = other ? (presenceMap[other.userId] || "OFFLINE") : "OFFLINE";
                return (
                  <div key={t.id} className={`thread ${t.id === activeId && !mobile ? "on" : ""}`} onClick={() => openThread(t.id)}>
                    <div className="av" style={{ background: "transparent" }}>
                      <I.Avatar userId={other?.userId || other?.id} name={displayName} img={other?.img} size={46} />
                      {presenceStatus !== "HIDDEN" && <span className={presenceStatus === "ONLINE" ? "online" : "offline"} />}
                    </div>
                    <div className="ti">
                      <div className="tr1">
                        <span className="nm">{displayName}</span>
                        <span className="tm">{timeStr}</span>
                      </div>
                      <div className="pv">{t.preview}</div>
                      {t.connected === false && <div style={{ fontSize: 11, color: "var(--accent-2)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><I.users style={{ width: 11, height: 11 }} />via {t.context}</div>}
                    </div>
                    {t.unread > 0 && <span className="unreadc">{t.unread}</span>}
                  </div>
                );
              }) : (
                <div style={{ textAlign: "center", color: "var(--ink-3)", padding: "40px 20px", fontSize: "13.5px", lineHeight: "1.5" }}>
                  No chats yet.<br />Search for people above to start a conversation!
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px" }}>
                {contactsLoading ? (
                  <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 20 }}>Loading...</div>
                ) : contactsList.length > 0 ? (
                  contactsList.map(c => (
                    <div key={c.userId} className="search-item" onClick={() => selectSearchResult({ id: c.userId, name: c.displayName })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "8px", cursor: "pointer" }}>
                      <div style={{ position: "relative" }}>
                        <I.Avatar userId={c.userId} name={c.displayName} img={c.profilePhoto || c.img} size={40} />
                        {presenceMap[c.userId] && presenceMap[c.userId] !== "HIDDEN" && (
                          <span className="search-presence-dot" style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: presenceMap[c.userId] === "ONLINE" ? "#2bb673" : "#8e8e93", border: "2px solid var(--surface)" }} />
                        )}
                      </div>
                      <div className="info" style={{ flex: 1, minWidth: 0 }}>
                        <div className="name" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{c.displayName}</div>
                        <div className="headline" style={{ fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{c.headline}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); selectSearchResult({ id: c.userId, name: c.displayName }); }}
                        className="hbtn hbtn--primary hbtn--sm"
                        style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "15px", flexShrink: 0 }}
                      >
                        Message
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", color: "var(--ink-3)", padding: "40px 20px", fontSize: "13.5px" }}>
                    No contacts found.
                  </div>
                )}
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
        const isNoOne = isDM && other?.messagingRestriction === 'no_one';
        const hideCompose = isDMRestricted && !shareCommon;

        return (
          <div className="msg-conv">
            <div className="conv-head">
              {mobile && <button className="hbtn hbtn--ghost hbtn--sm" style={{ padding: "7px 10px" }} onClick={() => setShowConv(false)}><I.arrowL /></button>}
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: other ? "pointer" : "default" }}
                onClick={() => {
                  if (other) {
                    go("public-profile", { id: other.userId || other.id });
                  }
                }}
                title={other ? "View Profile" : undefined}
              >
                <div style={{ position: "relative" }}>
                  <I.Avatar userId={other?.userId || other?.id} name={displayName} img={other?.img} size={40} />
                  {presenceStatus !== "HIDDEN" && <span className={presenceStatus === "ONLINE" ? "online" : "offline"} style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: presenceStatus === "ONLINE" ? "#2bb673" : "#8e8e93", border: "2px solid var(--surface)" }} />}
                </div>
                <div className="ci">
                  <div className="n">{displayName}</div>
                  <div className="s">
                    {presenceStatus === "ONLINE" && "Online"}
                    {presenceStatus === "RECENTLY_ONLINE" && "Recently Online"}
                    {presenceStatus === "OFFLINE" && "Offline"}
                  </div>
                </div>
              </div>
              <div className="cact" style={{ marginLeft: "auto" }}>
                <button className="tb-icon" style={{ width: 36, height: 36 }}><I.more /></button>
              </div>
            </div>

            {active.connected === false && (
              <div className="conn-banner" style={{ marginTop: 14 }}>
                <I.users /> You can message {firstName} because you're both in <b style={{ marginLeft: 3 }}>{active.context || "same group"}</b>. Send a connection request to chat anytime.
              </div>
            )}

            <div className="conv-scroll" ref={scrollRef}>
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
                  <div key={m.id || i} id={`msg-item-${m.id}`} className={`msg-row ${isMe ? "me" : "them"}`}>
                    {!isMe && (
                      <div
                        className="msg-avatar-click"
                        onClick={() => {
                          if (m.senderId && m.senderId !== "them") {
                            go("public-profile", { id: m.senderId });
                          }
                        }}
                        style={{ cursor: (m.senderId && m.senderId !== "them") ? "pointer" : "default", flexShrink: 0, order: 0, marginRight: 8 }}
                        title={m.senderId && m.senderId !== "them" ? "View Profile" : undefined}
                      >
                        <I.Avatar userId={m.senderId} name={m.senderName || displayName} img={m.senderImg} size={28} />
                      </div>
                    )}

                    {/* Hover Actions */}
                    {!isEditing && (
                      <div className="hover-actions">
                        <div
                          className="hover-action-btn"
                          data-tooltip="More"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuMsgId(prev => prev === m.id ? null : m.id);
                          }}
                        >
                          <I.moreV style={{ width: 16, height: 16 }} />
                          {menuMsgId === m.id && (
                            <div className={`msg-menu ${i < 3 ? 'open-down' : ''}`} onClick={(e) => e.stopPropagation()}>
                              <div className="msg-menu-header">
                                {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <button className="msg-menu-item" onClick={() => { setForwardMsg(m); setMenuMsgId(null); }}>
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
                        </div>
                        <button className="hover-action-btn" data-tooltip="Reply" onClick={() => setReplyingTo(m)}>
                          <I.reply style={{ width: 14, height: 14 }} />
                        </button>
                        <button className="hover-action-btn" data-tooltip="React" onClick={() => console.log("React to:", m.id)}>
                          <I.react style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`bubble ${isMe ? "me" : "them"}`}>
                      {m.replyTo && (
                        <div
                          onClick={() => {
                            const element = document.getElementById(`msg-item-${m.replyTo.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.style.transition = 'background-color 0.3s ease';
                              const oldBg = element.style.backgroundColor;
                              element.style.backgroundColor = 'rgba(99, 102, 241, 0.25)';
                              setTimeout(() => {
                                element.style.backgroundColor = oldBg;
                              }, 1000);
                            }
                          }}
                          style={{
                            background: "rgba(0, 0, 0, 0.16)",
                            borderLeft: "3.5px solid #2196f3",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            cursor: "pointer",
                            marginBottom: "6px",
                            opacity: 0.95,
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "11px", marginBottom: "2px", color: "#2196f3" }}>
                            {m.replyTo.senderId === currentUserId ? "You" : m.replyTo.senderName}
                          </div>
                          <div style={{ color: isMe ? "rgba(255,255,255,0.75)" : "var(--ink-2)", fontSize: "11.5px" }}>{m.replyTo.body}</div>
                        </div>
                      )}
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

                    {isMe && (
                      <div
                        className="msg-avatar-click"
                        onClick={() => {
                          if (currentUserId && currentUserId !== "me") {
                            go("public-profile", { id: currentUserId });
                          }
                        }}
                        style={{ cursor: (currentUserId && currentUserId !== "me") ? "pointer" : "default", flexShrink: 0, order: 3, marginLeft: 8 }}
                        title={currentUserId && currentUserId !== "me" ? "View Profile" : undefined}
                      >
                        <I.Avatar userId={currentUserId} name="Me" img={ME.profilePhoto} size={28} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {replyingTo && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--field)",
                  padding: "10px 16px",
                  borderTop: "1px solid var(--border)",
                  borderBottom: "1px solid var(--border)",
                  animation: "slideUp 0.2s ease"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: "11.5px", fontWeight: 700, color: "var(--accent-1)" }}>
                    Replying to {replyingTo.senderId === currentUserId ? "yourself" : (active.participants?.find(p => p.userId === replyingTo.senderId)?.name || "User")}
                  </span>
                  <span style={{ fontSize: "12.5px", color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                    {replyingTo.body || replyingTo.content}
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-3)",
                    padding: "4px"
                  }}
                >
                  <I.x style={{ width: 16, height: 16 }} />
                </button>
              </div>
            )}

            {isNoOne ? (
              <div className="conv-compose" style={{ justifyContent: "center", color: "var(--ink-3)", fontStyle: "italic", fontSize: "13.5px" }}>
                User no longer accept messages
              </div>
            ) : hideCompose ? (
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
                  <strong>Direct messaging is disabled.</strong><br />
                  You can only message users you share a common group or event with.
                </div>
              </div>
            ) : (
              <div className="conv-compose">
                <input
                  placeholder={`Message ${firstName}…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                />
                <button className="send" onClick={send}><I.send /></button>
              </div>
            )}
          </div>
        );
      })()}
      {!active && !mobile && (
        <div className="msg-conv" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", padding: 40, textAlign: "center" }}>
          <div style={{ background: "var(--field)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <I.chat style={{ width: 40, height: 40, color: "var(--ink-2)" }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Your Messages</h3>
          <p style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.5, color: "var(--ink-3)" }}>
            Select a conversation from the list to start chatting, or search for friends to start a new thread.
          </p>
        </div>
      )}
      {forwardMsg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 400, maxHeight: "80vh", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--ink)" }}>Forward Message</h3>
              <button
                type="button"
                onClick={() => setForwardMsg(null)}
                style={{ border: "none", background: "var(--border-2)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-2)" }}
              >
                <I.x style={{ width: 12, height: 12 }} />
              </button>
            </div>

            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <I.search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ink-3)" }} />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 12px 8px 34px",
                    borderRadius: "15px",
                    border: "1px solid var(--border)",
                    background: "var(--field)",
                    color: "var(--ink)",
                    outline: "none",
                    fontSize: "13px"
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: 4 }}>
              {threads
                .filter(t => {
                  const other = t.participants?.find(p => p.userId !== currentUserId);
                  const displayName = t.type === "GROUP" ? (t.title || "Group Chat") : (other?.name || "Chat Room");
                  return displayName.toLowerCase().includes(forwardSearch.toLowerCase());
                })
                .map(t => {
                  const other = t.participants?.find(p => p.userId !== currentUserId);
                  const displayName = t.type === "GROUP" ? (t.title || "Group Chat") : (other?.name || "Chat Room");
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        const content = forwardMsg.body || forwardMsg.content;
                        if (socket) {
                          socket.emit("message.send", { conversationId: t.id, content }, (ack) => {
                            if (ack && !ack.success) {
                              alert("Failed to forward message: " + ack.error);
                            } else {
                              if (window.toast) {
                                window.toast("Message forwarded!", "success");
                              } else {
                                alert("Message forwarded!");
                              }
                            }
                          });
                        }
                        setForwardMsg(null);
                        setForwardSearch("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: "10px",
                        cursor: "pointer"
                      }}
                      className="thread"
                    >
                      <I.Avatar userId={other?.userId || other?.id} name={displayName} img={other?.img} size={36} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


