import React from 'react';
import { useLocation } from '../context/LocationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectCityClick: () => void;
}

export const LocationPermissionModal: React.FC<Props> = ({ isOpen, onClose, onSelectCityClick }) => {
  const { requestGPS, selectCity } = useLocation();

  if (!isOpen) return null;

  const handleAllow = async () => {
    await requestGPS(true);
    onClose();
  };

  const handleChooseCity = () => {
    onClose();
    onSelectCityClick();
  };

  const handleNotNow = () => {
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--surface, #1e1e24)',
        border: '1px solid var(--border, #2e2e38)',
        borderRadius: 16,
        padding: 24,
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 24,
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>📍</div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink, #fff)' }}>Use Your Current Location?</h3>
            <span style={{ fontSize: 12, color: 'var(--ink-muted, #a1a1aa)' }}>Discover events & communities around you</span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-secondary, #d4d4d8)', lineHeight: 1.5 }}>
          Allow GPS access to discover nearby events, local groups, and active communities with much greater accuracy.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <button
            onClick={handleAllow}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Allow Current Location
          </button>
          <button
            onClick={handleChooseCity}
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'transparent',
              color: 'var(--ink, #fff)',
              border: '1px solid var(--border, #3f3f46)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Choose City Instead
          </button>
          <button
            onClick={handleNotNow}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: 'transparent',
              color: 'var(--ink-muted, #a1a1aa)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
