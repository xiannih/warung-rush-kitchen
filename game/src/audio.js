// Warung Kilat — all sound is synthesised in the browser with WebAudio.
// No audio files, no network: every effect is an oscillator or filtered
// noise burst, and the little background tune is a sequenced melody.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A bright pentatonic warung-street melody, looped while a day is running.
const MELODY = [523, 587, 659, 784, 880, 784, 659, 587, 523, 0, 659, 784, 0, 659, 587, 0];

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, filterFreq) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export const sfx = {
  click() { tone(700, 0.07, 'square', 0.08); },
  chop() { noiseBurst(0.08, 0.25, 1800); tone(180, 0.08, 'triangle', 0.12); },
  sizzle() { noiseBurst(0.35, 0.12, 5200); },
  ding() { tone(1046, 0.25, 'sine', 0.16); tone(1568, 0.3, 'sine', 0.1, 0.08); },
  coin() { tone(988, 0.1, 'square', 0.1); tone(1319, 0.22, 'square', 0.1, 0.09); },
  error() { tone(220, 0.18, 'sawtooth', 0.1, 0, 160); },
  walkout() { tone(392, 0.2, 'triangle', 0.12, 0, 262); tone(262, 0.3, 'triangle', 0.12, 0.18); },
  serve() { tone(784, 0.12, 'sine', 0.14); tone(1046, 0.12, 'sine', 0.14, 0.1); tone(1319, 0.2, 'sine', 0.14, 0.2); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.14));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'triangle', 0.14, i * 0.16));
  },
};

export function startMusic() {
  stopMusic();
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const f = MELODY[musicStep % MELODY.length];
    musicStep++;
    if (f) tone(f, 0.22, 'triangle', 0.045);
  }, 260);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
