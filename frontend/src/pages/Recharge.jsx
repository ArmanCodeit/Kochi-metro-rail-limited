import React from 'react';
import '../styles/Recharge.css';

// User should place metrocard.png in the assets folder or use public path
// import metroCardImg from '../../assets/metrocard.png';

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
                        <button className="btn-recharge">RECHARGE YOUR CARD</button>
                        <button className="btn-user-guide">USER GUIDE</button>
                    </div>
                </div>
                <div className="hero-image-container">
                    {/* User will add metrocard.png */}
                    <img src="/images/metrocard.png" alt="Metro Card" className="metro-card-img" onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/600x400?text=Metro+Card+Image+Here"; // placeholder fallback
                    }} />
                </div>
            </section>

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
                            {<img src="/images/gate1.png" alt="" />}
                        </div>
                        <h4>Contactless Entry<br /> at All Stations</h4>
                        <p>The Kochi1 Card enables contactless entry at all Kochi Metro stations</p>
                    </div>
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            {<img src="/images/glance.png" alt="" />}
                        </div>
                        <h4>One Card for All<br /> Metro Lines</h4>
                        <p>The same card can also be used across Kochi Water Metro and feeder buses.</p>
                    </div>
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            {<img src="/images/card.png" alt="" />}
                        </div>
                        <h4>Ride Easy with<br /> Kochi1 at KMRL</h4>
                        <p>Kochi1 cards issued by our partner banks are also compatible and rechargeable at all metro stations.</p>
                    </div>
                    <div className="glance-card">
                        <div className="glance-icon-placeholder">
                            {<img src="/images/bus.png" alt="" />}
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
                                {<img src="/images/step1.png" alt="" />}
                            </div>
                            <p>Recharge your card using any app.</p>
                        </div>
                        <div className="ht-step-arrow">→</div>
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                {<img src="/images/step2.png" alt="" />}
                            </div>
                            <p>Go to any metro ticket counter with your card</p>
                        </div>
                        <div className="ht-step-arrow">→</div>
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                {<img src="/images/step3.png" alt="" />}
                            </div>
                            <p>Load your card balance by tapping at TOM and EFO counters at the listed stations.</p>
                        </div>
                        <div className="ht-step-arrow">→</div>
                        <div className="ht-step">
                            <div className="ht-step-circle">
                                {<img src="/images/step4.png" alt="" />}
                            </div>
                            <p>It's done! Travel without hassles.</p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Recharge;
