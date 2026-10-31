
// import { useEffect, useMemo, useState } from "react";

// import DisasterMap from "./components/DisasterMap";
// import IncidentDetail from "./components/IncidentDetail";
// import Analytics from "./components/Analytics";
// import GeographicCoverage from "./components/GeographicCoverage";
// import { demoIncidents } from "./data/demoIncidents";

// import {
//   filterIncidents,
//   hasValidCoords
// } from "./lib/gis";

// import { getIncidents } from "./lib/api";

// import "./styles.css";

// const states = [
//   "Andhra Pradesh",
//   "Arunachal Pradesh",
//   "Assam",
//   "Bihar",
//   "Chhattisgarh",
//   "Goa",
//   "Gujarat",
//   "Haryana",
//   "Himachal Pradesh",
//   "Jharkhand",
//   "Karnataka",
//   "Kerala",
//   "Madhya Pradesh",
//   "Maharashtra",
//   "Manipur",
//   "Meghalaya",
//   "Mizoram",
//   "Nagaland",
//   "Odisha",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Tamil Nadu",
//   "Telangana",
//   "Tripura",
//   "Uttar Pradesh",
//   "Uttarakhand",
//   "West Bengal",
//   "Andaman and Nicobar Islands",
//   "Chandigarh",
//   "Dadra and Nagar Haveli and Daman and Diu",
//   "Delhi",
//   "Jammu and Kashmir",
//   "Ladakh",
//   "Lakshadweep",
//   "Puducherry"
// ];

// export default function App({ token = null }) {

//   const [items, setItems] = useState(demoIncidents);

//   const [loading, setLoading] = useState(
//     import.meta.env.VITE_USE_API === "true"
//   );

//   const [apiError, setApiError] = useState("");

//   const [status, setStatus] = useState("all");

//   const [type, setType] = useState("all");

//   const [stateFilter, setStateFilter] = useState("all");

//   const [search, setSearch] = useState("");

//   const [minConfidence, setMinConfidence] = useState(0);

//   const [selectedId, setSelectedId] = useState(
//     demoIncidents[0]?.id || null
//   );

//   const [focusCounter, setFocusCounter] = useState(0);

//   const useAPI =
//     import.meta.env.VITE_USE_API === "true";

//   // Load incidents from backend.
//   useEffect(() => {

//     if (!useAPI) {
//       setItems(demoIncidents);
//       setLoading(false);
//       return;
//     }

//     const controller = new AbortController();

//     async function loadIncidents() {

//       try {

//         setLoading(true);
//         setApiError("");

//         const data = await getIncidents(
//           token,
//           controller.signal
//         );

//         setItems(data);

//       } catch (error) {

//         if (error.name !== "AbortError") {
//           setApiError(error.message);
//         }

//       } finally {

//         if (!controller.signal.aborted) {
//           setLoading(false);
//         }

//       }

//     }

//     loadIncidents();

//     const interval = setInterval(
//       loadIncidents,
//       30000
//     );

//     return () => {
//       controller.abort();
//       clearInterval(interval);
//     };

//   }, [useAPI, token]);

//   // Apply all filters.
//   const visible = useMemo(() => {

//     return filterIncidents(items, {

//       status,
//       type,
//       state: stateFilter,
//       search,
//       minConfidence: minConfidence / 100

//     });

//   }, [
//     items,
//     status,
//     type,
//     stateFilter,
//     search,
//     minConfidence
//   ]);

//   // Selected incident.
//   const selected = visible.find(
//     item => item.id === selectedId
//   );

//   // Located and unlocated incidents.
//   const located = visible.filter(hasValidCoords);

//   const unlocated = visible.filter(
//     item => !hasValidCoords(item)
//   );

//   // Select an incident and focus map.
//   function selectIncident(id) {

//     setSelectedId(id);

//     setFocusCounter(value => value + 1);

//   }

//   // Reset all filters.
//   function resetFilters() {

//     setStatus("all");
//     setType("all");
//     setStateFilter("all");
//     setSearch("");
//     setMinConfidence(0);

//   }

//   return (

//     <main className="dashboard">

//       <header className="dashboard-header">

//         <div>

//           <h1>DisasterLens AI</h1>

