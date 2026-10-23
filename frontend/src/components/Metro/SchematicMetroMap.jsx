import React, { useState } from 'react';
import '../../styles/SchematicMetroMap.css';

// Station layout coordinates for clean DMRC-style schematic representation
// Authoritative dataset synchronized across Geographic GIS and Schematic Network
const SCHEMATIC_STATIONS = {
    // ── VIOLET LINE (LINE 4: Aluva ↔ Cochin Airport CIAL - Airport Express Link) ──
    'Cochin Airport (CIAL)': { x: 380, y: 35, line: 'line-4', align: 'right', aliases: ['Cochin Airport', 'CIAL'] },
    'Nedumbassery': { x: 320, y: 65, line: 'line-4', align: 'top' },
    'Chengamanad': { x: 275, y: 105, line: 'line-4', align: 'right' },
    'Desom': { x: 260, y: 140, line: 'line-4', align: 'right' },

    // ── BLUE LINE (LINE 1: Aluva ↔ Tripunithura) ──
    'Aluva': { x: 260, y: 175, line: 'line-1', align: 'right', isInterchange: true },
    'Pulinchodu': { x: 260, y: 205, line: 'line-1', align: 'right' },
    'Companypady': { x: 260, y: 235, line: 'line-1', align: 'right' },
    'Ambattukavu': { x: 260, y: 265, line: 'line-1', align: 'right' },
    'Muttom': { x: 260, y: 295, line: 'line-1', align: 'right' },
    'Kalamassery': { x: 260, y: 325, line: 'line-1', align: 'right', isInterchange: true },
    'Cochin University': { x: 260, y: 355, line: 'line-1', align: 'right', isInterchange: true },
    'Pathadipalam': { x: 260, y: 385, line: 'line-1', align: 'right' },
    'Edappally': { x: 260, y: 415, line: 'line-1', align: 'right', isJunction: true },
    'Changampuzha Park': { x: 260, y: 445, line: 'line-1', align: 'right' },
    'Palarivattom': { x: 260, y: 475, line: 'line-1', align: 'right' },
    'JLN Stadium': { x: 260, y: 510, line: 'line-1', align: 'left', isInterchange: true },
    'Kaloor': { x: 260, y: 545, line: 'line-1', align: 'left' },
    'Lissie': { x: 260, y: 575, line: 'line-1', align: 'left' },
    'M.G. Road': { x: 260, y: 605, line: 'line-1', align: 'left', aliases: ['MG Road'] },
    'Maharaja’s College': { x: 260, y: 635, line: 'line-1', align: 'left', aliases: ['Maharajas College', "Maharaja's College"] },
    'Ernakulam South': { x: 260, y: 665, line: 'line-1', align: 'left', isInterchange: true },
    'Kadavanthra': { x: 275, y: 695, line: 'line-1', align: 'left' },
    'Elamkulam': { x: 305, y: 720, line: 'line-1', align: 'left' },
    'Vyttila': { x: 350, y: 740, line: 'line-1', align: 'bottom', isInterchange: true },
    'Thykoodam': { x: 410, y: 740, line: 'line-1', align: 'bottom', isInterchange: true },
    'Petta': { x: 465, y: 740, line: 'line-1', align: 'bottom' },
    'Vadakkekotta': { x: 520, y: 740, line: 'line-1', align: 'bottom' },
    'SN Junction': { x: 575, y: 740, line: 'line-1', align: 'bottom' },
    'Tripunithura': { x: 630, y: 740, line: 'line-1', align: 'bottom', isInterchange: true },

    // ── PINK LINE (LINE 2: JLN Stadium ↔ Infopark) ──
    'Palarivattom Jn': { x: 325, y: 500, line: 'line-2', align: 'top', aliases: ['Palarivattom Junction'] },
    'Palarivattom Bypass': { x: 390, y: 490, line: 'line-2', align: 'top' },
    'Chembumukku': { x: 455, y: 480, line: 'line-2', align: 'top' },
    'Vazhakkala': { x: 520, y: 470, line: 'line-2', align: 'top' },
    'Padamughal': { x: 585, y: 460, line: 'line-2', align: 'top' },
    'Kakkanad Jn': { x: 650, y: 450, line: 'line-2', align: 'top', isInterchange: true, aliases: ['Kakkanad Junction'] },
    'Cochin SEZ': { x: 715, y: 440, line: 'line-2', align: 'top' },
    'Chittethukara': { x: 780, y: 430, line: 'line-2', align: 'top' },
    'KINFRA Park': { x: 845, y: 420, line: 'line-2', align: 'top' },
    'Infopark': { x: 910, y: 410, line: 'line-2', align: 'right', isInterchange: true },

    // ── YELLOW LINE (LINE 7: Cochin University ↔ Infopark - Eastern Orbital Spur) ──
    'Pukkattupady': { x: 460, y: 280, line: 'line-7', align: 'top' },
    'Kizhakkambalam': { x: 660, y: 270, line: 'line-7', align: 'top' },
    'Brahmapuram': { x: 820, y: 330, line: 'line-7', align: 'top' },

    // ── GREEN LINE (LINE 3: Vyttila Hub ↔ Marine Drive / Fort Kochi Gate) ──
    'Panampilly Nagar': { x: 280, y: 765, line: 'line-3', align: 'bottom' },
    'High Court': { x: 160, y: 730, line: 'line-3', align: 'left' },
    'Bolgatty': { x: 110, y: 680, line: 'line-3', align: 'left' },
    'Fort Kochi Gate': { x: 70, y: 630, line: 'line-3', align: 'left' },

    // ── RED LINE (LINE 5: Kalamassery ↔ Tripunithura) ──
    'HMT Junction': { x: 380, y: 355, line: 'line-5', align: 'top' },
    'Civil Station': { x: 510, y: 400, line: 'line-5', align: 'top' },
    'Irumpanam': { x: 640, y: 600, line: 'line-5', align: 'right' },

    // ── ORANGE LINE (LINE 6: Aroor Toll ↔ Vyttila Hub) ──
    'Aroor Toll': { x: 410, y: 840, line: 'line-6', align: 'bottom' },
    'Kumbalam': { x: 410, y: 810, line: 'line-6', align: 'left' },
    'Kundannoor': { x: 410, y: 775, line: 'line-6', align: 'left' }
};

