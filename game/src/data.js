/* Warung Kilat v5 — data: dishes, staff, stories, shop.
   All names, characters and lines are original to this game. */
'use strict';

var DISHES = [
  { id: 'nasgor', name: 'NASI GORENG', en: 'Fried rice, egg, crackers', price: 18000,
    steps: [
      { station: 'CHOP', label: 'Bawang', dur: 2.2 },
      { station: 'FRY', label: 'Nasi + Telur', dur: 3.0 },
      { station: 'FRY', label: 'Kecap', dur: 2.0 }
    ] },
  { id: 'migor', name: 'MIE GORENG', en: 'Fried noodles, veg, egg', price: 16000,
    steps: [
      { station: 'BOIL', label: 'Mie', dur: 2.5 },
      { station: 'FRY', label: 'Mie + Telur', dur: 3.0 },
      { station: 'CHOP', label: 'Sayur', dur: 2.0 }
    ] },
  { id: 'sate', name: 'SATE AYAM', en: 'Chicken satay, peanut sauce', price: 22000,
    steps: [
      { station: 'CHOP', label: 'Ayam', dur: 2.5 },
      { station: 'GRILL', label: 'Sate', dur: 3.5 },
      { station: 'CHOP', label: 'Lontong', dur: 2.0 }
    ] },
  { id: 'geprek', name: 'AYAM GEPREK', en: 'Smashed chicken, sambal', price: 20000,
    steps: [
      { station: 'FRY', label: 'Ayam', dur: 3.0 },
      { station: 'CHOP', label: 'Sambal', dur: 2.0 },
      { station: 'FRY', label: 'Geprek', dur: 2.5 }
    ] },
  { id: 'gado', name: 'GADO-GADO', en: 'Veg salad, peanut sauce', price: 15000,
    steps: [
      { station: 'BOIL', label: 'Sayur', dur: 2.5 },
      { station: 'CHOP', label: 'Sayur', dur: 2.0 },
      { station: 'CHOP', label: 'Kacang', dur: 2.0 }
    ] },
  { id: 'esteh', name: 'ES TEH MANIS', en: 'Sweet iced tea — quick!', price: 8000,
    steps: [
      { station: 'BOIL', label: 'Teh', dur: 2.0 },
      { station: 'CHOP', label: 'Es Batu', dur: 1.5 }
    ] }
];

var STATIONS = [
  { id: 'CHOP', key: 'Q', name: 'Talenan', icon: '🔪' },
  { id: 'FRY', key: 'W', name: 'Wajan', icon: '🍳' },
  { id: 'GRILL', key: 'E', name: 'Panggangan', icon: '🔥' },
  { id: 'BOIL', key: 'R', name: 'Panci', icon: '🍲' }
];

var PANTRY = ['Bawang', 'Nasi', 'Telur', 'Mie', 'Ayam', 'Sayur',
              'Sambal', 'Kecap', 'Es Batu', 'Teh', 'Lontong', 'Saus Kacang'];

var CUSTOMER_NAMES = [
  { name: 'Budi', face: '🧑', regular: true },
  { name: 'Siti', face: '👩', regular: true },
  { name: 'Agus', face: '👨', regular: true },
  { name: 'Rina', face: '👧', regular: false },
  { name: 'Dewi', face: '👩‍🦰', regular: false },
  { name: 'Joko', face: '🧔', regular: false },
  { name: 'Maya', face: '👩‍🦱', regular: false },
  { name: 'Putri', face: '👱‍♀️', regular: false },
  { name: 'Andi', face: '👦', regular: false },
  { name: 'Lestari', face: '👵', regular: true }
];

