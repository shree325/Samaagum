import React, { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {
  DashboardPage,
  DashboardHeader,
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardSection,
  DashboardChartsGrid,
  DashboardListCard,
  DashboardChartWrapper,
  DashboardEmptyState,
  DashboardLoading,
  DashboardError
} from './components/dashboard';
import { useGroupDashboard } from './hooks/useGroupDashboard';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import {
  calculateEventStats,
  calculateMemberGrowth,
  calculateMonthlyEvents,
  buildRecentActivity
} from './selectors/groupDashboardSelectors';
import { I, Avatar } from './home-icons';
import { EventCard } from './home-cards';

interface GroupDashboardProps {
  group: any;
  st: any;
  go: (view: string, param?: any) => void;
  embedded?: boolean;
  setTab?: (tab: string) => void;
  members?: any[];
}

export const GroupDashboard: React.FC<GroupDashboardProps> = ({
  group,
  st,
  go,
  embedded = false,
  setTab,
  members: passedMembers
}) => {
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const token = localStorage.getItem('token');

  // Load raw data using hook
  const { stats, pendingRequests, loading, error, refetch } = useGroupDashboard(group?.id || group?.entity_id, apiBase, token);

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/groups/${group.id || group.entity_id}/memberships/${userId}/approve`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        refetch();
        if (window.toast) window.toast("Request approved.");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to approve request.");
      }
    } catch (e) {
      alert("An error occurred while approving the request.");
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/groups/${group.id || group.entity_id}/memberships/${userId}/reject`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        refetch();
        if (window.toast) window.toast("Request declined.");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to decline request.");
      }
    } catch (e) {
      alert("An error occurred while declining the request.");
    }
  };

  // Extract all group members (active and pending) from state or group object
  const activeMembersList = useMemo(() => {
    return passedMembers || st.groupMembers?.[group?.id || group?.entity_id] || group?.membersList || [];
  }, [passedMembers, st.groupMembers, group]);

  const allEvents = useMemo(() => {
    return st.events || window.EVENTS || [];
  }, [st.events]);

  const groupForumPosts = useMemo(() => {
    return st.groupPosts?.[group?.id || group?.entity_id] || [];
  }, [st.groupPosts, group]);

  // Derived calculations using selectors
  const eventStats = useMemo(() => {
    return calculateEventStats(allEvents, group?.id || group?.entity_id);
  }, [allEvents, group]);

  const memberGrowthData = useMemo(() => {
    return calculateMemberGrowth(activeMembersList);
  }, [activeMembersList]);

  const monthlyEventsData = useMemo(() => {
    return calculateMonthlyEvents(allEvents, group?.id || group?.entity_id);
  }, [allEvents, group]);

  const recentActivityFeed = useMemo(() => {
    return buildRecentActivity(activeMembersList, allEvents, groupForumPosts, group?.id || group?.entity_id);
  }, [activeMembersList, allEvents, groupForumPosts, group]);

  const revenueStats = useMemo(() => {
    return {
      totalRevenue: stats?.totalRevenue || 0,
      paidBookingsCount: stats?.paidBookingsCount || 0,
      ticketTypes: stats?.ticketSoldDistribution || [],
      transactions: stats?.recentTransactions || []
    };
  }, [stats]);

  const revenueTimeline = useMemo(() => {
    const list = revenueStats.transactions || [];
    if (list.length === 0) return [];
    
    // Sort transactions by date
    const sorted = [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Aggregate revenue cumulatively
    let cumulative = 0;
    return sorted.map(t => {
      const date = new Date(t.created_at);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      cumulative += (t.amountMinor / 100);
      return {
        name: label,
        revenue: cumulative
      };
    });
  }, [revenueStats.transactions]);

  const [selectedMetric, setSelectedMetric] = React.useState<'members' | 'pending_requests' | 'revenue' | 'ongoing_events' | 'pending_events' | 'events_conducted'>('members');
  const [mapViewMode, setMapViewMode] = React.useState<'auto' | 'india' | 'world'>('auto');
  const [selectedCity, setSelectedCity] = React.useState<any>(null);
  const [mapCenter, setMapCenter]       = React.useState<[number, number]>([83, 22]);
  const [mapZoom, setMapZoom]           = React.useState<number>(1);
  const [overviewScale, setOverviewScale] = React.useState<'today' | 'week' | 'month'>('week');
  const [revenueViewMode, setRevenueViewMode] = React.useState<'total' | 'event-wise'>('total');
  const [revenueFilter, setRevenueFilter] = React.useState<'today' | '7d' | '30d' | 'all'>('7d');

  // KPI card configs mapping
  const metricsConfig = useMemo(() => {
    if (!stats) return [];
    return [
      {
        key: 'members' as const,
        title: group?.settings?.capacity?.limit ? 'Registered Members' : 'Members',
        value: stats.activeMembers || 0,
        icon: <I.users style={{ width: 20, height: 20 }} />,
        color: 'blue' as const,
        subtitle: group?.settings?.capacity?.limit ? `of ${group.settings.capacity.max} capacity` : 'Active group members'
      },
      {
        key: 'pending_requests' as const,
        title: 'Pending Requests',
        value: stats.pendingMembers || 0,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        ),
        color: 'orange' as const,
        subtitle: 'Awaiting review'
      },

      {
        key: 'ongoing_events' as const,
        title: 'Ongoing Events',
        value: eventStats.ongoing,
        icon: <I.clock style={{ width: 20, height: 20 }} />,
        color: 'green' as const,
        subtitle: 'Currently running'
      },
      {
        key: 'pending_events' as const,
        title: 'Pending Events',
        value: eventStats.upcoming,
        icon: <I.cal style={{ width: 20, height: 20 }} />,
        color: 'purple' as const,
        subtitle: 'Scheduled upcoming'
      },
      {
        key: 'events_conducted' as const,
        title: 'Events Conducted',
        value: eventStats.completed,
        icon: <I.check style={{ width: 20, height: 20 }} />,
        color: 'emerald' as const,
        subtitle: 'Total completed'
      }
    ];
  }, [stats, eventStats, group, activeMembersList, revenueStats]);

  // Donut chart segments for status distribution
  const statusDistributionData = useMemo(() => {
    return [
      { name: 'Ongoing', value: eventStats.ongoing, color: '#10b981' },
      { name: 'Upcoming', value: eventStats.upcoming, color: 'var(--accent-2)' },
      { name: 'Completed', value: eventStats.completed, color: 'var(--ink-3)' }
    ].filter(item => item.value > 0);
  }, [eventStats]);

  // Filter events based on selected metric
  const filteredEvents = useMemo(() => {
    const list = eventStats.allHosted || [];
    if (selectedMetric === 'ongoing_events') {
      return list.filter(e => e.dashboardStatus === 'Ongoing');
    }
    if (selectedMetric === 'pending_events') {
      return list.filter(e => e.dashboardStatus === 'Upcoming');
    }
    if (selectedMetric === 'events_conducted') {
      return list.filter(e => e.dashboardStatus === 'Completed');
    }
    return list;
  }, [eventStats.allHosted, selectedMetric]);

  if (loading) {
    return (
      <DashboardPage>
        <DashboardLoading variant="page" />
      </DashboardPage>
    );
  }

  if (error) {
    return (
      <DashboardPage>
        <DashboardError
          title="Unable to load dashboard"
          message={error === "You don't have permission" ? "Only group owners and moderators have access to analytics." : error}
          onRetry={refetch}
        />
      </DashboardPage>
    );
  }

  if (!stats) {
    return (
      <DashboardPage>
        <DashboardEmptyState
          title="No data available yet"
          message="Statistics will update once activities are logged in the group."
        />
      </DashboardPage>
    );
  }

  // Breadcrumbs actions
  const breadcrumbs = [
    { label: 'Groups', onClick: () => go('groups') },
    { label: group?.name || 'Group Detail', onClick: () => go('group', group) },
    { label: 'Analytics' }
  ];

  return (
    <DashboardPage>
      {embedded ? null : (
        <DashboardHeader
          title="Group Analytics"
          description={`Performance & moderation insights for ${group?.name || 'your group'}`}
          breadcrumbs={breadcrumbs}
          actions={
            <button className="hbtn hbtn--soft" onClick={refetch}>
              <I.unsend style={{ width: 14, height: 14, marginRight: 6 }} /> Refresh
            </button>
          }
        />
      )}

      {/* KPI Cards Grid */}
      <DashboardMetricGrid cols={4}>
        {metricsConfig.map((metric) => (
          <DashboardMetricCard
            key={metric.key}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            colorTheme={metric.color}
            subtitle={metric.subtitle}
            isActive={selectedMetric === metric.key}
            onClick={() => setSelectedMetric(metric.key)}
            variant="stat"
          />
        ))}
      </DashboardMetricGrid>

      {/* Dynamic Analytics Details based on Selected Card */}
      {selectedMetric === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
          {/* Row 1: Attendee Overview (left) + Capacity Progress (right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Attendee Overview Area Chart */}
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column' }}>
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
              <div style={{ height: 220, flex: 1 }}>
                {memberGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={memberGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradConfirmed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--ink-3)' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }} />
                      <Area type="monotone" dataKey="members" name="Total Members" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradTotal)" dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      <Area type="monotone" dataKey="members" name="Confirmed Attendees" stroke="#10b981" strokeWidth={2.5} fill="url(#gradConfirmed)" dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)' }}>
                    <I.users style={{ width: 32, height: 32, opacity: 0.35, marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No historical registration data yet</div>
                  </div>
                )}
              </div>
            </div>

            {/* Check-in Progress Donut Chart */}
            {(() => {
              const maxCapacity = group?.settings?.capacity?.max || 10;
              const hasCapacityLimit = !!group?.settings?.capacity?.limit;
              const activeCount = stats.activeMembers || activeMembersList.length || 0;
              const pct = hasCapacityLimit ? Math.round((activeCount / maxCapacity) * 100) : 100;
              const remaining = hasCapacityLimit ? Math.max(0, maxCapacity - activeCount) : 0;
              
              return (
                <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>Check-in Progress</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0, margin: '0 auto' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Checked In', value: activeCount },
                              { name: 'Remaining', value: (activeCount === 0 && remaining === 0) ? 1 : remaining },
                            ]}
                            innerRadius={48} outerRadius={64} paddingAngle={2}
                            dataKey="value" stroke="none" startAngle={90} endAngle={-270}
                          >
                            <Cell fill="#6366f1" />
                            <Cell fill={hasCapacityLimit && remaining > 0 ? "rgba(139,92,246,0.15)" : "#e5e7eb"} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{pct}%</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>Checked In</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 100 }}>
                      {[
                        { dot: '#6366f1', label: 'Checked In', count: activeCount, pct: pct },
                        { dot: '#e5e7eb', label: 'Remaining', count: remaining, pct: 100 - pct },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{item.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{item.count} ({item.pct}%)</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Recent Members Section */}
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Recent Members</h3>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setTab && setTab('members')}>View all</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeMembersList.slice(0, 5).map((m: any, i: number) => {
                const name = typeof m === 'object' ? (m.users?.display_name || m.name || m) : m;
                const username = typeof m === 'object' ? `@${m.users?.username || m.username || 'unknown'}` : '';
                const role = typeof m === 'object' ? (m.role || 'group_member') : 'group_member';
                const roleLabel = role.replace('group_', '');

                const bgColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                const avatarBg = bgColors[i % bgColors.length];

                return (
                  <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--field)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: avatarBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13.5px' }}>{name}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--border-2)', color: 'var(--ink-2)', borderRadius: '4px', textTransform: 'capitalize' }}>
                            {roleLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>{username}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.08)', padding: '4px 10px', borderRadius: '12px' }}>
                      Confirmed
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registration Locations Map Card */}
          {(() => {
            const mappedLocations = {
              totalMapped: activeMembersList.length,
              totalUnknown: 0,
              cities: [
                { city: "Delhi", state: "National Capital Territory of Delhi", countryCode: "IN", count: activeMembersList.filter((m: any) => {
                    const u = m?.users || m;
                    const city = u?.city || u?.location?.city || '';
                    return !city || city.toLowerCase().includes('delhi');
                  }).length || activeMembersList.length, lat: 28.613, lng: 77.209 },
                { city: "Mumbai", state: "Maharashtra", countryCode: "IN", count: activeMembersList.filter((m: any) => {
                    const u = m?.users || m;
                    const city = u?.city || u?.location?.city || '';
                    return city && city.toLowerCase().includes('mumbai');
                  }).length, lat: 19.076, lng: 72.877 },
              ]
            };

            const maxCount = Math.max(...mappedLocations.cities.map((c: any) => c.count), 1);
            const sortedCities = [...mappedLocations.cities].sort((a: any, b: any) => b.count - a.count);

            const WORLD_GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
            const STATES_GEO_URL = "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_admin_1_states_provinces_lines.geojson";
            const INDIA_STATES_URL = "https://raw.githubusercontent.com/india-in-data/india-states-2019/master/india_states.geojson";
            const INDIA_DISTRICTS_URL = `${apiBase}/api/public/maps/india-districts`;

            const useWorldMap = mapViewMode === 'world';
            const mapConfig = useWorldMap
              ? { center: [0, 20] as [number, number], zoom: 1, scale: 147, label: 'Global' }
              : { center: [83, 22] as [number, number], zoom: 1, scale: 900, label: 'India' };

            const handleCityClick = (city: any) => {
              setSelectedCity(city);
              setMapCenter([city.lng, city.lat]);
              setMapZoom(useWorldMap ? 5 : 3);
            };

            const handleResetView = () => {
              setSelectedCity(null);
              setMapCenter(useWorldMap ? [0, 20] : [83, 22]);
              setMapZoom(1);
            };

            return (
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                    Registration Locations · {mapConfig.label}
                  </h3>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {(['auto', 'india', 'world'] as const).map(mode => (
                      <button
                        key={mode}
                        className="hbtn hbtn--soft hbtn--sm"
                        style={mapViewMode === mode ? { background: 'rgba(139,92,246,0.18)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
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
                      {mappedLocations.totalMapped} / {mappedLocations.totalMapped} mapped
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
                  Active members by city
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
                  <div style={{ background: 'var(--map-bg, var(--bg))', borderRadius: 12, border: '1px solid var(--border)', height: 320, overflow: 'hidden', position: 'relative' }}>
                    <ComposableMap
                      projection="geoMercator"
                      projectionConfig={{
                        scale: mapConfig.scale,
                        center: mapConfig.center
                      }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <ZoomableGroup center={mapCenter} zoom={mapZoom}>
                        {/* World country fills */}
                        <Geographies geography={WORLD_GEO_URL}>
                          {({ geographies }: any) =>
                            geographies.map((geo: any) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="var(--map-world-fill, #1f2937)"
                                stroke="var(--map-world-stroke, #374151)"
                                strokeWidth={0.5 / mapZoom}
                                style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                              />
                            ))
                          }
                        </Geographies>

                        {/* State boundaries */}
                        <Geographies geography={STATES_GEO_URL}>
                          {({ geographies }: any) =>
                            geographies.map((geo: any) => (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="transparent"
                                stroke="var(--map-world-stroke, #374151)"
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
                                stroke="var(--map-state-stroke, #8b5cf6)"
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
                                stroke="var(--map-district-stroke, rgba(139,92,246,0.3))"
                                strokeWidth={0.45 / mapZoom}
                                style={{ default: { outline: 'none' }, hover: { outline: 'none' }, pressed: { outline: 'none' } }}
                              />
                            ))
                          }
                        </Geographies>

                        {mappedLocations.cities.map((city: any, idx: number) => {
                          const isSelected = selectedCity?.city === city.city;
                          const r = (city.city === "Delhi" ? 14 : 6) / mapZoom;
                          const color = city.city === "Delhi" ? "#8b5cf6" : "#10b981";
                          return (
                            <Marker key={idx} coordinates={[city.lng, city.lat]} onClick={() => handleCityClick(city)} style={{ cursor: 'pointer' } as any}>
                              {isSelected && (
                                <circle r={r + 10 / mapZoom} fill="none" stroke="#f59e0b" strokeWidth={2 / mapZoom} opacity={0.8} />
                              )}
                              <circle r={r + 5 / mapZoom} fill="none" stroke={color} strokeWidth={1 / mapZoom} opacity={0.4} />
                              <circle
                                r={r}
                                fill={isSelected ? '#f59e0b' : color}
                                stroke="#fff"
                                strokeWidth={isSelected ? 2 / mapZoom : 1 / mapZoom}
                                style={{ cursor: 'pointer', transition: 'fill 0.2s' }}
                              />
                              {(city.count > 0 || isSelected) && (
                                <text
                                  textAnchor="middle"
                                  y={-(r + 8 / mapZoom)}
                                  style={{
                                    fontFamily: 'inherit',
                                    fontSize: `${10 / mapZoom}px`,
                                    fill: isSelected ? '#f59e0b' : '#e2d9f3',
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

                  <div>
                    <h4 style={{ fontSize: 13, margin: '0 0 12px', color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Cities</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sortedCities.map((c: any, idx: number) => {
                        const count = c.count;
                        const barWidth = activeMembersList.length > 0 ? `${(count / activeMembersList.length) * 100}%` : '0%';
                        return (
                          <div key={idx} style={{ cursor: 'pointer' }} onClick={() => handleCityClick(c)}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink)' }}>
                              <span>{c.city} <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>({c.state})</span></span>
                              <strong>{count}</strong>
                            </div>
                            <div style={{ height: 6, background: 'var(--border-2)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: barWidth, background: '#8b5cf6', borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Actions Card Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '8px' }}>
            {[
              {
                title: 'Manage Members',
                desc: 'View and manage your event members',
                icon: <I.users style={{ width: 18, height: 18 }} />,
                color: '#8b5cf6',
                bg: 'rgba(139,92,246,0.08)',
                onClick: () => setTab && setTab('members')
              },
              {
                title: 'Invite People',
                desc: 'Send invitations to your friends',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                ),
                color: '#10b981',
                bg: 'rgba(16,185,129,0.08)',
                onClick: () => setTab && setTab('invites')
              },
              {
                title: 'View Gallery',
                desc: 'Check out event photos and moments',
                icon: <I.image style={{ width: 18, height: 18 }} />,
                color: '#ef4444',
                bg: 'rgba(239,68,68,0.08)',
                onClick: () => setTab && setTab('gallery')
              },
              {
                title: 'Group Settings',
                desc: 'Configure your group preferences',
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                ),
                color: '#3b82f6',
                bg: 'rgba(59,130,246,0.08)',
                onClick: () => go('edit-group', group)
              }
            ].map((action, idx) => (
              <div
                key={idx}
                onClick={action.onClick}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--sh-md)';
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: action.bg, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {action.title}
                    <span style={{ fontSize: '14px', color: 'var(--ink-3)' }}>→</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--ink-3)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {action.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMetric === 'pending_requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
          {/* Sub KPI Cards Row */}
          {(() => {
            const pendingCount = stats.pendingMembers || 0;
            const approvedCount = stats.activeMembers || 0;
            const rejectedCount = stats.rejectedMembers || 0;
            const totalRequests = pendingCount + approvedCount + rejectedCount;

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  {[
                    {
                      title: 'Total Requests',
                      value: totalRequests,
                      icon: <I.users style={{ width: 18, height: 18, color: '#3b82f6' }} />,
                      bg: 'rgba(59,130,246,0.06)',
                      border: '1px solid var(--border)'
                    },
                    {
                      title: 'Pending',
                      value: pendingCount,
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="#f59e0b" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      ),
                      bg: 'rgba(245,158,11,0.06)',
                      border: '1px solid rgba(245,158,11,0.15)'
                    },
                    {
                      title: 'Approved',
                      value: approvedCount,
                      icon: <I.check style={{ width: 18, height: 18, color: '#10b981' }} />,
                      bg: 'rgba(16,185,129,0.06)',
                      border: '1px solid var(--border)'
                    },
                    {
                      title: 'Rejected',
                      value: rejectedCount,
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="#ef4444" strokeWidth="2">
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                      ),
                      bg: 'rgba(239,68,68,0.06)',
                      border: '1px solid var(--border)'
                    }
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--surface)',
                        border: card.border,
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12.5px', color: 'var(--ink-2)', fontWeight: 500 }}>{card.title}</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>{card.value}</div>
                      </div>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {card.icon}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Double Charts layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                  {/* Left: Request Activity */}
                  <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Request Activity</h3>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'].map((btn, bIdx) => (
                          <button
                            key={btn}
                            className="hbtn hbtn--soft hbtn--sm"
                            style={bIdx === 0 ? { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="var(--ink-3)" strokeWidth="1.8" style={{ opacity: 0.35, marginBottom: '12px' }}>
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>Visualization Unavailable</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--ink-3)', marginTop: '4px', textAlign: 'center' }}>
                        Request trend history is not yet available.<br />
                        (Current pending: {pendingCount})
                      </div>
                    </div>
                  </div>

                  {/* Right: Request Status Donut */}
                  <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>Request Status</h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative', minHeight: '140px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Pending', value: pendingCount },
                              { name: 'Approved', value: approvedCount },
                              { name: 'Rejected', value: rejectedCount }
                            ].filter(item => item.value > 0 || (pendingCount === 0 && approvedCount === 0 && rejectedCount === 0))}
                            innerRadius={48}
                            outerRadius={64}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                            startAngle={90}
                            endAngle={-270}
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{totalRequests}</div>
                        <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>Total</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {[
                        { dot: '#f59e0b', label: 'Pending', count: pendingCount },
                        { dot: '#10b981', label: 'Approved', count: approvedCount },
                        { dot: '#ef4444', label: 'Rejected', count: rejectedCount }
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dot }} />
                            <span style={{ color: 'var(--ink-2)' }}>{item.label}</span>
                          </div>
                          <strong style={{ color: 'var(--ink)' }}>{item.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom List: Pending Requests */}
                <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>Pending Requests</h3>
                  {pendingCount === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', color: 'var(--ink-3)' }}>
                      <svg viewBox="0 0 24 24" fill="none" width="32" height="32" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.25, marginBottom: '12px' }}>
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-2)' }}>No pending requests</div>
                      <div style={{ fontSize: '12.5px', marginTop: '4px' }}>All caught up! New join requests will appear here.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pendingRequests.map((m: any, idx: number) => {
                        const name = m.users?.display_name || m.name || 'Anonymous User';
                        const username = m.users?.username ? `@${m.users.username}` : '';
                        const date = m.joined_at || m.created_at ? new Date(m.joined_at || m.created_at).toLocaleDateString() : 'Recently';
                        return (
                          <div key={m.user_id || m.id || idx} style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', background: 'var(--field)', borderRadius: '12px', border: '1px solid var(--border)', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                  {name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13.5px' }}>{name}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{username} · Requested {date}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleDecline(m.user_id)} style={{ color: "#ef4444" }}>Decline</button>
                                <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleApprove(m.user_id)}>Approve</button>
                              </div>
                            </div>
                            {m.answers && Object.keys(m.answers).length > 0 && (
                              <div style={{ marginTop: 8, padding: 12, background: "var(--bg)", borderRadius: 8, fontSize: 13, border: "1px solid var(--border)" }}>
                                <h5 style={{ margin: "0 0 8px 0", fontSize: 11, textTransform: "uppercase", color: "var(--ink-3)", letterSpacing: "0.05em", fontWeight: 600 }}>Questionnaire Answers</h5>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  {Object.entries(m.answers).map(([key, ans]) => {
                                    const qidx = parseInt(key);
                                    const qs = group?.settings?.questionnaires || [];
                                    const q = (!isNaN(qidx) && qidx < 1000) ? qs[qidx] : qs.find(x => x.id === key);
                                    return (
                                      <div key={key}>
                                        <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Q: {q?.q || `Question ${isNaN(qidx) ? key : qidx + 1}`}</div>
                                        <div style={{ color: "var(--ink)", marginTop: 2 }}>A: {String(ans)}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {selectedMetric === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
          {/* Selector: Total Revenue vs Event-wise */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Revenue Analysis Type</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['total', 'event-wise'] as const).map(mode => (
                <button
                  key={mode}
                  className="hbtn hbtn--soft hbtn--sm"
                  style={revenueViewMode === mode ? { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                  onClick={() => setRevenueViewMode(mode)}
                >
                  {mode === 'total' ? 'Total Revenue' : 'Event-wise Revenue'}
                </button>
              ))}
            </div>
          </div>

          {/* Mini KPI Cards row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { title: 'Total Revenue', value: `₹${revenueStats.totalRevenue}`, icon: <I.wallet style={{ width: 18, height: 18, color: '#3b82f6' }} />, bg: 'rgba(59,130,246,0.06)' },
              { title: 'Revenue Today', value: '₹0', icon: <I.cal style={{ width: 18, height: 18, color: '#3b82f6' }} />, bg: 'rgba(59,130,246,0.06)' },
              { title: 'Paid Bookings', value: revenueStats.paidBookingsCount, icon: <I.ticket style={{ width: 18, height: 18, color: '#10b981' }} />, bg: 'rgba(16,185,129,0.06)' },
              { title: 'Refunds', value: '₹0', icon: <I.arrowL style={{ width: 18, height: 18, color: '#ef4444' }} />, bg: 'rgba(239,68,68,0.06)' }
            ].map((card, idx) => (
              <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12.5px', color: 'var(--ink-2)', fontWeight: 500 }}>{card.title}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>{card.value}</div>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue growth graph */}
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--ink)' }}>
                  {revenueViewMode === 'total' ? 'Revenue Growth' : 'Revenue by Event'}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  {revenueViewMode === 'total' ? 'Overall revenue trend' : 'Revenue comparison across events'}
                </div>
              </div>
              {revenueViewMode === 'total' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['today', '7d', '30d', 'all'] as const).map(f => (
                    <button key={f} className="hbtn hbtn--soft hbtn--sm"
                      style={revenueFilter === f ? { background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderColor: '#8b5cf6' } : {}}
                      onClick={() => setRevenueFilter(f)}
                    >
                      {f === 'today' ? 'Today' : f === '7d' ? 'Last 7 Days' : f === '30d' ? 'Last 30 Days' : 'All Time'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ height: 260 }}>
              {revenueViewMode === 'total' ? (
                revenueTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueTimeline}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }} />
                      <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradRev)" dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.35, marginBottom: '12px' }}>
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>Visualization Unavailable</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-3)', marginTop: '4px', textAlign: 'center' }}>
                      Revenue growth timeline is not yet available.
                    </div>
                  </div>
                )
              ) : (
                allEvents.filter((e: any) => e.hosted_by_entity_id === group?.id || e.hostedByEntityId === group?.id).length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allEvents.filter((e: any) => e.hosted_by_entity_id === group?.id || e.hostedByEntityId === group?.id).map((ev: any) => ({
                        name: ev.title || 'Event',
                        revenue: ev.status === 'completed' ? (ev.totalRevenue || 0) : 0
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="barShader" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-2)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--ink-3)' }} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }} />
                      <Bar dataKey="revenue" fill="url(#barShader)" radius={[4, 4, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="currentColor" strokeWidth="1.8" style={{ opacity: 0.35, marginBottom: '12px' }}>
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--ink)' }}>Visualization Unavailable</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-3)', marginTop: '4px', textAlign: 'center' }}>
                      Event-wise revenue breakdown is not yet available.
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Revenue Summary */}
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: 'var(--ink)' }}>Revenue Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Total Revenue', value: `₹${revenueStats.totalRevenue.toLocaleString('en-IN')}` },
                { label: 'Paid Bookings', value: revenueStats.paidBookingsCount.toLocaleString() },
                { label: 'Average Booking Value', value: `₹${revenueStats.totalRevenue.toLocaleString('en-IN')}` },
                { label: 'Cash Pending', value: '0' },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border-2)' : 'none'
                }}>
                  <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{row.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>Recent Transactions</h3>
              <button className="hbtn hbtn--soft hbtn--sm">View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {revenueStats.transactions.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: 'var(--field)', borderRadius: 12, border: '1px solid var(--border)', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.ticketTypeName}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>
                    +₹{(u.amountMinor / 100).toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
                    Paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {(selectedMetric === 'ongoing_events' || selectedMetric === 'pending_events' || selectedMetric === 'events_conducted') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '8px' }}>
          <DashboardSection title={`${selectedMetric === 'ongoing_events' ? 'Ongoing' : selectedMetric === 'pending_events' ? 'Upcoming' : 'Completed'} Events Analysis`}>
            <DashboardChartsGrid>
              {selectedMetric === 'ongoing_events' && (
                <DashboardChartWrapper
                  title="Event Status Distribution"
                  subtitle="Ratio of hosted event states"
                  empty={statusDistributionData.length === 0}
                  emptyMessage="No events found for status distribution."
                >
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap' }}>
                    <div style={{ width: '200px', height: '200px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {statusDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
                      {statusDistributionData.map((entry, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: entry.color }} />
                          <span style={{ color: 'var(--ink-2)' }}>{entry.name}</span>
                          <strong style={{ marginLeft: 'auto', color: 'var(--ink)' }}>{entry.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </DashboardChartWrapper>
              )}

              {(selectedMetric === 'pending_events' || selectedMetric === 'events_conducted') && (
                <DashboardChartWrapper
                  title="Monthly Events Schedule"
                  subtitle="Events conducted per calendar month"
                  empty={!monthlyEventsData.some(d => d.events > 0)}
                  emptyMessage="No historical event schedule data is available yet."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyEventsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--ink-3)" fontSize={11} />
                      <YAxis stroke="var(--ink-3)" fontSize={11} allowDecimals={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }} />
                      <Bar dataKey="events" fill="var(--accent-2)" radius={[4, 4, 0, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </DashboardChartWrapper>
              )}
            </DashboardChartsGrid>
          </DashboardSection>

          <DashboardListCard
            title={`Latest ${selectedMetric === 'ongoing_events' ? 'Ongoing' : selectedMetric === 'pending_events' ? 'Upcoming' : 'Completed'} Events`}
            empty={filteredEvents.length === 0}
            emptyMessage={`No ${selectedMetric === 'ongoing_events' ? 'ongoing' : selectedMetric === 'pending_events' ? 'upcoming' : 'completed'} events found.`}
          >
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {filteredEvents.slice(0, 4).map((ev) => (
                <div key={ev.id} style={{ position: 'relative' }}>
                  <EventCard
                    ev={ev}
                    onOpen={(e: any) => go('event', e)}
                    wishlisted={false}
                    wishlistCount={0}
                    onWishlist={() => {}}
                    registered={false}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 5,
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: ev.dashboardStatus === 'Ongoing' ? '#10b981' : ev.dashboardStatus === 'Upcoming' ? 'var(--accent-2)' : 'var(--ink-3)',
                      color: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {ev.dashboardStatus}
                  </div>
                </div>
              ))}
            </div>
          </DashboardListCard>
        </div>
      )}
    </DashboardPage>
  );
};
