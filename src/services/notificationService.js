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
 * Update notification data (e.g., set status after action taken)
 * @param {string} notificationId - The notification UUID
 * @param {Object} dataUpdates - Object with data fields to update
 * @returns {Promise<{success: boolean, error: Object}>}
 */
export const updateNotificationData = async (notificationId, dataUpdates) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user?.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get current notification data first
        const { data: currentData, error: fetchError } = await supabaseClient
            .from('notifications')
            .select('data')
            .eq('id', notificationId)
            .eq('user_id', user.user_id)
            .single();

        if (fetchError) throw fetchError;

        // Merge current data with updates
        const updatedData = { ...currentData.data, ...dataUpdates };

        const { error } = await supabaseClient
            .from('notifications')
            .update({ data: updatedData })
            .eq('id', notificationId)
            .eq('user_id', user.user_id);

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error updating notification data:', error);
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

/**
 * Send notification to all scrap dealers about a new enterprise order
 * @param {Object} orderData - The industry order data
 * @param {string} companyName - Name of the enterprise placing the order
 * @returns {Promise<{success: boolean, sent: number, error: string}>}
 */
export const notifyScrapDealersOfEnterpriseOrder = async (orderData, companyName) => {
    try {
        console.log('Starting notification process for order:', orderData.order_id);
        console.log('Company name:', companyName);

        // Check if we have valid order data
        if (!orderData || !orderData.order_id) {
            console.error('Invalid order data provided');
            return { success: false, sent: 0, error: 'Invalid order data' };
        }

        // Get all scrap dealers from users table
        console.log('Fetching scrap dealers from users table...');
        const { data: dealers, error: dealersError } = await supabaseClient
            .from('users')
            .select('user_id, "First name", "Last_Name"')
            .eq('role', 'ScrapDealer');

        if (dealersError) {
            console.error('Error fetching scrap dealers:', dealersError);
            console.error('Error code:', dealersError.code);
            console.error('Error message:', dealersError.message);
            throw dealersError;
        }

        console.log(`Found ${dealers?.length || 0} scrap dealers`);

        if (!dealers || dealers.length === 0) {
            console.warn('No scrap dealers found to notify');
            return { success: true, sent: 0, error: null };
        }

        // Log dealer IDs for debugging
        console.log('Scrap dealer IDs:', dealers.map(d => d.user_id));

        // Create notification message
        const materialType = orderData.material_type || 'scrap material';
        const quantity = orderData.quantity || 'N/A';
        const message = `New order request from ${companyName}: ${quantity} ${materialType} needed. Click to view details and fulfill this demand.`;

        console.log('Creating notifications for dealers...');

        // Create notifications for all dealers
        const notifications = dealers.map(dealer => ({
            user_id: dealer.user_id,
            message: message,
            type: 'inventory',
            is_read: false,
            data: {
                action: 'enterprise_order_request',
                order_id: orderData.order_id,
                industry_id: orderData.industry_id,
                company_name: companyName,
                material_type: orderData.material_type,
                quantity: orderData.quantity,
                price: orderData.price,
                city: orderData['City'],
                pincode: orderData['PIN_code'],
                preferred_date: orderData['Prefered_Delivery_Date'],
                delivery_details: orderData.delivery_details,
                contact_person: orderData['Person_name'],
                contact_phone: orderData.phone_no
            }
        }));

        console.log(`Inserting ${notifications.length} notifications...`);

        // Insert all notifications
        const { data: insertData, error: insertError } = await supabaseClient
            .from('notifications')
            .insert(notifications)
            .select();

        if (insertError) {
            console.error('Error inserting notifications:', insertError);
            console.error('Error code:', insertError.code);
            console.error('Error message:', insertError.message);
            console.error('Error details:', insertError.details);
            throw insertError;
        }

        console.log(`Successfully notified ${dealers.length} scrap dealers about new enterprise order`);
        console.log('Insert response:', insertData);
        return { success: true, sent: dealers.length, error: null };
    } catch (error) {
        console.error('Error notifying scrap dealers:', error);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        return { success: false, sent: 0, error: error.message };
    }
};

