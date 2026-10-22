import React, { useState, useMemo } from 'react';
import '../../styles/PassengerFacilitiesSection.css';
import { FACILITY_CATEGORIES, PASSENGER_FACILITIES } from '../../data/facilitiesData';

/**
 * Clean SVG Icon Helper (Zero Emojis, strictly professional transit vector icons)
 */
const FacilityIcon = ({ type }) => {
    switch (type) {
        case 'water':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
            );
        case 'restroom':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="10" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            );
        case 'seating':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
                    <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5z" />
                    <path d="M6 18v3" />
                    <path d="M18 18v3" />
                </svg>
            );
        case 'parking':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
                </svg>
            );
        case 'bicycle':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5.5" cy="17.5" r="3.5" />
                    <circle cx="18.5" cy="17.5" r="3.5" />
                    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 11l3-3 3 3-2 6.5" />
                    <path d="M12 17.5V14l4-3h2.5" />
                </svg>
            );
        case 'ticket':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <line x1="6" y1="12" x2="6" y2="12.01" />
                    <line x1="10" y1="12" x2="18" y2="12" />
                </svg>
            );
        case 'wheelchair':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="4.5" r="2.5" />
                    <path d="M9 8h4.5l1.5 5.5h3" />
                    <path d="M10.5 13.5A5.5 5.5 0 1 1 5 19" />
                </svg>
            );
        case 'elevator':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 10l2-2 2 2" />
                    <path d="M12 14l2 2 2-2" />
                </svg>
            );
        case 'tactile':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16M4 12h16M4 18h16" strokeDasharray="3 3" />
                    <circle cx="8" cy="12" r="1.5" fill="currentColor" />
                    <circle cx="16" cy="12" r="1.5" fill="currentColor" />
                </svg>
            );
        case 'accessible_toilet':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="14" cy="5" r="2" />
                    <path d="M12 9h4l1.5 5.5h2.5" />
                    <path d="M9 14.5A4.5 4.5 0 1 1 5 19" />
                    <path d="M5 4v4" />
                </svg>
            );
        case 'priority_seat':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 18h10" />
                    <path d="M5 21v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
                    <path d="M9 11a4 4 0 0 1 6 0v5H9v-5z" />
                    <circle cx="12" cy="4" r="2" />
                </svg>
            );
        case 'cctv':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 10l4-2.5v9L16 14" />
                    <rect x="2" y="7" width="14" height="10" rx="2" />
                    <circle cx="8" cy="12" r="2" />
                </svg>
            );
        case 'sos':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <line x1="12" y1="2" x2="12" y2="4" />
                </svg>
            );
        case 'medical':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
            );
        case 'shield':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                </svg>
            );
        case 'fire':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2c1.5 3 4 4.5 4 8a6 6 0 1 1-12 0c0-3.5 2.5-5 4-8 1 2 2 3 4 3s3-1 4-3z" />
                </svg>
            );
        case 'display':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <line x1="6" y1="8" x2="18" y2="8" />
                    <line x1="6" y1="12" x2="12" y2="12" />
                </svg>
            );
        case 'compass':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
            );
        case 'map':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                    <line x1="8" y1="2" x2="8" y2="18" />
                    <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
            );
        case 'helpdesk':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="10" r="1" />
                    <line x1="12" y1="13" x2="12" y2="13.01" />
                </svg>
            );
        case 'search':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            );
        case 'qrcode':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="3" height="3" />
                    <rect x="18" y="18" width="3" height="3" />
                    <line x1="18" y1="14" x2="21" y2="14" />
                    <line x1="14" y1="18" x2="14" y2="21" />
                </svg>
            );
        case 'card':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
            );
        case 'network':
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
            );
        case 'wifi':
        default:
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                    <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
            );
    }
};

const PassengerFacilitiesSection = () => {
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredFacilities = useMemo(() => {
        if (activeCategory === 'all') return PASSENGER_FACILITIES;
        return PASSENGER_FACILITIES.filter(f => f.category === activeCategory);
    }, [activeCategory]);

    return (
        <section id="facilities-section" className="kmrl-facilities-section">
            <div className="kmrl-facilities-container">
                {/* Header */}
                <div className="kmrl-facilities-header">
                    <div className="kmrl-facilities-pretitle">Kochi Metro Rail</div>
                    <h2 className="kmrl-facilities-title">Comprehensive Passenger Facilities</h2>
                    <p className="kmrl-facilities-desc">
                        Designed with accessibility, passenger comfort, and smart digital transit at its core.
                        Explore our world-class amenities available across the network.
                    </p>
                </div>

                {/* Category Filter Tabs */}
                <div className="kmrl-facilities-tabs">
                    {FACILITY_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            className={`kmrl-cat-tab ${activeCategory === cat.id ? 'is-active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Facilities Cards Grid */}
                <div className="kmrl-facilities-grid">
                    {filteredFacilities.map(facility => (
                        <div key={facility.id} className="kmrl-facility-card">
                            <div>
                                <div className="kmrl-facility-card-top">
                                    <div className="kmrl-facility-icon-wrap">
                                        <FacilityIcon type={facility.iconType} />
                                    </div>
                                    <span className="kmrl-facility-badge">
                                        {facility.badge}
                                    </span>
                                </div>
                                <h3>{facility.title}</h3>
                                <p>{facility.description}</p>
                            </div>

                            <div className="kmrl-facility-footer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{facility.availability}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PassengerFacilitiesSection;
