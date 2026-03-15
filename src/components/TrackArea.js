"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Volume2, X } from "lucide-react";

const INSTRUMENT_COLORS = {
  piano: {
    bg: "rgba(0, 184, 217, 0.15)",
    border: "1px solid rgba(0, 184, 217, 0.35)",
    borderLeft: "3px solid rgb(0, 184, 217)",
    text: "rgb(0, 184, 217)",
    glow: "rgba(0, 184, 217, 0.2)",
  },
  guitar: {
    bg: "rgba(52, 199, 89, 0.15)",
    border: "1px solid rgba(52, 199, 89, 0.35)",
    borderLeft: "3px solid rgb(52, 199, 89)",
    text: "rgb(52, 199, 89)",
    glow: "rgba(52, 199, 89, 0.2)",
  },
  bass: {
    bg: "rgba(175, 82, 222, 0.15)",
    border: "1px solid rgba(175, 82, 222, 0.35)",
    borderLeft: "3px solid rgb(175, 82, 222)",
    text: "rgb(175, 82, 222)",
    glow: "rgba(175, 82, 222, 0.2)",
  },
  violin: {
    bg: "rgba(255, 149, 0, 0.15)",
    border: "1px solid rgba(255, 149, 0, 0.35)",
    borderLeft: "3px solid rgb(255, 149, 0)",
    text: "rgb(255, 149, 0)",
    glow: "rgba(255, 149, 0, 0.2)",
  },
  drums: {
    bg: "rgba(255, 59, 48, 0.15)",
    border: "1px solid rgba(255, 59, 48, 0.35)",
    borderLeft: "3px solid rgb(255, 59, 48)",
    text: "rgb(255, 59, 48)",
    glow: "rgba(255, 59, 48, 0.2)",
  },
};

const DEFAULT_COLORS = INSTRUMENT_COLORS.piano;

export default function TrackArea({
  pxPerSec,
  numTracks,
  clipsByTrack,
  onUpdateClip,
  onDeleteClip,
  leftGutterPx = 64,
  rowHeightPx = 56,
  snapSec = 0.5,
  totalSec = 60,
}) {
  const boardRef = useRef(null);
  const [dragState, setDragState] = useState(null);
  const [volumePopup, setVolumePopup] = useState(null); // { clipId, anchor: { left, top, width, height } }

  // Close popup if scrolling happen or resizing
  useEffect(() => {
    const handleDismiss = () => setVolumePopup(null);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, []);

  const onPointerDownClip = useCallback((e, clip) => {
    // If clicking on controls, don't drag
    if (e.target.closest("button") || e.target.closest("input")) return;

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
    [dragState, onUpdateClip, pxPerSec, rowHeightPx, numTracks, snapSec],
  );

  const onPointerUp = useCallback(
    (e) => {
      if (!dragState) return;
      boardRef.current?.releasePointerCapture?.(e.pointerId);
      setDragState(null);
    },
    [dragState],
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
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "var(--muted-foreground)",
                letterSpacing: "0.05em",
                opacity: 0.8,
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
              const colors =
                INSTRUMENT_COLORS[clip.instrument] || DEFAULT_COLORS;
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
                    zIndex: 5,
                  }}
                  onPointerDown={(e) => onPointerDownClip(e, clip)}
                  title={`${clip.name} @ ${clip.startTimeSec.toFixed(2)}s`}
                >
                  {/* Clip Header/Label */}
                  <div
                    className="truncate pointer-events-none"
                    style={{
                      paddingLeft: 8,
                      paddingTop: 4,
                      fontSize: 11,
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      color: colors.text,
                      opacity: 0.9,
                    }}
                  >
                    {clip.name}
                  </div>

                  {/* Controls Container */}
                  <div
                    className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover/clip:opacity-100 transition-opacity duration-200"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {/* Volume Control */}
                    <div className="relative group/volume">
                      <button
                        className="w-4 h-4 rounded flex items-center justify-center hover:bg-black/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (volumePopup?.clipId === clip.id) {
                            setVolumePopup(null);
                          } else {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            setVolumePopup({
                              clipId: clip.id,
                              anchor: {
                                left: rect.left,
                                top: rect.top,
                                width: rect.width,
                                height: rect.height,
                              },
                            });
                          }
                        }}
                        title="Adjust volume"
                      >
                        <Volume2 size={12} />
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/20 transition-colors text-[var(--muted-foreground)] hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClip(clip.id);
                      }}
                      title="Remove clip"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {volumePopup &&
        typeof document !== "undefined" &&
        createPortal(
          (() => {
            // Find the active clip from props
            // The structure of clipsByTrack is likely { [trackId]: clips[] } or array of arrays
            let clip = null;
            if (Array.isArray(clipsByTrack)) {
              for (const list of clipsByTrack) {
                if (list) {
                  const found = list.find((c) => c.id === volumePopup.clipId);
                  if (found) {
                    clip = found;
                    break;
                  }
                }
              }
            } else {
              // Fallback if object
              for (const key in clipsByTrack) {
                const list = clipsByTrack[key];
                if (list) {
                  const found = list.find((c) => c.id === volumePopup.clipId);
                  if (found) {
                    clip = found;
                    break;
                  }
                }
              }
            }

            if (!clip) return null;

            const { left, top, width } = volumePopup.anchor;

            return (
              <div
                className="fixed bg-[var(--card)] border border-[var(--border)] rounded-md p-3 shadow-xl z-[9999] flex flex-col items-center gap-2"
                style={{
                  minWidth: "40px",
                  minHeight: "100px",
                  top: top - 100, // position above
                  left: left + width / 2,
                  transform: "translateX(-50%)",
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="h-20 w-1.5 bg-[var(--background)] border border-[var(--border)] rounded-full relative flex items-center justify-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={clip.volume ?? 1}
                    onChange={(e) =>
                      onUpdateClip(clip.id, {
                        volume: parseFloat(e.target.value),
                      })
                    }
                    className="absolute w-20 h-5 origin-center -rotate-90 cursor-pointer opacity-0 z-10"
                    style={{ top: "32px" }}
                  />
                  <div
                    className="absolute bottom-0 w-full rounded-full bg-[var(--primary)] transition-all pointer-events-none shadow-[0_0_8px_var(--primary)]"
                    style={{ height: `${(clip.volume ?? 1) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--muted-foreground)]">
                  {Math.round((clip.volume ?? 1) * 100)}
                </span>
              </div>
            );
          })(),
          document.body,
        )}
    </div>
  );
}
