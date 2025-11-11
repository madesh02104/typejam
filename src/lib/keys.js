import * as Tone from "tone";

export const rows = {
  top: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  mid: ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  bot: ["z", "x", "c", "v", "b", "n", "m"],
};

const notes = (start, n) =>
  Array.from({ length: n }, (_, i) =>
    Tone.Frequency(start).transpose(i).toNote()
  );

export const noteMap = new Map([
  ...rows.top.map((k, i) => [
    k,
    { note: notes("C5", rows.top.length)[i], row: "top" },
  ]),
  ...rows.mid.map((k, i) => [
    k,
    { note: notes("C4", rows.mid.length)[i], row: "mid" },
  ]),
  ...rows.bot.map((k, i) => [
    k,
    { note: notes("C3", rows.bot.length)[i], row: "bot" },
  ]),
]);

console.groupCollapsed("[TypeJam][keys] noteMap sample");
console.log(Array.from(noteMap.entries()).slice(0, 5));
console.groupEnd();

export const indexMap = new Map([
  ...rows.top.map((k, i) => [k, { row: "top", i, len: rows.top.length }]),
  ...rows.mid.map((k, i) => [k, { row: "mid", i, len: rows.mid.length }]),
  ...rows.bot.map((k, i) => [k, { row: "bot", i, len: rows.bot.length }]),
]);

console.groupCollapsed("[TypeJam][keys] indexMap sample");
console.log(Array.from(indexMap.entries()).slice(0, 5));
console.groupEnd();
const baseCols = ["C1", "D1", "E1", "F1", "G1", "A1", "B1"];

export const drumKeyToNote = new Map([
  ...rows.bot.map((k, i) => [k, baseCols[i]]),

  ...rows.mid.map((k, i) => [k, i < 7 ? baseCols[i] : "D2"]),

  ...rows.top.map((k, i) => [k, i < 7 ? baseCols[i] : "C2"]),
]);

console.groupCollapsed("[TypeJam][keys] drumKeyToNote (all)");
console.log(Array.from(drumKeyToNote.entries()));
console.groupEnd();
