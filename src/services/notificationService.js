import supabaseClient from '../supabase-config';

/**
 * Notification Service
 * Handles all notification-related operations
 */

/**
 * Fetch notifications for the current user
 * @param {number} limit - Number of notifications to fetch (default: 20)
 * @param {string} type - Filter by type: 'connection', 'inventory', 'system', or null for all
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const fetchNotifications = async (limit = 20, type = null) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { data: [], error: 'User not authenticated' };
        }

        let query = supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', user.user_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data: data || [], error: null };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return { data: [], error: error.message };
    }
};

/**
 * Get count of unread notifications
 * @returns {Promise<{count: number, error: Object}>}
 */
export const getUnreadNotificationCount = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { count: 0, error: null };
        }

        const { count, error } = await supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user_id)
            .eq('is_read', false);

        if (error) throw error;

        return { count: count || 0, error: null };
    } catch (error) {
        console.error('Error getting unread count:', error);
        return { count: 0, error: error.message };
    }
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - The notification UUID
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        const { error } = await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', user.user_id);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark all notifications as read
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const markAllNotificationsAsRead = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        const { error } = await supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.user_id)
            .eq('is_read', false);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Clear all notifications (delete them)
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const clearAllNotifications = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        const { error } = await supabaseClient
            .from('notifications')
            .delete()
            .eq('user_id', user.user_id);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error clearing notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a single notification
 * @param {string} notificationId - The notification UUID
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const deleteNotification = async (notificationId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        const { error } = await supabaseClient
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', user.user_id);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error deleting notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe to real-time notifications
 * @param {function} callback - Function to call when new notification arrives
 * @returns {Object} - Subscription object with unsubscribe method
 */
export const subscribeToNotifications = (callback) => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user?.user_id) {
        console.warn('Cannot subscribe to notifications: User not authenticated');
        return null;
    }

    const subscription = supabaseClient
        .channel('notifications-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.user_id}`
            },
            (payload) => {
                console.log('New notification received:', payload);
                callback(payload.new);
            }
        )
        .subscribe();

    return subscription;
};

/**
 * Unsubscribe from notifications
 * @param {Object} subscription - The subscription object to remove
 */
export const unsubscribeFromNotifications = (subscription) => {
    if (subscription) {
        supabaseClient.removeChannel(subscription);
    }
};

/**
 * Format timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} - Formatted relative time
 */
export const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString();
    }
};

/**
 * Get notification icon based on type
 * @param {string} type - Notification type
 * @returns {string} - Icon name or emoji
 */
export const getNotificationIcon = (type) => {
    switch (type) {
        case 'connection':
            return '🔗';
        case 'inventory':
            return '📦';
        case 'system':
            return '🔔';
        default:
            return '📢';
    }
};

/**
 * Get notification color based on type
 * @param {string} type - Notification type
 * @returns {string} - Color code
 */
export const getNotificationColor = (type) => {
    switch (type) {
        case 'connection':
            return '#0f9d58';
        case 'inventory':
            return '#f59e0b';
        case 'system':
            return '#3b82f6';
        default:
            return '#6b7280';
    }
};

/**
 * Send a notification to a user
 * @param {string} userId - The recipient user ID
 * @param {string} message - The notification message
 * @param {string} type - Notification type: 'connection', 'inventory', 'system'
 * @param {Object} data - Additional data (optional)
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const sendNotification = async (userId, message, type = 'system', data = {}) => {
    try {
        const { error } = await supabaseClient
            .from('notifications')
            .insert([{
                user_id: userId,
                message: message,
                type: type,
                is_read: false,
                data: data
            }]);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send connection request notification
 * @param {string} receiverId - The user receiving the connection request
 * @param {string} requesterName - Name of the user sending the request
 * @param {string} requesterRole - Role of the requester
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const sendConnectionRequestNotification = async (receiverId, requesterName, requesterRole) => {
    const message = `${requesterName} (${requesterRole}) sent you a connection request`;
    return sendNotification(receiverId, message, 'connection', {
        action: 'connection_request',
        requesterName,
        requesterRole
    });
};

/**
 * Send connection accepted notification
 * @param {string} requesterId - The user who sent the original request
 * @param {string} receiverName - Name of the user who accepted
 * @param {string} receiverRole - Role of the receiver
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const sendConnectionAcceptedNotification = async (requesterId, receiverName, receiverRole) => {
    const message = `${receiverName} (${receiverRole}) accepted your connection request`;
    return sendNotification(requesterId, message, 'connection', {
        action: 'connection_accepted',
        receiverName,
        receiverRole
    });
};

/**
 * Send connection rejected notification
 * @param {string} requesterId - The user who sent the original request
 * @param {string} receiverName - Name of the user who rejected
 * @param {string} receiverRole - Role of the receiver
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const sendConnectionRejectedNotification = async (requesterId, receiverName, receiverRole) => {
    const message = `${receiverName} (${receiverRole}) declined your connection request`;
    return sendNotification(requesterId, message, 'connection', {
        action: 'connection_rejected',
        receiverName,
        receiverRole
    });
};

/**
 * Send scrap inventory notification to all connected users
 * @param {string} scrapDealerId - The scrap dealer who added inventory
 * @param {string} dealerName - Name of the scrap dealer
 * @param {Object} scrapData - The scrap item data
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const sendScrapInventoryNotification = async (scrapDealerId, dealerName, scrapData) => {
    try {
        // Get all accepted connections for this scrap dealer
        const { data: connections, error: connError } = await supabaseClient
            .from('connections')
            .select('requester_id, receiver_id')
            .or(`requester_id.eq.${scrapDealerId},receiver_id.eq.${scrapDealerId}`)
            .eq('status', 'accepted');

        if (connError) throw connError;

        if (!connections || connections.length === 0) {
            return { success: true, error: null, sent: 0 };
        }

        // Get connected user IDs (the other party in each connection)
        const connectedUserIds = connections.map(conn =>
            conn.requester_id === scrapDealerId ? conn.receiver_id : conn.requester_id
        );

        // Create notification message
        const materialType = scrapData.material_type || scrapData.category || 'Scrap';
        const quantity = scrapData.quantity || scrapData.amount || 'some';
        const message = `${dealerName} added new ${materialType} inventory: ${quantity} available`;

        // Send notifications to all connected users
        const notifications = connectedUserIds.map(userId => ({
            user_id: userId,
            message: message,
            type: 'inventory',
            is_read: false,
            data: {
                action: 'new_scrap_inventory',
                dealerId: scrapDealerId,
                dealerName: dealerName,
                scrapData: scrapData
            }
        }));

        const { error } = await supabaseClient
            .from('notifications')
            .insert(notifications);

        if (error) throw error;

        return { success: true, error: null, sent: connectedUserIds.length };
    } catch (error) {
        console.error('Error sending scrap inventory notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get connected users for a given user ID
 * @param {string} userId - The user ID
 * @returns {Promise<{data: Array, error: Object}>}
 */
