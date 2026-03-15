"use client";

import { useMemo } from "react";

export default function TimelineRuler({
  pxPerSec,
  leftGutterPx = 64,
  heightPx = 24,
  totalSec = 120,
}) {
  const { major, minor } = useMemo(() => {
    const majors = [];
    const minors = [];
    for (let s = 0; s <= totalSec; s += 1) {
      majors.push({ sec: s, x: leftGutterPx + s * pxPerSec });
      for (let i = 1; i < 10; i += 1) {
        const sub = s + i / 10;
        if (sub > totalSec) break;
        minors.push({ x: leftGutterPx + sub * pxPerSec });
      }
    }
    return { major: majors, minor: minors };
  }, [pxPerSec, leftGutterPx, totalSec]);

  return (
    <div
      className="relative w-full"
      style={{
        height: heightPx,
        backgroundColor: "var(--secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: leftGutterPx,
          backgroundColor: "var(--secondary)",
          borderRight: "1px solid var(--border)",
          zIndex: 1,
        }}
      />

      {minor.map((m, idx) => (
        <div
          key={`m-${idx}`}
          className="absolute"
          style={{
            left: m.x,
            top: heightPx * 0.6,
            width: 1,
            height: heightPx * 0.4,
            backgroundColor: "var(--border)",
          }}
        />
      ))}

      {major.map((t) => (
        <div key={t.sec} className="absolute" style={{ left: t.x, top: 0 }}>
          <div
            style={{
              width: 1,
              height: heightPx,
              backgroundColor: "var(--border)",
            }}
          />
          <div
            className="absolute select-none"
            style={{
              top: 4,
              left: 4,
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {t.sec}s
          </div>
        </div>
      ))}
    </div>
  );
}
