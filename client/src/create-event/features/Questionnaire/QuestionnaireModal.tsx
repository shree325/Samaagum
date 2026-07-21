// @ts-nocheck
import React from 'react';
import { Toggle } from '../../ui/Toggle';
import { I } from '../../../home-icons';

function QuestionnaireModal({
  open,
  onClose,
  formFields,
  setFormFields,
  enableRegForm,
  setEnableRegForm,
  moveField,
}: {
  open: boolean;
  onClose: () => void;
  formFields: any[];
  setFormFields: (v: any[]) => void;
  enableRegForm: boolean;
  setEnableRegForm: (v: boolean) => void;
  moveField: (idx: number, dir: number) => void;
}) {
  const [activeTab,      setActiveTab]      = React.useState('selected');
  const [customText,     setCustomText]     = React.useState('');
  const [customType,     setCustomType]     = React.useState('text');
  const [customRequired, setCustomRequired] = React.useState(false);
  const [customOptions,  setCustomOptions]  = React.useState(['Option 1', 'Option 2']);
  const [editingId,      setEditingId]      = React.useState<string | null>(null);

  if (!open) return null;

  const libraryQuestions = [
    { type: 'text',    question: 'What motivates you to join?',   required: false },
    { type: 'social',  question: 'LinkedIn Profile URL',          required: true,  platform: 'linkedin' },
    { type: 'text',    question: 'What is your main area of interest?', required: true },
    { type: 'company', question: 'Company / Organization Name',   required: false },
    { type: 'text',    question: 'Dietary restrictions or allergies?', required: false },
    { type: 'text',    question: 'Phone Number',                  required: false },
  ];

  const handleAddFromLibrary = (q: any) => {
    setFormFields([...formFields, { id: 'f-' + Date.now() + Math.random(), type: q.type, question: q.question, required: q.required, ...(q.platform ? { platform: q.platform } : {}) }]);
  };

  const handleAddCustom = () => {
    if (!customText.trim()) return;
    let realType = customType;
    let extraProps: any = {};
    if (customType === 'paragraph') {
      realType = 'text';
      extraProps.responseType = 'paragraph';
    } else if (customType === 'checkboxes') {
      realType = 'options';
      extraProps.selectionType = 'multiple';
    }
    const fieldData = { 
      type: realType, 
      question: customText.trim(), 
      required: customRequired, 
      ...(customType === 'options' || customType === 'checkboxes' ? { options: customOptions.filter(o => o.trim() !== '') } : {}),
      ...extraProps
    };
    if (editingId) {
      setFormFields(formFields.map((f: any) => f.id === editingId ? { ...f, ...fieldData } : f));
      setEditingId(null);
    } else {
      setFormFields([...formFields, { id: 'f-' + Date.now(), ...fieldData }]);
    }
    setCustomText(''); setCustomRequired(false); setCustomOptions(['Option 1', 'Option 2']); setActiveTab('selected');
  };

  const handleEditField = (field: any) => {
    setEditingId(field.id); 
    setCustomText(field.question || ''); 
    
    let t = field.type || 'text';
    if (t === 'text' && field.responseType === 'paragraph') t = 'paragraph';
    if (t === 'options' && field.selectionType === 'multiple') t = 'checkboxes';
    setCustomType(t);
    
    setCustomRequired(!!field.required); 
    setCustomOptions(field.options?.length ? field.options : ['Option 1', 'Option 2']);
    setActiveTab('custom');
  };

  const handleRemove = (id: string) => {
    if (editingId === id) setEditingId(null);
    setFormFields(formFields.filter(f => f.id !== id));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surface)', width: 460, height: 520, borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Join Questionnaire</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'var(--border-2)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-2)' }}>
            <I.x style={{ width: 14, height: 14 }} />
          </button>
        </div>
        {/* Enable toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>Enable Registration Form</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Require custom questions for attendees</div>
          </div>
          <Toggle on={enableRegForm} onClick={() => setEnableRegForm(!enableRegForm)} />
        </div>
        {enableRegForm ? (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
              {['selected', 'library', 'custom'].map(tab => (
                <button key={tab} type="button"
                  onClick={() => { if (tab !== 'custom' && editingId) { setEditingId(null); setCustomText(''); setCustomRequired(false); setCustomOptions(['Option 1', 'Option 2']); } setActiveTab(tab); }}
                  style={{ flex: 1, padding: '14px 0', background: 'transparent', border: 'none', borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent', color: activeTab === tab ? '#6366f1' : 'var(--ink-3)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', fontFamily: 'inherit' }}>
                  {tab === 'selected' ? 'Selected' : tab === 'library' ? 'Library' : 'Custom'}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Selected tab */}
              {activeTab === 'selected' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {formFields.length === 0
                    ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3)', fontSize: 13 }}>No questions added yet. Choose from the Library or add a Custom question.</div>
                    : formFields.map((field: any, idx: number) => (
                      <div key={field.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-2)' }}>Q#{idx + 1}: {field.type}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{field.question}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{field.required ? 'Required' : 'Optional'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <button type="button" onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', color: idx === 0 ? 'var(--border-2)' : 'var(--ink-3)', cursor: idx === 0 ? 'default' : 'pointer', padding: 6, display: 'flex' }}><I.chevD style={{ width: 14, height: 14, transform: 'rotate(180deg)' }} /></button>
                          <button type="button" onClick={() => moveField(idx, 1)}  disabled={idx === formFields.length - 1} style={{ border: 'none', background: 'transparent', color: idx === formFields.length - 1 ? 'var(--border-2)' : 'var(--ink-3)', cursor: idx === formFields.length - 1 ? 'default' : 'pointer', padding: 6, display: 'flex' }}><I.chevD style={{ width: 14, height: 14 }} /></button>
                          <button type="button" onClick={() => handleEditField(field)} style={{ border: 'none', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', padding: 6, display: 'flex' }}><I.edit style={{ width: 16, height: 16 }} /></button>
                          <button type="button" onClick={() => handleRemove(field.id)} style={{ border: 'none', background: 'transparent', color: '#e5484d', cursor: 'pointer', padding: 6, display: 'flex' }}><I.x style={{ width: 16, height: 16 }} /></button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {/* Library tab */}
              {activeTab === 'library' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {libraryQuestions.map((q, idx) => {
                    const alreadyAdded = formFields.some(f => f.question === q.question);
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{q.question}</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Type: {q.type} • {q.required ? 'Required' : 'Optional'}</span>
                        </div>
                        <button type="button" onClick={() => handleAddFromLibrary(q)} disabled={alreadyAdded}
                          style={{ border: 'none', background: alreadyAdded ? 'var(--border-2)' : 'var(--accent-soft)', color: alreadyAdded ? 'var(--accent-2)' : 'var(--ink-3)', borderRadius: '14px', padding: '6px 12px', fontWeight: 600, fontSize: 12, cursor: alreadyAdded ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                          {alreadyAdded ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Custom tab */}
              {activeTab === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="cfield" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8, display: 'block' }}>Question Text</label>
                    <input className="cinput" placeholder="e.g. What motivates you to join?" value={customText} onChange={e => setCustomText(e.target.value)} style={{ width: '100%', background: 'var(--field)', border: '1px solid var(--border)', height: 44, borderRadius: '10px', padding: '0 14px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div className="cfield" style={{ marginBottom: 0, flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 8, display: 'block' }}>Type</label>
                      <select className="cselect" value={customType} onChange={e => setCustomType(e.target.value)} style={{ background: 'var(--field)', border: '1px solid var(--border)', height: 44, borderRadius: '10px' }}>
                        <option value="text">Short Answer</option>
                        <option value="paragraph">Long Answer</option>
                        <option value="yes_no">Yes / No</option>
                        <option value="options">Multiple Choice</option>
                        <option value="checkboxes">Multiple Select (checkboxes)</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone Number</option>
                        <option value="date">Date</option>
                        <option value="time">Time</option>
                        <option value="social">Social Link</option>
                        <option value="company">Company Info</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 4 }}>Required</span>
                      <Toggle on={customRequired} onClick={() => setCustomRequired(!customRequired)} />
                    </div>
                  </div>
                  {(customType === 'options' || customType === 'checkboxes') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, padding: 12, background: 'var(--bg-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>Multiple Choice Options</span>
                      {customOptions.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input className="cinput" placeholder={`Option ${oIdx + 1}`} value={opt} onChange={e => { const n = [...customOptions]; n[oIdx] = e.target.value; setCustomOptions(n); }} style={{ flex: 1, background: 'var(--field)', border: '1px solid var(--border)', height: 36, borderRadius: '8px', padding: '0 10px', fontSize: 13 }} />
                          {customOptions.length > 2 && <button type="button" onClick={() => setCustomOptions(customOptions.filter((_, i) => i !== oIdx))} style={{ border: 'none', background: 'transparent', color: '#e5484d', cursor: 'pointer', padding: '4px 8px' }}><I.x style={{ width: 14, height: 14 }} /></button>}
                        </div>
                      ))}
                      <button type="button" onClick={() => setCustomOptions([...customOptions, ''])} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--accent-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>+ Add Option</button>
                    </div>
                  )}
                  <button type="button" onClick={handleAddCustom} style={{ background: 'linear-gradient(135deg, #ff8a00, #da1b60)', border: 'none', color: '#fff', borderRadius: '999px', padding: '12px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                    {editingId ? 'Save Changes' : '+ Add Question'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', padding: 40, textAlign: 'center' }}>
            <span style={{ fontSize: 40, marginBottom: 12 }}>📋</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>Registration Form is Disabled</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, maxWidth: 280 }}>Toggle it on at the top to ask custom questions.</div>
          </div>
        )}
        {/* Footer */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="hbtn hbtn--primary" onClick={onClose} style={{ background: 'linear-gradient(135deg, #ff4e50, #f9d423)', border: 'none', color: '#fff', borderRadius: '999px', padding: '10px 24px', fontWeight: 600, fontSize: 13, boxShadow: '0 4px 12px rgba(255,78,80,0.2)' }}>
            Done ({enableRegForm ? formFields.length : 0} questions)
          </button>
        </div>
      </div>
    </div>
  );
}

export { QuestionnaireModal };
