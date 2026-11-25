# warung-rush-kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/xiannih/warung-rush-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/xiannih/warung-rush-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Kilat — Rush Hour Kitchen**: a complete, original Indonesian warung cooking game. Run a busy street-food kitchen: take named orders (nasi goreng, mie goreng, sate ayam, ayam geprek, gado-gado, es teh), cook each dish step by step across four stations (chop, fry, grill, boil), watch the plate fill in as you cook, and serve before customers lose patience — for coins, tips and combos across five ever-busier days.

## What's in v3 (zero-defect)

- Every station card is redesigned so no text can wrap: a one-word role (Talenan, Wajan, Panggangan, Panci) and a one-word status (Siap, Memasak…, Selesai) on their own reserved lines. The v2 flaw — "menganggur" wrapping to a second line — is gone by design, not by luck.
- Full text audit of every screen: order tickets, station cards, plate panel, serve panel, two-row pantry, top bar, hints, title, how-to, day-complete ledger and game-over. Short labels everywhere; nothing clipped, overlapping, truncated or hard to read.
- Every dish is drawn as itself (SVG): sate on skewers, noodle strands, smashed fried chicken with sambal, gado-gado vegetables, iced tea in a glass.
- The day-complete screen is a full ledger: dishes served by name with counts, money split into food vs tips, served vs walkouts, best combo, target vs earned, and a preview of the next day.
- The pantry sits in two full rows of six, so every ingredient chip (including Saus Kacang) is visible.

## Run it

```sh
python3 -m http.server 8080 --directory game
# open http://localhost:8080 in desktop Chrome and play
```

Or serve `game/` with any static HTTP server and open `index.html`. The game is static files only, plays offline, keyboard + mouse, and all sound is synthesised in the browser with WebAudio — no external files, no network requests.

## How to play

- Click an order on the order board (or press 1–4) to select it.
- Cook its next step at the right station: CHOP [Q], FRY [W], GRILL [E], BOIL [R]. The station for the next step is highlighted.
- When every step is done, the dish is plated — click SAJIKAN or press SPACE to serve for coins + a patience-based tip.
- Reach the day's money target before the timer ends. If 3 customers walk out, the warung closes.
- P pauses, M toggles sound, H shows how to play.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `buildDossier`.
