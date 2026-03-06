const express = require('express');
const router = express.Router();

// Real Kochi Metro stations data
const kochiMetroStations = [
    { name: 'Aluva', code: 'ALU', location: 'Aluva', area: 'Ernakulathappan', description: 'Aluva Station' },
    { name: 'Puliannur', code: 'PUN', location: 'Puliannur', area: 'North Paravur', description: 'Puliannur Station' },
    { name: 'Mulanthuruthy', code: 'MUL', location: 'Mulanthuruthy', area: 'Mulanthuruthy', description: 'Mulanthuruthy Station' },
    { name: 'Kalamassery', code: 'KAL', location: 'Kalamassery', area: 'Kalamassery', description: 'Kalamassery Station' },
    { name: 'Muttom', code: 'MUT', location: 'Muttom', area: 'Muttom', description: 'Muttom Station' },
    { name: 'Kakkanad', code: 'KAK', location: 'Kakkanad', area: 'Kakkanad', description: 'Kakkanad Station' },
    { name: 'Palarivattom', code: 'PAL', location: 'Palarivattom', area: 'Palarivattom', description: 'Palarivattom Station' },
    { name: 'Vyttila Junction', code: 'VYT', location: 'Vyttila', area: 'Vyttila', description: 'Vyttila Junction Station' },
    { name: 'Kacheripady', code: 'KAC', location: 'Kacheripady', area: 'Kacheripady', description: 'Kacheripady Station' },
    { name: 'MG Road', code: 'MG', location: 'MG Road', area: 'Fort Kochi', description: 'MG Road Station' },
    { name: 'Ernakulathappan', code: 'ERA', location: 'Ernakulathappan', area: 'Ernakulathappan', description: 'Ernakulathappan Station' },
    { name: 'Changampuzha Park', code: 'CHG', location: 'Changampuzha Park', area: 'Panampilly Nagar', description: 'Changampuzha Park Station' },
    { name: 'SN Junction', code: 'SNJ', location: 'SN Junction', area: 'Seaport', description: 'SN Junction Station' },
    { name: 'Vypin', code: 'VYP', location: 'Vypin', area: 'Vypin', description: 'Vypin Station' },
    { name: 'Peruvannamuzhi', code: 'PER', location: 'Peruvannamuzhi', area: 'Peruvannamuzhi', description: 'Peruvannamuzhi Station' },
    { name: 'Pathankot', code: 'PAT', location: 'Pathankot', area: 'Pathankot', description: 'Pathankot Station' },
    { name: 'Thalassery', code: 'THL', location: 'Thalassery', area: 'Thalassery', description: 'Thalassery Station' },
    { name: 'Thripunithura', code: 'THP', location: 'Thripunithura', area: 'Thripunithura', description: 'Thripunithura Station' },
    { name: 'Ravipuram', code: 'RAV', location: 'Ravipuram', area: 'Ravipuram', description: 'Ravipuram Station' },
    { name: 'Edappally', code: 'EDA', location: 'Edappally', area: 'Edappally', description: 'Edappally Station' }
];

// Fare structure based on distance
const fareStructure = [
    { range: [0, 2], fare: 10 },
    { range: [2, 5], fare: 15 },
    { range: [5, 8], fare: 20 },
    { range: [8, 12], fare: 25 },
    { range: [12, 15], fare: 30 },
    { range: [15, 100], fare: 40 }
];

