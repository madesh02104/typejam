import * as Tone from "tone";

let cached = null;

export function getAudioBus() {
	if (cached) return cached;
	if (typeof window === "undefined") return null;

	const masterBus = new Tone.Gain({ gain: 1 });
	const monitorGain = new Tone.Gain({ gain: 1 });

	masterBus.connect(monitorGain);
	monitorGain.connect(Tone.Destination);

	cached = { masterBus, monitorGain };
	return cached;
}
