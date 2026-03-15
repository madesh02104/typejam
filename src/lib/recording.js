export function createEmptyRecording() {
  const newId = crypto.randomUUID();

  return {
    id: newId,
    name: "",
    instrument: null,
    notes: [],
    duration: 0,
  };
}
