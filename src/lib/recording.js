export function createEmptyRecording() {
  const newId = crypto.randomUUID();
  console.log("[TypeJam][recording] Creating empty recording with ID:", newId);

  return {
    id: newId,
    name: "",
    instrument: null,
    notes: [],
    duration: 0,
  };
}
