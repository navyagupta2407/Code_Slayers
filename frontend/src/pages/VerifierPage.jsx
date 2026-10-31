import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  ChevronDown,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getReports, updateReportStatus } from '../services/disasterService';
import { analyzeReportAI } from '../services/aiVerificationService';

const isTableMissingError = (err) =>
  err?.message?.includes('relation') ||
  err?.message?.includes('does not exist') ||
  err?.code === '42P01';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

export default function VerifierPage() {
  const { role, updateRole } = useAuth();
  const canAccess = role === 'verifier' || role === 'admin';

  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupRequired, setSetupRequired] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState({});
  const [verifyNotes, setVerifyNotes] = useState({});
  const [submitting, setSubmitting] = useState({});

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    setSetupRequired(false);
    try {
      const [allData] = await Promise.all([getReports()]);
      setAllReports(allData);
      setReports(allData.filter((r) => r.status === 'pending'));
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
    if (canAccess) fetchReportsData();
    else setLoading(false);
  }, [canAccess]);

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (!verifyStatus[id]) {
      setVerifyStatus((prev) => ({ ...prev, [id]: 'verified' }));
    }
  };

  const handleSubmit = async (reportId) => {
    setSubmitting((prev) => ({ ...prev, [reportId]: true }));
    try {
      await updateReportStatus(reportId, verifyStatus[reportId] || 'verified', verifyNotes[reportId] || '');
      toast.success(`Report marked as ${verifyStatus[reportId] || 'verified'}`);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setAllReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: verifyStatus[reportId] || 'verified', verification_notes: verifyNotes[reportId] || '' }
            : r
        )
      );
      setExpandedId(null);
    } catch (err) {
      toast.error(err.message || 'Verification failed.');
    } finally {
      setSubmitting((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  if (!canAccess) {
    return (
      <div className="verifier-page">
        <div className="error-state" style={{ marginTop: 40, textAlign: 'center', padding: '36px 20px' }}>
          <ShieldCheck size={42} style={{ color: 'var(--color-accent)', margin: '0 auto 12px' }} />
          <h2>Verifier Access Required</h2>
          <p style={{ maxWidth: 440, margin: '8px auto 20px', color: 'var(--color-text-secondary)' }}>
            This portal is restricted to authorized field verifiers and administrators to review,
            cross-validate, and approve crowdsourced disaster reports.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => updateRole('verifier')}
            >
              <Sparkles size={16} />
              Switch to Verifier Persona (Demo Mode)
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
      <div className="dashboard-eyebrow">VERIFICATION WORKFLOW & GIS DE-DUPLICATION</div>
      <h1>Verifier Intelligence Queue</h1>
      <p>
        Review pending community submissions, inspect AI duplicate-detection metrics, and commit authoritative verification decisions.
      </p>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="secondary-button" onClick={fetchReportsData} disabled={loading}>
          <RefreshCw size={14} />
          Refresh Queue
        </button>
        {!loading && !error && !setupRequired && (
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            <strong>{reports.length}</strong> report{reports.length !== 1 ? 's' : ''} awaiting review
          </span>
        )}
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)', padding: '20px 0', fontSize: 14 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Loading pending reports…
        </div>
      )}

      {!loading && setupRequired && (
        <div className="empty-state">
          <AlertTriangle size={36} />
          <h3>Database Not Configured</h3>
          <p>The reports table doesn&apos;t exist yet. Please run database migrations in Supabase.</p>
        </div>
      )}

      {!loading && error && (
        <div className="error-state">
          <AlertTriangle size={28} />
          <strong>Failed to load reports</strong>
          <p>{error}</p>
          <button className="secondary-button" style={{ marginTop: 10 }} onClick={fetchReportsData}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {!loading && !error && !setupRequired && reports.length === 0 && (
        <div className="empty-state">
          <CheckCircle2 size={36} style={{ color: 'var(--color-success)' }} />
          <h3>Queue is clear!</h3>
          <p>No pending reports awaiting verification. All submitted reports have been reviewed.</p>
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="verifier-queue">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            const evidenceUrls = Array.isArray(report.evidence_urls) ? report.evidence_urls : [];
            const aiInsight = analyzeReportAI(report, allReports);

            return (
              <div key={report.id} className={`verifier-queue-item${isExpanded ? ' expanded' : ''}`}>
                {/* Header row */}
                <div className="verifier-queue-header" onClick={() => handleToggle(report.id)}>
                  <div>
                    <div className="verifier-queue-title">{report.title}</div>
                    <div className="verifier-queue-meta">
                      <span><AlertTriangle size={12} />{report.disaster_type}</span>
                      <span><MapPin size={12} />{report.location}</span>
                      <span>Submitted: {formatDate(report.created_at)}</span>
                      <span
                        style={{
                          color: report.severity === 'High' ? 'var(--color-danger)'
                            : report.severity === 'Medium' ? 'var(--color-warning)'
                            : 'var(--color-success)',
                          fontWeight: 700,
                        }}
                      >
                        {report.severity} severity
                      </span>
                      {aiInsight?.hasDuplicates && (
                        <span style={{ color: 'var(--color-warning)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Layers size={11} />
                          {aiInsight.duplicateCandidates.length} Duplicate Candidate{aiInsight.duplicateCandidates.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    style={{
                      color: 'var(--color-text-secondary)',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}
                  />
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="verifier-queue-body">
                    {/* AI Decision Support Panel */}
                    {aiInsight && (
                      <div
                        style={{
                          background: 'var(--color-surface)',
                          border: '1.5px solid var(--color-border)',
                          borderRadius: 10,
                          padding: '16px 20px',
                          marginBottom: 20,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                            <Cpu size={16} style={{ color: 'var(--color-primary)' }} />
                            <span>AI Verification & GIS De-Duplicator Engine</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>Confidence Score:</span>
                            <span
                              style={{
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: 12,
                                background: aiInsight.confidenceScore >= 70 ? 'var(--color-accent-soft)' : 'var(--color-surface-secondary)',
                                color: aiInsight.confidenceScore >= 70 ? 'var(--color-primary-dark)' : 'var(--color-warning)',
                              }}
                            >
                              {aiInsight.confidenceScore}%
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: 12 }}>
                          {aiInsight.assessment}
                        </p>

                        {/* Duplicates list if any */}
                        {aiInsight.duplicateCandidates.length > 0 && (
                          <div style={{ marginTop: 10, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-warning)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Layers size={13} />
                              Potential Duplicate Reports Detected:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {aiInsight.duplicateCandidates.slice(0, 3).map((candidate, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'var(--color-surface-secondary)',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                  }}
                                >
                                  <div>
                                    <strong>#{candidate.report.id.slice(0, 8).toUpperCase()}</strong>: {candidate.report.title}
                                    <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }}>
                                      ({candidate.report.location})
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {candidate.distanceKm != null && (
                                      <span>{candidate.distanceKm} km away</span>
                                    )}
                                    <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                                      {candidate.similarityScore}% similarity
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 10, fontStyle: 'italic' }}>
                          Notice: AI output serves as automated decision support. Human verifiers maintain final verification authority.
                        </div>
                      </div>
                    )}

                    <div className="verifier-detail-section">
                      <h4>Incident Description</h4>
                      <p>{report.description || 'No description provided.'}</p>
                    </div>

                    {evidenceUrls.length > 0 && (
                      <div className="verifier-detail-section">
                        <h4>Evidence Attachments ({evidenceUrls.length})</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                          {evidenceUrls.map((url, i) =>
                            isImageUrl(url) ? (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt={`Evidence ${i + 1}`}
                                  style={{ width: 120, height: 85, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--color-border)' }}
                                />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="evidence-file-link"
                              >
                                Evidence {i + 1}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="verifier-detail-section">
                      <Link
                        to={`/reports/${report.id}`}
                        style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: 13 }}
                      >
                        Open comprehensive report details →
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className="verifier-actions">
                      <select
                        value={verifyStatus[report.id] || 'verified'}
                        onChange={(e) =>
                          setVerifyStatus((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                        style={{ minWidth: 160 }}
                      >
                        <option value="verified">Approve & Verify</option>
                        <option value="rejected">Reject Report</option>
                      </select>
                      <textarea
                        placeholder="Verification notes or reasoning (e.g. Corroborated with municipal flooding sensors)…"
                        value={verifyNotes[report.id] || ''}
                        onChange={(e) =>
                          setVerifyNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                        }
                      />
                      <button
                        className="primary-button"
                        onClick={() => handleSubmit(report.id)}
                        disabled={submitting[report.id]}
                        style={{ flexShrink: 0 }}
                      >
                        {submitting[report.id] ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (verifyStatus[report.id] || 'verified') === 'verified' ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <XCircle size={14} />
                        )}
                        {submitting[report.id] ? 'Committing…' : 'Commit Decision'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
