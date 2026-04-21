import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import HomeNavbar from "../components/HomeNavbar";

console.log('Home.jsx loaded')

function Home() {
    console.log('Home component rendering')
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('Home useEffect running')
        try {
            // Get logged in user from sessionStorage
            const sessionUser = sessionStorage.getItem('user');
            if (sessionUser) {
                try {
                    setUser(JSON.parse(sessionUser));
                } catch (e) {
                    console.error('Error parsing user from session:', e);
                }
            }
        } catch (err) {
            setError(err.message);
        }
    }, []);

    if (error) {
        return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
    }

    console.log('Home rendering components')
    return (
        <div style={{ minHeight: '100vh' }}>
            <HomeNavbar user={user} />
            <Hero />
            <Footer />
        </div>
    );
}

export default Home