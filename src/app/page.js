"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { INSTRUMENTS } from "../lib/instruments";
import { noteMap, indexMap, drumKeyToNote } from "../lib/keys";
import { createEmptyRecording } from "../lib/recording";
import {
  saveRecordings,
  loadRecordings,
  clearRecordings,
} from "../lib/storage";
import RecordingsList from "../components/RecordingsList";
import JamBoard from "../components/JamBoard";
import TransportControls from "../components/TransportControls";
import { createJamSession } from "../lib/jamSession";

export default function Page() {
  const [selected, setSelected] = useState("piano");
  const instRef = useRef(null);
  const [ready, setReady] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const currentRecordingRef = useRef(createEmptyRecording());
  const [recordings, setRecordings] = useState([]);
  const [clips, setClips] = useState([]);
  const [pxPerSec, setPxPerSec] = useState(100);
  const [snapSec, setSnapSec] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [numTracks, setNumTracks] = useState(10);
  const jamSessionRef = useRef(null);

  useEffect(() => {
    const savedRecordings = loadRecordings();
    setRecordings(savedRecordings);
  }, []);

  useEffect(() => {
    if (recordings.length > 0) {
      saveRecordings(recordings);
    }
  }, [recordings]);

  const toggleRecording = () => {
    if (!isRecording) {
      currentRecordingRef.current = createEmptyRecording();
      setRecordingStartTime(Date.now());
      setIsRecording(true);
    } else {
      setIsRecording(false);
      const final = {
        ...currentRecordingRef.current,
        duration: Date.now() - recordingStartTime,
      };
      if (final.notes.length > 0) {
        setRecordings((list) => {
          const instrumentCount = list.filter(
            (r) => r.instrument === selected,
          ).length;
          final.name = `${selected}${instrumentCount + 1}`;

          const existingIds = new Set(list.map((r) => r.id));
          while (existingIds.has(final.id)) {
            final.id = crypto.randomUUID();
          }
          return [...list, final];
        });
      }
      currentRecordingRef.current = createEmptyRecording();
      setRecordingStartTime(null);
    }
  };

  const handleDeleteRecording = (recordingId) => {
    setRecordings((list) => list.filter((r) => r.id !== recordingId));
  };

  const handleRenameRecording = (recordingId, newName) => {
    setRecordings((list) =>
      list.map((r) => (r.id === recordingId ? { ...r, name: newName } : r)),
    );
  };

  const recordingsById = useRef(new Map());
  useEffect(() => {
    const map = new Map();
    for (const r of recordings) map.set(r.id, r);
    recordingsById.current = map;
    if (jamSessionRef.current) {
      jamSessionRef.current.dispose();
      jamSessionRef.current = null;
    }
  }, [recordings]);

  const handleCreateClip = ({
    recordingId,
    trackIndex,
    startTimeSec,
    durationSec,
    instrument,
  }) => {
    const newClip = {
      id: crypto.randomUUID(),
      recordingId,
      trackIndex,
      startTimeSec,
      durationSec,
      instrument:
        instrument ||
        recordingsById.current.get(recordingId)?.instrument ||
        "piano",
      name:
        recordingsById.current.get(recordingId)?.name ||
        recordingsById.current.get(recordingId)?.instrument ||
        "rec",
    };
    setClips((prev) => [...prev, newClip]);
  };

  const handleUpdateClip = (clipId, patch) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, ...patch } : c)),
    );
  };

  const handleDeleteClip = (clipId) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
  };

  const ensureJamSession = () => {
    if (!jamSessionRef.current) {
      jamSessionRef.current = createJamSession(
        recordingsById.current,
        handlePlaybackEnd,
      );
    }
    return jamSessionRef.current;
  };

  const onPlayPause = async () => {
    const session = ensureJamSession();
    if (isPlaying) {
      session.pause();
      setIsPlaying(false);
    } else {
      await session.play(clips);
      setIsPlaying(true);
    }
  };

  const onStop = () => {
    const session = ensureJamSession();
    session.stop();
    setIsPlaying(false);
  };

  const handleDownload = async () => {
    if (clips.length === 0) return;
    setIsExporting(true);

    try {
      if (Tone.context.state !== "running") await Tone.start();

      const session = ensureJamSession();
      session.stop();
      setIsPlaying(false);

      const recorder = new Tone.Recorder();
      Tone.Destination.connect(recorder);
      recorder.start();

      let maxEndTime = 0;
      for (const clip of clips) {
        maxEndTime = Math.max(
          maxEndTime,
          clip.startTimeSec + (clip.durationSec || 0),
        );
      }

      const recordDuration = maxEndTime + 2;

      await session.play(clips);

      await new Promise((resolve) =>
        setTimeout(resolve, recordDuration * 1000),
      );

      const recording = await recorder.stop();
      Tone.Destination.disconnect(recorder);
      recorder.dispose();

      const url = URL.createObjectURL(recording);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jam-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsExporting(false);
      const session = ensureJamSession();
      session.stop();
    }
  };

  const handleClearAllRecordings = () => {
    if (recordings.length === 0) return;
    setRecordings([]);
    clearRecordings();
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (instRef.current) instRef.current.dispose();
      const factory = INSTRUMENTS[selected];
      const inst = factory();
      instRef.current = inst;
      await inst.ensureReady();
      if (!cancelled) setReady(true);
    };
    setReady(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    const heldKeys = new Set();
    const noteStartTimes = new Map();

    const onKeyDown = async (e) => {
      if (!ready) return;
      if (Tone.context.state !== "running") await Tone.start();
      const k = e.key.toLowerCase();
      if (heldKeys.has(k)) return;
      heldKeys.add(k);

      let noteData = null;

      if (selected === "drums") {
        const note = drumKeyToNote.get(k);
        const info = indexMap.get(k);
        if (note && info) {
          instRef.current.play(
            note,
            "8n",
            undefined,
            0.95,
            info.row,
            info.i,
            info.len,
          );
          if (isRecording) {
            noteData = {
              instrument: selected,
              note,
              row: info.row,
              i: info.i,
              len: info.len,
              timestamp: Date.now() - recordingStartTime,
              duration: "8n",
              velocity: 0.95,
            };
          }
        }
      } else {
        const m = noteMap.get(k);
        if (m) {
          const info = indexMap.get(k);
          instRef.current.triggerAttack(
            m.note,
            undefined,
            0.9,
            m.row,
            info?.i ?? 0,
            info?.len ?? 1,
          );
          if (isRecording) {
            const now = Date.now();
            noteStartTimes.set(k, now);
            noteData = {
              instrument: selected,
              note: m.note,
              row: m.row,
              i: info?.i ?? 0,
              len: info?.len ?? 1,
              timestamp: now - recordingStartTime,
              duration: "8n",
              velocity: 0.9,
            };
          }
        }
      }

      if (isRecording && noteData) {
        currentRecordingRef.current = {
          ...currentRecordingRef.current,
          instrument: selected,
          notes: [...currentRecordingRef.current.notes, noteData],
        };
      }
    };

    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (!heldKeys.has(k)) return;
      heldKeys.delete(k);

      if (selected !== "drums") {
        const m = noteMap.get(k);
        if (m) {
          const info = indexMap.get(k);
          instRef.current.triggerRelease(
            m.note,
            undefined,
            m.row,
            info?.i ?? 0,
            info?.len ?? 1,
          );
          if (isRecording && noteStartTimes.has(k)) {
            const startTime = noteStartTimes.get(k);
            const duration = Date.now() - startTime;
            noteStartTimes.delete(k);
            const notes = currentRecordingRef.current.notes;
            for (let i = notes.length - 1; i >= 0; i--) {
              if (notes[i].note === m.note && notes[i].duration === "8n") {
                notes[i].duration = `${duration}ms`;
                break;
              }
            }
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [selected, ready, isRecording, recordingStartTime]);

  return (
    <main className="p-3 h-screen w-full box-border flex flex-col gap-3 overflow-hidden">
      <div className="paper flex items-center gap-4 px-4 py-3 flex-shrink-0">
        <div className="flex-shrink-0 select-none">
          <h1
            className="text-xl font-bold leading-none tracking-tight"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, rgb(0, 255, 170) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TypeJam
          </h1>
          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--muted-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Jam music by typing
          </p>
        </div>

        <div
          className="w-px h-8 flex-shrink-0"
          style={{ backgroundColor: "var(--border)" }}
        />

        <label className="flex items-center gap-2.5 flex-shrink-0">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            Instrument
          </span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="px-2.5 py-1.5 text-sm font-semibold rounded-md"
            style={{
              backgroundColor: "var(--input)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            <option value="piano">Piano</option>
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
            <option value="violin">Violin</option>
            <option value="drums">Drums</option>
          </select>
        </label>

        <div
          className="w-px h-8 flex-shrink-0"
          style={{ backgroundColor: "var(--border)" }}
        />

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={toggleRecording}
            disabled={!ready}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0"
            style={{
              backgroundColor: isRecording
                ? "var(--destructive)"
                : "var(--muted)",
              border: `2px solid ${isRecording ? "var(--destructive)" : "var(--border)"}`,
              boxShadow: isRecording ? "0 0 12px rgba(255,59,48,0.4)" : "none",
              animation: isRecording
                ? "pulse-record 1.1s ease-in-out infinite"
                : "none",
            }}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <span
                className="block rounded-sm"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: "var(--destructive-foreground)",
                }}
              />
            ) : (
              <span
                className="block rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: "var(--destructive)",
                }}
              />
            )}
          </button>
          <span
            className="text-xs font-semibold tracking-widest select-none"
            style={{
              color: isRecording
                ? "var(--destructive)"
                : "var(--muted-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {isRecording ? "REC ●" : "REC"}
          </span>
        </div>

        <div
          className="w-px h-8 flex-shrink-0"
          style={{ backgroundColor: "var(--border)" }}
        />

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
          style={{
            backgroundColor: ready
              ? "rgba(16,185,129,0.12)"
              : "rgba(245,158,11,0.12)",
            color: ready ? "rgb(52,211,153)" : "rgb(251,191,36)",
            border: `1px solid ${ready ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{
              backgroundColor: ready ? "rgb(52,211,153)" : "rgb(251,191,36)",
              animation: !ready ? "dot-blink 1s ease-in-out infinite" : "none",
            }}
          />
          {ready ? "Ready" : "Loading…"}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-[340px_1fr] gap-3 min-h-0">
        <div className="overflow-auto paper p-3 min-h-0">
          <RecordingsList
            recordings={recordings}
            onDelete={handleDeleteRecording}
            onRename={handleRenameRecording}
            onClearAll={handleClearAllRecordings}
            currentInstrument={selected}
          />
        </div>
        <div className="flex flex-col paper p-3 min-h-0 min-w-0">
          <TransportControls
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onStop={onStop}
            pxPerSec={pxPerSec}
            onChangePxPerSec={setPxPerSec}
            snapSec={snapSec}
            onChangeSnapSec={setSnapSec}
            onDownload={handleDownload}
          />
          <div className="mt-2 flex-1 min-h-0 overflow-hidden rounded-md">
            <JamBoard
              clips={clips}
              onCreateClip={handleCreateClip}
              onUpdateClip={handleUpdateClip}
              onDeleteClip={handleDeleteClip}
              pxPerSec={pxPerSec}
              numTracks={numTracks}
              onAddTrack={() => setNumTracks((n) => n + 1)}
              snapSec={snapSec}
              isActive={isPlaying}
            />
          </div>
        </div>
      </div>
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <h3 className="text-xl font-bold text-foreground">
              Downloading Jam...
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs text-center">
              Please wait while your jam session is being rendered to an audio
              file...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
