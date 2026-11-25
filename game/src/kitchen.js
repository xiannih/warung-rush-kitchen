// kitchen.js — the rules of Warung Kilat and nothing else: orders arriving,
// patience running out, steps cooking at the right station, serving for
// coins and tips, combos, walkouts, and the five days getting busier.
// Rendering lives in draw.js; input lives in controls.js.
(function (global) {
  'use strict';

  var C = global.WarungCatalog;
  var Snd = global.WarungSound;

  function blankDayStats() {
    return { food: 0, tips: 0, served: 0, walkouts: 0, bestCombo: 0, perDish: {} };
  }

  function newKitchen() {
    return {
      screen: 'title',        // title | howto | play | daydone | gameover | win
      day: 1,
      money: 0,               // money banked this run (total across days)
      dayMoney: 0,            // money earned today
      score: 0,
      combo: 0,
      bestCombo: 0,
      served: 0,
      walkouts: 0,
      timeLeft: 0,
      target: 0,
      orders: [],             // {dish, customer, patience, maxPatience, done, ready, id}
      selected: -1,
      busy: null,             // {station, orderId, stepIdx, t, dur, label}
      spawnIn: 4,
      flash: '',
      flashT: 0,
      frozen: false,          // staging freeze: stops the clock without the pause overlay
      overReason: '',
      dayStats: blankDayStats(),
      lastServe: null,        // {dishName, customer, total, tip, combo}
      nextOrderId: 1,
      usedCustomers: []
    };
  }

  function dayPlan(k) { return C.DAYS[Math.min(k.day, C.DAYS.length) - 1]; }

  function pickCustomer(k) {
    var pool = C.CUSTOMERS.filter(function (c) { return k.usedCustomers.indexOf(c.name) < 0; });
    if (pool.length === 0) { k.usedCustomers = []; pool = C.CUSTOMERS.slice(); }
    var c = pool[Math.floor(Math.random() * pool.length)];
    k.usedCustomers.push(c.name);
    return c;
  }

  function pickDish() {
    // Es teh is the quick small order; sate is rare and pays best.
    var roll = Math.random();
    var bag = ['nasi', 'mie', 'geprek', 'gado', 'nasi', 'mie', 'sate', 'esteh', 'esteh', 'gado', 'geprek', 'nasi'];
    if (roll < 0.12) return C.dishById('sate');
    return C.dishById(bag[Math.floor(Math.random() * bag.length)]);
  }

  function spawnOrder(k, dish, customer, patience) {
    var plan = dayPlan(k);
    var d = dish || pickDish();
    var p = patience != null ? patience : plan.patience * (0.85 + Math.random() * 0.3);
    var order = {
      id: k.nextOrderId++,
      dish: d,
      customer: customer || pickCustomer(k),
      patience: p,
      maxPatience: p,
      done: 0,
      ready: false
    };
    k.orders.push(order);
    if (k.selected < 0) k.selected = 0;
    Snd.newOrder();
    return order;
  }

  function startDay(k, day) {
    k.day = day;
    var plan = dayPlan(k);
    k.screen = 'play';
    k.timeLeft = plan.seconds;
    k.target = plan.target;
    k.dayMoney = 0;
    k.orders = [];
    k.selected = -1;
    k.busy = null;
    k.spawnIn = 2.5;
    k.flash = '';
    k.dayStats = blankDayStats();
    k.lastServe = null;
    spawnOrder(k);
    spawnOrder(k);
    Snd.startMusic();
  }

  function selectedOrder(k) {
    if (k.selected < 0 || k.selected >= k.orders.length) return null;
    return k.orders[k.selected];
  }

  function nextStep(k, order) {
    if (!order || order.done >= order.dish.steps.length) return null;
    return order.dish.steps[order.done];
  }

  // Start cooking the selected order's next step at a station.
  // Returns 'ok' | 'busy' | 'wrong' | 'none' | 'ready'.
  function cookAt(k, stationId) {
    var order = selectedOrder(k);
    if (!order) return 'none';
    if (order.ready) return 'ready';
    if (k.busy) return 'busy';
    var st = nextStep(k, order);
    if (!st) return 'ready';
    if (st.station !== stationId) {
      k.flash = 'Salah stasiun! ' + order.dish.name + ' butuh ' +
        C.stationById(st.station).name + ' — ' + st.label;
      k.flashT = 1.8;
      Snd.error();
      return 'wrong';
    }
    k.busy = { station: stationId, orderId: order.id, stepIdx: order.done, t: 0, dur: st.seconds, label: st.label };
    if (stationId === 'fry') Snd.sizzle();
    else if (stationId === 'chop') Snd.chop();
    else if (stationId === 'boil') Snd.boil();
    else Snd.grill();
    return 'ok';
  }

  function finishStep(k) {
    var b = k.busy;
    if (!b) return;
    var order = null;
    for (var i = 0; i < k.orders.length; i++) if (k.orders[i].id === b.orderId) order = k.orders[i];
    k.busy = null;
    if (!order) return;
    order.done++;
    if (order.done >= order.dish.steps.length) {
      order.ready = true;
      Snd.ready();
      k.flash = order.dish.name + ' untuk ' + order.customer.name + ' SIAP — tekan SPASI!';
      k.flashT = 2.2;
    } else {
      Snd.stepDone();
    }
  }

  // Serve the selected order if it is plated. Returns the receipt or null.
  function serveSelected(k) {
    var order = selectedOrder(k);
    if (!order || !order.ready) return null;
    var dish = order.dish;
    var patienceFrac = Math.max(0, order.patience / order.maxPatience);
    var tip = Math.round(dish.price * 0.30 * patienceFrac);
    var total = dish.price + tip;
    k.combo++;
    if (k.combo > k.bestCombo) k.bestCombo = k.combo;
    if (k.combo > k.dayStats.bestCombo) k.dayStats.bestCombo = k.combo;
    var comboBonus = (k.combo - 1) * 250;
    total += comboBonus;
    k.money += total;
    k.dayMoney += total;
    k.dayStats.food += dish.price + comboBonus;
    k.dayStats.tips += tip;
    k.dayStats.served++;
    k.dayStats.perDish[dish.name] = (k.dayStats.perDish[dish.name] || 0) + 1;
    k.served++;
    k.score += total + k.combo * 100;
    k.lastServe = { dishName: dish.name, customer: order.customer.name, total: total, tip: tip, combo: k.combo };
    k.orders.splice(k.orders.indexOf(order), 1);
    if (k.selected >= k.orders.length) k.selected = k.orders.length - 1;
    if (k.selected < 0 && k.orders.length > 0) k.selected = 0;
    Snd.coin();
    return k.lastServe;
  }

  function endDay(k, won) {
    if (won) {
      k.screen = k.day >= C.DAYS.length ? 'win' : 'daydone';
      Snd.dayDone();
    } else {
      k.screen = 'gameover';
      Snd.gameOver();
      Snd.stopMusic();
    }
    k.busy = null;
  }

  function tick(k, dt) {
    if (k.screen !== 'play') return;
    if (k.flashT > 0) { k.flashT -= dt; if (k.flashT <= 0) k.flash = ''; }

    k.timeLeft -= dt;
    if (k.timeLeft <= 0) {
      k.timeLeft = 0;
      if (k.dayMoney >= k.target) endDay(k, true);
      else { k.overReason = 'Waktu habis — target ' + C.money(k.target) + ' belum tercapai.'; endDay(k, false); }
      return;
    }

    // Cooking in progress.
    if (k.busy) {
      k.busy.t += dt;
      if (k.busy.t >= k.busy.dur) finishStep(k);
    }

    // Patience drains; a customer who hits zero walks out.
    for (var i = k.orders.length - 1; i >= 0; i--) {
      var o = k.orders[i];
      o.patience -= dt;
      if (o.patience <= 0) {
        var gone = k.orders.splice(i, 1)[0];
        k.walkouts++;
        k.dayStats.walkouts++;
        k.combo = 0;
        k.flash = gone.customer.name + ' pergi! ' + gone.dish.name + ' tidak sempat disajikan.';
        k.flashT = 2.2;
        Snd.walkout();
        if (k.selected >= k.orders.length) k.selected = k.orders.length - 1;
        if (k.walkouts >= C.MAX_WALKOUTS) {
          k.overReason = 'Tiga pelanggan pergi — warung kehilangan kepercayaan.';
          endDay(k, false);
          return;
        }
      }
    }

    // New orders keep arriving while there is room on the board.
    k.spawnIn -= dt;
    if (k.spawnIn <= 0 && k.orders.length < C.MAX_ORDERS) {
      spawnOrder(k);
      k.spawnIn = dayPlan(k).spawnEvery * (0.85 + Math.random() * 0.3);
    }
  }

  global.WarungKitchen = {
    newKitchen: newKitchen,
    startDay: startDay,
    spawnOrder: spawnOrder,
    selectedOrder: selectedOrder,
    nextStep: nextStep,
    cookAt: cookAt,
    serveSelected: serveSelected,
    tick: tick,
    dayPlan: dayPlan,
    endDay: endDay
  };
})(typeof window !== 'undefined' ? window : globalThis);
