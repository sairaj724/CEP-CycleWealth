import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabaseClient from "../supabase-config";

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
                <a href="/">Home</a>
                <a href="/about">About Us</a>
                <a href="/contact">Contact</a>
                <a href="/goals">Our Goals</a>
            </div>

            <div className="auth-buttons">
                {!loading && user ? (
                    <button className="sign-up" onClick={handleLogout}>
                        Sign Out
                    </button>
                ) : (
                    !loading && (
                        <>
                            <a href="/login"><button className="login">Login</button></a>
                            <a href="/signup"><button className="sign-up">Sign Up</button></a>
                        </>
                    )
                )}
            </div>
        </div>
    );
}

export default HomeNavbar;
