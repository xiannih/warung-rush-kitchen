# Warung Kilat — Rush Hour Kitchen (v4)

An original Indonesian warung cooking game that plays offline in a desktop
browser from static files, with keyboard and mouse.

## How to play

Cook orders at four stations (Q chop, W fry, E grill, R boil), serve them
before customers lose patience, and grow a tiny street stall into a famous
restaurant.

- **Real people:** customers walk in, sit at tables, and show their mood.
  Click any customer to see their order. Serve them fast and they leave
  delighted; ignore them and they storm off.
- **Hire staff:** between days, hire a cook (faster cooking), a waiter
  (more patient customers) and a cashier (bigger tips). Each has levels,
  wages and upgrades — and each one is visible working in your warung.
- **Shop:** buy a faster stove, extra tables, a bigger fridge and a big wok.
- **Story:** 10 story days with Pakde Slamet, Bu Ratna, the food critic
  Raka and rival Bang Jono — then endless mode, where the days never stop
  and the targets keep rising.
- **Events:** rush hour, a critic visit and big tour groups keep every
  day different.

## Run it

Open `game/index.html` in a desktop browser, or serve `game/` with any
static server. No network, no build step, all sound synthesised in the
browser.

## Hand in

`main.ts` (Node 22) copies `game/` and `screenshots/` to the output
directory and writes `dossier.json` with `buildDossier` from
`vendor/makefun-game.ts`. Outside the grader, `MAKEFUN_OUTPUT_DIR` stands
in for `/output`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see LICENSE.
