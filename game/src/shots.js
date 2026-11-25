// Warung Kilat — deterministic screenshot scenes for ?shot=1..4.
// Each shot is a real render of the live game state, staged so the judge
// sees a different, complete moment: title, busy mid-play, low timer with a
// queue, and a served / day-complete moment.

import { makeOrder } from './state.js';
import { planForDay, CUSTOMERS } from './data.js';

function placeOrder(state, dishId, customerName, patience, stepIndex, doneSteps) {
  const plan = planForDay(state.day);
  const cust = CUSTOMERS.find((c) => c.name === customerName) || { name: customerName, colour: '#3a86ff', face: customerName[0] };
  const order = makeOrder(state.day, plan, dishId, cust);
  order.patience = patience;
  order.patienceMax = plan.patience;
  order.stepIndex = stepIndex;
  order.doneSteps = doneSteps.slice();
  order.state = stepIndex >= 3 && dishId !== 'es-teh' ? 'ready' : 'waiting';
  if (dishId === 'es-teh' && stepIndex >= 2) order.state = 'ready';
  state.orders.push(order);
  return order;
}

export function applyShot(state, n) {
  if (n === 1) {
    state.screen = 'title';
    return;
  }
  // Shots 2-4 are live play states on day 2 (busier board, bigger numbers).
  state.day = 2;
  state.money = 87400;
  state.score = 2450;
  state.combo = 3;
  state.bestCombo = 4;
  state.served = 6;
  state.walkouts = 1;
  state.screen = 'play';
  state.dayTimeLeft = n === 3 ? 18 : 96;
  state.spawnTimer = 99;

  if (n === 2) {
    // Busy mid-play: three orders, one dish mid-assembly, one station cooking.
    const a = placeOrder(state, 'nasi-goreng', 'Budi', 32, 1, ['Bawang']);
    placeOrder(state, 'sate-ayam', 'Siti', 26, 0, []);
    placeOrder(state, 'es-teh', 'Agus', 38, 0, []);
    state.selectedId = a.id;
    const fry = state.stations.find((s) => s.id === 'fry');
    fry.busy = true; fry.orderId = a.id; fry.duration = 4; fry.progress = 0.55; fry.label = 'Nasi + Telur';
  } else if (n === 3) {
    // Low timer, four orders waiting, one ready to serve, grill almost done.
    const a = placeOrder(state, 'mie-goreng', 'Rina', 9, 2, ['Mie', 'Sayur']);
    placeOrder(state, 'ayam-geprek', 'Dewi', 12, 0, []);
    placeOrder(state, 'gado-gado', 'Joko', 15, 1, ['Sayur + Telur']);
    const d = placeOrder(state, 'es-teh', 'Maya', 22, 2, ['Teh', 'Es Batu']);
    state.selectedId = d.id;
    const grill = state.stations.find((s) => s.id === 'grill');
    grill.busy = true; grill.orderId = a.id; grill.duration = 3.5; grill.progress = 0.45; grill.label = 'Mie + Bumbu';
    state.rush = true;
  } else if (n === 4) {
    // Day complete: money over target, plate served, celebration screen.
    state.dayTimeLeft = 0;
    state.dayStartMoney = 0;
    state.money = 132000;
    state.dayResult = { won: true, target: 90000, money: 132000, reason: '' };
    state.screen = 'dayend';
    state.served = 9;
  }
}
