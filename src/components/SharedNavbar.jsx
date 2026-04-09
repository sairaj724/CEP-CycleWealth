import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SharedNavbar.css';

function SharedNavbar({ activeLink = null, badgeCount = 0, user = null }) {
    const navigate = useNavigate();

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
                <a href="/scrapdealer" className={`shared-nav__link ${activeLink === 'home' ? 'shared-nav__link--active' : ''}`}>
                    Home
                </a>
                <a href="/scrapdealer" className={`shared-nav__link ${activeLink === 'transactions' ? 'shared-nav__link--active' : ''}`}>
                    Transactions
                </a>
                <a href="/connections" className={`shared-nav__link ${activeLink === 'connections' ? 'shared-nav__link--active' : ''}`}>
                    Connections
                    {badgeCount > 0 && (
                        <span className="shared-nav__badge">{badgeCount}</span>
                    )}
                </a>
            </div>
            <div className="shared-nav__actions">
                {user ? (
                    <button className="shared-nav__btn shared-nav__btn--danger" onClick={handleLogout}>
                        Sign Out
                    </button>
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
