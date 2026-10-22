import React, { useState, useRef } from 'react';
import '../../styles/SchematicMetroMap.css';

// Station layout coordinates for clean DMRC-style schematic representation
const SCHEMATIC_STATIONS = {
    // ── BLUE LINE (LINE 1: Aluva ↔ Tripunithura) ──
    'Aluva': { x: 260, y: 55, line: 'line-1', align: 'right' },
    'Pulinchodu': { x: 260, y: 88, line: 'line-1', align: 'right' },
    'Companypady': { x: 260, y: 120, line: 'line-1', align: 'right' },
    'Ambattukavu': { x: 260, y: 152, line: 'line-1', align: 'right' },
    'Muttom': { x: 260, y: 184, line: 'line-1', align: 'right' },
    'Kalamassery': { x: 260, y: 216, line: 'line-1', align: 'right' },
    'Cochin University': { x: 260, y: 248, line: 'line-1', align: 'right' },
    'Pathadipalam': { x: 260, y: 280, line: 'line-1', align: 'right' },
    'Edappally': { x: 260, y: 312, line: 'line-1', align: 'right', isJunction: true },
    'Changampuzha Park': { x: 260, y: 344, line: 'line-1', align: 'right' },
    'Palarivattom': { x: 260, y: 376, line: 'line-1', align: 'right' },
    'JLN Stadium': { x: 260, y: 415, line: 'line-1', align: 'left', isInterchange: true },
    'Kaloor': { x: 260, y: 454, line: 'line-1', align: 'left' },
    'Lissie': { x: 260, y: 486, line: 'line-1', align: 'left' },
    'M.G. Road': { x: 260, y: 518, line: 'line-1', align: 'left' },
    'Maharaja’s College': { x: 260, y: 550, line: 'line-1', align: 'left' },
    'Ernakulam South': { x: 260, y: 582, line: 'line-1', align: 'left' },
    'Kadavanthra': { x: 275, y: 616, line: 'line-1', align: 'left' },
    'Elamkulam': { x: 305, y: 646, line: 'line-1', align: 'left' },
    'Vyttila': { x: 350, y: 670, line: 'line-1', align: 'bottom', isInterchange: true },
    'Thykoodam': { x: 405, y: 670, line: 'line-1', align: 'bottom' },
    'Petta': { x: 460, y: 670, line: 'line-1', align: 'bottom' },
    'Vadakkekotta': { x: 515, y: 670, line: 'line-1', align: 'bottom' },
    'SN Junction': { x: 570, y: 670, line: 'line-1', align: 'bottom' },
    'Tripunithura': { x: 625, y: 670, line: 'line-1', align: 'bottom' },

    // ── PINK LINE (LINE 2: JLN Stadium ↔ Infopark) ──
    'Palarivattom Junction': { x: 325, y: 405, line: 'line-2', align: 'top' },
    'Palarivattom Bypass': { x: 390, y: 395, line: 'line-2', align: 'top' },
    'Chembumukku': { x: 455, y: 385, line: 'line-2', align: 'top' },
    'Vazhakkala': { x: 520, y: 375, line: 'line-2', align: 'top' },
    'Padamughal': { x: 585, y: 365, line: 'line-2', align: 'top' },
    'Kakkanad Junction': { x: 650, y: 355, line: 'line-2', align: 'top' },
    'Cochin SEZ': { x: 715, y: 345, line: 'line-2', align: 'top' },
    'Chittethukara': { x: 780, y: 335, line: 'line-2', align: 'top' },
    'KINFRA Park': { x: 845, y: 325, line: 'line-2', align: 'top' },
    'Infopark': { x: 910, y: 315, line: 'line-2', align: 'right' },

    // ── GREEN LINE (LINE 3: Vyttila Hub ↔ Marine Drive / Coast) ──
    'Panampilly Nagar': { x: 280, y: 700, line: 'line-3', align: 'bottom' },
    'South Railway Station': { x: 210, y: 700, line: 'line-3', align: 'bottom' },
    'High Court': { x: 150, y: 670, line: 'line-3', align: 'left' },
    'Bolgatty': { x: 105, y: 625, line: 'line-3', align: 'left' },
    'Fort Kochi Gate': { x: 70, y: 575, line: 'line-3', align: 'left' }
};

// Polyline paths for SVG
const LINE_PATHS = {
    'line-1': 'M 260 55 L 260 582 Q 260 616 275 616 Q 305 646 350 670 L 625 670',
    'line-2': 'M 260 415 L 910 315',
    'line-3': 'M 350 670 Q 280 700 210 700 Q 150 700 150 670 L 105 625 L 70 575'
};

const LINE_COLORS = {
    'line-1': '#0284c7', // Sky Blue
    'line-2': '#ec4899', // Pink
    'line-3': '#10b981'  // Emerald Green
};

