import React, { useEffect, useState } from 'react';
import '../styles/TicketView.css';

function TicketView({ onNavigate }) {
    const [booking, setBooking] = useState(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailResult, setEmailResult] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('kmrl_latest_booking');
        if (raw) {
            try {
                setBooking(JSON.parse(raw));
            } catch (e) {
                setBooking(null);
            }
        }
    }, []);

    if (!booking) {
        return (
            <div className="ticket-view">
                <h2>No recent booking found</h2>
                <p>Please complete a booking first.</p>
                <button onClick={() => onNavigate('findmetro')}>Find Metro</button>
            </div>
        );
    }

    const ticketUrl = booking.ticketUrl && (booking.ticketUrl.startsWith('http') || booking.ticketUrl.startsWith('/'))
        ? (booking.ticketUrl.startsWith('http') ? booking.ticketUrl : `${window.location.origin}${booking.ticketUrl}`)
        : `${window.location.origin}/api/metro/bookings/${booking.bookingId}/ticket`;

    const handleDownload = async () => {
        try {
            const headers = {};
            // include Authorization header if present in localStorage
            try { const token = localStorage.getItem('kmrl_token'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch (e) { }
            const resp = await fetch(ticketUrl, { headers });
            if (!resp.ok) {
                // fallback to opening in new tab
                window.open(ticketUrl, '_blank');
                return;
            }
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const filename = `kmrl_ticket_${booking.bookingId}.pdf`;
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            // last-resort: open in new tab
            window.open(ticketUrl, '_blank');
        }
    };

    const handleEmail = async () => {
        const email = booking.email || (booking.user && booking.user.email) || prompt('Enter email to send ticket to:');
        if (!email) return;
        setSendingEmail(true);
        setEmailResult(null);
        try {
            // Call backend to request email send; backend may respond with ticketUrl when SMTP not configured
            const resp = await fetch('/api/metro/email-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.bookingId, email })
            });
            const data = await resp.json();
            if (resp.ok) {
                setEmailResult(data.message || 'Email requested');
                if (data.ticketUrl) {
                    setEmailResult((prev) => (prev ? prev + ' — ' : '') + `Ticket URL: ${data.ticketUrl}`);
                }
            } else {
                setEmailResult(data.message || 'Failed to send email');
            }
        } catch (err) {
            setEmailResult('Failed to send email');
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="ticket-view-container">
            <div className="ticket-app-header">
                <button className="icon-btn" onClick={() => onNavigate('home')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <h2 className="header-title">Ticket Details</h2>
                <button className="icon-btn" onClick={handleDownload}>
                    {/* Share/Download icon */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </button>
            </div>

            <div className="ticket-main-card">
                {/* Route Header */}
                <div className="route-header">
                    <div className="station-left">
                        <span className="station-name">{booking.fromStation}</span>
                        <div className="line-indicator">
                            <span className="line-text red">Red Line</span>
                            <div className="line-dot red"></div>
                            <div className="line-path red"></div>
                        </div>
                    </div>

                    <div className="train-center">
                        <svg className="train-icon" viewBox="0 0 24 24" fill="#15803d" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6C4 3.79086 5.79086 2 8 2H16C18.2091 2 20 3.79086 20 6V16C20 18.2091 18.2091 20 16 20H8C5.79086 20 4 18.2091 4 16V6Z" />
                            <path d="M8 22H16" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                            <path d="M6 10H18" stroke="white" strokeWidth="2" />
                            <circle cx="8" cy="16" r="1.5" fill="white" />
                            <circle cx="16" cy="16" r="1.5" fill="white" />
                        </svg>
                        <span className="way-text">One Way</span>
                    </div>

                    <div className="station-right">
                        <span className="station-name">{booking.toStation}</span>
                        <div className="line-indicator right">
                            <div className="line-path blue"></div>
                            <div className="line-dot blue"></div>
                            <span className="line-text blue">Blue Line</span>
                        </div>
                    </div>
                </div>

                <div className="ticket-details-section">
                    <h3 className="section-title">Ticket Details</h3>

                    <div className="details-grid">
                        <div className="detail-row">
                            <span className="detail-label">Passenger</span>
                            <span className="detail-value">{booking.passengerName || booking.user?.fullName || 'John Doe'}</span>
                        </div>
                        {booking.passengerPhone && (
                            <div className="detail-row">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">{booking.passengerPhone}</span>
                            </div>
                        )}
                        <div className="detail-row">
                            <span className="detail-label">Tickets</span>
                            <span className="detail-value">{String(booking.passengers || 1).padStart(2, '0')}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Issued on</span>
                            <span className="detail-value">{new Date(booking.date || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Ref ID</span>
                            <span className="detail-value">{booking.bookingId || '5459DE27'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Trip ID</span>
                            <span className="detail-value">T{Math.floor(1000000 + Math.random() * 9000000)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Train No.</span>
                            <span className="detail-value">KMR-{Math.floor(1 + Math.random() * 9)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ticket-qr-container">
                <p className="scan-instructions">Just Scan your ticket while boarding & Exit</p>
                <div className="qr-wrapper">
                    {/* Simulated realistic QR code pattern for the UI */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${booking.bookingId || 'KMRL-TICKET'}`} alt="QR Code" className="qr-image" />
                </div>

                <div className="validity-info">
                    <div className="validity-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                            <rect x="11" y="8" width="2" height="5" fill="white" />
                            <circle cx="12" cy="16" r="1.5" fill="white" />
                        </svg>
                    </div>
                    <span className="validity-text">
                        Valid Till {new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | {new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default TicketView;
