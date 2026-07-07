const { useState, useRef, useEffect, useCallback, useMemo } = React;
const { COVERS, GROUPS, ME, EventCard, Grain, Avatar } = window;
const COVER_SWATCHES = Object.entries(COVERS).map(([k, v]) => ({ k, v }));
function CoverPicker({ value, onPick }) {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" } }, COVER_SWATCHES.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s.k,
      onClick: () => onPick(s.v),
      title: s.k,
      style: {
        width: 34,
        height: 34,
        borderRadius: 10,
        cursor: "pointer",
        background: s.v,
        border: value === s.v ? "2.5px solid var(--ink)" : "2px solid transparent",
        boxShadow: value === s.v ? "0 0 0 2px var(--surface) inset" : "var(--sh-sm)",
        transition: "transform .15s"
      }
    }
  )));
}
function Toggle({ on, onClick }) {
  return /* @__PURE__ */ React.createElement("button", { className: `tg ${on ? "on" : ""}`, onClick });
}
function format24to12(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return "";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
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
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return null;
  }
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function TimePicker({ label = void 0, value, onChange, mobile, compact }) {
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
      const now = /* @__PURE__ */ new Date();
      let currentHour = now.getHours();
      let currentMinute = Math.round(now.getMinutes() / 5) * 5;
      if (currentMinute === 60) {
        currentMinute = 0;
        currentHour = (currentHour + 1) % 24;
      }
      const defaultVal = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
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
    const timeStr = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
      if (val !== void 0) {
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
      if (val !== void 0) {
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
    const numbers = mode === "hours" ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    let angle = 0;
    if (mode === "hours") {
      angle = tempHour % 12 * 30;
    } else {
      angle = tempMin * 6;
    }
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: clockRef,
        onMouseDown: (e) => {
          e.preventDefault();
          setIsDragging(true);
          const val = calculateValFromCoords(e.clientX, e.clientY);
          if (val !== void 0) {
            if (mode === "hours") {
              setTempHour(val);
              updateTime(val, tempMin, tempAmPm);
            } else {
              setTempMin(val);
              updateTime(tempHour, val, tempAmPm);
            }
          }
        },
        style: {
          position: "relative",
          width: "200px",
          height: "200px",
          background: "var(--field)",
          borderRadius: "50%",
          margin: "16px auto",
          cursor: "pointer",
          border: "1px solid var(--border)",
          userSelect: "none"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        left: "calc(50% - 3px)",
        top: "calc(50% - 3px)",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "var(--accent-2)",
        zIndex: 3,
        pointerEvents: "none"
      } }),
      /* @__PURE__ */ React.createElement("div", { style: {
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
      } }, /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        top: "-12px",
        left: "-11px",
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background: "var(--accent-2)",
        opacity: 0.8
      } })),
      numbers.map((num, i) => {
        const numAngle = i * 30 * (Math.PI / 180);
        const radius = 72;
        const left = 100 + radius * Math.sin(numAngle);
        const top = 100 - radius * Math.cos(numAngle);
        const isSelected = mode === "hours" ? tempHour === num || tempHour === 12 && num === 12 : Math.round(tempMin / 5) * 5 === num || tempMin === 0 && num === 0;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: num,
            style: {
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
            }
          },
          mode === "minutes" ? String(num).padStart(2, "0") : num
        );
      })
    );
  };
  return /* @__PURE__ */ React.createElement("div", { ref: containerRef, style: {
    position: "relative",
    zIndex: open ? 50 : 1,
    width: compact ? "100%" : "100%",
    maxWidth: compact ? "none" : mobile ? "140px" : "130px",
    height: compact ? "100%" : "auto",
    borderLeft: compact ? "1px solid var(--border)" : "none",
    display: compact ? "flex" : "block",
    alignItems: "center"
  } }, label && /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 } }, label), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: compact ? "100%" : "auto", width: compact ? "100%" : "auto" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: compact ? "" : "cinput",
      type: "text",
      value: inputValue,
      onChange: handleInputChange,
      onBlur: handleInputBlur,
      onClick: () => setOpen(true),
      placeholder: "09:00 AM",
      style: compact ? {
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
      }
    }
  ), !compact && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-3)", fontSize: "12px" } }, "\u23F0")), open && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "8px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    boxShadow: "var(--sh-xl)",
    padding: "16px",
    zIndex: 1e3,
    width: "240px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "popUp 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", fontSize: "18px", fontWeight: "600" } }, /* @__PURE__ */ React.createElement(
    "span",
    {
      onClick: () => setMode("hours"),
      style: {
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "var(--r-sm)",
        background: mode === "hours" ? "var(--accent-soft)" : "transparent",
        color: mode === "hours" ? "var(--accent-2)" : "var(--ink)",
        border: mode === "hours" ? "1px solid var(--border)" : "1px solid transparent"
      }
    },
    String(tempHour).padStart(2, "0")
  ), /* @__PURE__ */ React.createElement("span", null, ":"), /* @__PURE__ */ React.createElement(
    "span",
    {
      onClick: () => setMode("minutes"),
      style: {
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "var(--r-sm)",
        background: mode === "minutes" ? "var(--accent-soft)" : "transparent",
        color: mode === "minutes" ? "var(--accent-2)" : "var(--ink)",
        border: mode === "minutes" ? "1px solid var(--border)" : "1px solid transparent"
      }
    },
    String(tempMin).padStart(2, "0")
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "2px", background: "var(--bg-2)", padding: "2px", borderRadius: "var(--r-sm)", marginLeft: "8px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => selectAmPm("AM"),
      style: {
        border: "none",
        padding: "4px 6px",
        fontSize: "11px",
        fontWeight: "700",
        borderRadius: "4px",
        cursor: "pointer",
        background: tempAmPm === "AM" ? "var(--surface)" : "transparent",
        color: tempAmPm === "AM" ? "var(--accent-2)" : "var(--ink-3)",
        boxShadow: tempAmPm === "AM" ? "var(--sh-sm)" : "none"
      }
    },
    "AM"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => selectAmPm("PM"),
      style: {
        border: "none",
        padding: "4px 6px",
        fontSize: "11px",
        fontWeight: "700",
        borderRadius: "4px",
        cursor: "pointer",
        background: tempAmPm === "PM" ? "var(--surface)" : "transparent",
        color: tempAmPm === "PM" ? "var(--accent-2)" : "var(--ink-3)",
        boxShadow: tempAmPm === "PM" ? "var(--sh-sm)" : "none"
      }
    },
    "PM"
  ))), renderClockFace(), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px", width: "100%", justifyContent: "flex-end", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--ghost hbtn--sm",
      onClick: () => setOpen(false),
      style: { padding: "6px 12px", border: "none" }
    },
    "Done"
  ))));
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`;
}
function DatePicker({ label = void 0, value, onChange, mobile, compact }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  useEffect(() => {
    if (open) {
      const [y, m] = value ? value.split("-").map(Number) : [null, null];
      const now = /* @__PURE__ */ new Date();
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
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };
  const selectDay = (day) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
    return /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", width: "100%" } }, WEEKDAY_LABELS.map((w) => /* @__PURE__ */ React.createElement("div", { key: w, style: { textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--ink-3)", padding: "4px 0" } }, w)), cells.map((day, i) => {
      if (day === null) return /* @__PURE__ */ React.createElement("div", { key: "e" + i });
      const isSelected = selected && selected[0] === viewYear && selected[1] === viewMonth + 1 && selected[2] === day;
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const cellDate = new Date(viewYear, viewMonth, day);
      const isPast = cellDate < today;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: day,
          type: "button",
          disabled: isPast,
          onClick: () => selectDay(day),
          style: {
            width: "100%",
            aspectRatio: "1",
            border: "none",
            borderRadius: "50%",
            cursor: isPast ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: isSelected ? 700 : 500,
            background: isSelected ? "var(--accent-2)" : "transparent",
            color: isPast ? "var(--ink-3)" : isSelected ? "#fff" : "var(--ink)",
            opacity: isPast ? 0.35 : 1,
            fontFamily: "inherit"
          }
        },
        day
      );
    }));
  };
  return /* @__PURE__ */ React.createElement("div", { ref: containerRef, style: {
    position: "relative",
    zIndex: open ? 50 : 1,
    width: compact ? "100%" : "100%",
    maxWidth: compact ? "none" : mobile ? "160px" : "150px",
    height: compact ? "100%" : "auto",
    borderLeft: compact ? "1px solid var(--border)" : "none",
    display: compact ? "flex" : "block",
    alignItems: "center"
  } }, label && /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 } }, label), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", height: compact ? "100%" : "auto", width: compact ? "100%" : "auto" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: compact ? "" : "cinput",
      type: "text",
      readOnly: true,
      value: formatDateDisplay(value),
      onClick: () => setOpen(true),
      placeholder: "Select date",
      style: compact ? {
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
      }
    }
  ), !compact && /* @__PURE__ */ React.createElement("span", { style: { position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ink-3)", fontSize: "12px" } }, "\u{1F4C5}")), open && viewYear !== null && /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "8px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    boxShadow: "var(--sh-xl)",
    padding: "16px",
    zIndex: 1e3,
    width: "260px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "popUp 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)"
  } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "8px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => goMonth(-1),
      style: { border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "var(--ink-2)", padding: "4px 8px" }
    },
    "\u2039"
  ), /* @__PURE__ */ React.createElement("span", { style: { fontSize: "14px", fontWeight: 600, color: "var(--ink)" } }, MONTH_NAMES[viewMonth], " ", viewYear), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => goMonth(1),
      style: { border: "none", background: "transparent", cursor: "pointer", fontSize: "16px", color: "var(--ink-2)", padding: "4px 8px" }
    },
    "\u203A"
  )), renderCalendarGrid()));
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
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
    const diffMins = Math.floor(diffMs / 6e4);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    let text = "";
    if (hrs > 0) {
      text += `${hrs} ${hrs === 1 ? "hour" : "hours"}`;
    }
    if (mins > 0) {
      if (text) text += " ";
      text += `${mins} ${mins === 1 ? "min" : "mins"}`;
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
  return /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick,
      style: {
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
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, marginBottom: 6, color: active ? "var(--accent-2)" : "var(--ink)" } }, title),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)", lineHeight: "1.4" } }, desc)
  );
}
function SummaryChip({ icon, label, onClick }) {
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      onClick,
      style: {
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
      },
      className: "summary-chip"
    },
    /* @__PURE__ */ React.createElement("span", null, icon, " ", label),
    /* @__PURE__ */ React.createElement("span", { style: { color: "var(--accent-2)", fontSize: 11, marginLeft: 2 } }, "\u2699\uFE0F")
  );
}
function CategorySummaryChip({ type, items, onEditClick }) {
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      style: {
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
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3DB}\uFE0F ", items.join(", ")),
    /* @__PURE__ */ React.createElement("span", { style: { cursor: "pointer", color: "var(--accent-2)", fontSize: 12, marginLeft: 4 }, onClick: onEditClick }, "\u270F\uFE0F")
  );
}
function RuleSummaryChip({ rule, onEditClick }) {
  return /* @__PURE__ */ React.createElement(
    "span",
    {
      style: {
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
      }
    },
    /* @__PURE__ */ React.createElement("span", null, "\u{1F3DB}\uFE0F ", rule.community, " \u2192 \u{1F465} ", rule.groups.join(", ")),
    /* @__PURE__ */ React.createElement("span", { style: { cursor: "pointer", color: "var(--accent-2)", fontSize: 12, marginLeft: 4 }, onClick: onEditClick }, "\u270F\uFE0F")
  );
}
let ACCESS_TREE = [
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
const isChecked = (node, selected) => {
  if (node.type === "group") {
    return selected.groups.includes(node.id);
  }
  if (!node.children || node.children.length === 0) {
    if (node.type === "subcommunity") return selected.subCommunities.includes(node.id);
    return selected.communities.includes(node.id);
  }
  return node.children.every((child) => isChecked(child, selected));
};
const isIndeterminate = (node, selected) => {
  if (node.type === "group") return false;
  if (!node.children || node.children.length === 0) return false;
  const checkedCount = node.children.filter((child) => isChecked(child, selected)).length;
  const indetCount = node.children.filter((child) => isIndeterminate(child, selected)).length;
  const allChecked = checkedCount === node.children.length;
  const noneChecked = checkedCount === 0 && indetCount === 0;
  return !allChecked && !noneChecked;
};
const getDescendantIds = (node) => {
  const res = { communities: [], subCommunities: [], groups: [] };
  if (node.type === "community") {
    res.communities.push(node.id);
  } else if (node.type === "subcommunity") {
    res.subCommunities.push(node.id);
  } else if (node.type === "group") {
    res.groups.push(node.id);
  }
  if (node.children) {
    node.children.forEach((child) => {
      const childRes = getDescendantIds(child);
      res.communities.push(...childRes.communities);
      res.subCommunities.push(...childRes.subCommunities);
      res.groups.push(...childRes.groups);
    });
  }
  return res;
};
const findParentPath = (id, tree) => {
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
const toggleNodeCheck = (node, selected) => {
  const checked = isChecked(node, selected);
  const desc = getDescendantIds(node);
  let nextCommunities = [...selected.communities];
  let nextSubCommunities = [...selected.subCommunities];
  let nextGroups = [...selected.groups];
  if (checked) {
    nextCommunities = nextCommunities.filter((id) => !desc.communities.includes(id));
    nextSubCommunities = nextSubCommunities.filter((id) => !desc.subCommunities.includes(id));
    nextGroups = nextGroups.filter((id) => !desc.groups.includes(id));
    const parentPath = findParentPath(node.id, ACCESS_TREE);
    parentPath.forEach((p) => {
      if (p.type === "community") {
        nextCommunities = nextCommunities.filter((id) => id !== p.id);
      } else if (p.type === "subcommunity") {
        nextSubCommunities = nextSubCommunities.filter((id) => id !== p.id);
      }
    });
  } else {
    desc.communities.forEach((id) => {
      if (!nextCommunities.includes(id)) nextCommunities.push(id);
    });
    desc.subCommunities.forEach((id) => {
      if (!nextSubCommunities.includes(id)) nextSubCommunities.push(id);
    });
    desc.groups.forEach((id) => {
      if (!nextGroups.includes(id)) nextGroups.push(id);
    });
    let changed = true;
    while (changed) {
      changed = false;
      for (const comm of ACCESS_TREE) {
        if (comm.children && comm.children.length > 0) {
          const allChildrenChecked = comm.children.every((sub) => {
            if (sub.children && sub.children.length > 0) {
              const allSubChecked = sub.children.every((grp) => nextGroups.includes(grp.id));
              return allSubChecked;
            }
            return nextSubCommunities.includes(sub.id);
          });
          if (allChildrenChecked && !nextCommunities.includes(comm.id)) {
            nextCommunities.push(comm.id);
            changed = true;
          }
          comm.children.forEach((sub) => {
            if (sub.children && sub.children.length > 0) {
              const allSubChecked = sub.children.every((grp) => nextGroups.includes(grp.id));
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
const nodeMatchesSearch = (node, query) => {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true;
  if (node.children) {
    return node.children.some((child) => nodeMatchesSearch(child, query));
  }
  return false;
};
const getSearchAutoExpandedIds = (query) => {
  const ids = /* @__PURE__ */ new Set();
  if (!query) return ids;
  ACCESS_TREE.forEach((comm) => {
    let commMatches = false;
    if (comm.children) {
      comm.children.forEach((sub) => {
        let subMatches = false;
        if (sub.children) {
          sub.children.forEach((grp) => {
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
function TreeNodeCheckbox({ checked, indeterminate, onChange }) {
  return /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked,
      ref: (el) => {
        if (el) el.indeterminate = indeterminate;
      },
      onChange,
      style: { cursor: "pointer", width: 15, height: 15, accentColor: "var(--accent-2)" }
    }
  );
}
const getTopLevelCheckedNodes = (tree, selected) => {
  const list = [];
  const traverse = (node) => {
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
const getSelectedNodesWithDetails = (tree, selected) => {
  const result = [];
  const traverse = (node) => {
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
const findNodeInTree = (id, tree) => {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(id, node.children);
      if (found) return found;
    }
  }
  return null;
};
function AccessControlModal({ open, onClose, mode, selectedAccess, setSelectedAccess }) {
  const [search, setSearch] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState(/* @__PURE__ */ new Set());
  const [ruleCommunity, setRuleCommunity] = useState("Samaagum Hub");
  const [ruleGroups, setRuleGroups] = useState([]);
  if (!open) return null;
  const searchAutoExpandedIds = getSearchAutoExpandedIds(search);
  const isNodeExpanded = (nodeId) => {
    return expandedNodeIds.has(nodeId) || searchAutoExpandedIds.has(nodeId);
  };
  const toggleNodeExpansion = (nodeId) => {
    const next = new Set(expandedNodeIds);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setExpandedNodeIds(next);
  };
  const selectAllNodes = () => {
    const communities = [];
    const subCommunities = [];
    const groups = [];
    ACCESS_TREE.forEach((comm) => {
      communities.push(comm.id);
      if (comm.children) {
        comm.children.forEach((sub) => {
          subCommunities.push(sub.id);
          if (sub.children) {
            sub.children.forEach((grp) => {
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
  const communitiesList = ACCESS_TREE.map((c) => c.name);
  const getGroupsForCommunityName = (commName) => {
    const comm = ACCESS_TREE.find((c) => c.name === commName);
    if (!comm) return [];
    const groups = [];
    comm.children.forEach((sub) => {
      sub.children.forEach((grp) => {
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
      selectedMembers: selectedAccess.selectedMembers.filter((r) => r.id !== id)
    });
  };
  const renderTreeNode = (node, level = 0) => {
    if (search && !nodeMatchesSearch(node, search)) {
      return null;
    }
    const nodeChecked = isChecked(node, selectedAccess.restricted);
    const nodeIndeterminate = isIndeterminate(node, selectedAccess.restricted);
    const hasChildren = node.children && node.children.length > 0;
    const expanded = isNodeExpanded(node.id);
    const icon = node.type === "community" ? "\u{1F3DB}\uFE0F" : node.type === "subcommunity" ? "\u{1F4C1}" : "\u{1F465}";
    return /* @__PURE__ */ React.createElement("div", { key: node.id, style: { display: "flex", flexDirection: "column" } }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "tree-node-row",
        onClick: () => {
          const nextRestricted = toggleNodeCheck(node, selectedAccess.restricted);
          setSelectedAccess({
            ...selectedAccess,
            restricted: nextRestricted
          });
        },
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: "var(--r-md)",
          cursor: "pointer",
          marginLeft: level * 20,
          userSelect: "none",
          transition: "background 0.15s ease"
        }
      },
      hasChildren ? /* @__PURE__ */ React.createElement(
        "span",
        {
          onClick: (e) => {
            e.stopPropagation();
            toggleNodeExpansion(node.id);
          },
          style: {
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
          }
        },
        "\u25B6"
      ) : /* @__PURE__ */ React.createElement("span", { style: { width: 16 } }),
      /* @__PURE__ */ React.createElement("span", { onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
        TreeNodeCheckbox,
        {
          checked: nodeChecked,
          indeterminate: nodeIndeterminate,
          onChange: () => {
            const nextRestricted = toggleNodeCheck(node, selectedAccess.restricted);
            setSelectedAccess({
              ...selectedAccess,
              restricted: nextRestricted
            });
          }
        }
      )),
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontSize: 13,
            fontWeight: node.type === "community" ? 600 : 500,
            color: "var(--ink)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flex: 1
          }
        },
        /* @__PURE__ */ React.createElement("span", null, icon),
        /* @__PURE__ */ React.createElement("span", null, node.name)
      )
    ), hasChildren && expanded && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, node.children.map((child) => renderTreeNode(child, level + 1))));
  };
  const allSelectedDetails = getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted);
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("style", null, `
        .tree-node-row:hover {
          background: var(--bg-2) !important;
        }
      `), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 500, maxHeight: "85vh", borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" } }, mode === "restricted" ? "Restricted Access Settings" : "Configure Allowed Members"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "hbtn hbtn--ghost hbtn--sm", onClick: onClose, style: { border: "none" } }, /* @__PURE__ */ React.createElement(I.x, null))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: 24 } }, mode === "restricted" ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12, padding: "0 4px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 } }, "Selection Summary"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, fontSize: 12, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F3DB}\uFE0F ", selectedAccess.restricted.communities.length, " Communities"), /* @__PURE__ */ React.createElement("span", null, "\u{1F4C1} ", selectedAccess.restricted.subCommunities.length, " Sub-Communities"), /* @__PURE__ */ React.createElement("span", null, "\u{1F465} ", selectedAccess.restricted.groups.length, " Groups")), allSelectedDetails.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 12px", background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", maxHeight: 120, overflowY: "auto" } }, allSelectedDetails.map((node) => {
    const icon = node.type === "community" ? "\u{1F3DB}\uFE0F" : node.type === "subcommunity" ? "\u{1F4C1}" : "\u{1F465}";
    return /* @__PURE__ */ React.createElement("span", { key: node.id, style: { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--accent-soft)", color: "var(--accent-2)", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999 } }, /* @__PURE__ */ React.createElement("span", null, icon, " ", node.name), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: { cursor: "pointer", marginLeft: 4, opacity: 0.8 },
        onClick: () => {
          const fullNode = findNodeInTree(node.id, ACCESS_TREE);
          if (fullNode) {
            const nextRestricted = toggleNodeCheck(fullNode, selectedAccess.restricted);
            setSelectedAccess({
              ...selectedAccess,
              restricted: nextRestricted
            });
          }
        }
      },
      "\u2715"
    ));
  }))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cinput",
      placeholder: "Search by community, sub-community, or group...",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      style: { flex: 1, background: "var(--field)", border: "1px solid var(--border)", marginBottom: 0 }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--ghost hbtn--sm",
      onClick: selectAllNodes,
      style: { padding: "8px 12px", fontSize: 12, height: 38 }
    },
    "Select All"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--ghost hbtn--sm",
      onClick: clearAllNodes,
      style: { padding: "8px 12px", fontSize: 12, color: "#e5484d", height: 38 }
    },
    "Clear All"
  ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 12, background: "var(--bg)" } }, ACCESS_TREE.map((node) => renderTreeNode(node, 0)))) : /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { padding: 16, background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 12 } }, "Define Access Rule"), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", null, "Select Community"), /* @__PURE__ */ React.createElement("select", { className: "cselect", value: ruleCommunity, onChange: (e) => {
    setRuleCommunity(e.target.value);
    const list = getGroupsForCommunityName(e.target.value);
    setRuleGroups([]);
  }, style: { background: "var(--surface)" } }, communitiesList.map((c) => /* @__PURE__ */ React.createElement("option", { key: c, value: c }, c)))), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", null, "Allowed Groups (Ctrl+Click to multi-select)"), /* @__PURE__ */ React.createElement(
    "select",
    {
      multiple: true,
      className: "cselect",
      value: ruleGroups,
      onChange: (e) => setRuleGroups(Array.from(e.target.selectedOptions, (option) => option.value)),
      style: { background: "var(--surface)", height: 120 }
    },
    ruleGroupsList.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))
  )), /* @__PURE__ */ React.createElement("button", { type: "button", className: "hbtn hbtn--primary hbtn--sm", onClick: handleAddRule, style: { width: "100%" } }, "\u2795 Add Access Rule")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 8 } }, "Active Rules"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" } }, selectedAccess.selectedMembers.map((rule) => /* @__PURE__ */ React.createElement("div", { key: rule.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--ink)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, rule.community), " \u2192 ", rule.groups.join(", ")), /* @__PURE__ */ React.createElement("button", { type: "button", className: "hbtn hbtn--ghost hbtn--sm", onClick: () => handleRemoveRule(rule.id), style: { color: "#e5484d", border: "none" } }, "\u2715"))), selectedAccess.selectedMembers.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontStyle: "italic", color: "var(--ink-3)", fontSize: 13 } }, "No rules defined yet.")))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--bg-2)" } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "hbtn hbtn--primary", onClick: onClose }, "Save & Close"))));
}
const RECENT_LOCATIONS = [
  {
    name: "Delhi darbar hotel",
    address: "51, Jawahar Marg, Jhanda Chowk, Indore, Madhya Pradesh 452007, India"
  }
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
  const displaySub = venue ? locType === "online" ? "Virtual event" : venue : "Offline location or virtual link";
  return /* @__PURE__ */ React.createElement("div", { className: "loc-sec-container" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setIsOpen((o) => !o),
      className: "loc-sec-header"
    },
    /* @__PURE__ */ React.createElement("span", { className: "loc-sec-icon-wrapper" }, /* @__PURE__ */ React.createElement(I.pin, { style: { width: 18, height: 18, color: "var(--accent-2)" } })),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--ink)", lineHeight: "1.2" } }, displayTitle), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0", fontSize: "12px", color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, displaySub)),
    /* @__PURE__ */ React.createElement("span", { style: { transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", color: "var(--ink-3)", display: "flex", alignItems: "center" } }, /* @__PURE__ */ React.createElement(I.chevD, null))
  ), isOpen && /* @__PURE__ */ React.createElement("div", { className: "loc-sec-panel" }, /* @__PURE__ */ React.createElement("div", { className: "loc-sec-input-wrapper" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      autoFocus: true,
      type: "text",
      value: draft,
      onChange: handleInput,
      onKeyDown: (e) => {
        if (e.key === "Enter" && draft.trim()) {
          commit(draft.trim(), draft.startsWith("http") ? "online" : "physical");
        }
        if (e.key === "Escape") setIsOpen(false);
      },
      placeholder: "Enter location or virtual link...",
      className: "cinput",
      style: { width: "100%", background: "var(--field)", border: "1px solid var(--border)" }
    }
  )), RECENT_LOCATIONS.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "loc-sec-label" }, "Recent Locations"), RECENT_LOCATIONS.map((loc, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: i,
      type: "button",
      onClick: () => commit(loc.address, "physical"),
      className: "loc-sec-btn"
    },
    /* @__PURE__ */ React.createElement(I.pin, { style: { width: 15, height: 15, color: "var(--ink-3)", marginTop: 2, flexShrink: 0 } }),
    /* @__PURE__ */ React.createElement("div", { className: "loc-sec-btn-content" }, /* @__PURE__ */ React.createElement("p", { style: { margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--ink)", lineHeight: "1.2" } }, loc.name), /* @__PURE__ */ React.createElement("p", { style: { margin: "2px 0 0", fontSize: "11px", color: "var(--ink-3)" } }, loc.address))
  ))), /* @__PURE__ */ React.createElement("hr", { style: { border: "none", borderTop: "1px solid var(--border-2)", margin: "8px 16px" } }), /* @__PURE__ */ React.createElement("p", { className: "loc-sec-label" }, "Virtual Options"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => commit("https://zoom.us/j/", "online"),
      className: "loc-sec-btn",
      style: { alignItems: "center" }
    },
    /* @__PURE__ */ React.createElement(I.online, { style: { width: 16, height: 16, color: "var(--accent-1)", flexShrink: 0 } }),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: "13px", color: "var(--ink)" } }, "Create Zoom meeting")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => commit("https://meet.google.com/", "online"),
      className: "loc-sec-btn",
      style: { alignItems: "center" }
    },
    /* @__PURE__ */ React.createElement(I.online, { style: { width: 16, height: 16, color: "var(--accent-2)", flexShrink: 0 } }),
    /* @__PURE__ */ React.createElement("span", { style: { fontSize: "13px", color: "var(--ink)" } }, "Create Google Meet")
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, padding: "12px 16px 16px", color: "var(--ink-3)", fontSize: "12px" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4A1}"), /* @__PURE__ */ React.createElement("span", null, "If you have a virtual event link, you can enter or paste it above. Press ", /* @__PURE__ */ React.createElement("b", null, "Enter"), " to save."))), venue && locType === "physical" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement(
    "iframe",
    {
      width: "100%",
      height: "180",
      src: `https://maps.google.com/maps?q=${encodeURIComponent(venue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`,
      frameBorder: "0",
      style: { border: 0, display: "block" },
      allowFullScreen: true
    }
  )));
}
function CreateEvent({ go, mobile, st, editEv, hostGroupId, hostGroupName }) {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const draftKey = "sg_draft_event";
  const savedDraft = JSON.parse(localStorage.getItem(draftKey) || "{}");
  const draft = editEv && editEv.__draft || null;
  const [hostEntityId, setHostEntityId] = useState(draft?.hostEntityId || savedDraft.hostEntityId || hostGroupId || "standalone");
  const [hostGroups, setHostGroups] = useState([]);
  const [dbGroups, setDbGroups] = useState([]);
  const [accessTreeUpdated, setAccessTreeUpdated] = useState(0);
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        fetch(`${apiBase}/api/groups/mine/as-host`, { headers }).then((r) => r.json()).then((d) => {
          if (d.success) setHostGroups(d.data);
        }).catch(console.error);
        const res = await fetch(`${apiBase}/api/groups`, {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success && data.data) {
          setDbGroups(data.data);
          ACCESS_TREE = data.data.map((g) => ({
            id: g.id,
            name: g.name,
            type: "group"
          }));
          setAccessTreeUpdated((prev) => prev + 1);
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
  const [visibility, setVisibility] = useState(draft?.visibility ?? editEv?.venue_raw?.visibility ?? editEv?.venue?.visibility ?? "public");
  const [calendar, setCalendar] = useState(draft?.calendar ?? "Main Calendar");
  const initDT = useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const currentDate = `${yyyy}-${mm}-${dd}`;
    let currentHour = now.getHours();
    let currentMinute = Math.round(now.getMinutes() / 5) * 5;
    if (currentMinute === 60) {
      currentMinute = 0;
      currentHour = (currentHour + 1) % 24;
    }
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    let endHour = (currentHour + 1) % 24;
    const currentEndTime = `${String(endHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    let endDateStr = currentDate;
    if (currentHour === 23) {
      const endNow = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
      const eyyyy = endNow.getFullYear();
      const emm = String(endNow.getMonth() + 1).padStart(2, "0");
      const edd = String(endNow.getDate()).padStart(2, "0");
      endDateStr = `${eyyyy}-${emm}-${edd}`;
    }
    return { currentDate, currentTime, endDateStr, currentEndTime };
  }, []);
  const startsAt = editEv?.starts_at ? new Date(editEv.starts_at) : null;
  const endsAt = editEv?.ends_at ? new Date(editEv.ends_at) : null;
  const editStartDate = startsAt ? `${startsAt.getFullYear()}-${String(startsAt.getMonth() + 1).padStart(2, "0")}-${String(startsAt.getDate()).padStart(2, "0")}` : "";
  const editStartTime = startsAt ? `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}` : "";
  const editEndDate = endsAt ? `${endsAt.getFullYear()}-${String(endsAt.getMonth() + 1).padStart(2, "0")}-${String(endsAt.getDate()).padStart(2, "0")}` : "";
  const editEndTime = endsAt ? `${String(endsAt.getHours()).padStart(2, "0")}:${String(endsAt.getMinutes()).padStart(2, "0")}` : "";
  const [startDate, setStartDate] = useState(draft?.startDate ?? (editEv ? editStartDate : savedDraft.startDate) ?? initDT.currentDate);
  const [startTime, setStartTime] = useState(draft?.startTime ?? (editEv ? editStartTime : savedDraft.startTime) ?? initDT.currentTime);
  const [endDate, setEndDate] = useState(draft?.endDate ?? (editEv ? editEndDate : savedDraft.endDate) ?? initDT.endDateStr);
  const [endTime, setEndTime] = useState(draft?.endTime ?? (editEv ? editEndTime : savedDraft.endTime) ?? initDT.currentEndTime);
  useEffect(() => {
    if (editEv?.id && editEv.id !== "new") return;
    const now = /* @__PURE__ */ new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;
    if (startDate && startDate < todayStr) {
      setStartDate(todayStr);
    }
    if (endDate && endDate < todayStr) {
      setEndDate(todayStr);
    }
    if (startDate === todayStr && startTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      if (sh < nowH || sh === nowH && sm < nowM) {
        let currentHour = now.getHours();
        let currentMinute = Math.round(now.getMinutes() / 5) * 5;
        if (currentMinute === 60) {
          currentMinute = 0;
          currentHour = (currentHour + 1) % 24;
        }
        setStartTime(`${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`);
      }
    }
    if (endDate === todayStr && endTime) {
      const [eh, em] = endTime.split(":").map(Number);
      const nowH = now.getHours();
      const nowM = now.getMinutes();
      if (eh < nowH || eh === nowH && em < nowM) {
        let currentHour = now.getHours();
        let currentMinute = Math.round(now.getMinutes() / 5) * 5;
        if (currentMinute === 60) {
          currentMinute = 0;
          currentHour = (currentHour + 1) % 24;
        }
        let endHour = (currentHour + 1) % 24;
        setEndTime(`${String(endHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`);
      }
    }
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
  const [locType, setLocType] = useState(draft?.locType ?? (editEv?.location_type === "online" ? "online" : "physical"));
  const [venue, setVenue] = useState(draft?.venue ?? (editEv?.location_type === "online" ? editEv?.online_link : editEv?.venue_raw?.name ?? editEv?.venue_raw?.address ?? editEv?.venue?.name ?? editEv?.venue?.address ?? ""));
  const [desc, setDesc] = useState(draft?.desc ?? editEv?.description ?? editEv?.desc ?? "");
  const [tzModalOpen, setTzModalOpen] = useState(false);
  const [tzSearchQuery, setTzSearchQuery] = useState("");
  const [type, setType] = useState(draft?.type ?? (editEv?.registration_mode === "free_rsvp" || editEv?.registration_mode === "free" ? "free" : "paid"));
  const [approval, setApproval] = useState(draft?.approval ?? editEv?.approval_required ?? false);
  const [capacityEnabled, setCapacityEnabled] = useState(draft?.capacityEnabled ?? !!editEv?.capacity_total);
  const [capacity, setCapacity] = useState(draft?.capacity ?? editEv?.capacity_total ?? "");
  const [waitlist, setWaitlist] = useState(draft?.waitlist ?? editEv?.waitlist ?? false);
  const initialTickets = editEv?.tickets ? editEv.tickets.map((t) => ({ n: t.name, cap: String(t.capacity || ""), price: String((t.price_minor || 0) / 100) })) : [{ n: "Early Bird", cap: "50", price: "499" }];
  const [tickets, setTickets] = useState(draft?.tickets ?? initialTickets);
  const [tags, setTags] = useState(draft?.tags ?? editEv?.venue_raw?.meta?.tags ?? editEv?.venue?.meta?.tags ?? ["Startup", "Technology"]);
  const [tagInput, setTagInput] = useState("");
  const [cat, setCat] = useState(draft?.cat ?? editEv?.venue_raw?.meta?.category ?? editEv?.venue?.meta?.category ?? "Startups");
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [calModalOpen, setCalModalOpen] = useState(false);
  const [descModalOpen, setDescModalOpen] = useState(false);
  const [instructions, setInstructions] = useState(draft?.instructions ?? editEv?.venue_raw?.meta?.instructions ?? editEv?.venue?.meta?.instructions ?? editEv?.instructions ?? editEv?.instructions ?? "");
  const [instModalOpen, setInstModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInstModalOpen, setAiInstModalOpen] = useState(false);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [joinEligibility, setJoinEligibility] = useState(draft?.joinEligibility ?? editEv?.venue_raw?.meta?.joinEligibility ?? editEv?.venue?.meta?.joinEligibility ?? "public");
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(draft?.selectedAccess ?? editEv?.venue_raw?.meta?.selectedAccess ?? editEv?.venue?.meta?.selectedAccess ?? {
    restricted: {
      communities: [],
      subCommunities: [],
      groups: []
    },
    selectedMembers: []
  });
  const [enableRegForm, setEnableRegForm] = useState(draft?.enableRegForm ?? editEv?.venue?.meta?.enableRegForm ?? false);
  const [formFields, setFormFields] = useState(draft?.formFields ?? editEv?.venue?.meta?.formFields ?? [
    { id: "f-1", type: "text", question: "What is your main area of interest?", required: true, responseType: "short" },
    { id: "f-2", type: "social", question: "LinkedIn Profile URL", required: true, platform: "linkedin" }
  ]);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);
  const creatorEntities = React.useMemo(() => {
    return [
      { id: "e-parent", name: "Samaagum Hub", type: "Community (Parent)" },
      ...typeof GROUPS !== "undefined" ? GROUPS.map((g) => ({ id: `grp-${g.id}`, name: g.name, type: "Group" })) : [],
      { id: "e-same", name: "Samaagum Developers", type: "Entity (Same-level)" }
    ];
  }, []);
  const [customEntities, setCustomEntities] = useState(draft?.customEntities ?? ["BLR Founders Collective"]);
  const [enableSponsors, setEnableSponsors] = useState(draft?.enableSponsors ?? editEv?.venue?.meta?.enableSponsors ?? false);
  const [selectedSponsorIds, setSelectedSponsorIds] = useState(draft?.selectedSponsorIds ?? editEv?.venue?.meta?.selectedSponsorIds ?? ["sp-1", "sp-3"]);
  const [sponsorSearchQuery, setSponsorSearchQuery] = useState("");
  const [debouncedSponsorQuery, setDebouncedSponsorQuery] = useState("");
  const [sponsorVisibility, setSponsorVisibility] = useState(draft?.sponsorVisibility ?? editEv?.venue?.meta?.sponsorVisibility ?? "public");
  const [sponsorPage, setSponsorPage] = useState(1);
  const SPONSORS_PER_PAGE = 3;
  const ALL_SPONSORS = [
    { id: "sp-1", name: "Google Cloud", org: "Google Inc.", email: "sponsorship@google.com" },
    { id: "sp-2", name: "Vercel", org: "Vercel Inc.", email: "sponsor@vercel.com" },
    { id: "sp-3", name: "GitHub Enterprise", org: "GitHub Inc.", email: "partner@github.com" },
    { id: "sp-4", name: "Stripe India", org: "Stripe", email: "stripe-sponsorship@stripe.com" },
    { id: "sp-5", name: "Figma India", org: "Figma", email: "sponsors@figma.com" }
  ];
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSponsorQuery(sponsorSearchQuery);
      setSponsorPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [sponsorSearchQuery]);
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
      setBannerError(err.message);
      setIsUploadingBanner(false);
    }
  };
  const addField = (type2) => {
    const id = "f-" + Date.now();
    let newField = { id, type: type2, question: "", required: true };
    if (type2 === "text") {
      newField.question = "Short Question Label";
      newField.responseType = "short";
    } else if (type2 === "options") {
      newField.question = "Select an option";
      newField.options = ["Option 1", "Option 2"];
      newField.selectionType = "single";
    } else if (type2 === "social") {
      newField.question = "Profile Link";
      newField.platform = "linkedin";
    } else if (type2 === "company") {
      newField.question = "Work details";
      newField.collectJobTitle = true;
    } else if (type2 === "checkbox") {
      newField.question = "I agree to the terms";
    } else if (type2 === "terms") {
      newField.question = "Agreement Details";
      newField.termsText = "Please agree to our terms of conduct.";
      newField.termsLinks = "https://samaagum.co/terms";
      newField.showTextBeforeAccept = true;
      newField.collectSignature = false;
    } else if (type2 === "phone") {
      newField.question = "Contact Number";
    } else if (type2 === "website") {
      newField.question = "Website / Portfolio";
    }
    setFormFields([...formFields, newField]);
    setActiveFieldId(id);
  };
  const deleteField = (id) => {
    setFormFields(formFields.filter((f) => f.id !== id));
  };
  const editField = (id, updates) => {
    setFormFields(formFields.map((f) => f.id === id ? { ...f, ...updates } : f));
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
  useEffect(() => {
    if (title && (!slug || slug === title.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""))) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  }, [title]);
  const setTk = (i, key, v) => setTickets((ts) => ts.map((t, j) => j === i ? { ...t, [key]: v } : t));
  const previewEv = {
    cover,
    cat,
    type: type === "free" ? "Free" : "Paid",
    online: locType === "online",
    month: "JUN",
    day: "18",
    title: title || "Your event title",
    date: startDate || "Date TBD",
    time: startTime ? format24to12(startTime) : "Time TBD",
    venue: locType === "online" ? "Online" : venue || "Venue TBD",
    going: 0,
    price: type === "paid" ? `\u20B9${tickets[0]?.price || "\u2014"}` : "Free",
    attendees: []
  };
  const draftSnapshot = {
    title,
    slug,
    cover,
    visibility,
    calendar,
    startDate,
    startTime,
    endDate,
    endTime,
    timezone,
    locType,
    venue,
    desc,
    type,
    approval,
    capacityEnabled,
    capacity,
    waitlist,
    tickets,
    tags,
    cat,
    instructions,
    joinEligibility,
    selectedAccess,
    enableRegForm,
    formFields,
    enableSponsors,
    hostEntityId,
    customEntities,
    selectedSponsorIds,
    sponsorVisibility
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
  const pct = Math.round(completeness / 5 * 100);
  const renderPreviewPanel = (isMobileStacked = false) => {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: isMobileStacked ? "mobile-preview-stacked" : "create-preview",
        style: isMobileStacked ? {
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
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "pv-label", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("span", { className: "d" }), "Live preview"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 4, background: "var(--border)", padding: 4, borderRadius: 999 } }, /* @__PURE__ */ React.createElement("button", { style: { padding: "4px 12px", fontSize: 12, fontWeight: 600, background: "var(--surface)", borderRadius: 999, border: "none", boxShadow: "var(--sh-sm)" } }, "Card"), /* @__PURE__ */ React.createElement("button", { style: { padding: "4px 12px", fontSize: 12, fontWeight: 600, background: "transparent", borderRadius: 999, border: "none", color: "var(--ink-2)" } }, "Mobile"))),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "20px" } }, /* @__PURE__ */ React.createElement(EventCard, { ev: previewEv, onOpen: () => {
      }, saved: false, onSave: () => {
      } }), /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 } }, "Visibility Preview"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--ink)" } }, "Mode: ", /* @__PURE__ */ React.createElement("span", { style: { textTransform: "capitalize", color: "var(--accent-2)" } }, visibility)), visibility === "custom" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 12, color: "var(--ink-2)" } }, "Visible to: ", customEntities.filter((c) => customEntities.includes(c)).join(", ") || "None")), enableRegForm && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 12 } }, "Registration Form Preview"), formFields.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" } }, "No questions added yet. Default fields (Name, Email) will be collected.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, formFields.map((field, idx) => /* @__PURE__ */ React.createElement("div", { key: field.id, style: { borderBottom: idx < formFields.length - 1 ? "1px solid var(--border-2)" : "none", paddingBottom: idx < formFields.length - 1 ? 12 : 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 } }, field.question || "Untitled Question", " ", field.required && /* @__PURE__ */ React.createElement("span", { style: { color: "#e5484d" } }, "*")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 } }, "Type: ", field.type), field.type === "text" && /* @__PURE__ */ React.createElement("input", { className: "cinput", readOnly: true, placeholder: field.responseType === "paragraph" ? "Long answer text..." : "Short answer text...", style: { background: "var(--bg-2)", fontSize: 12, padding: "8px 12px" } }), field.type === "options" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, (field.options || []).map((opt, oIdx) => /* @__PURE__ */ React.createElement("label", { key: oIdx, style: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-2)" } }, /* @__PURE__ */ React.createElement("input", { type: field.selectionType === "multiple" ? "checkbox" : "radio", disabled: true }), /* @__PURE__ */ React.createElement("span", null, opt)))), field.type === "social" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, background: "var(--border)", padding: "3px 6px", borderRadius: 4, color: "var(--ink-2)" } }, field.platform === "any" ? "Any URL" : field.platform.toUpperCase()), /* @__PURE__ */ React.createElement("input", { className: "cinput", readOnly: true, placeholder: "Profile URL", style: { background: "var(--bg-2)", fontSize: 11, padding: "6px 10px", flex: 1 } })), field.type === "company" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("input", { className: "cinput", readOnly: true, placeholder: "Company Name", style: { background: "var(--bg-2)", fontSize: 11, padding: "6px 10px" } }), field.collectJobTitle && /* @__PURE__ */ React.createElement("input", { className: "cinput", readOnly: true, placeholder: "Job Title", style: { background: "var(--bg-2)", fontSize: 11, padding: "6px 10px" } })), field.type === "checkbox" && /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "var(--ink-2)" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", disabled: true }), /* @__PURE__ */ React.createElement("span", null, field.question || "Tick this box")), field.type === "terms" && /* @__PURE__ */ React.createElement("div", { style: { padding: 8, background: "var(--bg-2)", borderRadius: 6, border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-2)", whiteSpace: "pre-wrap" } }, field.termsText), field.termsLinks && /* @__PURE__ */ React.createElement("a", { href: field.termsLinks, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 11, color: "var(--accent-2)", textDecoration: "underline", display: "block", marginTop: 4 } }, "View Terms Link"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginTop: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", disabled: true }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--ink-3)" } }, "I accept the terms"))), field.type === "phone" && /* @__PURE__ */ React.createElement("input", { className: "cinput", readOnly: true, placeholder: "+1 (555) 000-0000", style: { background: "var(--bg-2)", fontSize: 12, padding: "8px 12px" } }), field.type === "website" && /* @__PURE__ */ React.createElement("input", { className: "cinput", readOnly: true, placeholder: "https://yourwebsite.com", style: { background: "var(--bg-2)", fontSize: 12, padding: "8px 12px" } }))))), enableSponsors && /* @__PURE__ */ React.createElement("div", { style: cardStyle }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 8 } }, "Sponsors Preview"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 } }, "Visibility: ", /* @__PURE__ */ React.createElement("span", { style: { textTransform: "capitalize", color: "var(--accent-2)" } }, sponsorVisibility)), selectedSponsorIds.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", fontStyle: "italic" } }, "No sponsors selected.") : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 } }, selectedSponsorIds.map((id) => {
        const sp = ALL_SPONSORS.find((s) => s.id === id);
        return sp ? /* @__PURE__ */ React.createElement("div", { key: sp.id, style: { display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "var(--ink)" } }, sp.name)) : null;
      }))), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface)", boxShadow: "var(--sh-sm)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 16 } }, "Event Completeness (", pct, "%)"), /* @__PURE__ */ React.createElement("div", { style: { height: 6, background: "var(--border)", borderRadius: 999, marginBottom: 16, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { height: "100%", width: `${pct}%`, background: "var(--accent-2)", borderRadius: 999 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: title ? "var(--ink)" : "var(--ink-3)" } }, /* @__PURE__ */ React.createElement(I.check, { style: { color: title ? "var(--accent-2)" : "var(--ink-3)", width: 14 } }), " Title "), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: startDate ? "var(--ink)" : "var(--ink-3)" } }, /* @__PURE__ */ React.createElement(I.check, { style: { color: startDate ? "var(--accent-2)" : "var(--ink-3)", width: 14 } }), " Date & Time"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: venue ? "var(--ink)" : "var(--ink-3)" } }, /* @__PURE__ */ React.createElement(I.check, { style: { color: venue ? "var(--accent-2)" : "var(--ink-3)", width: 14 } }), " Location"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: desc ? "var(--ink)" : "var(--ink-3)" } }, /* @__PURE__ */ React.createElement(I.check, { style: { color: desc ? "var(--accent-2)" : "var(--ink-3)", width: 14 } }), " Description"))), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("br", null))
    );
  };
  async function handlePublish(isDraft = false) {
    if (!title.trim()) {
      setSubmitError("Event name is required.");
      return;
    }
    if (!startDate) {
      setSubmitError("Start date is required.");
      return;
    }
    setSubmitError("");
    setLoading(true);
    const token = localStorage.getItem("token");
    let finalCover = cover;
    if (cover && (cover.startsWith("data:") || cover.startsWith("blob:"))) {
      try {
        const blob = await (await fetch(cover)).blob();
        const form = new FormData();
        form.append("file", blob, "event-banner.jpg");
        const up = await fetch(`${apiBase}/api/upload-group-media`, {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: form
        });
        const upData = await up.json();
        if (upData.success && upData.imageUrl) finalCover = upData.imageUrl;
      } catch (err) {
        console.error("Banner upload failed", err);
      }
    }
    const starts_at = startDate && startTime ? (/* @__PURE__ */ new Date(`${startDate}T${startTime}`)).toISOString() : startDate ? (/* @__PURE__ */ new Date(`${startDate}T00:00`)).toISOString() : null;
    const ends_at = endDate && endTime ? (/* @__PURE__ */ new Date(`${endDate}T${endTime}`)).toISOString() : endDate ? (/* @__PURE__ */ new Date(`${endDate}T23:59`)).toISOString() : null;
    const payload = {
      host_entity_id: hostEntityId,
      title: title.trim(),
      description: desc,
      cover: finalCover,
      status: isDraft ? "draft" : "published",
      starts_at,
      ends_at,
      venue_timezone: timezone,
      location_type: locType === "online" ? "online" : "venue",
      venue: {
        name: venue,
        address: venue,
        visibility,
        meta: {
          cover: finalCover,
          slug,
          tags,
          category: cat,
          instructions,
          joinEligibility,
          selectedAccess,
          enableRegForm,
          formFields,
          enableSponsors,
          selectedSponsorIds
        }
      },
      online_link: locType === "online" ? venue : null,
      registration_mode: type === "free" ? "free_rsvp" : "paid",
      approval_required: approval,
      capacity_total: capacityEnabled && capacity ? parseInt(capacity) : null,
      waitlist,
      tickets: type === "paid" ? tickets.map((t, i) => ({ name: t.n, capacity: parseInt(t.cap) || null, price_minor: parseInt(t.price) * 100, sort_order: i })) : [{ name: "Free Admission", price_minor: 0, capacity: capacityEnabled && capacity ? parseInt(capacity) : null, sort_order: 0 }]
    };
    try {
      const isEditing = editEv?.id && editEv.id !== "new";
      const url = isEditing ? `${apiBase}/api/events/${editEv.id}` : `${apiBase}/api/events`;
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...token ? { "Authorization": `Bearer ${token}` } : {}
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to publish event");
      const eventObj = isEditing ? data.data : data.data.event;
      localStorage.removeItem(draftKey);
      if (st && st.addCreatedEvent) {
        st.addCreatedEvent(eventObj);
      }
      go("event", eventObj);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ React.createElement("div", { className: `create ${mobile ? "single" : ""}` }, /* @__PURE__ */ React.createElement("style", null, `
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
      `), /* @__PURE__ */ React.createElement("div", { className: "create-form", style: { backgroundColor: "var(--bg-2)", padding: mobile ? "14px 12px 110px" : "24px 32px 110px", position: "relative" } }, /* @__PURE__ */ React.createElement("div", { className: "cf-inner", style: { maxWidth: 1080, margin: "0 auto" } }, /* @__PURE__ */ React.createElement("div", { className: "create-head", style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost hbtn--sm", onClick: () => go("home"), style: { padding: "7px 11px", background: "var(--surface)" } }, /* @__PURE__ */ React.createElement(I.arrowL, null)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "ck" }, "New event"), /* @__PURE__ */ React.createElement("h1", null, "Create an event"))), /* @__PURE__ */ React.createElement("div", { className: "create-container" }, /* @__PURE__ */ React.createElement("div", { className: "form-section" }, hostGroups.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "form-group-section", style: { marginBottom: 20, padding: 18, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" } }, /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, fontWeight: 600 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, "\u{1F3E0}"), " Host as"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setHostEntityId("standalone"),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "var(--r-md)",
        border: hostEntityId === "standalone" ? "2px solid var(--accent-2)" : "1.5px solid var(--border)",
        background: hostEntityId === "standalone" ? "var(--accent-soft)" : "var(--surface)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.15s"
      }
    },
    /* @__PURE__ */ React.createElement(Avatar, { name: ME.name, size: 24 }),
    /* @__PURE__ */ React.createElement("div", { style: { textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, ME.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)" } }, "Personal (standalone)")),
    hostEntityId === "standalone" && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 4, color: "var(--accent-2)", fontSize: 14 } }, "\u2713")
  ), hostGroups.map((grp) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: grp.entity_id,
      type: "button",
      onClick: () => setHostEntityId(grp.entity_id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "var(--r-md)",
        border: hostEntityId === grp.entity_id ? "2px solid var(--accent-2)" : "1.5px solid var(--border)",
        background: hostEntityId === grp.entity_id ? "var(--accent-soft)" : "var(--surface)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        transition: "all 0.15s"
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: {
      width: 24,
      height: 24,
      borderRadius: 6,
      overflow: "hidden",
      background: grp.cover || "var(--accent-2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      color: "#fff",
      flexShrink: 0
    } }, grp.icon || grp.name?.[0]?.toUpperCase()),
    /* @__PURE__ */ React.createElement("div", { style: { textAlign: "left" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, grp.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)" } }, grp.role === "owner" ? "Owner" : "Admin", " \xB7 Community")),
    hostEntityId === grp.entity_id && /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 4, color: "var(--accent-2)", fontSize: 14 } }, "\u2713")
  ))), hostEntityId !== "standalone" && /* @__PURE__ */ React.createElement("div", { style: {
    marginTop: 8,
    fontSize: 12,
    color: "var(--ink-3)",
    display: "flex",
    alignItems: "center",
    gap: 4
  } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F4E2}"), "This event will appear under", " ", /* @__PURE__ */ React.createElement("strong", { style: { color: "var(--ink)" } }, hostGroups.find((g) => g.entity_id === hostEntityId)?.name), "'s events tab."))), /* @__PURE__ */ React.createElement("div", { className: "form-group-section" }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: mobile ? "1fr" : "2fr 1fr 1fr", gap: "16px", marginBottom: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0, gridColumn: mobile ? "auto" : "span 2" } }, /* @__PURE__ */ React.createElement("label", null, "Event Name"), /* @__PURE__ */ React.createElement("input", { className: "title-input", placeholder: "What's your event called?", value: title, onChange: (e) => setTitle(e.target.value), style: { background: "var(--field)", border: "1px solid var(--border)", fontSize: 15, height: 42, padding: "0 12px", width: "100%" } })), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Visibility"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "cselect",
      value: visibility,
      onChange: (e) => {
        const val = e.target.value;
        setVisibility(val);
        if (val === "custom") {
          setAccessModalOpen(true);
        }
      },
      style: { background: "var(--field)", border: "1px solid var(--border)", height: 42 }
    },
    /* @__PURE__ */ React.createElement("option", { value: "public" }, "Public"),
    /* @__PURE__ */ React.createElement("option", { value: "unlisted" }, "Unlisted"),
    /* @__PURE__ */ React.createElement("option", { value: "custom" }, "Custom Access")
  )), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Category"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "cselect",
      value: cat,
      onChange: (e) => setCat(e.target.value),
      style: { background: "var(--field)", border: "1px solid var(--border)", height: 42 }
    },
    /* @__PURE__ */ React.createElement("option", { value: "Startups" }, "Startups"),
    /* @__PURE__ */ React.createElement("option", { value: "Technology" }, "Technology"),
    /* @__PURE__ */ React.createElement("option", { value: "Design" }, "Design"),
    /* @__PURE__ */ React.createElement("option", { value: "Social" }, "Social"),
    /* @__PURE__ */ React.createElement("option", { value: "Workshops" }, "Workshops")
  ))), visibility === "custom" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)" } }, "Custom Visible Entities"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--ghost hbtn--sm",
      onClick: () => setAccessModalOpen(true),
      style: { padding: "4px 8px", fontSize: 11 }
    },
    "Configure Access"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).map((entity) => {
    const icon = entity.type === "community" ? "\u{1F3DB}\uFE0F" : entity.type === "subcommunity" ? "\u{1F4C1}" : "\u{1F465}";
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        key: entity.id,
        onClick: () => setAccessModalOpen(true),
        style: {
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
        }
      },
      /* @__PURE__ */ React.createElement("span", null, icon),
      /* @__PURE__ */ React.createElement("span", null, entity.name)
    );
  }), getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" } }, 'No visible entities selected yet. Click "Configure Access" to customize.'))), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Event Description"), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { minHeight: 64, background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 16px", color: desc ? "var(--ink)" : "var(--ink-3)", cursor: "pointer", fontSize: 14 },
      onClick: () => setDescModalOpen(true)
    },
    desc ? desc : "Click to open editor. Tell people what to expect \u2014 the vibe, who it's for, what they'll leave with."
  ))), /* @__PURE__ */ React.createElement("div", { className: "form-group-section" }, /* @__PURE__ */ React.createElement("div", { className: "schedule-card", style: { display: "flex", gap: "16px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "schedule-left", style: { flex: "1 1 300px" } }, /* @__PURE__ */ React.createElement("div", { className: "schedule-row", style: { height: 48 } }, /* @__PURE__ */ React.createElement("div", { className: `schedule-label ${startDate || startTime ? "active" : ""}`, style: { padding: "0 12px", display: "flex", alignItems: "center" } }, "\u25CF Start"), /* @__PURE__ */ React.createElement(
    DatePicker,
    {
      value: startDate,
      onChange: (val) => {
        setStartDate(val);
        if (!endDate || endDate < val) {
          setEndDate(val);
        }
      },
      mobile,
      compact: true
    }
  ), /* @__PURE__ */ React.createElement(
    TimePicker,
    {
      value: startTime,
      onChange: (time) => {
        setStartTime(time);
        if (time) {
          setEndTime(addOneHour(time));
        }
      },
      mobile,
      compact: true
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "schedule-row", style: { height: 48, marginTop: 12 } }, /* @__PURE__ */ React.createElement("div", { className: "schedule-label", style: { padding: "0 12px", display: "flex", alignItems: "center" } }, "\u25CB End"), /* @__PURE__ */ React.createElement(
    DatePicker,
    {
      value: endDate,
      onChange: setEndDate,
      mobile,
      compact: true
    }
  ), /* @__PURE__ */ React.createElement(
    TimePicker,
    {
      value: endTime,
      onChange: setEndTime,
      mobile,
      compact: true
    }
  )), getDurationText(startDate, startTime, endDate, endTime) && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, fontSize: 13, fontWeight: 500, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 } }, "\u23F1\uFE0F ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, "Duration:"), " ", getDurationText(startDate, startTime, endDate, endTime))), (() => {
    const tzInfo = getTzInfo(timezone);
    return /* @__PURE__ */ React.createElement("div", { className: "timezone-card", onClick: () => setTzModalOpen(true), style: { cursor: "pointer", height: 108, width: mobile ? "100%" : 180, boxSizing: "border-box" } }, /* @__PURE__ */ React.createElement(I.globe, { style: { color: "var(--accent-2)", width: 18, height: 18, flexShrink: 0, marginTop: 2 } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "tz-main" }, tzInfo.main), /* @__PURE__ */ React.createElement("div", { className: "tz-city" }, tzInfo.city)));
  })())), /* @__PURE__ */ React.createElement("div", { className: "form-group-section" }, /* @__PURE__ */ React.createElement(
    LocationSection,
    {
      venue,
      setVenue,
      locType,
      setLocType
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "form-group-section" }, /* @__PURE__ */ React.createElement("h3", { className: "form-group-title" }, "\u{1F512} Access & Registration"), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", null, "Join Eligibility"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 8 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setJoinEligibility("public"),
      style: {
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
      }
    },
    "\u{1F310} Public Event",
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 } }, "Anyone can view and register for this event.")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        setJoinEligibility("restricted");
        setAccessModalOpen(true);
      },
      style: {
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
      }
    },
    "\u{1F465} Restrict to Community",
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 } }, "Only members of selected communities or groups can join.")
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setJoinEligibility("invite"),
      style: {
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
      }
    },
    "\u2709\uFE0F Invite Only",
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, fontWeight: 400, color: "var(--ink-3)", marginTop: 4 } }, "Only invited guests can register for this event.")
  ))), joinEligibility === "restricted" && /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16, padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginTop: -4 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-2)" } }, "Allowed Communities & Groups"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--ghost hbtn--sm",
      onClick: () => setAccessModalOpen(true),
      style: { padding: "4px 8px", fontSize: 11 }
    },
    "\u2699\uFE0F Configure"
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).map((entity) => {
    const icon = entity.type === "community" ? "\u{1F3DB}\uFE0F" : entity.type === "subcommunity" ? "\u{1F4C1}" : "\u{1F465}";
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        key: entity.id,
        onClick: () => setAccessModalOpen(true),
        style: {
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
        }
      },
      /* @__PURE__ */ React.createElement("span", null, icon),
      /* @__PURE__ */ React.createElement("span", null, entity.name)
    );
  }), getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted).length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--ink-3)", fontStyle: "italic" } }, 'No communities or groups selected yet. Click "Configure" to select.'))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "16px", marginBottom: 20 } }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", cursor: "pointer" },
      onClick: () => setTicketModalOpen(true)
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 8 } }, "Ticket Price"),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minHeight: 36 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "var(--ink)" } }, type === "free" ? "Free RSVP" : "Paid Tickets"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--ink-3)" } }, "Click to customize tiers & pricing"))
  ), /* @__PURE__ */ React.createElement("div", { style: { padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 8 } }, "Require Approval"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, height: 36 } }, /* @__PURE__ */ React.createElement(Toggle, { on: approval, onClick: () => setApproval((v) => !v) }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "var(--ink-2)" } }, approval ? "On" : "Off"))), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { padding: 12, background: "var(--field)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", cursor: "pointer" },
      onClick: () => setCapacityModalOpen(true)
    },
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 8 } }, "Capacity Limit"),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minHeight: 36 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 600, color: "var(--ink)" } }, capacityEnabled ? `${capacity || "\u2014"} Limit` : "Unlimited"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--ink-3)" } }, waitlist ? "Waitlist Enabled" : "Waitlist Disabled"))
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, background: "var(--field)", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 80 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, "Enable Sponsors"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)", marginTop: 2 } }, "Promote organizations and display logos.")), /* @__PURE__ */ React.createElement(Toggle, { on: enableSponsors, onClick: () => setEnableSponsors((v) => !v) }))), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 16, background: "var(--field)", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 80, cursor: "pointer" },
      onClick: () => setQuestModalOpen(true)
    },
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, "Registration Questionnaire"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)", marginTop: 2 } }, "Customize form questions and fields.")), /* @__PURE__ */ React.createElement(
      Toggle,
      {
        on: enableRegForm,
        onClick: (e) => {
          e.stopPropagation();
          const next = !enableRegForm;
          setEnableRegForm(next);
          if (next) {
            setQuestModalOpen(true);
          }
        }
      }
    ))
  )), /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", null, "Event Instructions (Optional)"), /* @__PURE__ */ React.createElement(
    "div",
    {
      style: {
        minHeight: 48,
        background: "var(--field)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        padding: "12px 16px",
        color: instructions ? "var(--ink)" : "var(--ink-3)",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: "1.4"
      },
      onClick: () => setInstModalOpen(true)
    },
    instructions ? instructions.length > 140 ? instructions.substring(0, 140) + " . . ." : instructions : "Click to add attendee instructions (e.g. what to bring, arrival guidelines)."
  )))), /* @__PURE__ */ React.createElement("div", { className: "banner-section" }, /* @__PURE__ */ React.createElement("label", { style: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 } }, "Event Banner"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      ref: fileInputRef,
      onChange: handleFileUpload,
      accept: "image/jpeg,image/png,image/webp",
      style: { display: "none" }
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "banner-square-container" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: `cover-up ${cover ? "filled" : ""}`,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onClick: () => fileInputRef.current?.click(),
      style: {
        ...cover && !cover.startsWith("linear-gradient") ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : cover ? { background: cover } : {},
        borderRadius: "var(--r-md)",
        position: "absolute",
        inset: 0,
        border: isDraggingBanner ? "2.5px dashed var(--accent-2)" : "1.5px dashed var(--border)",
        transition: "all 0.2s ease",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    },
    cover && cover.startsWith("linear-gradient") && /* @__PURE__ */ React.createElement(Grain, null),
    isUploadingBanner && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--r-md)" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontSize: 13, fontWeight: 600 } }, "Uploading...")),
    /* @__PURE__ */ React.createElement("div", { className: "up-hint", style: { color: cover ? "#fff" : "var(--ink-3)", textShadow: cover && !cover.startsWith("linear-gradient") ? "0 1px 4px rgba(0,0,0,0.6)" : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { className: "uic", style: { background: cover ? "rgba(255,255,255,0.25)" : "var(--accent-soft)", color: cover ? "#fff" : "var(--accent-2)", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(I.image, { style: { width: 20, height: 20 } })), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 600, textAlign: "center" } }, cover ? "Change Banner" : "Upload Banner (1:1)"))
  )), bannerError && /* @__PURE__ */ React.createElement("div", { style: { color: "#e5484d", fontSize: 12, marginTop: 8, fontWeight: 500 } }, "\u26A0\uFE0F ", bannerError), /* @__PURE__ */ React.createElement("div", { id: "cover-picker-label", style: { fontSize: 11, color: "var(--ink-3)", marginTop: 12 } }, "Square ratio (JPG, PNG, WEBP)"))))), tzModalOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 400, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 600, margin: 0 } }, "Select Timezone"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost hbtn--sm", onClick: () => setTzModalOpen(false), style: { border: "none" } }, /* @__PURE__ */ React.createElement(I.x, null))), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cinput",
      placeholder: "Search timezone or city...",
      value: tzSearchQuery,
      onChange: (e) => setTzSearchQuery(e.target.value),
      style: { marginBottom: 16, width: "100%" }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { maxHeight: 250, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 } }, TIMEZONES.filter(
    (tz) => tz.city.toLowerCase().includes(tzSearchQuery.toLowerCase()) || tz.label.toLowerCase().includes(tzSearchQuery.toLowerCase())
  ).map((tz) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: tz.value,
      className: "hbtn hbtn--ghost",
      style: {
        width: "100%",
        textAlign: "left",
        justifyContent: "flex-start",
        padding: "12px 16px",
        border: timezone === tz.value ? "1.5px solid var(--accent-2)" : "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: timezone === tz.value ? "var(--accent-soft)" : "var(--surface)"
      },
      onClick: () => {
        setTimezone(tz.value);
        setTzModalOpen(false);
        setTzSearchQuery("");
      }
    },
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, color: "var(--ink)" } }, tz.label), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", marginTop: 2 } }, tz.city))
  ))))), calModalOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, marginBottom: 24, fontWeight: 600 } }, "Create New Calendar"), /* @__PURE__ */ React.createElement("div", { className: "cfield" }, /* @__PURE__ */ React.createElement("label", null, "Calendar Name"), /* @__PURE__ */ React.createElement("input", { className: "cinput", placeholder: "e.g. Design Workshops" })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 32 } }, /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost", style: { flex: 1 }, onClick: () => setCalModalOpen(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--primary", style: { flex: 1 }, onClick: () => setCalModalOpen(false) }, "Create")))), descModalOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 640, height: 500, borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 16, fontWeight: 600 } }, "Event Description"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost hbtn--sm", onClick: () => setDescModalOpen(false) }, /* @__PURE__ */ React.createElement(I.x, null))), /* @__PURE__ */ React.createElement("textarea", { className: "ctext", style: { flex: 1, border: "none", borderRadius: 0, padding: 24, fontSize: 15, resize: "none" }, placeholder: "Write your full description here...", value: desc, onChange: (e) => setDesc(e.target.value), autoFocus: true }), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-2)"
  } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--ghost",
      onClick: () => setAiModalOpen(true),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(120,90,255,.08)",
        border: "1px solid rgba(120,90,255,.25)",
        color: "#c8bcff",
        borderRadius: "999px",
        padding: "10px 16px"
      }
    },
    "\u2728 Suggest with AI"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--primary",
      onClick: () => setDescModalOpen(false)
    },
    "Done"
  )))), instModalOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 640, height: 500, borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 16, fontWeight: 600 } }, "Event Instructions"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost hbtn--sm", onClick: () => setInstModalOpen(false) }, /* @__PURE__ */ React.createElement(I.x, null))), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      id: "instructions-textarea",
      className: "ctext",
      style: { flex: 1, border: "none", borderRadius: 0, padding: 24, fontSize: 15, resize: "none" },
      placeholder: "Write any instructions for attendees here...",
      value: instructions,
      onChange: (e) => setInstructions(e.target.value),
      autoFocus: true
    }
  ), /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-2)"
  } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--ghost",
      onClick: () => setAiInstModalOpen(true),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(120,90,255,.08)",
        border: "1px solid rgba(120,90,255,.25)",
        color: "#c8bcff",
        borderRadius: "999px",
        padding: "10px 16px"
      }
    },
    "\u2728 Suggest with AI"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--primary",
      onClick: () => setInstModalOpen(false)
    },
    "Done"
  )))), aiInstModalOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, marginBottom: 8, fontWeight: 600 } }, "\u2728 AI Instructions Suggestion"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--ink-2)", marginBottom: 24 } }, "Let AI write helpful instructions based on your event details."), /* @__PURE__ */ React.createElement("div", { className: "cfield" }, /* @__PURE__ */ React.createElement("label", null, "Instruction Type"), /* @__PURE__ */ React.createElement("select", { className: "cselect" }, /* @__PURE__ */ React.createElement("option", null, "General Guidelines"), /* @__PURE__ */ React.createElement("option", null, "Arrival & Parking Info"), /* @__PURE__ */ React.createElement("option", null, "Pre-requisites / Checklist"))), /* @__PURE__ */ React.createElement("div", { className: "cfield" }, /* @__PURE__ */ React.createElement("label", null, "Additional Notes"), /* @__PURE__ */ React.createElement("textarea", { id: "ai-inst-notes", className: "ctext", placeholder: "Any specific instructions to include?", style: { minHeight: 80 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 32 } }, /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost", style: { flex: 1 }, onClick: () => setAiInstModalOpen(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--primary", style: { flex: 1 }, onClick: () => {
    const notesEl = document.getElementById("ai-inst-notes");
    const notes = notesEl ? notesEl.value : "";
    const intro = notes ? `**Special Note:** ${notes}

` : "";
    setInstructions(intro + `- Please arrive 15 minutes before the start time.
- Check-in at the registration desk in the main hall.
- Bring a laptop/notebook for hands-on activities.
- Parking is available in the public lot near the venue.`);
    setAiInstModalOpen(false);
  } }, "Generate")))), aiModalOpen && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 20, marginBottom: 8, fontWeight: 600 } }, "\u2728 AI Suggestion"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--ink-2)", marginBottom: 24 } }, "Let AI write a polished description based on your event details."), /* @__PURE__ */ React.createElement("div", { className: "cfield" }, /* @__PURE__ */ React.createElement("label", null, "Event Mood"), /* @__PURE__ */ React.createElement("select", { className: "cselect" }, /* @__PURE__ */ React.createElement("option", null, "Professional"), /* @__PURE__ */ React.createElement("option", null, "Casual"), /* @__PURE__ */ React.createElement("option", null, "Exciting"))), /* @__PURE__ */ React.createElement("div", { className: "cfield" }, /* @__PURE__ */ React.createElement("label", null, "Additional Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "ctext", placeholder: "Any specific details to include?", style: { minHeight: 80 } })), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, marginTop: 32 } }, /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost", style: { flex: 1 }, onClick: () => setAiModalOpen(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--primary", style: { flex: 1 }, onClick: () => {
    setDesc(`Join us for ${title || "an exciting event"} at ${venue || "our venue"}. It will be a fantastic experience!`);
    setAiModalOpen(false);
  } }, "Generate")))), /* @__PURE__ */ React.createElement(
    CapacitySettingsModal,
    {
      open: capacityModalOpen,
      onClose: () => setCapacityModalOpen(false),
      capacityEnabled,
      setCapacityEnabled,
      capacity,
      setCapacity,
      waitlist,
      setWaitlist
    }
  ), /* @__PURE__ */ React.createElement(
    AccessControlModal,
    {
      open: accessModalOpen,
      onClose: () => setAccessModalOpen(false),
      mode: "restricted",
      selectedAccess,
      setSelectedAccess
    }
  ), /* @__PURE__ */ React.createElement(
    TicketSettingsModal,
    {
      open: ticketModalOpen,
      onClose: () => setTicketModalOpen(false),
      type,
      setType,
      tickets,
      setTickets,
      setTk,
      mobile
    }
  ), /* @__PURE__ */ React.createElement(
    QuestionnaireModal,
    {
      open: questModalOpen,
      onClose: () => setQuestModalOpen(false),
      formFields,
      setFormFields,
      enableRegForm,
      setEnableRegForm,
      moveField
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "create-foot", style: { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, borderTop: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", padding: mobile ? "10px 12px" : "10px 24px", display: "flex", gap: "10px", alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost", onClick: () => {
    localStorage.removeItem(draftKey);
    go("home");
  }, disabled: loading }, "Cancel"), submitError && /* @__PURE__ */ React.createElement("span", { style: { color: "red", fontSize: "12px" } }, submitError), /* @__PURE__ */ React.createElement("div", { className: "sp", style: { flex: 1 } }), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost", onClick: () => handlePublish(true), disabled: loading }, loading ? "Saving..." : "Save draft"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost", style: { display: "flex", alignItems: "center", gap: 8 }, onClick: () => go("event", { ...previewEv, id: "new", host: ME.name, hostBy: ME.name, city: "Bengaluru", cap: capacity || 180, desc, formFields, __draft: draftSnapshot }), disabled: loading }, /* @__PURE__ */ React.createElement(I.external, null), " Preview"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--primary", onClick: () => handlePublish(false), disabled: loading }, /* @__PURE__ */ React.createElement(I.check, null), " ", loading ? "Publishing..." : "Publish Event")));
}
function CapacitySettingsModal({ open, onClose, capacityEnabled, setCapacityEnabled, capacity, setCapacity, waitlist, setWaitlist }) {
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
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 400, borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--sh-xl)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 24px 12px" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 600, margin: 0 } }, "Capacity Settings"), /* @__PURE__ */ React.createElement("button", { className: "hbtn hbtn--ghost hbtn--sm", onClick: onClose, style: { border: "none" } }, /* @__PURE__ */ React.createElement(I.x, null))), /* @__PURE__ */ React.createElement("div", { style: { padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "switch-container", style: { alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { className: "switch-label-wrapper" }, /* @__PURE__ */ React.createElement("span", { className: "switch-title", style: { fontSize: 15 } }, "Enable Capacity Limit")), /* @__PURE__ */ React.createElement("label", { className: "switch" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: tempEnabled,
      onChange: (e) => setTempEnabled(e.target.checked)
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "slider" }))), tempEnabled && /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0, animation: "fadeIn 0.2s" } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 13, color: "var(--ink-3)", fontWeight: 600, marginBottom: 8, display: "block" } }, "Max Capacity"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      className: "cinput",
      placeholder: "50",
      value: tempCapacity,
      onChange: (e) => setTempCapacity(e.target.value),
      style: { width: "100%", background: "var(--field)", border: "1px solid var(--border)", height: 44, borderRadius: "10px", padding: "0 14px", fontSize: 14 }
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "switch-container", style: { alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement("div", { className: "switch-label-wrapper" }, /* @__PURE__ */ React.createElement("span", { className: "switch-title", style: { fontSize: 15 } }, "Enable Waitlist"), /* @__PURE__ */ React.createElement("span", { className: "switch-desc", style: { fontSize: 12 } }, "Registrations above capacity are added to the waitlist.")), /* @__PURE__ */ React.createElement("label", { className: "switch" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "checkbox",
      checked: tempWaitlist,
      onChange: (e) => setTempWaitlist(e.target.checked)
    }
  ), /* @__PURE__ */ React.createElement("span", { className: "slider" })))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "12px" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--ghost",
      onClick: onClose,
      style: { background: "#fff", border: "1px solid var(--border)", borderRadius: "999px", padding: "10px 20px", fontWeight: 600, fontSize: 13 }
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      className: "hbtn hbtn--primary",
      onClick: handleSave,
      style: { background: "linear-gradient(135deg, #ff4e50, #f9d423)", border: "none", color: "#fff", borderRadius: "999px", padding: "10px 24px", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 12px rgba(255, 78, 80, 0.2)" }
    },
    "Save"
  ))));
}
function QuestionnaireModal({ open, onClose, formFields, setFormFields, enableRegForm, setEnableRegForm, moveField }) {
  const [activeTab, setActiveTab] = useState("selected");
  const [customText, setCustomText] = useState("");
  const [customType, setCustomType] = useState("text");
  const [customRequired, setCustomRequired] = useState(false);
  const [customOptions, setCustomOptions] = useState(["Option 1", "Option 2"]);
  const [editingId, setEditingId] = useState(null);
  if (!open) return null;
  const libraryQuestions = [
    { type: "text", question: "What motivates you to join?", required: false },
    { type: "social", question: "LinkedIn Profile URL", required: true, platform: "linkedin" },
    { type: "text", question: "What is your main area of interest?", required: true },
    { type: "company", question: "Company / Organization Name", required: false },
    { type: "text", question: "Dietary restrictions or allergies?", required: false },
    { type: "text", question: "Phone Number", required: false }
  ];
  const handleAddFromLibrary = (q) => {
    const newField = {
      id: "f-" + Date.now() + Math.random(),
      type: q.type,
      question: q.question,
      required: q.required,
      ...q.platform ? { platform: q.platform } : {}
    };
    setFormFields([...formFields, newField]);
  };
  const handleAddCustom = () => {
    if (!customText.trim()) return;
    const fieldData = {
      type: customType,
      question: customText.trim(),
      required: customRequired,
      ...customType === "options" ? { options: customOptions.filter((o) => o.trim() !== "") } : {}
    };
    if (editingId) {
      setFormFields(formFields.map((f) => f.id === editingId ? { ...f, ...fieldData } : f));
      setEditingId(null);
    } else {
      setFormFields([...formFields, { id: "f-" + Date.now(), ...fieldData }]);
    }
    setCustomText("");
    setCustomRequired(false);
    setCustomOptions(["Option 1", "Option 2"]);
    setActiveTab("selected");
  };
  const handleEditField = (field) => {
    setEditingId(field.id);
    setCustomText(field.question || "");
    setCustomType(field.type || "text");
    setCustomRequired(!!field.required);
    setCustomOptions(field.options && field.options.length > 0 ? field.options : ["Option 1", "Option 2"]);
    setActiveTab("custom");
  };
  const handleRemove = (id) => {
    if (editingId === id) setEditingId(null);
    setFormFields(formFields.filter((f) => f.id !== id));
  };
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 460, height: 520, borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" } }, "Join Questionnaire"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      style: { border: "none", background: "var(--border-2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-2)" }
    },
    /* @__PURE__ */ React.createElement(I.x, { style: { width: 14, height: 14 } })
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-2)" } }, "Enable Registration Form"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--ink-3)", marginTop: 2 } }, "Require custom questions for attendees")), /* @__PURE__ */ React.createElement(Toggle, { on: enableRegForm, onClick: () => setEnableRegForm(!enableRegForm) })), enableRegForm ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" } }, ["selected", "library", "custom"].map((tab) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: tab,
      type: "button",
      onClick: () => {
        if (tab !== "custom" && editingId) {
          setEditingId(null);
          setCustomText("");
          setCustomRequired(false);
          setCustomOptions(["Option 1", "Option 2"]);
        }
        setActiveTab(tab);
      },
      style: {
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
      }
    },
    tab === "selected" ? "Selected" : tab === "library" ? "Library" : "Custom"
  ))), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "24px" } }, activeTab === "selected" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, formFields.length === 0 ? /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "40px 20px", color: "var(--ink-3)", fontSize: 13 } }, "No questions added yet. Choose from the Library or add a Custom question.") : formFields.map((field, idx) => /* @__PURE__ */ React.createElement("div", { key: field.id, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "var(--bg-2)", borderRadius: "10px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)" } }, "Q#", idx + 1, ": ", field.type), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--ink)" } }, field.question), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--ink-3)" } }, field.required ? "Required" : "Optional")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 2 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => moveField(idx, -1),
      disabled: idx === 0,
      style: { border: "none", background: "transparent", color: idx === 0 ? "var(--border-2)" : "var(--ink-3)", cursor: idx === 0 ? "default" : "pointer", padding: 6, display: "flex" }
    },
    /* @__PURE__ */ React.createElement(I.chevD, { style: { width: 14, height: 14, transform: "rotate(180deg)" } })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => moveField(idx, 1),
      disabled: idx === formFields.length - 1,
      style: { border: "none", background: "transparent", color: idx === formFields.length - 1 ? "var(--border-2)" : "var(--ink-3)", cursor: idx === formFields.length - 1 ? "default" : "pointer", padding: 6, display: "flex" }
    },
    /* @__PURE__ */ React.createElement(I.chevD, { style: { width: 14, height: 14 } })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleEditField(field),
      style: { border: "none", background: "transparent", color: "var(--ink-3)", cursor: "pointer", padding: 6, display: "flex" }
    },
    /* @__PURE__ */ React.createElement(I.edit, { style: { width: 16, height: 16 } })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleRemove(field.id),
      style: { border: "none", background: "transparent", color: "#e5484d", cursor: "pointer", padding: 6, display: "flex" }
    },
    /* @__PURE__ */ React.createElement(I.x, { style: { width: 16, height: 16 } })
  ))))), activeTab === "library" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, libraryQuestions.map((q, idx) => {
    const alreadyAdded = formFields.some((f) => f.question === q.question);
    return /* @__PURE__ */ React.createElement("div", { key: idx, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 2 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--ink)" } }, q.question), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--ink-3)" } }, "Type: ", q.type, " \u2022 ", q.required ? "Required" : "Optional")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => handleAddFromLibrary(q),
        disabled: alreadyAdded,
        style: {
          border: "none",
          background: alreadyAdded ? "var(--border-2)" : "var(--accent-soft)",
          color: alreadyAdded ? "var(--accent-2)" : "var(--ink-3)",
          borderRadius: "14px",
          padding: "6px 12px",
          fontWeight: 600,
          fontSize: 12,
          cursor: alreadyAdded ? "default" : "pointer",
          fontFamily: "inherit"
        }
      },
      alreadyAdded ? "Added" : "+ Add"
    ));
  })), activeTab === "custom" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, display: "block" } }, "Question Text"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cinput",
      placeholder: "e.g. What motivates you to join?",
      value: customText,
      onChange: (e) => setCustomText(e.target.value),
      style: { width: "100%", background: "var(--field)", border: "1px solid var(--border)", height: 44, borderRadius: "10px", padding: "0 14px" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, display: "block" } }, "Type"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "cselect",
      value: customType,
      onChange: (e) => setCustomType(e.target.value),
      style: { background: "var(--field)", border: "1px solid var(--border)", height: 44, borderRadius: "10px" }
    },
    /* @__PURE__ */ React.createElement("option", { value: "text" }, "Short Answer"),
    /* @__PURE__ */ React.createElement("option", { value: "paragraph" }, "Paragraph"),
    /* @__PURE__ */ React.createElement("option", { value: "options" }, "Multiple Choice"),
    /* @__PURE__ */ React.createElement("option", { value: "social" }, "Social Link"),
    /* @__PURE__ */ React.createElement("option", { value: "company" }, "Company Info")
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 700, color: "var(--ink-2)", marginBottom: 4 } }, "Required"), /* @__PURE__ */ React.createElement(Toggle, { on: customRequired, onClick: () => setCustomRequired(!customRequired) }))), customType === "options" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8, padding: 12, background: "var(--bg-2)", borderRadius: "10px", border: "1px solid var(--border)" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "var(--ink-2)" } }, "Multiple Choice Options"), customOptions.map((opt, oIdx) => /* @__PURE__ */ React.createElement("div", { key: oIdx, style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cinput",
      placeholder: `Option ${oIdx + 1}`,
      value: opt,
      onChange: (e) => {
        const next = [...customOptions];
        next[oIdx] = e.target.value;
        setCustomOptions(next);
      },
      style: { flex: 1, background: "var(--field)", border: "1px solid var(--border)", height: 36, borderRadius: "8px", padding: "0 10px", fontSize: 13 }
    }
  ), customOptions.length > 2 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setCustomOptions(customOptions.filter((_, idx) => idx !== oIdx)),
      style: { border: "none", background: "transparent", color: "#e5484d", cursor: "pointer", padding: "4px 8px" }
    },
    /* @__PURE__ */ React.createElement(I.x, { style: { width: 14, height: 14 } })
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setCustomOptions([...customOptions, ""]),
      style: { alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--accent-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4 }
    },
    "+ Add Option"
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: handleAddCustom,
      style: {
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
      }
    },
    editingId ? "Save Changes" : "+ Add Question"
  )))) : /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", padding: 40, textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 40, marginBottom: 12 } }, "\u{1F4CB}"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--ink-2)" } }, "Registration Form is Disabled"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--ink-3)", marginTop: 4, maxWidth: 280 } }, "Toggle it on at the top to ask custom questions.")), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--primary",
      onClick: onClose,
      style: { background: "linear-gradient(135deg, #ff4e50, #f9d423)", border: "none", color: "#fff", borderRadius: "999px", padding: "10px 24px", fontWeight: 600, fontSize: 13, boxShadow: "0 4px 12px rgba(255, 78, 80, 0.2)" }
    },
    "Done (",
    enableRegForm ? formFields.length : 0,
    " questions)"
  ))));
}
function TicketSettingsModal({ open, onClose, type, setType, tickets, setTickets, setTk, mobile }) {
  if (!open) return null;
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--surface)", width: 480, maxHeight: "85vh", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "var(--sh-xl)", overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" } }, "Ticket Settings"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: onClose,
      style: { border: "none", background: "var(--border-2)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--ink-2)" }
    },
    /* @__PURE__ */ React.createElement(I.x, { style: { width: 14, height: 14 } })
  )), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" } }, /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 8, display: "block" } }, "Registration Mode"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setType("free"),
      style: {
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
      }
    },
    "\u{1F39F}\uFE0F Free RSVP"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setType("paid"),
      style: {
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
      }
    },
    "\u{1F4B3} Paid Tickets"
  ))), type === "paid" && /* @__PURE__ */ React.createElement("div", { className: "cfield", style: { marginBottom: 0, display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 13, fontWeight: 700, color: "var(--ink-2)", display: "block" } }, "Ticket Tiers"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, paddingLeft: 2 } }, /* @__PURE__ */ React.createElement("div", { style: { flex: 2, fontSize: 11, fontWeight: 600, color: "var(--ink-3)" } }, "Tier Name"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 11, fontWeight: 600, color: "var(--ink-3)" } }, "Capacity"), /* @__PURE__ */ React.createElement("div", { style: { flex: 1, fontSize: 11, fontWeight: 600, color: "var(--ink-3)" } }, "Price (\u20B9)"), tickets.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { width: 36 } })), tickets.map((t, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "ticket-row", style: { display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { className: "cinput", placeholder: "e.g. General Admission", value: t.n, onChange: (e) => setTk(i, "n", e.target.value), style: { flex: 2, background: "var(--field)", border: "1px solid var(--border)" } }), /* @__PURE__ */ React.createElement("input", { className: "cinput", placeholder: "Qty", value: t.cap, onChange: (e) => setTk(i, "cap", e.target.value), style: { flex: 1, background: "var(--field)", border: "1px solid var(--border)" } }), /* @__PURE__ */ React.createElement("input", { className: "cinput", placeholder: "Price", value: t.price, onChange: (e) => setTk(i, "price", e.target.value), style: { flex: 1, background: "var(--field)", border: "1px solid var(--border)" } }), tickets.length > 1 && /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--ghost hbtn--sm",
      onClick: () => setTickets((ts) => ts.filter((_, j) => j !== i)),
      style: { padding: "0 10px", height: 42, border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }
    },
    /* @__PURE__ */ React.createElement(I.x, { style: { width: 14, height: 14 } })
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "add-row",
      onClick: () => setTickets((ts) => [...ts, { n: "", cap: "", price: "" }]),
      style: { marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--accent-2)", fontWeight: 600, cursor: "pointer" }
    },
    "\u2795 Add ticket type"
  ))), /* @__PURE__ */ React.createElement("div", { style: { padding: "16px 24px", background: "var(--bg-2)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      className: "hbtn hbtn--primary",
      onClick: onClose,
      style: { borderRadius: "999px", padding: "10px 24px", fontWeight: 600, fontSize: 13 }
    },
    "Save & Close"
  ))));
}
Object.assign(window, { CreateEvent });
