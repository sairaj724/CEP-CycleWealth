import supabaseClient from '../supabase-config';

/**
 * Service for handling artisan/skilled labor operations with Supabase
 */

/**
 * Get skilled labor profile for current user
 * Schema: labor_id references users(user_id)
 * @returns {Promise<Object|null>} - The profile or null
 */
export const getSkilledLaborProfile = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('skilledlabor_profile')
            .select('*')
            .eq('labor_id', user.user_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in getSkilledLaborProfile:', error);
        return null;
    }
};

/**
 * Create or get skilled labor profile for a user
 * Schema: labor_id references users(user_id)
 * @param {Object} profileData - Skilled labor profile data
 * @returns {Promise<Object>} - The created/retrieved profile
 */
export const createOrGetSkilledLaborProfile = async (profileData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabaseClient
            .from('skilledlabor_profile')
            .select('labor_id')
            .eq('labor_id', user.user_id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        if (existingProfile) {
            return existingProfile;
        }

        // Create new profile with labor_id = user_id (FK constraint)
        const pinValue = profileData.pinCode?.toString().trim();
        const { data: newProfile, error: insertError } = await supabaseClient
            .from('skilledlabor_profile')
            .insert({
                labor_id: user.user_id,
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                address: profileData.address || null,
                city: profileData.city || null,
                state: profileData.state || null,
                pin_code: pinValue ? parseInt(pinValue) : null,
                skills: profileData.skills || null
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return newProfile;
    } catch (error) {
        console.error('Error in createOrGetSkilledLaborProfile:', error);
        throw error;
    }
};

/**
 * Update skilled labor profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} - The updated profile
 */
export const updateSkilledLaborProfile = async (profileData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Build complete profile data for upsert
        const upsertData = {
            labor_id: user.user_id,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            address: profileData.address || null,
            city: profileData.city || null,
            state: profileData.state || null,
            pin_code: profileData.pinCode ? parseInt(profileData.pinCode.toString().trim()) : null,
            skills: profileData.skills || null
        };

        // Use upsert to insert if not exists, update if exists
        const { data, error } = await supabaseClient
            .from('skilledlabor_profile')
            .upsert(upsertData, { onConflict: 'labor_id' })
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error in updateSkilledLaborProfile:', error);
        throw error;
    }
};

/**
 * Get all products for the current artisan
 * @returns {Promise<Array>} - Array of products
 */
export const getArtisanProducts = async () => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .select('*')
            .eq('labor_id', user.user_id)
            .order('product_id', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error in getArtisanProducts:', error);
        return [];
    }
};

/**
 * Add a new product for the artisan
 * @param {Object} productData - Product details
 * @returns {Promise<Object>} - The created product
 */
export const addArtisanProduct = async (productData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        // Get the skilled labor profile to get labor_id
        const { data: profile, error: profileError } = await supabaseClient
            .from('skilledlabor_profile')
            .select('labor_id')
            .eq('labor_id', user.user_id)
            .single();

        if (profileError) {
            console.error('Error fetching labor profile:', profileError);
            throw new Error('Skilled labor profile not found. Please complete your profile first.');
        }

        // Generate UUID for product_id
        const productId = crypto.randomUUID();

        // Build insert object matching the database schema
        const insertData = {
            product_id: productId,
            labor_id: profile.labor_id,
            name: productData.name,
            description: productData.description || null,
            listed_price: productData.price ? parseFloat(productData.price) : null,
            status: 'Available',
            quantity: productData.quantity ? parseInt(productData.quantity) : null
        };

        console.log('Inserting product data:', insertData);

        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }

        console.log('Product saved successfully:', data);
        return data;
    } catch (error) {
        console.error('Error in addArtisanProduct:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
    }
};

/**
 * Update an existing product
 * @param {string} productId - UUID of the product
 * @param {Object} productData - Updated product data
 * @returns {Promise<Object>} - The updated product
 */
export const updateArtisanProduct = async (productId, productData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const updateData = {};
        if (productData.name !== undefined) updateData.name = productData.name;
        if (productData.description !== undefined) updateData.description = productData.description;
        if (productData.price !== undefined) updateData.listed_price = parseFloat(productData.price);
        if (productData.status !== undefined) updateData.status = productData.status;

        const { data, error } = await supabaseClient
            .from('upcycled_products')
            .update(updateData)
            .eq('product_id', productId)
            .eq('labor_id', user.user_id)
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error('Error in updateArtisanProduct:', error);
        throw error;
    }
};

/**
 * Delete a product
 * @param {string} productId - UUID of the product to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteArtisanProduct = async (productId) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabaseClient
            .from('upcycled_products')
            .delete()
            .eq('product_id', productId)
            .eq('labor_id', user.user_id);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error in deleteArtisanProduct:', error);
        throw error;
    }
};

/**
 * Fetch all scrap dealers from the database
 * @returns {Promise<Array>} - Array of scrap dealers with their profiles
 */
