import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'genie_notifications_read';

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Load read status from localStorage
    const getReadStatusFromStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    }, []);

    // Save read status to localStorage
    const saveReadStatusToStorage = useCallback((readIds) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...readIds]));
        } catch (e) {
            console.error('Failed to save read status:', e);
        }
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get('/api/v1/notifications/?limit=20&include_read=true');
            const readIds = getReadStatusFromStorage();
            
            // Mark notifications as read based on localStorage
            const processedNotifications = (data.notifications || []).map(n => ({
                ...n,
                is_read: n.is_read || readIds.has(n.id)
            }));
            
            setNotifications(processedNotifications);
            
            // Calculate unread count
            const unread = processedNotifications.filter(n => !n.is_read).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [getReadStatusFromStorage]);

    // Mark single notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            // Update local state first
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            // Save to localStorage
            const readIds = getReadStatusFromStorage();
            readIds.add(notificationId);
            saveReadStatusToStorage(readIds);
            
            // Call API
            await api.patch(`/api/v1/notifications/${notificationId}/read`);
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    }, [getReadStatusFromStorage, saveReadStatusToStorage]);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            // Update local state
            const allIds = notifications.map(n => n.id);
            setNotifications(prev => 
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
            
            // Save to localStorage
            const readIds = getReadStatusFromStorage();
            allIds.forEach(id => readIds.add(id));
            saveReadStatusToStorage(readIds);
            
            // Call API
            await api.patch('/api/v1/notifications/read-all');
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    }, [notifications, getReadStatusFromStorage, saveReadStatusToStorage]);

    // Toggle dropdown
    const toggleDropdown = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    // Close dropdown
    const closeDropdown = useCallback(() => {
        setIsOpen(false);
    }, []);

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchNotifications();
        
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && !e.target.closest('.notification-dropdown-container')) {
                closeDropdown();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeDropdown]);

    const value = {
        notifications,
        unreadCount,
        loading,
        isOpen,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        toggleDropdown,
        closeDropdown
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
