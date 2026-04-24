import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Consumer.css';
import supabaseClient from '../supabase-config';
import { getMyOrders } from '../services/orderService';

function Consumer() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('overview');
    const [showLogout, setShowLogout] = useState(false);
    const [stats, setStats] = useState({ productsPurchased: 0, activeOrders: 0 });

    // Scrap dealers data - fetched from database
    const [scrapDealers, setScrapDealers] = useState([]);
    const [loadingDealers, setLoadingDealers] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState(null);
    const [showUpcycleModal, setShowUpcycleModal] = useState(false);
    const [upcycleForm, setUpcycleForm] = useState({
        scrapType: '',
        quantity: '',
        description: ''
    });
    const [showRecyclingModal, setShowRecyclingModal] = useState(false);
    const [recyclingForm, setRecyclingForm] = useState({
        scrapType: '',
        quantity: '',
        description: ''
    });

    // Haversine formula to calculate distance between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    };

    // Fetch scrap dealers from database and calculate distances
    const fetchScrapDealers = async (currentLat, currentLng) => {
        try {
            setLoadingDealers(true);
            console.log('Fetching scrap dealers...');

            // Fetch scrap dealers from users table
            const { data: usersData, error: usersError } = await supabaseClient
                .from('users')
                .select('user_id, "First name", "Last_Name", email_address, latitude, longitude')
                .eq('role', 'ScrapDealer');

            console.log('Users data:', usersData);
            console.log('Users error:', usersError);

            if (usersError) {
                console.error('Error fetching users:', usersError);
                throw usersError;
            }

            if (!usersData || usersData.length === 0) {
                console.log('No scrap dealers found in users table');
                setScrapDealers([]);
                setLoadingDealers(false);
                return;
            }

            // Fetch profiles for these dealers
            const dealerIds = usersData.map(u => u.user_id);
            console.log('Dealer IDs:', dealerIds);

            const { data: profilesData, error: profilesError } = await supabaseClient
                .from('scrapdealer_profile')
                .select('dealer_id, business_name, contact_number, "Area", "City", "State", pincode, business_description, established_year, working_hours')
                .in('dealer_id', dealerIds);

            console.log('Profiles data:', profilesData);
            console.log('Profiles error:', profilesError);

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
            }

            // Create profile map for quick lookup
            const profilesMap = {};
            if (profilesData) {
                profilesData.forEach(profile => {
                    profilesMap[profile.dealer_id] = profile;
                });
            }

            console.log('Profiles map:', profilesMap);

            // Combine user and profile data, calculate distances
            const dealersWithData = usersData.map(user => {
                const profile = profilesMap[user.user_id] || {};

                // Calculate distance if we have coordinates
                let distance = null;
                if (currentLat && currentLng && user.latitude && user.longitude) {
                    distance = calculateDistance(
                        currentLat, 
                        currentLng,
                        parseFloat(user.latitude), 
                        parseFloat(user.longitude)
                    );
                }

                const fullName = `${user["First name"] || ''} ${user["Last_Name"] || ''}`.trim();
                const businessName = profile.business_name || fullName || 'Scrap Dealer';

                // Build address from profile fields
                const addressParts = [profile.Area, profile.City, profile.State].filter(Boolean);
                const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

                // Calculate years in business
                const years = profile.established_year 
                    ? new Date().getFullYear() - parseInt(profile.established_year) 
                    : Math.floor(Math.random() * 15) + 5;

                return {
                    id: user.user_id,
                    name: businessName,
                    owner: fullName,
                    phone: profile.contact_number || user.phone_no,
                    email: user.email_address,
                    address: address,
                    latitude: user.latitude,
                    longitude: user.longitude,
                    distance: distance !== null ? (distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`) : 'N/A',
                    distanceValue: distance,
                    rating: 4.0 + Math.random() * 1.0,
                    reviews: Math.floor(Math.random() * 150) + 50,
                    openTime: profile.working_hours || "9:00 AM - 6:00 PM",
                    openStatus: "Open Now",
                    materials: ["Paper", "Plastic", "Metal", "E-Waste"],
                    verified: true,
                    years: years,
                    area: profile.Area,
                    city: profile.City,
                    state: profile.State
                };
            });

            console.log('Dealers with data:', dealersWithData);

            // Sort by distance (nearest first, nulls at end)
            const sortedDealers = dealersWithData.sort((a, b) => {
                if (a.distanceValue === null && b.distanceValue === null) return 0;
                if (a.distanceValue === null) return 1;
                if (b.distanceValue === null) return -1;
                return a.distanceValue - b.distanceValue;
            });

            console.log('Sorted dealers:', sortedDealers);
            setScrapDealers(sortedDealers);
        } catch (err) {
            console.error('Error fetching scrap dealers:', err);
            setScrapDealers([]);
        } finally {
            setLoadingDealers(false);
        }
    };

    // Handle Find Dealers button click - get location and fetch dealers
    const handleFindDealers = () => {
        setActiveTab('dealers');

        // Try to get user's current location using Geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    fetchScrapDealers(latitude, longitude);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Fall back to fetching without distance calculation
                    fetchScrapDealers(null, null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            // Geolocation not supported, fetch without distance
            fetchScrapDealers(null, null);
        }
    };

    // Handle contact button click - show phone number in modal
    const handleContact = (dealer) => {
        setSelectedDealer(dealer);
        setShowContactModal(true);
    };

    // Close contact modal
    const closeContactModal = () => {
        setShowContactModal(false);
        setSelectedDealer(null);
    };

    // Call the dealer
    const callDealer = () => {
        if (selectedDealer?.phone) {
            window.location.href = `tel:${selectedDealer.phone}`;
        }
    };

    // Handle Send for Upcycling button click
    const handleSendForUpcycling = (dealer) => {
        setSelectedDealer(dealer);
        setUpcycleForm({ scrapType: '', quantity: '', description: '' });
        setShowUpcycleModal(true);
    };

    // Close upcycle modal
    const closeUpcycleModal = () => {
        setShowUpcycleModal(false);
        setSelectedDealer(null);
        setUpcycleForm({ scrapType: '', quantity: '', description: '' });
    };

    // Submit upcycling request
    const submitUpcycleRequest = async () => {
        if (!upcycleForm.scrapType || !upcycleForm.quantity) {
            alert('Please fill in scrap type and quantity');
            return;
        }

        try {
            const sessionUser = sessionStorage.getItem('user');
            const user = JSON.parse(sessionUser);

            const { error } = await supabaseClient
                .from('upcycling_requests')
                .insert([{
                    consumer_id: user.user_id,
                    dealer_id: selectedDealer.id,
                    scrap_type: upcycleForm.scrapType,
                    quantity_kg: parseFloat(upcycleForm.quantity),
                    description: upcycleForm.description,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            alert('Upcycling request sent successfully!');
            closeUpcycleModal();
        } catch (err) {
            console.error('Error sending upcycling request:', err);
            alert('Failed to send request. Please try again.');
        }
    };

    // Handle Send for Recycling button click
    const handleSendForRecycling = (dealer) => {
        setSelectedDealer(dealer);
        setRecyclingForm({ scrapType: '', quantity: '', description: '' });
        setShowRecyclingModal(true);
    };

    // Close recycling modal
    const closeRecyclingModal = () => {
        setShowRecyclingModal(false);
        setSelectedDealer(null);
        setRecyclingForm({ scrapType: '', quantity: '', description: '' });
    };

    // Submit recycling request
    const submitRecyclingRequest = async () => {
        if (!recyclingForm.scrapType || !recyclingForm.quantity) {
            alert('Please fill in scrap type and quantity');
            return;
        }

        try {
            const sessionUser = sessionStorage.getItem('user');
            const user = JSON.parse(sessionUser);

            const { error } = await supabaseClient
                .from('recycling_requests')
                .insert([{
                    consumer_id: user.user_id,
                    dealer_id: selectedDealer.id,
                    scrap_type: recyclingForm.scrapType,
                    quantity_kg: parseFloat(recyclingForm.quantity),
                    description: recyclingForm.description,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            alert('Recycling request sent successfully!');
            closeRecyclingModal();
        } catch (err) {
            console.error('Error sending recycling request:', err);
            alert('Failed to send request. Please try again.');
        }
    };

    // Handle location button click - open Google Maps
    const handleViewLocation = (dealer) => {
        if (dealer.latitude && dealer.longitude) {
            window.open(`https://www.google.com/maps?q=${dealer.latitude},${dealer.longitude}`, '_blank');
        } else if (dealer.area || dealer.city || dealer.state) {
            const query = [dealer.area, dealer.city, dealer.state].filter(Boolean).join(', ');
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
        }
    };

    useEffect(() => {
        const init = async () => {
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

            // Fetch stats from my_orders
            try {
                const orders = await getMyOrders();
                const productsPurchased = orders.reduce((sum, order) => sum + (order.amount_bought || 0), 0);
                const activeOrders = orders.filter(order =>
                    order.currentstatus && ['ordered', 'packed', 'shipped'].includes(order.currentstatus)
                ).length;
                setStats({ productsPurchased, activeOrders });
            } catch (err) {
                console.error('Error fetching stats:', err);
            }

            setLoading(false);
        };

        init();
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

                    <a href="/Consumer">Home</a>
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

                    <div className="action-card dealers-card" onClick={handleFindDealers}>
                        <div className="action-icon">🏪</div>
                        <h3>Nearest Scrap Dealers</h3>
                        <p>Find verified scrap dealers near you for selling your recyclable materials</p>
                        <button className="action-btn secondary" onClick={(e) => { e.stopPropagation(); handleFindDealers(); }}>
                            Find Dealers
                        </button>
                    </div>

                    <div className="action-card profile-card" onClick={() => navigate('/profile')}>
                        <div className="action-icon">👤</div>
                        <h3>My Profile</h3>
                        <p>Manage your personal details and delivery address for faster checkout</p>
                        <button className="action-btn secondary">View Profile</button>
                    </div>

                    <div className="action-card orders-card" onClick={() => navigate('/my-orders')}>
                        <div className="action-icon">📦</div>
                        <h3>My Orders</h3>
                        <p>Track your orders and view delivery status of your purchased products</p>
                        <button className="action-btn secondary">View Orders</button>
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

                        {loadingDealers ? (
                            <div className="loading-dealers">Loading scrap dealers...</div>
                        ) : scrapDealers.length === 0 ? (
                            <div className="no-dealers-found">No scrap dealers found. Click "Find Dealers" to search.</div>
                        ) : (
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
                                        <button className="get-contact-btn" onClick={() => handleContact(dealer)}>
                                            <span className="call-icon">📞</span>
                                            Get Contact Number
                                        </button>
                                        <button className="send-upcycle-btn" onClick={() => handleSendForUpcycling(dealer)}>
                                            <span className="upcycle-icon">♻️</span>
                                            Send for Upcycling
                                        </button>
                                        <button className="view-location-btn" onClick={() => handleViewLocation(dealer)}>
                                            <span className="location-icon">📍</span>
                                            View Location
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}

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
                                <div className="stat-value">{stats.productsPurchased}</div>
                                <div className="stat-label">Products Purchased</div>
                            </div>
                            <div className="stat-card orders">
                                <div className="stat-value">{stats.activeOrders}</div>
                                <div className="stat-label">Active Orders</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Modal */}
                {showContactModal && selectedDealer && (
                    <div className="contact-modal-overlay" onClick={closeContactModal}>
                        <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="contact-modal-header">
                                <h3>📞 Contact Information</h3>
                                <button className="close-btn" onClick={closeContactModal}>×</button>
                            </div>
                            <div className="contact-modal-content">
                                <div className="dealer-info">
                                    <h4>{selectedDealer.name}</h4>
                                    <p className="dealer-owner">{selectedDealer.owner}</p>
                                </div>
                                <div className="phone-number-box">
                                    <span className="phone-label">Phone Number:</span>
                                    <span className="phone-value">{selectedDealer.phone || 'Not available'}</span>
                                </div>
                                {selectedDealer.phone && (
                                    <button className="call-now-btn" onClick={callDealer}>
                                        📞 Call Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Upcycling Request Modal */}
                {showUpcycleModal && selectedDealer && (
                    <div className="contact-modal-overlay" onClick={closeUpcycleModal}>
                        <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="contact-modal-header upcycle-header">
                                <h3>♻️ Send for Upcycling</h3>
                                <button className="close-btn" onClick={closeUpcycleModal}>×</button>
                            </div>
                            <div className="contact-modal-content">
                                <div className="dealer-info">
                                    <h4>{selectedDealer.name}</h4>
                                    <p className="dealer-owner">Send your scrap for upcycling</p>
                                </div>
                                <div className="upcycle-form">
                                    <div className="form-group">
                                        <label>Scrap Type:</label>
                                        <select
                                            value={upcycleForm.scrapType}
                                            onChange={(e) => setUpcycleForm({...upcycleForm, scrapType: e.target.value})}
                                            className="form-select"
                                        >
                                            <option value="">-- Select scrap type --</option>
                                            <option value="Paper">Paper</option>
                                            <option value="Plastic">Plastic</option>
                                            <option value="Metal">Metal</option>
                                            <option value="Glass">Glass</option>
                                            <option value="E-Waste">E-Waste</option>
                                            <option value="Textile">Textile</option>
                                            <option value="Wood">Wood</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Quantity (kg):</label>
                                        <input
                                            type="number"
                                            value={upcycleForm.quantity}
                                            onChange={(e) => setUpcycleForm({...upcycleForm, quantity: e.target.value})}
                                            placeholder="Enter quantity in kg"
                                            className="form-input"
                                            min="0.1"
                                            step="0.1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description (optional):</label>
                                        <textarea
                                            value={upcycleForm.description}
                                            onChange={(e) => setUpcycleForm({...upcycleForm, description: e.target.value})}
                                            placeholder="Describe your scrap materials..."
                                            className="form-textarea"
                                            rows="3"
                                        />
                                    </div>
                                </div>
                                <button className="call-now-btn upcycle-submit-btn" onClick={submitUpcycleRequest}>
                                    ♻️ Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Consumer;
