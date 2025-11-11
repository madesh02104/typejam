import * as Tone from "tone";
import { INSTRUMENTS } from "./instruments";

// Build and control a session that can play multiple recordings as clips on a shared Transport.
export function createJamSession(recordingsById, onPlaybackEnd) {
  /** @type {Map<string, { instrument: any, ready: boolean }>} */
  const engineByRecording = new Map();
  /** @type {Tone.Part[]} */
  let parts = [];
  let started = false;
  let stopScheduleId = null; // Track the scheduled stop event

  const ensureEngine = async (recordingId) => {
    let engine = engineByRecording.get(recordingId);
    if (!engine) {
      const rec = recordingsById.get(recordingId);
      if (!rec) return null;
      const instrument = INSTRUMENTS[rec.instrument]();
      await instrument.ensureReady();
      engine = { instrument, ready: true };
      engineByRecording.set(recordingId, engine);
    }
    return engine;
  };

  const makeEvents = (rec) =>
    rec.notes.map((n) => ({
      time: n.timestamp / 1000,
      note: n.note,
      duration: n.duration,
      velocity: n.velocity,
      row: n.row,
      i: n.i,
      len: n.len,
    }));

  const clearParts = () => {
    parts.forEach((p) => {
      try {
        p.stop();
        p.dispose();
      } catch {}
    });
    parts = [];
  };

  const clearScheduledStop = () => {
    if (stopScheduleId !== null) {
      Tone.Transport.clear(stopScheduleId);
      stopScheduleId = null;
    }
  };

  return {
    async play(clips) {
      if (Tone.context.state !== "running") await Tone.start();
      await Tone.loaded();

      // Build parts for all clips
      clearParts();
      let maxEndTime = 0; // Track the latest end time across all clips

      for (const clip of clips) {
        const rec = recordingsById.get(clip.recordingId);
        if (!rec) continue;
        const engine = await ensureEngine(clip.recordingId);
        if (!engine) continue;
        const events = makeEvents(rec);
        const part = new Tone.Part((time, ev) => {
          engine.instrument.play(
            ev.note,
            ev.duration,
            time,
            ev.velocity,
            ev.row,
            ev.i,
            ev.len
          );
        }, events);
        part.loop = false;
        // offset by clip start time on the transport
        part.start(clip.startTimeSec);
        parts.push(part);

        // Calculate the end time of this clip
        const clipEndTime = clip.startTimeSec + (clip.durationSec || 0);
        maxEndTime = Math.max(maxEndTime, clipEndTime);
      }

      if (!started) {
        Tone.Transport.seconds = 0;
        started = true;
      }

      // Clear any previously scheduled stop
      clearScheduledStop();

      // Schedule the Transport to stop at the end of the last clip
      if (maxEndTime > 0) {
        stopScheduleId = Tone.Transport.schedule(() => {
          console.log(
            "[TypeJam][jamSession] Playback complete, stopping at",
            maxEndTime
          );
          Tone.Transport.stop();
          started = false;
          // Notify parent component that playback has ended
          if (onPlaybackEnd) {
            onPlaybackEnd();
          }
        }, maxEndTime);
        console.log(
          "[TypeJam][jamSession] Scheduled stop at",
          maxEndTime,
          "seconds"
        );
      }

      Tone.Transport.start();
    },
    pause() {
      Tone.Transport.pause();
    },
    stop() {
      clearScheduledStop();
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
      Tone.Transport.cancel();
      clearParts();
      started = false;
    },
    dispose() {
      this.stop();
      for (const e of engineByRecording.values()) {
        try {
          e.instrument.dispose();
        } catch {}
      }
      engineByRecording.clear();
    },
  };
}
