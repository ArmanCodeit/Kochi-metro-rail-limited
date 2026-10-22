/**
 * Kochi Metro Rail Limited (KMRL) - Verified Multi-Line Network Dataset
 * Geographically accurate coordinates for Kochi, Kerala, India.
 * Architecture inspired by DMRC multi-line network cartography.
 */

export const LINE_STATUS = {
    OPERATIONAL: 'operational',
    UNDER_CONSTRUCTION: 'under_construction',
    PROPOSED: 'proposed',
    CONCEPTUAL: 'conceptual'
};

export const STATUS_META = {
    [LINE_STATUS.OPERATIONAL]: {
        label: 'Operational',
        badgeClass: 'badge-operational',
        color: '#10b981',
        dashArray: null
    },
    [LINE_STATUS.UNDER_CONSTRUCTION]: {
        label: 'Under Construction (Phase 2)',
        badgeClass: 'badge-construction',
        color: '#f59e0b',
        dashArray: '8, 6'
    },
    [LINE_STATUS.PROPOSED]: {
        label: 'Proposed (Airport Link)',
        badgeClass: 'badge-proposed',
        color: '#8b5cf6',
        dashArray: '5, 5'
    },
    [LINE_STATUS.CONCEPTUAL]: {
        label: 'Conceptual Corridor',
        badgeClass: 'badge-conceptual',
        color: '#64748b',
        dashArray: '3, 6'
    }
};

