import { useEffect, useRef } from 'react';
import * as audio from './audio';
import { usePlaying, MiniPlayer } from './ui';

/* Film sample previews.
   Each sample plays a short generated "reel": shots drawn on a canvas in the sample's
   look, camera movement, cutting pace and aspect ratio, with a generated score.
   Nothing is fetched, so it always plays. Real video needs the hosted version. */

const LOOKS = {
  'Natural light': { sky: ['#8EC1E8', '#E9F1F4'], ground: ['#6E8B4E', '#3F5530'], sun: '#FFF3C9', fig: '#262B22', light: 'rgba(255,248,225,0.35)', vignette: 0.25 },
  'Low-key/Noir': { sky: ['#05060B', '#1B2233'], ground: ['#0B0E16', '#040509'], sun: '#A9C0E8', fig: '#010102', light: 'rgba(160,190,240,0.45)', vignette: 0.75 },
  'High-key': { sky: ['#FFFFFF', '#E3EEF5'], ground: ['#DCE7EE', '#C3D2DC'], sun: '#FFFFFF', fig: '#5A6672', light: 'rgba(255,255,255,0.5)', vignette: 0.06 },
  'Teal & Orange': { sky: ['#0E4B5A', '#F0803C'], ground: ['#0A3640', '#05222A'], sun: '#FFC27A', fig: '#071A20', light: 'rgba(255,170,90,0.4)', vignette: 0.45 },
  'Warm/Golden': { sky: ['#F29E4C', '#F9D98E'], ground: ['#8C5A2B', '#5A3818'], sun: '#FFF1C1', fig: '#3A2311', light: 'rgba(255,215,140,0.45)', vignette: 0.3 },
  Monochrome: { sky: ['#262626', '#BFBFBF'], ground: ['#3A3A3A', '#121212'], sun: '#F2F2F2', fig: '#080808', light: 'rgba(255,255,255,0.3)', vignette: 0.55 },
};
const LOOK_NAMES = Object.keys(LOOKS);

const has = (tags, list) => tags.some((t) => list.includes(t));

function pickLook(tags, seed) {
  const direct = tags.find((t) => LOOKS[t]);
  if (direct) return LOOKS[direct];
  if (has(tags, ['Intense', 'Villain', 'Method', 'Trailer/Promo'])) return LOOKS['Low-key/Noir'];
  if (has(tags, ['Comedy', 'Comic timing', 'Wedding film', 'Social reels'])) return LOOKS['High-key'];
  if (has(tags, ['Dramatic', 'Parent/Elder'])) return LOOKS['Warm/Golden'];
  if (has(tags, ['Rural/Folk', 'Documentary', 'Naturalistic'])) return LOOKS['Natural light'];
  if (has(tags, ['Fast-cut', 'Music video', 'Ad/Commercial', 'Rhythm/Music-driven'])) return LOOKS['Teal & Orange'];
  if (has(tags, ['Slow-burn'])) return LOOKS.Monochrome;
  return LOOKS[LOOK_NAMES[seed % LOOK_NAMES.length]];
}

function shotLength(tags, role) {
  if (tags.includes('Fast-cut')) return 0.7;
  if (tags.includes('Trailer/Promo')) return 0.9;
  if (tags.includes('Rhythm/Music-driven')) return 1.0;
  if (tags.includes('Slow-burn')) return 3.2;
  if (tags.includes('Narrative')) return 2.2;
  return role === 'Character Artist' ? 3.4 : role === 'Editor' ? 1.8 : 2.8;
}

// Music mood for the generated score, reusing the audio engine's tag vocabulary.
export function scoreTags(sample) {
  const t = sample.tags;
  const out = [];
  if (has(t, ['Fast-cut', 'Rhythm/Music-driven', 'Trailer/Promo', 'Action/Stunts', 'Music video', 'Social reels', 'Ad/Commercial'])) out.push('Energetic');
  if (has(t, ['Low-key/Noir', 'Intense', 'Villain', 'Method', 'Slow-burn', 'Monochrome', 'Dramatic'])) out.push('Soulful/High-Feel', 'Deep');
  if (has(t, ['Comedy', 'Comic timing', 'High-key', 'Wedding film', 'Lead'])) out.push('Smooth');
  if (has(t, ['Natural light', 'Documentary', 'Rural/Folk', 'Warm/Golden', 'Naturalistic'])) out.push('Raw/Folk', 'Airy');
  return out;
}