/**
 * Send notification to enterprise that their order has been accepted
 * @param {string} industryId - The enterprise user ID
 * @param {string} companyName - The enterprise company name
 * @param {Object} orderData - The order details
 * @param {Object} dealerData - The scrap dealer who accepted
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const notifyEnterpriseOfOrderAcceptance = async (industryId, companyName, orderData, dealerData) => {
    try {
        const dealerName = dealerData.business_name || 
            `${dealerData['First name'] || ''} ${dealerData['Last_Name'] || ''}`.trim() || 
            'A scrap dealer';

        const message = `${dealerName} has accepted your order for ${orderData.quantity} ${orderData.material_type}. Your scrap will be delivered as requested.`;

        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: industryId,
                message: message,
                type: 'system',
                is_read: false,
                data: {
                    action: 'order_fulfilled',
                    order_id: orderData.order_id,
                    dealer_id: dealerData.user_id,
                    dealer_name: dealerName,
                    material_type: orderData.material_type,
                    quantity: orderData.quantity,
                    delivery_date: orderData['Prefered_Delivery_Date'],
                    city: orderData['City']
                }
            });

        if (error) throw error;

        console.log(`Notified enterprise ${companyName} about order acceptance`);
        return { success: true, error: null };
    } catch (error) {
        console.error('Error notifying enterprise:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get all pending enterprise orders for scrap dealers to view
 * @returns {Promise<{data: Array, error: string}>}
 */
