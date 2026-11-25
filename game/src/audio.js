'use strict';
/* Tiny WebAudio synth. No audio files, no network. Silent until first input. */
window.WarungSound = (function () {
  var ctx = null;
  var muted = false;
  function ensure() {
    if (!ctx) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function beep(freq, dur, type, vol) {
    if (muted) return;
    var ac = ensure();
    if (!ac) return;
    try {
      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.08;
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (dur || 0.12));
      o.stop(ac.currentTime + (dur || 0.12));
    } catch (e) { /* sound is optional */ }
  }
  return {
    click: function () { beep(660, 0.07, 'triangle', 0.05); },
    step: function () { beep(520, 0.1, 'sine', 0.08); beep(780, 0.12, 'sine', 0.06); },
    serve: function () { beep(523, 0.1, 'triangle', 0.09); beep(659, 0.1, 'triangle', 0.09); beep(784, 0.18, 'triangle', 0.09); },
    walkout: function () { beep(220, 0.25, 'sawtooth', 0.05); },
    dayDone: function () { beep(523, 0.12, 'triangle', 0.09); beep(659, 0.12, 'triangle', 0.09); beep(784, 0.12, 'triangle', 0.09); beep(1046, 0.25, 'triangle', 0.09); },
    toggleMute: function () { muted = !muted; return muted; },
    isMuted: function () { return muted; }
  };
})();
