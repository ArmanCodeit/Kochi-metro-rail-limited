import React, { useState, useEffect, useRef } from 'react';
import '../styles/HomePage.css';
import VideoBackground from '../components/VideoBackground';
import fareStationsData from '../data/fareStations.json';
import liveTrainsData from '../data/liveTrains.json';
import MapMetro from '../components/Metro/MapMetro';
import { getAllStations, METRO_LINES } from '../data/metroNetworkData';

function HomePage({ onNavigate }) {
    const [metroLines, setMetroLines] = useState([]);
    const [fromStation, setFromStation] = useState('');
    const [toStation, setToStation] = useState('');
    const [allStations, setAllStations] = useState([]);
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [fareDistance, setFareDistance] = useState('');
    const [calculatedFare, setCalculatedFare] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ticketType, setTicketType] = useState('single');
    const [selectedService, setSelectedService] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [liveTrains, setLiveTrains] = useState([]);
    const fromDropdownRef = useRef(null);
    const toDropdownRef = useRef(null);
    const [imageAvailable, setImageAvailable] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showFareModal, setShowFareModal] = useState(false);
    const [fareModalFrom, setFareModalFrom] = useState('');
    const [fareModalTo, setFareModalTo] = useState('');
    const [selectedFromStation, setSelectedFromStation] = useState(null);
    const [selectedToStation, setSelectedToStation] = useState(null);
    const [fareModalFromSuggestions, setFareModalFromSuggestions] = useState([]);
    const [fareModalToSuggestions, setFareModalToSuggestions] = useState([]);
    const [showFareFromDropdown, setShowFareFromDropdown] = useState(false);
    const [showFareToDropdown, setShowFareToDropdown] = useState(false);
    const [fareLoading, setFareLoading] = useState(false);
    const [fareError, setFareError] = useState(null);
    const [fareResult, setFareResult] = useState({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
    const fareFromRef = useRef(null);
    const fareToRef = useRef(null);

    const sliderImages = [
        '/images/homepagesliderimages/image1.png',
        '/images/homepagesliderimages/image2.png',
        '/images/homepagesliderimages/image3.png',
        '/images/homepagesliderimages/image4.png',
        '/images/homepagesliderimages/image5.png',
        '/images/homepagesliderimages/image6.png'
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % sliderImages.length);
        }, 3500);
        return () => clearInterval(timer);
    }, []);

    const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0);
    const notices = [
        "Attention Kochi commuters: Due to a high-profile visit, traffic restrictions will be in place across parts of the city. Use the Metro to avoid delays. Parents and Ward SSC students - please take the metro to reach exam centers on time.",
        "New feeder bus service launched from Aluva Station! Connect seamlessly to Kochi Airport. Service starts 6:00 AM daily. Check the 'Feeder' section for routes.",
        "Maintenance Alert: Elevator access at Edappally Station will be restricted for scheduled maintenance this Sunday, 10 AM to 2 PM. Please use alternate exits.",
        "Go Green with Kochi Metro! Save over 50% on monthly passes. Visit your nearest ticket counter or recharge online today for exclusive discounts."
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentNoticeIndex(prev => (prev + 1) % notices.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchStations();
        fetchLiveTrains();
        const iv = setInterval(() => fetchLiveTrains(), 15000);
        return () => clearInterval(iv);
    }, []);

    const fetchLiveTrains = async () => {
        try {
            const resp = await fetch('/api/metro/trains/live');
            if (!resp.ok) return;
            const data = await resp.json();
            setLiveTrains(data);
        } catch (err) {
            console.error('Error fetching live trains', err);
            // fallback to local static data
            setLiveTrains(liveTrainsData || []);
        }
    }

    const calculateFare = () => {
        const dist = parseFloat(fareDistance);
        if (isNaN(dist) || dist <= 0) return;
        let fare;
        if (dist <= 2) fare = 10;
        else if (dist <= 5) fare = 15;
        else if (dist <= 8) fare = 20;
        else if (dist <= 12) fare = 25;
        else if (dist <= 15) fare = 30;
        else if (dist <= 20) fare = 40;
        else if (dist <= 25) fare = 50;
        else fare = 60;
        setCalculatedFare(fare);
    };

    const calculateFareByStations = async () => {
        setFareError(null);

        // Resolve departure and destination station names
        const fromName = selectedFromStation?.name || (fareModalFrom.includes(' — ') ? fareModalFrom.split(' — ')[0].trim() : fareModalFrom.trim());
        const toName = selectedToStation?.name || (fareModalTo.includes(' — ') ? fareModalTo.split(' — ')[0].trim() : fareModalTo.trim());

        // 1. Validation: both stations must be selected
        if (!fromName || !toName) {
            setFareError('Please select both departure and arrival stations.');
            return;
        }

        // 2. Validation: prevent departure and arrival being the same
        if (fromName.toLowerCase() === toName.toLowerCase()) {
            setFareError('Departure and arrival stations cannot be the same.');
            return;
        }

        setFareLoading(true);

        try {
            const resp = await fetch('/api/metro/plan-routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromStation: fromName, toStation: toName })
            });

            const data = await resp.json();

            if (resp.ok && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setFareResult({
                    fare: route.fare,
                    distance: route.distance,
                    estimatedMinutes: route.estimatedMinutes,
                    totalStops: route.totalStops,
                    interchanges: route.interchanges || [],
                    lines: route.lines || [],
                    routeName: route.name,
                    calculated: true
                });
            } else {
                setFareError(data.message || 'No connected metro routes found between these stations.');
                setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
            }
        } catch (err) {
            console.error('Error calculating fare:', err);
            setFareError('Unable to connect to fare calculation engine. Please try again.');
            setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
        } finally {
            setFareLoading(false);
        }
    };

    const resetFareModal = () => {
        setFareModalFrom('');
        setFareModalTo('');
        setSelectedFromStation(null);
        setSelectedToStation(null);
        setFareError(null);
        setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
        setShowFareFromDropdown(false);
        setShowFareToDropdown(false);
    };

    const swapFareStations = () => {
        const tmpText = fareModalFrom;
        const tmpObj = selectedFromStation;
        setFareModalFrom(fareModalTo);
        setSelectedFromStation(selectedToStation);
        setFareModalTo(tmpText);
        setSelectedToStation(tmpObj);
        setFareError(null);
        setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
                setShowFromDropdown(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
                setShowToDropdown(false);
            }
            if (fareFromRef.current && !fareFromRef.current.contains(event.target)) {
                setShowFareFromDropdown(false);
            }
            if (fareToRef.current && !fareToRef.current.contains(event.target)) {
                setShowFareToDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStations = async () => {
        try {
            const response = await fetch('/api/metro/network');
            if (response.ok) {
                const data = await response.json();
                if (data.stations && data.stations.length > 0) {
                    const formatted = data.stations.map(st => {
                        const lineLabel = (st.lines && st.lines.length > 0) ? st.lines.join(' / ') : 'Blue Line';
                        return {
                            ...st,
                            lineLabel,
                            fullLabel: `${st.name} — ${lineLabel}`
                        };
                    });
                    setAllStations(formatted);
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching network stations:', error);
        }

        // Resilient fallback using verified metroNetworkData
        try {
            const fallbackStations = getAllStations().map(st => {
                const lineNames = (st.lineIds || []).map(lid => {
                    const l = METRO_LINES.find(line => line.id === lid);
                    return l ? l.name : lid;
                });
                const lineLabel = lineNames.length > 0 ? lineNames.join(' / ') : 'Blue Line';
                return {
                    id: st.id,
                    name: st.name,
                    code: st.code,
                    lines: lineNames,
                    lineColors: (st.lineIds || []).map(lid => {
                        const l = METRO_LINES.find(line => line.id === lid);
                        return l ? l.color : '#0284c7';
                    }),
                    isInterchange: st.isInterchange || false,
                    lineLabel,
                    fullLabel: `${st.name} — ${lineLabel}`
                };
            });
            setAllStations(fallbackStations);
        } catch {
            setAllStations(fareStationsData || []);
        }
    };

    const handleFromStationChange = (e) => {
        const value = e.target.value;
        setFromStation(value);
        if (value.trim() === '') {
            setFromSuggestions(allStations); // show all stations when empty for easier pick
        } else {
            const filtered = allStations.filter(station =>
                station.name.toLowerCase().includes(value.toLowerCase()) ||
                (station.code || '').toLowerCase().includes(value.toLowerCase())
            );
            setFromSuggestions(filtered);
        }
        setShowFromDropdown(true);
    };

    const handleToStationChange = (e) => {
        const value = e.target.value;
        setToStation(value);
        if (value.trim() === '') {
            setToSuggestions(allStations); // show all stations when empty
        } else {
            const filtered = allStations.filter(station =>
                station.name.toLowerCase().includes(value.toLowerCase()) ||
                (station.code || '').toLowerCase().includes(value.toLowerCase())
            );
            setToSuggestions(filtered);
        }
        setShowToDropdown(true);
    };

    const selectFromStation = (station) => {
        setFromStation(station.name);
        setFromSuggestions([]);
        setShowFromDropdown(false);
    };

    const selectToStation = (station) => {
        setToStation(station.name);
        setToSuggestions([]);
        setShowToDropdown(false);
    };

    const handleSearchRoute = async (e) => {
        e.preventDefault();
        if (!fromStation || !toStation) return;

        setLoading(true);
        try {
            // Local route search using mock lines.json
            try {
                const linesResp = await fetch('/api/lines/lines');
                if (linesResp.ok) {
                    const lines = await linesResp.json();
                    const results = [];
                    (lines || []).forEach(line => {
                        const stations = (line.stations || []).map(s => s.name);
                        const fromIdx = stations.indexOf(fromStation);
                        const toIdx = stations.indexOf(toStation);
                        if (fromIdx >= 0 && toIdx >= 0 && fromIdx < toIdx) {
                            // create two mock train options for this route
                            const base = Math.abs(toIdx - fromIdx);
                            const routeObj = {
                                lineName: line.name,
                                lineColor: line.color,
                                fromStation,
                                toStation,
                                estimatedTime: base * 3,
                                numberOfStops: base,
                                fare: Math.max(20, base * 5),
                                intermediateStations: stations.slice(fromIdx + 1, toIdx)
                            };
                            // two mock trains
                            const now = Date.now();
                            routeObj.trains = [
                                {
                                    trainId: `MOCK-${now}-A`,
                                    name: `${line.name} Local A`,
                                    departureTime: new Date(now + 5 * 60 * 1000).toISOString(),
                                    currentStation: fromStation,
                                    nextStop: stations[fromIdx + 1] || toStation,
                                    delayedByMinutes: 0,
                                    status: 'Running'
                                },
                                {
                                    trainId: `MOCK-${now}-B`,
                                    name: `${line.name} Local B`,
                                    departureTime: new Date(now + 12 * 60 * 1000).toISOString(),
                                    currentStation: fromStation,
                                    nextStop: stations[fromIdx + 1] || toStation,
                                    delayedByMinutes: Math.random() < 0.3 ? 2 : 0,
                                    status: 'Running'
                                }
                            ];
                            results.push(routeObj);
                        }
                    });
                    setSearchResults(results);
                }
            } catch (err) {
                console.error('Local route search failed', err);
            }
        } catch (error) {
            console.error('Error searching route:', error);
        }
        setLoading(false);
    };


    const handleBookTicket = (train) => {
        setSelectedTrain(train);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setSelectedTrain(null);
    };

    const submitBooking = () => {
        alert(`Ticket booked successfully! Type: ${ticketType}, Service: ${selectedService}`);
        closeBookingModal();
    };

    return (
        <div className="home-page page-content-above-video">
            {/* Main Welcome Section with Image */}
            <div className="welcome-section">
                <div className="parent">
                    <div className="div1">
                        <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '12px', position: 'relative' }}>
                            <img
                                src="https://media1.tenor.com/m/rASIofnw47IAAAAd/mumbai-metro-mumbai.gif?w=1080&h=1920"
                                alt="Metro Animation"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right', display: 'block' }}
                                onError={(e) => { e.currentTarget.src = '/vite.svg'; }}
                            />
                        </div>
                    </div>
                    <div className="div2">
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            {sliderImages.map((src, index) => (
                                <img
                                    key={index}
                                    src={src}
                                    alt={`Metro Slide ${index + 1}`}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        opacity: index === currentSlide ? 1 : 0,
                                        transition: 'opacity 0.8s ease-in-out'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="div3">
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#0066b3' }}>Live Trains</h4>
                                <LocalClock />
                            </div>
                            {liveTrains && liveTrains.length > 0 ? (
                                <LiveTicker trains={liveTrains} />
                            ) : (
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>No active trains</div>
                            )}
                        </div>
                    </div>
                    <div className="div4" style={{ position: 'relative' }}>
                        {/* Top center label */}
                        <div style={{
                            position: 'absolute',
                            top: '1rem',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 2,
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                        }}>
                            <span style={{
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                color: '#0f172a',
                                fontFamily: 'Urbanist, sans-serif',
                                letterSpacing: '0.01em'
                            }}>
                                Tickets &amp; Recharge
                            </span>
                        </div>
                        <img
                            src="/images/div4.png"
                            alt="Metro Feature"
                            style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                    <div className="div5">
                        <div className="notices-card">
                            <div className="notices-header">
                                <span className="notices-title">NOTICES & ALERTS</span>
                                <svg className="external-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="7" y1="17" x2="17" y2="7" />
                                    <polyline points="7 7 17 7 17 17" />
                                </svg>
                            </div>
                            <div className="notices-content-area">
                                <p className="notices-text" key={currentNoticeIndex} style={{ animation: 'fadeIn 0.5s ease' }}>
                                    {notices[currentNoticeIndex]}
                                </p>
                            </div>
                            <div className="notices-controls">
                                <div className="pagination-dots">
                                    {notices.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`dot ${idx === currentNoticeIndex ? 'active' : ''}`}
                                            onClick={() => setCurrentNoticeIndex(idx)}
                                            style={{ cursor: 'pointer' }}
                                        ></div>
                                    ))}
                                </div>
                                <div className="nav-arrows">
                                    <button
                                        className="nav-btn"
                                        onClick={() => setCurrentNoticeIndex(prev => (prev - 1 + notices.length) % notices.length)}
                                        aria-label="Previous Notice"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 12H5M12 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        className="nav-btn"
                                        onClick={() => setCurrentNoticeIndex(prev => (prev + 1) % notices.length)}
                                        aria-label="Next Notice"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Find Metro Section */}
            {/* Find Metro Section (Hidden) */}
            {false && (
                <section className="find-metro-section">
                    <div className="section-container">
                        <h2>🚇 Find Your Metro Route</h2>
                        <p className="section-subtitle">Search and explore metro routes in Kochi</p>

                        {/* Scrollable Station List */}
                        {allStations.length > 0 && (
                            <div className="stations-list-section">
                                <h3>Available Stations</h3>
                                <div className="scrollable-stations">
                                    {allStations.map((station, idx) => (
                                        <div key={idx} className="station-card" onClick={() => setFromStation(station.name)}>
                                            <div className="station-card-header">
                                                <strong>{station.name}</strong>
                                                <span className="station-code">{station.code}</span>
                                            </div>
                                            <small className="station-location">{station.location || 'Kochi'}</small>
                                            <small className="station-area">{station.area || 'Kerala'}</small>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSearchRoute} className="home-search-form">
                            <div className="search-inputs">
                                <div className="input-group" ref={fromDropdownRef}>
                                    <label>From Station</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={fromStation}
                                            onChange={handleFromStationChange}
                                            onFocus={() => {
                                                setShowFromDropdown(true);
                                                if (!fromStation.trim()) setFromSuggestions(allStations);
                                            }}
                                            placeholder="Search or select station..."
                                            autoComplete="off"
                                        />
                                        {showFromDropdown && fromSuggestions.length > 0 && (
                                            <div className="dropdown-list">
                                                {fromSuggestions.map((station, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="dropdown-item"
                                                        onClick={(e) => { e.stopPropagation(); selectFromStation(station); }}
                                                    >
                                                        <div className="station-info">
                                                            <strong>{station.name}</strong>
                                                            <span className="station-code">{station.code}</span>
                                                        </div>
                                                        <small>{station.location || 'Kochi'} - {station.area || 'Kerala'}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="input-group" ref={toDropdownRef}>
                                    <label>To Station</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={toStation}
                                            onChange={handleToStationChange}
                                            onFocus={() => {
                                                setShowToDropdown(true);
                                                if (!toStation.trim()) setToSuggestions(allStations);
                                            }}
                                            placeholder="Search or select station..."
                                            autoComplete="off"
                                        />
                                        {showToDropdown && toSuggestions.length > 0 && (
                                            <div className="dropdown-list">
                                                {toSuggestions.map((station, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="dropdown-item"
                                                        onClick={(e) => { e.stopPropagation(); selectToStation(station); }}
                                                    >
                                                        <div className="station-info">
                                                            <strong>{station.name}</strong>
                                                            <span className="station-code">{station.code}</span>
                                                        </div>
                                                        <small>{station.location || 'Kochi'} - {station.area || 'Kerala'}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn-search-home" disabled={loading}>
                                {loading ? 'Searching...' : '🔍 Search Routes'}
                            </button>
                        </form>

                        {searchResults.length > 0 && (
                            <div className="search-results-home">
                                <h3 style={{ gridColumn: '1 / -1' }}>Available Routes</h3>
                                {searchResults.map((route, idx) => (
                                    <div key={idx} className="route-card-home">
                                        <div className="route-header-home">
                                            <h4>{route.lineName}</h4>
                                            <span className="stops-badge">{route.numberOfStops || 5} stops</span>
                                        </div>
                                        <p><strong>⏱️ Duration:</strong> {route.estimatedTime || 30} min</p>
                                        <p><strong>💰 Fare:</strong> ₹{route.fare || 20}</p>
                                        <button
                                            type="button"
                                            className="btn-book-route"
                                            onClick={() => handleBookTicket(route)}
                                        >
                                            📱 Book Ticket
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Kochi Metro's Line Comprehensive Services */}
            <section className="comprehensive-services-section">
                <div className="section-container">
                    <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', fontFamily: 'Urbanist, sans-serif' }}>Kochi Metro Rail</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#39ae62', lineHeight: '1.2', marginTop: '0.5rem', fontFamily: 'Urbanist, sans-serif' }}>Comprehensive Services</div>
                    </h2>
                    <div className="services-grid-parent">
                        <div
                            className="services-div1"
                            style={{ position: 'relative', background: '#f6f7fa', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                            onClick={() => { setShowFareModal(true); setCalculatedFare(null); setFareDistance(''); }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,102,179,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                        >
                            {/* Radial Gradient Background */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '20px',
                                    opacity: 0.8,
                                    background: 'radial-gradient(200px at 86.2px 3.9375px, rgba(23, 99, 212, 0.15), transparent 100%)',
                                    pointerEvents: 'none'
                                }}
                            ></div>

                            {/* Card Content */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                zIndex: 1,
                                width: '100%',
                                padding: '0 24px'
                            }}>
                                {/* Calculator Icon Circle with Image */}
                                <div className="service-icon-container" style={{
                                    width: '48px',
                                    height: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img
                                        src="/images/farecal.svg"
                                        alt="Fare Calculator"
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentNode.innerHTML = '🧮'; }}
                                    />
                                </div>

                                {/* Text */}
                                <span style={{
                                    fontSize: '1.375rem',
                                    fontWeight: '600',
                                    color: '#0f172a', /* primaryText */
                                    lineHeight: '1.375', /* leading-snug */
                                    textAlign: 'left'
                                }}>
                                    Fare Calculator
                                </span>
                            </div>
                        </div>
                        <div
                            className="services-div2"
                            style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f6f7fa', padding: '1.5rem', color: '#166534', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                            onClick={() => {
                                const el = document.getElementById('facilities-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(22,101,52,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                            title="View all passenger facilities at Kochi Metro stations"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                <div className="service-icon-container" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img
                                        src="/images/accessible-facility-svgrepo-com.svg"
                                        alt="Facilities"
                                        style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                    />
                                </div>
                                <span style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', textAlign: 'left' }}>Facilities</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '1.5rem', marginBottom: '0.5rem', color: '#15803d' }}>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/1/1848.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/18561/18561555.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/3522/3522581.png" alt="Wheelchair" style={{ width: '22px', height: '22px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/13707/13707123.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/562/562678.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/9001/9001771.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                            </div>
                            <h3 style={{
                                color: 'black',
                                fontWeight: '500',
                                marginTop: '8px',
                                textAlign: 'left',
                                fontSize: '0.875rem',
                                lineHeight: '1.375'
                            }}>
                                Facility for Women, Differently Abled & Parking
                            </h3>
                        </div>
                        <div className="services-div5" style={{ padding: 0, overflow: 'hidden', display: 'block', position: 'relative' }}>
                            <div style={{ width: '100%', height: '100%' }}>
                                <MapMetro height="100%" />
                            </div>
                            <button
                                onClick={() => onNavigate('findmetro')}
                                style={{
                                    position: 'absolute',
                                    bottom: '15px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 20px',
                                    color: 'black',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    zIndex: 1000,
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                                    fontSize: '0.9rem',
                                    transition: 'transform 0.2s ease'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)'; }}
                            >
                                Interact with Map
                            </button>
                        </div>
                        <div
                            className="services-div6"
                            style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f6f7fa', padding: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
                            onClick={() => onNavigate('findmetro')}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,102,179,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                            title="Plan your journey across Kochi Metro stations"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <div className="service-icon-container" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/images/train-station-svgrepo-com.svg" alt="Station" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', textAlign: 'left' }}>Know Your Station</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '1.2rem', marginBottom: '0.5rem', color: '#64748b' }}>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/28/28591.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/9001/9001771.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/2838/2838912.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/13707/13707123.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/1034/1034897.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/562/562678.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                            </div>
                            <h3 style={{
                                color: 'black',
                                fontWeight: '500',
                                marginTop: '5px',
                                textAlign: 'left',
                                fontSize: '0.875rem',
                                lineHeight: '1.375'
                            }}>
                                everything you want to know about any station
                            </h3>
                        </div>
                        <div className="services-div7" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', background: '#f6f7fa', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="service-icon-container" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/images/location-pin-svgrepo-com.svg" alt="Location" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', textAlign: 'left' }}>Nearby Places</span>
                                    <span style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', textAlign: 'left' }}>Across Stations</span>
                                </div>
                            </div>
                        </div>
                        <div className="services-div8" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f6f7fa', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                                <div className="service-icon-container" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/images/time-svgrepo-com.svg" alt="Time" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', textAlign: 'left' }}>First & Last<br />Metro Time</span>
                            </div>
                            <div style={{
                                width: '100%',
                                color: 'black',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                lineHeight: '1.375',
                                marginTop: '8px'
                            }}>
                                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>First metro runs from Aluva at 06:00 AM</span>
                                    <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/2584/2584049.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Last metro runs from SN Junction <br></br>at 10:30 PM</span>
                                    <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/3982/3982182.png" alt="Wheelchair" style={{ width: '21px', height: '21px', objectFit: 'contain' }} /></a></span>
                                </div>
                            </div>
                        </div>
                        <div className="services-div9" style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', background: '#f6f7fa', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <div className="service-icon-container" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/images/trip-svgrepo-com.svg" alt="Connectivity" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontSize: '1.375rem', fontWeight: '600', color: '#0f172a', lineHeight: '1.375', textAlign: 'left' }}>First & Last mile<br />connectivity</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '1.2rem', marginBottom: '0.5rem', color: '#64748b' }}>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/3124/3124381.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/1023/1023401.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/1034/1034897.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                                <span><a href='URL'><img src="https://cdn-icons-png.flaticon.com/128/565/565350.png" alt="Wheelchair" style={{ width: '28px', height: '28px', objectFit: 'contain' }} /></a></span>
                            </div>
                            <h3 style={{
                                color: 'black',
                                fontWeight: '500',
                                marginTop: '8px',
                                textAlign: 'left',
                                fontSize: '0.875rem',
                                lineHeight: '1.375'
                            }}>
                                Taxi, Bus & other public transport services.
                            </h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* Fare Calculator Section (Commented Out) */}
            {/* 
            <section className="fare-calculator-section">
                <div className="section-container">
                    <h2>💰 Fare Calculator</h2>
                    <p className="section-subtitle">Calculate metro fares instantly</p>

                    <div className="fare-card">
                        <div className="fare-input-group">
                            <label>Distance (km)</label>
                            <input
                                type="number"
                                value={fareDistance}
                                onChange={(e) => setFareDistance(e.target.value)}
                                placeholder="Enter distance in kilometers"
                                step="0.1"
                                min="0"
                            />
                            <button type="button" onClick={calculateFare} className="btn-calculate">
                                Calculate Fare
                            </button>
                        </div>

                        {calculatedFare && (
                            <div className="fare-result">
                                <div className="fare-display">
                                    <span className="fare-label">Estimated Fare</span>
                                    <span className="fare-amount">₹{calculatedFare}</span>
                                </div>
                                <p className="fare-note">* Base fare: ₹10 + ₹2 per km</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
            */}

            {/* Experience Section */}
            <section className="experience-section" style={{ padding: '3rem 1rem', background: '#fff' }}>
                <div className="section-container">
                    <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#0f172a', fontSize: '1.2rem', fontWeight: '500' }}>
                        Experience the perfect blend of
                    </h2>
                    <h3 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2.8rem', fontWeight: '800', fontFamily: 'Urbanist, sans-serif' }}>
                        <span style={{ color: '#ae8639' }}>Speed</span><span style={{ color: '#a5ae39' }}>{', '}</span>
                        <span style={{ color: '#a5ae39' }}>Convenience</span><span style={{ color: '#a5ae39' }}>{', & '}</span>
                        <span style={{ color: '#39ae62' }}>Sustainability.</span>
                    </h3>

                    <div className="experience-parent">
                        <div className="experience-div1">
                            {/* Text overlay - top left */}
                            <div style={{
                                position: 'absolute',
                                top: '1.5rem',
                                left: '1.5rem',
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <h1 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    fontSize: '32px',
                                    lineHeight: '1.25',
                                    fontStyle: 'bold',
                                    textAlign: 'left',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    Smooth Rides, Stress-Free Commutes
                                </h1>
                                <h2 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                    lineHeight: '1.25',
                                    textAlign: 'left',
                                    maxWidth: '294px',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    Experience Seamless Journeys, Every Day.
                                </h2>
                            </div>
                            {/* Background image */}
                            <img
                                src="/images/pic1.png"
                                alt="Speed"
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    objectPosition: 'bottom right',
                                    display: 'block'
                                }}
                            />
                        </div>
                        <div className="experience-div2">
                            {/* Text overlay - top left */}
                            <div style={{
                                position: 'absolute',
                                top: '1.5rem',
                                left: '1.5rem',
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <h3 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    fontSize: '22px',
                                    lineHeight: '1.25',
                                    textAlign: 'left',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    Seamless ticket
                                </h3>
                                <h1 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    fontSize: '32px',
                                    lineHeight: '1.25',
                                    textAlign: 'left',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    booking experience
                                </h1>
                                <h2 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                    lineHeight: '1.25',
                                    textAlign: 'left',
                                    maxWidth: '325px',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    Utilize our interactive maps to effortlessly plan your route
                                </h2>
                            </div>
                            {/* Background image */}
                            <img
                                src="/images/pic2.png"
                                alt="Convenience"
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    objectPosition: 'bottom right',
                                    display: 'block'
                                }}
                            />
                        </div>
                        <div className="experience-div3">
                            {/* Text overlay - top left */}
                            <div style={{
                                position: 'absolute',
                                top: '1.5rem',
                                left: '1.5rem',
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <h1 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    fontSize: '32px',
                                    lineHeight: '1.25',
                                    textAlign: 'left',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    Accessibility for all
                                </h1>
                                <h2 style={{
                                    margin: 0,
                                    color: '#ffffff',
                                    fontWeight: '500',
                                    fontSize: '14px',
                                    lineHeight: '1.25',
                                    textAlign: 'left',
                                    maxWidth: '360px',
                                    fontFamily: 'Urbanist, sans-serif'
                                }}>
                                    Our stations and trains are designed to be accessible for everyone, including passengers with disabilities.
                                </h2>
                            </div>
                            {/* Background image */}
                            <img
                                src="/images/pic3.png"
                                alt="Sustainability"
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    objectPosition: 'bottom right',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Real-time Info Section - commented out for now */}
            {/* <section className="realtime-info-section">
                <div className="section-container">
                    <h2>⏱️ Real-time Metro Information</h2>
                    <p className="section-subtitle">Stay updated with metro operations</p>

                    <div className="info-grid">
                        <div className="info-card">
                            <div className="info-icon">🚇</div>
                            <h3>Operating Hours</h3>
                            <p><strong>Monday to Sunday:</strong></p>
                            <p>6:00 AM - 10:00 PM</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">🎫</div>
                            <h3>Ticket Types</h3>
                            <p><strong>Available:</strong></p>
                            <p>Single Journey, Pass Cards, Smart Cards</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">🛂</div>
                            <h3>Station Services</h3>
                            <p><strong>Available:</strong></p>
                            <p>ATM, Food Stalls, Lost & Found, WiFi</p>
                        </div>

                        <div className="info-card">
                            <div className="info-icon">📱</div>
                            <h3>Live Updates</h3>
                            <p><strong>Stay Connected:</strong></p>
                            <p>Sign in for real-time alerts</p>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* Fare Calculator Modal */}
            {showFareModal && (
                <div
                    className="fare-modal-overlay"
                    onClick={() => { setShowFareModal(false); resetFareModal(); }}
                >
                    <div
                        className="fare-modal-wrapper"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Tab Header ── */}
                        <div className="fare-tab-header">
                            <div className="fare-tab-active">
                                Fare Calculator
                            </div>
                            <div className="fare-tab-inactive">
                                <span className="fare-tab-desc">Select departing and arriving stations to calculate verified metro fare and route details.</span>
                                <button className="fare-close-icon" onClick={() => { setShowFareModal(false); resetFareModal(); }} aria-label="Close Fare Calculator">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="15" y1="9" x2="9" y2="15"></line>
                                        <line x1="9" y1="9" x2="15" y2="15"></line>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* ── Main Body ── */}
                        <div className="fare-main-body">
                            {/* Inputs Group */}
                            <div className="fare-inputs-group">
                                {/* From Input */}
                                <div className="fare-input-row" ref={fareFromRef}>
                                    <label>Departure Station</label>
                                    <input
                                        type="text"
                                        placeholder="Search Departure Station (e.g. Aluva — Blue Line)"
                                        value={fareModalFrom}
                                        autoComplete="off"
                                        onChange={e => {
                                            const v = e.target.value;
                                            setFareModalFrom(v);
                                            setSelectedFromStation(null);
                                            setFareError(null);
                                            setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
                                            const filtered = v.trim() === '' ? allStations : allStations.filter(s =>
                                                s.name.toLowerCase().includes(v.toLowerCase()) ||
                                                (s.code || '').toLowerCase().includes(v.toLowerCase()) ||
                                                (s.lineLabel || '').toLowerCase().includes(v.toLowerCase())
                                            );
                                            setFareModalFromSuggestions(filtered);
                                            setShowFareFromDropdown(true);
                                        }}
                                        onFocus={() => {
                                            setFareModalFromSuggestions(allStations);
                                            setShowFareFromDropdown(true);
                                        }}
                                    />
                                    {showFareFromDropdown && fareModalFromSuggestions.length > 0 && (
                                        <div className="fare-dropdown">
                                            {fareModalFromSuggestions.map((s, i) => (
                                                <div
                                                    key={s.id || i}
                                                    className="fare-dropdown-item"
                                                    onMouseDown={e => {
                                                        e.preventDefault();
                                                        setFareModalFrom(s.fullLabel || `${s.name} — ${s.lineLabel || 'Blue Line'}`);
                                                        setSelectedFromStation(s);
                                                        setShowFareFromDropdown(false);
                                                        setFareError(null);
                                                        setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                                        <span className="fare-dropdown-name">
                                                            {s.name} <span style={{ color: s.lineColors?.[0] || '#0284c7', fontSize: '0.82rem', fontWeight: '600' }}>— {s.lineLabel || 'Blue Line'}</span>
                                                        </span>
                                                        {s.isInterchange && (
                                                            <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: '700' }}>
                                                                ⚡ Interchange Station
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="fare-dropdown-code">{s.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="fare-input-divider"></div>

                                {/* Swap Circle */}
                                <button className="fare-swap-circle" onClick={swapFareStations} title="Swap stations" type="button" aria-label="Swap departure and arrival stations">
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1a3a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>⇅</span>
                                </button>

                                {/* To Input */}
                                <div className="fare-input-row" ref={fareToRef}>
                                    <label>Arrival Station</label>
                                    <input
                                        type="text"
                                        placeholder="Search Arrival Station (e.g. Edappally — Blue Line)"
                                        value={fareModalTo}
                                        autoComplete="off"
                                        onChange={e => {
                                            const v = e.target.value;
                                            setFareModalTo(v);
                                            setSelectedToStation(null);
                                            setFareError(null);
                                            setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
                                            const filtered = v.trim() === '' ? allStations : allStations.filter(s =>
                                                s.name.toLowerCase().includes(v.toLowerCase()) ||
                                                (s.code || '').toLowerCase().includes(v.toLowerCase()) ||
                                                (s.lineLabel || '').toLowerCase().includes(v.toLowerCase())
                                            );
                                            setFareModalToSuggestions(filtered);
                                            setShowFareToDropdown(true);
                                        }}
                                        onFocus={() => {
                                            setFareModalToSuggestions(allStations);
                                            setShowFareToDropdown(true);
                                        }}
                                    />
                                    {showFareToDropdown && fareModalToSuggestions.length > 0 && (
                                        <div className="fare-dropdown">
                                            {fareModalToSuggestions.map((s, i) => (
                                                <div
                                                    key={s.id || i}
                                                    className="fare-dropdown-item"
                                                    onMouseDown={e => {
                                                        e.preventDefault();
                                                        setFareModalTo(s.fullLabel || `${s.name} — ${s.lineLabel || 'Blue Line'}`);
                                                        setSelectedToStation(s);
                                                        setShowFareToDropdown(false);
                                                        setFareError(null);
                                                        setFareResult({ fare: 0, distance: 0, estimatedMinutes: 0, totalStops: 0, interchanges: [], lines: [], calculated: false });
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                                                        <span className="fare-dropdown-name">
                                                            {s.name} <span style={{ color: s.lineColors?.[0] || '#0284c7', fontSize: '0.82rem', fontWeight: '600' }}>— {s.lineLabel || 'Blue Line'}</span>
                                                        </span>
                                                        {s.isInterchange && (
                                                            <span style={{ fontSize: '0.72rem', color: '#8b5cf6', fontWeight: '700' }}>
                                                                ⚡ Interchange Station
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="fare-dropdown-code">{s.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="fare-actions-container">
                                <button className="fare-reset-text-btn" onClick={resetFareModal} type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                    </svg>
                                    RESET
                                </button>
                                <button
                                    className="fare-getfare-solid-btn"
                                    onClick={calculateFareByStations}
                                    disabled={!fareModalFrom || !fareModalTo || fareLoading}
                                    type="button"
                                    style={{
                                        background: (!fareModalFrom || !fareModalTo) ? '#94a3b8' : '#00aeb5',
                                        transition: 'background 0.2s, transform 0.1s'
                                    }}
                                >
                                    {fareLoading ? 'CALCULATING...' : 'CALCULATE FARE'}
                                </button>
                            </div>

                            {/* Details Container */}
                            <div className="fare-details-wrapper">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>FARE &amp; JOURNEY DETAILS</h4>
                                    {fareResult.calculated && (
                                        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                                            ✓ KMRL Official Tariff
                                        </span>
                                    )}
                                </div>

                                {fareError && (
                                    <div style={{
                                        background: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        color: '#b91c1c',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span>⚠️</span>
                                        <span>{fareError}</span>
                                    </div>
                                )}

                                {fareLoading && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '20px 0',
                                        color: '#0284c7',
                                        fontWeight: '600',
                                        fontSize: '0.92rem'
                                    }}>
                                        <div style={{
                                            width: '26px',
                                            height: '26px',
                                            border: '3px solid #e0f2fe',
                                            borderTop: '3px solid #00aeb5',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                            margin: '0 auto 8px'
                                        }} />
                                        Computing route &amp; applicable fare...
                                    </div>
                                )}

                                {!fareLoading && (
                                    <div className="fare-cards-flex" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                        <div className="fare-card-item">
                                            <div className="fc-icon fc-purple">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="8" width="20" height="8" rx="2" ry="2" />
                                                    <line x1="6" y1="8" x2="6" y2="16" />
                                                    <line x1="18" y1="8" x2="18" y2="16" />
                                                    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2 2" />
                                                </svg>
                                            </div>
                                            <div className="fc-text">
                                                <span className="fc-lbl">Journey Fare</span>
                                                <span className="fc-val">₹ {fareResult.calculated ? fareResult.fare : 0}</span>
                                            </div>
                                        </div>
                                        <div className="fare-card-item">
                                            <div className="fc-icon fc-green">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                                                    <circle cx="12" cy="9" r="2.5" />
                                                </svg>
                                            </div>
                                            <div className="fc-text">
                                                <span className="fc-lbl">Distance</span>
                                                <span className="fc-val">{fareResult.calculated ? fareResult.distance : 0} km</span>
                                            </div>
                                        </div>
                                        <div className="fare-card-item">
                                            <div className="fc-icon" style={{ background: '#0284c7' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div className="fc-text">
                                                <span className="fc-lbl">Est. Time &amp; Stops</span>
                                                <span className="fc-val">{fareResult.calculated ? `~${fareResult.estimatedMinutes}m (${fareResult.totalStops} stops)` : '0 min'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Interchange Information when route includes line change */}
                                {fareResult.calculated && fareResult.interchanges && fareResult.interchanges.length > 0 && (
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '12px 14px',
                                        marginTop: '4px',
                                        textAlign: 'left'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '1.1rem' }}>🔄</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                                                Transfer Required at: <span style={{ color: '#00aeb5' }}>{fareResult.interchanges.join(', ')}</span>
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {fareResult.lines?.map((line, idx) => (
                                                <React.Fragment key={idx}>
                                                    <span style={{
                                                        background: line.color || '#0284c7',
                                                        color: '#ffffff',
                                                        fontSize: '0.74rem',
                                                        fontWeight: '800',
                                                        padding: '3px 10px',
                                                        borderRadius: '6px'
                                                    }}>
                                                        {line.name}
                                                    </span>
                                                    {idx < (fareResult.lines.length - 1) && (
                                                        <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '800' }}>
                                                            ➔ Transfer at {fareResult.interchanges[idx] || fareResult.interchanges[0]} ➔
                                                        </span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Skyline */}
                            <div className="fare-skyline-bottom">
                                <img src="/images/footer1.png" alt="City Skyline" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedTrain && (
                <div className="modal-overlay" onClick={closeBookingModal}>
                    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Book Your Ticket</h2>
                            <button className="btn-close" onClick={closeBookingModal}>✕</button>
                        </div>

                        <div className="modal-content">
                            <div className="booking-summary">
                                <h3>Journey Details</h3>
                                <p><strong>Route:</strong> {selectedTrain.lineName}</p>
                                <p><strong>Estimated Duration:</strong> {selectedTrain.estimatedTime || 30} minutes</p>
                                <p><strong>Fare:</strong> ₹{selectedTrain.fare || 20}</p>
                            </div>

                            <div className="booking-form">
                                <div className="form-group">
                                    <label>Ticket Type *</label>
                                    <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                                        <option value="single">🎫 Single Journey Ticket</option>
                                        <option value="day-pass">📅 Day Pass (Unlimited Journeys)</option>
                                        <option value="weekly-pass">📆 Weekly Pass</option>
                                        <option value="monthly-pass">📊 Monthly Pass</option>
                                        <option value="smart-card">💳 Smart Card (Rechargeable)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Station Services *</label>
                                    <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                                        <option value="all">✓ All Services Available</option>
                                        <option value="atm">🏧 ATM Available</option>
                                        <option value="food">🍔 Food Stalls Available</option>
                                        <option value="wifi">📶 WiFi Available</option>
                                        <option value="lostandfound">📦 Lost & Found</option>
                                        <option value="helpdesk">🆘 Help Desk</option>
                                    </select>
                                </div>

                                <div className="price-breakdown">
                                    <h4>Price Breakdown</h4>
                                    <div className="price-row">
                                        <span>Base Fare:</span>
                                        <span>₹{selectedTrain.fare || 20}</span>
                                    </div>
                                    {ticketType === 'day-pass' && (
                                        <div className="price-row">
                                            <span>Day Pass Surcharge:</span>
                                            <span>₹50</span>
                                        </div>
                                    )}
                                    {ticketType === 'smart-card' && (
                                        <div className="price-row">
                                            <span>Smart Card (Initial):</span>
                                            <span>₹100</span>
                                        </div>
                                    )}
                                    <div className="price-row total">
                                        <span>Total Amount:</span>
                                        <span className="total-price">
                                            ₹{ticketType === 'day-pass' ? (selectedTrain.fare || 20) + 50 : ticketType === 'smart-card' ? 100 : selectedTrain.fare || 20}
                                        </span>
                                    </div>
                                </div>

                                <div className="terms-checkbox">
                                    <input type="checkbox" id="terms" defaultChecked />
                                    <label htmlFor="terms">I agree to the terms and conditions</label>
                                </div>

                                <div className="modal-buttons">
                                    <button className="btn-cancel" onClick={closeBookingModal}>Cancel</button>
                                    <button className="btn-submit" onClick={submitBooking}>✓ Confirm Booking</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// Small local time component used in the header. Added to avoid runtime ReferenceError
function LocalClock() {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        // Align first tick to the next full second to keep displayed seconds in sync with system clock
        const tick = () => setNow(new Date());
        const msToNextSecond = 1000 - (Date.now() % 1000);
        const to = setTimeout(() => {
            tick();
            const iv = setInterval(tick, 1000);
            // store on window so cleanup can clear if needed (keeps code simple)
            (window.__localClockInterval = iv);
        }, msToNextSecond);

        return () => {
            clearTimeout(to);
            if (window.__localClockInterval) {
                clearInterval(window.__localClockInterval);
                delete window.__localClockInterval;
            }
        };
    }, []);

    // Use Intl for consistent locale + timezone short name
    const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
    const fmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short' });
    return <span style={{ fontSize: 12 }}>{fmt.format(now)}</span>;
}

function LiveTicker({ trains }) {
    const [index, setIndex] = useState(0);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const iv = setInterval(() => {
            setIndex(i => (i + 1) % (trains.length || 1));
        }, 8000);
        return () => clearInterval(iv);
    }, [trains.length]);

    useEffect(() => {
        const iv2 = setInterval(() => setNow(Date.now()), 1000); // refresh every 1s for accurate local time
        return () => clearInterval(iv2);
    }, []);

    if (!trains || trains.length === 0) return null;

    const t = trains[index];
    const ts = t && t.timestamp ? new Date(t.timestamp) : null;
    let updatedText = 'Updated: N/A';
    const locale = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-US';
    const fmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short' });
    if (ts) {
        const diff = Math.floor((now - ts.getTime()) / 1000);
        if (diff < 60) updatedText = 'Updated: just now';
        else if (diff < 3600) updatedText = `Updated: ${Math.floor(diff / 60)}m ago`;
        else updatedText = `Updated: ${fmt.format(ts)}`;
    } else {
        updatedText = `Updated: ${fmt.format(new Date(now))}`;
    }

    return (
        <div style={{ padding: '0.6rem 0.2rem' }}>
            <div style={{ fontWeight: 700 }}>{t.name || t.trainId}</div>
            <div style={{ color: '#444' }}>{t.currentStation || 'N/A'} {t.delayedByMinutes ? `(Delay ${t.delayedByMinutes}m)` : ''}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>{updatedText}</div>
        </div>
    );
}

export default HomePage;
