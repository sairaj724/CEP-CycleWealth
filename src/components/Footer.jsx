import React from "react";
import "./Footer.css";

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">

                {/* Left Section */}
                <div className="footer-section">
                    <h2 className="footer-logo">♻️ CycleWealth</h2>
                    <p>Transforming waste into valuable resources for a sustainable future.</p>

                    <h4>Head Office</h4>
                    <p>Mumbai, Maharashtra, India</p>
                </div>

                {/* company  */}
                <div className="footer-section">
                    <h3>Company</h3>

                    <ul>
                        <li>About Us</li>
                        <li>Careers</li>
                        <li>FAQs</li>
                    </ul>
                </div>

                {/* Services */}
                <div className="footer-section">
                    <h3>Services</h3>

                    <ul>
                        <li>Sell Scrap</li>
                        <li>Buy Products</li>
                        <li>Recycling Solutions</li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="footer-section">
                    <h3>Get Started</h3>
                    <button className="footer-btn">Join Now</button>
                    <button className="footer-btn outline">Contact Us</button>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom">
                <p>© 2026 CycleWealth | All Rights Reserved</p>
            </div>
        </footer>
    );
}

export default Footer