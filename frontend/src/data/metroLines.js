// Improved Kochi Metro line data (major stations) with approximated coordinates.
// If you need exact official coordinates, I can fetch and update these precisely.
const metroLines = [
  {
    id: 'line-1',
    name: 'Aluva – M.G. Road (Main Line)',
    color: '#0077be',
    stations: [
      { name: 'Aluva', code: 'ALV', lat: 10.1076, lng: 76.3516 },
      { name: 'Pulinchodu', code: 'PUL', lat: 10.0968, lng: 76.3565 },
      { name: 'Companypady', code: 'COM', lat: 10.0891, lng: 76.3612 },
      { name: 'SN Junction', code: 'SNJ', lat: 10.0815, lng: 76.3671 },
      { name: 'Ambattukavu', code: 'AMB', lat: 10.0736, lng: 76.3722 },
      { name: 'Kakkanad', code: 'KAK', lat: 10.0475, lng: 76.3281 },
      { name: 'Palarivattom', code: 'PAL', lat: 10.0232, lng: 76.3296 },
      { name: 'Edapally', code: 'EDA', lat: 10.0261, lng: 76.3187 },
      { name: 'Muttom', code: 'MUT', lat: 10.0135, lng: 76.3100 },
      { name: 'Kaloor', code: 'KAL', lat: 9.9989, lng: 76.3052 },
      { name: 'Lissie', code: 'LIS', lat: 9.9908, lng: 76.2968 },
      { name: 'M.G. Road', code: 'MGR', lat: 9.9816, lng: 76.2858 },
      { name: 'Ernakulam South', code: 'ERS', lat: 9.9711, lng: 76.2819 }
    ]
  },
  {
    id: 'line-2',
    name: 'Vyttila Extension',
    color: '#e74c3c',
    stations: [
      { name: 'Vyttila', code: 'VYT', lat: 9.9614, lng: 76.2956 },
      { name: 'Thykoodam', code: 'THY', lat: 9.9690, lng: 76.3001 },
      { name: 'Kakkanad South', code: 'SEA', lat: 9.9802, lng: 76.3120 },
      { name: 'Edappally (via extension)', code: 'EDA', lat: 10.0261, lng: 76.3187 }
    ]
  }
];

export default metroLines;
