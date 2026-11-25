/* Warung Kilat v5 — game: cooking loop, customers, days, staff on screen.
   The employees are the subject: their loyalty moves, they ask for
   raises, they can be poached, and they can quit. */
'use strict';

function dishById(id) {
  for (var i = 0; i < DISHES.length; i++) if (DISHES[i].id === id) return DISHES[i];
  return DISHES[0];
}
function stationById(id) {
  for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].id === id) return STATIONS[i];
  return STATIONS[0];
}
function el(id) { return document.getElementById(id); }
function fmtTime(s) {
  s = Math.max(0, Math.ceil(s));
  return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
}
function moodOfOrder(o) {
  if (o.ready) return { face: '😍', word: 'Siap!' };
  var f = o.patience / o.patienceMax;
  if (f > 0.6) return { face: '😊', word: 'Sabar' };
  if (f > 0.35) return { face: '😐', word: 'Lapar…' };
  if (f > 0.15) return { face: '😟', word: 'Gelisah' };
  return { face: '😠', word: 'Marah!' };
}

var G = {
  screen: 'title', day: 1, timeLeft: DAY_LENGTH, money: 60000,
  score: 0, combo: 0, bestCombo: 0, served: 0, walkouts: 0,
  servedToday: 0, walkoutsToday: 0, orders: [], selected: 0,
  busy: { CHOP: null, FRY: null, GRILL: null, BOIL: null },
  shop: { stove: 0, table: 0, fridge: 0, wok: 0 },
  staff: new StaffSystem(),
  ledger: {}, foodMoney: 0, tipMoney: 0,
  paused: false, muted: false, event: null, profileId: null,
  spawnT: 4, custIdx: 0, rush: false, critic: false, msg: '',
  dayMsgs: [], quitMsgs: [], poachDone: false, endless: false
};

function tableCount() { return Math.min(5, 3 + G.shop.table); }
function speedFactor() { return G.staff.cookSpeed() * (1 + 0.15 * G.shop.stove); }
function patienceMax() {
  return dayPatience(G.day) * G.staff.patienceBoost() * (1 + 0.15 * G.shop.fridge);
}

function spawnOrder() {
  var free = [];
  for (var t = 1; t <= tableCount(); t++) {
    var used = false;
    for (var i = 0; i < G.orders.length; i++) if (G.orders[i].table === t) used = true;
    if (!used) free.push(t);
  }
  if (!free.length) return;
  var c = CUSTOMER_NAMES[G.custIdx % CUSTOMER_NAMES.length];
  G.custIdx++;
  var dish = DISHES[Math.floor(Math.random() * DISHES.length)];
  if (G.day >= 6 && !G.critic) {
    /* Day 6: the critic Raka walks in for a triple-paying order. */
    G.critic = true;
    var o0 = { id: 'o' + Date.now() + Math.random(), cust: { name: 'Raka', face: '🧐', regular: false },
      dish: dishById('sate'), step: 0, patience: patienceMax() * 1.2, patienceMax: patienceMax() * 1.2,
      table: free[0], ready: false, critic: true };
    G.orders.push(o0);
    G.msg = '🧐 Kritikus Raka datang! Pesanannya dibayar 3x lipat.';
    return;
  }
  var pm = patienceMax();
  G.orders.push({ id: 'o' + Date.now() + Math.random(), cust: c, dish: dish, step: 0,
    patience: pm, patienceMax: pm, table: free[0], ready: false, critic: false });
}

function selectOrder(i) {
  if (i < 0 || i >= G.orders.length) return;
  G.selected = i;
  SoundFX.click();
  renderPlay();
}

function startStep(stationId) {
  if (G.screen !== 'play' || G.paused) return;
  var o = G.orders[G.selected];
  if (!o || o.ready) return;
  var step = o.dish.steps[o.step];
  if (!step || step.station !== stationId) {
    G.msg = 'Langkah berikutnya bukan ' + stationId + '.';
    renderHint();
    return;
  }
  if (G.busy[stationId]) { G.msg = stationById(stationId).name + ' sedang dipakai.'; renderHint(); return; }
  var dur = step.dur / speedFactor();
  var slow = Math.random() < G.staff.mistakeChance();
  if (slow) { dur *= 1.5; G.msg = '😖 Joko lelah… langkah ini lambat!'; }
  G.busy[stationId] = { order: o, stepIdx: o.step, t: 0, dur: dur, slow: slow };
  if (stationId === 'CHOP') SoundFX.chop();
  else if (stationId === 'FRY' || stationId === 'GRILL') SoundFX.sizzle();
  else SoundFX.click();
  renderPlay();
}

function serveOrder() {
  if (G.screen !== 'play' || G.paused) return;
  var o = G.orders[G.selected];
  if (!o || !o.ready) { G.msg = 'Belum siap disajikan — selesaikan langkahnya.'; renderHint(); return; }
  var price = o.dish.price * (1 + 0.10 * G.shop.wok);
  if (o.critic) price *= 3;
  var tip = Math.round(price * 0.15 * (o.patience / o.patienceMax) * G.staff.tipBoost());
  var total = Math.round(price) + tip;
  G.money += total;
  G.foodMoney += Math.round(price);
  G.tipMoney += tip;
  G.served++; G.servedToday++;
  G.ledger[o.dish.id] = (G.ledger[o.dish.id] || 0) + 1;
  G.combo++; if (G.combo > G.bestCombo) G.bestCombo = G.combo;
  G.score += 100 + G.combo * 25;
  floatText('❤ +' + rupiah(total), o.table);
  SoundFX.coin();
  if (G.combo >= 3) SoundFX.cheer();
  G.orders.splice(G.selected, 1);
  if (G.selected >= G.orders.length) G.selected = Math.max(0, G.orders.length - 1);
  G.msg = 'Disajikan! ' + o.dish.name + ' +' + rupiah(total) + (tip ? ' (tip ' + rupiah(tip) + ')' : '');
  renderPlay();
}

