import React, { useState, useEffect, useCallback } from 'react';
import '../styles/StationMasterDashboard.css';
import {
    Train01Icon, SpeedTrain01Icon, MetroIcon,
    Calendar01Icon, Clock01Icon, Alert01Icon,
    UserGroupIcon, Settings01Icon, Megaphone01Icon,
    DashboardCircleIcon, Notification01Icon, Logout01Icon,
    CheckmarkCircle01Icon, BarChartIcon, MapsLocation01Icon,
    Wifi01Icon, Atm01Icon, CctvCameraIcon, ArrowUp01Icon,
    DropletIcon, Ticket01Icon, HeartCheckIcon, FireIcon,
    Search01Icon, AiChat01Icon, ArrowRight01Icon,
    Building01Icon, GridIcon, LegalDocument01Icon
} from 'hugeicons-react';

/* ── KMRL Station Registry ─────────────────────────────────────────────── */
// Every KMRL Blue-Line station, with a busy-factor used for seeding passenger data
const KMRL_STATIONS = [
    { name: 'Aluva', factor: 1.00 },
    { name: 'Pulinchodu', factor: 0.60 },
    { name: 'Companypady', factor: 0.58 },
    { name: 'Ambattukavu', factor: 0.62 },
    { name: 'Muttom', factor: 0.65 },
    { name: 'Kalamassery', factor: 0.75 },
    { name: 'Cusat', factor: 0.80 },
    { name: 'Pathadipalam', factor: 0.70 },
    { name: 'Edapally', factor: 0.90 },
    { name: 'Changampuzha Park', factor: 0.82 },
    { name: 'Palarivattom', factor: 0.88 },
    { name: 'JLN Stadium', factor: 0.78 },
    { name: 'Kaloor', factor: 0.85 },
    { name: 'Lissie', factor: 0.80 },
    { name: 'MG Road', factor: 1.00 },
    { name: 'Maharajas College', factor: 0.72 },
    { name: 'Ernakulam South', factor: 0.95 },
    { name: 'Kadavanthra', factor: 0.70 },
    { name: 'Elamkulam', factor: 0.65 },
    { name: 'Vyttila', factor: 0.85 },
    { name: 'Thaikoodam', factor: 0.60 },
    { name: 'Petta', factor: 0.55 },
];


// Ordered list of all stations (North→South)
const STATION_NAMES = KMRL_STATIONS.map(s => s.name);
const getStationFactor = (name) => KMRL_STATIONS.find(s => s.name === name)?.factor ?? 1;

/* ── Seeded per-date data (station-aware) ─────────────────────────────── */
const seedDate = (d, stationFactor = 1) => {
    const v = (d.getDate() * 37 + d.getMonth() * 17 + d.getFullYear()) % 100;
    const base = 2800 + Math.round(v * 42.5);
    return {
        passengers: Math.round(base * stationFactor),
        trains: 22 + (v % 8),
        incidents: v % 5 === 0 ? 2 : v % 7 === 0 ? 1 : 0,
        revenue: Math.round((14000 + Math.round(v * 980)) * stationFactor),
    };
};

const HOURLY_BASE = [320, 810, 1240, 680, 490, 570, 430, 380, 510, 740, 1190, 960];
const HOUR_LABELS = ['7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'];

const seedHourly = (d, factor = 1) =>
    HOURLY_BASE.map(b => Math.max(100, Math.round(b * factor + (d.getDate() % 5) * 30)));

