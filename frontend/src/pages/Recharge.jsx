import React, { useState, useEffect, useCallback } from 'react';
import '../styles/Recharge.css';
import VirtualMetroCard from '../components/VirtualCard/VirtualMetroCard';
import RechargeModal from '../components/VirtualCard/RechargeModal';
import CardActivitySection from '../components/VirtualCard/CardActivitySection';

const stationBadges = [
    { name: "Aluva", color: "#0ea5e9" },
    { name: "Edapally", color: "#f43f5e" },
    { name: "Palarivattom", color: "#eab308" },
    { name: "Kaloor", color: "#a855f7" },
    { name: "MG Road", color: "#0ea5e9" },
    { name: "Ernakulam South", color: "#22c55e" },
    { name: "Kadavanthra", color: "#0ea5e9" },
    { name: "Vyttila", color: "#a855f7" },
    { name: "Petta", color: "#84cc16" },
    { name: "SN Junction", color: "#eab308" },
    { name: "Tripunithura", color: "#22c55e" }
];

const Recharge = ({ onNavigate }) => {
    const [token, setToken] = useState(() => localStorage.getItem('kmrl_token'));
    const [card, setCard] = useState(null);
    const [cardLoading, setCardLoading] = useState(false);
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [authPrompt, setAuthPrompt] = useState(false);

    const isAuthenticated = !!token;

    // Fetch or auto-provision virtual card for authenticated user
    const fetchCard = useCallback(async () => {
        const currentToken = localStorage.getItem('kmrl_token');
        if (!currentToken) {
            setCard(null);
            return;
        }

        setCardLoading(true);
        try {
            const response = await fetch('/api/card', {
                headers: {
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setCard(data);
            } else if (response.status === 401) {
                // Token expired
                localStorage.removeItem('kmrl_token');
                localStorage.removeItem('kmrl_user');
                setToken(null);
                setCard(null);
            }
        } catch (error) {
            console.error('Failed to load virtual metro card:', error);
        } finally {
            setCardLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCard();
    }, [fetchCard]);

    // Handle "RECHARGE YOUR CARD" button click
    const handleRechargeButtonClick = () => {
        const currentToken = localStorage.getItem('kmrl_token');
        if (!currentToken) {
            setAuthPrompt(true);
            setTimeout(() => setAuthPrompt(false), 5000);
            return;
        }
        setIsRechargeModalOpen(true);
    };

    // Callback when recharge completes successfully
    const handleRechargeSuccess = (newBalance) => {
        if (typeof newBalance === 'number') {
            setCard(prev => prev ? { ...prev, balance: newBalance } : null);
        } else {
            fetchCard();
        }
    };

    // Callback when journey simulation deducts fare
    const handleCardUpdated = (newBalance) => {
        if (typeof newBalance === 'number') {
            setCard(prev => prev ? { ...prev, balance: newBalance } : null);
        } else {
            fetchCard();
        }
    };

    const handleUserGuideClick = () => {
        if (typeof onNavigate === 'function') {
            onNavigate('userguide');
        } else {
            window.location.assign('/user-guide');
        }
    };

    return (
        <div className="recharge-page-container">
            {/* Hero Section */}
            <section className="recharge-hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Tap. Ride. Go.</h1>
                    <p className="hero-subtitle">
                        With Kochi1 Card on Kochi Metro, your <br /> journey just got smarter!
                    </p>
                    <div className="hero-buttons">
                        <button
                            type="button"
                            className="btn-recharge"
                            onClick={handleRechargeButtonClick}
                            id="btn-hero-recharge"
                        >
                            RECHARGE YOUR CARD
                        </button>
                        <button
                            type="button"
                            className="btn-user-guide"
                            onClick={handleUserGuideClick}
                        >
                            USER GUIDE
                        </button>
                    </div>

                    {authPrompt && (
                        <div style={{
                            marginTop: '1.2rem',
                            padding: '0.8rem 1rem',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            color: '#92400e',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.8rem'
                        }}>
                            <span>🔒 Please sign in to your account to recharge your card.</span>
                            <button
                                type="button"
                                onClick={() => onNavigate ? onNavigate('signin') : window.location.assign('/signin')}
                                style={{
                                    background: '#059db2',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Sign In
                            </button>
                        </div>
                    )}
                </div>

                {/* Hero Image Container: Interactive Virtual Kochi Metro Card */}
                <div className="hero-image-container">
                    <VirtualMetroCard
                        card={card}
                        loading={cardLoading}
                        onRefresh={fetchCard}
                        isAuthenticated={isAuthenticated}
                        onRechargeClick={handleRechargeButtonClick}
                    />
                </div>
            </section>

            {/* Simulated Metro Journey & Transaction History Section */}
            <CardActivitySection
                card={card}
                token={token}
                onCardUpdated={handleCardUpdated}
                onOpenRecharge={handleRechargeButtonClick}
                isAuthenticated={isAuthenticated}
                onNavigate={onNavigate}
            />

            {/* Stations Banner */}
            <section className="stations-banner">
                <div className="stations-banner-left">
                    <h3>Get your Kochi1 card at these Stations</h3>
                    <p className="sub-note">
                        <span className="info-icon">⭷</span> For more detail please refer the below table.
                    </p>
                </div>
                <div className="stations-banner-right">
                    <div className="station-badges">
                        {stationBadges.map((st, i) => (
                            <span
                                key={i}
                                className="station-badge"
                                style={{ borderColor: st.color, color: st.color }}
                            >
                                {st.name}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Glance Section */}
            <section className="quick-glance-section">
                <h2 className="section-title">Quick Glance at Kochi1 Card</h2>
                <div className="glance-grid">
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            <img src="/images/gate1.png" alt="" />
                        </div>
                        <h4>Contactless Entry<br /> at All Stations</h4>
                        <p>The Kochi1 Card enables contactless entry at all Kochi Metro stations</p>
                    </div>
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            <img src="/images/glance.png" alt="" />
                        </div>
                        <h4>One Card for All<br /> Metro Lines</h4>
                        <p>The same card can also be used across Kochi Water Metro and feeder buses.</p>
                    </div>
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            <img src="/images/card.png" alt="" />
                        </div>
                        <h4>Ride Easy with<br /> Kochi1 at KMRL</h4>
                        <p>Kochi1 cards issued by our partner banks are also compatible and rechargeable at all metro stations.</p>
                    </div>
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            <img src="/images/bus.png" alt="" />
                        </div>
                        <h4>Key To Best Public Transport<br /> Anywhere you go.</h4>
                        <p>Single card across multiple transit systems, including buses, water metros, and other networks.</p>
                    </div>
                </div>
            </section>

            {/* How to load balance Section */}
            <section className="how-to-load-section">
                <div className="ht-left">
                    <h3 className="ht-title">Recharge Kochi1 card with your favourite app.</h3>
                    <div className="ht-apps-placeholder">
                        <div className="app-icon-slot"><img src="/images/patym.png" alt="Paytm" /></div>
                        <div className="app-icon-slot"><img src="/images/googlepay.png" alt="Google Pay" /></div>
                        <div className="app-icon-slot"><img src="/images/phonepay.png" alt="PhonePe" /></div>
                        <div className="app-icon-slot"><img src="/images/airtel.png" alt="Airtel" /></div>
                        <div className="app-icon-slot"><img src="/images/bhim.png" alt="BHIM" /></div>
                        <div className="app-icon-slot"><img src="/images/sbi.png" alt="SBI" /></div>
                    </div>
                    <p className="ht-and-many-more">and many more.</p>
                </div>

                <div className="ht-divider"></div>

                <div className="ht-right">
                    <h3 className="ht-title text-center">How to load balance onto the card?</h3>
                    <div className="ht-steps">
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                <img src="/images/step1.png" alt="" />
                            </div>
                            <p>Recharge your card using any app.</p>
                        </div>
                        <div className="ht-step-arrow">→</div>
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                <img src="/images/step2.png" alt="" />
                            </div>
                            <p>Go to any metro ticket counter with your card</p>
                        </div>
                        <div className="ht-step-arrow">→</div>
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                <img src="/images/step3.png" alt="" />
                            </div>
                            <p>Load your card balance by tapping at TOM and EFO counters at the listed stations.</p>
                        </div>
                        <div className="ht-step-arrow">→</div>
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                <img src="/images/step4.png" alt="" />
                            </div>
                            <p>It's done! Travel without hassles.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recharge Modal */}
            <RechargeModal
                isOpen={isRechargeModalOpen}
                onClose={() => setIsRechargeModalOpen(false)}
                card={card}
                token={token}
                onSuccess={handleRechargeSuccess}
            />
        </div>
    );
};

export default Recharge;