const SchematicMetroMap = ({
    highlightedRoute = null,
    onStationClick = null,
    selectedStation = null
}) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredStation, setHoveredStation] = useState(null);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.6));
    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (e.target.tagName !== 'circle' && e.target.tagName !== 'text') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Normalize highlighted route stations if provided
    const routeStationSet = new Set(
        (highlightedRoute || []).map(s => typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase())
    );
    const isRouteActive = routeStationSet.size > 0;

    return (
        <div
            className="schematic-map-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* DMRC Style Legend Header */}
            <div className="map-dmrc-legend">
                <div className="legend-title">
                    <span>Key to lines & symbols</span>
                    <span className="legend-sub">Kochi Metro</span>
                </div>
                <div className="legend-items">
                    <div className="legend-row">
                        <div className="legend-line-swatch" style={{ background: '#0284c7' }}></div>
                        <span>Blue Line (Aluva ↔ Tripunithura)</span>
                    </div>
                    <div className="legend-row">
                        <div className="legend-line-swatch" style={{ background: '#ec4899' }}></div>
                        <span>Pink Line (JLN Stadium ↔ Infopark)</span>
                    </div>
                    <div className="legend-row">
                        <div className="legend-line-swatch" style={{ background: '#10b981' }}></div>
                        <span>Green Line (Vyttila ↔ Marine Drive)</span>
                    </div>
                    <div className="legend-row" style={{ marginTop: '0.2rem' }}>
                        <div className="legend-sym-icon">
                            <div className="legend-sym-inner"></div>
                        </div>
                        <span>Interchange Station (Transfer point)</span>
                    </div>
                </div>
            </div>

            {/* Map Controls */}
            <div className="map-control-panel">
                <button type="button" className="map-ctrl-btn" onClick={handleZoomIn} title="Zoom In">+</button>
                <button type="button" className="map-ctrl-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
                <button type="button" className="map-ctrl-btn" onClick={handleReset} title="Reset View">⤾</button>
            </div>

            {/* Active Route Toast */}
            {isRouteActive && (
                <div className="map-route-indicator">
                    <div className="route-indicator-text">
                        <span>🗺️ Route Highlighted:</span>
                        <span>{highlightedRoute[0]} → {highlightedRoute[highlightedRoute.length - 1]}</span>
                    </div>
                    <div className="route-indicator-meta">
                        {highlightedRoute.length} Stations Selected
                    </div>
                </div>
            )}

            {/* Main Interactive SVG */}
            <svg
                viewBox="0 0 980 770"
                className="svg-viewport"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                }}
            >
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                </defs>

                {/* Background Water Body (Periyar River & Vembanad Estuary) */}
                <path
                    d="M 120 0 Q 180 200 130 450 Q 80 600 0 770 L 0 0 Z"
                    className="water-body-svg"
                />
                <text x="50" y="320" className="water-label" transform="rotate(-65, 50, 320)">
                    VEMBANAD BACKWATERS
                </text>

                {/* Metro Line Tracks */}
                {Object.entries(LINE_PATHS).map(([lineId, pathD]) => {
                    return (
                        <path
                            key={lineId}
                            d={pathD}
                            stroke={LINE_COLORS[lineId]}
                            strokeWidth="6.5"
                            className={`line-path-svg ${isRouteActive ? 'dimmed' : ''}`}
                        />
                    );
                })}

                {/* Station Nodes */}
                {Object.entries(SCHEMATIC_STATIONS).map(([stName, stData]) => {
                    const isInterchange = !!stData.isInterchange;
                    const isSelected = selectedStation && selectedStation.toLowerCase() === stName.toLowerCase();
                    const isHighlighted = isRouteActive && routeStationSet.has(stName.toLowerCase());
                    const isDimmed = isRouteActive && !isHighlighted;
                    const lineColor = LINE_COLORS[stData.line] || '#0284c7';

                    let labelX = stData.x;
                    let labelY = stData.y;
                    let textAnchor = 'start';

                    if (stData.align === 'right') {
                        labelX += isInterchange ? 14 : 10;
                        labelY += 4;
                        textAnchor = 'start';
                    } else if (stData.align === 'left') {
                        labelX -= isInterchange ? 14 : 10;
                        labelY += 4;
                        textAnchor = 'end';
                    } else if (stData.align === 'top') {
                        labelX += 0;
                        labelY -= isInterchange ? 14 : 10;
                        textAnchor = 'middle';
                    } else if (stData.align === 'bottom') {
                        labelX += 0;
                        labelY += isInterchange ? 20 : 16;
                        textAnchor = 'middle';
                    }

                    return (
                        <g
                            key={stName}
                            className={`station-node ${isDimmed ? 'dimmed' : ''} ${isHighlighted || isSelected ? 'highlighted' : ''}`}
                            onClick={() => {
                                if (typeof onStationClick === 'function') {
                                    onStationClick({ name: stName, line: stData.line });
                                }
                            }}
                            onMouseEnter={() => setHoveredStation(stName)}
                            onMouseLeave={() => setHoveredStation(null)}
                        >
                            {/* Interchange Dual-Ring Icon (DMRC Schematic Style) */}
                            {isInterchange ? (
                                <g>
                                    <circle
                                        cx={stData.x}
                                        cy={stData.y}
                                        r="9"
                                        fill="#ffffff"
                                        stroke="#0f172a"
                                        strokeWidth="2.5"
                                    />
                                    <circle
                                        cx={stData.x}
                                        cy={stData.y}
                                        r="4"
                                        fill={lineColor}
                                    />
                                </g>
                            ) : (
                                <circle
                                    cx={stData.x}
                                    cy={stData.y}
                                    r="5.5"
                                    fill="#ffffff"
                                    stroke={lineColor}
                                    strokeWidth="2.5"
                                />
                            )}

                            {/* Station Name Label */}
                            <text
                                x={labelX}
                                y={labelY}
                                textAnchor={textAnchor}
                                className={`station-label ${isInterchange ? 'interchange-label' : ''}`}
                            >
                                {stName}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default SchematicMetroMap;
