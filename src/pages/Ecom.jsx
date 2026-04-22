import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Ecom.css';
import supabaseClient from '../supabase-config';
import { getAvailableProducts, addProductToCart, removeProductFromCart } from '../services/orderService';

function Ecom() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showLogout, setShowLogout] = useState(false);
    const [products, setProducts] = useState([]);

    // Categories from scrap_categories or default
    const categories = ['All', 'Stationery', 'Home Decor', 'Garden', 'Packaging', 'Accessories', 'Clothing', 'Personal Care', 'Furniture', 'Kitchen'];

    // Load products from database
    const loadProducts = async () => {
        try {
            console.log('Fetching products...');
            const data = await getAvailableProducts();
            console.log('Raw data from DB:', data);
            
            if (!data || data.length === 0) {
                console.warn('No products found in database');
                setProducts([]);
                return;
            }
            
            // Map database products to frontend format
            const mappedProducts = data.map((product, index) => ({
                id: product.product_id,
                name: product.name,
                description: product.description || 'Upcycled eco-friendly product',
                price: parseFloat(product.listed_price) || 0,
                originalPrice: Math.round((parseFloat(product.listed_price) || 0) * 1.3),
                category: categories[index % categories.length] || 'Home Decor',
                image: ['📓', '🏺', '🪴', '🛍️', '🎨', '👜', '👕', '🪥', '🌱', '✏️', '🪑', '🥥'][index % 12],
                rating: 4.0 + Math.random() * 1.0,
                reviews: Math.floor(Math.random() * 300) + 50,
                stock: 1,
                ecoBadge: 'Upcycled Product',
                seller: 'Eco Artisan'
            }));
            console.log('Mapped products:', mappedProducts);
            setProducts(mappedProducts);
        } catch (err) {
            console.error('Error loading products:', err);
            setProducts([]);
        }
    };

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);
        setProfile({
            firstName: user["First name"] || 'Consumer',
            lastName: user["Last_Name"] || '',
            email: user.email_address,
            role: user.role || 'consumer'
        });

        loadProducts();
        setLoading(false);

        // Cleanup: restore cart items to Available when leaving page
        return () => {
            cart.forEach(item => {
                removeProductFromCart(item.id);
            });
        };
    }, [navigate]);

    // Store cart in sessionStorage for cleanup tracking
    useEffect(() => {
        if (cart.length > 0) {
            sessionStorage.setItem('ecomCart', JSON.stringify(cart));
        }
    }, [cart]);

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const addToCart = async (product) => {
        // Update database status to 'incart'
        const success = await addProductToCart(product.id);
        if (!success) {
            alert('This product is no longer available');
            loadProducts();
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = async (productId) => {
        // Restore product status to 'Available' in database
        await removeProductFromCart(productId);
        
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev =>
            prev.map(item =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
            <div className="ecom-page">
                <div className="ecom-loading">
                    <p>Loading marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="ecom-page">
            {/* Navigation */}
            <div className="navbar ecom-navbar">
                <h2 className="logo" onClick={() => navigate('/')}>♻️ CycleWealth</h2>

                <div className="ecom-search">
                    <input
                        type="text"
                        placeholder="Search recycled products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="search-icon">🔍</button>
                </div>

                <div className="ecom-nav-actions">
                    <button className="cart-btn" onClick={() => setShowCart(!showCart)}>
                        🛒 Cart ({getTotalItems()})
                    </button>
                    <button className="back-btn" onClick={() => navigate('/consumer')}>
                        ← Back
                    </button>
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

            {/* Cart Sidebar */}
            {showCart && (
                <div className="cart-sidebar">
                    <div className="cart-header">
                        <h3>🛒 Shopping Cart</h3>
                        <button className="close-cart" onClick={() => setShowCart(false)}>×</button>
                    </div>

                    {cart.length === 0 ? (
                        <div className="cart-empty">
                            <p>Your cart is empty</p>
                            <p className="cart-empty-sub">Add eco-friendly products!</p>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="cart-item-image">{item.image}</div>
                                        <div className="cart-item-details">
                                            <h4>{item.name}</h4>
                                            <p className="cart-item-price">₹{item.price}</p>
                                            <div className="quantity-control">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                            </div>
                                        </div>
                                        <button className="remove-item" onClick={() => removeFromCart(item.id)}>🗑️</button>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total:</span>
                                    <span className="total-price">₹{getTotalPrice()}</span>
                                </div>
                                <button 
                                    className="checkout-btn"
                                    onClick={() => navigate('/order')}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="ecom-main">
                {/* Hero Section */}
                <div className="ecom-hero">
                    <h1>♻️ Eco-Friendly Marketplace</h1>
                    <p>Discover unique products made from recycled materials. Shop sustainable, live responsibly.</p>
                </div>

                {/* Category Filter */}
                <div className="category-filter">
                    {categories.map(category => (
                        <button
                            key={category}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">{product.image}</div>

                            <div className="product-info">
                                <div className="product-category">{product.category}</div>
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-description">{product.description}</p>

                                <div className="product-rating">
                                    <div className="rating-stars">
                                        {renderStars(product.rating)}
                                    </div>
                                    <span className="rating-text">({product.reviews})</span>
                                </div>

                                <div className="eco-badge">
                                    <span>🌱 {product.ecoBadge}</span>
                                </div>

                                <div className="product-seller">
                                    <span>Sold by: {product.seller}</span>
                                </div>

                                <div className="product-price-row">
                                    <div className="price-info">
                                        <span className="current-price">₹{product.price}</span>
                                        <span className="original-price">₹{product.originalPrice}</span>
                                        <span className="discount">
                                            {Math.round((1 - product.price / product.originalPrice) * 100)}% off
                                        </span>
                                    </div>
                                    <span className={`stock-status ${product.stock < 50 ? 'low' : ''}`}>
                                        {product.stock < 50 ? 'Only ' + product.stock + ' left!' : 'In Stock'}
                                    </span>
                                </div>

                                <div className="product-actions">
                                    <button
                                        className="add-to-cart-btn"
                                        onClick={() => addToCart(product)}
                                    >
                                        🛒 Add to Cart
                                    </button>
                                    <button
                                        className="order-now-btn"
                                        onClick={() => navigate('/order')}
                                    >
                                        ⚡ Order Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="no-results">
                        <p>No products found matching your search.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}>
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Ecom;
