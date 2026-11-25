// Warung Kilat v4 — Rush Hour Kitchen.
// Original Indonesian warung game: cook orders, seat real customers,
// hire staff, buy upgrades, and grow a street stall into a famous restaurant
// across 10 story days and then endless mode. Keyboard and mouse, offline.

import { DISHES, STATIONS, PANTRY, CUSTOMERS, REGULARS, levelFor, STAFF_TYPES, SHOP_ITEMS, STORY } from './data.js';
import { sfx, setMuted, isMuted } from './audio.js';

const $ = (sel) => document.querySelector(sel);
const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
const fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];

// ---------------------------------------------------------------- dish art
export function dishArt(id, size) {
  const s = size || 72;
  const plates = {
    nasgor: `<ellipse cx="36" cy="46" rx="30" ry="14" fill="#f7dc6f"/><ellipse cx="36" cy="40" rx="22" ry="12" fill="#f5b041"/><circle cx="36" cy="34" r="8" fill="#fdebd0"/><circle cx="36" cy="34" r="4" fill="#f39c12"/><rect x="18" y="30" width="7" height="4" rx="2" fill="#27ae60"/><rect x="50" y="44" width="7" height="4" rx="2" fill="#27ae60"/>`,
    esteh: `<rect x="24" y="14" width="24" height="44" rx="4" fill="#b9770e"/><rect x="27" y="20" width="18" height="30" rx="3" fill="#d4a017"/><rect x="30" y="26" width="7" height="7" fill="#aed6f1"/><rect x="38" y="36" width="7" height="7" fill="#aed6f1"/><line x1="44" y1="16" x2="50" y2="4" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/>`,
    mie: `<ellipse cx="36" cy="46" rx="30" ry="14" fill="#f7dc6f"/><path d="M16 38 q6 -8 12 0 t12 0 t12 0" stroke="#d35400" stroke-width="4" fill="none"/><path d="M18 46 q6 -8 12 0 t12 0 t12 0" stroke="#e67e22" stroke-width="4" fill="none"/><circle cx="52" cy="32" r="4" fill="#27ae60"/><circle cx="24" cy="32" r="4" fill="#f39c12"/>`,
    sate: `<line x1="18" y1="56" x2="52" y2="18" stroke="#8d6e63" stroke-width="3"/><line x1="26" y1="60" x2="58" y2="24" stroke="#8d6e63" stroke-width="3"/><rect x="30" y="30" width="11" height="11" rx="2" fill="#7b3f00" transform="rotate(45 35 35)"/><rect x="40" y="22" width="11" height="11" rx="2" fill="#7b3f00" transform="rotate(45 45 27)"/><rect x="20" y="44" width="11" height="11" rx="2" fill="#7b3f00" transform="rotate(45 25 49)"/><rect x="52" y="48" width="12" height="8" rx="2" fill="#fdf2e9"/>`,
    geprek: `<ellipse cx="36" cy="46" rx="30" ry="14" fill="#f7dc6f"/><ellipse cx="36" cy="40" rx="18" ry="11" fill="#a65c2e"/><circle cx="30" cy="36" r="4" fill="#c0392b"/><circle cx="42" cy="38" r="4" fill="#c0392b"/><circle cx="36" cy="32" r="3" fill="#e74c3c"/><rect x="50" y="44" width="9" height="5" rx="2" fill="#27ae60"/>`,
    gado: `<ellipse cx="36" cy="46" rx="30" ry="14" fill="#f7dc6f"/><circle cx="28" cy="38" r="7" fill="#27ae60"/><circle cx="42" cy="36" r="7" fill="#229954"/><circle cx="36" cy="44" r="6" fill="#58d68d"/><circle cx="48" cy="44" r="4" fill="#e67e22"/><circle cx="24" cy="46" r="4" fill="#e67e22"/><rect x="30" y="26" width="6" height="6" rx="2" fill="#f39c12"/>`,
  };
  return `<svg viewBox="0 0 72 72" width="${s}" height="${s}"><circle cx="36" cy="36" r="34" fill="#fffdf6" stroke="#c89b5a" stroke-width="2"/>${plates[id] || plates.nasgor}</svg>`;
}

// ---------------------------------------------------------------- state
const state = {
  screen: 'title',
  day: 1,
  endless: false,
  bank: 60000,
  score: 0,
  combo: 0,
  bestCombo: 0,
  servedTotal: 0,
  walkoutsTotal: 0,
  staff: {},          // cook/waiter/cashier -> level
  shop: { stove: 0, table: 0, fridge: 0, wok: 0 },
  dayMoney: 0,
  dayFood: 0,
  dayTips: 0,
  dayServed: 0,
  dayWalkouts: 0,
  dayDishes: {},
  timeLeft: 0,
  timer: null,
  lastTick: 0,
  paused: false,
  orders: [null, null, null, null],
  selected: -1,
  stationWork: {},    // station key -> { order, step, done, dur }
  spawnIn: 6,
  groupDone: false,
  vipSpawned: false,
  rushAnnounced: false,
  customerIdx: 0,
  muted: false,
};

function level() { return levelFor(state.day); }
function tableCount() { return level().tables + state.shop.table; }
function cookLvl() { return state.staff.cook || 0; }
function waiterLvl() { return state.staff.waiter || 0; }
function cashierLvl() { return state.staff.cashier || 0; }