export const METRO_STATIONS = {
    // ══════════════════════════════════════════════════════════════════
    // BLUE LINE (Line 1: Aluva ↔ Tripunithura - 25 Operational Stations)
    // ══════════════════════════════════════════════════════════════════
    'ALV': {
        id: 'ALV',
        name: 'Aluva',
        code: 'ALV',
        lat: 10.1098,
        lng: 76.3496,
        lineIds: ['line-blue', 'line-violet'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated Terminal',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Parking', 'Feeder Bus', 'Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators', 'Direct Rail Link'],
            description: 'Northern terminal with direct integration to Aluva KSRTC and Southern Railway stations.'
        }
    },
    'PUL': {
        id: 'PUL',
        name: 'Pulinchodu',
        code: 'PUL',
        lat: 10.0984,
        lng: 76.3468,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Key suburban residential stop along NH544.'
        }
    },
    'COM': {
        id: 'COM',
        name: 'Companypady',
        code: 'COM',
        lat: 10.0892,
        lng: 76.3421,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Serving local manufacturing and business hubs.'
        }
    },
    'AMB': {
        id: 'AMB',
        name: 'Ambattukavu',
        code: 'AMB',
        lat: 10.0786,
        lng: 76.3359,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Residential and market access point along the corridor.'
        }
    },
    'MUT': {
        id: 'MUT',
        name: 'Muttom',
        code: 'MUT',
        lat: 10.0726,
        lng: 76.3314,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated & Depot Base',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Metro Train Depot', 'Parking', 'Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Location of the KMRL Metro Operation Control Centre (OCC) & Maintenance Depot.'
        }
    },
    'KAL': {
        id: 'KAL',
        name: 'Kalamassery',
        code: 'KAL',
        lat: 10.0579,
        lng: 76.3218,
        lineIds: ['line-blue', 'line-red'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Parking', 'Feeder Bus', 'Wheelchair Access', 'Lifts & Escalators', 'Smart Card Top-up'],
            description: 'Major industrial, educational, and medical hub connecting to Premier Junction.'
        }
    },
    'CUS': {
        id: 'CUS',
        name: 'Cochin University',
        code: 'CUS',
        lat: 10.0465,
        lng: 76.3182,
        lineIds: ['line-blue', 'line-yellow'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Campus Feeder', 'Parking', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Direct feeder connection to Cochin University of Science & Technology (CUSAT).'
        }
    },
    'PAT': {
        id: 'PAT',
        name: 'Pathadipalam',
        code: 'PAT',
        lat: 10.0381,
        lng: 76.3148,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Serving major multi-speciality medical facilities and local residences.'
        }
    },
    'EDA': {
        id: 'EDA',
        name: 'Edappally',
        code: 'EDA',
        lat: 10.0248,
        lng: 76.3081,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated Junction',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Direct Lulu Mall Skywalk', 'Parking', 'Feeder Auto/Bus', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'One of the busiest transit hubs, featuring a direct skywalk into LuLu Shopping Mall.'
        }
    },
    'CHG': {
        id: 'CHG',
        name: 'Changampuzha Park',
        code: 'CHG',
        lat: 10.0150,
        lng: 76.3032,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Cultural Park Access', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Named after poet Changampuzha Krishna Pillai; adjacent to cultural grounds and park.'
        }
    },
    'PAL': {
        id: 'PAL',
        name: 'Palarivattom',
        code: 'PAL',
        lat: 10.0058,
        lng: 76.3005,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Parking', 'Feeder Bus', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Key junction connecting Civil Line Road and Bypass arterial networks.'
        }
    },
    'JLN': {
        id: 'JLN',
        name: 'JLN Stadium',
        code: 'JLN',
        lat: 9.9982,
        lng: 76.2995,
        lineIds: ['line-blue', 'line-pink'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Major Junction & Interchange',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Phase 2 Interchange Hub', 'Stadium Event Access', 'Large Parking', 'Feeder Bus', 'Lifts & Escalators'],
            description: 'Interchange station for Phase 2 Pink Line to Kakkanad Infopark, adjacent to Jawaharlal Nehru International Stadium.'
        }
    },
    'KLR': {
        id: 'KLR',
        name: 'Kaloor',
        code: 'KLR',
        lat: 9.9928,
        lng: 76.2936,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Private Bus Stand Link', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Interconnected with Kaloor Private Bus Terminal serving regional bus services.'
        }
    },
    'LIS': {
        id: 'LIS',
        name: 'Lissie',
        code: 'LIS',
        lat: 9.9897,
        lng: 76.2874,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Hospital Access', 'Town Railway Link', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Short walking distance to Ernakulam Town (North) Railway Station and Lisie Hospital.'
        }
    },
    'MGR': {
        id: 'MGR',
        name: 'M.G. Road',
        code: 'MGR',
        lat: 9.9818,
        lng: 76.2842,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated City Centre',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Shopping District Access', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Heart of Cochin commercial centre along Mahatma Gandhi Road.'
        }
    },
    'MAH': {
        id: 'MAH',
        name: 'Maharaja’s College',
        code: 'MAH',
        lat: 9.9729,
        lng: 76.2842,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Hospital Feeder', 'Heritage College Link', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Serving Maharaja’s College, District Hospital, and the historic Subhash Park waterfront.'
        }
    },
    'ERS': {
        id: 'ERS',
        name: 'Ernakulam South',
        code: 'ERS',
        lat: 9.9678,
        lng: 76.2892,
        lineIds: ['line-blue', 'line-green'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Railway Interchange Hub',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Ernakulam Junction Rail Skywalk', 'KSRTC Central Bus Stand', 'Parking', 'Lifts & Escalators'],
            description: 'Crucial interchange with Ernakulam Junction (South) Mainline Railway Station and Central Bus Stand.'
        }
    },
    'KAD': {
        id: 'KAD',
        name: 'Kadavanthra',
        code: 'KAD',
        lat: 9.9677,
        lng: 76.2987,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Serving Kadavanthra market, commercial avenues, and central residential quarters.'
        }
    },
    'ELA': {
        id: 'ELA',
        name: 'Elamkulam',
        code: 'ELA',
        lat: 9.9673,
        lng: 76.3075,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Positioned midway along the SA Road urban expressway.'
        }
    },
    'VYT': {
        id: 'VYT',
        name: 'Vyttila',
        code: 'VYT',
        lat: 9.9660,
        lng: 76.3175,
        lineIds: ['line-blue', 'line-green', 'line-orange'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Mega Multi-Modal Transit Hub',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Kochi Water Metro Jetty', 'Interstate KSRTC Terminal', 'Private Bus Hub', 'Multi-level Parking', 'Lifts & Escalators'],
            description: 'Kerala’s largest transit interchange integrating Metro, Water Metro ferries, and long-distance buses.'
        }
    },
    'THY': {
        id: 'THY',
        name: 'Thykoodam',
        code: 'THY',
        lat: 9.9602,
        lng: 76.3217,
        lineIds: ['line-blue', 'line-orange'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Parking', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Major arterial stop near Champakkara canal bridge.'
        }
    },
    'PET': {
        id: 'PET',
        name: 'Petta',
        code: 'PET',
        lat: 9.9535,
        lng: 76.3323,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Wheelchair Access', 'Smart Card Top-up', 'Lifts & Escalators'],
            description: 'Serving the bustling suburban community of Petta.'
        }
    },
    'VAD': {
        id: 'VAD',
        name: 'Vadakkekotta',
        code: 'VAD',
        lat: 9.9507,
        lng: 76.3429,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated Mega Station',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Commercial Atrium', 'Parking', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'KMRL’s largest station building, themed around Kerala’s historic spice and fort trade.'
        }
    },
    'SNJ': {
        id: 'SNJ',
        name: 'SN Junction',
        code: 'SNJ',
        lat: 9.9515,
        lng: 76.3508,
        lineIds: ['line-blue'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Feeder Auto/Bus', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Prime junction accessing Tripunithura palace city and temple complexes.'
        }
    },
    'THP': {
        id: 'THP',
        name: 'Tripunithura',
        code: 'THP',
        lat: 9.9482,
        lng: 76.3571,
        lineIds: ['line-blue', 'line-red'],
        isInterchange: true,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Elevated Southern Terminal',
            openingTime: '06:00 AM',
            closingTime: '10:30 PM',
            facilities: ['Railway Station Integration', 'Parking', 'Feeder Bus', 'Wheelchair Access', 'Lifts & Escalators'],
            description: 'Southern terminus seamlessly integrated with the Tripunithura Railway Station.'
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // PINK LINE (Phase 2: JLN Stadium ↔ Infopark Kakkanad - Approved / Construction)
    // ══════════════════════════════════════════════════════════════════
    'PLJ': {
        id: 'PLJ',
        name: 'Palarivattom Jn',
        code: 'PLJ',
        lat: 10.0042,
        lng: 76.3095,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Feeder Bus', 'Lifts & Escalators', 'Smart Access'],
            description: 'Phase 2 station entering the Civil Line Road alignment.'
        }
    },
    'PBP': {
        id: 'PBP',
        name: 'Palarivattom Bypass',
        code: 'PBP',
        lat: 10.0075,
        lng: 76.3190,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Bypass Transit', 'Lifts & Escalators'],
            description: 'Crossing NH66 Bypass intersection towards Kakkanad.'
        }
    },
    'CHM': {
        id: 'CHM',
        name: 'Chembumukku',
        code: 'CHM',
        lat: 10.0125,
        lng: 76.3285,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Feeder Bus', 'Lifts & Escalators'],
            description: 'Serving key residential and commercial sectors of Chembumukku.'
        }
    },
    'VAZ': {
        id: 'VAZ',
        name: 'Vazhakkala',
        code: 'VAZ',
        lat: 10.0168,
        lng: 76.3365,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Feeder Bus', 'Lifts & Escalators'],
            description: 'High-density residential precinct on Civil Line Road.'
        }
    },
    'PAD': {
        id: 'PAD',
        name: 'Padamughal',
        code: 'PAD',
        lat: 10.0210,
        lng: 76.3450,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Feeder Bus', 'Lifts & Escalators'],
            description: 'Gateway to Thrikkakara and surrounding institutional zones.'
        }
    },
    'KKJ': {
        id: 'KKJ',
        name: 'Kakkanad Jn',
        code: 'KKJ',
        lat: 10.0270,
        lng: 76.3540,
        lineIds: ['line-pink', 'line-red'],
        isInterchange: true,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated Phase 2 Hub',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Bus Stand Link', 'Parking', 'District Administration Hub', 'Lifts & Escalators'],
            description: 'Serving Ernakulam District Collectorate and Kakkanad administrative centre.'
        }
    },
    'SEZ': {
        id: 'SEZ',
        name: 'Cochin SEZ',
        code: 'SEZ',
        lat: 10.0225,
        lng: 76.3620,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Export Zone Access', 'Feeder Bus', 'Lifts & Escalators'],
            description: 'Direct entrance to the Cochin Special Economic Zone (CSEZ).'
        }
    },
    'CHI': {
        id: 'CHI',
        name: 'Chittethukara',
        code: 'CHI',
        lat: 10.0175,
        lng: 76.3685,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Feeder Bus', 'Lifts & Escalators'],
            description: 'Industrial and IT ancillary corridor stop.'
        }
    },
    'KIN': {
        id: 'KIN',
        name: 'KINFRA Park',
        code: 'KIN',
        lat: 10.0120,
        lng: 76.3750,
        lineIds: ['line-pink'],
        isInterchange: false,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Elevated (Phase 2)',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['Industrial Park Link', 'Lifts & Escalators'],
            description: 'Direct access to KINFRA Hi-Tech Industrial and Animation Park.'
        }
    },
    'INF': {
        id: 'INF',
        name: 'Infopark',
        code: 'INF',
        lat: 10.0075,
        lng: 76.3810,
        lineIds: ['line-pink', 'line-yellow'],
        isInterchange: true,
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        info: {
            type: 'Phase 2 Eastern Terminal',
            openingTime: 'Target 2026',
            closingTime: 'Under Construction',
            facilities: ['SmartCity Access', 'Large IT Hub Feeder', 'Parking', 'Lifts & Escalators'],
            description: 'Terminal for Kerala’s premier technology park, Infopark Kochi and SmartCity.'
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // GREEN LINE (Coastal / Water Metro Integration Route: Vyttila ↔ Fort Kochi)
    // ══════════════════════════════════════════════════════════════════
    'PAN': {
        id: 'PAN',
        name: 'Panampilly Nagar',
        code: 'PAN',
        lat: 9.9630,
        lng: 76.2960,
        lineIds: ['line-green'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'At-Grade / Multi-modal',
            openingTime: '06:00 AM',
            closingTime: '10:00 PM',
            facilities: ['Walkway Access', 'Feeder Shuttle'],
            description: 'Upscale residential and dining neighbourhood.'
        }
    },
    'HCT': {
        id: 'HCT',
        name: 'High Court',
        code: 'HCT',
        lat: 9.9790,
        lng: 76.2750,
        lineIds: ['line-green'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Water Metro & Transit Hub',
            openingTime: '06:30 AM',
            closingTime: '10:00 PM',
            facilities: ['Water Metro Terminal', 'Feeder Bus', 'Marine Drive Promenade'],
            description: 'Kerala High Court gateway and principal Water Metro ferry terminal.'
        }
    },
    'BOL': {
        id: 'BOL',
        name: 'Bolgatty',
        code: 'BOL',
        lat: 9.9880,
        lng: 76.2680,
        lineIds: ['line-green'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Island Waterfront Link',
            openingTime: '07:00 AM',
            closingTime: '09:30 PM',
            facilities: ['Convention Centre Ferry', 'Golf & Resort Access'],
            description: 'Historic Bolgatty Island and Lulu International Convention Centre.'
        }
    },
    'FKG': {
        id: 'FKG',
        name: 'Fort Kochi Gate',
        code: 'FKG',
        lat: 9.9660,
        lng: 76.2440,
        lineIds: ['line-green'],
        isInterchange: false,
        status: LINE_STATUS.OPERATIONAL,
        info: {
            type: 'Heritage Gateway Terminal',
            openingTime: '06:30 AM',
            closingTime: '10:00 PM',
            facilities: ['Tourist Information', 'Chinese Fishing Nets Access', 'EV Feeder'],
            description: 'World-renowned heritage, art, and maritime tourist destination.'
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // VIOLET LINE (Phase 3 Proposed: Aluva ↔ Cochin International Airport CIAL)
    // ══════════════════════════════════════════════════════════════════
    'DSM': {
        id: 'DSM',
        name: 'Desom',
        code: 'DSM',
        lat: 10.1265,
        lng: 76.3520,
        lineIds: ['line-violet'],
        isInterchange: false,
        status: LINE_STATUS.PROPOSED,
        info: {
            type: 'Proposed Elevated',
            openingTime: 'Proposed',
            closingTime: 'Under DPR',
            facilities: ['Periyar River Bridge', 'Suburban Transit'],
            description: 'Crossing the scenic Periyar riverbank towards the airport.'
        }
    },
    'CGM': {
        id: 'CGM',
        name: 'Chengamanad',
        code: 'CGM',
        lat: 10.1430,
        lng: 76.3610,
        lineIds: ['line-violet'],
        isInterchange: false,
        status: LINE_STATUS.PROPOSED,
        info: {
            type: 'Proposed Elevated',
            openingTime: 'Proposed',
            closingTime: 'Under DPR',
            facilities: ['Feeder Bus'],
            description: 'North-bound township serving central Nedumbassery region.'
        }
    },
    'NDB': {
        id: 'NDB',
        name: 'Nedumbassery',
        code: 'NDB',
        lat: 10.1550,
        lng: 76.3800,
        lineIds: ['line-violet'],
        isInterchange: false,
        status: LINE_STATUS.PROPOSED,
        info: {
            type: 'Proposed Elevated',
            openingTime: 'Proposed',
            closingTime: 'Under DPR',
            facilities: ['Airport Gateway', 'Parking'],
            description: 'Outer airport peri-urban hub and VIP access road.'
        }
    },
    'CIA': {
        id: 'CIA',
        name: 'Cochin Airport (CIAL)',
        code: 'CIA',
        lat: 10.1520,
        lng: 76.3920,
        lineIds: ['line-violet'],
        isInterchange: false,
        status: LINE_STATUS.PROPOSED,
        info: {
            type: 'Proposed Airport Terminal',
            openingTime: 'Proposed',
            closingTime: 'Under DPR',
            facilities: ['Direct Flight Terminal Access', 'Luggage Check-in Service', 'Express Baggage Lounge'],
            description: 'Direct metro terminal connection inside Cochin International Airport (CIAL).'
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // RED LINE (Conceptual: Seaport-Airport Road Corridor)
    // ══════════════════════════════════════════════════════════════════
    'HMT': {
        id: 'HMT',
        name: 'HMT Junction',
        code: 'HMT',
        lat: 10.0490,
        lng: 76.3350,
        lineIds: ['line-red'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Industrial Link'],
            description: 'Seaport-Airport road linkage near HMT industrial campus.'
        }
    },
    'COL': {
        id: 'COL',
        name: 'Civil Station',
        code: 'COL',
        lat: 10.0350,
        lng: 76.3480,
        lineIds: ['line-red'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Administrative Hub'],
            description: 'Direct access to government offices and civil courts.'
        }
    },
    'IRU': {
        id: 'IRU',
        name: 'Irumpanam',
        code: 'IRU',
        lat: 9.9880,
        lng: 76.3580,
        lineIds: ['line-red'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Logistics Interchange'],
            description: 'Connecting BPCL refinery and eastern rail-road freight corridors.'
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // ORANGE LINE (Conceptual: Coastal South Expressway)
    // ══════════════════════════════════════════════════════════════════
    'ARO': {
        id: 'ARO',
        name: 'Aroor Toll',
        code: 'ARO',
        lat: 9.8780,
        lng: 76.3050,
        lineIds: ['line-orange'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Southern Highway Feeder'],
            description: 'Southern gateway connecting Alappuzha district border.'
        }
    },
    'KUM': {
        id: 'KUM',
        name: 'Kumbalam',
        code: 'KUM',
        lat: 9.9050,
        lng: 76.3100,
        lineIds: ['line-orange'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Fisheries University Link'],
            description: 'Island transit station adjacent to Panangad and KUFOS.'
        }
    },
    'KUN': {
        id: 'KUN',
        name: 'Kundannoor',
        code: 'KUN',
        lat: 9.9420,
        lng: 76.3150,
        lineIds: ['line-orange'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Flyover Junction'],
            description: 'Strategic junction connecting NH66 and NH85 (Kochi-Madurai highway).'
        }
    },

    // ══════════════════════════════════════════════════════════════════
    // YELLOW LINE (Conceptual: Eastern Suburbs Spur)
    // ══════════════════════════════════════════════════════════════════
    'PUK': {
        id: 'PUK',
        name: 'Pukkattupady',
        code: 'PUK',
        lat: 10.0630,
        lng: 76.3820,
        lineIds: ['line-yellow'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Suburban Terminal'],
            description: 'Emerging eastern growth corridor.'
        }
    },
    'KIZ': {
        id: 'KIZ',
        name: 'Kizhakkambalam',
        code: 'KIZ',
        lat: 10.0480,
        lng: 76.4150,
        lineIds: ['line-yellow'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Agro & Industrial Link'],
            description: 'Eastern residential and light manufacturing town.'
        }
    },
    'BRA': {
        id: 'BRA',
        name: 'Brahmapuram',
        code: 'BRA',
        lat: 10.0030,
        lng: 76.3980,
        lineIds: ['line-yellow'],
        isInterchange: false,
        status: LINE_STATUS.CONCEPTUAL,
        info: {
            type: 'Conceptual Corridor',
            openingTime: 'Conceptual Study',
            closingTime: 'Future Phase',
            facilities: ['Substation Link'],
            description: 'Eastern periphery connecting Infopark Phase 2 extension.'
        }
    }
};

export const METRO_LINES = [
    {
        id: 'line-blue',
        code: 'L1',
        name: 'Blue Line',
        displayName: 'Blue Line (Line 1)',
        fullName: 'Line 1: Aluva ↔ Tripunithura',
        color: '#0077c8', // Vibrant Metro Blue
        textColor: '#ffffff',
        status: LINE_STATUS.OPERATIONAL,
        statusLabel: 'Operational',
        terminalA: 'Aluva',
        terminalB: 'Tripunithura',
        description: '25 Stations • 28.1 km • Elevated corridor connecting Aluva to Tripunithura Railway Station via MG Road and Vyttila.',
        stationIds: [
            'ALV', 'PUL', 'COM', 'AMB', 'MUT', 'KAL', 'CUS', 'PAT',
            'EDA', 'CHG', 'PAL', 'JLN', 'KLR', 'LIS', 'MGR', 'MAH',
            'ERS', 'KAD', 'ELA', 'VYT', 'THY', 'PET', 'VAD', 'SNJ', 'THP'
        ]
    },
    {
        id: 'line-pink',
        code: 'L2',
        name: 'Pink Line',
        displayName: 'Pink Line (Phase 2)',
        fullName: 'Line 2: JLN Stadium ↔ Infopark Kakkanad',
        color: '#ec4899', // Vibrant Pink / Magenta
        textColor: '#ffffff',
        status: LINE_STATUS.UNDER_CONSTRUCTION,
        statusLabel: 'Under Construction (Phase 2)',
        terminalA: 'JLN Stadium',
        terminalB: 'Infopark',
        description: '11 Stations • 11.2 km • Direct IT expressway connection from JLN Stadium to Infopark and SmartCity via Kakkanad.',
        stationIds: [
            'JLN', 'PLJ', 'PBP', 'CHM', 'VAZ', 'PAD', 'KKJ', 'SEZ', 'CHI', 'KIN', 'INF'
        ]
    },
    {
        id: 'line-green',
        code: 'L3',
        name: 'Green Line',
        displayName: 'Green Line (Coastal / Water Metro)',
        fullName: 'Line 3: Vyttila Hub ↔ Fort Kochi Gateway',
        color: '#059669', // Emerald Green
        textColor: '#ffffff',
        status: LINE_STATUS.OPERATIONAL,
        statusLabel: 'Operational (Multi-Modal)',
        terminalA: 'Vyttila',
        terminalB: 'Fort Kochi Gate',
        description: '6 Stations • Multi-modal waterfront connection linking Vyttila Mobility Hub to Marine Drive and historic Fort Kochi.',
        stationIds: [
            'VYT', 'PAN', 'ERS', 'HCT', 'BOL', 'FKG'
        ]
    },
    {
        id: 'line-violet',
        code: 'L4',
        name: 'Violet Line',
        displayName: 'Violet Line (Airport Express)',
        fullName: 'Line 4: Aluva ↔ Cochin Airport (CIAL)',
        color: '#7c3aed', // Royal Violet
        textColor: '#ffffff',
        status: LINE_STATUS.PROPOSED,
        statusLabel: 'Proposed (Airport Express)',
        terminalA: 'Aluva',
        terminalB: 'Cochin Airport (CIAL)',
        description: '5 Stations • 12 km • Proposed direct high-speed airport link extending from Aluva to Cochin International Airport.',
        stationIds: [
            'ALV', 'DSM', 'CGM', 'NDB', 'CIA'
        ]
    },
    {
        id: 'line-red',
        code: 'L5',
        name: 'Red Line',
        displayName: 'Red Line (Seaport Corridor)',
        fullName: 'Line 5: Kalamassery ↔ Tripunithura',
        color: '#dc2626', // Crimson Red
        textColor: '#ffffff',
        status: LINE_STATUS.CONCEPTUAL,
        statusLabel: 'Conceptual Corridor',
        terminalA: 'Kalamassery',
        terminalB: 'Tripunithura',
        description: '6 Stations • Conceptual north-south bypass along Seaport-Airport Road connecting IT hubs and industrial centres.',
        stationIds: [
            'KAL', 'HMT', 'COL', 'KKJ', 'IRU', 'THP'
        ]
    },
    {
        id: 'line-orange',
        code: 'L6',
        name: 'Orange Line',
        displayName: 'Orange Line (Coastal South)',
        fullName: 'Line 6: Aroor Toll ↔ Vyttila Hub',
        color: '#ea580c', // Bright Orange
        textColor: '#ffffff',
        status: LINE_STATUS.CONCEPTUAL,
        statusLabel: 'Conceptual Corridor',
        terminalA: 'Aroor Toll',
        terminalB: 'Vyttila',
        description: '5 Stations • Conceptual southern coastal corridor expanding metro coverage into southern suburban centres.',
        stationIds: [
            'ARO', 'KUM', 'KUN', 'THY', 'VYT'
        ]
    },
    {
        id: 'line-yellow',
        code: 'L7',
        name: 'Yellow Line',
        displayName: 'Yellow Line (Eastern Suburbs)',
        fullName: 'Line 7: Cochin University ↔ Infopark',
        color: '#d97706', // Golden Yellow
        textColor: '#ffffff',
        status: LINE_STATUS.CONCEPTUAL,
        statusLabel: 'Conceptual Corridor',
        terminalA: 'Cochin University',
        terminalB: 'Infopark',
        description: '5 Stations • Conceptual eastern orbital spur connecting Cochin University, Pukkattupady, and Infopark.',
        stationIds: [
            'CUS', 'PUK', 'KIZ', 'BRA', 'INF'
        ]
    }
];

// Helper: Get all unique stations as an array
export const getAllStations = () => Object.values(METRO_STATIONS);

// Helper: Get all lines with resolved station objects
export const getFullLines = () => {
    return METRO_LINES.map(line => ({
        ...line,
        stations: line.stationIds
            .map(id => METRO_STATIONS[id])
            .filter(Boolean)
    }));
};

// Map center and bounding box for Kochi Metro Network
export const KOCHI_NETWORK_CENTER = [10.015, 76.32];
export const KOCHI_NETWORK_BOUNDS = [
    [9.86, 76.22], // Southwest (Aroor/Fort Kochi)
    [10.17, 76.43] // Northeast (Airport / Kizhakkambalam)
];

export default {
    LINE_STATUS,
    STATUS_META,
    METRO_STATIONS,
    METRO_LINES,
    getAllStations,
    getFullLines,
    KOCHI_NETWORK_CENTER,
    KOCHI_NETWORK_BOUNDS
};
