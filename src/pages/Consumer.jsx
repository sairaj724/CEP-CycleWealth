import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Consumer.css';
import supabaseClient from '../supabase-config';

function Consumer() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('overview');
    const [showLogout, setShowLogout] = useState(false);

    // Mock scrap dealers data (JustDial style)
    const [scrapDealers] = useState([
        {
            id: 1,
            name: "Green Earth Scrap Dealers",
            owner: "Rajesh Kumar",
            phone: "+91 98765 43210",
            address: "123 Main Road, Near City Center, Mumbai - 400001",
            distance: "1.2 km",
            rating: 4.5,
            reviews: 128,
            openTime: "9:00 AM - 8:00 PM",
            openStatus: "Open Now",
            materials: ["Paper", "Plastic", "Metal", "E-Waste"],
            verified: true,
            years: 15
        },
        {
            id: 2,
            name: "Mumbai Scrap Collection",
            owner: "Suresh Patel",
            phone: "+91 98765 43211",
            address: "456 Market Street, Dadar West, Mumbai - 400028",
            distance: "2.5 km",
            rating: 4.2,
            reviews: 89,
            openTime: "8:00 AM - 9:00 PM",
            openStatus: "Open Now",
            materials: ["Iron", "Aluminum", "Copper", "Brass"],
            verified: true,
            years: 8
        },
        {
            id: 3,
            name: "EcoFriendly Recyclers",
            owner: "Priya Sharma",
            phone: "+91 98765 43212",
            address: "789 Green Avenue, Andheri East, Mumbai - 400069",
            distance: "3.8 km",
            rating: 4.7,
            reviews: 156,
            openTime: "10:00 AM - 7:00 PM",
            openStatus: "Closed",
            materials: ["E-Waste", "Batteries", "Plastic", "Glass"],
            verified: true,
            years: 12
        },
        {
            id: 4,
            name: "Quick Scrap Pickup",
            owner: "Amit Singh",
            phone: "+91 98765 43213",
            address: "321 Industrial Area, Sakinaka, Mumbai - 400072",
            distance: "5.1 km",
            rating: 3.9,
            reviews: 67,
            openTime: "24 Hours",
            openStatus: "Open Now",
            materials: ["All Types of Scrap"],
            verified: false,
            years: 5
        },
        {
            id: 5,
            name: "Metro Waste Solutions",
            owner: "Vikram Rao",
            phone: "+91 98765 43214",
            address: "654 Business Park, Bandra Kurla Complex, Mumbai - 400051",
            distance: "6.3 km",
            rating: 4.4,
            reviews: 203,
            openTime: "9:00 AM - 6:00 PM",
            openStatus: "Closed",
            materials: ["Corporate E-Waste", "Paper", "Metal"],
            verified: true,
            years: 20
        }
    ]);

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);

        if (user.role === 'ScrapDealer') {
            navigate('/scrapdealer');
            return;
        }

        setProfile({
            firstName: user["First name"] || 'Consumer',
            lastName: user["Last_Name"] || '',
            email: user.email_address,
            role: user.role || 'consumer',
            joinedDate: new Date().toLocaleDateString()
        });
        setLoading(false);
    }, [navigate]);

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const handleBuyProducts = () => {
        navigate('/ecom');
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className="star filled">★</span>);
        }
        if (hasHalfStar) {
            stars.push(<span key="half" className="star half">★</span>);
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<span key={i} className="star">★</span>);
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="consumer-page">
                <div className="consumer-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="consumer-page">
            {/* Navigation Bar */}
            <div className="navbar">
                <h2 className="logo">♻️ CycleWealth</h2>
                <div className="nav-links">
                    <a href="/">Home</a>
                    <a href="#" onClick={() => setActiveTab('overview')}>Dashboard</a>
                    <a href="#" onClick={() => setActiveTab('dealers')}>Scrap Dealers</a>
                    <a href="#" onClick={handleBuyProducts}>Shop</a>
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
            <div className="consumer-main">
                {/* Welcome Section */}
                <div className="consumer-welcome-card">
                    <div className="consumer-header">
                        <div className="consumer-avatar">
                            {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                        </div>
                        <div className="consumer-title">
                            <h2>Welcome, {profile?.firstName} {profile?.lastName}!</h2>
                            <p>Eco-conscious Consumer</p>
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="action-cards-grid">
                    <div className="action-card buy-card" onClick={handleBuyProducts}>
                        <div className="action-icon">🛒</div>
                        <h3>Buy Recycled Products</h3>
                        <p>Browse and purchase eco-friendly recycled products from our marketplace</p>
                        <button className="action-btn primary">Shop Now</button>
                    </div>

                    <div className="action-card dealers-card" onClick={() => setActiveTab('dealers')}>
                        <div className="action-icon">🏪</div>
                        <h3>Nearest Scrap Dealers</h3>
                        <p>Find verified scrap dealers near you for selling your recyclable materials</p>
                        <button className="action-btn secondary">Find Dealers</button>
                    </div>
                </div>

                {/* Scrap Dealers Section - JustDial Style */}
                {activeTab === 'dealers' && (
                    <div className="dealers-section">
                        <div className="dealers-header">
                            <h2>🔍 Nearest Scrap Dealers</h2>
                            <div className="search-bar">
                                <input type="text" placeholder="Search by area, dealer name, or material..." />
                                <button className="search-btn">Search</button>
                            </div>
                        </div>

                        <div className="filters-bar">
                            <button className="filter-btn active">All</button>
                            <button className="filter-btn">Open Now</button>
                            <button className="filter-btn">Verified</button>
                            <button className="filter-btn">Nearest</button>
                            <button className="filter-btn">Best Rated</button>
                        </div>

                        <div className="dealers-list">
                            {scrapDealers.map((dealer) => (
                                <div key={dealer.id} className="dealer-item">
                                    <div className="dealer-main-info">
                                        <div className="dealer-name-row">
                                            <h3 className="dealer-name">{dealer.name}</h3>
                                            {dealer.verified && <span className="verified-badge">✓ Verified</span>}
                                        </div>

                                        <div className="dealer-rating-row">
                                            <div className="rating-stars">
                                                {renderStars(dealer.rating)}
                                            </div>
                                            <span className="rating-text">{dealer.rating}</span>
                                            <span className="reviews-count">({dealer.reviews} reviews)</span>
                                            <span className="years-badge">{dealer.years}+ years</span>
                                        </div>

                                        <div className="dealer-address">
                                            <span className="location-icon">📍</span>
                                            <p>{dealer.address}</p>
                                            <span className="distance-badge">{dealer.distance}</span>
                                        </div>

                                        <div className="dealer-materials">
                                            {dealer.materials.map((material, idx) => (
                                                <span key={idx} className="material-tag">{material}</span>
                                            ))}
                                        </div>

                                        <div className="dealer-status">
                                            <span className={`status-badge ${dealer.openStatus === 'Open Now' ? 'open' : 'closed'}`}>
                                                ● {dealer.openStatus}
                                            </span>
                                            <span className="timing">{dealer.openTime}</span>
                                        </div>
                                    </div>

                                    <div className="dealer-actions">
                                        <button className="get-contact-btn">
                                            <span className="call-icon">📞</span>
                                            Get Contact Number
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="pagination">
                            <button className="page-btn">Previous</button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <button className="page-btn">Next</button>
                        </div>
                    </div>
                )}

                {/* Quick Stats Section */}
                {activeTab === 'overview' && (
                    <div className="consumer-stats-section">
                        <h2>📊 Your Activity</h2>
                        <div className="stats-grid consumer-stats">
                            <div className="stat-card eco">
                                <div className="stat-value">0</div>
                                <div className="stat-label">Products Purchased</div>
                            </div>
                            <div className="stat-card orders">
                                <div className="stat-value">0</div>
                                <div className="stat-label">Active Orders</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Consumer;