/* ---------- Drawing ---------- */
function figure(g, cx, baseY, hh, color, rim, side) {
  const headR = hh * 0.17;
  const headY = baseY - hh * 0.72;
  g.fillStyle = color;
  g.beginPath();
  g.arc(cx, headY, headR, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(cx - hh * 0.42, baseY);
  g.quadraticCurveTo(cx - hh * 0.4, headY + headR * 1.5, cx, headY + headR * 1.35);
  g.quadraticCurveTo(cx + hh * 0.4, headY + headR * 1.5, cx + hh * 0.42, baseY);
  g.closePath();
  g.fill();
  if (rim) {
    g.strokeStyle = rim;
    g.lineWidth = Math.max(1.5, hh * 0.018);
    g.beginPath();
    g.arc(cx, headY, headR, side > 0 ? -1.2 : Math.PI + 0.1, side > 0 ? 0.1 : Math.PI + 1.3);
    g.stroke();
  }
}

function scene(g, w, h, look, kind, r) {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, look.sky[0]);
  sky.addColorStop(1, look.sky[1]);
  g.fillStyle = sky;
  g.fillRect(-w, -h, w * 3, h * 3);

  const sx = w * (0.2 + r() * 0.6);
  const sy = h * (0.2 + r() * 0.2);
  const glow = g.createRadialGradient(sx, sy, 0, sx, sy, h * 0.5);
  glow.addColorStop(0, look.light);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow;
  g.fillRect(-w, -h, w * 3, h * 3);

  if (kind === 'landscape' || kind === 'wide') {
    g.fillStyle = look.sun;
    g.globalAlpha = 0.9;
    g.beginPath(); g.arc(sx, sy, h * 0.08, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    for (let layer = 0; layer < 2; layer++) {
      const base = h * (0.6 + layer * 0.12);
      const amp = h * (0.06 + r() * 0.06);
      const fq = 1.5 + r() * 2.5;
      const ph = r() * 6;
      g.fillStyle = look.ground[layer];
      g.beginPath();
      g.moveTo(-w, h * 2);
      for (let x = -w; x <= w * 2; x += 12) g.lineTo(x, base - Math.sin((x / w) * fq + ph) * amp);
      g.lineTo(w * 2, h * 2);
      g.closePath();
      g.fill();
    }
    if (kind === 'wide') figure(g, w * (0.3 + r() * 0.4), h * 0.84, h * 0.3, look.fig, look.light, 1);
  } else if (kind === 'city') {
    g.fillStyle = look.ground[1];
    g.fillRect(-w, h * 0.78, w * 3, h * 2);
    let x = -w * 0.2;
    while (x < w * 1.2) {
      const bw = w * (0.06 + r() * 0.08);
      const bh = h * (0.25 + r() * 0.4);
      g.fillStyle = look.fig;
      g.fillRect(x, h * 0.78 - bh, bw, bh);
      g.fillStyle = look.sun;
      for (let wy = h * 0.78 - bh + 6; wy < h * 0.76; wy += 9) {
        for (let wx = x + 4; wx < x + bw - 4; wx += 7) if (r() > 0.6) { g.globalAlpha = 0.55; g.fillRect(wx, wy, 3, 4); }
      }
      g.globalAlpha = 1;
      x += bw + w * 0.01;
    }
  } else {
    // Close-up or two-shot
    g.fillStyle = look.ground[0];
    g.fillRect(-w, h * 0.82, w * 3, h * 2);
    const spot = g.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, h * 0.7);
    spot.addColorStop(0, look.light);
    spot.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = spot;
    g.fillRect(-w, -h, w * 3, h * 3);
    if (kind === 'two') {
      figure(g, w * 0.33, h * 1.02, h * 0.75, look.fig, look.light, 1);
      figure(g, w * 0.69, h * 1.04, h * 0.7, look.fig, look.light, -1);
    } else {
      figure(g, w * (0.38 + r() * 0.24), h * 1.08, h * 1.05, look.fig, look.light, r() > 0.5 ? 1 : -1);
    }
  }
}

