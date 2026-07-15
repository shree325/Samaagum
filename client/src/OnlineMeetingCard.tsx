import React from 'react';
import { detectProvider, MeetingProviderBadge } from './VirtualMeetings';

interface OnlineMeetingCardProps {
  url: string;
  banner?: string;
  status?: string;
  isPast?: boolean;
}

export function OnlineMeetingCard({ url, banner, status, isPast }: OnlineMeetingCardProps) {
  const provider = detectProvider(url);
  const isCancelled = status === 'cancelled';
  const isDisabled = isCancelled || isPast;

  // Fallback to a default banner if none is provided
  const displayBanner = banner || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000';

  let buttonText = "Join Meeting";
  if (isCancelled) {
    buttonText = "Event Cancelled";
  } else if (isPast) {
    buttonText = "Meeting Ended";
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* Banner Section */}
      <div style={{
        width: '100%',
        height: 160,
        backgroundImage: `url(${displayBanner})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'var(--bg-2)'
      }} />

      {/* Card Content Section */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <MeetingProviderBadge provider={provider} />
        </div>
        
        <div style={{ fontSize: 14, color: 'var(--ink-2)', wordBreak: 'break-all', fontFamily: 'monospace', background: 'var(--bg-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-2)' }}>
          {url}
        </div>

        <button
          className="hbtn hbtn--primary"
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: 15, 
            opacity: isDisabled ? 0.6 : 1, 
            pointerEvents: isDisabled ? 'none' : 'auto',
            background: isDisabled ? 'var(--bg-2)' : undefined,
            color: isDisabled ? 'var(--ink-3)' : undefined,
            border: isDisabled ? '1px solid var(--border)' : undefined
          }}
          onClick={() => !isDisabled && window.open(url, '_blank')}
          disabled={isDisabled}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
