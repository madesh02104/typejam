import * as Tone from "tone";

export function makeSampledInstrument(baseUrl, urls, options = {}) {
  const transpose = options.transpose ?? 0;
  const mk = () => new Tone.Sampler({ baseUrl, urls, release: 1.1 });
  const top = mk();
  const mid = mk();
  const bot = mk();

  const topVol = new Tone.Volume(-6);
  const midVol = new Tone.Volume(-3);
  const botVol = new Tone.Volume(-6);

  const topFX = [
    new Tone.Filter(1200, "lowpass"),
    new Tone.Reverb({ decay: 0.8, wet: 0.08 }),
  ];
  const midFX = [
    new Tone.Filter(800, "lowpass"),
    new Tone.Reverb({ decay: 1.2, wet: 0.1 }),
  ];
  const botFX = [
    new Tone.Filter(900, "lowpass"),
    new Tone.Reverb({ decay: 1.6, wet: 0.12 }),
  ];

  const topComp = new Tone.Compressor({
    threshold: -24,
    ratio: 3,
    attack: 0.003,
    release: 0.1,
  });
  const midComp = new Tone.Compressor({
    threshold: -20,
    ratio: 2.5,
    attack: 0.003,
    release: 0.1,
  });
  const botComp = new Tone.Compressor({
    threshold: -18,
    ratio: 2,
    attack: 0.003,
    release: 0.1,
  });

  const topLim = new Tone.Limiter(-0.1);
  const midLim = new Tone.Limiter(-0.1);
  const botLim = new Tone.Limiter(-0.1);

  const chain = (n, vol, fx, comp, lim) => {
    if (fx.length) {
      n.chain(vol, ...fx, comp, lim, Tone.Destination);
    } else {
      n.chain(vol, comp, lim, Tone.Destination);
    }
  };
  chain(top, topVol, topFX, topComp, topLim);
  chain(mid, midVol, midFX, midComp, midLim);
  chain(bot, botVol, botFX, botComp, botLim);

  console.groupCollapsed("[TypeJam][engine] FX chains setup");

  const getSamplerForRow = (row) => {
    if (row === "top") {
      return {
        sampler: top,
        vol: topVol,
        fx: topFX,
        comp: topComp,
        lim: topLim,
      };
    } else if (row === "bot") {
      return {
        sampler: bot,
        vol: botVol,
        fx: botFX,
        comp: botComp,
        lim: botLim,
      };
    } else {
      return {
        sampler: mid,
        vol: midVol,
        fx: midFX,
        comp: midComp,
        lim: midLim,
      };
    }
  };

  const applyDynamicParams = (row, i, len, velocity) => {
    const pos = len > 1 ? i / (len - 1) : 0; // 0 left → 1 right
    const p = pos;

    let vel = lerp(0.8, 1.0, p);
    let cutoff = lerp(1000, 3200, p);
    let wet = lerp(0.05, 0.2, p);

    const isDrums = baseUrl.includes("/audio/drums/");
    if (isDrums) {
      if (row === "top") {
        cutoff = lerp(2500, 7000, p);
        wet = lerp(0.02, 0.15, p);
      } else if (row === "bot") {
        cutoff = lerp(400, 1200, p);
        wet = lerp(0.01, 0.08, p);
      }
    }

    const { sampler, vol, fx } = getSamplerForRow(row);

    let finalVelocity = velocity ?? vel;
    if (isDrums && row === "bot" && (i === 2 || i === 3)) {
      finalVelocity *= 1.85;
    }

    vol.volume.value = Tone.gainToDb(finalVelocity);
    if (fx.length >= 1) fx[0].frequency.value = cutoff; // Filter
    if (fx.length >= 2) fx[1].wet.value = wet; // Reverb

    return { sampler, velocity: finalVelocity };
  };

  return {
    ensureReady: async () => {
      await Promise.all([top.loaded, mid.loaded, bot.loaded]);
    },
    play: (note, dur = "8n", time, _vel = 0.9, row = "mid", i = 0, len = 1) => {
      if (!top.loaded || !mid.loaded || !bot.loaded) {
        return;
      }

      const nn = Tone.Frequency(note).transpose(transpose).toNote();

      const { sampler, velocity } = applyDynamicParams(row, i, len, _vel);

      sampler.triggerAttackRelease(nn, dur, time, velocity);
    },
    triggerAttack: (note, time, _vel = 0.9, row = "mid", i = 0, len = 1) => {
      if (!top.loaded || !mid.loaded || !bot.loaded) {
        return;
      }

      // Apply transpose
      const nn = Tone.Frequency(note).transpose(transpose).toNote();

      // Apply dynamic parameters and get sampler
      const { sampler, velocity } = applyDynamicParams(row, i, len, _vel);

      // Trigger attack only (sustains until release)
      sampler.triggerAttack(nn, time, velocity);
    },
    // Sustain mode: trigger release (stop the sustained note)
    triggerRelease: (note, time, row = "mid", i = 0, len = 1) => {
      if (!top.loaded || !mid.loaded || !bot.loaded) {
        return;
      }

      // Apply transpose
      const nn = Tone.Frequency(note).transpose(transpose).toNote();

      // Get sampler for row
      const { sampler } = getSamplerForRow(row);

      // Trigger release
      sampler.triggerRelease(nn, time);
    },
    dispose: () => {
      [top, mid, bot].forEach((s) => s.dispose());
      [topVol, midVol, botVol].forEach((v) => v.dispose());
      [...topFX, ...midFX, ...botFX].forEach((f) => f.dispose());
      [topComp, midComp, botComp].forEach((c) => c.dispose());
      [topLim, midLim, botLim].forEach((l) => l.dispose());
    },
  };
}

// Utility: linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}
