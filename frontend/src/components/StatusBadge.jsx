/**
 * Status badge for job statuses.
 * @param {string} status — POSTED | ACCEPTED | IN_PROGRESS | COMPLETED
 */
const CONFIG = {
    POSTED: { label: 'Posted', cls: 'badge badge--posted' },
    ACCEPTED: { label: 'Accepted', cls: 'badge badge--accepted' },
    IN_PROGRESS: { label: 'In Progress', cls: 'badge badge--progress' },
    COMPLETED: { label: 'Completed', cls: 'badge badge--completed' },
};

export default function StatusBadge({ status }) {
    const cfg = CONFIG[status] || { label: status, cls: 'badge badge--default' };
    return <span className={cfg.cls}>{cfg.label}</span>;
}
