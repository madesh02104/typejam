import * as Tone from "tone";
import { INSTRUMENTS } from "./instruments";

export function createPlaybackEngine(recording, onEnd) {
  let instrument = null;
  let isReady = false;
  let isPlaying = false;
  let currentPart = null;

  const init = async () => {
    if (isReady) return;

    instrument = INSTRUMENTS[recording.instrument]();
    await instrument.ensureReady();

    isReady = true;
  };

  const play = async () => {
    if (isPlaying) return;
    if (!isReady) await init();

    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;

    const events = recording.notes.map((note) => {
      return {
        time: note.timestamp / 1000,
        note: note.note,
        duration: note.duration,
        velocity: note.velocity,
        row: note.row,
        i: note.i,
        len: note.len,
      };
    });

    currentPart = new Tone.Part((time, event) => {
      instrument.play(
        event.note,
        event.duration,
        time,
        event.velocity,
        event.row,
        event.i,
        event.len,
      );
    }, events);

    currentPart.loop = false;
    currentPart.start(0);

    Tone.Transport.start();
    isPlaying = true;

    const duration = recording.duration / 1000 + 0.1;

    Tone.Transport.scheduleOnce(() => {
      stop();
      if (onEnd) onEnd();
    }, `+${duration}`);
  };

  const stop = () => {
    if (!isPlaying) return;

    if (currentPart) {
      currentPart.stop();
      currentPart.dispose();
      currentPart = null;
    }

    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.cancel();

    isPlaying = false;
  };

  const dispose = () => {
    stop();

    if (instrument) {
      instrument.dispose();
      instrument = null;
    }

    isReady = false;
  };

  return {
    play,
    stop,
    dispose,

    get isPlaying() {
      return isPlaying;
    },
    get isReady() {
      return isReady;
    },
  };
}
