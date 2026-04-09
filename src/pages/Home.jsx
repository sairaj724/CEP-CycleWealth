import React, { useState, useEffect } from "react";
import SharedNavbar from "../components/SharedNavbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

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
            <SharedNavbar user={user} />
            <Hero />
            <Footer />
        </>
    );

}

export default Home