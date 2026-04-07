import React from "react";


function Hero() {
  return (
    <div className="hero">
      <h1>Transform Waste into Wealth</h1>
      <p>
        Connect with scrap dealers, industries, and skilled labor to recycle
        and reuse materials
      </p>

      <div className="hero-buttons">
        <button className="primary">Get Started</button>
        <button className="secondary">Browse Products</button>
      </div>

      <div className="stats">
        <div>
          <h2>50,000+ kg</h2>
          <p>Scrap Recycled</p>
        </div>

        <div>
          <h2>1,000+</h2>
          <p>Active Users</p>
        </div>

        <div>
          <h2>500+</h2>
          <p>Products Sold</p>
        </div>
      </div>
    </div>
  );
}

export default Hero;