function stepDuration(step) {
  const cookF = 1 - 0.2 * cookLvl();
  const stoveF = Math.pow(0.85, state.shop.stove);
  return Math.max(0.8, step.dur * cookF * stoveF);
}
function patienceMax() {
  const w = 1 + 0.25 * waiterLvl();
  const f = Math.pow(1.15, state.shop.fridge);
  return level().patience * w * f;
}
function dishPrice(dishId) {
  return DISHES[dishId].price * (1 + 0.1 * state.shop.wok);
}

// ---------------------------------------------------------------- screens
const SCREENS = ['title', 'howto', 'story', 'play', 'daydone', 'over'];
function showScreen(name) {
  state.screen = name;
  for (const s of SCREENS) {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.toggle('active', s === name);
  }
}

// ---------------------------------------------------------------- floating feedback
function floatAt(anchorEl, text, cls) {
  const layer = $('#float-layer');
  if (!layer) return;
  const app = $('#app').getBoundingClientRect();
  const r = anchorEl ? anchorEl.getBoundingClientRect() : { left: app.left + 600, top: app.top + 300, width: 0, height: 0 };
  const bit = document.createElement('div');
  bit.className = 'float-bit' + (cls ? ' ' + cls : '');
  bit.textContent = text;
  bit.style.left = (r.left - app.left + r.width / 2 - 30) + 'px';
  bit.style.top = (r.top - app.top - 6) + 'px';
  layer.appendChild(bit);
  setTimeout(() => bit.remove(), 1500);
}

// ---------------------------------------------------------------- story flow
function showStory(key) {
  const beat = STORY[key] || STORY.endless;
  $('#story-face').textContent = beat.face;
  $('#story-who').textContent = beat.who;
  $('#story-head').textContent = beat.head;
  $('#story-line1').textContent = beat.l1;
  $('#story-line2').textContent = beat.l2;
  $('#story-hint').textContent = '➤ ' + beat.hint;
  showScreen('story');
  sfx('click');
}

function startGame() {
  state.day = 1;
  state.endless = false;
  state.bank = 60000;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.servedTotal = 0;
  state.walkoutsTotal = 0;
  state.dayMoney = 0;
  state.dayFood = 0;
  state.dayTips = 0;
  state.dayServed = 0;
  state.dayWalkouts = 0;
  state.dayDishes = {};
  state.staff = {};
  state.shop = { stove: 0, table: 0, fridge: 0, wok: 0 };
  showStory(1);
}

function payWages() {
  let wage = 0;
  for (const id of Object.keys(state.staff)) wage += STAFF_TYPES[id].wage * state.staff[id];
  if (wage === 0) return '';
  if (state.bank >= wage) {
    state.bank -= wage;
    return 'Gaji staf hari ini: ' + rp(wage) + ' sudah dibayar.';
  }
  const fired = Object.keys(state.staff).sort((a, b) => STAFF_TYPES[b].wage - STAFF_TYPES[a].wage)[0];
  delete state.staff[fired];
  return STAFF_TYPES[fired].name + ' keluar karena gaji tidak terbayar.';
}

function beginDay(day) {
  state.day = day;
  const lv = level();
  state.endless = day > 10;
  state.dayMoney = 0;
  state.dayFood = 0;
  state.dayTips = 0;
  state.dayServed = 0;
  state.dayWalkouts = 0;
  state.dayDishes = {};
  state.timeLeft = lv.seconds;
  state.orders = [null, null, null, null];
  state.selected = -1;
  state.stationWork = {};
  state.spawnIn = 4;
  state.groupDone = false;
  state.vipSpawned = false;
  state.rushAnnounced = false;
  state.paused = false;
  const wageNote = payWages();
  buildPlay();
  showScreen('play');
  spawnOrder(true);
  spawnOrder(true);
  if (lv.vip) {
    setTimeout(() => { if (state.screen === 'play') showBanner('⭐ KRITIKUS RAKA DATANG! Sajikan dia dengan sempurna!'); sfx('vip'); }, 800);
  }
  if (wageNote) setTimeout(() => showBanner(wageNote), 1600);
  state.lastTick = Date.now();
  clearInterval(state.timer);
  state.timer = setInterval(tick, 100);
}

function showBanner(text) {
  const b = $('#event-banner');
  if (!b) return;
  b.textContent = text;
  b.classList.remove('hidden');
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => b.classList.add('hidden'), 4200);
}

// ---------------------------------------------------------------- orders & customers
function nextCustomer() {
  const c = CUSTOMERS[state.customerIdx % CUSTOMERS.length];
  state.customerIdx++;
  return { name: c.name, color: c.color, face: c.face, vip: !!c.vip };
}

function freeTable() {
  const used = new Set();
  for (const o of state.orders) if (o && o.table >= 0) used.add(o.table);
  for (let i = 0; i < tableCount(); i++) if (!used.has(i)) return i;
  return -1;
}

function queueCount() {
  return state.orders.filter((o) => o && o.table === -1).length;
}

