import React, { useState, useEffect, useRef } from 'react';
import '../styles/SearchMetro.css';
import kochiTimetable from '../data/kochiTimetable.json';
import fareStationsData from '../data/fareStations.json';
import liveTrainsData from '../data/liveTrains.json';

function SearchMetro({ onLogout, user, onNavigate }) {
    const [stations, setStations] = useState([
        { id: 1, name: 'Aluva', code: 'ALV', lineName: 'Aluva – M.G. Road' },
        { id: 2, name: 'Pulinchodu', code: 'PUL', lineName: 'Aluva – M.G. Road' },
        { id: 3, name: 'Companypady', code: 'COM', lineName: 'Aluva – M.G. Road' },
        { id: 4, name: 'SN Junction', code: 'SNJ', lineName: 'Aluva – M.G. Road' },
        { id: 5, name: 'Ambattukavu', code: 'AMB', lineName: 'Aluva – M.G. Road' },
        { id: 6, name: 'Kakkanad', code: 'KAK', lineName: 'Aluva – M.G. Road' },
        { id: 7, name: 'Palarivattom', code: 'PAL', lineName: 'Aluva – M.G. Road' },
        { id: 8, name: 'Edapally', code: 'EDA', lineName: 'Aluva – M.G. Road' },
        { id: 9, name: 'Muttom', code: 'MUT', lineName: 'Aluva – M.G. Road' },
        { id: 10, name: 'Kaloor', code: 'KAL', lineName: 'Aluva – M.G. Road' },
        { id: 11, name: 'Lissie', code: 'LIS', lineName: 'Aluva – M.G. Road' },
        { id: 12, name: 'M.G. Road', code: 'MGR', lineName: 'Aluva – M.G. Road' },
        { id: 13, name: 'Ernakulam South', code: 'ERS', lineName: 'Aluva – M.G. Road' },
        { id: 14, name: 'Vyttila', code: 'VYT', lineName: 'Vyttila Extension' },
        { id: 15, name: 'Thykoodam', code: 'THY', lineName: 'Vyttila Extension' },
        { id: 16, name: 'Seaport', code: 'SEA', lineName: 'Vyttila Extension' }
    ]);

    const [searchData, setSearchData] = useState({
        fromStation: '',
        toStation: '',
        date: new Date().toISOString().split('T')[0],
        passengers: '1'
    });

    const [searchResults, setSearchResults] = useState([]);
    const [liveTrains, setLiveTrains] = useState([]);
    const [externalFeed, setExternalFeed] = useState(() => localStorage.getItem('liveFeedUrl') || '');
    const [fareInfo, setFareInfo] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [errors, setErrors] = useState({});
    const [ticketType, setTicketType] = useState('single');
    const [selectedService, setSelectedService] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [passengerName, setPassengerName] = useState('John Doe');
    const [passengerPhone, setPassengerPhone] = useState('');
    const [passengerEmail, setPassengerEmail] = useState('');
    const [bookingResponse, setBookingResponse] = useState(null);
    const [ticketCount, setTicketCount] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        // Fetch stations from API
        fetchStations();
        fetchLiveTrains();

        const iv = setInterval(() => {
            fetchLiveTrains();
        }, 15000);

        return () => clearInterval(iv);
    }, []);

    const fetchStations = async () => {
        try {
            try {
                const response = await fetch('/api/metro/stations');
                if (response.ok) {
                    const data = await response.json();
                    // Normalize station objects to ensure `id`, `code`, `name` exist
                    const normalized = (data || []).map((s, idx) => ({
                        id: s.id || s.stationId || idx + 1,
                        code: (s.code || s.stationId || s.stationCode || s.id || '').toString().toUpperCase(),
                        name: s.name || s.stationName || s.label || (s.code || s.stationId || '').toString(),
                        lineName: s.line || s.lineName || ''
                    }));
                    setStations(normalized);
                }
            } catch (error) {
                console.error('Error fetching stations:', error);
                const fallback = (fareStationsData || stations).map((s, idx) => ({ id: s.id || idx + 1, code: (s.code || '').toString().toUpperCase(), name: s.name || s.stationName || '' }));
                setStations(fallback);
            }
        } catch (error) {
            console.error('Error fetching stations:', error);
            // Keep default stations if API fails; fallback to local data
            const fallback = (fareStationsData || stations).map((s, idx) => ({ id: s.id || idx + 1, code: (s.code || '').toString().toUpperCase(), name: s.name || s.stationName || '' }));
            setStations(fallback);
        }
    };

    const fetchLiveTrains = async () => {
        try {
            let url = '/api/metro/trains/live';
            if (externalFeed && externalFeed.trim()) {
                const base = externalFeed.trim().replace(/\/$/, '');
                url = base.includes('://') ? `${base}/live` : `${base}/live`;
            }
            try {
                const resp = await fetch(url);
                if (!resp.ok) return;
                const data = await resp.json();
                setLiveTrains(data);
            } catch (err) {
                console.error('Error fetching live trains', err);
                setLiveTrains(liveTrainsData || []);
            }
        } catch (err) {
            console.error('Error fetching live trains', err);
            // fallback to local data
            setLiveTrains(liveTrainsData || []);
        }
    };

    const saveExternalFeed = (val) => {
        setExternalFeed(val);
        try { localStorage.setItem('liveFeedUrl', val || ''); } catch (e) { }
    };

    const getStationName = (code) => {
        if (!code) return code || '';
        const s = stations.find(st => (st.code || st.stationId || '').toString().toUpperCase() === code.toString().toUpperCase());
        return s ? s.name || s.stationId || code : code;
    };

    const formatEta = (timestamp, addMinutes = 0) => {
        try {
            const t = new Date(timestamp);
            t.setMinutes(t.getMinutes() + addMinutes);
            return t.toLocaleTimeString();
        } catch (e) { return '' }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const calculateDistance = (fromCode, toCode) => {
        const stationIndices = {
            'ALV': 0, 'PUL': 1, 'COM': 2, 'SNJ': 3, 'AMB': 4, 'KAK': 5, 'PAL': 6,
            'EDA': 7, 'MUT': 8, 'KAL': 9, 'LIS': 10, 'MGR': 11, 'ERS': 12,
            'VYT': 13, 'THY': 14, 'SEA': 15
        };

        const fromIdx = stationIndices[fromCode];
        const toIdx = stationIndices[toCode];

        if (fromIdx === undefined || toIdx === undefined) return 0;

        return Math.abs(toIdx - fromIdx) * 2; // 2 km per station
    };

    const calculateFare = (distance, passengers) => {
        let baseFare = 20; // Base fare in rupees

        if (distance <= 2) baseFare = 20;
        else if (distance <= 6) baseFare = 25;
        else if (distance <= 10) baseFare = 30;
        else if (distance <= 14) baseFare = 35;
        else if (distance <= 18) baseFare = 40;
        else baseFare = 50;

        return baseFare * parseInt(passengers);
    };

    const validateSearch = () => {
        const newErrors = {};

        if (!searchData.fromStation) {
            newErrors.fromStation = 'Please select starting station';
        }

        if (!searchData.toStation) {
            newErrors.toStation = 'Please select destination station';
        }

        if (searchData.fromStation === searchData.toStation) {
            newErrors.toStation = 'Destination must be different from starting station';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBookTicket = (train) => {
        setTicketCount(parseInt(searchData.passengers) || 1);
        // attach journey details from current search
        const journey = {
            ...train,
            fromStation: searchData.fromStation,
            toStation: searchData.toStation,
            fromCode: searchData.fromStation,
            toCode: searchData.toStation,
            lineName: train.lineName || 'Line 1',
            estimatedTime: fareInfo ? fareInfo.distance : 0,
            numberOfStops: fareInfo ? Math.round(fareInfo.distance / 2) : 0,
            fare: train.fare || (fareInfo ? fareInfo.baseFare : 0)
        };
        setSelectedTrain(journey);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setSelectedTrain(null);
    };

    const submitBooking = async () => {
        if (!selectedTrain) return;
        setIsPaying(true);
        const payload = {
            type: ticketType,
            fromStation: selectedTrain.fromStation,
            toStation: selectedTrain.toStation,
            passengerName: passengerName || 'Guest',
            passengerPhone: passengerPhone || '',
            email: passengerEmail || undefined
        };

        try {
            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('kmrl_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const resp = await fetch('/api/metro/book', { method: 'POST', headers, body: JSON.stringify(payload) });
            if (resp.ok) {
                const data = await resp.json();
                setBookingResponse({ success: true, data });
                const bookingObj = {
                    bookingId: data.bookingId,
                    fare: data.fare,
                    ticketUrl: data.ticketUrl,
                    fromStation: payload.fromStation,
                    toStation: payload.toStation,
                    passengerName: payload.passengerName,
                    email: payload.email,
                    type: payload.type,
                    date: new Date().toLocaleString(),
                    status: 'Success',
                    method: 'Card/UPI'
                };
                localStorage.setItem('kmrl_latest_booking', JSON.stringify(bookingObj));
                const txns = JSON.parse(localStorage.getItem('kmrl_all_transactions') || '[]');
                txns.push(bookingObj);
                localStorage.setItem('kmrl_all_transactions', JSON.stringify(txns));
            } else {
                throw new Error('Booking failed on server');
            }
        } catch (err) {
            console.error('Booking error', err);
            setBookingResponse({ success: false, error: 'Network error or backend issue' });
        } finally {
            setIsPaying(false);
        }
    };

    const downloadTicket = (ticketUrl) => {
        (async () => {
            try {
                const headers = {};
                try { const token = localStorage.getItem('kmrl_token'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch (e) { }
                const resp = await fetch(ticketUrl, { headers });
                if (!resp.ok) { window.open(ticketUrl, '_blank'); return; }
                const blob = await resp.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = ticketUrl.split('/').pop() || `kmrl_ticket.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (err) {
                window.open(ticketUrl, '_blank');
            }
        })();
    }

    const emailTicket = async (bookingId, email) => {
        try {
            // Simulate email send in mock mode
            alert('Email queued (mock).');
        } catch (err) {
            console.error('Email error', err);
            alert('Failed to send email');
        }
    }

    const handleSearchMetros = async (e) => {
        e.preventDefault();

        if (!validateSearch()) {
            return;
        }

        // Calculate distance and fare
        const distance = calculateDistance(
            searchData.fromStation,
            searchData.toStation
        );

        const fare = calculateFare(distance, searchData.passengers);

        // Mock search results
        const mockResults = [
            {
                id: 1,
                departureTime: '09:00',
                arrivalTime: '09:25',
                duration: '25 mins',
                stops: Math.abs(stations.findIndex(s => s.code === searchData.toStation) - stations.findIndex(s => s.code === searchData.fromStation))
            },
            {
                id: 2,
                departureTime: '10:30',
                arrivalTime: '10:55',
                duration: '25 mins',
                stops: Math.abs(stations.findIndex(s => s.code === searchData.toStation) - stations.findIndex(s => s.code === searchData.fromStation))
            },
            {
                id: 3,
                departureTime: '12:00',
                arrivalTime: '12:25',
                duration: '25 mins',
                stops: Math.abs(stations.findIndex(s => s.code === searchData.toStation) - stations.findIndex(s => s.code === searchData.fromStation))
            }
        ];

        // find timetable matches (real trains) where route contains both stations in order
        const from = searchData.fromStation;
        const to = searchData.toStation;
        const timetableMatches = (kochiTimetable || []).map(t => {
            const route = t.route || [];
            const fromIdx = route.indexOf(getStationName(from));
            const toIdx = route.indexOf(getStationName(to));
            if (fromIdx >= 0 && toIdx >= 0 && fromIdx < toIdx) {
                const intermediate = route.slice(Math.max(0, fromIdx - 1), Math.min(route.length, toIdx + 2)).map(name => ({ code: (name || '').slice(0, 3).toUpperCase(), name }));
                return {
                    lineId: t.trainNumber,
                    lineColor: '#0d9488',
                    lineName: `${t.trainNumber} — ${t.name}`,
                    lineRoute: route.join(' → '),
                    crowdLevel: 'Moderate',
                    fromStation: getStationName(from) || from,
                    fromCode: from,
                    toStation: getStationName(to) || to,
                    toCode: to,
                    numberOfStops: toIdx - fromIdx,
                    intermediateStations: intermediate,
                    estimatedTime: Math.max(10, (toIdx - fromIdx) * 5),
                    fare: Math.max(20, (toIdx - fromIdx) * 5),
                    trainSchedules: [
                        { time: t.stopsWithTimes && t.stopsWithTimes[getStationName(from)] || '', duration: 'Varies', status: 'On time' },
                        { time: t.stopsWithTimes && t.stopsWithTimes[getStationName(to)] || '', duration: 'Varies', status: 'On time' }
                    ],
                    facilities: ['ATM', 'Parking'],
                    guide: { boardingInstructions: 'Arrive 5 minutes early', ticketInfo: 'Use kiosk or app', safetyTips: 'Stand behind the line', contactInfo: 'Helpline: 1800-000-000' },
                    type: 'timetable'
                };
            }
            return null;
        }).filter(Boolean);

        const combined = [...timetableMatches, ...mockResults];

        setSearchResults(combined);
        setFareInfo({
            distance: distance.toFixed(2),
            baseFare: calculateFare(distance, 1),
            totalFare: fare,
            passengers: searchData.passengers
        });
        setShowResults(true);
    };

    return (
        <div className="search-metro-container">
            {/* Live Trains Panel */}
            <div className="live-trains-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Live Train Status</h3>
                    <div style={{ fontSize: 12 }}>
                        <label style={{ marginRight: 8 }}>External feed:</label>
                        <input type="text" placeholder="https://api.example.com" value={externalFeed} onChange={(e) => saveExternalFeed(e.target.value)} style={{ padding: '4px 6px', width: 260 }} />
                    </div>
                </div>
                {liveTrains && liveTrains.length > 0 ? (
                    <div className="live-list">
                        {liveTrains.map((t, idx) => {
                            const nowName = getStationName(t.currentStation);
                            const nextName = getStationName(t.nextStop);
                            const delay = t.delayedByMinutes || 0;
                            const etaToNext = formatEta(t.timestamp || new Date(), 2 + delay);
                            return (
                                <div key={t.trainId || idx} className="live-item">
                                    <div className="live-left">
                                        <strong>{t.name || t.trainId}</strong>
                                        <div className="live-sub">Now: {nowName} ({t.currentStation})</div>
                                    </div>
                                    <div className="live-right">
                                        <div>Next: {nextName} ({t.nextStop})</div>
                                        <div>{delay ? `Delay: ${delay} min` : 'On time'}</div>
                                        <div className="live-time">ETA to next: {etaToNext}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="live-empty">Live data not available</div>
                )}
            </div>

            {/* Main Search Section */}
            <div className="search-section">
                <h2>Find Metro Routes</h2>

                <form onSubmit={handleSearchMetros} className="search-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="fromStation">From Station *</label>
                            <select
                                id="fromStation"
                                name="fromStation"
                                value={searchData.fromStation}
                                onChange={handleInputChange}
                                className={errors.fromStation ? 'input-error' : ''}
                            >
                                <option value="">Select starting station</option>
                                {stations.map(station => (
                                    <option key={station.id} value={station.code}>
                                        {station.name} ({station.code})
                                    </option>
                                ))}
                            </select>
                            {errors.fromStation && <span className="error-text">{errors.fromStation}</span>}
                        </div>

                        <div className="swap-button">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchData(prev => ({
                                        ...prev,
                                        fromStation: prev.toStation,
                                        toStation: prev.fromStation
                                    }));
                                }}
                                title="Swap stations"
                            >
                                ⇅
                            </button>
                        </div>

                        <div className="form-group">
                            <label htmlFor="toStation">To Station *</label>
                            <select
                                id="toStation"
                                name="toStation"
                                value={searchData.toStation}
                                onChange={handleInputChange}
                                className={errors.toStation ? 'input-error' : ''}
                            >
                                <option value="">Select destination</option>
                                {stations.map(station => (
                                    <option key={station.id} value={station.code}>
                                        {station.name} ({station.code})
                                    </option>
                                ))}
                            </select>
                            {errors.toStation && <span className="error-text">{errors.toStation}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="date">Date *</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={searchData.date}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="passengers">Number of Passengers *</label>
                            <select
                                id="passengers"
                                name="passengers"
                                value={searchData.passengers}
                                onChange={handleInputChange}
                            >
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>
                                        {num}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-search">
                        🔍 Find Metros
                    </button>
                </form>
            </div>

            {/* Results Section */}
            {showResults && (
                <div className="results-section">
                    {/* Fare Information */}
                    {fareInfo && (
                        <div className="fare-info">
                            <h3>Fare Information</h3>
                            <div className="fare-details">
                                <div className="fare-item">
                                    <span className="label">Distance</span>
                                    <span className="value">{fareInfo.distance} km</span>
                                </div>
                                <div className="fare-item">
                                    <span className="label">Per Passenger</span>
                                    <span className="value">₹{fareInfo.baseFare}</span>
                                </div>
                                <div className="fare-item">
                                    <span className="label">Passengers</span>
                                    <span className="value">{fareInfo.passengers}</span>
                                </div>
                                <div className="fare-item total">
                                    <span className="label">Total Fare</span>
                                    <span className="value">₹{fareInfo.totalFare}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Metro Services */}
                    <h3>🚆 Available Metro Trains</h3>
                    <div className="metro-services">
                        {searchResults.map(result => (
                            <div key={result.lineId} className="service-card" style={{ borderLeft: `5px solid ${result.lineColor}` }}>
                                <div className="train-header">
                                    <div className="line-info">
                                        <h4 style={{ color: result.lineColor }}>🚆 {result.lineName}</h4>
                                        <p className="line-route">{result.lineRoute}</p>
                                    </div>
                                    <div className="crowd-level">{result.crowdLevel}</div>
                                </div>

                                <div className="journey-route">
                                    <div className="station">
                                        <div className="station-name"><strong>{result.fromStation}</strong></div>
                                        <div className="station-code">{result.fromCode}</div>
                                    </div>
                                    <div className="route-line">
                                        <div className="dot"></div>
                                        <div className="line"></div>
                                        <div className="stops-badge">{result.numberOfStops} stops</div>
                                        <div className="line"></div>
                                        <div className="dot"></div>
                                    </div>
                                    <div className="station">
                                        <div className="station-name"><strong>{result.toStation}</strong></div>
                                        <div className="station-code">{result.toCode}</div>
                                    </div>
                                </div>

                                <div className="service-details">
                                    <div className="detail-item">
                                        <span>⏱️ Estimated Time:</span>
                                        <span className="value">{result.estimatedTime} mins</span>
                                    </div>
                                    <div className="detail-item">
                                        <span>💰 Fare:</span>
                                        <span className="value">₹{result.fare}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span>🎯 Stops:</span>
                                        <span className="value">{result.numberOfStops}</span>
                                    </div>
                                </div>

                                {/* Intermediate Stations */}
                                <div className="intermediate-stations">
                                    <h5>🚏 Stations on this route:</h5>
                                    <div className="stations-grid">
                                        {result.intermediateStations.map((station, idx) => (
                                            <div key={idx} className="station-tag">
                                                {station.code} - {station.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Train Timetable */}
                                <div className="timetable-section">
                                    <h5>⏰ Today's Timetable (Trains departing)</h5>
                                    <div className="timetable">
                                        {result.trainSchedules.slice(0, 10).map((schedule, idx) => (
                                            <div key={idx} className="timetable-row">
                                                <span className="departure-time">🕐 {schedule.time}</span>
                                                <span className="duration">({schedule.duration})</span>
                                                <span className="status">{schedule.status}</span>
                                            </div>
                                        ))}
                                        <div className="timetable-footer">
                                            📌 Trains run every 15 minutes (6:00 AM - 10:30 PM)
                                        </div>
                                    </div>
                                </div>

                                {/* Station Facilities */}
                                <div className="facilities-section">
                                    <h5>🏗️ Station Facilities</h5>
                                    <div className="facilities-grid">
                                        {result.facilities.map((facility, idx) => (
                                            <span key={idx} className="facility-tag">{facility}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Travel Guide */}
                                <div className="guide-section">
                                    <h5>📖 Travel Guide</h5>
                                    <div className="guide-content">
                                        <p><strong>📍 Boarding:</strong> {result.guide.boardingInstructions}</p>
                                        <p><strong>🎫 Ticket:</strong> {result.guide.ticketInfo}</p>
                                        <p><strong>⚠️ Safety:</strong> {result.guide.safetyTips}</p>
                                        <p><strong>📞 Help:</strong> {result.guide.contactInfo}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-book"
                                    onClick={() => handleBookTicket(result)}
                                >
                                    🎫 Book Ticket Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Booking Modal (Redesigned as Ticket Summary Screen) */}
            {showBookingModal && selectedTrain && (
                <div className="modal-overlay payment-modal-overlay" onClick={closeBookingModal}>
                    <div className="ts-modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="ts-header">
                            <h2 className="ts-title">Ticket Summary</h2>
                            <button className="ts-close-btn" onClick={closeBookingModal}>✕</button>
                        </div>
                        <div className="ts-content">
                            {/* Left Column - Journey Details */}
                            <div className="ts-left-col">
                                <div className="ts-journey-card">
                                    <div className="ts-trip-status">
                                        <span className="ts-active-text">ACTIVE TRIP</span>
                                        <span className="ts-dot">•</span>
                                        <span className="ts-line-name">{selectedTrain.lineName}</span>
                                    </div>
                                    <div className="ts-route-big">
                                        <span className="ts-station">{selectedTrain.fromStation}</span>
                                        <span className="ts-arrow">→</span>
                                        <span className="ts-station">{selectedTrain.toStation}</span>
                                    </div>
                                    <div className="ts-time-info">
                                        <div className="ts-time-block">
                                            <div className="ts-time-label">DEPARTURE</div>
                                            <div className="ts-time-val">{selectedTrain.trainSchedules?.[0]?.time || '10:45 AM'}, Today</div>
                                        </div>
                                        <div className="ts-time-block">
                                            <div className="ts-time-label">ESTIMATED ARRIVAL</div>
                                            <div className="ts-time-val">{selectedTrain.trainSchedules?.[1]?.time || '11:12 AM'}, Today</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ts-middle-cards">
                                    <div className="ts-traveler-card">
                                        <div className="ts-traveler-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        </div>
                                        <div className="ts-traveler-info">
                                            <label>TRAVELER NAME</label>
                                            <input type="text" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} placeholder="Enter Name" className="ts-name-input" />
                                            <div className="ts-passenger-id">Primary Passenger ID: MR-99281</div>
                                        </div>
                                    </div>

                                    <div className="ts-tickets-card">
                                        <div className="ts-tickets-label">NUMBER OF TICKETS</div>
                                        <div className="ts-counter-row">
                                            <div className="ts-counter">
                                                <button onClick={() => setTicketCount(Math.max(1, ticketCount - 1))} className="ts-counter-btn">−</button>
                                                <span className="ts-count-val">{ticketCount}</span>
                                                <button onClick={() => setTicketCount(ticketCount + 1)} className="ts-counter-btn">+</button>
                                            </div>
                                            <div className="ts-unit-price">
                                                <div className="ts-price-label">Unit Price</div>
                                                <div className="ts-price-val">₹{selectedTrain.fare.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Payment */}
                            <div className="ts-right-col">
                                <div className="ts-payment-card">
                                    <h3 className="ts-payment-title">Payment Method</h3>

                                    <div className="ts-payment-options">
                                        <div className={`ts-pm-option ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
                                            <div className="ts-radio">
                                                <div className="ts-radio-inner"></div>
                                            </div>
                                            <div className="ts-pm-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                            </div>
                                            <div className="ts-pm-name">Credit/Debit Card</div>
                                        </div>

                                        <div className={`ts-pm-option ${paymentMethod === 'wallet' ? 'active' : ''}`} onClick={() => setPaymentMethod('wallet')}>
                                            <div className="ts-radio">
                                                <div className="ts-radio-inner"></div>
                                            </div>
                                            <div className="ts-pm-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
                                            </div>
                                            <div className="ts-pm-name">Digital Wallet</div>
                                        </div>

                                        <div className={`ts-pm-option ${paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setPaymentMethod('upi')}>
                                            <div className="ts-radio">
                                                <div className="ts-radio-inner"></div>
                                            </div>
                                            <div className="ts-pm-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                            </div>
                                            <div className="ts-pm-name">UPI / QR Pay</div>
                                        </div>
                                    </div>

                                    <div className="ts-summary-totals">
                                        <div className="ts-total-row">
                                            <span>Subtotal</span>
                                            <span>₹{(selectedTrain.fare * ticketCount).toFixed(2)}</span>
                                        </div>
                                        <div className="ts-total-row">
                                            <span>Booking Fee</span>
                                            <span>₹0.00</span>
                                        </div>
                                        <div className="ts-total-row ts-grand-total">
                                            <span>Grand Total</span>
                                            <span className="ts-grand-val">₹{(selectedTrain.fare * ticketCount).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button className="ts-pay-btn" onClick={submitBooking} disabled={bookingResponse?.success || isPaying}>
                                        {isPaying ? 'Processing...' : 'Pay Now'} <span className="arrow">→</span>
                                    </button>

                                    {bookingResponse && (
                                        <div className="ts-booking-status" style={{ textAlign: 'center', marginTop: '1rem' }}>
                                            {bookingResponse.success ? (
                                                <>
                                                    <p style={{ color: '#16a34a', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Payment successful!</p>
                                                    <button onClick={() => { localStorage.setItem('kmrl_latest_booking', JSON.stringify({ ...bookingResponse.data, fromStation: selectedTrain.fromStation, toStation: selectedTrain.toStation })); onNavigate('ticket'); }} className="ts-view-ticket-btn" style={{ background: '#22c55e', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>View Ticket Details</button>
                                                </>
                                            ) : (
                                                <p style={{ color: '#dc2626', margin: 0 }}>Payment failed: {bookingResponse.error}</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="ts-secure-text">
                                        SECURE 256-BIT SSL ENCRYPTED PAYMENT
                                    </div>
                                </div>

                                <div className="ts-help-card">
                                    <div className="ts-help-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                    </div>
                                    <div className="ts-help-text">
                                        <strong>Need help?</strong>
                                        <p>Our customer support is available 24/7 for ticketing issues.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SearchMetro;