// Warung Kilat — boot and main loop. Wires state, rendering and input
// together, runs the clock, and applies ?shot=1..4 screenshot scenes.

import { GameState } from './state.js';
import { drawGame, drawTitle, drawHowto, drawDayEnd, drawGameOver, W, H } from './render.js';
import { bindInput } from './input.js';
import { ensureAudio, startMusic, stopMusic, sfx } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W;
canvas.height = H;

const state = new GameState();
window.__warung = state; // test hook: play-tests drive the game through this.

const hooks = {
  startGame() {
    ensureAudio();
    sfx.click();
    state.startGame();
    startMusic();
  },
  nextDay() {
    ensureAudio();
    sfx.win();
    state.startDay(state.day + 1);
  },
};

bindInput(canvas, state, hooks);

// Screenshot scenes are real renders of the live state, staged by query.
const params = new URLSearchParams(window.location.search);
const shot = Number(params.get('shot') || 0);
if (shot >= 1 && shot <= 4) {
  applyShot(state, shot);
  if (shot === 4) stopMusic();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  state.update(dt);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'howto') drawHowto(ctx, state);
  else if (state.screen === 'dayend') drawDayEnd(ctx, state);
  else if (state.screen === 'gameover') drawGameOver(ctx, state);
  else drawGame(ctx, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