function spawnOrder(force) {
  const slot = state.orders.indexOf(null);
  if (slot < 0) return false;
  if (!force && queueCount() >= 3 && freeTable() < 0) return false;
  const lv = level();
  let dishId = pick(lv.dishes);
  let cust = nextCustomer();
  if (lv.vip && !state.vipSpawned) {
    state.vipSpawned = true;
    dishId = 'sate';
    cust = { name: 'Raka', color: '#c0392b', face: '🧑‍💼', vip: true };
  }
  const table = freeTable();
  const order = {
    id: Date.now() + '-' + slot + '-' + Math.random().toString(36).slice(2, 6),
    slot,
    dish: dishId,
    customer: cust,
    table,
    patience: patienceMax(),
    patienceMax: patienceMax(),
    step: 0,
    ready: false,
    regular: REGULARS.includes(cust.name),
  };
  state.orders[slot] = order;
  if (state.selected < 0) state.selected = slot;
  renderTickets();
  renderDining();
  return true;
}

function selectedOrder() {
  if (state.selected < 0) return null;
  return state.orders[state.selected];
}

function moodOf(order) {
  const f = order.patience / order.patienceMax;
  if (order.ready) return { face: '😍', text: 'Siap!' };
  if (f > 0.6) return { face: '😊', text: 'Sabar' };
  if (f > 0.35) return { face: '😐', text: 'Lapar…' };
  if (f > 0.15) return { face: '😟', text: 'Gelisah' };
  return { face: '😠', text: 'Marah!' };
}

// ---------------------------------------------------------------- cooking & serving
function startStep(stationKey) {
  const order = selectedOrder();
  if (!order || order.ready) return;
  const dish = DISHES[order.dish];
  const step = dish.steps[order.step];
  if (!step || step.station !== stationKey) {
    sfx('click');
    return;
  }
  if (state.stationWork[stationKey]) return;
  const dur = stepDuration(step);
  state.stationWork[stationKey] = { order: order.id, step: order.step, done: 0, dur };
  sfx(step.station === 'CHOP' ? 'chop' : 'sizzle');
  renderPlate();
  renderStations();
}

function serveSelected() {
  const order = selectedOrder();
  if (!order || !order.ready) return;
  const dish = DISHES[order.dish];
  const frac = order.patience / order.patienceMax;
  const price = Math.round(dishPrice(order.dish));
  let tip = Math.round(price * 0.15 * frac * (1 + 0.2 * cashierLvl()));
  let total = price + tip;
  if (order.customer.vip) { total *= 3; tip *= 3; }
  state.bank += total;
  state.dayMoney += total;
  state.dayFood += price;
  state.dayTips += tip;
  state.dayServed++;
  state.servedTotal++;
  state.dayDishes[order.dish] = (state.dayDishes[order.dish] || 0) + 1;
  state.combo++;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.score += 100 + 50 * state.combo;
  const seatEl = document.querySelector('[data-seat="' + order.slot + '"]');
  if (seatEl) { floatAt(seatEl, '❤', 'heart'); floatAt(seatEl, '+' + rp(total), ''); }
  if (state.combo >= 3) floatAt($('#serve'), '★ KOMBO x' + state.combo + '!', 'star');
  sfx('serve');
  sfx('coin');
  removeOrder(order);
  updateTopbar();
  renderPlate();
  renderTickets();
  renderDining();
}

function removeOrder(order) {
  state.orders[order.slot] = null;
  if (state.selected === order.slot) {
    const next = state.orders.findIndex((o) => o);
    state.selected = next;
  }
  // A queued customer takes the freed table.
  const queued = state.orders.find((o) => o && o.table === -1);
  if (queued) {
    const t = freeTable();
    if (t >= 0) queued.table = t;
  }
  renderTickets();
  renderDining();
}

function walkout(order) {
  state.dayWalkouts++;
  state.walkoutsTotal++;
  state.combo = 0;
  sfx('walkout');
  const seatEl = document.querySelector('[data-seat="' + order.slot + '"]');
  if (seatEl) floatAt(seatEl, '😡 pergi!', '');
  removeOrder(order);
  updateTopbar();
  renderPlate();
  if (state.dayWalkouts >= 3) endDay(true);
}

// ---------------------------------------------------------------- tick
function tick() {
  if (state.screen !== 'play' || state.paused) return;
  const now = Date.now();
  const dt = Math.min(0.5, (now - state.lastTick) / 1000);
  state.lastTick = now;
  state.timeLeft -= dt;
  if (state.timeLeft <= 30 && !state.rushAnnounced) {
    state.rushAnnounced = true;
    showBanner('⚡ RUSH HOUR! Pelanggan datang lebih cepat!');
  }
  if (!state.groupDone && state.timeLeft < level().seconds * 0.5) {
    state.groupDone = true;
    showBanner('🎉 ROMBONGAN DATANG! Tiga pesanan sekaligus!');
    spawnOrder(true); spawnOrder(true); spawnOrder(true);
  }
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    const interval = state.timeLeft <= 30 ? level().spawn / 2 : level().spawn;
    state.spawnIn = interval;
    spawnOrder(false);
  }
  for (const key of Object.keys(state.stationWork)) {
    const w = state.stationWork[key];
    w.done += dt;
    if (w.done >= w.dur) {
      const order = state.orders.find((o) => o && o.id === w.order);
      delete state.stationWork[key];
      if (order && !order.ready && order.step === w.step) {
        order.step++;
        const dish = DISHES[order.dish];
        if (order.step >= dish.steps.length) order.ready = true;
        sfx('done');
        renderPlate();
        renderTickets();
      }
      renderStations();
    }
  }
  for (const order of [...state.orders]) {
    if (!order) continue;
    order.patience -= dt;
    if (order.patience <= 0) walkout(order);
  }
  updateTickDom();
  if (state.timeLeft <= 0) endDay(false);
}

