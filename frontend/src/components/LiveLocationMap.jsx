import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

// Global request deduplication to prevent multiple components overwhelming the browser
const pendingRequests = new Map();

const dedupedFetch = async (url) => {
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }
  
  const promise = api.get(url).finally(() => {
    // Clear after 100ms to allow same request if needed
    setTimeout(() => pendingRequests.delete(url), 100);
  });
  
  pendingRequests.set(url, promise);
  return promise;
};

/**
 * LiveLocationMap - Resource-optimized version
 * - Only fetches when expanded
 * - Global request deduplication
 * - 10 minute polling when active
 * 
 * @param {string} jobId - The job ID to track
 * @param {string} role - 'genie' or 'user' 
 * @param {string} jobStatus - Current job status
 */
export default function LiveLocationMap({ jobId, role, jobStatus }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const watchIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(false);
  const abortControllerRef = useRef(null);

  const isTrackingActive = jobStatus === 'IN_PROGRESS';

  // Fetch with deduplication and abort support
  const fetchLocation = useCallback(async () => {
    if (!jobId || role !== 'user' || !isTrackingActive || !isMountedRef.current) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const data = await dedupedFetch(`/api/v1/jobs/${jobId}/location`);
      if (isMountedRef.current && data) {
        setLocation(data);
        setError(null);
      }
    } catch (err) {
      // Silently fail unless it's an abort
      if (err.name !== 'AbortError' && isMountedRef.current) {
        // Don't set error to prevent UI flicker
      }
    }
  }, [jobId, role, isTrackingActive]);

  // Update location to backend (throttled for genie)
  const updateLocation = useCallback(async (position) => {
    if (!jobId || role !== 'genie' || !isTrackingActive) return;

    const { latitude, longitude, accuracy } = position.coords;
    
    try {
      await api.post(`/api/v1/jobs/${jobId}/location`, {
        latitude,
        longitude,
        accuracy: accuracy || null
      });
      if (isMountedRef.current) {
        setLocation({ latitude, longitude, accuracy });
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to update location');
      }
    }
  }, [jobId, role, isTrackingActive]);

  // Start location sharing for genie
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsSharing(true);
    
    // Get initial position once, don't watch continuously to save resources
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      (err) => {
        if (isMountedRef.current) {
          setError('Location permission denied');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
    
    // No continuous watchPosition to save battery and resources
    // Genie can manually refresh if needed
  }, [updateLocation]);

  const stopSharing = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);
  }, []);

  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Setup polling - ONLY when expanded, with 10 minute interval
  useEffect(() => {
    if (role === 'user' && isTrackingActive && isExpanded && isMountedRef.current) {
      // Delay initial fetch to prevent resource spike on page load
      const initialDelay = setTimeout(() => {
        if (isMountedRef.current) {
          fetchLocation();
        }
      }, Math.random() * 2000); // Random 0-2s delay to spread requests
      
      pollIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchLocation();
        }
      }, 600000); // 10 minutes
      
      return () => {
        clearTimeout(initialDelay);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [role, isTrackingActive, isExpanded, fetchLocation]);

  // Genie sharing - only when expanded
  useEffect(() => {
    if (role === 'genie' && isTrackingActive && isExpanded && !isSharing && isMountedRef.current) {
      startSharing();
    }
  }, [role, isTrackingActive, isExpanded, isSharing, startSharing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Generate static map image URL (lightweight, no iframe)
  const getStaticMapUrl = () => {
    if (!location) {
      return null;
    }
    
    const { latitude, longitude } = location;
    // Using static map tile from OpenStreetMap
    const zoom = 15;
    const width = 600;
    const height = 300;
    
    // Simple static tile approach
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${latitude},${longitude},ol-marker`;
  };

  // Generate link to open in full map
  const getFullMapUrl = () => {
    if (!location) return '#';
    const { latitude, longitude } = location;
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
  };

  // Format last updated time
  const getLastUpdated = () => {
    if (!location?.updated_at) return null;
    const date = new Date(location.updated_at);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    return date.toLocaleTimeString();
  };

  if (!isTrackingActive) {
    return null;
  }

  // Collapsed view - just a button
  if (!isExpanded) {
    return (
      <div style={{
        marginTop: 12,
        padding: 12,
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '2px 2px 0 var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            {role === 'genie' ? 'Share Location' : 'Track Genie'}
          </span>
          {location && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          )}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="btn btn--sm"
          style={{ background: 'var(--neo-yellow)', border: '2px solid var(--border)', fontSize: 12, fontWeight: 700 }}
        >
          {location ? 'View ▼' : 'Open ▼'}
        </button>
      </div>
    );
  }

  // Expanded view with map
  return (
    <div style={{
      marginTop: 12,
      padding: 16,
      background: 'var(--surface)',
      border: '2.5px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '3px 3px 0 var(--border)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>
            {role === 'genie' ? 'Your Location' : 'Genie Location'}
          </span>
          {location && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />}
        </div>
        <button onClick={() => setIsExpanded(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>▲</button>
      </div>

      <div style={{
        position: 'relative', width: '100%', height: 200,
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
        border: '2px solid var(--border)', background: '#e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {location ? (
          <>
            <img src={getStaticMapUrl()} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
            <a href={getFullMapUrl()} target="_blank" rel="noopener noreferrer" style={{
              position: 'absolute', bottom: 8, right: 8, background: 'var(--neo-yellow)',
              border: '2px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '6px 12px', fontSize: 12, fontWeight: 700, textDecoration: 'none', color: 'var(--text)',
              boxShadow: '2px 2px 0 var(--border)',
            }}>Open Map →</a>
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            {role === 'genie' ? 'Waiting for GPS...' : 'Waiting for genie...'}
          </p>
        )}
      </div>

      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 12 }}>
        {location ? (
          <>
            <span style={{ fontWeight: 600 }}>Lat: {location.latitude?.toFixed(6)}</span>
            <span style={{ fontWeight: 600 }}>Lng: {location.longitude?.toFixed(6)}</span>
            {location.accuracy && <span style={{ color: 'var(--text-muted)' }}>±{Math.round(location.accuracy)}m</span>}
            {getLastUpdated() && <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>Updated: {getLastUpdated()}</span>}
          </>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Location not available...</span>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: 12,
          padding: 8,
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: 'var(--radius-sm)',
          fontSize: 12,
          color: '#dc2626',
          fontWeight: 600,
        }}>
          ⚠️ {error}
        </div>
      )}

      {role === 'genie' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={startSharing} className="btn btn--sm" style={{ background: 'var(--neo-green)', border: '2px solid var(--border)', fontSize: 12 }}>
            � Update Location
          </button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

