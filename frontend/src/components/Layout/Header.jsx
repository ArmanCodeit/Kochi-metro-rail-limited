import React, { useState } from "react";
import "../../styles/Header.css";
import KMRLogo from "../../assets/KMRlogo.png";
import EmergencyImg from "../../assets/emergency.png";

const NAV_ITEMS = [
    { label: "Home", page: "home" },
    { label: "Recharge", page: "recharge" },
    { label: "Facilities", page: null },
    { label: "Plan Your Trip", page: "findmetro" },
    { label: "Help & Contact", page: "help" },
    { label: "Book Ticket", page: "findmetro", highlight: true },
    { label: "FAQ's", page: "faq" },
];

const Header = ({ isAuthenticated = false, user, onLogout, onNavigate, currentPage }) => {
    const [search, setSearch] = useState("");
    const [fetchedName, setFetchedName] = useState("");
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    React.useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('kmrl_token');
            if (isAuthenticated && token) {
                try {
                    const resp = await fetch('/api/user/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.firstName || data.lastName) {
                            setFetchedName(`${data.firstName || ''} ${data.lastName || ''}`.trim());
                        }
                    }
                } catch (err) {
                    console.warn(err);
                }
            }
        };
        fetchUserData();
    }, [isAuthenticated]);

    const fullName = fetchedName || user?.fullName || user?.name || "Nandigam Tarun";
    const initial = fullName.charAt(0).toUpperCase();
    const nav = (page) => { if (page && onNavigate) onNavigate(page); };

    return (
        <header className="main-header">

            {/* ── TOP UTILITY BAR ── */}
            <div className="top-bar">
                <div className="top-left">
                    <span>Follow us on :</span>
                    <div className="social-icons">
                        <span title="Facebook">f</span>
                        <span title="X">𝕏</span>
                        <span title="Instagram">◎</span>
                        <span title="YouTube">▶</span>
                    </div>
                </div>
                <div className="top-right">
                    <span>മലയ</span>
                    <span className="divider">|</span>
                    <span>English</span>
                    <span className="divider">|</span>
                    <span onClick={() => nav(isAuthenticated ? "home" : "signin")}>For Passengers</span>
                    <span className="divider">|</span>
                    <span>For Corporates</span>
                    <span className="divider">|</span>
                    <span className="live-clock" style={{ fontWeight: 600, color: '#0da1a6' }}>
                        {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* ── MAIN HEADER BODY: Left | Middle | Right ── */}
            <div className="header-body">

                {/* ── LEFT: Logo ── */}
                <div className="header-left" onClick={() => nav("home")}>
                    <img
                        src={KMRLogo}
                        alt="Kochi Metro Rail Logo"
                        className="kmr-logo-img"
                    />
                    <div className="logo-text">
                        <span className="logo-title">KOCHI METRO</span>
                        <span className="logo-subtitle">Kochi Metro Rail Limited</span>
                        <span className="logo-tagline">Safe · Smart · Sustainable</span>
                    </div>
                </div>

                {/* ── MIDDLE: Top row + Bottom nav row ── */}
                <div className="header-middle">

                    {/* Row 1: Feedback | Helpline | Search */}
                    <div className="middle-top-row">
                        <button
                            className="feedback-btn"
                            onClick={() => alert("Feedback form coming soon!")}
                        >
                            <span className="feedback-icon">✉</span>
                            For Feedback / Complaints Click Here
                        </button>

                        <img
                            src={EmergencyImg}
                            alt="24 Hour Emergency Helpline"
                            className="emergency-img"
                            onClick={() => alert("Emergency Helpline: 1800-425-8022")}
                            title="24 Hour Emergency Helpline: 1800-425-8022"
                        />

                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                aria-label="Search"
                            />
                            <button aria-label="Submit search" className="search-icon-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="#111" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Navigation links */}
                    <nav className="nav-bar" aria-label="Main navigation">
                        {NAV_ITEMS.map((item) => (
                            <a
                                key={item.label}
                                className={[
                                    "nav-link",
                                    item.highlight ? "nav-highlight" : "",
                                    currentPage === item.page && item.page ? "active" : "",
                                ].filter(Boolean).join(" ")}
                                onClick={() =>
                                    item.page
                                        ? nav(item.page)
                                        : alert(`${item.label} — coming soon`)
                                }
                            >
                                {item.label}
                            </a>
                        ))}
                        {isAuthenticated && (
                            <a
                                className={["nav-link", currentPage === "myaccount" ? "active" : ""].filter(Boolean).join(" ")}
                                onClick={() => nav("myaccount")}
                            >
                                My Account
                            </a>
                        )}
                    </nav>
                </div>

                {/* ── RIGHT: Auth panel ── */}
                <div className="header-right">
                    {isAuthenticated ? (
                        <div className="user-section">
                            <span className="user-name" onClick={() => nav("myaccount")} style={{ cursor: "pointer" }}>
                                {fullName}
                            </span>
                        </div>
                    ) : (
                        <div className="auth-panel">
                            <span className="auth-panel-label">My Account</span>
                            <div className="auth-buttons">
                                <button className="btn-signin" onClick={() => nav("signin")}>
                                    <svg className="auth-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                        <polyline points="10 17 15 12 10 7" />
                                        <line x1="15" y1="12" x2="3" y2="12" />
                                    </svg>
                                    Sign In
                                </button>
                                <button className="btn-signup" onClick={() => nav("signup")}>
                                    <svg className="auth-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                        <line x1="19" y1="8" x2="19" y2="14" />
                                        <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;
