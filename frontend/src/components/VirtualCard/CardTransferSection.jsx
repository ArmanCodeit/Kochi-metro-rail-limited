import React, { useState } from 'react';

const formatCardInput = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const maskCardNumber = (cardStr) => {
    if (!cardStr) return '•••• •••• •••• ••••';
    const clean = cardStr.replace(/\s/g, '');
    if (clean.length === 16) {
        return `${clean.slice(0, 4)} •••• •••• ${clean.slice(12)}`;
    }
    return `•••• •••• •••• ${clean.slice(-4)}`;
};

const CardTransferSection = ({ card, token, isAuthenticated, onSuccess, onNavigate }) => {
    const [receiverCardNumber, setReceiverCardNumber] = useState('');
    const [transferAmount, setTransferAmount] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [verifiedReceiver, setVerifiedReceiver] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');

    // Review Modal / Confirmation state
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

    // Final result state
    const [transferResult, setTransferResult] = useState(null);
    const [transferError, setTransferError] = useState('');

    const senderBalance = typeof card?.balance === 'number' ? card.balance : 0;
    const numericAmount = Number(transferAmount);

    const handleReceiverChange = (e) => {
        const formatted = formatCardInput(e.target.value);
        setReceiverCardNumber(formatted);
        setVerifiedReceiver(null);
        setVerifyError('');
        setTransferResult(null);
        setTransferError('');
    };

    // 1. Verify Receiver Card
    const handleVerifyReceiver = async () => {
        const cleanDigits = receiverCardNumber.replace(/\s/g, '');
        if (cleanDigits.length !== 16) {
            setVerifyError('Please enter a 16-digit receiver metro card number.');
            setVerifiedReceiver(null);
            return;
        }

        if (!isAuthenticated) {
            setVerifyError('Please sign in to verify receiver card.');
            return;
        }

        // Self-transfer check in client
        if (card && card.cardNumber && cleanDigits === card.cardNumber.replace(/\s/g, '')) {
            setVerifyError('Self-transfer prohibited: Receiver card cannot be your own metro card.');
            setVerifiedReceiver(null);
            return;
        }

        setIsVerifying(true);
        setVerifyError('');
        setTransferResult(null);

        try {
            const res = await fetch('/api/card/transfer/verify-receiver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiverCardNumber })
            });

            const data = await res.json();
            if (res.ok && data.valid) {
                setVerifiedReceiver(data);
                setVerifyError('');
            } else {
                setVerifiedReceiver(null);
                setVerifyError(data.message || 'Receiver card not found or inactive.');
            }
        } catch (err) {
            setVerifyError('Unable to connect to KMRL server.');
        } finally {
            setIsVerifying(false);
        }
    };

    // 2. Review Transfer button clicked
    const handleReviewTransfer = async () => {
        setTransferError('');
        setVerifyError('');

        if (!isAuthenticated) {
            if (typeof onNavigate === 'function') {
                onNavigate('signin');
            } else {
                window.location.assign('/signin');
            }
            return;
        }

        if (!receiverCardNumber) {
            setVerifyError('Please enter receiver metro card number.');
            return;
        }

        if (!numericAmount || isNaN(numericAmount) || numericAmount < 10) {
            setTransferError('Minimum card-to-card transfer amount is ₹10.');
            return;
        }

        if (numericAmount > 10000) {
            setTransferError('Maximum transfer limit is ₹10,000 per transaction.');
            return;
        }

        if (numericAmount > senderBalance) {
            setTransferError(`Insufficient card balance. Available: ₹${senderBalance.toFixed(2)}, Requested: ₹${numericAmount}`);
            return;
        }

        // Ensure receiver is verified
        if (!verifiedReceiver) {
            setIsVerifying(true);
            try {
                const res = await fetch('/api/card/transfer/verify-receiver', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ receiverCardNumber })
                });
                const data = await res.json();
                if (!res.ok || !data.valid) {
                    setVerifyError(data.message || 'Receiver verification failed.');
                    setIsVerifying(false);
                    return;
                }
                setVerifiedReceiver(data);
            } catch (err) {
                setVerifyError('Receiver card verification error.');
                setIsVerifying(false);
                return;
            } finally {
                setIsVerifying(false);
            }
        }

        // Open review confirmation
        setPassword('');
        setPasswordError('');
        setIsReviewOpen(true);
    };

    // 3. Confirm Transfer (atomic execution)
    const handleConfirmTransfer = async () => {
        if (!password) {
            setPasswordError('Please enter your account password to authorize the transfer.');
            return;
        }

        setIsSubmittingTransfer(true);
        setPasswordError('');

        try {
            const res = await fetch('/api/card/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    receiverCardNumber,
                    amount: numericAmount,
                    password,
                    transferNote: transferNote.trim()
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setTransferResult({
                    success: true,
                    message: data.message,
                    transactionReference: data.transactionReference,
                    amount: data.amount,
                    senderNewBalance: data.senderNewBalance,
                    maskedSenderCard: data.maskedSenderCard,
                    maskedReceiverCard: data.maskedReceiverCard,
                    timestamp: data.timestamp
                });

                setIsReviewOpen(false);
                setReceiverCardNumber('');
                setVerifiedReceiver(null);
                setTransferAmount('');
                setTransferNote('');
                setPassword('');

                if (typeof onSuccess === 'function') {
                    onSuccess(data.senderNewBalance);
                }
            } else {
                if (res.status === 401) {
                    setPasswordError(data.message || 'Incorrect password.');
                } else {
                    setPasswordError(data.message || 'Transfer could not be processed.');
                }
            }
        } catch (err) {
            setPasswordError('Connection failed while processing transfer.');
        } finally {
            setIsSubmittingTransfer(false);
        }
    };

    return (
        <section className="extended-feature-panel" id="section-card-to-card-transfer">
            <div className="panel-inner">
                {/* Header */}
                <div className="panel-title-bar">
                    <div className="panel-title-left">
                        <div>
                            <h2 className="feature-section-heading">Recharge Card via Card</h2>
                            <p className="feature-section-sub">
                                Instant balance transfer from your KMRL virtual metro card to another passenger's card
                            </p>
                        </div>
                    </div>
                    <span className="panel-badge-pill internal">Internal Transfer</span>
                </div>

                {/* Transaction Result / Status Area */}
                {transferResult && (
                    <div className="feature-status-banner success">
                        <div>
                            <div className="status-banner-title">
                                <span>🎉</span>
                                <span>Transfer Completed Successfully!</span>
                            </div>
                            <p className="status-banner-text">{transferResult.message}</p>
                            <div className="status-meta-grid">
                                <div>
                                    <span className="status-meta-label">From Card</span>
                                    <span className="status-meta-value">{transferResult.maskedSenderCard}</span>
                                </div>
                                <div>
                                    <span className="status-meta-label">To Card</span>
                                    <span className="status-meta-value">{transferResult.maskedReceiverCard}</span>
                                </div>
                                <div>
                                    <span className="status-meta-label">Amount Debited</span>
                                    <span className="status-meta-value debit">- ₹ {transferResult.amount}</span>
                                </div>
                                <div>
                                    <span className="status-meta-label">Remaining Balance</span>
                                    <span className="status-meta-value">₹ {transferResult.senderNewBalance?.toFixed(2)}</span>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <span className="status-meta-label">KMRL Transaction Reference</span>
                                    <span className="status-meta-value mono">{transferResult.transactionReference}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {transferError && (
                    <div className="feature-status-banner error">
                        <div className="status-banner-title">
                            <span>⚠️</span>
                            <span>{transferError}</span>
                        </div>
                    </div>
                )}

                {/* Form Body */}
                <div className="feature-form-body">
                    {/* Sender Card Display & Live Balance */}
                    <div className="sender-card-strip">
                        <div className="sender-col">
                            <span className="sender-label">Sender's Metro Card Number</span>
                            <div className="sender-card-number">
                                {card ? maskCardNumber(card.cardNumber) : 'Sign in to access your card'}
                            </div>
                            <span className="sender-subtext">Authenticated Owner Card</span>
                        </div>
                        <div className="sender-col text-right">
                            <span className="sender-label">Available Balance</span>
                            <div className="sender-balance-badge">
                                ₹ {senderBalance.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Receiver Metro Card Number */}
                    <div className="feature-input-group">
                        <label className="feature-input-label" htmlFor="receiver-card-input">
                            Receiver's Metro Card Number
                        </label>
                        <div className="input-with-action">
                            <span className="input-prefix-icon">📥</span>
                            <input
                                id="receiver-card-input"
                                type="text"
                                className="feature-text-input"
                                placeholder="4180 •••• •••• ••••"
                                value={receiverCardNumber}
                                onChange={handleReceiverChange}
                                maxLength={19}
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                className="btn-verify-card"
                                id="btn-verify-receiver-card"
                                onClick={handleVerifyReceiver}
                                disabled={isVerifying || receiverCardNumber.replace(/\s/g, '').length < 16}
                            >
                                {isVerifying ? 'Checking...' : 'Verify Receiver Card'}
                            </button>
                        </div>

                        {/* Verified Receiver Indicator */}
                        {verifiedReceiver && (
                            <div className="verified-card-badge success">
                                <span className="verified-icon">✓</span>
                                <span>Receiver: <strong>{verifiedReceiver.maskedCardNumber}</strong></span>
                                <span className="holder-pill">Holder: {verifiedReceiver.cardHolderName}</span>
                                <span className="status-pill active">{verifiedReceiver.status}</span>
                            </div>
                        )}

                        {verifyError && (
                            <div className="verified-card-badge error">
                                <span>⚠️ {verifyError}</span>
                            </div>
                        )}
                    </div>

                    {/* Transfer Amount */}
                    <div className="feature-input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="feature-input-label" htmlFor="transfer-amt-input">Transfer Amount</label>
                            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                Max: ₹ {Math.min(10000, senderBalance).toFixed(2)}
                            </span>
                        </div>
                        <div className="custom-amt-field">
                            <span className="currency-prefix">₹</span>
                            <input
                                id="transfer-amt-input"
                                type="text"
                                inputMode="numeric"
                                className="feature-text-input custom-input"
                                placeholder="Enter transfer amount (min ₹10)"
                                value={transferAmount}
                                onChange={(e) => {
                                    setTransferAmount(e.target.value.replace(/\D/g, ''));
                                    setTransferError('');
                                }}
                            />
                        </div>
                    </div>

                    {/* Optional Transfer Note */}
                    <div className="feature-input-group">
                        <label className="feature-input-label" htmlFor="transfer-note-input">
                            Transfer Note <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional)</span>
                        </label>
                        <input
                            id="transfer-note-input"
                            type="text"
                            className="feature-text-input"
                            placeholder="e.g. Metro fare sharing, Split bill"
                            value={transferNote}
                            onChange={(e) => setTransferNote(e.target.value)}
                            maxLength={40}
                        />
                    </div>

                    {/* Action: Review Transfer Button */}
                    <button
                        type="button"
                        className="btn-feature-primary"
                        id="btn-review-transfer"
                        onClick={handleReviewTransfer}
                        disabled={!numericAmount || numericAmount < 10 || isVerifying || numericAmount > senderBalance}
                    >
                        Review Transfer
                    </button>

                    <div className="feature-security-note">
                        🔒 Direct stored-value wallet transfer. Zero fees, executed atomically on Kochi Metro ledger.
                    </div>
                </div>

                {/* ── TRANSFER REVIEW MODAL / AUTHORIZATION ── */}
                {isReviewOpen && (
                    <div className="recharge-modal-backdrop" onClick={() => !isSubmittingTransfer && setIsReviewOpen(false)}>
                        <div className="recharge-modal-container transfer-review-modal" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="modal-header-banner transfer">
                                <button
                                    type="button"
                                    className="modal-close-btn"
                                    onClick={() => !isSubmittingTransfer && setIsReviewOpen(false)}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                                <h2>Review Metro Card Transfer</h2>
                                <p>Verify details and authorize transfer from your KMRL virtual card</p>
                            </div>

                            <div className="modal-body">
                                {passwordError && (
                                    <div className="modal-alert error">
                                        ⚠️ {passwordError}
                                    </div>
                                )}

                                {/* Transfer Summary Card */}
                                <div className="review-breakdown-card">
                                    <div className="breakdown-row">
                                        <span className="row-label">From Your Card:</span>
                                        <span className="row-value">{card ? maskCardNumber(card.cardNumber) : '----'}</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span className="row-label">To Receiver Card:</span>
                                        <span className="row-value">{verifiedReceiver ? verifiedReceiver.maskedCardNumber : receiverCardNumber}</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span className="row-label">Receiver Name:</span>
                                        <span className="row-value">{verifiedReceiver?.cardHolderName || 'KMRL Passenger'}</span>
                                    </div>
                                    <div className="breakdown-divider"></div>
                                    <div className="breakdown-row">
                                        <span className="row-label">Transfer Amount:</span>
                                        <span className="row-value-highlight">₹ {numericAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span className="row-label">KMRL Transfer Fee:</span>
                                        <span className="row-value" style={{ color: '#16a34a' }}>₹ 0.00 (Free)</span>
                                    </div>
                                    <div className="breakdown-row">
                                        <span className="row-label">Remaining Balance:</span>
                                        <span className="row-value">₹ {(senderBalance - numericAmount).toFixed(2)}</span>
                                    </div>
                                    {transferNote && (
                                        <div className="breakdown-row">
                                            <span className="row-label">Note:</span>
                                            <span className="row-value note">"{transferNote}"</span>
                                        </div>
                                    )}
                                </div>

                                {/* Security Authorization: Account Password */}
                                <div className="feature-input-group" style={{ marginTop: '1.2rem' }}>
                                    <label className="feature-input-label" htmlFor="transfer-auth-password">
                                        Enter Your Account Password to Authorize
                                    </label>
                                    <input
                                        id="transfer-auth-password"
                                        type="password"
                                        className="feature-text-input"
                                        placeholder="Account password for confirmation"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setPasswordError('');
                                        }}
                                        disabled={isSubmittingTransfer}
                                        autoFocus
                                    />
                                    <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                        🔒 Required security step: confirms card ownership and prevents unauthorized spending.
                                    </span>
                                </div>

                                {/* Modal Actions */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '1.5rem' }}>
                                    <button
                                        type="button"
                                        className="btn-user-guide"
                                        onClick={() => setIsReviewOpen(false)}
                                        disabled={isSubmittingTransfer}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-feature-primary"
                                        id="btn-confirm-transfer"
                                        onClick={handleConfirmTransfer}
                                        disabled={isSubmittingTransfer || !password}
                                        style={{ margin: 0 }}
                                    >
                                        {isSubmittingTransfer ? 'Transferring...' : 'Confirm Transfer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CardTransferSection;
