// @ts-nocheck
import React, { useMemo } from 'react';
import { I } from '../home-icons';
import { Avatar, Grain } from '../home-icons';
import { ME } from '../home-data';
import { EventCard } from '../home-cards';

import { useEventForm } from './hooks/useEventForm';
import { DatePicker } from './ui/DatePicker';
import { TimePicker } from './ui/TimePicker';
import { LocationSection } from './features/Location/LocationSection';
import { CapacitySettingsModal } from './features/Capacity/CapacitySettingsModal';
import { AccessControlModal } from './features/Access/AccessControlModal';
import { TicketSettingsModal } from './features/Ticketing/TicketSettingsModal';
import { QuestionnaireModal } from './features/Questionnaire/QuestionnaireModal';
import { Toggle } from './ui/Toggle';

import { format24to12, getDurationText, getTzInfo, parse12to24, addOneHour } from './utils/time';
import { getSelectedNodesWithDetails } from './utils/access-tree';
import { ACCESS_TREE, TIMEZONES, DEFAULT_FREE_ENTITLEMENTS } from './constants';

export function CreateEventForm({ go, mobile, st, editEv, hostGroupId }: any) {
  const form = useEventForm({ go, st, editEv, hostGroupId });
  const isEditing = editEv?.id && editEv.id !== 'new';

  const entitlements = st?.entitlements || DEFAULT_FREE_ENTITLEMENTS;
  const allowedVisibilities = entitlements.event_allowed_visibility || ['unlisted', 'custom'];
  const allowedJoinModes = entitlements.event_allowed_join_modes || ['restricted', 'invite'];
  const eventMaxParticipants = entitlements.event_max_participants ?? 100;

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const parsedStartDate = form.startDate ? new Date(form.startDate) : null;
  const isValidDate = parsedStartDate && !isNaN(parsedStartDate.getTime());

  const previewEv = {
    cover: form.cover,
    cat: form.cat,
    type: form.ticketManager.type === 'free' ? 'Free' : (form.ticketManager.type === 'cash' ? 'Cash' : 'Paid'),
    online: form.locationState.locType === 'online',
    month: isValidDate ? months[parsedStartDate.getMonth()] : '--',
    day: isValidDate ? parsedStartDate.getDate().toString() : '--',
    title: form.title || '--',
    date: isValidDate ? parsedStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '--',
    time: form.startTime ? format24to12(form.startTime) : '--',
    venue: form.locationState.locType === 'online' ? 'Online (🌍)' : (form.locationState.venue || '--'),
    going: '--',
    price: (form.ticketManager.type === 'paid' || form.ticketManager.type === 'cash')
      ? `₹${form.ticketManager.tickets[0]?.price || '—'}`
      : 'Free',
    attendees: [],
  };

  const draftSnapshot = {
    id: editEv?.id !== 'new' ? editEv?.id : undefined,
    title: form.title,
    slug: form.slug,
    cover: form.cover,
    visibility: form.visibility,
    calendar: form.calendar,
    startDate: form.startDate,
    startTime: form.startTime,
    endDate: form.endDate,
    endTime: form.endTime,
    timezone: form.timezone,
    locType: form.locationState.locType,
    venue: form.locationState.venue,
    desc: form.desc,
    type: form.ticketManager.type,
    approval: form.approval,
    capacityEnabled: form.capacityState.capacityEnabled,
    capacity: form.capacityState.capacity,
    waitlist: form.capacityState.waitlist,
    tickets: form.ticketManager.tickets,
    tags: form.tags,
    cat: form.cat,
    instructions: form.instructions,
    joinEligibility: form.joinEligibility,
    selectedAccess: form.selectedAccess,
    enableRegForm: form.questionnaireState.enableRegForm,
    formFields: form.questionnaireState.formFields,
    enableSponsors: form.enableSponsors,
    hostEntityId: form.hostEntityId,
    customEntities: form.customEntities,
    selectedSponsorIds: form.selectedSponsorIds,
    sponsorVisibility: form.sponsorVisibility,
  };

  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    padding: mobile ? '16px' : '18px',
    marginBottom: mobile ? '14px' : '16px',
    boxShadow: 'var(--sh-sm)',
  };

  const completeness = [form.title, form.startDate, form.locationState.venue, form.desc, form.cover].filter(Boolean).length;
  const pct = Math.round((completeness / 5) * 100);

  const renderPreviewPanel = (isMobileStacked = false) => {
    return (
      <div
        className={isMobileStacked ? 'mobile-preview-stacked' : 'create-preview'}
        style={isMobileStacked ? {
          padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px',
          borderTop: '1px solid var(--border-2)', marginTop: '32px',
        } : {
          position: 'sticky', top: 0, height: '100vh', padding: '32px', display: 'flex',
          flexDirection: 'column', gap: '24px', overflowY: 'auto', borderLeft: '1px solid var(--border-2)', background: 'var(--bg-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div className="pv-label" style={{ marginBottom: 0 }}><span className="d" />Live preview</div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--border)', padding: 4, borderRadius: 999 }}>
            <button style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'var(--surface)', borderRadius: 999, border: 'none', boxShadow: 'var(--sh-sm)' }}>Card</button>
            <button style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: 'transparent', borderRadius: 999, border: 'none', color: 'var(--ink-2)' }}>Mobile</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <EventCard ev={previewEv} onOpen={() => {}} wishlisted={false} wishlistCount={0} onWishlist={() => {}} />

          {/* Visibility Preview */}
          <div style={cardStyle}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>Visibility Preview</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              Mode: <span style={{ textTransform: 'capitalize', color: 'var(--accent-2)' }}>{form.visibility}</span>
            </div>
            {form.visibility === 'custom' && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                Visible to: {form.customEntities.filter(c => form.customEntities.includes(c)).join(', ') || 'None'}
              </div>
            )}
          </div>

          {/* Registration Form Preview */}
          {form.questionnaireState.enableRegForm && (
            <div style={cardStyle}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 12 }}>Registration Form Preview</div>
              {form.questionnaireState.formFields.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>No questions added yet. Default fields (Name, Email) will be collected.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {form.questionnaireState.formFields.map((field, idx) => (
                    <div key={field.id} style={{ borderBottom: idx < form.questionnaireState.formFields.length - 1 ? '1px solid var(--border-2)' : 'none', paddingBottom: idx < form.questionnaireState.formFields.length - 1 ? 12 : 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                        {field.question || 'Untitled Question'} {field.required && <span style={{ color: '#e5484d' }}>*</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Type: {field.type}
                      </div>
                      {field.type === 'text' && (
                        field.responseType === 'paragraph' ? (
                          <textarea className="cinput" readOnly placeholder="Long answer text..." style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px', minHeight: 60, resize: 'vertical' }} />
                        ) : (
                          <input className="cinput" readOnly placeholder="Short answer text..." style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px' }} />
                        )
                      )}
                      {field.type === 'yes_no' && (
                        <div style={{ display: 'flex', gap: 16 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                            <input type="radio" disabled /> Yes
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                            <input type="radio" disabled /> No
                          </label>
                        </div>
                      )}
                      {field.type === 'email' && (
                        <input type="email" className="cinput" readOnly placeholder="Email address..." style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px' }} />
                      )}
                      {field.type === 'date' && (
                        <input type="date" className="cinput" readOnly style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px' }} />
                      )}
                      {field.type === 'time' && (
                        <input type="time" className="cinput" readOnly style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px' }} />
                      )}
                      {field.type === 'options' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {(field.options || []).map((opt, oIdx) => (
                            <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                              <input type={field.selectionType === 'multiple' ? 'checkbox' : 'radio'} disabled />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {field.type === 'social' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, background: 'var(--border)', padding: '3px 6px', borderRadius: 4, color: 'var(--ink-2)' }}>
                            {field.platform === 'any' ? 'Any' : field.platform.toUpperCase()}
                          </span>
                          <input className="cinput" readOnly placeholder="Profile URL" style={{ background: 'var(--bg-2)', fontSize: 11, padding: '6px 10px', flex: 1 }} />
                        </div>
                      )}
                      {field.type === 'company' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input className="cinput" readOnly placeholder="Company Name" style={{ background: 'var(--bg-2)', fontSize: 11, padding: '6px 10px' }} />
                          {field.collectJobTitle && (
                            <input className="cinput" readOnly placeholder="Job Title" style={{ background: 'var(--bg-2)', fontSize: 11, padding: '6px 10px' }} />
                          )}
                        </div>
                      )}
                      {field.type === 'checkbox' && (
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                          <input type="checkbox" disabled />
                          <span>{field.question || 'Tick this box'}</span>
                        </label>
                      )}
                      {field.type === 'terms' && (
                        <div style={{ padding: 8, background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>{field.termsText}</div>
                          {field.termsLinks && (
                            <a href={field.termsLinks} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent-2)', textDecoration: 'underline', display: 'block', marginTop: 4 }}>
                              View Terms Link
                            </a>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                            <input type="checkbox" disabled />
                            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>I accept the terms</span>
                          </div>
                        </div>
                      )}
                      {field.type === 'phone' && (
                        <input className="cinput" readOnly placeholder="+1 (555) 000-0000" style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px' }} />
                      )}
                      {field.type === 'website' && (
                        <input className="cinput" readOnly placeholder="https://yourwebsite.com" style={{ background: 'var(--bg-2)', fontSize: 12, padding: '8px 12px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completeness Card */}
          <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--surface)', boxShadow: 'var(--sh-sm)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 16 }}>Event Completeness ({pct}%)</div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-2)', borderRadius: 999 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: form.title ? 'var(--ink)' : 'var(--ink-3)' }}><I.check style={{ color: form.title ? 'var(--accent-2)' : 'var(--ink-3)', width: 14 }} /> Title</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: form.startDate ? 'var(--ink)' : 'var(--ink-3)' }}><I.check style={{ color: form.startDate ? 'var(--accent-2)' : 'var(--ink-3)', width: 14 }} /> Date &amp; Time</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: form.locationState.venue ? 'var(--ink)' : 'var(--ink-3)' }}><I.check style={{ color: form.locationState.venue ? 'var(--accent-2)' : 'var(--ink-3)', width: 14 }} /> Location</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: form.desc ? 'var(--ink)' : 'var(--ink-3)' }}><I.check style={{ color: form.desc ? 'var(--accent-2)' : 'var(--ink-3)', width: 14 }} /> Description</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CREATE_EVENT_CSS = `
    .create { height: 100%; width: 100%; display: flex; align-items: stretch; background: var(--bg-2); overflow: hidden; }
    .create.single { display: block; overflow-y: auto; height: 100%; }
    .create-form { flex: 1 1 auto; width: 100%; height: 100%; overflow-y: auto; box-sizing: border-box; }
    .create-form * { box-sizing: border-box; }
    .cf-inner { width: 100%; }
    .create-head h1 { margin: 2px 0 0; font-size: 28px; line-height: 1.15; }
    .create-container { display: grid; grid-template-columns: 1fr; gap: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-xl); padding: 24px; box-shadow: var(--sh-md); }
    @media (min-width: 769px) {
      .create-container { grid-template-columns: 1fr 3fr; padding: 32px; gap: 32px; }
      .banner-section { grid-column: 1; grid-row: 1; position: sticky; top: 24px; align-self: start; }
      .form-section { grid-column: 2; grid-row: 1; }
    }
    @media (max-width: 768px) {
      .create-container { grid-template-columns: 1fr; padding: 20px 16px; gap: 24px; }
      .banner-section { order: -1; }
    }
    .form-section { display: flex; flex-direction: column; gap: 28px; }
    .form-group-section { border-bottom: 1px solid var(--border-2); padding-bottom: 24px; }
    .form-group-section:last-child { border-bottom: none; padding-bottom: 0; }
    .form-group-title { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px; }
    .banner-square-container { width: 100%; aspect-ratio: 1 / 1; position: relative; }
    .schedule-card { display: flex; gap: 12px; align-items: flex-start; width: 100%; }
    .schedule-left { flex: 1; display: flex; flex-direction: column; gap: 12px; }
    .schedule-row { display: grid; grid-template-columns: 80px 1fr 110px; align-items: center; background: var(--field); border: 1px solid var(--border); border-radius: 14px; overflow: visible; }
    .schedule-label { padding: 16px; font-weight: 600; color: var(--ink-2); font-size: 14px; }
    .schedule-label.active { color: var(--accent-2); }
    .timezone-card { width: 170px; background: var(--field); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; gap: 12px; align-items: flex-start; transition: border-color 0.2s, background-color 0.2s; }
    .timezone-card:hover { border-color: var(--accent-2); background: var(--accent-soft); }
    .tz-main { font-weight: 700; color: var(--ink); font-size: 14px; }
    .tz-city { color: var(--ink-3); font-size: 13px; margin-top: 4px; }
    @media (max-width: 768px) {
      .create-form { height: auto; overflow-y: visible; }
      .create-head h1 { font-size: 24px; }
      .schedule-card { flex-direction: column; gap: 10px; }
      .timezone-card { width: 100%; }
      .schedule-row { grid-template-columns: 1fr; }
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
  `;

  return (
    <>
      <div className={`create ${mobile ? 'single' : ''}`}>
        <style dangerouslySetInnerHTML={{ __html: CREATE_EVENT_CSS }} />
        <div className="create-form" style={{ backgroundColor: 'var(--bg-2)', padding: mobile ? '14px 12px 40px' : '24px 32px 40px', position: 'relative' }}>
          <div className="cf-inner" style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div className="create-head" style={{ marginBottom: 20 }}>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { localStorage.removeItem('sg_draft_event'); if (isEditing) { go('event', editEv); } else { go('home'); } }} style={{ padding: '7px 11px', background: 'var(--surface)' }}><I.arrowL /></button>
              <div>
                {!isEditing && <div className="ck">New event</div>}
                <h1>{isEditing ? 'Edit Event' : 'Create an event'}</h1>
              </div>
            </div>

            <div className="create-container">
              {/* Form panel */}
              <div className="form-section">
                {/* Basic Info */}
                <div className="form-group-section">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                    <div className="cfield" style={{ marginBottom: 0 }}>
                      <label>Event Name</label>
                      <input className="title-input" placeholder="What's your event called?" value={form.title} onChange={e => form.setTitle(e.target.value)} style={{ background: 'var(--field)', border: '1px solid var(--border)', fontSize: 15, height: 42, padding: '0 12px', width: '100%' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                      <div className="cfield" style={{ marginBottom: 0 }}>
                        <label>Category</label>
                        <select className="cselect" value={form.cat} onChange={e => form.setCat(e.target.value)} style={{ background: 'var(--field)', border: '1px solid var(--border)', height: 42 }}>
                          <option value="">Select category...</option>
                          {form.categoriesList.map((c: any) => (
                            <option key={c.id} value={c.name}>{c.icon_value ? `${c.icon_value} ` : ''}{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="cfield" style={{ marginBottom: 0 }}>
                        <label>Visibility</label>
                        <select className="cselect" value={form.visibility} onChange={e => {
                          const val = e.target.value;
                          if (val === 'public' && !allowedVisibilities.includes('public')) { form.triggerUpgrade('Public Event Visibility'); return; }
                          if (val === 'unlisted' && !allowedVisibilities.includes('unlisted')) { form.triggerUpgrade('Unlisted Event Visibility'); return; }
                          if (val === 'custom' && !allowedVisibilities.includes('custom')) { form.triggerUpgrade('Custom Access Event Visibility'); return; }
                          form.setVisibility(val);
                          if (val === 'custom') form.setAccessModalOpen(true);
                        }} style={{ background: 'var(--field)', border: '1px solid var(--border)', height: 42 }}>
                          <option value="public">{!allowedVisibilities.includes('public') && '🔒 '}Public</option>
                          <option value="unlisted">{!allowedVisibilities.includes('unlisted') && '🔒 '}Unlisted</option>
                          <option value="custom">{!allowedVisibilities.includes('custom') && '🔒 '}Custom Access</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {form.visibility === 'custom' && (
                    <div style={{ marginBottom: 16, padding: 12, background: 'var(--field)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Custom Visible Entities</span>
                        <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => form.setAccessModalOpen(true)} style={{ padding: '4px 8px', fontSize: 11 }}>Configure Access</button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {getSelectedNodesWithDetails(ACCESS_TREE, form.selectedAccess.restricted).map(entity => {
                          const icon = entity.type === 'community' ? '🏛️' : entity.type === 'subcommunity' ? '📁' : '👥';
                          return (
                            <span key={entity.id} onClick={() => form.setAccessModalOpen(true)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-soft)', color: 'var(--accent-2)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 999, cursor: 'pointer' }}>
                              <span>{icon}</span><span>{entity.name}</span>
                            </span>
                          );
                        })}
                        {getSelectedNodesWithDetails(ACCESS_TREE, form.selectedAccess.restricted).length === 0 && (
                          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>No visible entities selected yet. Click "Configure Access" to customize.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="cfield" style={{ marginBottom: 0 }}>
                    <label>Event Description</label>
                    <div style={{ minHeight: 64, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px', color: form.desc ? 'var(--ink)' : 'var(--ink-3)', cursor: 'pointer', fontSize: 14 }} onClick={() => form.setDescModalOpen(true)}>
                      {form.desc ? form.desc : "Click to open editor. Tell people what to expect — the vibe, who it's for, what they'll leave with."}
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="form-group-section">
                  <div className="schedule-card">
                    <div className="schedule-left">
                      <div className="schedule-row" style={{ height: 48 }}>
                        <div className={`schedule-label ${form.startDate || form.startTime ? 'active' : ''}`} style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>● Start</div>
                        <DatePicker value={form.startDate} onChange={val => { form.setStartDate(val); if (!form.endDate || form.endDate < val) form.setEndDate(val); }} mobile={mobile} compact={true} />
                        <TimePicker value={form.startTime} onChange={time => { form.setStartTime(time); if (time) form.setEndTime(addOneHour(time)); }} mobile={mobile} compact={true} />
                      </div>
                      <div className="schedule-row" style={{ height: 48, marginTop: 12 }}>
                        <div className="schedule-label" style={{ padding: '0 12px', display: 'flex', alignItems: 'center' }}>○ End</div>
                        <DatePicker value={form.endDate} onChange={form.setEndDate} mobile={mobile} compact={true} />
                        <TimePicker value={form.endTime} onChange={form.setEndTime} mobile={mobile} compact={true} />
                      </div>
                      {getDurationText(form.startDate, form.startTime, form.endDate, form.endTime) && (
                        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          ⏱️ <span style={{ fontWeight: 600 }}>Duration:</span> {getDurationText(form.startDate, form.startTime, form.endDate, form.endTime)}
                        </div>
                      )}
                    </div>
                    {(() => {
                      const tzInfo = getTzInfo(form.timezone);
                      return (
                        <div className="timezone-card" onClick={() => form.setTzModalOpen(true)} style={{ cursor: 'pointer', height: 108, width: mobile ? '100%' : 180, boxSizing: 'border-box' }}>
                          <I.globe style={{ color: 'var(--accent-2)', width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <div className="tz-main">{tzInfo.main}</div>
                            <div className="tz-city">{tzInfo.city}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Location */}
                <div className="form-group-section">
                  <LocationSection
                    venue={form.locationState.venue}
                    setVenue={form.locationState.setVenue}
                    locType={form.locationState.locType}
                    setLocType={form.locationState.setLocType}
                    eventId={editEv?.id !== 'new' ? editEv?.id : null}
                    existingVirtualMeeting={form.existingVirtualMeeting}
                    offlineEntryType={form.locationState.offlineEntryType}
                    setOfflineEntryType={form.locationState.setOfflineEntryType}
                    onEventCreated={async (provider: string) => {
                      if (!form.title) throw new Error('Title is required before creating a meeting.');
                      if (!form.startDate) throw new Error('Start date is required.');
                      if (!form.startTime) throw new Error('Start time is required.');
                      if (!form.endDate) throw new Error('End date is required.');
                      if (!form.endTime) throw new Error('End time is required.');

                      const sTime24 = parse12to24(form.startTime) || '00:00';
                      const s = new Date(`${form.startDate}T${sTime24}:00`);
                      const eTime24 = parse12to24(form.endTime) || '00:00';
                      const e = new Date(`${form.endDate}T${eTime24}:00`);

                      const payload = { title: form.title, starts_at: s.toISOString(), ends_at: e.toISOString(), status: 'draft', virtual_provider: provider };
                      const token = localStorage.getItem('token');
                      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
                      const res = await fetch(`${form.apiBase}/api/events`, { method: 'POST', headers, body: JSON.stringify(payload) });
                      const data = await res.json();
                      if (!data.success) throw new Error(data.message || 'Failed to create draft event');
                      if (data.data.virtualMeeting) {
                        form.setExistingVirtualMeeting(data.data.virtualMeeting);
                        form.locationState.setVenue(data.data.virtualMeeting.joinUrl);
                        form.locationState.setLocType('online');
                      }
                      window.history.replaceState(null, '', `/events/${data.data.id}/edit`);
                      window.location.reload();
                    }}
                    onProviderSwitch={(newUrl: string, newMeeting: any) => {
                      form.setExistingVirtualMeeting(newMeeting);
                      form.locationState.setVenue(newUrl || '');
                      form.locationState.setLocType(newUrl ? 'online' : 'physical');
                    }}
                  />
                </div>

                {/* Access & Registration */}
                <div className="form-group-section">
                  <h3 className="form-group-title">🔒 Access &amp; Registration</h3>
                  <div className="cfield" style={{ marginBottom: 16 }}>
                    <label>Join Eligibility</label>
                    <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
                      <button type="button" onClick={() => { if (!allowedJoinModes.includes('public')) { form.triggerUpgrade('Public Event Join Eligibility'); return; } form.setJoinEligibility('public'); }}
                        style={{ padding: '12px', borderRadius: 'var(--r-md)', border: form.joinEligibility === 'public' ? '1.5px solid var(--accent-2)' : '1px solid var(--border)', background: form.joinEligibility === 'public' ? 'var(--accent-soft)' : 'var(--field)', color: 'var(--ink)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', outline: 'none', fontFamily: 'inherit' }}>
                        {!allowedJoinModes.includes('public') && '🔒 '}🌐 Public Event
                        <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', marginTop: 4 }}>Anyone can view and register for this event.</div>
                      </button>
                      <button type="button" onClick={() => { if (!allowedJoinModes.includes('restricted')) { form.triggerUpgrade('Restricted Access Event Join Eligibility'); return; } form.setJoinEligibility('restricted'); form.setAccessModalOpen(true); }}
                        style={{ padding: '12px', borderRadius: 'var(--r-md)', border: form.joinEligibility === 'restricted' ? '1.5px solid var(--accent-2)' : '1px solid var(--border)', background: form.joinEligibility === 'restricted' ? 'var(--accent-soft)' : 'var(--field)', color: 'var(--ink)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', outline: 'none', fontFamily: 'inherit' }}>
                        {!allowedJoinModes.includes('restricted') && '🔒 '}👥 Restricted Access
                        <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', marginTop: 4 }}>Only members of selected groups can join.</div>
                      </button>
                      <button type="button" onClick={() => { if (!allowedJoinModes.includes('invite')) { form.triggerUpgrade('Invite Only Event Join Eligibility'); return; } form.setJoinEligibility('invite'); }}
                        style={{ padding: '12px', borderRadius: 'var(--r-md)', border: form.joinEligibility === 'invite' ? '1.5px solid var(--accent-2)' : '1px solid var(--border)', background: form.joinEligibility === 'invite' ? 'var(--accent-soft)' : 'var(--field)', color: 'var(--ink)', fontWeight: 600, cursor: 'pointer', textAlign: 'left', outline: 'none', fontFamily: 'inherit' }}>
                        {!allowedJoinModes.includes('invite') && '🔒 '}✉️ Invite Only
                        <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', marginTop: 4 }}>Only invited guests can register for this event.</div>
                      </button>
                    </div>
                  </div>

                  {form.joinEligibility === 'restricted' && (
                    <div style={{ marginBottom: 16, padding: 12, background: 'var(--field)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginTop: -4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}>Allowed Groups</span>
                        <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => form.setAccessModalOpen(true)} style={{ padding: '4px 8px', fontSize: 11 }}>⚙️ Configure</button>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {getSelectedNodesWithDetails(ACCESS_TREE, form.selectedAccess.restricted).map(entity => {
                          const icon = entity.type === 'community' ? '🏛️' : entity.type === 'subcommunity' ? '📁' : '👥';
                          return (
                            <span key={entity.id} onClick={() => form.setAccessModalOpen(true)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent-soft)', color: 'var(--accent-2)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 999, cursor: 'pointer' }}>
                              <span>{icon}</span><span>{entity.name}</span>
                            </span>
                          );
                        })}
                        {getSelectedNodesWithDetails(ACCESS_TREE, form.selectedAccess.restricted).length === 0 && (
                          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>No groups selected yet. Click "Configure" to select.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', gap: '16px', marginBottom: 20 }}>
                    <div style={{ padding: 12, background: 'var(--field)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => form.ticketManager.setTicketModalOpen(true)}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ticket Price</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center', minHeight: 36 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{form.ticketManager.type === 'free' ? 'Free' : form.ticketManager.type === 'paid' ? 'Paid' : form.ticketManager.type === 'cash' ? 'Cash' : form.ticketManager.type}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Click to customize tiers &amp; pricing</span>
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--field)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Require Approval</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 36 }}>
                        <Toggle on={form.approval} onClick={() => form.setApproval(v => !v)} />
                        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{form.approval ? 'On' : 'Off'}</span>
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--field)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => form.capacityState.setCapacityModalOpen(true)}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Capacity Limit</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center', minHeight: 36 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{form.capacityState.capacityEnabled ? `${form.capacityState.capacity || '—'} Limited` : 'Unlimited'}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{form.capacityState.waitlist ? 'Waitlist Enabled' : 'Waitlist Disabled'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Schedule */}
                  <div style={{ padding: 16, background: 'var(--field)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Registration Schedule</div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      {['OPEN', 'CLOSED', 'SCHEDULED'].map(stVal => (
                        <label key={stVal} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--ink)' }}>
                          <input type="radio" checked={form.registrationStatus === stVal} onChange={() => form.setRegistrationStatus(stVal)} style={{ accentColor: 'var(--accent-2)' }} />
                          {stVal === 'OPEN' ? 'Open Now' : stVal === 'CLOSED' ? 'Closed (Coming Soon)' : 'Scheduled'}
                        </label>
                      ))}
                    </div>
                    {form.registrationStatus === 'SCHEDULED' && (
                      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                        <div className="cfield" style={{ marginBottom: 0 }}><label style={{ fontSize: 12, marginBottom: 4 }}>Registration Opens At</label>
                          <div style={{ display: 'flex', gap: 8 }}><DatePicker value={form.regStartDate} onChange={form.setRegStartDate} mobile={mobile} compact={true} /><TimePicker value={form.regStartTime} onChange={form.setRegStartTime} mobile={mobile} compact={true} /></div>
                        </div>
                        <div className="cfield" style={{ marginBottom: 0 }}><label style={{ fontSize: 12, marginBottom: 4 }}>Registration Closes At</label>
                          <div style={{ display: 'flex', gap: 8 }}><DatePicker value={form.regEndDate} onChange={form.setRegEndDate} mobile={mobile} compact={true} /><TimePicker value={form.regEndTime} onChange={form.setRegEndTime} mobile={mobile} compact={true} /></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Questionnaire */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16, background: 'var(--field)', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 80, cursor: 'pointer', marginBottom: 16 }} onClick={() => form.questionnaireState.setQuestModalOpen(true)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Registration Questionnaire</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>Customize form questions and fields.</div>
                      </div>
                      <Toggle on={form.questionnaireState.enableRegForm} onClick={e => { e.stopPropagation(); const next = !form.questionnaireState.enableRegForm; form.questionnaireState.setEnableRegForm(next); if (next) form.questionnaireState.setQuestModalOpen(true); }} />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="cfield" style={{ marginBottom: 0 }}>
                    <label>Event Instructions (Optional)</label>
                    <div style={{ minHeight: 48, background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '12px 16px', color: form.instructions ? 'var(--ink)' : 'var(--ink-3)', cursor: 'pointer', fontSize: 14, lineHeight: '1.4' }} onClick={() => form.setInstModalOpen(true)}>
                      {form.instructions ? (form.instructions.length > 140 ? form.instructions.substring(0, 140) + ' . . .' : form.instructions) : 'Click to add attendee instructions (e.g. what to bring, arrival guidelines).'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner / Host section */}
              <div className="banner-section">
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Event Banner</label>
                <input type="file" ref={form.fileInputRef} onChange={form.handleFileUpload} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} />
                <div className="banner-square-container">
                  <div className={`cover-up ${form.cover ? 'filled' : ''}`} onDragOver={e => { e.preventDefault(); form.setIsDraggingBanner(true); }} onDragLeave={() => form.setIsDraggingBanner(false)} onDrop={e => { e.preventDefault(); form.setIsDraggingBanner(false); if (e.dataTransfer.files?.[0]) form.validateAndProcessFile(e.dataTransfer.files[0]); }} onClick={() => form.fileInputRef.current?.click()}
                    style={{ ...(form.cover && !form.cover.startsWith('linear-gradient') ? { backgroundImage: `url(${form.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : form.cover ? { background: form.cover } : {}), borderRadius: 'var(--r-md)', position: 'absolute', inset: 0, border: form.isDraggingBanner ? '2.5px dashed var(--accent-2)' : '1.5px dashed var(--border)', transition: 'all 0.2s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.cover && form.cover.startsWith('linear-gradient') && <Grain />}
                    {form.isUploadingBanner && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-md)' }}>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Uploading...</span>
                      </div>
                    )}
                    <div className="up-hint" style={{ color: form.cover ? '#fff' : 'var(--ink-3)', textShadow: form.cover && !form.cover.startsWith('linear-gradient') ? '0 1px 4px rgba(0,0,0,0.6)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div className="uic" style={{ background: form.cover ? 'rgba(255,255,255,0.25)' : 'var(--accent-soft)', color: form.cover ? '#fff' : 'var(--accent-2)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.image style={{ width: 20, height: 20 }} /></div>
                      <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{form.cover ? 'Change Banner' : 'Upload Banner (1:1)'}</span>
                    </div>
                  </div>
                </div>
                {form.bannerError && <div style={{ color: '#e5484d', fontSize: 12, marginTop: 8, fontWeight: 500 }}>⚠️ {form.bannerError}</div>}
                <div id="cover-picker-label" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 12 }}>Square ratio (JPG, PNG, WEBP)</div>

                {/* Host As row */}
                <div onClick={() => form.setHostModalOpen(true)} style={{ marginTop: 20, padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s, background 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-2)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {form.hostEntityId === 'standalone' ? <Avatar name={ME.name} size={32} /> : (() => {
                      const grp = form.hostGroups.find(g => g.entity_id === form.hostEntityId);
                      return <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', background: grp?.cover || 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 'bold' }}>{grp?.icon || grp?.name?.[0]?.toUpperCase() || '👥'}</div>;
                    })()}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hosted by</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 2 }}>{form.hostEntityId === 'standalone' ? ME.name : (form.hostGroups.find(g => g.entity_id === form.hostEntityId)?.name || 'Select Host')}</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--ink-3)', display: 'flex', alignItems: 'center' }}><I.chevD style={{ width: 16, height: 16 }} /></div>
                </div>
              </div>
            </div>

            {/* Bottom Footer bar */}
            <div className="create-foot" style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--r-xl)', padding: '16px 24px', display: 'flex', gap: '10px', alignItems: 'center', marginTop: 24, boxShadow: 'var(--sh-md)' }}>
              <button className="hbtn hbtn--ghost" onClick={() => { localStorage.removeItem('sg_draft_event'); if (isEditing) { go('event', editEv); } else { go('home'); } }} disabled={form.loading}>{isEditing ? 'Discard' : 'Cancel'}</button>
              {form.submitError && <span style={{ color: 'red', fontSize: '12px' }}>{form.submitError}</span>}
              <div className="sp" style={{ flex: 1 }} />
              <button className="hbtn hbtn--ghost" onClick={() => form.handlePublish(true)} disabled={form.loading}>{form.loading ? 'Saving...' : 'Save draft'}</button>
              <button className="hbtn hbtn--ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => go('preview-event', { ...previewEv, id: 'new', host: ME.name, hostBy: ME.name, cap: form.capacityState.capacity || 180, desc: form.desc, formFields: form.questionnaireState.formFields, __draft: draftSnapshot })} disabled={form.loading}><I.external /> Preview</button>
              <button className="hbtn hbtn--primary" onClick={() => form.handlePublish(false)} disabled={form.loading}><I.check /> {form.loading ? 'Saving...' : (isEditing ? 'Save' : 'Publish Event')}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Timezone Modal */}
      {form.tzModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: 400, borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--sh-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Select Timezone</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => form.setTzModalOpen(false)} style={{ border: 'none' }}><I.x /></button>
            </div>
            <input className="cinput" placeholder="Search timezone or city..." value={form.tzSearchQuery} onChange={e => form.setTzSearchQuery(e.target.value)} style={{ marginBottom: 16, width: '100%' }} />
            <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TIMEZONES.filter(tz => tz.city.toLowerCase().includes(form.tzSearchQuery.toLowerCase()) || tz.label.toLowerCase().includes(form.tzSearchQuery.toLowerCase())).map(tz => (
                <button key={tz.value} className="hbtn hbtn--ghost" style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', padding: '12px 16px', border: form.timezone === tz.value ? '1.5px solid var(--accent-2)' : '1px solid var(--border)', borderRadius: 'var(--r-md)', background: form.timezone === tz.value ? 'var(--accent-soft)' : 'var(--surface)' }}
                  onClick={() => { form.setTimezone(tz.value); form.setTzModalOpen(false); form.setTzSearchQuery(''); }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{tz.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{tz.city}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Host Selection Modal */}
      {form.hostModalOpen && (() => {
        const modalWidth = mobile ? '100%' : '520px';
        const modalHeight = mobile ? '80%' : 'auto';
        const modalAlignSelf = mobile ? 'flex-end' : 'center';
        const modalBorderRadius = mobile ? '20px 20px 0 0' : 'var(--r-xl)';
        const isCommunity = (g: any) => {
          const name = (g.name || '').toLowerCase();
          return name.includes('community') || name.includes('hub') || name.includes('collective') || name.includes('network') || name.includes('association') || name.includes('tech') || name.includes('india') || name.includes('society');
        };
        const filteredPersonal = (form.hostSearchQuery.trim() === '' || ME.name.toLowerCase().includes(form.hostSearchQuery.toLowerCase())) && (form.hostFilterType === 'all');
        const filteredGroups = form.hostGroups.filter(g => g.name.toLowerCase().includes(form.hostSearchQuery.toLowerCase()) && (form.hostFilterType === 'all' || form.hostFilterType === 'group') && !isCommunity(g));
        const filteredCommunities = form.hostGroups.filter(g => g.name.toLowerCase().includes(form.hostSearchQuery.toLowerCase()) && (form.hostFilterType === 'all' || form.hostFilterType === 'community') && isCommunity(g));
        return (
          <div onClick={e => { if (e.target === e.currentTarget) form.setHostModalOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: modalAlignSelf, justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--surface)', width: modalWidth, maxHeight: mobile ? '90%' : '650px', height: modalHeight, borderRadius: modalBorderRadius, display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Host As</h2>
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => form.setHostModalOpen(false)} style={{ border: 'none' }}><I.x /></button>
              </div>
              <div style={{ padding: '16px 24px 8px 24px', display: 'flex', gap: 10 }}>
                <input ref={form.searchInputRef} className="cinput" placeholder="Search..." value={form.hostSearchQuery} onChange={e => form.setHostSearchQuery(e.target.value)} style={{ flex: 1, height: 40, background: 'var(--field)', border: '1px solid var(--border)' }} />
                <select className="cselect" value={form.hostFilterType} onChange={e => form.setHostFilterType(e.target.value as any)} style={{ width: 140, height: 40, background: 'var(--field)', border: '1px solid var(--border)' }}>
                  <option value="all">All Types</option><option value="group">Groups</option><option value="community">Communities</option>
                </select>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                {filteredPersonal && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, letterSpacing: '0.05em' }}>Personal</div>
                    <button type="button" onClick={() => form.setHostEntityId('standalone')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', border: form.hostEntityId === 'standalone' ? '2px solid var(--accent-2)' : '1px solid var(--border)', background: form.hostEntityId === 'standalone' ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                      <input type="radio" checked={form.hostEntityId === 'standalone'} readOnly style={{ accentColor: 'var(--accent-2)' }} /><Avatar name={ME.name} size={28} />
                      <div><div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{ME.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>Personal profile</div></div>
                    </button>
                  </div>
                )}
                {filteredGroups.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, letterSpacing: '0.05em' }}>Groups</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredGroups.map(grp => (
                        <button key={grp.entity_id} type="button" onClick={() => form.setHostEntityId(grp.entity_id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', border: form.hostEntityId === grp.entity_id ? '2px solid var(--accent-2)' : '1px solid var(--border)', background: form.hostEntityId === grp.entity_id ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                          <input type="radio" checked={form.hostEntityId === grp.entity_id} readOnly style={{ accentColor: 'var(--accent-2)' }} />
                          <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: grp.cover || 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>{grp.icon || grp.name?.[0]?.toUpperCase()}</div>
                          <div><div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{grp.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{grp.role === 'owner' ? 'Owner' : 'Admin'} · Group</div></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {filteredCommunities.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8, letterSpacing: '0.05em' }}>Communities</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredCommunities.map(grp => (
                        <button key={grp.entity_id} type="button" onClick={() => form.setHostEntityId(grp.entity_id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', border: form.hostEntityId === grp.entity_id ? '2px solid var(--accent-2)' : '1px solid var(--border)', background: form.hostEntityId === grp.entity_id ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}>
                          <input type="radio" checked={form.hostEntityId === grp.entity_id} readOnly style={{ accentColor: 'var(--accent-2)' }} />
                          <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: grp.cover || 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>{grp.icon || grp.name?.[0]?.toUpperCase()}</div>
                          <div><div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13 }}>{grp.name}</div><div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{grp.role === 'owner' ? 'Owner' : 'Admin'} · Community</div></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                <button type="button" className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => form.setHostModalOpen(false)}>Cancel</button>
                <button type="button" className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => form.setHostModalOpen(false)}>Select</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Calendar creation placeholder modal */}
      {form.calModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: 440, borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--sh-xl)' }}>
            <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 600 }}>Create New Calendar</h2>
            <div className="cfield"><label>Calendar Name</label><input className="cinput" placeholder="e.g. Design Workshops" /></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => form.setCalModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => form.setCalModalOpen(false)}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Description Modal Editor */}
      {form.descModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: 640, height: 500, borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Event Description</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => form.setDescModalOpen(false)}><I.x /></button>
            </div>
            <textarea className="ctext" style={{ flex: 1, border: 'none', borderRadius: 0, padding: 24, fontSize: 15, resize: 'none' }} placeholder="Write your full description here..." value={form.desc} onChange={e => form.setDesc(e.target.value)} autoFocus />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
              <button className="hbtn hbtn--ghost" onClick={() => form.setAiModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(120,90,255,.08)', border: '1px solid rgba(120,90,255,.25)', color: '#c8bcff', borderRadius: '999px', padding: '10px 16px' }}>✨ Suggest with AI</button>
              <button className="hbtn hbtn--primary" onClick={() => form.setDescModalOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal Editor */}
      {form.instModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: 640, height: 500, borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Event Instructions</h2>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => form.setInstModalOpen(false)}><I.x /></button>
            </div>
            <textarea id="instructions-textarea" className="ctext" style={{ flex: 1, border: 'none', borderRadius: 0, padding: 24, fontSize: 15, resize: 'none' }} placeholder="Write any instructions for attendees here..." value={form.instructions} onChange={e => form.setInstructions(e.target.value)} autoFocus />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
              <button className="hbtn hbtn--ghost" onClick={() => form.setAiInstModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(120,90,255,.08)', border: '1px solid rgba(120,90,255,.25)', color: '#c8bcff', borderRadius: '999px', padding: '10px 16px' }}>✨ Suggest with AI</button>
              <button className="hbtn hbtn--primary" onClick={() => form.setInstModalOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Instructions Suggestion */}
      {form.aiInstModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: 440, borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--sh-xl)' }}>
            <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>✨ AI Instructions Suggestion</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 24 }}>Let AI write helpful instructions based on your event details.</p>
            <div className="cfield"><label>Instruction Type</label><select className="cselect"><option>General Guidelines</option><option>Arrival &amp; Parking Info</option><option>Pre-requisites / Checklist</option></select></div>
            <div className="cfield"><label>Additional Notes</label><textarea id="ai-inst-notes" className="ctext" placeholder="Any specific instructions to include?" style={{ minHeight: 80 }} /></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => form.setAiInstModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => {
                const notesEl = document.getElementById('ai-inst-notes');
                const notes = notesEl ? (notesEl as HTMLTextAreaElement).value : '';
                const intro = notes ? `**Special Note:** ${notes}\n\n` : '';
                form.setInstructions(intro + `- Please arrive 15 minutes before the start time.\n- Check-in at the registration desk in the main hall.\n- Bring a laptop/notebook for hands-on activities.\n- Parking is available in the public lot near the venue.`);
                form.setAiInstModalOpen(false);
              }}>Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Description Suggestion */}
      {form.aiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--surface)', width: 440, borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--sh-xl)' }}>
            <h2 style={{ fontSize: 20, marginBottom: 8, fontWeight: 600 }}>✨ AI Suggestion</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 24 }}>Let AI write a polished description based on your event details.</p>
            <div className="cfield"><label>Event Mood</label><select className="cselect"><option>Professional</option><option>Casual</option><option>Exciting</option></select></div>
            <div className="cfield"><label>Additional Notes</label><textarea className="ctext" placeholder="Any specific details to include?" style={{ minHeight: 80 }} /></div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => form.setAiModalOpen(false)}>Cancel</button>
              <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => { form.setDesc(`Join us for ${form.title || 'an exciting event'} at ${form.locationState.venue || 'our venue'}. It will be a fantastic experience!`); form.setAiModalOpen(false); }}>Generate</button>
            </div>
          </div>
        </div>
      )}

      <CapacitySettingsModal
        open={form.capacityState.capacityModalOpen}
        onClose={() => form.capacityState.setCapacityModalOpen(false)}
        capacityEnabled={form.capacityState.capacityEnabled}
        setCapacityEnabled={form.capacityState.setCapacityEnabled}
        capacity={form.capacityState.capacity}
        setCapacity={form.capacityState.setCapacity}
        waitlist={form.capacityState.waitlist}
        setWaitlist={form.capacityState.setWaitlist}
        eventMaxParticipants={eventMaxParticipants}
        triggerUpgrade={form.triggerUpgrade}
      />

      <AccessControlModal
        open={form.accessModalOpen}
        onClose={() => form.setAccessModalOpen(false)}
        mode="restricted"
        selectedAccess={form.selectedAccess}
        setSelectedAccess={form.setSelectedAccess}
      />

      <TicketSettingsModal
        open={form.ticketManager.ticketModalOpen}
        onClose={() => form.ticketManager.setTicketModalOpen(false)}
        type={form.ticketManager.type}
        setType={form.ticketManager.setType}
        tickets={form.ticketManager.tickets}
        setTickets={form.ticketManager.setTickets}
        mobile={mobile}
        upgradeModalOpen={form.upgradeModalOpen}
        setUpgradeModalOpen={form.setUpgradeModalOpen}
        upgradeFeature={form.upgradeFeature}
        setUpgradeFeature={form.setUpgradeFeature}
        st={st}
        go={go}
        locType={form.locationState.locType}
        paymentInstructions={form.ticketManager.paymentInstructions}
        setPaymentInstructions={form.ticketManager.setPaymentInstructions}
        paymentHoldHours={form.ticketManager.paymentHoldHours}
        setPaymentHoldHours={form.ticketManager.setPaymentHoldHours}
        allowImageProof={form.ticketManager.allowImageProof}
        setAllowImageProof={form.ticketManager.setAllowImageProof}
        eventStartDate={form.startDate && form.startTime ? `${form.startDate}T${form.startTime}` : undefined}
      />

      <QuestionnaireModal
        open={form.questionnaireState.questModalOpen}
        onClose={() => form.questionnaireState.setQuestModalOpen(false)}
        formFields={form.questionnaireState.formFields}
        setFormFields={form.questionnaireState.setFormFields}
        enableRegForm={form.questionnaireState.enableRegForm}
        setEnableRegForm={form.questionnaireState.setEnableRegForm}
        moveField={form.questionnaireState.moveField}
      />
    </>
  );
}