function endDay(failed) {
  clearInterval(state.timer);
  state.timer = null;
  if (failed) {
    $('#over-text').textContent = 'Tiga pelanggan pergi marah di hari ke-' + state.day + '. Warungmu kehilangan kepercayaan… tapi setiap warung besar pernah hampir tutup.';
    $('#over-stats').innerHTML = 'Hari: ' + state.day + ' &nbsp;•&nbsp; Disajikan: ' + state.dayServed + ' &nbsp;•&nbsp; Pergi: ' + state.dayWalkouts + '<br>Skor: ' + state.score + ' &nbsp;•&nbsp; Uang: ' + rp(state.bank);
    showScreen('over');
    return;
  }
  const lv = level();
  const passed = state.dayMoney >= lv.target;
  $('#done-title').textContent = passed ? '🎉 HARI ' + state.day + ' SELESAI!' : '😅 HARI ' + state.day + ' SELESAI';
  $('#done-sub').textContent = passed
    ? 'Target ' + rp(lv.target) + ' tercapai — warung makin ramai!'
    : 'Target ' + rp(lv.target) + ' belum tercapai, tapi warung tetap buka besok.';
  renderDayDone();
  showScreen('daydone');
}

// ---------------------------------------------------------------- rendering: play screen
function buildPlay() {
  updateTopbar();
  renderDining();
  renderTickets();
  renderStations();
  renderPlate();
  renderPantry();
}

function updateTopbar() {
  const lv = level();
  $('#topbar').innerHTML =
    '<span class="brand">🍲 WARUNG KILAT</span>' +
    '<span>HARI ' + state.day + (state.endless ? ' <span class="endless">• TANPA BATAS</span>' : '') + '</span>' +
    '<span class="timer" id="tb-timer">⏱ ' + fmtTime(state.timeLeft) + '</span>' +
    '<span>TARGET ' + rp(lv.target) + '</span>' +
    '<span class="money">💰 <span id="tb-money">' + rp(state.bank) + '</span></span>' +
    '<span class="spacer"></span>' +
    '<span>SKOR <span id="tb-score">' + state.score + '</span></span>' +
    '<span class="combo">KOMBO x<span id="tb-combo">' + state.combo + '</span></span>' +
    '<span>Pergi: <span id="tb-walk">' + '●'.repeat(state.dayWalkouts) + '○'.repeat(Math.max(0, 3 - state.dayWalkouts)) + '</span></span>';
}

function updateTickDom() {
  const t = $('#tb-timer');
  if (t) {
    t.textContent = '⏱ ' + fmtTime(state.timeLeft);
    t.classList.toggle('low', state.timeLeft <= 30);
  }
  for (const order of state.orders) {
    if (!order) continue;
    const bar = document.querySelector('[data-pbar="' + order.slot + '"]');
    if (bar) {
      const f = clamp(order.patience / order.patienceMax, 0, 1);
      bar.style.width = Math.round(f * 100) + '%';
      bar.style.background = f > 0.35 ? '#27ae60' : '#e74c3c';
    }
    const pt = document.querySelector('[data-ptime="' + order.slot + '"]');
    if (pt) pt.textContent = Math.ceil(order.patience) + ' dtk';
    const mood = document.querySelector('[data-mood="' + order.slot + '"]');
    if (mood) {
      const m = moodOf(order);
      mood.textContent = m.face + ' ' + m.text;
    }
    const mb = document.querySelector('[data-mbar="' + order.slot + '"]');
    if (mb) {
      const f = clamp(order.patience / order.patienceMax, 0, 1);
      mb.style.width = Math.round(f * 100) + '%';
      mb.style.background = f > 0.35 ? '#27ae60' : '#e74c3c';
    }
  }
  for (const st of STATIONS) {
    const w = state.stationWork[st.key];
    const bar = document.querySelector('[data-sbar="' + st.key + '"]');
    const prog = document.querySelector('[data-sprog="' + st.key + '"]');
    const status = document.querySelector('[data-sstatus="' + st.key + '"]');
    if (w) {
      const order = state.orders.find((o) => o && o.id === w.order);
      const dish = order ? DISHES[order.dish] : null;
      const label = dish ? dish.steps[w.step].label : '';
      if (bar) bar.style.width = Math.round(clamp(w.done / w.dur, 0, 1) * 100) + '%';
      if (prog) prog.textContent = label + ' · ' + Math.round(clamp(w.done / w.dur, 0, 1) * 100) + '%';
      if (status) { status.textContent = 'Memasak…'; status.classList.add('busy'); }
    } else {
      if (bar) bar.style.width = '0%';
      if (prog) prog.textContent = '';
      if (status) { status.textContent = 'Siap'; status.classList.remove('busy'); }
    }
  }
}

