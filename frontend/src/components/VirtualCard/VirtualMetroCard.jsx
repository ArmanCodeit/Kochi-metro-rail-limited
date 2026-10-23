import React, { useState } from 'react';
import '../../styles/VirtualMetroCard.css';

const VirtualMetroCard = ({ card, loading, onRefresh, isAuthenticated, onRechargeClick }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(null);

    // Safely retrieve authenticated profile info from local storage as reliable fallback
    const storedUser = (() => {
        try {
            return JSON.parse(localStorage.getItem('kmrl_user'));
        } catch {
            return null;
        }
    })();

    const resolvedName = card?.cardHolderName || storedUser?.fullName || `${storedUser?.firstName || ''} ${storedUser?.lastName || ''}`.trim() || storedUser?.username;

    // Fallbacks if not logged in or loading
    const displayCardNumber = card?.cardNumber || '4180 5701 2345 6789';
    const displayHolder = (resolvedName || 'KMRL COMMUTER').toUpperCase();
    const displayBalance = typeof card?.balance === 'number' ? card.balance.toFixed(2) : '100.00';
    const displayExpiry = card?.expiryDate || '08/29';
    const displayCvv = card?.cvv || '824';

    const handleCopy = async (e) => {
        if (e) e.stopPropagation();
        const numberToCopy = card?.cardNumber || (isAuthenticated ? displayCardNumber : '');
        if (!numberToCopy) {
            setCopyFeedback({ type: 'error', message: 'No card number available to copy.' });
            return;
        }

        try {
            await navigator.clipboard.writeText(numberToCopy);
            setCopied(true);
            setCopyFeedback({ type: 'success', message: `Card number copied: ${numberToCopy}` });
            setTimeout(() => {
                setCopied(false);
                setCopyFeedback(null);
            }, 3000);
        } catch (err) {
            // Fallback for browsers with restricted clipboard permission
            try {
                const textarea = document.createElement('textarea');
                textarea.value = numberToCopy;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                setCopied(true);
                setCopyFeedback({ type: 'success', message: `Card number copied: ${numberToCopy}` });
                setTimeout(() => {
                    setCopied(false);
                    setCopyFeedback(null);
                }, 3000);
            } catch {
                setCopyFeedback({ type: 'error', message: 'Failed to copy card number.' });
            }
        }
    };

    return (
        <div className="virtual-card-wrapper">
            <div
                className={`virtual-metro-card ${isFlipped ? 'flipped' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
                title="Click card to flip"
            >
                {/* ── CARD FRONT ── */}
                <div className="card-face card-front">
                    {/* Top Branding Row */}
                    <div className="card-top-bar">
                        <div className="card-kmrl-brand">
                            <div className="card-kmrl-logo-icon">KMRL</div>
                            <div className="card-brand-titles">
                                <span className="card-brand-title">Kochi Metro</span>
                                <span className="card-brand-tagline">Connecting the unconnected</span>
                            </div>
                        </div>

                        <div className="card-top-right">
                            <div className="card-nfc-wave" title="Contactless Transit">
                                <div className="nfc-arc nfc-arc-1"></div>
                                <div className="nfc-arc nfc-arc-2"></div>
                                <div className="nfc-arc nfc-arc-3"></div>
                            </div>
                            <span className="card-kochi1-badge">KOCHI1</span>
                        </div>
                    </div>

                    {/* Chip & Live Balance Row */}
                    <div className="card-chip-row">
                        <div className="card-emv-chip" title="Smart Transit Chip"></div>
                        <div className="card-balance-pill">
                            <div className="card-balance-label">Available Balance</div>
                            <div className="card-balance-value">₹ {displayBalance}</div>
                        </div>
                    </div>

                    {/* 16-Digit Card Number */}
                    <div className="card-number-row">
                        <div className="card-number-text">
                            {displayCardNumber}
                        </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="card-bottom-row">
                        <div className="card-holder-info">
                            <span className="card-detail-label">Cardholder</span>
                            <span className="card-holder-name" title={displayHolder}>
                                {displayHolder}
                            </span>
                        </div>

                        <div className="card-valid-thru">
                            <span className="card-detail-label">VALID THRU</span>
                            <span className="card-valid-date">{displayExpiry}</span>
                        </div>

                        <div className="card-transit-badge">
                            <span className="transit-prepaid-tag">TRANSIT PREPAID</span>
                        </div>
                    </div>
                </div>

                {/* ── CARD BACK ── */}
                <div className="card-face card-back">
                    <div className="card-mag-stripe"></div>
                    <div className="card-back-content">
                        <div className="card-cvv-row">
                            <div className="card-sig-panel"></div>
                            <div className="card-cvv-box">CVV: {displayCvv}</div>
                        </div>

                        <div className="card-back-disclaimer">
                            This virtual smart card is the property of Kochi Metro Rail Limited. Authorized for metro transit, feeder buses, and simulated journey fares. Non-transferable.
                        </div>

                        <div className="card-back-footer">
                            <span>24x7 Helpline: 1800-425-0370</span>
                            <span>kochimetro.org</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar Below Card */}
            <div className="card-action-bar">
                <button
                    type="button"
                    className="card-flip-btn"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    Flip Card
                </button>

                {isAuthenticated && (
                    <button
                        type="button"
                        className="card-copy-btn"
                        onClick={handleCopy}
                        title="Copy card number to clipboard"
                    >
                        {copied ? 'Card Number Copied!' : 'Copy Card Number'}
                    </button>
                )}

                {isAuthenticated && (
                    <button
                        type="button"
                        className="card-refresh-btn"
                        onClick={onRefresh}
                        disabled={loading}
                        title="Refresh authoritative balance from server"
                    >
                        {loading ? 'Refreshing...' : 'Refresh Balance'}
                    </button>
                )}
            </div>

            {copyFeedback && (
                <div
                    style={{
                        marginTop: '0.6rem',
                        padding: '0.45rem 0.8rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        background: copyFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                        color: copyFeedback.type === 'success' ? '#047857' : '#b91c1c',
                        border: `1px solid ${copyFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}
                >
                    {copyFeedback.message}
                </div>
            )}

            {!isAuthenticated && (
                <div className="guest-card-banner">
                    🔒 You are viewing a preview. Sign in to access your personal virtual card & live balance.
                </div>
            )}
        </div>
    );
};

export default VirtualMetroCard;
