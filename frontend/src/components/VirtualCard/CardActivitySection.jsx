import React, { useState, useEffect } from 'react';
import '../../styles/CardActivitySection.css';

const DEFAULT_STATIONS = [
    'Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Muttom',
    'Kalamassery', 'Cochin University', 'Pathadipalam', 'Edappally', 'Changampuzha Park',
    'Palarivattom', 'JLN Stadium', 'Kaloor', 'Lissie', 'M.G. Road',
    'Maharaja’s College', 'Ernakulam South', 'Kadavanthra', 'Elamkulam', 'Vyttila',
    'Thykoodam', 'Petta', 'Vadakkekotta', 'SN Junction', 'Tripunithura',
    'Palarivattom Junction', 'Palarivattom Bypass', 'Chembumukku', 'Vazhakkala',
    'Padamughal', 'Kakkanad Junction', 'Cochin SEZ', 'Chittethukara', 'KINFRA Park', 'Infopark',
    'Panampilly Nagar', 'South Railway Station', 'High Court', 'Bolgatty', 'Fort Kochi Gate'
];

const CardActivitySection = ({ card, token, onCardUpdated, onOpenRecharge, isAuthenticated, onNavigate }) => {
    // Station and route planning state
    const [allStations, setAllStations] = useState(DEFAULT_STATIONS);
    const [fromStation, setFromStation] = useState('Aluva');
    const [toStation, setToStation] = useState('Infopark');

    const [fromSearch, setFromSearch] = useState('Aluva');
    const [toSearch, setToSearch] = useState('Infopark');
    const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
    const [toDropdownOpen, setToDropdownOpen] = useState(false);

    const [routes, setRoutes] = useState([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [routeError, setRouteError] = useState(null);

    // Trip actions state
    const [simulating, setSimulating] = useState(false);
    const [tripMessage, setTripMessage] = useState(null);
    const [tripError, setTripError] = useState(null);

    // Transaction history
    const [transactions, setTransactions] = useState([]);
    const [loadingTxns, setLoadingTxns] = useState(false);
    const [filter, setFilter] = useState('all');

    // Load full station network
    useEffect(() => {
        fetch('/api/metro/network')
            .then(res => res.json())
            .then(data => {
                if (data.stations && Array.isArray(data.stations)) {
                    setAllStations(data.stations.map(s => s.name));
                }
            })
            .catch(() => {});
    }, []);

    // Calculate routes whenever fromStation or toStation change
    useEffect(() => {
        if (!fromStation || !toStation) {
            setRoutes([]);
            return;
        }

        if (fromStation.toLowerCase() === toStation.toLowerCase()) {
            setRouteError('Departing and Arriving stations cannot be the same.');
            setRoutes([]);
            return;
        }

        setLoadingRoutes(true);
        setRouteError(null);

        fetch('/api/metro/plan-routes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fromStation, toStation })
        })
            .then(res => res.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    setRoutes(data.routes);
                    setSelectedRouteIndex(0);
                    setRouteError(null);
                } else {
                    setRoutes([]);
                    setRouteError(data.message || 'No connected metro route found.');
                }
            })
            .catch(() => {
                setRouteError('Failed to fetch routes from server.');
                setRoutes([]);
            })
            .finally(() => setLoadingRoutes(false));
    }, [fromStation, toStation]);

    // Load transaction history
    const fetchTransactions = () => {
        if (!token || !isAuthenticated) return;
        setLoadingTxns(true);
        fetch('/api/card/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTransactions(data);
                }
            })
            .catch(err => console.error('Failed to load card transactions:', err))
            .finally(() => setLoadingTxns(false));
    };

    useEffect(() => {
        fetchTransactions();
    }, [token, isAuthenticated]);

    const activeRoute = routes[selectedRouteIndex] || routes[0];

    // Handle journey simulation (deducting from virtual card)
    const handleSimulateJourney = async () => {
        if (!isAuthenticated) {
            setTripError('Please sign in to your Kochi Metro account to travel with your virtual card.');
            return;
        }

        if (!activeRoute) {
            setTripError('Please select a valid route first.');
            return;
        }

        setSimulating(true);
        setTripMessage(null);
        setTripError(null);

        try {
            const response = await fetch('/api/card/simulate-journey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromStation,
                    toStation,
                    routeId: activeRoute.routeId
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setTripMessage(`🎉 Journey recorded! Traveled from ${fromStation} to ${toStation}. Fare of ₹${data.fare} deducted.`);
                if (typeof onCardUpdated === 'function') {
                    onCardUpdated(data.balance);
                }
                fetchTransactions();
            } else {
                setTripError(data.message || 'Unable to complete journey.');
            }
        } catch (err) {
            setTripError('Error contacting metro server.');
        } finally {
            setSimulating(false);
        }
    };

    // Handle "Book Digital QR Ticket" action: saves selected route and navigates to ticketing
    const handleBookQRTicket = () => {
        if (!activeRoute) return;
        const selectedJourney = {
            fromStation,
            toStation,
            route: activeRoute,
            fare: activeRoute.fare,
            passengers: 1,
            date: new Date().toISOString()
        };
        localStorage.setItem('kmrl_planned_trip', JSON.stringify(selectedJourney));

        if (typeof onNavigate === 'function') {
            onNavigate('findmetro');
        } else {
            window.location.assign('/findmetro');
        }
    };

    const filteredFromStations = allStations.filter(s =>
        s.toLowerCase().includes(fromSearch.toLowerCase())
    );

    const filteredToStations = allStations.filter(s =>
        s.toLowerCase().includes(toSearch.toLowerCase())
    );

    const filteredTxns = transactions.filter(t => {
        if (filter === 'recharge') return t.type === 'recharge';
        if (filter === 'trip') return t.type === 'fare_deduction';
        return true;
    });

    return (
        <section className="card-activity-container">
            <div className="activity-grid">
                {/* ── LEFT PANEL: INTELLIGENT MULTI-LINE ROUTE PLANNER & SIMULATOR ── */}
                <div className="activity-card-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">
                            🚇 Intelligent Route & Journey Planner
                        </h3>
                        <span className="panel-badge">Multi-Line Network</span>
                    </div>

                    <div className="simulator-form">
                        {/* Departing Station with Search Autocomplete */}
                        <div className="station-input-group" style={{ position: 'relative' }}>
                            <label className="input-label">Departing Station</label>
                            <input
                                type="text"
                                className="station-select"
                                value={fromSearch}
                                onChange={(e) => {
                                    setFromSearch(e.target.value);
                                    setFromDropdownOpen(true);
                                }}
                                onFocus={() => setFromDropdownOpen(true)}
                                placeholder="Type or select departure station..."
                            />
                            {fromDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    background: '#ffffff',
                                    border: '1.5px solid #059db2',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                                    zIndex: 50,
                                    marginTop: '4px'
                                }}>
                                    {filteredFromStations.length === 0 ? (
                                        <div style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>No stations match</div>
                                    ) : (
                                        filteredFromStations.map(st => (
                                            <div
                                                key={st}
                                                style={{
                                                    padding: '0.6rem 0.9rem',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    color: '#1e293b'
                                                }}
                                                onMouseDown={() => {
                                                    setFromStation(st);
                                                    setFromSearch(st);
                                                    setFromDropdownOpen(false);
                                                }}
                                            >
                                                {st}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Arriving Station with Search Autocomplete */}
                        <div className="station-input-group" style={{ position: 'relative' }}>
                            <label className="input-label">Arriving Station</label>
                            <input
                                type="text"
                                className="station-select"
                                value={toSearch}
                                onChange={(e) => {
                                    setToSearch(e.target.value);
                                    setToDropdownOpen(true);
                                }}
                                onFocus={() => setToDropdownOpen(true)}
                                placeholder="Type or select arrival station..."
                            />
                            {toDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    background: '#ffffff',
                                    border: '1.5px solid #059db2',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                                    zIndex: 50,
                                    marginTop: '4px'
                                }}>
                                    {filteredToStations.length === 0 ? (
                                        <div style={{ padding: '0.6rem', fontSize: '0.8rem', color: '#94a3b8' }}>No stations match</div>
                                    ) : (
                                        filteredToStations.map(st => (
                                            <div
                                                key={st}
                                                style={{
                                                    padding: '0.6rem 0.9rem',
                                                    fontSize: '0.88rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    color: '#1e293b'
                                                }}
                                                onMouseDown={() => {
                                                    setToStation(st);
                                                    setToSearch(st);
                                                    setToDropdownOpen(false);
                                                }}
                                            >
                                                {st}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Alternative Route Cards when multiple routes exist */}
                        {routes.length > 1 && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                                {routes.map((r, idx) => (
                                    <button
                                        key={r.routeId}
                                        type="button"
                                        onClick={() => setSelectedRouteIndex(idx)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            border: selectedRouteIndex === idx ? '2px solid #059db2' : '1px solid #cbd5e1',
                                            background: selectedRouteIndex === idx ? '#ecfeff' : '#f8fafc',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: selectedRouteIndex === idx ? '#059db2' : '#64748b' }}>
                                            {r.isRecommended ? '⭐ RECOMMENDED' : `ALTERNATIVE ${idx + 1}`}
                                        </div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                                            {r.transfers === 0 ? 'Direct' : `${r.transfers} Transfer`} • {r.estimatedMinutes}m
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Detailed Route Breakdown */}
                        {loadingRoutes && (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                ⏳ Calculating optimal multi-line route...
                            </div>
                        )}

                        {routeError && (
                            <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>
                                ⚠️ {routeError}
                            </div>
                        )}

                        {activeRoute && !loadingRoutes && (
                            <div className="journey-route-preview" style={{ flexDirection: 'column', gap: '0.8rem', alignItems: 'stretch' }}>
                                {/* Route Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase' }}>
                                            {activeRoute.isRecommended ? '⭐ Recommended Route' : 'Journey Route'}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                                            {activeRoute.transfers === 0 ? 'Direct Journey (No Transfers)' : `${activeRoute.transfers} Line Transfer`}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Fare</div>
                                        <div className="preview-fare-val">₹ {activeRoute.fare}</div>
                                    </div>
                                </div>

                                {/* Line Badges & Transfers */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    {activeRoute.lines.map((l, i) => (
                                        <React.Fragment key={l.id}>
                                            <span style={{
                                                background: l.color,
                                                color: '#ffffff',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800
                                            }}>
                                                {l.name}
                                            </span>
                                            {i < activeRoute.lines.length - 1 && (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
                                                    ➔ Switch at {activeRoute.interchanges[i]} ➔
                                                </span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* Step by step route narrative */}
                                <div style={{ background: '#ffffff', padding: '0.75rem 0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                                    <div><strong>Board:</strong> {fromStation}</div>
                                    {activeRoute.interchanges && activeRoute.interchanges.length > 0 && (
                                        <div style={{ color: '#0369a1', fontWeight: 700, margin: '2px 0' }}>
                                            <strong>Interchange:</strong> Transfer lines at {activeRoute.interchanges.join(', ')}
                                        </div>
                                    )}
                                    <div><strong>Exit:</strong> {toStation}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '4px' }}>
                                        {activeRoute.totalStops} stops • Est. travel duration: ~{activeRoute.estimatedMinutes} mins
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts */}
                        {tripMessage && (
                            <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                {tripMessage}
                            </div>
                        )}

                        {tripError && (
                            <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                ⚠️ {tripError}
                                {card && activeRoute && card.balance < activeRoute.fare && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={onOpenRecharge}
                                            style={{ background: '#059db2', color: '#fff', border: 'none', padding: '0.35rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            + Recharge Card Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dual Action Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <button
                                type="button"
                                className="btn-tap-ride"
                                onClick={handleSimulateJourney}
                                disabled={simulating || !activeRoute}
                            >
                                {simulating ? 'Validating...' : `Tap Card (₹${activeRoute?.fare || 0})`}
                            </button>

                            <button
                                type="button"
                                onClick={handleBookQRTicket}
                                disabled={!activeRoute}
                                style={{
                                    background: '#0f172a',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.9rem',
                                    borderRadius: '10px',
                                    fontSize: '0.95rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.4rem',
                                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)'
                                }}
                            >
                                🎟️ Book QR Ticket
                            </button>
                        </div>

                        <p className="simulation-disclaimer">
                            Multi-line routing engine with transfer calculation. Select "Tap Card" for stored-value ledger or "Book QR Ticket" for 5-hour digital QR pass.
                        </p>
                    </div>
                </div>

                {/* ── RIGHT PANEL: TRANSACTION LEDGER ── */}
                <div className="activity-card-panel">
                    <div className="panel-header">
                        <h3 className="panel-title">
                            📊 Card Transaction Ledger
                        </h3>
                        <button
                            type="button"
                            onClick={fetchTransactions}
                            style={{ background: 'none', border: 'none', color: '#059db2', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            {loadingTxns ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {/* Filter buttons */}
                    <div className="txn-filter-bar">
                        <button
                            type="button"
                            className={`txn-filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({transactions.length})
                        </button>
                        <button
                            type="button"
                            className={`txn-filter-btn ${filter === 'recharge' ? 'active' : ''}`}
                            onClick={() => setFilter('recharge')}
                        >
                            Recharges ({transactions.filter(t => t.type === 'recharge').length})
                        </button>
                        <button
                            type="button"
                            className={`txn-filter-btn ${filter === 'trip' ? 'active' : ''}`}
                            onClick={() => setFilter('trip')}
                        >
                            Trips ({transactions.filter(t => t.type === 'fare_deduction').length})
                        </button>
                    </div>

                    {/* Transaction list */}
                    <div className="txn-list-scroll">
                        {filteredTxns.length === 0 ? (
                            <div className="txn-empty-state">
                                <div className="txn-empty-icon">💳</div>
                                <div style={{ fontWeight: 700, color: '#475569' }}>No transactions recorded yet</div>
                                <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
                                    Your wallet recharges and travel fare deductions will appear here in real-time.
                                </p>
                            </div>
                        ) : (
                            filteredTxns.map((txn) => {
                                const isRecharge = txn.type === 'recharge';
                                const formattedDate = new Date(txn.createdAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div key={txn.transactionId || txn._id} className="txn-item-row">
                                        <div className="txn-left-side">
                                            <div className={`txn-type-icon ${txn.type}`}>
                                                {isRecharge ? '⚡' : '🚇'}
                                            </div>
                                            <div className="txn-info-main">
                                                <span className="txn-description">{txn.description}</span>
                                                <span className="txn-meta">
                                                    {formattedDate} {txn.razorpayPaymentId ? `• Ref: ${txn.razorpayPaymentId}` : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="txn-right-side">
                                            <span className={`txn-amount ${isRecharge ? 'credit' : 'debit'}`}>
                                                {isRecharge ? `+ ₹${txn.amount.toFixed(2)}` : `- ₹${txn.amount.toFixed(2)}`}
                                            </span>
                                            <span className={`txn-status-badge ${txn.paymentStatus}`}>
                                                {txn.paymentStatus}
                                            </span>
                                            {typeof txn.balanceAfter === 'number' && (
                                                <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                                                    Bal: ₹{txn.balanceAfter.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CardActivitySection;
