import React from 'react';
import { EventPage } from './event';
import { I } from './home-icons';

export const PreviewEventPage = ({ ev, st, go }: any) => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Banner instructing the user that they are in preview mode */}
      <div style={{ 
        background: '#3b82f6', 
        color: 'white', 
        padding: '12px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        zIndex: 100000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <I.globe style={{ width: 20, height: 20 }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>Event Preview Mode</span>
          <span style={{ opacity: 0.8, fontSize: 13, marginLeft: 8 }}>Interactions are disabled. This is how attendees will see your event.</span>
        </div>
        <button 
          className="hbtn" 
          onClick={() => go("edit-event", { __draft: ev.__draft, id: ev.__draft?.id })}
          style={{ background: 'white', color: '#3b82f6', fontWeight: 600, padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
        >
          Back to Edit
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, overflowY: 'auto' }}>
        {/* Invisible overlay that captures and blocks all click events */}
        <div 
          style={{ position: 'absolute', inset: 0, zIndex: 99999, cursor: 'not-allowed' }} 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
          title="Preview mode is read-only"
        />

        {/* The actual event page in "read-only" visual mode */}
        <div style={{ pointerEvents: 'none' }}>
          <EventPage ev={{ ...ev, id: "new" }} st={st} go={() => {}} />
        </div>
      </div>
    </div>
  );
};
