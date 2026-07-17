import React from 'react';
import { I } from '../../../home-icons';

interface ShareDialogProps {
  g: any;
  showShareSheet: boolean;
  setShowShareSheet: (val: boolean) => void;
}

export function ShareDialog({ g, showShareSheet, setShowShareSheet }: ShareDialogProps) {
  return (
    <div style={{ position: "relative" }}>
      <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setShowShareSheet(!showShareSheet)}>
        <I.share /> Share
      </button>
      {showShareSheet && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setShowShareSheet(false)} />
          <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, display: "flex", gap: 8, padding: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--sh-md)", zIndex: 9999 }}>
            {(() => {
              const link = encodeURIComponent(`${window.location.origin}${window.location.pathname}#group=${g.id}`);
              const msg = encodeURIComponent(`Join the ${g.name} group on Samaagum!\n\n${window.location.origin}${window.location.pathname}#group=${g.id}`);
              const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodeURIComponent(`Join the ${g.name} group on Samaagum!`)}&body=${msg}`;
              const btnStyle = { display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", textDecoration: "none" };
              return (
                <>
                  <a href={`https://wa.me/?text=${msg}`} target="_blank" style={btnStyle} title="WhatsApp">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.81 11.81 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/></svg>
                  </a>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${link}`} target="_blank" style={btnStyle} title="Facebook">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`} target="_blank" style={btnStyle} title="LinkedIn">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06s2.06.92 2.06 2.06c0 1.14-.92 2.06-2.06 2.06zM20.45 20.45h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.63-1.84 3.36-1.84 3.59 0 4.25 2.36 4.25 5.43v6.3z"/></svg>
                  </a>
                  <a href={gmailUrl} target="_blank" style={btnStyle} title="Email (Gmail)">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M2.25 7.313v9.937c0 1.242 1.008 2.25 2.25 2.25h3V12L2.25 7.313z" fill="#4285f4"/>
                      <path d="M16.5 19.5h3c1.242 0 2.25-1.008 2.25-2.25V7.313L16.5 12v7.5z" fill="#34a853"/>
                      <path d="M16.5 7.313V12l5.25-3.938c-.126-.816-.807-1.442-1.65-1.442h-3.6L16.5 7.313z" fill="#fbbc04"/>
                      <path d="M7.5 7.313V12L2.25 8.062c.126-.816.807-1.442 1.65-1.442h3.6l-7.5-.693z" fill="#c11812"/>
                      <path d="M21.75 8.062L12 15.375 2.25 8.062 7.5 4.125h9l5.25 3.937z" fill="#ea4335"/>
                    </svg>
                  </a>
                </>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
