// Warung Kilat — menu data: dishes, stations, customers and day targets.
// Every dish is an original recipe invented for this game; the names are
// everyday Indonesian warung food, the combinations are the game's own.

export const STATIONS = [
  { id: 'chop', name: 'CHOP', key: 'Q', label: 'Talenan', colour: '#f4a259', icon: 'knife' },
  { id: 'fry', name: 'FRY', key: 'W', label: 'Wajan', colour: '#e4572e', icon: 'pan' },
  { id: 'grill', name: 'GRILL', key: 'E', label: 'Panggangan', colour: '#c1121f', icon: 'fire' },
  { id: 'boil', name: 'BOIL', key: 'R', label: 'Panci', colour: '#2a9d8f', icon: 'pot' },
];

// A step is one station job: chop the ingredient, fry it, grill it or boil it.
// step.time is seconds of cooking at that station.
export const DISHES = [
  {
    id: 'nasi-goreng', name: 'NASI GORENG', price: 18000, colour: '#e9a319',
    desc: 'Fried rice, egg & crackers',
    steps: [
      { station: 'chop', ingredient: 'Bawang', time: 2.5 },
      { station: 'fry', ingredient: 'Nasi + Telur', time: 4.0 },
      { station: 'fry', ingredient: 'Kecap Manis', time: 2.0 },
    ],
  },
  {
    id: 'mie-goreng', name: 'MIE GORENG', price: 16000, colour: '#f2c14e',
    desc: 'Fried noodles & veg',
    steps: [
      { station: 'boil', ingredient: 'Mie', time: 3.0 },
      { station: 'chop', ingredient: 'Sayur', time: 2.5 },
      { station: 'fry', ingredient: 'Mie + Bumbu', time: 3.5 },
    ],
  },
  {
    id: 'sate-ayam', name: 'SATE AYAM', price: 22000, colour: '#d97b29',
    desc: 'Chicken satay & peanut sauce',
    steps: [
      { station: 'chop', ingredient: 'Ayam', time: 3.0 },
      { station: 'grill', ingredient: 'Sate', time: 5.0 },
      { station: 'boil', ingredient: 'Saus Kacang', time: 2.5 },
    ],
  },
  {
    id: 'ayam-geprek', name: 'AYAM GEPREK', price: 20000, colour: '#e4572e',
    desc: 'Smashed fried chicken, sambal',
    steps: [
      { station: 'fry', ingredient: 'Ayam', time: 4.5 },
      { station: 'chop', ingredient: 'Sambal', time: 2.5 },
      { station: 'fry', ingredient: 'Geprek!', time: 2.0 },
    ],
  },
  {
    id: 'gado-gado', name: 'GADO-GADO', price: 15000, colour: '#7fb069',
    desc: 'Veg salad & peanut sauce',
    steps: [
      { station: 'boil', ingredient: 'Sayur + Telur', time: 3.5 },
      { station: 'chop', ingredient: 'Lontong', time: 2.5 },
      { station: 'boil', ingredient: 'Saus Kacang', time: 2.0 },
    ],
  },
  {
    id: 'es-teh', name: 'ES TEH MANIS', price: 8000, colour: '#bc6c25',
    desc: 'Sweet iced tea — quick!',
    steps: [
      { station: 'boil', ingredient: 'Teh', time: 2.0 },
      { station: 'chop', ingredient: 'Es Batu', time: 1.5 },
    ],
  },
];

export const CUSTOMERS = [
  { name: 'Budi', colour: '#3a86ff', face: 'B' },
  { name: 'Siti', colour: '#ff5d8f', face: 'S' },
  { name: 'Agus', colour: '#06d6a0', face: 'A' },
  { name: 'Rina', colour: '#ff9f1c', face: 'R' },
  { name: 'Dewi', colour: '#9b5de5', face: 'D' },
  { name: 'Joko', colour: '#ef476f', face: 'J' },
  { name: 'Maya', colour: '#118ab2', face: 'M' },
  { name: 'Andi', colour: '#f15bb5', face: 'An' },
  { name: 'Putri', colour: '#00bbf9', face: 'P' },
  { name: 'Rudi', colour: '#f3722c', face: 'Ru' },
];

// Day targets: money to earn before the day timer ends, and how busy it gets.
export const DAY_PLANS = [
  { day: 1, target: 60000, duration: 150, spawnEvery: 9, patience: 45, maxOrders: 3 },
  { day: 2, target: 90000, duration: 150, spawnEvery: 7, patience: 40, maxOrders: 4 },
  { day: 3, target: 130000, duration: 150, spawnEvery: 6, patience: 36, maxOrders: 4 },
  { day: 4, target: 170000, duration: 150, spawnEvery: 5, patience: 32, maxOrders: 5 },
  { day: 5, target: 220000, duration: 150, spawnEvery: 4.5, patience: 30, maxOrders: 5 },
];

export const WALKOUT_LIMIT = 3; // customers lost in one day ends the game
export const TIP_RATE = 0.5; // up to +50% tip for serving with patience left

export function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

export function planForDay(day) {
  return DAY_PLANS[Math.min(day - 1, DAY_PLANS.length - 1)];
}

export function rupiah(n) {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}