/* ── Train schedule with per-train station stops list ─────────────────── */
// Each train entry lists every station it halts at (in order).
// Northbound (Petta→Aluva) and Southbound (Aluva→Petta) services.
const BASE_TRAINS = [
    {
        id: 'KM-101', route: 'Aluva → Petta', platform: '1',
        stations: ['Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Muttom', 'Kalamassery', 'Cusat', 'Pathadipalam', 'Edapally', 'Changampuzha Park', 'Palarivattom', 'JLN Stadium', 'Kaloor', 'Lissie', 'MG Road', 'Maharajas College', 'Ernakulam South', 'Kadavanthra', 'Elamkulam', 'Vyttila', 'Thaikoodam', 'Petta'],
        times: ['07:12 AM', '09:42 AM', '12:05 PM', '03:30 PM', '06:10 PM'],
    },
    {
        id: 'KM-102', route: 'Petta → Aluva', platform: '2',
        stations: ['Petta', 'Thaikoodam', 'Vyttila', 'Elamkulam', 'Kadavanthra', 'Ernakulam South', 'Maharajas College', 'MG Road', 'Lissie', 'Kaloor', 'JLN Stadium', 'Palarivattom', 'Changampuzha Park', 'Edapally', 'Pathadipalam', 'Cusat', 'Kalamassery', 'Muttom', 'Ambattukavu', 'Companypady', 'Pulinchodu', 'Aluva'],
        times: ['07:50 AM', '10:25 AM', '01:00 PM', '04:15 PM', '07:00 PM'],
    },
    {
        id: 'KM-103', route: 'Aluva → Vyttila', platform: '1',
        stations: ['Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Muttom', 'Kalamassery', 'Cusat', 'Pathadipalam', 'Edapally', 'Changampuzha Park', 'Palarivattom', 'JLN Stadium', 'Kaloor', 'Lissie', 'MG Road', 'Maharajas College', 'Ernakulam South', 'Kadavanthra', 'Elamkulam', 'Vyttila'],
        times: ['08:10 AM', '11:00 AM', '02:20 PM', '05:45 PM'],
    },
    {
        id: 'KM-104', route: 'Vyttila → Aluva', platform: '2',
        stations: ['Vyttila', 'Elamkulam', 'Kadavanthra', 'Ernakulam South', 'Maharajas College', 'MG Road', 'Lissie', 'Kaloor', 'JLN Stadium', 'Palarivattom', 'Changampuzha Park', 'Edapally', 'Pathadipalam', 'Cusat', 'Kalamassery', 'Muttom', 'Ambattukavu', 'Companypady', 'Pulinchodu', 'Aluva'],
        times: ['08:55 AM', '11:40 AM', '03:05 PM', '06:30 PM'],
    },
    {
        id: 'KM-105', route: 'Aluva → Kalamassery', platform: '1',
        stations: ['Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Muttom', 'Kalamassery'],
        times: ['09:20 AM', '12:50 PM', '04:40 PM'],
    },
    {
        id: 'KM-106', route: 'MG Road → Aluva', platform: '2',
        stations: ['MG Road', 'Lissie', 'Kaloor', 'JLN Stadium', 'Palarivattom', 'Changampuzha Park', 'Edapally', 'Pathadipalam', 'Cusat', 'Kalamassery', 'Muttom', 'Ambattukavu', 'Companypady', 'Pulinchodu', 'Aluva'],
        times: ['08:00 AM', '10:45 AM', '01:30 PM', '05:00 PM'],
    },
    {
        id: 'KM-107', route: 'Ernakulam South → Aluva', platform: '2',
        stations: ['Ernakulam South', 'Maharajas College', 'MG Road', 'Lissie', 'Kaloor', 'JLN Stadium', 'Palarivattom', 'Changampuzha Park', 'Edapally', 'Pathadipalam', 'Cusat', 'Kalamassery', 'Muttom', 'Ambattukavu', 'Companypady', 'Pulinchodu', 'Aluva'],
        times: ['07:30 AM', '11:15 AM', '03:45 PM', '07:20 PM'],
    },
];

/* Returns upcoming trains that STOP AT the given station */
const getUpcomingTrains = (selectedDate, now, stationName) => {
    const isToday = selectedDate.toDateString() === now.toDateString();
    const curMins = isToday ? now.getHours() * 60 + now.getMinutes() : 0;
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const seed = selectedDate.getDate() % 3;

    // Filter trains that actually pass through selected station
    const relevantTrains = BASE_TRAINS.filter(t => t.stations.includes(stationName));
    // On weekends, use subset (fewer services)
    const trainsPool = isWeekend ? relevantTrains.slice(0, Math.ceil(relevantTrains.length * 0.7)) : relevantTrains;

    const upcoming = [];
    trainsPool.forEach(train => {
        // Calculate approximate arrival offset based on station index
        const stationIdx = train.stations.indexOf(stationName);
        const offsetMins = stationIdx * 2; // ~2 min per stop

        train.times.forEach(t => {
            const [hm, ampm] = [t.slice(0, -3), t.slice(-2)];
            const [hh, mm] = hm.split(':').map(Number);
            let mins = hh * 60 + mm + offsetMins;
            if (ampm === 'PM' && hh !== 12) mins += 720;
            if (mins < curMins) return; // past

            const delayMin = (train.id === 'KM-102' && seed === 1) ? 4 :
                (train.id === 'KM-105' && seed === 2) ? 2 : 0;

            // Format adjusted arrival time
            const totalMins = mins + delayMin;
            const arrH = Math.floor(totalMins / 60) % 24;
            const arrM = totalMins % 60;
            const arrAMPM = arrH >= 12 ? 'PM' : 'AM';
            const arrH12 = arrH % 12 || 12;
            const arrivalTime = `${String(arrH12).padStart(2, '0')}:${String(arrM).padStart(2, '0')} ${arrAMPM}`;

            upcoming.push({
                id: train.id,
                route: train.route,
                platform: train.platform,
                time: arrivalTime,
                status: delayMin > 0 ? `Delayed ${delayMin}m` : 'On Time',
                passengers: Math.round(150 + (Math.sin(mins) + 1) * 150),
                stopsAt: stationName,
            });
        });
    });

    upcoming.sort((a, b) => {
        const toMins = s => {
            const [hm, ap] = [s.slice(0, -3), s.slice(-2)];
            const [h, m] = hm.split(':').map(Number);
            let x = h * 60 + m; if (ap === 'PM' && h !== 12) x += 720; return x;
        };
        return toMins(a.time) - toMins(b.time);
    });
    return upcoming.slice(0, 6);
};