/* --- Staff: the subject of v5. Each one is a person with a dream. --- */
var STAFF_DEFS = [
  { id: 'joko', name: 'Joko', role: 'Koki', icon: '👨‍🍳',
    hireCost: 120000, baseWage: 40000,
    effect: 'Langkah 20% lebih cepat / level',
    dream: 'Punya warung sendiri',
    backstory: 'Joko merantau dari desa. Mimpinya: buka warung sendiri suatu hari.',
    story: [
      'Joko: Suatu hari aku mau punya warung sendiri.',
      'Joko menabung tiap gajian untuk gerobak pertamanya.',
      'Joko: Pakde, gerobakku sudah setengah jalan!'
    ] },
  { id: 'sari', name: 'Sari', role: 'Pelayan', icon: '👩‍💼',
    hireCost: 120000, baseWage: 35000,
    effect: 'Pelanggan 25% lebih sabar / level',
    dream: 'Sekolah adik lulus',
    backstory: 'Sari menabung untuk biaya sekolah adiknya di kampung.',
    story: [
      'Sari: Gajiku untuk sekolah adikku.',
      'Sari: Adikku sudah naik kelas, berkat warung ini.',
      'Sari: Tahun depan aku ikut ujian paket C!'
    ] },
  { id: 'dewi', name: 'Dewi', role: 'Kasir', icon: '👩‍💻',
    hireCost: 100000, baseWage: 30000,
    effect: 'Tip 20% lebih besar / level',
    dream: 'Bantu keluarga',
    backstory: 'Dewi menopang keluarga di kampung dengan kirimannya.',
    story: [
      'Dewi: Kirimanku sampai ke kampung tiap minggu.',
      'Dewi: Ibu sudah bisa perbaiki atap rumah.',
      'Dewi: Keluarga datang makan di sini bulan depan!'
    ] }
];

var SHOP_ITEMS = [
  { id: 'stove', name: 'Kompor Cepat', icon: '🔥', cost: 200000,
    desc: 'Semua langkah masak 15% lebih cepat.' },
  { id: 'table', name: 'Meja Baru', icon: '🪑', cost: 250000,
    desc: 'Satu meja lagi di ruang makan.' },
  { id: 'fridge', name: 'Kulkas Besar', icon: '🧊', cost: 180000,
    desc: 'Bahan segar: pelanggan 15% lebih sabar.' },
  { id: 'wok', name: 'Wajan Besar', icon: '🍳', cost: 160000,
    desc: 'Porsi besar: harga sajian +10%.' }
];

/* Story beats between days: the warung grows from a cart to a famous house. */
var DAY_STORIES = {
  1: { who: 'Pakde Slamet', line: 'Gerobak kecil, mimpi besar. Ayo buka warung!' },
  2: { who: 'Bu Ratna', line: 'Pelanggan tetap mulai datang. Jangan kecewakan mereka.' },
  3: { who: 'Pakde Slamet', line: 'Meja baru datang! Warung kita makin ramai.' },
  4: { who: 'Bu Ratna', line: 'Tetangga sebelah mulai melirik. Terus masak enak!' },
  5: { who: 'Bang Jono', line: 'Warungku lebih besar! Kita lihat siapa yang bertahan.' },
  6: { who: 'Raka si Kritikus', line: 'Aku dengar warung ini enak. Buktikan hari ini!' },
  7: { who: 'Pakde Slamet', line: 'Kritikus itu pulang senang. Nama kita menyebar!' },
  8: { who: 'Bu Ratna', line: 'Rombongan besar datang hari ini. Siap-siap!' },
  9: { who: 'Pakde Slamet', line: 'Satu langkah lagi: warung paling ramai di kota.' },
  10: { who: 'Pakde Slamet', line: 'Hari ini penentuan. Buktikan warung kita yang terbaik!' }
};

var DAY_LENGTH = 100; /* seconds per day */

function dayTarget(day) {
  if (day <= 10) return 60000 + 15000 * (day - 1);
  return 210000 + 25000 * (day - 10);
}
function dayPatience(day) { return Math.max(28, 52 - day * 2); }
function spawnInterval(day) { return Math.max(6, 13 - day); }
function rupiah(n) {
  return 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