function renderDining() {
  const dining = $('#dining');
  if (!dining) return;
  let html = '';
  for (let i = 0; i < tableCount(); i++) {
    const order = state.orders.find((o) => o && o.table === i);
    let seat = '<div class="seat empty">— kosong —</div>';
    if (order) {
      const m = moodOf(order);
      seat = '<div class="seat person' + (order.customer.vip ? ' vip' : '') + '" data-seat="' + order.slot + '" data-action="seat">' +
        '<div class="face">' + order.customer.face + '</div>' +
        '<div class="pname">' + order.customer.name + (order.customer.vip ? ' ⭐' : '') + '</div>' +
        '<div class="mood" data-mood="' + order.slot + '">' + m.face + ' ' + m.text + '</div>' +
        '<div class="mini-bar"><i data-mbar="' + order.slot + '" style="width:' + Math.round(100 * order.patience / order.patienceMax) + '%"></i></div>' +
        '</div>';
    }
    html += '<div class="table' + (order && state.selected === order.slot ? ' selected' : '') + '" data-table="' + i + '" data-action="table">' +
      '<div class="table-name">MEJA ' + (i + 1) + '</div><div class="seats">' + seat + '</div></div>';
  }
  const queued = state.orders.filter((o) => o && o.table === -1);
  html += '<div class="queue"><div class="q-title">🚪 ANTREAN</div><div class="q-list">' +
    (queued.length ? queued.map((o) => o.customer.face + ' ' + o.customer.name + ' — ' + DISHES[o.dish].name).join('<br>') : 'Tidak ada antrean') +
    '</div></div>';
  dining.innerHTML = html;
  const strip = $('#staff-strip');
  const hired = Object.keys(state.staff);
  if (hired.length === 0) {
    strip.innerHTML = '<div class="staff-figure"><span class="s-face">🧑‍🍳</span><span>Pakde Slamet memasak sendiri — rekrut staf di akhir hari!</span></div>';
  } else {
    strip.innerHTML = hired.map((id) => {
      const t = STAFF_TYPES[id];
      const lvl = state.staff[id];
      const job = id === 'cook' ? 'di dapur' : id === 'waiter' ? 'di ruang makan' : 'di kasir';
      return '<div class="staff-figure"><span class="s-face">' + t.face + '</span><span>' + t.name + ' • Lv ' + lvl + ' • ' + t.effect(lvl) + '</span><span class="s-idle">bekerja ' + job + '</span></div>';
    }).join('');
  }
}

function renderTickets() {
  const box = $('#tickets');
  if (!box) return;
  let html = '';
  for (let i = 0; i < 4; i++) {
    const order = state.orders[i];
    if (!order) {
      html += '<div class="ticket empty">— kosong —<br>pesanan berikutnya segera datang</div>';
      continue;
    }
    const dish = DISHES[order.dish];
    const f = clamp(order.patience / order.patienceMax, 0, 1);
    html += '<div class="ticket' + (state.selected === i ? ' selected' : '') + (order.customer.vip ? ' vip' : '') + '" data-ticket="' + i + '" data-action="ticket">' +
      '<div class="t-head"><span>' + order.customer.face + ' ' + order.customer.name + (order.customer.vip ? ' ⭐ KRITIKUS' : '') + (order.regular ? ' • langganan' : '') + '</span><span>' + (i + 1) + '</span></div>' +
      '<div class="t-dish">' + dish.name + '</div>' +
      '<div class="t-sub">' + dish.sub + '</div>' +
      '<div class="t-bar"><i data-pbar="' + i + '" style="width:' + Math.round(f * 100) + '%;background:' + (f > 0.35 ? '#27ae60' : '#e74c3c') + '"></i></div>' +
      '<div class="t-foot"><span data-ptime="' + i + '">' + Math.ceil(order.patience) + ' dtk</span>' +
      '<span>' + (order.ready ? '<span class="t-ready">✓ SIAP! [SPASI]</span>' : 'Langkah ' + order.step + '/' + dish.steps.length) + '</span></div>' +
      '</div>';
  }
  box.innerHTML = html;
}

function renderStations() {
  const box = $('#stations');
  if (!box) return;
  const order = selectedOrder();
  const nextStep = order && !order.ready ? DISHES[order.dish].steps[order.step] : null;
  box.innerHTML = STATIONS.map((st) => {
    const w = state.stationWork[st.key];
    const isNext = nextStep && nextStep.station === st.key;
    let prog = '';
    if (w) {
      const order = state.orders.find((o) => o && o.id === w.order);
      const label = order ? DISHES[order.dish].steps[w.step].label : '';
      prog = label + ' · ' + Math.round(clamp(w.done / w.dur, 0, 1) * 100) + '%';
    }
    return '<div class="station' + (isNext ? ' active' : '') + '" data-station="' + st.key + '" data-action="station">' +
      '<div class="st-icon">' + st.icon + '</div>' +
      '<div class="st-name">' + st.name + ' [' + st.code + ']</div>' +
      '<div class="st-role">' + st.role + '</div>' +
      '<div class="st-status' + (w ? ' busy' : '') + '" data-sstatus="' + st.key + '">' + (w ? 'Memasak…' : 'Siap') + '</div>' +
      '<div class="st-bar"><i data-sbar="' + st.key + '" style="width:' + (w ? Math.round(100 * w.done / w.dur) : 0) + '%"></i></div>' +
      '<div class="st-prog" data-sprog="' + st.key + '">' + prog + '</div>' +
      '</div>';
  }).join('');
}

