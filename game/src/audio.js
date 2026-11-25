// Warung Kilat sound: tiny WebAudio synth, no files, no network.

let ctx = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function audioCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (e) { ctx = null; }
  return ctx;
}

export function blip(freq, dur, type, vol) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') ac.resume();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch (e) { /* sound is optional */ }
}

export function sfx(name) {
  if (name === 'chop') { blip(220, 0.07, 'square', 0.05); }
  else if (name === 'sizzle') { blip(880, 0.12, 'sawtooth', 0.03); blip(1320, 0.1, 'sawtooth', 0.02); }
  else if (name === 'done') { blip(523, 0.1, 'sine', 0.09); setTimeout(() => blip(784, 0.14, 'sine', 0.09), 90); }
  else if (name === 'serve') { blip(659, 0.1, 'sine', 0.09); setTimeout(() => blip(880, 0.12, 'sine', 0.09), 80); setTimeout(() => blip(1046, 0.18, 'sine', 0.09), 170); }
  else if (name === 'walkout') { blip(196, 0.25, 'sawtooth', 0.06); }
  else if (name === 'coin') { blip(1568, 0.09, 'sine', 0.07); setTimeout(() => blip(2093, 0.16, 'sine', 0.07), 70); }
  else if (name === 'click') { blip(440, 0.05, 'sine', 0.05); }
  else if (name === 'vip') { blip(523, 0.1, 'sine', 0.09); setTimeout(() => blip(659, 0.1, 'sine', 0.09), 90); setTimeout(() => blip(784, 0.1, 'sine', 0.09), 180); setTimeout(() => blip(1046, 0.2, 'sine', 0.09), 270); }
  else if (name === 'hire') { blip(392, 0.1, 'sine', 0.09); setTimeout(() => blip(523, 0.16, 'sine', 0.09), 100); }
}
