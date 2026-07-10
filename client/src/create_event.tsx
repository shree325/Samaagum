// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Field } from './components';
import { COVER_SWATCHES } from './home-create';
import { COVERS, GROUPS, ME } from './home-data';
import { Avatar, Grain } from './home-icons';
import { Profile } from './home-profile';
import { Empty } from './home-shell';
import { Waitlist } from './home-waitlist';
import { I } from './home-icons';
import { Communities, Events } from './landing-features';
import { EventCard } from './home-cards';

export function UpgradePlanModal({ open, onClose, feature, go, currentPlanName }) {
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

export function CoverPicker({ value, onPick }) {
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

export function Toggle({ on, onClick }) { return <button className={`tg ${on ? "on" : ""}`} onClick={onClick} />; }

export function format24to12(timeStr) {
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

export function parse12to24(val) {
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

export function TimePicker({ label = undefined, value, onChange, mobile, compact }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef(null);
  const clockRef = useRef(null);

  const [mode, setMode] = useState("hours");
  const [tempHour, setTempHour] = useState(12);
  const [tempMin, setTempMin] = useState(0);
  const [tempAmPm, setTempAmPm] = useState("PM");
  const [isDragging, setIsDragging] = useState(false);

  const getTouchCoords = (e) => {
    if (e.touches && e.touches[0]) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return null;
  };

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
  }, [open]);

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

    const handleTouchMove = (e) => {
      const coords = getTouchCoords(e);
      if (coords) {
        const val = calculateValFromCoords(coords.clientX, coords.clientY);
        if (val !== undefined) {
          if (mode === "hours") {
            setTempHour(val);
            updateTime(val, tempMin, tempAmPm);
          } else {
            setTempMin(val);
            updateTime(tempHour, val, tempAmPm);
          }
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

    const handleTouchEnd = (e) => {
      setIsDragging(false);
      if (mode === "hours") {
        selectHour(tempHour);
      } else {
        selectMin(tempMin);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
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
        onTouchStart={(e) => {
          setIsDragging(true);
          const coords = getTouchCoords(e);
          if (coords) {
            const val = calculateValFromCoords(coords.clientX, coords.clientY);
            if (val !== undefined) {
              if (mode === "hours") {
                setTempHour(val);
                updateTime(val, tempMin, tempAmPm);
              } else {
                setTempMin(val);
                updateTime(tempHour, val, tempAmPm);
              }
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
    <div ref={containerRef} style={{
      position: "relative",
      zIndex: open ? 50 : 1,
      width: compact ? "100%" : "100%",
      maxWidth: compact ? "none" : (mobile ? "140px" : "130px"),
      height: compact ? "100%" : "auto",
      borderLeft: compact ? "1px solid var(--border)" : "none",
      display: compact ? "flex" : "block",
      alignItems: "center"
    }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{label}</label>}
      <div style={{ position: "relative", height: compact ? "100%" : "auto", width: compact ? "100%" : "auto" }}>
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
              onClick={() => {
                updateTime(tempHour, tempMin, tempAmPm);
                setOpen(false);
              }}
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
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`;
}

function DatePicker({ label = undefined, value, onChange, mobile, compact }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);

  useEffect(() => {
    if (open) {
      const [y, m] = value ? value.split("-").map(Number) : [null, null];
      const now = new Date();
      setViewYear(y || now.getFullYear());
      setViewMonth(y ? m - 1 : now.getMonth());
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

  const goMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setOpen(false);
  };

  const renderCalendarGrid = () => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const selected = value ? value.split("-").map(Number) : null;
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", width: "100%" }}>
        {WEEKDAY_LABELS.map(w => (
          <div key={w} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", padding: "4px 0" }}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={"e" + i} />;
          const isSelected = selected && selected[0] === viewYear && selected[1] === viewMonth + 1 && selected[2] === day;
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast = cellDate < today;

          return (
            <button
              key={day}
              type="button"
              disabled={isPast}
              onClick={() => selectDay(day)}
              style={{
                width: "100%",
                aspectRatio: "1",
                border: "none",
                borderRadius: "50%",
                cursor: isPast ? "not-allowed" : "pointer",
                fontSize: "13px",
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? "var(--accent-2)" : "transparent",
                color: isPast ? "var(--ink-3)" : (isSelected ? "#fff" : "var(--ink)"),
                opacity: isPast ? 0.35 : 1,
                fontFamily: "inherit"
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{
      position: "relative",
      zIndex: open ? 50 : 1,
      width: compact ? "100%" : "100%",
      maxWidth: compact ? "none" : (mobile ? "160px" : "150px"),
      height: compact ? "100%" : "auto",
      borderLeft: compact ? "1px solid var(--border)" : "none",
      display: compact ? "flex" : "block",
      alignItems: "center"
    }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>{label}</label>}
      <div style={{ position: "relative", height: compact ? "100%" : "auto", width: compact ? "100%" : "auto" }}>
        <input
          className={compact ? "" : "cinput"}
          type="text"
          readOnly
          value={formatDateDisplay(value)}
          onClick={() => setOpen(true)}
          placeholder="Select date"
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
            📅
          </span>
        )}
      </div>

      {open && viewYear !== null && (
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
          width: "260px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "popUp 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "8px" }}>
            <button
              type="button"
              onClick={() => goMonth(-1)}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "var(--ink-2)", padding: "4px 8px" }}
            >
              ‹
            </button>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => goMonth(1)}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "var(--ink-2)", padding: "4px 8px" }}
            >
              ›
            </button>
          </div>

          {renderCalendarGrid()}
        </div>
      )}
    </div>
  );
}

export const TIMEZONES = [

  { value: "UTC +05:30 India", label: "GMT+05:30", city: "Asia/Kolkata" },
  { value: "UTC +00:00 London", label: "GMT+00:00", city: "Europe/London" },
  { value: "UTC -05:00 New York", label: "GMT-05:00", city: "America/New_York" },
  { value: "UTC +08:00 Singapore", label: "GMT+08:00", city: "Asia/Singapore" },
  { value: "UTC +09:00 Tokyo", label: "GMT+09:00", city: "Asia/Tokyo" },
  { value: "UTC -08:00 Los Angeles", label: "GMT-08:00", city: "America/Los_Angeles" }
];

export function addOneHour(timeStr) {
  if (!timeStr) return "10:00";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;
  h = (h + 1) % 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getDurationText(startDate, startTime, endDate, endTime) {
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

export function getTzInfo(tzValue) {
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

export function EligibilityOption({ active, title, desc, onClick }) {
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

export function SummaryChip({ icon, label, onClick }: any) {
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

export function CategorySummaryChip({ type, items, onEditClick }: any) {
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

export function RuleSummaryChip({ rule, onEditClick }: any) {
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
export let ACCESS_TREE = [
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

export const isChecked = (node: any, selected: any): boolean => {
  if (node.type === "group") {
    return selected.groups.includes(node.id);
  }
  if (!node.children || node.children.length === 0) {
    if (node.type === "subcommunity") return selected.subCommunities.includes(node.id);
    return selected.communities.includes(node.id);
  }
  return node.children.every((child: any) => isChecked(child, selected));
};

export const isIndeterminate = (node: any, selected: any): boolean => {
  if (node.type === "group") return false;
  if (!node.children || node.children.length === 0) return false;

  const checkedCount = node.children.filter((child: any) => isChecked(child, selected)).length;
  const indetCount = node.children.filter((child: any) => isIndeterminate(child, selected)).length;

  const allChecked = checkedCount === node.children.length;
  const noneChecked = checkedCount === 0 && indetCount === 0;

  return !allChecked && !noneChecked;
};

export const getDescendantIds = (node: any): { communities: string[], subCommunities: string[], groups: string[] } => {
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

export const findParentPath = (id: string, tree: any[]): any[] => {
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

export const toggleNodeCheck = (node: any, selected: any) => {
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

export const nodeMatchesSearch = (node: any, query: string): boolean => {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true;
  if (node.children) {
    return node.children.some((child: any) => nodeMatchesSearch(child, query));
  }
  return false;
};

export const getSearchAutoExpandedIds = (query: string): Set<string> => {
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

export function TreeNodeCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
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

export const getTopLevelCheckedNodes = (tree: any[], selected: any): any[] => {
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

export const getSelectedNodesWithDetails = (tree: any[], selected: any) => {
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

export const findNodeInTree = (id: string, tree: any[]): any => {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(id, node.children);
      if (found) return found;
    }
  }
  return null;
};


export function AccessControlModal({ open, onClose, mode, selectedAccess, setSelectedAccess }: any) {
  const [search, setSearch] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set<string>());

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
      <style dangerouslySetInnerHTML={{ __html: `.tree-node-row:hover { background: var(--bg-2) !important; }` }} />
      <div style={{ background: "var(--surface)", width: 500, maxHeight: "85vh", borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
            Restricted Access Settings
          </h2>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose} style={{ border: "none" }}><I.x /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div>
              {/* Selection Summary at Top */}
              <div style={{ marginBottom: 12, padding: "0 4px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>Selection Summary</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
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
                  placeholder="Search groups..."
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
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--bg-2)" }}>
          <button type="button" className="hbtn hbtn--primary" onClick={onClose}>Save &amp; Close</button>
        </div>
      </div>
    </div>
  );
}

export const RECENT_LOCATIONS = [
  {
    name: "Delhi darbar hotel",
    address: "51, Jawahar Marg, Jhanda Chowk, Indore, Madhya Pradesh 452007, India",
  },
];

export function LocationSection({ venue, setVenue, locType, setLocType }) {
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
/* ---------------- Create Event ---------------- */
export const DEFAULT_FREE_ENTITLEMENTS = {
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

export function CreateEvent(props: any) {
  const { editEv } = props;
  const [eventData, setEventData] = useState(null as any);
  const [loading, setLoading] = useState(editEv?.id && editEv.id !== 'new');

  useEffect(() => {
    if (editEv?.id && editEv.id !== 'new') {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {} as any;
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      fetch(`${apiBase}/api/events/${editEv.id}`, { headers })
        .then(r => r.json())
        .then(d => {
          if (d.success && d.data?.event) {
            setEventData(d.data.event);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [editEv?.id]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-2)", color: "var(--ink-2)" }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>Loading event details...</div>
      </div>
    );
  }

  return <CreateEventForm {...props} editEv={eventData || editEv} />;
}

function CreateEventForm({ go, mobile, st, editEv, hostGroupId, hostGroupName }: any) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const draftKey = "sg_draft_event";
  const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "{}");
  // Resuming an in-progress draft (e.g. Preview -> Back) restores every field below via `draft`.
  const draft = (editEv && editEv.__draft) || null;
  const isNewEvent = !editEv?.id || editEv.id === 'new';

  // Plan entitlements gate what a *new* event can default to / offer; an event already saved
  // keeps its existing values regardless of the current plan (handled per-field below).
  const entitlements = st?.entitlements || DEFAULT_FREE_ENTITLEMENTS;
  const allowedVisibilities = entitlements.event_allowed_visibility || ['unlisted', 'invite_only'];
  const eventMaxParticipants = entitlements.event_max_participants ?? 100;
  const canCreatePaidTickets = entitlements.event_can_create_paid_tickets ?? false;

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const triggerUpgrade = (feat: string) => {
    setUpgradeFeature(feat);
    setUpgradeModalOpen(true);
  };

  const [hostEntityId, setHostEntityId] = useState(draft?.hostEntityId || savedDraft.hostEntityId || hostGroupId || "standalone");
  const [hostGroups, setHostGroups] = useState([] as any[]);
  const [dbGroups, setDbGroups] = useState([] as any[]);
  const [accessTreeUpdated, setAccessTreeUpdated] = useState(0);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {} as any;

        // Fetch groups user can host events under
        fetch(`${apiBase}/api/groups/mine/as-host`, { headers })
          .then(r => r.json())
          .then(d => {
            if (d.success) {
              setHostGroups(d.data);
              if (editEv?.hosted_by_entity_id) {
                const isGroupHost = d.data.some((g: any) => g.entity_id === editEv.hosted_by_entity_id);
                if (isGroupHost) {
                  setHostEntityId(editEv.hosted_by_entity_id);
                } else {
                  setHostEntityId("standalone");
                }
              }
            }
          })
          .catch(console.error);

        const res = await fetch(`${apiBase}/api/groups`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.data) {
          setDbGroups(data.data);
          ACCESS_TREE = data.data.map((g: any) => ({
            id: g.id,
            name: g.name,
            type: "group"
          }));
          setAccessTreeUpdated(prev => prev + 1);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchGroups();
  }, []);

  const [title, setTitle] = useState(draft?.title ?? editEv?.title ?? "");
  const [slug, setSlug] = useState(draft?.slug ?? editEv?.venue_raw?.meta?.slug ?? editEv?.venue?.meta?.slug ?? "");
  const [cover, setCover] = useState(draft?.cover ?? editEv?.cover ?? editEv?.venue_raw?.meta?.cover ?? editEv?.venue?.meta?.cover ?? "");
  const [visibility, setVisibility] = useState(
    draft?.visibility
    ?? editEv?.venue_raw?.visibility
    ?? editEv?.venue?.visibility
    ?? (allowedVisibilities.includes("public") ? "public" : (allowedVisibilities[0] || "unlisted"))
  );
  const [calendar, setCalendar] = useState(draft?.calendar ?? "Main Calendar");
  const initDT = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const currentDate = `${yyyy}-${mm}-${dd}`;

    let currentHour = now.getHours();
    let currentMinute = Math.round(now.getMinutes() / 5) * 5;
    if (currentMinute === 60) {
      currentMinute = 0;
      currentHour = (currentHour + 1) % 24;
    }
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    let endHour = (currentHour + 1) % 24;
    const currentEndTime = `${String(endHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    let endDateStr = currentDate;
    if (currentHour === 23) {
      const endNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const eyyyy = endNow.getFullYear();
      const emm = String(endNow.getMonth() + 1).padStart(2, '0');
      const edd = String(endNow.getDate()).padStart(2, '0');
      endDateStr = `${eyyyy}-${emm}-${edd}`;
    }

    return { currentDate, currentTime, endDateStr, currentEndTime };
  }, []);

  const startsAt = editEv?.starts_at ? new Date(editEv.starts_at) : null;
  const endsAt = editEv?.ends_at ? new Date(editEv.ends_at) : null;

  // Extract local date and time to avoid UTC shifts
  const editStartDate = startsAt ? `${startsAt.getFullYear()}-${String(startsAt.getMonth() + 1).padStart(2, '0')}-${String(startsAt.getDate()).padStart(2, '0')}` : "";
  const editStartTime = startsAt ? `${String(startsAt.getHours()).padStart(2, '0')}:${String(startsAt.getMinutes()).padStart(2, '0')}` : "";
  const editEndDate = endsAt ? `${endsAt.getFullYear()}-${String(endsAt.getMonth() + 1).padStart(2, '0')}-${String(endsAt.getDate()).padStart(2, '0')}` : "";
  const editEndTime = endsAt ? `${String(endsAt.getHours()).padStart(2, '0')}:${String(endsAt.getMinutes()).padStart(2, '0')}` : "";

  const [startDate, setStartDate] = useState(draft?.startDate ?? (editEv ? editStartDate : savedDraft.startDate) ?? initDT.currentDate);
  const [startTime, setStartTime] = useState(draft?.startTime ?? (editEv ? editStartTime : savedDraft.startTime) ?? initDT.currentTime);
  const [endDate, setEndDate] = useState(draft?.endDate ?? (editEv ? editEndDate : savedDraft.endDate) ?? initDT.endDateStr);
  const [endTime, setEndTime] = useState(draft?.endTime ?? (editEv ? editEndTime : savedDraft.endTime) ?? initDT.currentEndTime);

  // Enforce dates/times are not in the past (only for new events, not when editing)
  useEffect(() => {
    if (editEv?.id && editEv.id !== 'new') return; // Skip past enforcement when editing existing events

    const now = new Date();

    // Format YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Check start date
    if (startDate && startDate < todayStr) {
      setStartDate(todayStr);
    }

    // Check end date
    if (endDate && endDate < todayStr) {
      setEndDate(todayStr);
    }

    // If startDate is today, check startTime
    if (startDate === todayStr && startTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      if (sh < nowH || (sh === nowH && sm < nowM)) {
        // Reset to now
        let currentHour = now.getHours();
        let currentMinute = Math.round(now.getMinutes() / 5) * 5;
        if (currentMinute === 60) {
          currentMinute = 0;
          currentHour = (currentHour + 1) % 24;
        }
        setStartTime(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
      }
    }

    // If endDate is today, check endTime
    if (endDate === todayStr && endTime) {
      const [eh, em] = endTime.split(":").map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      if (eh < nowH || (eh === nowH && em < nowM)) {
        // Reset to now + 1 hour or similar
        let currentHour = now.getHours();
        let currentMinute = Math.round(now.getMinutes() / 5) * 5;
        if (currentMinute === 60) {
          currentMinute = 0;
          currentHour = (currentHour + 1) % 24;
        }
        let endHour = (currentHour + 1) % 24;
        setEndTime(`${String(endHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
      }
    }

    // Enforce end date/time is after start date/time
    if (startDate && endDate) {
      if (endDate < startDate) {
        setEndDate(startDate);
      } else if (startDate === endDate && startTime && endTime) {
        if (endTime < startTime) {
          setEndTime(addOneHour(startTime));
        }
      }
    }
  }, [startDate, startTime, endDate, endTime, editEv]);

  const [timezone, setTimezone] = useState(draft?.timezone ?? editEv?.venue_timezone ?? "UTC +05:30 India");
  const [locType, setLocType] = useState(draft?.locType ?? (editEv?.location_type === 'online' ? 'online' : 'physical'));
  const [venue, setVenue] = useState(draft?.venue ?? (editEv?.location_type === 'online' ? editEv?.online_link : (editEv?.venue_raw?.name ?? editEv?.venue_raw?.address ?? editEv?.venue?.name ?? editEv?.venue?.address ?? "")));
  const [desc, setDesc] = useState(draft?.desc ?? editEv?.description ?? editEv?.desc ?? "");
  const [tzModalOpen, setTzModalOpen] = useState(false);
  const [tzSearchQuery, setTzSearchQuery] = useState("");

  const [type, setType] = useState(
    draft?.type
    ?? (editEv?.registration_mode
        ? ((editEv.registration_mode === 'free_rsvp' || editEv.registration_mode === 'free') ? 'free' : 'paid')
        : (canCreatePaidTickets ? 'paid' : 'free'))
  );
  const [approval, setApproval] = useState(draft?.approval ?? editEv?.approval_required ?? false);
  const [capacityEnabled, setCapacityEnabled] = useState(
    draft?.capacityEnabled ?? (isNewEvent ? entitlements.event_max_participants !== -1 : !!editEv?.capacity_total)
  );
  const [capacity, setCapacity] = useState(
    draft?.capacity
    ?? (isNewEvent
        ? (entitlements.event_max_participants !== -1 ? String(entitlements.event_max_participants) : "")
        : (editEv?.capacity_total ?? ""))
  );
  const [waitlist, setWaitlist] = useState(draft?.waitlist ?? editEv?.waitlist ?? false);

  const [registrationStatus, setRegistrationStatus] = useState(
    draft?.registrationStatus ?? editEv?.registration_status ?? "OPEN"
  );
  
  const editRegOpensAt = editEv?.registration_opens_at ? new Date(editEv.registration_opens_at) : null;
  const editRegClosesAt = editEv?.registration_closes_at ? new Date(editEv.registration_closes_at) : null;
  
  const [regStartDate, setRegStartDate] = useState(
    draft?.regStartDate ?? (editRegOpensAt ? `${editRegOpensAt.getFullYear()}-${String(editRegOpensAt.getMonth() + 1).padStart(2, '0')}-${String(editRegOpensAt.getDate()).padStart(2, '0')}` : "")
  );
  const [regStartTime, setRegStartTime] = useState(
    draft?.regStartTime ?? (editRegOpensAt ? `${String(editRegOpensAt.getHours()).padStart(2, '0')}:${String(editRegOpensAt.getMinutes()).padStart(2, '0')}` : "")
  );
  const [regEndDate, setRegEndDate] = useState(
    draft?.regEndDate ?? (editRegClosesAt ? `${editRegClosesAt.getFullYear()}-${String(editRegClosesAt.getMonth() + 1).padStart(2, '0')}-${String(editRegClosesAt.getDate()).padStart(2, '0')}` : "")
  );
  const [regEndTime, setRegEndTime] = useState(
    draft?.regEndTime ?? (editRegClosesAt ? `${String(editRegClosesAt.getHours()).padStart(2, '0')}:${String(editRegClosesAt.getMinutes()).padStart(2, '0')}` : "")
  );

  const initialTickets = editEv?.tickets
    ? editEv.tickets.map((t: any) => ({ n: t.name, cap: String(t.capacity || ""), price: String((t.price_minor || 0) / 100) }))
    : [{ n: "Early Bird", cap: "50", price: "499" }];
  const [tickets, setTickets] = useState(draft?.tickets ?? initialTickets);

  const [tags, setTags] = useState(draft?.tags ?? editEv?.venue_raw?.meta?.tags ?? editEv?.venue?.meta?.tags ?? ["Startup", "Technology"]);
  const [tagInput, setTagInput] = useState("");

  const [cat, setCat] = useState(draft?.cat ?? editEv?.venue_raw?.meta?.category ?? editEv?.venue?.meta?.category ?? "");
  const [categoriesList, setCategoriesList] = useState([] as any[]);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [instructions, setInstructions] = useState(draft?.instructions ?? editEv?.venue_raw?.meta?.instructions ?? editEv?.venue?.meta?.instructions ?? editEv?.instructions ?? editEv?.instructions ?? "");
  const [instModalOpen, setInstModalOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiBase}/api/public/categories`);
        const data = await res.json();
        if (data.success && data.data) {
          const active = data.data.filter((c: any) => c.status === 'active' && !c.is_deleted);
          setCategoriesList(active);
          // Set default only when no value is chosen yet
          setCat(prev => prev || (active[0]?.name ?? ""));
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };

    // Initial load
    fetchCategories();

    // Refetch whenever the user switches back to this tab (covers admin changes in another tab/window)
    const handleFocus = () => fetchCategories();
    const handleVisibility = () => { if (document.visibilityState === "visible") fetchCategories(); };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Poll every 60 s while the form is open (covers same-device same-tab admin edits)
    const pollInterval = setInterval(fetchCategories, 60_000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(pollInterval);
    };
  }, []);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInstModalOpen, setAiInstModalOpen] = useState(false);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [joinEligibility, setJoinEligibility] = useState(draft?.joinEligibility ?? editEv?.venue_raw?.meta?.joinEligibility ?? editEv?.venue?.meta?.joinEligibility ?? "public");
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [hostSearchQuery, setHostSearchQuery] = useState("");
  const [hostFilterType, setHostFilterType] = useState("all");
  const [selectedAccess, setSelectedAccess] = useState(draft?.selectedAccess ?? editEv?.venue_raw?.meta?.selectedAccess ?? editEv?.venue?.meta?.selectedAccess ?? {
    restricted: {
      communities: [],
      subCommunities: [],
      groups: []
    },
    selectedMembers: []
  });


  // --- REGISTRATION FORM BUILDER STATES (Phase 3 Schema) ---
  const [enableRegForm, setEnableRegForm] = useState(draft?.enableRegForm ?? editEv?.venue_raw?.meta?.enableRegForm ?? editEv?.venue?.meta?.enableRegForm ?? false);
  const [formFields, setFormFields] = useState(draft?.formFields ?? editEv?.venue_raw?.meta?.formFields ?? editEv?.venue?.meta?.formFields ?? [
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
  const [customEntities, setCustomEntities] = useState(draft?.customEntities ?? ["BLR Founders Collective"]);

  // --- SPONSORS STATES (Phase 4 Search / Debounce / Pagination) ---
  const [enableSponsors, setEnableSponsors] = useState(draft?.enableSponsors ?? editEv?.venue_raw?.meta?.enableSponsors ?? editEv?.venue?.meta?.enableSponsors ?? false);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState(draft?.selectedSponsorIds ?? editEv?.venue_raw?.meta?.selectedSponsorIds ?? editEv?.venue?.meta?.selectedSponsorIds ?? ["sp-1", "sp-3"]);
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState("");
  const [debouncedSponsorQuery, setDebouncedSponsorQuery] = useState("");
  const [sponsorVisibility, setSponsorVisibility] = useState(draft?.sponsorVisibility ?? editEv?.venue_raw?.meta?.sponsorVisibility ?? editEv?.venue?.meta?.sponsorVisibility ?? "public");
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

  // Host Modal escape listener & focus effect
  useEffect(() => {
    if (!hostModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHostModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hostModalOpen]);

  // --- BANNER UPLOAD STATES & MOCK VALIDATIONS (Phase 2) ---
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null as any);

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

  // Full snapshot of every editable field, restored via `editEv.__draft` when returning from Preview.
  const draftSnapshot = {
    title, slug, cover, visibility, calendar, startDate, startTime, endDate, endTime,
    timezone, locType, venue, desc, type, approval, capacityEnabled, capacity, waitlist,
    tickets, tags, cat, instructions, joinEligibility, selectedAccess, enableRegForm, formFields,
    enableSponsors, hostEntityId, customEntities, selectedSponsorIds, sponsorVisibility,
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



          <EventCard ev={previewEv} onOpen={() => { }} wishlisted={false} wishlistCount={0} onWishlist={() => { }} />

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

  async function handlePublish(isDraft = false) {
    if (!title.trim()) { setSubmitError("Event name is required."); return; }
    if (!startDate) { setSubmitError("Start date is required."); return; }
    setSubmitError("");
    setLoading(true);

    const token = localStorage.getItem('token');
    // Upload banner if it's a local data URL / blob
    let finalCover = cover;
    if (cover && (cover.startsWith("data:") || cover.startsWith("blob:"))) {
      try {
        const blob = await (await fetch(cover)).blob();
        const form = new FormData();
        form.append('file', blob, 'event-banner.jpg');
        const up = await fetch(`${apiBase}/api/upload-group-media`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: form
        });
        const upData = await up.json();
        if (upData.success && upData.imageUrl) finalCover = upData.imageUrl;
      } catch (err) {
        console.error("Banner upload failed", err);
      }
    }

    const starts_at = startDate && startTime
      ? new Date(`${startDate}T${startTime}`).toISOString()
      : startDate ? new Date(`${startDate}T00:00`).toISOString() : null;
    const ends_at = endDate && endTime
      ? new Date(`${endDate}T${endTime}`).toISOString()
      : endDate ? new Date(`${endDate}T23:59`).toISOString() : null;

    const payload = {
      host_entity_id: hostEntityId,
      title: title.trim(),
      description: desc,
      cover: finalCover,
      status: isDraft ? 'draft' : 'published',
      starts_at,
      ends_at,
      venue_timezone: timezone,
      location_type: locType === 'online' ? 'online' : 'venue',
      venue: {
        name: venue,
        address: venue,
        visibility,
        meta: {
          cover: finalCover,
          slug, tags, category: cat, instructions,
          joinEligibility, selectedAccess,
          enableRegForm, formFields,
          enableSponsors, selectedSponsorIds
        }
      },
      online_link: locType === 'online' ? venue : null,
      registration_mode: type === 'free' ? 'free_rsvp' : 'paid',
      registration_status: registrationStatus,
      registration_opens_at: registrationStatus === 'SCHEDULED' && regStartDate && regStartTime ? new Date(`${regStartDate}T${regStartTime}`).toISOString() : null,
      registration_closes_at: registrationStatus === 'SCHEDULED' && regEndDate && regEndTime ? new Date(`${regEndDate}T${regEndTime}`).toISOString() : null,
      approval_required: approval,
      capacity_total: capacityEnabled && capacity ? parseInt(capacity) : null,
      waitlist,
      tickets: type === 'paid'
        ? tickets.map((t, i) => ({ name: t.n, capacity: parseInt(t.cap) || null, price_minor: parseInt(t.price) * 100, sort_order: i }))
        : [{ name: 'Free Admission', price_minor: 0, capacity: capacityEnabled && capacity ? parseInt(capacity) : null, sort_order: 0 }]
    };

    try {
      const isEditing = editEv?.id && editEv.id !== 'new';
      const url = isEditing ? `${apiBase}/api/events/${editEv.id}` : `${apiBase}/api/events`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to publish event');
      
      const eventObj = isEditing ? data.data : data.data.event;
      
      localStorage.removeItem(draftKey);
      if (st && st.addCreatedEvent) {
        st.addCreatedEvent(eventObj);
      }
      // Refetch all events so new event appears in lists and group tabs
      if (st && st.fetchEvents) {
        st.fetchEvents();
      }
      go('event', eventObj);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const CREATE_EVENT_CSS = `
        .create {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: stretch;
          background: var(--bg-2);
          overflow: hidden;
        }

        .create.single {
          display: block;
          overflow-y: auto;
          height: 100%;
        }

        .create-form {
          flex: 1 1 auto;
          width: 100%;
          height: 100%;
          overflow-y: auto;
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
          overflow: visible;
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
            height: auto;
            overflow-y: visible;
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
      `;

  return (
    <>
    <div className={`create ${mobile ? "single" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: CREATE_EVENT_CSS }} />

      <div className="create-form" style={{ backgroundColor: "var(--bg-2)", padding: mobile ? "14px 12px 40px" : "24px 32px 40px", position: "relative" }}>
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
                      <option value="">Select category...</option>
                      {categoriesList.map((c: any) => (
                        <option key={c.id} value={c.name}>
                          {c.icon_value ? `${c.icon_value} ` : ""}{c.name}
                        </option>
                      ))}
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
                      <DatePicker
                        value={startDate}
                        onChange={(val) => {
                          setStartDate(val);
                          if (!endDate || endDate < val) {
                            setEndDate(val);
                          }
                        }}
                        mobile={mobile}
                        compact={true}
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
                      <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        mobile={mobile}
                        compact={true}
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
                      👥 Restricted Access
                      <div style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 }}>Only members of selected groups can join.</div>
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
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Allowed Groups</span>
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
                          No groups selected yet. Click "Configure" to select.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "16px", marginBottom: 20 }}>
                  <div
                    style={{ padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => setTicketModalOpen(true)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ticket Price</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minHeight: 36 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                        {type === "paid" ? "Paid" : "Free"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {type === "paid" ? "Click to view tiers & pricing" : "Click to change settings"}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Require Approval</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, height: 36 }}>
                      <Toggle on={approval} onClick={() => setApproval(v => !v)} />
                      <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{approval ? "On" : "Off"}</span>
                    </div>
                  </div>
                  <div
                    style={{ padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", cursor: "pointer" }}
                    onClick={() => setCapacityModalOpen(true)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Capacity Limit</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minHeight: 36 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                        {capacityEnabled ? `${capacity || "0"} Limited` : "Unlimited"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {waitlist ? "Waitlist Enabled" : "Waitlist Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

                {/* Registration Schedule UI */}
                <div style={{ padding: 16, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Registration Schedule</div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                      <input type="radio" checked={registrationStatus === "OPEN"} onChange={() => setRegistrationStatus("OPEN")} style={{ accentColor: "var(--accent-2)" }} />
                      Open Now
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                      <input type="radio" checked={registrationStatus === "CLOSED"} onChange={() => setRegistrationStatus("CLOSED")} style={{ accentColor: "var(--accent-2)" }} />
                      Closed (Coming Soon)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                      <input type="radio" checked={registrationStatus === "SCHEDULED"} onChange={() => setRegistrationStatus("SCHEDULED")} style={{ accentColor: "var(--accent-2)" }} />
                      Scheduled
                    </label>
                  </div>
                  
                  {registrationStatus === "SCHEDULED" && (
                    <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
                      <div className="cfield" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Registration Opens At</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <DatePicker value={regStartDate} onChange={setRegStartDate} mobile={mobile} compact={true} />
                          <TimePicker value={regStartTime} onChange={setRegStartTime} mobile={mobile} compact={true} />
                        </div>
                      </div>
                      <div className="cfield" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12, marginBottom: 4 }}>Registration Closes At</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <DatePicker value={regEndDate} onChange={setRegEndDate} mobile={mobile} compact={true} />
                          <TimePicker value={regEndTime} onChange={setRegEndTime} mobile={mobile} compact={true} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: 16 }}>
                  {/* Sponsors section */}
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, background: "var(--field)", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 80 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Enable Sponsors</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Promote organizations and display logos.</div>
                      </div>
                      <Toggle on={enableSponsors} onClick={() => setEnableSponsors(v => !v)} />
                    </div>
                  </div>

                  {/* Registration Form Builder Toggle & Embed */}
                  <div 
                    style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, background: "var(--field)", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 80, cursor: "pointer" }}
                    onClick={() => setQuestModalOpen(true)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Registration Questionnaire</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Customize form questions and fields.</div>
                      </div>
                      <Toggle
                        on={enableRegForm}
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = !enableRegForm;
                          setEnableRegForm(next);
                          if (next) {
                            setQuestModalOpen(true);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Instructions field */}
                <div className="cfield" style={{ marginBottom: 0 }}>
                  <label>Event Instructions (Optional)</label>
                  <div
                    style={{
                      minHeight: 48,
                      background: "var(--field)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      padding: "12px 16px",
                      color: instructions ? "var(--ink)" : "var(--ink-3)",
                      cursor: "pointer",
                      fontSize: 14,
                      lineHeight: "1.4"
                    }}
                    onClick={() => setInstModalOpen(true)}
                  >
                    {instructions ? (instructions.length > 140 ? instructions.substring(0, 140) + " . . ." : instructions) : "Click to add attendee instructions (e.g. what to bring, arrival guidelines)."}
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

              {/* Host as Card Trigger */}
              <div 
                onClick={() => setHostModalOpen(true)}
                style={{
                  marginTop: 20,
                  padding: "16px 18px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--sh-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "border-color 0.2s, background 0.2s"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--accent-2)";
                  e.currentTarget.style.background = "var(--bg-2)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {hostEntityId === "standalone" ? (
                    <Avatar name={ME.name} size={32} />
                  ) : (() => {
                    const grp = hostGroups.find(g => g.entity_id === hostEntityId);
                    return (
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, overflow: "hidden",
                        background: grp?.cover || "var(--accent-2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, color: "#fff", fontWeight: "bold"
                      }}>
                        {grp?.icon || grp?.name?.[0]?.toUpperCase() || "👥"}
                      </div>
                    );
                  })()}
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hosted by</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>
                      {hostEntityId === "standalone" ? ME.name : (hostGroups.find(g => g.entity_id === hostEntityId)?.name || "Select Host")}
                    </div>
                  </div>
                </div>
                <div style={{ color: "var(--ink-3)", display: "flex", alignItems: "center" }}>
                  <I.chevD style={{ width: 16, height: 16 }} />
                </div>
              </div>
            </div>
          </div>

          <div className="create-foot" style={{ border: "1px solid var(--border)", background: "var(--surface)", borderRadius: "var(--r-xl)", padding: "16px 24px", display: "flex", gap: "10px", alignItems: "center", marginTop: 24, boxShadow: "var(--sh-md)" }}>
            <button className="hbtn hbtn--ghost" onClick={() => { localStorage.removeItem(draftKey); go("home"); }} disabled={loading}>Cancel</button>
            {submitError && <span style={{ color: "red", fontSize: "12px" }}>{submitError}</span>}
            <div className="sp" style={{ flex: 1 }} />
            <button className="hbtn hbtn--ghost" onClick={() => handlePublish(true)} disabled={loading}>
              {loading ? "Saving..." : "Save draft"}
            </button>
            <button className="hbtn hbtn--ghost" style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={() => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city: "Bengaluru", cap: capacity || 180, desc, formFields, __draft: draftSnapshot })} disabled={loading}>
              <I.external /> Preview
            </button>
            <button className="hbtn hbtn--primary" onClick={() => handlePublish(false)} disabled={loading}>
              <I.check /> {loading ? "Publishing..." : "Publish Event"}
            </button>
          </div>

        </div>
      </div>

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

      {/* Host Selection Modal */}
      {hostModalOpen && (() => {
        const modalWidth = mobile ? "100%" : "520px";
        const modalHeight = mobile ? "80%" : "auto";
        const modalAlignSelf = mobile ? "flex-end" : "center";
        const modalBorderRadius = mobile ? "20px 20px 0 0" : "var(--r-xl)";

        const isCommunity = (g: any) => {
          const name = (g.name || "").toLowerCase();
          return name.includes("community") || 
                 name.includes("hub") || 
                 name.includes("collective") || 
                 name.includes("network") || 
                 name.includes("association") || 
                 name.includes("tech") || 
                 name.includes("india") || 
                 name.includes("society");
        };

        const filteredPersonal = (hostSearchQuery.trim() === "" || ME.name.toLowerCase().includes(hostSearchQuery.toLowerCase())) && (hostFilterType === "all");
        
        const filteredGroups = hostGroups.filter(g => {
          const matchesSearch = g.name.toLowerCase().includes(hostSearchQuery.toLowerCase());
          const matchesFilter = hostFilterType === "all" || hostFilterType === "group";
          return matchesSearch && matchesFilter && !isCommunity(g);
        });

        const filteredCommunities = hostGroups.filter(g => {
          const matchesSearch = g.name.toLowerCase().includes(hostSearchQuery.toLowerCase());
          const matchesFilter = hostFilterType === "all" || hostFilterType === "community";
          return matchesSearch && matchesFilter && isCommunity(g);
        });

        const handleOverlayClick = (e: any) => {
          if (e.target === e.currentTarget) {
            setHostModalOpen(false);
          }
        };

        return (
          <div 
            onClick={handleOverlayClick}
            style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: modalAlignSelf, justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <div style={{ background: "var(--surface)", width: modalWidth, maxHeight: mobile ? "90%" : "650px", height: modalHeight, borderRadius: modalBorderRadius, display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>Host As</h2>
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setHostModalOpen(false)} style={{ border: "none" }}><I.x /></button>
              </div>
              
              {/* Search and Filter Row */}
              <div style={{ padding: "16px 24px 8px 24px", display: "flex", gap: 10 }}>
                <input
                  ref={searchInputRef}
                  className="cinput"
                  placeholder="Search..."
                  value={hostSearchQuery}
                  onChange={e => setHostSearchQuery(e.target.value)}
                  style={{ flex: 1, height: 40, background: "var(--field)", border: "1px solid var(--border)" }}
                />
                <select
                  className="cselect"
                  value={hostFilterType}
                  onChange={e => setHostFilterType(e.target.value as any)}
                  style={{ width: 140, height: 40, background: "var(--field)", border: "1px solid var(--border)" }}
                >
                  <option value="all">All Types</option>
                  <option value="group">Groups</option>
                  <option value="community">Communities</option>
                </select>
              </div>

              {/* List options */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
                {/* Personal Section */}
                {filteredPersonal && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, letterSpacing: "0.05em" }}>Personal</div>
                    <button
                      type="button"
                      onClick={() => setHostEntityId("standalone")}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyItems: "flex-start", gap: 12,
                        padding: "10px 14px", borderRadius: "var(--r-md)",
                        border: hostEntityId === "standalone" ? "2px solid var(--accent-2)" : "1px solid var(--border)",
                        background: hostEntityId === "standalone" ? "var(--accent-soft)" : "var(--surface)",
                        cursor: "pointer", transition: "all 0.15s", textAlign: "left"
                      }}
                    >
                      <input type="radio" checked={hostEntityId === "standalone"} readOnly style={{ accentColor: "var(--accent-2)" }} />
                      <Avatar name={ME.name} size={28} />
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>{ME.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>Personal profile</div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Groups Section */}
                {filteredGroups.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, letterSpacing: "0.05em" }}>Groups</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredGroups.map(grp => (
                        <button
                          key={grp.entity_id}
                          type="button"
                          onClick={() => setHostEntityId(grp.entity_id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyItems: "flex-start", gap: 12,
                            padding: "10px 14px", borderRadius: "var(--r-md)",
                            border: hostEntityId === grp.entity_id ? "2px solid var(--accent-2)" : "1px solid var(--border)",
                            background: hostEntityId === grp.entity_id ? "var(--accent-soft)" : "var(--surface)",
                            cursor: "pointer", transition: "all 0.15s", textAlign: "left"
                          }}
                        >
                          <input type="radio" checked={hostEntityId === grp.entity_id} readOnly style={{ accentColor: "var(--accent-2)" }} />
                          <div style={{
                            width: 28, height: 28, borderRadius: 6, overflow: "hidden",
                            background: grp.cover || "var(--accent-2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#fff", fontWeight: "bold", flexShrink: 0
                          }}>
                            {grp.icon || grp.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>{grp.name}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>
                              {grp.role === 'owner' ? 'Owner' : 'Admin'} · Group
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Communities Section */}
                {filteredCommunities.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8, letterSpacing: "0.05em" }}>Communities</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filteredCommunities.map(grp => (
                        <button
                          key={grp.entity_id}
                          type="button"
                          onClick={() => setHostEntityId(grp.entity_id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", justifyItems: "flex-start", gap: 12,
                            padding: "10px 14px", borderRadius: "var(--r-md)",
                            border: hostEntityId === grp.entity_id ? "2px solid var(--accent-2)" : "1px solid var(--border)",
                            background: hostEntityId === grp.entity_id ? "var(--accent-soft)" : "var(--surface)",
                            cursor: "pointer", transition: "all 0.15s", textAlign: "left"
                          }}
                        >
                          <input type="radio" checked={hostEntityId === grp.entity_id} readOnly style={{ accentColor: "var(--accent-2)" }} />
                          <div style={{
                            width: 28, height: 28, borderRadius: 6, overflow: "hidden",
                            background: grp.cover || "var(--accent-2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, color: "#fff", fontWeight: "bold", flexShrink: 0
                          }}>
                            {grp.icon || grp.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 13 }}>{grp.name}</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>
                              {grp.role === 'owner' ? 'Owner' : 'Admin'} · Community
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No results empty state */}
                {!filteredPersonal && filteredGroups.length === 0 && filteredCommunities.length === 0 && (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink-3)", fontSize: 14 }}>
                    No host profiles match your search criteria.
                  </div>
                )}
              </div>

              {/* Footer buttons */}
              <div style={{ display: "flex", gap: 12, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                <button 
                  type="button" 
                  className="hbtn hbtn--ghost" 
                  style={{ flex: 1 }} 
                  onClick={() => setHostModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="hbtn hbtn--primary" 
                  style={{ flex: 1 }} 
                  onClick={() => setHostModalOpen(false)}
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

      <CapacitySettingsModal
        open={capacityModalOpen}
        onClose={() => setCapacityModalOpen(false)}
        capacityEnabled={capacityEnabled}
        setCapacityEnabled={setCapacityEnabled}
        capacity={capacity}
        setCapacity={setCapacity}
        waitlist={waitlist}
        setWaitlist={setWaitlist}
        eventMaxParticipants={eventMaxParticipants}
      />

      <AccessControlModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        mode="restricted"
        selectedAccess={selectedAccess}
        setSelectedAccess={setSelectedAccess}
      />

      <TicketSettingsModal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        type={type}
        setType={setType}
        tickets={tickets}
        setTickets={setTickets}
        setTk={setTk}
        mobile={mobile}
        upgradeModalOpen={upgradeModalOpen}
        setUpgradeModalOpen={setUpgradeModalOpen}
        upgradeFeature={upgradeFeature}
        setUpgradeFeature={setUpgradeFeature}
        st={st}
        go={go}
      />

      <QuestionnaireModal
        open={questModalOpen}
        onClose={() => setQuestModalOpen(false)}
        formFields={formFields}
        setFormFields={setFormFields}
        enableRegForm={enableRegForm}
        setEnableRegForm={setEnableRegForm}
        moveField={moveField}
      />
    </div>
    </>
  );
}

function CapacitySettingsModal({ open, onClose, capacityEnabled, setCapacityEnabled, capacity, setCapacity, waitlist, setWaitlist, eventMaxParticipants }: any) {
  const [tempEnabled, setTempEnabled] = useState(capacityEnabled);
  const [tempCapacity, setTempCapacity] = useState(capacity);
  const [tempWaitlist, setTempWaitlist] = useState(waitlist);

  useEffect(() => {
    if (open) {
      setTempEnabled(capacityEnabled);
      setTempCapacity(capacity);
      setTempWaitlist(waitlist);
    }
  }, [open, capacityEnabled, capacity, waitlist]);

  if (!open) return null;

  const handleSave = () => {
    if (tempEnabled && (!tempCapacity || parseInt(tempCapacity) < 1)) {
      alert("Please enter a valid capacity (at least 1).");
      return;
    }
    setCapacityEnabled(tempEnabled);
    setCapacity(tempEnabled ? tempCapacity : "");
    setWaitlist(tempWaitlist);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--surface)", width: 400, borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--sh-xl)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 12px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Capacity Settings</h2>
          <button className="hbtn hbtn--ghost hbtn--sm" onClick={onClose} style={{ border: "none" }}><I.x /></button>
        </div>

        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Toggle: Enable Capacity Limit */}
          <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="switch-label-wrapper">
              <span className="switch-title" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Enable Capacity Limit</span>
            </div>
            <Toggle on={tempEnabled} onClick={() => setTempEnabled(!tempEnabled)} />
          </div>

          {/* Input: Max Capacity */}
          {tempEnabled && (
            <div className="cfield" style={{ marginBottom: 0, animation: "fadeIn 0.2s" }}>
              <label style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginBottom: 8, display: "block" }}>Max Capacity</label>
              {eventMaxParticipants !== -1 && (
                <div style={{ padding: "8px 10px", background: "var(--field-2, var(--field))", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent)", fontSize: "11px", color: "var(--ink-2)", marginBottom: 12 }}>
                  🔒 Under your current plan, event capacity is capped at a maximum of <strong>{eventMaxParticipants}</strong> participants. Upgrade to Standard for unlimited capacity.
                </div>
              )}
              <input
                type="number"
                className="cinput"
                placeholder="50"
                value={tempCapacity}
                onChange={(e) => setTempCapacity(e.target.value)}
                style={{ width: "100%", background: "var(--field)", border: "1px solid var(--border)", height: 44, borderRadius: "10px", padding: "0 14px", fontSize: 14 }}
              />
            </div>
          )}

          {/* Toggle: Enable Waitlist */}
          <div className="switch-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="switch-label-wrapper" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="switch-title" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Enable Waitlist</span>
              <span className="switch-desc" style={{ fontSize: 12, color: "var(--ink-3)" }}>Registrations above capacity are added to the waitlist.</span>
            </div>
            <Toggle on={tempWaitlist} onClick={() => setTempWaitlist(!tempWaitlist)} />
          </div>
        </div>
{/* Footer */}
        <div style={{ padding: "16px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            className="hbtn hbtn--ghost"
            onClick={onClose}
            style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "999px", padding: "10px 20px", fontWeight: 600, fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            className="hbtn hbtn--primary"
            onClick={handleSave}
            style={{ background: "linear-gradient(135deg, #ff4e50, #f9d423)", border: "none", color: "#fff", borderRadius: "999px", padding: "10px 24px", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 12px rgba(255, 78, 80, 0.2)" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function CapacityModal({ open, onClose, capacity, setCapacity, waitlist, setWaitlist, eventMaxParticipants, triggerUpgrade }: any) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--surface)", width: 420, borderRadius: "20px", padding: 24, boxShadow: "var(--sh-xl)" }}>
        {/* NOTE: Max Capacity input + plan-limit notice (merged earlier) render here */}

        <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => onClose()}>Cancel</button>
          <button
            className="hbtn hbtn--primary"
            style={{ flex: 1 }}
            onClick={() => {
              if (eventMaxParticipants !== -1 && (!capacity || parseInt(capacity) > eventMaxParticipants || parseInt(capacity) < 1)) {
                alert(`Event capacity must be between 1 and ${eventMaxParticipants} participants under your current plan.`);
                triggerUpgrade(`Event Capacity > ${eventMaxParticipants}`);
                return;
              }
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

function QuestionnaireModal({ open, onClose, formFields, setFormFields, enableRegForm, setEnableRegForm, moveField }: any) {
  const [activeTab, setActiveTab] = useState("selected");
  // Custom question form states
  const [customText, setCustomText] = useState("");
  const [customType, setCustomType] = useState("text"); // "text" | "paragraph" | "options" | "social" | "company"
  const [customRequired, setCustomRequired] = useState(false);
  const [customOptions, setCustomOptions] = useState(["Option 1", "Option 2"]);
  const [editingId, setEditingId] = useState(null as string | null);
  if (!open) return null;
  const libraryQuestions = [
    { type: "text", question: "What motivates you to join?", required: false },
    { type: "social", question: "LinkedIn Profile URL", required: true, platform: "linkedin" },
    { type: "text", question: "What is your main area of interest?", required: true },
    { type: "company", question: "Company / Organization Name", required: false },
    { type: "text", question: "Dietary restrictions or allergies?", required: false },
    { type: "text", question: "Phone Number", required: false }
  ];
  const handleAddFromLibrary = (q: any) => {
    const newField = {
      id: "f-" + Date.now() + Math.random(),
      type: q.type,
      question: q.question,
      required: q.required,
      ...(q.platform ? { platform: q.platform } : {})
    };
    setFormFields([...formFields, newField]);
  };
  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const fieldData = {
      type: customType,
      question: customText.trim(),
      required: customRequired,
      ...(customType === "options" ? { options: customOptions.filter(o => o.trim() !== "") } : {})
    };
    if (editingId) {
      setFormFields(formFields.map((f: any) => f.id === editingId ? { ...f, ...fieldData } : f));
      setEditingId(null);
    } else {
      setFormFields([...formFields, { id: "f-" + Date.now(), ...fieldData }]);
    }
    setCustomText("");
    setCustomRequired(false);
    setCustomOptions(["Option 1", "Option 2"]);
    setActiveTab("selected"); // go to selected tab to see it
  };
  const handleEditField = (field: any) => {
    setEditingId(field.id);
    setCustomText(field.question || "");
    setCustomType(field.type || "text");
    setCustomRequired(!!field.required);
    setCustomOptions(field.options && field.options.length > 0 ? field.options : ["Option 1", "Option 2"]);
    setActiveTab("custom");
  };
  const handleRemove = (id: string) => {
    if (editingId === id) setEditingId(null);
    setFormFields(formFields.filter(f => f.id !== id));
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--surface)", width: 460, height: 520, borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>Join Questionnaire</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "var(--border-2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-2)" }}
          >
            <I.x style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {/* Toggle inside modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>Enable Registration Form</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Require custom questions for attendees</div>
          </div>
          <Toggle on={enableRegForm} onClick={() => setEnableRegForm(!enableRegForm)} />
        </div>
        {enableRegForm ? (
          <>
            {/* Tab Headers */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
              {["selected", "library", "custom"].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    if (tab !== "custom" && editingId) {
                      setEditingId(null);
                      setCustomText("");
                      setCustomRequired(false);
                      setCustomOptions(["Option 1", "Option 2"]);
                    }
                    setActiveTab(tab);
                  }}
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                    color: activeTab === tab ? "#6366f1" : "var(--ink-3)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    fontFamily: "inherit"
                  }}
                >
                  {tab === "selected" ? "Selected" : tab === "library" ? "Library" : "Custom"}
                </button>
              ))}
            </div>
            {/* Body Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {/* TAB 1: SELECTED */}
              {activeTab === "selected" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {formFields.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ink-3)", fontSize: 13 }}>
                      No questions added yet. Choose from the Library or add a Custom question.
                    </div>
                  ) : (
                    formFields.map((field: any, idx: number) => (
                      <div key={field.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "var(--bg-2)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)" }}>Q#{idx + 1}: {field.type}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{field.question}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{field.required ? "Required" : "Optional"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <button
                            type="button"
                            onClick={() => moveField(idx, -1)}
                            disabled={idx === 0}
                            style={{ border: "none", background: "transparent", color: idx === 0 ? "var(--border-2)" : "var(--ink-3)", cursor: idx === 0 ? "default" : "pointer", padding: 6, display: "flex" }}
                          >
                            <I.chevD style={{ width: 14, height: 14, transform: "rotate(180deg)" }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(idx, 1)}
                            disabled={idx === formFields.length - 1}
                            style={{ border: "none", background: "transparent", color: idx === formFields.length - 1 ? "var(--border-2)" : "var(--ink-3)", cursor: idx === formFields.length - 1 ? "default" : "pointer", padding: 6, display: "flex" }}
                          >
                            <I.chevD style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditField(field)}
                            style={{ border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", padding: 6, display: "flex" }}
                          >
                            <I.edit style={{ width: 16, height: 16 }} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(field.id)}
                            style={{ border: "none", background: "transparent", color: "#e5484d", cursor: "pointer", padding: 6, display: "flex" }}
                          >
                            <I.x style={{ width: 16, height: 16 }} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* TAB 2: LIBRARY */}
              {activeTab === "library" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {libraryQuestions.map((q, idx) => {
                    const alreadyAdded = formFields.some(f => f.question === q.question);
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{q.question}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Type: {q.type} • {q.required ? "Required" : "Optional"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddFromLibrary(q)}
                          disabled={alreadyAdded}
                          style={{
                            border: "none",
                            background: alreadyAdded ? "var(--border-2)" : "var(--accent-soft)",
                            color: alreadyAdded ? "var(--accent-2)" : "var(--ink-3)",
                            borderRadius: "14px",
                            padding: "6px 12px",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: alreadyAdded ? "default" : "pointer",
                            fontFamily: "inherit"
                          }}
                        >
                          {alreadyAdded ? "Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* TAB 3: CUSTOM */}
              {activeTab === "custom" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="cfield" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, display: "block" }}>Question Text</label>
                    <input
                      className="cinput"
                      placeholder="e.g. What motivates you to join?"
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      style={{ width: "100%", background: "var(--field)", border: "1px solid var(--border)", height: 44, borderRadius: "10px", padding: "0 14px" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div className="cfield" style={{ marginBottom: 0, flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, display: "block" }}>Type</label>
                      <select
                        className="cselect"
                        value={customType}
                        onChange={e => setCustomType(e.target.value)}
                        style={{ background: "var(--field)", border: "1px solid var(--border)", height: 44, borderRadius: "10px" }}
                      >
                        <option value="text">Short Answer</option>
                        <option value="paragraph">Paragraph</option>
                        <option value="options">Multiple Choice</option>
                        <option value="social">Social Link</option>
                        <option value="company">Company Info</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-2)", marginBottom: 4 }}>Required</span>
                      <Toggle on={customRequired} onClick={() => setCustomRequired(!customRequired)} />
                    </div>
                  </div>
                  {customType === "options" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, padding: 12, background: "var(--bg-2)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>Multiple Choice Options</span>
                      {customOptions.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            className="cinput"
                            placeholder={`Option ${oIdx + 1}`}
                            value={opt}
                            onChange={e => {
                              const next = [...customOptions];
                              next[oIdx] = e.target.value;
                              setCustomOptions(next);
                            }}
                            style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)", height: 36, borderRadius: "8px", padding: "0 10px", fontSize: 13 }}
                          />
                          {customOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setCustomOptions(customOptions.filter((_, idx) => idx !== oIdx))}
                              style={{ border: "none", background: "transparent", color: "#e5484d", cursor: "pointer", padding: "4px 8px" }}
                            >
                              <I.x style={{ width: 14, height: 14 }} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCustomOptions([...customOptions, ""])}
                        style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--accent-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        + Add Option
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    style={{
                      background: "linear-gradient(135deg, #ff8a00, #da1b60)",
                      border: "none",
                      color: "#fff",
                      borderRadius: "999px",
                      padding: "12px 24px",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontFamily: "inherit"
                    }}
                  >
                    {editingId ? "Save Changes" : "+ Add Question"}
                  </button>
                </div>
              )}            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", padding: 40, textAlign: "center" }}>
            <span style={{ fontSize: 40, marginBottom: 12 }}>📋</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Registration Form is Disabled</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4, maxWidth: 280 }}>Toggle it on at the top to ask custom questions.</div>
          </div>
        )}
        {/* Footer */}
        <div style={{ padding: "16px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="hbtn hbtn--primary"
            onClick={onClose}
            style={{ background: "linear-gradient(135deg, #ff4e50, #f9d423)", border: "none", color: "#fff", borderRadius: "999px", padding: "10px 24px", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 12px rgba(255, 78, 80, 0.2)" }}
          >
            Done ({enableRegForm ? formFields.length : 0} questions)
          </button>
        </div>
      </div>
    </div>
  );
}

function TicketSettingsModal({ open, onClose, type, setType, tickets, setTickets, setTk, mobile, upgradeModalOpen, setUpgradeModalOpen, upgradeFeature, setUpgradeFeature, st, go }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "var(--surface)", width: 480, maxHeight: "85vh", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>Ticket Settings</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "var(--border-2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-2)" }}
          >
            <I.x style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="cfield" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, display: "block" }}>Registration Mode</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button
                type="button"
                onClick={() => setType("free")}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: type === "free" ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                  background: type === "free" ? "var(--accent-soft)" : "var(--field)",
                  color: type === "free" ? "var(--accent-2)" : "var(--ink-2)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              >
                🎟️ Free RSVP
              </button>
              <button
                type="button"
                onClick={() => setType("paid")}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  border: type === "paid" ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
                  background: type === "paid" ? "var(--accent-soft)" : "var(--field)",
                  color: type === "paid" ? "var(--accent-2)" : "var(--ink-2)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "center",
                  outline: "none",
                  fontFamily: "inherit"
                }}
              >
                💳 Paid Tickets
              </button>
            </div>
          </div>
          {type === "paid" && (
            <div className="cfield" style={{ marginBottom: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", display: "block" }}>Ticket Tiers</label>
              <div style={{ display: "flex", gap: 8, paddingLeft: 2 }}>
                <div style={{ flex: 2, fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>Tier Name</div>
                <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>Capacity</div>
                <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>Price (₹)</div>
                {tickets.length > 1 && <div style={{ width: 36 }} />}
              </div>
              {tickets.map((t, i) => (
                <div key={i} className="ticket-row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="cinput" placeholder="e.g. General Admission" value={t.n} onChange={e => setTk(i, "n", e.target.value)} style={{ flex: 2, background: "var(--field)", border: "1px solid var(--border)" }} />
                  <input className="cinput" placeholder="Qty" value={t.cap} onChange={e => setTk(i, "cap", e.target.value)} style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)" }} />
                  <input className="cinput" placeholder="Price" value={t.price} onChange={e => setTk(i, "price", e.target.value)} style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)" }} />
                  {tickets.length > 1 && (
                    <button
                      type="button"
                      className="hbtn hbtn--ghost hbtn--sm"
                      onClick={() => setTickets(ts => ts.filter((_, j) => j !== i))}
                      style={{ padding: "0 10px", height: 42, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <I.x style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-row"
                onClick={() => setTickets(ts => [...ts, { n: "", cap: "", price: "" }])}
                style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--accent-2)", fontWeight: 600, cursor: "pointer" }}
              >
                ➕ Add ticket type
              </button>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{ padding: "16px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="hbtn hbtn--primary"
            onClick={onClose}
            style={{ borderRadius: "999px", padding: "10px 24px", fontWeight: 600, fontSize: 13 }}
          >
            Save &amp; Close
          </button>
        </div>
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


