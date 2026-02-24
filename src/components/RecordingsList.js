"use client";

import { useEffect, useRef, useState } from "react";
import { createPlaybackEngine } from "../lib/playback";

const INSTRUMENT_COLORS = {
  piano: { accent: "rgb(6, 182, 212)", bg: "rgba(6, 182, 212, 0.08)", glow: "rgba(6,182,212,0.4)" },
  guitar: { accent: "rgb(16, 185, 129)", bg: "rgba(16, 185, 129, 0.08)", glow: "rgba(16,185,129,0.4)" },
  bass: { accent: "rgb(139, 92, 246)", bg: "rgba(139, 92, 246, 0.08)", glow: "rgba(139,92,246,0.4)" },
  violin: { accent: "rgb(245, 158, 11)", bg: "rgba(245, 158, 11, 0.08)", glow: "rgba(245,158,11,0.4)" },
  drums: { accent: "rgb(244, 63, 94)", bg: "rgba(244, 63, 94, 0.08)", glow: "rgba(244,63,94,0.4)" },
};

const DEFAULT_COLOR = INSTRUMENT_COLORS.piano;

export default function RecordingsList({ recordings, onDelete, onClearAll }) {
  const [playbackStates, setPlaybackStates] = useState({});
  const enginesRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(enginesRef.current).forEach((engine) => engine.dispose());
    };
  }, []);

  const getEngine = (recordingId) => {
    if (!enginesRef.current[recordingId]) {
      const recording = recordings.find((r) => r.id === recordingId);
      if (recording) {
        enginesRef.current[recordingId] = createPlaybackEngine(recording);
      }
    }
    return enginesRef.current[recordingId];
  };

  const togglePlayback = async (recordingId) => {
    const engine = getEngine(recordingId);
    if (!engine) return;

    const isPlaying = playbackStates[recordingId];
    if (isPlaying) {
      engine.stop();
      setPlaybackStates((prev) => ({ ...prev, [recordingId]: false }));
    } else {
      Object.entries(playbackStates).forEach(([id, playing]) => {
        if (playing) {
          const otherEngine = getEngine(id);
          otherEngine?.stop();
        }
      });
      await engine.play();
      setPlaybackStates((prev) =>
        Object.fromEntries(Object.keys(prev).map((id) => [id, id === recordingId]))
      );
    }
  };

  const handleDelete = (recordingId) => {
    const engine = enginesRef.current[recordingId];
    if (engine) {
      engine.dispose();
      delete enginesRef.current[recordingId];
    }
    onDelete(recordingId);
  };

  const onDragStartRecording = (e, recording) => {
    e.dataTransfer.setData("application/x-recording-id", recording.id);
    e.dataTransfer.setData(
      "application/x-recording-duration-ms",
      String(recording.duration || 0)
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-widest select-none"
            style={{ color: "var(--muted-foreground)" }}
          >
            Recordings
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {recordings.length}
          </span>
        </div>
        {recordings.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-2 py-1 rounded text-xs font-medium transition-all duration-150"
            style={{
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--destructive)";
              e.currentTarget.style.color = "var(--destructive)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted-foreground)";
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {recordings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 select-none">
          <div
            className="text-4xl mb-4"
            style={{ filter: "grayscale(1)", opacity: 0.25 }}
          >
            🎵
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
            No recordings yet
          </p>
          <p
            className="text-xs mt-1.5 leading-relaxed"
            style={{ color: "var(--muted-foreground)", opacity: 0.6, fontFamily: "var(--font-mono)" }}
          >
            Hit ● and start typing to record
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recordings.map((recording) => {
            const colors = INSTRUMENT_COLORS[recording.instrument] || DEFAULT_COLOR;
            const isPlaying = playbackStates[recording.id];
            return (
              <div
                key={recording.id}
                className="group relative flex items-center gap-2.5 rounded-lg transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
                style={{
                  backgroundColor: isPlaying ? colors.bg : "var(--muted)",
                  border: `1px solid ${isPlaying ? colors.accent + "50" : "var(--border)"}`,
                  borderLeft: `3px solid ${colors.accent}`,
                  padding: "9px 10px",
                  boxShadow: isPlaying ? `0 0 14px ${colors.glow}` : "none",
                }}
                draggable
                onDragStart={(e) => onDragStartRecording(e, recording)}
              >
                <button
                  onClick={() => togglePlayback(recording.id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150"
                  style={{
                    backgroundColor: isPlaying ? colors.accent : "transparent",
                    border: `1.5px solid ${colors.accent}`,
                    color: isPlaying ? "rgb(10,10,20)" : colors.accent,
                    boxShadow: isPlaying ? `0 0 10px ${colors.glow}` : "none",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: 0,
                  }}
                >
                  {isPlaying ? "■" : "▶"}
                </button>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-semibold truncate capitalize"
                    style={{ color: "var(--foreground)" }}
                  >
                    {recording.instrument}
                  </div>
                  <div
                    className="flex items-center gap-2 mt-0.5"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--muted-foreground)" }}
                  >
                    <span>{recording.notes.length} notes</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{Math.round(recording.duration / 100) / 10}s</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(recording.id)}
                  className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 flex-shrink-0"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--muted-foreground)",
                    fontSize: 12,
                    boxShadow: "none",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--destructive)";
                    e.currentTarget.style.backgroundColor = "rgba(244,63,94,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--muted-foreground)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Delete recording"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {recordings.length > 0 && (
        <p
          className="text-xs text-center mt-4 select-none"
          style={{ color: "var(--muted-foreground)", opacity: 0.5, fontFamily: "var(--font-mono)" }}
        >
          drag to timeline →
        </p>
      )}
    </div>
  );
}
