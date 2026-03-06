import React from 'react';

const Footer = () => {
    return (
        <footer style={{ background: '#f0f4f8', borderTop: '1px solid #e2e8f0', fontFamily: 'Urbanist, sans-serif' }}>
            {/* Main footer body */}
            <div style={{
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '3rem 2rem 2rem',
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '3rem',
                alignItems: 'flex-start'
            }}>
                {/* Left: Logo + Gov Logos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* KMRL Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src="/images/kmrl-logo.png" alt="KMRL Logo" style={{ height: '72px', width: 'auto' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', letterSpacing: '0.02em', lineHeight: '1.3' }}>Kochi Metro Rail Limited</span>
                    </div>

                    {/* Government Logos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <img src="/images/gov-india.png" alt="Government of India" style={{ height: '40px', width: 'auto' }} />
                        <img src="/images/mygov.png" alt="MyGov" style={{ height: '36px', width: 'auto' }} />
                        <img src="/images/award.png" alt="Award" style={{ height: '40px', width: 'auto' }} />
                    </div>
                </div>

                {/* Right: Link Columns */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '2rem'
                }}>
                    {/* Useful Links */}
                    <div>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Useful links</h4>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['About us', 'Help & Contact', 'Careers', 'News & Updates'].map(link => (
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

            {/* Social Icons Row */}
            <div style={{
                maxWidth: '1300px',
                margin: '0 auto',
                padding: '0 2rem 1.5rem',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '14px',
                alignItems: 'center'
            }}>
                {/* X / Twitter */}
                <a href="#" target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                {/* Facebook */}
                <a href="#" target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                {/* Instagram */}
                <a href="#" target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                {/* LinkedIn */}
                <a href="#" target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
            </div>

            {/* Bottom Bar */}
            <div style={{
                borderTop: '1px solid #cbd5e1',
                background: '#e8edf3',
                padding: '1rem 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                {/* Left: Copyright + meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
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
