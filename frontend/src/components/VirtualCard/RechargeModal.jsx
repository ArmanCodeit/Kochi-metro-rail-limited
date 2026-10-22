import React, { useState } from 'react';
import '../../styles/RechargeModal.css';

const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

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

const RechargeModal = ({ isOpen, onClose, card, onSuccess, token }) => {
    const [selectedAmount, setSelectedAmount] = useState(200);
    const [customAmount, setCustomAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!isOpen) return null;

    const currentAmount = customAmount ? Number(customAmount) : selectedAmount;

    const handlePresetSelect = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount('');
        setErrorMessage('');
    };

    const handleCustomChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        setCustomAmount(val);
        setErrorMessage('');
    };

    const handleProceedToPayment = async () => {
        if (!currentAmount || isNaN(currentAmount) || currentAmount < 10) {
            setErrorMessage('Minimum recharge amount is ₹10.');
            return;
        }

        if (currentAmount > 10000) {
            setErrorMessage('Maximum single recharge limit is ₹10,000.');
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            // 1. Load Razorpay Checkout SDK
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
            }

            // 2. Create Razorpay order on server
            const orderResponse = await fetch('/api/card/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount: currentAmount })
            });

            const orderData = await orderResponse.json();
            if (!orderResponse.ok || !orderData.orderId) {
                throw new Error(orderData.message || 'Unable to initiate recharge order.');
            }

            // 3. Configure Razorpay official checkout options
            const options = {
                key: orderData.keyId,
                amount: orderData.amount, // in paise
                currency: orderData.currency || 'INR',
                name: 'Kochi Metro Rail Limited',
                description: `Virtual Metro Card Recharge - ₹${currentAmount}`,
                image: '/images/kmrl-logo.png',
                order_id: orderData.orderId,
                prefill: orderData.prefill || {},
                theme: {
                    color: '#059db2'
                },
                handler: async function (response) {
                    try {
                        setIsProcessing(true);
                        // 4. Verify signature on backend
                        const verifyResponse = await fetch('/api/card/verify-payment', {
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

                        const verifyData = await verifyResponse.json();
                        if (verifyResponse.ok && verifyData.success) {
                            setSuccessMessage(verifyData.message || 'Recharge successful!');
                            if (typeof onSuccess === 'function') {
                                onSuccess(verifyData.balance);
                            }
                            setTimeout(() => {
                                onClose();
                            }, 1800);
                        } else {
                            throw new Error(verifyData.message || 'Payment verification failed on the server.');
                        }
                    } catch (verifyErr) {
                        setErrorMessage(verifyErr.message || 'Error verifying payment.');
                    } finally {
                        setIsProcessing(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        // Inform backend of cancellation
                        fetch('/api/card/payment-failed', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpayOrderId: orderData.orderId,
                                reason: 'User closed payment window'
                            })
                        }).catch(() => {});
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (resp) {
                setIsProcessing(false);
                const reason = resp.error?.description || 'Payment failed';
                setErrorMessage(`Payment failed: ${reason}`);

                fetch('/api/card/payment-failed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        razorpayOrderId: orderData.orderId,
                        reason: reason,
                        code: resp.error?.code
                    })
                }).catch(() => {});
            });

            rzp.open();
        } catch (err) {
            console.error('Recharge error:', err);
            setErrorMessage(err.message || 'An unexpected error occurred during recharge.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="recharge-modal-backdrop" onClick={onClose}>
            <div className="recharge-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header Banner */}
                <div className="modal-header-banner">
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>
                    <h2>Recharge Metro Card</h2>
                    <p>Instant balance update via Razorpay Official Checkout</p>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Error / Success Alerts */}
                    {errorMessage && <div className="modal-alert error">⚠️ {errorMessage}</div>}
                    {successMessage && <div className="modal-alert success">✅ {successMessage}</div>}

                    {/* Card Summary */}
                    <div className="card-summary-strip">
                        <div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Card Number</div>
                            <div className="card-summary-number">{card?.cardNumber || '---- ---- ---- ----'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Current Balance</div>
                            <div className="card-summary-balance">₹ {typeof card?.balance === 'number' ? card.balance.toFixed(2) : '0.00'}</div>
                        </div>
                    </div>

                    {/* Preset Amount Chips */}
                    <label className="amount-selection-label">Select Recharge Amount</label>
                    <div className="quick-amount-chips">
                        {PRESET_AMOUNTS.map((amt) => (
                            <button
                                key={amt}
                                type="button"
                                className={`amount-chip ${!customAmount && selectedAmount === amt ? 'active' : ''}`}
                                onClick={() => handlePresetSelect(amt)}
                                disabled={isProcessing}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>

                    {/* Custom Amount Input */}
                    <div className="custom-amount-wrapper">
                        <span className="currency-symbol">₹</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            className="custom-amount-input"
                            placeholder="Or enter custom amount (e.g. 350)"
                            value={customAmount}
                            onChange={handleCustomChange}
                            disabled={isProcessing}
                        />
                    </div>

                    {/* Summary */}
                    <div className="recharge-summary-box">
                        <span className="summary-label">Amount to Recharge:</span>
                        <span className="summary-amount">₹ {currentAmount || 0}</span>
                    </div>

                    {/* Proceed Button */}
                    <button
                        type="button"
                        className="btn-proceed-pay"
                        onClick={handleProceedToPayment}
                        disabled={isProcessing || !currentAmount || currentAmount < 10}
                    >
                        {isProcessing ? 'Connecting to Razorpay...' : `Pay ₹${currentAmount || 0} with Razorpay`}
                    </button>

                    <div className="razorpay-trust-badge">
                        🔒 Secured by Razorpay • Official Test Mode • Instant Card Credit
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RechargeModal;
