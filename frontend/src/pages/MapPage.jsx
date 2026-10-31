import { useEffect, useState, useMemo } from 'react';
import { Activity, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import DisasterMap from '../components/DisasterMap';
import { getReports, DISASTER_TYPES, SEVERITIES, STATUSES } from '../services/disasterService';

const isTableMissingError = (err) =>
  err?.message?.includes('relation') ||
  err?.message?.includes('does not exist') ||
  err?.code === '42P01';

export default function MapPage() {
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const [selectedType, setSelectedType] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const data = await getReports();
      setAllReports(data);
    } catch (err) {
      if (isTableMissingError(err)) {
        setSetupRequired(true);
        setAllReports([]);
      } else {
        setError(err.message || 'Failed to load reports.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      if (selectedType !== 'All' && r.disaster_type !== selectedType) return false;
      if (selectedSeverity !== 'All' && r.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
      return true;
    });
  }, [allReports, selectedType, selectedSeverity, selectedStatus]);

  const totalCount = filteredReports.length;
  const verifiedCount = filteredReports.filter((r) => r.status === 'verified').length;
  const pendingCount = filteredReports.filter((r) => r.status === 'pending').length;
  const rejectedCount = filteredReports.filter((r) => r.status === 'rejected').length;

  const hasFilters = selectedType !== 'All' || selectedSeverity !== 'All' || selectedStatus !== 'All';

  const resetFilters = () => {
    setSelectedType('All');
    setSelectedSeverity('All');
    setSelectedStatus('All');
  };

  return (
    <div className="map-page">
      {/* Header */}
      <div className="map-page-header">
        <div>
          <div className="dashboard-eyebrow">LIVE GIS INTELLIGENCE</div>
          <h1>Disaster Intelligence Map</h1>
          <p>
            {setupRequired
              ? 'Database setup required — no reports to display'
              : loading
              ? 'Loading real-time data…'
              : `${totalCount} report${totalCount !== 1 ? 's' : ''} shown`}
          </p>
        </div>
        <div className="map-live-indicator">
          <span />
          Live Data
        </div>
      </div>

      {/* Filters */}
      <div className="map-filters">
        <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
          <option value="All">All Types</option>
          {DISASTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
          <option value="All">All Severities</option>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {hasFilters && (
          <button className="map-reset-button" onClick={resetFilters}>
            <RefreshCw size={13} /> Reset Filters
          </button>
        )}
      </div>

      {/* Statistics */}
      <div className="map-statistics">
        <div className="map-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--color-primary)' }} />
            <span className="map-stat-label">Total</span>
          </div>
          <strong>{loading ? '—' : totalCount}</strong>
        </div>
        <div className="map-stat-card verified-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
            <span className="map-stat-label">Verified</span>
          </div>
          <strong>{loading ? '—' : verifiedCount}</strong>
        </div>
        <div className="map-stat-card pending-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: 'var(--color-warning)' }} />
            <span className="map-stat-label">Pending</span>
          </div>
          <strong>{loading ? '—' : pendingCount}</strong>
        </div>
        <div className="map-stat-card rejected-stat">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <XCircle size={16} style={{ color: 'var(--color-danger)' }} />
            <span className="map-stat-label">Rejected</span>
          </div>
          <strong>{loading ? '—' : rejectedCount}</strong>
        </div>
      </div>

      {/* Map */}
      <div className="map-card">
        <DisasterMap
          reports={filteredReports}
          loading={loading}
          error={error}
        />
      </div>

      <p className="map-disclaimer">
        Markers indicate reported coordinates. Accuracy depends on submitter-provided data.
        {setupRequired && ' — Database setup required to display real reports.'}
      </p>
    </div>
  );
}
