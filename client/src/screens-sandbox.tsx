// @ts-nocheck
/* ============================================================
   Samaagum Spec Explorer & Screen Sandbox
   High-fidelity, interactive sandbox for 94 screens.
   ============================================================ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SCREENS_SPEC = [
  { id: "S-001", name: "Authenticated app shell", area: "Shell", exp: "Shared", purpose: "Nav + entry after login", state: "L,X", phase: "MVP-0", action: { type: "native", view: "home" } },
  { id: "S-002", name: "OTP email entry", area: "Auth", exp: "User", purpose: "Enter email for OTP", state: "L,X", phase: "MVP-0", action: { type: "url", url: "Samaagum Auth.html" } },
  { id: "S-003", name: "OTP verify", area: "Auth", exp: "User", purpose: "Enter code", state: "L,X (lockout)", phase: "MVP-0", action: { type: "url", url: "Samaagum Auth.html" } },
  { id: "S-004", name: "Social sign-in", area: "Auth", exp: "User", purpose: "Provider select + linking", state: "L,X", phase: "MVP-0", action: { type: "url", url: "Samaagum Auth.html" } },
  { id: "S-005", name: "Consent", area: "Auth", exp: "User", purpose: "T&C/privacy accept", state: "X", phase: "MVP-0", action: { type: "simulated", mockId: "consent" } },
  { id: "S-006", name: "Profiling: DOB", area: "Profile", exp: "User", purpose: "Capture DOB (blocking)", state: "X", phase: "MVP-0", action: { type: "simulated", mockId: "dob_profiling" } },
  { id: "S-007", name: "Profiling: interests", area: "Profile", exp: "User", purpose: "Pick 1-3 categories", state: "X", phase: "MVP-0", action: { type: "url", url: "Samaagum Auth.html" } },
  { id: "S-008", name: "Profiling: location", area: "Profile", exp: "User", purpose: "Permission or manual city", state: "X,R (denied)", phase: "MVP-0", action: { type: "url", url: "Samaagum Auth.html" } },
  { id: "S-150", name: "First-run onboarding", area: "System", exp: "User", purpose: "Welcome/guide", state: "—", phase: "MVP-0", action: { type: "simulated", mockId: "onboarding" } },
  { id: "S-010", name: "My Profile", area: "Profile", exp: "User", purpose: "View own profile + activity", state: "L", phase: "MVP-0", action: { type: "native", view: "profile" } },
  { id: "S-011", name: "Profile editor", area: "Profile", exp: "User", purpose: "Edit + template", state: "L,X,S", phase: "MVP-0", action: { type: "simulated", mockId: "profile_editor" } },
  { id: "S-012", name: "Public profile", area: "Profile", exp: "User", purpose: "Shareable page (TAPOnn)", state: "L,R (private)", phase: "MVP-0", action: { type: "native", view: "profile" } },
  { id: "S-013", name: "Share sheet", area: "Profile", exp: "User", purpose: "QR/vCard/NFC", state: "L (NFC write),X", phase: "MVP-0", action: { type: "simulated", mockId: "share_sheet" } },
  { id: "S-014", name: "Privacy & data controls", area: "Profile", exp: "User", purpose: "Per-field privacy, export, delete", state: "X", phase: "MVP-0", action: { type: "simulated", mockId: "privacy_controls" } },
  { id: "S-050", name: "Discovery feed", area: "Discovery", exp: "User", purpose: "Main recommendations & rails", state: "L,X", phase: "MVP-0", action: { type: "native", view: "home" } },
  { id: "S-051", name: "Filters & search", area: "Discovery", exp: "User", purpose: "Text search + tag filters", state: "L,X", phase: "MVP-0", action: { type: "native", view: "discover" } },
  { id: "S-052", name: "Search results", area: "Discovery", exp: "User", purpose: "Matches by event/group/person", state: "L,X,S (empty)", phase: "MVP-0", action: { type: "native", view: "discover" } },
  { id: "S-040", name: "Wishlist", area: "Saved", exp: "User", purpose: "Saved events/groups list", state: "L,X,S (empty)", phase: "MVP-0", action: { type: "native", view: "home" } },
  { id: "S-020", name: "Groups discovery", area: "Community", exp: "User", purpose: "Joinable directories", state: "L,X", phase: "MVP-0", action: { type: "native", view: "discover" } },
  { id: "S-021", name: "Group/community page", area: "Community", exp: "User", purpose: "Feed + info + upcoming", state: "L,R (members-only)", phase: "MVP-0", action: { type: "native", view: "group", param: "g1" } },
  { id: "S-023", name: "Join + questionnaire", area: "Community", exp: "User", purpose: "Form input for private groups", state: "L,X,S", phase: "MVP-0", action: { type: "simulated", mockId: "join_questionnaire" } },
  { id: "S-030", name: "Forum thread list", area: "Community", exp: "User", purpose: "Discussions list inside group", state: "L,X", phase: "MVP-0", action: { type: "native", view: "group", param: "g1" } },
  { id: "S-031", name: "Post detail", area: "Community", exp: "User", purpose: "Full text + comments", state: "L,X", phase: "MVP-0", action: { type: "native", view: "group", param: "g1" } },
  { id: "S-032", name: "Post composer", area: "Community", exp: "User", purpose: "Rich text + attachments", state: "L,X,S (drafts)", phase: "MVP-0", action: { type: "simulated", mockId: "post_composer" } },
  { id: "S-033", name: "Gallery grid", area: "Community", exp: "User", purpose: "Media grid from events", state: "L,X", phase: "MVP-0", action: { type: "native", view: "group", param: "g1" } },
  { id: "S-034", name: "Media viewer", area: "Community", exp: "User", purpose: "Lightbox for photos/videos", state: "L", phase: "MVP-0", action: { type: "simulated", mockId: "media_lightbox" } },
  { id: "S-035", name: "Reviews list", area: "Community", exp: "User", purpose: "Reviews & ratings on group", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "reviews_list" } },
  { id: "S-036", name: "Review composer", area: "Community", exp: "User", purpose: "Submit rating + text", state: "L,X,S (restricted)", phase: "MVP-0", action: { type: "simulated", mockId: "review_composer" } },
  { id: "S-110r", name: "Report dialog", area: "Trust", exp: "Shared", purpose: "Flag content/users", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "report_dialog" } },
  { id: "S-080", name: "Checkout: tickets", area: "Booking", exp: "User", purpose: "Tier selection & quantity", state: "L,X,S (sold out)", phase: "MVP-0", action: { type: "native", view: "event", param: "e2" } },
  { id: "S-081", name: "Checkout: attendees", area: "Booking", exp: "User", purpose: "Collect custom registration info", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "checkout_attendees" } },
  { id: "S-082", name: "Checkout: payment", area: "Booking", exp: "User", purpose: "Gateway sheet (Razorpay)", state: "L,R (failed gateway)", phase: "MVP-0", action: { type: "simulated", mockId: "checkout_payment" } },
  { id: "S-083", name: "Coupon entry", area: "Booking", exp: "User", purpose: "Apply promo discount", state: "L,R (invalid/expired)", phase: "MVP-0", action: { type: "simulated", mockId: "coupon_entry" } },
  { id: "S-084", name: "Booking confirmation", area: "Booking", exp: "User", purpose: "Success screen + calendar export", state: "L", phase: "MVP-0", action: { type: "simulated", mockId: "booking_confirmation" } },
  { id: "S-085", name: "My Tickets", area: "Tickets", exp: "User", purpose: "List of upcoming bookings", state: "L,X,S (empty)", phase: "MVP-0", action: { type: "native", view: "events" } },
  { id: "S-086", name: "Ticket detail", area: "Tickets", exp: "User", purpose: "QR + host scan view", state: "L,R (refunded)", phase: "MVP-0", action: { type: "simulated", mockId: "ticket_detail" } },
  { id: "S-087", name: "Cash payment", area: "Payments", exp: "User", purpose: "Instructions for offline cash", state: "L,R (upload receipt)", phase: "MVP-0", action: { type: "simulated", mockId: "cash_payment" } },
  { id: "S-088", name: "RSVP / approval", area: "Booking", exp: "User", purpose: "Awaiting host approval state", state: "L", phase: "MVP-0", action: { type: "simulated", mockId: "rsvp_approval" } },
  { id: "S-160", name: "Waitlist join & status", area: "Waitlist", exp: "User", purpose: "Waitlist position + boost share", state: "L,X,S (boosted)", phase: "MVP-0", action: { type: "simulated", mockId: "waitlist_status" } },
  { id: "S-161", name: "Waitlist invite & claim", area: "Waitlist", exp: "User", purpose: "Claim ticket within timer window", state: "L,R (expired claim)", phase: "MVP-0", action: { type: "simulated", mockId: "waitlist_claim" } },
  { id: "S-090", name: "Claim landing", area: "Claim", exp: "User", purpose: "Claim profile/ticket via invite link", state: "L", phase: "MVP-0", action: { type: "simulated", mockId: "claim_landing" } },
  { id: "S-091", name: "Claim OTP", area: "Claim", exp: "User", purpose: "Verify OTP to claim profile", state: "L,X (resend timer)", phase: "MVP-0", action: { type: "simulated", mockId: "claim_otp" } },
  { id: "S-140", name: "Notification center", area: "Notifications", exp: "User", purpose: "Inbox for activity logs", state: "L,X,S (empty)", phase: "MVP-0", action: { type: "native", view: "notifications" } },
  { id: "S-141", name: "Push & preferences", area: "Notifications", exp: "User", purpose: "Granular channel switches", state: "L", phase: "MVP-0", action: { type: "simulated", mockId: "push_preferences" } },
  { id: "S-060", name: "Connections", area: "Messaging", exp: "User", purpose: "List of mutual connects", state: "L,X", phase: "MVP-0", action: { type: "native", view: "messages" } },
  { id: "S-061", name: "Connection requests", area: "Messaging", exp: "User", purpose: "Incoming requests queue", state: "L,X", phase: "MVP-0", action: { type: "native", view: "messages" } },
  { id: "S-062", name: "DM thread", area: "Messaging", exp: "User", purpose: "1-on-1 chat console", state: "L,X", phase: "MVP-0", action: { type: "native", view: "messages" } },
  { id: "S-151", name: "Help center", area: "System", exp: "User", purpose: "FAQs + search", state: "—", phase: "MVP-0", action: { type: "simulated", mockId: "help_center" } },
  { id: "S-152", name: "Support ticket", area: "System", exp: "User", purpose: "Submit case to admin", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "support_ticket" } },
  { id: "S-070", name: "Event create/edit wizard", area: "Events", exp: "Host", purpose: "Primary wizard with preview", state: "L,X,S (drafts)", phase: "MVP-0", action: { type: "native", view: "create-event" } },
  { id: "S-071", name: "Event public page", area: "Events", exp: "Host", purpose: "Shareable event detail", state: "L,R (draft mode)", phase: "MVP-0", action: { type: "native", view: "event", param: "e1" } },
  { id: "S-072", name: "Ticket config", area: "Events", exp: "Host", purpose: "Capacity, limits, hidden tiers", state: "L,X", phase: "MVP-0", action: { type: "native", view: "create-event" } },
  { id: "S-073", name: "Custom fields config", area: "Events", exp: "Host", purpose: "Form builder for registration questionnaire", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "custom_fields" } },
  { id: "S-074", name: "Event settings", area: "Events", exp: "Host", purpose: "Privacy, SEO, transfer ownership", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "event_settings" } },
  { id: "S-201", name: "Reschedule / cancel", area: "Events", exp: "Host", purpose: "Cancel event, trigger mass refund notifications", state: "L,R (mass refund lock)", phase: "MVP-1", action: { type: "simulated", mockId: "event_reschedule" } },
  { id: "S-075", name: "Event team management", area: "Events", exp: "Host", purpose: "Add check-in staff / co-hosts", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "event_team" } },
  { id: "S-202", name: "Waitlist management", area: "Waitlist", exp: "Host", purpose: "Approve, release spots, auto-release timers", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "waitlist_management" } },
  { id: "S-203", name: "Event analytics", area: "Analytics", exp: "Host", purpose: "RSVP conversion, views, source attribution", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "event_analytics" } },
  { id: "S-204", name: "Attendee broadcast", area: "Communication", exp: "Host", purpose: "Send email/SMS to registered users", state: "L,X,S (drafts)", phase: "MVP-1", action: { type: "simulated", mockId: "attendee_broadcast" } },
  { id: "S-063", name: "Organizer inbox", area: "Messaging", exp: "Host", purpose: "Support tickets & group join queries", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "organizer_inbox" } },
  { id: "S-121", name: "Attendee list / registrations", area: "Organizer", exp: "Host", purpose: "Searchable table of registrations", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "attendee_list" } },
  { id: "S-122", name: "Cash queue", area: "Organizer", exp: "Host", purpose: "Approve cash payments to release tickets", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "cash_queue" } },
  { id: "S-123", name: "Approval queue", area: "Organizer", exp: "Host", purpose: "RSVP triage queue", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "approval_queue" } },
  { id: "S-124", name: "Exports", area: "Organizer", exp: "Host", purpose: "CSV, XLSX, PDF generation", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "exports" } },
  { id: "S-120", name: "Organizer dashboard", area: "Organizer", exp: "Host", purpose: "Overview of multiple events", state: "L,X,S (empty)", phase: "MVP-0", action: { type: "simulated", mockId: "organizer_dashboard" } },
  { id: "S-110", name: "Refund UI", area: "Refunds", exp: "Host", purpose: "Initiate single refund", state: "L,R (approval hold)", phase: "MVP-0", action: { type: "simulated", mockId: "refund_ui" } },
  { id: "S-100", name: "Scanner (PWA)", area: "Check-in", exp: "Host", purpose: "Camera check-in with offline support", state: "L,R (offline cache)", phase: "MVP-0", action: { type: "simulated", mockId: "scanner_pwa" } },
  { id: "S-101", name: "Booking-ID lookup", area: "Check-in", exp: "Host", purpose: "Manual ticket search + verify", state: "L,X,S (not found)", phase: "MVP-0", action: { type: "simulated", mockId: "booking_lookup" } },
  { id: "S-102", name: "Check-in result", area: "Check-in", exp: "Host", purpose: "Overlay (Valid, Duplicate, Invalid)", state: "L", phase: "MVP-0", action: { type: "simulated", mockId: "checkin_result" } },
  { id: "S-206", name: "Post-event summary", area: "Post-event", exp: "Host", purpose: "Check-in stats, feedback ratings", state: "L", phase: "MVP-1", action: { type: "simulated", mockId: "post_event_summary" } },
  { id: "S-200", name: "Host verification & payout", area: "Verification", exp: "Host", purpose: "Submit banking details & business proof", state: "L,R (payout hold)", phase: "MVP-1", action: { type: "simulated", mockId: "host_verification" } },
  { id: "S-205", name: "Revenue & settlement", area: "Finance", exp: "Host", purpose: "Settlement schedules & ledger records", state: "L,R (escrow block)", phase: "MVP-1", action: { type: "simulated", mockId: "revenue_settlement" } },
  { id: "S-022", name: "Community/group create-edit", area: "Creation", exp: "Community", purpose: "Create community hub", state: "L,X", phase: "MVP-0", action: { type: "native", view: "create-group" } },
  { id: "S-024", name: "Member management", area: "Membership", exp: "Community", purpose: "Review requests, kick, assign roles", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "member_management" } },
  { id: "S-025", name: "Entity settings & toggles", area: "Configuration", exp: "Community", purpose: "Disable forums, toggle private mode", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "group_settings" } },
  { id: "S-037", name: "Moderation queue (entity)", area: "Moderation", exp: "Community", purpose: "Reported threads/comments inside group", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "group_moderation" } },
  { id: "S-208", name: "Invite & referral", area: "Growth", exp: "Community", purpose: "Referral links for member milestones", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "invite_referral" } },
  { id: "S-209", name: "Member directory", area: "Members", exp: "Community", purpose: "Searchable member card index", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "member_directory" } },
  { id: "S-210", name: "Announcements", area: "Engagement", exp: "Community", purpose: "Pin announcements, push notifications to members", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "announcements" } },
  { id: "S-212", name: "Community analytics", area: "Analytics", exp: "Community", purpose: "Growth, active members, thread engagement", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "group_analytics" } },
  { id: "S-207", name: "Sub-community management", area: "Structure", exp: "Community", purpose: "Create subgroups (chapters)", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "sub_communities" } },
  { id: "S-213", name: "Collaboration (co-host)", area: "Structure", exp: "Community", purpose: "Shared event hosting & split payouts", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "cohost_splits" } },
  { id: "S-211", name: "Affiliate management", area: "Growth", exp: "Community", purpose: "Ticket sales commission configuration", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "affiliates" } },
  { id: "S-130", name: "Admin console", area: "Platform", exp: "Admin", purpose: "Platform metrics + fast switches", state: "L,X", phase: "MVP-0", action: { type: "admin", tab: "dashboard" } },
  { id: "S-131", name: "User/entity management", area: "Platform", exp: "Admin", purpose: "Impersonate, ban, override verification", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "user_management" } },
  { id: "S-132", name: "Moderation (platform)", area: "Platform", exp: "Admin", purpose: "Take down content network-wide", state: "L,X", phase: "MVP-0", action: { type: "admin", tab: "moderation" } },
  { id: "S-133", name: "KYC review", area: "Platform", exp: "Admin", purpose: "OCR parsing + manual override documents", state: "L,X", phase: "MVP-0", action: { type: "admin", tab: "kyc" } },
  { id: "S-134", name: "Disputes & support", area: "Platform", exp: "Admin", purpose: "Refund ticket list", state: "L,X", phase: "MVP-0", action: { type: "admin", tab: "disputes" } },
  { id: "S-135", name: "Platform configuration", area: "Platform", exp: "Admin", purpose: "Global categories, SEO, legal pages", state: "L,X", phase: "MVP-0", action: { type: "simulated", mockId: "platform_config" } },
  { id: "S-214", name: "Audit log viewer", area: "Platform", exp: "Admin", purpose: "Full action audit trails searchable", state: "L,X", phase: "MVP-1", action: { type: "admin", tab: "audit" } },
  { id: "S-215", name: "Platform analytics", area: "Platform", exp: "Admin", purpose: "Consolidated revenue, conversion, churn charts", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "platform_analytics" } },
  { id: "S-216", name: "Reconciliation oversight", area: "Finance", exp: "Admin", purpose: "Escrow release queue & merchant bank settlement status", state: "L,X", phase: "MVP-1", action: { type: "simulated", mockId: "reconciliation" } },
  { id: "S-220", name: "Admin & access governance", area: "Admin mgmt", exp: "Super", purpose: "Manage internal staff roles", state: "L,X", phase: "Phase-1.5", action: { type: "simulated", mockId: "access_governance" } },
  { id: "S-221", name: "RBAC & entitlement master", area: "Admin mgmt", exp: "Super", purpose: "Global permission mapping matrix", state: "L,X", phase: "Phase-1.5", action: { type: "admin", tab: "rbac" } },
  { id: "S-222", name: "Tenant management", area: "Admin mgmt", exp: "Super", purpose: "Multi-tenant onboarding & feature entitlement", state: "L,X", phase: "Phase-1.5", action: { type: "admin", tab: "tenants" } },
  { id: "S-223", name: "Master config / MDM", area: "Admin mgmt", exp: "Super", purpose: "Platform limits, fee structures, rate limit values", state: "L,X", phase: "Phase-1.5", action: { type: "simulated", mockId: "master_config" } },
  { id: "S-224", name: "Security policy & emergency", area: "Admin mgmt", exp: "Super", purpose: "MFA enforcement, IP list, global emergency kill-switches", state: "L,X", phase: "Phase-1.5", action: { type: "simulated", mockId: "security_policy" } },
  { id: "S-225", name: "Group roles & management team", area: "Structure", exp: "Community", purpose: "Assign roles to group team members", state: "L,X", phase: "Phase-1.5", action: { type: "simulated", mockId: "group_roles" } },
  { id: "S-226", name: "Ownership transfer / succession", area: "Structure", exp: "Community", purpose: "Maker-checker process to handoff community keys", state: "L,X", phase: "Phase-1.5", action: { type: "simulated", mockId: "group_succession" } },
  { id: "S-227", name: "Group rules / guidelines", area: "Configuration", exp: "Community", purpose: "Enforce guidelines, auto-decline on mismatch options", state: "L,X", phase: "Phase-1.5", action: { type: "simulated", mockId: "group_guidelines" } },
];

const SANDBOX_STYLE = `
  .ss-trigger {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 999999;
    padding: 10px 18px;
    border-radius: var(--r-pill, 999px);
    background: linear-gradient(135deg, var(--accent-2, #6d5efc), #8b5cf6);
    color: #fff;
    border: none;
    font-size: 13.5px;
    font-weight: 600;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset, var(--sh-lg, 0 10px 25px rgba(0,0,0,0.15));
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
  }
  .ss-trigger:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: var(--sh-xl, 0 20px 40px rgba(0,0,0,0.25));
  }
  .ss-trigger:active {
    transform: scale(0.98);
  }
  .ss-drawer {
    position: fixed;
    top: 0;
    right: 0;
    width: 380px;
    height: 100vh;
    background: var(--glass-bg, rgba(20, 18, 31, 0.95));
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border-left: 1px solid var(--border, rgba(255,255,255,0.08));
    z-index: 9999998;
    box-shadow: -10px 0 40px rgba(0,0,0,0.3);
    display: flex;
    flex-direction: column;
    color: var(--ink, #fff);
    font-family: var(--font-sans), sans-serif;
    transform: translateX(100%);
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .ss-drawer.open {
    transform: translateX(0);
  }
  .ss-header {
    padding: 20px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ss-header h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    font-family: var(--font-display);
    letter-spacing: -0.01em;
  }
  .ss-close {
    background: transparent;
    border: none;
    color: var(--ink-3);
    cursor: pointer;
    font-size: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ss-close:hover {
    background: var(--surface-2, rgba(255,255,255,0.05));
    color: var(--ink);
  }
  .ss-filters {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.08));
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ss-search {
    background: var(--field, rgba(255,255,255,0.05));
    border: 1px solid var(--border, rgba(255,255,255,0.08));
    border-radius: 8px;
    padding: 8px 12px;
    color: var(--ink);
    font-size: 13px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }
  .ss-search:focus {
    border-color: var(--accent-2);
  }
  .ss-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .ss-tab {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    background: var(--surface-2, rgba(255,255,255,0.05));
    color: var(--ink-2);
    border: none;
    cursor: pointer;
  }
  .ss-tab.active {
    background: var(--accent-2);
    color: #fff;
  }
  .ss-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;
  }
  .ss-item {
    padding: 12px 20px;
    border-bottom: 1px solid var(--border-2, rgba(255,255,255,0.03));
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ss-item:hover {
    background: var(--surface-2, rgba(255,255,255,0.03));
  }
  .ss-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ss-item-id {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-1);
    background: rgba(255, 107, 74, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }
  .ss-item-phase {
    font-size: 10px;
    color: var(--ink-3);
    font-weight: 600;
  }
  .ss-item-name {
    font-size: 13.5px;
    font-weight: 600;
  }
  .ss-item-purpose {
    font-size: 11.5px;
    color: var(--ink-2);
    line-height: 1.35;
  }
  .ss-item-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }
  .ss-item-area {
    font-size: 10.5px;
    color: var(--ink-3);
    background: var(--surface-2, rgba(255,255,255,0.05));
    padding: 2px 6px;
    border-radius: 4px;
  }
  .ss-item-state {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent-2);
  }
  .ss-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(5, 4, 10, 0.85);
    z-index: 20000000;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    animation: ss-fadein 0.25s ease-out;
  }
  @keyframes ss-fadein { from { opacity: 0; } to { opacity: 1; } }
  .ss-sim-window {
    background: var(--surface, #14121f);
    border: 1px solid var(--border, rgba(255,255,255,0.08));
    width: 850px;
    max-width: 95%;
    height: 600px;
    max-height: 90%;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    display: grid;
    grid-template-columns: 280px 1fr;
    overflow: hidden;
    color: var(--ink, #fff);
    font-family: var(--font-sans), sans-serif;
  }
  .ss-sim-sidebar {
    background: var(--surface-2, #181628);
    border-right: 1px solid var(--border, rgba(255,255,255,0.08));
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
  }
  .ss-sim-main {
    padding: 32px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    position: relative;
    background: radial-gradient(circle at top right, rgba(109, 94, 252, 0.05), transparent 60%);
  }
  .ss-sim-badge {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-1);
    background: rgba(255, 107, 74, 0.1);
    padding: 4px 8px;
    border-radius: 6px;
  }
  .ss-sim-title {
    margin: 8px 0 4px 0;
    font-size: 20px;
    font-weight: 600;
    font-family: var(--font-display);
  }
  .ss-sim-purpose {
    font-size: 13px;
    color: var(--ink-2);
    margin-bottom: 20px;
  }
  .ss-sim-control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ss-sim-control-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ss-sim-btn-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ss-sim-state-btn {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border, rgba(255,255,255,0.08));
    background: var(--surface, #14121f);
    color: var(--ink);
    font-size: 12.5px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ss-sim-state-btn.active {
    background: var(--accent-2);
    border-color: var(--accent-2);
    color: #fff;
    box-shadow: 0 4px 12px rgba(109, 94, 252, 0.25);
  }
  .ss-mock-card {
    background: var(--surface, #14121f);
    border: 1px solid var(--border, rgba(255,255,255,0.08));
    border-radius: var(--r-md, 16px);
    width: 360px;
    max-width: 100%;
    padding: 24px;
    box-shadow: var(--sh-lg, 0 10px 25px rgba(0,0,0,0.15));
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
  }
  
  /* Mock UIs specific styling */
  .ss-qr-box {
    background: #fff;
    padding: 16px;
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 16px auto;
    width: 120px;
    height: 120px;
  }
  .ss-radar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid var(--accent-2);
    position: relative;
    animation: ss-pulse 1.8s infinite ease-out;
    margin: 20px auto;
  }
  @keyframes ss-pulse {
    0% { transform: scale(0.6); opacity: 1; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  
  /* Scanner styles */
  .ss-scanner-laser {
    position: absolute;
    left: 0;
    right: 0;
    height: 3px;
    background: #10b981;
    box-shadow: 0 0 10px #10b981;
    animation: ss-scan 2s infinite ease-in-out;
  }
  @keyframes ss-scan {
    0% { top: 10%; }
    50% { top: 90%; }
    100% { top: 10%; }
  }
`;

function ScreensSandboxOverlay() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [simulatingScreen, setSimulatingScreen] = useState(null);
  const [simState, setSimState] = useState("default");
  
  // Custom states for simulations
  const [dobVal, setDobVal] = useState({ d: "", m: "", y: "" });
  const [dobError, setDobError] = useState(null);
  const [nfcState, setNfcState] = useState("ready"); // ready, writing, success
  const [deleteConfirmTimer, setDeleteConfirmTimer] = useState(0);
  const [deleteStatus, setDeleteStatus] = useState("ready"); // ready, countdown, deleted
  const [waitlistPos, setWaitlistPos] = useState(42);
  const [scannerResult, setScannerResult] = useState(null); // null, valid, duplicate, fake
  const [scannerOffline, setScannerOffline] = useState(false);
  const [selectedSuccessor, setSelectedSuccessor] = useState("");
  const [successionStatus, setSuccessionStatus] = useState("ready"); // ready, pending, done
  const [cohostEmail, setCohostEmail] = useState("");
  const [cohostSplit, setCohostSplit] = useState(30); // 30% cohost split
  const [affiliateLink, setAffiliateLink] = useState("");
  const [emergencyLocked, setEmergencyLocked] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Timer for Account Deletion button
  useEffect(() => {
    let id;
    if (deleteStatus === "countdown" && deleteConfirmTimer > 0) {
      id = setTimeout(() => setDeleteConfirmTimer(t => t - 1), 1000);
    } else if (deleteStatus === "countdown" && deleteConfirmTimer === 0) {
      // timer reached 0
    }
    return () => clearTimeout(id);
  }, [deleteConfirmTimer, deleteStatus]);

  const toggleOpen = () => setOpen(prev => !prev);

  // Filter logic
  const filteredScreens = useMemo(() => {
    return SCREENS_SPEC.filter(s => {
      const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) || 
                          s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.purpose.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (activeTab === "ALL") return true;
      if (activeTab === "AUTH" && s.area === "Auth") return true;
      if (activeTab === "PROFILE" && s.area === "Profile") return true;
      if (activeTab === "DISCOVERY" && (s.area === "Discovery" || s.area === "Saved")) return true;
      if (activeTab === "COMMUNITY" && (s.area === "Community" || s.exp === "Community")) return true;
      if (activeTab === "BOOKING" && (s.area === "Booking" || s.area === "Payments" || s.area === "Tickets")) return true;
      if (activeTab === "HOST" && s.exp === "Host") return true;
      if (activeTab === "ADMIN" && s.exp === "Admin") return true;
      if (activeTab === "SUPER" && s.exp === "Super") return true;
      return false;
    });
  }, [search, activeTab]);

  // Handle click on screen in catalog
  const handleLaunchScreen = (s) => {
    setOpen(false);
    if (s.action.type === "native") {
      if (window.samaagum_go) {
        window.samaagum_go(s.action.view, s.action.param);
        alert(`Navigated main prototype to: ${s.name} (View: ${s.action.view})`);
      } else {
        alert(`Main application shell is not fully loaded. To see this natively, open "Samaagum Home.html".`);
      }
    } else if (s.action.type === "admin") {
      if (window.samaagum_admin_setActiveTab) {
        if (window.samaagum_admin_login) {
          window.samaagum_admin_login("superadmin@samaagum.co");
        }
        window.samaagum_admin_setActiveTab(s.action.tab);
        alert(`Navigated admin panel tab to: ${s.action.tab}`);
      } else {
        alert(`Admin panel is not fully loaded. Open "admin/index.html" to run native admin console workflows.`);
      }
    } else if (s.action.type === "url") {
      if (confirm(`Redirect browser to ${s.action.url}?`)) {
        window.location.href = s.action.url;
      }
    } else if (s.action.type === "simulated") {
      setSimulatingScreen(s);
      setSimState("default");
      // Reset simulator states
      setNfcState("ready");
      setDobVal({ d: "", m: "", y: "" });
      setDobError(null);
      setDeleteStatus("ready");
      setDeleteConfirmTimer(0);
      setWaitlistPos(42);
      setScannerResult(null);
      setSuccessionStatus("ready");
      setCohostEmail("");
      setCohostSplit(30);
      setAffiliateLink("");
    }
  };

  // vCard generator
  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:Reddy;Aanya;;;\nFN:Aanya Reddy\nORG:Samaagum;Design\nTITLE:Product Designer\nEMAIL;type=INTERNET;type=WORK:aanya@samaagum.co\nURL:https://samaagum.co/aanya\nEND:VCARD`;
    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aanya_reddy.vcf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simulated renders
  const renderSimulatedUI = () => {
    if (!simulatingScreen) return null;
    const mockId = simulatingScreen.action.mockId;

    switch (mockId) {
      case "consent":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>S-005: Platform Consent Agreement</h3>
            <p style={{ fontSize: "12px", color: "var(--ink-2)", lineHeight: "1.4", marginBottom: "16px" }}>
              To continue utilizing Samaagum client nodes, please confirm your acceptance of our terms.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ display: "flex", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" id="tc-check" style={{ marginTop: "2px" }} />
                <span>I agree to the <b>Terms of Service</b> including automated waitlist triage policy.</span>
              </label>
              <label style={{ display: "flex", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                <input type="checkbox" id="pp-check" style={{ marginTop: "2px" }} />
                <span>I agree to the <b>Privacy Policy</b>, enabling local cache storage.</span>
              </label>
            </div>
            <button 
              className="hbtn hbtn--primary hbtn--block" 
              style={{ marginTop: "20px" }}
              onClick={() => {
                const tc = document.getElementById("tc-check")?.checked;
                const pp = document.getElementById("pp-check")?.checked;
                if (tc && pp) {
                  alert("Consent confirmed. Client handshake finalized.");
                  setSimulatingScreen(null);
                } else {
                  alert("Please accept both Terms and Privacy Policy to continue.");
                }
              }}
            >
              Accept &amp; Continue
            </button>
          </div>
        );

      case "dob_profiling":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>S-006: Age Verification Gate</h3>
            <p style={{ fontSize: "12.5px", color: "var(--ink-2)", marginBottom: "16px" }}>
              Samaagum requires hosts to verify their date of birth to comply with regulatory payment guidelines.
            </p>
            <div style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
              <input 
                type="number" 
                placeholder="DD" 
                className="ss-search" 
                style={{ textAlign: "center" }}
                value={dobVal.d}
                onChange={(e) => setDobVal(prev => ({ ...prev, d: e.target.value }))}
              />
              <input 
                type="number" 
                placeholder="MM" 
                className="ss-search" 
                style={{ textAlign: "center" }}
                value={dobVal.m}
                onChange={(e) => setDobVal(prev => ({ ...prev, m: e.target.value }))}
              />
              <input 
                type="number" 
                placeholder="YYYY" 
                className="ss-search" 
                style={{ textAlign: "center" }}
                value={dobVal.y}
                onChange={(e) => setDobVal(prev => ({ ...prev, y: e.target.value }))}
              />
            </div>
            {dobError && <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>{dobError}</div>}
            <button 
              className="hbtn hbtn--primary hbtn--block"
              onClick={() => {
                const year = parseInt(dobVal.y);
                if (!dobVal.d || !dobVal.m || !dobVal.y) {
                  setDobError("Please input a valid date.");
                  return;
                }
                const age = new Date().getFullYear() - year;
                if (age < 18) {
                  setDobError("Error: You must be 18 years or older to organize events.");
                } else {
                  setDobError(null);
                  alert("Age verification succeeded! Profile updated.");
                  setSimulatingScreen(null);
                }
              }}
            >
              Verify DOB
            </button>
          </div>
        );

      case "onboarding":
        return (
          <div className="ss-mock-card" style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>S-150: Interactive Welcome Guide</h3>
            <div style={{ background: "rgba(109, 94, 252, 0.1)", borderRadius: "12px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "28px" }}>
              ✨ Welcome to Samaagum
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: "1.4", marginBottom: "20px" }}>
              Discover local sub-domains, join Waitlists, secure offline payment confirmations, and experience frictionless PWA check-ins.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "16px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-2)" }}></span>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--border)" }}></span>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--border)" }}></span>
            </div>
            <button className="hbtn hbtn--primary hbtn--block" onClick={() => setSimulatingScreen(null)}>Get Started</button>
          </div>
        );

      case "share_sheet":
        return (
          <div className="ss-mock-card" style={{ textAlign: "center" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "600" }}>S-013: Share Aanya's Card</h3>
            <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>TAPOnn NFC &amp; QR Integrations</span>
            
            <div className="ss-qr-box">
              {/* Mock QR code svg */}
              <svg width="90" height="90" viewBox="0 0 100 100">
                <rect x="0" y="0" width="25" height="25" fill="#000"/>
                <rect x="5" y="5" width="15" height="15" fill="#fff"/>
                <rect x="75" y="0" width="25" height="25" fill="#000"/>
                <rect x="80" y="5" width="15" height="15" fill="#fff"/>
                <rect x="0" y="75" width="25" height="25" fill="#000"/>
                <rect x="5" y="80" width="15" height="15" fill="#fff"/>
                <rect x="40" y="40" width="20" height="20" fill="#000"/>
                <rect x="45" y="45" width="10" height="10" fill="var(--accent-2)"/>
              </svg>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
              <button className="hbtn hbtn--soft hbtn--block" onClick={downloadVCard}>
                📥 Download Contact vCard
              </button>
              
              {nfcState === "ready" && (
                <button className="hbtn hbtn--primary hbtn--block" onClick={() => {
                  setNfcState("writing");
                  setTimeout(() => setNfcState("success"), 2500);
                }}>
                  📡 Program NFC Chip
                </button>
              )}
              {nfcState === "writing" && (
                <div style={{ padding: "10px" }}>
                  <div className="ss-radar"></div>
                  <span style={{ fontSize: "12.5px", color: "var(--accent-2)" }}>Approaching mobile device... Hold close.</span>
                </div>
              )}
              {nfcState === "success" && (
                <div style={{ padding: "10px", color: "#10b981", fontWeight: "600", fontSize: "13px" }}>
                  ✓ TAPOnn NFC Profile Programmed successfully!
                  <button className="hbtn hbtn--ghost hbtn--sm hbtn--block" style={{ marginTop: "8px" }} onClick={() => setNfcState("ready")}>Reset</button>
                </div>
              )}
            </div>
          </div>
        );

      case "privacy_controls":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>S-014: Privacy &amp; Data Controls</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>Show email on profile</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>Allow members to query email</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>Show contact phone number</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>Restrict to mutual connections only</div>
                </div>
                <input type="checkbox" />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>Allow direct DMs</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>Open incoming message queue</div>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
              
              <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
              
              <button className="hbtn hbtn--soft hbtn--block" onClick={() => {
                alert("Beginning export. Compiling local SQL storage logs into CSV package...");
                setTimeout(() => alert("Export ready! downloaded_samaagum_profile.csv"), 1500);
              }}>
                📂 Export All My Personal Data (CSV)
              </button>
              
              {deleteStatus === "ready" && (
                <button className="hbtn hbtn--ghost hbtn--block" style={{ color: "#ef4444" }} onClick={() => {
                  setDeleteStatus("countdown");
                  setDeleteConfirmTimer(5);
                }}>
                  ⚠️ Delete Profile &amp; Permanent Handoff
                </button>
              )}
              
              {deleteStatus === "countdown" && (
                <div style={{ padding: "10px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  <div style={{ fontSize: "11.5px", color: "#ef4444", marginBottom: "8px" }}>
                    Warning: This action is irreversible. All tickets, groups, and connections will be scrubbed.
                  </div>
                  <button 
                    disabled={deleteConfirmTimer > 0}
                    className="hbtn hbtn--primary hbtn--block"
                    style={{ background: deleteConfirmTimer > 0 ? "var(--ink-3)" : "#ef4444", cursor: deleteConfirmTimer > 0 ? "not-allowed" : "pointer" }}
                    onClick={() => {
                      setDeleteStatus("deleted");
                      alert("Account permanently deleted. Session closed.");
                      window.location.reload();
                    }}
                  >
                    {deleteConfirmTimer > 0 ? `Wait ${deleteConfirmTimer}s to Confirm` : "Confirm Permanent Deletion"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "join_questionnaire":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-023: Join Questionnaire</h3>
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>BLR Founders Collective (Private Group)</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Why do you want to join this group?</label>
                <textarea className="ss-search" style={{ height: "60px", resize: "none" }} placeholder="Briefly describe what you're working on..."></textarea>
              </div>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>LinkedIn Profile or Website URL</label>
                <input className="ss-search" placeholder="https://..." />
              </div>
              <label style={{ display: "flex", gap: "8px", fontSize: "12px", cursor: "pointer", marginTop: "4px" }}>
                <input type="checkbox" defaultChecked />
                <span>I pledge to respect the zero-spam policy guidelines.</span>
              </label>
              <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: "10px" }} onClick={() => {
                alert("Join request sent. Placed in group organizer's approval queue.");
                setSimulatingScreen(null);
              }}>
                Submit Join Request
              </button>
            </div>
          </div>
        );

      case "post_composer":
        return (
          <div className="ss-mock-card" style={{ width: "450px" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "600" }}>S-032: Forum Post Composer</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input className="ss-search" placeholder="Thread Title" style={{ fontSize: "14px", fontWeight: "600" }} />
              
              {/* Rich text tools mock */}
              <div style={{ display: "flex", gap: "6px", background: "var(--surface-2)", padding: "4px", borderRadius: "6px" }}>
                <button style={{ background: "transparent", border: "0", color: "var(--ink)", padding: "2px 6px", fontWeight: "bold" }}>B</button>
                <button style={{ background: "transparent", border: "0", color: "var(--ink)", padding: "2px 6px", fontStyle: "italic" }}>I</button>
                <button style={{ background: "transparent", border: "0", color: "var(--ink)", padding: "2px 6px", fontFamily: "monospace" }}>&lt;&gt;</button>
                <button style={{ background: "transparent", border: "0", color: "var(--ink)", padding: "2px 6px" }}>🔗</button>
              </div>
              
              <textarea className="ss-search" style={{ height: "120px", resize: "none" }} placeholder="Write your post details here... Support markdown syntax..."></textarea>
              
              <div style={{ border: "2px dashed var(--border)", borderRadius: "8px", padding: "16px", textAlign: "center", cursor: "pointer" }} onClick={() => alert("Select media file to upload")}>
                <span style={{ fontSize: "20px" }}>📸</span>
                <div style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "4px" }}>Drag &amp; drop photos/files here to attach</div>
              </div>
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button className="hbtn hbtn--ghost" onClick={() => setSimulatingScreen(null)}>Save Draft</button>
                <button className="hbtn hbtn--primary" onClick={() => {
                  alert("Post successfully compiled and broadcasted to BLR Founders Collective forum!");
                  setSimulatingScreen(null);
                }}>Publish Thread</button>
              </div>
            </div>
          </div>
        );

      case "review_composer":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-036: Submit Community Review</h3>
            <span style={{ fontSize: "11px", color: "#10b981", display: "block", marginBottom: "12px" }}>✓ Verified Event Attendee Eligible</span>
            
            <div style={{ display: "flex", gap: "8px", fontSize: "24px", justifyContent: "center", marginBottom: "16px", cursor: "pointer" }}>
              {["★","★","★","★","★"].map((s,i) => (
                <span key={i} style={{ color: "var(--accent-1)" }}>{s}</span>
              ))}
            </div>
            
            <textarea className="ss-search" style={{ height: "80px", resize: "none" }} placeholder="Share your experience (the host, venue quality, peer crowd, scheduling accuracy)..."></textarea>
            
            <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: "16px" }} onClick={() => {
              alert("Thank you! Your feedback will populate the community review rail.");
              setSimulatingScreen(null);
            }}>
              Post Public Review
            </button>
          </div>
        );

      case "ticket_detail":
        return (
          <div className="ss-mock-card" style={{ padding: "0", background: "transparent", border: "none" }}>
            <div style={{ background: "linear-gradient(135deg, var(--accent-2), #2a7fff)", padding: "24px", borderRadius: "16px 16px 0 0", color: "#fff", position: "relative" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", opacity: "0.8" }}>S-086: Event Admission Pass</div>
              <h2 style={{ fontSize: "18px", margin: "8px 0 16px 0", fontWeight: "600" }}>Design Systems Night #12</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
                <div>
                  <span style={{ opacity: "0.7", display: "block" }}>ATTENDEE</span>
                  <b>Aanya Reddy</b>
                </div>
                <div>
                  <span style={{ opacity: "0.7", display: "block" }}>TIER</span>
                  <b>VIP · Front tables</b>
                </div>
                <div>
                  <span style={{ opacity: "0.7", display: "block" }}>DATE</span>
                  <b>Sat, Jun 21 · 5:00 PM</b>
                </div>
                <div>
                  <span style={{ opacity: "0.7", display: "block" }}>LOCATION</span>
                  <b>WeWork Galaxy, BLR</b>
                </div>
              </div>
            </div>
            
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px dashed var(--border)", padding: "20px", borderRadius: "0 0 16px 16px", textAlign: "center" }}>
              <div style={{ background: "#fff", padding: "10px", borderRadius: "8px", display: "inline-block" }}>
                {/* Simulated barcode */}
                <svg width="220" height="60">
                  {Array.from({ length: 45 }).map((_, i) => (
                    <rect key={i} x={i * 5} y="0" width={Math.random() > 0.4 ? "3" : "1"} height="60" fill="#000" />
                  ))}
                </svg>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--ink-2)", marginTop: "6px" }}>BLR-DSN-12-VIP-9912A</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "16px" }}>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={downloadVCard}>vCard Sync</button>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => alert("Calendar invite .ics downloaded.")}>ICS Calendar</button>
              </div>
              
              <button className="hbtn hbtn--ghost hbtn--block hbtn--sm" style={{ marginTop: "8px", color: "#ef4444" }} onClick={() => alert("Refund request initiated. Maker checker authorization queue triggered.")}>
                Request Refund / Cancel Pass
              </button>
            </div>
          </div>
        );

      case "scanner_pwa":
        return (
          <div className="ss-mock-card" style={{ padding: "0" }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", items: "center" }}>
                <div>
                  <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600" }}>S-100: Host Scanner PWA</h3>
                  <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Design Systems Night #12</span>
                </div>
                <label style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input type="checkbox" checked={scannerOffline} onChange={(e) => setScannerOffline(e.target.checked)} />
                  Offline Mode
                </label>
              </div>
            </div>
            
            <div style={{ height: "200px", background: "#05040a", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="ss-scanner-laser"></div>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>📸 Camera feed viewport active...</span>
              
              {scannerResult === "valid" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(16, 185, 129, 0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <span style={{ fontSize: "40px" }}>✓</span>
                  <div style={{ fontWeight: "700" }}>TICKET VALID</div>
                  <div style={{ fontSize: "12px" }}>Aanya Reddy · VIP</div>
                  <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#fff", marginTop: "10px" }} onClick={() => setScannerResult(null)}>Scan Next</button>
                </div>
              )}

              {scannerResult === "duplicate" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(245, 158, 11, 0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <span style={{ fontSize: "40px" }}>⚠️</span>
                  <div style={{ fontWeight: "700" }}>DUPLICATE TICKET</div>
                  <div style={{ fontSize: "12px" }}>Scanned: 2m ago by Staff-02</div>
                  <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#fff", marginTop: "10px" }} onClick={() => setScannerResult(null)}>Scan Next</button>
                </div>
              )}

              {scannerResult === "fake" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(239, 68, 68, 0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <span style={{ fontSize: "40px" }}>✕</span>
                  <div style={{ fontWeight: "700" }}>INVALID / VOID</div>
                  <div style={{ fontSize: "12px" }}>Ticket voided or refunded.</div>
                  <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#fff", marginTop: "10px" }} onClick={() => setScannerResult(null)}>Scan Next</button>
                </div>
              )}
            </div>
            
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--ink-3)", textTransform: "uppercase" }}>Simulate Scan Barcode:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => setScannerResult("valid")}>Valid Code</button>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => setScannerResult("duplicate")}>Duplicate</button>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => setScannerResult("fake")}>Fake/Void</button>
              </div>
            </div>
          </div>
        );

      case "waitlist_status":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "600" }}>S-160: Waitlist Dashboard</h3>
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Founders &amp; Funders Mixer — Summer Edition</span>
            
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "36px", fontWeight: "700", color: "var(--accent-1)" }}>#{waitlistPos}</div>
              <span style={{ fontSize: "13px", color: "var(--ink-2)" }}>Position in line (Capacity: 180 cap)</span>
            </div>
            
            <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>⚡ Priority Waitlist Boosts</div>
              <div style={{ fontSize: "11.5px", color: "var(--ink-3)", lineHeight: "1.35", marginBottom: "8px" }}>
                Invite other builders or founders to register. Each conversion boosts your position by <b>-5 spots</b>.
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input className="ss-search" style={{ fontSize: "11px" }} readOnly value="https://samaagum.co/join?ref=aanya-boost" />
                <button className="hbtn hbtn--primary hbtn--sm" style={{ padding: "0 10px" }} onClick={() => {
                  alert("Referral link copied!");
                  if (waitlistPos > 5) setWaitlistPos(p => p - 5);
                }}>Boost</button>
              </div>
            </div>
            
            <button className="hbtn hbtn--ghost hbtn--block hbtn--sm" style={{ color: "#ef4444" }} onClick={() => {
              if (confirm("Leave waitlist? This deletes your queue position permanently.")) {
                setSimulatingScreen(null);
              }
            }}>Leave Waitlist</button>
          </div>
        );

      case "waitlist_claim":
        return (
          <div className="ss-mock-card" style={{ border: "2px solid var(--accent-1)" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-161: Claim Waitlist Ticket</h3>
            <span style={{ fontSize: "11px", color: "var(--accent-1)", fontWeight: "bold" }}>● TIME-SENSITIVE OFFER</span>
            
            <p style={{ fontSize: "12.5px", color: "var(--ink-2)", marginTop: "10px", lineHeight: "1.4" }}>
              Good news! A ticket slot opened up for <b>Founders &amp; Funders Mixer</b>. You have been prioritized for checkout.
            </p>
            
            <div style={{ background: "rgba(255, 107, 74, 0.08)", padding: "12px", borderRadius: "8px", textAlign: "center", margin: "16px 0", fontSize: "20px", fontWeight: "bold", fontFamily: "monospace" }}>
              ⏳ 14:52 remaining
            </div>
            
            <button className="hbtn hbtn--primary hbtn--block" onClick={() => {
              alert("Waitlist slot claimed! Routing to checkout payments.");
              setSimulatingScreen(null);
            }}>
              Claim Ticket Now (₹499)
            </button>
          </div>
        );

      case "member_directory":
        return (
          <div className="ss-mock-card" style={{ width: "500px" }}>
            <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "600" }}>S-209: Member Directory</h3>
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>BLR Founders Collective</span>
            
            <div style={{ margin: "12px 0" }}>
              <input className="ss-search" placeholder="Search members by name, role, handle..." />
            </div>
            
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Name</th>
                    <th style={{ padding: "8px" }}>Role</th>
                    <th style={{ padding: "8px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { n: "Kabir Anand", r: "Founder", h: "@kabir" },
                    { n: "Mira Shah", r: "Brand Designer", h: "@mira" },
                    { n: "Dev Kapoor", r: "ML Engineer", h: "@dev" },
                    { n: "Riya Thomas", r: "Creator", h: "@riya" },
                  ].map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px" }}>
                        <b>{m.n}</b>
                        <div style={{ fontSize: "10px", color: "var(--ink-3)" }}>{m.h}</div>
                      </td>
                      <td style={{ padding: "8px" }}>{m.r}</td>
                      <td style={{ padding: "8px" }}>
                        <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => alert(`DM thread initialized with ${m.n}`)}>DM</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button className="hbtn hbtn--ghost hbtn--block" style={{ marginTop: "12px" }} onClick={() => setSimulatingScreen(null)}>Close Directory</button>
          </div>
        );

      case "group_succession":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-226: Community Succession Handoff</h3>
            <span style={{ fontSize: "11.5px", color: "var(--ink-2)" }}>Transfer primary owner status of BLR Founders Collective.</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Select New Successor</label>
                <select 
                  className="ss-search" 
                  value={selectedSuccessor}
                  onChange={(e) => setSelectedSuccessor(e.target.value)}
                >
                  <option value="">-- Choose member --</option>
                  <option value="Kabir Anand">Kabir Anand</option>
                  <option value="Mira Shah">Mira Shah</option>
                  <option value="Dev Kapoor">Dev Kapoor</option>
                </select>
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Verify Administrative Password</label>
                <input type="password" className="ss-search" placeholder="••••••••" />
              </div>
              
              {successionStatus === "ready" && (
                <button 
                  disabled={!selectedSuccessor}
                  className="hbtn hbtn--primary hbtn--block"
                  style={{ background: "#ef4444", border: "none", color: "#fff", opacity: selectedSuccessor ? 1 : 0.6 }}
                  onClick={() => {
                    setSuccessionStatus("pending");
                    alert("Ownership transfer request pending checker authorization.");
                  }}
                >
                  Request Ownership Handoff
                </button>
              )}
              
              {successionStatus === "pending" && (
                <div style={{ padding: "10px", background: "rgba(245,158,11,0.08)", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div style={{ fontSize: "11.5px", color: "#f59e0b" }}>
                    Awaiting Checker Approval. An email has been sent to the successor to confirm.
                  </div>
                  <button className="hbtn hbtn--ghost hbtn--sm hbtn--block" style={{ marginTop: "6px" }} onClick={() => setSuccessionStatus("ready")}>Cancel Request</button>
                </div>
              )}
            </div>
          </div>
        );

      case "cohost_splits":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-213: Co-Host Split Configuration</h3>
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Set revenue allocations &amp; checking permissions.</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Co-host Email address</label>
                <input 
                  className="ss-search" 
                  placeholder="cohost@domain.com"
                  value={cohostEmail}
                  onChange={(e) => setCohostEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                  <span>Revenue Split Allocation</span>
                  <span style={{ color: "var(--accent-1)" }}>{cohostSplit}% / {100 - cohostSplit}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={cohostSplit}
                  onChange={(e) => setCohostSplit(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
              
              <div style={{ fontSize: "11.5px", color: "var(--ink-3)", background: "var(--surface-2)", padding: "10px", borderRadius: "6px" }}>
                Estimated total tickets revenue: <b>₹89,820</b><br/>
                Host allocation ({(100 - cohostSplit)}%): <b>₹{Math.round(89820 * (1 - cohostSplit / 100)).toLocaleString()}</b><br/>
                Co-host payout ({cohostSplit}%): <b>₹{Math.round(89820 * (cohostSplit / 100)).toLocaleString()}</b>
              </div>
              
              <button 
                disabled={!cohostEmail}
                className="hbtn hbtn--primary hbtn--block"
                style={{ opacity: cohostEmail ? 1 : 0.6 }}
                onClick={() => {
                  alert(`Invitation sent to ${cohostEmail} with ${cohostSplit}% payout splits.`);
                  setSimulatingScreen(null);
                }}
              >
                Send Co-host Invitation
              </button>
            </div>
          </div>
        );

      case "affiliates":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-211: Affiliate Enrollment &amp; Commission</h3>
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Manage commission sharing parameters.</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Affiliate commission percentage</label>
                <select className="ss-search" defaultValue="10">
                  <option value="5">5% per conversion</option>
                  <option value="10">10% per conversion</option>
                  <option value="15">15% per conversion</option>
                  <option value="20">20% per conversion</option>
                </select>
              </div>
              
              <button 
                className="hbtn hbtn--soft hbtn--block"
                onClick={() => {
                  setAffiliateLink("https://samaagum.co/checkout?aff=aanya-referral-code");
                  alert("Unique affiliate link generated!");
                }}
              >
                Generate Affiliate Referral link
              </button>
              
              {affiliateLink && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                  <input className="ss-search" style={{ fontSize: "11px" }} readOnly value={affiliateLink} />
                  <div style={{ fontSize: "11px", color: "#10b981" }}>
                    Share this link. Conversions will automatically record a 10% ledger balance.
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "security_policy":
        return (
          <div className="ss-mock-card">
            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600" }}>S-224: Security Policy &amp; Platform Controls</h3>
            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>Super Admin Emergency Gateway</span>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>Enforce MFA globally</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>Forces all hosts to connect OTP keys</div>
                </div>
                <input type="checkbox" defaultChecked />
              </label>
              
              <div className="form-group">
                <label style={{ fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "4px" }}>IP Whitelist Restrictions</label>
                <textarea className="ss-search" style={{ height: "50px", fontSize: "11px" }} placeholder="127.0.0.1, 192.168.1.1, ..."></textarea>
              </div>
              
              <hr style={{ border: "0", borderTop: "1px solid var(--border)" }} />
              
              {emergencyLocked ? (
                <div style={{ padding: "12px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", border: "1px solid #ef4444", textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", color: "#ef4444", fontSize: "13px", marginBottom: "8px" }}>🛑 PLATFORM EMERGENCY SHUTDOWN ACTIVE</div>
                  <button className="hbtn hbtn--primary hbtn--block" style={{ background: "#10b981", border: "none" }} onClick={() => {
                    setEmergencyLocked(false);
                    alert("Emergency lockout lifted. System resuming operations.");
                  }}>
                    Resume Platform Traffic
                  </button>
                </div>
              ) : (
                <button 
                  className="hbtn hbtn--primary hbtn--block" 
                  style={{ background: "#ef4444", border: "none", color: "#fff", fontWeight: "bold" }}
                  onClick={() => {
                    if (confirm("WARNING: This will instantly lock out all platform access and halt checkout payments. Trigger emergency lockdown?")) {
                      setEmergencyLocked(true);
                    }
                  }}
                >
                  ⚡ Trigger Emergency Platform Lockout
                </button>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="ss-mock-card">
            <h3>{simulatingScreen.name}</h3>
            <p>{simulatingScreen.purpose}</p>
            <div style={{ background: "var(--surface-2)", padding: "16px", borderRadius: "8px", color: "var(--ink-2)", fontSize: "13px" }}>
              Simulated flow interface. Clicking the states on the left sidebar to preview different data forms.
            </div>
            <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: "16px" }} onClick={() => setSimulatingScreen(null)}>Close Simulation</button>
          </div>
        );
    }
  };

  return (
    <React.Fragment>
      <style>{SANDBOX_STYLE}</style>
      
      {/* Floating Beaker Trigger Button */}
      <button className="ss-trigger" onClick={toggleOpen} title="Samaagum Experience Catalog &amp; Sandbox">
        <span>🧪</span>
        <span>Spec Explorer</span>
      </button>

      {/* Slide-out Catalog Drawer */}
      <div className={`ss-drawer ${open ? "open" : ""}`}>
        <div className="ss-header">
          <h2>Samaagum Experience Navigator</h2>
          <button className="ss-close" onClick={toggleOpen}>✕</button>
        </div>
        
        <div className="ss-filters">
          <input 
            type="text" 
            placeholder="Search by ID, name, or description..." 
            className="ss-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="ss-tabs">
            {["ALL", "AUTH", "PROFILE", "DISCOVERY", "COMMUNITY", "BOOKING", "HOST", "ADMIN", "SUPER"].map(tab => (
              <button 
                key={tab} 
                className={`ss-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="ss-list">
          {filteredScreens.map(s => (
            <div key={s.id} className="ss-item" onClick={() => handleLaunchScreen(s)}>
              <div className="ss-item-top">
                <span className="ss-item-id">{s.id}</span>
                <span className="ss-item-phase">{s.phase}</span>
              </div>
              <div className="ss-item-name">{s.name}</div>
              <div className="ss-item-purpose">{s.purpose}</div>
              <div className="ss-item-foot">
                <span className="ss-item-area">{s.area}</span>
                <span className="ss-item-state">{s.state}</span>
              </div>
            </div>
          ))}
          {filteredScreens.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", fontSize: "14px" }}>
              No screens match your search.
            </div>
          )}
        </div>
      </div>

      {/* Simulation Modal Window */}
      {simulatingScreen && (
        <div className="ss-modal-overlay" onClick={(e) => { if (e.target.className === 'ss-modal-overlay') setSimulatingScreen(null); }}>
          <div className="ss-sim-window">
            
            {/* Simulation Control Sidebar */}
            <div className="ss-sim-sidebar">
              <div>
                <span className="ss-sim-badge">{simulatingScreen.id}</span>
                <h2 className="ss-sim-title">{simulatingScreen.name}</h2>
                <div className="ss-sim-purpose">{simulatingScreen.purpose}</div>
              </div>
              
              <div className="ss-sim-control-group">
                <div className="ss-sim-control-label">Simulation States</div>
                <div className="ss-sim-btn-group">
                  <button className={`ss-sim-state-btn ${simState === 'default' ? 'active' : ''}`} onClick={() => setSimState('default')}>
                    Default State
                  </button>
                  {simulatingScreen.state.includes("X") && (
                    <button className={`ss-sim-state-btn ${simState === 'expired' ? 'active' : ''}`} onClick={() => setSimState('expired')}>
                      Expired / Lockout (X)
                    </button>
                  )}
                  {simulatingScreen.state.includes("R") && (
                    <button className={`ss-sim-state-btn ${simState === 'restricted' ? 'active' : ''}`} onClick={() => setSimState('restricted')}>
                      Restricted / Denied (R)
                    </button>
                  )}
                  {simulatingScreen.state.includes("S") && (
                    <button className={`ss-sim-state-btn ${simState === 'success' ? 'active' : ''}`} onClick={() => setSimState('success')}>
                      Success / Draft (S)
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "auto" }}>
                <button className="hbtn hbtn--soft hbtn--block hbtn--sm" onClick={() => setSimulatingScreen(null)}>
                  Close Simulator
                </button>
              </div>
            </div>

            {/* Simulated Rendering Area */}
            <div className="ss-sim-main">
              {renderSimulatedUI()}
            </div>

          </div>
        </div>
      )}
    </React.Fragment>
  );
}

// Automatically append container and render to body
if (typeof document !== "undefined") {
  const container = document.createElement("div");
  container.id = "samaagum-sandbox-root";
  document.body.appendChild(container);
  
  // Wait slightly to make sure React libraries are loaded and fully ready
  setTimeout(() => {
    try {
      ReactDOM.createRoot(container).render(<ScreensSandboxOverlay />);
    } catch(err) {
      console.warn("Failed to automatically mount sandbox drawer. Retrying... ", err);
    }
  }, 100);
}
