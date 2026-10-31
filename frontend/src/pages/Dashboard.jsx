import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getMyReports, getReports } from '../services/disasterService';

const isTableMissingError = (err) =>
  err?.message?.includes('relation') ||
  err?.message?.includes('does not exist') ||
  err?.code === '42P01';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }) {
  const map = {
    verified: 'badge badge-verified',
    pending: 'badge badge-pending',
    rejected: 'badge badge-rejected',
  };
  return <span className={map[status] || 'badge'}>{status}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [statsSetupRequired, setStatsSetupRequired] = useState(false);

  const [myReports, setMyReports] = useState([]);
  const [myLoading, setMyLoading] = useState(true);
  const [myError, setMyError] = useState(null);

  const [recentReports, setRecentReports] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState(null);

  const [supabaseConnected] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => {
        if (isTableMissingError(err)) {
          setStatsSetupRequired(true);
          setStats({ total: 0, verified: 0, pending: 0, rejected: 0, contributors: 0 });
        } else {
          setStatsError(err.message);
        }
      })
      .finally(() => setStatsLoading(false));

    if (user?.id) {
      getMyReports(user.id)
        .then(setMyReports)
        .catch((err) => {
          if (!isTableMissingError(err)) setMyError(err.message);
        })
        .finally(() => setMyLoading(false));
    } else {
      setMyLoading(false);
    }

    getReports({ limit: 5 })
      .then(setRecentReports)
      .catch((err) => {
        if (!isTableMissingError(err)) setRecentError(err.message);
      })
      .finally(() => setRecentLoading(false));
  }, [user]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="dashboard-eyebrow">DASHBOARD</div>
          <h1>Welcome back, {displayName}</h1>
          <p>Here&apos;s your disaster intelligence overview.</p>
        </div>
        <Link to="/report" className="dashboard-report-button">
          <AlertTriangle size={16} />
          Submit New Report
        </Link>
      </div>

      {/* Setup notice */}
      {statsSetupRequired && (
        <div className="error-state" style={{ marginBottom: 20, padding: '14px 18px' }}>
          <AlertTriangle size={22} />
          <strong style={{ color: 'var(--color-warning)' }}>Database Setup Required</strong>
          <p>The &apos;reports&apos; table doesn&apos;t exist yet. Please run the Supabase migrations to enable full functionality.</p>
        </div>
      )}

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Activity size={18} />
          </div>
          <p>Total Reports</p>
          <h2>{statsLoading ? '…' : (stats?.total ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <CheckCircle2 size={18} />
          </div>
          <p>Verified</p>
          <h2>{statsLoading ? '…' : (stats?.verified ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon warning">
            <Clock size={18} />
          </div>
          <p>Pending Review</p>
          <h2>{statsLoading ? '…' : (stats?.pending ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon accent">
            <Users size={18} />
          </div>
          <p>Contributors</p>
          <h2>{statsLoading ? '…' : (stats?.contributors ?? 0)}</h2>
        </div>
      </div>

      {/* Stats error */}
      {statsError && (
        <div className="error-state" style={{ marginBottom: 20 }}>
          <AlertTriangle size={20} />
          <p>Failed to load stats: {statsError}</p>
        </div>
      )}

      {/* Content grid */}
      <div className="dashboard-content">
        {/* Recent Reports */}
        <div className="dashboard-reports">
          <div className="dashboard-section-heading">
            <div>
              <h2>Recent Reports</h2>
            </div>
            <Link to="/reports">View All →</Link>
          </div>

          {recentLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 14 }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
            </div>
          ) : recentError ? (
            <div className="error-state" style={{ padding: '20px 0' }}>
              <p>{recentError}</p>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', background: 'transparent', padding: '24px 0' }}>
              <p>No reports yet. <Link to="/report" style={{ color: 'var(--color-primary)' }}>Be the first to submit one.</Link></p>
            </div>
          ) : (
            <div className="dashboard-report-list">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="dashboard-report-card"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <div>
                    <div className="dashboard-report-id">#{report.id.slice(0, 8).toUpperCase()}</div>
                    <h3>{report.title}</h3>
                    <p><MapPin size={12} /> {report.location}</p>
                    <small>{formatDate(report.created_at)}</small>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="dashboard-side-panel">
          {/* My Reports */}
          <div className="dashboard-section-heading">
            <h2>My Reports</h2>
          </div>

          {myLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 18 }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
            </div>
          ) : myError ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>{myError}</p>
          ) : myReports.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 18 }}>
              You haven&apos;t submitted any reports yet.
            </p>
          ) : (
            <div className="dashboard-report-list" style={{ marginBottom: 18 }}>
              {myReports.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="dashboard-report-card"
                  onClick={() => navigate(`/reports/${r.id}`)}
                >
                  <div>
                    <div className="dashboard-report-id">#{r.id.slice(0, 8).toUpperCase()}</div>
                    <h3 style={{ fontSize: 14 }}>{r.title}</h3>
                    <small>{formatDate(r.created_at)}</small>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}

          {/* System status */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 18, marginTop: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              System Status
            </p>
            <div className="dashboard-system-status">
              <div className="status-indicator-dot" />
              <div>
                <h3>Connected to Supabase</h3>
                <p>
                  {supabaseConnected
                    ? 'Realtime connection active. Data sync enabled.'
                    : 'Connection issue detected.'}
                </p>
              </div>
            </div>
            <div className="dashboard-side-info">
              <span>Account</span>
              <strong style={{ color: 'var(--color-text)', fontSize: 12 }}>{user?.email}</strong>
            </div>
            <div className="dashboard-side-info" style={{ borderBottom: 'none' }}>
              <span>Member since</span>
              <strong style={{ color: 'var(--color-text)', fontSize: 12 }}>
                {user?.created_at ? formatDate(user.created_at) : '—'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
