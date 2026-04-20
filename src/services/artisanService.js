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
            status: 'Available'
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
