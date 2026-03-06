import React, { useState, useEffect } from 'react';
import { generateCaptcha, generateCaptchaImage } from '../utils/captcha';
import '@fontsource/caudex';
import '../styles/SignIn.css';

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

        if (!formData.captcha.trim()) {
            newErrors.captcha = 'Please enter CAPTCHA';
        } else if (formData.captcha.toLowerCase() !== captcha.toLowerCase()) {
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
        <div className="signin-container">
            {/* Left side: Image/Video Area */}
            <div className="signin-media-side">
                <div className="signin-media-overlay"></div>
                <img
                    src="/images/login-img.png"
                    alt="Metro train background"
                    className="signin-image-bg"
                />
            </div>

            {/* Right side: Login Form */}
            <div className="signin-form-side">
                <div className="signin-form-wrapper">
                    <div className="signin-header">
                        <h1>Login</h1>
                        <p>Welcome! Please enter the details to login to account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="signin-form">
                        {errors.submit && <div className="error-message">{errors.submit}</div>}

                        <div className="form-group">
                            <label htmlFor="usernameOrEmail">Email Address or Username</label>
                            <input
                                type="text"
                                id="usernameOrEmail"
                                name="usernameOrEmail"
                                value={formData.usernameOrEmail}
                                onChange={handleInputChange}
                                className={errors.usernameOrEmail ? 'input-error' : ''}
                            />
                            {errors.usernameOrEmail && <span className="error-text">{errors.usernameOrEmail}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
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
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group captcha-group">
                            <label>CAPTCHA</label>
                            <div className="captcha-section">
                                <div className="captcha-image-wrapper">
                                    {captchaImage && <img src={captchaImage} alt="CAPTCHA" />}
                                    <button
                                        type="button"
                                        className="refresh-captcha"
                                        onClick={generateNewCaptcha}
                                        title="Refresh CAPTCHA"
                                    >
                                        🔄
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    name="captcha"
                                    value={formData.captcha}
                                    onChange={handleInputChange}
                                    maxLength="6"
                                    className={`captcha-input ${errors.captcha ? 'input-error' : ''}`}
                                />
                            </div>
                            {errors.captcha && <span className="error-text">{errors.captcha}</span>}
                        </div>

                        <div className="forgot-password">
                            <span className="forgot-text">Forgot Password?</span> <a href="#" onClick={(e) => { e.preventDefault(); alert('Password reset feature coming soon!'); }}>Reset Password</a>
                        </div>

                        <button type="submit" className="btn-signin-submit" disabled={loading}>
                            {loading ? 'Signing in...' : 'Login'}
                        </button>

                        <p className="signup-link">
                            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('signup'); }}>Register Here</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SignIn;
