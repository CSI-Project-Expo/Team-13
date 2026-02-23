import StatusBadge from './StatusBadge';

/**
 * Job card for listing views.
 * @param {object}   job         — job object from backend
 * @param {function} onAction    — optional action button handler
 * @param {string}   actionLabel — label for action button
 * @param {boolean}  loading     — disables the action button
 */
export default function JobCard({ job, onAction, actionLabel, loading = false }) {
    const price = job.price != null ? `₹${Number(job.price).toFixed(2)}` : 'Negotiable';
    const date = job.created_at
        ? new Date(job.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        })
        : '';

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
                        {loading ? 'Loading…' : actionLabel}
                    </button>
                )}
            </div>
        </article>
    );
}
