# Blow Candles

**English** | [繁體中文](README.zh-TW.md)

A birthday cake for your phone's browser: blow at the microphone and the candles go out.

**Live demo:** https://vermillion-platypus-48259c.netlify.app/

The whole app is a single [`index.html`](index.html) with no build step.

## Features

- **Two kinds of candles:** regular candles (1–40) or number candles (up to 4 digits, such as `18` or `2026`). In Settings you can pick the cake (classic, chocolate or strawberry cream) or turn it off to show the candles alone.
- **Real-time 3D view (default):** switch views with the button at the top right, or pick 2D on the start screen before anything loads.
  - Rendered with three.js: a modelled cake and extruded number candles.
  - The light sits in the flames and flickers with them, candles cast shadows, the wax glows warm, and smoke rises after you blow.
  - Falls back to 2D if 3D isn't supported.
- **2D view:** runs smoothly on any device.
- **Blow detection:**
  - Measures how much louder the sound is than the room, so a quiet bedroom and a noisy restaurant feel the same.
  - Talking and short knocks on the phone are filtered out.
  - Blowing is accumulated over time, so an uneven, gusty blow still works.
- **Auto calibration:** stay quiet for 2 seconds, then blow for 3, and the threshold is set for you. You can also drag the threshold line by hand.
- **Sound:**
  - A breathy puff with a fading smoke hiss, and a match strike when relighting.
  - When every candle is out, Happy Birthday plays and confetti falls.
  - All sound is synthesized live in the browser, with no audio files.
- **English and Traditional Chinese:** browsers set to Traditional Chinese (zh-TW, zh-HK, zh-MO, zh-Hant) get Chinese; everyone else gets English. Settings has an override.
- **URL parameters:**
  - `?num=25`: number candles
  - `?count=3`: number of regular candles
  - `?r=2d` / `?r=3d`: open in 2D or 3D
  - `?cake=classic`, `?cake=chocolate`, `?cake=strawberry`: pick the cake
  - `?cake=0`: candles without the cake
  - `?lang=en` / `?lang=zh`: force the language
  - `?debug`: show detector readings

## Using and hosting it

Phone browsers only allow the microphone over **HTTPS** (or on `localhost`), so serve the file from an HTTPS host such as Netlify or GitHub Pages. Opening the file directly from storage, or embedding it in another site's iframe (claude.ai, for example), blocks the microphone. In that case, tap a candle to blow it out instead.

To try it locally, run:

```bash
python -m http.server 8765
```

Then open http://localhost:8765/.

The 3D view loads three.js 0.160 from jsDelivr. It needs a network connection and a browser with import map support (iOS Safari 16.4 or later).

## Versions

| Version | Date | Changes |
|---|---|---|
| v1.0.0 | 2026-10-07 | 2D view, regular and number candles, microphone blowing, adjustable threshold, synthesized sounds and birthday song |
| v2.0.0 | 2026-10-07 | Softer, breath-like blow-out sound; rebuilt blow detection (room-noise baseline, speech filtering, accumulated blowing); auto calibration |
| v3.0.0 | 2026-10-08 | Real-time 3D rendering (three.js), 3D by default, switchable to 2D |
| Unreleased | 2026-10-08 | Lighter 3D for phones; fireworks and party poppers; 3D is the default again, with 2D selectable on the start screen |

See the commit history for every individual change.

## Tests

[`tests/`](tests/) holds the headless-browser tests used during development. They feed synthesized recordings (blowing, talking, knocking, café noise) into a fake microphone and check that blowing puts the candles out while other sounds don't. They also cover auto calibration and the 3D view.

## License

[MIT](LICENSE)
