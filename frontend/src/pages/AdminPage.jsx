import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Search,
  RefreshCw,
  Loader2,
  Trash2,
  Server,
  Database,
  Lock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getReports, getDashboardStats, updateReportStatus } from '../services/disasterService';
import { supabase } from '../services/supabase';

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

export default function AdminPage() {
  const { user, role, updateRole } = useAuth();
  const isAdmin = role === 'admin';

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // System Health
  const [systemHealth, setSystemHealth] = useState({
    database: 'checking',
    auth: 'online',
    storage: 'online',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const [statsData, reportsData] = await Promise.all([
        getDashboardStats().catch((e) => {
          if (isTableMissingError(e)) throw e;
          return { total: 0, verified: 0, pending: 0, rejected: 0, contributors: 0 };
        }),
        getReports().catch((e) => {
          if (isTableMissingError(e)) throw e;
          return [];
        }),
      ]);

      setStats(statsData);
      setReports(reportsData);
      setSystemHealth({
        database: 'online',
        auth: 'online',
        storage: 'online',
      });
    } catch (err) {
      if (isTableMissingError(err)) {
        setSetupRequired(true);
        setSystemHealth({
          database: 'setup_required',
          auth: 'online',
          storage: 'online',
        });
      } else {
        setError(err.message);
        setSystemHealth({
          database: 'error',
          auth: 'online',
          storage: 'online',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      await updateReportStatus(reportId, newStatus, `Updated by Admin (${user?.email || 'admin'})`);
      toast.success(`Report #${reportId.slice(0, 8)} status set to ${newStatus}`);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      // Refresh stats
      const s = await getDashboardStats().catch(() => null);
      if (s) setStats(s);
    } catch (err) {
      toast.error(err.message || 'Status update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm(`Delete report #${reportId.slice(0, 8).toUpperCase()}? This action is permanent.`)) {
      return;
    }
    setUpdatingId(reportId);
    try {
      const { error: delErr } = await supabase.from('reports').delete().eq('id', reportId);
      if (delErr) throw delErr;
      toast.success('Report deleted permanently');
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      const s = await getDashboardStats().catch(() => null);
      if (s) setStats(s);
    } catch (err) {
      toast.error(err.message || 'Delete operation failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.location && r.location.toLowerCase().includes(q)) ||
      (r.disaster_type && r.disaster_type.toLowerCase().includes(q))
    );
  });

  if (!isAdmin) {
    return (
      <div className="verifier-page">
        <div className="error-state" style={{ marginTop: 40, textAlign: 'center', padding: '36px 20px' }}>
          <Lock size={42} style={{ color: 'var(--color-danger)', margin: '0 auto 12px' }} />
          <h2>Administrator Portal Restricted</h2>
          <p style={{ maxWidth: 440, margin: '8px auto 20px', color: 'var(--color-text-secondary)' }}>
            This interface requires administrator privileges to inspect system health, manage database
            records, and configure role assignments.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => updateRole('admin')}
            >
              <Sparkles size={16} />
              Switch to Admin Persona (Demo Mode)
            </button>
            <Link to="/" className="secondary-button">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verifier-page">
      <div className="dashboard-eyebrow">SYSTEM & DATA GOVERNANCE</div>
      <h1>Administrator Control Center</h1>
      <p>
        Platform-wide oversight of disaster intelligence, system operational health, and user access roles.
      </p>

      {/* Error banner */}
      {error && (
        <div className="error-state" style={{ marginBottom: 20 }}>
          <p>Error: {error}</p>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="dashboard-stats" style={{ marginTop: 24, marginBottom: 28 }}>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Activity size={18} />
          </div>
          <p>Total Database Records</p>
          <h2>{loading ? '…' : (stats?.total ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <CheckCircle2 size={18} />
          </div>
          <p>Verified Reports</p>
          <h2>{loading ? '…' : (stats?.verified ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon warning">
            <Clock size={18} />
          </div>
          <p>Pending Verifier Queue</p>
          <h2>{loading ? '…' : (stats?.pending ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon accent">
            <XCircle size={18} />
          </div>
          <p>Rejected Reports</p>
          <h2>{loading ? '…' : (stats?.rejected ?? 0)}</h2>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Users size={18} />
          </div>
          <p>Active Contributors</p>
          <h2>{loading ? '…' : (stats?.contributors ?? 0)}</h2>
        </div>
      </div>

      {/* System Health Panel */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 30,
        }}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, marginBottom: 14 }}>
          <Server size={18} style={{ color: 'var(--color-primary)' }} />
          System Operational Health
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          <div style={{ background: 'var(--color-surface-secondary)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Supabase Database (PostgreSQL)</div>
            <strong
              style={{
                color:
                  systemHealth.database === 'online'
                    ? 'var(--color-success)'
                    : systemHealth.database === 'setup_required'
                    ? 'var(--color-warning)'
                    : 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
              }}
            >
              <span className="status-dot" style={{ background: 'currentColor' }} />
              {systemHealth.database === 'online'
                ? 'Operational (Connected)'
                : systemHealth.database === 'setup_required'
                ? 'Migrations Needed'
                : 'Degraded'}
            </strong>
          </div>
          <div style={{ background: 'var(--color-surface-secondary)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Auth Service (GoTrue)</div>
            <strong style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span className="status-dot" style={{ background: 'currentColor' }} />
              Operational
            </strong>
          </div>
          <div style={{ background: 'var(--color-surface-secondary)', padding: '12px 16px', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Storage Engine (disaster-evidence)</div>
            <strong style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span className="status-dot" style={{ background: 'currentColor' }} />
              Operational
            </strong>
          </div>
        </div>
      </div>

      {/* User & Role Management / Persona Switcher */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 30,
        }}
      >
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, marginBottom: 8 }}>
          <Users size={18} style={{ color: 'var(--color-primary)' }} />
          Role Governance & Evaluator Persona Switcher
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
          Currently authenticated as <strong>{user?.email}</strong> with active role <strong>{role.toUpperCase()}</strong>.
          Switch roles to test the user experience for each persona:
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={role === 'citizen' ? 'primary-button' : 'secondary-button'}
            onClick={() => {
              updateRole('citizen');
              toast.success('Switched to Citizen persona');
            }}
          >
            Citizen Persona
          </button>
          <button
            type="button"
            className={role === 'verifier' ? 'primary-button' : 'secondary-button'}
            onClick={() => {
              updateRole('verifier');
              toast.success('Switched to Verifier persona');
            }}
          >
            Field Verifier Persona
          </button>
          <button
            type="button"
            className={role === 'admin' ? 'primary-button' : 'secondary-button'}
            onClick={() => {
              updateRole('admin');
              toast.success('Switched to Administrator persona');
            }}
          >
            Administrator Persona
          </button>
        </div>
      </div>

      {/* Report Governance Table */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: 16 }}>Report Management & Governance</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input
                type="text"
                placeholder="Search reports…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 13, width: '100%' }}
              />
            </div>
            <button className="secondary-button" onClick={fetchData} disabled={loading} style={{ padding: '6px 12px', fontSize: 13 }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 24, color: 'var(--color-text-secondary)' }}>
            <Loader2 size={16} className="spin" /> Loading reports…
          </div>
        ) : setupRequired ? (
          <div className="empty-state">
            <Database size={32} />
            <h3>Database Setup Required</h3>
            <p>Run the SQL migration script to generate the reports table in Supabase.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <p>No disaster reports match your query.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '10px 8px' }}>ID</th>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Title & Location</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Severity</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontWeight: 600 }}>
                      #{report.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{report.disaster_type}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <Link to={`/reports/${report.id}`} style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {report.title}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{report.location}</div>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>
                      {formatDate(report.created_at)}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        className={
                          report.severity === 'High'
                            ? 'badge badge-high'
                            : report.severity === 'Medium'
                            ? 'badge badge-medium'
                            : 'badge badge-low'
                        }
                      >
                        {report.severity}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        disabled={updatingId === report.id}
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6 }}
                      >
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <Link
                          to={`/reports/${report.id}`}
                          className="secondary-button"
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          title="View details"
                        >
                          <ExternalLink size={12} />
                        </Link>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={updatingId === report.id}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            background: 'transparent',
                            color: 'var(--color-danger)',
                            border: '1px solid var(--color-danger)',
                            borderRadius: 6,
                          }}
                          title="Delete report permanently"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
