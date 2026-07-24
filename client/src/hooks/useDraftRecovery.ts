import { useState } from 'react';
import { DraftInfo } from '../components/modals/DraftRecoveryModal';
import { apiBase } from '../home-subscription';

interface UseDraftRecoveryResult {
  checkDraft: (type: 'event' | 'group') => Promise<DraftInfo[] | null>;
  deleteBackendDraft: (type: 'event' | 'group', id: string) => void;
  isChecking: boolean;
}

export function useDraftRecovery(): UseDraftRecoveryResult {
  const [isChecking, setIsChecking] = useState(false);

  const checkDraft = async (type: 'event' | 'group'): Promise<DraftInfo[] | null> => {
    if (isChecking) return null; // Prevent rapid concurrent checks
    setIsChecking(true);
    
    let localDraft: DraftInfo | null = null;
    try {
      const localKey = type === 'event' ? 'sg_draft_event' : 'sg_draft_group';
      const localStr = localStorage.getItem(localKey);
      if (localStr) {
        const parsed = JSON.parse(localStr);
        // We only consider it a valid local draft if it has a title or date or some content
        if (parsed.title || parsed.name || parsed.startDate || parsed.desc || parsed.locationType) {
            localDraft = {
              id: parsed.id || 'local',
              title: parsed.title || parsed.name || 'Untitled Draft',
              updated_at: parsed.updated_at || new Date().toISOString(), // Fallback to now if dirty
              type,
              source: 'local',
              cover: parsed.cover || parsed.banner || null
            };
        }
      }
    } catch (e) {
      console.error('Error parsing local draft', e);
    }

    let backendDrafts: DraftInfo[] = [];
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const res = await fetch(`${apiBase}/api/drafts/latest?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          backendDrafts = data.data.map((d: any) => ({ ...d, source: 'cloud' }));
        }
      }
    } catch (e) {
      console.warn('Backend draft check failed, ignoring...', e);
      // Fallback gracefully: don't block
    }

    setIsChecking(false);

    let drafts: DraftInfo[] = [];
    if (localDraft) drafts.push(localDraft);
    if (backendDrafts.length > 0) drafts.push(...backendDrafts);
    
    return drafts.length > 0 ? drafts : null;
  };

  const deleteBackendDraft = (type: 'event' | 'group', id: string) => {
    if (id === 'local') return; // Don't call API for local-only mocks
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Fire and forget
    fetch(`${apiBase}/api/drafts/${type}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => {
      console.warn('Failed to delete backend draft, ignoring', e);
    });
  };

  return { checkDraft, deleteBackendDraft, isChecking };
}
