/**
 * Kochi Metro Rail Limited (KMRL) - Verified Passenger Facilities Dataset
 * Categorized according to passenger convenience, accessibility, safety & assistance,
 * passenger information, and digital services & connectivity.
 */

export const FACILITY_CATEGORIES = [
    { id: 'all', label: 'All Facilities' },
    { id: 'convenience', label: 'Passenger Convenience' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'safety', label: 'Safety & Assistance' },
    { id: 'information', label: 'Passenger Information' },
    { id: 'digital', label: 'Digital Services & Connectivity' }
];

export const PASSENGER_FACILITIES = [
    // ── PASSENGER CONVENIENCE ──
    {
        id: 'drinking-water',
        category: 'convenience',
        title: 'Drinking Water',
        description: 'Complimentary, multi-stage RO purified chilled drinking water fountains installed at concourse and platform levels.',
        availability: 'All 25 Operational Stations',
        iconType: 'water',
        badge: 'Free Service'
    },
    {
        id: 'clean-restrooms',
        category: 'convenience',
        title: 'Restrooms',
        description: 'Hygienic, continuously maintained male, female, and gender-neutral washrooms with touchless sanitary fittings.',
        availability: 'All Stations (Concourse Level)',
        iconType: 'restroom',
        badge: 'Sanitized'
    },
    {
        id: 'seating-lounges',
        category: 'convenience',
        title: 'Seating and Waiting Areas',
        description: 'Ergonomic stainless-steel platform benches and dedicated covered waiting spaces for senior citizens and families.',
        availability: 'All Station Platforms',
        iconType: 'seating',
        badge: 'Available'
    },
    {
        id: 'parking-facilities',
        category: 'convenience',
        title: 'Parking Facilities',
        description: 'Secure, CCTV-monitored two-wheeler and four-wheeler multi-level parking with automated boom-barrier ticketing.',
        availability: 'Aluva, Edappally, JLN Stadium, Vyttila, Tripunithura',
        iconType: 'parking',
        badge: 'Hub Stations'
    },
    {
        id: 'ticket-counters',
        category: 'convenience',
        title: 'Ticket Counters',
        description: 'Staffed customer service ticketing counters providing paper tickets, smart card issuance, and cash/card transaction support.',
        availability: 'All Station Entry Concourses',
        iconType: 'ticket',
        badge: 'Manned Counters'
    },
    {
        id: 'ticket-vending-machines',
        category: 'convenience',
        title: 'Ticket Vending Machines (TVMs)',
        description: 'Fast-track bilingual touch-screen Automatic Ticket Vending Machines (TVMs) accepting cash, UPI, and debit cards.',
        availability: 'All Station Entry Concourses',
        iconType: 'ticket',
        badge: 'Self-Service'
    },
    {
        id: 'bicycle-stands',
        category: 'convenience',
        title: 'Bicycle Stands & Cycle Share',
        description: 'Dedicated bicycle parking bays and public cycle-sharing points supporting sustainable first and last-mile travel.',
        availability: 'Selected Metro Stations',
        iconType: 'bicycle',
        badge: 'Eco-Friendly'
    },

    // ── ACCESSIBILITY (DIVYANGJAN FRIENDLY) ──
    {
        id: 'wheelchair-access',
        category: 'accessibility',
        title: 'Wheelchair Accessibility',
        description: 'Seamless barrier-free travel with step-free street-to-train ramps and complimentary wheelchairs available at customer care.',
        availability: 'All Stations & Trains',
        iconType: 'wheelchair',
        badge: 'Barrier-Free'
    },
    {
        id: 'lifts-escalators',
        category: 'accessibility',
        title: 'Lifts and Escalators',
        description: 'High-capacity sensory elevators with Braille buttons, voice announcements, and bidirectional escalators at all levels.',
        availability: 'Street, Concourse & Platform Levels',
        iconType: 'elevator',
        badge: 'Braille & Audio'
    },
    {
        id: 'tactile-paths',
        category: 'accessibility',
        title: 'Tactile Guidance Paths',
        description: 'Continuous embossed yellow tactile paving from station footpaths directly to train boarding gates for visually impaired riders.',
        availability: 'Entire Network Footprint',
        iconType: 'tactile',
        badge: 'Full Guidance'
    },
    {
        id: 'accessible-toilets',
        category: 'accessibility',
        title: 'Accessible Restrooms',
        description: 'Wide sliding-door accessible restrooms fitted with safety grab bars, low-height washbasins, and emergency pull cords.',
        availability: 'All Station Concourses',
        iconType: 'accessible_toilet',
        badge: 'Specially Equipped'
    },
    {
        id: 'priority-seating',
        category: 'accessibility',
        title: 'Priority Seating',
        description: 'Specially color-coded priority seating areas inside every train coach and on platforms for pregnant women, seniors, and differently abled.',
        availability: 'All Coaches & Platforms',
        iconType: 'priority_seat',
        badge: 'Reserved'
    },

    // ── SAFETY AND ASSISTANCE ──
    {
        id: 'cctv-surveillance',
        category: 'safety',
        title: 'CCTV Surveillance',
        description: 'Over 2,000 high-definition security cameras monitored round-the-clock by KMRL Security and Kerala Police control centres.',
        availability: 'Full Coverage Across Network',
        iconType: 'cctv',
        badge: '24/7 Monitored'
    },
    {
        id: 'emergency-help-points',
        category: 'safety',
        title: 'Emergency Help Points',
        description: 'Two-way emergency call points located at 50-metre intervals along platforms and inside every train coach for instant driver/OCC contact.',
        availability: 'Platforms & Coach Interiors',
        iconType: 'sos',
        badge: 'Instant Response'
    },
    {
        id: 'medical-first-aid',
        category: 'safety',
        title: 'First Aid and Medical Assistance',
        description: 'Automated External Defibrillators (AED), trauma kits, and immediate on-call tie-ups with Ernakulam Medical College & General Hospital.',
        availability: 'All Station Control Rooms',
        iconType: 'medical',
        badge: 'Emergency Ready'
    },
    {
        id: 'security-assistance',
        category: 'safety',
        title: 'Security Assistance',
        description: 'Trained KMRL station marshals, baggage scanners, and Kerala Police personnel deployed across all transit checkpoints.',
        availability: 'Operational 24 Hours',
        iconType: 'shield',
        badge: 'Trained Personnel'
    },
    {
        id: 'fire-safety',
        category: 'safety',
        title: 'Emergency Exit Information',
        description: 'Clearly marked illuminated emergency exits, wide stairwells, smoke management systems, and regular commuter safety drills.',
        availability: 'NFPA & NBC Compliant',
        iconType: 'fire',
        badge: 'Safety Certified'
    },

    // ── PASSENGER INFORMATION ──
    {
        id: 'pids-displays',
        category: 'information',
        title: 'Real-Time Train Information',
        description: 'High-brightness digital LED/LCD countdown boards displaying accurate live train arrivals, delays, and destination info.',
        availability: 'Every Platform & Concourse',
        iconType: 'display',
        badge: 'Live Data'
    },
    {
        id: 'station-wayfinding',
        category: 'information',
        title: 'Station Direction Boards',
        description: 'Clear, high-contrast overhead wayfinding signage in Malayalam and English with international universal transit symbols.',
        availability: 'All Circulation Areas',
        iconType: 'compass',
        badge: 'Bilingual'
    },
    {
        id: 'route-maps',
        category: 'information',
        title: 'Route and Interchange Information',
        description: 'Illuminated multi-line network maps, schematic strip charts, and step-by-step transfer guides at every station and coach doorway.',
        availability: 'All Trains & Stations',
        iconType: 'map',
        badge: 'DMRC Style'
    },
    {
        id: 'train-timings',
        category: 'information',
        title: 'Train Timings',
        description: 'Published first and last train schedules with peak headway of 6 minutes and off-peak headway of 8-10 minutes.',
        availability: '6:00 AM – 10:30 PM Daily',
        iconType: 'display',
        badge: 'Regular Service'
    },
    {
        id: 'lost-and-found',
        category: 'information',
        title: 'Lost and Found Assistance',
        description: 'Centralized KMRL property retrieval registry with online claim verification and prompt return of misplaced passenger items.',
        availability: 'Contact Station Master Desk',
        iconType: 'search',
        badge: 'Verified System'
    },
    {
        id: 'passenger-helpdesk',
        category: 'information',
        title: 'Passenger Help Desk',
        description: 'Centrally located customer assistance booths for route advice, ticketing guidance, senior citizen escort, and tourist inquiries.',
        availability: 'Near Every Main Ticket Hall',
        iconType: 'helpdesk',
        badge: 'Friendly Staff'
    },

    // ── DIGITAL SERVICES AND CONNECTIVITY ──
    {
        id: 'qr-ticketing',
        category: 'digital',
        title: 'Digital Ticketing and QR Tickets',
        description: 'Fast, paperless smartphone QR ticketing supported on WhatsApp, Kochi Metro App, and online platform for instant gate tapping.',
        availability: 'All Automated Fare Collection (AFC) Gates',
        iconType: 'qrcode',
        badge: 'Paperless'
    },
    {
        id: 'smart-card',
        category: 'digital',
        title: 'Metro Card Recharge Assistance',
        description: 'Dedicated support for Kochi1 Smart Card recharges, balance checking, contactless NFC transactions, and trip history ledger.',
        availability: 'Accepted Across Metro & Water Metro',
        iconType: 'card',
        badge: '10% Discount'
    },
    {
        id: 'customer-support',
        category: 'digital',
        title: 'Customer Support',
        description: 'Round-the-clock passenger helpline at 1800-425-8022 and digital grievance redressal portal for swift feedback resolution.',
        availability: '24/7 Toll-Free: 1800-425-8022',
        iconType: 'helpdesk',
        badge: '24/7 Support'
    },
    {
        id: 'multi-modal-links',
        category: 'digital',
        title: 'Nearby Transport Connections',
        description: 'Seamless feeder connectivity linking metro stations directly to KSRTC bus terminals, Kochi Water Metro jetties, and feeder autos.',
        availability: 'Aluva, Edappally, South, Vyttila Hub',
        iconType: 'network',
        badge: 'Connected Hubs'
    },
    {
        id: 'station-wifi',
        category: 'digital',
        title: 'Station Wi-Fi',
        description: 'Complimentary high-speed wireless connectivity for passengers waiting at concourses and boarding platforms.',
        availability: 'All Operational Metro Stations',
        iconType: 'wifi',
        badge: 'Free Access'
    }
];

export default {
    FACILITY_CATEGORIES,
    PASSENGER_FACILITIES
};
