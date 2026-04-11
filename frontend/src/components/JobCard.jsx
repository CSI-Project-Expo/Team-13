import { useState } from "react";
import { createPortal } from "react-dom";
import StatusBadge from "./StatusBadge";
import JobChat from "./JobChat";
import ButtonSpinner from "./ButtonSpinner";
import LiveLocationMap from "./LiveLocationMap";
import FloatingPanel from "./FloatingPanel";
import Stopwatch from "./Stopwatch";
import { useAuth } from "../hooks/useAuth";

/**
 * Job card for listing views.
 * @param {object}   job         — job object from backend
 * @param {function} onAction    — optional action button handler
 * @param {string}   actionLabel — label for action button
 * @param {boolean}  loading     — disables the action button
 * @param {string}   currentUserId — current user's ID for chat
 */
export default function JobCard({
  job,
  onAction,
  actionLabel,
  loading = false,
  currentUserId,
}) {
  const { role } = useAuth();
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const price =
    job.price != null ? `₹${Number(job.price).toFixed(2)}` : "Negotiable";
  const date = job.created_at
    ? new Date(job.created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  // Show live location only when job is in progress
  const showLiveLocation = job.status === "IN_PROGRESS";
  const hasStaticLocation = Boolean(job.location?.trim());
  const showLocationButton =
    hasStaticLocation || (showLiveLocation && currentUserId);

  const mapsSearchUrl = hasStaticLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`
    : "";

  return (
    <article className="job-card">
      <div className="job-card__header">
        <div>
          <h3 className="job-card__title">{job.title}</h3>
          {showLocationButton && (
            <button
              type="button"
              className="job-card__location-btn"
              onClick={() => setShowLocationPanel(true)}
            >
              📍 Location
            </button>
          )}
        </div>
        <StatusBadge status={job.status} />
      </div>

      <p className="job-card__description">{job.description}</p>

      {/* Stopwatch - shows for genie when job is in progress */}
      {job.status === "IN_PROGRESS" && job.started_at && role === "genie" && (
        <Stopwatch startTime={job.started_at} isRunning={true} />
      )}

      {/* Completed time display */}
      {job.status === "COMPLETED" &&
        job.started_at &&
        job.completed_at &&
        role === "genie" && (
          <div className="stopwatch" style={{ background: "var(--neo-green)" }}>
            <div className="stopwatch__display">
              <span className="stopwatch__icon">✅</span>
              <span className="stopwatch__time">
                {(() => {
                  const start = new Date(job.started_at).getTime();
                  const end = new Date(job.completed_at).getTime();
                  const totalSeconds = Math.floor((end - start) / 1000);
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = totalSeconds % 60;
                  if (hours > 0) {
                    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                  }
                  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                })()}
              </span>
            </div>
          </div>
        )}

      <div className="job-card__footer">
        <div className="job-card__meta">
          <span className="job-card__price">{price}</span>
          {job.duration && (
            <span className="job-card__duration">⏱ {job.duration}</span>
          )}
          {date && <span className="job-card__date">{date}</span>}
        </div>

        {onAction && (
          <button
            className="btn btn--sm btn--primary"
            onClick={() => onAction(job)}
            disabled={loading}
          >
            {loading ? (
              <>
                <ButtonSpinner />
                Loading
              </>
            ) : (
              actionLabel
            )}
          </button>
        )}
      </div>

      {/* Floating action buttons for map and chat */}
      <div className="job-card__floating-actions">
        {/* Chat button - shows for job owner or assigned genie */}
        {currentUserId &&
          (job.user_id === currentUserId ||
            job.assigned_genie === currentUserId) && (
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => setShowChatPanel(true)}
              title="Open job chat"
            >
              💬 Chat
            </button>
          )}
      </div>

      {/* Floating Chat Panel - rendered via portal at document body */}
      {createPortal(
        <FloatingPanel
          isOpen={showChatPanel}
          onClose={() => setShowChatPanel(false)}
          title="Job chat"
          size="medium"
        >
          {currentUserId && (
            <JobChat
              jobId={job.id}
              jobStatus={job.status}
              currentUserId={currentUserId}
              jobOwnerId={job.user_id}
              assignedGenieId={job.assigned_genie}
              isFloating={true}
              onClosePanel={() => setShowChatPanel(false)}
            />
          )}
        </FloatingPanel>,
        document.body,
      )}

      {/* Location pop-up: address + live map when in progress */}
      {createPortal(
        <FloatingPanel
          isOpen={showLocationPanel}
          onClose={() => setShowLocationPanel(false)}
          title="Job location"
          size="large"
        >
          <div className="job-location-panel">
            {hasStaticLocation && (
              <div className="job-location-panel__address">
                <p className="job-location-panel__label">Address</p>
                <p className="job-location-panel__text">{job.location}</p>
                <a
                  className="btn btn--sm btn--ghost job-location-panel__maps-link"
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps →
                </a>
              </div>
            )}
            {showLiveLocation && currentUserId && (
              <LiveLocationMap
                jobId={job.id}
                role={role}
                jobStatus={job.status}
                embeddedInPanel
              />
            )}
          </div>
        </FloatingPanel>,
        document.body,
      )}
    </article>
  );
}
