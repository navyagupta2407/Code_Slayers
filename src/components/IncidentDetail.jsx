
import {
  confidencePercent,
  formatDate,
  hasValidCoords
} from "../lib/gis";

export default function IncidentDetail({ item }) {

  if (!item) {
    return (
      <div className="empty-detail">
        Select an incident to inspect its evidence.
      </div>
    );
  }

  const reports = item.reports || [];

  return (

    <div className="detail-body">

      <div className="detail-head">

        <span className="incident-id">
          {item.id}
        </span>

        <span
          className={`status-pill ${item.verification_status}`}
        >
          {item.verification_status}
        </span>

      </div>

      <h3>{item.title}</h3>

      <p className="muted">
        {item.description || "No description available"}
      </p>

      <div className="detail-metrics">

        <div>
          <small>AI confidence</small>
          <b>
            {confidencePercent(item.ai_confidence)}
          </b>
        </div>

        <div>
          <small>Location confidence</small>
          <b>
            {confidencePercent(item.location_confidence)}
          </b>
        </div>

        <div>
          <small>Total reports</small>
          <b>{item.report_count ?? 0}</b>
        </div>

        <div>
          <small>Additional linked reports</small>
          <b>{item.duplicate_report_count ?? 0}</b>
        </div>

      </div>

      <div className="detail-meta">

        <div>
          <b>Disaster type</b>
          <span>{item.disaster_type}</span>
        </div>

        <div>
          <b>State</b>
          <span>{item.state || "Unknown"}</span>
        </div>

        <div>
          <b>Severity</b>
          <span>{item.severity || "Unknown"}</span>
        </div>

        <div>
          <b>Location source</b>
          <span>{item.location_source || "Unknown"}</span>
        </div>

        <div>
          <b>Coordinates</b>
          <span>
            {hasValidCoords(item)
              ? `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
              : "Location not established"}
          </span>
        </div>

        <div>
          <b>Submitted</b>
          <span>{formatDate(item.created_at)}</span>
        </div>

      </div>

      <div className="evidence">

        <h4>Linked evidence reports</h4>

        <p className="muted tiny">
          These reports are linked to this canonical
          incident by the backend.
        </p>

        {reports.length > 0 ? (

          reports.map(report => (

            <div
              className="evidence-row"
              key={report.id}
            >

              <span>{report.id}</span>

              <b>{report.label}</b>

              <em>{report.similarity}</em>

            </div>

          ))

        ) : (

          <p className="muted tiny">
            No individual evidence records available.
          </p>

        )}

      </div>

    </div>

  );

}
