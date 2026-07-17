// @ts-nocheck
import React, { useState } from 'react';
import './auth-required-modal.css';
import type { PendingAction, PendingNavigation, PendingActionType } from './route-registry';

const AUTH_PATH = '/pages/Samaagum Auth.html';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequireAuthContext {
  /**
   * Displayed in the modal to explain why auth is needed.
   * Also used to select the appropriate message.
   */
  reason: PendingActionType | 'general';
  /**
   * Where to return the user after login.
   * Only store identifiers (id), never full objects.
   */
  pendingNavigation?: PendingNavigation;
  /**
   * What the user was trying to do — stored for future v2 auto-resume.
   */
  pendingAction?: PendingAction;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRequireAuth() {
  const [modal, setModal] = useState<RequireAuthContext | null>(null);

  const requireAuth = (ctx: RequireAuthContext, action: () => void) => {
    const token = localStorage.getItem('token');
    if (token) {
      action();
      return;
    }

    // Persist caller-provided context — caller owns what gets stored.
    if (ctx.pendingNavigation) {
      localStorage.setItem('pendingNavigation', JSON.stringify(ctx.pendingNavigation));
    }
    if (ctx.pendingAction) {
      // Stored for v2 auto-resume; not auto-executed in v1.
      localStorage.setItem('pendingAction', JSON.stringify(ctx.pendingAction));
    }

    setModal(ctx);
  };

  const closeModal = () => setModal(null);

  return { requireAuth, modal, closeModal };
}

// ─── Modal Component ──────────────────────────────────────────────────────────

const MESSAGES: Record<string, string> = {
  'join-event': 'Sign in to register for this event.',
  'join-group': 'Sign in to join this group.',
  'create':     'Sign in to create events or groups.',
  'rsvp':       'Sign in to RSVP for this event.',
  'bookmark':   'Sign in to save this event.',
  'general':    'Sign in to continue.',
};

interface AuthRequiredModalProps {
  modal: RequireAuthContext | null;
  onClose: () => void;
}

export function AuthRequiredModal({ modal, onClose }: AuthRequiredModalProps) {
  if (!modal) return null;

  const message = MESSAGES[modal.reason] ?? MESSAGES.general;

  return (
    <div className="arm-backdrop" onClick={onClose} role="dialog" aria-modal="true"
      aria-label="Sign in required">
      <div className="arm-card" onClick={(e) => e.stopPropagation()}>
        <div className="arm-icon">🔒</div>
        <h3 className="arm-title">Sign in required</h3>
        <p className="arm-message">{message}</p>
        <div className="arm-actions">
          <a
            href={`${AUTH_PATH}#login`}
            className="hbtn hbtn--ghost"
            id="arm-login-btn"
          >
            Log in
          </a>
          <a
            href={`${AUTH_PATH}#signup`}
            className="hbtn hbtn--primary"
            id="arm-signup-btn"
          >
            Sign up →
          </a>
        </div>
        <button className="arm-dismiss" onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
