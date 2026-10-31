import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Users,
  Activity,
  ArrowRight,
  CloudLightning,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { getDashboardStats } from '../services/disasterService';

const isTableMissingError = (err) =>
  err?.message?.includes('relation') || err?.message?.includes('does not exist') || err?.code === '42P01';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => {
        if (!isTableMissingError(err)) console.error(err);
        setStats(null);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">
            <Radio size={13} />
            Real-time Disaster Intelligence
          </div>
          <h1>
            Verify Reality.<br />
            <span>Protect Communities.</span>
          </h1>
          <p>
            DisasterLens AI combines crowdsourced reporting with AI verification and GIS intelligence
            to deliver accurate, real-time disaster awareness for India and beyond.
          </p>
          <div className="hero-actions">
            <Link to="/map" className="primary-button">
              <MapPin size={16} />
              View Live Map
            </Link>
            <Link to="/register" className="secondary-button">
              Submit a Report
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card">
            <div className="visual-card-icons">
              <div className="visual-icon-badge">
                <ShieldCheck size={20} />
                Verified
              </div>
              <div className="visual-icon-badge">
                <MapPin size={20} />
                Mapped
              </div>
              <div className="visual-icon-badge">
                <Activity size={20} />
                Live
              </div>
            </div>
            <h3>DisasterLens AI</h3>
            <p>
              Connecting citizens with disaster response teams through verified,
              location-accurate reports.
            </p>
            <div className="status-indicator">
              <span className="status-dot" />
              System Operational
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <div className="stats-strip">
        <div className="stats-strip-item">
          <strong>{statsLoading ? '—' : (stats?.total ?? 0)}</strong>
          <span>Total Reports</span>
        </div>
        <div className="stats-strip-item">
          <strong>{statsLoading ? '—' : (stats?.verified ?? 0)}</strong>
          <span>Verified Incidents</span>
        </div>
        <div className="stats-strip-item">
          <strong>{statsLoading ? '—' : (stats?.pending ?? 0)}</strong>
          <span>Pending Review</span>
        </div>
        <div className="stats-strip-item">
          <strong>{statsLoading ? '—' : (stats?.contributors ?? 0)}</strong>
          <span>Community Contributors</span>
        </div>
      </div>

      {/* Features */}
      <section className="features">
        <h2>Built for Crisis Intelligence</h2>
        <p className="section-subtitle">
          Every feature is designed to ensure accurate, verified, and actionable disaster data.
        </p>
        <div className="feature-grid">
          <div className="feature-card">
            <Users size={26} />
            <h3>Crowdsourced Reports</h3>
            <p>
              Citizens submit disaster reports with location, media evidence, and severity ratings —
              directly from the field.
            </p>
          </div>
          <div className="feature-card">
            <ShieldCheck size={26} />
            <h3>AI Verification</h3>
            <p>
              Dedicated verifiers and AI tools cross-reference reports to flag accurate incidents
              and filter misinformation.
            </p>
          </div>
          <div className="feature-card">
            <MapPin size={26} />
            <h3>GIS Intelligence</h3>
            <p>
              Every verified report is pinned on an interactive map with severity-coded markers
              for rapid situational awareness.
            </p>
          </div>
          <div className="feature-card">
            <CloudLightning size={26} />
            <h3>Live Monitoring</h3>
            <p>
              Real-time updates via Supabase Realtime ensure response teams always see the
              latest ground truth.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Make a Difference?</h2>
        <p>
          Join our community of disaster reporters and help save lives by sharing accurate,
          timely information.
        </p>
        <div className="cta-actions">
          <Link to="/register" className="cta-btn-primary">
            <CheckCircle2 size={16} />
            Create Free Account
          </Link>
          <Link to="/map" className="cta-btn-secondary">
            <MapPin size={16} />
            Explore the Map
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">
          <ShieldCheck size={18} />
          DisasterLens AI
        </div>
        <p>© {new Date().getFullYear()} DisasterLens AI. All rights reserved.</p>
      </footer>
    </main>
  );
}
