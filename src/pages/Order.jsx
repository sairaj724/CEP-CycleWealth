import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SharedNavbar from '../components/SharedNavbar';
import {
    getAvailableProducts,
    getProductById,
    createOrder,
    addProductToCart,
    removeProductFromCart,
    restoreAbandonedCartItems
} from '../services/orderService';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    MapPin,
    Phone,
    User,
    CreditCard,
    Banknote,
    ArrowRight,
    Package,
    CheckCircle,
    AlertCircle,
    X
} from 'lucide-react';
import './Order.css';

function Order() {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    // Store cart in sessionStorage for cleanup on page leave
    useEffect(() => {
        if (cart.length > 0) {
            sessionStorage.setItem('orderCart', JSON.stringify(cart));
        }
    }, [cart]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: Cart, 2: Address, 3: Review
    
    // Delivery address state
    const [deliveryAddress, setDeliveryAddress] = useState({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        landmark: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('COD');

    useEffect(() => {
        const init = async () => {
            const sessionUser = sessionStorage.getItem('user');
            if (!sessionUser) {
                navigate('/login');
                return;
            }
            const user = JSON.parse(sessionUser);
            setCurrentUser(user);

            // Pre-fill user info if available
            setDeliveryAddress(prev => ({
                ...prev,
                fullName: user["First name"] + " " + (user["Last_Name"] || ''),
                phone: user.phone || ''
            }));

            // Restore any abandoned cart items from previous sessions
            await restoreAbandonedCartItems();

            // Check for product ID in URL query params
            const params = new URLSearchParams(location.search);
            const productId = params.get('product');

            if (productId) {
                loadSingleProduct(productId);
            } else {
                loadProducts();
            }
        };

        init();

        // Cleanup: restore cart items to Available when leaving page without ordering
        return () => {
            const currentCart = JSON.parse(sessionStorage.getItem('orderCart') || '[]');
            currentCart.forEach(item => {
                removeProductFromCart(item.product_id);
            });
            sessionStorage.removeItem('orderCart');
        };
    }, [navigate, location.search]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await getAvailableProducts();
            setProducts(data);
        } catch (err) {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const loadSingleProduct = async (productId) => {
        try {
            setLoading(true);
            const product = await getProductById(productId);
            if (product) {
                setProducts([product]);
                // Auto-add to cart
                addToCart(product);
            } else {
                setError('Product not found or no longer available');
                loadProducts();
            }
        } catch (err) {
            setError('Failed to load product');
            loadProducts();
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (product) => {
        if (cart.length >= 3) {
            setError('Maximum 3 items allowed per order');
            return;
        }

        const existingItem = cart.find(item => item.product_id === product.product_id);
        if (existingItem) {
            setError('This product is already in your cart');
            return;
        }

        // Update product status to 'incart' in database
        const success = await addProductToCart(product.product_id);
        if (!success) {
            setError('This product is no longer available');
            // Refresh products to remove unavailable item from list
            loadProducts();
            return;
        }

        setCart([...cart, {
            product_id: product.product_id,
            name: product.name,
            description: product.description,
            price: product.listed_price,
            quantity: product.quantity || '1 item',
            artisan: product.skilledlabor_profile,
            orderQuantity: 1
        }]);
        setError('');
    };

    const removeFromCart = async (productId) => {
        // Update product status back to 'Available' in database
        await removeProductFromCart(productId);

        setCart(cart.filter(item => item.product_id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const newQuantity = Math.max(1, item.orderQuantity + delta);
                return { ...item, orderQuantity: newQuantity };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price || 0) * item.orderQuantity, 0);
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setDeliveryAddress(prev => ({ ...prev, [name]: value }));
    };

    const validateAddress = () => {
        const { fullName, phone, street, city, state, pinCode } = deliveryAddress;
        if (!fullName || !phone || !street || !city || !state || !pinCode) {
            setError('Please fill in all required address fields');
            return false;
        }
        if (phone.length < 10) {
            setError('Please enter a valid phone number');
            return false;
        }
        if (pinCode.length < 6) {
            setError('Please enter a valid PIN code');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (cart.length === 0) {
                setError('Please add at least one item to your order');
                return;
            }
            setError('');
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!validateAddress()) return;
            setError('');
            setCurrentStep(3);
        }
    };

    const handlePrevStep = () => {
        setError('');
        setCurrentStep(currentStep - 1);
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) {
            setError('Your cart is empty');
            return;
        }

        setSaving(true);
        setError('');

        try {
            console.log('Placing order with deliveryAddress:', deliveryAddress);
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.orderQuantity
                })),
                deliveryAddress,
                paymentMethod
            };
            console.log('Order data being sent:', orderData);

            const result = await createOrder(orderData);
            setSuccess('Order placed successfully! Order ID: ' + result.order.order_id);
            setCart([]);
            sessionStorage.removeItem('orderCart');
            setCurrentStep(1);
            
            // Redirect to order confirmation after 2 seconds
            setTimeout(() => {
                navigate('/my-orders');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to place order. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="order-page">
                <SharedNavbar activeLink="order" />
                <div className="order-loading">
                    <div className="spinner"></div>
                    <p>Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="order-page">
            <SharedNavbar activeLink="order" />
            
            <div className="order-container">
                <div className="order-header">
                    <h1 className="order-title">
                        <ShoppingCart size={28} style={{ marginRight: '12px' }} />
                        Place Your Order
                    </h1>
                    <p className="order-subtitle">Order upcycled products from skilled artisans (Max 3 items)</p>
                </div>

                {/* Progress Steps */}
                <div className="order-steps">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                        <span className="step-label">Cart</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                        <span className="step-label">Address</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                        <span className="step-label">Review</span>
                    </div>
                </div>

                {error && (
                    <div className="order-alert error">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="order-alert success">
                        <CheckCircle size={20} />
                        {success}
                    </div>
                )}

                {/* Step 1: Cart */}
                {currentStep === 1 && (
                    <div className="order-content">
                        {/* Cart Items */}
                        <div className="cart-section">
                            <h2 className="section-title">
                                <ShoppingCart size={20} style={{ marginRight: '8px' }} />
                                Shopping Cart ({cart.length}/3 items)
                            </h2>
                            
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <Package size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
                                    <p>Your cart is empty</p>
                                    <p className="empty-subtext">Browse products below to add items</p>
                                </div>
                            ) : (
                                <div className="cart-items">
                                    {cart.map((item, index) => (
                                        <div key={item.product_id} className="cart-item">
                                            <div className="cart-item-number">{index + 1}</div>
                                            <div className="cart-item-details">
                                                <h3>{item.name}</h3>
                                                <p className="artisan-info">
                                                    By {item.artisan?.first_name} {item.artisan?.last_name} 
                                                    ({item.artisan?.city}, {item.artisan?.state})
                                                </p>
                                                <p className="quantity-text">Available: {item.quantity}</p>
                                            </div>
                                            <div className="cart-item-actions">
                                                <div className="quantity-control">
                                                    <button 
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.product_id, -1)}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="qty-value">{item.orderQuantity}</span>
                                                    <button 
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.product_id, 1)}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <div className="item-price">₹{(item.price * item.orderQuantity).toFixed(2)}</div>
                                                <button 
                                                    className="remove-btn"
                                                    onClick={() => removeFromCart(item.product_id)}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="cart-total">
                                        <span>Total Amount:</span>
                                        <span className="total-price">₹{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Available Products */}
                        {cart.length < 3 && (
                            <div className="products-section">
                                <h2 className="section-title">
                                    <Package size={20} style={{ marginRight: '8px' }} />
                                    Available Products
                                </h2>
                                <div className="products-grid">
                                    {products
                                        .filter(p => !cart.find(item => item.product_id === p.product_id))
                                        .map(product => (
                                            <div key={product.product_id} className="product-card">
                                                <div className="product-info">
                                                    <h3>{product.name}</h3>
                                                    <p className="product-desc">{product.description}</p>
                                                    <p className="artisan-name">
                                                        By {product.skilledlabor_profile?.first_name} {product.skilledlabor_profile?.last_name}
                                                    </p>
                                                    <p className="location-text">
                                                        <MapPin size={12} style={{ marginRight: '4px' }} />
                                                        {product.skilledlabor_profile?.city}, {product.skilledlabor_profile?.state}
                                                    </p>
                                                </div>
                                                <div className="product-actions">
                                                    <span className="product-price">₹{product.listed_price}</span>
                                                    <span className="product-qty">Qty: {product.quantity || 'N/A'}</span>
                                                    <button 
                                                        className="add-to-cart-btn"
                                                        onClick={() => addToCart(product)}
                                                    >
                                                        <Plus size={16} style={{ marginRight: '4px' }} />
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                {products.filter(p => !cart.find(item => item.product_id === p.product_id)).length === 0 && (
                                    <p className="no-products">No more products available</p>
                                )}
                            </div>
                        )}

                        <div className="step-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => navigate('/ecom')}
                            >
                                Continue Shopping
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleNextStep}
                                disabled={cart.length === 0}
                            >
                                Proceed to Address
                                <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Delivery Address */}
                {currentStep === 2 && (
                    <div className="order-content">
                        <div className="address-section">
                            <h2 className="section-title">
                                <MapPin size={20} style={{ marginRight: '8px' }} />
                                Delivery Address
                            </h2>
                            
                            <div className="address-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>
                                            <User size={14} style={{ marginRight: '6px' }} />
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={deliveryAddress.fullName}
                                            onChange={handleAddressChange}
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>
                                            <Phone size={14} style={{ marginRight: '6px' }} />
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={deliveryAddress.phone}
                                            onChange={handleAddressChange}
                                            placeholder="10-digit mobile number"
                                            maxLength="10"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group full-width">
                                    <label>
                                        <MapPin size={14} style={{ marginRight: '6px' }} />
                                        Street Address *
                                    </label>
                                    <input
                                        type="text"
                                        name="street"
                                        value={deliveryAddress.street}
                                        onChange={handleAddressChange}
                                        placeholder="House/Flat No, Building, Street, Area"
                                        required
                                    />
                                </div>
                                
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City *</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={deliveryAddress.city}
                                            onChange={handleAddressChange}
                                            placeholder="City"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State *</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={deliveryAddress.state}
                                            onChange={handleAddressChange}
                                            placeholder="State"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>PIN Code *</label>
                                        <input
                                            type="text"
                                            name="pinCode"
                                            value={deliveryAddress.pinCode}
                                            onChange={handleAddressChange}
                                            placeholder="6-digit PIN"
                                            maxLength="6"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group full-width">
                                    <label>Landmark (Optional)</label>
                                    <input
                                        type="text"
                                        name="landmark"
                                        value={deliveryAddress.landmark}
                                        onChange={handleAddressChange}
                                        placeholder="Nearby landmark (e.g., Near XYZ School, Opposite ABC Mall)"
                                    />
                                </div>
                            </div>

                            <h3 className="payment-title">Payment Method</h3>
                            <div className="payment-options">
                                <label className={`payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentMethod === 'COD'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <Banknote size={24} />
                                    <div>
                                        <span className="payment-label">Cash on Delivery</span>
                                        <span className="payment-desc">Pay when you receive</span>
                                    </div>
                                </label>
                                <label className={`payment-option ${paymentMethod === 'ONLINE' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="ONLINE"
                                        checked={paymentMethod === 'ONLINE'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <CreditCard size={24} />
                                    <div>
                                        <span className="payment-label">Online Payment</span>
                                        <span className="payment-desc">Pay via UPI/Card/Netbanking</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={handlePrevStep}
                            >
                                Back to Cart
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleNextStep}
                            >
                                Review Order
                                <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review and Place Order */}
                {currentStep === 3 && (
                    <div className="order-content">
                        <div className="review-section">
                            <h2 className="section-title">
                                <CheckCircle size={20} style={{ marginRight: '8px' }} />
                                Review Your Order
                            </h2>
                            
                            {/* Order Items */}
                            <div className="review-items">
                                <h3>Order Items ({cart.length})</h3>
                                {cart.map((item, index) => (
                                    <div key={item.product_id} className="review-item">
                                        <div className="review-item-number">{index + 1}</div>
                                        <div className="review-item-details">
                                            <h4>{item.name}</h4>
                                            <p>By {item.artisan?.first_name} {item.artisan?.last_name}</p>
                                            <p>Qty: {item.orderQuantity} × ₹{item.price}</p>
                                        </div>
                                        <div className="review-item-price">
                                            ₹{(item.price * item.orderQuantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                                <div className="review-total">
                                    <span>Order Total:</span>
                                    <span>₹{calculateTotal().toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="review-address">
                                <h3>Delivery Address</h3>
                                <div className="address-card">
                                    <p className="address-name">{deliveryAddress.fullName}</p>
                                    <p className="address-phone">
                                        <Phone size={14} style={{ marginRight: '6px' }} />
                                        {deliveryAddress.phone}
                                    </p>
                                    <p className="address-text">
                                        {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pinCode}
                                    </p>
                                    {deliveryAddress.landmark && (
                                        <p className="address-landmark">Landmark: {deliveryAddress.landmark}</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="review-payment">
                                <h3>Payment Method</h3>
                                <div className="payment-card">
                                    {paymentMethod === 'COD' ? (
                                        <><Banknote size={20} /> Cash on Delivery</>
                                    ) : (
                                        <><CreditCard size={20} /> Online Payment</>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={handlePrevStep}
                                disabled={saving}
                            >
                                Edit Details
                            </button>
                            <button 
                                className="btn btn-success"
                                onClick={handlePlaceOrder}
                                disabled={saving}
                            >
                                {saving ? 'Placing Order...' : (
                                    <>
                                        Place Order
                                        <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Order;
