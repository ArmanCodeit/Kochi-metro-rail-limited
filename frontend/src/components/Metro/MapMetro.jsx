import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../styles/MapMetro.css';
import {
    METRO_LINES,
    METRO_STATIONS,
    LINE_STATUS,
    STATUS_META,
    getAllStations,
    getFullLines,
    KOCHI_NETWORK_CENTER,
    KOCHI_NETWORK_BOUNDS
} from '../../data/metroNetworkData';

// Fix default leaflet icons in case any fallback is rendered
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
    iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
    shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href
});

/**
 * Creates custom DMRC-style divIcon for metro station markers
 */
const createStationIcon = (station, isInterchange, primaryColor, isSelected) => {
    const size = isInterchange ? 22 : 14;
    const anchor = size / 2;

    const html = isInterchange
        ? `<div class="station-bullet-interchange" style="--line-color: ${primaryColor};">
             <div class="station-bullet-interchange-inner"></div>
           </div>`
        : `<div class="station-bullet-standard" style="--line-color: ${primaryColor};"></div>`;

    return L.divIcon({
        className: `station-marker-container ${isInterchange ? 'is-interchange' : ''} ${isSelected ? 'is-selected' : ''}`,
        html: html,
        iconSize: [size, size],
        iconAnchor: [anchor, anchor],
        popupAnchor: [0, -anchor - 4]
    });
};

/**
 * Controller component for map actions (fit bounds, zoom tracking, reset view)
 */
function MapController({
    highlightedRoute,
    activeLineId,
    targetStation,
    setZoomLevel,
    onMapReady
}) {
    const map = useMap();

    // Register map ready callback
    useEffect(() => {
        if (onMapReady) {
            onMapReady(map);
        }
    }, [map, onMapReady]);

    // Track zoom level for dynamic station label visibility
    useMapEvents({
        zoomend: () => {
            setZoomLevel(map.getZoom());
        }
    });

    // Handle highlighted route or active line selection
    useEffect(() => {
        if (highlightedRoute && highlightedRoute.length > 0) {
            try {
                const bounds = highlightedRoute.map(([lat, lng]) => [lat, lng]);
                map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
            } catch (e) {
                console.warn('Error fitting highlighted route:', e);
            }
        } else if (activeLineId) {
            const line = METRO_LINES.find(l =>
                l.id === activeLineId ||
                l.id.replace('line-', '') === String(activeLineId).replace('line-', '') ||
                (activeLineId === 'line-1' && l.id === 'line-blue') ||
                (activeLineId === 'line-2' && l.id === 'line-pink')
            );
            if (line) {
                const stations = line.stationIds.map(id => METRO_STATIONS[id]).filter(Boolean);
                if (stations.length > 0) {
                    const bounds = stations.map(s => [s.lat, s.lng]);
                    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
                }
            }
        }
    }, [highlightedRoute, activeLineId, map]);

    // Handle pan to specific target station
    useEffect(() => {
        if (targetStation && targetStation.lat && targetStation.lng) {
            map.flyTo([targetStation.lat, targetStation.lng], 14, {
                duration: 1.2,
                easeLinearity: 0.25
            });
        }
    }, [targetStation, map]);

    return null;
}

/**
 * Main MapMetro Component
 */
