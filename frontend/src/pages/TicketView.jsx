import React, { useEffect, useState } from 'react';
import '../styles/TicketView.css';

function TicketView({ onNavigate }) {
    const [booking, setBooking] = useState(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailResult, setEmailResult] = useState(null);
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [gateStatus, setGateStatus] = useState(null);
    const [validatingGate, setValidatingGate] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem('kmrl_latest_booking');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setBooking(parsed);

                // Fetch latest server status for 5-hour validity recalculation
                const id = parsed.ticketId || parsed.bookingId;
                if (id) {
                    fetch(`/api/metro/tickets/${encodeURIComponent(id)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.ticket) {
                                setBooking(prev => ({ ...prev, ...data.ticket }));
                                setRemainingSeconds(data.remainingSeconds);
                            }
                        })
                        .catch(() => {});
                }
            } catch (e) {
                setBooking(null);
            }
        }
    }, []);

    // Live countdown timer for the strictly enforced 5-hour validity
    useEffect(() => {
        if (!booking?.expiresAt) return;

        const updateTimer = () => {
            const exp = new Date(booking.expiresAt).getTime();
            const now = Date.now();
            const diff = Math.max(0, Math.floor((exp - now) / 1000));
            setRemainingSeconds(diff);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [booking?.expiresAt]);

    const formatCountdown = (secs) => {
        if (secs === null || secs === undefined) return 'Calculating...';
        if (secs <= 0) return '00h 00m 00s (EXPIRED)';
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };

    const handleCopyTicketId = (id) => {
        if (!id) return;
        navigator.clipboard?.writeText(id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    if (!booking) {
        return (
            <div className="ticket-view-wrapper">
                <div className="ticket-empty-card">
                    <div className="empty-icon-circle">
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#059db2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                            <line x1="7" y1="15" x2="7.01" y2="15" />
                            <line x1="11" y1="15" x2="13" y2="15" />
                        </svg>
                    </div>
                    <h2 className="empty-title">No Active Ticket Found</h2>
                    <p className="empty-desc">
                        You do not currently have a recent journey booking loaded on this device. Plan a route and book a ticket to generate your digital turnstile QR code.
                    </p>
                    <div className="empty-actions">
                        <button
                            type="button"
                            className="btn-primary-action"
                            onClick={() => onNavigate ? onNavigate('findmetro') : window.location.assign('/findmetro')}
                        >
                            Book a Metro Ticket
                        </button>
                        <button
                            type="button"
                            className="btn-secondary-action"
                            onClick={() => onNavigate ? onNavigate('home') : window.location.assign('/')}
                        >
                            Return to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const ticketId = booking.ticketId || booking.bookingId || 'KMRL-TICKET';
    const isExpired = remainingSeconds !== null && remainingSeconds <= 0;
    const isUsed = booking.ticketStatus === 'used';
    const ticketUrl = `${window.location.origin}/verify-ticket/${ticketId}`;

    const handleDownload = () => {
        window.print();
    };

    const handleEmail = async () => {
        const email = booking.email || prompt('Enter email address to send ticket to:');
        if (!email) return;
        setSendingEmail(true);
        setEmailResult(null);
        try {
            const resp = await fetch('/api/metro/email-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: ticketId, email })
            });
            const data = await resp.json();
            setEmailResult({ success: resp.ok, text: data.message || 'Ticket dispatched to your email.' });
        } catch {
            setEmailResult({ success: false, text: 'Failed to send email. Please check connection.' });
        } finally {
            setSendingEmail(false);
        }
    };

    // Simulate Gate AFC Verification
    const handleSimulateGateScan = async () => {
        setValidatingGate(true);
        setGateStatus(null);
        try {
            const res = await fetch('/api/metro/tickets/verify-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId })
            });
            const data = await res.json();
            setGateStatus(data);
            if (data.valid) {
                setBooking(prev => ({ ...prev, ticketStatus: 'used' }));
            }
        } catch {
            setGateStatus({ valid: false, message: 'Could not connect to entry gate.' });
        } finally {
            setValidatingGate(false);
        }
    };

    // Route lines breakdown
    const routeData = booking.route || {};
    const routeLines = routeData.lines || [{ name: 'Blue Line', color: '#0284c7' }];
    const interchanges = routeData.interchanges || [];

    const issuedDate = booking.issuedAt ? new Date(booking.issuedAt) : (booking.createdAt ? new Date(booking.createdAt) : new Date());
    const expiryDate = booking.expiresAt ? new Date(booking.expiresAt) : new Date(issuedDate.getTime() + 5 * 60 * 60 * 1000);

    return (
        <div className="ticket-view-wrapper">
            {/* Top Navigation Bar */}
            <header className="ticket-top-nav">
                <button
                    type="button"
                    className="nav-icon-btn"
                    onClick={() => onNavigate ? onNavigate('findmetro') : window.location.assign('/findmetro')}
                    title="Back to Journey Planner"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>Journey Planner</span>
                </button>
                <div className="nav-actions">
                    <button
                        type="button"
                        className="nav-action-btn"
                        onClick={handleDownload}
                        title="Print or Save PDF"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                        </svg>
                        <span>Print</span>
                    </button>
                </div>
            </header>

            {/* Ticket Card Container */}
            <div className="ticket-card-surface">
                {/* Brand Bar */}
                <div className="ticket-brand-bar">
                    <div className="brand-left">
                        <div className="brand-logo-badge">KMRL</div>
                        <div>
                            <div className="brand-title">Kochi Metro Rail Limited</div>
                            <div className="brand-subtitle">Digital AFC Transit Ticket</div>
                        </div>
                    </div>
                    <div className="brand-status-chip">
                        {isUsed ? (
                            <span className="status-badge status-used">Used / Boarded</span>
                        ) : isExpired ? (
                            <span className="status-badge status-expired">Expired</span>
                        ) : (
                            <span className="status-badge status-active">
                                <span className="status-dot"></span>
                                Active
                            </span>
                        )}
                    </div>
                </div>

                {/* 5-Hour Validity Countdown Banner */}
                <div className={`validity-banner ${isUsed ? 'banner-used' : isExpired ? 'banner-expired' : 'banner-active'}`}>
                    <div className="validity-banner-left">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="validity-label">
                            {isUsed ? 'Journey Status:' : isExpired ? 'Validity Status:' : 'Remaining 5h Window:'}
                        </span>
                    </div>
                    <span className="validity-time-val">
                        {isUsed ? 'Validated at Turnstile' : formatCountdown(remainingSeconds)}
                    </span>
                </div>

                {/* Journey Stations Block */}
                <div className="journey-route-block">
                    <div className="station-node">
                        <span className="station-code-tag">ORIGIN</span>
                        <h3 className="station-name-text" title={booking.fromStation}>
                            {booking.fromStation}
                        </h3>
                        <div className="station-line-chip" style={{ color: routeLines[0]?.color || '#0284c7' }}>
                            <span className="line-pill-dot" style={{ background: routeLines[0]?.color || '#0284c7' }}></span>
                            {routeLines[0]?.name || 'Blue Line'}
                        </div>
                    </div>

                    <div className="journey-connector">
                        <div className="connector-train-badge">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059db2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="4" y="3" width="16" height="16" rx="2" />
                                <path d="M4 11h16" />
                                <path d="M12 3v8" />
                                <path d="m8 19-2 3" />
                                <path d="m16 19 2 3" />
                                <circle cx="8" cy="15" r="1" fill="#059db2" />
                                <circle cx="16" cy="15" r="1" fill="#059db2" />
                            </svg>
                        </div>
                        <div className="connector-line">
                            <span className="connector-arrow"></span>
                        </div>
                        <span className="connector-transfer-text">
                            {interchanges.length > 0 ? `${interchanges.length} Transfer` : 'Direct Route'}
                        </span>
                    </div>

                    <div className="station-node align-right">
                        <span className="station-code-tag">DESTINATION</span>
                        <h3 className="station-name-text" title={booking.toStation}>
                            {booking.toStation}
                        </h3>
                        <div className="station-line-chip align-right" style={{ color: routeLines[routeLines.length - 1]?.color || '#0284c7' }}>
                            <span className="line-pill-dot" style={{ background: routeLines[routeLines.length - 1]?.color || '#0284c7' }}></span>
                            {routeLines[routeLines.length - 1]?.name || 'Blue Line'}
                        </div>
                    </div>
                </div>

                {/* Interchange Note if Applicable */}
                {interchanges.length > 0 && (
                    <div className="interchange-highlight-bar">
                        <span className="interchange-icon">🔄</span>
                        <span>Transfer interchange at <strong>{interchanges.join(', ')}</strong></span>
                    </div>
                )}

                {/* Perforated Divider */}
                <div className="ticket-perforated-divider">
                    <span className="notch-left"></span>
                    <div className="dashed-line"></div>
                    <span className="notch-right"></span>
                </div>

                {/* Scannable Turnstile QR Code */}
                <div className="ticket-qr-zone">
                    <p className="qr-scan-instruction">
                        Present this QR code facing the scanner window at entry/exit turnstiles
                    </p>

                    <div className={`qr-frame-box ${isExpired ? 'qr-box-expired' : ''}`}>
                        <div className="scanner-target-corner tl"></div>
                        <div className="scanner-target-corner tr"></div>
                        <div className="scanner-target-corner bl"></div>
                        <div className="scanner-target-corner br"></div>
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticketUrl)}`}
                            alt="Turnstile QR Code"
                            className="qr-matrix-img"
                        />
                    </div>

                    <div className="ticket-id-strip">
                        <span className="ticket-id-label">Ticket ID:</span>
                        <code className="ticket-id-code">{ticketId}</code>
                        <button
                            type="button"
                            className="copy-id-btn"
                            onClick={() => handleCopyTicketId(ticketId)}
                            title="Copy Ticket ID"
                        >
                            {copiedId ? '✓ Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Authoritative Details Grid */}
                <div className="ticket-details-grid">
                    <div className="detail-item">
                        <span className="detail-item-label">Passenger Name</span>
                        <span className="detail-item-value">{booking.passengerName || 'Metro Passenger'}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-item-label">Fare Paid</span>
                        <span className="detail-item-value fare-value">₹{booking.fare}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-item-label">Passengers</span>
                        <span className="detail-item-value">{String(booking.passengers || 1).padStart(2, '0')} Person(s)</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-item-label">Payment Mode</span>
                        <span className="detail-item-value">{booking.paymentMethod === 'virtual_card' ? 'Virtual Metro Card' : (booking.method || 'Razorpay Online')}</span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-item-label">Issued At</span>
                        <span className="detail-item-value">
                            {issuedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {issuedDate.toLocaleDateString('en-GB')}
                        </span>
                    </div>

                    <div className="detail-item">
                        <span className="detail-item-label">Valid Until</span>
                        <span className="detail-item-value" style={{ color: isExpired ? '#ef4444' : '#0f172a' }}>
                            {expiryDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {expiryDate.toLocaleDateString('en-GB')}
                        </span>
                    </div>
                </div>

                {/* Gate Interaction & Actions */}
                <div className="ticket-actions-container">
                    <button
                        type="button"
                        className="btn-turnstile-scan"
                        onClick={handleSimulateGateScan}
                        disabled={validatingGate || isExpired || isUsed}
                    >
                        {validatingGate ? (
                            <>
                                <span className="scan-spinner"></span>
                                <span>Scanning Gate Turnstile...</span>
                            </>
                        ) : isUsed ? (
                            <span>✓ Turnstile Gate Validated (Entry Complete)</span>
                        ) : isExpired ? (
                            <span>⛔ Ticket Expired (Cannot Scan)</span>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M2 12h20" />
                                </svg>
                                <span>Simulate Entry Gate QR Scan</span>
                            </>
                        )}
                    </button>

                    {gateStatus && (
                        <div className={`gate-feedback-panel ${gateStatus.valid ? 'gate-success' : 'gate-rejected'}`}>
                            <div className="gate-feedback-header">
                                {gateStatus.valid ? '✅ GATE OPENED: Turnstile Unlocked' : '⛔ GATE REJECTED'}
                            </div>
                            <div className="gate-feedback-desc">
                                {gateStatus.message || (gateStatus.valid ? 'Ticket verified. Please proceed through the turnstile.' : 'Ticket could not be verified.')}
                            </div>
                        </div>
                    )}

                    <div className="secondary-action-row">
                        <button
                            type="button"
                            className="btn-secondary-tool"
                            onClick={handleEmail}
                            disabled={sendingEmail}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            <span>{sendingEmail ? 'Sending...' : 'Email Ticket'}</span>
                        </button>

                        <button
                            type="button"
                            className="btn-secondary-tool"
                            onClick={() => onNavigate ? onNavigate('findmetro') : window.location.assign('/findmetro')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                            <span>Book Another</span>
                        </button>
                    </div>

                    {emailResult && (
                        <div className={`email-feedback-chip ${emailResult.success ? 'email-success' : 'email-error'}`}>
                            {emailResult.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TicketView;
