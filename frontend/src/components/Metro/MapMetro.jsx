import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import metroLines from '../../data/metroLines';

// Fix default marker icons for leaflet in many bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href
});

function MapController({ highlightedRoute, selectedLineId }) {
  const map = useMap();

  useEffect(() => {
    if (highlightedRoute && highlightedRoute.length > 0) {
      try {
        const bounds = highlightedRoute.map(([lat, lng]) => [lat, lng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } catch (e) {
        console.warn('Error fitting bounds:', e);
      }
    } else if (selectedLineId) {
      // fit to selected line handling both local 'line-1' and backend '1'
      const line = metroLines.find(l => String(l.id) === String(selectedLineId) || l.id.replace('line-', '') === String(selectedLineId));
      if (line) {
        const bounds = line.stations.map(s => [s.lat, s.lng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [highlightedRoute, selectedLineId, map]);

  return null;
}

function MapMetro({ height = 400, selectedLineId = null, highlightedRoute = null, onStationClick = null }) {
  // center on Kochi
  const center = [9.9312, 76.2673];

  return (
    <div className="map-wrapper" style={{ height }}>
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController highlightedRoute={highlightedRoute} selectedLineId={selectedLineId} />

        {metroLines.map((line) => {
          const latlngs = line.stations.map(s => [s.lat, s.lng]);
          let isSelected = false;
          if (selectedLineId !== null) {
            const strId = String(selectedLineId);
            isSelected = String(line.id) === strId || line.id.replace('line-', '') === strId;
          }
          const isDimmed = selectedLineId !== null && !isSelected;

          if (isDimmed) return null;

          return (
            <React.Fragment key={line.id}>
              <Polyline
                positions={latlngs}
                pathOptions={{
                  color: line.color,
                  weight: isSelected ? 8 : (isDimmed ? 3 : 5),
                  opacity: isSelected ? 1 : (isDimmed ? 0.2 : 0.8)
                }}
              />

              {line.stations.map((station, idx) => {
                // Hide stations for non-selected lines if a specific line is highlighted
                if (isDimmed) return null;

                return (
                  <Marker
                    key={`${line.id}-${idx}`}
                    position={[station.lat, station.lng]}
                    eventHandlers={{
                      click: () => {
                        if (typeof onStationClick === 'function') onStationClick(station, line);
                      }
                    }}
                  >
                    <Popup>
                      <div>
                        <strong>{station.name}</strong>
                        <div style={{ fontSize: '0.9em', marginTop: '4px' }}>{line.name}</div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}

        {highlightedRoute && highlightedRoute.length > 0 && (
          <Polyline positions={highlightedRoute} pathOptions={{ color: '#00aaff', weight: 8, dashArray: '6 4', opacity: 0.95 }} />
        )}
      </MapContainer>
    </div>
  );
}

export default MapMetro;

