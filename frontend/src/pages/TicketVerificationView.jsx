import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TicketVerificationView = ({ onNavigate }) => {
    const { ticketId: paramId } = useParams();
    const navigate = useNavigate();

    const [ticketIdInput, setTicketIdInput] = useState(paramId || '');
    const [ticketData, setTicketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);

    const performVerification = async (idToVerify) => {
        if (!idToVerify) return;
        setLoading(true);
        setError(null);
        setScanResult(null);

        try {
            // First fetch the ticket details to show route & 5-hr validity status
            const fetchRes = await fetch(`/api/metro/tickets/${encodeURIComponent(idToVerify)}`);
            const data = await fetchRes.json();

            if (!fetchRes.ok || !data.ticket) {
                setError(data.message || 'Ticket not found in Kochi Metro records.');
                setTicketData(null);
                setLoading(false);
                return;
            }

            setTicketData(data);

            // Now perform gate scan validation
            const scanRes = await fetch('/api/metro/tickets/verify-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: idToVerify })
            });

            const scanData = await scanRes.json();
            setScanResult(scanData);

        } catch (err) {
            setError('Error contacting ticket validation gateway.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (paramId) {
            performVerification(paramId);
        }
    }, [paramId]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (ticketIdInput.trim()) {
            performVerification(ticketIdInput.trim());
        }
    };

    const formatRemaining = (seconds) => {
        if (!seconds || seconds <= 0) return '00h 00m 00s (Expired)';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    };

    return (
        <div style={{
            maxWidth: '680px',
            margin: '3rem auto',
            padding: '2rem 1.5rem',
            fontFamily: "'Urbanist', sans-serif",
            color: '#1e293b'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: '#e0f2fe',
                    padding: '0.4rem 0.9rem',
                    borderRadius: '20px',
                    color: '#0284c7',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    marginBottom: '0.8rem'
                }}>
                    <span>🛡️ KMRL Gate AFC Terminal</span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                    Digital QR Ticket Verification
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                    Official gate scanner & 5-hour validity validator for Kochi Metro Rail
                </p>
            </div>

            {/* Input form */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem' }}>
                <input
                    type="text"
                    value={ticketIdInput}
                    onChange={(e) => setTicketIdInput(e.target.value)}
                    placeholder="Enter Ticket ID (e.g. KMRL-XXXX-XXXX) or Scan QR..."
                    style={{
                        flex: '1 1 240px',
                        minWidth: 0,
                        padding: '0.8rem 1rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        outline: 'none'
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !ticketIdInput.trim()}
                    style={{
                        flex: '1 1 auto',
                        background: '#059db2',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {loading ? 'Scanning...' : 'Verify Gate Scan'}
                </button>
            </form>

            {/* Verification Result Card */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                    <div>Querying KMRL Central Ticket Ledger...</div>
                </div>
            )}

            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    color: '#991b1b',
                    fontWeight: 700
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❌</div>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>Validation Rejected</div>
                    <div style={{ fontSize: '0.9rem', color: '#b91c1c' }}>{error}</div>
                </div>
            )}

            {scanResult && ticketData?.ticket && (
                <div style={{
                    background: scanResult.valid ? '#f0fdf4' : '#fef2f2',
                    border: `2px solid ${scanResult.valid ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.3rem' }}>
                            {scanResult.valid ? '✅' : '⛔'}
                        </div>
                        <h2 style={{
                            fontSize: '1.6rem',
                            fontWeight: 900,
                            color: scanResult.valid ? '#15803d' : '#b91c1c',
                            margin: 0
                        }}>
                            {scanResult.reason === 'ACCESS_GRANTED' ? 'ENTRY AUTHORIZED' : 'GATE ACCESS DENIED'}
                        </h2>
                        <p style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: scanResult.valid ? '#166534' : '#991b1b',
                            marginTop: '0.4rem'
                        }}>
                            {scanResult.message}
                        </p>
                    </div>

                    {/* Ticket Metadata Breakdown */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '1.2rem',
                        border: '1px solid #e2e8f0',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.8rem',
                        fontSize: '0.85rem'
                    }}>
                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Ticket ID</span>
                            <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{ticketData.ticket.ticketId}</strong>
                        </div>

                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Passenger</span>
                            <strong>{ticketData.ticket.passengerName}</strong>
                        </div>

                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Origin ➔ Destination</span>
                            <strong>{ticketData.ticket.fromStation} ➔ {ticketData.ticket.toStation}</strong>
                        </div>

                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Fare Paid</span>
                            <strong style={{ color: '#059db2' }}>₹ {ticketData.ticket.fare} ({ticketData.ticket.paymentMethod})</strong>
                        </div>

                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Issued At</span>
                            <span>{new Date(ticketData.ticket.issuedAt).toLocaleString('en-IN')}</span>
                        </div>

                        <div>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Expires At (Strict 5h)</span>
                            <span style={{ color: ticketData.isExpired ? '#ef4444' : '#0f172a', fontWeight: 700 }}>
                                {new Date(ticketData.ticket.expiresAt).toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem' }}>
                            <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Remaining Validity</span>
                            <strong style={{ color: ticketData.isExpired ? '#ef4444' : '#059db2' }}>
                                {formatRemaining(ticketData.remainingSeconds)}
                            </strong>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={() => onNavigate ? onNavigate('ticket') : navigate('/ticket')}
                            style={{
                                background: '#0f172a',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
                            Back to My Ticket
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketVerificationView;
