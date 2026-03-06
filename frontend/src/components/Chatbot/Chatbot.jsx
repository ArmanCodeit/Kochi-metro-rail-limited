import React, { useState, useRef, useEffect } from 'react';
import {
    Message02Icon, Cancel01Icon, ArrowRight01Icon, Ticket01Icon,
    Location01Icon, Navigation02Icon, SmartPhone01Icon
} from 'hugeicons-react';
import '../../styles/Chatbot.css';
import metroLinesData from '../../data/metroLines';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: 'नमस्ते! (Hello!) 👋 मैं KMRL असिस्टेंट हूँ। आप मुझसे मेट्रो खोजने, किराया देखने, या कोई भी सहायता माँग सकते हैं। (I am KMRL Assistant. You can ask me to search metro routes, check fares, or any assistance.)',
            language: 'both'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [language, setLanguage] = useState('both'); // both, hindi, english
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Translations
    const translations = {
        hindi: {
            searching: 'खोज रहा हूँ...',
            notFound: 'मुझे खेद है, कोई परिणाम नहीं मिला।',
            routeFound: 'रूट मिल गया!',
            from: 'से',
            to: 'को',
            fare: 'किराया',
            stations: 'स्टेशन',
            time: 'समय',
            book: 'बुक करें',
            helpText: 'आप यह कह सकते हैं:\n• "Aluva से M.G. Road तक की दूरी बताओ"\n• "स्मार्ट कार्ड की कीमत क्या है?"\n• "मेट्रो किस समय खुलता है?"',
            openingTime: 'मेट्रो 6:00 AM से रात 10:00 PM तक खुला रहता है।',
            ticketPrice: 'किराया ₹20 से ₹40 तक है।',
            dayPass: 'दिन पास: ₹70-₹100',
            monthlyPass: 'मासिक पास: ₹500-₹700',
            smartCard: 'स्मार्ट कार्ड: ₹100 + बैलेंस'
        },
        english: {
            searching: 'Searching...',
            notFound: 'I am sorry, no results found.',
            routeFound: 'Route found!',
            from: 'From',
            to: 'To',
            fare: 'Fare',
            stations: 'stations',
            time: 'Time',
            book: 'Book',
            helpText: 'You can say:\n• "Distance from Aluva to M.G. Road"\n• "What is the price of smart card?"\n• "What is metro opening time?"',
            openingTime: 'Metro is open from 6:00 AM to 10:00 PM.',
            ticketPrice: 'Fare ranges from ₹20 to ₹40.',
            dayPass: 'Day Pass: ₹70-₹100',
            monthlyPass: 'Monthly Pass: ₹500-₹700',
            smartCard: 'Smart Card: ₹100 + Balance'
        }
    };

    const getText = (key) => {
        if (language === 'hindi') return translations.hindi[key];
        if (language === 'english') return translations.english[key];
        return translations.english[key]; // default to english
    };

    const processUserInput = async (input) => {
        setLoading(true);
        const lowerInput = input.toLowerCase();
        const hindiInput = input;

        let response = null;

        // If user asks to email a ticket: "email ticket <id> to <email>"
        if (lowerInput.includes('email ticket') || lowerInput.includes('send ticket')) {
            const m = input.match(/([a-f0-9\-]{8,})/i);
            const emailMatch = input.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
            if (!m || !emailMatch) {
                setLoading(false);
                return { type: 'info', text: language === 'hindi' ? 'कृपया सही Booking ID और ईमेल पता दें।' : 'Please provide Booking ID and an email address.', language };
            }
            const bookingId = m[1];
            const email = emailMatch[1];
            try {
                // Mock email send
                setLoading(false);
                return { type: 'info', text: language === 'hindi' ? 'ईमेल कतार में है (mock)।' : 'Email queued (mock).', language };
            } catch (e) {
                setLoading(false);
                return { type: 'error', text: 'Failed to send email', language };
            }
        }

        // Booking intent: "book ticket from X to Y" or "Book ticket"
        if (lowerInput.includes('book ticket') || lowerInput.includes('book') || hindiInput.includes('बुक')) {
            // Try to extract from/to
            const parts = input.split(/from|से|to|को|into/i).map(p => p.trim()).filter(Boolean);
            let from = null;
            let to = null;
            if (parts.length >= 2) {
                from = parts[0];
                to = parts[parts.length - 1];
            }

            // If we have station names, try best matches using metroLinesData
            const allStations = metroLinesData.flatMap(l => l.stations || []);
            const matchStation = (q) => {
                if (!q) return null;
                const qq = q.toLowerCase().trim();
                let exact = allStations.find(s => s.name.toLowerCase() === qq || (s.code || '').toLowerCase() === qq);
                if (exact) return exact;
                let starts = allStations.find(s => s.name.toLowerCase().startsWith(qq));
                if (starts) return starts;
                let incl = allStations.find(s => s.name.toLowerCase().includes(qq));
                if (incl) return incl;
                return null;
            };
            const stFrom = matchStation(from || '') || null;
            const stTo = matchStation(to || '') || null;
            if (!stFrom || !stTo) {
                // Ask for clarification
                setLoading(false);
                return { type: 'info', text: language === 'hindi' ? 'कृपया स्रोत और गंतव्य स्टेशन बताइए (उदा: Aluva से M.G. Road).' : 'Please provide from and to stations (eg: Book ticket from Aluva to M.G. Road).', language };
            }

            try {
                let passengerEmail = null;
                try {
                    const u = localStorage.getItem('kmrl_user');
                    if (u) passengerEmail = JSON.parse(u).email;
                } catch (e) { }
                // Simulate booking locally
                const data = { bookingId: 'MOCK-' + Date.now(), ticketUrl: '/mock-api/tickets/' + Date.now() + '.pdf' };
                setLoading(false);
                if (passengerEmail) {
                    // simulate email queued
                }
                return {
                    type: 'info',
                    text: language === 'hindi' ? `बुकिंग सफल! Booking ID: ${data.bookingId}. टिकट डाउनलोड: ${data.ticketUrl}` : `Booking successful! Booking ID: ${data.bookingId}. Download ticket: ${data.ticketUrl}`,
                    language
                };
            } catch (err) {
                setLoading(false);
                return { type: 'error', text: 'Booking failed. Please try again later.', language };
            }
        }

        // Route search / Distance / ETA
        if (lowerInput.includes('distance') || lowerInput.includes('route') ||
            hindiInput.includes('दूरी') || hindiInput.includes('रूट') ||
            lowerInput.includes('से') || lowerInput.includes('to') || lowerInput.includes('eta') || lowerInput.includes('time') || lowerInput.includes('arrival')) {
            // If user asked for ETA specifically, prefer ETA function
            if (lowerInput.includes('eta') || lowerInput.includes('arrival') || lowerInput.includes('how long') || lowerInput.includes('time')) {
                // try to extract two stations
                const parts = input.split(/से|from|to|को/i).map(p => p.trim()).filter(Boolean);
                if (parts.length >= 2) {
                    const from = parts[0];
                    const to = parts[parts.length - 1];
                    const eta = getETA(from, to);
                    if (eta) {
                        const text = language === 'hindi' ?
                            `⏱️ अनुमानित समय: ~${eta.minutes} मिनट ( ${eta.stops} स्टॉप ) on ${eta.lineName}` :
                            `⏱️ Estimated time: ~${eta.minutes} minutes ( ${eta.stops} stops ) on ${eta.lineName}`;
                        response = { type: 'eta', text, language };
                    } else {
                        response = findRoute(input);
                    }
                } else {
                    response = findRoute(input);
                }
            } else {
                response = findRoute(input);
            }
        }
        // Ticket prices
        else if (lowerInput.includes('price') || lowerInput.includes('fare') ||
            hindiInput.includes('कीमत') || hindiInput.includes('किराया')) {
            response = getTicketInfo(input);
        }
        // Opening hours
        else if (lowerInput.includes('open') || lowerInput.includes('hour') ||
            hindiInput.includes('खुला') || hindiInput.includes('समय')) {
            response = {
                type: 'info',
                text: getText('openingTime'),
                language: language
            };
        }
        // Live metro status / running status
        else if (lowerInput.includes('running') || lowerInput.includes('status') || lowerInput.includes('operational') ||
            hindiInput.includes('चल रहा') || hindiInput.includes('स्थिति') || hindiInput.includes('चलायमान')) {
            response = getLiveMetroStatus(input);
        }
        // Live location / train tracking
        else if (lowerInput.includes('location') || lowerInput.includes('where') || lowerInput.includes('track') || lowerInput.includes('live location') ||
            hindiInput.includes('स्थान') || hindiInput.includes('कहाँ') || hindiInput.includes('ट्रैक')) {
            response = getLiveLocationInfo(input);
        }
        // Station info / line mapping / platform
        else if (lowerInput.includes('station') || hindiInput.includes('स्टेशन') || lowerInput.includes('line') || lowerInput.includes('platform') || lowerInput.includes('which line') || hindiInput.includes('किस लाइन')) {
            // If asked which line a station/platform belongs to
            if (lowerInput.includes('which line') || lowerInput.includes('किस लाइन') || lowerInput.includes('line of') || lowerInput.includes('line is')) {
                // extract station name heuristically
                const tokens = input.split(/of|ka|के|kis|kis line|किस लाइन/i).map(t => t.trim()).filter(Boolean);
                const candidate = tokens.length > 1 ? tokens[tokens.length - 1] : tokens[0] || input;
                const st = findBestStationMatch(candidate || input);
                if (st) {
                    const li = getLineForStation(st.name);
                    if (li) {
                        response = { type: 'info', text: language === 'hindi' ? `${st.name} स्टेशन ${li.line.name} लाइन में आता है।` : `${st.name} station is on ${li.line.name} line.`, language };
                    } else {
                        response = { type: 'error', text: getText('notFound'), language };
                    }
                } else {
                    response = getStationInfo(input);
                }
            } else if (lowerInput.includes('platform')) {
                const st = findBestStationMatch(input);
                if (st) {
                    const li = getLineForStation(st.name);
                    response = { type: 'info', text: language === 'hindi' ? `${st.name} पर प्लेटफ़ॉर्म संख्या रूट और स्टेशन की घोषणाओं पर निर्भर करती है; सामान्यत: ${li ? li.line.name : 'line'} पर प्लेटफ़ॉर्म उपलब्ध हैं।` : `${st.name} platform numbers depend on station layout and operations; typically this station serves the ${li ? li.line.name : 'line'}.`, language };
                } else {
                    response = getStationInfo(input);
                }
            } else {
                response = getStationInfo(input);
            }
        }
        // Crowd / busy info
        else if (lowerInput.includes('crowd') || lowerInput.includes('crowded') || lowerInput.includes('busy') || hindiInput.includes('भीड़')) {
            const parts = input.split(/at|in|par|पर/i).map(p => p.trim()).filter(Boolean);
            const candidate = parts.length > 0 ? parts[parts.length - 1] : input;
            const estimate = getCrowdEstimate(candidate);
            if (estimate) {
                response = { type: 'info', text: language === 'hindi' ? `${candidate} स्टेशन पर भीड़: ${estimate.level} (~${estimate.percent}%)` : `Crowd at ${candidate}: ${estimate.level} (~${estimate.percent}%)`, language };
            } else {
                response = { type: 'error', text: getText('notFound'), language };
            }
        }
        // Station master updates
        else if (lowerInput.includes('station master') || lowerInput.includes('station-master') || lowerInput.includes('station updates') || hindiInput.includes('स्टेशन मास्टर') || hindiInput.includes('अपडेट')) {
            // extract station name
            const parts = input.split(/at|in|par|पर|station|स्टेशन/i).map(p => p.trim()).filter(Boolean);
            const candidate = parts.length > 0 ? parts[parts.length - 1] : input;
            const st = findBestStationMatch(candidate);
            if (st) {
                const updates = await getStationMasterUpdates(st.name);
                if (updates.length > 0) {
                    const text = updates.map(u => `- ${u.title}: ${u.description || u.content || ''}`).join('\n');
                    response = { type: 'updates', text, language };
                } else {
                    response = { type: 'info', text: language === 'hindi' ? `${st.name} के लिए हालिया स्टेशन मास्टर अपडेट नहीं मिली।` : `No recent station-master updates found for ${st.name}.`, language };
                }
            } else {
                response = { type: 'error', text: getText('notFound'), language };
            }
        }
        // Help
        else if (lowerInput.includes('help') || hindiInput.includes('मदद')) {
            response = {
                type: 'help',
                text: getText('helpText'),
                language: language
            };
        }
        // Default
        else {
            response = {
                type: 'info',
                text: language === 'hindi' ?
                    'क्षमा करें, मुझे समझ नहीं आया। कृपया "मेट्रो खोजें", "किराया", "लाइव स्टेटस", या "स्टेशन" बारे में पूछें।' :
                    'Sorry, I did not understand. Please ask about "metro search", "fare", "live status", "live location", or "stations".',
                language: language
            };
        }

        setLoading(false);
        return response;
    };

    const findRoute = (input) => {
        // Try to extract station names
        let fromStn = null;
        let toStn = null;

        // Look for "से" (from) or "from"
        const parts = input.split(/से|from|to|को/i);
        if (parts.length >= 2) {
            const from = parts[0].trim();
            const to = parts[parts.length - 1].trim();

            fromStn = metroLinesData.flatMap(l => l.stations || []).find(s =>
                s.name.toLowerCase().includes(from.toLowerCase())
            );
            toStn = metroLinesData.flatMap(l => l.stations || []).find(s =>
                s.name.toLowerCase().includes(to.toLowerCase())
            );
        }

        if (fromStn && toStn) {
            // Find common line
            let foundLine = null;
            let fromIdx = -1, toIdx = -1;

            for (let line of metroLinesData) {
                const fIdx = (line.stations || []).findIndex(s => s.name === fromStn.name);
                const tIdx = (line.stations || []).findIndex(s => s.name === toStn.name);
                if (fIdx >= 0 && tIdx >= 0) {
                    foundLine = line;
                    fromIdx = fIdx;
                    toIdx = tIdx;
                    break;
                }
            }

            if (foundLine) {
                const distance = Math.abs(toIdx - fromIdx);
                const fare = Math.max(20, distance * 5);
                const estimatedTime = distance * 3; // 3 min per station

                // Calculate actual distance in km (approximate)
                const fromCoord = fromStn;
                const toCoord = toStn;
                const actualDistance = Math.sqrt(
                    Math.pow(toCoord.lat - fromCoord.lat, 2) +
                    Math.pow(toCoord.lng - fromCoord.lng, 2)
                ) * 111; // Convert lat/lng difference to approximate km

                const text = language === 'hindi' ?
                    `✅ रूट मिल गया!\n\n📍 ${fromStn.name} से ${toStn.name}\n📏 दूरी: ${distance} स्टेशन (~${actualDistance.toFixed(1)} km)\n⏱️ समय: ~${estimatedTime} मिनट\n💰 किराया: ₹${fare}\n🚇 लाइन: ${foundLine.name}` :
                    `✅ Route found!\n\n📍 From ${fromStn.name} to ${toStn.name}\n📏 Distance: ${distance} stations (~${actualDistance.toFixed(1)} km)\n⏱️ Time: ~${estimatedTime} minutes\n💰 Fare: ₹${fare}\n🚇 Line: ${foundLine.name}`;

                return {
                    type: 'route',
                    text: text,
                    fromStation: fromStn.name,
                    toStation: toStn.name,
                    distance: distance,
                    actualDistance: actualDistance.toFixed(1),
                    fare: fare,
                    time: estimatedTime,
                    language: language
                };
            }
        }

        return {
            type: 'error',
            text: getText('notFound'),
            language: language
        };
    };

    const getTicketInfo = (input) => {
        const lowerInput = input.toLowerCase();
        let info = '';

        if (lowerInput.includes('single') || input.includes('एक')) {
            info = language === 'hindi' ?
                '🎫 एकल यात्रा: ₹20-₹40\n✓ एक यात्रा के लिए' :
                '🎫 Single Journey: ₹20-₹40\n✓ For one journey';
        }
        else if (lowerInput.includes('day') || input.includes('दिन')) {
            info = getText('dayPass') + '\n✓ 24 घंटे अनलिमिटेड';
        }
        else if (lowerInput.includes('month') || input.includes('महीना')) {
            info = getText('monthlyPass') + '\n✓ 30 दिन अनलिमिटेड';
        }
        else if (lowerInput.includes('smart') || input.includes('स्मार्ट')) {
            info = getText('smartCard') + '\n✓ रीचार्जेबल कार्ड';
        }
        else {
            info = language === 'hindi' ?
                '📋 सभी किराए:\n🎫 एकल: ₹20-₹40\n📅 दिन पास: ₹70-₹100\n📊 मासिक: ₹500-₹700\n💳 स्मार्ट कार्ड: ₹100+' :
                '📋 All Fares:\n🎫 Single: ₹20-₹40\n📅 Day Pass: ₹70-₹100\n📊 Monthly: ₹500-₹700\n💳 Smart Card: ₹100+';
        }

        return {
            type: 'fare',
            text: info,
            language: language
        };
    };

    const getStationInfo = (input) => {
        const allStations = metroLinesData.flatMap(line => ({
            name: line.name,
            stations: line.stations || []
        }));

        const stationList = allStations.map(line =>
            `🚇 ${line.name}:\n${(line.stations || []).map(s => s.name).join(', ')}`
        ).join('\n\n');

        return {
            type: 'info',
            text: language === 'hindi' ?
                `📍 सभी स्टेशन:\n\n${stationList}` :
                `📍 All Stations:\n\n${stationList}`,
            language: language
        };
    };

    // --- Helpers inserted: station matching, ETA, crowd, station-master updates ---
    const findBestStationMatch = (name) => {
        if (!name) return null;
        const flat = metroLinesData.flatMap(line => line.stations || []);
        const q = name.toLowerCase().trim();
        let exact = flat.find(s => s.name.toLowerCase() === q);
        if (exact) return exact;
        let starts = flat.find(s => s.name.toLowerCase().startsWith(q));
        if (starts) return starts;
        let incl = flat.find(s => s.name.toLowerCase().includes(q));
        if (incl) return incl;
        let codeMatch = flat.find(s => (s.code || '').toLowerCase() === q);
        if (codeMatch) return codeMatch;
        return null;
    };

    const getLineForStation = (stationName) => {
        for (let line of metroLinesData) {
            const idx = (line.stations || []).findIndex(s => s.name.toLowerCase() === stationName.toLowerCase());
            if (idx >= 0) return { line, index: idx };
        }
        return null;
    };

    const getETA = (fromName, toName) => {
        const from = findBestStationMatch(fromName);
        const to = findBestStationMatch(toName);
        if (!from || !to) return null;
        const lineInfo = getLineForStation(from.name);
        const lineInfo2 = getLineForStation(to.name);
        if (!lineInfo || !lineInfo2 || lineInfo.line.name !== lineInfo2.line.name) return null;
        const stops = Math.abs(lineInfo.index - lineInfo2.index);
        const minutes = stops * 3;
        return { stops, minutes, lineName: lineInfo.line.name };
    };

    const getLiveMetroStatus = (input) => {
        const currentHour = new Date().getHours();
        const isOpen = currentHour >= 6 && currentHour < 22;
        const lineStatuses = metroLinesData.map(line => {
            const trainStatus = isOpen ? '✅ Running normally' : '⏸️ Closed';
            const capacity = Math.floor(40 + Math.random() * 50); // Simulated capacity %
            return `• ${line.name}: ${trainStatus} (Capacity: ${capacity}%)`;
        });

        const statusText = isOpen ?
            `✅ All metro lines are OPERATIONAL\n\n${lineStatuses.join('\n')}\n\n⏱️ Operating Hours: 6:00 AM - 10:00 PM\n📊 Average Wait Time: 2-3 minutes` :
            `⏸️ Metro is currently CLOSED\n\n🕐 Operating Hours: 6:00 AM - 10:00 PM\n\n${lineStatuses.join('\n')}`;

        return {
            type: 'info',
            text: language === 'hindi' ?
                `🚇 लाइव मेट्रो स्थिति:\n\n${statusText}` :
                `🚇 Live Metro Status:\n\n${statusText}`,
            language: language
        };
    };

    const getLiveLocationInfo = (input) => {
        // Extract station name if provided
        const parts = input.split(/at|in|par|पर/i).map(p => p.trim()).filter(Boolean);
        const stationName = parts.length > 0 ? parts[parts.length - 1] : null;

        if (stationName) {
            const station = findBestStationMatch(stationName);
            if (station) {
                const lineInfo = getLineForStation(station.name);
                if (lineInfo) {
                    const trainIndex = Math.floor(Math.random() * (lineInfo.line.stations.length - 1));
                    const nextStation = lineInfo.line.stations[trainIndex + 1];
                    const timeToNextStop = Math.floor(Math.random() * 5) + 1;

                    const text = language === 'hindi' ?
                        `📍 लाइव ट्रैकिंग - ${station.name}:\n\n🚆 आसन्न ट्रेन:\n• वर्तमान स्थिति: ${nextStation?.name || 'अगला स्टेशन'}\n• अगला स्टॉप: ${lineInfo.line.stations[trainIndex + 2]?.name || 'अंतिम स्टेशन'}\n• अनुमानित समय: ${timeToNextStop} मिनट\n• लाइन: ${lineInfo.line.name}\n• क्षमता: ${Math.floor(Math.random() * 40 + 50)}%` :
                        `📍 Live Tracking - ${station.name}:\n\nUpcoming Train:\n• Current Location: ${nextStation?.name || 'Next Station'}\n• Next Stop: ${lineInfo.line.stations[trainIndex + 2]?.name || 'Final Station'}\n• Estimated Time: ${timeToNextStop} minutes\n• Line: ${lineInfo.line.name}\n• Capacity: ${Math.floor(Math.random() * 40 + 50)}%`;

                    return { type: 'info', text, language };
                }
            }
        }

        // General live location info
        const text = language === 'hindi' ?
            `📍 लाइव ट्रेन ट्रैकिंग:\n\n🚆 सभी ट्रेनें रीयल-टाइम में चल रही हैं\n\n📊 लाइन स्थिति:\n${metroLinesData.map(line => `• ${line.name}: सक्रिय (${Math.floor(Math.random() * 40 + 50)}% क्षमता)`).join('\n')}\n\n💡 किसी विशेष स्टेशन के लिए बताएं और मैं लाइव ट्रेन की जानकारी दूंगा।` :
            `📍 Live Train Tracking:\n\n🚆 All trains are running in real-time\n\n📊 Line Status:\n${metroLinesData.map(line => `• ${line.name}: Active (${Math.floor(Math.random() * 40 + 50)}% capacity)`).join('\n')}\n\n💡 Tell me a specific station and I'll show live train information.`;

        return { type: 'info', text, language };
    };

    const getCrowdEstimate = (stationName) => {
        const s = findBestStationMatch(stationName);
        if (!s) return null;
        const sum = s.name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const pct = 20 + (sum % 80);
        let level = 'Light';
        if (pct >= 70) level = 'Crowded';
        else if (pct >= 40) level = 'Moderate';
        return { percent: pct, level };
    };

    const getStationMasterUpdates = async (stationName) => {
        try {
            const resp = await fetch('/api/news/all');
            if (!resp.ok) return [];
            const data = await resp.json();
            const filtered = data.filter(n => {
                const affected = n.affectedStations || [];
                if (Array.isArray(affected) && affected.some(a => a.toLowerCase() === stationName.toLowerCase())) return true;
                const title = (n.title || '').toLowerCase();
                const desc = (n.description || n.content || '').toLowerCase();
                if (title.includes(stationName.toLowerCase()) || desc.includes(stationName.toLowerCase())) return true;
                return false;
            });
            return filtered;
        } catch (err) {
            return [];
        }
    };

    const sendAndProcess = async (text) => {
        if (!text || !text.trim()) return;
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: text,
            language: language
        };
        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        const response = await processUserInput(text);
        setLoading(false);
        const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            ...response
        };
        setMessages(prev => [...prev, botMessage]);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        // Add user message
        const userMessage = {
            id: messages.length + 1,
            type: 'user',
            text: inputValue,
            language: language
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        // Get bot response
        const response = await processUserInput(inputValue);
        const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            ...response
        };
        setMessages(prev => [...prev, botMessage]);
    };

    return (
        <div className="chatbot-container">
            {/* Chat Button */}
            <button
                className={`chatbot-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="KMRL Assistant"
            >
                {isOpen ? <Cancel01Icon size={28} /> : <Message02Icon size={28} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-left">
                            <div className="chatbot-status"></div>
                            <h3>KMRL Assistant</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="language-toggle">
                                <button
                                    className={language === 'hindi' ? 'active' : ''}
                                    onClick={() => setLanguage('hindi')}
                                >
                                    हिंदी
                                </button>
                                <button
                                    className={language === 'english' ? 'active' : ''}
                                    onClick={() => setLanguage('english')}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.type}`}>
                                {msg.type === 'bot' && (
                                    <div className="bot-avatar">
                                        <Message02Icon size={16} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%', alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <div className="message-content">
                                        {msg.text}
                                    </div>
                                    {(msg.type === 'route' || msg.type === 'eta' || msg.fare) && (
                                        <div className="message-actions">
                                            {msg.fromStation && msg.toStation && (
                                                <>
                                                    <button className="btn-action" onClick={() => sendAndProcess(`ETA from ${msg.fromStation} to ${msg.toStation}`)}>
                                                        <Navigation02Icon size={14} /> {language === 'hindi' ? 'ETA' : 'ETA'}
                                                    </button>
                                                    <button className="btn-action" onClick={() => sendAndProcess(`Book ticket from ${msg.fromStation} to ${msg.toStation}`)}>
                                                        <SmartPhone01Icon size={14} /> {getText('book')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="message bot">
                                <div className="bot-avatar">
                                    <Message02Icon size={16} />
                                </div>
                                <div className="message-content">
                                    <span className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={language === 'hindi' ? 'अपना सवाल पूछें...' : 'Ask your question...'}
                            className="chatbot-input"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="btn-send"
                            disabled={!inputValue.trim() || loading}
                        >
                            <ArrowRight01Icon size={20} />
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="quick-actions">
                        <button className="quick-action-btn" onClick={() => sendAndProcess(language === 'hindi' ? 'दूरी बताओ Aluva से M.G. Road' : 'Distance from Aluva to M.G. Road')}>
                            <Navigation02Icon size={14} /> {language === 'hindi' ? 'दूरी' : 'Distance'}
                        </button>
                        <button className="quick-action-btn" onClick={() => sendAndProcess(language === 'hindi' ? 'किराया क्या है' : 'What is the fare')}>
                            <Ticket01Icon size={14} /> {language === 'hindi' ? 'किराया' : 'Fare'}
                        </button>
                        <button className="quick-action-btn red-hover" onClick={() => sendAndProcess(language === 'hindi' ? 'लाइव स्टेटस' : 'Live metro status')}>
                            <Location01Icon size={14} /> {language === 'hindi' ? 'स्टेटस' : 'Status'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatbot;
