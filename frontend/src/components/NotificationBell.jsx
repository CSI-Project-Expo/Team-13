import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
    const { 
        notifications, 
        unreadCount, 
        loading, 
        isOpen, 
        toggleDropdown, 
        markAsRead, 
        markAllAsRead 
    } = useNotifications();

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-dropdown-container" style={{ position: 'relative' }}>
            {/* Bell Button */}
            <button
                onClick={toggleDropdown}
                aria-label="Notifications"
                style={{
                    position: 'relative',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    border: '2.5px solid var(--border)',
                    boxShadow: '2px 2px 0 var(--border)',
                    transition: 'var(--transition)',
                    fontSize: 18,
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(1px, 1px)';
                    e.currentTarget.style.boxShadow = '1px 1px 0 var(--border)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0, 0)';
                    e.currentTarget.style.boxShadow = '2px 2px 0 var(--border)';
                }}
            >
                🔔

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: -6, right: -6,
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        height: 20, minWidth: 20, padding: '0 4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--border)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute', right: 0, marginTop: 8,
                    width: 320,
                    background: 'var(--surface)',
                    border: '2.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '5px 5px 0 var(--border)',
                    zIndex: 50, maxHeight: 400, overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: '2.5px solid var(--border)',
                        background: 'var(--neo-yellow)',
                    }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14,
                            textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                style={{
                                    fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                                    background: 'none', border: 'none',
                                    textDecoration: 'underline', textDecorationThickness: '2px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto" style={{ maxHeight: 320, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                                <div className="loader-ring"><div></div><div></div><div></div></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                                <span style={{ fontSize: 40 }}>📭</span>
                                <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 13, fontWeight: 600 }}>
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '2px solid var(--border)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)',
                                        background: !notification.is_read ? 'var(--accent-light)' : 'transparent',
                                        borderLeft: !notification.is_read ? '4px solid var(--accent)' : '4px solid transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--surface-2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = !notification.is_read ? 'var(--accent-light)' : 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 13, fontWeight: !notification.is_read ? 700 : 500,
                                                color: 'var(--text)',
                                                textTransform: 'uppercase', letterSpacing: '0.02em',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {notification.title}
                                            </p>
                                            <p className="line-clamp-2" style={{
                                                fontSize: 13, color: 'var(--text-muted)', marginTop: 4,
                                            }}>
                                                {notification.message}
                                            </p>
                                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4,
                                                fontWeight: 600 }}>
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        
                                        {/* Unread indicator */}
                                        {!notification.is_read && (
                                            <span style={{
                                                marginLeft: 8, height: 8, width: 8,
                                                background: 'var(--accent)',
                                                borderRadius: '50%', flexShrink: 0, marginTop: 4,
                                                border: '1px solid var(--border)',
                                            }} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
