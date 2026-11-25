// controls.js — keyboard and mouse for Warung Kilat.
// The canvas is the whole game, so clicks are mapped back to the same
// measured rectangles draw.js lays out: order tickets, station cards,
// the serve panel and the big buttons. Nothing is positioned from the page.
(function (global) {
  'use strict';

  var K = global.WarungKitchen;
  var Snd = global.WarungSound;

  // Rectangles that match draw.js exactly (1280x800 canvas).
  var ORDER_TICKETS = [];
  var STATION_CARDS = [];
  for (var i = 0; i < 4; i++) {
    ORDER_TICKETS.push({ x: 16 + i * 316, y: 84, w: 300, h: 130 });
    STATION_CARDS.push({ x: 16 + i * 316, y: 238, w: 300, h: 152 });
  }
  var SERVE_PANEL = { x: 812, y: 414, w: 452, h: 172 };
  var TITLE_START = { x: 440, y: 520, w: 400, h: 64 };
  var TITLE_HOWTO = { x: 490, y: 600, w: 300, h: 54 };
  var HOWTO_START = { x: 440, y: 640, w: 400, h: 60 };
  var DAYDONE_NEXT = { x: 440, y: 692, w: 400, h: 60 };
  var GAMEOVER_RETRY = { x: 440, y: 540, w: 400, h: 60 };
  var WIN_AGAIN = { x: 440, y: 620, w: 400, h: 60 };

  function inside(rect, px, py) {
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  function canvasPoint(canvas, evt) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - r.left) * (canvas.width / r.width),
      y: (evt.clientY - r.top) * (canvas.height / r.height)
    };
  }

  function bindControls(canvas, k, onAction) {
    function act() { if (onAction) onAction(); }

    function startOrAdvance() {
      if (k.screen === 'title' || k.screen === 'howto') {
        Snd.unlock();
        K.startDay(k, 1);
        Snd.click();
        act();
      } else if (k.screen === 'daydone') {
        K.startDay(k, k.day + 1);
        Snd.click();
        act();
      } else if (k.screen === 'gameover') {
        var fresh = K.newKitchen();
        fresh.screen = 'play';
        K.startDay(fresh, 1);
        // Keep the same object identity the loop is watching.
        copyInto(k, fresh);
        act();
      } else if (k.screen === 'win') {
        var again = K.newKitchen();
        K.startDay(again, 1);
        copyInto(k, again);
        act();
      }
    }

    function copyInto(dst, src) {
      var keys = Object.keys(src);
      for (var i = 0; i < keys.length; i++) dst[keys[i]] = src[keys[i]];
    }

    function cook(stationId) {
      if (k.screen !== 'play' || k.paused) return;
      var res = K.cookAt(k, stationId);
      if (res === 'ok' || res === 'wrong') act();
    }

    function serve() {
      if (k.screen !== 'play' || k.paused) return;
      if (K.serveSelected(k)) act();
      else { Snd.error(); act(); }
    }

    window.addEventListener('keydown', function (evt) {
      var key = evt.key.toLowerCase();
      if (key === ' ') evt.preventDefault();
      Snd.unlock();
      if (key === 'm') { Snd.setMuted(!Snd.isMuted()); act(); return; }
      if (key === 'h') {
        if (k.screen === 'play') { k.screen = 'howto'; k.returnTo = 'play'; }
        else if (k.screen === 'howto' && k.returnTo === 'play') k.screen = 'play';
        else if (k.screen === 'title') k.screen = 'howto';
        else if (k.screen === 'howto') k.screen = 'title';
        act();
        return;
      }
      if (key === 'p' || key === 'escape') {
        if (k.screen === 'play') { k.paused = !k.paused; act(); }
        else if (k.screen === 'howto' && k.returnTo === 'play') { k.screen = 'play'; act(); }
        return;
      }
      if (key === 'enter') { startOrAdvance(); return; }
      if (k.screen !== 'play' || k.paused) return;
      if (key >= '1' && key <= '4') {
        var idx = Number(key) - 1;
        if (idx < k.orders.length) { k.selected = idx; Snd.click(); act(); }
        return;
      }
      if (key === 'q' || key === 'w' || key === 'e' || key === 'r') {
        var map = { q: 'chop', w: 'fry', e: 'grill', r: 'boil' };
        cook(map[key]);
        return;
      }
      if (key === ' ') serve();
    });

    canvas.addEventListener('click', function (evt) {
      Snd.unlock();
      var pt = canvasPoint(canvas, evt);
      if (k.screen === 'title') {
        if (inside(TITLE_START, pt.x, pt.y)) startOrAdvance();
        else if (inside(TITLE_HOWTO, pt.x, pt.y)) { k.screen = 'howto'; act(); }
        return;
      }
      if (k.screen === 'howto') {
        if (inside(HOWTO_START, pt.x, pt.y)) startOrAdvance();
        return;
      }
      if (k.screen === 'daydone') {
        if (inside(DAYDONE_NEXT, pt.x, pt.y)) startOrAdvance();
        return;
      }
      if (k.screen === 'gameover') {
        if (inside(GAMEOVER_RETRY, pt.x, pt.y)) startOrAdvance();
        return;
      }
      if (k.screen === 'win') {
        if (inside(WIN_AGAIN, pt.x, pt.y)) startOrAdvance();
        return;
      }
      if (k.screen !== 'play' || k.paused) return;
      for (var i = 0; i < ORDER_TICKETS.length; i++) {
        if (inside(ORDER_TICKETS[i], pt.x, pt.y) && i < k.orders.length) {
          k.selected = i;
          Snd.click();
          act();
          return;
        }
      }
      for (var s = 0; s < STATION_CARDS.length; s++) {
        if (inside(STATION_CARDS[s], pt.x, pt.y)) {
          cook(['chop', 'fry', 'grill', 'boil'][s]);
          return;
        }
      }
      if (inside(SERVE_PANEL, pt.x, pt.y)) serve();
    });
  }

  global.WarungControls = { bindControls: bindControls };
})(typeof window !== 'undefined' ? window : globalThis);
