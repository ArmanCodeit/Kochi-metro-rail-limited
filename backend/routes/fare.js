const express = require('express');
const router = express.Router();
const { getAllUniqueStations, findRoutes } = require('../utils/metroNetwork');

// Authoritative Kochi Metro stations
const kochiMetroStations = getAllUniqueStations().map(st => ({
    name: st.name,
    code: st.code,
    location: st.name,
    area: st.lines ? st.lines.join(' / ') : 'Blue Line',
    description: `${st.name} Metro Station (${st.lines ? st.lines.join(' / ') : 'Blue Line'})`
}));

// Get all stations
router.get('/stations', (req, res) => {
    try {
        res.json(kochiMetroStations);
    } catch (error) {
        console.error('Error fetching stations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Calculate fare between two stations using authoritative routing engine
router.post('/calculate-fare', (req, res) => {
    try {
        const { fromStation, toStation, routeId } = req.body;

        if (!fromStation || !toStation) {
            return res.status(400).json({ message: 'Both stations are required' });
        }

        if (fromStation.trim().toLowerCase() === toStation.trim().toLowerCase()) {
            return res.status(400).json({ message: 'From and To stations cannot be the same' });
        }

        const routes = findRoutes(fromStation.trim(), toStation.trim());
        if (!routes || routes.length === 0) {
            return res.status(404).json({ message: 'No connected route found between these stations' });
        }

        const selectedRoute = (routeId && routes.find(r => r.routeId === routeId)) || routes[0];

        res.json({
            fromStation: fromStation.trim(),
            toStation: toStation.trim(),
            distance: selectedRoute.distance.toFixed(1),
            fare: selectedRoute.fare,
            routeId: selectedRoute.routeId,
            routeName: selectedRoute.name,
            totalStops: selectedRoute.totalStops,
            transfers: selectedRoute.transfers,
            calculatedAt: new Date()
        });

    } catch (error) {
        console.error('Error calculating fare:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get fare between specific stations
router.get('/fare/:from/:to', (req, res) => {
    try {
        const { from, to } = req.params;
        const fromDecoded = decodeURIComponent(from).trim();
        const toDecoded = decodeURIComponent(to).trim();

        if (!fromDecoded || !toDecoded) {
            return res.status(400).json({ message: 'Both stations are required' });
        }

        if (fromDecoded.toLowerCase() === toDecoded.toLowerCase()) {
            return res.status(400).json({ message: 'From and To stations cannot be the same' });
        }

        const routes = findRoutes(fromDecoded, toDecoded);
        if (!routes || routes.length === 0) {
            return res.status(404).json({ message: 'No connected route found between these stations' });
        }

        const selectedRoute = routes[0];

        res.json({
            fromStation: fromDecoded,
            toStation: toDecoded,
            distance: selectedRoute.distance.toFixed(1),
            fare: selectedRoute.fare,
            routeId: selectedRoute.routeId,
            routeName: selectedRoute.name,
            totalStops: selectedRoute.totalStops,
            transfers: selectedRoute.transfers,
            calculatedAt: new Date()
        });

    } catch (error) {
        console.error('Error calculating fare:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