const FACILITIES = [
    { name: 'ATM', Icon: Atm01Icon, status: 'Operational' },
    { name: 'WiFi', Icon: Wifi01Icon, status: 'Operational' },
    { name: 'Restrooms', Icon: UserGroupIcon, status: 'Maintenance' },
    { name: 'Lifts (P1)', Icon: ArrowUp01Icon, status: 'Fault' },
    { name: 'CCTV', Icon: CctvCameraIcon, status: 'Operational' },
    { name: 'Ticket Counter', Icon: Ticket01Icon, status: 'Operational' },
    { name: 'Drinking Water', Icon: DropletIcon, status: 'Operational' },
    { name: 'First Aid', Icon: HeartCheckIcon, status: 'Operational' },
    { name: 'Fire Safety', Icon: FireIcon, status: 'Maintenance' },
];

const NAV = [
    { key: 'overview', icon: DashboardCircleIcon, label: 'Overview' },
    { key: 'trains', icon: Train01Icon, label: 'Train Monitor' },
    { key: 'incidents', icon: Alert01Icon, label: 'Incidents' },
    { key: 'facilities', icon: Settings01Icon, label: 'Facilities' },
    { key: 'announcements', icon: Megaphone01Icon, label: 'Announcements' },
    { key: 'grievances', icon: LegalDocument01Icon, label: 'Grievances' }
];

const INITIAL_INCIDENTS = [
    { id: 1, type: 'Overcrowding', platform: '1', time: '10:20 AM', status: 'Resolved' },
    { id: 2, type: 'Lift Malfunction', platform: 'Entry Gate', time: '09:55 AM', status: 'Active' },
];

