
import { useState, useEffect, useMemo } from "react";

import HeatmapLayer from "./HeatmapLayer";

import StateBoundaries, {
  indiaStates,
  findStateFeature,
  isAllIndiaSelection
} from "./StateBoundaries";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";

import L from "leaflet";

import {
  hasValidCoords,
  confidencePercent
} from "../lib/gis";

import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

// Incident status colors.
const statusColors = {
  verified: "#16a36a",
  pending: "#e8a23b",
  rejected: "#dc5555"
};

// Create custom incident marker icons.
function createIncidentIcon(incident, selected) {

  const color =
    statusColors[incident.verification_status] ||
    "#64748b";

  const size = selected ? 25 : 19;

  return L.divIcon({

    className: "incident-marker-wrapper",

    html: `
      <div
        class="incident-marker"
        style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: ${selected ? "4px" : "3px"} solid white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.45);
        "
      ></div>
    `,

    iconSize: [size, size],

    iconAnchor: [size / 2, size / 2],

    popupAnchor: [0, -size / 2]

  });

}


// ==========================================
// 1. MOVE MAP TO SELECTED INCIDENT
// ==========================================

function MoveToIncident({
  incident,
  focusCounter
}) {

  const map = useMap();

  useEffect(() => {

    if (
      focusCounter === 0 ||
      !incident ||
      !hasValidCoords(incident)
    ) {
      return;
    }

    map.flyTo(
      [
        incident.latitude,
        incident.longitude
      ],
      11,
      {
        duration: 0.8
      }
    );

  }, [
    incident?.id,
    focusCounter,
    map
  ]);

  return null;

}


// ==========================================
// 2. MOVE MAP TO SEARCHED LOCATION
// ==========================================

function MoveToLocation({ location }) {

  const map = useMap();

  useEffect(() => {

    if (
      !location ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      return;
    }

    map.flyTo(
      [
        location.latitude,
        location.longitude
      ],
      11,
      {
        duration: 0.8
      }
    );

  }, [location, map]);

  return null;

}


// ==========================================
// 3. MOVE MAP TO SELECTED STATE
// ==========================================

function MoveToState({ selectedState }) {

  const map = useMap();

  useEffect(() => {

    let bounds;

    // All India selected.
    if (isAllIndiaSelection(selectedState)) {

      bounds = L.geoJSON(indiaStates).getBounds();

      if (!bounds.isValid()) {
        return;
      }

      map.flyToBounds(
        bounds,
        {
          padding: [20, 20],
          maxZoom: 5,
          duration: 0.9
        }
      );

      return;

    }

    // Find selected state's GeoJSON boundary.
    const selectedFeature =
      findStateFeature(selectedState);

    if (!selectedFeature) {

      console.warn(
        "State boundary not found:",
        selectedState
      );

      return;

    }

    // Calculate geographical bounds.
    bounds = L.geoJSON(selectedFeature).getBounds();

    if (!bounds.isValid()) {
      return;
    }

    // Automatically zoom into selected state.
    map.flyToBounds(
      bounds,
      {
        padding: [35, 35],
        maxZoom: 9,
        duration: 0.9
      }
    );

  }, [selectedState, map]);

  return null;

}


// ==========================================
// 4. MAIN DISASTER MAP
// ==========================================

export default function DisasterMap({

  items = [],

  selectedId,

  onSelect,

  focusCounter = 0,

  searchLocation = null,

  selectedState = "all",

  onStateSelect

}) {

  const [showHeatmap, setShowHeatmap] =
    useState(false);


  // Only valid incident coordinates.
  const locatedIncidents = useMemo(

    () => items.filter(hasValidCoords),

    [items]

  );


  // Currently selected incident.
  const selectedIncident = locatedIncidents.find(

    item => item.id === selectedId

  );


  return (

    <div className="map-frame">

      {/* Heatmap toggle */}

      <div className="heatmap-controls">

        <button

          type="button"

          className={
            showHeatmap ? "heatmap-active" : ""
          }

          onClick={() =>
            setShowHeatmap(value => !value)
          }

        >

          {showHeatmap
            ? "Hide Heatmap"
            : "Show Heatmap"}

        </button>

      </div>


      <MapContainer

        center={[22.9734, 78.6569]}

        zoom={5}

        minZoom={4}

        maxZoom={18}

        scrollWheelZoom={true}

        className="leaflet-map"

      >

        {/* MAP BACKGROUND */}

        <TileLayer

          url={
            import.meta.env.VITE_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          }

          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

        />


        {/* HEATMAP */}

        <HeatmapLayer

          incidents={locatedIncidents}

          enabled={showHeatmap}

        />


        {/* INCIDENT SELECTION */}

        <MoveToIncident

          incident={selectedIncident}

          focusCounter={focusCounter}

        />


        {/* LOCATION SEARCH */}

        <MoveToLocation

          location={searchLocation}

        />


        {/* AUTOMATIC STATE ZOOM */}

        <MoveToState

          selectedState={selectedState}

        />


        {/* INDIA STATE BOUNDARIES */}

        <StateBoundaries

          selectedState={selectedState}

          onStateSelect={onStateSelect}

        />


        {/* MARKER CLUSTERING */}

        <MarkerClusterGroup

          chunkedLoading={true}

          maxClusterRadius={60}

          spiderfyOnMaxZoom={true}

          showCoverageOnHover={false}

          zoomToBoundsOnClick={true}

          removeOutsideVisibleBounds={true}

        >

          {locatedIncidents.map(incident => {

            const isSelected =
              incident.id === selectedId;

            const icon = createIncidentIcon(
              incident,
              isSelected
            );

            return (

              <Marker

                key={incident.id}

                position={[
                  incident.latitude,
                  incident.longitude
                ]}

                icon={icon}

                eventHandlers={{

                  click: () => {
                    onSelect?.(incident.id);
                  }

                }}

              >

                <Popup>

                  <div className="map-popup">

                    <strong>
                      {incident.title}
                    </strong>

                    <p>
                      ID: {incident.id}
                    </p>

                    <p>
                      State: {incident.state || "Unknown"}
                    </p>

                    <p>
                      Disaster: {incident.disaster_type}
                    </p>

                    <p>
                      Status: {incident.verification_status}
                    </p>

                    <p>
                      AI Confidence: {
                        confidencePercent(
                          incident.ai_confidence
                        )
                      }
                    </p>

                    <p>
                      Reports: {
                        incident.report_count || 1
                      }
                    </p>

                    <button
                      onClick={() =>
                        onSelect?.(incident.id)
                      }
                    >
                      View incident details
                    </button>

                  </div>

                </Popup>

              </Marker>

            );

          })}

        </MarkerClusterGroup>

      </MapContainer>


      {/* MAP LEGEND */}

      <div className="map-legend">

        <div>
          <span className="legend-dot verified-dot" />
          Verified
        </div>

        <div>
          <span className="legend-dot pending-dot" />
          Pending
        </div>

        <div>
          <span className="legend-dot rejected-dot" />
          Rejected
        </div>

      </div>


      {/* INCIDENT COUNTER */}

      <div className="map-count">

        {locatedIncidents.length} located incidents

      </div>

    </div>

  );

}