function renderPlate() {
  const plate = $('#plate');
  const serve = $('#serve');
  if (!plate || !serve) return;
  const order = selectedOrder();
  const used = new Set();
  if (order) {
    const dish = DISHES[order.dish];
    dish.steps.forEach((s, idx) => { if (idx < order.step) used.add(s.label); });
    const chips = dish.steps.map((s, idx) => {
      const cls = idx < order.step ? 'done' : idx === order.step ? 'next' : '';
      const mark = idx < order.step ? '✓ ' : idx === order.step ? '▶ ' : '';
      return '<span class="step-chip ' + cls + '">' + mark + s.station + ': ' + s.label + '</span>';
    }).join('');
    const next = order.ready ? null : dish.steps[order.step];
    plate.innerHTML = '<div class="plate-box"><div class="plate-head">' +
      '<div class="plate-art">' + dishArt(order.dish, 72) + '</div>' +
      '<div><div class="plate-title">' + dish.name + ' — untuk ' + order.customer.name + '</div>' +
      '<div class="plate-sub">' + dish.sub + ' • ' + rp(dishPrice(order.dish)) + '</div></div></div>' +
      '<div class="step-chips">' + chips + '</div>' +
      '<div class="plate-next">' + (order.ready ? '✓ Semua langkah selesai — sajikan di kanan! →' : 'Berikutnya: ' + next.station + ' [' + (STATIONS.find((s) => s.key === next.station).code) + '] — ' + next.label) + '</div></div>';
    if (order.ready) {
      const frac = order.patience / order.patienceMax;
      const price = Math.round(dishPrice(order.dish));
      let tip = Math.round(price * 0.15 * frac * (1 + 0.2 * cashierLvl()));
      let total = price + tip;
      if (order.customer.vip) { total *= 3; tip *= 3; }
      serve.innerHTML = '<div class="serve-box ready" data-action="serve"><h3>🍽️ SAJIKAN!</h3>' +
        '<p>' + dish.name + ' • ' + rp(total) + '</p>' +
        '<p class="serve-tip">termasuk tip ' + rp(tip) + ' — tekan SPASI</p>' +
        '<p class="serve-tip">Disajikan: ' + state.dayServed + ' • Kombo terbaik: x' + state.bestCombo + '</p></div>';
    } else {
      serve.innerHTML = '<div class="serve-box"><h3>SAJIKAN</h3><p>Selesaikan semua langkah<br>masak dulu, baru sajikan.</p><p class="serve-tip">Disajikan: ' + state.dayServed + ' • Kombo terbaik: x' + state.bestCombo + '</p></div>';
    }
  } else {
    plate.innerHTML = '<div class="plate-box"><div class="plate-title">Piring masih kosong</div><div class="plate-sub">Klik pesanan di order board untuk mulai memasak.</div></div>';
    serve.innerHTML = '<div class="serve-box"><h3>SAJIKAN</h3><p>Pilih pesanan dulu.</p></div>';
  }
  const pantry = $('#pantry');
  if (pantry) {
    pantry.innerHTML = PANTRY.map((ing) => '<div class="ingredient' + (used.has(ing) ? ' used' : '') + '">' + ing + '</div>').join('');
  }
}

function renderPantry() {
  const pantry = $('#pantry');
  if (pantry) pantry.innerHTML = PANTRY.map((ing) => '<div class="ingredient">' + ing + '</div>').join('');
}

// ---------------------------------------------------------------- day-done: ledger, staff, shop
function renderDayDone() {
  const dishRows = Object.keys(state.dayDishes).map((id) =>
    '<div class="ledger-row"><span>' + DISHES[id].name + '</span><span>x' + state.dayDishes[id] + ' &nbsp; ' + rp(DISHES[id].price * state.dayDishes[id]) + '</span></div>').join('');
  $('#done-ledger').innerHTML = '<h3>🍽️ HIDANGAN HARI INI</h3>' + (dishRows || '<p>Belum ada yang disajikan.</p>') +
    '<div class="ledger-row"><span>Makanan</span><span>' + rp(state.dayFood) + '</span></div>' +
    '<div class="ledger-row"><span>Tips pelanggan</span><span>' + rp(state.dayTips) + '</span></div>' +
    '<div class="ledger-row total"><span>Total hari ini</span><span>' + rp(state.dayMoney) + '</span></div>' +
    '<div class="ledger-stats"><div>Disajikan<br><b>' + state.dayServed + '</b></div><div>Pelanggan pergi<br><b>' + state.dayWalkouts + '</b></div>' +
    '<div>Kombo terbaik<br><b>x' + state.bestCombo + '</b></div><div>Skor<br><b>' + state.score + '</b></div></div>' +
    '<p style="margin-top:8px;font-size:13px">Uangmu sekarang: <b>' + rp(state.bank) + '</b></p>';

  $('#done-staff').innerHTML = '<h3>👨‍🍳 STAF — rekrut &amp; naik level</h3>' + Object.keys(STAFF_TYPES).map((id) => {
    const t = STAFF_TYPES[id];
    const lvl = state.staff[id] || 0;
    if (lvl === 0) {
      return '<div class="staff-row"><div class="s-top"><span>' + t.face + ' ' + t.name + '</span><span>' + rp(t.hire) + '</span></div>' +
        '<div class="s-desc">' + t.desc + '</div><div class="s-meta">Gaji ' + rp(t.wage) + '/hari</div>' +
        '<button class="btn small" data-action="hire" data-id="' + id + '" ' + (state.bank < t.hire ? 'disabled' : '') + '>REKRUT</button></div>';
    }
    return '<div class="staff-row"><div class="s-top"><span>' + t.face + ' ' + t.name + ' • Lv ' + lvl + '</span><span>' + t.effect(lvl) + '</span></div>' +
      '<div class="s-desc">' + t.desc + '</div><div class="s-meta">Gaji ' + rp(t.wage * lvl) + '/hari • Naik level: ' + rp(t.upgrade) + '</div>' +
      '<button class="btn small" data-action="upgrade" data-id="' + id + '" ' + (state.bank < t.upgrade || lvl >= 3 ? 'disabled' : '') + '>NAIK LEVEL</button>' +
      '<button class="btn small warn" data-action="fire" data-id="' + id + '">PECAT</button></div>';
  }).join('');

  $('#done-shop').innerHTML = '<h3>🛒 TOKO — upgrade warung</h3>' + Object.keys(SHOP_ITEMS).map((id) => {
    const item = SHOP_ITEMS[id];
    const lvl = state.shop[id];
    const maxed = lvl >= item.max;
    return '<div class="shop-row"><div class="s-top"><span>' + item.icon + ' ' + item.name + ' • Lv ' + lvl + '/' + item.max + '</span><span>' + (maxed ? 'MAX' : rp(item.cost)) + '</span></div>' +
      '<div class="s-desc">' + item.desc + '</div>' +
      '<button class="btn small" data-action="buy" data-id="' + id + '" ' + (maxed || state.bank < item.cost ? 'disabled' : '') + '>BELI</button></div>';
  }).join('');

  const next = state.day + 1;
  $('#done-next').textContent = next > 10
    ? 'Besok: Hari ' + next + ' — MODE TANPA BATAS, target ' + rp(levelFor(next).target) + ' • pelanggan makin cepat'
    : 'Besok — Hari ' + next + ': target ' + rp(levelFor(next).target) + ' • ' + (STORY[next] ? STORY[next].hint : '');
}

