// sound.js — every sound in Warung Kilat is synthesised live with WebAudio.
// No audio files, no network: just oscillators, a noise buffer and envelopes.
(function (global) {
  'use strict';

  var ctx = null;
  var muted = false;
  var musicTimer = null;
  var musicStep = 0;

  // A short pentatonic loop that sounds like a street stall at dusk.
  // G major pentatonic, played soft so it never fights the chopping.
  var MELODY = [392, 440, 494, 587, 659, 587, 494, 440, 392, 330, 392, 440];

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch (e) { ctx = null; }
    return ctx;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (muted) return;
    var ac = ensureCtx();
    if (!ac) return;
    try {
      var t0 = ac.currentTime + (when || 0);
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) { /* sound is decoration; a failure never stops the game */ }
  }

  function noise(dur, vol, lowpass) {
    if (muted) return;
    var ac = ensureCtx();
    if (!ac) return;
    try {
      var len = Math.max(1, Math.floor(ac.sampleRate * dur));
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ac.createBufferSource();
      src.buffer = buf;
      var filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass || 1200;
      var gain = ac.createGain();
      gain.gain.value = vol || 0.12;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  var Sounds = {
    unlock: function () {
      var ac = ensureCtx();
      if (ac && ac.state === 'suspended') ac.resume();
    },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },
    click: function () { tone(660, 0.07, 'triangle', 0.10); },
    chop: function () { noise(0.09, 0.20, 2400); tone(190, 0.08, 'square', 0.06); },
    sizzle: function () { noise(0.35, 0.10, 5200); },
    boil: function () { tone(220, 0.25, 'sine', 0.07, 0, 330); noise(0.25, 0.06, 900); },
    grill: function () { noise(0.3, 0.12, 1800); tone(140, 0.2, 'sawtooth', 0.05, 0, 90); },
    stepDone: function () { tone(523, 0.09, 'triangle', 0.12); tone(784, 0.12, 'triangle', 0.12, 0.08); },
    ready: function () { tone(659, 0.12, 'triangle', 0.14); tone(880, 0.18, 'triangle', 0.14, 0.10); },
    coin: function () {
      tone(988, 0.09, 'square', 0.08);
      tone(1319, 0.16, 'square', 0.08, 0.08);
      tone(1568, 0.22, 'triangle', 0.10, 0.16);
    },
    error: function () { tone(160, 0.18, 'sawtooth', 0.10, 0, 110); },
    walkout: function () { tone(392, 0.22, 'sawtooth', 0.09, 0, 196); tone(262, 0.3, 'sawtooth', 0.08, 0.18); },
    newOrder: function () { tone(587, 0.1, 'triangle', 0.11); tone(740, 0.12, 'triangle', 0.11, 0.09); },
    dayDone: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.13, i * 0.13); });
    },
    gameOver: function () {
      [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.3, 'triangle', 0.11, i * 0.18); });
    },
    startMusic: function () {
      if (musicTimer) return;
      musicTimer = setInterval(function () {
        if (muted) return;
        var f = MELODY[musicStep % MELODY.length];
        tone(f, 0.5, 'sine', 0.045);
        if (musicStep % 4 === 0) tone(f / 2, 0.9, 'sine', 0.03);
        musicStep++;
      }, 460);
    },
    stopMusic: function () {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    }
  };

  global.WarungSound = Sounds;
})(typeof window !== 'undefined' ? window : globalThis);
