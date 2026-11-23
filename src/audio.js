// Web Audio preview engine.
// Every track gets its own short, pleasant loop generated from its id and tags,
// so playback never depends on external audio files.

let ctx = null;
let master = null;
let analyser = null;
let current = null; // { id, out, timer, stopTimer }
const listeners = new Set();

export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => fn(current ? current.id : null));
export const playingId = () => (current ? current.id : null);
export const getAnalyser = () => analyser;

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    const comp = ctx.createDynamicsCompressor();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    master.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return true;
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};
const PROGRESSIONS = [[0, 5, 3, 4], [0, 3, 4, 4], [5, 3, 0, 4], [0, 4, 5, 3], [0, 2, 3, 4]];
const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function recipe(track) {
  const tags = track.tags || [];
  const has = (t) => tags.includes(t);
  const r = rng(hashString(track.id + track.title));
  const scale = has('Soulful/High-Feel') ? SCALES.minor : has('Raw/Folk') ? SCALES.dorian : SCALES.major;
  const root = 55 + [0, 2, 3, 5, 7][Math.floor(r() * 5)]; // around G3–D4
  const bpm = has('Energetic') ? 118 : has('Romantic') ? 76 : has('Soulful/High-Feel') ? 84 : has('Raw/Folk') ? 100 : 92;
  let lead = { type: 'triangle', filter: 2600, attack: 0.02, release: 0.25, octave: 12, gain: 0.16, detune: 0 };
  if (has('Smooth')) lead = { type: 'sine', filter: 0, attack: 0.04, release: 0.35, octave: 12, gain: 0.2, detune: 0 };
  if (has('Husky')) lead = { type: 'triangle', filter: 1500, attack: 0.03, release: 0.3, octave: 12, gain: 0.18, detune: 9 };
  if (has('Raspy')) lead = { type: 'sawtooth', filter: 1700, attack: 0.01, release: 0.18, octave: 12, gain: 0.09, detune: 6 };
  if (has('Airy')) lead = { type: 'sine', filter: 0, attack: 0.09, release: 0.5, octave: 24, gain: 0.15, detune: 4 };
  if (has('Deep')) lead = { ...lead, octave: 0, gain: lead.gain * 1.15 };
  return {
    r, scale, root, bpm, lead,
    progression: PROGRESSIONS[Math.floor(r() * PROGRESSIONS.length)],
    drums: has('Energetic'),
    pluck: has('Raw/Folk'),
  };
}

function voice(dest, t, midi, dur, o) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(o.gain, t + o.attack);
  g.gain.setTargetAtTime(0.0001, t + dur, o.release / 3);
  let out = g;
  if (o.filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = o.filter;
    f.connect(g);
    out = f;
  }
  const oscs = o.detune ? [-o.detune, o.detune] : [0];
  for (const d of oscs) {
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.value = freq(midi);
    osc.detune.value = d;
    osc.connect(out);
    osc.start(t);
    osc.stop(t + dur + o.release + 0.2);
  }
  g.connect(dest);
}

function drum(dest, t, kind) {
  if (kind === 'kick') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.2);
  } else {
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 6000;
    const g = ctx.createGain(); g.gain.value = 0.12;
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t);
  }
}

// Schedules one 4-bar loop starting at time t0 and returns its length in seconds.
function scheduleLoop(rc, dest, t0) {
  const beat = 60 / rc.bpm;
  const bar = beat * 4;
  const deg = (i) => rc.scale[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
  let melodyIdx = 4 + Math.floor(rc.r() * 3);

  rc.progression.forEach((d, b) => {
    const tb = t0 + b * bar;
    // Pad chord
    for (const k of [0, 2, 4]) voice(dest, tb, rc.root + deg(d + k), bar * 0.95, { type: 'sine', gain: 0.05, attack: 0.25, release: 0.6, filter: 0, detune: 0 });
    // Bass
    voice(dest, tb, rc.root - 12 + deg(d), beat * 1.8, { type: 'triangle', gain: 0.16, attack: 0.01, release: 0.2, filter: 900, detune: 0 });
    voice(dest, tb + beat * 2, rc.root - 12 + deg(d + 4), beat * 1.6, { type: 'triangle', gain: 0.12, attack: 0.01, release: 0.2, filter: 900, detune: 0 });
    // Folk pluck arpeggio
    if (rc.pluck) {
      [0, 2, 4, 2].forEach((k, i) => voice(dest, tb + i * beat, rc.root + deg(d + k), beat * 0.4, { type: 'triangle', gain: 0.07, attack: 0.005, release: 0.15, filter: 3000, detune: 0 }));
    }
    // Drums
    if (rc.drums) {
      for (let i = 0; i < 4; i++) drum(dest, tb + i * beat, 'kick');
      for (let i = 0; i < 8; i++) if (i % 2) drum(dest, tb + i * (beat / 2), 'hat');
    }
    // Lead melody: eighth notes walking around the chord
    let step = 0;
    while (step < 8) {
      const len = rc.r() < 0.3 ? 2 : 1;
      if (rc.r() > 0.2 || step === 0) {
        const move = Math.floor(rc.r() * 5) - 2;
        melodyIdx = Math.max(d, Math.min(d + 9, melodyIdx + move));
        if (step === 0) melodyIdx = d + [0, 2, 4][Math.floor(rc.r() * 3)];
        voice(dest, tb + step * (beat / 2), rc.root + rc.lead.octave + deg(melodyIdx), (beat / 2) * len * 0.9, rc.lead);
      }
      step += len;
    }
  });
  return bar * rc.progression.length;
}

export function stop() {
  if (!current) return;
  const c = current;
  current = null;
  clearTimeout(c.timer);
  clearTimeout(c.stopTimer);
  try {
    c.out.gain.cancelScheduledValues(ctx.currentTime);
    c.out.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    setTimeout(() => { try { c.out.disconnect(); } catch { /* already gone */ } }, 400);
  } catch { /* ignore */ }
  emit();
}

const MAX_PREVIEW_SECONDS = 30;

export function play(track) {
  if (!ensureContext()) return;
  stop();
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(master);
  const rc = recipe(track);
  const entry = { id: track.id, out, timer: null, stopTimer: null };
  current = entry;
  let next = ctx.currentTime + 0.06;
  const loop = () => {
    if (current !== entry) return;
    const len = scheduleLoop(rc, out, next);
    next += len;
    entry.timer = setTimeout(loop, Math.max(50, (next - ctx.currentTime - 0.5) * 1000));
  };
  loop();
  entry.stopTimer = setTimeout(() => { if (current === entry) stop(); }, MAX_PREVIEW_SECONDS * 1000);
  emit();
}

export function toggle(track) {
  if (current && current.id === track.id) stop();
  else play(track);
}