// ---------------------------------------------------------------- input
function selectTicket(i) {
  if (!state.orders[i]) return;
  state.selected = i;
  sfx('click');
  renderTickets();
  renderDining();
  renderPlate();
  renderStations();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'start') { sfx('click'); startGame(); }
  else if (action === 'howto') { showScreen('howto'); }
  else if (action === 'back-title') { showScreen('title'); }
  else if (action === 'story-next') {
    sfx('click');
    beginDay(state.day);
  }
  else if (action === 'next-day') {
    sfx('click');
    const next = state.day + 1;
    state.day = next;
    showStory(next > 10 ? 'endless' : next);
  }
  else if (action === 'restart') { sfx('click'); startGame(); }
  else if (action === 'ticket') { selectTicket(parseInt(el.dataset.ticket, 10)); }
  else if (action === 'station') { startStep(el.dataset.station); }
  else if (action === 'serve') { serveSelected(); }
  else if (action === 'seat' || action === 'table') {
    const slot = el.dataset.seat !== undefined ? parseInt(el.dataset.seat, 10) : null;
    if (slot !== null && state.orders[slot]) selectTicket(slot);
    else if (el.dataset.table !== undefined) {
      const order = state.orders.find((o) => o && o.table === parseInt(el.dataset.table, 10));
      if (order) selectTicket(order.slot);
    }
  }
  else if (action === 'hire') {
    const t = STAFF_TYPES[el.dataset.id];
    if (state.bank >= t.hire) { state.bank -= t.hire; state.staff[el.dataset.id] = 1; sfx('hire'); renderDayDone(); }
  }
  else if (action === 'upgrade') {
    const t = STAFF_TYPES[el.dataset.id];
    const lvl = state.staff[el.dataset.id] || 0;
    if (lvl < 3 && state.bank >= t.upgrade) { state.bank -= t.upgrade; state.staff[el.dataset.id] = lvl + 1; sfx('hire'); renderDayDone(); }
  }
  else if (action === 'fire') {
    delete state.staff[el.dataset.id];
    sfx('click');
    renderDayDone();
  }
  else if (action === 'buy') {
    const item = SHOP_ITEMS[el.dataset.id];
    const lvl = state.shop[el.dataset.id];
    if (lvl < item.max && state.bank >= item.cost) { state.bank -= item.cost; state.shop[el.dataset.id] = lvl + 1; sfx('coin'); renderDayDone(); }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') { setMuted(!isMuted()); return; }
  if (state.screen === 'title' && (e.key === 'Enter' || e.key === 'h' || e.key === 'H')) {
    if (e.key === 'Enter') startGame(); else showScreen('howto');
    return;
  }
  if (state.screen === 'howto' && e.key === 'Enter') { startGame(); return; }
  if (state.screen === 'story' && e.key === 'Enter') { beginDay(state.day); return; }
  if (state.screen === 'daydone' && e.key === 'Enter') {
    const next = state.day + 1;
    state.day = next;
    showStory(next > 10 ? 'endless' : next);
    return;
  }
  if (state.screen === 'over' && e.key === 'Enter') { startGame(); return; }
  if (state.screen !== 'play') return;
  if (e.key === 'p' || e.key === 'P') { state.paused = !state.paused; showBanner(state.paused ? '⏸ JEDA — tekan P untuk lanjut' : '▶ Lanjut!'); return; }
  if (e.key === 'h' || e.key === 'H') { state.paused = true; showScreen('howto'); return; }
  if (state.paused) return;
  if (e.key >= '1' && e.key <= '4') selectTicket(parseInt(e.key, 10) - 1);
  else if (e.key === 'q' || e.key === 'Q') startStep('CHOP');
  else if (e.key === 'w' || e.key === 'W') startStep('FRY');
  else if (e.key === 'e' || e.key === 'E') startStep('GRILL');
  else if (e.key === 'r' || e.key === 'R') startStep('BOIL');
  else if (e.key === ' ') { e.preventDefault(); serveSelected(); }
});

