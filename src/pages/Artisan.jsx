import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Artisan.css';
import supabaseClient from '../supabase-config';
// import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NotificationDropdown from '../components/NotificationDropdown';
import {
    getSkilledLaborProfile,
    createOrGetSkilledLaborProfile,
    updateSkilledLaborProfile,
    getArtisanProducts,
    addArtisanProduct,
    updateArtisanProduct,
    deleteArtisanProduct
} from '../services/artisanService';


function Artisan() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showLogout, setShowLogout] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [error, setError] = useState(null);
    const [savingProduct, setSavingProduct] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        pinCode: '',
        skills: ''
    });

    // Mock scrap dealers for buying
    const [scrapDealers] = useState([
        { id: 1, name: "Green Earth Scrap", materials: "Paper, Plastic", price: "₹15/kg", location: "2.3 km", rating: 4.5 },
        { id: 2, name: "Mumbai Scrap Hub", materials: "Metal, E-Waste", price: "₹45/kg", location: "3.1 km", rating: 4.2 },
        { id: 3, name: "Recycle Mart", materials: "Glass, Plastic", price: "₹20/kg", location: "1.8 km", rating: 4.7 },
        { id: 4, name: "Eco Scrap Dealers", materials: "All Types", price: "₹25/kg", location: "4.2 km", rating: 4.3 }
    ]);

    // Products inventory tracking (loaded from database)
    const [myProducts, setMyProducts] = useState([]);

    // New product form state
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        quantity: ''
    });

    useEffect(() => {
        loadArtisanData();
    }, [navigate]);

    const loadArtisanData = async () => {
        try {
            const sessionUser = sessionStorage.getItem('user');
            if (!sessionUser) {
                navigate('/login');
                return;
            }

            const user = JSON.parse(sessionUser);

            if (user.role !== 'Artisan') {
                navigate('/dashboard');
                return;
            }

            // Load or create skilled labor profile
            let laborProfile = await getSkilledLaborProfile();
            
            if (!laborProfile) {
                // Create profile from user data
                try {
                    laborProfile = await createOrGetSkilledLaborProfile({
                        firstName: user["First name"] || 'Artisan',
                        lastName: user["Last_Name"] || ''
                    });
                } catch (err) {
                    console.error('Error creating labor profile:', err);
                }
            }

            setProfile({
                firstName: laborProfile?.first_name || user["First name"] || 'Artisan',
                lastName: laborProfile?.last_name || user["Last_Name"] || '',
                email: user.email_address,
                role: user.role,
                laborProfile: laborProfile
            });

            // Load products from database
            const products = await getArtisanProducts();
            if (products && products.length > 0) {
                // Transform database products to frontend format
                const formattedProducts = products.map(p => ({
                    id: p.product_id,
                    name: p.name,
                    price: p.listed_price,
                    quantity: p.quantity,
                    sold: p.status === 'Sold' ? 1 : 0,
                    listed: 1,
                    status: p.status === 'Available' ? 'active' : p.status === 'Sold' ? 'sold_out' : 'low_stock',
                    description: p.description
                }));
                setMyProducts(formattedProducts);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading artisan data:', err);
            setError('Failed to load profile data. Please try again.');
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const closeSellModal = () => {
        setShowSellModal(false);
        setError(null);
    };

    const openSellModal = () => {
        // Check if profile exists and is complete
        if (!profile) {
            setError('Please wait while profile loads...');
            return;
        }
        if (!profile.laborProfile?.address || !profile.laborProfile?.city) {
            setProfileForm({
                firstName: profile.laborProfile?.first_name || profile.firstName || '',
                lastName: profile.laborProfile?.last_name || profile.lastName || '',
                address: profile.laborProfile?.address || '',
                city: profile.laborProfile?.city || '',
                state: profile.laborProfile?.state || '',
                pinCode: profile.laborProfile?.pin_code || '',
                skills: profile.laborProfile?.skills || ''
            });
            setShowProfileModal(true);
            setError('Please complete your profile before adding products.');
            return;
        }
        setNewProduct({ name: '', description: '', price: '', quantity: '' });
        setShowSellModal(true);
        setError(null);
    };

    const openProfileModal = () => {
        setProfileForm({
            firstName: profile?.laborProfile?.first_name || profile?.firstName || '',
            lastName: profile?.laborProfile?.last_name || profile?.lastName || '',
            address: profile?.laborProfile?.address || '',
            city: profile?.laborProfile?.city || '',
            state: profile?.laborProfile?.state || '',
            pinCode: profile?.laborProfile?.pin_code || '',
            skills: profile?.laborProfile?.skills || ''
        });
        setShowProfileModal(true);
        setError(null);
    };

    const closeProfileModal = () => {
        setShowProfileModal(false);
        setError(null);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setError(null);

        try {
            const updatedProfile = await updateSkilledLaborProfile({
                firstName: profileForm.firstName,
                lastName: profileForm.lastName,
                address: profileForm.address,
                city: profileForm.city,
                state: profileForm.state,
                pinCode: profileForm.pinCode,
                skills: profileForm.skills
            });

            setProfile(prev => ({
                ...prev,
                firstName: updatedProfile.first_name,
                lastName: updatedProfile.last_name,
                laborProfile: updatedProfile
            }));

            closeProfileModal();
        } catch (err) {
            console.error('Error saving profile:', err);
            console.error('Error details:', err.message, err.details, err.hint, err.code);
            const errorMsg = err.message || err.error_description || 'Failed to save profile. Please try again.';
            setError(`Error: ${errorMsg}`);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setSavingProduct(true);
        setError(null);

        try {
            // Save to database - only send fields that exist in schema
            const savedProduct = await addArtisanProduct({
                name: newProduct.name,
                description: newProduct.description,
                price: parseFloat(newProduct.price),
                quantity: newProduct.quantity
            });

            // Add to local state
            const product = {
                id: savedProduct.product_id,
                name: savedProduct.name,
                description: savedProduct.description,
                price: savedProduct.listed_price,
                quantity: savedProduct.quantity,
                sold: 0,
                listed: 1,
                status: 'active'
            };

            setMyProducts([...myProducts, product]);
            setNewProduct({ name: '', description: '', price: '', quantity: '' });
            closeSellModal();
        } catch (err) {
            console.error('Error adding product:', err);
            const errorMsg = err.message || err.error_description || 'Failed to add product. Please try again.';
            setError(`Error: ${errorMsg}`);
        } finally {
            setSavingProduct(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        try {
            await deleteArtisanProduct(productId);
            setMyProducts(myProducts.filter(p => p.id !== productId));
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('Failed to delete product. Please try again.');
        }
    };

    const handleEditProduct = (product) => {
        setNewProduct({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            quantity: product.quantity || ''
        });
        setShowSellModal(true);
        setError(null);
    };

    // Calculate stats
    const totalListed = myProducts.reduce((sum, p) => sum + p.listed, 0);
    const totalSold = myProducts.reduce((sum, p) => sum + p.sold, 0);
    const totalEarnings = myProducts.reduce((sum, p) => sum + (p.sold * p.price), 0);
    const activeProducts = myProducts.filter(p => p.status === 'active').length;

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        for (let i = 0; i < fullStars; i++) stars.push(<span key={i} className="star filled">★</span>);
        for (let i = fullStars; i < 5; i++) stars.push(<span key={i} className="star">★</span>);
        return stars;
    };

    if (loading) {
        return <div className="artisan-page"><div className="artisan-loading">Loading...</div></div>;
    }

    if (error) {
        return (
            <div className="artisan-page">
                <div className="artisan-error">
                    <p>{error}</p>
                    <button onClick={loadArtisanData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="artisan-page">
            {/* Navbar */}
            <div className="navbar artisan-navbar">
                <h2 className="logo">♻️ CycleWealth</h2>
                <div className="nav-links">
                    <a href="#" onClick={() => setActiveTab('overview')}>Dashboard</a>
                    <a href="#" onClick={() => setActiveTab('buy')}>Buy Scrap</a>
                    <a href="#" onClick={() => setActiveTab('sell')}>Sell Products</a>
                    <a href="#" onClick={() => setActiveTab('inventory')}>Inventory</a>
                    <a href="#" onClick={openProfileModal}>Profile</a>
                </div>
                <div className="auth-buttons">
                    <NotificationDropdown user={profile} />
                    <div className="user-avatar-circle" onClick={() => setShowLogout(!showLogout)}>
                        {profile?.firstName?.charAt(0)?.toUpperCase()}{profile?.lastName?.charAt(0)?.toUpperCase()}
                    </div>
                    {showLogout && (
                        <div className="logout-dropdown">
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="artisan-main">
                {/* Welcome Section */}
                <div className="artisan-welcome">
                    <div className="artisan-header">
                        <div className="artisan-avatar">
                            {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                        </div>
                        <div className="artisan-title">
                            <h2>Welcome, {profile?.firstName} {profile?.lastName}!</h2>
                            <p>🎨 Eco Artisans & Craftsperson</p>
                        </div>
                    </div>
                    {/* Profile completion warning */}
                    {(!profile?.laborProfile?.address || !profile?.laborProfile?.city) && (
                        <div className="profile-warning" style={{ marginTop: '15px', padding: '12px', background: '#fff3e0', borderRadius: '8px', borderLeft: '4px solid #ff9800' }}>
                            <p style={{ margin: 0, color: '#e65100', fontSize: '14px' }}>
                                ⚠️ Please complete your profile to add products.
                                <button 
                                    onClick={openProfileModal}
                                    style={{ marginLeft: '10px', padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    Complete Profile
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <>
                        <div className="artisan-stats-section">
                            <h2>📊 Business Overview</h2>
                            <div className="stats-grid artisan-stats">
                                <div className="stat-card listed">
                                    <div className="stat-value">{totalListed}</div>
                                    <div className="stat-label">Products Listed</div>
                                </div>
                                <div className="stat-card sold">
                                    <div className="stat-value">{totalSold}</div>
                                    <div className="stat-label">Products Sold</div>
                                </div>
                                <div className="stat-card earnings">
                                    <div className="stat-value">₹{totalEarnings.toLocaleString()}</div>
                                    <div className="stat-label">Total Earnings</div>
                                </div>
                                <div className="stat-card active">
                                    <div className="stat-value">{activeProducts}</div>
                                    <div className="stat-label">Active Products</div>
                                </div>
                            </div>
                        </div>

                        {/* Sales Progress */}
                        <div className="artisan-progress-section">
                            <h2>📈 Sales Progress</h2>
                            <div className="progress-cards">
                                <div className="progress-card">
                                    <h4>Sell Rate</h4>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${totalListed > 0 ? (totalSold / totalListed) * 100 : 0}%` }}></div>
                                    </div>
                                    <p>{totalListed > 0 ? Math.round((totalSold / totalListed) * 100) : 0}% of listed products sold</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="action-cards-grid">
                            <div className="action-card buy-scrap-card" onClick={() => setActiveTab('buy')}>
                                <div className="action-icon">♻️</div>
                                <h3>Buy Scrap Materials</h3>
                                <p>Purchase raw materials from verified scrap dealers</p>
                                <button className="action-btn primary">Find Dealers</button>
                            </div>
                            <div className="action-card sell-product-card" onClick={openSellModal}>
                                <div className="action-icon">🎨</div>
                                <h3>Sell Your Creation</h3>
                                <p>List your upcycled products for eco-conscious consumers</p>
                                <button className="action-btn secondary">Add Product</button>
                            </div>
                        </div>
                    </>
                )}

                {/* Buy Scrap Tab */}
                {activeTab === 'buy' && (
                    <div className="buy-scrap-section">
                        <h2>♻️ Buy Scrap Materials</h2>
                        <p className="section-subtitle">Find scrap dealers near you for raw materials</p>

                        <div className="scrap-dealers-list">
                            {scrapDealers.map(dealer => (
                                <div key={dealer.id} className="dealer-card">
                                    <div className="dealer-info">
                                        <h3>{dealer.name}</h3>
                                        <div className="rating-stars">{renderStars(dealer.rating)}</div>
                                        <p className="materials">{dealer.materials}</p>
                                        <p className="price">{dealer.price}</p>
                                        <span className="distance">📍 {dealer.location}</span>
                                    </div>
                                    <div className="dealer-actions">
                                        <button className="buy-scrap-btn">Buy Scrap</button>
                                        <button className="contact-btn">Get Contact</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sell Products Tab */}
                {activeTab === 'sell' && (
                    <div className="sell-products-section">
                        <div className="sell-header">
                            <h2>🎨 Your Listed Products</h2>
                            <button className="add-product-btn" onClick={openSellModal}>+ Add New Product</button>
                        </div>

                        <div className="products-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Quantity</th>
                                        <th>Listed</th>
                                        <th>Sold</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myProducts.map(product => (
                                        <tr key={product.id} className={product.status}>
                                            <td>
                                                {product.name}
                                            </td>
                                            <td>₹{product.price}</td>
                                            <td>{product.quantity || '-'}</td>
                                            <td>{product.listed}</td>
                                            <td>{product.sold}</td>
                                            <td><span className={`status-tag ${product.status}`}>{product.status}</span></td>
                                            <td>
                                                <button className="edit-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                                                <button className="delete-btn" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="inventory-section">
                        <h2>📦 Inventory Tracking</h2>
                        <div className="inventory-stats">
                            <div className="inv-stat">
                                <span className="label">Total Listed</span>
                                <span className="value listed">{totalListed}</span>
                            </div>
                            <div className="inv-stat">
                                <span className="label">Total Sold</span>
                                <span className="value sold">{totalSold}</span>
                            </div>
                            <div className="inv-stat">
                                <span className="label">Remaining</span>
                                <span className="value remaining">{totalListed - totalSold}</span>
                            </div>
                        </div>

                        <h3>Product Performance</h3>
                        <div className="product-performance">
                            {myProducts.map(product => (
                                <div key={product.id} className="performance-item">
                                    <div className="perf-info">
                                        <div>
                                            <h4>{product.name}</h4>
                                            <p>{product.sold} / {product.listed} sold</p>
                                        </div>
                                    </div>
                                    <div className="perf-bar">
                                        <div className="perf-fill" style={{ width: `${product.listed > 0 ? (product.sold / product.listed) * 100 : 0}%` }}></div>
                                    </div>
                                    <span className="perf-percent">{product.listed > 0 ? Math.round((product.sold / product.listed) * 100) : 0}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sell Product Modal */}
            {showSellModal && (
                <div className="modal-overlay" onClick={closeSellModal}>
                    <div className="sell-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎨 Add New Product</h2>
                            <button className="close-modal" onClick={closeSellModal}>×</button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            {error && (
                                <div className="form-error-banner" style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', marginBottom: '15px', borderRadius: '8px', fontSize: '14px' }}>
                                    {error}
                                </div>
                            )}
                            <div className="form-group">
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    placeholder="e.g., Recycled Paper Diary"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="Describe your product..."
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price (₹)</label>
                                <input
                                    type="number"
                                    value={newProduct.price}
                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                    placeholder="299"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantity (e.g., 5 items, 2 kg, 3 pieces)</label>
                                <input
                                    type="text"
                                    value={newProduct.quantity}
                                    onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })}
                                    placeholder="e.g., 5 items"
                                />
                            </div>
                            <button type="submit" className="submit-product-btn" disabled={savingProduct}>
                                {savingProduct ? 'Saving...' : 'List Product for Sale'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="modal-overlay" onClick={closeProfileModal}>
                    <div className="sell-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>👤 Edit Profile</h2>
                            <button className="close-modal" onClick={closeProfileModal}>×</button>
                        </div>
                        <form onSubmit={handleSaveProfile}>
                            {error && (
                                <div className="form-error-banner" style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', marginBottom: '15px', borderRadius: '8px', fontSize: '14px' }}>
                                    {error}
                                </div>
                            )}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name *</label>
                                    <input
                                        type="text"
                                        value={profileForm.firstName}
                                        onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name *</label>
                                    <input
                                        type="text"
                                        value={profileForm.lastName}
                                        onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    value={profileForm.address}
                                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                                    placeholder="123 Main Street"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        value={profileForm.city}
                                        onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                                        placeholder="Mumbai"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        value={profileForm.state}
                                        onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                                        placeholder="Maharashtra"
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>PIN Code</label>
                                    <input
                                        type="number"
                                        value={profileForm.pinCode}
                                        onChange={e => setProfileForm({ ...profileForm, pinCode: e.target.value })}
                                        placeholder="400001"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Skills</label>
                                    <input
                                        type="text"
                                        value={profileForm.skills}
                                        onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })}
                                        placeholder="e.g., Woodworking, Painting"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="submit-product-btn" disabled={savingProfile}>
                                {savingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Artisan;