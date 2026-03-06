import React, { useState, useEffect, useCallback } from 'react';
import '../styles/OfficerDashboard.css';
import {
    MetroIcon, Train01Icon, SpeedTrain01Icon,
    Building01Icon, UserGroupIcon, Alert01Icon,
    BarChartIcon, Calendar01Icon, Notification01Icon,
    Logout01Icon, DashboardCircleIcon, Settings01Icon,
    DocumentAttachmentIcon, AnalyticsUpIcon, Search01Icon,
    ArrowRight01Icon, AiChat01Icon, Megaphone01Icon,
    MoneyBag01Icon, Ticket01Icon, Clock01Icon, City01Icon,
    RefreshIcon
} from 'hugeicons-react';

const API = '/api';

/* ── Station registry (shared with StationMaster) ─────────────────────── */
const MOCK_STATIONS = [
    { name: 'Aluva', status: 'Operational', passengers: 4821, master: 'Rajesh Kumar', revenue: 24200 },
    { name: 'Kalamassery', status: 'Operational', passengers: 3102, master: 'Rajan KV', revenue: 15800 },
    { name: 'Palarivattom', status: 'Maintenance', passengers: 2897, master: 'Sreeja AN', revenue: 14100 },
    { name: 'MG Road', status: 'Operational', passengers: 6432, master: 'Anil Nair', revenue: 38900 },
    { name: 'Vyttila', status: 'Operational', passengers: 3789, master: 'Deepa MS', revenue: 19700 },
    { name: 'Ernakulam South', status: 'Closed', passengers: 0, master: 'Suresh PK', revenue: 0 },
];

const MOCK_TRAINS = [
    { id: 'KM-101', from: 'Aluva', to: 'MG Road', status: 'Running', delay: 0, passengers: 312 },
    { id: 'KM-102', from: 'MG Road', to: 'Aluva', status: 'Delayed', delay: 3, passengers: 198 },
    { id: 'KM-103', from: 'Aluva', to: 'Vyttila', status: 'Running', delay: 0, passengers: 267 },
    { id: 'KM-104', from: 'Vyttila', to: 'MG Road', status: 'Running', delay: 0, passengers: 421 },
    { id: 'KM-105', from: 'MG Road', to: 'Aluva', status: 'Maintenance', delay: 0, passengers: 0 },
];

const NAV = [
    { key: 'overview', Icon: DashboardCircleIcon, label: 'System Overview' },
    { key: 'stations', Icon: Building01Icon, label: 'All Stations' },
    { key: 'trains', Icon: Train01Icon, label: 'Fleet Monitor' },
    { key: 'users', Icon: UserGroupIcon, label: 'User Management' },
    { key: 'journeys', Icon: Ticket01Icon, label: 'User Journeys' },
    { key: 'news', Icon: DocumentAttachmentIcon, label: 'News & Updates' },
    { key: 'reports', Icon: AnalyticsUpIcon, label: 'Reports' },
    { key: 'complaints', Icon: Alert01Icon, label: 'Complaints Hub' }
];

const HOUR_LABELS = ['7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'];
const HOURLY_PAX = [1200, 3100, 4600, 2800, 2100, 2400, 1900, 1700, 2300, 3200, 5100, 4200];
const WEEKDAY_PAX = HOURLY_PAX.map(v => Math.round(v * 1.12));
const WEEKEND_PAX = HOURLY_PAX.map(v => Math.round(v * 0.68));

const MOCK_JOURNEYS = [
    { id: 'TXN-9081', user: 'ZAB', from: 'Aluva', to: 'MG Road', date: 'Today, 09:12 AM', amount: '₹40', status: 'Completed', method: 'UPI' },
    { id: 'TXN-9082', user: 'parth12', from: 'Kalamassery', to: 'Edapally', date: 'Today, 08:45 AM', amount: '₹20', status: 'Completed', method: 'Wallet' },
    { id: 'TXN-9083', user: 'arman12', from: 'MG Road', to: 'Vyttila', date: 'Today, 08:30 AM', amount: '₹30', status: 'In Transit', method: 'UPI' },
    { id: 'TXN-9084', user: 'Tarun2911', from: 'Palarivattom', to: 'Aluva', date: 'Yesterday, 06:15 PM', amount: '₹50', status: 'Completed', method: 'Card' },
    { id: 'TXN-9085', user: 'testuser', from: 'Vyttila', to: 'MG Road', date: 'Yesterday, 05:40 PM', amount: '₹30', status: 'Completed', method: 'Wallet' },
    { id: 'TXN-9086', user: 'ZAB', from: 'MG Road', to: 'Aluva', date: 'Yesterday, 05:00 PM', amount: '₹40', status: 'Completed', method: 'UPI' },
];