//           <p>
//             India-wide Disaster Intelligence Dashboard
//           </p>

//         </div>

//         <div className="header-status">

//           <span className="live-dot" />

//           {useAPI ? "Live API mode" : "Demo mode"}

//         </div>

//       </header>

//       {apiError && (

//         <div className="api-error">

//           Backend connection failed: {apiError}

//         </div>

//       )}

//       {loading && (

//         <div className="loading-message">
//           Loading incident records...
//         </div>

//       )}

//       <section className="dashboard-filters">

//         <div className="filter-field">

//           <label>Search incidents</label>

//           <input
//             type="text"
//             placeholder="Search ID, title or state..."
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//           />

//         </div>

//         <div className="filter-field">

//           <label>Verification status</label>

//           <select
//             value={status}
//             onChange={e => setStatus(e.target.value)}
//           >

//             <option value="all">All statuses</option>
//             <option value="verified">Verified</option>
//             <option value="pending">Pending</option>
//             <option value="rejected">Rejected</option>

//           </select>

//         </div>

//         <div className="filter-field">

//           <label>Disaster type</label>

//           <select
//             value={type}
//             onChange={e => setType(e.target.value)}
//           >

//             <option value="all">All disasters</option>
//             <option value="flood">Flood</option>
//             <option value="waterlogging">Waterlogging</option>
//             <option value="storm">Storm</option>
//             <option value="rain">Rain</option>
//             <option value="landslide">Landslide</option>

//           </select>

//         </div>

//         <div className="filter-field">

//           <label>State / UT</label>

//           <select
//             value={stateFilter}
//             onChange={e => setStateFilter(e.target.value)}
//           >

//             <option value="all">All India</option>

//             {states.map(state => (

//               <option
//                 key={state}
//                 value={state}
//               >
//                 {state}
//               </option>

//             ))}

//           </select>

//         </div>

//         <div className="filter-field confidence-field">

//           <label>
//             Minimum AI confidence: {minConfidence}%
//           </label>

//           <input
//             type="range"
//             min="0"
//             max="100"
//             step="5"
//             value={minConfidence}
//             onChange={e =>
//               setMinConfidence(Number(e.target.value))
//             }
//           />

//         </div>

//         <button
//           className="reset-button"
//           onClick={resetFilters}
//         >
//           Reset filters
//         </button>

//       </section>

//       <section className="overview-strip">

//         <div>
//           <strong>{visible.length}</strong>
//           <span>Visible incidents</span>
//         </div>

//         <div>
//           <strong>{located.length}</strong>
//           <span>Located incidents</span>
//         </div>

//         <div>
//           <strong>{unlocated.length}</strong>
//           <span>Unlocated incidents</span>
//         </div>

//       </section>

//       <section className="map-section">

//         <div className="section-title">

//           <h2>India Disaster Map</h2>

//           <span>
//             {located.length} mapped incidents
//           </span>

//         </div>

//         <DisasterMap
//           items={visible}
//           selectedId={selected?.id}
//           onSelect={selectIncident}
//           focusCounter={focusCounter}
//           selectedState={stateFilter}
//           onStateSelect={setStateFilter}
//         />

//       </section>

//       <section className="incident-layout">

//         <div className="incident-list">

//           <div className="section-title">
//             <h2>Incident Reports</h2>
//             <span>{visible.length} results</span>
//           </div>

//           {visible.length === 0 && (

//             <p>No incidents match your filters.</p>

//           )}

//           {visible.map(incident => (

//             <button

//               key={incident.id}

//               className={
//                 `incident-card ${
//                   selectedId === incident.id
//                     ? "selected"
//                     : ""
//                 }`
//               }

//               onClick={() =>
//                 selectIncident(incident.id)
//               }

//             >

//               <div className="incident-card-top">

//                 <strong>{incident.title}</strong>

//                 <span
//                   className={`status-pill ${incident.verification_status}`}
//                 >
//                   {incident.verification_status}
//                 </span>

//               </div>

//               <p>
//                 {incident.state || "State unknown"}
//                 {" · "}
//                 {incident.disaster_type}
//               </p>

//               <small>
//                 {incident.id}
//                 {" · "}
//                 {incident.report_count || 0} reports
//               </small>

