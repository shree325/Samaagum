// @ts-nocheck
const { useState, useRef, useEffect, useCallback, useMemo } = React;

// Reuse existing components and utilities from the project
// Assuming I, Grain, EventCard, LocationSection, COVERS, GROUPS, ME, etc. are globally available via the app bundle or global namespace.

function UpgradePlanModal({ open, onClose, feature, go, currentPlanName }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 12000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)", border: "1px solid var(--border)", position: "relative", textAlign: "center" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0", color: "var(--ink)" }}>Upgrade Required</h2>
        <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "0 0 24px 0", lineHeight: 1.6 }}>
          The feature <strong>{feature}</strong> is locked under your current plan ({currentPlanName || "Free Plan"}). Please upgrade your plan to unlock premium options, unlimited capacity, and advanced events features!
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button 
            className="hbtn hbtn--primary" 
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15, fontWeight: 600 }}
            onClick={() => {
              onClose();
              go("upgrade");
            }}
          >
            Upgrade Plan
          </button>
          <button 
            className="hbtn hbtn--ghost" 
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 14 }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverPicker({ value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      {COVER_SWATCHES.map(s => (
        <button key={s.k} onClick={() => onPick(s.v)} title={s.k}
          style={{
            width: 34, height: 34, borderRadius: 10, cursor: "pointer", background: s.v as any,
            border: value === s.v ? "2.5px solid var(--ink)" : "2px solid transparent",
            boxShadow: value === s.v ? "0 0 0 2px var(--surface) inset" : "var(--sh-sm)", transition: "transform .15s"
          }} />
      ))}
    </div>
  );
}

function Toggle({ on, onClick }) { return <button className={`tg ${on ? "on" : ""}`} onClick={onClick} />; }