// ---------------------------------------------------------------- staging & debug hooks (used by screenshot + test scripts)
function stageMidplay() {
  state.day = 2; state.endless = false;
  state.bank = 87400; state.score = 2450; state.combo = 3; state.bestCombo = 4;
  state.dayServed = 6; state.dayWalkouts = 0; state.servedTotal = 6;
  state.staff = { cook: 1 }; state.shop = { stove: 0, table: 0, fridge: 0, wok: 0 };
  state.timeLeft = 95; state.paused = true;
  const lv = level();
  state.orders = [null, null, null, null];
  const mk = (slot, dish, name, face, color, step, patience, table, vip) => ({
    id: 'stage-' + slot, slot, dish,
    customer: { name, color, face, vip: !!vip },
    table, patience, patienceMax: lv.patience, step, ready: false, regular: REGULARS.includes(name),
  });
  state.orders[0] = mk(0, 'nasgor', 'Budi', '🧑', '#3498db', 1, 31, 0);
  state.orders[1] = mk(1, 'sate', 'Siti', '👩', '#e84393', 0, 25, 1);
  state.orders[2] = mk(2, 'esteh', 'Agus', '🧑‍🦱', '#27ae60', 0, 37, 2);
  state.selected = 0;
  state.stationWork = { FRY: { order: 'stage-0', step: 1, done: 2.85, dur: 3.4 } };
  buildPlay();
  showScreen('play');
}

function stageLowtimer() {
  state.day = 6; state.endless = false;
  state.bank = 87400; state.score = 2450; state.combo = 3; state.bestCombo = 4;
  state.dayServed = 6; state.dayWalkouts = 0; state.servedTotal = 6;
  state.staff = { waiter: 1 }; state.shop = { stove: 0, table: 0, fridge: 0, wok: 0 };
  state.timeLeft = 17; state.paused = true; state.rushAnnounced = true;
  const lv = level();
  state.orders = [null, null, null, null];
  const mk = (slot, dish, name, face, color, step, patience, table, vip, ready) => ({
    id: 'stage-' + slot, slot, dish,
    customer: { name, color, face, vip: !!vip },
    table, patience, patienceMax: lv.patience, step, ready: !!ready, regular: REGULARS.includes(name),
  });
  state.orders[0] = mk(0, 'mie', 'Rina', '👩‍🦰', '#e67e22', 2, 8, 0);
  state.orders[1] = mk(1, 'geprek', 'Dewi', '👩‍🦱', '#8e44ad', 0, 11, 1);
  state.orders[2] = mk(2, 'gado', 'Joko', '🧑‍🦳', '#16a085', 1, 14, 2);
  state.orders[3] = mk(3, 'esteh', 'Maya', '👩‍🦳', '#2980b9', 2, 21, 3, false, true);
  state.selected = 3;
  state.stationWork = { FRY: { order: 'stage-0', step: 2, done: 2.3, dur: 3.0 } };
  buildPlay();
  showScreen('play');
  showBanner('⚡ RUSH HOUR! Kritikus Raka sudah pergi senang — layani sisanya!');
}

function stageDaydone() {
  state.day = 2; state.bank = 232000; state.score = 2450; state.combo = 0; state.bestCombo = 4;
  state.dayMoney = 172000; state.dayFood = 150000; state.dayTips = 22000;
  state.dayServed = 9; state.dayWalkouts = 1;
  state.dayDishes = { nasgor: 3, sate: 2, esteh: 2, mie: 1, geprek: 1 };
  state.staff = { cook: 1 }; state.shop = { stove: 0, table: 0, fridge: 0, wok: 0 };
  $('#done-title').textContent = '🎉 HARI 2 SELESAI!';
  $('#done-sub').textContent = 'Target Rp75.000 tercapai — warung makin ramai!';
  renderDayDone();
  $('#done-next').textContent = 'Besok — Hari 3: target Rp90.000 • Meja baru: sekarang 4 meja.';
  showScreen('daydone');
}

window.__wk = {
  version: 'v4',
  state,
  stage(name) {
    if (name === 'midplay') stageMidplay();
    else if (name === 'lowtimer') stageLowtimer();
    else if (name === 'daydone') stageDaydone();
    else showScreen('title');
  },
  endDay(failed) { endDay(!!failed); },
  setWalkouts(n) { state.dayWalkouts = n; },
  beginDay(d) { beginDay(d); },
  startGame() { startGame(); },
};

// ---------------------------------------------------------------- init
(function init() {
  const row = $('#title-dishes');
  if (row) {
    row.innerHTML = ['nasgor', 'mie', 'sate', 'geprek', 'gado', 'esteh'].map((id) => {
      const d = DISHES[id];
      return '<div class="dish-chip"><div class="dish-art">' + dishArt(id, 72) + '</div>' +
        '<div class="dish-name">' + d.name + '</div><div class="dish-price">' + rp(d.price) + '</div>' +
        '<div class="dish-steps">' + d.steps.length + ' langkah</div></div>';
    }).join('');
  }
  showScreen('title');
})();
