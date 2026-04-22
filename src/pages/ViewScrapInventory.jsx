import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewScrapInventory.css';
import SharedNavbar from '../components/SharedNavbar';
import supabaseClient from '../supabase-config';

const STATUS_CONFIG = {
    collected: { label: 'Collected', color: '#4CAF50', bgColor: '#e8f5e9', icon: '📦' },
    send_for_recycling: { label: 'Send for Recycling', color: '#FF9800', bgColor: '#fff3e0', icon: '🚚' },
    recycled: { label: 'Recycled', color: '#2196F3', bgColor: '#e3f2fd', icon: '♻️' },
    upcycled: { label: 'Upcycled', color: '#9C27B0', bgColor: '#f3e5f5', icon: '✨' }
};

function ViewScrapInventory() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');

    useEffect(() => {
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);
        setCurrentUser(user);

        if (user.role !== 'ScrapDealer') {
            navigate('/dashboard');
            return;
        }

        fetchInventory(user.user_id);
        fetchCategories();
    }, [navigate]);

    const fetchInventory = async (userId) => {
        try {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from('scrap_inventory')
                .select(`
                    inventory_id,
                    weight,
                    status,
                    last_updated,
                    scrap_categories (category_id, scrap_type, description, quantity)
                `)
                .eq('owner_id', userId)
                .order('last_updated', { ascending: false });

            if (error) throw error;
            setInventory(data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            setError('Failed to load inventory data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabaseClient
                .from('scrap_categories')
                .select('*')
                .order('scrap_type', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async (inventoryId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const { error } = await supabaseClient
                .from('scrap_inventory')
                .delete()
                .eq('inventory_id', inventoryId);

            if (error) throw error;

            setInventory(prev => prev.filter(item => item.inventory_id !== inventoryId));
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item.');
        }
    };

    const handleStatusChange = async (inventoryId, newStatus) => {
        try {
            const { error } = await supabaseClient
                .from('scrap_inventory')
                .update({ status: newStatus, last_updated: new Date().toISOString() })
                .eq('inventory_id', inventoryId);

            if (error) throw error;

            setInventory(prev => prev.map(item =>
                item.inventory_id === inventoryId
                    ? { ...item, status: newStatus, last_updated: new Date().toISOString() }
                    : item
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
    };

    const getFilteredAndSortedInventory = () => {
        let filtered = inventory;

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(item => item.status === filterStatus);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(item => item.scrap_categories?.category_id === filterCategory);
        }

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.scrap_categories?.scrap_type?.toLowerCase().includes(term) ||
                item.status.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        const sorted = [...filtered];
        switch (sortBy) {
            case 'date_desc':
                sorted.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
                break;
            case 'date_asc':
                sorted.sort((a, b) => new Date(a.last_updated) - new Date(b.last_updated));
                break;
            case 'weight_desc':
                sorted.sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
                break;
            case 'weight_asc':
                sorted.sort((a, b) => parseFloat(a.weight) - parseFloat(b.weight));
                break;
            default:
                break;
        }

        return sorted;
    };

    const calculateTotals = () => {
        const totalWeight = inventory.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
        const totalItems = inventory.length;
        const statusCounts = inventory.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});
        return { totalWeight, totalItems, statusCounts };
    };

    const filteredInventory = getFilteredAndSortedInventory();
    const totals = calculateTotals();

    return (
        <div className="view-inventory-page">
            <SharedNavbar user={currentUser} />
            <div className="view-inventory-main">
                <div className="view-inventory-container">
                    {/* Header */}
                    <div className="page-header">
                        <button className="back-btn" onClick={() => navigate('/scrapdealer')}>
                            ← Back to Dashboard
                        </button>
                        <h1 className="page-title">📦 Scrap Inventory</h1>
                        <p className="page-subtitle">View and manage all your scrap collections</p>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading inventory...</p>
                        </div>
                    ) : error ? (
                        <div className="error-card">
                            <span className="error-icon">⚠️</span>
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="summary-cards">
                                <div className="summary-card total-items">
                                    <span className="summary-icon">📦</span>
                                    <div className="summary-info">
                                        <h3>{totals.totalItems}</h3>
                                        <p>Total Items</p>
                                    </div>
                                </div>
                                <div className="summary-card total-weight">
                                    <span className="summary-icon">⚖️</span>
                                    <div className="summary-info">
                                        <h3>{totals.totalWeight.toFixed(2)} kg</h3>
                                        <p>Total Weight</p>
                                    </div>
                                </div>
                                <div className="summary-card collected">
                                    <span className="summary-icon">📥</span>
                                    <div className="summary-info">
                                        <h3>{totals.statusCounts.collected || 0}</h3>
                                        <p>Collected</p>
                                    </div>
                                </div>
                                <div className="summary-card recycled">
                                    <span className="summary-icon">♻️</span>
                                    <div className="summary-info">
                                        <h3>{(totals.statusCounts.recycled || 0) + (totals.statusCounts.send_for_recycling || 0)}</h3>
                                        <p>Recycling</p>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & Search */}
                            <div className="filters-section">
                                <div className="search-box">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by material or status..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="filter-group">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="collected">Collected</option>
                                        <option value="send_for_recycling">Send for Recycling</option>
                                        <option value="recycled">Recycled</option>
                                        <option value="upcycled">Upcycled</option>
                                    </select>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat.category_id} value={cat.category_id}>
                                                {cat.scrap_type}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="date_desc">Newest First</option>
                                        <option value="date_asc">Oldest First</option>
                                        <option value="weight_desc">Heaviest First</option>
                                        <option value="weight_asc">Lightest First</option>
                                    </select>
                                </div>
                            </div>

                            {/* Inventory Grid */}
                            {filteredInventory.length > 0 ? (
                                <div className="inventory-grid">
                                    {filteredInventory.map((item) => {
                                        const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.collected;
                                        return (
                                            <div key={item.inventory_id} className="inventory-card">
                                                <div className="inventory-header">
                                                    <span
                                                        className="status-badge"
                                                        style={{
                                                            backgroundColor: statusConfig.bgColor,
                                                            color: statusConfig.color
                                                        }}
                                                    >
                                                        {statusConfig.icon} {statusConfig.label}
                                                    </span>
                                                    <div className="inventory-actions">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => navigate(`/edit-scrap/${item.inventory_id}`)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDelete(item.inventory_id)}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="inventory-body">
                                                    <h3 className="material-name">
                                                        {item.scrap_categories?.scrap_type || 'Unknown Material'}
                                                    </h3>
                                                    <p className="material-description">
                                                        {item.scrap_categories?.description || 'No description available'}
                                                    </p>

                                                    <div className="inventory-stats">
                                                        <div className="stat">
                                                            <span className="stat-label">Weight</span>
                                                            <span className="stat-value">{parseFloat(item.weight).toFixed(2)} kg</span>
                                                        </div>
                                                        <div className="stat">
                                                            <span className="stat-label">Date Added</span>
                                                            <span className="stat-value">
                                                                {new Date(item.last_updated).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="inventory-footer">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleStatusChange(item.inventory_id, e.target.value)}
                                                        className="status-select"
                                                        style={{ borderColor: statusConfig.color }}
                                                    >
                                                        <option value="collected">📦 Collected</option>
                                                        <option value="send_for_recycling">🚚 Send for Recycling</option>
                                                        <option value="recycled">♻️ Recycled</option>
                                                        <option value="upcycled">✨ Upcycled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <span className="empty-icon">📭</span>
                                    <h3>No Items Found</h3>
                                    <p>
                                        {inventory.length === 0
                                            ? "You haven't added any scrap collections yet."
                                            : "No items match your current filters."
                                        }
                                    </p>
                                    {inventory.length === 0 && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => navigate('/add-scrap')}
                                        >
                                            Add Your First Collection
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Results Count */}
                            {filteredInventory.length > 0 && (
                                <div className="results-footer">
                                    <p>
                                        Showing {filteredInventory.length} of {inventory.length} items
                                        {filterStatus !== 'all' && ` • Status: ${STATUS_CONFIG[filterStatus]?.label || filterStatus}`}
                                        {filterCategory !== 'all' && ` • Category: ${categories.find(c => c.category_id === filterCategory)?.scrap_type}`}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewScrapInventory;
