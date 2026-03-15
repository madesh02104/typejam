"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import InfoPanel from "./InfoPanel";
import TimelineRuler from "./TimelineRuler";
import TrackArea from "./TrackArea";

export default function JamBoard({
  clips,
  onCreateClip,
  onUpdateClip,
  onDeleteClip,
  pxPerSec = 100,
  numTracks = 10,
  snapSec = 0.5,
  isActive = false,
}) {
  const boardRef = useRef(null);
  const [showInfo, setShowInfo] = useState(true);
  const [hasOpenedInfo, setHasOpenedInfo] = useState(false);
  const [playheadSec, setPlayheadSec] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      try {
        const { Transport } = require("tone");
        if (isActive) {
          setPlayheadSec(Transport.seconds || 0);
        }
      } catch {}
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isActive]);

  const handleOpenInfo = () => {
    setShowInfo(true);
    setHasOpenedInfo(true);
  };

  const onDropFromLibrary = useCallback(
    (e) => {
      e.preventDefault();
      const recordingId = e.dataTransfer.getData("application/x-recording-id");
      const durationMsStr = e.dataTransfer.getData(
        "application/x-recording-duration-ms",
      );
      const instrumentStr = e.dataTransfer.getData(
        "application/x-recording-instrument",
      );
      if (!recordingId) return;
      const durationSec = Math.max(
        0.001,
        (parseInt(durationMsStr || "0", 10) || 0) / 1000,
      );

      const boardEl = boardRef.current;
      if (!boardEl) return;

      const rect = boardEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const trackHeight = 56;
      let trackIndex = Math.floor((y - 24) / trackHeight);
      if (trackIndex < 0) trackIndex = 0;
      if (trackIndex >= numTracks) trackIndex = numTracks - 1;

      const timeStartX = 64;
      const rawSec = (x - timeStartX) / pxPerSec;
      const snappedSec = snapSec
        ? Math.max(0, Math.round(rawSec / snapSec) * snapSec)
        : Math.max(0, rawSec);

      onCreateClip({
        recordingId,
        trackIndex,
        startTimeSec: snappedSec,
        durationSec,
        instrument: instrumentStr,
      });
    },
    [onCreateClip, pxPerSec, numTracks, snapSec],
  );

  const onDragOver = useCallback((e) => {
    if (e.dataTransfer?.types?.includes("application/x-recording-id")) {
      e.preventDefault();
    }
  }, []);

  const clipsByTrack = useMemo(() => {
    const map = Array.from({ length: numTracks }, () => []);
    for (const c of clips) {
      if (c.trackIndex >= 0 && c.trackIndex < numTracks) {
        map[c.trackIndex].push(c);
      }
    }
    return map;
  }, [clips, numTracks]);

  const totalSec = useMemo(() => {
    let maxEnd = 0;
    for (const c of clips) {
      maxEnd = Math.max(maxEnd, (c.startTimeSec || 0) + (c.durationSec || 0));
    }
    return Math.max(30, Math.ceil(maxEnd + 5));
  }, [clips]);

  const contentWidthPx = 64 + totalSec * pxPerSec;

  return (
    <div
      ref={boardRef}
      className="flex flex-col h-full w-full select-none overflow-hidden relative"
      style={{
        backgroundColor: "var(--muted)",
        borderRadius: "var(--radius-md)",
      }}
      onDrop={onDropFromLibrary}
      onDragOver={onDragOver}
    >
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ width: contentWidthPx }}>
          <div className="relative">
            <TimelineRuler
              pxPerSec={pxPerSec}
              leftGutterPx={64}
              heightPx={24}
              totalSec={totalSec}
            />
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: 64 + playheadSec * pxPerSec,
                width: 1.5,
                backgroundColor: "var(--destructive)",
                boxShadow: "0 0 6px var(--destructive)",
                zIndex: 10,
              }}
            />
          </div>
          <TrackArea
            pxPerSec={pxPerSec}
            numTracks={numTracks}
            clipsByTrack={clipsByTrack}
            onUpdateClip={onUpdateClip}
            onDeleteClip={onDeleteClip}
            leftGutterPx={64}
            rowHeightPx={56}
            snapSec={snapSec}
            totalSec={totalSec}
          />
        </div>
      </div>

      {/* Backdrop */}
      {showInfo && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setShowInfo(false)}
        />
      )}

      {/* Sliding Panel */}
      <div
        className="fixed top-0 right-0 z-40 h-full shadow-2xl transition-transform duration-300 ease-in-out bg-card border-l border-border"
        style={{
          width: "640px",
          maxWidth: "90vw",
          transform: showInfo ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <button
          className={`absolute top-20 left-0 -translate-x-full w-10 h-10 flex items-center justify-center rounded-l-lg border-l border-t border-b border-border shadow-[-4px_0_12px_rgba(0,0,0,0.1)] transition-colors ${
            showInfo
              ? "bg-secondary text-foreground hover:bg-secondary/80"
              : "bg-card text-primary hover:bg-card/90"
          }`}
          onClick={() => {
            setShowInfo(!showInfo);
            setHasOpenedInfo(true);
          }}
          aria-label={showInfo ? "Close Info" : "Open Info"}
        >
          {showInfo ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        <div className="h-full w-full relative">
          <InfoPanel />
        </div>
      </div>
    </div>
  );
}
