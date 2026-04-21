import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddScrapCollection.css';
import SharedNavbar from '../components/SharedNavbar';
import supabaseClient from '../supabase-config';

const STATUS_OPTIONS = [
    { value: 'collected', label: 'Collected', color: '#4CAF50' },
    { value: 'send_for_recycling', label: 'Send for Recycling', color: '#FF9800' },
    { value: 'recycled', label: 'Recycled', color: '#2196F3' },
    { value: 'upcycled', label: 'Upcycled', color: '#9C27B0' }
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
        status: 'collected'
    });

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
            const { data, error } = await supabaseClient
                .from('scrap_categories')
                .select('*')
                .order('category_name', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setMessage({ type: 'error', text: 'Failed to load categories. Please try again.' });
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

        try {
            setSubmitting(true);
            setMessage({ type: '', text: '' });

            const { error } = await supabaseClient
                .from('scrap_inventory')
                .insert([
                    {
                        owner_id: currentUser.user_id,
                        category_id: formData.category_id,
                        weight: parseFloat(formData.weight),
                        status: formData.status,
                        last_updated: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Scrap collection added successfully!' });
            setFormData({
                category_id: '',
                weight: '',
                status: 'collected'
            });

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/scrap-dealer');
            }, 2000);

        } catch (error) {
            console.error('Error adding scrap collection:', error);
            setMessage({ type: 'error', text: 'Failed to add scrap collection. Please try again.' });
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
                                                    {category.category_name}
                                                </option>
                                            ))}
                                        </select>
                                        {getSelectedCategory() && (
                                            <p className="help-text">
                                                Selected: {getSelectedCategory().category_name}
                                                {getSelectedCategory().description && ` - ${getSelectedCategory().description}`}
                                            </p>
                                        )}
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
                                        <p className="help-text">Enter the weight in kilograms (e.g., 10.5)</p>
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
                                            <>
                                                <span>➕</span>
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
                                    <span className="preview-value">{getSelectedCategory()?.category_name}</span>
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
