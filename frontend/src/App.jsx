import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"
import './App.css';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import FindMetro from './pages/FindMetro';
import TicketView from './pages/TicketView';
import Chatbot from './components/Chatbot/Chatbot';
import Recharge from './pages/Recharge';
import MyAccount from './pages/MyAccount';
import StationMasterDashboard from './pages/StationMasterDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import HelpAndContact from './pages/HelpAndContact';
import FAQs from './pages/FAQs';
import Footer from './components/Layout/Footer';

// Inner app that has access to router hooks

function AppInner() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        // Persist login state across page refreshes
        return !!localStorage.getItem('kmrl_token');
    });
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('kmrl_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const handleLogin = (userData) => {
        setIsLoggedIn(true);
        setUser(userData);
        // Redirect to role-specific dashboard
        if (userData.userType === 'station_master') {
            navigate('/station-master');
        } else if (userData.userType === 'officer') {
            navigate('/officer-dashboard');
        } else {
            navigate('/');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('kmrl_token');
        localStorage.removeItem('kmrl_user');
        navigate('/');
    };

    // onNavigate maps page keys to URL paths (keeps all existing components working unchanged)
    const onNavigate = (page) => {
        const routes = {
            home: '/',
            signin: '/signin',
            signup: '/signup',
            dashboard: '/dashboard',
            findmetro: '/findmetro',
            ticket: '/ticket',
            recharge: '/recharge',
            myaccount: '/myaccount',
            help: '/help',
            faq: '/faq',
        };
        navigate(routes[page] || '/');
    };

    // Auth pages and staff dashboards don't show the public header
    const location = useLocation();
    const noHeaderPaths = ['/signin', '/signup', '/station-master', '/officer-dashboard'];
    const isAuthPage = noHeaderPaths.includes(location.pathname);

    // Hide Chatbot on login and signup pages
    const noChatbotPaths = ['/signin', '/signup'];
    const hideChatbot = noChatbotPaths.includes(location.pathname);

    return (
        <div className="App">
            {!isAuthPage && (
                <Header
                    isAuthenticated={isLoggedIn}
                    user={user}
                    onLogout={handleLogout}
                    onNavigate={onNavigate}
                    currentPage={location.pathname.replace('/', '') || 'home'}
                />
            )}
            <main className={!isAuthPage ? 'app-main' : ''}>
                <Routes>
                    <Route path="/" element={<HomePage onNavigate={onNavigate} />} />
                    <Route path="/signup" element={<SignUp onNavigate={onNavigate} />} />
                    <Route path="/signin" element={<SignIn onNavigate={onNavigate} onLogin={handleLogin} />} />
                    <Route path="/dashboard" element={<Dashboard user={user} onLogout={handleLogout} onNavigate={onNavigate} />} />
                    <Route path="/findmetro" element={<FindMetro user={user} onLogout={handleLogout} onNavigate={onNavigate} />} />
                    <Route path="/ticket" element={<TicketView onNavigate={onNavigate} />} />
                    <Route path="/recharge" element={<Recharge onNavigate={onNavigate} />} />
                    <Route path="/myaccount" element={<MyAccount user={user} onLogout={handleLogout} onNavigate={onNavigate} />} />
                    <Route path="/station-master" element={<StationMasterDashboard user={user} onLogout={handleLogout} onNavigate={onNavigate} />} />
                    <Route path="/officer-dashboard" element={<OfficerDashboard user={user} onLogout={handleLogout} onNavigate={onNavigate} />} />
                    <Route path="/help" element={<HelpAndContact onNavigate={onNavigate} />} />
                    <Route path="/faq" element={<FAQs onNavigate={onNavigate} />} />
                    {/* Catch-all: redirect unknown URLs to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            {!isAuthPage && <Footer />}
            {!hideChatbot && <Chatbot />}
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppInner />
        </BrowserRouter>
    );
}

export default App;