export const getConnectedUsers = async (userId) => {
    try {
        const { data, error } = await supabaseClient
            .from('connections')
            .select('requester_id, receiver_id')
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (error) throw error;

        const connectedIds = data.map(conn =>
            conn.requester_id === userId ? conn.receiver_id : conn.requester_id
        );

        return { data: connectedIds, error: null };
    } catch (error) {
        console.error('Error getting connected users:', error);
        return { data: [], error: error.message };
    }
};

/**
 * Respond to a scrap request (accept, counter-offer, or decline)
 * @param {string} orderId - The order ID
 * @param {string} action - 'accept', 'counter_offer', or 'decline'
 * @param {number} counterPrice - Counter offer price (only for counter_offer action)
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const respondToScrapRequest = async (orderId, action, counterPrice = null) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        console.log('Responding to scrap request:', { orderId, action, counterPrice, sellerId: user.user_id });

        // Update order status based on action
        let newStatus = 'processing';
        if (action === 'accept') {
            newStatus = 'shipped'; // Move to next step
        } else if (action === 'decline') {
            newStatus = 'delivered'; // Using delivered as declined status
        }

        // Update order status
        const { error: orderError } = await supabaseClient
            .from('orders')
            .update({ order_status: newStatus })
            .eq('order_id', orderId)
            .eq('seller_id', user.user_id);

        if (orderError) {
            console.error('Error updating order:', orderError);
            throw orderError;
        }

        // Get order details to find the buyer
        const { data: orderData, error: fetchError } = await supabaseClient
            .from('orders')
            .select('buyer_id, total_amount')
            .eq('order_id', orderId)
            .single();

        if (fetchError) {
            console.error('Error fetching order:', fetchError);
            throw fetchError;
        }

        console.log('Order data found:', orderData);

        // Send notification back to the artisan
        const dealerName = `${user["First name"] || ''} ${user["Last_Name"] || ''}`.trim() || 'Scrap Dealer';

        let message = '';
        if (action === 'accept') {
            message = `${dealerName} accepted your scrap request! Order #${orderId.slice(0, 8)}`;
        } else if (action === 'decline') {
            message = `${dealerName} declined your scrap request. Order #${orderId.slice(0, 8)}`;
        } else if (action === 'counter_offer') {
            message = `${dealerName} sent a counter offer of ₹${counterPrice}/kg. Order #${orderId.slice(0, 8)}`;
        }

        console.log('Sending notification to buyer:', orderData.buyer_id, 'Message:', message);

        const { data: notifyData, error: notifyError } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: orderData.buyer_id,
                message: message,
                type: 'system',
                is_read: false,
                data: {
                    action: 'scrap_response',
                    order_id: orderId,
                    response: action,
                    counter_price: counterPrice,
                    dealer_id: user.user_id,
                    dealer_name: dealerName
                }
            })
            .select();

        if (notifyError) {
            console.error('Error sending notification:', notifyError);
            throw notifyError;
        }

        console.log('Notification sent successfully:', notifyData);

        return { success: true, error: null };
    } catch (error) {
        console.error('Error responding to scrap request:', error);
        return { success: false, error: error.message };
    }
};
