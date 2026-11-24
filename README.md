# ARUNIKA: Golden Hour

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/vyan0089-afk/gta6-01-v9/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/vyan0089-afk/gta6-01-v9/reward.svg)](https://make.fun/bounty/gta6-01)

**ARUNIKA: Golden Hour — open-world crime on a sun-soaked island, 10 story jobs, APD dispatch with roadblocks and air support, crew abilities, garage, saves, radio.**

An original open-world crime game in the spirit of GTA 6, built from scratch. Pulau Arunika is a 680×680 m tropical island city at golden hour: a beach boulevard, Kumala Pier, Marina Row, Pasar District and Old Town, all under a low orange sun with long shadows. Drive, steal cars, outrun the APD, run 10 story jobs, and build your crew.

## What is in the game

- **Open world** — explore on foot and by car; traffic cars, pedestrians, shops, palms, a pier and a marina.
- **Wanted 0–5 stars** — the APD responds with named dispatch units, roadblocks and Rajawali-1, the police helicopter with a searchlight.
- **10 story jobs** — each with an objective, distance, countdown, STAGE x/4 and a NEXT step. Job 2 "Courier Run" delivers a package to Kumala Pier against the clock.
- **Crew of 3** — Sari (Driver, Swap Plates), Bayu (Mechanic, Quick Fix), Lia (Lookout, Eyes Out) on Z / X / C, 30 s cooldowns.
- **Garage** — repaint (6 colours) and repair at Arunika Customs.
- **Weapons** — 6 slots, ammo, two locked until you progress.
- **Save / load** — F5 saves; continue from the start screen.
- **Radio** — 3 synthesised stations (Surya 101.5 Island Pop, Mango 98.6 Sunset Reggae, Neon 107.9 Night Drive), plus a synth engine and a police siren. All audio is generated in-page; no audio files.
- **HUD** — mission card, named APD dispatch list, weapon slots, crew cards, circular minimap with real streets, health / armour / car bars, dialogue, speed and radio. All text in English.

## How to play

Serve `game/` with any static HTTP server and open `game/index.html` in desktop Chrome. No build step, no network requests.

| Key | Action |
| --- | --- |
| WASD | Drive / walk |
| E | Enter / exit car (steal a traffic car) |
| G | Garage (near the red building at Marina Row) |
| Z / X / C | Crew abilities |
| 1–6 | Weapons |
| Click | Fire weapon |
| M | Radio station |
| F5 | Save game |
| Esc / P | Pause |

## Layout

- `main.ts` — hands the entry in (copies `game/` + `screenshots/`, writes `dossier.json`).
- `game/index.html`, `game/app.css` — the page and the HUD styling.
- `game/src/` — the game, one file per job: `config`, `world`, `vehicles`, `traffic`, `police`, `missions`, `crew`, `weapons`, `hud`, `audio`, `garage`, `save`, `shots`, `main`.
- `game/vendor/three.min.js` — Three.js r152, vendored.
- `screenshots/` — 4 real renders of the game: `drive.jpg` (cover), `race.jpg`, `foot.jpg`, `garage.jpg`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT. See `LICENSE`.
