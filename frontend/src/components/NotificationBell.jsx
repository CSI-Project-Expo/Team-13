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
        
        // Less than 1 minute
        if (diff < 60000) return 'Just now';
        // Less than 1 hour
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        // Less than 24 hours
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        // Less than 7 days
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        // Otherwise show date
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-dropdown-container relative">
            {/* Bell Button */}
            <button
                onClick={toggleDropdown}
                className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                aria-label="Notifications"
            >
                <span className="text-xl">🔔</span>
                
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-80">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 px-4">
                                <span className="text-4xl">📭</span>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => markAsRead(notification.id)}
                                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                        !notification.is_read 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500' 
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${
                                                !notification.is_read 
                                                    ? 'text-gray-900 dark:text-white' 
                                                    : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        
                                        {/* Unread indicator */}
                                        {!notification.is_read && (
                                            <span className="ml-2 h-2 w-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1"></span>
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
