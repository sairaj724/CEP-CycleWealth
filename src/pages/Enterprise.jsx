import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SharedNavbar from "../components/SharedNavbar";
import Footer from "../components/Footer";
import { createOrGetIndustryProfile, getIndustryProfile, updateIndustryProfile, getPlatformStats, getIndustryOrder } from "../services/enterpriseService";
import "./Enterprise.css";

function Enterprise() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        verifiedDealers: 0,
        enterprisePartners: 0,
        totalScrapTons: 0,
        totalTransactions: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [orderLoading, setOrderLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        companySize: '',
        industryType: '',
        budgetRange: ''
    });

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            try {
                const parsedUser = JSON.parse(sessionUser);
                setUser(parsedUser);
                checkExistingRegistration();
            } catch (e) {
                console.error('Error parsing user from session:', e);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }

        // Fetch platform statistics
        fetchPlatformStats();
        
        // Set up periodic refresh of order status every 30 seconds
        const intervalId = setInterval(() => {
            if (isRegistered) {
                fetchCurrentOrder();
            }
        }, 30000);
        
        return () => clearInterval(intervalId);
    }, [navigate, isRegistered]);

    const fetchPlatformStats = async () => {
        setStatsLoading(true);
        try {
            const platformStats = await getPlatformStats();
            setStats(platformStats);
        } catch (err) {
            console.error('Error fetching platform stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const checkExistingRegistration = async () => {
        try {
            const profileData = await getIndustryProfile();
            if (profileData) {
                setIsRegistered(true);
                setProfile(profileData);
                sessionStorage.setItem('enterpriseRegistered', 'true');
                
                // Pre-fill form data for editing (using DB field names)
                setFormData({
                    companyName: profileData.company_name || '',
                    contactPerson: profileData['Contact_person'] || '',
                    email: profileData.email_address || '',
                    phone: profileData.phone_no || '',
                    companySize: profileData.company_size || '',
                    industryType: profileData.industry_type || '',
                    budgetRange: profileData['Budget'] || ''
                });
                
                // Fetch current order status
                fetchCurrentOrder();
            }
        } catch (err) {
            console.error('Error checking registration:', err);
        }
    };
    
    const fetchCurrentOrder = async () => {
        setOrderLoading(true);
        try {
            const order = await getIndustryOrder();
            setCurrentOrder(order);
        } catch (err) {
            console.error('Error fetching order:', err);
        } finally {
            setOrderLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await updateIndustryProfile(formData);
            const updatedProfile = await getIndustryProfile();
            setProfile(updatedProfile);
            setEditMode(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Update failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createOrGetIndustryProfile(formData);
            
            sessionStorage.setItem('enterpriseRegistered', 'true');
            setIsRegistered(true);
            
            alert('Registration successful! You can now place scrap orders.');
            setFormData({
                companyName: '',
                contactPerson: '',
                email: '',
                phone: '',
                companySize: '',
                industryType: '',
                budgetRange: ''
            });
        } catch (err) {
            console.error('Error registering enterprise:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SharedNavbar user={user} activeLink="enterprise" />
            
            {/* Hero Section */}
            <div className="enterprise-hero">
                <div className="enterprise-hero-content">
                    <h1>Enterprise Scrap Solutions</h1>
                    <p>Connect with verified scrap dealers for sustainable business growth</p>
                    <div className="enterprise-hero-buttons">
                        {isRegistered ? (
                            <button className="primary" onClick={() => navigate('/companyorder')}>Place Order</button>
                        ) : (
                            <button className="primary" onClick={() => document.getElementById('registration-form').scrollIntoView({ behavior: 'smooth' })}>
                                Register Now
                            </button>
                        )}
                        <button className="secondary">Learn More</button>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="enterprise-benefits">
                <h2>Why Partner with Our Scrap Dealers?</h2>
                <div className="benefits-grid">
                    <div className="benefit-card">
                        <div className="benefit-icon">💰</div>
                        <h3>Cost-Effective Sourcing</h3>
                        <p>Get competitive pricing on bulk scrap materials, reducing your operational costs by up to 40%</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">🤝</div>
                        <h3>Verified Partners</h3>
                        <p>All our dealers are background-checked and verified for quality and reliability</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">🌍</div>
                        <h3>Sustainable Impact</h3>
                        <p>Contribute to circular economy while meeting your ESG goals</p>
                    </div>
                    <div className="benefit-card">
                        <div className="benefit-icon">📊</div>
                        <h3>Analytics Dashboard</h3>
                        <p>Track your scrap procurement, savings, and environmental impact in real-time</p>
                    </div>
                </div>
            </div>

            {/* Process Section */}
            <div className="enterprise-process">
                <h2>How It Works</h2>
                <p className="process-subtitle">Get started in 4 simple steps</p>
                <div className="process-timeline">
                    <div className="timeline-line"></div>
                    <div className="process-step">
                        <div className="step-icon">📝</div>
                        <div className="step-content">
                            <span className="step-number">01</span>
                            <h3>Register</h3>
                            <p>Create your enterprise account and complete your business profile verification</p>
                        </div>
                    </div>
                    <div className="process-step">
                        <div className="step-icon">📋</div>
                        <div className="step-content">
                            <span className="step-number">02</span>
                            <h3>Post Requirements</h3>
                            <p>Specify scrap material types, quantities needed, and your budget range</p>
                        </div>
                    </div>
                    <div className="process-step">
                        <div className="step-icon">🤝</div>
                        <div className="step-content">
                            <span className="step-number">03</span>
                            <h3>Get Connected</h3>
                            <p>Receive matches with verified scrap dealers in your area</p>
                        </div>
                    </div>
                    <div className="process-step">
                        <div className="step-icon">✅</div>
                        <div className="step-content">
                            <span className="step-number">04</span>
                            <h3>Close Deals</h3>
                            <p>Negotiate terms and complete secure transactions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="enterprise-stats">
                <div className="stats-container">
                    <div className="stat">
                        <h3>{statsLoading ? '...' : `${stats.verifiedDealers}+`}</h3>
                        <p>Verified Dealers</p>
                    </div>
                    <div className="stat">
                        <h3>{statsLoading ? '...' : `${stats.totalScrapTons.toLocaleString()}+`}</h3>
                        <p>Tons of Scrap Processed</p>
                    </div>
                    <div className="stat">
                        <h3>{statsLoading ? '...' : `${stats.enterprisePartners}+`}</h3>
                        <p>Enterprise Partners</p>
                    </div>
                    <div className="stat">
                        <h3>{statsLoading ? '...' : `₹${(stats.totalTransactions / 10000000).toFixed(1)}Cr+`}</h3>
                        <p>Monthly Transactions</p>
                    </div>
                </div>
            </div>

            {/* CTA Form Section */}
            <div id="registration-form" className="enterprise-cta">
                {!isRegistered ? (
                    <>
                        <h2>Start Your Sustainable Journey</h2>
                        <p>Fill in your details and our enterprise team will reach out within 24 hours</p>
                        
                        {error && (
                            <div className="error-banner" style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        
                        <form className="enterprise-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company Name*</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Person*</label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address*</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number*</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company Size*</label>
                                    <select name="companySize" value={formData.companySize} onChange={handleInputChange} required>
                                        <option value="">Select Size</option>
                                        <option value="startup">Startup (1-50 employees)</option>
                                        <option value="small">Small (51-200 employees)</option>
                                        <option value="medium">Medium (201-1000 employees)</option>
                                        <option value="large">Large (1000+ employees)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Industry Type*</label>
                                    <select name="industryType" value={formData.industryType} onChange={handleInputChange} required>
                                        <option value="">Select Industry</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="construction">Construction</option>
                                        <option value="automotive">Automotive</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="textile">Textile</option>
                                        <option value="packaging">Packaging</option>
                                        <option value="renewable-energy">Renewable Energy</option>
                                        <option value="waste-management">Waste Management</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Budget Range (Monthly)*</label>
                                    <select name="budgetRange" value={formData.budgetRange} onChange={handleInputChange} required>
                                        <option value="">Select Budget</option>
                                        <option value="50k-1lakh">₹50,000 - ₹1,00,000</option>
                                        <option value="1lakh-5lakh">₹1,00,000 - ₹5,00,000</option>
                                        <option value="5lakh-10lakh">₹5,00,000 - ₹10,00,000</option>
                                        <option value="10lakh+">₹10,00,000+</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    {/* Empty placeholder for alignment */}
                                </div>
                            </div>
                            
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </form>
                    </>
                ) : editMode ? (
                    <>
                        <h2>Edit Your Profile</h2>
                        <p>Update your enterprise details</p>
                        
                        {error && (
                            <div className="error-banner" style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        
                        <form className="enterprise-form" onSubmit={handleUpdate}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company Name*</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Person*</label>
                                    <input
                                        type="text"
                                        name="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email Address*</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number*</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company Size*</label>
                                    <select name="companySize" value={formData.companySize} onChange={handleInputChange} required>
                                        <option value="">Select Size</option>
                                        <option value="startup">Startup (1-50 employees)</option>
                                        <option value="small">Small (51-200 employees)</option>
                                        <option value="medium">Medium (201-1000 employees)</option>
                                        <option value="large">Large (1000+ employees)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Industry Type*</label>
                                    <select name="industryType" value={formData.industryType} onChange={handleInputChange} required>
                                        <option value="">Select Industry</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="construction">Construction</option>
                                        <option value="automotive">Automotive</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="textile">Textile</option>
                                        <option value="packaging">Packaging</option>
                                        <option value="renewable-energy">Renewable Energy</option>
                                        <option value="waste-management">Waste Management</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Budget Range (Monthly)*</label>
                                    <select name="budgetRange" value={formData.budgetRange} onChange={handleInputChange} required>
                                        <option value="">Select Budget</option>
                                        <option value="50k-1lakh">₹50,000 - ₹1,00,000</option>
                                        <option value="1lakh-5lakh">₹1,00,000 - ₹5,00,000</option>
                                        <option value="5lakh-10lakh">₹5,00,000 - ₹10,00,000</option>
                                        <option value="10lakh+">₹10,00,000+</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    {/* Empty placeholder for alignment */}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="submit-btn" style={{ background: '#6b7280' }} onClick={() => setEditMode(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="registration-success">
                        <div className="success-icon">✓</div>
                        <h2>Welcome, {profile?.company_name}!</h2>
                        <div style={{ textAlign: 'left', maxWidth: '500px', margin: '2rem auto', background: '#f3f4f6', padding: '1.5rem', borderRadius: '8px' }}>
                            <p><strong>Contact:</strong> {profile?.['Contact_person']}</p>
                            <p><strong>Email:</strong> {profile?.email_address}</p>
                            <p><strong>Phone:</strong> {profile?.phone_no}</p>
                            <p><strong>Industry:</strong> {profile?.industry_type}</p>
                            <p><strong>Company Size:</strong> {profile?.company_size}</p>
                            <p><strong>Budget:</strong> ₹{profile?.['Budget']}</p>
                        </div>
                        
                        {/* Current Order Status Section */}
                        {orderLoading ? (
                            <div style={{ margin: '1rem 0', color: '#6b7280' }}>Loading order status...</div>
                        ) : currentOrder ? (
                            <div style={{ 
                                textAlign: 'left', 
                                maxWidth: '500px', 
                                margin: '1rem auto 2rem', 
                                background: currentOrder.status === 'accepted' ? '#dcfce7' : '#fef3c7', 
                                padding: '1.5rem', 
                                borderRadius: '8px',
                                border: `2px solid ${currentOrder.status === 'accepted' ? '#16a34a' : '#f59e0b'}`
                            }}>
                                <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>
                                    {currentOrder.status === 'accepted' ? '✓ Order Accepted' : '⏳ Order Pending'}
                                </h3>
                                <p><strong>Material:</strong> {currentOrder.material_type}</p>
                                <p><strong>Quantity:</strong> {currentOrder.quantity}</p>
                                <p><strong>Price:</strong> ₹{currentOrder.price || 'Negotiable'}/unit</p>
                                {currentOrder.final_price && (
                                    <p><strong>Final Price:</strong> ₹{currentOrder.final_price}/unit</p>
                                )}
                                <p><strong>Delivery:</strong> {currentOrder['City']} - {currentOrder['Prefered_Delivery_Date']}</p>
                                {currentOrder.status === 'accepted' && (
                                    <p style={{ color: '#16a34a', fontWeight: '600', marginTop: '0.5rem' }}>
                                        ✓ A scrap dealer has accepted your order!
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ 
                                textAlign: 'center', 
                                maxWidth: '500px', 
                                margin: '1rem auto 2rem', 
                                background: '#f3f4f6', 
                                padding: '1.5rem', 
                                borderRadius: '8px',
                                color: '#6b7280'
                            }}>
                                <p>No active order. Click "Place Order" to create one.</p>
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="go-to-order-btn" onClick={() => setEditMode(true)}>
                                Edit Profile
                            </button>
                            <button 
                                className="go-to-order-btn" 
                                onClick={() => navigate('/orderhistory')}
                                style={{ background: '#3b82f6', color: 'white' }}
                            >
                                📦 My Orders
                            </button>
                            <button 
                                className="go-to-order-btn" 
                                onClick={() => navigate('/companyorder')}
                                style={{ 
                                    background: currentOrder?.status === 'accepted' ? '#16a34a' : '',
                                    color: currentOrder?.status === 'accepted' ? 'white' : ''
                                }}
                            >
                                + New Order
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Testimonials */}
            <div className="enterprise-testimonials">
                <h2>What Our Partners Say</h2>
                <div className="testimonials-grid">
                    <div className="testimonial">
                        <p>"CycleWealth helped us reduce our raw material costs by 35% while meeting our sustainability goals. The dealer network is reliable and professional."</p>
                        <div className="testimonial-author">
                            <h4>Rahul Sharma</h4>
                            <p>CEO, GreenTech Manufacturing</p>
                        </div>
                    </div>
                    <div className="testimonial">
                        <p>"The platform is intuitive and the support team is amazing. We found quality scrap suppliers within days of signing up."</p>
                        <div className="testimonial-author">
                            <h4>Priya Patel</h4>
                            <p>Operations Head, EcoCraft Industries</p>
                        </div>
                    </div>
                    <div className="testimonial">
                        <p>"As a startup, cost efficiency was crucial. CycleWealth connected us with dealers who offered great prices and consistent supply."</p>
                        <div className="testimonial-author">
                            <h4>Amit Kumar</h4>
                            <p>Founder, ReNew Solutions</p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Enterprise;
