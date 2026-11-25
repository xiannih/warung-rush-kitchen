'use strict';
/* Dish catalogue for Warung Kilat. Short labels only, so no card ever wraps. */
window.WARUNG_DISHES = [
  {
    id: 'nasi', name: 'NASI GORENG', desc: 'Fried rice, egg, crackers', price: 18000,
    steps: [
      { station: 'CHOP', label: 'Bawang' },
      { station: 'FRY', label: 'Nasi + Telur' },
      { station: 'FRY', label: 'Kecap' }
    ],
    icon: '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="62" rx="34" ry="20" fill="#f2a93b"/><ellipse cx="50" cy="58" rx="26" ry="14" fill="#f7c948"/><circle cx="50" cy="46" r="13" fill="#fff8e7"/><circle cx="50" cy="46" r="7" fill="#f2a93b"/><rect x="66" y="66" width="14" height="8" rx="2" fill="#7fb069"/><rect x="20" y="70" width="12" height="7" rx="2" fill="#7fb069"/></svg>'
  },
  {
    id: 'mie', name: 'MIE GORENG', desc: 'Fried noodles, veg, egg', price: 16000,
    steps: [
      { station: 'BOIL', label: 'Mie' },
      { station: 'CHOP', label: 'Sayur' },
      { station: 'FRY', label: 'Mie + Bumbu' }
    ],
    icon: '<svg viewBox="0 0 100 100"><path d="M22 62 q8 -12 16 0 t16 0 t16 0" fill="none" stroke="#e08a2e" stroke-width="6" stroke-linecap="round"/><path d="M22 72 q8 -12 16 0 t16 0 t16 0" fill="none" stroke="#c96f1e" stroke-width="6" stroke-linecap="round"/><path d="M28 48 q8 -10 16 0 t16 0" fill="none" stroke="#f2a93b" stroke-width="6" stroke-linecap="round"/><circle cx="68" cy="38" r="9" fill="#fff8e7"/><circle cx="68" cy="38" r="5" fill="#f2a93b"/><circle cx="30" cy="40" r="5" fill="#7fb069"/></svg>'
  },
  {
    id: 'sate', name: 'SATE AYAM', desc: 'Chicken satay, peanut sauce', price: 22000,
    steps: [
      { station: 'CHOP', label: 'Ayam' },
      { station: 'GRILL', label: 'Sate' },
      { station: 'CHOP', label: 'Lontong' }
    ],
    icon: '<svg viewBox="0 0 100 100"><line x1="28" y1="82" x2="72" y2="30" stroke="#8a5a2b" stroke-width="3"/><line x1="40" y1="86" x2="80" y2="38" stroke="#8a5a2b" stroke-width="3"/><rect x="52" y="30" width="13" height="13" rx="3" fill="#a0522d" transform="rotate(45 58 36)"/><rect x="42" y="44" width="13" height="13" rx="3" fill="#8b4513" transform="rotate(45 48 50)"/><rect x="58" y="50" width="13" height="13" rx="3" fill="#a0522d" transform="rotate(45 64 56)"/><rect x="22" y="70" width="18" height="12" rx="3" fill="#fff8e7" stroke="#c89b3c" stroke-width="2"/></svg>'
  },
  {
    id: 'geprek', name: 'AYAM GEPREK', desc: 'Smashed chicken, sambal', price: 20000,
    steps: [
      { station: 'FRY', label: 'Ayam' },
      { station: 'CHOP', label: 'Sambal' },
      { station: 'FRY', label: 'Geprek' }
    ],
    icon: '<svg viewBox="0 0 100 100"><ellipse cx="46" cy="58" rx="26" ry="20" fill="#fff8e7"/><circle cx="58" cy="52" r="15" fill="#b5651d"/><circle cx="58" cy="52" r="9" fill="#8b4513"/><rect x="70" y="40" width="16" height="6" rx="3" fill="#fff8e7" transform="rotate(-30 78 43)"/><circle cx="34" cy="66" r="9" fill="#d62828"/><circle cx="30" cy="62" r="3" fill="#ff6b6b"/></svg>'
  },
  {
    id: 'gado', name: 'GADO-GADO', desc: 'Veg salad, peanut sauce', price: 15000,
    steps: [
      { station: 'BOIL', label: 'Sayur' },
      { station: 'CHOP', label: 'Lontong' },
      { station: 'FRY', label: 'Saus' }
    ],
    icon: '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="60" rx="32" ry="20" fill="#f7e8c9"/><circle cx="38" cy="54" r="10" fill="#7fb069"/><circle cx="58" cy="58" r="10" fill="#5a9e4b"/><circle cx="48" cy="70" r="8" fill="#e8873a"/><circle cx="64" cy="44" r="6" fill="#f2a93b"/><path d="M26 62 q24 12 48 0" fill="none" stroke="#a0522d" stroke-width="5" stroke-linecap="round"/></svg>'
  },
  {
    id: 'esteh', name: 'ES TEH MANIS', desc: 'Sweet iced tea — quick!', price: 8000,
    steps: [
      { station: 'BOIL', label: 'Teh' },
      { station: 'CHOP', label: 'Es Batu' }
    ],
    icon: '<svg viewBox="0 0 100 100"><rect x="34" y="24" width="32" height="56" rx="6" fill="#c97b2d"/><rect x="34" y="24" width="32" height="56" rx="6" fill="none" stroke="#8a5a2b" stroke-width="3"/><rect x="42" y="38" width="11" height="11" fill="#a8d8ea"/><rect x="54" y="50" width="11" height="11" fill="#a8d8ea"/><line x1="62" y1="12" x2="54" y2="40" stroke="#d62828" stroke-width="5" stroke-linecap="round"/></svg>'
  }
];

window.WARUNG_INGREDIENTS = [
  { name: 'Bawang', color: '#e8dcc0' },
  { name: 'Nasi', color: '#fff8e7' },
  { name: 'Telur', color: '#f2c14e' },
  { name: 'Mie', color: '#e08a2e' },
  { name: 'Ayam', color: '#c96f4a' },
  { name: 'Sayur', color: '#7fb069' },
  { name: 'Sambal', color: '#d62828' },
  { name: 'Kecap', color: '#5b3a1e' },
  { name: 'Es Batu', color: '#a8d8ea' },
  { name: 'Teh', color: '#a0522d' },
  { name: 'Lontong', color: '#fff8e7' },
  { name: 'Saus Kacang', color: '#8b5a2b' }
];

window.WARUNG_CUSTOMERS = [
  { name: 'Budi', color: '#2563eb' }, { name: 'Siti', color: '#db2777' },
  { name: 'Agus', color: '#059669' }, { name: 'Rina', color: '#ea580c' },
  { name: 'Dewi', color: '#7c3aed' }, { name: 'Joko', color: '#dc2626' },
  { name: 'Maya', color: '#0891b2' }, { name: 'Putri', color: '#be185d' },
  { name: 'Andi', color: '#65a30d' }, { name: 'Lina', color: '#d97706' }
];
