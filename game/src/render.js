// Warung Kilat — canvas renderer. Every pixel is drawn by this file:
// the warung kitchen, the order board, the stations, the plate mid-assembly,
// the HUD and all screens. No images are loaded; food is drawn shapes.

import { DISHES, STATIONS, WALKOUT_LIMIT, dishById, stationById } from './data.js';
import { fmtMoney, fmtTime } from './state.js';

export const W = 1280;
export const H = 800;

// Hit areas, shared with input.js so clicks land where the art is.
export const LAYOUT = {
  hud: { x: 0, y: 0, w: W, h: 64 },
  board: { x: 24, y: 76, w: W - 48, h: 148 },
  stations: { x: 24, y: 240, w: W - 48, h: 190 },
  plate: { x: 24, y: 446, w: 760, h: 190 },
  serve: { x: 808, y: 446, w: 448, h: 190 },
  counter: { x: 24, y: 652, w: W - 48, h: 72 },
  footer: { x: 24, y: 736, w: W - 48, h: 48 },
};

function stationRect(i) {
  const n = STATIONS.length;
  const gap = 16;
  const w = (LAYOUT.stations.w - gap * (n - 1)) / n;
  return { x: LAYOUT.stations.x + i * (w + gap), y: LAYOUT.stations.y, w, h: LAYOUT.stations.h };
}

function orderRect(i) {
  const gap = 14;
  const w = 236;
  return { x: LAYOUT.board.x + i * (w + gap), y: LAYOUT.board.y + 24, w, h: 124 };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, colour, weight = 'bold', align = 'left') {
  ctx.fillStyle = colour;
  ctx.font = weight + ' ' + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function patienceColour(frac) {
  if (frac > 0.5) return '#2ec27e';
  if (frac > 0.25) return '#ffb703';
  return '#ef476f';
}

function drawFoodIcon(ctx, dishId, cx, cy, r) {
  // Simple drawn food: a plate with a coloured mound and garnish per dish.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff8e7';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d9a441';
  ctx.stroke();
  const dish = dishById(dishId);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = dish.colour;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - r * 0.2, cy - r * 0.18, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
  if (dishId === 'sate-ayam') {
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy + r * 0.3);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.3);
    ctx.stroke();
  }
  if (dishId === 'es-teh') {
    ctx.fillStyle = '#7fc8e8';
    ctx.fillRect(cx - r * 0.35, cy - r * 0.4, r * 0.7, r * 0.5);
  }
  ctx.restore();
}

function drawStationIcon(ctx, stationId, cx, cy, r) {
  ctx.save();
  ctx.lineWidth = 4;
  if (stationId === 'chop') {
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(cx - r, cy - r * 0.25, r * 2, r * 0.5);
    ctx.strokeStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.7);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.7);
    ctx.stroke();
  } else if (stationId === 'fry') {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#3d3d3d';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#e4572e';
    ctx.fill();
  } else if (stationId === 'grill') {
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(cx - r, cy - r * 0.2, r * 2, r * 0.7);
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy - r * 0.2);
    ctx.lineTo(cx, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = '#5a6b7c';
    ctx.fill();
    ctx.fillStyle = '#a8dadc';
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.5, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCustomerFace(ctx, customer, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = customer.colour;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  text(ctx, customer.face, cx, cy + r * 0.32, Math.round(r * 0.85), '#fff', 'bold', 'center');
  ctx.restore();
}

export function drawGame(ctx, s) {
  // Kitchen wall and floor.
  ctx.fillStyle = '#ffe8c2';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f7c873';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#e07a2f';
  ctx.fillRect(0, 60, W, 4);
  // Awning stripes across the top of the kitchen.
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? '#e4572e' : '#fff3d6';
    ctx.fillRect(i * 80, 64, 80, 12);
  }
  ctx.fillStyle = '#c98f4e';
  ctx.fillRect(0, 652, W, 148);

  drawHUD(ctx, s);
  drawOrderBoard(ctx, s);
  drawStations(ctx, s);
  drawPlate(ctx, s);
  drawServe(ctx, s);
  drawCounter(ctx, s);
  drawFooter(ctx, s);
  if (s.message && s.now < s.messageUntil) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    rr(ctx, W / 2 - 330, 300, 660, 44, 22);
    ctx.fillStyle = '#22223b';
    ctx.fill();
    text(ctx, s.message, W / 2, 330, 22, '#ffd166', 'bold', 'center');
    ctx.restore();
  }
  if (s.servedFlash && s.now < s.servedFlash.until) {
    ctx.save();
    rr(ctx, W / 2 - 240, 350, 480, 52, 14);
    ctx.fillStyle = '#2ec27e';
    ctx.fill();
    text(ctx, 'TERSAJI! ' + s.servedFlash.dish + '  +' + fmtMoney(s.servedFlash.earned) +
      '  (tip ' + fmtMoney(s.servedFlash.tip) + ')', W / 2, 384, 22, '#fff', 'bold', 'center');
    ctx.restore();
  }
  if (s.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'PAUSED — tekan P untuk lanjut', W / 2, H / 2, 34, '#fff', 'bold', 'center');
  }
}

