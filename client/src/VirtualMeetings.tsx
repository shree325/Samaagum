import React, { useState } from 'react';

export function detectProvider(url: string): 'zoom' | 'google' | 'teams' | 'webex' | 'jitsi' | 'custom' {
  if (!url) return 'custom';
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    
    if (host === 'zoom.us' || host.endsWith('.zoom.us')) return 'zoom';
    if (host === 'meet.google.com') return 'google';
    if (host === 'teams.microsoft.com' || host === 'teams.live.com') return 'teams';
    if (host.endsWith('.webex.com')) return 'webex';
    if (host === 'meet.jit.si' || host.endsWith('.jitsi.org')) return 'jitsi';
    
    return 'custom';
  } catch {
    return 'custom';
  }
}

export function validateProviderUrl(url: string, provider: 'zoom' | 'google'): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'Please enter a valid URL.';
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  if (provider === 'zoom') {
    const validHost = host === 'zoom.us' || host.endsWith('.zoom.us');
    // Zoom links usually look like /j/, /my/, /wc/, /s/
    const validPath = path.startsWith('/j/') || path.startsWith('/my/') || path.startsWith('/wc/') || path.startsWith('/s/');
    if (!validHost || !validPath) {
      return 'Please enter a valid Zoom meeting link (e.g. https://zoom.us/j/123456789).';
    }
  }

  if (provider === 'google') {
    const validHost = host === 'meet.google.com';
    // Google Meet links look like /abc-defg-hij
    const validPath = path.length > 1 && path !== '/';
    if (!validHost || !validPath) {
      return 'Please enter a valid Google Meet link (e.g. https://meet.google.com/abc-defg-hij).';
    }
  }

  return null;
}

export function MeetingProviderBadge({ provider }: { provider: string }) {
  let color = 'var(--ink)';
  let bg = 'var(--surface)';
  let text = 'Virtual Meeting';
  let icon = '🌐';

  switch (provider) {
    case 'zoom':
      color = '#0b5cff';
      bg = '#e6f0ff';
      text = 'Zoom';
      icon = '📹';
      break;
    case 'google':
      color = '#008744';
      bg = '#e6f4ea';
      text = 'Google Meet';
      icon = '🎥';
      break;
    case 'teams':
      color = '#5a5eb9';
      bg = '#eef0f9';
      text = 'Teams';
      break;
    case 'webex':
      color = '#00bceb';
      bg = '#e6f8fd';
      text = 'Webex';
      break;
    case 'jitsi':
      color = '#1d76ba';
      bg = '#e8f2f8';
      text = 'Jitsi';
      break;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: bg, color, fontSize: 13, fontWeight: 500 }}>
      {icon} {text}
    </span>
  );
}

export function MeetingPreviewCard({ url, onEdit, onRemove }: { url: string, onEdit: () => void, onRemove: () => void }) {
  const provider = detectProvider(url);

  return (
    <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 12, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MeetingProviderBadge provider={provider} />
      </div>

      <a href={url} target="_blank" rel="noreferrer" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--accent-1)', fontSize: 13, textDecoration: 'none' }}>
        {url}
      </a>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onEdit} style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer', flex: 1 }}>
          Edit Link
        </button>
        <button type="button" onClick={() => window.open(url, '_blank')} style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer', flex: 1 }}>
          Open
        </button>
        <button type="button" onClick={onRemove} style={{ padding: '8px 12px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, cursor: 'pointer', flex: 1 }}>
          Remove
        </button>
      </div>
    </div>
  );
}

export function MeetingLinkModal({ provider: launcherProvider, initialUrl, onClose, onSave }: { provider: 'zoom' | 'google', initialUrl: string, onClose: () => void, onSave: (url: string) => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);

  const title = launcherProvider === 'zoom' ? 'Add Zoom Link' : 'Add Google Meet Link';
  const openUrl = launcherProvider === 'zoom' ? 'https://zoom.us/meeting' : 'https://meet.google.com/new';
  const openText = launcherProvider === 'zoom' ? 'Open Zoom' : 'Open Google Meet';

  const detectedProvider = detectProvider(url);
  const isMismatch = url && detectedProvider !== 'custom' && detectedProvider !== launcherProvider;

  const handleSave = () => {
    // Only strictly validate if it's not a known mismatch (we forgive mismatches)
    if (!isMismatch) {
       const validationError = validateProviderUrl(url, launcherProvider);
       if (validationError) {
         setError(validationError);
         return;
       }
    }
    
    // It's valid or a forgiven mismatch
    onSave(url);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 12000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--sh-xl)", border: "1px solid var(--border)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer" }}>
          ✕
        </button>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 24px 0", color: "var(--ink)" }}>{title}</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0 }}>1</div>
            <div style={{ flex: 1 }}>
              <button 
                type="button"
                className="hbtn hbtn--ghost" 
                style={{ padding: "6px 12px", fontSize: 13 }}
                onClick={() => window.open(openUrl, '_blank')}
              >
                {openText} ↗
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0 }}>2</div>
            <div style={{ flex: 1, paddingTop: 3, fontSize: 14, color: 'var(--ink)' }}>
              Create a meeting
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', flexShrink: 0 }}>3</div>
            <div style={{ flex: 1, paddingTop: 3, fontSize: 14, color: 'var(--ink)' }}>
              Paste the meeting link below
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <input
            autoFocus
            type="text"
            className="cinput"
            placeholder="https://"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
            style={{ width: "100%", background: "var(--field)", border: error ? "1px solid var(--red)" : "1px solid var(--border)" }}
          />
          {error && <div style={{ fontSize: 12, color: 'var(--red)' }}>{error}</div>}
          {!error && url && !isMismatch && !validateProviderUrl(url, launcherProvider) && (
            <div style={{ fontSize: 12, color: 'var(--green)' }}>✓ Valid {launcherProvider === 'zoom' ? 'Zoom' : 'Google Meet'} link</div>
          )}
          {isMismatch && (
             <div style={{ fontSize: 12, color: '#0284c7', background: '#e0f2fe', padding: '6px 10px', borderRadius: 6 }}>
               ✓ Detected <b>{detectedProvider}</b> link — saving as {detectedProvider} instead.
             </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button 
            className="hbtn hbtn--ghost" 
            style={{ padding: "10px 16px", fontSize: 14 }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="hbtn hbtn--primary" 
            style={{ padding: "10px 16px", fontSize: 14, opacity: !url ? 0.5 : 1, pointerEvents: !url ? 'none' : 'auto' }}
            onClick={handleSave}
          >
            Save Meeting Link
          </button>
        </div>
      </div>
    </div>
  );
}

// STUBS for backward compatibility with create_event.tsx imports before it gets updated
export function useIntegrationStatus(apiBase: string, authToken: string) {
  return { status: { zoom: false, google: false }, loading: false, refresh: () => {} };
}

export function ConnectModal(props: any) {
  return null;
}

