
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  Radio,
  Users,
  ArrowRight,
  CloudLightning,
} from "lucide-react";

function Home() {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">
            <ShieldCheck size={16} />
            <span>AI-Powered Disaster Intelligence</span>
          </div>

          <h1>
            Verify Reality.
            <br />
            <span>Protect Communities.</span>
          </h1>

          <p>
            DisasterLens AI uses crowdsourced reports, artificial
            intelligence and geospatial intelligence to help verify
            extreme weather events and eliminate duplicate reports.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="primary-button">
              Get Started <ArrowRight size={18} />
            </Link>

            <Link to="/login" className="secondary-button">
              Sign In
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card">
            <CloudLightning size={64} />
            <h3>Real-time Disaster Intelligence</h3>
            <p>Turning community reports into verified insights.</p>
            <div className="status-indicator">
              <span className="status-dot"></span>
              Intelligence System Ready
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>How DisasterLens AI Works</h2>
        <p className="section-subtitle">
          Technology that turns reports into reliable information.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <Users size={32} />
            <h3>Crowdsourced Reports</h3>
            <p>
              Citizens submit reports about extreme weather events
              happening in their communities.
            </p>
          </div>

          <div className="feature-card">
            <ShieldCheck size={32} />
            <h3>AI Verification</h3>
            <p>
              Reports are analyzed to identify credibility and
              reduce misinformation.
            </p>
          </div>

          <div className="feature-card">
            <MapPin size={32} />
            <h3>GIS Intelligence</h3>
            <p>
              Location intelligence helps identify duplicate
              reports and visualize disaster activity.
            </p>
          </div>

          <div className="feature-card">
            <Radio size={32} />
            <h3>Live Monitoring</h3>
            <p>
              View verified disaster information through a
              centralized intelligence dashboard.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
