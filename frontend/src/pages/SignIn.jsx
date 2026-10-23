import React, { useState, useEffect } from 'react';
import { generateCaptcha, generateCaptchaImage } from '../utils/captcha';
import '../styles/SignIn.css';

// Crisp inline SVGs
const EyeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const RefreshIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const AlertIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const TicketIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
        <path d="M13 5v2" /><path d="M13 11v2" /><path d="M13 17v2" />
    </svg>
);

const CardIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
        <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
);

const MapIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
);

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

function SignIn({ onNavigate, onLogin }) {
    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: '',
        captcha: ''
    });

    const [captcha, setCaptcha] = useState('');
    const [captchaImage, setCaptchaImage] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        generateNewCaptcha();
    }, []);

    const generateNewCaptcha = () => {
        const newCaptcha = generateCaptcha();
        setCaptcha(newCaptcha);
        setCaptchaImage(generateCaptchaImage(newCaptcha));
        setFormData(prev => ({ ...prev, captcha: '' }));
        setErrors(prev => {
            const next = { ...prev };
            delete next.captcha;
            return next;
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.usernameOrEmail.trim()) {
            newErrors.usernameOrEmail = 'Username or email is required';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        const enteredCaptcha = (formData.captcha || '').trim();
        if (!enteredCaptcha) {
            newErrors.captcha = 'Please enter CAPTCHA';
        } else if (enteredCaptcha.toLowerCase() !== captcha.trim().toLowerCase()) {
            newErrors.captcha = 'CAPTCHA is incorrect';
            generateNewCaptcha();
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailOrUsername: formData.usernameOrEmail,
                    password: formData.password,
                    captcha: formData.captcha
                })
            });

            // handle server error: show server message
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errorMessage = errData.message || errData.errors?.[0]?.msg || 'Sign in failed. Invalid username or password.';
                setErrors({ submit: errorMessage });
                setLoading(false);
                return;
            }

            const data = await response.json();

            // Successful server login
            localStorage.setItem('kmrl_token', data.token);
            localStorage.setItem('kmrl_user', JSON.stringify(data.user));
            onLogin(data.user);

        } catch (error) {
            console.error('Sign in error:', error);
            setErrors({ submit: 'Unable to reach the server. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signin-page">
            {/* ── Top KMRL Brand Bar ── */}
            <header className="auth-top-bar">
                <div className="auth-top-bar-inner">
                    <div className="auth-brand" onClick={() => onNavigate('home')} role="button" tabIndex={0} title="Return to Kochi Metro Home">
                        <img src="/images/kmrl-logo.png" alt="Kochi Metro Rail Limited" className="auth-kmrl-logo" />
                        <div className="auth-brand-text">
                            <span className="auth-brand-title">KOCHI METRO</span>
                            <span className="auth-brand-subtitle">Kochi Metro Rail Limited</span>
                            <span className="auth-brand-tagline">Safe · Smart · Sustainable</span>
                        </div>
                    </div>

                    <div className="auth-top-actions">
                        <button
                            type="button"
                            className="auth-back-btn"
                            onClick={() => onNavigate('home')}
                            aria-label="Back to home page"
                        >
                            <ArrowLeftIcon />
                            <span>Back to Home</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Main Authentication Content ── */}
            <main className="auth-main-container">
                <div className="auth-card-shell">
                    {/* ── Left Side: Authentic KMRL Transit Showcase ── */}
                    <div className="auth-showcase-side">
                        <div className="showcase-watermark-ring"></div>
                        <div className="showcase-watermark-ring secondary"></div>

                        <div className="showcase-top-badge">
                            <span className="showcase-badge-dot"></span>
                            <span>OFFICIAL PASSENGER PORTAL</span>
                        </div>

                        <div className="showcase-hero">
                            <h2 className="showcase-title">Your Journey Starts Here</h2>
                            <p className="showcase-subtitle">
                                Smart, simple and seamless metro travel across Kochi. Access tickets, smart cards, and live services in one place.
                            </p>
                        </div>

                        <div className="showcase-features-list">
                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <TicketIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Instant QR Ticketing</h4>
                                    <p>Book digital journey tickets in seconds without queuing at station counters.</p>
                                </div>
                            </div>

                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <CardIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Kochi1 Smart Card</h4>
                                    <p>Manage your virtual card, enjoy 10% trip discounts, and quick balance reload.</p>
                                </div>
                            </div>

                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <MapIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Multi-Line Route Planner</h4>
                                    <p>Live schematic route maps, interchange calculations, and accurate transit schedules.</p>
                                </div>
                            </div>

                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <ShieldIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Secure Government Portal</h4>
                                    <p>KMRL high-grade authentication ensuring complete commuter data privacy.</p>
                                </div>
                            </div>
                        </div>

                        <div className="showcase-footer">
                            <span>24-Hour Passenger Helpline: <strong>1800-425-8022</strong></span>
                        </div>
                    </div>

                    {/* ── Right Side: Redesigned Kochi Metro Sign In Form ── */}
                    <div className="auth-form-side">
                        <div className="auth-form-wrapper">
                            <div className="auth-form-header">
                                <div className="auth-pill-label">COMMUTER LOGIN</div>
                                <h1>Welcome Back</h1>
                                <p>Sign in to continue your Kochi Metro experience.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="auth-form" noValidate>
                                {errors.submit && (
                                    <div className="form-alert-error" role="alert">
                                        <AlertIcon />
                                        <span>{errors.submit}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="usernameOrEmail">
                                        Email Address or Username <span className="req-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="usernameOrEmail"
                                        name="usernameOrEmail"
                                        placeholder="e.g. commuter@example.com or username"
                                        value={formData.usernameOrEmail}
                                        onChange={handleInputChange}
                                        className={errors.usernameOrEmail ? 'input-error' : ''}
                                        autoComplete="username"
                                    />
                                    {errors.usernameOrEmail && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.usernameOrEmail}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password">
                                        Password <span className="req-star">*</span>
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            placeholder="Enter your password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={errors.password ? 'input-error' : ''}
                                            autoComplete="current-password"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.password}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group captcha-group">
                                    <label>
                                        Security Verification (CAPTCHA) <span className="req-star">*</span>
                                    </label>
                                    <div className="captcha-row">
                                        <div className="captcha-card-frame">
                                            {captchaImage && <img src={captchaImage} alt="Security CAPTCHA Code" />}
                                        </div>
                                        <button
                                            type="button"
                                            className="refresh-captcha-btn"
                                            onClick={generateNewCaptcha}
                                            title="Refresh CAPTCHA"
                                            aria-label="Refresh CAPTCHA"
                                        >
                                            <RefreshIcon />
                                        </button>
                                        <input
                                            type="text"
                                            name="captcha"
                                            placeholder="Enter code"
                                            value={formData.captcha}
                                            onChange={handleInputChange}
                                            maxLength="6"
                                            className={`captcha-code-input ${errors.captcha ? 'input-error' : ''}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {errors.captcha && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.captcha}
                                        </span>
                                    )}
                                </div>

                                <div className="form-links-row">
                                    <span className="forgot-prompt">Forgot your password?</span>
                                    <button
                                        type="button"
                                        className="inline-link-btn"
                                        onClick={() => alert('Password reset feature coming soon!')}
                                    >
                                        Reset Password
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-primary-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="btn-spinner-wrap">
                                            <span className="auth-spinner"></span>
                                            Signing In...
                                        </span>
                                    ) : (
                                        'Login to Account'
                                    )}
                                </button>

                                <div className="auth-switch-prompt">
                                    <span>Don't have a Kochi Metro account?</span>{' '}
                                    <button
                                        type="button"
                                        className="switch-page-link"
                                        onClick={() => onNavigate('signup')}
                                    >
                                        Register Here
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── Subtle Bottom Footer ── */}
            <footer className="auth-bottom-footer">
                <p>© {new Date().getFullYear()} Kochi Metro Rail Limited. All rights reserved. • Safe · Smart · Sustainable</p>
            </footer>
        </div>
    );
}

export default SignIn;