function tick(dt) {
  if (G.screen !== 'play' || G.paused) return;
  G.timeLeft -= dt;
  var wasRush = G.rush;
  G.rush = G.timeLeft <= 30;
  var needsRender = G.rush !== wasRush;
  G.spawnT -= dt;
  if (G.spawnT <= 0) { spawnOrder(); G.spawnT = spawnInterval(G.day) * (G.rush ? 0.6 : 1); needsRender = true; }
  for (var i = G.orders.length - 1; i >= 0; i--) {
    var o = G.orders[i];
    if (!o.ready) o.patience -= dt;
    if (o.patience <= 0 && !o.ready) {
      var gone = G.orders.splice(i, 1)[0];
      G.walkouts++; G.walkoutsToday++;
      G.combo = 0;
      G.msg = '😡 ' + gone.cust.name + ' pergi marah! Pesanan hangus.';
      floatText('😡 pergi!', gone.table);
      SoundFX.bad();
      needsRender = true;
      if (G.selected >= G.orders.length) G.selected = Math.max(0, G.orders.length - 1);
      if (G.walkoutsToday >= 3) { endDay(true); return; }
    }
  }
  for (var k in G.busy) {
    var b = G.busy[k];
    if (!b) continue;
    b.t += dt;
    if (b.t >= b.dur) {
      var ord = b.order;
      ord.step++;
      if (ord.step >= ord.dish.steps.length) { ord.ready = true; SoundFX.ding(); }
      G.busy[k] = null;
      needsRender = true;
    }
  }
  if (G.timeLeft <= 0) { endDay(false); return; }
  if (needsRender) renderPlay(); else updateLive();
}

/* ---------- rendering ---------- */
function dishArt(id) {
  var art = {
    nasgor: '🍛', migor: '🍜', sate: '🍢', geprek: '🍗', gado: '🥗', esteh: '🥤'
  };
  return art[id] || '🍽️';
}

function showScreen(name) {
  G.screen = name;
  var screens = ['title', 'howto', 'play', 'daydone', 'over'];
  for (var i = 0; i < screens.length; i++) {
    var s = el('screen-' + screens[i]);
    if (s) s.style.display = screens[i] === name ? 'block' : 'none';
  }
  closeModals();
}

function renderTitle() {
  var chips = '';
  for (var i = 0; i < DISHES.length; i++) {
    var d = DISHES[i];
    chips += '<div class="dishchip"><div class="dishart">' + dishArt(d.id) + '</div>' +
      '<div class="dishname">' + d.name + '</div><div class="dishprice">' + rupiah(d.price) + '</div>' +
      '<div class="dishsteps">' + d.steps.length + ' langkah</div></div>';
  }
  el('screen-title').innerHTML =
    '<div class="awning"></div>' +
    '<h1 class="gametitle">WARUNG KILAT</h1>' +
    '<div class="subtitle">— Rush Hour Kitchen —</div>' +
    '<p class="tagline">Dari gerobak kecil di pinggir jalan sampai restoran paling ramai di kota. ' +
    'Masak cepat, sajikan hangat, dan jaga karyawannya — mereka yang bikin warung ini hidup.</p>' +
    '<div class="dishrow">' + chips + '</div>' +
    '<div class="titlebtns"><button class="btn big green" id="btn-start">▶ MULAI MASAK&nbsp;&nbsp;[ENTER]</button>' +
    '<button class="btn big plain" id="btn-howto">CARA MAIN&nbsp;&nbsp;[H]</button></div>' +
    '<p class="featureline">10 hari cerita • mode tanpa batas • 3 karyawan bisa direkrut • loyalitas, gaji &amp; cerita karyawan</p>' +
    '<p class="footline">Suara disintesis di browser — tanpa file eksternal, tanpa internet.</p>';
  el('btn-start').onclick = function () { startGame(); };
  el('btn-howto').onclick = function () { showScreen('howto'); renderHowto(); };
}

function renderHowto() {
  el('screen-howto').innerHTML =
    '<div class="awning"></div><h2 class="sectitle">CARA MAIN</h2>' +
    '<div class="howgrid">' +
    '<div class="howcard"><b>🍳 Masak</b><br>Klik pesanan (1–4), lalu klik stasiun (Q/W/E/R) untuk tiap langkah. Sajikan dengan SPASI.</div>' +
    '<div class="howcard"><b>🧑‍🤝‍🧑 Pelanggan</b><br>Mereka duduk di meja dengan mood. Sabar = tip besar, marah = pergi. 3 pergi = warung tutup.</div>' +
    '<div class="howcard"><b>👨‍🍳 Karyawan</b><br>Rekrut Joko, Sari, Dewi. Klik mereka untuk profil: puji, bonus, libur, naik gaji, latih.</div>' +
    '<div class="howcard"><b>❤️ Loyalitas</b><br>Lelah, gaji kecil, dan diabaikan bikin loyalitas turun. Rendah = kerja lambat, bisa berhenti!</div>' +
    '<div class="howcard"><b>💰 Gaji &amp; Tawaran</b><br>Karyawan bisa minta naik gaji. Bang Jono bisa membajak mereka. Terima, nego, atau tolak.</div>' +
    '<div class="howcard"><b>🏆 Cerita</b><br>10 hari cerita + mode tanpa batas. Rawat karyawanmu, cerita mereka ikut berkembang.</div>' +
    '</div>' +
    '<div class="titlebtns"><button class="btn big green" id="btn-back">◀ KEMBALI&nbsp;&nbsp;[ENTER]</button></div>' +
    '<p class="footline">Keyboard: 1–4 pilih pesanan • Q/W/E/R masak • SPASI sajikan • P jeda • M suara • H bantuan</p>';
  el('btn-back').onclick = function () { showScreen('title'); };
}

