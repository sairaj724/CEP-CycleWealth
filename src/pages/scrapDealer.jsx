import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedNavbar from '../components/SharedNavbar';
import supabaseClient from '../supabase-config';
import {
    Briefcase,
    MapPin,
    Recycle,
    Factory,
    BadgeCheck,
    IndianRupee,
    ArrowRight,
    Building2,
    User,
    ExternalLink,
    MapPinOff,
    Landmark,
    Navigation,
    Home,
    LocateFixed
} from 'lucide-react';
import './scrapDealer.css';

function ScrapDealer() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('companies');
    const [profile, setProfile] = useState({
        businessName: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        description: '',
        services: [],
        workingHours: '',
        establishedYear: '',
        website: '',
        socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: ''
        },
        certifications: [],
        specialties: '',
        pickupRadius: '',
        minimumWeight: '',
        paymentMethods: [],
        latitude: null,
        longitude: null,
        stats: {
            connections: 0,
            experience: 0,
            annualVolume: 0,
            partners: 0
        },
        partners: {
            companies: [],
            artisans: [],
            suppliers: []
        },
        experience: [],
        materials: [],
        recommendations: []
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Available services and payment methods
    const availableServices = [
        'Metal Scrap Collection',
        'Plastic Recycling',
        'Paper Recycling',
        'E-Waste Collection',
        'Battery Recycling',
        'Wood Recycling',
        'Glass Recycling',
        'Textile Recycling',
        'Industrial Waste',
        'Construction Debris'
    ];

    const paymentMethodsOptions = [
        'Cash',
        'Bank Transfer',
        'UPI',
        'Paytm',
        'Google Pay',
        'PhonePe',
        'Cheque',
        'Credit/Debit Card'
    ];

    const certificationOptions = [
        'ISO 14001',
        'ISO 9001',
        'R2 Certification',
        'e-Stewards',
        'WEEE Compliance',
        'RoHS Compliance',
        'Local Municipal License',
        'Environmental Clearance'
    ];

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

            // Get basic user info
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (userError) throw userError;

            // Get extended profile info
            const { data: profileData, error: profileError } = await supabaseClient
                .from('scrap_dealer_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            const combinedProfile = {
                businessName: userData["First name"] + " " + userData["Last_Name"],
                firstName: userData["First name"] || '',
                lastName: userData["Last_Name"] || '',
                email: userData.email_address || '',
                phone: userData.phone || '',
                latitude: userData.latitude,
                longitude: userData.longitude,
                ...profileData
            };

            setProfile(combinedProfile);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setProfile(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setProfile(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleServiceToggle = (service) => {
        setProfile(prev => ({
            ...prev,
            services: prev.services.includes(service)
                ? prev.services.filter(s => s !== service)
                : [...prev.services, service]
        }));
    };

    const handlePaymentMethodToggle = (method) => {
        setProfile(prev => ({
            ...prev,
            paymentMethods: prev.paymentMethods.includes(method)
                ? prev.paymentMethods.filter(m => m !== method)
                : [...prev.paymentMethods, method]
        }));
    };

    const handleCertificationToggle = (certification) => {
        setProfile(prev => ({
            ...prev,
            certifications: prev.certifications.includes(certification)
                ? prev.certifications.filter(c => c !== certification)
                : [...prev.certifications, certification]
        }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            // Update basic user info
            const { error: userError } = await supabaseClient
                .from('users')
                .update({
                    phone: profile.phone,
                    latitude: profile.latitude,
                    longitude: profile.longitude
                })
                .eq('user_id', currentUser.user_id);

            if (userError) throw userError;

            // Update extended profile
            const profileData = {
                user_id: currentUser.user_id,
                business_name: profile.businessName,
                address: profile.address,
                city: profile.city,
                state: profile.state,
                zip_code: profile.zipCode,
                description: profile.description,
                services: profile.services,
                working_hours: profile.workingHours,
                established_year: profile.establishedYear,
                website: profile.website,
                social_media: profile.socialMedia,
                certifications: profile.certifications,
                specialties: profile.specialties,
                pickup_radius: profile.pickupRadius,
                minimum_weight: profile.minimumWeight,
                payment_methods: profile.paymentMethods,
                updated_at: new Date().toISOString()
            };

            const { error: profileError } = await supabaseClient
                .from('scrap_dealer_profiles')
                .upsert(profileData, {
                    onConflict: 'user_id'
                });

            if (profileError) throw profileError;

            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving profile:', error);
            setError('Failed to save profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        fetchProfile(currentUser.user_id);
        setIsEditing(false);
        setError('');
        setSuccess('');
    };

    if (loading) {
        return (
            <div className="profile-page">
                <SharedNavbar activeLink="profile" />
                <div className="profile-loading">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <SharedNavbar activeLink="profile" />
            <div className="profile-container">
                
                {/* Profile Header Card */}
                <div className="profile-header-card">
                    <div className="profile-cover">
                        <div className="profile-avatar-large">
                            {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                        </div>
                    </div>
                    <div className="profile-info-section">
                        <div className="profile-main-info">
                            <div>
                                <h1 className="profile-name">{profile.firstName} {profile.lastName}</h1>
                                <p className="profile-title">
                                    <Briefcase size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Founder & Proprietor - {profile.businessName}
                                </p>
                                <p className="profile-location">
                                    <MapPin size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    {profile.address}, {profile.city}, {profile.state}
                                </p>
                                <div className="profile-badges">
                                    <span className="badge badge-green">
                                        <Recycle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        Metal Recycler
                                    </span>
                                    <span className="badge badge-blue">
                                        <Factory size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        Industrial Scrap
                                    </span>
                                    <span className="badge badge-yellow">
                                        <BadgeCheck size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                        Verified Dealer
                                    </span>
                                </div>
                            </div>
                            <div className="profile-actions">
                                {!isEditing ? (
                                    <div className="action-buttons">
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit Profile
                                        </button>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => navigate('/add-scrap')}
                                        >
                                            + Add Collection
                                        </button>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={() => navigate('/view-inventory')}
                                        >
                                            View Inventory
                                        </button>
                                    </div>
                                ) : (
                                    <div className="edit-actions">
                                        <button 
                                            className="btn btn-success"
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                        <button 
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="stats-row">
                            <div className="stat-box">
                                <div className="stat-num">{profile.stats?.connections || 0}+</div>
                                <div className="stat-lbl">Connections</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-num">{profile.stats?.experience || 0} yrs</div>
                                <div className="stat-lbl">Experience</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-num" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                    <IndianRupee size={18} />
                                    {profile.stats?.annualVolume || 0}Cr
                                </div>
                                <div className="stat-lbl">Annual Volume</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-num">{profile.stats?.partners || 0}</div>
                                <div className="stat-lbl">Partners</div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="profile-content">
                    {/* About Section */}
                    <div className="card">
                        <p className="section-title">About</p>
                        {isEditing ? (
                            <textarea
                                name="description"
                                value={profile.description}
                                onChange={handleInputChange}
                                className="form-textarea"
                                rows="4"
                                placeholder="Describe your business, services, and what makes you unique..."
                            />
                        ) : (
                            <>
                                <p className="about-text">
                                    {profile.description || 'No description provided yet. Add details about your business, services, and expertise.'}
                                </p>
                                {profile.establishedYear && (
                                    <p className="about-text">
                                        Member of <strong>Maharashtra Recyclers Association</strong> since {profile.establishedYear}.
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Partners Section */}
                    <div className="card">
                        <div className="tabs-container">
                            <div 
                                className={`tab ${activeTab === 'companies' ? 'active' : ''}`}
                                onClick={() => setActiveTab('companies')}
                            >
                                Corporate partners
                            </div>
                            <div 
                                className={`tab ${activeTab === 'artisans' ? 'active' : ''}`}
                                onClick={() => setActiveTab('artisans')}
                            >
                                Skilled artisans
                            </div>
                            <div 
                                className={`tab ${activeTab === 'suppliers' ? 'active' : ''}`}
                                onClick={() => setActiveTab('suppliers')}
                            >
                                Suppliers
                            </div>
                        </div>

                        {activeTab === 'companies' && (
                            <div className="connections-list">
                                {profile.partners?.companies?.length > 0 ? (
                                    profile.partners.companies.map((partner, index) => (
                                        <div key={index} className="connection-card">
                                            <div className="avatar-small">
                                                {partner.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="connection-info">
                                                <p className="connection-name">{partner.name}</p>
                                                <p className="connection-desc">{partner.description}</p>
                                            </div>
                                            <span className={`badge ${partner.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections">No corporate partners added yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'artisans' && (
                            <div className="connections-list">
                                {profile.partners?.artisans?.length > 0 ? (
                                    profile.partners.artisans.map((partner, index) => (
                                        <div key={index} className="connection-card">
                                            <div className="avatar-small">
                                                {partner.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="connection-info">
                                                <p className="connection-name">{partner.name}</p>
                                                <p className="connection-desc">{partner.description}</p>
                                            </div>
                                            <span className={`badge ${partner.status === 'Regular buyer' ? 'badge-success' : 'badge-warning'}`}>
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections">No artisan partners added yet.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'suppliers' && (
                            <div className="connections-list">
                                {profile.partners?.suppliers?.length > 0 ? (
                                    profile.partners.suppliers.map((partner, index) => (
                                        <div key={index} className="connection-card">
                                            <div className="avatar-small">
                                                {partner.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="connection-info">
                                                <p className="connection-name">{partner.name}</p>
                                                <p className="connection-desc">{partner.description}</p>
                                            </div>
                                            <span className={`badge ${partner.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                                                {partner.status}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-connections">No suppliers added yet.</p>
                                )}
                            </div>
                        )}

                        <button className="view-all-btn">
                            View all connections <ArrowRight size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </button>
                    </div>

                    {/* Experience Section */}
                    <div className="card">
                        <p className="section-title">Experience</p>
                        <div className="experience-list">
                            {profile.experience?.length > 0 ? (
                                profile.experience.map((exp, index) => (
                                    <div key={index} className="experience-row">
                                        <div className="exp-icon">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="exp-details">
                                            <p className="exp-title">{exp.title}</p>
                                            <p className="exp-company">{exp.company} - {exp.period}</p>
                                            <p className="exp-description">{exp.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="experience-row">
                                    <div className="exp-icon">
                                        <Building2 size={20} />
                                    </div>
                                    <div className="exp-details">
                                        <p className="exp-title">Founder & Proprietor</p>
                                        <p className="exp-company">{profile.businessName} - {profile.establishedYear || 'Present'} - present</p>
                                        <p className="exp-description">
                                            Managing end-to-end scrap operations - sourcing, sorting, weighing, and reselling ferrous, non-ferrous, and e-waste materials.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Materials Section */}
                    <div className="card">
                        <p className="section-title">Materials dealt in</p>
                        <div className="materials-grid">
                            {profile.materials?.length > 0 ? (
                                profile.materials.map((material, index) => (
                                    <span key={index} className="pill">{material}</span>
                                ))
                            ) : (
                                <>
                                    <span className="pill">Steel & Iron</span>
                                    <span className="pill">Copper</span>
                                    <span className="pill">Brass</span>
                                    <span className="pill">Aluminium</span>
                                    <span className="pill">Stainless Steel</span>
                                    <span className="pill">E-waste / PCBs</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Recommendations Section */}
                    <div className="card">
                        <p className="section-title">Recommendations</p>
                        <div className="recommendations-list">
                            {profile.recommendations?.length > 0 ? (
                                profile.recommendations.map((rec, index) => (
                                    <div key={index} className="recommendation">
                                        <p className="recommendation-text">"{rec.text}"</p>
                                        <p className="recommendation-author">
                                            <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                            {rec.author}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="recommendation">
                                        <p className="recommendation-text">"Fair pricing and reliable service. Always on time with pickups."</p>
                                        <p className="recommendation-author">
                                            <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                            Happy Customer
                                        </p>
                                    </div>
                                    <div className="recommendation">
                                        <p className="recommendation-text">"Best source for quality scrap materials in the area."</p>
                                        <p className="recommendation-author">
                                            <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                            Regular Client
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <button className="view-all-btn">
                            Write a recommendation <ArrowRight size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                        </button>
                    </div>

                    {/* Business Address */}
                    <div className="card">
                        <div className="address-header">
                            <p className="section-title">
                                <MapPin size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Business Address
                            </p>
                            {!isEditing && (profile.address || profile.city) && (
                                <button className="view-all-btn" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(`${profile.address}, ${profile.city}, ${profile.state}`)}`, '_blank')}>
                                    View on Map <ExternalLink size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                                </button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <div className="address-form">
                                <div className="address-input-group">
                                    <div className="input-icon"><Home size={20} /></div>
                                    <input
                                        type="text"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleInputChange}
                                        className="form-input address-input"
                                        placeholder="Street Address"
                                    />
                                </div>
                                <div className="address-row">
                                    <div className="address-input-group">
                                        <div className="input-icon"><Building2 size={20} /></div>
                                        <input
                                            type="text"
                                            name="city"
                                            value={profile.city}
                                            onChange={handleInputChange}
                                            className="form-input address-input"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="address-input-group">
                                        <div className="input-icon"><Landmark size={20} /></div>
                                        <input
                                            type="text"
                                            name="state"
                                            value={profile.state}
                                            onChange={handleInputChange}
                                            className="form-input address-input"
                                            placeholder="State"
                                        />
                                    </div>
                                </div>
                                <div className="address-input-group">
                                    <div className="input-icon"><LocateFixed size={20} /></div>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={profile.zipCode}
                                        onChange={handleInputChange}
                                        className="form-input address-input"
                                        placeholder="ZIP Code"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="address-display">
                                {profile.address && (
                                    <div className="address-item">
                                        <div className="address-icon"><Home size={20} /></div>
                                        <p className="address-text">{profile.address}</p>
                                    </div>
                                )}
                                {(profile.city || profile.state || profile.zipCode) && (
                                    <div className="address-item">
                                        <div className="address-icon"><MapPin size={20} /></div>
                                        <p className="address-text">
                                            {[profile.city, profile.state, profile.zipCode].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                )}
                                {!profile.address && !profile.city && !profile.state && !profile.zipCode && (
                                    <div className="address-empty">
                                        <div className="empty-icon"><MapPinOff size={28} /></div>
                                        <p className="empty-text">No business address provided yet</p>
                                        <p className="empty-subtext">Add your address to help customers find you</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Business Details */}
                    <div className="profile-section">
                        <h2 className="section-title">Business Details</h2>
                        <div className="info-grid">
                            <div className="info-group full-width">
                                <label>Business Description</label>
                                {isEditing ? (
                                    <textarea
                                        name="description"
                                        value={profile.description}
                                        onChange={handleInputChange}
                                        className="form-textarea"
                                        rows="4"
                                        placeholder="Describe your business, services, and what makes you unique..."
                                    />
                                ) : (
                                    <p>{profile.description || 'No description provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Established Year</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="establishedYear"
                                        value={profile.establishedYear}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="1900"
                                        max={new Date().getFullYear()}
                                    />
                                ) : (
                                    <p>{profile.establishedYear || 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Working Hours</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="workingHours"
                                        value={profile.workingHours}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="e.g., Mon-Fri: 9AM-6PM, Sat: 9AM-1PM"
                                    />
                                ) : (
                                    <p>{profile.workingHours || 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Website</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        name="website"
                                        value={profile.website}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://yourwebsite.com"
                                    />
                                ) : (
                                    <p>{profile.website ? <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a> : 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="profile-section">
                        <h2 className="section-title">Services Offered</h2>
                        <div className="services-grid">
                            {availableServices.map(service => (
                                <div key={service} className="service-item">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={profile.services?.includes(service) || false}
                                            onChange={() => handleServiceToggle(service)}
                                            disabled={!isEditing}
                                        />
                                        <span className="checkmark"></span>
                                        {service}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Specialties */}
                    <div className="profile-section">
                        <h2 className="section-title">Specialties & Expertise</h2>
                        <div className="info-group full-width">
                            {isEditing ? (
                                <textarea
                                    name="specialties"
                                    value={profile.specialties}
                                    onChange={handleInputChange}
                                    className="form-textarea"
                                    rows="3"
                                    placeholder="Describe your specialties, expertise, and unique selling points..."
                                />
                            ) : (
                                <p>{profile.specialties || 'No specialties specified'}</p>
                            )}
                        </div>
                    </div>

                    {/* Service Area */}
                    <div className="profile-section">
                        <h2 className="section-title">Service Area & Requirements</h2>
                        <div className="info-grid">
                            <div className="info-group">
                                <label>Pickup Radius (km)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="pickupRadius"
                                        value={profile.pickupRadius}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="1"
                                        placeholder="e.g., 25"
                                    />
                                ) : (
                                    <p>{profile.pickupRadius ? `${profile.pickupRadius} km` : 'Not specified'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Minimum Weight (kg)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="minimumWeight"
                                        value={profile.minimumWeight}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        min="1"
                                        placeholder="e.g., 10"
                                    />
                                ) : (
                                    <p>{profile.minimumWeight ? `${profile.minimumWeight} kg` : 'Not specified'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="profile-section">
                        <h2 className="section-title">Social Media</h2>
                        <div className="info-grid">
                            <div className="info-group">
                                <label>Facebook</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        name="socialMedia.facebook"
                                        value={profile.socialMedia?.facebook || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://facebook.com/yourpage"
                                    />
                                ) : (
                                    <p>{profile.socialMedia?.facebook ? <a href={profile.socialMedia.facebook} target="_blank" rel="noopener noreferrer">View Profile</a> : 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Instagram</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        name="socialMedia.instagram"
                                        value={profile.socialMedia?.instagram || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://instagram.com/yourprofile"
                                    />
                                ) : (
                                    <p>{profile.socialMedia?.instagram ? <a href={profile.socialMedia.instagram} target="_blank" rel="noopener noreferrer">View Profile</a> : 'Not provided'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Twitter</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        name="socialMedia.twitter"
                                        value={profile.socialMedia?.twitter || ''}
                                        onChange={handleInputChange}
                                        className="form-input"
                                        placeholder="https://twitter.com/yourhandle"
                                    />
                                ) : (
                                    <p>{profile.socialMedia?.twitter ? <a href={profile.socialMedia.twitter} target="_blank" rel="noopener noreferrer">View Profile</a> : 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScrapDealer;