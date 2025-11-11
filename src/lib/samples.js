const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/madesh02104/typejam-audio-files@main";

export const BASES = {
  piano: `${CDN_BASE}/audio/piano/`,
  guitar: `${CDN_BASE}/audio/guitar/`,
  bass: `${CDN_BASE}/audio/bass/`,
  violin: `${CDN_BASE}/audio/violin/`,
  drums: `${CDN_BASE}/audio/drums/`,
};

export const PIANO_URLS = {
  C3: "C3.mp3",
  F3: "F3.mp3",
  Bb3: "Bb3.mp3",
  C4: "C4.mp3",
  F4: "F4.mp3",
  Bb4: "Bb4.mp3",
  C5: "C5.mp3",
  F5: "F5.mp3",
  Bb5: "Bb5.mp3",
};

export const GUITAR_URLS = {
  C3: "C3.mp3",
  F3: "F3.mp3",
  Bb3: "Bb3.mp3",
  C4: "C4.mp3",
  F4: "F4.mp3",
  Bb4: "Bb4.mp3",
  C5: "C5.mp3",
  F5: "F5.mp3",
  Bb5: "Bb5.mp3",
};

export const BASS_URLS = {
  C2: "C2.mp3",
  F2: "F2.mp3",
  Bb2: "Bb2.mp3",
  C3: "C3.mp3",
  F3: "F3.mp3",
  Bb3: "Bb3.mp3",
  C4: "C4.mp3",
  F4: "F4.mp3",
  Bb4: "Bb4.mp3",
};

export const VIOLIN_URLS = {
  C4: "C4.mp3",
  F4: "F4.mp3",
  Bb4: "Bb4.mp3",
  C5: "C5.mp3",
  F5: "F5.mp3",
  Bb5: "Bb5.mp3",
  C6: "C6.mp3",
  F6: "F6.mp3",
  Bb6: "Bb6.mp3",
};

export const DRUM_NOTE_TO_FILE = {
  C1: "kick.mp3",
  D1: "snare.mp3",
  E1: "hihat-closed.mp3",
  F1: "hihat-open.mp3",
  G1: "tom-low.mp3",
  A1: "tom-mid.mp3",
  B1: "tom-high.mp3",
  C2: "ride.mp3",
  D2: "crash.mp3",
};

console.groupCollapsed("[TypeJam][samples] URL maps (note->file)");
console.log("piano", Object.keys(PIANO_URLS));
console.log("guitar", Object.keys(GUITAR_URLS));
console.log("bass", Object.keys(BASS_URLS));
console.log("violin", Object.keys(VIOLIN_URLS));
console.log("drums", DRUM_NOTE_TO_FILE);
console.groupEnd();
