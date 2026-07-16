import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import { I, Avatar } from './home-icons';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

/* ================================================================
   TYPES
   ================================================================ */
interface ConfirmedAttendee {
  id: string;
  userId: string;
  bookingId: string;
  name: string;
  email: string;
  checkinStatus: 'checked_in' | 'not_checked_in';
  bookingStatus: 'confirmed' | 'pending_payment';
  isCashPayment: boolean;
  amountMinor: number;
  answers: Record<string, unknown>;
  ticketTypeName?: string;   // optional — added when API supports it
  time?: string;             // only present in demo data
  createdAt?: string;        // registration ISO timestamp
  checkinTime?: string;      // checkin timestamp
}
interface PendingRequest {
  id: string;
  userId: string;
  bookingId: string;
  name: string;
  email: string;
  picture: string | null;
  answers: Record<string, unknown>;
  time?: string;
}
interface BookingRecord {
  id: string;
  status: 'confirmed' | 'pending_payment' | 'pending_approval' | 'rejected' | 'cancelled';
  createdAt: string;
}
interface WaitlistEntry {
  id: string;
  userId: string | null;
  name: string;
  joinedAt: string | null;
  position: number;
}
interface DashboardStats {
  totalAttendees: number;
  checkedInCount: number;
  pendingRequestsCount: number;
  revenue: number;
  capacity: number;
  wishlistCount: number;
  confirmed: ConfirmedAttendee[];
  requests: PendingRequest[];
  bookings: BookingRecord[];
  waitlistEnabled: boolean;
  waitlist: WaitlistEntry[];
  waitlistCount: number;
  locations?: {
    totalMapped: number;
    totalUnknown: number;
    cities: Array<{
      city: string;
      state: string | null;
      countryCode: string;
      count: number;
      lat: number;
      lng: number;
    }>;
  };
}
interface EventMember {
  userId: string;
  name: string;
  role: string;
}
interface BulkActionResult {
  successful: string[];
  failed: { bookingId: string; error: string }[];
}

/* ================================================================
   SHARED DISPLAY COMPONENTS
   ================================================================ */

/** Use when the backend cannot yet provide this analytics data */
function UnavailableChart({ message, snapshot }: { message: string; snapshot?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', minHeight: 160,
      gap: 8, color: 'var(--ink-3)', padding: 24, textAlign: 'center'
    }}>
      <I.warning style={{ width: 28, height: 28, opacity: 0.35 }} />
      <div style={{ fontSize: 13, fontWeight: 600 }}>{message}</div>
      {snapshot && <div style={{ fontSize: 12, opacity: 0.7 }}>{snapshot}</div>}
    </div>
  );
}

/** Use when the API works but there are simply no records yet */
function EmptyState({ title, message, icon }: { title: string; message: string; icon?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', minHeight: 160,
      gap: 8, color: 'var(--ink-3)', padding: 24, textAlign: 'center'
    }}>
      {icon ?? <I.users style={{ width: 28, height: 28, opacity: 0.35 }} />}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>{title}</div>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}

/** Reusable icon stat card matching the approved design */
function StatCard({ icon, iconBg, iconColor, value, label, onClick }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: React.ReactNode; label: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', padding: '12px 16px', borderRadius: 12,
        border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        gap: 6, cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 8 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '-0.01em', display: 'block' }}>{label}</span>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

/** Recharts custom tooltip */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', padding: '10px 14px',
      border: '1px solid var(--border)', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: '4px 0 0', color: p.color || p.fill || 'var(--ink-2)', fontSize: 13 }}>
          {p.name}: <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Confirmation modal */
