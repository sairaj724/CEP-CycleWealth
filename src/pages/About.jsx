import React from 'react';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import './About.css';

function About() {
    return (
        <div className="about-page">
            <HomeNavbar />
            
            <div className="about-container">
                <div className="about-hero">
                    <h1>About CycleWealth</h1>
                    <p className="about-tagline">Close the Loop – Turning Waste into Wealth and a Cleaner Planet</p>
                </div>

                <div className="about-content">
                    <section className="about-section">
                        <h2>What is CycleWealth?</h2>
                        <p>
                            CycleWealth is India's first integrated circular economy platform that connects 
                            households, scrap dealers, artisans, and recycling startups. We transform the 
                            way waste is managed by creating a seamless ecosystem where waste becomes a 
                            valuable resource, benefiting both people and the planet.
                        </p>
                    </section>

                    <section className="about-section problem-section">
                        <h2>The Problem We Address</h2>
                        <p>
                            India generates over 62 million tonnes of waste annually, with less than 20% 
                            being properly recycled. Waste management remains fragmented, inefficient, and 
                            environmentally harmful. Households struggle to find reliable scrap dealers, 
                            artisans lack access to quality recycled materials, and the informal recycling 
                            sector operates without transparency or fair pricing.
                        </p>
                        <div className="stats-grid">
                            <div className="stat-box">
                                <h3>62M+</h3>
                                <p>Tonnes of waste generated annually</p>
                            </div>
                            <div className="stat-box">
                                <h3>80%</h3>
                                <p>Waste ends up in landfills</p>
                            </div>
                            <div className="stat-box">
                                <h3>1.5M+</h3>
                                <p>People in informal recycling sector</p>
                            </div>
                        </div>
                    </section>

                    <section className="about-section solution-section">
                        <h2>Our Solution</h2>
                        <p>
                            CycleWealth bridges these gaps through technology. Our platform enables:
                        </p>
                        <ul className="solution-list">
                            <li><strong>Smart Connections:</strong> Households easily find verified scrap dealers nearby</li>
                            <li><strong>Fair Pricing:</strong> Transparent rates ensure everyone gets value</li>
                            <li><strong>Artisan Empowerment:</strong> Skilled craftspeople access quality recycled materials</li>
                            <li><strong>Marketplace:</strong> Beautiful upcycled products reach conscious consumers</li>
                            <li><strong>Traceability:</strong> Track your waste's journey from collection to creation</li>
                        </ul>
                    </section>

                    <section className="about-section impact-section">
                        <h2>Our Impact</h2>
                        <p>
                            By digitizing the circular economy, CycleWealth creates environmental, social, 
                            and economic value. Every kilogram of scrap recycled through our platform reduces 
                            landfill burden, creates livelihood opportunities, and moves India closer to a 
                            sustainable future.
                        </p>
                    </section>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default About;
