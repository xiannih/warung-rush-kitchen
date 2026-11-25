# warung-rush-kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/xiannih/warung-rush-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/xiannih/warung-rush-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Kilat — Rush Hour Kitchen**: a complete, original Indonesian warung cooking game. Run a busy street-food kitchen: take named orders (nasi goreng, mie goreng, sate ayam, ayam geprek, gado-gado, es teh), cook each dish step by step across four stations (chop, fry, grill, boil), plate it mid-assembly, and serve before customers lose patience — for coins, tips and combos across five ever-busier days.

## Run it

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080 in desktop Chrome and play
```

Or serve `game/` with any static HTTP server and open `index.html`. The game is static files only, plays offline, keyboard + mouse, and all sound is synthesised in the browser with WebAudio — no external files, no network requests.

## How to play

- Click an order on the order board (or press 1–4) to select it.
- Cook its next step at the right station: CHOP [Q], FRY [W], GRILL [E], BOIL [R].
- When every step is done, the dish is plated — click SAJIKAN or press SPACE to serve for coins + tip.
- Reach the day's money target before the timer ends. If 3 customers walk out, the warung closes.
- P pauses, M toggles sound, H shows how to play.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=1tgem1mj&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
