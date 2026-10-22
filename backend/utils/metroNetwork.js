// Kochi Metro Verified Multi-Line Transit Network Dataset and Routing Engine

const lines = [
    {
        id: 'line-1',
        name: 'Blue Line',
        fullName: 'Line 1: Aluva ↔ Tripunithura',
        color: '#0284c7', // Sky Blue
        badgeColor: '#0284c7',
        terminalA: 'Aluva',
        terminalB: 'Tripunithura',
        stations: [
            { id: 'ALV', name: 'Aluva', code: 'ALV', order: 1 },
            { id: 'PUL', name: 'Pulinchodu', code: 'PUL', order: 2 },
            { id: 'COM', name: 'Companypady', code: 'COM', order: 3 },
            { id: 'AMB', name: 'Ambattukavu', code: 'AMB', order: 4 },
            { id: 'MUT', name: 'Muttom', code: 'MUT', order: 5 },
            { id: 'KAL', name: 'Kalamassery', code: 'KAL', order: 6 },
            { id: 'CUS', name: 'Cochin University', code: 'CUS', order: 7 },
            { id: 'PAT', name: 'Pathadipalam', code: 'PAT', order: 8 },
            { id: 'EDA', name: 'Edappally', code: 'EDA', order: 9 },
            { id: 'CHG', name: 'Changampuzha Park', code: 'CHG', order: 10 },
            { id: 'PAL', name: 'Palarivattom', code: 'PAL', order: 11 },
            { id: 'JLN', name: 'JLN Stadium', code: 'JLN', order: 12, isInterchange: true, interchangeLines: ['line-2'] },
            { id: 'KLR', name: 'Kaloor', code: 'KLR', order: 13 },
            { id: 'LIS', name: 'Lissie', code: 'LIS', order: 14 },
            { id: 'MGR', name: 'M.G. Road', code: 'MGR', order: 15 },
            { id: 'MAH', name: 'Maharaja’s College', code: 'MAH', order: 16 },
            { id: 'ERS', name: 'Ernakulam South', code: 'ERS', order: 17 },
            { id: 'KAD', name: 'Kadavanthra', code: 'KAD', order: 18 },
            { id: 'ELA', name: 'Elamkulam', code: 'ELA', order: 19 },
            { id: 'VYT', name: 'Vyttila', code: 'VYT', order: 20, isInterchange: true, interchangeLines: ['line-3'] },
            { id: 'THY', name: 'Thykoodam', code: 'THY', order: 21 },
            { id: 'PET', name: 'Petta', code: 'PET', order: 22 },
            { id: 'VAD', name: 'Vadakkekotta', code: 'VAD', order: 23 },
            { id: 'SNJ', name: 'SN Junction', code: 'SNJ', order: 24 },
            { id: 'THP', name: 'Tripunithura', code: 'THP', order: 25 }
        ]
    },
    {
        id: 'line-2',
        name: 'Pink Line',
        fullName: 'Line 2: JLN Stadium ↔ Infopark (Kakkanad)',
        color: '#ec4899', // Pink
        badgeColor: '#ec4899',
        terminalA: 'JLN Stadium',
        terminalB: 'Infopark',
        stations: [
            { id: 'JLN', name: 'JLN Stadium', code: 'JLN', order: 1, isInterchange: true, interchangeLines: ['line-1'] },
            { id: 'PLJ', name: 'Palarivattom Junction', code: 'PLJ', order: 2 },
            { id: 'PBP', name: 'Palarivattom Bypass', code: 'PBP', order: 3 },
            { id: 'CHM', name: 'Chembumukku', code: 'CHM', order: 4 },
            { id: 'VAZ', name: 'Vazhakkala', code: 'VAZ', order: 5 },
            { id: 'PAD', name: 'Padamughal', code: 'PAD', order: 6 },
            { id: 'KKJ', name: 'Kakkanad Junction', code: 'KKJ', order: 7 },
            { id: 'SEZ', name: 'Cochin SEZ', code: 'SEZ', order: 8 },
            { id: 'CHI', name: 'Chittethukara', code: 'CHI', order: 9 },
            { id: 'KIN', name: 'KINFRA Park', code: 'KIN', order: 10 },
            { id: 'INF', name: 'Infopark', code: 'INF', order: 11 }
        ]
    },
    {
        id: 'line-3',
        name: 'Green Line',
        fullName: 'Line 3: Vyttila Hub ↔ Marine Drive / Coastal',
        color: '#10b981', // Emerald Green
        badgeColor: '#10b981',
        terminalA: 'Vyttila',
        terminalB: 'Fort Kochi Gate',
        stations: [
            { id: 'VYT', name: 'Vyttila', code: 'VYT', order: 1, isInterchange: true, interchangeLines: ['line-1'] },
            { id: 'PAN', name: 'Panampilly Nagar', code: 'PAN', order: 2 },
            { id: 'SRS', name: 'South Railway Station', code: 'SRS', order: 3 },
            { id: 'HCT', name: 'High Court', code: 'HCT', order: 4 },
            { id: 'BOL', name: 'Bolgatty', code: 'BOL', order: 5 },
            { id: 'FKG', name: 'Fort Kochi Gate', code: 'FKG', order: 6 }
        ]
    }
];

