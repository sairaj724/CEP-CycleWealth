import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Filter, ArrowLeft, RefreshCw } from 'lucide-react';
import Navbar2 from '../components/Navbar2';
import SharedNavbar from '../components/SharedNavbar';
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
    respondToScrapRequest,
    acceptEnterpriseOrder,
    rejectEnterpriseOrder,
    counterEnterpriseOrder,
    enterpriseAcceptCounterOffer,
    enterpriseRejectCounterOffer,
    enterpriseCounterBack,
    scrapDealerAcceptEnterpriseCounter,
    scrapDealerRejectEnterpriseCounter,
    scrapDealerCounterBackToEnterprise,
    updateNotificationData
} from '../services/notificationService';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState(null);
    const [subscriptionRef, setSubscriptionRef] = useState(null);

    // Fetch notifications
    const loadNotifications = useCallback(async () => {
        if (!user?.user_id) return;
        
        setLoading(true);
        const { data, error } = await fetchNotifications(50, filter);
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

    // Initialize
    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(sessionUser);
        setUser(parsedUser);
    }, [navigate]);

    // Load notifications when user is ready
    useEffect(() => {
        if (user?.user_id) {
            loadNotifications();
            loadUnreadCount();
        }
    }, [loadNotifications, loadUnreadCount, user]);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.user_id) return;

        const sub = subscribeToNotifications((newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });
        setSubscriptionRef(sub);

        return () => {
            if (sub) {
                unsubscribeFromNotifications(sub);
            }
        };
    }, [user]);

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
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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

    // Handle scrap request response
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
            const statusValue = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'countered';
            await updateNotificationData(notification.id, { 
                status: statusValue,
                requires_action: false 
            });
            
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, data: { ...n.data, status: statusValue, requires_action: false } }
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

    // Handle enterprise order response
    const handleEnterpriseOrderResponse = async (e, notification, action) => {
        e.stopPropagation();
        const orderId = notification.data?.order_id;
        if (!orderId) return;

        const dealerId = user?.user_id;
        if (!dealerId) {
            alert('Please log in to respond to this order');
            return;
        }

        let counterPrice = null;
        let reason = '';

        if (action === 'counter_offer') {
            counterPrice = prompt('Enter your counter offer price (₹/unit):');
            if (!counterPrice || isNaN(counterPrice)) return;
        } else if (action === 'decline') {
            reason = prompt('Enter reason for declining (optional):') || '';
        }

        let result;
        if (action === 'accept') {
            result = await acceptEnterpriseOrder(orderId, dealerId);
        } else if (action === 'decline') {
            result = await rejectEnterpriseOrder(orderId, dealerId, reason);
        } else if (action === 'counter_offer') {
            result = await counterEnterpriseOrder(orderId, dealerId, parseFloat(counterPrice));
        }

        if (result.success) {
            const statusValue = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'countered';
            await updateNotificationData(notification.id, { 
                status: statusValue,
                requires_action: false 
            });
            
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, data: { ...n.data, status: statusValue, requires_action: false } }
                        : n
                )
            );

            const message = action === 'accept'
                ? 'Order accepted! The enterprise has been notified.'
                : action === 'decline'
                    ? 'Order declined.'
                    : `Counter offer of ₹${counterPrice}/unit sent!`;
            alert(message);
        } else {
            alert('Failed to respond: ' + result.error);
        }
    };

    // Handle enterprise counter response
    const handleEnterpriseCounterResponse = async (e, notification, action) => {
        e.stopPropagation();
        const orderId = notification.data?.order_id;
        const dealerId = notification.data?.dealer_id;
        if (!orderId || !dealerId) return;

        let counterPrice = null;
        let reason = '';

        if (action === 'counter_offer') {
            counterPrice = prompt('Enter your counter offer price (₹/unit):');
            if (!counterPrice || isNaN(counterPrice)) return;
        } else if (action === 'decline') {
            reason = prompt('Enter reason for declining (optional):') || '';
        }

        let result;
        if (action === 'accept') {
            result = await enterpriseAcceptCounterOffer(orderId, dealerId);
        } else if (action === 'decline') {
            result = await enterpriseRejectCounterOffer(orderId, dealerId, reason);
        } else if (action === 'counter_offer') {
            result = await enterpriseCounterBack(orderId, dealerId, parseFloat(counterPrice));
        }

        if (result.success) {
            const statusValue = action === 'accept' ? 'accepted' : action === 'decline' ? 'rejected' : 'countered';
            await updateNotificationData(notification.id, { 
                status: statusValue,
                requires_action: false 
            });
            
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, data: { ...n.data, status: statusValue, requires_action: false } }
                        : n
                )
            );

            const message = action === 'accept'
                ? 'Counter offer accepted!'
                : action === 'decline'
                    ? 'Counter offer declined.'
                    : `Counter offer sent!`;
            alert(message);
        } else {
            alert('Failed to respond: ' + result.error);
        }
    };

    // Handle scrap dealer counter response
    const handleScrapDealerCounterResponse = async (e, notification, action) => {
        e.stopPropagation();
        const orderId = notification.data?.order_id;
        if (!orderId) return;

        const dealerId = user?.user_id;
        if (!dealerId) {
            alert('Please log in to respond');
            return;
        }

        let counterPrice = null;
        let reason = '';

        if (action === 'counter_offer') {
            counterPrice = prompt('Enter your counter offer price (₹/unit):');
            if (!counterPrice || isNaN(counterPrice)) return;
        } else if (action === 'decline') {
            reason = prompt('Enter reason for declining (optional):') || '';
        }

        let result;
        if (action === 'accept') {
            result = await scrapDealerAcceptEnterpriseCounter(orderId, dealerId);
        } else if (action === 'decline') {
            result = await scrapDealerRejectEnterpriseCounter(orderId, dealerId, reason);
        } else if (action === 'counter_offer') {
            result = await scrapDealerCounterBackToEnterprise(orderId, dealerId, parseFloat(counterPrice));
        }

        if (result.success) {
            const statusValue = action === 'accept' ? 'accepted' : action === 'decline' ? 'rejected' : 'countered';
            await updateNotificationData(notification.id, { 
                status: statusValue,
                requires_action: false 
            });
            
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, data: { ...n.data, status: statusValue, requires_action: false } }
                        : n
                )
            );

            const message = action === 'accept'
                ? 'You accepted the counter offer!'
                : action === 'decline'
                    ? 'You declined the counter offer.'
                    : `Counter offer sent!`;
            alert(message);
        } else {
            alert('Failed to respond: ' + result.error);
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

    const renderNavbar = () => {
        if (!user) return null;
        if (user.role === 'Industry') {
            return <Navbar2 activeLink="notifications" />;
        } else if (user.role === 'ScrapDealer') {
            return <SharedNavbar activeLink="notifications" />;
        }
        return null;
    };

    return (
        <div className="notifications-page">
            {renderNavbar()}
            
            <div className="notifications-container">
                <div className="notifications-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h1>
                        <Bell size={24} />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="header-badge">{unreadCount}</span>
                        )}
                    </h1>
                    <div className="header-actions">
                        <button 
                            className="refresh-btn"
                            onClick={loadNotifications}
                            disabled={loading}
                        >
                            <RefreshCw size={18} className={loading ? 'spin' : ''} />
                            Refresh
                        </button>
                        {unreadCount > 0 && (
                            <button
                                className="mark-all-btn"
                                onClick={handleMarkAllRead}
                            >
                                <Check size={18} />
                                Mark all as read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                className="clear-all-btn"
                                onClick={handleClearAll}
                            >
                                <Trash2 size={18} />
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                <div className="notifications-filters">
                    <button
                        className={`filter-btn ${filter === null ? 'active' : ''}`}
                        onClick={() => handleFilterChange(null)}
                    >
                        <Filter size={16} />
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
                    <button
                        className={`filter-btn ${filter === 'order' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('order')}
                    >
                        🛒 Orders
                        {getUnreadCountForFilter('order') > 0 && (
                            <span className="filter-badge">{getUnreadCountForFilter('order')}</span>
                        )}
                    </button>
                    <button
                        className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('system')}
                    >
                        ⚙️ System
                        {getUnreadCountForFilter('system') > 0 && (
                            <span className="filter-badge">{getUnreadCountForFilter('system')}</span>
                        )}
                    </button>
                </div>

                <div className="notifications-list-container">
                    {loading ? (
                        <div className="notifications-loading">
                            <div className="spinner"></div>
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="notifications-empty">
                            <Bell size={64} />
                            <h3>No notifications</h3>
                            <p>You're all caught up! Check back later for updates.</p>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div
                                        className="notification-icon-large"
                                        style={{ backgroundColor: getNotificationColor(notification.type) + '20' }}
                                    >
                                        <span>{getNotificationIcon(notification.type)}</span>
                                    </div>
                                    <div className="notification-content-full">
                                        <div className="notification-header-row">
                                            <p className="notification-message-full">
                                                {notification.message}
                                            </p>
                                            <span className="notification-time-full">
                                                {formatNotificationTime(notification.created_at)}
                                            </span>
                                        </div>
                                        
                                        {/* Scrap Request Action Buttons */}
                                        {notification.data?.action === 'scrap_request' && notification.data?.requires_action && (
                                            <div className="notification-actions-row-full">
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
                                                    <span className={`status-badge-large ${notification.data?.status}`}>
                                                        {notification.data?.status === 'accepted' ? '✓ Accepted' :
                                                            notification.data?.status === 'declined' ? '✕ Declined' :
                                                                notification.data?.status === 'countered' ? '↻ Countered' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Enterprise Order Request Action Buttons */}
                                        {notification.data?.action === 'enterprise_order_request' && (
                                            <div className="notification-actions-row-full">
                                                {notification.data?.status === 'pending' || !notification.data?.status ? (
                                                    <>
                                                        <button
                                                            className="action-btn-accept"
                                                            onClick={(e) => handleEnterpriseOrderResponse(e, notification, 'accept')}
                                                        >
                                                            ✓ Accept Order
                                                        </button>
                                                        <button
                                                            className="action-btn-counter"
                                                            onClick={(e) => handleEnterpriseOrderResponse(e, notification, 'counter_offer')}
                                                        >
                                                            ↻ Counter Offer
                                                        </button>
                                                        <button
                                                            className="action-btn-decline"
                                                            onClick={(e) => handleEnterpriseOrderResponse(e, notification, 'decline')}
                                                        >
                                                            ✕ Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`status-badge-large ${notification.data?.status}`}>
                                                        {notification.data?.status === 'accepted' ? '✓ Order Accepted' :
                                                            notification.data?.status === 'declined' ? '✕ Order Declined' :
                                                                notification.data?.status === 'countered' ? '↻ Counter Offer Sent' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Enterprise Counter Offer Response */}
                                        {notification.data?.action === 'counter_offer' && notification.data?.requires_action && (
                                            <div className="notification-actions-row-full">
                                                {notification.data?.status === 'pending' || !notification.data?.status ? (
                                                    <>
                                                        <button
                                                            className="action-btn-accept"
                                                            onClick={(e) => handleEnterpriseCounterResponse(e, notification, 'accept')}
                                                        >
                                                            ✓ Accept Counter
                                                        </button>
                                                        <button
                                                            className="action-btn-counter"
                                                            onClick={(e) => handleEnterpriseCounterResponse(e, notification, 'counter_offer')}
                                                        >
                                                            ↻ Counter Back
                                                        </button>
                                                        <button
                                                            className="action-btn-decline"
                                                            onClick={(e) => handleEnterpriseCounterResponse(e, notification, 'decline')}
                                                        >
                                                            ✕ Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`status-badge-large ${notification.data?.status}`}>
                                                        {notification.data?.status === 'accepted' ? '✓ Counter Accepted' :
                                                            notification.data?.status === 'rejected' ? '✕ Counter Rejected' :
                                                                notification.data?.status === 'countered' ? '↻ Countered Back' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Scrap Dealer receives Enterprise's counter back */}
                                        {notification.data?.action === 'enterprise_counter_back' && notification.data?.requires_action && (
                                            <div className="notification-actions-row-full">
                                                {notification.data?.status === 'pending' || !notification.data?.status ? (
                                                    <>
                                                        <button
                                                            className="action-btn-accept"
                                                            onClick={(e) => handleScrapDealerCounterResponse(e, notification, 'accept')}
                                                        >
                                                            ✓ Accept
                                                        </button>
                                                        <button
                                                            className="action-btn-counter"
                                                            onClick={(e) => handleScrapDealerCounterResponse(e, notification, 'counter_offer')}
                                                        >
                                                            ↻ Counter Again
                                                        </button>
                                                        <button
                                                            className="action-btn-decline"
                                                            onClick={(e) => handleScrapDealerCounterResponse(e, notification, 'decline')}
                                                        >
                                                            ✕ Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`status-badge-large ${notification.data?.status}`}>
                                                        {notification.data?.status === 'accepted' ? '✓ Accepted' :
                                                            notification.data?.status === 'rejected' ? '✕ Declined' :
                                                                notification.data?.status === 'countered' ? '↻ Countered' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Status notifications */}
                                        {(notification.data?.action === 'enterprise_accepted_counter' ||
                                          notification.data?.action === 'enterprise_rejected_counter') && (
                                            <div className="notification-actions-row-full">
                                                <span className={`status-badge-large ${notification.data?.status}`}>
                                                    {notification.data?.status === 'accepted' ? '✓ Your Counter Was Accepted!' :
                                                        notification.data?.status === 'rejected' ? '✕ Your Counter Was Rejected' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="notification-meta-full">
                                        {!notification.is_read && (
                                            <span className="unread-indicator">New</span>
                                        )}
                                        <button
                                            className="delete-btn-large"
                                            onClick={(e) => handleDelete(e, notification.id)}
                                            title="Delete notification"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {filteredNotifications.length > 0 && (
                    <div className="notifications-footer">
                        <span>Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
                        {filter && (
                            <button className="show-all-btn" onClick={() => setFilter(null)}>
                                Show all notifications
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