//               {!hasValidCoords(incident) && (

//                 <small className="location-warning">
//                   Location unavailable
//                 </small>

//               )}

//             </button>

//           ))}

//         </div>

//         <div className="evidence-panel">

//           <div className="section-title">
//             <h2>Evidence Inspector</h2>
//           </div>

//           <IncidentDetail item={selected} />

//         </div>

//       </section>

//       {unlocated.length > 0 && (

//         <section className="unlocated-section">

//           <h3>Reports without established coordinates</h3>

//           <p>
//             These reports remain available in the incident
//             feed but are not plotted on the map.
//           </p>

//           {unlocated.map(item => (

//             <div key={item.id}>
//               {item.id} — {item.title}
//             </div>

//           ))}

//         </section>

//       )}
//       <section className="geographic-analytics-section">

//   <GeographicCoverage items={visible} />

// </section>
//       <section className="analytics-section">

//         <div className="section-title">
//           <h2>Disaster Analytics</h2>
//         </div>

//         <Analytics items={visible} />

//       </section>
      

//       <footer className="dashboard-footer">

//         DisasterLens AI · India-wide GIS Intelligence

//       </footer>

//     </main>

//   );

// }


import { useEffect, useMemo, useState } from "react";

import DisasterMap from "./components/DisasterMap";
import IncidentDetail from "./components/IncidentDetail";
import Analytics from "./components/Analytics";
import GeographicCoverage from "./components/GeographicCoverage";

import { demoIncidents } from "./data/demoIncidents";