export const getScrapDealers = async () => {
    try {
        // Fetch scrap dealers from users table
        const { data: usersData, error: usersError } = await supabaseClient
            .from('users')
            .select('user_id, "First name", "Last_Name", email_address, latitude, longitude')
            .eq('role', 'ScrapDealer');

        if (usersError) {
            console.error('Error fetching scrap dealers:', usersError);
            throw usersError;
        }

        if (!usersData || usersData.length === 0) {
            return [];
        }

        // Get dealer IDs to fetch their profiles
        const dealerIds = usersData.map(u => u.user_id);

        // Fetch extended profile data from scrapdealer_profile
        const { data: profilesData, error: profilesError } = await supabaseClient
            .from('scrapdealer_profile')
            .select('dealer_id, business_name, contact_number, "Area", "City", "State", pincode, business_description, established_year, working_hours')
            .in('dealer_id', dealerIds);

        if (profilesError) {
            console.error('Error fetching dealer profiles:', profilesError);
            // Continue without profile data
        }

        // Combine user data with profile data
        const dealers = usersData.map(user => {
            const profile = profilesData?.find(p => p.dealer_id === user.user_id) || {};
            const fullName = `${user["First name"] || ''} ${user["Last_Name"] || ''}`.trim();

            // Build address from profile fields
            const addressParts = [profile.Area, profile.City, profile.State].filter(Boolean);
            const address = addressParts.join(', ') || 'Location not specified';

            // Determine materials based on business description or default
            let materials = 'All Types';
            if (profile.business_description) {
                const desc = profile.business_description.toLowerCase();
                if (desc.includes('paper')) materials = 'Paper, Cardboard';
                else if (desc.includes('plastic')) materials = 'Plastic, PET';
                else if (desc.includes('metal')) materials = 'Metal, Iron, Steel';
                else if (desc.includes('e-waste') || desc.includes('electronic')) materials = 'E-Waste, Electronics';
                else if (desc.includes('glass')) materials = 'Glass, Bottles';
            }

            // Generate a mock price based on materials
            let price = '₹25/kg';
            if (materials.includes('Paper')) price = '₹15/kg';
            else if (materials.includes('Plastic')) price = '₹20/kg';
            else if (materials.includes('Metal')) price = '₹45/kg';
            else if (materials.includes('E-Waste')) price = '₹60/kg';
            else if (materials.includes('Glass')) price = '₹10/kg';

            // Generate a random rating between 4.0 and 5.0
            const rating = (4 + Math.random()).toFixed(1);

            return {
                id: user.user_id,
                name: profile.business_name || fullName || 'Scrap Dealer',
                materials: materials,
                price: price,
                location: address,
                rating: parseFloat(rating),
                contact: profile.contact_number || 'Contact via app',
                email: user.email_address,
                workingHours: profile.working_hours || '9 AM - 6 PM',
                latitude: user.latitude,
                longitude: user.longitude
            };
        });

        return dealers;
    } catch (error) {
        console.error('Error in getScrapDealers:', error);
        return [];
    }
};

/**
 * Create a scrap order from artisan to scrap dealer
 * @param {Object} orderData - Order details
 * @param {string} orderData.dealerId - Scrap dealer user ID
 * @param {string} orderData.materialType - Type of scrap material needed
 * @param {string} orderData.quantity - Quantity needed
 * @param {number} orderData.offeredPrice - Price offered by artisan
 * @param {string} orderData.notes - Additional notes
 * @returns {Promise<{orderId: string, success: boolean}>}
 */
export const createScrapOrder = async (orderData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const orderId = crypto.randomUUID();

        // Create order in database with seller_id as the dealer
        const { data, error } = await supabaseClient
            .from('orders')
            .insert({
                order_id: orderId,
                buyer_id: user.user_id,
                seller_id: orderData.dealerId,
                total_amount: orderData.offeredPrice,
                order_status: 'processing',
                order_type: 'customers'
            })
            .select()
            .single();

        if (error) throw error;

        return { orderId, success: true, data };
    } catch (error) {
        console.error('Error creating scrap order:', error);
        throw error;
    }
};

/**
 * Send scrap request notification to dealer
 * @param {string} dealerId - Scrap dealer user ID
 * @param {Object} requestData - Request details
 * @returns {Promise<{success: boolean}>}
 */
export const sendScrapRequestNotification = async (dealerId, requestData) => {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.user_id) {
            throw new Error('User not authenticated');
        }

        const artisanName = `${user["First name"] || ''} ${user["Last_Name"] || ''}`.trim() || 'An Artisan';

        const message = `${artisanName} wants to buy ${requestData.materialType} (${requestData.quantity}) - Offered: ₹${requestData.offeredPrice}/kg`;

        const { error } = await supabaseClient
            .from('notifications')
            .insert({
                user_id: dealerId,
                message: message,
                type: 'system',
                is_read: false,
                data: {
                    action: 'scrap_request',
                    order_id: requestData.orderId,
                    artisan_id: user.user_id,
                    artisan_name: artisanName,
                    material_type: requestData.materialType,
                    quantity: requestData.quantity,
                    offered_price: requestData.offeredPrice,
                    notes: requestData.notes,
                    status: 'pending',
                    requires_action: true,
                    actions: ['accept', 'counter_offer', 'decline']
                }
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Error sending scrap request notification:', error);
        throw error;
    }
};
