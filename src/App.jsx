
import { useEffect, useMemo, useState } from "react";

import DisasterMap from "./components/DisasterMap";
import IncidentDetail from "./components/IncidentDetail";
import Analytics from "./components/Analytics";
import GeographicCoverage from "./components/GeographicCoverage";
import { demoIncidents } from "./data/demoIncidents";

import {
  filterIncidents,
  hasValidCoords
} from "./lib/gis";

import { getIncidents } from "./lib/api";

import "./styles.css";

const states = [
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

export default function App({ token = null }) {

  const [items, setItems] = useState(demoIncidents);

  const [loading, setLoading] = useState(
    import.meta.env.VITE_USE_API === "true"
  );

  const [apiError, setApiError] = useState("");

  const [status, setStatus] = useState("all");

  const [type, setType] = useState("all");

  const [stateFilter, setStateFilter] = useState("all");

  const [search, setSearch] = useState("");

  const [minConfidence, setMinConfidence] = useState(0);

  const [selectedId, setSelectedId] = useState(
    demoIncidents[0]?.id || null
  );

  const [focusCounter, setFocusCounter] = useState(0);

  const useAPI =
    import.meta.env.VITE_USE_API === "true";

  // Load incidents from backend.
  useEffect(() => {

    if (!useAPI) {
      setItems(demoIncidents);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadIncidents() {

      try {

        setLoading(true);
        setApiError("");

        const data = await getIncidents(
          token,
          controller.signal
        );

        setItems(data);

      } catch (error) {

        if (error.name !== "AbortError") {
          setApiError(error.message);
        }

      } finally {

        if (!controller.signal.aborted) {
          setLoading(false);
        }

      }

    }

    loadIncidents();

    const interval = setInterval(
      loadIncidents,
      30000
    );

    return () => {
      controller.abort();
      clearInterval(interval);
    };

  }, [useAPI, token]);

  // Apply all filters.
  const visible = useMemo(() => {

    return filterIncidents(items, {

      status,
      type,
      state: stateFilter,
      search,
      minConfidence: minConfidence / 100

    });

  }, [
    items,
    status,
    type,
    stateFilter,
    search,
    minConfidence
  ]);

  // Selected incident.
  const selected = visible.find(
    item => item.id === selectedId
  );

  // Located and unlocated incidents.
  const located = visible.filter(hasValidCoords);

  const unlocated = visible.filter(
    item => !hasValidCoords(item)
  );

  // Select an incident and focus map.
  function selectIncident(id) {

    setSelectedId(id);

    setFocusCounter(value => value + 1);

  }

  // Reset all filters.
  function resetFilters() {

    setStatus("all");
    setType("all");
    setStateFilter("all");
    setSearch("");
    setMinConfidence(0);

  }

  return (

    <main className="dashboard">

      <header className="dashboard-header">

        <div>

          <h1>DisasterLens AI</h1>

          <p>
            India-wide Disaster Intelligence Dashboard
          </p>

        </div>

        <div className="header-status">

          <span className="live-dot" />

          {useAPI ? "Live API mode" : "Demo mode"}

        </div>

      </header>

      {apiError && (

        <div className="api-error">

          Backend connection failed: {apiError}

        </div>

      )}

      {loading && (

        <div className="loading-message">
          Loading incident records...
        </div>

      )}

      <section className="dashboard-filters">

        <div className="filter-field">

          <label>Search incidents</label>

          <input
            type="text"
            placeholder="Search ID, title or state..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

        </div>

        <div className="filter-field">

          <label>Verification status</label>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
          >

            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>

          </select>

        </div>

        <div className="filter-field">

          <label>Disaster type</label>

          <select
            value={type}
            onChange={e => setType(e.target.value)}
          >

            <option value="all">All disasters</option>
            <option value="flood">Flood</option>
            <option value="waterlogging">Waterlogging</option>
            <option value="storm">Storm</option>
            <option value="rain">Rain</option>
            <option value="landslide">Landslide</option>

          </select>

        </div>

        <div className="filter-field">

          <label>State / UT</label>

          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
          >

            <option value="all">All India</option>

            {states.map(state => (

              <option
                key={state}
                value={state}
              >
                {state}
              </option>

            ))}

          </select>

        </div>

        <div className="filter-field confidence-field">

          <label>
            Minimum AI confidence: {minConfidence}%
          </label>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minConfidence}
            onChange={e =>
              setMinConfidence(Number(e.target.value))
            }
          />

        </div>

        <button
          className="reset-button"
          onClick={resetFilters}
        >
          Reset filters
        </button>

      </section>

      <section className="overview-strip">

        <div>
          <strong>{visible.length}</strong>
          <span>Visible incidents</span>
        </div>

        <div>
          <strong>{located.length}</strong>
          <span>Located incidents</span>
        </div>

        <div>
          <strong>{unlocated.length}</strong>
          <span>Unlocated incidents</span>
        </div>

      </section>

      <section className="map-section">

        <div className="section-title">

          <h2>India Disaster Map</h2>

          <span>
            {located.length} mapped incidents
          </span>

        </div>

        <DisasterMap
          items={visible}
          selectedId={selected?.id}
          onSelect={selectIncident}
          focusCounter={focusCounter}
          selectedState={stateFilter}
          onStateSelect={setStateFilter}
        />

      </section>

      <section className="incident-layout">

        <div className="incident-list">

          <div className="section-title">
            <h2>Incident Reports</h2>
            <span>{visible.length} results</span>
          </div>

          {visible.length === 0 && (

            <p>No incidents match your filters.</p>

          )}

          {visible.map(incident => (

            <button

              key={incident.id}

              className={
                `incident-card ${
                  selectedId === incident.id
                    ? "selected"
                    : ""
                }`
              }

              onClick={() =>
                selectIncident(incident.id)
              }

            >

              <div className="incident-card-top">

                <strong>{incident.title}</strong>

                <span
                  className={`status-pill ${incident.verification_status}`}
                >
                  {incident.verification_status}
                </span>

              </div>

              <p>
                {incident.state || "State unknown"}
                {" · "}
                {incident.disaster_type}
              </p>

              <small>
                {incident.id}
                {" · "}
                {incident.report_count || 0} reports
              </small>

              {!hasValidCoords(incident) && (

                <small className="location-warning">
                  Location unavailable
                </small>

              )}

            </button>

          ))}

        </div>

        <div className="evidence-panel">

          <div className="section-title">
            <h2>Evidence Inspector</h2>
          </div>

          <IncidentDetail item={selected} />

        </div>

      </section>

      {unlocated.length > 0 && (

        <section className="unlocated-section">

          <h3>Reports without established coordinates</h3>

          <p>
            These reports remain available in the incident
            feed but are not plotted on the map.
          </p>

          {unlocated.map(item => (

            <div key={item.id}>
              {item.id} — {item.title}
            </div>

          ))}

        </section>

      )}
      <section className="geographic-analytics-section">

  <GeographicCoverage items={visible} />

</section>
      <section className="analytics-section">

        <div className="section-title">
          <h2>Disaster Analytics</h2>
        </div>

        <Analytics items={visible} />

      </section>
      

      <footer className="dashboard-footer">

        DisasterLens AI · India-wide GIS Intelligence

      </footer>

    </main>

  );

}
