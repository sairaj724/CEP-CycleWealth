import React from "react";
// import "./Navbar.css";

function Navbar() {
    return (
        <div className="navbar">
            <h2 className="logo">♻️ CycleWealth</h2>

            <div className="nav-links">
                <a href="/">Home</a>
                <a href="#">Shop</a>
                <a href="#">Find Dealers</a>
            </div>

            <div className="auth-buttons">
                <a href="/login"><button className="login">Login</button></a>
                <a href="/signup"><button className="sign-up">Sign Up</button></a>


            </div>
        </div>
    );
}

export default Navbar