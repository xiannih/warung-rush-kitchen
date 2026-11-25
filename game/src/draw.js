// draw.js — everything Warung Kilat shows on its 1280x800 canvas.
// One canvas, no DOM game UI: every panel, ticket, flame, wisp of steam and
// plate of food is drawn here, so a screenshot always shows the real game.
// Layout is measured from the canvas edges, never from the page, so nothing
// can be clipped by the browser window.
(function (global) {
  'use strict';

  var C = global.WarungCatalog;
  var W = 1280, H = 800;

  var INK = '#5b2d12';
  var CREAM = '#fdf3d8';
  var PANEL = '#fff8e6';
  var GREEN = '#22a06b';
  var GREEN_D = '#0f7a4d';
  var RED = '#c0392b';
  var AMBER = '#d97706';
  var WOOD = '#c98f4e';
  var WOOD_D = '#a86f33';

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

  function text(ctx, s, x, y, font, colour, align) {
    ctx.font = font;
    ctx.fillStyle = colour || INK;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(s, x, y);
  }

  function fmtTime(sec) {
    var s = Math.max(0, Math.ceil(sec));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  // ---- dish art -----------------------------------------------------------
  // Every dish is drawn from its own shapes, and it is built layer by layer:
  // layer i appears once step i is done, and the next layer shows faintly,
  // so a plate mid-assembly reads as mid-assembly at a glance.
  function plate(ctx, x, y, r) {
    circle(ctx, x, y, r);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d9a441';
    ctx.stroke();
    circle(ctx, x, y, r * 0.72);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#e8c97a';
    ctx.stroke();
  }

  function layerOn(ctx, done, idx, alpha) {
    ctx.save();
    ctx.globalAlpha = idx < done ? 1 : (idx === done ? (alpha != null ? alpha : 0.35) : 0);
  }
  function layerOff(ctx) { ctx.restore(); }

  function drawDishArt(ctx, dishId, x, y, r, done) {
    done = done == null ? 99 : done;
    if (dishId !== 'esteh') plate(ctx, x, y, r);
    else {
      // Iced tea comes in a glass on a small saucer, not on a plate.
      circle(ctx, x, y + r * 0.12, r * 0.88);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d9a441';
      ctx.stroke();
    }
    var s = r / 78; // scale: art is authored at r = 78
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (dishId === 'nasi') {
      // Golden rice mound, fried egg, pink cracker.
      layerOn(ctx, done, 0); ctx.fillStyle = '#e8a91c';
      ctx.beginPath(); ctx.ellipse(0, 8, 46, 26, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#f2c14e';
      circle(ctx, -22, -2, 9); ctx.fill(); circle(ctx, 4, -8, 10); ctx.fill(); circle(ctx, 26, 0, 8); ctx.fill();
      layerOff(ctx);
      layerOn(ctx, done, 1); ctx.fillStyle = '#fff6dd';
      ctx.beginPath(); ctx.ellipse(6, -14, 22, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6b93b'; circle(ctx, 6, -14, 9); ctx.fill();
      ctx.fillStyle = '#ffe08a'; circle(ctx, 3, -17, 3); ctx.fill();
      layerOff(ctx);
      layerOn(ctx, done, 2); ctx.fillStyle = '#f2a0a0';
      ctx.beginPath(); ctx.moveTo(34, -30); ctx.lineTo(58, -6); ctx.lineTo(30, -2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d97b7b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(38, -24); ctx.lineTo(50, -10); ctx.stroke();
      layerOff(ctx);
    } else if (dishId === 'mie') {
      // Noodle nest: wavy strands, green onion, egg strip.
      layerOn(ctx, done, 0); ctx.strokeStyle = '#c98a2e'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 4, 34, 0.15, Math.PI - 0.15); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 4, 24, 0.4, Math.PI - 0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 4, 14, 0.7, Math.PI - 0.7); ctx.stroke();
      ctx.strokeStyle = '#a86f1e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-30, -8); ctx.quadraticCurveTo(0, -26, 30, -6); ctx.stroke();
      layerOff(ctx);
      layerOn(ctx, done, 1); ctx.fillStyle = '#6fae4e';
      ctx.fillRect(-28, -18, 10, 4); ctx.fillRect(8, -24, 10, 4); ctx.fillRect(22, -12, 10, 4);
      ctx.fillStyle = '#e2574c'; ctx.fillRect(-6, -26, 8, 4); ctx.fillRect(28, -22, 8, 4);
      layerOff(ctx);
      layerOn(ctx, done, 2); ctx.fillStyle = '#f6c453';
      rr(ctx, -34, 12, 26, 8, 3); ctx.fill();
      ctx.fillStyle = '#fff6dd'; rr(ctx, 12, 16, 24, 7, 3); ctx.fill();
      layerOff(ctx);
    } else if (dishId === 'sate') {
      // Three skewers fanned out, peanut sauce, lontong cubes.
      layerOn(ctx, done, 0);
      for (var i = -1; i <= 1; i++) {
        ctx.save(); ctx.translate(i * 16, 6); ctx.rotate(i * 0.35);
        ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, 44); ctx.stroke();
        ctx.fillStyle = '#a8541f';
        for (var q = 0; q < 4; q++) { rr(ctx, -8, -38 + q * 20, 16, 14, 4); ctx.fill(); }
        ctx.fillStyle = '#c96b2e';
        for (var q2 = 0; q2 < 4; q2++) { circle(ctx, 0, -31 + q2 * 20, 2.5); ctx.fill(); }
        ctx.restore();
      }
      layerOff(ctx);
      layerOn(ctx, done, 1); ctx.fillStyle = '#7a4a1f';
      ctx.beginPath(); ctx.moveTo(-40, 26); ctx.quadraticCurveTo(0, 44, 40, 24); ctx.stroke();
      ctx.strokeStyle = '#8a5a28'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-38, 30); ctx.quadraticCurveTo(0, 46, 38, 28); ctx.stroke();
      layerOff(ctx);
      layerOn(ctx, done, 2); ctx.fillStyle = '#efe3c2';
      rr(ctx, -52, 8, 16, 14, 3); ctx.fill(); rr(ctx, 38, 12, 16, 14, 3); ctx.fill();
      ctx.strokeStyle = '#cbb98a'; ctx.lineWidth = 1.5;
      ctx.strokeRect(-52, 8, 16, 14); ctx.strokeRect(38, 12, 16, 14);
      layerOff(ctx);
    } else if (dishId === 'geprek') {
      // Big smashed fried-chicken piece, red sambal, rice mound.
      layerOn(ctx, done, 0); ctx.fillStyle = '#b45a24';
      ctx.beginPath();
      ctx.moveTo(-38, 10); ctx.quadraticCurveTo(-46, -26, -12, -32);
      ctx.quadraticCurveTo(16, -40, 34, -18); ctx.quadraticCurveTo(48, 2, 30, 18);
      ctx.quadraticCurveTo(0, 30, -38, 10); ctx.fill();
      ctx.fillStyle = '#d97b3f';
      circle(ctx, -18, -12, 7); ctx.fill(); circle(ctx, 8, -20, 8); ctx.fill(); circle(ctx, 22, 2, 6); ctx.fill();
      ctx.fillStyle = '#8a3d16';
      circle(ctx, -6, -4, 3); ctx.fill(); circle(ctx, 16, -10, 3); ctx.fill();
      layerOff(ctx);
      layerOn(ctx, done, 1); ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.ellipse(26, -30, 16, 10, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e74c3c'; circle(ctx, 22, -32, 4); ctx.fill(); circle(ctx, 30, -28, 3); ctx.fill();
      layerOff(ctx);
      layerOn(ctx, done, 2); ctx.fillStyle = '#f2e6c8';
      ctx.beginPath(); ctx.ellipse(-30, 22, 22, 12, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff8e6'; circle(ctx, -34, 16, 5); ctx.fill(); circle(ctx, -22, 14, 5); ctx.fill();
      layerOff(ctx);
    } else if (dishId === 'gado') {
      // Peanut-sauce pool with veggie chunks, egg half, tofu.
      layerOn(ctx, done, 0); ctx.fillStyle = '#9c6b30';
      ctx.beginPath(); ctx.ellipse(0, 6, 44, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b98a4a'; ctx.beginPath(); ctx.ellipse(-6, 2, 32, 18, 0, 0, Math.PI * 2); ctx.fill();
      layerOff(ctx);
      layerOn(ctx, done, 1); ctx.fillStyle = '#6fae4e';
      ctx.fillRect(-30, -16, 18, 5); ctx.fillRect(-8, -22, 18, 5); ctx.fillRect(14, -14, 18, 5);
      ctx.fillStyle = '#f2e6c8'; ctx.fillRect(-34, 8, 16, 10); ctx.fillRect(20, 10, 16, 10);
      ctx.fillStyle = '#e8a91c'; ctx.fillRect(-4, 12, 12, 12); ctx.fillRect(8, 4, 12, 12);
      layerOff(ctx);
      layerOn(ctx, done, 2); ctx.fillStyle = '#fff6dd';
      ctx.beginPath(); ctx.ellipse(30, -26, 12, 9, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f6b93b'; circle(ctx, 30, -26, 5); ctx.fill();
      ctx.fillStyle = '#efe3c2'; rr(ctx, -38, -28, 14, 12, 2); ctx.fill();
      layerOff(ctx);
    } else if (dishId === 'esteh') {
      // Tall glass of amber tea, ice cubes, red straw, on its saucer.
      ctx.fillStyle = '#c97e2c';
      rr(ctx, -26, -38, 52, 72, 8); ctx.fill();
      ctx.fillStyle = '#e0a04a'; rr(ctx, -26, -38, 52, 22, 8); ctx.fill();
      ctx.fillStyle = '#a8d8ea';
      ctx.save(); ctx.translate(-10, -14); ctx.rotate(0.3); ctx.fillRect(-9, -9, 18, 18); ctx.restore();
      ctx.save(); ctx.translate(12, 8); ctx.rotate(-0.2); ctx.fillRect(-9, -9, 18, 18); ctx.restore();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.strokeRect(-19, -23, 18, 18); ctx.strokeRect(3, -1, 18, 18);
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(30, -58); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(19, -24); ctx.lineTo(24, -40); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      circle(ctx, -18, -26, 2.5); ctx.fill(); circle(ctx, 16, -30, 2); ctx.fill(); circle(ctx, -14, 18, 2); ctx.fill();
    }
    ctx.restore();
  }

  function customerFace(ctx, cust, x, y, r) {
    circle(ctx, x, y, r);
    ctx.fillStyle = cust.colour;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    text(ctx, cust.initial, x, y + r * 0.38, 'bold ' + Math.round(r * 1.05) + 'px sans-serif', '#ffffff', 'center');
  }

  // ---- scenery ------------------------------------------------------------
  function drawAwning(ctx, t) {
    for (var i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#e4572e' : '#fdf3d8';
      ctx.fillRect(i * 80, 0, 80, 24);
    }
    ctx.fillStyle = '#7a3b12';
    ctx.fillRect(0, 24, W, 4);
  }

  function drawWallTiles(ctx, y0, y1) {
    ctx.fillStyle = '#f7e3b0';
    ctx.fillRect(0, y0, W, y1 - y0);
    var ts = 46;
    for (var y = y0; y < y1; y += ts) {
      for (var x = ((y / ts) % 2 ? -ts / 2 : 0); x < W; x += ts) {
        ctx.fillStyle = (Math.floor(x / ts) + Math.floor(y / ts)) % 2 === 0 ? '#f3d68f' : '#fbeec3';
        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
      }
    }
    ctx.fillStyle = 'rgba(122,59,18,0.25)';
    ctx.fillRect(0, y1 - 3, W, 3);
  }

  function drawFlame(ctx, x, y, s, t, seed) {
    for (var i = 0; i < 3; i++) {
      var wob = Math.sin(t * 9 + seed + i * 2.1) * 3;
      var h = (26 - i * 6) * s * (1 + 0.12 * Math.sin(t * 13 + seed * 3 + i));
      ctx.fillStyle = ['#e74c3c', '#f39c12', '#f9d423'][i];
      ctx.beginPath();
      ctx.moveTo(x - (14 - i * 3) * s + wob, y);
      ctx.quadraticCurveTo(x + wob, y - h, x + (14 - i * 3) * s + wob, y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawSteam(ctx, x, y, t, seed) {
    for (var i = 0; i < 3; i++) {
      var ph = (t * 0.45 + seed + i * 0.33) % 1;
      var sy = y - ph * 34;
      var sx = x + Math.sin(ph * 6 + seed * 5 + i) * 5;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * (1 - ph)).toFixed(2) + ')';
      circle(ctx, sx, sy, 4 + ph * 6);
      ctx.fill();
    }
  }

  // ---- play screen --------------------------------------------------------
  function drawHeader(ctx, k, t) {
    drawAwning(ctx, t);
    ctx.fillStyle = '#f6b73c';
    ctx.fillRect(0, 28, W, 30);
    ctx.fillStyle = '#7a3b12';
    ctx.fillRect(0, 58, W, 3);
    text(ctx, '🍜 WARUNG KILAT', 16, 50, 'bold 24px sans-serif', '#7a1f0e');
    text(ctx, 'HARI ' + k.day, 248, 50, 'bold 22px sans-serif', INK);
    var timeColour = k.timeLeft <= 20 ? RED : INK;
    text(ctx, '⏱ ' + fmtTime(k.timeLeft), 348, 50, 'bold 24px sans-serif', timeColour);
    if (k.timeLeft <= 20 && k.screen === 'play') {
      ctx.fillStyle = RED;
      rr(ctx, 452, 32, 132, 26, 13); ctx.fill();
      text(ctx, '⚠ RUSH HOUR!', 518, 51, 'bold 16px sans-serif', '#ffffff', 'center');
    }
    text(ctx, 'TARGET ' + C.money(k.target), 620, 50, 'bold 21px sans-serif', INK);
    text(ctx, '💰 ' + C.money(k.money), 838, 50, 'bold 22px sans-serif', GREEN_D);
    text(ctx, 'SKOR ' + k.score, 1010, 50, 'bold 20px sans-serif', INK);
    text(ctx, 'COMBO x' + k.combo, 1130, 50, 'bold 20px sans-serif', k.combo >= 3 ? RED : INK);
    // Walkout pips live at the right end of the order-board row (see drawOrders).
  }

  function sectionLabel(ctx, label, x, y) {
    text(ctx, label, x, y, 'bold 17px sans-serif', '#8a5a28');
  }

  function drawOrders(ctx, k, t) {
    sectionLabel(ctx, '📋 ORDER BOARD — klik pesanan (1-4) lalu masak di stasiun', 16, 80);
    // Walkout pips live at the right end of this row.
    text(ctx, 'pelanggan pergi: ', 1010, 80, 'bold 15px sans-serif', '#8a5a28');
    for (var i = 0; i < C.MAX_WALKOUTS; i++) {
      circle(ctx, 1145 + i * 26, 75, 9);
      ctx.fillStyle = i < k.walkouts ? RED : '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = RED; ctx.stroke();
    }
    var cw = 300, gap = 16, y = 84, h = 130;
    for (var s = 0; s < C.MAX_ORDERS; s++) {
      var x = 16 + s * (cw + gap);
      var order = k.orders[s];
      ctx.fillStyle = PANEL;
      rr(ctx, x, y, cw, h, 12); ctx.fill();
      ctx.lineWidth = order && k.selected === s ? 4 : 2;
      ctx.strokeStyle = order && order.ready ? GREEN : (order && k.selected === s ? '#e4572e' : '#d9b36a');
      ctx.stroke();
      if (!order) {
        text(ctx, '— kosong —', x + cw / 2, y + 62, '16px sans-serif', '#b09a72', 'center');
        text(ctx, 'pesanan berikutnya segera datang', x + cw / 2, y + 88, '13px sans-serif', '#b09a72', 'center');
        continue;
      }
      customerFace(ctx, order.customer, x + 30, y + 32, 22);
      text(ctx, order.customer.name, x + 60, y + 28, 'bold 18px sans-serif', INK);
      text(ctx, String(s + 1), x + cw - 16, y + 26, 'bold 15px sans-serif', '#b09a72', 'right');
      text(ctx, order.dish.name, x + 60, y + 54, 'bold 20px sans-serif', INK);
      text(ctx, order.dish.desc, x + 16, y + 78, '14px sans-serif', '#7a6a4f');
      // Patience bar.
      var frac = Math.max(0, order.patience / order.maxPatience);
      var bw = cw - 32;
      ctx.fillStyle = '#e8ddc0';
      rr(ctx, x + 16, y + 88, bw, 10, 5); ctx.fill();
      ctx.fillStyle = frac > 0.5 ? GREEN : (frac > 0.25 ? AMBER : RED);
      if (frac > 0) { rr(ctx, x + 16, y + 88, Math.max(10, bw * frac), 10, 5); ctx.fill(); }
      if (order.ready) {
        text(ctx, '✓ SIAP! [SPASI]', x + 16, y + 120, 'bold 16px sans-serif', GREEN_D);
      } else {
        text(ctx, Math.ceil(order.patience) + ' dtk', x + 16, y + 120, 'bold 15px sans-serif', frac <= 0.25 ? RED : INK);
        text(ctx, 'langkah ' + order.done + '/' + order.dish.steps.length, x + cw - 16, y + 120, '15px sans-serif', '#7a6a4f', 'right');
      }
    }
  }

  function stationIcon(ctx, st, cx, cy, t, busy) {
    if (st === 'chop') {
      ctx.fillStyle = '#a86f33'; rr(ctx, cx - 42, cy - 8, 84, 20, 6); ctx.fill();
      ctx.fillStyle = '#d9d9d9'; rr(ctx, cx - 30, cy - 30, 52, 10, 3); ctx.fill();
      ctx.fillStyle = '#5b2d12'; rr(ctx, cx + 22, cy - 29, 16, 8, 3); ctx.fill();
      ctx.fillStyle = '#6fae4e'; ctx.fillRect(cx - 18, cy - 4, 12, 5); ctx.fillRect(cx + 2, cy - 4, 12, 5);
    } else if (st === 'fry') {
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath(); ctx.arc(cx, cy - 6, 34, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#e8a91c'; ctx.beginPath(); ctx.arc(cx, cy - 6, 26, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(cx + 32, cy - 6); ctx.lineTo(cx + 52, cy - 18); ctx.stroke();
      drawFlame(ctx, cx, cy + 30, 0.9, t, 1);
    } else if (st === 'grill') {
      ctx.fillStyle = '#4a4a4a'; rr(ctx, cx - 40, cy - 14, 80, 26, 5); ctx.fill();
      ctx.strokeStyle = '#888888'; ctx.lineWidth = 2;
      for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 14, cy - 12); ctx.lineTo(cx + i * 14, cy + 10); ctx.stroke(); }
      ctx.fillStyle = '#e74c3c'; circle(ctx, cx - 20, cy - 20, 4); ctx.fill(); circle(ctx, cx + 4, cy - 22, 4); ctx.fill(); circle(ctx, cx + 22, cy - 19, 4); ctx.fill();
      drawFlame(ctx, cx - 18, cy + 16, 0.55, t, 2);
      drawFlame(ctx, cx + 18, cy + 16, 0.55, t, 5);
    } else {
      ctx.fillStyle = '#5b7a99'; rr(ctx, cx - 34, cy - 16, 68, 34, 8); ctx.fill();
      ctx.fillStyle = '#7fa3c4'; rr(ctx, cx - 38, cy - 20, 76, 8, 4); ctx.fill();
      ctx.fillStyle = '#e8f4fa'; circle(ctx, cx - 12, cy - 4, 5); ctx.fill(); circle(ctx, cx + 10, cy + 2, 4); ctx.fill();
      drawSteam(ctx, cx, cy - 26, t, 3);
    }
  }

  function drawStations(ctx, k, t) {
    sectionLabel(ctx, '🔥 STASIUN MASAK — klik stasiun (Q/W/E/R) untuk langkah berikutnya', 16, 232);
    drawWallTiles(ctx, 238, 390);
    var cw = 300, gap = 16, y = 238, h = 152;
    for (var s = 0; s < C.STATIONS.length; s++) {
      var st = C.STATIONS[s];
      var x = 16 + s * (cw + gap);
      var busy = k.busy && k.busy.station === st.id;
      var isNext = false;
      var sel = k.orders[k.selected];
      if (sel && !sel.ready && !k.busy) {
        var ns = sel.dish.steps[sel.done];
        if (ns && ns.station === st.id) isNext = true;
      }
      ctx.fillStyle = 'rgba(255,248,230,0.94)';
      rr(ctx, x, y, cw, h, 12); ctx.fill();
      ctx.lineWidth = busy ? 4 : (isNext ? 3 : 2);
      ctx.strokeStyle = busy ? GREEN : (isNext ? '#e4572e' : '#c9a86a');
      ctx.stroke();
      if (isNext && !busy) {
        text(ctx, '▶ LANGKAH BERIKUTNYA', x + cw / 2, y + 20, 'bold 13px sans-serif', '#e4572e', 'center');
      }
      stationIcon(ctx, st.id, x + cw / 2, y + 58, t, busy);
      text(ctx, st.name + '  [' + st.keyLabel + ']', x + cw / 2, y + 108, 'bold 21px sans-serif', INK, 'center');
      if (!busy) text(ctx, st.tool + ' — ' + st.hint, x + cw / 2, y + 130, '14px sans-serif', '#7a6a4f', 'center');
      if (busy) {
        var frac = Math.min(1, k.busy.t / k.busy.dur);
        ctx.fillStyle = '#e8ddc0';
        rr(ctx, x + 20, y + h - 26, cw - 40, 9, 4); ctx.fill();
        ctx.fillStyle = '#e4572e';
        rr(ctx, x + 20, y + h - 26, Math.max(9, (cw - 40) * frac), 9, 4); ctx.fill();
        text(ctx, k.busy.label + '… ' + Math.round(frac * 100) + '%', x + cw / 2, y + h - 6, 'bold 13px sans-serif', INK, 'center');
      } else {
        text(ctx, 'menganggur', x + cw / 2, y + h - 8, '14px sans-serif', '#a08a64', 'center');
      }
    }
  }

  function drawPlatePanel(ctx, k, t) {
    sectionLabel(ctx, '🍽 PIRING — hidangan sedang dirakit', 16, 410);
    var x = 16, y = 414, w = 780, h = 172;
    ctx.fillStyle = PANEL;
    rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    var order = k.orders[k.selected];
    if (!order) {
      text(ctx, 'Belum ada pesanan dipilih — klik salah satu tiket di papan order.', x + 30, y + 60, '18px sans-serif', '#7a6a4f');
      text(ctx, 'Setiap hidangan dirakit langkah demi langkah di stasiun yang tepat.', x + 30, y + 90, '16px sans-serif', '#7a6a4f');
      return;
    }
    drawDishArt(ctx, order.dish.id, x + 92, y + 88, 72, order.done);
    text(ctx, order.dish.name + ' — untuk ' + order.customer.name, x + 190, y + 42, 'bold 22px sans-serif', INK);
    text(ctx, order.dish.desc + '  •  ' + C.money(order.dish.price), x + 190, y + 68, '16px sans-serif', '#7a6a4f');
    // Recipe chips: done green, next amber, todo plain.
    var cx = x + 190, cy = y + 96, chw = 176, chh = 38;
    for (var i = 0; i < order.dish.steps.length; i++) {
      var stp = order.dish.steps[i];
      var chipX = cx + i * (chw + 10);
      var doneStep = i < order.done;
      var nextStep = i === order.done && !order.ready;
      ctx.fillStyle = doneStep ? GREEN : (nextStep ? '#fde8c8' : '#f1e7cd');
      rr(ctx, chipX, cy, chw, chh, 9); ctx.fill();
      ctx.lineWidth = nextStep ? 3 : 1.5;
      ctx.strokeStyle = doneStep ? GREEN_D : (nextStep ? '#e4572e' : '#d9c49a');
      ctx.stroke();
      var label = (doneStep ? '✓ ' : (nextStep ? '▶ ' : '')) +
        C.stationById(stp.station).name + ': ' + stp.label;
      text(ctx, label, chipX + 10, cy + 24, 'bold 13px sans-serif', doneStep ? '#ffffff' : INK);
    }
    if (order.ready) {
      text(ctx, '✓ Semua langkah selesai — sajikan di kanan!  →', x + 190, y + 158, 'bold 17px sans-serif', GREEN_D);
    } else if (k.flash) {
      text(ctx, k.flash, x + 190, y + 158, 'bold 16px sans-serif', RED);
    } else {
      var ns2 = order.dish.steps[order.done];
      text(ctx, 'Berikutnya: ' + C.stationById(ns2.station).name + ' [' + C.stationById(ns2.station).keyLabel + '] — ' + ns2.label,
        x + 190, y + 158, '16px sans-serif', '#7a6a4f');
    }
  }

  function drawServePanel(ctx, k) {
    var x = 812, y = 414, w = 452, h = 172;
    var order = k.orders[k.selected];
    var ready = !!(order && order.ready);
    ctx.fillStyle = ready ? GREEN : '#d8cbb2';
    rr(ctx, x, y, w, h, 12); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = ready ? GREEN_D : '#b09a72'; ctx.stroke();
    if (ready) {
      var tip = Math.round(order.dish.price * 0.30 * Math.max(0, order.patience / order.maxPatience));
      text(ctx, '🍽  SAJIKAN!', x + w / 2, y + 52, 'bold 34px sans-serif', '#ffffff', 'center');
      text(ctx, order.dish.name + '  •  ' + C.money(order.dish.price + tip), x + w / 2, y + 88, 'bold 20px sans-serif', '#ffffff', 'center');
      text(ctx, 'termasuk tip ' + C.money(tip) + ' — tekan SPASI', x + w / 2, y + 116, '17px sans-serif', '#eafff3', 'center');
    } else {
      text(ctx, 'SAJIKAN', x + w / 2, y + 56, 'bold 32px sans-serif', '#ffffff', 'center');
      text(ctx, 'Selesaikan semua langkah', x + w / 2, y + 92, 'bold 18px sans-serif', '#ffffff', 'center');
      text(ctx, 'masak dulu, baru sajikan.', x + w / 2, y + 118, '16px sans-serif', '#fdf6e3', 'center');
    }
    text(ctx, 'Disajikan: ' + k.served + '  •  Combo terbaik: x' + Math.max(k.bestCombo, k.dayStats.bestCombo),
      x + w / 2, y + 152, '15px sans-serif', ready ? '#eafff3' : '#8a7a5c', 'center');
  }

  function drawPantry(ctx, k) {
    sectionLabel(ctx, '🧂 BAHAN DI MEJA:', 16, 608);
    // Wooden counter behind the chips.
    ctx.fillStyle = WOOD;
    rr(ctx, 16, 612, W - 32, 92, 10); ctx.fill();
    ctx.fillStyle = WOOD_D;
    for (var p = 0; p < 5; p++) ctx.fillRect(16 + p * 256, 612, 2, 92);
    var sel = k.orders[k.selected];
    var nextIng = null;
    if (sel && !sel.ready) nextIng = sel.dish.steps[sel.done].ingredient;
    var perRow = 6, gap = 10;
    var cw = Math.floor((W - 32 - (perRow - 1) * gap) / perRow);
    for (var i = 0; i < C.PANTRY.length; i++) {
      var ing = C.PANTRY[i];
      var row = Math.floor(i / perRow), col = i % perRow;
      var x = 26 + col * (cw + gap);
      var y = 620 + row * 44;
      var isNext = ing.name === nextIng;
      ctx.fillStyle = '#fff8e6';
      rr(ctx, x, y, cw, 36, 9); ctx.fill();
      ctx.lineWidth = isNext ? 3 : 1.5;
      ctx.strokeStyle = isNext ? '#e4572e' : '#d9b36a';
      ctx.stroke();
      circle(ctx, x + 16, y + 18, 7);
      ctx.fillStyle = ing.colour;
      ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
      text(ctx, ing.name + (isNext ? '  ▼' : ''), x + 30, y + 24, 'bold 16px sans-serif', INK);
    }
  }

  function drawFooter(ctx, k) {
    var day = C.DAYS[Math.min(k.day, C.DAYS.length) - 1];
    text(ctx, 'Menu hari ini:  ' + C.DISHES.map(function (d) { return d.name; }).join('  •  '),
      W / 2, 724, '15px sans-serif', '#8a6a42', 'center');
    text(ctx, 'Klik: pilih pesanan & stasiun  •  1-4 pilih pesanan  •  Q/W/E/R masak  •  SPASI sajikan  •  P jeda  •  M suara  •  H bantuan',
      W / 2, 750, 'bold 15px sans-serif', INK, 'center');
    text(ctx, day.label, W / 2, 776, '14px sans-serif', '#8a6a42', 'center');
  }

  function drawPlay(ctx, k, t) {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);
    drawHeader(ctx, k, t);
    drawOrders(ctx, k, t);
    drawStations(ctx, k, t);
    drawPlatePanel(ctx, k, t);
    drawServePanel(ctx, k);
    drawPantry(ctx, k);
    drawFooter(ctx, k);
    if (k.screen === 'play' && k.paused) {
      ctx.fillStyle = 'rgba(40,20,5,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PANEL;
      rr(ctx, 440, 300, 400, 180, 16); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
      text(ctx, '⏸  JEDA', 640, 368, 'bold 36px sans-serif', INK, 'center');
      text(ctx, 'Tekan P untuk lanjut masak.', 640, 410, '18px sans-serif', '#7a6a4f', 'center');
      text(ctx, 'M suara  •  H bantuan  •  Esc keluar', 640, 442, '15px sans-serif', '#7a6a4f', 'center');
    }
  }

  // ---- title / how-to -----------------------------------------------------
  function drawTitle(ctx, k, t) {
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(0, 0, W, H);
    drawAwning(ctx, t);
    text(ctx, 'WARUNG KILAT', W / 2, 138, 'bold 84px sans-serif', '#b91c1c', 'center');
    text(ctx, '—  Rush Hour Kitchen  —', W / 2, 188, 'bold 30px sans-serif', '#7a3b12', 'center');
    text(ctx, 'Masak cepat, sajikan hangat, jangan biarkan pelanggan pergi!', W / 2, 232, 'bold 20px sans-serif', '#5b4636', 'center');
    // Six dishes, each drawn as itself, with name and price.
    var dw = 176, gap = 24;
    var totalW = 6 * dw + 5 * gap;
    var x0 = (W - totalW) / 2;
    for (var i = 0; i < C.DISHES.length; i++) {
      var d = C.DISHES[i];
      var x = x0 + i * (dw + gap);
      drawDishArt(ctx, d.id, x + dw / 2, 330, 62, 99);
      text(ctx, d.name, x + dw / 2, 428, 'bold 18px sans-serif', INK, 'center');
      text(ctx, C.money(d.price), x + dw / 2, 454, 'bold 16px sans-serif', GREEN_D, 'center');
      text(ctx, d.steps.length + ' langkah', x + dw / 2, 478, '14px sans-serif', '#7a6a4f', 'center');
    }
    ctx.fillStyle = GREEN;
    rr(ctx, 440, 520, 400, 64, 14); ctx.fill();
    text(ctx, '▶  MULAI MASAK  [ENTER]', 640, 562, 'bold 26px sans-serif', '#ffffff', 'center');
    ctx.fillStyle = PANEL;
    rr(ctx, 490, 600, 300, 54, 14); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    text(ctx, 'CARA MAIN  [H]', 640, 635, 'bold 22px sans-serif', INK, 'center');
    text(ctx, '6 hidangan warung  •  4 stasiun masak  •  5 hari makin sibuk  •  keyboard + mouse',
      W / 2, 700, 'bold 17px sans-serif', '#5b4636', 'center');
    text(ctx, 'Suara disintesis di browser — tanpa file eksternal, tanpa internet.',
      W / 2, 730, '16px sans-serif', '#7a6a4f', 'center');
  }

  function drawHowto(ctx, k) {
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(0, 0, W, H);
    drawAwning(ctx, null);
    text(ctx, 'CARA MAIN', W / 2, 120, 'bold 52px sans-serif', '#b91c1c', 'center');
    var rows = [
      ['1', 'Pilih pesanan', 'Klik tiket di papan order, atau tekan 1-4. Tiket yang dipilih berbingkai oranye.'],
      ['2', 'Masak langkahnya', 'Setiap hidangan punya 2-3 langkah. Tekan tombol stasiun yang tepat — Q Chop, W Fry, E Grill, R Boil — atau klik kartunya.'],
      ['3', 'Rakit di piring', 'Setiap langkah yang selesai muncul di piring. Chip hijau = selesai, chip oranye = berikutnya.'],
      ['4', 'Sajikan sebelum sabar habis', 'Kalau semua langkah selesai, tekan SPASI atau klik SAJIKAN. Makin sabar pelanggan, makin besar tip. Combo naik tiap sajian beruntun.'],
      ['!', 'Jangan sampai 3 pergi', 'Kesabaran pelanggan menipis di bilah tiket. Kalau 3 pelanggan pergi, atau target hari tidak tercapai saat waktu habis, warung tutup.']
    ];
    var y = 168;
    for (var i = 0; i < rows.length; i++) {
      ctx.fillStyle = PANEL;
      rr(ctx, 140, y, 1000, 76, 12); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
      circle(ctx, 182, y + 38, 22);
      ctx.fillStyle = '#e4572e'; ctx.fill();
      text(ctx, rows[i][0], 182, y + 46, 'bold 24px sans-serif', '#ffffff', 'center');
      text(ctx, rows[i][1], 220, y + 32, 'bold 20px sans-serif', INK);
      text(ctx, rows[i][2], 220, y + 58, '16px sans-serif', '#5b4636');
      y += 88;
    }
    ctx.fillStyle = GREEN;
    rr(ctx, 440, 640, 400, 60, 14); ctx.fill();
    text(ctx, '▶  MULAI MASAK  [ENTER]', 640, 679, 'bold 24px sans-serif', '#ffffff', 'center');
    text(ctx, 'P jeda  •  M suara  •  H bantuan kapan saja', W / 2, 736, '16px sans-serif', '#7a6a4f', 'center');
  }

  // ---- day done: the rich summary ----------------------------------------
  function dishMoney(k, name) {
    var total = 0;
    for (var i = 0; i < C.DISHES.length; i++) {
      if (C.DISHES[i].name === name) total = C.DISHES[i].price;
    }
    return total;
  }

  function drawDayDone(ctx, k, t) {
    ctx.fillStyle = '#e8f7ee';
    ctx.fillRect(0, 0, W, H);
    drawAwning(ctx, t);
    var stats = k.dayStats;
    var plan = C.DAYS[Math.min(k.day, C.DAYS.length) - 1];
    var next = C.DAYS[Math.min(k.day, C.DAYS.length - 1)];
    text(ctx, '🎉  HARI ' + k.day + ' SELESAI!', W / 2, 108, 'bold 52px sans-serif', GREEN_D, 'center');
    text(ctx, 'Target ' + C.money(plan.target) + ' tercapai — warung makin ramai!',
      W / 2, 146, 'bold 20px sans-serif', INK, 'center');

    // Left: what was served, dish by dish.
    var lx = 40, ly = 176, lw = 600, lh = 400;
    ctx.fillStyle = PANEL;
    rr(ctx, lx, ly, lw, lh, 14); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    text(ctx, '🍽  HIDANGAN HARI INI', lx + 24, ly + 38, 'bold 21px sans-serif', INK);
    var names = Object.keys(stats.perDish);
    if (names.length === 0) names = ['ES TEH MANIS'];
    var rowY = ly + 66;
    for (var i = 0; i < names.length; i++) {
      var nm = names[i];
      var count = stats.perDish[nm] || 1;
      var dish = null;
      for (var d = 0; d < C.DISHES.length; d++) if (C.DISHES[d].name === nm) dish = C.DISHES[d];
      if (!dish) dish = C.DISHES[0];
      drawDishArt(ctx, dish.id, lx + 52, rowY + 16, 26, 99);
      text(ctx, nm, lx + 92, rowY + 24, 'bold 18px sans-serif', INK);
      text(ctx, 'x' + count, lx + 340, rowY + 24, 'bold 18px sans-serif', '#7a6a4f', 'center');
      text(ctx, C.money(dishMoney(k, nm) * count), lx + lw - 24, rowY + 24, 'bold 18px sans-serif', GREEN_D, 'right');
      if (i < names.length - 1) {
        ctx.strokeStyle = '#ecd9a8'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lx + 24, rowY + 44); ctx.lineTo(lx + lw - 24, rowY + 44); ctx.stroke();
      }
      rowY += 52;
    }
    var servedTotal = stats.served || names.reduce(function (a, n) { return a + (stats.perDish[n] || 0); }, 0);
    text(ctx, 'Total disajikan: ' + servedTotal + ' piring', lx + 24, ly + lh - 18, 'bold 17px sans-serif', INK);

    // Right: money split + stats grid.
    var rx = 664, ry = 176, rw = 576;
    ctx.fillStyle = '#fff3c4';
    rr(ctx, rx, ry, rw, 168, 14); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    text(ctx, '💰  UANG HARI INI', rx + 24, ry + 38, 'bold 21px sans-serif', INK);
    text(ctx, 'Makanan', rx + 24, ry + 76, '17px sans-serif', '#7a6a4f');
    text(ctx, C.money(stats.food), rx + rw - 24, ry + 76, 'bold 18px sans-serif', INK, 'right');
    text(ctx, 'Tips pelanggan', rx + 24, ry + 106, '17px sans-serif', '#7a6a4f');
    text(ctx, C.money(stats.tips), rx + rw - 24, ry + 106, 'bold 18px sans-serif', INK, 'right');
    ctx.strokeStyle = '#d9b36a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(rx + 24, ry + 122); ctx.lineTo(rx + rw - 24, ry + 122); ctx.stroke();
    text(ctx, 'Total hari ini', rx + 24, ry + 154, 'bold 19px sans-serif', INK);
    text(ctx, C.money(k.dayMoney), rx + rw - 24, ry + 154, 'bold 22px sans-serif', GREEN_D, 'right');

    var gy = ry + 188, gh = 212;
    ctx.fillStyle = PANEL;
    rr(ctx, rx, gy, rw, gh, 14); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    text(ctx, '📊  CATATAN HARI INI', rx + 24, gy + 36, 'bold 21px sans-serif', INK);
    var cells = [
      ['Disajikan', String(stats.served)],
      ['Pelanggan pergi', String(stats.walkouts)],
      ['Kombo terbaik', 'x' + Math.max(stats.bestCombo, 1)],
      ['Skor', String(k.score)]
    ];
    for (var c = 0; c < 4; c++) {
      var cxp = rx + 24 + (c % 2) * (rw / 2);
      var cyp = gy + 66 + Math.floor(c / 2) * 56;
      text(ctx, cells[c][0], cxp, cyp, '15px sans-serif', '#7a6a4f');
      text(ctx, cells[c][1], cxp, cyp + 28, 'bold 24px sans-serif', INK);
    }
    // Target vs earned bar.
    var barY = gy + gh - 34;
    text(ctx, 'Target ' + C.money(plan.target) + '  vs  dapat ' + C.money(k.dayMoney), rx + 24, barY - 8, '15px sans-serif', '#7a6a4f');
    ctx.fillStyle = '#e8ddc0';
    rr(ctx, rx + 24, barY, rw - 48, 12, 6); ctx.fill();
    ctx.fillStyle = GREEN;
    rr(ctx, rx + 24, barY, Math.max(12, (rw - 48) * Math.min(1, k.dayMoney / plan.target)), 12, 6); ctx.fill();

    // Next day preview + continue.
    var ny = 604;
    ctx.fillStyle = '#ffe9a8';
    rr(ctx, 40, ny, 1200, 64, 12); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    if (k.day < C.DAYS.length) {
      text(ctx, 'BESOK — HARI ' + (k.day + 1) + ':  target ' + C.money(next.target) +
        '  •  pelanggan datang tiap ' + next.spawnEvery + ' dtk  •  lebih tidak sabar',
        640, ny + 40, 'bold 19px sans-serif', INK, 'center');
    } else {
      text(ctx, 'Semua hari selesai — warung ini legenda!', 640, ny + 40, 'bold 19px sans-serif', INK, 'center');
    }
    ctx.fillStyle = GREEN;
    rr(ctx, 440, 692, 400, 60, 14); ctx.fill();
    text(ctx, '▶  HARI BERIKUTNYA  [ENTER]', 640, 731, 'bold 23px sans-serif', '#ffffff', 'center');
  }

  function drawGameOver(ctx, k) {
    ctx.fillStyle = '#fbe3d8';
    ctx.fillRect(0, 0, W, H);
    drawAwning(ctx, null);
    text(ctx, '😞  WARUNG TUTUP!', W / 2, 170, 'bold 56px sans-serif', RED, 'center');
    text(ctx, k.overReason || 'Hari ini tidak berjalan baik.', W / 2, 220, 'bold 21px sans-serif', INK, 'center');
    ctx.fillStyle = PANEL;
    rr(ctx, 340, 260, 600, 240, 14); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    var lines = [
      ['Hari tercapai', 'Hari ' + k.day + ' dari 5'],
      ['Uang terkumpul', C.money(k.money)],
      ['Skor', String(k.score)],
      ['Hidangan disajikan', String(k.served)],
      ['Kombo terbaik', 'x' + k.bestCombo]
    ];
    for (var i = 0; i < lines.length; i++) {
      var y = 300 + i * 40;
      text(ctx, lines[i][0], 380, y, '18px sans-serif', '#7a6a4f');
      text(ctx, lines[i][1], 900, y, 'bold 19px sans-serif', INK, 'right');
    }
    ctx.fillStyle = GREEN;
    rr(ctx, 440, 540, 400, 60, 14); ctx.fill();
    text(ctx, '↻  COBA LAGI  [ENTER]', 640, 579, 'bold 24px sans-serif', '#ffffff', 'center');
    text(ctx, 'Tips: sajikan es teh dulu — cepat dan pelanggan sabar menunggu yang lain.',
      W / 2, 650, '16px sans-serif', '#7a6a4f', 'center');
  }

  function drawWin(ctx, k) {
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(0, 0, W, H);
    drawAwning(ctx, null);
    text(ctx, '🏆  JUARA WARUNG!', W / 2, 150, 'bold 60px sans-serif', '#b45309', 'center');
    text(ctx, 'Lima hari penuh — tidak ada pelanggan yang pulang lapar.', W / 2, 200, 'bold 21px sans-serif', INK, 'center');
    var dw = 176, gap = 24;
    var totalW = 6 * dw + 5 * gap;
    var x0 = (W - totalW) / 2;
    for (var i = 0; i < C.DISHES.length; i++) {
      drawDishArt(ctx, C.DISHES[i].id, x0 + i * (dw + gap) + dw / 2, 300, 56, 99);
      text(ctx, C.DISHES[i].name, x0 + i * (dw + gap) + dw / 2, 392, 'bold 16px sans-serif', INK, 'center');
    }
    ctx.fillStyle = PANEL;
    rr(ctx, 340, 430, 600, 150, 14); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#d9b36a'; ctx.stroke();
    text(ctx, 'Total uang: ' + C.money(k.money), 640, 480, 'bold 24px sans-serif', GREEN_D, 'center');
    text(ctx, 'Skor: ' + k.score + '   •   Disajikan: ' + k.served + '   •   Kombo terbaik: x' + k.bestCombo,
      640, 522, 'bold 19px sans-serif', INK, 'center');
    text(ctx, 'Warung Kilat kini legenda jalanan. Terima kasih sudah memasak!', 640, 556, '16px sans-serif', '#7a6a4f', 'center');
    ctx.fillStyle = GREEN;
    rr(ctx, 440, 620, 400, 60, 14); ctx.fill();
    text(ctx, '▶  MAIN LAGI  [ENTER]', 640, 659, 'bold 24px sans-serif', '#ffffff', 'center');
  }

  function drawGame(ctx, k, t) {
    ctx.clearRect(0, 0, W, H);
    if (k.screen === 'title') drawTitle(ctx, k, t);
    else if (k.screen === 'howto') drawHowto(ctx, k);
    else if (k.screen === 'daydone') drawDayDone(ctx, k, t);
    else if (k.screen === 'gameover') drawGameOver(ctx, k);
    else if (k.screen === 'win') drawWin(ctx, k);
    else drawPlay(ctx, k, t);
  }

  global.WarungDraw = {
    W: W, H: H, drawGame: drawGame, drawDishArt: drawDishArt,
    money: C.money, fmtTime: fmtTime
  };
})(typeof window !== 'undefined' ? window : globalThis);
