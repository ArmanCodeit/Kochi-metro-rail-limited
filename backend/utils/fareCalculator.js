// Kochi Metro authoritative fare calculation and station directory
// Synchronized with multi-line routing engine and KMRL official fare policy

const { getAllUniqueStations, findRoutes, calculateKMRLFare } = require('./metroNetwork');

const kochiMetroStations = getAllUniqueStations().map(st => ({
    name: st.name,
    code: st.code,
    location: st.name,
    area: st.lines ? st.lines.join(' / ') : 'Blue Line',
    description: `${st.name} Metro Station (${st.lines ? st.lines.join(' / ') : 'Blue Line'})`,
    isInterchange: st.isInterchange || false
}));

const fareStructure = [
    { range: [0, 2], fare: 10 },
    { range: [2, 5], fare: 15 },
    { range: [5, 8], fare: 20 },
    { range: [8, 12], fare: 25 },
    { range: [12, 15], fare: 30 },
    { range: [15, 20], fare: 40 },
    { range: [20, 25], fare: 50 },
    { range: [25, 100], fare: 60 }
];

const calculateFare = (fromStation, toStation, routeId = null) => {
    if (!fromStation || !toStation || fromStation.trim().toLowerCase() === toStation.trim().toLowerCase()) {
        return null;
    }

    const routes = findRoutes(fromStation.trim(), toStation.trim());
    if (!routes || routes.length === 0) {
        return null;
    }

    const selectedRoute = (routeId && routes.find(r => r.routeId === routeId)) || routes[0];

    return {
        fromStation: fromStation.trim(),
        toStation: toStation.trim(),
        distance: Number(selectedRoute.distance.toFixed(1)),
        fare: selectedRoute.fare,
        routeId: selectedRoute.routeId,
        routeName: selectedRoute.name,
        totalStops: selectedRoute.totalStops,
        transfers: selectedRoute.transfers,
        interchanges: selectedRoute.interchanges || [],
        estimatedMinutes: selectedRoute.estimatedMinutes
    };
};

module.exports = {
    kochiMetroStations,
    fareStructure,
    calculateFare,
    calculateKMRLFare
};
