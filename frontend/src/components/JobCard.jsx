import StatusBadge from "./StatusBadge";
import JobChat from "./JobChat";
import ButtonSpinner from "./ButtonSpinner";
import LiveLocationMap from "./LiveLocationMap";
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

  return (
    <article className="job-card">
      <div className="job-card__header">
        <div>
          <h3 className="job-card__title">{job.title}</h3>
          {job.location && (
            <span className="job-card__location">📍 {job.location}</span>
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
      {job.status === "COMPLETED" && job.started_at && job.completed_at && role === "genie" && (
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

      {/* Live Location Map - shows for active jobs when genie is assigned */}
      {showLiveLocation && currentUserId && (
        <LiveLocationMap 
          jobId={job.id} 
          role={role} 
          jobStatus={job.status}
        />
      )}

      {/* Chat component - shows for job owner or assigned genie */}
      {currentUserId &&
        (job.user_id === currentUserId ||
          job.assigned_genie === currentUserId) && (
          <JobChat
            jobId={job.id}
            jobStatus={job.status}
            currentUserId={currentUserId}
            jobOwnerId={job.user_id}
            assignedGenieId={job.assigned_genie}
          />
        )}
    </article>
  );
}
