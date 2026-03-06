import React from "react";
import "../styles/HelpAndContact.css";
import KMRLogo from "../assets/KMRlogo.png";
import { Mail01Icon, Location01Icon, ReloadIcon, VolumeHighIcon } from "hugeicons-react";

const HelpAndContact = ({ onNavigate }) => {
    return (
        <div className="contact-page">
            <div className="contact-hero-wrapper">
                <img src="/images/c1.png" alt="Metro Illustration Left" className="hero-img-left" />
                <div className="contact-hero-center">
                    <h1>Get in Touch with Us!</h1>
                    <p>We're here to help and answer any questions you might have. Reach out to us and we'll respond as soon as we can.</p>
                </div>
                <img src="/images/c2.png" alt="Metro Illustration Right" className="hero-img-right" />
            </div>

            <div className="contact-container">
                {/* LEFT: Form Card */}
                <div className="contact-form-card">
                    <h2>Fill this form and we'll get back to you!</h2>
                    <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>

                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name<span>*</span></label>
                                <input type="text" placeholder="First Name" required />
                            </div>
                            <div className="form-group">
                                <label>Last Name<span>*</span></label>
                                <input type="text" placeholder="Last Name" required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Number<span>*</span></label>
                                <div className="phone-input">
                                    <div className="phone-prefix">+91</div>
                                    <input type="tel" placeholder="Contact Number" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>E-Mail Address<span>*</span></label>
                                <input type="email" placeholder="E-Mail Address" required />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Subject<span>*</span></label>
                            <input type="text" placeholder="Start Typing" required />
                        </div>

                        <div className="form-group">
                            <label>Message<span>*</span></label>
                            <textarea rows="4" placeholder="Start Typing" required></textarea>
                        </div>

                        <div className="form-group attachment-group">
                            <label>Add attachment</label>
                            <div className="attachment-box">
                                <label htmlFor="file-upload" className="upload-btn">Upload File</label>
                                <input id="file-upload" type="file" style={{ display: 'none' }} />
                                <span className="attachment-info">PDF, DOC, DOCX, PNG, JPG, JPEG | <strong>Max 5MB</strong></span>
                            </div>
                        </div>

                        <div className="form-footer">
                            <div className="captcha-wrapper">
                                <div className="captcha-input-row">
                                    <div className="captcha-box">
                                        <span className="captcha-text">pWSg</span>
                                    </div>
                                    <input type="text" placeholder="Enter Captcha" required className="captcha-input" />
                                </div>
                                <div className="captcha-icons">
                                    <button type="button" className="icon-btn"><ReloadIcon size={16} color="#64748b" strokeWidth={2} /></button>
                                    <button type="button" className="icon-btn"><VolumeHighIcon size={16} color="#64748b" strokeWidth={2} /></button>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn">Submit</button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: Contact Info elements */}
                <div className="contact-info-side">
                    <img src={KMRLogo} alt="KMRL Logo" className="info-logo" />

                    <div className="info-block" style={{ marginTop: '30px' }}>
                        <h3 className="red-title">Drop us a mail</h3>
                        <div className="info-item">
                            <Mail01Icon size={18} color="#475569" strokeWidth={2} style={{ marginTop: '2px' }} />
                            <a href="mailto:customercare@kochimetro.org">customercare@kochimetro.org</a>
                        </div>
                    </div>

                    <div className="info-block" style={{ marginTop: '40px' }}>
                        <h3 className="dark-title">Registered Office</h3>
                        <div className="info-item location-item">
                            <Location01Icon size={18} color="#475569" strokeWidth={2} style={{ marginTop: '3px', flexShrink: 0 }} />
                            <p>Kochi Metro Rail Limited. JLN Stadium Metro Station, Kaloor, Ernakulam, Kerala 682017</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HelpAndContact;