function staffChipHtml(st) {
  var d = staffDef(st.id);
  var m = G.staff.moodOf(st);
  var cls = st.hired ? (st.loyalty < 40 ? 'low' : '') : 'not hired';
  var lo = st.hired ? st.loyalty : 0;
  return '<div class="staffchip ' + cls + '" data-staff="' + st.id + '" title="Klik untuk profil">' +
    '<div class="staffface">' + d.icon + '</div>' +
    '<div class="staffinfo"><div class="staffname">' + d.name + ' • ' + d.role + ' • Lv ' + st.level + '</div>' +
    '<div class="staffmood"><span class="nowrap">' + m.face + ' ' + m.word + '</span></div>' +
    '<div class="meter"><div class="meterfill loyalty" style="width:' + lo + '%"></div></div>' +
    '<div class="staffsub nowrap">Loyalitas ' + lo + ' • ' + rupiah(st.wage) + '/hari</div></div></div>';
}

function renderStaffBar() {
  var html = '<div class="barlabel">👨‍🍳 KARYAWAN — klik untuk profil &amp; urus mereka</div><div class="staffrow">';
  for (var i = 0; i < STAFF_DEFS.length; i++) html += staffChipHtml(G.staff.members[STAFF_DEFS[i].id]);
  html += '</div><div class="staffnote" id="staff-note">' + (G.staff.log.length ? 'Terakhir: ' + G.staff.log[G.staff.log.length - 1] : 'Rekrut karyawan di layar akhir hari.') + '</div>';
  return html;
}

function renderPlay() {
  if (G.screen !== 'play') return;
  var o = G.orders[G.selected];
  /* dining tables */
  var tables = '';
  for (var t = 1; t <= tableCount(); t++) {
    var occ = null;
    for (var i = 0; i < G.orders.length; i++) if (G.orders[i].table === t) occ = G.orders[i];
    if (occ) {
      var mo = moodOfOrder(occ);
      tables += '<div class="table' + (G.orders[G.selected] === occ ? ' sel' : '') + '" data-table="' + t + '">' +
        '<div class="tablename">MEJA ' + t + '</div><div class="custface">' + occ.cust.face + '</div>' +
        '<div class="custname nowrap">' + occ.cust.name + (occ.critic ? ' 🧐' : '') + '</div>' +
        '<div class="custmood nowrap">' + mo.face + ' ' + mo.word + '</div>' +
        '<div class="meter"><div class="meterfill patience" style="width:' + Math.round(100 * occ.patience / occ.patienceMax) + '%"></div></div></div>';
    } else {
      tables += '<div class="table empty" data-table="' + t + '"><div class="tablename">MEJA ' + t + '</div><div class="custempty">— kosong —</div></div>';
    }
  }
  tables += '<div class="table queue"><div class="tablename">🚪 ANTREAN</div><div class="custempty">' + (G.orders.length >= 4 ? 'Penuh! Tunggu meja kosong.' : 'Tidak ada antrean') + '</div></div>';
  /* order board */
  var tickets = '';
  for (var i = 0; i < 4; i++) {
    var ord = G.orders[i];
    if (!ord) {
      tickets += '<div class="ticket empty"><div class="ticketempty">— kosong —<br>pesanan berikutnya segera datang</div></div>';
      continue;
    }
    var pct = Math.round(100 * ord.patience / ord.patienceMax);
    tickets += '<div class="ticket' + (i === G.selected ? ' sel' : '') + '" data-order="' + i + '">' +
      '<div class="tickethead"><span>' + ord.cust.face + ' ' + ord.cust.name + (ord.cust.regular ? ' • langganan' : '') + (ord.critic ? ' • KRITIKUS' : '') + '</span><span>' + (i + 1) + '</span></div>' +
      '<div class="ticketdish">' + ord.dish.name + '</div><div class="ticketen">' + ord.dish.en + '</div>' +
      '<div class="meter"><div class="meterfill patience" style="width:' + pct + '%"></div></div>' +
      '<div class="ticketfoot"><span>' + Math.ceil(ord.patience) + ' dtk</span><span>' + (ord.ready ? '✓ SIAP! [SPASI]' : 'Langkah ' + ord.step + '/' + ord.dish.steps.length) + '</span></div></div>';
  }
  /* stations */
  var stHtml = '';
  for (var s = 0; s < STATIONS.length; s++) {
    var stn = STATIONS[s];
    var b = G.busy[stn.id];
    var pct2 = b ? Math.round(100 * b.t / b.dur) : 0;
    var label = b ? b.order.dish.steps[b.stepIdx].label + ' · ' + pct2 + '%' : '';
    var status = b ? (b.slow ? 'Lambat…' : 'Memasak…') : 'Siap';
    stHtml += '<div class="station' + (b ? ' busy' : '') + '" data-station="' + stn.id + '">' +
      '<div class="stationicon">' + stn.icon + '</div><div class="stationname">' + stn.id + ' [' + stn.key + ']</div>' +
      '<div class="stationsub">' + stn.name + '</div><div class="stationstatus ' + (b ? 'cook' : 'ok') + '">' + status + '</div>' +
      '<div class="meter"><div class="meterfill cook" style="width:' + pct2 + '%"></div></div>' +
      '<div class="stationlabel nowrap">' + label + '</div></div>';
  }
  /* plate + serve */
  var plate = '';
  if (o) {
    var chips = '';
    for (var s2 = 0; s2 < o.dish.steps.length; s2++) {
      var done = s2 < o.step || o.ready;
      var cur = s2 === o.step && !o.ready;
      chips += '<span class="stepchip ' + (done ? 'done' : cur ? 'cur' : '') + '">' + (done ? '✓ ' : cur ? '▶ ' : '') + o.dish.steps[s2].station + ': ' + o.dish.steps[s2].label + '</span>';
    }
    plate = '<div class="plateart">' + dishArt(o.dish.id) + '</div><div class="plateinfo">' +
      '<div class="platetitle">' + o.dish.name + ' — untuk ' + o.cust.name + '</div>' +
      '<div class="platesub">' + o.dish.en + ' • ' + rupiah(o.dish.price) + '</div>' +
      '<div class="stepchips">' + chips + '</div>' +
      '<div class="nextstep">' + (o.ready ? '✓ Semua langkah selesai — sajikan di kanan! →' : 'Berikutnya: ' + o.dish.steps[o.step].station + ' [' + stationById(o.dish.steps[o.step].station).key + '] — ' + o.dish.steps[o.step].label) + '</div></div>';
  } else {
    plate = '<div class="plateart">🍽️</div><div class="plateinfo"><div class="platetitle">Belum ada pesanan</div><div class="platesub">Tunggu pelanggan datang dan duduk di meja.</div></div>';
  }
  var serve = '';
  if (o && o.ready) {
    var price = Math.round(o.dish.price * (1 + 0.10 * G.shop.wok) * (o.critic ? 3 : 1));
    var tip = Math.round(price * 0.15 * (o.patience / o.patienceMax) * G.staff.tipBoost());
    serve = '<div class="serve ready" id="btn-serve"><div class="servetitle">🍽️ SAJIKAN!</div>' +
      '<div class="serveprice">' + o.dish.name + ' • ' + rupiah(price + tip) + '</div>' +
      '<div class="servesub">termasuk tip ' + rupiah(tip) + ' — tekan SPASI</div>' +
      '<div class="servesub">Disajikan: ' + G.served + ' • Kombo terbaik: x' + G.bestCombo + '</div></div>';
  } else {
    serve = '<div class="serve"><div class="servetitle">SAJIKAN</div><div class="servesub">Selesaikan semua langkah<br>masak dulu, baru sajikan.</div>' +
      '<div class="servesub">Disajikan: ' + G.served + ' • Kombo terbaik: x' + G.bestCombo + '</div></div>';
  }
  var pantry = '';
  for (var p = 0; p < PANTRY.length; p++) pantry += '<div class="panchip">' + PANTRY[p] + '</div>';
  el('screen-play').innerHTML =
    '<div class="topbar' + (G.rush ? ' rush' : '') + '">' +
    '<span class="tb nowrap">🍲 WARUNG KILAT</span><span class="tb nowrap">HARI ' + G.day + (G.endless ? ' • TANPA BATAS' : '') + '</span>' +
    '<span class="tb nowrap">⏱ <span id="live-time">' + fmtTime(G.timeLeft) + '</span></span>' +
    (G.rush ? '<span class="tb nowrap">⚠ RUSH HOUR!</span>' : '') +
    '<span class="tb nowrap">TARGET ' + rupiah(dayTarget(G.day)) + '</span>' +
    '<span class="tb money nowrap">💰 <span id="live-money">' + rupiah(G.money) + '</span></span>' +
    '<span class="tb right nowrap">SKOR <span id="live-score">' + G.score + '</span> &nbsp; <span class="combo">KOMBO x' + G.combo + '</span> &nbsp; Pergi: ' + '●'.repeat(G.walkoutsToday) + '○'.repeat(Math.max(0, 3 - G.walkoutsToday)) + '</span></div>' +
    '<div class="panel"><div class="barlabel">🍽️ RUANG MAKAN — klik pelanggan untuk melihat pesanannya</div><div class="tablerow">' + tables + '</div></div>' +
    '<div class="panel staffpanel">' + renderStaffBar() + '</div>' +
    '<div class="panel"><div class="barlabel">📋 ORDER BOARD — klik pesanan (1–4) lalu masak di stasiun</div><div class="ticketrow">' + tickets + '</div></div>' +
    '<div class="panel"><div class="barlabel">🔥 STASIUN MASAK — klik stasiun (Q/W/E/R) untuk langkah berikutnya</div><div class="stationrow">' + stHtml + '</div></div>' +
    '<div class="lowerrow"><div class="panel plate">' + plate + '</div>' + serve +
    '<div class="panel pantry"><div class="barlabel">🧺 BAHAN DI MEJA:</div><div class="pangrid">' + pantry + '</div></div></div>' +
    '<div class="hintbar" id="hintbar">Klik pesanan • 1–4 pilih pesanan • Q/W/E/R masak • SPASI sajikan • P jeda • M suara • H bantuan</div>' +
    (G.msg ? '<div class="toast" id="toast">' + G.msg + '</div>' : '');
  bindPlay();
}

