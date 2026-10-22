import React from 'react';
import '../styles/UserGuide.css';

function UserGuide({ onNavigate }) {
    const handleNav = (page) => {
        if (typeof onNavigate === 'function') {
            onNavigate(page);
        } else {
            const routes = {
                recharge: '/recharge',
                findmetro: '/findmetro',
                ticket: '/ticket',
                myaccount: '/myaccount',
                signin: '/signin',
                help: '/help'
            };
            window.location.assign(routes[page] || '/');
        }
    };

    return (
        <div className="userguide-container">
            {/* Breadcrumb Header */}
            <div className="userguide-header-strip">
                <div className="userguide-header-inner">
                    <button
                        type="button"
                        className="btn-back-recharge"
                        onClick={() => handleNav('recharge')}
                        title="Return to Recharge page"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>Back to Recharge</span>
                    </button>

                    <div className="userguide-badge">KMRL Passenger Helpdesk</div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="userguide-main-content">
                {/* Hero Header */}
                <header className="userguide-hero">
                    <div className="hero-icon-pill">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059db2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                            <path d="M6 6h10" />
                            <path d="M6 10h10" />
                        </svg>
                        <span>Official KMRL Transit Guide</span>
                    </div>
                    <h1 className="userguide-title">Recharge & Ticket User Guide</h1>
                    <p className="userguide-lead">
                        Everything you need to know about managing your digital Kochi1 Virtual Metro Card balance, paying via Razorpay, and booking turnstile-ready digital QR tickets.
                    </p>

                    {/* Quick Jump Bar */}
                    <nav className="userguide-quick-nav">
                        <a href="#section-recharge" className="quick-link-btn">
                            <span className="quick-nav-num">1</span> Card Recharge Flow
                        </a>
                        <a href="#section-tickets" className="quick-link-btn">
                            <span className="quick-nav-num">2</span> QR Ticket Booking
                        </a>
                        <a href="#section-troubleshooting" className="quick-link-btn">
                            <span className="quick-nav-num">3</span> Troubleshooting
                        </a>
                    </nav>
                </header>

                {/* Important Distinction Callout */}
                <div className="userguide-distinction-callout">
                    <div className="callout-icon">💡</div>
                    <div className="callout-body">
                        <h4 className="callout-heading">Important Distinction: Card Recharge vs. QR Ticket Booking</h4>
                        <p className="callout-text">
                            <strong>Recharging your Virtual Metro Card</strong> adds stored-value transit balance to your card chip for future travel. It does <em>not</em> automatically generate a single-journey ticket.
                            To board a specific train trip immediately, navigate to <button type="button" className="inline-link-btn" onClick={() => handleNav('findmetro')}>Plan Your Trip</button> to issue a 5-hour scannable QR ticket.
                        </p>
                    </div>
                </div>

                {/* SECTION A: How to Recharge a Metro Card */}
                <section id="section-recharge" className="guide-card-section">
                    <div className="section-title-row">
                        <div className="section-badge-num">A</div>
                        <div>
                            <h2 className="section-heading">How to Recharge a Metro Card Using Razorpay</h2>
                            <p className="section-subtext">Step-by-step instructions to top up your virtual card balance.</p>
                        </div>
                    </div>

                    <div className="steps-timeline">
                        <div className="step-card">
                            <div className="step-marker">1</div>
                            <div className="step-content">
                                <h3 className="step-title">Log in to Your KMRL Account</h3>
                                <p className="step-desc">
                                    Sign in using your registered username or email and password at the <button type="button" className="inline-link-btn" onClick={() => handleNav('signin')}>Sign In</button> page. If you are a new passenger, create an account first at <button type="button" className="inline-link-btn" onClick={() => handleNav('signup')}>Sign Up</button>.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">2</div>
                            <div className="step-content">
                                <h3 className="step-title">Open the Recharge Page</h3>
                                <p className="step-desc">
                                    Click <strong>Recharge</strong> on the main website navigation bar, or select <button type="button" className="inline-link-btn" onClick={() => handleNav('recharge')}>Recharge</button> from your dashboard.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">3</div>
                            <div className="step-content">
                                <h3 className="step-title">Check Your Virtual Metro Card & Current Balance</h3>
                                <p className="step-desc">
                                    Your digital Kochi1 Virtual Metro Card is rendered on the page, displaying your 16-digit card number, cardholder name, status, and live balance (new accounts receive a complimentary ₹100 welcome balance).
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">4</div>
                            <div className="step-content">
                                <h3 className="step-title">Click "RECHARGE YOUR CARD"</h3>
                                <p className="step-desc">
                                    Click the prominent teal <strong>RECHARGE YOUR CARD</strong> button to open the secure top-up modal.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">5</div>
                            <div className="step-content">
                                <h3 className="step-title">Select or Enter Your Recharge Amount</h3>
                                <p className="step-desc">
                                    Choose from predefined top-up amounts (₹100, ₹200, ₹500, ₹1000) or enter a custom amount. The review screen shows the amount to be added to your card.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">6</div>
                            <div className="step-content">
                                <h3 className="step-title">Proceed to the Razorpay Checkout Modal</h3>
                                <p className="step-desc">
                                    Click <strong>Proceed to Payment</strong>. The application invokes the Razorpay payment gateway order creation endpoint (<code className="code-pill">/api/card/create-order</code>) and opens the checkout window.
                                </p>
                                <div className="environment-notice-box">
                                    <span className="notice-icon">ℹ️</span>
                                    <span><strong>Gateway Mode:</strong> Razorpay is configured in <strong>Test Mode</strong> (<code className="code-pill">rzp_test_...</code>) for this deployment. You can complete test transactions safely without real money deductions.</span>
                                </div>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">7</div>
                            <div className="step-content">
                                <h3 className="step-title">Complete Payment in the Interface</h3>
                                <p className="step-desc">
                                    In the Razorpay checkout overlay, select your preferred test payment method (UPI, Netbanking, or Test Card) and approve the transaction.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">8</div>
                            <div className="step-content">
                                <h3 className="step-title">Server Cryptographic Verification</h3>
                                <p className="step-desc">
                                    The KMRL backend validates the HMAC-SHA256 signature returned by Razorpay (<code className="code-pill">/api/card/verify-payment</code>). Once verified, your balance is atomically incremented in MongoDB Atlas and a permanent audit record is created in your transaction ledger.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">9</div>
                            <div className="step-content">
                                <h3 className="step-title">Verify Updated Balance & Transaction History</h3>
                                <p className="step-desc">
                                    The Recharge modal displays a green success confirmation. Close the modal to see your updated balance immediately on your card chip, and check the <strong>Recent Card Transactions</strong> table below for your timestamped receipt.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION B: How to Get and Find a QR Ticket */}
                <section id="section-tickets" className="guide-card-section">
                    <div className="section-title-row">
                        <div className="section-badge-num">B</div>
                        <div>
                            <h2 className="section-heading">How to Get and Find a QR Ticket</h2>
                            <p className="section-subtext">Issue an authoritative 5-hour digital QR boarding pass for metro turnstiles.</p>
                        </div>
                    </div>

                    <div className="steps-timeline">
                        <div className="step-card">
                            <div className="step-marker">1</div>
                            <div className="step-content">
                                <h3 className="step-title">Navigate to "Plan Your Trip"</h3>
                                <p className="step-desc">
                                    Go to <button type="button" className="inline-link-btn" onClick={() => handleNav('findmetro')}>Plan Your Trip</button> from the navigation menu or homepage search bar.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">2</div>
                            <div className="step-content">
                                <h3 className="step-title">Select Origin and Destination Stations</h3>
                                <p className="step-desc">
                                    Choose your departure station (e.g., Aluva) and arrival station (e.g., Infopark, MG Road, or Vyttila). The system dynamically calculates direct routes and multi-line interchange connections.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">3</div>
                            <div className="step-content">
                                <h3 className="step-title">Select Passenger Count</h3>
                                <p className="step-desc">
                                    In the <strong>Review & Payment</strong> section, use the visible <span className="control-symbol-pill">−</span> and <span className="control-symbol-pill">+</span> buttons to set the number of traveling passengers (1 to 6 passengers). The total fare automatically updates in real time.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">4</div>
                            <div className="step-content">
                                <h3 className="step-title">Choose Payment Method</h3>
                                <p className="step-desc">
                                    Select either <strong>Razorpay Online Payment</strong> (UPI, card, netbanking) OR <strong>Pay with Virtual Metro Card</strong> (instantly debits your card balance without launching an external gateway).
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">5</div>
                            <div className="step-content">
                                <h3 className="step-title">Complete Booking & Receive Digital Ticket</h3>
                                <p className="step-desc">
                                    Confirm the booking. The system creates an authoritative ticket record in MongoDB Atlas with a cryptographically unique QR token and a strictly enforced 5-hour validity window.
                                </p>
                            </div>
                        </div>

                        <div className="step-card">
                            <div className="step-marker">6</div>
                            <div className="step-content">
                                <h3 className="step-title">View and Present Your QR Ticket</h3>
                                <p className="step-desc">
                                    The application directs you to the <button type="button" className="inline-link-btn" onClick={() => handleNav('ticket')}>Digital QR Ticket Page</button>. You can present this screen to the optical scanner at metro entry/exit turnstiles, use the <strong>Simulate Turnstile Scan</strong> button for testing, print a paper copy, or email the ticket to your inbox.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION C: Helpful Troubleshooting */}
                <section id="section-troubleshooting" className="guide-card-section">
                    <div className="section-title-row">
                        <div className="section-badge-num">C</div>
                        <div>
                            <h2 className="section-heading">Helpful Troubleshooting & FAQs</h2>
                            <p className="section-subtext">Quick resolutions to common transit account and ticketing questions.</p>
                        </div>
                    </div>

                    <div className="troubleshooting-grid">
                        <div className="trouble-card">
                            <div className="trouble-header">
                                <span className="trouble-icon">💳</span>
                                <h4>Balance Not Updated Immediately?</h4>
                            </div>
                            <p className="trouble-desc">
                                If your balance does not reflect a recent recharge right away, click the circular refresh icon on the top right of your virtual card or refresh your browser. Your card balance is stored directly in MongoDB Atlas and refreshes upon page load.
                            </p>
                        </div>

                        <div className="trouble-card">
                            <div className="trouble-header">
                                <span className="trouble-icon">⏳</span>
                                <h4>Payment Pending or Failed?</h4>
                            </div>
                            <p className="trouble-desc">
                                If a Razorpay payment modal is closed prematurely or internet connectivity drops, no balance will be credited. Check your <strong>Recent Transactions</strong> on the Recharge page. Only payments marked with status <strong>success</strong> are credited. You can safely retry any failed recharge.
                            </p>
                        </div>

                        <div className="trouble-card">
                            <div className="trouble-header">
                                <span className="trouble-icon">🎫</span>
                                <h4>Ticket Not Visible After Booking?</h4>
                            </div>
                            <p className="trouble-desc">
                                Your active ticket is automatically stored in your browser storage and MongoDB Atlas. Open <button type="button" className="inline-link-btn" onClick={() => handleNav('ticket')}>My QR Ticket</button> or check <button type="button" className="inline-link-btn" onClick={() => handleNav('myaccount')}>My Account → My Tickets</button> to view all active and historical bookings.
                            </p>
                        </div>

                        <div className="trouble-card">
                            <div className="trouble-header">
                                <span className="trouble-icon">📷</span>
                                <h4>QR Code Not Displaying?</h4>
                            </div>
                            <p className="trouble-desc">
                                The dynamic QR code image is rendered via <code className="code-pill">api.qrserver.com</code>. Ensure you have an active network connection. If offline, the authoritative <strong>Ticket ID</strong> printed below the frame can be validated manually at station customer service counters.
                            </p>
                        </div>

                        <div className="trouble-card">
                            <div className="trouble-header">
                                <span className="trouble-icon">⏱️</span>
                                <h4>Ticket Shows "Expired"?</h4>
                            </div>
                            <p className="trouble-desc">
                                Metro regulations enforce a strict <strong>5-hour validity window</strong> from the moment of purchase. If your ticket shows "00h 00m 00s (EXPIRED)", turnstiles will reject entry and a new journey ticket must be booked from <button type="button" className="inline-link-btn" onClick={() => handleNav('findmetro')}>Plan Your Trip</button>.
                            </p>
                        </div>

                        <div className="trouble-card">
                            <div className="trouble-header">
                                <span className="trouble-icon">🔒</span>
                                <h4>Session Expired or Login Required?</h4>
                            </div>
                            <p className="trouble-desc">
                                For passenger security, tokens expire after 7 days. If a card action prompts you to sign in, simply go to <button type="button" className="inline-link-btn" onClick={() => handleNav('signin')}>Sign In</button> to re-authenticate and resume your session seamlessly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer Navigation CTA */}
                <div className="userguide-footer-cta">
                    <div className="cta-content">
                        <h3>Ready to Travel or Manage Your Balance?</h3>
                        <p>Return to your digital virtual card to top up, or start planning your next metro route.</p>
                    </div>
                    <div className="cta-button-group">
                        <button
                            type="button"
                            className="btn-cta-primary"
                            onClick={() => handleNav('recharge')}
                        >
                            Go to Card Recharge
                        </button>
                        <button
                            type="button"
                            className="btn-cta-secondary"
                            onClick={() => handleNav('findmetro')}
                        >
                            Plan Your Trip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserGuide;
