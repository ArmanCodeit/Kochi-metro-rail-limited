import React, { useState } from 'react';

const PRESET_AMOUNTS = [100, 200, 500, 1000];

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

const formatCardInput = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const RechargeOtherCard = ({ token, isAuthenticated, onSuccess, onNavigate }) => {
    const [recipientCardNumber, setRecipientCardNumber] = useState('');
    const [selectedAmount, setSelectedAmount] = useState(200);
    const [customAmount, setCustomAmount] = useState('');
    const [verifiedRecipient, setVerifiedRecipient] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [txStatus, setTxStatus] = useState(null); // { type: 'success'|'error', message, ref, amount, maskedCard }

    const currentAmount = customAmount ? Number(customAmount) : selectedAmount;

    // Handle card number typing
    const handleCardNumberChange = (e) => {
        const formatted = formatCardInput(e.target.value);
        setRecipientCardNumber(formatted);
        setVerifiedRecipient(null);
        setVerifyError('');
        setTxStatus(null);
    };

    // Verify recipient card with backend
    const handleVerifyCard = async () => {
        const cleanDigits = recipientCardNumber.replace(/\s/g, '');
        if (cleanDigits.length !== 16) {
            setVerifyError('Please enter a complete 16-digit Kochi Metro card number.');
            setVerifiedRecipient(null);
            return;
        }

        if (!isAuthenticated) {
            setVerifyError('Please sign in to verify and recharge another card.');
            return;
        }

        setIsVerifying(true);
        setVerifyError('');
        setTxStatus(null);

        try {
            const res = await fetch('/api/card/verify-recipient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cardNumber: recipientCardNumber })
            });

            const data = await res.json();
            if (res.ok && data.valid) {
                setVerifiedRecipient(data);
                setVerifyError('');
            } else {
                setVerifiedRecipient(null);
                setVerifyError(data.message || 'Invalid or inactive metro card.');
            }
        } catch (err) {
            setVerifyError('Unable to connect to verification server. Please check your connection.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Proceed to Razorpay Payment
    const handleContinueToPayment = async () => {
        if (!isAuthenticated) {
            if (typeof onNavigate === 'function') {
                onNavigate('signin');
            } else {
                window.location.assign('/signin');
            }
            return;
        }

        if (!recipientCardNumber) {
            setVerifyError('Please enter the recipient metro card number.');
            return;
        }

        if (!currentAmount || isNaN(currentAmount) || currentAmount < 10) {
            setVerifyError('Minimum recharge amount is ₹10.');
            return;
        }

        if (currentAmount > 10000) {
            setVerifyError('Maximum single recharge limit is ₹10,000.');
            return;
        }

        // If not yet verified, verify first
        let targetRecipient = verifiedRecipient;
        if (!targetRecipient) {
            setIsVerifying(true);
            try {
                const checkRes = await fetch('/api/card/verify-recipient', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ cardNumber: recipientCardNumber })
                });
                const checkData = await checkRes.json();
                if (!checkRes.ok || !checkData.valid) {
                    setVerifyError(checkData.message || 'Recipient card verification failed.');
                    setIsVerifying(false);
                    return;
                }
                targetRecipient = checkData;
                setVerifiedRecipient(checkData);
            } catch (e) {
                setVerifyError('Card verification error.');
                setIsVerifying(false);
                return;
            } finally {
                setIsVerifying(false);
            }
        }

        setIsProcessing(true);
        setVerifyError('');
        setTxStatus(null);

        try {
            // 1. Load Razorpay script
            const loaded = await loadRazorpayScript();
            if (!loaded) {
                throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
            }

            // 2. Create Razorpay order on backend
            const orderRes = await fetch('/api/card/recharge-other/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientCardNumber,
                    amount: currentAmount
                })
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok || !orderData.orderId) {
                throw new Error(orderData.message || 'Failed to create recharge order.');
            }

            // 3. Open Razorpay Checkout modal
            const options = {
                key: orderData.keyId,
                amount: orderData.amount, // in paise
                currency: orderData.currency || 'INR',
                name: 'Kochi Metro Rail Limited',
                description: `Recharge for Card ${orderData.maskedRecipientCard}`,
                image: '/images/kmrl-logo.png',
                order_id: orderData.orderId,
                prefill: orderData.prefill || {},
                theme: { color: '#059db2' },
                handler: async function (response) {
                    try {
                        setIsProcessing(true);
                        // 4. Verify payment securely on backend
                        const verifyRes = await fetch('/api/card/recharge-other/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok && verifyData.success) {
                            setTxStatus({
                                type: 'success',
                                message: `Payment verified! ₹${verifyData.amount} credited to recipient metro card.`,
                                ref: verifyData.transactionReference || response.razorpay_payment_id,
                                amount: verifyData.amount,
                                maskedCard: verifyData.maskedRecipientCard,
                                cardHolder: verifyData.cardHolderName
                            });
                            setRecipientCardNumber('');
                            setVerifiedRecipient(null);
                            if (typeof onSuccess === 'function') {
                                onSuccess();
                            }
                        } else {
                            throw new Error(verifyData.message || 'Payment signature verification failed.');
                        }
                    } catch (err) {
                        setTxStatus({
                            type: 'error',
                            message: err.message || 'Payment verification failed on the server.'
                        });
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        fetch('/api/card/payment-failed', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpayOrderId: orderData.orderId,
                                reason: 'Payment window dismissed by user'
                            })
                        }).catch(() => {});
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
                setIsProcessing(false);
                setTxStatus({
                    type: 'error',
                    message: `Payment failed: ${resp.error?.description || 'Transaction declined by gateway.'}`
                });
            });
            rzp.open();
        } catch (err) {
            setIsProcessing(false);
            setTxStatus({
                type: 'error',
                message: err.message || 'An error occurred while initiating recharge.'
            });
        }
    };

    return (
        <section className="extended-feature-panel" id="section-recharge-other-card">
            <div className="panel-inner">
                {/* Header */}
                <div className="panel-title-bar">
                    <div className="panel-title-left">
                        <span className="panel-icon-badge">⚡</span>
                        <div>
                            <h2 className="feature-section-heading">Recharge Other Card</h2>
                            <p className="feature-section-sub">
                                Top-up another passenger's Kochi Metro card instantly using Razorpay
                            </p>
                        </div>
                    </div>
                    <span className="panel-badge-pill">Razorpay Official</span>
                </div>

                {/* Status Message / Transaction Result Area */}
                {txStatus && (
                    <div className={`feature-status-banner ${txStatus.type}`}>
                        {txStatus.type === 'success' ? (
                            <div>
                                <div className="status-banner-title">
                                    <span>✅</span>
                                    <span>Recharge Successful!</span>
                                </div>
                                <p className="status-banner-text">{txStatus.message}</p>
                                <div className="status-meta-grid">
                                    <div>
                                        <span className="status-meta-label">Recipient Card</span>
                                        <span className="status-meta-value">{txStatus.maskedCard}</span>
                                    </div>
                                    <div>
                                        <span className="status-meta-label">Cardholder</span>
                                        <span className="status-meta-value">{txStatus.cardHolder || 'Commuter'}</span>
                                    </div>
                                    <div>
                                        <span className="status-meta-label">Amount Paid</span>
                                        <span className="status-meta-value">₹ {txStatus.amount}</span>
                                    </div>
                                    <div>
                                        <span className="status-meta-label">Transaction Ref</span>
                                        <span className="status-meta-value mono">{txStatus.ref}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="status-banner-title">
                                <span>⚠️</span>
                                <span>{txStatus.message}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Form Body */}
                <div className="feature-form-body">
                    {/* Recipient Card Number Input */}
                    <div className="feature-input-group">
                        <label className="feature-input-label" htmlFor="recipient-card-input">
                            Recipient Metro Card Number
                        </label>
                        <div className="input-with-action">
                            <span className="input-prefix-icon">💳</span>
                            <input
                                id="recipient-card-input"
                                type="text"
                                className="feature-text-input"
                                placeholder="4180 •••• •••• ••••"
                                value={recipientCardNumber}
                                onChange={handleCardNumberChange}
                                maxLength={19}
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                className="btn-verify-card"
                                onClick={handleVerifyCard}
                                disabled={isVerifying || recipientCardNumber.replace(/\s/g, '').length < 16}
                            >
                                {isVerifying ? 'Checking...' : 'Verify Card'}
                            </button>
                        </div>

                        {/* Verified Card Indicator */}
                        {verifiedRecipient && (
                            <div className="verified-card-badge success">
                                <span className="verified-icon">✓</span>
                                <span>Verified Card: <strong>{verifiedRecipient.maskedCardNumber}</strong></span>
                                <span className="holder-pill">Holder: {verifiedRecipient.cardHolderName}</span>
                                <span className="status-pill active">{verifiedRecipient.status}</span>
                            </div>
                        )}

                        {verifyError && (
                            <div className="verified-card-badge error">
                                <span>⚠️ {verifyError}</span>
                            </div>
                        )}
                    </div>

                    {/* Recharge Amount Selection */}
                    <div className="feature-input-group">
                        <label className="feature-input-label">Recharge Amount</label>
                        <div className="preset-chip-row">
                            {PRESET_AMOUNTS.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    className={`preset-amt-chip ${!customAmount && selectedAmount === amt ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedAmount(amt);
                                        setCustomAmount('');
                                    }}
                                    disabled={isProcessing}
                                >
                                    ₹{amt}
                                </button>
                            ))}
                        </div>

                        <div className="custom-amt-field">
                            <span className="currency-prefix">₹</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="feature-text-input custom-input"
                                placeholder="Or enter custom amount (e.g. 350)"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ''))}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>

                    {/* Summary Strip */}
                    <div className="transfer-summary-strip">
                        <div className="summary-col">
                            <span className="summary-label">Recipient Card</span>
                            <span className="summary-val">{verifiedRecipient ? verifiedRecipient.maskedCardNumber : (recipientCardNumber ? formatCardInput(recipientCardNumber) : 'Not specified')}</span>
                        </div>
                        <div className="summary-col text-right">
                            <span className="summary-label">Total to Pay</span>
                            <span className="summary-val-highlight">₹ {currentAmount || 0}</span>
                        </div>
                    </div>

                    {/* Continue Button */}
                    <button
                        type="button"
                        className="btn-feature-primary"
                        id="btn-continue-razorpay"
                        onClick={handleContinueToPayment}
                        disabled={isProcessing || isVerifying || !currentAmount || currentAmount < 10}
                    >
                        {isProcessing ? 'Processing with Razorpay...' : 'Continue to Razorpay Payment'}
                    </button>

                    <div className="feature-security-note">
                        🔒 Secured 256-bit Razorpay Checkout. Initiated from your account; credited directly to recipient's card.
                    </div>
                </div>
            </div>
        </section>
    );
};

export default RechargeOtherCard;
