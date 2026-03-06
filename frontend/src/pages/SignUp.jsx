import React, { useState } from 'react';
import '@fontsource/caudex';
import '../styles/SignUp.css';

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
            newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
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
                // Server returned an error — parse message if available
                const errData = await response.json().catch(() => ({}));
                const errorMessage = errData.message || errData.errors?.[0]?.msg || 'Sign up failed due to validation rules. Please check your inputs.';

                setErrors({ submit: errorMessage });
                return;
            }

            const data = await response.json();

            // Successful server signup
            localStorage.setItem('kmrl_token', data.token);
            localStorage.setItem('kmrl_user', JSON.stringify(data.user));
            // Notify user with username (and remind about password they entered)
            if (formData.role === 'station_master') {
                alert(`Account created successfully!\nUsername: ${formData.username}\n\nYour Station Master account has been submitted and is Pending Approval by a KMRL Officer. You can log in once it is approved.`);
            } else {
                alert(`Account created successfully!\nUsername: ${formData.username}\nPlease remember your password (the one you entered).`);
            }
            onNavigate('signin');
        } catch (error) {
            console.error('Sign up error:', error);
            // Network error — create a local demo user as fallback (silent, no blocking alert)
            try {
                const demoUsers = JSON.parse(localStorage.getItem('kmrl_demo_users') || '[]');
                const demoUser = {
                    id: 'demo-' + Date.now(),
                    fullName: formData.fullName,
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                    userType: formData.role
                };
                demoUsers.push(demoUser);
                localStorage.setItem('kmrl_demo_users', JSON.stringify(demoUsers));
                alert(`Network unreachable — demo account created locally.\nUsername: ${demoUser.username}\nPassword: ${demoUser.password}`);
                onNavigate('signin');
                return;
            } catch (e) {
                setErrors({ submit: 'Network error — unable to create account. Please try again later.' });
            }
        }
    };

    return (
        <div className="signup-container">
            {/* Left side: Image/Video Area */}
            <div className="signup-media-side">
                <div className="signup-media-overlay"></div>
                <img
                    src="/images/login-img.png"
                    alt="Metro train background"
                    className="signup-image-bg"
                />
            </div>

            {/* Right side: Registration Form */}
            <div className="signup-form-side">
                <div className="signup-form-wrapper">
                    <div className="signup-header">
                        <h1>Create Account</h1>
                        <p>Welcome! Please join KMRL Metro to continue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="signup-form">
                        {errors.submit && <div className="error-message">{errors.submit}</div>}

                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className={errors.fullName ? 'input-error' : ''}
                            />
                            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={errors.email ? 'input-error' : ''}
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className={errors.username ? 'input-error' : ''}
                            />
                            {errors.username && <span className="error-text">{errors.username}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">User Type *</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="form-select"
                            >
                                <option value="customer">👤 Customer / Passenger</option>
                                <option value="station_master">🚇 Station Master</option>
                            </select>
                        </div>

                        {formData.role !== 'customer' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="designation">Designation *</label>
                                    <input
                                        type="text"
                                        id="designation"
                                        name="designation"
                                        value={formData.designation}
                                        onChange={handleInputChange}
                                        placeholder="Enter your designation"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="stationAssigned">Assigned Station/Area *</label>
                                    <input
                                        type="text"
                                        id="stationAssigned"
                                        name="stationAssigned"
                                        value={formData.stationAssigned}
                                        onChange={handleInputChange}
                                        placeholder="Enter assigned station or area"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="passKey">Pass Key (for verification) *</label>
                                    <input
                                        type="text"
                                        id="passKey"
                                        name="passKey"
                                        value={formData.passKey || ''}
                                        onChange={handleInputChange}
                                        placeholder="Enter pass key provided by admin"
                                    />
                                    {errors.passKey && <span className="error-text">{errors.passKey}</span>}
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter password"
                                    className={errors.password ? 'input-error' : ''}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {formData.password && (
                                <div className={`strength-indicator strength-${passwordStrength.toLowerCase()}`}>
                                    Strength: <strong>{passwordStrength}</strong>
                                </div>
                            )}
                            <div className="password-requirements">
                                <p>Password must contain:</p>
                                <ul>
                                    <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                                        ✓ Uppercase letter
                                    </li>
                                    <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                                        ✓ Lowercase letter
                                    </li>
                                    <li className={/[0-9]/.test(formData.password) ? 'valid' : ''}>
                                        ✓ Number
                                    </li>
                                    <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'valid' : ''}>
                                        ✓ Special character
                                    </li>
                                    <li className={formData.password.length >= 8 ? 'valid' : ''}>
                                        ✓ At least 8 characters
                                    </li>
                                </ul>
                            </div>
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm password"
                                    className={errors.confirmPassword ? 'input-error' : ''}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>

                        <div className="form-group checkbox">
                            <input
                                type="checkbox"
                                id="savePassword"
                                name="savePassword"
                                checked={formData.savePassword}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="savePassword">Save password securely</label>
                        </div>

                        <button type="submit" className="btn-create-account">
                            Create Account
                        </button>

                        <p className="signin-link">
                            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('signin'); }}>Login Here</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