export const getPendingEnterpriseOrders = async () => {
    try {
        // Get all industry orders with company details
        const { data: orders, error: ordersError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    industry_type,
                    "Contact_person",
                    email_address,
                    phone_no
                )
            `)
            .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        return { data: orders || [], error: null };
    } catch (error) {
        console.error('Error fetching enterprise orders:', error);
        return { data: [], error: error.message };
    }
};

/**
 * Scrap dealer accepts an enterprise order
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {Object} fulfillmentDetails - Details about how the dealer will fulfill
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const acceptEnterpriseOrder = async (orderId, dealerId, fulfillmentDetails = {}) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get order details first
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person",
                    email_address,
                    phone_no
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        if (!orderData) {
            return { success: false, error: 'Order not found' };
        }

        // Try to update order - only update fields that exist
        // Build update object dynamically based on what might exist
        let updateData = {};
        
        // Add fields if the schema supports them
        // Using try-catch to handle schema mismatches gracefully
        try {
            // Core update - try to add dealer assignment
            updateData.assigned_dealer_id = dealerId;
            updateData.status = 'accepted';
            updateData.fulfillment_notes = fulfillmentDetails.notes || '';
            updateData.updated_at = new Date().toISOString();
        } catch (e) {
            // If schema doesn't have these, send minimal data
            console.warn('Schema may not have all order tracking columns');
        }
        
        const { error: updateError } = await supabaseClient
            .from('industry_order')
            .update(updateData)
            .eq('order_id', orderId);

        if (updateError) {
            console.error('Error updating order:', updateError);
            // If it's a column error, still notify but don't update
            if (updateError.message?.includes('column') || updateError.message?.includes('does not exist')) {
                console.warn('Order update failed due to schema - continuing with notification only');
            } else {
                throw updateError;
            }
        }

        // Get dealer details for notification
        const { data: dealerData, error: dealerError } = await supabaseClient
            .from('users')
            .select('"First name", "Last_Name", email_address')
            .eq('user_id', dealerId)
            .single();

        if (dealerError) {
            console.error('Error fetching dealer details:', dealerError);
        }

        // Get dealer profile for business name
        const { data: dealerProfile, error: profileError } = await supabaseClient
            .from('scrapdealer_profile')
            .select('business_name')
            .eq('dealer_id', dealerId)
            .single();

        const dealerInfo = {
            user_id: dealerId,
            ...dealerData,
            business_name: dealerProfile?.business_name
        };

        // Notify the enterprise
        await notifyEnterpriseOfOrderAcceptance(
            orderData.industry_id,
            orderData.industry_profile?.company_name,
            orderData,
            dealerInfo
        );

        return { success: true, error: null };
    } catch (error) {
        console.error('Error accepting enterprise order:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to enterprise that their order was rejected
 * @param {string} industryId - The enterprise user ID
 * @param {string} companyName - The enterprise company name
 * @param {Object} orderData - The order details
 * @param {Object} dealerData - The scrap dealer who rejected
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const notifyEnterpriseOfOrderRejection = async (industryId, companyName, orderData, dealerData, reason = '') => {
    try {
        const dealerName = dealerData.business_name ||
            `${dealerData['First name'] || ''} ${dealerData['Last_Name'] || ''}`.trim() ||
            'A scrap dealer';

        const reasonText = reason ? ` Reason: ${reason}.` : '';
        const message = `${dealerName} has declined your order for ${orderData.quantity} ${orderData.material_type}.${reasonText} Other dealers can still fulfill this request.`;

        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: industryId,
                message: message,
                type: 'system',
                is_read: false,
                data: {
                    action: 'order_rejected',
                    order_id: orderData.order_id,
                    dealer_id: dealerData.user_id,
                    dealer_name: dealerName,
                    material_type: orderData.material_type,
                    quantity: orderData.quantity,
                    rejection_reason: reason,
                    city: orderData['City']
                }
            });

        if (error) throw error;

        console.log(`Notified enterprise ${companyName} about order rejection`);
        return { success: true, error: null };
    } catch (error) {
        console.error('Error notifying enterprise of rejection:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send notification to enterprise about counter offer
 * @param {string} industryId - The enterprise user ID
 * @param {string} companyName - The enterprise company name
 * @param {Object} orderData - The order details
 * @param {Object} dealerData - The scrap dealer making counter offer
 * @param {number} counterPrice - The counter offer price
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const notifyEnterpriseOfCounterOffer = async (industryId, companyName, orderData, dealerData, counterPrice) => {
    try {
        const dealerName = dealerData.business_name ||
            `${dealerData['First name'] || ''} ${dealerData['Last_Name'] || ''}`.trim() ||
            'A scrap dealer';

        const originalPrice = orderData.price || 'N/A';
        const message = `${dealerName} has made a counter offer for your order: ${orderData.quantity} ${orderData.material_type} at ₹${counterPrice}/unit (original: ₹${originalPrice}/unit). Click to accept or decline.`;

        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: industryId,
                message: message,
                type: 'system',
                is_read: false,
                data: {
                    action: 'counter_offer',
                    order_id: orderData.order_id,
                    dealer_id: dealerData.user_id,
                    dealer_name: dealerName,
                    material_type: orderData.material_type,
                    quantity: orderData.quantity,
                    original_price: orderData.price,
                    counter_price: counterPrice,
                    requires_action: true,
                    city: orderData['City']
                }
            });

        if (error) throw error;

        console.log(`Notified enterprise ${companyName} about counter offer`);
        return { success: true, error: null };
    } catch (error) {
        console.error('Error notifying enterprise of counter offer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Scrap dealer rejects an enterprise order
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const rejectEnterpriseOrder = async (orderId, dealerId, reason = '') => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get order details first
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person",
                    email_address,
                    phone_no
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;
        if (!orderData) {
            return { success: false, error: 'Order not found' };
        }

        // Get dealer details for notification
        const { data: dealerData, error: dealerError } = await supabaseClient
            .from('users')
            .select('"First name", "Last_Name", email_address')
            .eq('user_id', dealerId)
            .single();

        if (dealerError) {
            console.error('Error fetching dealer details:', dealerError);
        }

        // Get dealer profile for business name
        const { data: dealerProfile, error: profileError } = await supabaseClient
            .from('scrapdealer_profile')
            .select('business_name')
            .eq('dealer_id', dealerId)
            .single();

        const dealerInfo = {
            user_id: dealerId,
            ...dealerData,
            business_name: dealerProfile?.business_name
        };

        // Notify the enterprise about rejection
        await notifyEnterpriseOfOrderRejection(
            orderData.industry_id,
            orderData.industry_profile?.company_name,
            orderData,
            dealerInfo,
            reason
        );

        // Record rejection (optional - could store in a separate table)
        console.log(`Dealer ${dealerId} rejected order ${orderId}`);

        return { success: true, error: null };
    } catch (error) {
        console.error('Error rejecting enterprise order:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Scrap dealer makes a counter offer for an enterprise order
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {number} counterPrice - The counter offer price per unit
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const counterEnterpriseOrder = async (orderId, dealerId, counterPrice) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Validate counter price
        if (!counterPrice || isNaN(counterPrice) || counterPrice <= 0) {
            return { success: false, error: 'Invalid counter offer price' };
        }

        // Get order details first
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person",
                    email_address,
                    phone_no
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;
        if (!orderData) {
            return { success: false, error: 'Order not found' };
        }

        // Get dealer details for notification
        const { data: dealerData, error: dealerError } = await supabaseClient
            .from('users')
            .select('"First name", "Last_Name", email_address')
            .eq('user_id', dealerId)
            .single();

        if (dealerError) {
            console.error('Error fetching dealer details:', dealerError);
        }

        // Get dealer profile for business name
        const { data: dealerProfile, error: profileError } = await supabaseClient
            .from('scrapdealer_profile')
            .select('business_name')
            .eq('dealer_id', dealerId)
            .single();

        const dealerInfo = {
            user_id: dealerId,
            ...dealerData,
            business_name: dealerProfile?.business_name
        };

        // Notify the enterprise about counter offer
        await notifyEnterpriseOfCounterOffer(
            orderData.industry_id,
            orderData.industry_profile?.company_name,
            orderData,
            dealerInfo,
            counterPrice
        );

        return { success: true, error: null };
    } catch (error) {
        console.error('Error making counter offer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify scrap dealer about enterprise's response to counter offer
 * @param {string} dealerId - The scrap dealer user ID
 * @param {string} companyName - The enterprise company name
 * @param {Object} orderData - The order details
 * @param {string} action - The enterprise action: 'accepted', 'rejected', 'countered'
 * @param {number} counterPrice - The counter price if action is 'countered'
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const notifyScrapDealerOfEnterpriseResponse = async (dealerId, companyName, orderData, action, counterPrice = null) => {
    try {
        let message = '';
        let notificationAction = '';

        if (action === 'accepted') {
            message = `${companyName} has accepted your counter offer for ${orderData.quantity} ${orderData.material_type}. The order is confirmed!`;
            notificationAction = 'enterprise_accepted_counter';
        } else if (action === 'rejected') {
            message = `${companyName} has declined your counter offer for ${orderData.quantity} ${orderData.material_type}. The order is still open for other dealers.`;
            notificationAction = 'enterprise_rejected_counter';
        } else if (action === 'countered') {
            const dealerPrice = orderData.counter_price || orderData.price;
            message = `${companyName} has made a counter offer: ${orderData.quantity} ${orderData.material_type} at ₹${counterPrice}/unit (your offer was ₹${dealerPrice}/unit). Click to respond.`;
            notificationAction = 'enterprise_counter_back';
        }

        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: dealerId,
                message: message,
                type: 'system',
                is_read: false,
                data: {
                    action: notificationAction,
                    order_id: orderData.order_id,
                    company_name: companyName,
                    material_type: orderData.material_type,
                    quantity: orderData.quantity,
                    counter_price: counterPrice,
                    original_price: orderData.price,
                    dealer_counter_price: orderData.counter_price,
                    requires_action: action === 'countered',
                    status: action === 'accepted' ? 'accepted' : action === 'rejected' ? 'rejected' : 'pending'
                }
            });

        if (error) throw error;

        console.log(`Notified scrap dealer about enterprise ${action} for order ${orderData.order_id}`);
        return { success: true, error: null };
    } catch (error) {
        console.error('Error notifying scrap dealer of enterprise response:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Enterprise accepts scrap dealer's counter offer
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const enterpriseAcceptCounterOffer = async (orderId, dealerId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person"
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        // Update order with accepted counter price
        const { error: updateError } = await supabaseClient
            .from('industry_order')
            .update({
                assigned_dealer_id: dealerId,
                status: 'accepted',
                final_price: orderData.counter_price,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) throw updateError;

        // Notify scrap dealer
        await notifyScrapDealerOfEnterpriseResponse(
            dealerId,
            orderData.industry_profile?.company_name,
            orderData,
            'accepted'
        );

        return { success: true, error: null };
    } catch (error) {
        console.error('Error accepting counter offer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Enterprise rejects scrap dealer's counter offer
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const enterpriseRejectCounterOffer = async (orderId, dealerId, reason = '') => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person"
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        // Notify scrap dealer
        await notifyScrapDealerOfEnterpriseResponse(
            dealerId,
            orderData.industry_profile?.company_name,
            orderData,
            'rejected'
        );

        return { success: true, error: null };
    } catch (error) {
        console.error('Error rejecting counter offer:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Enterprise makes a counter offer back to scrap dealer
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {number} counterPrice - The enterprise's counter price
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const enterpriseCounterBack = async (orderId, dealerId, counterPrice) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        if (!counterPrice || isNaN(counterPrice) || counterPrice <= 0) {
            return { success: false, error: 'Invalid counter offer price' };
        }

        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person"
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        // Update order with enterprise counter
        const { error: updateError } = await supabaseClient
            .from('industry_order')
            .update({
                enterprise_counter_price: counterPrice,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) throw updateError;

        // Notify scrap dealer
        await notifyScrapDealerOfEnterpriseResponse(
            dealerId,
            orderData.industry_profile?.company_name,
            orderData,
            'countered',
            counterPrice
        );

        return { success: true, error: null };
    } catch (error) {
        console.error('Error making counter back:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Scrap dealer accepts enterprise's counter offer
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const scrapDealerAcceptEnterpriseCounter = async (orderId, dealerId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person"
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        // Update order as accepted
        const { error: updateError } = await supabaseClient
            .from('industry_order')
            .update({
                assigned_dealer_id: dealerId,
                status: 'accepted',
                final_price: orderData.enterprise_counter_price,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) throw updateError;

        // Notify enterprise
        const { data: dealerData } = await supabaseClient
            .from('scrapdealer_profile')
            .select('business_name')
            .eq('dealer_id', dealerId)
            .single();

        const dealerName = dealerData?.business_name || 'A scrap dealer';

        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: orderData.industry_id,
                message: `${dealerName} has accepted your counter offer for ${orderData.quantity} ${orderData.material_type}. The order is confirmed!`,
                type: 'system',
                is_read: false,
                data: {
                    action: 'order_fulfilled',
                    order_id: orderId,
                    dealer_id: dealerId,
                    dealer_name: dealerName,
                    final_price: orderData.enterprise_counter_price,
                    status: 'accepted'
                }
            });

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error accepting enterprise counter:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Scrap dealer rejects enterprise's counter offer
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const scrapDealerRejectEnterpriseCounter = async (orderId, dealerId, reason = '') => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person"
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        // Get dealer details
        const { data: dealerData } = await supabaseClient
            .from('scrapdealer_profile')
            .select('business_name')
            .eq('dealer_id', dealerId)
            .single();

        const dealerName = dealerData?.business_name || 'A scrap dealer';
        const reasonText = reason ? ` Reason: ${reason}.` : '';

        // Notify enterprise
        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: orderData.industry_id,
                message: `${dealerName} has declined your counter offer for ${orderData.quantity} ${orderData.material_type}.${reasonText} The order is still open.`,
                type: 'system',
                is_read: false,
                data: {
                    action: 'counter_rejected',
                    order_id: orderId,
                    dealer_id: dealerId,
                    dealer_name: dealerName,
                    rejection_reason: reason,
                    status: 'rejected'
                }
            });

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error rejecting enterprise counter:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Scrap dealer makes another counter offer to enterprise
 * @param {string} orderId - The industry order ID
 * @param {string} dealerId - The scrap dealer user ID
 * @param {number} counterPrice - The new counter price
 * @returns {Promise<{success: boolean, error: string}>}
 */
export const scrapDealerCounterBackToEnterprise = async (orderId, dealerId, counterPrice) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            return { success: false, error: 'User not authenticated' };
        }

        if (!counterPrice || isNaN(counterPrice) || counterPrice <= 0) {
            return { success: false, error: 'Invalid counter offer price' };
        }

        // Get order details
        const { data: orderData, error: orderError } = await supabaseClient
            .from('industry_order')
            .select(`
                *,
                industry_profile:industry_id (
                    company_name,
                    "Contact_person"
                )
            `)
            .eq('order_id', orderId)
            .single();

        if (orderError) throw orderError;

        // Update order with new counter price
        const { error: updateError } = await supabaseClient
            .from('industry_order')
            .update({
                counter_price: counterPrice,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) throw updateError;

        // Get dealer details
        const { data: dealerData } = await supabaseClient
            .from('scrapdealer_profile')
            .select('business_name')
            .eq('dealer_id', dealerId)
            .single();

        const dealerName = dealerData?.business_name || 'A scrap dealer';

        // Send counter offer notification to enterprise
        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: orderData.industry_id,
                message: `${dealerName} has made a new counter offer: ${orderData.quantity} ${orderData.material_type} at ₹${counterPrice}/unit (your offer was ₹${orderData.enterprise_counter_price}/unit). Click to respond.`,
                type: 'system',
                is_read: false,
                data: {
                    action: 'counter_offer',
                    order_id: orderId,
                    dealer_id: dealerId,
                    dealer_name: dealerName,
                    material_type: orderData.material_type,
                    quantity: orderData.quantity,
                    counter_price: counterPrice,
                    enterprise_counter_price: orderData.enterprise_counter_price,
                    original_price: orderData.price,
                    requires_action: true,
                    status: 'pending'
                }
            });

        if (error) throw error;

        return { success: true, error: null };
    } catch (error) {
        console.error('Error making counter back to enterprise:', error);
        return { success: false, error: error.message };
    }
};
