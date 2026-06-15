// @ts-nocheck
/* ============================================================
   Samaagum Admin Panel — React Application
   Requires React, ReactDOM, and Babel in browser.
   ============================================================ */

const { useState, useEffect, useRef } = React;

// --- INLINE SVG ICONS ---
const Icons = {
  shield: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  users: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  alert: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  dispute: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  terminal: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  key: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  settings: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  dashboard: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  tenant: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
  logout: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  doc: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
  close: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
};

// --- INITIAL MOCK DATA ---
const INITIAL_KYC = [
  { id: "kyc-1", name: "Echo Collective", type: "Event Host", email: "echo@collective.in", submitted: "2 hours ago", docName: "Certificate of Incorporation & PAN", docNumber: "AAACE9912A", status: "Pending", notes: "" },
  { id: "kyc-2", name: "Letterform Lab", type: "Event Host", email: "admin@letterform.org", submitted: "1 day ago", docName: "Aadhaar Card & GST Registry", docNumber: "GST-29AAAAA1111A1Z1", status: "Pending", notes: "" },
  { id: "kyc-3", name: "Still Mind Collective", type: "Event Host", email: "shanti@stillmind.in", submitted: "3 days ago", docName: "PAN Card & Address Proof", docNumber: "BBBPX9012K", status: "Verified", notes: "Verified by admin on June 12" }
];

const INITIAL_DISPUTES = [
  { id: "disp-1", user: "Arjun V", event: "Sunset Rooftop Sessions: Indie Live", amount: "₹350", reason: "Host cancelled but refund didn't trigger automatically.", submitted: "5 hours ago", status: "Open", maker: "", checker: "" },
  { id: "disp-2", user: "Meera J", event: "Street Food Crawl: VV Puram", amount: "₹600", reason: "Accidentally booked twice, requested cancellation.", submitted: "Yesterday", status: "Refund Requested", maker: "admin@samaagum.co", checker: "" },
  { id: "disp-3", user: "Karan Sethi", event: "Morning Flow + Community Brunch", amount: "₹250", reason: "Waitlist spot expired early due to system lag.", submitted: "4 days ago", status: "Closed", maker: "admin@samaagum.co", checker: "superadmin@samaagum.co" }
];

const INITIAL_MODERATION = [
  { id: "mod-1", reporter: "Mira Shah", reportedUser: "SpamBot99", entityType: "Post", entityContent: "Invest ₹1000 and earn ₹10000 daily! Click here: bit.ly/spam-link", reason: "Spam / Financial scam", submitted: "3 hours ago", status: "Pending" },
  { id: "mod-2", reporter: "Zoya N", reportedUser: "AnonymousUser", entityType: "Comment", entityContent: "This event is garbage and the host is a crook.", reason: "Abusive language", submitted: "1 day ago", status: "Pending" },
  { id: "mod-3", reporter: "Nina P", reportedUser: "SpammyHost", entityType: "Event", entityContent: "Free Cryptocurrency Webinar", reason: "Scam / Commercial promo", submitted: "2 days ago", status: "Suspended" }
];

const INITIAL_TENANTS = [
  { id: "ten-1", name: "Indiranagar Tech Hub", slug: "indiranagar-tech", plan: "Enterprise", entitlements: ["Waitlist Priority Boosts", "PWA Check-in"], status: "Active" },
  { id: "ten-2", name: "Koramangala Culturals", slug: "koramangala-culture", plan: "Standard", entitlements: ["Offline Cash Payments"], status: "Active" },
  { id: "ten-3", name: "Cubbon Athletic Collective", slug: "cubbon-athletics", plan: "Free Trial", entitlements: ["PWA Check-in"], status: "Pending Approval" }
];

const INITIAL_RBAC = [
  { permission: "Book/RSVP/Waitlist", desc: "Discover, join, RSVP, waitlist and message on the end-user side", roles: ["Participant", "Event Host", "Group Organizer", "Community Admin", "Platform Admin", "Super Admin"] },
  { permission: "Create & Run Events", desc: "Manage event lifecycle, edit details, custom fields, waitlists", roles: ["Event Host", "Group Organizer", "Community Admin", "Platform Admin", "Super Admin"] },
  { permission: "Refund Bookings (Maker)", desc: "Initiate or request refunds for event tickets", roles: ["Event Host", "Platform Admin", "Super Admin"] },
  { permission: "Refund Approval (Checker)", desc: "Approve pending refunds to settle financial records", roles: ["Super Admin"] },
  { permission: "Manage Members & Groups", desc: "Approve/decline group requests, assign co-organizers, invite", roles: ["Group Organizer", "Community Admin", "Platform Admin", "Super Admin"] },
  { permission: "KYC Document Review", desc: "Review host verification docs, approve host credentials", roles: ["Platform Admin", "Super Admin"] },
  { permission: "Resolve Disputes & Tickets", desc: "Access read-only impersonation and support channels", roles: ["Platform Admin", "Super Admin"] },
  { permission: "Global Feature Flag Management", desc: "Toggle system-wide features and security restrictions", roles: ["Super Admin"] },
  { permission: "Tenant Provisioning & Entitlements", desc: "Approve, create, configure and entitle new tenants", roles: ["Super Admin"] },
];

