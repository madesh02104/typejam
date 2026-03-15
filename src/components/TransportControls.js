"use client";

import { Play, Pause, Square, Download } from "lucide-react";

export default function TransportControls({
  isPlaying,
  onPlayPause,
  onStop,
  pxPerSec,
  onChangePxPerSec,
  snapSec,
  onChangeSnapSec,
  onDownload,
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0"
      style={{
        backgroundColor: "var(--secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <button
          onClick={onPlayPause}
          className="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-150"
          style={{
            backgroundColor: isPlaying
              ? "rgba(0,184,217,0.15)"
              : "var(--primary)",
            color: isPlaying ? "var(--primary)" : "var(--primary-foreground)",
            border: `1px solid ${isPlaying ? "var(--primary)" : "transparent"}`,
            boxShadow: isPlaying ? "0 0 12px rgba(0,184,217,0.4)" : "none",
            padding: 0,
          }}
        >
          {isPlaying ? (
            <Pause fill="currentColor" size={18} />
          ) : (
            <Play fill="currentColor" size={18} />
          )}
        </button>

        <button
          onClick={onStop}
          className="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-150"
          style={{
            backgroundColor: "var(--muted)",
            border: "1px solid var(--border)",
            color: "var(--muted-foreground)",
            padding: 0,
            boxShadow: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--foreground)";
            e.currentTarget.style.borderColor = "var(--secondary-foreground)";
            e.currentTarget.style.backgroundColor = "var(--secondary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted-foreground)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.backgroundColor = "var(--muted)";
          }}
        >
          <Square fill="currentColor" size={14} />
        </button>
      </div>

      <div
        className="w-px h-5 flex-shrink-0"
        style={{ backgroundColor: "var(--border)" }}
      />

      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium flex-shrink-0"
          style={{ color: "var(--muted-foreground)" }}
        >
          Zoom
        </span>
        <select
          className="px-2 py-1 text-xs rounded-md font-mono"
          style={{
            backgroundColor: "var(--muted)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          value={pxPerSec}
          onChange={(e) => onChangePxPerSec(parseInt(e.target.value, 10))}
        >
          {[60, 80, 100, 120, 160, 200].map((v) => (
            <option key={v} value={v}>
              {v} px/s
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium flex-shrink-0"
          style={{ color: "var(--muted-foreground)" }}
        >
          Snap
        </span>
        <select
          className="px-2 py-1 text-xs rounded-md font-mono"
          style={{
            backgroundColor: "var(--muted)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          value={snapSec ?? 0}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChangeSnapSec(v === 0 ? null : v);
          }}
        >
          <option value={0}>Off</option>
          {[0.25, 0.5, 1, 2].map((v) => (
            <option key={v} value={v}>
              {v}s
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto">
        <button
          onClick={onDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150"
          style={{
            backgroundColor: "transparent",
            border: "1px solid rgba(0,184,217,0.4)",
            color: "var(--primary)",
            boxShadow: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0,184,217,0.1)";
            e.currentTarget.style.borderColor = "var(--primary)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(0,184,217,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "rgba(0,184,217,0.4)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
}
