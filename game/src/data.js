// Warung Kilat data: dishes, people, staff, shop and the story arc.
// Every name, dish and character here is original to this game.

export const DISHES = {
  nasgor: {
    name: 'NASI GORENG', price: 18000, sub: 'Fried rice, egg, crackers',
    steps: [
      { station: 'CHOP', label: 'Bawang', dur: 2.2 },
      { station: 'FRY', label: 'Nasi + Telur', dur: 3.4 },
      { station: 'FRY', label: 'Kecap', dur: 2.0 },
    ],
    ingredients: ['Bawang', 'Nasi', 'Telur', 'Kecap'],
  },
  esteh: {
    name: 'ES TEH MANIS', price: 8000, sub: 'Sweet iced tea — quick!',
    steps: [
      { station: 'BOIL', label: 'Teh', dur: 2.0 },
      { station: 'CHOP', label: 'Es Batu', dur: 1.4 },
    ],
    ingredients: ['Teh', 'Es Batu'],
  },
  mie: {
    name: 'MIE GORENG', price: 16000, sub: 'Fried noodles, veg, egg',
    steps: [
      { station: 'BOIL', label: 'Mie', dur: 2.6 },
      { station: 'CHOP', label: 'Sayur', dur: 1.8 },
      { station: 'FRY', label: 'Mie + Telur', dur: 3.0 },
    ],
    ingredients: ['Mie', 'Sayur', 'Telur', 'Kecap'],
  },
  sate: {
    name: 'SATE AYAM', price: 22000, sub: 'Chicken satay, peanut sauce',
    steps: [
      { station: 'CHOP', label: 'Ayam', dur: 2.4 },
      { station: 'GRILL', label: 'Sate', dur: 3.6 },
      { station: 'CHOP', label: 'Saus Kacang', dur: 2.0 },
    ],
    ingredients: ['Ayam', 'Lontong', 'Saus Kacang'],
  },
  geprek: {
    name: 'AYAM GEPREK', price: 20000, sub: 'Smashed chicken, sambal',
    steps: [
      { station: 'FRY', label: 'Ayam', dur: 3.2 },
      { station: 'CHOP', label: 'Sambal', dur: 2.0 },
      { station: 'FRY', label: 'Geprek', dur: 2.2 },
    ],
    ingredients: ['Ayam', 'Sambal', 'Nasi'],
  },
  gado: {
    name: 'GADO-GADO', price: 15000, sub: 'Veg salad, peanut sauce',
    steps: [
      { station: 'BOIL', label: 'Sayur', dur: 2.4 },
      { station: 'CHOP', label: 'Lontong', dur: 1.8 },
      { station: 'CHOP', label: 'Saus Kacang', dur: 2.0 },
    ],
    ingredients: ['Sayur', 'Lontong', 'Saus Kacang'],
  },
};

export const STATIONS = [
  { key: 'CHOP', name: 'CHOP', role: 'Talenan', icon: '🔪', code: 'Q' },
  { key: 'FRY', name: 'FRY', role: 'Wajan', icon: '🍳', code: 'W' },
  { key: 'GRILL', name: 'GRILL', role: 'Panggangan', icon: '🔥', code: 'E' },
  { key: 'BOIL', name: 'BOIL', role: 'Panci', icon: '🍲', code: 'R' },
];

export const PANTRY = [
  'Bawang', 'Nasi', 'Telur', 'Mie', 'Ayam', 'Sayur',
  'Sambal', 'Kecap', 'Es Batu', 'Teh', 'Lontong', 'Saus Kacang',
];

export const CUSTOMERS = [
  { name: 'Budi', color: '#3498db', face: '🧑' },
  { name: 'Siti', color: '#e84393', face: '👩' },
  { name: 'Agus', color: '#27ae60', face: '🧑‍🦱' },
  { name: 'Rina', color: '#e67e22', face: '👩‍🦰' },
  { name: 'Dewi', color: '#8e44ad', face: '👩‍🦱' },
  { name: 'Joko', color: '#16a085', face: '🧑‍🦳' },
  { name: 'Maya', color: '#2980b9', face: '👩‍🦳' },
  { name: 'Raka', color: '#c0392b', face: '🧑‍💼', vip: true },
  { name: 'Ratna', color: '#d35400', face: '👵' },
  { name: 'Jono', color: '#7f8c8d', face: '🧔' },
  { name: 'Lina', color: '#2e86c1', face: '👧' },
  { name: 'Dedi', color: '#a04000', face: '👦' },
];

export const REGULARS = ['Ratna', 'Budi', 'Siti'];

