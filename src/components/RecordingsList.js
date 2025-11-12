// Component to display and manage recordings
"use client";

import { useEffect, useRef, useState } from "react";
import { createPlaybackEngine } from "../lib/playback";

export default function RecordingsList({ recordings, onDelete, onClearAll }) {
  // Track playback state per recording
  const [playbackStates, setPlaybackStates] = useState({});
  // Keep playback engines in a ref to avoid recreation
  const enginesRef = useRef({});

  // Cleanup engines on unmount
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
      // Stop any other playing recordings
      Object.entries(playbackStates).forEach(([id, playing]) => {
        if (playing) {
          const otherEngine = getEngine(id);
          otherEngine?.stop();
        }
      });

      await engine.play();
      setPlaybackStates((prev) =>
        Object.fromEntries(
          Object.keys(prev).map((id) => [id, id === recordingId])
        )
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
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          Your Recordings ({recordings.length})
        </h2>
        {recordings.length > 0 && (
          <button
            onClick={onClearAll}
            className="btn px-3 py-2 text-sm"
            title="Clear all recordings"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="paper p-2 flex items-center gap-2"
            draggable
            onDragStart={(e) => onDragStartRecording(e, recording)}
          >
            <button
              onClick={() => togglePlayback(recording.id)}
              className="border rounded px-2 py-1 text-sm"
            >
              {playbackStates[recording.id] ? "⏹️" : "▶️"}
            </button>

            <div className="flex-1">
              <div>
                {recording.instrument} ({recording.notes.length} notes)
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(recording.duration / 100) / 10}s
              </div>
            </div>

            <button
              onClick={() => handleDelete(recording.id)}
              className="opacity-70 hover:opacity-100"
              title="Delete recording"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
