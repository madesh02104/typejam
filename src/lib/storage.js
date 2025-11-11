const STORAGE_KEY = "typejam-recordings";

export function saveRecordings(recordings) {
  try {
    const jsonString = JSON.stringify(recordings);
    localStorage.setItem(STORAGE_KEY, jsonString);

    console.log(
      `[TypeJam][storage] Saved ${recordings.length} recordings to localStorage`
    );
    console.log(
      `[TypeJam][storage] Storage size: ${jsonString.length} characters`
    );
  } catch (error) {
    console.error("[TypeJam][storage] Failed to save recordings:", error);

    if (error.name === "QuotaExceededError") {
      console.warn(
        "[TypeJam][storage] Storage quota exceeded - too many recordings!"
      );
    }
  }
}

export function loadRecordings() {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);

    if (!jsonString) {
      console.log("[TypeJam][storage] No saved recordings found");
      return [];
    }

    const recordings = JSON.parse(jsonString);

    if (!Array.isArray(recordings)) {
      console.warn(
        "[TypeJam][storage] Invalid recordings data, returning empty array"
      );
      return [];
    }

    console.log(
      `[TypeJam][storage] Loaded ${recordings.length} recordings from localStorage`
    );
    return recordings;
  } catch (error) {
    console.error("[TypeJam][storage] Failed to load recordings:", error);
    return [];
  }
}

export function clearRecordings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("[TypeJam][storage] Cleared all recordings from localStorage");
  } catch (error) {
    console.error("[TypeJam][storage] Failed to clear recordings:", error);
  }
}

export function getStorageInfo() {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    const sizeInBytes = jsonString ? new Blob([jsonString]).size : 0;
    const sizeInKB = Math.round((sizeInBytes / 1024) * 100) / 100;

    return {
      recordingsCount: jsonString ? JSON.parse(jsonString).length : 0,
      sizeInBytes,
      sizeInKB,
      sizeInMB: Math.round((sizeInKB / 1024) * 100) / 100,
    };
  } catch (error) {
    console.error("[TypeJam][storage] Failed to get storage info:", error);
    return { recordingsCount: 0, sizeInBytes: 0, sizeInKB: 0, sizeInMB: 0 };
  }
}
