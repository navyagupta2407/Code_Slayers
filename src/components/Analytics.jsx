
// import {
//   ResponsiveContainer,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid
// } from "recharts";

// import { summary } from "../lib/gis";

// export default function Analytics({ items = [] }) {

//   const stats = summary(items);

//   // Count incidents by disaster type.
//   const disasterData = Object.entries(

//     items.reduce((acc, incident) => {

//       const type =
//         incident.disaster_type || "unknown";

//       acc[type] = (acc[type] || 0) + 1;

//       return acc;

//     }, {})

//   ).map(([type, count]) => ({
//     type,
//     count
//   }));

//   // Count incidents by state.
//   const stateData = Object.entries(

//     items.reduce((acc, incident) => {

//       const state = incident.state || "Unknown";

//       acc[state] = (acc[state] || 0) + 1;

//       return acc;

//     }, {})

//   )
//   .map(([state, count]) => ({
//     state,
//     count
//   }))
//   .sort((a, b) => b.count - a.count)
//   .slice(0, 10);

//   const cards = [
//     {
//       title: "Unique incidents",
//       value: stats.incidents
//     },
//     {
//       title: "Citizen submissions",
//       value: stats.reports
//     },
//     {
//       title: "Additional linked reports",
//       value: stats.duplicates
//     },
//     {
//       title: "Verified incidents",
//       value: stats.verified
//     }
//   ];

//   return (

//     <section className="analytics">

//       <div className="stat-grid">

//         {cards.map(card => (

//           <div
//             className="stat"
//             key={card.title}
//           >

//             <span>{card.title}</span>

//             <strong>{card.value}</strong>

//           </div>

//         ))}

//       </div>

//       <div className="chart-grid">

//         <div className="chart-card">

//           <h3>Incidents by disaster type</h3>

//           <div className="chart-area">

//             {disasterData.length > 0 ? (

//               <ResponsiveContainer
//                 width="100%"
//                 height="100%"
//               >

//                 <BarChart data={disasterData}>

//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                   />

//                   <XAxis
//                     dataKey="type"
//                     tick={{ fontSize: 10 }}
//                   />

//                   <YAxis
//                     allowDecimals={false}
//                   />

//                   <Tooltip />

//                   <Bar
//                     dataKey="count"
//                     fill="#2879b9"
//                     radius={[5, 5, 0, 0]}
//                   />

//                 </BarChart>

//               </ResponsiveContainer>

//             ) : (
//               <p>No disaster data available.</p>
//             )}

//           </div>

//         </div>

//         <div className="chart-card">

//           <h3>Top 10 states by incidents</h3>

//           <div className="chart-area">

//             {stateData.length > 0 ? (

//               <ResponsiveContainer
//                 width="100%"
//                 height="100%"
//               >

//                 <BarChart
//                   data={stateData}
//                   layout="vertical"
//                   margin={{
//                     left: 15,
//                     right: 15
//                   }}
//                 >

//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                   />

//                   <XAxis
//                     type="number"
//                     allowDecimals={false}
//                   />

//                   <YAxis
//                     type="category"
//                     dataKey="state"
//                     width={110}
//                     tick={{ fontSize: 10 }}
//                   />

//                   <Tooltip />

//                   <Bar
//                     dataKey="count"
//                     fill="#16a36a"
//                     radius={[0, 5, 5, 0]}
//                   />

//                 </BarChart>

//               </ResponsiveContainer>

//             ) : (
//               <p>No state data available.</p>
//             )}

//           </div>

//         </div>

//       </div>

//     </section>

//   );

// }


import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { summary } from "../lib/gis";

const COLORS = [
  "#2879b9",
  "#16a36a",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#64748b"
];

const STATUS_COLORS = {
  verified: "#16a36a",
  pending: "#f59e0b",
  rejected: "#ef4444",
  unknown: "#64748b"
};

const SEVERITY_COLORS = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#16a36a",
  unknown: "#64748b"
};

function confidenceValue(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
}

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <div className="chart-area">
        {children}
      </div>
    </div>
  );
}

