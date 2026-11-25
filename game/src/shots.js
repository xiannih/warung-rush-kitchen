// shots.js — deterministic staging for screenshots and play-tests.
// The game itself never calls these during normal play; they exist so a
// screenshot can show a real render of a specific moment (a busy mid-play,
// a low-timer rush, a finished day) without waiting for chance to arrange it.
// Every value they set is a value the live game can reach on its own.
(function (global) {
  'use strict';

  var C = global.WarungCatalog;
  var K = global.WarungKitchen;

  function customerNamed(name) {
    for (var i = 0; i < C.CUSTOMERS.length; i++) {
      if (C.CUSTOMERS[i].name === name) return C.CUSTOMERS[i];
    }
    return C.CUSTOMERS[0];
  }

  function makeOrder(k, dishId, customerName, patience, done) {
    var o = K.spawnOrder(k, C.dishById(dishId), customerNamed(customerName), patience);
    o.done = done || 0;
    o.ready = o.done >= o.dish.steps.length;
    return o;
  }

  // Day 2, mid-rush: three tickets, one dish half built, the wok at 84%.
  function stageMid(k) {
    K.startDay(k, 2);
    k.money = 87400;
    k.score = 2450;
    k.combo = 3;
    k.bestCombo = 4;
    k.served = 6;
    k.timeLeft = 95;
    k.orders = [];
    k.nextOrderId = 1;
    makeOrder(k, 'nasi', 'Budi', 31, 1);
    makeOrder(k, 'sate', 'Siti', 25, 0);
    makeOrder(k, 'esteh', 'Agus', 37, 0);
    k.selected = 0;
    k.busy = { station: 'fry', orderId: 1, stepIdx: 1, t: 1.26, dur: 1.5, label: 'Nasi + Telur' };
    k.spawnIn = 6;
    k.flash = '';
    k.frozen = true;
  }

  // The last seconds: 0:17 on the clock, four tickets, one plate ready.
  function stageRush(k) {
    K.startDay(k, 2);
    k.money = 87400;
    k.score = 2450;
    k.combo = 3;
    k.bestCombo = 4;
    k.served = 6;
    k.timeLeft = 17;
    k.orders = [];
    k.nextOrderId = 1;
    makeOrder(k, 'mie', 'Rina', 8, 2);
    makeOrder(k, 'geprek', 'Dewi', 11, 0);
    makeOrder(k, 'gado', 'Joko', 14, 1);
    makeOrder(k, 'esteh', 'Maya', 21, 2);
    k.selected = 3;
    k.busy = { station: 'fry', orderId: 2, stepIdx: 0, t: 1.15, dur: 1.5, label: 'Ayam digoreng' };
    k.spawnIn = 6;
    k.flash = '';
    k.frozen = true;
  }

  // A finished day with a full ledger to show for it.
  function stageDayDone(k) {
    K.startDay(k, 2);
    k.money = 132000;
    k.dayMoney = 132000;
    k.score = 2450;
    k.served = 9;
    k.walkouts = 1;
    k.bestCombo = 4;
    k.dayStats = {
      food: 110000,
      tips: 22000,
      served: 9,
      walkouts: 1,
      bestCombo: 4,
      perDish: { 'NASI GORENG': 3, 'SATE AYAM': 2, 'ES TEH MANIS': 2, 'MIE GORENG': 1, 'AYAM GEPREK': 1 }
    };
    k.screen = 'daydone';
    k.busy = null;
    k.orders = [];
  }

  function stageShot(k, name) {
    if (name === 'title') {
      var fresh = K.newKitchen();
      var keys = Object.keys(fresh);
      for (var i = 0; i < keys.length; i++) k[keys[i]] = fresh[keys[i]];
      k.screen = 'title';
      return 'title';
    }
    if (name === 'mid') { stageMid(k); return 'mid'; }
    if (name === 'rush') { stageRush(k); return 'rush'; }
    if (name === 'daydone') { stageDayDone(k); return 'daydone'; }
    return null;
  }

  // A small read-only summary for automated play-tests.
  function snapshot(k) {
    var sel = K.selectedOrder(k);
    return {
      screen: k.screen,
      day: k.day,
      money: k.money,
      dayMoney: k.dayMoney,
      score: k.score,
      combo: k.combo,
      served: k.served,
      walkouts: k.walkouts,
      timeLeft: Math.round(k.timeLeft * 10) / 10,
      target: k.target,
      orders: k.orders.map(function (o) {
        return { dish: o.dish.id, customer: o.customer.name, done: o.done, steps: o.dish.steps.length, ready: o.ready, patience: Math.round(o.patience) };
      }),
      selected: k.selected,
      selectedNext: sel ? (sel.ready ? null : sel.dish.steps[sel.done]) : null,
      busy: k.busy ? { station: k.busy.station, frac: Math.round((k.busy.t / k.busy.dur) * 100) / 100 } : null
    };
  }

  global.WarungShots = { stageShot: stageShot, snapshot: snapshot };
})(typeof window !== 'undefined' ? window : globalThis);
