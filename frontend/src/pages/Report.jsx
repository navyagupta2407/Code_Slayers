import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Upload,
  X,
  Loader2,
  MapPin,
  FileText,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { createReport, uploadEvidence, DISASTER_TYPES, SEVERITIES } from '../services/disasterService';
import { supabase } from '../services/supabase';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const isTableMissingError = (err) =>
  err?.message?.includes('relation') ||
  err?.message?.includes('does not exist') ||
  err?.code === '42P01';

// Subcomponent to handle map click in React Leaflet
function MapClickPicker({ onPickLocation, position }) {
  useMapEvents({
    click(e) {
      onPickLocation(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? (
    <CircleMarker
      center={position}
      radius={10}
      pathOptions={{
        color: '#A65F46',
        fillColor: '#A65F46',
        fillOpacity: 0.85,
        weight: 3,
      }}
    />
  ) : null;
}

export default function Report() {
  const [form, setForm] = useState({
    disaster_type: '',
    title: '',
    description: '',
    location: '',
    severity: '',
    latitude: '',
    longitude: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [dbError, setDbError] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location: prev.location || `GPS (${lat}, ${lng})`,
        }));
        setGpsLoading(false);
        toast.success(`Location detected: ${lat}, ${lng}`);
      },
      (err) => {
        setGpsLoading(false);
        toast.error(`Could not retrieve location: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePickCoordinates = (lat, lng) => {
    const fixedLat = parseFloat(lat.toFixed(6));
    const fixedLng = parseFloat(lng.toFixed(6));
    setForm((prev) => ({
      ...prev,
      latitude: fixedLat,
      longitude: fixedLng,
      location: prev.location || `Selected Location (${fixedLat}, ${fixedLng})`,
    }));
    toast.success(`Coordinates set to ${fixedLat}, ${fixedLng}`);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const file of selected) {
      if (!/^(image|video)\//.test(file.type)) {
        toast.error(`${file.name}: only images and videos are allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: file exceeds 10 MB limit.`);
        continue;
      }
      valid.push(file);
    }
    const combined = [...files, ...valid].slice(0, MAX_FILES);
    if (files.length + valid.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed.`);
    }
    setFiles(combined);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDbError(false);

    if (!form.disaster_type || !form.title || !form.description || !form.location || !form.severity) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const reportPayload = {
        disaster_type: form.disaster_type,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        severity: form.severity,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        evidence_urls: [],
      };

      const report = await createReport(reportPayload);

      // Upload evidence files if any
      if (files.length > 0) {
        const uploadedUrls = [];
        for (const file of files) {
          try {
            const url = await uploadEvidence(file, report.id);
            uploadedUrls.push(url);
          } catch (uploadErr) {
            console.warn('Evidence upload failed for', file.name, uploadErr.message);
          }
        }

        if (uploadedUrls.length > 0) {
          await supabase
            .from('reports')
            .update({ evidence_urls: uploadedUrls })
            .eq('id', report.id);
        }
      }

      toast.success('Report submitted successfully!');
      setSubmitted(true);
      setSubmittedId(report.id);
      setForm({
        disaster_type: '',
        title: '',
        description: '',
        location: '',
        severity: '',
        latitude: '',
        longitude: '',
      });
      setFiles([]);
    } catch (err) {
      if (isTableMissingError(err)) {
        setDbError(true);
        toast.error('Database not set up yet. Please contact the administrator.');
      } else {
        toast.error(err.message || 'Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentCenter =
    form.latitude &&
    form.longitude &&
    !isNaN(parseFloat(form.latitude)) &&
    !isNaN(parseFloat(form.longitude))
      ? [parseFloat(form.latitude), parseFloat(form.longitude)]
      : [22.9734, 78.6569];

  return (
    <div className="report-page">
      <div className="report-heading">
        <div className="dashboard-eyebrow">CITIZEN DISASTER REPORTING</div>
        <h1>Submit a Disaster Report</h1>
        <p>Provide accurate details and evidence to help response teams and protect your community.</p>
      </div>

      {submitted && (
        <div className="report-success-banner">
          <CheckCircle2 size={20} />
          <div>
            <strong>Report submitted successfully!</strong>
            <br />
            Your report has been entered into the verification workflow.{' '}
            {submittedId && (
              <Link to={`/reports/${submittedId}`} style={{ color: 'var(--color-success)', textDecoration: 'underline' }}>
                View report
              </Link>
            )}{' '}
            or{' '}
            <Link to="/dashboard" style={{ color: 'var(--color-success)', textDecoration: 'underline' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      )}

      {dbError && (
        <div className="error-state" style={{ marginBottom: 20 }}>
          <AlertTriangle size={28} />
          <strong>Database not configured</strong>
          <p>
            The &apos;reports&apos; table does not exist in your Supabase project yet.
            Please run the database setup script provided in the documentation.
          </p>
        </div>
      )}

      <form className="report-form" onSubmit={handleSubmit}>
        {/* Disaster Type */}
        <div className="report-field">
          <label htmlFor="disaster_type">
            <AlertTriangle size={15} />
            Disaster Category <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <select
            id="disaster_type"
            name="disaster_type"
            value={form.disaster_type}
            onChange={handleChange}
            required
          >
            <option value="">Select disaster category…</option>
            {DISASTER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="report-field">
          <label htmlFor="title">
            <FileText size={15} />
            Report Title <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g. Flash Flooding along Lower Mall Road"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div className="report-field">
          <label htmlFor="description">
            Detailed Description <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe what occurred, immediate impacts, estimated water levels, road blockages, or affected people…"
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Location & GPS */}
        <div className="report-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="location" style={{ marginBottom: 0 }}>
              <MapPin size={15} />
              Incident Location <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <button
              type="button"
              className="reports-filter-reset"
              onClick={handleDeviceLocation}
              disabled={gpsLoading}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              {gpsLoading ? <Loader2 size={12} className="spin" /> : <Navigation size={12} />}
              {gpsLoading ? 'Detecting…' : 'Use Device GPS'}
            </button>
          </div>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="City, locality, landmark, or specific street address"
            value={form.location}
            onChange={handleChange}
            required
          />
        </div>

        {/* Coordinates + Map Picker Toggle */}
        <div className="report-field-row">
          <div className="report-field" style={{ marginBottom: 0 }}>
            <label htmlFor="latitude">Latitude</label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="e.g. 28.6139"
              value={form.latitude}
              onChange={handleChange}
            />
          </div>
          <div className="report-field" style={{ marginBottom: 0 }}>
            <label htmlFor="longitude">Longitude</label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="e.g. 77.2090"
              value={form.longitude}
              onChange={handleChange}
            />
          </div>
        </div>

        <div style={{ marginTop: 8, marginBottom: 20 }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowMapPicker((v) => !v)}
            style={{ fontSize: 13, padding: '7px 14px' }}
          >
            <Compass size={14} />
            {showMapPicker ? 'Hide Interactive Map Picker' : 'Pick Location on Map'}
          </button>
        </div>

        {/* Interactive Map Picker */}
        {showMapPicker && (
          <div style={{ marginBottom: 24, border: '1.5px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: 'var(--color-surface-secondary)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Click anywhere on the map to place the incident marker and capture exact coordinates.
            </div>
            <div style={{ height: 260, width: '100%' }}>
              <MapContainer
                center={currentCenter}
                zoom={form.latitude ? 11 : 4}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickPicker
                  onPickLocation={handlePickCoordinates}
                  position={form.latitude && form.longitude ? [parseFloat(form.latitude), parseFloat(form.longitude)] : null}
                />
              </MapContainer>
            </div>
          </div>
        )}

        {/* Severity */}
        <div className="report-field">
          <label htmlFor="severity">
            Observed Severity <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <select
            id="severity"
            name="severity"
            value={form.severity}
            onChange={handleChange}
            required
          >
            <option value="">Select severity level…</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s} Severity</option>
            ))}
          </select>
        </div>

        {/* Evidence Upload */}
        <div
          className="report-upload"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <Upload size={28} />
          <p>Click to upload supporting photo or video evidence</p>
          <span>Geotagged photos, damage assessments, or waterlevel evidence</span>
          <small>Max {MAX_FILES} files · Up to 10 MB per file</small>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
          />
        </div>

        {/* Evidence Previews */}
        {files.length > 0 && (
          <div className="evidence-preview-list">
            {files.map((file, idx) => (
              <div key={idx} className="evidence-preview-item">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} />
                ) : (
                  <div className="evidence-file-label">{file.name}</div>
                )}
                <button
                  type="button"
                  className="evidence-remove-btn"
                  onClick={() => removeFile(idx)}
                  aria-label="Remove file"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Notice */}
        <div className="report-notice">
          <AlertTriangle size={16} />
          <p>
            Please ensure all details are factual and accurate. Submitted data is reviewed through
            our AI verification and GIS duplicate-detection workflow before public broadcast.
          </p>
        </div>

        <button
          type="submit"
          className="primary-button"
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
          disabled={loading || dbError}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
          {loading ? 'Submitting Report…' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
