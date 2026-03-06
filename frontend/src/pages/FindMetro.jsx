import React, { useState, useEffect, useRef } from 'react';
import '../styles/FindMetro.css';
import MapMetro from '../components/Metro/MapMetro';
import metroLinesData from '../data/metroLines';

function FindMetro({ onNavigate, user, onLogout }) {
    const [metroLines, setMetroLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [fromStation, setFromStation] = useState('');
    const [toStation, setToStation] = useState('');
    const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
    const [passengers, setPassengers] = useState('1');
    const [allStations, setAllStations] = useState([]);
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availableTrains, setAvailableTrains] = useState([]);
    const [liveTrains, setLiveTrains] = useState([]);
    const [errors, setErrors] = useState({});
    const [ticketType, setTicketType] = useState('card');
    const [selectedService, setSelectedService] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [highlightedRoute, setHighlightedRoute] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const fromDropdownRef = useRef(null);
    const toDropdownRef = useRef(null);
    const resultsRef = useRef(null);
    const [showJourneySummary, setShowJourneySummary] = useState(false);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [isPaying, setIsPaying] = useState(false);

    // Load metro lines and stations on component mount
    useEffect(() => {
        fetchMetroLines();
        fetchTrains();
        const tv = setInterval(() => fetchLiveTrains(), 15000);
        return () => clearInterval(tv);
    }, []);

    const fetchTrains = async () => {
        try {
            const resp = await fetch('/api/metro/trains/live');
            if (resp.ok) {
                const data = await resp.json();
                setAvailableTrains(data || []);
            }
        } catch (err) {
            console.warn('Unable to fetch trains', err);
        }
    };

    const fetchLiveTrains = async () => {
        try {
            const resp = await fetch('/api/metro/trains/live');
            if (resp.ok) {
                const data = await resp.json();
                setLiveTrains(data || []);
            }
        } catch (err) {
            console.warn('Unable to fetch live trains', err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
                setShowFromDropdown(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
                setShowToDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchMetroLines = async () => {
        // Initialize with local data first (always available)
        setMetroLines(metroLinesData);
        const stations = [];
        metroLinesData.forEach(line => {
            (line.stations || []).forEach(station => {
                if (!stations.find(s => s.name === station.name)) {
                    stations.push({
                        name: station.name,
                        code: station.code || station.name.slice(0, 3).toUpperCase(),
                        lat: station.lat,
                        lng: station.lng,
                        lineName: line.name,
                        lineColor: line.color
                    });
                }
            });
        });
        setAllStations(stations);

        // Try to fetch from backend (optional enhancement)
        try {
            const response = await fetch('/api/lines/lines');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setMetroLines(data);
                    const backendStations = [];
                    data.forEach(line => {
                        (line.stations || []).forEach(station => {
                            if (!backendStations.find(s => s.name === station.name)) {
                                backendStations.push({
                                    name: station.name,
                                    code: station.code || station.name.slice(0, 3).toUpperCase(),
                                    lat: station.lat,
                                    lng: station.lng,
                                    lineName: line.name,
                                    lineColor: line.color
                                });
                            }
                        });
                    });
                    setAllStations(backendStations);
                }
            }
        } catch (error) {
            console.log('Backend not available, using local data:', error.message);
        }
    };

    // Helper: normalize any route-like object to expected UI shape
    const normalizeRoute = (r) => {
        if (!r) return null;
        return {
            lineName: r.lineName || r.line || r.line_name || (r.lineObj && r.lineObj.name) || 'Line',
            lineColor: r.lineColor || r.color || (r.lineObj && r.lineObj.color) || '#999',
            fromStation: r.fromStation || r.from || r.origin || r.start || '',
            toStation: r.toStation || r.to || r.destination || r.end || '',
            estimatedTime: Number(r.estimatedTime ?? r.duration ?? r.time ?? r.durationMinutes ?? 0),
            numberOfStops: Number(r.numberOfStops ?? r.stops ?? r.stopCount ?? 0),
            fare: Number(r.fare ?? r.price ?? r.cost ?? 0),
            intermediateStations: r.intermediateStations || r.stationsBetween || []
        };
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onLogout();
        onNavigate('signin');
    };

    const handleSwapStations = () => {
        const tempStation = fromStation;
        setFromStation(toStation);
        setToStation(tempStation);

        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.fromStation;
            delete newErrors.toStation;
            delete newErrors.submit;
            return newErrors;
        });
    };

    const handleSelectChange = (type, value) => {
        if (type === 'from') {
            setFromStation(value);

            if (value.trim() === '') {
                setFromSuggestions(allStations); // Show all stations when empty
            } else {
                const filtered = allStations.filter(station =>
                    station.name.toLowerCase().includes(value.toLowerCase()) ||
                    station.code.toLowerCase().includes(value.toLowerCase())
                );
                setFromSuggestions(filtered);
            }
            setShowFromDropdown(true);
        } else if (type === 'to') {
            setToStation(value);

            if (value.trim() === '') {
                setToSuggestions(allStations); // Show all stations when empty
            } else {
                const filtered = allStations.filter(station =>
                    station.name.toLowerCase().includes(value.toLowerCase()) ||
                    station.code.toLowerCase().includes(value.toLowerCase())
                );
                setToSuggestions(filtered);
            }
            setShowToDropdown(true);
        }
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

    const handleSearch = async (e) => {
        e.preventDefault();
        setErrors({});
        setSearchResults([]);

        if (!fromStation) {
            setErrors(prev => ({ ...prev, fromStation: 'Please select a starting station' }));
            return;
        }
        if (!toStation) {
            setErrors(prev => ({ ...prev, toStation: 'Please select a destination' }));
            return;
        }
        if (fromStation === toStation) {
            setErrors(prev => ({ ...prev, submit: 'From and To stations cannot be the same' }));
            return;
        }

        setLoading(true);
        try {
            // Use local lines data to compute route (mock)
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
                            results.push({
                                lineName: line.name,
                                lineColor: line.color,
                                fromStation,
                                toStation,
                                estimatedTime: Math.abs(toIdx - fromIdx) * 3,
                                numberOfStops: Math.abs(toIdx - fromIdx),
                                fare: 10 + (Math.abs(toIdx - fromIdx) * 5),
                                intermediateStations: stations.slice(fromIdx + 1, toIdx)
                            });
                        }
                    });
                    if (results.length > 0) {
                        setSearchResults(results);
                        setShowJourneySummary(true);
                    } else {
                        const localRoute = computeLocalRoute(fromStation, toStation, selectedLine);
                        if (localRoute) {
                            setSearchResults([localRoute]);
                            setShowJourneySummary(true);
                        } else setErrors(prev => ({ ...prev, submit: 'No route found for selected stations' }));
                    }
                }
            } catch (err) {
                console.error('Local route search failed:', err);
                const localRoute = computeLocalRoute(fromStation, toStation, selectedLine);
                if (localRoute) {
                    setSearchResults([localRoute]);
                    setShowJourneySummary(true);
                } else setErrors(prev => ({ ...prev, submit: 'No route found for selected stations' }));
            }
        } catch (error) {
            console.error('Error searching route:', error);
            const localRoute = computeLocalRoute(fromStation, toStation, selectedLine);
            if (localRoute) {
                setSearchResults([localRoute]);
                setShowJourneySummary(true);
            } else {
                setErrors(prev => ({ ...prev, submit: 'Error searching routes. Please try again.' }));
            }
        } finally {
            setLoading(false);
            setTimeout(() => {
                if (resultsRef.current) {
                    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 150);
        }
    };

    const computeLocalRoute = (from, to, selectedLineId) => {
        const fromStn = allStations.find(s => s.name === from);
        const toStn = allStations.find(s => s.name === to);

        if (!fromStn || !toStn) return null;

        // Find a line that contains both stations
        const line = metroLines.find(l => {
            const fromExists = (l.stations || []).some(s => s.name === from);
            const toExists = (l.stations || []).some(s => s.name === to);
            return fromExists && toExists;
        });

        if (!line) return null;

        const stations = line.stations || [];
        const fromIdx = stations.findIndex(s => s.name === from);
        const toIdx = stations.findIndex(s => s.name === to);

        if (fromIdx === -1 || toIdx === -1) return null;

        const intermediateStations = stations.slice(
            Math.min(fromIdx, toIdx) + 1,
            Math.max(fromIdx, toIdx)
        );

        return {
            lineName: line.name,
            lineColor: line.color,
            fromStation: from,
            toStation: to,
            estimatedTime: Math.abs(toIdx - fromIdx) * 3,
            numberOfStops: Math.abs(toIdx - fromIdx),
            fare: 10 + (Math.abs(toIdx - fromIdx) * 5),
            intermediateStations: intermediateStations.map(s => ({ name: s.name }))
        };
    };

    const handleMapStationClick = (station, line) => {
        setSelectedStation({ ...station, lineName: line.name });
    };

    const showRouteOnMap = (route) => {
        setSelectedLine(null);
        const fromStn = allStations.find(s => s.name === route.fromStation);
        const toStn = allStations.find(s => s.name === route.toStation);

        if (fromStn && toStn) {
            setHighlightedRoute({
                from: { lat: fromStn.lat, lng: fromStn.lng, name: route.fromStation },
                to: { lat: toStn.lat, lng: toStn.lng, name: route.toStation }
            });
        }
    };

    const handleBookTicket = (route) => {
        const normalized = normalizeRoute(route);
        setSelectedTrain(normalized || route);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setSelectedTrain(null);
        setTicketType('single');
        setSelectedService('all');
    };

    const submitBooking = async (trainToBook = selectedTrain) => {
        if (!trainToBook) return;
        try {
            // Ensure we send station CODES for single journey bookings.
            const getCodeFor = (stationNameOrCode) => {
                if (!stationNameOrCode) return null;
                // if it's already a code (3-5 chars uppercase) prefer it
                const maybe = allStations.find(s => (s.code || s.id) === stationNameOrCode || s.name === stationNameOrCode);
                if (maybe) return (maybe.code || maybe.id) || stationNameOrCode;
                // try case-insensitive name match
                const found = allStations.find(s => s.name.toLowerCase() === String(stationNameOrCode).toLowerCase());
                return found ? (found.code || found.id) : stationNameOrCode;
            };

            const payload = {
                fromStation: getCodeFor(trainToBook.fromStation),
                toStation: getCodeFor(trainToBook.toStation),
                passengerName: (user && user.fullName) || '',
                passengerPhone: '',
                type: 'single',
                passengers: Number(passengers),
                email: (user && user.email) || undefined
            };

            const headers = { 'Content-Type': 'application/json' };
            const token = localStorage.getItem('kmrl_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Prefer server-side booking when backend available
            try {
                const resp = await fetch('/api/metro/book', { method: 'POST', headers, body: JSON.stringify(payload) });
                if (resp.ok) {
                    const data = await resp.json();
                    const bookingObj = {
                        bookingId: data.bookingId,
                        fare: data.fare,
                        ticketUrl: data.ticketUrl,
                        fromStation: trainToBook.fromStation || payload.fromStation,
                        toStation: trainToBook.toStation || payload.toStation,
                        passengerName: payload.passengerName,
                        email: payload.email,
                        type: payload.type,
                        date: new Date().toLocaleString(),
                        createdAt: Date.now(),
                        status: 'Success',
                        method: 'Card/UPI'
                    };
                    localStorage.setItem('kmrl_latest_booking', JSON.stringify(bookingObj));

                    const txns = JSON.parse(localStorage.getItem('kmrl_all_transactions') || '[]');
                    txns.push(bookingObj);
                    localStorage.setItem('kmrl_all_transactions', JSON.stringify(txns));

                    closeBookingModal();
                    onNavigate('ticket');
                    return;
                }
            } catch (err) {
                console.warn('Server booking failed, falling back to local mock', err);
            }

            // Fallback to mock booking if server not available
            const mockData = {
                bookingId: 'MOCK-' + Date.now(),
                fare: payload.type === 'single' ? 25 : 50,
                ticketUrl: '/mock-api/tickets/' + Date.now() + '.pdf'
            };
            const bookingObj = {
                bookingId: mockData.bookingId,
                fare: mockData.fare,
                ticketUrl: mockData.ticketUrl,
                fromStation: trainToBook.fromStation || payload.fromStation,
                toStation: trainToBook.toStation || payload.toStation,
                passengerName: payload.passengerName,
                email: payload.email,
                type: payload.type,
                date: new Date().toLocaleString(),
                createdAt: Date.now(),
                status: 'Success',
                method: 'Card/UPI'
            };
            localStorage.setItem('kmrl_latest_booking', JSON.stringify(bookingObj));

            const txns = JSON.parse(localStorage.getItem('kmrl_all_transactions') || '[]');
            txns.push(bookingObj);
            localStorage.setItem('kmrl_all_transactions', JSON.stringify(txns));

            closeBookingModal();
            onNavigate('ticket');
        } catch (err) {
            console.error('Booking error:', err);
            alert('Booking failed. Please try again.');
        }
    };

    // Compute displayed total for modal based on ticketType
    const computeDisplayedTotal = () => {
        const base = Number(selectedTrain?.fare || 0);
        if (!selectedTrain) return 0;
        switch (ticketType) {
            case 'single': return base;
            case 'day-pass': return base + 50;
            case 'weekly-pass': return 300;
            case 'monthly-pass': return 600;
            case 'smart-card': return 100; // card issuing price
            default: return base;
        }
    };

    if ((showJourneySummary || showPaymentOptions) && searchResults.length > 0) {
        const route = searchResults[0];
        const routeFare = route.fare || 10;
        const activeTrain = selectedTrain || {
            ...route,
            fare: routeFare,
            estimatedTime: route.estimatedTime || route.time || 15,
            numberOfStops: route.numberOfStops || route.stops || 3
        };

        return (
            <div className="fm-journey-summary-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', background: '#f4f6f8', minHeight: '80vh' }}>
                <div className="ts-modal-container" style={{ maxWidth: '1000px', width: '100%', background: 'transparent' }}>
                    <div className="ts-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
                        <button className="ts-close-btn" onClick={() => { setShowJourneySummary(false); setShowPaymentOptions(false); }} style={{ fontSize: '1rem', background: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            Back to Search
                        </button>
                    </div>

                    <div className="ts-content">
                        {/* LEFT COLUMN - Journey Details */}
                        <div className="ts-left-col">
                            <div className="ts-journey-card">
                                <div className="ts-trip-status">
                                    <span className="ts-active-text">● ACTIVE TRIP</span>
                                    <span className="ts-dot">•</span>
                                    <span className="ts-line-name">{activeTrain.lineName}</span>
                                </div>

                                <div className="ts-route-big">
                                    <div className="ts-station">{activeTrain.fromStation}</div>
                                    <div className="ts-arrow">➔</div>
                                    <div className="ts-station">{activeTrain.toStation}</div>
                                </div>

                                <div className="ts-time-info">
                                    <div className="ts-time-block">
                                        <span className="ts-time-label">Departure</span>
                                        <span className="ts-time-val">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="ts-time-block">
                                        <span className="ts-time-label">Expected Arrival</span>
                                        <span className="ts-time-val">{new Date(Date.now() + (activeTrain.estimatedTime || 15) * 60000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ts-middle-cards">
                                <div className="ts-traveler-card">
                                    <div className="ts-traveler-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </div>
                                    <div className="ts-traveler-info">
                                        <label>Traveler Detail</label>
                                        <input
                                            type="text"
                                            className="ts-name-input"
                                            value={user?.fullName || 'John Doe'}
                                            readOnly
                                            placeholder="Enter your name"
                                        />
                                        <div className="ts-passenger-id">ID: {user?.id || 'Pass-X91A1'}</div>
                                    </div>
                                </div>

                                <div className="ts-tickets-card">
                                    <div className="ts-tickets-label">Number of Tickets</div>
                                    <div className="ts-counter-row">
                                        <div className="ts-counter">
                                            <button className="ts-counter-btn" onClick={() => setPassengers(p => Math.max(1, Number(p) - 1))}>−</button>
                                            <span className="ts-count-val">{passengers}</span>
                                            <button className="ts-counter-btn" onClick={() => setPassengers(p => Math.min(6, Number(p) + 1))}>+</button>
                                        </div>
                                        <div className="ts-unit-price">
                                            <div className="ts-price-label">Base Fare</div>
                                            <div className="ts-price-val">₹{routeFare}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN - Payments */}
                        <div className="ts-right-col">
                            <div className="ts-payment-card">
                                <h3 className="ts-payment-title">Payment Method</h3>

                                <div className="ts-payment-options">
                                    <div className={`ts-pm-option ${ticketType === 'card' ? 'active' : ''}`} onClick={() => setTicketType('card')}>
                                        <div className="ts-radio">
                                            <div className="ts-radio-inner"></div>
                                        </div>
                                        <div className="ts-pm-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                        </div>
                                        <span className="ts-pm-name">Credit/Debit Card</span>
                                    </div>

                                    <div className={`ts-pm-option ${ticketType === 'wallet' ? 'active' : ''}`} onClick={() => setTicketType('wallet')}>
                                        <div className="ts-radio">
                                            <div className="ts-radio-inner"></div>
                                        </div>
                                        <div className="ts-pm-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                        </div>
                                        <span className="ts-pm-name">Digital Wallet</span>
                                    </div>

                                    <div className={`ts-pm-option ${ticketType === 'upi' ? 'active' : ''}`} onClick={() => setTicketType('upi')}>
                                        <div className="ts-radio">
                                            <div className="ts-radio-inner"></div>
                                        </div>
                                        <div className="ts-pm-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="7" y="7" width="3" height="3"></rect><rect x="14" y="7" width="3" height="3"></rect><rect x="7" y="14" width="3" height="3"></rect><rect x="14" y="14" width="3" height="3"></rect></svg>
                                        </div>
                                        <span className="ts-pm-name">UPI / QR Pay</span>
                                    </div>
                                </div>

                                <div className="ts-summary-totals">
                                    <div className="ts-total-row">
                                        <span>Subtotal</span>
                                        <span>₹{routeFare * Number(passengers)}</span>
                                    </div>
                                    <div className="ts-total-row">
                                        <span>Booking Fee</span>
                                        <span>₹0</span>
                                    </div>
                                    <div className="ts-total-row ts-grand-total">
                                        <span>Grand Total</span>
                                        <span className="ts-grand-val">₹{routeFare * Number(passengers)}</span>
                                    </div>
                                </div>

                                <button className="ts-pay-btn" disabled={isPaying || loading} style={{ position: 'relative' }} onClick={async () => {
                                    if (!user) {
                                        alert("Please sign in to proceed with booking.");
                                        onNavigate("signin");
                                        return;
                                    }
                                    setIsPaying(true);

                                    // Random delay between 4000ms and 6000ms
                                    const delay = Math.floor(Math.random() * 2000) + 4000;
                                    await new Promise(res => setTimeout(res, delay));

                                    try {
                                        await submitBooking(activeTrain);
                                    } finally {
                                        setIsPaying(false);
                                    }
                                }}>
                                    {isPaying ? 'Processing Payment...' : `Pay ₹${routeFare * Number(passengers)}`}
                                </button>
                                <div className="ts-secure-text">🔒 256-bit SSL Secured Payment</div>
                            </div>

                            <div className="ts-help-card">
                                <div className="ts-help-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                </div>
                                <div className="ts-help-text">
                                    <strong>Need Help?</strong>
                                    <p>Contact 24/7 customer support for payment issues or delays.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="findmetro-container">
            {/* New Unified Hero Banner */}
            <div className="fm-hero-wrapper">
                <img src="/images/p1.png" alt="Metro Illustration Left" className="fm-hero-img-left" />
                <div className="fm-hero-center">
                    <h1>Plan Your Trip & Network Map</h1>
                    <p>Welcome to the comprehensive hub for exploring Kochi Metro routes, tracking live trains, and finding fast and smart connections across the city.</p>
                </div>
                <img src="/images/p2.png" alt="Metro Illustration Right" className="fm-hero-img-right" />
            </div>

            {/* Live Trains Marquee */}
            <div className="fm-live-updates-bar">
                <span className="live-label">LIVE TRAINS</span>
                <div className="live-ticker-wrap">
                    <div className="live-ticker-scroll">
                        {liveTrains && liveTrains.length > 0 ? (
                            liveTrains.map((t, i) => (
                                <div key={i} className="live-item-badge">
                                    <span style={{ fontWeight: 700 }}>{t.name}</span>
                                    <span>{t.currentStation || '-'} → {t.nextStop || '-'}</span>
                                    <span style={{ color: t.delayedByMinutes ? '#ef4444' : '#10b981' }}>
                                        {t.delayedByMinutes ? `Delay ${t.delayedByMinutes}m` : t.status || 'Running'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="live-item-badge">No active live train updates right now.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fm-main-layout">
                {/* Left Column: Plan Your Trip Form & Services */}
                <div className="fm-left-column">
                    <div className="tp-card-container">
                        <div className="tp-header">
                            <h2>PLAN YOUR JOURNEY</h2>
                        </div>
                        <div className="tp-body">
                            <div className="tp-toggle-group">
                                <button type="button" className="tp-toggle-btn active">
                                    <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>➔</span> One way
                                </button>
                            </div>

                            <form onSubmit={handleSearch} className="tp-form">
                                <p className="tp-select-label">Select locality or station</p>

                                {errors.submit && <div className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '10px' }}>{errors.submit}</div>}

                                <div className="tp-inputs-wrapper">
                                    <div className="tp-input-group" ref={fromDropdownRef}>
                                        <label htmlFor="fromStation">From</label>
                                        <input
                                            type="text"
                                            id="fromStation"
                                            value={fromStation}
                                            onChange={(e) => handleSelectChange('from', e.target.value)}
                                            onFocus={() => {
                                                setShowFromDropdown(true);
                                                if (fromStation.trim() === '') setFromSuggestions(allStations);
                                            }}
                                            placeholder="Search From Locality or Station"
                                            autoComplete="off"
                                        />
                                        {showFromDropdown && fromSuggestions.length > 0 && (
                                            <div className="dropdown-list" onMouseDown={(e) => e.preventDefault()}>
                                                {fromSuggestions.map((station, idx) => (
                                                    <div key={idx} className="dropdown-item" onClick={() => selectFromStation(station)}>
                                                        <div className="station-info">
                                                            <strong>{station.name}</strong>
                                                            <span className="station-code">{station.code}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.fromStation && <span className="error-text" style={{ color: '#ef4444', fontSize: '0.75rem', position: 'absolute', bottom: '-18px' }}>{errors.fromStation}</span>}
                                    </div>

                                    {/* Elegant Swap Button */}
                                    <div className="tp-swap-btn" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 30 }}>
                                        <button
                                            type="button"
                                            onClick={handleSwapStations}
                                            title="Swap stations"
                                            style={{
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '50%',
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                color: '#0ea5e9',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.transform = 'rotate(180deg)';
                                                e.currentTarget.style.background = '#f0f9ff';
                                                e.currentTarget.style.borderColor = '#bae6fd';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = 'rotate(0deg)';
                                                e.currentTarget.style.background = '#ffffff';
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                            }}
                                        >
                                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>⇅</span>
                                        </button>
                                    </div>

                                    <div className="tp-input-group" ref={toDropdownRef}>
                                        <label htmlFor="toStation">To</label>
                                        <input
                                            type="text"
                                            id="toStation"
                                            value={toStation}
                                            onChange={(e) => handleSelectChange('to', e.target.value)}
                                            onFocus={() => {
                                                setShowToDropdown(true);
                                                if (toStation.trim() === '') setToSuggestions(allStations);
                                            }}
                                            placeholder="Search To Locality or Station"
                                            autoComplete="off"
                                        />
                                        {showToDropdown && toSuggestions.length > 0 && (
                                            <div className="dropdown-list" onMouseDown={(e) => e.preventDefault()}>
                                                {toSuggestions.map((station, idx) => (
                                                    <div key={idx} className="dropdown-item" onClick={() => selectToStation(station)}>
                                                        <div className="station-info">
                                                            <strong>{station.name}</strong>
                                                            <span className="station-code">{station.code}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.toStation && <span className="error-text" style={{ color: '#ef4444', fontSize: '0.75rem', position: 'absolute', bottom: '-18px' }}>{errors.toStation}</span>}
                                    </div>
                                </div>

                                <div className="tp-actions">
                                    <button type="button" className="tp-reset-btn" onClick={() => {
                                        setFromStation('');
                                        setToStation('');
                                        setErrors({});
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>↻</span> RESET
                                    </button>
                                    <button type="submit" className="tp-submit-btn" disabled={loading} onClick={(e) => {
                                        if (!user) {
                                            e.preventDefault();
                                            alert("Please sign in to plan a journey.");
                                            onNavigate("signin");
                                        }
                                    }}>
                                        {loading ? 'Searching...' : (!user ? 'SIGN IN TO PLAN' : 'PLAN JOURNEY')}
                                    </button>
                                </div>
                            </form>
                            <img src="/images/footer1.png" alt="City Skyline" className="tp-footer-img" />
                        </div>
                    </div>

                    {/* Integrated Station Services */}
                    <div className="station-services-panel">
                        <div className="card-header">🛎️ Check Station Facilities</div>
                        <div className="card-body">
                            <label style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem', color: '#666' }}>Select any station to explore its available services</label>
                            <select value={selectedStation?.name || ''} onChange={(e) => {
                                const name = e.target.value;
                                const st = allStations.find(s => s.name === name);
                                setSelectedStation(st || null);
                            }} className="services-select">
                                <option value="">-- Choose a station --</option>
                                {allStations.map((s, idx) => (
                                    <option key={idx} value={s.name}>{s.name} ({s.code})</option>
                                ))}
                            </select>

                            {selectedStation ? (
                                <div className="services-preview">
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0d9488' }}>{selectedStation.name}</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Line: <strong style={{ color: '#333' }}>{selectedStation.lineName || '—'}</strong></p>
                                    <div className="facilities-grid-mini">
                                        <span className="fm-tag">🏧 ATM</span>
                                        <span className="fm-tag">🍔 Food Court</span>
                                        <span className="fm-tag">📶 WiFi</span>
                                        <span className="fm-tag">💬 Help Desk</span>
                                        <span className="fm-tag">🅿️ Parking</span>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: '#888', fontStyle: 'italic', marginTop: '1rem' }}>No station selected. Choose one to see amenities like ATM, WiFi, etc.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Network Map and Line Controls */}
                <div className="fm-right-column">
                    <div className="fm-map-header">
                        <h2>Interactive Network Map</h2>
                        <div className="lines-pills">
                            <button
                                className={`line-pill ${selectedLine === null ? 'active' : ''}`}
                                onClick={() => setSelectedLine(null)}
                                style={{ '--pill-color': '#64748b' }}
                            >
                                All Lines
                            </button>
                            {metroLinesData.map(line => (
                                <button
                                    key={line.id}
                                    className={`line-pill ${selectedLine === line.id ? 'active' : ''}`}
                                    onClick={() => { setSelectedLine(line.id); setHighlightedRoute(null); }}
                                    style={{ '--pill-color': line.color || '#0d9488' }}
                                >
                                    {line.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="fm-map-wrapper">
                        <MapMetro
                            height="100%"
                            selectedLineId={selectedLine}
                            highlightedRoute={highlightedRoute}
                            onStationClick={handleMapStationClick}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Processing Overlay */}
            {isPaying && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
                    zIndex: 9999, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <style>
                        {`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                        `}
                    </style>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTopColor: '#0ea5e9',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '1.5rem'
                    }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                        Processing Payment
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                        Please wait while we confirm your transaction securely. Do not close or refresh this page.
                    </p>
                </div>
            )}
        </div>
    );
}

export default FindMetro;
