import supabaseClient from '../supabase-config';

/**
 * Service for handling customer orders for upcycled products
 * Max 3 items per order
 */

/**
 * Update product status to 'incart' when added to cart
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} - Success status
 */
export const addProductToCart = async (productId) => {
    try {
        const { data, error, count } = await supabaseClient
            .from('upcycled_products')
            .update({ status: 'incart' }, { count: 'exact' })
            .eq('product_id', productId)
            .eq('status', 'Available')
            .select();

        if (error) throw error;
        // Return true only if at least one row was actually updated
        return data && data.length > 0;
    } catch (error) {
        console.error('Error adding product to cart:', error);
        return false;
    }
};

/**
 * Update product status back to 'Available' when removed from cart
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} - Success status
 */
export const removeProductFromCart = async (productId) => {
    try {
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .update({ status: 'Available' })
            .eq('product_id', productId)
            .eq('status', 'incart')
            .select();

        if (error) throw error;
        // Return true only if at least one row was actually updated
        return data && data.length > 0;
    } catch (error) {
        console.error('Error removing product from cart:', error);
        return false;
    }
};

/**
 * Restore all abandoned cart products (incart status) back to Available
 * Use this on page load to recover from crashed/closed sessions
 * @returns {Promise<number>} - Number of products restored
 */
export const restoreAbandonedCartItems = async () => {
    try {
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .update({ status: 'Available' })
            .eq('status', 'incart')
            .select();

        if (error) throw error;
        return data ? data.length : 0;
    } catch (error) {
        console.error('Error restoring abandoned cart items:', error);
        return 0;
    }
};

/**
 * Get product details by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} - Product details
 */
export const getProductById = async (productId) => {
    try {
        // First try without join to avoid relation issues
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select('*')
            .eq('product_id', productId)
            .in('status', ['Available', 'incart'])
            .single();

        if (error) {
            console.error('getProductById error:', error);
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

/**
 * Get products currently in cart (incart status) - for cart restoration
 * @returns {Promise<Array>} - List of products in cart status
 */
export const getCartProducts = async () => {
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
            .eq('status', 'incart');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching cart products:', error);
        return [];
    }
};

/**
 * Get available products for ordering
 * @returns {Promise<Array>} - List of available products
 */
export const getAvailableProducts = async () => {
    try {
        // First try simple query without join
        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select('*')
            .eq('status', 'Available');

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
        console.log('Fetched products:', data);
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

        // Validate delivery address (form validation only - not stored in orders table)
        const addr = orderData.deliveryAddress;
        if (!addr || !addr.fullName || !addr.phone || !addr.street || !addr.city || !addr.state || !addr.pinCode) {
            throw new Error('Please provide complete delivery address');
        }

        // Start a transaction by creating the order first
        const orderId = crypto.randomUUID();
        
        // Calculate total amount
        let totalAmount = 0;
        for (const item of orderData.items) {
            console.log('Looking up product:', item.product_id);
            const product = await getProductById(item.product_id);
            console.log('Found product:', product);
            if (!product) {
                // Try to get product with any status for debugging
                const { data: debugProduct } = await supabaseClient
                    .from('upcycled_products')
                    .select('product_id, status, name')
                    .eq('product_id', item.product_id)
                    .single();
                console.error('Product debug info:', debugProduct);
                throw new Error(`Product ${item.product_id} not found or no longer available (status: ${debugProduct?.status || 'not found'})`);
            }
            item.price = product.listed_price;
            item.labor_id = product.labor_id;
            totalAmount += (product.listed_price || 0) * (item.quantity || 1);
        }

        // Create the order (only using columns that exist in schema)
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert({
                order_id: orderId,
                buyer_id: user.user_id,
                total_amount: totalAmount,
                order_status: 'processing',
                order_type: 'customers'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Update product statuses to 'Sold' when order is placed
        for (const item of orderData.items) {
            const { error: updateError } = await supabaseClient
                .from('upcycled_products')
                .update({ status: 'Sold', sold_price: item.price })
                .eq('product_id', item.product_id);

            if (updateError) console.error('Error updating product status:', updateError);
        }

        return { order };
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
            .from('orders')
            .select('*')
            .eq('buyer_id', user.user_id);

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
            .from('orders')
            .select('*')
            .eq('buyer_id', user.user_id);

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
            .from('orders')
            .select('order_status')
            .eq('order_id', orderId)
            .eq('buyer_id', user.user_id)
            .single();

        if (fetchError) throw fetchError;
        if (!order) throw new Error('Order not found');
        if (order.order_status !== 'processing') {
            throw new Error('Only pending orders can be cancelled');
        }

        // Update order status to Cancelled
        const { data: updatedOrder, error: updateError } = await supabaseClient
            .from('orders')
            .update({ order_status: 'delivered' })
            .eq('order_id', orderId)
            .select()
            .single();

        if (updateError) throw updateError;

        return { order: updatedOrder };
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
            .from('orders')
            .update({ order_status: status })
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
