import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import './scrapDealer.css';
import '../components/SharedNavbar.css'
import Navbar2 from '../components/Navbar2';
import supabaseClient from '../supabase-config';

// Colors for pie chart
const COLORS = ['#0f9d58', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#FF9800', '#2196F3', '#9C27B0'];

function ScrapDealer() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({
        totalCollected: 0,
        sentToRecycling: 0,
        remaining: 0,
        materialStats: []
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Get logged in user from sessionStorage
        const sessionUser = sessionStorage.getItem('user');
        if (!sessionUser) {
            navigate('/login');
            return;
        }

        const user = JSON.parse(sessionUser);
        setCurrentUser(user);

        // Verify user is a scrap dealer
        if (user.role !== 'ScrapDealer') {
            navigate('/dashboard');
            return;
        }

        fetchDealerData(user.user_id);
    }, [navigate]);

    const fetchDealerData = async (userId) => {
        try {
            setLoading(true);

            const { data: profileData, error: profileError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (profileError) throw profileError;

            setProfile({
                businessName: profileData["First name"] + " " + profileData["Last_Name"],
                ownerName: profileData["First name"] + " " + profileData["Last_Name"],
                firstName: profileData["First name"],
                lastName: profileData["Last_Name"],
                email: profileData.email_address,
                role: profileData.role,
                latitude: profileData.latitude,
                longitude: profileData.longitude,
                joinedDate: new Date(profileData.created_at).toLocaleDateString()
            });

            const { data: transactionsData, error: transactionsError } = await supabaseClient
                .from('transactions')
                .select('*')
                .eq('dealer_id', userId)
                .order('created_at', { ascending: false });

            if (transactionsError && transactionsError.code !== 'PGRST116') {
                console.log('Transactions table not found, using calculated stats');
            }

            if (transactionsData) {
                setTransactions(transactionsData);
                calculateStats(transactionsData);
            } else {
                // Fallback: Calculate stats from mock transactions or set to 0
                setStats({
                    totalCollected: 0,
                    sentToRecycling: 0,
                    remaining: 0,
                    materialStats: []
                });
            }

        } catch (error) {
            setError("Failed to load dealer data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (transactionsData) => {
        const totalCollected = transactionsData.reduce((sum, t) => sum + (t.weight_kg || 0), 0);
        const sentToRecycling = transactionsData
            .filter(t => t.status === 'sent_to_recycling')
            .reduce((sum, t) => sum + (t.weight_kg || 0), 0);
        const remaining = totalCollected - sentToRecycling;

        // Group by material type for pie chart
        const materialGroups = transactionsData.reduce((acc, t) => {
            const material = t.material_type || 'Unknown';
            if (!acc[material]) acc[material] = 0;
            acc[material] += t.weight_kg || 0;
            return acc;
        }, {});

        const materialStats = Object.entries(materialGroups).map(([name, value]) => ({
            name,
            value: Math.round(value)
        })).sort((a, b) => b.value - a.value);

        setStats({
            totalCollected,
            sentToRecycling,
            remaining,
            materialStats
        });
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    const handleAddCollection = () => {
        navigate('/scrapflow');
    };

    const handleViewConnections = () => {
        navigate('/connections');
    };

    if (loading) {
        return (
            <div className="scrap-dealer-page">
                <Navbar2 user={currentUser} />
                <div className="scrap-dealer-main loading-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading your dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="scrap-dealer-page">
                <Navbar2 user={currentUser} />
                <div className="scrap-dealer-main error-container">
                    <div className="error-card">
                        <span className="error-icon">⚠️</span>
                        <h3>Oops! Something went wrong</h3>
                        <p>{error}</p>
                        <button onClick={() => navigate('/login')} className="btn-primary">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="scrap-dealer-page">
                <Navbar2 user={currentUser} />
                <div className="scrap-dealer-main error-container">
                    <div className="error-card">
                        <span className="error-icon">👤</span>
                        <h3>No Profile Data</h3>
                        <p>Please log in again to access your dashboard.</p>
                        <button onClick={() => navigate('/login')} className="btn-primary">
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="scrap-dealer-page">
            <Navbar2 user={currentUser} />
            <div className="scrap-dealer-main">
                <div className="scrap-dealer-container">
                    {/* Welcome Banner */}
                    <div className="welcome-banner">
                        <div className="welcome-content">
                            <h1>Welcome back, {profile.firstName}! 👋</h1>
                            <p>Manage your scrap collection and track your recycling progress</p>
                        </div>
                        <div className="quick-actions">
                            <button className="quick-action-btn primary" onClick={handleViewConnections}>
                                <span>➕</span>
                                Add Collection
                            </button>
                            <button className="quick-action-btn secondary" onClick={handleViewConnections}>
                                <span>🔗</span>
                                Connections
                            </button>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="dealer-section profile-section">
                        <div className="section-header">
                            <h2 className="section-title">🏪 Business Profile</h2>
                        </div>
                        <div className="profile-card">
                            <div className="dealer-header">
                                <div className="dealer-avatar">
                                    {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                </div>
                                <div className="dealer-title">
                                    <h2>{profile.businessName}</h2>
                                    <p className="role-badge">{profile.role}</p>
                                </div>
                            </div>

                            <div className="dealer-info-grid">
                                <div className="profile-info-item">
                                    <span className="info-label">📧 Email</span>
                                    <p>{profile.email}</p>
                                </div>
                                <div className="profile-info-item">
                                    <span className="info-label">📅 Member Since</span>
                                    <p>{profile.joinedDate}</p>
                                </div>
                                <div className="profile-info-item">
                                    <span className="info-label">♻️ Total Collections</span>
                                    <p>{transactions.length} transactions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div className="dealer-section">
                        <h2 className="section-title">📊 Scrap Collection Statistics</h2>

                        <div className="stats-grid">
                            <div className="stat-card collected">
                                <div className="stat-value">{stats.totalCollected.toLocaleString()}</div>
                                <div className="stat-label">kg Total Collected</div>
                            </div>
                            <div className="stat-card recycling">
                                <div className="stat-value">{stats.sentToRecycling.toLocaleString()}</div>
                                <div className="stat-label">kg Sent to Recycling</div>
                            </div>
                            <div className="stat-card remaining">
                                <div className="stat-value">{stats.remaining.toLocaleString()}</div>
                                <div className="stat-label">kg Remaining</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-container">
                            <p className="progress-label">
                                Recycling Progress: {stats.totalCollected > 0
                                    ? Math.round((stats.sentToRecycling / stats.totalCollected) * 100)
                                    : 0}%
                            </p>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${stats.totalCollected > 0
                                            ? (stats.sentToRecycling / stats.totalCollected) * 100
                                            : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>

                        {/* Pie Chart - Material Distribution */}
                        {stats.materialStats.length > 0 && (
                            <div className="charts-grid">
                                <div className="chart-container">
                                    <h3 className="chart-title">📦 Material Distribution</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={stats.materialStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                                animationBegin={0}
                                                animationDuration={800}
                                            >
                                                {stats.materialStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => `${value} kg`}
                                                contentStyle={{ backgroundColor: '#fff', border: '2px solid #0f9d58' }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="chart-container">
                                    <h3 className="chart-title">📊 Material Breakdown (Bar Chart)</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart data={stats.materialStats}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                                interval={0}
                                            />
                                            <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip
                                                formatter={(value) => `${value} kg`}
                                                contentStyle={{ backgroundColor: '#fff', border: '2px solid #0f9d58' }}
                                            />
                                            <Bar dataKey="value" fill="#0f9d58" radius={[12, 12, 0, 0]} animationDuration={800} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Collection Status Chart */}
                        {stats.totalCollected > 0 && (
                            <div className="chart-container full-width">
                                <h3 className="chart-title">♻️ Collection Status Overview</h3>
                                <div className="status-overview">
                                    <div className="status-item">
                                        <div className="status-icon collected-icon">📥</div>
                                        <div className="status-details">
                                            <p className="status-value">{stats.totalCollected.toLocaleString()} kg</p>
                                            <p className="status-name">Total Collected</p>
                                            <p className="status-percentage">100%</p>
                                        </div>
                                    </div>
                                    <div className="status-arrow">→</div>
                                    <div className="status-item">
                                        <div className="status-icon recycling-icon">♻️</div>
                                        <div className="status-details">
                                            <p className="status-value">{stats.sentToRecycling.toLocaleString()} kg</p>
                                            <p className="status-name">Sent to Recycling</p>
                                            <p className="status-percentage">{stats.totalCollected > 0 ? Math.round((stats.sentToRecycling / stats.totalCollected) * 100) : 0}%</p>
                                        </div>
                                    </div>
                                    <div className="status-arrow">→</div>
                                    <div className="status-item">
                                        <div className="status-icon remaining-icon">📦</div>
                                        <div className="status-details">
                                            <p className="status-value">{stats.remaining.toLocaleString()} kg</p>
                                            <p className="status-name">Remaining</p>
                                            <p className="status-percentage">{stats.totalCollected > 0 ? Math.round((stats.remaining / stats.totalCollected) * 100) : 0}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Transactions */}
                        {transactions.length > 0 ? (
                            <div className="transactions-section">
                                <div className="section-header">
                                    <h3 className="transactions-title">📋 Recent Transactions</h3>
                                    <button className="view-all-btn" onClick={() => navigate('/transactions')}>
                                        View All →
                                    </button>
                                </div>
                                <div className="transactions-list">
                                    {transactions.slice(0, 5).map((transaction, index) => (
                                        <div key={index} className="transaction-item">
                                            <div className="transaction-info">
                                                <span className="material-type">{transaction.material_type || 'Unknown Material'}</span>
                                                <span className="transaction-date">
                                                    {new Date(transaction.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span className={`transaction-weight ${transaction.status}`}>
                                                {transaction.weight_kg} kg
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty-state-card">
                                <span className="empty-icon">📭</span>
                                <h3>No Transactions Yet</h3>
                                <p>Start adding your scrap collections to see them here.</p>
                                <button className="btn-primary" onClick={handleAddCollection}>
                                    Add Your First Collection
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


export default ScrapDealer;