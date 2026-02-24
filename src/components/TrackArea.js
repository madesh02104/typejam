"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INSTRUMENT_COLORS = {
  piano: {
    bg: "rgba(6, 182, 212, 0.15)",
    border: "1px solid rgba(6, 182, 212, 0.35)",
    borderLeft: "3px solid rgb(6, 182, 212)",
    text: "rgb(6, 182, 212)",
    glow: "rgba(6,182,212,0.2)",
  },
  guitar: {
    bg: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.35)",
    borderLeft: "3px solid rgb(16, 185, 129)",
    text: "rgb(16, 185, 129)",
    glow: "rgba(16,185,129,0.2)",
  },
  bass: {
    bg: "rgba(139, 92, 246, 0.15)",
    border: "1px solid rgba(139, 92, 246, 0.35)",
    borderLeft: "3px solid rgb(139, 92, 246)",
    text: "rgb(139, 92, 246)",
    glow: "rgba(139,92,246,0.2)",
  },
  violin: {
    bg: "rgba(245, 158, 11, 0.15)",
    border: "1px solid rgba(245, 158, 11, 0.35)",
    borderLeft: "3px solid rgb(245, 158, 11)",
    text: "rgb(245, 158, 11)",
    glow: "rgba(245,158,11,0.2)",
  },
  drums: {
    bg: "rgba(244, 63, 94, 0.15)",
    border: "1px solid rgba(244, 63, 94, 0.35)",
    borderLeft: "3px solid rgb(244, 63, 94)",
    text: "rgb(244, 63, 94)",
    glow: "rgba(244,63,94,0.2)",
  },
};

const DEFAULT_COLORS = INSTRUMENT_COLORS.piano;

export default function TrackArea({
  pxPerSec,
  numTracks,
  clipsByTrack,
  onUpdateClip,
  onDeleteClip,
  leftGutterPx = 48,
  rowHeightPx = 56,
  snapSec = 0.5,
  totalSec = 60,
}) {
  const boardRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  const onPointerDownClip = useCallback((e, clip) => {
    e.preventDefault();
    setDragState({
      clipId: clip.id,
      baseStartSec: clip.startTimeSec,
      baseTrack: clip.trackIndex,
      originX: e.clientX,
      originY: e.clientY,
    });
    boardRef.current?.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.originX;
      const dy = e.clientY - dragState.originY;
      const rawSec = dragState.baseStartSec + dx / pxPerSec;
      const snappedSec = snapSec
        ? Math.max(0, Math.round(rawSec / snapSec) * snapSec)
        : Math.max(0, rawSec);
      let trackIndex = dragState.baseTrack + Math.round(dy / rowHeightPx);
      if (trackIndex < 0) trackIndex = 0;
      if (trackIndex >= numTracks) trackIndex = numTracks - 1;
      onUpdateClip(dragState.clipId, { startTimeSec: snappedSec, trackIndex });
    },
    [dragState, onUpdateClip, pxPerSec, rowHeightPx, numTracks, snapSec]
  );

  const onPointerUp = useCallback(
    (e) => {
      if (!dragState) return;
      boardRef.current?.releasePointerCapture?.(e.pointerId);
      setDragState(null);
    },
    [dragState]
  );

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const contentWidthPx = leftGutterPx + totalSec * pxPerSec;

  return (
    <div ref={boardRef} className="relative flex-1">
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: leftGutterPx,
          backgroundColor: "var(--secondary)",
          borderRight: "1px solid var(--border)",
          zIndex: 1,
        }}
      >
        {Array.from({ length: numTracks }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center"
            style={{
              height: rowHeightPx,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                letterSpacing: "0.06em",
                opacity: 0.7,
              }}
            >
              T{i + 1}
            </span>
          </div>
        ))}
      </div>

      <div
        className="relative"
        style={{
          marginLeft: leftGutterPx,
          width: contentWidthPx - leftGutterPx,
        }}
      >
        {Array.from({ length: numTracks }).map((_, trackIndex) => (
          <div
            key={trackIndex}
            className="relative"
            style={{
              height: rowHeightPx,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundColor:
                  trackIndex % 2 === 0 ? "var(--card)" : "var(--muted)",
              }}
            />

            {clipsByTrack[trackIndex]?.map((clip) => {
              const colors = INSTRUMENT_COLORS[clip.name] || DEFAULT_COLORS;
              return (
                <div
                  key={clip.id}
                  className="absolute group/clip"
                  style={{
                    top: 6,
                    height: rowHeightPx - 14,
                    left: clip.startTimeSec * pxPerSec,
                    width: Math.max(14, clip.durationSec * pxPerSec),
                    backgroundColor: colors.bg,
                    border: colors.border,
                    borderLeft: colors.borderLeft,
                    borderRadius: "4px",
                    boxShadow: `0 2px 8px ${colors.glow}`,
                    cursor: "move",
                  }}
                  onPointerDown={(e) => onPointerDownClip(e, clip)}
                  title={`${clip.name} @ ${clip.startTimeSec.toFixed(2)}s`}
                >
                  <div
                    className="truncate"
                    style={{
                      paddingLeft: 6,
                      paddingTop: 3,
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      color: colors.text,
                      letterSpacing: "0.02em",
                      textTransform: "capitalize",
                    }}
                  >
                    {clip.name || clip.recordingId.slice(0, 6)}
                  </div>
                  <div
                    style={{
                      paddingLeft: 6,
                      fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      color: colors.text,
                      opacity: 0.6,
                    }}
                  >
                    {clip.durationSec.toFixed(2)}s
                  </div>

                  <button
                    className="absolute opacity-0 group-hover/clip:opacity-100 transition-opacity duration-150 flex items-center justify-center"
                    style={{
                      top: -6,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: "var(--destructive)",
                      color: "white",
                      fontSize: 9,
                      fontWeight: 700,
                      border: "1.5px solid var(--background)",
                      boxShadow: "0 0 6px rgba(244,63,94,0.5)",
                      padding: 0,
                      lineHeight: 1,
                      zIndex: 5,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClip?.(clip.id);
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    title="Remove clip"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
