import * as Tone from "tone";

export const masterBus = new Tone.Gain({ gain: 1 });
export const monitorGain = new Tone.Gain({ gain: 1 });

masterBus.connect(monitorGain);
monitorGain.connect(Tone.Destination);
