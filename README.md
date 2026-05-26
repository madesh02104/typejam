# TypeJam

TypeJam is a browser-based music creation studio. Play instruments with your keyboard, record takes, arrange clips on a timeline, and export a mixdown.

Live site: https://typejam.netlify.app/
Demo video: https://www.loom.com/share/649501b7e11a428a873a7fa71b199140

## What it does

- Keyboard-mapped instruments with a consistent layout across rows
- Live recording and clip-based arranging on the JamBoard
- Playback engine that mixes multiple tracks
- Export to audio using the Web Audio graph

## Project structure

```
public/
	instruments/           # Static instrument assets (non-audio)
src/
	app/                   # Next.js app routes and layout
		globals.css          # Global styles and theme variables
		layout.js            # App shell and metadata
		page.js              # Main UI: instrument selection, recording, JamBoard
	components/            # UI building blocks
		InfoPanel.js         # How-it-works and instrument key mapping UI
		JamBoard.js          # Timeline area and drag-and-drop surface
		TrackArea.js         # Track lanes and clip rendering
		RecordingsList.js    # Saved takes list and playback actions
		TransportControls.js # Play, stop, export, snap, zoom controls
	lib/                   # Audio engine and data helpers
		instruments.js       # Instrument registry wired to samplers
		samples.js           # Sample URL maps and CDN base paths
		sampledInstrument.js # Sampler wiring, FX, and dynamic parameters
		keys.js              # Keyboard-to-note mapping per row
		recording.js          # Recording model and defaults
		playback.js           # Single-recording playback engine
		jamSession.js         # Multi-clip playback scheduler
		storage.js            # Local persistence for recordings
		utils.js              # Shared helpers
```

## Run locally

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Start the dev server:

	 ```bash
	 npm run dev
	 ```

3. Open http://localhost:3000

## Contributing

See CONTRIBUTING.md for setup and contribution guidelines.

## Notes

Instrument samples are fetched from a separate audio repository via a CDN. If an instrument is missing samples, it will not produce sound until those files are available.