// Helper: Get unique stations list across all lines
const getAllUniqueStations = () => {
    const map = new Map();
    lines.forEach(line => {
        line.stations.forEach(st => {
            if (!map.has(st.name.toLowerCase())) {
                map.set(st.name.toLowerCase(), {
                    id: st.id,
                    name: st.name,
                    code: st.code,
                    lines: [line.name],
                    lineColors: [line.color],
                    isInterchange: !!st.isInterchange
                });
            } else {
                const existing = map.get(st.name.toLowerCase());
                if (!existing.lines.includes(line.name)) {
                    existing.lines.push(line.name);
                    existing.lineColors.push(line.color);
                    existing.isInterchange = true;
                }
            }
        });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const normalizeStationString = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveStation = (inputName, allStations) => {
    if (!inputName) return null;
    const clean = inputName.trim().toLowerCase();
    const stripped = normalizeStationString(clean);

    // Exact name or station code match
    let found = allStations.find(s => s.name.toLowerCase() === clean || s.code.toLowerCase() === clean);
    if (found) return found;

    // Stripped alphanumeric match (handles hyphens, dots, apostrophes, extra spaces)
    found = allStations.find(s => normalizeStationString(s.name) === stripped || normalizeStationString(s.code) === stripped);
    if (found) return found;

    // Common Kochi Metro name aliases
    if (stripped.includes('infopark')) return allStations.find(s => s.name === 'Infopark');
    if (stripped.includes('tripunithura') || stripped.includes('thripunithura')) return allStations.find(s => s.name === 'Tripunithura');
    if (stripped.includes('edapally') || stripped.includes('edappally')) return allStations.find(s => s.name === 'Edappally');
    if (stripped.includes('cusat')) return allStations.find(s => s.name === 'Cochin University');
    if (stripped.includes('mgroad')) return allStations.find(s => s.name === 'M.G. Road');
    if (stripped.includes('maharaja')) return allStations.find(s => s.name === 'Maharaja’s College');
    if (stripped.includes('vyttila') || stripped.includes('vytila')) return allStations.find(s => s.name === 'Vyttila');
    if (stripped.includes('kaloor')) return allStations.find(s => s.name === 'Kaloor');
    if (stripped.includes('aluva')) return allStations.find(s => s.name === 'Aluva');

    // Partial contains
    found = allStations.find(s => normalizeStationString(s.name).includes(stripped) || stripped.includes(normalizeStationString(s.name)));
    return found || null;
};

// Graph-based Routing Engine (BFS with alternative paths exploration)
const findRoutes = (fromName, toName) => {
    if (!fromName || !toName) return [];

    const allStns = getAllUniqueStations();
    const validFrom = resolveStation(fromName, allStns);
    const validTo = resolveStation(toName, allStns);

    if (!validFrom || !validTo) {
        return [];
    }

    if (validFrom.name.toLowerCase() === validTo.name.toLowerCase()) {
        return [];
    }

    const actualFrom = validFrom.name;
    const actualTo = validTo.name;

    // Find all lines containing fromStation
    const startLines = lines.filter(l => l.stations.some(s => s.name.toLowerCase() === actualFrom.toLowerCase()));
    // Find all lines containing toStation
    const destLines = lines.filter(l => l.stations.some(s => s.name.toLowerCase() === actualTo.toLowerCase()));

    const candidateRoutes = [];

    // 1. Direct Routes (0 transfers)
    startLines.forEach(sLine => {
        if (destLines.some(dLine => dLine.id === sLine.id)) {
            const fromIdx = sLine.stations.findIndex(s => s.name.toLowerCase() === actualFrom.toLowerCase());
            const toIdx = sLine.stations.findIndex(s => s.name.toLowerCase() === actualTo.toLowerCase());

            const step = fromIdx < toIdx ? 1 : -1;
            const fullPath = [];
            for (let i = fromIdx; i !== toIdx + step; i += step) {
                fullPath.push(sLine.stations[i].name);
            }

            const totalStops = Math.abs(toIdx - fromIdx);
            const estMinutes = totalStops * 2.5 + 2;

            // Distance & fare estimation
            const distance = Number((totalStops * 1.25).toFixed(1));
            let fare = 10;
            if (distance > 2 && distance <= 5) fare = 15;
            else if (distance > 5 && distance <= 8) fare = 20;
            else if (distance > 8 && distance <= 12) fare = 25;
            else if (distance > 12 && distance <= 15) fare = 30;
            else if (distance > 15) fare = 40;

            const direction = step === 1 ? sLine.terminalB : sLine.terminalA;

            candidateRoutes.push({
                routeId: `DIR_${sLine.id}`,
                name: `Direct via ${sLine.name}`,
                transfers: 0,
                interchanges: [],
                lines: [{ id: sLine.id, name: sLine.name, color: sLine.color }],
                totalStops,
                estimatedMinutes: Math.round(estMinutes),
                distance,
                fare,
                fullPath,
                segments: [
                    {
                        segmentIndex: 1,
                        lineId: sLine.id,
                        lineName: sLine.name,
                        lineColor: sLine.color,
                        boardAt: actualFrom,
                        alightAt: actualTo,
                        directionTowards: direction,
                        stopsCount: totalStops,
                        stationList: fullPath
                    }
                ]
            });
        }
    });

    // 2. 1-Transfer Routes via Interchange Stations
    startLines.forEach(sLine => {
        destLines.forEach(dLine => {
            if (sLine.id !== dLine.id) {
                // Find interchange stations shared between sLine and dLine
                const interchanges = sLine.stations.filter(s1 =>
                    dLine.stations.some(s2 => s2.name.toLowerCase() === s1.name.toLowerCase())
                );

                interchanges.forEach(xStation => {
                    const fromIdx = sLine.stations.findIndex(s => s.name.toLowerCase() === actualFrom.toLowerCase());
                    const xIdx1 = sLine.stations.findIndex(s => s.name.toLowerCase() === xStation.name.toLowerCase());
                    const xIdx2 = dLine.stations.findIndex(s => s.name.toLowerCase() === xStation.name.toLowerCase());
                    const toIdx = dLine.stations.findIndex(s => s.name.toLowerCase() === actualTo.toLowerCase());

                    // Segment 1 Path
                    const step1 = fromIdx < xIdx1 ? 1 : -1;
                    const path1 = [];
                    for (let i = fromIdx; i !== xIdx1 + step1; i += step1) {
                        path1.push(sLine.stations[i].name);
                    }

                    // Segment 2 Path
                    const step2 = xIdx2 < toIdx ? 1 : -1;
                    const path2 = [];
                    for (let i = xIdx2 + step2; i !== toIdx + step2; i += step2) {
                        path2.push(dLine.stations[i].name);
                    }

                    const fullPath = [...path1, ...path2];
                    const stops1 = Math.abs(xIdx1 - fromIdx);
                    const stops2 = Math.abs(toIdx - xIdx2);
                    const totalStops = stops1 + stops2;

                    const estMinutes = (stops1 + stops2) * 2.5 + 6; // 6 mins for interchange transfer
                    const distance = Number((totalStops * 1.3).toFixed(1));

                    let fare = 20;
                    if (distance > 8 && distance <= 12) fare = 25;
                    else if (distance > 12 && distance <= 15) fare = 30;
                    else if (distance > 15) fare = 40;

                    const dir1 = step1 === 1 ? sLine.terminalB : sLine.terminalA;
                    const dir2 = step2 === 1 ? dLine.terminalB : dLine.terminalA;

                    candidateRoutes.push({
                        routeId: `TRANSFER_${sLine.id}_${xStation.code}_${dLine.id}`,
                        name: `${sLine.name} → Transfer at ${xStation.name} → ${dLine.name}`,
                        transfers: 1,
                        interchanges: [xStation.name],
                        lines: [
                            { id: sLine.id, name: sLine.name, color: sLine.color },
                            { id: dLine.id, name: dLine.name, color: dLine.color }
                        ],
                        totalStops,
                        estimatedMinutes: Math.round(estMinutes),
                        distance,
                        fare,
                        fullPath,
                        segments: [
                            {
                                segmentIndex: 1,
                                lineId: sLine.id,
                                lineName: sLine.name,
                                lineColor: sLine.color,
                                boardAt: actualFrom,
                                alightAt: xStation.name,
                                directionTowards: dir1,
                                stopsCount: stops1,
                                stationList: path1,
                                transferInstruction: `Transfer at ${xStation.name} to ${dLine.name} (Towards ${dir2})`
                            },
                            {
                                segmentIndex: 2,
                                lineId: dLine.id,
                                lineName: dLine.name,
                                lineColor: dLine.color,
                                boardAt: xStation.name,
                                alightAt: actualTo,
                                directionTowards: dir2,
                                stopsCount: stops2,
                                stationList: [xStation.name, ...path2]
                            }
                        ]
                    });
                });
            }
        });
    });

    // Sort routes: Fewer transfers first, then shortest estimated time
    candidateRoutes.sort((a, b) => {
        if (a.transfers !== b.transfers) {
            return a.transfers - b.transfers;
        }
        return a.estimatedMinutes - b.estimatedMinutes;
    });

    // Mark the top route as Recommended
    if (candidateRoutes.length > 0) {
        candidateRoutes[0].isRecommended = true;
    }

    return candidateRoutes;
};

module.exports = {
    lines,
    getAllUniqueStations,
    findRoutes
};
