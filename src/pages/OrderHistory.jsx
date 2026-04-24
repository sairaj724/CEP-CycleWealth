import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SharedNavbar from "../components/SharedNavbar";
import Footer from "../components/Footer";
import { getIndustryOrders, getIndustryOrderHistory } from "../services/enterpriseService";
import "./OrderHistory.css";

function OrderHistory() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
    const [error, setError] = useState(null);

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            try {
                const parsedUser = JSON.parse(sessionUser);
                setUser(parsedUser);
                loadOrders();
            } catch (e) {
                console.error('Error parsing user from session:', e);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const [active, history] = await Promise.all([
                getIndustryOrders(),
                getIndustryOrderHistory()
            ]);
            setActiveOrders(active || []);
            setOrderHistory(history || []);
        } catch (err) {
            console.error('Error loading orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { class: 'status-pending', label: '⏳ Pending' },
            accepted: { class: 'status-accepted', label: '✓ Accepted' },
            rejected: { class: 'status-rejected', label: '✕ Rejected' },
            countered: { class: 'status-countered', label: '↻ Countered' },
            fulfilled: { class: 'status-fulfilled', label: '✓ Fulfilled' },
            completed: { class: 'status-completed', label: '✓ Completed' },
            cancelled: { class: 'status-cancelled', label: '✕ Cancelled' }
        };
        
        const config = statusConfig[status] || { class: 'status-pending', label: status };
        return <span className={`status-badge ${config.class}`}>{config.label}</span>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatPrice = (price) => {
        if (!price) return 'Negotiable';
        return `₹${parseFloat(price).toFixed(2)}/unit`;
    };

    return (
        <>
            <SharedNavbar />
            <div className="order-history-page">
                <div className="order-history-header">
                    <h1>Order Management</h1>
                    <p>View and manage your scrap material orders</p>
                    <button 
                        className="place-new-order-btn"
                        onClick={() => navigate('/companyorder')}
                    >
                        + Place New Order
                    </button>
                </div>

                <div className="order-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Orders ({activeOrders.length})
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Order History ({orderHistory.length})
                    </button>
                </div>

                {loading ? (
                    <div className="loading-state">Loading orders...</div>
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : (
                    <div className="orders-container">
                        {activeTab === 'active' ? (
                            activeOrders.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📦</div>
                                    <h3>No Active Orders</h3>
                                    <p>You don't have any active orders at the moment.</p>
                                    <button 
                                        className="place-order-btn"
                                        onClick={() => navigate('/companyorder')}
                                    >
                                        Place Your First Order
                                    </button>
                                </div>
                            ) : (
                                <div className="orders-grid">
                                    {activeOrders.map(order => (
                                        <div key={order.order_id} className={`order-card ${order.status}`}>
                                            <div className="order-header">
                                                <div className="order-number">{order.order_number || 'ORD-' + order.order_id?.slice(0, 8)}</div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            
                                            <div className="order-details">
                                                <div className="detail-row">
                                                    <span className="label">Material:</span>
                                                    <span className="value">{order.material_type}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Quantity:</span>
                                                    <span className="value">{order.quantity} units</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Price:</span>
                                                    <span className="value">{formatPrice(order.final_price || order.price)}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Delivery:</span>
                                                    <span className="value">{order.City} - {formatDate(order.Prefered_Delivery_Date)}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Order Date:</span>
                                                    <span className="value">{formatDate(order.created_at)}</span>
                                                </div>
                                                {order.assigned_dealer_id && (
                                                    <div className="detail-row dealer">
                                                        <span className="label">Dealer:</span>
                                                        <span className="value">{order.dealer_name || 'Assigned'}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="order-actions">
                                                {order.status === 'pending' && (
                                                    <button className="cancel-btn" disabled>
                                                        Waiting for dealer...
                                                    </button>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button className="fulfilled-btn">
                                                        ✓ Order Accepted by Dealer
                                                    </button>
                                                )}
                                                {order.status === 'countered' && (
                                                    <button className="view-btn">
                                                        View Counter Offer
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            orderHistory.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📜</div>
                                    <h3>No Order History</h3>
                                    <p>Your completed and archived orders will appear here.</p>
                                </div>
                            ) : (
                                <div className="orders-grid">
                                    {orderHistory.map(order => (
                                        <div key={order.history_id} className={`order-card ${order.status} history`}>
                                            <div className="order-header">
                                                <div className="order-number">{order.order_number || 'ORD-' + order.order_id?.slice(0, 8)}</div>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            
                                            <div className="order-details">
                                                <div className="detail-row">
                                                    <span className="label">Material:</span>
                                                    <span className="value">{order.material_type}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Quantity:</span>
                                                    <span className="value">{order.quantity} units</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Final Price:</span>
                                                    <span className="value">{formatPrice(order.final_price || order.price)}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span className="label">Delivered To:</span>
                                                    <span className="value">{order.City}</span>
                                                </div>
                                                {order.dealer_name && (
                                                    <div className="detail-row dealer">
                                                        <span className="label">Fulfilled By:</span>
                                                        <span className="value">{order.dealer_name}</span>
                                                    </div>
                                                )}
                                                <div className="detail-row">
                                                    <span className="label">Completed:</span>
                                                    <span className="value">{formatDate(order.completed_at)}</span>
                                                </div>
                                            </div>

                                            {order.fulfillment_notes && (
                                                <div className="fulfillment-notes">
                                                    <strong>Notes:</strong> {order.fulfillment_notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
}

export default OrderHistory;
