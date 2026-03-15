"use client";

import {
  Play,
  Square,
  Trash2,
  Info,
  Grab,
  ChevronRight,
  Keyboard,
  Music,
  Pause,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPlaybackEngine } from "../lib/playback";
import styles from "./InfoPanel.module.css";

const INSTRUMENT_COLORS = {
  piano: {
    accent: "rgb(0, 184, 217)",
    bg: "rgba(0, 184, 217, 0.08)",
    glow: "rgba(0,184,217,0.4)",
  },
  guitar: {
    accent: "rgb(52, 199, 89)",
    bg: "rgba(52, 199, 89, 0.08)",
    glow: "rgba(52, 199, 89, 0.4)",
  },
  bass: {
    accent: "rgb(175, 82, 222)",
    bg: "rgba(175, 82, 222, 0.08)",
    glow: "rgba(175, 82, 222, 0.4)",
  },
  violin: {
    accent: "rgb(255, 149, 0)",
    bg: "rgba(255, 149, 0, 0.08)",
    glow: "rgba(255, 149, 0, 0.4)",
  },
  drums: {
    accent: "rgb(255, 59, 48)",
    bg: "rgba(255, 59, 48, 0.08)",
    glow: "rgba(255, 59, 48, 0.4)",
  },
};

const DEFAULT_COLOR = INSTRUMENT_COLORS.piano;

export default function RecordingsList({
  recordings,
  onDelete,
  onRename,
  onClearAll,
}) {
  const [playbackStates, setPlaybackStates] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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
        enginesRef.current[recordingId] = createPlaybackEngine(
          recording,
          () => {
            setPlaybackStates((prev) => ({ ...prev, [recordingId]: false }));
          },
        );
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
      setPlaybackStates((prev) => ({
        ...Object.fromEntries(Object.entries(prev).map(([k]) => [k, false])),
        [recordingId]: true,
      }));
    }
  };

  const handleDelete = (recordingId) => {
    setItemToDelete(recordingId);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const engine = enginesRef.current[itemToDelete];
    if (engine) {
      engine.dispose();
      delete enginesRef.current[itemToDelete];
    }
    onDelete(itemToDelete);
    setItemToDelete(null);
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowClearConfirm(false);
  };

  const onDragStartRecording = (e, recording) => {
    e.dataTransfer.setData("application/x-recording-id", recording.id);
    e.dataTransfer.setData(
      "application/x-recording-duration-ms",
      String(recording.duration || 0),
    );
    e.dataTransfer.setData(
      "application/x-recording-instrument",
      recording.instrument,
    );
    e.dataTransfer.effectAllowed = "copy";
  };

  const startEditing = (rec) => {
    setEditingId(rec.id);
    setEditName(rec.name || rec.instrument);
  };

  const saveEditing = (recId) => {
    if (editName.trim()) {
      onRename(recId, editName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e, recId) => {
    if (e.key === "Enter") {
      saveEditing(recId);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
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
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all duration-150"
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
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>

      {recordings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 select-none">
          <div
            className="text-4xl mb-4"
            style={{ color: "var(--muted-foreground)", opacity: 0.25 }}
          >
            <Music size={48} />
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--muted-foreground)" }}
          >
            No recordings yet
          </p>
          <p
            className="text-xs mt-1.5 flex items-center justify-center gap-1.5 leading-relaxed"
            style={{
              color: "var(--muted-foreground)",
              opacity: 0.6,
              fontFamily: "var(--font-mono)",
            }}
          >
            Hit{" "}
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />{" "}
            and start typing to record
          </p>
        </div>
      ) : (
        <>
          <div className={styles.noteBox}>
            {/* <div className={styles.noteIcon}>
              <Info size={14} />
            </div> */}
            <p>Double click to rename</p>
          </div>
          <div className="flex flex-col gap-2">
            {recordings.map((recording) => {
              const colors =
                INSTRUMENT_COLORS[recording.instrument] || DEFAULT_COLOR;
              const isPlaying = playbackStates[recording.id];
              return (
                <div
                  key={recording.id}
                  className="group relative flex items-center gap-2.5 rounded-lg transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.accent + "50"}`,
                    padding: "9px 10px",
                    boxShadow: isPlaying ? `0 0 14px ${colors.glow}` : "none",
                  }}
                  draggable
                  onDragStart={(e) => onDragStartRecording(e, recording)}
                >
                  <button
                    onClick={() => togglePlayback(recording.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:scale-105"
                    style={{
                      backgroundColor: colors.accent,
                      color: "rgb(18,18,18)",
                      border: "none",
                      boxShadow: isPlaying ? `0 0 12px ${colors.glow}` : "none",
                      padding: 0,
                    }}
                  >
                    {isPlaying ? (
                      <Pause fill="currentColor" size={13} />
                    ) : (
                      <Play fill="currentColor" size={13} />
                    )}
                  </button>

                  <div
                    className="flex-1 min-w-0"
                    onDoubleClick={() => !editingId && startEditing(recording)}
                  >
                    <div className="flex items-center gap-2">
                      {editingId === recording.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveEditing(recording.id)}
                          onKeyDown={(e) => handleKeyDown(e, recording.id)}
                          autoFocus
                          className="w-full bg-[var(--background)] border border-[var(--primary)] rounded px-1 py-0.5 text-xs font-bold font-mono text-[var(--foreground)] outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="text-sm font-semibold truncate capitalize cursor-text"
                          style={{ color: "var(--foreground)" }}
                          title="Double-click to rename"
                        >
                          {recording.name || recording.instrument}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-2 mt-0.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--muted-foreground)",
                      }}
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
                      e.currentTarget.style.backgroundColor =
                        "rgba(244,63,94,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted-foreground)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    title="Delete recording"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {recordings.length > 0 && (
        <p
          className="text-xs text-center mt-4 select-none"
          style={{
            color: "var(--muted-foreground)",
            opacity: 0.5,
            fontFamily: "var(--font-mono)",
          }}
        >
          drag to timeline →
        </p>
      )}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          />
          <div className="relative bg-[var(--card)] border border-[var(--border)] p-6 rounded-lg shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
              Delete All Recordings?
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">
              Are you sure you want to delete{" "}
              <span className="text-[var(--foreground)] font-semibold">
                {recordings.length}
              </span>{" "}
              recordings? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors border border-transparent hover:border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearAll}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-sm"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setItemToDelete(null)}
          />
          <div className="relative bg-[var(--card)] border border-[var(--border)] p-6 rounded-lg shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
              Delete Recording?
            </h3>
            <p className="text-[var(--muted-foreground)] mb-6 text-sm">
              Are you sure you want to delete this recording? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors border border-transparent hover:border-[var(--border)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