function renderHint() {
  var h = el('hintbar');
  if (h && G.msg) h.textContent = G.msg;
}

function updateLive() {
  var t = el('live-time'); if (t) t.textContent = fmtTime(G.timeLeft);
  var m = el('live-money'); if (m) m.textContent = rupiah(G.money);
  var s = el('live-score'); if (s) s.textContent = String(G.score);
  var tickets = document.querySelectorAll('.ticket');
  for (var i = 0; i < G.orders.length; i++) {
    var o = G.orders[i];
    var tk = tickets[i];
    if (tk) {
      var fill = tk.querySelector('.meterfill');
      if (fill) fill.style.width = Math.round(100 * o.patience / o.patienceMax) + '%';
      var foot = tk.querySelectorAll('.ticketfoot span');
      if (foot[0]) foot[0].textContent = Math.ceil(o.patience) + ' dtk';
      if (foot[1]) foot[1].textContent = o.ready ? '✓ SIAP! [SPASI]' : 'Langkah ' + o.step + '/' + o.dish.steps.length;
    }
    var tbl = document.querySelector('[data-table="' + o.table + '"]');
    if (tbl) {
      var tf = tbl.querySelector('.meterfill');
      if (tf) tf.style.width = Math.round(100 * o.patience / o.patienceMax) + '%';
      var mo = moodOfOrder(o);
      var cm = tbl.querySelector('.custmood');
      if (cm) cm.textContent = mo.face + ' ' + mo.word;
    }
  }
  for (var k in G.busy) {
    var b = G.busy[k];
    var stn = document.querySelector('[data-station="' + k + '"]');
    if (!stn) continue;
    var fill2 = stn.querySelector('.meterfill');
    if (fill2) fill2.style.width = b ? Math.round(100 * b.t / b.dur) + '%' : '0%';
    var lab = stn.querySelector('.stationlabel');
    if (lab) lab.textContent = b ? b.order.dish.steps[b.stepIdx].label + ' · ' + Math.round(100 * b.t / b.dur) + '%' : '';
    var st = stn.querySelector('.stationstatus');
    if (st) { st.textContent = b ? (b.slow ? 'Lambat…' : 'Memasak…') : 'Siap'; st.className = 'stationstatus ' + (b ? 'cook' : 'ok'); }
  }
}

