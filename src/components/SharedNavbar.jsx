import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import './SharedNavbar.css';

function SharedNavbar({ activeLink = null, badgeCount = 0, user = null }) {
    const navigate = useNavigate();
    const [isEnterpriseRegistered, setIsEnterpriseRegistered] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const enterpriseRegistered = sessionStorage.getItem('enterpriseRegistered');
        setIsEnterpriseRegistered(enterpriseRegistered === 'true');

        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            const parsedUser = JSON.parse(sessionUser);
            setCurrentUser(parsedUser);
        }
    }, []);

    const handleLogin = () => {
        navigate('/login');
    };

    const handleSignup = () => {
        navigate('/signup');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="shared-nav">
            <span className="shared-nav__logo">&#9851; CycleWealth</span>
            <div className="shared-nav__links">
                <Link to="/scrapdealer" className={`shared-nav__link ${activeLink === 'home' ? 'shared-nav__link--active' : ''}`}>
                    Home
                </Link>
                <Link to="/scrapdealer" className={`shared-nav__link ${activeLink === 'transactions' ? 'shared-nav__link--active' : ''}`}>
                    Transactions
                </Link>
                <Link to="/connections" className={`shared-nav__link ${activeLink === 'connections' ? 'shared-nav__link--active' : ''}`}>
                    Connections
                    {badgeCount > 0 && (
                        <span className="shared-nav__badge">{badgeCount}</span>
                    )}
                </Link>
                <Link to="/enterprise" className={`shared-nav__link ${activeLink === 'enterprise' ? 'shared-nav__link--active' : ''}`}>
                    Enterprise
                </Link>
                {isEnterpriseRegistered && (
                    <Link to="/companyorder" className={`shared-nav__link ${activeLink === 'companyorder' ? 'shared-nav__link--active' : ''}`}>
                        Order Scrap
                    </Link>
                )}
            </div>
            <div className="shared-nav__actions">
                {user ? (
                    <>
                        <NotificationDropdown user={currentUser || user} />
                        <button className="shared-nav__btn shared-nav__btn--danger" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <button className="shared-nav__btn shared-nav__btn--ghost" onClick={handleLogin}>
                            Login
                        </button>
                        <button className="shared-nav__btn shared-nav__btn--primary" onClick={handleSignup}>
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}

export default SharedNavbar;