function drawHUD(ctx, s) {
  const plan = s.plan();
  text(ctx, '🍜 WARUNG KILAT', 28, 42, 28, '#7a2e0e', 'bold');
  text(ctx, 'HARI ' + s.day, 300, 42, 24, '#7a2e0e', 'bold');
  const tLeft = s.dayTimeLeft;
  const tCol = tLeft <= 30 ? '#c1121f' : '#7a2e0e';
  text(ctx, '⏱ ' + fmtTime(tLeft), 420, 42, 26, tCol, 'bold');
  text(ctx, 'TARGET ' + fmtMoney(plan.target), 560, 42, 22, '#7a2e0e', 'bold');
  text(ctx, '💰 ' + fmtMoney(s.money), 800, 42, 24, '#14532d', 'bold');
  text(ctx, 'SKOR ' + s.score, 1000, 42, 22, '#22223b', 'bold');
  text(ctx, 'COMBO x' + s.combo, 1130, 42, 22, s.combo >= 2 ? '#c1121f' : '#666', 'bold');
  // Walkout pips, on the HUD's second row so they never cover the combo.
  for (let i = 0; i < WALKOUT_LIMIT; i++) {
    ctx.beginPath();
    ctx.arc(1232 - i * 26, 54, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < s.walkouts ? '#ef476f' : '#fff';
    ctx.fill();
    ctx.strokeStyle = '#7a2e0e';
    ctx.stroke();
  }
  text(ctx, 'pelanggan pergi: ' + s.walkouts + '/' + WALKOUT_LIMIT, 1010, 58, 12, '#7a2e0e');
  if (s.rush) {
    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(s.now * 6);
    text(ctx, '⚠ RUSH HOUR!', 640, 468, 26, '#c1121f', 'bold', 'center');
    ctx.restore();
  }
}

function drawOrderBoard(ctx, s) {
  text(ctx, '📋 ORDER BOARD — klik pesanan (1-4) lalu masak di stasiun', LAYOUT.board.x, 96, 17, '#7a2e0e', 'bold');
  const active = s.orders.filter((o) => o.state === 'waiting' || o.state === 'ready');
  if (!active.length) {
    rr(ctx, LAYOUT.board.x, 104, 320, 96, 12);
    ctx.fillStyle = '#fff8e7';
    ctx.fill();
    text(ctx, 'Belum ada pesanan…', LAYOUT.board.x + 20, 160, 20, '#8a6d3b', 'bold');
    text(ctx, 'Pelanggan segera datang!', LAYOUT.board.x + 20, 188, 15, '#8a6d3b');
    return;
  }
  active.forEach((order, i) => {
    const r = orderRect(i);
    const dish = dishById(order.dishId);
    const selected = order.id === s.selectedId;
    rr(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fillStyle = selected ? '#fff3d6' : '#fffdf5';
    ctx.fill();
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeStyle = order.state === 'ready' ? '#2ec27e' : (selected ? '#e4572e' : '#d9a441');
    ctx.stroke();
    drawCustomerFace(ctx, order.customer, r.x + 32, r.y + 30, 22);
    text(ctx, order.customer.name, r.x + 62, r.y + 26, 17, '#22223b', 'bold');
    text(ctx, (i + 1) + '', r.x + r.w - 20, r.y + 24, 15, '#999', 'bold');
    text(ctx, dish.name, r.x + 62, r.y + 50, 19, '#7a2e0e', 'bold');
    text(ctx, dish.desc, r.x + 14, r.y + 72, 12, '#666');
    // Patience bar.
    const frac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = '#e5d9c3';
    rr(ctx, r.x + 14, r.y + 82, r.w - 28, 12, 6);
    ctx.fill();
    ctx.fillStyle = patienceColour(frac);
    if (frac > 0) { rr(ctx, r.x + 14, r.y + 82, (r.w - 28) * frac, 12, 6); ctx.fill(); }
    text(ctx, Math.ceil(order.patience) + ' dtk', r.x + 14, r.y + 112, 13, '#7a2e0e', 'bold');
    if (order.state === 'ready') {
      text(ctx, '✓ SIAP! [SPASI]', r.x + 104, r.y + 112, 13, '#1d7a4a', 'bold');
    } else {
      text(ctx, 'langkah ' + order.stepIndex + '/' + dish.steps.length, r.x + 116, r.y + 112, 12, '#666');
    }
  });
}

function drawStations(ctx, s) {
  text(ctx, '🔥 STASIUN MASAK — klik stasiun (Q/W/E/R) untuk langkah berikutnya', LAYOUT.stations.x, 232, 17, '#7a2e0e', 'bold');
  STATIONS.forEach((st, i) => {
    const r = stationRect(i);
    const stState = s.stations.find((x) => x.id === st.id);
    const sel = s.selectedOrder();
    const next = sel ? s.nextStepOf(sel) : null;
    const isNext = next && next.station === st.id && sel.state !== 'ready';
    rr(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fillStyle = stState.busy ? '#ffe1c2' : (isNext ? '#fff8e7' : '#f3e2c7');
    ctx.fill();
    ctx.lineWidth = isNext ? 4 : 2;
    ctx.strokeStyle = isNext ? '#2ec27e' : '#b08954';
    ctx.stroke();
    drawStationIcon(ctx, st.id, r.x + r.w / 2, r.y + 52, 30);
    text(ctx, st.name + '  [' + st.key + ']', r.x + r.w / 2, r.y + 104, 20, '#7a2e0e', 'bold', 'center');
    text(ctx, st.label, r.x + r.w / 2, r.y + 128, 15, '#8a6d3b', 'bold', 'center');
    if (stState.busy) {
      ctx.fillStyle = '#e5d9c3';
      rr(ctx, r.x + 18, r.y + 146, r.w - 36, 16, 8);
      ctx.fill();
      ctx.fillStyle = st.colour;
      rr(ctx, r.x + 18, r.y + 146, (r.w - 36) * Math.min(1, stState.progress), 16, 8);
      ctx.fill();
      text(ctx, stState.label + '… ' + Math.round(stState.progress * 100) + '%', r.x + r.w / 2, r.y + 182, 14, '#7a2e0e', 'bold', 'center');
    } else if (isNext) {
      text(ctx, '▶ ' + next.ingredient, r.x + r.w / 2, r.y + 168, 15, '#1d7a4a', 'bold', 'center');
    } else {
      text(ctx, 'menganggur', r.x + r.w / 2, r.y + 168, 14, '#a08c6a', 'bold', 'center');
    }
  });
}

function drawPlate(ctx, s) {
  const r = LAYOUT.plate;
  text(ctx, '🍽 PIRING — hidangan sedang dirakit', r.x, 466, 17, '#7a2e0e', 'bold');
  rr(ctx, r.x, r.y + 28, r.w, r.h - 28, 14);
  ctx.fillStyle = '#fffdf5';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d9a441';
  ctx.stroke();
  const order = s.selectedOrder();
  if (!order) {
    text(ctx, 'Pilih pesanan di order board dulu.', r.x + 24, r.y + 100, 20, '#8a6d3b', 'bold');
    return;
  }
  const dish = dishById(order.dishId);
  drawFoodIcon(ctx, dish.id, r.x + 90, r.y + 105, 52);
  text(ctx, dish.name + ' — untuk ' + order.customer.name, r.x + 170, r.y + 78, 22, '#22223b', 'bold');
  text(ctx, dish.desc + '  •  ' + fmtMoney(dish.price), r.x + 170, r.y + 104, 15, '#666');
  // Recipe steps as chips: done = green, next = highlighted, later = grey.
  dish.steps.forEach((step, i) => {
    const chipX = r.x + 170 + i * 190;
    const chipY = r.y + 122;
    const done = i < order.stepIndex;
    const isNext = i === order.stepIndex;
    rr(ctx, chipX, chipY, 178, 40, 10);
    ctx.fillStyle = done ? '#2ec27e' : (isNext ? '#ffe1c2' : '#eee3cf');
    ctx.fill();
    ctx.lineWidth = isNext ? 3 : 1;
    ctx.strokeStyle = done ? '#1d7a4a' : '#b08954';
    ctx.stroke();
    const st = stationById(step.station);
    text(ctx, (done ? '✓ ' : (isNext ? '▶ ' : '')) + st.name + ': ' + step.ingredient,
      chipX + 10, chipY + 26, 14, done ? '#fff' : '#333', 'bold');
  });
  if (order.state === 'ready') {
    text(ctx, '✓ Semua langkah selesai — sajikan di kanan! →', r.x + 24, r.y + 178, 16, '#1d7a4a', 'bold');
  }
}

function drawServe(ctx, s) {
  const r = LAYOUT.serve;
  const order = s.selectedOrder();
  const ready = order && order.state === 'ready';
  rr(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = ready ? '#2ec27e' : '#d8cbb2';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ready ? '#1d7a4a' : '#b08954';
  ctx.stroke();
  text(ctx, ready ? '🍽 SAJIKAN!' : 'SAJIKAN', r.x + r.w / 2, r.y + 78, 34, '#fff', 'bold', 'center');
  if (ready) {
    const dish = dishById(order.dishId);
    const tip = Math.round(dish.price * 0.5 * (order.patience / order.patienceMax));
    text(ctx, dish.name + '  •  ' + fmtMoney(dish.price + tip), r.x + r.w / 2, r.y + 118, 20, '#fff', 'bold', 'center');
    text(ctx, 'termasuk tip ' + fmtMoney(tip) + ' — tekan SPASI', r.x + r.w / 2, r.y + 148, 15, '#eafff3', 'bold', 'center');
  } else {
    text(ctx, 'Selesaikan semua langkah', r.x + r.w / 2, r.y + 118, 18, '#fff', 'bold', 'center');
    text(ctx, 'masak dulu, baru sajikan.', r.x + r.w / 2, r.y + 148, 15, '#fff', 'bold', 'center');
  }
  text(ctx, 'Disajikan: ' + s.served + '  •  Combo terbaik: x' + s.bestCombo, r.x + r.w / 2, r.y + 178, 14, '#fff', 'bold', 'center');
}

function drawCounter(ctx, s) {
  const r = LAYOUT.counter;
  text(ctx, '🧂 BAHAN DI MEJA:', r.x, r.y + 22, 15, '#7a2e0e', 'bold');
  const items = ['Bawang', 'Nasi', 'Telur', 'Mie', 'Ayam', 'Sayur', 'Sambal', 'Kecap', 'Es Batu', 'Teh', 'Lontong', 'Saus Kacang'];
  items.forEach((name, i) => {
    const x = r.x + 150 + i * 86;
    rr(ctx, x, r.y + 4, 78, 40, 10);
    ctx.fillStyle = '#fff8e7';
    ctx.fill();
    ctx.strokeStyle = '#d9a441';
    ctx.stroke();
    text(ctx, name, x + 39, r.y + 29, 12, '#5a4632', 'bold', 'center');
  });
  text(ctx, 'Menu hari ini: ' + DISHES.map((d) => d.name).join('  •  '), r.x, r.y + 64, 13, '#8a6d3b');
}

function drawFooter(ctx, s) {
  text(ctx, 'Klik: pilih pesanan & stasiun  •  1-4 pilih pesanan  •  Q/W/E/R masak  •  SPASI sajikan  •  P jeda  •  M suara  •  H bantuan',
    LAYOUT.footer.x, LAYOUT.footer.y + 30, 15, '#5a4632', 'bold');
}

// ---- Full screens -------------------------------------------------------

export function drawTitle(ctx, s) {
  ctx.fillStyle = '#ffdf9e';
  ctx.fillRect(0, 0, W, H);
  // Awning.
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 ? '#e4572e' : '#fff3d6';
    ctx.fillRect(i * 80, 0, 80, 56);
  }
  ctx.fillStyle = '#7a2e0e';
  ctx.fillRect(0, 56, W, 6);
  text(ctx, 'WARUNG KILAT', W / 2, 170, 84, '#c1121f', 'bold', 'center');
  text(ctx, '— Rush Hour Kitchen —', W / 2, 215, 30, '#7a2e0e', 'bold', 'center');
  text(ctx, 'Masak cepat, sajikan hangat, jangan biarkan pelanggan pergi!', W / 2, 262, 22, '#5a4632', 'bold', 'center');
  // Dish showcase.
  DISHES.slice(0, 5).forEach((d, i) => {
    const cx = 240 + i * 200;
    drawFoodIcon(ctx, d.id, cx, 360, 62);
    text(ctx, d.name, cx, 448, 18, '#7a2e0e', 'bold', 'center');
    text(ctx, fmtMoney(d.price), cx, 474, 15, '#14532d', 'bold', 'center');
  });
  // Buttons.
  rr(ctx, W / 2 - 190, 520, 380, 64, 16);
  ctx.fillStyle = '#2ec27e';
  ctx.fill();
  text(ctx, '▶  MULAI MASAK  [ENTER]', W / 2, 561, 26, '#fff', 'bold', 'center');
  rr(ctx, W / 2 - 190, 600, 380, 56, 16);
  ctx.fillStyle = '#fff8e7';
  ctx.fill();
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, 'CARA MAIN  [H]', W / 2, 636, 22, '#7a2e0e', 'bold', 'center');
  text(ctx, '6 hidangan warung  •  4 stasiun masak  •  5 hari makin sibuk  •  keyboard + mouse', W / 2, 710, 17, '#5a4632', 'bold', 'center');
  text(ctx, 'Suara disintesis di browser — tanpa file eksternal, tanpa internet.', W / 2, 740, 15, '#8a6d3b', 'bold', 'center');
}

export function drawHowto(ctx, s) {
  ctx.fillStyle = '#ffdf9e';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'CARA MAIN', W / 2, 100, 48, '#c1121f', 'bold', 'center');
  const lines = [
    '1. Pelanggan datang dengan pesanan di ORDER BOARD. Klik pesanan (atau tombol 1-4) untuk memilihnya.',
    '2. Setiap hidangan punya langkah masak: CHOP [Q], FRY [W], GRILL [E], BOIL [R].',
    '   Klik stasiun yang benar untuk langkah berikutnya — lihat chip resep di piring.',
    '3. Tunggu stasiun selesai, lalu lanjut ke langkah berikutnya sampai semua ✓.',
    '4. Hidangan siap? Klik SAJIKAN atau tekan SPASI. Tip makin besar kalau pelanggan masih sabar.',
    '5. Capai TARGET uang sebelum timer hari habis. 3 pelanggan pergi = permainan berakhir.',
    '6. Tiap hari makin sibuk: pesanan datang lebih cepat, kesabaran makin pendek, target makin tinggi.',
    '7. Combo: sajikan beruntun tanpa ada yang pergi untuk bonus skor.',
  ];
  lines.forEach((ln, i) => text(ctx, ln, 90, 170 + i * 52, 20, '#333', 'bold'));
  text(ctx, 'Menu: NASI GORENG • MIE GORENG • SATE AYAM • AYAM GEPREK • GADO-GADO • ES TEH MANIS', W / 2, 580, 18, '#7a2e0e', 'bold', 'center');
  rr(ctx, W / 2 - 190, 620, 380, 60, 16);
  ctx.fillStyle = '#2ec27e';
  ctx.fill();
  text(ctx, '▶  MULAI  [ENTER]', W / 2, 659, 24, '#fff', 'bold', 'center');
  text(ctx, '[ESC] kembali ke judul', W / 2, 720, 16, '#8a6d3b', 'bold', 'center');
}

export function drawDayEnd(ctx, s) {
  ctx.fillStyle = '#d8f3dc';
  ctx.fillRect(0, 0, W, H);
  const r = s.dayResult;
  text(ctx, '🎉 HARI ' + s.day + ' SELESAI!', W / 2, 170, 56, '#1d7a4a', 'bold', 'center');
  text(ctx, 'Target ' + fmtMoney(r.target) + ' tercapai — warung makin ramai!', W / 2, 230, 24, '#333', 'bold', 'center');
  drawFoodIcon(ctx, 'nasi-goreng', W / 2 - 180, 340, 60);
  drawFoodIcon(ctx, 'sate-ayam', W / 2, 340, 60);
  drawFoodIcon(ctx, 'es-teh', W / 2 + 180, 340, 60);
  text(ctx, 'Uang hari ini: ' + fmtMoney(r.money), W / 2, 460, 28, '#14532d', 'bold', 'center');
  text(ctx, 'Total uang: ' + fmtMoney(s.money) + '   •   Skor: ' + s.score + '   •   Disajikan: ' + s.served, W / 2, 505, 22, '#333', 'bold', 'center');
  text(ctx, 'Combo terbaik: x' + s.bestCombo, W / 2, 545, 20, '#c1121f', 'bold', 'center');
  rr(ctx, W / 2 - 190, 590, 380, 64, 16);
  ctx.fillStyle = '#2ec27e';
  ctx.fill();
  text(ctx, '▶  HARI BERIKUTNYA  [ENTER]', W / 2, 631, 24, '#fff', 'bold', 'center');
  text(ctx, 'Hari berikutnya lebih sibuk — pelanggan lebih banyak, lebih tidak sabar.', W / 2, 700, 16, '#5a4632', 'bold', 'center');
}

export function drawGameOver(ctx, s) {
  ctx.fillStyle = '#ffe5e5';
  ctx.fillRect(0, 0, W, H);
  const r = s.dayResult;
  text(ctx, 'WARUNG TUTUP 😞', W / 2, 170, 56, '#c1121f', 'bold', 'center');
  text(ctx, r.reason || 'Hari berakhir.', W / 2, 230, 24, '#333', 'bold', 'center');
  text(ctx, 'Kamu bertahan sampai Hari ' + s.day + '  •  Skor: ' + s.score, W / 2, 300, 26, '#333', 'bold', 'center');
  text(ctx, 'Total uang: ' + fmtMoney(s.money) + '  •  Hidangan tersaji: ' + s.served + '  •  Combo terbaik: x' + s.bestCombo,
    W / 2, 345, 22, '#333', 'bold', 'center');
  text(ctx, 'Tips: sajikan ES TEH dulu (cepat!), jangan biarkan satu stasiun menganggur.', W / 2, 410, 18, '#7a2e0e', 'bold', 'center');
  rr(ctx, W / 2 - 190, 470, 380, 64, 16);
  ctx.fillStyle = '#2ec27e';
  ctx.fill();
  text(ctx, '↻  MAIN LAGI  [ENTER]', W / 2, 511, 24, '#fff', 'bold', 'center');
  text(ctx, '[ESC] kembali ke judul', W / 2, 580, 16, '#8a6d3b', 'bold', 'center');
}
