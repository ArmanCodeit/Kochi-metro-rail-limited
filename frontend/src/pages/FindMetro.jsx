import React, { useState, useEffect, useRef } from 'react';
import '../styles/FindMetro.css';
import MapMetro from '../components/Metro/MapMetro';
import SchematicMetroMap from '../components/Metro/SchematicMetroMap';
import metroLinesData from '../data/metroLines';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

function FindMetro({ onNavigate, user, onLogout }) {
    const [metroLines, setMetroLines] = useState([]);
    const [selectedLine, setSelectedLine] = useState(null);
    const [fromStation, setFromStation] = useState('Aluva');
    const [toStation, setToStation] = useState('Infopark');
    const [passengers, setPassengers] = useState(1);
    const [allStations, setAllStations] = useState([]);
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);

    // Multi-route state
    const [candidateRoutes, setCandidateRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Map view mode: 'schematic' (DMRC-inspired) or 'gis' (Leaflet OpenStreetMap)
    const [mapViewMode, setMapViewMode] = useState('schematic');
    const [highlightedRouteStations, setHighlightedRouteStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);

    // Live trains & booking
    const [liveTrains, setLiveTrains] = useState([]);
    const [showJourneySummary, setShowJourneySummary] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'virtual_card'
    const [paymentError, setPaymentError] = useState(null);

    const fromDropdownRef = useRef(null);
    const toDropdownRef = useRef(null);
    const resultsRef = useRef(null);

    // Check for pre-planned trip passed from Recharge page or prior navigation
    useEffect(() => {
        try {
            const savedTrip = localStorage.getItem('kmrl_planned_trip');
            if (savedTrip) {
                const parsed = JSON.parse(savedTrip);
                if (parsed.fromStation && parsed.toStation) {
                    setFromStation(parsed.fromStation);
                    setToStation(parsed.toStation);
                    if (parsed.route) {
                        setCandidateRoutes([parsed.route]);
                        setSelectedRoute(parsed.route);
                        setHighlightedRouteStations(parsed.route.fullPath || []);
                        setShowJourneySummary(true);
                    }
                }
                localStorage.removeItem('kmrl_planned_trip');
            }
        } catch {}
    }, []);

    // Load metro network from backend
    useEffect(() => {
        fetch('/api/metro/network')
            .then(res => res.json())
            .then(data => {
                if (data.stations) {
                    setAllStations(data.stations);
                }
            })
            .catch(() => {
                // Local fallback
                const stations = [];
                metroLinesData.forEach(line => {
                    (line.stations || []).forEach(st => {
                        if (!stations.find(s => s.name === st.name)) {
                            stations.push({ name: st.name, code: st.code || st.name.slice(0, 3).toUpperCase(), lineName: line.name });
                        }
                    });
                });
                setAllStations(stations);
            });

        fetchLiveTrains();
        const tv = setInterval(fetchLiveTrains, 15000);
        return () => clearInterval(tv);
    }, []);

    const fetchLiveTrains = async () => {
        try {
            const resp = await fetch('/api/metro/trains/live');
            if (resp.ok) {
                const data = await resp.json();
                setLiveTrains(data || []);
            }
        } catch {}
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

    const handleSelectChange = (field, value) => {
        if (field === 'from') {
            setFromStation(value);
            setShowFromDropdown(true);
            const filtered = allStations.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
            setFromSuggestions(filtered);
        } else {
            setToStation(value);
            setShowToDropdown(true);
            const filtered = allStations.filter(s => s.name.toLowerCase().includes(value.toLowerCase()));
            setToSuggestions(filtered);
        }
    };

    const selectFromStation = (st) => {
        setFromStation(st.name);
        setShowFromDropdown(false);
    };

    const selectToStation = (st) => {
        setToStation(st.name);
        setShowToDropdown(false);
    };

    const handleSwapStations = () => {
        const temp = fromStation;
        setFromStation(toStation);
        setToStation(temp);
    };

    // Graph-based multi-line route calculation
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setErrors({});
        setCandidateRoutes([]);
        setSelectedRoute(null);
        setHighlightedRouteStations([]);

        if (!fromStation) {
            setErrors(prev => ({ ...prev, fromStation: 'Please select an origin station' }));
            return;
        }
        if (!toStation) {
            setErrors(prev => ({ ...prev, toStation: 'Please select a destination' }));
            return;
        }
        if (fromStation.trim().toLowerCase() === toStation.trim().toLowerCase()) {
            setErrors(prev => ({ ...prev, submit: 'Origin and Destination stations cannot be the same' }));
            return;
        }

        setLoading(true);
        try {
            const resp = await fetch('/api/metro/plan-routes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromStation, toStation })
            });

            const data = await resp.json();

            if (resp.ok && data.routes && data.routes.length > 0) {
                setCandidateRoutes(data.routes);
                setSelectedRoute(data.routes[0]);
                setHighlightedRouteStations(data.routes[0].fullPath || []);
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            } else {
                setErrors(prev => ({ ...prev, submit: data.message || 'No connected metro routes found between these stations.' }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, submit: 'Failed to connect to route planning engine.' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRouteCard = (route) => {
        setSelectedRoute(route);
        setHighlightedRouteStations(route.fullPath || []);
    };

    // Proceed to Review & Checkout
    const handleProceedToReview = (route) => {
        setSelectedRoute(route);
        setHighlightedRouteStations(route.fullPath || []);
        setShowJourneySummary(true);
    };

    // Ticket purchase via Razorpay or Virtual Card
    const handleCompletePaymentAndIssueTicket = async () => {
        if (!selectedRoute) return;
        setIsPaying(true);
        setPaymentError(null);

        const token = localStorage.getItem('kmrl_token');

        try {
            if (paymentMethod === 'virtual_card') {
                // Pay directly from user's Virtual Metro Card balance
                if (!token) {
                    alert('Please sign in to pay with your Virtual Metro Card.');
                    if (onNavigate) onNavigate('signin');
                    return;
                }

                const res = await fetch('/api/metro/tickets/pay-with-card', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fromStation,
                        toStation,
                        routeId: selectedRoute.routeId,
                        passengers: Number(passengers),
                        passengerName: user?.fullName || 'Metro Passenger'
                    })
                });

                const data = await res.json();
                if (res.ok && data.success && data.ticket) {
                    localStorage.setItem('kmrl_latest_booking', JSON.stringify(data.ticket));
                    setShowJourneySummary(false);
                    if (onNavigate) onNavigate('ticket');
                } else {
                    setPaymentError(data.message || 'Virtual Card payment failed.');
                }
            } else {
                // Official Razorpay Checkout Test Payment
                const isLoaded = await loadRazorpayScript();
                if (!isLoaded) {
                    throw new Error('Could not load Razorpay payment gateway.');
                }

                // 1. Create order on backend
                const orderRes = await fetch('/api/metro/tickets/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        fromStation,
                        toStation,
                        routeId: selectedRoute.routeId,
                        passengers: Number(passengers)
                    })
                });

                const orderData = await orderRes.json();
                if (!orderRes.ok || !orderData.orderId) {
                    throw new Error(orderData.message || 'Failed to initialize Razorpay ticket order.');
                }

                // 2. Open Razorpay Checkout
                const options = {
                    key: orderData.keyId,
                    amount: orderData.amount,
                    currency: orderData.currency || 'INR',
                    name: 'Kochi Metro Rail Limited',
                    description: `5-Hour QR Pass: ${fromStation} → ${toStation}`,
                    image: '/images/kmrl-logo.png',
                    order_id: orderData.orderId,
                    prefill: orderData.prefill || {},
                    theme: { color: '#059db2' },
                    handler: async function (response) {
                        try {
                            // 3. Verify signature server-side and issue 5-hour ticket
                            const verifyRes = await fetch('/api/metro/tickets/verify-and-issue', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                },
                                body: JSON.stringify({
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature,
                                    fromStation,
                                    toStation,
                                    routeId: selectedRoute.routeId,
                                    passengers: Number(passengers),
                                    passengerName: user?.fullName || 'Metro Passenger'
                                })
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyRes.ok && verifyData.success && verifyData.ticket) {
                                localStorage.setItem('kmrl_latest_booking', JSON.stringify(verifyData.ticket));
                                setShowJourneySummary(false);
                                if (onNavigate) onNavigate('ticket');
                            } else {
                                setPaymentError(verifyData.message || 'Payment verification failed on the server.');
                            }
                        } catch (vErr) {
                            setPaymentError('Verification request failed.');
                        } finally {
                            setIsPaying(false);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            setIsPaying(false);
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (err) {
            setPaymentError(err.message || 'An error occurred during ticket checkout.');
        } finally {
            if (paymentMethod === 'virtual_card') {
                setIsPaying(false);
            }
        }
    };

    // ── JOURNEY REVIEW & PAYMENT SCREEN ──
    if (showJourneySummary && selectedRoute) {
        const totalFare = selectedRoute.fare * Number(passengers);

        return (
            <div className="fm-journey-summary-page" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', background: '#f8fafc', minHeight: '80vh' }}>
                <div className="ts-modal-container" style={{ maxWidth: '980px', width: '100%', background: 'transparent' }}>
                    {/* Header */}
                    <div className="ts-header" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                        <button
                            type="button"
                            className="ts-close-btn"
                            onClick={() => setShowJourneySummary(false)}
                            style={{ fontSize: '0.95rem', background: '#e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none', fontWeight: 700 }}
                        >
                            ← Back to Route Alternatives
                        </button>
                    </div>

                    <div className="ts-content" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.8rem' }}>
                        {/* LEFT COLUMN: SELECTED JOURNEY DETAILS */}
                        <div className="ts-left-col">
                            <div className="ts-journey-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                                <div className="ts-trip-status" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <span style={{ background: '#ecfdf5', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>
                                        {selectedRoute.isRecommended ? '⭐ RECOMMENDED ROUTE' : 'SELECTED JOURNEY'}
                                    </span>
                                    <span style={{ color: '#94a3b8' }}>•</span>
                                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                        {selectedRoute.transfers === 0 ? 'Direct Journey' : `${selectedRoute.transfers} Line Transfer`}
                                    </span>
                                </div>

                                <div className="ts-route-big" style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{fromStation}</div>
                                    <div style={{ color: '#059db2', fontSize: '1.4rem' }}>➔</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{toStation}</div>
                                </div>

                                {/* Multi-Line badges */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.8rem 0' }}>
                                    {selectedRoute.lines.map((l, i) => (
                                        <React.Fragment key={l.id}>
                                            <span style={{ background: l.color, color: '#fff', padding: '0.25rem 0.65rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.78rem' }}>
                                                {l.name}
                                            </span>
                                            {i < selectedRoute.lines.length - 1 && (
                                                <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, alignSelf: 'center' }}>
                                                    ➔ Switch at {selectedRoute.interchanges[i]} ➔
                                                </span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Step by step segments */}
                                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '1rem', fontSize: '0.82rem', lineHeight: 1.6 }}>
                                    {selectedRoute.segments.map((seg, idx) => (
                                        <div key={idx} style={{ marginBottom: idx < selectedRoute.segments.length - 1 ? '0.8rem' : 0 }}>
                                            <div style={{ fontWeight: 800, color: seg.lineColor }}>
                                                Step {idx + 1}: Board {seg.lineName} at {seg.boardAt}
                                            </div>
                                            <div style={{ color: '#64748b', marginLeft: '0.8rem' }}>
                                                Towards {seg.directionTowards} • {seg.stopsCount} stops • Exit at {seg.alightAt}
                                            </div>
                                            {seg.transferInstruction && (
                                                <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '0.3rem 0.6rem', borderRadius: '6px', color: '#0f766e', fontWeight: 700, margin: '4px 0 4px 0.8rem' }}>
                                                    🔄 {seg.transferInstruction}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem' }}>
                                    <span>Total Stops: <strong>{selectedRoute.totalStops}</strong></span>
                                    <span>Est. Travel Time: <strong>~{selectedRoute.estimatedMinutes} mins</strong></span>
                                    <span>Validity: <strong>Strictly 5 Hours</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: PASSENGERS & PAYMENT CHOICE */}
                        <div className="ts-right-col">
                            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0', color: '#0f172a' }}>
                                    Review & Payment
                                </h3>

                                {/* Passenger Counter */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Passengers</div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Base fare: ₹{selectedRoute.fare} / passenger</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <button
                                            type="button"
                                            aria-label="Decrease passenger count"
                                            onClick={() => setPassengers(p => Math.max(1, p - 1))}
                                            disabled={passengers <= 1}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                border: '1.5px solid #cbd5e1',
                                                background: passengers <= 1 ? '#f1f5f9' : '#ffffff',
                                                color: passengers <= 1 ? '#94a3b8' : '#0f172a',
                                                cursor: passengers <= 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '1.2rem',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                lineHeight: 1,
                                                transition: 'all 0.15s ease',
                                                userSelect: 'none',
                                                boxShadow: passengers <= 1 ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
                                            }}
                                        >
                                            −
                                        </button>
                                        <span style={{ fontWeight: 800, fontSize: '1.05rem', minWidth: '28px', textAlign: 'center', color: '#0f172a' }}>
                                            {passengers}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label="Increase passenger count"
                                            onClick={() => setPassengers(p => Math.min(6, p + 1))}
                                            disabled={passengers >= 6}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                border: '1.5px solid #cbd5e1',
                                                background: passengers >= 6 ? '#f1f5f9' : '#ffffff',
                                                color: passengers >= 6 ? '#94a3b8' : '#0f172a',
                                                cursor: passengers >= 6 ? 'not-allowed' : 'pointer',
                                                fontSize: '1.2rem',
                                                fontWeight: 800,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                lineHeight: 1,
                                                transition: 'all 0.15s ease',
                                                userSelect: 'none',
                                                boxShadow: passengers >= 6 ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Payment Method Choice */}
                                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
                                    Select Payment Method
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.2rem' }}>
                                    <div
                                        onClick={() => setPaymentMethod('razorpay')}
                                        style={{
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            border: paymentMethod === 'razorpay' ? '2px solid #059db2' : '1px solid #cbd5e1',
                                            background: paymentMethod === 'razorpay' ? '#ecfeff' : '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>💳</span>
                                            <div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Razorpay Payment</div>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>UPI, Cards, NetBanking (Official Test Mode)</div>
                                            </div>
                                        </div>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #059db2', background: paymentMethod === 'razorpay' ? '#059db2' : '#fff' }} />
                                    </div>

                                    <div
                                        onClick={() => setPaymentMethod('virtual_card')}
                                        style={{
                                            padding: '0.8rem',
                                            borderRadius: '10px',
                                            border: paymentMethod === 'virtual_card' ? '2px solid #059db2' : '1px solid #cbd5e1',
                                            background: paymentMethod === 'virtual_card' ? '#ecfeff' : '#ffffff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                                            <div>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Virtual Metro Card Wallet</div>
                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Instant debit from your stored-value card</div>
                                            </div>
                                        </div>
                                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #059db2', background: paymentMethod === 'virtual_card' ? '#059db2' : '#fff' }} />
                                    </div>
                                </div>

                                {paymentError && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem' }}>
                                        ⚠️ {paymentError}
                                    </div>
                                )}

                                {/* Total and Pay Button */}
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>Total Amount:</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>₹{totalFare}</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCompletePaymentAndIssueTicket}
                                    disabled={isPaying}
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, #059db2 0%, #0d9488 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '0.95rem',
                                        borderRadius: '10px',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(5, 157, 178, 0.35)'
                                    }}
                                >
                                    {isPaying ? 'Processing Payment...' : `Pay ₹${totalFare} & Generate 5-Hour QR Pass`}
                                </button>

                                <div style={{ textAlign: 'center', marginTop: '0.8rem', fontSize: '0.72rem', color: '#94a3b8' }}>
                                    🔒 Server-verified ticket • 5-Hour Validity Window from Issuance
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
            {/* Unified Hero Banner */}
            <div className="fm-hero-wrapper">
                <img src="/images/p1.png" alt="Metro Illustration Left" className="fm-hero-img-left" />
                <div className="fm-hero-center">
                    <h1>Plan Your Trip & Network Map</h1>
                    <p>Explore Kochi Metro multi-line connections, calculate transfers, and book 5-hour digital QR tickets seamlessly.</p>
                </div>
                <img src="/images/p2.png" alt="Metro Illustration Right" className="fm-hero-img-right" />
            </div>

            {/* Live Trains Ticker */}
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
                            <div className="live-item-badge">All Kochi Metro trains operating on schedule.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="fm-main-layout">
                {/* Left Column: Route Planner Form */}
                <div className="fm-left-column">
                    <div className="tp-card-container">
                        <div className="tp-header">
                            <h2>PLAN YOUR JOURNEY</h2>
                        </div>
                        <div className="tp-body">
                            <form onSubmit={handleSearch} className="tp-form">
                                <p className="tp-select-label">Select departing and arriving stations</p>

                                {errors.submit && <div className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '10px' }}>{errors.submit}</div>}

                                <div className="tp-inputs-wrapper">
                                    {/* From Station */}
                                    <div className="tp-input-group" ref={fromDropdownRef}>
                                        <label htmlFor="fromStation">From</label>
                                        <input
                                            type="text"
                                            id="fromStation"
                                            value={fromStation}
                                            onChange={(e) => handleSelectChange('from', e.target.value)}
                                            onFocus={() => {
                                                setShowFromDropdown(true);
                                                setFromSuggestions(allStations);
                                            }}
                                            placeholder="Search departure station..."
                                            autoComplete="off"
                                        />
                                        {showFromDropdown && fromSuggestions.length > 0 && (
                                            <div className="dropdown-list" onMouseDown={(e) => e.preventDefault()}>
                                                {fromSuggestions.map((st, idx) => (
                                                    <div key={idx} className="dropdown-item" onClick={() => selectFromStation(st)}>
                                                        <div className="station-info">
                                                            <strong>{st.name}</strong>
                                                            <span className="station-code">{st.code}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.fromStation && <span className="error-text" style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.fromStation}</span>}
                                    </div>

                                    {/* Swap Button */}
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
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                color: '#059db2',
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            ⇅
                                        </button>
                                    </div>

                                    {/* To Station */}
                                    <div className="tp-input-group" ref={toDropdownRef}>
                                        <label htmlFor="toStation">To</label>
                                        <input
                                            type="text"
                                            id="toStation"
                                            value={toStation}
                                            onChange={(e) => handleSelectChange('to', e.target.value)}
                                            onFocus={() => {
                                                setShowToDropdown(true);
                                                setToSuggestions(allStations);
                                            }}
                                            placeholder="Search arrival station..."
                                            autoComplete="off"
                                        />
                                        {showToDropdown && toSuggestions.length > 0 && (
                                            <div className="dropdown-list" onMouseDown={(e) => e.preventDefault()}>
                                                {toSuggestions.map((st, idx) => (
                                                    <div key={idx} className="dropdown-item" onClick={() => selectToStation(st)}>
                                                        <div className="station-info">
                                                            <strong>{st.name}</strong>
                                                            <span className="station-code">{st.code}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {errors.toStation && <span className="error-text" style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.toStation}</span>}
                                    </div>
                                </div>

                                <div className="tp-actions">
                                    <button type="submit" className="tp-submit-btn" disabled={loading} style={{ width: '100%' }}>
                                        {loading ? 'Calculating Routes...' : 'PLAN JOURNEY & SHOW ROUTES'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Route Alternatives Selection Panel */}
                    {candidateRoutes.length > 0 && (
                        <div ref={resultsRef} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    Available Route Alternatives ({candidateRoutes.length})
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select preferred route to review & book</span>
                            </div>

                            {candidateRoutes.map((route, idx) => {
                                const isSelected = selectedRoute?.routeId === route.routeId;
                                return (
                                    <div
                                        key={route.routeId}
                                        onClick={() => handleSelectRouteCard(route)}
                                        style={{
                                            background: '#ffffff',
                                            borderRadius: '14px',
                                            border: isSelected ? '2px solid #059db2' : '1px solid #e2e8f0',
                                            padding: '1.2rem',
                                            boxShadow: isSelected ? '0 4px 18px rgba(5, 157, 178, 0.18)' : '0 2px 6px rgba(0,0,0,0.04)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    background: route.isRecommended ? '#ecfdf5' : '#f1f5f9',
                                                    color: route.isRecommended ? '#047857' : '#475569',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    padding: '0.2rem 0.55rem',
                                                    borderRadius: '6px'
                                                }}>
                                                    {route.isRecommended ? '⭐ RECOMMENDED' : `ALTERNATIVE ${idx + 1}`}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                                                    {route.name}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059db2' }}>
                                                ₹{route.fare}
                                            </div>
                                        </div>

                                        {/* Line Badges */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                                            {route.lines.map((l, lIdx) => (
                                                <React.Fragment key={l.id}>
                                                    <span style={{ background: l.color, color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                                        {l.name}
                                                    </span>
                                                    {lIdx < route.lines.length - 1 && (
                                                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>
                                                            ➔ Switch at {route.interchanges[lIdx]} ➔
                                                        </span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>

                                        <div style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.4rem 0' }}>
                                            {route.transfers === 0 ? 'Direct ride' : `${route.transfers} transfer`} • {route.totalStops} stops • Duration: ~{route.estimatedMinutes} mins
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#059db2', fontWeight: 700 }}>
                                                {isSelected ? '✓ Currently Selected & Mapped' : 'Click to preview on map'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProceedToReview(route);
                                                }}
                                                style={{
                                                    background: '#059db2',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    padding: '0.4rem 0.9rem',
                                                    borderRadius: '6px',
                                                    fontWeight: 800,
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Select & Review Journey →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: DMRC-Inspired Multi-Line Schematic Map */}
                <div className="fm-right-column">
                    <div className="fm-map-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>Kochi Metro Transit Network</h2>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                                Click stations to set route • DMRC-inspired schematic topology
                            </p>
                        </div>

                        {/* View Switcher: Schematic vs GIS Leaflet */}
                        <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setMapViewMode('schematic')}
                                style={{
                                    border: 'none',
                                    background: mapViewMode === 'schematic' ? '#ffffff' : 'transparent',
                                    color: mapViewMode === 'schematic' ? '#0f172a' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Schematic network
                            </button>
                            <button
                                type="button"
                                onClick={() => setMapViewMode('gis')}
                                style={{
                                    border: 'none',
                                    background: mapViewMode === 'gis' ? '#ffffff' : 'transparent',
                                    color: mapViewMode === 'gis' ? '#0f172a' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Geographic GIS
                            </button>
                        </div>
                    </div>

                    <div className="fm-map-wrapper" style={{ minHeight: '560px', height: '100%' }}>
                        {mapViewMode === 'schematic' ? (
                            <SchematicMetroMap
                                highlightedRoute={highlightedRouteStations}
                                onStationClick={(st) => {
                                    if (!fromStation) {
                                        setFromStation(st.name);
                                    } else if (!toStation || toStation === fromStation) {
                                        setToStation(st.name);
                                    } else {
                                        setFromStation(st.name);
                                    }
                                }}
                                selectedStation={selectedStation?.name}
                            />
                        ) : (
                            <MapMetro
                                height="100%"
                                selectedLineId={selectedLine}
                                highlightedRoute={highlightedRouteStations}
                                onStationClick={(st, primaryLine, role) => {
                                    setSelectedStation(st);
                                    if (role === 'from') {
                                        setFromStation(st.name);
                                    } else if (role === 'to') {
                                        setToStation(st.name);
                                    } else {
                                        if (!fromStation) {
                                            setFromStation(st.name);
                                        } else if (!toStation || toStation === fromStation) {
                                            setToStation(st.name);
                                        } else {
                                            setFromStation(st.name);
                                        }
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FindMetro;
