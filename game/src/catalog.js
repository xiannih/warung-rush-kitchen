// catalog.js — every fixed fact about Warung Kilat: the menu, the pantry,
// the regulars who queue at the counter, and how each day ramps up.
// Nothing here moves; kitchen.js owns all the changing state.
(function (global) {
  'use strict';

  // Four places to cook. The key is the fast way in; clicking the card works too.
  var STATIONS = [
    { id: 'chop',  key: 'q', keyLabel: 'Q', name: 'CHOP',  tool: 'Talenan',    hint: 'Potong & siapkan' },
    { id: 'fry',   key: 'w', keyLabel: 'W', name: 'FRY',   tool: 'Wajan',      hint: 'Goreng di wajan' },
    { id: 'grill', key: 'e', keyLabel: 'E', name: 'GRILL', tool: 'Panggangan', hint: 'Bakar di bara' },
    { id: 'boil',  key: 'r', keyLabel: 'R', name: 'BOIL',  tool: 'Panci',      hint: 'Rebus sampai matang' }
  ];

  // One step of a recipe: which station it needs, what the cook is doing,
  // and which pantry chip it lights up on the counter.
  function step(station, label, ingredient, seconds) {
    return { station: station, label: label, ingredient: ingredient, seconds: seconds || 1.3 };
  }

  // Six dishes, cheapest last on the menu board. Each dish has its own
  // plating art in draw.js, so no two plates ever look alike.
  var DISHES = [
    {
      id: 'esteh', name: 'ES TEH MANIS', price: 8000, colour: '#b5651d',
      desc: 'Sweet iced tea — quick!',
      steps: [
        step('boil', 'Teh diseduh', 'Teh', 1.0),
        step('chop', 'Es Batu', 'Es Batu', 1.0)
      ]
    },
    {
      id: 'gado', name: 'GADO-GADO', price: 15000, colour: '#7a9e3f',
      desc: 'Veg salad & peanut sauce',
      steps: [
        step('chop', 'Sayur dipotong', 'Sayur', 1.2),
        step('boil', 'Lontong direbus', 'Lontong', 1.4),
        step('fry', 'Saus Kacang', 'Saus Kacang', 1.3)
      ]
    },
    {
      id: 'mie', name: 'MIE GORENG', price: 16000, colour: '#c98a2e',
      desc: 'Fried noodles & veg',
      steps: [
        step('chop', 'Sayur dipotong', 'Sayur', 1.2),
        step('fry', 'Mie + Bumbu', 'Mie', 1.5),
        step('fry', 'Kecap Manis', 'Kecap', 1.2)
      ]
    },
    {
      id: 'nasi', name: 'NASI GORENG', price: 18000, colour: '#d99a26',
      desc: 'Fried rice, egg & crackers',
      steps: [
        step('chop', 'Bawang', 'Bawang', 1.1),
        step('fry', 'Nasi + Telur', 'Nasi', 1.5),
        step('fry', 'Kecap Manis', 'Kecap', 1.2)
      ]
    },
    {
      id: 'geprek', name: 'AYAM GEPREK', price: 20000, colour: '#c2502e',
      desc: 'Smashed fried chicken, sambal',
      steps: [
        step('fry', 'Ayam digoreng', 'Ayam', 1.5),
        step('chop', 'Sambal diulek', 'Sambal', 1.2),
        step('fry', 'Nasi hangat', 'Nasi', 1.2)
      ]
    },
    {
      id: 'sate', name: 'SATE AYAM', price: 22000, colour: '#a8541f',
      desc: 'Chicken satay & peanut sauce',
      steps: [
        step('chop', 'Bawang', 'Bawang', 1.1),
        step('grill', 'Ayam dipanggang', 'Ayam', 1.6),
        step('fry', 'Saus Kacang', 'Saus Kacang', 1.3)
      ]
    }
  ];

  // Everything sitting on the counter, in the order the chips are laid out:
  // two rows of six, so the last chip never runs off the edge.
  var PANTRY = [
    { name: 'Bawang',     colour: '#e8dcc0' },
    { name: 'Nasi',       colour: '#f2e6c8' },
    { name: 'Telur',      colour: '#f6c453' },
    { name: 'Mie',        colour: '#e0a83c' },
    { name: 'Ayam',       colour: '#d97b4f' },
    { name: 'Sayur',      colour: '#6fae4e' },
    { name: 'Sambal',     colour: '#c0392b' },
    { name: 'Kecap',      colour: '#5a3a1e' },
    { name: 'Es Batu',    colour: '#a8d8ea' },
    { name: 'Teh',        colour: '#b5651d' },
    { name: 'Lontong',    colour: '#efe3c2' },
    { name: 'Saus Kacang', colour: '#9c6b30' }
  ];

  // The regulars. Colour + initial is the whole face: it has to read at a glance.
  var CUSTOMERS = [
    { name: 'Budi',    colour: '#3b82f6', initial: 'B' },
    { name: 'Siti',    colour: '#ec4899', initial: 'S' },
    { name: 'Agus',    colour: '#10b981', initial: 'A' },
    { name: 'Rina',    colour: '#f97316', initial: 'R' },
    { name: 'Dewi',    colour: '#8b5cf6', initial: 'D' },
    { name: 'Joko',    colour: '#e11d48', initial: 'J' },
    { name: 'Maya',    colour: '#0891b2', initial: 'M' },
    { name: 'Putri',   colour: '#db2777', initial: 'P' },
    { name: 'Bambang', colour: '#65a30d', initial: 'B' },
    { name: 'Lestari', colour: '#7c3aed', initial: 'L' },
    { name: 'Andi',    colour: '#0ea5e9', initial: 'A' },
    { name: 'Sari',    colour: '#ea580c', initial: 'S' },
    { name: 'Fajar',   colour: '#ca8a04', initial: 'F' },
    { name: 'Nia',     colour: '#059669', initial: 'N' },
    { name: 'Eko',     colour: '#dc2626', initial: 'E' },
    { name: 'Wulan',   colour: '#9333ea', initial: 'W' }
  ];

  // Five days. The target climbs, the queue arrives faster, patience thins.
  var DAYS = [
    { day: 1, target: 50000,  seconds: 90,  spawnEvery: 9.0, patience: 48, label: 'Hari pertama — pelanggan mulai datang.' },
    { day: 2, target: 90000,  seconds: 95,  spawnEvery: 8.0, patience: 44, label: 'Warung mulai dikenal — antrean makin panjang.' },
    { day: 3, target: 130000, seconds: 100, spawnEvery: 7.0, patience: 40, label: 'Jam makan siang — semua meja penuh.' },
    { day: 4, target: 170000, seconds: 105, spawnEvery: 6.0, patience: 36, label: 'Rush hour sungguhan — jangan sampai ada yang pergi.' },
    { day: 5, target: 220000, seconds: 110, spawnEvery: 5.0, patience: 33, label: 'Hari terakhir — buktikan warung ini yang tercepat.' }
  ];

  var MAX_ORDERS = 4;
  var MAX_WALKOUTS = 3;

  function dishById(id) {
    for (var i = 0; i < DISHES.length; i++) if (DISHES[i].id === id) return DISHES[i];
    return DISHES[0];
  }
  function stationById(id) {
    for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].id === id) return STATIONS[i];
    return STATIONS[0];
  }
  function money(n) {
    return 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  global.WarungCatalog = {
    STATIONS: STATIONS, DISHES: DISHES, PANTRY: PANTRY,
    CUSTOMERS: CUSTOMERS, DAYS: DAYS,
    MAX_ORDERS: MAX_ORDERS, MAX_WALKOUTS: MAX_WALKOUTS,
    dishById: dishById, stationById: stationById, money: money
  };
})(typeof window !== 'undefined' ? window : globalThis);
