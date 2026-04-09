import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Artisan.css';
import supabaseClient from '../supabase-config';

function Artisan() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showLogout, setShowLogout] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);

    // Mock scrap dealers for buying
    const [scrapDealers] = useState([
        { id: 1, name: "Green Earth Scrap", materials: "Paper, Plastic", price: "₹15/kg", location: "2.3 km", rating: 4.5 },
        { id: 2, name: "Mumbai Scrap Hub", materials: "Metal, E-Waste", price: "₹45/kg", location: "3.1 km", rating: 4.2 },
        { id: 3, name: "Recycle Mart", materials: "Glass, Plastic", price: "₹20/kg", location: "1.8 km", rating: 4.7 },
        { id: 4, name: "Eco Scrap Dealers", materials: "All Types", price: "₹25/kg", location: "4.2 km", rating: 4.3 }
    ]);

    // Products inventory tracking
    const [myProducts, setMyProducts] = useState([
        { id: 1, name: "Recycled Paper Diary", category: "Stationery", price: 199, stock: 15, sold: 45, listed: 60, status: "active", image: "📓" },
        { id: 2, name: "Glass Bottle Lamp", category: "Home Decor", price: 599, stock: 8, sold: 22, listed: 30, status: "active", image: "💡" },
        { id: 3, name: "Tire Ottoman Seat", category: "Furniture", price: 1299, stock: 3, sold: 12, listed: 15, status: "low_stock", image: "🛋️" },
        { id: 4, name: "Newspaper Basket", category: "Home Decor", price: 249, stock: 0, sold: 30, listed: 30, status: "sold_out", image: "🧺" }
    ]);

    // New product form state
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        category: 'Stationery',
        price: '',
        stock: '',
        ecoBadge: '',
        image: '📦'
    });

    const categories = ['Stationery', 'Home Decor', 'Garden', 'Furniture', 'Accessories', 'Kitchen', 'Personal Care'];

    useEffect(() => {
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

        setProfile({
            firstName: user["First name"] || 'Artisan',
            lastName: user["Last_Name"] || '',
            email: user.email_address,
            role: user.role
        });
        setLoading(false);
    }, [navigate]);

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        const product = {
            id: myProducts.length + 1,
            ...newProduct,
            price: parseInt(newProduct.price),
            stock: parseInt(newProduct.stock),
            sold: 0,
            listed: parseInt(newProduct.stock),
            status: 'active'
        };
        setMyProducts([...myProducts, product]);
        setNewProduct({ name: '', description: '', category: 'Stationery', price: '', stock: '', ecoBadge: '', image: '📦' });
        setShowSellModal(false);
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
                </div>
                <div className="auth-buttons">
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
                            <div className="action-card sell-product-card" onClick={() => setShowSellModal(true)}>
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
                            <button className="add-product-btn" onClick={() => setShowSellModal(true)}>+ Add New Product</button>
                        </div>

                        <div className="products-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Listed</th>
                                        <th>Sold</th>
                                        <th>Stock</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myProducts.map(product => (
                                        <tr key={product.id} className={product.status}>
                                            <td>
                                                <span className="product-icon">{product.image}</span>
                                                {product.name}
                                            </td>
                                            <td>₹{product.price}</td>
                                            <td>{product.listed}</td>
                                            <td>{product.sold}</td>
                                            <td>{product.stock}</td>
                                            <td><span className={`status-tag ${product.status}`}>{product.status}</span></td>
                                            <td>
                                                <button className="edit-btn">Edit</button>
                                                <button className="delete-btn">Delete</button>
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
                                        <span className="perf-icon">{product.image}</span>
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
                <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
                    <div className="sell-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎨 Add New Product</h2>
                            <button className="close-modal" onClick={() => setShowSellModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddProduct}>
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
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
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Stock Quantity</label>
                                    <input
                                        type="number"
                                        value={newProduct.stock}
                                        onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                                        placeholder="50"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Eco Badge</label>
                                    <input
                                        type="text"
                                        value={newProduct.ecoBadge}
                                        onChange={e => setNewProduct({ ...newProduct, ecoBadge: e.target.value })}
                                        placeholder="e.g., 100% Recycled"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Product Icon</label>
                                <div className="icon-selector">
                                    {['📓', '🏺', '🪴', '📦', '💡', '🛋️', '🧺', '🎨', '👕', '🪥', '🌱', '✏️'].map(icon => (
                                        <span
                                            key={icon}
                                            className={`icon-option ${newProduct.image === icon ? 'selected' : ''}`}
                                            onClick={() => setNewProduct({ ...newProduct, image: icon })}
                                        >
                                            {icon}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="submit-product-btn">List Product for Sale</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Artisan;