// Distance matrix between stations (in km)
const distanceMatrix = {
    'Aluva': { 'Puliannur': 2.5, 'Mulanthuruthy': 5, 'Kalamassery': 7, 'Muttom': 9, 'Kakkanad': 11, 'Palarivattom': 13, 'Vyttila Junction': 15, 'Kacheripady': 17, 'MG Road': 19, 'Ernakulathappan': 21 },
    'Puliannur': { 'Aluva': 2.5, 'Mulanthuruthy': 2.5, 'Kalamassery': 4.5, 'Muttom': 6.5, 'Kakkanad': 8.5, 'Palarivattom': 10.5, 'Vyttila Junction': 12.5, 'Kacheripady': 14.5, 'MG Road': 16.5, 'Ernakulathappan': 18.5 },
    'Mulanthuruthy': { 'Aluva': 5, 'Puliannur': 2.5, 'Kalamassery': 2, 'Muttom': 4, 'Kakkanad': 6, 'Palarivattom': 8, 'Vyttila Junction': 10, 'Kacheripady': 12, 'MG Road': 14, 'Ernakulathappan': 16 },
    'Kalamassery': { 'Aluva': 7, 'Puliannur': 4.5, 'Mulanthuruthy': 2, 'Muttom': 2, 'Kakkanad': 4, 'Palarivattom': 6, 'Vyttila Junction': 8, 'Kacheripady': 10, 'MG Road': 12, 'Ernakulathappan': 14 },
    'Muttom': { 'Aluva': 9, 'Puliannur': 6.5, 'Mulanthuruthy': 4, 'Kalamassery': 2, 'Kakkanad': 2, 'Palarivattom': 4, 'Vyttila Junction': 6, 'Kacheripady': 8, 'MG Road': 10, 'Ernakulathappan': 12 },
    'Kakkanad': { 'Aluva': 11, 'Puliannur': 8.5, 'Mulanthuruthy': 6, 'Kalamassery': 4, 'Muttom': 2, 'Palarivattom': 2, 'Vyttila Junction': 4, 'Kacheripady': 6, 'MG Road': 8, 'Ernakulathappan': 10 },
    'Palarivattom': { 'Aluva': 13, 'Puliannur': 10.5, 'Mulanthuruthy': 8, 'Kalamassery': 6, 'Muttom': 4, 'Kakkanad': 2, 'Vyttila Junction': 2, 'Kacheripady': 4, 'MG Road': 6, 'Ernakulathappan': 8 },
    'Vyttila Junction': { 'Aluva': 15, 'Puliannur': 12.5, 'Mulanthuruthy': 10, 'Kalamassery': 8, 'Muttom': 6, 'Kakkanad': 4, 'Palarivattom': 2, 'Kacheripady': 2, 'MG Road': 4, 'Ernakulathappan': 6 },
    'Kacheripady': { 'Aluva': 17, 'Puliannur': 14.5, 'Mulanthuruthy': 12, 'Kalamassery': 10, 'Muttom': 8, 'Kakkanad': 6, 'Palarivattom': 4, 'Vyttila Junction': 2, 'MG Road': 2, 'Ernakulathappan': 4 },
    'MG Road': { 'Aluva': 19, 'Puliannur': 16.5, 'Mulanthuruthy': 14, 'Kalamassery': 12, 'Muttom': 10, 'Kakkanad': 8, 'Palarivattom': 6, 'Vyttila Junction': 4, 'Kacheripady': 2, 'Ernakulathappan': 2 },
    'Ernakulathappan': { 'Aluva': 21, 'Puliannur': 18.5, 'Mulanthuruthy': 16, 'Kalamassery': 14, 'Muttom': 12, 'Kakkanad': 10, 'Palarivattom': 8, 'Vyttila Junction': 6, 'Kacheripady': 4, 'MG Road': 2 }
};

// Get all stations
router.get('/stations', (req, res) => {
    try {
        res.json(kochiMetroStations);
    } catch (error) {
        console.error('Error fetching stations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Calculate fare between two stations
router.post('/calculate-fare', (req, res) => {
    try {
        const { fromStation, toStation } = req.body;

        if (!fromStation || !toStation) {
            return res.status(400).json({ message: 'Both stations are required' });
        }

        if (fromStation === toStation) {
            return res.status(400).json({ message: 'From and To stations cannot be the same' });
        }

        // Get distance between stations
        let distance = 0;
        if (distanceMatrix[fromStation] && distanceMatrix[fromStation][toStation]) {
            distance = distanceMatrix[fromStation][toStation];
        } else if (distanceMatrix[toStation] && distanceMatrix[toStation][fromStation]) {
            distance = distanceMatrix[toStation][fromStation];
        } else {
            // Default distance if not found
            distance = 10;
        }

        // Calculate fare based on distance
        let fare = fareStructure[fareStructure.length - 1].fare; // Default fare
        for (let i = 0; i < fareStructure.length; i++) {
            if (distance >= fareStructure[i].range[0] && distance < fareStructure[i].range[1]) {
                fare = fareStructure[i].fare;
                break;
            }
        }

        res.json({
            fromStation,
            toStation,
            distance: distance.toFixed(1),
            fare,
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
        const fromDecoded = decodeURIComponent(from);
        const toDecoded = decodeURIComponent(to);

        if (!fromDecoded || !toDecoded) {
            return res.status(400).json({ message: 'Both stations are required' });
        }

        if (fromDecoded === toDecoded) {
            return res.status(400).json({ message: 'From and To stations cannot be the same' });
        }

        // Get distance between stations
        let distance = 0;
        if (distanceMatrix[fromDecoded] && distanceMatrix[fromDecoded][toDecoded]) {
            distance = distanceMatrix[fromDecoded][toDecoded];
        } else if (distanceMatrix[toDecoded] && distanceMatrix[toDecoded][fromDecoded]) {
            distance = distanceMatrix[toDecoded][fromDecoded];
        } else {
            distance = 10;
        }

        // Calculate fare based on distance
        let fare = fareStructure[fareStructure.length - 1].fare;
        for (let i = 0; i < fareStructure.length; i++) {
            if (distance >= fareStructure[i].range[0] && distance < fareStructure[i].range[1]) {
                fare = fareStructure[i].fare;
                break;
            }
        }

        res.json({
            fromStation: fromDecoded,
            toStation: toDecoded,
            distance: distance.toFixed(1),
            fare,
            calculatedAt: new Date()
        });

    } catch (error) {
        console.error('Error calculating fare:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
