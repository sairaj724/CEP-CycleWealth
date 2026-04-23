import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, Trash2, X, Filter } from 'lucide-react';
import {
    fetchNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    formatNotificationTime,
    getNotificationIcon,
    getNotificationColor,
    respondToScrapRequest
} from '../services/notificationService';
import './NotificationDropdown.css';

const NotificationDropdown = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState(null); // null = all, 'connection', 'inventory', 'system'
    const dropdownRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Fetch notifications
    const loadNotifications = useCallback(async () => {
        if (!user?.user_id) return;
        
        setLoading(true);
        const { data, error } = await fetchNotifications(20, filter);
        if (!error) {
            setNotifications(data);
        }
        setLoading(false);
    }, [user, filter]);

    // Fetch unread count
    const loadUnreadCount = useCallback(async () => {
        if (!user?.user_id) return;
        
        const { count, error } = await getUnreadNotificationCount();
        if (!error) {
            setUnreadCount(count);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        loadNotifications();
        loadUnreadCount();
    }, [loadNotifications, loadUnreadCount]);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.user_id) return;

        subscriptionRef.current = subscribeToNotifications((newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            if (subscriptionRef.current) {
                unsubscribeFromNotifications(subscriptionRef.current);
            }
        };
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle notification click
    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            const { success } = await markNotificationAsRead(notification.id);
            if (success) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notification.id ? { ...n, is_read: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        const { success } = await markAllNotificationsAsRead();
        if (success) {
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        }
    };

    // Clear all notifications
    const handleClearAll = async () => {
        if (window.confirm('Are you sure you want to clear all notifications?')) {
            const { success } = await clearAllNotifications();
            if (success) {
                setNotifications([]);
                setUnreadCount(0);
            }
        }
    };

    // Delete single notification
    const handleDelete = async (e, notificationId) => {
        e.stopPropagation();
        const { success } = await deleteNotification(notificationId);
        if (success) {
            const deleted = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            if (deleted && !deleted.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        }
    };

    // Filter change
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    // Handle scrap request response (accept/counter/decline)
    const handleScrapResponse = async (e, notification, action) => {
        e.stopPropagation();

        const orderId = notification.data?.order_id;
        if (!orderId) return;

        let counterPrice = null;
        if (action === 'counter_offer') {
            counterPrice = prompt('Enter your counter offer price (₹/kg):');
            if (!counterPrice || isNaN(counterPrice)) return;
        }

        const { success, error } = await respondToScrapRequest(orderId, action, counterPrice);

        if (success) {
            // Update notification status locally
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, data: { ...n.data, status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'countered' } }
                        : n
                )
            );

            const message = action === 'accept'
                ? 'Request accepted! Artisan will be notified.'
                : action === 'decline'
                    ? 'Request declined.'
                    : `Counter offer of ₹${counterPrice}/kg sent!`;
            alert(message);
        } else {
            alert('Failed to respond: ' + error);
        }
    };

    // Toggle dropdown
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            loadNotifications();
        }
    };

    // Get filtered notifications
    const filteredNotifications = filter
        ? notifications.filter(n => n.type === filter)
        : notifications;

    // Get unread count for filter
    const getUnreadCountForFilter = (type) => {
        return notifications.filter(n => n.type === type && !n.is_read).length;
    };

    if (!user) return null;

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <button
                className="notification-bell"
                onClick={toggleDropdown}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                            {unreadCount > 0 && (
                                <button
                                    className="action-btn"
                                    onClick={handleMarkAllRead}
                                    title="Mark all as read"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    className="action-btn danger"
                                    onClick={handleClearAll}
                                    title="Clear all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                className="action-btn"
                                onClick={() => setIsOpen(false)}
                                title="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="notification-filters">
                        <button
                            className={`filter-btn ${filter === null ? 'active' : ''}`}
                            onClick={() => handleFilterChange(null)}
                        >
                            All
                            {unreadCount > 0 && (
                                <span className="filter-badge">{unreadCount}</span>
                            )}
                        </button>
                        <button
                            className={`filter-btn ${filter === 'connection' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('connection')}
                        >
                            🔗 Connections
                            {getUnreadCountForFilter('connection') > 0 && (
                                <span className="filter-badge">{getUnreadCountForFilter('connection')}</span>
                            )}
                        </button>
                        <button
                            className={`filter-btn ${filter === 'inventory' ? 'active' : ''}`}
                            onClick={() => handleFilterChange('inventory')}
                        >
                            📦 Inventory
                            {getUnreadCountForFilter('inventory') > 0 && (
                                <span className="filter-badge">{getUnreadCountForFilter('inventory')}</span>
                            )}
                        </button>
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="notification-loading">
                                <div className="spinner"></div>
                                <p>Loading...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={40} />
                                <p>No notifications</p>
                                <span>You're all caught up!</span>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div
                                        className="notification-icon"
                                        style={{ backgroundColor: getNotificationColor(notification.type) + '20' }}
                                    >
                                        <span>{getNotificationIcon(notification.type)}</span>
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-message">
                                            {notification.message}
                                        </p>
                                        <span className="notification-time">
                                            {formatNotificationTime(notification.created_at)}
                                        </span>
                                        {/* Scrap Request Action Buttons */}
                                        {notification.data?.action === 'scrap_request' && notification.data?.requires_action && (
                                            <div className="notification-actions-row">
                                                {notification.data?.status === 'pending' || !notification.data?.status ? (
                                                    <>
                                                        <button
                                                            className="action-btn-accept"
                                                            onClick={(e) => handleScrapResponse(e, notification, 'accept')}
                                                        >
                                                            ✓ Accept
                                                        </button>
                                                        <button
                                                            className="action-btn-counter"
                                                            onClick={(e) => handleScrapResponse(e, notification, 'counter_offer')}
                                                        >
                                                            ↻ Counter Offer
                                                        </button>
                                                        <button
                                                            className="action-btn-decline"
                                                            onClick={(e) => handleScrapResponse(e, notification, 'decline')}
                                                        >
                                                            ✕ Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`status-badge ${notification.data?.status}`}>
                                                        {notification.data?.status === 'accepted' ? '✓ Accepted' :
                                                            notification.data?.status === 'declined' ? '✕ Declined' :
                                                                notification.data?.status === 'countered' ? '↻ Countered' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="notification-meta">
                                        {!notification.is_read && (
                                            <span className="unread-dot"></span>
                                        )}
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            title="Delete"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {filteredNotifications.length > 0 && (
                        <div className="notification-footer">
                            <span>{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
                            {filter && (
                                <button onClick={() => setFilter(null)}>Show all</button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
