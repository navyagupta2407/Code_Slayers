import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, RefreshCw, Loader2, AlertTriangle, FileText } from 'lucide-react';
import { getReports, DISASTER_TYPES, SEVERITIES, STATUSES } from '../services/disasterService';

const PAGE_SIZE = 20;

const isTableMissingError = (err) =>
  err?.message?.includes('relation') ||
  err?.message?.includes('does not exist') ||
  err?.code === '42P01';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SeverityBadge({ severity }) {
  const map = { High: 'badge badge-high', Medium: 'badge badge-medium', Low: 'badge badge-low' };
  return <span className={map[severity] || 'badge'}>{severity}</span>;
}

function StatusBadge({ status }) {
  const map = { verified: 'badge badge-verified', pending: 'badge badge-pending', rejected: 'badge badge-rejected' };
  return <span className={map[status] || 'badge'}>{status}</span>;
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [displayed, setDisplayed] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const [search, setSearch] = useState('');
  const [disasterType, setDisasterType] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const data = await getReports({ disaster_type: disasterType, severity, status, search });
      setReports(data);
      setDisplayed(PAGE_SIZE);
    } catch (err) {
      if (isTableMissingError(err)) {
        setSetupRequired(true);
        setReports([]);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [disasterType, severity, status, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchReports, 350);
    return () => clearTimeout(timeout);
  }, [fetchReports]);

  const resetFilters = () => {
    setSearch('');
    setDisasterType('All');
    setSeverity('All');
    setStatus('All');
  };

  const hasFilters = search || disasterType !== 'All' || severity !== 'All' || status !== 'All';

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-page-header">
        <div>
          <div className="dashboard-eyebrow">COMMUNITY REPORTS</div>
          <h1>Disaster Reports</h1>
          <p>Browse and filter all submitted disaster reports.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }} />
          <input
            className="reports-search-input"
            type="text"
            placeholder="Search title, description, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34, width: '100%' }}
          />
        </div>

        <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)}>
          <option value="All">All Types</option>
          {DISASTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="All">All Severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {hasFilters && (
          <button className="reports-filter-reset" onClick={resetFilters}>
            <RefreshCw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)', padding: '24px 0', fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Loading reports…
        </div>
      )}

      {!loading && setupRequired && (
        <div className="empty-state">
          <AlertTriangle size={36} />
          <h3>Database Not Configured</h3>
          <p>The reports table doesn&apos;t exist yet. Please set up your Supabase database to see reports.</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <AlertTriangle size={28} />
          <strong>Failed to load reports</strong>
          <p>{error}</p>
          <button className="secondary-button" style={{ marginTop: 10 }} onClick={fetchReports}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {!loading && !error && !setupRequired && reports.length === 0 && (
        <div className="empty-state">
          <FileText size={36} />
          <h3>No reports found</h3>
          <p>
            {hasFilters
              ? 'No reports match your current filters. Try resetting them.'
              : 'No reports have been submitted yet.'}
          </p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            Showing {Math.min(displayed, reports.length)} of {reports.length} report{reports.length !== 1 ? 's' : ''}
          </p>
          <div className="reports-list">
            {reports.slice(0, displayed).map((report) => (
              <div
                key={report.id}
                className="report-card-item"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <div className="report-card-main">
                  <div className="report-card-id">#{report.id.slice(0, 8).toUpperCase()}</div>
                  <div className="report-card-title">{report.title}</div>
                  <div className="report-card-meta">
                    <span className="report-card-location">
                      <MapPin size={12} />
                      {report.location}
                    </span>
                    <span className="report-card-date">{formatDate(report.created_at)}</span>
                  </div>
                </div>
                <div className="report-card-badges">
                  <span className="badge badge-type">{report.disaster_type}</span>
                  <SeverityBadge severity={report.severity} />
                  <StatusBadge status={report.status} />
                </div>
              </div>
            ))}
          </div>

          {displayed < reports.length && (
            <div className="reports-load-more">
              <button
                className="secondary-button"
                onClick={() => setDisplayed((d) => d + PAGE_SIZE)}
              >
                Load More ({reports.length - displayed} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
