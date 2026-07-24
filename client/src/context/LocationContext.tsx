import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

export type LocationMode = 'AUTO' | 'MANUAL';
export type LocationSource = 'GPS' | 'MANUAL' | 'IP' | 'GLOBAL';
export type PermissionState = 'granted' | 'prompt' | 'denied' | 'unsupported';
export type AccuracyTier = 'EXCELLENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'REJECT';

export interface LocationState {
  city: string;
  state: string;
  country: string;
  timezone: string;
  utcOffset: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  accuracyTier: AccuracyTier;
  mode: LocationMode;
  source: LocationSource;
  permission: PermissionState;
  status: 'idle' | 'checking_permissions' | 'acquiring_gps' | 'resolving_address' | 'updating_preferences' | 'success' | 'error';
  lastUpdated: number | null;
}

interface LocationContextType {
  location: LocationState;
  requestGPS: (highAccuracy?: boolean) => Promise<void>;
  selectCity: (cityName: string) => void;
  setMode: (mode: LocationMode) => void;
  deleteGPSData: () => void;
  refreshLocation: () => Promise<void>;
}

const TAB_ORIGIN_ID = `tab_${Math.random().toString(36).substring(2, 9)}`;
const CACHE_KEY = 'samaagum_location_schema_v1';

const defaultLocationState: LocationState = {
  city: 'Global',
  state: '',
  country: 'India',
  timezone: 'Asia/Kolkata',
  utcOffset: '+05:30',
  latitude: null,
  longitude: null,
  accuracy: null,
  accuracyTier: 'MEDIUM',
  mode: 'AUTO',
  source: 'GLOBAL',
  permission: 'prompt',
  status: 'idle',
  lastUpdated: null,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationState>(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultLocationState, ...parsed };
      }
    } catch {}
    return defaultLocationState;
  });

  const activeRequestId = useRef<number>(0);

  // Sync state across tabs
  const broadcastChange = useCallback((newState: LocationState) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newState));
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('samaagum_location_channel');
        channel.postMessage({ state: newState, originId: TAB_ORIGIN_ID });
        channel.close();
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.data?.originId === TAB_ORIGIN_ID) return;
      if (e.data?.state) {
        setLocation(e.data.state);
      }
    };

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('samaagum_location_channel');
      channel.onmessage = handleSync;
      return () => channel.close();
    } else {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === CACHE_KEY && e.newValue) {
          try {
            setLocation(JSON.parse(e.newValue));
          } catch {}
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  // Request GPS
  const requestGPS = useCallback(async (highAccuracy = false) => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, permission: 'unsupported' }));
      return;
    }

    const currentReqId = ++activeRequestId.current;
    setLocation(prev => ({ ...prev, status: 'acquiring_gps' }));

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 1800000,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (currentReqId !== activeRequestId.current) return; // Discard stale request

        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy);

        // Accuracy check: reject > 500m
        if (acc > 500) {
          setLocation(prev => ({
            ...prev,
            status: 'error',
            accuracyTier: 'REJECT',
          }));
          return;
        }

        let tier: AccuracyTier = 'HIGH';
        if (acc <= 20) tier = 'EXCELLENT';
        else if (acc <= 50) tier = 'HIGH';
        else if (acc <= 100) tier = 'MEDIUM';
        else tier = 'LOW';

        setLocation(prev => ({ ...prev, status: 'resolving_address' }));

        try {
          const res = await fetch(`/api/public/location/reverse?lat=${lat}&lon=${lon}&accuracy=${acc}`);
          const json = await res.json();

          if (currentReqId !== activeRequestId.current) return;

          if (json.success && json.data) {
            const updated: LocationState = {
              city: json.data.city || 'Unknown City',
              state: json.data.state || '',
              country: json.data.country || 'India',
              timezone: json.data.timezone || 'Asia/Kolkata',
              utcOffset: json.data.utcOffset || '+05:30',
              latitude: lat,
              longitude: lon,
              accuracy: acc,
              accuracyTier: tier,
              mode: 'AUTO',
              source: 'GPS',
              permission: 'granted',
              status: 'success',
              lastUpdated: Date.now(),
            };
            setLocation(updated);
            broadcastChange(updated);
          }
        } catch {
          if (currentReqId !== activeRequestId.current) return;
          setLocation(prev => ({ ...prev, status: 'error' }));
        }
      },
      (err) => {
        if (currentReqId !== activeRequestId.current) return;
        const permState = err.code === err.PERMISSION_DENIED ? 'denied' : 'prompt';
        setLocation(prev => ({ ...prev, permission: permState, status: 'error' }));
      },
      options
    );
  }, [broadcastChange]);

  const selectCity = useCallback((cityName: string) => {
    const updated: LocationState = {
      ...location,
      city: cityName,
      mode: 'MANUAL',
      source: cityName === 'Global' ? 'GLOBAL' : 'MANUAL',
      status: 'success',
      lastUpdated: Date.now(),
    };
    setLocation(updated);
    broadcastChange(updated);
  }, [location, broadcastChange]);

  const setMode = useCallback((mode: LocationMode) => {
    const updated: LocationState = { ...location, mode };
    setLocation(updated);
    broadcastChange(updated);
    if (mode === 'AUTO' && (!location.latitude || !location.longitude)) {
      requestGPS();
    }
  }, [location, broadcastChange, requestGPS]);

  const deleteGPSData = useCallback(() => {
    const hasManual = location.city && location.city !== 'Global' && location.city !== 'Unknown City';
    const updated: LocationState = {
      ...location,
      latitude: null,
      longitude: null,
      accuracy: null,
      mode: hasManual ? 'MANUAL' : 'AUTO',
      source: hasManual ? 'MANUAL' : 'GLOBAL',
      status: 'idle',
      lastUpdated: Date.now(),
    };
    setLocation(updated);
    broadcastChange(updated);
  }, [location, broadcastChange]);

  const refreshLocation = useCallback(async () => {
    if (location.mode === 'AUTO') {
      await requestGPS(true);
    }
  }, [location.mode, requestGPS]);

  return (
    <LocationContext.Provider
      value={{
        location,
        requestGPS,
        selectCity,
        setMode,
        deleteGPSData,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

/**
 * Utility helper for formatting meters into localized distance string (e.g. "2.3 km away" or "400 m away")
 */
export function formatDistance(meters: number | null | undefined, locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'): string | null {
  if (meters === null || meters === undefined || isNaN(meters)) return null;
  if (meters < 1000) {
    return `${Math.round(meters)} m away`;
  }
  const km = meters / 1000;
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km);
  return `${formatted} km away`;
}