const INITIAL_AUDIT = [
  { time: "2026-06-15 10:14:02", actor: "System", action: "Tenant 'Indiranagar Tech Hub' successfully provisioned on Enterprise plan." },
  { time: "2026-06-15 11:02:15", actor: "superadmin@samaagum.co", action: "Updated global feature flag: Enabled 'Waitlist Boosts'." },
  { time: "2026-06-15 11:45:30", actor: "admin@samaagum.co", action: "Closed dispute ticket disp-3 and verified offline audit trail." },
  { time: "2026-06-15 12:12:08", actor: "superadmin@samaagum.co", action: "Role permission matrix initialized." }
];

const FEATURE_FLAGS = [
  { id: "ff-1", name: "Waitlist Referral Boosts", desc: "Allows users to boost waitlist priority via sharing referrals.", active: true },
  { id: "ff-2", name: "Offline Proof Verification", desc: "Allows uploading cash payment proofs for event tickets.", active: true },
  { id: "ff-3", name: "PWA Check-in Gate", desc: "Enables host-side offline QR validation.", active: false },
  { id: "ff-4", name: "Maker-Checker Refunds", desc: "Enforces two-admin verification for any refund settlement.", active: true },
];

// --- APP COMPONENT ---
function App() {
  const [user, setUser] = useState(null); // { email, role }
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(true);

  // Lists
  const [kycList, setKycList] = useState(INITIAL_KYC);
  const [disputesList, setDisputesList] = useState(INITIAL_DISPUTES);
  const [moderationList, setModerationList] = useState(INITIAL_MODERATION);
  const [tenantsList, setTenantsList] = useState(INITIAL_TENANTS);
  const [rbacMatrix, setRbacMatrix] = useState(INITIAL_RBAC);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT);
  const [featureFlags, setFeatureFlags] = useState(FEATURE_FLAGS);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Logging utility
  const logAction = (actor, action) => {
    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setAuditLogs(prev => [{ time, actor, action }, ...prev]);
  };

  // Modals state
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Tenant form state
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", plan: "Standard", entitlements: [] });

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    window.samaagum_admin_setActiveTab = setActiveTab;
    window.samaagum_admin_login = (email) => {
      handleLogin(email, "superadmin");
    };
    return () => {
      delete window.samaagum_admin_setActiveTab;
      delete window.samaagum_admin_login;
    };
  }, [setActiveTab]);

  // Auth Handler
  const handleLogin = (email, password) => {
    if (email === "superadmin@samaagum.co") {
      setUser({ email, role: "Super Admin", name: "Ishaan Mehta" });
      addToast("Welcome back, Super Admin!", "success");
      logAction("superadmin@samaagum.co", "Logged in successfully (Super Admin).");
    } else if (email === "admin@samaagum.co") {
      setUser({ email, role: "Platform Admin", name: "Aanya Reddy" });
      addToast("Welcome back, Platform Admin!", "success");
      logAction("admin@samaagum.co", "Logged in successfully (Platform Admin).");
    } else {
      addToast("Invalid credentials for administrative access.", "warning");
    }
  };

  const handleLogout = () => {
    logAction(user?.email || "User", "Logged out.");
    setUser(null);
    setActiveTab("dashboard");
  };

  // Helper for quick switching roles
  const handleQuickSwitch = (newRole) => {
    if (newRole === "Super Admin") {
      setUser({ email: "superadmin@samaagum.co", role: "Super Admin", name: "Ishaan Mehta" });
      addToast("Switched session to Super Admin", "info");
      logAction("System", "Session switched to Super Admin");
    } else if (newRole === "Platform Admin") {
      setUser({ email: "admin@samaagum.co", role: "Platform Admin", name: "Aanya Reddy" });
      addToast("Switched session to Platform Admin", "info");
      logAction("System", "Session switched to Platform Admin");
    }
  };

  // KYC Actions
  const approveKyc = (id) => {
    const item = kycList.find(k => k.id === id);
    setKycList(prev => prev.map(k => k.id === id ? { ...k, status: "Verified" } : k));
    addToast(`${item.name} has been verified successfully.`, "success");
    logAction(user.email, `Approved KYC credentials for '${item.name}'.`);
    setSelectedKyc(null);
  };

  const rejectKyc = (id) => {
    if (!rejectionReason.trim()) {
      addToast("Rejection notes are required.", "warning");
      return;
    }
    const item = kycList.find(k => k.id === id);
    setKycList(prev => prev.map(k => k.id === id ? { ...k, status: "Rejected", notes: rejectionReason } : k));
    addToast(`${item.name} KYC has been rejected.`, "info");
    logAction(user.email, `Rejected KYC credentials for '${item.name}'. Reason: ${rejectionReason}`);
    setRejectionReason("");
    setSelectedKyc(null);
  };

  // Dispute / Refund Actions (Maker-Checker Demo)
  const initiateRefund = (id) => {
    const item = disputesList.find(d => d.id === id);
    setDisputesList(prev => prev.map(d => d.id === id ? { ...d, status: "Refund Requested", maker: user.email } : d));
    addToast("Refund initiated. Awaiting Super Admin (Checker) approval.", "info");
    logAction(user.email, `Requested refund of ${item.amount} for user ${item.user} (Dispute ID: ${item.id}). Maker stage complete.`);
    setSelectedDispute(null);
  };

  const approveRefund = (id) => {
    const item = disputesList.find(d => d.id === id);
    setDisputesList(prev => prev.map(d => d.id === id ? { ...d, status: "Closed", checker: user.email } : d));
    addToast("Refund approved & settled.", "success");
    logAction(user.email, `Approved and finalized refund of ${item.amount} for user ${item.user} (Dispute ID: ${item.id}). Checker stage complete.`);
    setSelectedDispute(null);
  };

  // Moderation Actions
  const handleModAction = (id, actionType) => {
    const item = moderationList.find(m => m.id === id);
    setModerationList(prev => prev.map(m => m.id === id ? { ...m, status: actionType } : m));
    addToast(`Content flag resolved: Marked as ${actionType}.`, "success");
    logAction(user.email, `Resolved content flag on ${item.entityType} by user ${item.reportedUser}. Action taken: ${actionType}`);
  };

  // Tenant Creation Actions
  const handleTenantCheckboxChange = (entitlement) => {
    setNewTenant(prev => {
      const alreadyChecked = prev.entitlements.includes(entitlement);
      return {
        ...prev,
        entitlements: alreadyChecked
          ? prev.entitlements.filter(e => e !== entitlement)
          : [...prev.entitlements, entitlement]
      };
    });
  };

  const createTenant = (e) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug) {
      addToast("Tenant Name and Slug are required.", "warning");
      return;
    }
    const tenantObj = {
      id: `ten-${tenantsList.length + 1}`,
      name: newTenant.name,
      slug: newTenant.slug,
      plan: newTenant.plan,
      entitlements: newTenant.entitlements,
      status: "Active"
    };
    setTenantsList(prev => [...prev, tenantObj]);
    addToast(`Tenant '${newTenant.name}' has been successfully provisioned.`, "success");
    logAction(user.email, `Provisioned new white-label tenant '${newTenant.name}' with entitlements: [${newTenant.entitlements.join(', ')}]`);
    setNewTenant({ name: "", slug: "", plan: "Standard", entitlements: [] });
  };

  // Feature Flag Toggle
  const toggleFeatureFlag = (id) => {
    const item = featureFlags.find(f => f.id === id);
    setFeatureFlags(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
    addToast(`Feature flag '${item.name}' toggled to ${!item.active ? 'ENABLED' : 'DISABLED'}`, "info");
    logAction(user.email, `Toggled feature flag '${item.name}' to ${!item.active ? 'active' : 'inactive'}`);
  };

  // Toggle RBAC Permission Checkbox
  const toggleRbacPermission = (permissionName, roleName) => {
    setRbacMatrix(prev => prev.map(item => {
      if (item.permission === permissionName) {
        const hasRole = item.roles.includes(roleName);
        const updatedRoles = hasRole
          ? item.roles.filter(r => r !== roleName)
          : [...item.roles, roleName];
        
        logAction(user.email, `Updated RBAC: ${hasRole ? 'Removed' : 'Granted'} permission '${permissionName}' for role '${roleName}'`);
        addToast(`Permission list updated.`, "info");
        return { ...item, roles: updatedRoles };
      }
      return item;
    }));
  };

  // Login view component
  if (!user) {
    return (
      <div className="login-wrap">
        <div className="login-bg-glows">
          <div className="glow-1"></div>
          <div className="glow-2"></div>
        </div>
        <div className="login-card">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 40 40">
              <defs>
                <linearGradient id="lg-admin" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stop-color="var(--accent-1)"/><stop offset="1" stop-color="var(--accent-2)"/>
                </linearGradient>
              </defs>
              <circle cx="15" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.92"/>
              <circle cx="25" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.62"/>
              <circle cx="20" cy="25" r="9.2" fill="url(#lg-admin)" opacity="0.8"/>
            </svg>
            <span className="wordmark">samaagum</span>
            <span style={{ fontSize: "12px", color: "var(--accent-2)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Console</span>
          </div>

          <h3 style={{ textAlign: "center", marginBottom: "24px" }}>Administrative Authentication</h3>
          <p style={{ fontSize: "14px", color: "var(--ink-2)", textAlign: "center", marginBottom: "24px" }}>
            Verify platform entities, manage dispute claims, and configure tenants.
          </p>

          <LoginForm onSubmit={handleLogin} />

          <div className="demo-account-selector">
            <div className="demo-account-title">Demo Credentials Quick Login</div>
            <button className="demo-btn" onClick={() => handleLogin("admin@samaagum.co", "admin")}>
              <div className="avatar admin">PA</div>
              <div className="text">
                <span className="role">Platform Admin</span>
                <span className="email">admin@samaagum.co (pw: admin)</span>
              </div>
            </button>
            <button className="demo-btn" onClick={() => handleLogin("superadmin@samaagum.co", "superadmin")}>
              <div className="avatar super">SA</div>
              <div className="text">
                <span className="role">Super Admin</span>
                <span className="email">superadmin@samaagum.co (pw: superadmin)</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Toasts */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active role variables
  const isSuperAdmin = user.role === "Super Admin";

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-logo">
            <svg width="28" height="28" viewBox="0 0 40 40">
              <circle cx="15" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.92"/>
              <circle cx="25" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.62"/>
              <circle cx="20" cy="25" r="9.2" fill="url(#lg-admin)" opacity="0.8"/>
            </svg>
            <span className="wordmark">samaagum</span>
            <span className="badge">Admin</span>
          </div>

          <nav className="sidebar-menu">
            <button className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
              <Icons.dashboard /> Dashboard
            </button>
            
            <button className={`sidebar-item ${activeTab === "kyc" ? "active" : ""}`} onClick={() => setActiveTab("kyc")}>
              <Icons.shield /> KYC Verification
              {kycList.filter(k => k.status === "Pending").length > 0 && (
                <span style={{ marginLeft: "auto", background: "var(--accent-1)", color: "#fff", fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px" }}>
                  {kycList.filter(k => k.status === "Pending").length}
                </span>
              )}
            </button>

            <button className={`sidebar-item ${activeTab === "disputes" ? "active" : ""}`} onClick={() => setActiveTab("disputes")}>
              <Icons.dispute /> Dispute Resolution
              {disputesList.filter(d => d.status === "Open" || d.status === "Refund Requested").length > 0 && (
                <span style={{ marginLeft: "auto", background: "var(--accent-2)", color: "#fff", fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px" }}>
                  {disputesList.filter(d => d.status === "Open" || d.status === "Refund Requested").length}
                </span>
              )}
            </button>

            <button className={`sidebar-item ${activeTab === "moderation" ? "active" : ""}`} onClick={() => setActiveTab("moderation")}>
              <Icons.alert /> Content Moderation
            </button>

            {isSuperAdmin && (
              <button className={`sidebar-item ${activeTab === "tenants" ? "active" : ""}`} onClick={() => setActiveTab("tenants")}>
                <Icons.tenant /> Tenant Provisioning
              </button>
            )}

            <button className={`sidebar-item ${activeTab === "rbac" ? "active" : ""}`} onClick={() => setActiveTab("rbac")}>
              <Icons.key /> RBAC Governance
            </button>

            <button className={`sidebar-item ${activeTab === "audit" ? "active" : ""}`} onClick={() => setActiveTab("audit")}>
              <Icons.terminal /> System Audit Logs
            </button>
          </nav>
        </div>

        <div>
          <div className="sidebar-user">
            <div className="user-avatar" style={isSuperAdmin ? { background: "linear-gradient(135deg, #8b5cf6, #e5489d)" } : {}}>
              {isSuperAdmin ? "SA" : "PA"}
            </div>
            <div className="user-info">
              <span className="name">{user.name}</span>
              <span className="role-badge">{user.role}</span>
            </div>
            <button onClick={handleLogout} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer" }} title="Log Out">
              <Icons.logout style={{ width: "20px", height: "20px" }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar Selector Banner for evaluators */}
        <div className="quick-switch-banner">
          <span>💡 <b>Interactive Demo Sandbox:</b> Swap roles on-the-fly to test role permissions (RBAC) & Maker-Checker limits:</span>
          <select value={user.role} onChange={(e) => handleQuickSwitch(e.target.value)}>
            <option value="Platform Admin">Platform Admin (Maker)</option>
            <option value="Super Admin">Super Admin (Checker / Global)</option>
          </select>
        </div>

        <header className="admin-topbar">
          <span className="page-title" style={{ textTransform: "capitalize" }}>
            {activeTab} Management
          </span>
          <div className="topbar-actions">
            <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
              <span>{darkMode ? "◐" : "◑"}</span><span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === "dashboard" && (
            <DashboardView 
              kyc={kycList} 
              disputes={disputesList} 
              moderation={moderationList}
              tenants={tenantsList}
              user={user}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "kyc" && (
            <KycView 
              kyc={kycList} 
              onView={(item) => setSelectedKyc(item)} 
            />
          )}

          {activeTab === "disputes" && (
            <DisputesView 
              disputes={disputesList} 
              onView={(item) => setSelectedDispute(item)}
              user={user}
            />
          )}

          {activeTab === "moderation" && (
            <ModerationView 
              moderation={moderationList} 
              onAction={handleModAction}
            />
          )}

          {activeTab === "tenants" && isSuperAdmin && (
            <TenantsView 
              tenants={tenantsList} 
              newTenant={newTenant}
              onFormChange={setNewTenant}
              onCheckboxChange={handleTenantCheckboxChange}
              onSubmit={createTenant}
              featureFlags={featureFlags}
              onToggleFlag={toggleFeatureFlag}
            />
          )}

          {activeTab === "rbac" && (
            <RbacView 
              matrix={rbacMatrix} 
              user={user} 
              onToggle={toggleRbacPermission}
            />
          )}

          {activeTab === "audit" && (
            <AuditView 
              logs={auditLogs} 
            />
          )}
        </div>
      </main>

      {/* --- KYC DETAIL MODAL --- */}
      {selectedKyc && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>KYC Application: {selectedKyc.name}</h3>
              <button onClick={() => setSelectedKyc(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Applicant Name</span>
                  <span className="value">{selectedKyc.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Requested Account Type</span>
                  <span className="value">{selectedKyc.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Contact Email</span>
                  <span className="value">{selectedKyc.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Submission Date</span>
                  <span className="value">{selectedKyc.submitted}</span>
                </div>
              </div>

              <div className="detail-item" style={{ marginTop: "16px" }}>
                <span className="label">Submitted Document</span>
                <span className="value" style={{ fontWeight: "600", color: "var(--accent-2)" }}>{selectedKyc.docName}</span>
              </div>

              <div className="doc-preview-box">
                <Icons.doc />
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedKyc.docName}.pdf</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Reference Registration ID: <b>{selectedKyc.docNumber}</b></div>
                </div>
                <span className="badge-status pending" style={{ marginTop: "8px" }}>Secure OCR Handshake Valid</span>
              </div>

              {selectedKyc.status === "Pending" && (
                <div style={{ marginTop: "24px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--ink-3)", display: "block", marginBottom: "8px" }}>
                    Reason for rejection (Only required if rejecting)
                  </label>
                  <textarea 
                    className="form-control" 
                    placeholder="Enter notes why document is rejected..." 
                    style={{ width: "100%", height: "80px", resize: "none", boxSizing: "border-box" }}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-sm-ghost" onClick={() => setSelectedKyc(null)}>Cancel</button>
              {selectedKyc.status === "Pending" && (
                <React.Fragment>
                  <button className="btn-sm btn-sm-danger" onClick={() => rejectKyc(selectedKyc.id)}>Reject Verification</button>
                  <button className="btn-sm btn-sm-primary" onClick={() => approveKyc(selectedKyc.id)}><Icons.check />Approve Verified</button>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- DISPUTE DETAIL MODAL --- */}
      {selectedDispute && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Support Ticket &amp; Dispute: {selectedDispute.id}</h3>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Attendee Name</span>
                  <span className="value">{selectedDispute.user}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Refund Amount</span>
                  <span className="value" style={{ fontWeight: "700", color: "var(--accent-1)" }}>{selectedDispute.amount}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Target Event</span>
                  <span className="value">{selectedDispute.event}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Report Time</span>
                  <span className="value">{selectedDispute.submitted}</span>
                </div>
              </div>

              <div className="detail-item" style={{ marginTop: "16px" }}>
                <span className="label">Reason / Dispute Claim</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--ink-2)", lineHeight: "1.5" }}>
                  {selectedDispute.reason}
                </p>
              </div>

              <div className="maker-checker-alert">
                <Icons.shield />
                <div>
                  <div style={{ fontWeight: "600" }}>Maker-Checker Financial Safety Protocol</div>
                  <div>
                    Samaagum ledger requires one Platform Admin to initiate/request a refund, and a different Super Admin to confirm and settle the transaction.
                  </div>
                </div>
              </div>

              {selectedDispute.maker && (
                <div style={{ marginTop: "16px", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--ink-3)" }}>Maker Audit</div>
                  <div style={{ fontSize: "13px", color: "var(--ink)", marginTop: "4px" }}>
                    Refund requested by: <b>{selectedDispute.maker}</b>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-sm-ghost" onClick={() => setSelectedDispute(null)}>Close</button>
              
              {selectedDispute.status === "Open" && (
                <button className="btn-sm btn-sm-primary" onClick={() => initiateRefund(selectedDispute.id)}>
                  Initiate Refund (Maker Request)
                </button>
              )}

              {selectedDispute.status === "Refund Requested" && (
                isSuperAdmin ? (
                  <button className="btn-sm btn-sm-primary" style={{ background: "linear-gradient(135deg, #10b981, #0ea5a4)" }} onClick={() => approveRefund(selectedDispute.id)}>
                    <Icons.check /> Approve &amp; Settle Refund (Checker Approval)
                  </button>
                ) : (
                  <button className="btn-sm btn-sm-primary" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
                    Awaiting Super Admin Checker Approval
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS & VIEWS ---

// Login Form Component
function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="form-group">
        <label>Administrative Email</label>
        <input 
          type="email" 
          className="form-control" 
          placeholder="admin@samaagum.co" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Administrative Key/Password</label>
        <input 
          type="password" 
          className="form-control" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn-sm btn-sm-primary" style={{ width: "100%", padding: "12px", justifyContent: "center", fontSize: "14px", marginTop: "8px" }}>
        Authenticate &amp; Launch Console
      </button>
    </form>
  );
}

// Dashboard Home View
function DashboardView({ kyc, disputes, moderation, tenants, user, setActiveTab }) {
  const pendingKyc = kyc.filter(k => k.status === "Pending").length;
  const unresolvedDisputes = disputes.filter(d => d.status === "Open" || d.status === "Refund Requested").length;
  const pendingMod = moderation.filter(m => m.status === "Pending").length;
  const activeTenants = tenants.filter(t => t.status === "Active").length;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "28px", margin: "0 0 8px 0" }}>
          Welcome back, {user.name.split(" ")[0]}
        </h2>
        <p style={{ color: "var(--ink-2)", margin: 0, fontSize: "15px" }}>
          Here is the security and operational overview of Samaagum network.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab("kyc")} style={{ cursor: "pointer" }}>
          <div className="header">
            <span>Pending KYC Reviews</span>
            <Icons.shield style={{ color: "var(--accent-2)" }} />
          </div>
          <div className="value">{pendingKyc}</div>
          <div className="trend" style={{ color: pendingKyc > 0 ? "#f59e0b" : "#10b981", fontWeight: "600" }}>
            {pendingKyc > 0 ? "⚠️ Requires Triage" : "✓ Clear queue"}
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab("disputes")} style={{ cursor: "pointer" }}>
          <div className="header">
            <span>Open Support &amp; Disputes</span>
            <Icons.dispute style={{ color: "var(--accent-1)" }} />
          </div>
          <div className="value">{unresolvedDisputes}</div>
          <div className="trend" style={{ color: unresolvedDisputes > 0 ? "#ff6b4a" : "#10b981", fontWeight: "600" }}>
            {unresolvedDisputes > 0 ? "⚙ Awaiting Maker/Checker" : "✓ Settle Complete"}
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab("moderation")} style={{ cursor: "pointer" }}>
          <div className="header">
            <span>Moderation Flags</span>
            <Icons.alert style={{ color: "#ef4444" }} />
          </div>
          <div className="value">{pendingMod}</div>
          <div className="trend" style={{ color: pendingMod > 0 ? "#ef4444" : "#10b981", fontWeight: "600" }}>
            {pendingMod > 0 ? "🔥 Unresolved reports" : "✓ Safe space"}
          </div>
        </div>

        <div className="stat-card" onClick={() => user.role === "Super Admin" ? setActiveTab("tenants") : null} style={user.role === "Super Admin" ? { cursor: "pointer" } : {}}>
          <div className="header">
            <span>Active Tenants</span>
            <Icons.tenant style={{ color: "#10b981" }} />
          </div>
          <div className="value">{activeTenants}</div>
          <div className="trend up" style={{ fontWeight: "600" }}>
            ↑ Provisioned hubs
          </div>
        </div>
      </div>

      <div className="data-panel">
        <div className="panel-header">
          <h3>Recent Operations Pending Action</h3>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Age</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {kyc.filter(k => k.status === "Pending").slice(0, 2).map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "600" }}>{item.id}</td>
                  <td>{item.name}</td>
                  <td>Host KYC Document Review</td>
                  <td>{item.submitted}</td>
                  <td><span className="badge-status pending">Pending</span></td>
                  <td><button className="btn-sm btn-sm-ghost" onClick={() => setActiveTab("kyc")}>Review</button></td>
                </tr>
              ))}
              {disputes.filter(d => d.status === "Open" || d.status === "Refund Requested").slice(0, 2).map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "600" }}>{item.id}</td>
                  <td>{item.user} ({item.amount})</td>
                  <td>Ticket Refund &amp; Dispute</td>
                  <td>{item.submitted}</td>
                  <td>
                    <span className={`badge-status ${item.status === 'Refund Requested' ? 'pending' : 'open'}`}>
                      {item.status === 'Refund Requested' ? 'Refund Req' : 'Open'}
                    </span>
                  </td>
                  <td><button className="btn-sm btn-sm-ghost" onClick={() => setActiveTab("disputes")}>Investigate</button></td>
                </tr>
              ))}
              {kyc.filter(k => k.status === "Pending").length === 0 && disputes.filter(d => d.status === "Open" || d.status === "Refund Requested").length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}>
                    No pending operational issues. Samaagum is running smoothly.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// KYC Verification View
function KycView({ kyc, onView }) {
  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>KYC Verification Queue</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>Verify identification records for onboarding hosts.</p>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Document Type</th>
              <th>Document Number</th>
              <th>Submission Date</th>
              <th>Verification Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kyc.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: "600" }}>{item.id}</td>
                <td>
                  <div>
                    <span style={{ fontWeight: "600", display: "block" }}>{item.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{item.email}</span>
                  </div>
                </td>
                <td>{item.docName}</td>
                <td className="mono">{item.docNumber}</td>
                <td>{item.submitted}</td>
                <td>
                  <span className={`badge-status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="btn-sm btn-sm-ghost" onClick={() => onView(item)}>
                    {item.status === "Pending" ? "Review Docs" : "View Details"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Disputes & Refunds View
function DisputesView({ disputes, onView, user }) {
  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>Support &amp; Refund Disputes</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>Maker-Checker dual authorization matrix for settlements.</p>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Event Ticket</th>
              <th>Amount</th>
              <th>Dispute Case Reason</th>
              <th>Maker</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: "600" }}>{item.id}</td>
                <td>{item.user}</td>
                <td>{item.event}</td>
                <td style={{ fontWeight: "600", color: "var(--accent-1)" }}>{item.amount}</td>
                <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.reason}
                </td>
                <td style={{ fontSize: "12px", color: "var(--ink-2)" }}>{item.maker || "—"}</td>
                <td>
                  <span className={`badge-status ${item.status.replace(" ", "-").toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="btn-sm btn-sm-ghost" onClick={() => onView(item)}>
                    {item.status === "Closed" ? "Details" : "Process Action"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Moderation View
function ModerationView({ moderation, onAction }) {
  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>Trust &amp; Safety Moderation</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>Triage flags reported by participants and community admins.</p>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reporter</th>
              <th>Reported User</th>
              <th>Type</th>
              <th>Reported Content Preview</th>
              <th>Claim Reason</th>
              <th>Resolution Status</th>
              <th>Resolve Actions</th>
            </tr>
          </thead>
          <tbody>
            {moderation.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: "600" }}>{item.id}</td>
                <td>{item.reporter}</td>
                <td style={{ fontWeight: "600" }}>{item.reportedUser}</td>
                <td><span className="badge-status open" style={{ background: "rgba(109, 94, 252, 0.08)", color: "var(--accent-2)" }}>{item.entityType}</span></td>
                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <i>"{item.entityContent}"</i>
                </td>
                <td>{item.reason}</td>
                <td>
                  <span className={`badge-status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === "Pending" ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn-sm btn-sm-ghost" onClick={() => onAction(item.id, "Dismissed")}>
                        Dismiss
                      </button>
                      <button className="btn-sm btn-sm-danger" onClick={() => onAction(item.id, "Suspended")}>
                        Remove &amp; Ban
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tenants View (Super Admin only)
function TenantsView({ tenants, newTenant, onFormChange, onCheckboxChange, onSubmit, featureFlags, onToggleFlag }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px" }}>
      {/* List */}
      <div className="data-panel">
        <div className="panel-header">
          <h3>Provisioned Tenants</h3>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sub-Domain</th>
                <th>Plan tier</th>
                <th>Entitlements</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(item => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <span style={{ fontWeight: "600", display: "block" }}>{item.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--ink-3)", fontFamily: "monospace" }}>{item.slug}.samaagum.co</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "600", fontSize: "12px" }}>{item.plan}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {item.entitlements.map(e => (
                        <span key={e} className="mini-chip" style={{ fontSize: "10px", padding: "2px 6px" }}>{e}</span>
                      ))}
                      {item.entitlements.length === 0 && <span style={{ color: "var(--ink-3)", fontSize: "12px" }}>None</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${item.status === 'Active' ? 'verified' : 'pending'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Feature flags */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Form */}
        <div className="data-panel" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Provision New Tenant Hub</h3>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label>Tenant Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Indiranagar Tech Hub" 
                value={newTenant.name}
                onChange={(e) => onFormChange({ ...newTenant, name: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Subdomain Slug</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="indiranagar-tech" 
                value={newTenant.slug}
                onChange={(e) => onFormChange({ ...newTenant, slug: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Plan Tier</label>
              <select 
                className="form-control" 
                value={newTenant.plan}
                onChange={(e) => onFormChange({ ...newTenant, plan: e.target.value })}
              >
                <option value="Enterprise">Enterprise Tier</option>
                <option value="Standard">Standard Tier</option>
                <option value="Free Trial">Free Trial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Entitled Services</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={newTenant.entitlements.includes("Waitlist Priority Boosts")}
                    onChange={() => onCheckboxChange("Waitlist Priority Boosts")}
                  />
                  Waitlist Priority
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={newTenant.entitlements.includes("Offline Cash Payments")}
                    onChange={() => onCheckboxChange("Offline Cash Payments")}
                  />
                  Offline Cash proof
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={newTenant.entitlements.includes("PWA Check-in")}
                    onChange={() => onCheckboxChange("PWA Check-in")}
                  />
                  Offline PWA QR
                </label>
              </div>
            </div>

            <button type="submit" className="btn-sm btn-sm-primary" style={{ padding: "10px", justifyContent: "center", marginTop: "8px" }}>
              <Icons.plus /> Provision Workspace
            </button>
          </form>
        </div>

        {/* Feature flags */}
        <div className="data-panel" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>System-Wide Feature Flags</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {featureFlags.map(flag => (
              <div key={flag.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: "600" }}>{flag.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>{flag.desc}</div>
                </div>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={flag.active}
                    onChange={() => onToggleFlag(flag.id)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// RBAC View
function RbacView({ matrix, user, onToggle }) {
  const isSuper = user.role === "Super Admin";
  const allRoles = ["Participant", "Event Host", "Group Organizer", "Community Admin", "Platform Admin", "Super Admin"];

  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>Global Role-Based Access Control (RBAC)</h3>
        {!isSuper && (
          <span style={{ fontSize: "12px", color: "var(--ink-3)", background: "var(--surface-2)", padding: "4px 10px", borderRadius: "12px" }}>
            🔒 Read-only. Super Admin authorization required to modify.
          </span>
        )}
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "300px" }}>Permission Metric</th>
              {allRoles.map(role => (
                <th key={role} style={{ textAlign: "center", fontSize: "12px" }}>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(row => (
              <tr key={row.permission}>
                <td>
                  <div>
                    <span style={{ fontWeight: "600", display: "block" }}>{row.permission}</span>
                    <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{row.desc}</span>
                  </div>
                </td>
                {allRoles.map(role => {
                  const allowed = row.roles.includes(role);
                  return (
                    <td key={role} style={{ textAlign: "center" }}>
                      <input 
                        type="checkbox" 
                        checked={allowed} 
                        disabled={!isSuper}
                        onChange={() => onToggle(row.permission, role)}
                        style={{ 
                          width: "16px", 
                          height: "16px", 
                          accentColor: "var(--accent-2)", 
                          cursor: isSuper ? "pointer" : "not-allowed",
                          opacity: allowed ? 1 : 0.25
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// System Audit Logs View
function AuditView({ logs }) {
  return (
    <div className="data-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>System Audit Logs Terminal</h3>
        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--accent-1)" }}>● LIVE MONITOR FEED</span>
      </div>
      
      <div className="audit-terminal">
        {logs.map((log, idx) => (
          <div key={idx} className="log-line">
            <span className="time">[{log.time}]</span>
            <span className="actor">{log.actor}</span>: 
            <span className="action"> {log.action}</span>
          </div>
        ))}
        <div style={{ color: "#10b981", fontSize: "11px", marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "12px" }}>
          * End of real-time stream. Awaiting administrative state changes.
        </div>
      </div>
    </div>
  );
}

// Export for Babel Standalone usage
window.App = App;