function MapMetro({
    height = '100%',
    selectedLineId = null,
    highlightedRoute = null,
    onStationClick = null
}) {
    const [mapInstance, setMapInstance] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(11.5);
    const [activeLine, setActiveLine] = useState(selectedLineId);
    const [filterCategory, setFilterCategory] = useState('all'); // 'all', 'operational', 'future'
    const [legendExpanded, setLegendExpanded] = useState(true);
    const [selectedStation, setSelectedStation] = useState(null);

    // Synchronize activeLine with selectedLineId prop
    useEffect(() => {
        if (selectedLineId !== undefined) {
            setActiveLine(selectedLineId);
        }
    }, [selectedLineId]);

    // Normalize activeLine id (handles legacy 'line-1' / 'line-2' from existing code)
    const normalizedActiveLineId = useMemo(() => {
        if (!activeLine) return null;
        if (activeLine === 'line-1' || activeLine === '1') return 'line-blue';
        if (activeLine === 'line-2' || activeLine === '2') return 'line-pink';
        return activeLine;
    }, [activeLine]);

    // Prepare full lines with station data
    const linesData = useMemo(() => getFullLines(), []);
    const allStations = useMemo(() => getAllStations(), []);

    // Filter lines according to legend tabs
    const displayedLines = useMemo(() => {
        if (filterCategory === 'operational') {
            return linesData.filter(l => l.status === LINE_STATUS.OPERATIONAL);
        }
        if (filterCategory === 'future') {
            return linesData.filter(l => l.status !== LINE_STATUS.OPERATIONAL);
        }
        return linesData;
    }, [linesData, filterCategory]);

    // Zoom Handlers
    const handleZoomIn = useCallback(() => {
        if (mapInstance) mapInstance.zoomIn();
    }, [mapInstance]);

    const handleZoomOut = useCallback(() => {
        if (mapInstance) mapInstance.zoomOut();
    }, [mapInstance]);

    const handleResetView = useCallback(() => {
        if (mapInstance) {
            setActiveLine(null);
            setSelectedStation(null);
            mapInstance.fitBounds(KOCHI_NETWORK_BOUNDS, {
                padding: [30, 30],
                maxZoom: 12
            });
        }
    }, [mapInstance]);

    const handleLineClick = useCallback((lineId) => {
        setActiveLine(prev => (prev === lineId ? null : lineId));
    }, []);

    // Resolve highlightedRoute (accepts either lat/lng array or station name strings)
    const resolvedRouteCoords = useMemo(() => {
        if (!highlightedRoute || !Array.isArray(highlightedRoute) || highlightedRoute.length === 0) return null;
        return highlightedRoute.map(item => {
            if (Array.isArray(item) && item.length >= 2) return [item[0], item[1]];
            if (typeof item === 'string') {
                const stn = allStations.find(s => s.name.toLowerCase() === item.toLowerCase() || s.code.toLowerCase() === item.toLowerCase());
                return stn ? [stn.lat, stn.lng] : null;
            }
            if (item && item.lat && item.lng) return [item.lat, item.lng];
            return null;
        }).filter(Boolean);
    }, [highlightedRoute, allStations]);

    // Station Click Handler (supports direct click or explicit role: 'from' | 'to')
    const handleStationSelect = useCallback((station, primaryLine, role = null) => {
        setSelectedStation(station);
        if (typeof onStationClick === 'function') {
            onStationClick(station, primaryLine, role);
        }
    }, [onStationClick]);

    return (
        <div className="kmrl-map-wrapper" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
            {/* ── Custom Floating Map Controls (Top-Left) ── */}
            <div className="kmrl-map-controls">
                <button
                    type="button"
                    className="kmrl-control-btn"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    aria-label="Zoom In"
                >
                    +
                </button>
                <button
                    type="button"
                    className="kmrl-control-btn"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    aria-label="Zoom Out"
                >
                    −
                </button>
                <button
                    type="button"
                    className="kmrl-control-btn btn-fit-network"
                    onClick={handleResetView}
                    title="Fit Entire Network (Reset View)"
                    aria-label="Fit Network"
                >
                    ⛶
                </button>
            </div>

            {/* ── DMRC-Style Floating Network Legend & Line Filter (Top-Right) ── */}
            <div className="kmrl-map-legend">
                <div
                    className="kmrl-legend-header"
                    onClick={() => setLegendExpanded(prev => !prev)}
                    title="Toggle Network Legend"
                >
                    <div className="kmrl-legend-title-group">
                        <div className="kmrl-dmrc-logo-badge">K</div>
                        <span className="kmrl-legend-title">Kochi Metro Network</span>
                    </div>
                    <button type="button" className="kmrl-legend-toggle-btn" aria-label="Toggle">
                        {legendExpanded ? '▲' : '▼'}
                    </button>
                </div>

                {legendExpanded && (
                    <div className="kmrl-legend-body">
                        {/* Filter Category Tabs */}
                        <div className="kmrl-legend-tabs">
                            <button
                                type="button"
                                className={`kmrl-filter-tab ${filterCategory === 'all' ? 'is-active' : ''}`}
                                onClick={() => setFilterCategory('all')}
                            >
                                All ({linesData.length})
                            </button>
                            <button
                                type="button"
                                className={`kmrl-filter-tab ${filterCategory === 'operational' ? 'is-active' : ''}`}
                                onClick={() => setFilterCategory('operational')}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                className={`kmrl-filter-tab ${filterCategory === 'future' ? 'is-active' : ''}`}
                                onClick={() => setFilterCategory('future')}
                            >
                                Future
                            </button>
                        </div>

                        {/* Line Items */}
                        {displayedLines.map(line => {
                            const isLineActive = normalizedActiveLineId === line.id;
                            const statusMeta = STATUS_META[line.status] || STATUS_META[LINE_STATUS.CONCEPTUAL];

                            return (
                                <div
                                    key={line.id}
                                    className={`kmrl-legend-item ${isLineActive ? 'is-active' : ''}`}
                                    onClick={() => handleLineClick(line.id)}
                                    title={`Click to isolate ${line.name}`}
                                >
                                    <div className="kmrl-legend-item-left">
                                        <span
                                            className="kmrl-line-color-pill"
                                            style={{ backgroundColor: line.color }}
                                        />
                                        <div className="kmrl-line-name-wrap">
                                            <span className="kmrl-legend-line-name">{line.name}</span>
                                            <span className="kmrl-legend-station-count">
                                                {line.stationIds.length} Stations • {line.terminalA} ↔ {line.terminalB}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`kmrl-status-badge ${statusMeta.badgeClass}`}>
                                        {line.status === LINE_STATUS.OPERATIONAL
                                            ? 'Active'
                                            : (line.status === LINE_STATUS.UNDER_CONSTRUCTION ? 'Phase 2' : 'DPR')}
                                    </span>
                                </div>
                            );
                        })}

                        {normalizedActiveLineId && (
                            <button
                                type="button"
                                className="kmrl-legend-reset-btn"
                                onClick={() => setActiveLine(null)}
                            >
                                ↺ Show All Lines
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Main Leaflet Map Container ── */}
            <MapContainer
                center={KOCHI_NETWORK_CENTER}
                zoom={11.5}
                zoomControl={false}
                scrollWheelZoom={true}
                dragging={true}
                touchZoom={true}
                className="kmrl-map-container"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & KMRL'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={18}
                />

                <MapController
                    highlightedRoute={resolvedRouteCoords}
                    activeLineId={normalizedActiveLineId}
                    targetStation={selectedStation}
                    setZoomLevel={setZoomLevel}
                    onMapReady={setMapInstance}
                />

                {/* ── Render Metro Lines Polylines ── */}
                {linesData.map(line => {
                    const isSelected = normalizedActiveLineId === line.id;
                    const isDimmed = normalizedActiveLineId !== null && !isSelected;

                    const latlngs = line.stations.map(s => [s.lat, s.lng]);
                    if (latlngs.length < 2) return null;

                    const statusMeta = STATUS_META[line.status] || STATUS_META[LINE_STATUS.CONCEPTUAL];
                    const dashArray = statusMeta.dashArray;

                    return (
                        <React.Fragment key={line.id}>
                            {/* Outer Casing Polyline (Provides crisp contrast over map tiles) */}
                            <Polyline
                                positions={latlngs}
                                pathOptions={{
                                    color: '#0f172a',
                                    weight: isSelected ? 9 : (isDimmed ? 3 : 7),
                                    opacity: isDimmed ? 0.08 : (isSelected ? 0.4 : 0.25),
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                    dashArray: dashArray
                                }}
                            />

                            {/* Core Colored Metro Polyline */}
                            <Polyline
                                positions={latlngs}
                                pathOptions={{
                                    color: line.color,
                                    weight: isSelected ? 7 : (isDimmed ? 2.5 : 5),
                                    opacity: isDimmed ? 0.2 : (isSelected ? 1.0 : 0.92),
                                    lineCap: 'round',
                                    lineJoin: 'round',
                                    dashArray: dashArray
                                }}
                                eventHandlers={{
                                    click: () => handleLineClick(line.id),
                                    mouseover: (e) => {
                                        if (!normalizedActiveLineId) {
                                            e.target.setStyle({ weight: 7, opacity: 1 });
                                        }
                                    },
                                    mouseout: (e) => {
                                        if (!normalizedActiveLineId) {
                                            e.target.setStyle({ weight: 5, opacity: 0.92 });
                                        }
                                    }
                                }}
                            />
                        </React.Fragment>
                    );
                })}

                {/* ── Render Optional Highlighted Route ── */}
                {resolvedRouteCoords && resolvedRouteCoords.length > 0 && (
                    <Polyline
                        positions={resolvedRouteCoords}
                        pathOptions={{
                            color: '#0284c7',
                            weight: 8,
                            dashArray: '6, 6',
                            opacity: 0.95
                        }}
                    />
                )}

                {/* ── Render Station Markers ── */}
                {allStations.map(station => {
                    // Check if this station belongs to the active line (if a line is isolated)
                    const belongsToActiveLine = !normalizedActiveLineId ||
                        station.lineIds.includes(normalizedActiveLineId);

                    const isDimmed = normalizedActiveLineId && !belongsToActiveLine;
                    if (isDimmed) return null; // Hide markers outside selected corridor for ultra-clean view

                    // Determine primary line color for station bullet
                    const primaryLine = linesData.find(l => station.lineIds.includes(l.id)) || linesData[0];
                    const primaryColor = primaryLine ? primaryLine.color : '#0077c8';
                    const isSelected = selectedStation?.id === station.id;

                    const stationLines = linesData.filter(l => station.lineIds.includes(l.id));

                    // Show label permanently if interchange station or zoomed in (>= 13)
                    const showPermanentLabel = station.isInterchange || zoomLevel >= 13;

                    return (
                        <Marker
                            key={station.id}
                            position={[station.lat, station.lng]}
                            icon={createStationIcon(station, station.isInterchange, primaryColor, isSelected)}
                            eventHandlers={{
                                click: () => handleStationSelect(station, primaryLine)
                            }}
                        >
                            {/* Station Name Tooltip */}
                            <Tooltip
                                direction="top"
                                offset={[0, station.isInterchange ? -14 : -10]}
                                opacity={0.96}
                                permanent={showPermanentLabel}
                                className={`metro-station-tooltip ${station.isInterchange ? 'is-interchange' : ''}`}
                            >
                                <span>{station.name}</span>
                            </Tooltip>

                            {/* DMRC-Inspired Station Popup Card */}
                            <Popup
                                className="kmrl-station-popup"
                                maxWidth={300}
                                autoPan={true}
                                autoPanPadding={[60, 60]}
                                closeButton={true}
                            >
                                <div
                                    className="kmrl-popup-header"
                                    style={{ '--header-line-color': primaryColor }}
                                >
                                    <div className="kmrl-popup-title-row">
                                        <h3 className="kmrl-popup-title">{station.name}</h3>
                                        <span className="kmrl-popup-code">{station.code}</span>
                                    </div>

                                    <div className="kmrl-popup-badges">
                                        {stationLines.map(l => (
                                            <span key={l.id} className="kmrl-line-chip">
                                                <span className="kmrl-line-dot" style={{ backgroundColor: l.color }} />
                                                {l.name}
                                            </span>
                                        ))}

                                        {station.isInterchange && (
                                            <span className="kmrl-interchange-chip">
                                                ⇄ Interchange
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="kmrl-popup-body">
                                    <div className="kmrl-popup-info-row">
                                        <span className="kmrl-popup-info-label">Station Type</span>
                                        <span className="kmrl-popup-info-value">{station.info?.type || 'Elevated'}</span>
                                    </div>

                                    <div className="kmrl-popup-info-row">
                                        <span className="kmrl-popup-info-label">Operating Hours</span>
                                        <span className="kmrl-popup-info-value">
                                            {station.info?.openingTime || '06:00 AM'} – {station.info?.closingTime || '10:30 PM'}
                                        </span>
                                    </div>

                                    <div className="kmrl-popup-info-row">
                                        <span className="kmrl-popup-info-label">Status</span>
                                        <span className="kmrl-popup-info-value" style={{ textTransform: 'capitalize' }}>
                                            {STATUS_META[station.status]?.label || 'Active'}
                                        </span>
                                    </div>

                                    {station.info?.description && (
                                        <p style={{ margin: '8px 0 6px', fontSize: '0.78rem', color: '#475569', lineHeight: '1.4' }}>
                                            {station.info.description}
                                        </p>
                                    )}

                                    {station.info?.facilities && station.info.facilities.length > 0 && (
                                        <div className="kmrl-popup-facilities">
                                            <div className="kmrl-facilities-title">Key Facilities</div>
                                            <div className="kmrl-facilities-tags">
                                                {station.info.facilities.slice(0, 4).map((f, i) => (
                                                    <span key={i} className="kmrl-facility-tag">
                                                        ✓ {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {typeof onStationClick === 'function' && (
                                        <div className="kmrl-popup-action">
                                            <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '4px' }}>
                                                <button
                                                    type="button"
                                                    className="kmrl-popup-btn"
                                                    style={{ flex: 1, padding: '7px 4px', fontSize: '0.76rem' }}
                                                    onClick={() => handleStationSelect(station, primaryLine, 'from')}
                                                    title={`Set ${station.name} as Origin`}
                                                >
                                                    Set Origin (From)
                                                </button>
                                                <button
                                                    type="button"
                                                    className="kmrl-popup-btn"
                                                    style={{ flex: 1, padding: '7px 4px', fontSize: '0.76rem', background: '#059db2' }}
                                                    onClick={() => handleStationSelect(station, primaryLine, 'to')}
                                                    title={`Set ${station.name} as Destination`}
                                                >
                                                    Set Dest (To)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapMetro;
