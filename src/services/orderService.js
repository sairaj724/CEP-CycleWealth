import supabaseClient from '../supabase-config';

/**
 * Service for handling customer orders for upcycled products
 * Max 3 items per order
 */

/**
 * Get product details by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} - Product details
 */
export const getProductById = async (productId) => {
    try {
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select(`
                *,
                skilledlabor_profile:labor_id (
                    labor_id,
                    first_name,
                    last_name,
                    address,
                    city,
                    state,
                    pin_code,
                    phone
                )
            `)
            .eq('product_id', productId)
            .eq('status', 'Available')
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

/**
 * Get available products for ordering
 * @returns {Promise<Array>} - List of available products
 */
export const getAvailableProducts = async () => {
    try {
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select(`
                *,
                skilledlabor_profile:labor_id (
                    labor_id,
                    first_name,
                    last_name,
                    city,
                    state
                )
            `)
            .eq('status', 'Available')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching available products:', error);
        return [];
    }
};

/**
 * Create a new order (max 3 items per order)
 * @param {Object} orderData - Order data
 * @param {Array} orderData.items - Array of items (max 3) with product_id and quantity
 * @param {Object} orderData.deliveryAddress - Delivery address details
 * @returns {Promise<Object>} - Created order
 */
export const createOrder = async (orderData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Validate max 3 items per order
        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Please add at least one item to your order');
        }
        if (orderData.items.length > 3) {
            throw new Error('Maximum 3 items allowed per order');
        }

        // Validate delivery address
        const addr = orderData.deliveryAddress;
        if (!addr || !addr.fullName || !addr.phone || !addr.street || !addr.city || !addr.state || !addr.pinCode) {
            throw new Error('Please provide complete delivery address');
        }

        // Start a transaction by creating the order first
        const orderId = crypto.randomUUID();
        
        // Calculate total amount
        let totalAmount = 0;
        for (const item of orderData.items) {
            const product = await getProductById(item.product_id);
            if (!product) {
                throw new Error(`Product ${item.product_id} not found or no longer available`);
            }
            item.price = product.listed_price;
            item.labor_id = product.labor_id;
            totalAmount += (product.listed_price || 0) * (item.quantity || 1);
        }

        // Create the order
        const { data: order, error: orderError } = await supabaseClient
            .from('customer_orders')
            .insert({
                order_id: orderId,
                customer_id: user.user_id,
                total_amount: totalAmount,
                status: 'Pending',
                delivery_name: addr.fullName,
                delivery_phone: addr.phone,
                delivery_street: addr.street,
                delivery_city: addr.city,
                delivery_state: addr.state,
                delivery_pin_code: addr.pinCode,
                delivery_landmark: addr.landmark || null,
                payment_method: orderData.paymentMethod || 'COD'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = orderData.items.map(item => ({
            order_item_id: crypto.randomUUID(),
            order_id: orderId,
            product_id: item.product_id,
            labor_id: item.labor_id,
            quantity: item.quantity || 1,
            unit_price: item.price || 0
        }));

        const { error: itemsError } = await supabaseClient
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // Update product statuses to 'incart'
        for (const item of orderData.items) {
            const { error: updateError } = await supabaseClient
                .from('upcycled_products')
                .update({ status: 'incart' })
                .eq('product_id', item.product_id);

            if (updateError) console.error('Error updating product status:', updateError);
        }

        return { order, items: orderItems };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

/**
 * Get customer orders
 * @returns {Promise<Array>} - List of customer orders
 */
export const getCustomerOrders = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('customer_orders')
            .select(`
                *,
                order_items (
                    *,
                    upcycled_products:product_id (name, description),
                    skilledlabor_profile:labor_id (first_name, last_name)
                )
            `)
            .eq('customer_id', user.user_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        return [];
    }
};

/**
 * Get artisan orders (for skilled labor)
 * @returns {Promise<Array>} - List of orders containing artisan's products
 */
export const getArtisanOrders = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('order_items')
            .select(`
                *,
                customer_orders:order_id (*),
                upcycled_products:product_id (name, description, listed_price)
            `)
            .eq('labor_id', user.user_id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching artisan orders:', error);
        return [];
    }
};

/**
 * Cancel an order (customer can cancel if status is Pending)
 * @param {string} orderId - Order ID to cancel
 * @returns {Promise<Object>} - Updated order
 */
export const cancelOrder = async (orderId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // First check if order belongs to user and is pending
        const { data: order, error: fetchError } = await supabaseClient
            .from('customer_orders')
            .select('status')
            .eq('order_id', orderId)
            .eq('customer_id', user.user_id)
            .single();

        if (fetchError) throw fetchError;
        if (!order) throw new Error('Order not found');
        if (order.status !== 'Pending') {
            throw new Error('Only pending orders can be cancelled');
        }

        // Get order items to update product statuses back to Available
        const { data: items, error: itemsError } = await supabaseClient
            .from('order_items')
            .select('product_id')
            .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // Update order status to Cancelled
        const { data: updatedOrder, error: updateError } = await supabaseClient
            .from('customer_orders')
            .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
            .eq('order_id', orderId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Update products back to Available
        for (const item of items) {
            await supabaseClient
                .from('upcycled_products')
                .update({ status: 'Available' })
                .eq('product_id', item.product_id);
        }

        return updatedOrder;
    } catch (error) {
        console.error('Error cancelling order:', error);
        throw error;
    }
};

/**
 * Update order status (for artisans to mark as Sold/Shipped)
 * @param {string} orderId - Order ID
 * @param {string} status - New status (Sold, Delivered, etc.)
 * @returns {Promise<Object>} - Updated order
 */
export const updateOrderStatus = async (orderId, status) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('customer_orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};
