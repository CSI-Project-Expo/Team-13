import StatusBadge from "./StatusBadge";
import JobChat from "./JobChat";
import ButtonSpinner from "./ButtonSpinner";
import LiveLocationMap from "./LiveLocationMap";
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
