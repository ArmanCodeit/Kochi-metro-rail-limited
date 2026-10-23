import React, { useState } from 'react';
import '../styles/SignUp.css';

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

const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CircleIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
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

function SignUp({ onNavigate }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        role: 'customer', // 'customer', 'station_master', 'officer'
        designation: '',
        stationAssigned: '',
        passKey: '',
        savePassword: false
    });

    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successModalData, setSuccessModalData] = useState(null);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        const isLongEnough = password.length >= 8;

        return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && isLongEnough;
    };

    const getPasswordStrength = (password) => {
        if (!password) return '';
        if (password.length < 8) return 'Weak';
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

        if (strength <= 1) return 'Weak';
        if (strength <= 2) return 'Fair';
        if (strength <= 3) return 'Good';
        return 'Strong';
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'password') {
            setPasswordStrength(getPasswordStrength(value));
        }

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

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (!validatePassword(formData.password)) {
            newErrors.password = 'Password must meet all 5 security requirements';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (formData.role !== 'customer' && !formData.passKey) {
            newErrors.passKey = 'Pass key is required for station master / officer';
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
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    username: formData.username,
                    userType: formData.role,
                    designation: formData.role !== 'customer' ? formData.designation : null,
                    stationAssigned: formData.role !== 'customer' ? formData.stationAssigned : null,
                    passKey: formData.role !== 'customer' ? formData.passKey : undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                const errorMessage = errData.message || errData.errors?.[0]?.msg || 'Sign up failed due to validation rules. Please check your inputs.';

                setErrors({ submit: errorMessage });
                setLoading(false);
                return;
            }

            const data = await response.json();

            // Successful server signup
            localStorage.setItem('kmrl_token', data.token);
            localStorage.setItem('kmrl_user', JSON.stringify(data.user));

            setSuccessModalData({
                username: data.user?.username || formData.username,
                role: formData.role,
                message: formData.role === 'station_master'
                    ? 'Your Station Master account application has been submitted and is pending approval by a KMRL Officer. You will be able to log in once approved.'
                    : 'Your Kochi Metro account has been created successfully. You can now proceed to login to access your digital metro card, recharges, and tickets.'
            });
        } catch (error) {
            console.error('Sign up error:', error);
            setErrors({ submit: 'Network error — unable to create account. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    };

    // Real-time password requirement checks
    const passwordChecks = {
        length: formData.password.length >= 8,
        upper: /[A-Z]/.test(formData.password),
        lower: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)
    };

    return (
        <div className="signup-page">
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

            {/* ── Main Signup Container ── */}
            <main className="auth-main-container">
                <div className="auth-card-shell signup-card-shell">
                    {/* ── Left Side: Authentic KMRL Transit Showcase ── */}
                    <div className="auth-showcase-side">
                        <div className="showcase-watermark-ring"></div>
                        <div className="showcase-watermark-ring secondary"></div>

                        <div className="showcase-top-badge">
                            <span className="showcase-badge-dot"></span>
                            <span>OFFICIAL PASSENGER REGISTRATION</span>
                        </div>

                        <div className="showcase-hero">
                            <h2 className="showcase-title">Join Kochi Metro Today</h2>
                            <p className="showcase-subtitle">
                                Create your commuter account for paperless ticketing, automated card recharges, travel history, and real-time transit alerts.
                            </p>
                        </div>

                        <div className="showcase-features-list">
                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <CardIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Kochi1 Digital Metro Card</h4>
                                    <p>Get your virtual metro card with instant balance check, top-up, and 10% trip savings.</p>
                                </div>
                            </div>

                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <TicketIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Fast Contactless QR Passes</h4>
                                    <p>Skip station queues with one-click digital QR tickets valid for 5 hours across all lines.</p>
                                </div>
                            </div>

                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <MapIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Interactive Journey Planner</h4>
                                    <p>Accurate transfer guides, platform directions, and fare calculations across 25+ stations.</p>
                                </div>
                            </div>

                            <div className="showcase-feature-item">
                                <div className="feature-icon-bubble">
                                    <ShieldIcon />
                                </div>
                                <div className="feature-text">
                                    <h4>Verified & Secure Services</h4>
                                    <p>Official KMRL encryption safeguarding your personal information and transaction records.</p>
                                </div>
                            </div>
                        </div>

                        <div className="showcase-footer">
                            <span>24-Hour Passenger Helpline: <strong>1800-425-8022</strong></span>
                        </div>
                    </div>

                    {/* ── Right Side: Redesigned Kochi Metro Sign Up Form ── */}
                    <div className="auth-form-side">
                        <div className="auth-form-wrapper">
                            <div className="auth-form-header">
                                <div className="auth-pill-label">NEW PASSENGER</div>
                                <h1>Create Your Account</h1>
                                <p>Join Kochi Metro for a smoother, smarter travel experience.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="auth-form" noValidate>
                                {errors.submit && (
                                    <div className="form-alert-error" role="alert">
                                        <AlertIcon />
                                        <span>{errors.submit}</span>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="fullName">
                                        Full Name <span className="req-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        placeholder="Enter your name"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className={errors.fullName ? 'input-error' : ''}
                                        autoComplete="name"
                                    />
                                    {errors.fullName && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.fullName}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">
                                        Email Address <span className="req-star">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="e.g. commuter@example.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={errors.email ? 'input-error' : ''}
                                        autoComplete="email"
                                    />
                                    {errors.email && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.email}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="username">
                                        Username <span className="req-star">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        placeholder="Choose a unique username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className={errors.username ? 'input-error' : ''}
                                        autoComplete="username"
                                    />
                                    {errors.username && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.username}
                                        </span>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="role">
                                        User Type <span className="req-star">*</span>
                                    </label>
                                    <div className="select-input-wrapper">
                                        <select
                                            id="role"
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className="auth-select"
                                        >
                                            <option value="customer">Customer / Passenger</option>
                                            <option value="station_master">Station Master (Staff)</option>
                                            <option value="officer">KMRL Officer (Admin)</option>
                                        </select>
                                        <span className="select-chevron-icon">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>

                                {/* Conditional Fields for Staff Roles */}
                                {formData.role !== 'customer' && (
                                    <div className="staff-fields-box">
                                        <div className="staff-fields-badge">STAFF CREDENTIALS REQUIRED</div>

                                        <div className="form-group">
                                            <label htmlFor="designation">
                                                Designation <span className="req-star">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="designation"
                                                name="designation"
                                                placeholder="e.g. Senior Station Controller"
                                                value={formData.designation}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="stationAssigned">
                                                Assigned Metro Station <span className="req-star">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="stationAssigned"
                                                name="stationAssigned"
                                                placeholder="e.g. Aluva, Edapally, MG Road"
                                                value={formData.stationAssigned}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="passKey">
                                                KMRL Staff Pass Key <span className="req-star">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                id="passKey"
                                                name="passKey"
                                                placeholder="Enter authorized KMRL pass key"
                                                value={formData.passKey}
                                                onChange={handleInputChange}
                                                className={errors.passKey ? 'input-error' : ''}
                                            />
                                            {errors.passKey && (
                                                <span className="field-error-text">
                                                    <AlertIcon /> {errors.passKey}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="password">
                                        Password <span className="req-star">*</span>
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            placeholder="Create a strong password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={errors.password ? 'input-error' : ''}
                                            autoComplete="new-password"
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

                                    {/* Password Strength Meter */}
                                    {formData.password && (
                                        <div className="strength-meter-wrap">
                                            <div className="strength-meter-track">
                                                <div className={`strength-meter-bar strength-${passwordStrength.toLowerCase()}`}></div>
                                            </div>
                                            <div className="strength-meter-caption">
                                                Security Level: <strong className={`strength-txt-${passwordStrength.toLowerCase()}`}>{passwordStrength}</strong>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5-Rule Checklist Pills */}
                                    <div className="password-rules-box">
                                        <span className="rules-heading">Password Requirements:</span>
                                        <div className="rules-grid">
                                            <span className={`rule-pill ${passwordChecks.length ? 'satisfied' : ''}`}>
                                                {passwordChecks.length ? <CheckIcon /> : <CircleIcon />} 8+ Characters
                                            </span>
                                            <span className={`rule-pill ${passwordChecks.upper ? 'satisfied' : ''}`}>
                                                {passwordChecks.upper ? <CheckIcon /> : <CircleIcon />} Uppercase Letter
                                            </span>
                                            <span className={`rule-pill ${passwordChecks.lower ? 'satisfied' : ''}`}>
                                                {passwordChecks.lower ? <CheckIcon /> : <CircleIcon />} Lowercase Letter
                                            </span>
                                            <span className={`rule-pill ${passwordChecks.number ? 'satisfied' : ''}`}>
                                                {passwordChecks.number ? <CheckIcon /> : <CircleIcon />} Number (0-9)
                                            </span>
                                            <span className={`rule-pill ${passwordChecks.special ? 'satisfied' : ''}`}>
                                                {passwordChecks.special ? <CheckIcon /> : <CircleIcon />} Special Character
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">
                                        Confirm Password <span className="req-star">*</span>
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Re-enter your password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={errors.confirmPassword ? 'input-error' : ''}
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="toggle-password-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <span className="field-error-text">
                                            <AlertIcon /> {errors.confirmPassword}
                                        </span>
                                    )}
                                </div>

                                <div className="remember-checkbox-row">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="savePassword"
                                            checked={formData.savePassword}
                                            onChange={handleInputChange}
                                        />
                                        <span>Save credentials securely on this browser</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="auth-primary-btn"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="btn-spinner-wrap">
                                            <span className="auth-spinner"></span>
                                            Creating Account...
                                        </span>
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>

                                <div className="auth-switch-prompt">
                                    <span>Already have an account?</span>{' '}
                                    <button
                                        type="button"
                                        className="switch-page-link"
                                        onClick={() => onNavigate('signin')}
                                    >
                                        Login Here
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

            {/* ── In-page Success Modal Popup ── */}
            {successModalData && (
                <div 
                    className="signup-success-backdrop" 
                    onClick={() => { setSuccessModalData(null); onNavigate('signin'); }}
                    role="presentation"
                >
                    <div 
                        className="signup-success-modal" 
                        onClick={(e) => e.stopPropagation()} 
                        role="dialog" 
                        aria-modal="true" 
                        aria-labelledby="signup-success-heading"
                    >
                        <button
                            type="button"
                            className="signup-modal-close-btn"
                            onClick={() => { setSuccessModalData(null); onNavigate('signin'); }}
                            aria-label="Close dialog"
                        >
                            &times;
                        </button>

                        <div className="signup-modal-icon-container">
                            <div className="signup-modal-icon-circle">
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#00a859" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>

                        <h2 id="signup-success-heading" className="signup-modal-heading">
                            Account Created Successfully!
                        </h2>

                        <p className="signup-modal-message">
                            {successModalData.message}
                        </p>

                        {successModalData.username && (
                            <div className="signup-modal-user-card">
                                <span className="signup-badge-label">Assigned Username</span>
                                <span className="signup-badge-value">{successModalData.username}</span>
                            </div>
                        )}

                        <div className="signup-modal-actions">
                            <button
                                type="button"
                                className="signup-modal-login-btn"
                                onClick={() => {
                                    setSuccessModalData(null);
                                    onNavigate('signin');
                                }}
                            >
                                Continue to Login
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SignUp;