function format24to12(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

function parse12to24(val) {
  if (!val) return null;
  const match = val.match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?\s*$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toLowerCase() : null;
  if (h < 1 || h > 12 || m < 0 || m > 59) {
    if (!ampm && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return null;
  }
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function TimePicker({ label = undefined, value, onChange, mobile, compact }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);
  const clockRef = useRef(null);

  const [mode, setMode] = useState("hours");
  const [tempHour, setTempHour] = useState(12);
  const [tempMin, setTempMin] = useState(0);
  const [tempAmPm, setTempAmPm] = useState("PM");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setInputValue(format24to12(value));
  }, [value]);

  useEffect(() => {
    if (open) {
      const now = new Date();
      let currentHour = now.getHours();
      let currentMinute = Math.round(now.getMinutes() / 5) * 5;
      if (currentMinute === 60) {
        currentMinute = 0;
        currentHour = (currentHour + 1) % 24;
      }
      const defaultVal = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const [hStr, mStr] = (value || defaultVal).split(":");
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      if (isNaN(h)) h = 12;
      if (isNaN(m)) m = 0;

      const ampm = h >= 12 ? "PM" : "AM";
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;

      setTempHour(h12);
      setTempMin(m);
      setTempAmPm(ampm);
      setMode("hours");
    }
  }, [open, value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateTime = (h, m, ampm) => {
    let h24 = h;
    if (ampm === "PM" && h < 12) h24 += 12;
    if (ampm === "AM" && h === 12) h24 = 0;
    const timeStr = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(timeStr);
  };

  const selectHour = (h) => {
    setTempHour(h);
    setTimeout(() => setMode("minutes"), 200);
    updateTime(h, tempMin, tempAmPm);
  };

  const selectMin = (m) => {
    setTempMin(m);
    updateTime(tempHour, m, tempAmPm);
    setTimeout(() => setOpen(false), 300);
  };

  const selectAmPm = (ampm) => {
    setTempAmPm(ampm);
    updateTime(tempHour, tempMin, ampm);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parse12to24(val);
    if (parsed) {
      onChange(parsed);
    }
  };

  const handleInputBlur = () => {
    const parsed = parse12to24(inputValue);
    if (!parsed) {
      setInputValue(format24to12(value));
    }
  };

  const calculateValFromCoords = useCallback((clientX, clientY) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;

    let clickAngle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (clickAngle < 0) clickAngle += 360;

    if (mode === "hours") {
      let h = Math.round(clickAngle / 30);
      if (h === 0) h = 12;
      return h;
    } else {
      let m = Math.round(clickAngle / 6);
      if (m === 60) m = 0;
      m = Math.round(m / 5) * 5;
      if (m === 60) m = 0;
      return m;
    }
  }, [mode]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const val = calculateValFromCoords(e.clientX, e.clientY);
      if (val !== undefined) {
        if (mode === "hours") {
          setTempHour(val);
          updateTime(val, tempMin, tempAmPm);
        } else {
          setTempMin(val);
          updateTime(tempHour, val, tempAmPm);
        }
      }
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      const val = calculateValFromCoords(e.clientX, e.clientY);
      if (val !== undefined) {
        if (mode === "hours") {
          selectHour(val);
        } else {
          selectMin(val);
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, mode, calculateValFromCoords, tempHour, tempMin, tempAmPm]);

  const renderClockFace = () => {
    const numbers = mode === "hours"
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    let angle = 0;
    if (mode === "hours") {
      angle = (tempHour % 12) * 30;
    } else {
      angle = tempMin * 6;
    }

    return (
      <div
        ref={clockRef}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          const val = calculateValFromCoords(e.clientX, e.clientY);
          if (val !== undefined) {
            if (mode === "hours") {
              setTempHour(val);
              updateTime(val, tempMin, tempAmPm);
            } else {
              setTempMin(val);
              updateTime(tempHour, val, tempAmPm);
            }
          }
        }}
        style={{
          position: "relative",
          width: "200px",
          height: "200px",
          background: "var(--field)",
          borderRadius: "50%",
          margin: "16px auto",
          cursor: "pointer",
          border: "1px solid var(--border)",
          userSelect: "none"
        }}
      >
        <div style={{
          position: "absolute",
          left: "calc(50% - 3px)",
          top: "calc(50% - 3px)",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: "var(--accent-2)",
          zIndex: 3,
          pointerEvents: "none"
        }} />

        <div style={{
          position: "absolute",
          bottom: "50%",
          left: "calc(50% - 1px)",
          width: "2px",
          height: "75px",
          background: "var(--accent-2)",
          transformOrigin: "bottom center",
          transform: `rotate(${angle}deg)`,
          zIndex: 2,
          pointerEvents: "none",
          transition: isDragging ? "none" : "transform 0.15s ease-out"
        }}>
          <div style={{
            position: "absolute",
            top: "-12px",
            left: "-11px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "var(--accent-2)",
            opacity: 0.8
          }} />
        </div>

        {numbers.map((num, i) => {
          const numAngle = i * 30 * (Math.PI / 180);
          const radius = 72;
          const left = 100 + radius * Math.sin(numAngle);
          const top = 100 - radius * Math.cos(numAngle);

          const isSelected = mode === "hours"
            ? (tempHour === num || (tempHour === 12 && num === 12))
            : (Math.round(tempMin / 5) * 5 === num || (tempMin === 0 && num === 0));

          return (
            <div
              key={num}
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                transform: "translate(-50%, -50%)",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: isSelected ? "700" : "500",
                color: isSelected ? "#fff" : "var(--ink-2)",
                zIndex: 4,
                userSelect: "none",
                pointerEvents: "none"
              }}
            >
              {mode === "minutes" ? String(num).padStart(2, '0') : num}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: compact ? "100%" : "100%", maxWidth: compact ? "none" : (mobile ? "140px" : "130px") }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{label}</label>}
      <div style={{ position: "relative", height: compact ? "100%" : "auto" }}>
        <input
          className={compact ? "" : "cinput"}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={() => setOpen(true)}
          placeholder="09:00 AM"
          style={compact ? {
            width: "100%",
            height: "100%",
            cursor: "pointer",
            border: "none",
            background: "transparent",
            padding: "16px",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none"
          } : {
            width: "100%",
            cursor: "pointer",
            paddingRight: "30px",
            background: "var(--field)",
            border: "1px solid var(--border)"
          }}
        />
        {!compact && (
          <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-3)", fontSize: "12px" }}>
            ⏰
          </span>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          marginTop: "8px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--sh-xl)",
          padding: "16px",
          zIndex: 1000,
          width: "240px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "popUp 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", fontSize: "18px", fontWeight: "600" }}>
            <span
              onClick={() => setMode("hours")}
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "var(--r-sm)",
                background: mode === "hours" ? "var(--accent-soft)" : "transparent",
                color: mode === "hours" ? "var(--accent-2)" : "var(--ink)",
                border: mode === "hours" ? "1px solid var(--border)" : "1px solid transparent"
              }}
            >
              {String(tempHour).padStart(2, '0')}
            </span>
            <span>:</span>
            <span
              onClick={() => setMode("minutes")}
              style={{
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "var(--r-sm)",
                background: mode === "minutes" ? "var(--accent-soft)" : "transparent",
                color: mode === "minutes" ? "var(--accent-2)" : "var(--ink)",
                border: mode === "minutes" ? "1px solid var(--border)" : "1px solid transparent"
              }}
            >
              {String(tempMin).padStart(2, '0')}
            </span>
            <div style={{ display: "flex", gap: "2px", background: "var(--bg-2)", padding: "2px", borderRadius: "var(--r-sm)", marginLeft: "8px", border: "1px solid var(--border)" }}>
              <button
                onClick={() => selectAmPm("AM")}
                style={{
                  border: "none",
                  padding: "4px 6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: tempAmPm === "AM" ? "var(--surface)" : "transparent",
                  color: tempAmPm === "AM" ? "var(--accent-2)" : "var(--ink-3)",
                  boxShadow: tempAmPm === "AM" ? "var(--sh-sm)" : "none"
                }}
              >
                AM
              </button>
              <button
                onClick={() => selectAmPm("PM")}
                style={{
                  border: "none",
                  padding: "4px 6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: tempAmPm === "PM" ? "var(--surface)" : "transparent",
                  color: tempAmPm === "PM" ? "var(--accent-2)" : "var(--ink-3)",
                  boxShadow: tempAmPm === "PM" ? "var(--sh-sm)" : "none"
                }}
              >
                PM
              </button>
            </div>
          </div>

          {renderClockFace()}

          <div style={{ display: "flex", gap: "6px", width: "100%", justifyContent: "flex-end", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <button
              className="hbtn hbtn--ghost hbtn--sm"
              onClick={() => setOpen(false)}
              style={{ padding: "6px 12px", border: "none" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TIMEZONES = [
  { value: "UTC +05:30 India", label: "GMT+05:30", city: "Asia/Kolkata" },
  { value: "UTC +00:00 London", label: "GMT+00:00", city: "Europe/London" },
  { value: "UTC -05:00 New York", label: "GMT-05:00", city: "America/New_York" },
  { value: "UTC +08:00 Singapore", label: "GMT+08:00", city: "Asia/Singapore" },
  { value: "UTC +09:00 Tokyo", label: "GMT+09:00", city: "Asia/Tokyo" },
  { value: "UTC -08:00 Los Angeles", label: "GMT-08:00", city: "America/Los_Angeles" }
];

function addOneHour(timeStr) {
  if (!timeStr) return "10:00";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;
  h = (h + 1) % 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getDurationText(startDate, startTime, endDate, endTime) {
  if (!startDate || !startTime || !endDate || !endTime) return "";
  try {
    const startStr = `${startDate}T${startTime}`;
    const endStr = `${endDate}T${endTime}`;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "";

    const diffMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    let text = "";
    if (hrs > 0) {
      text += `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    }
    if (mins > 0) {
      if (text) text += " ";
      text += `${mins} ${mins === 1 ? 'min' : 'mins'}`;
    }
    return text;
  } catch (e) {
    return "";
  }
}

function getTzInfo(tzValue) {
  const mapping = {
    "UTC +05:30 India": { main: "GMT+05:30", city: "Asia/Kolkata" },
    "UTC +00:00 London": { main: "GMT+00:00", city: "Europe/London" },
    "UTC -05:00 New York": { main: "GMT-05:00", city: "America/New_York" },
    "UTC +08:00 Singapore": { main: "GMT+08:00", city: "Asia/Singapore" },
    "UTC +09:00 Tokyo": { main: "GMT+09:00", city: "Asia/Tokyo" },
    "UTC -08:00 Los Angeles": { main: "GMT-08:00", city: "America/Los_Angeles" }
  };
  return mapping[tzValue] || { main: tzValue || "GMT+05:30", city: "Asia/Kolkata" };
}

function EligibilityOption({ active, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "18px",
        borderRadius: "16px",
        border: active ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
        background: active ? "var(--accent-soft)" : "var(--field)",
        cursor: "pointer",
        transition: "all .15s",
        outline: "none",
        fontFamily: "inherit"
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: active ? "var(--accent-2)" : "var(--ink)" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: "1.4" }}>
        {desc}
      </div>
    </button>
  );
}

function SummaryChip({ icon, label, onClick }: any) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "var(--field)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink)",
        cursor: "pointer",
        transition: "border-color 0.15s, background-color 0.15s"
      }}
      className="summary-chip"
    >
      <span>{icon} {label}</span>
      <span style={{ color: "var(--accent-2)", fontSize: 11, marginLeft: 2 }}>⚙️</span>
    </span>
  );
}

function CategorySummaryChip({ type, items, onEditClick }: any) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "var(--field)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink)"
      }}
    >
      <span>🏛️ {items.join(", ")}</span>
      <span style={{ cursor: "pointer", color: "var(--accent-2)", fontSize: 12, marginLeft: 4 }} onClick={onEditClick}>✏️</span>
    </span>
  );
}

function RuleSummaryChip({ rule, onEditClick }: any) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "var(--field)",
        border: "1px solid var(--border)",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--ink)"
      }}
    >
      <span>🏛️ {rule.community} → 👥 {rule.groups.join(", ")}</span>
      <span style={{ cursor: "pointer", color: "var(--accent-2)", fontSize: 12, marginLeft: 4 }} onClick={onEditClick}>✏️</span>
    </span>
  );
}
const ACCESS_TREE = [
  {
    id: "comm-samaagum",
    name: "Samaagum Hub",
    type: "community",
    children: [
      {
        id: "sub-developers",
        name: "Samaagum Developers",
        type: "subcommunity",
        children: [
          { id: "grp-founders-coll", name: "BLR Founders Collective", type: "group" },
          { id: "grp-sunrise-runners", name: "Sunrise Runners", type: "group" }
        ]
      }
    ]
  },
  {
    id: "comm-sgsits",
    name: "SGSITS",
    type: "community",
    children: [
      {
        id: "sub-cse",
        name: "CSE",
        type: "subcommunity",
        children: [
          { id: "grp-hackathon", name: "Hackathon Team", type: "group" },
          { id: "grp-coding", name: "Coding Club", type: "group" },
          { id: "grp-placement", name: "Placement Preparation", type: "group" }
        ]
      },
      {
        id: "sub-it",
        name: "IT",
        type: "subcommunity",
        children: [
          { id: "grp-startup", name: "Startup Founders", type: "group" },
          { id: "grp-design", name: "Design Team", type: "group" }
        ]
      },
      {
        id: "sub-ece",
        name: "ECE",
        type: "subcommunity",
        children: []
      }
    ]
  },
  {
    id: "comm-manit",
    name: "MANIT",
    type: "community",
    children: [
      {
        id: "sub-cse-manit",
        name: "CSE",
        type: "subcommunity",
        children: [
          { id: "grp-hackathon-manit", name: "Hackathon Team", type: "group" }
        ]
      }
    ]
  },
  {
    id: "comm-iitb",
    name: "IIT Bangalore",
    type: "community",
    children: [
      {
        id: "sub-tech-club",
        name: "Indiranagar Tech Club",
        type: "subcommunity",
        children: [
          { id: "grp-design-guild-blr", name: "Design Guild Bangalore", type: "group" }
        ]
      },
      {
        id: "sub-design-guild",
        name: "Design Guild Hub",
        type: "subcommunity",
        children: []
      }
    ]
  }
];

const isChecked = (node: any, selected: any): boolean => {
  if (node.type === "group") {
    return selected.groups.includes(node.id);
  }
  if (!node.children || node.children.length === 0) {
    if (node.type === "subcommunity") return selected.subCommunities.includes(node.id);
    return selected.communities.includes(node.id);
  }
  return node.children.every((child: any) => isChecked(child, selected));
};

const isIndeterminate = (node: any, selected: any): boolean => {
  if (node.type === "group") return false;
  if (!node.children || node.children.length === 0) return false;

  const checkedCount = node.children.filter((child: any) => isChecked(child, selected)).length;
  const indetCount = node.children.filter((child: any) => isIndeterminate(child, selected)).length;

  const allChecked = checkedCount === node.children.length;
  const noneChecked = checkedCount === 0 && indetCount === 0;

  return !allChecked && !noneChecked;
};

const getDescendantIds = (node: any): { communities: string[], subCommunities: string[], groups: string[] } => {
  const res: { communities: string[], subCommunities: string[], groups: string[] } = { communities: [], subCommunities: [], groups: [] };
  if (node.type === "community") {
    res.communities.push(node.id);
  } else if (node.type === "subcommunity") {
    res.subCommunities.push(node.id);
  } else if (node.type === "group") {
    res.groups.push(node.id);
  }

  if (node.children) {
    node.children.forEach((child: any) => {
      const childRes = getDescendantIds(child);
      res.communities.push(...childRes.communities);
      res.subCommunities.push(...childRes.subCommunities);
      res.groups.push(...childRes.groups);
    });
  }
  return res;
};

const findParentPath = (id: string, tree: any[]): any[] => {
  for (const comm of tree) {
    if (comm.id === id) return [];
    if (comm.children) {
      for (const sub of comm.children) {
        if (sub.id === id) return [comm];
        if (sub.children) {
          for (const grp of sub.children) {
            if (grp.id === id) return [comm, sub];
          }
        }
      }
    }
  }
  return [];
};

const toggleNodeCheck = (node: any, selected: any) => {
  const checked = isChecked(node, selected);
  const desc = getDescendantIds(node);

  let nextCommunities = [...selected.communities];
  let nextSubCommunities = [...selected.subCommunities];
  let nextGroups = [...selected.groups];

  if (checked) {
    // Uncheck node and all its descendants
    nextCommunities = nextCommunities.filter(id => !desc.communities.includes(id));
    nextSubCommunities = nextSubCommunities.filter(id => !desc.subCommunities.includes(id));
    nextGroups = nextGroups.filter(id => !desc.groups.includes(id));

    // Uncheck parents
    const parentPath = findParentPath(node.id, ACCESS_TREE);
    parentPath.forEach((p: any) => {
      if (p.type === "community") {
        nextCommunities = nextCommunities.filter(id => id !== p.id);
      } else if (p.type === "subcommunity") {
        nextSubCommunities = nextSubCommunities.filter(id => id !== p.id);
      }
    });
  } else {
    // Check node and all descendants
    desc.communities.forEach(id => {
      if (!nextCommunities.includes(id)) nextCommunities.push(id);
    });
    desc.subCommunities.forEach(id => {
      if (!nextSubCommunities.includes(id)) nextSubCommunities.push(id);
    });
    desc.groups.forEach(id => {
      if (!nextGroups.includes(id)) nextGroups.push(id);
    });

    // Upward propagation
    let changed = true;
    while (changed) {
      changed = false;
      for (const comm of ACCESS_TREE) {
        if (comm.children && comm.children.length > 0) {
          const allChildrenChecked = comm.children.every(sub => {
            if (sub.children && sub.children.length > 0) {
              const allSubChecked = sub.children.every(grp => nextGroups.includes(grp.id));
              return allSubChecked;
            }
            return nextSubCommunities.includes(sub.id);
          });
          if (allChildrenChecked && !nextCommunities.includes(comm.id)) {
            nextCommunities.push(comm.id);
            changed = true;
          }

          comm.children.forEach(sub => {
            if (sub.children && sub.children.length > 0) {
              const allSubChecked = sub.children.every(grp => nextGroups.includes(grp.id));
              if (allSubChecked && !nextSubCommunities.includes(sub.id)) {
                nextSubCommunities.push(sub.id);
                changed = true;
              }
            }
          });
        }
      }
    }
  }

  return {
    communities: nextCommunities,
    subCommunities: nextSubCommunities,
    groups: nextGroups
  };
};

const nodeMatchesSearch = (node: any, query: string): boolean => {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true;
  if (node.children) {
    return node.children.some((child: any) => nodeMatchesSearch(child, query));
  }
  return false;
};

const getSearchAutoExpandedIds = (query: string): Set<string> => {
  const ids = new Set<string>();
  if (!query) return ids;

  ACCESS_TREE.forEach(comm => {
    let commMatches = false;
    if (comm.children) {
      comm.children.forEach(sub => {
        let subMatches = false;
        if (sub.children) {
          sub.children.forEach(grp => {
            if (grp.name.toLowerCase().includes(query.toLowerCase())) {
              subMatches = true;
            }
          });
        }
        if (sub.name.toLowerCase().includes(query.toLowerCase()) || subMatches) {
          commMatches = true;
          ids.add(sub.id);
        }
      });
    }
    if (comm.name.toLowerCase().includes(query.toLowerCase()) || commMatches) {
      ids.add(comm.id);
    }
  });
  return ids;
};

function TreeNodeCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={el => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={onChange}
      style={{ cursor: "pointer", width: 15, height: 15, accentColor: "var(--accent-2)" }}
    />
  );
}

const getTopLevelCheckedNodes = (tree: any[], selected: any): any[] => {
  const list: any[] = [];
  const traverse = (node: any) => {
    if (isChecked(node, selected)) {
      list.push(node);
      return;
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  tree.forEach(traverse);
  return list;
};

const getSelectedNodesWithDetails = (tree: any[], selected: any) => {
  const result: { id: string; name: string; type: string }[] = [];
  const traverse = (node: any) => {
    if (node.type === "community" && selected.communities.includes(node.id)) {
      result.push({ id: node.id, name: node.name, type: "community" });
    } else if (node.type === "subcommunity" && selected.subCommunities.includes(node.id)) {
      result.push({ id: node.id, name: node.name, type: "subcommunity" });
    } else if (node.type === "group" && selected.groups.includes(node.id)) {
      result.push({ id: node.id, name: node.name, type: "group" });
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  };
  tree.forEach(traverse);
  return result;
};

const findNodeInTree = (id: string, tree: any[]): any => {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(id, node.children);
      if (found) return found;
    }
  }
  return null;
};


function AccessControlModal({ open, onClose, mode, selectedAccess, setSelectedAccess }: any) {
  const [search, setSearch] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set<string>());
  const [ruleCommunity, setRuleCommunity] = useState("Samaagum Hub");
  const [ruleGroups, setRuleGroups] = useState([] as string[]);

  if (!open) return null;

  // Search auto-expansion
  const searchAutoExpandedIds = getSearchAutoExpandedIds(search);
  const isNodeExpanded = (nodeId: string) => {
    return expandedNodeIds.has(nodeId) || searchAutoExpandedIds.has(nodeId);
  };
  const toggleNodeExpansion = (nodeId: string) => {
    const next = new Set(expandedNodeIds);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setExpandedNodeIds(next);
  };

  const selectAllNodes = () => {
    const communities: string[] = [];
    const subCommunities: string[] = [];
    const groups: string[] = [];

    ACCESS_TREE.forEach(comm => {
      communities.push(comm.id);
      if (comm.children) {
        comm.children.forEach(sub => {
          subCommunities.push(sub.id);
          if (sub.children) {
            sub.children.forEach(grp => {
              groups.push(grp.id);
            });
          }
        });
      }
    });

    setSelectedAccess({
      ...selectedAccess,
      restricted: {
        communities,
        subCommunities,
        groups
      }
    });
  };

  const clearAllNodes = () => {
    setSelectedAccess({
      ...selectedAccess,
      restricted: {
        communities: [],
        subCommunities: [],
        groups: []
      }
    });
  };

  // Rule Builder Specifics
  const communitiesList = ACCESS_TREE.map(c => c.name);
  const getGroupsForCommunityName = (commName: string) => {
    const comm = ACCESS_TREE.find(c => c.name === commName);
    if (!comm) return [];
    const groups: string[] = [];
    comm.children.forEach(sub => {
      sub.children.forEach(grp => {
        groups.push(grp.name);
      });
    });
    return groups;
  };
  const ruleGroupsList = getGroupsForCommunityName(ruleCommunity);

  const handleAddRule = () => {
    if (ruleGroups.length === 0) return;
    const newRule = {
      id: "r-" + Date.now(),
      community: ruleCommunity,
      groups: ruleGroups
    };
    setSelectedAccess({
      ...selectedAccess,
      selectedMembers: [...selectedAccess.selectedMembers, newRule]
    });
    setRuleGroups([]);
  };

  const handleRemoveRule = (id) => {
    setSelectedAccess({
      ...selectedAccess,
      selectedMembers: selectedAccess.selectedMembers.filter(r => r.id !== id)
    });
  };

  const renderTreeNode = (node: any, level: number = 0) => {
    if (search && !nodeMatchesSearch(node, search)) {
      return null;
    }

    const nodeChecked = isChecked(node, selectedAccess.restricted);
    const nodeIndeterminate = isIndeterminate(node, selectedAccess.restricted);
    const hasChildren = node.children && node.children.length > 0;
    const expanded = isNodeExpanded(node.id);
    const icon = node.type === "community" ? "🏛️" : node.type === "subcommunity" ? "📁" : "👥";

    return (
      <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
        <div
          className="tree-node-row"
          onClick={() => {
            const nextRestricted = toggleNodeCheck(node, selectedAccess.restricted);
            setSelectedAccess({
              ...selectedAccess,
              restricted: nextRestricted
            });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: "var(--r-md)",
            cursor: "pointer",
            marginLeft: level * 20,
            userSelect: "none",
            transition: "background 0.15s ease"
          }}
        >
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(node.id);
              }}
              style={{
                cursor: "pointer",
                fontSize: 10,
                width: 16,
                height: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-3)",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease"
              }}
            >
              ▶
            </span>
          ) : (
            <span style={{ width: 16 }} />
          )}

          <span onClick={e => e.stopPropagation()}>
            <TreeNodeCheckbox
              checked={nodeChecked}
              indeterminate={nodeIndeterminate}
              onChange={() => {
                const nextRestricted = toggleNodeCheck(node, selectedAccess.restricted);
                setSelectedAccess({
                  ...selectedAccess,
                  restricted: nextRestricted
                });
              }}
            />
          </span>

          <span
            style={{
              fontSize: 13,
              fontWeight: node.type === "community" ? 600 : 500,
              color: "var(--ink)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flex: 1
            }}
          >
            <span>{icon}</span>
            <span>{node.name}</span>
          </span>
        </div>

        {hasChildren && expanded && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const allSelectedDetails = getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <style>{`
        .tree-node-row:hover {
          background: var(--bg-2) !important;
        }
      `}</style>
      <div style={{ background: "var(--surface)", width: 500, maxHeight: "85vh", borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
            {mode === "restricted" ? "Restricted Access Settings" : "Configure Allowed Members"}
          </h2>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose} style={{ border: "none" }}><I.x /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {mode === "restricted" ? (
            <div>
              {/* Selection Summary at Top */}
              <div style={{ marginBottom: 12, padding: "0 4px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>Selection Summary</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
                  <span>🏛️ {selectedAccess.restricted.communities.length} Communities</span>
                  <span>📁 {selectedAccess.restricted.subCommunities.length} Sub-Communities</span>
                  <span>👥 {selectedAccess.restricted.groups.length} Groups</span>
                </div>
                {allSelectedDetails.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", maxHeight: 120, overflowY: "auto" }}>
                    {allSelectedDetails.map(node => {
                      const icon = node.type === "community" ? "🏛️" : node.type === "subcommunity" ? "📁" : "👥";
                      return (
                        <span key={node.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--accent-soft)", color: "var(--accent-2)", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999 }}>
                          <span>{icon} {node.name}</span>
                          <span
                            style={{ cursor: "pointer", marginLeft: 4, opacity: 0.8 }}
                            onClick={() => {
                              const fullNode = findNodeInTree(node.id, ACCESS_TREE);
                              if (fullNode) {
                                const nextRestricted = toggleNodeCheck(fullNode, selectedAccess.restricted);
                                setSelectedAccess({
                                  ...selectedAccess,
                                  restricted: nextRestricted
                                });
                              }
                            }}
                          >
                            ✕
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search Bar & Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <input
                  className="cinput"
                  placeholder="Search by community, sub-community, or group..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)", marginBottom: 0 }}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    className="hbtn hbtn--ghost hbtn--sm"
                    onClick={selectAllNodes}
                    style={{ padding: "8px 12px", fontSize: 12, height: 38 }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="hbtn hbtn--ghost hbtn--sm"
                    onClick={clearAllNodes}
                    style={{ padding: "8px 12px", fontSize: 12, color: "#e5484d", height: 38 }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Tree View Container */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 12, background: "var(--bg)" }}>
                {ACCESS_TREE.map(node => renderTreeNode(node, 0))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ padding: 16, background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 12 }}>Define Access Rule</div>
                <div className="cfield" style={{ marginBottom: 12 }}>
                  <label>Select Community</label>
                  <select className="cselect" value={ruleCommunity} onChange={e => {
                    setRuleCommunity(e.target.value);
                    const list = getGroupsForCommunityName(e.target.value);
                    setRuleGroups([]);
                  }} style={{ background: "var(--surface)" }}>
                    {communitiesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cfield" style={{ marginBottom: 16 }}>
                  <label>Allowed Groups (Ctrl+Click to multi-select)</label>
                  <select
                    multiple
                    className="cselect"
                    value={ruleGroups}
                    onChange={e => setRuleGroups(Array.from(e.target.selectedOptions, (option: any) => option.value))}
                    style={{ background: "var(--surface)", height: 120 }}
                  >
                    {ruleGroupsList.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <button type="button" className="hbtn hbtn--primary hbtn--sm" onClick={handleAddRule} style={{ width: "100%" }}>
                  ➕ Add Access Rule
                </button>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8 }}>Active Rules</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                {selectedAccess.selectedMembers.map(rule => (
                  <div key={rule.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                    <div style={{ fontSize: 13, color: "var(--ink)" }}>
                      <span style={{ fontWeight: 600 }}>{rule.community}</span> → {rule.groups.join(", ")}
                    </div>
                    <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => handleRemoveRule(rule.id)} style={{ color: "#e5484d", border: "none" }}>✕</button>
                  </div>
                ))}
                {selectedAccess.selectedMembers.length === 0 && (
                  <div style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 13 }}>No rules defined yet.</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--bg-2)" }}>
          <button type="button" className="hbtn hbtn--primary" onClick={onClose}>Save &amp; Close</button>
        </div>
      </div>
    </div>
  );
}

const RECENT_LOCATIONS = [
  {
    name: "Delhi darbar hotel",
    address: "51, Jawahar Marg, Jhanda Chowk, Indore, Madhya Pradesh 452007, India",
  },
];

function LocationSection({ venue, setVenue, locType, setLocType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(venue);

  const commit = (value, type) => {
    setVenue(value);
    setLocType(type);
    setDraft(value);
    setIsOpen(false);
  };

  const handleInput = (e) => {
    setDraft(e.target.value);
    setVenue(e.target.value);
  };

  const displayTitle = venue || "Add Event Location";
  const displaySub =
    venue
      ? locType === "online"
        ? "Virtual event"
        : venue
      : "Offline location or virtual link";

  return (
    <div className="loc-sec-container">
      {/* Header (toggle button) */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="loc-sec-header"
      >
        <span className="loc-sec-icon-wrapper">
          <I.pin style={{ width: 18, height: 18, color: "var(--accent-2)" }} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--ink)", lineHeight: "1.2" }}>{displayTitle}</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displaySub}</p>
        </div>
        <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", color: "var(--ink-3)", display: "flex", alignItems: "center" }}>
          <I.chevD />
        </span>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="loc-sec-panel">
          {/* Input */}
          <div className="loc-sec-input-wrapper">
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  commit(draft.trim(), draft.startsWith("http") ? "online" : "physical");
                }
                if (e.key === "Escape") setIsOpen(false);
              }}
              placeholder="Enter location or virtual link..."
              className="cinput"
              style={{ width: "100%", background: "var(--field)", border: "1px solid var(--border)" }}
            />
          </div>

          {/* Recent Locations */}
          {RECENT_LOCATIONS.length > 0 && (
            <>
              <p className="loc-sec-label">Recent Locations</p>
              {RECENT_LOCATIONS.map((loc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => commit(loc.address, "physical")}
                  className="loc-sec-btn"
                >
                  <I.pin style={{ width: 15, height: 15, color: "var(--ink-3)", marginTop: 2, flexShrink: 0 }} />
                  <div className="loc-sec-btn-content">
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--ink)", lineHeight: "1.2" }}>{loc.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--ink-3)" }}>{loc.address}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          <hr style={{ border: "none", borderTop: "1px solid var(--border-2)", margin: "8px 16px" }} />

          {/* Virtual Options */}
          <p className="loc-sec-label">Virtual Options</p>
          <button
            type="button"
            onClick={() => commit("https://zoom.us/j/", "online")}
            className="loc-sec-btn"
            style={{ alignItems: "center" }}
          >
            <I.online style={{ width: 16, height: 16, color: "var(--accent-1)", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--ink)" }}>Create Zoom meeting</span>
          </button>
          <button
            type="button"
            onClick={() => commit("https://meet.google.com/", "online")}
            className="loc-sec-btn"
            style={{ alignItems: "center" }}
          >
            <I.online style={{ width: 16, height: 16, color: "var(--accent-2)", flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: "var(--ink)" }}>Create Google Meet</span>
          </button>

          {/* Hint */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px 16px", color: "var(--ink-3)", fontSize: "12px" }}>
            <span>💡</span>
            <span>If you have a virtual event link, you can enter or paste it above. Press <b>Enter</b> to save.</span>
          </div>
        </div>
      )}

      {venue && locType === "physical" && (
        <div style={{ marginTop: 12, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" }}>
          <iframe
            width="100%"
            height="180"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(venue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
            frameBorder="0"
            style={{ border: 0, display: "block" }}
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Create Event ---------------- */
const DEFAULT_FREE_ENTITLEMENTS = {
  group_max_groups: -1,
  group_allowed_visibility: ['unlisted'],
  group_allowed_join_modes: ['open', 'invite_only'],
  group_max_capacity: 25,
  group_can_restricted_access: false,
  event_allowed_registration_modes: ['free', 'cash'],
  event_allowed_visibility: ['unlisted', 'invite_only'],
  event_max_participants: 100,
  event_checkin_methods: ['scanner', 'manual', 'gate'],
  event_can_create_paid_tickets: false
};

function CreateEvent({ go, mobile, st }) {
  const entitlements = st?.entitlements || DEFAULT_FREE_ENTITLEMENTS;
  const allowedVisibilities = entitlements.event_allowed_visibility || ['unlisted', 'invite_only'];
  const eventMaxParticipants = entitlements.event_max_participants ?? 100;
  const canCreatePaidTickets = entitlements.event_can_create_paid_tickets ?? false;

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const triggerUpgrade = (feat) => {
    setUpgradeFeature(feat);
    setUpgradeModalOpen(true);
  };

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [cover, setCover] = useState("");
  const [visibility, setVisibility] = useState(allowedVisibilities.includes("public") ? "public" : "unlisted");
  const [calendar, setCalendar] = useState("Main Calendar");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState("UTC +05:30 India");
  const [locType, setLocType] = useState("physical");
  const [venue, setVenue] = useState("");
  const [desc, setDesc] = useState("");
  const [tzModalOpen, setTzModalOpen] = useState(false);
  const [tzSearchQuery, setTzSearchQuery] = useState("");

  const [type, setType] = useState(canCreatePaidTickets ? "paid" : "free");
  const [approval, setApproval] = useState(false);
  const [capacityEnabled, setCapacityEnabled] = useState(entitlements.event_max_participants !== -1);
  const [capacity, setCapacity] = useState(entitlements.event_max_participants !== -1 ? String(entitlements.event_max_participants) : "");
  const [waitlist, setWaitlist] = useState(false);
  const [tickets, setTickets] = useState([{ n: "Early Bird", cap: "50", price: "499" }]);

  const [tags, setTags] = useState(["Startup", "Technology"]);
  const [tagInput, setTagInput] = useState("");

  const [cat, setCat] = useState("Startups");
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [instModalOpen, setInstModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInstModalOpen, setAiInstModalOpen] = useState(false);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [joinEligibility, setJoinEligibility] = useState("public");
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState({
    restricted: {
      communities: [],
      subCommunities: [],
      groups: []
    },
    selectedMembers: []
  });

  // --- REGISTRATION FORM BUILDER STATES (Phase 3 Schema) ---
  const [enableRegForm, setEnableRegForm] = useState(false);
  const [formFields, setFormFields] = useState([
    { id: "f-1", type: "text", question: "What is your main area of interest?", required: true, responseType: "short" },
    { id: "f-2", type: "social", question: "LinkedIn Profile URL", required: true, platform: "linkedin" }
  ] as any[]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);

  // --- VISIBILITY STATES (Phase 2 Data-driven) ---
  // Data-driven custom visibility list from the user's hierarchy and permissions
  const creatorEntities = React.useMemo(() => {
    return [
      { id: "e-parent", name: "Samaagum Hub", type: "Community (Parent)" },
      ...(typeof GROUPS !== "undefined" ? GROUPS.map(g => ({ id: `grp-${g.id}`, name: g.name, type: "Group" })) : []),
      { id: "e-same", name: "Samaagum Developers", type: "Entity (Same-level)" }
    ];
  }, []);
  const [customEntities, setCustomEntities] = useState(["BLR Founders Collective"]);

  // --- SPONSORS STATES (Phase 4 Search / Debounce / Pagination) ---
  const [enableSponsors, setEnableSponsors] = useState(false);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState(["sp-1", "sp-3"]);
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState("");
  const [debouncedSponsorQuery, setDebouncedSponsorQuery] = useState("");
  const [sponsorVisibility, setSponsorVisibility] = useState("public");
  const [sponsorPage, setSponsorPage] = useState(1);
  const SPONSORS_PER_PAGE = 3;

  const ALL_SPONSORS = [
    { id: "sp-1", name: "Google Cloud", org: "Google Inc.", email: "sponsorship@google.com" },
    { id: "sp-2", name: "Vercel", org: "Vercel Inc.", email: "sponsor@vercel.com" },
    { id: "sp-3", name: "GitHub Enterprise", org: "GitHub Inc.", email: "partner@github.com" },
    { id: "sp-4", name: "Stripe India", org: "Stripe", email: "stripe-sponsorship@stripe.com" },
    { id: "sp-5", name: "Figma India", org: "Figma", email: "sponsors@figma.com" },
  ];

  // Debounce effect for sponsor search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSponsorQuery(sponsorSearchQuery);
      setSponsorPage(1); // Reset page on query change
    }, 300);
    return () => clearTimeout(handler);
  }, [sponsorSearchQuery]);

  // --- BANNER UPLOAD STATES & MOCK VALIDATIONS (Phase 2) ---
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) validateAndProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingBanner(true);
  };

  const handleDragLeave = () => {
    setIsDraggingBanner(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndProcessFile = async (file) => {
    // 1. Client-Side Validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setBannerError("Client Validation Error: Invalid format. Please use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError("Client Validation Error: File size exceeds 5MB limit.");
      return;
    }

    setBannerError("");
    setIsUploadingBanner(true);

    try {
      // 2. Simulated Server-Side Validation via Mock API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const serverMimeCheck = allowedTypes.includes(file.type);
      if (!serverMimeCheck) {
        throw new Error("Server Validation Error: File binary signature does not match allowed image MIME types.");
      }

      const reader = new FileReader();
      reader.onload = () => {
        setCover(reader.result);
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setBannerError((err as any).message);
      setIsUploadingBanner(false);
    }
  };

  // --- REGISTRATION FORM ACTIONS (Phase 3) ---
  const addField = (type) => {
    const id = "f-" + Date.now();
    let newField: any = { id, type, question: "", required: true };
    if (type === "text") {
      newField.question = "Short Question Label";
      newField.responseType = "short";
    } else if (type === "options") {
      newField.question = "Select an option";
      newField.options = ["Option 1", "Option 2"];
      newField.selectionType = "single";
    } else if (type === "social") {
      newField.question = "Profile Link";
      newField.platform = "linkedin";
    } else if (type === "company") {
      newField.question = "Work details";
      newField.collectJobTitle = true;
    } else if (type === "checkbox") {
      newField.question = "I agree to the terms";
    } else if (type === "terms") {
      newField.question = "Agreement Details";
      newField.termsText = "Please agree to our terms of conduct.";
      newField.termsLinks = "https://samaagum.co/terms";
      newField.showTextBeforeAccept = true;
      newField.collectSignature = false;
    } else if (type === "phone") {
      newField.question = "Contact Number";
    } else if (type === "website") {
      newField.question = "Website / Portfolio";
    }
    setFormFields([...formFields, newField]);
    setActiveFieldId(id);
  };

  const deleteField = (id) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const editField = (id: string, updates: any) => {
    setFormFields(formFields.map((f: any) => f.id === id ? { ...f, ...updates } : f));
  };

  const moveField = (index, direction) => {
    const nextFields = [...formFields];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < nextFields.length) {
      const temp = nextFields[index];
      nextFields[index] = nextFields[targetIndex];
      nextFields[targetIndex] = temp;
      setFormFields(nextFields);
    }
  };

  // Basic auto-slug generator when title changes
  useEffect(() => {
    if (title && (!slug || slug === title.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  }, [title]);

  const setTk = (i, key, v) => setTickets(ts => ts.map((t, j) => j === i ? { ...t, [key]: v } : t));

  const previewEv = {
    cover, cat, type: type === "free" ? "Free" : "Paid", online: locType === "online",
    month: "JUN", day: "18", title: title || "Your event title",
    date: startDate || "Date TBD", time: startTime ? format24to12(startTime) : "Time TBD",
    venue: locType === "online" ? "Online" : (venue || "Venue TBD"),
    going: 0, price: type === "paid" ? `₹${tickets[0]?.price || "—"}` : "Free", attendees: [],
  };

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: mobile ? "16px" : "18px",
    marginBottom: mobile ? "14px" : "16px",
    boxShadow: "var(--sh-sm)"
  };

  const completeness = [title, startDate, venue, desc, cover].filter(Boolean).length;
  const pct = Math.round((completeness / 5) * 100);

  // --- RENDER DYNAMIC SCROLLABLE PREVIEW PANEL (Phase 1) ---
  const renderPreviewPanel = (isMobileStacked = false) => {
    return (
      <div
        className={isMobileStacked ? "mobile-preview-stacked" : "create-preview"}
        style={isMobileStacked ? {
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          borderTop: "1px solid var(--border-2)",
          marginTop: "32px"
        } : {
          position: "sticky",
          top: 0,
          height: "100vh",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          overflowY: "auto",
          borderLeft: "1px solid var(--border-2)",
          background: "var(--bg-2)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div className="pv-label" style={{ marginBottom: 0 }}><span className="d" />Live preview</div>
          <div style={{ display: "flex", gap: 4, background: "var(--border)", padding: 4, borderRadius: 999 }}>
            <button style={{ padding: "4px 12px", fontSize: 12, fontWeight: 600, background: "var(--surface)", borderRadius: 999, border: "none", boxShadow: "var(--sh-sm)" }}>Card</button>
            <button style={{ padding: "4px 12px", fontSize: 12, fontWeight: 600, background: "transparent", borderRadius: 999, border: "none", color: "var(--ink-2)" }}>Mobile</button>
          </div>
        </div>

        {/* Scrollable preview inner area */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>



          <EventCard ev={previewEv} onOpen={() => { }} saved={false} onSave={() => { }} />

          {/* Visibility Preview */}
          <div style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>Visibility Preview</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              Mode: <span style={{ textTransform: "capitalize", color: "var(--accent-2)" }}>{visibility}</span>
            </div>
            {visibility === "custom" && (
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-2)" }}>
                Visible to: {customEntities.filter(c => customEntities.includes(c)).join(", ") || "None"}
              </div>
            )}
          </div>

          {/* Registration Form Preview */}
          {enableRegForm && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 }}>Registration Form Preview</div>
              {formFields.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>No questions added yet. Default fields (Name, Email) will be collected.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {formFields.map((field, idx) => (
                    <div key={field.id} style={{ borderBottom: idx < formFields.length - 1 ? "1px solid var(--border-2)" : "none", paddingBottom: idx < formFields.length - 1 ? 12 : 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                        {field.question || "Untitled Question"} {field.required && <span style={{ color: "#e5484d" }}>*</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
                        Type: {field.type}
                      </div>
                      {field.type === "text" && (
                        <input className="cinput" readOnly placeholder={field.responseType === "paragraph" ? "Long answer text..." : "Short answer text..."} style={{ background: "var(--bg-2)", fontSize: 12, padding: "8px 12px" }} />
                      )}
                      {field.type === "options" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {(field.options || []).map((opt, oIdx) => (
                            <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-2)" }}>
                              <input type={field.selectionType === "multiple" ? "checkbox" : "radio"} disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {field.type === "social" && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 10, background: "var(--border)", padding: "3px 6px", borderRadius: 4, color: "var(--ink-2)" }}>
                            {field.platform === "any" ? "Any URL" : field.platform.toUpperCase()}
                          </span>
                          <input className="cinput" readOnly placeholder="Profile URL" style={{ background: "var(--bg-2)", fontSize: 11, padding: "6px 10px", flex: 1 }} />
                        </div>
                      )}
                      {field.type === "company" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <input className="cinput" readOnly placeholder="Company Name" style={{ background: "var(--bg-2)", fontSize: 11, padding: "6px 10px" }} />
                          {field.collectJobTitle && (
                            <input className="cinput" readOnly placeholder="Job Title" style={{ background: "var(--bg-2)", fontSize: 11, padding: "6px 10px" }} />
                          )}
                        </div>
                      )}
                      {field.type === "checkbox" && (
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--ink-2)" }}>
                          <input type="checkbox" disabled />
                          <span>{field.question || "Tick this box"}</span>
                        </label>
                      )}
                      {field.type === "terms" && (
                        <div style={{ padding: 8, background: "var(--bg-2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 11, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{field.termsText}</div>
                          {field.termsLinks && (
                            <a href={field.termsLinks} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "var(--accent-2)", textDecoration: "underline", display: "block", marginTop: 4 }}>
                              View Terms Link
                            </a>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <input type="checkbox" disabled />
                            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>I accept the terms</span>
                          </div>
                        </div>
                      )}
                      {field.type === "phone" && (
                        <input className="cinput" readOnly placeholder="+1 (555) 000-0000" style={{ background: "var(--bg-2)", fontSize: 12, padding: "8px 12px" }} />
                      )}
                      {field.type === "website" && (
                        <input className="cinput" readOnly placeholder="https://yourwebsite.com" style={{ background: "var(--bg-2)", fontSize: 12, padding: "8px 12px" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sponsors Preview */}
          {enableSponsors && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 }}>Sponsors Preview</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
                Visibility: <span style={{ textTransform: "capitalize", color: "var(--accent-2)" }}>{sponsorVisibility}</span>
              </div>
              {selectedSponsorIds.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" }}>No sponsors selected.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                  {selectedSponsorIds.map(id => {
                    const sp = ALL_SPONSORS.find(s => s.id === id);
                    return sp ? (
                      <div key={sp.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{sp.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Completeness Progress Card */}
          <div style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", boxShadow: "var(--sh-sm)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 16 }}>Event Completeness ({pct}%)</div>
            <div style={{ height: 6, background: "var(--border)", borderRadius: 999, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--accent-2)", borderRadius: 999 }}></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: title ? "var(--ink)" : "var(--ink-3)" }}><I.check style={{ color: title ? "var(--accent-2)" : "var(--ink-3)", width: 14 }} /> Title </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: startDate ? "var(--ink)" : "var(--ink-3)" }}><I.check style={{ color: startDate ? "var(--accent-2)" : "var(--ink-3)", width: 14 }} /> Date & Time</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: venue ? "var(--ink)" : "var(--ink-3)" }}><I.check style={{ color: venue ? "var(--accent-2)" : "var(--ink-3)", width: 14 }} /> Location</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: desc ? "var(--ink)" : "var(--ink-3)" }}><I.check style={{ color: desc ? "var(--accent-2)" : "var(--ink-3)", width: 14 }} /> Description</div>
            </div>

          </div>
          <br></br>
          <br></br>
          <br></br><br></br><br></br><br></br><br></br>

        </div>
      </div>
    );
  };

  return (
    <div className={`create ${mobile ? "single" : ""}`}>
      <style>{`
        .create {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: stretch;
          background: var(--bg-2);
        }

        .create.single {
          display: block;
        }

        .create-form {
          flex: 1 1 auto;
          width: 100%;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .create-form * {
          box-sizing: border-box;
        }

        .cf-inner {
          width: 100%;
        }

        .create-head h1 {
          margin: 2px 0 0;
          font-size: 28px;
          line-height: 1.15;
        }

        .create-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--r-xl);
          padding: 24px;
          box-shadow: var(--sh-md);
        }

        @media (min-width: 769px) {
          .create-container {
            grid-template-columns: 1fr 3fr;
            padding: 32px;
            gap: 32px;
          }
          .banner-section {
            grid-column: 1;
            grid-row: 1;
            position: sticky;
            top: 24px;
            align-self: start;
          }
          .form-section {
            grid-column: 2;
            grid-row: 1;
          }
        }

        @media (max-width: 768px) {
          .create-container {
            grid-template-columns: 1fr;
            padding: 20px 16px;
            gap: 24px;
          }
          .banner-section {
            order: -1;
          }
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .form-group-section {
          border-bottom: 1px solid var(--border-2);
          padding-bottom: 24px;
        }

        .form-group-section:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .form-group-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .banner-square-container {
          width: 100%;
          aspect-ratio: 1 / 1;
          position: relative;
        }

        .schedule-card {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          width: 100%;
        }

        .schedule-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .schedule-row {
          display: grid;
          grid-template-columns: 80px 1fr 110px;
          align-items: center;
          background: var(--field);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
        }

        .schedule-label {
          padding: 16px;
          font-weight: 600;
          color: var(--ink-2);
          font-size: 14px;
        }

        .schedule-label.active {
          color: var(--accent-2);
        }

        .schedule-row input[type="date"] {
          border: none;
          border-left: 1px solid var(--border);
          border-right: 1px solid var(--border);
          background: transparent;
          padding: 16px;
          font-size: 14px;
          color: var(--ink);
          font-family: inherit;
          outline: none;
          height: 100%;
          min-width: 0;
        }

        .timezone-card {
          width: 170px;
          background: var(--field);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: border-color 0.2s, background-color 0.2s;
        }
        
        .timezone-card:hover {
          border-color: var(--accent-2);
          background: var(--accent-soft);
        }

        .eligibility-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .eligibility-card {
          border: 1.5px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.2s ease;
          background: var(--surface);
          text-align: left;
        }

        .eligibility-card:hover {
          border-color: var(--accent-2);
          background: var(--bg-2);
          transform: translateY(-1px);
        }

        .eligibility-card.active {
          border-color: var(--accent-2);
          background: var(--accent-soft);
          box-shadow: 0 0 0 1px var(--accent-2);
        }

        .eligibility-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .eligibility-desc {
          font-size: 12px;
          color: var(--ink-3);
          line-height: 1.4;
        }

        .tz-main {
          font-weight: 700;
          color: var(--ink);
          font-size: 14px;
        }

        .tz-city {
          color: var(--ink-3);
          font-size: 13px;
          margin-top: 4px;
        }

        @media (max-width: 768px) {
          .create-form {
            min-height: 100vh;
          }

          .create-head h1 {
            font-size: 24px;
          }

          .schedule-card {
            flex-direction: column;
            gap: 10px;
          }

          .timezone-card {
            width: 100%;
          }

          .schedule-row {
            grid-template-columns: 1fr;
          }
          
          .schedule-row input[type="date"] {
            border: none;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 12px 16px;
          }
        }

        .loc-sec-container {
          border: 1px solid var(--border);
          border-radius: var(--r-md);
          overflow: hidden;
          background: var(--surface);
          box-shadow: var(--sh-sm);
        }
        .loc-sec-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--field);
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }
        .loc-sec-header:hover {
          background: var(--border-2);
        }
        .loc-sec-icon-wrapper {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .loc-sec-panel {
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        .loc-sec-input-wrapper {
          padding: 16px;
        }
        .loc-sec-label {
          padding: 12px 16px 4px;
          color: var(--ink-3);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .loc-sec-btn {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 16px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .loc-sec-btn:hover {
          background: var(--field);
        }
        .loc-sec-btn-content {
          display: flex;
          flex-direction: column;
          text-align: left;
        }
        .summary-chip:hover {
          border-color: var(--accent-2);
          background: var(--accent-soft);
        }
      `}</style>
      <div className="create-form" style={{ backgroundColor: "var(--bg-2)", padding: mobile ? "14px 12px 110px" : "24px 32px 110px", position: "relative" }}>
        <div className="cf-inner" style={{ maxWidth: 1080, margin: "0 auto" }}>

          <div className="create-head" style={{ marginBottom: 20 }}>
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding: "7px 11px", background: "var(--surface)" }}><I.arrowL /></button>
            <div><div className="ck">New event</div><h1>Create an event</h1></div>
          </div>

          <div className="create-container">
            {/* Left Side: Form */}
            <div className="form-section">

              {/* Group 1: Basic Information */}
              <div className="form-group-section">
                {/* <h3 className="form-group-title">📝 Basic Information</h3> */}
                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="cfield" style={{ marginBottom: 0, gridColumn: mobile ? "auto" : "span 2" }}>
                    <label>Event Name</label>
                    <input className="title-input" placeholder="What's your event called?" value={title} onChange={e => setTitle(e.target.value)} style={{ background: "var(--field)", border: "1px solid var(--border)", fontSize: 15, height: 42, padding: "0 12px", width: "100%" }} />
                  </div>

                  <div className="cfield" style={{ marginBottom: 0 }}>
                    <label>Visibility</label>
                    <select
                      className="cselect"
                      value={visibility}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "public" && !allowedVisibilities.includes("public")) {
                          triggerUpgrade("Public Event Visibility");
                          return;
                        }
                        setVisibility(val);
                        if (val === "custom") {
                          setAccessModalOpen(true);
                        }
                      }}
                      style={{ background: "var(--field)", border: "1px solid var(--border)", height: 42 }}
                    >
                      <option value="public">{!allowedVisibilities.includes("public") && "🔒 "}Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="custom">Custom Access</option>
                    </select>
                  </div>

                  <div className="cfield" style={{ marginBottom: 0 }}>
                    <label>Category</label>
                    <select
                      className="cselect"
                      value={cat}
                      onChange={(e) => setCat(e.target.value)}
                      style={{ background: "var(--field)", border: "1px solid var(--border)", height: 42 }}
                    >
                      <option value="Startups">Startups</option>
                      <option value="Technology">Technology</option>
                      <option value="Design">Design</option>
                      <option value="Social">Social</option>
                      <option value="Workshops">Workshops</option>
                    </select>
                  </div>
                </div>

                {visibility === "custom" && (
                  <div style={{ marginBottom: 16, padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)" }}>Custom Visible Entities</span>
                      <button
                        type="button"
                        className="hbtn hbtn--ghost hbtn--sm"
                        onClick={() => setAccessModalOpen(true)}
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        Configure Access
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).map(entity => {
                        const icon = entity.type === "community" ? "🏛️" : entity.type === "subcommunity" ? "📁" : "👥";
                        return (
                          <span
                            key={entity.id}
                            onClick={() => setAccessModalOpen(true)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "var(--accent-soft)",
                              color: "var(--accent-2)",
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "6px 12px",
                              borderRadius: 999,
                              cursor: "pointer"
                            }}
                          >
                            <span>{icon}</span>
                            <span>{entity.name}</span>
                          </span>
                        );
                      })}
                      {getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).length === 0 && (
                        <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
                          No visible entities selected yet. Click "Configure Access" to customize.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="cfield" style={{ marginBottom: 0 }}>
                  <label>Event Description</label>
                  <div
                    style={{ minHeight: 64, background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 16px", color: desc ? "var(--ink)" : "var(--ink-3)", cursor: "pointer", fontSize: 14 }}
                    onClick={() => setDescModalOpen(true)}
                  >
                    {desc ? desc : "Click to open editor. Tell people what to expect — the vibe, who it's for, what they'll leave with."}
                  </div>
                </div>
              </div>

              {/* Group 2: Schedule */}
              <div className="form-group-section">
                {/* <h3 className="form-group-title">📅 Schedule</h3> */}
                <div className="schedule-card" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div className="schedule-left" style={{ flex: "1 1 300px" }}>
                    <div className="schedule-row" style={{ height: 48 }}>
                      <div className={`schedule-label ${startDate || startTime ? "active" : ""}`} style={{ padding: "0 12px", display: "flex", alignItems: "center" }}>
                        ● Start
                      </div>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStartDate(val);
                          if (!endDate || endDate < val) {
                            setEndDate(val);
                          }
                        }}
                        style={{ height: "100%", padding: "0 12px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
                      />
                      <TimePicker
                        value={startTime}
                        onChange={(time) => {
                          setStartTime(time);
                          if (time) {
                            setEndTime(addOneHour(time));
                          }
                        }}
                        mobile={mobile}
                        compact={true}
                      />
                    </div>

                    <div className="schedule-row" style={{ height: 48, marginTop: 12 }}>
                      <div className="schedule-label" style={{ padding: "0 12px", display: "flex", alignItems: "center" }}>
                        ○ End
                      </div>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ height: "100%", padding: "0 12px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
                      />
                      <TimePicker
                        value={endTime}
                        onChange={setEndTime}
                        mobile={mobile}
                        compact={true}
                      />
                    </div>

                    {getDurationText(startDate, startTime, endDate, endTime) && (
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}>
                        ⏱️ <span style={{ fontWeight: 600 }}>Duration:</span> {getDurationText(startDate, startTime, endDate, endTime)}
                      </div>
                    )}
                  </div>

                  {(() => {
                    const tzInfo = getTzInfo(timezone);
                    return (
                      <div className="timezone-card" onClick={() => setTzModalOpen(true)} style={{ cursor: "pointer", height: 108, width: mobile ? "100%" : 180, boxSizing: "border-box" }}>
                        <I.globe style={{ color: "var(--accent-2)", width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div className="tz-main">{tzInfo.main}</div>
                          <div className="tz-city">{tzInfo.city}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Group 3: Location */}
              <div className="form-group-section">
                {/* <h3 className="form-group-title">📍 Location</h3> */}
                <LocationSection
                  venue={venue}
                  setVenue={setVenue}
                  locType={locType}
                  setLocType={setLocType}
                />
              </div>

              {/* Group 4: Access & Registration */}
              <div className="form-group-section">
                <h3 className="form-group-title">🔒 Access & Registration</h3>

                {/* Join Eligibility Options */}
                <div className="cfield" style={{ marginBottom: 16 }}>
                  <label>Join Eligibility</label>
                  <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => setJoinEligibility("public")}
                      style={{
                        padding: "12px",
                        borderRadius: "var(--r-md)",
                        border: joinEligibility === "public" ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                        background: joinEligibility === "public" ? "var(--accent-soft)" : "var(--field)",
                        color: "var(--ink)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    >
                      🌐 Public Event
                      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 }}>Anyone can view and register for this event.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setJoinEligibility("restricted");
                        setAccessModalOpen(true);
                      }}
                      style={{
                        padding: "12px",
                        borderRadius: "var(--r-md)",
                        border: joinEligibility === "restricted" ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                        background: joinEligibility === "restricted" ? "var(--accent-soft)" : "var(--field)",
                        color: "var(--ink)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    >
                      👥 Restrict to Community
                      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 }}>Only members of selected communities or groups can join.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoinEligibility("invite")}
                      style={{
                        padding: "12px",
                        borderRadius: "var(--r-md)",
                        border: joinEligibility === "invite" ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                        background: joinEligibility === "invite" ? "var(--accent-soft)" : "var(--field)",
                        color: "var(--ink)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        outline: "none",
                        fontFamily: "inherit"
                      }}
                    >
                      ✉️ Invite Only
                      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 }}>Only invited guests can register for this event.</div>
                    </button>
                  </div>
                </div>

                {joinEligibility === "restricted" && (
                  <div style={{ marginBottom: 16, padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginTop: -4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Allowed Communities & Groups</span>
                      <button
                        type="button"
                        className="hbtn hbtn--ghost hbtn--sm"
                        onClick={() => setAccessModalOpen(true)}
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        ⚙️ Configure
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).map(entity => {
                        const icon = entity.type === "community" ? "🏛️" : entity.type === "subcommunity" ? "📁" : "👥";
                        return (
                          <span
                            key={entity.id}
                            onClick={() => setAccessModalOpen(true)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: "var(--accent-soft)",
                              color: "var(--accent-2)",
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "6px 12px",
                              borderRadius: 999,
                              cursor: "pointer"
                            }}
                          >
                            <span>{icon}</span>
                            <span>{entity.name}</span>
                          </span>
                        );
                      })}
                      {getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).length === 0 && (
                        <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" }}>
                          No communities or groups selected yet. Click "Configure" to select.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "16px", marginBottom: 20 }}>
                  <div style={{ padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ticket Price</div>
                    <select 
                      className="cselect" 
                      value={type} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "paid" && !canCreatePaidTickets) {
                          triggerUpgrade("Paid Events / Tickets");
                          return;
                        }
                        setType(val);
                      }} 
                      style={{ background: "var(--surface)", height: 36, padding: "6px" }}
                    >
                      <option value="free">Free</option>
                      <option value="paid">{!canCreatePaidTickets && "🔒 "}Paid</option>
                    </select>
                  </div>
                  <div style={{ padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Require Approval</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 36 }}>
                      <Toggle on={approval} onClick={() => setApproval(v => !v)} />
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{approval ? "On" : "Off"}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 12,
                      background: "var(--field)",
                      borderRadius: "var(--r-md)",
                      border: "1px solid var(--border)",
                      cursor: capacityEnabled ? "pointer" : "default"
                    }}
                    onClick={() => {
                      if (capacityEnabled) {
                        setCapacityModalOpen(true);
                      }
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Capacity Limit</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 36 }}>
                      <Toggle
                        on={capacityEnabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (capacityEnabled && eventMaxParticipants !== -1) {
                            triggerUpgrade("Unlimited Event Capacity");
                            return;
                          }
                          const next = !capacityEnabled;
                          setCapacityEnabled(next);
                          if (next) {
                            setCapacityModalOpen(true);
                          }
                        }}
                      />
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{capacityEnabled ? "Limited" : "Unlimited"}</span>
                    </div>
                    {capacityEnabled && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-2)" }}>
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>{capacity || "—"} Attendees</span> | {waitlist ? "Waitlist On" : "Waitlist Off"}
                      </div>
                    )}
                  </div>
                </div>

                {type === "paid" && (
                  <div className="cfield" style={{ marginBottom: 16 }}>
                    <label>Ticket Tiers</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, paddingLeft: 2 }}>
                      <div style={{ flex: 2, fontSize: 11, fontWeight: 600, color: "var(--ink-2)" }}>Ticket Type</div>
                      <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--ink-2)" }}>Quantity</div>
                      <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--ink-2)" }}>Price</div>
                      {tickets.length > 1 && <div style={{ width: 36 }} />}
                    </div>
                    {tickets.map((t, i) => (
                      <div key={i} className="ticket-row" style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                        <input className="cinput" placeholder="Tier name" value={t.n} onChange={e => setTk(i, "n", e.target.value)} style={{ flex: 2 }} />
                        <input className="cinput" placeholder="Qty" value={t.cap} onChange={e => setTk(i, "cap", e.target.value)} style={{ flex: 1 }} />
                        <input className="cinput" placeholder="₹ Price" value={t.price} onChange={e => setTk(i, "price", e.target.value)} style={{ flex: 1 }} />
                        {tickets.length > 1 && <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setTickets(ts => ts.filter((_, j) => j !== i))} style={{ padding: "0 10px", height: 42 }}><I.x /></button>}
                      </div>
                    ))}
                    <button className="add-row" onClick={() => setTickets(ts => [...ts, { n: "", cap: "", price: "" }])} style={{ marginTop: 8 }}><I.plus />Add ticket type</button>
                  </div>
                )}

                {/* Registration Form Builder Toggle & Embed */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, background: "var(--field)", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Enable Registration Form</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Ask custom questions and collect attendee details.</div>
                    </div>
                    <Toggle on={enableRegForm} onClick={() => setEnableRegForm(v => !v)} />
                  </div>

                  {enableRegForm && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", animation: "slideDown 0.3s ease-out" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Custom Questions</span>
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            className="hbtn hbtn--primary hbtn--sm"
                            onClick={() => setShowAddFieldMenu(prev => !prev)}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", fontSize: 11 }}
                          >
                            <I.plus /> Add Field
                          </button>
                          {showAddFieldMenu && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                zIndex: 10,
                                width: "180px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--r-md)",
                                boxShadow: "var(--sh-lg)",
                                padding: "4px",
                                marginTop: "6px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px"
                              }}
                            >
                              {[
                                { type: "text", label: "📝 Text Question" },
                                { type: "options", label: "🔘 Choice Options" },
                                { type: "social", label: "🌐 Social Profile" },
                                { type: "company", label: "🏢 Company Info" },
                                { type: "checkbox", label: "☑️ Single Checkbox" },
                                { type: "terms", label: "📜 Terms & Conditions" },
                                { type: "phone", label: "📞 Phone Number" },
                                { type: "website", label: "🔗 Website URL" },
                              ].map(item => (
                                <button
                                  key={item.type}
                                  className="hbtn hbtn--ghost hbtn--sm"
                                  style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", padding: "6px 10px", fontSize: 11, border: "none" }}
                                  onClick={() => {
                                    addField(item.type);
                                    setShowAddFieldMenu(false);
                                  }}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Render fields */}
                      {formFields.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "16px", border: "1.5px dashed var(--border)", borderRadius: "var(--r-md)", color: "var(--ink-3)", fontSize: 12 }}>
                          Default fields (Name, Email) will be collected.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {formFields.map((field, index) => {
                            const isActive = activeFieldId === field.id;
                            return (
                              <div
                                key={field.id}
                                style={{
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--r-md)",
                                  background: isActive ? "var(--bg-2)" : "var(--surface)",
                                  padding: "12px",
                                  transition: "all 0.2s ease"
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isActive ? 12 : 0 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)" }}>
                                    Question #{index + 1}: {field.type.toUpperCase()}
                                  </span>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    <button
                                      disabled={index === 0}
                                      className="hbtn hbtn--ghost hbtn--sm"
                                      style={{ padding: "4px 8px", minWidth: 0, opacity: index === 0 ? 0.4 : 1, border: "none" }}
                                      onClick={() => moveField(index, -1)}
                                    >
                                      ▲
                                    </button>
                                    <button
                                      disabled={index === formFields.length - 1}
                                      className="hbtn hbtn--ghost hbtn--sm"
                                      style={{ padding: "4px 8px", minWidth: 0, opacity: index === formFields.length - 1 ? 0.4 : 1, border: "none" }}
                                      onClick={() => moveField(index, 1)}
                                    >
                                      ▼
                                    </button>
                                    <button
                                      className="hbtn hbtn--ghost hbtn--sm"
                                      style={{ padding: "4px 8px", minWidth: 0, border: "none" }}
                                      onClick={() => setActiveFieldId(isActive ? null : field.id)}
                                    >
                                      {isActive ? "Collapse" : "✏️ Edit"}
                                    </button>
                                    <button
                                      className="hbtn hbtn--ghost hbtn--sm"
                                      style={{ padding: "4px 8px", minWidth: 0, color: "#e5484d", border: "none" }}
                                      onClick={() => deleteField(field.id)}
                                    >
                                      ❌ Remove
                                    </button>
                                  </div>
                                </div>

                                {!isActive && (
                                  <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 6 }}>
                                    <div style={{ fontWeight: 600 }}>{field.question || "(Empty question text)"}</div>
                                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                                      {field.required ? "Required" : "Optional"}
                                      {field.type === "options" && ` • ${(field.options || []).length} options`}
                                    </div>
                                  </div>
                                )}

                                {isActive && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid var(--border-2)", paddingTop: 12 }}>
                                    <div className="cfield" style={{ marginBottom: 0 }}>
                                      <label>{field.type === "terms" ? "Terms Title" : "Question / Label"}</label>
                                      <input
                                        className="cinput"
                                        value={field.question}
                                        onChange={e => editField(field.id, { question: e.target.value })}
                                        placeholder="e.g. Enter details..."
                                      />
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
                                      <input
                                        type="checkbox"
                                        id={`req-${field.id}`}
                                        checked={field.required}
                                        onChange={e => editField(field.id, { required: e.target.checked })}
                                        style={{ cursor: "pointer" }}
                                      />
                                      <label htmlFor={`req-${field.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
                                        Required Question
                                      </label>
                                    </div>

                                    {field.type === "text" && (
                                      <div className="cfield" style={{ marginBottom: 0 }}>
                                        <label>Response Type</label>
                                        <select
                                          className="cselect"
                                          value={field.responseType}
                                          onChange={e => editField(field.id, { responseType: e.target.value })}
                                        >
                                          <option value="short">Short text field</option>
                                          <option value="paragraph">Paragraph text area</option>
                                        </select>
                                      </div>
                                    )}

                                    {field.type === "options" && (
                                      <>
                                        <div className="cfield" style={{ marginBottom: 0 }}>
                                          <label>Choices Options (one option per line)</label>
                                          <textarea
                                            className="ctext"
                                            style={{ minHeight: 70 }}
                                            value={(field.options || []).join("\n")}
                                            onChange={e => editField(field.id, { options: e.target.value.split("\n").filter(Boolean) })}
                                            placeholder="Option A&#10;Option B"
                                          />
                                        </div>
                                        <div className="cfield" style={{ marginBottom: 0 }}>
                                          <label>Selection Type</label>
                                          <select
                                            className="cselect"
                                            value={field.selectionType}
                                            onChange={e => editField(field.id, { selectionType: e.target.value })}
                                          >
                                            <option value="single">Single Select (Radio Buttons)</option>
                                            <option value="multiple">Multi Select (Checkboxes)</option>
                                          </select>
                                        </div>
                                      </>
                                    )}

                                    {field.type === "social" && (
                                      <div className="cfield" style={{ marginBottom: 0 }}>
                                        <label>Social Platform Profile</label>
                                        <select
                                          className="cselect"
                                          value={field.platform}
                                          onChange={e => editField(field.id, { platform: e.target.value })}
                                        >
                                          <option value="linkedin">LinkedIn</option>
                                          <option value="twitter">Twitter / X</option>
                                          <option value="github">GitHub</option>
                                          <option value="any">Any Profile URL</option>
                                        </select>
                                      </div>
                                    )}

                                    {field.type === "company" && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
                                        <input
                                          type="checkbox"
                                          id={`company-job-${field.id}`}
                                          checked={field.collectJobTitle}
                                          onChange={e => editField(field.id, { collectJobTitle: e.target.checked })}
                                          style={{ cursor: "pointer" }}
                                        />
                                        <label htmlFor={`company-job-${field.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>
                                          Collect Job Title
                                        </label>
                                      </div>
                                    )}

                                    {field.type === "terms" && (
                                      <>
                                        <div className="cfield" style={{ marginBottom: 0 }}>
                                          <label>Terms Body Text</label>
                                          <textarea
                                            className="ctext"
                                            style={{ minHeight: 70 }}
                                            value={field.termsText || ""}
                                            onChange={e => editField(field.id, { termsText: e.target.value })}
                                            placeholder="Enter terms guidelines..."
                                          />
                                        </div>
                                        <div className="cfield" style={{ marginBottom: 0 }}>
                                          <label>External Document Links (Optional)</label>
                                          <input
                                            className="cinput"
                                            value={field.termsLinks || ""}
                                            onChange={e => editField(field.id, { termsLinks: e.target.value })}
                                            placeholder="https://yoursite.com/privacy"
                                          />
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
                                          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                                            <input
                                              type="checkbox"
                                              checked={field.showTextBeforeAccept}
                                              onChange={e => editField(field.id, { showTextBeforeAccept: e.target.checked })}
                                            />
                                            <span>Show Text Before Accept</span>
                                          </label>
                                          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                                            <input
                                              type="checkbox"
                                              checked={field.collectSignature}
                                              onChange={e => editField(field.id, { collectSignature: e.target.checked })}
                                            />
                                            <span>Collect Digital Signature</span>
                                          </label>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sponsors section */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, background: "var(--field)", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Enable Sponsors</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Promote organizations and display logos.</div>
                    </div>
                    <Toggle on={enableSponsors} onClick={() => setEnableSponsors(v => !v)} />
                  </div>

                  {enableSponsors && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", animation: "slideDown 0.3s ease-out" }}>
                      <div style={{ borderBottom: "1px solid var(--border-2)", paddingBottom: 16, marginBottom: 18 }}>
                        <div className="cfield" style={{ marginTop: 0, marginBottom: 0 }}>
                          <label>Sponsor Visibility Mode</label>
                          <select
                            className="cselect"
                            value={sponsorVisibility}
                            onChange={e => setSponsorVisibility(e.target.value)}
                            style={{ background: "var(--surface)" }}
                          >
                            <option value="public">Public (Visible to all potential sponsors)</option>
                            <option value="private">Private (Visible only to selected sponsors)</option>
                            <option value="invited">Invited Only (Visible only to direct invites)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.1fr 1fr", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Available Sponsors Network</div>
                          <input
                            className="cinput"
                            placeholder="Search sponsors..."
                            value={sponsorSearchQuery}
                            onChange={e => setSponsorSearchQuery(e.target.value)}
                            style={{ padding: "8px 12px", background: "var(--bg-2)" }}
                          />

                          <div style={{
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-md)",
                            background: "var(--surface)",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "6px"
                          }}>
                            {(() => {
                              const filtered = ALL_SPONSORS.filter(sp => {
                                if (selectedSponsorIds.includes(sp.id)) return false;
                                if (!debouncedSponsorQuery) return true;
                                const q = debouncedSponsorQuery.toLowerCase();
                                return (
                                  sp.name.toLowerCase().includes(q) ||
                                  sp.org.toLowerCase().includes(q) ||
                                  sp.email.toLowerCase().includes(q)
                                );
                              });

                              const totalPages = Math.ceil(filtered.length / SPONSORS_PER_PAGE);
                              const paginated = filtered.slice(
                                (sponsorPage - 1) * SPONSORS_PER_PAGE,
                                sponsorPage * SPONSORS_PER_PAGE
                              );

                              return (
                                <>
                                  {paginated.map(sp => (
                                    <div
                                      key={sp.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "6px 8px",
                                        borderRadius: 6,
                                        borderBottom: "1px solid var(--bg-2)"
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{sp.name}</div>
                                        <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{sp.org}</div>
                                      </div>
                                      <button
                                        className="hbtn hbtn--ghost hbtn--sm"
                                        style={{ border: "1px solid var(--border)", padding: "2px 6px", fontSize: 11 }}
                                        onClick={() => setSelectedSponsorIds([...selectedSponsorIds, sp.id])}
                                      >
                                        ➕ Add
                                      </button>
                                    </div>
                                  ))}
                                  {filtered.length === 0 && (
                                    <div style={{ padding: 12, textAlign: "center", color: "var(--ink-3)", fontSize: 11 }}>
                                      No matching sponsors.
                                    </div>
                                  )}
                                  {totalPages > 1 && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderTop: "1px solid var(--border-2)", marginTop: 6 }}>
                                      <button
                                        className="hbtn hbtn--ghost hbtn--sm"
                                        disabled={sponsorPage === 1}
                                        onClick={() => setSponsorPage(p => Math.max(1, p - 1))}
                                        style={{ border: "1px solid var(--border)", padding: "2px 6px", fontSize: 10 }}
                                      >
                                        Prev
                                      </button>
                                      <span style={{ fontSize: 10, color: "var(--ink-2)" }}>{sponsorPage}/{totalPages}</span>
                                      <button
                                        className="hbtn hbtn--ghost hbtn--sm"
                                        disabled={sponsorPage === totalPages}
                                        onClick={() => setSponsorPage(p => Math.min(totalPages, p + 1))}
                                        style={{ border: "1px solid var(--border)", padding: "2px 6px", fontSize: 10 }}
                                      >
                                        Next
                                      </button>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Selected Sponsors ({selectedSponsorIds.length})</div>
                          <div style={{
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-md)",
                            background: "var(--field)",
                            minHeight: "180px",
                            maxHeight: "180px",
                            overflowY: "auto",
                            padding: "6px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4
                          }}>
                            {selectedSponsorIds.map(id => {
                              const sp = ALL_SPONSORS.find(s => s.id === id);
                              if (!sp) return null;
                              return (
                                <div
                                  key={sp.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 8px",
                                    borderRadius: "var(--r-sm)",
                                    background: "var(--surface)",
                                    border: "1px solid var(--border)"
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{sp.name}</div>
                                    <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{sp.org}</div>
                                  </div>
                                  <button
                                    className="hbtn hbtn--ghost hbtn--sm"
                                    style={{ color: "#e5484d", padding: "2px 6px", fontSize: 10, border: "none" }}
                                    onClick={() => setSelectedSponsorIds(selectedSponsorIds.filter(sId => sId !== id))}
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })}
                            {selectedSponsorIds.length === 0 && (
                              <div style={{ margin: "auto", textAlign: "center", color: "var(--ink-3)", fontSize: 12, fontStyle: "italic" }}>
                                No sponsors selected.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions field */}
                <div className="cfield" style={{ marginBottom: 0 }}>
                  <label>Event Instructions (Optional)</label>
                  <div
                    style={{ minHeight: 48, background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 16px", color: instructions ? "var(--ink)" : "var(--ink-3)", cursor: "pointer", fontSize: 14 }}
                    onClick={() => setInstModalOpen(true)}
                  >
                    {instructions ? instructions : "Click to add attendee instructions (e.g. what to bring, arrival guidelines)."}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Banner Upload Container */}
            <div className="banner-section">
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Event Banner</label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
              />

              <div className="banner-square-container">
                <div
                  className={`cover-up ${cover ? "filled" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    ...(cover && !cover.startsWith("linear-gradient") ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : cover ? { background: cover } : {}),
                    borderRadius: "var(--r-md)",
                    position: "absolute",
                    inset: 0,
                    border: isDraggingBanner ? "2.5px dashed var(--accent-2)" : "1.5px dashed var(--border)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {cover && cover.startsWith("linear-gradient") && <Grain />}
                  {isUploadingBanner && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--r-md)" }}>
                      <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Uploading...</span>
                    </div>
                  )}
                  <div className="up-hint" style={{ color: cover ? "#fff" : "var(--ink-3)", textShadow: cover && !cover.startsWith("linear-gradient") ? "0 1px 4px rgba(0,0,0,0.6)" : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div className="uic" style={{ background: cover ? "rgba(255,255,255,0.25)" : "var(--accent-soft)", color: cover ? "#fff" : "var(--accent-2)", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><I.image style={{ width: 20, height: 20 }} /></div>
                    <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>{cover ? "Change Banner" : "Upload Banner (1:1)"}</span>
                  </div>
                </div>
              </div>

              {bannerError && (
                <div style={{ color: "#e5484d", fontSize: 12, marginTop: 8, fontWeight: 500 }}>
                  ⚠️ {bannerError}
                </div>
              )}

              <div id="cover-picker-label" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 12 }}>
                Square ratio (JPG, PNG, WEBP)
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Full Modals */}
      {tzModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 400, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Select Timezone</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setTzModalOpen(false)} style={{ border: "none" }}><I.x /></button>
            </div>
            <input
              className="cinput"
              placeholder="Search timezone or city..."
              value={tzSearchQuery}
              onChange={e => setTzSearchQuery(e.target.value)}
              style={{ marginBottom: 16, width: "100%" }}
            />
            <div style={{ maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {TIMEZONES.filter(tz =>
                tz.city.toLowerCase().includes(tzSearchQuery.toLowerCase()) ||
                tz.label.toLowerCase().includes(tzSearchQuery.toLowerCase())
              ).map(tz => (
                <button
                  key={tz.value}
                  className="hbtn hbtn--ghost"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    justifyContent: "flex-start",
                    padding: "12px 16px",
                    border: timezone === tz.value ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    background: timezone === tz.value ? "var(--accent-soft)" : "var(--surface)"
                  }}
                  onClick={() => {
                    setTimezone(tz.value);
                    setTzModalOpen(false);
                    setTzSearchQuery("");
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--ink)" }}>{tz.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{tz.city}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {calModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 600 }}>Create New Calendar</h2>
            <div className="cfield"><label>Calendar Name</label><input className="cinput" placeholder="e.g. Design Workshops" /></div>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setCalModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => setCalModalOpen(false)}>Create</button>
            </div>
          </div>
        </div>
      )}

      {descModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 640, height: 500, borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Event Description</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setDescModalOpen(false)}><I.x /></button>
            </div>
            <textarea className="ctext" style={{ flex: 1, border: "none", borderRadius: 0, padding: 24, fontSize: 15, resize: "none" }} placeholder="Write your full description here..." value={desc} onChange={e => setDesc(e.target.value)} autoFocus />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-2)"
            }}>
              <button
                className="hbtn hbtn--ghost"
                onClick={() => setAiModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(120,90,255,.08)",
                  border: "1px solid rgba(120,90,255,.25)",
                  color: "#c8bcff",
                  borderRadius: "999px",
                  padding: "10px 16px"
                }}
              >
                ✨ Suggest with AI
              </button>

              <button
                className="hbtn hbtn--primary"
                onClick={() => setDescModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {instModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 640, height: 500, borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Event Instructions</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setInstModalOpen(false)}><I.x /></button>
            </div>

            <textarea
              id="instructions-textarea"
              className="ctext"
              style={{ flex: 1, border: "none", borderRadius: 0, padding: 24, fontSize: 15, resize: "none" }}
              placeholder="Write any instructions for attendees here..."
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              autoFocus
            />
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg-2)"
            }}>
              <button
                className="hbtn hbtn--ghost"
                onClick={() => setAiInstModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(120,90,255,.08)",
                  border: "1px solid rgba(120,90,255,.25)",
                  color: "#c8bcff",
                  borderRadius: "999px",
                  padding: "10px 16px"
                }}
              >
                ✨ Suggest with AI
              </button>
              <button
                className="hbtn hbtn--primary"
                onClick={() => setInstModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {aiInstModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>✨ AI Instructions Suggestion</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 24 }}>Let AI write helpful instructions based on your event details.</p>
            <div className="cfield"><label>Instruction Type</label><select className="cselect"><option>General Guidelines</option><option>Arrival & Parking Info</option><option>Pre-requisites / Checklist</option></select></div>
            <div className="cfield"><label>Additional Notes</label><textarea id="ai-inst-notes" className="ctext" placeholder="Any specific instructions to include?" style={{ minHeight: 80 }} /></div>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setAiInstModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => {
                const notesEl = document.getElementById("ai-inst-notes");
                const notes = notesEl ? (notesEl as HTMLTextAreaElement).value : "";
                const intro = notes ? `**Special Note:** ${notes}\n\n` : "";
                setInstructions(intro + `- Please arrive 15 minutes before the start time.\n- Check-in at the registration desk in the main hall.\n- Bring a laptop/notebook for hands-on activities.\n- Parking is available in the public lot near the venue.`);
                setAiInstModalOpen(false);
              }}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {aiModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>✨ AI Suggestion</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 24 }}>Let AI write a polished description based on your event details.</p>
            <div className="cfield"><label>Event Mood</label><select className="cselect"><option>Professional</option><option>Casual</option><option>Exciting</option></select></div>
            <div className="cfield"><label>Additional Notes</label><textarea className="ctext" placeholder="Any specific details to include?" style={{ minHeight: 80 }} /></div>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setAiModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => { setDesc(`Join us for ${title || 'an exciting event'} at ${venue || 'our venue'}. It will be a fantastic experience!`); setAiModalOpen(false); }}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {capacityModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--surface)", width: 400, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Capacity Settings</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setCapacityModalOpen(false)} style={{ border: "none" }}><I.x /></button>
            </div>

            <div className="cfield">
              <label>Maximum Capacity</label>
              {eventMaxParticipants !== -1 && (
                <div style={{ padding: "8px 10px", background: "var(--field-2, var(--field))", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent)", fontSize: "11px", color: "var(--ink-2)", marginBottom: 12 }}>
                  🔒 Under your current plan, event capacity is capped at a maximum of <strong>{eventMaxParticipants}</strong> participants. Upgrade to Standard for unlimited capacity.
                </div>
              )}
              <input
                className="cinput"
                placeholder="e.g. 100"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={{ width: "100%", background: "var(--field)", border: "1px solid var(--border)" }}
              />
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 20,
                cursor: "pointer",
                userSelect: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink-2)"
              }}
            >
              <input
                type="checkbox"
                checked={waitlist}
                onChange={(e) => setWaitlist(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              Enable Waitlist
            </label>

            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setCapacityModalOpen(false)}>Cancel</button>
              <button 
                className="hbtn hbtn--primary" 
                style={{ flex: 1 }} 
                onClick={() => {
                  if (eventMaxParticipants !== -1 && (!capacity || parseInt(capacity) > eventMaxParticipants || parseInt(capacity) < 1)) {
                    alert(`Event capacity must be between 1 and ${eventMaxParticipants} participants under your current plan.`);
                    triggerUpgrade(`Event Capacity > ${eventMaxParticipants}`);
                    return;
                  }
                  setCapacityModalOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <AccessControlModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        mode="restricted"
        selectedAccess={selectedAccess}
        setSelectedAccess={setSelectedAccess}
      />

      <div className="create-foot" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, borderTop: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", padding: mobile ? "10px 12px" : "10px 24px", display: "flex", gap: "10px" }}>
        <button className="hbtn hbtn--ghost" onClick={() => go("home")}>Cancel</button>
        <div className="sp" style={{ flex: 1 }} />
        <button className="hbtn hbtn--ghost">Save draft</button>
        <button className="hbtn hbtn--ghost" style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city: "Bengaluru", cap: capacity || 180, desc })}><I.external /> Preview</button>
        <button className="hbtn hbtn--primary" onClick={() => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city: "Bengaluru", cap: capacity || 180, desc })}><I.check />Publish Event</button>
      </div>
      {upgradeModalOpen && (
        <UpgradePlanModal 
          open={upgradeModalOpen} 
          onClose={() => setUpgradeModalOpen(false)} 
          feature={upgradeFeature} 
          go={go} 
          currentPlanName={st?.planDisplayName}
        />
      )}
    </div>
  );
}

Object.assign(window, { CreateEvent });
