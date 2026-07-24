import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenCitySelector: () => void;
}

export const LocationSettingsModal: React.FC<Props> = ({ isOpen, onClose, onOpenCitySelector }) => {
  const { location, refreshLocation, setMode, deleteGPSData } = useLocation();
  const [showDevDetails, setShowDevDetails] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    await refreshLocation();
  };

  const handleClearGps = () => {
    deleteGPSData();
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
        maxWidth: 460,
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--ink, #fff)' }}>Location Settings</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {/* Source Badge */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--surface-subtle, #27272a)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted, #a1a1aa)' }}>Active Location Mode</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink, #fff)', marginTop: 2 }}>
              📍 {location.source === 'GPS' ? 'Using GPS' : location.source === 'MANUAL' ? 'Selected City' : location.source === 'IP' ? 'IP Location' : 'Global'}
            </div>
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: 6,
            background: location.mode === 'AUTO' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
            color: location.mode === 'AUTO' ? '#4ade80' : '#fbbf24'
          }}>
            {location.mode} MODE
          </span>
        </div>

        {/* Location Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#a1a1aa' }}>City</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{location.city}</span>
          </div>
          {location.state && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a1a1aa' }}>State / Country</span>
              <span style={{ color: '#fff' }}>{location.state}, {location.country}</span>
            </div>
          )}
          {location.accuracy !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a1a1aa' }}>GPS Accuracy</span>
              <span style={{ color: location.accuracy <= 50 ? '#4ade80' : '#fbbf24' }}>
                {location.accuracy}m ({location.accuracyTier})
              </span>
            </div>
          )}
          {location.lastUpdated && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#a1a1aa' }}>Last Updated</span>
              <span style={{ color: '#a1a1aa', fontSize: 12 }}>{new Date(location.lastUpdated).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Developer details toggle */}
        <div style={{ fontSize: 12 }}>
          <button
            onClick={() => setShowDevDetails(!showDevDetails)}
            style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: 0, fontSize: 12 }}
          >
            {showDevDetails ? 'Hide Developer Details' : 'Show Developer Details'}
          </button>
          {showDevDetails && (
            <div style={{ background: '#121215', padding: 10, borderRadius: 8, marginTop: 6, color: '#a1a1aa', fontFamily: 'monospace', fontSize: 11 }}>
              <div>Latitude: {location.latitude ?? 'N/A'}</div>
              <div>Longitude: {location.longitude ?? 'N/A'}</div>
              <div>Permission: {location.permission}</div>
              <div>Status: {location.status}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <button
            onClick={handleRefresh}
            disabled={location.status === 'acquiring_gps'}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              opacity: location.status === 'acquiring_gps' ? 0.7 : 1
            }}
          >
            {location.status === 'acquiring_gps' ? 'Acquiring GPS...' : 'Refresh Current Location'}
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenCitySelector();
            }}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              background: 'transparent',
              color: '#fff',
              border: '1px solid #3f3f46',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Change City
          </button>

          {location.source === 'GPS' && (
            <button
              onClick={handleClearGps}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: 'transparent',
                color: '#ef4444',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Delete GPS Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