function floatText(txt, table) {
  var f = el('floats');
  if (!f) return;
  var d = document.createElement('div');
  d.className = 'float';
  d.textContent = txt;
  d.style.left = (120 + (table || 1) * 180 + Math.random() * 40) + 'px';
  d.style.top = '150px';
  f.appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1800);
}

function bindPlay() {
  var tickets = document.querySelectorAll('[data-order]');
  for (var i = 0; i < tickets.length; i++) {
    (function (n) { tickets[n].onclick = function () { selectOrder(n); }; })(i);
  }
  var stations = document.querySelectorAll('[data-station]');
  for (var j = 0; j < stations.length; j++) {
    (function (elm) { elm.onclick = function () { startStep(elm.getAttribute('data-station')); }; })(stations[j]);
  }
  var tables = document.querySelectorAll('[data-table]');
  for (var k = 0; k < tables.length; k++) {
    (function (elm) {
      elm.onclick = function () {
        var tn = parseInt(elm.getAttribute('data-table'), 10);
        for (var i = 0; i < G.orders.length; i++) if (G.orders[i].table === tn) { selectOrder(i); return; }
      };
    })(tables[k]);
  }
  var chips = document.querySelectorAll('[data-staff]');
  for (var c = 0; c < chips.length; c++) {
    (function (elm) { elm.onclick = function () { openProfile(elm.getAttribute('data-staff')); }; })(chips[c]);
  }
  var sv = el('btn-serve');
  if (sv) sv.onclick = function () { serveOrder(); };
}

/* ---------- day flow ---------- */
function startGame() {
  G.day = 1; G.money = 60000; G.score = 0; G.combo = 0; G.bestCombo = 0;
  G.served = 0; G.walkouts = 0; G.shop = { stove: 0, table: 0, fridge: 0, wok: 0 };
  G.staff = new StaffSystem();
  G.endless = false; G.poachDone = false; G.critic = false;
  startDay();
}

function startDay() {
  G.orders = []; G.selected = 0; G.timeLeft = DAY_LENGTH;
  G.servedToday = 0; G.walkoutsToday = 0; G.ledger = {};
  G.foodMoney = 0; G.tipMoney = 0; G.spawnT = 2; G.rush = false; G.critic = false;
  G.busy = { CHOP: null, FRY: null, GRILL: null, BOIL: null };
  G.msg = '';
  /* Wages are paid at the start of the day; rest day applies. */
  var list = G.staff.hiredList();
  for (var i = 0; i < list.length; i++) {
    var st = list[i];
    if (st.offTomorrow) { st.resting = true; st.offTomorrow = false; }
    else st.resting = false;
  }
  var wages = G.staff.totalWages();
  if (wages > 0) {
    if (G.money >= wages) { G.money -= wages; G.msg = '💰 Gaji karyawan dibayar: ' + rupiah(wages) + '.'; }
    else {
      /* Cannot pay: the most expensive employee walks out. */
      var worst = null;
      for (var j = 0; j < list.length; j++) if (!worst || list[j].wage > worst.wage) worst = list[j];
      G.money = 0;
      G.msg = '💸 Uang habis! ' + staffDef(worst.id).name + ' pergi karena tidak digaji.';
      G.quitMsgs.push(G.staff.quit(worst.id, 'tidak bisa digaji'));
    }
  }
  showScreen('play');
  renderPlay();
}

function endDay(closed) {
  var stats = { served: G.servedToday, walkouts: G.walkoutsToday };
  G.staff.applyDayEnd(stats);
  var quits = G.staff.checkQuits();
  G.quitMsgs = G.quitMsgs.concat(quits);
  var target = dayTarget(G.day);
  var total = G.foodMoney + G.tipMoney;
  var won = total >= target && !closed;
  G.dayMsgs = [];
  if (closed) G.dayMsgs.push('😢 Warung tutup lebih awal — 3 pelanggan pergi marah.');
  else if (won) G.dayMsgs.push('🎉 Target tercapai! Warung makin ramai.');
  else G.dayMsgs.push('😕 Target tidak tercapai. Coba lagi besok, lebih baik!');
  /* Queue the day's employee event: raise request first, then poaching. */
  var raise = G.staff.pendingRaise();
  var poach = (!raise && !G.poachDone) ? G.staff.poachTarget(G.day) : null;
  if (poach) G.poachDone = true;
  G.event = raise ? { kind: 'raise', staffId: raise.id } : (poach ? { kind: 'poach', staffId: poach.id } : null);
  if (closed) { showGameOver(); return; }
  showScreen('daydone');
  renderDayDone();
  if (G.event) openEvent(G.event.kind, G.event.staffId);
}

function nextDay() {
  G.day++;
  if (G.day > 10) G.endless = true;
  startDay();
}

function showGameOver() {
  showScreen('over');
  el('screen-over').innerHTML =
    '<div class="awning"></div><h2 class="sectitle">😢 WARUNG TUTUP…</h2>' +
    '<p class="tagline">3 pelanggan pergi marah di hari ' + G.day + '. Pelanggan dan karyawan butuh perhatian yang sama.</p>' +
    '<p class="featureline">Skor akhir: ' + G.score + ' • Disajikan: ' + G.served + ' piring • Kombo terbaik: x' + G.bestCombo + '</p>' +
    '<div class="titlebtns"><button class="btn big green" id="btn-again">▶ COBA LAGI&nbsp;&nbsp;[ENTER]</button></div>' +
    '<p class="footline">Tip: rekrut Sari si pelayan — pelanggan jadi lebih sabar.</p>';
  el('btn-again').onclick = function () { startGame(); };
}

