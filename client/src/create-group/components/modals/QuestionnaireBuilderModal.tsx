// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';
import { Toggle } from '../common/Toggle';

export function QuestionnaireBuilderModal({ open, onClose, questions, setQuestions }) {
  const [activeTab, setActiveTab] = useState("selected");
  const [customQ, setCustomQ] = useState("");
  const [customType, setCustomType] = useState("short");
  const [customReq, setCustomReq] = useState(false);

  const [customOptions, setCustomOptions] = useState(["", ""]);

  const predefined = [
    { id: "pq1", type: "short", q: "Why do you want to join?", req: true },
    { id: "pq2", type: "short", q: "What experience do you have?", req: false },
    { id: "pq3", type: "short", q: "Which city are you from?", req: false },
    { id: "pq4", type: "yesno", q: "Are you available for volunteering?", req: false },
    { id: "pq5", type: "email", q: "Email Address", req: true },
    { id: "pq6", type: "date", q: "Date of Birth (DOB)", req: true },
    { id: "pq7", type: "time", q: "Preferred Time", req: false },
    { id: "pq8", type: "multiselect", q: "Multiple correct options", req: false, options: ["Option 1", "Option 2", "Option 3"] },
    { id: "pq9", type: "phone", q: "Phone Number", req: true },
  ];

  const addQ = (qObj) => setQuestions(qs => [...qs, { ...qObj, id: "q" + Date.now() }]);
  const rmQ = (idx) => setQuestions(qs => qs.filter((_, i) => i !== idx));
  const addCustomQ = () => {
    if (!customQ.trim()) return;
    const opts = (customType === "multiplechoice" || customType === "multiselect")
      ? customOptions.map(o => o.trim()).filter(Boolean) : undefined;
    addQ({ type: customType, q: customQ.trim(), req: customReq, options: opts });
    setCustomQ("");
    setCustomReq(false);
    setCustomOptions(["", ""]);
    setActiveTab("selected");
  };

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
              {questions.length === 0 ? <div style={{ color: "var(--ink-3)", textAlign: "center", padding: 20 }}>No questions added yet. Use Library or Custom tab to add.</div> : null}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="cfield" style={{ margin: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Question Text</label>
                <input
                  className="cinput"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13.5 }}
                  placeholder="e.g. What motivates you to join?"
                  value={customQ}
                  onChange={e => setCustomQ(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addCustomQ(); }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="cfield" style={{ margin: 0, flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Type</label>
                  <select className="cselect" value={customType} onChange={e => setCustomType(e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}>
                    <option value="short">Short Answer</option>
                    <option value="long">Long Answer</option>
                    <option value="yesno">Yes / No</option>
                    <option value="multiplechoice">Multiple Choice</option>
                    <option value="multiselect">Multiple Select (checkboxes)</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone Number</option>
                    <option value="date">Date</option>
                    <option value="time">Time</option>
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingTop: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Required</label>
                  <Toggle on={customReq} onClick={() => setCustomReq(!customReq)} />
                </div>
              </div>
              {(customType === "multiplechoice" || customType === "multiselect") && (
                <div className="cfield" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Options</label>
                  {customOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        className="cinput"
                        style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={e => {
                          const newOpts = [...customOptions];
                          newOpts[idx] = e.target.value;
                          setCustomOptions(newOpts);
                        }}
                      />
                      {customOptions.length > 2 && (
                        <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                          const newOpts = [...customOptions];
                          newOpts.splice(idx, 1);
                          setCustomOptions(newOpts);
                        }}><I.x /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="hbtn hbtn--soft hbtn--sm" style={{ width: "fit-content" }} onClick={() => setCustomOptions([...customOptions, ""])}>+ Add Option</button>
                </div>
              )}
              <button
                type="button"
                className="hbtn hbtn--primary"
                style={{ width: "100%" }}
                onClick={addCustomQ}
                disabled={!customQ.trim()}
              >
                <I.plus /> Add Question
              </button>
            </div>
          )}
        </div>
        <div style={{ padding: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
          <button className="hbtn hbtn--primary" onClick={onClose}>Done ({questions.length} questions)</button>
        </div>
      </div>
    </div>
  );
}
