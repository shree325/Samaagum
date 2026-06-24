// @ts-nocheck
/* ============================================================
   Samaagum Home — Create event + Create group (Luma-grade, live preview)
   ============================================================ */

const COVER_SWATCHES = Object.entries(COVERS).map(([k, v]) => ({ k, v }));

function CoverPicker({ value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      {COVER_SWATCHES.map(s => (
        <button key={s.k} onClick={() => onPick(s.v)} title={s.k}
          style={{
            width: 34, height: 34, borderRadius: 10, cursor: "pointer", background: s.v,
            border: value === s.v ? "2.5px solid var(--ink)" : "2px solid transparent",
            boxShadow: value === s.v ? "0 0 0 2px var(--surface) inset" : "var(--sh-sm)", transition: "transform .15s"
          }} />
      ))}
    </div>
  );
}

function Toggle({ on, onClick }) { return <button className={`tg ${on ? "on" : ""}`} onClick={onClick} />; }

/* ---------------- Create Event ---------------- */
function CreateEvent({ go, mobile }) {
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState(COVERS.sunset);
  const [type, setType] = useState("paid");
  const [cat, setCat] = useState("Startups"); const [city, setCity] = useState("Bengaluru");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [desc, setDesc] = useState("");
  const [approval, setApproval] = useState(false);
  const [cash, setCash] = useState(false);
  const [tickets, setTickets] = useState([{ n: "Early Bird", cap: "50", price: "499" }]);
  const types = [
    { k: "paid", ic: <I.ticket />, t: "Paid", d: "Sell tickets" },
    { k: "free", ic: <I.users />, t: "Free", d: "RSVP only" },
    { k: "online", ic: <I.online />, t: "Online", d: "Virtual link" },
  ];
  const setTk = (i, key, v) => setTickets(ts => ts.map((t, j) => j === i ? { ...t, [key]: v } : t));

  const venueInputRef = useRef(null);
  const cityInputRef = useRef(null);

  useEffect(() => {
    if (type === "online" || !window.google?.maps?.places || !venueInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(venueInputRef.current, {
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setVenue(place.formatted_address);
        const cityComp = place.address_components?.find(c =>
          c.types.includes("locality") || c.types.includes("administrative_area_level_2")
        );
        if (cityComp) {
          setCity(cityComp.long_name);
        }
      }
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(venueInputRef.current);
      }
    };
  }, [type]);

  useEffect(() => {
    if (!window.google?.maps?.places || !cityInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(cityInputRef.current, {
      types: ["(cities)"],
      componentRestrictions: { country: "in" },
      fields: ["address_components", "formatted_address"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.address_components) {
        const cityComp = place.address_components.find(c =>
          c.types.includes("locality") || c.types.includes("administrative_area_level_2")
        );
        if (cityComp) {
          setCity(cityComp.long_name);
        } else if (place.formatted_address) {
          setCity(place.formatted_address);
        }
      }
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(cityInputRef.current);
      }
    };
  }, []);

  const previewEv = {
    cover, cat, type: type === "free" ? "Free" : "Paid", online: type === "online",
    month: "JUN", day: "18", title: title || "Your event title",
    date: date || "Date TBD", time: time || "Time TBD",
    venue: type === "online" ? "Online" : (venue || "Venue TBD"),
    going: 0, price: type === "paid" ? `₹${tickets[0]?.price || "—"}` : "Free", attendees: [],
  };

  return (
    <div className={`create ${mobile ? "single" : ""}`}>
    city: city
  };

  return (
    <div className={`create max-w-[1000px] mx-auto w-full ${mobile ? "single" : ""}`}>
      <div className="create-form">
        <div className="cf-inner">
          <div className="create-head">
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding: "7px 11px" }}><I.arrowL /></button>
            <div><div className="ck">New event</div><h1>Create an event</h1></div>
          </div>

          <div className={`cover-up ${cover ? "filled" : ""}`} style={cover ? { background: cover } : {}}>
            {cover && <Grain />}
            <div className="up-hint" style={cover ? { color: "#fff" } : {}}>
              <div className="uic" style={cover ? { background: "rgba(255,255,255,0.2)", color: "#fff" } : {}}><I.image /></div>
              {cover ? "Looks great — pick a theme below" : "Upload a cover image"}
            </div>
          </div>
          <CoverPicker value={cover} onPick={setCover} />

          <div style={{ marginTop: 22 }}>
            <input className="title-input" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div className="cfield" style={{ marginTop: 18 }}>
            <label>Event type</label>
            <div className="type-pills">
              {types.map(t => (
                <button key={t.k} className={`type-pill ${type === t.k ? "on" : ""}`} onClick={() => setType(t.k)}>
                  <span className="tpic">{t.ic}</span><span className="tpt">{t.t}</span><span className="tpd">{t.d}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="crow">
            <div className="cfield"><label>Date</label><input className="cinput" type="text" placeholder="Thu, Jun 18" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="cfield"><label>Time</label><input className="cinput" type="text" placeholder="6:30 PM" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>

          <div className="cfield">
            <label>{type === "online" ? "Meeting link" : "Venue"} <span className="opt">{type === "online" ? "· revealed after registration" : ""}</span></label>
            <input className="cinput" placeholder={type === "online" ? "https://meet.samaagum.co/…" : "Add a venue or address"} value={venue} onChange={e => setVenue(e.target.value)} />
            <input ref={venueInputRef} className="cinput" placeholder={type === "online" ? "https://meet.samaagum.co/…" : "Add a venue or address"} value={venue} onChange={e => setVenue(e.target.value)} />
          </div>

          <div className="crow">
            <div className="cfield"><label>City</label>
              <input ref={cityInputRef} className="cinput" placeholder="Search city in India..." value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="cfield"><label>Category</label>
              <select className="cselect" value={cat} onChange={e => setCat(e.target.value)}>
                {CATS.filter(c => c[0] !== "All").map(([c]) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="cfield">
            <label>Capacity <span className="opt">· hard cap</span></label>
            <input className="cinput" placeholder="180" />
          </div>

          <div className="cfield">
            <label>Description</label>
            <textarea className="ctext" placeholder="Tell people what to expect — the vibe, who it's for, what they'll leave with." value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {type === "paid" && (
            <div className="cfield">
              <label>Ticket types</label>
              {tickets.map((t, i) => (
                <div key={i} className="ticket-row">
                  <span className="grip"><I.more style={{ transform: "rotate(90deg)" }} /></span>
                  <div className="tr-i">
                    <input className="tr-mini" placeholder="Tier name" value={t.n} onChange={e => setTk(i, "n", e.target.value)} />
                    <input className="tr-mini" placeholder="Qty" value={t.cap} onChange={e => setTk(i, "cap", e.target.value)} />
                    <input className="tr-mini" placeholder="₹ Price" value={t.price} onChange={e => setTk(i, "price", e.target.value)} />
                  </div>
                  {tickets.length > 1 && <button className="tr-del" onClick={() => setTickets(ts => ts.filter((_, j) => j !== i))}><I.x /></button>}
                </div>
              ))}
              <button className="add-row" onClick={() => setTickets(ts => [...ts, { n: "", cap: "", price: "" }])}><I.plus />Add ticket type</button>
            </div>
          )}

          <div className="cfield">
            <label>Registration settings</label>
            <div className="toggle-row"><div className="ti"><div className="t">Approval required</div><div className="d">Manually approve each registration</div></div><Toggle on={approval} onClick={() => setApproval(v => !v)} /></div>
            {type === "paid" && <div className="toggle-row"><div className="ti"><div className="t">Accept cash / offline payment</div><div className="d">Hold capacity until you confirm receipt</div></div><Toggle on={cash} onClick={() => setCash(v => !v)} /></div>}
            <div className="toggle-row"><div className="ti"><div className="t">Add to calendar (ICS)</div><div className="d">Attendees get a calendar file with their ticket</div></div><Toggle on={true} onClick={() => { }} /></div>
          </div>
        </div>
      </div>

      {!mobile && (
        <div className="create-preview">
          <div className="pv-label"><span className="d" />Live preview</div>
          <EventCard ev={previewEv} onOpen={() => { }} saved={false} onSave={() => { }} />
          <div style={{ marginTop: 22, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>Summary</div>
            <div className="side-stat"><span className="k">Type</span><span className="v" style={{ textTransform: "capitalize" }}>{type}</span></div>
            <div className="side-stat"><span className="k">Category</span><span className="v">{cat}</span></div>
            {type === "paid" && <div className="side-stat"><span className="k">From</span><span className="v">₹{tickets[0]?.price || "—"}</span></div>}
            <div className="side-stat"><span className="k">Approval</span><span className="v">{approval ? "On" : "Auto"}</span></div>
          </div>
        </div>
      )}

      <div className="create-foot" style={mobile ? { gridColumn: "1" } : { gridColumn: "1 / -1" }}>
        <button className="hbtn hbtn--ghost" onClick={() => go("home")}>Cancel</button>
        <div className="sp" />
        <button className="hbtn hbtn--ghost">Save draft</button>
        <button className="hbtn hbtn--primary" onClick={() => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city: "Bengaluru", cap: 180, desc })}><I.check />Publish event</button>
        <button className="hbtn hbtn--primary" onClick={() => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city, cap: 180, desc })}><I.check />Publish event</button>
      </div>
    </div>
  );
}

function LocationModal({ open, onClose, selectedCity, onSelectCity }) {
  const [tempCity, setTempCity] = useState(selectedCity || "");
  const [customLocationName, setCustomLocationName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const cities = [
    { name: "Indore", x: 140, y: 120, info: "Madhya Pradesh, India", lat: 22.7196, lon: 75.8577 },
    { name: "Bengaluru", x: 135, y: 190, info: "Karnataka, India", lat: 12.9716, lon: 77.5946 },
    { name: "Mumbai", x: 105, y: 145, info: "Maharashtra, India", lat: 19.0760, lon: 72.8777 },
    { name: "Delhi", x: 130, y: 70, info: "NCR, India", lat: 28.6139, lon: 77.2090 },
    { name: "Bhopal", x: 155, y: 115, info: "Madhya Pradesh, India", lat: 23.2599, lon: 77.4126 },
    { name: "Pune", x: 112, y: 158, info: "Maharashtra, India", lat: 18.5204, lon: 73.8567 },
    { name: "Hyderabad", x: 160, y: 165, info: "Telangana, India", lat: 17.3850, lon: 78.4867 },
    { name: "Chennai", x: 170, y: 198, info: "Tamil Nadu, India", lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata", x: 235, y: 110, info: "West Bengal, India", lat: 22.5726, lon: 88.3639 }
  ];

  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);

  const activeCityObj = cities.find(c => c.name === tempCity) || cities.find(c => c.name === selectedCity) || cities[0];

  const [currentLat, setCurrentLat] = useState(activeCityObj?.lat || 20.5937);
  const [currentLon, setCurrentLon] = useState(activeCityObj?.lon || 78.9629);

  // Load Leaflet dynamically when modal is open
  React.useEffect(() => {
    if (!open) return;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id = "leaflet-css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.id = "leaflet-js";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Leaflet script");
    };
    document.body.appendChild(script);
  }, [open]);

  // Set up Map instance when Leaflet and div element are ready
  React.useEffect(() => {
    if (!open || !leafletLoaded || !mapRef.current) return;

    const L = window.L;
    if (!L) return;

    const initialLat = currentLat;
    const initialLng = currentLon;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    // Initialize Map with neat UI configurations
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 12);

    mapInstanceRef.current = map;

    // CartoDB Positron - Premium minimalist light map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    // Custom pulsing pin icon matching Samaagum theme
    const customIcon = L.divIcon({
      html: `
        <div class="leaflet-custom-marker">
          <div class="marker-pulse"></div>
          <div class="marker-dot"></div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // Marker Drag Handlers
    marker.on('drag', (e) => {
      const pos = marker.getLatLng();
      setCurrentLat(pos.lat);
      setCurrentLon(pos.lng);
    });

    marker.on('dragend', (e) => {
      const pos = marker.getLatLng();
      updateLocationFromCoords(pos.lat, pos.lng);
    });

    // Map Click Handlers to reposition marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCurrentLat(lat);
      setCurrentLon(lng);
      updateLocationFromCoords(lat, lng);
    });

    // Fix map gray/misaligned tiles issue inside dynamic modals
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open, leafletLoaded]);

  // Sync Map coordinates and pan
  const panToCoords = (lat, lon) => {
    setCurrentLat(lat);
    setCurrentLon(lon);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], 13);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      }
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 50);
    }
  };

  const updateLocationFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address;
        const cityName = addr.city || addr.town || addr.suburb || addr.village || addr.municipality || addr.state || "Custom Location";
        setTempCity(cityName);
        setCustomLocationName(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Match local cities first
    const match = cities.find(c => c.name.toLowerCase() === searchQuery.trim().toLowerCase());
    if (match) {
      setTempCity(match.name);
      setCustomLocationName(match.info);
      panToCoords(match.lat, match.lon);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(data.map(item => ({
          name: item.display_name.split(',')[0],
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          info: item.type || "Location"
        })));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const filtered = cities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 720, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>

        {/* Modal Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Select Event Location</h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-3)" }}>Search or click anywhere on the map to set a precise pin</p>
          </div>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
        </div>

        {/* Modal Content */}
        <div style={{ display: "flex", height: 420, minHeight: 420 }}>

          {/* Left Panel: Search & List */}
          <div style={{ width: 280, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface-2)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              <div style={{ position: "relative", display: "flex", gap: 6 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <I.search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, color: "var(--ink-3)", pointerEvents: "none" }} />
                  <input
                    type="text"
                    className="cinput"
                    placeholder="Search city or address..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{ padding: "6px 12px 6px 28px", fontSize: 12 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="hbtn hbtn--primary"
                  style={{ padding: "0 10px", fontSize: 11.5, height: 32 }}
                >
                  {isSearching ? "..." : "Search"}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>

              {/* Online Geocoder Results */}
              {searchResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px" }}>Search Results</div>
                  {searchResults.map((r, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTempCity(r.name);
                        setCustomLocationName(r.fullName);
                        panToCoords(r.lat, r.lon);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 2,
                        padding: "8px 10px",
                        borderRadius: "var(--r-sm)",
                        border: "none",
                        background: tempCity === r.name ? "var(--accent-soft)" : "transparent",
                        color: tempCity === r.name ? "var(--accent-2)" : "var(--ink)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={e => { if (tempCity !== r.name) e.currentTarget.style.background = "var(--field)"; }}
                      onMouseLeave={e => { if (tempCity !== r.name) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
                      <span style={{ fontSize: 10.5, color: "var(--ink-3)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.fullName}</span>
                    </button>
                  ))}
                  <div style={{ borderBottom: "1px solid var(--border)", margin: "8px 0" }} />
                </div>
              )}

              {/* Local Predefined Cities */}
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px" }}>Popular Cities</div>
              {filtered.map(c => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setTempCity(c.name);
                    setCustomLocationName(c.info);
                    panToCoords(c.lat, c.lon);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                    padding: "8px 10px",
                    borderRadius: "var(--r-sm)",
                    border: "none",
                    background: tempCity === c.name ? "var(--accent-soft)" : "transparent",
                    color: tempCity === c.name ? "var(--accent-2)" : "var(--ink)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s"
                  }}
                  onMouseEnter={e => { if (tempCity !== c.name) e.currentTarget.style.background = "var(--field)"; }}
                  onMouseLeave={e => { if (tempCity !== c.name) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13, fontWeight: tempCity === c.name ? 600 : 500 }}>{c.name}</span>
                  <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{c.info}</span>
                </button>
              ))}

              {filtered.length === 0 && searchResults.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--ink-3)", padding: 20, fontSize: 12.5 }}>No locations found</div>
              )}
            </div>
          </div>

          {/* Right Panel: Map Container */}
          <div style={{ flex: 1, position: "relative", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

            {/* Real Map Container */}
            <div
              ref={mapRef}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: leafletLoaded ? 1 : 0,
                transition: "opacity 0.4s ease",
                zIndex: 1
              }}
            />

            {/* Styled Fallback Blueprint SVG Map when offline/loading */}
            {!leafletLoaded && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--border)" strokeWidth="0.5" />
                    </pattern>
                    <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a5c4e0" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#7ba5cb" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <path d="M -50,150 C 50,120 80,60 150,80 C 220,100 280,40 350,70 C 420,100 450,160 500,140 L 500,400 L -50,400 Z" fill="var(--surface-3)" opacity="0.3" />
                  <path d="M 50,250 C 120,200 180,260 250,220 C 320,180 390,240 450,200 L 450,400 L 50,400 Z" fill="var(--surface-3)" opacity="0.4" />
                  <path d="M -20,80 Q 80,110 140,180 T 260,260 T 420,380" fill="none" stroke="url(#riverGrad)" strokeWidth="32" strokeLinecap="round" />
                  <path d="M -20,80 Q 80,110 140,180 T 260,260 T 420,380" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="5,5" />
                  <path d="M 30,0 C 50,100 120,180 200,200 C 280,220 380,320 400,400" fill="none" stroke="var(--border-2)" strokeWidth="6" opacity="0.8" />
                  <path d="M 0,220 H 400" fill="none" stroke="var(--border-2)" strokeWidth="4" opacity="0.8" />
                  <path d="M 120,0 V 400" fill="none" stroke="var(--border-2)" strokeWidth="4" opacity="0.8" />
                  <path d="M 0,100 L 400,300" fill="none" stroke="var(--border-2)" strokeWidth="3" opacity="0.6" strokeDasharray="4,4" />
                  <circle cx="160" cy="195" r="8" fill="var(--surface)" stroke="var(--border-2)" strokeWidth="2" />
                  <circle cx="230" cy="235" r="8" fill="var(--surface)" stroke="var(--border-2)" strokeWidth="2" />
                  <path d="M 30,120 H 370 M 150,10 V 230" stroke="var(--border-3)" strokeWidth="1" strokeDasharray="2,4" />
                </svg>

                {activeCityObj && (
                  <div
                    style={{
                      position: "absolute",
                      left: `${activeCityObj.x}px`,
                      top: `${activeCityObj.y}px`,
                      transform: "translate(-50%, -100%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      pointerEvents: "none"
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      bottom: -2,
                      width: 32,
                      height: 12,
                      borderRadius: "50%",
                      border: "2px solid var(--accent-2)",
                      transform: "scale(1)",
                      animation: "pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite"
                    }} />
                    <div style={{
                      background: "var(--ink)",
                      color: "var(--surface)",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      boxShadow: "var(--sh-md)",
                      marginBottom: 6,
                      whiteSpace: "nowrap"
                    }}>
                      {tempCity || selectedCity}
                    </div>
                    <I.pin style={{ width: 28, height: 28, color: "var(--accent-2)" }} />
                  </div>
                )}
              </div>
            )}

            {/* Coordinates HUD overlay - works dynamically with Leaflet or fallback */}
            <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 10.5, fontFamily: "monospace", pointerEvents: "none", zIndex: 10, display: "flex", flexDirection: "column", gap: 3, border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontWeight: 600, color: "var(--accent-2)" }}>GPS HUD STATUS</div>
              <div>LAT: {currentLat.toFixed(5)}° {currentLat >= 0 ? "N" : "S"}</div>
              <div>LON: {currentLon.toFixed(5)}° {currentLon >= 0 ? "E" : "W"}</div>
            </div>

            {/* Floating selected location indicator (luma-grade detail) */}
            {customLocationName && (
              <div style={{ position: "absolute", top: 12, left: 12, right: 12, background: "var(--surface)", color: "var(--ink)", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, boxShadow: "var(--sh-md)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}>
                <I.pin style={{ width: 14, color: "var(--accent-2)", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{customLocationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10, background: "var(--field)" }}>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="hbtn hbtn--primary hbtn--sm"
            onClick={() => {
              if (tempCity) {
                onSelectCity(tempCity);
              }
              onClose();
            }}
          >
            Confirm Location
          </button>
        </div>
      </div>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.3); opacity: 1; }
          80%, 100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-custom-marker {
          position: relative;
          width: 24px;
          height: 24px;
        }
        .marker-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          background-color: var(--accent-2);
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          z-index: 2;
        }
        .marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px;
          height: 28px;
          border: 2px solid var(--accent-2);
          border-radius: 50%;
          animation: leaflet-pulsing 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
          z-index: 1;
        }
        @keyframes leaflet-pulsing {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
          80%, 100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ---------------- Questionnaire Builder Modal ---------------- */
function QuestionnaireBuilderModal({ open, onClose, questions, setQuestions, plan }) {
  const [activeTab, setActiveTab] = useState("selected");
  const isPro = plan === "pro" || plan === "enterprise";

  const predefined = [
    { id: "pq1", type: "short", q: "Why do you want to join?", req: true },
    { id: "pq2", type: "short", q: "What experience do you have?", req: false },
    { id: "pq3", type: "short", q: "Which city are you from?", req: false },
    { id: "pq4", type: "yesno", q: "Are you available for volunteering?", req: false },
  ];

  const addQ = (qObj) => setQuestions(qs => [...qs, { ...qObj, id: "q" + Date.now() }]);
  const rmQ = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));

  if (!open) return null;
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" style={{ background: "var(--surface)", width: 500, borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Join Questionnaire</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}><I.x /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {["selected", "library", "custom"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: 12, background: activeTab === t ? "var(--field)" : "transparent", border: "none", borderBottom: activeTab === t ? "2px solid var(--accent-2)" : "2px solid transparent", cursor: "pointer", textTransform: "capitalize", fontWeight: 600, color: activeTab === t ? "var(--accent-2)" : "var(--ink-2)", fontFamily: "inherit" }}>{t}</button>
          ))}
        </div>
        <div style={{ padding: 20, minHeight: 300, maxHeight: 500, overflowY: "auto" }}>
          {activeTab === "selected" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions.length === 0 ? <div style={{ color: "var(--ink-3)", textAlign: "center", padding: 20 }}>No questions added yet.</div> : null}
              {questions.map((q, i) => (
                <div key={q.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{q.q}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{q.type} • {q.req ? "Required" : "Optional"}</div>
                  </div>
                  <button onClick={() => rmQ(i)} className="hbtn hbtn--ghost hbtn--sm"><I.x /></button>
                </div>
              ))}
            </div>
          )}
          {activeTab === "library" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {predefined.filter(pq => !questions.some(q => q.q === pq.q)).map(q => (
                <div key={q.id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{q.q}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{q.type}</div>
                  </div>
                  <button onClick={() => addQ(q)} className="hbtn hbtn--soft hbtn--sm"><I.plus /> Add</button>
                </div>
              ))}
              {predefined.filter(pq => !questions.some(q => q.q === pq.q)).length === 0 && (
                <div style={{ color: "var(--ink-3)", textAlign: "center", padding: 20 }}>All library questions have been added.</div>
              )}
            </div>
          )}
          {activeTab === "custom" && (
            <div>
              {!isPro ? (
                <div style={{ padding: 20, textAlign: "center", background: "var(--field)", borderRadius: "var(--r-md)" }}>
                  <I.lock style={{ width: 24, height: 24, marginBottom: 12, color: "var(--ink-3)" }} />
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Custom questions locked</div>
                  <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 12 }}>Upgrade to Pro to create custom join questions.</div>
                  <button className="hbtn hbtn--primary hbtn--sm">Upgrade Plan</button>
                </div>
              ) : (
                <div style={{ color: "var(--ink-2)", textAlign: "center", padding: 20 }}>Custom question builder (Pro feature active)</div>
              )}
            </div>
          )}
        </div>
        <div style={{ padding: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button className="hbtn hbtn--primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function PlanModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" style={{ background: "var(--surface)", width: 500, borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Upgrade to Pro</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-2)" }}>Unlock advanced community features</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink)" }}><I.x /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, padding: 16, border: "2px solid var(--accent-2)", borderRadius: "var(--r-md)", background: "var(--accent-soft)" }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "var(--ink)" }}>Pro Plan</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "var(--ink)" }}>₹999<span style={{ fontSize: 14, fontWeight: 400, color: "var(--ink-2)" }}>/mo</span></div>
              <ul style={{ paddingLeft: 20, fontSize: 13, color: "var(--ink-2)", margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                <li>Create Paid Groups & Sell Memberships</li>
                <li>Advanced Forum Permissions (Admin/Selected)</li>
                <li>Custom Join Questionnaires</li>
                <li>Priority Support</li>
              </ul>
            </div>
          </div>
          <button className="hbtn hbtn--primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Upgrade Now</button>
        </div>
      </div>
    </div>
  );
}

function CapacitySettingsModal({ open, onClose, limitCap, setLimitCap, maxCap, setMaxCap, waitlist, setWaitlist }) {
  const [tempLimitCap, setTempLimitCap] = React.useState(limitCap);
  const [tempMaxCap, setTempMaxCap] = React.useState(maxCap);
  const [tempWaitlist, setTempWaitlist] = React.useState(waitlist);

  React.useEffect(() => {
    if (open) {
      setTempLimitCap(limitCap);
      setTempMaxCap(maxCap);
      setTempWaitlist(waitlist);
    }
  }, [open, limitCap, maxCap, waitlist]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Capacity Settings</h3>
          </div>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I.x style={{ width: 14 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
            Close registration when reaching the capacity. Only approved attendees count toward capacity.
          </p>

          {/* Option 1: Limit Event Capacity */}
          <div className="toggle-row" style={{ padding: "4px 0", background: "transparent", border: "none", margin: 0 }}>
            <div className="ti">
              <div className="t" style={{ fontSize: "13.5px", fontWeight: 600 }}>Enable Capacity Limit</div>
            </div>
            <Toggle on={tempLimitCap} onClick={() => setTempLimitCap(!tempLimitCap)} />
          </div>

          {tempLimitCap && (
            <>
              {/* Max Capacity Input */}
              <div className="cfield" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "6px", display: "block" }}>Max Capacity</label>
                <input
                  className="cinput"
                  type="number"
                  placeholder="50"
                  value={tempMaxCap}
                  onChange={e => setTempMaxCap(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", fontSize: "13.5px" }}
                />
              </div>

              {/* Option 2: Waitlist */}
              <div className="toggle-row" style={{ padding: "4px 0", background: "transparent", border: "none", margin: 0, borderTop: "1px solid var(--border-2)", paddingTop: "14px" }}>
                <div className="ti">
                  <div className="t" style={{ fontSize: "13.5px", fontWeight: 600 }}>Enable Waitlist</div>
                  <div className="d" style={{ fontSize: "11.5px", color: "var(--ink-3)", marginTop: 2 }}>Registrations above capacity are added to the waitlist.</div>
                </div>
                <Toggle on={tempWaitlist} onClick={() => setTempWaitlist(!tempWaitlist)} />
              </div>
            </>
          )}
        </div>

        {/* Actions Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--field)" }}>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="hbtn hbtn--primary hbtn--sm"
            onClick={() => {
              setLimitCap(tempLimitCap);
              setMaxCap(tempMaxCap);
              setWaitlist(tempWaitlist);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const ACCESS_OPTIONS = {
  communities: ["SGSITS", "MANIT", "LNCT", "IIT Bombay", "BITS Pilani"],
  subCommunities: ["CSE", "ECE", "Mechanical", "Civil", "Biotech"],
  groups: ["Placement Preparation", "Hackathon Team", "Startup Founders", "Design Systems Guild", "Slow Food Club"],
  members: ["Mira Shah", "Vivek Rao", "Riya Thomas", "Karan Sethi", "Aanya Reddy", "Kabir Anand", "Dev Kapoor", "Sana B", "Arjun V"]
};

const getDynamicHierarchy = () => {
  const relationMap = {
    "CSE": "SGSITS",
    "ECE": "SGSITS",
    "Mechanical": "LNCT",
    "Civil": "LNCT",
    "Biotech": "BITS Pilani",

    // Fallbacks/others
    "Design": "MANIT",
    "IT": "SGSITS",

    // Group parents
    "Hackathon Team": "CSE",
    "Placement Preparation": "CSE",
    "Startup Founders": "ECE",
    "Design Systems Guild": "Design",
    "Slow Food Club": "Biotech",
    "Robotics Club": "Mechanical",
    "Coding Club": "CSE"
  };

  const tree = [];

  // 1. Build communities
  const communitiesList = ACCESS_OPTIONS.communities || [];
  const communities = communitiesList.map(name => {
    const id = `c-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return {
      id,
      name,
      type: "community",
      parentId: null
    };
  });
  tree.push(...communities);

  // 2. Build sub-communities
  const subCommunitiesList = ACCESS_OPTIONS.subCommunities || [];
  const subCommunities = subCommunitiesList.map(name => {
    const parentName = relationMap[name] || communitiesList[0] || "SGSITS";
    const parentComm = communities.find(c => c.name === parentName);
    const parentId = parentComm ? parentComm.id : `c-${parentName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const id = `s-${parentId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return {
      id,
      name,
      type: "subCommunity",
      parentId
    };
  });
  tree.push(...subCommunities);

  // 3. Build groups
  const groupsList = ACCESS_OPTIONS.groups || [];
  const groups = groupsList.map(name => {
    const parentSubCommName = relationMap[name] || subCommunitiesList[0] || "CSE";
    const parentSub = subCommunities.find(s => s.name === parentSubCommName);
    const parentId = parentSub ? parentSub.id : `s-c-sgsits-${parentSubCommName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const id = `g-${parentId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return {
      id,
      name,
      type: "group",
      parentId
    };
  });
  tree.push(...groups);

  return tree;
};

const getHierarchyContext = (id, tree) => {
  const item = tree.find(x => x.id === id);
  if (!item) return "";
  if (!item.parentId) return item.name;
  return `${getHierarchyContext(item.parentId, tree)} > ${item.name}`;
};

const getAllDescendants = (id, tree) => {
  let descendants = [];
  const children = tree.filter(x => x.parentId === id);
  for (const child of children) {
    descendants.push(child.id);
    descendants = descendants.concat(getAllDescendants(child.id, tree));
  }
  return descendants;
};

function AccessControlModal({ open, onClose, mode, selectedAccess, setSelectedAccess }) {
  const isRuleMode = mode === "selected_members";

  const [activeTab, setActiveTab] = React.useState("communities");
  const [search, setSearch] = React.useState("");

  // States for rule group selector sub-modal
  const [editingGroupsRuleId, setEditingGroupsRuleId] = React.useState(null);
  const [tempSelectedGroups, setTempSelectedGroups] = React.useState([]);
  const [groupSearch, setGroupSearch] = React.useState("");

  // States for rule community selector sub-modal
  const [editingCommunitiesRuleId, setEditingCommunitiesRuleId] = React.useState(null);
  const [tempSelectedCommunities, setTempSelectedCommunities] = React.useState([]);
  const [commSearch, setCommSearch] = React.useState("");

  // Unified Tree Selector state (must be at the top level unconditionally)
  const [treeSearch, setTreeSearch] = React.useState("");
  const [expanded, setExpanded] = React.useState({
    "c-sgsits": true,
    "c-manit": true,
    "c-lnct": true,
    "s-c-sgsits-cse": true,
    "s-c-sgsits-ece": true,
    "s-c-manit-design": true,
    "s-c-lnct-mechanical": true
  });

  const dynamicTree = React.useMemo(() => getDynamicHierarchy(), []);

  React.useEffect(() => {
    if (open) {
      setActiveTab("communities");
      setSearch("");
      setEditingGroupsRuleId(null);
      setEditingCommunitiesRuleId(null);
    }
  }, [open, mode]);

  if (!open) return null;

  if (isRuleMode) {
    // SELECTED MEMBERS - RULE BUILDER (No Sub-community)
    const rules = Array.isArray(selectedAccess.selectedMembers) ? selectedAccess.selectedMembers : [];

    const updateRules = (newRules) => {
      setSelectedAccess(prev => ({
        ...prev,
        selectedMembers: newRules
      }));
    };

    const addRule = () => {
      const newRule = {
        id: "r-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        community: ACCESS_OPTIONS.communities[0],
        communities: [ACCESS_OPTIONS.communities[0]],
        groups: []
      };
      updateRules([...rules, newRule]);
    };

    const updateRule = (id, fields) => {
      const nextRules = rules.map(r => r.id === id ? { ...r, ...fields } : r);
      updateRules(nextRules);
    };

    const deleteRule = (id) => {
      const nextRules = rules.filter(r => r.id !== id);
      updateRules(nextRules);
    };

    return (
      <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 520, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>
                Access Rules: Selected Members
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--ink-2)" }}>
                Map communities to specific allowed groups.
              </p>
            </div>
            <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
          </div>

          <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            {rules.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", background: "var(--field)", borderRadius: "var(--r-md)", border: "1.5px dashed var(--border)" }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>No access rules defined</div>
                <div style={{ fontSize: "12px", color: "var(--ink-2)", marginBottom: "16px" }}>Add a rule to map communities to specific groups.</div>
                <button type="button" className="hbtn hbtn--soft hbtn--sm" onClick={addRule}>
                  <I.plus style={{ width: 14 }} /> Add Access Rule
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    style={{
                      padding: "16px",
                      background: "var(--field)",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--border)",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Rule #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-1)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    <div className="cfield" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "4px", display: "block" }}>Communities</label>
                      <div>
                        <RuleCommunitySummaryChip
                          rule={rule}
                          onEditClick={() => {
                            setEditingCommunitiesRuleId(rule.id);
                            setTempSelectedCommunities(Array.isArray(rule.communities) ? rule.communities : (rule.community ? [rule.community] : []));
                            setCommSearch("");
                          }}
                        />
                      </div>
                    </div>

                    <div className="cfield" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "6px", display: "block" }}>
                        Allowed Groups
                      </label>
                      <div>
                        <RuleGroupSummaryChip
                          rule={rule}
                          onEditClick={() => {
                            setEditingGroupsRuleId(rule.id);
                            setTempSelectedGroups(rule.groups || []);
                            setGroupSearch("");
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="hbtn hbtn--ghost"
                  onClick={addRule}
                  style={{ width: "100%", borderStyle: "dashed", borderContent: "2px", height: "42px" }}
                >
                  <I.plus style={{ width: 14 }} /> Add Another Rule
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--field)" }}>
            <button type="button" className="hbtn hbtn--primary" onClick={onClose} style={{ padding: "8px 18px", fontSize: 13 }}>Save Rules</button>
          </div>
        </div>

        {/* Group Selection Modal Overlay */}
        {editingGroupsRuleId && (() => {
          const rule = rules.find(r => r.id === editingGroupsRuleId);
          if (!rule) return null;

          const list = ACCESS_OPTIONS.groups;
          const filteredGroups = list.filter(g =>
            g.toLowerCase().includes(groupSearch.toLowerCase())
          );
          const allSelected = list.length > 0 && tempSelectedGroups.length === list.length;
          const handleSelectAll = () => {
            if (allSelected) {
              setTempSelectedGroups([]);
            } else {
              setTempSelectedGroups([...list]);
            }
          };

          return (
            <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); setEditingGroupsRuleId(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", width: 380, borderRadius: "var(--r-md)", border: "1px solid var(--border)", boxShadow: "var(--sh-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "14.5px", color: "var(--ink)", fontWeight: 600 }}>
                    Select Groups for {Array.isArray(rule.communities) ? rule.communities.join(", ") : rule.community}
                  </h4>
                  <button type="button" onClick={() => setEditingGroupsRuleId(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: "18px" }}>&times;</button>
                </div>

                <div style={{ padding: "14px 20px 8px 20px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--border)" }}>
                  <input
                    className="cinput"
                    type="text"
                    placeholder="Search groups..."
                    value={groupSearch}
                    onChange={e => setGroupSearch(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                  />

                  {tempSelectedGroups.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Selected Groups</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto", padding: "2px 0" }}>
                        {tempSelectedGroups.map(g => (
                          <span
                            key={g}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 6px",
                              background: "var(--accent-soft)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--r-sm)",
                              fontSize: "11.5px",
                              color: "var(--accent-2)",
                              fontWeight: 500
                            }}
                          >
                            {g}
                            <button
                              type="button"
                              onClick={() => setTempSelectedGroups(tempSelectedGroups.filter(x => x !== g))}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "0 2px",
                                color: "var(--accent-2)",
                                fontSize: "10px",
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px" }}>
                    <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                      Selected: {tempSelectedGroups.length} of {list.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-2)",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                <div style={{ padding: "10px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                  {filteredGroups.map(g => {
                    const checked = tempSelectedGroups.includes(g);
                    return (
                      <label
                        key={g}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 10px",
                          borderRadius: "var(--r-sm)",
                          cursor: "pointer",
                          background: checked ? "var(--field)" : "transparent",
                          fontSize: "13px",
                          color: checked ? "var(--ink)" : "var(--ink-2)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--field)"}
                        onMouseLeave={e => e.currentTarget.style.background = checked ? "var(--field)" : "transparent"}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setTempSelectedGroups(tempSelectedGroups.filter(x => x !== g));
                            } else {
                              setTempSelectedGroups([...tempSelectedGroups, g]);
                            }
                          }}
                          style={{ cursor: "pointer", accentColor: "var(--accent-2)" }}
                        />
                        <span>{g}</span>
                      </label>
                    );
                  })}
                  {filteredGroups.length === 0 && (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>No groups found</div>
                  )}
                </div>

                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--field)" }}>
                  <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => setEditingGroupsRuleId(null)}>Cancel</button>
                  <button
                    type="button"
                    className="hbtn hbtn--primary hbtn--sm"
                    onClick={() => {
                      updateRule(rule.id, { groups: tempSelectedGroups });
                      setEditingGroupsRuleId(null);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Communities Selection Modal Overlay */}
        {editingCommunitiesRuleId && (() => {
          const rule = rules.find(r => r.id === editingCommunitiesRuleId);
          if (!rule) return null;

          const list = ACCESS_OPTIONS.communities;
          const filteredComms = list.filter(c =>
            c.toLowerCase().includes(commSearch.toLowerCase())
          );
          const allSelected = list.length > 0 && tempSelectedCommunities.length === list.length;
          const handleSelectAll = () => {
            if (allSelected) {
              setTempSelectedCommunities([]);
            } else {
              setTempSelectedCommunities([...list]);
            }
          };

          return (
            <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); setEditingCommunitiesRuleId(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", width: 380, borderRadius: "var(--r-md)", border: "1px solid var(--border)", boxShadow: "var(--sh-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "14.5px", color: "var(--ink)", fontWeight: 600 }}>
                    Select Communities
                  </h4>
                  <button type="button" onClick={() => setEditingCommunitiesRuleId(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: "18px" }}>&times;</button>
                </div>

                <div style={{ padding: "14px 20px 8px 20px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--border)" }}>
                  <input
                    className="cinput"
                    type="text"
                    placeholder="Search communities..."
                    value={commSearch}
                    onChange={e => setCommSearch(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "13px" }}
                  />

                  {tempSelectedCommunities.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Selected Communities</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto", padding: "2px 0" }}>
                        {tempSelectedCommunities.map(c => (
                          <span
                            key={c}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 6px",
                              background: "var(--accent-soft)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--r-sm)",
                              fontSize: "11.5px",
                              color: "var(--accent-2)",
                              fontWeight: 500
                            }}
                          >
                            {c}
                            <button
                              type="button"
                              onClick={() => setTempSelectedCommunities(tempSelectedCommunities.filter(x => x !== c))}
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                padding: "0 2px",
                                color: "var(--accent-2)",
                                fontSize: "10px",
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px" }}>
                    <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                      Selected: {tempSelectedCommunities.length} of {list.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-2)",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                <div style={{ padding: "10px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                  {filteredComms.map(c => {
                    const checked = tempSelectedCommunities.includes(c);
                    return (
                      <label
                        key={c}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 10px",
                          borderRadius: "var(--r-sm)",
                          cursor: "pointer",
                          background: checked ? "var(--field)" : "transparent",
                          fontSize: "13px",
                          color: checked ? "var(--ink)" : "var(--ink-2)"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--field)"}
                        onMouseLeave={e => e.currentTarget.style.background = checked ? "var(--field)" : "transparent"}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setTempSelectedCommunities(tempSelectedCommunities.filter(x => x !== c));
                            } else {
                              setTempSelectedCommunities([...tempSelectedCommunities, c]);
                            }
                          }}
                          style={{ cursor: "pointer", accentColor: "var(--accent-2)" }}
                        />
                        <span>{c}</span>
                      </label>
                    );
                  })}
                  {filteredComms.length === 0 && (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>No communities found</div>
                  )}
                </div>

                <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--field)" }}>
                  <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => setEditingCommunitiesRuleId(null)}>Cancel</button>
                  <button
                    type="button"
                    className="hbtn hbtn--primary hbtn--sm"
                    onClick={() => {
                      updateRule(rule.id, { communities: tempSelectedCommunities, community: tempSelectedCommunities[0] || "" });
                      setEditingCommunitiesRuleId(null);
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  } else {
    // RESTRICTED ACCESS - UNIFIED HIERARCHICAL TREE SELECTION

    const currentRestricted = selectedAccess.restricted || { communities: [], subCommunities: [], groups: [] };
    const selectedIds = [
      ...(currentRestricted.communities || []),
      ...(currentRestricted.subCommunities || []),
      ...(currentRestricted.groups || [])
    ];

    const setSelectedIds = (newSelectedIds) => {
      const newComms = [];
      const newSubs = [];
      const newGroups = [];

      newSelectedIds.forEach(id => {
        const item = dynamicTree.find(x => x.id === id);
        if (item) {
          if (item.type === "community") newComms.push(id);
          else if (item.type === "subCommunity") newSubs.push(id);
          else if (item.type === "group") newGroups.push(id);
        }
      });

      setSelectedAccess(prev => ({
        ...prev,
        restricted: {
          communities: newComms,
          subCommunities: newSubs,
          groups: newGroups
        }
      }));
    };

    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleSelectNode = (id, checked) => {
      const descendants = getAllDescendants(id, dynamicTree);
      const idsToToggle = [id, ...descendants];

      let nextSelected = new Set(selectedIds);
      if (checked) {
        idsToToggle.forEach(x => nextSelected.add(x));
      } else {
        idsToToggle.forEach(x => nextSelected.delete(x));
      }

      const evaluateParents = (currentSet) => {
        let changed = false;
        const byParent = {};
        dynamicTree.forEach(n => {
          if (n.parentId) {
            if (!byParent[n.parentId]) byParent[n.parentId] = [];
            byParent[n.parentId].push(n.id);
          }
        });

        let iterations = 0;
        do {
          changed = false;
          Object.keys(byParent).forEach(pid => {
            const childrenIds = byParent[pid];
            const allChecked = childrenIds.length > 0 && childrenIds.every(cid => currentSet.has(cid));
            if (allChecked && !currentSet.has(pid)) {
              currentSet.add(pid);
              changed = true;
            } else if (!allChecked && currentSet.has(pid)) {
              currentSet.delete(pid);
              changed = true;
            }
          });
          iterations++;
        } while (changed && iterations < 5);

        return currentSet;
      };

      setSelectedIds(Array.from(evaluateParents(nextSelected)));
    };

    const isNodeChecked = (id) => selectedIds.includes(id);
    const isNodeIndeterminate = (id) => {
      if (isNodeChecked(id)) return false;
      const descendants = getAllDescendants(id, dynamicTree);
      if (descendants.length === 0) return false;
      const selectedCount = descendants.filter(d => selectedIds.includes(d)).length;
      return selectedCount > 0 && selectedCount < descendants.length;
    };

    const lowerSearch = treeSearch.toLowerCase();
    const visibleNodes = new Set();

    if (lowerSearch) {
      dynamicTree.forEach(n => {
        if (n.name.toLowerCase().includes(lowerSearch)) {
          visibleNodes.add(n.id);
          let curr = n.parentId;
          while (curr) {
            visibleNodes.add(curr);
            const parent = dynamicTree.find(x => x.id === curr);
            curr = parent ? parent.parentId : null;
          }
          getAllDescendants(n.id, dynamicTree).forEach(d => visibleNodes.add(d));
        }
      });
    } else {
      dynamicTree.forEach(n => visibleNodes.add(n.id));
    }

    const allVisibleSelected = visibleNodes.size > 0 && Array.from(visibleNodes).every(id => selectedIds.includes(id));

    const handleSelectAll = () => {
      const nextSelected = new Set(selectedIds);
      if (allVisibleSelected) {
        visibleNodes.forEach(id => nextSelected.delete(id));
      } else {
        visibleNodes.forEach(id => nextSelected.add(id));
      }

      const byParent = {};
      dynamicTree.forEach(n => {
        if (n.parentId) {
          if (!byParent[n.parentId]) byParent[n.parentId] = [];
          byParent[n.parentId].push(n.id);
        }
      });
      let changed = false;
      let iterations = 0;
      do {
        changed = false;
        Object.keys(byParent).forEach(pid => {
          const childrenIds = byParent[pid];
          const allChecked = childrenIds.length > 0 && childrenIds.every(cid => nextSelected.has(cid));
          if (allChecked && !nextSelected.has(pid)) {
            nextSelected.add(pid);
            changed = true;
          } else if (!allChecked && nextSelected.has(pid)) {
            nextSelected.delete(pid);
            changed = true;
          }
        });
        iterations++;
      } while (changed && iterations < 5);

      setSelectedIds(Array.from(nextSelected));
    };

    const renderNode = (node, depth = 0) => {
      if (!visibleNodes.has(node.id)) return null;

      const children = dynamicTree.filter(n => n.parentId === node.id);
      const isExpandable = children.length > 0;
      const isExpanded = lowerSearch ? true : !!expanded[node.id];
      const checked = isNodeChecked(node.id);
      const indeterminate = isNodeIndeterminate(node.id);

      let icon = "👥";
      if (node.type === "community") icon = "🏛️";
      else if (node.type === "subCommunity") icon = "📁";

      return (
        <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              paddingLeft: `${12 + (depth * 20)}px`,
              borderRadius: "var(--r-sm)",
              cursor: "pointer",
              transition: "background 0.15s",
              background: checked ? "var(--field)" : "transparent"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--field)"}
            onMouseLeave={e => e.currentTarget.style.background = checked ? "var(--field)" : "transparent"}
            onClick={() => handleSelectNode(node.id, !checked)}
          >
            {isExpandable ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, width: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}
              >
                {isExpanded ? "▾" : "▸"}
              </button>
            ) : (
              <div style={{ width: 16 }} />
            )}

            <input
              type="checkbox"
              checked={checked}
              ref={el => { if (el) el.indeterminate = indeterminate; }}
              onChange={(e) => { e.stopPropagation(); handleSelectNode(node.id, e.target.checked); }}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent-2)", margin: 0 }}
            />

            <span style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", width: 20 }}>{icon}</span>
            <span style={{ fontSize: 13.5, fontWeight: checked ? 500 : 400, color: checked ? "var(--ink)" : "var(--ink-2)", flex: 1 }}>
              {node.name}
            </span>
          </div>

          {isExpanded && children.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 520, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>
              Allowed Access Control
            </h3>
            <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
          </div>

          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border)" }}>
            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <I.search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, color: "var(--ink-3)" }} />
              <input className="cinput" type="text" placeholder="Search communities, sub-communities, or groups..." value={treeSearch} onChange={e => setTreeSearch(e.target.value)} style={{ padding: "8px 12px 8px 34px", fontSize: 13 }} />
            </div>

            {/* Selected Items Section (Removable Chips) */}
            {selectedIds.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Selected Items</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto", padding: "4px 0" }}>
                  {selectedIds.map(id => {
                    const node = dynamicTree.find(x => x.id === id);
                    if (!node) return null;
                    if (node.parentId && selectedIds.includes(node.parentId)) return null;

                    const context = getHierarchyContext(node.id, dynamicTree);
                    let icon = "👥";
                    if (node.type === "community") icon = "🏛️";
                    else if (node.type === "subCommunity") icon = "📁";

                    return (
                      <span
                        key={id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          background: "var(--accent-soft)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-sm)",
                          fontSize: "12px",
                          color: "var(--accent-2)",
                          fontWeight: 500
                        }}
                        title={context}
                      >
                        <span style={{ fontSize: "12px" }}>{icon}</span> {context}
                        <button
                          type="button"
                          onClick={() => handleSelectNode(id, false)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "0 2px",
                            color: "var(--accent-2)",
                            fontSize: "10px",
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Count & Select All */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
              <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                Selected: {selectedIds.length} of {dynamicTree.length}
              </span>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-2)",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                {allVisibleSelected ? (treeSearch ? "Deselect All Visible" : "Deselect All") : (treeSearch ? "Select All Visible" : "Select All")}
              </button>
            </div>
          </div>

          {/* Scrollable Results List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {dynamicTree.filter(n => !n.parentId).map(root => renderNode(root, 0))}
              {visibleNodes.size === 0 && (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No results found</div>
              )}
            </div>
          </div>

          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--field)" }}>
            <button type="button" className="hbtn hbtn--primary" onClick={onClose} style={{ padding: "8px 18px", fontSize: 13 }}>Save Settings</button>
          </div>
        </div>
      </div>
    );
  }
}

/* ---------------- Category Selection Summary Chip ---------------- */
function CategorySummaryChip({ type, items, onEditClick }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 240;
        const windowWidth = window.innerWidth;
        let left = rect.left;
        if (left + popoverWidth > windowWidth) {
          left = Math.max(10, windowWidth - popoverWidth - 10);
        }
        setCoords({
          top: rect.bottom + 6,
          left: left
        });
      }
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const dynamicTree = React.useMemo(() => getDynamicHierarchy(), []);

  if (!items || items.length === 0) return null;

  const resolvedItems = items.map(id => {
    const node = dynamicTree.find(x => x.id === id);
    return node ? getHierarchyContext(node.id, dynamicTree) : id;
  });

  const firstItem = resolvedItems[0];
  const count = resolvedItems.length;

  let icon = "";
  let label = "";
  if (type === "communities") {
    icon = "🏛️";
    label = "Communities";
  } else if (type === "subCommunities") {
    icon = "📁";
    label = "Sub-communities";
  } else if (type === "groups") {
    icon = "👥";
    label = "Groups";
  }

  const displayText = count > 1 ? `${firstItem} +${count - 1}` : firstItem;
  const tooltipText = resolvedItems.join(", ");

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={tooltipText}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-sm)",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--ink)",
          cursor: "pointer",
          transition: "all var(--t-fast)",
          maxWidth: "185px",
          boxShadow: "var(--sh-sm)",
          outline: "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-2)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--sh-md)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "var(--sh-sm)";
        }}
      >
        <span style={{ fontSize: "14px" }}>{icon}</span>
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {displayText}
        </span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 10005,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-lg)",
            minWidth: "220px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{label}</span>
            {onEditClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onEditClick();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-2)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Edit
              </button>
            )}
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "180px",
            overflowY: "auto"
          }}>
            {resolvedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "var(--ink-2)"
                }}
              >
                <span style={{ color: "var(--accent-2)", fontWeight: "bold" }}>✓</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/* ---------------- Rule Selection Summary Chip ---------------- */
function RuleSummaryChip({ rule, onEditClick }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 240;
        const windowWidth = window.innerWidth;
        let left = rect.left;
        if (left + popoverWidth > windowWidth) {
          left = Math.max(10, windowWidth - popoverWidth - 10);
        }
        setCoords({
          top: rect.bottom + 6,
          left: left
        });
      }
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const ruleCommunities = Array.isArray(rule.communities)
    ? rule.communities
    : (rule.community ? [rule.community] : []);
  const groups = rule.groups || [];

  let leftText = "";
  let tooltipText = "";

  if (ruleCommunities.length > 0) {
    const firstComm = ruleCommunities[0];
    leftText = ruleCommunities.length > 1 ? `${firstComm} +${ruleCommunities.length - 1}` : firstComm;
    tooltipText += `Communities: ${ruleCommunities.join(", ")}`;
  } else {
    leftText = "No Communities";
    tooltipText += "No Communities Selected";
  }

  let rightText = "";
  if (groups && groups.length > 0) {
    const firstGroup = groups[0];
    const groupCount = groups.length;
    rightText = groupCount > 1 ? `${firstGroup} +${groupCount - 1}` : firstGroup;
    tooltipText += `\nGroups: ${groups.join(", ")}`;
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={tooltipText}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-sm)",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--ink)",
          cursor: "pointer",
          transition: "all var(--t-fast)",
          maxWidth: "280px",
          boxShadow: "var(--sh-sm)",
          outline: "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-2)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--sh-md)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "var(--sh-sm)";
        }}
      >
        <span>🏛️</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
          {leftText}
        </span>
        {rightText && (
          <>
            <span style={{ color: "var(--ink-3)", margin: "0 2px" }}>→</span>
            <span style={{ fontSize: "14px" }}>👥</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
              {rightText}
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 10005,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-lg)",
            minWidth: "220px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Rule Details</span>
            {onEditClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onEditClick();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-2)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Edit
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🏛️</span> {ruleCommunities.join(", ")}
            </div>
            {groups && groups.length > 0 && (
              <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)" }}>Groups</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "120px", overflowY: "auto" }}>
                  {groups.map((group, idx) => (
                    <div key={idx} style={{ fontSize: "13px", color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--accent-2)", fontWeight: "bold" }}>✓</span> 👥 {group}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

}

/* ---------------- Rule Community Summary Chip ---------------- */
function RuleCommunitySummaryChip({ rule, onEditClick }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 240;
        const windowWidth = window.innerWidth;
        let left = rect.left;
        if (left + popoverWidth > windowWidth) {
          left = Math.max(10, windowWidth - popoverWidth - 10);
        }
        setCoords({
          top: rect.bottom + 6,
          left: left
        });
      }
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const communities = Array.isArray(rule.communities)
    ? rule.communities
    : (rule.community ? [rule.community] : []);

  let displayText = "No Communities Selected";
  if (communities.length === 1) {
    displayText = communities[0];
  } else if (communities.length > 1) {
    displayText = `${communities[0]} +${communities.length - 1}`;
  }

  const tooltipText = communities.length > 0 ? `Selected Communities: ${communities.join(", ")}` : "No Communities Selected";

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={tooltipText}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-pill)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--ink)",
          cursor: "pointer",
          transition: "all var(--t-fast)",
          maxWidth: "240px",
          boxShadow: "var(--sh-sm)",
          outline: "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-2)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--sh-md)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "var(--sh-sm)";
        }}
      >
        <span>🏛️</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText}
        </span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 10005,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-lg)",
            minWidth: "220px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}>
            Selected Communities
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "150px",
            overflowY: "auto"
          }}>
            {communities.length === 0 ? (
              <div style={{ fontSize: "13px", color: "var(--ink-3)", fontStyle: "italic" }}>
                No Communities Selected
              </div>
            ) : (
              communities.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "var(--ink-2)"
                  }}
                >
                  <span style={{ color: "var(--accent-2)", fontWeight: "bold" }}>✓</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEditClick();
              }}
              style={{
                width: "100%",
                background: "var(--field)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--accent-2)",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Edit Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Rule Group Summary Chip ---------------- */
function RuleGroupSummaryChip({ rule, onEditClick }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef(null);
  const [coords, setCoords] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 240;
        const windowWidth = window.innerWidth;
        let left = rect.left;
        if (left + popoverWidth > windowWidth) {
          left = Math.max(10, windowWidth - popoverWidth - 10);
        }
        setCoords({
          top: rect.bottom + 6,
          left: left
        });
      }
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const groups = rule.groups || [];

  let displayText = "No Group Restriction";
  if (groups.length === 1) {
    displayText = groups[0];
  } else if (groups.length > 1) {
    displayText = `${groups[0]} +${groups.length - 1}`;
  }

  const tooltipText = groups.length > 0 ? `Selected Groups: ${groups.join(", ")}` : "No Group Restriction";

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={tooltipText}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-pill)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--ink)",
          cursor: "pointer",
          transition: "all var(--t-fast)",
          maxWidth: "240px",
          boxShadow: "var(--sh-sm)",
          outline: "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-2)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--sh-md)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "var(--sh-sm)";
        }}
      >
        <span style={{ fontSize: "14px" }}>👥</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText}
        </span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 10005,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-lg)",
            minWidth: "220px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}>
            Selected Groups
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "150px",
            overflowY: "auto"
          }}>
            {groups.length === 0 ? (
              <div style={{ fontSize: "13px", color: "var(--ink-3)", fontStyle: "italic" }}>
                No Group Restriction (All groups allowed)
              </div>
            ) : (
              groups.map((group, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "var(--ink-2)"
                  }}
                >
                  <span style={{ color: "var(--accent-2)", fontWeight: "bold" }}>✓</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {group}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEditClick();
              }}
              style={{
                width: "100%",
                background: "var(--field)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--accent-2)",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Edit Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Create Group ---------------- */
function CreateGroup({ go, mobile }) {
  const plan = ME.plan || "free";
  const planCfg = PLAN_CONFIG[plan];

  // Try loading draft
  const draftKey = "sg_draft_group";
  const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "{}");

  const [name, setName] = useState(savedDraft.name || "");
  const [icon, setIcon] = useState(savedDraft.icon || "✺");
  const [cover, setCover] = useState(savedDraft.cover || COVERS.violet);
  const [banner, setBanner] = useState(savedDraft.banner || "");
  const [cat, setCat] = useState(savedDraft.cat || "Design");
  const [desc, setDesc] = useState(savedDraft.desc || "");
  const [locationType, setLocationType] = useState(savedDraft.locationType || "");
  const [venueName, setVenueName] = useState(savedDraft.venueName || "");
  const [address, setAddress] = useState(savedDraft.address || "");
  const [city, setCity] = useState(savedDraft.city || "");
  const [platform, setPlatform] = useState(savedDraft.platform || "zoom");
  const [meetingLink, setMeetingLink] = useState(savedDraft.meetingLink || "");

  // Popups & Drawers State
  const [themeDrawer, setThemeDrawer] = useState(false);
  const [iconDrawer, setIconDrawer] = useState(false);
  const [descModal, setDescModal] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Options Modals
  const [visModal, setVisModal] = useState(false);
  const [visibility, setVisibility] = useState(savedDraft.visibility || "public");

  const [joinElig, setJoinElig] = useState(savedDraft.joinElig || "anyone"); // anyone, communities, invite
  const [selectedComms, setSelectedComms] = useState(savedDraft.selectedComms || []);
  const [commSearch, setCommSearch] = useState("");
  const availableComms = ["SGSITS", "MANIT", "LNCT", "IIT Bombay", "BITS Pilani"];
  const [accessModal, setAccessModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(() => {
    const d = savedDraft.selectedAccess || {};

    // For restricted mode, we want a flat object structure
    let restrictedData = { communities: [], subCommunities: [], groups: [] };
    if (d.restricted && !Array.isArray(d.restricted)) {
      restrictedData = {
        communities: Array.isArray(d.restricted.communities) ? d.restricted.communities : [],
        subCommunities: Array.isArray(d.restricted.subCommunities) ? d.restricted.subCommunities : [],
        groups: Array.isArray(d.restricted.groups) ? d.restricted.groups : []
      };
    } else if (Array.isArray(d.restricted)) {
      // Migrate array rules back to flat objects if they migrated previously
      const comms = [];
      const subComms = [];
      const grps = [];
      d.restricted.forEach(rule => {
        if (rule.community) comms.push(rule.community);
        if (rule.subCommunity) subComms.push(rule.subCommunity);
        if (Array.isArray(rule.groups)) {
          rule.groups.forEach(g => {
            if (!grps.includes(g)) grps.push(g);
          });
        }
      });
      restrictedData = { communities: comms, subCommunities: subComms, groups: grps };
    }

    // For selectedMembers mode, we want a rule-based array structure
    let selectedMembersRules = [];
    if (Array.isArray(d.selectedMembers)) {
      selectedMembersRules = d.selectedMembers;
    } else if (d.selectedMembers && (d.selectedMembers.communities || d.selectedMembers.groups)) {
      const comms = d.selectedMembers.communities || [];
      const grps = d.selectedMembers.groups || [];
      if (comms.length > 0) {
        selectedMembersRules = comms.map((comm, idx) => ({
          id: "r-migrated-sm-" + idx,
          community: comm,
          groups: grps
        }));
      }
    }

    return {
      restricted: restrictedData,
      selectedMembers: selectedMembersRules
    };
  });

  const [visibilityAccess, setVisibilityAccess] = useState(() => {
    const d = savedDraft.visibilityAccess;
    if (d) {
      return {
        communities: Array.isArray(d.communities) ? d.communities : [],
        subCommunities: Array.isArray(d.subCommunities) ? d.subCommunities : [],
        groups: Array.isArray(d.groups) ? d.groups : []
      };
    }
    const currentRestricted = (savedDraft.selectedAccess && savedDraft.selectedAccess.restricted) || {};
    return {
      communities: Array.isArray(currentRestricted.communities) ? [...currentRestricted.communities] : [],
      subCommunities: Array.isArray(currentRestricted.subCommunities) ? [...currentRestricted.subCommunities] : [],
      groups: Array.isArray(currentRestricted.groups) ? [...currentRestricted.groups] : []
    };
  });
  const [accessModalTarget, setAccessModalTarget] = useState("join"); // "join" or "visibility"

  const [capModal, setCapModal] = useState(false);
  const [limitCap, setLimitCap] = useState(savedDraft.limitCap || false);
  const [maxCap, setMaxCap] = useState(savedDraft.maxCap || "");
  const [waitlist, setWaitlist] = useState(savedDraft.waitlist || false);

  const [typeModal, setTypeModal] = useState(false);
  const [groupType, setGroupType] = useState(savedDraft.groupType || "free");
  const [acceptPayments, setAcceptPayments] = useState(savedDraft.acceptPayments !== undefined ? savedDraft.acceptPayments : true);
  const [currency, setCurrency] = useState(savedDraft.currency || "INR");
  const [plans, setPlans] = useState(savedDraft.plans || {
    monthly: { enabled: true, fee: "499" },
    yearly: { enabled: true, fee: "4999" },
    oneTime: { enabled: false, fee: "9999" }
  });
  const [customPlans, setCustomPlans] = useState(savedDraft.customPlans || []);

  // Advanced Settings Toggles
  const [questionnaire, setQuestionnaire] = useState(savedDraft.questionnaire || false);
  const [questions, setQuestions] = useState(savedDraft.questions || []);
  const [qModal, setQModal] = useState(false);

  const [forums, setForums] = useState(savedDraft.forums || false);
  const [threadPerm, setThreadPerm] = useState(savedDraft.threadPerm || "everyone");
  const [replyPerm, setReplyPerm] = useState(savedDraft.replyPerm || "everyone");
  const [forumModal, setForumModal] = useState(false);

  const [gallery, setGallery] = useState(savedDraft.gallery || false);
  const [galleryModal, setGalleryModal] = useState(false);
  const [galleryAllow, setGalleryAllow] = useState(savedDraft.galleryAllow !== undefined ? savedDraft.galleryAllow : true);
  const [galleryImageOnly, setGalleryImageOnly] = useState(savedDraft.galleryImageOnly || false);
  const [galleryVideoOnly, setGalleryVideoOnly] = useState(savedDraft.galleryVideoOnly || false);
  const [galleryApprove, setGalleryApprove] = useState(savedDraft.galleryApprove || false);

  const [planModal, setPlanModal] = useState(false);

  // Autosave
  React.useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify({
      name, icon, cover, banner, cat, desc, visibility, joinElig, selectedComms,
      limitCap, maxCap, waitlist, groupType, acceptPayments, currency, plans, customPlans,
      questionnaire, questions, forums, threadPerm, replyPerm, gallery,
      galleryAllow, galleryImageOnly, galleryVideoOnly, galleryApprove,
      locationType, venueName, address, city, platform, meetingLink,
      selectedAccess, visibilityAccess
    }));
  }, [name, icon, cover, banner, cat, desc, visibility, joinElig, selectedComms, limitCap, maxCap, waitlist, groupType, acceptPayments, currency, plans, customPlans, questionnaire, questions, forums, threadPerm, replyPerm, gallery, galleryAllow, galleryImageOnly, galleryVideoOnly, galleryApprove, locationType, venueName, address, city, platform, meetingLink, selectedAccess, visibilityAccess]);

  const renderChips = (mode, source = "join") => {
    if (mode === "selected_members") {
      const rules = selectedAccess.selectedMembers || [];
      if (!Array.isArray(rules) || rules.length === 0) return null;

      return (
        <div
          style={{
            marginTop: 6,
            marginBottom: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px 12px",
            background: "var(--field)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border)",
          }}
        >
          {rules.map((rule) => (
            <RuleSummaryChip
              key={rule.id}
              rule={rule}
              onEditClick={() => {
                setAccessModalTarget(source);
                setAccessModal(true);
              }}
            />
          ))}
        </div>
      );
    } else {
      const modeData = source === "visibility" ? visibilityAccess : (selectedAccess.restricted || {});
      const communities = modeData.communities || [];
      const subCommunities = modeData.subCommunities || [];
      const groups = modeData.groups || [];

      const hasAny = communities.length > 0 || subCommunities.length > 0 || groups.length > 0;
      if (!hasAny) return null;

      return (
        <div
          style={{
            marginTop: 6,
            marginBottom: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            padding: "8px 12px",
            background: "var(--field)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--border)",
          }}
        >
          <CategorySummaryChip
            type="communities"
            items={communities}
            onEditClick={() => {
              setAccessModalTarget(source);
              setAccessModal(true);
            }}
          />
          <CategorySummaryChip
            type="subCommunities"
            items={subCommunities}
            onEditClick={() => {
              setAccessModalTarget(source);
              setAccessModal(true);
            }}
          />
          <CategorySummaryChip
            type="groups"
            items={groups}
            onEditClick={() => {
              setAccessModalTarget(source);
              setAccessModal(true);
            }}
          />
        </div>
      );
    }
  };

  const icons = ["✺", "🚀", "🌅", "◆", "🎧", "🍲", "🎨", "⚡", "🌱", "📚"];

  const location = city ? "has-location" : "";

  const previewG = {
    name: name || "Your group name", icon, cover, banner, cat,
    location: city ? `${city}, India` : "Location TBD",
    desc: desc || "A short description of what your community is about and who it's for.",
    members: 1, online: 1, memberNames: [{ name: ME.name, role: "owner" }], owner: ME.name,
    visibility, groupType,
    fee: (() => {
      if (groupType !== "paid") return "";
      const currencySymbol = currency === "INR" ? "₹" : "$";
      const activePlans = [];
      if (plans.monthly.enabled && plans.monthly.fee) activePlans.push({ price: Number(plans.monthly.fee), label: "mo", val: plans.monthly.fee });
      if (plans.yearly.enabled && plans.yearly.fee) activePlans.push({ price: Number(plans.yearly.fee), label: "yr", val: plans.yearly.fee });
      if (plans.oneTime.enabled && plans.oneTime.fee) activePlans.push({ price: Number(plans.oneTime.fee), label: "one-time", val: plans.oneTime.fee });

      customPlans.forEach(cp => {
        if (cp.fee && cp.name) {
          activePlans.push({ price: Number(cp.fee), label: cp.interval, val: cp.fee });
        }
      });

      if (activePlans.length === 0) return "Paid";
      if (activePlans.length === 1) {
        return `${currencySymbol}${activePlans[0].val}/${activePlans[0].label}`;
      }
      activePlans.sort((a, b) => a.price - b.price);
      return `From ${currencySymbol}${activePlans[0].val}/${activePlans[0].label}`;
    })(),
    joinMode: joinElig === "invite" ? "invite" : "approval"
  };

  return (
    <div className={`create ${mobile ? "single" : ""}`}>
      {/* Modals placed outside layout structure */}
      {planModal && <PlanModal open={planModal} onClose={() => setPlanModal(false)} />}
      <LocationModal open={locationModalOpen} onClose={() => setLocationModalOpen(false)} selectedCity={city} onSelectCity={setCity} />
      <AccessControlModal
        open={accessModal}
        onClose={() => setAccessModal(false)}
        mode={accessModalTarget === "join" ? joinElig : "restricted"}
        selectedAccess={accessModalTarget === "join" ? selectedAccess : { restricted: visibilityAccess, selectedMembers: [] }}
        setSelectedAccess={accessModalTarget === "join" ? (val) => {
          const nextValue = typeof val === 'function' ? val(selectedAccess) : val;
          setSelectedAccess(nextValue);
          if (nextValue.restricted) {
            setVisibilityAccess(prev => {
              const union = (arr1, arr2) => Array.from(new Set([...arr1, ...arr2]));
              return {
                communities: union(prev.communities || [], nextValue.restricted.communities || []),
                subCommunities: union(prev.subCommunities || [], nextValue.restricted.subCommunities || []),
                groups: union(prev.groups || [], nextValue.restricted.groups || [])
              };
            });
          }
        } : (val) => {
          const nextValue = typeof val === 'function' ? val({ restricted: visibilityAccess, selectedMembers: [] }) : val;
          setVisibilityAccess(nextValue.restricted);
        }}
      />
      <CapacitySettingsModal open={capModal} onClose={() => setCapModal(false)} limitCap={limitCap} setLimitCap={setLimitCap} maxCap={maxCap} setMaxCap={setMaxCap} waitlist={waitlist} setWaitlist={setWaitlist} />

      {/* Description Modal */}
      {descModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal" style={{ background: "var(--surface)", width: 600, height: "80vh", borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Group Description</h3>
              <button onClick={() => setDescModal(false)} style={{ background: "var(--field)", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer", color: "var(--ink)" }}><I.x style={{ width: 16 }} /></button>
            </div>
            <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
              <textarea style={{ flex: 1, border: "none", resize: "none", outline: "none", fontSize: 16, color: "var(--ink)", background: "transparent" }} placeholder="Describe your community: what it's about, who should join, guidelines..." value={desc} onChange={e => setDesc(e.target.value)} />
              <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>{desc.length} chars</div>
            </div>
            <div style={{ padding: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button className="hbtn hbtn--ghost" onClick={() => setDesc(desc + " Welcome to our vibrant community! We gather regularly to share ideas, collaborate on projects, and grow together. Everyone is welcome to participate, ask questions, and share their journey.")}><I.spark style={{ width: 16 }} /> Suggest with AI</button>
              <button className="hbtn hbtn--primary" onClick={() => setDescModal(false)}>Save Description</button>
            </div>
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✺");
  const [cover, setCover] = useState(COVERS.violet);
  const [cat, setCat] = useState("Design");
  const [desc, setDesc] = useState("");
  const [join, setJoin] = useState("approval");
  const [questionnaire, setQuestionnaire] = useState(true);
  const icons = ["✺", "🚀", "🌅", "◆", "🎧", "🍲", "🎨", "⚡", "🌱", "📚"];

  const previewG = {
    name: name || "Your group name", icon, cover, cat,
    desc: desc || "A short description of what your community is about and who it's for.",
    members: 1, online: 1, memberNames: [ME.name]
  };

  return (
    <div className={`create max-w-[1000px] mx-auto w-full ${mobile ? "single" : ""}`}>
      <div className="create-form">
        <div className="cf-inner">
          <div className="create-head">
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding: "7px 11px" }}><I.arrowL /></button>
            <div><div className="ck">New group</div><h1>Create a group</h1></div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modals */}
      {qModal && <QuestionnaireBuilderModal open={qModal} onClose={() => setQModal(false)} questions={questions} setQuestions={setQuestions} plan={plan} />}

      {/* Forum Settings Modal */}
      {forumModal && (
        <div className="modal-backdrop" onClick={() => setForumModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="setting-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Forum Settings</h3>
              <button onClick={() => setForumModal(false)} style={{ background: "var(--field)", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer" }}><I.x style={{ width: 16 }} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="cfield">
                  <label>Who can create threads?</label>
                  <select className="cselect" value={threadPerm} onChange={e => {
                    if (!planCfg.advancedForums && e.target.value !== "everyone") setPlanModal(true);
                    else setThreadPerm(e.target.value);
                  }}>
                    <option value="everyone">Everyone</option>
                    <option value="admins">Admins & Moderators Only</option>
                    <option value="selected">Selected Members</option>
                  </select>
                </div>
                <div className="cfield">
                  <label>Who can reply?</label>
                  <select className="cselect" value={replyPerm} onChange={e => {
                    if (!planCfg.advancedForums && e.target.value !== "everyone") setPlanModal(true);
                    else setReplyPerm(e.target.value);
                  }}>
                    <option value="everyone">Everyone</option>
                    <option value="admins">Admins & Moderators Only</option>
                    <option value="selected">Selected Members</option>
                  </select>
                </div>
              </div>
              <button className="hbtn hbtn--primary" style={{ width: "100%", marginTop: 24, justifyContent: "center" }} onClick={() => setForumModal(false)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Settings Modal */}
      {galleryModal && (
        <div className="modal-backdrop" onClick={() => setGalleryModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="setting-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>Media Gallery Settings</h3>
              <button onClick={() => setGalleryModal(false)} style={{ background: "var(--field)", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer" }}><I.x style={{ width: 16 }} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                  <div className="ti"><div className="t">Allow Uploads</div></div>
                  <Toggle on={galleryAllow} onClick={() => setGalleryAllow(!galleryAllow)} />
                </div>
                {galleryAllow && (
                  <>
                    <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                      <div className="ti"><div className="t">Image Only</div></div>
                      <Toggle on={galleryImageOnly} onClick={() => {
                        setGalleryImageOnly(!galleryImageOnly);
                        if (!galleryImageOnly) setGalleryVideoOnly(false);
                      }} />
                    </div>
                    <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                      <div className="ti"><div className="t">Video Only</div></div>
                      <Toggle on={galleryVideoOnly} onClick={() => {
                        setGalleryVideoOnly(!galleryVideoOnly);
                        if (!galleryVideoOnly) setGalleryImageOnly(false);
                      }} />
                    </div>
                    <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                      <div className="ti"><div className="t">Admin Approval Required</div></div>
                      <Toggle on={galleryApprove} onClick={() => setGalleryApprove(!galleryApprove)} />
                    </div>
                  </>
                )}
              </div>
              <button className="hbtn hbtn--primary" style={{ width: "100%", marginTop: 24, justifyContent: "center" }} onClick={() => setGalleryModal(false)}>Confirm</button>
          <div className={`cover-up filled`} style={{ background: cover }}>
            <Grain />
            <div style={{ position: "absolute", left: 20, bottom: -26, width: 64, height: 64, borderRadius: 18, background: cover, border: "3px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "var(--sh-md)", zIndex: 3 }}>{icon}</div>
            <div className="up-hint" style={{ color: "#fff" }}><div className="uic" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}><I.image /></div>Group cover</div>
          </div>
          <div style={{ marginTop: 34 }}><CoverPicker value={cover} onPick={setCover} /></div>

          <div className="cfield" style={{ marginTop: 18 }}>
            <label>Group icon</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {icons.map(em => (
                <button key={em} onClick={() => setIcon(em)} style={{
                  width: 42, height: 42, borderRadius: 12, fontSize: 20, cursor: "pointer",
                  border: icon === em ? "2px solid var(--accent-2)" : "1px solid var(--border)", background: icon === em ? "var(--accent-soft)" : "var(--field)"
                }}>{em}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme Picker bottom drawer */}
      {themeDrawer && (
        <div className="modal-backdrop" onClick={() => setThemeDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999 }}>
          <div className={`bottom-drawer open`} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Select Theme</h3>
              <button onClick={() => setThemeDrawer(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><I.x /></button>
            </div>
            <CoverPicker value={cover} onPick={(c) => { setCover(c); setThemeDrawer(false); }} />
          <div style={{ marginTop: 18 }}>
            <input className="title-input" style={{ fontSize: 26 }} placeholder="Group name" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>
      )}

      {/* Icon Picker modal popup */}
      {iconDrawer && (
        <div className="modal-backdrop" onClick={() => setIconDrawer(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 450, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Select Icon</h3>
              <button onClick={() => setIconDrawer(false)} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {icons.map(em => (
                  <button
                    key={em}
                    onClick={() => { setIcon(em); setIconDrawer(false); }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      fontSize: 24,
                      cursor: "pointer",
                      border: icon === em ? "2px solid var(--accent-2)" : "1px solid var(--border)",
                      background: icon === em ? "var(--accent-soft)" : "var(--field)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-2)"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = icon === em ? "var(--accent-2)" : "var(--border)"}
                  >
                    {em}
                  </button>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Or upload custom icon</span>
                <button
                  type="button"
                  className="hbtn hbtn--soft"
                  style={{ width: "100%", justifyContent: "center", height: 36, display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => document.getElementById("icon-upload").click()}
                >
                  <I.image style={{ width: 14 }} /> Upload Icon Image
                </button>
                <input
                  type="file"
                  id="icon-upload"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setIcon(URL.createObjectURL(e.target.files[0]));
                      setIconDrawer(false);
                    }
                  }}
                />
              </div>
            </div>
          <div className="cfield" style={{ marginTop: 14 }}>
            <label>Category</label>
            <select className="cselect" value={cat} onChange={e => setCat(e.target.value)}>
              {CATS.filter(c => c[0] !== "All").map(([c]) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* --- Left Column: Scrollable cards form --- */}
      <div className="create-form">
        <div className="cf-inner">
          <div className="create-head">
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding: "7px 11px" }}><I.arrowL /></button>
            <div><div className="ck">New Group</div><h1>Create a group</h1></div>
          </div>

          {/* Top Card: Visuals & Core details */}
          <div className="form-card main-info-card">
            <div className="card-left">
              <label className="cfield" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Header Image</label>
              <div className={`cover-up filled`}
                style={{
                  height: 140,
                  position: "relative",
                  marginBottom: 12,
                  borderRadius: "var(--r-md)",
                  border: banner ? "none" : "1.5px dashed var(--border)",
                  cursor: "pointer",
                  ...(banner ? { background: `url("${banner}")`, backgroundSize: "cover", backgroundPosition: "center" } : { background: cover })
                }}
                onClick={() => document.getElementById("banner-upload").click()}
              >
                <Grain />
                <div style={{ position: "absolute", left: 16, bottom: -18, width: 44, height: 44, borderRadius: 12, background: cover, border: "2px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "var(--sh-md)", zIndex: 3, overflow: "hidden" }}>
                  {icon && (icon.startsWith("blob:") || icon.startsWith("http") || icon.startsWith("data:") || icon.includes("/")) ? (
                    <img src={icon} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : icon}
                </div>
                {banner ? (
                  <button type="button" className="hbtn reup" style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)", boxShadow: "var(--sh-md)", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); document.getElementById("banner-upload").click(); }}>
                    <I.edit style={{ width: 14 }} strokeWidth={2.6} />
                  </button>
                ) : (
                  <button type="button" className="hbtn hbtn--soft hbtn--sm reup" style={{ position: "absolute", top: 8, right: 8, padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); document.getElementById("banner-upload").click(); }}>
                    <I.image style={{ width: 14 }} /> Upload
                  </button>
                )}
              </div>
              <input type="file" id="banner-upload" style={{ display: "none" }} accept="image/*" onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setBanner(URL.createObjectURL(e.target.files[0]));
                }
              }} />

              {/* Icon & Location Row */}
              <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Group Icon</label>
                  <button type="button" className="hbtn hbtn--soft hbtn--sm" style={{ width: "100%", justifyContent: "space-between", padding: "8px 12px", fontSize: 13, height: 36 }} onClick={() => setIconDrawer(true)}>
                    <span>Icon</span>
                    <span style={{ fontSize: 16, display: "flex", alignItems: "center" }}>
                      {icon && (icon.startsWith("blob:") || icon.startsWith("http") || icon.startsWith("data:") || icon.includes("/")) ? (
                        <img src={icon} alt="icon" style={{ width: 20, height: 20, objectFit: "cover", borderRadius: 4 }} />
                      ) : icon}
                    </span>
                  </button>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Location</label>
                  <button
                    type="button"
                    className="hbtn hbtn--soft hbtn--sm"
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      fontSize: 13,
                      height: 36,
                      border: "1.5px solid var(--border)",
                      background: "var(--field)",
                      borderRadius: "var(--r-sm)"
                    }}
                    onClick={() => setLocationModalOpen(true)}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <I.pin style={{ width: 14, color: "var(--ink-2)" }} />
                      <span>{city || "Select city..."}</span>
                    </span>
                    <span style={{ fontSize: 9, opacity: 0.6, color: "var(--ink-3)" }}>▼</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="card-divider" />

            <div className="card-right">
              <div className="cfield">
                <label>Host Selector</label>
                <select className="cselect" style={{ padding: "8px 12px", fontSize: 13.5 }}>
                  <option>{ME.name}'s Group</option>
                </select>
              </div>

              <div className="cfield">
                <label>Visibility</label>
                <div className="vis-pills">
                  <button type="button" className={`vis-pill ${visibility === "public" ? "on" : ""}`} onClick={() => setVisibility("public")}>Public</button>
                  <button type="button" className={`vis-pill ${visibility === "private" ? "on" : ""}`} onClick={() => setVisibility("private")}>Unlisted</button>
                  <button type="button" className={`vis-pill ${visibility === "hidden" ? "on" : ""}`} onClick={() => {
                    setVisibility("hidden");
                    setAccessModalTarget("visibility");
                    setAccessModal(true);
                  }}>Restricted-Access</button>
                </div>
                {visibility === "hidden" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Restricted-Access Allowed</span>
                      <button
                        type="button"
                        className="hbtn hbtn--ghost hbtn--sm"
                        onClick={() => {
                          setAccessModalTarget("visibility");
                          setAccessModal(true);
                        }}
                        style={{ padding: "4px 8px", height: "auto", fontSize: "11.5px", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <I.edit style={{ width: 12 }} /> Edit Selection
                      </button>
                    </div>
                    {renderChips("restricted", "visibility")}
                  </div>
                )}
              </div>

              <div className="cfield">
                <label>Group Name</label>
                <input className="cinput" placeholder="What's your group called?" value={name} onChange={e => setName(e.target.value)} />
                <span className="slug-preview">samaagum.co/{name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "your-group-slug"}</span>
              </div>

              {/* Location field removed from here and placed in left column to save space */}
            </div>
          </div>

          {/* Description Card */}
          <div className="form-card">
            <div className="cfield" style={{ marginBottom: 0 }}>
              <label>Description</label>
              <button type="button" className="hbtn hbtn--soft" style={{ width: "100%", justifyContent: "space-between", padding: "12px 16px" }} onClick={() => setDescModal(true)}>
                <span style={{ color: desc ? "var(--ink)" : "var(--ink-3)", fontWeight: 500 }}>
                  {desc ? "Edit Description" : "Add Description"}
                </span>
                <I.edit style={{ width: 16, color: "var(--ink-2)" }} />
              </button>
            </div>
          </div>

          {/* Join Options, Type, Capacity Card */}
          <div className="form-card">
            <div className="cfield">
              <label>Join Eligibility</label>
              <select
                className="cselect"
                value={joinElig}
                onChange={(e) => {
                  const val = e.target.value;
                  setJoinElig(val);
                  if (val === "restricted") {
                    setAccessModalTarget("join");
                    setAccessModal(true);
                  }
                }}
                style={{ padding: "10px 14px", fontSize: 13.5, width: "100%", marginBottom: 12 }}
              >
                <option value="anyone">Public</option>
                <option value="restricted">Restricted Access</option>
                <option value="invite">Invite Only</option>
              </select>

              {/* Only the active configuration is rendered, others collapsed/hidden */}
              {joinElig === "anyone" && (
                <div className="type-pill sm on" style={{ padding: "12px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2, height: "auto", textAlign: "left", cursor: "default" }}>
                  <span className="tpt">Public</span>
                  <span className="tpd">Open to everyone</span>
                </div>
              )}

              {joinElig === "restricted" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="type-pill sm on" style={{ padding: "12px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2, height: "auto", textAlign: "left", cursor: "default" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <span className="tpt">Restricted Access</span>
                      <button
                        type="button"
                        className="hbtn hbtn--ghost hbtn--sm"
                        onClick={() => {
                          setAccessModalTarget("join");
                          setAccessModal(true);
                        }}
                        style={{ padding: "4px 8px", height: "auto", fontSize: "11.5px", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <I.edit style={{ width: 12 }} /> Edit Selection
                      </button>
                    </div>
                    <span className="tpd">Only selected communities, sub-communities, or groups can join</span>
                  </div>
                  {renderChips("restricted", "join")}
                </div>
              )}

              {joinElig === "invite" && (
                <div className="type-pill sm on" style={{ padding: "12px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2, height: "auto", textAlign: "left", cursor: "default" }}>
                  <span className="tpt">Invite Only</span>
                  <span className="tpd">Access by invitation only</span>
                </div>
              )}
            </div>

            <div className="cfield" style={{ marginTop: 16 }}>
              <label>Group Type</label>
              <div className="type-pills" style={{ marginBottom: 12 }}>
                <button type="button" className={`type-pill sm ${groupType === "free" ? "on" : ""}`} onClick={() => setGroupType("free")} style={{ flex: 1, justifyContent: "center" }}>Free</button>
                <button type="button" className={`type-pill sm ${groupType === "paid" ? "on" : ""}`} onClick={() => setGroupType("paid")} style={{ flex: 1, justifyContent: "center" }}>Paid</button>
              </div>

              {groupType === "paid" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                  <div className="cfield" style={{ marginBottom: 4 }}>
                    <label>Currency</label>
                    <select className="cselect" style={{ padding: "8px 12px", fontSize: 13 }} value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option>INR</option>
                      <option>USD</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* Monthly */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "10px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                      <input type="checkbox" checked={plans.monthly.enabled} onChange={e => setPlans({ ...plans, monthly: { ...plans.monthly, enabled: e.target.checked } })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Monthly Plan</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Billed every month</div>
                      </div>
                      {plans.monthly.enabled && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{currency === "INR" ? "₹" : "$"}</span>
                          <input type="number" className="cinput" style={{ width: 80, padding: "4px 8px", fontSize: 13, textAlign: "right" }} value={plans.monthly.fee} onChange={e => setPlans({ ...plans, monthly: { ...plans.monthly, fee: e.target.value } })} />
                        </div>
                      )}
                    </div>

                    {/* Yearly */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "10px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                      <input type="checkbox" checked={plans.yearly.enabled} onChange={e => setPlans({ ...plans, yearly: { ...plans.yearly, enabled: e.target.checked } })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Yearly Plan</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Billed every year</div>
                      </div>
                      {plans.yearly.enabled && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{currency === "INR" ? "₹" : "$"}</span>
                          <input type="number" className="cinput" style={{ width: 80, padding: "4px 8px", fontSize: 13, textAlign: "right" }} value={plans.yearly.fee} onChange={e => setPlans({ ...plans, yearly: { ...plans.yearly, fee: e.target.value } })} />
                        </div>
                      )}
                    </div>

                    {/* One-time */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", padding: "10px 12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                      <input type="checkbox" checked={plans.oneTime.enabled} onChange={e => setPlans({ ...plans, oneTime: { ...plans.oneTime, enabled: e.target.checked } })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>One-time lifetime</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Pay once, access forever</div>
                      </div>
                      {plans.oneTime.enabled && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{currency === "INR" ? "₹" : "$"}</span>
                          <input type="number" className="cinput" style={{ width: 80, padding: "4px 8px", fontSize: 13, textAlign: "right" }} value={plans.oneTime.fee} onChange={e => setPlans({ ...plans, oneTime: { ...plans.oneTime, fee: e.target.value } })} />
                        </div>
                      )}
                    </div>

                    {/* Custom Plans */}
                    {customPlans.map((plan, index) => (
                      <div key={plan.id} style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--surface)", padding: "12px", borderRadius: "var(--r-md)", border: "1px solid var(--border)", position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Custom Plan #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomPlans(customPlans.filter(p => p.id !== plan.id))}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--accent-1)",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: 0
                            }}
                          >
                            Remove
                          </button>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>Plan Name</label>
                            <input
                              type="text"
                              className="cinput"
                              placeholder="e.g. Quarterly"
                              value={plan.name}
                              onChange={e => {
                                const updated = customPlans.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p);
                                setCustomPlans(updated);
                              }}
                              style={{ padding: "6px 10px", fontSize: 12.5 }}
                            />
                          </div>

                          <div style={{ width: 110 }}>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>Interval</label>
                            <select
                              className="cselect"
                              value={plan.interval}
                              onChange={e => {
                                const updated = customPlans.map(p => p.id === plan.id ? { ...p, interval: e.target.value } : p);
                                setCustomPlans(updated);
                              }}
                              style={{ padding: "6px 10px", fontSize: 12.5, height: 32 }}
                            >
                              <option value="week">Weekly</option>
                              <option value="month">Monthly</option>
                              <option value="3 months">Quarterly</option>
                              <option value="6 months">Semi-Annually</option>
                              <option value="year">Yearly</option>
                              <option value="one-time">One-time</option>
                            </select>
                          </div>

                          <div style={{ width: 100 }}>
                            <label style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-3)", display: "block", marginBottom: 4 }}>Fee</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{currency === "INR" ? "₹" : "$"}</span>
                              <input
                                type="number"
                                className="cinput"
                                placeholder="999"
                                value={plan.fee}
                                onChange={e => {
                                  const updated = customPlans.map(p => p.id === plan.id ? { ...p, fee: e.target.value } : p);
                                  setCustomPlans(updated);
                                }}
                                style={{ padding: "6px 10px", fontSize: 12.5, textAlign: "right" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="hbtn hbtn--ghost hbtn--sm"
                      onClick={() => {
                        setCustomPlans([...customPlans, {
                          id: "cp-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                          name: "",
                          interval: "month",
                          fee: ""
                        }]);
                      }}
                      style={{ width: "100%", borderStyle: "dashed", borderContent: "2px", height: "36px", justifyContent: "center" }}
                    >
                      + Add Custom Plan
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="cfield" style={{ marginBottom: 0, marginTop: 16 }}>
              <label>Capacity Settings</label>
              <button
                type="button"
                className="hbtn hbtn--soft"
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  height: "auto",
                  textAlign: "left"
                }}
                onClick={() => setCapModal(true)}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500 }}>Capacity</span>
                    <span style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 600 }}>
                      {limitCap ? (maxCap || "50") : "Unlimited"}
                    </span>
                  </div>
                  {limitCap && waitlist && (
                    <div style={{ fontSize: 11.5, color: "var(--accent-2)", fontWeight: 600, marginTop: 2 }}>
                      Waitlist Enabled
                    </div>
                  )}
                </div>
                <I.edit style={{ width: 16, color: "var(--ink-2)", marginLeft: 12 }} />
              </button>
            </div>
          </div>

          {/* Advanced Settings Card */}
          <div className="form-card">
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", display: "block", marginBottom: 12 }}>Advanced Settings</label>
            <div style={{ display: "flex", gap: 16, padding: "12px 16px", background: "var(--field)", borderRadius: "var(--r-md)" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Questionnaire</div>
                <Toggle on={questionnaire} onClick={() => setQuestionnaire(!questionnaire)} />
                {questionnaire && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--accent-2)", fontWeight: 600 }}>Configured ✓</span>
                    <button type="button" className="hbtn hbtn--soft hbtn--xs" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => setQModal(true)}>Edit</button>
                  </div>
                )}
              </div>
              <div style={{ width: 1, background: "var(--border-2)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Forums</div>
                <Toggle on={forums} onClick={() => setForums(!forums)} />
                {forums && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--accent-2)", fontWeight: 600 }}>Configured ✓</span>
                    <button type="button" className="hbtn hbtn--soft hbtn--xs" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => setForumModal(true)}>Edit</button>
                  </div>
                )}
              </div>
              <div style={{ width: 1, background: "var(--border-2)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Media Gallery</div>
                <Toggle on={gallery} onClick={() => setGallery(!gallery)} />
                {gallery && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--accent-2)", fontWeight: 600 }}>Configured ✓</span>
                    <button type="button" className="hbtn hbtn--soft hbtn--xs" style={{ padding: "2px 6px", fontSize: 11 }} onClick={() => setGalleryModal(true)}>Edit</button>
                  </div>
                )}
              </div>
            </div>
          <div className="cfield">
            <label>Description</label>
            <textarea className="ctext" placeholder="What is this community about? Who should join?" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="cfield">
            <label>Join mode</label>
            <div className="type-pills">
              <button className={`type-pill ${join === "open" ? "on" : ""}`} onClick={() => setJoin("open")}><span className="tpic"><I.globe /></span><span className="tpt">Open</span><span className="tpd">Anyone can join</span></button>
              <button className={`type-pill ${join === "approval" ? "on" : ""}`} onClick={() => setJoin("approval")}><span className="tpic"><I.check /></span><span className="tpt">Approval</span><span className="tpd">You review requests</span></button>
            </div>
          </div>

          <div className="cfield">
            <label>Membership</label>
            <div className="toggle-row"><div className="ti"><div className="t">Join questionnaire</div><div className="d">Ask custom questions when people request to join</div></div><Toggle on={questionnaire} onClick={() => setQuestionnaire(v => !v)} /></div>
            <div className="toggle-row"><div className="ti"><div className="t">Enable forums</div><div className="d">Posts, comments & media at group level</div></div><Toggle on={true} onClick={() => { }} /></div>
            <div className="toggle-row"><div className="ti"><div className="t">Media gallery</div><div className="d">Shared photo gallery for members</div></div><Toggle on={true} onClick={() => { }} /></div>
          </div>
        </div>
      </div>

      {/* --- Right Column: Live Preview & Completeness --- */}
      {!mobile && (
        <div className="create-preview">
          <div className="pv-label">
            <span className="d" />
            LIVE PREVIEW
            <span style={{ marginLeft: "auto", background: "var(--field)", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: "1px solid var(--border)", display: "inline-flex", gap: 4 }}>
              <span style={{ color: "var(--accent-2)" }}>Card</span>
              <span style={{ opacity: 0.5 }}>Mobile</span>
            </span>
          </div>

          <div style={{ pointerEvents: "none", transform: "scale(0.9)", transformOrigin: "top left", width: "111%" }}>
            <GroupCard g={previewG} onOpen={() => { }} joined={false} onJoin={() => { }} />
          </div>

          {/* Group Completeness widget */}
          <div style={{ marginTop: 20, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", boxShadow: "var(--sh-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-2)", marginBottom: 8, letterSpacing: "0.05em" }}>
              <span>Group Completeness</span>
              <span>{(() => {
                let score = 0;
                if (name) score += 20;
                if (desc) score += 20;
                if (location) score += 20;
                if (banner || cover !== COVERS.violet) score += 20;
                if (joinElig !== "anyone" || groupType === "paid" || questionnaire || forums || gallery) score += 20;
                return score;
              })()}%</span>
            </div>
            <div style={{ height: 6, background: "var(--border-2)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
              <div style={{
                width: `${(() => {
                  let score = 0;
                  if (name) score += 20;
                  if (desc) score += 20;
                  if (location) score += 20;
                  if (banner || cover !== COVERS.violet) score += 20;
                  if (joinElig !== "anyone" || groupType === "paid" || questionnaire || forums || gallery) score += 20;
                  return score;
                })()}%`,
                height: "100%",
                background: "var(--accent-2)",
                transition: "width 0.3s"
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: name ? "var(--ink)" : "var(--ink-3)" }}>
                <span style={{ fontSize: 14, color: name ? "var(--accent-2)" : "var(--border-2)" }}>{name ? "✓" : "○"}</span> Group Name
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: desc ? "var(--ink)" : "var(--ink-3)" }}>
                <span style={{ fontSize: 14, color: desc ? "var(--accent-2)" : "var(--border-2)" }}>{desc ? "✓" : "○"}</span> Description
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: location ? "var(--ink)" : "var(--ink-3)" }}>
                <span style={{ fontSize: 14, color: location ? "var(--accent-2)" : "var(--border-2)" }}>{location ? "✓" : "○"}</span> Location
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: (banner || cover !== COVERS.violet) ? "var(--ink)" : "var(--ink-3)" }}>
                <span style={{ fontSize: 14, color: (banner || cover !== COVERS.violet) ? "var(--accent-2)" : "var(--border-2)" }}>{(banner || cover !== COVERS.violet) ? "✓" : "○"}</span> Header / Theme
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: (joinElig !== "anyone" || groupType === "paid" || questionnaire || forums || gallery) ? "var(--ink)" : "var(--ink-3)" }}>
                <span style={{ fontSize: 14, color: (joinElig !== "anyone" || groupType === "paid" || questionnaire || forums || gallery) ? "var(--accent-2)" : "var(--border-2)" }}>{(joinElig !== "anyone" || groupType === "paid" || questionnaire || forums || gallery) ? "✓" : "○"}</span> Custom Rules / Settings
              </div>
            </div>
          <div className="pv-label"><span className="d" />Live preview</div>
          <GroupCard g={previewG} onOpen={() => { }} joined={false} onJoin={() => { }} />
          <div style={{ marginTop: 22, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>Summary</div>
            <div className="side-stat"><span className="k">Category</span><span className="v">{cat}</span></div>
            <div className="side-stat"><span className="k">Join mode</span><span className="v" style={{ textTransform: "capitalize" }}>{join}</span></div>
            <div className="side-stat"><span className="k">Forums</span><span className="v">Enabled</span></div>
          </div>
        </div>
      )}

      {/* --- Sticky footer actions --- */}
      <div className="create-foot" style={mobile ? { gridColumn: "1" } : { gridColumn: "1 / -1" }}>
        <button type="button" className="hbtn hbtn--ghost" onClick={() => { localStorage.removeItem(draftKey); go("home"); }}>Discard</button>
        <div className="sp" />
        <button type="button" className="hbtn hbtn--ghost" onClick={() => alert("Draft saved automatically!")}>Save draft</button>
        <button type="button" className="hbtn hbtn--primary" onClick={() => { localStorage.removeItem(draftKey); go("group", { ...previewG, id: "newg", posts: 0, members: 1, threadPerm, replyPerm }); }}><I.check />Create Group</button>
      <div className="create-foot" style={mobile ? { gridColumn: "1" } : { gridColumn: "1 / -1" }}>
        <button className="hbtn hbtn--ghost" onClick={() => go("home")}>Cancel</button>
        <div className="sp" />
        <button className="hbtn hbtn--primary" onClick={() => go("group", { ...previewG, id: "newg", posts: 0, members: 1 })}><I.check />Create group</button>
      </div>
    </div>
  );
}

Object.assign(window, { CreateEvent, CreateGroup });
