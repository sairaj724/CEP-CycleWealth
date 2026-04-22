import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabaseClient from "../supabase-config";
import NotificationDropdown from "./NotificationDropdown";

function HomeNavbar({ user: propUser }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(propUser || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in from sessionStorage
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            try {
                setUser(JSON.parse(sessionUser));
            } catch (e) {
                console.error('Error parsing user from session:', e);
            }
        }
        setLoading(false);
    }, [propUser]);

    const handleLogout = async () => {
        try {
            await supabaseClient.auth.signOut();
            sessionStorage.removeItem('user');
            localStorage.removeItem('user');
            setUser(null);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="navbar">
            <h2 className="logo">♻️ CycleWealth</h2>

            <div className="nav-links">
                <Link to="/">Home</Link>
                <Link to="/about">About Us</Link>
                <Link to="/scrap-prices">Scrap Prices</Link>
                <Link to="/segregation-guide">Segregation Guide</Link>
                <Link to="/contact">Contact</Link>
            </div>

            <div className="auth-buttons">
                {!loading && user ? (
                    <>
                        <NotificationDropdown user={user} />
                        <button className="sign-up" onClick={handleLogout}>
                            Sign Out
                        </button>
                    </>
                ) : (
                    !loading && (
                        <>
                            <Link to="/login"><button className="login">Login</button></Link>
                            <Link to="/signup"><button className="sign-up">Sign Up</button></Link>
                        </>
                    )
                )}
            </div>
        </div>
    );
}

export default HomeNavbar;
