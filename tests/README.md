# Tests

These tests feed synthesized recordings into the app through Chrome's fake microphone (`--use-file-for-fake-audio-capture`) to check blow detection and rendering.

## Setup

Install Playwright and generate the test recordings into `wav/`:

```bash
npm i playwright-core@1.48.2
```

```bash
python gen_audio.py
```

In a separate terminal, serve the app:

```bash
python -m http.server 8765 --directory ..
```

## Running the tests

Check which sounds blow the candles out: blowing, talking, knocking and background noise.

```bash
node detector-matrix.js quiet,cafe,quiet_blow_medium,quiet_talk_loud,quiet_tap "?count=5&th=40"
```

The synthesized recordings are levelled for a threshold of 40, lower than the app's default of 75, so keep `th=40` in the query. Without a query, the script uses `?th=40`.

Check auto calibration, both when it succeeds and when it hears no blow:

```bash
node calibration.js
```

Take 3D screenshots and test tapping and blowing:

```bash
node render-3d.js "?count=5&q=0&r=3d" shot quiet tap,blow
```

Check that the English page, `en/index.html`, matches `index.html`:

```bash
node ../tools/build-en.mjs --check
```

Set the `CHROME` environment variable to point at your Chrome executable; it defaults to the Windows install path.
