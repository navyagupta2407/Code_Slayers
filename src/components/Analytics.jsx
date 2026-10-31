
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

import { summary } from "../lib/gis";

export default function Analytics({ items = [] }) {

  const stats = summary(items);

  // Count incidents by disaster type.
  const disasterData = Object.entries(

    items.reduce((acc, incident) => {

      const type =
        incident.disaster_type || "unknown";

      acc[type] = (acc[type] || 0) + 1;

      return acc;

    }, {})

  ).map(([type, count]) => ({
    type,
    count
  }));

  // Count incidents by state.
  const stateData = Object.entries(

    items.reduce((acc, incident) => {

      const state = incident.state || "Unknown";

      acc[state] = (acc[state] || 0) + 1;

      return acc;

    }, {})

  )
  .map(([state, count]) => ({
    state,
    count
  }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 10);

  const cards = [
    {
      title: "Unique incidents",
      value: stats.incidents
    },
    {
      title: "Citizen submissions",
      value: stats.reports
    },
    {
      title: "Additional linked reports",
      value: stats.duplicates
    },
    {
      title: "Verified incidents",
      value: stats.verified
    }
  ];

  return (

    <section className="analytics">

      <div className="stat-grid">

        {cards.map(card => (

          <div
            className="stat"
            key={card.title}
          >

            <span>{card.title}</span>

            <strong>{card.value}</strong>

          </div>

        ))}

      </div>

      <div className="chart-grid">

        <div className="chart-card">

          <h3>Incidents by disaster type</h3>

          <div className="chart-area">

            {disasterData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart data={disasterData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis
                    allowDecimals={false}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#2879b9"
                    radius={[5, 5, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (
              <p>No disaster data available.</p>
            )}

          </div>

        </div>

        <div className="chart-card">

          <h3>Top 10 states by incidents</h3>

          <div className="chart-area">

            {stateData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={stateData}
                  layout="vertical"
                  margin={{
                    left: 15,
                    right: 15
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    type="number"
                    allowDecimals={false}
                  />

                  <YAxis
                    type="category"
                    dataKey="state"
                    width={110}
                    tick={{ fontSize: 10 }}
                  />

                  <Tooltip />

                  <Bar
                    dataKey="count"
                    fill="#16a36a"
                    radius={[0, 5, 5, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (
              <p>No state data available.</p>
            )}

          </div>

        </div>

      </div>

    </section>

  );

}
