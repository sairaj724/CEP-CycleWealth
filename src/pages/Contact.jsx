import React, { useState } from 'react';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import './Contact.css';

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="contact-page">
            <HomeNavbar />
            
            <div className="contact-container">
                <div className="contact-hero">
                    <h1>Contact Us</h1>
                    <p className="contact-tagline">We'd love to hear from you</p>
                </div>

                <div className="contact-content">
                    <div className="contact-info-section">
                        <div className="contact-message">
                            <h2>Let's Connect</h2>
                            <p>
                                Have questions about selling scrap? Want to partner with us as a scrap dealer 
                                or artisan? Interested in our upcycled products? We're here to help!
                            </p>
                            <p>
                                Reach out to our team and we'll respond within 24 hours. Together, 
                                we can build a more sustainable future.
                            </p>
                        </div>

                        <div className="contact-details">
                            <div className="contact-item">
                                <div className="contact-icon">📧</div>
                                <div className="contact-text">
                                    <h3>Email</h3>
                                    <p>hello@cyclewealth.in</p>
                                    <p>support@cyclewealth.in</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <div className="contact-icon">📞</div>
                                <div className="contact-text">
                                    <h3>Phone</h3>
                                    <p>+91 98765 43210</p>
                                    <p>Mon-Sat, 9AM - 6PM IST</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <div className="contact-icon">📍</div>
                                <div className="contact-text">
                                    <h3>Address</h3>
                                    <p>CycleWealth Technologies Pvt. Ltd.</p>
                                    <p>123 Green Innovation Hub</p>
                                    <p>Koramangala, Bangalore - 560034</p>
                                    <p>Karnataka, India</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <div className="contact-icon">🌐</div>
                                <div className="contact-text">
                                    <h3>Social Media</h3>
                                    <div className="social-links">
                                        <a href="#">LinkedIn</a>
                                        <a href="#">Instagram</a>
                                        <a href="#">Twitter</a>
                                        <a href="#">Facebook</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-form-section">
                        <h2>Send us a Message</h2>
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label htmlFor="name">Your Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    <option value="general">General Inquiry</option>
                                    <option value="sell-scrap">Sell Scrap</option>
                                    <option value="partnership">Partnership Opportunity</option>
                                    <option value="artisan">Artisan Registration</option>
                                    <option value="product">Product Query</option>
                                    <option value="feedback">Feedback</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Your Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                    placeholder="Tell us how we can help you..."
                                ></textarea>
                            </div>

                            <button type="submit" className="submit-btn">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Contact;
