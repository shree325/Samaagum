import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { I, Avatar } from './home-icons';
import { VerifyTicketPanel } from './home-tickets';

export function EventDashboard({ ev, st, go, embedded = false }) {
  const e = ev || st.createdEvents[0] || {};
  const [stats, setStats] = useState({ totalAttendees: 0, checkedInCount: 0, pendingRequestsCount: 0, revenue: 0, capacity: 120, wishlistCount: 0, galleryPosts: 0, discussionComments: 0, confirmed: [] as any[], requests: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  // Comprehensive Dummy Data for Demo Mode
  const dummyStats = {
    totalAttendees: 142,
    checkedInCount: 89,
    pendingRequestsCount: 3,
    revenue: 124500,
    capacity: 200,
    wishlistCount: 38,
    galleryPosts: 46,
    discussionComments: 24,
    requests: [
      {
        id: "req_1",
        bookingId: "book_101",
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        answers: { "question_1": "Tech Founder / Product Manager", "question_2": "Looking to network with local developers and find potential co-founders." }
      },
      {
        id: "req_2",
        bookingId: "book_102",
        name: "Priya Nair",
        email: "priya.nair@example.com",
        picture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        answers: { "question_1": "Senior UI/UX Designer", "question_2": "Interested in the design systems panel and community meetup." }
      },
      {
        id: "req_3",
        bookingId: "book_103",
        name: "Rohan Gupta",
        email: "rohan.g@example.com",
        picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        answers: { "question_1": "Full Stack Developer", "question_2": "Want to learn about modern AI agentic coding workflows." }
      }
    ],
    confirmed: [
      { id: "att_1", name: "Ananya Desai", email: "ananya.d@example.com", tier: "VIP Pass", isCashPayment: false, bookingStatus: "paid", checkinStatus: "checked_in", amountMinor: 250000 },
      { id: "att_2", name: "Vikram Malhotra", email: "vikram.m@example.com", tier: "General Admission", isCashPayment: true, bookingStatus: "pending_payment", checkinStatus: "not_checked_in", amountMinor: 50000 },
      { id: "att_3", name: "Siddharth Rao", email: "siddharth@example.com", tier: "VIP Pass", isCashPayment: false, bookingStatus: "paid", checkinStatus: "checked_in", amountMinor: 250000 },
      { id: "att_4", name: "Kavya Patel", email: "kavya.p@example.com", tier: "Early Bird", isCashPayment: false, bookingStatus: "paid", checkinStatus: "checked_in", amountMinor: 100000 },
      { id: "att_5", name: "Arjun Verma", email: "arjun.v@example.com", tier: "General Admission", isCashPayment: false, bookingStatus: "paid", checkinStatus: "not_checked_in", amountMinor: 50000 },
      { id: "att_6", name: "Meera Joshi", email: "meera.j@example.com", tier: "Early Bird", isCashPayment: true, bookingStatus: "paid", checkinStatus: "checked_in", amountMinor: 100000 },
    ]
  };

  // Mock data for rich visualizations
  const revenueData = [
    { name: 'Mon', revenue: 12000 },
    { name: 'Tue', revenue: 19500 },
    { name: 'Wed', revenue: 24000 },
    { name: 'Thu', revenue: 21000 },
    { name: 'Fri', revenue: 38000 },
    { name: 'Sat', revenue: 42000 },
    { name: 'Sun', revenue: 51000 },
  ];

  const trafficData = [
    { name: 'Direct Link', visitors: 540 },
    { name: 'Instagram / WhatsApp', visitors: 820 },
    { name: 'Samaagum Feed', visitors: 610 },
    { name: 'Referral & Invite', visitors: 340 },
  ];

  const ticketDistributionData = [
    { name: 'VIP Pass', value: 35 },
    { name: 'General Admission', value: 65 },
    { name: 'Early Bird', value: 42 },
  ];
  const COLORS = ['#8b5cf6', '#10b981', '#3b82f6'];

  const activityFeed = [
    { id: 1, action: 'VIP Registration', desc: 'Ananya Desai registered for VIP Pass (Online Paid)', time: '4m ago', icon: <I.ticket style={{ width: 14, height: 14 }} /> },
    { id: 2, action: 'Attendee Check-in', desc: 'Gate Scanner #1 checked in Siddharth Rao', time: '12m ago', icon: <I.check style={{ width: 14, height: 14 }} /> },
    { id: 3, action: 'Gallery Upload', desc: 'Meera Joshi uploaded 3 photos to Event Gallery', time: '28m ago', icon: <I.image style={{ width: 14, height: 14 }} /> },
    { id: 4, action: 'Waitlist & Approval', desc: 'Aarav Sharma requested approval (Questionnaire submitted)', time: '45m ago', icon: <I.warning style={{ width: 14, height: 14 }} /> },
    { id: 5, action: 'Discussion Post', desc: 'New topic posted in Event Discussion forum', time: '1h ago', icon: <I.chat style={{ width: 14, height: 14 }} /> },
  ];

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-stats`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        if (data.data.totalAttendees === 0) {
          setIsDemoMode(true);
        }
      } else {
        setError(data.message || "Failed to load dashboard data.");
      }
    } catch (err) {
      setError("Network error loading dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [e.id]);

  useEffect(() => {
    if (!e?.id || !window.io) return;
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = window.io(socketUrl, { transports: ['websocket'] });
    socket.emit('join_event', e.id);
    socket.on('dashboard_updated', () => {
      fetchStats();
    });
    return () => {
      socket.emit('leave_event', e.id);
      socket.disconnect();
    };
  }, [e.id]);

  const handleAction = async (bookingId, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/requests/${bookingId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        alert(data.message || `Failed to ${action} request.`);
      }
    } catch (err) {
      alert("Network error updating request.");
    }
  };

  const handleCheckin = async (attendeeId) => {
    const attendee = stats?.confirmed?.find(a => a.id === attendeeId);
    let paymentReceived = false;
    if (attendee?.isCashPayment && attendee?.bookingStatus === 'pending_payment') {
      if (!window.confirm(`Has cash payment of ₹${(attendee.amountMinor || 0) / 100} been collected?`)) {
        return;
      }
      paymentReceived = true;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/attendees/${attendeeId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ paymentReceived })
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        alert(data.message || "Failed to check in attendee.");
      }
    } catch (err) {
      alert("Network error checking in attendee.");
    }
  };

  const loadingSpinner = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: embedded ? 400 : "100vh", color: "var(--ink-3)" }}>
      <div className="spinner-border" /> <span style={{ marginLeft: 8 }}>Loading Premium Dashboard...</span>
    </div>
  );

  if (loading) return loadingSpinner;

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: embedded ? 400 : "100vh", padding: 24, textAlign: "center" }}>
        <div style={{ color: "red", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>⚠️ Error</div>
        <div style={{ color: "var(--ink-2)", marginBottom: 20 }}>{error}</div>
        {!embedded && <button className="hbtn hbtn--primary" onClick={() => go("events")}>Back to Events</button>}
      </div>
    );
  }

  const activeStats = isDemoMode ? dummyStats : stats;
  const revenueDisplay = activeStats.revenue === 0 ? "Free" : `₹${activeStats.revenue.toLocaleString()}`;
  const checkinPercentage = activeStats.totalAttendees > 0 ? Math.round((activeStats.checkedInCount / activeStats.totalAttendees) * 100) : 0;
  
  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: { active?: any; payload?: any; label?: any }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface)', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{label}</p>
          <p style={{ margin: '4px 0 0', color: payload[0].color || 'var(--ink-2)', fontSize: 13 }}>
            {payload[0].name}: <span style={{ fontWeight: 600 }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const dashboardContent = (
    <>
      {/* DEMO MODE TOGGLE BAR */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 18px", marginBottom: 24, borderRadius: 12,
        background: isDemoMode ? "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.15) 100%)" : "var(--surface)",
        border: `1px solid ${isDemoMode ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
        boxShadow: isDemoMode ? "0 4px 16px rgba(139,92,246,0.1)" : "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: isDemoMode ? "#c4b5fd" : "var(--ink)" }}>
              {isDemoMode ? "Preview Mode Active (Sample Dashboard Data)" : "Live Event Dashboard"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
              {isDemoMode ? "Showing simulated ticket sales, check-ins, and pending approvals for demonstration." : "Displaying real-time stats from active attendees and transactions."}
            </div>
          </div>
        </div>
        <button
          className={`hbtn hbtn--sm ${isDemoMode ? "hbtn--primary" : "hbtn--surface"}`}
          onClick={() => setIsDemoMode(!isDemoMode)}
          style={isDemoMode ? { background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", color: "#fff", fontWeight: 600 } : {}}
        >
          {isDemoMode ? "Switch to Live Data" : "⚡ Load Demo Data"}
        </button>
      </div>

      {/* TOP HEADER */}
      {!embedded && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <button className="back" onClick={() => go("events")} style={{ width: 36, height: 36, background: "var(--surface)", border: "1px solid var(--border)" }}><I.arrowL /></button>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 999 }}>Active Event</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px 0", color: "var(--ink)", letterSpacing: "-0.02em" }}>{e.title}</h1>
            <div style={{ fontSize: 14, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><I.cal style={{ width: 14, height: 14 }} /> {e.date} · {e.time}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><I.pin style={{ width: 14, height: 14 }} /> {e.venue || "Online"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="hbtn hbtn--ghost" onClick={() => alert("Share dialog mock")}>
              <I.share style={{ width: 16, height: 16 }} /> Share
            </button>
            <button className="hbtn hbtn--surface" onClick={() => alert("View public page mock")}>
              <I.link style={{ width: 16, height: 16 }} /> Public Page
            </button>
            <button className="hbtn hbtn--primary" onClick={() => go("edit-event", e)}>
              <I.edit style={{ width: 16, height: 16 }} /> Edit Event
            </button>
          </div>
        </div>
      )}

        {/* OVERVIEW CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)" }}>Total Revenue</div>
              <div style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><I.ticket style={{ width: 16, height: 16 }} /></div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{revenueDisplay}</div>
            <div style={{ fontSize: 12, color: "#10b981", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>+12% <span style={{ color: "var(--ink-3)" }}>from last week</span></div>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)" }}>Total Registrations</div>
              <div style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><I.user style={{ width: 16, height: 16 }} /></div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{activeStats.totalAttendees} <span style={{ fontSize: 16, fontWeight: 500, color: "var(--ink-3)" }}>/ {activeStats.capacity}</span></div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#8b5cf6" }}>{Math.round((activeStats.totalAttendees / (activeStats.capacity || 1)) * 100)}%</span> capacity reached</div>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)" }}>Page Views & Wishlist</div>
              <div style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><I.link style={{ width: 16, height: 16 }} /></div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>2,310 <span style={{ fontSize: 16, fontWeight: 500, color: "var(--ink-3)" }}>({activeStats.wishlistCount} saved)</span></div>
            <div style={{ fontSize: 12, color: "#10b981", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>18.5% <span style={{ color: "var(--ink-3)" }}>conversion rate</span></div>
          </div>

          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-3)" }}>Pending Approvals</div>
              <div style={{ background: activeStats.pendingRequestsCount > 0 ? "rgba(245,158,11,0.1)" : "var(--field)", color: activeStats.pendingRequestsCount > 0 ? "#f59e0b" : "var(--ink-3)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><I.warning style={{ width: 16, height: 16 }} /></div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{activeStats.pendingRequestsCount}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>{activeStats.galleryPosts || 0} gallery photos · {activeStats.discussionComments || 0} chats</div>
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>
          {/* Revenue Chart */}
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Revenue & Sales Trend</h3>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>Daily performance over the last 7 days</div>
              </div>
              <select style={{ background: "var(--field)", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "var(--ink)", outline: "none" }}>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>All time</option>
              </select>
            </div>
            <div style={{ height: 280, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Traffic Sources & Check-ins */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Traffic Sources</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 16 }}>Where your views come from</div>
              <div style={{ height: 160, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trafficData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-2)' }} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--field)' }} />
                    <Bar dataKey="visitors" name="Visitors" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 24, flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px" }}>Check-in Progress</h3>
                <div style={{ fontSize: 13, color: "var(--ink-3)" }}>{activeStats.checkedInCount} of {activeStats.totalAttendees} arrived</div>
              </div>
              <div style={{ position: "relative", width: 72, height: 72 }}>
                <svg width="72" height="72" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--field)" strokeWidth="4" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${checkinPercentage}, 100`} />
                </svg>
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {checkinPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* OPERATIONS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          
          {/* Main Panel: Check-in & Attendees */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <VerifyTicketPanel eventId={e.id} onCheckedIn={fetchStats} />

            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Attendee Management</h3>
                <div style={{ display: "flex", gap: 12 }}>
                  <input type="text" placeholder="Search attendees..." style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--field)", fontSize: 13, outline: "none", width: 200 }} />
                  <button className="hbtn hbtn--surface hbtn--sm"><I.download style={{ width: 14, height: 14 }} /> Export</button>
                </div>
              </div>

              {/* Pending Approvals */}
              {activeStats.requests.length > 0 && (
                <div style={{ padding: 24, borderBottom: "1px solid var(--border)", background: "rgba(245,158,11,0.03)" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", gap: 6, alignItems: "center", textTransform: "uppercase", letterSpacing: "0.05em", color: "#f59e0b" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                    Action Required: Approvals ({activeStats.requests.length})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {activeStats.requests.map(r => (
                      <div key={r.id || r.bookingId} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, background: "var(--surface)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar name={r.name || "User"} img={r.picture} size={36} />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{r.name || "Unknown"}</div>
                              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.email || ""}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleAction(r.bookingId, 'decline')} style={{ color: "#ef4444" }}>Decline</button>
                            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleAction(r.bookingId, 'accept')}>Approve</button>
                          </div>
                        </div>
                        {r.answers && Object.keys(r.answers).length > 0 && (
                          <div style={{ padding: 12, background: "var(--field)", borderRadius: 8, border: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Questionnaire Responses</div>
                            {Object.entries(r.answers).map(([key, val]) => (
                              <div key={key} style={{ fontSize: 12.5, color: "var(--ink)" }}>
                                <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>{key === "question_1" ? "Occupation / Background:" : key === "question_2" ? "Why join this event?:" : key}</span> <span style={{ fontWeight: 600 }}>{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmed List */}
              <div style={{ padding: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Confirmed Guests ({activeStats.confirmed.length})
                </h4>
                {activeStats.confirmed.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>No confirmed guests yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activeStats.confirmed.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--border-2)", transition: "all 0.2s" }} className="hover-card">
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                          <Avatar name={a.name} size={32} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{a.name}</div>
                            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{a.email}</div>
                          </div>
                        </div>
                        <div style={{ width: 130, fontSize: 12, color: "var(--ink-2)" }}>{a.tier || "General"}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, width: 160, justifyContent: "flex-end" }}>
                          {a.isCashPayment && a.bookingStatus === 'pending_payment' ? (
                            <span style={{ fontSize: 12, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                              <I.warning style={{ width: 12, height: 12 }} /> Pending Payment
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                              <I.check style={{ width: 12, height: 12 }} /> Paid
                            </span>
                          )}
                          {a.checkinStatus === 'checked_in' ? (
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: 999 }}>Checked In</span>
                          ) : (
                            <button className="hbtn hbtn--surface hbtn--sm" onClick={() => handleCheckin(a.id)}>Check In</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Timeline & Operations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Ticket Distribution */}
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>Ticket Distribution</h3>
              <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ticketDistributionData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                      {ticketDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
                {ticketDistributionData.map((t, i) => (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-2)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length] }} /> {t.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div style={{ background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)", padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px" }}>Recent Activity</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative" }}>
                <div style={{ position: "absolute", left: 15, top: 20, bottom: 20, width: 2, background: "var(--border-2)", zIndex: 0 }} />
                {activityFeed.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 12, position: "relative", zIndex: 1 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--field)", border: "2px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)", flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{item.action}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{item.desc}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="hbtn hbtn--surface hbtn--block" style={{ marginTop: 20 }}>View All Activity</button>
            </div>

          </div>
        </div>

      </>
  );

  if (embedded) {
    return (
      <div className="view-enter" style={{ width: "100%" }}>
        {dashboardContent}
      </div>
    );
  }

  return (
    <div className="scroll" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="flow view-enter" style={{ padding: "24px 32px 80px", maxWidth: 1280, margin: "0 auto" }}>
        {dashboardContent}
      </div>
    </div>
  );
}
