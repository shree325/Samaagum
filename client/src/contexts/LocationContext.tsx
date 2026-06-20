// @ts-nocheck
const { createContext, useContext, useState, useEffect } = React;

const LocationContext = createContext(undefined);

const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const detectLocation = async () => {
    try {
      setLoading(true);
      // Determine apiBase dynamically for raw files served from another port
      let apiBase = '';
      if (window.location.port === "8080") {
          apiBase = "http://localhost:3000";
      }
      
      const res = await fetch(`${apiBase}/api/location/detect`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setLocation(data.data);
        sessionStorage.setItem('samaagum_user_location', JSON.stringify(data.data));
      } else {
        setError(data.message || 'Location not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to detect location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check sessionStorage first
    const cached = sessionStorage.getItem('samaagum_user_location');
    if (cached) {
      try {
        setLocation(JSON.parse(cached));
        setLoading(false);
        return;
      } catch (e) {
        // ignore parse error
      }
    }
    
    // Auto-detect if not cached
    detectLocation();
  }, []);

  const overrideLocation = (loc) => {
    setLocation(loc);
    sessionStorage.setItem('samaagum_user_location', JSON.stringify(loc));
  };

  return (
    <LocationContext.Provider value={{ location, loading, error, refreshLocation: detectLocation, overrideLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

// Expose globally since we don't have a bundler
window.LocationProvider = LocationProvider;
window.useLocation = useLocation;
