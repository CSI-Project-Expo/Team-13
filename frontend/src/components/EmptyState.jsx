/**
 * Empty state placeholder.
 * @param {string} icon    — emoji or icon character
 * @param {string} title   — heading text
 * @param {string} message — sub-text
 */
export default function EmptyState({ icon = '📭', title = 'Nothing here yet', message = '' }) {
    return (
        <div className="empty-state">
            <span className="empty-state__icon">{icon}</span>
            <h3 className="empty-state__title">{title}</h3>
            {message && <p className="empty-state__message">{message}</p>}
        </div>
    );
}