import {
  filterIncidents,
  hasValidCoords,
  summary as getSummary
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


const navItems = [
  { id: "overview", label: "Overview", symbol: "◫" },
  { id: "map", label: "Live Map", symbol: "⌖" },
  { id: "incidents", label: "Incidents", symbol: "▤" },
  { id: "analytics", label: "Analytics", symbol: "▥" },
  { id: "evidence", label: "Evidence", symbol: "◇" }
];


export default function App({ token = null }) {

  // Navigation.
  const [activeView, setActiveView] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Incident data.
  const [items, setItems] = useState(demoIncidents);

  const [loading, setLoading] = useState(
    import.meta.env.VITE_USE_API === "true"
  );

  const [apiError, setApiError] = useState("");

  // Filters.
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);

  // Selected incident.
  const [selectedId, setSelectedId] = useState(
    demoIncidents[0]?.id || null
  );

  const [focusCounter, setFocusCounter] = useState(0);

  const useAPI =
    import.meta.env.VITE_USE_API === "true";


  // Load incidents from FastAPI.
  useEffect(() => {

    if (!useAPI) {
      setItems(demoIncidents);
      setLoading(false);
      setApiError("");
      return;
    }

    const controller = new AbortController();

    let firstLoad = true;

    async function loadIncidents() {

      if (firstLoad) {
        setLoading(true);
      }

      try {

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

        if (firstLoad && !controller.signal.aborted) {
          setLoading(false);
          firstLoad = false;
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


  // Apply filters across all navigation sections.
  const visible = useMemo(() => {

    return filterIncidents(items, {

      status,
      type,
      state: stateFilter,
      search,
      minConfidence

    });

  }, [
    items,
    status,
    type,
    stateFilter,
    search,
    minConfidence
  ]);


  // Dashboard calculations.
  const stats = getSummary(visible);

  const located = visible.filter(hasValidCoords);

  const unlocated = visible.filter(
    item => !hasValidCoords(item)
  );

  const coveragePercent = visible.length
    ? Math.round(
        (located.length / visible.length) * 100
      )
    : 0;


  // Keep a usable selection when filters change.
  const selected =
    visible.find(item => item.id === selectedId) ||
    visible[0] ||
    null;


  // Select incident and focus the map.
  function selectIncident(id) {

    setSelectedId(id);

    setFocusCounter(value => value + 1);

  }


  // Navigate between dashboard sections.
  function navigateTo(view) {

    setActiveView(view);

    setMobileNavOpen(false);

  }


  // Reset filters.
  function resetFilters() {

    setStatus("all");
    setType("all");
    setStateFilter("all");
    setSearch("");
    setMinConfidence(0);

  }


  return (

    <div className="dl-app">

      {/* =================================
          HEADER
      ================================= */}

      <header className="dl-topbar">

        <div className="dl-brand">

          <div className="dl-brand-mark">
            DL
          </div>

          <div className="dl-brand-copy">

            <span className="dl-eyebrow">
              NATIONAL DISASTER INTELLIGENCE
            </span>

            <h1>
              DisasterLens <span>AI</span>
            </h1>

            <p>
              India-wide Disaster Monitoring Platform
            </p>

          </div>

        </div>


        <div className="dl-header-actions">

          <div className="dl-mode-pill">

            <span className="dl-live-dot" />

            {useAPI ? "LIVE API MODE" : "DEMO MODE"}

          </div>


          <button
            type="button"
            className="dl-menu-toggle"
            onClick={() =>
              setMobileNavOpen(value => !value)
            }
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <span />
            <span />
            <span />
          </button>

        </div>

      </header>


      {/* =================================
          NAVIGATION BAR
      ================================= */}

      <nav
        className={`dl-navbar ${
          mobileNavOpen ? "is-open" : ""
        }`}
        aria-label="Main navigation"
      >

        {navItems.map(item => (

          <button

            key={item.id}

            type="button"

            className={`dl-nav-item ${
              activeView === item.id ? "active" : ""
            }`}

            onClick={() => navigateTo(item.id)}

            aria-current={
              activeView === item.id
                ? "page"
                : undefined
            }

          >

            <span className="dl-nav-symbol">
              {item.symbol}
            </span>

            <span>
              {item.label}
            </span>

          </button>

        ))}

      </nav>


      <main className="dl-content">


        {/* =================================
            BACKEND STATUS
        ================================= */}

        {apiError && (

          <div className="dl-error-banner">

            <strong>Backend connection failed.</strong>

            <span>
              {apiError}. Currently displayed records may be demo data.
            </span>

          </div>

        )}


        {loading && (

          <div className="dl-loading-banner">
            Loading incident records...
          </div>

        )}


        {/* =================================
            GLOBAL FILTERS
        ================================= */}

        <details className="dl-filter-drawer">

          <summary>

            <span>
              <strong>⌕ Filter dashboard data</strong>
            </span>

            <span className="dl-filter-summary">
              {visible.length} matching incidents · Applies to all sections
            </span>

          </summary>


          <div className="dl-filter-grid">

            <label className="dl-filter-field">

              <span>Search incidents</span>

              <input
                type="text"
                placeholder="ID, title, state or district..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

            </label>


            <label className="dl-filter-field">

              <span>Verification status</span>

              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
              >

                <option value="all">All statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>

              </select>

            </label>


            <label className="dl-filter-field">

              <span>Disaster type</span>

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

            </label>


            <label className="dl-filter-field">

              <span>State / UT</span>

              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
              >

                <option value="all">All India</option>

                {states.map(state => (

                  <option key={state} value={state}>
                    {state}
                  </option>

                ))}

              </select>

            </label>


            <label className="dl-filter-field dl-confidence">

              <span>
                Minimum AI confidence: {minConfidence}%
              </span>

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

            </label>


            <button
              type="button"
              className="dl-reset-button"
              onClick={resetFilters}
            >
              Reset filters
            </button>

          </div>

        </details>



        {/* =================================
            OVERVIEW PAGE
        ================================= */}

        {activeView === "overview" && (

          <>

            <section className="dl-view-intro">

              <div>

                <span className="dl-eyebrow">
                  NATIONAL SITUATION REPORT
                </span>

                <h2>Dashboard Overview</h2>

                <p>
                  Monitor disaster incidents, verification activity
                  and geographic coverage across India.
                </p>

              </div>


              <button
                type="button"
                className="dl-primary-button"
                onClick={() => navigateTo("map")}
              >
                Explore live map →
              </button>

            </section>



            {/* Statistics */}

            <div className="dl-stat-grid">


              <div className="dl-stat-card">

                <div className="dl-stat-icon amber">
                  !
                </div>

                <span>Total incidents</span>

                <strong>{stats.incidents}</strong>

                <small>Unique canonical incidents</small>

              </div>


              <div className="dl-stat-card">

                <div className="dl-stat-icon blue">
                  ◉
                </div>

                <span>Citizen reports</span>

                <strong>{stats.reports}</strong>

                <small>Total associated submissions</small>

              </div>


              <div className="dl-stat-card">

                <div className="dl-stat-icon green">
                  ✓
                </div>

                <span>Verified incidents</span>

                <strong>{stats.verified}</strong>

                <small>Successfully verified</small>

              </div>


              <div className="dl-stat-card">

                <div className="dl-stat-icon purple">
                  ◈
                </div>

                <span>Linked duplicates</span>

                <strong>{stats.duplicates}</strong>

                <small>Additional linked reports</small>

              </div>


            </div>



            {/* Overview panels */}

            <div className="dl-overview-grid">


              <section className="dl-panel">

                <div className="dl-panel-heading">

                  <div>

                    <h3>Incident Feed</h3>

                    <p>
                      Incidents matching your current filters
                    </p>

                  </div>

                  <button
                    type="button"
                    className="dl-text-button"
                    onClick={() => navigateTo("incidents")}
                  >
                    View all →
                  </button>

                </div>


                <div className="dl-recent-list">

                  {visible.slice(0, 5).map(incident => (

                    <button
                      key={incident.id}
                      type="button"
                      className="dl-recent-row"
                      onClick={() => {
                        selectIncident(incident.id);
                        navigateTo("evidence");
                      }}
                    >

                      <span
                        className={`dl-status-dot ${
                          incident.verification_status || "pending"
                        }`}
                      />

                      <span className="dl-recent-copy">

                        <strong>
                          {incident.title || incident.id}
                        </strong>

                        <small>
                          {incident.state || "Unknown location"}
                          {" · "}
                          {incident.disaster_type || "Unknown type"}
                        </small>

                      </span>

                      <span className="dl-chevron">
                        →
                      </span>

                    </button>

                  ))}


                  {visible.length === 0 && (

                    <p className="dl-empty">
                      No incidents match your filters.
                    </p>

                  )}

                </div>

              </section>



              <section className="dl-panel dl-coverage-card">

                <div className="dl-panel-heading">

                  <div>

                    <h3>Geographic Coverage</h3>

                    <p>Location availability of incidents</p>

                  </div>

                  <span className="dl-coverage-icon">
                    ⌖
                  </span>

                </div>


                <div className="dl-coverage-numbers">

                  <strong>{coveragePercent}%</strong>

                  <span>Incidents with valid coordinates</span>

                </div>


                <div className="dl-progress-track">

                  <div
                    className="dl-progress-fill"
                    style={{
                      width: `${coveragePercent}%`
                    }}
                  />

                </div>


                <div className="dl-coverage-mini-grid">

                  <div>

                    <strong>{located.length}</strong>

                    <span>Located</span>

                  </div>

                  <div>

                    <strong>{unlocated.length}</strong>

                    <span>Unlocated</span>

                  </div>

                </div>


                <button
                  type="button"
                  className="dl-secondary-button"
                  onClick={() => navigateTo("analytics")}
                >
                  Explore geographic analytics →
                </button>

              </section>


            </div>

          </>

        )}



        {/* =================================
            LIVE MAP PAGE
        ================================= */}

        {activeView === "map" && (

          <section>

            <div className="dl-view-intro">

              <div>

                <span className="dl-eyebrow">
                  GEOSPATIAL MONITORING
                </span>

                <h2>India Disaster Map</h2>

                <p>
                  Explore incident locations, state boundaries,
                  clusters and disaster heatmaps.
                </p>

              </div>

              <span className="dl-count-pill">
                {located.length} mapped incidents
              </span>

            </div>


            <div className="dl-panel dl-map-panel">

              <DisasterMap
                items={visible}
                selectedId={selected?.id}
                onSelect={selectIncident}
                focusCounter={focusCounter}
                selectedState={stateFilter}
                onStateSelect={setStateFilter}
              />

            </div>

          </section>

        )}



        {/* =================================
            INCIDENTS PAGE
        ================================= */}

        {activeView === "incidents" && (

          <section>

            <div className="dl-view-intro">

              <div>

                <span className="dl-eyebrow">
                  DISASTER REPORT MANAGEMENT
                </span>

                <h2>Incident Reports</h2>

                <p>
                  Browse incidents, check their status and inspect
                  their associated evidence.
                </p>

              </div>

              <span className="dl-count-pill">
                {visible.length} results
              </span>

            </div>


            <div className="dl-incident-grid">

              {visible.map(incident => (

                <button

                  key={incident.id}

                  type="button"

                  className="dl-incident-card"

                  onClick={() => {
                    selectIncident(incident.id);
                    navigateTo("evidence");
                  }}

                >

                  <div className="dl-incident-card-top">

                    <span className="dl-incident-id">
                      {incident.id}
                    </span>

                    <span
                      className={`status-pill ${
                        incident.verification_status || "pending"
                      }`}
                    >
                      {incident.verification_status || "pending"}
                    </span>

                  </div>


                  <h3>
                    {incident.title || "Untitled incident"}
                  </h3>


                  <p>
                    {incident.state || "Unknown state"}
                    {" · "}
                    {incident.district || "Unknown district"}
                  </p>


                  <div className="dl-incident-meta">

                    <span>
                      {incident.disaster_type || "Unknown type"}
                    </span>

                    <span>
                      {incident.report_count || 0} reports
                    </span>

                  </div>


                  <div className="dl-inspect-link">
                    Inspect evidence →
                  </div>

                </button>

              ))}


              {visible.length === 0 && (

                <div className="dl-empty">
                  No incidents found. Try resetting your filters.
                </div>

              )}

            </div>

          </section>

        )}



        {/* =================================
            ANALYTICS PAGE
        ================================= */}

        {activeView === "analytics" && (

          <section>

            <div className="dl-view-intro">

              <div>

                <span className="dl-eyebrow">
                  DATA INTELLIGENCE
                </span>

                <h2>Disaster Analytics</h2>

                <p>
                  Understand disaster patterns, state-wise coverage
                  and incident distribution.
                </p>

              </div>

            </div>


            <div className="dl-analytics-block">

              <GeographicCoverage items={visible} />

            </div>


            <div className="dl-analytics-block">

              <Analytics items={visible} />

            </div>

          </section>

        )}



        {/* =================================
            EVIDENCE INSPECTOR PAGE
        ================================= */}

        {activeView === "evidence" && (

          <section>

            <div className="dl-view-intro">

              <div>

                <span className="dl-eyebrow">
                  AI VERIFICATION AND EVIDENCE
                </span>

                <h2>Evidence Inspector</h2>

                <p>
                  Inspect selected incidents, confidence scores
                  and linked citizen reports.
                </p>

              </div>

            </div>


            <div className="dl-evidence-layout">


              {/* Incident selector */}

              <div className="dl-panel">

                <div className="dl-panel-heading">

                  <div>

                    <h3>Select Incident</h3>

                    <p>
                      {visible.length} available incidents
                    </p>

                  </div>

                </div>


                <div className="dl-evidence-list">

                  {visible.map(incident => (

                    <button
                      key={incident.id}
                      type="button"
                      className={`dl-evidence-choice ${
                        selected?.id === incident.id
                          ? "is-selected"
                          : ""
                      }`}
                      onClick={() =>
                        selectIncident(incident.id)
                      }
                    >

                      <span className="dl-evidence-choice-copy">

                        <strong>
                          {incident.title || incident.id}
                        </strong>

                        <small>
                          {incident.id}
                          {" · "}
                          {incident.state || "Unknown state"}
                        </small>

                      </span>

                      <span>→</span>

                    </button>

                  ))}


                  {visible.length === 0 && (

                    <p className="dl-empty">
                      No incidents available.
                    </p>

                  )}

                </div>

              </div>



              {/* Evidence details */}

              <div className="dl-panel">

                <div className="dl-panel-heading">

                  <div>

                    <h3>Incident Evidence</h3>

                    <p>
                      Detailed incident information
                    </p>

                  </div>

                </div>


                <IncidentDetail item={selected} />

              </div>


            </div>

          </section>

        )}


      </main>


      {/* =================================
          FOOTER
      ================================= */}

      <footer className="dl-footer">

        <strong>DisasterLens AI</strong>

        <span>
          India-wide Disaster Intelligence and GIS Monitoring
        </span>

      </footer>

    </div>

  );

}
