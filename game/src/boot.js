// boot.js — starts Warung Kilat: grabs the canvas, wires the kitchen to the
// controls and the renderer, and runs the frame loop. It also exposes the
// small debug handle play-tests and screenshot staging use.
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var k = WarungKitchen.newKitchen();
  var last = performance.now();

  function draw() {
    WarungDraw.drawGame(ctx, k, performance.now() / 1000);
  }

  WarungControls.bindControls(canvas, k, draw);

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!k.paused && !k.frozen) WarungKitchen.tick(k, dt);
    draw();
    requestAnimationFrame(frame);
  }

  draw();
  requestAnimationFrame(frame);

  // Debug handle: staging, snapshots and direct actions for tests.
  // The game never needs this to play; it only makes the game testable.
  window.__warung = {
    kitchen: k,
    snapshot: function () { return WarungShots.snapshot(k); },
    stageShot: function (name) { var r = WarungShots.stageShot(k, name); draw(); return r; },
    startDay: function (day) { WarungKitchen.startDay(k, day || 1); draw(); return WarungShots.snapshot(k); },
    cookAt: function (station) { return WarungKitchen.cookAt(k, station); },
    serve: function () { return WarungKitchen.serveSelected(k); },
    select: function (i) { k.selected = i; draw(); return WarungShots.snapshot(k); },
    setTime: function (sec) { k.timeLeft = sec; return WarungShots.snapshot(k); },
    setWalkouts: function (n) { k.walkouts = n; return WarungShots.snapshot(k); },
    version: 'warung-kilat-v2'
  };
})();
