import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar2 from '../components/Navbar2';
import supabaseClient from '../supabase-config';
import {
    Building2, Phone, MapPin, Home, Map, Hash,
    ArrowLeft, Save, Loader2, CheckCircle, AlertCircle,
    FileText, Calendar, Clock, Globe, Link2, Share2
} from 'lucide-react';
import './DealerProfile.css';

function DealerProfile() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        business_name: '',
        contact_number: '',
        Area: '',
        City: '',
        State: '',
        pincode: '',
        business_description: '',
        established_year: '',
        working_hours: '',
        facebook: '',
        instagram: '',
        twitter: ''
    });

    const [originalData, setOriginalData] = useState(null);

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

        fetchProfile(user.user_id);
    }, [navigate]);

    const fetchProfile = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('scrapdealer_profile')
                .select('*')
                .eq('dealer_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            if (data) {
                setFormData({
                    business_name: data.business_name || '',
                    contact_number: data.contact_number || '',
                    Area: data.Area || '',
                    City: data.City || '',
                    State: data.State || '',
                    pincode: data.pincode || '',
                    business_description: data.business_description || '',
                    established_year: data.established_year || '',
                    working_hours: data.working_hours || '',
                    facebook: data.facebook || '',
                    instagram: data.instagram || '',
                    twitter: data.twitter || ''
                });
                setOriginalData(data);
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

        if (!formData.business_name.trim() || !formData.contact_number.trim()) {
            setMessage({ type: 'error', text: 'Business Name and Contact Number are required.' });
            return;
        }

        try {
            setSaving(true);
            setMessage({ type: '', text: '' });

            const profileData = {
                dealer_id: currentUser.user_id,
                business_name: formData.business_name.trim(),
                contact_number: formData.contact_number.trim(),
                Area: formData.Area.trim() || null,
                City: formData.City.trim() || null,
                State: formData.State.trim() || null,
                pincode: formData.pincode.trim() || null,
                business_description: formData.business_description.trim() || null,
                established_year: formData.established_year.trim() || null,
                working_hours: formData.working_hours.trim() || null,
                facebook: formData.facebook.trim() || null,
                instagram: formData.instagram.trim() || null,
                twitter: formData.twitter.trim() || null
            };

            const { error } = await supabaseClient
                .from('scrapdealer_profile')
                .upsert(profileData, {
                    onConflict: 'dealer_id'
                });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Profile saved successfully!' });
            setOriginalData(profileData);

            setTimeout(() => {
                navigate('/scrapdealer');
            }, 1500);

        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: `Failed to save: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/scrapdealer');
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
                        <Building2 size={28} />
                        Business Profile
                    </h1>
                    <p className="form-subtitle">Manage your scrap dealing business information</p>
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
                    {/* Business Info Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <Building2 size={20} />
                            </div>
                            <h2>Business Information</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label htmlFor="business_name">
                                    <Building2 size={16} />
                                    Business Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="business_name"
                                    name="business_name"
                                    value={formData.business_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Mumbai Metal Recyclers"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="contact_number">
                                    <Phone size={16} />
                                    Contact Number <span className="required">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="contact_number"
                                    name="contact_number"
                                    value={formData.contact_number}
                                    onChange={handleChange}
                                    placeholder="e.g., +91 98765 43210"
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
                            <h2>Business Address</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label htmlFor="Area">
                                    <Home size={16} />
                                    Area / Street
                                </label>
                                <input
                                    type="text"
                                    id="Area"
                                    name="Area"
                                    value={formData.Area}
                                    onChange={handleChange}
                                    placeholder="e.g., Andheri East, Near Metro Station"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="City">
                                    <Map size={16} />
                                    City
                                </label>
                                <input
                                    type="text"
                                    id="City"
                                    name="City"
                                    value={formData.City}
                                    onChange={handleChange}
                                    placeholder="e.g., Mumbai"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="State">
                                    <MapPin size={16} />
                                    State
                                </label>
                                <input
                                    type="text"
                                    id="State"
                                    name="State"
                                    value={formData.State}
                                    onChange={handleChange}
                                    placeholder="e.g., Maharashtra"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="pincode">
                                    <Hash size={16} />
                                    Pincode
                                </label>
                                <input
                                    type="text"
                                    id="pincode"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="e.g., 400069"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Business Details */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FileText size={20} />
                            </div>
                            <h2>Business Details</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field full-width">
                                <label htmlFor="business_description">
                                    <FileText size={16} />
                                    Business Description
                                </label>
                                <textarea
                                    id="business_description"
                                    name="business_description"
                                    value={formData.business_description}
                                    onChange={handleChange}
                                    placeholder="Describe your scrap business, services offered, specialties, etc."
                                    rows="4"
                                    className="form-textarea"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="established_year">
                                    <Calendar size={16} />
                                    Established Year
                                </label>
                                <input
                                    type="text"
                                    id="established_year"
                                    name="established_year"
                                    value={formData.established_year}
                                    onChange={handleChange}
                                    placeholder="e.g., 2015"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="working_hours">
                                    <Clock size={16} />
                                    Working Hours
                                </label>
                                <input
                                    type="text"
                                    id="working_hours"
                                    name="working_hours"
                                    value={formData.working_hours}
                                    onChange={handleChange}
                                    placeholder="e.g., Mon-Sat: 9AM - 7PM"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <Share2 size={20} />
                            </div>
                            <h2>Social Media</h2>
                        </div>

                        <div className="form-grid">
                            <div className="form-field">
                                <label htmlFor="facebook">
                                    <Globe size={16} />
                                    Facebook
                                </label>
                                <input
                                    type="url"
                                    id="facebook"
                                    name="facebook"
                                    value={formData.facebook}
                                    onChange={handleChange}
                                    placeholder="https://facebook.com/yourbusiness"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="instagram">
                                    <Link2 size={16} />
                                    Instagram
                                </label>
                                <input
                                    type="url"
                                    id="instagram"
                                    name="instagram"
                                    value={formData.instagram}
                                    onChange={handleChange}
                                    placeholder="https://instagram.com/yourbusiness"
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="twitter">
                                    <Link2 size={16} />
                                    Twitter
                                </label>
                                <input
                                    type="url"
                                    id="twitter"
                                    name="twitter"
                                    value={formData.twitter}
                                    onChange={handleChange}
                                    placeholder="https://twitter.com/yourbusiness"
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

export default DealerProfile;
