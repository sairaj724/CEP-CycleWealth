import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddScrapCollection.css';
import SharedNavbar from '../components/SharedNavbar';
import supabaseClient from '../supabase-config';
import { sendScrapInventoryNotification } from '../services/notificationService';

const STATUS_OPTIONS = [
    { value: 'collected', label: 'Collected', color: '#4CAF50' },
    { value: 'send_for_recycling', label: 'Send for Recycling', color: '#FF9800' },
    { value: 'recycled', label: 'Recycled', color: '#2196F3' },
    { value: 'upcycled', label: 'Upcycled', color: '#9C27B0' }
];

// Default scrap categories with descriptions
// All available scrap categories - always show these in dropdown
const ALL_SCRAP_TYPES = [
    { scrap_type: 'Iron', defaultDescription: 'Ferrous metal, commonly found in construction materials, old machinery, and vehicles' },
    { scrap_type: 'Copper', defaultDescription: 'Non-ferrous metal with high conductivity, found in wires, pipes, and electronics' },
    { scrap_type: 'Brass', defaultDescription: 'Alloy of copper and zinc, commonly found in fittings, valves, and decorative items' },
    { scrap_type: 'Aluminium', defaultDescription: 'Lightweight non-ferrous metal, found in cans, window frames, and automotive parts' },
    { scrap_type: 'Steel', defaultDescription: 'Strong ferrous metal alloy, found in appliances, beams, and industrial equipment' },
    { scrap_type: 'Plastic', defaultDescription: 'Various plastic materials including bottles, containers, and packaging waste' },
    { scrap_type: 'Paper', defaultDescription: 'Paper products including cardboard, newspapers, and office paper waste' },
    { scrap_type: 'Electronic Gadgets', defaultDescription: 'E-waste including phones, computers, tablets, and electronic components' },
    { scrap_type: 'Others', defaultDescription: 'Other scrap materials not listed above' }
];