// Day configs: 10 story days, then endless mode.
export const LEVELS = [
  { day: 1, target: 60000, seconds: 150, spawn: 11, patience: 52, dishes: ['nasgor', 'esteh'], tables: 3 },
  { day: 2, target: 75000, seconds: 150, spawn: 10, patience: 50, dishes: ['nasgor', 'esteh', 'mie'], tables: 3 },
  { day: 3, target: 90000, seconds: 145, spawn: 9, patience: 48, dishes: ['nasgor', 'esteh', 'mie'], tables: 4 },
  { day: 4, target: 105000, seconds: 145, spawn: 9, patience: 46, dishes: ['nasgor', 'esteh', 'mie', 'sate'], tables: 4 },
  { day: 5, target: 120000, seconds: 140, spawn: 8, patience: 44, dishes: ['nasgor', 'esteh', 'mie', 'sate'], tables: 4 },
  { day: 6, target: 135000, seconds: 140, spawn: 8, patience: 44, dishes: ['nasgor', 'esteh', 'mie', 'sate'], tables: 5, vip: true },
  { day: 7, target: 150000, seconds: 135, spawn: 8, patience: 42, dishes: ['nasgor', 'esteh', 'mie', 'sate', 'geprek'], tables: 5 },
  { day: 8, target: 165000, seconds: 135, spawn: 7, patience: 40, dishes: ['nasgor', 'esteh', 'mie', 'sate', 'geprek', 'gado'], tables: 5 },
  { day: 9, target: 180000, seconds: 130, spawn: 7, patience: 38, dishes: ['nasgor', 'esteh', 'mie', 'sate', 'geprek', 'gado'], tables: 6 },
  { day: 10, target: 200000, seconds: 130, spawn: 6, patience: 38, dishes: ['nasgor', 'esteh', 'mie', 'sate', 'geprek', 'gado'], tables: 6 },
];

export function levelFor(day) {
  if (day <= 10) return LEVELS[day - 1];
  const base = LEVELS[9];
  const extra = day - 10;
  return {
    day,
    target: base.target + extra * 25000,
    seconds: Math.max(110, base.seconds - extra * 2),
    spawn: Math.max(4, base.spawn - Math.floor(extra / 2)),
    patience: Math.max(30, base.patience - extra),
    dishes: base.dishes,
    tables: 6,
    endless: true,
  };
}

export const STAFF_TYPES = {
  cook: {
    id: 'cook', name: 'Joko si Koki', face: '👨‍🍳', hire: 150000, wage: 40000, upgrade: 120000,
    desc: 'Memasak 20% lebih cepat tiap level. Berdiri di dapur.',
    effect: (lvl) => `Langkah ${Math.round(20 * lvl)}% lebih cepat`,
  },
  waiter: {
    id: 'waiter', name: 'Sari si Pelayan', face: '💁‍♀️', hire: 120000, wage: 35000, upgrade: 100000,
    desc: 'Pelanggan 25% lebih sabar tiap level. Mengantar piring ke meja.',
    effect: (lvl) => `Kesabaran +${25 * lvl}%`,
  },
  cashier: {
    id: 'cashier', name: 'Dewi si Kasir', face: '🧑‍💼', hire: 100000, wage: 30000, upgrade: 90000,
    desc: 'Tip 20% lebih besar tiap level. Menjaga kasir tetap ramai.',
    effect: (lvl) => `Tip +${20 * lvl}%`,
  },
};

export const SHOP_ITEMS = {
  stove: {
    id: 'stove', name: 'Kompor Cepat', icon: '🔥', cost: 200000, max: 3,
    desc: 'Semua langkah masak 15% lebih cepat.',
  },
  table: {
    id: 'table', name: 'Meja Baru', icon: '🪑', cost: 250000, max: 3,
    desc: 'Satu meja lagi di ruang makan.',
  },
  fridge: {
    id: 'fridge', name: 'Kulkas Besar', icon: '🧊', cost: 180000, max: 3,
    desc: 'Bahan segar: pelanggan 15% lebih sabar.',
  },
  wok: {
    id: 'wok', name: 'Wajan Besar', icon: '🍳', cost: 160000, max: 3,
    desc: 'Porsi besar: harga sajian +10%.',
  },
};

