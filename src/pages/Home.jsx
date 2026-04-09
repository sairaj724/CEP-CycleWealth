import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import HomeNavbar from "../components/HomeNavbar";

function Home() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get logged in user from sessionStorage
        const sessionUser = sessionStorage.getItem('user');
        if (sessionUser) {
            try {
                setUser(JSON.parse(sessionUser));
            } catch (e) {
                console.error('Error parsing user from session:', e);
            }
        }
    }, []);

    return (
        <>
            <HomeNavbar user={user} />
            <Hero />
            <Footer />
        </>
    );

}

export default Home