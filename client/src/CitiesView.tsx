// @ts-nocheck
const { useEffect, useState, useCallback } = React;

const CitiesView = ({ user, logAction, addToast }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
// admin login removed – token is handled by the main app


  // Stats & Filters
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, countries: 0, states: 0 });
  const [filterOptions, setFilterOptions] = useState({ countries: [], states: [] });
  
  // Search and Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);



  const fetchStatsAndFilters = async () => {
    try {
      const [statsRes, filtersRes] = await Promise.all([
        adminApi.cities.getStats(),
        adminApi.cities.getFilters(countryFilter || undefined)
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (filtersRes.success) setFilterOptions(filtersRes.data);
    } catch (e) {
      console.error("Error loading stats/filters", e);
    }
  };

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        status: statusFilter,
        country: countryFilter,
        state: stateFilter
      };
      const res = await adminApi.cities.getCities(params);
      if (res.success) {
        setCities(res.data);
        setTotalPages(res.totalPages);
        setTotalRecords(res.total);
      } else {
        addToast("Failed to load cities.", "warning");
        setCities([]);
      }
    } catch (e) {
      console.error(e);
      addToast("Error loading cities.", "warning");
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, countryFilter, stateFilter, addToast]);

  const handleRefresh = () => {
    fetchStatsAndFilters();
    fetchCities();
  };

  const toggleCity = async (geonameId, isActive) => {
    try {
      const res = await adminApi.cities.toggleCity(geonameId, !isActive);
      if (res.success) {
        addToast(`City ${geonameId} is now ${!isActive ? "active" : "inactive"}.`, "info");
        logAction(user?.email || "System", `Toggled city ${geonameId} to ${!isActive ? "active" : "inactive"}`);
        handleRefresh();
      } else {
        addToast(res.message || "Failed to toggle city.", "warning");
      }
    } catch (e) {
      console.error(e);
      addToast("Error toggling city.", "warning");
    }
  };



  // Fetch stats and filters on mount
  useEffect(() => {
    if (localStorage.getItem('samaagum_admin_token')) {
      fetchStatsAndFilters();
    }
  }, []);

  // Refetch filters when country changes
  useEffect(() => {
    if (localStorage.getItem('samaagum_admin_token')) {
      adminApi.cities.getFilters(countryFilter || undefined)
        .then(res => { if (res.success) setFilterOptions(res.data); })
        .catch(e => console.error('Error loading filters', e));
    }
  }, [countryFilter]);

  // Fetch cities when dependencies change
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  console.log("CitiesView render cycle", { cities, stats, filterOptions, loading });

  try {
    return (
      <div className="data-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Cities Management</h3>
          <p style={{ fontSize: "13px", color: "var(--ink-3)", margin: 0 }}>Manage active/inactive status of GeoLite2 cities.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, padding: '15px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Total Cities</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{(stats?.total || 0).toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, padding: '15px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Active</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>{(stats?.active || 0).toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, padding: '15px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Inactive</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--warning)' }}>{(stats?.inactive || 0).toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, padding: '15px', background: 'var(--surface-2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase' }}>Countries</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{(stats?.countries || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', padding: '15px', background: 'var(--surface-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <input 
          type="text" 
          placeholder="Search by city, state or country..." 
          className="admin-input" 
          style={{ flex: '1 1 200px' }}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        
        <select className="admin-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <select className="admin-select" value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(""); setPage(1); }}>
          <option value="">All Countries</option>
          {(filterOptions?.countries || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="admin-select" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1); }} disabled={!(filterOptions?.states?.length)}>
          <option value="">All States</option>
          {(filterOptions?.states || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table Area */}
      <div className="table-wrapper" style={{ position: 'relative', minHeight: '300px' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <h3>Loading...</h3>
          </div>
        )}
        
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>City</th>
              <th>State</th>
              <th>Country</th>
              <th>Timezone</th>
              <th>Coordinates</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && (!cities || cities.length === 0) ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                  No cities found matching your criteria.
                </td>
              </tr>
            ) : (
              (cities || []).map((c) => (
                <tr key={c.geoname_id}>
                  <td>{c.geoname_id}</td>
                  <td><strong>{c.city_name}</strong></td>
                  <td>{c.state_name || '-'}</td>
                  <td>{c.country_name || '-'}</td>
                  <td>{c.timezone || '-'}</td>
                  <td>
                    {c.latitude && c.longitude
                      ? `${Number(c.latitude).toFixed(6)}, ${Number(c.longitude).toFixed(6)}`
                      : "-"
                    }
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      background: c.is_active ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                      color: c.is_active ? '#2ed573' : '#ff4757'
                    }}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-sm btn-sm-ghost" onClick={() => toggleCity(c.geoname_id, c.is_active)}>
                      {c.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ fontSize: '13px', color: 'var(--ink-3)' }}>
          Showing {(cities || []).length} of {(totalRecords || 0).toLocaleString()} cities
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn-sm btn-sm-ghost" 
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px' }}>Page {page} of {totalPages || 1}</span>
          <button 
            className="btn-sm btn-sm-ghost" 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

    </div>
    );
  } catch (error) {
    console.error("CitiesView Render Error:", error);
    return (
      <div style={{ padding: '20px', color: 'red', border: '1px solid red', borderRadius: '8px' }}>
        <h3>CitiesView Render Error</h3>
        <pre>{error.toString()}</pre>
        <pre>{error.stack}</pre>
      </div>
    );
  }
};

window.CitiesView = CitiesView;