/* ── Deterministic daily seed ─────────────────────────────────────────── */
const seedDay = (d) => {
    const v = (d.getDate() * 37 + d.getMonth() * 17 + d.getFullYear()) % 100;
    return {
        passengers: 21041 + Math.round(v * 420),
        revenue: 112700 + Math.round(v * 1850),
        trains: 26 + (v % 6),
        incidents: v % 5 === 0 ? 3 : v % 7 === 0 ? 1 : 0,
    };
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ── Interactive Full-Size Bar Chart ─────────────────────────────────── */
function PassengerBarChart({ data, labels, mode }) {
    const [hovered, setHovered] = useState(null);
    const max = Math.max(...data);
    const total = data.reduce((s, v) => s + v, 0);
    const peak = labels[data.indexOf(max)];

    // If TODAY mode, determine current hour index
    const nowHour = new Date().getHours();
    const curHourIdx = mode === 'Today' ? Math.max(0, nowHour - 7) : null;
    const currentVal = curHourIdx !== null && curHourIdx < data.length ? data[curHourIdx] : null;

    return (
        <div className="od-chart-wrap">
            <div className="od-chart-legend-row" style={{ marginBottom: '5px' }}>
                <div className="od-chart-legend-item">
                    <span className="od-chart-dot purple" />
                    <span>Hourly Passengers</span>
                </div>
            </div>

            <div className="od-chart-bars" style={{ height: '160px', marginBottom: '12px' }}>
                {data.map((val, i) => {
                    const pct = max > 0 ? (val / max) * 100 : 0;
                    const isHov = hovered === i;
                    const isCur = curHourIdx === i;
                    return (
                        <div
                            key={i}
                            className="od-chart-col"
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                        >
                            <div className="od-chart-bar-outer">
                                {isHov && (
                                    <div className="od-chart-tooltip">
                                        <div className="od-chart-tt-label">{labels[i]}</div>
                                        <div className="od-chart-tt-val">{val.toLocaleString()}</div>
                                        <div className="od-chart-tt-pct">{((val / total) * 100).toFixed(1)}%</div>
                                    </div>
                                )}
                                <div
                                    className="od-chart-bar-rect"
                                    style={{
                                        height: `${Math.max(4, pct)}%`,
                                        background: isCur
                                            ? 'linear-gradient(180deg,#a855f7 0%,#7c3aed 100%)'
                                            : isHov
                                                ? 'linear-gradient(180deg,#c4b5fd 0%,#8b5cf6 100%)'
                                                : '#ddd6fe',
                                        boxShadow: isCur ? '0 4px 14px rgba(124,58,237,0.35)' : 'none',
                                        border: isCur ? '1px solid #7c3aed' : 'none'
                                    }}
                                />
                            </div>
                            <span className="od-chart-xlabel" style={{ fontWeight: isCur ? 700 : 400, color: isCur ? '#7c3aed' : '#94a3b8' }}>{labels[i]}</span>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Summary Strip - matches Station Master style */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                gap: '10px', marginTop: '10px', padding: '0 4px'
            }}>
                {[
                    { label: 'Peak Hour', val: peak, Icon: Clock01Icon },
                    { label: 'Current Load', val: currentVal !== null ? currentVal.toLocaleString() : '—', Icon: UserGroupIcon },
                    { label: 'Daily Total', val: total.toLocaleString(), Icon: BarChartIcon },
                ].map(s => (
                    <div key={s.label} style={{
                        background: '#f8fafc', borderRadius: '10px', padding: '10px 12px',
                        border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '2px'
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <s.Icon size={14} color="#64748b" strokeWidth={2} /> {s.label}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7c3aed' }}>{s.val}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Calendar Widget ──────────────────────────────────────────────────── */
function OfficerCalendar({ selectedDate, onSelectDate }) {
    const today = new Date();
    const [viewM, setViewM] = useState(selectedDate.getMonth());
    const [viewY, setViewY] = useState(selectedDate.getFullYear());
    const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const firstDow = new Date(viewY, viewM, 1).getDay();
    const adjFirst = firstDow === 0 ? 6 : firstDow - 1;
    const daysInM = new Date(viewY, viewM + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < adjFirst; i++) cells.push(null);
    for (let d = 1; d <= daysInM; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const isAtCurrent = viewY === today.getFullYear() && viewM === today.getMonth();
    const canNext = !isAtCurrent && !(viewY > today.getFullYear() || viewM > today.getMonth());

    const prevM = () => { if (viewM === 0) { setViewM(11); setViewY(y => y - 1); } else setViewM(m => m - 1); };
    const nextM = () => { if (!canNext) return; if (viewM === 11) { setViewM(0); setViewY(y => y + 1); } else setViewM(m => m + 1); };

    const isToday2 = d => d && d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();
    const isSelected = d => d && d === selectedDate.getDate() && viewM === selectedDate.getMonth() && viewY === selectedDate.getFullYear();
    const isFuture = d => { if (!d) return false; return new Date(viewY, viewM, d) > today; };

    const sd = seedDay(selectedDate);
    const fmt = n => n.toLocaleString();

    return (
        <div className="od-cal-box">
            <div className="od-cal-nav">
                <button className="od-cal-arrow" onClick={prevM}>‹</button>
                <span className="od-cal-month-label">{MONTH_NAMES[viewM]}, {viewY}</span>
                <button className="od-cal-arrow" onClick={nextM}
                    disabled={!canNext}
                    style={{ opacity: canNext ? 1 : 0.28, cursor: canNext ? 'pointer' : 'not-allowed' }}>›</button>
            </div>
            <div className="od-cal-grid">
                {DAY_NAMES.map((d, i) => (
                    <div key={i} className="od-cal-dname">{d}</div>
                ))}
                {cells.map((d, i) => (
                    <div key={i}
                        className={[
                            'od-cal-day',
                            !d ? 'empty' : '',
                            isToday2(d) ? 'today' : '',
                            isSelected(d) && !isToday2(d) ? 'sel' : '',
                            isFuture(d) ? 'future' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => d && !isFuture(d) && onSelectDate(new Date(viewY, viewM, d))}
                        title={isFuture(d) ? 'Future dates unavailable' : ''}
                    >{d || ''}</div>
                ))}
            </div>
            <div className="od-cal-info">
                <div className="od-cal-info-date">
                    {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="od-cal-info-stats">
                    <div className="od-cal-info-stat">
                        <div className="od-cal-info-val">{fmt(sd.passengers)}</div>
                        <div className="od-cal-info-lbl">passengers</div>
                    </div>
                    <div className="od-cal-info-stat">
                        <div className="od-cal-info-val" style={{ color: '#7c3aed' }}>₹{fmt(sd.revenue)}</div>
                        <div className="od-cal-info-lbl">revenue</div>
                    </div>
                    <div className="od-cal-info-stat">
                        <div className="od-cal-info-val" style={{ color: '#0d9488' }}>{sd.trains}</div>
                        <div className="od-cal-info-lbl">trains</div>
                    </div>
                    <div className="od-cal-info-stat">
                        <div className="od-cal-info-val" style={{ color: sd.incidents > 0 ? '#f59e0b' : '#10b981' }}>{sd.incidents}</div>
                        <div className="od-cal-info-lbl">incidents</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ───────────────────────────────────────────────────── */
function OfficerDashboard({ user, onLogout, onNavigate }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [chartMode, setChartMode] = useState('Today');    // Today | Weekday | Weekend
    const [newsForm, setNewsForm] = useState({ title: '', content: '' });
    const [newsList, setNewsList] = useState([
        { id: 1, title: 'Schedule Update – Vyttila Extension', content: 'Services on Vyttila extension will run at reduced frequency this weekend.', date: '25 Feb 2026' },
        { id: 2, title: 'Maintenance Notice – Palarivattom', content: 'Palarivattom station under partial maintenance. Lift services suspended.', date: '24 Feb 2026' },
    ]);
    const [stationFilter, setStationFilter] = useState('All');
    const [aiQuery, setAiQuery] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [journeySearch, setJourneySearch] = useState('');

    /* Real-time user management */
    const [liveUsers, setLiveUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    /* Real-time journeys / transactions */
    const [liveJourneys, setLiveJourneys] = useState([]);
    const [journeysLoading, setJourneysLoading] = useState(false);
    const [journeysError, setJourneysError] = useState(null);
    const [lastJourneyRefresh, setLastJourneyRefresh] = useState(null);

    const [allComplaints, setAllComplaints] = useState([]);

    /* Clock & Complaints */
    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);

        // Load combined complaints
        const saved = JSON.parse(localStorage.getItem('kmrl_complaints') || '[]');
        setAllComplaints(saved);

        return () => clearInterval(t);
    }, []);

    const updateVigilanceStatus = (id, newStatus) => {
        const saved = JSON.parse(localStorage.getItem('kmrl_complaints') || '[]');
        const updated = saved.map(c => c.id === id ? { ...c, status: newStatus } : c);
        localStorage.setItem('kmrl_complaints', JSON.stringify(updated));
        setAllComplaints(updated);
    };

    /* Fetch users from backend */
    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem('kmrl_token');
            if (!token) return; // Ignore if user format or token missing

            setUsersLoading(true);
            setUsersError(null);
            const res = await fetch(`${API}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setLiveUsers(data.users || []);
            setLastRefresh(new Date());
        } catch (err) {
            setUsersError(err.message);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    /* Fetch users whenever the Users tab is opened */
    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
    }, [activeTab, fetchUsers]);

    /* Auto-refresh every 30 s while Users tab is active */
    useEffect(() => {
        if (activeTab !== 'users') return;
        const t = setInterval(fetchUsers, 30000);
        return () => clearInterval(t);
    }, [activeTab, fetchUsers]);

    /* Fetch journeys from backend */
    const fetchJourneys = useCallback(async () => {
        try {
            const token = localStorage.getItem('kmrl_token');
            if (!token) return;

            setJourneysLoading(true);
            setJourneysError(null);
            const res = await fetch(`${API}/metro/bookings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setLiveJourneys(data || []);
            setLastJourneyRefresh(new Date());
        } catch (err) {
            setJourneysError(err.message);
        } finally {
            setJourneysLoading(false);
        }
    }, [API]);

    useEffect(() => {
        if (activeTab === 'journeys') fetchJourneys();
    }, [activeTab, fetchJourneys]);

    useEffect(() => {
        if (activeTab !== 'journeys') return;
        const t = setInterval(fetchJourneys, 30000);
        return () => clearInterval(t);
    }, [activeTab, fetchJourneys]);

    /* Derived stats */
    const totalPassengers = MOCK_STATIONS.reduce((s, st) => s + st.passengers, 0);
    const totalRevenue = MOCK_STATIONS.reduce((s, st) => s + st.revenue, 0);
    const operationalCount = MOCK_STATIONS.filter(s => s.status === 'Operational').length;
    const delayedTrains = MOCK_TRAINS.filter(t => t.status === 'Delayed').length;
    const runningTrains = MOCK_TRAINS.filter(t => t.status === 'Running').length;
    const filteredStations = stationFilter === 'All' ? MOCK_STATIONS : MOCK_STATIONS.filter(s => s.status === stationFilter);

    /* Chart data based on mode */
    const chartData = chartMode === 'Weekday' ? WEEKDAY_PAX : chartMode === 'Weekend' ? WEEKEND_PAX : HOURLY_PAX;

    /* User filters */
    const displayUsers = liveUsers.filter(u => {
        if (!userSearch) return true;
        const q = userSearch.toLowerCase();
        return u.username?.toLowerCase().includes(q) ||
            u.fullName?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.role?.toLowerCase().includes(q);
    });

    const displayJourneys = liveJourneys.filter(j => {
        if (!journeySearch) return true;
        const q = journeySearch.toLowerCase();
        return j.bookingId?.toLowerCase().includes(q) ||
            (j.passengerName || 'Guest').toLowerCase().includes(q) ||
            j.fromStation?.toLowerCase().includes(q) ||
            j.toStation?.toLowerCase().includes(q) ||
            j.userEmail?.toLowerCase().includes(q);
    });

    const publishNews = (e) => {
        e.preventDefault();
        if (!newsForm.title.trim() || !newsForm.content.trim()) return;
        setNewsList(p => [{
            id: Date.now(), title: newsForm.title, content: newsForm.content,
            date: currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        }, ...p]);
        setNewsForm({ title: '', content: '' });
    };

    const roleColor = role =>
        role === 'Officer' ? 'blue' :
            role === 'Station Master' ? 'purple' :
                'green';

    return (
        <div className="od-root">
            {/* ── Sidebar ── */}
            <aside className="od-sidebar">
                <div className="od-brand">
                    <div className="od-brand-icon-wrap"><Building01Icon size={22} color="#fff" strokeWidth={1.5} /></div>
                    <div className="od-brand-text">
                        <div className="od-brand-title">KMRL</div>
                        <div className="od-brand-sub">Ops Control</div>
                    </div>
                </div>
                <nav className="od-nav">
                    {NAV.map(item => (
                        <button key={item.key} className={`od-nav-btn ${activeTab === item.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.key)} title={item.label}>
                            <span className="od-nav-btn-icon"><item.Icon size={18} color="currentColor" strokeWidth={1.5} /></span>
                            <span className="od-nav-btn-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="od-sidebar-footer">
                    <div className="od-user-info">
                        <div className="od-user-avatar"><UserGroupIcon size={17} color="#fff" strokeWidth={2} /></div>
                        <div className="od-user-text">
                            <div className="od-user-name">{user?.fullName || 'KMRL Officer'}</div>
                            <div className="od-user-role">Operations Officer</div>
                        </div>
                    </div>
                    <button className="od-logout-btn" onClick={() => { onLogout(); onNavigate('home'); }}>
                        <Logout01Icon size={14} color="currentColor" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="od-main">
                {/* Topbar */}
                <div className="od-topbar">
                    <div className="od-topbar-left">
                        <h1 className="od-page-title">
                            {activeTab === 'overview' && 'System Overview'}
                            {activeTab === 'stations' && 'All Stations'}
                            {activeTab === 'trains' && 'Fleet Monitor'}
                            {activeTab === 'users' && 'User Management'}
                            {activeTab === 'news' && 'News & Updates'}
                            {activeTab === 'reports' && 'Reports & Analytics'}
                            {activeTab === 'complaints' && 'Complaints Hub'}
                        </h1>
                        <p className="od-page-sub">
                            Kochi Metro Rail Limited &middot;{' '}
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                    <div className="od-topbar-right">
                        <div className="od-search-wrap">
                            <Search01Icon size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px' }} />
                            <input className="od-search-topbar" type="text" placeholder="Search..." style={{ paddingLeft: '30px' }} />
                        </div>
                        <div className="od-notif-btn" title="Notifications"><Notification01Icon size={17} color="currentColor" strokeWidth={1.5} /></div>
                        <button className="od-home-btn" onClick={() => onNavigate('home')}>← Main Site</button>
                    </div>
                </div>

                {/* ════════════════════════ OVERVIEW ════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="od-content">
                        {/* Stat Cards */}
                        <div className="od-stats-grid">
                            {[
                                { label: 'Total Stations', value: MOCK_STATIONS.length, Icon: Building01Icon, color: '#7c3aed', trend: `${operationalCount} active` },
                                { label: 'Fleet Running', value: runningTrains, Icon: SpeedTrain01Icon, color: '#0d9488', trend: '↑ On schedule' },
                                { label: 'Delayed Trains', value: delayedTrains, Icon: Alert01Icon, color: delayedTrains > 0 ? '#f59e0b' : '#10b981', trend: delayedTrains > 0 ? 'Needs Action' : 'All clear', trendClass: delayedTrains > 0 ? 'warn' : '' },
                                { label: 'Today Passengers', value: totalPassengers.toLocaleString(), Icon: UserGroupIcon, color: '#0066b3', trend: '↑ 8.3%' },
                            ].map(s => (
                                <div key={s.label} className="od-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="od-stat-top">
                                        <div className="od-stat-icon"><s.Icon size={20} color={s.color} strokeWidth={1.5} /></div>
                                        <span className={`od-stat-trend ${s.trendClass || ''}`}>{s.trend}</span>
                                    </div>
                                    <div className="od-stat-value">{s.value}</div>
                                    <div className="od-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Chart + Calendar */}
                        <div className="od-overview-two-col">
                            <div className="od-card">
                                <div className="od-card-head">
                                    <span className="od-card-title">Hourly Passenger Load</span>
                                    <div className="od-chart-mode-btns">
                                        {['Today', 'Weekday', 'Weekend'].map(m => (
                                            <button key={m}
                                                className={`od-mode-btn ${chartMode === m ? 'active' : ''}`}
                                                onClick={() => setChartMode(m)}>{m}</button>
                                        ))}
                                    </div>
                                </div>
                                <PassengerBarChart data={chartData} labels={HOUR_LABELS} mode={chartMode} />
                            </div>

                            <OfficerCalendar
                                selectedDate={selectedDate}
                                onSelectDate={setSelectedDate}
                            />
                        </div>

                        {/* Station + Fleet + AI */}
                        <div className="od-three-col">
                            <div className="od-card">
                                <div className="od-card-head">
                                    <span className="od-card-title">Station Status</span>
                                    <span className="od-card-badge">{operationalCount}/{MOCK_STATIONS.length} OK</span>
                                </div>
                                {MOCK_STATIONS.map(s => (
                                    <div className="od-row" key={s.name}>
                                        <div className="od-row-left">
                                            <div className={`od-row-dot ${s.status === 'Maintenance' ? 'warn' : s.status === 'Closed' ? 'danger' : ''}`} />
                                            <div>
                                                <div className="od-row-id">{s.name}</div>
                                                <div className="od-sub">{s.passengers.toLocaleString()} pax</div>
                                            </div>
                                        </div>
                                        <span className={`od-badge ${s.status === 'Operational' ? 'green' : s.status === 'Maintenance' ? 'amber' : 'red'}`}>{s.status}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="od-card">
                                <div className="od-card-head">
                                    <span className="od-card-title">Fleet Status</span>
                                    <span className="od-card-badge">{MOCK_TRAINS.length} trains</span>
                                </div>
                                {MOCK_TRAINS.map(t => (
                                    <div className="od-row" key={t.id}>
                                        <div className="od-row-left">
                                            <div className={`od-row-dot ${t.status === 'Delayed' ? 'warn' : t.status === 'Maintenance' ? 'danger' : ''}`} />
                                            <div>
                                                <div className="od-row-id">{t.id}</div>
                                                <div className="od-sub">{t.from} → {t.to}</div>
                                            </div>
                                        </div>
                                        <span className={`od-badge ${t.status === 'Running' ? 'green' : t.status === 'Delayed' ? 'amber' : 'red'}`}>
                                            {t.status}{t.delay > 0 ? ` +${t.delay}m` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="od-ai-box">
                                <span className="od-ai-title"><AiChat01Icon size={18} color="#7c3aed" strokeWidth={1.5} /> Ops Assistant</span>
                                <p className="od-ai-body">
                                    System at 83% capacity. Palarivattom maintenance may cause crowding at adjacent stations during PM peak.
                                </p>
                                <div className="od-ai-input-row">
                                    <input className="od-ai-input" placeholder="Ask anything..." value={aiQuery} onChange={e => setAiQuery(e.target.value)} />
                                    <button className="od-ai-send"><ArrowRight01Icon size={16} color="#fff" strokeWidth={2} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════ STATIONS ═══════════════════════ */}
                {activeTab === 'stations' && (
                    <div className="od-content">
                        <div className="od-stats-grid">
                            {[
                                { label: 'Operational', value: MOCK_STATIONS.filter(s => s.status === 'Operational').length, Icon: Building01Icon, color: '#10b981', trend: 'Running Smooth' },
                                { label: 'Maintenance', value: MOCK_STATIONS.filter(s => s.status === 'Maintenance').length, Icon: Settings01Icon, color: '#f59e0b', trend: 'Partial Service', trendClass: 'warn' },
                                { label: 'Closed', value: MOCK_STATIONS.filter(s => s.status === 'Closed').length, Icon: Alert01Icon, color: '#ef4444', trend: 'No Service', trendClass: 'danger' },
                                { label: 'Total Passengers', value: totalPassengers.toLocaleString(), Icon: UserGroupIcon, color: '#7c3aed', trend: '↑ 8.3%' },
                            ].map(s => (
                                <div key={s.label} className="od-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="od-stat-top">
                                        <div className="od-stat-icon"><s.Icon size={20} color={s.color} strokeWidth={1.5} /></div>
                                        <span className={`od-stat-trend ${s.trendClass || ''}`}>{s.trend}</span>
                                    </div>
                                    <div className="od-stat-value">{s.value}</div>
                                    <div className="od-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="od-filter-row">
                            {['All', 'Operational', 'Maintenance', 'Closed'].map(f => (
                                <button key={f} className={`od-filter-btn ${stationFilter === f ? 'active' : ''}`} onClick={() => setStationFilter(f)}>{f}</button>
                            ))}
                        </div>
                        <div className="od-card">
                            <div className="od-card-head">
                                <span className="od-card-title">Station Directory</span>
                                <span className="od-card-badge">{filteredStations.length} stations</span>
                            </div>
                            <table className="od-table">
                                <thead><tr><th>Station</th><th>Status</th><th>Passengers</th><th>Revenue</th><th>Station Master</th></tr></thead>
                                <tbody>
                                    {filteredStations.map(s => (
                                        <tr key={s.name}>
                                            <td><strong>{s.name}</strong></td>
                                            <td><span className={`od-badge ${s.status === 'Operational' ? 'green' : s.status === 'Maintenance' ? 'amber' : 'red'}`}>{s.status}</span></td>
                                            <td>{s.passengers.toLocaleString()}</td>
                                            <td style={{ color: '#7c3aed', fontWeight: 700 }}>₹{s.revenue.toLocaleString()}</td>
                                            <td>{s.master}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="od-card">
                            <div className="od-card-head"><span className="od-card-title">Passenger Load by Station</span></div>
                            <div className="od-bar-chart">
                                {MOCK_STATIONS.map(s => (
                                    <div className="od-bar-row" key={s.name}>
                                        <span className="od-bar-label">{s.name}</span>
                                        <div className="od-bar-track"><div className="od-bar-fill" style={{ width: `${Math.min(100, (s.passengers / 7000) * 100).toFixed(0)}%` }} /></div>
                                        <span className="od-bar-val">{s.passengers.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════ FLEET ══════════════════════════ */}
                {activeTab === 'trains' && (
                    <div className="od-content">
                        <div className="od-stats-grid">
                            {[
                                { label: 'Running', value: runningTrains, Icon: SpeedTrain01Icon, color: '#10b981', trend: 'On Schedule' },
                                { label: 'Delayed', value: delayedTrains, Icon: Clock01Icon, color: '#f59e0b', trend: `+${delayedTrains * 3}m avg`, trendClass: 'warn' },
                                { label: 'Maintenance', value: MOCK_TRAINS.filter(t => t.status === 'Maintenance').length, Icon: Settings01Icon, color: '#ef4444', trend: 'Offline', trendClass: 'danger' },
                                { label: 'Total Onboard', value: MOCK_TRAINS.reduce((s, t) => s + t.passengers, 0), Icon: UserGroupIcon, color: '#7c3aed', trend: 'Across fleet' },
                            ].map(s => (
                                <div key={s.label} className="od-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="od-stat-top">
                                        <div className="od-stat-icon"><s.Icon size={20} color={s.color} strokeWidth={1.5} /></div>
                                        <span className={`od-stat-trend ${s.trendClass || ''}`}>{s.trend}</span>
                                    </div>
                                    <div className="od-stat-value">{s.value}</div>
                                    <div className="od-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="od-card">
                            <div className="od-card-head">
                                <span className="od-card-title">Fleet Monitor</span>
                                <span className="od-card-badge">{MOCK_TRAINS.length} trains</span>
                            </div>
                            <table className="od-table">
                                <thead><tr><th>Train ID</th><th>From</th><th>To</th><th>Passengers</th><th>Delay</th><th>Status</th></tr></thead>
                                <tbody>
                                    {MOCK_TRAINS.map(t => (
                                        <tr key={t.id}>
                                            <td><strong>{t.id}</strong></td>
                                            <td>{t.from}</td><td>{t.to}</td><td>{t.passengers}</td>
                                            <td style={{ color: t.delay > 0 ? '#f59e0b' : '#94a3b8' }}>{t.delay > 0 ? `+${t.delay} min` : '—'}</td>
                                            <td><span className={`od-badge ${t.status === 'Running' ? 'green' : t.status === 'Delayed' ? 'amber' : 'red'}`}>{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ════════════════════════ USERS (REAL-TIME) ══════════════ */}
                {activeTab === 'users' && (
                    <div className="od-content">
                        {/* User stat cards */}
                        <div className="od-stats-grid">
                            {[
                                { label: 'Total Users', value: liveUsers.length, Icon: UserGroupIcon, color: '#7c3aed', trend: 'Registered' },
                                { label: 'Customers', value: liveUsers.filter(u => u.role === 'Customer').length, Icon: UserGroupIcon, color: '#10b981', trend: 'Active passengers' },
                                { label: 'Station Masters', value: liveUsers.filter(u => u.role === 'Station Master').length, Icon: Building01Icon, color: '#f59e0b', trend: 'Assigned' },
                                { label: 'Officers', value: liveUsers.filter(u => u.role === 'Officer').length, Icon: DashboardCircleIcon, color: '#0066b3', trend: 'Ops team' },
                            ].map(s => (
                                <div key={s.label} className="od-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="od-stat-top">
                                        <div className="od-stat-icon"><s.Icon size={20} color={s.color} strokeWidth={1.5} /></div>
                                        <span className="od-stat-trend">{s.trend}</span>
                                    </div>
                                    <div className="od-stat-value">{s.value}</div>
                                    <div className="od-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="od-card">
                            <div className="od-card-head">
                                <span className="od-card-title">User Directory</span>
                                <div className="od-users-head-right">
                                    {lastRefresh && (
                                        <span className="od-refresh-time">
                                            Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                    <button
                                        className="od-refresh-btn"
                                        onClick={fetchUsers}
                                        disabled={usersLoading}
                                        title="Refresh users"
                                    >
                                        <RefreshIcon size={14} color="currentColor" strokeWidth={2}
                                            style={{ animation: usersLoading ? 'od-spin 0.8s linear infinite' : 'none' }} />
                                        {usersLoading ? 'Loading…' : 'Refresh'}
                                    </button>
                                    <span className="od-card-badge">{liveUsers.length} users</span>
                                </div>
                            </div>

                            {/* Search bar */}
                            <div className="od-users-search-wrap">
                                <Search01Icon size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
                                <input
                                    className="od-users-search"
                                    type="text"
                                    placeholder="Search by name, username, email, role..."
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    style={{ paddingLeft: '36px' }}
                                />
                            </div>

                            {usersError && (
                                <div className="od-users-error">
                                    ⚠ Could not load users: {usersError}
                                    <button className="od-retry-btn" onClick={fetchUsers}>Retry</button>
                                </div>
                            )}

                            {usersLoading && liveUsers.length === 0 ? (
                                <div className="od-users-loading">
                                    <div className="od-spinner" />
                                    <span>Fetching users from database…</span>
                                </div>
                            ) : (
                                <table className="od-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Username</th>
                                            <th>Full Name</th>
                                            <th>Role</th>
                                            <th>Email</th>
                                            <th>Station</th>
                                            <th>Joined</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                                                    {userSearch ? 'No users match your search.' : 'No users found in database.'}
                                                </td>
                                            </tr>
                                        ) : displayUsers.map((u, idx) => (
                                            <tr key={u.id || u.username}>
                                                <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{idx + 1}</td>
                                                <td><strong>{u.username}</strong></td>
                                                <td>{u.fullName}</td>
                                                <td><span className={`od-badge ${roleColor(u.role)}`}>{u.role}</span></td>
                                                <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{u.email}</td>
                                                <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{u.stationAssigned || '—'}</td>
                                                <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                                </td>
                                                <td><span className="od-badge green">Active</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════════════════ USER JOURNEYS ══════════════════ */}
                {activeTab === 'journeys' && (() => {
                    const todayStr = currentTime.toLocaleDateString();
                    const todayJourneys = liveJourneys.filter(j => new Date(j.createdAt).toLocaleDateString() === todayStr);
                    const todayRevenue = todayJourneys.reduce((sum, j) => sum + (j.fare || 0), 0);
                    const activeJourneys = todayJourneys.filter(j => j.status === 'Success').length;
                    const failedPayments = liveJourneys.filter(j => j.status === 'Failed').length;

                    return (
                        <div className="od-content">
                            <div className="od-stats-grid">
                                {[
                                    { label: 'Total Journeys (Today)', value: todayJourneys.length.toLocaleString(), Icon: Ticket01Icon, color: '#7c3aed', trend: 'Network' },
                                    { label: 'Ticket Revenue', value: `₹${todayRevenue.toLocaleString()}`, Icon: MoneyBag01Icon, color: '#10b981', trend: 'Today', trendClass: '' },
                                    { label: 'Active Today', value: activeJourneys.toLocaleString(), Icon: Train01Icon, color: '#f59e0b', trend: 'Success Txns', trendClass: 'warn' },
                                    { label: 'Failed Payments', value: failedPayments.toLocaleString(), Icon: Alert01Icon, color: '#ef4444', trend: 'Needs check', trendClass: 'danger' },
                                ].map(s => (
                                    <div key={s.label} className="od-stat-card" style={{ '--stat-color': s.color }}>
                                        <div className="od-stat-top">
                                            <div className="od-stat-icon"><s.Icon size={20} color={s.color} strokeWidth={1.5} /></div>
                                            <span className={`od-stat-trend ${s.trendClass || ''}`}>{s.trend}</span>
                                        </div>
                                        <div className="od-stat-value">{s.value}</div>
                                        <div className="od-stat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="od-card">
                                <div className="od-card-head">
                                    <span className="od-card-title">Live User Journeys & Transactions</span>
                                    <div className="od-users-head-right">
                                        {lastJourneyRefresh && (
                                            <span className="od-refresh-time">
                                                Updated {lastJourneyRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        <button
                                            className="od-refresh-btn"
                                            onClick={fetchJourneys}
                                            disabled={journeysLoading}
                                            title="Refresh journeys"
                                        >
                                            <RefreshIcon size={14} color="currentColor" strokeWidth={2}
                                                style={{ animation: journeysLoading ? 'od-spin 0.8s linear infinite' : 'none' }} />
                                            {journeysLoading ? 'Loading…' : 'Refresh'}
                                        </button>
                                        <span className="od-card-badge">{liveJourneys.length} total</span>
                                    </div>
                                </div>

                                <div className="od-users-search-wrap">
                                    <Search01Icon size={14} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
                                    <input
                                        className="od-users-search"
                                        type="text"
                                        placeholder="Search by transaction ID, user, or station..."
                                        style={{ paddingLeft: '36px' }}
                                        value={journeySearch}
                                        onChange={e => setJourneySearch(e.target.value)}
                                    />
                                </div>

                                {journeysError && (
                                    <div className="od-users-error">
                                        ⚠ Could not load journeys: {journeysError}
                                        <button className="od-retry-btn" onClick={fetchJourneys}>Retry</button>
                                    </div>
                                )}

                                {journeysLoading && liveJourneys.length === 0 ? (
                                    <div className="od-users-loading">
                                        <div className="od-spinner" />
                                        <span>Fetching bookings from database…</span>
                                    </div>
                                ) : (
                                    <table className="od-table">
                                        <thead>
                                            <tr>
                                                <th>Txn ID</th>
                                                <th>User</th>
                                                <th>Route (From → To)</th>
                                                <th>Timestamp</th>
                                                <th>Amount</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayJourneys.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '32px' }}>
                                                        {journeySearch ? 'No journeys match your search.' : 'No booking records found in database.'}
                                                    </td>
                                                </tr>
                                            ) : displayJourneys.map(j => (
                                                <tr key={j.bookingId}>
                                                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}><strong>{j.bookingId}</strong></td>
                                                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                                        {j.passengerName || 'Guest User'}
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>{j.userEmail || j.passengerPhone || 'No contact info'}</div>
                                                    </td>
                                                    <td>{j.fromStation} <ArrowRight01Icon size={12} color="#94a3b8" style={{ verticalAlign: 'middle', margin: '0 4px' }} /> {j.toStation}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {new Date(j.createdAt).toLocaleDateString('en-GB')}<br />
                                                        {new Date(j.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td style={{ fontWeight: 700, color: '#10b981' }}>₹{j.fare}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{j.method || 'Card/UPI'}</td>
                                                    <td>
                                                        <span className={`od-badge ${j.status === 'Success' || j.status === 'Completed' ? 'green' : 'amber'}`}>
                                                            {j.status || 'Completed'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* ════════════════════════ NEWS ═══════════════════════════ */}
                {activeTab === 'news' && (
                    <div className="od-content">
                        <div className="od-two-col">
                            <div className="od-card">
                                <div className="od-card-head"><span className="od-card-title">Publish New Update</span></div>
                                <form onSubmit={publishNews} className="od-form">
                                    <label>Headline / Title</label>
                                    <input type="text" placeholder="Enter news headline..." value={newsForm.title} onChange={e => setNewsForm(p => ({ ...p, title: e.target.value }))} required />
                                    <label>Content</label>
                                    <textarea rows={5} placeholder="Enter full announcement..." value={newsForm.content} onChange={e => setNewsForm(p => ({ ...p, content: e.target.value }))} required />
                                    <button type="submit" className="od-primary-btn">
                                        <DocumentAttachmentIcon size={15} color="currentColor" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Publish Update
                                    </button>
                                </form>
                            </div>
                            <div className="od-card">
                                <div className="od-card-head"><span className="od-card-title">Published Updates</span><span className="od-card-badge">{newsList.length} items</span></div>
                                {newsList.map(n => (
                                    <div className="od-news-row" key={n.id}>
                                        <strong>{n.title}</strong>
                                        <p>{n.content}</p>
                                        <span className="od-news-date">
                                            <Calendar01Icon size={12} color="#94a3b8" strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{n.date}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════ REPORTS ════════════════════════ */}
                {activeTab === 'reports' && (
                    <div className="od-content">
                        {/* Daily summary calendar */}
                        <div className="od-reports-top">
                            <div className="od-card" style={{ flex: 1 }}>
                                <div className="od-card-head">
                                    <span className="od-card-title">Revenue Trend (Hourly)</span>
                                    <span className="od-card-badge">Today</span>
                                </div>
                                <PassengerBarChart
                                    data={[4200, 11800, 18400, 8900, 6100, 7200, 5400, 4800, 7100, 10200, 19100, 13800]}
                                    labels={HOUR_LABELS}
                                    mode="Today"
                                />
                            </div>
                            <OfficerCalendar
                                selectedDate={selectedDate}
                                onSelectDate={setSelectedDate}
                            />
                        </div>

                        <div className="od-stats-grid">
                            {[
                                { label: 'Total Revenue (Today)', value: `₹${(totalRevenue / 1000).toFixed(0)}K`, Icon: MoneyBag01Icon, color: '#10b981', trend: '↑ 12.4%' },
                                { label: 'Tickets Issued', value: totalPassengers.toLocaleString(), Icon: Ticket01Icon, color: '#7c3aed', trend: '↑ 8.3%' },
                                { label: 'Peak Hour (AM)', value: '8:00–9:30', Icon: Clock01Icon, color: '#f59e0b', trend: 'Morning' },
                                { label: 'Peak Hour (PM)', value: '5:30–7:00', Icon: City01Icon, color: '#0066b3', trend: 'Evening' },
                            ].map(s => (
                                <div key={s.label} className="od-stat-card" style={{ '--stat-color': s.color }}>
                                    <div className="od-stat-top">
                                        <div className="od-stat-icon"><s.Icon size={20} color={s.color} strokeWidth={1.5} /></div>
                                        <span className="od-stat-trend">{s.trend}</span>
                                    </div>
                                    <div className="od-stat-value">{s.value}</div>
                                    <div className="od-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="od-card">
                            <div className="od-card-head"><span className="od-card-title">Passenger Load by Station</span></div>
                            <div className="od-bar-chart">
                                {MOCK_STATIONS.map(s => (
                                    <div className="od-bar-row" key={s.name}>
                                        <span className="od-bar-label">{s.name}</span>
                                        <div className="od-bar-track"><div className="od-bar-fill" style={{ width: `${Math.min(100, (s.passengers / 7000) * 100).toFixed(0)}%` }} /></div>
                                        <span className="od-bar-val">{s.passengers.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════ COMPLAINTS COMPONENT ════════════════════════ */}
                {activeTab === 'complaints' && (
                    <div className="od-content">
                        <div className="od-card">
                            <div className="od-card-head">
                                <span className="od-card-title">Vigilance & Grievance Complaints</span>
                                <span className="od-card-badge">{allComplaints.length} Total</span>
                            </div>

                            {allComplaints.length === 0 ? (
                                <p className="od-empty-state" style={{ padding: '2rem', textAlign: 'center' }}>No complaints found.</p>
                            ) : (
                                <table className="od-data-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ padding: '12px 8px' }}>ID / Type</th>
                                            <th style={{ padding: '12px 8px' }}>User Info</th>
                                            <th style={{ padding: '12px 8px' }}>Subject & Description</th>
                                            <th style={{ padding: '12px 8px' }}>Date</th>
                                            <th style={{ padding: '12px 8px' }}>Status</th>
                                            <th style={{ padding: '12px 8px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allComplaints.map(c => (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div style={{ fontWeight: 700 }}>{c.id}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{c.type}</div>
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div style={{ fontWeight: 600 }}>{c.userName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>{c.userEmail}</div>
                                                </td>
                                                <td style={{ padding: '12px 8px', maxWidth: '300px' }}>
                                                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{c.subject}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.description}>
                                                        {c.description}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#475569' }}>{c.date}</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                                        backgroundColor: c.status === 'Resolved' ? '#dcfce7' : c.status === 'In Progress' ? '#fef3c7' : '#f1f5f9',
                                                        color: c.status === 'Resolved' ? '#166534' : c.status === 'In Progress' ? '#d97706' : '#475569'
                                                    }}>
                                                        {c.status}
                                                    </span>
                                                    {c.type === 'Grievance' && (
                                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Handled by Station Master</div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    {c.type === 'Vigilance' ? (
                                                        <select
                                                            value={c.status}
                                                            onChange={(e) => updateVigilanceStatus(c.id, e.target.value)}
                                                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="In Progress">In Progress</option>
                                                            <option value="Resolved">Resolved</option>
                                                        </select>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Read-only</span>
                                                    )}
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

export default OfficerDashboard;
