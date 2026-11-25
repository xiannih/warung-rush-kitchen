// Warung Kilat — game state: screens, orders, stations, plating, money,
// combos, days and win/lose. Pure logic; rendering lives in render.js and
// input lives in input.js. Nothing here touches the DOM except via events.

import {
  DISHES, CUSTOMERS, STATIONS, WALKOUT_LIMIT, TIP_RATE,
  dishById, stationById, planForDay,
} from './data.js';

let orderSeq = 1;

export function makeOrder(day, plan, forcedDishId, forcedCustomer) {
  const dish = forcedDishId
    ? dishById(forcedDishId)
    : DISHES[Math.floor(Math.random() * DISHES.length)];
  const customer = forcedCustomer
    || CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  return {
    id: orderSeq++,
    dishId: dish.id,
    customer,
    patience: plan.patience,
    patienceMax: plan.patience,
    stepIndex: 0,          // next step to cook
    doneSteps: [],         // finished step labels, shown on the plate
    state: 'waiting',      // waiting | ready | served | walked
    bornAt: 0,
  };
}

export class GameState {
  constructor() {
    this.screen = 'title'; // title | howto | play | dayend | gameover
    this.day = 1;
    this.money = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.walkouts = 0;
    this.orders = [];
    this.selectedId = null;
    this.stations = STATIONS.map((s) => ({
      id: s.id, busy: false, orderId: null, progress: 0, duration: 1, label: '',
    }));
    this.dayTimeLeft = 0;
    this.spawnTimer = 0;
    this.message = '';
    this.messageUntil = 0;
    this.now = 0;
    this.paused = false;
    this.dayResult = null; // {won, earned, target}
    this.servedFlash = null;
    this.rush = false;
  }

  plan() {
    return planForDay(this.day);
  }

  startDay(day) {
    this.day = day;
    this.orders = [];
    this.selectedId = null;
    this.stations.forEach((s) => { s.busy = false; s.orderId = null; s.progress = 0; });
    this.walkouts = 0;
    this.dayTimeLeft = this.plan().duration;
    this.dayStartMoney = this.money;
    this.spawnTimer = 1.2;
    this.screen = 'play';
    this.paused = false;
    this.dayResult = null;
    this.rush = false;
    this.flash('Hari ' + day + ' — target ' + fmtMoney(this.plan().target) + '!');
  }

  startGame() {
    this.day = 1;
    this.money = 0;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.startDay(1);
  }

  flash(text, seconds = 2.2) {
    this.message = text;
    this.messageUntil = this.now + seconds;
  }

  selectedOrder() {
    return this.orders.find((o) => o.id === this.selectedId) || null;
  }

  nextStepOf(order) {
    const dish = dishById(order.dishId);
    return dish.steps[order.stepIndex] || null;
  }

  // Start cooking the selected order's next step at a station.
  // Returns 'ok' | 'no-order' | 'wrong-station' | 'busy' | 'done'.
  startStep(stationId) {
    const order = this.selectedOrder();
    if (!order) return 'no-order';
    if (order.state === 'ready') return 'done';
    const step = this.nextStepOf(order);
    if (!step) return 'done';
    if (step.station !== stationId) return 'wrong-station';
    const station = this.stations.find((s) => s.id === stationId);
    if (station.busy) return 'busy';
    station.busy = true;
    station.orderId = order.id;
    station.duration = step.time;
    station.progress = 0;
    station.label = step.ingredient;
    return 'ok';
  }

  // Serve the selected order when every step is cooked.
  serveSelected() {
    const order = this.selectedOrder();
    if (!order || order.state !== 'ready') return null;
    const dish = dishById(order.dishId);
    const patienceFrac = order.patience / order.patienceMax;
    const tip = Math.round(dish.price * TIP_RATE * patienceFrac);
    const earned = dish.price + tip;
    this.money += earned;
    this.score += 100 + Math.round(100 * patienceFrac) + this.combo * 25;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served += 1;
    order.state = 'served';
    this.servedFlash = { dish: dish.name, earned, tip, until: this.now + 1.6 };
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this.selectedId = this.orders.length ? this.orders[0].id : null;
    return { dish, earned, tip };
  }

  // One simulation tick, dt in seconds.
  update(dt) {
    this.now += dt;
    if (this.screen !== 'play' || this.paused) return;

    this.dayTimeLeft -= dt;
    const plan = this.plan();
    this.rush = this.dayTimeLeft <= 30;

    // Spawn new customers while the board has room.
    this.spawnTimer -= dt;
    const active = this.orders.filter((o) => o.state === 'waiting' || o.state === 'ready');
    if (this.spawnTimer <= 0 && active.length < plan.maxOrders && this.dayTimeLeft > 12) {
      this.orders.push(makeOrder(this.day, plan));
      this.spawnTimer = plan.spawnEvery * (0.85 + Math.random() * 0.3);
      if (!this.selectedId && this.orders.length) this.selectedId = this.orders[0].id;
    }

    // Patience drains; an empty bar walks out.
    for (const order of [...this.orders]) {
      order.patience -= dt;
      if (order.patience <= 0) {
        order.state = 'walked';
        this.orders = this.orders.filter((o) => o.id !== order.id);
        this.walkouts += 1;
        this.combo = 0;
        this.flash(order.customer.name + ' pergi! Pesanan hangus.', 2.5);
        this.stations.forEach((s) => {
          if (s.orderId === order.id) { s.busy = false; s.orderId = null; s.progress = 0; }
        });
        if (this.selectedId === order.id) {
          this.selectedId = this.orders.length ? this.orders[0].id : null;
        }
      }
    }

    // Stations cook; a finished step lands on the plate.
    for (const station of this.stations) {
      if (!station.busy) continue;
      station.progress += dt / station.duration;
      if (station.progress >= 1) {
        const order = this.orders.find((o) => o.id === station.orderId);
        if (order) {
          order.doneSteps.push(station.label);
          order.stepIndex += 1;
          if (order.stepIndex >= dishById(order.dishId).steps.length) {
            order.state = 'ready';
            this.flash(order.customer.name + ': ' + dishById(order.dishId).name + ' siap disajikan!', 2.2);
          }
        }
        station.busy = false;
        station.orderId = null;
        station.progress = 0;
      }
    }

    if (this.walkouts >= WALKOUT_LIMIT) {
      this.endDay(false, 'Terlalu banyak pelanggan pergi (' + WALKOUT_LIMIT + ').');
      return;
    }
    if (this.dayTimeLeft <= 0) {
      const earnedToday = this.money - (this.dayStartMoney || 0);
      const won = earnedToday >= plan.target;
      this.endDay(won, won ? '' : 'Target tidak tercapai.');
    }
  }

  endDay(won, reason) {
    this.stations.forEach((s) => { s.busy = false; s.orderId = null; s.progress = 0; });
    this.dayResult = { won, target: this.plan().target, money: this.money - (this.dayStartMoney || 0), reason };
    this.screen = won ? 'dayend' : 'gameover';
  }
}

export function fmtMoney(n) {
  return 'Rp' + Math.round(n).toLocaleString('id-ID');
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
