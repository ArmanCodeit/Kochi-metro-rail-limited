import React, { useState, useEffect } from 'react';
import '../styles/MyAccount.css';
import {
    Ticket01Icon, Calendar01Icon, ArrowRight01Icon, Train01Icon,
    Alert01Icon, CheckmarkCircle01Icon, Clock01Icon, DocumentAttachmentIcon
} from 'hugeicons-react';

const MyAccount = ({ user, onLogout, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [ticketTab, setTicketTab] = useState('active');
    const [transactionTab, setTransactionTab] = useState('all');

    const [transactions, setTransactions] = useState([]);

    // Complaints State
    const [complaints, setComplaints] = useState([]);
    const [complaintForm, setComplaintForm] = useState({ subject: '', description: '' });
    const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
    const [viewingComplaint, setViewingComplaint] = useState(null);
    const [complaintSearch, setComplaintSearch] = useState('');

    // Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        fathersName: '',
        dateOfBirth: '',
        gender: 'Male',
        maritalStatus: 'Single',
        contactNumber: '',
        address: '',
        city: '',
        state: 'Kerala',
        pinCode: ''
    });

    const [saveMessage, setSaveMessage] = useState('');

    const indianStates = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
        "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
        "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
        "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ];

    useEffect(() => {
        const fetchBookings = async () => {
            const token = localStorage.getItem('kmrl_token');
            let apiData = [];
            try {
                if (token) {
                    const resp = await fetch('/api/metro/my-bookings', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resp.ok) {
                        apiData = await resp.json();
                    }
                }
            } catch (err) {
                console.warn('API error, relying solely on local storage', err);
            }

            // Local storage demo mode fallback
            const storedTxns = JSON.parse(localStorage.getItem('kmrl_all_transactions') || '[]');
            const userTxns = storedTxns.filter(t => user && (t.email === user.email || t.passengerName === user.fullName));

            // Map API data
            const mappedApi = apiData.map(t => {
                let d = new Date(t.createdAt);
                if (isNaN(d.getTime())) d = new Date(0);
                return {
                    from: t.fromStation || t.from || 'Network',
                    to: t.toStation || t.to || 'Network',
                    id: t.bookingId || 'TXN',
                    dateTime: d.toLocaleString(),
                    method: t.method || 'Bill Desk / UPI',
                    status: t.status || 'Success',
                    amount: `₹ ${t.fare || 0}`,
                    rawDate: d
                };
            });

            // Map Local data
            const mappedLocal = userTxns.map(t => {
                let parsedDate = t.createdAt ? new Date(t.createdAt) : null;

                if (!parsedDate || isNaN(parsedDate.getTime())) {
                    if (t.date) {
                        let tempDate = new Date(t.date);
                        if (!isNaN(tempDate.getTime())) {
                            parsedDate = tempDate;
                        } else {
                            try {
                                if (t.date.includes('/')) {
                                    const parts = t.date.split(/[,\s]+/);
                                    const dParts = parts[0].split(/[/-]/);
                                    if (dParts.length === 3) {
                                        const timeStr = parts.length > 1 ? parts.slice(1).join(' ') : '12:00:00 PM';
                                        tempDate = new Date(`${dParts[1]}/${dParts[0]}/${dParts[2]} ${timeStr}`);
                                        if (!isNaN(tempDate.getTime())) {
                                            parsedDate = tempDate;
                                        }
                                    }
                                }
                            } catch (e) {
                                // Fallback below
                            }
                        }
                    }
                }

                if (!parsedDate || isNaN(parsedDate.getTime())) {
                    parsedDate = new Date(0);
                }

                return {
                    from: t.fromStation || t.from || 'Network',
                    to: t.toStation || t.to || 'Network',
                    id: t.bookingId || 'TXN',
                    dateTime: t.date || parsedDate.toLocaleString(),
                    method: t.method || 'Bill Desk / UPI',
                    status: t.status || 'Success',
                    amount: `₹ ${t.fare || 0}`,
                    rawDate: parsedDate
                };
            });

            // Combine filtering duplicates by bookingId
            const uniqueMap = new Map();
            mappedLocal.forEach(t => {
                if (t.id && t.id !== 'TXN' && !uniqueMap.has(t.id)) {
                    uniqueMap.set(t.id, t);
                } else if (!t.id || t.id === 'TXN') {
                    // if it's a generic TXN from local, fallback to a unique key based on rawDate to prevent grouping all 'TXN's
                    uniqueMap.set('TXN-' + Math.random(), t);
                }
            });
            mappedApi.forEach(t => {
                if (t.id && t.id !== 'TXN' && !uniqueMap.has(t.id)) {
                    uniqueMap.set(t.id, t);
                } else if (!t.id || t.id === 'TXN') {
                    uniqueMap.set('TXN-' + Math.random(), t);
                }
            });
            const combined = Array.from(uniqueMap.values());

            combined.sort((a, b) => b.rawDate - a.rawDate);
            setTransactions(combined);

        };
        fetchBookings();

        const fetchProfile = async () => {
            const token = localStorage.getItem('kmrl_token');
            if (!token) return;
            try {
                const resp = await fetch('/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resp.ok) {
                    const data = await resp.json();
                    setProfileData({
                        firstName: data.firstName || data.fullName?.split(' ')[0] || '',
                        lastName: data.lastName || data.fullName?.split(' ').slice(1).join(' ') || '',
                        fathersName: data.fathersName || '',
                        dateOfBirth: data.dateOfBirth || '',
                        gender: data.gender || 'Male',
                        maritalStatus: data.maritalStatus || 'Single',
                        contactNumber: data.contactNumber || '',
                        address: data.address || '',
                        city: data.city || '',
                        state: data.state || 'Kerala',
                        pinCode: data.pinCode || ''
                    });
                }
            } catch (err) {
                console.warn('Error fetching profile', err);
            }
        };
        fetchProfile();

        // Fetch Complaints
        const savedComplaints = JSON.parse(localStorage.getItem('kmrl_complaints') || '[]');
        if (user?.email) {
            setComplaints(savedComplaints.filter(c => c.userEmail === user.email));
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        const token = localStorage.getItem('kmrl_token');
        if (!token) return;

        try {
            const resp = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            if (resp.ok) {
                setIsEditing(false);
                setSaveMessage('details saved');
                setTimeout(() => {
                    setSaveMessage('');
                    window.location.reload(); // Reload to refresh user info in headers
                }, 1000);
            } else {
                alert('Failed to save profile');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to save profile');
        }
    };

    const filterTransactions = () => {
        if (transactionTab === 'all') return transactions;
        return transactions.filter(t => t.status.toLowerCase() === transactionTab.replace('_', ' '));
    };

    const handleComplaintSubmit = (e) => {
        e.preventDefault();
        const typeStr = activeTab === 'vigilance' ? 'Vigilance' : 'Grievance';
        const newComplaint = {
            id: 'CMP-' + Math.floor(1000 + Math.random() * 9000),
            type: typeStr,
            subject: complaintForm.subject,
            description: complaintForm.description,
            status: 'Pending',
            date: new Date().toLocaleString(),
            userEmail: user?.email || 'unknown',
            userName: user?.fullName || 'unknown'
        };

        const allComplaints = JSON.parse(localStorage.getItem('kmrl_complaints') || '[]');
        localStorage.setItem('kmrl_complaints', JSON.stringify([newComplaint, ...allComplaints]));

        setComplaints([newComplaint, ...complaints]);
        setComplaintForm({ subject: '', description: '' });

        setSaveMessage(`${typeStr} Complaint Submitted Successfully!`);
        setTimeout(() => setSaveMessage(''), 3000);
    };

    return (
        <div className="account-container" style={{ position: 'relative' }}>
            {saveMessage && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    zIndex: 1000,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {saveMessage}
                </div>
            )}
            <aside className="account-sidebar">
                <div className="sidebar-header">
                    <h2>Account Settings</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                            Profile
                        </li>
                        <li className={activeTab === 'medical' ? 'active' : ''} onClick={() => setActiveTab('medical')}>
                            Medical Information
                        </li>
                        <li className={activeTab === 'tickets' ? 'active' : ''} onClick={() => setActiveTab('tickets')}>
                            My Tickets
                        </li>
                        <li className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>
                            My Transactions
                        </li>
                        <li className={activeTab === 'lostitem' ? 'active' : ''} onClick={() => setActiveTab('lostitem')}>
                            My Lost Item
                        </li>
                        <li className={activeTab === 'vigilance' ? 'active' : ''} onClick={() => setActiveTab('vigilance')}>
                            Vigilance Complaint
                        </li>
                        <li className={activeTab === 'grievance' ? 'active' : ''} onClick={() => setActiveTab('grievance')}>
                            Grievance Complaint
                        </li>
                    </ul>
                    <div className="logout-section" onClick={onLogout}>
                        <span className="logout-text">Logout</span>
                    </div>
                </nav>
            </aside>

            <main className="account-main">
                {activeTab === 'profile' && (
                    <div className="profile-section">
                        <div className="section-header">
                            <div>
                                <h1>Profile</h1>
                                <p>Provide your personal details for a personalized and better user experience.</p>
                            </div>
                            <div className="header-actions">
                                <span className="go-green-badge">
                                    GO-GREEN POINTS: 0
                                </span>
                                <button className="edit-btn" onClick={handleSaveProfile}>
                                    {isEditing ? 'Save Details' : 'Edit Details'}
                                </button>
                            </div>
                        </div>

                        <div className="profile-body">
                            <div className="avatar-section">
                                <div className="avatar-circle">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <button className="upload-pic-btn">Upload Picture</button>
                            </div>

                            <div className="form-section">
                                <div className="form-group-title">
                                    <span>Personal Details</span>
                                    <div className="line"></div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>First Name*</label>
                                        <input type="text" name="firstName" value={profileData.firstName} onChange={handleProfileChange} disabled={!isEditing} />
                                    </div>
                                    <div className="input-group">
                                        <label>Last Name*</label>
                                        <input type="text" name="lastName" value={profileData.lastName} onChange={handleProfileChange} disabled={!isEditing} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Father's Name*</label>
                                        <input type="text" name="fathersName" placeholder="Father's Name" value={profileData.fathersName} onChange={handleProfileChange} disabled={!isEditing} />
                                    </div>
                                    <div className="input-group">
                                        <label>Date of Birth*</label>
                                        <input type="date" name="dateOfBirth" placeholder="mm/dd/yyyy" value={profileData.dateOfBirth} onChange={handleProfileChange} disabled={!isEditing} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Gender*</label>
                                        <div className="toggle-group">
                                            <button className={`toggle-btn ${profileData.gender === 'Male' ? 'active' : ''}`} onClick={() => isEditing && setProfileData({ ...profileData, gender: 'Male' })}>Male</button>
                                            <button className={`toggle-btn ${profileData.gender === 'Female' ? 'active' : ''}`} onClick={() => isEditing && setProfileData({ ...profileData, gender: 'Female' })}>Female</button>
                                            <button className={`toggle-btn ${profileData.gender === 'Other' ? 'active' : ''}`} onClick={() => isEditing && setProfileData({ ...profileData, gender: 'Other' })}>Other</button>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Marital Status*</label>
                                        <div className="toggle-group">
                                            <button className={`toggle-btn ${profileData.maritalStatus === 'Single' ? 'active' : ''}`} onClick={() => isEditing && setProfileData({ ...profileData, maritalStatus: 'Single' })}>Single</button>
                                            <button className={`toggle-btn ${profileData.maritalStatus === 'Married' ? 'active' : ''}`} onClick={() => isEditing && setProfileData({ ...profileData, maritalStatus: 'Married' })}>Married</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group-title mt-4">
                                    <span>Contact Details</span>
                                    <div className="line"></div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>Contact Number*</label>
                                        <div className="phone-input">
                                            <span className="prefix">+91</span>
                                            <input type="text" name="contactNumber" value={profileData.contactNumber} onChange={handleProfileChange} disabled={!isEditing} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>E-Mail Address*</label>
                                        <input type="email" defaultValue={user?.email || ""} disabled />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group full-width">
                                        <label>Address*</label>
                                        <textarea name="address" placeholder="Enter Address" value={profileData.address} onChange={handleProfileChange} disabled={!isEditing}></textarea>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>City*</label>
                                        <input type="text" name="city" placeholder="City" value={profileData.city} onChange={handleProfileChange} disabled={!isEditing} />
                                    </div>
                                    <div className="input-group">
                                        <label>State*</label>
                                        <select name="state" value={profileData.state} onChange={handleProfileChange} disabled={!isEditing}>
                                            <option value="">Select State</option>
                                            {indianStates.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>PIN Code*</label>
                                        <input type="text" name="pinCode" placeholder="PIN Code" value={profileData.pinCode} onChange={handleProfileChange} disabled={!isEditing} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tickets' && (() => {
                    const now = new Date();
                    const activeTxns = transactions.filter(t => {
                        const rd = new Date(t.rawDate);
                        if (isNaN(rd.getTime())) return false; // fallback invalid dates to completed
                        return (now.getTime() - rd.getTime()) <= 2 * 60 * 60 * 1000;
                    });
                    const completedTxns = transactions.filter(t => {
                        const rd = new Date(t.rawDate);
                        if (isNaN(rd.getTime())) return true;
                        return (now.getTime() - rd.getTime()) > 2 * 60 * 60 * 1000;
                    });

                    const activeCount = activeTxns.length;
                    const completedCount = completedTxns.length;
                    const expiredCount = 0;

                    const displayTxns = ticketTab === 'active' ? activeTxns : completedTxns;

                    return (
                        <div className="new-complaint-section">
                            {/* Header */}
                            <div className="cp-header">
                                <div className="cp-header-left">
                                    <h1 className="cp-title">MY TICKETS PORTAL</h1>
                                    <p className="cp-subtitle">Manage and View Your Journey History and Active Passes</p>
                                </div>
                            </div>

                            {/* Stats Widgets */}
                            <div className="cp-stats-grid">
                                <div className="cp-stat-card border-blue">
                                    <div className="cp-stat-content">
                                        <div className="cp-stat-number">{activeCount}</div>
                                        <div className="cp-stat-label">ACTIVE TICKETS</div>
                                    </div>
                                    <svg className="cp-stat-sparkline stroke-blue" viewBox="0 0 100 30" fill="none" strokeWidth="2"><path d="M0,20 Q10,5 20,20 T40,20 T60,10 T80,20 T100,5" /></svg>
                                </div>
                                <div className="cp-stat-card border-green">
                                    <div className="cp-stat-content">
                                        <div className="cp-stat-number">{completedCount}</div>
                                        <div className="cp-stat-label">COMPLETED JOURNEYS</div>
                                    </div>
                                    <svg className="cp-stat-sparkline stroke-green" viewBox="0 0 100 30" fill="none" strokeWidth="2"><path d="M0,15 Q15,5 25,15 T50,25 T75,5 T100,20" /></svg>
                                </div>
                                <div className="cp-stat-card border-gray">
                                    <div className="cp-stat-content">
                                        <div className="cp-stat-number">{expiredCount}</div>
                                        <div className="cp-stat-label">EXPIRED / CANCELLED</div>
                                    </div>
                                    <svg className="cp-stat-sparkline stroke-gray" viewBox="0 0 100 30" fill="none" strokeWidth="2"><path d="M0,25 Q15,5 30,25 T60,5 T80,20 T100,10" /></svg>
                                </div>
                            </div>

                            {/* List Area */}
                            <div className="cp-list-header">
                                <h2 className="cp-list-title">All Tickets</h2>
                                <div className="cp-list-actions">
                                    <div className="tabs" style={{ margin: 0 }}>
                                        <button className={`tab ${ticketTab === 'active' ? 'active' : ''}`} onClick={() => setTicketTab('active')}>Active</button>
                                        <button className={`tab ${ticketTab === 'completed' ? 'active' : ''}`} onClick={() => setTicketTab('completed')}>Completed</button>
                                    </div>
                                </div>
                            </div>

                            {displayTxns.length === 0 ? (
                                <div className="cp-empty-state">
                                    <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M60 140 C 60 160, 140 160, 140 140 C 140 120, 160 80, 120 70 C 80 60, 60 100, 60 140 Z" fill="#e2e8f0" />
                                        <path d="M50 160 Q 60 180 100 180 T 150 160 L 155 110 Q 150 90 100 90 T 45 110 Z" fill="#0da1a6" />
                                        <path d="M85 140 Q 100 150 115 140" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                        <circle cx="90" cy="130" r="2" fill="#fff" />
                                        <circle cx="110" cy="130" r="2" fill="#fff" />
                                    </svg>
                                    <h3>{ticketTab === 'active' ? 'No Active Tickets found!' : 'No Completed Journeys found!'}</h3>
                                </div>
                            ) : (
                                <div className="cp-cards-grid" style={{ paddingBottom: '3rem' }}>
                                    {displayTxns.map((txn, idx) => (
                                        <div className="cp-item-card" key={idx}>
                                            <div className="cp-item-top">
                                                <span className="cp-item-id">Booking ID: {txn.id}</span>
                                                <span className="cp-item-date">{txn.dateTime}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div className="cp-item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {txn.from} <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>→</span> {txn.to}
                                                    </div>
                                                    <div className="cp-item-desc" style={{ marginTop: '0.4rem', display: 'flex', gap: '1rem' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ticket01Icon size={14} /> Standard Journey</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Train01Icon size={14} /> {txn.amount}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                                                    <span className={`cp-badge ${ticketTab === 'active' ? 'active' : 'resolved'}`}>
                                                        {ticketTab === 'active' ? 'Valid (Active)' : 'Completed'}
                                                    </span>
                                                    {ticketTab === 'active' && (
                                                        <button className="cp-register-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => onNavigate('ticket')}>
                                                            View QR Pass
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {activeTab === 'transactions' && (
                    <div className="transactions-section">
                        <div className="section-header">
                            <div>
                                <h1>My Transactions</h1>
                                <p>Review all your payment history and wallet recharges.</p>
                            </div>
                        </div>
                        <div className="transaction-filters">
                            {['All', 'Success', 'Pending', 'Failed'].map(status => {
                                const val = status.toLowerCase().replace(' ', '_');
                                return (
                                    <button
                                        key={val}
                                        className={`filter-btn ${transactionTab === val ? 'active' : ''}`}
                                        onClick={() => setTransactionTab(val)}
                                    >
                                        {status}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="transaction-list">
                            {filterTransactions().map((txn, idx) => (
                                <div className="modern-card transaction-row" key={idx}>
                                    <div className="txn-info-left">
                                        <div className="icon-circle"><Train01Icon size={20} color="#0284c7" /></div>
                                        <div className="txn-route-info">
                                            <div className="route-title">{txn.from} <span style={{ color: '#94a3b8', margin: '0 4px', fontWeight: 'bold' }}>→</span> {txn.to}</div>
                                            <div className="txn-subtext">{txn.dateTime} &bull; {txn.method} &bull; ID: {txn.id}</div>
                                        </div>
                                    </div>
                                    <div className="txn-info-right">
                                        <div className={`modern-status ${txn.status.toLowerCase()}`}>
                                            {txn.status === 'Success' ? <CheckmarkCircle01Icon size={14} /> : <Clock01Icon size={14} />}
                                            {txn.status}
                                        </div>
                                        <div className="txn-price">{txn.amount}</div>
                                    </div>
                                </div>
                            ))}
                            {filterTransactions().length === 0 && (
                                <div className="empty-state">
                                    <Train01Icon size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
                                    <p>No transactions found for this filter.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {(activeTab === 'vigilance' || activeTab === 'grievance') && (() => {
                    const isVig = activeTab === 'vigilance';
                    const titleText = isVig ? 'VIGILANCE COMPLAINT PORTAL' : 'GRIEVANCE COMPLAINT PORTAL';
                    const subtitleText = isVig ? 'Ensuring Integrity and Transparency in Operations' : 'Resolving Issues and Improving Service Quality';
                    const typeIdPrefix = isVig ? 'VCP' : 'GCP';

                    const filteredComplaints = complaints.filter(c => c.type.toLowerCase() === activeTab && c.subject.toLowerCase().includes(complaintSearch.toLowerCase()));

                    const pendingCount = complaints.filter(c => c.type.toLowerCase() === activeTab && c.status === 'Pending').length;
                    const invCount = complaints.filter(c => c.type.toLowerCase() === activeTab && c.status === 'In Progress').length;
                    const resCount = complaints.filter(c => c.type.toLowerCase() === activeTab && c.status === 'Resolved').length;

                    return (
                        <div className="new-complaint-section">
                            {/* Header */}
                            <div className="cp-header">
                                <div className="cp-header-left">
                                    <h1 className="cp-title">{titleText}</h1>
                                    <p className="cp-subtitle">{subtitleText}</p>
                                </div>
                                <button className="cp-register-btn" onClick={() => { setComplaintForm({ subject: '', description: '' }); setIsComplaintModalOpen(true); setViewingComplaint(null); }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                    REGISTER NEW COMPLAINT
                                </button>
                            </div>

                            {/* Stats Widgets */}
                            <div className="cp-stats-grid">
                                <div className="cp-stat-card border-red">
                                    <div className="cp-stat-content">
                                        <div className="cp-stat-number">{pendingCount}</div>
                                        <div className="cp-stat-label">PENDING REVIEW</div>
                                    </div>
                                    <svg className="cp-stat-sparkline stroke-red" viewBox="0 0 100 30" fill="none" strokeWidth="2"><path d="M0,20 Q10,5 20,20 T40,20 T60,10 T80,20 T100,5" /></svg>
                                </div>
                                <div className="cp-stat-card border-yellow">
                                    <div className="cp-stat-content">
                                        <div className="cp-stat-number">{invCount}</div>
                                        <div className="cp-stat-label">UNDER INVESTIGATION</div>
                                    </div>
                                    <svg className="cp-stat-sparkline stroke-yellow" viewBox="0 0 100 30" fill="none" strokeWidth="2"><path d="M0,15 Q15,5 25,15 T50,25 T75,5 T100,20" /></svg>
                                </div>
                                <div className="cp-stat-card border-green">
                                    <div className="cp-stat-content">
                                        <div className="cp-stat-number">{resCount}</div>
                                        <div className="cp-stat-label">RESOLVED</div>
                                    </div>
                                    <svg className="cp-stat-sparkline stroke-green" viewBox="0 0 100 30" fill="none" strokeWidth="2"><path d="M0,25 Q15,5 30,25 T60,5 T80,20 T100,10" /></svg>
                                </div>
                            </div>

                            {/* List Area */}
                            <div className="cp-list-header">
                                <h2 className="cp-list-title">All Complaints</h2>
                                <div className="cp-list-actions">
                                    <div className="cp-search-box">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0da1a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                        <input type="text" placeholder="Search" value={complaintSearch} onChange={e => setComplaintSearch(e.target.value)} />
                                    </div>
                                    <div className="cp-date-box">
                                        <Calendar01Icon size={16} color="#0da1a6" />
                                        <span>YYYY-MM-DD ~ YYYY-MM</span>
                                    </div>
                                </div>
                            </div>

                            {filteredComplaints.length === 0 ? (
                                <div className="cp-empty-state">
                                    <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M60 140 C 60 160, 140 160, 140 140 C 140 120, 160 80, 120 70 C 80 60, 60 100, 60 140 Z" fill="#e2e8f0" />
                                        <path d="M50 160 Q 60 180 100 180 T 150 160 L 155 110 Q 150 90 100 90 T 45 110 Z" fill="#0da1a6" />
                                        <path d="M85 140 Q 100 150 115 140" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                                        <circle cx="90" cy="130" r="2" fill="#fff" />
                                        <circle cx="110" cy="130" r="2" fill="#fff" />
                                    </svg>
                                    <h3>There's Nothing to show here!</h3>
                                </div>
                            ) : (
                                <div className="cp-cards-grid">
                                    {filteredComplaints.map(c => (
                                        <div className="cp-item-card" key={c.id} onClick={() => { setViewingComplaint(c); setIsComplaintModalOpen(true); }}>
                                            <div className="cp-item-top">
                                                <span className="cp-item-id">MMRC/{typeIdPrefix}/{c.id.replace('CMP-', '')}</span>
                                                <span className="cp-item-date">{c.date.split(',')[0]}</span>
                                            </div>
                                            <div className="cp-item-title">{c.subject}</div>
                                            <div className="cp-item-desc">{c.description}</div>
                                            <div className="cp-item-bottom">
                                                <div className="cp-item-icons">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0da1a6" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path></svg> 0 &nbsp;&nbsp;
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0da1a6" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"></path></svg> 0
                                                </div>
                                                <span className={`cp-item-status ${c.status === 'Resolved' ? 'status-green' : c.status === 'In Progress' ? 'status-yellow' : 'status-red'}`}>
                                                    {c.status === 'Pending' ? 'PENDING REVIEW' : c.status === 'In Progress' ? 'UNDER INVESTIGATION' : 'RESOLVED'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Modals */}
                            {isComplaintModalOpen && (
                                <div className="cp-modal-overlay">
                                    <div className="cp-modal">
                                        <div className="cp-modal-header">
                                            <h2>{viewingComplaint ? `MMRC/${typeIdPrefix}/${viewingComplaint.id.replace('CMP-', '')}` : 'REGISTER NEW COMPLAINT'}</h2>
                                            <button className="cp-modal-close" onClick={() => { setIsComplaintModalOpen(false); setViewingComplaint(null); }}>&times;</button>
                                        </div>
                                        {viewingComplaint ? (
                                            <div className="cp-modal-body">
                                                <div className="cp-modal-sidebar">
                                                    <div className="cp-side-title">General Information</div>
                                                    <div className="cp-side-item">
                                                        <label>Name</label>
                                                        <div>{viewingComplaint.userName}</div>
                                                    </div>
                                                    <div className="cp-side-item">
                                                        <label>Complaint Date & Time</label>
                                                        <div>{viewingComplaint.date}</div>
                                                    </div>
                                                    <div className="cp-side-item">
                                                        <label>Complaint Status</label>
                                                        <div>
                                                            <span className={`cp-modal-status ${viewingComplaint.status === 'Resolved' ? 'bg-green' : viewingComplaint.status === 'In Progress' ? 'bg-yellow' : 'bg-red'}`}>
                                                                {viewingComplaint.status === 'Pending' ? 'Pending Review' : viewingComplaint.status === 'In Progress' ? 'Under Investigation' : 'Resolved'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="cp-side-item">
                                                        <label>E-Mail Address</label>
                                                        <div>{viewingComplaint.userEmail}</div>
                                                    </div>
                                                    <div className="cp-side-item">
                                                        <label>Phone</label>
                                                        <div>{profileData.contactNumber || '+91 - Not provided'}</div>
                                                    </div>
                                                </div>
                                                <div className="cp-modal-content">
                                                    <div className="cp-content-title">Complaint Details</div>
                                                    <div className="cp-detail-box">
                                                        <div className="cp-author-row">
                                                            <div className="cp-avatar">{viewingComplaint.userName.substring(0, 2).toUpperCase()}</div>
                                                            <div className="cp-author-info">
                                                                <small>Complaint From</small>
                                                                <div>{viewingComplaint.userName}</div>
                                                            </div>
                                                        </div>
                                                        <div className="cp-detail-subject">{viewingComplaint.subject}</div>
                                                        <div className="cp-detail-desc">{viewingComplaint.description}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <form className="cp-modal-form" onSubmit={(e) => { handleComplaintSubmit(e); setIsComplaintModalOpen(false); }}>
                                                <div className="input-group">
                                                    <label>Subject</label>
                                                    <input type="text" value={complaintForm.subject} onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })} required />
                                                </div>
                                                <div className="input-group" style={{ marginTop: '1rem' }}>
                                                    <label>Description</label>
                                                    <textarea rows="6" value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} required></textarea>
                                                </div>
                                                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                                    <button type="submit" className="cp-register-btn" style={{ width: 'auto', display: 'inline-flex' }}>Submit Complaint</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {['medical', 'lostitem'].includes(activeTab) && (
                    <div className="placeholder-section">
                        <h1>Coming Soon</h1>
                        <p>This module is currently under development.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyAccount;
