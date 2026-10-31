
import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export default function HeatmapLayer({
  incidents = [],
  enabled = true
}) {
  const map = useMap();

  const heatPoints = useMemo(() => {

    return incidents
      .filter(incident => {

        const lat = Number(incident.latitude);
        const lng = Number(incident.longitude);

        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          lat >= 6 &&
          lat <= 38 &&
          lng >= 68 &&
          lng <= 98
        );

      })
      .map(incident => {

        const reportCount = Math.max(
          1,
          Number(incident.report_count) || 1
        );

        // Every located incident contributes visible heat.
        const intensity = Math.min(
          1,
          0.65 + (reportCount - 1) * 0.10
        );

        return [
          Number(incident.latitude),
          Number(incident.longitude),
          intensity
        ];

      });

  }, [incidents]);

  useEffect(() => {

    if (!enabled || heatPoints.length === 0) {
      return;
    }

    const heatLayer = L.heatLayer(
      heatPoints,
      {
        radius: 48,
        blur: 38,
        minOpacity: 0.5,
        maxZoom: 12,
        max: 1,

        gradient: {
          0.2: "#ffffb2",
          0.4: "#fecc5c",
          0.6: "#fd8d3c",
          0.8: "#f03b20",
          1.0: "#bd0026"
        }
      }
    );

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };

  }, [map, heatPoints, enabled]);

  return null;
}
