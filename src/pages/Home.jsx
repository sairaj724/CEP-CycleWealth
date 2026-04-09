import React, { useState, useEffect } from "react";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import Navbar2 from "../components/Navbar2";

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
            <Navbar2 user={user} />
            <Hero />
            <Footer />
        </>
    );

}

export default Home