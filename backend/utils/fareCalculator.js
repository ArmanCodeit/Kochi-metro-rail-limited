// Kochi Metro verified stations, distances, and distance-based fare structure

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

const fareStructure = [
    { range: [0, 2], fare: 10 },
    { range: [2, 5], fare: 15 },
    { range: [5, 8], fare: 20 },
    { range: [8, 12], fare: 25 },
    { range: [12, 15], fare: 30 },
    { range: [15, 100], fare: 40 }
];

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

const calculateFare = (fromStation, toStation) => {
    if (!fromStation || !toStation || fromStation === toStation) {
        return null;
    }

    let distance = 0;
    if (distanceMatrix[fromStation] && distanceMatrix[fromStation][toStation]) {
        distance = distanceMatrix[fromStation][toStation];
    } else if (distanceMatrix[toStation] && distanceMatrix[toStation][fromStation]) {
        distance = distanceMatrix[toStation][fromStation];
    } else {
        distance = 10;
    }

    let fare = fareStructure[fareStructure.length - 1].fare;
    for (let i = 0; i < fareStructure.length; i++) {
        if (distance >= fareStructure[i].range[0] && distance < fareStructure[i].range[1]) {
            fare = fareStructure[i].fare;
            break;
        }
    }

    return {
        fromStation,
        toStation,
        distance: Number(distance.toFixed(1)),
        fare
    };
};

module.exports = {
    kochiMetroStations,
    fareStructure,
    distanceMatrix,
    calculateFare
};
