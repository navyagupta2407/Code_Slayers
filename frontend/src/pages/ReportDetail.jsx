import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
  CheckCircle2,
  Eye,
  Cpu,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getReportById, getReports, updateReportStatus } from '../services/disasterService';
import { analyzeReportAI } from '../services/aiVerificationService';
import { useAuth } from '../context/AuthContext';

const isTableMissingError = (err) =>
  err?.message?.includes('relation') ||
  err?.message?.includes('does not exist') ||
  err?.code === '42P01';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function SeverityBadge({ severity }) {
  const map = { High: 'badge badge-high', Medium: 'badge badge-medium', Low: 'badge badge-low' };
  return <span className={map[severity] || 'badge'}>{severity || '—'}</span>;
}

function StatusBadge({ status }) {
  const map = { verified: 'badge badge-verified', pending: 'badge badge-pending', rejected: 'badge badge-rejected' };
  return <span className={map[status] || 'badge'}>{status || '—'}</span>;
}

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

export default function ReportDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const [report, setReport] = useState(null);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);

  // Verifier form
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifying, setVerifying] = useState(false);

  const canVerify = role === 'verifier' || role === 'admin';

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const [data, others] = await Promise.all([
        getReportById(id),
        getReports().catch(() => []),
      ]);
      setReport(data);
      setAllReports(others);
    } catch (err) {
      if (isTableMissingError(err)) {
        setSetupRequired(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const updated = await updateReportStatus(id, verifyStatus, verifyNotes);
      setReport(updated);
      toast.success(`Report marked as ${verifyStatus}`);
      setVerifyNotes('');
    } catch (err) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 size={22} className="spin" />
        Loading report details…
      </div>
    );
  }

  if (setupRequired) {
    return (
      <div className="report-detail-page">
        <Link to="/reports" className="report-detail-back">
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <div className="empty-state">
          <AlertTriangle size={36} />
          <h3>Database Not Configured</h3>
          <p>The reports table doesn&apos;t exist yet in Supabase.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-detail-page">
        <Link to="/reports" className="report-detail-back">
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <div className="error-state">
          <AlertTriangle size={28} />
          <strong>Failed to load report</strong>
          <p>{error}</p>
          <button className="secondary-button" style={{ marginTop: 10 }} onClick={fetchReport}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-detail-page">
        <Link to="/reports" className="report-detail-back">
          <ArrowLeft size={16} /> Back to Reports
        </Link>
        <div className="empty-state">
          <FileText size={36} />
          <h3>Report not found</h3>
          <p>This report may have been removed or does not exist.</p>
        </div>
      </div>
    );
  }

  const evidenceUrls = Array.isArray(report.evidence_urls) ? report.evidence_urls : [];
  const aiInsight = analyzeReportAI(report, allReports);

  return (
    <div className="report-detail-page">
      <Link to="/reports" className="report-detail-back">
        <ArrowLeft size={16} /> Back to Reports
      </Link>

      <div className="detail-card">
        <div className="detail-header">
          <h1>{report.title}</h1>
          <div className="detail-badges">
            <SeverityBadge severity={report.severity} />
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Meta grid */}
        <div className="detail-section">
          <h3>Incident Metadata</h3>
          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <span>Report ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>#{report.id.slice(0, 12).toUpperCase()}</span>
            </div>
            <div className="detail-meta-item">
              <span>Disaster Type</span>
              <span>{report.disaster_type || '—'}</span>
            </div>
            <div className="detail-meta-item">
              <span>Location</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={13} style={{ color: 'var(--color-primary)' }} />
                {report.location || '—'}
              </span>
            </div>
            <div className="detail-meta-item">
              <span>Submitted</span>
              <span>{formatDate(report.created_at)}</span>
            </div>
            {(report.latitude || report.longitude) && (
              <div className="detail-meta-item">
                <span>GPS Coordinates</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {report.latitude}, {report.longitude}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="detail-section">
          <h3>Description</h3>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--color-text)' }}>
            {report.description || 'No description provided.'}
          </p>
        </div>

        {/* Evidence */}
        {evidenceUrls.length > 0 && (
          <div className="detail-section">
            <h3>Evidence Attachments ({evidenceUrls.length})</h3>
            <div className="evidence-grid">
              {evidenceUrls.map((url, i) =>
                isImageUrl(url) ? (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Evidence ${i + 1}`} className="evidence-image" />
                  </a>
                ) : (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="evidence-file-link">
                    <FileText size={14} />
                    Evidence file {i + 1}
                  </a>
                )
              )}
            </div>
          </div>
        )}

        {/* AI Verification & GIS De-Duplicator Assessment */}
        {aiInsight && (
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} style={{ color: 'var(--color-primary)' }} />
                AI Verification & Duplicate Analysis
              </h3>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '3px 9px',
                  borderRadius: 12,
                  background: 'var(--color-surface-secondary)',
                  color: 'var(--color-text)',
                }}
              >
                Confidence: {aiInsight.confidenceScore}%
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
              {aiInsight.assessment}
            </p>

            {aiInsight.duplicateCandidates.length > 0 && (
              <div style={{ marginTop: 12, background: 'var(--color-surface-secondary)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-warning)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Layers size={13} />
                  Corroborating / Near-Duplicate Reports:
                </div>
                {aiInsight.duplicateCandidates.map((dup, i) => (
                  <div key={i} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <Link to={`/reports/${dup.report.id}`} style={{ textDecoration: 'underline' }}>
                      #{dup.report.id.slice(0, 8).toUpperCase()} - {dup.report.title}
                    </Link>
                    <span>
                      {dup.distanceKm != null ? `${dup.distanceKm} km · ` : ''}{dup.similarityScore}% match
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Verification info */}
        {(report.verification_notes || report.verified_at) && (
          <div className="detail-section">
            <h3>Authoritative Verification</h3>
            {report.verified_at && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Verified on {formatDate(report.verified_at)}
              </p>
            )}
            {report.verification_notes && (
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--color-text)' }}>
                {report.verification_notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Verifier action form */}
      {canVerify && (
        <div className="verify-form-card">
          <h2>
            <Eye size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--color-primary)' }} />
            Authoritative Verifier Decision
          </h2>
          <form onSubmit={handleVerify}>
            <select
              value={verifyStatus}
              onChange={(e) => setVerifyStatus(e.target.value)}
            >
              <option value="verified">Approve & Verify Incident</option>
              <option value="rejected">Reject Report</option>
              <option value="pending">Mark as Pending Additional Investigation</option>
            </select>
            <textarea
              placeholder="Verification notes, ground confirmation sources, or rationale…"
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
            />
            <button
              type="submit"
              className="primary-button"
              disabled={verifying}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {verifying ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
              {verifying ? 'Updating Status…' : 'Commit Status Update'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
