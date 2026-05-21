import Hero3D from "./Hero3D";

function HeroSection() {
  return (
    <div className="hero-container">
      {/* LEFT TEXT PANEL */}
      <div className="hero-text">
        <h1>
          Smart Food Rescue <span>Platform</span>
        </h1>
        <p>
          Connecting donors, NGOs and pickup teams in real time to reduce food
          waste and save lives.
        </p>

        <div className="hero-actions">
          <button className="primary-btn">Donate Now</button>
          <button className="secondary-btn">View Dashboard</button>
        </div>
      </div>

      {/* RIGHT 3D PANEL */}
      <div className="hero-canvas">
        <Hero3D />
      </div>
    </div>
  );
}

export default HeroSection;