function renderDayDone() {
  var rows = '';
  var names = Object.keys(G.ledger);
  var totalDishes = 0;
  for (var i = 0; i < names.length; i++) {
    var d = dishById(names[i]);
    totalDishes += G.ledger[names[i]];
    rows += '<div class="ledrow"><span>' + d.name + '</span><span>x' + G.ledger[names[i]] + '</span><span>' + rupiah(d.price * G.ledger[names[i]]) + '</span></div>';
  }
  if (!names.length) rows = '<div class="ledrow"><span>Belum ada yang terjual</span><span></span><span></span></div>';
  var total = G.foodMoney + G.tipMoney;
  var story = DAY_STORIES[Math.min(G.day, 10)];
  /* staff panel with loyalty, story hints and management buttons */
  var staffHtml = '';
  for (var s = 0; s < STAFF_DEFS.length; s++) {
    var def = STAFF_DEFS[s];
    var st = G.staff.members[def.id];
    var m = G.staff.moodOf(st);
    var storyLine = st.hired
      ? (st.loyalty < 40 ? 'Cerita terhenti — ' + def.name + ' sedang tidak bahagia.'
        : '📖 ' + def.story[Math.min(st.storyStage, 2)])
      : '💭 Mimpi: ' + def.dream + '.';
    staffHtml += '<div class="empcard' + (st.hired ? '' : ' not') + '">' +
      '<div class="emphead"><span class="empface">' + def.icon + '</span>' +
      '<span><b>' + def.name + ' si ' + def.role + ' • Lv ' + st.level + '</b><br>' +
      '<span class="nowrap">' + m.face + ' ' + m.word + ' • Loyalitas ' + (st.hired ? st.loyalty : '—') + '</span></span>' +
      '<span class="empwage">' + (st.hired ? rupiah(st.wage) + '/hari' : rupiah(G.staff.hireCost(st))) + '</span></div>' +
      '<div class="meter"><div class="meterfill loyalty" style="width:' + (st.hired ? st.loyalty : 0) + '%"></div></div>' +
      '<div class="empdesc">' + def.effect + '. ' + def.backstory + '</div>' +
      '<div class="empstory">' + storyLine + '</div>' +
      '<div class="empwhy">Alasan loyalitas: ' + (st.hired ? st.lastReason : 'belum direkrut') + '</div>';
    if (st.hired) {
      staffHtml += '<div class="empbtns">' +
        '<button class="btn small" data-act="praise" data-id="' + def.id + '">👍 PUJI</button>' +
        '<button class="btn small" data-act="bonus" data-id="' + def.id + '">🎁 BONUS Rp20rb</button>' +
        '<button class="btn small" data-act="dayoff" data-id="' + def.id + '">🌴 LIBUR</button>' +
        '<button class="btn small" data-act="raise" data-id="' + def.id + '">💰 NAIK GAJI</button>' +
        '<button class="btn small" data-act="train" data-id="' + def.id + '">📈 LATIH Rp80rb</button>' +
        '<button class="btn small danger" data-act="fire" data-id="' + def.id + '">PECAT</button></div>';
    } else {
      staffHtml += '<div class="empbtns"><button class="btn small green" data-act="hire" data-id="' + def.id + '">REKRUT • ' + rupiah(G.staff.hireCost(st)) + '</button>' +
        '<button class="btn small" data-act="profile" data-id="' + def.id + '">PROFIL</button></div>';
    }
    staffHtml += '</div>';
  }
  var shopHtml = '';
  for (var k = 0; k < SHOP_ITEMS.length; k++) {
    var it = SHOP_ITEMS[k];
    var lv = G.shop[it.id];
    var cost = it.cost * (lv + 1);
    var can = lv < 3 && G.money >= cost;
    shopHtml += '<div class="shopcard"><div class="shophead"><span>' + it.icon + ' ' + it.name + ' • Lv ' + lv + '/3</span><span>' + rupiah(cost) + '</span></div>' +
      '<div class="shopdesc">' + it.desc + '</div>' +
      '<button class="btn small ' + (can ? 'green' : '') + '" data-shop="' + it.id + '" ' + (can ? '' : 'disabled') + '>' + (lv >= 3 ? 'MAKSIMAL' : 'BELI') + '</button></div>';
  }
  var quitHtml = G.quitMsgs.length ? '<div class="quitbox">' + G.quitMsgs.join('<br>') + '</div>' : '';
  el('screen-daydone').innerHTML =
    '<div class="awning"></div><h2 class="sectitle">🎉 HARI ' + G.day + ' SELESAI!</h2>' +
    '<p class="tagline">' + G.dayMsgs.join(' ') + '</p>' + quitHtml +
    '<div class="donegrid">' +
    '<div class="panel"><div class="barlabel">🍽️ HIDANGAN HARI INI</div>' + rows +
    '<div class="ledrow"><span>Makanan</span><span></span><span>' + rupiah(G.foodMoney) + '</span></div>' +
    '<div class="ledrow"><span>Tips pelanggan</span><span></span><span>' + rupiah(G.tipMoney) + '</span></div>' +
    '<div class="ledrow total"><span>Total hari ini</span><span></span><span>' + rupiah(total) + '</span></div>' +
    '<div class="ledstats">Disajikan <b>' + G.servedToday + '</b> • Pergi <b>' + G.walkoutsToday + '</b> • Kombo terbaik <b>x' + G.bestCombo + '</b> • Skor <b>' + G.score + '</b><br>Uangmu sekarang: <b>' + rupiah(G.money) + '</b> • Gaji besok: <b>' + rupiah(G.staff.totalWages()) + '</b></div></div>' +
    '<div class="panel"><div class="barlabel">👨‍🍳 STAF — rekrut, rawat &amp; naikkan level</div>' + staffHtml + '</div>' +
    '<div class="panel"><div class="barlabel">🛒 TOKO — upgrade warung</div>' + shopHtml + '</div></div>' +
    '<p class="storyline">Besok — Hari ' + (G.day + 1) + ': <b>' + story.who + '</b> — “' + story.line + '”</p>' +
    '<div class="titlebtns"><button class="btn big green" id="btn-next">▶ HARI BERIKUTNYA&nbsp;&nbsp;[ENTER]</button></div>';
  G.quitMsgs = [];
  el('btn-next').onclick = function () { nextDay(); };
  var acts = document.querySelectorAll('[data-act]');
  for (var a = 0; a < acts.length; a++) {
    (function (elm) {
      elm.onclick = function () { staffAction(elm.getAttribute('data-act'), elm.getAttribute('data-id')); };
    })(acts[a]);
  }
  var shops = document.querySelectorAll('[data-shop]');
  for (var b = 0; b < shops.length; b++) {
    (function (elm) {
      elm.onclick = function () { buyShop(elm.getAttribute('data-shop')); };
    })(shops[b]);
  }
}

