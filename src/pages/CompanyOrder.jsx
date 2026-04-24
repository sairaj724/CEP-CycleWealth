import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SharedNavbar from "../components/SharedNavbar";
import Footer from "../components/Footer";
import { createIndustryOrder, getIndustryProfile, getIndustryOrder } from "../services/enterpriseService";
import "./CompanyOrder.css";

function CompanyOrder() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [existingOrder, setExistingOrder] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [orderData, setOrderData] = useState({
        material: '',
        quantity: '',
        unit: 'kg',
        preferredPrice: '',
        address: '',
        city: '',
        pincode: '',
        preferredDate: '',
        contactName: '',
        contactPhone: ''
    });

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            try {
                const parsedUser = JSON.parse(sessionUser);
                setUser(parsedUser);
                checkProfileAndLoadOrder();
            } catch (e) {
                console.error('Error parsing user from session:', e);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const checkProfileAndLoadOrder = async () => {
        try {
            const profile = await getIndustryProfile();
            if (!profile) {
                alert('Please complete enterprise registration first!');
                navigate('/enterprise');
                return;
            }
            sessionStorage.setItem('enterpriseRegistered', 'true');
            
            // Load existing order (one per industry)
            const order = await getIndustryOrder();
            setExistingOrder(order);
        } catch (err) {
            console.error('Error checking profile:', err);
        }
    };

    const handleOrderChange = (field, value) => {
        setOrderData(prev => ({ ...prev, [field]: value }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrderData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Create order with all fields from schema
            await createIndustryOrder({
                materialType: orderData.material,
                quantity: orderData.quantity,
                price: orderData.preferredPrice || null,
                deliveryDetails: orderData.address,
                city: orderData.city,
                pincode: orderData.pincode,
                preferredDate: orderData.preferredDate,
                personName: orderData.contactName,
                phoneNo: orderData.contactPhone
            });

            const confirmView = confirm('Your scrap order has been submitted successfully! Dealers will contact you shortly.\n\nWould you like to view all your orders?');
            
            if (confirmView) {
                navigate('/orderhistory');
                return;
            }
            
            // Reset form
            setOrderData({
                material: '',
                quantity: '',
                unit: 'kg',
                preferredPrice: '',
                address: '',
                city: '',
                pincode: '',
                preferredDate: '',
                contactName: '',
                contactPhone: ''
            });

            setShowForm(false);
        } catch (err) {
            console.error('Error submitting order:', err);
            const errorMsg = err.message || 'Failed to submit order. Please try again.';
            setError(errorMsg);
            
            // Show specific alert for constraint violation
            if (errorMsg.includes('already have an active order')) {
                alert('⚠️ ' + errorMsg + '\n\nYou can view your existing order or wait for it to be completed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SharedNavbar user={user} activeLink="companyorder" />
            
            {/* Hero Section */}
            <div className="company-order-hero">
                <div className="company-order-hero-content">
                    <h1>Place Your Scrap Orders</h1>
                    <p>Order quality scrap materials from verified dealers at competitive prices. Place multiple orders and track them all.</p>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="error-banner" style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', margin: '1rem auto', maxWidth: '800px', borderRadius: '8px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {/* Order Display Section */}
            {!showForm && (
                <div className="company-order-section">
                    <div className="order-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h2>My Orders</h2>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button 
                                    className="add-item-btn"
                                    onClick={() => navigate('/orderhistory')}
                                    style={{ background: '#3b82f6' }}
                                >
                                    📦 View All Orders
                                </button>
                                <button 
                                    className="add-item-btn"
                                    onClick={() => setShowForm(true)}
                                >
                                    + New Order
                                </button>
                            </div>
                        </div>
                        
                        {!existingOrder ? (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                <p>No recent order. Click "New Order" to place a scrap order!</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                    You can place multiple orders and view them all in your order history.
                                </p>
                            </div>
                        ) : (
                            <div className="order-item-card">
                                <div className="item-header">
                                    <span className="item-number">Order ID: {existingOrder.order_id?.slice(0, 8)}...</span>
                                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                        {existingOrder.created_at ? new Date(existingOrder.created_at).toLocaleDateString() : 'Pending'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
                                    <div>
                                        <small style={{ color: '#6b7280' }}>Material</small>
                                        <p style={{ fontWeight: '500' }}>{existingOrder.material_type}</p>
                                    </div>
                                    <div>
                                        <small style={{ color: '#6b7280' }}>Quantity</small>
                                        <p style={{ fontWeight: '500' }}>{existingOrder.quantity}</p>
                                    </div>
                                    <div>
                                        <small style={{ color: '#6b7280' }}>Price</small>
                                        <p style={{ fontWeight: '500' }}>₹{existingOrder.price || 'N/A'}</p>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                                    <small style={{ color: '#6b7280' }}>Delivery Details</small>
                                    <p>{existingOrder.delivery_details}, {existingOrder['City']} - {existingOrder['PIN_code']}</p>
                                    <p>Contact: {existingOrder['Person_name']} ({existingOrder.phone_no})</p>
                                    <p>Preferred Date: {existingOrder['Prefered_Delivery_Date']}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Order Form Section */}
            {showForm && (
            <div className="company-order-section">
                <div className="order-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Create New Order</h2>
                        <button 
                            type="button"
                            className="remove-item-btn"
                            onClick={() => setShowForm(false)}
                        >
                            ✕ Cancel
                        </button>
                    </div>
                    <p className="order-subtitle">Fill in the details for your scrap material requirements</p>
                    
                    <form onSubmit={handleSubmit}>
                        {/* Order Item */}
                        <div className="order-items-section">
                            <h3>Scrap Material Required</h3>
                            
                            <div className="order-item-card">
                                <div className="item-row">
                                    <div className="form-group">
                                        <label>Material Type*</label>
                                        <select 
                                            value={orderData.material} 
                                            onChange={(e) => handleOrderChange('material', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Material</option>
                                            <option value="metal-ferrous">Metal - Ferrous (Iron, Steel)</option>
                                            <option value="metal-nonferrous">Metal - Non-Ferrous (Aluminum, Copper, Brass)</option>
                                            <option value="plastic">Plastic (All Types)</option>
                                            <option value="paper">Paper & Cardboard</option>
                                            <option value="glass">Glass</option>
                                            <option value="ewaste">E-Waste (Electronics)</option>
                                            <option value="rubber">Rubber & Tires</option>
                                            <option value="wood">Wood & Timber</option>
                                            <option value="textile">Textile & Fabric</option>
                                            <option value="battery">Batteries</option>
                                            <option value="cable">Cables & Wires</option>
                                            <option value="mixed">Mixed Scrap</option>
                                        </select>
                                    </div>
                                    
                                    <div className="form-group quantity-group">
                                        <label>Quantity*</label>
                                        <div className="quantity-input">
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={orderData.quantity}
                                                onChange={handleInputChange}
                                                placeholder="Amount"
                                                required
                                            />
                                            <select 
                                                name="unit"
                                                value={orderData.unit}
                                                onChange={handleInputChange}
                                            >
                                                <option value="kg">kg</option>
                                                <option value="tons">tons</option>
                                                <option value="pieces">pieces</option>
                                                <option value="bales">bales</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="item-row">
                                    <div className="form-group">
                                        <label>Preferred Price (₹/{orderData.unit})</label>
                                        <input
                                            type="number"
                                            name="preferredPrice"
                                            value={orderData.preferredPrice}
                                            onChange={handleInputChange}
                                            placeholder="Enter price per unit"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="delivery-section">
                            <h3>Delivery Details</h3>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Delivery Address*</label>
                                    <textarea
                                        name="address"
                                        value={orderData.address}
                                        onChange={handleInputChange}
                                        placeholder="Enter full delivery address"
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>City*</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={orderData.city}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PIN Code*</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={orderData.pincode}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Preferred Delivery Date*</label>
                                    <input
                                        type="date"
                                        name="preferredDate"
                                        value={orderData.preferredDate}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Contact Person Name*</label>
                                    <input
                                        type="text"
                                        name="contactName"
                                        value={orderData.contactName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Contact Phone*</label>
                                    <input
                                        type="tel"
                                        name="contactPhone"
                                        value={orderData.contactPhone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    {/* Empty placeholder */}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="order-submit-section">
                            <button 
                                type="submit" 
                                className="submit-order-btn"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Order Request'}
                            </button>
                            <p className="submit-note">
                                By submitting, you agree to our terms. Verified dealers will contact you with quotes.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
            )}

            {/* Quick Info Section */}
            <div className="quick-info-section">
                <div className="info-grid">
                    <div className="info-card">
                        <div className="info-icon">🚚</div>
                        <h3>Fast Delivery</h3>
                        <p>Get scrap materials delivered to your facility within 3-5 business days</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">💯</div>
                        <h3>Quality Assured</h3>
                        <p>All materials are inspected and graded before delivery</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">💰</div>
                        <h3>Best Prices</h3>
                        <p>Competitive pricing with bulk order discounts available</p>
                    </div>
                    <div className="info-card">
                        <div className="info-icon">📞</div>
                        <h3>24/7 Support</h3>
                        <p>Our team is available round the clock for assistance</p>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default CompanyOrder;
