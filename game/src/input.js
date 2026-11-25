// Warung Kilat — mouse and keyboard input. Clicks are mapped through the
// shared LAYOUT hit areas in render.js; keys mirror every click action so
// the whole game is playable from the keyboard alone.

import { STATIONS } from './data.js';
import { LAYOUT } from './render.js';
import { sfx, toggleMute } from './audio.js';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

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

export function bindInput(canvas, state, hooks) {
  function canvasPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function tryStartStep(stationId) {
    const res = state.startStep(stationId);
    if (res === 'ok') {
      const st = STATIONS.find((x) => x.id === stationId);
      if (st.id === 'chop') sfx.chop();
      else if (st.id === 'fry' || st.id === 'grill') sfx.sizzle();
      else sfx.ding();
    } else if (res === 'wrong-station') {
      sfx.error();
      state.flash('Bukan stasiun itu! Lihat chip resep di piring.');
    } else if (res === 'busy') {
      sfx.error();
      state.flash('Stasiun sedang dipakai — tunggu sebentar.');
    } else if (res === 'no-order') {
      sfx.error();
      state.flash('Pilih pesanan dulu di order board.');
    }
    return res;
  }

  function tryServe() {
    const res = state.serveSelected();
    if (res) {
      sfx.serve();
      sfx.coin();
    } else {
      sfx.error();
      state.flash('Belum siap disajikan — selesaikan langkah masaknya.');
    }
    return res;
  }

  function clickAt(x, y) {
    if (state.screen === 'title') {
      if (inside(x, y, { x: 450, y: 520, w: 380, h: 64 })) { hooks.startGame(); return; }
      if (inside(x, y, { x: 450, y: 600, w: 380, h: 56 })) { state.screen = 'howto'; sfx.click(); return; }
      return;
    }
    if (state.screen === 'howto') {
      if (inside(x, y, { x: 450, y: 620, w: 380, h: 60 })) { hooks.startGame(); return; }
      return;
    }
    if (state.screen === 'dayend') {
      if (inside(x, y, { x: 450, y: 590, w: 380, h: 64 })) { hooks.nextDay(); return; }
      return;
    }
    if (state.screen === 'gameover') {
      if (inside(x, y, { x: 450, y: 470, w: 380, h: 64 })) { hooks.startGame(); return; }
      return;
    }
    if (state.screen !== 'play') return;

    // Order board: pick an order.
    const active = state.orders.filter((o) => o.state === 'waiting' || o.state === 'ready');
    for (let i = 0; i < active.length; i++) {
      if (inside(x, y, orderRect(i))) {
        state.selectedId = active[i].id;
        sfx.click();
        return;
      }
    }
    // Stations: cook the next step.
    for (let i = 0; i < STATIONS.length; i++) {
      if (inside(x, y, stationRect(i))) { tryStartStep(STATIONS[i].id); return; }
    }
    // Serve button.
    if (inside(x, y, LAYOUT.serve)) { tryServe(); return; }
  }

  canvas.addEventListener('click', (ev) => {
    const p = canvasPoint(ev);
    clickAt(p.x, p.y);
  });

  window.addEventListener('keydown', (ev) => {
    const k = ev.key.toLowerCase();
    if (k === 'm') { const m = toggleMute(); state.flash(m ? 'Suara mati.' : 'Suara hidup.'); return; }
    if (state.screen === 'title') {
      if (k === 'enter') hooks.startGame();
      else if (k === 'h') { state.screen = 'howto'; sfx.click(); }
      return;
    }
    if (state.screen === 'howto') {
      if (k === 'enter') hooks.startGame();
      else if (k === 'escape') state.screen = 'title';
      return;
    }
    if (state.screen === 'dayend') {
      if (k === 'enter') hooks.nextDay();
      return;
    }
    if (state.screen === 'gameover') {
      if (k === 'enter') hooks.startGame();
      else if (k === 'escape') state.screen = 'title';
      return;
    }
    if (state.screen !== 'play') return;
    if (k === 'p') { state.paused = !state.paused; sfx.click(); return; }
    if (k === ' ') { ev.preventDefault(); tryServe(); return; }
    if (k >= '1' && k <= '5') {
      const active = state.orders.filter((o) => o.state === 'waiting' || o.state === 'ready');
      const idx = Number(k) - 1;
      if (active[idx]) { state.selectedId = active[idx].id; sfx.click(); }
      return;
    }
    const st = STATIONS.find((x) => x.key.toLowerCase() === k);
    if (st) tryStartStep(st.id);
  });

  return { clickAt, tryStartStep, tryServe };
}
