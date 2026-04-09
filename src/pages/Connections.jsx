import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import supabaseClient from '../supabase-config';
import SharedNavbar from '../components/SharedNavbar';
import './Connections.css';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (km) => {
    if (km === Infinity) return null;
    return km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;
};

const AVATAR_COLORS = [
    { bg: '#E6F1FB', color: '#0C447C' },
    { bg: '#E1F5EE', color: '#085041' },
    { bg: '#EEEDFE', color: '#3C3489' },
    { bg: '#FAECE7', color: '#712B13' },
    { bg: '#FBEAF0', color: '#72243E' },
    { bg: '#FAEEDA', color: '#633806' },
];

const getAvatarColor = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const Avatar = ({ firstName = '', lastName = '', size = 44 }) => {
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
    const { bg, color } = getAvatarColor(firstName + lastName);
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: bg, color, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.32, fontWeight: 500, flexShrink: 0,
        }}>
            {initials}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
function Connections() {
    const [allUsers, setAllUsers]           = useState([]);
    const [connections, setConnections]     = useState([]);
    const [currentUser, setCurrentUser]     = useState(null);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // connection_id or target_user_id
    const [error, setError]                 = useState('');
    const navigate = useNavigate();

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        const raw = sessionStorage.getItem('user');
        if (!raw) { navigate('/login'); return; }
        const user = JSON.parse(raw);
        setCurrentUser(user);
        fetchAllData(user);
    }, [navigate]);

    const fetchAllData = useCallback(async (user) => {
        setLoading(true);
        setError('');
        try {
            const [{ data: usersData, error: uErr }, { data: connData, error: cErr }] =
                await Promise.all([
                    supabaseClient
                        .from('users')
                        .select('user_id, "First name", Last_Name, role, email_address, latitude, longitude')
                        .neq('user_id', user.user_id)
                        .in('role', ['industries', 'artisens']),
                    supabaseClient
                        .from('connections')
                        .select('*')
                        .or(`requester_id.eq.${user.user_id},receiver_id.eq.${user.user_id}`),
                ]);

            if (uErr) throw uErr;
            if (cErr) throw cErr;

            console.log('=== DEBUG: Users Data Retrieved ===');
            console.log('Total users found:', usersData?.length || 0);
            console.log('Users data:', usersData);
            console.log('User roles:', usersData?.map(u => ({ id: u.user_id, role: u.role, name: `${u['First name']} ${u['Last_Name']}` })));

            console.log('=== DEBUG: Connections Data Retrieved ===');
            console.log('Total connections found:', connData?.length || 0);
            console.log('Connections data:', connData);

            // Sort by proximity
            const sorted = [...(usersData || [])].sort((a, b) =>
                calculateDistance(user.latitude, user.longitude, a.latitude, a.longitude) -
                calculateDistance(user.latitude, user.longitude, b.latitude, b.longitude)
            );

            console.log('=== DEBUG: Sorted Users ===');
            console.log('Sorted users:', sorted);

            setAllUsers(sorted);
            setConnections(connData || []);
        } catch (e) {
            setError('Failed to load data: ' + e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const getConnectionStatus = (targetId) => {
        const conn = connections.find(
            c => (c.requester_id === currentUser?.user_id && c.receiver_id === targetId) ||
                 (c.receiver_id === currentUser?.user_id && c.requester_id === targetId)
        );
        if (!conn) return null;
        return { ...conn, isSent: conn.requester_id === currentUser?.user_id };
    };

    const getUserById = (id) => allUsers.find(u => u.user_id === id);

    const receivedRequests  = connections.filter(c => c.receiver_id  === currentUser?.user_id && c.status === 'pending');
    const sentRequests      = connections.filter(c => c.requester_id === currentUser?.user_id && c.status === 'pending');
    const myNetwork         = connections.filter(c => c.status === 'accepted');

    console.log('=== DEBUG: Pending Requests Analysis ===');
    console.log('Received requests count:', receivedRequests.length);
    console.log('Sent requests count:', sentRequests.length);
    console.log('Total pending requests:', receivedRequests.length + sentRequests.length);
    console.log('Received requests:', receivedRequests);
    console.log('Sent requests:', sentRequests);

    const discoveryList = allUsers.filter(u => !getConnectionStatus(u.user_id));

    console.log('=== DEBUG: Discovery List ===');
    console.log('All users count:', allUsers.length);
    console.log('Discovery list count:', discoveryList.length);
    console.log('Discovery list:', discoveryList);
    console.log('Connection statuses for all users:', allUsers.map(u => ({
        id: u.user_id,
        name: `${u['First name']} ${u['Last_Name']}`,
        role: u.role,
        status: getConnectionStatus(u.user_id)
    })));

    // Count mutual connections (users both are connected to)
    const getMutualCount = (targetId) => {
        const myNetworkIds = myNetwork.map(c =>
            c.requester_id === currentUser?.user_id ? c.receiver_id : c.requester_id
        );
        const targetConnIds = connections
            .filter(c => (c.requester_id === targetId || c.receiver_id === targetId) && c.status === 'accepted')
            .map(c => c.requester_id === targetId ? c.receiver_id : c.requester_id);
        return myNetworkIds.filter(id => targetConnIds.includes(id)).length;
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleConnect = async (targetUserId) => {
        setActionLoading(targetUserId);
        try {
            const { error } = await supabaseClient
                .from('connections')
                .insert([{ requester_id: currentUser.user_id, receiver_id: targetUserId, status: 'pending' }]);
            if (error) {
                setError(error.code === '23505' ? 'Request already sent.' : error.message);
            } else {
                await fetchAllData(currentUser);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleConnectionResponse = async (connectionId, status) => {
        setActionLoading(connectionId);
        try {
            const { error } = await supabaseClient
                .from('connections')
                .update({ status })
                .eq('connection_id', connectionId);
            if (error) setError(error.message);
            else await fetchAllData(currentUser);
        } catch (e) {
            setError(e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleWithdraw = async (connectionId) => {
        setActionLoading(connectionId);
        try {
            console.log('=== DEBUG: Withdrawing Connection ===');
            console.log('Connection ID to withdraw:', connectionId);
            
            const { error } = await supabaseClient
                .from('connections')
                .delete()
                .eq('connection_id', connectionId);
                
            if (error) {
                console.error('Error withdrawing connection:', error);
                setError('Failed to withdraw request: ' + error.message);
            } else {
                console.log('Connection successfully withdrawn');
                await fetchAllData(currentUser);
            }
        } catch (e) {
            console.error('Exception in withdraw:', e);
            setError('Failed to withdraw request: ' + e.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const ConnectButton = ({ userId }) => {
        const conn = getConnectionStatus(userId);
        const busy = actionLoading === userId || (conn && actionLoading === conn.connection_id);

        if (!conn) return (
            <button
                className="conn-btn conn-btn--primary"
                onClick={() => handleConnect(userId)}
                disabled={busy}
            >
                {busy ? '…' : '+ Connect'}
            </button>
        );

        if (conn.status === 'pending' && conn.isSent) return (
            <button
                className="conn-btn conn-btn--pending"
                onClick={() => handleWithdraw(conn.connection_id)}
                disabled={busy}
                title="Click to withdraw"
            >
                {busy ? '…' : 'Pending'}
            </button>
        );

        if (conn.status === 'pending' && !conn.isSent) return (
            <div style={{ display: 'flex', gap: 6 }}>
                <button className="conn-btn conn-btn--accept" disabled={busy}
                    onClick={() => handleConnectionResponse(conn.connection_id, 'accepted')}>
                    {busy ? '…' : 'Accept'}
                </button>
                <button className="conn-btn conn-btn--ghost" disabled={busy}
                    onClick={() => handleConnectionResponse(conn.connection_id, 'rejected')}>
                    Decline
                </button>
            </div>
        );

        if (conn.status === 'accepted') return (
            <button className="conn-btn conn-btn--connected" disabled>Connected</button>
        );

        return null;
    };

    // ── Loading / error states ────────────────────────────────────────────────
    if (loading) return (
        <div className="connections-page">
            <div className="conn-loading">
                <div className="conn-spinner" />
                <p>Loading your network…</p>
            </div>
        </div>
    );

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="connections-page">

            {/* ── Shared Navbar ── */}
            <SharedNavbar activeLink="connections" badgeCount={receivedRequests.length} user={currentUser} />

            {/* ── Main layout ── */}
            <div className="conn-layout">

                {/* Left sidebar – user card */}
                <aside className="conn-sidebar">
                    <div className="conn-profile-card">
                        <div className="conn-profile-card__banner" />
                        <div className="conn-profile-card__body">
                            <Avatar
                                firstName={currentUser?.['First name']}
                                lastName={currentUser?.['Last_Name']}
                                size={52}
                            />
                            <h3 className="conn-profile-card__name">
                                {currentUser?.['First name']} {currentUser?.['Last_Name']}
                            </h3>
                            <p className="conn-profile-card__role">{currentUser?.role}</p>
                        </div>
                        <div className="conn-profile-card__stats">
                            <div className="conn-stat">
                                <span className="conn-stat__val">{myNetwork.length}</span>
                                <span className="conn-stat__label">Connections</span>
                            </div>
                            <div className="conn-stat">
                                <span className="conn-stat__val">{receivedRequests.length + sentRequests.length}</span>
                                <span className="conn-stat__label">Pending</span>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="conn-main">
                    {error && (
                        <div className="conn-alert" onClick={() => setError('')}>
                            {error} <span style={{ float: 'right', cursor: 'pointer' }}>×</span>
                        </div>
                    )}

                    {/* Section: Received requests */}
                    {receivedRequests.length > 0 && (
                        <section className="conn-section">
                            <h2 className="conn-section__title">
                                Connection requests
                                <span className="conn-badge">{receivedRequests.length}</span>
                            </h2>
                            {receivedRequests.map(req => {
                                const sender = getUserById(req.requester_id);
                                const mutual = getMutualCount(req.requester_id);
                                return (
                                    <div key={req.connection_id} className="conn-request-card">
                                        <Avatar
                                            firstName={sender?.['First name']}
                                            lastName={sender?.['Last_Name']}
                                        />
                                        <div className="conn-request-card__info">
                                            <p className="conn-request-card__name">
                                                {sender
                                                    ? `${sender['First name']} ${sender['Last_Name']}`
                                                    : `User #${req.requester_id}`}
                                            </p>
                                            <p className="conn-request-card__role">{sender?.role}</p>
                                            {mutual > 0 && (
                                                <p className="conn-mutual">{mutual} mutual connection{mutual !== 1 ? 's' : ''}</p>
                                            )}
                                            <p className="conn-request-card__date">
                                                {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <div className="conn-request-card__actions">
                                            <button
                                                className="conn-btn conn-btn--accept"
                                                disabled={actionLoading === req.connection_id}
                                                onClick={() => handleConnectionResponse(req.connection_id, 'accepted')}
                                            >
                                                {actionLoading === req.connection_id ? '…' : 'Accept'}
                                            </button>
                                            <button
                                                className="conn-btn conn-btn--ghost"
                                                disabled={actionLoading === req.connection_id}
                                                onClick={() => handleConnectionResponse(req.connection_id, 'rejected')}
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                    {/* Section: Discovery */}
                    <section className="conn-section">
                        <h2 className="conn-section__title">People near you</h2>
                        {discoveryList.length === 0 ? (
                            <p className="conn-empty">No new artisans or industries to discover.</p>
                        ) : (
                            discoveryList.map(user => {
                                const dist = calculateDistance(
                                    currentUser?.latitude, currentUser?.longitude,
                                    user.latitude, user.longitude
                                );
                                const mutual = getMutualCount(user.user_id);
                                return (
                                    <div key={user.user_id} className="conn-user-card">
                                        <Avatar firstName={user['First name']} lastName={user['Last_Name']} />
                                        <div className="conn-user-card__info">
                                            <p className="conn-user-card__name">
                                                {user['First name']} {user['Last_Name']}
                                            </p>
                                            <p className="conn-user-card__role">{user.role}</p>
                                            <div className="conn-user-card__meta">
                                                {formatDistance(dist) && (
                                                    <span>{formatDistance(dist)}</span>
                                                )}
                                                {mutual > 0 && (
                                                    <span className="conn-mutual">
                                                        {mutual} mutual
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ConnectButton userId={user.user_id} />
                                    </div>
                                );
                            })
                        )}
                    </section>

                    {/* Section: Sent requests */}
                    {sentRequests.length > 0 && (
                        <section className="conn-section">
                            <h2 className="conn-section__title">Sent requests</h2>
                            {sentRequests.map(req => {
                                const receiver = getUserById(req.receiver_id);
                                return (
                                    <div key={req.connection_id} className="conn-request-card">
                                        <Avatar
                                            firstName={receiver?.['First name']}
                                            lastName={receiver?.['Last_Name']}
                                        />
                                        <div className="conn-request-card__info">
                                            <p className="conn-request-card__name">
                                                {receiver
                                                    ? `${receiver['First name']} ${receiver['Last_Name']}`
                                                    : `User #${req.receiver_id}`}
                                            </p>
                                            <p className="conn-request-card__role">{receiver?.role}</p>
                                            <p className="conn-request-card__date">
                                                Sent {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                            <span className="conn-pill conn-pill--pending">Pending</span>
                                            <button
                                                className="conn-btn-text"
                                                disabled={actionLoading === req.connection_id}
                                                onClick={() => handleWithdraw(req.connection_id)}
                                            >
                                                Withdraw
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}
                </main>

                {/* Right sidebar – network */}
                <aside className="conn-sidebar">
                    <div className="conn-sidebar-card">
                        <h4 className="conn-sidebar-card__title">My network</h4>
                        {myNetwork.length === 0 ? (
                            <p className="conn-empty" style={{ padding: '0 14px 14px' }}>No connections yet.</p>
                        ) : (
                            myNetwork.map(conn => {
                                const otherId = conn.requester_id === currentUser?.user_id
                                    ? conn.receiver_id
                                    : conn.requester_id;
                                const other = getUserById(otherId);
                                return (
                                    <div key={conn.connection_id} className="conn-network-item">
                                        <Avatar
                                            firstName={other?.['First name']}
                                            lastName={other?.['Last_Name']}
                                            size={32}
                                        />
                                        <div>
                                            <p className="conn-network-item__name">
                                                {other
                                                    ? `${other['First name']} ${other['Last_Name']}`
                                                    : `User #${otherId}`}
                                            </p>
                                            <p className="conn-network-item__role">{other?.role}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </aside>

            </div>
        </div>
    );
}

export default Connections;