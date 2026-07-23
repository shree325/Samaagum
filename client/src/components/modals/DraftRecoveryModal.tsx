import React from 'react';
import { I } from '../../home-icons';

export interface DraftInfo {
  id: string;
  title: string;
  updated_at: string; // ISO string
  created_at?: string;
  type: 'event' | 'group';
  cover?: string | null;
  source: 'local' | 'cloud';
}

interface DraftRecoveryModalProps {
  drafts: DraftInfo[];
  onContinue: (draft: DraftInfo) => void;
  onStartFresh: () => void;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString();
}

export function DraftRecoveryModal({ drafts, onContinue, onStartFresh, onClose }: DraftRecoveryModalProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  // Safely fallback if drafts is empty, though it shouldn't be rendered if empty
  const currentDraft = drafts[selectedIndex] || drafts[0];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Calculate which item is closest to the top
    const index = Math.round(el.scrollTop / el.clientHeight);
    if (index >= 0 && index < drafts.length && index !== selectedIndex) {
      setSelectedIndex(index);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Backdrop */}
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }} 
        onClick={onClose} 
      />

      {/* Modal */}
      <div 
        style={{ 
          position: 'relative', 
          background: 'var(--surface)', 
          borderRadius: 24, 
          width: '90%', 
          maxWidth: 440, 
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)', 
          border: '1px solid var(--border)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ padding: '32px 32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(109, 94, 252, 0.1), rgba(255, 107, 74, 0.1))', marginBottom: 20 }}>
            {currentDraft?.type === 'event' ? <I.ticket style={{ width: 28, height: 28, color: '#6d5efc' }} /> : <I.groups style={{ width: 28, height: 28, color: '#2a7fff' }} />}
          </div>
          
          <h2 style={{ margin: '0 0 12px 0', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>Continue your draft?</h2>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            You already have {drafts.length > 1 ? 'unpublished drafts' : 'an unpublished draft'}. Would you like to continue editing or start a new one?
          </p>

          <div 
            className={drafts.length > 1 ? "draft-scroll-container" : ""}
            style={{ 
              marginTop: 24, 
              height: 90, // Exactly the height of one draft card (16px * 2 + 56px)
              overflowY: drafts.length > 1 ? 'auto' : 'hidden',
              scrollSnapType: 'y mandatory',
              borderRadius: 16,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-2)',
              scrollBehavior: 'smooth'
            }}
            onScroll={handleScroll}
          >
            {drafts.map((draft) => (
              <div 
                key={draft.id}
                style={{ 
                  height: 88, // 90px minus 2px for borders
                  padding: 16, 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  scrollSnapAlign: 'start'
                }}
              >
                <div style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 10, 
                  background: 'var(--surface-3)', 
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {draft.cover && draft.cover.startsWith('http') ? (
                    <img src={draft.cover} alt="Draft cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <I.image style={{ width: 24, height: 24, color: 'var(--ink-3)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {draft.title || 'Untitled Draft'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 600, 
                      padding: '2px 8px', 
                      borderRadius: 4, 
                      background: draft.source === 'local' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: draft.source === 'local' ? '#f59e0b' : '#10b981',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {draft.source === 'local' ? 'Local Draft' : 'Cloud Draft'}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                      Saved {timeAgo(draft.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', padding: '16px 32px 32px', gap: 12 }}>
          <button 
            onClick={onStartFresh}
            className="hbtn hbtn--ghost"
            style={{ flex: 1, height: 48, borderRadius: 12, fontWeight: 600, fontSize: 15 }}
          >
            Start Fresh
          </button>
          <button 
            onClick={() => onContinue(currentDraft)}
            className="hbtn hbtn--primary"
            style={{ 
              flex: 1, 
              height: 48, 
              borderRadius: 12, 
              fontWeight: 600, 
              fontSize: 15,
              background: 'linear-gradient(135deg, #6d5efc, #2a7fff)',
              border: 'none',
              boxShadow: '0 4px 16px rgba(109, 94, 252, 0.3)'
            }}
          >
            Continue Editing
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .draft-scroll-container::-webkit-scrollbar {
          width: 4px;
        }
        .draft-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .draft-scroll-container::-webkit-scrollbar-thumb {
          background: var(--border-2);
          border-radius: 4px;
        }
        .draft-scroll-container:hover::-webkit-scrollbar-thumb {
          background: var(--ink-3);
        }
      `}} />
    </div>
  );
}
