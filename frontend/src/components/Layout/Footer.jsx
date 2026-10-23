import React from 'react';

const Footer = () => {
    return (
        <footer className="kmrl-footer" style={{ background: '#f0f4f8', borderTop: '1px solid #e2e8f0', fontFamily: 'Urbanist, sans-serif' }}>
            <style>{`
                .footer-main-grid {
                    max-width: 1300px;
                    margin: 0 auto;
                    padding: 3rem 2rem 2rem;
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 3rem;
                    align-items: flex-start;
                }
                .footer-links-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2rem;
                }
                .footer-bottom-bar {
                    border-top: 1px solid #cbd5e1;
                    background: #e8edf3;
                    padding: 1rem 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }
                @media (max-width: 900px) {
                    .footer-main-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                        padding: 2rem 1.25rem 1.5rem;
                    }
                    .footer-links-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 1.5rem;
                    }
                }
                @media (max-width: 600px) {
                    .footer-main-grid {
                        padding: 1.5rem 1rem;
                    }
                    .footer-links-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1.2rem;
                    }
                    .footer-bottom-bar {
                        padding: 1rem;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.75rem;
                    }
                }
                @media (max-width: 380px) {
                    .footer-links-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
            {/* Main footer body */}
            <div className="footer-main-grid">
                {/* Left: Logo + Gov Logos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* KMRL Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <img src="/images/kmrl-logo.png" alt="KMRL Logo" style={{ height: '64px', maxWidth: '100%', width: 'auto' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.02em', lineHeight: '1.3' }}>Kochi Metro Rail Limited</span>
                    </div>

                    {/* Government Logos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <img src="/images/gov-india.png" alt="Government of India" style={{ height: '36px', width: 'auto' }} />
                        <img src="/images/mygov.png" alt="MyGov" style={{ height: '32px', width: 'auto' }} />
                        <img src="/images/award.png" alt="Award" style={{ height: '36px', width: 'auto' }} />
                    </div>
                </div>

                {/* Right: Link Columns */}
                <div className="footer-links-grid">
                    {/* Useful Links */}
                    <div>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Useful links</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['About us', 'Careers', 'News & Updates'].map(link => (
                                <li key={link}>
                                    <a href="#" style={{ color: '#334155', fontSize: '0.95rem', textDecoration: 'none', fontWeight: '400', transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.target.style.color = '#0066b3'}
                                        onMouseLeave={e => e.target.style.color = '#334155'}
                                    >{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Important Links */}
                    <div>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Important links</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['Guidelines', 'FAQs', 'Security', 'Vigilance'].map(link => (
                                <li key={link}>
                                    <a href="#" style={{ color: '#334155', fontSize: '0.95rem', textDecoration: 'none', fontWeight: '400', transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.target.style.color = '#0066b3'}
                                        onMouseLeave={e => e.target.style.color = '#334155'}
                                    >{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legal</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['Privacy policy', 'Disclaimer', 'Web Information Manager'].map(link => (
                                <li key={link}>
                                    <a href="#" style={{ color: '#334155', fontSize: '0.95rem', textDecoration: 'none', fontWeight: '400', transition: 'color 0.2s' }}
                                        onMouseEnter={e => e.target.style.color = '#0066b3'}
                                        onMouseLeave={e => e.target.style.color = '#334155'}
                                    >{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="footer-bottom-bar">
                {/* Left: Copyright + meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        © 2025 <strong>KMRL</strong> All Rights Reserved
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <strong>LAST UPDATED :</strong> FEB 20, 2026
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        <strong>VISITOR NO.</strong> 851809
                    </span>
                </div>

                {/* Right: Designed by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#475569' }}>
                    <span>Designed &amp; Developed by</span>
                    <img src="/images/arohatech.png" alt="ArohaTech" style={{ height: '24px', width: 'auto' }} />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
