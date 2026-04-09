import React from 'react';
import HomeNavbar from '../components/HomeNavbar';
import Footer from '../components/Footer';
import './Goals.css';

function Goals() {
    const goals = [
        {
            icon: '♻️',
            title: 'Reduce Waste to Landfill',
            description: 'Divert 1 million tonnes of recyclable waste from landfills by 2030 through efficient collection and processing networks.'
        },
        {
            icon: '🌍',
            title: 'Promote Circular Economy',
            description: 'Create a closed-loop system where materials are continuously reused, recycled, and upcycled, eliminating the concept of waste.'
        },
        {
            icon: '💚',
            title: 'Environmental Sustainability',
            description: 'Reduce carbon emissions by 500,000 tonnes annually by promoting local recycling and reducing transportation footprint.'
        },
        {
            icon: '💼',
            title: 'Economic Empowerment',
            description: 'Provide dignified livelihoods to 100,000+ waste workers, artisans, and small-scale recyclers through fair wages and market access.'
        },
        {
            icon: '🏘️',
            title: 'Community Engagement',
            description: 'Educate and engage 10 million households in responsible waste segregation and sustainable consumption practices.'
        },
        {
            icon: '🤝',
            title: 'Stakeholder Integration',
            description: 'Unite households, dealers, artisans, and startups on one platform to eliminate inefficiencies and maximize value creation.'
        },
        {
            icon: '📱',
            title: 'Technology-Driven Transparency',
            description: 'Leverage digital tools to ensure fair pricing, track material flows, and provide real-time insights to all stakeholders.'
        },
        {
            icon: '🎨',
            title: 'Celebrate Upcycling',
            description: 'Transform public perception of waste by showcasing beautiful, functional products created from discarded materials.'
        }
    ];

    return (
        <div className="goals-page">
            <HomeNavbar />
            
            <div className="goals-container">
                <div className="goals-hero">
                    <h1>Our Goals</h1>
                    <p className="goals-tagline">Building a sustainable future through purposeful action</p>
                </div>

                <div className="goals-intro">
                    <p>
                        At CycleWealth, every goal is a commitment to our planet and people. 
                        We measure success not just in profits, but in the positive impact 
                        we create for communities and the environment.
                    </p>
                </div>

                <div className="goals-grid">
                    {goals.map((goal, index) => (
                        <div key={index} className="goal-card">
                            <div className="goal-icon">{goal.icon}</div>
                            <h3>{goal.title}</h3>
                            <p>{goal.description}</p>
                        </div>
                    ))}
                </div>

                <div className="goals-cta">
                    <h2>Join Our Mission</h2>
                    <p>
                        Whether you're a household looking to sell scrap, an artisan seeking materials, 
                        or a conscious consumer wanting to buy upcycled products – you play a vital 
                        role in achieving these goals.
                    </p>
                    <div className="cta-buttons">
                        <a href="/signup" className="cta-btn-primary">Get Started Today</a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Goals;
