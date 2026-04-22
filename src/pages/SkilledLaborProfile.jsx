import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar2 from '../components/Navbar2';
import supabaseClient from '../supabase-config';
import {
    User, MapPin, Home, Hash, Wrench,
    ArrowLeft, Save, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import './DealerProfile.css';

function SkilledLaborProfile() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        address: '',
        city: '',
        state: '',
        pin_code: '',
        skills: ''
    });

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);
        setCurrentUser(user);

        if (user.role !== 'Artisan') {
            navigate('/dashboard');
            return;
        }

        fetchProfile(user.user_id);
    }, [navigate]);

    const fetchProfile = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('skilledlabor_profile')
                .select('*')
                .eq('labor_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            if (data) {
                setFormData({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || '',
                    pin_code: data.pin_code?.toString() || '',
                    skills: data.skills || ''
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            setMessage({ type: 'error', text: 'First Name and Last Name are required.' });
            return;
        }

        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const profileData = {
                labor_id: currentUser.user_id,
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                address: formData.address.trim() || null,
                city: formData.city.trim() || null,
                state: formData.state.trim() || null,
                pin_code: formData.pin_code ? parseInt(formData.pin_code) : null,
                skills: formData.skills.trim() || null
            };

            const { error } = await supabaseClient
                .from('skilledlabor_profile')
                .upsert(profileData, {
                    onConflict: 'labor_id'
                });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile saved successfully!' });

            setTimeout(() => {
                navigate('/artisan');
            }, 1500);

        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: `Failed to save: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/artisan');
    };

    if (loading) {
        return (
            <div className="dealer-profile-page">
                <Navbar2 activeLink="profile" />
                <div className="profile-loading">
                    <Loader2 className="spin-loader" size={40} />
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dealer-profile-page">
            <Navbar2 activeLink="profile" />

            <div className="profile-form-container">
                {/* Header */}
                <div className="profile-form-header">
                    <button className="back-btn" onClick={handleCancel}>
                        <ArrowLeft size={20} />
                        <span>Back to Profile</span>
                    </button>
                    <h1 className="form-title">
                        <Wrench size={28} />
                        Skilled Labor Profile
                    </h1>
                    <p className="form-subtitle">Manage your skilled labor profile information</p>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`form-message ${message.type}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="profile-form">
                    {/* Personal Info Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <User size={20} />
                            </div>
                            <h2>Personal Information</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label htmlFor="first_name">
                                    <User size={16} />
                                    First Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Rajesh"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="last_name">
                                    <User size={16} />
                                    Last Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Sharma"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <MapPin size={20} />
                            </div>
                            <h2>Address</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label htmlFor="address">
                                    <Home size={16} />
                                    Address
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="e.g., 123 Main Street, Andheri East"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="city">
                                    <MapPin size={16} />
                                    City
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g., Mumbai"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="state">
                                    <MapPin size={16} />
                                    State
                                </label>
                                <input
                                    type="text"
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g., Maharashtra"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="pin_code">
                                    <Hash size={16} />
                                    Pin Code
                                </label>
                                <input
                                    type="number"
                                    id="pin_code"
                                    name="pin_code"
                                    value={formData.pin_code}
                                    onChange={handleChange}
                                    placeholder="e.g., 400069"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <Wrench size={20} />
                            </div>
                            <h2>Skills & Expertise</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label htmlFor="skills">
                                    <Wrench size={16} />
                                    Skills
                                </label>
                                <textarea
                                    id="skills"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="Describe your skills and expertise (e.g., Metalworking, Welding, Electrical Repair, Carpentry)"
                                    rows="4"
                                    className="form-textarea"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SkilledLaborProfile;
