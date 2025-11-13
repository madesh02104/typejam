"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    const startX = e.clientX;
    const startY = e.clientY;
    setDragState({
      clipId: clip.id,
      baseStartSec: clip.startTimeSec,
      baseTrack: clip.trackIndex,
      originX: startX,
      originY: startY,
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
      {/* Left gutter */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-secondary border-r"
        style={{ width: leftGutterPx }}
      />

      {/* Tracks and clips */}
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
            className="relative border-b"
            style={{ height: rowHeightPx }}
          >
            {/* Row background stripes */}
            <div
              className={`absolute inset-0 ${
                trackIndex % 2 === 0 ? "bg-card" : "bg-secondary"
              }`}
            />
            {/* Clips on this row */}
            {clipsByTrack[trackIndex]?.map((clip) => (
              <div
                key={clip.id}
                className="absolute top-1 h-12 rounded-md text-primary-foreground text-xs px-2 py-1 cursor-move shadow"
                style={{
                  backgroundColor: "var(--primary)",
                  left: clip.startTimeSec * pxPerSec,
                  width: Math.max(12, clip.durationSec * pxPerSec),
                }}
                onPointerDown={(e) => onPointerDownClip(e, clip)}
                title={`Start @ ${clip.startTimeSec.toFixed(2)}s`}
              >
                <div className="font-semibold truncate">
                  {clip.name || clip.recordingId.slice(0, 6)}
                </div>
                <div className="opacity-80">{clip.durationSec.toFixed(2)}s</div>
                <button
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-card text-foreground border grid place-items-center shadow hover:bg-secondary"
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
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