function staffAction(act, id) {
  var st = G.staff.members[id];
  var before = G.money;
  var msg = '';
  if (act === 'hire') {
    msg = G.staff.hire(id, G.money);
    if (msg.indexOf('bergabung') >= 0) { G.money -= G.staff.hireCost(st); SoundFX.hire(); }
  } else if (act === 'praise') { msg = G.staff.praise(id); SoundFX.click(); }
  else if (act === 'bonus') {
    msg = G.staff.bonus(id, G.money);
    if (msg.indexOf('Bonus') === 0) G.money -= 20000;
  } else if (act === 'dayoff') { msg = G.staff.giveDayOff(id); }
  else if (act === 'raise') {
    msg = G.staff.raiseWage(id, G.money);
    if (msg.indexOf('naik jadi') >= 0) G.money -= 10000;
  } else if (act === 'train') {
    msg = G.staff.train(id, G.money);
    if (msg.indexOf('naik ke level') >= 0) G.money -= 80000;
  } else if (act === 'fire') { msg = G.staff.fire(id); SoundFX.bad(); }
  else if (act === 'profile') { openProfile(id); return; }
  G.msg = msg;
  if (G.screen === 'daydone') renderDayDone();
  else if (G.screen === 'play') renderPlay();
  if (G.profileId) openProfile(G.profileId);
  renderHint();
}

function buyShop(id) {
  var lv = G.shop[id];
  if (lv >= 3) return;
  var it = null;
  for (var i = 0; i < SHOP_ITEMS.length; i++) if (SHOP_ITEMS[i].id === id) it = SHOP_ITEMS[i];
  var cost = it.cost * (lv + 1);
  if (G.money < cost) { G.msg = 'Uang tidak cukup untuk ' + it.name + '.'; renderHint(); return; }
  G.money -= cost;
  G.shop[id]++;
  G.msg = '🛒 ' + it.name + ' naik ke Lv ' + G.shop[id] + '!';
  SoundFX.hire();
  if (G.screen === 'daydone') renderDayDone();
}

/* ---------- modals: employee profile & events ---------- */
function closeModals() {
  var p = el('modal-profile'); if (p) p.style.display = 'none';
  var e = el('modal-event'); if (e) e.style.display = 'none';
  G.profileId = null;
}

function openProfile(id) {
  var st = G.staff.members[id];
  var d = staffDef(id);
  var m = G.staff.moodOf(st);
  G.profileId = id;
  var body = '<div class="modalcard"><div class="modalhead"><span class="empface big">' + d.icon + '</span>' +
    '<span><b>' + d.name + ' si ' + d.role + '</b><br><span class="nowrap">' + m.face + ' ' + m.word + '</span></span>' +
    '<span class="empwage">Lv ' + st.level + '</span></div>' +
    '<p class="empdesc">' + d.backstory + '</p>' +
    '<p class="empstory">💭 Mimpi: ' + d.dream + '</p>' +
    '<p class="empstory">📖 ' + (st.hired ? d.story[Math.min(st.storyStage, 2)] : 'Rekrut dulu untuk memulai ceritanya.') + '</p>' +
    '<div class="meter"><div class="meterfill loyalty" style="width:' + (st.hired ? st.loyalty : 0) + '%"></div></div>' +
    '<div class="ledstats">Loyalitas <b>' + (st.hired ? st.loyalty : '—') + '</b> • Gaji <b>' + rupiah(st.wage) + '/hari</b> • Gaji wajar <b>' + rupiah(G.staff.fairWage(st)) + '</b><br>' +
    'Hari kerja <b>' + st.daysWorked + '</b> • Terakhir: <b>' + st.lastReason + '</b></div>';
  if (st.hired) {
    body += '<div class="empbtns">' +
      '<button class="btn small" data-pact="praise">[1] 👍 PUJI (gratis)</button>' +
      '<button class="btn small" data-pact="bonus">[2] 🎁 BONUS Rp20rb</button>' +
      '<button class="btn small" data-pact="dayoff">[3] 🌴 LIBUR 1 HARI</button>' +
      '<button class="btn small" data-pact="raise">[4] 💰 NAIK GAJI +Rp10rb</button>' +
      '<button class="btn small" data-pact="train">[5] 📈 LATIH Rp80rb</button></div>';
  } else {
    body += '<div class="empbtns"><button class="btn small green" data-pact="hire">REKRUT • ' + rupiah(G.staff.hireCost(st)) + '</button></div>';
  }
  body += '<div class="titlebtns"><button class="btn plain" id="btn-close-profile">TUTUP&nbsp;&nbsp;[ESC]</button></div></div>';
  el('modal-profile').innerHTML = body;
  el('modal-profile').style.display = 'flex';
  el('btn-close-profile').onclick = function () { closeModals(); if (G.screen === 'play') renderPlay(); };
  var acts = document.querySelectorAll('[data-pact]');
  for (var i = 0; i < acts.length; i++) {
    (function (elm) {
      elm.onclick = function () {
        staffAction(elm.getAttribute('data-pact'), id);
        if (G.profileId) openProfile(id);
      };
    })(acts[i]);
  }
}

