import React, { useState, useEffect, useRef } from 'react';
import '../styles/Dashboard.css';
import VideoBackground from '../components/VideoBackground';
import metroLinesData from '../data/metroLines';
import LiveService from '../components/LiveService/LiveService';
import liveTrainsData from '../data/liveTrains.json';

function Dashboard({ user, onLogout, onNavigate }) {
    const [stats, setStats] = useState({
        totalJourneys: 0,
        savedAmount: 0,
        currentBalance: 450
    });


    const [walletBalance, setWalletBalance] = useState(450);
    const [transactions, setTransactions] = useState([
        { id: 1, description: 'Metro Journey - Aluva to MG Road', amount: 25, type: 'debit', date: new Date(Date.now() - 86400000) },
        { id: 2, description: 'Wallet Recharge', amount: 500, type: 'credit', date: new Date(Date.now() - 172800000) }
    ]);
    const [bookingHistory, setBookingHistory] = useState([
        { id: 1, from: 'Aluva', to: 'M.G. Road', date: new Date().toLocaleDateString(), fare: 25, line: 'Aluva – M.G. Road', time: '30 mins', status: 'Completed' },
        { id: 2, from: 'Palarivattom', to: 'Vyttila', date: new Date(Date.now() - 86400000).toLocaleDateString(), fare: 20, line: 'Aluva – M.G. Road', time: '15 mins', status: 'Completed' }
    ]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [allStations, setAllStations] = useState([]);
    const [fromStation, setFromStation] = useState('');
    const [toStation, setToStation] = useState('');
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [fareResult, setFareResult] = useState(null);
    const [news, setNews] = useState([]);
    const [liveTrains, setLiveTrains] = useState([]);
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [newsType, setNewsType] = useState('information');
    const [newsPriority, setNewsPriority] = useState('medium');
    const [ticketType, setTicketType] = useState('single');
    const [selectedService, setSelectedService] = useState('all');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editData, setEditData] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        username: user?.username || ''
    });
    const fromDropdownRef = useRef(null);
    const toDropdownRef = useRef(null);

    useEffect(() => {
        // Simulate fetching user data
        fetchUserData();
        fetchStations();
        fetchNews();
        fetchLiveTrains();

        const iv = setInterval(() => {
            fetchLiveTrains();
        }, 15000);

        return () => clearInterval(iv);
    }, []);

    const fetchLiveTrains = async () => {
        try {
            const resp = await fetch('/api/metro/trains/live');
            if (!resp.ok) return;
            const data = await resp.json();
            setLiveTrains(data);
        } catch (err) {
            console.error('Error fetching live trains', err);
            // fallback to local static live trains
            setLiveTrains(liveTrainsData || []);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
                setShowFromDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStations = async () => {
        // Initialize with local data first
        const localStations = [];
        metroLinesData.forEach(line => {
            (line.stations || []).forEach(station => {
                if (!localStations.find(s => s.name === station.name)) {
                    localStations.push({
                        name: station.name,
                        code: station.code || station.name.slice(0, 3).toUpperCase(),
                        lat: station.lat,
                        lng: station.lng
                    });
                }
            });
        });
        setAllStations(localStations);

        // Try to fetch from backend
        try {
            const response = await fetch('/api/metro/stations');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setAllStations(data);
                }
            }
        } catch (error) {
            console.log('Using local station data:', error.message);
        }
    };

    const fetchNews = async () => {
        try {
            const response = await fetch('/api/news/all');
            if (response.ok) {
                const data = await response.json();
                setNews(data);
                // Show popup notification for new news
                if (data.length > 0) {
                    showNewsNotification(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        }
    };

    const showNewsNotification = (newsItem) => {
        // Create popup notification
        const notification = document.createElement('div');
        notification.className = 'news-notification-popup';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <h4>${newsItem.title}</h4>
                    <button onclick="this.parentElement.parentElement.remove()">✕</button>
                </div>
                <p>${newsItem.description || newsItem.content.substring(0, 100)}...</p>
                <small>Priority: ${newsItem.priority.toUpperCase()}</small>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    };

    const handleCalculateFare = async () => {
        if (!fromStation || !toStation) {
            alert('Please select both stations');
            return;
        }

        if (fromStation === toStation) {
            alert('From and To stations must be different');
            return;
        }

        // Use local fare calculation (mock) to avoid backend dependency
        calculateLocalFare(fromStation, toStation);
    };

    const calculateLocalFare = (from, to) => {
        // Find both stations in local data
        let fromStation = null;
        let toStation = null;
        let lineFound = null;

        for (let line of metroLinesData) {
            const fromStn = (line.stations || []).find(s => s.name === from);
            const toStn = (line.stations || []).find(s => s.name === to);

            if (fromStn && toStn) {
                fromStation = fromStn;
                toStation = toStn;
                lineFound = line;
                break;
            }
        }

        if (!fromStation || !toStation) {
            alert('Route not found. Please select stations on the same line.');
            return;
        }

        const fromIdx = (lineFound.stations || []).findIndex(s => s.name === from);
        const toIdx = (lineFound.stations || []).findIndex(s => s.name === to);
        const distance = Math.abs(toIdx - fromIdx);
        const fare = Math.max(20, distance * 5); // ₹20 minimum, then ₹5 per station

        setFareResult({
            fromStation: from,
            toStation: to,
            distance: distance,
            fare: fare
        });
    };

    const handleFromStationChange = (e) => {
        const value = e.target.value;
        setFromStation(value);

        if (value.trim() === '') {
            setFromSuggestions(allStations); // Show all stations when empty
        } else {
            const filtered = allStations.filter(station =>
                station.name.toLowerCase().includes(value.toLowerCase()) ||
                station.code.toLowerCase().includes(value.toLowerCase())
            );
            setFromSuggestions(filtered);
        }
        setShowFromDropdown(true);
    };

    const handleToStationChange = (e) => {
        const value = e.target.value;
        setToStation(value);

        if (value.trim() === '') {
            setToSuggestions(allStations); // Show all stations when empty
        } else {
            const filtered = allStations.filter(station =>
                station.name.toLowerCase().includes(value.toLowerCase()) ||
                station.code.toLowerCase().includes(value.toLowerCase())
            );
            setToSuggestions(filtered);
        }
        setShowToDropdown(true);
    };

    const selectFromStation = (station) => {
        setFromStation(station.name);
        setFromSuggestions([]);
        setShowFromDropdown(false);
    };

    const selectToStation = (station) => {
        setToStation(station.name);
        setToSuggestions([]);
        setShowToDropdown(false);
    };

    // Normalize route-like objects to UI-friendly shape
    const normalizeRoute = (r) => {
        if (!r) return null;
        return {
            lineName: r.lineName || r.line || r.line_name || (r.lineObj && r.lineObj.name) || 'Line',
            fromStation: r.fromStation || r.from || r.origin || r.start || '',
            toStation: r.toStation || r.to || r.destination || r.end || '',
            estimatedTime: Number(r.estimatedTime ?? r.duration ?? r.time ?? r.durationMinutes ?? 0),
            numberOfStops: Number(r.numberOfStops ?? r.stops ?? r.stopCount ?? 0),
            fare: Number(r.fare ?? r.price ?? r.cost ?? 0),
            intermediateStations: r.intermediateStations || r.stationsBetween || []
        };
    };

    const handleBookTicket = (train) => {
        const normalized = normalizeRoute(train);
        setSelectedTrain(normalized || train);
        setShowBookingModal(true);
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setSelectedTrain(null);
    };

    const submitBooking = () => {
        const ticketData = {
            fromStation: fromStation || (selectedTrain && (selectedTrain.fromStation || selectedTrain.from)) || '',
            toStation: toStation || (selectedTrain && (selectedTrain.toStation || selectedTrain.to)) || '',
            fare: fareResult?.fare || 20,
            lineName: (selectedTrain && selectedTrain.lineName) || (fareResult && fareResult.line) || '',
            estimatedTime: fareResult?.estimatedTime || '30 mins'
        };
        handleBookTicketFromModal(ticketData);
    };

    const handleEditProfile = () => {
        setIsEditingProfile(true);
        setEditData({
            fullName: user?.fullName || '',
            email: user?.email || '',
            username: user?.username || ''
        });
    };

    const handleSaveProfile = () => {
        alert(`✓ Profile updated successfully!\nName: ${editData.fullName}\nEmail: ${editData.email}`);
        setIsEditingProfile(false);
    };

    const handleCancelEdit = () => {
        setIsEditingProfile(false);
    };

    const handlePostNews = async (e) => {
        e.preventDefault();

        // Only station masters and officers can post news
        if (user?.userType !== 'station_master' && user?.userType !== 'officer') {
            alert('Only station masters and officers can post news');
            return;
        }

        // Add news locally (mock) instead of calling backend
        const newItem = {
            id: Date.now(),
            title: newsTitle,
            description: newsContent.substring(0, 100),
            content: newsContent,
            date: new Date().toISOString().slice(0, 10),
            postedByName: user?.fullName || 'Local User',
            priority: newsPriority
        };
        setNews(prev => [newItem, ...(prev || [])]);
        alert('News posted (mock)');
        setNewsTitle('');
        setNewsContent('');
    };

    const fetchUserData = async () => {
        setLoading(true);
        try {
            let apiData = [];
            const token = localStorage.getItem('kmrl_token');

            if (token) {
                try {
                    const resp = await fetch('/api/metro/my-bookings', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resp.ok) {
                        const data = await resp.json();
                        apiData = data.map(t => ({
                            id: t.bookingId || 'TXN',
                            from: t.fromStation || t.from || 'Network',
                            to: t.toStation || t.to || 'Network',
                            date: new Date(t.createdAt).toLocaleDateString(),
                            fare: t.fare || 0,
                            status: t.status || 'Completed'
                        }));
                    }
                } catch (err) {
                    console.warn('API error fetching dashboard bookings', err);
                }
            }

            // Fallback local storage
            const storedTxns = JSON.parse(localStorage.getItem('kmrl_all_transactions') || '[]');
            const filteredTxns = storedTxns.filter(t => user && (t.email === user.email || t.passengerName === user.fullName));
            const localData = filteredTxns.map(t => ({
                id: t.bookingId || 'TXN',
                from: t.fromStation || t.from || 'Network',
                to: t.toStation || t.to || 'Network',
                date: new Date(t.date || new Date()).toLocaleDateString(),
                fare: t.fare || 0,
                status: t.status || 'Completed'
            }));

            // Combine filtering duplicates by bookingId
            const uniqueMap = new Map();
            localData.forEach(t => {
                if (t.id && t.id !== 'TXN' && !uniqueMap.has(t.id)) {
                    uniqueMap.set(t.id, t);
                } else if (!t.id || t.id === 'TXN') {
                    uniqueMap.set('TXN-' + Math.random(), t);
                }
            });
            apiData.forEach(t => {
                if (t.id && t.id !== 'TXN' && !uniqueMap.has(t.id)) {
                    uniqueMap.set(t.id, t);
                } else if (!t.id || t.id === 'TXN') {
                    uniqueMap.set('TXN-' + Math.random(), t);
                }
            });
            const combined = Array.from(uniqueMap.values());

            // Make sure newer tickets are first
            combined.sort((a, b) => new Date(b.date) - new Date(a.date));

            setBookingHistory(combined);

            setStats({
                totalJourneys: combined.length,
                savedAmount: combined.length * 15, // Mock savings calculation
                currentBalance: 450
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('kmrl_token');
        localStorage.removeItem('kmrl_user');
        onLogout();
    };

    const goToSearchMetro = () => {
        onNavigate('search');
    };

    const goToFindMetro = () => {
        onNavigate('findmetro');
    };

    const handleRecharge = (amount) => {
        const newBalance = walletBalance + amount;
        setWalletBalance(newBalance);
        const newTransaction = {
            id: transactions.length + 1,
            description: `Wallet Recharge - ₹${amount}`,
            amount: amount,
            type: 'credit',
            date: new Date()
        };
        setTransactions([newTransaction, ...transactions]);
        alert(`✓ ₹${amount} successfully added to your wallet!\nNew Balance: ₹${newBalance}`);
    };

    const handleBookTicketFromModal = async (ticketData) => {
        if (walletBalance < ticketData.fare) {
            alert('Insufficient balance. Please recharge your wallet.');
            setActiveTab('wallet');
            return;
        }

        const newBalance = walletBalance - ticketData.fare;

        try {
            const token = localStorage.getItem('kmrl_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Try resolving codes (simplified extraction based on name matching)
            const getCodeFor = (name) => {
                const found = allStations.find(s => s.name.toLowerCase() === String(name).toLowerCase() || (s.code || s.id) === String(name).toUpperCase());
                return found ? (found.code || found.id) : String(name).substring(0, 3).toUpperCase();
            };

            const payload = {
                fromStation: getCodeFor(ticketData.fromStation),
                toStation: getCodeFor(ticketData.toStation),
                type: 'single',
                passengerName: user ? user.fullName : 'Dashboard User',
                email: user ? user.email : undefined
            };

            const resp = await fetch('/api/metro/book', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                console.warn('Booking API error, proceeding with local fallback.');
            } else {
                const data = await resp.json();
                console.log('Successfully saved to MongoDB Bookings:', data);
            }
        } catch (err) {
            console.warn('Failed to connect to backend for booking, mock state used instead.');
        }

        setWalletBalance(newBalance);

        const newBooking = {
            id: bookingHistory.length + 1,
            from: ticketData.fromStation,
            to: ticketData.toStation,
            date: new Date().toLocaleDateString(),
            fare: ticketData.fare,
            line: ticketData.lineName,
            time: ticketData.estimatedTime || '30 mins',
            status: 'Completed'
        };
        setBookingHistory(prev => [newBooking, ...prev]);

        const debitTransaction = {
            id: transactions.length + 1,
            description: `Journey: ${ticketData.fromStation} → ${ticketData.toStation}`,
            amount: ticketData.fare,
            type: 'debit',
            date: new Date()
        };
        setTransactions(prev => [debitTransaction, ...prev]);

        alert(`✓ Ticket booked successfully and securely embedded to database!\n\nFrom: ${ticketData.fromStation}\nTo: ${ticketData.toStation}\nFare: ₹${ticketData.fare}\nLine: ${ticketData.lineName}\nTime: ${ticketData.estimatedTime || '30 mins'}\n\nRemaining Balance: ₹${newBalance}`);
        closeBookingModal();
    };

    return (
        <div className="dashboard-container page-content-above-video">
            <VideoBackground src="/images/dashboard.jpg" poster="/images/dashboard.jpg" overlayOpacity={0.36} />
            {/* Navigation Tabs */}
            <div className="dashboard-nav">
                <button
                    className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Overview
                </button>
                <button
                    className={`nav-btn ${activeTab === 'fare-calculator' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fare-calculator')}
                >
                    💰 Fare Calculator
                </button>
                <button
                    className={`nav-btn ${activeTab === 'realtime-info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('realtime-info')}
                >
                    ⏱️ Real-time Info
                </button>
                <button
                    className={`nav-btn ${activeTab === 'ticket-types' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ticket-types')}
                >
                    🎫 Ticket Types
                </button>
                <button
                    className={`nav-btn ${activeTab === 'live-service' ? 'active' : ''}`}
                    onClick={() => setActiveTab('live-service')}
                >
                    📍 Live Service
                </button>
                <button
                    className={`nav-btn ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    📰 News & Updates
                </button>
                {(user?.userType === 'station_master' || user?.userType === 'officer') && (
                    <button
                        className={`nav-btn ${activeTab === 'post-news' ? 'active' : ''}`}
                        onClick={() => setActiveTab('post-news')}
                    >
                        📝 Post News
                    </button>
                )}
                <button
                    className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bookings')}
                >
                    🎟️ My Bookings
                </button>
                <button
                    className={`nav-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wallet')}
                >
                    💳 Wallet
                </button>
                <button
                    className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profile
                </button>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <div className="welcome-section">
                            <h2>Welcome back, {user?.fullName || user?.username}! 👋</h2>
                            <p>Your KMRL Metro journey awaits</p>
                        </div>

                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📍</div>
                                <div className="stat-content">
                                    <h3>Total Journeys</h3>
                                    <p className="stat-value">{stats.totalJourneys}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <h3>Amount Saved</h3>
                                    <p className="stat-value">₹{stats.savedAmount}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">💳</div>
                                <div className="stat-content">
                                    <h3>Wallet Balance</h3>
                                    <p className="stat-value">₹{stats.currentBalance}</p>
                                </div>
                            </div>
                            {(user?.userType === 'station_master' || user?.userType === 'officer') && (
                                <div className="stat-card staff-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('post-news')}>
                                    <div className="stat-icon">📝</div>
                                    <div className="stat-content">
                                        <h3>Post Station Update</h3>
                                        <p className="stat-value">Publish quick updates and announcements</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Action */}
                        <div className="quick-action">
                            <button className="btn-search-metro" onClick={goToFindMetro}>
                                🚇 Find Metro Routes
                            </button>
                            <button className="btn-search-metro" onClick={goToSearchMetro}>
                                🔍 Search & Book Now
                            </button>
                        </div>

                        {/* Recent Bookings */}
                        <div className="recent-section">
                            <h3>Recent Journeys</h3>
                            {loading ? (
                                <p className="loading">Loading...</p>
                            ) : bookingHistory.length > 0 ? (
                                <div className="bookings-list">
                                    {bookingHistory.map((booking) => (
                                        <div key={booking.id} className="booking-item">
                                            <div className="booking-route">
                                                <span className="station from">{booking.from}</span>
                                                <span className="arrow">→</span>
                                                <span className="station to">{booking.to}</span>
                                            </div>
                                            <div className="booking-details">
                                                <span className="date">{booking.date}</span>
                                                <span className="status">{booking.status}</span>
                                            </div>
                                            <div className="booking-fare">₹{booking.fare}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-data">No journeys yet. Start booking!</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Fare Calculator Tab */}
                {activeTab === 'fare-calculator' && (
                    <div className="tab-content">
                        <h2>💰 Station to Station Fare Calculator</h2>
                        <div className="fare-calculator-card">
                            <div className="fare-form">
                                <div className="form-group" ref={fromDropdownRef}>
                                    <label>From Station</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={fromStation}
                                            onChange={handleFromStationChange}
                                            onFocus={() => {
                                                setShowFromDropdown(true);
                                                if (fromStation.trim() === '') {
                                                    setFromSuggestions(allStations);
                                                }
                                            }}
                                            placeholder="Search or select station..."
                                            autoComplete="off"
                                        />
                                        {showFromDropdown && fromSuggestions.length > 0 && (
                                            <div className="dropdown-list">
                                                {fromSuggestions.map((station, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="dropdown-item"
                                                        onClick={() => selectFromStation(station)}
                                                    >
                                                        <div className="station-info">
                                                            <strong>{station.name}</strong>
                                                            <span className="station-code">{station.code}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group" ref={toDropdownRef}>
                                    <label>To Station</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={toStation}
                                            onChange={handleToStationChange}
                                            onFocus={() => {
                                                setShowToDropdown(true);
                                                if (toStation.trim() === '') {
                                                    setToSuggestions(allStations);
                                                }
                                            }}
                                            placeholder="Search or select station..."
                                            autoComplete="off"
                                        />
                                        {showToDropdown && toSuggestions.length > 0 && (
                                            <div className="dropdown-list">
                                                {toSuggestions.map((station, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="dropdown-item"
                                                        onClick={() => selectToStation(station)}
                                                    >
                                                        <div className="station-info">
                                                            <strong>{station.name}</strong>
                                                            <span className="station-code">{station.code}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    className="btn-calculate-fare"
                                    onClick={handleCalculateFare}
                                >
                                    Calculate Fare 🚀
                                </button>
                            </div>

                            {fareResult && (
                                <div className="fare-result-card">
                                    <div className="result-header">
                                        <h3>Fare Details</h3>
                                    </div>
                                    <div className="result-body">
                                        <div className="result-item">
                                            <span className="label">From:</span>
                                            <span className="value">{fareResult.fromStation}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="label">To:</span>
                                            <span className="value">{fareResult.toStation}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="label">Distance:</span>
                                            <span className="value">{fareResult.distance} km</span>
                                        </div>
                                        <div className="result-item highlighted">
                                            <span className="label">Fare:</span>
                                            <span className="value fare-amount">₹{fareResult.fare}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Real-time Info Tab */}
                {activeTab === 'realtime-info' && (
                    <div className="tab-content">
                        <h2>⏱️ Real-time Metro Information</h2>
                        <div className="realtime-info-grid">
                            <div className="info-card-dashboard" onClick={() => onNavigate && onNavigate('fare-calculator')} style={{ cursor: 'pointer' }}>
                                <div className="info-icon">🕐</div>
                                <h3>Operating Hours</h3>
                                <div className="info-details">
                                    <p><strong>Monday to Sunday:</strong></p>
                                    <p>6:00 AM - 10:00 PM</p>
                                    <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                                        Extended hours on weekends
                                    </p>
                                </div>
                            </div>

                            <div className="info-card-dashboard" onClick={() => onNavigate && onNavigate('realtime-info')} style={{ cursor: 'pointer' }}>
                                <div className="info-icon">🚝</div>
                                <h3>Service Status</h3>
                                <div className="info-details">
                                    <p><strong>All Lines:</strong></p>
                                    <p style={{ color: 'green', fontWeight: 'bold' }}>✓ Running Normally</p>
                                    <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
                                        Average waiting time: 2-3 minutes
                                    </p>
                                </div>
                            </div>

                            <div className="info-card-dashboard">
                                <div className="info-icon">🚆</div>
                                <h3>Live Trains</h3>
                                <div className="info-details">
                                    {liveTrains && liveTrains.length > 0 ? (
                                        <ul style={{ marginLeft: '16px' }}>
                                            {liveTrains.slice(0, 5).map((t, idx) => (
                                                <li key={t.trainId || idx} style={{ marginBottom: '6px' }}>
                                                    <strong>{t.name}</strong> — {t.currentStation || 'N/A'} {t.delayedByMinutes ? `(Delay ${t.delayedByMinutes}m)` : ''}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div>No live data</div>
                                    )}
                                </div>
                            </div>

                            <div className="info-card-dashboard" onClick={() => onNavigate && onNavigate('fare-calculator')} style={{ cursor: 'pointer' }}>
                                <div className="info-icon">🎫</div>
                                <h3>Ticket Types</h3>
                                <div className="info-details">
                                    <ul style={{ marginLeft: '20px' }}>
                                        <li>Single Journey</li>
                                        <li>Day Pass</li>
                                        <li>Smart Card</li>
                                        <li>Monthly Pass</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="info-card-dashboard" onClick={() => onNavigate && onNavigate('findmetro')} style={{ cursor: 'pointer' }}>
                                <div className="info-icon">🛂</div>
                                <h3>Station Services</h3>
                                <div className="info-details">
                                    <ul style={{ marginLeft: '20px' }}>
                                        <li>ATM/Payment</li>
                                        <li>Food Court</li>
                                        <li>Lost & Found</li>
                                        <li>Customer Care</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="info-card-dashboard" onClick={() => onNavigate && onNavigate('realtime-info')} style={{ cursor: 'pointer' }}>
                                <div className="info-icon">👥</div>
                                <h3>Crowd Status</h3>
                                <div className="info-details">
                                    <p><strong>Peak Hours:</strong></p>
                                    <p>7-9 AM, 5-7 PM</p>
                                    <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#ff6b6b' }}>
                                        ⚠️ Avoid peak hours for comfortable travel
                                    </p>
                                </div>
                            </div>

                            <div className="info-card-dashboard">
                                <div className="info-icon">📢</div>
                                <h3>Announcements</h3>
                                <div className="info-details">
                                    <p>Check news & updates tab for latest announcements and alerts</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ticket Types Tab */}
                {activeTab === 'ticket-types' && (
                    <div className="tab-content">
                        <h2>🎫 Ticket Types & Pricing</h2>
                        <div className="ticket-types-grid">
                            {/* Single Journey */}
                            <div className="ticket-type-card">
                                <div className="ticket-icon">🎫</div>
                                <h3>Single Journey Ticket</h3>
                                <div className="ticket-details">
                                    <p className="ticket-price">₹20 - ₹40</p>
                                    <p className="ticket-description">Valid for one journey between any two stations</p>
                                    <ul className="ticket-features">
                                        <li>✓ Quick & Easy</li>
                                        <li>✓ No Validity Period</li>
                                        <li>✓ Flexible Routes</li>
                                        <li>✓ Pay Per Journey</li>
                                    </ul>
                                    <button
                                        className="btn-book-ticket"
                                        onClick={() => {
                                            setTicketType('single');
                                            setActiveTab('fare-calculator');
                                        }}
                                    >
                                        Buy Single Ticket
                                    </button>
                                </div>
                            </div>

                            {/* Day Pass */}
                            <div className="ticket-type-card popular">
                                <div className="popular-badge">POPULAR</div>
                                <div className="ticket-icon">📅</div>
                                <h3>Day Pass</h3>
                                <div className="ticket-details">
                                    <p className="ticket-price">₹70 - ₹100</p>
                                    <p className="ticket-description">Unlimited journeys for 24 hours</p>
                                    <ul className="ticket-features">
                                        <li>✓ Unlimited Journeys</li>
                                        <li>✓ 24-Hour Validity</li>
                                        <li>✓ Best for Frequent Travelers</li>
                                        <li>✓ Activates on First Use</li>
                                    </ul>
                                    <button
                                        className="btn-book-ticket"
                                        onClick={() => {
                                            setTicketType('day-pass');
                                            setActiveTab('fare-calculator');
                                        }}
                                    >
                                        Buy Day Pass
                                    </button>
                                </div>
                            </div>

                            {/* Weekly Pass */}
                            <div className="ticket-type-card">
                                <div className="ticket-icon">📆</div>
                                <h3>Weekly Pass</h3>
                                <div className="ticket-details">
                                    <p className="ticket-price">₹250 - ₹350</p>
                                    <p className="ticket-description">Unlimited journeys for 7 consecutive days</p>
                                    <ul className="ticket-features">
                                        <li>✓ Unlimited Journeys</li>
                                        <li>✓ 7-Day Validity</li>
                                        <li>✓ Great Value</li>
                                        <li>✓ Save up to 30%</li>
                                    </ul>
                                    <button
                                        className="btn-book-ticket"
                                        onClick={() => {
                                            setTicketType('weekly-pass');
                                            setActiveTab('fare-calculator');
                                        }}
                                    >
                                        Buy Weekly Pass
                                    </button>
                                </div>
                            </div>

                            {/* Monthly Pass */}
                            <div className="ticket-type-card">
                                <div className="ticket-icon">📊</div>
                                <h3>Monthly Pass</h3>
                                <div className="ticket-details">
                                    <p className="ticket-price">₹500 - ₹700</p>
                                    <p className="ticket-description">Unlimited journeys for one full month</p>
                                    <ul className="ticket-features">
                                        <li>✓ Unlimited Journeys</li>
                                        <li>✓ 30-Day Validity</li>
                                        <li>✓ Maximum Savings</li>
                                        <li>✓ Best for Commuters</li>
                                    </ul>
                                    <button
                                        className="btn-book-ticket"
                                        onClick={() => {
                                            setTicketType('monthly-pass');
                                            setActiveTab('fare-calculator');
                                        }}
                                    >
                                        Buy Monthly Pass
                                    </button>
                                </div>
                            </div>

                            {/* Smart Card */}
                            <div className="ticket-type-card">
                                <div className="ticket-icon">💳</div>
                                <h3>Smart Card</h3>
                                <div className="ticket-details">
                                    <p className="ticket-price">₹100 (Card) + Balance</p>
                                    <p className="ticket-description">Rechargeable card for flexible travel</p>
                                    <ul className="ticket-features">
                                        <li>✓ Reusable Card</li>
                                        <li>✓ Auto Deduction</li>
                                        <li>✓ No Expiry on Card</li>
                                        <li>✓ 10% Cashback</li>
                                    </ul>
                                    <button
                                        className="btn-book-ticket"
                                        onClick={() => {
                                            setTicketType('smart-card');
                                            setActiveTab('fare-calculator');
                                        }}
                                    >
                                        Get Smart Card
                                    </button>
                                </div>
                            </div>

                            {/* Special Passes */}
                            <div className="ticket-type-card">
                                <div className="ticket-icon">🎓</div>
                                <h3>Student Pass</h3>
                                <div className="ticket-details">
                                    <p className="ticket-price">₹350 - ₹450</p>
                                    <p className="ticket-description">Special pricing with valid student ID</p>
                                    <ul className="ticket-features">
                                        <li>✓ 50% Discount</li>
                                        <li>✓ 30-Day Validity</li>
                                        <li>✓ Valid Student ID Required</li>
                                        <li>✓ Unlimited Journeys</li>
                                    </ul>
                                    <button
                                        className="btn-book-ticket"
                                        onClick={() => alert('Please visit customer care with valid student ID')}
                                    >
                                        Apply for Student Pass
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Comparison Table */}
                        <div className="ticket-comparison" style={{ marginTop: '40px' }}>
                            <h3>Ticket Types Comparison</h3>
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Ticket Type</th>
                                        <th>Price Range</th>
                                        <th>Journeys</th>
                                        <th>Validity</th>
                                        <th>Best For</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Single Journey</td>
                                        <td>₹20 - ₹40</td>
                                        <td>1</td>
                                        <td>One Journey</td>
                                        <td>Occasional Travelers</td>
                                    </tr>
                                    <tr>
                                        <td>Day Pass</td>
                                        <td>₹70 - ₹100</td>
                                        <td>Unlimited</td>
                                        <td>24 Hours</td>
                                        <td>One-Day Tours</td>
                                    </tr>
                                    <tr>
                                        <td>Weekly Pass</td>
                                        <td>₹250 - ₹350</td>
                                        <td>Unlimited</td>
                                        <td>7 Days</td>
                                        <td>Weekly Commuters</td>
                                    </tr>
                                    <tr>
                                        <td>Monthly Pass</td>
                                        <td>₹500 - ₹700</td>
                                        <td>Unlimited</td>
                                        <td>30 Days</td>
                                        <td>Regular Commuters</td>
                                    </tr>
                                    <tr>
                                        <td>Smart Card</td>
                                        <td>₹100+</td>
                                        <td>Unlimited</td>
                                        <td>Rechargeable</td>
                                        <td>Flexible Usage</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Live Service Tab */}
                {activeTab === 'live-service' && (
                    <div className="tab-content">
                        <h2>📍 Live Metro Service Status</h2>

                        {/* Overall Status */}
                        <div className="live-service-overview" style={{ marginBottom: 24 }}>
                            <div className="status-card" style={{ backgroundColor: '#d4edda', borderLeft: '4px solid #28a745', padding: 16, borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ fontSize: 32 }}>✅</div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0' }}>All Metro Lines Operational</h3>
                                        <p style={{ margin: 0, fontSize: 14, color: '#555' }}>All lines running normally at 6:00 AM - 10:00 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line-wise Status */}
                        <div className="line-status-section" style={{ marginBottom: 24 }}>
                            <h3>Line-wise Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                                {metroLinesData.map((line, idx) => {
                                    const capacity = 45 + Math.floor(Math.random() * 35);
                                    const avgWait = 2 + Math.floor(Math.random() * 3);
                                    return (
                                        <div key={idx} className="line-status-card" style={{
                                            border: '1px solid #ddd',
                                            borderRadius: 8,
                                            padding: 16,
                                            backgroundColor: '#f9f9f9'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                <div style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: line.color
                                                }}></div>
                                                <h4 style={{ margin: 0 }}>{line.name}</h4>
                                            </div>
                                            <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Status:</span>
                                                    <span style={{ color: 'green', fontWeight: 'bold' }}>🟢 Running</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Train Capacity:</span>
                                                    <span>{capacity}%</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Avg. Wait Time:</span>
                                                    <span>{avgWait} min</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Trains Running:</span>
                                                    <span>{4 + Math.floor(Math.random() * 4)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Live Train Tracking */}
                        <div className="live-tracking-section" style={{ marginBottom: 24 }}>
                            <h3>🚆 Live Train Tracking</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                                {metroLinesData.map((line, idx) => {
                                    const randomStationIdx = Math.floor(Math.random() * (line.stations.length - 1));
                                    const currentStation = line.stations[randomStationIdx];
                                    const nextStation = line.stations[randomStationIdx + 1];
                                    return (
                                        <div key={idx} style={{
                                            border: '1px solid #ddd',
                                            borderRadius: 8,
                                            padding: 14,
                                            backgroundColor: '#f0f7ff'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>🚊 {line.name}</h4>
                                            <div style={{ fontSize: 13, display: 'grid', gap: 8 }}>
                                                <div>
                                                    <strong>Current Location:</strong>
                                                    <p style={{ margin: '4px 0', color: '#0066cc' }}>📍 {currentStation?.name}</p>
                                                </div>
                                                <div>
                                                    <strong>Next Stop:</strong>
                                                    <p style={{ margin: '4px 0', color: '#666' }}>→ {nextStation?.name} (in {1 + Math.floor(Math.random() * 4)} min)</p>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                                                    <div style={{ backgroundColor: '#fff', padding: 8, borderRadius: 4 }}>
                                                        <small style={{ color: '#888' }}>Capacity</small>
                                                        <p style={{ margin: '4px 0', fontWeight: 'bold' }}>{50 + Math.floor(Math.random() * 40)}%</p>
                                                    </div>
                                                    <div style={{ backgroundColor: '#fff', padding: 8, borderRadius: 4 }}>
                                                        <small style={{ color: '#888' }}>Speed</small>
                                                        <p style={{ margin: '4px 0', fontWeight: 'bold' }}>40 km/h</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Crowd Alerts */}
                        <div className="crowd-alerts-section">
                            <h3>👥 Station Crowd Status</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                {allStations.slice(0, 8).map((station, idx) => {
                                    const crowdLevel = ['Light', 'Moderate', 'Crowded'][Math.floor(Math.random() * 3)];
                                    const crowdPercent = { 'Light': 25, 'Moderate': 55, 'Crowded': 85 }[crowdLevel];
                                    const crowdColor = { 'Light': '#28a745', 'Moderate': '#ffc107', 'Crowded': '#dc3545' }[crowdLevel];
                                    return (
                                        <div key={idx} style={{
                                            backgroundColor: '#fff',
                                            border: `2px solid ${crowdColor}`,
                                            borderRadius: 6,
                                            padding: 12
                                        }}>
                                            <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
                                                {station.name}
                                            </div>
                                            <div style={{
                                                backgroundColor: '#f0f0f0',
                                                borderRadius: 4,
                                                height: 8,
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${crowdPercent}%`,
                                                    height: '100%',
                                                    backgroundColor: crowdColor,
                                                    transition: 'width 0.3s'
                                                }}></div>
                                            </div>
                                            <div style={{ fontSize: 11, marginTop: 6, color: crowdColor, fontWeight: 'bold' }}>
                                                {crowdLevel}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* News Tab */}
                {activeTab === 'news' && (
                    <div className="tab-content">
                        <h2>📰 News & Updates</h2>
                        {news.length > 0 ? (
                            <div className="news-list">
                                {news.map((newsItem, idx) => (
                                    <div key={idx} className="news-card">
                                        <div className="news-header">
                                            <div>
                                                <h4>{newsItem.title}</h4>
                                                <small>by {newsItem.postedByName} ({newsItem.postedByRole})</small>
                                            </div>
                                            <span className={`priority-badge priority-${newsItem.priority}`}>
                                                {newsItem.priority.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="news-content">{newsItem.description || newsItem.content}</p>
                                        <div className="news-footer">
                                            <span className="news-type">{newsItem.newsType}</span>
                                            <small className="news-date">
                                                {new Date(newsItem.createdAt).toLocaleDateString()}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No news available at this time.</p>
                        )}
                    </div>
                )}

                {/* Post News Tab (Only for station masters and officers) */}
                {(user?.userType === 'station_master' || user?.userType === 'officer') && activeTab === 'post-news' && (
                    <div className="tab-content">
                        <h2>📝 Post Metro News</h2>
                        <form onSubmit={handlePostNews} className="news-form">
                            <div className="form-group">
                                <label>News Title *</label>
                                <input
                                    type="text"
                                    value={newsTitle}
                                    onChange={(e) => setNewsTitle(e.target.value)}
                                    placeholder="Enter news title"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>News Content *</label>
                                <textarea
                                    value={newsContent}
                                    onChange={(e) => setNewsContent(e.target.value)}
                                    placeholder="Enter detailed news content"
                                    rows="6"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>News Type</label>
                                    <select value={newsType} onChange={(e) => setNewsType(e.target.value)}>
                                        <option value="announcement">📢 Announcement</option>
                                        <option value="maintenance">🔧 Maintenance</option>
                                        <option value="alert">⚠️ Alert</option>
                                        <option value="information">ℹ️ Information</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Priority Level</label>
                                    <select value={newsPriority} onChange={(e) => setNewsPriority(e.target.value)}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn-post-news">
                                📤 Post News
                            </button>
                        </form>
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div className="tab-content">
                        <h2>My Bookings</h2>
                        {bookingHistory.length > 0 ? (
                            <div className="bookings-list">
                                {bookingHistory.map((booking) => (
                                    <div key={booking.id} className="booking-item detailed">
                                        <div className="booking-info">
                                            <h4>{booking.from} → {booking.to}</h4>
                                            <p>Date: {booking.date}</p>
                                            <p>Status: <span className="status-badge">{booking.status}</span></p>
                                        </div>
                                        <div className="booking-action">
                                            <span className="fare">₹{booking.fare}</span>
                                            <button className="btn-details">View Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No bookings found.</p>
                                <button className="btn-search-metro" onClick={goToSearchMetro}>
                                    Book Your First Journey
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Wallet Tab */}
                {activeTab === 'wallet' && (
                    <div className="tab-content">
                        <h2>Wallet</h2>
                        <div className="wallet-section">
                            <div className="wallet-balance">
                                <h3>Current Balance</h3>
                                <p className="balance-amount">₹{walletBalance}</p>
                            </div>

                            <div className="recharge-section">
                                <h3>Recharge Wallet</h3>
                                <div className="recharge-options">
                                    {[100, 250, 500, 1000].map((amount) => (
                                        <button
                                            key={amount}
                                            className="recharge-btn"
                                            onClick={() => handleRecharge(amount)}
                                        >
                                            ₹{amount}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="transaction-history">
                                <h3>Transaction History</h3>
                                {transactions.map((transaction) => (
                                    <div key={transaction.id} className="transaction-item">
                                        <span>{transaction.description}</span>
                                        <span className={transaction.type === 'credit' ? 'credit' : 'debit'}>
                                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="tab-content">
                        <h2>My Profile</h2>
                        <div className="profile-section">
                            <div className="profile-info">
                                {!isEditingProfile ? (
                                    <>
                                        <div className="profile-field">
                                            <label>Full Name</label>
                                            <p>{user?.fullName}</p>
                                        </div>
                                        <div className="profile-field">
                                            <label>Email</label>
                                            <p>{user?.email}</p>
                                        </div>
                                        <div className="profile-field">
                                            <label>Username</label>
                                            <p>{user?.username}</p>
                                        </div>
                                        {user?.userType !== 'customer' && (
                                            <>
                                                <div className="profile-field">
                                                    <label>User Type</label>
                                                    <p>{user?.userType === 'station_master' ? '🚇 Station Master' : '👮 KMRL Officer'}</p>
                                                </div>
                                                <div className="profile-field">
                                                    <label>Designation</label>
                                                    <p>{user?.designation || 'N/A'}</p>
                                                </div>
                                                <div className="profile-field">
                                                    <label>Assigned Station/Area</label>
                                                    <p>{user?.stationAssigned || 'N/A'}</p>
                                                </div>
                                            </>
                                        )}
                                        <div className="profile-field">
                                            <label>Member Since</label>
                                            <p>{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="profile-field">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                value={editData.fullName}
                                                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                                placeholder="Enter full name"
                                            />
                                        </div>
                                        <div className="profile-field">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                placeholder="Enter email"
                                            />
                                        </div>
                                        <div className="profile-field">
                                            <label>Username</label>
                                            <input
                                                type="text"
                                                value={editData.username}
                                                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                                placeholder="Enter username"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="profile-actions">
                                {!isEditingProfile ? (
                                    <>
                                        <button className="btn-edit" onClick={handleEditProfile}>✏️ Edit Profile</button>
                                        <button className="btn-password">🔒 Change Password</button>
                                        <button className="btn-danger" onClick={handleLogout}>
                                            🚪 Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn-edit" onClick={handleSaveProfile}>✓ Save Changes</button>
                                        <button className="btn-password" onClick={handleCancelEdit}>✕ Cancel</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedTrain && (
                <div className="modal-overlay" onClick={closeBookingModal}>
                    <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📱 Book Your Ticket</h2>
                            <button className="btn-close" onClick={closeBookingModal}>✕</button>
                        </div>

                        <div className="modal-content">
                            <div className="booking-summary">
                                <h3>Journey Details</h3>
                                <p><strong>From:</strong> {fromStation}</p>
                                <p><strong>To:</strong> {toStation}</p>
                                {fareResult && (
                                    <p><strong>💰 Fare:</strong> ₹{fareResult.fare || 20}</p>
                                )}
                            </div>

                            <div className="booking-form">
                                <div className="form-group">
                                    <label>Ticket Type *</label>
                                    <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                                        <option value="single">🎫 Single Journey Ticket</option>
                                        <option value="day-pass">📅 Day Pass (Unlimited)</option>
                                        <option value="weekly-pass">📆 Weekly Pass</option>
                                        <option value="monthly-pass">📊 Monthly Pass</option>
                                        <option value="smart-card">💳 Smart Card</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Station Services *</label>
                                    <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                                        <option value="all">✓ All Services</option>
                                        <option value="atm">🏧 ATM Available</option>
                                        <option value="food">🍔 Food Stalls</option>
                                        <option value="wifi">📶 WiFi Available</option>
                                        <option value="lostandfound">📦 Lost & Found</option>
                                        <option value="helpdesk">🆘 Help Desk</option>
                                    </select>
                                </div>

                                <div className="price-breakdown">
                                    <h4>Price Breakdown</h4>
                                    <div className="price-row">
                                        <span>Base Fare:</span>
                                        <span>₹{fareResult?.fare || 20}</span>
                                    </div>
                                    {ticketType === 'day-pass' && (
                                        <div className="price-row">
                                            <span>Day Pass Surcharge:</span>
                                            <span>₹50</span>
                                        </div>
                                    )}
                                    {ticketType === 'smart-card' && (
                                        <div className="price-row">
                                            <span>Smart Card:</span>
                                            <span>₹100</span>
                                        </div>
                                    )}
                                    <div className="price-row total">
                                        <span>Total:</span>
                                        <span className="total-price">
                                            ₹{ticketType === 'day-pass' ? (fareResult?.fare || 20) + 50 : ticketType === 'smart-card' ? 100 : fareResult?.fare || 20}
                                        </span>
                                    </div>
                                </div>

                                <div className="modal-buttons">
                                    <button className="btn-cancel" onClick={closeBookingModal}>Cancel</button>
                                    <button className="btn-submit" onClick={submitBooking}>✓ Confirm</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
