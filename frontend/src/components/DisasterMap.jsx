import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle } from 'lucide-react';

const SEVERITY_COLORS = {
  High: '#B94B43',
  Medium: '#B7833F',
  Low: '#647B5A',
};

function getColor(severity) {
  return SEVERITY_COLORS[severity] || '#78866B';
}

export default function DisasterMap({ reports = [], loading = false, error = null }) {
  const validReports = reports.filter(
    (r) =>
      r.latitude != null &&
      r.longitude != null &&
      !isNaN(parseFloat(r.latitude)) &&
      !isNaN(parseFloat(r.longitude))
  );

  if (loading) {
    return (
      <div className="disaster-map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text-secondary)' }}>
          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Loading map data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="disaster-map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)' }}>
        <div className="error-state" style={{ border: 'none', background: 'transparent', maxWidth: 360 }}>
          <AlertTriangle size={28} />
          <strong>Failed to load map data</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {validReports.length === 0 && reports.length > 0 && (
        <div className="map-empty-state">
          <h3>No coordinates available</h3>
          <p>
            {reports.length} report{reports.length !== 1 ? 's' : ''} found, but none have
            latitude/longitude coordinates. Reports will appear here once coordinates are added.
          </p>
        </div>
      )}

      {reports.length === 0 && (
        <div className="map-empty-state">
          <h3>No reports match your filters</h3>
          <p>Try adjusting the filters or check back later.</p>
        </div>
      )}

      <div className="disaster-map-container">
        <MapContainer
          center={[22.9734, 78.6569]}
          zoom={5}
          className="disaster-map"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {validReports.map((report) => (
            <CircleMarker
              key={report.id}
              center={[parseFloat(report.latitude), parseFloat(report.longitude)]}
              radius={report.severity === 'High' ? 12 : report.severity === 'Medium' ? 9 : 7}
              pathOptions={{
                color: getColor(report.severity),
                fillColor: getColor(report.severity),
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div className="disaster-popup">
                  <h3>{report.disaster_type || 'Incident'}</h3>
                  <p><strong>{report.title}</strong></p>
                  <p>📍 {report.location || 'Unknown location'}</p>
                  <p>
                    Severity:{' '}
                    <span className={`popup-severity-${(report.severity || '').toLowerCase()}`}>
                      {report.severity || '—'}
                    </span>
                  </p>
                  <p>
                    Status:{' '}
                    <span className={`popup-status popup-status-${report.status}`}>
                      {report.status}
                    </span>
                  </p>
                  <p>
                    <Link
                      to={`/reports/${report.id}`}
                      style={{ color: 'var(--color-primary-dark)', fontWeight: 700, fontSize: 13 }}
                    >
                      View Details →
                    </Link>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <h4>Severity Legend</h4>
        <div className="map-legend-item">
          <span className="legend-dot legend-high" />
          High Severity
        </div>
        <div className="map-legend-item">
          <span className="legend-dot legend-medium" />
          Medium Severity
        </div>
        <div className="map-legend-item">
          <span className="legend-dot legend-low" />
          Low Severity
        </div>
      </div>
    </>
  );
}