export const STORY = {
  1: { who: 'Pakde Slamet • Pemilik Warung', face: '🧑‍🍳', head: 'Hari 1 — Gerobak Pertama',
    l1: '“Gerobak ini warisan bapakku. Hari ini kita buka pertama kali — cuma ada nasi goreng dan es teh.”',
    l2: '“Masak yang cepat, senyum yang lebar. Pelanggan pertama jangan sampai pergi!”',
    hint: 'Baru dibuka: 2 hidangan, 3 meja.' },
  2: { who: 'Bu Ratna • Pelanggan Tetap', face: '👵', head: 'Hari 2 — Pelanggan Tetap',
    l1: '“Nasi gorengmu kemarin enak, Nak. Aku bawa teman-teman arisan ke sini besok.”',
    l2: '“Kalau ramai begini, kamu butuh karyawan. Coba rekrut satu orang di akhir hari.”',
    hint: 'Menu baru: Mie Goreng. Rekrut staf mulai dibuka.' },
  3: { who: 'Pakde Slamet • Pemilik Warung', face: '🧑‍🍳', head: 'Hari 3 — Meja Keempat',
    l1: '“Antrean sampai ke trotoar! Aku pasang satu meja lagi di sudut.”',
    l2: '“Ingat: pelanggan yang duduk cepat, pulang senang — dan kembali lagi.”',
    hint: 'Meja baru: sekarang 4 meja.' },
  4: { who: 'Siti • Pelanggan', face: '👩', head: 'Hari 4 — Sate Masuk Menu',
    l1: '“Katanya sate ayam di sini wanginya sampai ujung gang. Aku pesan tiga tusuk ya!”',
    l2: '“Panggangan sudah kupanaskan sejak subuh. Sate butuh waktu — atur langkahmu.”',
    hint: 'Menu baru: Sate Ayam (panggang).' },
  5: { who: 'Bang Jono • Warung Sebelah', face: '🧔', head: 'Hari 5 — Saingan Datang',
    l1: '“Warungmu ramai, Slamet. Tapi warungku buka promo besar-besaran minggu ini.”',
    l2: '“Jangan gentar. Beli kompor baru di toko — masak lebih cepat dari dia!”',
    hint: 'Toko upgrade dibuka: kompor, meja, kulkas, wajan.' },
  6: { who: 'Raka • Kritikus Kuliner', face: '🧑‍💼', head: 'Hari 6 — Kritikus Datang!',
    l1: '“Saya Raka, kritikus kuliner. Hari ini saya makan di sini — dan saya menulis semuanya.”',
    l2: '“Satu piring sempurna darimu bisa membuat warung ini terkenal se-kota. Jangan kecewakan saya.”',
    hint: 'EVENT: Raka si kritikus datang hari ini. Sajikan dia dengan sempurna!' },
  7: { who: 'Bu Ratna • Pelanggan Tetap', face: '👵', head: 'Hari 7 — Ayam Geprek',
    l1: '“Cucuku minta ayam geprek yang pedasnya nampol. Kamu bisa, kan?”',
    l2: '“Antrean makin panjang. Satu karyawan lagi akan sangat membantu.”',
    hint: 'Menu baru: Ayam Geprek. Slot staf bertambah.' },
  8: { who: 'Pakde Slamet • Pemilik Warung', face: '🧑‍🍳', head: 'Hari 8 — Rombongan Besar',
    l1: '“Ada rombongan wisatawan mau mampir siang ini — sepuluh orang sekaligus!”',
    l2: '“Siapkan semua meja. Hari ini kita diuji: cepat, rapi, dan tetap ramah.”',
    hint: 'EVENT: rombongan besar datang tengah hari. Menu baru: Gado-Gado.' },
  9: { who: 'Raka • Kritikus Kuliner', face: '🧑‍💼', head: 'Hari 9 — Ulasan Terbit',
    l1: '“Ulasanku terbit pagi ini: WARUNG KILAT, bintang lima! Pembaca mulai berdatangan.”',
    l2: '“Jaga kualitasnya, Slamet. Ketenaran itu gampang datang, susah dijaga.”',
    hint: 'Meja keenam dipasang. Pelanggan datang lebih cepat.' },
  10: { who: 'Pakde Slamet • Pemilik Warung', face: '🧑‍🍳', head: 'Hari 10 — Warung Legendaris',
    l1: '“Sepuluh hari lalu kita cuma gerobak. Hari ini, antrean mengular sampai tikungan.”',
    l2: '“Apapun yang terjadi hari ini — kita sudah menang. Sekarang, buktikan kita bisa bertahan selamanya.”',
    hint: 'Hari terakhir cerita. Setelah ini: MODE TANPA BATAS.' },
  endless: { who: 'Pakde Slamet • Pemilik Warung', face: '🧑‍🍳', head: 'Mode Tanpa Batas',
    l1: '“Tidak ada hari terakhir untuk warung yang dicintai orang. Kita masak terus!”',
    l2: '“Setiap hari makin ramai, makin cepat, makin besar targetnya. Sampai kapan kamu bertahan?”',
    hint: 'Target naik tiap hari. Pelanggan makin tidak sabar. Teruslah masak!' },
};
