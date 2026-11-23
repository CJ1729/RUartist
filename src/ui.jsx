import { useEffect, useRef, useState } from 'react';
import * as audio from './audio';
import { initials } from './logic';

const PATHS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  pin: <><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  sliders: <><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 6l-6 6 6 6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  shield: <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  stage: <><path d="M3 20h18M5 20V9l7-5 7 5v11" /><path d="M9 20v-6h6v6" /></>,
  wave: <path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  mask: <><path d="M4 5c5 2 11 2 16 0v6a8 8 0 0 1-16 0z" /><path d="M8.5 10h.01M15.5 10h.01M9 14.5c1.8 1.3 4.2 1.3 6 0" /></>,
  scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12" /></>,
  camera: <><rect x="2" y="7" width="14" height="11" rx="2" /><path d="M16 11l6-3v9l-6-3z" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
};

export function Icon({ name, size = 22, stroke = 2, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[name]}
    </svg>
  );
}

export function Star({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

export function Avatar({ artist, size = 44 }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: artist.color || '#6B3FA0', fontSize: Math.round(size * 0.34) }}>
      {initials(artist.name)}
    </span>
  );
}

export function Pill({ active, onClick, children, disabled, size = 'md' }) {
  const base = size === 'sm' ? 'min-h-9 px-3 text-[13px]' : 'min-h-11 px-4 text-sm';
  return (
    <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick}
      className={`${base} shrink-0 rounded-full border font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'border-ink bg-ink text-white' : 'border-[#D9D3E0] bg-white text-ink hover:border-ink'}`}>
      {children}
    </button>
  );
}

export function TagBadge({ tag, count, highlight }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${
      highlight ? 'bg-accent-soft text-accent-dark' : 'bg-ok-soft text-ok'}`}>
      <Icon name="shield" size={13} stroke={2.4} />
      {tag} <Star size={11} /> {count}
    </span>
  );
}

export function Modal({ title, onClose, children, footer, labelId = 'modal-title' }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    dialogRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev && prev.focus && prev.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#140a22]/60 md:items-center md:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelId}
        className="outline-none sheet-in safe-bottom flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-w-2xl md:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface">
            <Icon name="close" />
          </button>
          <h2 id={labelId} className="truncate text-base font-extrabold">{title}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line bg-white px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+76px)] z-[60] flex justify-center px-4">
      <div className="sheet-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl">
        <Icon name="check" size={20} stroke={2.6} className="shrink-0 text-[#8FE0B5]" />
        <span className="flex-1">{toast.text}</span>
        {toast.action && (
          <button type="button" onClick={() => { toast.action.run(); onClose(); }}
            className="min-h-11 rounded-xl px-3 font-extrabold text-[#FFB4A6] hover:bg-plum-2">{toast.action.label}</button>
        )}
      </div>
    </div>
  );
}

/* ---------- Audio: waveform + mini player ---------- */
function Waveform({ track, playing }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const g = canvas.getContext('2d');
    const r = audio.rng(audio.hashString(track.id));
    const statics = Array.from({ length: 40 }, () => 0.25 + r() * 0.75);
    let raf = 0;
    let data = null;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const n = Math.max(12, Math.min(40, Math.floor(w / 6)));
      const gap = 2;
      const bw = (w - gap * (n - 1)) / n;
      const an = playing ? audio.getAnalyser() : null;
      if (an) { data = data || new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(data); }
      for (let i = 0; i < n; i++) {
        let v = statics[i % statics.length];
        if (an) {
          const bin = Math.floor((i / n) * data.length * 0.7);
          v = Math.max(0.12, data[bin] / 255) * (0.6 + 0.4 * statics[i]);
        }
        const bh = Math.max(3, v * h);
        g.fillStyle = playing ? '#C93C27' : '#B9B0C6';
        g.beginPath();
        if (g.roundRect) g.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, Math.min(2, bw / 2));
        else g.rect(i * (bw + gap), (h - bh) / 2, bw, bh);
        g.fill();
      }
      if (playing) raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(() => { if (!playing) draw(); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [track.id, playing]);
  return <canvas ref={ref} className="block h-7 w-full" aria-hidden="true" />;
}

export function usePlaying(id) {
  const [playing, setPlaying] = useState(audio.playingId() === id);
  useEffect(() => {
    setPlaying(audio.playingId() === id);
    return audio.subscribe((pid) => setPlaying(pid === id));
  }, [id]);
  return playing;
}

export function MiniPlayer({ track, matched = [], label }) {
  const playing = usePlaying(track.id);
  const isMatch = matched.length > 0;
  return (
    <div className={`flex items-center gap-3 rounded-2xl p-2.5 pr-3 ${isMatch ? 'bg-accent-soft' : 'bg-surface'}`}>
      <button type="button" aria-label={`${playing ? 'Pause' : 'Play'} ${track.title}`}
        onClick={(e) => { e.stopPropagation(); audio.toggle(track); }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white hover:bg-plum-2">
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-extrabold">{track.title}</span>
          {label && <span className="shrink-0 text-[11px] font-extrabold text-accent-dark">{label}</span>}
        </div>
        <Waveform track={track} playing={playing} />
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {track.tags.map((t) => (
            <span key={t} className={`text-xs font-bold ${matched.includes(t) ? 'text-accent-dark' : 'text-muted'}`}>#{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
