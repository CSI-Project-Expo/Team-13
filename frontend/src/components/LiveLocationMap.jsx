import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";

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
export default function LiveLocationMap({
  jobId,
  role,
  jobStatus,
  embeddedInPanel = false,
}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(embeddedInPanel);
  const [isSharing, setIsSharing] = useState(false);
  const pollIntervalRef = useRef(null);
  const isMountedRef = useRef(false);

  const isTrackingActive = jobStatus === "IN_PROGRESS";

  useEffect(() => {
    console.log("[LiveLocationMap] props/state", {
      jobId,
      role,
      jobStatus,
      isTrackingActive,
      isExpanded,
      isSharing,
    });
  }, [jobId, role, jobStatus, isTrackingActive, isExpanded, isSharing]);

  // Fetch with deduplication and abort support
  const fetchLocation = useCallback(async () => {
    if (!jobId || role !== "user" || !isTrackingActive || !isMountedRef.current) {
      console.log("[LiveLocationMap] fetch skipped", {
        jobId,
        role,
        isTrackingActive,
        isMounted: isMountedRef.current,
      });
      return;
    }

    try {
      console.log("[LiveLocationMap] fetching location", { jobId });
      const data = await dedupedFetch(`/api/v1/jobs/${jobId}/location`);
      console.log("[LiveLocationMap] fetch response", { jobId, data });
      if (isMountedRef.current && data) {
        setLocation(data);
        setError(null);
      }
    } catch (err) {
      // Silently fail unless it's an abort
      if (err.name !== "AbortError" && isMountedRef.current) {
        console.error("[LiveLocationMap] fetch failed", {
          jobId,
          status: err?.status,
          message: err?.message,
          data: err?.data,
        });
        // Don't set error to prevent UI flicker
      }
    }
  }, [jobId, role, isTrackingActive]);

  // Update location to backend (throttled for genie)
  const updateLocation = useCallback(
    async (position) => {
      if (!jobId || role !== "genie" || !isTrackingActive) {
        console.log("[LiveLocationMap] update skipped", {
          jobId,
          role,
          isTrackingActive,
        });
        return;
      }

      const { latitude, longitude, accuracy } = position?.coords || {};
      console.log("[LiveLocationMap] GPS raw coords", {
        latitude,
        longitude,
        accuracy,
      });
      const safeLatitude = Number(latitude);
      const safeLongitude = Number(longitude);
      const parsedAccuracy = Number(accuracy);
      const safeAccuracy =
        accuracy == null || Number.isNaN(parsedAccuracy) || parsedAccuracy < 0
          ? null
          : parsedAccuracy;

      if (
        !Number.isFinite(safeLatitude) ||
        !Number.isFinite(safeLongitude) ||
        safeLatitude < -90 ||
        safeLatitude > 90 ||
        safeLongitude < -180 ||
        safeLongitude > 180
      ) {
        console.error("[LiveLocationMap] invalid GPS payload", {
          latitude,
          longitude,
          accuracy,
          safeLatitude,
          safeLongitude,
          safeAccuracy,
        });
        if (isMountedRef.current) {
          setError("Invalid GPS data. Please refresh location.");
        }
        return;
      }

      try {
        const payload = {
          latitude: safeLatitude,
          longitude: safeLongitude,
          accuracy: safeAccuracy,
        };
        console.log("[LiveLocationMap] posting location", { jobId, payload });
        await api.post(`/api/v1/jobs/${jobId}/location`, {
          latitude: safeLatitude,
          longitude: safeLongitude,
          accuracy: safeAccuracy,
        });
        console.log("[LiveLocationMap] location post success", { jobId });
        if (isMountedRef.current) {
          setLocation({
            latitude: safeLatitude,
            longitude: safeLongitude,
            accuracy: safeAccuracy,
          });
          setError(null);
        }
      } catch (err) {
        console.error("[LiveLocationMap] location post failed", {
          jobId,
          status: err?.status,
          message: err?.message,
          data: err?.data,
        });
        if (isMountedRef.current) {
          setError("Failed to update location");
        }
      }
    },
    [jobId, role, isTrackingActive],
  );

  // Start location sharing for genie
  const startSharing = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("[LiveLocationMap] geolocation unsupported");
      setError("Geolocation not supported");
      return;
    }

    console.log("[LiveLocationMap] startSharing called", { jobId, role, jobStatus });
    setIsSharing(true);

    // Get initial position once, don't watch continuously to save resources
    navigator.geolocation.getCurrentPosition(
      updateLocation,
      (err) => {
        console.error("[LiveLocationMap] geolocation error", {
          code: err?.code,
          message: err?.message,
        });
        if (isMountedRef.current) {
          setError("Location permission denied");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );

    // No continuous watchPosition to save battery and resources
    // Genie can manually refresh if needed
  }, [updateLocation]);

  // Mount/unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Setup polling - ONLY when expanded, with 10 minute interval
  useEffect(() => {
    if (
      role === "user" &&
      isTrackingActive &&
      (isExpanded || embeddedInPanel) &&
      isMountedRef.current
    ) {
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
  }, [role, isTrackingActive, isExpanded, embeddedInPanel, fetchLocation]);

  useEffect(() => {
    if (embeddedInPanel) setIsExpanded(true);
  }, [embeddedInPanel]);

  // Genie sharing - active during IN_PROGRESS (independent of panel expansion)
  useEffect(() => {
    if (
      role === "genie" &&
      isTrackingActive &&
      !isSharing &&
      isMountedRef.current
    ) {
      startSharing();
    }
  }, [role, isTrackingActive, isSharing, startSharing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Generate embeddable Google map URL
  const getEmbeddedMapUrl = () => {
    if (!location) return null;
    const { latitude, longitude } = location;
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  };

  // Generate link to open in full map
  const getFullMapUrl = () => {
    if (!location) return "#";
    const { latitude, longitude } = location;
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  };

  // Format last updated time
  const getLastUpdated = () => {
    if (!location?.updated_at) return null;
    const date = new Date(location.updated_at);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    return date.toLocaleTimeString();
  };

  if (!isTrackingActive) {
    return null;
  }

  const mapBlock = (
    <>
      <div className="live-location-map__frame">
        {location ? (
          <>
            <iframe
              src={getEmbeddedMapUrl()}
              title="Live Google Map"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="live-location-map__iframe"
            />
            <a
              href={getFullMapUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="live-location-map__open-maps btn btn--sm"
            >
              Open Map →
            </a>
          </>
        ) : (
          <p className="live-location-map__waiting">
            {role === "genie" ? "Waiting for GPS..." : "Waiting for genie..."}
          </p>
        )}
      </div>

      <div className="live-location-map__meta">
        {location ? (
          <>
            <span>
              Lat: {location.latitude?.toFixed(6)}
            </span>
            <span>
              Lng: {location.longitude?.toFixed(6)}
            </span>
            {location.accuracy && (
              <span className="live-location-map__meta-muted">
                ±{Math.round(location.accuracy)}m
              </span>
            )}
            {getLastUpdated() && (
              <span className="live-location-map__meta-updated">
                Updated: {getLastUpdated()}
              </span>
            )}
          </>
        ) : (
          <span className="live-location-map__meta-muted">
            Location not available...
          </span>
        )}
      </div>

      {error && <div className="live-location-map__error">⚠️ {error}</div>}

      {role === "genie" && (
        <div className="live-location-map__actions">
          <button
            type="button"
            onClick={startSharing}
            className="btn btn--sm btn--primary"
          >
            📍 Update location
          </button>
        </div>
      )}
    </>
  );

  if (embeddedInPanel) {
    return (
      <div className="live-location-map live-location-map--embedded">
        <div className="live-location-map__panel-head">
          <div className="live-location-map__panel-head-main">
            <span className="live-location-map__panel-icon">📍</span>
            <span className="live-location-map__panel-title">
              {role === "genie" ? "Your live GPS" : "Genie live location"}
            </span>
            {location && <span className="live-location-map__live-dot" />}
          </div>
        </div>
        {mapBlock}
      </div>
    );
  }

  // Collapsed view - just a button
  if (!isExpanded) {
    return (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: "var(--surface)",
          border: "2px solid var(--border)",
          borderRadius: "var(--radius-md)",
          boxShadow: "2px 2px 0 var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            {role === "genie" ? "Share Location" : "Track Genie"}
          </span>
          {location && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
          )}
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="btn btn--sm"
          style={{
            background: "var(--neo-yellow)",
            border: "2px solid var(--border)",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {location ? "View ▼" : "Open ▼"}
        </button>
      </div>
    );
  }

  return (
    <div className="live-location-map live-location-map--inline">
      <div className="live-location-map__panel-head">
        <div className="live-location-map__panel-head-main">
          <span className="live-location-map__panel-icon">📍</span>
          <span className="live-location-map__panel-title">
            {role === "genie" ? "Your Location" : "Genie Location"}
          </span>
          {location && <span className="live-location-map__live-dot" />}
        </div>
        <button
          type="button"
          className="live-location-map__collapse"
          onClick={() => setIsExpanded(false)}
          aria-label="Collapse map"
        >
          ▲
        </button>
      </div>
      {mapBlock}
    </div>
  );
}