/* ─────────────────────────────────────────────────────────────────────── */
/*  Passenger Load Chart                                                   */
/* ─────────────────────────────────────────────────────────────────────── */
function PassengerChart({ data, labels, activeIdx, onBarClick }) {
    const max = Math.max(...data);
    const [hovered, setHovered] = useState(null);

    return (
        <div className="sm-chart-bars-wrap">
            {data.map((val, i) => {
                const pct = max > 0 ? (val / max) * 88 : 0;
                const isActive = i === activeIdx;
                const isHov = i === hovered;
                return (
                    <div
                        key={i}
                        className="sm-bar-col"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => onBarClick(i)}
                    >
                        <div className="sm-bar-fill-outer">
                            <div
                                className={`sm-bar-rect ${isActive ? 'active' : ''}`}
                                style={{
                                    height: `${pct}px`,
                                    background: isActive
                                        ? 'linear-gradient(180deg, #0ea5e9 0%, #0066b3 100%)'
                                        : isHov
                                            ? '#93c5fd'
                                            : '#dbeafe',
                                    boxShadow: isActive ? '0 4px 12px rgba(0,102,179,0.35)' : 'none',
                                }}
                            >
                                {(isActive || isHov) && (
                                    <div className="sm-bar-tooltip">{val.toLocaleString()}</div>
                                )}
                            </div>
                        </div>
                        <span className="sm-bar-xlabel">{labels[i]}</span>
                    </div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Calendar Widget                                                         */
/* ─────────────────────────────────────────────────────────────────────── */
function CalendarWidget({ selectedDate, onSelectDate }) {
    const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
    const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const adjFirst = firstDow === 0 ? 6 : firstDow - 1;        // Mon-based
    const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < adjFirst; i++) cells.push(null);
    for (let d = 1; d <= daysInMon; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const today = new Date();
    const isAtCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    const isInFuture = (viewYear > today.getFullYear()) || (viewYear === today.getFullYear() && viewMonth > today.getMonth());

    // Block next arrow if already at current month
    const canGoNext = !isAtCurrentMonth && !isInFuture;

    const prevM = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
    const nextM = () => {
        if (!canGoNext) return;
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
    };

    const isToday2 = (d) => d && d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
    const isSelected = (d) => d && d === selectedDate.getDate() && viewMonth === selectedDate.getMonth() && viewYear === selectedDate.getFullYear();
    const isWeekend = (idx) => idx % 7 >= 5;
    // Mark every 3rd and 7th day as "has-event"
    const hasEvent = (d) => d && (d % 3 === 0 || d % 7 === 1);
    // A date is in the future if it's after today
    const isFutureDate = (d) => {
        if (!d) return false;
        const cellDate = new Date(viewYear, viewMonth, d);
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return cellDate > todayStart;
    };

    const selData = seedDate(selectedDate);
    const fmt = (n) => n.toLocaleString();

    return (
        <div className="sm-calendar">
            {/* Month nav */}
            <div className="sm-cal-nav-row">
                <button className="sm-cal-nav-btn" onClick={prevM}>‹</button>
                <span className="sm-cal-month">{MONTH_NAMES[viewMonth]}, {viewYear}</span>
                <button
                    className="sm-cal-nav-btn"
                    onClick={nextM}
                    disabled={!canGoNext}
                    style={{ opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? 'pointer' : 'not-allowed' }}
                >›</button>
            </div>

            {/* Day-name headers */}
            <div className="sm-cal-grid">
                {DAY_NAMES.map((d, i) => (
                    <div key={i} className="sm-cal-day-name">{d}</div>
                ))}
                {cells.map((d, i) => (
                    <div
                        key={i}
                        className={[
                            'sm-cal-day',
                            !d ? 'empty' : '',
                            isToday2(d) ? 'today' : '',
                            isSelected(d) && !isToday2(d) ? 'selected' : '',
                            hasEvent(d) ? 'has-event' : '',
                            isWeekend(i) && d ? 'weekend' : '',
                            isFutureDate(d) ? 'future-disabled' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => d && !isFutureDate(d) && onSelectDate(new Date(viewYear, viewMonth, d))}
                        title={isFutureDate(d) ? 'Future dates unavailable' : ''}
                    >
                        {d || ''}
                    </div>
                ))}
            </div>

            {/* Selected-day data */}
            <div className="sm-cal-selected-info">
                <div>
                    <div className="sm-cal-sel-label">
                        {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="sm-cal-sel-val">{fmt(selData.passengers)}</div>
                    <div className="sm-cal-sel-sub">passengers · ₹{fmt(selData.revenue)} revenue</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Trains</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0066b3' }}>{selData.trains}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Incidents</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: selData.incidents > 0 ? '#f59e0b' : '#10b981' }}>
                        {selData.incidents}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                          */
/* ─────────────────────────────────────────────────────────────────────── */
function StationMasterDashboard({ user, onLogout, onNavigate }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [now, setNow] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [chartTab, setChartTab] = useState('Today');
    const [activeBar, setActiveBar] = useState(null);
    // Station selector — default to Aluva (or the first station)
    const [selectedStation, setSelectedStation] = useState(STATION_NAMES[0]);

    const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
    const [incidentForm, setIncidentForm] = useState({ type: '', platform: '', description: '' });
    const [announcement, setAnnouncement] = useState('');
    const [announcements, setAnnouncements] = useState([
        { id: 1, text: 'Platform 1 unusually crowded. Please maintain distance.', time: '10:05 AM' }
    ]);
    const [trainSearch, setTrainSearch] = useState('');
    const [aiQuery, setAiQuery] = useState('');

    const [grievances, setGrievances] = useState([]);

    /* Live clock & Load grievances */
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);

        // Load grievances
        const all = JSON.parse(localStorage.getItem('kmrl_complaints') || '[]');
        setGrievances(all.filter(c => c.type === 'Grievance'));

        return () => clearInterval(t);
    }, []);

    const updateGrievanceStatus = (id, newStatus) => {
        const all = JSON.parse(localStorage.getItem('kmrl_complaints') || '[]');
        const updated = all.map(c => c.id === id ? { ...c, status: newStatus } : c);
        localStorage.setItem('kmrl_complaints', JSON.stringify(updated));
        setGrievances(updated.filter(c => c.type === 'Grievance'));
    };
    /* Compute data for selected date — scaled by station busyness */
    const stationFactor = getStationFactor(selectedStation);
    const selData = seedDate(selectedDate, stationFactor);
    const isToday = selectedDate.toDateString() === now.toDateString();
    const hourFactor = (chartTab === 'Weekday' ? 1.1 : chartTab === 'Weekend' ? 0.72 : 1) * stationFactor;
    const hourlyData = seedHourly(selectedDate, hourFactor);
    const upcomingTrains = getUpcomingTrains(selectedDate, now, selectedStation);

    /* Current hour index for chart highlight */
    const curHourIdx = isToday ? Math.max(0, now.getHours() - 7) : null; // 7AM = index 0

    const activeIncidents = incidents.filter(i => i.status === 'Active').length;
    const opFacilities = FACILITIES.filter(f => f.status === 'Operational').length;

    const statCards = [
        { label: 'Trains Today', value: selData.trains, Icon: SpeedTrain01Icon, color: '#0066b3', bg: '#eff6ff', trend: '+2 vs yesterday', trendClass: '' },
        { label: 'Passengers Today', value: selData.passengers.toLocaleString(), Icon: UserGroupIcon, color: '#0d9488', bg: '#f0fdfa', trend: '↑ 8.3%', trendClass: '' },
        { label: 'Active Incidents', value: activeIncidents, Icon: Alert01Icon, color: activeIncidents > 0 ? '#f59e0b' : '#10b981', bg: activeIncidents > 0 ? '#fefce8' : '#f0fdf4', trend: activeIncidents > 0 ? 'Needs Attention' : 'All Clear', trendClass: activeIncidents > 0 ? 'warn' : '' },
        { label: 'Facilities OK', value: `${opFacilities}/${FACILITIES.length}`, Icon: CheckmarkCircle01Icon, color: '#8b5cf6', bg: '#f5f3ff', trend: `${FACILITIES.length - opFacilities} issues`, trendClass: FACILITIES.length - opFacilities > 0 ? 'warn' : '' },
    ];


    const handleReportIncident = (e) => {
        e.preventDefault();
        if (!incidentForm.type || !incidentForm.platform) return;
        setIncidents(p => [{
            id: Date.now(), type: incidentForm.type,
            platform: incidentForm.platform,
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'Active'
        }, ...p]);
        setIncidentForm({ type: '', platform: '', description: '' });
    };

    const resolveIncident = (id) =>
        setIncidents(p => p.map(i => i.id === id ? { ...i, status: 'Resolved' } : i));

    const postAnnouncement = (e) => {
        e.preventDefault();
        if (!announcement.trim()) return;
        setAnnouncements(p => [{
            id: Date.now(), text: announcement,
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }, ...p]);
        setAnnouncement('');
    };

    const filteredTrains = upcomingTrains.filter(t =>
        t.id.toLowerCase().includes(trainSearch.toLowerCase()) ||
        t.route.toLowerCase().includes(trainSearch.toLowerCase())
    );

    /* Chart bar click → highlight bar and set active time window */
    const handleBarClick = (i) => setActiveBar(prev => prev === i ? null : i);

    const highlightIdx = activeBar !== null ? activeBar : curHourIdx;

    return (
        <div className="sm-root">
            {/* ── Sidebar ── */}
            <aside className="sm-sidebar">
                <div className="sm-sidebar-brand">
                    <div className="sm-brand-icon-wrap"><MetroIcon size={22} color="#fff" strokeWidth={1.5} /></div>
                    <div className="sm-brand-text">
                        <div className="sm-brand-title">KMRL</div>
                        <div className="sm-brand-sub">Station Control</div>
                    </div>
                </div>

                <div className="sm-station-badge">
                    <span className="sm-station-label">Assigned Station</span>
                    <span className="sm-station-name">{selectedStation}</span>
                </div>

                <nav className="sm-nav">
                    {NAV.map(item => (
                        <button
                            key={item.key}
                            className={`sm-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.key)}
                            title={item.label}
                        >
                            <span className="sm-nav-btn-icon">
                                <item.icon size={18} color="currentColor" strokeWidth={1.5} />
                            </span>
                            <span className="sm-nav-btn-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sm-sidebar-footer">
                    <div className="sm-user-info">
                        <div className="sm-user-avatar"><UserGroupIcon size={17} color="#fff" strokeWidth={2} /></div>
                        <div className="sm-user-text">
                            <div className="sm-user-name">{user?.fullName || 'Station Master'}</div>
                            <div className="sm-user-role">Station Master</div>
                        </div>
                    </div>
                    <button className="sm-logout-btn" onClick={() => { onLogout(); onNavigate('home'); }}>
                        <Logout01Icon size={14} color="currentColor" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="sm-main">
                {/* Topbar */}
                <div className="sm-topbar">
                    <div className="sm-topbar-left">
                        <h1 className="sm-page-title">
                            {activeTab === 'overview' && 'Station Overview'}
                            {activeTab === 'trains' && 'Train Monitor'}
                            {activeTab === 'incidents' && 'Incident Management'}
                            {activeTab === 'facilities' && 'Facility Status'}
                            {activeTab === 'announcements' && 'Announcements'}
                            {activeTab === 'grievances' && 'Passenger Grievances'}
                        </h1>
                        <p className="sm-page-sub">
                            {selectedStation} Station{' \u00b7 '}
                            {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            {!isToday && ` \u00b7 Viewing ${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                        </p>
                    </div>
                    <div className="sm-topbar-right">
                        {/* Station selector */}
                        <div className="sm-station-selector">
                            <MapsLocation01Icon size={14} color="#0066b3" strokeWidth={2} style={{ flexShrink: 0 }} />
                            <select
                                className="sm-station-select"
                                value={selectedStation}
                                onChange={e => setSelectedStation(e.target.value)}
                            >
                                {STATION_NAMES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Search01Icon size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px' }} />
                            <input className="sm-search-topbar" type="text" placeholder="Search..." style={{ paddingLeft: '30px' }} />
                        </div>
                        <div className="sm-notif-btn" title="Notifications">
                            <Notification01Icon size={17} color="currentColor" strokeWidth={1.5} />
                            {activeIncidents > 0 && <span className="sm-notif-dot" />}
                        </div>
                        <button className="sm-home-btn" onClick={() => onNavigate('home')}>← Main Site</button>
                    </div>
                </div>

                {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
                {activeTab === 'overview' && (
                    <div className="sm-content">

                        {/* Stat Cards */}
                        <div className="sm-stats-grid">
                            {statCards.map(s => (
                                <div key={s.label} className="sm-stat-card" style={{ '--stat-color': s.color, '--stat-bg': s.bg }}>
                                    <div className="sm-stat-top">
                                        <div className="sm-stat-icon" style={{ background: s.bg }}>
                                            <s.Icon size={20} color={s.color} strokeWidth={1.5} />
                                        </div>
                                        <span className={`sm-stat-trend ${s.trendClass}`}>{s.trend}</span>
                                    </div>
                                    <div className="sm-stat-value">{s.value}</div>
                                    <div className="sm-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Chart + Calendar row */}
                        <div className="sm-overview-main">

                            {/* ── Passenger Load Chart ── */}
                            <div className="sm-card">
                                <div className="sm-card-head">
                                    <span className="sm-card-title">Hourly Passenger Load</span>
                                    <div className="sm-chart-toolbar">
                                        {['Today', 'Weekday', 'Weekend'].map(t => (
                                            <button
                                                key={t}
                                                className={`sm-chart-tab ${chartTab === t ? 'active' : ''}`}
                                                onClick={() => { setChartTab(t); setActiveBar(null); }}
                                            >{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="sm-bar-chart-area">
                                    <PassengerChart
                                        data={hourlyData}
                                        labels={HOUR_LABELS}
                                        activeIdx={highlightIdx}
                                        onBarClick={handleBarClick}
                                    />
                                    {/* Summary strip below chart */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                                        gap: '10px', marginTop: '4px',
                                    }}>
                                        {[
                                            { label: 'Peak Hour', val: `${HOUR_LABELS[hourlyData.indexOf(Math.max(...hourlyData))]}`, Icon: Clock01Icon },
                                            { label: 'Current Load', val: highlightIdx !== null ? hourlyData[highlightIdx]?.toLocaleString() || '—' : '—', Icon: UserGroupIcon },
                                            { label: 'Daily Total', val: hourlyData.reduce((a, b) => a + b, 0).toLocaleString(), Icon: BarChartIcon },
                                        ].map(s => (
                                            <div key={s.label} style={{
                                                background: '#f8fafc', borderRadius: '10px', padding: '10px 12px',
                                                border: '1px solid #e2e8f0',
                                            }}>
                                                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><s.Icon size={13} color="#64748b" strokeWidth={1.5} /> {s.label}</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0066b3', marginTop: '2px' }}>{s.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Calendar ── */}
                            <CalendarWidget
                                selectedDate={selectedDate}
                                onSelectDate={(d) => { setSelectedDate(d); setActiveBar(null); }}
                            />
                        </div>

                        {/* Trains + Incidents + AI row */}
                        <div className="sm-overview-bottom">

                            {/* ── Upcoming Trains (date-aware) ── */}
                            <div className="sm-card">
                                <div className="sm-card-head">
                                    <span className="sm-card-title">
                                        Upcoming Trains
                                        {!isToday && (
                                            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b', marginLeft: '6px' }}>
                                                ({selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})
                                            </span>
                                        )}
                                    </span>
                                    <span className="sm-card-badge">{upcomingTrains.length} scheduled</span>
                                </div>
                                {upcomingTrains.length === 0 ? (
                                    <p className="sm-empty">No more trains scheduled for today</p>
                                ) : upcomingTrains.map(t => (
                                    <div className="sm-train-row" key={`${t.id}-${t.time}`}>
                                        <div className="sm-row-left">
                                            <div className={`sm-row-dot ${t.status !== 'On Time' ? 'delay' : ''}`} />
                                            <div>
                                                <div className="sm-row-id">{t.id}</div>
                                                <div className="sm-row-sub">{t.route} · Plt {t.platform} · {t.passengers} pax</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div className="sm-train-time">{t.time}</div>
                                            <span className={`sm-status-badge ${t.status === 'On Time' ? 'green' : 'amber'}`}>
                                                {t.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Right column: Incidents + AI ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                                {/* Recent Incidents */}
                                <div className="sm-card">
                                    <div className="sm-card-head">
                                        <span className="sm-card-title">Recent Incidents</span>
                                        {activeIncidents > 0 && (
                                            <span className="sm-card-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                {activeIncidents} Active
                                            </span>
                                        )}
                                    </div>
                                    {incidents.slice(0, 2).map(inc => (
                                        <div className="sm-incident-row" key={inc.id}>
                                            <div className="sm-row-left">
                                                <div className={`sm-row-dot ${inc.status === 'Active' ? 'danger' : ''}`} />
                                                <div>
                                                    <div className="sm-row-id">{inc.type}</div>
                                                    <div className="sm-row-sub">Platform: {inc.platform} · {inc.time}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                                <span className={`sm-status-badge ${inc.status === 'Resolved' ? 'green' : 'red'}`}>
                                                    {inc.status}
                                                </span>
                                                {inc.status === 'Active' && (
                                                    <button className="sm-resolve-btn" onClick={() => resolveIncident(inc.id)}>
                                                        <CheckmarkCircle01Icon size={12} color="currentColor" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '3px' }} /> Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {incidents.filter(i => i.status === 'Active').length === 0 && (
                                        <p className="sm-empty">No active incidents</p>
                                    )}
                                </div>

                                {/* AI Assistant */}
                                <div className="sm-ai-box">
                                    <div className="sm-ai-title"><AiChat01Icon size={18} color="#0066b3" strokeWidth={1.5} /> Station Assistant</div>
                                    <p className="sm-ai-body">
                                        Station activity is{' '}
                                        {selData.passengers > 5000 ? 'high today — consider crowd management.' : 'stable today.'}
                                        {' '}Next peak expected at 5:30 PM.
                                        {activeIncidents > 0 && ' Lift malfunction at Entry Gate remains unresolved.'}
                                    </p>
                                    <div className="sm-ai-input-row">
                                        <input
                                            className="sm-ai-input"
                                            placeholder="Ask anything about this station..."
                                            value={aiQuery}
                                            onChange={e => setAiQuery(e.target.value)}
                                        />
                                        <button className="sm-ai-send"><ArrowRight01Icon size={16} color="#fff" strokeWidth={2} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════ TRAIN MONITOR ══════════════════ */}
                {activeTab === 'trains' && (
                    <div className="sm-content">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Search by Train ID or Route..."
                                value={trainSearch}
                                onChange={e => setTrainSearch(e.target.value)}
                                className="sm-search-input"
                            />
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                Showing trains for{' '}
                                <strong style={{ color: '#0066b3' }}>
                                    {selectedDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </strong>
                                {' '}— select a date on Overview calendar to change
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                            {[
                                { label: 'On Time', value: upcomingTrains.filter(t => t.status === 'On Time').length, color: '#10b981' },
                                { label: 'Delayed', value: upcomingTrains.filter(t => t.status !== 'On Time').length, color: '#f59e0b' },
                                { label: 'Total Pax', value: upcomingTrains.reduce((s, t) => s + t.passengers, 0).toLocaleString(), color: '#0066b3' },
                            ].map(s => (
                                <div key={s.label} className="sm-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="sm-stat-value">{s.value}</div>
                                    <div className="sm-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="sm-card">
                            <div className="sm-card-head">
                                <span className="sm-card-title">Train Schedule</span>
                                <span className="sm-card-badge">{filteredTrains.length} trains</span>
                            </div>
                            <table className="sm-table">
                                <thead>
                                    <tr>
                                        <th>Train ID</th><th>Route</th><th>Platform</th>
                                        <th>Arrival Time</th><th>Passengers</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTrains.map(t => (
                                        <tr key={`${t.id}-${t.time}`}>
                                            <td><strong>{t.id}</strong></td>
                                            <td>{t.route}</td>
                                            <td>Platform {t.platform}</td>
                                            <td style={{ color: '#0066b3', fontWeight: 700 }}>{t.time}</td>
                                            <td>{t.passengers}</td>
                                            <td>
                                                <span className={`sm-status-badge ${t.status === 'On Time' ? 'green' : 'amber'}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="sm-card">
                            <div className="sm-card-head">
                                <span className="sm-card-title">Passenger Distribution by Train</span>
                            </div>
                            {filteredTrains.map(t => (
                                <div className="sm-bar-row" key={`bar-${t.id}-${t.time}`}>
                                    <span className="sm-bar-label">{t.id} {t.time}</span>
                                    <div className="sm-bar-track">
                                        <div className="sm-bar-fill" style={{ width: `${Math.min(100, (t.passengers / 400) * 100)}%` }} />
                                    </div>
                                    <span className="sm-bar-val">{t.passengers}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ══════════════════ INCIDENTS ══════════════════ */}
                {activeTab === 'incidents' && (
                    <div className="sm-content">
                        <div className="sm-two-col">
                            <div className="sm-card">
                                <div className="sm-card-head">
                                    <span className="sm-card-title">Report New Incident</span>
                                </div>
                                <form onSubmit={handleReportIncident} className="sm-form">
                                    <label>Incident Type</label>
                                    <select value={incidentForm.type} onChange={e => setIncidentForm(p => ({ ...p, type: e.target.value }))} required>
                                        <option value="">Select type...</option>
                                        <option>Overcrowding</option>
                                        <option>Lift Malfunction</option>
                                        <option>Medical Emergency</option>
                                        <option>Security Concern</option>
                                        <option>Track Signal Issue</option>
                                        <option>Power Failure</option>
                                        <option>Other</option>
                                    </select>
                                    <label>Location / Platform</label>
                                    <input type="text" placeholder="e.g. Platform 1, Entry Gate..." value={incidentForm.platform} onChange={e => setIncidentForm(p => ({ ...p, platform: e.target.value }))} required />
                                    <label>Description (optional)</label>
                                    <textarea rows={3} placeholder="Brief description..." value={incidentForm.description} onChange={e => setIncidentForm(p => ({ ...p, description: e.target.value }))} />
                                    <button type="submit" className="sm-primary-btn">⚠ Report Incident</button>
                                </form>
                            </div>

                            <div className="sm-card">
                                <div className="sm-card-head">
                                    <span className="sm-card-title">Active & Recent Incidents</span>
                                    {activeIncidents > 0 && (
                                        <span className="sm-card-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                            {activeIncidents} Active
                                        </span>
                                    )}
                                </div>
                                {incidents.map(inc => (
                                    <div className="sm-incident-row" key={inc.id}>
                                        <div className="sm-row-left">
                                            <div className={`sm-row-dot ${inc.status === 'Active' ? 'danger' : ''}`} />
                                            <div>
                                                <div className="sm-row-id">{inc.type}</div>
                                                <div className="sm-row-sub">Platform: {inc.platform} · {inc.time}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                            <span className={`sm-status-badge ${inc.status === 'Resolved' ? 'green' : 'red'}`}>
                                                {inc.status}
                                            </span>
                                            {inc.status === 'Active' && (
                                                <button className="sm-resolve-btn" onClick={() => resolveIncident(inc.id)}>
                                                    <CheckmarkCircle01Icon size={12} color="currentColor" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '3px' }} /> Mark Resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════ FACILITIES ══════════════════ */}
                {activeTab === 'facilities' && (
                    <div className="sm-content">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
                            {[
                                { label: 'Operational', value: FACILITIES.filter(f => f.status === 'Operational').length, color: '#10b981' },
                                { label: 'Under Maintenance', value: FACILITIES.filter(f => f.status === 'Maintenance').length, color: '#f59e0b' },
                                { label: 'Fault / Offline', value: FACILITIES.filter(f => f.status === 'Fault').length, color: '#ef4444' },
                            ].map(s => (
                                <div key={s.label} className="sm-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="sm-stat-value">{s.value}</div>
                                    <div className="sm-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="sm-card">
                            <div className="sm-card-head">
                                <span className="sm-card-title">Facility Status Board</span>
                                <span className="sm-card-badge">{FACILITIES.length} facilities</span>
                            </div>
                            <div className="sm-facilities-grid">
                                {FACILITIES.map(f => (
                                    <div className="sm-facility-card" key={f.name}>
                                        <div className="sm-facility-icon"><f.Icon size={24} color="#0066b3" strokeWidth={1.5} /></div>
                                        <div className="sm-facility-name">{f.name}</div>
                                        <span className={`sm-status-badge ${f.status === 'Operational' ? 'green' : f.status === 'Maintenance' ? 'amber' : 'red'}`}>
                                            {f.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════ ANNOUNCEMENTS ══════════════════ */}
                {activeTab === 'announcements' && (
                    <div className="sm-content">
                        <div className="sm-two-col">
                            <div className="sm-card">
                                <div className="sm-card-head">
                                    <span className="sm-card-title">Post Station Announcement</span>
                                </div>
                                <form onSubmit={postAnnouncement} className="sm-form">
                                    <label>Announcement Message</label>
                                    <textarea rows={5} placeholder="Type your station-wide announcement..." value={announcement} onChange={e => setAnnouncement(e.target.value)} required />
                                    <button type="submit" className="sm-primary-btn"><Megaphone01Icon size={16} color="currentColor" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Broadcast Announcement</button>
                                </form>
                            </div>
                            <div className="sm-card">
                                <div className="sm-card-head">
                                    <span className="sm-card-title">Recent Announcements</span>
                                    <span className="sm-card-badge">{announcements.length} total</span>
                                </div>
                                {announcements.map(a => (
                                    <div className="sm-announcement-row" key={a.id}>
                                        <p>{a.text}</p>
                                        <span className="sm-ann-time">🕐 {a.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════ GRIEVANCES ══════════════════ */}
                {activeTab === 'grievances' && (
                    <div className="sm-content">
                        <div className="sm-card">
                            <div className="sm-card-head">
                                <span className="sm-card-title">Passenger Grievances</span>
                                <span className="sm-card-badge">{grievances.length} Total</span>
                            </div>
                            {grievances.length === 0 ? (
                                <p className="sm-empty">No grievances reported yet.</p>
                            ) : (
                                <table className="sm-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Passenger</th>
                                            <th>Subject</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grievances.map(g => (
                                            <tr key={g.id}>
                                                <td><strong>{g.id}</strong></td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{g.userName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{g.userEmail}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{g.subject}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#475569', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={g.description}>{g.description}</div>
                                                </td>
                                                <td>{g.date}</td>
                                                <td>
                                                    <span className={`sm-status-badge ${g.status === 'Resolved' ? 'green' : g.status === 'In Progress' ? 'amber' : 'amber'}`}>
                                                        {g.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        value={g.status}
                                                        onChange={(e) => updateGrievanceStatus(g.id, e.target.value)}
                                                        style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="In Progress">In Progress</option>
                                                        <option value="Resolved">Resolved</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default StationMasterDashboard;
