# Contributing to TypeJam

Thanks for your interest in contributing to TypeJam!

## Ways to contribute

- Fix bugs or improve performance
- Improve UI/UX and accessibility
- Add new instruments and samples
- Update documentation

If you are unsure what to work on, open a discussion or issue and describe your idea.

## Before you start

1. Search existing issues and discussions to avoid duplicates.
2. If the change is user-facing, open an issue describing the problem and your proposed fix.
3. For large changes, confirm the approach first to avoid rework.

## Development setup

1. Fork and clone the repo.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open the app at http://localhost:3000

## Creating a pull request

- Keep PRs focused and small when possible.
- Follow existing code style and patterns.
- Update documentation if behavior or UI changes.
- Run linting before you open the PR:

  ```bash
  npm run lint
  ```

## Commit and PR guidelines

- Use clear, descriptive commit messages.
- Include a short summary and testing notes in the PR description.
- If you did not run tests or linting, say so explicitly.

## Adding new instruments (especially welcome)

I am especially looking to add new instruments to the project as I started wit very few. Here is how to add your favorite instrument.

### 1) Add the audio samples

TypeJam loads audio samples from a separate audio repository served via jsDelivr. The base URL is defined in src/lib/samples.js.

- Add a new folder under `audio/<instrument>/` in the audio repo:
  https://github.com/madesh02104/typejam-audio-files
- Use simple, consistent file names that match the note map (see below).
- Commit and push the audio files to the `main` branch of that repo.

- It's ok if you cannot find the audio samples, just complete the code part and specify what you did and i will search and ad the samples myself.
- Most samples in the internet are not for commercial use, some needs crediting. Follow thier instruction before using the. Cite the sample source when raising pr, only then i can check and accept it.

### 2) Define the sample map

In [src/lib/samples.js](src/lib/samples.js), add:

- A new base entry in `BASES`, like:
  `myInstrument: `${CDN_BASE}/audio/my-instrument/``
- A new URL map, like `MY_INSTRUMENT_URLS`, mapping notes to file names.

For melodic instruments, the current sets use a 9-sample layout (same as piano/guitar). Example note keys:

- C3, F3, Bb3, C4, F4, Bb4, C5, F5, Bb5

For drums, the file mapping is defined in `DRUM_NOTE_TO_FILE` and key layout in src/lib/keys.js.

### 3) Register the instrument

In [src/lib/instruments.js](src/lib/instruments.js), add a new entry to `INSTRUMENTS`, for example:

- `myInstrument: () => makeSampledInstrument(BASES.myInstrument, MY_INSTRUMENT_URLS)`

If needed, set `transpose` or row gain options similar to `bass` or `drums`.

### 4) Add UI colors

Add your instrument color theme to both:

- [src/components/TrackArea.js](src/components/TrackArea.js)
- [src/components/RecordingsList.js](src/components/RecordingsList.js)

### 5) Verify locally

- Start the dev server and switch to your new instrument.
- Play notes from all rows to confirm samples load correctly.
- Record a short clip and ensure playback works.

---

If you need help with sampling, mapping, or naming conventions, open an issue and I will help you out.
