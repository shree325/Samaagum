// @ts-nocheck
const { useEffect, useState, useCallback, useRef } = React;

const useGeoLocationsFetch = () => {
  const token = localStorage.getItem('samaagum_admin_token');
  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const get = async (url) => {
    const res = await fetch(`${API_BASE}${url}`, { headers });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const post = async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const put = async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const patch = async (url, body) => {
    const res = await fetch(`${API_BASE}${url}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const del = async (url) => {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  return { get, post, put, patch, del };
};

const GEO_LOCATIONS_COLS = [
  { key: 'status', label: 'Status' },
  { key: 'geoname_id', label: 'Geoname ID' },
  { key: 'locale_code', label: 'Locale' },
  { key: 'continent_code', label: 'Continent Code' },
  { key: 'continent_name', label: 'Continent' },
  { key: 'country_iso_code', label: 'Country ISO' },
  { key: 'country_name', label: 'Country' },
  { key: 'subdivision_1_iso_code', label: 'Sub1 ISO' },
  { key: 'subdivision_1_name', label: 'Sub1 Name' },
  { key: 'subdivision_2_iso_code', label: 'Sub2 ISO' },
  { key: 'subdivision_2_name', label: 'Sub2 Name' },
  { key: 'city_name', label: 'City Name' },
  { key: 'metro_code', label: 'Metro Code' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'is_in_european_union', label: 'In EU?' }
];

const DEFAULT_VISIBLE_COLS = {
  status: true, geoname_id: true, locale_code: false, continent_code: false, continent_name: false,
  country_iso_code: true, country_name: true, subdivision_1_iso_code: false,
  subdivision_1_name: true, subdivision_2_iso_code: false, subdivision_2_name: false,
  city_name: true, metro_code: false, time_zone: true, is_in_european_union: false
};

const IconsUI = {
  search: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  columns: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" /></svg>,
  edit: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
  plus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  power: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>,
  close: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  chevronUp: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="18 15 12 9 6 15" /></svg>,
  chevronDown: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 12 15 18 9" /></svg>
};

const DownloadIconUI = (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const ToggleSwitch = ({ active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={active ? 'Active' : 'Inactive'}
    style={{
      width: '42px', height: '24px',
      background: active ? '#10b981' : '#374151',
      borderRadius: '24px', position: 'relative', cursor: 'pointer',
      transition: 'all 0.3s ease', border: 'none', padding: 0, outline: 'none',
      boxShadow: active ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'inset 0 2px 4px rgba(0,0,0,0.3)',
      flexShrink: 0
    }}
  >
    <div style={{
      width: '18px', height: '18px', background: '#ffffff', borderRadius: '50%',
      position: 'absolute', top: '3px', left: active ? '21px' : '3px',
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }} />
  </button>
);

const GeoLocationsView = ({ addToast }) => {
  const { get, post, put, patch, del } = useGeoLocationsFetch();
  const [data, setData] = useState([]);

  const handleToggleStatus = async (item) => {
    try {
      await patch(`/api/admin/cities/${item.geoname_id}/toggle`, { isActive: !item.status });
      setData(prev => prev.map(row => row.geoname_id === item.geoname_id ? { ...row, status: !item.status } : row));
    } catch (e) {
      alert("Failed to toggle status: " + e.message);
    }
  };
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('geoname_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [filterOptions, setFilterOptions] = useState({ countries: [], states: [] });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const [colsOpen, setColsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [colSearch, setColSearch] = useState("");
  const popoverRef = useRef(null);
  const exportPopoverRef = useRef(null);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('samaagum_geo_locations_cols');
    return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLS;
  });

  useEffect(() => {
    localStorage.setItem('samaagum_geo_locations_cols', JSON.stringify(visibleCols));
  }, [visibleCols]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setColsOpen(false);
      }
      if (exportPopoverRef.current && !exportPopoverRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/geo/locations?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&country=${encodeURIComponent(countryFilter)}&state=${encodeURIComponent(stateFilter)}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (e) {
      addToast("Failed to load locations", "warning");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter, countryFilter, stateFilter, sortBy, sortOrder]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = (onlyVisibleCols) => {
    setExportOpen(false);
    let url = `/api/admin/geo/locations/export?search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}&country=${encodeURIComponent(countryFilter)}&state=${encodeURIComponent(stateFilter)}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (onlyVisibleCols) {
      const vCols = GEO_LOCATIONS_COLS.filter(c => visibleCols[c.key]).map(c => c.key).join(',');
      url += `&visibleCols=${vCols}`;
    }
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
    const token = localStorage.getItem('samaagum_admin_token');
    fetch(`${API_BASE}${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `geo_locations_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch(err => addToast("Failed to export CSV", "warning"));
  };

  useEffect(() => {
    get(`/api/admin/geo/filters?country=${encodeURIComponent(countryFilter)}`)
      .then(res => setFilterOptions(res.data))
      .catch(console.error);
  }, [countryFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await put(`/api/admin/geo/locations?id=${encodeURIComponent(editingId)}`, formData);
        addToast("Location updated", "success");
      } else {
        await post('/api/admin/geo/locations', formData);
        addToast("Location created", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      addToast(err.message || "Failed to save", "warning");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this record?")) {
      try {
        await del(`/api/admin/geo/locations?id=${encodeURIComponent(id)}`);
        addToast("Deleted successfully", "success");
        loadData();
      } catch (err) {
        addToast(err.message, "warning");
      }
    }
  };

  const toggleCol = (key) => setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredCols = GEO_LOCATIONS_COLS.filter(c => c.label.toLowerCase().includes(colSearch.toLowerCase()));

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const renderPagination = () => {
    let pages = [];
    if (totalPages <= 5) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (page <= 3) pages = [1, 2, 3, 4, '...', totalPages];
      else if (page >= totalPages - 2) pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      else pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
    }

    return pages.map((p, i) =>
      p === '...' ? <span key={`ellipsis-${i}`} style={{ color: 'var(--ink-3)', padding: '0 4px' }}>...</span>
        : <button key={p} className={`btn-sm ${page === p ? 'btn-sm-primary' : 'btn-sm-ghost'}`} style={{ padding: '4px 10px', minWidth: '32px' }} onClick={() => setPage(p)}>{p}</button>
    );
  };

  return (
    <div className="data-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>

      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>GeoLite Locations</h3>
          <p style={{ fontSize: "13px", color: "var(--ink-3)", margin: 0 }}>Manage core city mappings from GeoLite2.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
          <IconsUI.search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }} />
          <input
            type="text"
            style={{
              boxSizing: 'border-box',
              width: '100%',
              height: '40px',
              paddingLeft: '42px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--field)',
              color: 'var(--ink)',
              outline: 'none',
              transition: 'box-shadow 0.2s, border 0.2s',
              fontSize: '14px'
            }}
            onFocus={(e) => { e.target.style.boxShadow = '0 0 0 3px rgba(var(--primary-rgb), 0.15)'; e.target.style.borderColor = 'var(--primary)'; }}
            onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'var(--border)'; }}
            placeholder="Search by Geoname ID, City, Country..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="form-control" style={{ minWidth: '140px', fontSize: '13px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <select className="form-control" style={{ minWidth: '140px', fontSize: '13px' }} value={countryFilter} onChange={e => { setCountryFilter(e.target.value); setStateFilter(""); setPage(1); }}>
          <option value="">All Countries</option>
          {(filterOptions?.countries || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-control" style={{ minWidth: '140px', fontSize: '13px' }} value={stateFilter} onChange={e => { setStateFilter(e.target.value); setPage(1); }} disabled={!(filterOptions?.states?.length)}>
          <option value="">All States</option>
          {(filterOptions?.states || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500, paddingRight: '8px' }}>
            {total.toLocaleString()} Records
          </div>

          <div style={{ position: 'relative' }} ref={exportPopoverRef}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px',
                borderRadius: '10px', border: '1px solid var(--primary)', background: exportOpen ? 'var(--primary-light, rgba(0, 122, 255, 0.1))' : 'transparent',
                color: 'var(--primary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light, rgba(0, 122, 255, 0.1))'}
              onMouseLeave={(e) => e.currentTarget.style.background = exportOpen ? 'var(--primary-light, rgba(0, 122, 255, 0.1))' : 'transparent'}
              onClick={() => setExportOpen(!exportOpen)}
            >
              <DownloadIconUI /> Export ▼
            </button>

            {exportOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', width: '200px', zIndex: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <button
                  onClick={() => handleExport(false)}
                  style={{ padding: '10px 16px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', color: 'var(--ink)', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Export All Fields
                </button>
                <button
                  onClick={() => handleExport(true)}
                  style={{ padding: '10px 16px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', color: 'var(--ink)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Export Visible Columns
                </button>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }} ref={popoverRef}>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px',
                borderRadius: '10px', border: '1px solid var(--border)', background: colsOpen ? 'var(--surface-2)' : 'var(--surface)',
                color: 'var(--ink)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = colsOpen ? 'var(--surface-2)' : 'var(--surface)'}
              onClick={() => setColsOpen(!colsOpen)}
            >
              <IconsUI.columns /> Columns ▼
            </button>

            {colsOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', width: '240px', zIndex: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '400px' }}>
                <div style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
                  <input type="text" className="form-control" style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }} placeholder="Find column..." value={colSearch} onChange={e => setColSearch(e.target.value)} />
                </div>
                <div style={{ overflowY: 'auto', padding: '8px' }}>
                  {filteredCols.map(c => (
                    <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', ':hover': { background: 'var(--surface-2)' } }}>
                      <input type="checkbox" checked={!!visibleCols[c.key]} onChange={() => toggleCol(c.key)} />
                      {c.label}
                    </label>
                  ))}
                  {filteredCols.length === 0 && <div style={{ padding: '10px', fontSize: '12px', color: 'var(--ink-3)', textAlign: 'center' }}>No columns found</div>}
                </div>
              </div>
            )}
          </div>

          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', height: '40px', padding: '0 16px',
              borderRadius: '10px', border: 'none', background: 'var(--primary)',
              color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)'; }}
            onClick={() => { setEditingId(null); setFormData({}); setModalOpen(true); }}
          >
            <IconsUI.plus /> Add Location
          </button>
        </div>
      </div>

      <div className="table-wrapper" style={{ flex: 1, overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', position: 'relative' }}>
        <table className="admin-table" style={{ whiteSpace: 'nowrap', width: '100%', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--surface)' }}>
            <tr>
              {GEO_LOCATIONS_COLS.filter(c => visibleCols[c.key]).map(c => (
                <th
                  key={c.key}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => handleSort(c.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {c.label}
                    {sortBy === c.key ? (sortOrder === 'asc' ? <IconsUI.chevronUp size={12} /> : <IconsUI.chevronDown size={12} />) : <div style={{ width: '12px' }} />}
                  </div>
                </th>
              ))}
              <th style={{ position: 'sticky', right: 0, zIndex: 10, background: 'var(--surface-2)', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', width: '100px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={GEO_LOCATIONS_COLS.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-3)' }}>Loading dataset...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={GEO_LOCATIONS_COLS.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-3)' }}>No records found.</td></tr>
            ) : data.map(item => (
              <tr key={item.geoname_id} style={{ height: '44px' }}>
                {GEO_LOCATIONS_COLS.filter(c => visibleCols[c.key]).map(c => (
                  <td key={c.key}>
                    {c.key === 'status' ? (
                      <span className={`badge-status ${item.status ? 'active' : 'closed'}`}>
                        {item.status ? 'Active' : 'Inactive'}
                      </span>
                    ) : c.key === 'time_zone' && item.time_zone ? (
                      <>
                        {item.time_zone}
                        {item.utc_offset && <span style={{ color: 'var(--ink-3)', marginLeft: '8px' }}>• {item.utc_offset}</span>}
                      </>
                    ) : (
                      item[c.key] !== undefined && item[c.key] !== null ? item[c.key].toString() : <span style={{ color: 'var(--ink-4)' }}>-</span>
                    )}
                  </td>
                ))}
                <td style={{ position: 'sticky', right: 0, zIndex: 10, background: 'var(--surface)', borderLeft: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                    <ToggleSwitch
                      active={!!item.status}
                      onClick={() => handleToggleStatus(item)}
                    />
                    <button className="btn-icon" title="Edit" onClick={() => { setEditingId(item.geoname_id); setFormData(item); setModalOpen(true); }} style={{ color: 'var(--primary)', padding: '6px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <IconsUI.edit />
                    </button>
                    <button className="btn-icon" title="Delete" onClick={() => handleDelete(item.geoname_id)} style={{ color: 'var(--error)', padding: '6px', borderRadius: '4px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <IconsUI.trash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <div style={{ fontSize: "13px", color: "var(--ink-3)" }}>
          Showing {(page - 1) * limit + (total > 0 ? 1 : 0)}–{Math.min(page * limit, total)} of {total.toLocaleString()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--ink-3)' }}>Per page:</span>
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className="btn-sm btn-sm-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>&laquo; Previous</button>
            {renderPagination()}
            <button className="btn-sm btn-sm-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next &raquo;</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: '550px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0 }}>{editingId ? 'Edit Location' : 'Add Location'}</h4>
              <button className="btn-icon" onClick={() => setModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer' }}>
                <IconsUI.close />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {GEO_LOCATIONS_COLS.map(c => (
                  <div key={c.key} className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-2)' }}>{c.label}</label>
                    {c.key === 'is_in_european_union' ? (
                      <select className="form-control" value={formData[c.key] ?? 0} onChange={e => setFormData({ ...formData, [c.key]: parseInt(e.target.value) })}>
                        <option value={0}>No (0)</option>
                        <option value={1}>Yes (1)</option>
                      </select>
                    ) : c.key === 'geoname_id' || c.key === 'metro_code' ? (
                      <input className="form-control" type="number" value={formData[c.key] ?? ''} onChange={e => setFormData({ ...formData, [c.key]: e.target.value ? parseInt(e.target.value) : null })} disabled={c.key === 'geoname_id' && !!editingId} />
                    ) : (
                      <input className="form-control" type="text" value={formData[c.key] ?? ''} onChange={e => setFormData({ ...formData, [c.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: 'var(--surface)' }}>
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">Save Location</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .btn-icon:hover { background: var(--surface-2) !important; }
        .admin-table tbody tr:hover td { background: var(--surface); }
      `}</style>
    </div>
  );
};

window.GeoLocationsView = GeoLocationsView;