function AddScrapCollection() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        category_id: '',
        weight: '',
        quantity: 1,
        status: 'collected',
        custom_description: '',
        description: ''
    });
    const [isOtherCategory, setIsOtherCategory] = useState(false);

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);
        setCurrentUser(user);

        if (user.role !== 'ScrapDealer') {
            navigate('/dashboard');
            return;
        }

        fetchCategories();
    }, [navigate]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            // Always use ALL_SCRAP_TYPES for the dropdown
            setCategories(ALL_SCRAP_TYPES.map((cat, index) => ({
                category_id: `scrap-type-${index}`,
                ...cat
            })));
        } catch (error) {
            console.error('Error setting categories:', error);
            setCategories(ALL_SCRAP_TYPES.map((cat, index) => ({
                category_id: `scrap-type-${index}`,
                ...cat
            })));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Check if 'Others' category is selected
        if (name === 'category_id') {
            const selectedCategory = categories.find(c => c.category_id === value);
            setIsOtherCategory(selectedCategory?.scrap_type === 'Others');
            if (selectedCategory?.scrap_type !== 'Others') {
                setFormData(prev => ({ ...prev, custom_description: '' }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.category_id || !formData.weight) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        if (parseFloat(formData.weight) <= 0) {
            setMessage({ type: 'error', text: 'Weight must be greater than 0.' });
            return;
        }

        if (parseInt(formData.quantity) <= 0) {
            setMessage({ type: 'error', text: 'Quantity must be greater than 0.' });
            return;
        }

        // Check if 'Others' is selected and custom description is provided
        const selectedCategory = categories.find(c => c.category_id === formData.category_id);
        if (selectedCategory?.scrap_type === 'Others' && !formData.custom_description.trim()) {
            setMessage({ type: 'error', text: 'Please provide a description for the custom scrap type.' });
            return;
        }

        try {
            setSubmitting(true);
            setMessage({ type: '', text: '' });

            console.log('Starting submission...', { formData, currentUser });

            const selectedCategory = categories.find(c => c.category_id === formData.category_id);
            let finalCategoryId = null;

            // STEP 1: Check if category exists in database by scrap_type name
            console.log('Checking if category exists:', selectedCategory.scrap_type);
            const { data: existingCategories, error: checkError } = await supabaseClient
                .from('scrap_categories')
                .select('category_id, scrap_type, quantity')
                .eq('scrap_type', selectedCategory.scrap_type);

            if (checkError) {
                console.error('Error checking existing category:', checkError);
                throw new Error(`Failed to check category: ${checkError.message}`);
            }

            const existingCategory = existingCategories && existingCategories.length > 0 ? existingCategories[0] : null;

            if (existingCategory) {
                // Category exists - use its ID and update quantity
                console.log('Category exists:', existingCategory);
                finalCategoryId = existingCategory.category_id;
                
                // Update quantity (add new quantity to existing)
                const newQuantity = (existingCategory.quantity || 0) + parseInt(formData.quantity);
                console.log('Updating category quantity to:', newQuantity);
                
                const { error: updateError } = await supabaseClient
                    .from('scrap_categories')
                    .update({ quantity: newQuantity })
                    .eq('category_id', finalCategoryId);
                
                if (updateError) {
                    console.error('Error updating category quantity:', updateError);
                    throw new Error(`Failed to update category: ${updateError.message}`);
                }
                console.log('Category quantity updated successfully');
            } else {
                // STEP 2: Category doesn't exist - create it with generated UUID
                console.log('Creating new category:', selectedCategory.scrap_type);
                
                // Use user's description input, or custom_description for 'Others', or defaultDescription as fallback
                const categoryDescription = formData.description?.trim() 
                    ? formData.description 
                    : (selectedCategory.scrap_type === 'Others' 
                        ? formData.custom_description 
                        : selectedCategory.defaultDescription);
                
                // Generate UUID for new category
                finalCategoryId = crypto.randomUUID();
                console.log('Generated category_id:', finalCategoryId);
                
                const categoryData = {
                    category_id: finalCategoryId,
                    scrap_type: selectedCategory.scrap_type,
                    description: categoryDescription,
                    quantity: parseInt(formData.quantity)
                };
                console.log('Inserting category data:', categoryData);
                
                const { error: catError } = await supabaseClient
                    .from('scrap_categories')
                    .insert([categoryData]);

                if (catError) {
                    console.error('Category creation error:', catError);
                    throw new Error(`Failed to create category: ${catError.message}`);
                }
                
                console.log('Category created successfully with ID:', finalCategoryId);
            }

            // STEP 3: Insert into scrap_inventory with the category_id
            if (!finalCategoryId) {
                throw new Error('Category ID is missing after creation');
            }

            // Generate UUID for inventory_id
            const inventoryId = crypto.randomUUID();
            
            const inventoryData = {
                inventory_id: inventoryId,
                owner_id: currentUser.user_id,
                category_id: finalCategoryId,
                weight: parseFloat(formData.weight),
                status: formData.status
            };
            console.log('Inserting into scrap_inventory:', inventoryData);

            const { error: inventoryError } = await supabaseClient
                .from('scrap_inventory')
                .insert([inventoryData]);

            if (inventoryError) {
                console.error('Inventory insert error:', inventoryError);
                throw new Error(`Failed to add to inventory: ${inventoryError.message}`);
            }

            console.log('Inventory inserted successfully with ID:', inventoryId);

            // STEP 4: Send notifications to all connected users
            try {
                const dealerName = `${currentUser['First name'] || ''} ${currentUser['Last_Name'] || ''}`.trim() || 'Scrap Dealer';
                const scrapData = {
                    material_type: selectedCategory.scrap_type,
                    category: selectedCategory.scrap_type,
                    quantity: formData.quantity,
                    weight: formData.weight,
                    status: formData.status,
                    description: formData.description || selectedCategory.defaultDescription
                };

                const notificationResult = await sendScrapInventoryNotification(
                    currentUser.user_id,
                    dealerName,
                    scrapData
                );

                if (notificationResult.success) {
                    console.log(`Scrap inventory notifications sent to ${notificationResult.sent || 0} connected users`);
                } else {
                    console.error('Failed to send scrap inventory notifications:', notificationResult.error);
                }
            } catch (notifError) {
                console.error('Error sending scrap inventory notifications:', notifError);
                // Don't block the success message for notification errors
            }

            setMessage({ type: 'success', text: 'Scrap collection added successfully!' });
            setFormData({
                category_id: '',
                weight: '',
                quantity: 1,
                status: 'collected',
                custom_description: '',
                description: ''
            });
            setIsOtherCategory(false);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/scrapDealer');
            }, 2000);

        } catch (error) {
            console.error('Error adding scrap collection:', error);
            setMessage({ 
                type: 'error', 
                text: `Failed to add scrap collection: ${error.message || 'Please try again.'}` 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/scrapDealer');
    };

    const getSelectedCategory = () => {
        return categories.find(c => c.category_id === formData.category_id);
    };

    const getSelectedStatus = () => {
        return STATUS_OPTIONS.find(s => s.value === formData.status);
    };

    return (
        <div className="add-scrap-page">
            <SharedNavbar user={currentUser} />
            <div className="add-scrap-main">
                <div className="add-scrap-container">
                    {/* Header */}
                    <div className="page-header">
                        <button className="back-btn" onClick={handleCancel}>
                            ← Back to Dashboard
                        </button>
                        <h1 className="page-title">Add Scrap Collection</h1>
                        <p className="page-subtitle">Record new scrap materials to your inventory</p>
                    </div>

                    {/* Message Alert */}
                    {message.text && (
                        <div className={`message-alert ${message.type}`}>
                            <span className="message-icon">
                                {message.type === 'success' ? '✅' : '⚠️'}
                            </span>
                            <p>{message.text}</p>
                        </div>
                    )}

                    {/* Form Card */}
                    <div className="form-card">
                        {loading ? (
                            <div className="form-loading">
                                <div className="spinner-small"></div>
                                <p>Loading categories...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="scrap-form">
                                {/* Owner Info */}
                                <div className="form-section owner-section">
                                    <h3 className="form-section-title">👤 Owner Information</h3>
                                    <div className="owner-info">
                                        <div className="owner-avatar">
                                            {currentUser?.["First name"]?.charAt(0)}{currentUser?.["Last_Name"]?.charAt(0)}
                                        </div>
                                        <div className="owner-details">
                                            <p className="owner-name">
                                                {currentUser?.["First name"]} {currentUser?.["Last_Name"]}
                                            </p>
                                            <p className="owner-role">{currentUser?.role}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Scrap Details */}
                                <div className="form-section">
                                    <h3 className="form-section-title">♻️ Scrap Details</h3>

                                    {/* Category Selection */}
                                    <div className="form-group">
                                        <label htmlFor="category_id">
                                            Material Category <span className="required">*</span>
                                        </label>
                                        <select
                                            id="category_id"
                                            name="category_id"
                                            value={formData.category_id}
                                            onChange={handleInputChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(category => (
                                                <option key={category.category_id} value={category.category_id}>
                                                    {category.scrap_type || category.category_name}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Custom Description field for 'Others' */}
                                        {isOtherCategory && (
                                            <div className="form-group custom-description-group">
                                                <label htmlFor="custom_description">
                                                    Custom Description <span className="required">*</span>
                                                </label>
                                                <textarea
                                                    id="custom_description"
                                                    name="custom_description"
                                                    value={formData.custom_description}
                                                    onChange={handleInputChange}
                                                    placeholder="Describe the scrap material (e.g., Glass, Wood, Mixed metals)"
                                                    className="form-textarea"
                                                    rows="3"
                                                    required
                                                />
                                                <p className="help-text">Please describe the type of scrap material</p>
                                            </div>
                                        )}
                                        {getSelectedCategory() && (
                                            <p className="help-text">
                                                Selected: {getSelectedCategory().scrap_type || getSelectedCategory().category_name}
                                                {getSelectedCategory().description && ` - ${getSelectedCategory().description}`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="form-group">
                                        <label htmlFor="quantity">
                                            Quantity <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            id="quantity"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            placeholder="Enter number of items"
                                            min="1"
                                            step="1"
                                            className="form-input"
                                            required
                                        />
                                        <p className="help-text">Enter the number of items/units</p>
                                    </div>

                                    {/* Weight Input */}
                                    <div className="form-group">
                                        <label htmlFor="weight">
                                            Weight (kg) <span className="required">*</span>
                                        </label>
                                        <div className="input-with-unit">
                                            <input
                                                type="number"
                                                id="weight"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleInputChange}
                                                placeholder="Enter weight in kilograms"
                                                min="0.01"
                                                step="0.01"
                                                className="form-input"
                                                required
                                            />
                                            <span className="unit-label">kg</span>
                                        </div>
                                        <p className="help-text">Enter the total weight in kilograms (e.g., 10.5)</p>
                                    </div>

                                    {/* Description Input - User can add additional details */}
                                    <div className="form-group">
                                        <label htmlFor="description">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Add any additional details about this scrap collection (condition, source, etc.)"
                                            className="form-textarea"
                                            rows="3"
                                        />
                                        <p className="help-text">Add any additional details about the scrap material</p>
                                    </div>

                                    {/* Status Selection */}
                                    <div className="form-group">
                                        <label htmlFor="status">
                                            Collection Status <span className="required">*</span>
                                        </label>
                                        <div className="status-options">
                                            {STATUS_OPTIONS.map(status => (
                                                <button
                                                    key={status.value}
                                                    type="button"
                                                    className={`status-btn ${formData.status === status.value ? 'active' : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                                                    style={{
                                                        '--status-color': status.color,
                                                        borderColor: formData.status === status.value ? status.color : 'transparent'
                                                    }}
                                                >
                                                    <span 
                                                        className="status-dot"
                                                        style={{ backgroundColor: status.color }}
                                                    ></span>
                                                    {status.label}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="hidden"
                                            name="status"
                                            value={formData.status}
                                        />
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleCancel}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="btn-spinner"></span>
                                                Adding...
                                            </>
                                        ) : (
                                            <>Scrap
                                                Add Collection
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Quick Stats Preview */}
                    {formData.weight && formData.category_id && (
                        <div className="preview-card">
                            <h3 className="preview-title">📊 Collection Preview</h3>
                            <div className="preview-details">
                                <div className="preview-item">
                                    <span className="preview-label">Material:</span>
                                    <span className="preview-value">{getSelectedCategory()?.scrap_type || getSelectedCategory()?.category_name}</span>
                                </div>
                                <div className="preview-item">
                                    <span className="preview-label">Quantity:</span>
                                    <span className="preview-value">{formData.quantity} items</span>
                                </div>
                                <div className="preview-item">
                                    <span className="preview-label">Weight:</span>
                                    <span className="preview-value">{formData.weight} kg</span>
                                </div>
                                <div className="preview-item">
                                    <span className="preview-label">Status:</span>
                                    <span 
                                        className="preview-value status-badge"
                                        style={{ backgroundColor: getSelectedStatus()?.color + '20', color: getSelectedStatus()?.color }}
                                    >
                                        {getSelectedStatus()?.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddScrapCollection;
