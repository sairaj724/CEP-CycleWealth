import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyOrders.css';

function MyOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // DUMMY DATA - Remove these 3 lines when connecting to real data
    const dummyOrders = [
        {
            order_id: '550e8400-e29b-41d4-a716-446655440000',
            total_amount: 1499,
            order_status: 'processing',
            created_at: '2026-04-22T10:30:00',
            items: [{ name: 'Recycled Paper Notebook', quantity: 2, price: 299 }]
        },
        {
            order_id: '550e8400-e29b-41d4-a716-446655440001',
            total_amount: 2599,
            order_status: 'shipped',
            created_at: '2026-04-20T15:45:00',
            items: [{ name: 'Upcycled Glass Vase', quantity: 1, price: 499 }, { name: 'Eco-Friendly Jute Bag', quantity: 1, price: 199 }]
        },
        {
            order_id: '550e8400-e29b-41d4-a716-446655440002',
            total_amount: 3999,
            order_status: 'delivered',
            created_at: '2026-04-15T09:00:00',
            items: [{ name: 'Recycled Metal Wall Art', quantity: 1, price: 1299 }, { name: 'Bamboo Toothbrush Pack', quantity: 3, price: 249 }]
        }
    ];

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        // TODO: Replace with real API call
        // const fetchOrders = async () => {
        //     const data = await getCustomerOrders();
        //     setOrders(data);
        //     setLoading(false);
        // };
        // fetchOrders();

        // DUMMY DATA - Remove this line when connecting to real data
        setOrders(dummyOrders);
        setLoading(false);
    }, [navigate]);

    const getStatusBadge = (status) => {
        const statusClasses = {
            processing: 'status-processing',
            shipped: 'status-shipped',
            delivered: 'status-delivered'
        };
        return <span className={`status-badge ${statusClasses[status] || ''}`}>{status}</span>;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="my-orders-page">
                <div className="loading">Loading your orders...</div>
            </div>
        );
    }

    return (
        <div className="my-orders-page">
            <header className="orders-header">
                <h1>My Orders</h1>
                <button className="back-btn" onClick={() => navigate('/consumer')}>
                    ← Back to Shop
                </button>
            </header>

            <div className="orders-container">
                {orders.length === 0 ? (
                    <div className="no-orders">
                        <p>No orders yet</p>
                        <button className="shop-btn" onClick={() => navigate('/ecom')}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div key={order.order_id} className="order-card">
                                <div className="order-header">
                                    <div className="order-info">
                                        <span className="order-id">Order #{order.order_id.slice(-8)}</span>
                                        <span className="order-date">{formatDate(order.created_at)}</span>
                                    </div>
                                    {getStatusBadge(order.order_status)}
                                </div>

                                <div className="order-items">
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="order-item">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-qty">Qty: {item.quantity}</span>
                                            <span className="item-price">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <span className="total-label">Total:</span>
                                    <span className="total-amount">₹{order.total_amount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyOrders;