function drawReel(canvas, sample, role, t, playing) {
  const g = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const tags = sample.tags;
  const seed = audio.hashString(sample.id);
  const look = pickLook(tags, seed);
  const len = shotLength(tags, role);
  const shot = Math.floor(t / len);
  const local = t - shot * len;
  const p = local / len;
  const r = audio.rng(seed + shot * 7919);

  const kinds = role === 'Character Artist'
    ? ['close', 'close', 'two', 'close', 'wide']
    : ['landscape', 'city', 'close', 'two', 'wide', 'landscape'];
  const kind = kinds[(seed + shot) % kinds.length];

  // Camera movement
  let dx = 0; let dy = 0; let s = 1.02 + p * 0.06;
  if (tags.includes('Handheld')) { dx = Math.sin(t * 7.1) * 2.5 + Math.sin(t * 13.3) * 1.2; dy = Math.cos(t * 6.3) * 2 + Math.sin(t * 11.7); s = 1.06; }
  else if (tags.includes('Gimbal/Steadicam')) { dx = (p - 0.5) * w * 0.08; s = 1.08; }
  else if (tags.includes('Static/Tripod')) { s = 1.0; }
  else if (tags.includes('Aerial/Drone')) { s = 1.25 - p * 0.2; dy = -p * h * 0.05; }

  g.save();
  g.clearRect(0, 0, w, h);
  g.translate(w / 2 + dx, h / 2 + dy);
  g.scale(s, s);
  g.translate(-w / 2, -h / 2);
  scene(g, w, h, look, kind, r);
  g.restore();

  // Vignette
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, `rgba(0,0,0,${look.vignette})`);
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);

  // Grain while playing
  if (playing) {
    g.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 70; i++) g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }

  // Cut transition
  const fade = tags.includes('Slow-burn') ? 0.45 : 0.1;
  if (playing && local < fade) {
    g.fillStyle = `rgba(0,0,0,${1 - local / fade})`;
    g.fillRect(0, 0, w, h);
  }

  // Aspect ratio frame
  g.fillStyle = '#000';
  if (tags.includes('Social reels')) {
    const fw = h * (9 / 16);
    g.fillRect(0, 0, (w - fw) / 2, h);
    g.fillRect((w + fw) / 2, 0, (w - fw) / 2, h);
  } else if (has(tags, ['Feature film', 'Trailer/Promo', 'Short film'])) {
    const bar = (h - w / 2.39) / 2;
    if (bar > 0) { g.fillRect(0, 0, w, bar); g.fillRect(0, h - bar, w, bar); }
  }

  // Role overlays
  g.font = '600 12px Manrope, system-ui, sans-serif';
  if (role === 'Editor') {
    const y = h - 16;
    const px = 46 / len; // pixels per second on the timeline
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(0, y - 4, w, 20);
    const startShot = shot - 3;
    for (let i = startShot; i < startShot + 12; i++) {
      const x0 = w / 2 + (i * len - t) * px;
      const cr = audio.rng(seed + i * 7919);
      g.fillStyle = LOOKS[LOOK_NAMES[Math.floor(cr() * LOOK_NAMES.length)]].sky[1];
      g.globalAlpha = 0.85;
      g.fillRect(x0 + 1, y, len * px - 2, 12);
      g.globalAlpha = 1;
    }
    g.fillStyle = '#FF5A3C';
    g.fillRect(w / 2 - 1, y - 6, 2, 22);
  } else if (role === 'Character Artist') {
    const lang = tags.find((x) => ['Telugu', 'Hindi', 'English', 'Tamil', 'Kannada'].includes(x));
    const text = `${sample.title}${lang ? ` · ${lang}` : ''}`;
    g.textAlign = 'center';
    g.fillStyle = 'rgba(0,0,0,0.6)';
    const tw = g.measureText(text).width + 16;
    g.fillRect(w / 2 - tw / 2, h - 30, tw, 20);
    g.fillStyle = '#FFFFFF';
    g.fillText(text, w / 2, h - 16);
    g.textAlign = 'start';
  }
  if (!playing) {
    g.fillStyle = 'rgba(20,10,34,0.28)';
    g.fillRect(0, 0, w, h);
  }
}

export function ReelPlayer({ sample, role, matched = [], label }) {
  const playing = usePlaying(sample.id);
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let raf = 0;
    const start = performance.now();
    const frame = () => {
      drawReel(canvas, sample, role, (performance.now() - start) / 1000, true);
      raf = requestAnimationFrame(frame);
    };
    const still = () => drawReel(canvas, sample, role, 0.9, false);
    if (playing) frame(); else still();
    const ro = new ResizeObserver(() => { if (!playing) still(); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [sample, role, playing]);

  const toggle = (e) => {
    e.stopPropagation();
    audio.toggle({ id: sample.id, title: sample.title, tags: scoreTags(sample) });
  };

  return (
    <div className={`rounded-2xl p-2.5 ${matched.length ? 'bg-accent-soft' : 'bg-surface'}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <button type="button" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} ${sample.title}`}
          className="group absolute inset-0 flex items-center justify-center">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-ink shadow-lg transition-opacity ${playing ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100' : ''}`}>
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
            )}
          </span>
        </button>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2 px-0.5">
        <span className="truncate text-sm font-extrabold">{sample.title}</span>
        {label && <span className="shrink-0 text-[11px] font-extrabold text-accent-dark">{label}</span>}
      </div>
      <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 px-0.5">
        {sample.tags.map((t) => (
          <span key={t} className={`text-xs font-bold ${matched.includes(t) ? 'text-accent-dark' : 'text-muted'}`}>#{t}</span>
        ))}
      </div>
      {sample.link && (
        <a href={sample.link} target="_blank" rel="noopener noreferrer"
          className="mt-1.5 inline-flex min-h-9 items-center px-0.5 text-sm font-extrabold text-accent hover:text-accent-dark">
          Watch the full clip ↗
        </a>
      )}
    </div>
  );
}

// Shared entry point so cards and profiles can show either kind of sample.
export function SamplePlayer({ artist, sample, matched = [], label }) {
  if (artist.category === 'film') return <ReelPlayer sample={sample} role={artist.role} matched={matched} label={label} />;
  return <MiniPlayer track={sample} matched={matched} label={label} />;
}
