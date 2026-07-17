// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';

export function LocationModal({ open, onClose, selectedCity, onSelectCity }) {
  const [tempCity, setTempCity] = useState(selectedCity || "");
  const [customLocationName, setCustomLocationName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const [dynamicCities, setDynamicCities] = useState([]);
  const [isCityActive, setIsCityActive] = useState(true);

  React.useEffect(() => {
    if (window.getActiveCities) {
      window.getActiveCities(true).then(data => {
        if (data && data.length) {
          setDynamicCities(data.map((c: any) => ({
            name: c.city_name && c.city_name !== 'Unknown' ? c.city_name : c.state_name,
            x: Math.max(10, Math.min(90, (Number(c.longitude) + 180) / 360 * 100)),
            y: Math.max(10, Math.min(90, (90 - Number(c.latitude)) / 180 * 100)),
            info: `${c.state_name || ''}, ${c.country_name || ''}`.replace(/^,\s*/, ''),
            lat: Number(c.latitude),
            lon: Number(c.longitude),
            state: c.state_name,
            country: c.country_name
          })));
        }
      });
    }
  }, []);

  React.useEffect(() => {
    if (tempCity && dynamicCities.length > 0) {
      const isActive = dynamicCities.some(c => (c.name || "").toLowerCase() === (tempCity || "").toLowerCase());
      setIsCityActive(isActive);
    } else {
      setIsCityActive(true);
    }
  }, [tempCity, dynamicCities]);

  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);

  const activeCityObj = dynamicCities.find(c => c.name === tempCity) || dynamicCities.find(c => c.name === selectedCity) || dynamicCities[0];

  const [currentLat, setCurrentLat] = useState(activeCityObj?.lat || 20.5937);
  const [currentLon, setCurrentLon] = useState(activeCityObj?.lon || 78.9629);

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

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([initialLat, initialLng], 12);

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({
      position: 'topright'
    }).addTo(map);

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

    marker.on('drag', (e) => {
      const pos = marker.getLatLng();
      setCurrentLat(pos.lat);
      setCurrentLon(pos.lng);
    });

    marker.on('dragend', (e) => {
      const pos = marker.getLatLng();
      updateLocationFromCoords(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCurrentLat(lat);
      setCurrentLon(lng);
      updateLocationFromCoords(lat, lng);
    });

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

    const match = dynamicCities.find(c => (c.name || "").toLowerCase() === searchQuery.trim().toLowerCase());
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
        const filteredData = data.filter((item: any) => {
          const locationName = (item.name || item.display_name.split(',')[0]).toLowerCase().trim();
          return dynamicCities.some(dc => {
            const dcName = (dc.name || "").toLowerCase();
            return locationName === dcName || 
                   locationName === dcName + " city" || 
                   dcName === locationName + " city";
          });
        });
        
        setSearchResults(filteredData.map((item: any) => ({
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

  const filtered = dynamicCities.filter(c => (c.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())).slice(0, 50);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 720, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>

        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Select Event Location</h3>
            <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-3)" }}>Search or click anywhere on the map to set a precise pin</p>
          </div>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
        </div>

        <div style={{ display: "flex", height: 420, minHeight: 420 }}>

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

              {filtered.length > 0 && <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px" }}>Popular Cities</div>}
              {filtered.map((c, idx) => (
                <button
                  key={`${c.name}-${c.state}-${c.country}-${idx}`}
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

          <div style={{ flex: 1, position: "relative", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

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

            <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 10.5, fontFamily: "monospace", pointerEvents: "none", zIndex: 10, display: "flex", flexDirection: "column", gap: 3, border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontWeight: 600, color: "var(--accent-2)" }}>GPS HUD STATUS</div>
              <div>LAT: {currentLat.toFixed(5)}° {currentLat >= 0 ? "N" : "S"}</div>
              <div>LON: {currentLon.toFixed(5)}° {currentLon >= 0 ? "E" : "W"}</div>
            </div>

            {customLocationName && (
              <div style={{ position: "absolute", top: 12, left: 12, right: 12, background: "var(--surface)", color: "var(--ink)", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, boxShadow: "var(--sh-md)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}>
                <I.pin style={{ width: 14, color: "var(--accent-2)", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{customLocationName}</span>
              </div>
            )}
          </div>
        </div>

        {!isCityActive && (
          <div style={{ padding: "10px 20px", background: "var(--surface-3)", color: "var(--danger)", fontSize: 13, fontWeight: 500, textAlign: "center", borderTop: "1px solid var(--border)" }}>
            <I.warning style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6, marginBottom: 2, width: 16 }} />
            This city is currently unavailable.
          </div>
        )}
        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10, background: "var(--field)" }}>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="hbtn hbtn--primary hbtn--sm"
            disabled={!isCityActive}
            style={{ opacity: !isCityActive ? 0.5 : 1, cursor: !isCityActive ? "not-allowed" : "pointer" }}
            onClick={() => {
              if (tempCity && isCityActive) {
                onSelectCity(tempCity, activeCityObj);
              }
              onClose();
            }}
          >
            Confirm Location
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />
    </div>
  );
}
