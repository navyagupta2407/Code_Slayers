
import { GeoJSON } from "react-leaflet";
import indiaStatesRaw from "../geojson/india-states.geojson?raw";

// Load India's state and UT boundaries.
export const indiaStates = JSON.parse(indiaStatesRaw);

// Normalize state names for reliable matching.
export function normalizeStateName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ");
}

// Handle alternative state names.
function canonicalStateName(name = "") {
  const normalized = normalizeStateName(name);

  const aliases = {
    "nct of delhi": "delhi",
    "national capital territory of delhi": "delhi",
    "orissa": "odisha",
    "pondicherry": "puducherry",
    "uttaranchal": "uttarakhand"
  };

  return aliases[normalized] || normalized;
}

// Identify whether the nationwide option is selected.
export function isAllIndiaSelection(state) {
  const value = normalizeStateName(state);

  return (
    value === "" ||
    value === "all" ||
    value === "all india" ||
    value === "india"
  );
}

// Read state name from GeoJSON properties.
export function getStateName(feature) {
  return (
    feature?.properties?.shapeName ||
    feature?.properties?.ST_NM ||
    feature?.properties?.NAME_1 ||
    "Unknown"
  );
}

// Find the actual GeoJSON feature for a selected state.
export function findStateFeature(stateName) {
  const target = canonicalStateName(stateName);

  return indiaStates.features.find(feature => {
    return (
      canonicalStateName(getStateName(feature)) === target
    );
  });
}

export default function StateBoundaries({
  selectedState = "all",
  onStateSelect
}) {

  function getStyle(feature) {

    const selected =
      !isAllIndiaSelection(selectedState) &&
      canonicalStateName(getStateName(feature)) ===
        canonicalStateName(selectedState);

    return {
      color: selected ? "#1d4ed8" : "#2563eb",
      weight: selected ? 3 : 1.2,
      opacity: 0.9,
      fillColor: selected ? "#60a5fa" : "#93c5fd",
      fillOpacity: selected ? 0.22 : 0.035
    };

  }

  function handleEachFeature(feature, layer) {

    const originalName = getStateName(feature);

    const normalizedName =
      canonicalStateName(originalName);

    layer.bindTooltip(originalName, {
      sticky: true,
      direction: "auto"
    });

    layer.on({

      click: () => {

        if (normalizedName === "unknown") {
          return;
        }

        const currentState =
          canonicalStateName(selectedState);

        onStateSelect?.(
          currentState === normalizedName
            ? "all"
            : originalName
        );

      },

      mouseover: () => {

        layer.setStyle({
          weight: 3,
          fillOpacity: 0.2
        });

      },

      mouseout: () => {

        layer.setStyle(getStyle(feature));

      }

    });

  }

  return (

    <GeoJSON
      key={normalizeStateName(selectedState)}
      data={indiaStates}
      style={getStyle}
      onEachFeature={handleEachFeature}
    />

  );

}