// SVG Polyline paths for each metro line
const LINE_PATHS = {
    'line-4': 'M 380 35 L 320 65 Q 275 105 260 140 L 260 175',
    'line-1': 'M 260 175 L 260 665 Q 260 695 275 695 Q 305 720 350 740 L 630 740',
    'line-2': 'M 260 510 L 910 410',
    'line-7': 'M 260 355 Q 360 280 460 280 L 660 270 Q 760 290 820 330 L 910 410',
    'line-3': 'M 350 740 Q 280 765 260 665 Q 200 690 160 730 L 110 680 L 70 630',
    'line-5': 'M 260 325 Q 320 340 380 355 L 510 400 L 650 450 L 640 600 L 630 740',
    'line-6': 'M 410 840 L 410 740 L 350 740'
};

const LINE_COLORS = {
    'line-1': '#0284c7', // Sky Blue
    'line-2': '#ec4899', // Pink
    'line-3': '#10b981', // Emerald Green
    'line-4': '#7c3aed', // Royal Violet (Airport Express)
    'line-5': '#dc2626', // Red
    'line-6': '#ea580c', // Orange
    'line-7': '#d97706'  // Yellow
};

// Normalizes station name to permit seamless matching across aliases and spelling differences
const normalizeKey = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/junction/g, 'jn')
        .replace(/[’']/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

const findStationData = (name) => {
    if (!name) return null;
    const targetNorm = normalizeKey(name);
    for (const [key, data] of Object.entries(SCHEMATIC_STATIONS)) {
        if (normalizeKey(key) === targetNorm) {
            return { name: key, ...data };
        }
        if (Array.isArray(data.aliases)) {
            if (data.aliases.some(a => normalizeKey(a) === targetNorm)) {
                return { name: key, ...data };
            }
        }
    }
    return null;
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

    // Normalize input route stations
    const rawRouteList = (highlightedRoute || []).map(s => typeof s === 'string' ? s : (s.name || ''));
    const routeStationNormalizedSet = new Set(rawRouteList.map(s => normalizeKey(s)));
    const isRouteActive = routeStationNormalizedSet.size > 0;

    // Build connected SVG segment coordinates for the full highlighted route
    const highlightedSegments = [];
    if (rawRouteList.length > 1) {
        for (let i = 0; i < rawRouteList.length - 1; i++) {
            const stA = findStationData(rawRouteList[i]);
            const stB = findStationData(rawRouteList[i + 1]);
            if (stA && stB) {
                highlightedSegments.push(`M ${stA.x} ${stA.y} L ${stB.x} ${stB.y}`);
            }
        }
    }

    const originName = rawRouteList[0] || '';
    const destName = rawRouteList[rawRouteList.length - 1] || '';
    const originStation = findStationData(originName);
    const destStation = findStationData(destName);

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
                    <div className="legend-row">
                        <div className="legend-line-swatch" style={{ background: '#7c3aed' }}></div>
                        <span>Violet Line (Airport Express: Aluva ↔ CIAL)</span>
                    </div>
                    <div className="legend-row">
                        <div className="legend-line-swatch" style={{ background: '#d97706' }}></div>
                        <span>Yellow Line (Cochin Univ ↔ Infopark)</span>
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
                        <span>{originName} → {destName}</span>
                    </div>
                    <div className="route-indicator-meta">
                        {rawRouteList.length} Stations Connected
                    </div>
                </div>
            )}

            {/* Main Interactive SVG */}
            <svg
                viewBox="0 0 1020 880"
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
                    <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                </defs>

                {/* Background Water Body (Periyar River & Vembanad Estuary) */}
                <path
                    d="M 120 0 Q 180 200 130 450 Q 80 600 0 880 L 0 0 Z"
                    className="water-body-svg"
                />
                <text x="50" y="380" className="water-label" transform="rotate(-65, 50, 380)">
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

                {/* Complete Continuous Highlighted Journey Route Path */}
                {highlightedSegments.length > 0 && (
                    <path
                        d={highlightedSegments.join(' ')}
                        stroke="#f59e0b"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        style={{
                            filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.9))',
                            transition: 'all 0.3s ease'
                        }}
                    />
                )}

                {/* Origin / Departure Station Halo Ring */}
                {originStation && (
                    <circle
                        cx={originStation.x}
                        cy={originStation.y}
                        r="14"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        strokeDasharray="4, 3"
                        style={{ filter: 'drop-shadow(0 0 5px #10b981)' }}
                    />
                )}

                {/* Destination Station Halo Ring */}
                {destStation && (
                    <circle
                        cx={destStation.x}
                        cy={destStation.y}
                        r="14"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                        style={{ filter: 'drop-shadow(0 0 6px #f59e0b)' }}
                    />
                )}

                {/* Station Nodes */}
                {Object.entries(SCHEMATIC_STATIONS).map(([stName, stData]) => {
                    const isInterchange = !!stData.isInterchange;
                    const isSelected = selectedStation && normalizeKey(selectedStation) === normalizeKey(stName);
                    const isStationInRoute = routeStationNormalizedSet.has(normalizeKey(stName)) ||
                        (stData.aliases && stData.aliases.some(a => routeStationNormalizedSet.has(normalizeKey(a))));
                    const isHighlighted = isRouteActive && isStationInRoute;
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
                                        stroke={isHighlighted ? '#f59e0b' : '#0f172a'}
                                        strokeWidth="2.5"
                                    />
                                    <circle
                                        cx={stData.x}
                                        cy={stData.y}
                                        r="4"
                                        fill={isHighlighted ? '#f59e0b' : lineColor}
                                    />
                                </g>
                            ) : (
                                <circle
                                    cx={stData.x}
                                    cy={stData.y}
                                    r="5.5"
                                    fill="#ffffff"
                                    stroke={isHighlighted ? '#f59e0b' : lineColor}
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
