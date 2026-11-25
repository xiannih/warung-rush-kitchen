/* Warung Kilat v5 — sound: tiny WebAudio synth, no files, no network. */
'use strict';

var SoundFX = (function () {
  var ctx = null;
  var muted = false;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, when) {
    if (muted) return;
    var ac = ensure();
    if (!ac) return;
    var t = ac.currentTime + (when || 0);
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  return {
    toggleMute: function () { muted = !muted; return muted; },
    click: function () { tone(660, 0.06, 'square', 0.05); },
    chop: function () { tone(220, 0.08, 'square', 0.10); tone(180, 0.08, 'square', 0.08, 0.07); },
    sizzle: function () { tone(900, 0.15, 'sawtooth', 0.04); tone(1200, 0.12, 'sawtooth', 0.03, 0.05); },
    ding: function () { tone(880, 0.25, 'sine', 0.12); tone(1320, 0.3, 'sine', 0.08, 0.08); },
    coin: function () { tone(988, 0.1, 'sine', 0.12); tone(1319, 0.22, 'sine', 0.12, 0.08); },
    bad: function () { tone(220, 0.25, 'sawtooth', 0.08); tone(165, 0.35, 'sawtooth', 0.08, 0.12); },
    cheer: function () { tone(523, 0.12, 'sine', 0.10); tone(659, 0.12, 'sine', 0.10, 0.1); tone(784, 0.25, 'sine', 0.12, 0.2); },
    hire: function () { tone(392, 0.12, 'triangle', 0.12); tone(523, 0.12, 'triangle', 0.12, 0.1); tone(659, 0.2, 'triangle', 0.12, 0.2); }
  };
})();