function openEvent(kind, staffId) {
  var st = G.staff.members[staffId];
  var d = staffDef(staffId);
  var body = '';
  if (kind === 'raise') {
    body = '<div class="modalcard event"><div class="modalhead"><span class="empface big">' + d.icon + '</span>' +
      '<span><b>' + d.name + ' minta naik gaji!</b><br><span>Loyalitas ' + st.loyalty + ' • Gaji ' + rupiah(st.wage) + '/hari</span></span></div>' +
      '<p class="eventquote">“' + G.staff.raiseReason(st) + '”</p>' +
      '<p class="empdesc">Terima: gaji +Rp15.000, loyalitas +15. Nego: +Rp7.000, loyalitas +5 (atau kecewa). Tolak: loyalitas -15, bisa berhenti!</p>' +
      '<div class="empbtns">' +
      '<button class="btn small green" data-echoice="accept">[1] 🤝 TERIMA +Rp15rb</button>' +
      '<button class="btn small" data-echoice="negotiate">[2] 💬 NEGO +Rp7rb</button>' +
      '<button class="btn small danger" data-echoice="refuse">[3] ✋ TOLAK</button></div></div>';
  } else {
    body = '<div class="modalcard event"><div class="modalhead"><span class="empface big">😤</span>' +
      '<span><b>Bang Jono membajak ' + d.name + '!</b><br><span>Loyalitas ' + st.loyalty + ' • Level ' + st.level + '</span></span></div>' +
      '<p class="eventquote">“' + d.name + ', ikut warungku! Gajinya lebih besar.” — Bang Jono, rival warung</p>' +
      '<p class="empdesc">Tandingi tawarannya Rp50.000 dan ' + d.name + ' tetap di sini (loyalitas +10). Atau biarkan dia pergi.</p>' +
      '<div class="empbtns">' +
      '<button class="btn small green" data-echoice="counter">[1] 🛡️ TANDINGI Rp50rb</button>' +
      '<button class="btn small danger" data-echoice="letgo">[2] 👋 BIARKAN PERGI</button></div></div>';
  }
  el('modal-event').innerHTML = body;
  el('modal-event').style.display = 'flex';
  var btns = document.querySelectorAll('[data-echoice]');
  for (var i = 0; i < btns.length; i++) {
    (function (elm) {
      elm.onclick = function () { answerEvent(elm.getAttribute('data-echoice')); };
    })(btns[i]);
  }
}

function answerEvent(choice) {
  if (!G.event) return;
  var ev = G.event;
  var msg = '';
  if (ev.kind === 'raise') {
    msg = G.staff.answerRaise(ev.staffId, choice);
    if (choice === 'accept') G.money -= 15000;
    if (choice === 'negotiate') G.money -= 7000;
  } else {
    if (choice === 'counter') {
      if (G.money < 50000) { G.msg = 'Uang tidak cukup untuk menandingi tawaran!'; renderHint(); return; }
      G.money -= 50000;
      msg = G.staff.answerPoach(ev.staffId, true);
    } else {
      msg = G.staff.answerPoach(ev.staffId, false);
    }
  }
  G.event = null;
  G.msg = msg;
  closeModals();
  SoundFX.click();
  if (G.screen === 'daydone') renderDayDone();
  else if (G.screen === 'play') renderPlay();
}

/* ---------- input, loop, boot ---------- */
document.addEventListener('keydown', function (e) {
  var k = e.key;
  if (k === 'm' || k === 'M') { G.muted = SoundFX.toggleMute(); return; }
  if (el('modal-event') && el('modal-event').style.display === 'flex') {
    if (G.event && G.event.kind === 'raise') {
      if (k === '1') answerEvent('accept');
      else if (k === '2') answerEvent('negotiate');
      else if (k === '3') answerEvent('refuse');
    } else if (G.event) {
      if (k === '1') answerEvent('counter');
      else if (k === '2') answerEvent('letgo');
    }
    return;
  }
  if (el('modal-profile') && el('modal-profile').style.display === 'flex') {
    if (k === 'Escape') { closeModals(); if (G.screen === 'play') renderPlay(); return; }
    var acts = ['praise', 'bonus', 'dayoff', 'raise', 'train'];
    if (k >= '1' && k <= '5' && G.profileId) staffAction(acts[parseInt(k, 10) - 1], G.profileId);
    return;
  }
  if (G.screen === 'title') {
    if (k === 'Enter') startGame();
    else if (k === 'h' || k === 'H') { showScreen('howto'); renderHowto(); }
  } else if (G.screen === 'howto') {
    if (k === 'Enter' || k === 'Escape') showScreen('title');
  } else if (G.screen === 'play') {
    if (k >= '1' && k <= '4') selectOrder(parseInt(k, 10) - 1);
    else if (k === 'q' || k === 'Q') startStep('CHOP');
    else if (k === 'w' || k === 'W') startStep('FRY');
    else if (k === 'e' || k === 'E') startStep('GRILL');
    else if (k === 'r' || k === 'R') startStep('BOIL');
    else if (k === ' ') { e.preventDefault(); serveOrder(); }
    else if (k === 'p' || k === 'P') { G.paused = !G.paused; G.msg = G.paused ? '⏸ Jeda. Tekan P untuk lanjut.' : '▶ Lanjut!'; renderHint(); }
    else if (k === 'h' || k === 'H') { showScreen('howto'); renderHowto(); }
  } else if (G.screen === 'daydone') {
    if (k === 'Enter') nextDay();
  } else if (G.screen === 'over') {
    if (k === 'Enter') startGame();
  }
});

setInterval(function () { tick(0.1); }, 100);

window.addEventListener('load', function () {
  showScreen('title');
  renderTitle();
});

/* Test/debug hook used by the maker's Playwright play-tests and shots. */
window.WK = {
  state: G,
  startGame: startGame, startDay: startDay, endDay: endDay, nextDay: nextDay,
  selectOrder: selectOrder, startStep: startStep, serveOrder: serveOrder,
  hire: function (id) { return G.staff.hire(id, G.money); },
  setLoyalty: function (id, v) { G.staff.members[id].loyalty = v; },
  triggerRaise: function (id) { G.event = { kind: 'raise', staffId: id }; if (G.screen === 'daydone') openEvent('raise', id); return G.staff.raiseReason(G.staff.members[id]); },
  triggerPoach: function (id) { G.event = { kind: 'poach', staffId: id }; if (G.screen === 'daydone') openEvent('poach', id); return 'poach'; },
  setTime: function (s) { G.timeLeft = s; },
  setMoney: function (n) { G.money = n; },
  openProfile: openProfile, openEvent: openEvent
};
