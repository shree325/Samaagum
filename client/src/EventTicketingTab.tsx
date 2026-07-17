import React, { useState, useEffect } from 'react';

interface EventTicketingTabProps {
  e: any;
  apiBase: string;
  token: string | null;
  isTicketManager: boolean;
  isPaidEvent: boolean;
}

export function EventTicketingTab({
  e,
  apiBase,
  token,
  isTicketManager,
  isPaidEvent
}: EventTicketingTabProps) {
  const [tcTab, setTcTab] = useState("tickets");
  const [tcLoading, setTcLoading] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [tcCoupons, setTcCoupons] = useState<any[]>([]);
  const [tcReferrals, setTcReferrals] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [couponSearch, setCouponSearch] = useState("");
  const [referralSearch, setReferralSearch] = useState("");

  // Ticket modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [ticketForm, setTicketForm] = useState({
    name: "", description: "", price: "", currency: "INR", capacity: "",
    max_per_booking: "", sale_start: "", sale_end: "", early_bird_price: "",
    early_bird_currency: "INR", early_bird_ends_at: "", visibility: "public"
  });

  // Coupon modal state
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [couponForm, setCouponForm] = useState({
    code: "", discount_type: "percent", discount_value: "", currency: "INR",
    valid_from: "", valid_to: "", max_total: "", max_per_user: "", status: "active"
  });

  // Referral modal state
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<any>(null);
  const [referralForm, setReferralForm] = useState({ code: "", affiliate_id: "", commission_rule: "" });

  const fetchTicketTypes = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/ticket-types`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setTicketTypes(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTcCoupons = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/coupons`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setTcCoupons(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTcReferrals = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/referrals`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setTcReferrals(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAffiliates = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/affiliates`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setAffiliates(data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (isTicketManager && isPaidEvent) {
      setTcLoading(true);
      Promise.all([fetchTicketTypes(), fetchTcCoupons(), fetchTcReferrals(), fetchAffiliates()])
        .finally(() => setTcLoading(false));
    }
  }, [e.id]);

  const handleTicketSubmit = async () => {
    if (!ticketForm.name.trim()) { if (window.toast) window.toast("Ticket name is required", "warning"); return; }
    if (!ticketForm.description.trim()) { if (window.toast) window.toast("Description is required", "warning"); return; }
    if (!ticketForm.price || String(ticketForm.price).trim() === "") { if (window.toast) window.toast("Price is required", "warning"); return; }
    try {
      const url = editingTicket
        ? `${apiBase}/api/events/${e.id}/ticket-types/${editingTicket.id}`
        : `${apiBase}/api/events/${e.id}/ticket-types`;
      const method = editingTicket ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: JSON.stringify(ticketForm) });
      const data = await res.json();
      if (data.success) {
        if (window.toast) window.toast(editingTicket ? "Ticket updated ✓" : "Ticket created ✓", "success");
        setTicketModalOpen(false); setEditingTicket(null);
        setTicketForm({ name: "", description: "", price: "", currency: "INR", capacity: "", max_per_booking: "", sale_start: "", sale_end: "", early_bird_price: "", early_bird_currency: "INR", early_bird_ends_at: "", visibility: "public" });
        await fetchTicketTypes();
      } else { if (window.toast) window.toast(data.message || "Error saving ticket", "error"); }
    } catch (err) { if (window.toast) window.toast("Network error", "error"); }
  };

  const handleTicketDelete = async (tt: any) => {
    if (!confirm(`Delete ticket "${tt.name}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/ticket-types/${tt.id}`, { method: "DELETE", headers: token ? { "Authorization": `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) { if (window.toast) window.toast("Ticket deleted", "success"); await fetchTicketTypes(); }
      else { if (window.toast) window.toast(data.message || "Error deleting ticket", "error"); }
    } catch (err) { if (window.toast) window.toast("Network error", "error"); }
  };

  const handleCouponSubmit = async () => {
    if (!couponForm.code.trim()) { if (window.toast) window.toast("Coupon code is required", "warning"); return; }
    if (!couponForm.discount_value || String(couponForm.discount_value).trim() === "") { if (window.toast) window.toast("Discount value is required", "warning"); return; }
    try {
      const url = editingCoupon
        ? `${apiBase}/api/events/${e.id}/coupons/${editingCoupon.id}`
        : `${apiBase}/api/events/${e.id}/coupons`;
      const method = editingCoupon ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: JSON.stringify(couponForm) });
      const data = await res.json();
      if (data.success) {
        if (window.toast) window.toast(editingCoupon ? "Coupon updated ✓" : "Coupon created ✓", "success");
        setCouponModalOpen(false); setEditingCoupon(null);
        setCouponForm({ code: "", discount_type: "percent", discount_value: "", currency: "INR", valid_from: "", valid_to: "", max_total: "", max_per_user: "", status: "active" });
        await fetchTcCoupons();
      } else { if (window.toast) window.toast(data.message || "Error saving coupon", "error"); }
    } catch (err) { if (window.toast) window.toast("Network error", "error"); }
  };

  const handleCouponDelete = async (c: any) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/coupons/${c.id}`, { method: "DELETE", headers: token ? { "Authorization": `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) { if (window.toast) window.toast("Coupon deleted", "success"); await fetchTcCoupons(); }
      else { if (window.toast) window.toast(data.message || "Error deleting coupon", "error"); }
    } catch (err) { if (window.toast) window.toast("Network error", "error"); }
  };

  const handleReferralSubmit = async () => {
    if (!referralForm.code.trim()) { if (window.toast) window.toast("Referral code is required", "warning"); return; }
    if (!referralForm.affiliate_id) { if (window.toast) window.toast("Affiliate is required", "warning"); return; }
    try {
      const url = editingReferral
        ? `${apiBase}/api/events/${e.id}/referrals/${editingReferral.id}`
        : `${apiBase}/api/events/${e.id}/referrals`;
      const method = editingReferral ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: JSON.stringify(referralForm) });
      const data = await res.json();
      if (data.success) {
        if (window.toast) window.toast(editingReferral ? "Referral updated ✓" : "Referral created ✓", "success");
        setReferralModalOpen(false); setEditingReferral(null);
        setReferralForm({ code: "", affiliate_id: "", commission_rule: "" });
        await fetchTcReferrals();
      } else { if (window.toast) window.toast(data.message || "Error saving referral", "error"); }
    } catch (err) { if (window.toast) window.toast("Network error", "error"); }
  };

  const handleReferralDelete = async (r: any) => {
    if (!confirm(`Delete referral link "${r.code}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/referrals/${r.id}`, { method: "DELETE", headers: token ? { "Authorization": `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) { if (window.toast) window.toast("Referral deleted", "success"); await fetchTcReferrals(); }
      else { if (window.toast) window.toast(data.message || "Error deleting referral", "error"); }
    } catch (err) { if (window.toast) window.toast("Network error", "error"); }
  };

  const fmtPrice = (minor: any, currency: string) => minor != null ? `${currency || "INR"} ${(minor / 100).toFixed(2)}` : "—";
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString() : "—";

  const filteredTickets = ticketTypes.filter(t => t.name?.toLowerCase().includes(ticketSearch.toLowerCase()));
  const filteredCoupons = tcCoupons.filter(c => c.code?.toLowerCase().includes(couponSearch.toLowerCase()));
  const filteredReferrals = tcReferrals.filter(r =>
    r.code?.toLowerCase().includes(referralSearch.toLowerCase()) ||
    r.affiliate_name?.toLowerCase().includes(referralSearch.toLowerCase())
  );

  const TC_ACCENT = "var(--accent-2)";
  const fieldStyle = { display: "flex", flexDirection: "column" as const, gap: 4 };
  const labelStyle = { fontSize: 11 as const, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase" as const, letterSpacing: "0.05em" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Section Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🎟 Ticketing & Coupons</h3>
        {tcLoading && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Loading...</span>}
      </div>

      {/* Inner Sub-Tab Bar */}
      <div style={{ display: "flex", gap: 0, background: "var(--bg-2)", borderRadius: "var(--r-md)", padding: 4, marginBottom: 20, border: "1px solid var(--border)" }}>
        {[["tickets", "🎫 Tickets"], ["coupons", "🏷 Coupons"], ["referrals", "🔗 Referrals"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTcTab(key)}
            style={{
              flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
              borderRadius: "var(--r-sm)", transition: "all 0.15s",
              background: tcTab === key ? TC_ACCENT : "transparent",
              color: tcTab === key ? "#fff" : "var(--ink-3)"
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Tickets Sub-Tab ── */}
      {tcTab === "tickets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Search + Add */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="cinput" placeholder="Search tickets..." value={ticketSearch} onChange={ev => setTicketSearch(ev.target.value)} style={{ flex: 1, height: 38 }} />
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => { setEditingTicket(null); setTicketForm({ name: "", description: "", price: "", currency: "INR", capacity: "", max_per_booking: "", sale_start: "", sale_end: "", early_bird_price: "", early_bird_currency: "INR", early_bird_ends_at: "", visibility: "public" }); setTicketModalOpen(true); }}>+ Add Ticket</button>
          </div>

          {/* List */}
          {filteredTickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No ticket types yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Create your first ticket type to get started.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredTickets.map(tt => (
                <div key={tt.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{tt.name}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: tt.visibility === "public" ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)", color: tt.visibility === "public" ? "#16a34a" : "#7c3aed", fontWeight: 600, textTransform: "capitalize" }}>{tt.visibility}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                      <span>💰 {fmtPrice(tt.price_amount_minor, tt.price_currency)}</span>
                      {tt.capacity && <span>👥 Cap: {tt.capacity}</span>}
                      {tt.sale_start && <span>📅 {fmtDate(tt.sale_start)} – {fmtDate(tt.sale_end)}</span>}
                      <span>Created {fmtDate(tt.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                      setEditingTicket(tt);
                      setTicketForm({ name: tt.name || "", description: tt.description || "", price: tt.price_amount_minor != null ? String(tt.price_amount_minor / 100) : "", currency: tt.price_currency || "INR", capacity: tt.capacity ? String(tt.capacity) : "", max_per_booking: tt.max_per_booking ? String(tt.max_per_booking) : "", sale_start: tt.sale_start ? tt.sale_start.replace("Z", "").slice(0, 16) : "", sale_end: tt.sale_end ? tt.sale_end.replace("Z", "").slice(0, 16) : "", early_bird_price: tt.early_bird_price_amount_minor != null ? String(tt.early_bird_price_amount_minor / 100) : "", early_bird_currency: tt.early_bird_price_currency || "INR", early_bird_ends_at: tt.early_bird_ends_at ? tt.early_bird_ends_at.replace("Z", "").slice(0, 16) : "", visibility: tt.visibility || "public" });
                      setTicketModalOpen(true);
                    }}>Edit</button>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#ef4444" }} onClick={() => handleTicketDelete(tt)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Coupons Sub-Tab ── */}
      {tcTab === "coupons" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="cinput" placeholder="Search coupons..." value={couponSearch} onChange={ev => setCouponSearch(ev.target.value)} style={{ flex: 1, height: 38 }} />
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discount_type: "percent", discount_value: "", currency: "INR", valid_from: "", valid_to: "", max_total: "", max_per_user: "", status: "active" }); setCouponModalOpen(true); }}>+ Add Coupon</button>
          </div>

          {filteredCoupons.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏷</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No coupons yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Create discount coupons for your attendees.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredCoupons.map(c => (
                <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", background: "var(--bg-2)", padding: "2px 8px", borderRadius: 6 }}>{c.code}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: c.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: c.status === "active" ? "#16a34a" : "#ef4444", fontWeight: 600, textTransform: "capitalize" }}>{c.status}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                      <span>💸 {c.discount_type === "percent" ? `${c.discount_percent}% off` : fmtPrice(c.discount_amount_minor, c.discount_currency)}</span>
                      {c.valid_from && <span>📅 {fmtDate(c.valid_from)} – {fmtDate(c.valid_to)}</span>}
                      {c.max_total && <span>🔢 Max {c.max_total} uses</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                      setEditingCoupon(c);
                      setCouponForm({ code: c.code || "", discount_type: c.discount_type || "percent", discount_value: c.discount_type === "percent" ? String(c.discount_percent || "") : String((c.discount_amount_minor || 0) / 100), currency: c.discount_currency || "INR", valid_from: c.valid_from ? c.valid_from.replace("Z", "").slice(0, 16) : "", valid_to: c.valid_to ? c.valid_to.replace("Z", "").slice(0, 16) : "", max_total: c.max_total ? String(c.max_total) : "", max_per_user: c.max_per_user ? String(c.max_per_user) : "", status: c.status || "active" });
                      setCouponModalOpen(true);
                    }}>Edit</button>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#ef4444" }} onClick={() => handleCouponDelete(c)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Referrals Sub-Tab ── */}
      {tcTab === "referrals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input className="cinput" placeholder="Search referrals..." value={referralSearch} onChange={ev => setReferralSearch(ev.target.value)} style={{ flex: 1, height: 38 }} />
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => { setEditingReferral(null); setReferralForm({ code: "", affiliate_id: affiliates[0]?.id || "", commission_rule: "" }); setReferralModalOpen(true); }}>+ Add Referral</button>
          </div>

          {filteredReferrals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No referral links yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Create affiliate referral links to track registrations.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredReferrals.map(r => (
                <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", background: "var(--bg-2)", padding: "2px 8px", borderRadius: 6 }}>{r.code}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                      <span>👤 {r.affiliate_name}</span>
                      <span>📅 Created {fmtDate(r.created_at)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                      setEditingReferral(r);
                      setReferralForm({ code: r.code || "", affiliate_id: r.affiliate_id || "", commission_rule: r.commission_rule ? (typeof r.commission_rule === "string" ? r.commission_rule : JSON.stringify(r.commission_rule, null, 2)) : "" });
                      setReferralModalOpen(true);
                    }}>Edit</button>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#ef4444" }} onClick={() => handleReferralDelete(r)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Type Modal */}
      {ticketModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", width: "min(560px,95vw)", maxHeight: "88vh", overflowY: "auto", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingTicket ? "Edit Ticket" : "Create Ticket"}</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setTicketModalOpen(false)} style={{ border: "none" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldStyle}><label style={labelStyle}>Ticket Name *</label><input className="cinput" value={ticketForm.name} onChange={ev => setTicketForm(f => ({...f, name: ev.target.value}))} placeholder="e.g. General Admission" /></div>
              <div style={fieldStyle}><label style={labelStyle}>Description *</label><textarea className="cinput" value={ticketForm.description} onChange={ev => setTicketForm(f => ({...f, description: ev.target.value}))} placeholder="What's included..." rows={2} style={{ resize: "vertical" }} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Price *</label><input className="cinput" type="number" min="0" step="0.01" value={ticketForm.price} onChange={ev => setTicketForm(f => ({...f, price: ev.target.value}))} placeholder="0.00" /></div>
                <div style={fieldStyle}><label style={labelStyle}>Currency</label><input className="cinput" value={ticketForm.currency} onChange={ev => setTicketForm(f => ({...f, currency: ev.target.value}))} placeholder="INR" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Capacity</label><input className="cinput" type="number" min="1" value={ticketForm.capacity} onChange={ev => setTicketForm(f => ({...f, capacity: ev.target.value}))} placeholder="Unlimited" /></div>
                <div style={fieldStyle}><label style={labelStyle}>Max per Booking</label><input className="cinput" type="number" min="1" value={ticketForm.max_per_booking} onChange={ev => setTicketForm(f => ({...f, max_per_booking: ev.target.value}))} placeholder="No limit" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Sale Start</label><input className="cinput" type="datetime-local" value={ticketForm.sale_start} onChange={ev => setTicketForm(f => ({...f, sale_start: ev.target.value}))} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Sale End</label><input className="cinput" type="datetime-local" value={ticketForm.sale_end} onChange={ev => setTicketForm(f => ({...f, sale_end: ev.target.value}))} /></div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Visibility</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {["public", "private"].map(v => (
                    <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      <input type="radio" name="tt_vis" value={v} checked={ticketForm.visibility === v} onChange={() => setTicketForm(f => ({...f, visibility: v}))} style={{ accentColor: TC_ACCENT }} />
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setTicketModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={handleTicketSubmit}>{editingTicket ? "Save Changes" : "Create Ticket"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", width: "min(520px,95vw)", maxHeight: "88vh", overflowY: "auto", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingCoupon ? "Edit Coupon" : "New Coupon"}</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setCouponModalOpen(false)} style={{ border: "none" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldStyle}><label style={labelStyle}>Coupon Code *</label><input className="cinput" value={couponForm.code} onChange={ev => setCouponForm(f => ({...f, code: ev.target.value.toUpperCase()}))} placeholder="e.g. EARLY20" style={{ textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }} /></div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Discount Type *</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {[["percent", "Percentage (%)"], ["flat", "Fixed Amount"]].map(([v, l]) => (
                    <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      <input type="radio" name="coup_type" value={v} checked={couponForm.discount_type === v} onChange={() => setCouponForm(f => ({...f, discount_type: v}))} style={{ accentColor: TC_ACCENT }} />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: couponForm.discount_type === "flat" ? "1fr 1fr" : "1fr", gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Discount Value *</label><input className="cinput" type="number" min="0" step="0.01" value={couponForm.discount_value} onChange={ev => setCouponForm(f => ({...f, discount_value: ev.target.value}))} placeholder={couponForm.discount_type === "percent" ? "e.g. 20" : "e.g. 500"} /></div>
                {couponForm.discount_type === "flat" && <div style={fieldStyle}><label style={labelStyle}>Currency</label><input className="cinput" value={couponForm.currency} onChange={ev => setCouponForm(f => ({...f, currency: ev.target.value}))} placeholder="INR" /></div>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Valid From</label><input className="cinput" type="datetime-local" value={couponForm.valid_from} onChange={ev => setCouponForm(f => ({...f, valid_from: ev.target.value}))} /></div>
                <div style={fieldStyle}><label style={labelStyle}>Valid To</label><input className="cinput" type="datetime-local" value={couponForm.valid_to} onChange={ev => setCouponForm(f => ({...f, valid_to: ev.target.value}))} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={fieldStyle}><label style={labelStyle}>Max Total Uses</label><input className="cinput" type="number" min="1" value={couponForm.max_total} onChange={ev => setCouponForm(f => ({...f, max_total: ev.target.value}))} placeholder="Unlimited" /></div>
                <div style={fieldStyle}><label style={labelStyle}>Max Per User</label><input className="cinput" type="number" min="1" value={couponForm.max_per_user} onChange={ev => setCouponForm(f => ({...f, max_per_user: ev.target.value}))} placeholder="Unlimited" /></div>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Status</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {["active", "inactive"].map(v => (
                    <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      <input type="radio" name="coup_status" value={v} checked={couponForm.status === v} onChange={() => setCouponForm(f => ({...f, status: v}))} style={{ accentColor: TC_ACCENT }} />
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setCouponModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={handleCouponSubmit}>{editingCoupon ? "Save Changes" : "Create Coupon"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {referralModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--surface)", width: "min(480px,95vw)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingReferral ? "Edit Referral Link" : "New Referral Link"}</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setReferralModalOpen(false)} style={{ border: "none" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={fieldStyle}><label style={labelStyle}>Referral Code *</label><input className="cinput" value={referralForm.code} onChange={ev => setReferralForm(f => ({...f, code: ev.target.value.toUpperCase()}))} placeholder="e.g. JOHN2024" style={{ textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }} /></div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Affiliate *</label>
                {affiliates.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--ink-3)", padding: 12, border: "1px dashed var(--border)", borderRadius: "var(--r-md)", textAlign: "center" }}>No affiliates found in your account.</div>
                ) : (
                  <select className="cselect" value={referralForm.affiliate_id} onChange={ev => setReferralForm(f => ({...f, affiliate_id: ev.target.value}))} style={{ background: "var(--field)", border: "1px solid var(--border)" }}>
                    <option value="">Select affiliate...</option>
                    {affiliates.map(a => <option key={a.id} value={a.id}>{a.name} {a.email ? `(${a.email})` : ""}</option>)}
                  </select>
                )}
              </div>
              <div style={fieldStyle}><label style={labelStyle}>Commission Rule (JSON / Text)</label><textarea className="cinput" value={referralForm.commission_rule} onChange={ev => setReferralForm(f => ({...f, commission_rule: ev.target.value}))} placeholder='{"type":"percent","value":10} or "10% per booking"' rows={3} style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setReferralModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={handleReferralSubmit}>{editingReferral ? "Save Changes" : "Create Referral"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