export default function Analytics({ items = [] }) {

  const safeItems = Array.isArray(items) ? items : [];
  const stats = summary(safeItems);

  // 1. Incidents by disaster type
  const disasterCounts = {};

  safeItems.forEach(item => {
    const type = (
      item.disaster_type ||
      item.incident_type ||
      "unknown"
    ).toLowerCase();

    disasterCounts[type] = (disasterCounts[type] || 0) + 1;
  });

  const disasterData = Object.entries(disasterCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // 2. Top 10 states
  const stateCounts = {};

  safeItems.forEach(item => {
    const state = item.state || "Unknown";
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  });

  const stateData = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 3. Incident trends over time
  const dailyCounts = {};

  safeItems.forEach(item => {
    if (!item.created_at) return;

    const date = new Date(item.created_at);

    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);

    dailyCounts[key] = (dailyCounts[key] || 0) + 1;
  });

  const trendData = Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: new Date(date + "T00:00:00").toLocaleDateString(
        "en-IN",
        { day: "2-digit", month: "short" }
      ),
      count
    }));

  // 4. Verification status distribution
  const statusData = [
    "verified",
    "pending",
    "rejected",
    "unknown"
  ].map(status => ({
    name: status,
    count: safeItems.filter(item => {
      const value = (
        item.verification_status ||
        item.status ||
        "unknown"
      ).toLowerCase();

      return value === status;
    }).length
  })).filter(item => item.count > 0);

  // 5. Severity distribution
  const severityData = [
    "high",
    "medium",
    "low",
    "unknown"
  ].map(severity => ({
    name: severity,
    count: safeItems.filter(item => {
      const value = (item.severity || "unknown").toLowerCase();
      return value === severity;
    }).length
  })).filter(item => item.count > 0);

  // 6. AI confidence distribution
  const confidenceBuckets = [
    { name: "0–49%", min: 0, max: 0.5 },
    { name: "50–69%", min: 0.5, max: 0.7 },
    { name: "70–84%", min: 0.7, max: 0.85 },
    { name: "85–100%", min: 0.85, max: 1.01 }
  ];

  const confidenceData = confidenceBuckets.map(bucket => ({
    range: bucket.name,
    count: safeItems.filter(item => {
      const confidence = confidenceValue(item.ai_confidence);

      return confidence !== null &&
        confidence >= bucket.min &&
        confidence < bucket.max;
    }).length
  }));

  const unknownConfidence = safeItems.filter(
    item => confidenceValue(item.ai_confidence) === null
  ).length;

  if (unknownConfidence > 0) {
    confidenceData.push({
      range: "Unknown",
      count: unknownConfidence
    });
  }

  // 7. State-wise disaster comparison
  const stateDisasterCounts = {};

  safeItems.forEach(item => {
    const state = item.state || "Unknown";
    const type = (
      item.disaster_type ||
      item.incident_type ||
      "unknown"
    ).toLowerCase();

    if (!stateDisasterCounts[state]) {
      stateDisasterCounts[state] = {};
    }

    stateDisasterCounts[state][type] =
      (stateDisasterCounts[state][type] || 0) + 1;
  });

  const comparisonStates = Object.entries(stateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([state]) => state);

  const comparisonTypes = disasterData
    .slice(0, 5)
    .map(item => item.type);

  const comparisonData = comparisonStates.map(state => {
    const row = { state };

    comparisonTypes.forEach(type => {
      row[type] = stateDisasterCounts[state]?.[type] || 0;
    });

    return row;
  });

  const cards = [
    { title: "Unique incidents", value: stats.incidents },
    { title: "Citizen submissions", value: stats.reports },
    { title: "Additional linked reports", value: stats.duplicates },
    { title: "Verified incidents", value: stats.verified }
  ];

  return (
    <section className="analytics">

      {/* SUMMARY CARDS */}
      <div className="stat-grid">
        {cards.map(card => (
          <div className="stat" key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="chart-grid">

        {/* GRAPH 1 */}
        <ChartCard title="Incidents by disaster type">
          {disasterData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={disasterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2879b9" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No disaster data available.</p>}
        </ChartCard>

        {/* GRAPH 2 */}
        <ChartCard title="Top 10 states by incidents">
          {stateData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="state"
                  width={110}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#16a36a" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No state data available.</p>}
        </ChartCard>

        {/* GRAPH 3 */}
        <ChartCard title="Incident trends over time">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2879b9"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : <p>No date information available.</p>}
        </ChartCard>

        {/* GRAPH 4 */}
        <ChartCard title="Verification status distribution">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map(item => (
                    <Cell
                      key={item.name}
                      fill={STATUS_COLORS[item.name]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p>No verification data available.</p>}
        </ChartCard>

        {/* GRAPH 5 */}
        <ChartCard title="Disaster severity distribution">
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {severityData.map(item => (
                    <Cell
                      key={item.name}
                      fill={SEVERITY_COLORS[item.name]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p>No severity data available.</p>}
        </ChartCard>

        {/* GRAPH 6 */}
        <ChartCard title="AI confidence distribution">
          {confidenceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No confidence data available.</p>}
        </ChartCard>

        {/* GRAPH 7 */}
        <ChartCard title="State-wise disaster comparison">
          {comparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                layout="vertical"
                margin={{ left: 15, right: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="state"
                  width={110}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Legend />
                {comparisonTypes.map((type, index) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    stackId="disasters"
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : <p>No comparison data available.</p>}
        </ChartCard>

      </div>
    </section>
  );
}

