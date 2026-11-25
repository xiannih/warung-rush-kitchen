'use strict';
/* Warung Kilat — Rush Hour Kitchen. DOM game, no canvas, no network. */
(function () {
  var DISHES = window.WARUNG_DISHES;
  var INGREDIENTS = window.WARUNG_INGREDIENTS;
  var CUSTOMERS = window.WARUNG_CUSTOMERS;
  var SOUND = window.WarungSound;

  var STATIONS = [
    { id: 'CHOP', key: 'Q', name: 'CHOP', role: 'Talenan',
      icon: '<svg viewBox="0 0 52 40"><rect x="6" y="14" width="30" height="9" rx="4" fill="#8a5a2b"/><rect x="34" y="17" width="12" height="4" rx="2" fill="#5b3a1e"/><rect x="12" y="28" width="26" height="5" rx="2" fill="#c89b3c"/></svg>' },
    { id: 'FRY', key: 'W', name: 'FRY', role: 'Wajan',
      icon: '<svg viewBox="0 0 52 40"><path d="M8 14 h30 a4 4 0 0 1 -4 6 h-22 a4 4 0 0 1 -4 -6 z" fill="#e8491d"/><path d="M12 20 q14 14 28 0" fill="none" stroke="#f2a93b" stroke-width="4"/><line x1="38" y1="16" x2="48" y2="8" stroke="#5b3a1e" stroke-width="4" stroke-linecap="round"/></svg>' },
    { id: 'GRILL', key: 'E', name: 'GRILL', role: 'Panggangan',
      icon: '<svg viewBox="0 0 52 40"><rect x="8" y="16" width="36" height="14" rx="3" fill="#5b4a33"/><circle cx="16" cy="12" r="3" fill="#e8491d"/><circle cx="26" cy="9" r="3" fill="#f2a93b"/><circle cx="36" cy="12" r="3" fill="#e8491d"/><line x1="14" y1="20" x2="14" y2="26" stroke="#f7c948" stroke-width="2"/><line x1="26" y1="20" x2="26" y2="26" stroke="#f7c948" stroke-width="2"/><line x1="38" y1="20" x2="38" y2="26" stroke="#f7c948" stroke-width="2"/></svg>' },
    { id: 'BOIL', key: 'R', name: 'BOIL', role: 'Panci',
      icon: '<svg viewBox="0 0 52 40"><rect x="10" y="14" width="32" height="18" rx="4" fill="#5b7fa6"/><rect x="6" y="18" width="6" height="4" rx="2" fill="#3a5a7a"/><rect x="40" y="18" width="6" height="4" rx="2" fill="#3a5a7a"/><circle cx="20" cy="8" r="3" fill="#a8d8ea"/><circle cx="30" cy="6" r="3" fill="#a8d8ea"/></svg>' }
  ];

  var DAY_PLAN = [
    { day: 1, target: 60000, time: 120, spawn: 9 },
    { day: 2, target: 90000, time: 120, spawn: 8 },
    { day: 3, target: 130000, time: 110, spawn: 7 },
    { day: 4, target: 170000, time: 110, spawn: 6 },
    { day: 5, target: 220000, time: 100, spawn: 6 }
  ];

  function $(id) { return document.getElementById(id); }
  function fmtRp(n) { return 'Rp' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function fmtClock(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function dishById(id) { for (var i = 0; i < DISHES.length; i++) if (DISHES[i].id === id) return DISHES[i]; return DISHES[0]; }

  var G = {
    screen: 'title', day: 1, dayTime: 120, target: 60000, spawnIn: 6,
    money: 0, dayMoney: 0, foodMoney: 0, tipMoney: 0, score: 0,
    combo: 0, bestCombo: 0, served: 0, walkouts: 0,
    orders: [], selected: null, stations: {}, seq: 0, frozen: false,
    paused: false, dayDishes: {}, overReason: ''
  };
  STATIONS.forEach(function (st) { G.stations[st.id] = { busy: false, label: '', progress: 0, orderId: null }; });

  var els = { tickets: [], stations: {} };

  /* ---------- static DOM ---------- */
  function buildDishRow() {
    $('dish-row').innerHTML = DISHES.map(function (d) {
      return '<div class="dish-card"><div class="plate">' + d.icon + '</div>' +
        '<p class="dish-name">' + esc(d.name) + '</p>' +
        '<p class="dish-price">' + fmtRp(d.price) + '</p>' +
        '<p class="dish-steps">' + d.steps.length + ' langkah</p></div>';
    }).join('');
  }
  function buildHelp() {
    var lines = [
      '<b>1–4</b> — pilih pesanan di order board',
      '<b>Q / W / E / R</b> — masak di stasiun CHOP / FRY / GRILL / BOIL',
      '<b>SPASI</b> — sajikan hidangan yang sudah lengkap',
      '<b>P</b> — jeda &nbsp;·&nbsp; <b>M</b> — suara &nbsp;·&nbsp; <b>H</b> — bantuan',
      'Sajikan sebelum bar kesabaran habis — tips makin besar.',
      'Capai target uang hari itu. 3 pelanggan pergi = warung tutup.'
    ];
    $('help-box').innerHTML = lines.map(function (l) { return '<p class="help-line">' + l + '</p>'; }).join('');
  }
  function buildBoard() {
    var row = $('board-row');
    row.innerHTML = '';
    els.tickets = [];
    for (var i = 0; i < 4; i++) {
      var t = document.createElement('div');
      t.className = 'ticket';
      t.dataset.slot = String(i);
      t.addEventListener('click', (function (slot) { return function () { selectOrder(slot); }; })(i));
      row.appendChild(t);
      els.tickets.push(t);
    }
  }
  function buildStations() {
    var row = $('station-row');
    row.innerHTML = '';
    STATIONS.forEach(function (st) {
      var d = document.createElement('div');
      d.className = 'station';
      d.id = 'station-' + st.id;
      d.innerHTML = '<div class="st-icon">' + st.icon + '</div>' +
        '<p class="st-name">' + st.name + ' [' + st.key + ']</p>' +
        '<p class="st-role">' + st.role + '</p>' +
        '<p class="st-status">Siap</p>' +
        '<div class="st-bar"><div class="st-fill" style="width:0%"></div></div>' +
        '<p class="st-prog">&nbsp;</p>';
      d.addEventListener('click', function () { startStep(st.id); });
      row.appendChild(d);
      els.stations[st.id] = d;
    });
  }
  function buildPantry() {
    $('pantry').innerHTML = INGREDIENTS.map(function (ing) {
      return '<div class="pantry-chip" data-ing="' + esc(ing.name) + '">' +
        '<span class="dot" style="background:' + ing.color + '"></span>' + esc(ing.name) + '</div>';
    }).join('');
  }

  /* ---------- screens ---------- */
  function show(name) {
    G.screen = name;
    ['title', 'help', 'play', 'done', 'over'].forEach(function (n) {
      $('screen-' + n).hidden = (n !== name);
    });
    render();
  }
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 1600);
  }

  /* ---------- game flow ---------- */
  function plan() { return DAY_PLAN[Math.min(G.day, 5) - 1]; }
  function startGame() {
    G.day = 1; G.money = 0; G.score = 0; G.combo = 0; G.bestCombo = 0;
    G.served = 0; G.walkouts = 0; G.dayDishes = {};
    beginDay();
    show('play');
  }
  function beginDay() {
    var p = plan();
    G.target = p.target; G.dayTime = p.time; G.spawnIn = 3;
    G.dayMoney = 0; G.foodMoney = 0; G.tipMoney = 0;
    G.walkouts = 0; G.orders = []; G.selected = null; G.dayDishes = {};
    STATIONS.forEach(function (st) { G.stations[st.id] = { busy: false, label: '', progress: 0, orderId: null }; });
    spawnOrder(); spawnOrder();
    render();
  }
  function nextDay() {
    G.day = Math.min(G.day + 1, 5);
    beginDay();
    show('play');
  }
  function spawnOrder() {
    if (G.orders.length >= 4) return;
    var cust = CUSTOMERS[G.seq % CUSTOMERS.length];
    var dish = DISHES[(G.seq * 5 + G.day) % DISHES.length];
    G.seq++;
    var patience = 30 + ((G.seq * 7) % 11);
    G.orders.push({
      id: G.seq, customer: cust.name, color: cust.color, dishId: dish.id,
      patience: patience, maxPatience: patience, stepsDone: 0
    });
    if (G.selected === null) G.selected = 0;
  }
  function selectedOrder() {
    if (G.selected === null) return null;
    return G.orders[G.selected] || null;
  }
  function selectOrder(slot) {
    if (slot < G.orders.length) { G.selected = slot; SOUND.click(); render(); }
  }
  function nextStepOf(order) {
    var dish = dishById(order.dishId);
    return order.stepsDone < dish.steps.length ? dish.steps[order.stepsDone] : null;
  }
  function startStep(stationId) {
    if (G.screen !== 'play' || G.paused) return;
    var order = selectedOrder();
    if (!order) { toast('Pilih pesanan dulu (1–4).'); return; }
    var step = nextStepOf(order);
    if (!step) { toast('Hidangan sudah lengkap — sajikan!'); return; }
    if (step.station !== stationId) { toast('Langkah berikutnya: ' + step.station + '.'); return; }
    var st = G.stations[stationId];
    if (st.busy) { toast(stationId + ' sedang dipakai.'); return; }
    st.busy = true; st.progress = 0; st.label = step.label; st.orderId = order.id;
    SOUND.click();
    render();
  }
  function serve() {
    if (G.screen !== 'play' || G.paused) return;
    var order = selectedOrder();
    if (!order) return;
    if (nextStepOf(order)) { toast('Belum lengkap — masak dulu.'); return; }
    var dish = dishById(order.dishId);
    var tip = Math.round(dish.price * 0.3 * (order.patience / order.maxPatience));
    var total = dish.price + tip;
    G.money += total; G.dayMoney += total; G.foodMoney += dish.price; G.tipMoney += tip;
    G.score += 100 + G.combo * 25;
    G.combo += 1; if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    G.served += 1;
    G.dayDishes[dish.id] = (G.dayDishes[dish.id] || 0) + 1;
    G.orders.splice(G.selected, 1);
    if (G.selected >= G.orders.length) G.selected = G.orders.length ? G.orders.length - 1 : null;
    SOUND.serve();
    toast('Disajikan: ' + dish.name + ' +' + fmtRp(total));
    render();
  }
  function dayComplete() {
    SOUND.dayDone();
    $('done-title').textContent = '🎉 HARI ' + G.day + ' SELESAI!';
    $('done-sub').textContent = 'Target ' + fmtRp(G.target) + ' tercapai — warung makin ramai!';
    var rows = DISHES.filter(function (d) { return G.dayDishes[d.id]; }).map(function (d) {
      return '<div class="done-dish-row"><span class="mini">' + d.icon + '</span>' +
        '<span class="d-name">' + esc(d.name) + '</span>' +
        '<span class="d-count">x' + G.dayDishes[d.id] + '</span>' +
        '<span class="d-price">' + fmtRp(d.price * G.dayDishes[d.id]) + '</span></div>';
    }).join('');
    $('done-dishes').innerHTML = rows || '<p class="done-total">Belum ada hidangan.</p>';
    $('done-total-dishes').textContent = 'Total disajikan: ' + G.served + ' piring';
    $('done-food').textContent = fmtRp(G.foodMoney);
    $('done-tips').textContent = fmtRp(G.tipMoney);
    $('done-money').textContent = fmtRp(G.dayMoney);
    $('done-stats').innerHTML =
      '<div><p class="s-label">Disajikan</p><p class="s-value">' + G.served + '</p></div>' +
      '<div><p class="s-label">Pelanggan pergi</p><p class="s-value">' + G.walkouts + '</p></div>' +
      '<div><p class="s-label">Kombo terbaik</p><p class="s-value">x' + G.bestCombo + '</p></div>' +
      '<div><p class="s-label">Skor</p><p class="s-value">' + G.score + '</p></div>';
    $('done-target').textContent = 'Target ' + fmtRp(G.target) + ' vs dapat ' + fmtRp(G.dayMoney);
    $('done-target-fill').style.width = Math.min(100, Math.round(G.dayMoney / G.target * 100)) + '%';
    var nx = plan();
    var nextDayNum = Math.min(G.day + 1, 5);
    var np = DAY_PLAN[nextDayNum - 1];
    $('done-next').textContent = 'BESOK — HARI ' + nextDayNum + ': target ' + fmtRp(np.target) +
      ' · pelanggan tiap ' + np.spawn + ' dtk · lebih tidak sabar';
    show('done');
  }
  function gameOver(reason) {
    G.overReason = reason;
    SOUND.walkout();
    $('over-sub').textContent = reason;
    $('over-box').innerHTML =
      'Hari: ' + G.day + ' &nbsp;·&nbsp; Uang: ' + fmtRp(G.money) + '<br>' +
      'Disajikan: ' + G.served + ' &nbsp;·&nbsp; Pelanggan pergi: ' + G.walkouts + '<br>' +
      'Skor: ' + G.score + ' &nbsp;·&nbsp; Kombo terbaik: x' + G.bestCombo;
    show('over');
  }

  /* ---------- tick ---------- */
  function tick() {
    if (G.screen !== 'play' || G.paused || G.frozen) return;
    G.dayTime -= 0.1;
    G.spawnIn -= 0.1;
    if (G.spawnIn <= 0) { spawnOrder(); G.spawnIn = plan().spawn; }
    var gone = null;
    G.orders.forEach(function (o) { o.patience -= 0.1; if (o.patience <= 0 && !gone) gone = o; });
    STATIONS.forEach(function (st) {
      var s = G.stations[st.id];
      if (!s.busy) return;
      s.progress += 0.1 / 2.2;
      if (s.progress >= 1) {
        s.progress = 1; s.busy = false;
        var order = null;
        G.orders.forEach(function (o) { if (o.id === s.orderId) order = o; });
        if (order) { order.stepsDone += 1; SOUND.step(); }
        s.label = ''; s.orderId = null;
      }
    });
    if (gone) {
      G.orders = G.orders.filter(function (o) { return o.id !== gone.id; });
      if (G.selected !== null && G.selected >= G.orders.length) G.selected = G.orders.length ? G.orders.length - 1 : null;
      G.walkouts += 1; G.combo = 0;
      toast(gone.customer + ' pergi — sabar habis!');
      if (G.walkouts >= 3) { render(); gameOver('3 pelanggan pergi — warung tutup hari ini.'); return; }
    }
    if (G.dayTime <= 0) {
      G.dayTime = 0;
      if (G.dayMoney >= G.target) { render(); dayComplete(); return; }
      render(); gameOver('Target ' + fmtRp(G.target) + ' tidak tercapai.');
      return;
    }
    render();
  }
  setInterval(tick, 100);

  /* ---------- render ---------- */
  function render() {
    if (G.screen === 'play') renderPlay();
  }
  function renderPlay() {
    var rush = G.dayTime <= 20;
    var tb = $('topbar');
    tb.classList.toggle('rush', rush);
    var pips = 'Pergi: ' + '●'.repeat(G.walkouts) + '○'.repeat(Math.max(0, 3 - G.walkouts));
    tb.innerHTML =
      '<span class="brand">🍜 WARUNG KILAT</span><span>HARI ' + G.day + '</span>' +
      '<span>⏱ ' + fmtClock(G.dayTime) + '</span>' +
      (rush ? '<span style="color:#c8102e">⚠ RUSH HOUR!</span>' : '') +
      '<span>TARGET ' + fmtRp(G.target) + '</span>' +
      '<span class="money">💰 ' + fmtRp(G.money) + '</span>' +
      '<span class="spacer"></span>' +
      '<span>SKOR ' + G.score + '</span><span class="combo">COMBO x' + G.combo + '</span>' +
      '<span class="pips">' + pips + '</span>';
    els.tickets.forEach(function (t, slot) {
      var o = G.orders[slot];
      if (!o) {
        t.className = 'ticket empty';
        t.innerHTML = '<p>— kosong —</p><p style="font-size:13px;margin-top:4px">pesanan berikutnya segera datang</p>';
        return;
      }
      var dish = dishById(o.dishId);
      var pct = Math.max(0, Math.round(o.patience / o.maxPatience * 100));
      var ready = !nextStepOf(o);
      t.className = 'ticket' + (G.selected === slot ? ' sel' : '');
      t.innerHTML =
        '<p class="t-name"><span class="t-ava" style="background:' + o.color + '">' + esc(o.customer.charAt(0)) + '</span>' +
        esc(o.customer) + '<span class="t-num">' + (slot + 1) + '</span></p>' +
        '<p class="t-dish">' + esc(dish.name) + '</p>' +
        '<p class="t-desc">' + esc(dish.desc) + '</p>' +
        '<div class="t-bar"><div class="t-fill' + (pct < 35 ? ' low' : '') + '" style="width:' + pct + '%"></div></div>' +
        '<p class="t-foot"><span>' + Math.ceil(o.patience) + ' dtk</span>' +
        (ready ? '<span class="t-ready">✓ SIAP! [SPASI]</span>' : '<span>Langkah ' + o.stepsDone + '/' + dish.steps.length + '</span>') + '</p>';
    });
    STATIONS.forEach(function (st) {
      var s = G.stations[st.id];
      var d = els.stations[st.id];
      var order = selectedOrder();
      var next = order ? nextStepOf(order) : null;
      d.classList.toggle('next', !!(next && next.station === st.id && !s.busy));
      d.classList.toggle('busy', s.busy);
      var statusEl = d.querySelector('.st-status');
      var fillEl = d.querySelector('.st-fill');
      var progEl = d.querySelector('.st-prog');
      if (s.busy) {
        statusEl.textContent = 'Memasak…';
        statusEl.classList.add('working');
        fillEl.style.width = Math.round(s.progress * 100) + '%';
        progEl.textContent = s.label + ' · ' + Math.round(s.progress * 100) + '%';
      } else {
        statusEl.textContent = 'Siap';
        statusEl.classList.remove('working');
        fillEl.style.width = '0%';
        progEl.innerHTML = '&nbsp;';
      }
    });
    var order = selectedOrder();
    var plate = $('plate-panel');
    var serve = $('serve-panel');
    if (!order) {
      plate.innerHTML = '<div class="plate"><span style="font-size:44px">🍽</span></div>' +
        '<div class="plate-info"><p class="p-dish">Belum ada pesanan</p>' +
        '<p class="p-desc">Klik pesanan di order board untuk mulai masak.</p></div>';
      serve.className = 'serve-panel';
      serve.innerHTML = '<p class="s-big">SAJIKAN</p><p class="s-note">Pilih pesanan dulu.</p><p class="s-meta">Disajikan: ' + G.served + ' · Kombo terbaik: x' + G.bestCombo + '</p>';
    } else {
      var dish = dishById(order.dishId);
      var chips = dish.steps.map(function (step, i) {
        var cls = i < order.stepsDone ? 'done' : (i === order.stepsDone ? 'now' : '');
        var mark = i < order.stepsDone ? '✓ ' : (i === order.stepsDone ? '▶ ' : '');
        return '<span class="chip-step ' + cls + '">' + mark + step.station + ': ' + esc(step.label) + '</span>';
      }).join('');
      var nxt = nextStepOf(order);
      plate.innerHTML = '<div class="plate">' + dish.icon + '</div>' +
        '<div class="plate-info"><p class="p-dish">' + esc(dish.name) + ' — untuk ' + esc(order.customer) + '</p>' +
        '<p class="p-desc">' + esc(dish.desc) + ' · ' + fmtRp(dish.price) + '</p>' +
        '<div class="plate-chips">' + chips + '</div>' +
        (nxt
          ? '<p class="plate-next">Berikutnya: ' + nxt.station + ' [' + stationKey(nxt.station) + '] — ' + esc(nxt.label) + '</p>'
          : '<p class="plate-next">✓ Semua langkah selesai — sajikan di kanan! →</p>') + '</div>';
      if (!nxt) {
        var tip = Math.round(dish.price * 0.3 * (order.patience / order.maxPatience));
        serve.className = 'serve-panel ready';
        serve.innerHTML = '<p class="s-big">🍽 SAJIKAN!</p>' +
          '<p class="s-dish">' + esc(dish.name) + ' · ' + fmtRp(dish.price + tip) + '</p>' +
          '<p class="s-note">termasuk tip ' + fmtRp(tip) + ' — tekan SPASI</p>' +
          '<p class="s-meta">Disajikan: ' + G.served + ' · Kombo terbaik: x' + G.bestCombo + '</p>';
      } else {
        serve.className = 'serve-panel';
        serve.innerHTML = '<p class="s-big">SAJIKAN</p>' +
          '<p class="s-note">Selesaikan semua langkah</p><p class="s-note">masak dulu, baru sajikan.</p>' +
          '<p class="s-meta">Disajikan: ' + G.served + ' · Kombo terbaik: x' + G.bestCombo + '</p>';
      }
    }
    var need = order ? nextStepOf(order) : null;
    var needIng = need ? need.label.split(' ')[0] : null;
    document.querySelectorAll('.pantry-chip').forEach(function (chip) {
      chip.classList.toggle('need', needIng !== null && chip.dataset.ing === needIng);
    });
  }
  function stationKey(id) {
    for (var i = 0; i < STATIONS.length; i++) if (STATIONS[i].id === id) return STATIONS[i].key;
    return '';
  }

  /* ---------- input ---------- */
  document.addEventListener('keydown', function (e) {
    var k = e.key.toUpperCase();
    if (G.screen === 'title' && (k === 'ENTER' || k === 'H')) { e.preventDefault(); if (k === 'H') show('help'); else startGame(); return; }
    if (G.screen === 'help' && (k === 'ESCAPE' || k === 'ENTER')) { e.preventDefault(); show('title'); return; }
    if (G.screen === 'done' && k === 'ENTER') { e.preventDefault(); if (G.day >= 5) startGame(); else nextDay(); return; }
    if (G.screen === 'over' && k === 'ENTER') { e.preventDefault(); startGame(); return; }
    if (G.screen !== 'play') return;
    if (k === ' ') { e.preventDefault(); serve(); return; }
    if (k >= '1' && k <= '4') { selectOrder(Number(k) - 1); return; }
    if (k === 'P') { G.paused = !G.paused; toast(G.paused ? 'Jeda — tekan P lagi.' : 'Lanjut!'); render(); return; }
    if (k === 'M') { toast(SOUND.toggleMute() ? 'Suara mati.' : 'Suara hidup.'); return; }
    if (k === 'H') { show('help'); return; }
    STATIONS.forEach(function (st) { if (st.key === k) startStep(st.id); });
  });
  $('btn-start').addEventListener('click', startGame);
  $('btn-help').addEventListener('click', function () { show('help'); });
  $('btn-back').addEventListener('click', function () { show('title'); });
  $('btn-next-day').addEventListener('click', function () { if (G.day >= 5) startGame(); else nextDay(); });
  $('btn-restart').addEventListener('click', startGame);
  $('serve-panel').addEventListener('click', serve);

  /* ---------- screenshot presets (frozen, deterministic) ---------- */
  function mkOrder(customer, dishId, patience, stepsDone) {
    var cust = null;
    CUSTOMERS.forEach(function (c) { if (c.name === customer) cust = c; });
    var dish = dishById(dishId);
    return { id: ++G.seq, customer: customer, color: cust ? cust.color : '#666', dishId: dishId,
      patience: patience, maxPatience: 40, stepsDone: stepsDone };
  }
  function presetPlay() {
    G.day = 2; G.target = 90000; G.dayTime = 95; G.money = 87400; G.score = 2450;
    G.combo = 3; G.bestCombo = 4; G.served = 6; G.walkouts = 0; G.dayMoney = 87400;
    G.orders = [mkOrder('Budi', 'nasi', 31, 1), mkOrder('Siti', 'sate', 25, 0), mkOrder('Agus', 'esteh', 37, 0)];
    G.selected = 0;
    G.stations.FRY = { busy: true, label: 'Nasi + Telur', progress: 0.84, orderId: G.orders[0].id };
    G.stations.CHOP = { busy: false, label: '', progress: 0, orderId: null };
    G.stations.GRILL = { busy: false, label: '', progress: 0, orderId: null };
    G.stations.BOIL = { busy: false, label: '', progress: 0, orderId: null };
    show('play');
  }
  function presetRush() {
    G.day = 2; G.target = 90000; G.dayTime = 17; G.money = 87400; G.score = 2450;
    G.combo = 3; G.bestCombo = 4; G.served = 6; G.walkouts = 0; G.dayMoney = 87400;
    G.orders = [mkOrder('Rina', 'mie', 8, 2), mkOrder('Dewi', 'geprek', 11, 0), mkOrder('Joko', 'gado', 14, 1), mkOrder('Maya', 'esteh', 21, 2)];
    G.selected = 3;
    G.stations.FRY = { busy: true, label: 'Ayam', progress: 0.77, orderId: G.orders[1].id };
    G.stations.CHOP = { busy: false, label: '', progress: 0, orderId: null };
    G.stations.GRILL = { busy: false, label: '', progress: 0, orderId: null };
    G.stations.BOIL = { busy: false, label: '', progress: 0, orderId: null };
    show('play');
  }
  function presetDone() {
    G.day = 2; G.target = 90000; G.dayMoney = 132000; G.foodMoney = 110000; G.tipMoney = 22000;
    G.money = 132000; G.served = 9; G.walkouts = 1; G.bestCombo = 4; G.score = 2450;
    G.dayDishes = { nasi: 3, sate: 2, esteh: 2, mie: 1, geprek: 1 };
    dayComplete();
  }
  function presetOver() {
    G.day = 2; G.money = 87400; G.served = 6; G.walkouts = 3; G.bestCombo = 4; G.score = 2450;
    gameOver('3 pelanggan pergi — warung tutup hari ini.');
  }
  function applyShot() {
    var q = new URLSearchParams(window.location.search);
    var shot = q.get('shot');
    if (!shot) return;
    G.frozen = true;
    if (shot === 'title') show('title');
    else if (shot === 'help') show('help');
    else if (shot === 'play') presetPlay();
    else if (shot === 'rush') presetRush();
    else if (shot === 'done') presetDone();
    else if (shot === 'over') presetOver();
  }

  /* ---------- boot ---------- */
  buildDishRow();
  buildHelp();
  buildBoard();
  buildStations();
  buildPantry();
  applyShot();
  if (!G.frozen) show('title');
  render();

  window.WARUNG = {
    get state() { return G; },
    startGame: startGame, selectOrder: selectOrder, startStep: startStep,
    serve: serve, nextDay: nextDay,
    forceDayDone: function () { G.dayMoney = G.target; dayComplete(); },
    forceGameOver: function () { gameOver('3 pelanggan pergi — warung tutup hari ini.'); },
    setTime: function (s) { G.dayTime = s; render(); }
  };
})();
