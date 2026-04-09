import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Ecom.css';
import supabaseClient from '../supabase-config';

function Ecom() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [showLogout, setShowLogout] = useState(false);

    // Mock products data (frontend only as requested)
    const [products] = useState([
        {
            id: 1,
            name: "Recycled Paper Notebook",
            description: "Eco-friendly notebook made from 100% recycled paper. 200 pages, spiral bound.",
            price: 149,
            originalPrice: 199,
            category: "Stationery",
            image: "📓",
            rating: 4.5,
            reviews: 89,
            stock: 150,
            ecoBadge: "Saves 2 trees",
            seller: "GreenPaper Co."
        },
        {
            id: 2,
            name: "Upcycled Glass Vase",
            description: "Beautiful hand-crafted vase made from recycled glass bottles. Unique design.",
            price: 499,
            originalPrice: 699,
            category: "Home Decor",
            image: "🏺",
            rating: 4.8,
            reviews: 124,
            stock: 45,
            ecoBadge: "100% Recycled Glass",
            seller: "Artisan Crafts"
        },
        {
            id: 3,
            name: "Recycled Plastic Planters (Set of 3)",
            description: "Durable planters made from recycled plastic. Perfect for home gardening.",
            price: 299,
            originalPrice: 399,
            category: "Garden",
            image: "🪴",
            rating: 4.3,
            reviews: 67,
            stock: 200,
            ecoBadge: "50 bottles recycled",
            seller: "EcoGarden India"
        },
        {
            id: 4,
            name: "Handmade Recycled Paper Bags",
            description: "Pack of 20 sturdy paper bags made from newspaper and scrap paper.",
            price: 99,
            originalPrice: 149,
            category: "Packaging",
            image: "🛍️",
            rating: 4.6,
            reviews: 234,
            stock: 500,
            ecoBadge: "Zero plastic",
            seller: "PaperCraft Mumbai"
        },
        {
            id: 5,
            name: "Recycled Metal Wall Art",
            description: "Intricate wall decoration crafted from scrap metal. Contemporary design.",
            price: 1299,
            originalPrice: 1799,
            category: "Home Decor",
            image: "🎨",
            rating: 4.9,
            reviews: 45,
            stock: 20,
            ecoBadge: "Metal scrap reused",
            seller: "MetalArt Studio"
        },
        {
            id: 6,
            name: "Eco-Friendly Jute Bag",
            description: "Stylable and durable jute shopping bag. Biodegradable and sustainable.",
            price: 199,
            originalPrice: 249,
            category: "Accessories",
            image: "👜",
            rating: 4.4,
            reviews: 156,
            stock: 300,
            ecoBadge: "100% Biodegradable",
            seller: "JuteCraft India"
        },
        {
            id: 7,
            name: "Recycled Cotton T-Shirt",
            description: "Comfortable t-shirt made from recycled cotton fabric. Unisex sizing.",
            price: 399,
            originalPrice: 599,
            category: "Clothing",
            image: "👕",
            rating: 4.7,
            reviews: 312,
            stock: 100,
            ecoBadge: "Saves 2700L water",
            seller: "ReThread Fashion"
        },
        {
            id: 8,
            name: "Bamboo Toothbrush (Pack of 4)",
            description: "Eco-friendly bamboo toothbrush with charcoal bristles. Plastic-free packaging.",
            price: 249,
            originalPrice: 349,
            category: "Personal Care",
            image: "🪥",
            rating: 4.5,
            reviews: 189,
            stock: 250,
            ecoBadge: "Plastic-free",
            seller: "BambooLife"
        },
        {
            id: 9,
            name: "Recycled Tire Planter",
            description: "Creative planter made from upcycled tires. Weather resistant.",
            price: 599,
            originalPrice: 799,
            category: "Garden",
            image: "🌱",
            rating: 4.2,
            reviews: 78,
            stock: 35,
            ecoBadge: "1 tire upcycled",
            seller: "TireCraft Designs"
        },
        {
            id: 10,
            name: "Newspaper Pencils (Box of 10)",
            description: "HB pencils made from rolled newspaper with plantable seeds on top.",
            price: 129,
            originalPrice: 179,
            category: "Stationery",
            image: "✏️",
            rating: 4.8,
            reviews: 267,
            stock: 400,
            ecoBadge: "Plantable seeds included",
            seller: "GreenWrite"
        },
        {
            id: 11,
            name: "Recycled Plastic Chair",
            description: "Modern outdoor chair made from 100% recycled plastic. UV resistant.",
            price: 1899,
            originalPrice: 2499,
            category: "Furniture",
            image: "🪑",
            rating: 4.6,
            reviews: 56,
            stock: 25,
            ecoBadge: "200 bottles recycled",
            seller: "PlasticRenew"
        },
        {
            id: 12,
            name: "Coconut Shell Bowls (Set of 4)",
            description: "Natural coconut shell bowls polished with coconut oil. Food safe.",
            price: 449,
            originalPrice: 599,
            category: "Kitchen",
            image: "🥥",
            rating: 4.9,
            reviews: 145,
            stock: 80,
            ecoBadge: "Zero waste product",
            seller: "CocoCraft"
        }
    ]);

    const categories = ['All', 'Stationery', 'Home Decor', 'Garden', 'Packaging', 'Accessories', 'Clothing', 'Personal Care', 'Furniture', 'Kitchen'];

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
        setLoading(false);
    }, [navigate]);

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const addToCart = (product) => {
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

    const removeFromCart = (productId) => {
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
                                <button className="checkout-btn">Proceed to Checkout</button>
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

                                <button
                                    className="add-to-cart-btn"
                                    onClick={() => addToCart(product)}
                                >
                                    🛒 Add to Cart
                                </button>
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
