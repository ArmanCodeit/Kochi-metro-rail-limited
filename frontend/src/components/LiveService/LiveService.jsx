import React, { useState, useEffect } from 'react';
import '../../styles/LiveService.css';
import metroLinesData from '../../data/metroLines';

function LiveService() {
    const [selectedLine, setSelectedLine] = useState('line-1');
    const [metroTrains, setMetroTrains] = useState([]);
    const [serviceStatus, setServiceStatus] = useState({
        line1: { status: 'Running', crowdLevel: 'Moderate', delay: 0 },
        line2: { status: 'Running', crowdLevel: 'Light', delay: 0 }
    });
    const [selectedStation, setSelectedStation] = useState(null);
    const [stationDetails, setStationDetails] = useState(null);
    const [nextTrains, setNextTrains] = useState([]);

    useEffect(() => {
        initializeMetroTrains();
    }, []);

    const initializeMetroTrains = () => {
        // Simulate metro trains on each line
        const trains = [];
        metroLinesData.forEach((line) => {
            const stations = line.stations || [];
            for (let i = 0; i < 3; i++) {
                const position = Math.floor((stations.length / 3) * (i + 1));
                trains.push({
                    id: `${line.id}-train-${i}`,
                    lineId: line.id,
                    lineName: line.name,
                    lineColor: line.color,
                    currentStation: stations[position]?.name || stations[0].name,
                    currentIndex: position,
                    direction: i % 2 === 0 ? 'forward' : 'backward',
                    passengers: Math.floor(Math.random() * 300) + 100,
                    capacity: 400,
                    nextStation: stations[position + 1]?.name || stations[0].name,
                    arrivalTime: Math.floor(Math.random() * 5) + 2, // 2-7 minutes
                    status: 'In Transit'
                });
            }
        });
        setMetroTrains(trains);
    };

    const getLineStations = () => {
        const line = metroLinesData.find(l => l.id === selectedLine);
        return line?.stations || [];
    };

    const handleStationClick = (station, index) => {
        const line = metroLinesData.find(l => l.id === selectedLine);
        const trainsAtLine = metroTrains.filter(t => t.lineId === selectedLine);
        
        // Get trains that are coming to this station
        const upcoming = trainsAtLine
            .filter(t => t.currentIndex <= index)
            .map(t => ({
                train: t,
                minutesAway: (index - t.currentIndex) * 3
            }))
            .sort((a, b) => a.minutesAway - b.minutesAway)
            .slice(0, 3);

        setSelectedStation(station);
        setStationDetails({
            name: station.name,
            code: station.code || station.name.slice(0, 3).toUpperCase(),
            line: line.name,
            lineColor: line.color,
            index: index,
            services: [
                { icon: '🏧', name: 'ATM/Payment', available: true },
                { icon: '🍔', name: 'Food Court', available: true },
                { icon: '📶', name: 'WiFi', available: true },
                { icon: '🆘', name: 'Help Desk', available: true },
                { icon: '🅿️', name: 'Parking', available: true },
                { icon: '🚻', name: 'Restroom', available: true }
            ]
        });
        setNextTrains(upcoming);
    };

    const getStationPosition = (index) => {
        const stations = getLineStations();
        return (index / (stations.length - 1)) * 100;
    };

    const getCrowdColor = (passengers, capacity) => {
        const percentage = (passengers / capacity) * 100;
        if (percentage < 40) return '#27ae60'; // Green - Light
        if (percentage < 70) return '#f39c12'; // Orange - Moderate
        return '#e74c3c'; // Red - Crowded
    };

    return (
        <div className="live-service-container">
            <div className="live-service-header">
                <h2>🚇 Live Metro Service & Location Tracking</h2>
                <p>Track trains in real-time and check station information</p>
            </div>

            <div className="live-service-content">
                {/* Left Panel: Line Selection & Train Tracking */}
                <div className="left-panel">
                    <div className="line-selector">
                        <h3>Select Metro Line</h3>
                        <div className="line-buttons">
                            {metroLinesData.map(line => (
                                <button
                                    key={line.id}
                                    className={`line-btn ${selectedLine === line.id ? 'active' : ''}`}
                                    style={{
                                        borderLeftColor: line.color,
                                        backgroundColor: selectedLine === line.id ? `${line.color}20` : 'transparent'
                                    }}
                                    onClick={() => setSelectedLine(line.id)}
                                >
                                    <div className="line-dot" style={{ backgroundColor: line.color }}></div>
                                    <div className="line-name">{line.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Service Status */}
                    <div className="service-status">
                        <h3>Service Status</h3>
                        <div className="status-card">
                            <div className="status-item">
                                <span className="status-label">Line Status:</span>
                                <span className="status-value running">
                                    🟢 Running Normally
                                </span>
                            </div>
                            <div className="status-item">
                                <span className="status-label">Crowd Level:</span>
                                <span className="status-value">📊 Moderate</span>
                            </div>
                            <div className="status-item">
                                <span className="status-label">Avg Delay:</span>
                                <span className="status-value">⏱️ 0 min</span>
                            </div>
                            <div className="status-item">
                                <span className="status-label">Operating Hours:</span>
                                <span className="status-value">6:00 AM - 10:00 PM</span>
                            </div>
                        </div>
                    </div>

                    {/* Active Trains */}
                    <div className="active-trains">
                        <h3>Trains on This Line</h3>
                        <div className="trains-list">
                            {metroTrains
                                .filter(t => t.lineId === selectedLine)
                                .map(train => (
                                    <div key={train.id} className="train-info-card">
                                        <div className="train-header">
                                            <span className="train-id">Train {train.id.split('-')[2]}</span>
                                            <span className="train-status">🟢 {train.status}</span>
                                        </div>
                                        <div className="train-details">
                                            <p>📍 <strong>{train.currentStation}</strong></p>
                                            <p>➜ Next: {train.nextStation} ({train.arrivalTime} min)</p>
                                            <div className="crowd-indicator">
                                                <span className="crowd-label">Passengers:</span>
                                                <div className="crowd-bar">
                                                    <div 
                                                        className="crowd-fill"
                                                        style={{
                                                            width: `${(train.passengers / train.capacity) * 100}%`,
                                                            backgroundColor: getCrowdColor(train.passengers, train.capacity)
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="crowd-text">
                                                    {train.passengers}/{train.capacity}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* Center Panel: Station Map */}
                <div className="center-panel">
                    <div className="station-map">
                        <h3>Station Map & Tracking</h3>
                        <div className="metro-line-track">
                            {getLineStations().map((station, index) => {
                                const trainAtStation = metroTrains.find(
                                    t => t.lineId === selectedLine && t.currentIndex === index
                                );

                                return (
                                    <div key={index} className="station-point-wrapper">
                                        <button
                                            className={`station-point ${
                                                selectedStation?.name === station.name ? 'selected' : ''
                                            }`}
                                            style={{
                                                left: `${getStationPosition(index)}%`
                                            }}
                                            onClick={() => handleStationClick(station, index)}
                                            title={station.name}
                                        >
                                            {trainAtStation && <span className="train-indicator">🚆</span>}
                                            <span className="station-tooltip">{station.name}</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="track-line"></div>
                    </div>

                    {/* Selected Station Details */}
                    {stationDetails && (
                        <div className="station-info-panel">
                            <div className="station-header">
                                <h3>{stationDetails.name}</h3>
                                <span className="station-code">{stationDetails.code}</span>
                            </div>

                            {/* Next Trains */}
                            <div className="next-trains-section">
                                <h4>📋 Next Trains</h4>
                                {nextTrains.length > 0 ? (
                                    <div className="trains-table">
                                        {nextTrains.map((item, idx) => (
                                            <div key={idx} className="train-row">
                                                <div className="train-number">
                                                    <strong>Train {item.train.id.split('-')[2]}</strong>
                                                </div>
                                                <div className="train-time">
                                                    <span className="arrival-time">
                                                        {item.minutesAway} min
                                                    </span>
                                                </div>
                                                <div className="train-crowd">
                                                    <div 
                                                        className="crowd-dot"
                                                        style={{
                                                            backgroundColor: getCrowdColor(
                                                                item.train.passengers,
                                                                item.train.capacity
                                                            )
                                                        }}
                                                        title={`${item.train.passengers}/${item.train.capacity} passengers`}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-trains">No trains coming soon</p>
                                )}
                            </div>

                            {/* Station Services */}
                            <div className="station-services">
                                <h4>🛎️ Station Services</h4>
                                <div className="services-grid">
                                    {stationDetails.services.map((service, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`service-item ${service.available ? 'available' : 'unavailable'}`}
                                            title={service.name}
                                        >
                                            <span className="service-icon">{service.icon}</span>
                                            <span className="service-name">{service.name}</span>
                                            {service.available && <span className="available-badge">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Info & Tips */}
                <div className="right-panel">
                    <div className="info-card crowding-info">
                        <h3>🗺️ Crowding Guide</h3>
                        <div className="crowd-guide-item">
                            <div className="crowd-box" style={{ backgroundColor: '#27ae60' }}></div>
                            <div>
                                <strong>Light</strong>
                                <p>Less than 40% capacity</p>
                            </div>
                        </div>
                        <div className="crowd-guide-item">
                            <div className="crowd-box" style={{ backgroundColor: '#f39c12' }}></div>
                            <div>
                                <strong>Moderate</strong>
                                <p>40-70% capacity</p>
                            </div>
                        </div>
                        <div className="crowd-guide-item">
                            <div className="crowd-box" style={{ backgroundColor: '#e74c3c' }}></div>
                            <div>
                                <strong>Crowded</strong>
                                <p>Above 70% capacity</p>
                            </div>
                        </div>
                    </div>

                    <div className="info-card travel-tips">
                        <h3>💡 Travel Tips</h3>
                        <ul>
                            <li>🌅 Off-peak hours: 10 AM - 5 PM</li>
                            <li>🚫 Avoid: 7-9 AM, 5-7 PM</li>
                            <li>📱 Use mobile tickets for quick entry</li>
                            <li>🎫 Buy passes to save money</li>
                            <li>⏰ Check real-time updates</li>
                            <li>📍 Plan your route in advance</li>
                        </ul>
                    </div>

                    <div className="info-card emergency-info">
                        <h3>🆘 Emergency Contact</h3>
                        <div className="contact-info">
                            <p><strong>Metro Control:</strong></p>
                            <p className="phone">+91-98765-43210</p>
                            <p><strong>Customer Care:</strong></p>
                            <p className="phone">1800-METRO-911</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LiveService;
