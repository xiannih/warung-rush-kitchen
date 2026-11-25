# Warung Kilat — Rush Hour Kitchen (v5)

An original Indonesian warung cooking game for the make.fun bounty
"Make the best cooking game". It plays offline in a desktop browser
from its own static files, with keyboard and mouse, no network.

## Play

Cook orders at four stations (Chop Q, Fry W, Grill E, Boil R), serve
plates for coins and tips, keep customers patient, and grow a tiny
street cart into the busiest warung in town across 10 story days plus
an endless mode.

## v5: the employees are the subject

- **Joko the cook, Sari the waiter, Dewi the cashier** — each a person
  with a face, a dream, a backstory and a story arc across the days.
- **Loyalty is a real number**: it falls when staff are overworked,
  underpaid or ignored, and rises with praise, bonuses, days off and
  raises. Low loyalty means slower work and mistakes.
- **Raise requests**: employees ask for a raise between days — accept,
  negotiate or refuse, each with real consequences.
- **Poaching**: rival Bang Jono tries to hire your best people away.
- **Quitting**: loyalty at zero means a farewell — and a more
  expensive replacement.

## Run

Open `game/index.html` in a desktop browser, or serve `game/` with
any static server. `main.ts` hands the entry in: it copies `game/`
and `screenshots/` to the output directory and writes `dossier.json`.

MIT License — see LICENSE.
