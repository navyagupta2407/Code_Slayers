
import { useMemo } from "react";

const INDIA_ADMIN_UNITS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

function getStatus(incident) {
  return String(
    incident.verification_status || "pending"
  ).toLowerCase();
}

export default function GeographicCoverage({ items = [] }) {

  const analytics = useMemo(() => {

    const stateMap = new Map();

    let totalReports = 0;

    items.forEach(incident => {

      const state = String(
        incident.state || ""
      ).trim();

      const reports = Math.max(
        1,
        Number(incident.report_count) || 1
      );

      totalReports += reports;

      if (!state) return;

      if (!stateMap.has(state)) {

        stateMap.set(state, {
          state,
          incidents: 0,
          reports: 0,
          verified: 0,
          pending: 0,
          rejected: 0
        });

      }

      const entry = stateMap.get(state);

      entry.incidents += 1;
      entry.reports += reports;

      const status = getStatus(incident);

      if (status === "verified") {
        entry.verified += 1;
      } else if (status === "rejected") {
        entry.rejected += 1;
      } else {
        entry.pending += 1;
      }

    });

    const stateData = [...stateMap.values()]
      .sort((a, b) => b.reports - a.reports);

    const representedStates = stateData.length;

    const coveragePercentage = Number(
      (
        representedStates /
        INDIA_ADMIN_UNITS.length
      ) * 100
    ).toFixed(1);

    const maxReports = Math.max(
      1,
      ...stateData.map(item => item.reports)
    );

    return {
      stateData,
      representedStates,
      totalReports,
      coveragePercentage,
      maxReports
    };

  }, [items]);

  const topStates = analytics.stateData.slice(0, 5);

  return (

    <section className="geo-coverage">

      <div className="geo-coverage-header">

        <div>
          <h2>India Geographic Coverage</h2>

          <p>
            State-wise disaster incident distribution
          </p>
        </div>

        <span className="geo-coverage-badge">
          Nationwide GIS
        </span>

      </div>

      <div className="geo-coverage-stats">

        <div className="geo-stat-card">

          <strong>
            {analytics.representedStates}
          </strong>

          <span>States / UTs represented</span>

        </div>

        <div className="geo-stat-card">

          <strong>
            {INDIA_ADMIN_UNITS.length}
          </strong>

          <span>Total states / UTs</span>

        </div>

        <div className="geo-stat-card">

          <strong>
            {analytics.coveragePercentage}%
          </strong>

          <span>Geographic coverage</span>

        </div>

        <div className="geo-stat-card">

          <strong>
            {analytics.totalReports}
          </strong>

          <span>Total reports represented</span>

        </div>

      </div>

      <div className="geo-coverage-progress">

        <div className="geo-progress-heading">

          <strong>India coverage progress</strong>

          <span>
            {analytics.representedStates} / 36
          </span>

        </div>

        <div className="geo-progress-track">

          <div
            className="geo-progress-fill"
            style={{
              width: `${analytics.coveragePercentage}%`
            }}
          />

        </div>

        <small>
          Percentage of India's 36 states and union territories
          represented in the currently filtered incidents.
        </small>

      </div>

      <div className="geo-coverage-content">

        <div className="geo-state-ranking">

          <h3>Top 5 States by Report Volume</h3>

          {topStates.length === 0 ? (

            <p>No state-level data available.</p>

          ) : (

            topStates.map((item, index) => (

              <div
                className="geo-ranking-item"
                key={item.state}
              >

                <div className="geo-ranking-heading">

                  <strong>
                    {index + 1}. {item.state}
                  </strong>

                  <span>
                    {item.reports} reports
                  </span>

                </div>

                <div className="geo-ranking-track">

                  <div
                    className="geo-ranking-fill"
                    style={{
                      width: `${
                        (item.reports /
                          analytics.maxReports) * 100
                      }%`
                    }}
                  />

                </div>

                <small>
                  {item.incidents} incidents
                </small>

              </div>

            ))

          )}

        </div>

        <div className="geo-state-table">

          <h3>State-wise Incident Breakdown</h3>

          {analytics.stateData.length === 0 ? (

            <p>No geographic records available.</p>

          ) : (

            <div className="geo-table-scroll">

              <table>

                <thead>
                  <tr>
                    <th>State / UT</th>
                    <th>Incidents</th>
                    <th>Reports</th>
                    <th>Verified</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                  </tr>
                </thead>

                <tbody>

                  {analytics.stateData.map(item => (

                    <tr key={item.state}>

                      <td>{item.state}</td>
                      <td>{item.incidents}</td>
                      <td>{item.reports}</td>
                      <td>{item.verified}</td>
                      <td>{item.pending}</td>
                      <td>{item.rejected}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      <p className="geo-coverage-note">
        Statistics are calculated from the currently visible
        incident records. Report counts are not necessarily
        counts of unique disasters.
      </p>

    </section>

  );

}