function ConfirmModal({ title, message, confirmLabel, confirmDanger, onConfirm, onCancel }: {
  title: string; message?: string; confirmLabel: string;
  confirmDanger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 32,
        maxWidth: 420, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{title}</h3>
        {message && <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-3)' }}>{message}</p>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="hbtn hbtn--soft" onClick={onCancel}>Cancel</button>
          <button
            className="hbtn hbtn--primary"
            style={confirmDanger ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
            onClick={onConfirm}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   DEMO DATA  (only used when isDemoMode === true)
   ================================================================ */
const DEMO_STATS: DashboardStats = {
  totalAttendees: 1248,
  checkedInCount: 856,
  pendingRequestsCount: 24,
  revenue: 184500,
  capacity: 1248,
  wishlistCount: 380,
  waitlistEnabled: true,
  waitlistCount: 12,
  waitlist: [
    { id:'w1', userId:'wu1', name:'Neha Verma',    joinedAt: new Date(Date.now()-600000).toISOString(),  position:1 },
    { id:'w2', userId:'wu2', name:'Aman Kumar',    joinedAt: new Date(Date.now()-720000).toISOString(),  position:2 },
    { id:'w3', userId:'wu3', name:'Kavya Singh',   joinedAt: new Date(Date.now()-900000).toISOString(),  position:3 },
    { id:'w4', userId:'wu4', name:'Darshan Rathi', joinedAt: new Date(Date.now()-1080000).toISOString(), position:4 },
    { id:'w5', userId:'wu5', name:'Meera Iyer',    joinedAt: new Date(Date.now()-1260000).toISOString(), position:5 },
  ],
  confirmed: [
    { id: 'a1', userId: 'u1', bookingId: 'b1', name: 'Prathmesh Sangale', email: 'p@ex.com', checkinStatus: 'checked_in', bookingStatus: 'confirmed', isCashPayment: false, amountMinor: 149900, answers: {}, ticketTypeName: 'VIP Ticket', time: '10:42 AM' },
    { id: 'a2', userId: 'u2', bookingId: 'b2', name: 'Rahul Sharma', email: 'r@ex.com', checkinStatus: 'checked_in', bookingStatus: 'confirmed', isCashPayment: false, amountMinor: 79900, answers: {}, ticketTypeName: 'General', time: '10:40 AM' },
    { id: 'a3', userId: 'u3', bookingId: 'b3', name: 'Sneha Patel', email: 's@ex.com', checkinStatus: 'not_checked_in', bookingStatus: 'pending_payment', isCashPayment: true, amountMinor: 39900, answers: {}, ticketTypeName: 'Student', time: '10:38 AM' },
    { id: 'a4', userId: 'u4', bookingId: 'b4', name: 'Arjun Verma', email: 'a@ex.com', checkinStatus: 'not_checked_in', bookingStatus: 'confirmed', isCashPayment: false, amountMinor: 149900, answers: {}, ticketTypeName: 'VIP Ticket', time: '10:35 AM' },
    { id: 'a5', userId: 'u5', bookingId: 'b5', name: 'Priya Nair', email: 'pr@ex.com', checkinStatus: 'checked_in', bookingStatus: 'confirmed', isCashPayment: false, amountMinor: 79900, answers: {}, ticketTypeName: 'General', time: '10:30 AM' },
  ],
  requests: [
    { id: 'r1', userId: 'u6', bookingId: 'bk1', name: 'Amit Kumar', email: 'amit@example.com', picture: null, answers: {}, time: '5 min ago' },
    { id: 'r2', userId: 'u7', bookingId: 'bk2', name: 'Riya Sharma', email: 'riya@example.com', picture: null, answers: {}, time: '18 min ago' },
    { id: 'r3', userId: 'u8', bookingId: 'bk3', name: 'Arjun Patel', email: 'arjun@example.com', picture: null, answers: {}, time: '1 hour ago' },
  ],
  bookings: [
    ...Array.from({ length: 82 }, (_, i) => ({ id: `db_app_${i}`, status: 'confirmed' as const, createdAt: new Date(Date.now() - i * 2 * 3600 * 1000).toISOString() })),
    ...Array.from({ length: 18 }, (_, i) => ({ id: `db_rej_${i}`, status: 'rejected' as const, createdAt: new Date(Date.now() - i * 6 * 3600 * 1000).toISOString() })),
    ...Array.from({ length: 24 }, (_, i) => ({ id: `db_pen_${i}`, status: 'pending_approval' as const, createdAt: new Date(Date.now() - i * 1 * 3600 * 1000).toISOString() })),
  ]
};
const DEMO_MEMBERS: EventMember[] = [
  { userId: 'u_adm1', name: 'Admin One', role: 'Admin' },
  { userId: 'u_adm2', name: 'Admin Two', role: 'Admin' },
  { userId: 'u_mod1', name: 'Mod One', role: 'Moderator' },
  { userId: 'u_mod2', name: 'Mod Two', role: 'Moderator' },
  { userId: 'u_mod3', name: 'Mod Three', role: 'Moderator' },
  ...Array.from({ length: 50 }, (_, i) => ({ userId: `u_mem${i}`, name: `Member ${i}`, role: 'Member' })),
  ...Array.from({ length: 10 }, (_, i) => ({ userId: `u_guest${i}`, name: `Guest ${i}`, role: 'Guest' })),
];
const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)} hour${Math.floor(diff/3600)>1?'s':''} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff/86400)>1?'s':''} ago`;
}

/* ================================================================
   EXPORT CSV COMPONENT
   ================================================================ */
function ExportCsvModal({ ev, onClose }: { ev: any; onClose: () => void }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [customFieldFilter, setCustomFieldFilter] = useState('confirmed');

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/events/${ev.id}/export/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (active && json.success) {
          setSummary(json.data);
          setLoading(false);
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    };
    fetchSummary();
    return () => { active = false; };
  }, [ev.id]);

  const handleExport = async (type: string) => {
    setExportingKey(type);
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`/api/events/${ev.id}/export`, window.location.origin);
      url.searchParams.set('type', type);
      url.searchParams.set('format', 'csv');
      if (type === 'custom-fields') {
        url.searchParams.set('filter', customFieldFilter);
      }

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (window.toast) window.toast(json.message || `Export failed (${res.status})`, 'error');
        setExportingKey(null);
        return;
      }

      // Check Content-Disposition for filename
      let filename = `${ev.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${type}.csv`;
      const disposition = res.headers.get('Content-Disposition');
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      if (window.toast) window.toast("Export downloaded successfully", "success");
    } catch (err) {
      if (window.toast) window.toast("An error occurred during export", "error");
    } finally {
      setExportingKey(null);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="view-enter" style={{ position: 'relative', background: 'var(--surface)', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Export CSV</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%' }}>
              <I.x style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)' }}>Loading export options...</div>
          ) : !summary ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--red)' }}>Failed to load export summary.</div>
          ) : (
            Object.entries(summary).map(([key, data]: [string, any]) => {
              if (!data.enabled && data.count === 0) return null;

              const isGenerating = exportingKey === key;
              const disabled = data.count === 0 || exportingKey !== null;

              return (
                <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--field)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {key === 'ticketSales' && '📊 '}
                        {key === 'attendees' && '👥 '}
                        {key === 'approvals' && '⏳ '}
                        {key === 'waitlist' && '📋 '}
                        {key === 'checkins' && '✅ '}
                        {key === 'customFields' && '📝 '}
                        {key === 'revenue' && '💳 '}
                        {data.title}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{data.description}</div>
                      <div style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 500, marginTop: 4 }}>{data.countLabel}</div>
                    </div>
                    
                    <button 
                      className={`hbtn ${isGenerating ? 'hbtn--soft' : 'hbtn--primary'} hbtn--sm`} 
                      disabled={disabled}
                      onClick={() => handleExport(key)}
                      style={{ whiteSpace: 'nowrap', opacity: disabled && !isGenerating ? 0.5 : 1 }}
                    >
                      {isGenerating ? (
                        <>Preparing export...</>
                      ) : data.count === 0 ? (
                        <>Disabled</>
                      ) : (
                        <>Export CSV</>
                      )}
                    </button>
                  </div>

                  {key === 'customFields' && data.count > 0 && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, padding: '12px 16px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                      {['confirmed', 'pending', 'waitlist', 'all'].map(f => (
                        <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name={`customFieldFilter-${key}`}
                            checked={customFieldFilter === f}
                            onChange={() => setCustomFieldFilter(f)}
                            style={{ accentColor: 'var(--brand)', margin: 0 }}
                          />
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export function EventDashboard({ ev, st, go, embedded = false }: any) {
  const e = ev || st?.createdEvents?.[0] || {};
  const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
  const token = localStorage.getItem('token');

  // isDemoMode is ONLY triggered by absence of event id.
  // Zero attendees on a real event is valid and must never trigger demo mode.
  const isDemoMode = !e?.id;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<EventMember[]>([]);
  const [membersAvailable, setMembersAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'registered' | 'pending' | 'checkedIn' | 'revenue'>('registered');

  // Isolated waitlist state
  const [waitlistPreview, setWaitlistPreview] = useState<WaitlistEntry[]>([]);
  const [waitlistCount, setWaitlistCount]     = useState(0);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);

  // Export CSV state
  const [showExportModal, setShowExportModal] = useState(false);

  // Pending actions state
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<{
    title: string; message?: string; confirmLabel: string;
    confirmDanger?: boolean; onConfirm: () => void;
  } | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkActionResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Revenue filter
  const [revenueFilter, setRevenueFilter] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  // Request activity filter
  const [requestFilter, setRequestFilter] = useState<'today' | '7d' | '30d' | 'all'>('today');
  // Attendee Overview chart scale filter
  const [overviewScale, setOverviewScale] = useState<'today' | 'week' | 'month'>('week');
  const [mapViewMode, setMapViewMode] = useState<'auto' | 'india' | 'world'>('auto');
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [mapCenter, setMapCenter]       = useState<[number, number]>([0, 20]);
  const [mapZoom, setMapZoom]           = useState<number>(1);
  // Check-in Timeline chart scale filter
  const [checkinScale, setCheckinScale] = useState<'today' | 'week' | 'month'>('today');

  /* -------- Data fetching -------- */
  const fetchStats = useCallback(async () => {
    if (!e?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        setWaitlistPreview(data.data.waitlist ?? []);
        setWaitlistCount(data.data.waitlistCount ?? 0);
        setWaitlistEnabled(data.data.waitlistEnabled ?? false);
      }
      else setError(data.message || 'Failed to load dashboard data.');
    } catch {
      setError('Network error loading dashboard.');
    }
  }, [e?.id, apiBase, token]);

  const fetchWaitlistOnly = useCallback(async () => {
    if (!e?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-waitlist`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistPreview(data.data.waitlist ?? []);
        setWaitlistCount(data.data.waitlistCount ?? 0);
        setWaitlistEnabled(data.data.waitlistEnabled ?? false);
      }
    } catch {}
  }, [e?.id, apiBase, token]);

  const fetchMembers = useCallback(async () => {
    if (!e?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/members`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) setMembers(data.data || []);
      else setMembersAvailable(false);
    } catch {
      setMembersAvailable(false);
    }
  }, [e?.id]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchStats(), fetchMembers().catch(() => {})]);
  }, [fetchStats, fetchMembers]);

  useEffect(() => {
    if (!e?.id) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchMembers().catch(() => { setMembersAvailable(false); })
    ]).finally(() => setLoading(false));
  }, [e?.id]);

  /* -------- Active data -------- */
  const activeStats = isDemoMode ? DEMO_STATS : (stats ?? {
    totalAttendees: 0, checkedInCount: 0, pendingRequestsCount: 0,
    revenue: 0, capacity: 0, wishlistCount: 0, confirmed: [], requests: [], bookings: [],
    waitlistEnabled: false, waitlist: [], waitlistCount: 0,
  } as DashboardStats);
  const activeMembers = isDemoMode ? DEMO_MEMBERS : members;

  const confirmed = activeStats.confirmed ?? [];
  const requests  = activeStats.requests  ?? [];

  /* -------- Paid event gating -------- */
  // isDemoMode represents a sample paid event, so Revenue tab always shows in demo
  const isPaidEvent = isDemoMode || e.registration_mode === 'paid' || e.type === 'Paid';

  useEffect(() => {
    if (!isPaidEvent && activeTab === 'revenue') {
      setActiveTab('registered');
    }
  }, [isPaidEvent, activeTab]);

  useEffect(() => {
    if (!e?.id || typeof window.io === 'undefined') return;
    const apiBaseUrl = window.location.port === '8080' ? 'http://localhost:3000' : '';
    const socket = window.io(`${apiBaseUrl}/groups`, { transports: ['websocket'] });
    socket.emit('join_event', e.id);

    socket.on('waitlist_updated', (payload: any) => {
      if (payload?.eventId === e.id || !payload?.eventId) {
        fetchWaitlistOnly();
      }
    });

    return () => {
      socket.emit('leave_event', e.id);
      socket.disconnect();
    };
  }, [e?.id, fetchWaitlistOnly]);

  /* -------- Derived metrics (useMemo) -------- */
  const checkinPercentage = useMemo(() =>
    activeStats.totalAttendees > 0
      ? Math.round((activeStats.checkedInCount / activeStats.totalAttendees) * 100)
      : 0,
  [activeStats.checkedInCount, activeStats.totalAttendees]);

  const bookingStatusData = useMemo(() => [
    { name: 'Confirmed',       value: confirmed.filter(u => u.bookingStatus === 'confirmed').length },
    { name: 'Pending Payment', value: confirmed.filter(u => u.bookingStatus === 'pending_payment').length },
  ], [confirmed]);

  const paidBookings = useMemo(() =>
    confirmed.filter(u => u.bookingStatus === 'confirmed' && u.amountMinor > 0),
  [confirmed]);

  const cashPending = useMemo(() =>
    confirmed.filter(u => u.isCashPayment && u.bookingStatus === 'pending_payment').length,
  [confirmed]);

  const avgBookingValue = useMemo(() =>
    paidBookings.length > 0
      ? (activeStats.revenue / paidBookings.length).toLocaleString('en-IN', { maximumFractionDigits: 2 })
      : '—',
  [paidBookings.length, activeStats.revenue]);

  const ticketSoldDistribution = useMemo(() => {
    if (isDemoMode) {
      return [
        { name: 'VIP Ticket', value: 34 },
        { name: 'General Admission', value: 124 },
        { name: 'Student Ticket', value: 46 }
      ];
    }
    const counts: Record<string, number> = {};
    confirmed.forEach(u => {
      const name = u.ticketTypeName || 'General RSVP';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [confirmed, isDemoMode]);

  const revenueByTicketType = useMemo(() => {
    const grouped: Record<string, number> = {};
    confirmed.forEach(a => {
      if (!a.ticketTypeName || a.amountMinor <= 0) return;
      grouped[a.ticketTypeName] = (grouped[a.ticketTypeName] || 0) + (a.amountMinor / 100);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [confirmed]);

  const hasTicketBreakdown = revenueByTicketType.length > 0;

  const attendeeByUserId = useMemo(() => {
    return new Map(confirmed.map(att => [att.userId, att]));
  }, [confirmed]);

  const roleCheckInStats = useMemo(() => {
    if (!membersAvailable || !activeMembers.length) return null;
    const roleMap: Record<string, { checked: number; total: number }> = {};
    activeMembers.forEach(m => {
      if (!roleMap[m.role]) roleMap[m.role] = { checked: 0, total: 0 };
      roleMap[m.role].total++;
      const att = attendeeByUserId.get(m.userId);
      if (att?.checkinStatus === 'checked_in') roleMap[m.role].checked++;
    });
    return Object.entries(roleMap).map(([name, v]) => ({ name, ...v }));
  }, [activeMembers, attendeeByUserId, membersAvailable]);

  const registrationTimeline = useMemo(() => {
    if (isDemoMode) {
      if (overviewScale === 'today') {
        return [
          { name: '9 AM',  total: 4, confirmed: 3 },
          { name: '11 AM', total: 10, confirmed: 8 },
          { name: '1 PM',  total: 18, confirmed: 14 },
          { name: '3 PM',  total: 24, confirmed: 19 },
          { name: '5 PM',  total: 32, confirmed: 28 },
        ];
      } else if (overviewScale === 'week') {
        return [
          { name: 'Jul 7',  total: 400, confirmed: 280 },
          { name: 'Jul 8',  total: 510, confirmed: 360 },
          { name: 'Jul 9',  total: 680, confirmed: 490 },
          { name: 'Jul 10', total: 850, confirmed: 590 },
          { name: 'Jul 11', total: 1010, confirmed: 710 },
          { name: 'Jul 12', total: 1150, confirmed: 810 },
          { name: 'Jul 13', total: 1248, confirmed: 856 },
        ];
      } else {
        return [
          { name: 'Jun 15', total: 100, confirmed: 80 },
          { name: 'Jun 20', total: 280, confirmed: 200 },
          { name: 'Jun 25', total: 510, confirmed: 380 },
          { name: 'Jun 30', total: 820, confirmed: 610 },
          { name: 'Jul 5',  total: 1050, confirmed: 780 },
          { name: 'Jul 13', total: 1248, confirmed: 856 },
        ];
      }
    }

    if (!confirmed.length) return [];

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    // Filter attendees by duration
    const filtered = confirmed.filter(att => {
      if (!att.createdAt) return false;
      const attDate = new Date(att.createdAt);
      if (overviewScale === 'today') {
        return attDate.toLocaleDateString('en-CA') === todayStr;
      } else if (overviewScale === 'week') {
        return now.getTime() - attDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      } else {
        return now.getTime() - attDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
    });

    if (overviewScale === 'today') {
      const hourMap: Record<string, { total: number; confirmed: number }> = {};
      filtered.forEach(att => {
        if (!att.createdAt) return;
        const d = new Date(att.createdAt);
        const hourLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        if (!hourMap[hourLabel]) {
          hourMap[hourLabel] = { total: 0, confirmed: 0 };
        }
        hourMap[hourLabel].total++;
        if (att.bookingStatus === 'confirmed') {
          hourMap[hourLabel].confirmed++;
        }
      });

      const sortedHours = Object.keys(hourMap).sort((a, b) => {
        const parseHour = (h: string) => {
          const parts = h.split(' ');
          let val = parseInt(parts[0]);
          const ampm = parts[1];
          if (ampm === 'PM' && val !== 12) val += 12;
          if (ampm === 'AM' && val === 12) val = 0;
          return val;
        };
        return parseHour(a) - parseHour(b);
      });

      let totalCumulative = 0;
      let confirmedCumulative = 0;

      return sortedHours.map(hour => {
        totalCumulative += hourMap[hour].total;
        confirmedCumulative += hourMap[hour].confirmed;
        return {
          name: hour,
          total: totalCumulative,
          confirmed: confirmedCumulative
        };
      });
    }

    // Group confirmed attendees by YYYY-MM-DD ISO date string for week / month
    const dateMap: Record<string, { total: number; confirmed: number }> = {};
    filtered.forEach(att => {
      if (!att.createdAt) return;
      const dateKey = new Date(att.createdAt).toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { total: 0, confirmed: 0 };
      }
      dateMap[dateKey].total++;
      if (att.bookingStatus === 'confirmed') {
        dateMap[dateKey].confirmed++;
      }
    });

    // Lexicographically sort YYYY-MM-DD date keys
    const sortedDates = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));

    // Cumulative tracking
    let totalCumulative = 0;
    let confirmedCumulative = 0;

    return sortedDates.map(date => {
      totalCumulative += dateMap[date].total;
      confirmedCumulative += dateMap[date].confirmed;
      return {
        name: new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric'
        }),
        total: totalCumulative,
        confirmed: confirmedCumulative
      };
    });
  }, [confirmed, overviewScale, isDemoMode]);

  // Request Status breakdown for Donut Chart
  const requestStatusData = useMemo(() => {
    const bList = activeStats.bookings || [];
    return [
      { name: 'Pending',  value: bList.filter(b => b.status === 'pending_approval').length },
      { name: 'Approved', value: bList.filter(b => b.status === 'confirmed' || b.status === 'pending_payment').length },
      { name: 'Rejected', value: bList.filter(b => b.status === 'cancelled').length },
    ];
  }, [activeStats.bookings]);

  // Request Activity timeline data
  const requestTimelineData = useMemo(() => {
    if (isDemoMode) {
      if (requestFilter === 'today') {
        return [
          { name: '9 AM',  received: 3, approved: 2, rejected: 0 },
          { name: '11 AM', received: 7, approved: 5, rejected: 1 },
          { name: '1 PM',  received: 12, approved: 9, rejected: 2 },
          { name: '3 PM',  received: 18, approved: 14, rejected: 3 },
          { name: '5 PM',  received: 24, approved: 18, rejected: 4 },
        ];
      } else if (requestFilter === '7d') {
        return demoRequestTrend7d;
      } else if (requestFilter === '30d') {
        return [
          { name: 'Jun 15', received: 15, approved: 12, rejected: 2 },
          { name: 'Jun 20', received: 30, approved: 22, rejected: 5 },
          { name: 'Jun 25', received: 55, approved: 42, rejected: 10 },
          { name: 'Jun 30', received: 85, approved: 62, rejected: 15 },
          { name: 'Jul 5',  received: 105, approved: 75, rejected: 18 },
          { name: 'Jul 13', received: 124, approved: 82, rejected: 18 },
        ];
      } else {
        return [
          { name: 'Jun 1',  received: 5, approved: 3, rejected: 1 },
          { name: 'Jun 15', received: 15, approved: 12, rejected: 2 },
          { name: 'Jul 1',  received: 75, approved: 52, rejected: 12 },
          { name: 'Jul 13', received: 124, approved: 82, rejected: 18 },
        ];
      }
    }

    const bList = activeStats.bookings || [];
    if (!bList.length) return [];

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    // Filter bookings based on requestFilter duration
    const filteredBookings = bList.filter(b => {
      if (!b.createdAt) return false;
      const bDate = new Date(b.createdAt);
      if (requestFilter === 'today') {
        return bDate.toLocaleDateString('en-CA') === todayStr;
      } else if (requestFilter === '7d') {
        return now.getTime() - bDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      } else if (requestFilter === '30d') {
        return now.getTime() - bDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
      return true; // 'all'
    });

    if (requestFilter === 'today') {
      // Group by hour for today view
      const hourMap: Record<string, { received: number; approved: number; rejected: number }> = {};
      filteredBookings.forEach(b => {
        if (!b.createdAt) return;
        const d = new Date(b.createdAt);
        const hourLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        if (!hourMap[hourLabel]) hourMap[hourLabel] = { received: 0, approved: 0, rejected: 0 };
        hourMap[hourLabel].received++;
        if (b.status === 'confirmed' || b.status === 'pending_payment') hourMap[hourLabel].approved++;
        else if (b.status === 'cancelled') hourMap[hourLabel].rejected++;
      });
      const sortedHours = Object.keys(hourMap).sort((a, b) => {
        const parseHour = (h: string) => {
          const parts = h.split(' ');
          let val = parseInt(parts[0]);
          if (parts[1] === 'PM' && val !== 12) val += 12;
          if (parts[1] === 'AM' && val === 12) val = 0;
          return val;
        };
        return parseHour(a) - parseHour(b);
      });
      return sortedHours.map(hour => ({ name: hour, ...hourMap[hour] }));
    }

    // Group bookings by YYYY-MM-DD
    const dateMap: Record<string, { received: number; approved: number; rejected: number }> = {};
    filteredBookings.forEach(b => {
      if (!b.createdAt) return;
      const dateKey = new Date(b.createdAt).toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { received: 0, approved: 0, rejected: 0 };
      }
      dateMap[dateKey].received++;
      if (b.status === 'confirmed' || b.status === 'pending_payment') {
        dateMap[dateKey].approved++;
      } else if (b.status === 'cancelled') {
        dateMap[dateKey].rejected++;
      }
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));

    return sortedDates.map(date => {
      return {
        name: new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric'
        }),
        received: dateMap[date].received,
        approved: dateMap[date].approved,
        rejected: dateMap[date].rejected
      };
    });
  }, [activeStats.bookings, requestFilter, isDemoMode]);

  const checkinTimeline = useMemo(() => {
    if (isDemoMode) {
      if (checkinScale === 'today') {
        return demoCheckinTimeline;
      } else if (checkinScale === 'week') {
        return [
          { name: 'Jul 7', count: 150 },
          { name: 'Jul 8', count: 280 },
          { name: 'Jul 9', count: 390 },
          { name: 'Jul 10', count: 510 },
          { name: 'Jul 11', count: 630 },
          { name: 'Jul 12', count: 760 },
          { name: 'Jul 13', count: 856 },
        ];
      } else {
        return [
          { name: 'Jun 15', count: 40 },
          { name: 'Jun 20', count: 120 },
          { name: 'Jun 25', count: 280 },
          { name: 'Jun 30', count: 490 },
          { name: 'Jul 5', count: 680 },
          { name: 'Jul 13', count: 856 },
        ];
      }
    }

    // Filter checked-in attendees
    const checkedInList = confirmed.filter(
      a => a.checkinStatus === 'checked_in' && a.checkinTime
    );
    if (!checkedInList.length) return [];

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const filteredCheckedIn = checkedInList.filter(a => {
      const bDate = new Date(a.checkinTime!);
      if (checkinScale === 'today') {
        return bDate.toLocaleDateString('en-CA') === todayStr;
      } else if (checkinScale === 'week') {
        return now.getTime() - bDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      } else {
        return now.getTime() - bDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
    });

    if (checkinScale === 'today') {
      // Group hourly
      const hourMap: Record<string, number> = {};
      filteredCheckedIn.forEach(a => {
        const d = new Date(a.checkinTime!);
        const hourLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        hourMap[hourLabel] = (hourMap[hourLabel] || 0) + 1;
      });

      const sortedHours = Object.keys(hourMap).sort((a, b) => {
        const parseHour = (h: string) => {
          const parts = h.split(' ');
          let val = parseInt(parts[0]);
          const ampm = parts[1];
          if (ampm === 'PM' && val !== 12) val += 12;
          if (ampm === 'AM' && val === 12) val = 0;
          return val;
        };
        return parseHour(a) - parseHour(b);
      });

      let cumulative = 0;
      return sortedHours.map(hour => {
        cumulative += hourMap[hour];
        return {
          name: hour,
          count: cumulative
        };
      });
    } else {
      // Group daily
      const dayMap: Record<string, number> = {};
      filteredCheckedIn.forEach(a => {
        const dateKey = new Date(a.checkinTime!).toISOString().split('T')[0];
        dayMap[dateKey] = (dayMap[dateKey] || 0) + 1;
      });

      const sortedDays = Object.keys(dayMap).sort((a, b) => a.localeCompare(b));
      let cumulative = 0;
      return sortedDays.map(date => {
        cumulative += dayMap[date];
        return {
          name: new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
          }),
          count: cumulative
        };
      });
    }
  }, [confirmed, checkinScale, isDemoMode]);

  const revenueToday = useMemo(() => {
    if (isDemoMode) return 12400;
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const todayList = confirmed.filter(u => u.amountMinor > 0 && u.createdAt && new Date(u.createdAt).toLocaleDateString('en-CA') === todayStr);
    return todayList.reduce((sum, u) => sum + (u.amountMinor / 100), 0);
  }, [confirmed, isDemoMode]);

  const revenueTimeline = useMemo(() => {
    if (isDemoMode) return demoRevenueGrowth[revenueFilter];

    const paidList = confirmed.filter(u => u.amountMinor > 0);
    if (!paidList.length) return [];

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const filteredPaid = paidList.filter(att => {
      if (!att.createdAt) return false;
      const attDate = new Date(att.createdAt);
      if (revenueFilter === 'today') {
        return attDate.toLocaleDateString('en-CA') === todayStr;
      } else if (revenueFilter === '7d') {
        return now.getTime() - attDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
      } else if (revenueFilter === '30d') {
        return now.getTime() - attDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
      }
      return true; // 'all'
    });

    if (revenueFilter === 'today') {
      const hourMap: Record<string, number> = {};
      filteredPaid.forEach(att => {
        if (!att.createdAt) return;
        const d = new Date(att.createdAt);
        const hourLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        hourMap[hourLabel] = (hourMap[hourLabel] || 0) + (att.amountMinor / 100);
      });

      const sortedHours = Object.keys(hourMap).sort((a, b) => {
        const parseHour = (h: string) => {
          const parts = h.split(' ');
          let val = parseInt(parts[0]);
          const ampm = parts[1];
          if (ampm === 'PM' && val !== 12) val += 12;
          if (ampm === 'AM' && val === 12) val = 0;
          return val;
        };
        return parseHour(a) - parseHour(b);
      });

      let cumulative = 0;
      return sortedHours.map(hour => {
        cumulative += hourMap[hour];
        return {
          name: hour,
          revenue: cumulative
        };
      });
    }

    // Group by YYYY-MM-DD ISO date string
    const dateMap: Record<string, number> = {};
    filteredPaid.forEach(att => {
      if (!att.createdAt) return;
      const dateKey = new Date(att.createdAt).toISOString().split('T')[0];
      dateMap[dateKey] = (dateMap[dateKey] || 0) + (att.amountMinor / 100);
    });

    // Sort dates
    const sortedDates = Object.keys(dateMap).sort((a, b) => a.localeCompare(b));

    // Cumulative tracking
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += dateMap[date];
      return {
        name: new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric'
        }),
        revenue: cumulative
      };
    });
  }, [confirmed, revenueFilter, isDemoMode]);

  // Demo chart data
  const demoRegistrationGrowth = [
    { name: 'Jul 1', members: 20 }, { name: 'Jul 5', members: 104 },
    { name: 'Jul 10', members: 510 }, { name: 'Jul 15', members: 1248 },
  ];
  const demoRegistrationSource = [
    { name: 'Direct', value: 540 }, { name: 'Invitation', value: 350 },
    { name: 'Referral', value: 220 }, { name: 'Admin Added', value: 138 },
  ];
  const demoRequestTrend7d = [
    { name: 'Jul 7', received: 10, approved: 8, rejected: 2 },
    { name: 'Jul 8', received: 20, approved: 15, rejected: 3 },
    { name: 'Jul 9', received: 35, approved: 25, rejected: 5 },
    { name: 'Jul 10', received: 45, approved: 30, rejected: 8 },
    { name: 'Jul 11', received: 30, approved: 20, rejected: 4 },
    { name: 'Jul 12', received: 25, approved: 18, rejected: 3 },
    { name: 'Jul 13', received: 18, approved: 12, rejected: 2 },
  ];
  const demoCheckinTimeline = [
    { name: '9–10AM', count: 100 }, { name: '10–11AM', count: 150 },
    { name: '11–12PM', count: 200 }, { name: '12–1PM', count: 280 },
    { name: '1–2PM', count: 126 },
  ];
  const demoRevenueGrowth = {
    today: [
      { name: '9 AM',  revenue: 2500 },
      { name: '11 AM', revenue: 14000 },
      { name: '1 PM',  revenue: 45000 },
      { name: '3 PM',  revenue: 110000 },
      { name: '5 PM',  revenue: 184500 },
    ],
    '7d': [
      { name: 'Jul 7', revenue: 25000 }, { name: 'Jul 8', revenue: 48000 },
      { name: 'Jul 9', revenue: 72000 }, { name: 'Jul 10', revenue: 110000 },
      { name: 'Jul 11', revenue: 145000 }, { name: 'Jul 12', revenue: 168000 },
      { name: 'Jul 13', revenue: 184500 },
    ],
    '30d': [
      { name: 'Jun 15', revenue: 5000 }, { name: 'Jun 20', revenue: 22000 },
      { name: 'Jun 25', revenue: 65000 }, { name: 'Jun 30', revenue: 110000 },
      { name: 'Jul 5', revenue: 145000 }, { name: 'Jul 13', revenue: 184500 },
    ],
    all: [
      { name: 'Jun 1', revenue: 0 }, { name: 'Jun 15', revenue: 22000 },
      { name: 'Jul 1', revenue: 110000 }, { name: 'Jul 13', revenue: 184500 },
    ],
  };
  const demoTicketRevenue = [
    { name: 'VIP Ticket', value: 80000 }, { name: 'General', value: 60000 },
    { name: 'Student', value: 30000 }, { name: 'Early Bird', value: 14500 },
  ];
  const demoMemberCategories = [
    { name: 'Admin', value: 2 }, { name: 'Moderator', value: 8 },
    { name: 'Member', value: 1208 }, { name: 'Guest', value: 30 },
  ];

  /* -------- Request actions -------- */
  const handleSingleAction = async (bookingId: string, action: 'accept' | 'reject') => {
    const res = await fetch(`${apiBase}/api/events/${e.id}/requests/${bookingId}/action`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        body?.error ||
        body?.message ||
        `Request failed with status ${res.status}`
      );
    }
  };

  const executeAction = (bookingId: string, action: 'accept' | 'reject', name: string) => {
    const isReject = action === 'reject';
    setConfirmModal({
      title: isReject ? `Decline ${name}'s request?` : `Approve ${name}'s request?`,
      message: isReject
        ? "They will be notified that their request was not accepted."
        : `Approve ${name}'s request to join this event?`,
      confirmLabel: isReject ? 'Reject Request' : 'Approve',
      confirmDanger: isReject,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(true);
        try {
          await handleSingleAction(bookingId, action);
          await refetch();
        } catch { /* silent */ }
        setActionLoading(false);
      }
    });
  };

  const executeBulkAction = (action: 'accept' | 'reject') => {
    const isReject = action === 'reject';
    const n = selectedRequests.length;
    setConfirmModal({
      title: isReject ? `Reject ${n} selected requests?` : `Approve ${n} selected requests?`,
      message: isReject
        ? 'This action will decline the selected membership requests. They will be notified.'
        : undefined,
      confirmLabel: isReject ? 'Reject Requests' : 'Approve Requests',
      confirmDanger: isReject,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(true);
        const results = await Promise.allSettled(
          selectedRequests.map(id => handleSingleAction(id, action))
        );
        const result: BulkActionResult = { successful: [], failed: [] };
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') result.successful.push(selectedRequests[i]);
          else result.failed.push({ bookingId: selectedRequests[i], error: (r as any).reason?.message ?? 'Unknown' });
        });
        setBulkResult(result);
        setSelectedRequests(result.failed.map(f => f.bookingId));
        setActionLoading(false);
        await refetch();
      }
    });
  };

  /* ================================================================
     SECTION RENDERERS
     ================================================================ */

  const renderRegisteredSection = () => {
    const isCapacityFull = activeStats.capacity > 0 && activeStats.totalAttendees >= activeStats.capacity;
    const showSplitLayout = isCapacityFull && waitlistEnabled && waitlistPreview.length > 0;

    return (
      <div className="dash-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Row 1: Attendee Overview (left) + Check-in Progress (right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Attendee Overview — dual-line area chart */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Attendee Overview</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['today', 'week', 'month'] as const).map(f => (
                <button key={f} className="hbtn hbtn--soft hbtn--sm"
                  style={overviewScale === f ? { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                  onClick={() => setOverviewScale(f)}
                >{f === 'today' ? 'Today' : f === 'week' ? 'Week' : 'Month'}</button>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
            {[
              { color: '#6366f1', label: 'Total Members' },
              { color: '#10b981', label: 'Confirmed Attendees' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                <svg width="26" height="12" viewBox="0 0 26 12" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="6" x2="26" y2="6" stroke={l.color} strokeWidth="2" />
                  <circle cx="13" cy="6" r="3.5" fill={l.color} />
                </svg>
                {l.label}
              </div>
            ))}
          </div>
          <div style={{ height: 220 }}>
            {isDemoMode || registrationTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={isDemoMode ? [
                    { name: 'Jun 5',  total: 0, confirmed: 0 },
                    { name: 'Jun 6',  total: 0, confirmed: 0 },
                    { name: 'Jun 7',  total: 1, confirmed: 0 },
                    { name: 'Jun 8',  total: 2, confirmed: 1 },
                    { name: 'Jun 9',  total: 3, confirmed: 2 },
                    { name: 'Jun 10', total: 2, confirmed: 2 },
                    { name: 'Jun 11', total: 2, confirmed: 2 },
                  ] : registrationTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} allowDecimals={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="total"     name="Total Members"       stroke="#6366f1" strokeWidth={2.5} fill="url(#gradTotal)"     dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="confirmed" name="Confirmed Attendees"  stroke="#10b981" strokeWidth={2.5} fill="url(#gradConfirmed)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : activeStats.totalAttendees === 0 ? (
              <EmptyState title="No registrations yet" message="Member activity will appear here once people register." icon={<I.users style={{ width: 28, height: 28, opacity: 0.35 }} />} />
            ) : (
              <UnavailableChart
                message="Historical registration data is not yet available."
                snapshot={`Current Registered Members: ${activeStats.totalAttendees}`}
              />
            )}
          </div>
        </div>

        {/* Check-in Progress — donut + side legend */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>Check-in Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1 }}>
            {/* Donut ring */}
            <div style={{ position: 'relative', width: 150, height: 150, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Checked In', value: activeStats.checkedInCount === 0 && activeStats.totalAttendees === 0 ? 0 : Math.max(0, activeStats.checkedInCount) },
                      { name: 'Remaining',  value: Math.max(0, activeStats.totalAttendees - activeStats.checkedInCount) || (isDemoMode ? 2 : 1) },
                    ]}
                    innerRadius={52} outerRadius={70} paddingAngle={2}
                    dataKey="value" stroke="none" startAngle={90} endAngle={-270}
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{checkinPercentage}%</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Checked In</div>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {[
                { dot: '#6366f1', label: 'Checked In', count: activeStats.checkedInCount, pct: checkinPercentage },
                { dot: '#e5e7eb', label: 'Remaining',  count: Math.max(0, activeStats.totalAttendees - activeStats.checkedInCount), pct: 100 - checkinPercentage },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{item.count} ({item.pct}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Members + optional Waitlist Queue */}
      <div style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* ── Left: Recent Members (75% or 100%) ── */}
        <div style={{
          flex: showSplitLayout ? '3 1 0' : '1 1 100%',
          minWidth: 0,
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', padding: 24,
          transition: 'flex 0.25s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Recent Members</h3>
            <button className="hbtn hbtn--soft hbtn--sm" style={{ color: '#6366f1', background: 'transparent', border: 'none', fontWeight: 600 }}>
              View all
            </button>
          </div>

          {confirmed.length === 0 && !isDemoMode ? (
            <EmptyState title="No members yet" message="New member registrations will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {confirmed.slice(0, 5).map((u, idx) => {
                const memberRecord = activeMembers.find(m => m.userId === u.userId);
                const role = memberRecord?.role ?? 'Member';
                const rolePalette: Record<string, { bg: string; color: string }> = {
                  Admin:     { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
                  Moderator: { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
                  Member:    { bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
                  Guest:     { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
                };
                const { bg: roleBg, color: roleColor } = rolePalette[role] ?? rolePalette.Member;
                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                    borderBottom: idx < Math.min(confirmed.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <Avatar name={u.name} size={40} />
                    {/* Name + role badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: roleBg, color: roleColor }}>{role}</span>
                    </div>
                    {/* Joined date — only in demo (no createdAt in live API) */}
                    <div style={{ flex: 1 }}>
                      {isDemoMode && u.time && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)' }}>
                          <I.cal style={{ width: 13, height: 13 }} />
                          Joined {u.time}
                        </div>
                      )}
                    </div>
                    {/* Status badge */}
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 999,
                      background: u.bookingStatus === 'confirmed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color: u.bookingStatus === 'confirmed' ? '#059669' : '#d97706',
                    }}>
                      {u.bookingStatus === 'confirmed' ? 'Confirmed' : 'Pending Payment'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Waitlist Queue (25%) — only when split ── */}
        {showSplitLayout && (
          <div style={{
            flex: '1 1 0', minWidth: 220,
            background: 'var(--surface)', borderRadius: 16,
            border: '1px solid var(--border)', padding: 24,
            animation: 'wq-fade-in 0.25s ease forwards',
          }}>
            <style>{`
              @keyframes wq-fade-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
            `}</style>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.users style={{ width: 16, height: 16, color: '#6366f1' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Waitlist Queue</h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 7px',
                  borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: '#6366f1'
                }}>
                  {waitlistCount}
                </span>
              </div>
              <button
                className="hbtn hbtn--soft hbtn--sm"
                style={{ color: '#6366f1', background: 'transparent', border: 'none', fontWeight: 600 }}
                onClick={() => go('waitlist', e)}
              >
                View all
              </button>
            </div>

            {/* Queue entries */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {waitlistPreview.map((entry, idx) => (
                <div key={entry.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: idx < waitlistPreview.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(99,102,241,0.1)', color: '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    #{entry.position}
                  </span>
                  <Avatar name={entry.name} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name}
                    </div>
                    {entry.joinedAt && (
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                        Joined {relativeTime(entry.joinedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {waitlistCount > 5 && (
              <div style={{
                marginTop: 16, textAlign: 'center', fontSize: 12,
                color: 'var(--ink-3)', borderTop: '1px solid var(--border)', paddingTop: 12,
              }}>
                {waitlistCount} people in waitlist
              </div>
            )}
          </div>
        )}
      </div>

      {/* Registration Locations Map Card */}
      {(() => {
        const demoLocations = {
          totalMapped: 4,
          totalUnknown: 1,
          cities: [
            { city: "Mumbai",       state: "Maharashtra", countryCode: "IN", count: 8, lat: 19.076,  lng: 72.877   },
            { city: "New Delhi",    state: "Delhi",       countryCode: "IN", count: 5, lat: 28.613,  lng: 77.209   },
            { city: "Bengaluru",    state: "Karnataka",   countryCode: "IN", count: 3, lat: 12.971,  lng: 77.594   },
            { city: "San Francisco",state: "California",  countryCode: "US", count: 1, lat: 37.7749, lng: -122.4194 },
          ]
        };

        const locations = isDemoMode
          ? demoLocations
          : (activeStats.locations || { totalMapped: 0, totalUnknown: 0, cities: [] });

        let venueObj: any = {};
        if (typeof e.venue === 'string') {
          try {
            if (e.venue.trim().startsWith('{')) {
              venueObj = JSON.parse(e.venue);
            }
          } catch {}
        } else if (typeof e.venue === 'object') {
          venueObj = e.venue || {};
        }

        const eventCityName = e.city || venueObj?.city || (isDemoMode ? "Mumbai" : "");

        const CITY_COORDS: Record<string, { lat: number; lng: number; state?: string }> = {
          mumbai: { lat: 19.076, lng: 72.877, state: "Maharashtra" },
          delhi: { lat: 28.613, lng: 77.209, state: "Delhi" },
          "new delhi": { lat: 28.613, lng: 77.209, state: "Delhi" },
          bengaluru: { lat: 12.971, lng: 77.594, state: "Karnataka" },
          bangalore: { lat: 12.971, lng: 77.594, state: "Karnataka" },
          pune: { lat: 18.520, lng: 73.856, state: "Maharashtra" },
          hyderabad: { lat: 17.385, lng: 78.486, state: "Telangana" },
          chennai: { lat: 13.082, lng: 80.270, state: "Tamil Nadu" },
          kolkata: { lat: 22.572, lng: 88.363, state: "West Bengal" },
          ahmedabad: { lat: 23.022, lng: 72.571, state: "Gujarat" },
          jaipur: { lat: 26.912, lng: 75.787, state: "Rajasthan" },
          lucknow: { lat: 26.846, lng: 80.946, state: "Uttar Pradesh" },
        };

        const rawCities = locations.cities || [];
        const hasEventCity = eventCityName && rawCities.some((c: any) => c.city.toLowerCase() === eventCityName.toLowerCase());
        const citiesList = [...rawCities];

        if (eventCityName && !hasEventCity) {
          const key = eventCityName.toLowerCase().trim();
          let lat = parseFloat(venueObj?.latitude || venueObj?.lat);
          let lng = parseFloat(venueObj?.longitude || venueObj?.lng);
          if (isNaN(lat) || isNaN(lng)) {
            const lookup = CITY_COORDS[key];
            if (lookup) {
              lat = lookup.lat;
              lng = lookup.lng;
            }
          }
          if (!isNaN(lat) && !isNaN(lng)) {
            citiesList.push({
              city: eventCityName,
              state: venueObj?.state || CITY_COORDS[key]?.state || "",
              countryCode: "IN",
              count: 0,
              lat,
              lng
            });
          }
        }

        const isEventCity = (cName: string) => {
          return eventCityName && cName.toLowerCase() === eventCityName.toLowerCase();
        };

        const autoWorldMap = citiesList.some((c: any) => c.countryCode !== "IN");
        const useWorldMap  = mapViewMode === 'auto' ? autoWorldMap : (mapViewMode === 'world');

        // GeoJSON sources
        const WORLD_GEO_URL        = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
        // State/province boundaries — Natural Earth admin-1 at 50m resolution
        const STATES_GEO_URL       = "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces_lines.geojson";
        // Indian state polygons (for the dedicated India highlight layer)
        const INDIA_STATES_URL     = "https://raw.githubusercontent.com/india-in-data/india-states-2019/master/india_states.geojson";
        // Indian district/city boundaries (simplified and stored locally due to huge original size)
        const INDIA_DISTRICTS_URL  = `${apiBase}/api/public/maps/india-districts`;

        // Projection center and zoom for each view
        const mapConfig = useWorldMap
          ? { center: [0, 20] as [number, number],   zoom: 1,   scale: 147, label: 'Global' }
          : { center: [83, 22] as [number, number],  zoom: 1,   scale: 900, label: 'India' };

        const maxCount = Math.max(...citiesList.map((c: any) => c.count), 1);

        // Color scale: pale purple → deep violet based on count, green for host city
        const bubbleColor = (cName: string, count: number) => {
          if (isEventCity(cName)) {
            return '#10b981'; // Host city color
          }
          const t = count / maxCount;
          const alpha = 0.5 + t * 0.5;
          const r = Math.round(139 - t * 20);
          const g = Math.round(92  - t * 30);
          const b = Math.round(246 - t * 20);
          return `rgba(${r},${g},${b},${alpha})`;
        };

        // Bubble radius proportional to count (sqrt scale)
        const bubbleRadius = (cName: string, count: number) => {
          if (isEventCity(cName)) return 9; // Visible host marker
          return 4 + Math.sqrt(count / maxCount) * 18;
        };

        const sortedCities = [...citiesList].sort((a: any, b: any) => b.count - a.count);

        // When the view mode toggles, reset map position to default for that view
        const baseCenter: [number, number] = useWorldMap ? [0, 20] : [83, 22];
        const baseScale  = useWorldMap ? 147 : 900;

        // handleCityClick: zoom map to city and show popup
        const handleCityClick = (city: any) => {
          setSelectedCity(city);
          setMapCenter([city.lng, city.lat]);
          setMapZoom(useWorldMap ? 5 : 3);
        };

        const handleResetView = () => {
          setSelectedCity(null);
          setMapCenter(baseCenter);
          setMapZoom(1);
        };

        return (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>

            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Registration Locations · {mapConfig.label}
              </h3>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {(['auto', 'india', 'world'] as const).map(mode => (
                  <button
                    key={mode}
                    className="hbtn hbtn--soft hbtn--sm"
                    style={mapViewMode === mode
                      ? { background: 'rgba(139,92,246,0.18)', color: '#8b5cf6', borderColor: '#8b5cf6' }
                      : {}}
                    onClick={() => { setMapViewMode(mode); handleResetView(); }}
                  >
                    {mode === 'auto' ? 'Auto' : mode === 'india' ? '🇮🇳 India' : '🌍 Global'}
                  </button>
                ))}
                {mapZoom > 1 && (
                  <button
                    className="hbtn hbtn--soft hbtn--sm"
                    style={{ color: '#f59e0b', borderColor: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}
                    onClick={handleResetView}
                  >
                    ↩ Reset View
                  </button>
                )}
                <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 }}>
                  {locations.totalMapped} / {locations.totalMapped + locations.totalUnknown} mapped
                </span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
              Click a bubble to inspect · Use +/− to zoom · Drag to pan
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, alignItems: 'start' }}>

              {/* MAP (Left) */}
              <div style={{ position: 'relative' }}>

                {/* ── Floating map controls ── */}
                <div style={{
                  position: 'absolute', top: 10, right: 10, zIndex: 10,
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  {/* Zoom In */}
                  <button
                    title="Zoom in"
                    onClick={() => setMapZoom(z => Math.min(z + 1, 12))}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--map-controls-bg)', backdropFilter: 'blur(6px)',
                      border: '1px solid var(--map-controls-border)', color: '#8b5cf6',
                      fontSize: 18, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                      lineHeight: 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--map-controls-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--map-controls-bg)')}
                  >+</button>

                  {/* Zoom Out */}
                  <button
                    title="Zoom out"
                    onClick={() => setMapZoom(z => Math.max(z - 1, 1))}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--map-controls-bg)', backdropFilter: 'blur(6px)',
                      border: '1px solid var(--map-controls-border)', color: '#8b5cf6',
                      fontSize: 22, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                      lineHeight: 1,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--map-controls-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--map-controls-bg)')}
                  >−</button>

                  {/* Divider */}
                  <div style={{ height: 1, background: 'var(--map-controls-border)', margin: '2px 0' }} />

                  {/* Reset / Home */}
                  <button
                    title="Reset view"
                    onClick={handleResetView}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: mapZoom > 1 ? 'rgba(245,158,11,0.15)' : 'var(--map-controls-bg)',
                      backdropFilter: 'blur(6px)',
                      border: `1px solid ${mapZoom > 1 ? 'rgba(245,158,11,0.5)' : 'var(--map-controls-border)'}`,
                      color: mapZoom > 1 ? '#f59e0b' : '#8b5cf6',
                      fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = mapZoom > 1 ? 'rgba(245,158,11,0.15)' : 'var(--map-controls-bg)')}
                  >⌂</button>
                </div>

                {/* Zoom level badge */}
                {mapZoom > 1 && (
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10, zIndex: 10,
                    background: 'var(--map-badge-bg)', backdropFilter: 'blur(4px)',
                    border: '1px solid var(--map-badge-border)', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, color: 'var(--map-badge-text)', fontWeight: 600,
                  }}>
                    ×{mapZoom.toFixed(0)} · drag to pan
                  </div>
                )}
                {mapZoom === 1 && (
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10, zIndex: 10,
                    background: 'var(--map-badge-bg)', backdropFilter: 'blur(4px)',
                    border: '1px solid var(--map-badge-border)', borderRadius: 6,
                    padding: '2px 8px', fontSize: 11, color: 'var(--ink-3)',
                  }}>
                    ☞ click a bubble · drag to pan
                  </div>
                )}

                <div style={{ background: 'var(--map-bg)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ center: baseCenter, scale: baseScale }}
                    style={{ width: '100%', height: 320, display: 'block' }}
                  >
                    <ZoomableGroup
                      center={mapCenter}
                      zoom={mapZoom}
                      onMoveEnd={({ coordinates, zoom }: any) => {
                        setMapCenter(coordinates);
                        setMapZoom(zoom);
                      }}
                    >
                      {/* World country fills */}
                      <Geographies geography={WORLD_GEO_URL}>
                        {({ geographies }: any) =>
                          geographies.map((geo: any) => {
                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="var(--map-world-fill)"
                                stroke="var(--map-world-stroke)"
                                strokeWidth={0.5 / mapZoom}
                                style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                              />
                            );
                          })
                        }
                      </Geographies>

                      {/* State / Province boundary lines — worldwide, very subtle */}
                      <Geographies geography={STATES_GEO_URL}>
                        {({ geographies }: any) =>
                          geographies.map((geo: any) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="transparent"
                              stroke="var(--map-world-stroke)"
                              strokeWidth={0.4 / mapZoom}
                              style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                            />
                          ))
                        }
                      </Geographies>

                      {/* Indian state boundaries */}
                      <Geographies geography={INDIA_STATES_URL}>
                        {({ geographies }: any) =>
                          geographies.map((geo: any) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="transparent"
                              stroke="var(--map-state-stroke)"
                              strokeWidth={0.8 / mapZoom}
                              style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                            />
                          ))
                        }
                      </Geographies>

                      {/* Indian district/city boundaries */}
                      <Geographies geography={INDIA_DISTRICTS_URL}>
                        {({ geographies }: any) =>
                          geographies.map((geo: any) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="transparent"
                              stroke="var(--map-district-stroke)"
                              strokeWidth={0.45 / mapZoom}
                              style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                            />
                          ))
                        }
                      </Geographies>

                      {/* City Bubbles — radius divided by mapZoom so screen size stays constant */}
                      {citiesList.map((city: any, idx: number) => {
                        const isSelected = selectedCity?.city === city.city;
                        // Raw radius at zoom=1; divide by mapZoom to cancel ZoomableGroup scaling
                        const r  = bubbleRadius(city.city, city.count) / mapZoom;
                        const sw = 1 / mapZoom; // stroke width also scaled down
                        return (
                          <Marker
                            key={idx}
                            coordinates={[city.lng, city.lat]}
                            onClick={() => handleCityClick(city)}
                            style={{ cursor: 'pointer' } as any}
                          >
                            {/* Selection ring */}
                            {isSelected && (
                              <circle r={r + 10 / mapZoom} fill="none" stroke="#f59e0b" strokeWidth={2 / mapZoom} opacity={0.8} />
                            )}
                            {/* Glow ring */}
                            <circle r={r + 5 / mapZoom} fill="none" stroke={bubbleColor(city.city, city.count)} strokeWidth={sw} opacity={0.4} />
                            {/* Main bubble */}
                            <circle
                              r={r}
                              fill={isSelected ? '#f59e0b' : bubbleColor(city.city, city.count)}
                              stroke="#fff"
                              strokeWidth={isSelected ? 2 / mapZoom : sw}
                              style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                            />
                            {/* City label — font size also scaled so text stays readable */}
                            {(city.count >= 2 || isSelected || isEventCity(city.city)) && (
                              <text
                                textAnchor="middle"
                                y={-(r + 8 / mapZoom)}
                                style={{
                                  fontFamily: 'inherit',
                                  fontSize: `${10 / mapZoom}px`,
                                  fill: isSelected ? '#f59e0b' : (isEventCity(city.city) ? '#10b981' : '#e2d9f3'),
                                  fontWeight: 600,
                                  pointerEvents: 'none'
                                }}
                              >
                                {city.city}
                              </text>
                            )}
                          </Marker>
                        );
                      })}
                    </ZoomableGroup>
                  </ComposableMap>
                </div>

                {/* City popup — appears below map when a bubble is clicked */}
                {selectedCity && (
                  <div style={{
                    marginTop: 10,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(30,20,60,0.95))',
                    border: '1px solid rgba(139,92,246,0.5)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeSlideUp 0.2s ease'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{selectedCity.city}</span>
                        {selectedCity.state && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{selectedCity.state}</span>}
                        {selectedCity.countryCode && <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.2)', color: '#a78bfa', borderRadius: 4, padding: '1px 6px' }}>{selectedCity.countryCode}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                        <strong style={{ color: '#8b5cf6' }}>{selectedCity.count}</strong> registration{selectedCity.count !== 1 ? 's' : ''} from this city
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Coordinates: {selectedCity.lat.toFixed(3)}°N, {selectedCity.lng.toFixed(3)}°E
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                      <button
                        className="hbtn hbtn--soft hbtn--sm"
                        style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6', borderColor: '#8b5cf6', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setMapCenter([selectedCity.lng, selectedCity.lat]);
                          setMapZoom(prev => Math.min(prev + 2, 12));
                        }}
                      >
                        🔍 Zoom In
                      </button>
                      <button
                        className="hbtn hbtn--soft hbtn--sm"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={handleResetView}
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CITY LIST (Right) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Top Cities</div>
                {sortedCities.map((c: any, i: number) => {
                  const pct = Math.round((c.count / maxCount) * 100);
                  const isSelected = selectedCity?.city === c.city;
                  return (
                    <div
                      key={i}
                      onClick={() => handleCityClick(c)}
                      style={{
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: 8,
                        background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent',
                        border: `1px solid ${isSelected ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                            background: isSelected ? '#f59e0b' : bubbleColor(c.city, c.count), flexShrink: 0,
                            transition: 'background 0.2s'
                          }} />
                          {c.city}
                          {isEventCity(c.city) && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, marginLeft: 4 }}>🟢 Host City</span>}
                          {c.state && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>({c.state})</span>}
                        </span>
                        <span style={{ color: 'var(--ink-2)', marginLeft: 8 }}>{c.count}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border-2)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: isSelected ? '#f59e0b' : bubbleColor(c.city, c.count), borderRadius: 999, transition: 'all 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}

                {locations.totalUnknown > 0 && (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8, fontStyle: 'italic' }}>
                    * {locations.totalUnknown} attendee{locations.totalUnknown > 1 ? 's' : ''} could not be located.
                  </div>
                )}

                {/* Color legend */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Registrations (bubble size)</div>
                    {eventCityName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                        Host City ({eventCityName})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(139,92,246,0.5)', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Few</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'linear-gradient(to right, rgba(139,92,246,0.3), rgba(119,62,226,1))' }} />
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Many</span>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(119,62,226,1)', display: 'inline-block' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}




      {/* Row 3: Quick Action shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {([
          { icon: <I.groups style={{ width: 22, height: 22 }} />, iconBg: 'rgba(139,92,246,0.1)', iconColor: '#8b5cf6', label: 'Manage Members', sub: 'View and manage your event members',     action: 'members'  },
          { icon: <I.mail   style={{ width: 22, height: 22 }} />, iconBg: 'rgba(16,185,129,0.1)', iconColor: '#10b981', label: 'Invite People',   sub: 'Send invitations to your friends',          action: 'invite'   },
          { icon: <I.image  style={{ width: 22, height: 22 }} />, iconBg: 'rgba(239,68,68,0.1)',  iconColor: '#ef4444', label: 'View Gallery',    sub: 'Check out event photos and moments',        action: 'gallery'  },
          { icon: <I.grid   style={{ width: 22, height: 22 }} />, iconBg: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6', label: 'Event Settings',  sub: 'Configure your event preferences',          action: 'settings' },
        ] as const).map(item => (
          <button
            key={item.label}
            onClick={() => {
              if (item.action === 'members') {
                go('event', { ...e, initialTab: 'members' });
              } else if (item.action === 'invite') {
                go('event', { ...e, initialTab: 'invite' });
              } else if (item.action === 'gallery') {
                let isGalleryEnabled = false;
                if (e.gallery?.enabled) {
                  isGalleryEnabled = true;
                } else {
                  let venueObj: any = {};
                  if (typeof e.venue === 'string') {
                    try {
                      if (e.venue.trim().startsWith('{')) {
                        venueObj = JSON.parse(e.venue);
                      }
                    } catch {}
                  } else if (typeof e.venue === 'object') {
                    venueObj = e.venue || {};
                  }
                  const meta = venueObj?.meta || {};
                  if (meta.gallery?.enabled) {
                    isGalleryEnabled = true;
                  }
                }

                if (isGalleryEnabled) {
                  go('event', { ...e, initialTab: 'gallery' });
                } else {
                  if (window.toast) window.toast("Enable gallery to view it", "warning");
                  go('event', { ...e, initialTab: 'settings' });
                }
              } else if (item.action === 'settings') {
                go('event', { ...e, initialTab: 'settings' });
              }
            }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
              padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.2s, border-color 0.2s', width: '100%',
            }}
            onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.borderColor = item.iconColor; (ev.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
            onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.borderColor = 'var(--border)';  (ev.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: item.iconBg, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.iconColor, marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>{item.sub}</div>
            </div>
            <I.arrowR style={{ width: 16, height: 16, color: 'var(--ink-3)', flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
};
  /* -------- Section 2: Pending Requests -------- */
  const renderPendingSection = () => (
    <div className="dash-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard icon={<I.users style={{ width: 20, height: 20 }} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6"
          value={activeStats.bookings.length.toLocaleString()} label="Total Requests" />
        <StatCard icon={<I.warning style={{ width: 20, height: 20 }} />} iconBg="rgba(245,158,11,0.1)" iconColor="#f59e0b"
          value={activeStats.pendingRequestsCount} label="Pending" />
        <StatCard icon={<I.check style={{ width: 20, height: 20 }} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981"
          value={activeStats.bookings.filter(b => b.status === 'confirmed' || b.status === 'pending_payment').length.toLocaleString()} label="Approved" />
        <StatCard icon={<I.filter style={{ width: 20, height: 20 }} />} iconBg="rgba(239,68,68,0.1)" iconColor="#ef4444"
          value={activeStats.bookings.filter(b => b.status === 'cancelled').length.toLocaleString()} label="Rejected" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Request Activity Chart */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Request Activity</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['today', '7d', '30d', 'all'] as const).map(f => (
                <button key={f} className="hbtn hbtn--soft hbtn--sm"
                  style={requestFilter === f ? { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                  onClick={() => setRequestFilter(f)}
                >{f === 'today' ? 'Today' : f === '7d' ? 'Last 7 Days' : f === '30d' ? 'Last 30 Days' : 'All Time'}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 220 }}>
            {isDemoMode || requestTimelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} allowDecimals={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="received" name="Received" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                  <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : activeStats.bookings.length === 0 ? (
              <EmptyState title="No requests yet" message="Requests trend activity will appear here once bookings are created." icon={<I.users style={{ width: 28, height: 28, opacity: 0.35 }} />} />
            ) : (
              <UnavailableChart
                message="Request trend history is not yet available."
                snapshot={`Current pending: ${activeStats.pendingRequestsCount}`}
              />
            )}
          </div>
        </div>

        {/* Request Status Donut */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 16px', fontWeight: 600 }}>Request Status</h3>
          {isDemoMode || activeStats.bookings.length > 0 ? (() => {
            const reqStatus = requestStatusData;
            const totalBookingsCount = activeStats.bookings.length;
            return (
              <>
                <div style={{ flex: 1, position: 'relative', minHeight: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={reqStatus} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                        <Cell fill="#f59e0b" /><Cell fill="#10b981" /><Cell fill="#ef4444" />
                      </Pie>
                      <RechartsTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{totalBookingsCount.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Total</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {reqStatus.map((t, i) => (
                    <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-2)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: ['#f59e0b','#10b981','#ef4444'][i] }} />
                        {t.name}
                      </div>
                      <span style={{ fontWeight: 600 }}>{t.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })() : (
            <EmptyState title="No requests yet" message="Request status breakdown will appear here once bookings are created." icon={<I.users style={{ width: 28, height: 28, opacity: 0.35 }} />} />
          )}
        </div>
      </div>

      {/* Pending Action Feed */}
      <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>
            Pending Requests {requests.length > 0 && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 999, padding: '2px 8px', fontSize: 12, marginLeft: 8 }}>{requests.length}</span>}
          </h3>
          {selectedRequests.length > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="hbtn hbtn--soft hbtn--sm" style={{ color: '#ef4444' }}
                onClick={() => executeBulkAction('reject')} disabled={actionLoading}>
                Reject Selected ({selectedRequests.length})
              </button>
              <button className="hbtn hbtn--primary hbtn--sm"
                onClick={() => executeBulkAction('accept')} disabled={actionLoading}>
                Approve Selected ({selectedRequests.length})
              </button>
            </div>
          )}
        </div>

        {/* Bulk result banner */}
        {bulkResult && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: bulkResult.failed.length ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>
              {bulkResult.successful.length > 0 && <span style={{ color: '#10b981', fontWeight: 600 }}>{bulkResult.successful.length} approved</span>}
              {bulkResult.successful.length > 0 && bulkResult.failed.length > 0 && ' · '}
              {bulkResult.failed.length > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{bulkResult.failed.length} failed</span>}
            </span>
            {bulkResult.failed.length > 0 && (
              <button className="hbtn hbtn--soft hbtn--sm" onClick={() => { setBulkResult(null); executeBulkAction('accept'); }}>
                Retry Failed
              </button>
            )}
          </div>
        )}

        {/* Select all */}
        {requests.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, color: 'var(--ink-3)' }}>
            <input type="checkbox"
              checked={selectedRequests.length === requests.length && requests.length > 0}
              onChange={e => setSelectedRequests(e.target.checked ? requests.map(r => r.bookingId) : [])}
            /> Select All
          </div>
        )}

        {requests.length === 0 && !isDemoMode ? (
          <EmptyState title="No pending requests" message="All caught up! New join requests will appear here." icon={<I.check style={{ width: 28, height: 28, opacity: 0.35 }} />} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((u) => (
              <div key={u.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--field)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input type="checkbox" checked={selectedRequests.includes(u.bookingId)}
                      onChange={ev => setSelectedRequests(prev => ev.target.checked ? [...prev, u.bookingId] : prev.filter(id => id !== u.bookingId))}
                    />
                    <Avatar name={u.name} size={38} img={u.picture ?? undefined} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {u.email}
                        {isDemoMode && u.time && ` · ${u.time}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="hbtn hbtn--soft hbtn--sm" style={{ color: '#ef4444' }}
                      onClick={() => executeAction(u.bookingId, 'reject', u.name)} disabled={actionLoading}>
                      Reject
                    </button>
                    <button className="hbtn hbtn--primary hbtn--sm"
                      onClick={() => executeAction(u.bookingId, 'accept', u.name)} disabled={actionLoading}>
                      Approve
                    </button>
                    <button className="hbtn hbtn--soft hbtn--sm"
                      onClick={() => setExpandedAnswers(prev => ({ ...prev, [u.id]: !prev[u.id] }))}>
                      {expandedAnswers[u.id] ? 'Hide Responses' : 'Responses'}
                    </button>
                  </div>
                </div>
                {expandedAnswers[u.id] && (
                  <div style={{ padding: '0 16px 16px 66px', borderTop: '1px solid var(--border-2)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Registration Responses
                    </div>
                    {(() => {
                      const filteredEntries = Object.entries(u.answers || {}).filter(
                        ([key]) => !['ticketTypeId', 'qty', 'ticketName', 'registration_location'].includes(key)
                      );
                      if (filteredEntries.length === 0) {
                        return (
                          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                            No responses provided (questions may not have been required).
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {filteredEntries.map(([key, val]: [string, any]) => {
                            const field = (e.formFields || []).find((f: any) => f.id === key);
                            const questionText = field?.question || field?.label || key;
                            return (
                              <div key={key} style={{ fontSize: 13 }}>
                                <div style={{ color: 'var(--ink-2)', fontWeight: 500, marginBottom: 2 }}>Q: {questionText}</div>
                                <div style={{ color: 'var(--ink)', padding: '6px 10px', background: 'var(--surface-2)', borderRadius: 6, border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
                                  {String(val)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* -------- Section 3: Checked In -------- */
  const renderCheckedInSection = () => (
    <div className="dash-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard icon={<I.users style={{ width: 20, height: 20 }} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6"
          value={activeStats.totalAttendees.toLocaleString()} label="Total Attendees" />
        <StatCard icon={<I.check style={{ width: 20, height: 20 }} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981"
          value={activeStats.checkedInCount.toLocaleString()} label="Checked In" />
        <StatCard icon={<I.cal style={{ width: 20, height: 20 }} />} iconBg="rgba(245,158,11,0.1)" iconColor="#f59e0b"
          value={(activeStats.totalAttendees - activeStats.checkedInCount).toLocaleString()} label="Remaining" />
        <StatCard icon={<I.filter style={{ width: 20, height: 20 }} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6"
          value={`${checkinPercentage}%`} label="Check-in Rate" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Radial progress */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 24px', fontWeight: 600, alignSelf: 'flex-start' }}>Check-in Progress</h3>
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            <svg width="160" height="160" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="var(--field)" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${checkinPercentage}, 100`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{checkinPercentage}%</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Checked In</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{activeStats.checkedInCount.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Checked In</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{(activeStats.totalAttendees - activeStats.checkedInCount).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Remaining</div>
            </div>
          </div>
        </div>

        {/* Check-in Timeline */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Check-in Timeline</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['today', 'week', 'month'] as const).map(f => (
                <button key={f} className="hbtn hbtn--soft hbtn--sm"
                  style={checkinScale === f ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: '#10b981' } : {}}
                  onClick={() => setCheckinScale(f)}
                >{f === 'today' ? 'Today' : f === 'week' ? 'Week' : 'Month'}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 240 }}>
            {isDemoMode || checkinTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={isDemoMode ? demoCheckinTimeline : checkinTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCheck" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} allowDecimals={false} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" name="Check-ins" stroke="#10b981" strokeWidth={3} fill="url(#gradCheck)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : activeStats.checkedInCount === 0 ? (
              <EmptyState title="No check-ins yet" message="Check-in activity will appear here once attendees start arriving." icon={<I.check style={{ width: 28, height: 28, opacity: 0.35 }} />} />
            ) : (
              <UnavailableChart
                message="Check-in timeline data is not yet available."
                snapshot={`Total checked in: ${activeStats.checkedInCount}`}
              />
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Check-in by Role */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 24px', fontWeight: 600 }}>Check-in by Role</h3>
          {isDemoMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { name: 'Admin', checked: 2, total: 2 },
                { name: 'Moderator', checked: 7, total: 8 },
                { name: 'Member', checked: 820, total: 1208 },
                { name: 'Guest', checked: 27, total: 30 },
              ].map(r => {
                const pct = Math.round((r.checked / r.total) * 100);
                return (
                  <div key={r.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{r.name} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{r.checked}/{r.total}</span></span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--field)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : roleCheckInStats === null ? (
            <UnavailableChart message="Role check-in data unavailable." snapshot={`Total checked in: ${activeStats.checkedInCount}`} />
          ) : roleCheckInStats.length === 0 ? (
            <EmptyState title="No role data" message="Role check-in breakdown will appear once members have roles assigned." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {roleCheckInStats.map(r => {
                const pct = r.total > 0 ? Math.round((r.checked / r.total) * 100) : 0;
                return (
                  <div key={r.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{r.name} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{r.checked}/{r.total}</span></span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--field)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#10b981', borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Recent Check-ins</h3>
            <button className="hbtn hbtn--soft hbtn--sm">View All</button>
          </div>
          {(() => {
            const checkedIn = confirmed.filter(u => u.checkinStatus === 'checked_in');
            if (checkedIn.length === 0 && !isDemoMode)
              return <EmptyState title="No check-ins yet" message="Recent check-ins will appear here." icon={<I.check style={{ width: 28, height: 28, opacity: 0.35 }} />} />;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {checkedIn.slice(0, 5).map((u) => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--field)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={u.name} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.bookingStatus === 'confirmed' ? 'Confirmed' : 'Cash Pending'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <I.check style={{ width: 12 }} />
                      {isDemoMode && u.time ? u.time : 'Checked in'}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );

  /* -------- Section 4: Revenue -------- */
  const renderRevenueSection = () => (
    <div className="dash-section" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        <StatCard icon={<I.wallet style={{ width: 20, height: 20 }} />} iconBg="rgba(139,92,246,0.1)" iconColor="#8b5cf6"
          value={`₹${activeStats.revenue.toLocaleString('en-IN')}`} label="Total Revenue" />
        <StatCard icon={<I.cal style={{ width: 20, height: 20 }} />} iconBg="rgba(59,130,246,0.1)" iconColor="#3b82f6"
          value={`₹${revenueToday.toLocaleString('en-IN')}`} label="Revenue Today" />
        <StatCard icon={<I.scan style={{ width: 20, height: 20 }} />} iconBg="rgba(16,185,129,0.1)" iconColor="#10b981"
          value={paidBookings.length.toLocaleString()} label="Paid Bookings" />
        <StatCard icon={<I.arrowL style={{ width: 20, height: 20 }} />} iconBg="rgba(239,68,68,0.1)" iconColor="#ef4444"
          value="₹0" label="Refunds" />
      </div>

      {/* Revenue Growth */}
      <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Revenue Growth</h3>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Overall revenue trend</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['today', '7d', '30d', 'all'] as const).map(f => (
              <button key={f} className="hbtn hbtn--soft hbtn--sm"
                style={revenueFilter === f ? { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                onClick={() => setRevenueFilter(f)}
              >{f === 'today' ? 'Today' : f === '7d' ? 'Last 7 Days' : f === '30d' ? 'Last 30 Days' : 'All Time'}</button>
            ))}
          </div>
        </div>
        <div style={{ height: 260 }}>
          {isDemoMode || revenueTimeline.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={isDemoMode ? demoRevenueGrowth[revenueFilter] : revenueTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} allowDecimals={false} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradRev)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : activeStats.revenue === 0 ? (
            <EmptyState title="No revenue yet" message="Revenue data will appear here once tickets are purchased." icon={<I.wallet style={{ width: 28, height: 28, opacity: 0.35 }} />} />
          ) : (
            <UnavailableChart
              message="Revenue growth timeline is not yet available."
              snapshot={`Total Revenue: ₹${activeStats.revenue.toLocaleString('en-IN')}`}
            />
          )}
        </div>
      </div>

      {/* Revenue Summary and Ticket Types Sold Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left Column: Revenue Summary */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 20px', fontWeight: 600 }}>Revenue Summary</h3>
          {paidBookings.length === 0 && !isDemoMode ? (
            <EmptyState title="No paid bookings yet" message="Revenue summary will appear here once tickets are sold." icon={<I.ticket style={{ width: 28, height: 28, opacity: 0.35 }} />} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Total Revenue', value: `₹${activeStats.revenue.toLocaleString('en-IN')}` },
                { label: 'Paid Bookings', value: paidBookings.length.toLocaleString() },
                { label: 'Average Booking Value', value: `₹${avgBookingValue}` },
                { label: 'Cash Pending', value: String(cashPending) },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none'
                }}>
                  <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{row.label}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Ticket Type Sales Distribution (Pie Chart) */}
        <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 16, margin: '0 0 16px', fontWeight: 600 }}>Tickets Sold by Type</h3>
          {ticketSoldDistribution.length === 0 ? (
            <EmptyState title="No tickets sold" message="Ticket type breakdown will appear here once bookings are confirmed." icon={<I.ticket style={{ width: 28, height: 28, opacity: 0.35 }} />} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: '100%', minHeight: 180 }}>
              <div style={{ width: 160, height: 160, position: 'relative', flexShrink: 0 }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={ticketSoldDistribution}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    cx="50%"
                    cy="50%"
                  >
                    {ticketSoldDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip />} />
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>
                    {ticketSoldDistribution.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase' }}>Sold</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 8 }}>
                {ticketSoldDistribution.map((t, idx) => (
                  <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-2)', minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--ink)', marginLeft: 8 }}>{t.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Recent Transactions</h3>
          <button className="hbtn hbtn--soft hbtn--sm">View All</button>
        </div>
        {(() => {
          const transactions = confirmed.filter(u => u.amountMinor > 0);
          if (transactions.length === 0 && !isDemoMode)
            return <EmptyState title="No transactions yet" message="Paid bookings will appear here." icon={<I.wallet style={{ width: 28, height: 28, opacity: 0.35 }} />} />;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transactions.slice(0, 5).map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'var(--field)', borderRadius: 8, gap: 12 }}>
                  <Avatar name={u.name} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.ticketTypeName || u.email}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>
                    +₹{(u.amountMinor / 100).toLocaleString('en-IN')}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                    background: u.bookingStatus === 'confirmed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: u.bookingStatus === 'confirmed' ? '#10b981' : '#f59e0b'
                  }}>
                    {u.bookingStatus === 'confirmed' ? 'Paid' : 'Cash Pending'}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );

  /* ================================================================
     TAB NAVIGATION CARDS
     ================================================================ */
  const tabs = [
    { 
      id: 'registered', 
      label: 'Registered Members', 
      val: activeStats.totalAttendees.toLocaleString(), 
      sub: isDemoMode ? '↑ 12% this week' : `of ${activeStats.capacity} capacity`,
      icon: <I.users style={{ width: 20, height: 20 }} />,
      iconBg: 'rgba(139,92,246,0.12)',
      iconColor: '#8b5cf6'
    },
    { 
      id: 'pending', 
      label: 'Pending Requests', 
      val: activeStats.pendingRequestsCount, 
      sub: isDemoMode ? '8 new today' : 'awaiting review',
      icon: <I.clock style={{ width: 20, height: 20 }} />,
      iconBg: 'rgba(245,158,11,0.12)',
      iconColor: '#f59e0b'
    },
    { 
      id: 'checkedIn', 
      label: 'Checked In', 
      val: `${activeStats.checkedInCount} / ${activeStats.totalAttendees}`, 
      sub: `${checkinPercentage}% attendance`,
      icon: <I.check style={{ width: 20, height: 20 }} />,
      iconBg: 'rgba(16,185,129,0.12)',
      iconColor: '#10b981'
    },
  ] as const;
  const allTabs = isPaidEvent
    ? [
        ...tabs,
        { 
          id: 'revenue', 
          label: 'Revenue', 
          val: `₹${activeStats.revenue.toLocaleString('en-IN')}`, 
          sub: isDemoMode ? '↑ 18.4%' : 'total collected',
          icon: <I.wallet style={{ width: 20, height: 20 }} />,
          iconBg: 'rgba(59,130,246,0.12)',
          iconColor: '#3b82f6'
        } as const
      ]
    : [...tabs];

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-3)' }}>Loading dashboard…</div>;

  return (
    <div className="scroll" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Export CSV modal */}
      {showExportModal && stats && (
        <ExportCsvModal ev={e} onClose={() => setShowExportModal(false)} />
      )}

      {/* Confirmation modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmDanger={confirmModal.confirmDanger}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <div className="flow view-enter" style={{ padding: '24px 32px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            {!embedded ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <button className="back" onClick={() => go('events')} style={{ width: 36, height: 36, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer' }}>
                    <I.arrowL style={{ width: 16 }} />
                  </button>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 999 }}>Event Dashboard</span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-0.02em' }}>{e.title || 'Dashboard Preview'}</h1>
                <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Track and analyze your event performance</div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Dashboard</h2>
                <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Track and analyze your event performance</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="hbtn hbtn--soft" 
                style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setShowExportModal(true)}
              >
                <I.download style={{ width: 16, height: 16 }} /> Export CSV
              </button>
              {!embedded && (
                <button className="hbtn hbtn--primary" onClick={() => go('edit-event', e)}>
                  <I.edit style={{ width: 16, height: 16 }} /> Edit Event
                </button>
              )}
            </div>
          </div>

          {/* Banners */}
          {isDemoMode && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#b45309', display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.warning style={{ width: 16, flexShrink: 0 }} />
              <strong>Demo Mode</strong> — Showing sample data. No real event selected.
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.warning style={{ width: 16, flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Tab Navigation Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${allTabs.length}, 1fr)`, gap: 16 }}>
            {allTabs.map(t => (
              <div key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                background: 'var(--surface)', borderRadius: 16, padding: 20, cursor: 'pointer',
                transition: 'all 0.2s',
                border: activeTab === t.id ? '2px solid #8b5cf6' : '1px solid var(--border)',
                boxShadow: activeTab === t.id ? '0 4px 16px rgba(139,92,246,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                transform: activeTab === t.id ? 'translateY(-2px)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: activeTab === t.id ? '#8b5cf6' : 'var(--ink-3)', marginBottom: 8 }}>{t.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{t.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>{t.sub}</div>
                </div>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: activeTab === t.id ? t.iconColor : t.iconBg,
                  color: activeTab === t.id ? '#fff' : t.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.2s'
                }}>
                  {t.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Section Content */}
          <div style={{ position: 'relative' }}>
            {activeTab === 'registered' && renderRegisteredSection()}
            {activeTab === 'pending'    && renderPendingSection()}
            {activeTab === 'checkedIn' && renderCheckedInSection()}
            {activeTab === 'revenue'   && isPaidEvent && renderRevenueSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
