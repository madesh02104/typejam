"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INSTRUMENTS = [
  { key: "piano", name: "Piano", color: "rgb(6, 182, 212)", img: "https://placehold.co/80x80?text=Piano" },
  { key: "guitar", name: "Guitar", color: "rgb(16, 185, 129)", img: "https://placehold.co/80x80?text=Guitar" },
  { key: "bass", name: "Bass", color: "rgb(139, 92, 246)", img: "https://placehold.co/80x80?text=Bass" },
  { key: "violin", name: "Violin", color: "rgb(245, 158, 11)", img: "https://placehold.co/80x80?text=Violin" },
  { key: "drums", name: "Drums", color: "rgb(244, 63, 94)", img: "https://placehold.co/80x80?text=Drums" },
];

import TimelineRuler from "./TimelineRuler";
import TrackArea from "./TrackArea";
import Image from "next/image";

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
  const [showInfo, setShowInfo] = useState(false);
  const [hasOpenedInfo, setHasOpenedInfo] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
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
      const durationMsStr = e.dataTransfer.getData("application/x-recording-duration-ms");
      if (!recordingId) return;
      const durationSec = Math.max(0.001, (parseInt(durationMsStr || "0", 10) || 0) / 1000);

      const boardEl = boardRef.current;
      if (!boardEl) return;

      const rect = boardEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const trackHeight = 56;
      let trackIndex = Math.floor((y - 24) / trackHeight);
      if (trackIndex < 0) trackIndex = 0;
      if (trackIndex >= numTracks) trackIndex = numTracks - 1;

      const timeStartX = 48;
      const rawSec = (x - timeStartX) / pxPerSec;
      const snappedSec = snapSec
        ? Math.max(0, Math.round(rawSec / snapSec) * snapSec)
        : Math.max(0, rawSec);

      onCreateClip({ recordingId, trackIndex, startTimeSec: snappedSec, durationSec });
    },
    [onCreateClip, pxPerSec, numTracks, snapSec]
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

  const contentWidthPx = 48 + totalSec * pxPerSec;

  return (
    <div
      ref={boardRef}
      className="flex flex-col h-full w-full select-none overflow-hidden relative"
      style={{ backgroundColor: "var(--muted)", borderRadius: "var(--radius-md)" }}
      onDrop={onDropFromLibrary}
      onDragOver={onDragOver}
    >
      <button
        className={`fixed top-3 right-3 z-50 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${!hasOpenedInfo ? "animate-hint-pulse" : ""}`}
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--primary)";
          e.currentTarget.style.boxShadow = "0 0 14px rgba(6,182,212,0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
        aria-label="About TypeJam"
        onClick={handleOpenInfo}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 14,
            color: "var(--primary)",
            lineHeight: 1,
          }}
        >
          ?
        </span>
      </button>

      <div className="relative flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ width: contentWidthPx }}>
          <div className="relative">
            <TimelineRuler
              pxPerSec={pxPerSec}
              leftGutterPx={48}
              heightPx={24}
              totalSec={totalSec}
            />
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: 48 + playheadSec * pxPerSec,
                width: 1.5,
                backgroundColor: "var(--destructive)",
                boxShadow: "0 0 6px rgba(244,63,94,0.7)",
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
            leftGutterPx={48}
            rowHeightPx={56}
            snapSec={snapSec}
            totalSec={totalSec}
          />
        </div>
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-30 flex justify-end">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            onClick={() => setShowInfo(false)}
          />
          <div
            className="relative h-full overflow-y-auto"
            style={{
              backgroundColor: "var(--card)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-8px 0 40px rgba(0,0,0,0.6)",
              minWidth: "340px",
              maxWidth: "min(92vw, 640px)",
              width: "640px",
            }}
          >
            <button
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
                boxShadow: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--foreground)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
              aria-label="Close"
              onClick={() => setShowInfo(false)}
            >
              ×
            </button>

            <div style={{ padding: "52px 36px 48px" }}>

              <h2
                className="font-bold leading-tight"
                style={{
                  fontSize: 30,
                  background: "linear-gradient(135deg, rgb(6, 182, 212) 0%, rgb(124, 58, 237) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: 8,
                }}
              >
                Welcome to TypeJam
              </h2>
              <p style={{ fontSize: 16, color: "var(--muted-foreground)", lineHeight: 1.55, marginBottom: 32 }}>
                Make real music right now — no theory, no lessons, no sheet music.
              </p>

              <div style={{ borderTop: "1px solid var(--border)", marginBottom: 28 }} />

              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                  marginBottom: 12,
                }}
              >
                The challenge
              </p>
              <p style={{ fontSize: 15, color: "var(--foreground)", lineHeight: 1.75, marginBottom: 28 }}>
                Most people who want to make music hit the same wall. Traditional instruments
                demand years of practice before you can play anything that sounds good. Piano
                teachers start you with scales and note names. Guitar tutorials show chord
                diagrams that feel completely disconnected from actual sound. Dedicated music apps
                assume you know what a C-major scale is, what octaves mean, or where middle C
                lives on a staff. You just want to press something and hear music — right now,
                today — and everything in the music world makes that feel impossible unless
                you commit years upfront.
              </p>

              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                  marginBottom: 12,
                }}
              >
                How TypeJam works
              </p>
              <p style={{ fontSize: 15, color: "var(--foreground)", lineHeight: 1.75, marginBottom: 20 }}>
                TypeJam maps your computer keyboard directly to musical notes using a layout
                you already know intimately. The three rows of letter keys each represent a
                pitch register. The top row — <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>Q through P</span> — plays the highest, brightest
                tones. The middle row — <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>A through L</span> — sits in the sweet spot most melodies
                live in. The bottom row — <span style={{ color: "var(--primary)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>Z through M</span> — covers the lower, fuller-bodied
                register. Within every row, notes climb naturally from left to right: the further
                right you press, the higher the pitch. That spatial logic is all you need to
                start making music immediately.
              </p>

              <div
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  padding: "18px 20px",
                  marginBottom: 28,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {[
                  { label: "HIGH", keys: ["Q","W","E","R","T","Y","U","I","O","P"], opacity: 1, desc: "Bright, high-register tones" },
                  { label: "MID", keys: ["A","S","D","F","G","H","J","K","L"], opacity: 0.6, desc: "Mid-range — the melody zone" },
                  { label: "LOW", keys: ["Z","X","C","V","B","N","M"], opacity: 0.38, desc: "Deep, full-bodied notes" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        color: `rgba(6, 182, 212, ${row.opacity})`,
                        width: 32,
                        flexShrink: 0,
                      }}
                    >
                      {row.label}
                    </span>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {row.keys.map((k) => (
                        <span
                          key={k}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            borderRadius: 5,
                            backgroundColor: `rgba(6, 182, 212, ${row.opacity * 0.12})`,
                            border: `1px solid rgba(6, 182, 212, ${row.opacity * 0.35})`,
                            fontSize: 12,
                            fontWeight: 600,
                            color: `rgba(6, 182, 212, ${row.opacity})`,
                          }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)", flexShrink: 0 }}>
                      {row.desc}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    letterSpacing: "0.03em",
                  }}
                >
                  <span>←</span>
                  <span style={{ flex: 1, textAlign: "center" }}>lower pitch ——————————————— higher pitch</span>
                  <span>→</span>
                </div>
              </div>

              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                  marginBottom: 12,
                }}
              >
                One pattern, all instruments
              </p>
              <p style={{ fontSize: 15, color: "var(--foreground)", lineHeight: 1.75, marginBottom: 16 }}>
                The real advantage of TypeJam is that every instrument follows the exact same
                spatial pattern. The key positions across Piano, Guitar, Bass, Violin and Drums
                are carefully calibrated so that the same finger movement produces a musically
                consistent result regardless of which instrument is active. The note names
                change — the pitch register shifts to suit each instrument&apos;s natural range —
                but the relative melodic shape of what you play stays the same.
              </p>
              <p style={{ fontSize: 15, color: "var(--foreground)", lineHeight: 1.75, marginBottom: 16 }}>
                If you find a melody you love on Piano, switch to Guitar and play those exact
                same keys. The notes will sit in Guitar&apos;s characteristic range and still sound
                musical, not random. Switch to Violin, to Bass, back to Piano — your hands
                already know where to go. There is no relearning, no remapping, no starting
                over from zero every time you want to try a new sound.
              </p>
              <div
                style={{
                  backgroundColor: "var(--secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  padding: "14px 18px",
                  marginBottom: 28,
                }}
              >
                <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                  Key [A] — same position, every instrument
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { inst: "Piano", note: "C4 — middle range" },
                    { inst: "Guitar", note: "B3 — open string register" },
                    { inst: "Bass", note: "D2 — deep bass range" },
                    { inst: "Violin", note: "E4 — open string register" },
                  ].map((item) => (
                    <div
                      key={item.inst}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        backgroundColor: "var(--muted)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "8px 12px",
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          backgroundColor: "rgba(6,182,212,0.12)",
                          border: "1px solid rgba(6,182,212,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: "var(--primary)",
                          flexShrink: 0,
                        }}
                      >
                        A
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{item.inst}</div>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{item.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                  marginBottom: 12,
                }}
              >
                Getting started
              </p>
              <p style={{ fontSize: 15, color: "var(--foreground)", lineHeight: 1.85, marginBottom: 32 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>1.</span> Select an instrument from the top bar.{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>2.</span> Click the red ● record button and start typing freely — top row for bright phrases, middle row for melodies, bottom row for depth.{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>3.</span> Click ● again to stop; your take appears in the left panel.{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>4.</span> Drag that recording from the panel onto the timeline below to place it in time.{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>5.</span> Switch to a different instrument and record another take; drag it to a different track.{" "}
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 600 }}>6.</span> Hit Play to hear everything together, then Export when you&apos;re happy.
              </p>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, marginBottom: 8 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--muted-foreground)",
                    marginBottom: 14,
                  }}
                >
                  Key mappings by instrument
                </p>
                <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: 16 }}>
                  Select an instrument below to see exactly which note each key triggers.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {INSTRUMENTS.map((inst) => (
                    <button
                      key={inst.key}
                      className="flex flex-col items-center rounded-lg transition-all duration-150"
                      style={{
                        backgroundColor: selectedInstrument === inst.key ? "rgba(6,182,212,0.1)" : "var(--secondary)",
                        border: `1px solid ${selectedInstrument === inst.key ? "rgba(6,182,212,0.5)" : "var(--border)"}`,
                        boxShadow: selectedInstrument === inst.key ? "0 0 12px rgba(6,182,212,0.18)" : "none",
                        padding: "10px 16px",
                        minWidth: 76,
                      }}
                      onClick={() => setSelectedInstrument(selectedInstrument === inst.key ? null : inst.key)}
                    >
                      <Image
                        src={inst.img}
                        alt={inst.name}
                        width={36}
                        height={36}
                        className="object-contain mb-1.5 opacity-75"
                        style={{ width: 36, height: 36 }}
                        unoptimized
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: selectedInstrument === inst.key ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      >
                        {inst.name}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedInstrument && (
                  <InstrumentMapping instrument={selectedInstrument} />
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const KEY_ROWS = {
  top: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  mid: ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  bot: ["z", "x", "c", "v", "b", "n", "m"],
};

const NOTE_MAP = {
  piano: {
    top: ["C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6", "D6", "E6"],
    mid: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5"],
    bot: ["C3", "D3", "E3", "F3", "G3", "A3", "B3"],
  },
  guitar: {
    top: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5"],
    mid: ["B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
    bot: ["G3", "A3", "B3", "C4", "D4", "E4", "F4"],
  },
  bass: {
    top: ["G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3"],
    mid: ["D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3"],
    bot: ["E1", "F1", "G1", "A1", "B1", "C2", "D2"],
  },
  violin: {
    top: ["A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6"],
    mid: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"],
    bot: ["G3", "A3", "B3", "C4", "D4", "E4", "F4"],
  },
  drums: {
    top: ["C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2", "C2"],
    mid: ["D2", "D2", "D2", "D2", "D2", "D2", "D2", "D2", "D2"],
    bot: ["C1", "D1", "E1", "F1", "G1", "A1", "B1"],
  },
};

const ROW_LABELS = { top: "Q–P  high", mid: "A–L  mid", bot: "Z–M  low" };
const ROW_OPACITY = { top: 1, mid: 0.6, bot: 0.38 };

function InstrumentMapping({ instrument }) {
  const mapping = NOTE_MAP[instrument];
  if (!mapping) return null;
  return (
    <div
      style={{
        backgroundColor: "var(--secondary)",
        border: "1px solid var(--border)",
        borderTop: "2px solid var(--primary)",
        borderRadius: "0.5rem",
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--primary)",
          marginBottom: 14,
        }}
      >
        {instrument.charAt(0).toUpperCase() + instrument.slice(1)} — key to note
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {Object.entries(KEY_ROWS).map(([row, keys]) => {
          const op = ROW_OPACITY[row];
          return (
            <div key={row} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: `rgba(6, 182, 212, ${op})`,
                  width: 64,
                  flexShrink: 0,
                  paddingTop: 5,
                  letterSpacing: "0.04em",
                  fontWeight: 600,
                }}
              >
                {ROW_LABELS[row]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {keys.map((k, i) => (
                  <span
                    key={k + i}
                    style={{
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "4px 6px",
                      borderRadius: 5,
                      backgroundColor: "var(--muted)",
                      border: "1px solid var(--border)",
                      fontFamily: "var(--font-mono)",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1 }}>{k}</span>
                    <span style={{ fontSize: 9, color: `rgba(6, 182, 212, ${op})`, lineHeight: 1, fontWeight: 600 }}>
                      {mapping[row][i] || "–"}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
